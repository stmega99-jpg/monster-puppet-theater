# monster-puppet-theater
A whimsical haunted puppet theater where customizable monsters come together to make music. Built with Kiro for Kiroween 2026.

## Run locally

ES Modules are used, so open the page through a static server (not `file://`):

```
python3 -m http.server 8000   # then open http://localhost:8000
```

## Status

- [x] Task 1: antique theater stage UI, curtain open/close, curtain call, 3-slot UI
- [x] Task 2: four-track Web Audio engine (harmonic map, ensemble swing, strict stop, output-time sync)
- [x] Task 3: pumpkin puppet (9 face parts, timbres, mouth and candle motion, poke, dozing pose)
- [x] Task 4: band name generator, storybook poster (PNG) and seamless loop recording (WAV)
- [x] Task 5: skeleton drummer (9 parts, Bone Marimba, rib tapping, dozing pose) and the skull tumble gag at the curtain call
- [x] Task 6: witch's cauldron (9 parts, Acid Bubble Bass, poison bubbles that pop, simmering dozing pose, bow)
- [x] Task 7: ghost (9 parts, Theremin Choir Pad, squash and stretch, dozing pose, bow), four-piece volume balance and the finished four-member poster
- [ ] Task 8: integration testing and edge cases, see `.kiro/specs/monster-ensemble/tasks.md`
