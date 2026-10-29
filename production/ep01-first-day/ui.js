// Bean People v2 — type: speech bubbles with a speaker tab + word highlighting, Arabic RTL narration caption.
import { P, rgba, mix, dark, rr } from './kit.js';
import { clamp, back, eo } from '/core/lib.js';

export const SPEAKER = {
  youssef: { name: 'YOUSSEF', tab: P.navy, hi: P.mustard },
  mia: { name: 'MIA', tab: '#C24A28', hi: P.mustard },
};
const FS = 64;   // English dialogue size at 1080p (≥ 56)

// bubble: x,y = tail tip (points at the speaker's mouth); side: where the box sits relative to the tip (-1 left, 1 right, 0 centred)
// words: [{w, s}] s = state: 0 upcoming, 0..1 being spoken, 1 spoken.  pop: 0..1 entrance
export function bubble(c, { x, y, who, words, side = 0, above = 1, pop = 1, lift = 150 }) {
  if (pop <= 0) return null;
  const S = SPEAKER[who];
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
  c.font = `600 ${FS}px "Fredoka"`; c.textBaseline = 'alphabetic'; c.textAlign = 'left';
  const sp = c.measureText(' ').width, ws = words.map(o => c.measureText(o.w).width);
  const tw = ws.reduce((a, b) => a + b, 0) + sp * (words.length - 1);
  const padX = 46, padY = 30, bw = tw + padX * 2, bh = FS + padY * 2 + 6;
  const bx = clamp(side < 0 ? x - bw + 70 : side > 0 ? x - 70 : x - bw / 2, 40, 1880 - bw), by = y - lift - bh;
  // entrance: scale from the tail with overshoot
  const s = back(clamp(pop), 2.2) * .9 + .1 * clamp(pop);
  c.translate(x, y); c.scale(s, s); c.translate(-x, -y);
  c.globalAlpha = clamp(pop * 3);
  const shape = (dy = 0) => {
    rr(c, bx, by + dy, bw, bh, 44);
    // tail: curved wedge from the box bottom to the tip
    const tx = clamp(x, bx + 70, bx + bw - 70), w = 30;
    c.moveTo(tx - w, by + bh - 2 + dy); c.quadraticCurveTo(tx - w * .2, by + bh + (y - by - bh) * .45 + dy, x, y + dy);
    c.quadraticCurveTo(tx + w * .6, by + bh + (y - by - bh) * .3 + dy, tx + w, by + bh - 2 + dy); c.closePath();
  };
  shape(10); c.fillStyle = rgba('#2A2742', .16); c.fill('nonzero');
  shape(); c.fillStyle = '#FFFDF8'; c.fill('nonzero');
  // name tab
  c.font = '400 30px "Lilita One"'; c.letterSpacing = '2px';
  const nw = c.measureText(S.name).width + 36, nx = bx + 34, ny = by - 24;
  rr(c, nx, ny, nw, 46, 23); c.fillStyle = S.tab; c.fill();
  c.fillStyle = P.cream; c.textAlign = 'left'; c.fillText(S.name, nx + 18, ny + 34); c.letterSpacing = '0px';
  // words
  c.font = `600 ${FS}px "Fredoka"`;
  let wx = bx + padX; const base = by + padY + FS * .86 + 6;
  words.forEach((o, i) => {
    const cur = o.s > 0 && o.s < 1;
    if (cur || o.mark) {   // highlighter swash behind the current word
      const k = cur ? eo(clamp(o.s * 3)) : 1;
      rr(c, wx - 8, base - FS * .62, (ws[i] + 16) * k, FS * .72, 14); c.fillStyle = rgba(S.hi, .55); c.fill();
    }
    c.fillStyle = o.s > 0 ? P.ink : rgba(P.ink, .3);
    c.fillText(o.w, wx, base);
    wx += ws[i] + sp;
  });
  c.restore();
  return { x: bx, y: by, w: bw, h: bh };
}

// Arabic narration caption (RTL), bottom centre; words light up as narrated (prog 0..1 over the words)
export function caption(c, { text, prog = 1, alpha = 1, y = 1000 }) {
  if (alpha <= 0) return;
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = alpha;
  c.direction = 'rtl'; c.font = '700 54px "Baloo Bhaijaan 2"'; c.textBaseline = 'middle';
  const words = text.split(' '), sp = c.measureText(' ').width, ws = words.map(w => c.measureText(w).width);
  const tw = ws.reduce((a, b) => a + b, 0) + sp * (words.length - 1);
  const pw = tw + 96, ph = 100, px = 960 - pw / 2, py = y - ph / 2;
  rr(c, px, py + 6, pw, ph, 30); c.fillStyle = rgba('#1E1B33', .22); c.fill();
  rr(c, px, py, pw, ph, 30); c.fillStyle = rgba(P.ink, .86); c.fill();
  // speaker tab (right side, RTL)
  c.font = '700 26px "Baloo Bhaijaan 2"'; const tab = 'يوسف', tw2 = c.measureText(tab).width + 34;
  rr(c, px + pw - tw2 - 30, py - 30, tw2, 40, 20); c.fillStyle = P.navy; c.fill();
  c.fillStyle = P.cream; c.textAlign = 'right'; c.fillText(tab, px + pw - 30 - 17, py - 9);
  // words (right → left)
  c.font = '700 54px "Baloo Bhaijaan 2"'; c.textAlign = 'right';
  let xr = px + pw - 48; const n = words.length;
  words.forEach((w, i) => {
    const on = clamp(prog * n - i);
    c.fillStyle = on >= 1 ? P.cream : on > 0 ? mix(mix(P.cream, P.ink, .55), P.mustard, on) : rgba(P.cream, .4);
    if (on > 0 && on < 1) c.fillStyle = P.mustard;
    c.fillText(w, xr, y + 8);
    xr -= ws[i] + sp;
  });
  c.restore();
}
