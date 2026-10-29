// main.js — "Day 1: London": shots, transitions, palette fades, dialogue timing, Arabic diary overlay
import { W, H, FB, C, T, LUT, darken, mosaic, bayer, clamp, eio, eo } from './px.js';
import { street, entrance, ST, SCHOOL_X } from './scenes.js';
import { youssefSide, figure } from './rig.js';
import { portraitY, portraitM } from './portraits.js';
import { win, dialog, diaryBox, statusWin, balloon, sweat, BOX } from './ui.js';
import { text, textW, textOutlined } from './font.js';

const q = new URLSearchParams(location.search);
const TL = await (await fetch('./timeline.json')).json();
const canvas = document.getElementById('c'), ctx = canvas.getContext('2d');
const fb = new FB(), ui = new FB();
const lo = document.createElement('canvas'); lo.width = W; lo.height = H;
const lg = lo.getContext('2d'), img = lg.createImageData(W, H), u32 = new Uint32Array(img.data.buffer);

const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const talking = (who, t) => TL.talk.some(([a, b, w]) => w === who && t >= a && t < b);
const flap = (who, t) => talking(who, t) && Math.floor(t * 10) % 2 === 0;
const sprCache = new Map();
const cached = (key, fn) => { if (!sprCache.has(key)) sprCache.set(key, fn()); return sprCache.get(key); };
function put(f, s, x, y, flip = false) { f.blit(s, Math.round(x) - (flip ? s.w - s.ox : s.ox), Math.round(y) - s.oy, flip); }

// ———————— timing ————————
const A_END = 6.9, FADE_OUT = 16.55;
const DIARY = [
  { t0: 0.7, t1: 2.75, r0: 0.9, r1: 2.3, ar: 'أول يوم ليّا في لندن…' },
  { t0: 2.75, t1: 5.9, r0: 2.8, r1: 5.3, ar: 'وكنت فاكر إن الإنجليزي بتاعي كويس.' },
  { t0: 5.9, t1: 7.9, r0: 6.1, r1: 7.3, ar: 'لحد ما قابلت ميا.' },
];
// English boxes: each word types inside its own talk span
const BOXES = [
  { who: 'mia', t0: 7.95, t1: 9.88 }, { who: 'youssef', t0: 9.88, t1: 14.9 }, { who: 'mia', t0: 14.9, t1: 99 },
].map((b, i) => {
  const L = TL.lines[i], spans = TL.talk.filter(([a, , w]) => w === L.who && a >= L.t0 - .3 && a <= L.t1 + .1);
  const words = L.text.split(' '); let c = 0;
  const sched = words.map((w, k) => { const s = spans[Math.min(k, spans.length - 1)], o = { c0: c, n: w.length, a: s[0] - .04, b: s[0] - .04 + Math.max(.08, Math.min(s[1] - s[0], w.length / 40)) }; c += w.length + 1; return o; });
  return { ...b, text: L.text, sched };
});
function shownChars(b, t) {
  let n = 0; for (const s of b.sched) { if (t < s.a) break; n = s.c0 + Math.round(s.n * seg(t, s.a, s.b)); if (t >= s.b) n = s.c0 + s.n + 1; }
  return Math.min(n, b.text.length);
}
window.SUBS = [...DIARY.map(d => ({ t0: d.t0, t1: d.t1, text: d.ar })), ...BOXES.map(b => ({ t0: b.t0, t1: Math.min(b.t1, 17), text: b.text }))];

// ———————— shot A: the street ————————
const tiltA = t => Math.round(76 * (1 - eio(seg(t, .15, 1.9))));
const camA = t => Math.round(44 * eio(seg(t, 2.4, 6.0)));
const WALK0 = .8, WALK1 = 5.55, SPEED = 40;
const yX = t => -14 + SPEED * (clamp(t, WALK0, WALK1) - WALK0);
function suitcaseSide(f, hand, gx, gy) {
  // rolling case tilted toward the hand: wheel corner on the ground at (gx, gy)
  const ax = hand[0] - gx, ay = hand[1] - gy, len = Math.hypot(ax, ay), vx = ax / len, vy = ay / len, ux = -vy, uy = vx;
  const Wc = 10, Hc = 14;
  for (let y = gy - 22; y <= gy + 1; y++) for (let x = gx - 14; x <= gx + 14; x++) {
    const dx = x + .5 - gx, dy = y + .5 - gy, u = -(dx * ux + dy * uy), v = dx * vx + dy * vy;
    if (u < 0 || u > Wc || v < 1 || v > Hc + 1) continue;
    const edge = u < 1 || u > Wc - 1 || v < 2 || v > Hc;
    f.px(x, y, edge ? C.ink : (u < 2.6 ? C.scarfL : (Math.round(u) === 5 || Math.round(u) === 8) ? C.scarfD : C.scarf));
  }
  // handle rods to the hand
  const top = [gx + vx * (Hc + 1), gy + vy * (Hc + 1)];
  f.line(top[0], top[1], hand[0], hand[1], C.ink); f.line(top[0] + 1, top[1], hand[0] + 1, hand[1], C.steel);
  f.disc(gx + 1, gy - 1, 1.6, C.ink); f.px(gx + 1, gy - 1, C.steel);
}
function suitcaseUp(f, x, gy, handleTop = 14) {
  f.rect(x - 1, gy - 13, 13, 12, C.ink); f.rect(x, gy - 12, 11, 10, C.scarf); f.rect(x, gy - 12, 2, 10, C.scarfL);
  f.vline(x + 4, gy - 12, gy - 3, C.scarfD); f.vline(x + 7, gy - 12, gy - 3, C.scarfD); f.hline(x, x + 10, gy - 3, C.scarfD);
  f.vline(x + 3, gy - handleTop, gy - 13, C.ink); f.vline(x + 7, gy - handleTop, gy - 13, C.ink); f.hline(x + 3, x + 7, gy - handleTop - 1, C.ink); f.hline(x + 4, x + 6, gy - handleTop, C.steel);
  f.rect(x + 1, gy - 1, 2, 2, C.ink); f.rect(x + 8, gy - 1, 2, 2, C.ink);
}
function shotA(t) {
  const tilt = tiltA(t), cam = camA(t);
  const busX = t > 1.2 && t < 4.6 ? 330 - 140 * (t - 1.2) : null;
  street(fb, t, cam, tilt, busX);
  const gy = ST.ground + tilt;
  // Youssef
  const x = yX(t) - cam;
  let pose = t < WALK1 ? 'walk' + (((Math.floor(t * 8)) % 4 + 4) % 4) : t < 5.8 ? 'idle' : 'lookup';
  let hop = 0; if (t > 6.05 && t < 6.3) { pose = 'hop'; hop = Math.round(Math.sin(seg(t, 6.05, 6.3) * Math.PI) * 4); }
  const rise = pose === 'lookup' && Math.floor(t * 1.4) % 2 ? 1 : 0;
  const s = cached('ys' + pose + rise, () => youssefSide(pose, rise));
  const by = pose.startsWith('walk') && ((Math.floor(t * 8) % 2) === 1) ? -1 : 0;
  suitcaseSide(fb, [Math.round(x + s.hand[0]), gy - hop + s.hand[1] + by * 0], Math.round(x - 22), gy - 1);
  put(fb, s, x, gy - hop);
  if (t > 5.85) balloon(fb, Math.round(x + 2), gy - 36 - hop, '!', seg(t, 5.85, 5.95));
  return { tilt, cam };
}
// title: DAY 1 / LONDON, Bayer-dissolved in and out
const titleFB = new FB();
function title(t) {
  const a = Math.min(seg(t, .25, .6), 1 - seg(t, 2.3, 2.7)); if (a <= 0) return;
  titleFB.clear(T);
  const s1 = 'DAY 1', w1 = textW(s1, 3), col = y => y < 2 ? C.white : y < 4 ? C.yellow : y < 6 ? C.amber : C.orange;
  textOutlined(titleFB, s1, Math.round((W - w1) / 2), 10, col, C.ink, 3);
  const s2 = 'LONDON', w2 = textW(s2, 2);
  textOutlined(titleFB, s2, Math.round((W - w2) / 2), 38, y => y < 3 ? C.white : C.silver, C.ink, 2);
  for (let y = 0; y < 60; y++) for (let x = 0; x < W; x++) { const c = titleFB.d[y * W + x]; if (c !== T && bayer(x, y) < a) ui.d[y * W + x] = c; }
}

// ———————— shot B: the school door ————————
const DOOR = 160, MIA_X = 150, YOU_X = 176, CASE_X = 186;
function shotB(t) {
  const open = eo(seg(t, 7.35, 7.6));
  const { bot } = entrance(fb, t, open, 10);
  const gyB = 131;
  // Mia
  if (t > 7.42) {
    const walk = seg(t, 7.5, 7.95), my = Math.round(bot - 1 + walk * 6);
    const o = { who: 'm', view: 'front', head: 'front', sway: Math.floor(t * 4) % 2 };
    if (walk > 0 && walk < 1) { if (Math.floor(t * 8) % 2) o.legL = -1; else o.legR = -1; }
    if (t > 8.0 && t < 9.45) { o.armL = [-8 + (Math.floor(t * 6) % 2 ? 1 : 0), -9]; o.sway = 1; }
    const puzzled = t >= 14.5;
    if (puzzled) { o.head = flap('mia', t) ? 'frontPuzTalk' : 'frontPuz'; o.tilt = 1; }
    else if (flap('mia', t)) o.head = 'frontTalk';
    if ((t > 10.8 && t < 10.9) || (t > 12.95 && t < 13.05) || (t > 16.0 && t < 16.1)) o.head = 'frontBlink';
    if ((t > 10.55 && t < 10.75) || (t > 13.45 && t < 13.65)) o.bob = 1;
    o.rise = Math.floor(t * .8) % 2;
    const s = cached('m' + JSON.stringify(o), () => figure(o));
    put(fb, s, MIA_X, my);
    if (o.armL) { const k = Math.floor(t * 6) % 2, hx = MIA_X - 9 + (k ? 1 : 0), hy = my - 30;   // wave motion ticks
      fb.px(hx - 3, hy - 1 - k, C.white); fb.px(hx - 4, hy - k, C.white); fb.px(hx + 3, hy - 2 + k, C.white); fb.px(hx + 4, hy - 1 + k, C.white); }
    if (puzzled && t < 16.4) balloon(fb, MIA_X - 1, my - 36, '?', seg(t, 14.55, 14.65));
  }
  // suitcase stands at Youssef's right
  suitcaseUp(fb, CASE_X, gyB);
  // Youssef: back view → recoil → turns to us
  let s, yx = YOU_X, yy = gyB;
  if (t < 15.5) {
    const o = { who: 'y', view: 'back', armR: [7.2, 8] };
    if (t > 11.2 && t < 13.7) o.armL = [-3.5, -7 + (Math.floor(t * 6) % 2)];   // rubs the back of his head: "I... I..."
    if (flap('youssef', t)) o.bob = -1;
    o.rise = Math.floor(t * .8 + .5) % 2;
    if (t > 15.25 && t < 15.5) { o.armR = null; o.armL = [-3.5, -7]; }
    s = cached('y' + JSON.stringify(o), () => figure(o));
    if (t > 15.25 && t < 15.45) { yy -= Math.round(Math.sin(seg(t, 15.25, 15.45) * Math.PI) * 3); yx += Math.round(seg(t, 15.25, 15.45) * 2); }
    else if (t >= 15.45) yx += 2;
  } else if (t < 15.58) { s = cached('yturn', () => youssefSide('idle')); yx += 2; put(fb, s, yx, yy, true); s = null; }
  else {
    const o = { who: 'y', view: 'front', head: 'frontEmb', armL: [-6.5, -11 + (Math.floor(t * 6) % 2)] };
    s = cached('y' + JSON.stringify(o), () => figure(o)); yx += 2;
  }
  if (s) put(fb, s, yx, yy);
  if (t > 15.3) { const k = Math.floor(seg(t, 15.3, 16.9) * 6); sweat(fb, yx + 8, yy - 33 + Math.min(k, 3)); }
}

// ———————— UI layer ————————
function boxAt(t) { return BOXES.find(b => t >= b.t0 && t < b.t1); }
function uiLayer(t) {
  ui.clear(T);
  if (t < 2.8) title(t);
  // status window: confidence (A) and the crash (B)
  if (t > 3.2 && t < 6.75) {
    const sl = eo(seg(t, 3.2, 3.5)) * (1 - seg(t, 6.45, 6.75));
    const n = Math.floor(seg(t, 3.7, 5.0) * 5 + .001);
    const stars = [0, 1, 2, 3, 4].map(i => i < n ? 'on' : 'off');
    statusWin(ui, 4 - Math.round((1 - sl) * 130), 4, portraitY('happy'), stars, t);
  }
  if (t > 15.5) {
    const sl = eo(seg(t, 15.5, 15.75));
    const stars = [0, 1, 2, 3, 4].map(i => { if (i === 0) return 'on'; const k = 4 - i, d = 15.8 + k * .16; return t < d ? 'on' : t < d + .12 ? 'blink' : 'off'; });
    statusWin(ui, 198 + Math.round((1 - sl) * 130), 4, portraitY('embarrassed'), stars, t, t > 15.8);
  }
  // diary box (Arabic is drawn crisp afterwards)
  let diary = null;
  if (t > .55 && t < 7.9) diary = diaryBox(ui, t, eo(seg(t, .55, .8)));
  // dialogue
  const b = boxAt(t);
  if (b) {
    const isMia = b.who === 'mia', shown = shownChars(b, t);
    let portrait;
    if (isMia) portrait = portraitM(b.t0 > 14 ? 'puzzled' : 'smile', flap('mia', t) ? 1 : 0, (t > 10.8 && t < 10.9));
    else portrait = portraitY('nervous', flap('youssef', t) ? 1 : 0);
    dialog(ui, { name: isMia ? 'MIA' : 'YOUSSEF', nameCol: isMia ? C.pink : C.yellow, portrait, text: b.text, shown, done: shown >= b.text.length, t, slide: b === BOXES[0] ? eo(seg(t, 7.95, 8.15)) : 1 });
  }
  return diary;
}

// ———————— compose ————————
function frame(t) {
  fb.clear(C.ink);
  if (t < A_END) shotA(t); else shotB(t);
  const diary = uiLayer(t);
  let lut = LUT.full;
  if (t < .4) lut = darken(lut, 1 - seg(t, 0, .4));
  if (t > FADE_OUT) lut = darken(lut, seg(t, FADE_OUT, 16.95));
  for (let i = 0; i < fb.d.length; i++) u32[i] = lut[fb.d[i]];
  // mosaic cross between the shots (block 1 → 12 → 1, cut at the peak)
  if (t > 6.6 && t < 7.2) mosaic(u32, Math.max(1, Math.round(12 * (1 - Math.abs(t - A_END) / .3))));
  // knock-back shake on "Sorry?"
  if (t > 15.25 && t < 15.5) {
    const k = Math.floor((t - 15.25) * 24), dx = [2, -2, 1, -1, 1, 0][k] || 0, dy = [0, 1, -1, 1, 0, 0][k] || 0;
    const src = u32.slice(); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) u32[y * W + x] = src[clamp(y - dy, 0, H - 1) * W + clamp(x - dx, 0, W - 1)];
  }
  for (let i = 0; i < ui.d.length; i++) if (ui.d[i] !== T) u32[i] = lut[ui.d[i]];
  lg.putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(lo, 0, 0, W * 6, H * 6);
  if (diary) arabic(t, diary);
}
function arabic(t, diary) {
  const d = DIARY.find(d => t >= d.t0 && t < d.t1); if (!d) return;
  const S = 6, right = diary.right * S, cy = (diary.Y + BOX.h / 2) * S + 4;
  ctx.save();
  ctx.font = '700 50px "Baloo Bhaijaan 2"'; ctx.direction = 'rtl'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  const w = ctx.measureText(d.ar).width, p = eo(seg(t, d.t0 + .02, d.t0 + .3));
  const reveal = Math.ceil((w + 12) * p / S) * S;
  ctx.beginPath(); ctx.rect(right - reveal, cy - 70, reveal + 12, 140); ctx.clip();
  ctx.fillStyle = '#181425'; ctx.fillText(d.ar, right + 6, cy + 6);
  ctx.fillStyle = '#ffffff'; ctx.fillText(d.ar, right, cy);
  ctx.restore();
}
window.TEXTS = t => {
  const out = []; const d = DIARY.find(d => t >= d.t0 && t < d.t1); const b = boxAt(t);
  if (b) out.push({ id: 'box' + BOXES.indexOf(b), text: b.text, x0: 48, y0: 804, x1: 1872, y1: 1056 });
  return out;
};
await document.fonts.load('700 50px "Baloo Bhaijaan 2"', 'أول يوم');
window.render = t => frame(t);
window.DUR = TL.dur; window.READY = true;
