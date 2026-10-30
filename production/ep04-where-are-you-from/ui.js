// Episode 1 — type: speech bubbles with a speaker tab + word highlighting, the Arabic narration plate (RTL, words light up),
// thought bubbles and small drawn icons (no emoji fonts anywhere).
import { P, rgba, mix, dark, light, rr, ell } from './kit.js';
import { clamp, back, eo, ei, seg, ss, lerp } from '/core/lib.js';
import { TL, narrChunks } from './tl.js';

export const SPEAKER = {
  youssef: { name: 'YOUSSEF', tab: P.navy, hi: P.mustard },
  mia: { name: 'SARA', tab: '#C24A28', hi: P.mustard },   // the teacher, Sara (internal id mia; rust tab)
};
export const RUST = '#C24A28';
const FS = 64;   // English dialogue size at 1080p (≥ 56)
const AR = '"Baloo Bhaijaan 2"';

// word states from timed tokens: 0 upcoming, 0..1 being spoken, 1 spoken
export const wordStates = (tok, t) => tok.map(o => ({ w: o.w, s: t < o.t0 ? 0 : t >= o.t1 ? 1 : clamp((t - o.t0) / Math.max(.08, o.t1 - o.t0), .001, .999) }));

// bubble: x,y = tail tip (points at the speaker's head); side: where the box sits relative to the tip (-1 left, 1 right, 0 centred)
// words: [{w, s}]. pop: 0..1 entrance (1 = fully in). out: 0..1 exit. Returns the box (screen px).
export function bubble(c, { x, y, who, words, side = 0, pop = 1, out = 0, lift = 150, maxW = 1240, minX = 40, maxX = 1880 }) {
  if (pop <= 0 || out >= 1) return null;
  const S = SPEAKER[who];
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
  c.font = `600 ${FS}px "Fredoka"`; c.textBaseline = 'alphabetic'; c.textAlign = 'left';
  const sp = c.measureText(' ').width, ws = words.map(o => c.measureText(o.w).width);
  // lines (wrap when too wide)
  const rows = [[]]; let rw = 0;
  words.forEach((o, i) => { const add = (rows[rows.length - 1].length ? sp : 0) + ws[i]; if (rw + add > maxW - 92 && rows[rows.length - 1].length) { rows.push([]); rw = 0; } rows[rows.length - 1].push(i); rw += rows[rows.length - 1].length > 1 ? sp + ws[i] : ws[i]; });
  const rowW = rows.map(r => r.reduce((a, i, k) => a + ws[i] + (k ? sp : 0), 0));
  const tw = Math.max(...rowW), LH = FS * 1.12;
  const padX = 46, padY = 30, bw = tw + padX * 2, bh = FS + LH * (rows.length - 1) + padY * 2 + 6;
  const bx = clamp(side < 0 ? x - bw + 70 : side > 0 ? x - 70 : x - bw / 2, minX, maxX - bw), by = y - lift - bh;
  // entrance: scale from the tail with overshoot; exit: quick shrink toward the tail
  const s = (back(clamp(pop), 2.2) * .9 + .1 * clamp(pop)) * (1 - ei(out) * .35);
  c.translate(x, y); c.scale(s, s); c.translate(-x, -y);
  c.globalAlpha = clamp(pop * 3) * (1 - out);
  const shape = (dy = 0) => {
    rr(c, bx, by + dy, bw, bh, 44);
    const tx = clamp(x, bx + 70, bx + bw - 70), w = 30;
    c.moveTo(tx - w, by + bh - 2 + dy); c.quadraticCurveTo(tx - w * .2, by + bh + (y - by - bh) * .45 + dy, x, y + dy);
    c.quadraticCurveTo(tx + w * .6, by + bh + (y - by - bh) * .3 + dy, tx + w, by + bh - 2 + dy); c.closePath();
  };
  shape(10); c.fillStyle = rgba('#2A2742', .16); c.fill('nonzero');
  shape(); c.fillStyle = '#FFFDF8'; c.fill('nonzero');
  nameTab(c, S, bx + 34, by - 24);
  c.font = `600 ${FS}px "Fredoka"`; c.textAlign = 'left';
  rows.forEach((r, ri) => {
    let wx = bx + padX + (tw - rowW[ri]) / 2; const base = by + padY + FS * .86 + 6 + ri * LH;
    for (const i of r) {
      const o = words[i], cur = o.s > 0 && o.s < 1;
      if (cur || o.mark) {   // highlighter swash behind the current word
        const k = cur ? eo(clamp(o.s * 3)) : 1;
        rr(c, wx - 8, base - FS * .62, (ws[i] + 16) * k, FS * .72, 14); c.fillStyle = rgba(S.hi, .55); c.fill();
      }
      c.fillStyle = o.s > 0 ? P.ink : rgba(P.ink, .3);
      const jit = o.shake ? Math.sin(o.shake * 61) * 2.2 : 0;
      c.fillText(o.w, wx + jit, base);
      wx += ws[i] + sp;
    }
  });
  c.restore();
  return { x: bx, y: by, w: bw, h: bh };
}
export function nameTab(c, S, nx, ny, size = 30) {
  c.save();
  c.font = `400 ${size}px "Lilita One"`; c.letterSpacing = '2px'; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  const nw = c.measureText(S.name).width + size * 1.2, h = size * 1.53;
  rr(c, nx, ny, nw, h, h / 2); c.fillStyle = S.tab; c.fill();
  c.fillStyle = P.cream; c.fillText(S.name, nx + size * .6, ny + size * 1.13); c.letterSpacing = '0px';
  c.restore();
  return nw;
}

// a dialogue line as a bubble: timing from the line (pop in just before it is spoken, out when the next line starts / after a hold)
export function lineBubble(c, line, t, pos, { hold = 1.4, next = null, until = null } = {}) {
  if (!line) return null;
  const tIn = line.t0 - .18, tEnd = until ?? Math.min(next ? next - .4 : 1e9, line.t1 + hold);
  if (t < tIn || t > tEnd + .2) return null;
  const pop = seg(t, tIn, tIn + .3), out = seg(t, tEnd, tEnd + .2);
  return bubble(c, { ...pos, who: line.who, words: wordStates(line.tok, t).map((o, i) => ({ ...o, ...(pos.wordFx ? pos.wordFx(i, t) : {}) })), pop, out });
}

// ---------------- Arabic narration plate ----------------
const tokFont = o => o.lat ? '600 48px "Fredoka"' : `700 54px ${AR}`;
let MC = null;
const measureTok = o => { if (!MC) MC = document.createElement('canvas').getContext('2d'); MC.font = tokFont(o); return MC.measureText(o.w).width; };
export const plateVisible = t => TL.narration.some(n => t > n.t0 - .3 && t < n.t1 + .55);
// the plate for whatever narration is playing at t
export function plate(c, t, { y = 1000, hide = 0 } = {}) {
  let n = null;
  for (const m of TL.narration) if (t > m.t0 - .3 && t < m.t1 + .55) n = m;
  if (!n) return;
  const chunks = narrChunks(n, measureTok);
  let k = chunks.findIndex(ch => t < ch.t1); if (k < 0) k = chunks.length - 1;
  const a = Math.min(seg(t, n.t0 - .3, n.t0 - .1), 1 - seg(t, n.t1 + .35, n.t1 + .55)) * (1 - hide);
  if (a <= 0) return;
  const ch = chunks[k], prev = chunks[k - 1];
  const wOf = cc => cc.idx.reduce((s, i) => s + measureTok(n.tok[i]), 0) + 18 * (cc.idx.length - 1) + 96;
  const sw = seg(t, ch.t0 - .06, ch.t0 + .22);
  const pw = prev ? lerp(wOf(prev), wOf(ch), ss(sw)) : wOf(ch);
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = a;
  const ph = 100, px = 960 - pw / 2, py = y - ph / 2 + (1 - eo(a)) * 12;
  rr(c, px, py + 6, pw, ph, 30); c.fillStyle = rgba('#1E1B33', .22); c.fill();
  rr(c, px, py, pw, ph, 30); c.fillStyle = rgba(P.ink, .88); c.fill();
  // speaker tab (right side, RTL)
  c.direction = 'rtl'; c.font = `700 26px ${AR}`; c.textBaseline = 'middle'; const tab = 'يوسف', tw2 = c.measureText(tab).width + 34;
  rr(c, px + pw - tw2 - 30, py - 30, tw2, 40, 20); c.fillStyle = P.navy; c.fill();
  c.fillStyle = P.cream; c.textAlign = 'right'; c.fillText(tab, px + pw - 30 - 17, py - 9);
  const words = (cc, al) => {
    if (al <= 0) return;
    c.globalAlpha = a * al;
    let xr = 960 + (wOf(cc) - 96) / 2;
    for (const i of cc.idx) {
      const o = n.tok[i], w = measureTok(o);
      const st = t < o.t0 ? 0 : t >= o.t1 ? 1 : .5;
      c.font = tokFont(o); c.direction = o.lat ? 'ltr' : 'rtl'; c.textAlign = 'right';
      if (o.lat && st > 0) { rr(c, xr - w - 8, y - 26, w + 16, 52, 14); c.fillStyle = rgba(P.cream, st === 1 ? .12 : .18); c.fill(); }
      c.fillStyle = st === .5 ? P.mustard : st === 1 ? (o.lat ? '#BFE6F5' : P.cream) : rgba(P.cream, .4);
      c.fillText(o.w, xr, y + (o.lat ? 2 : 8));
      xr -= w + 18;
    }
  };
  // the old phrase leaves before the new one arrives, so two lines never overlap
  if (prev && sw < .5) words(prev, 1 - sw * 2);
  words(ch, prev ? seg(sw, .5, 1) : 1);
  c.restore();
}

// ---------------- thought bubble (cloud + trailing dots toward the head) ----------------
// x,y: centre of the cloud; hx,hy: the thinker's head; w,h: size; pop: 0..1; draw(c) paints the content around (x,y)
export function thought(c, { x, y, w, h, hx, hy, pop = 1, out = 0 }, draw) {
  if (pop <= 0 || out >= 1) return;
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
  const a = clamp(pop * 2) * (1 - out);
  c.globalAlpha = a;
  // trailing dots (appear first)
  for (let i = 0; i < 3; i++) {
    const f = (i + 1) / 4, k = back(seg(pop, i * .12, i * .12 + .35), 2);
    const px = lerp(hx, x, f * .8), py = lerp(hy, y + h * .35, f * .8), r = (10 + i * 7) * k;
    if (r > .5) { ell(c, px, py + 4, r, r * .9); c.fillStyle = rgba('#2A2742', .14); c.fill(); ell(c, px, py, r, r * .9); c.fillStyle = '#FFFDF8'; c.fill(); }
  }
  const s = back(seg(pop, .3, 1), 2) * (1 - ei(out) * .3);
  if (s > 0) {
    c.translate(x, y); c.scale(s, s);
    const blobs = [];
    const N = 9;
    for (let i = 0; i < N; i++) { const an = i / N * Math.PI * 2; blobs.push([Math.cos(an) * w * .42, Math.sin(an) * h * .36, Math.min(w, h) * (.24 + .05 * Math.sin(i * 2.3))]); }
    const path = (dy = 0) => { c.beginPath(); for (const [bx, by, r] of blobs) { c.moveTo(bx + r, by + dy); c.arc(bx, by + dy, r, 0, Math.PI * 2); } c.ellipse(0, dy, w * .44, h * .38, 0, 0, Math.PI * 2); };
    path(9); c.fillStyle = rgba('#2A2742', .14); c.fill('nonzero');
    path(); c.fillStyle = '#FFFDF8'; c.fill('nonzero');
    draw(c);
  }
  c.restore();
}

// ---------------- small drawn icons ----------------
export function smiley(c, x, y, r, col = P.ink) {    // the drawn smile used instead of an emoji
  c.save(); ell(c, x, y, r, r); c.fillStyle = P.mustard; c.fill();
  c.fillStyle = col; ell(c, x - r * .34, y - r * .2, r * .11, r * .16); c.fill(); ell(c, x + r * .34, y - r * .2, r * .11, r * .16); c.fill();
  c.strokeStyle = col; c.lineWidth = r * .12; c.lineCap = 'round'; c.beginPath(); c.arc(x, y + r * .02, r * .5, .2 * Math.PI, .8 * Math.PI); c.stroke();
  c.restore();
}
export function repeatIcon(c, x, y, r, col, rot = 0) {   // two chasing arrows (loop)
  c.save(); c.translate(x, y); c.rotate(rot); c.strokeStyle = col; c.fillStyle = col; c.lineWidth = r * .22; c.lineCap = 'round';
  for (const s of [0, Math.PI]) {
    c.beginPath(); c.arc(0, 0, r, s + .35, s + 2.6); c.stroke();
    const a = s + 2.6, hx = Math.cos(a) * r, hy = Math.sin(a) * r, tx = -Math.sin(a), ty = Math.cos(a);
    c.beginPath(); c.moveTo(hx + tx * r * .42, hy + ty * r * .42); c.lineTo(hx + Math.cos(a) * r * .34, hy + Math.sin(a) * r * .34); c.lineTo(hx - Math.cos(a) * r * .34, hy - Math.sin(a) * r * .34); c.closePath(); c.fill();
  }
  c.restore();
}
// the calm "repeat" cue: loop icon + كرر in a soft pill
export function repeatCue(c, x, y, a, t) {
  if (a <= 0) return;
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = a;
  const k = back(clamp(a * 1.2), 1.8); c.translate(x, y); c.scale(k, k);
  c.font = `700 40px ${AR}`; c.direction = 'rtl'; c.textAlign = 'right'; c.textBaseline = 'middle';
  const tw = c.measureText('كرّر').width, w = tw + 110;
  rr(c, -w / 2, -34, w, 68, 34); c.fillStyle = rgba(P.teal, .14); c.fill();
  c.fillStyle = dark(P.teal, .15); c.fillText('كرّر', w / 2 - 28, 6);
  repeatIcon(c, -w / 2 + 44, 0, 17, dark(P.teal, .15), t * 2.2);
  c.restore();
}
export function micIcon(c, x, y, s, col = P.cream, pulse = 0) {
  c.save(); c.translate(x, y); c.scale(s, s);
  if (pulse > 0) for (const k of [0, .5]) { const u = (pulse + k) % 1; ell(c, 0, -6, 40 + u * 40, 40 + u * 40); c.strokeStyle = rgba(col, .35 * (1 - u)); c.lineWidth = 4; c.stroke(); }
  c.fillStyle = col; rr(c, -15, -44, 30, 56, 15); c.fill();
  c.strokeStyle = col; c.lineWidth = 6; c.lineCap = 'round';
  c.beginPath(); c.arc(0, -10, 25, .1 * Math.PI, .9 * Math.PI); c.stroke();
  c.beginPath(); c.moveTo(0, 15); c.lineTo(0, 28); c.moveTo(-13, 29); c.lineTo(13, 29); c.stroke();
  c.restore();
}
export function check(c, x, y, r, k = 1, col = P.leaf) {   // round badge with a tick that draws on (k 0..1)
  if (k <= 0) return;
  c.save(); c.translate(x, y); const s = back(clamp(k * 1.6), 2); c.scale(s, s);
  ell(c, 0, 0, r, r); c.fillStyle = col; c.fill();
  c.strokeStyle = P.cream; c.lineWidth = r * .22; c.lineCap = 'round'; c.lineJoin = 'round';
  const d = clamp((k - .12) / .45);
  c.beginPath(); c.moveTo(-r * .45, 0); const p1 = [-r * .12, r * .32], p2 = [r * .5, -r * .36];
  if (d < .4) c.lineTo(lerp(-r * .45, p1[0], d / .4), lerp(0, p1[1], d / .4)); else { c.lineTo(...p1); c.lineTo(lerp(p1[0], p2[0], (d - .4) / .6), lerp(p1[1], p2[1], (d - .4) / .6)); }
  c.stroke(); c.restore();
}
export function cross(c, x, y, r, k = 1, col = P.red) {
  if (k <= 0) return;
  c.save(); c.translate(x, y); const s = back(clamp(k * 1.6), 2); c.scale(s, s);
  ell(c, 0, 0, r, r); c.fillStyle = col; c.fill();
  c.strokeStyle = P.cream; c.lineWidth = r * .22; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-r * .38, -r * .38); c.lineTo(r * .38, r * .38); c.moveTo(r * .38, -r * .38); c.lineTo(-r * .38, r * .38); c.stroke();
  c.restore();
}
// red spell-check squiggle under [x0, x1] at baseline y, drawn on with k (0..1)
export function squiggle(c, x0, x1, y, k = 1, amp = 7, col = P.red, lw = 6) {
  if (k <= 0) return;
  const xe = lerp(x0, x1, clamp(k)), per = 26;
  c.save(); c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath();
  for (let x = x0; x <= xe; x += 3) { const yy = y + Math.sin((x - x0) / per * Math.PI * 2) * amp; x === x0 ? c.moveTo(x, yy) : c.lineTo(x, yy); }
  c.stroke(); c.restore();
}
// sparkle / star burst
export function sparkle(c, x, y, r, col = P.mustard, rot = 0) {
  c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = col; c.beginPath();
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, rr2 = i % 2 ? r * .32 : r; c.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2); }
  c.closePath(); c.fill(); c.restore();
}
export function commentIcon(c, x, y, s, col = P.navy) {
  c.save(); c.translate(x, y); c.scale(s, s);
  rr(c, -46, -34, 92, 62, 18); c.fillStyle = col; c.fill();
  c.beginPath(); c.moveTo(-20, 26); c.lineTo(-30, 48); c.lineTo(2, 26); c.fill();
  c.fillStyle = P.cream; for (const [yy, w] of [[-14, 56], [2, 40]]) { rr(c, -28, yy, w, 8, 4); c.fill(); }
  c.restore();
}
// alarm clock (ringing: ring 0..1 shakes it and draws ring marks); hours float
export function alarmClock(c, x, y, r, hours, ring = 0, t = 0) {
  c.save(); c.translate(x, y);
  const sh = ring > 0 ? Math.sin(t * 70) * .09 * ring : 0;
  c.rotate(sh); c.translate(Math.sin(t * 55) * 3 * ring, 0);
  // bells + hammer
  for (const s of [-1, 1]) { c.save(); c.rotate(s * .62); ell(c, 0, -r * 1.12, r * .36, r * .3); c.fillStyle = P.red; c.fill(); c.fillStyle = dark(P.red, .25); c.fillRect(-r * .06, -r * 1.02, r * .12, r * .2); c.restore(); }
  c.fillStyle = P.ink; rr(c, -r * .05, -r * 1.32, r * .1, r * .2, r * .05); c.fill();
  // legs
  c.strokeStyle = P.ink; c.lineWidth = r * .1; c.lineCap = 'round';
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * r * .55, r * .78); c.lineTo(s * r * .78, r * 1.08); c.stroke(); }
  ell(c, 0, 0, r, r); c.fillStyle = P.red; c.fill();
  ell(c, -r * .05, -r * .05, r * .84, r * .84); c.fillStyle = '#FFFDF8'; c.fill();
  c.fillStyle = P.ink;
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; ell(c, -r * .05 + Math.sin(a) * r * .68, -r * .05 - Math.cos(a) * r * .68, r * (i % 3 ? .03 : .055), r * (i % 3 ? .03 : .055)); c.fill(); }
  const ha = (hours % 12) / 12 * Math.PI * 2, ma = (hours % 1) * Math.PI * 2;
  c.strokeStyle = P.ink; c.lineCap = 'round';
  c.lineWidth = r * .1; c.beginPath(); c.moveTo(-r * .05, -r * .05); c.lineTo(-r * .05 + Math.sin(ha) * r * .38, -r * .05 - Math.cos(ha) * r * .38); c.stroke();
  c.lineWidth = r * .07; c.beginPath(); c.moveTo(-r * .05, -r * .05); c.lineTo(-r * .05 + Math.sin(ma) * r * .6, -r * .05 - Math.cos(ma) * r * .6); c.stroke();
  ell(c, -r * .05, -r * .05, r * .07, r * .07); c.fillStyle = P.red; c.fill();
  c.restore();
  if (ring > 0) {   // ring marks
    c.save(); c.translate(x, y); c.strokeStyle = rgba(P.ink, .7 * ring); c.lineWidth = r * .07; c.lineCap = 'round';
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) {
      const a = -Math.PI / 2 + s * (.55 + i * .32), r0 = r * (1.45 + .08 * Math.sin(t * 40 + i)), r1 = r0 + r * .28;
      c.beginPath(); c.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); c.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); c.stroke();
    }
    c.restore();
  }
}
// a digital-style "8:00" label under a clock
export function timeTag(c, x, y, txt, s = 1) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.font = '400 54px "Lilita One"'; c.textAlign = 'center'; c.textBaseline = 'middle';
  const w = c.measureText(txt).width + 44; rr(c, -w / 2, -36, w, 72, 36); c.fillStyle = P.ink; c.fill();
  c.fillStyle = P.mustard; c.fillText(txt, 0, 3); c.restore();
}

// ---------------- episode 2 icons: time of day (sun / low sun / moon), a small waving hand, a "?" pop ----------------
export function sunIcon(c, x, y, r, col = P.mustard, t = 0) {
  c.save(); c.translate(x, y); c.rotate(t * .3);
  c.strokeStyle = col; c.lineWidth = r * .18; c.lineCap = 'round';
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; c.beginPath(); c.moveTo(Math.cos(a) * r * 1.25, Math.sin(a) * r * 1.25); c.lineTo(Math.cos(a) * r * 1.65, Math.sin(a) * r * 1.65); c.stroke(); }
  ell(c, 0, 0, r, r); c.fillStyle = col; c.fill();
  ell(c, -r * .3, -r * .3, r * .3, r * .22, -.6); c.fillStyle = rgba('#FFFBF0', .55); c.fill();
  c.restore();
}
// afternoon: a low sun on a horizon line
export function afternoonIcon(c, x, y, r, col = P.mustard) {
  c.save(); c.translate(x, y);
  c.beginPath(); c.rect(-r * 2, -r * 2, r * 4, r * 2.1); c.clip();
  c.strokeStyle = col; c.lineWidth = r * .18; c.lineCap = 'round';
  for (let i = 0; i < 7; i++) { const a = Math.PI + i / 6 * Math.PI; c.beginPath(); c.moveTo(Math.cos(a) * r * 1.25, Math.sin(a) * r * 1.25); c.lineTo(Math.cos(a) * r * 1.65, Math.sin(a) * r * 1.65); c.stroke(); }
  ell(c, 0, 0, r, r); c.fillStyle = mix(col, P.red, .25); c.fill();
  c.restore();
  c.save(); c.translate(x, y); c.strokeStyle = P.navy; c.lineWidth = r * .18; c.lineCap = 'round'; c.beginPath(); c.moveTo(-r * 1.9, r * .25); c.lineTo(r * 1.9, r * .25); c.stroke(); c.restore();
}
export function moonIcon(c, x, y, r, col = P.navy) {
  c.save(); c.translate(x, y);
  c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fillStyle = col; c.fill();
  c.beginPath(); c.arc(r * .45, -r * .3, r * .82, 0, Math.PI * 2); c.fillStyle = '#FBF1E1'; c.fill();
  c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.clip(); c.beginPath(); c.arc(r * .45, -r * .3, r * .82, 0, Math.PI * 2); c.fillStyle = '#FBF1E1'; c.fill();
  c.restore();
  c.save(); c.translate(x, y); c.fillStyle = P.mustard; for (const [sx, sy, s] of [[r * 1.3, -r * .9, r * .22], [r * 1.0, r * .9, r * .16]]) sparkle(c, sx, sy, s, P.mustard, .4); c.restore();
}
// a little waving hand (goodbye)
export function waveHand(c, x, y, r, skin = '#B9773F', t = 0) {
  c.save(); c.translate(x, y); c.rotate(Math.sin(t * 6) * .25);
  c.fillStyle = skin; c.strokeStyle = P.ink; c.lineWidth = r * .14; c.lineJoin = 'round';
  c.beginPath(); c.roundRect(-r * .55, -r * .2, r * 1.1, r * 1.1, r * .3); c.fill(); c.stroke();
  for (let i = 0; i < 4; i++) { c.beginPath(); c.roundRect(-r * .55 + i * r * .29, -r * .95 + (i === 0 || i === 3 ? r * .2 : 0), r * .24, r * .9, r * .12); c.fill(); c.stroke(); }
  c.beginPath(); c.roundRect(-r * .95, -r * .1, r * .45, r * .6, r * .2); c.fill(); c.stroke();
  c.restore();
}
// a big popping mark ("?" / "!") with a drop shadow, k = 0..1 entrance, rot wobble
export function bigMark(c, x, y, ch, size, k = 1, rot = 0, col = P.mustard) {
  if (k <= 0) return;
  c.save(); c.translate(x, y); c.rotate(rot); const s = back(clamp(k), 2.4); c.scale(s, s);
  c.font = `700 ${size}px "Fredoka"`; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillStyle = rgba('#1E1B33', .25); c.fillText(ch, size * .04, size * .05); c.fillStyle = col; c.fillText(ch, 0, 0);
  c.restore();
}
// a thin "z" trail rising from a sleeper's head (n letters, cycling over per seconds)
export function zzz(c, x, y, t, a = 1, scale = 1, col = P.ink) {
  if (a <= 0) return;
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
  for (let i = 0; i < 3; i++) {
    const u = ((t * .55 + i * .33) % 1), s = (28 + i * 10) * scale;
    c.globalAlpha = a * Math.sin(Math.PI * u) * .9;
    c.font = `600 ${s}px "Fredoka"`; c.fillStyle = col; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.save(); c.translate(x + (30 + i * 26) * scale + Math.sin(u * 4 + i) * 10 * scale, y - (20 + i * 26) * scale - u * 70 * scale); c.rotate(-.2 + Math.sin(u * 3) * .15); c.fillText('z', 0, 0); c.restore();
  }
  c.restore();
}
