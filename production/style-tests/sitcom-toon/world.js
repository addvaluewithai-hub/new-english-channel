// world.js — an ordinary bright London street ("the suspiciously normal world")
// Stage units: 1 m ≈ 200. Facades stand on y=760, pavement 760–1000, kerb, road 1030–1500.
import { clamp, lerp, hash, TAU } from '/core/lib.js';
import { INK, push, pop, translate, rotate, scale, shape, fillOnly, stroke, ell, arc, spline, rr, rect, quad, dot, text, bands } from './toon.js';

export const C = {
  sky: ['#7cc3ea', '#94cff0', '#acdbf4', '#c6e7f7'], cloud: '#fbfdff', cloudS: '#dcebf6',
  far: '#b9c3e3', farS: '#a3aed6', tower: '#e6d3a4', towerS: '#c9b27f', slate: '#56688f', slateS: '#435478', gold: '#e9b949',
  brick: '#c4664a', brickS: '#a4523b', brick2: '#b9573f', stucco: '#efe3c6', stuccoS: '#d8c9a6', trim: '#fbf6ea', glass: '#7fa8c9', glassS: '#5f88ab', glassH: '#d4ecf7',
  roof: '#6b6f86', roofS: '#555a70', chim: '#b65a40',
  doorA: '#6aa37e', doorB: '#2b3d73', doorC: '#e0b43a', rail: '#2a2433',
  pave: '#d6d1c4', paveS: '#c3bdae', kerb: '#b4ae9f', road: '#6c7183', roadS: '#5d6274', line: '#f4f1e6',
  school: '#ecdcb6', schoolS: '#d2bf93', schoolDoor: '#1c9c96', schoolDoorS: '#137670', sign: '#2b3d73', signT: '#fbe7a6',
  bus: '#d8342c', busS: '#a9231e', busBand: '#f3ead2', tyre: '#2e2a36', hub: '#c9ccd6', inside: '#3b3046',
};
const GROUND = 760;

// —— far layer: rooftops and the clock tower (drawn with a parallax camera) ——
export function farLayer(t) {
  // distant rooftops
  const ro = [[-2600, -1420], [-1900, -1500], [-1500, -1460], [-900, -1540], [-500, -1450], [500, -1520], [1300, -1440], [2100, -1560], [2900, -1470], [3600, -1530], [4300, -1450]];
  const P = [[-3000, 0]];
  for (const [x, y] of ro) { P.push([x, y]); P.push([x + 420, y]); P.push([x + 440, y + 40]); }
  P.push([5200, -1250], [5200, 0]);
  push(); translate(-160, -1300); scale(.62); translate(160, 1300); clockTower(-160, -1300, t); pop();
  shape(P, { fill: C.far, lw: 4, boil: .5 });
  for (const [x, y] of ro) { shape(rect(x + 80, y - 70, 60, 70), { fill: C.farS, lw: 4 }); shape(rect(x + 300, y - 50, 50, 50), { fill: C.farS, lw: 4 }); }
}
function clockTower(x, base, t) {
  push(); translate(x, base);
  // shaft
  shape(rect(-120, -900, 240, 900), { fill: C.tower, lw: 5, shade: () => { fillOnly(rect(50, -900, 80, 900), C.towerS, { boil: .3 }); } });
  for (const xx of [-70, 0, 70]) stroke([[xx, -700], [xx, -20]], 3, { line: C.towerS });
  for (let k = 0; k < 5; k++) stroke([[-120, -140 - k * 120], [120, -140 - k * 120]], 4);
  // clock section
  shape(rect(-150, -1180, 300, 280), { fill: C.tower, lw: 5, shade: () => fillOnly(rect(70, -1190, 90, 300), C.towerS, { boil: .3 }) });
  shape(ell(0, -1040, 105, 105, 40), { fill: C.gold, lw: 5 });
  shape(ell(0, -1040, 86, 86, 40), { fill: '#fbf7ea', lw: 4 });
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; stroke([[Math.cos(a) * 70, -1040 + Math.sin(a) * 70], [Math.cos(a) * 80, -1040 + Math.sin(a) * 80]], 4); }
  const hm = 9 * 60 + 10 + t / 60; // ten past nine, creeping
  const ah = (hm / 720) * TAU - Math.PI / 2, am = ((hm % 60) / 60) * TAU - Math.PI / 2;
  stroke([[0, -1040], [Math.cos(ah) * 44, -1040 + Math.sin(ah) * 44]], 7); stroke([[0, -1040], [Math.cos(am) * 66, -1040 + Math.sin(am) * 66]], 5);
  // belfry + spire
  shape(rect(-130, -1300, 260, 120), { fill: C.tower, lw: 5, shade: () => { for (const xx of [-80, -20, 40]) fillOnly(rr(xx, -1285, 40, 90, 18), C.slateS, { boil: .2 }); } });
  shape([[-140, -1300], [0, -1700], [140, -1300]], { fill: C.slate, lw: 5, shade: () => fillOnly([[0, -1720], [160, -1290], [40, -1290]], C.slateS, { boil: .3 }) });
  stroke([[0, -1700], [0, -1790]], 6); shape(ell(0, -1790, 14, 14, 12), { fill: C.gold, lw: 4 });
  pop();
}
export function sky(t) {
  bands(C.sky, -3400, 400);
  // two lazy clouds
  for (const [x0, y, s] of [[-1700, -2050, 1.2], [1900, -2250, 1]]) {
    const x = x0 + t * 25;
    push(); translate(x, y); scale(s);
    shape(spline([[-320, 60], [-300, -10], [-200, -60], [-110, -40], [-40, -120], [80, -110], [150, -50], [260, -60], [330, 10], [320, 60]]), { fill: C.cloud, lw: 5, shade: () => fillOnly(rect(-400, 30, 800, 60), C.cloudS, { boil: .3 }) });
    pop();
  }
  // a few pigeons crossing the sky (wings on twos)
  const tq = Math.floor(t * 12) / 12;
  for (let i = 0; i < 4; i++) {
    const bx = 300 + i * 150 + t * 520 + hash(i) * 80, by = -2050 + i * 45 + Math.sin(t * 3 + i) * 20, fl = (Math.floor(tq * 12 + i * 2) % 4) < 2 ? 1 : -.4;
    stroke([[bx - 42, by - 22 * fl], [bx - 16, by - 4 * fl], [bx, by + 6], [bx + 16, by - 4 * fl], [bx + 42, by - 22 * fl]], 6);
  }
}

// —— terraced houses ——
const HOUSES = [];
{ const kinds = ['brick', 'stucco', 'brick2', 'stucco', 'brick', 'brick2']; const doors = [C.doorA, C.doorB, C.doorC, C.doorA, '#c95b7a', C.doorB];
  for (let i = 0; i < 6; i++) HOUSES.push({ x: -2560 + i * 760, kind: kinds[i], door: doors[i] }); }
function sash(x, y, w, h, frame = C.trim) {
  shape(rect(x - 14, y - 14, w + 28, h + 28), { fill: frame, lw: 5 });
  shape(rect(x, y, w, h), {
    fill: C.glass, lw: 5, shade: () => {
      fillOnly(rect(x + w * .55, y - 4, w, h + 8), C.glassS, { boil: .3 });
      fillOnly([[x + w * .12, y + h * .7], [x + w * .45, y + h * .18], [x + w * .58, y + h * .18], [x + w * .25, y + h * .7]], C.glassH, { boil: .3 });
    }
  });
  stroke([[x, y + h / 2], [x + w, y + h / 2]], 5); stroke([[x + w / 2, y], [x + w / 2, y + h]], 4);
  shape(rect(x - 24, y + h + 10, w + 48, 22), { fill: frame, lw: 5 });   // sill
}
function house(H) {
  const x = H.x, w = 760, top = -1040;
  const base = H.kind === 'stucco' ? C.stucco : H.kind === 'brick2' ? C.brick2 : C.brick;
  const sh = H.kind === 'stucco' ? C.stuccoS : C.brickS;
  // roof + chimneys
  shape([[x - 10, top], [x + 60, top - 170], [x + w - 60, top - 170], [x + w + 10, top]], { fill: C.roof, lw: 6, shade: () => fillOnly(rect(x + w * .6, top - 200, w, 220), C.roofS, { boil: .3 }) });
  shape(rect(x + w - 190, top - 310, 130, 160), { fill: C.chim, lw: 6, shade: () => fillOnly(rect(x + w - 100, top - 320, 50, 180), C.brickS, { boil: .3 }) });
  shape(rect(x + w - 205, top - 330, 160, 30), { fill: C.trim, lw: 5 });
  for (const k of [0, 1]) shape(rr(x + w - 180 + k * 60, top - 390, 36, 62, 6), { fill: '#d8743f', lw: 5 });
  // facade
  shape(rect(x, top, w, GROUND - top), {
    fill: base, lw: 6, shade: () => {
      fillOnly(rect(x + w - 60, top, 60, GROUND - top), sh, { boil: .3 });
      if (H.kind !== 'stucco') for (let i = 0; i < 26; i++) { const bx = x + 40 + hash(i * 3.7 + x) * (w - 140), by = top + 60 + hash(i * 9.1 + x) * (GROUND - top - 120); fillOnly(rect(bx, by, 46, 14), sh, { boil: .2 }); }
      else for (let k = 0; k < 9; k++) fillOnly(rect(x, top + 220 + k * 160, w, 6), sh, { boil: .2 });
    }
  });
  shape(rect(x - 16, top - 6, w + 32, 40), { fill: C.trim, lw: 5 });   // cornice
  shape(rect(x - 10, 70, w + 20, 26), { fill: C.trim, lw: 5 });         // string course
  // windows: two upper floors
  for (const fy of [-880, -440]) { sash(x + 110, fy, 190, 300); sash(x + 450, fy, 190, 300); }
  // ground floor: big window + door with fanlight + steps
  sash(x + 430, 240, 220, 330);
  const dx = x + 110, dw = 200;
  shape(rect(dx - 34, 120, dw + 68, 620), { fill: C.trim, lw: 6 });
  shape([...arc(dx + dw / 2, 230, dw / 2, 90, Math.PI, TAU, 16), [dx + dw, 230], [dx, 230]], { fill: C.glass, lw: 5 });
  for (let k = 1; k < 4; k++) stroke([[dx + dw / 2, 230], [dx + dw / 2 + Math.cos(Math.PI + k * Math.PI / 4) * dw / 2, 230 + Math.sin(Math.PI + k * Math.PI / 4) * 90]], 3);
  shape(rect(dx, 236, dw, 500), { fill: H.door, lw: 6, shade: () => { fillOnly(rect(dx + dw * .62, 230, dw, 520), 'rgba(0,0,0,.18)', { boil: .3 }); } });
  for (const [px, py] of [[dx + 30, 270], [dx + 110, 270], [dx + 30, 480], [dx + 110, 480]]) shape(rect(px, py, 60, 170), { line: INK, lw: 4, stroke: true });
  dot(dx + 170, 500, 9, C.gold);
  shape(rect(dx - 50, 736, dw + 100, 24), { fill: C.paveS, lw: 5 });
  // railings in front of the area
  stroke([[x + 380, 560], [x + 740, 560]], 6, { line: C.rail });
  for (let k = 0; k < 10; k++) { const rx = x + 390 + k * 38; stroke([[rx, 560], [rx, 760]], 5, { line: C.rail }); shape([[rx - 7, 560], [rx, 538], [rx + 7, 560]], { fill: C.rail, lw: 3 }); }
}
// —— the school ——
export const SCHOOL = { x: 2000, w: 1700, doorX: 2900, doorW: 300, doorTop: 270 };
function school(t, doorOpen) {
  const { x, w } = SCHOOL, top = -1240;
  shape(rect(x, top, w, GROUND - top), {
    fill: C.school, lw: 6, shade: () => {
      fillOnly(rect(x + w - 70, top, 70, GROUND - top), C.schoolS, { boil: .3 });
      for (let k = 0; k < 12; k++) fillOnly(rect(x, top + 120 + k * 150, w, 6), C.schoolS, { boil: .2 });   // stone courses
    }
  });
  shape(rect(x - 20, top - 70, w + 40, 80), { fill: C.trim, lw: 6 });               // parapet
  for (let k = 0; k < 16; k++) shape(rr(x + 30 + k * 106, top - 150, 46, 80, 18), { fill: C.trim, lw: 4 });  // balustrade
  shape(rect(x - 20, top - 170, w + 40, 30), { fill: C.trim, lw: 5 });
  // upper windows: two floors × 5
  for (const fy of [-1090, -620]) for (let k = 0; k < 5; k++) sash(x + 110 + k * 320, fy, 180, 320);
  // the sign fascia
  shape(rr(2380, 10, 1040, 136, 14), { fill: C.sign, lw: 7, shade: () => fillOnly(rect(2380, 110, 1040, 50), '#1d2a52', { boil: .3 }) });
  text('ENGLISH SCHOOL', 2900, 84, { font: '400 104px "Lilita One"', fill: C.signT, outlineW: 0 });
  for (const sx of [2410, 3390]) dot(sx, 78, 8, C.gold);
  // ground floor windows each side
  for (const wx of [2110, 2420, 3220, 3460]) if (wx !== 2420 && wx !== 3220) sash(wx, 330, 180, 300);
  // doorway: pilasters + pediment + double door
  const { doorX, doorW, doorTop } = SCHOOL, dx = doorX - doorW / 2;
  shape([[dx - 90, doorTop - 10], [doorX, doorTop - 110], [dx + doorW + 90, doorTop - 10]], { fill: C.trim, lw: 6 });
  for (const px of [dx - 80, dx + doorW + 20]) shape(rect(px, doorTop - 10, 60, GROUND - doorTop + 10), { fill: C.trim, lw: 6, shade: () => fillOnly(rect(px + 38, doorTop - 20, 30, 600), '#e5dccb', { boil: .3 }) });
  shape(rect(dx, doorTop, doorW, GROUND - doorTop), { fill: C.inside, lw: 6, shade: () => {
    fillOnly(rect(dx, doorTop + 330, doorW, 200), '#4a3d57', { boil: .2 });   // hallway floor
    fillOnly(rr(dx + 90, doorTop + 60, 120, 160, 10), '#5b4c6a', { boil: .2 });   // notice board inside
  } });
  // door leaves swing inward: each leaf narrows toward its hinge
  const o = clamp(doorOpen), lw_ = doorW / 2 * (1 - o * .82);
  for (const side of [-1, 1]) {
    const hx = side < 0 ? dx : dx + doorW, x0 = side < 0 ? hx : hx - lw_;
    shape(rect(x0, doorTop, lw_, GROUND - doorTop), { fill: o > .5 ? C.schoolDoorS : C.schoolDoor, lw: 6, shade: () => {
      fillOnly(rect(x0 + lw_ * .18, doorTop + 40, lw_ * .64, 220), C.glass, { boil: .2 });
    } });
    shape(rect(x0 + lw_ * .18, doorTop + 40, lw_ * .64, 220), { line: INK, lw: 4, stroke: true });
    if (o < .5) dot(side < 0 ? x0 + lw_ - 20 : x0 + 20, doorTop + 300, 8, C.gold);
  }
  // steps (landing in front of the door, then two steps down to the pavement)
  shape(rect(dx - 120, 760, doorW + 240, 50), { fill: C.trim, lw: 6, shade: () => fillOnly(rect(dx - 130, 794, doorW + 260, 20), '#e1d8c4', { boil: .2 }) });
  shape(rect(dx - 160, 808, doorW + 320, 50), { fill: C.trim, lw: 6, shade: () => fillOnly(rect(dx - 170, 842, doorW + 340, 20), '#e1d8c4', { boil: .2 }) });
  shape(rect(dx - 200, 856, doorW + 400, 48), { fill: C.trim, lw: 6, shade: () => fillOnly(rect(dx - 210, 888, doorW + 420, 20), '#e1d8c4', { boil: .2 }) });
  // a potted bay tree each side
  for (const px of [dx - 280, dx + doorW + 280]) {
    shape([[px - 56, 680], [px + 56, 680], [px + 44, 770], [px - 44, 770]], { fill: '#c46a43', lw: 6, shade: () => fillOnly(rect(px + 14, 670, 60, 110), '#a4553a', { boil: .3 }) });
    shape(rr(px - 64, 664, 128, 26, 6), { fill: '#c46a43', lw: 5 });
    stroke([[px, 664], [px, 470]], 7, { line: '#6b4a2a' });
    shape(ell(px, 420, 95, 110, 30), { fill: '#4f9a5a', lw: 6, shade: () => fillOnly(ell(px + 40, 450, 70, 90, 20), '#3c7d47', { boil: .3 }) });
  }
}
function lampPost(x) {
  stroke([[x, 800], [x, 120]], 14, { line: C.rail });
  shape(rect(x - 30, 740, 60, 60), { fill: C.rail, lw: 5 });
  shape([[x - 50, 40], [x + 50, 40], [x + 36, 130], [x - 36, 130]], { fill: '#fff4c8', lw: 6 });
  shape([[x - 60, 40], [x, -10], [x + 60, 40]], { fill: C.rail, lw: 5 });
}
function phoneBox(x) {
  shape(rr(x, 80, 220, 720, 10), { fill: C.bus, lw: 6, shade: () => { fillOnly(rect(x + 150, 70, 80, 740), C.busS, { boil: .3 }); } });
  shape(rr(x - 10, 50, 240, 50, 16), { fill: C.bus, lw: 6 });
  for (let r = 0; r < 4; r++) for (let c = 0; c < 2; c++) shape(rect(x + 40 + c * 75, 150 + r * 120, 64, 104), { fill: C.glass, lw: 4 });
  shape(rect(x + 30, 108, 160, 26), { fill: '#f6f2e6', lw: 4 });
}
export function street(t, { doorOpen = 0 } = {}) {
  for (const H of HOUSES) house(H);
  school(t, doorOpen);
  house({ x: 3700, kind: 'stucco', door: C.doorC });
  // pavement + kerb + road
  shape(rect(-3200, GROUND, 8600, 240), { fill: C.pave, lw: 6, shade: () => { for (let k = -3200; k < 5400; k += 220) fillOnly(rect(k, GROUND, 6, 240), C.paveS, { boil: .2 }); fillOnly(rect(-3200, GROUND + 140, 8600, 5), C.paveS, { boil: .2 }); } });
  shape(rect(-3200, 1000, 8600, 34), { fill: C.kerb, lw: 6 });
  shape(rect(-3200, 1034, 8600, 600), { fill: C.road, lw: 6, shade: () => fillOnly(rect(-3200, 1034, 8600, 30), C.roadS, { boil: .2 }) });
  for (let k = -3200; k < 5400; k += 420) shape(rect(k, 1330, 220, 18), { fill: C.line, lw: 4 });
  // street furniture
  phoneBox(1620); lampPost(-600); lampPost(1940);
}
// —— the red double-decker (moves right; x = front bumper) ——
export function bus(x, t) {
  const L = 2200, top = 520, bottom = 1400;
  const bob = (Math.floor(t * 12) % 2) * 5;
  push(); translate(x - L, bob);
  shape(rr(0, top, L, bottom - top - 80, 60), {
    fill: C.bus, lw: 7, shade: () => {
      fillOnly(rect(0, bottom - 230, L, 160), C.busS, { boil: .3 });
      fillOnly(rect(0, 930, L, 50), C.busBand, { boil: .3 });
      fillOnly(rect(0, top - 10, L, 40), C.busS, { boil: .3 });
    }
  });
  stroke([[0, 930], [L, 930]], 5); stroke([[0, 980], [L, 980]], 5);
  // upper + lower deck windows
  for (const [y0, h] of [[600, 260], [1010, 200]]) for (let k = 0; k < 6; k++) {
    const wx = 70 + k * 330, ww = k === 5 ? 280 : 280;
    shape(rr(wx, y0, ww, h, 22), { fill: C.glass, lw: 6, shade: () => { fillOnly(rect(wx + ww * .6, y0 - 4, ww, h + 8), C.glassS, { boil: .3 }); fillOnly([[wx + 30, y0 + h - 30], [wx + 100, y0 + 30], [wx + 140, y0 + 30], [wx + 70, y0 + h - 30]], C.glassH, { boil: .3 }); } });
  }
  // passengers (simple heads) in the upper deck
  for (const k of [1, 3, 4]) { const hx = 70 + k * 330 + 120; shape(ell(hx, 790, 46, 56, 20), { fill: k === 3 ? '#e9c3a4' : '#8a5a3c', lw: 5 }); shape(arc(hx, 780, 48, 60, Math.PI, TAU, 12).concat([[hx + 48, 770], [hx - 48, 770]]), { fill: k === 1 ? '#f2d14b' : '#2a2030', lw: 5 }); }
  // destination blind on the front
  shape(rr(L - 330, 548, 280, 56, 8), { fill: '#1d1a24', lw: 5 });
  text('CITY CENTRE', L - 190, 578, { font: '400 40px "Lilita One"', fill: '#ffd34d' });
  // wheels
  for (const wx of [380, L - 420]) {
    shape(ell(wx, bottom - 70, 110, 110, 30), { fill: C.tyre, lw: 7 });
    shape(ell(wx, bottom - 70, 52, 52, 20), { fill: C.hub, lw: 5 });
    const a = -(x / 110);
    for (let k = 0; k < 3; k++) { const b = a + k * TAU / 3; stroke([[wx, bottom - 70], [wx + Math.cos(b) * 40, bottom - 70 + Math.sin(b) * 40]], 4); }
  }
  // headlight + bumper
  shape(ell(L - 40, 1260, 26, 22, 14), { fill: '#fff4c8', lw: 5 });
  shape(rr(L - 150, 1320, 170, 30, 10), { fill: '#3b3a48', lw: 5 });
  pop();
}
