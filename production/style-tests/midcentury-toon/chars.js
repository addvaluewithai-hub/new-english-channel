// Youssef and Mia, drawn in the mid-century engine (held bodies, moving hands / eyes / mouth).
// Local units: feet at (0,0), top of hair ≈ -570, facing +x (dir -1 mirrors).
import { PAL, LW, REG, shape, ink, ellipse, spline, xform, move, rrect, rect, TAU, clamp, lerp, reg, path, hash } from './engine/toon.js';

export const COL = {
  ySkin: '#A86E45', ySkinD: '#8A5634', yHair: '#1F1814', yBeard: '#2C201B',
  navy: '#2F3B5E', navyD: '#222B47', denim: '#5A77A8', denimD: '#43598A', shoe: '#7B4B2E',
  case: '#C8473A', caseD: '#9C3229', caseL: '#E07A68',
  mSkin: '#F5D2B4', mSkinD: '#E3AE8C', mHair: '#B9532A', mHairD: '#8E3B1C',
  mustard: PAL.mustard, mustardD: PAL.mustardD, teal: PAL.teal, tealD: PAL.tealD, plum: PAL.plum,
  blush: '#D9604E', sweat: '#CFE6EE',
};

// ---------------------------------------------------------------- small helpers
export function ik(sh, tg, L1, L2, bend = 1) {
  const dx = tg[0] - sh[0], dy = tg[1] - sh[1];
  const d = clamp(Math.hypot(dx, dy), Math.abs(L1 - L2) + 1, L1 + L2 - 0.5);
  const base = Math.atan2(dy, dx);
  const al = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
  const a1 = base + bend * al;
  const el = [sh[0] + Math.cos(a1) * L1, sh[1] + Math.sin(a1) * L1];
  const a2 = Math.atan2(tg[1] - el[1], tg[0] - el[0]);
  return { a1, a2 };
}
// a limb as a body volume: an ink ribbon with a colour ribbon printed off-register on top
function limb(ctx, P, W, col, seed) {
  ink(ctx, P, W + 8.5 * LW.k, { seed, taper: false, wob: 0.06, lk: 1 });
  const o = reg(seed, 0.6);
  ink(ctx, move(P, o[0], o[1]), W, { seed: seed + 1, taper: false, wob: 0.04, color: col, lk: 1 });
}

// four-finger cartoon glove (lifted from the style engine, with skin colour + line compensation)
export function drawHand(ctx, x, y, a, kind = 'open', side = 1, k = 1, skin = PAL.skin) {
  const parts = [], seps = [];
  const E = (cx, cy, rx, ry, rot = 0) => parts.push(ellipse(cx, cy, rx, ry, 18, 0, TAU, rot));
  E(12, 0, 15, 13.5);
  if (kind === 'open') {
    [-0.62, 0, 0.62].forEach(r => E(12 + Math.cos(r) * 25, Math.sin(r) * 25, 12, 5, r));
    E(4, -15 * side, 10, 5, -1.35 * side);
  } else if (kind === 'flat') {
    [-10, 0, 10].forEach((dy, i) => E(34 + (i === 1 ? 3 : 0), dy, 13, 4.8));
    E(10, -15 * side, 9, 5, -0.9 * side);
    seps.push([[24, -5], [40, -5]], [[24, 5], [40, 5]]);
  } else if (kind === 'point') {
    E(38, -5 * side, 19, 4.8); E(25, 5 * side, 7, 6); E(20, 11 * side, 6, 5.5); E(8, -14 * side, 8.5, 5, -1.0 * side);
  } else if (kind === 'scratch') {
    // fingers curled forward (scratching): three short bent ellipses
    [-0.5, 0, 0.5].forEach(r => E(12 + Math.cos(r) * 20, Math.sin(r) * 20, 9, 5, r + 0.9));
    E(4, -15 * side, 9, 5, -1.2 * side);
  } else { E(26, -8, 6.5, 6.5); E(28, 1, 6.5, 6.5); E(25, 10, 6, 6); E(12, -14 * side, 9, 5.5, -0.4 * side); seps.push([[22, -3.5], [30, -3.5]], [[22, 5.5], [29, 5.5]]); }
  const P = parts.map(p => xform(p, x, y, a, k));
  ctx.save(); ctx.strokeStyle = PAL.ink; ctx.lineWidth = 6 * k * LW.k; ctx.lineJoin = 'round';
  for (const p of P) { path(ctx, p); ctx.stroke(); }
  const o = reg(77, 0.6); ctx.fillStyle = skin;
  for (const p of P) { path(ctx, move(p, o[0] * 0.5, o[1] * 0.5)); ctx.fill(); }
  ctx.lineWidth = 2.4 * k * LW.k; ctx.lineCap = 'round';
  for (const s2 of seps) { const q = xform(s2, x, y, a, k); ctx.beginPath(); ctx.moveTo(...q[0]); ctx.lineTo(...q[1]); ctx.stroke(); }
  ctx.restore();
}

// ---------------------------------------------------------------- rig data
const RIG = {
  y: { shF: [44, -386], shB: [-38, -388], UA: 106, FA: 96, sleeve: 23, sleeveCol: COL.navy, skin: COL.ySkin,
       restF: [52, -196], restB: [-50, -198], hipF: [16, -270], hipB: [-14, -270], L1: 128, L2: 122, legW: 40, legCol: COL.denim, legColB: COL.denimD, shoe: COL.shoe },
  m: { shF: [40, -380], shB: [-34, -382], UA: 98, FA: 90, sleeve: 19, sleeveCol: COL.mustard, skin: COL.mSkin,
       restF: [48, -200], restB: [-44, -202], hipF: [14, -220], hipB: [-12, -220], L1: 90, L2: 110, legW: 17, legCol: COL.mSkin, legColB: COL.mSkinD, shoe: COL.plum },
};

function armOf(R, which, spec, t) {
  const sh = which === 'F' ? R.shF : R.shB;
  let a1, a2;
  if (spec && spec.a1 != null) { a1 = spec.a1; a2 = spec.a2; }
  else {
    const tg = (spec && spec.tg) || (which === 'F' ? R.restF : R.restB);
    ({ a1, a2 } = ik(sh, tg, R.UA, R.FA, spec && spec.bend != null ? spec.bend : (which === 'F' ? -1 : 1)));
  }
  const el = [sh[0] + Math.cos(a1) * R.UA, sh[1] + Math.sin(a1) * R.UA];
  const ha = [el[0] + Math.cos(a2) * R.FA, el[1] + Math.sin(a2) * R.FA];
  return { sh, el, ha, a2 };
}
function drawArm(ctx, R, J, hand, seed, side) {
  const P = spline([J.sh, [(J.sh[0] + J.el[0]) / 2, (J.sh[1] + J.el[1]) / 2], J.el, [(J.el[0] + J.ha[0]) / 2, (J.el[1] + J.ha[1]) / 2], J.ha], false, 6);
  limb(ctx, P, R.sleeve, R.sleeveCol, seed);
  drawHand(ctx, J.ha[0], J.ha[1], J.a2 + (hand.rot || 0), hand.kind || 'open', side, 1.05, R.skin);
}

// legs: ribbon legs from the hips. walk = phase (radians) or null for standing.
function legPose(R, walk, amp = 1) {
  if (walk == null || amp <= 0) return { F: [0.05, 0.05], B: [-0.05, -0.05], drop: 0 };
  const s = Math.sin(walk) * amp;
  const F = [0.38 * s, 0.38 * s - 0.55 * amp * Math.max(0, Math.sin(walk + 2.0))];
  const B = [-0.38 * s, -0.38 * s - 0.55 * amp * Math.max(0, Math.sin(walk + 2.0 + Math.PI))];
  const v = a => R.L1 * Math.cos(a[0]) + R.L2 * Math.cos(a[1]);
  const full = R.L1 + R.L2;
  return { F, B, drop: full - Math.max(v(F), v(B)) };
}
function drawLeg(ctx, R, hip, ang, col, seed, groundY) {
  const kn = [hip[0] + Math.sin(ang[0]) * R.L1, hip[1] + Math.cos(ang[0]) * R.L1];
  const an = [kn[0] + Math.sin(ang[1]) * R.L2, kn[1] + Math.cos(ang[1]) * R.L2];
  limb(ctx, [hip, kn, an], R.legW, col, seed);
  // shoe, flat-ish, pointing +x
  const lift = Math.max(0, groundY - 20 - an[1]);
  const fx = an[0], fy = an[1] + 10;
  const rot = lift > 4 ? -0.18 * Math.sign(ang[1] || 1) : 0;
  const sh = xform(spline([[-16, -14], [8, -18], [34, -8], [32, 2], [-16, 2]], true, 4), fx, fy, rot);
  shape(ctx, sh, { fill: R.shoe, line: 3.2, seed: seed + 5, grain: 0.15, breaks: 0.1 });
}

// ---------------------------------------------------------------- suitcase (red, rolling)
// wheel: ground contact point; lean: radians (0 upright, + leans toward +x); grip: where the handle ends (hand)
export function drawCase(ctx, wheel, lean, grip, seed = 300) {
  const u = [Math.sin(lean), -Math.cos(lean)], v = [Math.cos(lean), Math.sin(lean)];
  const H = 176, Wd = 62;
  const at = (a, b) => [wheel[0] + u[0] * a + v[0] * b, wheel[1] + u[1] * a + v[1] * b];
  const top = at(H + 6, 0);
  // telescoping handle (two chrome rods), drawn first so the case covers its foot
  const g = grip || at(H + 90, 0);
  [-11, 11].forEach((o, i) => ink(ctx, [at(H - 10, o), [g[0] + v[0] * o * 0.7, g[1] + v[1] * o * 0.7]], 4.5, { color: PAL.chromeD, seed: seed + i, taper: false, wob: 0.1 }));
  ink(ctx, [[g[0] - v[0] * 16, g[1] - v[1] * 16], [g[0] + v[0] * 16, g[1] + v[1] * 16]], 9, { seed: seed + 3, taper: false, wob: 0.1 });
  // wheels
  [[-Wd + 12], [Wd - 12]].forEach(([b], i) => shape(ctx, ellipse(...at(8, b), 10, 10, 14), { fill: PAL.ink, line: 0, grain: 0, off: [0, 0], seed: seed + 6 + i }));
  // body: a rounded rect in the case's own frame (x across, y up = -a)
  const body = rrect(-Wd, -H, 2 * Wd, H, 18).map(([px, py]) => at(-py, px));
  const shadeP = [at(-10, Wd * 0.35), at(H + 10, Wd * 0.35), at(H + 10, Wd + 10), at(-10, Wd + 10)];
  shape(ctx, body, { fill: COL.case, line: 4, seed: seed + 8, grain: 0.3, breaks: 0.12, shade: [{ pts: shadeP, color: COL.caseD, alpha: 0.6 }] });
  // ribs + a cream luggage tag
  [0.36, 0.64].forEach((f, i) => ink(ctx, [at(H * f, -Wd + 8), at(H * f, Wd - 8)], 2.6, { seed: seed + 10 + i, taper: false, color: COL.caseD }));
  const tg = at(H - 30, -Wd + 4);
  shape(ctx, xform(rrect(-10, -7, 20, 26, 4), tg[0], tg[1], lean + 0.3), { fill: PAL.white, line: 2.6, seed: seed + 14, grain: 0.1 });
  return top;
}

// ---------------------------------------------------------------- heads
function eye(ctx, x, y, o, i, sx = 1) {
  const { face, blink = 0, look = [0, 0] } = o;
  const closed = blink > 0.5 || face === 'happy' || face === 'proud';
  if (closed) {
    const up = face === 'happy' || face === 'proud';
    ink(ctx, up ? [[x - 8 * sx, y + 3], [x, y - 5], [x + 8 * sx, y + 3]] : [[x - 8 * sx, y], [x + 8 * sx, y]], 4, { seed: 80 + i, taper: false });
  } else {
    const r = face === 'wow' ? 8.6 : 7;
    shape(ctx, ellipse(x + look[0], y + look[1], r * 0.8 * sx, r * 1.3, 14), { fill: PAL.ink, line: 0, grain: 0, off: [0, 0] });
    shape(ctx, ellipse(x + look[0] + 1.5, y + look[1] - 3.5, 2.2, 2.6, 8), { fill: PAL.white, line: 0, grain: 0, off: [0, 0] });
  }
  // brows: worried = inner ends up (inner = toward the gap between the eyes)
  const inner = i === 0 ? 1 : -1;            // eye 0 is the near (left) eye in 3/4 view
  let by = y - 20, lift = 0, w = 3.6;
  if (face === 'wow') by = y - 27;
  if (face === 'proud') by = y - 24;
  if (face === 'nervous' || face === 'oops') { by = y - 22; lift = 6; }
  if (face === 'puzzled') { by = i === 0 ? y - 21 : y - 30; lift = i === 0 ? -3 : 0; }
  if (o.who === 'y') w = 5;
  const xi = x + inner * 9 * sx, xo = x - inner * 9 * sx;
  ink(ctx, [[xo, by + lift * 0.4], [xi, by - lift]], w, { seed: 90 + i, taper: true });
  if (o.who === 'm' && !closed) ink(ctx, [[xo, y - 6], [xo - inner * 6 * sx, y - 11]], 2.4, { seed: 92 + i, taper: true });
}
function mouth(ctx, x, y, o) {
  const m = o.mouth, face = o.face, lip = o.who === 'm' ? '#C4473A' : PAL.coralD;
  if (m === 'open') { shape(ctx, spline([[x - 13, y - 6], [x + 11, y - 7], [x + 8, y + 13], [x - 8, y + 13]], true, 6), { fill: lip, line: 3.2, seed: 95, grain: 0, breaks: 0 }); shape(ctx, ellipse(x, y + 8, 6, 3.5, 10), { fill: PAL.coralL, line: 0, grain: 0, off: [0, 0] }); return; }
  if (m === 'mid') { shape(ctx, ellipse(x - 1, y + 1, 10, 6.5, 16), { fill: lip, line: 3, seed: 96, grain: 0, breaks: 0 }); return; }
  if (face === 'happy') shape(ctx, spline([[x - 15, y - 6], [x + 12, y - 8], [x + 4, y + 10], [x - 9, y + 8]], true, 6), { fill: lip, line: 3.2, seed: 97, grain: 0, breaks: 0 });
  else if (face === 'wow') shape(ctx, ellipse(x - 1, y + 2, 6.5, 9, 16), { fill: lip, line: 3, seed: 98, grain: 0, breaks: 0 });
  else if (face === 'oops') ink(ctx, spline([[x - 12, y + 2], [x - 6, y - 3], [x, y + 2], [x + 6, y - 3], [x + 11, y + 1]], false, 5), 3.4, { seed: 99, taper: false });
  else if (face === 'nervous') ink(ctx, spline([[x - 13, y - 3], [x - 4, y + 3], [x + 4, y], [x + 11, y - 4]], false, 5), 3.4, { seed: 100 });
  else if (face === 'puzzled') ink(ctx, spline([[x - 9, y + 1], [x + 1, y - 1], [x + 9, y - 5]], false, 5), 3.4, { seed: 101 });
  else ink(ctx, spline([[x - 13, y - 3], [x - 1, y + 5], [x + 10, y - 3]], false, 5), 3.6, { seed: 102 });
}

const Y_CHAIN = [[50, -492], [48, -518], [32, -546], [-6, -560], [-46, -544], [-62, -502], [-60, -458], [-44, -424], [-10, -404], [24, -406], [42, -420], [50, -440], [56, -456]];
const Y_HEAD = [...spline(Y_CHAIN, false, 6), [67, -459], [77, -467], [75, -479], [63, -486]];
function headY(ctx, o) {
  shape(ctx, Y_HEAD, { fill: COL.ySkin, line: 4.2, seed: 66, grain: 0.18, breaks: 0.1, shade: [{ pts: [[-80, -600], [-26, -600], [-36, -470], [-30, -380], [-80, -380]], color: COL.ySkinD, alpha: 0.45 }] });
  // beard (clipped to the head): jaw band + chin, then a trimmed moustache
  ctx.save(); path(ctx, Y_HEAD); ctx.clip();
  const bp = [[-30, -484], [-26, -452], [-8, -432], [16, -425], [34, -426], [48, -432], [60, -446], [80, -440], [80, -390], [-80, -390], [-80, -484]];
  shape(ctx, bp, { fill: COL.yBeard, line: 0, seed: 67, grain: 0.35, off: reg(67, 0.5) });
  ctx.restore();
  shape(ctx, spline([[20, -452], [36, -459], [56, -456], [58, -449], [38, -449], [22, -446]], true, 4), { fill: COL.yBeard, line: 0, seed: 68, grain: 0.2, off: [0, 0] });
  // hair: short black cap, sideburn in front of the ear
  shape(ctx, spline([[-58, -470], [-66, -516], [-48, -554], [-8, -572], [34, -568], [56, -552], [66, -534], [56, -530], [58, -521], [44, -524], [30, -531], [10, -533], [-12, -528], [-24, -514], [-26, -490], [-34, -480], [-48, -468]], true, 6), { fill: COL.yHair, line: 3, seed: 65, grain: 0.3, breaks: 0.45 });
  ink(ctx, spline([[-6, -560], [22, -548], [40, -540]], false, 5), 2.4, { seed: 64, color: '#4A3A33', taper: true });
  // ear
  shape(ctx, ellipse(-38, -472, 10, 15, 16), { fill: COL.ySkin, line: 3.4, seed: 69, grain: 0.1, breaks: 0.2 });
  ink(ctx, [[-40, -480], [-35, -472], [-40, -464]], 2.2, { seed: 70 });
  // eyes, mouth
  [[10, -496], [40, -498]].forEach(([x, y], i) => eye(ctx, x, y, o, i, i ? 0.78 : 1));
  ink(ctx, [[58, -468], [63, -462]], 2.4, { seed: 71 });       // nostril tick
  mouth(ctx, 36, -438, o);
}

const M_CHAIN = [[48, -494], [46, -516], [30, -542], [-8, -554], [-46, -538], [-58, -498], [-54, -458], [-36, -428], [-6, -414], [22, -416], [38, -428], [44, -446], [50, -460]];
const M_HEAD = [...spline(M_CHAIN, false, 6), [62, -466], [73, -476], [64, -484]];
function headM(ctx, o, t) {
  // ponytail behind the head (swings on twos)
  const sw = 0.07 * Math.sin(t * 5.2) + (o.ponyKick || 0);
  shape(ctx, xform(spline([[0, 0], [-26, -14], [-66, 4], [-92, 52], [-86, 100], [-66, 76], [-44, 34], [-12, 14]], true, 6), -40, -548, sw), { fill: COL.mHair, line: 3.4, seed: 59, grain: 0.3, breaks: 0.2, shade: [{ pts: xform([[-60, 40], [-100, 40], [-100, 110], [-60, 110]], -40, -548, sw), color: COL.mHairD, alpha: 0.6 }] });
  shape(ctx, M_HEAD, { fill: COL.mSkin, line: 4, seed: 66, grain: 0.15, breaks: 0.1 });
  // hair cap + swept fringe
  shape(ctx, spline([[-60, -470], [-64, -516], [-44, -554], [-4, -570], [38, -562], [58, -532], [54, -510], [34, -520], [8, -530], [-16, -520], [-30, -500], [-36, -472]], true, 6), { fill: COL.mHair, line: 3, seed: 65, grain: 0.3, breaks: 0.25 });
  shape(ctx, spline([[-10, -548], [26, -556], [54, -536], [56, -512], [36, -522], [14, -520]], true, 6), { fill: COL.mHairD, line: 0, seed: 64, grain: 0.2, alpha: 0.55 });
  // hair tie
  shape(ctx, rrect(-50, -560, 20, 14, 4), { fill: COL.teal, line: 2.6, seed: 63, grain: 0 });
  // eyes, mouth, cheeks
  [[8, -494], [38, -496]].forEach(([x, y], i) => eye(ctx, x, y, o, i, i ? 0.78 : 1));
  mouth(ctx, 30, -440, o);
  shape(ctx, ellipse(-10, -460, 11, 7.5, 14), { fill: PAL.pink, line: 0, grain: 0, seed: 101, alpha: 0.9 });
}

// ---------------------------------------------------------------- full figure
// P: { who:'y'|'m', x, y, s, dir, S (on-screen scale for line comp), face, mouth, look, blink, tilt,
//      armF:{tg|a1,a2, kind}, armB:{...}, walk (phase|null), case:{...} | null, blush 0..1, drop }
export function person(ctx, P, t) {
  const R = RIG[P.who], S = P.S ?? P.s;
  const LK = LW.k, RK = REG.k;
  LW.k = lerp(1, 1 / S, 0.7); REG.k = 1 / S;
  ctx.save(); ctx.translate(P.x, P.y); ctx.scale(P.s * (P.dir ?? 1), P.s);
  // contact shadow
  if (P.shadow !== false) { ctx.save(); ctx.globalAlpha = 0.16; ctx.fillStyle = PAL.ink; ctx.beginPath(); ctx.ellipse(-10, 2, P.who === 'y' ? 150 : 90, 11, 0, 0, TAU); ctx.fill(); ctx.restore(); }
  const LP = legPose(R, P.walk, P.walkAmp ?? 1);
  const drop = LP.drop + (P.drop || 0);
  // suitcase + the back arm that holds it
  let JB;
  if (P.case) {
    const c = P.case;
    JB = armOf(R, 'B', { tg: c.grip, bend: c.bend ?? 1 });
    drawCase(ctx, c.wheel, c.lean, [JB.ha[0] + Math.cos(JB.a2) * 16, JB.ha[1] + Math.sin(JB.a2) * 16 + drop], 300);
  } else JB = armOf(R, 'B', P.armB);
  ctx.save(); ctx.translate(0, drop);
  if (!P.backArmFront) drawArm(ctx, R, JB, { kind: P.case ? 'grip' : (P.armB && P.armB.kind) || 'open' }, 72, 1);
  // legs (back first)
  if (P.who === 'm') {
    drawLeg(ctx, R, R.hipB, LP.B, COL.mSkinD, 40, -drop);
    drawLeg(ctx, R, R.hipF, LP.F, COL.mSkin, 44, -drop);
  } else {
    drawLeg(ctx, R, R.hipB, LP.B, COL.denimD, 40, -drop);
    drawLeg(ctx, R, R.hipF, LP.F, COL.denim, 44, -drop);
  }
  torso(ctx, P);
  // head (tilt around the neck)
  ctx.save(); ctx.translate(0, -410); ctx.rotate(P.tilt || 0); ctx.translate(0, 410);
  const ho = { who: P.who, face: P.face || 'smile', mouth: P.mouth, look: P.look || [0, 0], blink: P.blink || 0, ponyKick: P.ponyKick };
  if (P.who === 'y') headY(ctx, ho); else headM(ctx, ho, t);
  if (P.blush > 0) blush(ctx, P);
  if (P.sweat) P.sweat.forEach((d, i) => drop1(ctx, d, i));
  ctx.restore();
  if (P.backArmFront) drawArm(ctx, R, JB, { kind: (P.armB && P.armB.kind) || 'open', rot: (P.armB && P.armB.rot) || 0 }, 72, 1);
  drawArm(ctx, R, armOf(R, 'F', P.armF), { kind: (P.armF && P.armF.kind) || 'open', rot: (P.armF && P.armF.rot) || 0 }, 62, -1);
  ctx.restore();
  ctx.restore();
  LW.k = LK; REG.k = RK;
}

function torso(ctx, P) {
  if (P.who === 'y') {
    // neck + white T-shirt under an open navy jacket
    shape(ctx, rect(-16, -432, 34, 34), { fill: COL.ySkin, line: 0, seed: 48, grain: 0, shade: [{ pts: rect(-16, -432, 14, 34), color: COL.ySkinD, alpha: 0.6 }] });
    const jacket = spline([[-60, -384], [-44, -404], [46, -404], [62, -384], [58, -320], [62, -256], [-56, -256], [-60, -320]], true, 6);
    shape(ctx, jacket, { fill: COL.navy, line: 4.2, seed: 50, grain: 0.32, breaks: 0.16, shade: [{ pts: [[-90, -410], [-30, -410], [-34, -250], [-90, -250]], color: COL.navyD, alpha: 0.6 }] });
    shape(ctx, [[8, -404], [36, -404], [38, -258], [12, -258]], { fill: PAL.white, line: 2.8, seed: 51, grain: 0.15, breaks: 0.2 });
    ink(ctx, spline([[10, -404], [22, -394], [36, -404]], false, 4), 2.6, { seed: 52 });
    shape(ctx, [[8, -404], [-4, -400], [-2, -350], [12, -328]], { fill: COL.navyD, line: 2.6, seed: 53, grain: 0.1, breaks: 0.2 });
    shape(ctx, [[36, -404], [50, -398], [44, -350], [36, -334]], { fill: COL.navyD, line: 2.6, seed: 54, grain: 0.1, breaks: 0.2 });
    ink(ctx, [[-40, -300], [-10, -300]], 2.4, { seed: 55, color: COL.navyD });  // pocket
  } else {
    shape(ctx, rect(-14, -428, 30, 32), { fill: COL.mSkin, line: 0, seed: 48, grain: 0 });
    const skirt = spline([[-44, -300], [44, -300], [56, -230], [72, -150], [-66, -150], [-54, -230]], true, 5);
    shape(ctx, skirt, { fill: COL.teal, line: 4, seed: 56, grain: 0.3, breaks: 0.15, shade: [{ pts: [[-90, -310], [-24, -310], [-30, -140], [-90, -140]], color: COL.tealD, alpha: 0.6 }] });
    [[-14, -298, -22, -154], [22, -298, 30, -154]].forEach(([a, b, c, d], i) => ink(ctx, [[a, b], [c, d]], 2.4, { seed: 57 + i, color: COL.tealD, taper: true }));
    const card = spline([[-48, -378], [-34, -398], [36, -398], [50, -378], [44, -322], [48, -290], [-44, -290], [-46, -322]], true, 6);
    shape(ctx, card, { fill: COL.mustard, line: 4, seed: 50, grain: 0.32, breaks: 0.16, shade: [{ pts: [[-90, -410], [-26, -410], [-30, -280], [-90, -280]], color: COL.mustardD, alpha: 0.55 }] });
    shape(ctx, [[6, -398], [30, -398], [24, -330], [14, -330]], { fill: PAL.white, line: 2.6, seed: 51, grain: 0.15, breaks: 0.2 });
    shape(ctx, ellipse(6, -398, 14, 8, 16), { fill: PAL.white, line: 2.6, seed: 52, grain: 0 });
    shape(ctx, ellipse(30, -398, 14, 8, 16), { fill: PAL.white, line: 2.6, seed: 53, grain: 0 });
    [-362, -338, -312].forEach((y, i) => shape(ctx, ellipse(36, y, 4.5, 4.5, 10), { fill: PAL.ink, line: 0, grain: 0, off: [0, 0], seed: 54 + i }));
  }
}

function blush(ctx, P) {
  // the cel of embarrassment: a flat red plane rises from the jaw to just under the eyes, cheeks glow
  const k = clamp(P.blush), head = P.who === 'y' ? Y_HEAD : M_HEAD;
  const top = lerp(-404, -474, k), o = reg(88, 0.6);
  ctx.save(); path(ctx, head); ctx.clip();
  const wave = []; for (let i = 0; i <= 12; i++) { const x = -90 + i * 15; wave.push([x + o[0], top + Math.sin(i * 1.3) * 4 + o[1]]); }
  path(ctx, [...wave, [120, -380], [-90, -380]]); ctx.globalAlpha = 0.32; ctx.fillStyle = COL.blush; ctx.fill();
  ctx.globalAlpha = 0.75 * k;
  [[-4, -466, 20], [56, -470, 13]].forEach(([x, y, r]) => { path(ctx, ellipse(x + o[0] * 0.5, y + o[1] * 0.5, r, r * 0.62, 16)); ctx.fill(); });
  ctx.restore();
  if (k > 0.6) {
    [[-6, -468], [54, -472]].forEach(([x, y], j) => {
      for (let i = 0; i < 3; i++) ink(ctx, [[x - 10 + i * 8, y + 5], [x - 5 + i * 8, y - 5]], 2.4, { seed: 120 + i + j * 3, color: '#A8382C', alpha: 0.9 });
    });
  }
}
function drop1(ctx, d, i) {
  // sweat drop: { x, y, k (0..1 pop) }
  if (d.k <= 0) return;
  ctx.save(); ctx.translate(d.x, d.y); ctx.scale(d.k, d.k); ctx.rotate(d.r || 0);
  shape(ctx, spline([[0, -22], [9, -2], [8, 8], [0, 13], [-8, 8], [-9, -2]], true, 5), { fill: COL.sweat, line: 3, seed: 130 + i, grain: 0, breaks: 0.05 });
  shape(ctx, ellipse(-3, 2, 2.2, 4, 8), { fill: PAL.white, line: 0, grain: 0, off: [0, 0] });
  ctx.restore();
}
