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

function sashWindow(S, x, y, ww, hh, o = {}) {
  const bar = 4, mid = y + hh * .5;
  for (const [a, b] of [[y, mid - bar / 2], [mid + bar / 2, y + hh]]) {
    const cx = x + ww / 2;
    fillR(S, x, a, x + ww, b, GLASS, { w: Math.min(20, (b - a) * .7), a: .62, nb: 2, holes: [[cx - 1.5, a - 5, cx + 1.5, b + 5]] });
  }
  line(S, x + 2, y + 4, x + ww - 2, y + 4, 5, GLASS2, .55);                 // shadow under the lintel
  line(S, x - 6, y + hh + 6, x + ww + 6, y + hh + 6, 4, '#8b7c69', .5);    // sill shadow
  if (o.lintel) line(S, x - 4, y - 7, x + ww + 4, y - 7, 3, '#9d8a74', .45);
}

function house(x0, w, ty, seed) {
  return withSeed(seed, () => {
    const S = [], x1 = x0 + w, top = 262 + Math.round(rnd(-6, 6));
    const FAC = ty === 'stucco' ? ['#e4d8bd', '#ddd0b3'] : ty === 'red' ? ['#bf7f5e', '#b47459', '#c78d6a'] : ['#c79f6e', '#bf9465', '#cda877'];
    const doorLeft = seed % 2 === 0, dx = doorLeft ? x0 + 26 : x1 - 26 - 56, door = [dx, 600, dx + 56, 727];
    const gw = doorLeft ? [x1 - 30 - 80, 590, x1 - 30, 705] : [x0 + 30, 590, x0 + 110, 705];
    const f1 = [[x0 + 36, 425, x0 + 36 + 60, 545], [x1 - 36 - 60, 425, x1 - 36, 545]];
    const f2 = [[x0 + 40, 298, x0 + 40 + 54, 386], [x1 - 40 - 54, 298, x1 - 40, 386]];
    const m = 7, holes = [door, gw, ...f1, ...f2].map(([a, b, c, d]) => [a - m, b - m - 4, c + m, d + m]);
    holes.push([dx - 10, 560, dx + 66, 600]);                                   // fanlight surround
    // facade: brick above, stucco ground floor for the brick houses
    if (ty === 'stucco') fillR(S, x0, top, x1, HB, FAC, { holes, a: .42 });
    else { fillR(S, x0, top, x1, 575, FAC, { holes, a: .5 }); fillR(S, x0, 575, x1, HB, ['#e6dac0', '#dfd2b6'], { holes, a: .42 });
      for (let k = 0; k < 26; k++) { const bx = rnd(x0 + 6, x1 - 30), by = rnd(top + 20, 560); if (holes.some(([a, b, c, d]) => bx > a - 30 && bx < c && by > b - 6 && by < d + 6)) continue; line(S, bx, by, bx + rnd(14, 26), by + rnd(-1, 1), rnd(5, 7), ty === 'red' ? '#9c5a40' : '#a7784c', .4, { nb: 0, n: 3 }); } }
    // cornice + parapet
    line(S, x0 - 2, top + 14, x1 + 2, top + 14, 13, '#efe6d2', .7, { nb: 3 });
    line(S, x0, top + 22, x1, top + 22, 3.5, '#7f6f5d', .5);
    line(S, x0, 576, x1, 576, 4, '#8f7f6b', .45);
    // party-wall shadow
    line(S, x0 + 2, top + 10, x0 + 3, HB, 5, ty === 'stucco' ? '#b5a689' : '#8c6544', .35, { nb: 2 });
    // chimney stack on the party wall
    const cx = doorLeft ? x1 - 30 : x0 + 30;
    fillV(S, cx - 24, top - 64, cx + 24, top + 4, ty === 'stucco' ? ['#cbbb9a'] : ['#b88a5f', '#a97d55'], { w: 16, a: .7 });
    line(S, cx - 28, top - 64, cx + 28, top - 64, 7, '#8a7a66', .6);
    for (let k = -1; k <= 1; k++) line(S, cx + k * 14, top - 66, cx + k * 14 + rnd(-1, 1), top - 84, 8, '#b5643f', .8, { prof: 'even', n: 3 });
    // slate roof edge behind parapet
    line(S, x0, top - 2, x1, top - 2, 9, '#7d8590', .45, { nb: 3 });
    // windows
    sashWindow(S, gw[0], gw[1], gw[2] - gw[0], gw[3] - gw[1], { lintel: true });
    for (const [a, b, c, d] of f1) sashWindow(S, a, b, c - a, d - b, { lintel: true });
    for (const [a, b, c, d] of f2) sashWindow(S, a, b, c - a, d - b);
    // first-floor balconette
    for (const [a, , c, d] of f1) { line(S, a - 6, d - 18, c + 6, d - 18, 2.2, INK, .75); for (let x = a; x <= c; x += 9) line(S, x, d - 18, x, d + 4, 1.6, INK, .7, { n: 2 }); }
    // door, fanlight, steps
    const dcol = DOORS[seed % DOORS.length];
    fillV(S, door[0], door[1], door[2], door[3], dcol, { w: 16, a: .78 });
    line(S, door[0] + 14, door[1] + 14, door[0] + 14, door[3] - 12, 2.2, INK, .45); line(S, door[2] - 14, door[1] + 14, door[2] - 14, door[3] - 12, 2.2, INK, .45);
    S.push(mk([[dx + 45, 668], [dx + 46, 669], [dx + 47, 668]], 6, '#c9a03c', { prof: 'leaf', nb: 0, a: .95 }));
    { const pts = []; for (let i = 0; i <= 10; i++) { const a = Math.PI + Math.PI * i / 10; pts.push([dx + 28 + Math.cos(a) * 24, 594 + Math.sin(a) * 26]); } S.push(mk(pts, 12, GLASS[0], { prof: 'even', nb: 0, a: .55 })); }
    for (let k = 0; k < 2; k++) line(S, dx - 10 - k * 6, 733 + k * 10, dx + 66 + k * 6, 733 + k * 10, 10, '#b4ab9c', .6, { nb: 2 });
    // area railings along the front, except at the steps
    const ra = [x0 + 2, x1 - 2];
    for (let x = ra[0]; x <= ra[1]; x += 11) { if (x > dx - 16 && x < dx + 72) continue; line(S, x, 700, x + rnd(-.5, .5), HB, 2, INK, .72, { n: 3 }); S.push(mk([[x, 694], [x, 697], [x, 700]], 4, INK, { prof: 'tip', nb: 0, a: .8 })); }
    line(S, ra[0], 705, dx - 14, 705, 2.2, INK, .7); line(S, dx + 70, 705, ra[1], 705, 2.2, INK, .7);
    SKY_SEG.push([x0, x1, top - 4]);
    return { S, x0, x1 };
  });
}

function school(x0, x1, seed) {
  return withSeed(seed, () => {
    const S = [], top = 148, dc = (x0 + x1) / 2;   // door centre
    const door = [dc - 70, 395, dc + 70, HB], sign = [dc - 230, 292, dc + 230, 356];
    const cols = [x0 + 40, x0 + 160, x1 - 160 - 66, x1 - 40 - 66];
    const winG = cols.map(x => [x, 590, x + 66, 712]), winF1 = cols.map(x => [x, 405, x + 66, 520]), winF2 = [...cols.map(x => [x, 200, x + 66, 292]), [dc - 120, 200, dc - 64, 268], [dc - 28, 200, dc + 28, 268], [dc + 64, 200, dc + 120, 268]];
    const m = 8, holes = [door, sign, ...winG, ...winF1, ...winF2].map(([a, b, c, d]) => [a - m, b - m - 4, c + m, d + m]);
    holes.push([dc - 92, 372, dc + 92, HB]);   // stone door surround stays paper-light
    fillR(S, x0, top, x1, HB, ['#b06a4b', '#a9644a', '#b97556'], { holes, a: .5, w: 36 });
    for (let k = 0; k < 70; k++) { const bx = rnd(x0 + 6, x1 - 30), by = rnd(top + 20, HB - 10); if (holes.some(([a, b, c, d]) => bx > a - 30 && bx < c && by > b - 6 && by < d + 6)) continue; line(S, bx, by, bx + rnd(14, 26), by + rnd(-1, 1), rnd(5, 7), '#8d4b33', .38, { nb: 0, n: 3 }); }
    // stone: quoins, string courses, cornice
    for (let y = top + 20; y < HB - 20; y += 44) { line(S, x0, y, x0 + 34, y, 18, '#e3d6bb', .55, { nb: 2 }); line(S, x1 - 34, y + 22, x1, y + 22, 18, '#e3d6bb', .55, { nb: 2 }); }
    for (const y of [top + 4, 380, 560]) { line(S, x0 - 6, y, x1 + 6, y, y === top + 4 ? 16 : 11, '#e8dcc2', .7, { nb: 3 }); line(S, x0 - 4, y + 9, x1 + 4, y + 9, 3, '#7a5f4d', .45); }
    // surround + pediment
    line(S, dc - 88, 372, dc - 88, HB, 6, '#a59272', .5); line(S, dc + 88, 372, dc + 88, HB, 6, '#a59272', .5);
    S.push(mk(qcurve(dc - 104, 376, dc + 104, 376, -26, 16), 10, '#9b8768', { prof: 'even', nb: 3, a: .6 }));
    // the open doorway: warm dark interior, one leaf swung in
    fillV(S, door[0], door[1], door[2], door[3], ['#4a372b', '#55402f', '#433126'], { w: 22, a: .8 });
    fillV(S, door[0], door[1], door[0] + 36, door[3], '#2e5a57', { w: 14, a: .75 });
    line(S, door[0] + 4, door[1] + 4, door[2] - 4, door[1] + 4, 9, '#2c2018', .6);
    // interior light: a pale floor glow
    line(S, door[0] + 40, HB - 12, door[2] - 8, HB - 12, 12, '#a98a60', .35);
    for (let k = 0; k < 2; k++) line(S, dc - 96 - k * 8, HB + 4 + k * 9, dc + 96 + k * 8, HB + 4 + k * 9, 11, '#b2a998', .65, { nb: 3 });
    // the sign board
    fillR(S, sign[0], sign[1], sign[2], sign[3], ['#efe3c4', '#e8d9b5'], { w: 26, a: .55, nb: 2 });
    line(S, sign[0], sign[1], sign[2], sign[1], 4, '#3b4a5a', .8); line(S, sign[0], sign[3], sign[2], sign[3], 4, '#3b4a5a', .8);
    line(S, sign[0], sign[1], sign[0], sign[3], 4, '#3b4a5a', .8); line(S, sign[2], sign[1], sign[2], sign[3], 4, '#3b4a5a', .8);
    for (const w of [...winG, ...winF1, ...winF2]) sashWindow(S, w[0], w[1], w[2] - w[0], w[3] - w[1], { lintel: true });
    // two bay trees in pots by the door
    for (const px of [dc - 128, dc + 128]) {
      fillV(S, px - 22, HB - 46, px + 22, HB + 4, ['#b5653d', '#a95b36'], { w: 14, a: .8 });
      line(S, px - 26, HB - 46, px + 26, HB - 46, 7, '#8f4a2a', .7);
      line(S, px, HB - 46, px + rnd(-2, 2), HB - 110, 4, '#5e4a33', .8);
      clump(S, px, HB - 140, 34, 34, ['#5d7f43', '#6f9150', '#4d6e3a', '#86a35f'], { sx: 1, sy: 1, l0: 9, l1: 18, w0: 7, w1: 12 });
    }
    SKY_SEG.push([x0, x1, top - 8]);
    const extra = (c, a) => {
      if (a <= 0) return;
      c.save(); c.globalAlpha = a * .88; c.fillStyle = '#2b3542'; c.font = '600 40px "Cormorant Garamond"'; c.letterSpacing = '7px';
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
  const types = ['brick', 'stucco', 'brick', 'red', 'stucco', 'brick', 'brick', 'stucco', 'red', 'brick', 'stucco', 'brick', 'red'];
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
    const S = [], L = 820, R = ['#c4392a', '#bb3326', '#cc4130'], top = -500, bot = -46;
    const upW = [], loW = [];
    for (let k = 0; k < 6; k++) upW.push([120 + k * 112, -455, 120 + k * 112 + 92, -365]);
    for (let k = 0; k < 5; k++) loW.push([210 + k * 112, -290, 210 + k * 112 + 92, -190]);
    const winF = [[22, -455, 100, -365], [22, -300, 120, -170]], doorR = [130, -300, 190, -60];
    const holes = [...upW, ...loW, ...winF, doorR].map(([a, b, c, d]) => [a - 5, b - 6, c + 5, d + 6]);
    holes.push([30, -492, 150, -466]);
    fillR(S, 6, top, L, bot, R, { holes, a: .72, w: 40 });
    fillR(S, 6, -150, L, bot, ['#a92d22'], { a: .3, w: 30 });
    for (const [a, b, c, d] of [...upW, ...loW, ...winF]) {
      fillR(S, a, b, c, d, ['#5f7487', '#6b8093', '#56697b'], { w: Math.min(26, (d - b) * .45), a: .62, nb: 2, holes: [[a + (c - a) * .55, b - 4, a + (c - a) * .55 + 10, d + 4]] });
    }
    // passengers: faint heads in the windows
    for (const [a, b, c, d] of [...upW.slice(1, 5), ...loW.slice(0, 3)]) if (rnd() < .8) { const hx = rnd(a + 20, c - 20), hy = b + (d - b) * .55; S.push(mk(qcurve(hx, hy - 16, hx, hy + 14, 1, 5), 24, pick(['#7b5a46', '#c99b7d', '#5a4436']), { prof: 'leaf', nb: 0, a: .45 })); }
    fillV(S, doorR[0], doorR[1], doorR[2], doorR[3], '#5d7083', { w: 16, a: .5 });
    // destination blind (blank), roof line, skirt, wheels
    fillR(S, 30, -492, 150, -466, '#2d2a28', { w: 14, a: .75, nb: 0 });
    S.push(mk(qcurve(4, -330, L, -330, 0, 20), 10, '#9e2b20', { prof: 'even', nb: 3, a: .6 }));
    S.push(mk(qcurve(10, top + 4, L - 6, top + 4, -6, 20), 12, '#9e2b20', { prof: 'even', nb: 3, a: .55 }));
    for (const wx of [150, 660]) {
      S.push(mk(qcurve(wx - 64, -60, wx + 64, -60, -46, 10), 16, '#7d231a', { prof: 'even', nb: 2, a: .7 }));
      const pts = []; for (let i = 0; i <= 18; i++) { const a = i / 18 * Math.PI * 2; pts.push([wx + Math.cos(a) * 30, -40 + Math.sin(a) * 30]); }
      S.push(mk(pts, 24, '#2b2520', { prof: 'even', nb: 3, a: .85 }));
      S.push(mk(qcurve(wx - 8, -40, wx + 8, -40, 0, 3), 14, '#8d8a85', { prof: 'leaf', nb: 0, a: .8 }));
    }
    S.push(mk(qcurve(6, -120, 6, -60, 0, 4), 10, '#e8c56a', { prof: 'leaf', nb: 0, a: .8 }));
    return { S, spr: sprite(S, null, 2), L };
  });
}
