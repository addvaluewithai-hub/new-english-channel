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
// head outline (3/4 view facing +x): skull ellipse, jaw pulled forward to a chin
function headPts(rx, ry, f = 1) {
  const out = [];
  for (let i = 0; i < 36; i++) {
    const a = i / 36 * Math.PI * 2, s = Math.sin(a), c = Math.cos(a);
    let x = c * rx * f, y = s * ry * f;
    if (s > 0) { x += s * s * 5 * f * (c > -.2 ? 1 : .3); x *= 1 - .12 * s * (c < 0 ? 1 : .4); }
    out.push([x, y]);
  }
  return out;
}

function headStrokes(D, F, M, seed) {
  const L = [], T = pts => pts.map(p => apP(M, p));
  const st = (pts, w, col, o) => L.push(mk(T(pts), w, col, o));
  const wa = (pts, col, a, o = {}) => L.push(wash(T(pts), col, a, { raw: true, jit: o.jit ?? 1.2, edge: o.edge ?? .55, ko: o.ko, ew: o.ew ?? 1.8 }));
  const y = D.kind === 'y';
  const skin = y ? C.ySkin : C.mSkin, skin2 = y ? C.ySkin2 : C.mSkin2;
  const RX = y ? 31 : 29.5, RY = y ? 38 : 36.5;
  part(seed + 1, () => {
    if (!y) { // ponytail behind the head
      const sw = F.tail || 0;
      st(qctrl(-24, -26, -54, -20, -52 + sw * 7, 34, 12), 30, C.mHair, { prof: 'tip', nb: 7, a: .92, rib: .85 });
      st(qctrl(-26, -22, -44, -2, -44 + sw * 8, 50, 12), 18, C.mHair2, { prof: 'tip', nb: 4, a: .7 });
      st(qctrl(-28, -30, -60, -28, -62 + sw * 6, 18, 10), 12, C.mHair, { prof: 'tip', nb: 3, a: .75 });
    }
    st([[0, 22], [2, 36], [3, 48]], y ? 22 : 18, skin2, { prof: 'even', nb: 0, a: .9, rib: .95 });   // neck
    wa(headPts(RX, RY), skin, .9, { jit: 1 });
    st(arc(0, 0, RX * .86, RY * .86, 110, 250, 10), 10, skin2, { prof: 'leaf', nb: 0, a: .38, ko: false });       // shadow side
    if (!y) { wa(arc(-9, 3, 7, 10, 0, 360, 14), skin2, .75, { jit: .6 }); st(qcurve(-10, -2, -8, 8, 3, 4), 2.2, darker(skin2), { prof: 'even', nb: 0, a: .6, ko: false }); }
    st(qcurve(28, -9, 35, 6, -3, 5), 6, skin2, { prof: 'tip', nb: 0, a: .75, ko: false });                           // nose
    st(qcurve(28, 7, 33, 7.5, 0, 3), 3.5, darker(skin2), { prof: 'leaf', nb: 0, a: .7, ko: false });
  });
  part(seed + 2, () => {
    if (y) {
      // short black hair: a cap wash + a few brush marks for texture
      const cap = [...arc(0, 0, RX * 1.05, RY * 1.05, 172, 312, 16), [22, -31], [13, -34], [4, -32], [-4, -26], [-7, -12], [-8, 2], [-14, 4], [-24, 6]];
      wa(cap, C.yHair, .82, { jit: 1.4, edge: .15 });
      for (const [a0, a1] of [[195, 300], [210, 290], [180, 250]]) st(arc(0, 0, RX * .97, RY * .97, a0, a1, 10), 8, '#4a3c33', { prof: 'brush', nb: 5, a: .5, rib: .2, ko: false });
      wa(arc(-9, 4, 6, 9, 0, 360, 14), mixc(C.ySkin, C.ySkin2, .4), .85, { jit: .5, ko: false });
      st(qcurve(-10, 0, -8, 9, 3, 4), 2, darker(C.ySkin2), { prof: 'even', nb: 0, a: .55, ko: false });
      // short, neatly trimmed beard
      const beard = [...arc(0, 0, RX * 1.03, RY * 1.03, 168, 18, 16), [32, 12], [27, 13], [22, 21], [14, 26], [6, 23], [-2, 16], [-10, 12], [-14, 6]];
      wa(beard, C.yHair, .55, { jit: .9, edge: 0, ko: false });
      st(qcurve(14, 13, 31, 12, -2, 6), 6.5, C.yHair, { prof: 'leaf', nb: 0, a: .82, ko: false });               // moustache
      st(qcurve(18, 28, 25, 27, 1, 3), 5, C.yHair, { prof: 'leaf', nb: 0, a: .5, ko: false });
    } else {
      const cap = [...arc(0, 0, RX * 1.08, RY * 1.07, 140, 322, 18), [26, -22], [16, -22], [6, -18], [-6, -10], [-10, 4], [-14, 14], [-24, 22]];
      wa(cap, C.mHair, .86, { jit: 1, edge: .35 });
      st(qctrl(-4, -38, 18, -34, 30, -12, 10), 12, C.mHair, { prof: 'tip', nb: 4, a: .85 });                      // side-swept fringe
      st(qctrl(-12, -34, 10, -27, 24, -15, 10), 8, C.mHair2, { prof: 'tip', nb: 3, a: .55 });
      for (const [a0, a1] of [[200, 300], [170, 260]]) st(arc(0, 0, RX * .97, RY * .97, a0, a1, 10), 7, C.mHair2, { prof: 'brush', nb: 4, a: .45, rib: .3, ko: false });
      st(qcurve(-26, -27, -30, -15, 0, 3), 11, '#2a8a84', { prof: 'leaf', nb: 0, a: .85 });                       // hair tie
      st(qcurve(-9, 14, -9, 18, 0, 2), 5, '#2a8a84', { prof: 'leaf', nb: 0, a: .9, ko: false });                  // earring
    }
  });
  // features (ink), driven by the face state F
  part(seed + 3, () => {
    const ink = y ? '#1d1714' : '#2b2018', bl = clamp(F.blink || 0), lx = F.lx || 0, ly = F.ly || 0;
    for (const [ex, ey, s] of [[9, -3, 1], [26, -4, .82]]) {
      const h = 5.4 * (1 - .9 * bl);
      st(qcurve(ex + lx, ey + ly - h, ex + lx + .3, ey + ly + h, 0, 3), 7.8 * s, ink, { prof: 'leaf', nb: 0, a: .95, ko: false });
      if (!y && bl < .5) st(qcurve(ex + 4 * s, ey - 5, ex + 8.5 * s, ey - 8, 0, 2), 2.2, ink, { prof: 'tip', nb: 0, a: .8, ko: false });
    }
    const r = F.brow || 0, wv = F.worry || 0, bc = y ? C.yHair : '#7c3a1f';
    st(qcurve(1, -15 - r * 5 + wv * 2, 14, -17 - r * 5 - wv * 6 + (F.browL || 0), -2, 4), y ? 5.6 : 4, bc, { prof: 'even', nb: 0, a: .92, ko: false });
    st(qcurve(20, -17 - r * 5 - wv * 6 + (F.browR || 0), 31, -14 - r * 5 + wv * 2 + (F.browR || 0) * .4, -2, 4), y ? 5 : 3.6, bc, { prof: 'even', nb: 0, a: .92, ko: false });
    const mc = y ? C.mouth : '#7a2f28', sm = F.smile || 0, op = F.open || 0, my = 20;
    if (F.grim > .5 && op < .1) st([[13, my + 1], [16.5, my - 1.5], [20, my + 1.5], [23.5, my - 1.5], [27, my + 1], [30, my - 1]], 3, mc, { prof: 'even', nb: 0, a: .9, rough: .1, ko: false });
    else if (op > .06) {
      st(qcurve(13, my, 30, my, sm * 5, 6), 2.5 + op * 12, mc, { prof: 'leaf', nb: 0, a: .92, ko: false });
      if (op > .4) st(qcurve(17, my + op * 3.5, 26, my + op * 3.5, 0, 4), op * 5, '#b9574d', { prof: 'leaf', nb: 0, a: .6, ko: false });
    } else st(qcurve(13, my, 30, my - 1, sm * 6, 6), y ? 3.4 : 3, y ? mc : C.lip, { prof: 'even', nb: 0, a: .88, ko: false });
    if ((F.blush || 0) > 0) for (const [a, b, w] of [[[0, 11], [13, 11], 12], [[22, 10], [31, 10], 9]]) st(qcurve(a[0], a[1], b[0], b[1], 0, 4), w, C.blush, { prof: 'leaf', nb: 0, a: .55 * F.blush, ko: false });
    if (!y) for (const [a, b] of [[[1, 12], [11, 12]], [[22, 11], [29, 11]]]) st(qcurve(a[0], a[1], b[0], b[1], 0, 4), 8, C.blush, { prof: 'leaf', nb: 0, a: .22, ko: false });
    if ((F.sweat || 0) > 0) { const sy = -32 + (F.sweatSlide || 0) * 16, sx = -14; st(qcurve(sx, sy + 9, sx - .5, sy - 7, 0, 5), 9, C.sweat, { prof: 'tip', nb: 0, a: .9 * F.sweat, ko: false }); st(qcurve(sx - 2, sy + 7, sx - 2, sy + 2, 0, 2), 2.2, '#3d6f8f', { prof: 'even', nb: 0, a: .6 * F.sweat, ko: false }); }
  });
  return L;
}

// a whole figure → list of groups (each group is knocked out to paper, then painted)
function figure(D, P, seed) {
  const y = D.kind === 'y';
  const G = [[], [], [], [], []];   // 0 prop, 1 far limbs, 2 near leg / skirt, 3 torso + near arm, 4 head
  const st = (g, pts, w, col, o) => G[g].push(mk(pts, w, col, o));
  const wa = (g, pts, col, a, o = {}) => G[g].push(wash(pts, col, a, { raw: true, jit: o.jit ?? 1.3, edge: o.edge ?? .5, ko: o.ko, ew: o.ew ?? 2 }));
  const LT = 86, LS = 86, legEnd = (a, k) => Math.cos(a) * LT + Math.cos(a - k) * LS;
  const drop = 172 - Math.max(legEnd(P.legN[0], P.legN[1]), legEnd(P.legF[0], P.legF[1]));
  const hipY = -172 + drop + (P.bob || 0);
  const UB = rotAt(P.lean || 0, 0, hipY), U = p => apP(UB, [p[0], p[1] + (hipY + 172)]), UP = pts => pts.map(U);
  const shUp = P.shUp || 0;
  for (const [nm, [a, k], hx, g] of [['F', P.legF, -8, 1], ['N', P.legN, 6, 2]]) part(seed + 10 + g, () => {
    const H = [hx, hipY], K = addv(H, a, LT), A = addv(K, a - k, LS), far = nm === 'F';
    if (y) { const s = mk(chain(H, K, A), 31, far ? C.jean2 : C.jean, { prof: 'lin', end: .72, nb: 2, a: .92, rib: .93, rough: .1 }); G[g].push(s, edgeOf(s, -1, 3.5, C.jean2, .5)); if (!far) G[g].push(edgeOf(s, 1, 2, '#6f8ab0', .35)); }
    else st(1, chain(H, K, A), 15, far ? C.mSkin2 : C.mSkin, { prof: 'lin', end: .7, nb: 0, a: .88, rib: .95 });
    const fa = clamp((a - k) * .6, -.5, .6), heel = [A[0] - 8, A[1] + 2], toe = [A[0] + Math.cos(fa) * 27, A[1] + 4 + Math.sin(fa) * 27];
    st(y ? g : 1, qcurve(heel[0], heel[1], toe[0], toe[1], -4, 6), y ? 16 : 11, y ? (far ? '#563519' : C.shoe) : C.mShoe, { prof: 'even', nb: 0, a: .95, rib: .95 });
  });
  part(seed + 20, () => {
    if (y) {
      const s0 = -258 + shUp;
      wa(3, UP([[-31, s0 + 6], [-22, s0 - 2], [-6, s0 - 5], [6, s0 - 4], [8, -214], [9, -166], [-28, -164], [-32, -200]]), C.navy, .9);
      wa(3, UP([[18, s0 - 4], [26, s0], [32, s0 + 8], [33, -200], [31, -166], [20, -166]]), C.navy, .9);
      wa(3, UP([[6, s0 - 4], [18, s0 - 4], [20, -166], [9, -166]]), '#000', 0, { edge: 0 });                          // white tee = paper
      st(3, qcurve(...U([5, s0 - 3]), ...U([18, s0 - 3]), 5, 5), 3, C.grey, { prof: 'even', nb: 0, a: .7, ko: false });
      st(3, [U([9, -246]), U([10, -210]), U([10, -172])], 2.5, C.grey, { prof: 'even', nb: 0, a: .4, ko: false });
      st(3, [U([-27, s0 + 6]), U([-24, -210]), U([-22, -168])], 16, C.navy2, { prof: 'even', nb: 4, a: .35, rib: .25, ko: false });
      st(3, [U([4, s0 - 2]), U([-2, -232])], 4, C.navy2, { prof: 'tip', nb: 0, a: .7, ko: false });                   // lapels
      st(3, [U([20, s0 - 2]), U([27, -236])], 4, C.navy2, { prof: 'tip', nb: 0, a: .7, ko: false });
      st(3, qcurve(...U([-29, -170]), ...U([31, -170]), 2, 6), 5, C.navy2, { prof: 'even', nb: 0, a: .55, ko: false });
      st(3, [U([-14, -196]), U([2, -196])], 2.5, C.navy2, { prof: 'even', nb: 0, a: .5, ko: false });                 // pocket
    } else {
      const sw = P.skirt || 0, s0 = -252 + shUp;
      wa(2, UP([[-21, -180], [20, -182], [27, -140], [37 + sw * 2, -94], [8 + sw * 2, -90], [-34 + sw * 2, -93], [-27, -140]]), C.teal, .9);
      for (const x of [-12, 4, 18]) st(2, [U([x * .6, -176]), U([x * 1.1 + sw * 2, -96])], 2.5, C.teal2, { prof: 'tip', nb: 0, a: .45, ko: false });
      wa(3, UP([[-28, s0 + 6], [-20, s0 - 2], [-4, s0 - 5], [3, s0 - 4], [4, -180], [2, -148], [-26, -146], [-30, -200]]), C.must, .92);
      wa(3, UP([[15, s0 - 4], [22, s0], [27, s0 + 8], [27, -200], [25, -148], [15, -150]]), C.must, .92);
      wa(3, UP([[3, s0 - 4], [15, s0 - 4], [15, -178], [4, -178]]), '#000', 0, { edge: 0 });                              // blouse = paper
      st(3, qcurve(...U([1, s0 - 3]), ...U([15, s0 - 3]), 6, 5), 2.6, C.grey, { prof: 'even', nb: 0, a: .7, ko: false });
      st(3, [U([-24, s0 + 6]), U([-21, -200]), U([-20, -152])], 14, C.must2, { prof: 'even', nb: 4, a: .3, rib: .25, ko: false });
      st(3, qcurve(...U([-27, -152]), ...U([25, -152]), 2, 6), 7, C.must2, { prof: 'even', nb: 2, a: .55, ko: false });
      for (const by of [-232, -208]) st(3, qcurve(...U([17, by]), ...U([18, by + 1]), 0, 2), 4.5, C.must2, { prof: 'leaf', nb: 0, a: .9, ko: false });
    }
  });
  const arm = (nm, g, S0, spec, dark) => part(seed + 30 + g, () => {
    const S = U(S0); let E, W;
    if (spec.target) [E, W] = ik(S, spec.target, 64, 62, spec.bend ?? 1);
    else { E = addv(S, spec.a + (P.lean || 0), 64); W = addv(E, spec.a + spec.e + (P.lean || 0), 62); }
    const sl = y ? (dark ? C.navy2 : C.navy) : (dark ? C.must2 : C.must), sk = y ? (dark ? C.ySkin2 : C.ySkin) : (dark ? C.mSkin2 : C.mSkin);
    const s = mk(chain(S, E, W), y ? 23 : 18, sl, { prof: 'lin', end: .74, nb: 2, a: .93, rib: .93, rough: .1 });
    G[g].push(s); if (!dark) G[g].push(edgeOf(s, -1, 3, y ? C.navy2 : C.must2, .5));
    const dx = W[0] - E[0], dy = W[1] - E[1], dl = Math.hypot(dx, dy) || 1, ux = dx / dl, uy = dy / dl;
    if (spec.open) {
      const base = Math.atan2(uy, ux) + (spec.spread || 0), pc = [W[0] + ux * 9, W[1] + uy * 9];
      G[g].push(wash(arc(pc[0], pc[1], 9, 9, 0, 360, 12), sk, .92, { raw: true, jit: .5, edge: .4 }));
      for (let f = 0; f < 4; f++) { const an = base + (f - 1.5) * .28, hx = pc[0] + Math.cos(an) * 5, hy = pc[1] + Math.sin(an) * 5; st(g, qcurve(hx, hy, hx + Math.cos(an) * 14, hy + Math.sin(an) * 14, 0, 3), 5, sk, { prof: 'tip', nb: 0, a: .92 }); }
      st(g, qcurve(pc[0], pc[1], pc[0] - uy * 13 + ux * 3, pc[1] + ux * 13 + uy * 3, 0, 3), 5, sk, { prof: 'tip', nb: 0, a: .92 });
    } else {
      G[g].push(wash(arc(W[0] + ux * 9, W[1] + uy * 9, 9, 10, 0, 360, 12), sk, .92, { raw: true, jit: .5, edge: .4 }));
      st(g, qcurve(W[0] + ux * 4, W[1] + uy * 4, W[0] + ux * 10 + uy * 9, W[1] + uy * 10 - ux * 9, 0, 3), 5, sk, { prof: 'tip', nb: 0, a: .9 });
    }
    return W;
  });
  const handF = arm('F', 1, [-16, -250 + shUp], P.armF, true);
  arm('N', 3, [14, -250 + shUp], P.armN, false);
  if (y && P.case) part(seed + 40, () => {
    const { x, th } = P.case, M = mulM(trM(x, 0), rotAt(th, 0, 0)), Q = p => apP(M, p);
    const body = []; for (const [cx, cy, a0] of [[80, -122, -90], [80, -16, 0], [8, -16, 90], [8, -122, 180]]) for (let i = 0; i <= 4; i++) { const a = (a0 + i * 22.5) * Math.PI / 180; body.push(Q([cx + Math.cos(a) * 8, cy + Math.sin(a) * 8])); }
    G[0].push(wash(body, C.suit, .92, { raw: true, jit: 1.2, edge: .6 }));
    st(0, [Q([14, -122]), Q([12, -70]), Q([14, -18])], 14, C.suit2, { prof: 'even', nb: 4, a: .3, rib: .2, ko: false });
    for (const cx of [32, 58]) st(0, [Q([cx, -124]), Q([cx, -14])], 3.5, C.suit2, { prof: 'even', nb: 0, a: .6, ko: false });
    st(0, [Q([85, -120]), Q([86, -70]), Q([85, -16])], 5, C.suit2, { prof: 'even', nb: 0, a: .55, ko: false });
    for (const wx of [12, 76]) G[0].push(wash(arc(...Q([wx, -4]), 6, 6, 0, 360, 10), '#2b2520', .9, { raw: true, jit: .4 }));
    st(0, qcurve(...Q([38, -132]), handF[0] - 3, handF[1] + 6, 0, 6), 3.2, '#6c6862', { prof: 'even', nb: 0, a: .9 });
    st(0, qcurve(...Q([50, -132]), handF[0] + 4, handF[1] + 6, 0, 6), 3.2, '#6c6862', { prof: 'even', nb: 0, a: .9 });
    st(0, qcurve(handF[0] - 7, handF[1] + 2, handF[0] + 8, handF[1] + 2, 0, 3), 7, '#3b3835', { prof: 'even', nb: 0, a: .9 });
  });
  const neck = U([4, -276 + shUp]);
  const HM = mulM(rotAt(P.tilt || 0, neck[0], neck[1]), mulM(trM(...U([7, -312 + shUp * .8])), rotAt((P.lean || 0), 0, 0)));
  G[4].push(...headStrokes(D, P.face || {}, HM, seed + 100));
  G.mouth = apP(HM, [22, 20]);
  return G;
}

// paint a figure: groups knocked out to paper then painted; p<1 paints it in stroke by stroke (structure first)
function drawFigure(c, G, p = 1) {
  const all = G.flat(), N = all.length; if (!N) return;
  if (p >= 1) { for (const g of G) { koList(c, g, 1); for (const s of g) drawItem(c, s); } return; }
  const dur = Math.min(.5, Math.max(.12, 4 / N)); let j0 = 0;
  for (const g of G) {
    PAPER_PAT.setTransform(c.getTransform().invertSelf()); c.fillStyle = PAPER_PAT;
    for (let j = 0; j < g.length; j++) { const q = (p - (j0 + j) / N * (1 - dur)) / dur; if (q <= 0 || !g[j].ko) continue; koItem(c, g[j], Math.min(1, q)); }
    for (let j = 0; j < g.length; j++) drawItem(c, g[j], (p - (j0 + j) / N * (1 - dur)) / dur);
    j0 += g.length;
  }
}
