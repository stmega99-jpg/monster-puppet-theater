// Skeleton drummer art and motion (Task 5): a bone-white marionette with brass joints.
//
//   Slot A: head   (0 Bent Top Hat, 1 Wind-Up Key Head, 2 Tin Crown)      -> drum tone
//   Slot B: ribs   (0 Four-Box Ribs, 1 Brass-Jointed Ribs, 2 Cobweb Ribs) -> beat
//   Slot C: mallet (0 Femur Mallet, 1 Silver Spoon, 2 Dry Twig Baton)     -> marimba tone
//
// Motion is driven from outside by CSS variables on the puppet element:
//   --sk-kick, --sk-snare          0..1, decay with the audio clock (head nod, hat jolt, key turn)
//   --sk-ua-l/-r, --sk-fa-l/-r     arm angles from armAngles() (the right arm is drawn mirrored,
//                                  so both arms use the same maths)
//   --sk-bx, --sk-by, --sk-bt, --sk-bsy, --sk-hx, --sk-hy, --sk-hr   the skull-tumble gag
// Everything the art needs to look right on its own (variants, arm rotation) is in the <style> inside
// the SVG, so the same markup also renders correctly as a standalone image on the poster.
// State-dependent rules (dozing pose, gag) live in style.css.

const INK = '#2C1E18';
const STRING = 'rgba(212, 195, 163, 0.35)';

// ---------------------------------------------------------------- geometry

export const SHOULDER = { x: 45, y: 153 };           // left shoulder; the right one is drawn mirrored
export const UPPER = 18;                              // shoulder -> elbow
export const FORE = 15;                               // elbow -> wrist
export const HAND_AND_MALLET = 11;                    // wrist -> mallet tip
export const ROW_Y = [157, 168, 179, 190];            // rib rows 1 to 4 (M0..M3)
const RIB_HALF_WIDTH = [22, 21, 19, 16.5];
export const CONTACT_X = 62;                          // where a mallet meets a rib, measured from the arm's own side
export const REST_TIP = { x: 43, y: 140 };            // mallet raised and ready
export const NECK = { x: 70, y: 143 };
export const HEAD_CENTER = { x: 70, y: 124 };
export const FEET_PIVOT = { x: 70, y: 231 };          // the body crouches and leans around its feet

const deg = (r) => (r * 180) / Math.PI;
const wrap180 = (a) => ((((a + 180) % 360) + 360) % 360) - 180;

/**
 * Two-link inverse kinematics for the left arm (in its own, unmirrored coordinates).
 * Returns the CSS rotation of the upper arm (about the shoulder) and of the forearm (about the elbow,
 * relative to the upper arm), for a mallet tip at (tx, ty). Out-of-reach targets are clamped.
 */
export function armAngles(tx, ty) {
  const a = UPPER;
  const b = FORE + HAND_AND_MALLET;
  const dx = tx - SHOULDER.x;
  const dy = ty - SHOULDER.y;
  const dist = Math.hypot(dx, dy);
  const d = Math.min(Math.max(dist, Math.abs(a - b) + 0.5), a + b - 0.01);
  const base = Math.atan2(dy, dx);
  const A = Math.acos(Math.max(-1, Math.min(1, (a * a + d * d - b * b) / (2 * a * d))));
  // two mirror-image elbows; the elbow points away from the body
  const cands = [base + A, base - A].map((t1) => ({ t1, ex: SHOULDER.x + a * Math.cos(t1), ey: SHOULDER.y + a * Math.sin(t1) }));
  const c = cands[0].ex < cands[1].ex ? cands[0] : cands[1];
  const tipX = SHOULDER.x + d * Math.cos(base);
  const tipY = SHOULDER.y + d * Math.sin(base);
  const t2 = Math.atan2(tipY - c.ey, tipX - c.ex);
  return {
    ua: wrap180(deg(c.t1) - 90),
    fa: wrap180(deg(t2 - c.t1)),
    reached: dist <= a + b + 1e-6,
    elbow: { x: c.ex, y: c.ey },
    tip: { x: tipX, y: tipY },
  };
}

/** Arm pose for a mallet strike on rib `row` (0..3); `e` is the decaying energy: 1 = contact, 0 = ready. */
export function strikePose(row, e) {
  const k = Math.pow(Math.max(0, Math.min(1, e)), 0.8);
  const lift = 9 * 4 * k * (1 - k);                 // the mallet swings up before it settles
  const x = REST_TIP.x + (CONTACT_X - REST_TIP.x) * k;
  const y = REST_TIP.y + (ROW_Y[row] - REST_TIP.y) * k - lift;
  return armAngles(x, y);
}

/** Write one arm's angles to a puppet element. side is 'l' or 'r'. */
export function setArmVars(el, side, angles) {
  el.style.setProperty(`--sk-ua-${side}`, `${angles.ua.toFixed(1)}deg`);
  el.style.setProperty(`--sk-fa-${side}`, `${angles.fa.toFixed(1)}deg`);
}

// ---------------------------------------------------------------- art pieces

const bone = (d, w = 3.4, outline = 5.4) =>
  `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${outline}" stroke-linecap="round"/>` +
  `<path d="${d}" fill="none" stroke="url(#sk-bone)" stroke-width="${w}" stroke-linecap="round"/>`;

const pin = (x, y, r = 2.4) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#sk-brass)" stroke="${INK}" stroke-width="1"/>`;

const SPINE = [147, 155, 163, 171, 179, 187, 195]
  .map((y) => `<ellipse cx="70" cy="${y}" rx="3.4" ry="3.3" fill="url(#sk-bone)" stroke="${INK}" stroke-width="1.2"/>`).join('');

function ribCurve(side, row) {
  const y = ROW_Y[row];
  const hw = RIB_HALF_WIDTH[row];
  const s = side === 'l' ? -1 : 1;
  return `M${70 + s * 4} ${y - 1} C${70 + s * 13} ${y - 7} ${70 + s * (hw + 1)} ${y - 3} ${70 + s * hw} ${y + 6}`;
}

const RIBS = [
  // 0 Four-Box Ribs: each row is a pair of bone boxes, like the bars of a marimba
  `<g class="sk-ribs-0">${ROW_Y.map((y, r) => {
    const hw = RIB_HALF_WIDTH[r];
    const w = hw - 5;
    const box = (x) => `<rect x="${x}" y="${y - 4}" width="${w}" height="8" rx="2.4" fill="url(#sk-bone)" stroke="${INK}" stroke-width="1.5"/>
      <path d="M${x + 2} ${y - 2} h${w - 4}" stroke="#fff" stroke-opacity="0.45" stroke-width="1" stroke-linecap="round"/>`;
    return `${box(70 - hw)}${box(75)}${pin(70 - hw + 3.4, y, 1.2)}${pin(70 + hw - 3.4, y, 1.2)}`;
  }).join('')}</g>`,
  // 1 Brass-Jointed Ribs: curved ribs hinged to a brass breastbone
  `<g class="sk-ribs-1">${ROW_Y.map((_, r) => bone(ribCurve('l', r)) + bone(ribCurve('r', r))).join('')}
    <rect x="67.6" y="151" width="4.8" height="43" rx="2.4" fill="url(#sk-brass)" stroke="${INK}" stroke-width="1.3"/>
    ${ROW_Y.map((y) => pin(66, y - 1, 1.9) + pin(74, y - 1, 1.9)).join('')}</g>`,
  // 2 Cobweb Ribs: curved ribs with a web spun between them, and a little spider
  `<g class="sk-ribs-2">${ROW_Y.map((_, r) => bone(ribCurve('l', r)) + bone(ribCurve('r', r))).join('')}
    <g fill="none" stroke="#F2E6D0" stroke-opacity="0.85" stroke-width="0.8" stroke-linecap="round">
      ${[-1, 1].map((s) => ROW_Y.map((y, r) => `<path d="M70 152 L${70 + s * RIB_HALF_WIDTH[r]} ${y + 6}"/>`).join('')).join('')}
      ${[-1, 1].map((s) => [0, 1, 2].map((r) => `<path d="M${70 + s * RIB_HALF_WIDTH[r]} ${ROW_Y[r] + 6} Q${70 + s * (RIB_HALF_WIDTH[r] + RIB_HALF_WIDTH[r + 1]) * 0.42} ${ROW_Y[r] + 12} ${70 + s * RIB_HALF_WIDTH[r + 1]} ${ROW_Y[r + 1] + 6}"/>`).join('')).join('')}
      <path d="M86 172 V178"/>
    </g>
    <g stroke="${INK}" stroke-width="0.9" stroke-linecap="round"><circle cx="86" cy="180" r="2.1" fill="${INK}"/>
      <path d="M84 179 l-3 -2 M84 181 l-3 2 M88 179 l3 -2 M88 181 l3 2"/></g></g>`,
];

const MALLETS = [
  // 0 Femur Mallet: a short thigh bone with its two knobs
  `<g class="sk-mallet-0">${bone('M45 184 L45 192', 2.4, 4.2)}
    <circle cx="43.4" cy="195" r="2.9" fill="url(#sk-bone)" stroke="${INK}" stroke-width="1.2"/><circle cx="46.8" cy="195" r="2.9" fill="url(#sk-bone)" stroke="${INK}" stroke-width="1.2"/></g>`,
  // 1 Silver Spoon: the bowl strikes
  `<g class="sk-mallet-1"><path d="M45 184 L45 191" stroke="${INK}" stroke-width="3.2" stroke-linecap="round"/><path d="M45 184 L45 191" stroke="#C9CED3" stroke-width="1.7" stroke-linecap="round"/>
    <ellipse cx="45" cy="194.2" rx="3.6" ry="4.4" fill="url(#sk-silver)" stroke="${INK}" stroke-width="1.2"/><ellipse cx="44" cy="193" rx="1.1" ry="1.8" fill="#fff" fill-opacity="0.6"/></g>`,
  // 2 Dry Twig Baton: a forked twig
  `<g class="sk-mallet-2"><path d="M45 184 C45.6 188 44.6 191 45.4 195.4" fill="none" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/>
    <path d="M45 184 C45.6 188 44.6 191 45.4 195.4" fill="none" stroke="#8a6444" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M45.2 190 L48.6 187.6" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/><path d="M45.2 190 L48.6 187.6" stroke="#8a6444" stroke-width="1.1" stroke-linecap="round"/></g>`,
];

/** One arm, drawn for the left side. The right arm is the same markup, mirrored. */
function arm(side) {
  const inner = `
    <g class="sk-ua sk-ua-${side}">
      ${bone('M45 153 L45 171')}
      <g class="sk-fa sk-fa-${side}">
        ${bone('M45 171 L45 185')}
        <ellipse cx="45" cy="186" rx="3" ry="3.7" fill="url(#sk-bone)" stroke="${INK}" stroke-width="1.3"/>
        ${MALLETS.join('')}
      </g>
      ${pin(45, 171, 2.3)}
    </g>
    ${pin(45, 153, 2.7)}`;
  return side === 'l'
    ? `<g class="sk-arm sk-arm-l">${inner}</g>`
    : `<g class="sk-arm sk-arm-r" transform="translate(140 0) scale(-1 1)">${inner}</g>`;
}

const HEADGEAR = [
  // 0 Bent Top Hat: the crown has been flopped over to one side
  `<g class="sk-gear sk-head-0">
    <path d="M57 104 L58.4 84 Q59 76.6 65 76.2 L76 76.2 Q82.6 76.4 85 80.6 L90.4 90 Q85.4 88.4 82.6 91.6 L83 104Z" fill="url(#sk-felt)" stroke="${INK}" stroke-width="1.7" stroke-linejoin="round"/>
    <path d="M64 77.4 Q66.4 86 64.4 98" fill="none" stroke="#fff" stroke-opacity="0.14" stroke-width="2" stroke-linecap="round"/>
    <path d="M78 77 Q80 84 82.6 91.4" fill="none" stroke="#000" stroke-opacity="0.35" stroke-width="1.2" stroke-linecap="round"/>
    <path d="M56.6 99 Q70 103 83.4 99 L83.6 104 Q70 108 56.4 104Z" fill="url(#sk-brass)" stroke="${INK}" stroke-width="1.2"/>
    <rect x="67" y="100.4" width="6" height="5" rx="1" fill="none" stroke="${INK}" stroke-width="1.1"/>
    <ellipse cx="70" cy="105.2" rx="23.5" ry="4.8" fill="url(#sk-felt)" stroke="${INK}" stroke-width="1.7"/>
  </g>`,
  // 1 Wind-Up Key Head: a brass key sticks out of the skull, with rivets on the seam
  `<g class="sk-gear sk-head-1">
    <g class="sk-key">
      <rect x="68.8" y="93" width="2.4" height="12" fill="url(#sk-brass)" stroke="${INK}" stroke-width="1"/>
      <path d="M70 93 C 60 91 60 82 66 83 C 69 84 70 88 70 91 C 70 88 71 84 74 83 C 80 82 80 91 70 93Z" fill="url(#sk-brass)" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>
    </g>
    <path d="M53 116 Q70 108 87 116" fill="none" stroke="${INK}" stroke-width="1" opacity="0.7"/>
    ${pin(57.5, 113, 1.5)}${pin(82.5, 113, 1.5)}${pin(70, 107.4, 1.5)}
  </g>`,
  // 2 Tin Crown: a little crooked, with faded jewels
  `<g class="sk-gear sk-head-2"><g transform="rotate(-5 70 104)">
    <path d="M54 106 L52 96 L60 101 L64 90 L70 99 L76 90 L80 101 L88 96 L86 106Z" fill="url(#sk-tin)" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>
    <rect x="54" y="103.5" width="32" height="5.6" rx="1.4" fill="url(#sk-tin)" stroke="${INK}" stroke-width="1.4"/>
    <circle cx="64" cy="91.6" r="1.7" fill="#8a3a3a" stroke="${INK}" stroke-width="0.8"/><circle cx="76" cy="91.6" r="1.7" fill="#4c6a8a" stroke="${INK}" stroke-width="0.8"/>
    <circle cx="70" cy="101" r="1.6" fill="#5f7f55" stroke="${INK}" stroke-width="0.8"/>
    ${pin(58, 106.3, 1)}${pin(70, 106.3, 1)}${pin(82, 106.3, 1)}
  </g></g>`,
];

const SKULL = `
  <path d="M52 120 C52 108 60 104 70 104 C80 104 88 108 88 120 C88 126 84 129 82 131 L82 138 Q82 143 77 143 L63 143 Q58 143 58 138 L58 131 C56 129 52 126 52 120Z"
        fill="url(#sk-bone)" stroke="${INK}" stroke-width="2"/>
  <ellipse cx="56.5" cy="129" rx="3.4" ry="2.4" fill="${INK}" opacity="0.1"/><ellipse cx="83.5" cy="129" rx="3.4" ry="2.4" fill="${INK}" opacity="0.1"/>
  <ellipse cx="62" cy="121" rx="5.4" ry="6.2" fill="#1c1210" stroke="${INK}" stroke-width="1"/>
  <ellipse cx="78" cy="121" rx="5.4" ry="6.2" fill="#1c1210" stroke="${INK}" stroke-width="1"/>
  <circle class="sk-pupil" cx="62.6" cy="122" r="1.7" fill="#F7C873"/><circle class="sk-pupil" cx="78.6" cy="122" r="1.7" fill="#F7C873"/>
  <path class="sk-lids" d="M56.6 120 Q62 125.4 67.4 120 L67.4 121 Q62 127 56.6 121Z M72.6 120 Q78 125.4 83.4 120 L83.4 121 Q78 127 72.6 121Z" fill="url(#sk-bone)" stroke="${INK}" stroke-width="1.1"/>
  <path d="M70 127.4 L67.2 133 L72.8 133Z" fill="${INK}"/>
  <rect x="60.5" y="136" width="19" height="5.6" rx="1.2" fill="#f3ead6" stroke="${INK}" stroke-width="1.2"/>
  <path d="M63.7 136 V141.6 M66.9 136 V141.6 M70 136 V141.6 M73.1 136 V141.6 M76.3 136 V141.6" stroke="${INK}" stroke-width="0.9"/>`;

const SEATED = `
  <g class="sk-seated">
    <g>${bone('M62 203 L56 190', 3.6, 5.6)}${bone('M78 203 L84 190', 3.6, 5.6)}</g>
    ${bone('M58 188 L60 213')}${bone('M82 188 L80 213')}
    <ellipse cx="57" cy="217" rx="6" ry="2.8" fill="url(#sk-bone)" stroke="${INK}" stroke-width="1.4"/><ellipse cx="83" cy="217" rx="6" ry="2.8" fill="url(#sk-bone)" stroke="${INK}" stroke-width="1.4"/>
    <circle cx="57" cy="186" r="6.4" fill="url(#sk-bone)" stroke="${INK}" stroke-width="1.6"/><circle cx="83" cy="186" r="6.4" fill="url(#sk-bone)" stroke="${INK}" stroke-width="1.6"/>
    ${pin(57, 186, 2.2)}${pin(83, 186, 2.2)}
    <g>${bone('M45 153 Q36 178 46 194', 3.4, 5.4)}${bone('M95 153 Q104 178 94 194', 3.4, 5.4)}</g>
    <g>${bone('M46 194 Q60 199 72 192', 3.4, 5.4)}${bone('M94 194 Q80 199 68 192', 3.4, 5.4)}</g>
    <ellipse cx="70" cy="192" rx="4.6" ry="3.4" fill="url(#sk-bone)" stroke="${INK}" stroke-width="1.3"/>
    ${pin(45, 153, 2.7)}${pin(95, 153, 2.7)}${pin(40, 176, 2.2)}${pin(100, 176, 2.2)}
  </g>`;

const SKELETON_CSS = `
  .sk-gear, .sk-ribs-0, .sk-ribs-1, .sk-ribs-2, .sk-mallet-0, .sk-mallet-1, .sk-mallet-2 { display: none; }
  .sk-seated, .sk-lids { display: none; }
  .sk-ua, .sk-fa, .sk-body, .sk-head, .sk-key, .sk-gear { transform-box: view-box; }
  .sk-ua { transform-origin: 45px 153px; }
  .sk-fa { transform-origin: 45px 171px; }
  .sk-ua-l { transform: rotate(var(--sk-ua-l, 0deg)); }
  .sk-ua-r { transform: rotate(var(--sk-ua-r, 0deg)); }
  .sk-fa-l { transform: rotate(var(--sk-fa-l, 0deg)); }
  .sk-fa-r { transform: rotate(var(--sk-fa-r, 0deg)); }
  .sk-key { transform-origin: 70px 99px; }
  .sk-flash { opacity: 0; }
`;

export function skeletonSVG(label) {
  return `
<svg viewBox="0 0 140 240" role="img" aria-label="${label}">
  <style>${SKELETON_CSS}</style>
  <defs>
    <linearGradient id="sk-bone" gradientUnits="userSpaceOnUse" x1="30" y1="104" x2="110" y2="220"><stop offset="0" stop-color="#F3EAD6"/><stop offset="0.6" stop-color="#E8DCC4"/><stop offset="1" stop-color="#B5A48B"/></linearGradient>
    <linearGradient id="sk-brass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E4C98A"/><stop offset="0.5" stop-color="#C5A059"/><stop offset="1" stop-color="#8E6F33"/></linearGradient>
    <linearGradient id="sk-silver" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E3E6E8"/><stop offset="1" stop-color="#8a9198"/></linearGradient>
    <linearGradient id="sk-tin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C4C9CD"/><stop offset="1" stop-color="#7a8187"/></linearGradient>
    <linearGradient id="sk-felt" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4a3e3a"/><stop offset="1" stop-color="#241b19"/></linearGradient>
    <radialGradient id="sk-flash-grad"><stop offset="0" stop-color="#FFF3C4" stop-opacity="0.95"/><stop offset="1" stop-color="#F7C873" stop-opacity="0"/></radialGradient>
  </defs>

  <!-- hemp control strings: the skull and both shoulders -->
  <g stroke="${STRING}" stroke-width="1.4" fill="none"><path d="M70 0 V103"/><path d="M42 0 L45 153"/><path d="M98 0 L95 153"/></g>
  <rect x="30" y="-2" width="80" height="8" rx="3" fill="#6E4B3A" stroke="${INK}" stroke-width="1.5"/>

  <g class="body">
    <g class="sk-body">
      <g class="sk-standing sk-legs">
        ${bone('M62 203 L61 216')}${bone('M61 216 L60 228')}${bone('M78 203 L79 216')}${bone('M79 216 L80 228')}
        <ellipse cx="57.5" cy="230.5" rx="6" ry="2.6" fill="url(#sk-bone)" stroke="${INK}" stroke-width="1.4"/><ellipse cx="82.5" cy="230.5" rx="6" ry="2.6" fill="url(#sk-bone)" stroke="${INK}" stroke-width="1.4"/>
        ${pin(61, 216, 2.3)}${pin(79, 216, 2.3)}
      </g>
      <path d="M54 197 Q70 206 86 197 L84 205 Q70 211 56 205Z" fill="url(#sk-bone)" stroke="${INK}" stroke-width="1.7" stroke-linejoin="round"/>
      ${pin(62, 203, 2.4)}${pin(78, 203, 2.4)}
      <g class="sk-ribcage">
        ${SPINE}
        <g class="sk-ribs">${RIBS.join('')}</g>
        ${ROW_Y.map((y, i) => `<ellipse class="sk-flash sk-flash-${i}" cx="70" cy="${y}" rx="27" ry="7" fill="url(#sk-flash-grad)"/>`).join('')}
        ${bone('M45 153 Q70 147 95 153', 3.6, 5.6)}
      </g>
      <g class="sk-standing sk-arms">${arm('l')}${arm('r')}</g>
      ${SEATED}
    </g>

    <g class="sk-head">
      ${SKULL}
      ${HEADGEAR.join('')}
    </g>
  </g>

  <g class="zzz" font-family="Georgia, serif" font-style="italic" fill="#F2E6D0">
    <text x="104" y="136" font-size="16">z</text><text x="114" y="120" font-size="20">Z</text><text x="124" y="100" font-size="24">Z</text>
  </g>
</svg>`;
}

/** Show the selected head gear, rib style and mallet (slots = [head, ribs, mallet]). */
export function applySkeletonParts(el, slots) {
  const [head, ribs, mallet] = slots;
  [0, 1, 2].forEach((i) => {
    el.querySelectorAll(`.sk-head-${i}`).forEach((n) => { n.style.display = i === head ? 'inline' : 'none'; });
    el.querySelectorAll(`.sk-ribs-${i}`).forEach((n) => { n.style.display = i === ribs ? 'inline' : 'none'; });
    el.querySelectorAll(`.sk-mallet-${i}`).forEach((n) => { n.style.display = i === mallet ? 'inline' : 'none'; });
  });
}

/** Pose for the poster: left arm mid-strike on the third rib row, right arm raised and ready. */
export function posterPoseVars() {
  const l = strikePose(2, 1);
  const r = strikePose(0, 0.25);
  return {
    '--sk-ua-l': `${l.ua.toFixed(1)}deg`, '--sk-fa-l': `${l.fa.toFixed(1)}deg`,
    '--sk-ua-r': `${r.ua.toFixed(1)}deg`, '--sk-fa-r': `${r.fa.toFixed(1)}deg`,
  };
}

// ---------------------------------------------------------------- curtain call: the skull tumble gag
//
// During the bow the skull pops off, bounces three times on the floor (a xylophone drop sound on each
// bounce), and rolls to rest. The skeleton panics, crouches over to it, picks it up with both hands,
// puts it back on, and straightens up. The whole gag fits in the 1.8 s of the curtain call.
// gagPose(t) is a pure function of time, so it is easy to test; applyGagPose() writes it to the DOM.

export const GAG_DURATION = 1.8;
export const GAG_HITS = [0.46, 0.60, 0.69];   // the skull meets the floor (sound + visual)
export const GAG_PLACE = 1.42;                // the skull lands back on the neck (a final clack)
const T_POP = 0.14, T_ROLL_END = 0.98, T_FLAIL = 0.30, T_REACH = 0.52, T_GRAB = 1.05;

// Where the skull lands: the floor level in SVG units, and how far to the left it ends up.
export const FLOOR_CENTER_Y = 262;
const REST_X = 36;

const smooth = (a, b, t) => { const u = Math.max(0, Math.min(1, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
const lerp = (a, b, k) => a + (b - a) * k;

// [t, bx, by, bt (deg), bsy] key frames of the body (crouch and lean), smoothed between keys
const BODY_KEYS = [
  [0.00, 0, 0, 0, 1.00],
  [0.22, 0, 3, 1, 0.90],      // the bow
  [0.34, 0, -1, 0, 1.02],     // the skull is gone: the body jerks upright
  [0.46, -2, 0, -3, 1.00],
  [0.58, 2, 1, 3, 1.00],
  [0.74, -12, 34, -3, 0.94],  // steps down and toward the skull
  [0.98, -26, 72, -6, 0.86],  // crouched over it
  [1.12, -26, 72, -6, 0.86],  // both hands on the skull
  [1.30, -14, 42, -3, 0.93],  // lifting it
  [1.42, -4, 12, -1, 0.98],
  [1.58, 0, -2, 0, 1.03],     // a small "ta-da" stretch
  [1.80, 0, 0, 0, 1.00],
];

function bodyAt(t) {
  const keys = BODY_KEYS;
  if (t <= keys[0][0]) return { bx: keys[0][1], by: keys[0][2], bt: keys[0][3], bsy: keys[0][4] };
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const k = smooth(keys[i - 1][0], keys[i][0], t);
      return { bx: lerp(keys[i - 1][1], keys[i][1], k), by: lerp(keys[i - 1][2], keys[i][2], k), bt: lerp(keys[i - 1][3], keys[i][3], k), bsy: lerp(keys[i - 1][4], keys[i][4], k) };
    }
  }
  const l = keys[keys.length - 1];
  return { bx: l[1], by: l[2], bt: l[3], bsy: l[4] };
}

/** A point in the body's own coordinates -> the same point after crouch, lean and shift. */
export function bodyMap(b, p) {
  const th = (b.bt * Math.PI) / 180;
  const x = p.x - FEET_PIVOT.x;
  const y = (p.y - FEET_PIVOT.y) * b.bsy;
  return { x: FEET_PIVOT.x + b.bx + x * Math.cos(th) - y * Math.sin(th), y: FEET_PIVOT.y + b.by + x * Math.sin(th) + y * Math.cos(th) };
}

/** The inverse of bodyMap: a point in the world -> the body's own coordinates. */
export function bodyUnmap(b, w) {
  const th = (-b.bt * Math.PI) / 180;
  const x = w.x - FEET_PIVOT.x - b.bx;
  const y = w.y - FEET_PIVOT.y - b.by;
  return { x: FEET_PIVOT.x + x * Math.cos(th) - y * Math.sin(th), y: FEET_PIVOT.y + (x * Math.sin(th) + y * Math.cos(th)) / b.bsy };
}

function skullAt(t, body) {
  const attached = () => {
    const c = bodyMap(body, HEAD_CENTER);
    return { x: c.x, y: c.y, rot: body.bt };
  };
  if (t < T_POP) return attached();

  const A0 = bodyMap(bodyAt(T_POP), HEAD_CENTER);
  if (t < GAG_HITS[0]) {                                   // pops off and falls
    const s = (t - T_POP) / (GAG_HITS[0] - T_POP);
    return { x: lerp(A0.x, 52, s), y: A0.y + (FLOOR_CENTER_Y - A0.y) * s * s - 60 * s * (1 - s) * (1 - s), rot: -170 * s };
  }
  if (t < GAG_HITS[1]) {                                   // first bounce
    const u = (t - GAG_HITS[0]) / (GAG_HITS[1] - GAG_HITS[0]);
    return { x: lerp(52, 44, u), y: FLOOR_CENTER_Y - 24 * 4 * u * (1 - u), rot: lerp(-170, -250, u) };
  }
  if (t < GAG_HITS[2]) {                                   // second, smaller bounce
    const u = (t - GAG_HITS[1]) / (GAG_HITS[2] - GAG_HITS[1]);
    return { x: lerp(44, 39, u), y: FLOOR_CENTER_Y - 9 * 4 * u * (1 - u), rot: lerp(-250, -300, u) };
  }
  if (t < T_ROLL_END) {                                    // rolls to a stop
    const u = smooth(0, 1, (t - GAG_HITS[2]) / (T_ROLL_END - GAG_HITS[2]));
    return { x: lerp(39, REST_X, u), y: FLOOR_CENTER_Y, rot: lerp(-300, -345, u) };
  }
  if (t < T_GRAB) return { x: REST_X, y: FLOOR_CENTER_Y, rot: -345 };
  if (t < GAG_PLACE) {                                     // carried up to the neck in both hands
    const p = smooth(T_GRAB, GAG_PLACE, t);
    const to = bodyMap(body, HEAD_CENTER);
    return { x: lerp(REST_X, to.x, p), y: lerp(FLOOR_CENTER_Y, to.y, p) - 16 * Math.sin(Math.PI * p), rot: lerp(-345, -360 + body.bt, p) };
  }
  const c = bodyMap(body, HEAD_CENTER);                     // back on: follows the body again
  return { x: c.x, y: c.y, rot: -360 + body.bt };
}

/**
 * The full pose at time t (seconds since the curtain call began).
 * `tips` are the mallet tip targets of both hands in the arm's own (mirrored for the right) coordinates.
 */
export function gagPose(t) {
  const tt = Math.max(0, Math.min(GAG_DURATION, t));
  const body = bodyAt(tt);
  const skull = skullAt(tt, body);

  const rest = { x: REST_TIP.x, y: REST_TIP.y };
  const flailW = smooth(T_FLAIL, T_FLAIL + 0.06, tt) * (1 - smooth(T_REACH, T_REACH + 0.1, tt));
  const reachW = smooth(T_REACH, T_REACH + 0.16, tt) * (1 - smooth(GAG_PLACE + 0.05, GAG_PLACE + 0.3, tt));

  const hands = ['l', 'r'].map((side) => {
    const flail = { x: 30 + 6 * Math.sin(30 * tt + (side === 'l' ? 0 : 2)), y: 116 + 7 * Math.sin(26 * tt + (side === 'l' ? 1 : 3)) };
    let tip = { x: lerp(rest.x, flail.x, flailW), y: lerp(rest.y, flail.y, flailW) };
    const worldHand = { x: skull.x + (side === 'l' ? -17 : 17), y: skull.y + 2 };
    const local = bodyUnmap(body, worldHand);
    const reach = { x: side === 'l' ? local.x : 140 - local.x, y: local.y };      // the right arm lives in mirrored coordinates
    tip = { x: lerp(tip.x, reach.x, reachW), y: lerp(tip.y, reach.y, reachW) };
    return { side, tip, ...armAngles(tip.x, tip.y), reach };
  });

  return {
    t: tt,
    body,
    head: { hx: skull.x - HEAD_CENTER.x, hy: skull.y - HEAD_CENTER.y, hr: skull.rot },
    skull,
    hands,
    detached: tt >= T_POP && tt < GAG_PLACE,
  };
}

/** Apply a gag pose to a puppet element (CSS variables read by style.css and the SVG's own style). */
export function applyGagPose(el, pose) {
  const set = (k, v) => el.style.setProperty(k, v);
  set('--sk-bx', `${pose.body.bx.toFixed(2)}px`);
  set('--sk-by', `${pose.body.by.toFixed(2)}px`);
  set('--sk-bt', `${pose.body.bt.toFixed(2)}deg`);
  set('--sk-bsy', pose.body.bsy.toFixed(3));
  set('--sk-hx', `${pose.head.hx.toFixed(2)}px`);
  set('--sk-hy', `${pose.head.hy.toFixed(2)}px`);
  set('--sk-hr', `${pose.head.hr.toFixed(2)}deg`);
  pose.hands.forEach((h) => setArmVars(el, h.side, h));
}

/** Remove every gag variable so the normal styling takes over again. */
export function clearGagPose(el) {
  ['--sk-bx', '--sk-by', '--sk-bt', '--sk-bsy', '--sk-hx', '--sk-hy', '--sk-hr'].forEach((k) => el.style.removeProperty(k));
}
