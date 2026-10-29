// Bean People v2 — London street in the same vector language (episode 1), plus the two interior sets of episode 2:
// Youssef's bedroom (open) and the school hallway (hall + coffee), authored in the same screen px / parallax 1 space. Authored in screen px for the establishing camera
// (CAM0 = centre 960,540, zoom 1); every layer has a parallax factor p (0 = sky, 1 = the characters' pavement, >1 = foreground).
import { CPU, P, HAZE, mix, rgba, dark, light, rr, ell, smooth, poly, contact, formed, layer } from './kit.js';
import { clamp, lerp, seg } from '/core/lib.js';
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
// tod: 0 = morning, 1 = golden afternoon (the light stays upper-left; only its colour warms)
const SKY0 = ['#6FBCE3', '#A6D9EF', '#E3EEE9', '#F8E8D2'], SKY1 = ['#7FA9D6', '#E9C9A6', '#FBD6A0', '#FFE3B8'];
function sky(c, cam, t, tod = 0) {
  const [, hy] = toScreen(cam, .1, 0, 660);
  const g = c.createLinearGradient(0, hy - 900, 0, hy);
  [0, .55, .88, 1].forEach((st, i) => g.addColorStop(st, mix(SKY0[i], SKY1[i], tod)));
  c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = g; c.fillRect(0, 0, SW, SH);
  // warm sun glow, upper-left (defines the light direction for the whole film)
  const [sx, sy] = toScreen(cam, .03, 140 - 40 * tod, 40 + 140 * tod);
  const sg = c.createRadialGradient(sx, sy, 0, sx, sy, 900 + 200 * tod);
  sg.addColorStop(0, tod > .01 ? rgba(mix('#FFF0C8', '#FFD08A', tod), .75 + .15 * tod) : 'rgba(255,240,200,.75)');
  sg.addColorStop(.35, rgba(mix('#FFECC8', '#FFC98A', tod), .25 + .15 * tod)); sg.addColorStop(1, 'rgba(255,236,200,0)');
  c.fillStyle = sg; c.fillRect(0, 0, SW, SH);
  // clouds (cached sprite)
  const CL = [[300, 150, 1.1, .05], [1050, 95, .8, .07], [1650, 210, 1.25, .06], [2300, 130, .9, .05], [-300, 230, .7, .04], [-1100, 170, 1.0, .05], [-1900, 110, .85, .06]];
  const sp = cloudSprite();
  for (const [x, y, s2, p] of CL) {
    layerT(c, cam, p); const cx = x + t * 6 * (1 + s2);
    c.drawImage(sp, cx - 150 * s2, y - 130 * s2, 330 * s2, 200 * s2);
    if (tod > .01) { c.globalAlpha = .35 * tod; c.globalCompositeOperation = 'multiply'; c.drawImage(sp, cx - 150 * s2, y - 130 * s2, 330 * s2, 200 * s2); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
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

// ---------------- far skyline (generic clock tower, dome, wheel) ----------------
function far(c) {
  const F = mix(mix(P.sky, '#7C78B4', .45), '#DCEAF2', .25), Fl = mix(F, '#EEF4F6', .35), base = 660;
  c.fillStyle = F;
  // big wheel
  c.save(); c.translate(150, 470); c.strokeStyle = F; c.lineWidth = 6; c.beginPath(); c.arc(0, 0, 118, 0, PI * 2); c.stroke();
  c.lineWidth = 2.2; for (let i = 0; i < 16; i++) { const a = i / 16 * PI * 2; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * 118, Math.sin(a) * 118); c.stroke(); ell(c, Math.cos(a) * 118, Math.sin(a) * 118, 8, 6); c.fill(); }
  c.lineWidth = 7; c.beginPath(); c.moveTo(-60, 190); c.lineTo(0, 0); c.lineTo(60, 190); c.stroke(); c.restore();
  // skyline blocks
  const blocks = [[-400, 590], [-250, 610], [-60, 600], [230, 585], [300, 612], [520, 570], [640, 600], [700, 585], [960, 560], [1010, 450], [1090, 510], [1160, 590], [1250, 420], [1330, 560], [1450, 600],
    [1560, 470], [1640, 560], [1760, 590], [1880, 520], [1980, 600], [2120, 455], [2220, 580], [2380, 600], [2500, 540]];
  for (let i = 0; i < blocks.length; i++) {
    const [x, y] = blocks[i], w = (blocks[i + 1] ? blocks[i + 1][0] - x : 140) + 2;
    c.fillStyle = F; c.fillRect(x, y, w, base - y + 2);
    c.fillStyle = Fl; c.fillRect(x, y, Math.min(14, w * .2), base - y);
    if (base - y > 120) { c.fillStyle = rgba('#FFFFFF', .14); for (let yy = y + 18; yy < base - 20; yy += 22) for (let xx = x + 18; xx < x + w - 14; xx += 18) c.fillRect(xx, yy, 7, 10); }
  }
  // clock tower (generic gothic)
  c.fillStyle = F;
  c.fillRect(405, 330, 70, base - 330);
  c.fillRect(398, 318, 84, 16); c.fillRect(395, 395, 90, 10);
  poly(c, [[400, 318], [480, 318], [440, 205]]); c.fill();
  for (const x of [400, 480]) { poly(c, [[x - 7, 320], [x + 7, 320], [x, 278]]); c.fill(); }
  c.fillRect(436, 186, 8, 30);
  ell(c, 440, 362, 24, 24); c.fillStyle = Fl; c.fill(); c.strokeStyle = F; c.lineWidth = 3; c.beginPath(); c.moveTo(440, 362); c.lineTo(440, 346); c.moveTo(440, 362); c.lineTo(452, 366); c.stroke();
  c.fillStyle = Fl; c.fillRect(405, 420, 12, base - 420);
  // long gothic hall next to it
  c.fillStyle = F; c.fillRect(475, 560, 190, base - 560); for (let x = 480; x < 665; x += 24) { poly(c, [[x, 562], [x + 10, 562], [x + 5, 540]]); c.fill(); }
  // dome
  c.fillStyle = F; c.fillRect(805, 540, 130, base - 540); c.fillRect(825, 505, 90, 40);
  c.beginPath(); c.ellipse(870, 508, 58, 62, 0, PI, 2 * PI); c.fill(); c.fillRect(862, 430, 16, 20); ell(c, 870, 428, 6, 6); c.fill();
  c.fillStyle = Fl; c.beginPath(); c.ellipse(870, 508, 58, 62, 0, PI, PI * 1.32); c.lineTo(870, 508); c.fill();
  // haze at the base
  const g = c.createLinearGradient(0, 560, 0, base); g.addColorStop(0, rgba('#EEF3F2', 0)); g.addColorStop(1, rgba('#F4EEE4', .85));
  c.fillStyle = g; c.fillRect(-600, 540, 3400, base - 540 + 10);
}

// ---------------- mid layer: across the road (terraced houses, street trees, bus) ----------------
const PASTEL = [mix(P.teal, P.cream, .62), mix(P.mustard, P.cream, .5), mix(P.red, P.cream, .62), mix(P.sky, P.cream, .25), mix('#A795D6', P.cream, .45), mix(P.leaf, P.cream, .55)];
const DOORS = [P.navy, P.red, P.teal, P.ink, P.mustard, P.navy];
function house(c, x, w, h, col, door, base) {
  const top = base - h;
  c.fillStyle = col; c.fillRect(x, top, w, h);
  c.fillStyle = dark(col, .1); c.fillRect(x + w - 6, top, 6, h);                      // party-wall shade
  c.fillStyle = light(col, .35); c.fillRect(x - 3, top - 4, w + 6, 12);                 // cornice
  c.fillStyle = rgba('#3B2F6B', .12); c.fillRect(x, top + 8, w, 6);
  c.fillStyle = light(col, .2); c.fillRect(x, base - 72, w, 4);                          // string course
  // chimney
  c.fillStyle = dark(col, .15); c.fillRect(x + w * .62, top - 26, 34, 24);
  c.fillStyle = '#C9785F'; for (let i = 0; i < 3; i++) c.fillRect(x + w * .62 + 4 + i * 10, top - 36, 7, 12);
  // windows (3 floors × 2)
  const win = (wx, wy, ww, wh) => {
    c.fillStyle = P.cream; rr(c, wx - 3, wy - 3, ww + 6, wh + 6, 3); c.fill();
    c.fillStyle = mix(P.navy, P.sky, .55); c.fillRect(wx, wy, ww, wh);
    c.fillStyle = rgba('#FFFFFF', .28); poly(c, [[wx + ww * .2, wy + wh], [wx + ww * .75, wy], [wx + ww, wy], [wx + ww * .45, wy + wh]]); c.fill();
    c.fillStyle = P.cream; c.fillRect(wx, wy + wh / 2 - 1.5, ww, 3); c.fillRect(wx + ww / 2 - 1.5, wy, 3, wh);
  };
  for (let f = 0; f < 2; f++) for (let i = 0; i < 2; i++) win(x + w * (.18 + i * .42), top + 30 + f * 66, w * .24, 44);
  win(x + w * .15, base - 62, w * .28, 44);
  // door
  c.fillStyle = light(col, .5); rr(c, x + w * .58 - 4, base - 64, 40, 64, 18); c.fill();
  c.fillStyle = door; rr(c, x + w * .58, base - 58, 32, 58, 14); c.fill();
  c.fillStyle = P.mustard; ell(c, x + w * .58 + 25, base - 28, 2.5, 2.5); c.fill();
}
function tree(c, x, base, s = 1) {
  c.fillStyle = '#7A5A55'; c.fillRect(x - 5 * s, base - 70 * s, 10 * s, 70 * s);
  const L = P.leaf, Ld = dark(L, .22);
  c.beginPath(); for (const [bx, by, r] of [[-30, -88, 40], [18, -100, 46], [0, -132, 42], [36, -74, 32], [-46, -60, 26]]) { c.moveTo(x + bx * s + r * s, base + by * s); c.arc(x + bx * s, base + by * s, r * s, 0, PI * 2); }
  c.fillStyle = Ld; c.fill();
  c.beginPath(); for (const [bx, by, r] of [[-34, -92, 36], [12, -106, 40], [-4, -136, 36], [28, -82, 26], [-50, -64, 20]]) { c.moveTo(x + bx * s + r * s, base + by * s); c.arc(x + bx * s, base + by * s, r * s, 0, PI * 2); }
  c.fillStyle = L; c.fill();
  c.fillStyle = rgba('#FFFFFF', .16); ell(c, x - 20 * s, base - 140 * s, 16 * s, 10 * s, -.5); c.fill();
}
function mid(c) {
  const base = 700;
  // houses
  let x = -2780, i = 0;
  const W = [168, 180, 158, 186, 172, 164];
  const Hh = [232, 250, 224, 258, 240, 228];
  while (x < 2900) { const w = W[i % 6], h = Hh[(i * 5) % 6]; house(c, x, w, h, PASTEL[i % 6], DOORS[(i * 7) % 6], base); x += w; i++; }
  // far pavement + road
  c.fillStyle = '#E2D7CC'; c.fillRect(-2900, base - 4, 5900, 14);
  c.fillStyle = '#8F90AC'; c.fillRect(-2900, base + 10, 5900, 70);
  c.fillStyle = rgba(P.cream, .8); for (let xx = -2900; xx < 3000; xx += 74) c.fillRect(xx, base + 43, 40, 5);
  // street trees
  for (const tx of [-2220, -1760, -1300, -840, -380, 60, 520, 980, 1440, 1900, 2360]) tree(c, tx, base + 4, 1.05);
}
export function bus(c, x, base, s) {
  c.save(); c.translate(x, base); c.scale(s, s);
  const L = 360, Hb = 176;
  contact(c, 10, 0, 200, 10, .25);
  c.fillStyle = P.red; rr(c, -L / 2, -Hb, L, Hb - 12, 22); c.fill();
  c.fillStyle = dark(P.red, .2); c.fillRect(-L / 2, -38, L, 14);
  c.fillStyle = P.cream; c.fillRect(-L / 2, -96, L, 9);
  const gl = mix(P.navy, P.sky, .45);
  for (let i = 0; i < 6; i++) { c.fillStyle = gl; rr(c, -L / 2 + 52 + i * 50, -164, 42, 50, 7); c.fill(); }
  for (let i = 0; i < 5; i++) { c.fillStyle = gl; rr(c, -L / 2 + 100 + i * 50, -82, 42, 38, 7); c.fill(); }
  // front (driving left)
  c.fillStyle = gl; rr(c, -L / 2 + 8, -164, 36, 50, 8); c.fill(); rr(c, -L / 2 + 8, -84, 40, 44, 8); c.fill();
  c.fillStyle = P.ink; rr(c, -L / 2 + 54, -84, 36, 60, 6); c.fill();
  c.fillStyle = P.cream; rr(c, -L / 2 + 10, -178, 70, 12, 4); c.fill();
  c.fillStyle = P.mustard; ell(c, -L / 2 + 6, -34, 6, 5); c.fill();
  c.fillStyle = rgba('#FFFFFF', .25); for (let i = 0; i < 6; i++) { poly(c, [[-L / 2 + 58 + i * 50, -116], [-L / 2 + 78 + i * 50, -164], [-L / 2 + 88 + i * 50, -164], [-L / 2 + 68 + i * 50, -116]]); c.fill(); }
  c.fillStyle = rgba('#3B2F6B', .18); c.fillRect(-L / 2, -36, L, 24);
  for (const wx of [-L / 2 + 70, L / 2 - 80]) { ell(c, wx, -12, 24, 24); c.fillStyle = P.ink; c.fill(); ell(c, wx, -12, 10, 10); c.fillStyle = '#B9B6CC'; c.fill(); }
  c.restore();
}

// ---------------- near layer: our pavement, phone box, the ENGLISH SCHOOL ----------------
function pavement(c) {
  const X0 = -3400, X1 = 3300;
  c.fillStyle = '#CFC4BA'; c.fillRect(X0, 770, X1 - X0, 14);         // kerb
  c.fillStyle = '#F0E8DC'; c.fillRect(X0, 770, X1 - X0, 4);
  const g = c.createLinearGradient(0, 784, 0, 1200); g.addColorStop(0, '#EDE3D5'); g.addColorStop(1, '#E2D5C6');
  c.fillStyle = g; c.fillRect(X0, 784, X1 - X0, 900);
  c.strokeStyle = rgba('#8B7C8E', .16); c.lineWidth = 2;
  for (const y of [812, 858, 925, 1015, 1130]) { c.beginPath(); c.moveTo(X0, y); c.lineTo(X1, y); c.stroke(); }
  // slab joints: each block of the street has its own vanishing point, so the joints never fan out too far
  for (let x = X0; x < X1; x += 150) { const vx = Math.round((x + 600) / 1500) * 1500 - 540, vy = 300; c.beginPath(); c.moveTo(x, 784); c.lineTo(x + (x - vx) * (1300 - 784) / (784 - vy), 1300); c.stroke(); }
}
// a red pillar post box (generic, no crest)
function postBox(c, x, base) {
  contact(c, x + 10, base + 2, 44, 8, .3);
  formed(c, { x: x - 50, y: base - 190, w: 100, h: 200 }, l => {
    l.fillStyle = P.red; rr(l, x - 30, base - 150, 60, 150, 8); l.fill();
    l.beginPath(); l.ellipse(x, base - 150, 34, 22, 0, PI, 2 * PI); l.fill(); l.fillRect(x - 34, base - 152, 68, 10);
    l.fillStyle = dark(P.red, .35); rr(l, x - 18, base - 118, 36, 7, 3); l.fill();
    l.fillStyle = P.cream; rr(l, x - 14, base - 96, 28, 20, 3); l.fill();
    l.fillStyle = dark(P.red, .25); l.fillRect(x - 34, base - 12, 68, 12);
  }, { sx: 8, sy: 5, soft: 2, shadeA: .45, hx: 3, hy: 3, hiA: .4, hy0: base - 170, hy1: base });
}
function bench(c, x, base) {
  contact(c, x + 12, base + 2, 110, 10, .25);
  formed(c, { x: x - 120, y: base - 120, w: 240, h: 130 }, l => {
    l.fillStyle = P.navy; for (const s of [-1, 1]) { rr(l, x + s * 80 - 6, base - 62, 12, 62, 4); l.fill(); }
    l.fillStyle = '#B8794E'; for (const y of [-64, -96, -112]) { rr(l, x - 104, base + y, 208, 12, 5); l.fill(); }
    l.fillStyle = P.navy; for (const s of [-1, 1]) { rr(l, x + s * 80 - 5, base - 118, 10, 58, 4); l.fill(); }
  }, { sx: 8, sy: 5, soft: 2, shadeA: .45, hx: 3, hy: 3, hiA: .35, hy0: base - 120, hy1: base });
}
function phoneBox(c, x, base) {
  const w = 86, h = 236;
  contact(c, x + 14, base + 2, 70, 10, .3);
  formed(c, { x: x - 70, y: base - h - 30, w: 140, h: h + 40 }, l => {
    l.fillStyle = P.red;
    rr(l, x - w / 2 - 6, base - 14, w + 12, 14, 3); l.fill();
    rr(l, x - w / 2, base - h, w, h - 10, 6); l.fill();
    l.beginPath(); l.moveTo(x - w / 2 - 4, base - h + 6); l.quadraticCurveTo(x, base - h - 30, x + w / 2 + 4, base - h + 6); l.closePath(); l.fill();
    l.fillStyle = P.cream; rr(l, x - w / 2 + 8, base - h + 8, w - 16, 16, 3); l.fill();
    l.fillStyle = P.red; l.font = '600 11px "Fredoka"'; l.textAlign = 'center'; l.fillText('TELEPHONE', x, base - h + 20);
    const gl = mix(P.navy, P.sky, .5);
    for (let r = 0; r < 4; r++) for (let q = 0; q < 3; q++) { l.fillStyle = gl; l.fillRect(x - w / 2 + 12 + q * 22, base - h + 34 + r * 40, 18, 34); }
    l.fillStyle = rgba('#FFFFFF', .22); poly(l, [[x - 28, base - 60], [x + 4, base - h + 34], [x + 18, base - h + 34], [x - 14, base - 60]]); l.fill();
  }, { sx: 9, sy: 5, soft: 1.5, shadeA: .45, hx: 3, hy: 3, hiA: .4, hy0: base - h, hy1: base });
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
export function school(c) {
  const x0 = 1140, x1 = 1920, base = 795, top = 150;
  const ST = '#F4E7D0', STd = dark(ST, .07);
  // side wall (lit, faces the sun) + facade
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
  // sign board
  const sx = (x0 + x1) / 2;
  c.fillStyle = rgba('#3B2F6B', .18); rr(c, sx - 330, 196, 660, 92, 14); c.fill();
  c.fillStyle = P.navy; rr(c, sx - 334, 188, 668, 92, 14); c.fill();
  c.strokeStyle = P.mustard; c.lineWidth = 5; rr(c, sx - 322, 198, 644, 72, 9); c.stroke();
  c.fillStyle = P.cream; c.font = '400 58px "Lilita One"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.letterSpacing = '6px'; c.fillText('ENGLISH SCHOOL', sx + 3, 237); c.letterSpacing = '0px'; c.textBaseline = 'alphabetic';
  for (const s of [-1, 1]) { ell(c, sx + s * 300, 234, 7, 7); c.fillStyle = P.mustard; c.fill(); }
  // first floor windows
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
  // the school clock (face only; the hands are drawn live by clockHands)
  const CX = CLOCK.x, CY = CLOCK.y;
  c.fillStyle = rgba('#3B2F6B', .14); ell(c, CX + 6, CY + 8, 70, 70); c.fill();
  c.fillStyle = light(ST, .5); poly(c, [[CX - 70, CY - 66], [CX + 70, CY - 66], [CX, CY - 100]]); c.fill();
  c.fillStyle = P.navy; ell(c, CX, CY, 68, 68); c.fill();
  c.fillStyle = P.mustard; ell(c, CX, CY, 60, 60); c.fill();
  c.fillStyle = '#FFFBF4'; ell(c, CX, CY, 53, 53); c.fill();
  c.fillStyle = P.ink;
  for (let i = 0; i < 12; i++) { const a = i / 12 * 2 * PI, r0 = i % 3 ? 44 : 39; c.save(); c.translate(CX + Math.sin(a) * 46, CY - Math.cos(a) * 46); c.rotate(a); rr(c, -2.5, -(i % 3 ? 4 : 7), 5, i % 3 ? 8 : 14, 2.5); c.fill(); c.restore(); }
  // ground floor windows + window boxes
  for (const cx of [1262, 1798]) {
    win(cx - 52, 606, 104, 118, false);
    c.fillStyle = dark(P.leaf, .15); rr(c, cx - 66, 732, 132, 24, 12); c.fill();
    c.fillStyle = P.leaf; for (let i = 0; i < 7; i++) { ell(c, cx - 54 + i * 18, 732, 13, 11); c.fill(); }
    for (let i = 0; i < 6; i++) { c.fillStyle = i % 2 ? P.mustard : P.red; ell(c, cx - 46 + i * 18, 726 - (i % 3) * 3, 5, 5); c.fill(); }
    c.fillStyle = P.teal; rr(c, cx - 64, 748, 128, 22, 4); c.fill();
  }
  // portico: columns, entablature, fanlight, door (opens: 0..1)
  const dx = DOOR.x, dw = 116, dh = 196, dTop = base - dh;
  c.fillStyle = rgba('#3B2F6B', .12); rr(c, dx - 128, 580, 270, 20, 4); c.fill();
  c.fillStyle = '#FFFBF4'; rr(c, dx - 138, 560, 276, 26, 5); c.fill();
  poly(c, [[dx - 130, 562], [dx + 130, 562], [dx, 520]]); c.fill();
  c.fillStyle = rgba('#3B2F6B', .08); poly(c, [[dx - 96, 556], [dx + 96, 556], [dx, 532]]); c.fill();
  // doorway recess
  c.fillStyle = dark(ST, .25); rr(c, dx - dw / 2 - 12, dTop - 70, dw + 24, dh + 70, { tl: 70, tr: 70 }); c.fill();
  // fanlight
  c.save(); c.beginPath(); c.arc(dx, dTop - 4, dw / 2, PI, 2 * PI); c.closePath(); c.fillStyle = mix(P.navy, P.sky, .45); c.fill();
  c.strokeStyle = '#FFFBF4'; c.lineWidth = 4; for (let i = 1; i < 6; i++) { const a = PI + i / 6 * PI; c.beginPath(); c.moveTo(dx, dTop - 4); c.lineTo(dx + Math.cos(a) * dw / 2, dTop - 4 + Math.sin(a) * dw / 2); c.stroke(); }
  c.lineWidth = 6; c.beginPath(); c.arc(dx, dTop - 4, dw / 2, PI, 2 * PI); c.stroke(); c.restore();
  // columns
  for (const s of [-1, 1]) {
    const cx = dx + s * 104;
    c.fillStyle = '#FFFBF4'; c.fillRect(cx - 13, 586, 26, base - 586);
    c.fillStyle = rgba('#3B2F6B', .12); c.fillRect(cx + 4, 586, 9, base - 586);
    c.fillStyle = '#FFFBF4'; c.fillRect(cx - 18, 586, 36, 10); c.fillRect(cx - 18, base - 12, 36, 12);
  }
  // brass plaque
  c.fillStyle = P.mustard; rr(c, dx + 132, 640, 44, 30, 4); c.fill(); c.fillStyle = dark(P.mustard, .3); c.fillRect(dx + 140, 650, 28, 3); c.fillRect(dx + 140, 657, 20, 3);
  // steps
  c.fillStyle = '#E8DED2'; rr(c, dx - 132, base, 264, 16, 3); c.fill(); c.fillStyle = '#DACFC2'; rr(c, dx - 150, base + 16, 300, 16, 3); c.fill();
  c.fillStyle = rgba('#3B2F6B', .1); c.fillRect(dx - 132, base + 12, 264, 4); c.fillRect(dx - 150, base + 28, 300, 4);
  // base shadow line
  c.fillStyle = rgba('#3B2F6B', .12); c.fillRect(x0 - 26, base - 4, x1 - x0 + 26, 8);
}
// live parts of the school: the doorway interior + the door leaf (open 0..1); world coordinates
export function doorLive(c, door) {
  const dx = DOOR.x, dw = 116, dh = 196, base = 795, dTop = base - dh;
  const gi = c.createLinearGradient(0, dTop, 0, base); gi.addColorStop(0, '#5B4058'); gi.addColorStop(1, '#8A5E5A');
  c.fillStyle = gi; c.fillRect(dx - dw / 2, dTop, dw, dh);
  c.fillStyle = '#C98B5E'; c.fillRect(dx - dw / 2, base - 46, dw, 46);                     // hallway floor
  c.fillStyle = rgba('#FFE2A8', .5); rr(c, dx - 18, dTop + 40, 46, 60, 3); c.fill();       // notice board
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
// clock hands; hours as a float (9.0 = nine o'clock)
export function clockHands(c, hours) {
  const CX = CLOCK.x, CY = CLOCK.y, ha = (hours % 12) / 12 * 2 * PI, ma = (hours % 1) * 2 * PI;
  c.lineCap = 'round'; c.strokeStyle = P.ink;
  c.lineWidth = 7; c.beginPath(); c.moveTo(CX, CY); c.lineTo(CX + Math.sin(ha) * 26, CY - Math.cos(ha) * 26); c.stroke();
  c.lineWidth = 5; c.beginPath(); c.moveTo(CX, CY); c.lineTo(CX + Math.sin(ma) * 40, CY - Math.cos(ma) * 40); c.stroke();
  c.fillStyle = P.red; ell(c, CX, CY, 6, 6); c.fill();
}
function neighbour(c) {
  const x0 = 1920, x1 = 2460, base = 795, top = 230, col = mix(P.red, P.cream, .66);
  c.fillStyle = col; c.fillRect(x0, top, x1 - x0, base - top);
  c.fillStyle = rgba('#3B2F6B', .12); c.fillRect(x0, top, 14, base - top);
  c.fillStyle = light(col, .4); c.fillRect(x0 - 6, top - 14, x1 - x0 + 12, 20);
  for (let f = 0; f < 2; f++) for (let i = 0; i < 3; i++) {
    const wx = x0 + 60 + i * 150, wy = top + 70 + f * 200;
    c.fillStyle = '#FFFBF4'; rr(c, wx - 8, wy - 8, 96, 146, 5); c.fill(); c.fillStyle = mix(P.navy, P.sky, .5); c.fillRect(wx, wy, 80, 130);
    c.fillStyle = '#FFFBF4'; c.fillRect(wx, wy + 62, 80, 6); c.fillRect(wx + 37, wy, 6, 130);
    c.fillStyle = rgba('#FFFFFF', .28); poly(c, [[wx + 8, wy + 130], [wx + 50, wy], [wx + 70, wy], [wx + 28, wy + 130]]); c.fill();
  }
  c.fillStyle = P.ink; rr(c, x0 + 210, base - 190, 100, 190, { tl: 50, tr: 50 }); c.fill();
}
function lamp(c, x, base) {
  const N = '#2B3060';
  contact(c, x + 20, base + 4, 60, 9, .25);
  c.fillStyle = N;
  rr(c, x - 22, base - 70, 44, 70, 6); c.fill();
  rr(c, x - 12, base - 600, 24, 540, 10); c.fill();
  rr(c, x - 16, base - 330, 32, 16, 6); c.fill();
  c.fillStyle = rgba('#FFFFFF', .12); c.fillRect(x - 8, base - 590, 6, 520);
  // lantern
  c.fillStyle = N; poly(c, [[x - 46, base - 690], [x + 46, base - 690], [x + 20, base - 720], [x - 20, base - 720]]); c.fill();
  ell(c, x, base - 728, 10, 10); c.fill();
  c.fillStyle = '#FFF2C9'; poly(c, [[x - 38, base - 688], [x + 38, base - 688], [x + 26, base - 610], [x - 26, base - 610]]); c.fill();
  c.strokeStyle = N; c.lineWidth = 5; c.beginPath(); c.moveTo(x, base - 688); c.lineTo(x, base - 610); c.stroke();
  c.fillStyle = N; rr(c, x - 32, base - 614, 64, 12, 4); c.fill();
  c.lineWidth = 6; c.beginPath(); c.moveTo(x - 50, base - 600); c.lineTo(x + 50, base - 600); c.stroke();
}

// ---------------- caches: the static layers are baked once (haze included) and blitted with the camera each frame ----------------
function bake(x0, y0, x1, y1, res, draw, haze = 0) {
  const cv = document.createElement('canvas'); cv.width = Math.ceil((x1 - x0) * res); cv.height = Math.ceil((y1 - y0) * res);
  const c = cv.getContext('2d', CPU); c.setTransform(res, 0, 0, res, -x0 * res, -y0 * res); draw(c);
  if (haze > 0) { c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-atop'; c.fillStyle = rgba(HAZE, haze); c.fillRect(0, 0, cv.width, cv.height); c.globalCompositeOperation = 'source-over'; }
  return { cv, x0, y0, x1, y1, res };
}
function blit(c, B) { c.drawImage(B.cv, 0, 0, B.cv.width, B.cv.height, B.x0, B.y0, B.x1 - B.x0, B.y1 - B.y0); }
let K = null;
const nearAll = l => { pavement(l); for (const x of [-2050, -760, 520]) { l.save(); l.translate(x, 800); l.scale(.62, .62); l.translate(-x, -1075); lamp(l, x, 1075); l.restore(); } bench(l, -1650, 812); postBox(l, -560, 812); planter(l, -980, 812); school(l); neighbour(l); phoneBox(l, 1010, 808); planter(l, 1372, 812); planter(l, 1688, 812); };
export function bakeWorld() {
  if (K) return K;
  K = {
    far: bake(-760, 170, 2760, 668, 1.25, far, 0),
    mid: bake(-2900, 380, 3050, 790, 1.4, mid, .24),
    nearL: bake(-3400, 60, 900, 1300, 1.3, nearAll),
    nearR: bake(900, 60, 2600, 1300, 2.0, nearAll),
    bus: bake(-200, -200, 200, 30, 2, l => bus(l, 0, 0, 1), .24),
  };
  return K;
}
// one parallax layer; blur (px, depth of field) is done by drawing at low resolution and scaling up (cheap on CPU)
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
// o: { door (0..1), busX (mid-layer x), dof (blur px for background layers), nearDof, tod (0..1), clock (hours) }
export function drawWorld(c, cam, t, o = {}) {
  const k = bakeWorld(), dof = o.dof || 0;
  sky(c, cam, t, o.tod || 0);
  soft(c, cam, .12, dof * .9, l => blit(l, k.far));
  soft(c, cam, .45, dof * .8, l => { blit(l, k.mid); if (o.busX != null) l.drawImage(k.bus.cv, o.busX - 200, 774 - 200, 400, 230); });
  soft(c, cam, 1, o.nearDof ?? dof * .6, l => { blit(l, k.nearL); blit(l, k.nearR); doorLive(l, o.door || 0); clockHands(l, o.clock ?? 8.9); });
  c.setTransform(1, 0, 0, 1, 0, 0);
}
export function drawForeground(c, cam, t, o = {}) {
  c.save(); layerT(c, cam, 1.3); for (const x of (o.lamps || [200])) lamp(c, x, 1075); c.restore(); c.setTransform(1, 0, 0, 1, 0, 0);
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
  // window (left wall): sky, a slice of London, mullions, curtains, rod
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
