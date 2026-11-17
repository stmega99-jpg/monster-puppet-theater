// Four-track Web Audio engine: look-ahead scheduler, ensemble swing, strict stop,
// and an output-time-synchronized visual queue.
//
// Rules this file enforces (project-rules.md section 2):
//  - One scheduledTime (baseStepTime + swingOffset) feeds BOTH the audio nodes and visualQueue.
//  - Animations are driven from audioCtx.getOutputTimestamp().contextTime (fallback: currentTime).
//  - energy = Math.exp(-dt / tau), never frame-count based.
//  - Stop stops + disconnects every node in activeNodes, empties visualQueue, clears the timer,
//    and rebuilds the master bus so delay tails of old notes cannot leak into the next run.

import {
  CHORD_MAP, PATTERNS, STEPS_PER_LOOP, STEPS_PER_CHORD,
  stepDuration, isEnsembleSwing, computeScheduledTime, isAudible, holdSteps,
} from './music.js';
import { createMasterBus } from './master-bus.js';
import {
  pumpkinVoice, skeletonKick, skeletonSnare, skeletonRib, cauldronVoice, ghostVoice,
} from './voices.js';

export const GHOST_SWELL = 0.12;   // seconds the ghost's motion takes to swell in with a note
export const GHOST_SETTLE = 0.3;   // time constant of the settle after a note is released
// A chord splits the ghost's level between its four notes, so it needs twice the level of a single
// note to be as loud (equal RMS). Keeps the three voicings (Slot B) at the same loudness.
const CHORD_LEVEL = 2;
export const TAU = 0.18;            // motion decay constant in seconds
const LOOKAHEAD = 0.15;             // seconds scheduled ahead of the clock
const TICK_MS = 25;                 // scheduler interval
const START_DELAY = 0.1;            // gap between Play and the first step
const STALE_TOLERANCE = 0.02;       // steps later than this are skipped, not played late

/**
 * Schedule every audible track's event for one step.
 * Context-agnostic on purpose: the realtime engine and the offline WAV render (Task 4) both use it.
 *
 * @param {object} p
 * @param {BaseAudioContext} p.ctx
 * @param {AudioNode} p.out           destination (master bus input)
 * @param {object} [p.trims]          per-track trim nodes of the master bus (ensemble balance); falls back to `out`
 * @param {Array} p.tracks            [{ id, slots, mute, solo }] in TRACK_IDS order
 * @param {number} p.stepIndex        global step counter (not wrapped)
 * @param {number} p.baseStepTime     unswung start time of the step
 * @param {number} p.stepDur
 * @param {(voice) => void} p.register  called with { nodes, sources } for every voice
 * @param {(event) => void} p.emit      called with the visual event for every note
 * @param {object} [p.state]            per-run memory (e.g. the pumpkin's previous pitch for portamento)
 */
export function scheduleStep({ ctx, out: busIn, trims, tracks, stepIndex, baseStepTime, stepDur, register, emit, state = {} }) {
  const step = stepIndex % STEPS_PER_LOOP;
  const k = step % STEPS_PER_CHORD;
  const chord = CHORD_MAP[Math.floor(step / STEPS_PER_CHORD)];
  const swing = isEnsembleSwing(tracks);
  const scheduledTime = computeScheduledTime(baseStepTime, step, stepDur, swing);

  tracks.forEach((track) => {
    if (!isAudible(track, tracks)) return;
    const pattern = PATTERNS[track.id][track.slots[1]];
    const ev = pattern[k];
    if (ev === -1) return;

    const out = trims?.[track.id] ?? busIn;
    let voice;
    let freq = null;
    let duration = null;
    switch (track.id) {
      case 'pumpkin':
        freq = chord.scale[ev];
        voice = pumpkinVoice(ctx, out, scheduledTime, freq, pumpkinOptions(track, state.pumpkinLast));
        state.pumpkinLast = freq;
        break;
      case 'skeleton':
        // Slot A (head) picks the drum tone, Slot C (mallet) the marimba tone
        if (ev === 'K') voice = skeletonKick(ctx, out, scheduledTime, track.slots[0]);
        else if (ev === 'S') voice = skeletonSnare(ctx, out, scheduledTime, track.slots[0]);
        else { // 'M0'..'M3' = rib rows 1..4 = chord[0..3]
          freq = chord.chord[Number(ev[1])];
          voice = skeletonRib(ctx, out, scheduledTime, freq, track.slots[2]);
        }
        break;
      case 'cauldron':
        freq = ev === 'R' ? chord.root : ev === 'F' ? chord.fifth : chord.octave;
        voice = cauldronVoice(ctx, out, scheduledTime, freq, cauldronOptions(track));
        break;
      case 'ghost': {
        duration = holdSteps(pattern, k) * stepDur;
        if (ev === 'C') {
          voice = ghostVoice(ctx, out, scheduledTime, chord.chord, duration, CHORD_LEVEL, ghostOptions(track));
        } else { // 'A0'..'A3': one chord tone
          freq = chord.chord[Number(ev[1])];
          voice = ghostVoice(ctx, out, scheduledTime, [freq], duration, 1, ghostOptions(track));
        }
        break;
      }
      default:
        return;
    }

    register(voice);
    // The same scheduledTime that went to the audio nodes goes to the visual queue.
    emit({ trackId: track.id, time: scheduledTime, kind: ev, freq, step, duration });
  });
}

/** Slot A (eyes) = timbre, Slot C (mouth) = playing style. */
function pumpkinOptions(track, prevFreq = null) {
  return { timbre: track.slots[0], style: track.slots[2], prevFreq };
}

/** Slot A (hat) = voice, Slot C (item) = modulation. Slot B (face) is the voicing, handled by the pattern. */
function ghostOptions(track) {
  return { voice: track.slots[0], item: track.slots[2] };
}

/** Slot A (pot) = waveform and filter, Slot C (flame) = envelope. */
function cauldronOptions(track) {
  return { pot: track.slots[0], flame: track.slots[2] };
}

// Pitches for pokes and slot previews: a gentle walk through the current chord's scale.
const POKE_DEGREES = [0, 2, 3, 4, 3, 2];
const POKE_CHORD = [0, 1, 2, 3, 2, 1];  // ghost pokes: one chord tone at a time, walking up and down the chord
const POKE_BASS = ['R', 'F', 'O', 'F'];  // cauldron pokes: root, fifth, octave, fifth of the current chord
const POKE_ROWS = [0, 1, 2, 3, 2, 1];   // rib rows for skeleton pokes: a short walk up and down the ribs

export class AudioEngine {
  /** @param {Array} tracks live track state from main.js; read on every step, so edits apply immediately */
  constructor(tracks) {
    this.tracks = tracks;
    this.ctx = null;
    this.bus = null;
    this.timer = null;
    this.activeNodes = new Set();
    this.visualQueue = [];
    this.motion = Object.fromEntries(tracks.map((t) => [t.id, this._freshMotion(t.id)]));
    this.startTime = 0;
    this.stepIndex = 0;
    this.stepDur = stepDuration();
    this.state = {};       // memory shared by scheduleStep calls of one run
    this.pokeCount = 0;
  }

  get running() { return this.timer !== null; }

  /** Per-track motion memory. The skeleton also remembers its kick, snare and the last rib struck by each arm. */
  _freshMotion(id) {
    const m = { lastNoteTime: null, lastEvent: null };
    if (id === 'ghost') Object.assign(m, { holdStart: null, holdEnd: null });
    if (id === 'skeleton') Object.assign(m, { kickTime: null, snareTime: null, arms: [{ time: null, row: 0 }, { time: null, row: 0 }], malletCount: 0 });
    return m;
  }

  _ensureContext() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new Ctx({ latencyHint: 'interactive' });
      this.bus = createMasterBus(this.ctx);
    }
  }

  /**
   * Play: reset everything first, resume the context, then start the loop from step 0.
   * Call from a user gesture (the Play click) so the browser allows audio.
   */
  async start() {
    this.stop();
    this._ensureContext();
    const ctx = this.ctx;
    this.startTime = ctx.currentTime + START_DELAY;
    this.stepIndex = 0;
    this.state = {};
    this._tick();
    this.timer = setInterval(() => this._tick(), TICK_MS);
    if (ctx.state !== 'running') await ctx.resume();
  }

  /** Stop: no scheduled note, node, timer, or queued visual event survives this call. */
  stop() {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.activeNodes.forEach((node) => {
      try { node.stop?.(); } catch { /* source never started or already stopped */ }
      try { node.disconnect(); } catch { /* already disconnected */ }
    });
    this.activeNodes.clear();
    this.visualQueue.length = 0;
    Object.keys(this.motion).forEach((id) => { this.motion[id] = this._freshMotion(id); });
    if (this.bus) { // flush the delay lines
      this.bus.dispose();
      this.bus = createMasterBus(this.ctx);
    }
  }

  _register(voice) {
    voice.nodes.forEach((n) => this.activeNodes.add(n));
    let remaining = voice.sources.length;
    voice.sources.forEach((src) => {
      src.onended = () => {
        if (--remaining > 0) return;
        voice.nodes.forEach((n) => {
          if (!this.activeNodes.delete(n)) return; // already released by stop()
          try { n.disconnect(); } catch { /* ignore */ }
        });
      };
    });
  }

  /** Keep visualQueue sorted by time, so a poke can never sit behind later look-ahead events. */
  _enqueue(event) {
    const q = this.visualQueue;
    let i = q.length;
    while (i > 0 && q[i - 1].time > event.time) i--;
    q.splice(i, 0, event);
  }

  /** The chord that is sounding now (Cm while stopped). */
  currentChord() {
    if (!this.running || !this.ctx) return CHORD_MAP[0];
    const idx = Math.max(0, Math.floor((this.ctx.currentTime - this.startTime) / this.stepDur));
    return CHORD_MAP[Math.floor((idx % STEPS_PER_LOOP) / STEPS_PER_CHORD)];
  }

  /** True for the tracks that can sound a one-shot note (every puppet). */
  hasOneShot(trackId) {
    return trackId === 'pumpkin' || trackId === 'skeleton' || trackId === 'cauldron' || trackId === 'ghost';
  }

  /**
   * Play a note of a track right now, whether or not the loop is running and even if the track is
   * muted (Req 2.3, 2.4). Used for pokes and for the preview after a slot change (Req 2.2).
   * Pumpkin: one lead note. Cauldron: one bass note (root, fifth, octave in turn). Ghost: one chord tone, held for 0.9 s. Skeleton: one rib note (the arms take turns), or, when `slot` is 0
   * (the head / drum tone changed), a kick followed by the snare. Returns true when something was scheduled.
   * Call from a user gesture.
   */
  async playOneShot(trackId, { slot = null } = {}) {
    if (!this.hasOneShot(trackId)) return false;
    const track = this.tracks.find((t) => t.id === trackId);
    this._ensureContext();
    if (this.ctx.state !== 'running') await this.ctx.resume();
    const ctx = this.ctx;
    const out = this.bus.trims[trackId];
    const chord = this.currentChord();
    const when = ctx.currentTime + 0.02;

    if (trackId === 'pumpkin') {
      const freq = chord.scale[POKE_DEGREES[this.pokeCount++ % POKE_DEGREES.length]];
      // Poke notes never glide: there is no previous pitch to slide from.
      this._register(pumpkinVoice(ctx, out, when, freq, pumpkinOptions(track, null)));
      this._enqueue({ trackId, time: when, kind: 'poke', freq, step: null });
      return true;
    }

    if (trackId === 'ghost') {
      const row = POKE_CHORD[this.pokeCount++ % POKE_CHORD.length];
      const freq = chord.chord[row];
      const duration = 0.9;
      this._register(ghostVoice(ctx, out, when, [freq], duration, 1, ghostOptions(track)));
      this._enqueue({ trackId, time: when, kind: `A${row}`, freq, step: null, duration });
      return true;
    }

    if (trackId === 'cauldron') {
      const kind = POKE_BASS[this.pokeCount++ % POKE_BASS.length];
      const freq = kind === 'R' ? chord.root : kind === 'F' ? chord.fifth : chord.octave;
      this._register(cauldronVoice(ctx, out, when, freq, cauldronOptions(track)));
      this._enqueue({ trackId, time: when, kind, freq, step: null });
      return true;
    }

    if (slot === 0) {
      this._register(skeletonKick(ctx, out, when, track.slots[0]));
      this._enqueue({ trackId, time: when, kind: 'K', freq: null, step: null });
      this._register(skeletonSnare(ctx, out, when + 0.22, track.slots[0]));
      this._enqueue({ trackId, time: when + 0.22, kind: 'S', freq: null, step: null });
    } else {
      const row = POKE_ROWS[this.pokeCount++ % POKE_ROWS.length];
      const freq = chord.chord[row];
      this._register(skeletonRib(ctx, out, when, freq, track.slots[2]));
      this._enqueue({ trackId, time: when, kind: `M${row}`, freq, step: null });
    }
    return true;
  }

  /**
   * The xylophone-style sound of the skull falling off during the curtain call (Req 1.4):
   * three bounces that get smaller, then a soft clack when it lands back on the neck.
   * Times are seconds after the call began (see GAG_HITS / GAG_PLACE in skeleton-art.js).
   * Uses the skeleton's own mallet tone. Stop or a new Play cancels it like any other note.
   */
  playSkullGag(hitTimes, placeTime) {
    if (!this.ctx || !this.bus) return;
    const track = this.tracks.find((t) => t.id === 'skeleton');
    const start = this.ctx.currentTime + 0.02;
    const notes = [
      [hitTimes[0], 392.00, 1.0], [hitTimes[1], 311.13, 0.7], [hitTimes[2], 261.63, 0.45], [placeTime, 523.25, 0.55],
    ];
    notes.forEach(([t, freq, gain]) => {
      this._register(skeletonRib(this.ctx, this.bus.trims.skeleton, start + t, freq, track.slots[2], { gain, decay: 0.28 }));
    });
  }

  _tick() {
    const { ctx } = this;
    const now = ctx.currentTime;
    const at = (i) => this.startTime + i * this.stepDur;
    while (at(this.stepIndex) < now - STALE_TOLERANCE) this.stepIndex++; // timer was throttled: skip, don't burst
    while (at(this.stepIndex) < now + LOOKAHEAD) {
      scheduleStep({
        ctx,
        out: this.bus.input,
        trims: this.bus.trims,
        tracks: this.tracks,
        stepIndex: this.stepIndex,
        baseStepTime: at(this.stepIndex),
        stepDur: this.stepDur,
        register: (v) => this._register(v),
        emit: (e) => this._enqueue(e),
        state: this.state,
      });
      this.stepIndex++;
    }
  }

  /** Time the listener is actually hearing right now (not the scheduling time). */
  getOutputTime() {
    const ts = this.ctx.getOutputTimestamp?.();
    return (ts && ts.contextTime) || this.ctx.currentTime;
  }

  /**
   * Call once per animation frame. Consumes due visual events and returns the
   * time-based motion energy of every track: energy = exp(-dt / tau).
   */
  update() {
    const energy = Object.fromEntries(this.tracks.map((t) => [t.id, 0]));
    const detail = { skeleton: { kick: 0, snare: 0, arms: [{ energy: 0, row: 0 }, { energy: 0, row: 0 }] } };
    detail.cauldron = { hits: [] };
    detail.ghost = { sustain: 0, onset: 0 };
    if (!this.ctx) return { now: 0, energy, detail };
    const now = this.getOutputTime();
    while (this.visualQueue.length && this.visualQueue[0].time <= now) {
      const e = this.visualQueue.shift();
      const m = this.motion[e.trackId];
      m.lastNoteTime = e.time;
      m.lastEvent = e;
      if (e.trackId === 'ghost') { m.holdStart = e.time; m.holdEnd = e.time + (e.duration ?? 0.9); }
      if (e.trackId === 'cauldron') detail.cauldron.hits.push({ kind: e.kind, freq: e.freq });
      if (e.trackId === 'skeleton') {
        if (e.kind === 'K') m.kickTime = e.time;
        else if (e.kind === 'S') m.snareTime = e.time;
        else if (typeof e.kind === 'string' && e.kind[0] === 'M') {
          // the two arms take turns: every rib note goes to the other arm
          m.arms[m.malletCount++ % 2] = { time: e.time, row: Number(e.kind[1]) };
        }
      }
    }
    const decay = (time) => (time === null ? 0 : Math.exp(-(now - time) / TAU));
    this.tracks.forEach((t) => { energy[t.id] = decay(this.motion[t.id].lastNoteTime); });
    // The ghost sings a held pad: it swells in over the attack, stays up while the note is held,
    // and settles back with the release. `onset` is the quick stretch at the start of each note.
    const gh = this.motion.ghost;
    if (gh.holdStart !== null) {
      const swell = Math.min(1, Math.max(0, (now - gh.holdStart) / GHOST_SWELL));
      const held = now <= gh.holdEnd ? 1 : Math.exp(-(now - gh.holdEnd) / GHOST_SETTLE);
      detail.ghost = { sustain: swell * held, onset: decay(gh.holdStart) };
    }
    const sk = this.motion.skeleton;
    detail.skeleton = {
      kick: decay(sk.kickTime),
      snare: decay(sk.snareTime),
      arms: sk.arms.map((a) => ({ energy: decay(a.time), row: a.row })),
    };
    return { now, energy, detail };
  }
}
