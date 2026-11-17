// Shared musical data for the four-track engine (design.md sections 3 and 4).
// Pure data and pure functions only, so the same code can drive the realtime
// engine and the OfflineAudioContext export in Task 4.

export const BPM = 112;
export const STEPS_PER_LOOP = 32;   // 2 bars of 16th notes
export const STEPS_PER_CHORD = 8;   // 4 chords x 8 steps
export const SWING_RATIO = 0.32;    // swingOffset = stepDur * 0.32 on odd steps

// Order matches PUPPETS / tracks in main.js: tracks[0] = pumpkin, tracks[1] = skeleton, ...
export const TRACK_IDS = ['pumpkin', 'skeleton', 'cauldron', 'ghost'];

/** Duration of one 16th-note step in seconds. */
export const stepDuration = (bpm = BPM) => 60 / bpm / 4;

// Cm -> Ab -> Fm -> G7. Every `chord` has exactly 4 notes so skeleton ribs M0..M3 map to chord[0..3].
export const CHORD_MAP = [
  // 0: Cm (Steps 0..7)  - Bass: C2, G2, C3 / Chord: C4, Eb4, G4, C5
  { name: 'Cm', root: 65.41,  fifth: 98.00,  octave: 130.81, chord: [261.63, 311.13, 392.00, 523.25], scale: [261.63, 293.66, 311.13, 392.00, 523.25] },
  // 1: Ab (Steps 8..15) - Bass: Ab2, Eb3, Ab3 / Chord: Ab3, C4, Eb4, Ab4
  { name: 'Ab', root: 103.83, fifth: 155.56, octave: 207.65, chord: [207.65, 261.63, 311.13, 415.30], scale: [207.65, 261.63, 311.13, 392.00, 415.30] },
  // 2: Fm (Steps 16..23) - Bass: F2, C3, F3 / Chord: F3, Ab3, C4, F4
  { name: 'Fm', root: 87.31,  fifth: 130.81, octave: 174.61, chord: [174.61, 207.65, 261.63, 349.23], scale: [174.61, 207.65, 261.63, 311.13, 349.23] },
  // 3: G7 (Steps 24..31) - Bass: G2, D3, G3 / Chord: G3, B3 (leading tone), D4, F4 (7th)
  { name: 'G7', root: 98.00,  fifth: 146.83, octave: 196.00, chord: [196.00, 246.94, 293.66, 349.23], scale: [196.00, 246.94, 293.66, 349.23, 493.88] },
];

// Base 8-step arrays, repeated for each of the 4 chords to make 32 steps.
// Index = slots[1] (Slot B): 0 Clockwork Polka, 1 Ghostly Shuffle, 2 Cabaret Tango (3+3+2).
export const PATTERNS = {
  pumpkin: [
    [0, -1, 2, -1, 3, -1, 2, -1],
    [0,  2, -1, 3, 4,  3, -1, 2],
    [2, -1, -1, 3, -1, -1, 4, -1],
  ],
  skeleton: [
    ['K', -1,  'S', -1,  'K', -1,  'S', 'M3'],
    ['K', 'M0','S', 'M1','K', 'M2','S', 'M3'],
    ['K', -1,  'M1','K', -1,  'M2','S', 'M3'],
  ],
  cauldron: [
    ['R', -1, -1, -1, 'F', -1, -1, -1],
    ['R', -1, 'F', 'O', 'R', -1, 'F', 'R'],
    ['R', -1, -1, 'F', -1, -1, 'O', -1],
  ],
  ghost: [
    ['C', -1, -1, -1, -1, -1, -1, -1],
    [-1, 'A0', -1, 'A1', -1, 'A2', -1, 'A3'],
    ['C', -1, -1, 'C', -1, -1, 'A3', -1],
  ],
};

/** Swing applies to every track when the lead or the drums pick Ghostly Shuffle (slots[1] === 1). */
export function isEnsembleSwing(tracks) {
  return tracks[0].slots[1] === 1 || tracks[1].slots[1] === 1;
}

/**
 * The single time shared by audio scheduling and the visualQueue:
 * scheduledTime = baseStepTime + swingOffset (odd steps only, when the ensemble swings).
 */
export function computeScheduledTime(baseStepTime, step, stepDur, ensembleSwing) {
  return baseStepTime + (ensembleSwing && (step % 2 === 1) ? stepDur * SWING_RATIO : 0);
}

/** A track is audible unless it is muted, or another track is soloed and it is not. */
export function isAudible(track, tracks) {
  const anySolo = tracks.some((t) => t.solo);
  return !track.mute && (!anySolo || track.solo);
}

/** Number of steps from `k` until the next event in the 8-step pattern (or the end of the block). */
export function holdSteps(pattern, k) {
  let n = 1;
  while (k + n < pattern.length && pattern[k + n] === -1) n++;
  return n;
}
