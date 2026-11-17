// Placeholder bodies (silhouettes) for Task 1. Tasks 3, 5, 6 and 7 replace them with the real puppet art.
// The hemp control strings (rgba(212,195,163,0.35)) and the wooden control bar are shared by every puppet.

const STRING = 'rgba(212, 195, 163, 0.35)';
const INK = '#2C1E18';

const bodies = {
  pumpkin: `
    <ellipse cx="70" cy="150" rx="46" ry="40" fill="#D97236" stroke="${INK}" stroke-width="2.5"/>
    <path d="M70 112 C56 130 56 170 70 188 M70 112 C84 130 84 170 70 188" fill="none" stroke="#B85A25" stroke-width="2"/>
    <path d="M62 112 q8 -16 16 0" fill="#5B4A2A" stroke="${INK}" stroke-width="2"/>
    <g class="eyes"><path d="M50 140 q8 -8 16 0 q-8 3 -16 0z M74 140 q8 -8 16 0 q-8 3 -16 0z" fill="#F7C873" stroke="${INK}" stroke-width="1.5"/></g>
    <path d="M52 162 q18 14 36 0" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>`,
  skeleton: `
    <rect x="42" y="112" width="56" height="44" rx="20" fill="#E8DCC4" stroke="${INK}" stroke-width="2.5"/>
    <circle cx="58" cy="130" r="6" fill="${INK}"/><circle cx="82" cy="130" r="6" fill="${INK}"/>
    <path d="M66 142 l4 -5 l4 5z" fill="${INK}"/>
    <path d="M52 150 v6 M60 150 v6 M68 150 v6 M76 150 v6 M84 150 v6" stroke="${INK}" stroke-width="2"/>
    <g fill="none" stroke="#B5A48B" stroke-width="3" stroke-linecap="round">
      <path d="M70 158 v52"/><path d="M48 172 q22 -8 44 0 M50 186 q20 -7 40 0 M52 200 q18 -6 36 0"/>
    </g>`,
  cauldron: `
    <ellipse cx="70" cy="132" rx="46" ry="12" fill="#1A1D24" stroke="${INK}" stroke-width="2.5"/>
    <path d="M24 132 C20 180 40 204 70 204 C100 204 120 180 116 132 Z" fill="#2B303A" stroke="${INK}" stroke-width="2.5"/>
    <ellipse cx="70" cy="132" rx="40" ry="8" fill="#76A884" opacity="0.85"/>
    <circle cx="56" cy="130" r="4" fill="#B6D8BF" opacity="0.8"/><circle cx="82" cy="133" r="3" fill="#B6D8BF" opacity="0.8"/>
    <path d="M38 204 l-4 14 M102 204 l4 14" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`,
  ghost: `
    <path d="M30 210 C26 150 34 106 70 106 C106 106 114 150 110 210 q-10 -10 -20 0 q-10 -10 -20 0 q-10 -10 -20 0 q-10 -10 -20 0z"
          fill="#EAE6DF" stroke="${INK}" stroke-width="2.5"/>
    <ellipse cx="56" cy="142" rx="5" ry="7" fill="${INK}"/><ellipse cx="84" cy="142" rx="5" ry="7" fill="${INK}"/>
    <ellipse cx="46" cy="158" rx="8" ry="5" fill="#D98A82" opacity="0.6"/><ellipse cx="94" cy="158" rx="8" ry="5" fill="#D98A82" opacity="0.6"/>
    <ellipse cx="70" cy="164" rx="5" ry="6" fill="${INK}"/>`,
};

export function createPuppetElement(puppet) {
  const el = document.createElement('div');
  el.className = `puppet puppet--${puppet.id}`;
  el.dataset.puppet = puppet.id;
  el.dataset.name = `${puppet.icon} ${puppet.name}`;
  el.innerHTML = `
    <svg viewBox="0 0 140 240" role="img" aria-label="${puppet.name}">
      <g stroke="${STRING}" stroke-width="1.4" fill="none">
        <path d="M70 0 V112"/><path d="M42 0 L52 118"/><path d="M98 0 L88 118"/>
      </g>
      <rect x="30" y="-2" width="80" height="8" rx="3" fill="#6E4B3A" stroke="${INK}" stroke-width="1.5"/>
      <g class="body">${bodies[puppet.id]}</g>
      <g class="zzz" font-family="Georgia, serif" font-style="italic" fill="#F2E6D0">
        <text x="96" y="110" font-size="16">z</text><text x="108" y="94" font-size="20">Z</text><text x="118" y="74" font-size="24">Z</text>
      </g>
    </svg>`;
  return el;
}
