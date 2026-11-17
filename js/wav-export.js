// Seamless-loop WAV export (Req 4.3, project-rules.md section 2).
//
// Render two loops (64 steps) offline, then keep only the SECOND loop (the last 32 steps).
// By then the delay reverb of loop 1 has built up, so the start of the kept loop already contains
// the tail of the notes at the end of loop 1. Played back to back, the end of the file flows into
// the start with no cut and no silent gap.
//
// The render runs at 44100 Hz on purpose: 32 steps at 112 BPM are exactly 189000 samples there.

import { scheduleStep } from './engine.js';
import { createMasterBus } from './master-bus.js';
import { STEPS_PER_LOOP, stepDuration } from './music.js';

export const EXPORT_SAMPLE_RATE = 44100;

export const loopSampleCount = (sampleRate = EXPORT_SAMPLE_RATE) =>
  Math.round(STEPS_PER_LOOP * stepDuration() * sampleRate);

/**
 * Render `loops` consecutive loops of the current arrangement (Mute / Solo included, like what
 * the audience hears). Returns the whole rendered AudioBuffer and the length of one loop.
 */
export async function renderLoops(tracks, { loops = 2, sampleRate = EXPORT_SAMPLE_RATE } = {}) {
  const loopSamples = loopSampleCount(sampleRate);
  const ctx = new OfflineAudioContext(2, loopSamples * loops, sampleRate);
  const bus = createMasterBus(ctx);
  const stepDur = stepDuration();
  const state = {}; // portamento memory carries across the loop boundary, as it does live
  // Many step times land exactly on a sample boundary (a step is 5906.25 samples at 44100 Hz).
  // Floating-point noise could then round the same step to different samples in different loops.
  // A quarter-sample offset (about 6 microseconds) keeps every loop on the same sample grid.
  const GRID_NUDGE = 0.25 / sampleRate;

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
  const wav = encodeWav(lastLoop(buffer, loopSamples), EXPORT_SAMPLE_RATE);
  return new Blob([wav], { type: 'audio/wav' });
}
