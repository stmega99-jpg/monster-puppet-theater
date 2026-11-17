import { PUPPETS } from './parts.js';
import { Stage } from './stage.js';
import { createPuppetElement } from './puppets.js';
import { AudioEngine } from './engine.js';
import { applyPumpkinParts } from './pumpkin-art.js';
import { isAudible } from './music.js';

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

// ---- Poking and previews (Req 2.2, 2.3, 2.4) ----
// A muted puppet snaps awake for the length of its one note, then dozes off again.
const WAKE_MS = 750; // the note's energy (tau 0.18 s) has decayed below 2% by then
const wakeUntil = {};

function poke(trackId) {
  if (!engine.hasOneShot(trackId)) return;
  wakeUntil[trackId] = performance.now() + WAKE_MS;
  syncSleep();
  engine.playOneShot(trackId).catch((err) => console.error('One-shot failed:', err));
}

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
});

// ---- Motion: drive each puppet's --energy from the audio output clock ----
function frame() {
  const { energy } = engine.update();
  puppetEls.forEach((el, id) => el.style.setProperty('--energy', energy[id].toFixed(3)));
  syncSleep(); // lets a poked puppet fall back asleep once its wake time is over
  requestAnimationFrame(frame);
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
    poke(t.id); // Req 2.2: preview one note with the new timbre
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

selectPuppet(0);
syncSleep();
