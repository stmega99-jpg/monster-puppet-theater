// The four puppets and all 36 parts (design.md sections 1 and 2).
// Sound parameters are consumed from Task 2 onward. This file only holds the
// display names and short notes used by the UI.

export const PUPPETS = [
  {
    id: 'pumpkin', icon: '🎃', name: 'Pumpkin', role: 'Lead Synth',
    color: '#D97236', accent: '#F7C873',
    slots: [
      { label: 'Eyes', hint: 'Timbre', options: [
        { name: 'Crescent Eyes', note: 'triangle + Sub' },
        { name: 'Wooden Button Eyes', note: 'square' },
        { name: 'Star Cutout Eyes', note: 'detuned saw' },
      ]},
      { label: 'Nose', hint: 'Phrase', options: [
        { name: 'Triangle-Carved Nose', note: 'Clockwork Polka' },
        { name: 'Curly Vine Nose', note: 'Ghostly Shuffle' },
        { name: 'Upside-Down Heart Nose', note: 'Cabaret Tango' },
      ]},
      { label: 'Mouth', hint: 'Playing Style', options: [
        { name: 'Jagged Grin', note: 'Staccato' },
        { name: 'Little Round Mouth', note: 'Vibrato' },
        { name: 'Sly Fang Grin', note: 'Portamento' },
      ]},
    ],
  },
  {
    id: 'skeleton', icon: '💀', name: 'Skeleton', role: 'Drums & Bone Marimba',
    color: '#E8DCC4', accent: '#B5A48B',
    slots: [
      { label: 'Head', hint: 'Drum Tone', options: [
        { name: 'Bent Top Hat', note: 'Wood Kick + Brush' },
        { name: 'Wind-Up Key Head', note: 'Toy Kick + Snappy' },
        { name: 'Tin Crown', note: 'Deep Kick + Rim' },
      ]},
      { label: 'Ribs', hint: 'Beat', options: [
        { name: 'Four-Box Ribs', note: 'Clockwork Polka' },
        { name: 'Brass-Jointed Ribs', note: 'Ghostly Shuffle' },
        { name: 'Cobweb Ribs', note: 'Cabaret Tango' },
      ]},
      { label: 'Mallet', hint: 'Marimba Tone', options: [
        { name: 'Femur Mallet', note: 'Warm Marimba' },
        { name: 'Silver Spoon', note: 'Glassy Xylophone' },
        { name: 'Dry Twig Baton', note: 'Wood Clack' },
      ]},
    ],
  },
  {
    id: 'cauldron', icon: '🧪', name: "Witch's Cauldron", role: 'Acid Bubble Bass',
    color: '#2B303A', accent: '#76A884',
    slots: [
      { label: 'Pot', hint: 'Waveform', options: [
        { name: 'Cat-Footed Iron Cauldron', note: 'sawtooth' },
        { name: 'Patchwork Brass Cauldron', note: 'square + EnvLPF' },
        { name: 'Cracked Ceramic Cauldron', note: 'triangle + Sub' },
      ]},
      { label: 'Ingredient', hint: 'Pattern', options: [
        { name: 'Glowing Poison Mushroom', note: 'Clockwork Polka' },
        { name: 'Wind-Up Frog', note: 'Ghostly Shuffle' },
        { name: 'Starry Eyeball', note: 'Cabaret Tango' },
      ]},
      { label: 'Flame', hint: 'Envelope', options: [
        { name: 'Beeswax Candle Bundle', note: 'Pluck' },
        { name: 'Foxfire Lantern', note: 'Glide' },
        { name: 'Crackling Bramble Logs', note: 'Punch' },
      ]},
    ],
  },
  {
    id: 'ghost', icon: '👻', name: 'Ghost', role: 'Theremin Choir Pad',
    color: '#EAE6DF', accent: '#D98A82',
    slots: [
      { label: 'Hat', hint: 'Voice', options: [
        { name: 'Striped Nightcap', note: 'Theremin Choir' },
        { name: 'Storybook Paper Crown', note: 'Reed Organ' },
        { name: 'Old Lace Veil', note: 'Glass Pad' },
      ]},
      { label: 'Face', hint: 'Voicing', options: [
        { name: 'Gaping Round Mouth', note: 'Clockwork Polka' },
        { name: 'Smiling Slit Eyes', note: 'Ghostly Shuffle' },
        { name: 'Teary Fretful Eyes', note: 'Cabaret Tango' },
      ]},
      { label: 'Item', hint: 'LFO', options: [
        { name: 'Small Brass Lantern', note: 'Tremolo' },
        { name: 'Chained Pocket Watch', note: 'Pitch Vibrato' },
        { name: 'Quill and Sheet Music', note: 'Octave Shimmer' },
      ]},
    ],
  },
];
