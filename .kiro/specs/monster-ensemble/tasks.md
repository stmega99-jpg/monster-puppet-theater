# Implementation Tasks

## Phase 1: Antique puppet stage foundation + 🎃 Pumpkin MVP + export features

- [x] 1. Build the antique wood-carved theater UI with curtain open/close and the bow (curtain call) animation (_Requirements: 1.1, 1.2, 1.3_)
  - Build the framed stage, velvet curtains, candle footlights, and the 3-slot UI using the storybook/wood palette (`#1A1412`, `#4A3228`, `#6B1D2F`, `#F2E6D0`).
- [x] 2. Implement the shared four-track Web Audio engine with a harmonic map and strict stop/sync handling (_Requirements: 1.2, 1.3, 3.1_)
  - Implement the harmonic map `Cm -> Ab -> Fm -> G7` (4-note chord arrays, bass in the C2 to Ab3 range), ensemble-wide unified swing, master delay + compressor, bulk disposal of `activeNodes`, and `visualQueue` synchronization based on `getOutputTimestamp()` (sharing the swing-adjusted time).
- [x] 3. 🎃 Pumpkin puppet (Lead Synth): draw the 3 slots x 3 parts (9 parts), mouth-flap and poke-triggered motion (_Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2_)
  - Draw eyes (crescent/button/star), noses (Polka/Shuffle/Tango), and mouths (jagged/round/fanged), with matching timbre changes. Implement mouth flapping and candle glow, the lights-out dozing pose, poking that briefly wakes the puppet to play one note even while muted, and the bow at curtain down.
- [x] 4. Implement the band name generator, the storybook performance poster (PNG) export, and the seamless loop WAV export (_Requirements: 4.1, 4.2, 4.3_)
  - Implement alias generation, saving a parchment-style poster as PNG, and seamless `.wav` output by rendering two loops in an `OfflineAudioContext` and cutting out the second half.

## Phase 2: Monster band members (💀, 🧪, 👻) join one by one

- [x] 5. Add all 9 parts of the 💀 Skeleton drummer (Bone Marimba) and the "skull tumbles off at the curtain-call bow" gag (_Requirements: 1.4, 2.1, 2.3, 3.1, 3.2_)
  - Implement the head (top hat/wind-up key/tin crown), ribs (four boxes/brass joints/cobweb), and mallet (bone/silver spoon/twig), rib rows 1 to 4 tapping (`M0..M3` = `chord[0..3]`), the hugging-knees dozing pose, and **the curtain-call gag where the skull rolls off and the Skeleton scrambles to pick it up**.
- [x] 6. Add all 9 parts of the 🧪 Witch's Cauldron bassist (Acid Bubble Bass) (_Requirements: 2.1, 2.3, 3.1, 3.2_)
  - Implement the pot (cat-footed iron/patchwork brass/ceramic), ingredient (poison mushroom/frog/eyeball), and flame (candles/foxfire/bramble logs), the poison bubble particles and pop effects on notes, the simmering dozing pose, and the bow.
- [x] 7. Add all 9 parts of the 👻 Ghost choir (Theremin Choir Pad) and balance the four-piece ensemble (_Requirements: 2.1, 2.3, 3.1, 3.2_)
  - Implement the hat (nightcap/paper crown/veil), face (round mouth/slit eyes/teary eyes), and item (lantern/pocket watch/quill), the soft squash and stretch, the Zzz dozing pose, and the bow. Then finish the poster so it shows all four members.

## Phase 3: Integration testing and edge-case verification

- [ ] 8. Verify repeated play, rapid stop, mute behavior, and the WAV loop boundary (_Requirements: 1.2, 1.3, 1.4, 2.4, 4.3_)
  - **8.1 Play/Stop/bow interruption**: Confirm that mashing Play and Stop causes no double playback or lingering sound, and that pressing Play in the middle of the curtain call (skull tumble) restarts normally and immediately.
  - **8.2 Mute and poke**: Confirm that a muted puppet stays silent and dozing during loop playback, and that only a direct click ("poke") makes it open its eyes briefly, play one note, and return to dozing.
  - **8.3 Seamless WAV loop boundary**: Confirm that the exported WAV has exactly one loop's worth of samples (32 steps), that the delay reverb carries over into the start, and that looping it produces no cut-offs or silent gaps.
