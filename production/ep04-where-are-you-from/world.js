// Bean People v2 — "Youssef in New York": the street set (design v3) plus the two interior sets of episode 2 (Youssef's bedroom
// and the school hallway), authored in the same screen px / parallax 1 space.
// Authored in screen px for the establishing camera (CAM0 = centre 960,540, zoom 1); parallax p: sky 0, far skyline .12,
// across-the-road brownstones + taxi .45, our pavement + the school 1, lamp foreground 1.3. Same palette tokens, same haze.
import { CPU, P, HAZE, mix, rgba, dark, light, rr, ell, smooth, poly, contact, formed, layer } from './kit.js';
import { clamp, lerp, seg, hash, back } from '/core/lib.js';
import { drawSuitcase } from './bean.js';

export const SW = 1920, SH = 1080;
const PI = Math.PI;
export const GROUND = 880;            // characters' feet line (world y)
export const DOOR = { x: 1530, y: 795 };

export function layerT(c, cam, p, s = 1) {
  const Z = (1 + (cam.z - 1) * p) * s;
  c.setTransform(Z, 0, 0, Z, s * SW / 2 - (960 + (cam.x - 960) * p) * Z, s * SH / 2 - (540 + (cam.y - 540) * p) * Z);
}
export function toScreen(cam, p, x, y) {
  const Z = 1 + (cam.z - 1) * p;
  return [SW / 2 + (x - 960 - (cam.x - 960) * p) * Z, SH / 2 + (y - 540 - (cam.y - 540) * p) * Z, Z];
}

// ---------------- sky ----------------
// tod: 0 = morning, 1 = golden afternoon; night: 0..1 (deep navy, stars, a moon upper-left — the light stays upper-left)
const SKY0 = ['#6FBCE3', '#A6D9EF', '#E3EEE9', '#F8E8D2'], SKY1 = ['#7FA9D6', '#E9C9A6', '#FBD6A0', '#FFE3B8'], SKYN = ['#141A44', '#22306B', '#3A4A86', '#5A5A92'];
function sky(c, cam, t, tod = 0, night = 0) {
  const [, hy] = toScreen(cam, .1, 0, 660);
  const g = c.createLinearGradient(0, hy - 900, 0, hy);
  [0, .55, .88, 1].forEach((st, i) => g.addColorStop(st, mix(mix(SKY0[i], SKY1[i], tod), SKYN[i], night)));
  c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = g; c.fillRect(0, 0, SW, SH);
  const [sx, sy] = toScreen(cam, .03, 140 - 40 * tod, 40 + 140 * tod);
  if (night < .99) {
    const sg = c.createRadialGradient(sx, sy, 0, sx, sy, 900 + 200 * tod);
    sg.addColorStop(0, rgba(mix('#FFF0C8', '#FFD08A', tod), (.75 + .15 * tod) * (1 - night)));
    sg.addColorStop(.35, rgba(mix('#FFECC8', '#FFC98A', tod), (.25 + .15 * tod) * (1 - night))); sg.addColorStop(1, 'rgba(255,236,200,0)');
    c.fillStyle = sg; c.fillRect(0, 0, SW, SH);
  }
  if (night > 0) {   // stars + a moon
    c.globalAlpha = night;
    for (let i = 0; i < 90; i++) { const x = hash(i * 3.1) * 2400 - 200, y = hash(i * 7.7) * 520 - 60, r = .8 + hash(i * 1.3) * 1.8; const [px, py] = toScreen(cam, .03, x, y); ell(c, px, py, r, r); c.fillStyle = rgba('#FFF8E6', .5 + .5 * hash(i)); c.fill(); }
    const mg = c.createRadialGradient(sx + 60, sy + 70, 0, sx + 60, sy + 70, 420); mg.addColorStop(0, 'rgba(255,246,220,.45)'); mg.addColorStop(1, 'rgba(255,246,220,0)'); c.fillStyle = mg; c.fillRect(0, 0, SW, SH);
    ell(c, sx + 60, sy + 70, 46, 46); c.fillStyle = '#FFF4D6'; c.fill(); ell(c, sx + 76, sy + 58, 40, 40); c.fillStyle = mix(SKYN[0], SKYN[1], .5); c.fill();
    c.globalAlpha = 1;
  }
  // clouds (cached sprite)
  const CL = [[300, 150, 1.1, .05], [1050, 95, .8, .07], [1650, 210, 1.25, .06], [2300, 130, .9, .05], [-300, 230, .7, .04], [-1100, 170, 1.0, .05], [-1900, 110, .85, .06]];
  const sp = cloudSprite();
  for (const [x, y, s2, p] of CL) {
    layerT(c, cam, p); const cx = x + t * 6 * (1 + s2);
    c.globalAlpha = 1 - .7 * night;
    c.drawImage(sp, cx - 150 * s2, y - 130 * s2, 330 * s2, 200 * s2);
    if (tod > .01 || night > .01) { c.globalAlpha = (.35 * tod + .8 * night) * (1 - .7 * night); c.globalCompositeOperation = 'multiply'; c.drawImage(sp, cx - 150 * s2, y - 130 * s2, 330 * s2, 200 * s2); c.globalCompositeOperation = 'source-over'; }
    c.globalAlpha = 1;
  }
  c.setTransform(1, 0, 0, 1, 0, 0);
}
let CLOUD = null;
function cloudSprite() {
  if (CLOUD) return CLOUD;
  CLOUD = document.createElement('canvas'); CLOUD.width = 660; CLOUD.height = 400;
  const c = CLOUD.getContext('2d', CPU); c.scale(2, 2); cloud(c, 150, 130, 1); return CLOUD;
}
function cloud(c, x, y, s) {
  const blobs = [[-110, 10, 52], [-55, -22, 66], [15, -40, 80], [85, -12, 62], [140, 12, 44]];
  c.save(); c.translate(x, y); c.scale(s, s);
  c.beginPath(); for (const [bx, by, r] of blobs) { c.moveTo(bx + r, by); c.arc(bx, by, r, 0, PI * 2); } c.roundRect(-140, 0, 310, 52, 26);
  c.fillStyle = rgba('#FFF8EE', .96); c.fill();
  c.save(); c.clip(); const g = c.createLinearGradient(0, -40, 0, 52); g.addColorStop(0, 'rgba(185,183,224,0)'); g.addColorStop(1, 'rgba(185,183,224,.45)'); c.fillStyle = g; c.fillRect(-200, -130, 420, 190); c.restore();
  c.restore();
}

// ---------------- far skyline: generic skyscrapers, a water tower, a distant bridge ----------------
const F = mix(mix(P.sky, '#7C78B4', .45), '#DCEAF2', .25), Fl = mix(F, '#EEF4F6', .35), Fd = mix(F, '#7C78B4', .18);
function windowsGrid(c, x, y, w, h, sx = 16, sy = 20) {
  c.fillStyle = rgba('#FFFFFF', .15);
  for (let yy = y + 14; yy < y + h - 16; yy += sy) for (let xx = x + 10; xx < x + w - 8; xx += sx) c.fillRect(xx, yy, 6, 9);
}
function waterTower(c, x, y, s = 1) {   // a rooftop tank on legs with a conical lid (y = the roof line)
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = Fd; for (const lx of [-16, 16]) c.fillRect(lx - 2, -26, 4, 26); c.fillRect(-20, -8, 40, 3);
  c.fillStyle = F; rr(c, -20, -70, 40, 46, 4); c.fill();
  c.fillStyle = Fl; c.fillRect(-20, -70, 8, 46);
  c.fillStyle = Fd; c.fillRect(-20, -58, 40, 2); c.fillRect(-20, -40, 40, 2);
  poly(c, [[-24, -70], [24, -70], [0, -90]]); c.fillStyle = F; c.fill(); c.fillRect(-2, -98, 4, 10);
  c.restore();
}
function bridge(c, x0, x1, deck, towerH) {   // a generic suspension bridge silhouette
  const tx = [x0 + (x1 - x0) * .3, x0 + (x1 - x0) * .7], top = deck - towerH;
  c.strokeStyle = F; c.fillStyle = F; c.lineCap = 'round';
  c.lineWidth = 8; c.beginPath(); c.moveTo(x0 - 200, deck); c.lineTo(x1 + 200, deck); c.stroke();
  for (const x of tx) { for (const s of [-1, 1]) c.fillRect(x + s * 14 - 5, top, 10, towerH + 20); c.fillRect(x - 22, top, 44, 10); c.fillRect(x - 22, top + towerH * .45, 44, 8); poly(c, [[x - 20, top], [x + 20, top], [x, top - 22]]); c.fill(); }
  c.lineWidth = 3;
  const cab = (xa, xb, ya, yb, sag) => { c.beginPath(); c.moveTo(xa, ya); c.quadraticCurveTo((xa + xb) / 2, sag, xb, yb); c.stroke(); };
  cab(tx[0], tx[1], top, top, deck - 18); cab(x0 - 200, tx[0], deck - 2, top, top + 10); cab(tx[1], x1 + 200, top, deck - 2, top + 10);
  c.lineWidth = 1.5;
  for (let x = tx[0] + 24; x < tx[1]; x += 22) { const u = (x - tx[0]) / (tx[1] - tx[0]), y = top + (deck - 18 - top) * 4 * u * (1 - u) * .5 * 2; c.beginPath(); c.moveTo(x, y - (deck - 18 - top) * 2 * u * (1 - u) * 0); c.lineTo(x, deck); c.stroke(); }
}
function far(c) {
  const base = 660;
  // the bridge, far left, behind the towers
  bridge(c, -520, 420, 598, 150);
  // skyscrapers: [x, w, top, kind] kind 0 slab, 1 setback tiers, 2 tapered spire, 3 slab with a water tower
  const B = [[-460, 110, 470, 0], [-330, 150, 380, 1], [-160, 90, 520, 0], [-60, 130, 300, 2], [90, 120, 440, 3], [230, 80, 500, 0], [330, 170, 250, 1], [520, 100, 410, 3],
    [640, 150, 180, 2], [810, 110, 330, 1], [940, 90, 450, 0], [1050, 160, 230, 1], [1230, 110, 380, 3], [1360, 140, 300, 2], [1520, 90, 470, 0], [1630, 150, 330, 1],
    [1800, 110, 410, 0], [1930, 170, 260, 2], [2120, 120, 380, 3], [2260, 90, 480, 0], [2370, 150, 320, 1], [2540, 130, 420, 0]];
  for (const [x, w, top, kind] of B) {
    c.fillStyle = F;
    if (kind === 1) {   // setback tiers
      c.fillRect(x, top + 110, w, base - top - 110 + 2); c.fillRect(x + w * .12, top + 50, w * .76, 64); c.fillRect(x + w * .28, top, w * .44, 54);
      c.fillStyle = Fl; c.fillRect(x, top + 110, 10, base - top - 110); c.fillRect(x + w * .12, top + 50, 8, 64); c.fillRect(x + w * .28, top, 6, 54);
      windowsGrid(c, x, top + 110, w, base - top - 110); windowsGrid(c, x + w * .12, top + 50, w * .76, 64); windowsGrid(c, x + w * .28, top, w * .44, 54);
    } else if (kind === 2) {   // tapered top + spire
      c.fillRect(x, top + 70, w, base - top - 70 + 2); poly(c, [[x, top + 70], [x + w, top + 70], [x + w * .72, top + 20], [x + w * .28, top + 20]]); c.fill();
      c.fillRect(x + w / 2 - 3, top - 40, 6, 62); ell(c, x + w / 2, top - 44, 4, 4); c.fill();
      c.fillStyle = Fl; c.fillRect(x, top + 70, 10, base - top - 70); windowsGrid(c, x, top + 70, w, base - top - 70);
    } else {
      c.fillRect(x, top, w, base - top + 2); c.fillStyle = Fl; c.fillRect(x, top, Math.min(12, w * .15), base - top);
      c.fillStyle = Fd; c.fillRect(x, top, w, 6);
      windowsGrid(c, x, top, w, base - top);
      if (kind === 3) waterTower(c, x + w * .68, top, .8);
    }
  }
  // haze at the base
  const g = c.createLinearGradient(0, 540, 0, base); g.addColorStop(0, rgba('#EEF3F2', 0)); g.addColorStop(1, rgba('#F4EEE4', .85));
  c.fillStyle = g; c.fillRect(-800, 520, 3800, base - 520 + 10);
}

// ---------------- mid layer: across the road (brownstones with stoops + fire escapes, street trees, the taxi) ----------------
const BROWN = mix(mix(P.red, P.mustard, .5), P.ink, .35);                       // brownstone terracotta from red + mustard + ink
const STONE = [BROWN, mix(BROWN, P.cream, .28), mix(P.red, P.cream, .5), mix(P.mustard, P.cream, .5), mix(BROWN, P.cream, .12), mix(P.red, P.cream, .62)];
const DOORS = [P.navy, P.teal, P.ink, P.red, P.navy, P.mustard];
const IRON = rgba('#2A2742', .62);
function brownstone(c, x, w, h, col, door, base, esc) {
  const top = base - h;
  c.fillStyle = col; c.fillRect(x, top, w, h);
  c.fillStyle = dark(col, .12); c.fillRect(x + w - 5, top, 5, h);                     // party-wall shade
  // cornice with dentils + parapet
  c.fillStyle = light(col, .3); c.fillRect(x - 3, top - 8, w + 6, 14);
  c.fillStyle = dark(col, .2); for (let dx = 8; dx < w - 6; dx += 12) c.fillRect(x + dx, top + 6, 6, 5);
  c.fillStyle = rgba('#3B2F6B', .14); c.fillRect(x, top + 12, w, 5);
  // tall windows: 3 floors × 2, with a lintel and a sill
  const win = (wx, wy, ww, wh) => {
    c.fillStyle = dark(col, .25); c.fillRect(wx - 4, wy - 8, ww + 8, 8);               // lintel
    c.fillStyle = mix(P.navy, P.sky, .55); c.fillRect(wx, wy, ww, wh);
    c.fillStyle = rgba('#FFFFFF', .28); poly(c, [[wx + ww * .2, wy + wh], [wx + ww * .75, wy], [wx + ww, wy], [wx + ww * .45, wy + wh]]); c.fill();
    c.fillStyle = P.cream; c.fillRect(wx, wy + wh / 2 - 1.5, ww, 3); c.fillRect(wx + ww / 2 - 1.5, wy, 3, wh);
    c.fillStyle = light(col, .35); c.fillRect(wx - 5, wy + wh, ww + 10, 5);             // sill
  };
  const ww = w * .2, wh = 52;
  for (let f = 0; f < 3; f++) for (let i = 0; i < 2; i++) win(x + w * (.14 + i * .34), top + 36 + f * 68, ww, wh);
  // raised parlour door + stoop (steps come down toward us) with railings
  const dxx = x + w * .72, dw = w * .2, dTop = base - 110, dBot = base - 52;
  c.fillStyle = light(col, .35); rr(c, dxx - 5, dTop - 8, dw + 10, dBot - dTop + 8, { tl: 10, tr: 10 }); c.fill();
  c.fillStyle = door; rr(c, dxx, dTop, dw, dBot - dTop, { tl: 7, tr: 7 }); c.fill();
  c.fillStyle = rgba('#FFFFFF', .3); c.fillRect(dxx + 4, dTop + 6, dw - 8, 10);
  c.fillStyle = P.mustard; ell(c, dxx + dw * .78, dTop + (dBot - dTop) * .55, 2.2, 2.2); c.fill();
  for (let i = 0; i < 5; i++) { const sy = dBot + i * 10.5, sw = dw + 8 + i * 7; c.fillStyle = i % 2 ? light(col, .42) : light(col, .55); c.fillRect(dxx + dw / 2 - sw / 2, sy, sw, 10.5); c.fillStyle = rgba('#3B2F6B', .12); c.fillRect(dxx + dw / 2 - sw / 2, sy + 8.5, sw, 2); }
  c.strokeStyle = IRON; c.lineWidth = 2.2; c.lineCap = 'round';
  for (const s of [-1, 1]) {
    const x0 = dxx + dw / 2 + s * (dw / 2 + 6), x1 = dxx + dw / 2 + s * (dw / 2 + 24);
    c.beginPath(); c.moveTo(x0, dBot - 30); c.lineTo(x1, base - 26); c.stroke(); c.beginPath(); c.moveTo(x0, dBot - 30); c.lineTo(x0, dBot); c.stroke();
    for (let k = 1; k < 4; k++) { const u = k / 4; c.beginPath(); c.moveTo(lerp(x0, x1, u), lerp(dBot - 30, base - 26, u)); c.lineTo(lerp(x0, x1, u), lerp(dBot, base, u)); c.stroke(); }
    ell(c, x0, dBot - 33, 3, 3); c.fillStyle = IRON; c.fill();
  }
  // garden-level window with a grille, under the parlour floor
  const gx = x + w * .16, gy = base - 44;
  c.fillStyle = mix(P.navy, P.sky, .45); c.fillRect(gx, gy, w * .3, 32);
  c.strokeStyle = IRON; c.lineWidth = 1.5; for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(gx + w * .3 * k / 4, gy); c.lineTo(gx + w * .3 * k / 4, gy + 32); c.stroke(); }
  // fire escape on the left window column: a balcony per floor + a zig-zag ladder
  if (esc) {
    const bx = x + w * .08, bw = w * .34;
    c.strokeStyle = IRON; c.fillStyle = IRON; c.lineWidth = 2;
    for (let f = 0; f < 3; f++) {
      const by = top + 36 + f * 68 + wh + 4;
      c.fillRect(bx, by, bw, 3);
      for (let k = 0; k <= 6; k++) { c.beginPath(); c.moveTo(bx + bw * k / 6, by); c.lineTo(bx + bw * k / 6, by - 16); c.stroke(); }
      c.beginPath(); c.moveTo(bx, by - 16); c.lineTo(bx + bw, by - 16); c.stroke();
      if (f < 2) { const ny = top + 36 + (f + 1) * 68 + wh + 4; c.beginPath(); c.moveTo(f % 2 ? bx + bw * .9 : bx + bw * .1, by); c.lineTo(f % 2 ? bx + bw * .5 : bx + bw * .5, ny); c.stroke(); for (let k = 1; k < 5; k++) { const u = k / 5, lx = lerp(f % 2 ? bx + bw * .9 : bx + bw * .1, bx + bw * .5, u), ly = lerp(by, ny, u); c.beginPath(); c.moveTo(lx - 5, ly); c.lineTo(lx + 5, ly); c.stroke(); } }
    }
  }
}
function tree(c, x, base, s = 1) {
  c.fillStyle = '#7A5A55'; c.fillRect(x - 5 * s, base - 70 * s, 10 * s, 70 * s);
  const L = P.leaf, Ld = dark(L, .22);
  c.beginPath(); for (const [bx, by, r] of [[-30, -88, 40], [18, -100, 46], [0, -132, 42], [36, -74, 32], [-46, -60, 26]]) { c.moveTo(x + bx * s + r * s, base + by * s); c.arc(x + bx * s, base + by * s, r * s, 0, PI * 2); }
  c.fillStyle = Ld; c.fill();
  c.beginPath(); for (const [bx, by, r] of [[-34, -92, 36], [12, -106, 40], [-4, -136, 36], [28, -82, 26], [-50, -64, 20]]) { c.moveTo(x + bx * s + r * s, base + by * s); c.arc(x + bx * s, base + by * s, r * s, 0, PI * 2); }
  c.fillStyle = L; c.fill();
  c.fillStyle = rgba('#FFFFFF', .16); ell(c, x - 20 * s, base - 140 * s, 16 * s, 10 * s, -.5); c.fill();
  // tree pit grate
  c.fillStyle = rgba('#2A2742', .25); c.fillRect(x - 22 * s, base - 2, 44 * s, 4);
}
function mid(c) {
  const base = 700;
  let x = -2780, i = 0;
  const W = [168, 182, 160, 190, 174, 166], Hh = [262, 282, 250, 290, 270, 256];
  while (x < 2900) { const w = W[i % 6], h = Hh[(i * 5) % 6]; brownstone(c, x, w, h, STONE[i % 6], DOORS[(i * 7) % 6], base, i % 2 === 0); x += w; i++; }
  // far pavement + road (a yellow centre line, crosswalk stripes near the school)
  c.fillStyle = '#E2D7CC'; c.fillRect(-2900, base - 4, 5900, 14);
  c.fillStyle = '#8F90AC'; c.fillRect(-2900, base + 10, 5900, 70);
  c.fillStyle = rgba(P.mustard, .85); c.fillRect(-2900, base + 43, 5900, 3); c.fillRect(-2900, base + 49, 5900, 3);
  c.fillStyle = rgba(P.cream, .75); for (let xx = 1180; xx < 1500; xx += 36) c.fillRect(xx, base + 14, 20, 62);
  for (const tx of [-2220, -1760, -1300, -840, -380, 60, 520, 980, 1440, 1900, 2360]) tree(c, tx, base + 4, 1.05);
}
// the yellow cab (driving left), drawn with its base line at (x, base)
export function taxi(c, x, base, s) {
  c.save(); c.translate(x, base); c.scale(s, s);
  const L = 300, Y = P.mustard, gl = mix(P.navy, P.sky, .45);
  contact(c, 8, 0, 160, 9, .25);
  // body + cabin
  c.fillStyle = dark(Y, .12); rr(c, -L / 2, -58, L, 48, 14); c.fill();
  c.fillStyle = Y; rr(c, -L / 2, -62, L, 48, 14); c.fill();
  poly(c, [[-L / 2 + 70, -62], [-L / 2 + 100, -112], [L / 2 - 60, -112], [L / 2 - 30, -62]]); c.fillStyle = Y; c.fill();
  c.fillStyle = gl; poly(c, [[-L / 2 + 78, -66], [-L / 2 + 104, -106], [-L / 2 + 160, -106], [-L / 2 + 160, -66]]); c.fill();
  rr(c, -L / 2 + 168, -106, 62, 40, 4); c.fill(); poly(c, [[-L / 2 + 238, -106], [L / 2 - 64, -106], [L / 2 - 40, -66], [-L / 2 + 238, -66]]); c.fill();
  c.fillStyle = rgba('#FFFFFF', .28); poly(c, [[-L / 2 + 96, -70], [-L / 2 + 116, -104], [-L / 2 + 132, -104], [-L / 2 + 112, -70]]); c.fill();
  // checker band + doors
  c.fillStyle = P.ink; for (let i = 0; i < 22; i++) for (let j = 0; j < 2; j++) if ((i + j) % 2 === 0) c.fillRect(-L / 2 + 14 + i * 12.3, -44 + j * 6, 6.15, 6);
  c.strokeStyle = rgba('#3B2F6B', .35); c.lineWidth = 2; c.beginPath(); c.moveTo(-L / 2 + 164, -106); c.lineTo(-L / 2 + 164, -20); c.moveTo(-L / 2 + 234, -106); c.lineTo(-L / 2 + 234, -20); c.stroke();
  // roof sign
  c.fillStyle = P.cream; rr(c, -30, -130, 72, 20, 5); c.fill(); c.fillStyle = P.navy; c.font = '400 15px "Lilita One"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.letterSpacing = '2px'; c.fillText('TAXI', 6, -119); c.letterSpacing = '0px';
  // lights, bumpers, wheels
  c.fillStyle = P.cream; rr(c, -L / 2 + 2, -50, 14, 10, 3); c.fill(); c.fillStyle = P.red; rr(c, L / 2 - 14, -50, 12, 10, 3); c.fill();
  c.fillStyle = '#B9B6CC'; rr(c, -L / 2 - 6, -28, 22, 10, 4); c.fill(); rr(c, L / 2 - 16, -28, 22, 10, 4); c.fill();
  c.fillStyle = rgba('#3B2F6B', .22); c.fillRect(-L / 2, -24, L, 10);
  for (const wx of [-L / 2 + 62, L / 2 - 62]) { ell(c, wx, -12, 24, 24); c.fillStyle = P.ink; c.fill(); ell(c, wx, -12, 10, 10); c.fillStyle = '#B9B6CC'; c.fill(); }
  c.restore();
}

// ---------------- near layer: our pavement + street furniture + the ENGLISH SCHOOL with a stoop ----------------
function pavement(c) {
  const X0 = -3400, X1 = 3300;
  c.fillStyle = '#CFC4BA'; c.fillRect(X0, 770, X1 - X0, 14);         // kerb
  c.fillStyle = '#F0E8DC'; c.fillRect(X0, 770, X1 - X0, 4);
  const g = c.createLinearGradient(0, 784, 0, 1200); g.addColorStop(0, '#EDE3D5'); g.addColorStop(1, '#E2D5C6');
  c.fillStyle = g; c.fillRect(X0, 784, X1 - X0, 900);
  c.strokeStyle = rgba('#8B7C8E', .16); c.lineWidth = 2;
  for (const y of [812, 858, 925, 1015, 1130]) { c.beginPath(); c.moveTo(X0, y); c.lineTo(X1, y); c.stroke(); }
  for (let x = X0; x < X1; x += 150) { const vx = Math.round((x + 600) / 1500) * 1500 - 540, vy = 300; c.beginPath(); c.moveTo(x, 784); c.lineTo(x + (x - vx) * (1300 - 784) / (784 - vy), 1300); c.stroke(); }
}
function hydrant(c, x, base) {
  contact(c, x + 8, base + 2, 36, 7, .3);
  formed(c, { x: x - 50, y: base - 120, w: 100, h: 130 }, l => {
    l.fillStyle = P.red;
    rr(l, x - 26, base - 12, 52, 12, 3); l.fill();                                  // flange
    rr(l, x - 17, base - 84, 34, 76, 9); l.fill();                                   // barrel
    l.beginPath(); l.ellipse(x, base - 84, 19, 14, 0, PI, 2 * PI); l.fill();          // dome
    rr(l, x - 7, base - 104, 14, 10, 4); l.fill();                                    // bonnet nut
    for (const s of [-1, 1]) { rr(l, x + s * 20 - 9, base - 62, 18, 16, 5); l.fill(); ell(l, x + s * 26, base - 54, 7, 7); l.fillStyle = dark(P.red, .35); l.fill(); l.fillStyle = P.red; }
    ell(l, x, base - 44, 8, 8); l.fillStyle = dark(P.red, .35); l.fill();            // front cap
    l.fillStyle = dark(P.red, .25); l.fillRect(x - 17, base - 30, 34, 4);
  }, { sx: 7, sy: 4, soft: 1.5, shadeA: .45, hx: 3, hy: 3, hiA: .4, hy0: base - 110, hy1: base });
}
function subwaySign(c, x, base) {   // a plain sign post: navy plate "SUBWAY" with a down-arrow, a round lamp on top (no transit logos)
  contact(c, x + 10, base + 2, 30, 6, .25);
  formed(c, { x: x - 110, y: base - 330, w: 220, h: 340 }, l => {
    l.fillStyle = P.navy; rr(l, x - 7, base - 300, 14, 300, 5); l.fill(); rr(l, x - 20, base - 10, 40, 10, 4); l.fill();
    l.fillStyle = rgba('#FFFFFF', .14); l.fillRect(x - 4, base - 296, 3, 290);
    ell(l, x, base - 310, 18, 18); l.fillStyle = P.leaf; l.fill(); ell(l, x - 6, base - 316, 6, 4, -.5); l.fillStyle = rgba('#FFFFFF', .45); l.fill();
    l.fillStyle = P.navy; rr(l, x - 92, base - 262, 184, 60, 10); l.fill();
    l.strokeStyle = P.mustard; l.lineWidth = 3; rr(l, x - 84, base - 254, 168, 44, 7); l.stroke();
    l.fillStyle = P.cream; l.font = '400 30px "Lilita One"'; l.textAlign = 'center'; l.textBaseline = 'middle'; l.letterSpacing = '4px'; l.fillText('SUBWAY', x - 10, base - 231); l.letterSpacing = '0px';
    l.fillStyle = P.mustard; l.beginPath(); l.moveTo(x + 62, base - 246); l.lineTo(x + 70, base - 246); l.lineTo(x + 70, base - 232); l.lineTo(x + 76, base - 232); l.lineTo(x + 66, base - 220); l.lineTo(x + 56, base - 232); l.lineTo(x + 62, base - 232); l.closePath(); l.fill();
  }, { sx: 6, sy: 4, soft: 1.5, shadeA: .4, hx: 3, hy: 3, hiA: .35, hy0: base - 330, hy1: base });
}
function newsBox(c, x, base) {
  contact(c, x + 8, base + 2, 40, 7, .28);
  formed(c, { x: x - 50, y: base - 130, w: 100, h: 140 }, l => {
    l.fillStyle = P.navy; rr(l, x - 30, base - 112, 60, 112, 6); l.fill();
    l.fillStyle = dark(P.navy, .3); rr(l, x - 26, base - 8, 52, 8, 3); l.fill();
    l.fillStyle = mix(P.navy, P.sky, .5); rr(l, x - 22, base - 100, 44, 46, 4); l.fill();
    l.fillStyle = rgba('#FFFFFF', .28); poly(l, [[x - 16, base - 56], [x + 2, base - 100], [x + 12, base - 100], [x - 6, base - 56]]); l.fill();
    l.fillStyle = P.cream; rr(l, x - 18, base - 94, 32, 22, 3); l.fill(); l.fillStyle = rgba(P.ink, .5); for (let k = 0; k < 3; k++) l.fillRect(x - 14, base - 89 + k * 5, 24 - k * 6, 2);
    l.fillStyle = P.mustard; rr(l, x - 10, base - 44, 20, 6, 3); l.fill();
    l.fillStyle = rgba('#FFFFFF', .12); l.fillRect(x - 28, base - 110, 6, 100);
  }, { sx: 7, sy: 4, soft: 1.5, shadeA: .45, hx: 3, hy: 3, hiA: .35, hy0: base - 120, hy1: base });
}
function hotdogCart(c, x, base) {
  contact(c, x + 14, base + 2, 110, 10, .28);
  formed(c, { x: x - 150, y: base - 300, w: 300, h: 310 }, l => {
    // umbrella
    l.fillStyle = P.navy; rr(l, x + 14, base - 260, 6, 180, 3); l.fill();
    l.beginPath(); l.moveTo(x - 120, base - 232); l.quadraticCurveTo(x + 17, base - 320, x + 154, base - 232); l.closePath(); l.fillStyle = P.mustard; l.fill();
    l.fillStyle = P.cream; for (let k = 0; k < 3; k++) { const a0 = -120 + k * 92, a1 = a0 + 46; l.beginPath(); l.moveTo(x + 17, base - 232); l.quadraticCurveTo(x + 17 + a0 * .55, base - 300, x + 17 + a0, base - 232); l.lineTo(x + 17 + a1, base - 232); l.quadraticCurveTo(x + 17 + a1 * .55, base - 300, x + 17, base - 232); l.closePath(); l.fill(); }
    l.fillStyle = dark(P.mustard, .2); for (let k = 0; k < 7; k++) { ell(l, x - 120 + k * 45.6, base - 230, 23, 9); l.fill(); } l.fillStyle = P.mustard; for (let k = 0; k < 7; k++) { ell(l, x - 120 + k * 45.6, base - 233, 23, 9); l.fill(); }
    // cart box
    l.fillStyle = '#FFFBF4'; rr(l, x - 86, base - 110, 172, 82, 8); l.fill();
    l.fillStyle = P.navy; l.fillRect(x - 86, base - 110, 172, 14); l.fillStyle = P.red; l.fillRect(x - 86, base - 96, 172, 5);
    l.fillStyle = rgba('#3B2F6B', .12); l.fillRect(x - 86, base - 36, 172, 8);
    l.fillStyle = P.navy; l.font = '600 14px "Fredoka"'; l.textAlign = 'center'; l.textBaseline = 'middle'; l.fillText('HOT DOGS', x, base - 66);
    l.fillStyle = dark('#FFFBF4', .12); rr(l, x - 70, base - 86, 24, 12, 3); l.fill(); rr(l, x + 46, base - 86, 24, 12, 3); l.fill();
    // lids + bottles on top, handle, wheels
    l.fillStyle = '#B9B6CC'; rr(l, x - 70, base - 122, 60, 12, 4); l.fill(); rr(l, x, base - 122, 60, 12, 4); l.fill();
    l.fillStyle = P.red; rr(l, x + 66, base - 134, 10, 24, 4); l.fill(); l.fillStyle = P.mustard; rr(l, x + 78, base - 134, 10, 24, 4); l.fill();
    l.strokeStyle = P.navy; l.lineWidth = 5; l.lineCap = 'round'; l.beginPath(); l.moveTo(x - 86, base - 96); l.lineTo(x - 118, base - 112); l.stroke();
    for (const wx of [x - 50, x + 50]) { ell(l, wx, base - 14, 16, 16); l.fillStyle = P.ink; l.fill(); ell(l, wx, base - 14, 6, 6); l.fillStyle = '#B9B6CC'; l.fill(); }
  }, { sx: 8, sy: 5, soft: 2, shadeA: .42, hx: 3, hy: 3, hiA: .35, hy0: base - 300, hy1: base - 40 });
}
function planter(c, x, base) {
  contact(c, x + 8, base + 2, 52, 8, .28);
  formed(c, { x: x - 70, y: base - 190, w: 140, h: 200 }, l => {
    l.fillStyle = '#6E5149'; l.fillRect(x - 4, base - 90, 8, 50);
    l.fillStyle = P.leaf; ell(l, x, base - 120, 50, 50); l.fill();
    l.fillStyle = light(P.leaf, .15); ell(l, x - 26, base - 150, 14, 9, -.6); l.fill();
    l.fillStyle = P.teal; rr(l, x - 38, base - 52, 76, 52, 6); l.fill();
    l.fillStyle = light(P.teal, .2); l.fillRect(x - 42, base - 56, 84, 10);
  }, { sx: 12, sy: 8, soft: 3, shadeA: .5, hx: 3, hy: 3, hiA: .4, hy0: base - 170, hy1: base - 60 });
}
export const CLOCK = { x: 1530, y: 418 };
export const STOOP = { top: 795, bottom: 868, w0: 190, w1: 300 };
export function school(c) {
  const x0 = 1140, x1 = 1920, base = 795, top = 150;
  const ST = '#F4E7D0', STd = dark(ST, .07);
  c.fillStyle = light(ST, .35); c.fillRect(x0 - 26, top + 12, 26, base - top - 12);
  c.fillStyle = ST; c.fillRect(x0, top, x1 - x0, base - top);
  // rusticated ground floor
  c.fillStyle = STd; c.fillRect(x0, 560, x1 - x0, base - 560);
  c.strokeStyle = rgba('#9C8A80', .25); c.lineWidth = 2;
  for (let y = 586; y < base; y += 30) { c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke(); }
  c.fillStyle = light(ST, .4); c.fillRect(x0 - 8, 552, x1 - x0 + 16, 12);
  c.fillStyle = rgba('#3B2F6B', .1); c.fillRect(x0, 564, x1 - x0, 8);
  // cornice + parapet + frieze sign
  c.fillStyle = light(ST, .45); c.fillRect(x0 - 16, top - 8, x1 - x0 + 32, 26);
  c.fillStyle = rgba('#3B2F6B', .14); c.fillRect(x0, top + 18, x1 - x0, 10);
  c.fillStyle = ST; c.fillRect(x0 - 6, top - 52, x1 - x0 + 12, 46);
  c.fillStyle = STd; for (let x = x0 + 10; x < x1 - 10; x += 26) { rr(c, x, top - 44, 14, 32, 7); c.fill(); }
  c.fillStyle = light(ST, .45); c.fillRect(x0 - 12, top - 60, x1 - x0 + 24, 12);
  // a water tower on the school's own roof (the NY tell, seen in the wide shot)
  c.save(); c.translate(1270, top - 60); c.scale(1.15, 1.15);
  c.fillStyle = '#6E5149'; for (const lx of [-16, 16]) c.fillRect(lx - 2, -26, 4, 26); c.fillRect(-20, -8, 40, 3);
  c.fillStyle = '#B98A62'; rr(c, -20, -70, 40, 46, 4); c.fill(); c.fillStyle = rgba('#FFFFFF', .22); c.fillRect(-18, -70, 8, 46);
  c.fillStyle = rgba('#3B2F6B', .25); c.fillRect(-20, -58, 40, 2); c.fillRect(-20, -40, 40, 2);
  poly(c, [[-24, -70], [24, -70], [0, -90]]); c.fillStyle = '#8A6A4E'; c.fill(); c.fillRect(-2, -98, 4, 10);
  c.restore();
  // sign board
  const sx = (x0 + x1) / 2;
  c.fillStyle = rgba('#3B2F6B', .18); rr(c, sx - 330, 196, 660, 92, 14); c.fill();
  c.fillStyle = P.navy; rr(c, sx - 334, 188, 668, 92, 14); c.fill();
  c.strokeStyle = P.mustard; c.lineWidth = 5; rr(c, sx - 322, 198, 644, 72, 9); c.stroke();
  c.fillStyle = P.cream; c.font = '400 58px "Lilita One"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.letterSpacing = '6px'; c.fillText('ENGLISH SCHOOL', sx + 3, 237); c.letterSpacing = '0px'; c.textBaseline = 'alphabetic';
  for (const s of [-1, 1]) { ell(c, sx + s * 300, 234, 7, 7); c.fillStyle = P.mustard; c.fill(); }
  const win = (wx, wy, ww, wh, cap) => {
    c.fillStyle = rgba('#3B2F6B', .14); rr(c, wx - 8, wy - 6, ww + 20, wh + 18, 6); c.fill();
    c.fillStyle = '#FFFBF4'; rr(c, wx - 10, wy - 10, ww + 20, wh + 20, 6); c.fill();
    c.fillStyle = mix(P.navy, P.sky, .5); c.fillRect(wx, wy, ww, wh);
    c.fillStyle = rgba('#3B2F6B', .25); c.fillRect(wx, wy, ww, 8); c.fillRect(wx + ww - 6, wy, 6, wh);
    c.fillStyle = rgba('#FFFFFF', .3); poly(c, [[wx + ww * .1, wy + wh], [wx + ww * .6, wy], [wx + ww * .85, wy], [wx + ww * .35, wy + wh]]); c.fill();
    c.fillStyle = '#FFFBF4'; c.fillRect(wx, wy + wh * .5 - 4, ww, 8); c.fillRect(wx + ww / 2 - 3, wy, 6, wh);
    for (const f of [.25, .75]) c.fillRect(wx, wy + wh * f - 2, ww, 4);
    if (cap) { c.fillStyle = light(ST, .5); poly(c, [[wx - 18, wy - 12], [wx + ww + 18, wy - 12], [wx + ww / 2, wy - 40]]); c.fill(); c.fillStyle = rgba('#3B2F6B', .1); c.fillRect(wx - 12, wy - 12, ww + 24, 4); }
  };
  for (const cx of [1218, 1374, 1686, 1842]) win(cx - 46, 340, 92, 150, true);
  // the school clock (face only; hands are live)
  const CX = CLOCK.x, CY = CLOCK.y;
  c.fillStyle = rgba('#3B2F6B', .14); ell(c, CX + 6, CY + 8, 70, 70); c.fill();
  c.fillStyle = light(ST, .5); poly(c, [[CX - 70, CY - 66], [CX + 70, CY - 66], [CX, CY - 100]]); c.fill();
  c.fillStyle = P.navy; ell(c, CX, CY, 68, 68); c.fill();
  c.fillStyle = P.mustard; ell(c, CX, CY, 60, 60); c.fill();
  c.fillStyle = '#FFFBF4'; ell(c, CX, CY, 53, 53); c.fill();
  c.fillStyle = P.ink;
  for (let i = 0; i < 12; i++) { const a = i / 12 * 2 * PI; c.save(); c.translate(CX + Math.sin(a) * 46, CY - Math.cos(a) * 46); c.rotate(a); rr(c, -2.5, -(i % 3 ? 4 : 7), 5, i % 3 ? 8 : 14, 2.5); c.fill(); c.restore(); }
  // ground floor windows + window boxes; garden-level grilled windows under them
  for (const cx of [1262, 1798]) {
    win(cx - 52, 606, 104, 118, false);
    c.fillStyle = dark(P.leaf, .15); rr(c, cx - 66, 732, 132, 24, 12); c.fill();
    c.fillStyle = P.leaf; for (let i = 0; i < 7; i++) { ell(c, cx - 54 + i * 18, 732, 13, 11); c.fill(); }
    for (let i = 0; i < 6; i++) { c.fillStyle = i % 2 ? P.mustard : P.red; ell(c, cx - 46 + i * 18, 726 - (i % 3) * 3, 5, 5); c.fill(); }
    c.fillStyle = P.teal; rr(c, cx - 64, 748, 128, 22, 4); c.fill();
  }
  // portico: pediment, fanlight, columns — the school's door language (pediment, fanlight, columns) on top of a stoop
  const dx = DOOR.x, dw = 116, dh = 196, dTop = base - dh;
  c.fillStyle = rgba('#3B2F6B', .12); rr(c, dx - 128, 580, 270, 20, 4); c.fill();
  c.fillStyle = '#FFFBF4'; rr(c, dx - 138, 560, 276, 26, 5); c.fill();
  poly(c, [[dx - 130, 562], [dx + 130, 562], [dx, 520]]); c.fill();
  c.fillStyle = rgba('#3B2F6B', .08); poly(c, [[dx - 96, 556], [dx + 96, 556], [dx, 532]]); c.fill();
  c.fillStyle = dark(ST, .25); rr(c, dx - dw / 2 - 12, dTop - 70, dw + 24, dh + 70, { tl: 70, tr: 70 }); c.fill();
  c.save(); c.beginPath(); c.arc(dx, dTop - 4, dw / 2, PI, 2 * PI); c.closePath(); c.fillStyle = mix(P.navy, P.sky, .45); c.fill();
  c.strokeStyle = '#FFFBF4'; c.lineWidth = 4; for (let i = 1; i < 6; i++) { const a = PI + i / 6 * PI; c.beginPath(); c.moveTo(dx, dTop - 4); c.lineTo(dx + Math.cos(a) * dw / 2, dTop - 4 + Math.sin(a) * dw / 2); c.stroke(); }
  c.lineWidth = 6; c.beginPath(); c.arc(dx, dTop - 4, dw / 2, PI, 2 * PI); c.stroke(); c.restore();
  for (const s of [-1, 1]) {
    const cx = dx + s * 104;
    c.fillStyle = '#FFFBF4'; c.fillRect(cx - 13, 586, 26, base - 586);
    c.fillStyle = rgba('#3B2F6B', .12); c.fillRect(cx + 4, 586, 9, base - 586);
    c.fillStyle = '#FFFBF4'; c.fillRect(cx - 18, 586, 36, 10); c.fillRect(cx - 18, base - 12, 36, 12);
  }
  c.fillStyle = P.mustard; rr(c, dx + 132, 640, 44, 30, 4); c.fill(); c.fillStyle = dark(P.mustard, .3); c.fillRect(dx + 140, 650, 28, 3); c.fillRect(dx + 140, 657, 20, 3);
  // the NY stoop: six stone steps widening toward us, cheek walls, and iron railings with ball finials
  const { top: sTop, bottom: sBot, w0, w1 } = STOOP, N = 6;
  c.fillStyle = rgba('#3B2F6B', .12); c.fillRect(x0 - 26, base - 4, x1 - x0 + 26, 8);
  for (let i = 0; i < N; i++) {
    const y = sTop + i * (sBot - sTop) / N, h = (sBot - sTop) / N, w = lerp(w0, w1, (i + 1) / N);
    c.fillStyle = i % 2 ? '#E4D9CB' : '#ECE2D5'; rr(c, dx - w / 2, y, w, h + 1, 2); c.fill();
    c.fillStyle = rgba('#3B2F6B', .13); c.fillRect(dx - w / 2, y + h - 3, w, 3);
    c.fillStyle = rgba('#FFFFFF', .35); c.fillRect(dx - w / 2, y, w, 2);
  }
  for (const s of [-1, 1]) {
    const xa = dx + s * (w0 / 2 + 4), xb = dx + s * (w1 / 2 + 6);
    c.fillStyle = '#DACFC2'; poly(c, [[xa, sTop - 4], [xa + s * 18, sTop - 4], [xb + s * 16, sBot + 2], [xb - s * 2, sBot + 2]]); c.fill();   // cheek wall
    c.fillStyle = rgba('#3B2F6B', .1); poly(c, [[xa + s * 10, sTop - 4], [xa + s * 18, sTop - 4], [xb + s * 16, sBot + 2], [xb + s * 8, sBot + 2]]); c.fill();
    const N2 = '#2B3060'; c.strokeStyle = N2; c.fillStyle = N2; c.lineCap = 'round';
    const rx0 = xa + s * 9, rx1 = xb + s * 7, ry0 = sTop - 66, ry1 = sBot - 60;
    c.lineWidth = 5; c.beginPath(); c.moveTo(rx0, ry0); c.lineTo(rx1, ry1); c.stroke();
    c.lineWidth = 4; c.beginPath(); c.moveTo(rx0, ry0); c.lineTo(rx0, sTop - 4); c.moveTo(rx1, ry1); c.lineTo(rx1, sBot + 2); c.stroke();
    c.lineWidth = 2.2; for (let k = 1; k < 5; k++) { const u = k / 5; c.beginPath(); c.moveTo(lerp(rx0, rx1, u), lerp(ry0, ry1, u)); c.lineTo(lerp(rx0, rx1, u), lerp(sTop - 4, sBot + 2, u)); c.stroke(); }
    ell(c, rx0, ry0 - 6, 6, 6); c.fill(); ell(c, rx1, ry1 - 6, 6, 6); c.fill();
  }
}
// live parts of the school: the doorway interior + the door leaf (open 0..1); world coordinates
export function doorLive(c, door) {
  const dx = DOOR.x, dw = 116, dh = 196, base = 795, dTop = base - dh;
  const gi = c.createLinearGradient(0, dTop, 0, base); gi.addColorStop(0, '#5B4058'); gi.addColorStop(1, '#8A5E5A');
  c.fillStyle = gi; c.fillRect(dx - dw / 2, dTop, dw, dh);
  c.fillStyle = '#C98B5E'; c.fillRect(dx - dw / 2, base - 46, dw, 46);
  c.fillStyle = rgba('#FFE2A8', .5); rr(c, dx - 18, dTop + 40, 46, 60, 3); c.fill();
  c.fillStyle = rgba(P.red, .7); c.fillRect(dx - 12, dTop + 48, 14, 18); c.fillStyle = rgba(P.teal, .7); c.fillRect(dx + 8, dTop + 54, 14, 14);
  const g = c.createRadialGradient(dx, base - 70, 10, dx, base - 70, 150); g.addColorStop(0, 'rgba(255,214,150,.6)'); g.addColorStop(1, 'rgba(255,214,150,0)');
  c.fillStyle = g; c.fillRect(dx - dw / 2, dTop, dw, dh);
  const open = clamp(door), lw = dw * Math.cos(open * PI * .47);
  c.fillStyle = P.teal; c.fillRect(dx - dw / 2, dTop, lw, dh);
  if (lw > 20) {
    c.fillStyle = dark(P.teal, .18);
    for (const [py, ph] of [[18, 70], [104, 76]]) { rr(c, dx - dw / 2 + lw * .14, dTop + py, lw * .72, ph, 4); c.fill(); }
    c.fillStyle = P.mustard; ell(c, dx - dw / 2 + lw * .82, dTop + dh * .52, 5, 5); c.fill();
    ell(c, dx - dw / 2 + lw * .5, dTop + 58, 8, 5); c.fill();
  }
  c.fillStyle = rgba('#3B2F6B', .25); c.fillRect(dx - dw / 2 + lw - 4, dTop, 4 + open * 10, dh);
}
export function clockHands(c, hours) {
  const CX = CLOCK.x, CY = CLOCK.y, ha = (hours % 12) / 12 * 2 * PI, ma = (hours % 1) * 2 * PI;
  c.lineCap = 'round'; c.strokeStyle = P.ink;
  c.lineWidth = 7; c.beginPath(); c.moveTo(CX, CY); c.lineTo(CX + Math.sin(ha) * 26, CY - Math.cos(ha) * 26); c.stroke();
  c.lineWidth = 5; c.beginPath(); c.moveTo(CX, CY); c.lineTo(CX + Math.sin(ma) * 40, CY - Math.cos(ma) * 40); c.stroke();
  c.fillStyle = P.red; ell(c, CX, CY, 6, 6); c.fill();
}
function neighbour(c) {   // the brick walk-up next door, with a fire escape
  const x0 = 1920, x1 = 2460, base = 795, top = 170, col = mix(P.red, P.cream, .58);
  c.fillStyle = col; c.fillRect(x0, top, x1 - x0, base - top);
  c.fillStyle = rgba('#3B2F6B', .12); c.fillRect(x0, top, 14, base - top);
  c.fillStyle = light(col, .4); c.fillRect(x0 - 6, top - 14, x1 - x0 + 12, 20);
  c.fillStyle = dark(col, .15); for (let dx = 8; dx < x1 - x0 - 6; dx += 14) c.fillRect(x0 + dx, top + 6, 7, 5);
  for (let f = 0; f < 3; f++) for (let i = 0; i < 3; i++) {
    const wx = x0 + 60 + i * 150, wy = top + 50 + f * 170;
    c.fillStyle = dark(col, .25); c.fillRect(wx - 8, wy - 10, 96, 10);
    c.fillStyle = mix(P.navy, P.sky, .5); c.fillRect(wx, wy, 80, 120);
    c.fillStyle = '#FFFBF4'; c.fillRect(wx, wy + 58, 80, 6); c.fillRect(wx + 37, wy, 6, 120);
    c.fillStyle = rgba('#FFFFFF', .28); poly(c, [[wx + 8, wy + 120], [wx + 50, wy], [wx + 70, wy], [wx + 28, wy + 120]]); c.fill();
    c.fillStyle = light(col, .35); c.fillRect(wx - 8, wy + 120, 96, 6);
  }
  c.strokeStyle = IRON; c.fillStyle = IRON; c.lineWidth = 3;
  for (let f = 0; f < 3; f++) { const by = top + 50 + f * 170 + 128, bx = x0 + 40, bw = 130; c.fillRect(bx, by, bw, 4); for (let k = 0; k <= 8; k++) { c.beginPath(); c.moveTo(bx + bw * k / 8, by); c.lineTo(bx + bw * k / 8, by - 26); c.stroke(); } c.beginPath(); c.moveTo(bx, by - 26); c.lineTo(bx + bw, by - 26); c.stroke(); if (f < 2) { c.beginPath(); c.moveTo(bx + bw * .85, by); c.lineTo(bx + bw * .35, by + 170); c.stroke(); } }
  c.fillStyle = P.ink; rr(c, x0 + 330, base - 180, 90, 180, { tl: 45, tr: 45 }); c.fill();
}
// the bishop's-crook street lamp (generic): a tall post whose top curls over and hangs an acorn lantern
export function lamp(c, x, base) {
  const N = '#2B3060';
  contact(c, x + 20, base + 4, 60, 9, .25);
  c.fillStyle = N;
  rr(c, x - 22, base - 70, 44, 70, 6); c.fill();
  rr(c, x - 12, base - 620, 24, 560, 10); c.fill();
  rr(c, x - 16, base - 330, 32, 16, 6); c.fill();
  c.fillStyle = rgba('#FFFFFF', .12); c.fillRect(x - 8, base - 610, 6, 540);
  c.strokeStyle = N; c.lineWidth = 16; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x, base - 612); c.bezierCurveTo(x, base - 700, x + 110, base - 720, x + 112, base - 640); c.stroke();
  c.lineWidth = 7; c.beginPath(); c.moveTo(x + 112, base - 640); c.bezierCurveTo(x + 112, base - 600, x + 70, base - 600, x + 60, base - 630); c.stroke();   // the curl
  // lantern hanging from the crook
  c.fillStyle = N; rr(c, x + 100, base - 648, 24, 14, 4); c.fill();
  c.fillStyle = '#FFF2C9'; c.beginPath(); c.moveTo(x + 86, base - 636); c.quadraticCurveTo(x + 86, base - 570, x + 112, base - 560); c.quadraticCurveTo(x + 138, base - 570, x + 138, base - 636); c.closePath(); c.fill();
  c.fillStyle = N; rr(c, x + 82, base - 640, 60, 8, 3); c.fill(); ell(c, x + 112, base - 556, 6, 6); c.fill();
}

// ---------------- caches ----------------
function bake(x0, y0, x1, y1, res, draw, haze = 0) {
  const cv = document.createElement('canvas'); cv.width = Math.ceil((x1 - x0) * res); cv.height = Math.ceil((y1 - y0) * res);
  const c = cv.getContext('2d', CPU); c.setTransform(res, 0, 0, res, -x0 * res, -y0 * res); draw(c);
  if (haze > 0) { c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-atop'; c.fillStyle = rgba(HAZE, haze); c.fillRect(0, 0, cv.width, cv.height); c.globalCompositeOperation = 'source-over'; }
  return { cv, x0, y0, x1, y1, res };
}
function blit(c, B) { c.drawImage(B.cv, 0, 0, B.cv.width, B.cv.height, B.x0, B.y0, B.x1 - B.x0, B.y1 - B.y0); }
let K = null;
const nearAll = l => {
  pavement(l);
  for (const x of [-2050, -760, 520]) { l.save(); l.translate(x, 800); l.scale(.62, .62); l.translate(-x, -1075); lamp(l, x, 1075); l.restore(); }
  // street furniture, spread along the walk so that a shot never holds more than 2–3 props (the characters stay the focus):
  // the newspaper box and the hot-dog cart far left (the opening), a hydrant mid-way, the subway sign before the school, the hydrant by the stoop
  newsBox(l, -2300, 812); hotdogCart(l, -1500, 812); hydrant(l, -700, 812); subwaySign(l, 150, 812); hydrant(l, 1085, 812);
  school(l); neighbour(l); planter(l, 1372, 812); planter(l, 1700, 812);
};
export function bakeWorld() {
  if (K) return K;
  K = {
    far: bake(-760, 60, 2760, 668, 1.25, far, 0),
    mid: bake(-2900, 380, 3050, 790, 1.4, mid, .24),
    nearL: bake(-3400, 60, 900, 1300, 1.3, nearAll),
    nearR: bake(900, 60, 2600, 1300, 2.0, nearAll),
    taxi: bake(-200, -200, 200, 30, 2, l => taxi(l, 0, 0, 1), .24),
  };
  return K;
}
function soft(c, cam, p, blur, fn) {
  if (!(blur > 1.3)) { c.save(); layerT(c, cam, p); fn(c); c.restore(); c.setTransform(1, 0, 0, 1, 0, 0); return; }
  const s = blur < 2.6 ? .5 : Math.max(.14, 1.5 / blur), w = Math.ceil(SW * s), h = Math.ceil(SH * s);
  const A = layer(4, w, h), a = A.getContext('2d');
  a.setTransform(1, 0, 0, 1, 0, 0); a.globalCompositeOperation = 'source-over'; a.globalAlpha = 1; a.filter = 'none'; a.clearRect(0, 0, w + 2, h + 2);
  layerT(a, cam, p, s); fn(a); a.setTransform(1, 0, 0, 1, 0, 0);
  let src = A;
  if (blur >= 2.6) {
    const B = layer(5, w, h), b = B.getContext('2d'); b.setTransform(1, 0, 0, 1, 0, 0); b.globalCompositeOperation = 'source-over'; b.clearRect(0, 0, w + 2, h + 2);
    b.filter = `blur(${(blur * s * .55).toFixed(2)}px)`; b.drawImage(A, 0, 0, w, h, 0, 0, w, h); b.filter = 'none'; src = B;
  }
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.imageSmoothingQuality = 'low'; c.drawImage(src, 0, 0, w, h, 0, 0, SW, SH); c.restore();
}
// o: { door (0..1), taxiX (mid-layer x), dof, nearDof, tod (0..1), night (0..1), clock (hours) }
export function drawWorld(c, cam, t, o = {}) {
  const k = bakeWorld(), dof = o.dof || 0, night = o.night || 0;
  sky(c, cam, t, o.tod || 0, night);
  soft(c, cam, .12, dof * .9, l => blit(l, k.far));
  soft(c, cam, .45, dof * .8, l => { blit(l, k.mid); if (o.taxiX != null) l.drawImage(k.taxi.cv, o.taxiX - 200, 774 - 200, 400, 230); });
  soft(c, cam, 1, o.nearDof ?? dof * .6, l => { blit(l, k.nearL); blit(l, k.nearR); doorLive(l, o.door || 0); clockHands(l, o.clock ?? 8.9); });
  c.setTransform(1, 0, 0, 1, 0, 0);
  if (night > 0) nightPass(c, cam, night);
}
// night: a cool multiply over the whole set, lit windows (screen), the lamp's pool of light and the taxi's headlight
function nightPass(c, cam, n) {
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalCompositeOperation = 'multiply'; c.fillStyle = `rgba(70,80,150,${.62 * n})`; c.fillRect(0, 0, SW, SH);
  c.globalCompositeOperation = 'screen';
  c.globalAlpha = .9 * n;
  layerT(c, cam, 1);
  for (const cx of [1218, 1374, 1686, 1842]) { c.fillStyle = 'rgba(255,214,140,.55)'; c.fillRect(cx - 46, 340, 92, 150); }
  for (const cx of [1262, 1798]) { c.fillStyle = 'rgba(255,214,140,.55)'; c.fillRect(cx - 52, 606, 104, 118); }
  c.fillStyle = 'rgba(255,214,140,.6)'; c.fillRect(DOOR.x - 58, 599, 116, 196);
  layerT(c, cam, .45);
  for (let x = -2780; x < 2900; x += 171) for (let f = 0; f < 3; f++) if (hash(x * .37 + f) > .45) { c.fillStyle = 'rgba(255,208,130,.5)'; c.fillRect(x + 24 + (hash(x) > .5 ? 58 : 0), 480 + f * 68 - 40, 34, 52); }
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.restore();
}
export function drawForeground(c, cam, t, o = {}) {
  c.save(); layerT(c, cam, 1.3); for (const x of (o.lamps || [200])) lamp(c, x, 1075); c.restore(); c.setTransform(1, 0, 0, 1, 0, 0);
  if (o.night > 0) {   // the foreground lamp's pool of light over everything
    const [lx, ly] = toScreen(cam, 1.3, (o.lamps || [200])[0] + 112, 1075 - 600);
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'screen';
    const g = c.createRadialGradient(lx, ly, 0, lx, ly, 520 * (1 + (cam.z - 1) * 1.3)); g.addColorStop(0, `rgba(255,220,150,${.55 * o.night})`); g.addColorStop(1, 'rgba(255,220,150,0)');
    c.fillStyle = g; c.fillRect(0, 0, SW, SH); c.restore();
  }
}

// ======================================================================================================================
// Episode 2 interiors. Both are flat sets (parallax 1, baked once); the camera zooms and pans them like the street.
// Youssef's bedroom: lilac wall, window on the left (the light comes from there), bed, bedside table with the alarm
// clock, the red suitcase in the corner, a door on the right. Characters' feet: the mattress top (BED.sit) or the floor (GROUND).
export const BED = { x0: 540, x1: 1080, top: 700, sit: 712 };
export const BEDCLOCK = { x: 1190, y: 648, r: 50 };
function bedroomStatic(c) {
  const WALL = mix('#A795D6', P.cream, .64), WOOD = '#D7A676';
  c.fillStyle = WALL; c.fillRect(-300, -300, 2600, 1100);
  const g = c.createRadialGradient(350, 200, 0, 350, 200, 1600); g.addColorStop(0, rgba('#FFF6E8', .4)); g.addColorStop(1, rgba('#FFF6E8', 0)); c.fillStyle = g; c.fillRect(-300, -300, 2600, 1100);
  // picture rail + skirting + floor
  c.fillStyle = rgba('#FFFFFF', .35); c.fillRect(-300, 60, 2600, 8);
  c.fillStyle = light(WALL, .45); c.fillRect(-300, 784, 2600, 16);
  const fg = c.createLinearGradient(0, 800, 0, 1200); fg.addColorStop(0, WOOD); fg.addColorStop(1, dark(WOOD, .18)); c.fillStyle = fg; c.fillRect(-300, 800, 2600, 500);
  c.strokeStyle = rgba('#7A4A2E', .16); c.lineWidth = 2;
  for (const y of [836, 884, 946, 1030]) { c.beginPath(); c.moveTo(-300, y); c.lineTo(2300, y); c.stroke(); }
  for (let x = -300; x < 2300; x += 170) { c.beginPath(); c.moveTo(x, 800); c.lineTo(x + (x - 960) * .45, 1200); c.stroke(); }
  c.fillStyle = rgba('#3B2F6B', .1); c.fillRect(-300, 800, 2600, 6);
  // rug
  ell(c, 980, 950, 560, 105); c.fillStyle = mix(P.teal, P.cream, .58); c.fill();
  ell(c, 980, 950, 500, 82); c.strokeStyle = mix(P.teal, P.cream, .3); c.lineWidth = 9; c.stroke();
  // window (left wall): sky, a slice of the city skyline, mullions, curtains, rod
  const wx = 170, wy = 120, ww = 420, wh = 400;
  c.fillStyle = rgba('#3B2F6B', .12); rr(c, wx - 6, wy - 2, ww + 24, wh + 24, 10); c.fill();
  c.fillStyle = '#FFFBF4'; rr(c, wx - 16, wy - 16, ww + 32, wh + 32, 10); c.fill();
  const sg = c.createLinearGradient(0, wy, 0, wy + wh); sg.addColorStop(0, '#7CC3E6'); sg.addColorStop(.7, '#C9E6F0'); sg.addColorStop(1, '#F6E8D4'); c.fillStyle = sg; c.fillRect(wx, wy, ww, wh);
  const sun = c.createRadialGradient(wx + 70, wy + 60, 0, wx + 70, wy + 60, 260); sun.addColorStop(0, 'rgba(255,245,210,.95)'); sun.addColorStop(.3, 'rgba(255,240,200,.45)'); sun.addColorStop(1, 'rgba(255,240,200,0)'); c.fillStyle = sun; c.fillRect(wx, wy, ww, wh);
  const F = mix(mix(P.sky, '#7C78B4', .45), '#DCEAF2', .35); c.fillStyle = F;
  for (const [bx, bw, bh] of [[0, 60, 70], [60, 40, 110], [100, 70, 60], [170, 30, 150], [200, 80, 90], [280, 50, 120], [330, 90, 70]]) c.fillRect(wx + bx, wy + wh - bh, bw, bh);
  c.beginPath(); c.arc(wx + 250, wy + wh - 70, 60, Math.PI, 2 * Math.PI); c.strokeStyle = F; c.lineWidth = 5; c.stroke();
  c.fillStyle = rgba('#FFFFFF', .22); poly(c, [[wx + 40, wy + wh], [wx + 200, wy], [wx + 260, wy], [wx + 100, wy + wh]]); c.fill();
  c.fillStyle = '#FFFBF4'; c.fillRect(wx + ww / 2 - 6, wy, 12, wh); c.fillRect(wx, wy + wh * .38 - 5, ww, 10);
  c.fillStyle = rgba('#3B2F6B', .18); c.fillRect(wx, wy, ww, 10); c.fillRect(wx + ww - 8, wy, 8, wh);
  const CUR = mix(P.mustard, P.cream, .4);
  for (const [cx0, cw] of [[wx - 76, 78], [wx + ww - 2, 78]]) { c.fillStyle = CUR; rr(c, cx0, wy - 30, cw, wh + 90, 12); c.fill(); c.fillStyle = dark(CUR, .12); for (let i = 1; i < 4; i++) c.fillRect(cx0 + i * cw / 4 - 3, wy - 30, 6, wh + 90); }
  c.fillStyle = P.navy; rr(c, wx - 100, wy - 44, ww + 200, 12, 6); c.fill(); for (const s of [wx - 104, wx + ww + 92]) { ell(c, s, wy - 38, 12, 12); c.fill(); }
  // the light shaft from the window on to the bed and the floor
  c.fillStyle = rgba('#FFF6E0', .16); poly(c, [[wx + 20, wy + 60], [wx + ww, wy + 30], [1500, 1060], [700, 1120]]); c.fill();
  // framed picture above the bed (generic skyline)
  c.fillStyle = rgba('#3B2F6B', .12); rr(c, 735, 302, 190, 140, 8); c.fill();
  c.fillStyle = P.navy; rr(c, 728, 290, 190, 140, 8); c.fill(); c.fillStyle = '#F6EAD6'; c.fillRect(742, 304, 162, 112);
  c.fillStyle = mix(P.sky, P.cream, .4); c.fillRect(742, 304, 162, 80); c.fillStyle = F; for (const [bx, bw, bh] of [[0, 30, 40], [30, 20, 70], [50, 40, 30], [90, 14, 90], [104, 40, 50], [144, 18, 36]]) c.fillRect(742 + bx, 384 - bh, bw, bh);
  ell(c, 800, 352, 18, 18); c.strokeStyle = F; c.lineWidth = 3; c.stroke();
  // bed: headboard, mattress, frame, pillow
  contact(c, 820, 806, 330, 16, .25);
  c.fillStyle = dark(P.navy, .1); rr(c, 500, 470, 64, 320, 22); c.fill();
  c.fillStyle = P.navy; rr(c, 508, 478, 48, 300, 18); c.fill();
  c.fillStyle = light(P.navy, .25); rr(c, 516, 486, 14, 260, 7); c.fill();
  c.fillStyle = '#5B4A6B'; rr(c, 530, 760, 570, 34, 8); c.fill();
  c.fillStyle = dark('#5B4A6B', .3); for (const lx of [548, 1068]) rr(c, lx, 790, 22, 12, 4), c.fill();
  c.fillStyle = '#FFFBF4'; rr(c, BED.x0, BED.top, BED.x1 - BED.x0, 66, 16); c.fill();
  c.fillStyle = rgba('#3B2F6B', .12); rr(c, BED.x0, BED.top + 48, BED.x1 - BED.x0, 18, { bl: 14, br: 14 }); c.fill();
  c.fillStyle = mix(P.sky, P.cream, .7); c.fillRect(BED.x0 + 10, BED.top + 30, BED.x1 - BED.x0 - 20, 6);
  ell(c, 640, 684, 96, 40, -.08); c.fillStyle = rgba('#3B2F6B', .12); c.fill();
  ell(c, 634, 676, 96, 40, -.08); c.fillStyle = '#FFFBF4'; c.fill();
  ell(c, 612, 666, 50, 18, -.1); c.fillStyle = rgba('#FFFFFF', .7); c.fill();
  // bedside table with a book
  contact(c, 1200, 806, 90, 12, .25);
  c.fillStyle = '#A9683F'; rr(c, 1130, 716, 120, 84, 6); c.fill();
  c.fillStyle = dark('#A9683F', .25); rr(c, 1142, 730, 96, 30, 5); c.fill(); c.fillStyle = P.mustard; ell(c, 1190, 745, 5, 5); c.fill();
  c.fillStyle = '#C98B5E'; rr(c, 1118, 700, 144, 18, 6); c.fill(); c.fillStyle = rgba('#FFFFFF', .25); c.fillRect(1124, 702, 132, 5);
  c.fillStyle = P.red; rr(c, 1226, 686, 34, 14, 3); c.fill(); c.fillStyle = '#FFFBF4'; c.fillRect(1230, 689, 26, 3); c.fillRect(1230, 694, 26, 3);
  // suitcase in the corner, a door on the right
  drawSuitcase(c, 1660, 876, 1, 300, { handle: .25, tilt: .02 });
  c.fillStyle = '#FFFBF4'; rr(c, 1792, 262, 226, 540, 10); c.fill();
  c.fillStyle = P.teal; rr(c, 1806, 276, 198, 526, 6); c.fill();
  c.fillStyle = dark(P.teal, .18); for (const [py, ph] of [[300, 190], [520, 220]]) { rr(c, 1832, py, 146, ph, 8); c.fill(); }
  c.fillStyle = P.mustard; ell(c, 1830, 560, 9, 9); c.fill();
  c.fillStyle = rgba('#3B2F6B', .14); c.fillRect(1792, 262, 10, 540);
}
// the blanket over his legs: a = 0 tucked over the bed; a → 1 thrown back, half on the floor (the leap)
export function blanket(c, a = 0, t = 0, part = 'both') {
  const BL = mix(P.mustard, P.cream, .42), TOP = '#FFFBF4';
  c.save();
  if (a < 1 && part !== 'thrown') {
    c.globalAlpha = 1 - a;
    const y0 = 604 + 40 * a, x0 = 690, x1 = BED.x1 + 8;
    c.beginPath(); c.moveTo(x0 - 20, y0 + 30);
    for (let x = x0; x <= x1; x += 48) c.quadraticCurveTo(x + 12, y0 - 14 + 6 * Math.sin(x * .3 + t * .5), x + 48, y0 + 2 + 5 * Math.cos(x * .4));
    c.lineTo(x1, 766); c.quadraticCurveTo(x1 + 10, 775, x1 - 10, 776); c.lineTo(x0 - 20, 776); c.closePath();
    c.fillStyle = BL; c.fill();
    c.fillStyle = TOP; rr(c, x0 - 14, y0 + 20, x1 - x0 + 10, 38, 10); c.fill();
    c.fillStyle = rgba('#3B2F6B', .1); rr(c, x0 - 14, y0 + 50, x1 - x0 + 10, 10, 5); c.fill();
    c.strokeStyle = rgba('#B8862A', .25); c.lineWidth = 3; for (const yy of [690, 730]) { c.beginPath(); c.moveTo(x0 + 20, yy); c.lineTo(x1 - 20, yy + 8); c.stroke(); }
  }
  if (a > 0 && part !== 'tucked') {
    c.globalAlpha = a;
    // thrown: a crumpled pile kicked to the foot of the bed
    c.beginPath(); c.moveTo(860, 760);
    c.quadraticCurveTo(880, 690, 940, 700); c.quadraticCurveTo(960, 640, 1010, 666); c.quadraticCurveTo(1060, 630, 1090, 690);
    c.quadraticCurveTo(1130, 700, 1100, 760); c.closePath(); c.fillStyle = BL; c.fill();
    c.fillStyle = TOP; c.beginPath(); c.moveTo(930, 705); c.quadraticCurveTo(980, 672, 1040, 690); c.quadraticCurveTo(1010, 722, 950, 728); c.closePath(); c.fill();
    c.fillStyle = rgba('#3B2F6B', .12); c.beginPath(); c.moveTo(1040, 700); c.quadraticCurveTo(1100, 712, 1100, 760); c.lineTo(1030, 760); c.closePath(); c.fill();
  }
  c.restore();
}

// ---------------- the school hallway ----------------
// cream wall over a navy-pastel wainscot, a plank floor, a window on the left (the light), a notice board between the two
// marks, a wall clock on the right, teal doors at both ends. GROUND = 880 as in the street, so the beans keep their scale.
export const HALLCLOCK = { x: 1440, y: 400, r: 62 };
function hallStatic(c) {
  const WALL = '#F6EBD8', WAIN = mix(P.navy, P.cream, .76), WOOD = '#DDAB7A';
  c.fillStyle = WALL; c.fillRect(-300, -300, 2800, 1100);
  const g = c.createRadialGradient(500, 300, 0, 500, 300, 1900); g.addColorStop(0, rgba('#FFF6E8', .5)); g.addColorStop(1, rgba('#D8CFE0', .25)); c.fillStyle = g; c.fillRect(-300, -300, 2800, 1100);
  c.fillStyle = WAIN; c.fillRect(-300, 654, 2800, 134);
  c.fillStyle = dark(WAIN, .12); for (let x = -300; x < 2500; x += 90) c.fillRect(x, 668, 4, 112);
  c.fillStyle = '#FFFBF4'; rr(c, -300, 642, 2800, 14, 4); c.fill(); c.fillStyle = rgba('#3B2F6B', .12); c.fillRect(-300, 656, 2800, 5);
  c.fillStyle = light(WAIN, .5); c.fillRect(-300, 786, 2800, 14); c.fillStyle = rgba('#3B2F6B', .14); c.fillRect(-300, 798, 2800, 5);
  const fg = c.createLinearGradient(0, 800, 0, 1200); fg.addColorStop(0, WOOD); fg.addColorStop(1, dark(WOOD, .2)); c.fillStyle = fg; c.fillRect(-300, 800, 2800, 500);
  c.strokeStyle = rgba('#7A4A2E', .15); c.lineWidth = 2;
  for (const y of [832, 872, 926, 1000, 1110]) { c.beginPath(); c.moveTo(-300, y); c.lineTo(2500, y); c.stroke(); }
  for (let x = -300; x < 2500; x += 180) { c.beginPath(); c.moveTo(x, 800); c.lineTo(x + (x - 1300) * .5, 1200); c.stroke(); }
  // light from the window across the floor
  c.fillStyle = rgba('#FFF2D0', .18); poly(c, [[380, 640], [760, 640], [1500, 1100], [500, 1100]]); c.fill();
  // doors (left end + right end): cream frames, teal leaves with two panels, mustard knobs
  const door = (x, w) => {
    c.fillStyle = rgba('#3B2F6B', .1); rr(c, x + 8, 300, w + 10, 496, 8); c.fill();
    c.fillStyle = '#FFFBF4'; rr(c, x - 14, 286, w + 28, 516, 10); c.fill();
    c.fillStyle = P.teal; rr(c, x, 300, w, 498, 6); c.fill();
    c.fillStyle = dark(P.teal, .18); for (const [py, ph] of [[324, 170], [530, 230]]) { rr(c, x + 28, py, w - 56, ph, 8); c.fill(); }
    c.fillStyle = P.mustard; ell(c, x + w - 30, 560, 9, 9); c.fill();
    c.fillStyle = rgba('#3B2F6B', .14); c.fillRect(x, 300, 8, 498);
    c.fillStyle = light(P.teal, .2); c.fillRect(x, 300, w, 10);
  };
  door(50, 230); door(1930, 230);
  // window (left) with a bench under it
  const wx = 400, wy = 220, ww = 330, wh = 380;
  c.fillStyle = rgba('#3B2F6B', .12); rr(c, wx - 4, wy - 2, ww + 22, wh + 22, 8); c.fill();
  c.fillStyle = '#FFFBF4'; rr(c, wx - 14, wy - 14, ww + 28, wh + 28, 8); c.fill();
  const sg = c.createLinearGradient(0, wy, 0, wy + wh); sg.addColorStop(0, '#86C8E8'); sg.addColorStop(1, '#DCEDF2'); c.fillStyle = sg; c.fillRect(wx, wy, ww, wh);
  c.fillStyle = mix(P.leaf, P.cream, .25); for (const [bx, by, r] of [[60, 300, 70], [150, 330, 60], [250, 290, 75]]) { ell(c, wx + bx, wy + by, r, r * .8); c.fill(); }
  c.fillStyle = rgba('#FFFFFF', .25); poly(c, [[wx + 30, wy + wh], [wx + 170, wy], [wx + 230, wy], [wx + 90, wy + wh]]); c.fill();
  c.fillStyle = '#FFFBF4'; c.fillRect(wx + ww / 2 - 6, wy, 12, wh); c.fillRect(wx, wy + wh * .45 - 5, ww, 10);
  c.fillStyle = rgba('#3B2F6B', .18); c.fillRect(wx, wy, ww, 9); c.fillRect(wx + ww - 8, wy, 8, wh);
  c.fillStyle = '#FFFBF4'; rr(c, wx - 30, wy + wh + 14, ww + 60, 16, 4); c.fill();
  // notice board: navy frame, cork, pinned papers
  const nx = 1000, ny = 380, nw = 300, nh = 215;
  c.fillStyle = rgba('#3B2F6B', .12); rr(c, nx + 6, ny + 8, nw, nh, 8); c.fill();
  c.fillStyle = P.navy; rr(c, nx - 10, ny - 10, nw + 20, nh + 20, 10); c.fill();
  c.fillStyle = '#D9B384'; c.fillRect(nx, ny, nw, nh);
  c.fillStyle = rgba('#8B5A2B', .18); for (let i = 0; i < 70; i++) { const px = nx + ((i * 73) % nw), py = ny + ((i * 41) % nh); c.fillRect(px, py, 3, 2); }
  const papers = [[nx + 18, ny + 18, 92, 70, mix(P.red, P.cream, .55), -.05], [nx + 128, ny + 14, 72, 90, mix(P.teal, P.cream, .55), .04], [nx + 216, ny + 24, 68, 62, mix(P.mustard, P.cream, .45), -.03],
    [nx + 26, ny + 108, 80, 86, mix(P.leaf, P.cream, .55), .06], [nx + 122, ny + 118, 100, 72, '#FFFBF4', -.04], [nx + 232, ny + 104, 56, 84, mix(P.sky, P.cream, .35), .05]];
  for (const [px, py, pw, ph, col, rot] of papers) {
    c.save(); c.translate(px + pw / 2, py + ph / 2); c.rotate(rot);
    c.fillStyle = rgba('#3B2F6B', .18); c.fillRect(-pw / 2 + 3, -ph / 2 + 4, pw, ph); c.fillStyle = col; c.fillRect(-pw / 2, -ph / 2, pw, ph);
    c.fillStyle = rgba('#2A2742', .3); for (let i = 0; i < Math.floor(ph / 16) - 1; i++) c.fillRect(-pw / 2 + 10, -ph / 2 + 14 + i * 16, pw - 20 - (i % 3) * 12, 4);
    ell(c, 0, -ph / 2 + 2, 6, 6); c.fillStyle = [P.red, P.navy, P.teal][Math.round(Math.abs(rot) * 100) % 3]; c.fill();
    c.restore();
  }
  // wall clock (face; the hands are live)
  const { x: cx, y: cy, r } = HALLCLOCK;
  c.fillStyle = rgba('#3B2F6B', .12); ell(c, cx + 6, cy + 8, r + 8, r + 8); c.fill();
  c.fillStyle = P.navy; ell(c, cx, cy, r + 8, r + 8); c.fill(); c.fillStyle = P.mustard; ell(c, cx, cy, r + 1, r + 1); c.fill(); c.fillStyle = '#FFFBF4'; ell(c, cx, cy, r - 6, r - 6); c.fill();
  c.fillStyle = P.ink; for (let i = 0; i < 12; i++) { const a = i / 12 * 2 * PI; c.save(); c.translate(cx + Math.sin(a) * (r - 16), cy - Math.cos(a) * (r - 16)); c.rotate(a); rr(c, -2.5, -(i % 3 ? 4 : 7), 5, i % 3 ? 8 : 14, 2.5); c.fill(); c.restore(); }
  // a framed poster right of the marks (generic skyline), a plant by the right door, a small plaque by the left door (no text)
  c.fillStyle = rgba('#3B2F6B', .12); rr(c, 1676, 402, 200, 150, 8); c.fill();
  c.fillStyle = P.navy; rr(c, 1668, 392, 200, 150, 8); c.fill(); c.fillStyle = '#FBF1E1'; c.fillRect(1682, 406, 172, 122);
  c.fillStyle = mix(P.sky, P.cream, .3); c.fillRect(1682, 406, 172, 86); c.fillStyle = mix(P.red, P.cream, .4); ell(c, 1720, 440, 22, 22); c.fill();
  const FP = mix(mix(P.sky, '#7C78B4', .45), '#DCEAF2', .35); c.fillStyle = FP;
  for (const [bx, bw, bh] of [[0, 30, 44], [30, 22, 76], [52, 44, 34], [96, 14, 96], [110, 42, 54], [152, 20, 40]]) c.fillRect(1682 + bx, 492 - bh, bw, bh);
  c.beginPath(); c.arc(1800, 490, 20, Math.PI, 2 * Math.PI); c.strokeStyle = FP; c.lineWidth = 3; c.stroke();
  c.fillStyle = P.mustard; c.fillRect(1700, 506, 60, 6); c.fillStyle = rgba(P.ink, .4); c.fillRect(1700, 516, 100, 4);
  planter(c, 1880, 884);
  c.fillStyle = P.navy; rr(c, 330, 380, 40, 120, 6); c.fill(); c.fillStyle = P.mustard; c.fillRect(338, 392, 24, 4); c.fillRect(338, 404, 24, 4); c.fillRect(338, 416, 16, 4);
}
export function hallClockHands(c, hours) {
  const { x: CX, y: CY, r } = HALLCLOCK, ha = (hours % 12) / 12 * 2 * PI, ma = (hours % 1) * 2 * PI;
  c.lineCap = 'round'; c.strokeStyle = P.ink;
  c.lineWidth = 7; c.beginPath(); c.moveTo(CX, CY); c.lineTo(CX + Math.sin(ha) * r * .42, CY - Math.cos(ha) * r * .42); c.stroke();
  c.lineWidth = 5; c.beginPath(); c.moveTo(CX, CY); c.lineTo(CX + Math.sin(ma) * r * .64, CY - Math.cos(ma) * r * .64); c.stroke();
  c.fillStyle = P.red; ell(c, CX, CY, 6, 6); c.fill();
}
let SETS = null;
export function bakeSets() {
  if (SETS) return SETS;
  SETS = { bed: bake(-20, -20, 2000, 1100, 1.25, bedroomStatic), hall: bake(-150, -100, 2350, 1100, 1.7, hallStatic) };
  return SETS;
}
// draw a flat set with the camera; dof blurs the whole set (close-ups); live(l) draws moving parts in world space
export function drawBedroom(c, cam, t, o = {}) {
  const k = bakeSets();
  soft(c, cam, 1, o.dof || 0, l => { blit(l, k.bed); blanket(l, o.blanket || 0, t, 'thrown'); if (o.live) o.live(l); });
  c.setTransform(1, 0, 0, 1, 0, 0);
}
export function drawHall(c, cam, t, o = {}) {
  const k = bakeSets();
  soft(c, cam, 1, o.dof || 0, l => { blit(l, k.hall); hallClockHands(l, o.clock ?? 8.2); if (o.live) o.live(l); });
  c.setTransform(1, 0, 0, 1, 0, 0);
}

// ======================================================================================================================
// Episode 4: the classroom (a flat set like the hallway: parallax 1, baked once; GROUND = 880 so the beans keep their scale).
// A pale sky wall over a mustard-cream wainscot and the plank floor; left to right: the window onto the New York street,
// the whiteboard ("Where are you from?" is written live), the world map with live pins, the teal door at the right edge.
// Desks are drawn separately (deskFront) in front of the seated students; one empty desk sits in the set itself.
export const CLASS = { win: { x: 40, y: 210, w: 330, h: 380 }, board: { x: 560, y: 186, w: 610, h: 380 }, map: { x: 1206, y: 206, w: 470, h: 262 },
  door: { x: 1752, w: 200 }, deskTop: 798, desks: { empty: 770, ana: 1080, youssef: 1440 } };
// the map: equirectangular, lon -170..180, lat 80..-58, inside the frame's inner area
const MAPA = { lon0: -170, lon1: 180, lat0: 80, lat1: -58 };
export function mapXY(lon, lat) {
  const M = CLASS.map, ix = M.x + 16, iy = M.y + 16, iw = M.w - 32, ih = M.h - 32;
  return [ix + (lon - MAPA.lon0) / (MAPA.lon1 - MAPA.lon0) * iw, iy + (lat - MAPA.lat0) / (MAPA.lat1 - MAPA.lat0) * ih];
}
export const PINS = { usa: [-74, 40.7], spain: [-3.7, 40.4], egypt: [31.2, 30.0] };
const LAND = [
  [[-160, 68], [-130, 70], [-100, 72], [-80, 66], [-62, 52], [-68, 44], [-76, 36], [-81, 27], [-90, 29], [-97, 24], [-90, 16], [-80, 9], [-92, 15], [-105, 21], [-115, 30], [-124, 40], [-126, 50], [-140, 59], [-158, 58]],
  [[-55, 80], [-25, 79], [-20, 72], [-42, 60], [-52, 66], [-60, 76]],
  [[-80, 10], [-62, 10], [-50, 0], [-35, -6], [-40, -22], [-52, -34], [-65, -54], [-72, -48], [-72, -30], [-80, -5]],
  [[-10, 36], [-9, 43], [-2, 48], [-5, 54], [5, 58], [10, 63], [20, 70], [30, 70], [40, 66], [40, 46], [28, 41], [20, 40], [12, 44], [8, 44], [3, 42], [-5, 36]],
  [[-6, 50], [2, 51], [-2, 58], [-6, 57]],
  [[-17, 21], [-12, 30], [-5, 36], [10, 37], [20, 32], [32, 31], [35, 28], [43, 12], [51, 12], [40, -5], [40, -15], [33, -25], [20, -35], [15, -28], [12, -15], [9, -2], [5, 5], [-8, 5], [-17, 14]],
  [[40, 66], [60, 70], [80, 74], [110, 77], [140, 72], [170, 68], [178, 64], [160, 58], [140, 50], [130, 40], [122, 30], [110, 20], [108, 10], [100, 5], [98, 15], [92, 22], [80, 8], [76, 20], [66, 25], [58, 25], [52, 28], [48, 30], [36, 35], [28, 41], [40, 46]],
  [[35, 30], [48, 30], [56, 24], [59, 22], [52, 15], [44, 12], [38, 20]],
  [[113, -22], [122, -17], [131, -12], [142, -11], [146, -19], [153, -28], [147, -38], [138, -35], [130, -32], [115, -34]],
];
function classStatic(c) {
  const WALL = mix(P.sky, P.cream, .72), WAIN = mix(P.mustard, P.cream, .66), WOOD = '#D9A877';
  c.fillStyle = WALL; c.fillRect(-300, -300, 2800, 1100);
  const g = c.createRadialGradient(250, 300, 0, 250, 300, 1900); g.addColorStop(0, rgba('#FFF6E8', .55)); g.addColorStop(1, rgba('#C9D6EA', .2)); c.fillStyle = g; c.fillRect(-300, -300, 2800, 1100);
  // a row of plain paper bunting (no national flags) along the top
  for (let i = 0; i < 26; i++) {
    const x = -120 + i * 86, y = 96 + 16 * Math.sin(i * .9) * 0 + 10 * Math.sin((i % 13) / 12 * PI);
    c.fillStyle = [P.red, P.mustard, P.teal, P.leaf, P.navy][i % 5]; poly(c, [[x, y], [x + 64, y + 4], [x + 30, y + 58]]); c.fill();
  }
  c.strokeStyle = rgba(P.ink, .35); c.lineWidth = 3; c.beginPath(); for (let i = 0; i <= 26; i++) { const x = -120 + i * 86, y = 96 + 10 * Math.sin((i % 13) / 12 * PI); i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
  // wainscot + rails + floor
  c.fillStyle = WAIN; c.fillRect(-300, 640, 2800, 150);
  c.fillStyle = dark(WAIN, .1); for (let x = -300; x < 2500; x += 96) c.fillRect(x, 656, 4, 128);
  c.fillStyle = '#FFFBF4'; rr(c, -300, 628, 2800, 14, 4); c.fill(); c.fillStyle = rgba('#3B2F6B', .12); c.fillRect(-300, 642, 2800, 5);
  c.fillStyle = light(WAIN, .45); c.fillRect(-300, 786, 2800, 14); c.fillStyle = rgba('#3B2F6B', .14); c.fillRect(-300, 798, 2800, 5);
  const fg = c.createLinearGradient(0, 800, 0, 1200); fg.addColorStop(0, WOOD); fg.addColorStop(1, dark(WOOD, .2)); c.fillStyle = fg; c.fillRect(-300, 800, 2800, 500);
  c.strokeStyle = rgba('#7A4A2E', .15); c.lineWidth = 2;
  for (const y of [832, 872, 926, 1000, 1110]) { c.beginPath(); c.moveTo(-300, y); c.lineTo(2500, y); c.stroke(); }
  for (let x = -300; x < 2500; x += 180) { c.beginPath(); c.moveTo(x, 800); c.lineTo(x + (x - 1000) * .5, 1200); c.stroke(); }
  c.fillStyle = rgba('#FFF2D0', .2); poly(c, [[60, 800], [380, 800], [1100, 1100], [140, 1100]]); c.fill();   // window light on the floor
  // ---- the window onto the street ----
  const W = CLASS.win;
  c.fillStyle = rgba('#3B2F6B', .12); rr(c, W.x - 4, W.y - 2, W.w + 22, W.h + 22, 8); c.fill();
  c.fillStyle = '#FFFBF4'; rr(c, W.x - 14, W.y - 14, W.w + 28, W.h + 28, 8); c.fill();
  c.save(); c.beginPath(); c.rect(W.x, W.y, W.w, W.h); c.clip();
  const sg = c.createLinearGradient(0, W.y, 0, W.y + W.h); sg.addColorStop(0, '#79C1E6'); sg.addColorStop(1, '#D8ECF2'); c.fillStyle = sg; c.fillRect(W.x, W.y, W.w, W.h);
  const FP = mix(mix(P.sky, '#7C78B4', .45), '#DCEAF2', .3);   // far towers + a water tower
  c.fillStyle = FP; for (const [bx, bw, bh] of [[0, 50, 150], [46, 36, 210], [80, 60, 120], [150, 30, 250], [176, 54, 170], [236, 40, 140], [270, 70, 190]]) c.fillRect(W.x + bx, W.y + 300 - bh, bw, bh + 100);
  waterTower(c, W.x + 105, W.y + 182, .9);
  // the brownstone across the street (terracotta, cream window trims)
  c.fillStyle = BROWN; c.fillRect(W.x - 10, W.y + 190, W.w + 20, 260);
  c.fillStyle = light(BROWN, .25); c.fillRect(W.x - 10, W.y + 182, W.w + 20, 14);
  for (const wx of [30, 140, 250]) for (const wy of [222, 318]) { c.fillStyle = mix(BROWN, P.cream, .6); c.fillRect(W.x + wx - 6, W.y + wy - 6, 60, 82); c.fillStyle = '#5E6C9E'; c.fillRect(W.x + wx, W.y + wy, 48, 70); c.fillStyle = rgba('#FFFFFF', .2); c.fillRect(W.x + wx, W.y + wy, 48, 18); }
  c.fillStyle = IRON; for (let i = 0; i < 3; i++) { c.fillRect(W.x + 120, W.y + 300 + i * 5, 110, 3); }
  c.fillStyle = P.leaf; for (const [tx, ty, r] of [[40, 360, 60], [120, 380, 54], [300, 352, 66]]) { ell(c, W.x + tx, W.y + ty, r, r * .78); c.fill(); }
  c.fillStyle = light(P.leaf, .12); ell(c, W.x + 290, W.y + 330, 30, 20); c.fill();
  c.restore();
  c.fillStyle = rgba('#FFFFFF', .22); poly(c, [[W.x + 30, W.y + W.h], [W.x + 170, W.y], [W.x + 230, W.y], [W.x + 90, W.y + W.h]]); c.fill();
  c.fillStyle = '#FFFBF4'; c.fillRect(W.x + W.w / 2 - 6, W.y, 12, W.h); c.fillRect(W.x, W.y + W.h * .45 - 5, W.w, 10);
  c.fillStyle = rgba('#3B2F6B', .18); c.fillRect(W.x, W.y, W.w, 9); c.fillRect(W.x + W.w - 8, W.y, 8, W.h);
  c.fillStyle = '#FFFBF4'; rr(c, W.x - 30, W.y + W.h + 14, W.w + 60, 16, 4); c.fill();
  planterSmall(c, W.x + 60, W.y + W.h + 14); planterSmall(c, W.x + 270, W.y + W.h + 14, .8);
  // ---- the whiteboard (the writing is live) ----
  const B = CLASS.board;
  c.fillStyle = rgba('#3B2F6B', .14); rr(c, B.x + 8, B.y + 12, B.w, B.h, 10); c.fill();
  c.fillStyle = mix(P.ink, P.cream, .62); rr(c, B.x - 12, B.y - 12, B.w + 24, B.h + 24, 12); c.fill();
  c.fillStyle = '#FDFEFC'; c.fillRect(B.x, B.y, B.w, B.h);
  c.fillStyle = rgba('#9BD3EC', .14); poly(c, [[B.x + 60, B.y], [B.x + 170, B.y], [B.x + 40, B.y + B.h], [B.x - 70 + 0, B.y + B.h]]); c.fill();
  c.fillStyle = rgba('#9BD3EC', .1); poly(c, [[B.x + 210, B.y], [B.x + 250, B.y], [B.x + 120, B.y + B.h], [B.x + 80, B.y + B.h]]); c.fill();
  c.fillStyle = mix(P.ink, P.cream, .55); rr(c, B.x + 40, B.y + B.h + 10, B.w - 80, 14, 5); c.fill();    // the marker tray
  for (const [mx, col] of [[B.x + 120, P.navy], [B.x + 170, P.red], [B.x + 215, P.teal]]) { c.fillStyle = col; rr(c, mx, B.y + B.h + 2, 40, 11, 5); c.fill(); c.fillStyle = P.cream; c.fillRect(mx + 28, B.y + B.h + 3, 4, 9); }
  c.fillStyle = '#FFFBF4'; rr(c, B.x + B.w - 120, B.y + B.h + 4, 60, 20, 6); c.fill(); c.fillStyle = P.navy; c.fillRect(B.x + B.w - 120, B.y + B.h + 16, 60, 8);   // the eraser
  // ---- the world map (the pins are live) ----
  const M = CLASS.map;
  c.fillStyle = rgba('#3B2F6B', .14); rr(c, M.x + 8, M.y + 10, M.w, M.h, 8); c.fill();
  c.fillStyle = P.navy; rr(c, M.x - 10, M.y - 10, M.w + 20, M.h + 20, 10); c.fill();
  c.fillStyle = mix(P.sky, P.cream, .35); c.fillRect(M.x, M.y, M.w, M.h);
  c.strokeStyle = rgba('#FFFFFF', .45); c.lineWidth = 1.5;
  for (let lon = -150; lon <= 180; lon += 30) { const [x] = mapXY(lon, 0); c.beginPath(); c.moveTo(x, M.y); c.lineTo(x, M.y + M.h); c.stroke(); }
  for (let lat = -40; lat <= 80; lat += 20) { const [, y] = mapXY(0, lat); c.beginPath(); c.moveTo(M.x, y); c.lineTo(M.x + M.w, y); c.stroke(); }
  for (const poly_ of LAND) { smooth(c, poly_.map(([lo, la]) => mapXY(lo, la))); c.fillStyle = mix(P.leaf, P.cream, .22); c.fill(); }
  c.save(); c.globalCompositeOperation = 'source-atop'; c.restore();
  for (const poly_ of LAND) { smooth(c, poly_.map(([lo, la]) => mapXY(lo + .8, la - 1.2))); c.strokeStyle = rgba(dark(P.leaf, .3), .25); c.lineWidth = 2; c.stroke(); }
  // ---- the door at the right ----
  const D = CLASS.door;
  c.fillStyle = rgba('#3B2F6B', .1); rr(c, D.x + 8, 300, D.w + 10, 496, 8); c.fill();
  c.fillStyle = '#FFFBF4'; rr(c, D.x - 14, 286, D.w + 28, 516, 10); c.fill();
  c.fillStyle = mix(P.navy, P.cream, .78); c.fillRect(D.x, 300, D.w, 498);   // the hallway beyond (seen when the door opens)
  c.fillStyle = mix(P.navy, P.cream, .62); c.fillRect(D.x, 660, D.w, 138);
  // the empty desk in the set (left of Ana's) + a coat hook row by the door
  deskFront(c, CLASS.desks.empty, { book: true });
  c.fillStyle = mix(P.ink, P.cream, .5); rr(c, D.x - 190, 420, 150, 12, 6); c.fill();
  for (const hx of [D.x - 170, D.x - 120, D.x - 70]) { c.fillStyle = P.ink; ell(c, hx, 438, 6, 10); c.fill(); }
  c.fillStyle = P.mustard; rr(c, D.x - 140, 440, 40, 90, 14); c.fill(); c.fillStyle = dark(P.mustard, .15); rr(c, D.x - 140, 440, 40, 26, 12); c.fill();   // a scarf on a hook
}
function planterSmall(c, x, base, s = 1) {
  c.save(); c.translate(x, base); c.scale(s, s);
  c.fillStyle = P.leaf; ell(c, -12, -58, 22, 26); c.fill(); ell(c, 12, -50, 20, 22); c.fill(); c.fillStyle = light(P.leaf, .15); ell(c, -16, -66, 8, 6, -.5); c.fill();
  c.fillStyle = P.teal; rr(c, -26, -34, 52, 34, 6); c.fill(); c.fillStyle = light(P.teal, .2); c.fillRect(-29, -37, 58, 8);
  c.restore();
}
// a desk seen from the front: the top, a modesty panel, two legs; x = its centre (world). o.book / o.form: things on the top
export function deskFront(c, x, o = {}) {
  const top = CLASS.deskTop, w = 300, WOODD = '#C98F5C';
  contact(c, x + 10, 882, 170, 14, .3);
  c.fillStyle = mix(P.ink, P.cream, .35); for (const s of [-1, 1]) { rr(c, x + s * (w / 2 - 26) - 7, top + 10, 14, 880 - top - 8, 5); c.fill(); }
  c.fillStyle = mix(P.navy, P.cream, .55); rr(c, x - w / 2 + 22, top + 14, w - 44, 50, 6); c.fill();
  c.fillStyle = rgba('#3B2F6B', .12); c.fillRect(x - w / 2 + 22, top + 14, w - 44, 10);
  if (o.book) { c.save(); c.translate(x - 50, top - 4); c.rotate(-.05); c.fillStyle = P.teal; rr(c, -46, -10, 92, 14, 3); c.fill(); c.fillStyle = P.cream; c.fillRect(-42, -8, 84, 4); c.restore(); }
  if (o.form) { c.save(); c.translate(x + 40, top - 2); c.fillStyle = '#FFFDF6'; rr(c, -40, -6, 80, 8, 2); c.fill(); c.restore(); }
  if (o.pencil) { c.save(); c.translate(x + 90, top - 3); c.rotate(.08); c.fillStyle = P.mustard; rr(c, -28, -4, 56, 7, 3); c.fill(); c.fillStyle = P.ink; c.fillRect(26, -3, 6, 5); c.restore(); }
  rr(c, x - w / 2, top - 2, w, 22, 8); c.fillStyle = WOODD; c.fill();
  c.fillStyle = light(WOODD, .25); rr(c, x - w / 2, top - 2, w, 8, 6); c.fill();
  c.fillStyle = rgba('#3B2F6B', .15); c.fillRect(x - w / 2 + 6, top + 16, w - 12, 4);
}
// board writing: o.lines = [{text, x, y, size, col, p (0..1 written), strike: [word index, p], under: [word index, p, col]}]
function boardWriting(c, lines) {
  for (const L of lines || []) {
    if (!(L.p > 0)) continue;
    c.save(); c.font = `600 ${L.size}px "Fredoka"`; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    const W = c.measureText(L.text).width, x0 = L.x - W / 2;
    c.save(); c.beginPath(); c.rect(x0 - 10, L.y - L.size * 1.1, (W + 20) * L.p, L.size * 1.5); c.clip();
    c.fillStyle = L.col || P.navy; c.fillText(L.text, x0, L.y); c.restore();
    const words = L.text.split(' '), sp = c.measureText(' ').width; let wx = x0;
    words.forEach((w, i) => {
      const ww = c.measureText(w.replace(/[.?!]$/, '')).width;
      if (L.hl && L.hl[0] === i && L.hl[1] > 0) { c.fillStyle = L.hl[2] || P.red; c.globalAlpha = 1; c.fillText(w.replace(/[.?!]$/, ''), wx, L.y); }
      if (L.strike && L.strike[0] === i && L.strike[1] > 0) { c.strokeStyle = P.red; c.lineWidth = L.size * .1; c.lineCap = 'round'; c.beginPath(); c.moveTo(wx - 6, L.y - L.size * .3); c.lineTo(wx - 6 + (ww + 12) * L.strike[1], L.y - L.size * .36); c.stroke(); }
      if (L.under && L.under[0] === i && L.under[1] > 0) { c.strokeStyle = L.under[2] || P.red; c.lineWidth = L.size * .08; c.lineCap = 'round'; c.beginPath(); c.moveTo(wx, L.y + L.size * .16); c.quadraticCurveTo(wx + ww / 2, L.y + L.size * .26, wx + ww * L.under[1], L.y + L.size * .14); c.stroke(); }
      wx += c.measureText(w).width + sp;
    });
    c.restore();
  }
}
// a map pin: k = 0..1 pop, hi = 0..1 pulse ring; label above/left/right
function pin(c, x, y, k, hi, t, label, side = 0) {
  if (k <= 0) return;
  const s = back(clamp(k), 2.4);
  if (hi > 0) { const u = (t * 1.4) % 1; c.strokeStyle = rgba(P.red, .6 * hi * (1 - u)); c.lineWidth = 3; ell(c, x, y, 8 + 22 * u, 8 + 22 * u); c.stroke(); }
  c.save(); c.translate(x, y); c.scale(s, s);
  ell(c, 2, 1, 6, 3); c.fillStyle = rgba('#1E1B33', .25); c.fill();
  c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(-4, -8, -11, -12, -11, -21); c.arc(0, -21, 11, PI, 0); c.bezierCurveTo(11, -12, 4, -8, 0, 0); c.fillStyle = P.red; c.fill();
  ell(c, 0, -21, 4.5, 4.5); c.fillStyle = P.cream; c.fill();
  if (label) {
    c.font = '600 21px "Fredoka"'; c.textBaseline = 'middle'; const w = c.measureText(label).width + 16;
    const lx = side < 0 ? -w - 14 : side > 0 ? 14 : -w / 2, ly = side ? -24 : -52;
    c.globalAlpha = clamp(k * 2 - 1); rr(c, lx, ly - 14, w, 28, 14); c.fillStyle = '#FFFDF8'; c.fill(); c.strokeStyle = rgba(P.ink, .15); c.lineWidth = 1.5; c.stroke();
    c.fillStyle = P.ink; c.textAlign = 'left'; c.fillText(label, lx + 8, ly + 1);
  }
  c.restore();
}
// the door leaf: open 0..1 (it swings into the room, so the visible leaf narrows)
function classDoor(c, open) {
  const D = CLASS.door, lw = D.w * Math.cos(clamp(open) * PI * .46);
  c.fillStyle = P.teal; rr(c, D.x, 300, lw, 498, 6); c.fill();
  if (lw > 40) {
    c.fillStyle = dark(P.teal, .18); for (const [py, ph] of [[324, 170], [530, 230]]) { rr(c, D.x + 26 * lw / D.w, py, Math.max(0, lw - 52 * lw / D.w), ph, 8); c.fill(); }
    c.fillStyle = P.mustard; ell(c, D.x + lw - 28 * lw / D.w, 560, 9, 9); c.fill();
  }
  c.fillStyle = light(P.teal, .2); c.fillRect(D.x, 300, lw, 10);
  c.fillStyle = rgba('#3B2F6B', .14); c.fillRect(D.x, 300, 8, 498);
}
let CLS = null;
export function drawClass(c, cam, t, o = {}) {
  if (!CLS) CLS = bake(-200, -120, 2300, 1100, 1.7, classStatic);
  soft(c, cam, 1, o.dof || 0, l => {
    blit(l, CLS);
    classDoor(l, o.door || 0);
    boardWriting(l, o.board);
    const P_ = o.pins || {};
    for (const [k, side] of [['usa', -1], ['spain', -1], ['egypt', 1]]) { const v = P_[k]; if (v) { const [x, y] = mapXY(...PINS[k]); pin(l, x, y, v.k, v.hi || 0, t, v.label, side); } }
    if (o.live) o.live(l);
  });
  c.setTransform(1, 0, 0, 1, 0, 0);
}
