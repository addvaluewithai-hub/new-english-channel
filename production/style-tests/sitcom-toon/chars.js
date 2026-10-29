// chars.js — the cast of "First Day": Youssef (newcomer) and Mia (teacher)
// Local coordinates: origin at the feet, y down; face=1 looks right (3/4 view), -1 mirrors.
// Eye / mouth / hand construction learned from the style's demo rig, re-drawn for this cast.
import { clamp, lerp, hash, TAU } from '/core/lib.js';
import { INK, push, pop, translate, rotate, scale, shape, fillOnly, stroke, ell, arc, spline, rr, rect, noodle, quad, dot } from './toon.js';

export const PAL = {
  // Youssef
  skinY: '#a8693f', skinYs: '#86502c', beard: '#2a1d1c', hairY: '#1c1720', hairYh: '#3b3550',
  jacket: '#2b3d73', jacketS: '#1d2a52', tee: '#f6f3ea', teeS: '#d9d4c6', jeans: '#4f7ec6', jeansS: '#3a62a4',
  shoeY: '#7a4a28', shoeYs: '#55321a', case: '#d7362e', caseS: '#a8241f', caseT: '#f06a5a',
  // Mia
  skinM: '#f7d5bf', skinMs: '#e6b294', hairM: '#b9492a', hairMs: '#8b3220', hairMh: '#d9673f',
  cardi: '#e3a82a', cardiS: '#b9841a', top: '#fbf4e6', skirt: '#1c9c96', skirtS: '#137670', shoeM: '#7d2f3a', scrunch: '#1c9c96',
  // shared
  white: '#ffffff', mouthIn: '#4a1a2a', tongue: '#e8637a', blush: '#ff5a6e', sweat: '#bfe9ff',
};

// —— face parts ——
export function eye(cx, cy, rx, ry, { lid = 0, look = [0, 0], pupil = 4.5, skin = '#fff', closed = false, lw = 6, jitter = 0, lower = 0, happy = false } = {}) {
  if (happy) { stroke(arc(cx, cy + ry * .25, rx * .75, ry * .5, Math.PI * 1.1, Math.PI * 1.9, 14), lw); return; }
  if (closed) { stroke(arc(cx, cy + ry * .1, rx * .8, ry * .45, Math.PI * .1, Math.PI * .9, 14), lw); return; }
  shape(ell(cx, cy, rx, ry, 36), {
    fill: '#fff', lw, shade: () => {
      const px = cx + look[0] * rx * .55 + jitter, py = cy + look[1] * ry * .5;
      dot(px, py, pupil);
      if (lid > 0) {
        const yl = cy - ry + lid * 2 * ry;
        fillOnly([[cx - rx * 1.3, cy - ry * 1.4], [cx + rx * 1.3, cy - ry * 1.4], [cx + rx * 1.3, yl], [cx - rx * 1.3, yl + ry * .08]], skin, { boil: .5 });
        stroke([[cx - rx * 1.2, yl + ry * .08], [cx + rx * 1.2, yl]], lw);
      }
      if (lower > 0) { const yb = cy + ry - lower * 2 * ry; fillOnly([[cx - rx * 1.3, yb], [cx + rx * 1.3, yb], [cx + rx * 1.3, cy + ry * 1.4], [cx - rx * 1.3, cy + ry * 1.4]], skin, { boil: .5 }); stroke([[cx - rx * 1.2, yb], [cx + rx * 1.2, yb]], lw * .8); }
    }
  });
}
// o open 0..1, w width, sm smile(+)/frown(−), skew lopsided
export function mouth(cx, cy, mw, { o = 0, w = 1, sm = 0, skew = 0, lw = 6, teeth = true, tongue = true, grit = false } = {}) {
  const hw = mw * w / 2, k = mw * .22, lc = [cx - hw, cy - sm * k + skew * k], rc = [cx + hw, cy - sm * k - skew * k];
  if (o < .07 && !grit) {
    stroke(quad(lc, [cx, cy + sm * k * 1.2], rc, 12), lw);
    stroke([[rc[0] - 3, rc[1] - 5 * Math.sign(sm || 1)], [rc[0] + 4, rc[1] + 3]], lw * .7);
    return;
  }
  const h = Math.max(o, grit ? .3 : 0) * mw * .62;
  const up = quad(lc, [cx, cy - h * .25 + sm * k * .4], rc, 12), dn = quad(rc, [cx, cy + h + sm * k * .6], lc, 14);
  shape([...up, ...dn], {
    fill: PAL.mouthIn, lw, shade: () => {
      if (grit) {   // clenched awkward grin: a full row of teeth with gaps
        fillOnly(rect(cx - hw * 1.3, cy - h * 2, hw * 2.6, h * 4), PAL.white, { boil: .3 });
        stroke([[cx - hw * 1.2, cy + h * .35 + sm * k * .3], [cx + hw * 1.2, cy + h * .35 + sm * k * .3]], lw * .6);
        for (let i = -2; i <= 2; i++) stroke([[cx + i * hw * .36, cy - h], [cx + i * hw * .36, cy + h * 1.2]], lw * .5);
        return;
      }
      if (teeth && o > .22) fillOnly(rect(cx - hw * 1.2, cy - h, hw * 2.4, h * .32 + (cy - Math.min(lc[1], rc[1])) * .2 + 6), PAL.white, { boil: .3 });
      if (tongue) fillOnly(ell(cx + hw * .15, cy + h * .95, hw * .6, h * .45, 20), PAL.tongue, { boil: .3 });
    }
  });
}
export function hand(x, y, ang, r = 21, col = PAL.skinY, { fist = false, lw = 6, open = false } = {}) {
  push(); translate(x, y); rotate(ang);
  let pts;
  if (fist) pts = spline([[-r * .6, -r * .8], [r * .7, -r * .9], [r * 1.1, -r * .1], [r * .8, r * .8], [-r * .5, r * .9], [-r * .9, 0]]);
  else if (open) pts = spline([[-r * .6, -r * .8], [r * .2, -r * .95], [r * 1.0, -r * 1.5], [r * 1.25, -r * 1.15], [r * .7, -r * .55], [r * 1.65, -r * .55], [r * 1.65, -r * .15], [r * .9, -r * .02], [r * 1.65, r * .25], [r * 1.55, r * .6], [r * .85, r * .45], [r * 1.3, r * .9], [r * .9, r * 1.1], [-r * .2, r * .85], [-r * .9, r * .2]]);
  else pts = spline([[-r * .5, -r * .85], [r * .5, -r * 1.05], [r * 1.35, -r * .75], [r * 1.05, -r * .3], [r * 1.5, -r * .1], [r * 1.1, r * .3], [r * 1.35, r * .7], [r * .6, r * .95], [-r * .6, r * .8], [-r * .95, 0]]);
  shape(pts, { fill: col, lw });
  if (!open) stroke([[r * .2, -r * .15], [r * .75, -r * .45]], lw * .6);
  pop();
}
export const sweatDrop = (x, y, s = 1) => shape(spline([[x, y - 18 * s], [x + 10 * s, y + 4 * s], [x, y + 13 * s], [x - 10 * s, y + 4 * s]]), { fill: PAL.sweat, lw: 5, shade: () => fillOnly(ell(x - 3 * s, y + 3 * s, 3 * s, 5 * s, 8), '#fff', { boil: 0 }) });
// tapered brow: from inner (a) to outer (b)
const browShape = (a, b, w0, w1, col, bend = 0) => shape(noodle(a, b, bend, w0, w1), { fill: col, lw: 4 });

// —— the red suitcase, drawn in the owner's local frame: wheels at w, handle grip at gp ——
function suitcase(w, gp, roll = 0, lw = 6) {
  const a = Math.atan2(gp[1] - w[1], gp[0] - w[0]) + Math.PI / 2, L = Math.hypot(gp[0] - w[0], gp[1] - w[1]);
  push(); translate(w[0], w[1]); rotate(a);
  // telescopic handle (two rods + grip)
  const top = -232;
  if (L > -top + 10) {
    for (const x of [-30, 30]) shape(rect(x - 6, -L + 10, 12, L + top + 6), { fill: '#9aa3b5', lw: 5 });
    shape(rr(-44, -L - 8, 88, 22, 9), { fill: '#3b3a48', lw: 5 });
  }
  // body
  shape(rr(-78, top, 156, 214, 22), {
    fill: PAL.case, lw, shade: () => {
      fillOnly(rect(34, top - 10, 60, 240), PAL.caseS, { boil: .3 });
      fillOnly(rr(-62, top + 14, 16, 70, 8), PAL.caseT, { boil: .3 });
    }
  });
  for (const x of [-34, 0, 34]) stroke([[x, top + 24], [x, -34]], 4, { line: PAL.caseS });
  shape(rr(-28, top - 14, 56, 18, 7), { fill: '#3b3a48', lw: 5 });          // top carry handle
  // a travel sticker (plain shapes, no text)
  shape(ell(-30, top + 150, 22, 16, 18), { fill: '#f3e27a', lw: 4, shade: () => fillOnly(rect(-60, top + 146, 60, 8), '#2b8fd6', { boil: 0 }) });
  // wheels: turn by distance / radius
  for (const x of [-52, 52]) {
    shape(ell(x, -6, 15, 15, 16), { fill: '#3b3a48', lw: 5 });
    const c = Math.cos(roll), s = Math.sin(roll);
    stroke([[x - c * 9, -6 - s * 9], [x + c * 9, -6 + s * 9]], 3, { line: '#9aa3b5' });
  }
  pop();
}

// ———————————————— YOUSSEF ————————————————
// P: {x,y,s,face,lean,bob,sq,jit, look,lid,blink,brow,browIn,mouth:{o,w,sm,skew,grit}, armF:{h,bend,hand}, armB, legF, legB, headTilt, blush, sweat, case:{w,grab,roll}}
export function youssef(P) {
  const f = P.face ?? 1, s = P.s ?? .57, lean = P.lean ?? 0;
  push(); translate(P.x + (P.jit || 0), P.y);
  scale(s * f, s);
  // suitcase on the ground (not bobbing)
  const shB = [-54, -414], shF = [50, -414];
  const armB = P.armB || { h: [-14, 176], bend: -14 }, armF = P.armF || { h: [14, 176], bend: 14 };
  const rotP = (p) => { const c = Math.cos(lean), sn = Math.sin(lean); return [p[0] * c - p[1] * sn, p[0] * sn + p[1] * c]; };
  const bob = P.bob || 0, sq = P.sq ?? 1;
  const hb = [shB[0] + armB.h[0], shB[1] + armB.h[1]];
  if (P.case) {
    const C = P.case;
    const grip = C.grab ? (() => { const r = rotP(hb); return [r[0], r[1] * sq + bob]; })() : C.grip;
    suitcase(C.w, grip, C.roll || 0);
  }
  translate(0, bob); scale(1, sq);
  // legs + shoes
  const legs = [[-1, P.legB || [0, 0], true], [1, P.legF || [0, 0], false]];
  for (const [sx, lg] of legs) {
    const hip = [sx * 22, -246], ank = [sx * 24 + lg[0], -26 + lg[1]];
    shape(noodle(hip, ank, sx * -4 + (lg[2] || 0), 48, 40), { fill: PAL.jeans, lw: 7, shade: () => fillOnly(rect(sx < 0 ? -200 : ank[0] + 4, -260, sx < 0 ? 184 : 30, 260), PAL.jeansS, { boil: .3 }) });
    shape(spline([[ank[0] - 26, ank[1] + 24], [ank[0] - 22, ank[1] + 2], [ank[0] + 12, ank[1] - 4], [ank[0] + 48, ank[1] + 10], [ank[0] + 44, ank[1] + 26]]), { fill: PAL.shoeY, lw: 7, shade: () => fillOnly(rect(ank[0] - 40, ank[1] + 18, 100, 20), PAL.shoeYs, { boil: .3 }) });
  }
  push(); rotate(lean);
  const drawArm = (sh, arm, back) => {
    const hp = [sh[0] + arm.h[0], sh[1] + arm.h[1]];
    shape(noodle(sh, hp, arm.bend ?? 0, 42, 34), { fill: back ? PAL.jacketS : PAL.jacket, lw: 7 });
    const ang = Math.atan2(hp[1] - sh[1], hp[0] - sh[0]);
    shape(ell(hp[0] - Math.cos(ang) * 4, hp[1] - Math.sin(ang) * 4, 19, 19, 18), { fill: PAL.tee, lw: 5 });   // white cuff
    const hk = arm.hand || 'rest';
    if (hk === 'thumb') { hand(hp[0], hp[1], ang, 19, PAL.skinY, { fist: true }); shape(noodle([hp[0] + 2, hp[1] - 10], [hp[0] - 16 + (arm.tx || 0), hp[1] - 34], 0, 13, 11), { fill: PAL.skinY, lw: 5 }); }
    else hand(hp[0], hp[1], ang + (arm.ra || 0), 19, PAL.skinY, { fist: hk === 'fist' || hk === 'grip', open: hk === 'open' });
  };
  drawArm(shB, armB, true);
  // torso: navy jacket open over a white T-shirt
  const jk = spline([[-44, -440], [-76, -420], [-86, -330], [-84, -232], [0, -222], [80, -230], [84, -330], [74, -420], [42, -440]]);
  shape(jk, {
    fill: PAL.jacket, lw: 7, shade: () => {
      fillOnly(spline([[-110, -450], [-44, -440], [-58, -330], [-48, -210], [-120, -210]]), PAL.jacketS, { boil: .4 });
      fillOnly([[4, -446], [46, -446], [44, -226], [12, -224]], PAL.tee, { boil: .4 });     // T-shirt in the opening
      fillOnly([[34, -446], [50, -446], [48, -226], [36, -226]], PAL.teeS, { boil: .3 });
    }
  });
  stroke([[4, -440], [12, -224]], 6); stroke([[46, -440], [44, -226]], 6);                  // jacket front edges
  stroke(spline([[-14, -440], [2, -400], [14, -350]], false), 5);                               // lapels
  stroke(spline([[60, -440], [46, -400], [42, -352]], false), 5);
  stroke([[-62, -290], [-26, -286]], 4); stroke([[56, -292], [76, -290]], 4);                   // pockets
  shape(ell(26, -440, 26, 10, 16), { fill: PAL.tee, lw: 5 });                                   // T-shirt collar
  // neck
  shape(noodle([18, -432], [22, -468], 2, 40, 40), { fill: PAL.skinY, lw: 6, shade: () => fillOnly(rect(-30, -470, 30, 50), PAL.skinYs, { boil: .3 }) });
  if (P.gulp) shape(ell(30, -448, 9, 7 * P.gulp, 10), { fill: PAL.skinYs, lw: 4 });
  // head
  push(); translate(22, -548); rotate(P.headTilt ?? 0); headY(P); pop();
  drawArm(shF, armF, false);
  pop();
  if (P.sweat != null) {
    const u = P.sweat % 1, u2 = (P.sweat + .45) % 1;
    sweatDrop(-56, -640 + u * 70, 1.25); sweatDrop(112, -620 + u2 * 60, 1);
  }
  pop();
}
function headY(P) {
  // ear (back side)
  shape(ell(-62, 8, 15, 22, 18), { fill: PAL.skinY, lw: 6, shade: () => fillOnly(ell(-58, 10, 6, 12, 12), PAL.skinYs, { boil: .3 }) });
  const HD = spline([[-14, -98], [48, -94], [80, -54], [86, 6], [80, 56], [54, 92], [10, 102], [-36, 88], [-64, 46], [-74, -18], [-54, -80]]);
  const bl = P.blush || 0;
  shape(HD, {
    fill: PAL.skinY, lw: 7, shade: () => {
      fillOnly(spline([[-96, -10], [-70, -100], [-110, -110]]), PAL.skinYs, { boil: .3 });
      // short trimmed beard along the jaw + chin, a skin patch left around the mouth
      if (bl > 0) { fillOnly(rect(-120, -120, 240, 260), `rgba(214,40,60,${.22 * bl})`, { boil: 0 }); }
      fillOnly(spline([[-54, 10], [-44, 40], [-16, 60], [10, 62], [40, 92], [70, 90], [96, 70], [100, 130], [-80, 130], [-80, 10]]), PAL.beard, { boil: .4 });
      // hair: short, black, a small quiff
      fillOnly(spline([[-90, 14], [-82, -70], [-40, -114], [20, -126], [66, -112], [92, -78], [86, -70], [60, -88], [24, -94], [-12, -88], [-38, -70], [-50, -30], [-52, 14]]), PAL.hairY, { boil: .4 });
      fillOnly(spline([[-6, -112], [30, -118], [52, -104], [20, -100]]), PAL.hairYh, { boil: .3 });
    }
  });
  // sideburn line to beard
  
  // blush ovals (flat)
  if (bl > 0) for (const [cx, rx] of [[-26, 20], [70, 15]]) fillOnly(ell(cx, 32, rx, 10, 16), `rgba(255,70,90,${.75 * Math.min(1, bl * 1.4)})`, { boil: .4 });
  // eyes (touching, 3/4)
  const lid = P.blink ? 1 : clamp(P.lid ?? .12, 0, 1), look = P.look || [0, 0], pj = P.pjit || 0;
  eye(-6, -6, 28, 33, { lid, look, pupil: P.pupil ?? 4.4, skin: PAL.skinY, jitter: pj, happy: P.happy });
  eye(44, -8, 32, 36, { lid, look, pupil: P.pupil ?? 4.8, skin: PAL.skinY, jitter: pj, happy: P.happy });
  // brows: brow raises, browIn lifts the inner ends (worry), negative = angry
  const br = P.brow ?? 0, bi = P.browIn ?? 0;
  browShape([10, -50 - br * 10 - bi * 12], [-32, -44 - br * 10 + bi * 4], 15, 9, PAL.hairY, -3);
  browShape([30, -52 - br * 10 - bi * 12], [76, -48 - br * 10 + bi * 5], 16, 10, PAL.hairY, 3);
  // nose (3/4, points right)
  shape(spline([[62, 14], [76, 28], [98, 42], [94, 58], [72, 60], [60, 50]]), { fill: PAL.skinY, lw: 6, shade: () => fillOnly(ell(90, 56, 12, 7, 12), PAL.skinYs, { boil: .3 }) });
  // moustache
  shape(spline([[22, 66], [44, 60], [60, 64], [80, 60], [90, 68], [62, 72], [42, 72], [26, 74]]), { fill: PAL.beard, lw: 4 });
  const m = P.mouth || {};
  mouth(50 + (m.skew || 0) * 4, 84, 54, { o: m.o || 0, w: m.w ?? 1, sm: m.sm ?? .3, skew: m.skew || 0, lw: 6, grit: m.grit });
}

// ———————————————— MIA ————————————————
export function mia(P) {
  const f = P.face ?? -1, s = P.s ?? .56, lean = P.lean ?? 0;
  push(); translate(P.x + (P.jit || 0), P.y);
  scale(s * f, s);
  translate(0, P.bob || 0); scale(1, P.sq ?? 1);
  for (const [sx, lg] of [[-1, P.legB || [0, 0]], [1, P.legF || [0, 0]]]) {
    const hip = [sx * 18, -210], ank = [sx * 20 + lg[0], -24 + lg[1]];
    shape(noodle(hip, ank, 0, 30, 24), { fill: PAL.skinM, lw: 6, shade: () => fillOnly(rect(sx < 0 ? -200 : 999, -260, 190, 260), PAL.skinMs, { boil: .3 }) });
    shape(spline([[ank[0] - 20, ank[1] + 22], [ank[0] - 18, ank[1] + 4], [ank[0] + 10, ank[1]], [ank[0] + 40, ank[1] + 12], [ank[0] + 36, ank[1] + 24]]), { fill: PAL.shoeM, lw: 6 });
  }
  push(); rotate(lean);
  const shB = [-46, -432], shF = [42, -432];
  const armB = P.armB || { h: [-10, 170], bend: -12 }, armF = P.armF || { h: [10, 170], bend: 12 };
  const drawArm = (sh, arm, back) => {
    const hp = [sh[0] + arm.h[0], sh[1] + arm.h[1]];
    shape(noodle(sh, hp, arm.bend ?? 0, 36, 28), { fill: back ? PAL.cardiS : PAL.cardi, lw: 7 });
    const ang = Math.atan2(hp[1] - sh[1], hp[0] - sh[0]);
    for (let k = 0; k < 2; k++) stroke([[hp[0] - Math.cos(ang) * (8 + k * 8) - Math.sin(ang) * 14, hp[1] - Math.sin(ang) * (8 + k * 8) + Math.cos(ang) * 14], [hp[0] - Math.cos(ang) * (8 + k * 8) + Math.sin(ang) * 14, hp[1] - Math.sin(ang) * (8 + k * 8) - Math.cos(ang) * 14]], 3, { line: PAL.cardiS });
    hand(hp[0], hp[1], ang + (arm.ra || 0), 16, PAL.skinM, { fist: arm.hand === 'fist', open: arm.hand === 'open', lw: 5 });
  };
  // ponytail (behind everything of the head), swings with P.pony
  const pw = P.pony || 0;
  push(); translate(14, -520); rotate(P.headTilt ?? 0);
  const tie = [-74, -52], tipA = .55 + pw;
  const tip = [tie[0] - Math.sin(tipA) * 150 * .9, tie[1] + Math.cos(tipA) * 150];
  const mid = [(tie[0] + tip[0]) / 2 - 30, (tie[1] + tip[1]) / 2];
  shape(spline([[tie[0] + 10, tie[1] - 16], [mid[0] - 22, mid[1] - 20], [tip[0] - 6, tip[1] - 6], [tip[0] + 8, tip[1] + 10], [mid[0] + 26, mid[1] + 6], [tie[0] + 16, tie[1] + 18]]), { fill: PAL.hairM, lw: 6, shade: () => fillOnly(spline([[mid[0] + 4, mid[1] - 10], [tip[0] + 12, tip[1]], [mid[0] + 40, mid[1] + 10]]), PAL.hairMs, { boil: .3 }) });
  pop();
  drawArm(shB, armB, true);
  // skirt
  shape(spline([[-48, -300], [46, -300], [72, -196], [0, -186], [-76, -196]]), { fill: PAL.skirt, lw: 7, shade: () => { fillOnly(spline([[-90, -310], [-40, -300], [-50, -180], [-100, -180]]), PAL.skirtS, { boil: .3 }); } });
  stroke([[-14, -280], [-22, -192]], 4); stroke([[22, -280], [30, -192]], 4);
  // top + cardigan
  shape(spline([[-34, -456], [-60, -438], [-64, -350], [-58, -284], [0, -276], [56, -284], [60, -350], [56, -438], [32, -456]]), {
    fill: PAL.cardi, lw: 7, shade: () => {
      fillOnly(spline([[-90, -470], [-34, -456], [-40, -350], [-34, -270], [-90, -270]]), PAL.cardiS, { boil: .4 });
      fillOnly([[0, -460], [40, -460], [26, -300], [14, -300]], PAL.top, { boil: .4 });
      for (let k = 0; k < 3; k++) stroke([[-62, -296 + k * 7], [60, -296 + k * 7]], 3, { line: PAL.cardiS });
    }
  });
  stroke([[0, -456], [14, -280]], 5); stroke([[40, -456], [26, -280]], 5);
  for (let k = 0; k < 3; k++) dot(10 + k * 1.3, -420 + k * 40, 5, '#7a5410');
  // neck
  shape(noodle([14, -450], [16, -476], 0, 30, 30), { fill: PAL.skinM, lw: 6 });
  push(); translate(14, -548); rotate(P.headTilt ?? 0); headM(P); pop();
  drawArm(shF, armF, false);
  pop();
  pop();
}
function headM(P) {
  // back hair mass
  shape(spline([[-80, 40], [-92, -40], [-60, -96], [0, -112], [56, -100], [84, -60], [40, -60], [-40, -20], [-60, 50]]), { fill: PAL.hairM, lw: 6 });
  shape(ell(-70, -28, 16, 18, 14), { fill: PAL.scrunch, lw: 5 });   // scrunchie
  shape(ell(-54, 12, 13, 19, 16), { fill: PAL.skinM, lw: 6 });      // ear
  dot(-52, 34, 4.5, '#e9b949');                                       // little earring
  const HD = spline([[-12, -86], [44, -86], [74, -48], [80, 4], [70, 50], [40, 84], [6, 92], [-30, 78], [-52, 40], [-60, -16], [-44, -66]]);
  const bl = P.blush || 0;
  shape(HD, {
    fill: PAL.skinM, lw: 7, shade: () => {
      fillOnly(spline([[-80, -10], [-56, 40], [-20, 84], [-80, 110]]), PAL.skinMs, { boil: .3 });
      // freckles
      for (let i = 0; i < 9; i++) dot(-18 + hash(i * 2.1) * 30 + (i > 4 ? 60 : 0), 26 + hash(i * 5.3) * 14, 2.2, '#c7835e');
      if (bl > 0) fillOnly(rect(-100, -100, 200, 200), `rgba(255,90,110,${.15 * bl})`, { boil: 0 });
      // fringe, side-swept
      fillOnly(spline([[-70, -10], [-64, -76], [-20, -108], [40, -106], [82, -70], [86, -58], [56, -72], [20, -70], [-12, -62], [-40, -46], [-54, -4]]), PAL.hairM, { boil: .4 });
      fillOnly(spline([[6, -96], [40, -98], [62, -80], [30, -82]]), PAL.hairMh, { boil: .3 });
    }
  });
  const lid = P.blink ? 1 : clamp(P.lid ?? .08, 0, 1), look = P.look || [0, 0];
  eye(-6, -4, 26, 32, { lid, look, pupil: 4.6, skin: PAL.skinM, happy: P.happy, lower: P.squint || 0 });
  eye(42, -6, 29, 34, { lid, look, pupil: 5, skin: PAL.skinM, happy: P.happy, lower: P.squint || 0 });
  if (!P.blink && !P.happy) for (const [x, y, a] of [[70, -30, -.5], [74, -18, -.15], [-30, -30, -2.6]]) stroke([[x, y], [x + Math.cos(a) * 14, y + Math.sin(a) * 14]], 4);   // lashes
  // brows (thin, auburn); browL/browR asymmetric for "puzzled"
  const bL = P.browB ?? 0, bR = P.browF ?? 0;
  browShape([6, -50 - bL * 14], [-28, -44 - bL * 10], 10, 6, PAL.hairMs, -2);
  browShape([28, -52 - bR * 14], [72, -50 - bR * 16], 11, 6, PAL.hairMs, 3);
  // nose: small, turned up
  stroke(spline([[64, 14], [78, 30], [72, 40], [60, 38]], false), 5);
  const m = P.mouth || {};
  mouth(42 + (m.skew || 0) * 4, 62, 46, { o: m.o || 0, w: m.w ?? 1, sm: m.sm ?? .6, skew: m.skew || 0, lw: 6 });
}
