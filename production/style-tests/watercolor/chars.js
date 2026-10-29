// ---------- the two characters: brush-stroke figures rebuilt every frame from a pose (fixed seeds per part) ----------
const C = {
  ySkin: '#a96d45', ySkin2: '#7c4b2e', yHair: '#1f1916', navy: '#2c3c5e', navy2: '#1a2440', jean: '#4b6b98', jean2: '#34507c', shoe: '#6f4526',
  suit: '#d24a2b', suit2: '#9f2f1b',
  mSkin: '#f1c7a9', mSkin2: '#d99b7b', mHair: '#b5522a', mHair2: '#83361b', must: '#dba22b', must2: '#a8761a', teal: '#27847e', teal2: '#1b5f5a', mShoe: '#57392b',
  mouth: '#5d2520', lip: '#c2564c', blush: '#de6a62', sweat: '#7fb2cf', grey: '#b8b2a7'
};
// affine helpers (local figure coords: feet at 0,0, y down, facing +x)
const AF = (a = 1, b = 0, c = 0, d = 1, e = 0, f = 0) => ({ a, b, c, d, e, f });
const apP = (M, p) => [M.a * p[0] + M.c * p[1] + M.e, M.b * p[0] + M.d * p[1] + M.f];
const mulM = (M, N) => ({ a: M.a * N.a + M.c * N.b, b: M.b * N.a + M.d * N.b, c: M.a * N.c + M.c * N.d, d: M.b * N.c + M.d * N.d, e: M.a * N.e + M.c * N.f + M.e, f: M.b * N.e + M.d * N.f + M.f });
const rotAt = (ang, ox, oy) => { const cs = Math.cos(ang), sn = Math.sin(ang); return AF(cs, sn, -sn, cs, ox - cs * ox + sn * oy, oy - sn * ox - cs * oy); };
const trM = (x, y) => AF(1, 0, 0, 1, x, y);
const addv = (p, a, l) => [p[0] + Math.sin(a) * l, p[1] + Math.cos(a) * l];   // angle 0 = straight down, + = forward
function ik(S, T, l1, l2, bend) {          // 2-bone IK; bend = +1 elbow forward/up, -1 back/down
  const dx = T[0] - S[0], dy = T[1] - S[1], d = clamp(Math.hypot(dx, dy), Math.abs(l1 - l2) + 1, l1 + l2 - .5);
  const base = Math.atan2(dy, dx), cA = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1), A = base - bend * Math.acos(cA);
  const E = [S[0] + Math.cos(A) * l1, S[1] + Math.sin(A) * l1], ang = Math.atan2(T[1] - E[1], T[0] - E[0]);
  return [E, [E[0] + Math.cos(ang) * l2, E[1] + Math.sin(ang) * l2]];
}
const mid = (a, b, k = .5) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
const chain = (...P) => { const out = []; for (let i = 0; i < P.length - 1; i++) for (let k = 0; k < 4; k++) out.push(mid(P[i], P[i + 1], k / 4)); out.push(P[P.length - 1]); return out; };
// part(seed): every part has its own fixed seed, so a pose change never reshuffles another part's brush texture
const part = (seed, fn) => withSeed(seed, fn);

function arc(cx, cy, rx, ry, a0, a1, n = 10) { const out = []; for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n) * Math.PI / 180; out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return out; }

function headStrokes(D, F, M, seed) {
  const L = [], st = (pts, w, col, o) => L.push(mk(pts.map(p => apP(M, p)), w, col, o));
  const y = D.kind === 'y';
  const skin = y ? C.ySkin : C.mSkin, skin2 = y ? C.ySkin2 : C.mSkin2, hair = y ? C.yHair : C.mHair, hair2 = y ? C.yHair : C.mHair2;
  part(seed + 1, () => {
    if (!y) { // ponytail behind the head
      const sw = F.tail || 0;
      st(qctrl(-20, -24, -44, -18, -46 + sw * 6, 26, 10), 26, C.mHair, { prof: 'tip', nb: 6, a: .9, rib: .8 });
      st(qctrl(-22, -20, -38, -4, -38 + sw * 7, 40, 10), 16, C.mHair2, { prof: 'tip', nb: 4, a: .75 });
      st(qctrl(-24, -26, -50, -24, -54 + sw * 5, 14, 8), 10, C.mHair, { prof: 'tip', nb: 3, a: .7 });
    }
    st(qcurve(0, -33, 1, 32, 2, 10), y ? 52 : 50, skin, { prof: 'leaf', nb: 4, a: .92, rib: .86, rough: .1 });
    st(qcurve(8, -16, 14, 27, -4, 8), y ? 30 : 26, skin, { prof: 'leaf', nb: 0, a: .55, rough: .1 });
    st(qcurve(-21, -12, -15, 24, -3, 8), 9, skin2, { prof: 'leaf', nb: 0, a: .42, ko: false });
    st(qcurve(-8, -7, -11, 9, 5, 5), 12, skin2, { prof: 'leaf', nb: 0, a: .75 });
    st(qcurve(23, -8, 29, 4, -3, 5), 6, skin2, { prof: 'tip', nb: 0, a: .7, ko: false });
    st(qcurve(23, 5, 27, 6, 0, 3), 3.5, skin2, { prof: 'leaf', nb: 0, a: .8, ko: false });
  });
  part(seed + 2, () => {
    if (y) {
      for (const [f, a0, a1, w] of [[1.02, 158, 300, 13], [.92, 170, 306, 13], [.8, 190, 300, 12], [.66, 212, 292, 12], [.98, 120, 176, 11]]) st(arc(0, 0, 27 * f, 33 * f, a0, a1, 10), w, hair, { prof: 'brush', nb: 4, a: .9, rib: .8 });
      st(qcurve(-5, -15, -7, 6, -2, 5), 7, hair, { prof: 'even', nb: 0, a: .85 });   // sideburn
      for (let k = 0; k < 4; k++) st(qcurve(4 + k * 4, -26 + k * 1.5, 9 + k * 4, -30 + k * 2, -1, 3), 6, hair, { prof: 'tip', nb: 0, a: .85 });
      // short, neat beard
      st(arc(0, 0, 25.5, 31, 150, 22, 12), 11, hair, { prof: 'even', nb: 4, a: .48, ko: false });
      st(arc(0, 0, 22, 27, 135, 40, 10), 9, hair, { prof: 'even', nb: 3, a: .32, ko: false });
      st(qcurve(10, 28, 18, 29, 2, 4), 10, hair, { prof: 'leaf', nb: 0, a: .45, ko: false });
      st(qcurve(12, 12, 27, 10, -2, 5), 5.5, hair, { prof: 'leaf', nb: 0, a: .78, ko: false });
    } else {
      for (const [f, a0, a1, w] of [[1.03, 150, 300, 14], [.93, 165, 310, 13], [.8, 185, 300, 12], [.66, 205, 290, 12]]) st(arc(0, 0, 26 * f, 32 * f, a0, a1, 10), w, C.mHair, { prof: 'brush', nb: 4, a: .9, rib: .8 });
      // side-swept fringe
      st(qctrl(-6, -34, 14, -30, 26, -12, 8), 10, C.mHair, { prof: 'tip', nb: 3, a: .85 });
      st(qctrl(-12, -30, 8, -24, 20, -14, 8), 8, C.mHair2, { prof: 'tip', nb: 2, a: .6 });
      st(qcurve(-14, -20, -16, 4, -3, 5), 8, C.mHair, { prof: 'tip', nb: 0, a: .8 });
      st(qcurve(-22, -26, -26, -16, 0, 3), 9, '#2a8a84', { prof: 'leaf', nb: 0, a: .85 });   // hair tie
      st(qcurve(-10, 9, -10, 12, 0, 2), 4.5, '#2a8a84', { prof: 'leaf', nb: 0, a: .9 });    // earring
    }
  });
  // features (ink), driven by the face state F
  part(seed + 3, () => {
    const ink = y ? '#1d1714' : '#2b2018', bl = clamp(F.blink || 0), lx = F.lx || 0, ly = F.ly || 0;
    for (const [ex, ey, s] of [[7, -4, 1], [21, -5, .85]]) {
      const h = 4.4 * (1 - .9 * bl);
      st(qcurve(ex + lx, ey + ly - h, ex + lx + .3, ey + ly + h, 0, 3), 6.6 * s, ink, { prof: 'leaf', nb: 0, a: .95 });
      if (!y) st(qcurve(ex + 3.5 * s, ey - 4, ex + 7 * s, ey - 6.5, 0, 2), 2, ink, { prof: 'tip', nb: 0, a: .8 });
    }
    const r = F.brow || 0, wv = F.worry || 0, bc = y ? C.yHair : '#7c3a1f';
    st(qcurve(0, -14 - r * 4 + wv * 1.5, 12, -16 - r * 4 - wv * 5 + (F.browL || 0), -2, 4), y ? 4.8 : 3.6, bc, { prof: 'even', nb: 0, a: .9 });
    st(qcurve(16, -16 - r * 4 - wv * 5 + (F.browR || 0), 26, -14 - r * 4 + wv * 1.5 + (F.browR || 0) * .5, -2, 4), y ? 4.4 : 3.4, bc, { prof: 'even', nb: 0, a: .9 });
    const mc = y ? C.mouth : '#7a2f28', sm = F.smile || 0, op = F.open || 0;
    if (F.grim > .5 && op < .1) st([[12, 19], [15, 17], [18, 19.5], [21, 17], [24, 19], [26.5, 17.5]], 2.8, mc, { prof: 'even', nb: 0, a: .9, rough: .1 });
    else if (op > .06) {
      st(qcurve(12, 18, 26, 18, sm * 4, 6), 2 + op * 10, mc, { prof: 'leaf', nb: 0, a: .92 });
      if (op > .4) st(qcurve(15, 18 + op * 3, 23, 18 + op * 3, 0, 4), op * 4, '#b9574d', { prof: 'leaf', nb: 0, a: .6 });
    } else st(qcurve(12, 18, 26, 17, sm * 5, 6), y ? 3 : 2.8, y ? mc : C.lip, { prof: 'even', nb: 0, a: .88 });
    if ((F.blush || 0) > 0) for (const [a, b, w] of [[[0, 9], [11, 9], 10], [[19, 8], [27, 8], 8]]) st(qcurve(a[0], a[1], b[0], b[1], 0, 4), w, C.blush, { prof: 'leaf', nb: 0, a: .5 * F.blush, ko: false });
    if (!y) for (const [a, b] of [[[1, 10], [9, 10]], [[20, 9], [26, 9]]]) st(qcurve(a[0], a[1], b[0], b[1], 0, 4), 7, C.blush, { prof: 'leaf', nb: 0, a: .22, ko: false });
    if ((F.sweat || 0) > 0) { const sy = -30 + (F.sweatSlide || 0) * 14; st(qcurve(-10, sy + 8, -10.5, sy - 6, 0, 5), 8, C.sweat, { prof: 'tip', nb: 0, a: .85 * F.sweat }); st(qcurve(-12, sy + 6, -12, sy + 2, 0, 2), 2, '#3d6f8f', { prof: 'even', nb: 0, a: .6 * F.sweat, ko: false }); }
  });
  return L;
}

// a whole figure → list of groups (each group is knocked out to paper, then painted)
function figure(D, P, seed) {
  const y = D.kind === 'y';
  const G = [[], [], [], [], []];   // 0 prop, 1 far limbs, 2 near leg / skirt, 3 torso + near arm, 4 head
  const st = (g, pts, w, col, o) => G[g].push(mk(pts, w, col, o));
  // legs: stance leg keeps its foot on the floor
  const LT = 86, LS = 86, legEnd = (a, k) => Math.cos(a) * LT + Math.cos(a - k) * LS;
  const drop = 172 - Math.max(legEnd(P.legN[0], P.legN[1]), legEnd(P.legF[0], P.legF[1]));
  const hipY = -172 + drop + (P.bob || 0);
  const UB = rotAt(P.lean || 0, 0, hipY), U = p => apP(UB, [p[0], p[1] + (hipY + 172)]);
  const shUp = P.shUp || 0;
  const legs = [['F', P.legF, -8, 1], ['N', P.legN, 6, 2]];
  for (const [nm, [a, k], hx, g] of legs) part(seed + 10 + g, () => {
    const H = [hx, hipY], K = addv(H, a, LT), A = addv(K, a - k, LS);
    const far = nm === 'F';
    if (y) {
      const s = mk(chain(H, K, A), 30, far ? C.jean2 : C.jean, { prof: 'lin', end: .7, nb: 4, a: .92, rib: .82 });
      G[g].push(s, edgeOf(s, -1, 3.5, C.jean2, .55));
    } else {
      st(g === 2 ? 1 : 1, chain(H, K, A), 15, far ? C.mSkin2 : C.mSkin, { prof: 'lin', end: .68, nb: 2, a: .85, rib: .82 });
    }
    const fa = clamp((a - k) * .6, -.5, .6), heel = [A[0] - 7, A[1] + 3], toe = [A[0] + Math.cos(fa) * 26, A[1] + 5 + Math.sin(fa) * 26];
    st(y ? g : 1, qcurve(heel[0], heel[1], toe[0], toe[1], -3, 5), y ? 15 : 11, y ? C.shoe : C.mShoe, { prof: 'even', nb: 2, a: .95, rib: .85 });
  });
  // torso
  part(seed + 20, () => {
    if (y) {
      for (const x of [-25, -13, -1]) st(3, [U([x, -262 + shUp]), U([x + .5, -214]), U([x + 1, -166])], 17, C.navy, { prof: 'even', nb: 3, a: .9, rib: .8 });
      st(3, [U([21, -258 + shUp]), U([23, -214]), U([25, -167])], 13, C.navy, { prof: 'even', nb: 2, a: .9, rib: .8 });
      st(3, qcurve(...U([-30, -257 + shUp]), ...U([24, -261 + shUp]), -5, 8), 17, C.navy, { prof: 'even', nb: 3, a: .85, rib: .8 });
      st(3, [U([12, -262 + shUp]), U([12, -214]), U([12, -170])], 13, '#000', { a: 0, nb: 0 });              // white tee: paper, knocked out only
      st(3, qcurve(...U([4, -262 + shUp]), ...U([18, -261 + shUp]), 5, 5), 3, C.grey, { prof: 'even', nb: 0, a: .7, ko: false });
      st(3, [U([7, -250]), U([8, -210]), U([8, -172])], 2.5, C.grey, { prof: 'even', nb: 0, a: .45, ko: false });
      st(3, [U([-31, -255 + shUp]), U([-30, -210]), U([-28, -168])], 4, C.navy2, { prof: 'even', nb: 0, a: .7, ko: false });
      st(3, [U([5, -262 + shUp]), U([6, -230]), U([6, -170])], 3, C.navy2, { prof: 'even', nb: 0, a: .6, ko: false });
      st(3, [U([19, -260 + shUp]), U([20, -230]), U([21, -170])], 3, C.navy2, { prof: 'even', nb: 0, a: .6, ko: false });
      st(3, qcurve(...U([-29, -168]), ...U([26, -168]), 2, 6), 6, C.navy2, { prof: 'even', nb: 0, a: .55, ko: false });
      st(3, [U([0, -264 + shUp]), U([2, -280]), U([4, -290])], 17, C.ySkin2, { prof: 'even', nb: 0, a: .85 });
    } else {
      // skirt (A-line), blouse (paper), cardigan
      const sw = P.skirt || 0;
      for (let k = 0; k <= 4; k++) { const u = k / 4; st(2, [U([lerp(-20, 20, u), -178]), U([lerp(-26, 26, u) + sw, -134]), U([lerp(-34, 36, u) + sw * 2, -92])], 19, C.teal, { prof: 'even', nb: 3, a: .88, rib: .8 }); }
      st(2, qcurve(...U([-35 + sw * 2, -93]), ...U([37 + sw * 2, -93]), 3, 6), 4, C.teal2, { prof: 'even', nb: 0, a: .6, ko: false });
      st(2, [U([-6, -178]), U([-4 + sw, -134]), U([-3 + sw * 2, -94])], 2.5, C.teal2, { prof: 'even', nb: 0, a: .4, ko: false });
      for (const x of [-21, -10]) st(3, [U([x, -256 + shUp]), U([x, -205]), U([x - 1, -150])], 15, C.must, { prof: 'even', nb: 3, a: .9, rib: .82 });
      st(3, [U([19, -254 + shUp]), U([21, -205]), U([22, -150])], 11, C.must, { prof: 'even', nb: 2, a: .9, rib: .82 });
      st(3, qcurve(...U([-27, -252 + shUp]), ...U([22, -256 + shUp]), -5, 8), 15, C.must, { prof: 'even', nb: 3, a: .85, rib: .8 });
      st(3, [U([6, -258 + shUp]), U([7, -205]), U([7, -176])], 14, '#000', { a: 0, nb: 0 });     // blouse: paper
      st(3, qcurve(...U([-2, -254 + shUp]), ...U([14, -253 + shUp]), 6, 5), 2.6, C.grey, { prof: 'even', nb: 0, a: .7, ko: false });
      st(3, qcurve(...U([-27, -152]), ...U([22, -151]), 2, 6), 7, C.must2, { prof: 'even', nb: 2, a: .6, ko: false });
      st(3, [U([-27, -250 + shUp]), U([-27, -200]), U([-27, -152])], 3.5, C.must2, { prof: 'even', nb: 0, a: .6, ko: false });
      for (const by of [-235, -212, -189]) st(3, qcurve(...U([17, by]), ...U([18, by + 1]), 0, 2), 4, C.must2, { prof: 'leaf', nb: 0, a: .9, ko: false });
      st(3, [U([0, -258 + shUp]), U([1, -272]), U([3, -284])], 13, C.mSkin2, { prof: 'even', nb: 0, a: .7 });
    }
  });
  // arms
  const arm = (nm, g, S0, spec, dark) => part(seed + 30 + g, () => {
    const S = U(S0); let E, W;
    if (spec.target) [E, W] = ik(S, spec.target, 64, 62, spec.bend ?? 1);
    else { E = addv(S, spec.a + (P.lean || 0), 64); W = addv(E, spec.a + spec.e + (P.lean || 0), 62); }
    const sl = y ? (dark ? C.navy2 : C.navy) : (dark ? C.must2 : C.must), sk = y ? (dark ? C.ySkin2 : C.ySkin) : (dark ? C.mSkin2 : C.mSkin);
    const s = mk(chain(S, E, W), y ? 21 : 17, sl, { prof: 'lin', end: .78, nb: 3, a: .92, rib: .82 });
    G[g].push(s); if (!dark) G[g].push(edgeOf(s, -1, 3, y ? C.navy2 : C.must2, .5));
    const dx = W[0] - E[0], dy = W[1] - E[1], dl = Math.hypot(dx, dy) || 1, ux = dx / dl, uy = dy / dl;
    if (spec.open) { // open palm, fingers spread
      st(g, qcurve(W[0], W[1], W[0] + ux * 14, W[1] + uy * 14, 0, 4), y ? 15 : 13, sk, { prof: 'leaf', nb: 0, a: .92 });
      const base = Math.atan2(uy, ux);
      for (let f = 0; f < 4; f++) { const an = base + (f - 1.5) * .26 + (spec.spread || 0), hx = W[0] + ux * 11, hy = W[1] + uy * 11; st(g, qcurve(hx, hy, hx + Math.cos(an) * 13, hy + Math.sin(an) * 13, 0, 3), 4.6, sk, { prof: 'tip', nb: 0, a: .9 }); }
      st(g, qcurve(W[0] + ux * 4, W[1] + uy * 4, W[0] + ux * 6 - uy * 12, W[1] + uy * 6 + ux * 12, 0, 3), 4.6, sk, { prof: 'tip', nb: 0, a: .9 });
    } else st(g, qcurve(W[0] - ux * 2, W[1] - uy * 2, W[0] + ux * 17, W[1] + uy * 17, 2, 4), y ? 16 : 13, sk, { prof: 'leaf', nb: 0, a: .92 });
    return W;
  });
  const handF = arm('F', 1, [-16, -258 + shUp], P.armF, true);
  arm('N', 3, [12, -258 + shUp], P.armN, false);
  // suitcase (Youssef): wheels at P.case.x, tilt P.case.th, telescopic rod up to the far hand
  if (y && P.case) part(seed + 40, () => {
    const { x, th } = P.case, M = mulM(trM(x, 0), rotAt(th, 0, 0)), Q = p => apP(M, p);
    for (const cx of [13, 34, 56, 77]) st(0, [Q([cx, -128]), Q([cx, -70]), Q([cx, -12])], 24, C.suit, { prof: 'even', nb: 3, a: .9, rib: .84 });
    st(0, qcurve(...Q([3, -130]), ...Q([88, -130]), -3, 6), 9, C.suit, { prof: 'even', nb: 2, a: .8 });
    for (const cx of [31, 59]) st(0, [Q([cx, -124]), Q([cx, -16])], 3, C.suit2, { prof: 'even', nb: 0, a: .6, ko: false });
    st(0, [Q([87, -126]), Q([88, -70]), Q([87, -12])], 5, C.suit2, { prof: 'even', nb: 0, a: .55, ko: false });
    for (const wx of [10, 80]) st(0, qcurve(...Q([wx - 5, -5]), ...Q([wx + 5, -5]), 0, 3), 10, '#2b2520', { prof: 'leaf', nb: 0, a: .9 });
    const top = Q([44, -132]);
    st(0, qcurve(...Q([38, -134]), handF[0] - 3, handF[1] + 6, 0, 6), 3, '#6c6862', { prof: 'even', nb: 0, a: .9 });
    st(0, qcurve(...Q([50, -134]), handF[0] + 4, handF[1] + 6, 0, 6), 3, '#6c6862', { prof: 'even', nb: 0, a: .9 });
    st(0, qcurve(handF[0] - 6, handF[1] + 2, handF[0] + 7, handF[1] + 2, 0, 3), 6, '#3b3835', { prof: 'even', nb: 0, a: .9 });
    void top;
  });
  // head
  const neck = U([3, -284 + shUp]);
  const HM = mulM(rotAt(P.tilt || 0, neck[0], neck[1]), mulM(trM(...U([6, -314 + shUp * .8])), rotAt((P.lean || 0), 0, 0)));
  G[4].push(...headStrokes(D, P.face || {}, HM, seed + 100));
  return G;
}

// paint a figure: groups knocked out to paper then painted; p<1 paints it in stroke by stroke (structure first)
function drawFigure(c, G, p = 1) {
  const all = G.flat(), N = all.length; if (!N) return;
  if (p >= 1) { for (const g of G) { koList(c, g, 1); for (const s of g) drawS(c, s); } return; }
  const dur = Math.min(.5, Math.max(.12, 4 / N)); let j0 = 0;
  for (const g of G) {
    PAPER_PAT.setTransform(c.getTransform().invertSelf()); c.fillStyle = PAPER_PAT;
    for (let j = 0; j < g.length; j++) { const q = (p - (j0 + j) / N * (1 - dur)) / dur; if (q <= 0 || !g[j].ko) continue; c.beginPath(); ribbonPath(c, g[j], q); c.fill(); }
    for (let j = 0; j < g.length; j++) drawS(c, g[j], (p - (j0 + j) / N * (1 - dur)) / dur);
    j0 += g.length;
  }
}
