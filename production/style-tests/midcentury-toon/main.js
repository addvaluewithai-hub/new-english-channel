// "First Day" — Mid-century Cartoon style test. Page contract: DUR, render(t), READY, EV, TEXTS.
import { PAL, setClock, shape, plane, ink, ellipse, spline, xform, move, rrect, rect, TAU, clamp, lerp, seg, ss, eo, eio, back, twos,
  star, sparkle, rays, kidney, boomerang, text, measure, paperFinish, textures, hash, reg } from './engine/toon.js';
import { person, COL } from './chars.js';

const W = 1920, H = 1080;
const cv = document.getElementById('c'), g = cv.getContext('2d');
await Promise.all(['700 50px "Baloo Bhaijaan 2"', '800 50px "Baloo Bhaijaan 2"', '700 40px Oleo', '40px Slab', '500 40px Jost', '600 40px Jost'].map(f => document.fonts.load(f, f.includes('Baloo') ? 'أول يوم' : 'Hi')));
textures();
const TL = await (await fetch('timeline.json')).json();

// ------------------------------------------------------------------ timing
const T_WIPE = 7.62, T_S2 = 7.98, T_IRIS = 14.75, T_S3 = 15.15, T_OUT = 16.45, DUR = 17;
const AR = [
  { t0: 0.45, t1: 2.45, text: 'أول يوم ليّا في لندن…' },
  { t0: 2.45, t1: 5.6, text: 'وكنت فاكر إن الإنجليزي بتاعي كويس.' },
  { t0: 5.6, t1: 7.95, text: 'لحد ما قابلت ميا.' },
];
const L = TL.lines;
// English bubbles (screen space), held to the line's end + 0.6 s
const BUB = [
  { id: 'mia1', who: 'm', t0: L[0].t0, t1: L[0].t1 + 1.15, text: L[0].text, cx: 520, cy: 196 },
  { id: 'you1', who: 'y', t0: L[1].t0, t1: L[1].t1 + 0.6, text: L[1].text, cx: 1330, cy: 196 },
  { id: 'mia2', who: 'm', t0: L[2].t0, t1: T_OUT + 0.4, text: L[2].text, cx: 470, cy: 196 },
];

// ------------------------------------------------------------------ helpers
const cam = (ctx, c) => { ctx.translate(W / 2, H / 2); ctx.scale(c.z, c.z); ctx.translate(-c.cx, -c.cy); };
const w2s = (x, y, c) => [W / 2 + (x - c.cx) * c.z, H / 2 + (y - c.cy) * c.z];
const pop = (t, t0, d = 0.26) => back(seg(t, t0, t0 + d), 1.9);
function talking(t, who) {
  const name = who === 'm' ? 'mia' : 'youssef';
  for (const [a, b, w] of TL.talk) if (w === name && t >= a && t < b) {
    const f = Math.floor(t * 12 + 1e-6), h = hash(f, who === 'm' ? 3 : 7, 11);
    if (t > b - 1 / 12) return 'mid';
    return h < 0.5 ? 'open' : h < 0.9 ? 'mid' : null;
  }
  return null;
}
const blinkAt = (t, ts) => ts.some(b => t > b && t < b + 0.13) ? 1 : 0;
// keyframed hand target: keys [[t, [x,y]], ...], eased between, evaluated on twos by the caller
function track(t, keys) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t < keys[i][0]) { const [ta, a] = keys[i - 1], [tb, b] = keys[i], u = eio((t - ta) / (tb - ta)); return [lerp(a[0], b[0], u), lerp(a[1], b[1], u)]; }
  return keys[keys.length - 1][1];
}
const pick = (t, keys) => { let v = keys[0][1]; for (const [k, val] of keys) if (t >= k) v = val; return v; };

// ------------------------------------------------------------------ SCENE 1: the street (a truck right on the stand)
const SKY = '#C3D6E6', FAR = '#A9BCD4', FAR2 = '#97ACC8', ROAD = '#A99F8E', PAVE = '#E9DDC3', PAVE_D = '#D8C9AA';
const HC = ['#E8C69C', '#F0B4A8', '#CBD08E', '#F3D37F', '#E6B9A0', '#BFCB9C'];
const DOORS = [PAL.teal, PAL.coral, PAL.plum, PAL.mustardD, PAL.blueD];
const HOUSES = []; { let x = -820, i = 0; while (x < 2180) { const w = Math.min([290, 310, 270, 330][i % 4], 2180 - x); HOUSES.push({ x, w, top: 392 + (i * 37) % 46, col: HC[i % HC.length], door: DOORS[i % DOORS.length], tilt: ((i * 5) % 7 - 3) * 2.2, i }); x += w; i++; } }
const SCHOOL = { x0: 2180, x1: 2980, top: 170, door: 2600 };
function walkX(t) { if (t < 5.6) return 260 + 300 * t; const u = clamp((t - 5.6) / 0.7); return 260 + 1680 + 210 * (u - u * u / 2); }
const WALK_END = walkX(9);
function cam1(t) { return { cx: 960 + 1345 * eio(seg(t, 0, 6.9)), cy: 540, z: 1 }; }
function busX(t) { return 3420 - 760 * (t - 1.6); }

function window1(ctx, x, y, w, h, seed, glass = '#6F8DB3') {
  shape(ctx, rect(x - 7, y - 7, w + 14, h + 14), { fill: PAL.white, line: 3, seed, grain: 0.1, breaks: 0.25 });
  shape(ctx, rect(x, y, w, h), { fill: glass, line: 0, seed: seed + 1, grain: 0.25, shade: [{ pts: [[x, y], [x + w * 0.45, y], [x, y + h * 0.6]], color: '#8FA9CA', alpha: 0.8 }] });
  ink(ctx, [[x + w / 2, y], [x + w / 2, y + h]], 3.2, { seed: seed + 2, taper: false, color: PAL.white, lk: 1 });
  ink(ctx, [[x, y + h * 0.5], [x + w, y + h * 0.5]], 3.2, { seed: seed + 3, taper: false, color: PAL.white, lk: 1 });
}
function house(ctx, h) {
  const { x, w, top, col, tilt, i } = h, s = 400 + i * 20;
  // chimney stack + pots
  const cxh = x + w * 0.68;
  shape(ctx, rect(cxh, top - 58, 54, 70), { fill: col, line: 3.2, seed: s, grain: 0.3, shade: [{ pts: rect(cxh + 34, top - 70, 30, 90), color: PAL.ink, alpha: 0.12 }] });
  [8, 30].forEach((dx, k) => shape(ctx, rect(cxh + dx, top - 76, 14, 20), { fill: PAL.coralD, line: 2.6, seed: s + 1 + k, grain: 0.1 }));
  shape(ctx, [[x, top + tilt], [x + w, top - tilt], [x + w, 724], [x, 724]], { fill: col, line: 3.6, seed: s + 3, grain: 0.35, breaks: 0.22 });
  shape(ctx, [[x - 8, top + tilt - 10], [x + w + 8, top - tilt - 10], [x + w + 8, top - tilt + 12], [x - 8, top + tilt + 12]], { fill: PAL.white, line: 3, seed: s + 4, grain: 0.1, breaks: 0.3 });
  window1(ctx, x + 44, top + 56, 66, 96, s + 5);
  window1(ctx, x + w - 112, top + 56, 66, 96, s + 9);
  window1(ctx, x + w - 118, 724 - 168, 76, 92, s + 13);
  // door with a fanlight and a step
  const dx = x + 46, dw = 74, dy = 724 - 156;
  shape(ctx, ellipse(dx + dw / 2, dy, dw / 2 + 6, 30, 20, Math.PI, TAU), { fill: PAL.white, line: 3, seed: s + 17, grain: 0.05 });
  shape(ctx, rect(dx, dy, dw, 150), { fill: h.door, line: 3.4, seed: s + 18, grain: 0.3, shade: [{ pts: rect(dx + dw * 0.55, dy, dw, 150), color: PAL.ink, alpha: 0.15 }] });
  shape(ctx, ellipse(dx + dw - 14, dy + 80, 4, 4, 8), { fill: PAL.mustard, line: 0, grain: 0, off: [0, 0] });
  shape(ctx, rect(dx - 10, 714, dw + 20, 12), { fill: PAL.paperD, line: 2.6, seed: s + 19, grain: 0.1 });
  // railings
  for (let rx = x + dw + 70; rx < x + w - 10; rx += 22) ink(ctx, [[rx, 676], [rx, 724]], 2.4, { seed: s + rx, taper: false });
  ink(ctx, [[x + dw + 62, 680], [x + w - 8, 680]], 2.6, { seed: s + 31, taper: false, breaks: 0.2 });
}
function school(ctx, t) {
  const { x0, x1, top, door } = SCHOOL, s = 600;
  shape(ctx, [[x0, top + 6], [x1, top], [x1, 724], [x0, 724]], { fill: '#F6EBD6', line: 4, seed: s, grain: 0.3, breaks: 0.18, shade: [{ pts: [[x1 - 70, 0], [x1 + 20, 0], [x1 + 20, 740], [x1 - 70, 740]], color: PAL.paperDD, alpha: 0.7 }] });
  shape(ctx, [[x0 - 14, top - 8], [x1 + 14, top - 14], [x1 + 14, top + 16], [x0 - 14, top + 22]], { fill: PAL.white, line: 3.4, seed: s + 1, grain: 0.1, breaks: 0.25 });
  // sign band: ENGLISH SCHOOL, two-plate slab lettering
  shape(ctx, rrect(x0 + 40, top + 44, x1 - x0 - 80, 94, 10), { fill: PAL.white, line: 4, seed: s + 2, grain: 0.12, off: [6, 5] });
  text(ctx, 'ENGLISH SCHOOL', (x0 + x1) / 2, top + 112, { font: '54px Slab', fill: PAL.ink, plate: PAL.coral, off: [5, 4], align: 'center', track: 3 });
  star(ctx, x0 + 76, top + 91, 18, { n: 8, inner: 0.4, fill: PAL.coral, off: [0, 0], rot: t * 0.8 });
  star(ctx, x1 - 76, top + 91, 18, { n: 8, inner: 0.4, fill: PAL.coral, off: [0, 0], rot: -t * 0.8 });
  // windows
  [x0 + 60, x0 + 190, x1 - 250, x1 - 120].forEach((wx, i) => { window1(ctx, wx, top + 190, 70, 120, s + 10 + i * 4); if (wx < door - 200 || wx > door + 200) window1(ctx, wx, top + 380, 70, 120, s + 30 + i * 4); });
  // portico: pediment, two columns, steps, a double door that opens on 7.4
  const dl = door - 92, dr = door + 92;
  shape(ctx, [[dl - 70, 386], [door, 318], [dr + 70, 386]], { fill: PAL.white, line: 3.6, seed: s + 50, grain: 0.1 });
  const open = t >= TL.beats.mia_appears;
  shape(ctx, rect(dl, 400, dr - dl, 296), { fill: open ? '#4E4257' : PAL.teal, line: 3.6, seed: s + 51, grain: 0.3 });
  if (!open) { ink(ctx, [[door, 404], [door, 694]], 3, { seed: s + 52 }); [door - 14, door + 14].forEach((k, i) => shape(ctx, ellipse(k, 560, 5, 5, 8), { fill: PAL.mustard, line: 0, grain: 0, off: [0, 0] })); }
  else { shape(ctx, [[dl, 400], [dl + 34, 414], [dl + 34, 690], [dl, 696]], { fill: PAL.teal, line: 3, seed: s + 53, grain: 0.2 }); shape(ctx, [[dr, 400], [dr - 34, 414], [dr - 34, 690], [dr, 696]], { fill: PAL.tealD, line: 3, seed: s + 54, grain: 0.2 }); }
  [dl - 52, dr + 16].forEach((cx, i) => shape(ctx, rect(cx, 386, 36, 312), { fill: PAL.white, line: 3.4, seed: s + 60 + i, grain: 0.1, shade: [{ pts: rect(cx + 22, 380, 20, 330), color: PAL.paperD, alpha: 1 }] }));
  shape(ctx, rect(dl - 80, 696, dr - dl + 160, 14), { fill: PAL.paperD, line: 3, seed: s + 70, grain: 0.1 });
  shape(ctx, rect(dl - 100, 710, dr - dl + 200, 16), { fill: PAL.paperDD, line: 3, seed: s + 71, grain: 0.1 });
}
function farSkyline(ctx, t, px) {
  // lineless planes one step darker than the sky, a far clock tower and a dome; parallax 0.4
  ctx.save(); ctx.translate(-px, 0);
  [[-200, 230, 470], [80, 170, 420], [330, 250, 455], [700, 150, 400], [1350, 240, 440], [1700, 200, 380], [2050, 280, 450], [2400, 200, 410]].forEach(([x, w, top], i) =>
    plane(ctx, [[x, top], [x + w, top + (i % 2 ? 6 : -6)], [x + w, 730], [x, 730]], i % 2 ? FAR : FAR2, { grain: 0.2 }));
  // dome
  plane(ctx, ellipse(1560, 360, 110, 100, 30, Math.PI, TAU), FAR2, { grain: 0.2 });
  plane(ctx, rect(1440, 358, 240, 380), FAR2);
  plane(ctx, [[1548, 262], [1572, 262], [1566, 230], [1554, 230]], FAR2);
  // clock tower
  const tx = 1080;
  plane(ctx, rect(tx - 46, 200, 92, 540), FAR2, { grain: 0.25 });
  shape(ctx, rect(tx - 60, 120, 120, 120), { fill: FAR2, line: 2.6, seed: 210, grain: 0.25, breaks: 0.45, off: [0, 0] });
  shape(ctx, [[tx - 66, 122], [tx, 18], [tx + 66, 122]], { fill: '#8599B6', line: 2.6, seed: 211, grain: 0.2, breaks: 0.4, off: [0, 0] });
  ink(ctx, [[tx, 18], [tx, -6]], 3, { seed: 212 });
  shape(ctx, ellipse(tx, 180, 42, 42, 32), { fill: PAL.white, line: 3, seed: 213, grain: 0.05 });
  const mh = -Math.PI / 2 + (t * 0.25), hh = -Math.PI / 2 - 1.2;
  ink(ctx, [[tx, 180], [tx + Math.cos(mh) * 32, 180 + Math.sin(mh) * 32]], 3.4, { seed: 214 });
  ink(ctx, [[tx, 180], [tx + Math.cos(hh) * 22, 180 + Math.sin(hh) * 22]], 4.2, { seed: 215 });
  for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; shape(ctx, ellipse(tx + Math.cos(a) * 34, 180 + Math.sin(a) * 34, 2.6, 2.6, 6), { fill: PAL.ink, line: 0, grain: 0, off: [0, 0] }); }
  for (let k = 0; k < 5; k++) ink(ctx, [[tx - 28, 280 + k * 80], [tx - 28, 330 + k * 80]], 2.4, { seed: 220 + k, color: '#7D90AC', taper: false });
  ctx.restore();
}
function bus(ctx, x, y, t) {
  // a red double-decker, facing left; (x,y) = front bottom
  const b = y - (Math.floor(t * 12) % 2) * 2, R = '#CF4B3B', RD = '#A8382C', s = 800;
  ctx.save(); ctx.translate(x, b);
  shape(ctx, rrect(0, -340, 600, 310, 28), { fill: R, line: 4.2, seed: s, grain: 0.3, breaks: 0.12, shade: [{ pts: rect(0, -96, 640, 80), color: RD, alpha: 1 }] });
  shape(ctx, rect(6, -186, 588, 18), { fill: PAL.white, line: 2.8, seed: s + 1, grain: 0.1 });
  for (let i = 0; i < 6; i++) window1(ctx, 40 + i * 90, -306, 66, 76, s + 10 + i * 4, '#5B789E');
  window1(ctx, 18, -164, 84, 100, s + 40, '#5B789E');
  for (let i = 0; i < 4; i++) window1(ctx, 150 + i * 106, -156, 80, 64, s + 50 + i * 4, '#5B789E');
  shape(ctx, rect(24, -332, 100, 20), { fill: PAL.ink, line: 0, seed: s + 70, grain: 0.1 });
  shape(ctx, ellipse(10, -50, 10, 8, 10), { fill: PAL.mustardL, line: 2.4, seed: s + 71, grain: 0 });
  [116, 480].forEach((wx, i) => { shape(ctx, ellipse(wx, -24, 38, 38, 24), { fill: PAL.ink, line: 0, seed: s + 80 + i, grain: 0.1, off: [0, 0] }); shape(ctx, ellipse(wx, -24, 15, 15, 14), { fill: PAL.chrome, line: 2.4, seed: s + 82 + i, grain: 0 }); });
  ctx.restore();
}
function scene1(ctx, t) {
  const tt = twos(t), c = cam1(t);
  // sky + sun (fixed to the stand) + clouds
  ctx.fillStyle = SKY; ctx.fillRect(0, 0, W, H);
  const sx = 1690 - (c.cx - 960) * 0.05;
  rays(ctx, sx, 120, 30, 2400, PAL.white, { rot: t * 0.03, alpha: 0.22 });
  shape(ctx, ellipse(sx, 120, 66, 66, 40), { fill: PAL.white, line: 0, grain: 0.1, off: [0, 0] });
  [[260, 170, 1.0], [880, 110, 0.8], [1460, 230, 0.9], [2100, 150, 1.1]].forEach(([x, y, k], i) => {
    const X = ((x - (c.cx - 960) * 0.15 + t * 8) % 2600 + 2600) % 2600 - 300;
    plane(ctx, kidney(X, y, 92 * k, 0.05 * i), PAL.white, { grain: 0.1, alpha: 0.9 });
  });
  for (let i = 0; i < 4; i++) { const tw = hash(Math.floor(t * 6), i, 4) > 0.4 ? 1 : 0.55; sparkle(ctx, [520, 1180, 1500, 300][i] - (c.cx - 960) * 0.1, [80, 300, 70, 340][i], 22 * tw, { fill: PAL.white, alpha: 0.9 }); }
  farSkyline(ctx, t, (c.cx - 960) * 0.4);
  ctx.save(); cam(ctx, c);
  const vis = (x0, x1) => x1 > c.cx - W / 2 - 100 && x0 < c.cx + W / 2 + 100;
  // far pavement, houses, school
  plane(ctx, rect(-1200, 716, 5200, 30), PAVE_D);
  for (const h of HOUSES) if (vis(h.x, h.x + h.w)) house(ctx, h);
  if (vis(SCHOOL.x0, SCHOOL.x1)) school(ctx, t);
  // lamp posts on the far kerb
  [400, 1300, 2100].forEach((lx, i) => { if (!vis(lx - 40, lx + 40)) return; ink(ctx, [[lx, 744], [lx, 520]], 7, { seed: 240 + i, taper: false }); shape(ctx, [[lx - 22, 520], [lx + 22, 520], [lx + 14, 486], [lx - 14, 486]], { fill: PAL.mustardL, line: 3, seed: 243 + i, grain: 0.1 }); shape(ctx, [[lx - 26, 488], [lx, 470], [lx + 26, 488]], { fill: PAL.ink, line: 0, seed: 246 + i, off: [0, 0], grain: 0 }); });
  // Mia appears in the school door (7.4)
  if (t >= TL.beats.mia_appears) {
    const k = pop(t, TL.beats.mia_appears, 0.3);
    star(ctx, SCHOOL.door, 560, 150 * k, { n: 14, inner: 0.72, fill: PAL.mustardL, off: [0, 0], rot: t * 0.5, alpha: 0.9 });
    ctx.save(); ctx.translate(SCHOOL.door, 708); ctx.scale(1, lerp(0.8, 1, k)); ctx.translate(-SCHOOL.door, -708);
    person(ctx, { who: 'm', x: SCHOOL.door, y: 708, s: 0.44, dir: -1, face: 'happy', armF: { tg: [104, -520], kind: 'open' } }, tt);
    ctx.restore();
    sparkle(ctx, SCHOOL.door + 120, 440, 30 * k, { fill: PAL.white });
    sparkle(ctx, SCHOOL.door - 130, 500, 22 * k, { fill: PAL.white });
  }
  // road + bus
  plane(ctx, rect(-1200, 744, 5200, 70), ROAD);
  for (let x = -1200; x < 4000; x += 160) if (vis(x, x + 80)) ink(ctx, [[x, 780], [x + 80, 780]], 5, { seed: 250 + x, color: PAL.white, taper: false, wob: 0.1 });
  const bx = busX(t); if (vis(bx, bx + 600)) bus(ctx, bx, 806, t);
  // near pavement with joints and a broken kerb line
  plane(ctx, rect(-1200, 812, 5200, 400), PAVE);
  ink(ctx, [[-1200, 814], [4200, 814]], 4.5, { seed: 260, breaks: 0.3, taper: false });
  for (let x = -1200; x < 4200; x += 230) if (vis(x - 40, x + 40)) ink(ctx, [[x, 830], [x - 26, 1080]], 2.6, { seed: 270 + x, color: PAVE_D, taper: false, breaks: 0.3 });
  // Youssef walks in with the suitcase
  const yx = walkX(tt), dist = yx - 260, amp = 1 - ss(seg(tt, 5.95, 6.3));
  const phase = dist / ((WALK_END - 260) / 14) * Math.PI;
  const proud = ss(seg(tt, 3.1, 3.34)) - ss(seg(tt, 4.62, 4.86));
  const swing = 1.5 - 0.32 * Math.sin(phase) * amp;
  const swA = { a1: swing, a2: swing - 0.18 };
  const lapel = { tg: [26, -356], kind: 'grip' };
  let armF = proud > 0.5 ? lapel : swA;
  if (proud > 0 && proud < 1) armF = proud > 0.5 ? lapel : swA;     // one in-between on twos
  if (proud > 0.2 && proud < 0.8) armF = { tg: [60, -300], kind: 'open' };
  const face = pick(tt, [[0, 'smile'], [3.1, 'proud'], [4.75, 'smile'], [6.3, 'nervous'], [7.3, 'wow']]);
  const look = tt < 2.6 ? [3, -4] : tt > 6.3 ? [4, -2] : [3, 0];
  person(ctx, { who: 'y', x: yx, y: 936, s: 0.64, dir: 1, face, look, blink: blinkAt(t, [1.9, 5.2, 6.9]), walk: phase, walkAmp: amp,
    armF, case: { wheel: [-252, 0], lean: 0.46 * amp + 0.12 * (1 - amp), grip: [-128, -226] }, tilt: tt > 3.1 && tt < 4.75 ? -0.05 : 0 }, tt);
  ctx.restore();
  return { c, head: w2s(yx + 10 * 0.64, 936 - 480 * 0.64, c) };
}

// ------------------------------------------------------------------ SCENE 2: the doorstep two-shot (slow push)
const WALL = '#C7D6E6', FLOOR = '#90A8C6', WALL_D = '#B4C6DC';
function cam2(t) { const u = ss(seg(t, T_S2, T_IRIS)); return { cx: lerp(960, 1030, u), cy: lerp(540, 520, u), z: lerp(1.0, 1.075, u) }; }
const MIA2 = { x: 560, y: 905 }, YOU2 = { x: 1310, y: 905 };
function scene2(ctx, t) {
  const tt = twos(t), c = cam2(t);
  ctx.save(); cam(ctx, c);
  ctx.fillStyle = WALL; ctx.fillRect(-400, -400, 2800, 1900);
  plane(ctx, kidney(1260, 430, 430, -0.08), WALL_D, { grain: 0.2 });
  plane(ctx, rect(-400, 862, 2800, 600), FLOOR);
  ink(ctx, [[-300, 862], [2300, 862]], 4.5, { seed: 500, breaks: 0.35, taper: false });
  for (let i = 0; i < 3; i++) { const tw = hash(Math.floor(t * 6), i, 9) > 0.45 ? 1 : 0.6; sparkle(ctx, [1640, 1820, 1050][i], [180, 330, 120][i], 26 * tw, { fill: PAL.white }); }
  // the school doorway (one prop)
  shape(ctx, rect(368, 196, 412, 666), { fill: '#4E4257', line: 0, seed: 510, grain: 0.3, off: [0, 0] });
  shape(ctx, [[368, 760], [780, 760], [780, 862], [368, 862]], { fill: '#66566E', line: 0, seed: 511, grain: 0.2, off: [0, 0] });
  shape(ctx, [[700, 214], [780, 198], [780, 862], [700, 840]], { fill: PAL.teal, line: 3.6, seed: 512, grain: 0.3, shade: [{ pts: rect(740, 190, 50, 680), color: PAL.tealD, alpha: 0.7 }] });
  shape(ctx, ellipse(716, 540, 6, 6, 10), { fill: PAL.mustard, line: 2, seed: 513, grain: 0 });
  [[300, 360], [780, 840]].forEach(([a, b], i) => shape(ctx, rect(a, 196, b - a, 666), { fill: PAL.white, line: 4, seed: 520 + i, grain: 0.15, breaks: 0.2, shade: [{ pts: rect(a + (b - a) * 0.62, 190, 40, 680), color: PAL.paperD, alpha: 1 }] }));
  shape(ctx, rect(262, 112, 616, 90), { fill: PAL.white, line: 4, seed: 530, grain: 0.12, breaks: 0.15 });
  star(ctx, 570, 157, 30, { n: 12, inner: 0.55, fill: PAL.coral, off: [0, 0], rot: t * 0.4 });
  shape(ctx, rrect(872, 380, 220, 116, 12), { fill: PAL.mustardL, line: 4, seed: 532, grain: 0.2, off: reg(532, 0.7) });
  text(ctx, 'ENGLISH', 982, 430, { font: '34px Slab', fill: PAL.ink, plate: PAL.white, off: [3, 3], align: 'center', track: 2 });
  text(ctx, 'SCHOOL', 982, 474, { font: '34px Slab', fill: PAL.ink, plate: PAL.white, off: [3, 3], align: 'center', track: 2 });
  shape(ctx, rect(250, 862, 640, 30), { fill: PAL.paperD, line: 3.4, seed: 531, grain: 0.15 });
  // planter
  [[1716, 700, -0.5, 120], [1782, 640, 0.2, 140], [1840, 720, 0.8, 110]].forEach(([x, y, r, s], i) => shape(ctx, boomerang(x, y, s, r - 1.2), { fill: i === 1 ? PAL.avocadoD : PAL.avocado, line: 3.4, seed: 540 + i, grain: 0.3 }));
  shape(ctx, [[1700, 770], [1880, 770], [1852, 906], [1728, 906]], { fill: PAL.coral, line: 4, seed: 545, grain: 0.3, shade: [{ pts: rect(1810, 760, 80, 160), color: PAL.coralD, alpha: 0.6 }] });
  // ---- Mia
  const mWave = [[7.98, [48, -200]], [8.04, [40, -214]], [8.16, [56, -228]], [8.3, [150, -530]], [8.47, [176, -510]], [8.64, [138, -548]], [8.81, [176, -510]], [8.98, [138, -548]], [9.15, [176, -510]], [9.32, [150, -530]], [9.75, [48, -200]],
    [14.2, [48, -200]], [14.42, [96, -300]]];
  const mTg = track(tt, mWave);
  const mKind = tt > 8.2 && tt < 9.5 ? 'open' : tt >= 14.3 ? 'open' : 'open';
  const mRot = tt >= 14.3 ? -1.0 : 0;
  const mFace = pick(tt, [[0, 'smile'], [8.0, 'happy'], [9.75, 'smile'], [14.25, 'puzzled']]);
  const mTilt = lerp(0, -0.1, ss(seg(tt, 14.25, 14.45))) + (tt > 10.15 && tt < 10.45 ? 0.05 : 0);
  person(ctx, { who: 'm', x: MIA2.x, y: MIA2.y, s: 1.0, S: c.z, dir: 1, face: mFace, mouth: talking(t, 'm'), look: tt > 9.8 ? [4, 0] : [3, -1],
    blink: blinkAt(t, [10.8, 12.9, 14.05]), armF: { tg: mTg, kind: mKind, rot: mRot }, tilt: mTilt, ponyKick: tt > 8.3 && tt < 9.3 ? 0.05 * Math.sin(tt * 18) : 0 }, tt);
  // "?" pops beside Mia on "Sorry?"
  if (t >= L[2].t0) { const k = pop(t, L[2].t0, 0.28); ctx.save(); ctx.translate(410, 300); ctx.scale(k, k); ctx.rotate(-0.15 + 0.06 * Math.sin(tt * 9));
    star(ctx, 0, -34, 62, { n: 12, inner: 0.7, fill: PAL.mustardL, off: [0, 0] }); text(ctx, '?', 0, 0, { font: '96px Slab', fill: PAL.ink, plate: PAL.coral, off: [5, 4], align: 'center' }); ctx.restore(); }
  // ---- Youssef
  const yKeys = [[7.98, [52, -196]], [9.9, [52, -196]], [10.05, [80, -260]], [10.2, [170, -400]], [10.36, [178, -420]], [10.5, [166, -396]], [10.72, [60, -220]],
    [10.95, [52, -220]], [11.12, [18, -350]], [13.6, [18, -350]], [13.95, [52, -196]]];
  const yTg = track(tt, yKeys);
  const yKind = tt > 10.05 && tt < 10.7 ? 'open' : tt > 11.05 && tt < 13.8 ? 'flat' : 'open';
  const yRot = tt > 11.05 && tt < 13.8 ? -0.5 : tt > 10.12 && tt < 10.66 ? -1.1 : 0;
  const yFace = pick(tt, [[0, 'smile'], [8.2, 'happy'], [9.6, 'smile'], [10.75, 'nervous'], [12.45, 'smile'], [14.6, 'oops']]);
  const yLook = tt > 10.9 && tt < 12.4 ? [1, 4] : tt >= 14.6 ? [-2, 3] : [4, -1];
  const sweat = [{ x: 74, y: -548 + 14 * ss(seg(tt, 11.4, 12.6)), k: pop(t, 11.4) * (1 - ss(seg(t, 12.6, 12.8))) }];
  person(ctx, { who: 'y', x: YOU2.x, y: YOU2.y, s: 1.0, S: c.z, dir: -1, face: yFace, mouth: talking(t, 'y'), look: yLook,
    blink: blinkAt(t, [8.9, 12.0, 13.95]), armF: { tg: yTg, kind: yKind, rot: yRot }, case: { wheel: [-156, 0], lean: 0.04, grip: [-150, -246], bend: 1 },
    tilt: tt >= 14.6 ? 0.06 : 0, sweat, drop: tt >= 14.6 ? 6 : 0 }, tt);
  ctx.restore();
  return { c, head: w2s(YOU2.x - 10, YOU2.y - 482, c), mia: w2s(MIA2.x + 30, MIA2.y - 596, c), you: w2s(YOU2.x - 30, YOU2.y - 600, c) };
}

// ------------------------------------------------------------------ SCENE 3: close-up, the cel of embarrassment
const CU = { x: 1190, y: 1640, s: 2.6, ground: '#F2B8A6', rays: '#E5937F' };
function cam3(t) { const u = ss(seg(t, T_S3, DUR)); return { cx: 960 + 30 * u, cy: 540 - 10 * u, z: lerp(1.0, 1.04, u) }; }
function scene3(ctx, t) {
  const tt = twos(t), c = cam3(t);
  ctx.save(); cam(ctx, c);
  ctx.fillStyle = CU.ground; ctx.fillRect(-200, -200, 2400, 1500);
  const hx = CU.x - 10 * CU.s, hy = CU.y - 482 * CU.s;
  rays(ctx, hx, hy, 30, 2600, CU.rays, { rot: t * 0.06, alpha: 0.55 });
  const drop = 16 * ss(seg(tt, T_S3 + 0.08, T_S3 + 0.3));
  const scr = track(tt, [[T_S3, [-44, -210]], [T_S3 + 0.12, [-50, -260]], [T_S3 + 0.34, [-64, -540]]]);
  const scratch = tt > T_S3 + 0.42 ? [scr[0] + ((Math.floor(tt * 12) % 2) ? 6 : -6), scr[1] + ((Math.floor(tt * 12) % 2) ? -8 : 4)] : scr;
  const sweat = [
    { x: 76, y: -540 + 26 * ss(seg(tt, 15.45, 16.4)), k: pop(t, 15.45), r: 0 },
    { x: 60, y: -580 + 18 * ss(seg(tt, 15.85, 16.6)), k: pop(t, 15.85) * 0.8, r: 0.2 },
  ];
  person(ctx, { who: 'y', x: CU.x, y: CU.y, s: CU.s, S: CU.s * c.z, dir: -1, face: 'oops', look: [-4, 4], blink: blinkAt(t, [16.1]),
    armB: { tg: scratch, kind: 'scratch', rot: 0.3, bend: -1 }, backArmFront: true, armF: { tg: [52, -196] },
    blush: ss(seg(tt, T_S3 + 0.1, T_S3 + 0.6)), sweat, drop, shadow: false }, tt);
  ctx.restore();
  return { c, head: w2s(hx, hy + drop * CU.s, c) };
}

// ------------------------------------------------------------------ overlays: English bubbles, Arabic caption card
function bubblePts(x, y, w, h, r, tip) {
  const R = rrect(x, y, w, h, r, 6), n = 7;            // 4 corners × 7 points: TR, BR, BL, TL
  const bx = clamp(tip[0], x + r + 30, x + w - r - 30), hw = 24;
  return [...R.slice(0, 2 * n), [bx + hw, y + h], tip, [bx - hw, y + h], ...R.slice(2 * n)];
}
const BUB_FONT = '600 64px Jost';
function bubbleBox(ctx, b) { const w = measure(ctx, b.text, BUB_FONT) + 116, h = 118; return { x: b.cx - w / 2, y: b.cy - h / 2, w, h }; }
function bubble(ctx, t, b, tip) {
  const kin = back(seg(t, b.t0, b.t0 + 0.26), 1.9), kout = 1 - ss(seg(t, b.t1 - 0.12, b.t1 + 0.08));
  if (kin <= 0 || kout <= 0) return;
  const { x, y, w, h } = bubbleBox(ctx, b), col = b.who === 'm' ? PAL.mustard : PAL.blue;
  const pts = bubblePts(x, y, w, h, 46, tip);
  ctx.save(); ctx.globalAlpha = kout; ctx.translate(b.cx, b.cy); ctx.scale(kin, kin); ctx.translate(-b.cx, -b.cy);
  shape(ctx, move(pts, 12, 12), { fill: col, line: 0, seed: 900, grain: 0.3, off: [0, 0] });
  shape(ctx, pts, { fill: PAL.white, line: 4.2, seed: 901, grain: 0.12, breaks: 0.08, off: reg(901, 0.6) });
  text(ctx, b.text, b.cx, y + h / 2 + 22, { font: BUB_FONT, fill: PAL.ink, align: 'center' });
  // name tab in the 1950s script
  const nm = b.who === 'm' ? 'Mia' : 'Youssef', nf = '700 34px Oleo', nw = measure(ctx, nm, nf) + 36;
  shape(ctx, rrect(x + 34, y - 26, nw, 46, 20), { fill: col, line: 3.2, seed: 902, grain: 0.2, off: reg(902, 0.5) });
  text(ctx, nm, x + 34 + nw / 2, y + 8, { font: nf, fill: PAL.ink, align: 'center' });
  ctx.restore();
}
const CAP_FONT = '700 50px "Baloo Bhaijaan 2"';
function caption(ctx, t) {
  const cue = AR.find(s => t >= s.t0 && t < s.t1); if (!cue) return;
  const a = Math.min(ss(seg(t, cue.t0, cue.t0 + 0.16)), 1 - ss(seg(t, cue.t1 - 0.16, cue.t1)));
  ctx.save(); ctx.font = CAP_FONT; ctx.direction = 'rtl'; const tw = ctx.measureText(cue.text).width; ctx.restore();
  const w = tw + 150, h = 84, x = W / 2 - w / 2, y = H - 52 - h;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(0, (1 - a) * 10);
  shape(ctx, move(rrect(x, y, w, h, 14), 7, 7), { fill: PAL.coral, line: 0, seed: 910, grain: 0.3, off: [0, 0] });
  shape(ctx, rrect(x, y, w, h, 14), { fill: PAL.white, line: 3.2, seed: 911, grain: 0.15, breaks: 0.08, off: [4, 4] });
  star(ctx, x + 34, y + h / 2, 15, { n: 8, inner: 0.4, fill: PAL.coral, off: [0, 0], rot: t * 0.8 });
  star(ctx, x + w - 34, y + h / 2, 15, { n: 8, inner: 0.4, fill: PAL.coral, off: [0, 0], rot: -t * 0.8 });
  ctx.font = CAP_FONT; ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = PAL.ink;
  ctx.fillText(cue.text, W / 2, y + h / 2 + 18);
  ctx.restore();
}

// ------------------------------------------------------------------ the film
function renderFilm(ctx, t) {
  setClock(t);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  let tips = {}, irisC = null;
  if (t < T_WIPE) { scene1(ctx, t); }
  else if (t < T_S2) {
    // colour-block wipe: the next page slides in from the right with a coral block on its edge
    scene1(ctx, t);
    const k = eio(seg(t, T_WIPE, T_S2)), ex = W * (1 - k);
    ctx.save(); ctx.beginPath(); ctx.rect(ex, 0, W, H); ctx.clip(); const r = scene2(ctx, T_S2 + 1e-3); ctx.restore();
    ctx.save(); ctx.fillStyle = PAL.coral; ctx.fillRect(ex - 90, 0, 90, H); ctx.restore();
    ink(ctx, [[ex - 90, -10], [ex - 90, H + 10]], 5, { seed: 962, taper: false });
    ink(ctx, [[ex, -10], [ex, H + 10]], 6, { seed: 963, taper: false });
  }
  else if (t < T_IRIS) { const r = scene2(ctx, t); tips = { m: r.mia, y: r.you }; }
  else if (t < T_S3) {
    // iris from Youssef's head into the close-up (circle to circle)
    const r2 = scene2(ctx, t); tips = { m: r2.mia, y: r2.you };
    const k = eio(seg(t, T_IRIS, T_S3)), r3h = scene3Head();
    const cx = lerp(r2.head[0], r3h[0], k), cy = lerp(r2.head[1], r3h[1], k), R = lerp(60, 1500, k * k);
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip(); scene3(ctx, T_S3 + 1e-3); ctx.restore();
    ink(ctx, ellipse(cx, cy, R, R, 90), 7, { closed: true, seed: 960 });
    tips.m = [lerp(r2.mia[0], -60, k), lerp(r2.mia[1], 300, k)];
  }
  else { const r = scene3(ctx, t); irisC = r.head; tips = { m: [-60, 300] }; }
  // English bubbles
  for (const b of BUB) if (t >= b.t0 && t < b.t1 + 0.1) bubble(ctx, t, b, tips[b.who] || [b.cx, b.cy + 200]);
  // iris-out on Youssef's face
  if (t >= T_OUT && irisC) {
    const k = eio(seg(t, T_OUT, DUR - 0.02)), R = lerp(1500, 0, k);
    ctx.save(); ctx.fillStyle = PAL.ink; ctx.beginPath(); ctx.rect(-10, -10, W + 20, H + 20); if (R > 0.5) ctx.arc(irisC[0], irisC[1], R, 0, TAU, true); ctx.fill(); ctx.restore();
    if (R > 2) ink(ctx, ellipse(irisC[0], irisC[1], R, R, 90), 5, { closed: true, color: PAL.paper, seed: 950 });
  }
  paperFinish(ctx, W, H, 1);
  caption(ctx, t);
}
function scene3Head() { const c = cam3(T_S3); return w2s(CU.x - 10 * CU.s, CU.y - 482 * CU.s, c); }

window.DUR = DUR;
window.EV = [];
window.SRT = [...AR, ...L.map(l => ({ t0: l.t0, t1: l.t1 + 0.6, text: l.text }))];
window.TEXTS = t => {
  const out = [];
  for (const b of BUB) if (t >= b.t0 + 0.26 && t < b.t1 - 0.12) { const r = bubbleBox(g, b); out.push({ id: b.id, text: b.text, x0: r.x, y0: r.y, x1: r.x + r.w, y1: r.y + r.h }); }
  return out;
};
window.render = t => { renderFilm(g, t); };
window.READY = true;
