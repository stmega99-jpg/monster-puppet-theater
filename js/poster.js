// Souvenir performance poster, drawn with the plain Canvas 2D API (no libraries).
//
// A faded storybook playbill: foxed parchment with a double border, the band name in a big serif,
// a small picture of the puppet stage (night backdrop, velvet curtains, candle footlights) with the
// four puppets hanging from their strings, the cast with every chosen part, the song title and
// genre, and a rubber stamp. All randomness comes from a PRNG seeded with the band name and song
// title, so the same lineup always prints the same poster.

import { PUPPETS } from './parts.js';
import { puppetSVGString, PUPPET_IMAGE_ASPECT } from './puppets.js';

export const POSTER_WIDTH = 1200;
export const POSTER_HEIGHT = 1700;

const FONT = "'Palatino Linotype', 'Book Antiqua', Palatino, Georgia, 'Times New Roman', serif";
const INK = '#2C1E18';
const RED = '#6B1D2F';
const RED_DARK = '#3D0E19';
const PARCHMENT = '#F2E6D0';
const BRASS_LIGHT = '#E4C98A';
const BRASS = '#C5A059';
const BRASS_DARK = '#8E6F33';
const CANDLE = '#F7C873';

// ---------------------------------------------------------------- helpers

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const setFont = (ctx, px, { weight = '400', style = 'normal' } = {}) => {
  ctx.font = `${style} ${weight} ${px}px ${FONT}`;
};

/** Largest font size (from startPx down to minPx) at which the text fits maxWidth. */
function fitFont(ctx, text, maxWidth, startPx, minPx, opts) {
  let px = startPx;
  for (; px > minPx; px -= 2) {
    setFont(ctx, px, opts);
    if (ctx.measureText(text).width <= maxWidth) break;
  }
  setFont(ctx, px, opts);
  return px;
}

/** Letter-spaced text (done by hand so it works in every browser). */
function spacedText(ctx, text, x, y, spacing, align = 'center') {
  const chars = [...text];
  const widths = chars.map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  ctx.save();
  ctx.textAlign = 'left';
  chars.forEach((c, i) => { ctx.fillText(c, cx, y); cx += widths[i] + spacing; });
  ctx.restore();
  return total;
}

function diamond(ctx, x, y, r) {
  ctx.beginPath();
  ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y);
  ctx.closePath();
}

function star(ctx, x, y, outer, inner) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const px = x + r * Math.cos(a), py = y + r * Math.sin(a);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function brassGradient(ctx, y0, y1) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, BRASS_LIGHT); g.addColorStop(0.5, BRASS); g.addColorStop(1, BRASS_DARK);
  return g;
}

function loadSvgImage(svg) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not rasterize a puppet SVG for the poster'));
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}

// ---------------------------------------------------------------- paper and border

function drawPaper(ctx, rng, w, h) {
  ctx.fillStyle = PARCHMENT;
  ctx.fillRect(0, 0, w, h);

  // uneven aging: warm stains and lighter patches
  for (let i = 0; i < 18; i++) {
    const x = rng() * w, y = rng() * h, r = 160 + rng() * 360;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const warm = i % 4 !== 3;
    g.addColorStop(0, warm ? `rgba(168, 118, 62, ${0.05 + rng() * 0.07})` : `rgba(255, 250, 235, ${0.18 + rng() * 0.12})`);
    g.addColorStop(1, 'rgba(168, 118, 62, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  // paper grain
  for (let i = 0; i < 16000; i++) {
    ctx.fillStyle = rng() < 0.72 ? `rgba(90, 60, 30, ${0.03 + rng() * 0.06})` : `rgba(255, 255, 255, ${0.1 + rng() * 0.15})`;
    ctx.fillRect(rng() * w, rng() * h, 1 + rng() * 1.8, 1 + rng() * 1.8);
  }

  // fibers
  ctx.lineWidth = 0.7;
  for (let i = 0; i < 300; i++) {
    const x = rng() * w, y = rng() * h, len = 6 + rng() * 22, a = rng() * Math.PI * 2;
    ctx.strokeStyle = `rgba(110, 75, 40, ${0.04 + rng() * 0.06})`;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + Math.cos(a) * len * 0.5 + rng() * 4, y + Math.sin(a) * len * 0.5 + rng() * 4, x + Math.cos(a) * len, y + Math.sin(a) * len);
    ctx.stroke();
  }

  // foxing spots
  for (let i = 0; i < 34; i++) {
    const x = rng() * w, y = rng() * h, r = 3 + rng() * 15;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(140, 84, 36, ${0.12 + rng() * 0.14})`);
    g.addColorStop(1, 'rgba(140, 84, 36, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  // fold creases (a quarter fold: one vertical, one horizontal)
  const crease = (x0, y0, x1, y1) => {
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(70, 40, 20, 0.10)';
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255, 255, 255, 0.32)';
    ctx.beginPath(); ctx.moveTo(x0 + (x1 === x0 ? 2 : 0), y0 + (y1 === y0 ? 2 : 0)); ctx.lineTo(x1 + (x1 === x0 ? 2 : 0), y1 + (y1 === y0 ? 2 : 0)); ctx.stroke();
  };
  crease(w / 2, 0, w / 2, h);
  crease(0, h / 2, w, h / 2);

  // burnt, darkened edges
  const edge = ctx.createRadialGradient(w / 2, h / 2, h * 0.34, w / 2, h / 2, h * 0.86);
  edge.addColorStop(0, 'rgba(70, 40, 15, 0)');
  edge.addColorStop(1, 'rgba(70, 40, 15, 0.5)');
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, w, h);
}

function drawBorder(ctx, w, h) {
  ctx.strokeStyle = INK;
  ctx.lineWidth = 7;
  ctx.strokeRect(44, 44, w - 88, h - 88);
  ctx.lineWidth = 2;
  ctx.strokeRect(62, 62, w - 124, h - 124);

  [[62, 62, 1, 1], [w - 62, 62, -1, 1], [62, h - 62, 1, -1], [w - 62, h - 62, -1, -1]].forEach(([x, y, sx, sy]) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(sx, sy);
    ctx.lineWidth = 2;
    ctx.strokeStyle = INK;
    ctx.beginPath(); ctx.arc(0, 0, 40, 0, Math.PI / 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 26, 0, Math.PI / 2); ctx.stroke();
    ctx.fillStyle = RED;
    diamond(ctx, 0, 0, 13); ctx.fill(); ctx.lineWidth = 1.6; ctx.stroke();
    ctx.fillStyle = INK;
    [58, 72, 86].forEach((d) => {
      ctx.beginPath(); ctx.arc(d, 0, 2.6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(0, d, 2.6, 0, Math.PI * 2); ctx.fill();
    });
    ctx.restore();
  });
}

function drawRule(ctx, y, x0, x1, color = RED) {
  const mid = (x0 + x1) / 2;
  ctx.strokeStyle = color; ctx.fillStyle = color;
  ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(mid - 26, y); ctx.moveTo(mid + 26, y); ctx.lineTo(x1, y); ctx.stroke();
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x0 + 14, y + 6); ctx.lineTo(mid - 40, y + 6); ctx.moveTo(mid + 40, y + 6); ctx.lineTo(x1 - 14, y + 6); ctx.stroke();
  diamond(ctx, mid, y, 9); ctx.fill();
  diamond(ctx, mid - 22, y, 4); ctx.fill();
  diamond(ctx, mid + 22, y, 4); ctx.fill();
}

// ---------------------------------------------------------------- the stage picture

function bat(ctx, x, y, s) {
  ctx.save();
  ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-8, -9, -22, -4);
  ctx.quadraticCurveTo(-16, 0, -14, 6);
  ctx.quadraticCurveTo(-8, 1, -4, 4);
  ctx.quadraticCurveTo(0, 8, 4, 4);
  ctx.quadraticCurveTo(8, 1, 14, 6);
  ctx.quadraticCurveTo(16, 0, 22, -4);
  ctx.quadraticCurveTo(8, -9, 0, 0);
  ctx.fill();
  ctx.restore();
}

function drawBackdrop(ctx, pw, ph, rng) {
  const sky = ctx.createLinearGradient(0, 0, 0, ph);
  sky.addColorStop(0, '#3b3040'); sky.addColorStop(0.38, '#5b4046'); sky.addColorStop(0.62, '#7d5a4b'); sky.addColorStop(1, '#3a2a25');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, pw, ph);

  // stars
  for (let i = 0; i < 46; i++) {
    ctx.fillStyle = `rgba(242, 230, 208, ${0.2 + rng() * 0.5})`;
    ctx.fillRect(rng() * pw, rng() * ph * 0.42, 1.5 + rng() * 1.5, 1.5 + rng() * 1.5);
  }

  // the SVG paths below use the 800 x 450 coordinates of the stage backdrop on the page
  ctx.save();
  ctx.scale(pw / 800, ph / 450);
  ctx.fillStyle = 'rgba(242, 230, 208, 0.12)'; ctx.beginPath(); ctx.arc(610, 105, 70, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(232, 217, 181, 0.88)'; ctx.beginPath(); ctx.arc(610, 105, 46, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(201, 184, 143, 0.6)';
  ctx.beginPath(); ctx.arc(596, 96, 8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(626, 120, 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2b1f1d';
  ctx.fill(new Path2D('M0 330 Q110 262 240 312 T500 300 T800 288 V450 H0Z'));
  ctx.fillStyle = '#1d1413';
  ctx.fill(new Path2D('M150 318 V236 L172 214 L194 236 V318Z M130 236 L172 190 L214 236Z M198 258 h34 v60 h-34z M194 258 L215 232 L236 258Z M170 190 V170 h4 v20z'));
  ctx.fillStyle = 'rgba(197, 160, 89, 0.7)';
  ctx.fillRect(162, 246, 8, 12); ctx.fillRect(176, 246, 8, 12); ctx.fillRect(208, 274, 7, 10);
  ctx.strokeStyle = '#1d1413'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.stroke(new Path2D('M60 330 V268 M60 290 L38 270 M60 280 L84 258 M60 300 L40 292 M84 258 L96 244 M38 270 L28 252'));
  ctx.fillStyle = '#231918';
  ctx.fill(new Path2D('M0 372 Q200 340 420 366 T800 356 V450 H0Z'));
  ctx.restore();

  // bats against the moon
  ctx.fillStyle = 'rgba(26, 20, 18, 0.8)';
  bat(ctx, pw * 0.64, ph * 0.13, 0.9);
  bat(ctx, pw * 0.70, ph * 0.24, 0.65);
  bat(ctx, pw * 0.58, ph * 0.27, 0.5);
}

function drawFloor(ctx, pw, ph) {
  const top = ph * 0.83;
  const g = ctx.createLinearGradient(0, top, 0, ph);
  g.addColorStop(0, '#2a1c16'); g.addColorStop(1, '#4a3228');
  ctx.fillStyle = g;
  ctx.fillRect(0, top, pw, ph - top);
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)'; ctx.lineWidth = 2;
  for (let x = 0; x <= pw; x += pw * 0.09) { ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, ph); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, top); ctx.lineTo(pw, top); ctx.stroke();
  const shade = ctx.createLinearGradient(0, top, 0, top + 40);
  shade.addColorStop(0, 'rgba(0, 0, 0, 0.55)'); shade.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = shade; ctx.fillRect(0, top, pw, 40);
}

function drawCurtainSide(ctx, pw, ph) {
  const w0 = 112;
  const path = new Path2D();
  path.moveTo(0, 0); path.lineTo(w0 + 8, 0);
  path.bezierCurveTo(w0 - 26, ph * 0.28, w0 + 30, ph * 0.58, w0 - 4, ph);
  path.lineTo(0, ph); path.closePath();
  const g = ctx.createLinearGradient(0, 0, w0 + 30, 0);
  g.addColorStop(0, RED_DARK); g.addColorStop(0.55, RED); g.addColorStop(1, RED_DARK);
  ctx.save();
  ctx.fillStyle = g; ctx.fill(path);
  ctx.clip(path);
  for (let x = 4; x < w0 + 40; x += 18) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)'; ctx.fillRect(x, 0, 7, ph);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.07)'; ctx.fillRect(x + 8, 0, 4, ph);
  }
  const v = ctx.createLinearGradient(0, 0, 0, ph);
  v.addColorStop(0, 'rgba(0, 0, 0, 0.4)'); v.addColorStop(0.2, 'rgba(0, 0, 0, 0)'); v.addColorStop(0.75, 'rgba(0, 0, 0, 0)'); v.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
  ctx.fillStyle = v; ctx.fillRect(0, 0, w0 + 40, ph);
  ctx.restore();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)'; ctx.lineWidth = 2; ctx.stroke(path);
}

function drawValance(ctx, pw) {
  const bar = 54, n = 12, r = pw / n / 2;
  const g = ctx.createLinearGradient(0, 0, 0, bar);
  g.addColorStop(0, '#7b2338'); g.addColorStop(0.6, RED); g.addColorStop(1, RED_DARK);
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 6;
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, pw, bar);
  for (let i = 0; i < n; i++) { ctx.beginPath(); ctx.arc(r + i * 2 * r, bar, r - 2, 0, Math.PI); ctx.fill(); }
  ctx.restore();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  for (let x = 0; x < pw; x += 28) ctx.fillRect(x, 0, 3, bar);
  ctx.fillStyle = brassGradient(ctx, bar - 6, bar);
  ctx.fillRect(0, bar - 5, pw, 5);
  // tassels
  [r * 0.7, pw - r * 0.7].forEach((x) => {
    ctx.fillStyle = brassGradient(ctx, bar, bar + 80);
    ctx.beginPath(); ctx.moveTo(x - 8, bar + 6); ctx.quadraticCurveTo(x - 14, bar + 64, x, bar + 88); ctx.quadraticCurveTo(x + 14, bar + 64, x + 8, bar + 6); ctx.closePath();
    ctx.fill(); ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)'; ctx.lineWidth = 1.5; ctx.stroke();
  });
}

function drawFootlights(ctx, pw, ph) {
  const trayY = ph - 24;
  const x0 = pw * 0.1, x1 = pw * 0.9;
  // warm light on the floor
  const g = ctx.createRadialGradient(pw / 2, ph, 0, pw / 2, ph, pw * 0.55);
  g.addColorStop(0, 'rgba(247, 200, 115, 0.5)'); g.addColorStop(1, 'rgba(247, 200, 115, 0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, pw, ph); // whole picture: a smaller rect left a hard edge

  const n = 9;
  for (let i = 0; i < n; i++) {
    const x = x0 + ((x1 - x0) * i) / (n - 1);
    const waxTop = trayY - 34;
    // glow
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const gl = ctx.createRadialGradient(x, waxTop - 14, 0, x, waxTop - 14, 52);
    gl.addColorStop(0, 'rgba(247, 200, 115, 0.45)'); gl.addColorStop(1, 'rgba(247, 200, 115, 0)');
    ctx.fillStyle = gl; ctx.fillRect(x - 52, waxTop - 66, 104, 104);
    ctx.restore();
    // wax
    const wg = ctx.createLinearGradient(x - 8, 0, x + 8, 0);
    wg.addColorStop(0, '#cbb98f'); wg.addColorStop(0.4, '#F0E3C0'); wg.addColorStop(1, '#cbb98f');
    ctx.fillStyle = wg; ctx.fillRect(x - 8, waxTop, 16, 34);
    ctx.fillStyle = '#F6EBCB'; ctx.beginPath(); ctx.ellipse(x - 3, waxTop + 8, 2.6, 8, 0, 0, Math.PI * 2); ctx.fill();
    // wick and flame
    ctx.strokeStyle = '#1a120d'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, waxTop); ctx.lineTo(x, waxTop - 6); ctx.stroke();
    const fg = ctx.createRadialGradient(x, waxTop - 10, 1, x, waxTop - 12, 11);
    fg.addColorStop(0, '#fffbe6'); fg.addColorStop(0.5, CANDLE); fg.addColorStop(1, '#D97236');
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.moveTo(x, waxTop - 28);
    ctx.bezierCurveTo(x + 9, waxTop - 16, x + 7, waxTop - 5, x, waxTop - 5);
    ctx.bezierCurveTo(x - 7, waxTop - 5, x - 9, waxTop - 16, x, waxTop - 28);
    ctx.fill();
  }
  // brass tray
  ctx.fillStyle = brassGradient(ctx, trayY, trayY + 14);
  ctx.beginPath(); ctx.roundRect(x0 - 40, trayY, x1 - x0 + 80, 14, 5); ctx.fill();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)'; ctx.lineWidth = 1.5; ctx.stroke();
}

function drawNameplate(ctx, text, cx, y) {
  setFont(ctx, 19, { weight: '700' });
  const w = Math.max(120, ctx.measureText(text).width + 36);
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)'; ctx.shadowBlur = 5; ctx.shadowOffsetY = 2;
  ctx.fillStyle = brassGradient(ctx, y - 14, y + 14);
  ctx.beginPath(); ctx.roundRect(cx - w / 2, y - 14, w, 28, 4); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.roundRect(cx - w / 2, y - 14, w, 28, 4); ctx.stroke();
  ctx.fillStyle = '#2a1d08'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, y + 1);
  ctx.textBaseline = 'alphabetic';
}

function drawStagePicture(ctx, px, py, pw, ph, images, rng) {
  const F = 26; // wooden frame thickness
  ctx.save();
  ctx.translate(px, py);

  // wooden frame with grain
  ctx.save();
  ctx.shadowColor = 'rgba(30, 15, 5, 0.6)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 12;
  const wood = ctx.createLinearGradient(0, -F, 0, ph + F);
  wood.addColorStop(0, '#6E4B3A'); wood.addColorStop(0.4, '#4A3228'); wood.addColorStop(1, '#3A2620');
  ctx.fillStyle = wood;
  ctx.fillRect(-F, -F, pw + 2 * F, ph + 2 * F);
  ctx.restore();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.14)'; ctx.lineWidth = 1;
  for (let i = 0; i < 90; i++) {
    const y = -F + rng() * (ph + 2 * F);
    ctx.beginPath(); ctx.moveTo(-F, y); ctx.lineTo(pw + F, y + (rng() - 0.5) * 6); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)'; ctx.lineWidth = 3; ctx.strokeRect(-F, -F, pw + 2 * F, ph + 2 * F);
  ctx.strokeStyle = '#6E4B3A'; ctx.lineWidth = 2; ctx.strokeRect(-F + 6, -F + 6, pw + 2 * F - 12, ph + 2 * F - 12);

  // everything on the stage is clipped to the picture window
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, pw, ph); ctx.clip();

  drawBackdrop(ctx, pw, ph, rng);
  drawFloor(ctx, pw, ph);

  // Puppets, hanging from their bars. Each has its own centre, set from how wide the finished puppet
  // is (the cauldron and the ghost carry handles and held items), so nothing is hidden behind a curtain.
  const centers = [0.2, 0.365, 0.557, 0.752].map((f) => f * pw);
  const drawH = 436;
  const drawW = (drawH * PUPPET_IMAGE_ASPECT.width) / PUPPET_IMAGE_ASPECT.height;
  const sway = [-1.6, 1.2, -0.9, 1.8];
  images.forEach(({ img, name }, i) => {
    const cx = centers[i] ?? pw * ((i + 0.5) / images.length);
    ctx.save();
    ctx.translate(cx, 12);
    ctx.rotate((sway[i % sway.length] * Math.PI) / 180);
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 10;
    ctx.drawImage(img, -drawW / 2, 0, drawW, drawH);
    ctx.restore();
    drawNameplate(ctx, name, cx, ph * 0.83 - 20);
  });

  drawCurtainSide(ctx, pw, ph);
  ctx.save(); ctx.translate(pw, 0); ctx.scale(-1, 1); drawCurtainSide(ctx, pw, ph); ctx.restore();
  drawValance(ctx, pw);
  drawFootlights(ctx, pw, ph);

  // soft vignette over the whole picture
  const vg = ctx.createRadialGradient(pw / 2, ph / 2, ph * 0.35, pw / 2, ph / 2, pw * 0.62);
  vg.addColorStop(0, 'rgba(0, 0, 0, 0)'); vg.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, pw, ph);
  // faded print: a little sepia over everything
  ctx.fillStyle = 'rgba(120, 80, 40, 0.10)'; ctx.fillRect(0, 0, pw, ph);
  ctx.restore();

  // brass window rule and corner rosettes
  ctx.strokeStyle = '#1b110d'; ctx.lineWidth = 8; ctx.strokeRect(-2, -2, pw + 4, ph + 4);
  ctx.strokeStyle = BRASS; ctx.lineWidth = 3.5; ctx.strokeRect(-2, -2, pw + 4, ph + 4);
  [[-F, -F], [pw + F, -F], [-F, ph + F], [pw + F, ph + F]].forEach(([x, y]) => {
    const g = ctx.createRadialGradient(x - 4, y - 5, 2, x, y, 20);
    g.addColorStop(0, BRASS_LIGHT); g.addColorStop(0.5, BRASS); g.addColorStop(1, '#6E5222');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 19, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#4a3410'; ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill();
  });
  ctx.restore();
}

// ---------------------------------------------------------------- text blocks

function drawHeader(ctx, w) {
  ctx.fillStyle = INK; ctx.textAlign = 'center';
  setFont(ctx, 26, { weight: '700' });
  spacedText(ctx, 'THE HAUNTED PUPPET THEATER', w / 2, 122, 9);
  drawRule(ctx, 146, 150, w - 150);
  setFont(ctx, 30, { style: 'italic' });
  ctx.fillText('proudly presents', w / 2, 192);
}

function drawBandName(ctx, info, w) {
  const maxW = w - 220;
  ctx.textAlign = 'center';
  ctx.save();
  ctx.shadowColor = 'rgba(255, 244, 220, 0.8)'; ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 3; ctx.shadowBlur = 0;
  ctx.fillStyle = INK;
  fitFont(ctx, info.nameTop, maxW, 108, 52, { weight: '700' });
  ctx.fillText(info.nameTop, w / 2, 304);
  ctx.restore();

  ctx.fillStyle = RED;
  fitFont(ctx, info.nameBottom, maxW, 58, 34, { weight: '700', style: 'italic' });
  ctx.fillText(info.nameBottom, w / 2, 372);

  ctx.fillStyle = INK;
  fitFont(ctx, info.tagline, maxW, 28, 18, { style: 'italic' });
  ctx.fillText(info.tagline, w / 2, 414);
}

function drawCast(ctx, info, w, y0) {
  ctx.fillStyle = INK; ctx.textAlign = 'center';
  setFont(ctx, 24, { weight: '700' });
  spacedText(ctx, 'THE CAST', w / 2, y0, 10);
  ctx.strokeStyle = RED; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(150, y0 - 8); ctx.lineTo(w / 2 - 110, y0 - 8); ctx.moveTo(w / 2 + 110, y0 - 8); ctx.lineTo(w - 150, y0 - 8); ctx.stroke();

  info.cast.forEach((member, i) => {
    const x = i % 2 === 0 ? 150 : 660;
    const y = y0 + 48 + Math.floor(i / 2) * 118;
    ctx.fillStyle = RED; diamond(ctx, x - 18, y - 8, 7); ctx.fill();
    ctx.textAlign = 'left';
    ctx.fillStyle = INK;
    setFont(ctx, 25, { weight: '700' });
    ctx.fillText(member.name, x, y);
    const nameW = ctx.measureText(member.name).width;
    ctx.fillStyle = 'rgba(44, 30, 24, 0.7)';
    setFont(ctx, 19, { style: 'italic' });
    ctx.fillText(member.role, x + nameW + 12, y);
    ctx.fillStyle = INK;
    setFont(ctx, 21, { style: 'italic' });
    member.parts.forEach((part, k) => ctx.fillText(`\u2022  ${part}`, x + 6, y + 30 + k * 26));
  });
}

function drawProgram(ctx, info, w, y0) {
  drawRule(ctx, y0, 150, w - 150);
  ctx.textAlign = 'center'; ctx.fillStyle = INK;
  setFont(ctx, 22, { weight: '700' });
  spacedText(ctx, 'NOW PERFORMING', w / 2, y0 + 44, 8);
  ctx.fillStyle = RED;
  fitFont(ctx, `\u201C${info.songTitle}\u201D`, w - 240, 60, 30, { weight: '700', style: 'italic' });
  ctx.fillText(`\u201C${info.songTitle}\u201D`, w / 2, y0 + 108);
  ctx.fillStyle = INK;
  setFont(ctx, 28, { style: 'italic' });
  ctx.fillText(`A ${info.genre}  \u00B7  ${info.bpm} BPM`, w / 2, y0 + 154);
  ctx.fillStyle = 'rgba(44, 30, 24, 0.75)';
  setFont(ctx, 19, { style: 'italic' });
  ctx.fillText('Doors open at midnight  \u00B7  Ghosts admitted free  \u00B7  No refunds after the curtain call', w / 2, y0 + 196);
}

// ---------------------------------------------------------------- the rubber stamp

function arcText(ctx, text, cx, cy, r, centerAngle, px, bottom) {
  setFont(ctx, px, { weight: '700' });
  const chars = [...text];
  const widths = chars.map((c) => ctx.measureText(c).width + 3);
  const total = widths.reduce((a, b) => a + b, 0);
  let a = bottom ? centerAngle + total / (2 * r) : centerAngle - total / (2 * r);
  chars.forEach((c, i) => {
    const half = widths[i] / (2 * r);
    a += bottom ? -half : half;
    ctx.save();
    ctx.translate(cx + r * Math.cos(a), cy + r * Math.sin(a));
    ctx.rotate(bottom ? a - Math.PI / 2 : a + Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText(c, 0, 0);
    ctx.restore();
    a += bottom ? -half : half;
  });
}

function drawStamp(ctx, cx, cy, rng, scale = 1) {
  const S = 280, c = S / 2;
  const off = document.createElement('canvas');
  off.width = S; off.height = S;
  const o = off.getContext('2d');
  const ink = 'rgba(138, 30, 52, 0.88)';
  o.strokeStyle = ink; o.fillStyle = ink;
  o.lineWidth = 8; o.beginPath(); o.arc(c, c, 128, 0, Math.PI * 2); o.stroke();
  o.lineWidth = 2.5; o.beginPath(); o.arc(c, c, 118, 0, Math.PI * 2); o.stroke();
  o.beginPath(); o.arc(c, c, 78, 0, Math.PI * 2); o.stroke();
  arcText(o, 'MONSTER PUPPET THEATER', c, c, 98, -Math.PI / 2, 16, false);
  arcText(o, '\u2605 KIROWEEN 2026 \u2605', c, c, 98, Math.PI / 2, 18, true);
  star(o, c, c - 30, 15, 6.5); o.fill();
  o.textAlign = 'center';
  setFont(o, 21, { weight: '700' }); o.fillText('ONE NIGHT', c, c + 6);
  setFont(o, 21, { weight: '700' }); o.fillText('ONLY', c, c + 30);
  // worn ink: knock out random specks
  o.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 420; i++) {
    o.fillStyle = `rgba(0, 0, 0, ${0.3 + rng() * 0.7})`;
    o.beginPath(); o.arc(rng() * S, rng() * S, 0.6 + rng() * 3.2, 0, Math.PI * 2); o.fill();
  }
  ctx.save();
  ctx.translate(cx, cy); ctx.rotate((-14 * Math.PI) / 180); ctx.scale(scale, scale);
  ctx.globalCompositeOperation = 'multiply';
  ctx.drawImage(off, -c, -c);
  ctx.restore();
}

// ---------------------------------------------------------------- entry point

/**
 * @param {object} info    from generateBandInfo()
 * @param {Array}  tracks  [{ id, slots }] in PUPPETS order
 * @returns {Promise<HTMLCanvasElement>}
 */
export async function renderPoster(info, tracks) {
  if (document.fonts?.ready) await document.fonts.ready;
  const images = await Promise.all(PUPPETS.map(async (p, i) => ({
    name: p.name,
    img: await loadSvgImage(puppetSVGString(p, tracks[i].slots)),
  })));

  const canvas = document.createElement('canvas');
  canvas.width = POSTER_WIDTH;
  canvas.height = POSTER_HEIGHT;
  const ctx = canvas.getContext('2d');
  const rng = mulberry32(hashString(info.bandName + info.songTitle));
  const w = POSTER_WIDTH, h = POSTER_HEIGHT;

  drawPaper(ctx, rng, w, h);
  drawBorder(ctx, w, h);
  drawHeader(ctx, w);
  drawBandName(ctx, info, w);
  drawRule(ctx, 446, 260, w - 260);
  drawStagePicture(ctx, 120, 494, w - 240, 560, images, rng);
  drawCast(ctx, info, w, 1126);
  drawProgram(ctx, info, w, 1408);
  drawStamp(ctx, w - 128, 1042, rng, 0.74);
  return canvas;
}

export const posterToBlob = (canvas) =>
  new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG encoding failed'))), 'image/png'));
