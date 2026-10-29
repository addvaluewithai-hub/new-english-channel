// The five exercise types. Each takes (root, item, ctx) and resolves { correct } where `correct` = right on the first try.
// ctx: { stage(who, {bubble, expr}), bubble(html), react(name), talk(sec), feedback(kind, {head, why, cont}) → Promise }
import { h, esc, shuffle, play, playButton, sleep, REDUCED } from './ui.js';

const T = {
  listen: 'اسمع واختار', fix: 'صلّح غلطة يوسف', order: 'رتّب الكلمات', gap: 'كمّل الجملة', speak: 'قولها بصوت عالي',
  ok: ['تمام! 👏', 'برافو! 🎉', 'صح! ⭐', 'عاش! 💪', 'كده يا بطل! 🙌'], bad: ['لأ… جرّب تاني', 'مش دي… فكّر تاني', 'قرّبت! تاني'],
};
export const KIND = T;
const pick = a => a[Math.floor(Math.random() * a.length)];
const enHTML = s => `<span class="en" dir="ltr">${esc(s)}</span>`;
export const normWords = s => s.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z' ]+/g, ' ').trim().split(/\s+/).filter(Boolean);

function kind(name, n) { return h('div', { class: 'kind' }, h('span', { class: 'n' }, n), T[name]); }

// ---------- 1. listen + choose ----------
async function listen(root, item, ctx) {
  const ph = item.phrase, isAr = item.mode === 'ar';
  ctx.stage(ph.who, { bubble: '<span class="hi">…</span>', expr: 'talk' });
  const opts = shuffle(item.options);
  let tries = 0, done = false;
  const playBtn = playButton(ph.audio, 'اسمع', { onplay: d => ctx.talk(d) });
  const chips = h('div', { class: 'chips col', role: 'group', 'aria-label': 'الاختيارات' });
  root.append(kind('listen', item.n),
    h('p', { class: 'prompt' }, isAr ? 'اسمع الجملة… يعني إيه؟' : 'اسمع كويس… قال إيه بالظبط؟'),
    h('div', { style: 'text-align:center;margin:8px 0 4px' }, playBtn), chips);
  const result = new Promise(res => {
    for (const o of opts) {
      const b = h('button', { class: 'chip' + (isAr ? '' : ' en'), type: 'button' }, o);
      b.addEventListener('click', async () => {
        if (done) return;
        tries++;
        if (o === item.answer) {
          done = true; b.classList.add('correct'); chips.querySelectorAll('.chip').forEach(c => c.disabled = true);
          ctx.bubble(esc(ph.en)); ctx.react(ph.who === 'mia' ? 'clap' : 'happy');
          await ctx.feedback('ok', { head: pick(T.ok), why: `${enHTML(ph.en)} = ${esc(ph.ar)}` + (item.explain ? `<br>${esc(item.explain)}` : '') });
          res({ correct: tries === 1 });
        } else {
          b.classList.add('wrong'); b.disabled = true; ctx.react('oops');
          ctx.feedback('bad', { head: pick(T.bad), why: 'اسمعها تاني' });
          if (tries >= 2) { // reveal
            chips.querySelectorAll('.chip').forEach(c => { if (c.textContent === item.answer) c.classList.add('correct'); });
          }
        }
      });
      chips.append(b);
    }
  });
  // try an automatic first play (may be blocked before a gesture; the button is always there)
  sleep(350).then(() => { if (!done) play(ph.audio, { onstart: d => ctx.talk(d) }); });
  return result;
}

// ---------- 2. fix Youssef's mistake ----------
function sentenceHTML(text, span, cls) {
  if (!span || !text.includes(span)) return `<span class="${cls}">${esc(text)}</span>`;
  const i = text.indexOf(span);
  return esc(text.slice(0, i)) + `<span class="${cls}">${esc(span)}</span>` + esc(text.slice(i + span.length));
}
async function fix(root, item, ctx) {
  const ph = item.phrase;
  ctx.stage('youssef', { bubble: sentenceHTML(item.wrong, item.span, 'bad'), expr: 'nervous' });
  setTimeout(() => ctx.react('embarrassed'), 300);
  const sent = h('div', { class: 'sentence', html: sentenceHTML(item.wrong, item.span, 'bad') });
  const chips = h('div', { class: 'chips', role: 'group', 'aria-label': 'التصليحات' });
  root.append(kind('fix', item.n), item.context ? h('div', { class: 'context' }, item.context) : null,
    h('p', { class: 'prompt' }, 'يوسف غلط… الكلمة الصح إيه؟'), sent, chips);
  let tries = 0, done = false;
  return new Promise(res => {
    for (const c of shuffle(item.chips)) {
      const b = h('button', { class: 'chip en', type: 'button' }, c);
      b.addEventListener('click', async () => {
        if (done) return; tries++;
        if (c === item.answer) {
          done = true; b.classList.add('correct'); chips.querySelectorAll('.chip').forEach(x => x.disabled = true);
          const fixed = item.span && item.wrong.includes(item.span) ? item.wrong.replace(item.span, item.answer) : item.answer;
          const html = sentenceHTML(fixed, item.answer, 'fixed');
          sent.innerHTML = html + ' <span style="color:var(--leaf)">✓</span>'; ctx.bubble(sentenceHTML(fixed, item.answer, 'hi'));
          ctx.react('happy'); if (ph.audio) play(ph.audio, { onstart: d => ctx.talk(d) });
          await ctx.feedback('ok', { head: pick(T.ok), why: `${enHTML(fixed)} = ${esc(ph.ar)}<br>${esc(item.explain || '')}` });
          res({ correct: tries === 1 });
        } else {
          b.classList.add('wrong'); b.disabled = true; ctx.react('oops');
          ctx.feedback('bad', { head: pick(T.bad), why: item.span ? `الغلط في «${esc(item.span)}»` : '' });
        }
      });
      chips.append(b);
    }
  });
}

// ---------- 3. order the words ----------
async function order(root, item, ctx) {
  const ph = item.phrase, words = item.words, target = words.join(' ');
  ctx.stage(ph.who, { bubble: '<span class="hi">…</span>', expr: 'neutral' });
  const slots = h('div', { class: 'slots', role: 'list', 'aria-label': 'الجملة' });
  const tiles = h('div', { class: 'tiles', role: 'group', 'aria-label': 'الكلمات' });
  const check = h('button', { class: 'btn mustard wide', type: 'button', disabled: true }, 'تأكيد ✓');
  const reset = h('button', { class: 'btn ghost', type: 'button', style: 'min-height:44px;padding:6px 16px;font-size:16px' }, 'امسح');
  root.append(kind('order', item.n), h('p', { class: 'prompt' }, 'قول بالإنجليزي:'), h('p', { class: 'sentence', style: 'font-family:var(--ar);direction:rtl;font-size:24px' }, `«${ph.ar}»`),
    slots, tiles, h('div', { style: 'display:flex;gap:10px;margin-top:14px;align-items:center' }, check, reset));
  const all = shuffle([...words, ...(item.extra || [])]);
  const placed = [];
  const refresh = () => { ctx.bubble(placed.length ? esc(placed.map(p => p.w).join(' ')) : '<span class="hi">…</span>'); check.disabled = placed.length !== words.length; };
  for (const w of all) {
    const t = h('button', { class: 'tile', type: 'button' }, w);
    t.addEventListener('click', () => {
      if (t.classList.contains('ghost')) return;
      t.classList.add('ghost'); t.setAttribute('aria-hidden', 'true'); t.tabIndex = -1;
      const s = h('button', { class: 'tile in-slot', type: 'button', role: 'listitem', 'aria-label': `شيل ${w}` }, w);
      const rec = { w, s, t };
      s.addEventListener('click', () => { s.remove(); t.classList.remove('ghost'); t.removeAttribute('aria-hidden'); t.tabIndex = 0; placed.splice(placed.indexOf(rec), 1); slots.classList.remove('wrong'); refresh(); });
      slots.append(s); placed.push(rec); slots.classList.remove('wrong'); refresh();
    });
    tiles.append(t);
  }
  reset.addEventListener('click', () => { for (const p of placed.slice()) p.s.click(); });
  let tries = 0;
  return new Promise(res => {
    check.addEventListener('click', async () => {
      tries++;
      const got = placed.map(p => p.w).join(' ');
      if (got === target) {
        slots.classList.add('correct'); check.disabled = true; reset.disabled = true; slots.querySelectorAll('button').forEach(b => b.disabled = true); tiles.querySelectorAll('button').forEach(b => b.disabled = true);
        ctx.react(ph.who === 'mia' ? 'clap' : 'happy'); if (ph.audio) play(ph.audio, { onstart: d => ctx.talk(d) });
        await ctx.feedback('ok', { head: pick(T.ok), why: `${enHTML(target)} = ${esc(item.ar || ph.ar)}` });
        res({ correct: tries === 1 });
      } else {
        slots.classList.add('wrong'); ctx.react('oops');
        ctx.feedback('bad', { head: pick(T.bad), why: tries >= 2 ? `الجملة: ${enHTML(target)}` : 'الترتيب مش مظبوط' });
      }
    });
  });
}

// ---------- 4. fill the gap ----------
async function gap(root, item, ctx) {
  const ph = item.phrase, [pre, post] = item.text.split('___');
  const gapHTML = v => `${esc(pre)}<span class="gap${v ? ' filled' : ''}">${v ? esc(v) : '&nbsp;'}</span>${esc(post || '')}`;
  ctx.stage(ph.who, { bubble: gapHTML(''), expr: 'neutral' });
  const sent = h('div', { class: 'sentence', html: gapHTML('') });
  const chips = h('div', { class: 'chips', role: 'group', 'aria-label': 'الكلمات' });
  root.append(kind('gap', item.n), h('p', { class: 'prompt' }, 'إيه الكلمة الناقصة؟'), sent, h('p', { class: 'ar-under' }, ph.ar), chips);
  let tries = 0, done = false;
  return new Promise(res => {
    for (const c of shuffle(item.chips)) {
      const b = h('button', { class: 'chip en', type: 'button' }, c);
      b.addEventListener('click', async () => {
        if (done) return; tries++;
        sent.innerHTML = gapHTML(c); ctx.bubble(gapHTML(c));
        if (c === item.answer) {
          done = true; b.classList.add('correct'); chips.querySelectorAll('.chip').forEach(x => x.disabled = true);
          ctx.react(ph.who === 'mia' ? 'clap' : 'happy'); if (ph.audio) play(ph.audio, { onstart: d => ctx.talk(d) });
          await ctx.feedback('ok', { head: pick(T.ok), why: `${enHTML(item.text.replace('___', c))} = ${esc(ph.ar)}` + (item.explain ? `<br>${esc(item.explain)}` : '') });
          res({ correct: tries === 1 });
        } else {
          b.classList.add('wrong'); b.disabled = true; ctx.react('oops');
          setTimeout(() => { if (!done) { sent.innerHTML = gapHTML(''); ctx.bubble(gapHTML('')); } }, 700);
          ctx.feedback('bad', { head: pick(T.bad), why: item.explain && tries >= 2 ? esc(item.explain) : '' });
        }
      });
      chips.append(b);
    }
  });
}

// ---------- 5. say it out loud ----------
const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
async function speak(root, item, ctx) {
  const asks = item.asks, ph = item.phrase;
  ctx.stage('mia', { bubble: esc(asks.en), expr: 'happy' });
  const box = h('div', { style: 'text-align:center' });
  root.append(kind('speak', item.n), h('p', { class: 'prompt' }, 'ميا بتسألك… رد عليها بصوت عالي!'), box);
  const hintEl = h('div', { class: 'sentence', style: 'color:var(--navy)' }, item.hint);
  const ex = h('p', { class: 'hint', html: 'مثلًا: ' + item.examples.map(enHTML).join(' · ') });
  const ask = playButton(asks.audio, 'اسمع ميا', { onplay: d => ctx.talk(d) });
  const start = h('button', { class: 'btn teal big', type: 'button' }, 'جاهز؟ يلا 3، 2، 1');
  box.append(h('div', { style: 'margin:6px 0 10px' }, ask), hintEl, ex, h('div', { style: 'margin-top:14px' }, start));
  sleep(350).then(() => play(asks.audio, { onstart: d => ctx.talk(d) }));

  return new Promise(res => {
    start.addEventListener('click', async () => {
      start.remove(); ask.remove();
      // 3-2-1 ring
      const ring = h('div', { class: 'ring', 'aria-live': 'polite' }, h('div', { html: '<svg viewBox="0 0 120 120"><circle class="bg" cx="60" cy="60" r="50"/><circle class="fg" cx="60" cy="60" r="50"/></svg>' }), h('div', { class: 'n' }, '3'));
      box.prepend(ring);
      const fg = ring.querySelector('.fg'), n = ring.querySelector('.n');
      for (let i = 3; i >= 1; i--) { n.textContent = String(i); fg.style.strokeDashoffset = String(314 * (1 - i / 3)); await sleep(REDUCED ? 500 : 900); }
      n.textContent = '🎤'; fg.style.strokeDashoffset = '314';
      ctx.bubble(esc(asks.en)); ctx.react('wave');
      // listen with the mic when the browser can; otherwise self-check only
      const status = h('p', { class: 'listening' }, 'قولها دلوقتي!');
      box.prepend(status);
      let heard = null;
      if (SR) {
        try {
          const r = new SR(); r.lang = 'en-US'; r.interimResults = false; r.maxAlternatives = 3;
          heard = await new Promise(ok => {
            let out = null; const t = setTimeout(() => { try { r.stop(); } catch (e) { } }, 6000);
            r.onresult = e => { out = Array.from(e.results[0]).map(a => a.transcript); };
            r.onerror = () => { }; r.onend = () => { clearTimeout(t); ok(out); };
            r.start(); status.textContent = '🎤 بسمعك… قولها';
          });
        } catch (e) { heard = null; }
      } else await sleep(REDUCED ? 1500 : 3500);
      ring.remove();
      const words = heard ? heard.join(' ').toLowerCase() : '';
      const hit = heard && item.keywords.some(k => words.includes(k));
      if (hit) {
        status.innerHTML = `سمعتك! ✓ قلت: ${enHTML(heard[0])}`; status.className = 'prompt';
        ctx.react('clap'); await ctx.feedback('ok', { head: 'برافو عليك! 🎉', why: `سمعتك بتقول ${enHTML(heard[0])}` });
        return res({ correct: true });
      }
      status.textContent = heard && heard.length ? `سمعت: ${heard[0]}… ` : '';
      status.className = 'hint';
      const q = h('p', { class: 'prompt', style: 'margin-top:10px' }, 'قلتها؟');
      const yes = h('button', { class: 'btn teal wide', type: 'button' }, 'أيوه، قلتها! ✓');
      const no = h('button', { class: 'btn ghost wide', type: 'button' }, 'لسه… سمّعني تاني 🔁');
      const acts = h('div', { style: 'display:flex;flex-direction:column;gap:10px;margin-top:8px' }, yes, no);
      box.append(q, acts);
      yes.addEventListener('click', async () => {
        acts.remove(); q.remove(); ctx.react('clap');
        await ctx.feedback('ok', { head: 'برافو عليك! 🎉', why: `ردود حقيقية: ${item.examples.map(enHTML).join(' · ')}` });
        res({ correct: true });
      });
      no.addEventListener('click', async () => {
        if (ph.audio) await play(ph.audio, { onstart: d => { ctx.stage('youssef', { bubble: esc(ph.en), expr: 'happy' }); ctx.talk(d); } });
        ctx.stage('mia', { bubble: esc(asks.en), expr: 'happy' });
        no.textContent = 'كمّل من غير ما أقولها';
        no.onclick = async () => { acts.remove(); q.remove(); await ctx.feedback('ok', { head: 'ماشي… جرّبها المرة الجاية', why: `قول: ${item.examples.map(enHTML).join(' · ')}` }); res({ correct: false }); };
      });
    });
  });
}

export const EX = { listen, fix, order, gap, speak };
export function runItem(root, item, ctx) { return EX[item.type](root, item, ctx); }

// ---- normalisation: episode JSON → runnable items (shared with the review generator) ----
export function phraseMap(ep) { const m = new Map(); for (const p of ep.phrases) m.set(p.id, { ...p, ep: ep.id, key: `${ep.id}:${p.id}` }); return m; }
export function normalise(ep, item, n) {
  const P = phraseMap(ep), M = new Map((ep.mistakes || []).map(m => [m.id, m]));
  if (item.type === 'fix') { const m = M.get(item.mistake); return { ...m, ...item, type: 'fix', phrase: P.get(m.phrase), n }; }
  if (item.type === 'order') {
    const ph = P.get(item.phrase), join = item.join ? P.get(item.join) : null;
    const sentence = join ? `${ph.en} ${join.en}` : ph.en;
    return { ...item, phrase: ph, words: sentence.split(' '), ar: join ? `${ph.ar} ${join.ar}` : ph.ar, n };
  }
  if (item.type === 'listen') { const ph = P.get(item.phrase); return { ...item, phrase: ph, answer: item.mode === 'ar' ? item.options[0] : item.options[0], n }; }
  if (item.type === 'speak') return { ...item, phrase: P.get(item.phrase), asks: P.get(item.asks), n };
  return { ...item, phrase: P.get(item.phrase), n };
}
