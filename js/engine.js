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
 * @param {Array} p.tracks            [{ id, slots, mute, solo }] in TRACK_IDS order
 * @param {number} p.stepIndex        global step counter (not wrapped)
 * @param {number} p.baseStepTime     unswung start time of the step
 * @param {number} p.stepDur
 * @param {(voice) => void} p.register  called with { nodes, sources } for every voice
 * @param {(event) => void} p.emit      called with the visual event for every note
 */
export function scheduleStep({ ctx, out, tracks, stepIndex, baseStepTime, stepDur, register, emit }) {
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

    let voice;
    let freq = null;
    switch (track.id) {
      case 'pumpkin':
        freq = chord.scale[ev];
        voice = pumpkinVoice(ctx, out, scheduledTime, freq);
        break;
      case 'skeleton':
        if (ev === 'K') voice = skeletonKick(ctx, out, scheduledTime);
        else if (ev === 'S') voice = skeletonSnare(ctx, out, scheduledTime);
        else { // 'M0'..'M3' = rib rows 1..4 = chord[0..3]
          freq = chord.chord[Number(ev[1])];
          voice = skeletonRib(ctx, out, scheduledTime, freq);
        }
        break;
      case 'cauldron':
        freq = ev === 'R' ? chord.root : ev === 'F' ? chord.fifth : chord.octave;
        voice = cauldronVoice(ctx, out, scheduledTime, freq);
        break;
      case 'ghost': {
        const duration = holdSteps(pattern, k) * stepDur;
        if (ev === 'C') {
          voice = ghostVoice(ctx, out, scheduledTime, chord.chord, duration);
        } else { // 'A0'..'A3': one chord tone
          freq = chord.chord[Number(ev[1])];
          voice = ghostVoice(ctx, out, scheduledTime, [freq], duration, 1.6);
        }
        break;
      }
      default:
        return;
    }

    register(voice);
    // The same scheduledTime that went to the audio nodes goes to the visual queue.
    emit({ trackId: track.id, time: scheduledTime, kind: ev, freq, step });
  });
}

export class AudioEngine {
  /** @param {Array} tracks live track state from main.js; read on every step, so edits apply immediately */
  constructor(tracks) {
    this.tracks = tracks;
    this.ctx = null;
    this.bus = null;
    this.timer = null;
    this.activeNodes = new Set();
    this.visualQueue = [];
    this.motion = Object.fromEntries(tracks.map((t) => [t.id, { lastNoteTime: null, lastEvent: null }]));
    this.startTime = 0;
    this.stepIndex = 0;
    this.stepDur = stepDuration();
  }

  get running() { return this.timer !== null; }

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
    Object.values(this.motion).forEach((m) => { m.lastNoteTime = null; m.lastEvent = null; });
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

  _tick() {
    const { ctx } = this;
    const now = ctx.currentTime;
    const at = (i) => this.startTime + i * this.stepDur;
    while (at(this.stepIndex) < now - STALE_TOLERANCE) this.stepIndex++; // timer was throttled: skip, don't burst
    while (at(this.stepIndex) < now + LOOKAHEAD) {
      scheduleStep({
        ctx,
        out: this.bus.input,
        tracks: this.tracks,
        stepIndex: this.stepIndex,
        baseStepTime: at(this.stepIndex),
        stepDur: this.stepDur,
        register: (v) => this._register(v),
        emit: (e) => this.visualQueue.push(e),
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
    if (!this.ctx) return { now: 0, energy };
    const now = this.getOutputTime();
    while (this.visualQueue.length && this.visualQueue[0].time <= now) {
      const e = this.visualQueue.shift();
      const m = this.motion[e.trackId];
      m.lastNoteTime = e.time;
      m.lastEvent = e;
    }
    this.tracks.forEach((t) => {
      const m = this.motion[t.id];
      energy[t.id] = m.lastNoteTime === null ? 0 : Math.exp(-(now - m.lastNoteTime) / TAU);
    });
    return { now, energy };
  }
}
