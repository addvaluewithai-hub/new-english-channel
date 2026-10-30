// index.html — hero, today's review, streak, unit progress and the episode cards.
import { h, $, starsHTML, esc, mix } from './ui.js';
import { mountAll } from './bean-widget.js';
import { streak, dueCount, episodeState, deckSize, nextDue, reviewDoneToday } from './store.js';

const beans = mountAll();
setTimeout(() => { beans.forEach(b => b.react(b.who === 'mia' ? 'wave' : 'happy')); }, 900);

async function main() {
  const data = await fetch('data/episodes.json').then(r => r.json());
  const due = dueCount(), s = streak(), size = deckSize();
  $('#streak').textContent = String(s);
  $('#streak-lbl').textContent = s === 1 ? 'يوم ورا بعض' : s >= 3 && s <= 10 ? 'أيام ورا بعض' : 'يوم ورا بعض';
  $('#due').textContent = String(due);
  const rv = $('#review');
  const rvTitle = $('#review-title'), rvSub = $('#review-sub'), rvBtn = $('#review-btn');
  if (due > 0) { rvTitle.innerHTML = `مراجعة النهارده: <bdi>${due}</bdi> ${due === 1 ? 'عبارة' : due <= 10 ? 'عبارات' : 'عبارة'}`; rvSub.textContent = 'دقيقتين بس… عشان الجمل تثبت 💪'; }
  else if (size === 0) { rvTitle.textContent = 'مفيش مراجعة لسه'; rvSub.textContent = 'ابدأ أول حلقة، والجمل هتدخل المراجعة لوحدها.'; rvBtn.classList.add('hidden'); }
  else { const nd = nextDue(); const days = nd ? Math.max(1, Math.ceil((nd - Date.now()) / 864e5)) : 1; const when = days === 1 ? 'بكرة' : `بعد <bdi>${days}</bdi> أيام`; rvTitle.textContent = reviewDoneToday() ? 'خلصت مراجعة النهارده ✓' : 'مفيش مراجعة النهارده ✓'; rvSub.innerHTML = `الجمل اللي اتعلمتها هترجع لك ${when} عشان تثبت. كمّل حلقة جديدة!`; rvBtn.textContent = 'راجع براحتك'; rvBtn.className = 'btn ghost'; rvBtn.href = 'review.html?all=1'; }

  const unit = data.units[0], eps = data.episodes.filter(e => e.unit === unit.id);
  const live = eps.filter(e => e.status === 'live');
  const done = live.filter(e => (episodeState(e.id) || {}).stars);
  const starsTotal = live.reduce((a, e) => a + ((episodeState(e.id) || {}).stars || 0), 0);
  $('#unit-title').textContent = `${unit.level} · الوحدة ${unit.n} — ${unit.title}`;
  $('#unit-meta').innerHTML = `<bdi>${done.length}</bdi> / <bdi>${eps.length}</bdi> حلقات · <bdi>${starsTotal}</bdi> ⭐`;
  requestAnimationFrame(() => { $('#unit-bar i').style.width = (done.length / eps.length * 100) + '%'; });

  const grid = $('#eps');
  for (const e of eps) {
    const st = episodeState(e.id) || {};
    const isLive = e.status === 'live';
    const card = h(isLive ? 'a' : 'div', { class: 'ep' + (isLive ? '' : ' locked'), href: isLive ? `ep.html?id=${e.id}` : null, 'aria-disabled': isLive ? null : 'true' },
      h('div', { class: 'thumb', style: `background:${e.colour}` }, h('small', {}, 'EP'), String(e.n)),
      h('div', {},
        h('div', { class: 't-en' }, e.title),
        h('div', { class: 't-ar' }, e.titleAr),
        isLive ? h('p', { class: 'blurb', html: mix(e.blurb || '') }) : h('p', { class: 'blurb' }, 'الحلقة لسه بتتعمل…'),
        isLive ? h('div', { class: 'cta' }, h('span', { class: 'stars', html: st.stars ? starsHTML(st.stars) : '' }), h('span', {}, st.stars ? `أعد التمارين · أحسن نتيجة ${st.best}/${st.total}` : `ابدأ التمارين · ${e.minutes || 4} دقايق ←`)) : null),
      isLive ? null : h('span', { class: 'soon' }, 'قريبًا'));
    grid.append(card);
  }
}
main().catch(console.error);
