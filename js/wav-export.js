// Seamless-loop WAV export (Req 4.3, project-rules.md section 2).
//
// Render two loops (64 steps) offline, then keep only the SECOND loop (the last 32 steps).
// By then the delay reverb of loop 1 has built up, so the start of the kept loop already contains
// the tail of the notes at the end of loop 1. Played back to back, the end of the file flows into
// the start with no cut and no silent gap.
//
// Why the render rate is 44800 Hz and the file rate is 44100 Hz:
// The browser renders audio in blocks of 128 frames, and a note renders in slightly different detail
// (pitch glides step per block, so phases drift) depending on where it falls inside a block. One loop
// at 44100 Hz is 189000 frames, which is not a multiple of 128, so loop 2 and loop 3 of a rendering
// were never the same (differences up to 0.4 of full scale), and the tails that cross the seam did
// not match. One loop at 44800 Hz is exactly 192000 frames = 1500 blocks, so every loop renders the
// same way and the loop is periodic (a few thousandths of full scale at most; the rest is
// compressor memory). The kept loop is then converted to the usual 44100 Hz with a band-limited
// resampler that treats the loop as circular, so the converted file still loops without a seam.
// 192000 frames at 44800 Hz are exactly 189000 frames at 44100 Hz: 32 steps at 112 BPM.

import { scheduleStep } from './engine.js';
import { createMasterBus } from './master-bus.js';
import { STEPS_PER_LOOP, stepDuration } from './music.js';

export const EXPORT_SAMPLE_RATE = 44100;   // the rate of the downloaded file
export const RENDER_SAMPLE_RATE = 44800;   // the rate the loops are rendered at (see above)

export const loopSampleCount = (sampleRate = RENDER_SAMPLE_RATE) =>
  Math.round(STEPS_PER_LOOP * stepDuration() * sampleRate);

/**
 * Render `loops` consecutive loops of the current arrangement (Mute / Solo included, like what
 * the audience hears). Returns the whole rendered AudioBuffer and the length of one loop.
 */
export async function renderLoops(tracks, { loops = 2, sampleRate = RENDER_SAMPLE_RATE } = {}) {
  const loopSamples = loopSampleCount(sampleRate);
  const ctx = new OfflineAudioContext(2, loopSamples * loops, sampleRate);
  const bus = createMasterBus(ctx);
  const stepDur = stepDuration();
  const state = {}; // portamento memory carries across the loop boundary, as it does live
  // Keep every step off the exact boundary between two sample frames. Float noise could otherwise
  // round the same step to different frames in different loops. A fraction of a frame that no
  // musical time (step, swing, attack, decay) ever lands on keeps all loops on the same grid.
  const GRID_NUDGE = 0.0731 / sampleRate;

  for (let i = 0; i < STEPS_PER_LOOP * loops; i++) {
    scheduleStep({
      ctx,
      out: bus.input,
      trims: bus.trims,
      tracks,
      stepIndex: i,
      baseStepTime: i * stepDur + GRID_NUDGE,
      stepDur,
      register() {},
      emit() {},
      state,
    });
  }
  const buffer = await ctx.startRendering();
  return { buffer, loopSamples };
}

/** The last loop of a rendering, as [left, right] Float32Arrays of exactly `loopSamples` samples. */
export function lastLoop(buffer, loopSamples) {
  const start = buffer.length - loopSamples;
  return [0, 1].map((ch) => buffer.getChannelData(ch).slice(start, start + loopSamples));
}

// ---------------------------------------------------------------- sample-rate conversion

const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));

/** Modified Bessel function I0 (for the Kaiser window). */
function besselI0(x) {
  let sum = 1, term = 1;
  for (let k = 1; k < 40; k++) { term *= (x / (2 * k)) ** 2; sum += term; if (term < 1e-12 * sum) break; }
  return sum;
}

/**
 * Convert one loop to another sample rate with a Kaiser-windowed sinc. The loop is treated as
 * circular (indices wrap), so the end of the result flows into its start exactly as the original
 * loop did. The rates must give a whole number of output frames.
 */
export function resampleLoop(input, fromRate, toRate, { halfTaps = 24, cutoff = 0.96, beta = 8 } = {}) {
  const n = input.length;
  const g = gcd(fromRate, toRate);
  const num = fromRate / g;                  // input frames per `den` output frames
  const den = toRate / g;
  const outLen = (n * den) / num;
  if (!Number.isInteger(outLen)) throw new Error('The loop length does not convert to a whole number of frames');
  const ratio = toRate / fromRate;
  const fc = Math.min(1, ratio) * cutoff;    // low-pass cutoff relative to the input Nyquist
  const i0Beta = besselI0(beta);

  // One filter per phase of the output position (the pattern repeats every `den` output frames)
  const filters = Array.from({ length: den }, (_, phase) => {
    const frac = ((phase * num) % den) / den;          // position between two input frames
    const taps = new Float64Array(2 * halfTaps);
    let sum = 0;
    for (let k = 0; k < 2 * halfTaps; k++) {
      const t = k - halfTaps + 1 - frac;               // distance from the output position, in input frames
      const x = Math.PI * fc * t;
      const sinc = Math.abs(t) < 1e-9 ? fc : Math.sin(x) / (Math.PI * t);
      const r = t / halfTaps;
      const win = Math.abs(r) >= 1 ? 0 : besselI0(beta * Math.sqrt(1 - r * r)) / i0Beta;
      taps[k] = sinc * win;
      sum += taps[k];
    }
    for (let k = 0; k < taps.length; k++) taps[k] /= sum;   // unity gain at DC
    return taps;
  });

  const out = new Float32Array(outLen);
  for (let j = 0; j < outLen; j++) {
    const phase = j % den;
    const base = Math.floor((j * num) / den);
    const taps = filters[phase];
    let acc = 0;
    for (let k = 0; k < taps.length; k++) {
      let idx = (base + k - halfTaps + 1) % n;
      if (idx < 0) idx += n;
      acc += taps[k] * input[idx];
    }
    out[j] = acc;
  }
  return out;
}

/** 16-bit PCM stereo WAV with a 44-byte RIFF header. */
export function encodeWav(channels, sampleRate) {
  const frames = channels[0].length;
  const numChannels = channels.length;
  const dataSize = frames * numChannels * 2;
  const view = new DataView(new ArrayBuffer(44 + dataSize));
  const text = (offset, str) => { for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i)); };

  text(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  text(8, 'WAVE');
  text(12, 'fmt ');
  view.setUint32(16, 16, true);                       // fmt chunk size
  view.setUint16(20, 1, true);                        // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true); // byte rate
  view.setUint16(32, numChannels * 2, true);          // block align
  view.setUint16(34, 16, true);                       // bits per sample
  text(36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < frames; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const v = Math.max(-1, Math.min(1, channels[ch][i]));
      view.setInt16(offset, v < 0 ? v * 0x8000 : v * 0x7fff, true);
      offset += 2;
    }
  }
  return view.buffer;
}

/** Render, cut the second loop, and return it as a WAV Blob. */
export async function exportLoopWav(tracks) {
  const { buffer, loopSamples } = await renderLoops(tracks, { loops: 2 });
  const loop = lastLoop(buffer, loopSamples).map((ch) => resampleLoop(ch, RENDER_SAMPLE_RATE, EXPORT_SAMPLE_RATE));
  const wav = encodeWav(loop, EXPORT_SAMPLE_RATE);
  return new Blob([wav], { type: 'audio/wav' });
}
