// ui.js — RPG windows: blue window skin, dialogue box with name tab + portrait (typed by word timings),
// diary box (RTL, notebook icon on the right), status window with skill stars, emote balloons
import { W, H, C, T, sprFromRows } from './px.js';
import { text, textW, wrap } from './font.js';

export function win(fb, x, y, w, h) {
  fb.rect(x + 2, y, w - 4, h, C.ink); fb.rect(x, y + 2, w, h - 4, C.ink); fb.rect(x + 1, y + 1, w - 2, h - 2, C.ink);
  fb.rect(x + 2, y + 1, w - 4, h - 2, C.white); fb.rect(x + 1, y + 2, w - 2, h - 4, C.white);
  fb.rect(x + 2, y + 2, w - 4, h - 4, C.silver);
  fb.gradV(x + 3, y + 3, w - 6, h - 6, [C.blue, C.navy, C.navy, C.night]);
  fb.hline(x + 3, x + w - 4, y + 3, C.blue);
}
export const BOX = { x: 8, y: 134, w: 304, h: 42 };
// name tab sitting on the top edge of the box
function nameTab(fb, name, x, col) {
  const w = textW(name) + 12, y = BOX.y - 12;
  win(fb, x, y, w, 14);
  text(fb, name, x + 6, y + 3, col, C.night);
}
// o: { name, nameCol, portrait, text, shown (chars visible), done (bool), t, slide (0..1) }
export function dialog(fb, o) {
  const dy = Math.round((1 - (o.slide ?? 1)) * 50);
  const X = BOX.x, Y = BOX.y + dy, Wd = BOX.w, Hd = BOX.h;
  if (o.name) nameTab(fb, o.name, X + 4, o.nameCol || C.yellow);
  win(fb, X, Y, Wd, Hd);
  let tx = X + 10;
  if (o.portrait) {
    const p = o.portrait, px = X + 5, py = Y + Math.round((Hd - p.h) / 2);
    fb.rect(px - 1, py - 1, p.w + 2, p.h + 2, C.ink); fb.gradV(px, py, p.w, p.h, [C.navy, C.night]);
    fb.blit(p, px, py); tx = px + p.w + 8;
  }
  const lines = wrap(o.text, X + Wd - tx - 12);
  let used = 0;
  const ly0 = Y + (lines.length > 1 ? 9 : 16);
  lines.forEach((ln, i) => { const vis = ln.slice(0, Math.max(0, o.shown - used)); used += ln.length + 1; text(fb, vis, tx, ly0 + i * 12, C.white, C.night); });
  if (o.done && Math.floor(o.t * 3) % 2 === 0) text(fb, '▼', X + Wd - 14, Y + Hd - 11, C.white);
  return { tx, Y };
}
// diary box: no portrait on the left; notebook icon on the right (Arabic reads right-to-left)
const BOOK = sprFromRows([
  '.kkkkkkkkkkkkk.',
  'kRrrrrrrrrrrrrk',
  'kRrrrrrrrrrrrrk',
  'kRrrwwwwwwwrrrk',
  'kRrrwkkkkkwrrrk',
  'kRrrwwwwwwwrrrk',
  'kRrrrrrrrrrrrrk',
  'kRrrrrrrrrrrrrk',
  'kRrrrrrrrrrrrrk',
  'kRrrrrrrrrrrrrk',
  'kRrrrrrrrrrrrrk',
  'kRrrrrrrrrrrrrk',
  'kRrrrrrrrrrryrk',
  'kRrrrrrrrrrryrk',
  'kRrrrrrrrrrrrrk',
  'kkwwwwwwwwwwwwk',
  '.kkkkkkkkkkkkk.',
], { k: C.ink, R: C.crimson, r: C.rust, w: C.cream, y: C.amber });
export function diaryBox(fb, t, slide = 1) {
  const dy = Math.round((1 - slide) * 50), X = BOX.x, Y = BOX.y + dy;
  win(fb, X, Y, BOX.w, BOX.h);
  const bx = X + BOX.w - 26, by = Y + 12 + (Math.floor(t * 2) % 2 ? 0 : 0);
  fb.blit(BOOK, bx, by);
  return { right: bx - 8, Y };
}
// status window: name, small portrait, ENGLISH stars (stars: array of 'on'|'off'|'blink')
export function statusWin(fb, x, y, portrait, stars, t, labelFlash = false, slide = 1) {
  const w = 118, h = 40; x += Math.round((1 - slide) * 140);
  win(fb, x, y, w, h);
  fb.rect(x + 4, y + 4, 34, 34, C.ink); fb.gradV(x + 5, y + 5, 32, 32, [C.navy, C.night]); fb.blit(portrait, x + 5, y + 5);
  text(fb, 'YOUSSEF', x + 43, y + 7, C.white, C.night);
  text(fb, 'ENGLISH', x + 43, y + 18, labelFlash && Math.floor(t * 8) % 2 ? C.red : C.silver, C.night);
  stars.forEach((s, i) => {
    const sx = x + 43 + i * 9, sy = y + 28;
    if (s === 'on') text(fb, '★', sx, sy, C.yellow, C.dbrown);
    else if (s === 'blink') text(fb, '★', sx, sy, Math.floor(t * 12) % 2 ? C.white : C.yellow, C.dbrown);
    else text(fb, '☆', sx, sy, C.slate, null);
  });
  return x;
}
// emote balloons (drawn above a head): '!', '?', '...'
export function balloon(fb, x, y, kind, pop = 1) {
  const w = kind === '...' ? 15 : 11, h = 12, X = x - (w >> 1), Y = y - h - Math.round((1 - pop) * 3);
  fb.rect(X + 1, Y, w - 2, h, C.ink); fb.rect(X, Y + 1, w, h - 2, C.ink);
  fb.rect(X + 1, Y + 1, w - 2, h - 2, C.white);
  fb.px(x - 1, Y + h, C.ink); fb.px(x, Y + h, C.white); fb.px(x + 1, Y + h, C.ink); fb.px(x, Y + h + 1, C.ink);
  if (kind === '!') { fb.rect(x, Y + 2, 1, 5, C.red); fb.rect(x - 1, Y + 2, 1, 4, C.red); fb.rect(x - 1, Y + 8, 2, 2, C.red); }
  else if (kind === '?') text(fb, '?', X + 3, Y + 2, C.navy);
  else { for (let k = 0; k < 3; k++) fb.px(X + 4 + k * 3, Y + 7, C.ink); }
}
export function sweat(fb, x, y) { fb.px(x, y, C.skyL); fb.px(x, y + 1, C.sky); fb.px(x - 1, y + 1, C.skyL); fb.px(x + 1, y + 2, C.blue); fb.px(x, y + 2, C.sky); fb.px(x - 1, y + 2, C.sky); fb.px(x, y + 3, C.blue); }
