// Cast v5 — "flat people" rig for Youssef in New York. Replaces the egg-shaped Bean People (bean.js).
// One construction for every character: a head (superellipse with a jaw taper) on a neck, a trapezoid torso, two-segment
// tube arms ending in mitten hands, two-segment tube legs with simple shoes, and a face kit (eyes with upper/lower lids,
// brows, nose, mouth shapes A–H + expression mouths). FLAT: solid fills, no gradients, no gloss, no rim light; at most one
// flat darker shape per part. No outline, except a thin self-coloured separation edge where a limb crosses its own body.
// Units: px at scale 1 (Youssef ≈ 400 tall). Origin at the ground between the feet. turn: 0 front, .5 three-quarter, 1 side
// (facing +x); dir -1 mirrors (faces −x). Arm 'a' is the screen-left arm in the front view (the NEAR arm when turned),
// arm 'b' the screen-right one (the FAR arm when turned). Same for legs.
import { clamp, lerp } from '/core/lib.js';

export const P = { ink: '#2A2742', cream: '#FFF6E8', sky: '#9BD3EC', red: '#E8483A', navy: '#2E3D7C', mustard: '#F5B63E', teal: '#1E9D93', leaf: '#69B464' };
const hx = h => { h = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
const toHex = a => '#' + a.map(v => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
export const mix = (a, b, t) => { const A = hx(a), B = hx(b); return toHex(A.map((v, i) => v + (B[i] - v) * t)); };
export const rgba = (a, al) => { const A = hx(a); return `rgba(${A[0]},${A[1]},${A[2]},${al})`; };
export const dk = (a, t = .16) => mix(a, '#2A2142', t);      // the one flat shadow tone of a colour
export const lt = (a, t = .2) => mix(a, '#FFFBF2', t);
const PI = Math.PI, TAU = PI * 2, ss = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const ell = (c, x, y, rx, ry, r = 0) => { c.beginPath(); c.ellipse(x, y, Math.max(.01, rx), Math.max(.01, ry), r, 0, TAU); };
const tube = (c, pts, w, col, cap = 'round') => { c.strokeStyle = col; c.lineWidth = w; c.lineCap = cap; c.lineJoin = 'round'; c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); };

// ---------------- palette per character (tokens + mixes) ----------------
const SKIN = { youssef: '#B87A4B', sara: '#F6CDB0', lopez: '#D9A27C', ana: '#D8A47F', leo: '#8A5A3C', mei: '#F2CFA6' };
const LILAC = mix(mix(P.navy, P.red, .3), P.cream, .52), SAGE = mix(mix(P.leaf, '#8A9A8A', .5), P.cream, .3), GINGER = mix(P.red, P.mustard, .38);
export const CAST = {
  youssef: {
    id: 'youssef', name: 'Youssef', skin: SKIN.youssef, hair: '#2B2233', brow: '#2B2233', lip: mix(SKIN.youssef, '#7A3B3B', .3),
    head: { w: 103, h: 120, top: 2.5, jaw: 3.1, taper: .2 }, neck: { w: 25, h: 20 },
    torso: { sw: 110, ww: 98, hw: 98, th: 120, hem: 14, r: 18 }, leg: { len: 158, w: 30, gap: 40, shoe: P.ink, foot: 40 },
    arm: { up: 72, fore: 66, w: 25, hand: 25 },
    hairStyle: 'youssef', top: { base: P.cream, outer: P.navy, style: 'blazer' }, lower: { kind: 'trousers', col: mix('#6E7C9C', '#9AA3B5', .3) },
  },
  sara: {
    id: 'sara', name: 'Sara', skin: SKIN.sara, hair: GINGER, brow: dk(GINGER, .35), lip: '#C8605A',
    head: { w: 94, h: 115, top: 2.2, jaw: 2.15, taper: .3 }, neck: { w: 19, h: 26 },
    torso: { sw: 98, ww: 74, hw: 86, th: 124, hem: 18, r: 16 }, leg: { len: 196, w: 25, gap: 30, shoe: P.red, foot: 37 },
    arm: { up: 76, fore: 70, w: 20, hand: 22 },
    hairStyle: 'sara', glasses: { col: P.navy, r: 1.55 }, top: { base: P.cream, outer: P.mustard, style: 'cardigan' }, lower: { kind: 'trousers', col: P.teal, slim: true },
  },
  lopez: {
    id: 'lopez', name: 'Mrs. Lopez', skin: SKIN.lopez, hair: '#C9C6D6', brow: '#8E8AA2', lip: '#B4554F',
    head: { w: 113, h: 113, top: 2.15, jaw: 2.25, taper: .12 }, neck: { w: 32, h: 6 },
    torso: { sw: 132, ww: 150, hw: 158, th: 118, hem: 6, r: 30 }, leg: { len: 108, w: 34, gap: 54, shoe: dk(P.navy, .3), foot: 38 },
    arm: { up: 58, fore: 54, w: 28, hand: 25 },
    hairStyle: 'lopez', glasses: { col: P.red, r: 1.65, thick: 1.4 }, top: { base: P.cream, outer: SAGE, style: 'cardiganLong', badge: true }, lower: { kind: 'skirt', col: mix(P.navy, P.ink, .25), len: .62, flare: 1.0 },
  },
  ana: {
    id: 'ana', name: 'Ana', skin: SKIN.ana, hair: '#3A2630', brow: '#3A2630', lip: '#B04E4A',
    head: { w: 96, h: 113, top: 2.3, jaw: 2.2, taper: .28 }, neck: { w: 19, h: 20 },
    torso: { sw: 90, ww: 70, hw: 84, th: 110, hem: 0, r: 16 }, leg: { len: 172, w: 23, gap: 26, shoe: P.ink, foot: 34 },
    arm: { up: 66, fore: 62, w: 19, hand: 21 },
    hairStyle: 'ana', top: { base: P.red, style: 'tee', sleeve: .45 }, lower: { kind: 'skirt', col: P.navy, len: .55, flare: 1.75 },
  },
  leo: {
    id: 'leo', name: 'Leo', skin: SKIN.leo, hair: '#2A1E26', brow: '#2A1E26', lip: mix(SKIN.leo, '#5A2A2A', .3),
    head: { w: 98, h: 120, top: 2.4, jaw: 2.7, taper: .2 }, neck: { w: 24, h: 22 },
    torso: { sw: 118, ww: 112, hw: 110, th: 132, hem: 12, r: 22 }, leg: { len: 198, w: 30, gap: 38, shoe: P.cream, sole: '#C9C2B4', foot: 42 },
    arm: { up: 78, fore: 74, w: 26, hand: 25 },
    hairStyle: 'leo', top: { base: mix(P.leaf, '#3E8A4A', .5), style: 'hoodie' }, lower: { kind: 'trousers', col: mix(P.navy, P.sky, .28) },
  },
  mei: {
    id: 'mei', name: 'Mei', skin: SKIN.mei, hair: '#1F1A2A', brow: '#1F1A2A', lip: '#C0605A',
    head: { w: 96, h: 110, top: 2.3, jaw: 2.4, taper: .26 }, neck: { w: 19, h: 12 },
    torso: { sw: 100, ww: 106, hw: 100, th: 104, hem: 18, r: 26 }, leg: { len: 122, w: 24, gap: 30, shoe: P.cream, sole: '#C9C2B4', foot: 33 },
    arm: { up: 56, fore: 52, w: 26, hand: 20 },
    hairStyle: 'mei', top: { base: LILAC, style: 'sweater' }, lower: { kind: 'trousers', col: mix(P.ink, P.navy, .4), cuff: true },
  },
};
export const COL = { lilac: LILAC, sage: SAGE, ginger: GINGER };

// ---------------- face kit ----------------
// F: { lid:[a,b] 0 open … 1 shut, lt:[a,b] lid tilt (+ = sad/worried outer-down, − = angry inner-down), lo:[a,b] lower lid (smile push),
//      brow:[[lift,tilt],[lift,tilt]] (tilt + = inner end up = worried), look:[x,y] −1..1, eye:'open'|'happy'|'closed', wide 0..1,
//      mouth: 'X','A'..'H' | 'smile','grin','laugh','flat','frown','smirk','wavy','o','yawn','bite', smile −1..1, blush 0..1, sweat 0..1 }
export const EXPR = {
  neutral: { lid: [.18, .18], brow: [[0, 0], [0, 0]], mouth: 'X', smile: .15 },
  kind: { lid: [.22, .22], lo: [.15, .15], brow: [[.03, .08], [.03, .08]], mouth: 'smile', smile: .5 },
  happy: { lid: [.1, .1], lo: [.3, .3], brow: [[.1, .05], [.1, .05]], mouth: 'grin', smile: 1 },
  embarrassed: { lid: [.32, .32], lt: [.25, .25], brow: [[.05, .55], [.05, .55]], mouth: 'wavy', smile: 0, blush: 1, sweat: 1, look: [-.5, .35] },
  shocked: { lid: [0, 0], wide: 1, brow: [[.42, .15], [.42, .15]], mouth: 'o', smile: 0 },
  skeptical: { lid: [.48, .3], lt: [-.1, .1], brow: [[-.12, -.25], [.32, .12]], mouth: 'smirk', smile: .1, look: [.55, 0] },
  laughing: { eye: 'happy', brow: [[.2, .2], [.2, .2]], mouth: 'laugh', smile: 1 },
  sleepy: { lid: [.62, .62], lt: [.18, .18], brow: [[-.05, .25], [-.05, .25]], mouth: 'flat', smile: -.05, look: [0, .25] },
  confident: { lid: [.3, .3], lo: [.12, .12], brow: [[.05, -.05], [.14, .02]], mouth: 'smile', smile: .75 },
  worried: { lid: [.2, .2], lt: [.2, .2], brow: [[.12, .55], [.12, .55]], mouth: 'frown', smile: -.4 },
  talk: { lid: [.15, .15], lo: [.1, .1], brow: [[.08, 0], [.08, 0]], mouth: 'C', smile: .4 },
};
export function face(name, over = {}) { return { ...EXPR[name], ...over }; }

// head-local: centre (0,0), y down. Feature longitude φ (0 = front centre) projects with the head yaw.
function headPath(c, H, inflate = 0, nose = 0) {
  const a = H.w / 2 + inflate, b = H.h / 2 + inflate; c.beginPath();
  for (let i = 0; i <= 72; i++) {
    const th = i / 72 * TAU, co = Math.cos(th), si = Math.sin(th), n = si > 0 ? H.jaw : H.top;
    let x = a * Math.sign(co) * Math.pow(Math.abs(co), 2 / n), y = b * Math.sign(si) * Math.pow(Math.abs(si), 2 / n);
    if (y > 0) x *= 1 - H.taper * Math.pow(y / b, 1.7);
    if (nose > 0 && x > 0) x += nose * Math.exp(-Math.pow((y - .2 * b * 2 / 2 - .05 * b) / (.16 * b), 2)) * Math.pow(Math.max(0, co), 6);   // chin/nose bump on the profile
    i ? c.lineTo(x, y) : c.moveTo(x, y);
  }
  c.closePath();
}
const proj = (H, phi, yaw, y = 0) => ({ x: H.w / 2 * Math.sin(phi + yaw) * (y > 0 ? 1 - H.taper * Math.pow(y / (H.h / 2), 1.7) : 1) * .96, v: Math.cos(phi + yaw) });

function drawEye(c, ch, H, x, ey, s, f, side, look) {
  // s = horizontal foreshortening 0..1
  const rx = H.w * .1 * s * (1 + .12 * (f.wide || 0)), ry = H.w * .128 * (1 + .14 * (f.wide || 0));
  const lid = clamp((f.lid?.[side] ?? .15) - .15 * (f.wide || 0), -.1, 1), tilt = (f.lt?.[side] ?? 0) * (side ? 1 : -1), lo = f.lo?.[side] ?? 0;
  const lineW = H.w * .028;
  if (f.eye === 'happy') {   // closed smiling eyes: an ∩ arc
    c.strokeStyle = P.ink; c.lineWidth = lineW * 1.25; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x - rx * 1.05, ey + ry * .25); c.quadraticCurveTo(x, ey - ry * 1.05, x + rx * 1.05, ey + ry * .25); c.stroke(); return;
  }
  if (f.eye === 'closed' || lid >= .97) {
    c.strokeStyle = P.ink; c.lineWidth = lineW * 1.2; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x - rx * 1.05, ey + ry * .1); c.quadraticCurveTo(x, ey + ry * .45, x + rx * 1.05, ey + ry * .1); c.stroke(); return;
  }
  c.save();
  ell(c, x, ey, rx, ry); c.fillStyle = '#FFFDF8'; c.fill(); c.clip();
  const pr = rx * (f.wide ? .55 : .66), prY = ry * (f.wide ? .5 : .62);
  ell(c, x + look[0] * rx * .42, ey + look[1] * ry * .38 + ry * .06, pr, prY); c.fillStyle = P.ink; c.fill();
  // upper lid: skin plane down to the lid line (tilted), the lid line itself in ink
  const top = ey - ry, yl = top + lid * ry * 2, dt = tilt * ry * .9;
  c.fillStyle = dk(ch.skin, .1);
  c.beginPath(); c.moveTo(x - rx * 1.2, top - 4); c.lineTo(x + rx * 1.2, top - 4); c.lineTo(x + rx * 1.2, yl + dt); c.lineTo(x - rx * 1.2, yl - dt); c.closePath(); c.fill();
  if (lo > 0) { c.fillStyle = ch.skin; c.beginPath(); c.moveTo(x - rx * 1.2, ey + ry + 2); c.lineTo(x + rx * 1.2, ey + ry + 2); c.lineTo(x + rx * 1.2, ey + ry - lo * ry * 1.3); c.quadraticCurveTo(x, ey + ry - lo * ry * 2, x - rx * 1.2, ey + ry - lo * ry * 1.3); c.closePath(); c.fill(); }
  c.restore();
  // lash line along the top of the visible eye (heavier: reads as an adult lid at small sizes)
  c.save(); ell(c, x, ey, rx + lineW, ry + lineW); c.clip();
  c.strokeStyle = P.ink; c.lineWidth = lineW * 1.5; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x - rx * 1.3, yl - dt - lineW * .4); c.lineTo(x + rx * 1.3, yl + dt - lineW * .4); c.stroke();
  c.restore();
  if (ch.lash) { c.strokeStyle = P.ink; c.lineWidth = lineW; c.lineCap = 'round'; const ox = x + (side ? 1 : -1) * rx * .92; c.beginPath(); c.moveTo(ox, yl + (side ? dt : -dt) + 1); c.lineTo(ox + (side ? 1 : -1) * rx * .38, yl + (side ? dt : -dt) - ry * .28); c.stroke(); }
}

function drawBrow(c, ch, H, x, by, s, lift, tilt, side) {
  const L = H.w * .2 * s, th = H.w * .052, y = by - lift * H.h * .09, sg = side ? 1 : -1;   // inner end toward the face centre
  const yi = y - tilt * H.h * .05, yo = y + tilt * H.h * .05;
  c.strokeStyle = ch.brow; c.lineCap = 'round'; c.lineWidth = th;
  c.beginPath(); c.moveTo(x - sg * L * .5, yi); c.quadraticCurveTo(x, Math.min(yi, yo) - th * .5, x + sg * L * .5, yo + th * .15); c.stroke();
}

// mouth: x,y centre; W = mouth width; shapes A–H are the Preston Blair visemes used by lib/lipsync.py
const MOUTH_IN = '#5B2340', TONGUE = '#E07A72', TEETH = '#FFFDF8';
export const VISEMES = ['X', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
function openMouth(c, x, y, w, h, o = {}) {   // a flat open mouth: top edge (smile curve), rounded bottom, teeth band, tongue
  const sm = o.smile ?? .3, r = o.round || 0;
  c.save();
  c.beginPath();
  if (r > 0) { ell(c, x, y + h * .5, w / 2, h / 2); }
  else { c.moveTo(x - w / 2, y - sm * h * .1); c.quadraticCurveTo(x, y + sm * h * .25 - h * .04, x + w / 2, y - sm * h * .1); c.bezierCurveTo(x + w / 2, y + h * (.7 + .2 * sm), x + w * .25, y + h, x, y + h); c.bezierCurveTo(x - w * .25, y + h, x - w / 2, y + h * (.7 + .2 * sm), x - w / 2, y - sm * h * .1); c.closePath(); }
  c.fillStyle = MOUTH_IN; c.fill(); c.clip();
  if (o.teeth !== 0) { c.fillStyle = TEETH; c.fillRect(x - w, y - h, w * 2, h * (o.teeth ?? .3) + h); }
  if (o.lowTeeth) { c.fillStyle = TEETH; c.fillRect(x - w, y + h * (1 - o.lowTeeth), w * 2, h); }
  if (o.tongue !== 0) { ell(c, x + w * .06, y + h * (o.tongueUp ? .45 : 1.02), w * (o.tongueUp ? .22 : .3), h * (o.tongueUp ? .3 : .42)); c.fillStyle = TONGUE; c.fill(); }
  c.restore();
}
function lineMouth(c, x, y, w, sm, lw, asym = 0) {
  c.strokeStyle = P.ink; c.lineWidth = lw; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x - w / 2, y - sm * w * .14 + asym * w * .12); c.quadraticCurveTo(x, y + sm * w * .22, x + w / 2, y - sm * w * .14 - asym * w * .12); c.stroke();
}
export function drawMouth(c, ch, x, y, W, f) {
  const m = f.mouth || 'X', sm = f.smile ?? .2, lw = W * .12;
  switch (m) {
    case 'X': case 'smile': lineMouth(c, x, y, W * (m === 'smile' ? 1 : .8), m === 'smile' ? Math.max(.4, sm) : sm, lw); break;
    case 'flat': lineMouth(c, x, y, W * .7, sm, lw); break;
    case 'frown': lineMouth(c, x, y + W * .06, W * .72, -.55, lw); break;
    case 'smirk': lineMouth(c, x + W * .08, y, W * .78, .1, lw, .9); break;
    case 'A': lineMouth(c, x, y, W * .74, sm * .3, lw * 1.25); c.fillStyle = ch.lip; c.fillRect(x - W * .22, y + lw * .7, W * .44, lw * .7); break;   // pressed lips (M B P)
    case 'B': openMouth(c, x, y - W * .02, W * .78, W * .2, { smile: sm, teeth: .62, lowTeeth: .3, tongue: 0 }); break;     // teeth together (most consonants, EE)
    case 'C': openMouth(c, x, y - W * .04, W * .8, W * .38, { smile: sm, teeth: .26 }); break;                               // open (EH AE)
    case 'D': openMouth(c, x, y - W * .06, W * .92, W * .6, { smile: sm, teeth: .2 }); break;                                // wide open (AA)
    case 'E': openMouth(c, x, y - W * .06, W * .56, W * .46, { round: 1, teeth: .14 }); break;                               // rounded (AO ER)
    case 'F': openMouth(c, x, y - W * .02, W * .3, W * .3, { round: 1, teeth: 0, tongue: 0 }); ell(c, x, y + W * .13, W * .22, W * .2); c.strokeStyle = ch.lip; c.lineWidth = lw * .55; c.stroke(); break; // pucker (UW OW W)
    case 'G': openMouth(c, x, y - W * .03, W * .7, W * .24, { smile: sm, teeth: .8, tongue: 0 }); c.fillStyle = ch.lip; c.beginPath(); c.ellipse(x, y + W * .2, W * .3, W * .06, 0, 0, TAU); c.fill(); break; // F V
    case 'H': openMouth(c, x, y - W * .04, W * .74, W * .42, { smile: sm, teeth: .22, tongueUp: 1 }); break;                // L (tongue up)
    case 'grin': openMouth(c, x, y - W * .1, W * 1.05, W * .42, { smile: 1, teeth: .34 }); break;
    case 'laugh': openMouth(c, x, y - W * .12, W * 1.12, W * .72, { smile: 1, teeth: .2 }); break;
    case 'o': openMouth(c, x, y - W * .1, W * .34, W * .42, { round: 1, teeth: 0 }); break;
    case 'yawn': openMouth(c, x, y - W * .15, W * .58, W * .8, { round: 1, teeth: .08 }); break;
    case 'wavy': { c.strokeStyle = P.ink; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); const n = 4; for (let i = 0; i <= n * 4; i++) { const u = i / (n * 4), xx = x - W * .38 + u * W * .76, yy = y + Math.sin(u * PI * n) * W * .06; i ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } c.stroke(); break; }
    case 'bite': openMouth(c, x, y, W * .7, W * .16, { smile: .2, teeth: 1, tongue: 0 }); break;
  }
}

// ---------------- hair ----------------
// Shared: a cap = (head inflated by v) ∩ (above a hairline that follows the head's longitude); each style adds its own masses.
function capPath(c, H, yaw, v, hl) {
  // hl(phi) → y of the hairline at longitude phi (head-local, y down). Sampled across the visible width.
  const a = H.w / 2 + v, top = -H.h / 2 - v - 4, pts = [];
  for (let i = 0; i <= 48; i++) {
    const x = -a + 2 * a * i / 48, phi = Math.asin(clamp(x / (H.w / 2), -1, 1)) - yaw;
    pts.push([x, hl(phi)]);
  }
  c.beginPath(); c.moveTo(-a - 2, top - 60); c.lineTo(a + 2, top - 60); c.lineTo(a + 2, pts[48][1]);
  for (let i = 48; i >= 0; i--) c.lineTo(pts[i][0], pts[i][1]);
  c.closePath();
}
const smoothHL = (fY, sY, nY, fringe = () => 0) => phi => {
  const ap = Math.abs(phi);
  const base = ap < 1.62 ? lerp(fY, sY, ss((ap - .42) / .9)) : lerp(sY, nY, ss((ap - 1.62) / .45));
  return base + fringe(phi);
};
const HAIR = {
  youssef: {   // short, dark, slightly curly; a soft wave falling on the forehead
    back(c, ch, H, yaw) {
      c.fillStyle = ch.hair; headPath(c, H, 5); c.save(); c.beginPath(); c.rect(-200, -200, 400, 200 + H.h * .02); c.clip(); headPath(c, H, 5); c.fill(); c.restore();
    },
    front(c, ch, H, yaw) {
      const hl = smoothHL(-H.h * .25, -H.h * .04, H.h * .2, phi => -Math.abs(Math.sin(phi * 9)) * H.h * .045 + (phi > -.3 && phi < .45 ? H.h * .06 * Math.cos((phi - .08) * 4) : 0));
      c.save(); headPath(c, H, 6); c.clip(); capPath(c, H, yaw, 6, hl); c.fillStyle = ch.hair; c.fill(); c.restore();
      // curls along the crown (bumps break the silhouette slightly)
      c.fillStyle = ch.hair;
      for (let i = 0; i < 14; i++) { const phi = -2.9 + i / 13 * 4.25, u = clamp(Math.abs(phi) / 1.35, 0, 1.6), p = proj(H, phi, yaw); if (p.v < -.98 + Math.abs(Math.sin(phi + yaw)) * 0) continue; if (Math.abs(phi + yaw) > PI / 2 + .35 && Math.abs(Math.sin(phi + yaw)) < .8) continue; const y = Math.min(-H.h / 2 + Math.pow(u, 2.2) * H.h * .2 - 1, -H.h * .17); ell(c, p.x * 1.03, y + 1, H.w * .1, H.w * .085); c.fill(); }
      // one flat darker shape: the curl separations on the top
      c.strokeStyle = dk(ch.hair, -.6 > 0 ? 0 : 0) === ch.hair ? lt(ch.hair, .14) : lt(ch.hair, .14); c.lineWidth = H.w * .026; c.lineCap = 'round';
      for (const [u, l] of [[-.45, .22], [-.05, .26], [.38, .2]]) { const p = proj(H, u, yaw); if (p.v < .1) continue; c.beginPath(); c.arc(p.x, -H.h * .36, H.w * l * .5, PI * 1.1, PI * 1.75); c.stroke(); }
    },
  },
  sara: {   // swept side fringe + a high ponytail (her signature shape)
    back(c, ch, H, yaw, o) {
      const sw = o.swing || 0, ax = -Math.sin(yaw) * H.w * .32, ay = -H.h * .48;
      //: rises from the crown, arcs back and falls to the shoulders — a thick comma (her signature shape)
      const w = H.w * .85, h = H.h * .85, X = d => ax - d * w, tip = [X(.95 + sw * .2), ay + h * .95];
      c.fillStyle = ch.hair;
      c.beginPath(); c.moveTo(X(-.16), ay + 6);
      c.bezierCurveTo(X(-.14), ay - h * .5, X(.9), ay - h * .62, X(1.0), ay - h * .05);
      c.bezierCurveTo(X(1.08), ay + h * .35, X(1.0), ay + h * .7, tip[0], tip[1]);
      c.bezierCurveTo(X(.7), ay + h * .6, X(.66), ay + h * .1, X(.5), ay - h * .05);
      c.bezierCurveTo(X(.36), ay - h * .14, X(.18), ay - h * .05, X(.12), ay + 8);
      c.closePath(); c.fill();
      c.fillStyle = dk(ch.hair, .14);   // the one flat shade: the inner curl of the tail
      c.beginPath(); c.moveTo(X(.5), ay - h * .05); c.bezierCurveTo(X(.66), ay + h * .1, X(.7), ay + h * .6, tip[0], tip[1]); c.bezierCurveTo(X(.86), ay + h * .5, X(.82), ay + h * .05, X(.5), ay - h * .05); c.fill();
      c.fillStyle = ch.hair; headPath(c, H, 4); c.save(); c.beginPath(); c.rect(-200, -200, 400, 200 + H.h * .05); c.clip(); headPath(c, H, 4); c.fill(); c.restore();
    },
    front(c, ch, H, yaw) {
      // fringe swept from a side part (part at phi ≈ .35): long on the far side, short on the near side
      const hl = smoothHL(-H.h * .27, -H.h * .06, H.h * .12, phi => (phi < .35 ? H.h * .17 * ss((.35 - phi) / .9) * (1 - ss((-phi - .55) / .5)) : 0));
      c.save(); headPath(c, H, 4.5); c.clip(); capPath(c, H, yaw, 4.5, hl); c.fillStyle = ch.hair; c.fill(); c.restore();
      // tie on top
      const ax = -Math.sin(yaw) * H.w * .32, ay = -H.h * .48;
      c.fillStyle = P.teal; c.save(); c.translate(ax, ay); c.rotate(-.5); c.beginPath(); c.roundRect(-H.w * .13, -H.w * .07, H.w * .26, H.w * .14, H.w * .06); c.fill(); c.restore();
    },
  },
  lopez: {   // grey, smooth, pulled back into a round bun
    back(c, ch, H, yaw) {
      const bx = -Math.sin(yaw) * H.w * .38, by = -H.h * .52 + Math.sin(yaw) * H.h * .06;
      ell(c, bx, by - H.h * .06, H.w * .25, H.w * .23); c.fillStyle = ch.hair; c.fill();
      ell(c, bx + H.w * .05, by - H.h * .02, H.w * .17, H.w * .12); c.fillStyle = dk(ch.hair, .12); c.fill();
      c.fillStyle = ch.hair; headPath(c, H, 3); c.save(); c.beginPath(); c.rect(-200, -200, 400, 200 - H.h * .02); c.clip(); headPath(c, H, 3); c.fill(); c.restore();
    },
    front(c, ch, H, yaw) {
      const hl = smoothHL(-H.h * .26, -H.h * .02, H.h * .16, phi => Math.abs(phi) < .12 ? H.h * .012 : 0);
      c.save(); headPath(c, H, 3.5); c.clip(); capPath(c, H, yaw, 3.5, hl); c.fillStyle = ch.hair; c.fill();
      // combed-back lines (flat darker strokes)
      c.strokeStyle = dk(ch.hair, .12); c.lineWidth = H.w * .022; c.lineCap = 'round';
      for (const u of [-.55, -.2, .2, .55]) { const p = proj(H, u, yaw); if (p.v < .15) continue; c.beginPath(); c.moveTo(p.x, -H.h * .27); c.quadraticCurveTo(p.x * .9, -H.h * .42, p.x * .55, -H.h * .5); c.stroke(); }
      c.restore();
    },
  },
  ana: {   // dark wavy bob to the jaw + a teal clip
    back(c, ch, H, yaw) {
      c.fillStyle = dk(ch.hair, .1);
      bobPath(c, H, yaw, 1); c.fill();
    },
    front(c, ch, H, yaw) {
      const hl = smoothHL(-H.h * .28, H.h * .42, H.h * .44, phi => (phi > -.1 && phi < .9 ? H.h * .12 * Math.sin(clamp((phi + .1) / 1, 0, 1) * PI) : 0));
      c.save(); bobPath(c, H, yaw, 0); c.clip(); capPath(c, H, yaw, 14, hl); c.fillStyle = ch.hair; c.fill(); c.restore();
      const p = proj(H, -.75, yaw);
      if (p.v > -.1) { c.save(); c.translate(p.x, -H.h * .22); c.rotate(-.7); c.fillStyle = P.teal; c.beginPath(); c.roundRect(-H.w * .16, -H.w * .055, H.w * .32, H.w * .11, H.w * .05); c.fill(); c.restore(); }
    },
  },
  leo: {   // a big rounded curly crown (cloud of curls), tight sides
    back(c, ch, H, yaw) {
      c.fillStyle = ch.hair; const cx = -Math.sin(yaw) * H.w * .12;
      c.beginPath();
      for (let i = 0; i < 11; i++) { const a = PI + (i / 10) * PI, rx = H.w * .62, ry = H.h * .5; const x = cx + Math.cos(a) * rx, y = -H.h * .2 + Math.sin(a) * ry, r = H.w * (.17 + .03 * ((i * 7) % 3)); c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU); }
      c.fill();
      ell(c, cx, -H.h * .28, H.w * .62, H.h * .46); c.fill();
    },
    front(c, ch, H, yaw) {
      const hl = smoothHL(-H.h * .24, H.h * .0, H.h * .18, phi => -Math.abs(Math.sin(phi * 10)) * H.h * .04);
      c.save(); headPath(c, H, 7); c.clip(); capPath(c, H, yaw, 7, hl); c.fillStyle = ch.hair; c.fill(); c.restore();
      c.strokeStyle = lt(ch.hair, .13); c.lineWidth = H.w * .024; c.lineCap = 'round'; const cx = -Math.sin(yaw) * H.w * .12;
      for (const [x, y] of [[-.35, -.62], [.05, -.72], [.4, -.6], [-.15, -.45], [.25, -.42]]) { c.beginPath(); c.arc(cx + x * H.w, y * H.h, H.w * .07, PI * .9, PI * 1.9); c.stroke(); }
    },
  },
  mei: {   // a glossy black bob helmet, blunt bangs to the brows
    back(c, ch, H, yaw) { c.fillStyle = ch.hair; meiBob(c, H, yaw); c.fill(); },
    front(c, ch, H, yaw) {
      const hl = smoothHL(-H.h * .11, H.h * .36, H.h * .38, phi => Math.abs(phi) < .9 ? -H.h * .012 * Math.abs(Math.sin(phi * 5)) : 0);
      c.save(); meiBob(c, H, yaw); c.clip(); capPath(c, H, yaw, 14, hl); c.fillStyle = ch.hair; c.fill(); c.restore();
      c.strokeStyle = lt(ch.hair, .14); c.lineWidth = H.w * .03; c.lineCap = 'round'; const cx = -Math.sin(yaw) * H.w * .1;   // one flat sheen arc
      c.beginPath(); c.arc(cx, -H.h * .02, H.w * .5, PI * 1.18, PI * 1.38); c.stroke();
    },
  },
};
function bobPath(c, H, yaw, back) {   // a wavy bob: the head inflated, widened at the bottom, with a scalloped hem at the jaw line
  const a = H.w / 2 + 12, top = -H.h / 2 - 9, hem = H.h * .42, cx = -Math.sin(yaw) * H.w * .1;
  c.beginPath(); c.moveTo(cx - a - 6, hem);
  c.bezierCurveTo(cx - a - 10, -H.h * .1, cx - a, top, cx, top); c.bezierCurveTo(cx + a, top, cx + a + 10, -H.h * .1, cx + a + 6, hem);
  const n = 5; for (let i = 0; i <= n; i++) { const x = cx + a + 6 - (2 * a + 12) * i / n; c.quadraticCurveTo(x + (a * 2 + 12) / n * .5, hem + 14, x, hem); }
  c.closePath();
}
function meiBob(c, H, yaw) {
  const a = H.w / 2 + 11, top = -H.h / 2 - 10, hem = H.h * .38, cx = -Math.sin(yaw) * H.w * .08;
  c.beginPath(); c.moveTo(cx - a, hem);
  c.bezierCurveTo(cx - a - 4, -H.h * .2, cx - a * .85, top, cx, top); c.bezierCurveTo(cx + a * .85, top, cx + a + 4, -H.h * .2, cx + a, hem);
  c.quadraticCurveTo(cx + a * .95, hem + 8, cx + a * .8, hem + 6); c.lineTo(cx - a * .8, hem + 6); c.quadraticCurveTo(cx - a * .95, hem + 8, cx - a, hem); c.closePath();
}

// ---------------- head ----------------
function drawHead(c, ch, yaw, f, o) {
  const H = ch.head, look = f.look || [Math.sin(yaw) * .5, 0];
  const style = HAIR[ch.hairStyle];
  style.back(c, ch, H, yaw, o);
  // ears (behind the face plane, in front of the back hair)
  const ears = front => { for (const sd of [-1, 1]) { const p = proj(H, sd * PI / 2, yaw); if (p.v < -.35 || (p.v > .3) !== front) continue; const x = p.x * .98 - (front ? H.w * .06 : 0); ell(c, x, H.h * .06, H.w * .085, H.w * .12); c.fillStyle = ch.skin; c.fill(); ell(c, x + sd * .5, H.h * .07, H.w * .04, H.w * .065); c.fillStyle = dk(ch.skin, .12); c.fill(); } };
  ears(false);
  headPath(c, H, 0); c.fillStyle = ch.skin; c.fill();
  ears(true);
  // nose: a flat darker wedge on the face; on the profile it breaks the outline
  const ny = H.h * .2, np = proj(H, 0, yaw, ny), nw = H.w * .075;
  c.fillStyle = dk(ch.skin, .15);
  if (np.v > .5) { const k = Math.sin(yaw); c.beginPath(); c.moveTo(np.x + k * nw * .4, ny - nw * 1.2); c.quadraticCurveTo(np.x + nw * (.9 + k), ny + nw * .5, np.x + nw * .3, ny + nw * .62); c.quadraticCurveTo(np.x - nw * .6, ny + nw * .7, np.x - nw * .7 + k * nw * .6, ny + nw * .25); c.quadraticCurveTo(np.x - nw * .2, ny - nw * .2, np.x + k * nw * .4, ny - nw * 1.2); c.fill(); }
  else { const px = np.x - 2; c.fillStyle = ch.skin; c.beginPath(); c.moveTo(px, ny - nw * 2); c.quadraticCurveTo(px + nw * 1.6, ny - nw * .2, px + nw * 1.25, ny + nw * .45); c.quadraticCurveTo(px + nw * .7, ny + nw * .85, px - 2, ny + nw * .7); c.closePath(); c.fill(); }
  c.save(); headPath(c, H, 0); c.clip();
  // eyes + brows + mouth by longitude
  const ey = H.h * .055, by = -H.h * .135, my = H.h * .33;
  const brows = f.brow || [[0, 0], [0, 0]];
  [-.42, .42].forEach((phi, i) => {
    const p = proj(H, phi, yaw); if (p.v < .1) return;
    const s = Math.pow(p.v, .7);
    drawEye(c, ch, H, p.x, ey, s, f, i, look);
  });
  // blush (temporary, embarrassed only) + sweat
  if (f.blush > 0) for (const phi of [-.62, .62]) { const p = proj(H, phi, yaw, H.h * .22); if (p.v < .15) continue; ell(c, p.x, H.h * .22, H.w * .1 * p.v, H.w * .055); c.fillStyle = rgba(P.red, .32 * f.blush); c.fill(); }
  const mp = proj(H, .02, yaw, my), mw = H.w * .3 * (.55 + .45 * Math.max(.3, mp.v));
  drawMouth(c, ch, mp.x, my, mw, f);
  c.restore();
  style.front(c, ch, H, yaw, o);
  [-.4, .4].forEach((phi, i) => { const p = proj(H, phi, yaw); if (p.v < .1) return; const br = brows[i]; drawBrow(c, ch, H, p.x, by, Math.pow(p.v, .6), br[0], br[1], i); });
  if (ch.glasses) glasses(c, ch, H, yaw, ey);
  if (f.sweat > 0) { const p = proj(H, 1.0, yaw); const x = p.x + H.w * .02, y = -H.h * .16; c.fillStyle = rgba('#7EC4E6', f.sweat); c.beginPath(); c.moveTo(x, y - H.w * .12); c.bezierCurveTo(x + H.w * .07, y - H.w * .02, x + H.w * .07, y + H.w * .07, x, y + H.w * .07); c.bezierCurveTo(x - H.w * .07, y + H.w * .07, x - H.w * .07, y - H.w * .02, x, y - H.w * .12); c.fill(); }
}
function glasses(c, ch, H, yaw, ey) {
  const G = ch.glasses, R = H.w * .085 * G.r, lw = H.w * .03 * (G.thick || 1);
  c.strokeStyle = G.col; c.lineWidth = lw;
  const ps = [-.42, .42].map(phi => proj(H, phi, yaw));
  ps.forEach(p => { if (p.v < .1) return; ell(c, p.x, ey + H.h * .01, R * Math.pow(p.v, .7), R); c.stroke(); });
  if (ps[0].v > .1 && ps[1].v > .1) { const x0 = ps[0].x + R * Math.pow(ps[0].v, .7), x1 = ps[1].x - R * Math.pow(ps[1].v, .7); c.beginPath(); c.moveTo(x0, ey - R * .2); c.quadraticCurveTo((x0 + x1) / 2, ey - R * .55, x1, ey - R * .2); c.stroke(); }
  if (yaw > 1.15) { const p = ps[0], e = proj(H, -PI / 2, yaw); c.beginPath(); c.moveTo(p.x - R * Math.pow(p.v, .7), ey - R * .2); c.lineTo(e.x + 4, H.h * .02); c.stroke(); }
}

// ---------------- body ----------------
function torsoPath(c, T, t) {
  const k = 1 - .36 * t, sw = T.sw * k, ww = T.ww * k, hw = T.hw * k, th = T.th, r = T.r * (1 - .3 * t), hem = T.hem;
  c.beginPath();
  c.moveTo(-sw / 2 + r, -th);
  c.lineTo(sw / 2 - r, -th); c.quadraticCurveTo(sw / 2, -th, sw / 2, -th + r);
  c.bezierCurveTo(sw / 2, -th * .6, ww / 2, -th * .55, ww / 2, -th * .4); c.bezierCurveTo(ww / 2, -th * .2, hw / 2, -th * .1, hw / 2, hem - 6);
  c.quadraticCurveTo(hw / 2, hem, hw / 2 - 6, hem); c.lineTo(-hw / 2 + 6, hem); c.quadraticCurveTo(-hw / 2, hem, -hw / 2, hem - 6);
  c.bezierCurveTo(-hw / 2, -th * .1, -ww / 2, -th * .2, -ww / 2, -th * .4); c.bezierCurveTo(-ww / 2, -th * .55, -sw / 2, -th * .6, -sw / 2, -th + r);
  c.quadraticCurveTo(-sw / 2, -th, -sw / 2 + r, -th); c.closePath();
}
function drawTorso(c, ch, t) {
  const T = ch.torso, top = ch.top, th = T.th, k = 1 - .36 * t, cx = T.sw * k * .3 * Math.sin(t * PI / 2) * .9, hem = T.hem;
  torsoPath(c, T, t); c.fillStyle = top.base; c.fill();
  c.save(); torsoPath(c, T, t); c.clip();
  const nw = ch.neck.w;
  if (top.style === 'blazer') {
    // white tee in a V between two navy panels, lapels as the flat darker shape, one button
    const vx = cx, vb = -th * .3, op = nw * .95;
    c.fillStyle = top.outer;
    c.beginPath(); c.moveTo(-300, -th - 5); c.lineTo(vx - op, -th - 5); c.lineTo(vx - 3, vb); c.lineTo(vx - 2, hem + 5); c.lineTo(-300, hem + 5); c.fill();
    c.beginPath(); c.moveTo(300, -th - 5); c.lineTo(vx + op, -th - 5); c.lineTo(vx + 3, vb); c.lineTo(vx + 2, hem + 5); c.lineTo(300, hem + 5); c.fill();
    // a hint of the open front below the button
    c.fillStyle = dk(top.outer, .2); c.beginPath(); c.moveTo(vx - 1.5, vb + 14); c.lineTo(vx + 1.5, vb + 14); c.lineTo(vx + 9, hem + 5); c.lineTo(vx - 9, hem + 5); c.fill();
    c.fillStyle = dk(top.outer, .2);
    for (const s of [-1, 1]) { if (t > .6 && s > 0) continue; c.beginPath(); c.moveTo(vx + s * op, -th - 2); c.lineTo(vx + s * (op + 16) * (s > 0 ? 1 - .5 * t : 1), -th * .62); c.lineTo(vx + s * 3, vb); c.closePath(); c.fill(); }
    ell(c, vx + 6, vb + 10, 3.6, 3.6); c.fillStyle = P.ink; c.fill();
    c.fillStyle = top.base; c.beginPath(); c.moveTo(vx - op + 2, -th - 4); c.quadraticCurveTo(vx, -th + 12, vx + op - 2, -th - 4); c.lineTo(vx + op - 6, -th + 2); c.quadraticCurveTo(vx, -th + 16, vx - op + 6, -th + 2); c.fill();   // tee neckband
  } else if (top.style === 'cardigan' || top.style === 'cardiganLong') {
    const vx = cx, op = top.style === 'cardigan' ? nw * .75 : nw * .85, vb = top.style === 'cardigan' ? -th * .45 : -th * .35;
    c.fillStyle = top.outer;
    c.beginPath(); c.moveTo(-300, -th - 5); c.lineTo(vx - op, -th - 5); c.quadraticCurveTo(vx - op * .3, vb - 10, vx - 4, vb); c.lineTo(vx - 6, hem + 5); c.lineTo(-300, hem + 5); c.fill();
    c.beginPath(); c.moveTo(300, -th - 5); c.lineTo(vx + op, -th - 5); c.quadraticCurveTo(vx + op * .3, vb - 10, vx + 4, vb); c.lineTo(vx + 6, hem + 5); c.lineTo(300, hem + 5); c.fill();
    c.fillStyle = dk(top.outer, .14);   // ribbed hem band + the front edge
    c.fillRect(-300, hem - 12, 600, 20);
    c.fillStyle = P.cream; for (let i = 0; i < 3; i++) { ell(c, vx - 7, vb + 12 + i * (hem - vb - 18) / 3, 3, 3); c.fill(); }
    if (top.badge) { c.save(); c.translate(vx + 26 * (1 - .4 * t), -th * .52); c.rotate(.05); c.fillStyle = P.navy; c.beginPath(); c.roundRect(-11, -7, 22, 14, 2.5); c.fill(); c.fillStyle = P.cream; c.fillRect(-7, -2.5, 14, 2); c.fillRect(-7, 1.5, 9, 2); c.restore(); }
    if (top.style === 'cardiganLong') { c.fillStyle = dk(top.outer, .14); c.beginPath(); c.roundRect(vx - 48 * k, -th * .3, 22 * k, 18, 3); c.fill(); }
  } else if (top.style === 'tee') {
    c.fillStyle = ch.skin; c.beginPath(); c.ellipse(cx * 1.1, -th - 2, nw * 1.05, 15, 0, 0, PI); c.fill();   // scoop neckline
    c.fillStyle = dk(top.base, .14); c.fillRect(-300, -th * .08, 600, 6);                                 // tucked-in line (skirt follows)
  } else if (top.style === 'hoodie') {
    c.fillStyle = dk(top.base, .14);
    c.beginPath(); c.roundRect(cx - 40 * k, -th * .38, 80 * k, th * .32, [14, 14, 4, 4]); c.fill();                // kangaroo pocket
    c.fillRect(-300, hem - 13, 600, 14);                                                                    // ribbed hem
    c.strokeStyle = P.cream; c.lineWidth = 3; c.lineCap = 'round';
    for (const s of [-1, 1]) { if (t > .7 && s > 0) continue; c.beginPath(); c.moveTo(cx + s * 9, -th + 8); c.lineTo(cx + s * 11, -th * .62); c.stroke(); }
  } else if (top.style === 'sweater') {
    c.fillStyle = dk(top.base, .13); c.fillRect(-300, hem - 15, 600, 16);
    c.fillStyle = P.cream;   // shirt collar points
    for (const s of [-1, 1]) { if (t > .7 && s > 0) continue; c.beginPath(); c.moveTo(cx + s * 2, -th + 4); c.lineTo(cx + s * nw * .95, -th - 2); c.lineTo(cx + s * nw * .55, -th + 15); c.closePath(); c.fill(); }
  }
  c.restore();
}
function drawNeck(c, ch, t) {
  const N = ch.neck, T = ch.torso, cx = T.sw * (1 - .36 * t) * .3 * Math.sin(t * PI / 2) * .9 * .6;
  c.fillStyle = dk(ch.skin, .14); c.beginPath(); c.roundRect(cx - N.w / 2, -T.th - N.h - 14, N.w, N.h + 22, N.w * .3); c.fill();
  if (ch.top.style === 'hoodie') {   // the hood lying behind the neck
    c.fillStyle = dk(ch.top.base, .14); ell(c, cx - 6 * t, -T.th + 2, N.w * 1.55, 14); c.fill();
  }
}

// two-bone limbs
function solve(sh, A, L1, L2) {
  if (A.ik) {
    let tx = A.ik[0] * (L1 + L2), ty = A.ik[1] * (L1 + L2), d = Math.hypot(tx, ty); const mx = (L1 + L2) * .995;
    if (d > mx) { tx *= mx / d; ty *= mx / d; d = mx; } d = Math.max(d, Math.abs(L1 - L2) + 1);
    const base = Math.atan2(ty, tx), A1 = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1)), ang = base + (A.bend || 1) * A1;
    const el = [sh[0] + L1 * Math.cos(ang), sh[1] + L1 * Math.sin(ang)], wr = [sh[0] + tx, sh[1] + ty];
    return { el, wr, ang: Math.atan2(wr[1] - el[1], wr[0] - el[0]) };
  }
  const a1 = A.a1 || 0, a2 = a1 + (A.a2 || 0);
  const el = [sh[0] + L1 * Math.sin(a1), sh[1] + L1 * Math.cos(a1)], wr = [el[0] + L2 * Math.sin(a2), el[1] + L2 * Math.cos(a2)];
  return { el, wr, ang: Math.atan2(wr[1] - el[1], wr[0] - el[0]) };
}

// mitten hands: local frame at the wrist, +x along the forearm; side = which edge the thumb is on (±1)
export function drawHand(c, ch, x, y, ang, kind = 'open', side = 1, rot = 0) {
  const s = ch.arm.hand, sk = ch.skin, sd = dk(sk, .14);
  c.save(); c.translate(x, y); c.rotate(ang + rot);
  c.fillStyle = sk;
  const palm = (l, w) => { c.beginPath(); c.roundRect(-s * .12, -w / 2, l, w, w * .48); c.fill(); };
  const thumb = (x0, y0, x1, y1, w = s * .34) => tube(c, [[x0, y0], [x1, y1]], w, sk);
  switch (kind) {
    case 'fist': case 'hold':
      palm(s * .95, s * .9); thumb(s * .3, side * s * .3, s * .62, side * s * .22);
      c.strokeStyle = sd; c.lineWidth = s * .06; c.lineCap = 'round'; c.beginPath(); c.moveTo(s * .58, -s * .32 * side); c.lineTo(s * .58, s * .06 * side); c.stroke(); break;
    case 'point':
      palm(s * .9, s * .86); tube(c, [[s * .4, -side * s * .2], [s * 1.55, -side * s * .2]], s * .3, sk); thumb(s * .3, side * s * .26, s * .62, side * s * .1);
      c.strokeStyle = sd; c.lineWidth = s * .055; c.lineCap = 'round'; c.beginPath(); c.moveTo(s * .55, s * .02 * side); c.lineTo(s * .74, s * .02 * side); c.stroke(); break;
    case 'wave': case 'open':
      palm(s * 1.28, s * .92); thumb(s * .25, side * s * .32, s * .58, side * s * .66);
      if (kind === 'wave') { c.strokeStyle = sd; c.lineWidth = s * .055; c.lineCap = 'round'; for (const k of [-.14, .12]) { c.beginPath(); c.moveTo(s * .92, k * s); c.lineTo(s * 1.12, k * s); c.stroke(); } }
      break;
    case 'relax':   // hanging hand: thumb lying along the palm
      palm(s * 1.22, s * .9); thumb(s * .22, side * s * .3, s * .7, side * s * .36, s * .32); break;
    case 'flat':   // palm pressed on something (chest, hip)
      palm(s * 1.2, s * .86); thumb(s * .2, side * s * .3, s * .52, side * s * .5); break;
    case 'tuck': break;
  }
  c.restore();
}
function drawArm(c, ch, sh, A, o) {
  const R = ch.arm, { el, wr, ang } = solve(sh, A, R.up, R.fore), sleeve = ch.top.sleeve ?? 1;
  const col = ch.top.style === 'blazer' || ch.top.style.startsWith('cardigan') ? ch.top.outer : ch.top.base;
  const sk = o.far ? dk(ch.skin, .12) : ch.skin, sc = o.far ? dk(col, .16) : col;
  const pts = [sh, el, wr];
  // separation edge where the arm crosses its own body (clipped to the torso shape)
  if (o.clip) { c.save(); c.translate(o.clip.x, o.clip.y); c.rotate(o.clip.r || 0); torsoPath(c, ch.torso, o.t); c.restore(); c.save(); c.clip(); tube(c, pts, R.w + 5, dk(sc, .3)); c.restore(); }
  // the sleeve runs from the shoulder to `sleeve` of the arm's length
  const L1 = R.up, L2 = R.fore, Ls = (L1 + L2) * sleeve;
  const sp = Ls <= L1 ? [sh, [sh[0] + (el[0] - sh[0]) * Ls / L1, sh[1] + (el[1] - sh[1]) * Ls / L1]] : [sh, el, [el[0] + (wr[0] - el[0]) * Math.min(1, (Ls - L1) / L2) * (sleeve >= 1 ? .86 : 1), el[1] + (wr[1] - el[1]) * Math.min(1, (Ls - L1) / L2) * (sleeve >= 1 ? .86 : 1)]];
  if (sleeve < 1) { const e = sp[sp.length - 1]; tube(c, Ls <= L1 ? [e, el, wr] : [e, wr], R.w * .82, sk); }
  else tube(c, [el, wr], R.w * .82, sk);
  tube(c, sp, R.w, sc, sleeve >= 1 ? 'butt' : 'round'); ell(c, sh[0], sh[1], R.w / 2, R.w / 2); c.fillStyle = sc; c.fill();
  if (sleeve >= 1) { const e = sp[sp.length - 1], q = sp[sp.length - 2], a = Math.atan2(e[1] - q[1], e[0] - q[0]); c.save(); c.translate(e[0], e[1]); c.rotate(a); c.fillStyle = ch.top.cuff ? ch.top.cuff : (ch.top.style === 'hoodie' || ch.top.style === 'sweater' ? dk(sc, .14) : sc); c.beginPath(); c.roundRect(-R.w * .25, -R.w * .52, R.w * .5, R.w * 1.04, R.w * .3); c.fill(); c.restore(); }
  else { const e = sp[sp.length - 1]; ell(c, e[0], e[1], R.w * .5, R.w * .5); c.fillStyle = sc; c.fill(); }
  if (o.prop) o.prop(c, wr[0], wr[1], ang);
  if (A.hand !== 'tuck') drawHand(c, ch, wr[0], wr[1], ang, A.hand || 'open', A.thumb ?? (o.b ? -1 : 1), A.hr || 0);
  return { el, wr, ang };
}
function drawLeg(c, ch, hip, Lg, far) {
  const G = ch.leg, L1 = (G.len - 14) * .5, L2 = (G.len - 14) * .5;
  const a1 = Lg.h || 0, a2 = a1 - (Lg.k || 0);
  const kn = [hip[0] + L1 * Math.sin(a1), hip[1] + L1 * Math.cos(a1)], an = [kn[0] + L2 * Math.sin(a2), kn[1] + L2 * Math.cos(a2)];
  return { kn, an };
}
function legColour(ch, part, far) {
  const lw = ch.lower, base = part === 'skin' ? ch.skin : lw.col;
  return far ? dk(base, .14) : base;
}
function drawShoe(c, ch, an, t, splay, rot, far) {
  const G = ch.leg, fl = G.foot, fh = G.w * .62, col = far ? dk(G.shoe, .12) : G.shoe;
  c.save(); c.translate(an[0], an[1]); c.rotate(rot);
  const sx = lerp(.48, 1, ss(t * 1.6)) * (t < .3 ? splay : 1);
  c.scale(sx, 1);
  c.fillStyle = col;
  c.beginPath(); c.moveTo(-fl * .32, fh * .9); c.lineTo(fl * .78, fh * .9); c.quadraticCurveTo(fl * .9, fh * .9, fl * .86, fh * .35); c.quadraticCurveTo(fl * .7, -fh * .15, fl * .3, -fh * .15); c.lineTo(-fl * .2, -fh * .3); c.quadraticCurveTo(-fl * .36, -fh * .25, -fl * .34, fh * .3); c.closePath(); c.fill();
  if (G.sole) { c.fillStyle = far ? dk(G.sole, .12) : G.sole; c.beginPath(); c.roundRect(-fl * .33, fh * .62, fl * 1.18, fh * .3, fh * .14); c.fill(); }
  c.restore();
}

// ---------------- the character ----------------
// po: { turn, dir, face (object or name), arms:{a,b}, legs:{a,b} | null, lean, headTilt, prop:{hand:'a'|'b', draw(c,x,y,ang)}, swing, sil }
export const STAND = { a: { h: -.03, k: 0, r: 0 }, b: { h: .03, k: 0, r: 0 } };
export const STAND34 = { a: { h: .1, k: .03, r: 0 }, b: { h: -.09, k: .05, r: 0 } };
export function drawChar(c, ch, x, y, s, po = {}) {
  ch = typeof ch === 'string' ? CAST[ch] : ch;
  const t = clamp(po.turn ?? 0, 0, 1), yaw = t * PI / 2 * (.74 + .26 * t * t * t), f = typeof po.face === 'string' ? EXPR[po.face] : (po.face || EXPR.neutral);
  const T = ch.torso, G = ch.leg, legs = po.legs || (t > .25 ? STAND34 : STAND);
  // legs first (hip-relative), then find the ground under the lowest foot
  const gap = G.gap * (1 - .7 * t), hipA = [-gap / 2 + 4 * t, 0], hipB = [gap / 2 - 4 * t, 0];
  const LA = drawLeg(c, ch, hipA, legs.a), LB = drawLeg(c, ch, hipB, legs.b);
  const fh = G.w * .62 * .9;
  const footLow = (L, r) => L.an[1] + fh * Math.cos(r) + Math.abs(Math.sin(r)) * G.foot * .55;
  const ground = Math.max(footLow(LA, legs.a.r || 0), footLow(LB, legs.b.r || 0));
  c.save(); c.translate(x, y); c.scale(s * (po.dir || 1), s); c.translate(0, -ground);
  if (!po.noShadow && !po.sil) { ell(c, 4 * t, ground + 2, (T.hw * .62 + 18) * (1 - .25 * t) + G.foot * .4 * t, 9); c.fillStyle = rgba(P.ink, .13); c.fill(); }
  const lean = po.lean || 0, sid = t > .25;
  const shY = -T.th + T.r * .45, swA = T.sw * (1 - .36 * t) / 2 - ch.arm.w * .32;
  const shA = [lerp(-swA, -swA * .1, t), shY], shB = [lerp(swA, swA * .25, t), shY];
  const arms = po.arms || {}, armA = arms.a || ARM.rest, armB = arms.b || mirrorArm(ARM.rest);
  const bodyX = c.getTransform();
  const pushBody = () => { c.rotate(lean); };
  const drawLegs = () => {
    const lw = ch.lower;
    const order = sid ? [[LB, legs.b, true], [LA, legs.a, false]] : [[LA, legs.a, false], [LB, legs.b, false]];
    for (const [L, Lg, far] of order) {
      const hip = L === LA ? hipA : hipB, skirt = lw.kind === 'skirt';
      tube(c, [hip, L.kn, L.an], G.w, skirt ? legColour(ch, 'skin', far) : legColour(ch, 'lower', far));
      if (!skirt && lw.cuff) { const a = Math.atan2(L.an[1] - L.kn[1], L.an[0] - L.kn[0]); c.save(); c.translate(L.an[0] - Math.cos(a) * 8, L.an[1] - Math.sin(a) * 8); c.rotate(a); c.fillStyle = dk(legColour(ch, 'lower', far), .1); c.fillRect(-4, -G.w * .55, 8, G.w * 1.1); c.restore(); }
      drawShoe(c, ch, [L.an[0], L.an[1] + 2], t, L === LA ? -1 : 1, Lg.r || 0, far);
    }
    if (lw.kind === 'trousers') { c.fillStyle = lw.col; c.beginPath(); c.roundRect(-gap / 2 - G.w / 2 + 2, -16, gap + G.w - 4, 34, 10); c.fill(); }
  };
  const drawSkirt = () => {
    const lw = ch.lower; if (lw.kind !== 'skirt') return;
    const k = 1 - .3 * t, top = -T.th * .12, len = G.len * lw.len, w0 = T.hw * k * .98, w1 = T.hw * k * lw.flare;
    c.fillStyle = lw.col; c.beginPath(); c.moveTo(-w0 / 2, top); c.lineTo(w0 / 2, top); c.quadraticCurveTo(w1 / 2, len * .5, w1 / 2 + 4, len); c.quadraticCurveTo(0, len + 8, -w1 / 2 - 4, len); c.quadraticCurveTo(-w1 / 2, len * .5, -w0 / 2, top); c.fill();
    c.fillStyle = dk(lw.col, .16); c.beginPath(); c.moveTo(w1 * .1, len * .25); c.lineTo(w1 * .26, len + 3); c.lineTo(w1 * .08, len + 6); c.closePath(); c.fill();   // one fold
  };
  const neckTop = -T.th - ch.neck.h, headC = [T.sw * (1 - .36 * t) * .3 * Math.sin(yaw) * .9 * .6 + (po.headX || 0), neckTop - ch.head.h / 2 + 10];
  const drawHeadAt = () => { c.save(); c.translate(headC[0], headC[1] + ch.head.h / 2); c.rotate(po.headTilt || 0); c.translate(0, -ch.head.h / 2); drawHead(c, ch, yaw, f, po); c.restore(); };
  const clipT = { x: 0, y: 0, r: 0 };
  const armDraw = (A, sh, far, b) => {
    return drawArm(c, ch, sh, A, { far, clip: far ? null : clipT, t, b, prop: po.prop && po.prop.hand === (b ? 'b' : 'a') ? po.prop.draw : null });
  };

  if (sid) { c.save(); pushBody(); armDraw(armB, shB, true, true); c.restore(); }
  drawLegs();
  c.save(); pushBody();
  drawNeck(c, ch, t);
  if (ch.lower.kind === 'skirt' && ch.top.style === 'tee') { drawSkirt(); drawTorso(c, ch, t); } else { drawTorso(c, ch, t); drawSkirt(); }
  drawHeadAt();
  if (!sid) { if (armB.front === false) { } armDraw(armB, shB, false, true); }
  armDraw(armA, shA, false, false);
  if (po.over) po.over(c, { headC, shA, shB });
  c.restore();
  c.restore();
}

// ---------------- poses ----------------
export const mirrorArm = A => A.ik ? { ...A, ik: [-A.ik[0], A.ik[1]], bend: -(A.bend || 1), thumb: A.thumb != null ? -A.thumb : undefined } : { ...A, a1: -(A.a1 || 0), a2: -(A.a2 || 0), hr: A.hr != null ? -A.hr : undefined, thumb: A.thumb != null ? -A.thumb : undefined };
// arm 'a' (screen-left in the front view); angles: a1 from straight down, + swings toward +x; a2 elbow (relative)
export const ARM = {
  rest: { a1: -.07, a2: .1, hand: 'relax', hr: 0, thumb: 1 },
  wave: { a1: -2.25, a2: -.85, hand: 'wave', thumb: -1, hr: 0 },
  hip: { ik: [-.08, .6], bend: 1, hand: 'flat', hr: .5, thumb: 1 },
  point: { a1: 1.45, a2: .05, hand: 'point', thumb: 1 },
  chest: { ik: [.5, .3], bend: 1, hand: 'flat', hr: -.25, thumb: -1 },
  cup: { ik: [.36, .42], bend: 1, hand: 'hold', thumb: -1, hr: -.1 },
  offer: { ik: [.74, .35], bend: 1, hand: 'hold', thumb: -1, hr: -.2 },
  scratch: { ik: [-.02, -.9], bend: -1, hand: 'fist', thumb: 1, hr: .5 },
  crossTop: { ik: [.78, .34], bend: 1, hand: 'tuck' },
  crossUnder: { ik: [.8, .44], bend: 1, hand: 'fist', hr: -.3, thumb: -1 },
  shrug: { ik: [-.42, .3], bend: 1, hand: 'open', hr: -1.4, thumb: 1 },
};
export const B = name => mirrorArm(ARM[name]);   // the same pose on arm 'b'

// walk cycle (side / 3/4, facing +x): 4 keys — contact, down, passing, up. legs h = thigh angle (+ forward), k = knee bend, r = foot rotation
export const WALK = [
  { name: 'contact', legs: { a: { h: .42, k: .04, r: -.28 }, b: { h: -.36, k: .3, r: .55 } }, arms: { a: { a1: -.42, a2: .2, hand: 'open', hr: .1 }, b: { a1: .48, a2: .45, hand: 'open', hr: .1 } }, lean: .03 },
  { name: 'down', legs: { a: { h: .26, k: .32, r: 0 }, b: { h: -.3, k: .8, r: .6 } }, arms: { a: { a1: -.3, a2: .2, hand: 'open', hr: .1 }, b: { a1: .34, a2: .5, hand: 'open', hr: .1 } }, lean: .05 },
  { name: 'passing', legs: { a: { h: 0, k: .04, r: 0 }, b: { h: .32, k: 1.05, r: .25 } }, arms: { a: { a1: -.05, a2: .25, hand: 'open', hr: .1 }, b: { a1: .05, a2: .3, hand: 'open', hr: .1 } }, lean: .04 },
  { name: 'up', legs: { a: { h: -.26, k: .02, r: .3 }, b: { h: .4, k: .45, r: -.1 } }, arms: { a: { a1: .25, a2: .4, hand: 'open', hr: .1 }, b: { a1: -.3, a2: .2, hand: 'open', hr: .1 } }, lean: .03 },
];

// a paper coffee cup in the hand (drawn at the wrist; ang = forearm angle)
export function drawCup(c, x, y, ang, s = 1, steam = true) {
  c.save(); c.translate(x + Math.cos(ang) * 12 * s, y + Math.sin(ang) * 12 * s);
  const w = 26 * s, h = 38 * s;
  c.translate(0, -h * .45);
  c.fillStyle = P.cream; c.beginPath(); c.moveTo(-w / 2, -h / 2); c.lineTo(w / 2, -h / 2); c.lineTo(w * .4, h / 2); c.lineTo(-w * .4, h / 2); c.closePath(); c.fill();
  c.fillStyle = P.navy; c.beginPath(); c.moveTo(-w * .47, -h * .12); c.lineTo(w * .47, -h * .12); c.lineTo(w * .43, h * .2); c.lineTo(-w * .43, h * .2); c.closePath(); c.fill();
  c.fillStyle = P.teal; c.beginPath(); c.roundRect(-w * .58, -h * .66, w * 1.16, h * .2, 3 * s); c.fill(); c.fillRect(-w * .38, -h * .74, w * .76, h * .1);
  if (steam) { c.strokeStyle = rgba(P.ink, .18); c.lineWidth = 3 * s; c.lineCap = 'round'; for (const dx of [-5, 5]) { c.beginPath(); c.moveTo(dx * s, -h * .82); c.bezierCurveTo((dx - 6) * s, -h * 1.05, (dx + 6) * s, -h * 1.15, dx * s, -h * 1.4); c.stroke(); } }
  c.restore();
}
