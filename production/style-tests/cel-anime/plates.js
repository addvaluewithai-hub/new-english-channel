// Painted background plates, made once at load (colour + emissive pair), then only slid / scaled per frame.
// Daylight colour model: cobalt sky, white cumulus with cool undersides, London stock brick, cream stucco, black railings, slate.
import { canvas, rng, rgba, mix, airbrush, vgrad, TAU, poly, path, cel, line } from './cel.js';

export const plate = (w, h) => { const [c, g] = canvas(w, h), [ec, e] = canvas(w, h); e.fillStyle = '#000'; e.fillRect(0, 0, w, h); return { c, g, e: ec, ex: e, w, h }; };

export function skyGrad(g, x, y, w, h) { vgrad(g, x, y, w, h, [[0, '#1f4fb4'], [.35, '#3d7fd8'], [.72, '#8cc0ee'], [1, '#e4f2fb']]); }

// cumulus: a union of lobes; cel-like flat shadow mass with lit lobes cut in, airbrushed cool underside, painted softness
export function cloud(g, x, y, w, h, R, o = {}) {
  const [lc, l] = canvas(Math.ceil(w * 1.3), Math.ceil(h * 2.2));
  const ox = w * .65, oy = h * 1.6;
  const lobes = [], n = 6 + Math.floor(R() * 5);
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1), r = h * (.32 + .5 * Math.sin(u * Math.PI)) * (.8 + R() * .35);
    lobes.push([ox + (u - .5) * w * .8 + (R() - .5) * w * .06, oy - r * .55 - Math.sin(u * Math.PI) * h * .3 + (R() - .5) * h * .12, r]);
  }
  for (let i = 0; i < 3; i++) { const r = h * (.28 + R() * .2); lobes.push([ox + (R() - .5) * w * .4, oy - h * .75 - R() * h * .3, r]); }
  const P = new Path2D(); for (const [cx, cy, r] of lobes) { P.moveTo(cx + r, cy); P.arc(cx, cy, r, 0, TAU); }
  P.rect(ox - w * .42, oy - h * .3, w * .84, h * .3);
  l.fillStyle = o.mid || '#cfd9ec'; l.fill(P);
  l.save(); l.clip(P);
  l.fillStyle = o.lit || '#ffffff';
  for (const [cx, cy, r] of lobes) { l.beginPath(); l.arc(cx - r * .16, cy - r * .2, r * .86, 0, TAU); l.fill(); }
  const gr = l.createLinearGradient(0, oy - h * .7, 0, oy); gr.addColorStop(0, rgba(o.low || '#8d9cc0', 0)); gr.addColorStop(1, rgba(o.low || '#8d9cc0', .75));
  l.fillStyle = gr; l.fillRect(0, 0, lc.width, lc.height);
  l.restore();
  g.save(); g.filter = 'blur(1.4px)'; g.globalAlpha = o.a ?? 1; g.drawImage(lc, x - ox, y - oy); g.restore();
}

// generic Victorian clock tower (not any specific landmark) in aerial haze; base at (x, y), scale k
export function clockTower(g, e, x, y, k, haze = '#9fb4d0') {
  const C = (a) => mix('#6a7da0', haze, a);
  g.save(); g.translate(x, y); g.scale(k, k);
  g.fillStyle = C(.15); g.fillRect(-40, -620, 80, 620);                      // shaft
  g.fillStyle = C(.35); g.fillRect(14, -620, 26, 620);                        // shade side
  g.fillStyle = C(.05); g.fillRect(-52, -760, 104, 150);                      // clock stage
  g.fillStyle = C(.3); g.fillRect(20, -760, 32, 150);
  g.fillStyle = '#f2ead2'; g.beginPath(); g.arc(-4, -688, 36, 0, TAU); g.fill();
  g.strokeStyle = C(0); g.lineWidth = 4; g.stroke();
  g.strokeStyle = '#3a4560'; g.lineWidth = 4; g.beginPath(); g.moveTo(-4, -688); g.lineTo(-4, -714); g.moveTo(-4, -688); g.lineTo(14, -680); g.stroke();
  g.fillStyle = C(.1); g.beginPath(); g.moveTo(-58, -760); g.lineTo(58, -760); g.lineTo(46, -800); g.lineTo(-46, -800); g.fill();
  g.fillStyle = C(.2); g.beginPath(); g.moveTo(-44, -800); g.lineTo(44, -800); g.lineTo(0, -980); g.fill();   // spire
  g.fillStyle = C(.38); g.beginPath(); g.moveTo(0, -980); g.lineTo(44, -800); g.lineTo(14, -800); g.fill();
  for (let i = 0; i < 6; i++) { g.fillStyle = C(.4); g.fillRect(-30 + (i % 2) * 34, -580 + Math.floor(i / 2) * 170, 22, 70); }
  g.restore();
  // sun glint on the clock face (emissive)
  e.save(); e.translate(x, y); e.scale(k, k); e.fillStyle = rgba('#fff2c8', .55); e.beginPath(); e.arc(-12, -698, 16, 0, TAU); e.fill(); e.restore();
}

// distant rooftops, domes, chimneys in haze
function skyline(g, x0, x1, y, R, col, hmin, hmax) {
  g.fillStyle = col;
  for (let x = x0; x < x1;) {
    const w = 60 + R() * 140, h = hmin + R() * (hmax - hmin);
    g.fillRect(x, y - h, w + 1, h + 400);
    if (R() < .4) { g.beginPath(); g.moveTo(x, y - h); g.lineTo(x + w / 2, y - h - 30 - R() * 30); g.lineTo(x + w, y - h); g.fill(); }
    if (R() < .3) for (let k = 0; k < 3; k++) g.fillRect(x + 10 + k * 18, y - h - 22, 9, 22);
    if (R() < .08) { g.beginPath(); g.arc(x + w / 2, y - h, w * .35, Math.PI, 0); g.fill(); g.fillRect(x + w / 2 - 3, y - h - w * .35 - 30, 6, 30); }
    x += w;
  }
}

// —— a Georgian/Victorian terrace house, drawn in centimetres × s (px per cm). x0 = left edge px, gy = pavement line px ——
const BRICK = [['#b88a5a', '#8f6740'], ['#a8573e', '#7c3c2a'], ['#c09a6c', '#94704a'], ['#9b5a44', '#723e2e']];
const DOORS = ['#c0262c', '#1f4f9c', '#1f6f4a', '#20232c', '#e0b52a', '#6a2a5a'];
export function house(g, e, x0, gy, s, R, o = {}) {
  const W = o.w || 560, X = cm => x0 + cm * s, Y = cm => gy - cm * s, S = cm => cm * s;
  const [bf, bs] = BRICK[o.brick ?? Math.floor(R() * BRICK.length)];
  const door = DOORS[o.door ?? Math.floor(R() * DOORS.length)];
  const stucco = '#efe8d8', stuccoS = '#c9c0b0', trim = '#f7f3ea';
  // brick upper floors
  g.fillStyle = bf; g.fillRect(X(0), Y(1000), S(W) + 1, S(1000 - 330));
  // brick courses
  if (s > .5) { g.fillStyle = rgba(bs, .35); for (let c = 330; c < 1000; c += 7.5) g.fillRect(X(0), Y(c), S(W), Math.max(1, S(1))); }
  g.fillStyle = rgba(bs, .5); for (let i = 0; i < 60 * Math.min(4, s * 2); i++) { const bx = R() * W, by = 330 + R() * 670; g.fillRect(X(bx), Y(by), S(22), S(6.5)); }
  airbrush(g, X(W * .5), Y(960), S(W * .8), S(120), '#3a2a2a', .18);
  // party-wall pilaster strip
  g.fillStyle = mix(bf, '#000', .12); g.fillRect(X(W - 14), Y(1000), S(14), S(670));
  // stucco ground floor with channelling
  g.fillStyle = stucco; g.fillRect(X(0), Y(330), S(W) + 1, S(330));
  g.fillStyle = rgba(stuccoS, .9); for (let c = 30; c < 330; c += 30) g.fillRect(X(0), Y(c), S(W), Math.max(1, S(1.6)));
  g.fillStyle = trim; g.fillRect(X(-2), Y(345), S(W + 4), S(20));            // string course
  g.fillStyle = rgba('#5a4a3a', .3); g.fillRect(X(0), Y(325), S(W), S(8));   // its cast shadow
  // windows
  const sash = (wx, wy, ww, wh, glint) => {
    g.fillStyle = trim; g.fillRect(X(wx - 10), Y(wy + wh + 14), S(ww + 20), S(wh + 22));   // surround
    g.fillStyle = mix('#2c3e58', '#000', .1); g.fillRect(X(wx), Y(wy + wh), S(ww), S(wh));
    // glass: sky reflection, hard-edged reflection band
    const gr = g.createLinearGradient(0, Y(wy + wh), 0, Y(wy)); gr.addColorStop(0, '#9cc4e6'); gr.addColorStop(.45, '#5a84b0'); gr.addColorStop(1, '#2c4466');
    g.fillStyle = gr; g.fillRect(X(wx + 4), Y(wy + wh - 4), S(ww - 8), S(wh - 8));
    if (R() < .45) { g.fillStyle = rgba('#f4efe4', .9); g.beginPath(); g.moveTo(X(wx + 4), Y(wy + wh - 4)); g.lineTo(X(wx + ww * .32), Y(wy + wh - 4)); g.lineTo(X(wx + 4), Y(wy + wh * .2)); g.fill(); }
    g.fillStyle = rgba('#e8f4ff', .5); g.beginPath(); g.moveTo(X(wx + ww * .55), Y(wy + wh - 4)); g.lineTo(X(wx + ww * .75), Y(wy + wh - 4)); g.lineTo(X(wx + ww * .35), Y(wy + 4)); g.lineTo(X(wx + ww * .15), Y(wy + 4)); g.fill();
    g.fillStyle = trim;   // glazing bars
    g.fillRect(X(wx), Y(wy + wh * .5 + 3), S(ww), S(6));
    g.fillRect(X(wx + ww / 2 - 2), Y(wy + wh), S(4), S(wh));
    for (const f of [.25, .75]) g.fillRect(X(wx + ww * f - 1.5), Y(wy + wh), S(3), S(wh));
    g.fillStyle = rgba('#1a2030', .35); g.fillRect(X(wx), Y(wy + wh), S(ww), S(10)); g.fillRect(X(wx), Y(wy + wh), S(8), S(wh));   // reveal shadow (sun upper-left)
    g.fillStyle = trim; g.fillRect(X(wx - 14), Y(wy + 2), S(ww + 28), S(12));   // sill
    g.fillStyle = rgba('#3a3028', .25); g.fillRect(X(wx - 12), Y(wy - 10), S(ww + 28), S(8));
    if (glint) { e.fillStyle = rgba('#fff4d8', .55); e.beginPath(); e.moveTo(X(wx + ww * .58), Y(wy + wh - 6)); e.lineTo(X(wx + ww * .7), Y(wy + wh - 6)); e.lineTo(X(wx + ww * .38), Y(wy + 6)); e.lineTo(X(wx + ww * .26), Y(wy + 6)); e.fill(); }
  };
  const dW = 110, dx = o.doorLeft === false ? W - 190 : 40;
  // first floor tall windows + iron balconette; second floor shorter windows
  const wins = o.doorLeft === false ? [70, 300] : [200, 400];
  for (const wx of wins) {
    sash(wx, 400, 120, 210, R() < .35);
    g.strokeStyle = '#1b1c22'; g.lineWidth = Math.max(1, S(2.5)); g.strokeRect(X(wx - 8), Y(460), S(136), S(60));
    for (let k = 0; k <= 8; k++) { g.beginPath(); g.moveTo(X(wx - 8 + k * 17), Y(400)); g.lineTo(X(wx - 8 + k * 17), Y(460)); g.stroke(); }
    sash(wx, 700, 120, 170, R() < .3);
  }
  sash(dx + 6, 690, 98, 180, false);
  // cornice + parapet
  g.fillStyle = trim; g.fillRect(X(-4), Y(950), S(W + 8), S(26));
  g.fillStyle = rgba('#3a2a22', .35); g.fillRect(X(0), Y(924), S(W), S(10));
  g.fillStyle = mix(bf, '#000', .08); g.fillRect(X(0), Y(1010), S(W), S(36));
  g.fillStyle = trim; g.fillRect(X(-4), Y(1012), S(W + 8), S(8));
  // chimney stack on the party wall + pots
  if (o.chimney !== false) {
    const cx = W - 60; g.fillStyle = bf; g.fillRect(X(cx), Y(1160), S(120), S(160));
    g.fillStyle = rgba('#000', .18); g.fillRect(X(cx + 84), Y(1160), S(36), S(160));
    g.fillStyle = trim; g.fillRect(X(cx - 6), Y(1166), S(132), S(12));
    for (let k = 0; k < 4; k++) { g.fillStyle = k % 2 ? '#c46a3e' : '#b05a32'; g.fillRect(X(cx + 8 + k * 28), Y(1206), S(18), S(42)); g.fillStyle = '#8a4426'; g.fillRect(X(cx + 18 + k * 28), Y(1206), S(8), S(42)); }
  }
  // ground floor: bay window + door with portico + fanlight + steps
  const bx = o.doorLeft === false ? 40 : 210;
  sash(bx + 20, 90, 260, 200, R() < .4);
  g.fillStyle = trim; g.fillRect(X(bx), Y(80), S(300), S(16));
  // door recess
  g.fillStyle = mix(stuccoS, '#000', .25); g.fillRect(X(dx - 8), Y(330), S(dW + 16), S(270));
  g.fillStyle = door; g.fillRect(X(dx), Y(275), S(dW), S(215));
  g.fillStyle = mix(door, '#000', .3); for (const [px, py] of [[12, 150], [62, 150], [12, 240], [62, 240]]) g.fillRect(X(dx + px), Y(py + 20), S(36), S(py > 200 ? 70 : 60));
  g.fillStyle = mix(door, '#fff', .25); g.fillRect(X(dx + 2), Y(275), S(5), S(215));
  g.fillStyle = '#e8c45a'; g.beginPath(); g.arc(X(dx + 90), Y(160), Math.max(1.5, S(4)), 0, TAU); g.fill();
  g.fillStyle = '#7fa8cc'; g.beginPath(); g.arc(X(dx + dW / 2), Y(276), S(dW / 2), Math.PI, 0); g.fill();   // fanlight
  g.strokeStyle = trim; g.lineWidth = Math.max(1, S(3)); for (let k = 1; k < 6; k++) { const a = Math.PI + k * Math.PI / 6; g.beginPath(); g.moveTo(X(dx + dW / 2), Y(276)); g.lineTo(X(dx + dW / 2) + Math.cos(a) * S(dW / 2), Y(276) + Math.sin(a) * S(dW / 2)); g.stroke(); }
  g.fillStyle = rgba('#20242c', .35); g.fillRect(X(dx), Y(275), S(dW), S(14));
  // portico columns + entablature
  g.fillStyle = trim; g.fillRect(X(dx - 26), Y(290), S(18), S(230)); g.fillRect(X(dx + dW + 8), Y(290), S(18), S(230));
  g.fillRect(X(dx - 34), Y(345), S(dW + 68), S(48));
  g.fillStyle = rgba('#4a4036', .28); g.fillRect(X(dx + dW + 26), Y(330), S(26), S(270)); g.fillRect(X(dx - 34), Y(297), S(dW + 68), S(8));
  // steps
  for (let k = 0; k < 3; k++) { g.fillStyle = k % 2 ? '#d8d2c6' : '#e4ded2'; g.fillRect(X(dx - 30 - k * 10), Y(60 - k * 20), S(dW + 60 + k * 20), S(20)); g.fillStyle = rgba('#5a5048', .3); g.fillRect(X(dx - 30 - k * 10), Y(42 - k * 20), S(dW + 60 + k * 20), S(3)); }
  // iron railings in front of the area (gap at the steps)
  if (s > .3) {
    const rail = (ra, rb) => {
      g.strokeStyle = '#17181d'; g.lineWidth = Math.max(1, S(2.2));
      g.beginPath(); g.moveTo(X(ra), Y(92)); g.lineTo(X(rb), Y(92)); g.moveTo(X(ra), Y(14)); g.lineTo(X(rb), Y(14)); g.stroke();
      g.fillStyle = '#17181d';
      for (let r = ra; r <= rb; r += 12) { g.fillRect(X(r) - Math.max(.5, S(1.1)), Y(104), Math.max(1, S(2.2)), S(104)); g.beginPath(); g.moveTo(X(r), Y(112)); g.lineTo(X(r - 3), Y(102)); g.lineTo(X(r + 3), Y(102)); g.fill(); }
      g.fillStyle = rgba('#1a1820', .18); g.beginPath(); g.moveTo(X(ra), Y(0)); g.lineTo(X(rb), Y(0)); g.lineTo(X(rb + 40), Y(-14)); g.lineTo(X(ra + 40), Y(-14)); g.fill();
    };
    rail(0, dx - 34); rail(dx + dW + 34, W);
  }
}

// pavement + kerb + road in elevation (band below gy), scale s
export function street(g, x, w, gy, s, h) {
  vgrad(g, x, gy, w, S2(s, 160), [[0, '#b9b4ac'], [1, '#d3cec4']]);
  g.fillStyle = rgba('#8a857c', .5);
  for (let k = 0; k < w; k += S2(s, 90)) g.fillRect(x + k, gy, Math.max(1, S2(s, 1.2)), S2(s, 160));
  g.fillRect(x, gy + S2(s, 70), w, Math.max(1, S2(s, 1.2)));
  const ky = gy + S2(s, 160);
  g.fillStyle = '#e2ddd2'; g.fillRect(x, ky, w, S2(s, 14)); g.fillStyle = '#9a958c'; g.fillRect(x, ky + S2(s, 14), w, S2(s, 10));
  vgrad(g, x, ky + S2(s, 24), w, h, [[0, '#6c6a72'], [1, '#4a4a54']]);
  g.fillStyle = '#e8c23a'; g.fillRect(x, ky + S2(s, 34), w, S2(s, 4)); g.fillRect(x, ky + S2(s, 44), w, S2(s, 4));   // double yellow lines
}
const S2 = (s, cm) => cm * s;

// —— crane plates (shot 1): far (sky, clouds, sun, distant city with clock tower) and near (terrace + street) ——
export function craneFar() {
  const P = plate(1920, 2000), { g, ex: e } = P, R = rng(11);
  skyGrad(g, 0, 0, 1920, 2000);
  airbrush(g, 420, 300, 520, 520, '#fff8e0', .55); airbrush(e, 420, 300, 300, 300, '#fff1c8', .55);
  g.fillStyle = '#fffdf2'; g.beginPath(); g.arc(420, 300, 54, 0, TAU); g.fill();
  e.fillStyle = '#fff8e0'; e.beginPath(); e.arc(420, 300, 70, 0, TAU); e.fill();
  const CL = [[1250, 420, 760, 230], [380, 760, 620, 180], [1500, 900, 900, 220], [760, 1130, 700, 170], [200, 1250, 520, 140], [1700, 1360, 560, 150]];
  for (const [x, y, w, h] of CL) cloud(g, x, y, w, h, R);
  // distant city at the bottom, in haze
  g.save(); g.globalAlpha = 1;
  skyline(g, -40, 1980, 1640, R, '#a7bad6', 60, 220);
  clockTower(g, e, 1420, 1620, 1.05, '#b7c8e0');
  skyline(g, -40, 1980, 1760, R, '#93a8c8', 40, 160);
  vgrad(g, 0, 1450, 1920, 550, [[0, rgba('#e4f2fb', 0)], [1, rgba('#e4f2fb', .35)]]);
  g.restore();
  return P;
}
export const CRANE = { s: .78, gy: 2330, H: 2600 };
export function craneNear() {
  const P = plate(2000, CRANE.H), { g, ex: e } = P, R = rng(5), s = CRANE.s, gy = CRANE.gy;
  const hw = 560 * s;
  let i = 0;
  for (let x = -120; x < 2100; x += hw, i++) house(g, e, x, gy, s, R, { brick: i % 4, door: (i * 7 + 2) % 6 });
  street(g, 0, 2000, gy, s, 400);
  // a tree on the pavement (painted, cel-like canopy)
  tree(g, 1660, gy + 50, 1.0, R);
  return P;
}
function tree(g, x, gy, k, R) {
  g.fillStyle = '#5a4434'; g.fillRect(x - 10 * k, gy - 420 * k, 20 * k, 420 * k);
  g.fillStyle = '#3d2c22'; g.fillRect(x + 2 * k, gy - 420 * k, 8 * k, 420 * k);
  const lobes = []; for (let i = 0; i < 14; i++) lobes.push([x + (R() - .5) * 300 * k, gy - 520 * k + (R() - .5) * 200 * k, (60 + R() * 60) * k]);
  g.fillStyle = '#3f7a3a'; for (const [a, b, r] of lobes) { g.beginPath(); g.arc(a, b, r, 0, TAU); g.fill(); }
  g.fillStyle = '#5fa04a'; for (const [a, b, r] of lobes) { g.beginPath(); g.arc(a - r * .2, b - r * .25, r * .8, 0, TAU); g.fill(); }
  g.fillStyle = '#9ccc6a'; for (const [a, b, r] of lobes.slice(0, 7)) { g.beginPath(); g.arc(a - r * .35, b - r * .4, r * .4, 0, TAU); g.fill(); }
}

// —— tracking plate (shot 2): terrace fronts at close scale, + far strip of sky/rooftops ——
export const TRACK = { s: 2.6, gy: 900 };
export function trackPlate() {
  const W = 3400, P = plate(W, 1080), { g, ex: e } = P, R = rng(23), s = TRACK.s, gy = TRACK.gy;
  skyGrad(g, 0, 0, W, 1080);
  let i = 0;
  for (let x = -200; x < W; x += 560 * s, i++) house(g, e, x, gy, s, R, { brick: (i + 1) % 4, door: (i * 5 + 1) % 6, doorLeft: i % 2 === 0 });
  street(g, 0, W, gy, s, 400);
  return P;
}
// foreground layer for the tracking shot: lamp posts + railing post, transparent elsewhere
export function trackFore() {
  const W = 4200, [c, g] = canvas(W, 1080);
  for (const x of [900, 2600, 3900]) {
    g.fillStyle = '#1c1d24'; g.fillRect(x - 22, -10, 44, 1100);
    g.fillStyle = '#3c3e4c'; g.fillRect(x - 22, -10, 12, 1100);
    g.fillStyle = '#1c1d24'; g.fillRect(x - 40, 980, 80, 100);
  }
  return { c, w: W };
}

// —— school façade (shot 3), low angle with keystone ——
export function schoolPlate() {
  const W = 1920, H = 1400, flat = plate(W, H), { g, ex: e } = flat, R = rng(41), s = 1.0, gy = 1340;
  skyGrad(g, 0, 0, W, H);
  cloud(g, 1500, 260, 700, 200, R); cloud(g, 330, 180, 520, 150, R);
  // the school: wider red-brick building with stone dressings, built from three house bays
  const bays = [[120, 560], [680, 560], [1240, 560]];
  bays.forEach(([x], k) => house(g, e, x, gy, s, R, { brick: 1, door: 0, chimney: k !== 1, doorLeft: k === 2 ? false : true }));
  // central entrance: overpaint the middle bay's ground floor with a grand door
  const X = cm => 680 + cm * s, Y = cm => gy - cm * s;
  g.fillStyle = '#efe8d8'; g.fillRect(X(0), Y(330), 560 * s, 330 * s);
  g.fillStyle = '#c9c0b0'; for (let c = 30; c < 330; c += 30) g.fillRect(X(0), Y(c), 560 * s, 1.6);
  g.fillStyle = '#3a2a24'; g.fillRect(X(190), Y(300), 180, 300);
  g.fillStyle = '#1f4f9c'; g.fillRect(X(200), Y(290), 78, 270); g.fillRect(X(282), Y(290), 78, 270);
  g.fillStyle = '#163a74'; for (const px of [212, 294]) for (const py of [250, 150]) g.fillRect(X(px), Y(py), 54, 80);
  g.fillStyle = '#e8c45a'; g.beginPath(); g.arc(X(270), Y(150), 4, 0, TAU); g.arc(X(290), Y(150), 4, 0, TAU); g.fill();
  g.fillStyle = '#f7f3ea'; g.fillRect(X(150), Y(330), 30, 330); g.fillRect(X(380), Y(330), 30, 330); g.fillRect(X(130), Y(372), 300, 50);
  g.fillStyle = rgba('#4a4036', .3); g.fillRect(X(410), Y(330), 30, 300);
  for (let k = 0; k < 4; k++) { g.fillStyle = k % 2 ? '#d8d2c6' : '#e4ded2'; g.fillRect(X(160 - k * 14), Y(80 - k * 20), 240 + k * 28, 20); }
  // sign board over the entrance (painted, gold letters on bottle green)
  const sx = 960, sy = Y(470);
  g.fillStyle = '#123a2c'; g.fillRect(sx - 330, sy - 52, 660, 104);
  g.strokeStyle = '#d9b24a'; g.lineWidth = 5; g.strokeRect(sx - 318, sy - 40, 636, 80);
  g.fillStyle = rgba('#000', .25); g.fillRect(sx - 330, sy + 52, 660, 12);
  g.font = 'italic 900 64px Kanit'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineJoin = 'round'; g.strokeStyle = '#3a2408'; g.lineWidth = 8; g.strokeText('ENGLISH SCHOOL', sx, sy + 3);
  const tg = g.createLinearGradient(0, sy - 30, 0, sy + 30); tg.addColorStop(0, '#fff2b0'); tg.addColorStop(.5, '#e8b440'); tg.addColorStop(.52, '#b07818'); tg.addColorStop(1, '#f0c860');
  g.fillStyle = tg; g.fillText('ENGLISH SCHOOL', sx, sy + 3);
  e.font = 'italic 900 64px Kanit'; e.textAlign = 'center'; e.textBaseline = 'middle'; e.fillStyle = rgba('#ffd870', .22); e.fillText('ENGLISH SCHOOL', sx, sy + 3);
  street(g, 0, W, gy, s, 200);
  // keystone (low angle): narrower towards the top, drawn in 4px strips
  const out = plate(W, H);
  for (const [src, dst] of [[flat.c, out.g], [flat.e, out.ex]]) {
    for (let y = 0; y < H; y += 4) {
      const k = .78 + .22 * (y / H), w = W * k / .96, x = (W - w) / 2;
      dst.drawImage(src, 0, y, W, 4, x, y, w, 4);
    }
  }
  out.sign = { x: sx, y: sy };
  return out;
}

// —— door plate (two-shot bg): open blue door into a warm hall on the right, brick + big sash window on the left ——
export function doorPlate() {
  const W = 2200, H = 1200, P = plate(W, H), { g, ex: e } = P, R = rng(77), s = 5.2, gy = 1310;
  const X = cm => cm * s, Y = cm => gy - cm * s;
  g.fillStyle = '#a8573e'; g.fillRect(0, 0, W, H);
  g.fillStyle = rgba('#7c3c2a', .4); for (let c = 0; c < 400; c += 7.5) g.fillRect(0, Y(c), W, 3);
  for (let i = 0; i < 260; i++) { const bx = R() * W, by = R() * H; g.fillStyle = rgba(R() < .5 ? '#7c3c2a' : '#c06a4c', .35); g.fillRect(bx, Math.round((by) / (7.5 * s)) * 7.5 * s + 2, 22 * s, 6.5 * s - 3); }
  airbrush(g, 500, 600, 900, 700, '#ffe0c0', .12);
  // big sash window behind Youssef (left)
  const wx = X(30), wy = Y(330), ww = X(150), wh = 190 * s;
  g.fillStyle = '#f7f3ea'; g.fillRect(wx - 30, wy - 30, ww + 60, wh + 60);
  const gr = g.createLinearGradient(0, wy, 0, wy + wh); gr.addColorStop(0, '#a6cdee'); gr.addColorStop(.5, '#6a96c4'); gr.addColorStop(1, '#3e5c84');
  g.fillStyle = gr; g.fillRect(wx, wy, ww, wh);
  g.fillStyle = rgba('#eef7ff', .5); g.beginPath(); g.moveTo(wx + ww * .55, wy); g.lineTo(wx + ww * .72, wy); g.lineTo(wx + ww * .32, wy + wh); g.lineTo(wx + ww * .15, wy + wh); g.fill();
  e.fillStyle = rgba('#fff6e0', .25); e.beginPath(); e.moveTo(wx + ww * .55, wy); e.lineTo(wx + ww * .72, wy); e.lineTo(wx + ww * .32, wy + wh); e.lineTo(wx + ww * .15, wy + wh); e.fill();
  g.fillStyle = '#f7f3ea'; g.fillRect(wx, wy + wh * .5 - 8, ww, 16); g.fillRect(wx + ww / 2 - 6, wy, 12, wh); g.fillRect(wx + ww / 4 - 4, wy, 8, wh); g.fillRect(wx + ww * .75 - 4, wy, 8, wh);
  g.fillStyle = rgba('#1a2030', .3); g.fillRect(wx, wy, ww, 26); g.fillRect(wx, wy, 20, wh);
  // pot plant on the sill
  g.fillStyle = '#c46a3e'; g.fillRect(wx + ww * .7, wy + wh - 90, 110, 90);
  g.fillStyle = '#3f7a3a'; for (let i = 0; i < 9; i++) { g.beginPath(); g.ellipse(wx + ww * .7 + 55 + (R() - .5) * 120, wy + wh - 110 - R() * 80, 34, 16, R() * 3, 0, TAU); g.fill(); }
  g.fillStyle = '#f7f3ea'; g.fillRect(wx - 40, wy + wh, ww + 80, 34);
  // stucco pilaster + doorway on the right
  const dx = X(260), dw = X(130), dTop = Y(300);
  g.fillStyle = '#f7f3ea'; g.fillRect(dx - 130, 0, 110, H); g.fillRect(dx + dw + 20, 0, 110, H);
  g.fillStyle = rgba('#4a4036', .25); g.fillRect(dx - 20, 0, 24, H);
  // hall interior (warm)
  vgrad(g, dx, dTop, dw, H - dTop, [[0, '#e9c896'], [.6, '#d4a874'], [1, '#a87a50']]);
  g.fillStyle = '#c99a68'; g.fillRect(dx, Y(95), dw, 95 * s);                         // dado
  g.fillStyle = '#8a5a36'; g.beginPath(); g.moveTo(dx + dw * .55, H); g.lineTo(dx + dw, Y(220)); g.lineTo(dx + dw, H); g.fill();   // stair string
  g.fillStyle = rgba('#fff4d8', .9); g.fillRect(dx + dw * .12, Y(260), dw * .3, 120);   // a lit inner window
  e.fillStyle = rgba('#ffe8b0', .35); e.fillRect(dx + dw * .12, Y(260), dw * .3, 120);
  // open door leaf (seen edge-on, swung inward-right)
  g.fillStyle = '#1f4f9c'; g.beginPath(); g.moveTo(dx + dw - 10, dTop + 10); g.lineTo(dx + dw + 6, dTop - 10); g.lineTo(dx + dw + 6, H); g.lineTo(dx + dw - 10, H); g.fill();
  g.fillStyle = '#16407e'; g.fillRect(dx + dw - 70, dTop + 30, 60, H - dTop);
  // fanlight + frame
  g.fillStyle = '#f7f3ea'; g.fillRect(dx - 20, dTop - 40, dw + 40, 40);
  g.fillStyle = '#7fa8cc'; g.beginPath(); g.arc(dx + dw / 2, dTop - 40, dw / 2, Math.PI, 0); g.fill();
  g.strokeStyle = '#f7f3ea'; g.lineWidth = 8; for (let k = 1; k < 6; k++) { const a = Math.PI + k * Math.PI / 6; g.beginPath(); g.moveTo(dx + dw / 2, dTop - 40); g.lineTo(dx + dw / 2 + Math.cos(a) * dw / 2, dTop - 40 + Math.sin(a) * dw / 2); g.stroke(); }
  g.strokeStyle = '#f7f3ea'; g.lineWidth = 18; g.beginPath(); g.arc(dx + dw / 2, dTop - 40, dw / 2 + 8, Math.PI, 0); g.stroke();
  // brass plaque on the left pilaster
  const px = dx - 120, py = Y(190);
  g.fillStyle = '#d4aa48'; g.fillRect(px, py, 90, 120); g.fillStyle = '#f6dc8a'; g.fillRect(px, py, 90, 10); g.fillStyle = '#9a7020'; g.fillRect(px + 80, py, 10, 120);
  g.fillStyle = '#5a3c0c'; g.font = '700 17px "Barlow SC"'; g.textAlign = 'center'; g.fillText('ENGLISH', px + 45, py + 52); g.fillText('SCHOOL', px + 45, py + 74);
  e.fillStyle = rgba('#ffe090', .3); e.fillRect(px, py, 90, 20);
  // ground: step + pavement
  g.fillStyle = '#e4ded2'; g.fillRect(dx - 160, Y(26), dw + 320, 26 * s); g.fillStyle = rgba('#5a5048', .35); g.fillRect(dx - 160, Y(2), dw + 320, 10);
  g.fillStyle = '#c4beb2'; g.fillRect(0, Y(0), W, H);
  return P;
}

// pre-blurred copy (depth of field for close-ups)
export function blurred(P, px) {
  const out = {};
  for (const k of ['c', 'e']) { const [c, g] = canvas(P.w, P.h); g.filter = `blur(${px}px)`; g.drawImage(P[k], 0, 0); out[k] = c; }
  return { ...out, w: P.w, h: P.h };
}
// horizontal smear (nagashi) against strobing on moving plates
export function smear(P, px, n = 8) {
  const out = {};
  for (const k of ['c', 'e']) { const [c, g] = canvas(P.w, P.h); g.globalAlpha = 1 / n; for (let i = 0; i < n; i++) g.drawImage(P[k], (i / (n - 1) - .5) * px, 0); g.globalAlpha = 1; out[k] = c; }
  return { ...out, w: P.w, h: P.h };
}
