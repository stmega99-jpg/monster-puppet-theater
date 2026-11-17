// Witch's Cauldron art and bubble effects (Task 6): a hand-forged marionette pot over a little fire.
//
// All 9 parts are in the SVG at once. applyCauldronParts() shows the selected one per slot:
//   Slot A: pot        (0 Cat-Footed Iron, 1 Patchwork Brass, 2 Cracked Ceramic)   -> waveform
//   Slot B: ingredient (0 Glowing Poison Mushroom, 1 Wind-Up Frog, 2 Starry Eyeball) -> pattern
//   Slot C: flame      (0 Beeswax Candle Bundle, 1 Foxfire Lantern, 2 Bramble Logs)  -> envelope
//
// Motion: style.css drives the pot, ingredient and flame from --energy (audio-synced). The poison
// bubbles are a small particle system (BubbleField) that the engine's visual events feed: each bass
// note sends bubbles up from the bottom of the brew; they swell through the surface, pop, and leave
// a wisp of steam. When the puppet dozes, a few slow bubbles simmer on their own (pure CSS).
// The poster draws the same SVG as a standalone image with a frozen "mid-pop" moment (.cd-static).

const INK = '#2C1E18';
const STRING = 'rgba(212, 195, 163, 0.35)';
const NS = 'http://www.w3.org/2000/svg';

export const BREW = { x: 70, y: 141.5, rx: 41, ry: 8 };   // the liquid surface (an ellipse seen from above)
const BELLY = 'M23 140 C16 176 38 204 70 204 C102 204 124 176 117 140 Z';
const FLOOR_Y = 224;

// ---------------------------------------------------------------- small helpers

const f1 = (n) => Number(n.toFixed(1));

/** A teardrop flame standing on (cx, base), `h` tall and about 2w wide. */
function flame(cx, base, h, w) {
  return `M${cx} ${f1(base - h)} C${f1(cx + w * 0.25)} ${f1(base - h * 0.72)} ${f1(cx + w)} ${f1(base - h * 0.48)} ${f1(cx + w * 0.85)} ${f1(base - h * 0.2)} `
    + `C${f1(cx + w * 0.6)} ${base + 1} ${f1(cx - w * 0.6)} ${base + 1} ${f1(cx - w * 0.85)} ${f1(base - h * 0.2)} `
    + `C${f1(cx - w)} ${f1(base - h * 0.48)} ${f1(cx - w * 0.25)} ${f1(base - h * 0.72)} ${cx} ${f1(base - h)}Z`;
}

function starPath(cx, cy, outer, inner, points = 5) {
  const pts = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / points;
    pts.push(`${f1(cx + r * Math.cos(a))} ${f1(cy + r * Math.sin(a))}`);
  }
  return `M${pts.join(' L')}Z`;
}

/** Points along a quadratic curve, for rivets and bolts. */
function along(p0, p1, p2, n, from = 0.08, to = 0.92) {
  return Array.from({ length: n }, (_, i) => {
    const t = from + ((to - from) * i) / (n - 1);
    const u = 1 - t;
    return [f1(u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0]), f1(u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1])];
  });
}
const rivets = (pts, r, fill, stroke = INK) => pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="0.7"/>`).join('');

/** A hanging ring handle on a pot's side, where a control string ties on. */
const ring = (cx, cy, color) => `<circle cx="${cx}" cy="${cy}" r="6" fill="none" stroke="${INK}" stroke-width="5.4"/><circle cx="${cx}" cy="${cy}" r="6" fill="none" stroke="${color}" stroke-width="2.8"/>`;

// ---------------------------------------------------------------- Slot A: pots

function paw(side) {
  const g = `
    <path d="M27 186 C20 200 24 210 30 216 L45 216 C48 207 43 196 40 190Z" fill="#232831" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>
    <ellipse cx="37" cy="218" rx="11.5" ry="5.6" fill="#2B303A" stroke="${INK}" stroke-width="2.2"/>
    <path d="M32 215.5 v5 M37 216.5 v5.5 M42 215.5 v5" stroke="${INK}" stroke-width="1.1" stroke-linecap="round" opacity="0.7"/>
    <path d="M31.5 222 l-1.4 3.4 M37 223.5 v3.4 M42.5 222 l1.4 3.4" stroke="#C9CED6" stroke-width="1.5" stroke-linecap="round"/>`;
  return side === 'r' ? `<g transform="translate(140 0) scale(-1 1)">${g}</g>` : g;
}

const POTS = [
  // 0 Cat-Footed Iron Cauldron: riveted black iron, a cat-head emblem, and real paws
  `<g class="cd-pot cd-pot-0">
    ${paw('l')}${paw('r')}
    <path d="${BELLY}" fill="url(#cd-iron)" stroke="${INK}" stroke-width="2.6"/>
    <path d="M29 152 C26 170 34 188 49 197" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="0.14"/>
    <path d="M27 157 Q70 175 113 157" fill="none" stroke="#14171C" stroke-width="6.5" stroke-linecap="round"/>
    <path d="M27 157 Q70 175 113 157" fill="none" stroke="#3B4350" stroke-width="3.6" stroke-linecap="round"/>
    ${rivets(along([27, 157], [70, 175], [113, 157], 9, 0.1, 0.9), 1.5, '#7C8798')}
    <path d="M62 185 L63 175 L69 181 H71 L77 175 L78 185 C80 191 76 198 70 198 C64 198 60 191 62 185Z" fill="#1C2026" stroke="#4A5160" stroke-width="1.2" stroke-linejoin="round"/>
    <circle cx="66.6" cy="188.6" r="1.4" fill="#9BE58A"/><circle cx="73.4" cy="188.6" r="1.4" fill="#9BE58A"/>
    <ellipse cx="70" cy="140" rx="48" ry="12" fill="#3B4350" stroke="${INK}" stroke-width="2.6"/>
    <path d="M26 138 C34 129 106 129 114 138" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity="0.22"/>
    ${ring(18, 147, '#4A5160')}${ring(122, 147, '#4A5160')}
  </g>`,
  // 1 Patchwork Brass Cauldron: mismatched stitched plates, dented, on peg legs
  `<g class="cd-pot cd-pot-1">
    <g stroke="${INK}" stroke-width="2" stroke-linecap="round">
      <path d="M33 190 L28 213" stroke-width="7"/><path d="M107 190 L112 213" stroke-width="7"/>
    </g>
    <g stroke="#8E6F33" stroke-width="4" stroke-linecap="round"><path d="M33 190 L28 213"/><path d="M107 190 L112 213"/></g>
    <ellipse cx="27" cy="217" rx="8" ry="4.6" fill="url(#cd-brass)" stroke="${INK}" stroke-width="2"/>
    <ellipse cx="113" cy="217" rx="8" ry="4.6" fill="url(#cd-brass)" stroke="${INK}" stroke-width="2"/>
    <path d="${BELLY}" fill="url(#cd-brass-dark)" stroke="${INK}" stroke-width="2.6"/>
    <g clip-path="url(#cd-belly-clip)" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round">
      <path d="M14 148 L53 144 L57 173 L18 178Z" fill="#5E9A86"/>
      <path d="M57 156 L97 152 L101 187 L61 191Z" fill="#B5683A"/>
      <path d="M97 140 L126 146 L122 182 L101 180Z" fill="#7A5E2C"/>
      <path d="M38 187 L84 191 L76 210 L48 208Z" fill="#D2B070"/>
      <path d="M18 178 L57 173 L61 191 L38 187 L30 196Z" fill="#9A7B3F"/>
    </g>
    <g clip-path="url(#cd-belly-clip)" fill="none" stroke="#F2E6D0" stroke-width="0.9" stroke-dasharray="2.6 2.4" stroke-linecap="round" opacity="0.8">
      <path d="M17 150 L51 146.5 L54.5 171 L21 175.5Z"/><path d="M60 158.5 L95 155 L98 184 L63.5 187.5Z"/><path d="M99.5 144 L122 148.5 L119 178 L103 176.5Z"/>
    </g>
    <path d="M30 152 C27 170 34 188 49 197" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="0.18"/>
    ${rivets([[20, 150], [51, 147], [55, 170], [20, 175], [63, 160], [94, 157], [98, 183], [64, 188], [102, 148], [120, 150], [117, 178], [44, 192], [80, 195]], 1.4, '#E4C98A')}
    <ellipse cx="70" cy="140" rx="48" ry="12" fill="url(#cd-brass)" stroke="${INK}" stroke-width="2.6"/>
    ${rivets(along([24, 143], [70, 163], [116, 143], 11, 0, 1), 1.4, '#8E6F33')}
    ${ring(18, 147, '#E4C98A')}${ring(122, 147, '#E4C98A')}
  </g>`,
  // 2 Cracked Ceramic Cauldron: glazed indigo with painted bands, a gold-mended crack, a chipped rim
  `<g class="cd-pot cd-pot-2">
    <path d="M39 196 L41 216 H59 L59 203Z" fill="#223240" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M101 196 L99 216 H81 L81 203Z" fill="#223240" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M42 211 H58 M98 211 H82" stroke="#EADFC6" stroke-width="1.4" opacity="0.5"/>
    <path d="M15 144 C1 142 -1 162 18 160" fill="none" stroke="${INK}" stroke-width="8.2" stroke-linecap="round"/>
    <path d="M125 144 C139 142 141 162 122 160" fill="none" stroke="${INK}" stroke-width="8.2" stroke-linecap="round"/>
    <path d="M15 144 C1 142 -1 162 18 160" fill="none" stroke="#3E5A6B" stroke-width="4.6" stroke-linecap="round"/>
    <path d="M125 144 C139 142 141 162 122 160" fill="none" stroke="#3E5A6B" stroke-width="4.6" stroke-linecap="round"/>
    <path d="${BELLY}" fill="url(#cd-ceramic)" stroke="${INK}" stroke-width="2.6"/>
    <g clip-path="url(#cd-belly-clip)" fill="none" stroke-linecap="round">
      <path d="M14 157 Q70 177 126 157" stroke="#EADFC6" stroke-width="5" opacity="0.92"/>
      <path d="M14 168 Q70 189 126 168" stroke="#EADFC6" stroke-width="2.2" opacity="0.8"/>
      <path d="M24 178 C28 188 36 196 46 200" stroke="#fff" stroke-width="4" opacity="0.13"/>
    </g>
    <g fill="#EADFC6" opacity="0.75">
      <circle cx="40" cy="186" r="1.1"/><circle cx="52" cy="195" r="0.9"/><circle cx="98" cy="190" r="1.1"/><circle cx="86" cy="199" r="0.9"/>
      <circle cx="31" cy="176" r="0.9"/><circle cx="107" cy="178" r="0.9"/><circle cx="62" cy="199" r="0.8"/>
    </g>
    <g fill="none" stroke="#10151B" stroke-width="0.8" opacity="0.55" stroke-linecap="round">
      <path d="M44 162 l5 5 l-1 6 M100 168 l-6 4 l1 7 M58 186 l6 -2 l2 6 M30 188 l5 3"/>
    </g>
    <path d="M84 150 L80 160 L88 168 L81 180 L89 190 L84 203" fill="none" stroke="${INK}" stroke-width="3.6" stroke-linejoin="round" stroke-linecap="round"/>
    <path d="M84 150 L80 160 L88 168 L81 180 L89 190 L84 203" fill="none" stroke="#E4C98A" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    <path d="M88 168 L97 171 M81 180 L72 184" fill="none" stroke="#E4C98A" stroke-width="1.3" stroke-linecap="round"/>
    <ellipse cx="70" cy="140" rx="48" ry="12" fill="#D9CBB0" stroke="${INK}" stroke-width="2.6"/>
    <path d="M26 138 C34 129 106 129 114 138" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity="0.5"/>
    <path d="M97 130.5 L104 133.5 L98.5 137Z" fill="#14181C" stroke="${INK}" stroke-width="1"/>
  </g>`,
];

// ---------------------------------------------------------------- Slot B: ingredients

const INGREDIENTS = [
  // 0 Glowing Poison Mushroom: a toadstool and two babies, spots that glow with every note
  `<g class="cd-ingredient cd-ing-0">
    <path d="M70 0 V85" stroke="${STRING}" stroke-width="1.4" fill="none"/>
    <g class="cd-baby">
      <path d="M44 141 C44 134 45 130 45 126 L51 126 C51 130 52 134 52 141Z" fill="#D9D0E6" stroke="${INK}" stroke-width="1.4"/>
      <path d="M38 128 C38 118 44 115 48 115 C53 115 59 118 59 128 C54 125 43 125 38 128Z" fill="url(#cd-cap)" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>
      <circle class="cd-glow" cx="45" cy="121" r="1.8" fill="url(#cd-mush)"/><circle class="cd-glow" cx="52" cy="123" r="1.4" fill="url(#cd-mush)"/>
    </g>
    <g class="cd-baby cd-baby-r">
      <path d="M90 141 C90 135 89 132 89 128 L95 128 C95 132 94 135 94 141Z" fill="#D9D0E6" stroke="${INK}" stroke-width="1.4"/>
      <path d="M84 130 C84 121 89 118 92 118 C96 118 101 121 101 130 C97 127.5 88 127.5 84 130Z" fill="url(#cd-cap)" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>
      <circle class="cd-glow" cx="90" cy="124" r="1.6" fill="url(#cd-mush)"/><circle class="cd-glow" cx="96" cy="126" r="1.3" fill="url(#cd-mush)"/>
    </g>
    <path d="M63 141 C64 126 66 117 65 108 L75 108 C74 117 76 126 77 141Z" fill="#E4DBEF" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M67 112 C67 122 67.5 130 67 139" fill="none" stroke="#9C8FB8" stroke-width="1.2" opacity="0.6"/>
    <ellipse cx="70" cy="110" rx="6.4" ry="2" fill="#2d1b3d" opacity="0.6"/>
    <g class="cd-cap">
      <path d="M43 112 C42 96 56 85 70 85 C84 85 98 96 97 112 C88 106 52 106 43 112Z" fill="url(#cd-cap)" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M52 94 C57 89 63 87.5 68 87.5" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity="0.28"/>
      <path d="M46 110 C54 104 86 104 94 110" fill="none" stroke="#2d1b3d" stroke-width="1.2" opacity="0.5"/>
      <circle class="cd-glow" cx="58" cy="97" r="4.4" fill="url(#cd-mush)"/>
      <circle class="cd-glow" cx="76" cy="93" r="3.4" fill="url(#cd-mush)"/>
      <circle class="cd-glow" cx="86" cy="102" r="3.8" fill="url(#cd-mush)"/>
      <circle class="cd-glow" cx="66" cy="104" r="2.6" fill="url(#cd-mush)"/>
      <circle class="cd-glow" cx="50" cy="105" r="2.3" fill="url(#cd-mush)"/>
    </g>
  </g>`,
  // 1 Wind-Up Frog: a tin toy with a brass key, bulging eyes and a hop on every note
  `<g class="cd-ingredient cd-ing-1">
    <path d="M70 0 V105" stroke="${STRING}" stroke-width="1.4" fill="none"/>
    <circle cx="70" cy="107" r="2.6" fill="url(#cd-brass)" stroke="${INK}" stroke-width="1"/>
    <g class="cd-frog">
      <ellipse cx="45" cy="135" rx="9" ry="6.5" fill="#5E9A5A" stroke="${INK}" stroke-width="1.8"/>
      <ellipse cx="95" cy="135" rx="9" ry="6.5" fill="#5E9A5A" stroke="${INK}" stroke-width="1.8"/>
      <g class="cd-key">
        <path d="M86 122 L98 110" stroke="${INK}" stroke-width="4.4" stroke-linecap="round"/>
        <path d="M86 122 L98 110" stroke="#C5A059" stroke-width="2" stroke-linecap="round"/>
        <g transform="rotate(-45 100 109)" fill="url(#cd-brass)" stroke="${INK}" stroke-width="1.3">
          <ellipse cx="94.5" cy="109" rx="5.2" ry="3.4"/><ellipse cx="105.5" cy="109" rx="5.2" ry="3.4"/><rect x="97.6" y="106.6" width="4.8" height="4.8" rx="1"/>
        </g>
      </g>
      <path d="M48 141 C46 128 52 118 70 118 C88 118 94 128 92 141Z" fill="url(#cd-frog)" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M52 132 C58 135 82 135 88 132" fill="none" stroke="#2f5a30" stroke-width="1.2" opacity="0.55"/>
      <path d="M52 136 H88" stroke="#F2E6D0" stroke-width="0.9" stroke-dasharray="2.4 2.4" opacity="0.7"/>
      <ellipse cx="70" cy="119" rx="17" ry="11" fill="url(#cd-frog)" stroke="${INK}" stroke-width="2"/>
      <path d="M57 123 C63 128 77 128 83 123" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>
      <circle cx="66" cy="119" r="0.9" fill="${INK}"/><circle cx="74" cy="119" r="0.9" fill="${INK}"/>
      <ellipse cx="62" cy="113" rx="4.4" ry="2.6" fill="#fff" opacity="0.22"/>
      <g class="cd-frog-eye">
        <circle cx="58.5" cy="109.5" r="7.2" fill="#F2E6D0" stroke="${INK}" stroke-width="1.8"/>
        <circle cx="81.5" cy="109.5" r="7.2" fill="#F2E6D0" stroke="${INK}" stroke-width="1.8"/>
        <g class="cd-frog-pupils"><ellipse cx="59" cy="110" rx="3" ry="3.8" fill="${INK}"/><ellipse cx="81" cy="110" rx="3" ry="3.8" fill="${INK}"/>
        <circle cx="60" cy="108.6" r="1" fill="#fff"/><circle cx="82" cy="108.6" r="1" fill="#fff"/></g>
      </g>
      <g class="cd-frog-eye-closed" fill="none" stroke="${INK}" stroke-width="1.9" stroke-linecap="round">
        <path d="M51.5 110 Q58.5 116 65.5 110" fill="#5E9A5A"/><path d="M74.5 110 Q81.5 116 88.5 110" fill="#5E9A5A"/>
      </g>
      <path d="M47 140 L40 146 M47 140 L44 148 M93 140 L100 146 M93 140 L96 148" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>
    </g>
  </g>`,
  // 2 Starry Eyeball: a bloodshot eye with a star pupil, an eyelid that falls shut, and sparkles
  `<g class="cd-ingredient cd-ing-2">
    <path d="M70 0 V97" stroke="${STRING}" stroke-width="1.4" fill="none"/>
    <circle cx="70" cy="99" r="2.4" fill="url(#cd-brass)" stroke="${INK}" stroke-width="1"/>
    <g class="cd-eye">
      <circle cx="70" cy="119" r="22.5" fill="url(#cd-eye)" stroke="${INK}" stroke-width="2.2"/>
      <g fill="none" stroke="#C45A5A" stroke-width="0.9" stroke-linecap="round" opacity="0.7">
        <path d="M50 112 C55 114 57 116 60 114 M49 124 C54 123 56 126 58 130 M90 112 C85 114 83 116 80 114 M91 125 C86 124 84 127 82 131 M60 133 C62 131 64 133 65 136 M80 133 C78 131 76 133 75 136"/>
      </g>
      <g class="cd-iris">
        <circle cx="70" cy="119" r="12.5" fill="url(#cd-iris)" stroke="${INK}" stroke-width="1.5"/>
        <path d="M70 107 L70 112 M70 126 L70 131 M58 119 L63 119 M77 119 L82 119" stroke="#fff" stroke-width="0.8" opacity="0.35"/>
        <path class="cd-pupil" d="${starPath(70, 119, 8.4, 2.6, 4)}" fill="#0F0A16"/>
        <circle cx="65.5" cy="114.5" r="2.4" fill="#fff" opacity="0.85"/>
      </g>
      <path d="M52 105 C57 98 66 95 74 96" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity="0.4"/>
      <g class="cd-lid">
        <path d="M47.5 119 A22.5 22.5 0 0 1 92.5 119 Q70 128 47.5 119Z" fill="#7A5560" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>
        <path d="M47.5 119 Q70 128 92.5 119" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>
        <path d="M54 121 l-3 4 M62 123.5 l-1.5 4.5 M70 124.5 v5 M78 123.5 l1.5 4.5 M86 121 l3 4" stroke="${INK}" stroke-width="1.5" stroke-linecap="round"/>
      </g>
    </g>
    <g class="cd-sparkles" fill="#F7C873" stroke="${INK}" stroke-width="0.7" stroke-linejoin="round">
      <path class="cd-spark-a" d="${starPath(41, 100, 5, 2, 4)}"/><path class="cd-spark-b" d="${starPath(101, 106, 4.2, 1.7, 4)}"/><path class="cd-spark-c" d="${starPath(96, 90, 3.2, 1.3, 4)}"/>
    </g>
  </g>`,
];

// ---------------------------------------------------------------- Slot C: flames (under the pot)

function candle(cx, h, flameH) {
  const top = 223 - h;
  return `<g class="cd-candle">
    <path d="M${cx - 4} 223 V${top + 2} Q${cx - 4} ${top} ${cx} ${top} Q${cx + 4} ${top} ${cx + 4} ${top + 2} V223Z" fill="#F2E6D0" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M${cx - 4} ${top + 3} q1.6 4 3 0 q1.2 5 2.4 0" fill="#DCCBA8" stroke="none"/>
    <path d="M${cx} ${top} v-2.6" stroke="${INK}" stroke-width="1.2" stroke-linecap="round"/>
    <path class="cd-fl cd-fl-${cx}" d="${flame(cx, top - 2, flameH, 3.6)}" fill="url(#cd-fire)" stroke="#D2481E" stroke-width="0.6" style="animation-delay:-${(cx % 7) * 0.17}s"/>
    <path class="cd-fl cd-fl-in" d="${flame(cx, top - 2, flameH * 0.55, 1.8)}" fill="#FFF3B0" opacity="0.9" style="animation-delay:-${(cx % 5) * 0.2}s"/>
  </g>`;
}

const FLAMES = [
  // 0 Beeswax Candle Bundle: three tied candles, uneven, with wax drips
  `<g class="cd-flame cd-flame-0">
    <ellipse class="cd-halo" cx="70" cy="209" rx="30" ry="15" fill="url(#cd-halo-warm)"/>
    ${candle(56, 8, 9)}${candle(84, 6, 8)}${candle(70, 11, 11)}
    <path d="M49 220 Q70 224 91 220" fill="none" stroke="${INK}" stroke-width="4.4" stroke-linecap="round"/>
    <path d="M49 220 Q70 224 91 220" fill="none" stroke="#8E2A44" stroke-width="2.4" stroke-linecap="round"/>
  </g>`,
  // 1 Foxfire Lantern: a little brass lantern holding cold green-blue fire
  `<g class="cd-flame cd-flame-1">
    <ellipse class="cd-halo" cx="70" cy="212" rx="30" ry="16" fill="url(#cd-halo-fox)"/>
    <circle cx="70" cy="196.5" r="3.4" fill="none" stroke="${INK}" stroke-width="3.6"/><circle cx="70" cy="196.5" r="3.4" fill="none" stroke="url(#cd-brass)" stroke-width="1.6"/>
    <path d="M60 206 H80 V221 H60Z" fill="rgba(170,255,235,0.22)" stroke="${INK}" stroke-width="2"/>
    <path class="cd-fl" d="${flame(70, 220, 15, 5.4)}" fill="url(#cd-fox)" stroke="#2F9E8E" stroke-width="0.6"/>
    <path class="cd-fl cd-fl-in" d="${flame(70, 220, 8, 2.6)}" fill="#E8FFF6" opacity="0.95" style="animation-delay:-0.4s"/>
    <path d="M57 206 L61 200 H79 L83 206Z" fill="url(#cd-brass)" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M57 221 H83 V225 H57Z" fill="url(#cd-brass)" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M65 207 V221 M75 207 V221" stroke="${INK}" stroke-width="1.2" opacity="0.7"/>
    <path d="M62 208 V218" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity="0.45"/>
  </g>`,
  // 2 Crackling Bramble Logs: crossed thorny logs, tall orange tongues and flying sparks
  `<g class="cd-flame cd-flame-2">
    <ellipse class="cd-halo" cx="70" cy="209" rx="32" ry="16" fill="url(#cd-halo-warm)"/>
    <path class="cd-fl" d="${flame(57, 218, 22, 6)}" fill="url(#cd-fire)" stroke="#B93A18" stroke-width="0.7" style="animation-delay:-0.3s"/>
    <path class="cd-fl" d="${flame(83, 218, 20, 6)}" fill="url(#cd-fire)" stroke="#B93A18" stroke-width="0.7" style="animation-delay:-0.9s"/>
    <path class="cd-fl" d="${flame(70, 219, 30, 8.5)}" fill="url(#cd-fire)" stroke="#B93A18" stroke-width="0.7"/>
    <path class="cd-fl cd-fl-in" d="${flame(70, 219, 16, 4)}" fill="#FFF3B0" opacity="0.92" style="animation-delay:-0.5s"/>
    <path d="M44 215 L93 224 L91 228.5 L42 220Z" fill="#4A3228" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M96 215 L47 224 L49 228.5 L98 220Z" fill="#5A3E30" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>
    <g fill="#2C1E18"><path d="M55 221.5 l-1.6 -5 l4.6 3Z"/><path d="M78 224 l-1 -5 l4.4 2.6Z"/><path d="M62 225 l-2.4 4.4 l4.4 -1.6Z"/><path d="M88 222.4 l1 -5 l3.8 3.4Z"/></g>
    <path d="M50 219.5 L88 226.6" stroke="#8a6a52" stroke-width="1" opacity="0.5"/>
    <g class="cd-sparks" fill="#FFD66B">
      <circle class="cd-sp cd-sp-a" cx="60" cy="204" r="1.3"/><circle class="cd-sp cd-sp-b" cx="78" cy="200" r="1.1"/>
      <circle class="cd-sp cd-sp-c" cx="68" cy="196" r="1"/><circle class="cd-sp cd-sp-d" cx="86" cy="206" r="1.2"/>
    </g>
  </g>`,
];

const PARTS = { pot: POTS, ingredient: INGREDIENTS, flame: FLAMES };
const PART_CLASS = { pot: 'cd-pot', ingredient: 'cd-ing', flame: 'cd-flame' };

// ---------------------------------------------------------------- the puppet

export function cauldronSVG(label) {
  return `
<svg viewBox="0 0 140 240" role="img" aria-label="${label}">
  <defs>
    <linearGradient id="cd-iron" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#555E6E"/><stop offset="0.45" stop-color="#2B303A"/><stop offset="1" stop-color="#15181E"/>
    </linearGradient>
    <linearGradient id="cd-brass" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#E4C98A"/><stop offset="0.5" stop-color="#C5A059"/><stop offset="1" stop-color="#8E6F33"/>
    </linearGradient>
    <linearGradient id="cd-brass-dark" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#B58F4B"/><stop offset="0.6" stop-color="#7A5E2C"/><stop offset="1" stop-color="#4A3818"/>
    </linearGradient>
    <linearGradient id="cd-ceramic" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#5F8196"/><stop offset="0.5" stop-color="#34495A"/><stop offset="1" stop-color="#1D2B38"/>
    </linearGradient>
    <clipPath id="cd-belly-clip"><path d="${BELLY}"/></clipPath>
    <radialGradient id="cd-brew" cx="45%" cy="40%" r="75%">
      <stop offset="0" stop-color="#C6EBCB"/><stop offset="0.45" stop-color="#76A884"/><stop offset="1" stop-color="#2E5A44"/>
    </radialGradient>
    <radialGradient id="cd-mush" cx="50%" cy="50%" r="60%">
      <stop offset="0" stop-color="#F4FFD0"/><stop offset="0.5" stop-color="#A8F08A"/><stop offset="1" stop-color="#3FAE6A"/>
    </radialGradient>
    <linearGradient id="cd-cap" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#9A66C8"/><stop offset="0.55" stop-color="#6A3C98"/><stop offset="1" stop-color="#3C2058"/>
    </linearGradient>
    <radialGradient id="cd-frog" cx="38%" cy="30%" r="80%">
      <stop offset="0" stop-color="#9ACB8E"/><stop offset="0.55" stop-color="#5E9A5A"/><stop offset="1" stop-color="#34683A"/>
    </radialGradient>
    <radialGradient id="cd-eye" cx="38%" cy="32%" r="80%">
      <stop offset="0" stop-color="#FFFBEF"/><stop offset="0.7" stop-color="#EDE0C4"/><stop offset="1" stop-color="#C4AE8C"/>
    </radialGradient>
    <radialGradient id="cd-iris" cx="50%" cy="50%" r="55%">
      <stop offset="0" stop-color="#B7A4F0"/><stop offset="0.6" stop-color="#6F5AC0"/><stop offset="1" stop-color="#2F2670"/>
    </radialGradient>
    <linearGradient id="cd-fire" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="#D2481E"/><stop offset="0.55" stop-color="#FF9A3C"/><stop offset="1" stop-color="#FFD66B"/>
    </linearGradient>
    <linearGradient id="cd-fox" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="#2F9E8E"/><stop offset="0.6" stop-color="#7FE0C4"/><stop offset="1" stop-color="#D9FFF1"/>
    </linearGradient>
    <radialGradient id="cd-halo-warm"><stop offset="0" stop-color="#FFB45A" stop-opacity="0.65"/><stop offset="1" stop-color="#FFB45A" stop-opacity="0"/></radialGradient>
    <radialGradient id="cd-halo-fox"><stop offset="0" stop-color="#7FE0C4" stop-opacity="0.6"/><stop offset="1" stop-color="#7FE0C4" stop-opacity="0"/></radialGradient>
  </defs>

  <!-- hemp control strings: tied to the two handle rings (the centre string belongs to the ingredient) -->
  <g stroke="${STRING}" stroke-width="1.4" fill="none">
    <path d="M42 0 L18 141"/><path d="M98 0 L122 141"/>
  </g>
  <rect x="30" y="-2" width="80" height="8" rx="3" fill="#6E4B3A" stroke="${INK}" stroke-width="1.5"/>

  <g class="body">
    <ellipse cx="70" cy="${FLOOR_Y}" rx="46" ry="4" fill="#000" opacity="0.25"/>
    ${FLAMES.join('\n    ')}
    <g class="cd-pot-wrap">
      ${POTS.join('\n      ')}
      <ellipse cx="${BREW.x}" cy="141" rx="42.5" ry="9" fill="#10151A" stroke="${INK}" stroke-width="1.6"/>
      <ellipse class="cd-brew" cx="${BREW.x}" cy="${BREW.y}" rx="${BREW.rx}" ry="${BREW.ry}" fill="url(#cd-brew)"/>
      <ellipse class="cd-ripple" cx="${BREW.x}" cy="${BREW.y}" rx="22" ry="4.4" fill="none" stroke="#DFF6E0" stroke-width="1.2"/>
      <ellipse cx="55" cy="139" rx="9" ry="2" fill="#fff" opacity="0.25"/>
      ${INGREDIENTS.join('\n      ')}
      <g class="cd-simmer" fill="rgba(180,230,190,0.5)" stroke="#CFEFD2" stroke-width="0.8">
        <circle class="cd-sim cd-sim-a" cx="56" cy="142" r="2.2"/><circle class="cd-sim cd-sim-b" cx="82" cy="140" r="1.7"/><circle class="cd-sim cd-sim-c" cx="70" cy="144" r="1.3"/>
      </g>
    </g>
    <g class="cd-bubbles"></g>
    <!-- a frozen moment for the poster: bubbles about to pop, one already popped, and some steam -->
    <g class="cd-static">
      <g fill="rgba(160,225,180,0.4)" stroke="#CFEFD2" stroke-width="1.2">
        <circle cx="56" cy="128" r="5.4"/><circle cx="87" cy="124" r="4"/><circle cx="76" cy="136" r="2.6"/>
      </g>
      <g fill="#fff" opacity="0.75"><circle cx="54" cy="125.8" r="1.4"/><circle cx="85.6" cy="122.4" r="1.1"/></g>
      <circle cx="44" cy="115" r="7" fill="none" stroke="#DFF6E0" stroke-width="1.2" opacity="0.8"/>
      <g fill="#B6E3C0"><circle cx="38" cy="106" r="1.4"/><circle cx="50" cy="105" r="1.2"/><circle cx="42" cy="101" r="1"/></g>
      <g fill="none" stroke="rgba(230,248,235,0.55)" stroke-width="3.4" stroke-linecap="round">
        <path d="M96 112 C90 100 102 92 96 80"/><path d="M40 98 C34 88 44 80 38 70"/>
      </g>
    </g>
  </g>

  <g class="zzz" font-family="Georgia, serif" font-style="italic" fill="#F2E6D0">
    <text x="104" y="116" font-size="16">z</text><text x="114" y="100" font-size="20">Z</text><text x="124" y="80" font-size="24">Z</text>
  </g>
</svg>`;
}

/** Show the selected pot, ingredient and flame variants (slots = [A, B, C]). */
export function applyCauldronParts(el, slots) {
  const [pot, ingredient, flameIdx] = slots;
  const pick = { pot, ingredient, flame: flameIdx };
  Object.entries(PARTS).forEach(([kind, list]) => {
    list.forEach((_, i) => {
      el.querySelectorAll(`.${PART_CLASS[kind]}-${i}`).forEach((node) => {
        node.style.display = i === pick[kind] ? 'inline' : 'none';
      });
    });
  });
}

/**
 * The few style.css rules the cauldron needs when it is rendered as a standalone SVG image
 * (the poster), where the page stylesheet does not apply: awake, eyes open, no live bubbles.
 */
export const CAULDRON_STATIC_CSS = `
  .cd-simmer, .cd-frog-eye-closed { display: none; }
  .cd-lid { transform: scaleY(0); }
  .cd-halo { opacity: 0.8; }
  .cd-ripple { opacity: 0; }
`;

// ---------------------------------------------------------------- poison bubbles

const SURFACE_Y = BREW.y;              // y of the brew surface
const START_Y = BREW.y + 6;            // where a bubble is born: the deep end of the visible brew
const APEX_Y = 112;                    // the highest a bubble floats before it pops
const RISE = 0.5;                      // seconds from birth to pop
const POP = 0.2;                       // seconds of the pop ring and droplets
const STEAM = 0.75;                    // seconds the steam wisp lives after the pop
const LIFETIME = RISE + POP + STEAM;
const MAX_ACTIVE = 16;
const DROPLETS = 4;

const svgEl = (name, attrs) => {
  const e = document.createElementNS(NS, name);
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  return e;
};
const clamp01 = (v) => Math.min(1, Math.max(0, v));

/**
 * Poison bubbles for the bass notes. spawn() starts bubbles at a note's output time; update() is
 * called once per frame with a clock in seconds and places every live bubble as a pure function of
 * its age, so the motion stays in step with the sound however the frame rate wobbles.
 */
export class BubbleField {
  /** @param {SVGGElement} layer the .cd-bubbles group inside the puppet */
  constructor(layer) {
    this.layer = layer;
    this.items = [];
    this.seed = 7;
  }

  _rand() { // small deterministic generator: the same song always bubbles the same way
    this.seed = (this.seed * 1664525 + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }

  /** Low notes make more and bigger bubbles. `now` is the clock the update() calls use. */
  spawn(freq, now) {
    const low = clamp01((200 - (freq || 120)) / 140);       // 0 (high note) .. 1 (low note)
    const count = low > 0.45 ? 2 : 1;
    for (let i = 0; i < count; i++) {
      const r = 3.4 + 3.2 * low + this._rand() * 0.8;
      const x = BREW.x + (this._rand() * 2 - 1) * 24;
      this._add({ t0: now + i * 0.09, x, r, wobble: this._rand() * Math.PI * 2, drift: (this._rand() * 2 - 1) * 6 });
    }
  }

  _add(b) {
    while (this.items.length >= MAX_ACTIVE) this.items.shift().g.remove();
    const g = svgEl('g', { visibility: 'hidden' });
    b.body = svgEl('circle', { fill: 'rgba(160,225,180,0.38)', stroke: '#CFEFD2', 'stroke-width': 1.2 });
    b.shine = svgEl('circle', { fill: '#fff', opacity: 0.8 });
    b.ring = svgEl('circle', { fill: 'none', stroke: '#DFF6E0', 'stroke-width': 1.3 });
    b.drops = Array.from({ length: DROPLETS }, () => svgEl('circle', { fill: '#B6E3C0' }));
    b.steam = svgEl('path', { fill: 'none', stroke: 'rgba(230,248,235,0.6)', 'stroke-width': 3.6, 'stroke-linecap': 'round' });
    g.append(b.steam, b.body, b.shine, b.ring, ...b.drops);
    b.g = g;
    this.layer.appendChild(g);
    this.items.push(b);
  }

  clear() {
    this.items.forEach((b) => b.g.remove());
    this.items = [];
  }

  update(now) {
    this.items = this.items.filter((b) => {
      const age = now - b.t0;
      if (age >= LIFETIME) { b.g.remove(); return false; }
      this._draw(b, age);
      return true;
    });
  }

  _draw(b, age) {
    if (age < 0) { b.g.setAttribute('visibility', 'hidden'); return; }
    b.g.removeAttribute('visibility');
    const show = (node, on) => node.setAttribute('visibility', on ? 'visible' : 'hidden');
    const rising = age < RISE;
    const popAge = age - RISE;

    // the bubble: starts small and faint in the deep of the brew, swells as it nears the surface,
    // and bulges above it until it pops
    const u = clamp01(age / RISE);
    const ease = u * u * (3 - 2 * u);
    const y = START_Y + (APEX_Y - START_Y) * ease;
    const x = b.x + b.drift * ease + Math.sin(age * 9 + b.wobble) * 1.2 * ease;
    const above = y < SURFACE_Y - 2;
    const r = b.r * (0.35 + 0.65 * ease) * (1 + (above ? 0.12 * Math.sin(age * 22) : 0));
    show(b.body, rising);
    show(b.shine, rising && above);
    if (rising) {
      b.body.setAttribute('cx', f1(x)); b.body.setAttribute('cy', f1(y)); b.body.setAttribute('r', f1(r));
      b.body.setAttribute('opacity', above ? 1 : f1(0.35 + 0.65 * u));
      b.shine.setAttribute('cx', f1(x - r * 0.36)); b.shine.setAttribute('cy', f1(y - r * 0.4)); b.shine.setAttribute('r', f1(Math.max(0.6, r * 0.26)));
    }

    // the pop: a ring spreads out and a few droplets fly up and fall back
    const popping = popAge >= 0 && popAge < POP;
    show(b.ring, popping);
    b.drops.forEach((d) => show(d, popping));
    if (popping) {
      const p = popAge / POP;
      b.ring.setAttribute('cx', f1(x)); b.ring.setAttribute('cy', f1(APEX_Y)); b.ring.setAttribute('r', f1(b.r * (0.9 + 1.3 * p)));
      b.ring.setAttribute('opacity', f1(1 - p));
      b.drops.forEach((d, i) => {
        const dir = (i - (DROPLETS - 1) / 2) / ((DROPLETS - 1) / 2);   // -1 .. 1
        const t = popAge;
        d.setAttribute('cx', f1(x + dir * 15 * p + dir * b.r * 0.4));
        d.setAttribute('cy', f1(APEX_Y - 62 * t * (1 - 1.9 * t) - 1));
        d.setAttribute('r', f1(1.4 - 0.5 * p));
        d.setAttribute('opacity', f1(1 - p * 0.6));
      });
    }

    // steam: a soft wisp lifts from the pop and fades
    const steaming = popAge >= 0;
    show(b.steam, steaming);
    if (steaming) {
      const s = clamp01((popAge - 0.02) / (POP + STEAM));
      const rise = 26 * s;
      const sway = Math.sin(popAge * 7 + b.wobble) * 3;
      const y0 = APEX_Y - 3 - rise;
      b.steam.setAttribute('d', `M${f1(x + sway)} ${f1(y0)} C${f1(x + sway - 5)} ${f1(y0 - 6)} ${f1(x + sway + 5)} ${f1(y0 - 11)} ${f1(x + sway)} ${f1(y0 - 17)}`);
      b.steam.setAttribute('opacity', f1(0.7 * (1 - s) * Math.min(1, popAge * 14)));
      b.steam.setAttribute('stroke-width', f1(2.6 + 2.6 * s));
    }
  }
}
