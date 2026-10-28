// Film-specific paper art: Youssef and Mia (posable flat actors), London props, lesson cards
import { mulberry, TAU, clamp, lerp } from './lib.js';
import { cv, finishCut, sh, blob, smoothOpen, crescent, INK, rr } from './paper.js';
import { cut, PPM, shadeOf } from './art.js';

const LW = 9, LW2 = 5;
export const AR = '"Baloo Bhaijaan 2", Fredoka';

// ================= Characters =================
// Canvas 800 × 1400; feet at y = 1350, x = 400. Faces turned slightly to the right (flip with scale.x for left).
export const PW = 800, PH = 1400, FOOT = 1350;

const CAST = {
  youssef: { skin: '#c98d62', skinS: '#a9704b', hair: '#2a1f1a', top: '#2f5687', topS: '#22406a', shirt: '#fbf6ea', legs: '#41618f', legsS: '#324c72', shoe: '#5e3e27', cheek: 'rgba(214,92,72,.38)' },
  mia: { skin: '#ffdcbc', skinS: '#f2b994', hair: '#c4552a', hairS: '#9b3f1d', top: '#ffc53d', topS: '#e8a427', shirt: '#45b3a8', legs: '#ffdcbc', legsS: '#f2b994', skirt: '#2f9c91', skirtS: '#237a71', shoe: '#d8423a', cheek: 'rgba(255,110,110,.42)' },
};

function eye(x, ex, ey, p, s = 1) {
  const { blink = 0, eyes = 'open', look = [0, 0] } = p;
  x.lineCap = 'round'; x.strokeStyle = INK;
  if (eyes === 'happy') { x.beginPath(); x.moveTo(ex - 24 * s, ey + 8); x.quadraticCurveTo(ex, ey - 32 * s, ex + 24 * s, ey + 8); x.lineWidth = 11; x.stroke(); return; }
  if (eyes === 'closed' || blink > .85) { x.beginPath(); x.moveTo(ex - 22 * s, ey + 2); x.quadraticCurveTo(ex, ey + 14, ex + 22 * s, ey + 2); x.lineWidth = 10; x.stroke(); return; }
  const big = eyes === 'wide' ? 1.2 : 1, ry = 40 * s * big * (1 - blink * .9), rx = 21 * s * big, lx = ex + look[0] * 9, ly = ey + look[1] * 10;
  x.beginPath(); x.ellipse(lx, ly, rx, ry, 0, 0, TAU); x.fillStyle = INK; x.fill();
  if (ry > 14) {
    x.beginPath(); x.ellipse(lx - 7, ly - ry * .42, 7.5 * big, 12 * big, -.2, 0, TAU); x.fillStyle = '#fff'; x.fill();
    x.beginPath(); x.ellipse(lx + 6, ly + ry * .45, 4, 5.5, 0, 0, TAU); x.fill();
  }
}
function brow(x, bx, by, kind, side) {
  x.beginPath(); x.lineCap = 'round'; x.strokeStyle = INK; x.lineWidth = 11;
  const t = kind === 'up' ? -14 : kind === 'worried' ? 10 * side : kind === 'down' ? -10 * side : 0;
  const lift = kind === 'up' ? -14 : 0;
  x.moveTo(bx - 26, by + lift + t); x.quadraticCurveTo(bx, by - 10 + lift, bx + 26, by + lift - t); x.stroke();
}
function mouth(x, mx, my, kind) {
  x.lineCap = 'round'; x.strokeStyle = INK;
  if (kind === 'smile') { x.beginPath(); x.moveTo(mx - 28, my - 4); x.quadraticCurveTo(mx, my + 24, mx + 28, my - 4); x.lineWidth = 9; x.stroke(); }
  else if (kind === 'open' || kind === 'grin' || kind === 'talk') {
    const h = kind === 'talk' ? 28 : kind === 'grin' ? 34 : 44, w = kind === 'talk' ? 26 : 36;
    x.beginPath(); x.moveTo(mx - w, my - 8); x.quadraticCurveTo(mx, my + h * 1.5, mx + w, my - 8); x.closePath(); sh(x, '#8a2a2a', 7);
    x.save(); x.clip(); x.beginPath(); x.ellipse(mx, my + h * .85, w * .62, h * .4, 0, 0, TAU); x.fillStyle = '#ef6f6f'; x.fill(); x.restore();
  }
  else if (kind === 'o') { x.beginPath(); x.ellipse(mx, my + 6, 13, 17, 0, 0, TAU); sh(x, '#8a2a2a', 7); }
  else if (kind === 'flat') { x.beginPath(); x.moveTo(mx - 22, my + 4); x.lineTo(mx + 22, my + 2); x.lineWidth = 9; x.stroke(); }
  else if (kind === 'worried') { x.beginPath(); x.moveTo(mx - 28, my + 10); x.bezierCurveTo(mx - 12, my - 4, mx - 2, my + 14, mx + 10, my + 2); x.quadraticCurveTo(mx + 20, my - 6, mx + 28, my + 8); x.lineWidth = 8; x.stroke(); }
}
function arm(x, sx, sy, ang, col, colS, skin, len = 270) {
  x.save(); x.translate(sx, sy); x.rotate(ang);
  rr(x, -27, -14, 54, len, 26); sh(x, col, LW2 + 1);
  x.beginPath(); x.moveTo(-14, 30); x.lineTo(-14, len - 40); x.lineWidth = 6; x.strokeStyle = colS; x.stroke();
  x.beginPath(); x.arc(0, len + 6, 30, 0, TAU); sh(x, skin, LW2 + 1);
  x.restore();
}
function leg(x, hx, hy, ang, lift, col, shoe, len = 240) {
  x.save(); x.translate(hx, hy); x.rotate(ang);
  rr(x, -30, -10, 60, len - lift, 24); sh(x, col, LW2 + 1);
  blob(x, 14, len - lift + 6, 52, 30, .03, 5); sh(x, shoe, LW2 + 2);
  x.beginPath(); x.ellipse(26, len - lift - 4, 16, 7, -.2, 0, TAU); x.fillStyle = 'rgba(255,255,255,.3)'; x.fill();
  x.restore();
}

// pose: {walk, stride, armL, armR, eyes, mouth, brows, blink, look:[x,y], blush, sweat, lean}
export function drawPerson(who, x, p = {}) {
  const C = CAST[who], { walk = 0, stride = 0, armL = .12, armR = .12, lean = 0 } = p;
  x.clearRect(0, 0, PW, PH);
  const W = cv(PW, PH), a = W.getContext('2d');
  a.save(); a.translate(400, FOOT); a.rotate(lean); a.translate(-400, -FOOT);
  const s = Math.sin(walk) * stride;
  // legs (behind the body)
  const hipY = 1010;
  if (who === 'mia') { leg(a, 360, hipY, s * .45, Math.max(0, -Math.sin(walk)) * stride * 18, C.legs, C.shoe, 250); leg(a, 440, hipY, -s * .45, Math.max(0, Math.sin(walk)) * stride * 18, C.legs, C.shoe, 250); }
  else { leg(a, 360, hipY, s * .45, Math.max(0, -Math.sin(walk)) * stride * 18, C.legs, C.shoe, 250); leg(a, 440, hipY, -s * .45, Math.max(0, Math.sin(walk)) * stride * 18, C.legs, C.shoe, 250); }
  // body
  if (who === 'youssef') {
    const shirt = () => { a.beginPath(); a.moveTo(330, 640); a.lineTo(470, 640); a.lineTo(476, 1030); a.lineTo(324, 1030); a.closePath(); };
    shirt(); sh(a, C.shirt, LW2);
    const jacket = (side) => { a.beginPath(); if (side < 0) { a.moveTo(300, 620); a.quadraticCurveTo(270, 820, 282, 1040); a.lineTo(380, 1040); a.lineTo(360, 660); } else { a.moveTo(500, 620); a.quadraticCurveTo(530, 820, 518, 1040); a.lineTo(420, 1040); a.lineTo(440, 660); } a.closePath(); };
    crescent(a, () => jacket(-1), C.topS, 18, 0, C.top); jacket(-1); sh(a, null, LW);
    crescent(a, () => jacket(1), C.topS, 18, 0, C.top); jacket(1); sh(a, null, LW);
    a.beginPath(); a.arc(372, 820, 9, 0, TAU); a.arc(372, 920, 9, 0, TAU); a.fillStyle = '#c9b48a'; a.fill();
    // belt
    rr(a, 300, 1018, 200, 30, 10); sh(a, C.legsS, LW2);
  } else {
    const skirt = () => { a.beginPath(); a.moveTo(330, 900); a.bezierCurveTo(300, 960, 270, 1030, 262, 1080); a.quadraticCurveTo(400, 1110, 538, 1080); a.bezierCurveTo(530, 1030, 500, 960, 470, 900); a.closePath(); };
    crescent(a, skirt, C.skirtS, 22, 0, C.skirt); skirt(); sh(a, null, LW);
    const top = () => { a.beginPath(); a.moveTo(318, 640); a.quadraticCurveTo(300, 800, 320, 930); a.lineTo(480, 930); a.quadraticCurveTo(500, 800, 482, 640); a.closePath(); };
    crescent(a, top, C.topS, 20, 0, C.top); top(); sh(a, null, LW);
    a.beginPath(); a.moveTo(400, 650); a.lineTo(400, 925); a.lineWidth = 5; a.strokeStyle = C.topS; a.stroke();
    for (const by of [720, 800, 870]) { a.beginPath(); a.arc(400, by, 9, 0, TAU); a.fillStyle = '#fff4d6'; a.fill(); }
    a.beginPath(); a.moveTo(360, 645); a.lineTo(400, 700); a.lineTo(440, 645); a.closePath(); sh(a, C.shirt, LW2);
  }
  // arms
  arm(a, 318, 660, armL, C.top, C.topS, C.skin);
  arm(a, 482, 660, -armR, C.top, C.topS, C.skin);
  // neck
  rr(a, 370, 560, 60, 90, 20); sh(a, C.skinS, LW2);
  // hair behind (Mia: ponytail)
  if (who === 'mia') {
    const tail = () => { a.beginPath(); a.moveTo(190, 300); a.bezierCurveTo(70, 380, 90, 560, 150, 640); a.bezierCurveTo(170, 560, 200, 470, 250, 400); a.closePath(); };
    crescent(a, tail, C.hairS, 20, 0, C.hair); tail(); sh(a, null, LW);
    a.beginPath(); a.ellipse(222, 330, 30, 22, -.6, 0, TAU); sh(a, '#3fb0a8', LW2);
  }
  // head
  const head = () => { a.beginPath(); a.ellipse(400, 360, 210, 200, 0, 0, TAU); };
  crescent(a, head, C.skinS, 30, 22, C.skin); head(); sh(a, null, LW + 1);
  // ear
  a.beginPath(); a.ellipse(212, 380, 30, 42, 0, 0, TAU); sh(a, C.skin, LW2 + 1);
  const fx = 24;
  // hair front
  if (who === 'youssef') {
    const hair = () => { a.beginPath(); a.moveTo(196, 380); a.bezierCurveTo(170, 230, 260, 140, 400, 140); a.bezierCurveTo(540, 138, 630, 220, 606, 360); a.bezierCurveTo(590, 300, 560, 262, 520, 250); a.bezierCurveTo(470, 280, 380, 280, 300, 262); a.bezierCurveTo(262, 290, 240, 330, 236, 392); a.closePath(); };
    crescent(a, hair, '#15100d', 20, 22, C.hair); hair(); sh(a, null, LW + 1);
    a.strokeStyle = '#4a3a30'; a.lineWidth = 6; a.lineCap = 'round';
    for (const [x0, y0, x1, y1] of [[300, 190, 360, 170], [420, 175, 480, 190], [520, 210, 560, 250]]) { a.beginPath(); a.moveTo(x0, y0); a.quadraticCurveTo((x0 + x1) / 2, y0 - 18, x1, y1); a.stroke(); }
    // short beard along the jaw
    const beard = () => { a.beginPath(); a.moveTo(232, 420); a.bezierCurveTo(250, 560, 330, 590, 420, 590); a.bezierCurveTo(510, 590, 580, 540, 600, 420); a.bezierCurveTo(570, 480, 530, 520, 470, 520); a.quadraticCurveTo(424, 498, 380, 520); a.bezierCurveTo(320, 520, 262, 486, 232, 420); a.closePath(); };
    a.save(); beard(); a.fillStyle = 'rgba(42,31,26,.88)'; a.fill(); a.restore(); beard(); sh(a, null, LW2 + 1);
  } else {
    const hair = () => { a.beginPath(); a.moveTo(194, 400); a.bezierCurveTo(170, 220, 280, 150, 410, 150); a.bezierCurveTo(560, 150, 640, 250, 610, 420); a.bezierCurveTo(600, 330, 560, 280, 500, 262); a.bezierCurveTo(470, 300, 400, 320, 330, 300); a.bezierCurveTo(290, 330, 250, 360, 238, 420); a.closePath(); };
    crescent(a, hair, C.hairS, 20, 22, C.hair); hair(); sh(a, null, LW + 1);
    a.strokeStyle = C.hairS; a.lineWidth = 6; a.lineCap = 'round';
    for (const [x0, y0, x1, y1] of [[290, 200, 350, 175], [440, 180, 500, 200], [540, 225, 580, 280]]) { a.beginPath(); a.moveTo(x0, y0); a.quadraticCurveTo((x0 + x1) / 2, y0 - 16, x1, y1); a.stroke(); }
  }
  // face
  const cheek = p.blush ? 'rgba(232,70,60,.55)' : C.cheek, cr = p.blush ? 1.35 : 1;
  a.beginPath(); a.ellipse(400 + fx - 110, 450, 34 * cr, 20 * cr, 0, 0, TAU); a.fillStyle = cheek; a.fill();
  a.beginPath(); a.ellipse(400 + fx + 118, 450, 34 * cr, 20 * cr, 0, 0, TAU); a.fill();
  eye(a, 400 + fx - 62, 380, p); eye(a, 400 + fx + 70, 380, p);
  const bk = p.brows || 'normal';
  brow(a, 400 + fx - 62, 312, bk, -1); brow(a, 400 + fx + 70, 312, bk, 1);
  mouth(a, 400 + fx + 6, who === 'youssef' ? 478 : 470, p.mouth || 'smile');
  if (p.sweat) { a.beginPath(); a.moveTo(590, 250); a.quadraticCurveTo(620, 300, 606, 320); a.quadraticCurveTo(580, 330, 576, 300); a.closePath(); sh(a, '#bfe8ff', LW2); }
  a.restore();
  x.drawImage(finishCut(W, 16, { grainA: .7 }), 0, 0);
}

// ================= Props: London =================
const BRICK = ['#d9776a', '#e0a35e', '#9fc3e0', '#e88fa0'];
export function terrace(wm, hm, col, seed, o = {}) {
  return cut(wm, hm, (x, W, H) => {
    const R = mulberry(seed), shade = shadeOf(col);
    // roof
    const roof = () => { x.beginPath(); x.moveTo(-6, H * .2); x.lineTo(W * .08, H * .07); x.lineTo(W * .92, H * .07); x.lineTo(W + 6, H * .2); x.closePath(); };
    crescent(x, roof, '#4a4e63', 0, -14, '#646a83'); roof(); sh(x, null, LW);
    rr(x, W * .7, -H * .02, W * .1, H * .12, 6); sh(x, '#b3554a', LW2);
    const wall = () => { x.beginPath(); x.rect(0, H * .19, W, H * .81); };
    crescent(x, wall, shade, 26, 0, col); wall(); sh(x, null, LW);
    // brick dashes
    x.strokeStyle = shade; x.lineWidth = 4; x.lineCap = 'round';
    for (let i = 0; i < 26; i++) { const px = W * (.05 + R() * .9), py = H * (.24 + R() * .7); x.beginPath(); x.moveTo(px, py); x.lineTo(px + 26, py); x.stroke(); }
    // windows: two floors
    const win = (wx, wy, ww, wh) => { rr(x, wx - 8, wy - 8, ww + 16, wh + 16, 8); sh(x, '#fffaf0', LW2); rr(x, wx, wy, ww, wh, 4); sh(x, '#bfe3f2', LW2); x.beginPath(); x.moveTo(wx + ww / 2, wy); x.lineTo(wx + ww / 2, wy + wh); x.moveTo(wx, wy + wh / 2); x.lineTo(wx + ww, wy + wh / 2); x.lineWidth = 5; x.strokeStyle = '#fffaf0'; x.stroke(); x.beginPath(); x.moveTo(wx + 6, wy + wh * .8); x.lineTo(wx + ww * .3, wy + 8); x.lineWidth = 5; x.strokeStyle = 'rgba(255,255,255,.7)'; x.stroke(); };
    const n = o.n || 2, ww = W * .22, wh = H * .18;
    for (let i = 0; i < n; i++) { const cx = W * (i + .5) / n; win(cx - ww / 2, H * .28, ww, wh); }
    win(W * .14, H * .6, ww, wh);
    // door
    const dx = W * .62, dw = W * .2; x.beginPath(); x.moveTo(dx, H); x.lineTo(dx, H * .66); x.arc(dx + dw / 2, H * .66, dw / 2, Math.PI, 0); x.lineTo(dx + dw, H); x.closePath(); sh(x, o.door || '#2f5687', LW2 + 1);
    x.beginPath(); x.arc(dx + dw * .75, H * .82, 7, 0, TAU); x.fillStyle = '#ffd23f'; x.fill();
  });
}
export function clockTower(hm) {
  return cut(hm * .3, hm, (x, W, H) => {
    const body = () => { x.beginPath(); x.moveTo(W * .16, H); x.lineTo(W * .2, H * .3); x.lineTo(W * .8, H * .3); x.lineTo(W * .84, H); x.closePath(); };
    crescent(x, body, '#c9a865', 22, 0, '#e8cc8a'); body(); sh(x, null, LW);
    x.strokeStyle = '#b8955a'; x.lineWidth = 5; for (let i = 0; i < 9; i++) { x.beginPath(); x.moveTo(W * .26, H * (.42 + i * .065)); x.lineTo(W * .74, H * (.42 + i * .065)); x.stroke(); }
    const top = () => { x.beginPath(); x.moveTo(W * .12, H * .31); x.lineTo(W * .12, H * .17); x.lineTo(W * .88, H * .17); x.lineTo(W * .88, H * .31); x.closePath(); };
    crescent(x, top, '#c9a865', 18, 0, '#e8cc8a'); top(); sh(x, null, LW);
    x.beginPath(); x.moveTo(W * .1, H * .17); x.lineTo(W * .5, 0); x.lineTo(W * .9, H * .17); x.closePath(); sh(x, '#4f6b5a', LW);
    x.beginPath(); x.arc(W * .5, H * .24, W * .24, 0, TAU); sh(x, '#fffaf0', LW2 + 1);
    x.lineCap = 'round'; x.strokeStyle = INK; x.lineWidth = 7; x.beginPath(); x.moveTo(W * .5, H * .24); x.lineTo(W * .5, H * .24 - W * .17); x.moveTo(W * .5, H * .24); x.lineTo(W * .5 + W * .12, H * .24 + W * .05); x.stroke();
  });
}
export function phoneBox(hm) {
  return cut(hm * .42, hm, (x, W, H) => {
    const b = () => { x.beginPath(); x.rect(W * .06, H * .1, W * .88, H * .9); };
    crescent(x, b, '#b8302a', 22, 0, '#e8413a'); b(); sh(x, null, LW);
    x.beginPath(); x.moveTo(W * .02, H * .12); x.quadraticCurveTo(W * .5, -H * .02, W * .98, H * .12); x.closePath(); sh(x, '#e8413a', LW);
    rr(x, W * .14, H * .15, W * .72, H * .07, 4); sh(x, '#2a1f1a', LW2);
    x.font = `700 ${Math.round(W * .1)}px Fredoka`; x.fillStyle = '#fffaf0'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('TELEPHONE', W * .5, H * .187);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) { rr(x, W * (.17 + c * .23), H * (.27 + r * .11), W * .2, H * .09, 3); sh(x, '#d6eef7', 4); }
    rr(x, W * .14, H * .74, W * .72, H * .22, 4); sh(x, '#d23a33', LW2);
  });
}
export function lampPost(hm) {
  return cut(hm * .26, hm, (x, W, H) => {
    rr(x, W * .42, H * .18, W * .16, H * .82, 6); sh(x, '#3f4a5c', LW2 + 1);
    rr(x, W * .3, H * .9, W * .4, H * .1, 6); sh(x, '#3f4a5c', LW2 + 1);
    x.beginPath(); x.moveTo(W * .2, H * .2); x.lineTo(W * .28, H * .04); x.lineTo(W * .72, H * .04); x.lineTo(W * .8, H * .2); x.closePath(); sh(x, '#ffe9a8', LW2 + 1);
    x.beginPath(); x.moveTo(W * .2, H * .04); x.lineTo(W * .5, -H * .02); x.lineTo(W * .8, H * .04); x.closePath(); sh(x, '#3f4a5c', LW2);
  });
}
export function bus(wm) {
  return cut(wm, wm * .62, (x, W, H) => {
    const b = () => { rr(x, 0, H * .02, W, H * .86, 30); };
    crescent(x, b, '#b8302a', 0, -24, '#e8413a'); b(); sh(x, null, LW);
    const row = (y, h) => { for (let i = 0; i < 5; i++) { rr(x, W * (.06 + i * .175), y, W * .15, h, 10); sh(x, '#d6eef7', LW2); x.beginPath(); x.moveTo(W * (.08 + i * .175), y + h * .8); x.lineTo(W * (.12 + i * .175), y + 8); x.lineWidth = 5; x.strokeStyle = 'rgba(255,255,255,.75)'; x.stroke(); } };
    row(H * .1, H * .22); row(H * .44, H * .22);
    rr(x, W * .02, H * .37, W * .96, H * .03, 4); x.fillStyle = '#fff2c4'; x.fill();
    rr(x, W * .32, H * .7, W * .36, H * .08, 6); sh(x, '#2a1f1a', LW2);
    x.font = `700 ${Math.round(H * .055)}px Fredoka`; x.fillStyle = '#ffd23f'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('CITY CENTRE', W * .5, H * .742);
    for (const u of [.2, .8]) { x.beginPath(); x.arc(W * u, H * .88, H * .1, 0, TAU); sh(x, '#2a2a33', LW); x.beginPath(); x.arc(W * u, H * .88, H * .045, 0, TAU); sh(x, '#c9c9d4', LW2); }
  });
}
export function school(wm, hm) {
  return cut(wm, hm, (x, W, H) => {
    const wall = () => { x.beginPath(); x.rect(0, H * .16, W, H * .84); };
    crescent(x, wall, '#e4cfa4', 30, 0, '#f6e4bd'); wall(); sh(x, null, LW);
    const roof = () => { x.beginPath(); x.moveTo(-10, H * .17); x.lineTo(W * .5, 0); x.lineTo(W + 10, H * .17); x.closePath(); };
    crescent(x, roof, '#9b3f2f', 0, -16, '#c8553f'); roof(); sh(x, null, LW);
    x.beginPath(); x.arc(W * .5, H * .1, W * .045, 0, TAU); sh(x, '#fffaf0', LW2); x.beginPath(); x.moveTo(W * .5, H * .1); x.lineTo(W * .5, H * .075); x.moveTo(W * .5, H * .1); x.lineTo(W * .52, H * .105); x.lineWidth = 4; x.strokeStyle = INK; x.stroke();
    // sign board
    rr(x, W * .14, H * .21, W * .72, H * .13, 12); sh(x, '#2f9c91', LW2 + 1);
    x.font = `700 ${Math.round(H * .075)}px Fredoka`; x.fillStyle = '#fffaf0'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('ENGLISH SCHOOL', W * .5, H * .277);
    // windows
    for (const u of [.12, .7]) for (const v of [.42, .66]) { rr(x, W * u, H * v, W * .18, H * .16, 6); sh(x, '#bfe3f2', LW2); x.beginPath(); x.moveTo(W * (u + .09), H * v); x.lineTo(W * (u + .09), H * (v + .16)); x.lineWidth = 5; x.strokeStyle = '#fffaf0'; x.stroke(); }
    // doorway (dark; the door is its own hinged piece)
    x.beginPath(); x.moveTo(W * .37, H); x.lineTo(W * .37, H * .58); x.arc(W * .5, H * .58, W * .13, Math.PI, 0); x.lineTo(W * .63, H); x.closePath(); sh(x, '#3b2418', LW2);
    rr(x, W * .33, H * .965, W * .34, H * .035, 4); sh(x, '#cdb88f', LW2);
  });
}
export function schoolDoor(hm) {
  return cut(hm * .62, hm, (x, W, H) => {
    x.beginPath(); x.moveTo(0, H); x.lineTo(0, W / 2); x.arc(W / 2, W / 2, W / 2, Math.PI, 0); x.lineTo(W, H); x.closePath(); sh(x, '#2f9c91', LW2 + 1);
    rr(x, W * .18, H * .3, W * .64, H * .26, 6); sh(x, '#bfe3f2', LW2);
    x.beginPath(); x.arc(W * .82, H * .66, 11, 0, TAU); sh(x, '#ffd23f', 4);
  }, { border: 8, ay: 1 });
}
export function suitcase(wm) {
  return cut(wm, wm * .9, (x, W, H) => {
    rr(x, W * .32, 0, W * .36, H * .2, 14); x.lineWidth = 16; x.strokeStyle = INK; x.stroke(); x.lineWidth = 8; x.strokeStyle = '#6b4a2f'; x.stroke();
    const b = () => { rr(x, 0, H * .16, W, H * .76, 26); };
    crescent(x, b, '#b8302a', 22, 0, '#e8513f'); b(); sh(x, null, LW);
    for (const u of [.28, .72]) { x.beginPath(); x.moveTo(W * u, H * .17); x.lineTo(W * u, H * .91); x.lineWidth = 8; x.strokeStyle = '#a82a22'; x.stroke(); }
    rr(x, W * .52, H * .3, W * .3, H * .18, 6); sh(x, '#fffaf0', 4);
    for (const u of [.14, .86]) { x.beginPath(); x.arc(W * u, H * .95, H * .06, 0, TAU); sh(x, '#2a2a33', 4); }
  }, { border: 10 });
}
export function hedge(wm, hm, seed) {
  return cut(wm, hm, (x, W, H) => {
    const R = mulberry(seed), n = Math.max(3, Math.round(W / 90));
    const p = () => { x.beginPath(); x.moveTo(0, H); for (let i = 0; i < n; i++) { const cx = W * (i + .5) / n, r = W / n * .62; x.arc(cx, H * .42 + (i % 2) * 10, r, Math.PI, 0); } x.lineTo(W, H); x.closePath(); };
    crescent(x, p, '#3f8f3c', 20, 20, '#59b04f'); p(); sh(x, null, LW);
    for (let i = 0; i < n * 2; i++) { x.beginPath(); x.arc(W * (.08 + R() * .84), H * (.4 + R() * .45), 10, 0, TAU); x.fillStyle = ['#ff9ec1', '#fffaf0', '#ffd23f'][i % 3]; x.fill(); }
  });
}

// ================= Lesson cards =================
// A phrase card on a stick: English big, Arabic meaning small
// wm × cardHm card on a stick of stickM; en may hold several lines ('\n'); a small number badge in the corner
export function phraseCard(wm, cardHm, stickM, en, ar, col, num) {
  return cut(wm, cardHm + stickM, (x, W, H) => {
    const ch = cardHm * PPM;
    if (stickM > 0) { rr(x, W / 2 - 16, ch - 20, 32, H - ch + 20, 8); sh(x, '#a8733f', LW2 + 1); }
    const card = () => { rr(x, 0, 0, W, ch, 34); };
    crescent(x, card, shadeOf(col), 0, -18, col); card(); sh(x, null, LW);
    rr(x, 18, 18, W - 36, ch - 36, 22); x.lineWidth = 4; x.strokeStyle = 'rgba(255,255,255,.55)'; x.stroke();
    x.textAlign = 'center'; x.textBaseline = 'middle';
    const lines = en.split('\n'), n = lines.length;
    let s = Math.round(ch * (n > 1 ? .22 : .3)); x.font = `700 ${s}px Fredoka`;
    while (Math.max(...lines.map(l => x.measureText(l).width)) > W * .84 && s > 20) { s -= 3; x.font = `700 ${s}px Fredoka`; }
    const top = ar ? ch * .14 : ch * .18, bot = ar ? ch * .62 : ch * .82, step = (bot - top) / n;
    x.lineJoin = 'round';
    lines.forEach((l, i) => { const y = top + step * (i + .5); x.lineWidth = 10; x.strokeStyle = 'rgba(255,255,255,.9)'; x.strokeText(l, W / 2, y); x.fillStyle = '#2a1c16'; x.fillText(l, W / 2, y); });
    if (ar) { x.direction = 'rtl'; let a = Math.round(ch * .17); x.font = `700 ${a}px ${AR}`; while (x.measureText(ar).width > W * .84 && a > 16) { a -= 2; x.font = `700 ${a}px ${AR}`; } x.fillStyle = '#5a3a2a'; x.fillText(ar, W / 2, ch * .8); x.direction = 'ltr'; }
    if (num) { x.beginPath(); x.arc(46, 46, 30, 0, TAU); sh(x, '#fffaf0', LW2); x.font = '700 36px Fredoka'; x.fillStyle = '#2a1c16'; x.fillText(String(num), 46, 48); }
  }, { border: 12 });
}
// Crumpled paper ball (3D prop)
export function ballItem(rm, seed = 3) {
  return cut(rm * 2, rm * 2, (x, W, H) => {
    const R = mulberry(seed), P = [], r = W * .46;
    for (let i = 0; i < 15; i++) { const a = i / 15 * TAU + (R() - .5) * .25, q = r * (.8 + R() * .22); P.push([W / 2 + Math.cos(a) * q, H / 2 + Math.sin(a) * q]); }
    const body = () => { x.beginPath(); P.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); };
    body(); x.fillStyle = '#f2eee4'; x.fill(); x.save(); body(); x.clip();
    for (let i = 0; i < P.length; i++) { const q = P[(i + 1) % P.length]; x.beginPath(); x.moveTo(W / 2 + (R() - .5) * r * .6, H / 2 + (R() - .5) * r * .6); x.lineTo(P[i][0], P[i][1]); x.lineTo(q[0], q[1]); x.closePath(); const g = 205 + R() * 45; x.fillStyle = `rgb(${g | 0},${(g - 5) | 0},${(g - 16) | 0})`; x.fill(); }
    x.strokeStyle = 'rgba(110,150,210,.4)'; x.lineWidth = 6; for (let k = 0; k < 5; k++) { x.beginPath(); x.moveTo(0, H * (.25 + k * .13)); x.lineTo(W, H * (.2 + k * .14)); x.stroke(); }
    x.restore(); body(); sh(x, null, LW);
  }, { ay: 1 });
}
// A word tile (no stick); for the sentence workshop
export function wordTile(text, hm, col, o = {}) {
  const font = o.ar ? `700 200px ${AR}` : '700 200px Fredoka';
  const m = cv(10, 10).getContext('2d'); m.font = font; const tw = m.measureText(text).width / 200 * (hm * PPM * .55);
  const wm = Math.max(hm * .9, tw / PPM + hm * .55);
  return cut(wm, hm, (x, W, H) => {
    const card = () => { rr(x, 0, 0, W, H, 26); };
    crescent(x, card, shadeOf(col), 0, -14, col); card(); sh(x, null, LW);
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = font.replace('200px', Math.round(H * .55) + 'px');
    if (o.ar) x.direction = 'rtl';
    x.fillStyle = o.ink || '#2a1c16'; x.fillText(text, W / 2, H * (o.ar ? .56 : .52));
  }, { border: 10, ay: 1 - 30 / (Math.ceil(hm * PPM) + 60) });
}
// The pull-tab strip that carries a word in from the right edge
export function pullTab(wm, hm) {
  return cut(wm, hm, (x, W, H) => {
    rr(x, 0, H * .25, W, H * .5, 16); sh(x, '#fff3dc', LW2 + 1);
    x.beginPath(); x.moveTo(W - 10, H * .1); x.lineTo(W + 0, H * .5); x.lineTo(W - 10, H * .9); x.lineTo(W - 70, H * .9); x.lineTo(W - 70, H * .1); x.closePath(); sh(x, '#e8413a', LW2 + 1);
    x.font = `700 ${Math.round(H * .4)}px Fredoka`; x.fillStyle = '#fffaf0'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('PULL', W - 40, H * .52);
  }, { border: 8, ay: .5 });
}
// Bunting string for the board spread backdrop (drawn into the page, not a cut)
export function bunting(x, x0, y0, x1, y1, n, cols) {
  x.strokeStyle = '#6b5a4a'; x.lineWidth = 5; x.beginPath(); x.moveTo(x0, y0); x.quadraticCurveTo((x0 + x1) / 2, Math.max(y0, y1) + 70, x1, y1); x.stroke();
  for (let i = 0; i < n; i++) {
    const u = (i + .5) / n, px = lerp(x0, x1, u), py = lerp(y0, y1, u) + 4 * 70 * u * (1 - u) * .5 + 6;
    x.beginPath(); x.moveTo(px - 34, py); x.lineTo(px + 34, py); x.lineTo(px, py + 70); x.closePath(); sh(x, cols[i % cols.length], 5);
  }
}
