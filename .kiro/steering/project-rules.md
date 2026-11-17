# Steering Rules: Jack-o'-Lantern Synth: Monster Puppet Session

> **Single Source of Truth**: The specification for this project is `requirements.md`, `design.md`, and `tasks.md` under `.kiro/specs/monster-ensemble/`. Nothing else overrides them.

## 0. Language
- **English only for all deliverables**: UI text, button labels, descriptions, README, code comments, commit messages, PR text, and design documents are all written in English.
- No multi-language (i18n) support is needed. Do not add translation layers or locale files.
- Reports to the user in chat stay in Japanese.

## 1. Tech stack and dependency constraints
- **Zero external APIs, fully client-side**: Do not use server communication, external API keys, or external audio files (mp3/wav loading). Synthesize every sound with the browser's standard `Web Audio API`, and draw every visual with `HTML5 Canvas` or inline `SVG` + `CSS`.
- **Minimal setup**: Use Vanilla HTML/CSS/JS (ES Modules) or a minimal Vite setup. Do not use external UI libraries or tools such as html2canvas.

## 2. Absolute rules for audio, animation, and stop handling
- **Keep the chord progression**: Every track references the shared harmonic map of the 2-bar (32-step) progression (`Cm -> Ab -> Fm -> G7`), so no combination of parts ever produces dissonance.
- **Ensemble-wide swing and shared timing**: Compute `scheduledTime = baseStepTime + swingOffset` (with the swing delay `swingOffset` added), and pass that same `scheduledTime` to **both** the audio node scheduling and the animation `visualQueue`.
- **Output-time sync (`getOutputTimestamp`)**: In the render loop, read the current time from `audioCtx.getOutputTimestamp().contextTime` (fall back to `audioCtx.currentTime` when it is 0 or undefined), and fire animations from the time the audio is actually output, not from the time it was scheduled.
- **Elapsed-time exponential decay**: Compute the motion intensity `energy` from the elapsed time Δt with `Math.exp(-dt / tau)`, never from frame counts.
- **Complete stop and disposal**: On Stop, do not only dispose the scheduler timer. Immediately call `.stop()` and `.disconnect()` on every scheduled source node in the `activeNodes` set, and empty `visualQueue`, so playback can never double up after a restart.
- **Seamless loop WAV**: When exporting WAV, render two loops (64 steps) with an `OfflineAudioContext` and cut out only the second loop (the last 32 steps), where the reverb has built up, so delay tails do not break at the loop boundary.
