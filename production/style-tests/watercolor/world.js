// ---------- the painted street: world layout (main layer, 1 world px = 1 screen px at zoom 1) ----------
const HB = 745, GY = 772, KERB = 815, ROADB = 1000;
const OBJ = [];        // main-layer painted objects (houses, school)
const FRONT_OBJ = [];  // objects in front of the characters (lamps, tree)
const SKY_SEG = [];    // [x0, x1, y] roof tops for the sky clip
const skyY = wx => { for (const [a, b, y] of SKY_SEG) if (wx >= a && wx < b) return y; return 262; };

const GLASS = ['#6d8698', '#647d90', '#7690a1'], GLASS2 = '#3e5163';
const DOORS = ['#2f5f57', '#2d5687', '#5d3b56', '#1f2a36', '#3d5a3a', '#a2442f'];

// a rectangle filled with overlapping horizontal brush strokes, painted around holes (paper left as the white)
function fillR(S, x0, y0, x1, y1, col, o = {}) {
  const w = o.w ?? 34, gap = w * (o.ov ?? .7), holes = o.holes || [], a = o.a ?? .5, nb = o.nb ?? 4;
  for (let y = y0 + w * .38; y <= y1 - w * .25 + 1; y += gap) {
    let spans = [[x0, x1]];
    for (const [hx0, hy0, hx1, hy1] of holes) {
      if (y + w * .42 < hy0 || y - w * .42 > hy1) continue;
      const ns = []; for (const [a0, b0] of spans) { if (hx1 <= a0 || hx0 >= b0) { ns.push([a0, b0]); continue; } if (hx0 > a0) ns.push([a0, hx0]); if (hx1 < b0) ns.push([hx1, b0]); } spans = ns;
    }
    for (const [a0, b0] of spans) {
      if (b0 - a0 < 8) continue; const n = Math.max(3, Math.round((b0 - a0) / 26));
      S.push(mk(qcurve(a0 + rnd(-1, 3), y + rnd(-2, 2), b0 + rnd(-3, 1), y + rnd(-2, 2), rnd(-2.5, 2.5), n), w * rnd(.9, 1.08), Array.isArray(col) ? pick(col) : col, { prof: 'even', nb, a: a * rnd(.85, 1.1), rough: .16 }));
    }
  }
}
// vertical fill (doors, glass, bus bits)
function fillV(S, x0, y0, x1, y1, col, o = {}) {
  const w = o.w ?? 18, gap = w * (o.ov ?? .72);
  for (let x = x0 + w * .4; x <= x1 - w * .3 + 1; x += gap) S.push(mk(qcurve(x + rnd(-1, 1), y0 + rnd(0, 2), x + rnd(-1, 1), y1 - rnd(0, 2), rnd(-1.5, 1.5), Math.max(3, Math.round((y1 - y0) / 24))), w * rnd(.92, 1.06), Array.isArray(col) ? pick(col) : col, { prof: 'even', nb: o.nb ?? 3, a: (o.a ?? .6) * rnd(.9, 1.08), rough: .14 }));
}
const line = (S, x0, y0, x1, y1, w, col, a = .7, o = {}) => S.push(mk(qcurve(x0, y0, x1, y1, o.bend ?? rnd(-1, 1), o.n ?? Math.max(3, Math.round(Math.hypot(x1 - x0, y1 - y0) / 20))), w, col, { prof: o.prof || 'even', nb: o.nb ?? 0, a, rough: o.rough ?? .3 }));

const GCTX = document.createElement('canvas').getContext('2d');
function glassGrad(x, y, w, h) { const g = GCTX.createLinearGradient(x, y, x + w * .7, y + h); g.addColorStop(0, '#4e6476'); g.addColorStop(.55, '#7d95a6'); g.addColorStop(1, '#5f778a'); return g; }
const inflate = ([a, b, c, d], m) => [a - m, b - m, c + m, d + m];
function sashWindow(S, x, y, ww, hh, o = {}) {
  const bar = 4, my = y + hh * .5, mx = x + ww / 2, g = glassGrad(x, y, ww, hh);
  for (const [a, b] of [[y, my - bar / 2], [my + bar / 2, y + hh]]) for (const [l, r] of [[x, mx - bar / 2], [mx + bar / 2, x + ww]]) S.push(wash(rectP(l, a, r, b), g, .78, { jit: 1.1, edge: 0, step: 14 }));
  line(S, x + 2, y + 3, x + ww - 2, y + 3, 4, '#2f3d4a', .5);
  line(S, x - 7, y + hh + 7, x + ww + 7, y + hh + 7, 4, '#8b7c69', .5);
  if (o.lintel) line(S, x - 4, y - 8, x + ww + 4, y - 8, 3, '#9d8a74', .42);
}
function texture(S, x0, y0, x1, y1, col, n, a = .3) {
  for (let k = 0; k < n; k++) { const y = lerp(y0, y1, (k + rnd(.2, .8)) / n); S.push(mk(qcurve(x0 + rnd(-4, 30), y, x1 - rnd(-4, 30), y + rnd(-8, 8), rnd(-8, 8), 14), rnd(30, 46), col, { prof: 'even', nb: 8, a, rib: .1, rough: .3 })); }
}
function bricks(S, x0, y0, x1, y1, holes, col, n) {
  for (let k = 0; k < n; k++) { const bx = rnd(x0 + 6, x1 - 30), by = rnd(y0 + 14, y1 - 8); if (holes.some(([a, b, c, d]) => bx > a - 30 && bx < c + 4 && by > b - 6 && by < d + 6)) continue; for (let r = 0; r < 3; r++) line(S, bx + (r % 2) * 9, by + r * 8, bx + (r % 2) * 9 + rnd(12, 18), by + r * 8 + rnd(-.5, .5), 4.5, col, .32, { nb: 0, n: 3, prof: 'leaf' }); }
}

function house(x0, w, ty, seed) {
  return withSeed(seed, () => {
    const S = [], x1 = x0 + w, top = 262 + Math.round(rnd(-8, 8));
    const FAC = ty === 'stucco' ? '#e2d4b6' : ty === 'red' ? '#c27e5b' : ty === 'grey' ? '#c9c2b2' : '#c9a06c';
    const doorLeft = seed % 2 === 0, dx = doorLeft ? x0 + 28 : x1 - 28 - 56, door = [dx, 604, dx + 56, 727];
    const gw = doorLeft ? [x1 - 34 - 76, 596, x1 - 34, 706] : [x0 + 34, 596, x0 + 110, 706];
    const f1 = [[x0 + 38, 428, x0 + 38 + 58, 546], [x1 - 38 - 58, 428, x1 - 38, 546]];
    const f2 = [[x0 + 42, 300, x0 + 42 + 52, 384], [x1 - 42 - 52, 300, x1 - 42, 384]];
    const fan = [dx - 4, 566, dx + 60, 604];
    const up = [...f1, ...f2].map(r => inflate(r, 6)), gr = [door, gw, fan].map(r => inflate(r, 6));
    const hole = r => rectP(...r);
    if (ty === 'stucco' || ty === 'grey') {
      S.push(wash(rectP(x0, top, x1, HB), FAC, .5, { holes: [...up, ...gr].map(hole) }));
      texture(S, x0, top + 20, x1, HB - 20, darker(FAC), 4, .25);
      line(S, x0 + 3, top + 18, x0 + 4, HB, 4, darker(FAC), .3);
    } else {
      S.push(wash(rectP(x0, top, x1, 580), FAC, .56, { holes: up.map(hole) }));
      S.push(wash(rectP(x0, 580, x1, HB), '#e6d9bd', .45, { holes: gr.map(hole) }));
      texture(S, x0, top + 20, x1, 570, darker(FAC), 3, .28);
      bricks(S, x0, top, x1, 570, up, ty === 'red' ? '#995438' : '#9f7144', 10);
      for (let y = 600; y < HB; y += 30) line(S, x0, y, x1, y, 1.6, '#b5a588', .35, { n: 8 });
      line(S, x0 + 3, top + 18, x0 + 4, 578, 5, darker(FAC), .35);
    }
    // cornice + band
    line(S, x0 - 2, top + 14, x1 + 2, top + 14, 13, '#efe6d2', .75, { nb: 3 });
    line(S, x0, top + 22, x1, top + 22, 3.5, '#7f6f5d', .5);
    line(S, x0, 578, x1, 578, 4, '#8f7f6b', .45);
    // chimney stack on the party wall
    const cx = doorLeft ? x1 - 30 : x0 + 30, cc = ty === 'stucco' || ty === 'grey' ? '#cbbb9a' : '#b88a5f';
    S.push(wash(rectP(cx - 24, top - 64, cx + 24, top + 4), cc, .7, { jit: 1.5 }));
    line(S, cx - 28, top - 64, cx + 28, top - 64, 7, '#8a7a66', .6);
    for (let k = -1; k <= 1; k++) S.push(mk(qcurve(cx + k * 14, top - 64, cx + k * 14 + rnd(-1, 1), top - 84, 0, 3), 9, '#b5643f', { prof: 'trunk', nb: 0, a: .8 }));
    line(S, x0, top - 2, x1, top - 2, 9, '#7d8590', .45, { nb: 3 });
    // windows
    sashWindow(S, gw[0], gw[1], gw[2] - gw[0], gw[3] - gw[1], { lintel: true });
    for (const [a, b, c, d] of f1) sashWindow(S, a, b, c - a, d - b, { lintel: true });
    for (const [a, b, c, d] of f2) sashWindow(S, a, b, c - a, d - b);
    for (const [a, , c, d] of f1) { line(S, a - 6, d - 18, c + 6, d - 18, 2.2, INK, .75); for (let x = a; x <= c; x += 9) line(S, x, d - 18, x, d + 4, 1.6, INK, .7, { n: 2 }); }
    // door + fanlight + steps
    const dcol = DOORS[seed % DOORS.length];
    S.push(wash(rectP(...door), dcol, .82, { jit: 1.2 }));
    for (const [a, b, c, d] of [[dx + 9, 616, dx + 25, 660], [dx + 31, 616, dx + 47, 660], [dx + 9, 672, dx + 25, 718], [dx + 31, 672, dx + 47, 718]]) S.push(wash(rectP(a, b, c, d), darker(dcol), .35, { jit: .8, edge: .2, step: 12 }));
    S.push(mk([[dx + 46, 668], [dx + 47, 669], [dx + 48, 668]], 6, '#c9a03c', { prof: 'leaf', nb: 0, a: .95 }));
    { const pts = []; for (let i = 0; i <= 12; i++) { const a = Math.PI + Math.PI * i / 12; pts.push([dx + 28 + Math.cos(a) * 26, 600 + Math.sin(a) * 30]); } S.push(wash(pts, glassGrad(dx, 570, 56, 30), .75, { jit: 1, edge: 0, raw: true })); for (let k = -2; k <= 2; k++) line(S, dx + 28, 600, dx + 28 + Math.sin(k * .55) * 26, 600 - Math.cos(k * .55) * 28, 1.6, '#e9e0cc', .8, { n: 2 }); }
    for (let k = 0; k < 2; k++) line(S, dx - 10 - k * 6, 733 + k * 10, dx + 66 + k * 6, 733 + k * 10, 10, '#b4ab9c', .6, { nb: 2 });
    const ra = [x0 + 2, x1 - 2];
    for (let x = ra[0]; x <= ra[1]; x += 11) { if (x > dx - 16 && x < dx + 72) continue; line(S, x, 700, x + rnd(-.5, .5), HB, 2, INK, .72, { n: 3 }); S.push(mk([[x, 694], [x, 697], [x, 700]], 4, INK, { prof: 'tip', nb: 0, a: .8 })); }
    line(S, ra[0], 705, dx - 14, 705, 2.2, INK, .7); line(S, dx + 70, 705, ra[1], 705, 2.2, INK, .7);
    SKY_SEG.push([x0, x1, top - 4]);
    return { S, x0, x1 };
  });
}

function school(x0, x1, seed) {
  return withSeed(seed, () => {
    const S = [], top = 148, dc = (x0 + x1) / 2;
    const door = [dc - 70, 395, dc + 70, HB], sign = [dc - 230, 292, dc + 230, 356];
    const cols = [x0 + 44, x0 + 164, x1 - 164 - 66, x1 - 44 - 66];
    const winG = cols.map(x => [x, 590, x + 66, 712]), winF1 = cols.map(x => [x, 405, x + 66, 520]), winF2 = [...cols.map(x => [x, 200, x + 66, 292]), [dc - 120, 196, dc - 64, 262], [dc - 28, 196, dc + 28, 262], [dc + 64, 196, dc + 120, 262]];
    const surround = [dc - 92, 372, dc + 92, HB];
    const holes = [sign, ...winG, ...winF1, ...winF2].map(r => rectP(...inflate(r, 7)));
    holes.push(rectP(...surround));
    S.push(wash(rectP(x0, top, x1, HB), '#b2694a', .58, { holes }));
    texture(S, x0, top + 30, x1, HB - 20, '#94523a', 6, .25);
    bricks(S, x0, top, x1, HB - 10, [sign, ...winG, ...winF1, ...winF2, surround].map(r => inflate(r, 7)), '#87452f', 26);
    for (let y = top + 20; y < HB - 20; y += 44) { S.push(wash(rectP(x0, y - 9, x0 + 34, y + 9), '#e6dac0', .7, { jit: 1, step: 12 })); S.push(wash(rectP(x1 - 34, y + 13, x1, y + 31), '#e6dac0', .7, { jit: 1, step: 12 })); }
    for (const y of [top + 4, 380, 560]) { line(S, x0 - 6, y, x1 + 6, y, y === top + 4 ? 16 : 11, '#ebdfc6', .75, { nb: 3 }); line(S, x0 - 4, y + 9, x1 + 4, y + 9, 3, '#7a5f4d', .45); }
    S.push(wash(rectP(...surround), '#e3d5b8', .35, { holes: [rectP(...door)] }));
    line(S, dc - 88, 372, dc - 88, HB, 6, '#a59272', .5); line(S, dc + 88, 372, dc + 88, HB, 6, '#a59272', .5);
    S.push(mk(qcurve(dc - 104, 376, dc + 104, 376, -26, 16), 10, '#9b8768', { prof: 'even', nb: 3, a: .6 }));
    // the open doorway: warm dark interior, one leaf swung in
    { const g = GCTX.createLinearGradient(0, 395, 0, HB); g.addColorStop(0, '#2e221b'); g.addColorStop(.6, '#4f3b2c'); g.addColorStop(1, '#6e5640'); S.push(wash(rectP(...door), g, .9, { jit: 1.2 })); }
    S.push(wash(rectP(door[0], door[1], door[0] + 34, door[3]), '#2e5a57', .82, { jit: 1 }));
    line(S, door[0] + 30, door[1] + 6, door[0] + 31, door[3] - 4, 3, '#1c3a38', .6);
    for (let k = 0; k < 2; k++) line(S, dc - 96 - k * 8, HB + 4 + k * 9, dc + 96 + k * 8, HB + 4 + k * 9, 11, '#b2a998', .65, { nb: 3 });
    // sign board
    S.push(wash(rectP(...sign), '#efe3c4', .6, { jit: 1.2, edge: .2 }));
    for (const [a, b, c, d] of [[sign[0], sign[1], sign[2], sign[1]], [sign[0], sign[3], sign[2], sign[3]], [sign[0], sign[1], sign[0], sign[3]], [sign[2], sign[1], sign[2], sign[3]]]) line(S, a, b, c, d, 4, '#3b4a5a', .8);
    for (const w of [...winG, ...winF1, ...winF2]) sashWindow(S, w[0], w[1], w[2] - w[0], w[3] - w[1], { lintel: true });
    for (const px of [dc - 128, dc + 128]) {
      S.push(wash([[px - 24, HB - 46], [px + 24, HB - 46], [px + 18, HB + 4], [px - 18, HB + 4]], '#b5653d', .82, { jit: 1, step: 12 }));
      line(S, px - 27, HB - 46, px + 27, HB - 46, 7, '#8f4a2a', .7);
      line(S, px, HB - 46, px + rnd(-2, 2), HB - 110, 4, '#5e4a33', .8);
      clump(S, px, HB - 140, 34, 34, ['#5d7f43', '#6f9150', '#4d6e3a', '#86a35f'], { sx: 1, sy: 1, l0: 9, l1: 18, w0: 7, w1: 12 });
    }
    SKY_SEG.push([x0, x1, top - 8]);
    const extra = (c, a) => {
      if (a <= 0) return;
      c.save(); c.globalAlpha = a * .9; c.fillStyle = '#2b3542'; c.font = '600 40px "Cormorant Garamond"'; c.letterSpacing = '7px';
      c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('ENGLISH SCHOOL', dc + 4, 326); c.globalAlpha = a * .3; c.fillText('ENGLISH SCHOOL', dc + 5, 327);
      c.letterSpacing = '0px'; c.restore();
    };
    return { S, x0, x1, extra };
  });
}

function lamp(x, seed) {
  return withSeed(seed, () => {
    const S = [], col = '#28332f';
    line(S, x, KERB - 4, x, 430, 9, col, .9, { nb: 3 });
    line(S, x - 12, KERB - 4, x + 12, KERB - 4, 14, col, .85, { nb: 2 });
    line(S, x - 7, 560, x + 7, 560, 7, col, .8);
    // lantern
    S.push(mk([[x - 16, 425], [x, 422], [x + 16, 425]], 9, col, { prof: 'even', nb: 0, a: .9 }));
    S.push(mk(qcurve(x, 420, x, 372, 0, 6), 26, '#efe0a8', { prof: 'leaf', nb: 2, a: .6 }));
    line(S, x - 13, 372, x - 10, 420, 2.4, col, .85); line(S, x + 13, 372, x + 10, 420, 2.4, col, .85);
    S.push(mk(qcurve(x - 20, 372, x + 20, 372, -8, 6), 8, col, { prof: 'even', nb: 0, a: .9 }));
    S.push(mk([[x, 364], [x, 358], [x, 350]], 5, col, { prof: 'tip', nb: 0, a: .9 }));
    return { S, x0: x - 30, x1: x + 30 };
  });
}

function planeTree(x, seed) {
  return withSeed(seed, () => {
    const S = [];
    const tr = mk(qcurve(x, KERB - 2, x - 6, 420, 10, 14), 30, '#9a8f6c', { prof: 'trunk', nb: 6, a: .9 });
    S.push(tr, edgeOf(tr, -1, 4, '#5f563f', .6));
    for (let k = 0; k < 14; k++) { const y = rnd(450, 790), xx = x + rnd(-10, 6); S.push(mk(qcurve(xx, y, xx + rnd(6, 12), y + rnd(4, 12), 2, 4), rnd(8, 12), pick(['#c9c19c', '#7d7454', '#b3a982']), { prof: 'leaf', nb: 0, a: .7 })); }
    for (const [a, l] of [[-2.2, 150], [-1.2, 140], [-1.75, 120], [-2.6, 110], [-.8, 110]]) S.push(mk(polar(x - 4, 460, a, l, rnd(-14, 14), 8), 12, '#7d7357', { prof: 'tip', nb: 3, a: .8 }));
    const G = ['#7d9a52', '#6a8a48', '#93ad62', '#5b7a40', '#a6bb70'];
    for (const [cx, cy, r, n] of [[x - 70, 330, 90, 70], [x + 60, 310, 95, 70], [x - 5, 250, 105, 80], [x - 120, 400, 60, 34], [x + 120, 395, 60, 34], [x, 360, 80, 50]]) clump(S, cx, cy, r, n, G, { sx: 1.25, sy: .8, l0: 14, l1: 30, w0: 12, w1: 22, a0: .5, a1: .8 });
    return { S, x0: x - 240, x1: x + 220 };
  });
}

// ---------- strips: ground, far city, sky ----------
let STRIP, FAR, SKY;
function buildGround() {
  const x0 = -900, x1 = 4900, y0 = 700, y1 = 1060, res = 1.5, cv = document.createElement('canvas');
  cv.width = (x1 - x0) * res; cv.height = (y1 - y0) * res;
  const c = cv.getContext('2d'); c.scale(res, res); c.translate(-x0, -y0);
  withSeed(77, () => {
    // pavement
    const pv = []; for (let x = x0; x <= x1; x += 24) pv.push([x, HB - 4 + rnd(-2, 2)]); for (let x = x1; x >= x0; x -= 24) pv.push([x, KERB + rnd(-1, 1)]);
    washPoly(c, pv, '#cbc4b4', .5, 3, 3);
    for (let x = x0; x < x1; x += rnd(70, 110)) drawS(c, mk(qcurve(x, HB + 4, x - 18, KERB - 4, 2, 4), 2, '#9b9385', { prof: 'even', nb: 0, a: .35 }));
    for (let x = x0; x < x1; x += 300) drawS(c, mk(qcurve(x, KERB, x + 320, KERB + rnd(-1, 1), rnd(-2, 2), 12), 9, '#8d887e', { prof: 'even', nb: 4, a: .7 }));
    // road: blue-grey asphalt, fading to paper toward the bottom margin
    const rd = []; for (let x = x0; x <= x1; x += 24) rd.push([x, KERB + 8]); rd.push([x1, y1], [x0, y1]);
    const g = c.createLinearGradient(0, KERB, 0, ROADB); g.addColorStop(0, '#8e98a1'); g.addColorStop(.7, '#a6aeb2'); g.addColorStop(1, 'rgba(241,233,218,0)');
    washPoly(c, rd, g, .55, 3, 3);
    for (let k = 0; k < 2; k++) for (let x = x0; x < x1; x += 400) drawS(c, mk(qcurve(x, KERB + 18 + k * 9, x + 410, KERB + 18 + k * 9, rnd(-1, 1), 12), 3.4, '#d6ad3a', { prof: 'even', nb: 0, a: .75 }));
    for (let x = x0; x < x1; x += 260) drawS(c, mk(qcurve(x, 930, x + 120, 930, 0, 5), 7, '#f3ecdc', { prof: 'even', nb: 2, a: .6 }));
    for (let k = 0; k < 160; k++) { const x = rnd(x0, x1), y = rnd(KERB + 30, 990); drawS(c, mk(qcurve(x, y, x + rnd(30, 90), y + rnd(-2, 2), 2, 4), rnd(3, 6), '#7f8890', { prof: 'leaf', nb: 0, a: .22 })); }
  });
  STRIP = { cv, x0, y0, x1, y1 };
}
function buildFar() {
  const x0 = -800, x1 = 2600, y0 = -260, y1 = 640, res = 1.5, cv = document.createElement('canvas');
  cv.width = (x1 - x0) * res; cv.height = (y1 - y0) * res;
  const c = cv.getContext('2d'); c.scale(res, res); c.translate(-x0, -y0);
  withSeed(91, () => {
    // distant roofs
    for (const [col, a, base, amp] of [['#b7c1c9', .45, 225, 50], ['#a3b0ba', .5, 262, 40]]) {
      const pts = []; let x = x0;
      while (x < x1) { const w = rnd(60, 160), h = base - rnd(0, amp); pts.push([x, h + rnd(-3, 3)], [x + w * .1, h - rnd(0, 12)], [x + w * .9, h - rnd(0, 12)], [x + w, h]); if (rnd() < .3) { pts.push([x + w, h - rnd(20, 40)], [x + w + 14, h - rnd(20, 40)], [x + w + 14, h]); } x += w + (rnd() < .3 ? 14 : 0); }
      pts.push([x1, y1], [x0, y1]); washPoly(c, pts, col, a, 3, 3);
    }
    // a few far trees
    for (let k = 0; k < 14; k++) { const x = rnd(x0, x1), y = rnd(230, 280); for (let j = 0; j < 9; j++) drawS(c, mk(qcurve(x + rnd(-30, 30), y + rnd(-25, 10), x + rnd(-30, 30), y + rnd(-30, 10), 4, 4), rnd(14, 22), pick(['#9fae94', '#8fa087', '#aab79b']), { prof: 'leaf', nb: 0, a: .4 })); }
    // the clock tower (generic, far away)
    const tx = 900, tw = 66, tc = '#cdbb94', ts = '#a99772';
    const L = [];
    for (let x = tx - tw / 2 + 8; x <= tx + tw / 2 - 6; x += 12) L.push(mk(qcurve(x, 560, x + rnd(-1, 1), 40, 1, 20), 15, tc, { prof: 'even', nb: 3, a: .55 }));
    L.push(mk(qcurve(tx + tw / 2 - 4, 560, tx + tw / 2 - 4, 40, 0, 20), 6, ts, { prof: 'even', nb: 0, a: .5 }));
    for (let y = 80; y < 540; y += 46) L.push(mk(qcurve(tx - tw / 2, y, tx + tw / 2, y, 0, 5), 2.5, ts, { prof: 'even', nb: 0, a: .45 }));
    // clock stage
    for (let x = tx - 42; x <= tx + 42; x += 14) L.push(mk(qcurve(x, 44, x, -50, 0, 8), 16, '#c9b78f', { prof: 'even', nb: 3, a: .6 }));
    L.push(mk(qcurve(tx - 46, 46, tx + 46, 46, 0, 6), 8, ts, { prof: 'even', nb: 2, a: .6 }));
    L.push(mk(qcurve(tx - 46, -52, tx + 46, -52, 0, 6), 8, ts, { prof: 'even', nb: 2, a: .6 }));
    // spire + pinnacles
    for (let k = -2; k <= 2; k++) L.push(mk(qcurve(tx + k * 14, -54, tx + k * 2.5, -210, 0, 10), 12 - Math.abs(k) * 2, '#7f8d99', { prof: 'tip', nb: 2, a: .6 }));
    for (const s of [-1, 1]) L.push(mk(qcurve(tx + s * 44, -50, tx + s * 44, -98, 0, 5), 7, '#7f8d99', { prof: 'tip', nb: 0, a: .6 }));
    L.push(mk(qcurve(tx, -205, tx, -238, 0, 4), 3, '#59646e', { prof: 'tip', nb: 0, a: .8 }));
    for (const s of L) drawS(c, s);
    // clock face: paper ring with ink hands
    c.save(); c.beginPath(); c.arc(tx, -3, 27, 0, 7); c.fillStyle = 'rgba(244,238,224,.9)'; c.fill();
    c.strokeStyle = 'rgba(70,64,56,.7)'; c.lineWidth = 2.5; c.stroke();
    c.lineCap = 'round'; c.beginPath(); c.moveTo(tx, -3); c.lineTo(tx + 3, -21); c.moveTo(tx, -3); c.lineTo(tx + 14, 4); c.lineWidth = 2.6; c.strokeStyle = 'rgba(43,37,32,.85)'; c.stroke(); c.restore();
  });
  FAR = { cv, x0, y0, x1, y1, par: .35 };
}
function buildSky() {
  const cv = document.createElement('canvas'); cv.width = 1920; cv.height = 560;
  const c = cv.getContext('2d');
  withSeed(5, () => {
    const g = c.createLinearGradient(0, 0, 0, 470); g.addColorStop(0, '#94b8d2'); g.addColorStop(.6, '#bcd2df'); g.addColorStop(1, 'rgba(241,233,218,0)');
    const pts = [[-20, -20], [1940, -20]]; for (let x = 1940; x >= -20; x -= 40) pts.push([x, 470 + rnd(-30, 30)]);
    washPoly(c, pts, g, .5, 3, 14);
    for (let k = 0; k < 26; k++) { const y = rnd(10, 300), x = rnd(-200, 1800); drawS(c, mk(qcurve(x, y, x + rnd(250, 520), y + rnd(-8, 8), rnd(-10, 10), 14), rnd(26, 46), pick(['#a7c3d8', '#9dbbd2', '#b4cddd']), { prof: 'even', nb: 6, a: .24 })); }
    // clouds: soft grey-violet undersides, the tops left as paper
    for (const [cx, cy, s] of [[380, 150, 1], [1180, 95, 1.2], [1650, 210, .8], [760, 260, .7]]) {
      for (let j = 0; j < 9; j++) { const x = cx + rnd(-110, 110) * s, y = cy + rnd(0, 26) * s; drawS(c, mk(qcurve(x - 70 * s, y, x + 70 * s, y + rnd(-4, 4), -rnd(6, 16) * s, 10), rnd(20, 34) * s, pick(['#c9ccd6', '#bfc4cf', '#d3d4db']), { prof: 'leaf', nb: 3, a: .35 })); }
      // paper-white tops: lift the blue
      c.save(); c.globalCompositeOperation = 'destination-out';
      for (let j = 0; j < 7; j++) { const x = cx + rnd(-90, 90) * s, y = cy - rnd(10, 40) * s; c.beginPath(); c.ellipse(x, y, rnd(50, 90) * s, rnd(26, 40) * s, 0, 0, 7); c.fillStyle = 'rgba(0,0,0,.55)'; c.fill(); }
      c.restore();
    }
  });
  SKY = cv;
}

function buildWorld() {
  // terraces from far left up to the school, then the school, then two more houses
  const types = ['brick', 'brick', 'stucco', 'stucco', 'red', 'grey', 'brick', 'stucco', 'stucco', 'red', 'brick', 'grey', 'brick'];
  let x = -560, i = 0;
  while (x < 2900 - 200) { const w = Math.min(250, 2900 - x); const h = house(x, w, types[i % types.length], 11 + i * 7); OBJ.push(h); x += w; i++; }
  OBJ.push(school(2900, 3700, 501));
  OBJ.push(house(3700, 250, 'stucco', 612)); OBJ.push(house(3950, 250, 'brick', 619)); OBJ.push(house(4200, 250, 'red', 626));
  FRONT_OBJ.push(planeTree(1190, 701), lamp(560, 702), lamp(1640, 703), lamp(2420, 704), lamp(3990, 705));
  for (const o of [...OBJ, ...FRONT_OBJ]) { o.spr = sprite(o.S, null, 2, o.extra || null); }
  SKY_SEG.sort((a, b) => a[0] - b[0]);
  buildGround(); buildFar(); buildSky();
}

// ---------- the bus ----------
let BUS;
function buildBus() {
  BUS = withSeed(808, () => {
    const S = [], L = 820, top = -500, bot = -46;
    const upW = [], loW = [];
    for (let k = 0; k < 6; k++) upW.push([120 + k * 112, -455, 120 + k * 112 + 92, -365]);
    for (let k = 0; k < 5; k++) loW.push([210 + k * 112, -290, 210 + k * 112 + 92, -190]);
    const winF = [[22, -455, 100, -365], [22, -300, 120, -170]], doorR = [130, -300, 190, -60], blind = [30, -492, 150, -466];
    const body = [[30, top], [L - 14, top], [L, top + 16], [L, bot], [8, bot], [4, top + 40], [12, top + 10]];
    S.push(wash(body, '#c63a2a', .82, { holes: [...upW, ...loW, ...winF, doorR, blind].map(r => rectP(...inflate(r, 5))), jit: 2 }));
    texture(S, 10, top + 20, L - 10, bot - 10, '#a12c1f', 5, .3);
    for (const [a, b, c, d] of [...upW, ...loW, ...winF]) S.push(wash(rectP(a, b, c, d), glassGrad(a, b, c - a, d - b), .8, { jit: 1.2, edge: 0, step: 16 }));
    for (const [a, b, c, d] of [...upW.slice(1, 5), ...loW.slice(0, 3)]) if (rnd() < .8) { const hx = rnd(a + 22, c - 22), hy = b + (d - b) * .6; S.push(mk(qcurve(hx, hy - 16, hx, hy + 16, 1, 5), 26, pick(['#7b5a46', '#c99b7d', '#5a4436']), { prof: 'leaf', nb: 0, a: .5 })); S.push(mk(qcurve(hx - 22, d, hx + 22, d, -8, 5), 14, pick(['#3f5d7a', '#7a6a3f', '#5b4b6b']), { prof: 'even', nb: 0, a: .45 })); }
    S.push(wash(rectP(...doorR), '#5d7083', .55, { jit: 1 }));
    line(S, 160, -296, 160, -64, 2.5, '#2f3a44', .6);
    S.push(wash(rectP(...blind), '#2d2a28', .8, { jit: .8 }));
    line(S, 8, -330, L, -330, 10, '#9a281e', .6, { nb: 3 });
    line(S, 8, -150, L, -150, 8, '#9a281e', .5, { nb: 3 });
    S.push(wash([[8, -70], [L, -70], [L, bot], [8, bot]], '#8a2419', .5, { jit: 1.5 }));
    for (const wx of [150, 660]) {
      S.push(mk(qcurve(wx - 64, -58, wx + 64, -58, -46, 10), 14, '#6e1f17', { prof: 'even', nb: 2, a: .75 }));
      const pts = []; for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; pts.push([wx + Math.cos(a) * 34, -36 + Math.sin(a) * 34]); }
      S.push(wash(pts, '#2b2520', .9, { jit: 1, raw: true }));
      const hb = []; for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; hb.push([wx + Math.cos(a) * 13, -36 + Math.sin(a) * 13]); }
      S.push(wash(hb, '#a29e98', .8, { jit: .6, raw: true, edge: 0 }));
    }
    S.push(mk(qcurve(10, -120, 10, -78, 0, 4), 11, '#e8c56a', { prof: 'leaf', nb: 0, a: .85 }));
    return { S, spr: sprite(S, null, 2), L, body };
  });
}
