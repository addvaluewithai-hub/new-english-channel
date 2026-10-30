// ep.html?id=ep01 — one episode's exercises, then the end screen.
import { h, $, qs, confetti, share, starsHTML, starsFor, esc, play, toast } from './ui.js';
import { buildShell, runItems } from './session.js';
import { normalise } from './exercises.js';
import { mountBean } from './bean-widget.js';
import { setEpisodeResult, getResume, setResume, episodeState, dueCount } from './store.js';

const app = $('#app');
const id = (qs().id || 'ep01').replace(/[^a-z0-9]/gi, '');

async function main() {
  const [list, ep] = await Promise.all([fetch('data/episodes.json').then(r => r.json()), fetch(`data/${id}.json`).then(r => { if (!r.ok) throw new Error('no episode'); return r.json(); })]);
  const meta = list.episodes.find(e => e.id === id) || {};
  document.title = `${ep.titleAr} · تمارين الحلقة ${ep.n} · يوسف في نيويورك`;
  const items = ep.items.map((it, i) => normalise(ep, it, i + 1));
  const ctx = buildShell(app, { back: './', meta: '' });
  $('.bar .back', app).textContent = `→ الحلقة ${ep.n}`;

  // resume after a reload
  let results = [], start = 0;
  const res = getResume(id);
  if (res && res.results && res.results.length < items.length && res.v === ep.items.length) {
    results = res.results.slice(); start = results.length;
    if (start > 0) toast(`كمّلنا من مكانك: تمرين ${start + 1}`);
  }
  await runItems(ctx, items, { results, start, onProgress: (i, r) => setResume(id, { results: r.slice(0, i + 1), v: ep.items.length }) });
  end(ctx, ep, meta, items, results);
}

function end(ctx, ep, meta, items, results) {
  const score = results.filter(Boolean).length, total = results.length, stars = starsFor(score, total);
  setEpisodeResult(ep.id, { score, total, stars }); setResume(ep.id, null);
  ctx.stageEl.remove(); ctx.hideFeedback(); ctx.meta.textContent = '';
  const cM = h('canvas', { class: 'bean', width: 300, height: 360, 'aria-hidden': 'true' });
  const learned = h('ul', { class: 'learned', style: 'list-style:none;padding:0' }, ...ep.phrases.map(p => h('li', {},
    h('span', { class: 'en', dir: 'ltr' }, p.en), h('span', { class: 'ar' }, p.ar),
    p.audio ? h('button', { class: 'play small', type: 'button', 'aria-label': `اسمع ${p.en}`, html: '<svg viewBox="0 0 24 24"><path d="M8 5.5v13c0 .8.9 1.3 1.6.9l10-6.5c.6-.4.6-1.4 0-1.8l-10-6.5C8.9 4.2 8 4.7 8 5.5z"/></svg>', onclick: () => play(p.audio) }) : h('span'))));
  const url = location.href.split('#')[0];
  const shareBtn = h('button', { class: 'btn ghost', type: 'button' }, '📣 شارك نتيجتك');
  shareBtn.addEventListener('click', () => share({ title: 'يوسف في نيويورك', text: `خلصت تمارين الحلقة ${ep.n} «${ep.titleAr}» وجبت ${score} من ${total} ${'⭐'.repeat(stars)} — تعالى اتعلم إنجليزي مع يوسف في نيويورك!`, url }));
  const headline = stars === 3 ? 'عاش يا بطل! 🏆' : stars === 2 ? 'برافو عليك! 🎉' : 'كويس… والمرة الجاية أحسن 💪';
  const due = dueCount();
  ctx.card.className = 'card end';
  ctx.card.innerHTML = '';
  ctx.card.append(
    cM,
    h('h2', { style: 'font-size:28px' }, headline),
    h('div', { class: 'stars', html: starsHTML(stars), 'aria-label': `${stars} من 3 نجوم` }),
    h('p', { class: 'score' }, `جبت ${score} من ${total}`),
    h('p', { class: 'hint' }, 'الجمل دي دخلت المراجعة بتاعتك… هنفكّرك بيها بكرة 🔥'),
    h('h3', { style: 'margin-top:18px;font-size:20px' }, `اتعلمت في الحلقة ${ep.n}:`),
    learned,
    h('div', { class: 'actions' },
      meta.youtube ? h('a', { class: 'btn', href: meta.youtube, target: '_blank', rel: 'noopener' }, '▶ شوف الحلقة تاني') : null,
      h('a', { class: 'btn teal', href: './' }, due ? `المراجعة (${due})` : 'الرئيسية'),
      h('a', { class: 'btn ghost', href: `ep.html?id=${ep.id}` }, '🔁 أعد التمارين'),
      shareBtn));
  const sara = mountBean(cM, { who: 'mia', expr: 'joy' });
  setTimeout(() => { sara.react('clap'); confetti(2600); }, 300);
  setTimeout(() => sara.react('clap'), 2400);
  window.scrollTo({ top: 0 });
}

main().catch(e => { app.innerHTML = ''; app.append(h('main', { class: 'wrap' }, h('div', { class: 'card', style: 'margin-top:20px;text-align:center' }, h('p', { class: 'prompt' }, 'الحلقة دي لسه مش جاهزة… قريبًا!'), h('a', { class: 'btn', href: './' }, 'الرئيسية')))); console.error(e); });
