# Requirements: Jack-o'-Lantern Synth: Monster Puppet Session

## Overview
An interactive music toy set in a miniature Haunted Puppet Theater with antique wood-carved puppets and a faded storybook look. The user customizes four monster puppets (🎃 Pumpkin, 💀 Skeleton, 🧪 Cauldron, 👻 Ghost), has them perform a gothic ensemble, and takes home a performance poster (PNG) and a seamless loop recording (WAV).

## Requirements (EARS notation)

### Req 1: Puppet stage with curtain-up and curtain-down bow (curtain call)
- **1.1**: WHEN the app starts THE SYSTEM SHALL display a puppet stage with an antique wood-carved frame, crimson velvet curtains, and candle footlights at the front.
- **1.2**: WHEN the user presses the "Play" button THE SYSTEM SHALL reset any scheduled nodes and timers, resume the `AudioContext`, open the curtains, light the footlights, and start a synchronized four-track looping ensemble.
- **1.3**: WHEN the user presses the "Stop" button during playback THE SYSTEM SHALL immediately discard scheduled notes and the visual queue, play a curtain call (all puppets bowing together) for about 1.8 seconds, and then close the curtains.
- **1.4**: WHEN the curtain call plays THE SYSTEM SHALL, if the Skeleton puppet is active, show its skull rolling onto the floor from the force of the bow (with a light xylophone drop sound effect), then the Skeleton hurriedly picking it up and putting it back on its head.

### Req 2: Shared 3-slot customization and direct poking (including while muted)
- **2.1**: WHEN the user selects a monster puppet THE SYSTEM SHALL show a common 3-slot UI (Slot A: timbre/waveform, Slot B: rhythm/phrase, Slot C: expression/playing style, 3 options each, 36 parts in total) together with Mute / Solo buttons.
- **2.2**: WHEN the user changes a slot THE SYSTEM SHALL immediately update the puppet's appearance and sound pattern, and play one preview note with the new timbre.
- **2.3**: WHEN the user directly clicks ("pokes") a puppet on stage THE SYSTEM SHALL play one one-shot note with that monster's current timbre and trigger the matching performance motion, whether the song is playing or stopped.
- **2.4**: WHILE a puppet is Muted (dozing) and the user pokes it THE SYSTEM SHALL keep the loop's Mute state, have the puppet snap awake ("Huh!") and play exactly one note like a sleep-talk, and return to the dozing pose after the note decays.

### Req 3: Output-time-synchronized motion and dozing idle
- **3.1**: WHILE a note is sounding THE SYSTEM SHALL compute an exponential decay `energy = Math.exp(-dt / tau)` from the elapsed time Δt since the audio output time given by `getOutputTimestamp()`, and drive each puppet's own motion with it:
  - **🎃 Pumpkin (Lead)**: the mouth opens and closes on each note and the candle inside pulses.
  - **💀 Skeleton (Drums/Marimba)**: the head nods on kicks, and on marimba notes both arms strike the puppet's own rib (rows 1 to 4) at a height that matches the pitch.
  - **🧪 Cauldron (Bass)**: poison bubbles rise from the bottom of the pot on low notes, pop at the surface, and release steam.
  - **👻 Ghost (Pad/Choir)**: the body squashes and stretches vertically and horizontally while chords sound, as if harmonizing.
- **3.2**: WHILE a track is Muted (or silenced by another track's Solo) and not sounding THE SYSTEM SHALL change that puppet to a dozing pose (eyes closed, Zzz shown, light off, hugging its knees, and so on).

### Req 4: Performance poster (PNG) and seamless loop audio (WAV) export
- **4.1**: WHEN the combination of parts is decided THE SYSTEM SHALL automatically generate and display a monster band name ("Band Name") and a program title ("Song Title / Genre") from the slot combination.
- **4.2**: WHEN the user presses "Save Poster (PNG)" THE SYSTEM SHALL download a storybook-style performance poster, drawn on a Canvas with the puppet lineup, band name, and song title, as a `.png` file.
- **4.3**: WHEN the user presses "Export Loop (WAV)" THE SYSTEM SHALL render two loops (64 steps) with an `OfflineAudioContext`, cut out the second loop (the last 32 steps) in which the delay reverb has naturally built up, and download it as a seamless-loop `.wav` file.
