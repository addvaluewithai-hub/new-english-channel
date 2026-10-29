// portraits.js — 32×32 dialogue portraits (3/4 view facing right), drawn procedurally into an indexed sprite:
// shaded face volume + hair + clothes, then eye / brow / mouth overlays per expression, then a 1-px ink outline.
import { C, T, FB } from './px.js';

const L = [-.55, -.83];
function make() { const f = new FB(32, 32); f.clear(T); return f; }
const tone = (nx, ny, r = [.42, -.3]) => { const v = nx * L[0] + ny * L[1]; return v > r[0] ? 3 : v < r[1] ? 1 : 2; };
function outline(f) {
  const o = f.d.slice();
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
    if (f.d[y * 32 + x] !== T) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < 32 && Y < 32 && f.d[Y * 32 + X] !== T) { o[y * 32 + x] = C.ink; break; } }
  }
  f.d = o; return f;
}
// face volume: ellipse with a narrowing jaw
const FC = { cx: 17, cy: 14, rx: 8.6, ry: 10.2 };
function inFace(x, y) {
  const ny = (y + .5 - FC.cy) / FC.ry; if (Math.abs(ny) > 1) return false;
  const rx = FC.rx * (ny > 0 ? 1 - .33 * ny * ny : 1);
  const nx = (x + .5 - FC.cx - (ny > 0 ? ny * 1.2 : 0)) / rx;
  return nx * nx + ny * ny <= 1;
}
function face(f, sk) {
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) if (inFace(x, y)) {
    const t = tone((x + .5 - FC.cx) / FC.rx, (y + .5 - FC.cy) / FC.ry);
    f.px(x, y, sk[t]);
  }
  // ear (back side), nose, cheek shade toward the far side
  for (const [x, y, c] of [[8, 13, 1], [7, 14, 1], [7, 15, 2], [7, 16, 2], [8, 17, 1], [8, 14, 2], [8, 15, 0], [8, 16, 2]]) f.px(x, y, sk[c]);
  f.px(25, 15, sk[2]); f.px(25, 16, sk[2]); f.px(26, 17, sk[2]); f.px(25, 17, sk[1]); f.px(24, 18, sk[1]);
}
function neck(f, sk) { for (let y = 21; y < 28; y++) for (let x = 13; x < 21; x++) f.px(x, y, x < 15 ? sk[1] : y < 23 ? sk[0] : sk[1]); }

// —— Youssef ——
const SKY = [C.umber, C.dbrown, C.brown, C.skinS];   // line, shade, mid, light
function youssefBase() {
  const f = make();
  // jacket + tee
  for (let y = 25; y < 32; y++) for (let x = 2; x < 31; x++) {
    const sl = y - 25, half = 9 + sl * 1.6; if (Math.abs(x + .5 - 16.5) > half) continue;
    f.px(x, y, x < 8 + (y > 28 ? 0 : 1) ? C.denD : x > 25 ? C.night : C.denD);
  }
  for (let y = 25; y < 32; y++) for (let x = 12; x < 22; x++) if (Math.abs(x + .5 - 17) < 2.8 + (y - 25) * .55) f.px(x, y, y === 25 ? C.silver : C.white);
  for (let y = 26; y < 32; y++) { f.px(Math.round(13.6 - (y - 26) * .55), y, C.navy); f.px(Math.round(20.6 + (y - 26) * .55), y, C.night); }
  f.px(5, 28, C.navy); f.px(6, 27, C.navy); f.px(4, 29, C.navy);
  neck(f, SKY);
  face(f, SKY);
  // hair: short, black, a skull cap with three blunt spikes; sideburn at the ear
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
    const dx = x + .5 - 16, dy = y + .5 - 11.5, inSkull = dx * dx / 100 + dy * dy / 72 <= 1;
    const hairline = 8.2 + Math.max(0, (x - 15)) * .25 + (x > 20 ? 1 : 0);
    if (inSkull && (y < hairline || (x < 11 && y < 13.5) || (x < 9.5 && y < 15))) {
      const t = tone(dx / 10, dy / 8.5, [.55, -.1]);
      f.px(x, y, t === 3 ? C.dslate : t === 2 ? C.night : C.ink);
    }
  }
  for (const [x, y] of [[12, 2], [13, 2], [14, 2], [15, 2], [16, 2], [17, 2], [18, 2], [11, 3], [19, 3], [14, 1], [15, 1], [16, 1]]) f.px(x, y, C.night);
  f.px(13, 3, C.dslate); f.px(14, 3, C.dslate); f.px(15, 2, C.dslate); f.px(17, 4, C.dslate);
  // trimmed beard: along the jaw and chin, with a moustache
  for (let y = 15; y < 26; y++) for (let x = 7; x < 28; x++) {
    if (!inFace(x, y)) continue;
    const edge = !inFace(x, y + 2) || !inFace(x - 2, y) && x < 13 || !inFace(x + 1, y + 1);
    if ((edge && y >= 16 && x >= 9) || (y >= 21 && x >= 11)) f.px(x, y, (x + y) % 5 === 0 ? C.dslate : C.night);
  }
  for (let x = 18; x < 24; x++) f.px(x, 19, C.night);
  return f;
}
// eyes / brows / mouth for Youssef (near eye x 13–16, far eye x 20–23, eye row 14–15)
function eyeOpen(f, x, y, iris, w = 3) { for (let i = 0; i < w + 1; i++) f.px(x + i - 1, y - 1, C.ink); f.px(x, y, C.white); f.px(x + 1, y, iris); f.px(x + 2, y, w > 2 ? C.ink : iris); f.px(x, y + 1, C.white); f.px(x + 1, y + 1, iris); if (w > 2) f.px(x + 2, y + 1, C.white); }
const yp = new Map();
export function portraitY(expr = 'happy', mouth = 0) {
  const key = expr + mouth; if (yp.has(key)) return yp.get(key);
  const f = youssefBase();
  const brow = (pts) => pts.forEach(([x, y]) => f.px(x, y, C.ink));
  if (expr === 'happy') {
    eyeOpen(f, 13, 14, C.umber); eyeOpen(f, 20, 14, C.umber, 2);
    brow([[12, 11], [13, 11], [14, 11], [15, 12], [20, 11], [21, 11], [22, 11]]);
  } else if (expr === 'nervous') {
    eyeOpen(f, 13, 14, C.umber); eyeOpen(f, 20, 14, C.umber, 2);
    brow([[12, 12], [13, 12], [14, 11], [15, 10], [20, 10], [21, 11], [22, 11]]);
    f.px(25, 9, C.skyL); f.px(25, 10, C.sky); f.px(24, 10, C.skyL); f.px(25, 11, C.sky);   // sweat drop
  } else {   // embarrassed: squeezed eyes, blush, worried brows, bigger sweat
    brow([[12, 12], [13, 12], [14, 11], [15, 10], [20, 10], [21, 11], [22, 12]]);
    for (const [x, y] of [[12, 15], [13, 14], [14, 14], [15, 15], [20, 15], [21, 14], [22, 15]]) f.px(x, y, C.ink);
    for (const [x, y] of [[12, 17], [13, 17], [14, 17], [21, 17], [22, 17]]) f.px(x, y, C.hot === undefined ? C.red : C.red);
    f.px(13, 18, C.crimson); f.px(22, 18, C.crimson);
    for (const [x, y, c] of [[26, 7, C.skyL], [26, 8, C.skyL], [25, 9, C.sky], [26, 9, C.white], [27, 9, C.sky], [25, 10, C.sky], [26, 10, C.sky], [27, 10, C.blue], [26, 11, C.blue]]) f.px(x, y, c);
  }
  // mouth (inside the beard): 0 closed, 1 open, 2 wide
  if (expr === 'embarrassed') { for (const [x, y] of [[18, 21], [19, 20], [20, 21], [21, 20], [22, 21]]) f.px(x, y, C.ink); }
  else if (mouth === 0) { for (let x = 18; x < 23; x++) f.px(x, 20, C.umber); f.px(18, 19, C.umber); if (expr === 'happy') f.px(23, 19, C.umber); }
  else { for (let x = 18; x < 23; x++) { f.px(x, 20, C.ink); f.px(x, 21, mouth > 1 && x > 18 && x < 22 ? C.crimson : C.ink); } if (mouth > 1) for (let x = 19; x < 22; x++) f.px(x, 22, C.ink); f.px(19, 20, C.white); f.px(20, 20, C.white); }
  const s = outline(f); yp.set(key, s); return s;
}

// —— Mia ——
const SKM = [C.brown, C.skinS, C.skin, C.sand];
function miaBase() {
  const f = make();
  // ponytail behind (left), long and curved
  for (let y = 6; y < 28; y++) for (let x = 0; x < 12; x++) {
    const cx = 6 - Math.sin((y - 6) / 22 * Math.PI) * 3.2, w = 3.6 - Math.max(0, y - 18) * .3;
    if (Math.abs(x + .5 - cx) < w) f.px(x, y, (x + .5 - cx) < -1.4 ? C.rust : (x + y) % 6 === 0 ? C.tan : C.clay);
  }
  // cardigan + blouse collar
  for (let y = 25; y < 32; y++) for (let x = 2; x < 31; x++) {
    const sl = y - 25, half = 8.5 + sl * 1.6; if (Math.abs(x + .5 - 16.5) > half) continue;
    f.px(x, y, x < 9 ? C.musD : x > 24 ? C.musD : C.mus);
  }
  for (let y = 25; y < 32; y++) for (let x = 12; x < 22; x++) if (Math.abs(x + .5 - 17) < 2.4 + (y - 25) * .35) f.px(x, y, C.white);
  for (const [x, y] of [[13, 25], [14, 26], [15, 27], [21, 25], [20, 26], [19, 27]]) f.px(x, y, C.cream);
  f.px(10, 28, C.musL); f.px(9, 29, C.musL); f.px(23, 29, C.musL); f.px(17, 30, C.musD); f.px(17, 31, C.musD);
  neck(f, SKM);
  face(f, SKM);
  // hair cap with side-swept fringe, and a lock falling at the front
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
    const dx = x + .5 - 16, dy = y + .5 - 11.5, inSkull = dx * dx / 108 + dy * dy / 78 <= 1;
    const fringe = 6.5 + (x - 10) * .42;             // sweeps down to the right
    const back = x < 11 && y < 19;
    const lock = x >= 24 && x <= 26 && y < 19 && y > 6;
    if ((inSkull && (y < fringe || back)) || lock) {
      const t = tone(dx / 10.5, dy / 9, [.5, -.15]);
      f.px(x, y, t === 3 ? C.tan : t === 2 ? C.clay : C.rust);
    }
  }
  for (const [x, y] of [[13, 3], [14, 4], [15, 5], [17, 5], [18, 6], [20, 7]]) f.px(x, y, C.rust);
  f.px(11, 2, C.tan); f.px(12, 2, C.tan); f.px(13, 2, C.tan); f.px(9, 4, C.tan);
  f.px(6, 7, C.dgreen); f.px(7, 7, C.green); f.px(6, 8, C.dgreen); f.px(7, 8, C.dgreen);   // hair tie
  // freckles + cheek
  f.px(21, 17, C.skinS); f.px(23, 17, C.skinS); f.px(14, 17, C.skinS);
  return f;
}
const mp = new Map();
export function portraitM(expr = 'smile', mouth = 0, blink = false) {
  const key = expr + mouth + blink; if (mp.has(key)) return mp.get(key);
  const f = miaBase();
  const P = (pts, c) => pts.forEach(([x, y]) => f.px(x, y, c));
  if (blink) { P([[12, 15], [13, 15], [14, 15], [15, 15], [20, 15], [21, 15], [22, 15]], C.ink); }
  else { eyeOpen(f, 13, 14, C.dgreen); eyeOpen(f, 20, 14, C.dgreen, 2); f.px(12, 14, C.ink); }
  if (expr === 'puzzled') {
    P([[12, 10], [13, 9], [14, 9], [15, 10]], C.rust);         // near brow raised high
    P([[20, 12], [21, 12], [22, 11]], C.rust);                // far brow low
    if (mouth) P([[20, 20], [21, 20], [20, 21], [21, 21]], C.crimson);
    else P([[20, 20], [21, 20]], C.crimson), P([[22, 21]], C.dbrown);
  } else {
    P([[12, 11], [13, 11], [14, 11], [15, 12]], C.rust); P([[20, 11], [21, 11], [22, 12]], C.rust);
    if (mouth) { P([[18, 20], [19, 21], [20, 21], [21, 21], [22, 20]], C.dbrown); P([[19, 20], [20, 20], [21, 20]], C.white); if (mouth > 1) P([[19, 22], [20, 22], [21, 22]], C.crimson), P([[19, 21], [20, 21], [21, 21]], C.crimson); }
    else P([[18, 19], [19, 20], [20, 20], [21, 20], [22, 19]], C.crimson);
    P([[13, 18], [14, 18], [22, 18]], C.pink);
  }
  const s = outline(f); mp.set(key, s); return s;
}
