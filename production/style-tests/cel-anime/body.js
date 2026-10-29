// Full-figure 2.5D rig in 3/4 view (facing screen right; mirror = facing left). Units = head units (cranium radius 80).
// Arms/legs are single smooth outlines (no seam at elbow/knee), cel shaded with the light kept upper-left on screen.
import { cel, path, poly, line, TAU, mix, rgba } from './cel.js';
import { head, neck } from './head.js';

const LW = 1.6;
// smooth two-segment limb outline a→b→c with widths
export function limb2(a, b, c, w1, w2, w3) {
  const n = (p, q) => { const dx = q[0] - p[0], dy = q[1] - p[1], d = Math.hypot(dx, dy) || 1; return [-dy / d, dx / d]; };
  const n1 = n(a, b), n2 = n(b, c), nb = [(n1[0] + n2[0]) / 2, (n1[1] + n2[1]) / 2];
  const L = [[a[0] + n1[0] * w1 / 2, a[1] + n1[1] * w1 / 2], [b[0] + nb[0] * w2 / 2, b[1] + nb[1] * w2 / 2], [c[0] + n2[0] * w3 / 2, c[1] + n2[1] * w3 / 2]];
  const R = [[a[0] - n1[0] * w1 / 2, a[1] - n1[1] * w1 / 2], [b[0] - nb[0] * w2 / 2, b[1] - nb[1] * w2 / 2], [c[0] - n2[0] * w3 / 2, c[1] - n2[1] * w3 / 2]];
  const dx = c[0] - b[0], dy = c[1] - b[1], d = Math.hypot(dx, dy) || 1;
  const tip = [c[0] + dx / d * w3 * .35, c[1] + dy / d * w3 * .35];
  const dx0 = a[0] - b[0], dy0 = a[1] - b[1], d0 = Math.hypot(dx0, dy0) || 1;
  const tail = [a[0] + dx0 / d0 * w1 * .3, a[1] + dy0 / d0 * w1 * .3];
  return [L[0], L[1], L[2], tip, R[2], R[1], R[0], tail];
}
const dir = a => [Math.sin(a), Math.cos(a)];
const add = (p, d, k) => [p[0] + d[0] * k, p[1] + d[1] * k];

// hand at wrist w, pointing along angle (radians, screen-ish local), type: 'fist' | 'open' | 'rest'
export function hand(g, P, w, ang, type, s = 1, flipY = 1) {
  g.save(); g.translate(w[0], w[1]); g.rotate(ang); g.scale(s, s * flipY);
  const sk = { f: P.skin.f, s: P.skin.s, h: P.skin.h, l: P.skin.l, lw: LW * .9 };
  if (type === 'open') {
    const fing = [[-.5, 70], [-.17, 82], [.15, 78], [.45, 64]];
    for (const [a, L] of fing) { const b = [40 + Math.cos(a) * 8, Math.sin(a) * 26]; cel(g, limb2(b, add(b, [Math.cos(a), Math.sin(a)], L * .5), add(b, [Math.cos(a), Math.sin(a)], L), 17, 15, 12), sk); }
    cel(g, [[0, -22], [30, -28], [50, -24], [56, 0], [50, 24], [26, 28], [0, 22]], { ...sk, so: [-4, -5] });
    cel(g, limb2([22, -18], [36, -40], [52, -54], 20, 16, 13), sk);
  } else {
    cel(g, [[0, -21], [34, -26], [60, -20], [70, 0], [64, 22], [34, 26], [0, 21]], { ...sk, so: [-5, -6] });
    line(g, [[50, -14], [64, -6]], P.skin.l, 1); line(g, [[52, 2], [66, 8]], P.skin.l, 1);
    if (type === 'fist') cel(g, limb2([16, -16], [40, -30], [58, -22], 20, 17, 14), sk);
    else cel(g, limb2([14, -16], [36, -28], [52, -30], 20, 17, 13), sk);
  }
  g.restore();
}

function shoe(g, P, ank, rot, SO, mr) {
  g.save(); g.translate(ank[0], ank[1]); g.rotate(rot);
  const S = [[-34, -16], [16, -20], [58, -2], [80, 16, 1], [80, 30, 1], [-36, 30, 1]];
  cel(g, S, { f: P.shoe.f, s: P.shoe.s, so: SO(-8, -8), h: P.shoe.h, ho: SO(4, 4), l: P.shoe.l, lw: LW });
  cel(g, poly([[-36, 26], [80, 26], [80, 34], [-36, 34]]), { f: P.sole, l: P.shoe.l, lw: LW * .8 });
  g.restore();
}

// —— walk cycle: phase 0..1 → leg/arm angles ——
export function walkPose(p, amp = 1) {
  const L = q => { const s = Math.sin(q * TAU); return [ .42 * s * amp, (.12 + .78 * Math.max(0, Math.sin(q * TAU + 2.2))) * amp]; };
  return { legs: { n: L(p), f: L(p + .5) }, bob: -10 * Math.abs(Math.cos(p * TAU)) * amp, armSwing: Math.sin(p * TAU) * .32 * amp };
}

// D = { who:'y'|'m', P, mirror, legs:{n:[th,kn],f:[th,kn]}, arms:{n:[a1,a2,type], f:[a1,a2,type]}, bob, headO:{...}, tilt, nearOver, onNearHand(g,wrist,ang) }
export function figure(g, D) {
  const P = D.P, who = D.who, mr = D.mirror ? -1 : 1, SO = (dx, dy) => [dx * mr, dy];
  const male = who === 'y';
  const hipY = male ? 630 : 600, thigh = male ? 272 : 258, shin = male ? 266 : 252;
  const hipN = [male ? -58 : -48, hipY], hipF = [male ? 50 : 40, hipY];
  const lg = D.legs || { n: [0, 0], f: [0, 0] };
  const legPts = (hip, [th, kn]) => { const k = add(hip, dir(th), thigh); const a = add(k, dir(th - kn), shin); return [hip, k, a]; };
  const LN = legPts(hipN, lg.n), LF = legPts(hipF, lg.f);
  const ground = Math.max(LN[2][1], LF[2][1]) + 34;
  g.save();
  if (D.mirror) g.scale(-1, 1);
  g.translate(0, -ground);
  const bob = D.bob || 0;
  // —— legs ——
  const legCol = male ? P.jeans : P.legs;
  const drawLeg = (L, th, kn, far) => {
    const w = male ? [86, 70, 58] : [70, 50, 34];
    const col = far ? { f: mix(legCol.f, legCol.s, .35), s: legCol.s, l: legCol.l } : legCol;
    cel(g, limb2(L[0], L[1], L[2], ...w), { f: col.f, s: legCol.s, so: SO(-16, -4), h: legCol.h, ho: legCol.h ? SO(6, 0) : null, l: legCol.l, lw: LW });
    if (male) line(g, [add(L[1], dir(th - kn), 20), add(L[1], dir(th - kn), 150)], mix(legCol.l, legCol.f, .5), 1.2);
    shoe(g, P, L[2], Math.max(-.6, Math.min(.5, -(th - kn) * .55)), SO, mr);
  };
  drawLeg(LF, ...lg.f, true);
  // far arm (behind torso)
  const shY = (male ? 196 : 190) + bob;
  const shN = [male ? -118 : -96, shY], shF = [male ? 84 : 66, shY - 6];
  const arm = (sh, spec) => {
    const [a1, a2] = spec, up = male ? 250 : 232, fo = male ? 222 : 206;
    const el = add(sh, dir(a1), up), wr = add(el, dir(a1 + a2), fo);
    return { sh, el, wr, ang: Math.atan2(dir(a1 + a2)[1], dir(a1 + a2)[0]) };
  };
  const A = D.arms || { n: [-.1, .1, 'rest'], f: [.1, .15, 'rest'] };
  const AN = arm(shN, A.n), AF = arm(shF, A.f);
  const sleeve = male ? P.jacket : P.cardigan;
  const drawArm = (a, type, far) => {
    const w = male ? [76, 64, 56] : [62, 50, 44];
    if (a === AN && D.onNearHand) D.onNearHand(g, a.wr, a.ang, ground);
    hand(g, P, add(a.wr, [Math.cos(a.ang), Math.sin(a.ang)], -6), a.ang, type, male ? 1.1 : 1, 1);
    const col = far ? { ...sleeve, f: mix(sleeve.f, sleeve.s, .4) } : sleeve;
    cel(g, limb2(a.sh, a.el, a.wr, ...w), { f: col.f, s: sleeve.s, so: SO(-14, -10), h: sleeve.h, ho: SO(5, 4), l: sleeve.l, lw: LW });
    // cuff
    const d = [Math.cos(a.ang), Math.sin(a.ang)];
    line(g, [add(add(a.wr, [-d[1], d[0]], w[2] * .5), d, -14), add(add(a.wr, [d[1], -d[0]], w[2] * .5), d, -14)], sleeve.l, 1.4);
  };
  drawArm(AF, A.f[2], true);
  drawLeg(LN, ...lg.n, false);
  // —— neck (behind the collar) ——
  const headT = gg => { gg.translate(D.headDx || 0, bob + (D.headDy || 0)); gg.translate(-8, 140); gg.rotate((D.tilt || 0) * mr); gg.translate(8, -140); };
  g.save(); headT(g); neck(g, P, who); g.restore();
  // —— torso ——
  g.save(); g.translate(0, bob);
  if (male) {
    cel(g, poly([[-112, 600], [94, 596], [98, 676], [-116, 684]]), { f: P.jeans.f, s: P.jeans.s, so: SO(-12, -6), l: P.jeans.l, lw: LW });
    cel(g, [[-44, 150, 1], [62, 150, 1], [56, 656, 1], [-30, 662, 1]], { f: P.tee.f, s: P.tee.s, so: SO(-18, -4), l: P.tee.l, lw: LW });
    const J = [[-44, 136], [-122, 158], [-158, 204], [-160, 300], [-148, 430], [-140, 560], [-144, 664, 1], [-60, 672], [-30, 668, 1], [-36, 400], [-44, 220], [-40, 150, 1], [-20, 142]];
    cel(g, J, { f: P.jacket.f, s: P.jacket.s, so: SO(-30, -8), h: P.jacket.h, ho: SO(10, 8), l: P.jacket.l, lw: LW });
    const JF = [[30, 140], [80, 156], [112, 196], [114, 300], [104, 420], [102, 560], [106, 652, 1], [56, 660, 1], [58, 420], [64, 220], [60, 150, 1]];
    cel(g, JF, { f: mix(P.jacket.f, P.jacket.s, .25), s: P.jacket.s, so: SO(-22, -6), l: P.jacket.l, lw: LW });
    // lapels / collar
    cel(g, [[-48, 132], [-38, 150], [-34, 200], [-40, 262, 1], [-62, 196], [-70, 150]], { f: P.jacket.h, s: P.jacket.f, so: SO(-6, -4), l: P.jacket.l, lw: LW });
    cel(g, [[54, 136], [70, 150], [82, 200], [66, 250, 1], [60, 196], [56, 152]], { f: mix(P.jacket.f, P.jacket.h, .4), l: P.jacket.l, lw: LW });
    line(g, [[-70, 560], [-20, 566]], P.jacket.l, 1.4); line(g, [[-120, 470], [-80, 476]], P.jacket.l, 1.2);   // pocket flaps
    line(g, [[-38, 146], [-10, 170], [24, 174], [54, 150]], P.tee.l, LW * .9); line(g, [[-36, 156], [-10, 180], [24, 184], [52, 160]], mix(P.tee.s, P.tee.l, .3), LW * .7);   // crew neck rib
  } else {
    cel(g, [[-106, 450], [84, 446], [118, 600], [148, 830, 1], [60, 840], [-30, 842], [-150, 834, 1], [-130, 600]], { f: P.skirt.f, s: P.skirt.s, so: SO(-26, -4), h: P.skirt.h, ho: SO(8, 0), l: P.skirt.l, lw: LW,
      sh: [[[-40, 600], [-20, 600], [-46, 846], [-70, 846]], [[40, 600], [56, 600], [76, 844], [56, 844]]] });
    cel(g, [[-14, 146], [12, 164], [40, 146], [38, 470], [-6, 476]], { f: P.blouse.f, s: P.blouse.s, so: SO(-12, -4), l: P.blouse.l, lw: LW });
    const J = [[-40, 132], [-100, 152], [-134, 196], [-136, 290], [-122, 400], [-124, 500], [-60, 512], [-8, 506, 1], [-14, 330], [-20, 200], [-14, 148, 1]];
    cel(g, J, { f: P.cardigan.f, s: P.cardigan.s, so: SO(-26, -8), h: P.cardigan.h, ho: SO(9, 7), l: P.cardigan.l, lw: LW });
    const JF = [[28, 136], [70, 150], [94, 192], [92, 300], [84, 400], [88, 496], [36, 506, 1], [40, 330], [46, 200], [42, 148, 1]];
    cel(g, JF, { f: mix(P.cardigan.f, P.cardigan.s, .25), s: P.cardigan.s, so: SO(-20, -6), l: P.cardigan.l, lw: LW });
    for (const y of [240, 320, 400]) { const b = new Path2D(); b.arc(-12, y, 6, 0, TAU); cel(g, b, { f: P.cardigan.h, l: P.cardigan.l, lw: 1.2 }); }
    line(g, [[-124, 486], [-14, 490]], P.cardigan.l, 1.2);
    cel(g, [[-34, 144], [-12, 158], [6, 190, 1], [-20, 176], [-40, 150]], { f: P.blouse.f, s: P.blouse.s, l: P.blouse.l, lw: LW }); cel(g, [[42, 144], [24, 158], [6, 190, 1], [30, 176], [48, 150]], { f: P.blouse.f, s: P.blouse.s, l: P.blouse.l, lw: LW });
  }
  g.restore();
  // —— head ——
  const nearArm = () => drawArm(AN, A.n[2], false);
  if (!D.nearOver) nearArm();
  g.save(); headT(g);
  g.translate(-8, 140); g.scale(1.08, 1.08); g.translate(8, -140);
  head(g, P, { who, light: [-1 * mr, -.8], neck: false, ...(D.headO || {}) });
  g.restore();
  if (D.nearOver) nearArm();
  g.restore();
}
