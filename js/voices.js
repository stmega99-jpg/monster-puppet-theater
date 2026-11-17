// Web Audio voices for the four tracks. Every sound is synthesized; no audio files are loaded.
//
// Task 2 provides one default voice per track (Slot A / Slot C option 0), so the
// engine is audible end to end. The remaining timbre options from design.md
// section 2 are added together with each puppet in Tasks 3, 5, 6 and 7.
//
// A voice function schedules its nodes and returns { nodes, sources }:
//   nodes   - every node it created (the engine disconnects them on stop / when finished)
//   sources - the scheduled source nodes (the engine calls .stop() on them when stopping)

const FLOOR = 0.0001;

/** Percussive envelope: quick attack, exponential decay. Returns the time the voice ends. */
function percussive(gainParam, when, peak, attack, decay) {
  gainParam.setValueAtTime(FLOOR, when);
  gainParam.linearRampToValueAtTime(peak, when + attack);
  gainParam.exponentialRampToValueAtTime(FLOOR, when + attack + decay);
  return when + attack + decay;
}

const noiseBuffers = new WeakMap();
function noiseBuffer(ctx) {
  let buf = noiseBuffers.get(ctx);
  if (!buf) {
    buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 0.3), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noiseBuffers.set(ctx, buf);
  }
  return buf;
}

// ---- 🎃 Pumpkin: lead synth (Crescent Eyes + Jagged Grin) ---------------------
// triangle + sub sine, LPF 1400 Hz, staccato decay 0.16 s, gain 0.26.
export function pumpkinVoice(ctx, out, when, freq) {
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.value = freq;
  const sub = ctx.createOscillator();
  sub.type = 'sine';
  sub.frequency.value = freq / 2;
  const subGain = ctx.createGain();
  subGain.gain.value = 0.5;
  const lpf = ctx.createBiquadFilter();
  lpf.type = 'lowpass';
  lpf.frequency.value = 1400;
  const amp = ctx.createGain();

  osc.connect(lpf);
  sub.connect(subGain).connect(lpf);
  lpf.connect(amp).connect(out);

  const end = percussive(amp.gain, when, 0.26, 0.005, 0.16);
  osc.start(when); sub.start(when);
  osc.stop(end + 0.03); sub.stop(end + 0.03);
  return { nodes: [osc, sub, subGain, lpf, amp], sources: [osc, sub] };
}

// ---- 💀 Skeleton: drums and bone marimba (Bent Top Hat + Femur Mallet) ----------
// Wood Kick 110 -> 45 Hz (0.30), Brush Snare (0.16), Warm Marimba sine + 4th harmonic (0.18).
export function skeletonKick(ctx, out, when) {
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(110, when);
  osc.frequency.exponentialRampToValueAtTime(45, when + 0.12);
  const amp = ctx.createGain();
  osc.connect(amp).connect(out);
  const end = percussive(amp.gain, when, 0.30, 0.003, 0.22);
  osc.start(when);
  osc.stop(end + 0.03);
  return { nodes: [osc, amp], sources: [osc] };
}

export function skeletonSnare(ctx, out, when) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx);
  const bpf = ctx.createBiquadFilter();
  bpf.type = 'bandpass';
  bpf.frequency.value = 4200;
  bpf.Q.value = 0.6;
  const amp = ctx.createGain();
  src.connect(bpf).connect(amp).connect(out);
  const end = percussive(amp.gain, when, 0.16, 0.008, 0.13); // soft attack = brush
  src.start(when);
  src.stop(end + 0.03);
  return { nodes: [src, bpf, amp], sources: [src] };
}

export function skeletonRib(ctx, out, when, freq) {
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = freq;
  const harm = ctx.createOscillator();
  harm.type = 'sine';
  harm.frequency.value = freq * 4;
  const harmGain = ctx.createGain();
  harmGain.gain.value = 0.25;
  const amp = ctx.createGain();
  osc.connect(amp);
  harm.connect(harmGain).connect(amp);
  amp.connect(out);
  const end = percussive(amp.gain, when, 0.18, 0.002, 0.45);
  osc.start(when); harm.start(when);
  osc.stop(end + 0.03); harm.stop(end + 0.03);
  return { nodes: [osc, harm, harmGain, amp], sources: [osc, harm] };
}

// ---- 🧪 Cauldron: acid bubble bass (Cat-Footed Iron Cauldron + Beeswax Candle Bundle) ----
// sawtooth, LPF 280 Hz, Q 3.0, pluck decay 0.22 s, gain 0.28.
export function cauldronVoice(ctx, out, when, freq) {
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.value = freq;
  const lpf = ctx.createBiquadFilter();
  lpf.type = 'lowpass';
  lpf.frequency.value = 280;
  lpf.Q.value = 3.0;
  const amp = ctx.createGain();
  osc.connect(lpf).connect(amp).connect(out);
  const end = percussive(amp.gain, when, 0.28, 0.005, 0.22);
  osc.start(when);
  osc.stop(end + 0.03);
  return { nodes: [osc, lpf, amp], sources: [osc] };
}

// ---- 👻 Ghost: theremin choir pad (Striped Nightcap + Small Brass Lantern) ------
// Slightly detuned sine pairs, slow attack, 4.5 Hz tremolo, gain 0.15 in total.
export function ghostVoice(ctx, out, when, freqs, duration, level = 1) {
  const amp = ctx.createGain();
  const tremolo = ctx.createGain();     // tremolo depth is applied on this gain
  tremolo.gain.value = 0.85;
  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 4.5;
  const lfoDepth = ctx.createGain();
  lfoDepth.gain.value = 0.15;
  lfo.connect(lfoDepth).connect(tremolo.gain);
  amp.connect(tremolo).connect(out);

  const nodes = [amp, tremolo, lfo, lfoDepth];
  const sources = [lfo];
  const perOsc = (0.15 * level) / (freqs.length * 2);
  freqs.forEach((f) => {
    [-4, 4].forEach((cents) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      osc.detune.value = cents;
      const g = ctx.createGain();
      g.gain.value = perOsc;
      osc.connect(g).connect(amp);
      osc.start(when);
      nodes.push(osc, g);
      sources.push(osc);
    });
  });

  const attack = Math.min(0.12, duration / 2);
  const release = 0.2;
  amp.gain.setValueAtTime(FLOOR, when);
  amp.gain.linearRampToValueAtTime(1, when + attack);
  amp.gain.setValueAtTime(1, when + duration);
  amp.gain.linearRampToValueAtTime(FLOOR, when + duration + release);
  const end = when + duration + release + 0.03;
  lfo.start(when);
  sources.forEach((s) => s.stop(end));
  return { nodes, sources };
}
