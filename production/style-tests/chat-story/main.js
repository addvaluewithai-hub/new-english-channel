// "Youssef's Phone" — chat-story style test. Deterministic render(t), Canvas2D, 1920x1080.
import { clamp, lerp, seg, ss, eio, eo, back, track } from '/core/lib.js';

const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const FW = 1920, FH = 1080;
window.DUR = 17;

// ---------- palette (STYLE.md tokens) ----------
const C = {
  roomDiary: '#F3EADF', roomMeet: '#E2EEEA', roomBlush: '#F5E1DE',
  ink: '#1E2433', sub: '#8A8F9C', ghost: '#B9BDC6', paper: '#FBFAF7', panel: '#F1EEE8', body: '#1C202B',
  you: '#24375F', youLite: '#2F4675', suitcase: '#E2493F', teal: '#17A096', tealTint: '#D9EEE9',
  navyTint: '#E1E5EE', mustard: '#E8B13A', auburn: '#B4532C', blush: '#F2898A',
};
const LAT = 'Inter', AR = 'PlexAr';
const font = (w, s, f = LAT) => `${w} ${s}px ${f === AR ? '"PlexAr"' : f}`;

// ---------- helpers ----------
const hex = h => Array.isArray(h) ? h : [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mixA = (a, b, k) => { const A = hex(a), B = hex(b); return A.map((v, i) => Math.round(lerp(v, B[i], k))); };
const mix = (a, b, k) => `rgb(${mixA(a, b, k).join(',')})`;
const rr = (x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };
const pop = (t, t0, d = 0.18, from = 0.94) => lerp(from, 1, back(seg(t, t0, t0 + d), 2.2));

// ---------- timing ----------
const NARR_ON = [[0.9, 2.3], [2.8, 5.35], [6.1, 7.35]];
const PARAS = [
  { g: 0.95, w: [['أول', 0.9], ['يوم', 1.2], ['ليّا', 1.4], ['في', 1.6], ['لندن…', 1.7]] },
  { g: 2.45, w: [['وكنت', 2.8], ['فاكر', 3.7], ['إن', 4.1], ['الإنجليزي', 4.2], ['بتاعي', 4.6, 1], ['كويس.', 4.8]] },
  { g: 5.55, w: [['لحد', 6.1], ['ما', 6.5], ['قابلت', 6.6], ['ميا.', 7.0]] },
];
const TALK = [[8.2, 8.64, 'mia'], [8.7, 8.84, 'mia'], [8.8, 9.24, 'mia'], [10.1, 10.54, 'youssef'], [11.4, 11.74, 'youssef'],
  [12.5, 12.84, 'youssef'], [12.8, 13.34, 'youssef'], [15.02, 15.32, 'mia']];
// bubble states: [time, words shown, typing dots]
const BUB = {
  mia1: { who: 'mia', words: ['Hi!', "I'm", 'Mia.'], y: 132, st: [[7.98, 0, 1], [8.2, 1, 1], [8.7, 2, 1], [8.84, 3, 1], [9.25, 3, 0]] },
  you1: { who: 'youssef', words: ['Hello!', 'I...', 'I', 'Youssef.'], y: 222, st: [[9.85, 0, 1], [10.1, 1, 1], [11.4, 2, 1], [12.5, 3, 1], [12.82, 4, 1], [13.36, 4, 0]] },
  mia2: { who: 'mia', words: ['Sorry?'], y: 346, st: [[14.55, 0, 1], [15.02, 1, 1], [15.34, 1, 0]] },
};
// typing indicators that stall (hesitation): dots freeze inside these windows
const STALL = [[10.7, 11.2], [11.95, 12.35]];

const talkLevel = (t, who) => {
  let v = 0;
  for (const [a, b, w] of TALK) if (w === who && t > a - 0.05 && t < b + 0.08) {
    const e = Math.min(seg(t, a - 0.05, a + 0.04), 1 - seg(t, b - 0.02, b + 0.08));
    v = Math.max(v, e * (0.45 + 0.55 * Math.abs(Math.sin((t - a) * 17.5 + (who === 'mia' ? 1 : 0)))));
  }
  return v;
};
const narrLevel = t => { let v = 0; for (const [a, b] of NARR_ON) v = Math.max(v, Math.min(seg(t, a - 0.1, a + 0.05), 1 - seg(t, b - 0.05, b + 0.15))); return v; };

// ---------- camera ----------
// world: phone centre at (0,0). portrait local p -> world p-(250,520); landscape L -> world L-(520,250)
const CAM = track([
  [0.0, [0, 34, 0.74]], [1.1, [0, 24, 0.82]], [3.0, [0, 34, 0.95]], [6.9, [0, 62, 1.2]], [7.32, [0, 58, 1.2]],
  [7.7, [0, 0, 1.06]], [8.35, [0, 6, 1.6]], [9.8, [6, 6, 1.62]], [13.4, [40, 6, 1.68]], [14.25, [0, 6, 1.62]],
  [15.3, [0, 6, 1.62]], [16.1, [312, 4, 2.36]], [17.0, [324, 4, 2.42]],
]);
const phoneRot = t => -Math.PI / 2 * eio(seg(t, 7.35, 7.95));

// ---------- room ----------
function room(t) {
  const k1 = ss(seg(t, 7.2, 8.2)), k2 = ss(seg(t, 15.3, 16.2));
  const base = mix(mixA(C.roomDiary, C.roomMeet, k1), C.roomBlush, k2);
  ctx.fillStyle = base; ctx.fillRect(0, 0, FW, FH);
  const g = ctx.createLinearGradient(0, 0, 0, FH);
  g.addColorStop(0, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(0,0,0,0.035)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, FW, FH);
  // two big soft discs, slow parallax
  const cam = CAM(t);
  const disc = (x, y, r, col, a) => {
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, col.replace('A', a)); rg.addColorStop(1, col.replace('A', 0));
    ctx.fillStyle = rg; ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
  };
  disc(300 - cam[0] * 0.15, 220 - cam[1] * 0.1, 620, 'rgba(255,255,255,A)', 0.55);
  disc(1650 - cam[0] * 0.15, 900, 700, 'rgba(255,255,255,A)', 0.3);
}

// ---------- shadow sprite ----------
const shadow = document.createElement('canvas'); shadow.width = 760; shadow.height = 1300;
{ const s = shadow.getContext('2d'); s.filter = 'blur(34px)'; s.fillStyle = 'rgba(30,36,51,0.30)'; s.beginPath(); s.roundRect(116, 116, 528, 1068, 66); s.fill(); }

// ---------- avatar ----------
function drawPerson(who, o) {
  // o: {expr, mouth, blush, blink, tilt, t, sweat}
  const t = o.t, ex = o.expr;
  ctx.save(); ctx.rotate(o.tilt || 0);
  if (who === 'youssef') {
    // jacket + tee
    ctx.fillStyle = C.you; ctx.beginPath();
    ctx.moveTo(-130, 230); ctx.lineTo(-130, 128); ctx.bezierCurveTo(-130, 86, -96, 66, -44, 60); ctx.lineTo(44, 60);
    ctx.bezierCurveTo(96, 66, 130, 86, 130, 128); ctx.lineTo(130, 230); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#F7F5F0'; ctx.beginPath(); ctx.moveTo(-30, 58); ctx.lineTo(30, 58); ctx.lineTo(0, 118); ctx.closePath(); ctx.fill();
    ctx.fillStyle = C.youLite;
    ctx.beginPath(); ctx.moveTo(-30, 60); ctx.lineTo(-50, 66); ctx.lineTo(-10, 150); ctx.lineTo(-2, 120); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(30, 60); ctx.lineTo(50, 66); ctx.lineTo(10, 150); ctx.lineTo(2, 120); ctx.closePath(); ctx.fill();
    // neck
    ctx.fillStyle = '#93603F'; rr(-17, 26, 34, 40, 8); ctx.fill();
    // ears
    ctx.fillStyle = '#A86E4B'; ctx.beginPath(); ctx.arc(-46, 6, 10, 0, 7); ctx.arc(46, 6, 10, 0, 7); ctx.fill();
    // head
    ctx.beginPath(); ctx.ellipse(0, 0, 47, 57, 0, 0, 7); ctx.fill();
    // beard (clipped to head)
    ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, 47.5, 57.5, 0, 0, 7); ctx.clip();
    ctx.fillStyle = '#2A2024';
    ctx.beginPath(); ctx.moveTo(-50, -4); ctx.quadraticCurveTo(-42, 34, -14, 39); ctx.lineTo(14, 39); ctx.quadraticCurveTo(42, 34, 50, -4); ctx.lineTo(50, 70); ctx.lineTo(-50, 70); ctx.closePath(); ctx.fill();
    rr(-17, 17, 34, 8, 4); ctx.fill();
    ctx.restore();
    // hair
    ctx.fillStyle = '#1B1B22'; ctx.beginPath();
    ctx.moveTo(-49, -6); ctx.bezierCurveTo(-55, -52, -28, -70, 0, -68); ctx.bezierCurveTo(30, -70, 56, -50, 49, -6);
    ctx.lineTo(44, -14); ctx.quadraticCurveTo(40, -38, 12, -40); ctx.quadraticCurveTo(-22, -42, -42, -26); ctx.lineTo(-45, -8); ctx.closePath(); ctx.fill();
  } else {
    // mia: cardigan + teal tee
    ctx.fillStyle = C.mustard; ctx.beginPath();
    ctx.moveTo(-126, 230); ctx.lineTo(-126, 126); ctx.bezierCurveTo(-126, 84, -92, 66, -42, 60); ctx.lineTo(42, 60);
    ctx.bezierCurveTo(92, 66, 126, 84, 126, 126); ctx.lineTo(126, 230); ctx.closePath(); ctx.fill();
    ctx.fillStyle = C.teal; ctx.beginPath(); ctx.moveTo(-30, 58); ctx.quadraticCurveTo(0, 80, 30, 58); ctx.lineTo(22, 230); ctx.lineTo(-22, 230); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#D79C27'; ctx.beginPath(); ctx.arc(-30, 128, 4, 0, 7); ctx.arc(-27, 168, 4, 0, 7); ctx.fill();
    ctx.fillStyle = '#EDC3AC'; rr(-15, 26, 30, 40, 8); ctx.fill();
    // ponytail (behind), swings gently
    ctx.save(); ctx.translate(36, -42); ctx.rotate(Math.sin(t * 1.9) * 0.07 + (o.tilt || 0) * 0.8);
    ctx.fillStyle = C.auburn; ctx.beginPath();
    ctx.moveTo(-8, -6); ctx.bezierCurveTo(40, -16, 52, 40, 34, 96); ctx.bezierCurveTo(30, 108, 22, 110, 20, 98); ctx.bezierCurveTo(26, 50, 14, 22, -6, 14); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.fillStyle = C.auburn; ctx.beginPath(); ctx.ellipse(0, -8, 51, 58, 0, Math.PI * 0.95, Math.PI * 2.05); ctx.fill();
    ctx.fillStyle = '#F4D3BE'; ctx.beginPath(); ctx.arc(-44, 8, 9, 0, 7); ctx.arc(44, 8, 9, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, 0, 45, 55, 0, 0, 7); ctx.fill();
    ctx.fillStyle = C.auburn; ctx.beginPath();
    ctx.moveTo(-47, 2); ctx.bezierCurveTo(-54, -52, -18, -68, 6, -63); ctx.bezierCurveTo(36, -62, 54, -40, 47, -4);
    ctx.lineTo(43, -20); ctx.quadraticCurveTo(22, -46, -8, -40); ctx.quadraticCurveTo(-30, -30, -43, -4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = C.teal; ctx.beginPath(); ctx.arc(38, -44, 6, 0, 7); ctx.fill();
  }
  // ---- face features ----
  const isY = who === 'youssef';
  const browCol = isY ? '#1B1B22' : '#7E3519', eyeCol = isY ? '#1B1B22' : '#2B2230';
  const ey = -2, exo = 17, look = isY ? -1.8 : 1.8;
  // cheeks
  const bl = Math.max(o.blush || 0, isY ? 0 : 0.28);
  if (bl > 0) { ctx.fillStyle = C.blush; ctx.globalAlpha = bl * 0.8; ctx.beginPath(); ctx.ellipse(-27, 15, 11, 6.5, 0, 0, 7); ctx.ellipse(27, 15, 11, 6.5, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
  // eyes
  ctx.fillStyle = eyeCol; ctx.strokeStyle = eyeCol; ctx.lineCap = 'round'; ctx.lineWidth = 4;
  if (ex === 'embarrassed') {
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(s * exo, ey + 3, 6.5, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); }
  } else if (o.blink) {
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * exo - 6, ey); ctx.lineTo(s * exo + 6, ey); ctx.stroke(); }
  } else {
    const r = ex === 'nervous' ? 4.6 : 5.4;
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(s * exo + look, ey, r, 0, 7); ctx.fill(); }
    if (ex === 'nervous' || ex === 'puzzled') { ctx.fillStyle = '#fff'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(s * exo + look + 1.6, ey - 1.6, 1.4, 0, 7); ctx.fill(); } }
  }
  // brows
  ctx.strokeStyle = browCol; ctx.lineWidth = isY ? 5 : 3.6;
  const brow = (s, inner, outer) => { ctx.beginPath(); ctx.moveTo(s * (exo - 9), inner); ctx.quadraticCurveTo(s * exo, Math.min(inner, outer) - 3, s * (exo + 9), outer); ctx.stroke(); };
  if (ex === 'nervous' || ex === 'embarrassed') { brow(-1, -21, -15); brow(1, -21, -15); }
  else if (ex === 'puzzled') { brow(-1, -24, -26); brow(1, -15, -16); }
  else { brow(-1, -17, -17); brow(1, -17, -17); }
  // mouth
  const my = isY ? 30 : 27, m = o.mouth || 0;
  ctx.strokeStyle = isY ? '#3A1C1C' : '#9A3B3B'; ctx.lineWidth = 3.6;
  if (m > 0.05) {
    ctx.fillStyle = isY ? '#3A1C1C' : '#8E3235';
    ctx.beginPath(); ctx.ellipse(0, my + 1, 9 + m * 2, 2.5 + m * 7, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#D0656A'; ctx.beginPath(); ctx.ellipse(0, my + 2.5 + m * 4, 5 + m, 1 + m * 2.5, 0, 0, 7); ctx.fill();
  } else if (ex === 'nervous') {
    ctx.beginPath(); ctx.moveTo(-10, my); ctx.quadraticCurveTo(-5, my - 3, 0, my); ctx.quadraticCurveTo(5, my + 3, 10, my); ctx.stroke();
  } else if (ex === 'embarrassed') {
    ctx.beginPath(); ctx.moveTo(-13, my); ctx.quadraticCurveTo(-8, my + 4, -4, my); ctx.quadraticCurveTo(0, my - 3, 4, my); ctx.quadraticCurveTo(8, my + 4, 13, my); ctx.stroke();
  } else if (ex === 'puzzled') {
    ctx.beginPath(); ctx.moveTo(-8, my + 2); ctx.lineTo(7, my - 1); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(-11, my - 1); ctx.quadraticCurveTo(0, my + 8, 11, my - 1); ctx.stroke();
  }
  // sweat drop
  if (o.sweat > 0) {
    ctx.globalAlpha = o.sweat; ctx.fillStyle = '#9FD3EE';
    const sy = -34 + (1 - o.sweat) * -6;
    ctx.beginPath(); ctx.moveTo(58, sy - 14); ctx.quadraticCurveTo(66, sy, 58, sy + 4); ctx.quadraticCurveTo(50, sy, 58, sy - 14); ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

const BLINK = { youssef: [3.0, 8.6, 11.05, 13.9], mia: [9.6, 12.2, 13.0, 16.4] };
const isBlink = (t, who) => BLINK[who].some(b => t > b && t < b + 0.11);
function personState(who, t) {
  if (who === 'youssef') {
    let expr = 'smile', swap = -9;
    if (t >= 9.75 && t < 13.55) { expr = 'nervous'; swap = 9.75; }
    if (t >= 13.55) { expr = 'smile'; swap = 13.55; }
    if (t >= 15.3) { expr = 'embarrassed'; swap = 15.3; }
    const blush = expr === 'embarrassed' ? ss(seg(t, 15.3, 15.95)) : expr === 'nervous' ? 0.18 : 0;
    const sweat = expr === 'nervous' ? ss(seg(t, 10.8, 11.2)) * (1 - seg(t, 13.3, 13.5)) : expr === 'embarrassed' ? ss(seg(t, 15.7, 16.0)) : 0;
    return { expr, swap, blush, sweat, mouth: talkLevel(t, 'youssef'), blink: isBlink(t, 'youssef'), tilt: expr === 'embarrassed' ? -0.06 * ss(seg(t, 15.3, 15.8)) : 0, t };
  }
  let expr = 'smile', swap = -9;
  if (t >= 14.5) { expr = 'puzzled'; swap = 14.5; }
  return { expr, swap, blush: 0, sweat: 0, mouth: talkLevel(t, 'mia'), blink: isBlink(t, 'mia'), tilt: expr === 'puzzled' ? 0.1 * ss(seg(t, 14.5, 14.9)) : Math.sin(t * 1.3) * 0.015, t };
}

// round avatar (profile picture)
function roundAvatar(who, x, y, r, t, ring = 0) {
  const st = personState(who, t);
  ctx.save(); ctx.translate(x, y);
  ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fillStyle = who === 'youssef' ? '#F5D9D2' : C.tealTint; ctx.fill();
  ctx.save(); ctx.clip(); const s = r / 62; ctx.translate(0, r * 0.08); ctx.scale(s, s); drawPerson(who, st); ctx.restore();
  if (ring > 0) { ctx.strokeStyle = who === 'youssef' ? C.suitcase : C.teal; ctx.lineWidth = 3; ctx.globalAlpha = ring; ctx.beginPath(); ctx.arc(0, 0, r + 4, 0, 7); ctx.stroke(); ctx.globalAlpha = 1; }
  ctx.restore();
}
function suitcaseBadge(x, y, r) {
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, r + 2.5, 0, 7); ctx.fill();
  ctx.fillStyle = C.suitcase; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  const u = r / 10; ctx.fillStyle = '#fff';
  rr(x - 5.5 * u, y - 3 * u, 11 * u, 8 * u, 1.6 * u); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.4 * u; rr(x - 2.5 * u, y - 5.6 * u, 5 * u, 3.4 * u, 1 * u); ctx.stroke();
  ctx.fillStyle = C.suitcase; ctx.fillRect(x - 0.6 * u, y - 2 * u, 1.2 * u, 6 * u);
}

// ---------- street illustration (design box 500 x 1040) ----------
function street(t) {
  ctx.fillStyle = '#CFE5EE'; ctx.fillRect(0, 0, 500, 1040);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  const cloud = (x, y, s) => { ctx.beginPath(); ctx.arc(x, y, 26 * s, 0, 7); ctx.arc(x + 30 * s, y - 12 * s, 32 * s, 0, 7); ctx.arc(x + 64 * s, y, 24 * s, 0, 7); ctx.rect(x, y, 64 * s, 24 * s); ctx.fill(); };
  cloud(60 + t * 3, 200, 1); cloud(330 - t * 2, 290, 0.75);
  // distant skyline + clock tower
  ctx.fillStyle = '#B9D2DC';
  ctx.fillRect(0, 330, 90, 60); ctx.fillRect(250, 340, 120, 50);
  ctx.fillRect(400, 250, 40, 140); ctx.beginPath(); ctx.moveTo(396, 252); ctx.lineTo(420, 205); ctx.lineTo(444, 252); ctx.fill();
  ctx.fillStyle = '#DCEBF0'; ctx.beginPath(); ctx.arc(420, 278, 11, 0, 7); ctx.fill();
  // terraced houses
  const house = (x, w, top, col) => {
    ctx.fillStyle = col; ctx.fillRect(x, top, w, 700 - top);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    for (let yy = top + 26; yy < 640; yy += 62) for (let xx = x + 14; xx + 26 < x + w; xx += 40) { rr(xx, yy, 24, 36, 4); ctx.fill(); }
  };
  house(-10, 140, 372, '#E7D6C3'); house(370, 140, 386, '#CBDCD4');
  // school
  ctx.fillStyle = '#DE9478'; ctx.fillRect(118, 404, 264, 296);
  ctx.fillStyle = '#F4E6D6'; ctx.fillRect(110, 396, 280, 16);
  ctx.fillStyle = C.teal; rr(140, 424, 220, 48, 9); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = font(800, 23); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.letterSpacing = '1.5px'; ctx.fillText('ENGLISH SCHOOL', 250, 449); ctx.letterSpacing = '0px';
  const win = (x, y) => { ctx.fillStyle = '#F6EEDF'; rr(x, y, 52, 60, 5); ctx.fill(); ctx.fillStyle = '#6F88A6'; rr(x + 6, y + 6, 40, 48, 3); ctx.fill(); ctx.fillStyle = '#F6EEDF'; ctx.fillRect(x + 24, y + 6, 4, 48); };
  win(146, 492); win(224, 492); win(302, 492); win(146, 590); win(302, 590);
  ctx.fillStyle = C.you; ctx.beginPath(); ctx.moveTo(224, 700); ctx.lineTo(224, 618); ctx.arc(250, 618, 26, Math.PI, 0); ctx.lineTo(276, 700); ctx.fill();
  ctx.fillStyle = '#F4E6D6'; ctx.fillRect(214, 694, 72, 8);
  // lamppost + tree
  ctx.fillStyle = '#2B3446'; ctx.fillRect(84, 540, 6, 162); rr(76, 528, 22, 16, 5); ctx.fill();
  ctx.fillStyle = '#FFE7A8'; rr(80, 532, 14, 9, 3); ctx.fill();
  ctx.fillStyle = '#7A5B45'; ctx.fillRect(438, 600, 8, 102);
  ctx.fillStyle = '#86B89B'; ctx.beginPath(); ctx.arc(442, 584, 38, 0, 7); ctx.arc(420, 610, 24, 0, 7); ctx.arc(466, 612, 24, 0, 7); ctx.fill();
  // ground
  ctx.fillStyle = '#ECE5DA'; ctx.fillRect(0, 700, 500, 24);
  ctx.fillStyle = '#C9C1B5'; ctx.fillRect(0, 724, 500, 4);
  ctx.fillStyle = '#9097A4'; ctx.fillRect(0, 728, 500, 74);
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; for (let x = -40 + (t * 0) % 80; x < 520; x += 80) ctx.fillRect(x, 763, 40, 4);
  ctx.fillStyle = '#ECE5DA'; ctx.fillRect(0, 802, 500, 238);
  ctx.fillStyle = '#E2DACD'; for (let x = 0; x < 500; x += 70) ctx.fillRect(x, 802, 2, 238);
  // red bus (generic double-decker), drives left -> right
  const bx = -150 + t * 72, by = 652;
  ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(bx + 120, by + 132, 124, 7, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#D9473C'; ctx.beginPath(); ctx.roundRect(bx, by, 240, 126, [18, 22, 8, 8]); ctx.fill();
  ctx.fillStyle = '#F4E6D6'; ctx.fillRect(bx, by + 60, 240, 6);
  ctx.fillStyle = '#BFD9E6';
  for (let i = 0; i < 5; i++) { rr(bx + 12 + i * 42, by + 14, 34, 32, 6); ctx.fill(); }
  for (let i = 0; i < 4; i++) { rr(bx + 12 + i * 42, by + 76, 34, 30, 6); ctx.fill(); }
  rr(bx + 186, by + 76, 42, 44, 6); ctx.fill();
  ctx.fillStyle = '#1E2433'; rr(bx + 200, by + 3, 30, 9, 3); ctx.fill();
  ctx.fillStyle = '#FFD86B'; ctx.font = font(800, 8); ctx.textAlign = 'center'; ctx.fillText('24', bx + 215, by + 8);
  for (const wx of [bx + 52, bx + 188]) { ctx.fillStyle = '#23252D'; ctx.beginPath(); ctx.arc(wx, by + 126, 15, 0, 7); ctx.fill(); ctx.fillStyle = '#B9BEC8'; ctx.beginPath(); ctx.arc(wx, by + 126, 6, 0, 7); ctx.fill(); }
}

// ---------- portrait: notes app ----------
function statusBar(w, col) {
  ctx.fillStyle = col; ctx.font = font(600, 17); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('10:24', 34, 24);
  for (let i = 0; i < 4; i++) { ctx.globalAlpha = i < 3 ? 1 : 0.3; rr(w - 112 + i * 7, 29 - 5 - i * 3, 4.5, 5 + i * 3, 1.5); ctx.fill(); }
  ctx.globalAlpha = 1; ctx.strokeStyle = col; ctx.lineWidth = 1.6; rr(w - 72, 17, 34, 15, 4.5); ctx.stroke();
  rr(w - 69.5, 19.5, 24, 10, 2.5); ctx.fill(); rr(w - 36, 21.5, 2.5, 6, 1); ctx.fill();
}

// lay out Arabic paragraphs once (after fonts load)
let AR_LAYOUT = null;
function layoutArabic() {
  ctx.font = font(500, 36, AR); ctx.direction = 'rtl';
  const R = 474, L = 28, LH = 60, sp = ctx.measureText(' ').width;
  let y = 652; const out = [];
  for (const p of PARAS) {
    let x = R;
    for (const [w, tw, br] of p.w) {
      const ww = ctx.measureText(w).width;
      if (x - ww < L || br) { x = R; y += LH; }
      out.push({ w, tw, g: p.g, x, y, ww });
      x -= ww + sp;
    }
    y += LH + 12;
  }
  ctx.direction = 'ltr';
  AR_LAYOUT = out;
}

function notes(t) {
  const uiA = ss(seg(t, 0.85, 1.25));
  ctx.fillStyle = C.paper; ctx.fillRect(0, 0, 500, 1040);
  ctx.globalAlpha = uiA;
  statusBar(500, C.ink);
  ctx.fillStyle = C.you; ctx.font = font(500, 19); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('‹  Notes', 24, 78);
  roundAvatar('youssef', 448, 76, 23, t); suitcaseBadge(466, 94, 7.5);
  ctx.direction = 'rtl'; ctx.textAlign = 'right'; ctx.fillStyle = C.ink; ctx.font = font(700, 36, AR);
  ctx.fillText('يومياتي', 476, 140);
  ctx.direction = 'ltr';
  ctx.fillStyle = C.sub; ctx.font = font(500, 15); ctx.fillText('Day 1  ·  London, UK', 476, 175);
  // body text — voice dictation: ghost first, ink when spoken
  ctx.direction = 'rtl'; ctx.textAlign = 'right'; ctx.font = font(500, 36, AR); ctx.textBaseline = 'alphabetic';
  let caret = null;
  for (const a of AR_LAYOUT) {
    const ga = ss(seg(t, a.g, a.g + 0.3)); if (ga <= 0) continue;
    const k = eo(seg(t, a.tw - 0.04, a.tw + 0.16));
    const isMia = a.w === 'ميا.';
    const hl = isMia ? ss(seg(t, 7.05, 7.3)) : 0;
    if (hl > 0) { ctx.fillStyle = `rgba(23,160,150,${0.16 * hl})`; rr(a.x - a.ww - 8, a.y - 40, a.ww + 16, 54, 12); ctx.fill(); }
    ctx.fillStyle = C.ghost; ctx.globalAlpha = uiA * ga * (1 - k) * 0.85; ctx.fillText(a.w, a.x, a.y + (1 - ga) * 6);
    ctx.fillStyle = isMia && hl > 0 ? mix(C.ink, C.teal, hl) : C.ink; ctx.globalAlpha = uiA * k; ctx.fillText(a.w, a.x, a.y);
    if (k > 0) caret = { x: a.x - a.ww - 5, y: a.y };
  }
  ctx.globalAlpha = uiA; ctx.direction = 'ltr';
  if (caret && t < 7.3 && Math.floor(t * 2.2) % 2 === 0) { ctx.fillStyle = C.you; ctx.fillRect(caret.x - 2, caret.y - 34, 3, 46); }
  // Mia mention chip (she appears)
  const mc = seg(t, 7.1, 7.38);
  if (mc > 0) {
    const m = AR_LAYOUT[AR_LAYOUT.length - 1], cx = m.x - m.ww / 2 - 40, cy = m.y + 58;
    ctx.save(); ctx.translate(cx, cy); const s = back(mc, 2.4); ctx.scale(s, s);
    ctx.fillStyle = '#fff'; ctx.shadowColor = 'rgba(30,36,51,0.18)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 4;
    rr(-74, -26, 148, 52, 26); ctx.fill(); ctx.shadowColor = 'transparent';
    roundAvatar('mia', -48, 0, 19, t);
    ctx.fillStyle = C.ink; ctx.font = font(700, 19); ctx.textAlign = 'left'; ctx.fillText('Mia', -20, 1);
    ctx.fillStyle = C.teal; ctx.beginPath(); ctx.arc(34, 0, 5, 0, 7); ctx.fill();
    ctx.restore();
  }
  // bottom dictation bar
  ctx.fillStyle = C.panel; rr(24, 962, 452, 56, 28); ctx.fill();
  const nl = narrLevel(t);
  ctx.fillStyle = nl > 0.05 ? C.suitcase : C.sub; ctx.beginPath(); ctx.arc(56, 990, 16, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff'; rr(51.5, 979, 9, 15, 4.5); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(56, 989, 8, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); ctx.fillRect(55, 997, 2, 4);
  ctx.fillStyle = C.you;
  for (let i = 0; i < 26; i++) {
    const h = 4 + nl * (8 + 18 * Math.abs(Math.sin(t * 9.1 + i * 1.7) * Math.sin(t * 3.3 + i * 0.6)));
    rr(88 + i * 11, 990 - h / 2, 5, h, 2.5); ctx.fill();
  }
  ctx.fillStyle = C.sub; ctx.font = font(500, 14); ctx.textAlign = 'right'; ctx.fillText(nl > 0.05 ? 'Dictating…' : 'Paused', 460, 991);
  ctx.globalAlpha = 1;
  // photo: viewfinder -> card morph
  const k = eio(seg(t, 0.8, 1.32));
  const cx = lerp(0, 20, k), cy = lerp(0, 196, k), cw = lerp(500, 460, k), ch = lerp(1040, 380, k), rad = lerp(0, 22, k);
  const s = lerp(1, 0.92, k), ox = lerp(0, 20, k), oy = lerp(0, 196 - 388 * 0.92, k);
  ctx.save(); rr(cx, cy, cw, ch, rad); ctx.clip();
  ctx.translate(ox, oy); ctx.scale(s, s); street(t); ctx.restore();
  // location chip on the card
  if (uiA > 0) {
    ctx.globalAlpha = uiA; ctx.fillStyle = 'rgba(255,255,255,0.94)'; rr(36, 520, 150, 40, 20); ctx.fill();
    ctx.fillStyle = C.suitcase; ctx.beginPath(); ctx.arc(58, 536, 7.5, Math.PI, 0); ctx.lineTo(58, 550); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(58, 536, 3, 0, 7); ctx.fill();
    ctx.fillStyle = C.ink; ctx.font = font(600, 16); ctx.textAlign = 'left'; ctx.fillText('London, UK', 74, 541);
    ctx.globalAlpha = 1;
  }
  // viewfinder chrome
  const va = 1 - seg(t, 0.72, 0.9);
  if (va > 0) {
    ctx.globalAlpha = va;
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1.5;
    for (const f of [1 / 3, 2 / 3]) { ctx.beginPath(); ctx.moveTo(500 * f, 60); ctx.lineTo(500 * f, 880); ctx.moveTo(0, 60 + 820 * f); ctx.lineTo(500, 60 + 820 * f); ctx.stroke(); }
    ctx.fillStyle = 'rgba(20,24,34,0.55)'; ctx.fillRect(0, 0, 500, 60); ctx.fillRect(0, 880, 500, 160);
    statusBar(500, '#fff');
    ctx.fillStyle = '#FFD86B'; ctx.font = font(700, 15); ctx.textAlign = 'center'; ctx.fillText('PHOTO', 250, 902);
    const press = 1 - 0.12 * Math.sin(Math.PI * seg(t, 0.55, 0.75));
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(250, 962, 38, 0, 7); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(250, 962, 30 * press, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; rr(70, 940, 44, 44, 10); ctx.fill();
    ctx.globalAlpha = 1;
  }
  const fl = Math.min(seg(t, 0.66, 0.72), 1 - seg(t, 0.74, 0.98));
  if (fl > 0) { ctx.fillStyle = `rgba(255,255,255,${fl})`; ctx.fillRect(0, 0, 500, 1040); }
}

// ---------- landscape: face-to-face mode ----------
const TILE = { mia: { x: 18, y: 72, w: 256, h: 410 }, youssef: { x: 766, y: 72, w: 256, h: 410 } };
const CHAT = { l: 292, r: 748 };
let BUBW = {};
function measureBubbles() {
  ctx.font = font(600, 30);
  for (const [id, b] of Object.entries(BUB)) {
    const sp = ctx.measureText(' ').width, ws = b.words.map(w => ctx.measureText(w).width);
    BUBW[id] = { sp, ws, pre: ws.map((_, i) => ws.slice(0, i + 1).reduce((a, v) => a + v, 0) + sp * i) };
  }
}
const DOTSW = 58;
function bubbleInner(id, n, dots) { const m = BUBW[id]; return (n ? m.pre[n - 1] : 0) + (dots ? (n ? 14 : 0) + DOTSW : 0); }

function drawBubble(id, t) {
  const b = BUB[id], st = b.st; if (t < st[0][0]) return null;
  let i = 0; while (i + 1 < st.length && t >= st[i + 1][0]) i++;
  const prev = i > 0 ? st[i - 1] : st[0], cur = st[i];
  const wk = eo(seg(t, cur[0], cur[0] + 0.22));
  const inner = lerp(bubbleInner(id, prev[1], prev[2]), bubbleInner(id, cur[1], cur[2]), i > 0 ? wk : 1);
  const PADX = 24, H = 66, w = inner + PADX * 2, isY = b.who === 'youssef';
  const x = isY ? CHAT.r - w : CHAT.l, y = b.y;
  const appear = back(seg(t, st[0][0], st[0][0] + 0.3), 1.6);
  ctx.save();
  ctx.translate(isY ? CHAT.r : CHAT.l, y + H); ctx.scale(appear, appear); ctx.translate(-(isY ? CHAT.r : CHAT.l), -(y + H));
  ctx.globalAlpha = clamp(appear * 1.5);
  // bubble + tail toward the speaker's tile
  ctx.fillStyle = isY ? C.you : '#FFFFFF';
  if (!isY) { ctx.shadowColor = 'rgba(30,36,51,0.08)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 3; }
  rr(x, y, w, H, 26); ctx.fill();
  ctx.beginPath();
  if (isY) { ctx.moveTo(CHAT.r - 22, y + H - 20); ctx.quadraticCurveTo(CHAT.r - 2, y + H - 4, CHAT.r + 10, y + H); ctx.quadraticCurveTo(CHAT.r - 14, y + H + 2, CHAT.r - 30, y + H - 6); }
  else { ctx.moveTo(CHAT.l + 22, y + H - 20); ctx.quadraticCurveTo(CHAT.l + 2, y + H - 4, CHAT.l - 10, y + H); ctx.quadraticCurveTo(CHAT.l + 14, y + H + 2, CHAT.l + 30, y + H - 6); }
  ctx.fill(); ctx.shadowColor = 'transparent';
  // words
  const m = BUBW[id]; ctx.font = font(600, 30); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  let wx = x + PADX;
  for (let j = 0; j < b.words.length; j++) {
    const tw = st.find(s => s[1] >= j + 1); if (!tw || t < tw[0]) break;
    const k = eo(seg(t, tw[0], tw[0] + 0.2));
    ctx.globalAlpha = clamp(appear * 1.5) * k; ctx.fillStyle = isY ? '#FFFFFF' : C.ink;
    ctx.fillText(b.words[j], wx, y + H / 2 + 1 + (1 - k) * 8);
    wx += m.ws[j] + m.sp;
  }
  ctx.globalAlpha = clamp(appear * 1.5);
  // typing dots
  if (cur[2]) {
    const n = cur[1], dx = x + PADX + (n ? m.pre[n - 1] + 14 : 0) + 6;
    const stalled = STALL.some(([a, c]) => t > a && t < c) && isY;
    for (let d = 0; d < 3; d++) {
      const ph = stalled ? 0 : Math.max(0, Math.sin((t * 1.7 - d * 0.18) * Math.PI * 2));
      ctx.fillStyle = isY ? `rgba(255,255,255,${stalled ? 0.35 : 0.55 + 0.45 * ph})` : (stalled ? '#C9CCD3' : mix('#B5BAC4', C.ink, ph * 0.6));
      ctx.beginPath(); ctx.arc(dx + d * 19, y + H / 2 - ph * 6, 6, 0, 7); ctx.fill();
    }
  }
  ctx.restore();
  return { x, y, w, H, pre: m.pre, ws: m.ws, padx: PADX, sp: m.sp };
}

function tile(who, t, intro) {
  const T = TILE[who], st = personState(who, t), isY = who === 'youssef';
  const lvl = talkLevel(t, who);
  ctx.save();
  const sc = lerp(0.86, 1, back(intro, 1.7)); ctx.globalAlpha = clamp(intro * 1.4);
  ctx.translate(T.x + T.w / 2, T.y + T.h / 2); ctx.scale(sc, sc); ctx.translate(-(T.x + T.w / 2), -(T.y + T.h / 2));
  ctx.fillStyle = isY ? C.navyTint : C.tealTint; rr(T.x, T.y, T.w, T.h, 28); ctx.fill();
  ctx.save(); rr(T.x, T.y, T.w, T.h, 28); ctx.clip();
  // soft sun disc behind the head
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.arc(T.x + T.w / 2, T.y + 176, 96 + lvl * 6, 0, 7); ctx.fill();
  const pp = pop(t, st.swap, 0.2, 0.93);
  ctx.translate(T.x + T.w / 2, T.y + 196 + Math.sin(t * 1.6 + (isY ? 0 : 2)) * 2); ctx.scale(1.28 * pp, 1.28 * pp);
  drawPerson(who, st);
  ctx.restore();
  // speaking ring
  const ring = Math.max(lvl > 0.02 ? 0.55 + lvl * 0.45 : 0, isY ? 0 : 0);
  if (ring > 0) { ctx.strokeStyle = isY ? C.suitcase : C.teal; ctx.lineWidth = 5; ctx.globalAlpha *= ring; rr(T.x - 1, T.y - 1, T.w + 2, T.h + 2, 29); ctx.stroke(); ctx.globalAlpha = clamp(intro * 1.4); }
  // name pill
  const nm = isY ? 'Youssef' : 'Mia';
  ctx.font = font(700, 19); const nw = ctx.measureText(nm).width;
  const typing = isY && t > 15.95 && t < 16.6;
  const pw = nw + 40 + (lvl > 0.02 || typing ? 46 : 0);
  ctx.fillStyle = 'rgba(255,255,255,0.95)'; rr(T.x + 14, T.y + T.h - 52, pw, 38, 19); ctx.fill();
  ctx.fillStyle = isY ? C.suitcase : C.teal; ctx.beginPath(); ctx.arc(T.x + 32, T.y + T.h - 33, 5, 0, 7); ctx.fill();
  ctx.fillStyle = C.ink; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(nm, T.x + 44, T.y + T.h - 32);
  if (lvl > 0.02) {
    ctx.fillStyle = isY ? C.suitcase : C.teal;
    for (let i = 0; i < 5; i++) { const h = 5 + lvl * 16 * Math.abs(Math.sin(t * 13 + i * 1.9)); rr(T.x + 52 + nw + i * 7, T.y + T.h - 33 - h / 2, 4, h, 2); ctx.fill(); }
  } else if (typing) {
    for (let d = 0; d < 3; d++) { const ph = t < 16.45 ? Math.max(0, Math.sin((t * 1.8 - d * 0.18) * Math.PI * 2)) : 0; ctx.fillStyle = mix('#B5BAC4', C.ink, ph * 0.6); ctx.beginPath(); ctx.arc(T.x + 58 + nw + d * 12, T.y + T.h - 33 - ph * 3, 3.6, 0, 7); ctx.fill(); }
  }
  if (isY) suitcaseBadge(T.x + T.w - 34, T.y + 32, 15);
  ctx.restore();
}

function faceToFace(t) {
  ctx.fillStyle = '#F6F3EE'; ctx.fillRect(0, 0, 1040, 500);
  // header
  ctx.fillStyle = C.suitcase; rr(22, 18, 70, 28, 14); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.6 + 0.4 * Math.abs(Math.sin(t * 2.4)); ctx.beginPath(); ctx.arc(38, 32, 4.5, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
  ctx.font = font(800, 14); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText('LIVE', 48, 33);
  ctx.fillStyle = C.ink; ctx.font = font(700, 19); ctx.fillText('Face-to-face', 104, 32);
  ctx.fillStyle = C.sub; ctx.font = font(500, 15); ctx.fillText('·  live transcript', 228, 33);
  ctx.textAlign = 'right'; ctx.fillStyle = C.sub; ctx.fillText('London  ·  10:24', 1018, 33);
  // tiles
  tile('youssef', t, 1);
  tile('mia', t, seg(t, 7.85, 8.25));
  // system chip
  const sc = seg(t, 7.95, 8.25);
  if (sc > 0) {
    ctx.globalAlpha = sc; ctx.font = font(600, 15); ctx.textAlign = 'center';
    const tx = 'You met Mia  ·  nearby', tw = ctx.measureText(tx).width;
    ctx.fillStyle = '#ECE8E1'; rr(520 - tw / 2 - 16, 78, tw + 32, 32, 16); ctx.fill();
    ctx.fillStyle = C.sub; ctx.fillText(tx, 520, 95); ctx.globalAlpha = 1;
  }
  drawBubble('mia1', t);
  const yb = drawBubble('you1', t);
  drawBubble('mia2', t);
  if (yb) {
    // status ticks: heard -> seen
    const ha = seg(t, 13.45, 13.7);
    if (ha > 0) {
      const seen = seg(t, 14.15, 14.35), col = mix(C.sub, C.teal, seen);
      ctx.globalAlpha = ha; ctx.strokeStyle = col; ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const sx = CHAT.r - 112, sy = yb.y + yb.H + 18;
      for (const o of [0, 7]) { ctx.beginPath(); ctx.moveTo(sx + o, sy); ctx.lineTo(sx + 4 + o, sy + 4); ctx.lineTo(sx + 12 + o, sy - 5); ctx.stroke(); }
      ctx.fillStyle = col; ctx.font = font(500, 15); ctx.textAlign = 'left'; ctx.fillText(seen > 0.5 ? 'Seen' : 'Heard', sx + 26, sy);
      ctx.globalAlpha = 1;
    }
    // spell squiggle under "I Youssef."
    const sq = eio(seg(t, 15.45, 15.9));
    if (sq > 0) {
      const x0 = yb.x + yb.padx + yb.pre[1] + yb.sp, x1 = yb.x + yb.padx + yb.pre[3] - 8, yy = yb.y + yb.H - 12;
      ctx.strokeStyle = '#FF8A7E'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x0, yy);
      for (let x = x0; x <= lerp(x0, x1, sq); x += 2) ctx.lineTo(x, yy + Math.sin((x - x0) / 5.5 * Math.PI) * 3);
      ctx.stroke();
    }
    // reaction chip "?" from Mia
    const rc = seg(t, 15.12, 15.42);
    if (rc > 0) {
      ctx.save(); ctx.translate(yb.x + 10, yb.y + 2); const s = back(rc, 2.6); ctx.scale(s, s);
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, 22, 0, 7); ctx.fill();
      ctx.fillStyle = C.teal; ctx.beginPath(); ctx.arc(0, 0, 18.5, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = font(800, 23); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('?', 0, 1);
      ctx.restore();
    }
  }
}

// ---------- phone ----------
function phone(t) {
  const rot = phoneRot(t) + Math.sin(t * 1.25) * 0.006;
  const bob = Math.sin(t * 1.25 + 1) * 4 + (1 - eo(seg(t, 0, 0.9))) * 40;
  ctx.save(); ctx.translate(0, bob);
  // shadow (screen-space down)
  ctx.save(); ctx.translate(0, 26); ctx.rotate(rot); ctx.drawImage(shadow, -380, -650); ctx.restore();
  ctx.rotate(rot); ctx.translate(-250, -520);
  // body
  ctx.fillStyle = C.body; rr(-14, -14, 528, 1068, 66); ctx.fill();
  ctx.strokeStyle = '#3A4152'; ctx.lineWidth = 2; rr(-13, -13, 526, 1066, 65); ctx.stroke();
  ctx.fillStyle = '#2A2F3C'; rr(-18, 220, 5, 70, 2); ctx.fill(); rr(-18, 310, 5, 70, 2); ctx.fill(); rr(513, 260, 5, 110, 2); ctx.fill();
  // screen
  ctx.save(); rr(0, 0, 500, 1040, 54); ctx.clip();
  const pa = 1 - seg(t, 7.4, 7.62), la = ss(seg(t, 7.72, 8.0));
  ctx.fillStyle = C.paper; ctx.fillRect(0, 0, 500, 1040);
  if (pa > 0) { ctx.globalAlpha = pa; notes(t); ctx.globalAlpha = 1; }
  if (la > 0) {
    ctx.save(); ctx.globalAlpha = la; ctx.translate(250, 520); ctx.rotate(Math.PI / 2); ctx.translate(-520, -250);
    faceToFace(t); ctx.restore();
  }
  ctx.restore();
  // camera hole
  ctx.fillStyle = '#0D0F14'; ctx.beginPath(); ctx.arc(250, -7, 3.5, 0, 7); ctx.fill();
  ctx.restore();
}

// ---------- frame ----------
window.render = (t) => {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.direction = 'ltr';
  room(t);
  const [cx, cy, z] = CAM(t);
  ctx.save(); ctx.translate(FW / 2, FH / 2); ctx.scale(z, z); ctx.translate(-cx, -cy);
  phone(t);
  ctx.restore();
  const f = ss(seg(t, 16.5, 17.0));
  if (f > 0) { ctx.fillStyle = C.roomBlush; ctx.globalAlpha = f; ctx.fillRect(0, 0, FW, FH); ctx.globalAlpha = 1; }
};

(async () => {
  await Promise.all([
    document.fonts.load(font(500, 30)), document.fonts.load(font(600, 30)), document.fonts.load(font(700, 30)), document.fonts.load(font(800, 30)),
    document.fonts.load(font(500, 36, AR), 'أول يوم'), document.fonts.load(font(700, 36, AR), 'يومياتي'),
  ]);
  await document.fonts.ready;
  layoutArabic(); measureBubbles();
  window.render(0);
  window.READY = true;
})();
