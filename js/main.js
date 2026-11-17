import { PUPPETS } from './parts.js';
import { Stage } from './stage.js';
import { createPuppetElement } from './puppets.js';

const $ = (id) => document.getElementById(id);

// ---- 状態（Task 2 以降が参照する。正本は tracks 配列）------------------------
const tracks = PUPPETS.map((p) => ({ id: p.id, slots: [0, 0, 0], mute: false, solo: false }));
let selected = 0;

const stage = new Stage($('proscenium'));
export { stage, tracks };

// ---- ステージ: フットライト（ロウソク）とパペットを生成 -----------------------
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
  el.addEventListener('click', () => selectPuppet(PUPPETS.indexOf(p)));
  $('puppets').appendChild(el);
  puppetEls.set(p.id, el);
});

// ---- 開演・閉演 --------------------------------------------------------------
const playBtn = $('playBtn');
const stopBtn = $('stopBtn');

playBtn.addEventListener('click', () => stage.open());
stopBtn.addEventListener('click', () => stage.close());

stage.addEventListener('stagechange', (e) => {
  const { state } = e.detail;
  playBtn.disabled = state === 'open';
  stopBtn.disabled = state !== 'open';
  $('curtainHint').textContent = state === 'closed' ? '開演をお待ちください' : '';
});

// ---- パペット選択タブ + 3スロットUI -----------------------------------------
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
    // 変更後の音色プレビュー（Req 2.2）は Task 2 / 3 で接続する。
    return;
  }
  const tg = e.target.closest('.toggle');
  if (tg) {
    t[tg.dataset.act] = !t[tg.dataset.act];
    renderPanel();
    syncSleep();
  }
});

// Mute / 他トラックの Solo で消音中のパペットは居眠り姿にする（Req 3.2 の見た目のみ）。
function syncSleep() {
  const anySolo = tracks.some((t) => t.solo);
  tracks.forEach((t) => {
    const silent = t.mute || (anySolo && !t.solo);
    puppetEls.get(t.id).classList.toggle('is-asleep', silent);
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
