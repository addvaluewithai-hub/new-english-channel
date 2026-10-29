// Bean People: the flat London street (world units; ground line of characters = 850).
import { PAL, mix, tint, shade, INKA, CREAMA } from './bean.js';
const TAU = Math.PI * 2;
const rr = (c, x, y, w, h, r) => { c.beginPath(); c.roundRect(x, y, w, h, r); };
const circ = (c, x, y, r) => { c.beginPath(); c.arc(x, y, r, 0, TAU); };
const hash = n => { n = Math.sin(n * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };

export const SKY_FAR = mix('sky', 'navy', 0.1);
export const SKY_MID = mix('sky', 'navy', 0.2);
export const GLASS = mix('sky', 'navy', 0.3);

export function drawSky(c, t) {
  c.fillStyle = PAL.sky; c.fillRect(-4000, -4000, 12000, 12000);
}
export function drawClouds(c, t) {
  // layer depth ~0.1
  c.fillStyle = tint('sky', 0.55);
  circ(c, 1560, 170, 70); c.fillStyle = tint('mustard', 0.55); c.fill();
  c.fillStyle = CREAMA(0.9);
  for (const [x, y, s] of [[180, 150, 1], [820, 90, 0.75], [1250, 200, 0.9], [2050, 120, 1.1]]) {
    const xx = x + t * 9 * s;
    c.beginPath();
    c.roundRect(xx - 110 * s, y, 220 * s, 46 * s, 23 * s);
    c.arc(xx - 40 * s, y + 6 * s, 40 * s, 0, TAU);
    c.arc(xx + 30 * s, y - 2 * s, 52 * s, 0, TAU);
    c.fill();
  }
}
export function drawSkylineFar(c) {
  c.fillStyle = SKY_FAR;
  const bl = [[-300, 520], [-120, 470], [60, 540], [520, 500], [700, 450], [900, 520], [1150, 480], [1400, 430], [1620, 500], [1850, 460], [2100, 520], [2350, 470]];
  for (const [x, y] of bl) { rr(c, x, y, 200, 700, [10, 10, 0, 0]); c.fill(); }
  // a dome
  circ(c, 1500, 440, 70); c.fill(); c.fillRect(1440, 440, 120, 500);
}
export function drawSkylineMid(c) {
  const col = SKY_MID;
  c.fillStyle = col;
  // clock tower (generic gothic clock tower, x≈330)
  c.fillRect(292, 330, 76, 700);
  c.fillRect(278, 236, 104, 104);
  c.fillRect(286, 190, 88, 50);
  c.beginPath(); c.moveTo(282, 192); c.lineTo(330, 70); c.lineTo(378, 192); c.closePath(); c.fill();
  c.fillRect(327, 40, 6, 36);
  for (const x of [282, 372]) { c.beginPath(); c.moveTo(x - 7, 236); c.lineTo(x, 200); c.lineTo(x + 7, 236); c.fill(); }
  c.fillStyle = tint('cream', 0); circ(c, 330, 288, 36); c.fill();
  c.strokeStyle = col; c.lineWidth = 5; c.lineCap = 'round';
  c.beginPath(); c.moveTo(330, 288); c.lineTo(330, 264); c.moveTo(330, 288); c.lineTo(348, 296); c.stroke();
  c.fillStyle = PAL.sky;
  for (const x of [298, 322, 346]) { rr(c, x, 200, 14, 30, [7, 7, 0, 0]); c.fill(); }
  c.fillStyle = col;
  for (const [x, w, y] of [[-200, 260, 560], [430, 220, 600], [760, 180, 580], [1100, 240, 620], [1500, 200, 560], [1800, 260, 600], [2200, 220, 580]]) {
    c.fillRect(x, y, w, 600);
  }
}

// ---------- street (depth 1) ----------
const FACADES = [tint('mustard', 0.55), tint('teal', 0.66), tint('tomato', 0.62), mix('cream', 'navy', 0.12), tint('mustard', 0.7), tint('teal', 0.5)];
const DOORS = [PAL.navy, PAL.tomato, PAL.teal, PAL.mustard, PAL.navy, PAL.tomato];

function sash(c, x, y, w, h, seed) {
  c.fillStyle = PAL.cream; rr(c, x - 7, y - 7, w + 14, h + 14, 6); c.fill();
  c.fillStyle = GLASS; c.fillRect(x, y, w, h);
  // curtain on some windows
  const k = hash(seed);
  if (k > 0.45) {
    c.fillStyle = k > 0.75 ? tint('tomato', 0.35) : tint('mustard', 0.25);
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + w * 0.32, y); c.quadraticCurveTo(x + w * 0.14, y + h * 0.5, x + w * 0.2, y + h); c.lineTo(x, y + h); c.fill();
  }
  c.fillStyle = CREAMA(0.28); c.beginPath(); c.moveTo(x + w * 0.55, y); c.lineTo(x + w * 0.8, y); c.lineTo(x + w * 0.35, y + h); c.lineTo(x + w * 0.1, y + h); c.fill();
  c.fillStyle = INKA(0.14); c.fillRect(x, y, w, 9);
  c.fillStyle = PAL.cream; c.fillRect(x, y + h / 2 - 3, w, 6); c.fillRect(x + w / 2 - 2.5, y, 5, h);
  c.fillRect(x - 12, y + h + 5, w + 24, 10);
  c.fillStyle = INKA(0.1); c.fillRect(x - 12, y + h + 15, w + 24, 8);
}
function house(c, x0, i) {
  const W = 300, top = 360, base = 800, col = FACADES[i % 6];
  // chimney
  c.fillStyle = shade(col, 0.12); c.fillRect(x0 + 34, 296, 62, 70);
  c.fillStyle = PAL.cream; c.fillRect(x0 + 28, 290, 74, 12);
  c.fillStyle = [PAL.tomato, PAL.navy, PAL.mustard][i % 3];
  for (const k of [0, 1, 2]) { rr(c, x0 + 40 + k * 18, 266, 12, 26, [4, 4, 0, 0]); c.fill(); }
  c.fillStyle = col; c.fillRect(x0, top, W, base - top);
  c.fillStyle = PAL.cream; c.fillRect(x0 - 4, top - 10, W + 8, 22);
  c.fillStyle = INKA(0.1); c.fillRect(x0, top + 12, W, 12);
  c.fillStyle = shade(col, 0.07); c.fillRect(x0 + W - 10, top + 12, 10, base - top - 12);
  c.fillStyle = CREAMA(0.8); c.fillRect(x0, 652, W, 10);
  sash(c, x0 + 52, 412, 76, 96, i * 7 + 1); sash(c, x0 + 172, 412, 76, 96, i * 7 + 2);
  sash(c, x0 + 52, 536, 76, 92, i * 7 + 3); sash(c, x0 + 172, 536, 76, 92, i * 7 + 4);
  // door with fanlight
  const dx = x0 + 44, dw = 88, dc = DOORS[i % 6];
  c.fillStyle = PAL.cream; rr(c, dx - 10, 668, dw + 20, 132, [50, 50, 0, 0]); c.fill();
  c.fillStyle = GLASS; c.beginPath(); c.arc(dx + dw / 2, 712, 44, Math.PI, 0); c.fill();
  c.fillStyle = dc; c.fillRect(dx, 712, dw, 88);
  c.fillStyle = INKA(0.14); rr(c, dx + 12, 724, dw / 2 - 18, 30, 4); c.fill(); rr(c, dx + dw / 2 + 6, 724, dw / 2 - 18, 30, 4); c.fill();
  c.fillStyle = PAL.mustard; circ(c, dx + dw - 14, 760, 5); c.fill();
  c.fillStyle = PAL.cream; c.fillRect(dx - 16, 792, dw + 32, 10);
  // ground floor window
  sash(c, x0 + 168, 690, 92, 76, i * 7 + 5);
}
function phoneBox(c, x) {
  const w = 74, top = 596;
  c.fillStyle = INKA(0.1); c.beginPath(); c.moveTo(x + w, 800); c.lineTo(x + w + 60, 830); c.lineTo(x + 60, 830); c.lineTo(x, 800); c.fill();
  c.fillStyle = PAL.tomato; rr(c, x, top, w, 204, [22, 22, 4, 4]); c.fill();
  c.fillStyle = shade('tomato', 0.18); c.fillRect(x + w - 12, top + 18, 12, 186);
  c.fillStyle = PAL.cream; c.fillRect(x + 10, top + 22, w - 20, 12);
  c.fillStyle = GLASS;
  for (let r = 0; r < 4; r++) for (let k = 0; k < 2; k++) { c.fillRect(x + 12 + k * 26, top + 44 + r * 28, 22, 22); }
  c.fillStyle = shade('tomato', 0.1); c.fillRect(x - 4, 792, w + 8, 10);
}
function lamp(c, x) {
  c.fillStyle = INKA(0.08); c.beginPath(); c.moveTo(x - 6, 806); c.lineTo(x + 6, 806); c.lineTo(x + 140, 842); c.lineTo(x + 128, 842); c.fill();
  c.fillStyle = PAL.navy; c.fillRect(x - 6, 470, 12, 336); rr(c, x - 14, 780, 28, 26, 4); c.fill();
  rr(c, x - 22, 432, 44, 14, 6); c.fill();
  c.fillStyle = tint('mustard', 0.45); c.beginPath(); c.moveTo(x - 16, 446); c.lineTo(x + 16, 446); c.lineTo(x + 11, 476); c.lineTo(x - 11, 476); c.fill();
  c.fillStyle = PAL.navy; c.fillRect(x - 14, 474, 28, 6); circ(c, x, 426, 7); c.fill();
}
function tree(c, x) {
  c.fillStyle = INKA(0.1); c.beginPath(); c.ellipse(x + 60, 812, 120, 14, 0, 0, TAU); c.fill();
  c.fillStyle = shade('navy', 0.1); c.fillRect(x - 9, 600, 18, 210);
  c.fillStyle = PAL.teal; circ(c, x, 540, 105); c.fill(); circ(c, x - 70, 590, 64); c.fill(); circ(c, x + 74, 586, 68); c.fill();
  c.fillStyle = tint('teal', 0.25); circ(c, x - 30, 500, 50); c.fill();
  c.fillStyle = INKA(0.1); c.beginPath(); c.arc(x + 20, 560, 100, -0.2, Math.PI * 0.75); c.fill();
}
export const DOOR = { x: 1685, w: 150, top: 520, base: 800 };
export function drawSchool(c, t, doorOpen) {
  const x0 = 1290, x1 = 2250, top = 236, base = 800, fac = mix('cream', 'mustard', 0.1);
  c.fillStyle = fac; c.fillRect(x0, top, x1 - x0, base - top);
  c.fillStyle = INKA(0.06); c.fillRect(x0, top, 14, base - top);
  c.fillStyle = PAL.mustard; c.fillRect(x0 - 14, top - 18, x1 - x0 + 28, 24);
  c.fillStyle = shade('mustard', 0.15); c.fillRect(x0 - 14, top + 6, x1 - x0 + 28, 8);
  c.fillStyle = INKA(0.08); c.fillRect(x0, top + 14, x1 - x0, 12);
  c.fillStyle = tint('navy', 0.55); c.fillRect(x0, 764, x1 - x0, 36);
  // sign band
  c.fillStyle = INKA(0.12); rr(c, 1396, 290, 760, 90, 20); c.fill();
  c.fillStyle = PAL.navy; rr(c, 1390, 280, 760, 90, 20); c.fill();
  c.fillStyle = PAL.mustard; circ(c, 1428, 325, 9); c.fill(); circ(c, 2112, 325, 9); c.fill();
  c.fillStyle = PAL.cream; c.font = '400 64px "Lilita One"'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.letterSpacing = '6px'; c.fillText('ENGLISH SCHOOL', 1772, 329); c.letterSpacing = '0px';
  // windows (mustard frames)
  const win = (x, y, w, h) => {
    c.fillStyle = PAL.mustard; rr(c, x - 9, y - 9, w + 18, h + 18, 10); c.fill();
    c.fillStyle = GLASS; rr(c, x, y, w, h, 4); c.fill();
    c.fillStyle = CREAMA(0.28); c.beginPath(); c.moveTo(x + w * 0.5, y); c.lineTo(x + w * 0.78, y); c.lineTo(x + w * 0.3, y + h); c.lineTo(x + w * 0.02, y + h); c.fill();
    c.fillStyle = PAL.mustard; c.fillRect(x + w / 2 - 3, y, 6, h); c.fillRect(x, y + h * 0.42, w, 6);
    c.fillStyle = INKA(0.13); c.fillRect(x, y, w, 9);
  };
  for (const x of [1330, 1490, 1930, 2090]) { win(x, 418, 120, 116); win(x, 588, 120, 126); }
  // door surround with arched fanlight
  const D = DOOR, cx = D.x + D.w / 2;
  c.fillStyle = PAL.mustard; c.beginPath(); c.moveTo(D.x - 20, base); c.lineTo(D.x - 20, D.top); c.arc(cx, D.top, D.w / 2 + 20, Math.PI, 0); c.lineTo(D.x + D.w + 20, base); c.fill();
  c.fillStyle = GLASS; c.beginPath(); c.moveTo(D.x, D.top); c.arc(cx, D.top, D.w / 2, Math.PI, 0); c.fill();
  c.strokeStyle = PAL.mustard; c.lineWidth = 6;
  for (const a of [0.25, 0.5, 0.75]) { c.beginPath(); c.moveTo(cx, D.top); c.lineTo(cx - Math.cos(a * Math.PI) * D.w / 2, D.top - Math.sin(a * Math.PI) * D.w / 2); c.stroke(); }
  c.fillRect(D.x, D.top - 4, D.w, 10);
  // interior (visible as the door opens)
  c.fillStyle = shade('navy', 0.45); c.fillRect(D.x, D.top + 6, D.w, base - D.top - 6);
  c.fillStyle = shade('navy', 0.25); c.fillRect(D.x, base - 46, D.w, 46);
  // steps
  c.fillStyle = PAL.cream; c.fillRect(D.x - 40, base - 8, D.w + 80, 14);
  // plant pots
  for (const px of [1612, 1908]) {
    c.fillStyle = shade('teal', 0.2); circ(c, px, 716, 40); c.fill(); circ(c, px - 26, 742, 28); c.fill(); circ(c, px + 26, 742, 28); c.fill();
    c.fillStyle = tint('teal', 0.15); circ(c, px - 12, 704, 18); c.fill();
    c.fillStyle = PAL.navy; c.beginPath(); c.moveTo(px - 34, 752); c.lineTo(px + 34, 752); c.lineTo(px + 26, 800); c.lineTo(px - 26, 800); c.fill();
    c.fillStyle = INKA(0.15); c.fillRect(px - 34, 752, 68, 8);
  }
}
export function drawDoorLeaf(c, open) {
  const D = DOOR, w = D.w * (1 - 0.86 * open);
  const col = mix('teal', 'ink', 0.3 * open);
  c.fillStyle = col; c.fillRect(D.x, D.top + 6, w, D.base - D.top - 6);
  c.fillStyle = INKA(0.14);
  rr(c, D.x + w * 0.14, D.top + 30, w * 0.72, 92, 6); c.fill();
  rr(c, D.x + w * 0.14, D.top + 146, w * 0.72, 100, 6); c.fill();
  c.fillStyle = PAL.mustard; circ(c, D.x + w * 0.84, D.top + 140, 7 * (1 - open * 0.5)); c.fill();
}
export function drawStreetBack(c, t) {
  for (let i = 0; i < 6; i++) house(c, -640 + i * 300, i);
  house(c, 2250, 3); house(c, 2550, 0);
  phoneBox(c, 1196);
  drawSchool(c, t);
}
export function drawGround(c) {
  c.fillStyle = mix('cream', 'navy', 0.13); c.fillRect(-1000, 800, 5000, 106);
  c.fillStyle = INKA(0.1); c.fillRect(-1000, 800, 5000, 12);
  c.strokeStyle = INKA(0.06); c.lineWidth = 3;
  for (let x = -980; x < 4000; x += 150) { c.beginPath(); c.moveTo(x, 812); c.lineTo(x - 30, 904); c.stroke(); }
  c.fillStyle = PAL.cream; c.fillRect(-1000, 904, 5000, 16);
  c.fillStyle = mix('navy', 'cream', 0.42); c.fillRect(-1000, 920, 5000, 600);
  c.fillStyle = INKA(0.1); c.fillRect(-1000, 920, 5000, 10);
  c.fillStyle = CREAMA(0.8);
  for (let x = -980; x < 4000; x += 260) c.fillRect(x, 1074, 130, 14);
}
export function drawStreetProps(c) {
  lamp(c, 1080); tree(c, 160); tree(c, 2420);
}

// red double-decker (generic), x = left edge, moving right
export function drawBus(c, x, t, speed) {
  const L = 880, top = 538, bot = 1034, bob = Math.sin(t * 19) * 1.6 * Math.min(1, speed);
  c.fillStyle = INKA(0.2); c.beginPath(); c.ellipse(x + L / 2, 1062, L * 0.52, 18, 0, 0, TAU); c.fill();
  c.save(); c.translate(0, bob);
  c.fillStyle = PAL.tomato; rr(c, x, top, L, bot - top, [42, 60, 18, 18]); c.fill();
  c.fillStyle = shade('tomato', 0.16); rr(c, x, 960, L, bot - 960, [0, 0, 18, 18]); c.fill();
  c.fillStyle = CREAMA(0.25); rr(c, x + 30, top + 8, L - 80, 10, 5); c.fill();
  // upper windows
  for (let i = 0; i < 6; i++) {
    const wx = x + 34 + i * 128; c.fillStyle = GLASS; rr(c, wx, 576, 110, 84, 12); c.fill();
    c.fillStyle = CREAMA(0.28); c.beginPath(); c.moveTo(wx + 55, 576); c.lineTo(wx + 85, 576); c.lineTo(wx + 40, 660); c.lineTo(wx + 10, 660); c.fill();
  }
  c.fillStyle = GLASS; rr(c, x + L - 88, 576, 70, 84, [12, 30, 12, 12]); c.fill();
  c.fillStyle = PAL.cream; c.fillRect(x, 690, L, 16);
  // lower windows + door
  for (let i = 0; i < 5; i++) {
    const wx = x + 34 + i * 120; c.fillStyle = GLASS; rr(c, wx, 732, 104, 92, 12); c.fill();
    c.fillStyle = CREAMA(0.28); c.beginPath(); c.moveTo(wx + 50, 732); c.lineTo(wx + 78, 732); c.lineTo(wx + 36, 824); c.lineTo(wx + 8, 824); c.fill();
  }
  c.fillStyle = GLASS; rr(c, x + 652, 732, 96, 210, 10); c.fill();
  c.fillStyle = PAL.tomato; c.fillRect(x + 697, 732, 6, 210);
  c.fillStyle = GLASS; rr(c, x + L - 106, 732, 88, 120, [10, 40, 10, 10]); c.fill();
  c.fillStyle = PAL.cream; rr(c, x + L - 92, 548, 64, 20, 8); c.fill();
  c.fillStyle = tint('mustard', 0.2); circ(c, x + L - 26, 970, 14); c.fill();
  c.fillStyle = INKA(0.12); c.fillRect(x + L - 14, top + 40, 14, bot - top - 60);
  // wheels
  for (const wx of [x + 180, x + L - 200]) {
    c.fillStyle = shade('tomato', 0.4); c.beginPath(); c.arc(wx, 1020, 66, Math.PI, 0); c.fill();
    c.fillStyle = PAL.ink; circ(c, wx, 1030, 52); c.fill();
    c.fillStyle = mix('cream', 'navy', 0.25); circ(c, wx, 1030, 22); c.fill();
    c.strokeStyle = PAL.ink; c.lineWidth = 5; const a = -x / 52;
    c.beginPath(); c.moveTo(wx + Math.cos(a) * 18, 1030 + Math.sin(a) * 18); c.lineTo(wx - Math.cos(a) * 18, 1030 - Math.sin(a) * 18); c.stroke();
  }
  c.restore();
}
