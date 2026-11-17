// Ghost art and motion (Task 7): a soft bedsheet ghost that floats, sings and stretches with each chord.
//
// All 9 parts are in the SVG at once. applyGhostParts() shows the selected one per slot:
//   Slot A: hat  (0 Striped Nightcap, 1 Storybook Paper Crown, 2 Old Lace Veil)              -> voice
//   Slot B: face (0 Gaping Round Mouth, 1 Smiling Slit Eyes, 2 Teary Fretful Eyes)           -> voicing
//   Slot C: item (0 Small Brass Lantern, 1 Chained Pocket Watch, 2 Quill and Sheet Music)    -> modulation
//
// Motion comes from CSS variables on the puppet element (set from ghostPose() each frame):
//   --gh-sx, --gh-sy, --gh-lean   squash and stretch of the whole sheet (anchored at the hem)
//   --gh-sus                       0..1, how loudly the pad is singing (opens the mouth, lights the item)
// The ghost floats, so it has no feet: a soft shadow on the floor shrinks as it rises.
// State-dependent rules (dozing pose, bow) live in style.css.

const INK = '#2C1E18';
const STRING = 'rgba(212, 195, 163, 0.35)';
const BLUSH = '#D98A82';
const MOUTH = '#3a1f24';

const f2 = (n) => Number(n.toFixed(2));

// ---------------------------------------------------------------- squash and stretch

const BEAT_HZ = 112 / 60;                // the ghost breathes with the beat

/**
 * The ghost's pose from the engine's detail.ghost ({ sustain 0..1, onset 0..1 }) and the output clock.
 * While a chord is held the sheet breathes (taller and thinner, then shorter and wider) and leans
 * a little, as if harmonizing. Each new note stretches it up for a moment. Width follows height
 * so the sheet keeps about the same volume.
 */
export function ghostPose({ sustain, onset }, now) {
  const breath = Math.sin(2 * Math.PI * BEAT_HZ * 0.5 * now);          // one breath every two beats
  const sy = 1 + sustain * 0.05 * breath + onset * 0.07;
  const sx = 1 - (sy - 1) * 0.85;
  const lean = Math.sin(2 * Math.PI * BEAT_HZ * 0.25 * now) * sustain * 2.6;
  return { sx: f2(sx), sy: f2(sy), lean: f2(lean), sus: f2(sustain) };
}

export function setGhostVars(el, pose) {
  el.style.setProperty('--gh-sx', pose.sx);
  el.style.setProperty('--gh-sy', pose.sy);
  el.style.setProperty('--gh-lean', `${pose.lean}deg`);
  el.style.setProperty('--gh-sus', pose.sus);
}

// ---------------------------------------------------------------- body

const BODY = 'M30 212 C24 168 26 128 40 114 C48 106 58 103 70 103 C82 103 92 106 100 114 C114 128 116 168 110 212 '
  + 'Q102 224 94 212 Q86 224 78 212 Q70 224 62 212 Q54 224 46 212 Q38 224 30 212Z';

const ARM_L = 'M33 152 C25 158 21 166 22 175';
const ARM_R = 'M107 152 C115 158 119 166 119 175';
const arm = (d) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="14.4" stroke-linecap="round"/>
      <path d="${d}" fill="none" stroke="url(#gh-sheet)" stroke-width="10.4" stroke-linecap="round"/>`;

// ---------------------------------------------------------------- Slot C: items

const ITEMS = [
  // 0 Small Brass Lantern: hangs from the right hand and glows brighter while the ghost sings
  `<g class="gh-item gh-item-0">
    <ellipse class="gh-lit" cx="120" cy="200" rx="22" ry="20" fill="url(#gh-halo)"/>
    <path d="M120 178 V183" stroke="${INK}" stroke-width="1.6"/>
    <circle cx="120" cy="184.5" r="3" fill="none" stroke="${INK}" stroke-width="3.2"/><circle cx="120" cy="184.5" r="3" fill="none" stroke="url(#gh-brass)" stroke-width="1.4"/>
    <path d="M113 193 L116 187.5 H124 L127 193Z" fill="url(#gh-brass)" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M114 193 H126 V209 H114Z" class="gh-glass" fill="rgba(255,226,150,0.55)" stroke="${INK}" stroke-width="1.8"/>
    <path class="gh-flame" d="M120 207 C115.5 204 116.5 199 120 195 C123.5 199 124.5 204 120 207Z" fill="#FFD66B" stroke="#E0883A" stroke-width="0.7"/>
    <path class="gh-flame" d="M120 207 C118 205.5 118.4 203 120 201 C121.6 203 122 205.5 120 207Z" fill="#FFF6D6"/>
    <path d="M112 209 H128 V213.5 H112Z" fill="url(#gh-brass)" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M118 194 V208 M122 194 V208" stroke="${INK}" stroke-width="1" opacity="0.5"/>
  </g>`,
  // 1 Chained Pocket Watch: swings on its chain, the hand ticks
  `<g class="gh-item gh-item-1">
    <g class="gh-swing">
      <path d="M120 178 C127 184 114 189 120 194" fill="none" stroke="${INK}" stroke-width="3.2" stroke-linecap="round"/>
      <path d="M120 178 C127 184 114 189 120 194" fill="none" stroke="#E4C98A" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="2.2 1.6"/>
      <rect x="117.6" y="192" width="4.8" height="4.4" rx="1.4" fill="url(#gh-brass)" stroke="${INK}" stroke-width="1.2"/>
      <circle cx="120" cy="207" r="11" fill="url(#gh-brass)" stroke="${INK}" stroke-width="1.9"/>
      <circle cx="120" cy="207" r="8.2" fill="#F6EBD2" stroke="${INK}" stroke-width="1"/>
      <path d="M120 199.8 v1.8 M120 212.4 v1.8 M112.8 207 h1.8 M125.4 207 h1.8" stroke="${INK}" stroke-width="0.9" stroke-linecap="round"/>
      <path d="M120 207 L120 201.4" stroke="${INK}" stroke-width="1.3" stroke-linecap="round"/>
      <path class="gh-hand" d="M120 207 L120 202.4" stroke="#8E2A44" stroke-width="1.1" stroke-linecap="round"/>
      <circle cx="120" cy="207" r="1.2" fill="${INK}"/>
      <path d="M113.6 202 C114.6 199.6 117 198.2 119 198" fill="none" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity="0.6"/>
    </g>
  </g>`,
  // 2 Quill and Sheet Music: a feather quill in the right hand, a sheet of music held up on the left
  `<g class="gh-item gh-item-2">
    <g class="gh-quill">
      <path d="M120 176 C115 156 118 136 131 117 C139 134 135 156 120 176Z" fill="#F7F2E6" stroke="${INK}" stroke-width="1.7" stroke-linejoin="round"/>
      <path d="M120 176 C123 154 127 134 131 117" fill="none" stroke="${INK}" stroke-width="1.4" stroke-linecap="round"/>
      <path d="M124.2 160 l5 -3 M125.6 150 l5.4 -3.4 M127 140 l4.6 -3.2 M122.2 158 l-5 -3 M121.4 148 l-4 -4.6" stroke="${INK}" stroke-width="0.8" stroke-linecap="round" opacity="0.55"/>
      <path d="M120 176 l-1.2 4.2 l2.8 -1.2Z" fill="${INK}"/>
    </g>
    <g class="gh-sheet" transform="rotate(-8 19 170)">
      <path d="M5 153 H31 L33 157 V184 H5Z" fill="#F2E6D0" stroke="${INK}" stroke-width="1.7" stroke-linejoin="round"/>
      <path d="M31 153 V157 H33" fill="#D8C7A4" stroke="${INK}" stroke-width="1.1" stroke-linejoin="round"/>
      <path d="M8 162 H30 M8 165 H30 M8 168 H30 M8 171 H30 M8 174 H30" stroke="${INK}" stroke-width="0.7" opacity="0.7"/>
      <g class="gh-note" fill="${INK}" stroke="${INK}" stroke-width="0.9">
        <ellipse cx="12" cy="170" rx="2" ry="1.5" stroke="none"/><path d="M13.8 170 V160.6" fill="none"/>
        <ellipse cx="20" cy="166.4" rx="2" ry="1.5" stroke="none"/><path d="M21.8 166.4 V157.4" fill="none"/>
        <ellipse cx="27" cy="173" rx="2" ry="1.5" stroke="none"/><path d="M28.8 173 V164" fill="none"/>
        <path d="M13.8 160.6 L21.8 157.4" fill="none"/>
      </g>
    </g>
  </g>`,
];

// ---------------------------------------------------------------- Slot A: hats

const CAP = 'M38 114 C38 96 52 80 74 70 C72 84 92 98 104 114 Q70 104 38 114Z';
const capStripes = Array.from({ length: 7 }, (_, i) => `<path d="M${28 + i * 15} 122 L${52 + i * 15} 62 L${60 + i * 15} 62 L${36 + i * 15} 122Z" fill="#8E2A44"/>`).join('');

const HATS = [
  // 0 Striped Nightcap: a floppy striped cap with a fluffy pompom
  `<g class="gh-hat gh-hat-0">
    <path d="M74 0 V62" stroke="${STRING}" stroke-width="1.4" fill="none"/>
    <g class="gh-cap">
      <path d="${CAP}" fill="#F2E6D0"/>
      <g clip-path="url(#gh-cap-clip)">${capStripes}</g>
      <path d="${CAP}" fill="none" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M48 98 C54 90 62 84 70 80" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity="0.3"/>
      <path d="M35 113 Q70 102 107 113 Q70 124 35 113Z" fill="#F7EFDD" stroke="${INK}" stroke-width="1.9" stroke-linejoin="round"/>
      <g fill="${INK}" opacity="0.35"><circle cx="48" cy="113" r="0.9"/><circle cx="58" cy="115" r="0.9"/><circle cx="70" cy="116" r="0.9"/><circle cx="82" cy="115" r="0.9"/><circle cx="93" cy="113" r="0.9"/></g>
      <g class="gh-pom">
        <circle cx="74" cy="66" r="6.6" fill="#F7EFDD" stroke="${INK}" stroke-width="1.8"/>
        <path d="M70 63 q2 -3 5 -1 M71 69 q3 2 6 -1" fill="none" stroke="${INK}" stroke-width="0.9" stroke-linecap="round" opacity="0.5"/>
      </g>
    </g>
  </g>`,
  // 1 Storybook Paper Crown: folded paper, gold crayon zigzag, a little crooked
  `<g class="gh-hat gh-hat-1">
    <path d="M70 0 V84" stroke="${STRING}" stroke-width="1.4" fill="none"/>
    <g class="gh-cap"><g transform="rotate(-5 70 108)">
      <path d="M42 112 L46 92 L56 102 L63 86 L70 98 L77 86 L84 102 L94 92 L98 112 Q70 119 42 112Z" fill="#EAD9A8" stroke="${INK}" stroke-width="1.9" stroke-linejoin="round"/>
      <path d="M46 92 L50 112 M63 86 L66 114 M77 86 L74 114 M94 92 L90 112" stroke="#B9A56E" stroke-width="0.9" opacity="0.7"/>
      <path d="M44 108 L51 103 L57 108 L63 103 L70 108 L77 103 L83 108 L89 103 L96 108" fill="none" stroke="#C5A059" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="46" cy="92.5" r="2.4" fill="#C0392B" stroke="${INK}" stroke-width="0.9"/><circle cx="63" cy="86.5" r="2.4" fill="#3C78C8" stroke="${INK}" stroke-width="0.9"/>
      <circle cx="77" cy="86.5" r="2.4" fill="#3E9A5A" stroke="${INK}" stroke-width="0.9"/><circle cx="94" cy="92.5" r="2.4" fill="#C0392B" stroke="${INK}" stroke-width="0.9"/>
      <path d="M52 99 q3 -2 5 1" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity="0.5"/>
    </g></g>
  </g>`,
  // 2 Old Lace Veil: a draped lace hood with a small wreath of flowers
  `<g class="gh-hat gh-hat-2">
    <path d="M70 0 V92" stroke="${STRING}" stroke-width="1.4" fill="none"/>
    <g class="gh-cap">
      <path fill-rule="evenodd" d="M70 96 C44 96 24 116 22 170 Q29 180 36 170 Q43 180 50 170 Q57 180 64 170 Q70 180 76 170 Q83 180 90 170 Q97 180 104 170 Q111 180 118 170 C116 116 96 96 70 96Z M44 136 A26 28 0 1 0 96 136 A26 28 0 1 0 44 136Z"
            fill="rgba(255,255,255,0.7)" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M26 164 Q29 172 36 164 M40 166 Q43 172 50 166 M56 166 Q58 172 64 166 M76 166 Q82 172 90 166 M96 166 Q99 172 104 166 M110 164 Q114 172 118 164" fill="none" stroke="#B9B2A6" stroke-width="1" stroke-dasharray="2 1.6" opacity="0.9"/>
      <g fill="#D3CCBE" opacity="0.8"><circle cx="31" cy="140" r="1.6"/><circle cx="36" cy="154" r="1.4"/><circle cx="29" cy="156" r="1.2"/><circle cx="109" cy="140" r="1.6"/><circle cx="104" cy="154" r="1.4"/><circle cx="111" cy="156" r="1.2"/><circle cx="40" cy="118" r="1.3"/><circle cx="100" cy="118" r="1.3"/></g>
      <path d="M44 136 A26 28 0 0 1 96 136" fill="none" stroke="#fff" stroke-width="1.2" stroke-dasharray="1.6 2" opacity="0.9"/>
      <g stroke="${INK}" stroke-width="0.9">
        <path d="M46 106 q-6 -4 -9 1 q6 5 9 -1Z" fill="#7C9A62"/><path d="M94 106 q6 -4 9 1 q-6 5 -9 -1Z" fill="#7C9A62"/>
        <circle cx="52" cy="104" r="3.6" fill="#F2B5B0"/><circle cx="61" cy="99" r="3.6" fill="#fff"/><circle cx="70" cy="97" r="4.2" fill="#F2B5B0"/><circle cx="79" cy="99" r="3.6" fill="#fff"/><circle cx="88" cy="104" r="3.6" fill="#F2B5B0"/>
      </g>
      <g fill="#F7C873"><circle cx="52" cy="104" r="1"/><circle cx="61" cy="99" r="1"/><circle cx="70" cy="97" r="1.2"/><circle cx="79" cy="99" r="1"/><circle cx="88" cy="104" r="1"/></g>
    </g>
  </g>`,
];

// ---------------------------------------------------------------- Slot B: faces

const FACES = [
  // 0 Gaping Round Mouth: a big surprised "Ooo", like a choir singer
  `<g class="gh-face gh-face-0">
    <g class="gh-blush" fill="${BLUSH}" opacity="0.5"><ellipse cx="46" cy="149" rx="7" ry="4.4"/><ellipse cx="94" cy="149" rx="7" ry="4.4"/></g>
    <g class="gh-open"><ellipse cx="56" cy="134" rx="4.2" ry="6.2" fill="${INK}"/><ellipse cx="84" cy="134" rx="4.2" ry="6.2" fill="${INK}"/>
      <circle cx="57.4" cy="131.6" r="1.4" fill="#fff"/><circle cx="85.4" cy="131.6" r="1.4" fill="#fff"/></g>
    <g class="gh-closed" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"><path d="M51 135 Q56 140 61 135"/><path d="M79 135 Q84 140 89 135"/></g>
    <g class="gh-mouth"><ellipse cx="70" cy="158" rx="7.6" ry="9.6" fill="${MOUTH}" stroke="${INK}" stroke-width="1.6"/><ellipse cx="70" cy="163.4" rx="4.6" ry="3.8" fill="#C26A6A"/></g>
  </g>`,
  // 1 Smiling Slit Eyes: contented arches and a wide smile
  `<g class="gh-face gh-face-1">
    <g class="gh-blush" fill="${BLUSH}" opacity="0.55"><ellipse cx="45" cy="150" rx="8" ry="5"/><ellipse cx="95" cy="150" rx="8" ry="5"/></g>
    <g class="gh-open" fill="none" stroke="${INK}" stroke-width="2.8" stroke-linecap="round"><path d="M49 138 Q56 127 63 138"/><path d="M77 138 Q84 127 91 138"/></g>
    <g class="gh-closed" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"><path d="M49 133 Q56 141 63 133"/><path d="M77 133 Q84 141 91 133"/></g>
    <g class="gh-mouth"><path d="M58 151 Q70 169 82 151 Q70 157 58 151Z" fill="${MOUTH}" stroke="${INK}" stroke-width="1.7" stroke-linejoin="round"/></g>
  </g>`,
  // 2 Teary Fretful Eyes: worried brows, big wet eyes, a wobbly mouth, tears that run
  `<g class="gh-face gh-face-2">
    <g class="gh-blush" fill="${BLUSH}" opacity="0.4"><ellipse cx="46" cy="152" rx="6" ry="3.6"/><ellipse cx="94" cy="152" rx="6" ry="3.6"/></g>
    <g class="gh-open">
      <path d="M46 128 Q55 121 63 120 M94 128 Q85 121 77 120" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>
      <ellipse cx="56" cy="137" rx="5.4" ry="6.4" fill="${INK}"/><ellipse cx="84" cy="137" rx="5.4" ry="6.4" fill="${INK}"/>
      <circle cx="54.4" cy="134.4" r="1.9" fill="#fff"/><circle cx="82.4" cy="134.4" r="1.9" fill="#fff"/><circle cx="58.2" cy="140" r="0.9" fill="#fff"/><circle cx="86.2" cy="140" r="0.9" fill="#fff"/>
      <path d="M50 143 Q56 147 62 143 M78 143 Q84 147 90 143" fill="none" stroke="#9FD3E6" stroke-width="1.1" stroke-linecap="round"/>
    </g>
    <g class="gh-closed" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"><path d="M50 137 Q56 142 62 137"/><path d="M78 137 Q84 142 90 137"/></g>
    <g class="gh-mouth"><path d="M62 161 Q66 157 70 161 Q74 165 78 161" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/></g>
    <g class="gh-tears" fill="#BFE6F5" stroke="#6FA8C4" stroke-width="0.8">
      <path class="gh-tear" d="M49 146 C45 152 46 157 49 157 C52 157 53 152 49 146Z"/><path class="gh-tear gh-tear-r" d="M91 146 C87 152 88 157 91 157 C94 157 95 152 91 146Z"/>
    </g>
  </g>`,
];

const PARTS = { hat: HATS, face: FACES, item: ITEMS };
const PART_CLASS = { hat: 'gh-hat', face: 'gh-face', item: 'gh-item' };

// ---------------------------------------------------------------- the puppet

export function ghostSVG(label) {
  return `
<svg viewBox="0 0 140 240" role="img" aria-label="${label}">
  <defs>
    <radialGradient id="gh-sheet" cx="40%" cy="28%" r="85%">
      <stop offset="0" stop-color="#FFFFFF"/><stop offset="0.55" stop-color="#EAE6DF"/><stop offset="1" stop-color="#BDB6AA"/>
    </radialGradient>
    <linearGradient id="gh-brass" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#E4C98A"/><stop offset="0.5" stop-color="#C5A059"/><stop offset="1" stop-color="#8E6F33"/>
    </linearGradient>
    <radialGradient id="gh-halo"><stop offset="0" stop-color="#FFD66B" stop-opacity="0.7"/><stop offset="1" stop-color="#FFD66B" stop-opacity="0"/></radialGradient>
    <clipPath id="gh-cap-clip"><path d="${CAP}"/></clipPath>
  </defs>

  <!-- hemp control strings: tied to the shoulders (the centre string belongs to the hat) -->
  <g stroke="${STRING}" stroke-width="1.4" fill="none">
    <path d="M42 0 L33 146"/><path d="M98 0 L107 146"/>
  </g>
  <rect x="30" y="-2" width="80" height="8" rx="3" fill="#6E4B3A" stroke="${INK}" stroke-width="1.5"/>

  <g class="body">
    <ellipse class="gh-shadow" cx="70" cy="229" rx="34" ry="4" fill="#000" opacity="0.25"/>
    <g class="gh-float">
      <g class="gh-squash">
        ${arm(ARM_L)}
        ${arm(ARM_R)}
        <path d="${BODY}" fill="url(#gh-sheet)" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
        <g fill="none" stroke="#9E978B" stroke-width="1.2" stroke-linecap="round" opacity="0.5">
          <path d="M44 176 C42 190 43 200 46 208"/><path d="M96 170 C99 186 98 198 94 208"/><path d="M70 186 C69 195 69 203 70 210"/>
        </g>
        <path d="M38 124 C36 138 36 150 38 162" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.5"/>
        ${FACES.join('\n        ')}
        ${ITEMS.join('\n        ')}
        ${HATS.join('\n        ')}
      </g>
    </g>
  </g>

  <g class="zzz" font-family="Georgia, serif" font-style="italic" fill="#F2E6D0">
    <text x="104" y="100" font-size="16">z</text><text x="114" y="84" font-size="20">Z</text><text x="124" y="64" font-size="24">Z</text>
  </g>
</svg>`;
}

/** Show the selected hat, face and item variants (slots = [A, B, C]). */
export function applyGhostParts(el, slots) {
  const [hat, face, item] = slots;
  const pick = { hat, face, item };
  Object.entries(PARTS).forEach(([kind, list]) => {
    list.forEach((_, i) => {
      el.querySelectorAll(`.${PART_CLASS[kind]}-${i}`).forEach((node) => {
        node.style.display = i === pick[kind] ? 'inline' : 'none';
      });
    });
  });
}

/**
 * The few rules the ghost needs when it is rendered as a standalone SVG image (the poster), where
 * the page stylesheet does not apply: awake, eyes open, and caught in a gentle stretch mid-note.
 */
export const GHOST_STATIC_CSS = `
  .gh-closed { display: none; }
  .gh-squash { transform-box: view-box; transform-origin: 70px 214px; transform: scale(0.97, 1.04); }
`;
