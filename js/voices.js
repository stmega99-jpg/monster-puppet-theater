// Web Audio voices for the four tracks. Every sound is synthesized; no audio files are loaded.
//
// The pumpkin has all of its Slot A and Slot C options (Task 3). The skeleton, cauldron and ghost
// still use one default voice each (Slot A / Slot C option 0); their remaining timbre options from
// design.md section 2 are added with each puppet in Tasks 5, 6 and 7.
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

// ---- 🎃 Pumpkin: lead synth (design.md section 2, gain 0.26) -------------------
// Slot A (eyes) picks the timbre, Slot C (mouth) picks the playing style.
// `level` only compensates the loudness of each waveform; it is not part of the design table.
export const PUMPKIN_TIMBRES = [
  { type: 'triangle', sub: 0.5, lpf: 1400, q: 0.7, level: 1.0,  detunes: [0] },       // 0 Crescent Eyes: triangle + Sub sine
  { type: 'square',   sub: 0,   lpf: 1800, q: 2.5, level: 0.8,  detunes: [0] },       // 1 Wooden Button Eyes
  { type: 'sawtooth', sub: 0,   lpf: 2600, q: 0.7, level: 0.75, detunes: [-8, 8] },   // 2 Star Cutout Eyes: detuned saw +-8 cents
];
export const PUMPKIN_STYLES = [
  { decay: 0.16 },                    // 0 Jagged Grin: staccato
  { decay: 0.38, vibrato: 5.5 },      // 1 Little Round Mouth: vibrato 5.5 Hz
  { decay: 0.26, glide: true },       // 2 Sly Fang Grin: portamento
];
const PUMPKIN_GLIDE_TIME = 0.06;
const PUMPKIN_VIBRATO_CENTS = 14;

/**
 * @param {object} [opts]
 * @param {number} [opts.timbre]    Slot A option (0..2)
 * @param {number} [opts.style]     Slot C option (0..2)
 * @param {number|null} [opts.prevFreq] previous pitch, used by the portamento style
 */
export function pumpkinVoice(ctx, out, when, freq, { timbre = 0, style = 0, prevFreq = null } = {}) {
  const T = PUMPKIN_TIMBRES[timbre] ?? PUMPKIN_TIMBRES[0];
  const S = PUMPKIN_STYLES[style] ?? PUMPKIN_STYLES[0];

  const lpf = ctx.createBiquadFilter();
  lpf.type = 'lowpass';
  lpf.frequency.value = T.lpf;
  lpf.Q.value = T.q;
  const amp = ctx.createGain();
  lpf.connect(amp).connect(out);

  const nodes = [lpf, amp];
  const sources = [];
  const pitched = []; // oscillators that follow vibrato / glide

  const addOsc = (type, f, detune, gainValue) => {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.detune.value = detune;
    const start = S.glide && prevFreq ? prevFreq * (f / freq) : f;
    osc.frequency.setValueAtTime(start, when);
    if (start !== f) osc.frequency.exponentialRampToValueAtTime(f, when + PUMPKIN_GLIDE_TIME);
    const g = ctx.createGain();
    g.gain.value = gainValue;
    osc.connect(g).connect(lpf);
    nodes.push(osc, g);
    sources.push(osc);
    pitched.push(osc);
  };
  T.detunes.forEach((c) => addOsc(T.type, freq, c, T.level));
  if (T.sub) addOsc('sine', freq / 2, 0, T.sub);

  if (S.vibrato) {
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = S.vibrato;
    const depth = ctx.createGain();
    depth.gain.value = PUMPKIN_VIBRATO_CENTS;
    lfo.connect(depth);
    pitched.forEach((o) => depth.connect(o.detune));
    nodes.push(lfo, depth);
    sources.push(lfo);
    lfo.start(when);
    lfo.stop(when + 0.005 + S.decay + 0.03);
  }

  const end = percussive(amp.gain, when, 0.26, 0.005, S.decay);
  pitched.forEach((o) => { o.start(when); o.stop(end + 0.03); });
  return { nodes, sources };
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
