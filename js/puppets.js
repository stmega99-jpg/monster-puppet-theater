// Each puppet's art lives in its own file: pumpkin-art.js (Task 3), skeleton-art.js (Task 5),
// cauldron-art.js (Task 6) and ghost-art.js (Task 7). Every one draws the same hemp control strings
// (rgba(212,195,163,0.35)) and wooden control bar.

import { pumpkinSVG, applyPumpkinParts, PUMPKIN_STATIC_CSS } from './pumpkin-art.js';
import { skeletonSVG, applySkeletonParts, posterPoseVars } from './skeleton-art.js';
import { cauldronSVG, applyCauldronParts, CAULDRON_STATIC_CSS } from './cauldron-art.js';
import { ghostSVG, applyGhostParts, GHOST_STATIC_CSS } from './ghost-art.js';

const ART = {
  pumpkin: pumpkinSVG,
  skeleton: skeletonSVG,
  cauldron: cauldronSVG,
  ghost: ghostSVG,
};

export function createPuppetElement(puppet) {
  const el = document.createElement('div');
  el.className = `puppet puppet--${puppet.id}`;
  el.dataset.puppet = puppet.id;
  el.dataset.name = `${puppet.icon} ${puppet.name}`;
  el.innerHTML = ART[puppet.id](puppet.name);
  el.tabIndex = 0;
  el.setAttribute('role', 'button');
  el.setAttribute('aria-label', `Poke the ${puppet.name}`);
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
  if (puppet.id === 'ghost') applyGhostParts(el, slots);
  const svg = el.querySelector('svg').cloneNode(true);
  const NS = 'http://www.w3.org/2000/svg';
  svg.setAttribute('xmlns', NS);
  svg.setAttribute('viewBox', '-6 -6 152 252');
  svg.setAttribute('width', '608');
  svg.setAttribute('height', '1008');
  const style = document.createElementNS(NS, 'style');
  style.textContent = `.zzz { display: none; } ${puppet.id === 'pumpkin' ? PUMPKIN_STATIC_CSS : ''} ${puppet.id === 'cauldron' ? CAULDRON_STATIC_CSS : ''} ${puppet.id === 'ghost' ? GHOST_STATIC_CSS : ''}`;
  svg.insertBefore(style, svg.firstChild);
  if (puppet.id === 'skeleton') {
    Object.entries(posterPoseVars()).forEach(([k, v]) => svg.style.setProperty(k, v)); // mid-strike pose
  }
  return new XMLSerializer().serializeToString(svg);
}

/** Viewbox the poster uses for puppet images, so callers can scale them. */
export const PUPPET_IMAGE_ASPECT = { width: 152, height: 252 };
