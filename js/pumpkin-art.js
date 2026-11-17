// Pumpkin puppet art (Task 3): a carved, hand-painted wooden jack-o'-lantern marionette.
//
// Every carved feature is two layers: a dark `hole` and a `glow` layer on top. The glow layer's
// opacity is `--candle`, which style.css derives from `--energy` (audio-synced), so the candle
// inside pulses with each note and goes dark when the puppet dozes off.
//
// All 9 face parts are in the SVG at once. applyPumpkinParts() shows the selected one per slot:
//   Slot A: eyes  (0 Crescent, 1 Wooden Button, 2 Star Cutout)
//   Slot B: nose  (0 Triangle-Carved, 1 Curly Vine, 2 Upside-Down Heart)
//   Slot C: mouth (0 Jagged Grin, 1 Little Round Mouth, 2 Sly Fang Grin)

const INK = '#2C1E18';
const STRING = 'rgba(212, 195, 163, 0.35)';

const carved = (d) => `<path class="pk-hole" d="${d}"/><path class="pk-glow" d="${d}"/>`;

function starPath(cx, cy, outer, inner) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return `M${pts.join(' L')}Z`;
}

function button(cx, cy) {
  return `<g transform="translate(${cx} ${cy})">
    <circle r="9.2" fill="#5a3b28" opacity="0.55" cy="1.2"/>
    <circle r="8.6" fill="url(#pk-wood)" stroke="${INK}" stroke-width="1.6"/>
    <circle r="6.1" fill="none" stroke="#5a3b28" stroke-width="1"/>
    <circle cx="-2.3" cy="-2.3" r="1.1" fill="${INK}"/><circle cx="2.3" cy="-2.3" r="1.1" fill="${INK}"/>
    <circle cx="-2.3" cy="2.3" r="1.1" fill="${INK}"/><circle cx="2.3" cy="2.3" r="1.1" fill="${INK}"/>
    <path d="M-2.3 -2.3 L2.3 2.3 M2.3 -2.3 L-2.3 2.3" stroke="#D4C3A3" stroke-width="0.9" stroke-linecap="round"/>
  </g>`;
}

const EYES = [
  // 0 Crescent Eyes: happy arches
  `<g class="pk-eyes pk-eyes-0">${carved('M43 144 C46 129 61 129 64 144 C58 136 49 136 43 144Z')}${carved('M97 144 C94 129 79 129 76 144 C82 136 91 136 97 144Z')}</g>`,
  // 1 Wooden Button Eyes: stitched-on buttons (not carved, so they do not glow)
  `<g class="pk-eyes pk-eyes-1">${button(53, 140)}${button(87, 140)}</g>`,
  // 2 Star Cutout Eyes
  `<g class="pk-eyes pk-eyes-2">${carved(starPath(53, 139.5, 10.5, 4.4))}${carved(starPath(87, 139.5, 10.5, 4.4))}</g>`,
];

const NOSES = [
  // 0 Triangle-Carved Nose
  `<g class="pk-nose pk-nose-0">${carved('M70 147 L62.5 161 L77.5 161Z')}</g>`,
  // 1 Curly Vine Nose: a tendril curled into the face, with a tiny leaf
  `<g class="pk-nose pk-nose-1">
    <path d="M70 146 C62 149 62 158 69 158.5 C75 158 75.5 152 71 151.5 C68 151.5 67.5 154.5 70 155"
          fill="none" stroke="#5f6b3a" stroke-width="3.2" stroke-linecap="round"/>
    <path d="M70 146 C62 149 62 158 69 158.5 C75 158 75.5 152 71 151.5 C68 151.5 67.5 154.5 70 155"
          fill="none" stroke="#8a9a55" stroke-width="1.1" stroke-linecap="round"/>
    <path d="M75 147 q9 -5 12 2 q-8 5 -12 -2z" fill="#76865a" stroke="${INK}" stroke-width="1.2"/>
  </g>`,
  // 2 Upside-Down Heart Nose: the point is at the top, the two lobes at the bottom
  `<g class="pk-nose pk-nose-2">${carved('M70 146.5 C59.5 152 59.5 164 66 164 C69 164 70 162 70 160 C70 162 71 164 74 164 C80.5 164 80.5 152 70 146.5Z')}</g>`,
];

const MOUTHS = [
  // 0 Jagged Grin: opens downward from the tooth line
  `<g class="pk-mouth pk-mouth-0">${carved('M45 164 L52 171 L58 164 L64 172 L70 164 L76 172 L82 164 L88 171 L95 164 C95 182 84 189 70 189 C56 189 45 182 45 164Z')}</g>`,
  // 1 Little Round Mouth: opens around its center
  `<g class="pk-mouth pk-mouth-1">${carved('M62 175 a8 9 0 1 0 16 0 a8 9 0 1 0 -16 0Z')}</g>`,
  // 2 Sly Fang Grin: crescent smile with two bone fangs that drop as it opens
  `<g class="pk-mouth-2-wrap">
    <g class="pk-mouth pk-mouth-2">${carved('M47 166 C55 181 85 181 93 166 C88 189 52 189 47 166Z')}</g>
    <g class="pk-fangs" fill="#F2E6D0" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round">
      <path d="M53.5 171 L62 173 L58 183Z"/><path d="M78 173 L86.5 171 L82 183Z"/>
    </g>
  </g>`,
];

const PARTS = { eyes: EYES, nose: NOSES, mouth: MOUTHS };

export function pumpkinSVG(label) {
  return `
<svg viewBox="0 0 140 240" role="img" aria-label="${label}">
  <defs>
    <radialGradient id="pk-skin" cx="36%" cy="30%" r="80%">
      <stop offset="0" stop-color="#F2A55E"/><stop offset="0.5" stop-color="#D97236"/><stop offset="1" stop-color="#A24D1E"/>
    </radialGradient>
    <radialGradient id="pk-skin-back" cx="40%" cy="30%" r="80%">
      <stop offset="0" stop-color="#C5652C"/><stop offset="1" stop-color="#8A3C16"/>
    </radialGradient>
    <radialGradient id="pk-glow" cx="50%" cy="45%" r="62%">
      <stop offset="0" stop-color="#FFF6D6"/><stop offset="0.55" stop-color="#F7C873"/><stop offset="1" stop-color="#E0883A"/>
    </radialGradient>
    <linearGradient id="pk-wood" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#B07C52"/><stop offset="1" stop-color="#6E4B3A"/>
    </linearGradient>
    <linearGradient id="pk-brass" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#E4C98A"/><stop offset="0.5" stop-color="#C5A059"/><stop offset="1" stop-color="#8E6F33"/>
    </linearGradient>
  </defs>

  <!-- hemp control strings: stem cap and two brass eyelets on the shoulders -->
  <g stroke="${STRING}" stroke-width="1.4" fill="none">
    <path d="M70 0 V97"/><path d="M42 0 L46 117"/><path d="M98 0 L94 117"/>
  </g>
  <rect x="30" y="-2" width="80" height="8" rx="3" fill="#6E4B3A" stroke="${INK}" stroke-width="1.5"/>

  <g class="body">
    <!-- little wooden legs, swinging gently -->
    <g class="pk-legs">
      <g class="pk-leg pk-leg-l"><path d="M58 190 L55 211" stroke="#6E4B3A" stroke-width="5" stroke-linecap="round"/><path d="M58 190 L55 211" stroke="${INK}" stroke-width="1" stroke-linecap="round" opacity="0.5"/>
        <ellipse cx="52.5" cy="215" rx="7.5" ry="4.2" fill="#4A3228" stroke="${INK}" stroke-width="1.6"/><circle cx="55.6" cy="200" r="2" fill="url(#pk-brass)" stroke="${INK}" stroke-width="0.8"/></g>
      <g class="pk-leg pk-leg-r"><path d="M82 190 L85 211" stroke="#6E4B3A" stroke-width="5" stroke-linecap="round"/><path d="M82 190 L85 211" stroke="${INK}" stroke-width="1" stroke-linecap="round" opacity="0.5"/>
        <ellipse cx="87.5" cy="215" rx="7.5" ry="4.2" fill="#4A3228" stroke="${INK}" stroke-width="1.6"/><circle cx="84.4" cy="200" r="2" fill="url(#pk-brass)" stroke="${INK}" stroke-width="0.8"/></g>
    </g>

    <g class="pk-head">
      <!-- gourd lobes, back to front -->
      <ellipse cx="36" cy="157" rx="24" ry="35" fill="url(#pk-skin-back)" stroke="${INK}" stroke-width="2.2"/>
      <ellipse cx="104" cy="157" rx="24" ry="35" fill="url(#pk-skin-back)" stroke="${INK}" stroke-width="2.2"/>
      <ellipse cx="50" cy="155" rx="27" ry="40" fill="url(#pk-skin)" stroke="${INK}" stroke-width="2.2"/>
      <ellipse cx="90" cy="155" rx="27" ry="40" fill="url(#pk-skin)" stroke="${INK}" stroke-width="2.2"/>
      <ellipse cx="70" cy="154" rx="28" ry="41" fill="url(#pk-skin)" stroke="${INK}" stroke-width="2.2"/>
      <!-- rib grooves, engraving-style hatching and a soft highlight -->
      <g fill="none" stroke="#8A3C16" stroke-width="1.5" stroke-linecap="round" opacity="0.65">
        <path d="M58 118 C51 140 51 170 58 192"/><path d="M82 118 C89 140 89 170 82 192"/>
        <path d="M33 128 C26 146 26 168 34 186"/><path d="M107 128 C114 146 114 168 106 186"/>
      </g>
      <g stroke="${INK}" stroke-width="0.9" stroke-linecap="round" opacity="0.28">
        <path d="M100 176 l7 -4 M98 182 l9 -5 M96 187 l9 -5 M106 168 l5 -3"/>
        <path d="M22 176 l-4 3 M24 183 l-5 3"/>
      </g>
      <ellipse cx="49" cy="128" rx="11" ry="6" transform="rotate(-24 49 128)" fill="#fff" opacity="0.22"/>

      <!-- face: soft light bleeding out of the carved holes, then the selected parts -->
      <ellipse class="pk-halo" cx="70" cy="156" rx="36" ry="30" fill="url(#pk-glow)"/>
      <g class="pk-face">
        ${EYES.join('\n        ')}
        <g class="pk-lids" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round">
          <path d="M43 141 Q53 149 63 141"/><path d="M77 141 Q87 149 97 141"/>
        </g>
        ${NOSES.join('\n        ')}
        ${MOUTHS.join('\n        ')}
      </g>

      <!-- stem, vine and leaf -->
      <path d="M63.5 117 C61 108 63 101 68 97.5 L76 99 C73 104 74 110 77 117Z" fill="url(#pk-wood)" stroke="${INK}" stroke-width="1.8"/>
      <ellipse cx="71.5" cy="98.3" rx="6" ry="2.6" fill="url(#pk-brass)" stroke="${INK}" stroke-width="1.2"/>
      <path d="M77 108 c9 -3 13 3 8.5 8 c-3.2 2.2 -6.5 -1 -4.2 -3.4" fill="none" stroke="#6b7a45" stroke-width="2" stroke-linecap="round"/>
      <path d="M63.5 111 q-15 -11 -22 2 q11 9 22 -2z" fill="#76865a" stroke="${INK}" stroke-width="1.5"/>
      <path d="M62 111.5 q-9 -3 -17 1" fill="none" stroke="${INK}" stroke-width="0.9" opacity="0.5"/>
      <!-- brass eyelets where the shoulder strings attach -->
      <circle cx="46" cy="117" r="2.6" fill="url(#pk-brass)" stroke="${INK}" stroke-width="1"/>
      <circle cx="94" cy="117" r="2.6" fill="url(#pk-brass)" stroke="${INK}" stroke-width="1"/>
    </g>
  </g>

  <g class="zzz" font-family="Georgia, serif" font-style="italic" fill="#F2E6D0">
    <text x="104" y="118" font-size="16">z</text><text x="114" y="102" font-size="20">Z</text><text x="124" y="82" font-size="24">Z</text>
  </g>
</svg>`;
}

/** Show the selected eye, nose and mouth variants (slots = [A, B, C]). */
export function applyPumpkinParts(el, slots) {
  const [eyes, nose, mouth] = slots;
  const pick = { eyes, nose, mouth };
  Object.entries(PARTS).forEach(([kind, list]) => {
    list.forEach((_, i) => {
      const cls = kind === 'mouth' && i === 2 ? '.pk-mouth-2-wrap' : `.pk-${kind}-${i}`;
      const node = el.querySelector(cls);
      if (node) node.style.display = i === pick[kind] ? 'inline' : 'none';
    });
  });
}
