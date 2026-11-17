// Web Audio voices for the four tracks. Every sound is synthesized; no audio files are loaded.
//
// The pumpkin (Task 3), the skeleton (Task 5) and the cauldron (Task 6) have all of their timbre
// options from design.md section 2. The ghost still uses one default voice (Slot A / Slot C
// option 0); its remaining options are added in Task 7.
//
// A voice function schedules its nodes and returns { nodes, sources }:
//   nodes   - every node it created (the engine disconnects them on stop / when finished)
//   sources - the scheduled source nodes (the engine calls .stop() on them when stopping)

const FLOOR = 0.0001;

/** Percussive envelope: quick attack, exponential decay. Returns the time the voice ends. */
function percussive(gainParam, when, peak, attack, decay) {
  gainParam.value = FLOOR; // silent until the envelope event applies (a gain node defaults to 1)
  gainParam.setValueAtTime(FLOOR, when);
  gainParam.linearRampToValueAtTime(peak, when + attack);
  gainParam.exponentialRampToValueAtTime(FLOOR, when + attack + decay);
  return when + attack + decay;
}

/**
 * Exponential pitch sweep that is at `from` exactly when the note starts and reaches `to` after `dur`.
 *
 * The first automation event is placed a few milliseconds BEFORE the oscillator starts. An event that
 * lands on the same frame as start() makes the first samples depend on how the start time rounds to a
 * sample, so the same note rendered at different times came out with a different phase. That broke the
 * seamless loop: loop 2 and loop 3 of an offline render were uncorrelated for any voice that used this.
 */
const SWEEP_LEAD = 0.01;
function pitchSweep(param, when, from, to, dur) {
  const r = SWEEP_LEAD / (dur + SWEEP_LEAD);
  const start = Math.exp((Math.log(from) - r * Math.log(to)) / (1 - r));
  param.setValueAtTime(start, Math.max(0, when - SWEEP_LEAD));
  param.exponentialRampToValueAtTime(to, when + dur);
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
    if (start !== f) pitchSweep(osc.frequency, when, start, f, PUMPKIN_GLIDE_TIME);
    else osc.frequency.value = f; // a plain value: no automation event next to start()
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

// ---- 💀 Skeleton: drums and bone marimba (design.md section 2) ------------------
// Slot A (head) picks the kick and the snare / clap, Slot C (mallet) picks the marimba tone.
// Gains from the design: Kick 0.30, Snare 0.16, Rib 0.18.
export const SKELETON_KICKS = [
  { type: 'sine',     from: 110, to: 45, sweep: 0.12, decay: 0.22 },  // 0 Bent Top Hat: Wood Kick
  { type: 'triangle', from: 140, to: 55, sweep: 0.08, decay: 0.18 },  // 1 Wind-Up Key Head: Toy Kick
  { type: 'sine',     from: 90,  to: 38, sweep: 0.16, decay: 0.32 },  // 2 Tin Crown: Deep Kick
];

export function skeletonKick(ctx, out, when, head = 0) {
  const K = SKELETON_KICKS[head] ?? SKELETON_KICKS[0];
  const osc = ctx.createOscillator();
  osc.type = K.type;
  pitchSweep(osc.frequency, when, K.from, K.to, K.sweep);
  const amp = ctx.createGain();
  osc.connect(amp).connect(out);
  const end = percussive(amp.gain, when, 0.30, 0.003, K.decay);
  osc.start(when);
  osc.stop(end + 0.03);
  return { nodes: [osc, amp], sources: [osc] };
}

/** One filtered noise burst, with its own envelope. Adds its nodes to the given lists. */
function noiseBurst(ctx, out, when, { filter, freq, q = 0.7, peak, attack, decay }, nodes, sources) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx);
  const f = ctx.createBiquadFilter();
  f.type = filter;
  f.frequency.value = freq;
  f.Q.value = q;
  const amp = ctx.createGain();
  src.connect(f).connect(amp).connect(out);
  const end = percussive(amp.gain, when, peak, attack, decay);
  src.start(when);
  src.stop(end + 0.03);
  nodes.push(src, f, amp);
  sources.push(src);
}

export function skeletonSnare(ctx, out, when, head = 0) {
  const nodes = [];
  const sources = [];
  if (head === 1) {
    // Snappy Snare: bright and tight, with a short tonal body
    noiseBurst(ctx, out, when, { filter: 'highpass', freq: 2400, peak: 0.13, attack: 0.001, decay: 0.09 }, nodes, sources);
    const body = ctx.createOscillator();
    body.type = 'triangle';
    body.frequency.value = 190;
    const g = ctx.createGain();
    body.connect(g).connect(out);
    const end = percussive(g.gain, when, 0.07, 0.001, 0.07);
    body.start(when); body.stop(end + 0.03);
    nodes.push(body, g); sources.push(body);
  } else if (head === 2) {
    // Rim Clap: three quick bursts and a little rim click
    [0, 0.012, 0.024].forEach((dt, i) => {
      noiseBurst(ctx, out, when + dt, { filter: 'bandpass', freq: 1700, q: 1.1, peak: i < 2 ? 0.1 : 0.14, attack: 0.001, decay: i < 2 ? 0.02 : 0.1 }, nodes, sources);
    });
    const rim = ctx.createOscillator();
    rim.type = 'sine';
    rim.frequency.value = 1800;
    const g = ctx.createGain();
    rim.connect(g).connect(out);
    const end = percussive(g.gain, when, 0.05, 0.001, 0.03);
    rim.start(when); rim.stop(end + 0.03);
    nodes.push(rim, g); sources.push(rim);
  } else {
    // Brush Snare: soft attack, no hard edge
    noiseBurst(ctx, out, when, { filter: 'bandpass', freq: 4200, q: 0.6, peak: 0.16, attack: 0.008, decay: 0.13 }, nodes, sources);
  }
  return { nodes, sources };
}

/**
 * Marimba / xylophone note on a rib (rib rows 1 to 4 are chord[0..3]).
 * mallet 0 Femur Mallet: Warm Marimba, sine + 4th harmonic.
 * mallet 1 Silver Spoon: Glassy Xylophone, triangle + 3rd harmonic.
 * mallet 2 Dry Twig Baton: Wood Clack, band-passed square plus a click.
 * `gain` and `decay` let the skull-drop sound effect reuse the same tones.
 */
export function skeletonRib(ctx, out, when, freq, mallet = 0, { gain = 1, decay = null } = {}) {
  const amp = ctx.createGain();
  amp.connect(out);
  const nodes = [amp];
  const sources = [];
  const osc = (type, f, level, target = amp) => {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = f;
    const g = ctx.createGain();
    g.gain.value = level;
    o.connect(g).connect(target);
    nodes.push(o, g);
    sources.push(o);
    return o;
  };

  let peak = 0.18 * gain, attack = 0.002, dec = decay ?? 0.45;
  if (mallet === 1) {
    osc('triangle', freq, 1);
    osc('sine', freq * 3, 0.35);
    attack = 0.001; dec = decay ?? 0.32;
  } else if (mallet === 2) {
    const bpf = ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.value = freq;
    bpf.Q.value = 5;
    bpf.connect(amp);
    nodes.push(bpf);
    osc('square', freq, 1.7, bpf);
    noiseBurst(ctx, amp, when, { filter: 'bandpass', freq: 2400, q: 1, peak: 0.35, attack: 0.001, decay: 0.02 }, nodes, sources);
    attack = 0.001; dec = decay ?? 0.14;
  } else {
    osc('sine', freq, 1);
    osc('sine', freq * 4, 0.25);
  }
  const end = percussive(amp.gain, when, peak, attack, dec);
  sources.forEach((s) => { if (s instanceof OscillatorNode) { s.start(when); s.stop(end + 0.03); } });
  return { nodes, sources };
}

// ---- 🧪 Cauldron: acid bubble bass (design.md section 2, gain 0.28) ----------------
// Slot A (pot) picks the waveform and filter, Slot C (flame) the envelope.
//   pot 0 Cat-Footed Iron Cauldron: sawtooth, LPF 280 Hz, Q 3.0
//   pot 1 Patchwork Brass Cauldron: square, envelope LPF 160 -> 850 Hz, Q 8.0 (the acid squelch)
//   pot 2 Cracked Ceramic Cauldron: triangle + sub, LPF 400 Hz, Q 2.0
//   flame 0 Beeswax Candle Bundle: pluck, decay 0.22 s
//   flame 1 Foxfire Lantern: glide (the pitch slides up into the note), decay 0.42 s
//   flame 2 Crackling Bramble Logs: punch accent (a hard filter snap and a click on the attack)
export const CAULDRON_POTS = [
  { type: 'sawtooth', cutoff: 280, q: 3.0, level: 1 },
  { type: 'square', cutoff: 160, q: 8.0, level: 0.55, sweepTo: 850 },
  { type: 'triangle', cutoff: 400, q: 2.0, level: 0.8, sub: 0.35 },
];
export const CAULDRON_FLAMES = [
  { decay: 0.22, attack: 0.005 },
  { decay: 0.42, attack: 0.02, glideFrom: 0.89, glideTime: 0.07 },
  { decay: 0.2, attack: 0.002, punch: true },
];
const CAULDRON_GAIN = 0.28;

export function cauldronVoice(ctx, out, when, freq, { pot = 0, flame = 0 } = {}) {
  const P = CAULDRON_POTS[pot] ?? CAULDRON_POTS[0];
  const F = CAULDRON_FLAMES[flame] ?? CAULDRON_FLAMES[0];
  const nodes = [];
  const sources = [];

  const lpf = ctx.createBiquadFilter();
  lpf.type = 'lowpass';
  lpf.Q.value = P.q;
  const amp = ctx.createGain();
  lpf.connect(amp).connect(out);
  nodes.push(lpf, amp);

  const osc = (type, f, level) => {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = f;
    if (F.glideFrom) pitchSweep(o.frequency, when, f * F.glideFrom, f, F.glideTime);
    const g = ctx.createGain();
    g.gain.value = level;
    o.connect(g).connect(lpf);
    nodes.push(o, g);
    sources.push(o);
  };
  osc(P.type, freq, P.level);
  if (P.sub) osc('sine', freq / 2, P.sub);

  // Filter: the pot's own cutoff, shaped by the flame (squelch for the brass pot, snap for the punch).
  const end = percussive(amp.gain, when, CAULDRON_GAIN * (F.punch ? 1.05 : 1), F.attack, F.decay);
  lpf.frequency.value = P.cutoff;
  if (P.sweepTo) {
    lpf.frequency.setValueAtTime(P.cutoff, when);
    lpf.frequency.exponentialRampToValueAtTime(P.sweepTo, when + 0.06);
    lpf.frequency.exponentialRampToValueAtTime(P.cutoff * 1.2, end);
  } else if (F.punch) {
    lpf.frequency.setValueAtTime(P.cutoff * 3, when);
    lpf.frequency.exponentialRampToValueAtTime(P.cutoff, when + 0.07);
  }
  if (F.punch) noiseBurst(ctx, amp, when, { filter: 'lowpass', freq: 900, q: 0.7, peak: 0.3, attack: 0.001, decay: 0.03 }, nodes, sources);
  sources.forEach((s) => { if (s instanceof OscillatorNode) { s.start(when); s.stop(end + 0.03); } });
  return { nodes, sources };
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
  amp.gain.value = FLOOR;
  amp.gain.setValueAtTime(FLOOR, when);
  amp.gain.linearRampToValueAtTime(1, when + attack);
  amp.gain.setValueAtTime(1, when + duration);
  amp.gain.linearRampToValueAtTime(FLOOR, when + duration + release);
  const end = when + duration + release + 0.03;
  lfo.start(when);
  sources.forEach((s) => s.stop(end));
  return { nodes, sources };
}
