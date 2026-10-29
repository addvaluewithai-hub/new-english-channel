// The static page: a London street drawn in Youssef's sketchbook (5120×2880 world units = the whole page).
// buildLayers() bakes it into two canvases: col (paper-white based watercolour, multiplied) and ink (sepia lines, transparent).
// The same deterministic drawing runs twice: the whole page at 1×, and the school area at 2.5× for the close shots.
import { rng, fbm, n2, hex, mix3, lerp, clamp, ellipse, spline, penStroke, drawPenFast, wash, reserve, dab, foliage, INK, TAU } from './engine.js';

export const W = 5120, H = 2880;
export const GROUND = 2290;                 // building line
export const WALK_Y = 2392;                 // Youssef's feet on the pavement
export const KERB = 2448;
export const ORIGIN = [1950, 2200];         // the sketch grows outward from Youssef's first spot
export const SCHOOL = { x0: 3150, x1: 4750, top: 820, gable: [3600, 4200, 600] };
export const DOOR = { x0: 3832, x1: 3968, top: 1885, base: 2226, cx: 3900 };
export const SIGN = { x0: 3640, x1: 4160, y0: 1712, y1: 1808, text: 'ENGLISH SCHOOL' };
export const DETAIL = { x0: 2700, y0: 1400, w: 1900, h: 1380, scale: 2.5 };
export const insideSchool = (x, y) => x > SCHOOL.x0 - 10 && x < SCHOOL.x1 + 10 && y > (x > SCHOOL.gable[0] && x < SCHOOL.gable[1] ? SCHOOL.gable[2] - 20 : SCHOOL.top - 120) && y < GROUND + 5;

const C = {
  sky: hex('#9fbcd6'), skyDeep: hex('#86a6c8'), cloud: hex('#b7b3c9'), haze: hex('#b9c0cc'),
  lime: hex('#d8c6a0'), stone: hex('#cdbb98'), plinth: hex('#a9a497'),
  brickR: hex('#c98f6e'), brickY: hex('#d6b98a'), stucco: hex('#e9dfcc'), paleBlue: hex('#b9c7cc'), sage: hex('#c3c9a4'),
  slate: hex('#8b93a6'), glass: hex('#98b1c8'), pave: hex('#d8ccb1'), road: hex('#a3a6a6'),
  doorB: hex('#4f6f9a'), doorG: hex('#4f7a5a'), doorR: hex('#b8483e'), doorY: hex('#e2b04a'), doorT: hex('#2f6a6a'),
  signB: hex('#34465e'), lamp: hex('#3c4640'), bark: hex('#9a8a72'), barkD: hex('#6e604f'),
};
const VIOLET = [90, 95, 130];
const shade = (c, k = .45) => mix3(c, VIOLET, k);

function cv(w, h, fill) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d', { willReadFrequently: true }); if (fill) { x.fillStyle = fill; x.fillRect(0, 0, w, h); } return [c, x]; }

// noisy page boundary: >0 inside the painted area
export function pageMask(x, y) {
  const n = (fbm(x * .004, y * .004, 5, 3) - .5) * 170 + (n2(x * .03, y * .03, 8) - .5) * 40;
  return Math.min(x - 120 + n, W - 120 - x + n, y - 110 + n, H - 120 - y + n * .7);
}

// ---------- paper (low resolution: only the large-scale mottling; the tooth is a tiled pattern drawn every frame) ----------
export function buildPaper() {
  const s = .25, w = W * s, h = H * s, [c, x] = cv(w, h); const im = x.createImageData(w, h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const wx = i / s, wy = j / s, m = fbm(wx * .0011, wy * .0011, 1, 4) * .6 + fbm(wx * .0062 + 9, wy * .0062, 2, 3) * .4;
    const k = 1 - .06 * (m - .45), q = (j * w + i) * 4;
    im.data[q] = 245 * k; im.data[q + 1] = 238 * k; im.data[q + 2] = 222 * k; im.data[q + 3] = 255;
  }
  x.putImageData(im, 0, 0); return { canvas: c, scale: s, x0: 0, y0: 0 };
}

export function buildLayers(o = {}) {
  const sc = o.scale ?? 1, X0 = o.x0 ?? 0, Y0 = o.y0 ?? 0, ww = o.w ?? W, hh = o.h ?? H, lwK = o.lwK ?? 1;
  const cw = Math.ceil(ww * sc), ch = Math.ceil(hh * sc);
  const [colC, cx] = cv(cw, ch, '#fff'), [inkC, ix] = cv(cw, ch);
  for (const c of [cx, ix]) c.setTransform(sc, 0, 0, sc, -X0 * sc, -Y0 * sc);
  const strokes = [];
  const R = rng(4242); let sid = 1;
  // ---- pen ----
  const pen = (pts, op = {}, tShift = 0) => {
    const st = penStroke(pts, { w: 2.2, wob: 1.1, over: 5, gap: .4, seed: sid++, ...op });
    if (st.P.length < 2) return st;
    drawPenFast(ix, st, 1, INK, .95, lwK);
    if (o.strokes) {
      const m = st.P[st.P.length >> 1], d = Math.hypot(m[0] - ORIGIN[0], (m[1] - ORIGIN[1]) * 1.25);
      const t0 = .05 + d / 3300 + R() * .12 + tShift, du = clamp(st.L / 2400, .04, .3);
      strokes.push({ st, t0, du });
    } else R();
    return st;
  };
  const line = (x0, y0, x1, y1, op, ts = 0) => pen([[x0, y0], [x1, y1]], { smooth: false, ...op }, ts);
  const rectInk = (x0, y0, x1, y1, op = {}) => { const j = () => (R() - .5) * 3; line(x0 + j(), y0, x1 + j(), y0 + j(), op); line(x1, y0 + j(), x1 + j(), y1, op); line(x1 + j(), y1, x0, y1 + j(), op); line(x0, y1 + j(), x0 + j(), y0, op); };
  const erase = (poly) => { ix.save(); ix.globalCompositeOperation = 'destination-out'; ix.fillStyle = '#000'; ix.beginPath(); poly.forEach((p, i) => i ? ix.lineTo(p[0], p[1]) : ix.moveTo(p[0], p[1])); ix.closePath(); ix.fill(); ix.restore(); };
  const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  const archWin = (x, y0, y1, hw, op = {}) => {   // arched window: sides + semicircle head + sill
    const arc = []; for (let k = 0; k <= 10; k++) { const a = Math.PI + k / 10 * Math.PI; arc.push([x + Math.cos(a) * hw, y0 + Math.sin(a) * hw]); }
    pen([[x - hw, y1], [x - hw, y0], ...arc.slice(1, -1), [x + hw, y0], [x + hw, y1]], { w: op.w ?? 2, smooth: false });
    line(x - hw - 10, y1 + 4, x + hw + 12, y1 + 2, { w: op.w ?? 2 });
    if (!op.noBar) { line(x, y0 - hw + 6, x, y1 - 4, { w: (op.w ?? 2) * .7, gap: .5 }); line(x - hw + 4, (y0 + y1) / 2 + 10, x + hw - 4, (y0 + y1) / 2 + 12, { w: (op.w ?? 2) * .7 }); }
    const g = [[x - hw, y1], [x - hw, y0], ...arc, [x + hw, y1]];
    wash(cx, g, C.glass, { a: .38, j: 3, layers: 2, edge: .3, dx: 3, dy: 2, seed: sid * 3 });
    reserve(cx, [[x - hw * .6, y1 - 20], [x - hw * .2, y0 - hw * .5], [x, y0 - hw * .3], [x - hw * .35, y1 - 30]], .55, 2, sid);
  };
  const sash = (x0, y0, x1, y1, op = {}) => {
    rectInk(x0, y0, x1, y1, { w: op.w ?? 2 });
    line(x0 + 3, (y0 + y1) / 2, x1 - 3, (y0 + y1) / 2 + 2, { w: (op.w ?? 2) * .7, gap: .5 });
    line((x0 + x1) / 2, y0 + 4, (x0 + x1) / 2 + 1, y1 - 4, { w: (op.w ?? 2) * .55, gap: .6, alpha: .8 });
    line(x0 - 10, y1 + 6, x1 + 10, y1 + 5, { w: op.w ?? 2 });
    wash(cx, rect(x0, y0, x1, y1), C.glass, { a: .36, j: 3, layers: 2, edge: .3, dx: 3, dy: 2, seed: sid * 7 });
    reserve(cx, [[x0 + 10, y1 - 12], [x0 + (x1 - x0) * .45, y0 + 10], [x0 + (x1 - x0) * .6, y0 + 10], [x0 + 22, y1 - 12]], .5, 2, sid);
  };

  // ================= SKY =================
  for (let i = 0; i < 80; i++) {
    const x = 250 + R() * 4650, y = 160 + R() * 1050;
    if (x < 1250 && y < 520) continue;                       // the corner note's blank paper
    const k = clamp((y - 120) / 900), rx = 200 + R() * 360, ry = rx * (.3 + R() * .25);
    wash(cx, ellipse(x, y, rx, ry, 24, R()), R() < .3 ? C.skyDeep : C.sky, { a: .1 + .1 * k, j: rx * .18, layers: 3, edge: .1, seed: 1000 + i, freq: .006 });
  }
  const clouds = [[2150, 560, 300, 90], [2520, 500, 200, 70], [3500, 430, 320, 100], [3880, 520, 220, 80], [4500, 640, 230, 80], [900, 820, 210, 70]];
  for (const [x, y, rx, ry] of clouds) {
    const puff = []; for (let k = 0; k < 9; k++) { const a = Math.PI + k / 8 * Math.PI; puff.push([x + Math.cos(a) * rx * (.85 + .3 * R()), y + Math.sin(a) * ry * (1.2 + .6 * R())]); }
    puff.push([x + rx * .9, y + ry * .35], [x - rx * .9, y + ry * .35]);
    reserve(cx, spline(puff, 4, true), .85, 14, x);
    wash(cx, ellipse(x + rx * .05, y + ry * .3, rx * .8, ry * .3, 18), C.cloud, { a: .2, j: 10, edge: .1, seed: x | 0 });
    const top = spline(puff, 4, true).filter(p => p[1] < y); if (R() < .6) pen(top.slice(2, top.length - 4), { w: 1.3, wob: 1.5, gap: .7, alpha: .7 }, .25);
  }

  // ================= FAR CITY (haze) + clock tower =================
  const hazeW = (poly, col, a = .32) => wash(cx, poly, mix3(col, C.haze, .5), { a, j: 3, layers: 2, edge: .25, seed: sid * 5 });
  for (let x = 160; x < 3150;) {
    const w = 140 + R() * 260, top = 1000 + R() * 150, X1 = Math.min(3150, x + w);
    hazeW(rect(x, top, X1, 1250), R() < .5 ? C.stone : C.brickR, .26);
    pen([[x, top + 30], [x, top], [X1, top + (R() - .5) * 6]], { w: 1.2, wob: .8, gap: .7, alpha: .75, smooth: false }, .2);
    if (R() < .4) { const cxp = x + w * (.2 + R() * .6); line(cxp, top, cxp, top - 30 - R() * 30, { w: 1.1, alpha: .7 }, .2); }
    x = X1 + R() * 20;
  }
  for (let x = 4700; x < 5000; x += 160) { const top = 980 + R() * 120; hazeW(rect(x, top, x + 150, 1250), C.stone, .24); pen([[x, top + 30], [x, top], [x + 150, top]], { w: 1.2, smooth: false, alpha: .7 }, .2); }
  { // clock tower (generic Victorian), haze-mixed
    const tx = 1260, col = C.lime, sw = 1.5, CS = 650, BF = 560, SP = 330;   // clock stage top, belfry top, spire tip
    hazeW(rect(tx - 66, 770, tx + 66, 1180), col, .42); hazeW(rect(tx + 22, 770, tx + 66, 1180), shade(col), .2);
    hazeW(rect(tx - 80, CS, tx + 80, 770), col, .45);
    hazeW(rect(tx - 64, BF, tx + 64, CS), col, .42);
    hazeW([[tx - 64, BF], [tx, SP], [tx + 64, BF]], C.slate, .5);
    reserve(cx, ellipse(tx, 710, 44, 44, 24), .7, 0);
    wash(cx, ellipse(tx, 710, 44, 44, 24), hex('#efe6c8'), { a: .3, j: 1, edge: .3, seed: 9 });
    for (const [a, b, c2, d] of [[tx - 66, 1180, tx - 66, 770], [tx + 66, 1180, tx + 66, 770], [tx - 80, 770, tx + 80, 770], [tx - 80, CS, tx + 80, CS], [tx - 80, 770, tx - 80, CS], [tx + 80, 770, tx + 80, CS], [tx - 64, CS, tx - 64, BF], [tx + 64, CS, tx + 64, BF], [tx - 72, BF, tx + 72, BF]]) line(a, b, c2, d, { w: sw, gap: .5 }, .15);
    pen([[tx - 64, BF], [tx, SP - 2], [tx + 64, BF]], { w: sw, smooth: false }, .15);
    line(tx, SP, tx, SP - 40, { w: 1.2 }, .15);
    pen(ellipse(tx, 710, 44, 44, 22).concat([[tx + 44, 710]]), { w: sw, smooth: true }, .15);
    line(tx, 710, tx + 4, 683, { w: sw }, .2); line(tx, 710, tx + 23, 718, { w: sw }, .2);
    for (const dx of [-34, 0, 34]) pen([[dx + tx - 12, CS - 8], [dx + tx - 12, BF + 34], [dx + tx, BF + 18], [dx + tx + 12, BF + 34], [dx + tx + 12, CS - 8]], { w: 1.2, smooth: false }, .15);
    for (const dx of [-80, 80]) pen([[tx + dx - 8, CS], [tx + dx, CS - 46], [tx + dx + 8, CS]], { w: 1.2, smooth: false }, .15);
    for (let y = 820; y < 1160; y += 70) line(tx - 46, y, tx - 46, y + 40, { w: 1, alpha: .7 }, .2), line(tx + 46, y, tx + 46, y + 40, { w: 1, alpha: .7 }, .2);
  }

  // ================= TERRACED HOUSES =================
  const facades = [C.brickR, C.brickY, C.stucco, C.brickR, C.paleBlue, C.brickY];
  const doors = [C.doorB, C.doorR, C.doorG, C.doorY, C.doorR, C.doorB];
  for (let i = 0; i < 6; i++) {
    const x0 = 150 + i * 500, x1 = x0 + 500, col = facades[i], EAVE = 1240 + (i % 2) * 12;
    // colour
    wash(cx, rect(x0, EAVE, x1, GROUND), col, { a: col === C.stucco ? .3 : .5, j: 4, layers: 2, edge: .3, dx: 3, dy: 2, seed: 50 + i });
    for (let k = 0; k < 10; k++) { const x = x0 + 30 + R() * 440, y = EAVE + 60 + R() * 900, rx = 50 + R() * 120; wash(cx, ellipse(x, y, rx, rx * (.5 + R() * .4), 16, R()), R() < .5 ? mix3(col, [150, 80, 60], .3) : mix3(col, VIOLET, .3), { a: .06 + R() * .07, j: rx * .2, layers: 2, edge: .2, seed: 120 + i * 20 + k, freq: .01 }); }
    wash(cx, [[x0 - 12, EAVE], [x0 + 44, 1112], [x1 - 44, 1112], [x1 + 12, EAVE]], C.slate, { a: .5, j: 3, edge: .35, seed: 60 + i });
    wash(cx, rect(x1 - 46, 1020, x1 + 46, 1150), C.brickR, { a: .5, j: 2, edge: .3, seed: 70 + i });
    wash(cx, rect(x1 + 6, 1020, x1 + 46, 1150), shade(C.brickR), { a: .3, j: 2, edge: 0, seed: 71 + i });
    // ink: roof, chimney, cornice, party wall
    pen([[x0 - 14, EAVE + 2], [x0 + 44, 1112], [x1 - 44, 1114]], { w: 2, smooth: false });
    line(x0 - 16, EAVE, x1 + 14, EAVE + 2, { w: 2.2 }); line(x0 - 8, EAVE + 26, x1 + 8, EAVE + 26, { w: 1.6, gap: .6 });
    rectInk(x1 - 46, 1020, x1 + 46, 1112, { w: 2 });
    for (const dx of [-28, 0, 28]) { pen([[x1 + dx - 9, 1020], [x1 + dx - 7, 990], [x1 + dx + 7, 990], [x1 + dx + 9, 1020]], { w: 1.7, smooth: false }); wash(cx, rect(x1 + dx - 8, 990, x1 + dx + 8, 1020), hex('#c0704f'), { a: .55, j: 1, edge: .3, seed: 80 + i * 3 + dx }); }
    line(x1, EAVE + 30, x1 + 2, GROUND, { w: 1.6, gap: .6, alpha: .8 });
    if (i === 0) line(x0, EAVE, x0, GROUND, { w: 2 });
    // brick suggestion: a few short courses
    if (col !== C.stucco && col !== C.paleBlue) for (let k = 0; k < 9; k++) { const bx = x0 + 30 + R() * 420, by = 1320 + R() * 820; for (let r = 0; r < 3; r++) line(bx + r * 6, by + r * 16, bx + 40 + R() * 30 + r * 6, by + r * 16, { w: 1.1, alpha: .55, over: 1, gap: 0 }); }
    // first floor: two sash windows
    sash(x0 + 70, 1400, x0 + 190, 1660); sash(x0 + 280, 1400, x0 + 400, 1660);
    // ground floor: bay window (left) + door (right) with fanlight + steps
    const bx0 = x0 + 50, bx1 = x0 + 290;
    wash(cx, rect(bx0 - 8, 1800, bx1 + 8, 2240), C.stucco, { a: .35, j: 2, edge: .3, seed: 90 + i });
    wash(cx, rect(bx1 - 40, 1800, bx1 + 8, 2240), shade(C.stucco, .55), { a: .3, j: 2, edge: 0, seed: 91 + i });
    line(bx0 - 14, 1800, bx1 + 14, 1798, { w: 2.2 }); line(bx0 - 6, 1822, bx1 + 6, 1824, { w: 1.6 });
    line(bx0, 1822, bx0 + 1, 2240, { w: 2 }); line(bx1, 1824, bx1, 2240, { w: 2 }); line(bx1 - 40, 1824, bx1 - 40, 2240, { w: 1.5, gap: .5 });
    for (const [wx0, wx1] of [[bx0 + 16, bx1 - 132], [bx1 - 120, bx1 - 52]]) sash(wx0, 1860, wx1, 2150, { w: 1.8 });
    line(bx0 - 8, 2240, bx1 + 10, 2240, { w: 2 });
    const dx0 = x1 - 170, dx1 = x1 - 70, dcol = doors[i];
    wash(cx, rect(dx0 - 18, 1800, dx1 + 18, 2250), C.stucco, { a: .3, j: 2, edge: .2, seed: 95 + i });
    wash(cx, rect(dx0, 1905, dx1, 2238), dcol, { a: .62, j: 2, layers: 3, edge: .4, dx: 3, dy: 2, seed: 96 + i });
    wash(cx, rect(dx1 - 26, 1905, dx1, 2238), shade(dcol), { a: .3, j: 2, edge: 0, seed: 97 + i });
    const fan = []; for (let k = 0; k <= 10; k++) { const a = Math.PI + k / 10 * Math.PI; fan.push([(dx0 + dx1) / 2 + Math.cos(a) * 50, 1900 + Math.sin(a) * 50]); }
    wash(cx, [...fan, [dx1, 1900]], C.glass, { a: .35, j: 2, edge: .3, seed: 98 + i });
    pen([[dx0, 2238], [dx0, 1900], ...fan.slice(1, -1), [dx1, 1900], [dx1, 2238]], { w: 2, smooth: false });
    line(dx0 - 2, 1902, dx1 + 2, 1904, { w: 1.6 });
    for (let k = 1; k < 5; k++) { const a = Math.PI + k / 5 * Math.PI; line((dx0 + dx1) / 2, 1900, (dx0 + dx1) / 2 + Math.cos(a) * 44, 1900 + Math.sin(a) * 44, { w: 1, alpha: .7, over: 0 }); }
    rectInk(dx0 + 14, 1930, dx1 - 14, 2060, { w: 1.3 }); rectInk(dx0 + 14, 2090, dx1 - 14, 2210, { w: 1.3 });
    pen(ellipse(dx1 - 14, 2075, 4, 4, 8), { w: 2 });
    for (let s = 0; s < 3; s++) { const y = 2238 + s * 18; line(dx0 - 16 - s * 8, y, dx1 + 16 + s * 8, y + 1, { w: 1.8 }); }
    wash(cx, rect(dx0 - 30, 2238, dx1 + 30, GROUND), C.stone, { a: .35, j: 2, edge: .25, seed: 99 + i });
    // railings (only a suggestion, broken)
    const rx0 = x0 + 10, rx1 = dx0 - 40; line(rx0, 2214, rx1, 2216, { w: 1.7, gap: .7 });
    for (let x = rx0 + 6; x < rx1; x += 20) if (R() < .7) line(x, 2216, x + 1, GROUND - 2, { w: 1.2, alpha: .85, over: 2, gap: 0 });
    wash(cx, rect(rx0, 2212, rx1, 2224), hex('#33383a'), { a: .25, j: 1, edge: 0, seed: 101 + i });
  }

  // ================= SCHOOL =================
  {
    const S = SCHOOL, [gx0, gx1, gy] = S.gable, col = C.lime;
    wash(cx, rect(S.x0, S.top, S.x1, GROUND), col, { a: .55, j: 4, layers: 3, edge: .3, dx: 3, dy: 2, seed: 300 });
    wash(cx, [[gx0, S.top], [(gx0 + gx1) / 2, gy], [gx1, S.top]], col, { a: .55, j: 3, edge: .3, dx: 3, seed: 301 });
    wash(cx, rect(gx1 - 4, S.top, gx1 + 30, GROUND), shade(col), { a: .32, j: 2, edge: 0, seed: 302 });
    wash(cx, [[S.x0 - 20, S.top], [S.x0 + 40, S.top - 110], [gx0, S.top - 110], [gx0, S.top]], C.slate, { a: .5, j: 3, edge: .3, seed: 303 });
    wash(cx, [[gx1 + 30, S.top], [gx1 + 30, S.top - 110], [S.x1 - 40, S.top - 110], [S.x1 + 20, S.top]], C.slate, { a: .5, j: 3, edge: .3, seed: 304 });
    wash(cx, rect(S.x0, 2140, S.x1, GROUND), C.plinth, { a: .4, j: 3, edge: .3, seed: 305 });
    // watercolour variation on the wall: blotches, a warm glaze low, a cooler one high
    for (let k = 0; k < 46; k++) { const x = S.x0 + 40 + R() * (S.x1 - S.x0 - 80), y = 880 + R() * 1250, rx = 60 + R() * 170; wash(cx, ellipse(x, y, rx, rx * (.45 + R() * .4), 18, R()), R() < .5 ? mix3(col, C.brickR, .35) : mix3(col, VIOLET, .25), { a: .07 + R() * .08, j: rx * .2, layers: 2, edge: .2, seed: 360 + k, freq: .01 }); }
    for (let k = 0; k < 16; k++) { const x = S.x0 + 30 + R() * (S.x1 - S.x0 - 60), y = 900 + R() * 1200, ww = 50 + R() * 70; if (Math.abs(x - DOOR.cx) < 180 && y > 1700) continue; for (let r = 0; r < 3 + (R() * 3 | 0); r++) { const yy = y + r * 34, o = (r % 2) * 30; line(x + o, yy, x + o + ww, yy + (R() - .5) * 3, { w: 1.1, alpha: .5, over: 2, gap: 0 }); if (R() < .6) line(x + o + ww * .5, yy, x + o + ww * .5 + 1, yy + 34, { w: 1, alpha: .45, over: 1, gap: 0 }); } }
    for (let y = 1290; y < 2140; y += 280) wash(cx, rect(S.x0, y, S.x1, y + 26), hex('#c98f6e'), { a: .4, j: 2, edge: .25, seed: 306 + y });
    // ink: outline, cornice, gable, roof
    line(S.x0, GROUND, S.x0, S.top, { w: 2.4 }); line(S.x1, GROUND, S.x1 + 2, S.top, { w: 2.4 });
    line(S.x0 - 24, S.top, gx0 + 2, S.top + 2, { w: 2.4 }); line(gx1 - 2, S.top + 1, S.x1 + 24, S.top, { w: 2.4 });
    line(S.x0 - 10, S.top + 30, S.x1 + 10, S.top + 32, { w: 1.6, gap: .6 });
    pen([[gx0 - 30, S.top + 4], [(gx0 + gx1) / 2, gy - 18], [gx1 + 30, S.top + 4]], { w: 2.6, smooth: false });
    pen([[gx0 + 10, S.top - 6], [(gx0 + gx1) / 2, gy + 10], [gx1 - 10, S.top - 6]], { w: 1.5, smooth: false, gap: .6 });
    line(gx0 - 30, S.top + 4, gx1 + 30, S.top + 6, { w: 2 });
    line(gx0, S.top, gx0, GROUND, { w: 1.8, gap: .5 }); line(gx1 + 30, S.top + 6, gx1 + 30, GROUND, { w: 2 });
    pen([[S.x0 - 20, S.top], [S.x0 + 40, S.top - 110], [gx0, S.top - 110]], { w: 2, smooth: false });
    pen([[gx1 + 30, S.top - 110], [S.x1 - 40, S.top - 110], [S.x1 + 20, S.top]], { w: 2, smooth: false });
    // oculus in the gable
    const oc = ellipse((gx0 + gx1) / 2, 730, 46, 46, 22); wash(cx, oc, C.glass, { a: .38, j: 2, edge: .3, seed: 307 }); pen([...oc, oc[0], oc[1]], { w: 2 });
    line((gx0 + gx1) / 2 - 46, 730, (gx0 + gx1) / 2 + 46, 730, { w: 1.2 }); line((gx0 + gx1) / 2, 684, (gx0 + gx1) / 2, 776, { w: 1.2 });
    // string courses
    for (let y = 1290; y < 2140; y += 280) { line(S.x0 - 6, y, S.x1 + 6, y + 2, { w: 1.5, gap: .6 }); }
    line(S.x0 - 8, 2140, S.x1 + 8, 2142, { w: 2 });
    // windows: 3 floors
    const cols = [3270, 3450, 3730, 4070, 4350, 4560];
    for (const x of cols) archWin(x, 960, 1180, 52);
    for (const x of cols) archWin(x, 1400, 1640, 58);
    for (const x of [3270, 3450, 4350, 4560]) archWin(x, 1900, 2110, 58);
    // sign board above the door
    const sg = SIGN;
    reserve(cx, rect(sg.x0, sg.y0, sg.x1, sg.y1), .85, 2, 9);
    wash(cx, rect(sg.x0, sg.y0, sg.x1, sg.y1), hex('#f3ead2'), { a: .3, j: 2, edge: .2, seed: 310 });
    wash(cx, rect(sg.x0 - 10, sg.y0 - 10, sg.x1 + 10, sg.y0 + 2), C.signB, { a: .6, j: 1.5, edge: .3, seed: 311 });
    wash(cx, rect(sg.x0 - 10, sg.y1 - 2, sg.x1 + 10, sg.y1 + 10), C.signB, { a: .6, j: 1.5, edge: .3, seed: 312 });
    rectInk(sg.x0 - 10, sg.y0 - 10, sg.x1 + 10, sg.y1 + 10, { w: 2.2 }); line(sg.x0, sg.y0 + 2, sg.x1, sg.y0 + 3, { w: 1.3 }); line(sg.x0, sg.y1 - 2, sg.x1, sg.y1 - 1, { w: 1.3 });
    ix.save(); ix.font = `700 70px Caveat`; ix.textAlign = 'center'; ix.fillStyle = `rgba(${INK.join(',')},.95)`;
    ix.translate((sg.x0 + sg.x1) / 2, sg.y1 - 22); ix.rotate(-.006); ix.fillText(sg.text, 0, 0); ix.restore();
    // doorway: arch, door leaves, steps
    const D = DOOR, dc = D.cx, hw = (D.x1 - D.x0) / 2;
    const arc = []; for (let k = 0; k <= 12; k++) { const a = Math.PI + k / 12 * Math.PI; arc.push([dc + Math.cos(a) * (hw + 30), D.top + Math.sin(a) * (hw + 30)]); }
    wash(cx, [[dc - hw - 30, D.base], ...arc, [dc + hw + 30, D.base]], col, { a: .35, j: 2, edge: .3, seed: 320 });
    pen([[dc - hw - 30, D.base], ...arc, [dc + hw + 30, D.base]], { w: 2.4, smooth: false });
    const arcI = []; for (let k = 0; k <= 12; k++) { const a = Math.PI + k / 12 * Math.PI; arcI.push([dc + Math.cos(a) * hw, D.top + Math.sin(a) * hw]); }
    wash(cx, [[D.x0, D.base], ...arcI, [D.x1, D.base]], C.doorT, { a: .66, j: 2, layers: 3, edge: .4, dx: 3, dy: 2, seed: 321 });
    wash(cx, rect(D.x1 - 30, D.top - 40, D.x1, D.base), shade(C.doorT), { a: .3, j: 2, edge: 0, seed: 322 });
    pen([[D.x0, D.base], ...arcI, [D.x1, D.base]], { w: 2.2, smooth: false });
    line(dc, D.top - hw + 6, dc + 1, D.base, { w: 1.8 });
    for (const s of [-1, 1]) { rectInk(dc + s * 14 + (s < 0 ? -hw + 14 : 0), D.top + 20, dc + s * 14 + (s < 0 ? -14 : hw - 14), 2040, { w: 1.2 }); rectInk(dc + s * 14 + (s < 0 ? -hw + 14 : 0), 2070, dc + s * 14 + (s < 0 ? -14 : hw - 14), 2196, { w: 1.2 }); }
    pen(ellipse(dc - 14, 2058, 4, 4, 8), { w: 2 }); pen(ellipse(dc + 14, 2058, 4, 4, 8), { w: 2 });
    for (let s = 0; s < 3; s++) { const y = D.base + s * 21, ex = 40 + s * 22; wash(cx, rect(D.x0 - ex, y, D.x1 + ex, y + 21), C.stone, { a: .32, j: 1.5, edge: .3, seed: 330 + s }); line(D.x0 - ex, y, D.x1 + ex, y + 1, { w: 2 }); line(D.x0 - ex, y, D.x0 - ex, y + 21, { w: 1.6 }); line(D.x1 + ex, y, D.x1 + ex, y + 21, { w: 1.6 }); }
    // railings either side
    for (const [a, b] of [[S.x0 + 20, D.x0 - 120], [D.x1 + 120, S.x1 - 20]]) { line(a, 2214, b, 2216, { w: 1.8, gap: .5 }); for (let x = a + 8; x < b; x += 22) if (R() < .75) line(x, 2216, x, GROUND - 2, { w: 1.2, alpha: .85, over: 2, gap: 0 }); wash(cx, rect(a, 2210, b, 2222), hex('#2d3436'), { a: .25, j: 1, edge: 0, seed: 340 + a }); }
  }

  // ================= STREET =================
  wash(cx, rect(140, GROUND, 4990, KERB), C.pave, { a: .38, j: 6, layers: 2, edge: .15, seed: 400, freq: .01 });
  wash(cx, [[140, KERB + 8], [4990, KERB + 8], [4990, 2790], [140, 2800]], C.road, { a: .32, j: 10, layers: 3, edge: .1, seed: 401, freq: .006 });
  for (let x = 140; x < 4990; x += 600) wash(cx, ellipse(x + 250 + R() * 100, GROUND + 20, 260, 22, 16), shade(C.pave, .6), { a: .16, j: 6, edge: 0, seed: 402 + x });  // shade at the foot of the houses
  pen([[130, KERB], [1300, KERB + 2], [2600, KERB - 1], [3900, KERB + 2], [5000, KERB]], { w: 2.4, gap: .5 });
  pen([[140, KERB + 18], [2400, KERB + 19], [5000, KERB + 18]], { w: 1.6, gap: .6, alpha: .85 });
  pen([[130, GROUND], [2600, GROUND + 1], [5000, GROUND]], { w: 1.8, gap: .5 });
  for (let x = 220; x < 4950; x += 150 + R() * 90) line(x, KERB - 4, x - 30, KERB - 80 - R() * 30, { w: 1, alpha: .5, over: 0 });
  for (let x = 300; x < 4950; x += 420) line(x, 2620 + R() * 10, x + 170, 2622 + R() * 10, { w: 2.2, alpha: .8 });
  for (let k = 0; k < 18; k++) { const x = 200 + R() * 4700, y = 2520 + R() * 220; line(x, y, x + 60 + R() * 120, y + (R() - .5) * 6, { w: 1, alpha: .45, over: 1 }); }

  // ================= LAMP POST + TREES (in front: erase what's behind) =================
  { const x = 1560, top = 1620; wash(cx, rect(x - 7, top, x + 7, KERB), C.lamp, { a: .7, j: 1, edge: 0, seed: 500 }); erase(rect(x - 8, top - 80, x + 8, KERB));
    pen([[x - 6, KERB], [x - 5, top]], { w: 2.2, smooth: false }); pen([[x + 6, KERB], [x + 5, top]], { w: 2.2, smooth: false });
    const lan = [[x - 30, top - 4], [x - 40, top - 80], [x + 40, top - 80], [x + 30, top - 4]]; reserve(cx, lan, .8, 2, 3); wash(cx, lan, hex('#e8d9a0'), { a: .3, j: 1, edge: .2, seed: 501 }); erase(lan);
    pen([...lan, lan[0]], { w: 2, smooth: false }); pen([[x - 46, top - 80], [x, top - 118], [x + 46, top - 80]], { w: 2, smooth: false }); wash(cx, [[x - 46, top - 80], [x, top - 118], [x + 46, top - 80]], C.lamp, { a: .6, j: 1, edge: 0, seed: 502 });
    pen([[x - 26, KERB], [x - 14, KERB - 60], [x + 14, KERB - 60], [x + 26, KERB]], { w: 2, smooth: false }); }
  const tree = (tx, base, crown, seed) => {
    const sil = []; for (let k = 0; k < 40; k++) { const a = k / 40 * TAU; let r = 0; for (const c of crown) { const dx = Math.cos(a), dy = Math.sin(a); const b = (c.x - tx) * dx + (c.y - crown[0].y) * dy; const cc = (c.x - tx) ** 2 + (c.y - crown[0].y) ** 2 - c.r * c.r; const d = b + Math.sqrt(Math.max(0, b * b - cc)); r = Math.max(r, d); } sil.push([tx + Math.cos(a) * r, crown[0].y + Math.sin(a) * r]); }
    reserve(cx, sil, .8, 20, seed); erase(sil);
    const trunk = [[tx - 26, base], [tx - 16, crown[0].y + 60], [tx - 40, crown[0].y - 40], [tx - 8, crown[0].y + 20], [tx + 6, crown[0].y - 60], [tx + 14, crown[0].y + 50], [tx + 24, base]];
    reserve(cx, trunk, .85, 2, seed); erase(trunk);
    wash(cx, trunk, C.bark, { a: .55, j: 2, edge: .3, seed });
    for (let k = 0; k < 9; k++) { const y = base - 60 - R() * (base - crown[0].y - 60); dab(cx, tx + (R() - .5) * 26, y, 10 + R() * 8, R() * TAU, mix3(C.bark, [255, 255, 240], .5), .5, seed + k); dab(cx, tx + (R() - .5) * 26, y + 20, 8, R() * TAU, C.barkD, .35, seed + k + 9); }
    foliage(cx, crown, { seed, dens: 1.2 });
    pen([[tx - 26, base], [tx - 16, crown[0].y + 90]], { w: 2.4 }); pen([[tx + 24, base], [tx + 14, crown[0].y + 80]], { w: 2.4 });
    pen([[tx - 16, crown[0].y + 90], [tx - 40, crown[0].y - 40]], { w: 2 }); pen([[tx + 10, crown[0].y + 60], [tx + 6, crown[0].y - 60]], { w: 2 });
    // scalloped ink fragments along the outline only
    for (let k = 0; k < 14; k++) {
      const i0 = (k * 3 + (R() * 2 | 0)) % sil.length, pts = []; const n = 4 + (R() * 3 | 0);
      for (let q = 0; q < n; q++) { const a = sil[(i0 + q) % sil.length], b = sil[(i0 + q + 1) % sil.length]; const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, ox = mx - tx, oy = my - crown[0].y, l = Math.hypot(ox, oy) || 1; pts.push(a, [mx + ox / l * 18, my + oy / l * 18]); }
      if (R() < .75) pen(pts, { w: 2, wob: 1.4, gap: .3 });
    }
    pen([[tx - 70, base + 2], [tx + 80, base + 3]], { w: 1.6, alpha: .8 });
  };
  tree(640, KERB - 6, [{ x: 640, y: 1330, r: 250 }, { x: 470, y: 1420, r: 190 }, { x: 820, y: 1400, r: 210 }, { x: 600, y: 1160, r: 170 }, { x: 760, y: 1220, r: 160 }], 600);
  tree(4880, KERB - 6, [{ x: 4880, y: 1280, r: 230 }, { x: 4730, y: 1380, r: 170 }, { x: 5000, y: 1400, r: 160 }, { x: 4860, y: 1110, r: 160 }], 650);

  // ================= PAGE EDGE: granulation, white-dab band inside, coloured spray outside =================
  const GS = 8, gw = Math.ceil(W / GS) + 1, gh = Math.ceil(H / GS) + 1, M = new Float32Array(gw * gh);
  for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) M[j * gw + i] = pageMask(i * GS, j * GS);
  const mAt = (x, y) => { const fx = clamp(x / GS, 0, gw - 1.001), fy = clamp(y / GS, 0, gh - 1.001), i = fx | 0, j = fy | 0, u = fx - i, v = fy - j; const a = M[j * gw + i], b = M[j * gw + i + 1], c = M[(j + 1) * gw + i], d = M[(j + 1) * gw + i + 1]; return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v; };
  const TL = 256, G = new Float32Array(TL * TL), B = new Float32Array(TL * TL);
  for (let j = 0; j < TL; j++) for (let i = 0; i < TL; i++) { G[j * TL + i] = fbm(i * .21 + 1.7, j * .21, 31, 3); B[j * TL + i] = fbm(i * .09, j * .09, 37, 3); }
  {
    const im = cx.getImageData(0, 0, cw, ch), d = im.data, ik = ix.getImageData(0, 0, cw, ch), e = ik.data;
    for (let py = 0; py < ch; py++) {
      const wy = Y0 + (py + .5) / sc, ty = (wy | 0) & (TL - 1), by = ((wy / 2.2) | 0) & (TL - 1);
      for (let px = 0; px < cw; px++) {
        const wx = X0 + (px + .5) / sc, q = (py * cw + px) * 4;
        const m = mAt(wx, wy);
        if (m < -20) { e[q + 3] = 0; }
        let r = d[q], g = d[q + 1], b = d[q + 2];
        if (r === 255 && g === 255 && b === 255) continue;
        if (m < 0) { d[q] = d[q + 1] = d[q + 2] = 255; continue; }
        const gr = .82 + .36 * G[ty * TL + ((wx | 0) & (TL - 1))];
        let k = 1;
        if (m < 80) { const bn = B[by * TL + (((wx / 2.2) | 0) & (TL - 1))]; k = clamp((bn - (.25 + m / 80 * .5)) * -6 + .5); k = clamp(k + m / 160); }
        d[q] = 255 - (255 - r) * gr * k; d[q + 1] = 255 - (255 - g) * gr * k; d[q + 2] = 255 - (255 - b) * gr * k;
      }
    }
    cx.save(); cx.setTransform(1, 0, 0, 1, 0, 0); cx.putImageData(im, 0, 0); ix.setTransform(1, 0, 0, 1, 0, 0); ix.putImageData(ik, 0, 0); cx.restore();
    ix.setTransform(sc, 0, 0, sc, -X0 * sc, -Y0 * sc);
  }
  { // coloured dab spray just outside the boundary
    const RS = rng(77); cx.save(); cx.globalCompositeOperation = 'multiply';
    for (let k = 0; k < 900; k++) {
      const x = 80 + RS() * (W - 160), y = 60 + RS() * (H - 120), m = mAt(x, y), sz = 6 + RS() * 14, a = RS() * TAU, rr = RS();
      if (m > 0 || m < -70) continue;
      const col = y < 1150 ? C.sky : y < 2290 ? (x > 3150 && x < 4750 ? C.lime : C.brickY) : y < KERB ? C.pave : C.road;
      dab(cx, x, y, sz, a, col, .25 + rr * .3, k);
    }
    cx.restore();
  }
  return { col: colC, ink: inkC, scale: sc, x0: X0, y0: Y0, strokes };
}
