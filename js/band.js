// Band name, tagline, song title and genre generator (Req 4.1).
// Everything is derived from the current slot combination, so the same parts always give the same names.
//
//   Band name  = "The {pumpkin eyes} {skeleton head}" + "of the {cauldron pot}"
//   Tagline    = "featuring {ghost hat}"
//   Song title = "{pumpkin mouth} {ghost item} of the {cauldron ingredient}"
//   Genre      = "{pumpkin nose phrase} in C Minor"   (the lead decides the phrase)

import { PUPPETS } from './parts.js';
import { BPM } from './music.js';

const PUMPKIN_EYES  = ['Moonlit', 'Button-Eyed', 'Starstruck'];
const SKELETON_HEAD = ['Gentlemen', 'Automatons', 'Monarchs'];
const CAULDRON_POT  = ['Iron Cauldron', 'Patchwork Cauldron', 'Cracked Cauldron'];
const GHOST_HAT     = ['a Ghost in a Striped Nightcap', 'a Ghost in a Paper Crown', 'a Ghost in an Old Lace Veil'];

const PUMPKIN_MOUTH = ['Grinning', 'Whispering', 'Sneaky'];
const GHOST_ITEM    = ['Lantern', 'Pocket Watch', 'Quill'];
const CAULDRON_FOOD = ['Poison Mushroom', 'Wind-Up Frog', 'Starry Eyeball'];
const PHRASE        = ['Clockwork Polka', 'Ghostly Shuffle', 'Cabaret Tango'];

/** @param {Array} tracks [{ id, slots }] in PUPPETS order */
export function generateBandInfo(tracks) {
  const [pumpkin, skeleton, cauldron, ghost] = tracks.map((t) => t.slots);

  const nameTop = `The ${PUMPKIN_EYES[pumpkin[0]]} ${SKELETON_HEAD[skeleton[0]]}`;
  const nameBottom = `of the ${CAULDRON_POT[cauldron[0]]}`;

  return {
    nameTop,
    nameBottom,
    bandName: `${nameTop} ${nameBottom}`,
    tagline: `featuring ${GHOST_HAT[ghost[0]]}`,
    songTitle: `${PUMPKIN_MOUTH[pumpkin[2]]} ${GHOST_ITEM[ghost[2]]} of the ${CAULDRON_FOOD[cauldron[1]]}`,
    genre: `${PHRASE[pumpkin[1]]} in C Minor`,
    bpm: BPM,
    cast: PUPPETS.map((p, i) => ({
      name: p.name,
      role: p.role,
      parts: p.slots.map((slot, s) => slot.options[tracks[i].slots[s]].name),
    })),
  };
}

/** A safe file name stem: "The Moonlit Gentlemen of the Iron Cauldron" -> "the-moonlit-gentlemen-of-the-iron-cauldron". */
export function fileStem(info) {
  return info.bandName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
