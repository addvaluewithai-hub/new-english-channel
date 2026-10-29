// world.js: cached watercolour backgrounds (London street in three parallax layers, the school front stage)
// and the living props that breathe on the beat (sun, lamp posts, the bus, the school door).
// wash / grain / cached-canvas helpers adapted from the library rubber-hose demo (bg.js).
import * as T from './toon.js';
import { P, pieEye, mouth, fillLocal, ribbon } from './parts.js';
import { mulberry, lerp, TAU } from '/core/lib.js';
const { shape, stroke, ell, arc, rr, rect, spline, quad, push, pop, translate, rotate, scale, S } = T;

export function wash(pts, col, o = {}) {
  const g = T.g, Pth = shape(pts, { fill: col, stroke: false, boil: 0 });
  const rnd = mulberry(o.seed ?? 7);
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.clip(Pth);
  const bb = pts.map(p => T.tx(p[0], p[1])), xs = bb.map(p => p[0]), ys = bb.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const n = Math.min(110, Math.max(6, ((x1 - x0) * (y1 - y0)) / 9000 | 0));
  g.filter = 'blur(10px)';
  for (let i = 0; i < n; i++) { const r = 20 + rnd() * 90; g.fillStyle = rnd() > .5 ? `rgba(24,27,30,${.03 + rnd() * .05})` : `rgba(250,252,255,${.03 + rnd() * .05})`; g.beginPath(); g.ellipse(x0 + rnd() * (x1 - x0), y0 + rnd() * (y1 - y0), r, r * (.5 + rnd() * .6), rnd() * 3, 0, 7); g.fill(); }
  if ((o.edge ?? .16) > 0) { g.filter = 'blur(7px)'; g.strokeStyle = `rgba(16,18,20,${o.edge ?? .16})`; g.lineWidth = 26; g.stroke(Pth); }
  g.filter = 'none'; g.restore();
  if (o.line !== false) T.outline(Pth, o.lw ?? 3.2, o.lineCol ?? '#272A2D');
  return Pth;
}
function paperGrain(g, w, h, seed = 3) {
  const rnd = mulberry(seed); g.setTransform(1, 0, 0, 1, 0, 0);
  for (let i = 0; i < w * h / 900; i++) { g.fillStyle = rnd() > .5 ? 'rgba(16,18,20,.06)' : 'rgba(250,252,255,.05)'; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 2); }
}
function makeBG(x0, y0, x1, y1, PS) { const cv = document.createElement('canvas'); cv.width = Math.round((x1 - x0) * PS); cv.height = Math.round((y1 - y0) * PS); return { cv, ox: x0, oy: y0, PS, w: x1 - x0, h: y1 - y0 }; }
function withCanvas(bg, fn, grain = true) {
  const prev = T.g, oldB = T.BASE.slice(), oldL = T.S.lwScale, { PS, ox, oy } = bg;
  T.init(bg.cv); T.BASE.splice(0, 6, PS, 0, 0, PS, -ox * PS, -oy * PS); T.S.lwScale = PS; T.frame(0, { amp: 0 });
  const raw = () => T.g.setTransform(PS, 0, 0, PS, -ox * PS, -oy * PS);
  fn(T.g, raw); T.g.setTransform(1, 0, 0, 1, 0, 0);
  if (grain) { T.g.globalCompositeOperation = 'source-atop'; paperGrain(T.g, bg.cv.width, bg.cv.height, ox + 3); T.g.globalCompositeOperation = 'source-over'; }
  T.BASE.splice(0, 6, ...oldB); T.S.lwScale = oldL; T.init(prev.canvas);
}
// draw a cached layer: cam = {x,y,z}, f = parallax factor (x only); squash breathes the layer around pivotY
export function drawBG(sg, bg, cam, f = 1, squash = 0, pivotY = 900) {
  const z = cam.z, ox = 960 - cam.x * f * z, oy = 540 - cam.y * z;
  sg.save(); sg.setTransform(z, 0, 0, z, ox, oy);
  if (squash) { sg.translate(0, pivotY); sg.scale(1 - squash * .4, 1 + squash); sg.translate(0, -pivotY); }
  sg.drawImage(bg.cv, bg.ox, bg.oy, bg.w, bg.h); sg.restore();
}
export const camBase = (cam, f = 1) => [cam.z, 0, 0, cam.z, 960 - cam.x * f * cam.z, 540 - cam.y * cam.z];

// ——— the school front (shared by the street and the stage); origin = ground at the foot of the steps, door centred on x = 0 ———
function school(g, raw, X, Y, s, seed = 50) {
  const Q = (x, y) => [X + x * s, Y + y * s], R = (x, y, w, h) => rect(X + x * s, Y + y * s, w * s, h * s), RR = (x, y, w, h, r) => rr(X + x * s, Y + y * s, w * s, h * s, r * s);
  // facade: portland stone, ashlar joints
  wash(R(-720, -820, 1440, 820), '#A2A7AB', { seed, edge: .12 });
  raw(); g.strokeStyle = 'rgba(30,33,36,.22)'; g.lineWidth = 2;
  for (let yy = -820, r = 0; yy < -140; yy += 56, r++) { g.beginPath(); g.moveTo(X - 720 * s, Y + yy * s); g.lineTo(X + 720 * s, Y + yy * s); g.stroke(); for (let xx = -720 + (r % 2) * 60; xx < 720; xx += 120) { g.beginPath(); g.moveTo(X + xx * s, Y + yy * s); g.lineTo(X + xx * s, Y + (yy + 56) * s); g.stroke(); } }
  wash(R(-720, -150, 1440, 150), '#73787C', { seed: seed + 1, edge: .1 });           // plinth
  wash(R(-740, -850, 1480, 40), '#7E8387', { seed: seed + 2 });                       // cornice
  wash(R(-730, -812, 1460, 14), '#5D6266', { seed: seed + 3 });
  // windows (sash, white frames), flower boxes
  for (const wx of [-560, -340, 340, 560]) {
    wash(RR(wx - 72, -560, 144, 300, 6), '#C4C8CB', { seed: wx + seed, edge: .05 });
    wash(R(wx - 60, -548, 120, 130), '#4D5256', { seed: wx + 1, edge: .2 }); wash(R(wx - 60, -406, 120, 134), '#4D5256', { seed: wx + 2, edge: .2 });
    raw(); g.strokeStyle = '#C4C8CB'; g.lineWidth = 6 * s; g.beginPath(); g.moveTo(X + wx * s, Y - 548 * s); g.lineTo(X + wx * s, Y - 272 * s); g.stroke();
    g.strokeStyle = 'rgba(240,243,246,.28)'; g.lineWidth = 9 * s; g.beginPath(); g.moveTo(X + (wx - 46) * s, Y - 540 * s); g.lineTo(X + (wx - 14) * s, Y - 440 * s); g.stroke();
    wash(R(wx - 86, -584, 172, 26), '#878C90', { seed: wx + 3 });                         // lintel
    wash(R(wx - 82, -262, 164, 30), '#5A5F63', { seed: wx + 4 });                         // flower box
    for (let i = 0; i < 6; i++) wash(ell(X + (wx - 66 + i * 26) * s, Y - 268 * s, 17 * s, 14 * s, 14), i % 2 ? '#C9CDD0' : '#7A7F83', { seed: wx + 10 + i, edge: .05, lw: 2.4 });
  }
  // portico: columns + entablature + pediment
  for (const cx of [-176, 176]) { wash(R(cx - 26, -600, 52, 450), '#B7BBBE', { seed: seed + cx, edge: .08 }); raw(); g.strokeStyle = 'rgba(30,33,36,.25)'; g.lineWidth = 2; for (const d of [-12, 0, 12]) { g.beginPath(); g.moveTo(X + (cx + d) * s, Y - 590 * s); g.lineTo(X + (cx + d) * s, Y - 160 * s); g.stroke(); } wash(R(cx - 34, -622, 68, 24), '#8E9397', { seed: seed + cx + 1 }); wash(R(cx - 34, -164, 68, 18), '#8E9397', { seed: seed + cx + 2 }); }
  wash([Q(-250, -700), Q(0, -790), Q(250, -700)], '#B1B5B8', { seed: seed + 7 });
  // the sign: a dark plate with white period capitals
  wash(R(-240, -700, 480, 76), '#26292C', { seed: seed + 8, edge: 0 });
  raw(); g.strokeStyle = '#E7EAEC'; g.lineWidth = 2.4; g.strokeRect(X - 232 * s, Y - 692 * s, 464 * s, 60 * s);
  g.save(); g.translate(X, Y - 660 * s); g.font = `${Math.round(44 * s)}px Limelight`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#F2F4F5'; g.fillText('ENGLISH  SCHOOL', 0, 2 * s); g.restore();
  // doorway: arch, dark interior (the door itself is a live prop), fanlight
  wash([...arc(X, Y - 470 * s, 112 * s, 100 * s, Math.PI, TAU, 18), Q(112, -150), Q(-112, -150)], '#8A8F93', { seed: seed + 9 });
  wash([...arc(X, Y - 470 * s, 96 * s, 86 * s, Math.PI, TAU, 18), Q(96, -150), Q(-96, -150)], '#15171A', { seed: seed + 10, edge: .3 });
  raw(); g.strokeStyle = '#B9BDC0'; g.lineWidth = 4 * s; for (let i = 0; i < 5; i++) { const a = Math.PI + (i + 1) / 6 * Math.PI; g.beginPath(); g.moveTo(X, Y - 470 * s); g.lineTo(X + Math.cos(a) * 92 * s, Y - 470 * s + Math.sin(a) * 82 * s); g.stroke(); }
  g.beginPath(); g.moveTo(X - 96 * s, Y - 470 * s); g.lineTo(X + 96 * s, Y - 470 * s); g.stroke();
  // steps
  for (let i = 0; i < 3; i++) { const w = 380 - i * 60; wash(R(-w / 2, -40 * (i + 1), w, 40), i % 2 ? '#BFC3C6' : '#B2B6B9', { seed: seed + 20 + i, edge: .06 }); }
  // railings
  raw(); g.strokeStyle = '#1C1F22'; g.lineWidth = 5 * s;
  for (const side of [-1, 1]) for (let i = 0; i < 6; i++) { const x = X + side * (210 + i * 24) * s; g.beginPath(); g.moveTo(x, Y); g.lineTo(x, Y - 120 * s); g.stroke(); g.fillStyle = '#1C1F22'; g.beginPath(); g.moveTo(x - 6 * s, Y - 116 * s); g.lineTo(x, Y - 134 * s); g.lineTo(x + 6 * s, Y - 116 * s); g.fill(); }
  for (const side of [-1, 1]) { g.beginPath(); g.moveTo(X + side * 204 * s, Y - 104 * s); g.lineTo(X + side * 330 * s, Y - 104 * s); g.stroke(); }
}
export const SCHOOL_STAGE = { x: 1220, y: 940, s: 1 };
export const SCHOOL_STREET = { x: 2880, y: 905, s: .78 };

// ——— street, far layer (parallax .25): sky, clouds, far roofs, the clock tower ———
export function paintFar() {
  const bg = makeBG(-700, -100, 1700, 900, 1.0);
  withCanvas(bg, (g, raw) => {
    wash(rect(-710, -110, 2420, 1020), '#CACED1', { line: false, seed: 61, edge: 0 });
    for (const [cx, cy, w] of [[-420, 180, 220], [380, 120, 260], [1180, 160, 200], [820, 300, 150]]) wash(spline([[cx - w, cy + 30], [cx - w * .7, cy - 10], [cx - w * .3, cy - 40], [cx + w * .1, cy - 30], [cx + w * .5, cy - 50], [cx + w * .8, cy - 10], [cx + w, cy + 30]], true, 6), '#DEE1E3', { seed: cx, edge: .04, lw: 2.2, lineCol: '#6B7074' });
    // clock tower (generic gothic)
    const X = 760;
    wash(rect(X - 70, 300, 140, 600), '#9DA2A6', { seed: 62 });
    raw(); g.strokeStyle = 'rgba(30,33,36,.3)'; g.lineWidth = 2; for (let y = 330; y < 900; y += 40) { g.beginPath(); g.moveTo(X - 70, y); g.lineTo(X + 70, y); g.stroke(); }
    for (const dx of [-40, 0, 40]) { g.beginPath(); g.moveTo(X + dx, 520); g.lineTo(X + dx, 900); g.stroke(); }
    wash(rect(X - 84, 160, 168, 150), '#A9AEB2', { seed: 63 });
    wash(ell(X, 234, 56, 56, 40), '#E4E7E9', { seed: 64, edge: .05 });
    raw(); g.strokeStyle = '#2A2D30'; g.lineWidth = 3; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; g.beginPath(); g.moveTo(X + Math.cos(a) * 44, 234 + Math.sin(a) * 44); g.lineTo(X + Math.cos(a) * 52, 234 + Math.sin(a) * 52); g.stroke(); }
    g.lineWidth = 5; g.beginPath(); g.moveTo(X, 234); g.lineTo(X + 26, 222); g.moveTo(X, 234); g.lineTo(X - 4, 196); g.stroke();
    wash([[X - 90, 162], [X, 20], [X + 90, 162]], '#868B8F', { seed: 65 });
    wash([[X - 10, 30], [X, -40], [X + 10, 30]], '#6E7377', { seed: 66 });
    for (const dx of [-80, 80]) wash([[X + dx - 10, 162], [X + dx, 110], [X + dx + 10, 162]], '#868B8F', { seed: 67 + dx });
    // far roofs and chimneys
    const rnd = mulberry(5);
    for (let x = -700; x < 1700; x += 150 + rnd() * 60) { const h = 420 + rnd() * 90; if (Math.abs(x - X) < 140) continue; wash(rect(x, h, 160, 900 - h), '#B3B7BA', { seed: x | 0, edge: .05, lw: 2.2, lineCol: '#6B7074' }); wash(rect(x + 30, h - 50, 30, 52), '#A6AAAD', { seed: (x | 0) + 1, edge: 0, lw: 2, lineCol: '#6B7074' }); }
  });
  return bg;
}

// ——— street, mid layer (parallax .62): terraced houses + the road ———
export const ROAD_Y = 860;
export function paintMid() {
  const bg = makeBG(-400, 200, 2600, 900, 1.25);
  withCanvas(bg, (g, raw) => {
    const rnd = mulberry(9);
    for (let i = 0, x = -400; x < 2600; i++, x += 270) {
      const top = 360 + (i % 3) * 14, brick = i % 2 ? '#8D9296' : '#979CA0';
      wash(rect(x, top, 270, 780 - top), brick, { seed: 100 + i, edge: .1 });
      raw(); g.strokeStyle = 'rgba(30,33,36,.16)'; g.lineWidth = 1.6;
      for (let y = top + 10; y < 640; y += 14) { g.beginPath(); g.moveTo(x + 4, y); g.lineTo(x + 266, y); g.stroke(); }
      wash(rect(x, 640, 270, 140), '#B2B6B9', { seed: 120 + i, edge: .06 });           // stucco ground floor
      wash(rect(x - 6, top - 22, 282, 26), '#62676B', { seed: 140 + i });               // parapet
      wash(rect(x + 196, top - 74, 46, 56), '#7C8185', { seed: 160 + i });              // chimney stack
      for (const cx of [204, 220, 234]) wash(rect(x + cx - 5, top - 92, 10, 20), '#5C6165', { seed: 170 + i + cx, edge: 0, lw: 2 });
      for (const [wy, wh] of [[top + 40, 90], [top + 156, 104]]) for (const wx of [40, 150]) {
        wash(rect(x + wx - 6, wy - 6, 92, wh + 12), '#C5C9CC', { seed: 180 + i + wx + wy, edge: .04, lw: 2.4 });
        wash(rect(x + wx, wy, 80, wh), '#53585C', { seed: 190 + i + wx + wy, edge: .2, lw: 2 });
        raw(); g.strokeStyle = '#C5C9CC'; g.lineWidth = 4; g.beginPath(); g.moveTo(x + wx + 40, wy); g.lineTo(x + wx + 40, wy + wh); g.moveTo(x + wx, wy + wh / 2); g.lineTo(x + wx + 80, wy + wh / 2); g.stroke();
        if (rnd() > .5) { g.fillStyle = 'rgba(235,238,240,.55)'; g.fillRect(x + wx + 4, wy + 4, 18, wh - 8); }
      }
      wash([...arc(x + 70, 690, 34, 30, Math.PI, TAU, 10), [x + 104, 772], [x + 36, 772]], '#3C4145', { seed: 200 + i, edge: .2 });   // front door
      wash(rect(x + 150, 668, 86, 86), '#53585C', { seed: 210 + i, edge: .2, lw: 2.4 });
      raw(); g.strokeStyle = '#2A2D30'; g.lineWidth = 2.6; for (let k = 0; k < 11; k++) { g.beginPath(); g.moveTo(x + 130 + k * 12, 780); g.lineTo(x + 130 + k * 12, 742); g.stroke(); } g.beginPath(); g.moveTo(x + 126, 746); g.lineTo(x + 262, 746); g.stroke();
    }
    wash(rect(-410, 776, 3020, 20), '#A9ADB0', { seed: 220, edge: .04 });               // far pavement
    wash(rect(-410, 794, 3020, 120), '#6A6F73', { seed: 221, edge: .06, line: false }); // road
    raw(); g.fillStyle = 'rgba(225,228,230,.45)'; for (let x = -400; x < 2600; x += 140) g.fillRect(x, 846, 70, 6);
  });
  return bg;
}

// ——— street, near layer (parallax 1): our pavement + the school on the corner ———
export const STREET_Y = 960;
export function paintNear() {
  const bg = makeBG(0, 150, 3800, 1300, 1.0);
  withCanvas(bg, (g, raw) => {
    wash(rect(-10, 878, 3820, 22), '#C2C6C9', { seed: 300, edge: .04 });                 // kerb
    wash(rect(-10, 898, 3820, 410), '#ADB1B4', { seed: 301, edge: .05, line: false });   // pavement
    raw(); g.strokeStyle = 'rgba(30,33,36,.3)'; g.lineWidth = 2.2;
    for (const y of [960, 1060, 1190]) { g.beginPath(); g.moveTo(0, y); g.lineTo(3800, y); g.stroke(); }
    for (let x = 0; x < 3800; x += 150) { g.beginPath(); g.moveTo(x, 900); g.lineTo(x - 30, 1300); g.stroke(); }
    const { x, y, s } = SCHOOL_STREET;
    school(g, raw, x, y, s, 400);
  });
  return bg;
}

// ——— stage: the school front ———
export function paintStage() {
  const bg = makeBG(-100, -60, 2300, 1300, 1.5);
  withCanvas(bg, (g, raw) => {
    wash(rect(-110, -70, 2420, 300), '#CACED1', { line: false, seed: 500, edge: 0 });
    // neighbouring brick terrace on the left
    wash(rect(-110, 40, 640, 920), '#878C90', { seed: 501, edge: .1 });
    raw(); g.strokeStyle = 'rgba(30,33,36,.18)'; g.lineWidth = 1.8; for (let yy = 50; yy < 860; yy += 18) { g.beginPath(); g.moveTo(-100, yy); g.lineTo(520, yy); g.stroke(); }
    wash(rect(-110, 760, 640, 180), '#AEB2B5', { seed: 502, edge: .06 });
    for (const wy of [140, 420]) { wash(rect(150, wy, 180, 220), '#C4C8CB', { seed: 503 + wy, lw: 2.6 }); wash(rect(164, wy + 14, 152, 192), '#4F5458', { seed: 504 + wy, edge: .2 }); raw(); g.strokeStyle = '#C4C8CB'; g.lineWidth = 6; g.beginPath(); g.moveTo(240, wy + 14); g.lineTo(240, wy + 206); g.moveTo(164, wy + 110); g.lineTo(316, wy + 110); g.stroke(); }
    // pavement
    wash(rect(-110, 935, 2420, 380), '#ADB1B4', { seed: 505, edge: .05, line: false });
    raw(); g.strokeStyle = 'rgba(30,33,36,.28)'; g.lineWidth = 2.4;
    for (const yy of [1010, 1130]) { g.beginPath(); g.moveTo(-100, yy); g.lineTo(2300, yy); g.stroke(); }
    for (let xx = -100; xx < 2300; xx += 180) { g.beginPath(); g.moveTo(xx, 940); g.lineTo(xx - 60, 1300); g.stroke(); }
    const { x, y, s } = SCHOOL_STAGE;
    school(g, raw, x, y, s, 600);
  });
  return bg;
}

// ——— living props (drawn with the toon engine every frame; b = breath −1..1) ———
export function sun(x, y, k, b, t) {
  push(); translate(x, y); scale(k * (1 - b * .03), k * (1 + b * .05));
  push(); rotate(t * .35);
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; shape([[Math.cos(a - .1) * 70, Math.sin(a - .1) * 70], [Math.cos(a) * (104 + (i % 2) * 18), Math.sin(a) * (104 + (i % 2) * 18)], [Math.cos(a + .1) * 70, Math.sin(a + .1) * 70]], { fill: P.white, lw: S.lw * .7 }); }
  pop();
  shape(ell(0, 0, 76, 76, 48), { fill: P.white, shade: () => { fillLocal([[40, -90], [100, -90], [100, 90], [48, 90]], P.pale); } });
  pieEye(-24, -12, 13, 19, { lx: -.4, ly: .5, lwk: .75 }); pieEye(22, -12, 13, 19, { lx: -.4, ly: .5, lwk: .75 });
  mouth(-2, 26, 42, 'smile');
  pop();
}
export function lamp(x, y, k, b) {
  push(); translate(x, y); scale(k);
  // the post sways and stretches on the beat (bends from the base)
  const sway = b * .03; rotate(sway);
  shape(rr(-22, -20, 44, 22, 6), { fill: P.dark });
  shape(spline([[-9, -20], [-6, -200], [-8, -330], [8, -330], [6, -200], [9, -20]], true, 4), { fill: P.dark, lw: S.lw * .8 });
  shape(rr(-30, -344, 60, 16, 5), { fill: P.dark });
  push(); translate(0, -344); scale(1 - b * .05, 1 + b * .08);
  shape([[-30, 0], [30, 0], [42, -64], [-42, -64]], { fill: P.pale, shade: () => { fillLocal([[8, 10], [60, 10], [60, -80], [14, -80]], P.light); } });
  stroke([[0, 0], [0, -64]], S.lw * .5);
  shape([[-50, -64], [50, -64], [0, -100]], { fill: P.dark });
  shape(ell(0, -104, 8, 8, 10), { fill: P.dark });
  pop(); pop();
}
// double-decker bus (1930s, open rear platform), faces right; front is the face
export function bus(x, y, k, b, t, wheelTurn) {
  push(); translate(x, y); scale(k);
  push(); translate(0, -42); scale(1 - b * .02, 1 + b * .04); translate(0, 42);
  const BODY = '#5C6165', BAND = '#E3E6E8';
  shape(rr(-240, -390, 480, 350, 34), {
    fill: BODY, shade: () => {
      fillLocal(rect(-260, -224, 520, 26), BAND); fillLocal(rect(-260, -120, 520, 12), P.mid);
      fillLocal(rect(170, -400, 90, 400), '#4A4F53');
    }
  });
  for (let i = 0; i < 5; i++) { shape(rr(-218 + i * 78, -372, 64, 70, 8), { fill: '#BFC3C6', lw: S.lw * .6, shade: () => fillLocal(rect(-218 + i * 78 + 36, -372, 40, 70), '#A7ABAE') }); }
  for (let i = 0; i < 4; i++) { shape(rr(-218 + i * 78, -190, 64, 62, 8), { fill: '#BFC3C6', lw: S.lw * .6, shade: () => fillLocal(rect(-218 + i * 78 + 36, -190, 40, 62), '#A7ABAE') }); }
  // destination board
  shape(rr(108, -414, 120, 30, 6), { fill: P.ink, lw: S.lw * .6 });
  T.text('LONDON', 168, -398, { font: '22px Limelight', fill: P.white });
  // face on the front: headlamp pie eyes + radiator grin
  pieEye(170, -150, 18, 24, { lx: .6, ly: .1, lwk: .7 }); pieEye(214, -150, 15, 22, { lx: .6, ly: .1, lwk: .7 });
  shape(rr(170, -104, 64, 46, 10), { fill: P.ink, shade: () => { for (const dx of [182, 198, 214]) fillLocal(rect(dx, -98, 6, 36), P.mid); fillLocal(rect(170, -104, 64, 12), P.white); } });
  pop();
  for (const wx of [-150, 150]) {
    push(); translate(wx, -40); rotate(wheelTurn);
    shape(ell(0, 0, 44, 44, 32), { fill: P.ink, lw: S.lw * .8 });
    shape(ell(0, 0, 20, 20, 20), { fill: P.light, lw: S.lw * .6 });
    for (let i = 0; i < 4; i++) { const a = i / 4 * TAU; stroke([[Math.cos(a) * 6, Math.sin(a) * 6], [Math.cos(a) * 18, Math.sin(a) * 18]], S.lw * .45); }
    pop();
  }
  pop();
}
// the school door (hinge on the left of the doorway); open 0..1 (the panel narrows toward the hinge), bang = squash pulse
export function door(X, Y, s, open, b) {
  const w = 192 * s, h = 670 * s, hx = X - 96 * s, top = Y - 150 * s - h + 2;
  if (open > .98) return;
  push(); translate(hx, Y - 150 * s); scale(Math.max(.04, 1 - open), 1 + b * .015); translate(-hx, -(Y - 150 * s));
  const arch = [...arc(X, Y - 470 * s, 96 * s, 86 * s, Math.PI, TAU, 18), [X + 96 * s, Y - 150 * s], [X - 96 * s, Y - 150 * s]];
  shape(arch, { fill: '#3B4044', lw: S.lw * .8, shade: () => { fillLocal(rect(X + 50 * s, top, 60 * s, h), '#2C3134'); } });
  for (const [px, py, pw, ph] of [[-76, -440, 64, 110], [12, -440, 64, 110], [-76, -300, 64, 120], [12, -300, 64, 120]]) shape(rr(X + px * s, Y + py * s, pw * s, ph * s, 6), { fill: '#454A4E', lw: S.lw * .5 });
  shape(ell(X + 68 * s, Y - 300 * s, 9 * s, 9 * s, 12), { fill: P.light, lw: S.lw * .5 });
  pop();
}
