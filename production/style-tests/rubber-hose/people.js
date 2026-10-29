// people.js: Youssef and Mia as rubber-hose rigs (equal-width hose limbs, white gloves, pie eyes, big shoes)
// Character-local coordinates: origin = ground between the feet, y down; both are ~330 units tall.
// Facing right by default (3/4 view: features shifted by `look`); pass mirror:true to face left.
import * as T from './toon.js';
import { P, pieEye, brow, mouth, glove, shoe, hose, ribbon, fillLocal, steam } from './parts.js';
import { clamp, lerp, TAU } from '/core/lib.js';
const { shape, stroke, ell, arc, spline, quad, rr, rect, push, pop, translate, rotate, scale, S } = T;

// costume greys (cool silver-nitrate ramp)
export const C = {
  skinY: '#B6BABD', flush: '#666B6F', hair: P.ink, beard: '#34383B',
  navy: '#2B3034', navyShade: '#1B1F22', tee: P.white, jeans: '#868B8F', jeansShade: '#6F7478', yShoe: '#3B3F42',
  case: '#555A5E', caseShade: '#3F4347',
  skinM: P.white, hairM: '#8C9195', hairMShade: '#6E7377', cardi: '#C0C4C7', cardiShade: '#A2A6A9', skirt: '#4B5155', skirtShade: '#373C40',
};

export const drop = (x, y, r) => shape(spline([[x, y - r * 1.8], [x + r, y], [x, y + r], [x - r, y]], true, 5), { fill: P.white, lw: S.lw * .55 });
export function puff(x, y, r) { shape(ell(x, y, r, r * .82, 18), { fill: P.white, lw: S.lw * .6 }); }

// ——— suitcase (handle at origin; "red" leather read as a dark grey with white caps, straps and a sticker) ———
export function suitcase(x, y, ang = 0, k = 1, b = 0) {
  push(); translate(x, y); rotate(ang); scale(k * (1 - b * .03), k * (1 + b * .05));
  shape(ribbon(arc(0, 14, 17, 15, Math.PI, TAU, 12), 8, 8, true), { fill: P.dark, lw: S.lw * .7 });
  shape(rr(-64, 12, 128, 90, 13), {
    fill: C.case, shade: () => {
      fillLocal(rect(40, 0, 40, 120), C.caseShade);
      for (const sx of [-34, 30]) fillLocal(rect(sx, 10, 10, 96), P.light);
      fillLocal(rect(-66, 52, 132, 6), C.caseShade);
    }
  });
  for (const [cx, cy] of [[-64, 12], [64, 12], [-64, 102], [64, 102]]) shape(ell(cx * .9, cy < 50 ? cy + 7 : cy - 7, 9, 9, 12), { fill: P.white, lw: S.lw * .55 });
  // travel sticker: a pyramid on a round label
  shape(ell(-6, 66, 20, 16, 18), { fill: P.white, lw: S.lw * .55, shade: () => { fillLocal([[-20, 76], [-6, 56], [8, 76]], P.mid); } });
  stroke([[-20, 76], [-6, 56], [8, 76]], S.lw * .45);
  pop();
}

// ——— Youssef ———
// p: { x, y, k, mirror, sx, sy, lean, bob, look(-1..1), legL, legR, armL, armR (each {x,y,hand,bend,rot,front,hk,flip}),
//      eyes:{type,lx,ly,lid}, brows, mouth:{type,open,w}, flush(0..1), sink(0..1 head into collar), sweat:[[x,y,r]], steam(0..1), t,
//      carry:'L'|'R' + caseSwing, caseOnGround:{x}, b (breath) }
export function youssef(p) {
  push(); translate(p.x, p.y); if (p.mirror) scale(-1, 1); scale(p.k || 1);
  scale(p.sx || 1, p.sy || 1); if (p.lean) rotate(p.lean);
  const look = p.look ?? .5, fx = look * 13, bob = p.bob || 0;
  if (p.caseOnGround) suitcase(p.caseOnGround.x, -104, 0, 1, p.b || 0);
  // legs (jeans) + shoes
  for (const [key, s] of [['legL', -1], ['legR', 1]]) {
    const L = p[key] || { x: s * 22, y: 0 };
    hose([s * 15, -110 + bob], [L.x, L.y - 10], L.bend ?? s * 4, 22, C.jeans);
  }
  for (const [key, s] of [['legL', -1], ['legR', 1]]) {
    const L = p[key] || { x: s * 22, y: 0 }, dir = L.dir ?? (look > .25 ? 1 : look < -.25 ? -1 : s);
    shoe(L.x - dir * 8, L.y, dir, 1.18, L.ang || 0, C.yShoe);
  }
  translate(0, bob);
  const sh = s => [s * 46, -190];
  const arm = (key, s) => {
    const A = p[key]; if (!A) return;
    const a0 = sh(s);
    hose(a0, [A.x, A.y], A.bend ?? s * -12, 17, C.navy);
    const ang = A.rot ?? Math.atan2(A.y - a0[1], A.x - a0[0]);
    if (p.carry === (s < 0 ? 'L' : 'R')) suitcase(A.x + Math.cos(ang) * 14, A.y + 4, p.caseSwing || 0, 1, p.b || 0);
    glove(A.x, A.y, ang, p.carry === (s < 0 ? 'L' : 'R') ? 'grab' : (A.hand || 'open'), A.hk || .95, { flip: A.flip ?? s < 0 });
  };
  for (const [key, s] of [['armL', -1], ['armR', 1]]) if (p[key] && !p[key].front) arm(key, s);
  // neck
  const sink = p.sink || 0, hy = -270 + sink * 46;
  shape(rect(-15, -222 + sink * 30, 30, 30), { fill: C.skinY, lw: S.lw * .8 });
  // jacket (open, white tee showing), hard shadow band on the right
  const jacket = spline([[-46, -202], [0, -208], [46, -202], [58, -160], [55, -104], [0, -95], [-55, -104], [-58, -160]], true, 6);
  shape(jacket, {
    fill: C.navy, shade: () => {
      fillLocal([[30, -230], [80, -230], [80, -80], [34, -80]], C.navyShade);
      fillLocal([[-19, -210], [21, -210], [15, -150], [11, -90], [-9, -90], [-13, -150]], C.tee);
    }
  });
  stroke([[-19, -204], [-8, -158], [-12, -98]], S.lw * .7); stroke([[21, -204], [13, -158], [11, -98]], S.lw * .7);
  stroke([[-50, -128], [-28, -126]], S.lw * .5); // pocket
  // collar (turned up when he sinks into it)
  const cu = sink * 34;
  const collar = () => { for (const s of [-1, 1]) { const k = sink; shape([[s * lerp(40, 76, k), -200 - cu], [s * lerp(14, 52, k), -212 - cu * .7], [s * lerp(6, 46, k), -196], [s * lerp(26, 66, k), -182]], { fill: C.navy, lw: S.lw * .7 }); } };
  if (sink < .3) collar();
  // head
  push(); translate(look * 5, 0);
  const hc = [0, hy], rx = 56, ry = 63;
  shape(ell(hc[0] - 55 + fx * .3, hc[1] + 6, 11, 15, 16), { fill: C.skinY, lw: S.lw * .8 });
  shape(ell(hc[0] + 55 + fx * .3, hc[1] + 6, 11, 15, 16), { fill: C.skinY, lw: S.lw * .8 });
  const fl = clamp(p.flush || 0, 0, 1);
  shape(ell(hc[0], hc[1], rx, ry, 48), {
    fill: C.skinY, shade: () => {
      if (fl > 0) { const yl = hc[1] + ry + 4 - fl * (ry * 2 + 12); fillLocal(rect(-80, yl, 160, 200), C.flush); stroke([[-80, yl], [80, yl]], S.lw * .5, { line: P.dark }); }
      // beard band: jaw + chin, leaves the mouth area clear
      const outer = arc(hc[0], hc[1], rx + 2, ry + 2, .02 * Math.PI, .98 * Math.PI, 26);
      const inner = arc(hc[0] + fx * .4, hc[1] - 6, 48, 54, .98 * Math.PI, .02 * Math.PI, 26);
      fillLocal([...outer, ...inner], C.beard);
    }
  });
  // hair: neat short cap with a little quiff + a glossy white tick
  const hairPts = [...arc(hc[0], hc[1] - 2, rx + 3, ry + 5, 1.07 * Math.PI, 1.93 * Math.PI, 22),
    [hc[0] + 55, hc[1] - 10], [hc[0] + 46, hc[1] - 30], [hc[0] + 22 + fx * .3, hc[1] - 52], [hc[0] + fx * .3, hc[1] - 50], [hc[0] - 24 + fx * .3, hc[1] - 54], [hc[0] - 47, hc[1] - 30], [hc[0] - 56, hc[1] - 10]];
  shape(hairPts, { fill: C.hair, lw: S.lw * .8 });
  shape(spline([[hc[0] - 14 + fx, hc[1] - 64], [hc[0] + 8 + fx, hc[1] - 82], [hc[0] + 36 + fx, hc[1] - 74], [hc[0] + 26 + fx, hc[1] - 58]], true, 5), { fill: C.hair, lw: S.lw * .8 });
  stroke(arc(hc[0] - 18, hc[1] - 30, 30, 26, 1.25 * Math.PI, 1.55 * Math.PI, 8), S.lw * .9, { line: P.white, boil: .4 });
  // moustache
  const mx = hc[0] + fx * 1.1 + 4, my = hc[1] + 30;
  shape(ribbon(quad([mx - 20, my - 8], [mx, my - 17], [mx + 20, my - 8], 8), 8, 8), { fill: C.beard, lw: S.lw * .5 });
  // eyes, brows, nose, mouth
  const E = p.eyes || {}, ey = hc[1] - 12;
  pieEye(hc[0] + fx - 19, ey, 15, 21, { ...E, lidCol: fl > .6 ? C.flush : C.skinY, side: 1 });
  pieEye(hc[0] + fx + 19, ey, 15, 21, { ...E, lidCol: fl > .6 ? C.flush : C.skinY, side: -1 });
  if (p.brows) { brow(hc[0] + fx - 20, ey - 27, 24, p.brows, -1); brow(hc[0] + fx + 20, ey - 27, 24, p.brows, 1); }
  shape(ell(hc[0] + fx * 1.7 + 3, hc[1] + 10, 12, 10, 16), { fill: fl > .75 ? C.flush : C.skinY, lw: S.lw * .75 });
  const M = p.mouth || { type: 'smile' };
  mouth(mx, my + 4, M.w || 34, M.type, M);
  // sweat, ear steam
  if (p.sweat) for (const [sx, sy2, r] of p.sweat) drop(sx, sy2, r);
  if (p.steam > 0) {
    const t = p.t || 0;
    for (const side of [-1, 1]) for (let i = 0; i < 4; i++) {
      const u = ((t * 1.6 + i * .25 + (side > 0 ? .12 : 0)) % 1), j = (i * 3 + (side > 0 ? 2 : 0)) % 5;
      const ex = hc[0] + side * (68 + u * (60 + j * 12)), eyy = hc[1] - 4 - u * (90 + j * 18) - j * 4;
      T.g.globalAlpha = p.steam * (u < .8 ? 1 : (1 - u) * 5);
      puff(ex, eyy, 6 + u * (12 + j * 2.5));
      T.g.globalAlpha = 1;
    }
  }
  pop();
  if (sink >= .3) collar();
  for (const [key, s] of [['armL', -1], ['armR', 1]]) if (p[key] && p[key].front) arm(key, s);
  pop();
}

// ——— Mia ———
// p: { x, y, k, mirror, sx, sy, lean, look, legL, legR, armL, armR, eyes, brows, mouth, pony (swing, -1..1), qmark (0..1), t, headTilt }
const PONY_N = [[-36, -50], [-62, -60], [-86, -42], [-96, -8], [-92, 30], [-80, 62], [-66, 84]];
const PONY_Q = [[-6, -54], [-4, -96], [16, -124], [30, -158], [12, -188], [-16, -190], [-32, -170]];
export function mia(p) {
  push(); translate(p.x, p.y); if (p.mirror) scale(-1, 1); scale(p.k || 1);
  scale(p.sx || 1, p.sy || 1); if (p.lean) rotate(p.lean);
  const look = p.look ?? .5, fx = look * 12;
  for (const [key, s] of [['legL', -1], ['legR', 1]]) { const L = p[key] || { x: s * 16, y: 0 }; hose([s * 13, -112], [L.x, L.y - 7], L.bend ?? s * 2, 12, P.ink); }
  for (const [key, s] of [['legL', -1], ['legR', 1]]) { const L = p[key] || { x: s * 16, y: 0 }; const dir = L.dir ?? (look > .25 ? 1 : s); shoe(L.x - dir * 5, L.y, dir, .82, L.ang || 0); stroke([[L.x - dir * 6, L.y - 15], [L.x + dir * 6, L.y - 17]], S.lw * .5, { line: P.white }); }
  const sh = s => [s * 40, -222];
  const arm = (key, s) => {
    const A = p[key]; if (!A) return; const a0 = sh(s);
    hose(a0, [A.x, A.y], A.bend ?? s * -10, 14, C.cardi);
    glove(A.x, A.y, A.rot ?? Math.atan2(A.y - a0[1], A.x - a0[0]), A.hand || 'open', A.hk || .82, { flip: A.flip ?? s < 0 });
  };
  for (const [key, s] of [['armL', -1], ['armR', 1]]) if (p[key] && !p[key].front) arm(key, s);
  // skirt (bell) with pleats
  shape(spline([[-30, -178], [30, -178], [48, -142], [68, -112], [0, -104], [-68, -112], [-48, -142]], true, 6), {
    fill: C.skirt, shade: () => { fillLocal([[24, -190], [90, -190], [90, -90], [40, -90]], C.skirtShade); }
  });
  for (const dx of [-36, -12, 14]) stroke([[dx * .55, -170], [dx, -112]], S.lw * .5, { boil: .5 });
  // cardigan
  shape(spline([[-38, -234], [0, -240], [38, -234], [46, -204], [40, -170], [0, -164], [-40, -170], [-46, -204]], true, 6), {
    fill: C.cardi, shade: () => { fillLocal([[26, -250], [70, -250], [70, -150], [30, -150]], C.cardiShade); }
  });
  stroke([[4, -228], [4, -168]], S.lw * .6);
  for (const by of [-212, -196, -180]) T.dot(10, by, 3.6);
  // blouse collar
  shape([[-2, -238], [-26, -238], [-20, -222]], { fill: P.white, lw: S.lw * .6 });
  shape([[6, -238], [30, -238], [22, -222]], { fill: P.white, lw: S.lw * .6 });
  // head
  push(); translate(0, -292); if (p.headTilt) rotate(p.headTilt); translate(0, 292);
  const hc = [look * 5, -292], rx = 50, ry = 56;
  shape(rect(-11, -248, 22, 14), { fill: C.skinM, lw: S.lw * .7 });
  // ponytail (behind the head): normal → question mark
  const qm = clamp(p.qmark || 0, 0, 1), sw = p.pony || 0;
  const cpts = PONY_N.map((n, i) => { const qq = PONY_Q[i], u = i / (PONY_N.length - 1); return [hc[0] + lerp(n[0] + sw * 26 * u * u, qq[0], qm), hc[1] + lerp(n[1] + Math.abs(sw) * -8 * u, qq[1], qm)]; });
  const cl = spline(cpts, false, 6);
  shape(ribbon(cl, lerp(34, 26, qm), lerp(12, 24, qm)), { fill: C.hairM, lw: S.lw * .8, shade: () => { } });
  stroke(cl.filter((_, i) => i > 3 && i < cl.length - 5), S.lw * .5, { line: C.hairMShade, boil: .5 });
  shape(ell(hc[0], hc[1], rx, ry, 44), { fill: C.skinM, lw: S.lw });
  // hair cap with a side-swept fringe
  const cap = [...arc(hc[0], hc[1] - 2, rx + 4, ry + 5, 1.02 * Math.PI, 1.98 * Math.PI, 22),
    [hc[0] + 52, hc[1] - 4], [hc[0] + 40, hc[1] - 30], [hc[0] + 12 + fx * .4, hc[1] - 36], [hc[0] - 18 + fx * .3, hc[1] - 52], [hc[0] - 30, hc[1] - 36], [hc[0] - 50, hc[1] - 4]];
  shape(cap, { fill: C.hairM, lw: S.lw * .85, shade: () => { fillLocal([[hc[0] + 20, hc[1] - 80], [hc[0] + 70, hc[1] - 80], [hc[0] + 70, hc[1]], [hc[0] + 30, hc[1]]], C.hairMShade); } });
  stroke(quad([hc[0] - 30, hc[1] - 50], [hc[0] - 5, hc[1] - 62], [hc[0] + 30, hc[1] - 44]), S.lw * .5, { line: C.hairMShade });
  // bow at the ponytail root
  const bx = lerp(hc[0] - 34, hc[0] - 6, qm), by = lerp(hc[1] - 52, hc[1] - 58, qm);
  shape(ell(bx - 16, by - 6, 15, 9, 14), { fill: P.white, lw: S.lw * .6 }); shape(ell(bx + 14, by - 8, 15, 9, 14), { fill: P.white, lw: S.lw * .6 });
  shape(ell(bx, by - 6, 6, 6, 10), { fill: P.white, lw: S.lw * .6 });
  // face
  const E = p.eyes || {}, ey = hc[1] - 4;
  for (const s of [-1, 1]) {
    const ex = hc[0] + fx + s * 17;
    pieEye(ex, ey, 14, 20, { ...E, lidCol: C.skinM, side: -s });
    if (!E.type || E.type === 'open' || E.type === 'wide') for (let i = 0; i < 3; i++) { const a = (s > 0 ? -.35 : -.65) * Math.PI + s * (i - 1) * .16; const r0 = E.type === 'wide' ? 23 : 20; stroke([[ex + Math.cos(a) * 14 * 1.05, ey + Math.sin(a) * r0], [ex + Math.cos(a) * 14 * 1.6, ey + Math.sin(a) * r0 * 1.45]], S.lw * .5); }
  }
  if (p.brows) { brow(hc[0] + fx - 18, ey - 33, 20, p.brows, -1); brow(hc[0] + fx + 18, ey - 33, 20, p.brows === 'one' ? 'up' : p.brows, 1); }
  shape(ell(hc[0] + fx * 1.5 + 2, hc[1] + 16, 6, 5, 12), { fill: C.skinM, lw: S.lw * .6 });
  shape(ell(hc[0] + fx - 33, hc[1] + 24, 9, 6, 12), { fill: P.pale, stroke: false, boil: .3 }); shape(ell(hc[0] + fx + 33, hc[1] + 24, 9, 6, 12), { fill: P.pale, stroke: false, boil: .3 });
  const M = p.mouth || { type: 'lips' }, mx = hc[0] + fx * 1.2 + 2, my = hc[1] + 32;
  if (M.type === 'lips') {
    shape(spline([[mx - 15, my], [mx - 7, my - 5], [mx, my - 2], [mx + 7, my - 5], [mx + 15, my], [mx + 6, my + 7], [mx - 6, my + 7]], true, 4), { fill: P.dark, lw: S.lw * .55 });
    stroke(arc(mx - 18, my - 2, 4, 4, Math.PI * .6, Math.PI * 1.4, 5), S.lw * .5); stroke(arc(mx + 18, my - 2, 4, 4, -Math.PI * .4, Math.PI * .4, 5), S.lw * .5);
  } else mouth(mx, my, M.w || 30, M.type, M);
  pop();
  for (const [key, s] of [['armL', -1], ['armR', 1]]) if (p[key] && p[key].front) arm(key, s);
  pop();
}
