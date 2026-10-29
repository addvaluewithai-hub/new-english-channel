// Living Letters (الحروف العايشة) - style test. Pure function of t, Canvas2D.
import { clamp, lerp, seg, ss, eio, eo, ei, back, hash } from '/core/lib.js';

const W = 1920, H = 1080, G = 820;           // world ground line
const C = {
  paper: '#F5EEE1', ground: '#EADCC4', groundLine: '#E0CFB2', ink: '#1F2A44',
  red: '#E0412F', redDk: '#B9301F',
  cityA: '#C9D3E8', cityB: '#EBD2C6', eye: '#9AA9D2',
  yBody: '#B5713F', beard: '#5B3520', jacket: '#22315A', ySay: '#8A4A22',
  mBody: '#F2B33D', ginger: '#D9652B', teal: '#1D8A84', mSay: '#13716C',
  school: '#CFE4DF', schoolDk: '#AFD3CC', door: '#2C3E66',
  violet: '#7B5CD6', blush: '#F08A7E', sweat: '#8FC8EA', white: '#FFFFFF', check: '#2FA36B',
};
const BAGEL = "'Bagel Fat One'", ANTON = 'Anton', AR = "'Baloo Bhaijaan 2'";

const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
const scratch = document.createElement('canvas').getContext('2d');
function measure(text, font) {
  scratch.font = font;
  const m = scratch.measureText(text);
  return { w: m.width, l: m.actualBoundingBoxLeft, r: m.actualBoundingBoxRight, a: m.actualBoundingBoxAscent, d: m.actualBoundingBoxDescent };
}
const rr = (c, x, y, w, h, r) => { c.beginPath(); c.roundRect(x, y, w, h, r); };
const expLerp = (a, b, p) => Math.exp(lerp(Math.log(a), Math.log(b), p));

// ---------------------------------------------------------------- timeline data
const TALK = [[8.2, 8.64, 'mia'], [8.7, 8.84, 'mia'], [8.8, 9.24, 'mia'], [10.1, 10.54, 'youssef'], [11.4, 11.74, 'youssef'],
  [12.5, 12.84, 'youssef'], [12.8, 13.34, 'youssef'], [15.0, 15.32, 'mia']];
const SUBS = [
  { t0: 0.6, t1: 2.6, ar: 'أول يوم ليّا في لندن…' },
  { t0: 2.65, t1: 5.75, ar: 'وكنت فاكر إن الإنجليزي بتاعي كويس.' },
  { t0: 5.8, t1: 7.85, ar: 'لحد ما قابلت ميا.' },
];
function talk(who, t) {
  let v = 0;
  for (const [a, b, w] of TALK) {
    if (w !== who || t < a - 0.05 || t > b + 0.05) continue;
    const e = Math.min(seg(t, a - 0.05, a + 0.03), 1 - seg(t, b - 0.03, b + 0.05));
    v = Math.max(v, e * (0.45 + 0.55 * Math.abs(Math.sin((t - a) * Math.PI * 9))));
  }
  return v;
}
const blinkOf = (t, times) => times.reduce((m, b) => Math.max(m, clamp(1 - Math.abs(t - b) / 0.075)), 0);
const Y_BLINK = [1.9, 4.5, 6.4, 9.1, 11.95, 12.15, 14.2, 16.45];
const M_BLINK = [9.7, 11.1, 12.95, 14.15, 16.2];

// ---------------------------------------------------------------- sprites (built once)
const K = 2;   // sprite supersampling (close-up zooms to 1.8x)
function glyphSprite(glyph, size, font, color, paint) {
  const f = `${size * K}px ${font}`;
  const m = measure(glyph, f);
  const pad = 6 * K, gw = m.l + m.r, gh = m.a + m.d;
  const c = document.createElement('canvas');
  c.width = Math.ceil(gw + pad * 2); c.height = Math.ceil(gh + pad * 2);
  const x = c.getContext('2d');
  x.font = f; x.fillStyle = color; x.textBaseline = 'alphabetic';
  x.fillText(glyph, pad + m.l, pad + m.a);
  x.globalCompositeOperation = 'source-atop';
  if (paint) paint(x, pad, pad, gw, gh);
  return { c, w: gw / K, h: gh / K, pad: pad / K };
}
const drawSprite = (c, sp) => c.drawImage(sp.c, -sp.w / 2 - sp.pad, -sp.h - sp.pad, sp.c.width / K, sp.c.height / K);

let SP = {};
function buildSprites() {
  // Youssef: brown Y, espresso beard crescent, navy jacket with cream collar V
  SP.Y = glyphSprite('Y', 400, BAGEL, C.yBody, (x, ox, oy, w, h) => {
    const y0 = oy + h * 0.58;
    x.fillStyle = C.beard; x.beginPath();
    x.moveTo(ox, y0); x.quadraticCurveTo(ox + w / 2, y0 + h * 0.15, ox + w, y0);
    x.lineTo(ox + w, y0 + h * 0.02); x.quadraticCurveTo(ox + w / 2, y0 + h * 0.3, ox, y0 + h * 0.02); x.fill();
    x.fillStyle = C.jacket; x.fillRect(ox - 10, oy + h * 0.79, w + 20, h);
    x.fillStyle = C.paper; x.beginPath();
    x.moveTo(ox + w * 0.43, oy + h * 0.79); x.lineTo(ox + w * 0.5, oy + h * 0.875); x.lineTo(ox + w * 0.57, oy + h * 0.79); x.fill();
  });
  // Mia: mustard M, ginger hair cap, teal outfit
  SP.M = glyphSprite('M', 360, BAGEL, C.mBody, (x, ox, oy, w, h) => {
    x.fillStyle = C.ginger; x.beginPath();
    x.moveTo(ox - 10, oy - 10); x.lineTo(ox + w + 10, oy - 10); x.lineTo(ox + w + 10, oy + h * 0.15);
    x.quadraticCurveTo(ox + w * 0.75, oy + h * 0.21, ox + w * 0.5, oy + h * 0.16);
    x.quadraticCurveTo(ox + w * 0.25, oy + h * 0.21, ox - 10, oy + h * 0.15); x.fill();
    x.fillStyle = C.teal; x.fillRect(ox - 10, oy + h * 0.8, w + 20, h);
  });
  // architecture letters with windows
  SP.city = {};
  const word = 'LONDN';
  [...word].forEach((g, i) => {
    if (SP.city[g + i]) return;
  });
  for (const [g, col] of [['L', C.cityA], ['O', C.cityB], ['N', C.cityA], ['D', C.cityB], ['N2', C.cityB]]) {
    SP.city[g] = glyphSprite(g[0], 420, ANTON, col, (x, ox, oy, w, h) => {
      x.fillStyle = 'rgba(245,238,225,0.62)';
      let k = 0;
      for (let yy = oy + 26 * K; yy < oy + h - 40 * K; yy += 50 * K)
        for (let xx = ox + 14 * K; xx < ox + w - 20 * K; xx += 34 * K) {
          k++; if (hash(k * 3.1 + g.charCodeAt(0)) < 0.28) continue;
          x.fillRect(xx, yy, 12 * K, 22 * K);
        }
    });
  }
  SP.bus = glyphSprite('BUS', 150, BAGEL, C.red, (x, ox, oy, w, h) => {
    x.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i = 0; i < 6; i++) x.fillRect(ox + w * (0.06 + i * 0.155), oy + h * 0.22, w * 0.07, h * 0.16);
  });
  SP.am = glyphSprite('am', 84, BAGEL, C.violet);
}

// ---------------------------------------------------------------- characters
const CAST = {
  Y: { sp: () => SP.Y, eye: [0.5, 0.555, 0.074, 0.05], mouth: [0.5, 0.635], brow: 0.07, blush: [0.115, 0.625],
       footX: 0.12, footW: 0.2, footH: 22, shoe: C.ink, arm: C.jacket, hand: C.yBody, sweat: [0.74, 0.45] },
  M: { sp: () => SP.M, eye: [0.5, 0.36, 0.215, 0.047], mouth: [0.5, 0.735], brow: 0.06, blush: [0.25, 0.49],
       footX: 0.36, footW: 0.24, footH: 20, shoe: C.ink, arm: C.teal, hand: C.mBody, sweat: [0.95, 0.3] },
};

function drawArm(c, sx, sy, hx, hy, bend, color, hand, wid) {
  c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = color; c.lineWidth = wid;
  const mx = (sx + hx) / 2, my = (sy + hy) / 2, dx = hx - sx, dy = hy - sy;
  c.beginPath(); c.moveTo(sx, sy); c.quadraticCurveTo(mx - dy * bend, my + dx * bend, hx, hy); c.stroke();
  c.fillStyle = hand; c.beginPath(); c.arc(hx, hy, wid * 0.85, 0, Math.PI * 2); c.fill();
}

// s: x, y, sc, sx, sy, rot, hop, look[x,y], blink, big, brow (+worried / -angry), browUp, open, smile, blush, sweat, arms[], behind(c,w,h), feet
function drawChar(c, ch, s) {
  const sp = ch.sp(), w = sp.w, h = sp.h, fh = ch.footH;
  c.save();
  c.translate(s.x, s.y ?? G); c.scale(s.sc || 1, s.sc || 1);
  // serif feet
  const ft = s.feet || [[0, 0], [0, 0]];
  c.fillStyle = ch.shoe;
  [-1, 1].forEach((side, i) => {
    const fw = ch.footW * w;
    rr(c, side * ch.footX * w - fw / 2 + ft[i][0], -fh - ft[i][1], fw, fh, fh / 2); c.fill();
  });
  c.translate(0, -fh + 5 - (s.hop || 0));
  c.rotate(s.rot || 0);
  c.scale(s.sx || 1, s.sy || 1);
  const L = (fx, fy) => [(fx - 0.5) * w, -h + fy * h];
  if (s.behind) s.behind(c, w, h, L);
  for (const a of s.arms || []) {
    const [sx, sy] = L(a.from[0], a.from[1]);
    const len = a.len * h;
    drawArm(c, sx, sy, sx + Math.cos(a.ang) * len, sy + Math.sin(a.ang) * len, a.bend || 0.15, ch.arm, ch.hand, 0.05 * h);
  }
  drawSprite(c, sp);
  // eyes
  const [ecx, ecy, edx, er] = ch.eye;
  const big = s.big || 1, look = s.look || [0, 0], blink = clamp(s.blink || 0);
  const rx = er * w * big, ry = rx * 1.25;
  for (const side of [-1, 1]) {
    const [ex, ey] = L(ecx + side * edx, ecy);
    if (blink > 0.82) {
      c.strokeStyle = C.ink; c.lineWidth = 0.016 * w; c.lineCap = 'round';
      c.beginPath(); c.moveTo(ex - rx, ey); c.quadraticCurveTo(ex, ey + rx * 0.45, ex + rx, ey); c.stroke();
    } else {
      const ryb = ry * (1 - blink);
      c.save();
      c.fillStyle = C.white; c.beginPath(); c.ellipse(ex, ey, rx, ryb, 0, 0, Math.PI * 2); c.fill(); c.clip();
      const pr = rx * 0.6, px = ex + look[0] * rx * 0.42, py = ey + look[1] * ryb * 0.36;
      c.fillStyle = C.ink; c.beginPath(); c.arc(px, py, pr, 0, Math.PI * 2); c.fill();
      c.fillStyle = C.white; c.beginPath(); c.arc(px - pr * 0.3, py - pr * 0.35, pr * 0.3, 0, Math.PI * 2); c.fill();
      if (s.lid) { c.fillStyle = s.lidColor; c.fillRect(ex - rx, ey - ryb, rx * 2, ryb * 2 * s.lid); }
      c.restore();
    }
    // brow
    const bw = rx * 1.05, by = ey - ry - ch.brow * w * 0.35 - (s.browUp || 0) * w * 0.03;
    const ang = (s.brow || 0) * side * 0.5 + (s.browTilt || 0) * (side > 0 ? 1 : 0);
    c.save(); c.translate(ex, by); c.rotate(ang);
    c.strokeStyle = C.ink; c.lineWidth = 0.022 * w; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-bw * 0.6, 0); c.lineTo(bw * 0.6, 0); c.stroke(); c.restore();
  }
  // blush
  if (s.blush > 0) {
    c.fillStyle = C.blush; c.globalAlpha = 0.85 * s.blush;
    for (const side of [-1, 1]) { const [bx, by] = L(0.5 + side * ch.blush[0], ch.blush[1]); c.beginPath(); c.ellipse(bx, by, 0.05 * w, 0.028 * w, 0, 0, Math.PI * 2); c.fill(); }
    c.globalAlpha = 1;
  }
  // mouth
  const [mx, my] = L(ch.mouth[0], ch.mouth[1]);
  const open = s.open || 0;
  c.fillStyle = C.ink; c.strokeStyle = C.ink; c.lineCap = 'round';
  if (open > 0.04) {
    const mrx = 0.05 * w * (0.75 + 0.3 * open + (s.oShape ? -0.25 : 0)), mry = 0.012 * w + 0.045 * w * open;
    c.beginPath(); c.ellipse(mx, my + mry * 0.4, mrx, mry, 0, 0, Math.PI * 2); c.fill();
    if (open > 0.35) { c.fillStyle = C.blush; c.beginPath(); c.ellipse(mx, my + mry * 1.0, mrx * 0.55, mry * 0.38, 0, 0, Math.PI * 2); c.fill(); }
  } else {
    const r = 0.045 * w, sm = s.smile ?? 0.6;
    c.lineWidth = 0.017 * w; c.beginPath();
    if (s.wobble) {
      c.moveTo(mx - r, my); for (let i = 1; i <= 8; i++) c.lineTo(mx - r + (2 * r * i) / 8, my + Math.sin(i * 2.2) * r * 0.16);
    } else { c.moveTo(mx - r, my); c.quadraticCurveTo(mx, my + sm * r * 0.9, mx + r, my); }
    c.stroke();
  }
  // sweat drop
  if (s.sweat > 0) {
    const [sx, sy0] = L(ch.sweat[0], ch.sweat[1]);
    const sy = sy0 + s.sweatSlide * h * 0.12, d = 0.045 * w;
    c.globalAlpha = s.sweat; c.fillStyle = C.sweat;
    c.beginPath(); c.moveTo(sx, sy - d * 1.7); c.quadraticCurveTo(sx + d, sy - d * 0.2, sx, sy + d * 0.6);
    c.quadraticCurveTo(sx - d, sy - d * 0.2, sx, sy - d * 1.7); c.fill(); c.globalAlpha = 1;
  }
  c.restore();
}
// world point of a character's face (for words leaving the mouth)
function mouthWorld(ch, x, sc, hop) {
  const sp = ch.sp();
  return [x, G - ch.footH + 5 - (hop || 0) - sp.h * sc + ch.mouth[1] * sp.h * sc];
}

function walkFeet(steps, amp = 14) {
  const ph = Math.PI * steps;
  return { feet: [[Math.cos(ph) * 10, Math.max(0, Math.sin(ph)) * amp], [-Math.cos(ph) * 10, Math.max(0, -Math.sin(ph)) * amp]],
           hop: Math.abs(Math.sin(ph)) * 12, sy: 1 - 0.035 * Math.cos(2 * ph) };
}

// red suitcase: slab with pull rod; px = wheel pivot x
function drawSuitcase(c, px, tilt, rod) {
  c.save(); c.translate(px, G - 11); c.rotate(tilt);
  // rod
  c.strokeStyle = C.ink; c.lineWidth = 9; c.lineCap = 'round';
  c.beginPath(); c.moveTo(0, -140); c.lineTo(0, -140 - rod); c.stroke();
  rr(c, -20, -152 - rod, 40, 16, 8); c.fillStyle = C.ink; c.fill();
  rr(c, -58, -148, 116, 148, 22); c.fillStyle = C.red; c.fill();
  c.fillStyle = C.redDk; c.fillRect(-58, -98, 116, 12); c.fillRect(-58, -56, 116, 12);
  c.fillStyle = C.ink; [-34, 34].forEach(x => { c.beginPath(); c.arc(x, 2, 10, 0, Math.PI * 2); c.fill(); });
  c.restore();
  return [px + Math.sin(tilt) * (146 + rod), G - 11 - Math.cos(tilt) * (146 + rod)];
}

function star(c, x, y, r, a) {
  c.save(); c.translate(x, y); c.rotate(a); c.beginPath();
  for (let i = 0; i < 8; i++) { const rad = i % 2 ? r * 0.32 : r; const an = (i * Math.PI) / 4; c.lineTo(Math.cos(an) * rad, Math.sin(an) * rad); }
  c.closePath(); c.fill(); c.restore();
}
function cloud(c, x, y, s, txt) {
  c.font = `${110 * s}px ${BAGEL}`; c.fillStyle = 'rgba(255,255,255,0.9)'; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  c.fillText(txt, x, y);
}

// ---------------------------------------------------------------- scene A: London (letters are the city)
let SKY = null;
function layoutSkyline() {
  const items = []; let x = 0; const gap = 24;
  const tower = { kind: 'ben', w: 92 }; items.push(tower); x += tower.w + 56;
  for (const [g, key] of [['L', 'L'], ['O', 'O'], ['N', 'N'], ['D', 'D'], ['EYE'], ['N', 'N2']]) {
    if (g === 'EYE') { items.push({ kind: 'eye', w: 330 }); continue; }
    items.push({ kind: 'glyph', key, w: SP.city[key].w });
  }
  let total = 0; items.forEach((it, i) => total += it.w + (i ? gap : 0)); total += 32;
  x = 1010 - total / 2;
  items.forEach((it, i) => { if (i === 1) x += 32; it.x = x; x += it.w + gap; });
  SKY = items;
  const e = items.find(i => i.kind === 'eye');
  SKY.eye = { cx: e.x + e.w / 2, cy: G - 30 - 165, R: 165, inner: 151 };
}
function drawSkyline(c, t, portalP) {
  c.save(); c.beginPath(); c.rect(-4000, -4000, 9000, 4000 + G); c.clip();
  SKY.forEach((it, i) => {
    const rise = 1 - clampSpring(t - 0.05 - i * 0.085);
    const dy = rise * 520;
    if (it.kind === 'glyph') {
      c.save(); c.translate(it.x + it.w / 2, G + dy); drawSprite(c, SP.city[it.key]); c.restore();
    } else if (it.kind === 'ben') {
      const cx = it.x + it.w / 2, top = G - 330 + dy;
      c.fillStyle = C.cityB; rr(c, cx - 34, top, 68, 340, 8); c.fill();
      c.fillStyle = 'rgba(245,238,225,0.62)'; for (let k = 0; k < 5; k++) c.fillRect(cx - 7, top + 30 + k * 56, 14, 24);
      const cy = top - 74;   // the dot of the i = the clock
      c.fillStyle = C.cityB; c.beginPath(); c.arc(cx, cy, 52, 0, Math.PI * 2); c.fill();
      c.fillStyle = C.paper; c.beginPath(); c.arc(cx, cy, 38, 0, Math.PI * 2); c.fill();
      c.strokeStyle = C.ink; c.lineWidth = 6; c.lineCap = 'round';
      const a1 = -Math.PI / 2 + t * 0.6, a2 = -Math.PI / 2 + t * 0.05 + 2.1;
      c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a1) * 28, cy + Math.sin(a1) * 28); c.stroke();
      c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a2) * 19, cy + Math.sin(a2) * 19); c.stroke();
      c.fillStyle = C.cityB; c.beginPath(); c.moveTo(cx - 30, cy - 44); c.lineTo(cx, cy - 120); c.lineTo(cx + 30, cy - 44); c.fill();
    } else if (it.kind === 'eye') {
      const { cx, R, inner } = SKY.eye, cy = SKY.eye.cy + dy;
      c.strokeStyle = C.eye; c.lineWidth = 14; c.lineCap = 'round';
      c.beginPath(); c.moveTo(cx - 90, G + 4); c.lineTo(cx, cy); c.lineTo(cx + 90, G + 4); c.stroke();
      const spokeA = 1 - seg(portalP, 0, 0.35);
      if (spokeA > 0) {
        c.globalAlpha = spokeA; c.lineWidth = 4; c.strokeStyle = C.eye;
        for (let k = 0; k < 12; k++) { const a = t * 0.25 + (k * Math.PI) / 6; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner); c.stroke(); }
        c.fillStyle = C.eye; c.beginPath(); c.arc(cx, cy, 18, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
      }
      c.lineWidth = R - inner + 14; c.strokeStyle = C.cityA; c.beginPath(); c.arc(cx, cy, (R + inner) / 2, 0, Math.PI * 2); c.stroke();
      c.fillStyle = C.eye;
      for (let k = 0; k < 16; k++) { const a = t * 0.25 + (k * Math.PI) / 8; c.beginPath(); c.arc(cx + Math.cos(a) * (R + 6), cy + Math.sin(a) * (R + 6), 9, 0, Math.PI * 2); c.fill(); }
    }
  });
  c.restore();
}
// spring 0→1 (rises with a small overshoot), 0 for negative t
const clampSpring = t => t <= 0 ? 0 : 1 - Math.exp(-t * 5.2) * Math.cos(t * 9.5);

function ground(c) {
  c.fillStyle = C.ground; c.fillRect(-6000, G, 14000, 4000);
  c.fillStyle = C.groundLine; c.fillRect(-6000, G, 14000, 5);
}

function youssefA(t) {
  // walk in 0.5 → 2.75, excited hop 3.0, proud 3.4+
  const wp = seg(t, 0.45, 2.75);
  const x = lerp(-220, 720, 1 - Math.pow(1 - wp, 1.6));
  const walking = t > 0.45 && t < 2.8;
  const steps = (x + 220) / 92;
  const wf = walking ? walkFeet(steps) : { feet: null, hop: 0, sy: 1 };
  const jump = Math.sin(Math.PI * seg(t, 3.0, 3.38));
  const land = t > 3.38 ? Math.exp(-(t - 3.38) * 10) * Math.cos((t - 3.38) * 28) : 0;
  const pre = Math.sin(Math.PI * seg(t, 2.86, 3.0));
  const s = {
    x, sc: 1, hop: wf.hop + jump * 70, sy: wf.sy * (1 - 0.1 * pre - 0.1 * land) * (1 + 0.06 * jump) * (1 + 0.012 * Math.sin(t * 4)),
    rot: walking ? 0.05 : 0, feet: wf.feet,
    look: t < 2.75 ? [1, 0] : t < 3.4 ? [0.3, -1] : [0.6, -0.9],
    blink: blinkOf(t, Y_BLINK), big: 1 + 0.18 * env1(t, 2.85, 3.6), smile: 0.8,
    open: 0.6 * env1(t, 3.0, 3.45), browUp: env1(t, 2.85, 3.6), brow: t > 3.5 ? -0.12 : 0,
  };
  s.sx = 1 / Math.sqrt(s.sy);
  // pull arm + suitcase
  const pull = 1 - seg(t, 2.75, 3.0);
  return { s, x, walking, pull, steps };
}
const env1 = (t, a, b) => Math.min(seg(t, a, a + 0.12), 1 - seg(t, b - 0.18, b));

function drawYoussefWithCase(c, t, Ystate, caseX, tilt, rod, pull) {
  const { s } = Ystate;
  const grip = drawSuitcase(c, caseX, tilt, rod);
  const sp = SP.Y;
  // shoulder point (world) on the left side of the stem
  const sh = [s.x - sp.w * 0.1, G - 22 + 5 - s.hop - sp.h * 0.36];
  if (pull > 0) {
    const hx = lerp(sh[0] - 10, grip[0], pull), hy = lerp(sh[1] + 30, grip[1], pull);
    drawArm(c, sh[0], sh[1], hx, hy, 0.12, C.jacket, C.yBody, 0.05 * sp.h);
  }
  drawChar(c, CAST.Y, s);
}

function sceneA(c, t, cam, portalP) {
  c.fillStyle = C.paper; c.fillRect(0, 0, W, H);
  c.save(); applyCam(c, cam);
  cloud(c, 380 + t * 14, 250, 1, 'ooO');
  cloud(c, 1560 - t * 9, 180, 0.75, 'oOo');
  drawSkyline(c, t, portalP);
  ground(c);
  // the BUS, made of the word BUS
  const bx = lerp(2300, -600, seg(t, 0.5, 3.4));
  c.save(); c.translate(bx, G - 30 + Math.sin(t * 18) * 1.5); drawSprite(c, SP.bus); c.restore();
  c.fillStyle = C.ink; [-SP.bus.w * 0.3, SP.bus.w * 0.3].forEach(dx => { c.beginPath(); c.arc(bx + dx, G - 14, 17, 0, Math.PI * 2); c.fill(); });
  c.fillStyle = '#FFD45C'; c.beginPath(); c.arc(bx - SP.bus.w / 2 - 4, G - 50, 8, 0, Math.PI * 2); c.fill();
  // Youssef
  const Ys = youssefA(t);
  const tilt = Ys.walking ? 0.36 + Math.sin(Ys.steps * Math.PI) * 0.03 : 0.36 * (1 - eo(seg(t, 2.8, 3.1)));
  const rod = lerp(14, 78, Ys.pull);
  drawYoussefWithCase(c, t, Ys, Ys.x - 205 + (1 - Ys.pull) * 10, tilt, rod, Ys.pull);
  // sparkles of excitement
  const sk = seg(t, 3.02, 3.7);
  if (sk > 0 && sk < 1) {
    c.fillStyle = C.mBody;
    [[-150, -400, 26], [140, -430, 20], [175, -330, 14], [-120, -300, 14]].forEach(([dx, dy, r], i) => {
      const k = clamp(sk * 1.4 - i * 0.1); const sc = Math.sin(Math.PI * k);
      if (sc > 0) star(c, Ys.x + dx * (0.8 + 0.3 * k), G + dy - 30 * k, r * sc, k * 2);
    });
  }
  // thought chip: "ENGLISH ✓" (I thought my English was good)
  const tp = seg(t, 3.55, 3.95), tout = seg(t, 5.0, 5.25);
  if (tp > 0 && tout < 1) {
    const sc = back(tp, 2.0) * (1 - ei(tout));
    const cx = Ys.x + 150, cy = G - 520;
    c.fillStyle = C.white;
    [[Ys.x + 52, G - 360, 10], [Ys.x + 82, G - 405, 15]].forEach(([x, y, r], i) => { const k = clamp(tp * 3 - i); c.beginPath(); c.arc(x, y, r * k * (1 - tout), 0, Math.PI * 2); c.fill(); });
    c.save(); c.translate(cx, cy); c.scale(sc, sc); c.rotate(Math.sin(t * 2.2) * 0.02);
    c.fillStyle = 'rgba(31,42,68,0.08)'; rr(c, -186, -46, 380, 104, 52); c.fill();
    c.fillStyle = C.white; rr(c, -190, -54, 380, 104, 52); c.fill();
    c.font = `56px ${BAGEL}`; c.fillStyle = C.ink; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    c.fillText('English', -150, 19);
    const ck = seg(t, 3.85, 4.15);
    c.strokeStyle = C.check; c.lineWidth = 14; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(80, 0);
    if (ck > 0) { c.lineTo(80 + 22 * clamp(ck * 2), 22 * clamp(ck * 2)); if (ck > 0.5) c.lineTo(102 + 44 * (ck - 0.5) * 2, 22 - 56 * (ck - 0.5) * 2); c.stroke(); }
    c.restore();
  }
  c.restore();
}

// ---------------------------------------------------------------- scene B: the English School
const MX = 1400, YX = 640;
function youssefB(t) {
  const wp = seg(t, 5.5, 7.05);
  const x = lerp(-200, YX, 1 - Math.pow(1 - wp, 1.7));
  const walking = t > 5.5 && t < 7.1;
  const steps = (x + 200) / 92;
  const wf = walking ? walkFeet(steps) : { feet: null, hop: 0, sy: 1 };
  // reactions
  const startle = Math.sin(Math.PI * seg(t, 7.63, 7.92));
  const hello = env1(t, 9.95, 10.9);
  const nervous = env1(t, 10.95, 12.4);
  const proud = env1(t, 12.45, 14.6);
  const sorryHit = seg(t, 15.12, 15.3);
  const emb = eo(seg(t, 15.15, 15.7));
  const helloHop = Math.sin(Math.PI * seg(t, 10.05, 10.35)) * 22;
  const nod = Math.sin(Math.PI * seg(t, 12.8, 13.15));
  const jitter = nervous * Math.sin(t * 47) * 2.2;
  let sy = wf.sy * (1 + 0.012 * Math.sin(t * 4.2)) * (1 - 0.05 * nod) * (1 - 0.11 * emb + 0.03 * Math.sin(Math.PI * sorryHit));
  const s = {
    x: x + jitter, sc: 1, hop: wf.hop + startle * 26 + helloHop, sy, rot: walking ? 0.05 : (-0.03 * emb + 0.02 * hello),
    feet: wf.feet,
    look: walking ? [1, 0] : t < 7.55 ? [0.6, 0] : nervous > 0.2 ? [Math.sin(t * 7) > 0 ? 0.9 : -0.5, 0.4] : emb > 0.1 ? [-0.8, 0.9] : [0.9, -0.1],
    blink: blinkOf(t, Y_BLINK), big: 1 + 0.25 * startle + 0.12 * Math.sin(Math.PI * sorryHit),
    open: talk('youssef', t) + 0.5 * startle,
    smile: lerp(lerp(0.75, 0.25, nervous), 0.3, emb), wobble: emb > 0.4 || (nervous > 0.5 && talk('youssef', t) < 0.05),
    brow: 0.32 * nervous + 0.4 * emb - 0.1 * proud, browUp: startle + 0.6 * nervous + 0.3 * Math.sin(Math.PI * sorryHit),
    blush: emb * (0.85 + 0.15 * Math.sin(t * 6)), sweat: Math.min(emb, 1 - seg(t, 16.6, 16.95)), sweatSlide: eio(seg(t, 15.6, 16.8)),
    arms: [],
  };
  s.sx = 1 / Math.sqrt(s.sy);
  if (hello > 0) {
    const wav = Math.sin((t - 10) * Math.PI * 2 * 2.6);
    s.arms.push({ from: [0.62, 0.7], ang: lerp(0.4, -1.05 + wav * 0.32, eo(hello)), len: 0.36 * eo(hello) + 0.04, bend: -0.25 });
  }
  if (proud > 0) {   // "I ... Youssef" - hand to chest
    s.arms.push({ from: [0.64, 0.82], ang: lerp(1.2, 2.6, eo(proud)), len: 0.16 * eo(proud) + 0.04, bend: 0.5 });
  }
  return { s, x, walking, steps };
}
function miaB(t) {
  const fall = seg(t, 7.32, 7.62);
  const yoff = -1150 * (1 - ei(fall));
  const q = t - 7.62;
  const land = q > 0 ? Math.exp(-q * 8) * Math.cos(q * 24) : 0;
  const wave = env1(t, 8.0, 9.45);
  const puzzled = eo(seg(t, 14.55, 15.0));
  const sorry = env1(t, 14.95, 16.1);
  let sy = (1 - 0.24 * land) * (q < 0 ? 1.12 : 1) * (1 + 0.012 * Math.sin(t * 3.7 + 1));
  const s = {
    x: MX, y: G + yoff, sc: 1, hop: 0, sy, rot: 0.11 * puzzled + 0.03 * Math.sin(Math.PI * env1(t, 11.3, 12.3)) + 0.04 * sorry,
    look: puzzled > 0.1 ? [-0.9, 0.2] : t < 7.8 ? [0, 0.6] : [-1, 0.05],
    blink: blinkOf(t, M_BLINK), big: 1 + 0.08 * puzzled, open: talk('mia', t), oShape: sorry > 0.2,
    smile: lerp(0.85, -0.05, puzzled), brow: -0.05, browTilt: -0.45 * puzzled, browUp: 0.4 * puzzled,
    arms: [],
    behind: (c, w, h, L) => {   // ginger ponytail stroke
      const [px, py] = L(0.86, 0.12);
      const sw = Math.sin(t * 3.1) * 0.12 + land * 0.5 + 0.25 * Math.sin(Math.PI * env1(t, 15.0, 15.6));
      c.strokeStyle = C.ginger; c.lineWidth = 0.075 * h; c.lineCap = 'round';
      c.beginPath(); c.moveTo(px, py);
      c.quadraticCurveTo(px + 0.32 * w, py - 0.06 * h + sw * 30, px + 0.26 * w + sw * 40, py + 0.32 * h); c.stroke();
      c.fillStyle = C.teal; c.beginPath(); c.arc(px + 0.06 * w, py + 0.01 * h, 0.035 * h, 0, Math.PI * 2); c.fill();
    },
  };
  s.sx = 1 / Math.sqrt(s.sy);
  if (wave > 0) {
    const wv = Math.sin((t - 8) * Math.PI * 2 * 2.4);
    s.arms.push({ from: [0.12, 0.62], ang: lerp(Math.PI - 0.3, Math.PI + 1.05 + wv * 0.3, eo(wave)), len: 0.36 * eo(wave) + 0.04, bend: 0.25 });
  }
  return { s, landed: q > 0, visible: t > 7.3, land };
}

let SCHOOL = null;
function drawSchool(c, t) {
  const x0 = 1030, x1 = 1810, top = 300;
  c.fillStyle = C.school; rr(c, x0, top, x1 - x0, G - top + 10, [18, 18, 0, 0]); c.fill();
  c.fillStyle = C.schoolDk; c.fillRect(x0 - 16, top - 4, x1 - x0 + 32, 18);
  // sign: the words set one by one
  const sx = (x0 + x1) / 2;
  c.fillStyle = C.ink; rr(c, sx - 300, top + 36, 600, 92, 20); c.fill();
  c.font = `60px ${BAGEL}`; c.textBaseline = 'alphabetic'; c.textAlign = 'left';
  const text = 'ENGLISH SCHOOL';
  let tw = 0; const ws = [...text].map(ch => { const w = measure(ch, `60px ${BAGEL}`).w; tw += w; return w; });
  let x = sx - tw / 2;
  [...text].forEach((ch, i) => {
    const k = seg(t, 5.35 + i * 0.035, 5.65 + i * 0.035);
    if (k > 0) {
      const s = back(k, 2.2);
      c.save(); c.translate(x + ws[i] / 2, top + 104); c.scale(s, s); c.fillStyle = i < 7 ? C.mBody : C.paper;
      c.textAlign = 'center'; c.fillText(ch, 0, 0); c.restore();
    }
    x += ws[i];
  });
  // windows: A B C
  ['A', 'B', 'C'].forEach((g, i) => {
    const wx = 1320 + i * 170, wy = 172 + top;
    c.fillStyle = C.schoolDk; rr(c, wx - 52, wy, 104, 92, 14); c.fill();
    c.font = `64px ${BAGEL}`; c.fillStyle = C.paper; c.textAlign = 'center';
    c.fillText(g, wx, wy + 72 + Math.sin(t * 3 + i) * 2);
  });
  // door
  c.fillStyle = C.door; rr(c, 1105, G - 250, 150, 250, [75, 75, 0, 0]); c.fill();
  c.fillStyle = C.mBody; c.beginPath(); c.arc(1230, G - 120, 8, 0, Math.PI * 2); c.fill();
  c.fillStyle = C.schoolDk; c.fillRect(1085, G - 6, 190, 6);
}

function sceneB(c, t, cam) {
  c.fillStyle = C.paper; c.fillRect(0, 0, W, H);
  c.save(); applyCam(c, cam);
  cloud(c, 420 + t * 12, 210, 0.9, 'oOo');
  cloud(c, 1650 - t * 6, 150, 0.6, 'ooO');
  // distant London: a pale Big Ben "i" and the word LDN
  c.fillStyle = '#E3E2E6';
  rr(c, 180, G - 300, 52, 300, 6); c.fill(); c.beginPath(); c.arc(206, G - 360, 40, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.moveTo(182, G - 392); c.lineTo(206, G - 460); c.lineTo(230, G - 392); c.fill();
  c.font = `300px ${ANTON}`; c.textAlign = 'left'; c.fillText('LDN', 300, G);
  drawSchool(c, t);
  ground(c);
  const Ys = youssefB(t);
  const pull = Ys.walking ? 1 : 1 - seg(t, 7.1, 7.35);
  const tilt = Ys.walking ? 0.36 + Math.sin(Ys.steps * Math.PI) * 0.03 : 0.36 * (1 - eo(seg(t, 7.1, 7.4)));
  drawYoussefWithCase(c, t, Ys, Ys.x - 205 + (1 - pull) * 10, tilt, lerp(14, 78, pull), pull);
  const Ms = miaB(t);
  if (Ms.visible) {
    // typeset landing: dust ticks
    const dq = seg(t, 7.62, 7.95);
    if (dq > 0 && dq < 1) {
      c.strokeStyle = C.ink; c.lineWidth = 6; c.lineCap = 'round'; c.globalAlpha = 1 - dq;
      [-1, 1].forEach(sd => { for (let k = 0; k < 2; k++) { const x = MX + sd * (190 + dq * 70 + k * 34), y = G - 18 - k * 26; c.beginPath(); c.moveTo(x, y); c.lineTo(x + sd * 26, y - 6); c.stroke(); } });
      c.globalAlpha = 1;
    }
    drawChar(c, CAST.M, Ms.s);
  }
  c.restore();
  return { Ys, Ms };
}

// ---------------------------------------------------------------- camera
function applyCam(c, cam) { c.translate(W / 2, H / 2); c.scale(cam.z, cam.z); c.translate(-cam.x, -cam.y); }
const toScreen = (cam, x, y) => [(x - cam.x) * cam.z + W / 2, (y - cam.y) * cam.z + H / 2];
const P0 = 5.15, P1 = 5.95;   // portal through the London Eye
function camA(t) {
  const d = ss(seg(t, 0, 5.2));
  let cam = { x: 960 + 40 * d, y: 540 - 10 * d, z: 1 + 0.05 * d };
  const p = eio(seg(t, P0, P1));
  if (p > 0) {
    const zEnd = 1300 / SKY.eye.inner;
    cam = { x: lerp(cam.x, SKY.eye.cx, Math.min(1, p * 1.25)), y: lerp(cam.y, SKY.eye.cy, Math.min(1, p * 1.25)), z: expLerp(cam.z, zEnd, p) };
  }
  return cam;
}
function camB(t) {
  const est = { x: 1080, y: 540, z: 1.0 };
  const two = { x: 1020, y: 562, z: 1.1 };
  const close = { x: 688, y: 658, z: 2.1 };
  const a = eio(seg(t, 6.9, 7.75));
  let cam = { x: lerp(est.x - 30 * seg(t, 5, 7), two.x, a), y: lerp(est.y, two.y, a), z: expLerp(est.z, two.z, a) };
  // slow drift in the two-shot
  cam.x += 10 * Math.sin(t * 0.35); cam.z *= 1 + 0.012 * seg(t, 8, 15);
  const b = eio(seg(t, 15.32, 16.0));
  if (b > 0) cam = { x: lerp(cam.x, close.x, b), y: lerp(cam.y, close.y, b), z: expLerp(cam.z, close.z, b) };
  // dolly-through settle after the portal
  const f = expLerp(1.45, 1, eo(seg(t, P0, P1 + 0.5)));
  cam.z *= f;
  return cam;
}

// ---------------------------------------------------------------- spoken words on the ground stage
const ROWS = {
  mia: { color: C.mSay, rail: C.teal, words: [{ s: 'Hi!', t: 8.12 }, { s: "I'm", t: 8.66 }, { s: 'Mia.', t: 8.86 }], out: [9.75, 10.05] },
  you: { color: C.ySay, rail: C.yBody, words: [{ s: 'Hello!', t: 10.1 }, { s: 'I...', t: 11.36, dots: true }, { s: 'I', t: 12.42 }, { slot: true }, { s: 'Youssef.', t: 12.76 }], out: [99, 100] },
  sorry: { color: C.mSay, rail: C.teal, words: [{ s: 'Sorry', t: 15.0, q: true }], out: [15.95, 16.2] },
};
function layoutRow(row, size) {
  const f = `${size}px ${BAGEL}`, sp = measure(' ', f).w * 1.15;
  let x = 0; const items = [];
  row.words.forEach((wd, i) => {
    if (i) x += sp;
    const w = wd.slot ? measure('am', f).w + sp * 0.6 : measure(wd.s + (wd.q ? '?' : ''), f).w;
    items.push({ ...wd, x, w }); x += w;
  });
  items.forEach(it => it.x -= x / 2);
  return { items, width: x };
}
function drawRow(c, t, row, ax, by, size, alpha, mouth, opts = {}) {
  if (alpha <= 0) return;
  const f = `${size}px ${BAGEL}`;
  const { items, width } = layoutRow(row, size);
  ax = clamp(ax, width / 2 + 70, W - width / 2 - 70);
  if (opts.maxX) ax = Math.min(ax, opts.maxX - width / 2);
  c.save(); c.globalAlpha = alpha;
  c.font = f; c.textBaseline = 'alphabetic'; c.textAlign = 'center';
  // rail = who said it
  const landed = items.filter(it => !it.slot && t > it.t + 0.3);
  if (landed.length) {
    const lx = ax + Math.min(...landed.map(i => i.x)), rx = ax + Math.max(...landed.map(i => i.x + i.w));
    c.fillStyle = row.rail; rr(c, lx - 10, by + 18, rx - lx + 20, 8, 4); c.fill();
  }
  for (const it of items) {
    if (it.slot) {
      const sa = opts.slot || 0;
      if (sa > 0) {
        c.save(); c.globalAlpha = alpha * sa; c.strokeStyle = C.violet; c.lineWidth = 4; c.setLineDash([12, 9]);
        rr(c, ax + it.x + 6, by - size * 0.74, it.w - 12, size * 0.86, 14); c.stroke(); c.restore();
      }
      continue;
    }
    const p = seg(t, it.t, it.t + 0.34);
    if (p <= 0) continue;
    const tx = ax + it.x + it.w / 2;
    const x = lerp(mouth[0], tx, eo(p)), y = lerp(mouth[1], by, p) - Math.sin(Math.PI * p) * 110;
    const q = t - it.t - 0.34;
    const sq = q > 0 ? 1 - 0.2 * Math.exp(-q * 9) * Math.cos(q * 26) : 1;
    let sc = lerp(0.15, 1, eo(p));
    let jx = 0;
    if (it.dots && t < 12.4) jx = Math.sin(t * 61) * 2.2;   // "I..." trembles
    c.save(); c.globalAlpha = alpha * seg(p, 0, 0.3); c.translate(x + jx, y); c.scale(sc / Math.sqrt(sq), sc * sq);
    c.fillStyle = row.color;
    if (it.dots) {
      const iw = measure('I', f).w, dw = measure('.', f).w;
      c.textAlign = 'left'; c.fillText('I', -it.w / 2, 0);
      for (let k = 0; k < 3; k++) {
        const dk = seg(t, it.t + 0.3 + k * 0.22, it.t + 0.42 + k * 0.22);
        if (dk > 0) { c.save(); c.translate(-it.w / 2 + iw + dw * (k + 0.5), -Math.sin(Math.PI * dk) * 14); c.textAlign = 'center'; c.fillText('.', 0, 0); c.restore(); }
      }
    } else if (it.q) {
      const qw = measure('?', f).w;
      c.textAlign = 'left'; c.fillText(it.s, -it.w / 2, 0);
      const qk = t - it.t - 0.2;
      const ang = qk > 0 ? Math.sin(qk * 9) * 0.35 * Math.exp(-qk * 1.4) + 0.12 : 0;
      c.save(); c.translate(it.w / 2 - qw / 2, -size * 0.02); c.rotate(ang); c.scale(1.15, 1.15); c.textAlign = 'center'; c.fillText('?', 0, 0); c.restore();
    } else c.fillText(it.s, 0, 0);
    c.restore();
  }
  c.restore();
  return { ax, items };
}

// the violet "am" peeking in from the right edge (cliffhanger)
function drawAm(c, t, by, size) {
  const k = back(seg(t, 15.85, 16.3), 1.6);
  if (k <= 0) return;
  const sp = SP.am, sc = size / 84;
  const x = W + sp.w * sc * 0.55 - k * sp.w * sc * 0.78;
  c.save(); c.translate(x, by + 6); c.rotate(-0.16 * k + Math.sin(t * 5) * 0.015); c.scale(sc, sc);
  drawSprite(c, sp);
  const blink = blinkOf(t, [16.75]);
  [[-sp.w * 0.3, -sp.h * 0.97], [-sp.w * 0.07, -sp.h * 0.97]].forEach(([ex, ey]) => {
    c.fillStyle = C.white; c.beginPath(); c.ellipse(ex, ey, 11, 13 * (1 - blink * 0.9), 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = C.ink; c.beginPath(); c.arc(ex - 4.5, ey + 1, 6.5 * (1 - blink * 0.9), 0, Math.PI * 2); c.fill();
  });
  c.restore();
}

// ---------------------------------------------------------------- overlays
function subtitle(c, t) {
  for (const s of SUBS) {
    if (t < s.t0 || t > s.t1) continue;
    const a = Math.min(seg(t, s.t0, s.t0 + 0.15), 1 - seg(t, s.t1 - 0.15, s.t1));
    const f = `800 50px ${AR}`;
    const w = measure(s.ar, f).w;
    c.save(); c.globalAlpha = a; c.translate(W / 2, 985 + (1 - eo(a)) * 10);
    c.fillStyle = 'rgba(31,42,68,0.94)'; rr(c, -w / 2 - 40, -46, w + 80, 90, 45); c.fill();
    c.font = f; c.direction = 'rtl'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = C.paper;
    c.fillText(s.ar, 0, 4); c.restore();
  }
}
function dayTag(c, t) {
  const a = Math.min(seg(t, 0.25, 0.6), 1 - seg(t, 4.9, 5.2));
  if (a <= 0) return;
  c.save(); c.globalAlpha = a; c.translate(96, 120);
  const k = back(seg(t, 0.25, 0.65), 2);
  c.scale(k, k);
  c.font = `54px ${BAGEL}`; c.fillStyle = C.red; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillText('Day 1', 0, 0);
  c.fillStyle = C.ink; rr(c, 0, 16, 150 * seg(t, 0.45, 0.9), 7, 4); c.fill();
  c.restore();
}

// ---------------------------------------------------------------- frame
window.DUR = 17;
window.render = (t) => {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  let B = null;
  if (t < P0) sceneA(ctx, t, camA(t), 0);
  else {
    const cA = camA(t), pP = seg(t, P0, P1);
    const e = SKY.eye;
    const [ex, ey] = toScreen(cA, e.cx, e.cy);
    const r = e.inner * cA.z * eo(seg(t, P0, P0 + 0.3));
    const full = r > Math.hypot(Math.max(ex, W - ex), Math.max(ey, H - ey)) + 4;
    if (!full) {
      sceneA(ctx, t, cA, pP);
      ctx.save(); ctx.beginPath(); ctx.arc(ex, ey, Math.max(0.1, r), 0, Math.PI * 2); ctx.clip();
      B = sceneB(ctx, t, camB(t));
      ctx.restore();
      // ring stays on top as the frame of the portal
      ctx.save(); applyCam(ctx, cA);
      ctx.lineWidth = e.R - e.inner + 14; ctx.strokeStyle = C.cityA; ctx.beginPath(); ctx.arc(e.cx, e.cy, (e.R + e.inner) / 2, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    } else B = sceneB(ctx, t, camB(t));
  }
  // screen-space layers
  if (B) {
    const cam = camB(t);
    const { Ys, Ms } = B;
    const push = eio(seg(t, 15.32, 16.0));
    const mm = toScreen(cam, ...mouthWorld(CAST.M, MX, 1, Ms.s.hop));
    const ym = toScreen(cam, ...mouthWorld(CAST.Y, Ys.s.x, 1, Ys.s.hop));
    const mHead = toScreen(cam, MX, G);
    const yFeet = toScreen(cam, Ys.x, G);
    const baseY = lerp(968, 1002, push);
    // Mia: "Hi! I'm Mia."
    const mo = ROWS.mia.out;
    if (t > 8 && t < mo[1]) drawRow(ctx, t, ROWS.mia, mHead[0], 968, 70, 1 - seg(t, mo[0], mo[1]), mm);
    // Youssef: "Hello! I... I [ ] Youssef."
    if (t > 10) {
      const size = lerp(70, 84, push);
      const ax = lerp(yFeet[0] + 120, 900, push);
      drawRow(ctx, t, ROWS.you, ax, baseY, size, 1, ym, { slot: 0.35 * seg(t, 13.5, 13.9) + 0.65 * seg(t, 15.7, 16.1) + 0.12 * Math.sin(t * 5) * seg(t, 13.5, 14) });
    }
    // Mia: "Sorry?"
    const so = ROWS.sorry.out;
    if (t > 15 && t < so[1]) drawRow(ctx, t, ROWS.sorry, mHead[0], 968, 74, 1 - seg(t, so[0], so[1]), mm, { maxX: W - 60 });
    drawAm(ctx, t, baseY, 120);
  }
  dayTag(ctx, t);
  subtitle(ctx, t);
  // end fade
  const fo = seg(t, 16.65, 17.0);
  if (fo > 0) { ctx.globalAlpha = ss(fo); ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
};

(async () => {
  await Promise.all([
    document.fonts.load(`100px ${BAGEL}`, 'ABCDEHILMNOSUYabcdefghilmnorsuy!?.\''),
    document.fonts.load(`100px ${ANTON}`, 'LONDN'),
    document.fonts.load(`800 50px ${AR}`, 'أول يوم ليّا في لندن'),
  ]);
  await document.fonts.ready;
  buildSprites();
  layoutSkyline();
  window.render(0);
  window.READY = true;
})();
