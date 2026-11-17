// The pumpkin (pumpkin-art.js, Task 3), the skeleton (skeleton-art.js, Task 5) and the cauldron
// (cauldron-art.js, Task 6) have their real art. The ghost is still a placeholder silhouette; Task 7 replaces it.
// The hemp control strings (rgba(212,195,163,0.35)) and the wooden control bar are shared by every puppet.

import { pumpkinSVG, applyPumpkinParts, PUMPKIN_STATIC_CSS } from './pumpkin-art.js';
import { skeletonSVG, applySkeletonParts, posterPoseVars } from './skeleton-art.js';
import { cauldronSVG, applyCauldronParts, CAULDRON_STATIC_CSS } from './cauldron-art.js';

const STRING = 'rgba(212, 195, 163, 0.35)';
const INK = '#2C1E18';

const bodies = {
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
  if (puppet.id === 'pumpkin') {
    el.innerHTML = pumpkinSVG(puppet.name);
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', `Poke the ${puppet.name}`);
    return el;
  }
  if (puppet.id === 'cauldron') {
    el.innerHTML = cauldronSVG(puppet.name);
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', `Poke the ${puppet.name}`);
    return el;
  }
  if (puppet.id === 'skeleton') {
    el.innerHTML = skeletonSVG(puppet.name);
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', `Poke the ${puppet.name}`);
    return el;
  }
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

/**
 * A standalone SVG string of a puppet with its current parts, for drawing onto the poster canvas.
 * The viewBox is padded so the control bar and the shadows are not clipped. Zzz is hidden.
 */
export function puppetSVGString(puppet, slots) {
  const el = createPuppetElement(puppet);
  if (puppet.id === 'pumpkin') applyPumpkinParts(el, slots);
  if (puppet.id === 'skeleton') applySkeletonParts(el, slots);
  if (puppet.id === 'cauldron') applyCauldronParts(el, slots);
  const svg = el.querySelector('svg').cloneNode(true);
  const NS = 'http://www.w3.org/2000/svg';
  svg.setAttribute('xmlns', NS);
  svg.setAttribute('viewBox', '-6 -6 152 252');
  svg.setAttribute('width', '608');
  svg.setAttribute('height', '1008');
  const style = document.createElementNS(NS, 'style');
  style.textContent = `.zzz { display: none; } ${puppet.id === 'pumpkin' ? PUMPKIN_STATIC_CSS : ''} ${puppet.id === 'cauldron' ? CAULDRON_STATIC_CSS : ''}`;
  svg.insertBefore(style, svg.firstChild);
  if (puppet.id === 'skeleton') {
    Object.entries(posterPoseVars()).forEach(([k, v]) => svg.style.setProperty(k, v)); // mid-strike pose
  }
  return new XMLSerializer().serializeToString(svg);
}

/** Viewbox the poster uses for puppet images, so callers can scale them. */
export const PUPPET_IMAGE_ASPECT = { width: 152, height: 252 };
