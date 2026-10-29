// review.html — a quick (~2 min) review session built from the phrases that are due today, mixing types 1–4 across episodes.
import { h, $, qs, confetti, shuffle, starsFor, starsHTML } from './ui.js';
import { buildShell, runItems } from './session.js';
import { phraseMap } from './exercises.js';
import { mountBean } from './bean-widget.js';
import { dueKeys, deck, markReviewDone, touchDay } from './store.js';

const app = $('#app');
const MAX = 10;

async function loadAll() {
  const list = await fetch('data/episodes.json').then(r => r.json());
  const eps = await Promise.all(list.episodes.filter(e => e.status === 'live').map(e => fetch(`data/${e.id}.json`).then(r => r.json())));
  const phrases = new Map(), mistakes = [];
  for (const ep of eps) { for (const [, p] of phraseMap(ep)) phrases.set(p.key, p); for (const m of ep.mistakes || []) mistakes.push({ ...m, ep: ep.id, key: `${ep.id}:${m.phrase}` }); }
  return { eps, phrases, mistakes };
}

// build one exercise for a phrase, choosing among the types that fit it; `prefer` rotates the mix
function makeItem(p, prefer, { phrases, mistakes }, n) {
  const others = [...phrases.values()].filter(q => q.key !== p.key);
  const sameEp = others.filter(q => q.ep === p.ep);
  const pool = sameEp.length >= 2 ? sameEp : others;
  const words = p.en.split(' ');
  const types = [];
  const fx = mistakes.filter(m => m.key === p.key);
  if (fx.length) types.push('fix');
  if (p.audio) types.push('listen');
  if (words.length >= 3) types.push('order');
  if (words.length >= 2) types.push('gap');
  if (!types.length) types.push('listen');
  const type = types.includes(prefer) ? prefer : types[Math.floor(Math.random() * types.length)];
  if (type === 'fix') { const m = fx[Math.floor(Math.random() * fx.length)]; return { ...m, type: 'fix', phrase: p, n }; }
  if (type === 'listen') {
    const mode = Math.random() < .5 ? 'ar' : 'en';
    const d = shuffle(pool).slice(0, 2).map(q => mode === 'ar' ? q.ar : q.en);
    return { type: 'listen', phrase: p, mode, options: [mode === 'ar' ? p.ar : p.en, ...d], answer: mode === 'ar' ? p.ar : p.en, n };
  }
  if (type === 'order') return { type: 'order', phrase: p, words, ar: p.ar, n };
  // gap: drop one word (prefer a word that is not the first), distractors = words from other phrases
  const cand = words.map((w, i) => i).filter(i => words[i].replace(/[^A-Za-z']/g, '').length >= 2);
  const gi = cand.length ? cand[Math.floor(Math.random() * cand.length)] : 0;
  const answer = words[gi], text = words.map((w, i) => i === gi ? '___' : w).join(' ');
  const bank = shuffle([...new Set(others.flatMap(q => q.en.split(' ')).filter(w => w.toLowerCase() !== answer.toLowerCase() && w.length > 1))]).slice(0, 2);
  return { type: 'gap', phrase: p, text, chips: [answer, ...bank], answer, n };
}

async function main() {
  const data = await loadAll();
  const all = qs().all === '1';
  let keys = all ? Object.keys(deck()) : dueKeys();
  keys = keys.filter(k => data.phrases.has(k));
  const ctx = buildShell(app, { back: './' });
  $('.bar .back', app).textContent = '→ الرئيسية';
  if (!keys.length) {
    ctx.stageEl.remove(); ctx.card.classList.add('end');
    const hasDeck = Object.keys(deck()).some(k => data.phrases.has(k));
    ctx.card.append(h('h2', {}, hasDeck ? 'مفيش مراجعة النهارده ✓' : 'لسه مفيش جمل في المراجعة'),
      h('p', { class: 'hint', style: 'margin:10px 0 18px' }, hasDeck ? 'الجمل كلها لسه بدري عليها. كمّل حلقة جديدة، أو راجع كل حاجة براحتك.' : 'اعمل تمارين أول حلقة، والجمل هتدخل هنا لوحدها.'),
      h('div', { class: 'actions' }, h('a', { class: 'btn', href: './' }, 'الرئيسية'), hasDeck ? h('a', { class: 'btn ghost', href: 'review.html?all=1' }, 'راجع كل الجمل') : null));
    return;
  }
  const rota = ['listen', 'gap', 'order', 'fix'];
  const items = shuffle(keys).slice(0, MAX).map((k, i) => makeItem(data.phrases.get(k), rota[i % rota.length], data, i + 1));
  const results = await runItems(ctx, items, {});
  end(ctx, items, results);
}

function end(ctx, items, results) {
  const score = results.filter(Boolean).length, total = results.length;
  markReviewDone(); touchDay();
  ctx.stageEl.remove(); ctx.hideFeedback(); ctx.meta.textContent = '';
  const cM = h('canvas', { class: 'bean', width: 300, height: 360, 'aria-hidden': 'true' });
  ctx.card.className = 'card end'; ctx.card.innerHTML = '';
  ctx.card.append(cM,
    h('h2', { style: 'font-size:28px' }, score === total ? 'كله صح! 🏆' : 'خلصت المراجعة! 🎉'),
    h('div', { class: 'stars', html: starsHTML(starsFor(score, total)) }),
    h('p', { class: 'score' }, `جبت ${score} من ${total}`),
    h('p', { class: 'hint' }, score === total ? 'الجمل دي هتتأجل لفترة أطول… كده بتثبت 🔥' : 'اللي غلطت فيه هيرجع لك بكرة تاني، عادي… كده بنحفظ.'),
    h('div', { class: 'actions' }, h('a', { class: 'btn', href: './' }, 'الرئيسية'), h('a', { class: 'btn ghost', href: 'review.html?all=1' }, 'راجع تاني')));
  const mia = mountBean(cM, { who: 'mia', expr: 'joy' });
  setTimeout(() => { mia.react('clap'); confetti(2400); }, 300);
  window.scrollTo({ top: 0 });
}
main().catch(e => { console.error(e); app.innerHTML = '<main class="wrap"><div class="card" style="margin-top:20px;text-align:center"><p class="prompt">حصلت مشكلة… جرّب تاني.</p><a class="btn" href="./">الرئيسية</a></div></main>'; });
