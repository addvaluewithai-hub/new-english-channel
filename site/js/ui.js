// Small shared UI helpers: audio, DOM, confetti, toast, share.
export const REDUCED = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
export const $ = (s, r = document) => r.querySelector(s);
export function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const k in attrs) {
    const v = attrs[k];
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v; else if (k === 'html') el.innerHTML = v; else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'dataset') Object.assign(el.dataset, v); else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat()) if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(String(c)));
  return el;
}
// wrap Latin runs (English inside an Arabic line) in an LTR span so punctuation does not flip
export const mix = s => esc(s).replace(/[A-Za-z][A-Za-z0-9'’,…!? .-]*[A-Za-z0-9.!?…]|[A-Za-z]/g, m => `<span class="en" dir="ltr">${m}</span>`);
export const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const sleep = ms => new Promise(r => setTimeout(r, ms));
export const qs = () => Object.fromEntries(new URLSearchParams(location.search));

// ---- audio: one cached element per clip; play() resolves when the clip ends (or fails, e.g. autoplay blocked) ----
const cache = new Map();
let current = null;
export function clip(src) {
  if (!src) return null;
  if (!cache.has(src)) { const a = new Audio(src); a.preload = 'auto'; cache.set(src, a); }
  return cache.get(src);
}
export function preload(srcs) { for (const s of srcs) if (s) clip(s); }
export function play(src, { onstart } = {}) {
  const a = clip(src); if (!a) return Promise.resolve(0);
  if (current && current !== a) { current.pause(); current.currentTime = 0; }
  current = a;
  return new Promise(res => {
    const done = () => { a.removeEventListener('ended', done); a.removeEventListener('error', done); res(a.duration || 1); };
    a.addEventListener('ended', done); a.addEventListener('error', done);
    a.currentTime = 0;
    const p = a.play();
    if (p && p.catch) p.catch(() => done());
    if (onstart) onstart(isFinite(a.duration) && a.duration ? a.duration : 1.2);
  });
}
export const PLAY_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13c0 .8.9 1.3 1.6.9l10-6.5c.6-.4.6-1.4 0-1.8l-10-6.5C8.9 4.2 8 4.7 8 5.5z"/></svg>';
export const SPEAKER_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"/></svg>';
export function playButton(src, label = 'اسمع', { small = false, onplay } = {}) {
  const b = h('button', { class: 'play' + (small ? ' small' : ''), type: 'button', 'aria-label': label, html: SPEAKER_SVG + (label ? `<span>${esc(label)}</span>` : '') });
  b.addEventListener('click', async () => {
    b.classList.add('playing');
    await play(src, { onstart: d => onplay && onplay(d) });
    b.classList.remove('playing');
  });
  return b;
}

// ---- toast ----
let toastEl = null, toastT = 0;
export function toast(msg) {
  if (!toastEl) { toastEl = h('div', { class: 'toast', role: 'status' }); document.body.append(toastEl); }
  toastEl.textContent = msg; toastEl.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), 2200);
}

// ---- share ----
export async function share({ title, text, url }) {
  try {
    if (navigator.share) { await navigator.share({ title, text, url }); return true; }
    await navigator.clipboard.writeText(`${text}\n${url}`); toast('اتنسخ اللينك ✓'); return true;
  } catch (e) { return false; }
}

// ---- confetti (palette colours, respects reduced motion) ----
export function confetti(ms = 2200) {
  if (REDUCED) return;
  let cv = document.getElementById('confetti');
  if (!cv) { cv = h('canvas', { id: 'confetti' }); document.body.append(cv); }
  const dpr = Math.min(2, devicePixelRatio || 1), W = innerWidth, H = innerHeight;
  cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
  const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const COLS = ['#E8483A', '#2E3D7C', '#F5B63E', '#1E9D93', '#69B464', '#9BD3EC'];
  const ps = Array.from({ length: 110 }, () => ({ x: W / 2 + (Math.random() - .5) * W * .5, y: H * .35, vx: (Math.random() - .5) * 14, vy: -9 - Math.random() * 9, r: 5 + Math.random() * 6, a: Math.random() * 6, va: (Math.random() - .5) * .3, col: COLS[Math.floor(Math.random() * COLS.length)], shape: Math.random() < .4 ? 1 : 0 }));
  const t0 = performance.now();
  (function frame(now) {
    const u = (now - t0) / ms; c.clearRect(0, 0, W, H);
    for (const p of ps) {
      p.vy += .32; p.x += p.vx; p.y += p.vy; p.vx *= .99; p.a += p.va;
      c.save(); c.translate(p.x, p.y); c.rotate(p.a); c.globalAlpha = Math.max(0, 1 - Math.max(0, u - .7) / .3); c.fillStyle = p.col;
      if (p.shape) { c.beginPath(); c.arc(0, 0, p.r * .6, 0, 7); c.fill(); } else c.fillRect(-p.r / 2, -p.r / 3, p.r, p.r * .66);
      c.restore();
    }
    if (u < 1) requestAnimationFrame(frame); else c.clearRect(0, 0, W, H);
  })(t0);
}

// stars → "★★☆"
export const starsHTML = n => [1, 2, 3].map(i => `<span class="${i <= n ? 'on' : 'off'}">⭐</span>`).join('');
export const starsFor = (score, total) => { const r = total ? score / total : 0; return r >= .9 ? 3 : r >= .6 ? 2 : 1; };
