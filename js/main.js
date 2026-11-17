import { PUPPETS } from './parts.js';
import { Stage } from './stage.js';
import { createPuppetElement } from './puppets.js';
import { AudioEngine } from './engine.js';
import { applyPumpkinParts } from './pumpkin-art.js';
import {
  applySkeletonParts, setArmVars, strikePose, gagPose, applyGagPose, clearGagPose, GAG_HITS, GAG_PLACE,
} from './skeleton-art.js';
import { applyCauldronParts, BubbleField } from './cauldron-art.js';
import { isAudible } from './music.js';
import { generateBandInfo, fileStem } from './band.js';
import { renderPoster, posterToBlob } from './poster.js';
import { exportLoopWav } from './wav-export.js';
import { downloadBlob } from './download.js';

const $ = (id) => document.getElementById(id);

// ---- State (read from Task 2 onward; the tracks array is the source of truth) ----
const tracks = PUPPETS.map((p) => ({ id: p.id, slots: [0, 0, 0], mute: false, solo: false }));
let selected = 0;

const stage = new Stage($('proscenium'));
const engine = new AudioEngine(tracks);
export { stage, tracks, engine };

// ---- Stage: build the candle footlights and the puppets ----
const footlights = $('footlights');
for (let i = 0; i < 9; i++) {
  const c = document.createElement('div');
  c.className = 'candle';
  c.style.setProperty('--d', `${(i * 0.37) % 1.6}s`);
  c.innerHTML = '<i class="flame"></i><i class="wick"></i><i class="wax"></i>';
  footlights.appendChild(c);
}

const puppetEls = new Map();
PUPPETS.forEach((p) => {
  const el = createPuppetElement(p);
  el.addEventListener('click', () => {
    selectPuppet(PUPPETS.indexOf(p));
    poke(p.id); // Req 2.3: poking a puppet plays one note, playing or stopped
  });
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); }
  });
  $('puppets').appendChild(el);
  puppetEls.set(p.id, el);
});
applyPumpkinParts(puppetEls.get('pumpkin'), tracks[0].slots);
applySkeletonParts(puppetEls.get('skeleton'), tracks[1].slots);
applyCauldronParts(puppetEls.get('cauldron'), tracks[2].slots);

// ---- Poking and previews (Req 2.2, 2.3, 2.4) ----
// A muted puppet snaps awake for the length of its one note, then dozes off again.
const WAKE_MS = 750; // the note's energy (tau 0.18 s) has decayed below 2% by then
const wakeUntil = {};

function poke(trackId, slot = null) {
  if (!engine.hasOneShot(trackId)) return;
  wakeUntil[trackId] = performance.now() + WAKE_MS;
  syncSleep();
  engine.playOneShot(trackId, { slot }).catch((err) => console.error('One-shot failed:', err));
}

// ---- Skull tumble gag (Req 1.4): the skeleton loses its head during the curtain call ----
// Only when the skeleton is active (audible). Its motion is a pure function of the time since the
// call began (gagPose), so it matches the 1.8 s curtain call and the sound scheduled by the engine.
const skeletonEl = puppetEls.get('skeleton');
const skeletonTrack = tracks[1];
let gag = null;

function startGag() {
  if (!isAudible(skeletonTrack, tracks)) return;
  gag = { start: performance.now() + 20 };               // +20 ms: the sound is scheduled 20 ms ahead
  skeletonEl.classList.add('is-gag');
  engine.playSkullGag(GAG_HITS, GAG_PLACE);
}

function endGag() {
  if (!gag) return;
  gag = null;
  skeletonEl.classList.remove('is-gag');
  clearGagPose(skeletonEl);
}

const bubbles = new BubbleField(puppetEls.get('cauldron').querySelector('.cd-bubbles'));

// ---- Play / Stop ----
const playBtn = $('playBtn');
const stopBtn = $('stopBtn');

playBtn.addEventListener('click', () => stage.open());
stopBtn.addEventListener('click', () => stage.close());

stage.addEventListener('stagechange', (e) => {
  const { state } = e.detail;
  playBtn.disabled = state === 'open';
  stopBtn.disabled = state !== 'open';
  $('curtainHint').textContent = state === 'closed' ? 'The show will begin shortly' : '';

  // The audio engine follows the stage. Entering `open` (also from the middle of a curtain call)
  // resets and restarts the loop; entering `curtain_call` stops everything immediately.
  if (state === 'open') engine.start().catch((err) => console.error('Audio start failed:', err));
  else if (state === 'curtain_call') engine.stop();

  // The gag exists only inside a curtain call. Play during the call (or the end of it) cancels it.
  if (state === 'curtain_call') startGag();
  else endGag();
});

// ---- Motion: drive each puppet's --energy from the audio output clock ----
function frame() {
  const { energy, detail } = engine.update();
  puppetEls.forEach((el, id) => el.style.setProperty('--energy', energy[id].toFixed(3)));
  syncSleep(); // lets a poked puppet fall back asleep once its wake time is over
  updateSkeleton(detail.skeleton);
  updateCauldron(detail.cauldron);
  requestAnimationFrame(frame);
}

/** Skeleton: kick nods the head, snare jolts the hat, each rib note swings one arm onto its rib row. */
function updateSkeleton(sk) {
  const el = skeletonEl;
  if (gag && el.classList.contains('is-asleep')) endGag(); // muted in the middle of the call: no gag
  if (gag) {
    applyGagPose(el, gagPose((performance.now() - gag.start) / 1000));
    return;
  }
  el.style.setProperty('--sk-kick', sk.kick.toFixed(3));
  el.style.setProperty('--sk-snare', sk.snare.toFixed(3));
  ['l', 'r'].forEach((side, i) => setArmVars(el, side, strikePose(sk.arms[i].row, sk.arms[i].energy)));
  for (let row = 0; row < 4; row++) {
    const flash = Math.max(...sk.arms.map((a) => (a.row === row ? a.energy : 0)));
    el.querySelector(`.sk-flash-${row}`).style.opacity = (flash * 0.9).toFixed(3);
  }
}

/** Cauldron: every bass note sends poison bubbles up from the bottom of the brew (they pop at the surface). */
function updateCauldron(cd) {
  const now = performance.now() / 1000;
  cd.hits.forEach((hit) => bubbles.spawn(hit.freq, now));
  bubbles.update(now);
}
requestAnimationFrame(frame);

// ---- Puppet tabs + 3-slot UI ----
const tabs = $('puppetTabs');
const panel = $('slotPanel');

function renderTabs() {
  tabs.innerHTML = '';
  PUPPETS.forEach((p, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.role = 'tab';
    b.className = 'tab';
    b.setAttribute('aria-selected', String(i === selected));
    b.innerHTML = `<span class="tab__icon">${p.icon}</span><span class="tab__name">${p.name}</span>`;
    b.addEventListener('click', () => selectPuppet(i));
    tabs.appendChild(b);
  });
}

function renderPanel() {
  const p = PUPPETS[selected];
  const t = tracks[selected];
  panel.style.setProperty('--puppet', p.color);
  panel.innerHTML = `
    <div class="panel__head">
      <div>
        <h2 class="panel__title">${p.icon} ${p.name}</h2>
        <p class="panel__role">${p.role}</p>
      </div>
      <div class="panel__toggles">
        <button type="button" class="toggle" data-act="mute" aria-pressed="${t.mute}">Mute</button>
        <button type="button" class="toggle" data-act="solo" aria-pressed="${t.solo}">Solo</button>
      </div>
    </div>
    <div class="slots">
      ${p.slots.map((s, si) => `
        <fieldset class="slot">
          <legend>Slot ${'ABC'[si]} <b>${s.label}</b> <small>${s.hint}</small></legend>
          <div class="slot__opts">
            ${s.options.map((o, oi) => `
              <button type="button" class="opt" data-slot="${si}" data-opt="${oi}" aria-pressed="${t.slots[si] === oi}">
                <span class="opt__name">${o.name}</span><span class="opt__note">${o.note}</span>
              </button>`).join('')}
          </div>
        </fieldset>`).join('')}
    </div>`;
}

panel.addEventListener('click', (e) => {
  const t = tracks[selected];
  const opt = e.target.closest('.opt');
  if (opt) {
    t.slots[+opt.dataset.slot] = +opt.dataset.opt;
    renderPanel();
    if (t.id === 'pumpkin') applyPumpkinParts(puppetEls.get('pumpkin'), t.slots); // new look, instantly
    if (t.id === 'skeleton') applySkeletonParts(puppetEls.get('skeleton'), t.slots);
    if (t.id === 'cauldron') applyCauldronParts(puppetEls.get('cauldron'), t.slots);
    poke(t.id, +opt.dataset.slot); // Req 2.2: preview one note with the new timbre
    updatePlaybill();
    return;
  }
  const tg = e.target.closest('.toggle');
  if (tg) {
    t[tg.dataset.act] = !t[tg.dataset.act];
    renderPanel();
    syncSleep();
  }
});

// Puppets silenced by Mute or by another track's Solo show the dozing pose (Req 3.2),
// except while a poke has them awake (Req 2.4).
function syncSleep() {
  const now = performance.now();
  tracks.forEach((t) => {
    const silent = !isAudible(t, tracks);
    const awakeByPoke = now < (wakeUntil[t.id] ?? 0);
    puppetEls.get(t.id).classList.toggle('is-asleep', silent && !awakeByPoke);
  });
}

function selectPuppet(i) {
  selected = i;
  puppetEls.forEach((el, id) => el.classList.toggle('is-selected', id === PUPPETS[i].id));
  renderTabs();
  renderPanel();
}

// ---- Band name, song title, poster and loop export (Req 4.1, 4.2, 4.3) ----
function updatePlaybill() {
  const info = generateBandInfo(tracks);
  $('bandName').textContent = info.bandName;
  $('bandTagline').textContent = info.tagline;
  $('songTitle').textContent = info.songTitle;
  $('songGenre').textContent = `${info.genre} \u00B7 ${info.bpm} BPM`;
}

async function runExport(button, what, work) {
  const status = $('exportStatus');
  button.disabled = true;
  status.textContent = `Preparing the ${what}...`;
  try {
    await work();
    status.textContent = `The ${what} is ready. Check your downloads.`;
  } catch (err) {
    console.error(err);
    status.textContent = `Could not create the ${what}: ${err.message}`;
  } finally {
    button.disabled = false;
  }
}

$('posterBtn').addEventListener('click', () => runExport($('posterBtn'), 'poster', async () => {
  const info = generateBandInfo(tracks);
  const canvas = await renderPoster(info, tracks);
  downloadBlob(await posterToBlob(canvas), `${fileStem(info)}-poster.png`);
}));

$('wavBtn').addEventListener('click', () => runExport($('wavBtn'), 'loop recording', async () => {
  const info = generateBandInfo(tracks);
  downloadBlob(await exportLoopWav(tracks), `${fileStem(info)}-loop.wav`);
}));

selectPuppet(0);
updatePlaybill();
syncSleep();
