# Technical Design: Monster Puppet Session

## 1. Art direction and palette (Antique Wood & Faded Storybook)
- No fluorescent colors. The look of antique wood-carved puppets and a faded storybook is unified through CSS variables and Canvas/SVG drawing:
  - `--bg-stage-dark: #1A1412`, `--wood-frame: #4A3228`, `--wood-highlight: #6E4B3A`, `--brass-accent: #C5A059`
  - `--curtain-red: #6B1D2F`, `--curtain-shadow: #3D0E19`, `--parchment-bg: #F2E6D0`, `--sepia-ink: #2C1E18`
  - Puppet base colors: Pumpkin `#D97236` (Candle `#F7C873`), Skeleton `#E8DCC4` (Shadow `#B5A48B`), Cauldron `#2B303A` (Bubble `#76A884`), Ghost `#EAE6DF` (Blush `#D98A82`)
- Draw thin hemp control strings (`rgba(212, 195, 163, 0.35)`) above each puppet.

## 2. All 36 appearance parts and timbre parameters
- **🎃 Pumpkin (Lead Synth / Gain `0.26`)**:
  - Slot A (Eyes / timbre): `0: Crescent Eyes` (`triangle` + Sub `sine`, LPF `1400Hz`), `1: Wooden Button Eyes` (`square`, LPF `1800Hz`, Q `2.5`), `2: Star Cutout Eyes` (Detuned `sawtooth` ±8c, LPF `2600Hz`)
  - Slot B (Nose / phrase): `0: Triangle-Carved Nose` (Clockwork Polka), `1: Curly Vine Nose` (Ghostly Shuffle), `2: Upside-Down Heart Nose` (Cabaret Tango)
  - Slot C (Mouth / playing style): `0: Jagged Grin` (Staccato Decay `0.16s`), `1: Little Round Mouth` (Vibrato 5.5Hz, Decay `0.38s`), `2: Sly Fang Grin` (Portamento Glide, Decay `0.26s`)
- **💀 Skeleton (Drums & Bone Marimba / Kick `0.30`, Snare `0.16`, Rib `0.18`)**:
  - Slot A (Head / drum tone): `0: Bent Top Hat` (Wood Kick `110->45Hz` + Brush Snare), `1: Wind-Up Key Head` (Toy Kick `140->55Hz` + Snappy Snare), `2: Tin Crown` (Deep Kick `90->38Hz` + Rim Clap)
  - Slot B (Ribs / beat): `0: Four-Box Ribs` (Clockwork Polka), `1: Brass-Jointed Ribs` (Ghostly Shuffle), `2: Cobweb Ribs` (Cabaret Tango)
  - Slot C (Mallet / marimba tone): `0: Femur Mallet` (Warm Marimba `sine` + 4th harmonic), `1: Silver Spoon` (Glassy Xylophone `triangle` + 3rd harmonic), `2: Dry Twig Baton` (Wood Clack band-pass xylophone)
- **🧪 Witch's Cauldron (Acid Bubble Bass / Gain `0.28`)**:
  - Slot A (Pot / waveform): `0: Cat-Footed Iron Cauldron` (`sawtooth`, LPF `280Hz`, Q `3.0`), `1: Patchwork Brass Cauldron` (`square`, EnvLPF `160->850Hz`, Q `8.0`), `2: Cracked Ceramic Cauldron` (`triangle` + Sub, LPF `400Hz`, Q `2.0`)
  - Slot B (Ingredient / pattern): `0: Glowing Poison Mushroom` (Clockwork Polka), `1: Wind-Up Frog` (Ghostly Shuffle), `2: Starry Eyeball` (Cabaret Tango)
  - Slot C (Flame / envelope): `0: Beeswax Candle Bundle` (Pluck Decay `0.22s`), `1: Foxfire Lantern` (Glide Decay `0.42s`), `2: Crackling Bramble Logs` (Punch Accent)
- **👻 Ghost (Theremin Choir Pad / Gain `0.15`)**:
  - Slot A (Hat / voice): `0: Striped Nightcap` (Theremin Choir, slightly detuned `sine`), `1: Storybook Paper Crown` (Reed Organ `triangle` + `sawtooth`, LPF `1200Hz`), `2: Old Lace Veil` (Glass Pad, harmonic chorus)
  - Slot B (Face / voicing): `0: Gaping Round Mouth` (Clockwork Polka, long chords), `1: Smiling Slit Eyes` (Ghostly Shuffle, off-beat chords), `2: Teary Fretful Eyes` (Cabaret Tango, tango chords)
  - Slot C (Item / LFO): `0: Small Brass Lantern` (Tremolo 4.5Hz), `1: Chained Pocket Watch` (Pitch Vibrato 6.0Hz ±15c), `2: Quill and Sheet Music` (Octave Shimmer)

## 3. Shared harmonic map (32 steps: Cm -> Ab -> Fm -> G7, BPM 112)
- Every chord's `chord` array has exactly 4 elements, matching the Skeleton's four rib rows (`M0..M3`) and the G7 seventh (`F4 = 349.23Hz`).
- The Cauldron bass `root / fifth / octave` sit in the `C2 (65.41Hz)` to `Ab3 (207.65Hz)` range so they are clearly audible even on laptop speakers.

```javascript
const CHORD_MAP = [
  // 0: Cm (Steps 0..7)  - Bass: C2, G2, C3 / Chord: C4, Eb4, G4, C5
  { name: 'Cm', root: 65.41,  fifth: 98.00,  octave: 130.81, chord: [261.63, 311.13, 392.00, 523.25], scale: [261.63, 293.66, 311.13, 392.00, 523.25] },
  // 1: Ab (Steps 8..15) - Bass: Ab2, Eb3, Ab3 / Chord: Ab3, C4, Eb4, Ab4
  { name: 'Ab', root: 103.83, fifth: 155.56, octave: 207.65, chord: [207.65, 261.63, 311.13, 415.30], scale: [207.65, 261.63, 311.13, 392.00, 415.30] },
  // 2: Fm (Steps 16..23) - Bass: F2, C3, F3 / Chord: F3, Ab3, C4, F4
  { name: 'Fm', root: 87.31,  fifth: 130.81, octave: 174.61, chord: [174.61, 207.65, 261.63, 349.23], scale: [174.61, 207.65, 261.63, 311.13, 349.23] },
  // 3: G7 (Steps 24..31) - Bass: G2, D3, G3 / Chord: G3, B3 (leading tone), D4, F4 (7th)
  { name: 'G7', root: 98.00,  fifth: 146.83, octave: 196.00, chord: [196.00, 246.94, 293.66, 349.23], scale: [196.00, 246.94, 293.66, 349.23, 493.88] }
];
```

## 4. Rhythm pattern arrays and ensemble-wide swing
1. **Ensemble-wide swing decision (prevents flams)**:
   - When `slots[1] === 1 (Ghostly Shuffle)` is selected on the lead (🎃 Pumpkin `tracks[0]`) or the drums (💀 Skeleton `tracks[1]`), set `isEnsembleSwing = true` and apply `swingOffset = stepDur * 0.32` to odd steps (`step % 2 === 1`) on **all four tracks**.
   - `const scheduledTime = baseStepTime + (isEnsembleSwing && (step % 2 === 1) ? stepDur * 0.32 : 0);`
   - Always pass this same `scheduledTime` to both the audio node scheduling and `visualQueue.push({ trackId, time: scheduledTime, ... })`.
2. **Base 8-step arrays (expanded to 32 steps over 4 chords)**:
```javascript
const PATTERNS = {
  pumpkin: [
    [0, -1, 2, -1, 3, -1, 2, -1], // 0: Clockwork Polka
    [0,  2, -1, 3, 4,  3, -1, 2], // 1: Ghostly Shuffle
    [2, -1, -1, 3, -1, -1, 4, -1] // 2: Cabaret Tango (3+3+2)
  ],
  skeleton: [
    ['K', -1,  'S', -1,  'K', -1,  'S', 'M3'], // 0: Clockwork Polka
    ['K', 'M0','S', 'M1','K', 'M2','S', 'M3'], // 1: Ghostly Shuffle
    ['K', -1,  'M1','K', -1,  'M2','S', 'M3']  // 2: Cabaret Tango (3+3+2)
  ],
  cauldron: [
    ['R', -1, -1, -1, 'F', -1, -1, -1], // 0: Clockwork Polka
    ['R', -1, 'F', 'O', 'R', -1, 'F', 'R'], // 1: Ghostly Shuffle
    ['R', -1, -1, 'F', -1, -1, 'O', -1]  // 2: Cabaret Tango (3+3+2)
  ],
  ghost: [
    ['C', -1, -1, -1, -1, -1, -1, -1],       // 0: Clockwork Polka
    [-1, 'A0', -1, 'A1', -1, 'A2', -1, 'A3'], // 1: Ghostly Shuffle
    ['C', -1, -1, 'C', -1, -1, 'A3', -1]     // 2: Cabaret Tango (3+3+2)
  ]
};
```

## 5. Audio output time sync, stop handling, and seamless WAV export
- **Reading the time**: `const now = (audioCtx.getOutputTimestamp?.().contextTime) || audioCtx.currentTime;`
- **Decay calculation**: consume events from `visualQueue` where `event.time <= now`, update `track.lastNoteTime = event.time`, and drive motion with `energy = Math.exp(-(now - track.lastNoteTime) / 0.18)`.
- **Stop and curtain call**: on `Stop`, immediately dispose the timer, stop and disconnect every node in `activeNodes`, and clear `visualQueue`. Then set `stageState = 'curtain_call'` (a 1.8-second bow plus the 💀 skull drop-and-pick-up animation) and close the curtains afterward.
- **Seamless WAV**: place a `StereoDelay (time: (60/bpm)*0.75, fb: 0.22, wet: 0.18)` and a `DynamicsCompressor` on the master bus. Render **64 steps (2 loops)** with an `OfflineAudioContext`, cut out the **second 32 steps (`loopSamples` to `loopSamples * 2`)** where the reverb has built up, and prepend a 44-byte RIFF WAV header.
