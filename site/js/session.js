// A session = a list of normalised items run one at a time with progress dots, a bean stage and the feedback bar.
// Used by the episode page and the review page.
import { h, $, preload, play } from './ui.js';
import { mountBean } from './bean-widget.js';
import { runItem } from './exercises.js';
import { touchDay, recordAnswer } from './store.js';

export function buildShell(app, { back = './', title = '', meta = '' } = {}) {
  app.innerHTML = '';
  const dots = h('div', { class: 'dots', 'aria-hidden': 'true' });
  const metaEl = h('span', { class: 'meta' }, meta);
  const bar = h('header', { class: 'bar' }, h('div', { class: 'wrap' },
    h('a', { class: 'back', href: back, 'aria-label': 'الرئيسية' }, '→ الرئيسية'), dots, metaEl));
  const cY = h('canvas', { class: 'bean', width: 236, height: 284, 'aria-hidden': 'true' });
  const cM = h('canvas', { class: 'bean hidden', width: 236, height: 284, 'aria-hidden': 'true' });
  const bubble = h('div', { class: 'bubble', 'aria-live': 'polite' }, h('span', { class: 'tab' }, 'YOUSSEF'), h('span', { class: 'txt' }, '…'));
  const stage = h('section', { class: 'stage' }, cY, cM, bubble);
  const card = h('section', { class: 'card', id: 'card', 'aria-live': 'polite' });
  const main = h('main', { class: 'wrap ex-wrap' }, stage, card);
  const fbHead = h('div', { class: 'head' }), fbWhy = h('div', { class: 'why' });
  const fbBtn = h('button', { class: 'btn mustard wide big', type: 'button' }, 'كمّل ←');
  const fb = h('div', { class: 'feedback', role: 'status' }, h('div', { class: 'inner' }, fbHead, fbWhy, fbBtn));
  const live = h('div', { class: 'sr', 'aria-live': 'assertive' });
  app.append(bar, main, fb, live);
  const beans = { youssef: mountBean(cY, { who: 'youssef', expr: 'neutral' }), mia: mountBean(cM, { who: 'mia', expr: 'happy' }) };
  let who = 'youssef', fbTimer = 0;
  const ctx = {
    beans, dots, meta: metaEl, card, main, stageEl: stage,
    stage(w, { bubble: html, expr } = {}) {
      who = w; cY.classList.toggle('hidden', w !== 'youssef'); cM.classList.toggle('hidden', w !== 'mia');
      bubble.querySelector('.tab').textContent = w === 'mia' ? 'SARA' : 'YOUSSEF'; bubble.querySelector('.tab').classList.toggle('mia', w === 'mia');
      if (html != null) bubble.querySelector('.txt').innerHTML = html;
      if (expr) beans[w].set(expr);
    },
    bubble(html) { bubble.querySelector('.txt').innerHTML = html; },
    react(name) { beans[who].react(name); },
    talk(sec) { beans[who].talk(sec); },
    feedback(kind, { head = '', why = '', cont = kind === 'ok' } = {}) {
      clearTimeout(fbTimer);
      fb.className = 'feedback show ' + kind; fbHead.textContent = head; fbWhy.innerHTML = why; fbBtn.classList.toggle('hidden', !cont);
      live.textContent = head + ' ' + fbWhy.textContent;
      if (!cont) { fbTimer = setTimeout(() => fb.classList.remove('show'), 1700); return Promise.resolve(); }
      return new Promise(res => { fbBtn.onclick = () => { fb.classList.remove('show'); res(); }; fbBtn.focus({ preventScroll: true }); });
    },
    hideFeedback() { fb.classList.remove('show'); },
  };
  return ctx;
}

export function setDots(dots, n, results, cur) {
  dots.innerHTML = '';
  for (let i = 0; i < n; i++) dots.append(h('i', { class: results[i] == null ? (i === cur ? 'cur' : '') : results[i] ? 'done' : 'miss' }));
}

// run items; results[i] = true/false; calls onProgress(i, results) after each answer; returns results
export async function runItems(ctx, items, { results = [], start = 0, onProgress, record = true } = {}) {
  preload(items.flatMap(it => [it.phrase && it.phrase.audio, it.asks && it.asks.audio]).filter(Boolean));
  for (let i = start; i < items.length; i++) {
    const it = items[i];
    setDots(ctx.dots, items.length, results, i);
    ctx.meta.textContent = `${i + 1} / ${items.length}`;
    ctx.card.innerHTML = ''; ctx.hideFeedback();
    window.scrollTo({ top: 0, behavior: 'instant' });
    const r = await runItem(ctx.card, it, ctx);
    results[i] = !!r.correct;
    touchDay();
    if (record && it.phrase) recordAnswer(it.phrase.key, results[i]);
    if (onProgress) onProgress(i, results);
  }
  setDots(ctx.dots, items.length, results, -1);
  return results;
}
