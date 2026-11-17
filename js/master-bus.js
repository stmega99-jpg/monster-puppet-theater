// Master bus shared by the realtime engine and (later) the offline WAV render.
//   voices -> input -+-> compressor -> destination
//                    +-> wet gain -> stereo delay (L/R, self-feedback) -> compressor
//
// StereoDelay: time = (60 / bpm) * 0.75, feedback 0.22, wet 0.18 (design.md section 5).
// The right line is 12 ms longer than the left line to widen the image.

import { BPM } from './music.js';

export function createMasterBus(ctx, destination = ctx.destination, bpm = BPM) {
  const input = ctx.createGain();
  input.gain.value = 0.9;

  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -14;
  compressor.knee.value = 18;
  compressor.ratio.value = 3;
  compressor.attack.value = 0.005;
  compressor.release.value = 0.2;

  const time = (60 / bpm) * 0.75;
  const feedback = 0.22;
  const wet = 0.18;

  const wetGain = ctx.createGain();
  wetGain.gain.value = wet;

  const merger = ctx.createChannelMerger(2);
  const lines = [time, time + 0.012].map((t, ch) => {
    const delay = ctx.createDelay(1);
    delay.delayTime.value = t;
    const fb = ctx.createGain();
    fb.gain.value = feedback;
    wetGain.connect(delay);
    delay.connect(fb);
    fb.connect(delay);
    delay.connect(merger, 0, ch);
    return { delay, fb };
  });

  input.connect(compressor);
  input.connect(wetGain);
  merger.connect(compressor);
  compressor.connect(destination);

  const nodes = [input, compressor, wetGain, merger, ...lines.flatMap((l) => [l.delay, l.fb])];

  return {
    input,
    output: compressor,
    /** Disconnect everything, which also flushes the delay lines (no echo survives a Stop). */
    dispose() {
      nodes.forEach((n) => { try { n.disconnect(); } catch { /* already disconnected */ } });
    },
  };
}
