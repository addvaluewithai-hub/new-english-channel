// scenes.js — London street (side-scroll with parallax + integer tilt) and the school entrance (3/4 town view)
import { W, H, C, T, bayer, hash, clamp } from './px.js';
import { text, textW } from './font.js';

// —— shared bits ——
function cloud(fb, x, y, s) {
  const blobs = [[0, 4, 6], [7, 0, 8], [16, 3, 7], [23, 6, 5], [-6, 7, 4]];
  for (const [bx, by, r] of blobs) for (let j = -r; j <= r; j++) for (let i = -r - 2; i <= r + 2; i++) {
    const d = (i * i) / ((r + 2) * (r + 2)) + (j * j) / (r * r); if (d > 1 || by + j > 9) continue;
    const X = Math.round(x + (bx + i) * s), Y = Math.round(y + (by + j) * s);
    fb.px(X, Y, (j > r * .35 || by + j >= 8) ? C.silver : C.white);
  }
}
// sash window with sky reflection
function windowSash(fb, x, y, w, h, frame = C.white) {
  fb.rect(x - 1, y - 1, w + 2, h + 2, C.ink);
  fb.rect(x, y, w, h, frame);
  for (const [gx, gy, gw, gh] of [[x + 1, y + 1, w - 2, (h >> 1) - 1], [x + 1, y + (h >> 1) + 1, w - 2, h - (h >> 1) - 2]]) {
    for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) {
      const X = gx + i, Y = gy + j, diag = (i - j + 40) % 9;
      fb.px(X, Y, diag === 0 || diag === 1 ? C.skyL : bayer(X, Y) < j / gh ? C.dslate : C.sky);
    }
  }
  fb.hline(x - 2, x + w + 1, y + h + 1, C.silver); fb.hline(x - 2, x + w + 1, y + h + 2, C.steel);
}
function railing(fb, x0, x1, y, h = 7) {
  fb.hline(x0, x1, y - h + 1, C.ink); fb.hline(x0, x1, y, C.ink);
  for (let x = x0; x <= x1; x += 3) { fb.vline(x, y - h - 1, y, C.ink); fb.px(x, y - h - 2, C.dslate); }
}

// ————————————— STREET (shot A) —————————————
// cam: horizontal camera (px at pavement layer), tilt: px the camera is tilted up (0 = street framed)
export const ST = { ground: 128, road0: 100, road1: 113 };
const HOUSES = [];
{ const walls = ['stock', 'stucco', 'red', 'stock', 'stucco', 'stock', 'red'], doors = [C.navy, C.red, C.dgreen, C.plum, C.teal, C.amber, C.navy];
  let x = -60; for (let i = 0; i < 9; i++) { if (i === 6) { HOUSES.push({ x, w: 100, school: true }); x += 100; continue; } HOUSES.push({ x, w: 46, wall: walls[i % 7], door: doors[(i * 3) % 7], i }); x += 46; } }
export const SCHOOL_X = HOUSES.find(h => h.school).x;   // house-layer coordinate

function brick(fb, x0, y0, w, h, base, mortar, dark, seed) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const X = x0 + x, Y = y0 + y, row = y >> 2, off = row % 2 ? 4 : 0;
    let c = base;
    if (y % 4 === 3 || (x + off) % 8 === 0) c = mortar;
    else if (hash((x + off) >> 3, row, seed) < .18) c = dark;
    fb.px(X, Y, c);
  }
}
function house(fb, hx, top, gy, hs) {
  const { w, wall, door, i } = hs;
  const base = wall === 'red' ? C.clay : wall === 'stucco' ? C.cream : C.sand;
  const mortar = wall === 'red' ? C.tan : wall === 'stucco' ? C.creamD : C.cream;
  const dark = wall === 'red' ? C.rust : wall === 'stucco' ? C.creamD : C.tan;
  // roof: slate + chimney
  fb.rect(hx, top - 4, w, 4, C.dslate); fb.hline(hx, hx + w - 1, top - 4, C.slate);
  const cx = hx + (i % 2 ? 6 : w - 16);
  fb.rect(cx, top - 13, 10, 9, wall === 'red' ? C.rust : C.tan); fb.hline(cx - 1, cx + 10, top - 13, C.creamD);
  for (let k = 0; k < 3; k++) { fb.rect(cx + 1 + k * 3, top - 17, 2, 4, C.clay); fb.px(cx + 1 + k * 3, top - 17, C.tan); }
  // wall
  if (wall === 'stucco') { fb.rect(hx, top, w, gy - top, C.cream); for (let y = top + 3; y < gy; y += 5) fb.hline(hx, hx + w - 1, y, C.creamD); }
  else brick(fb, hx, top, w, gy - 22 - top, base, mortar, dark, i * 7 + 3);
  // stucco ground floor + cornice
  fb.rect(hx, gy - 22, w, 22, C.cream); for (let y = gy - 19; y < gy; y += 4) fb.hline(hx, hx + w - 1, y, C.creamD);
  fb.rect(hx, top, w, 2, C.white); fb.hline(hx, hx + w - 1, top + 2, C.creamD);
  fb.vline(hx, top, gy, C.creamD);
  // windows: two floors × 2
  for (const fy of [top + 6, top + 26]) for (const fx of [hx + 7, hx + w - 17]) windowSash(fb, fx, fy, 10, 15);
  // ground floor: bay window + door with fanlight
  windowSash(fb, hx + w - 20, gy - 18, 13, 13);
  const dx = hx + 7;
  fb.rect(dx - 2, gy - 22, 13, 22, C.white); fb.rect(dx - 1, gy - 21, 11, 21, C.creamD);
  fb.rect(dx, gy - 15, 9, 15, door); fb.rect(dx + 1, gy - 13, 3, 5, C.ink); fb.rect(dx + 5, gy - 13, 3, 5, C.ink);
  fb.rect(dx + 1, gy - 7, 3, 5, C.ink); fb.rect(dx + 5, gy - 7, 3, 5, C.ink);
  fb.rect(dx + 1, gy - 12, 2, 4, door); fb.rect(dx + 5, gy - 12, 2, 4, door); fb.rect(dx + 1, gy - 6, 2, 4, door); fb.rect(dx + 5, gy - 6, 2, 4, door);
  fb.px(dx + 7, gy - 8, C.yellow);
  for (let k = 0; k < 9; k++) fb.px(dx + k, gy - 19 + (k === 0 || k === 8 ? 2 : k === 1 || k === 7 ? 1 : 0), C.ink);
  fb.rect(dx + 1, gy - 18, 7, 2, C.skyL);
  railing(fb, hx + 19, hx + w - 22, gy + 1, 6);
}
function school(fb, hx, top, gy, t, signLit) {
  const w = 100, t2 = top - 10;
  brick(fb, hx, t2, w, gy - t2, C.clay, C.tan, C.rust, 99);
  // gable + cornice
  for (let y = 0; y < 12; y++) fb.hline(hx + 50 - (12 - y) * 3.6, hx + 50 + (12 - y) * 3.6, t2 - 12 + y, y === 0 ? C.creamD : C.cream);
  fb.disc(hx + 50, t2 - 4, 3, C.ink); fb.disc(hx + 50, t2 - 4, 2, C.white); fb.px(hx + 50, t2 - 5, C.ink); fb.px(hx + 51, t2 - 4, C.ink);
  fb.rect(hx - 2, t2, w + 4, 3, C.cream); fb.hline(hx - 2, hx + w + 1, t2 + 3, C.creamD);
  for (const fx of [hx + 8, hx + 30, hx + 60, hx + 82]) { windowSash(fb, fx, t2 + 8, 10, 18); }
  // sign board
  const s = 'ENGLISH SCHOOL', tw = textW(s), bx = hx + 50 - (tw >> 1) - 5, by = t2 + 31;
  fb.rect(bx - 1, by - 1, tw + 12, 13, C.ink); fb.rect(bx, by, tw + 10, 11, C.amber); fb.rect(bx + 1, by + 1, tw + 8, 9, C.navy);
  text(fb, s, bx + 5, by + 2, signLit ? C.yellow : C.cream, C.ink);
  // ground floor: arched entrance
  fb.rect(hx, gy - 24, w, 24, C.cream); for (let y = gy - 21; y < gy; y += 4) fb.hline(hx, hx + w - 1, y, C.creamD);
  for (const fx of [hx + 8, hx + 78]) windowSash(fb, fx, gy - 19, 14, 14);
  fb.rect(hx + 36, gy - 22, 28, 22, C.white); fb.rect(hx + 39, gy - 19, 22, 19, C.tlD);
  fb.rect(hx + 40, gy - 18, 9, 18, C.tl); fb.rect(hx + 51, gy - 18, 9, 18, C.tl);
  fb.vline(hx + 50, gy - 18, gy - 1, C.ink); fb.px(hx + 48, gy - 9, C.yellow); fb.px(hx + 52, gy - 9, C.yellow);
  fb.rect(hx + 35, gy, 30, 2, C.silver); fb.hline(hx + 35, hx + 64, gy + 2, C.steel);
  // two potted bay trees
  for (const px_ of [hx + 30, hx + 68]) { fb.rect(px_, gy - 5, 5, 5, C.dslate); fb.disc(px_ + 2, gy - 10, 4, C.dgreen); fb.px(px_ + 1, gy - 12, C.green); fb.px(px_ + 3, gy - 11, C.green); }
  return { doorX: hx + 50, doorY: gy };
}
// distant skyline + clock tower (hazy, high-luminance blues)
function farCity(fb, off, ty) {
  const base = 52 + Math.round(ty * .55);
  for (let x = 0; x < W; x++) {
    const wx = x + off, hgt = 10 + Math.floor(hash(wx >> 4, 7) * 12) + (((wx >> 4) % 5) === 0 ? 9 : 0);
    for (let y = base - hgt; y < base; y++) fb.px(x, y, ((wx & 15) === 0 || (y - base) % 7 === 0 && (wx & 3) === 1) ? C.steel : C.silver);
  }
  // clock tower
  const tx = 156 - off, ty0 = base - 50;
  const P = (x, y, w, h, c) => fb.rect(tx + x, ty0 + y, w, h, c);
  P(-8, 30, 16, 66, C.steel); P(4, 30, 4, 66, C.slate); P(-8, 30, 2, 66, C.silver);
  for (let y = 34; y < 96; y += 6) { P(-5, y, 2, 4, C.slate); P(-1, y, 2, 4, C.slate); P(3, y, 2, 4, C.dslate); }
  P(-10, 10, 20, 20, C.steel); P(6, 10, 4, 20, C.slate); P(-10, 10, 2, 20, C.silver); P(-11, 9, 22, 2, C.silver); P(-11, 29, 22, 2, C.slate);
  fb.disc(tx, ty0 + 20, 7, C.steel); fb.disc(tx, ty0 + 20, 6, C.white); fb.disc(tx, ty0 + 20, 1, C.amber);
  fb.line(tx, ty0 + 20, tx, ty0 + 15, C.slate); fb.line(tx, ty0 + 20, tx + 3, ty0 + 21, C.slate);
  for (let a = 0; a < 12; a++) fb.px(Math.round(tx + Math.sin(a / 6 * Math.PI) * 5), Math.round(ty0 + 20 - Math.cos(a / 6 * Math.PI) * 5), C.steel);
  for (let y = 0; y < 10; y++) P(-8 + Math.round(y * .8), y, 16 - Math.round(y * 1.6), 1, y < 4 ? C.slate : C.steel);
  P(-1, -8, 2, 9, C.slate); P(0, -11, 1, 3, C.slate); fb.px(tx, ty0 - 12, C.amber);
  P(-12, 4, 2, 6, C.slate); P(10, 4, 2, 6, C.slate); fb.px(tx - 12, ty0 + 2, C.amber); fb.px(tx + 11, ty0 + 2, C.amber);
  return base;
}
// double-decker bus (faces left), x = front-left, y = road surface
export function bus(fb, x, y, t) {
  const R = (a, b, w, h, c) => fb.rect(x + a, y + b, w, h, c);
  const L = 74, Hh = 44;
  R(1, -Hh, L - 2, Hh - 3, C.ink); R(0, -Hh + 1, L, Hh - 5, C.ink);
  R(1, -Hh + 1, L - 2, Hh - 6, C.red); R(1, -Hh + 1, L - 2, 2, C.pink); R(1, -8, L - 2, 3, C.crimson);
  R(1, -24, L - 2, 3, C.cream);
  for (let k = 0; k < 6; k++) { R(5 + k * 11, -Hh + 5, 9, 11, C.ink); R(6 + k * 11, -Hh + 6, 7, 9, C.dslate); fb.px(x + 6 + k * 11, y - Hh + 6, C.skyL); fb.px(x + 7 + k * 11, y - Hh + 6, C.skyL); fb.px(x + 6 + k * 11, y - Hh + 7, C.skyL); }
  for (let k = 0; k < 5; k++) { if (k === 0) continue; R(5 + k * 13, -19, 11, 10, C.ink); R(6 + k * 13, -18, 9, 8, C.dslate); fb.px(x + 6 + k * 13, y - 18, C.skyL); fb.px(x + 7 + k * 13, y - 18, C.skyL); }
  R(4, -20, 10, 15, C.ink); R(5, -19, 4, 13, C.slate); R(10, -19, 3, 13, C.slate);   // door
  R(2, -Hh + 2, 2, 2, C.ink);
  fb.px(x, y - 9, C.yellow); fb.px(x, y - 10, C.white);
  const spin = Math.floor(t * 12) % 2;
  for (const wx of [14, 58]) { fb.disc(x + wx, y - 3, 5, C.ink); fb.disc(x + wx, y - 3, 2, C.steel); fb.px(x + wx + (spin ? 1 : -1), y - 3 - (spin ? 1 : -1), C.white); R(wx - 7, -9, 14, 2, C.crimson); }
}
function lamp(fb, x, gy) {
  fb.rect(x, gy - 44, 2, 44, C.ink); fb.rect(x - 1, gy - 4, 4, 4, C.ink); fb.px(x + 1, gy - 40, C.dslate);
  fb.rect(x - 3, gy - 52, 8, 8, C.ink); fb.rect(x - 2, gy - 51, 6, 6, C.cream); fb.hline(x - 4, x + 5, gy - 53, C.ink); fb.px(x, gy - 55, C.ink); fb.px(x + 1, gy - 55, C.ink);
}
function phoneBox(fb, x, gy) {
  fb.rect(x, gy - 40, 16, 40, C.ink); fb.rect(x + 1, gy - 39, 14, 39, C.red); fb.rect(x + 13, gy - 39, 2, 39, C.crimson);
  fb.rect(x - 1, gy - 42, 18, 3, C.ink); fb.rect(x, gy - 41, 16, 1, C.red); fb.rect(x + 2, gy - 37, 12, 3, C.ink); fb.rect(x + 3, gy - 36, 10, 1, C.white);
  for (let j = 0; j < 6; j++) for (let i = 0; i < 3; i++) { fb.rect(x + 3 + i * 4, gy - 31 + j * 4, 3, 3, C.dslate); fb.px(x + 3 + i * 4, gy - 31 + j * 4, C.skyL); }
}

export function street(fb, t, cam, tilt, busX) {
  // sky (dithered bands), clouds
  const sy = Math.round(tilt * .25);
  for (let y = 0; y < H; y++) {
    const v = (y - sy + 40) / 150;
    for (let x = 0; x < W; x++) fb.d[y * W + x] = bayer(x, y) < v * 1.6 - .2 ? C.skyL : C.sky;
  }
  for (const [cx, cy, s] of [[30, 26, 1], [150, 12, 1], [250, 34, 1], [380, 18, 1]]) cloud(fb, Math.round(cx - cam * .08 - t * 2) % 420 + (cx - cam * .08 - t * 2 < -40 ? 420 : 0), cy + Math.round(tilt * .3), s);
  // far city + tower
  farCity(fb, Math.round(cam * .2), tilt);
  // houses across the road
  const hoff = Math.round(cam * .7), top = 34 + tilt, gy = ST.road0 + tilt;
  for (const hs of HOUSES) {
    const hx = hs.x - hoff; if (hx > W + 10 || hx + hs.w < -10) continue;
    if (hs.school) school(fb, hx, top, gy, t, t > 5.75); else house(fb, hx, top, gy, hs);
  }
  // far pavement + kerb
  fb.rect(0, gy, W, 3, C.silver); fb.hline(0, W - 1, gy + 3, C.steel);
  // road
  const r0 = gy + 4, r1 = ST.road1 + tilt;
  for (let y = r0; y < r1; y++) for (let x = 0; x < W; x++) fb.px(x, y, (bayer(x, y) < .12) ? C.slate : C.dslate);
  const roff = Math.round(cam * .85);
  for (let x = 0; x < W; x++) if (((x + roff) % 24) < 12) fb.px(x, Math.round((r0 + r1) / 2), C.white);
  if (busX !== null) bus(fb, Math.round(busX), r1 - 2, t);
  // near pavement (Youssef's layer)
  const p0 = r1, gy2 = ST.ground + tilt;
  fb.rect(0, p0, W, 2, C.steel); fb.hline(0, W - 1, p0, C.white);
  for (let y = p0 + 2; y < H; y++) for (let x = 0; x < W; x++) {
    const wx = x + cam, slab = ((y - p0) % 9 === 0) || ((wx + (((y - p0) / 9 | 0) % 2) * 9) % 18 === 0);
    fb.px(x, y, slab ? C.steel : (bayer(x, y) < .08 ? C.white : C.silver));
  }
  // street furniture on the near pavement
  for (const lx of [60, 330, 520]) { const X = lx - cam; if (X > -10 && X < W + 10) lamp(fb, X, p0 + 3); }
  { const X = 104 - cam; if (X > -20 && X < W + 4) phoneBox(fb, X, p0 + 4); }
  return { gy: gy2 };
}

// ————————————— SCHOOL ENTRANCE (shot B, 3/4 view) —————————————
export const SB = { doorX: 160, stepY: 106, ground: 129 };
export function entrance(fb, t, open, camY = 0) {
  const oy = camY;
  // wall: red brick across the whole top
  brick(fb, 0, 0, W, 104 + oy, C.clay, C.tan, C.rust, 51);
  // cornice + top band
  // windows (with flower boxes)
  for (const wx of [20, 72, 228, 280]) {
    windowSash(fb, wx - 11, 22 + oy, 22, 34);
    fb.rect(wx - 13, 58 + oy, 26, 5, C.dbrown); fb.hline(wx - 13, wx + 12, 58 + oy, C.brown);
    for (let k = 0; k < 12; k++) { const fx = wx - 12 + k * 2, c = [C.red, C.pink, C.yellow, C.white][(k * 7 + wx) % 4]; fb.px(fx, 56 + oy - (k % 2), C.green); fb.px(fx, 55 + oy - (k % 2), c); fb.px(fx + 1, 57 + oy, C.dgreen); }
  }
  // ground-floor stucco band
  fb.rect(0, 70 + oy, W, 36, C.cream); for (let y = 74; y < 106; y += 5) fb.hline(0, W - 1, y + oy, C.creamD);
  fb.hline(0, W - 1, 70 + oy, C.white); fb.hline(0, W - 1, 71 + oy, C.creamD);
  for (const wx of [32, 288]) windowSash(fb, wx - 12, 78 + oy, 24, 20);
  // sign
  const s = 'ENGLISH SCHOOL', tw = textW(s, 1), bx = 160 - (tw >> 1) - 8, by = 32 + oy;
  fb.rect(bx - 2, by - 2, tw + 20, 19, C.ink); fb.rect(bx - 1, by - 1, tw + 18, 17, C.amber); fb.rect(bx, by, tw + 16, 15, C.musD);
  fb.rect(bx + 1, by + 1, tw + 14, 13, C.navy); fb.hline(bx + 1, bx + tw + 14, by + 1, C.blue);
  text(fb, s, bx + 8, by + 4, C.yellow, C.ink);
  fb.px(bx + 3, by + 7, C.amber); fb.px(bx + tw + 12, by + 7, C.amber);
  // door surround (stone, arched) + fanlight
  const dx = 160, top = 54 + oy, bot = 104 + oy;
  for (let y = top; y < bot; y++) { const hw = 21; fb.hline(dx - hw, dx + hw - 1, y, y < top + 2 ? C.white : C.cream); }
  fb.vline(dx - 21, top, bot, C.creamD); fb.vline(dx + 20, top, bot, C.creamD);
  for (let y = 0; y < 12; y++) { const hw = Math.round(Math.sqrt(Math.max(0, 1 - ((12 - y) / 12) ** 2)) * 14); if (hw > 0) fb.hline(dx - hw, dx + hw - 1, top + 3 + y, C.ink); const h2 = Math.max(0, hw - 1); for (let x = dx - h2; x < dx + h2; x++) fb.px(x, top + 4 + y, bayer(x, y) < .3 + y / 24 ? C.amber : C.yellow); }
  for (let k = -2; k <= 2; k++) fb.line(dx, top + 15, dx + k * 5, top + 6, C.white);
  fb.hline(dx - 15, dx + 14, top + 15, C.white);
  // doorway: interior (warm) shows as the two leaves swing in
  const L = top + 16, Hd = bot - L;
  for (let y = L; y < bot; y++) for (let x = dx - 14; x < dx + 14; x++) {
    const v = (y - L) / Hd; fb.px(x, y, bayer(x, y) < v * .9 ? C.brown : bayer(x, y) < .55 ? C.umber : C.dbrown);
  }
  // warm light on the interior floor
  for (let y = bot - 10; y < bot; y++) for (let x = dx - 12; x < dx + 12; x++) if (bayer(x, y) < .5 * (1 - Math.abs(x - dx) / 12)) fb.px(x, y, C.amber);
  const leafW = Math.round(14 * (1 - open));
  for (const side of [-1, 1]) {
    const x0 = side < 0 ? dx - 14 : dx + 14 - leafW;
    if (leafW <= 0) continue;
    fb.rect(x0, L, leafW, Hd, C.tlD);
    if (leafW > 3) { fb.rect(x0 + 1, L + 1, leafW - 2, Hd - 2, C.tl); fb.rect(x0 + 2, L + 3, leafW - 4, 11, C.tlD); fb.rect(x0 + 3, L + 4, leafW - 6, 9, C.tl); fb.rect(x0 + 2, L + 18, leafW - 4, 13, C.tlD); fb.rect(x0 + 3, L + 19, leafW - 6, 11, C.tl); fb.vline(x0 + 1, L + 1, bot - 1, C.tlL); }
    if (leafW > 6) fb.px(side < 0 ? x0 + leafW - 2 : x0 + 1, L + 17, C.yellow);
    if (open > 0) { // dark edge of the swinging leaf
      fb.vline(side < 0 ? x0 + leafW : x0 - 1, L, bot - 1, C.ink);
      if (leafW > 0) fb.vline(side < 0 ? x0 : x0 + leafW - 1, L, bot - 1, C.tlD);
    }
  }
  fb.vline(dx - 15, L, bot, C.ink); fb.vline(dx + 14, L, bot, C.ink); fb.hline(dx - 15, dx + 14, L - 1, C.ink);
  // steps
  fb.rect(dx - 26, bot, 52, 3, C.silver); fb.hline(dx - 26, dx + 25, bot, C.white); fb.hline(dx - 26, dx + 25, bot + 3, C.steel);
  fb.rect(dx - 30, bot + 4, 60, 3, C.silver); fb.hline(dx - 30, dx + 29, bot + 4, C.white); fb.hline(dx - 30, dx + 29, bot + 7, C.steel);
  // potted bay trees beside the door
  for (const px_ of [dx - 34, dx + 34]) {
    fb.rect(px_ - 5, bot - 7, 10, 9, C.ink); fb.rect(px_ - 4, bot - 6, 8, 7, C.dslate); fb.hline(px_ - 4, px_ + 3, bot - 6, C.slate);
    fb.rect(px_, bot - 13, 1, 7, C.dbrown);
    fb.disc(px_, bot - 19, 7, C.ink); fb.disc(px_, bot - 19, 6, C.dgreen); fb.disc(px_ - 1, bot - 21, 4, C.green); fb.px(px_ - 3, bot - 23, C.lime); fb.px(px_ - 2, bot - 24, C.lime); fb.px(px_ + 2, bot - 21, C.lime);
  }
  // pavement
  for (let y = bot + 8; y < H; y++) for (let x = 0; x < W; x++) {
    const slab = ((y - bot - 8) % 10 === 0) || ((x + (((y - bot - 8) / 10 | 0) % 2) * 10) % 20 === 0);
    fb.px(x, y, slab ? C.steel : (bayer(x, y) < .06 ? C.white : C.silver));
  }
  fb.hline(0, W - 1, bot + 8, C.slate);
  // wall base at pavement
  fb.rect(0, bot, dx - 30, 8, C.creamD); fb.rect(dx + 30, bot, W - dx - 30, 8, C.creamD); fb.hline(0, W - 1, bot, C.white);
  railing(fb, 2, dx - 44, bot + 7, 9); railing(fb, dx + 44, W - 3, bot + 7, 9);
  return { doorX: dx, bot };
}
