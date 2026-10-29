// "First Day" — style test, Urban Sketch · Pen & Wash. Timeline, camera, performances, colour arrival, type.
import { clamp, lerp, ss, TAU, rng, n2, hex, mix3, INK, PAPER, rgba, rough, arrivalField, sampleField, figure, drawPrims, penStroke, drawPen, drawPenFast, dab, handwrite, ellipse, spline, R3 } from './engine.js';
import { buildLayers, buildPaper, W, H, GROUND, WALK_Y, KERB, ORIGIN, SCHOOL, DOOR, DETAIL, insideSchool } from './world.js';
const { V } = R3;

const TL = await (await fetch('timeline.json')).json();
const DUR = TL.dur;
await Promise.all(['700 80px Caveat', '80px "Reenie Beanie"', '700 60px "Aref Ruqaa"'].map(f => document.fonts.load(f, f.includes('Ruqaa') ? 'أول يوم' : 'Day')));

const eio = t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const eo = t => 1 - Math.pow(1 - clamp(t), 3), ei = t => Math.pow(clamp(t), 3);
const seg = (t, a, b) => clamp((t - a) / (b - a));
const boilOf = t => Math.floor(t * 12);
const hsh = n => { n = Math.sin(n * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };
const mixPose = (a, b, t) => { const o = {}; for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) { const x = a[k], y = b[k]; if (x === undefined) o[k] = y; else if (y === undefined) o[k] = x; else if (Array.isArray(x)) o[k] = x.map((v, i) => lerp(v, y[i], t)); else o[k] = lerp(x, y, t); } return o; };
const lerpV = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));

// ---------------- the page ----------------
const page = buildLayers({ scale: 1, strokes: true });
const det = buildLayers({ scale: DETAIL.scale, x0: DETAIL.x0, y0: DETAIL.y0, w: DETAIL.w, h: DETAIL.h, lwK: .72 });
const paper = buildPaper();
const INK_DONE = Math.max(...page.strokes.map(s => s.t0 + s.du)) + .02;

// ---------------- looks ----------------
const LOOK = {
  youssef: { skin: hex('#a26a48'), top: hex('#2c3b62'), inner: hex('#f6f3ec'), bottom: hex('#5d7fae'), pants: 1, hair: hex('#1c1817'), shoe: hex('#7a4a2a'), sleeve: 'long', torso: [.078, .086, .108], hairVol: .97 },
  mia: { skin: hex('#f2cdb2'), top: hex('#d9a32c'), inner: hex('#f7f3ea'), innerW: [.012, .016, .024, .032], skirt: hex('#2e8f8a'), legs: hex('#eec7ab'), hair: hex('#b5532b'), shoe: hex('#5b3a2a'), sleeve: 'long', torso: [.074, .064, .09], flare: .13 },
  pA: { skin: hex('#e8c0a0'), top: hex('#7a9a7a'), bottom: hex('#4a4a55'), pants: 1, hair: hex('#5a4030'), sleeve: 'long', hairLong: 1 },
  pB: { skin: hex('#c48a6a'), top: hex('#b05a48'), bottom: hex('#3b3f4a'), pants: 1, hair: hex('#2a2220'), sleeve: 'long' },
};
const RED = hex('#c43a32'), BUSRED = hex('#c9473d');

// ---------------- Youssef ----------------
const Y0X = 1950, YSTOP = 3440, YS = 330;
const T_WALK0 = 2.75, T_WALK1 = 7.7;
const vProf = t => ss(seg(t, T_WALK0, T_WALK0 + .5)) * (1 - ss(seg(t, 7.05, T_WALK1)));
const DIST = []; { let d = 0; for (let i = 0; i <= 2400; i++) { const t = i / 240; DIST.push(d); d += vProf(t) / 240; } }
const VMAX = (YSTOP - Y0X) / DIST[DIST.length - 1];
const distAt = t => DIST[clamp(Math.round(t * 240), 0, DIST.length - 1)] * VMAX;
const STEP = .4 * YS;
const talkOpen = (who, t) => { let v = 0; for (const [a, b, w] of TL.talk) if (w === who && t > a - .03 && t < b + .03) { const k = boilOf(t); v = Math.max(v, (.35 + .65 * hsh(k * 3.1 + a)) * ss(seg(t, a - .03, a + .05)) * (1 - ss(seg(t, b - .05, b + .03)))); } return v; };

function youssef(t) {
  const x = Y0X + distAt(t), vk = vProf(t);
  const ph = distAt(t) / (STEP * 2) * TAU;
  // body heading: looks around (toward the tower) → turns to walk right → faces Mia
  let yaw = Math.PI + .35;
  yaw = lerp(yaw, 2.02, ss(seg(t, 2.25, 2.95)));
  yaw = lerp(yaw, 2.3, ss(seg(t, 7.3, 8.0)));
  // base pose: stand ↔ walk
  const sw = Math.sin(ph);
  let p = { hipY: .52 + .012 * Math.abs(Math.cos(ph)) * vk, lean: .03 + .06 * vk, legL: .4 * sw * vk, kneeL: (.08 + .5 * Math.max(0, Math.cos(ph))) * vk, legR: -.4 * sw * vk, kneeR: (.08 + .5 * Math.max(0, -Math.cos(ph))) * vk, twist: .06 * sw * vk,
    headYaw: 0, nod: 0, headSide: 0, side: 0 };
  // anticipation before the first step: a little lean back, then go
  p.lean -= .07 * Math.sin(Math.PI * seg(t, 2.45, 2.85));
  // hands: right always on the suitcase; left free
  p.handR = lerpV(V(.19, .45, .03), V(.15, .43, -.3), ss(vk * 1.3)); p.elbR = V(.7, -.3, -.8);
  let hl = lerpV(V(-.17, .47, .04), V(-.17, .48, .16 * Math.sin(ph + Math.PI)), vk), elL = V(-.6, -.3, -1);
  // head: looks up at the clock tower, then around; up at the sign; at the door
  p.headYaw = .45 * (1 - ss(seg(t, 1.7, 2.3))) - .25 * ss(seg(t, 1.9, 2.3)) * (1 - ss(seg(t, 2.4, 2.8)));
  p.nod = -.32 * (1 - ss(seg(t, 1.6, 2.2))) - .38 * ss(seg(t, 5.85, 6.25)) * (1 - ss(seg(t, 6.75, 7.2)));
  p.nod += -.2 * ss(seg(t, 7.45, 7.8));                       // looks up at Mia on the steps
  p.hipY += .02 * Math.sin(Math.PI * seg(t, 6.15, 6.45));     // little excited hop at the sign
  // settle after stopping (follow-through)
  p.lean += .06 * Math.sin(Math.PI * seg(t, 7.6, 8.1));
  // ---- dialogue performance ----
  // "Hello!" small wave
  const hello = ss(seg(t, 9.85, 10.1)) * (1 - ss(seg(t, 10.75, 11.05)));
  hl = lerpV(hl, V(-.21 + .04 * Math.sin((t - 9.9) * 15), .98, .12), hello); if (hello > 0) elL = V(-1, -.2, 0);
  // "I..." hand to chest, head drops (hesitation); "I Youssef" two pats
  const chest = ss(seg(t, 11.2, 11.45)) * (1 - ss(seg(t, 13.5, 13.85)));
  const pat = .03 * Math.max(0, Math.sin((t - 12.5) * 15)) * (t > 12.5 && t < 13.35 ? 1 : 0);
  hl = lerpV(hl, V(-.02, .69, .13 + pat), chest); if (chest > .01) elL = V(-1, -.5, 0);
  const hes = ss(seg(t, 11.3, 11.6)) * (1 - ss(seg(t, 12.3, 12.55)));
  p.nod += .26 * hes; p.headSide = -.1 * hes;
  p.nod += -.06 * Math.sin(Math.PI * seg(t, 12.5, 13.4));
  // embarrassed: scratches the back of his head, head down and tilted, shoulders up
  const emb = ss(seg(t, 15.3, 15.75));
  hl = lerpV(hl, V(-.07 + .015 * Math.sin(t * 22), .98, -.06), emb); if (emb > .01) elL = V(-1, .5, .4);
  p.nod += .2 * emb - .12 * ss(seg(t, 14.55, 14.9)) * (1 - emb); p.headSide += .14 * emb; p.lean += .04 * emb; p.side = -.04 * emb;
  p.handL = hl; p.elbL = elL;
  return { pose: p, place: { x, y: WALK_Y, S: YS, yaw }, vk };
}
const youExpr = t => {
  const worried = Math.max(ss(seg(t, 11.3, 11.6)) * (1 - ss(seg(t, 12.4, 12.6))), ss(seg(t, 14.6, 15.0)));
  const smile = (t < 11.3 || (t > 12.55 && t < 14.6)) ? 1 : 0;
  const blink = [4.2, 9.3, 12.05, 13.9, 16.2].some(b => t > b && t < b + .1);
  return { mouth: talkOpen('youssef', t), smile: smile * (1 - worried), worried, browUp: ss(seg(t, 7.45, 7.7)) * (1 - ss(seg(t, 9.0, 9.5))) * .8 + ss(seg(t, 9.9, 10.1)) * (1 - ss(seg(t, 10.6, 11))) * .6, blink, squint: ss(seg(t, 15.35, 15.6)) * .7, blush: ss(seg(t, 15.2, 16.0)) };
};

// ---------------- Mia ----------------
const MIA = { x: 3912, y0: 2214, y1: 2238, S: 316 };
function mia(t) {
  const u = seg(t, 7.48, 7.98), y = lerp(MIA.y0, MIA.y1, eio(u)), walkK = Math.sin(Math.PI * u);
  const ph = u * TAU * .75;
  let p = { hipY: .52, lean: .02, legL: .35 * Math.sin(ph) * walkK, kneeL: .3 * walkK * Math.max(0, Math.cos(ph)), legR: -.35 * Math.sin(ph) * walkK, kneeR: .3 * walkK * Math.max(0, -Math.cos(ph)), headYaw: 0, nod: -.05, headSide: 0, side: 0, twist: 0 };
  let hR = V(.16, .48, .04), hL = V(-.16, .48, .04), eR = V(.6, -.3, -1), eL = V(-.6, -.3, -1);
  // wave "Hi!" (anticipation: raise, then two waves, then settle)
  const wv = ss(seg(t, 7.9, 8.15)) * (1 - ss(seg(t, 9.35, 9.7)));
  if (wv > 0) { hR = lerpV(hR, V(.19 + .06 * Math.sin((t - 8.1) * 13), 1.08, .07), wv); eR = V(1, 0, 0); }
  // "I'm Mia": left hand touches chest briefly
  const me = ss(seg(t, 8.65, 8.8)) * (1 - ss(seg(t, 9.2, 9.45)));
  hL = lerpV(hL, V(-.01, .68, .12), me); if (me > .01) eL = V(-1, -.5, 0);
  // listening: hands clasped
  const cl = ss(seg(t, 9.5, 9.9));
  hR = lerpV(hR, V(.025, .47, .14), cl); hL = lerpV(hL, V(-.025, .47, .14), cl * (1 - me));
  p.headSide = .12 * ss(seg(t, 11.5, 12)) * (1 - ss(seg(t, 13.2, 13.6)));      // encouraging tilt during his hesitation
  p.nod += .08 * Math.sin(Math.PI * seg(t, 12.6, 13.4));
  // "Sorry?": leans in, head tilt, left hand cupped to her ear
  const so = ss(seg(t, 14.5, 14.95));
  p.lean += .1 * so; p.headSide += -.2 * so; p.nod += .06 * so;
  hL = lerpV(hL, V(-.11, .9, .03), so); if (so > .01) eL = V(-1, -.4, .3);
  p.handR = hR; p.handL = hL; p.elbR = eR; p.elbL = eL;
  return { pose: p, place: { x: MIA.x + 6 * so, y, S: MIA.S, yaw: -2.25 } };
}
const miaExpr = t => ({ mouth: talkOpen('mia', t), smile: t < 14.45 ? 1 : 0, puzzled: ss(seg(t, 14.5, 14.9)), browUp: ss(seg(t, 7.6, 7.9)) * (1 - ss(seg(t, 9.6, 10))) * .7, blink: [9.4, 12.8, 16.0].some(b => t > b && t < b + .1), blush: 0 });

// ---------------- extras (only in the opening) ----------------
const extras = [
  { look: 'pA', x0: 1020, dx: -55, y: 2318, yaw: -1.9, seed: 7 },
  { look: 'pB', x0: 1420, dx: 0, y: 2330, yaw: 2.6, seed: 9, still: 1 },
];

// ---------------- bus ----------------
const busX = t => -1300 + (t - .15) * 2350;
const BUS = { len: 1950, top: 1935, bot: 2700, wy: 2688, wr: 64 };

// ---------------- colour arrival field ----------------
const src = [];
for (let tt = .4; tt < 3.6; tt += .05) { const fx = busX(tt) + BUS.len / 2; if (fx < 0 || fx > W + 400) continue; src.push({ x: fx - 260, y: 2080, t: tt + .08, v: 1300, R: 1050, sy: .7, mask: (px, py) => !insideSchool(px, py) }); }
src.push({ x: 1260, y: 650, t: 1.0, v: 1500, R: 3300, sy: 1.6, mask: (px, py) => py < 1250 && !insideSchool(px, py) });
src.push({ x: DOOR.cx, y: 2030, t: 7.42, v: 1500, R: 1800, sy: .9 });
const GW = 640, GH = 360, CELL = W / GW;
const arr = arrivalField(W, H, GW, GH, src, { amp: 220 });
const JIT = new Float32Array(GW * GH); for (let i = 0; i < JIT.length; i++) JIT[i] = (hsh(i * .37) - .5) * .12;
let ARR_MAX = 0, ARR_MIN = 1e9; for (const v of arr) { if (v < 900) ARR_MAX = Math.max(ARR_MAX, v); ARR_MIN = Math.min(ARR_MIN, v); }
const arrAt = (x, y) => sampleField(arr, W, H, GW, GH, x, y);
const [maskC, mctx] = (() => { const c = document.createElement('canvas'); c.width = GW; c.height = GH; return [c, c.getContext('2d')]; })();
const [frontC, fctx] = (() => { const c = document.createElement('canvas'); c.width = GW; c.height = GH; return [c, c.getContext('2d')]; })();
const mIm = mctx.createImageData(GW, GH), fIm = fctx.createImageData(GW, GH);
function buildMasks(t) {
  let anyFront = false; const m = mIm.data, f = fIm.data;
  for (let i = 0; i < GW * GH; i++) {
    const dt = t - (arr[i] + JIT[i]); const rev = dt <= 0 ? 0 : dt >= .16 ? 1 : ss(dt / .16);
    const fr = rev * Math.exp(-Math.pow((dt - .09) / .1, 2)) + .25 * rev * Math.exp(-Math.max(0, dt) / .5);
    m[i * 4 + 3] = rev * 255; m[i * 4] = m[i * 4 + 1] = m[i * 4 + 2] = 255;
    const fv = clamp(fr) * 255; f[i * 4 + 3] = fv; f[i * 4] = f[i * 4 + 1] = f[i * 4 + 2] = 255; if (fv > 10) anyFront = true;
  }
  mctx.putImageData(mIm, 0, 0); fctx.putImageData(fIm, 0, 0); return anyFront;
}

// ---------------- camera ----------------
const followT = t => { const y = youssef(t); return [y.place.x + 190, 2075]; };
const SPR = []; { const t0 = 2.0; let p = followT(t0), v = [0, 0]; const dt = 1 / 240, k = 14, d = 2 * Math.sqrt(k); for (let t = t0; t <= 9; t += dt) { const g = followT(t); for (let j = 0; j < 2; j++) { const a = k * (g[j] - p[j]) - d * v[j]; v[j] += a * dt; p[j] += v[j] * dt; } SPR.push([p[0], p[1]]); } }
const spring = t => SPR[clamp(Math.round((t - 2.0) * 240), 0, SPR.length - 1)];
const TWO = [3660, 2108, 1.72], TWO2 = [3612, 2112, 1.92], CLOSE = [3555, 2088, 3.05], CLOSE2 = [3548, 2090, 3.25];
const T_PUNCH = 15.1;
function camera(t) {
  let c;
  const A = [2560, 1470, .42], B = [2120, 1760, .6];
  const a = A.map((v, i) => lerp(v, B[i], eio(seg(t, 0, 3.0))));
  if (t < 2.6) c = a;
  else {
    const s = spring(t), w = ss(seg(t, 2.6, 3.4));
    c = [lerp(a[0], s[0], w), lerp(a[1], s[1], w), lerp(a[2], 1.06, eio(seg(t, 2.6, 3.7)))];
    const u = eio(seg(t, 7.15, 8.35)); c = c.map((v, i) => lerp(v, TWO[i], u));
    const pu = eio(seg(t, 9.7, 14.3)); if (pu > 0) c = c.map((v, i) => lerp(v, TWO2[i], pu));
    const pk = eo(seg(t, T_PUNCH, T_PUNCH + .2)); if (pk > 0) c = c.map((v, i) => lerp(v, lerp(CLOSE[i], CLOSE2[i], ss(seg(t, T_PUNCH + .2, 17))), pk));
  }
  let sx = 0, sy = 0; if (t > T_PUNCH + .12 && t < T_PUNCH + .5) { const k = (1 - seg(t, T_PUNCH + .12, T_PUNCH + .5)) * 7 / c[2]; sx = Math.sin(t * 93) * k; sy = Math.cos(t * 71) * k; }
  return { cx: c[0] + sx, cy: c[1] + sy, z: c[2], rot: 0 };
}
const camMat = cam => { const c = Math.cos(cam.rot), s = Math.sin(cam.rot), z = cam.z; return [z * c, z * s, -z * s, z * c, 960 - z * (c * cam.cx - s * cam.cy), 540 - z * (s * cam.cx + c * cam.cy)]; };
const toScreen = (cam, x, y) => [960 + (x - cam.cx) * cam.z, 540 + (y - cam.cy) * cam.z];

// ---------------- drawing setup ----------------
const cvs = document.getElementById('c'), ctx = cvs.getContext('2d');
const mk = () => { const c = document.createElement('canvas'); c.width = 1920; c.height = 1080; return [c, c.getContext('2d')]; };
const [tmpC, tctx] = mk();
const tooth = (() => { const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d'); const im = x.createImageData(512, 512); const R = rng(77);
  for (let j = 0; j < 512; j++) for (let i = 0; i < 512; i++) { const v = n2(i * .35, j * .35, 3) * .6 + n2(i * .09, j * .09, 5) * .4; const g = 255 - Math.max(0, (v - .55)) * 55 - (R() < .004 ? 25 : 0); const k = (j * 512 + i) * 4; im.data[k] = g; im.data[k + 1] = g * .995; im.data[k + 2] = g * .985; im.data[k + 3] = 255; }
  x.putImageData(im, 0, 0); return c; })();
const toothPat = ctx.createPattern(tooth, 'repeat');

// draw a baked layer (world = x0 + px/scale) under the camera, only the visible part
function drawLayer(c2, M, cam, L, canvas, alpha = 1) {
  const k = 1 / L.scale, hw = 960 / cam.z + 40, hh = 540 / cam.z + 40;
  let sx = Math.floor((cam.cx - hw - L.x0) * L.scale), sy = Math.floor((cam.cy - hh - L.y0) * L.scale), ex = Math.ceil((cam.cx + hw - L.x0) * L.scale), ey = Math.ceil((cam.cy + hh - L.y0) * L.scale);
  sx = clamp(sx, 0, canvas.width); sy = clamp(sy, 0, canvas.height); ex = clamp(ex, 0, canvas.width); ey = clamp(ey, 0, canvas.height);
  if (ex - sx < 1 || ey - sy < 1) return;
  c2.setTransform(M[0] * k, M[1] * k, M[2] * k, M[3] * k, M[0] * L.x0 + M[2] * L.y0 + M[4], M[1] * L.x0 + M[3] * L.y0 + M[5]);
  c2.globalAlpha = alpha; c2.drawImage(canvas, sx, sy, ex - sx, ey - sy, sx, sy, ex - sx, ey - sy); c2.globalAlpha = 1;
}
const MASKL = { scale: 1 / CELL, x0: 0, y0: 0 };
const detailMix = cam => { const k = ss(seg(cam.z, 1.2, 1.45)); if (k <= 0) return 0; const hw = 960 / cam.z, hh = 540 / cam.z; const inside = cam.cx - hw > DETAIL.x0 && cam.cx + hw < DETAIL.x0 + DETAIL.w && cam.cy - hh > DETAIL.y0 && cam.cy + hh < DETAIL.y0 + DETAIL.h; return inside ? k : 0; };

function drawColour(target, M, cam, dm) {
  if (dm < 1) drawLayer(target, M, cam, page, page.col);
  if (dm > 0) drawLayer(target, M, cam, det, det.col, dm);
}
function drawInk(M, cam, dm, t) {
  ctx.globalCompositeOperation = 'source-over';
  if (t < INK_DONE) {           // the sketch draws itself, stroke by stroke
    ctx.setTransform(...M);
    for (const s of page.strokes) { if (t < s.t0) continue; drawPenFast(ctx, s.st, eo((t - s.t0) / s.du), INK, .95); }
    // sign lettering written on
    const p = seg(t, .55, 1.15); if (p > 0) { ctx.save(); ctx.font = '700 70px Caveat'; ctx.textAlign = 'left'; const tw = ctx.measureText('ENGLISH SCHOOL').width, x0 = 3900 - tw / 2; ctx.beginPath(); ctx.rect(x0 - 10, 1700, (tw + 20) * p, 120); ctx.clip(); ctx.fillStyle = rgba(INK, .95); ctx.translate(3900, 1808 - 22); ctx.rotate(-.006); ctx.textAlign = 'center'; ctx.fillText('ENGLISH SCHOOL', 0, 0); ctx.restore(); }
    return;
  }
  if (dm < 1) drawLayer(ctx, M, cam, page, page.ink);
  if (dm > 0) drawLayer(ctx, M, cam, det, det.ink, dm);
}

// ---------------- helpers for figures ----------------
function inkProgress(prims, t, t0, t1) {
  const inks = prims.filter(p => p.k === 'ink'), n = inks.length, u = clamp((t - t0) / (t1 - t0));
  const map = new Map(); inks.forEach((p, i) => map.set(p, clamp(u * n - i * .75)));
  return p => map.get(p) ?? 1;
}
const bloomClip = (cx, cy, R, seed) => c2 => { c2.beginPath(); const n = 24; for (let i = 0; i <= n; i++) { const a = i / n * TAU, r = R * (.8 + .4 * n2(Math.cos(a) * 2 + seed, Math.sin(a) * 2, seed)); const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; i ? c2.lineTo(x, y) : c2.moveTo(x, y); } c2.closePath(); };
function shadow(x, y, S, a = .3) { if (a <= 0) return; ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = rgba(mix3(hex('#b8ab90'), [90, 95, 130], .5), a); ctx.beginPath(); ctx.ellipse(x + S * .1, y + S * .01, S * .2, S * .035, 0, 0, TAU); ctx.fill(); ctx.restore(); }

// face marks over the engine's blank head: eyes, brows, mouth, beard, blush (a few pen marks, as a sketcher would)
function face(head, ex, o = {}) {
  const { c, r, fwd } = head, a = Math.atan2(fwd[0], -fwd[2]), nod = o.nod ?? 0, bo = o.boil ?? 0;
  const P = (phi, v) => [c[0] + r * .9 * Math.sin(a + phi), c[1] + r * (v + nod * .45)];
  const vis = phi => Math.cos(a + phi);
  const lw = Math.max(.9, r * .07), prims = [];
  const st = (pts, w = lw, op = {}) => prims.push({ k: 'ink', st: penStroke(pts, { w, wob: w * .25, over: 0, seed: 900 + bo * 13 + prims.length, smooth: pts.length > 2, ...op }), alpha: op.alpha ?? 1 });
  if (o.beard) {
    const out = [], inn = [];
    for (let i = 0; i <= 12; i++) { const phi = -1.25 + i / 12 * 2.5; if (vis(phi) < -.05) continue; out.push(P(phi, .3 + .66 * Math.pow(Math.cos(phi * .9), 1.4))); inn.unshift(P(phi * .85, Math.abs(phi) > .5 ? .34 + .1 * (1.2 - Math.abs(phi)) : .44)); }
    if (out.length > 2) { const poly = [...out, ...inn]; prims.push({ k: 'wash', poly, col: mix3(o.beard, [120, 90, 70], .15), a: .62, seed: 40 + bo, j: r * .05, layers: 2, edge: .3 });
      for (let k = 0; k < 9; k++) { const phi = -1 + k * .25; if (vis(phi) < .2) continue; const p = P(phi, .55 + .3 * Math.cos(phi) + .05 * hsh(k + bo)); st([p, [p[0] + r * .03, p[1] + r * .09]], lw * .6, { alpha: .6 }); } }
  }
  if (o.blush > 0) for (const s of [-1, 1]) { const phi = s * .62; if (vis(phi) < .1) continue; const p = P(phi, .33); prims.push({ k: 'wash', poly: rough(ellipse(p[0], p[1], r * .22 * Math.max(.3, vis(phi)), r * .13, 14), r * .03, 30 + s), col: hex('#df5868'), a: .55 * o.blush, seed: 31 + s, j: r * .03, edge: .2 });
    if (o.blush > .6) for (let k = 0; k < 3; k++) { const q = [p[0] - r * .12 + k * r * .09, p[1] - r * .02]; st([q, [q[0] - r * .05, q[1] + r * .1]], lw * .6, { alpha: .8 }); } }
  // eyes
  for (const s of [-1, 1]) {
    const phi = s * .4, vv = vis(phi); if (vv < .12) continue;
    const p = P(phi, .06), sq = Math.max(.35, vv);
    if (ex.blink) st([[p[0] - r * .08 * sq, p[1]], [p[0] + r * .08 * sq, p[1] + r * .01]], lw * .9);
    else if (ex.squint > .4) st([[p[0] - r * .08 * sq, p[1] - r * .02], [p[0], p[1] + r * .03], [p[0] + r * .08 * sq, p[1] - r * .02]], lw * .9);
    else prims.push({ k: 'fn', fn: c2 => { c2.fillStyle = rgba(INK, .92); c2.beginPath(); c2.ellipse(p[0], p[1], r * .065 * sq, r * .1, 0, 0, TAU); c2.fill(); } });
    // brows: worried = inner end up; puzzled = one brow up
    const up = (ex.browUp ?? 0) * .08 + (ex.puzzled && s === 1 ? ex.puzzled * .1 : 0), inner = (ex.worried ?? 0) * .1 + (ex.puzzled && s === -1 ? -.03 * ex.puzzled : 0);
    const b0 = P(phi - s * .2, -.17 - up - inner), b1 = P(phi + s * .2, -.15 - up + inner * .3);
    st([b0, [(b0[0] + b1[0]) / 2, Math.min(b0[1], b1[1]) - r * .03], b1], lw);
  }
  // mouth
  const mv = vis(.05);
  if (mv > .15) {
    const m = P(.05, .58), w = r * .19 * Math.max(.45, mv), open = ex.mouth ?? 0;
    if (open > .05 || (ex.puzzled ?? 0) > .5) {
      const h = r * (.05 + .17 * open) + (ex.puzzled > .5 && open < .05 ? r * .07 : 0), ww = ex.puzzled > .5 ? w * .55 : w;
      const poly = ellipse(m[0], m[1] + h * .3, ww, h, 14);
      prims.push({ k: 'knock', poly, a: .9 }, { k: 'wash', poly, col: hex('#7a3a34'), a: .8, seed: 50, j: r * .01, layers: 1, edge: .3 });
      st([...poly.slice(7), poly[0]], lw * .8);
    } else if (ex.smile > .5) st([[m[0] - w, m[1] - r * .03], [m[0], m[1] + r * .06], [m[0] + w, m[1] - r * .03]], lw);
    else if ((ex.worried ?? 0) > .4) st([[m[0] - w, m[1] + r * .02], [m[0] - w * .4, m[1] - r * .02], [m[0] + w * .3, m[1] + r * .03], [m[0] + w, m[1] - r * .01]], lw * .9);
    else st([[m[0] - w * .8, m[1]], [m[0] + w * .8, m[1] + r * .01]], lw);
  }
  // nose tick (the engine only draws one in profile)
  if (Math.abs(fwd[0]) <= .5 && vis(0) > .3) { const n = P(.08, .2); st([n, [n[0] + r * .05, n[1] + r * .14], [n[0] - r * .02, n[1] + r * .17]], lw * .8); }
  return prims;
}
function ponytail(head, t, swing = 0) {
  const { c, r, fwd } = head, a = Math.atan2(fwd[0], -fwd[2]);
  const back = Math.sin(a + Math.PI), base = [c[0] + r * .8 * back, c[1] - r * .25];
  const sw = Math.sin(t * 3.2) * r * .12 + swing * r;
  const pts = [base, [base[0] + back * r * .55 + sw * .3, base[1] + r * .55], [base[0] + back * r * .5 + sw * .7, base[1] + r * 1.25], [base[0] + back * r * .25 + sw, base[1] + r * 1.85]];
  const sp = spline(pts, 5), L = [], Rr = [];
  for (let i = 0; i < sp.length; i++) { const p0 = sp[Math.max(0, i - 1)], p1 = sp[Math.min(sp.length - 1, i + 1)]; let nx = -(p1[1] - p0[1]), ny = p1[0] - p0[0]; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l; const u = i / (sp.length - 1), w = r * (.32 * Math.sin(Math.PI * Math.min(1, u * 1.4 + .25)) + .03); L.push([sp[i][0] + nx * w, sp[i][1] + ny * w]); Rr.push([sp[i][0] - nx * w, sp[i][1] - ny * w]); }
  const poly = [...L, ...Rr.reverse()], lw = Math.max(1, r * .06), bo = boilOf(t);
  return [{ k: 'knock', poly }, { k: 'wash', poly, col: LOOK.mia.hair, a: .78, seed: 70 + bo, j: 1.2 }, { k: 'wash', poly: Rr.slice(0, Rr.length >> 1).concat(sp.slice(sp.length >> 1).reverse()), col: mix3(LOOK.mia.hair, [40, 30, 40], .45), a: .3, seed: 71 + bo },
    { k: 'ink', st: penStroke(L, { w: lw, wob: lw * .4, seed: 72 + bo, over: lw }) }, { k: 'ink', st: penStroke(Rr, { w: lw, wob: lw * .4, seed: 73 + bo, over: lw }) },
    { k: 'ink', st: penStroke(sp.slice(2, -2), { w: lw * .6, wob: lw * .6, seed: 74 + bo, over: 0 }), alpha: .7 },
    { k: 'ink', st: penStroke([L[2], Rr[Rr.length - 3]], { w: lw * 1.6, wob: .3, seed: 75, over: 0 }) }];
}
// rolling suitcase from the grip position
function suitcase(grip, gy, tilt, t) {
  const bo = boilOf(t), S = YS / 1.8, Lb = .62 * S, Wb = .4 * S, Dd = .12 * S;
  const dy = gy - grip[1], tot = Math.max(dy + 4, .95 * S), dx = Math.sqrt(Math.max(0, tot * tot - dy * dy)) * tilt;
  const wheel = [grip[0] - dx, gy];
  const al = Math.hypot(grip[0] - wheel[0], grip[1] - wheel[1]), ux = (grip[0] - wheel[0]) / al, uy = (grip[1] - wheel[1]) / al, nx = -uy, ny = ux;
  const b0 = [wheel[0] - nx * Wb * .5 - ux * 4, wheel[1] - ny * Wb * .5 - uy * 4];
  const corner = (u, v) => [b0[0] + ux * u + nx * v, b0[1] + uy * u + ny * v];
  const front = [corner(0, 0), corner(Lb, 0), corner(Lb, Wb), corner(0, Wb)];
  const side = [corner(Lb, 0), [corner(Lb, 0)[0] + Dd * .6, corner(Lb, 0)[1] - Dd * .5], [corner(Lb, Wb)[0] + Dd * .6, corner(Lb, Wb)[1] - Dd * .5], corner(Lb, Wb)];
  const lw = 1.7, sd = 500 + bo * 7, prims = [];
  const hs = [corner(Lb, Wb * .3), corner(Lb, Wb * .7)];
  prims.push({ k: 'ink', st: penStroke([hs[0], [grip[0] - nx * 6, grip[1] - ny * 6]], { w: lw * .9, wob: .3, seed: sd, over: 0 }) }, { k: 'ink', st: penStroke([hs[1], [grip[0] + nx * 6, grip[1] + ny * 6]], { w: lw * .9, wob: .3, seed: sd + 1, over: 0 }) });
  prims.push({ k: 'knock', poly: side }, { k: 'wash', poly: side, col: mix3(RED, [70, 40, 50], .35), a: .7, seed: sd + 2, j: 1 });
  prims.push({ k: 'knock', poly: front }, { k: 'wash', poly: front, col: RED, a: .72, seed: sd + 3, j: 1.4, dx: 2, dy: 1 });
  prims.push({ k: 'wash', poly: [corner(0, Wb * .62), corner(Lb, Wb * .62), corner(Lb, Wb), corner(0, Wb)], col: mix3(RED, [70, 72, 115], .4), a: .3, seed: sd + 4 });
  prims.push({ k: 'ink', st: penStroke([...front, front[0], front[1]], { w: lw, wob: .5, seed: sd + 5, over: 3, smooth: false, gap: .4 }) }, { k: 'ink', st: penStroke(side.slice(0, 3).concat([side[3]]), { w: lw * .9, wob: .4, seed: sd + 6, over: 2, smooth: false }) });
  for (const v of [.33, .66]) prims.push({ k: 'ink', st: penStroke([corner(6, Wb * v), corner(Lb - 6, Wb * v)], { w: lw * .6, wob: .4, seed: sd + 8 + v * 10, over: 0 }), alpha: .7 });
  for (const v of [.15, .85]) { const wc = corner(-2, Wb * v); prims.push({ k: 'fn', fn: c2 => { c2.fillStyle = rgba(INK, .85); c2.beginPath(); c2.arc(wc[0], wc[1], 5, 0, TAU); c2.fill(); } }); }
  prims.push({ k: 'ink', st: penStroke([[grip[0] - nx * 9, grip[1] - ny * 9], [grip[0] + nx * 9, grip[1] + ny * 9]], { w: lw * 1.8, wob: .2, seed: sd + 12, over: 0 }) });
  return prims;
}
function busPrims(xc, t) {
  const x0 = xc - BUS.len / 2, x1 = xc + BUS.len / 2, bo = boilOf(t), sd = 700 + bo * 11, bob = Math.sin(t * 13) * 2.5;
  const top = BUS.top + bob, bot = BUS.bot + bob, lw = 2.6, prims = [];
  const body = [[x0 + 30, bot], [x0, bot - 40], [x0, top + 50], [x0 + 40, top], [x1 - 70, top], [x1 - 14, top + 40], [x1, top + 140], [x1, bot - 30], [x1 - 20, bot]];
  prims.push({ k: 'knock', poly: body, a: .97 }, { k: 'wash', poly: body, col: BUSRED, a: .72, seed: sd, j: 3, layers: 3, dx: 3, dy: 2 });
  prims.push({ k: 'wash', poly: [[x0, bot - 150], [x1, bot - 150], [x1, bot], [x0, bot]], col: mix3(BUSRED, [70, 72, 115], .45), a: .32, seed: sd + 1 });
  prims.push({ k: 'wash', poly: [[x0, top + 205], [x1, top + 205], [x1, top + 232], [x0, top + 232]], col: hex('#f1ead6'), a: .0 });
  prims.push({ k: 'ink', st: penStroke([...body, body[0], body[1]], { w: lw, wob: 1, seed: sd + 2, over: 6, smooth: false, gap: .5 }) });
  const win = (wx0, wy0, wx1, wy1, k) => { const p = [[wx0, wy0], [wx1, wy0], [wx1, wy1], [wx0, wy1]]; prims.push({ k: 'knock', poly: p, a: .92 }, { k: 'wash', poly: p, col: hex('#98b1c8'), a: .42, seed: sd + 20 + k, j: 1.5 }, { k: 'ink', st: penStroke([...p, p[0]], { w: lw * .75, wob: .6, seed: sd + 40 + k, over: 3, smooth: false, gap: .5 }) }); return p; };
  const nUp = 6, uw = (x1 - x0 - 200) / nUp;
  for (let i = 0; i < nUp; i++) win(x0 + 60 + i * uw, top + 55, x0 + 60 + (i + 1) * uw - 22, top + 180, i);
  for (let i = 0; i < 5; i++) win(x0 + 60 + i * uw, top + 300, x0 + 60 + (i + 1) * uw - 22, top + 455, 10 + i);
  win(x1 - 120, top + 290, x1 - 12, top + 500, 20);                    // windscreen
  const dst = [[x1 - 190, top + 14], [x1 - 60, top + 14], [x1 - 60, top + 44], [x1 - 190, top + 44]];
  prims.push({ k: 'knock', poly: dst, a: .95 }, { k: 'wash', poly: dst, col: hex('#2a2a2a'), a: .7, seed: sd + 60 }, { k: 'fn', fn: c2 => { c2.save(); c2.font = '700 26px Caveat'; c2.fillStyle = '#f2d36a'; c2.fillText('ENGLISH ST.', x1 - 184, top + 39); c2.restore(); } });
  // passengers: a few heads in the windows
  for (let i = 0; i < 7; i++) { const k = (i * 7919) % 11, wx = x0 + 100 + ((k * 173) % (x1 - x0 - 300)), wy = (i % 2 ? top + 160 : top + 430); prims.push({ k: 'wash', poly: ellipse(wx, wy - 22, 18, 22, 10), col: [hex('#3a2a22'), hex('#c49a6c'), hex('#6a4a34')][i % 3], a: .55, seed: sd + 80 + i, j: 1 }, { k: 'wash', poly: [[wx - 30, wy + 25], [wx - 24, wy - 2], [wx + 24, wy - 2], [wx + 30, wy + 25]], col: [hex('#4f6f9a'), hex('#b06a4a'), hex('#5a8a6a')][i % 3], a: .45, seed: sd + 90 + i, j: 1 }); }
  // door
  const dx0 = x1 - 330, dx1 = x1 - 200; prims.push({ k: 'wash', poly: [[dx0, top + 290], [dx1, top + 290], [dx1, bot - 30], [dx0, bot - 30]], col: hex('#98b1c8'), a: .35, seed: sd + 70 }, { k: 'ink', st: penStroke([[dx0, bot - 30], [dx0, top + 285], [dx1, top + 285], [dx1, bot - 30]], { w: lw * .8, wob: .6, seed: sd + 71, over: 4, smooth: false }) }, { k: 'ink', st: penStroke([[(dx0 + dx1) / 2, top + 290], [(dx0 + dx1) / 2, bot - 34]], { w: lw * .6, wob: .5, seed: sd + 72, over: 0 }) });
  prims.push({ k: 'ink', st: penStroke([[x0 + 10, top + 240], [x1 - 10, top + 242]], { w: lw * .8, wob: .8, seed: sd + 73, over: 6, gap: .6 }) }, { k: 'ink', st: penStroke([[x0 + 10, bot - 150], [x1 - 10, bot - 148]], { w: lw * .7, wob: .8, seed: sd + 74, over: 6, gap: .6 }) });
  // wheels (rotating hub marks)
  for (const wx of [x0 + 330, x1 - 420]) {
    const c = [wx, BUS.wy + bob], rr = BUS.wr, arch = ellipse(c[0], c[1], rr + 16, rr + 16, 20).filter(p => p[1] <= c[1]);
    prims.push({ k: 'knock', poly: arch.concat([[c[0] - rr - 16, c[1]]]), a: .9 });
    prims.push({ k: 'wash', poly: ellipse(c[0], c[1], rr, rr, 20), col: hex('#2f2f33'), a: .8, seed: sd + wx % 97 });
    prims.push({ k: 'ink', st: penStroke(ellipse(c[0], c[1], rr, rr, 20).concat([[c[0] + rr, c[1]]]), { w: lw, wob: .6, seed: sd + 3 + wx % 13, over: 2 }) });
    prims.push({ k: 'wash', poly: ellipse(c[0], c[1], rr * .45, rr * .45, 12), col: hex('#c9c6bd'), a: .7, seed: sd + 5 });
    const ang = (xc / rr) % TAU; for (let s = 0; s < 3; s++) { const aa = ang + s * TAU / 3; prims.push({ k: 'ink', st: penStroke([[c[0] + Math.cos(aa) * rr * .15, c[1] + Math.sin(aa) * rr * .15], [c[0] + Math.cos(aa) * rr * .42, c[1] + Math.sin(aa) * rr * .42]], { w: lw * .7, wob: .2, seed: sd + 9 + s, over: 0 }) }); }
  }
  return prims;
}
// speed lines behind the bus: drawn on, then erased from the tail
function busWind(t) {
  const x0 = busX(t) - BUS.len / 2;
  for (let k = 0; k < 7; k++) {
    const tk = .2 + k * .32; const age = t - tk; if (age < 0 || age > 1.1) continue;
    const xs = busX(tk) - BUS.len / 2 - 40, y = 2120 + k * 77 % 480, L = 520 + 120 * n2(k, 1);
    const pts = []; for (let i = 0; i <= 14; i++) { const u = i / 14; pts.push([xs - u * L, y + Math.sin(u * 5 + k) * 10]); }
    for (let i = 1; i <= 12; i++) { const a = i / 12 * TAU * .9, r = 26 * (1 - i / 12 * .5); pts.push([xs - L - Math.sin(a) * r, y - r + Math.cos(a) * r]); }
    drawPen(ctx, penStroke(pts, { w: 2.4, wob: .7, seed: 300 + k, over: 1 }), eo(age / .35), INK, .75, ei(clamp((age - .4) / .6)));
  }
}

// ---------------- speech bubbles ----------------
const L = TL.lines;
const BUB = [
  { id: 'mia1', text: L[0].text, cx: 4105, cy: 1832, w: 330, h: 104, tail: [3962, 1918], t0: L[0].t0 - .05, t1: 10.7, col: hex('#e7c36a'), write: [[8.12, 9.25, 1]] },
  { id: 'you1', text: L[1].text, cx: 3385, cy: 1915, w: 480, h: 104, tail: [3452, 2028], t0: L[1].t0 - .05, t1: 15.25, col: hex('#9fb0d3'),
    write: [[10.08, 10.5, 6 / 21], [11.38, 11.72, 10 / 21], [12.48, 13.3, 1]] },
  { id: 'mia2', text: L[2].text, cx: 3735, cy: 1990, w: 210, h: 92, tail: [3860, 1972], t0: L[2].t0, t1: 99, col: hex('#e7c36a'), write: [[14.95, 15.3, 1]] },
];
const BFONT = 44;
function bubbleShape(b) {
  const e = rough(ellipse(b.cx, b.cy, b.w / 2, b.h / 2, 30), 3, b.id.length * 7, 8, .03);
  return e;
}
const BSHAPE = BUB.map(b => {
  const e = bubbleShape(b); let best = 0, bd = 1e9; e.forEach((p, i) => { const d = Math.hypot(p[0] - b.tail[0], p[1] - b.tail[1]); if (d < bd) { bd = d; best = i; } });
  const n = e.length, a = e[(best - 2 + n) % n], c = e[(best + 2) % n];
  const outline = [...e.slice(best + 2), ...e.slice(0, (best - 2 + n) % n + 1)];
  const poly = [...outline, a, b.tail, c];
  return { e, outline: [c, ...outline, a, b.tail, c], poly: [...e.slice(best + 2), ...e.slice(0, (best - 2 + n) % n + 1), a, b.tail, c] };
});
function writtenFrac(b, t) { let f = 0; for (const [a, e, to] of b.write) { if (t >= e) f = to; else if (t > a) { f = lerp(f, to, (t - a) / (e - a)); break; } else break; } return f; }
function drawBubbles(t) {
  BUB.forEach((b, i) => {
    if (t < b.t0 || t > b.t1 + .3) return;
    const fade = 1 - ss(seg(t, b.t1, b.t1 + .3)), sh = BSHAPE[i];
    ctx.save(); ctx.globalAlpha = fade;
    const app = eo(seg(t, b.t0, b.t0 + .28));
    drawPrims(ctx, [{ k: 'knock', poly: sh.poly, a: .93 * app }, { k: 'wash', poly: sh.poly, col: b.col, a: .26 * app, seed: 3 + i, j: 3, layers: 2, edge: .35, dx: 3, dy: 2 }], {});
    drawPen(ctx, penStroke(sh.outline, { w: 2.6, wob: .8, seed: 40 + i + boilOf(t) * 0, over: 6, smooth: true }), app, INK, .95);
    const f = writtenFrac(b, t);
    if (f > 0) { ctx.font = `700 ${BFONT}px Caveat`; const tw = ctx.measureText(b.text).width; handwrite(ctx, b.text, b.cx - tw / 2, b.cy + BFONT * .33, BFONT, f * (tw + BFONT * 1.0) / (tw + BFONT) , { font: 'Caveat', weight: 700, col: INK, alpha: .97 }); }
    ctx.restore();
  });
}

// ---------------- Arabic diary caption (written into the lower margin, right to left) ----------------
const AR = TL.narration.ar;
const CUES = [{ t0: .7, t1: 2.75, text: 'أول يوم ليّا في لندن…' }, { t0: 2.75, t1: 5.95, text: 'وكنت فاكر إن الإنجليزي بتاعي كويس.' }, { t0: 5.95, t1: 8.25, text: 'لحد ما قابلت ميا.' }];
window.CUES = CUES;
const STRIP = (() => { const pts = []; for (let i = 0; i <= 48; i++) { const x = i / 48 * 1960 - 20; pts.push([x, 948 + (n2(x * .012, 1, 4) - .5) * 26 + (n2(x * .07, 2, 5) - .5) * 8]); } return pts; })();
function caption(t) {
  const vis = ss(seg(t, .45, .75)) * (1 - ss(seg(t, 8.25, 8.6)));
  if (vis <= 0) return;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = vis; ctx.fillStyle = rgba(PAPER, .96); ctx.beginPath(); ctx.moveTo(-20, 1100); STRIP.forEach(p => ctx.lineTo(p[0], p[1] + (1 - vis) * 140)); ctx.lineTo(1940, 1100); ctx.closePath(); ctx.fill();
  drawPen(ctx, penStroke(STRIP.map(p => [p[0], p[1] + (1 - vis) * 140]), { w: 1.4, wob: .6, seed: 5, over: 0, gap: .8 }), 1, INK, .35);
  for (const c of CUES) {
    if (t < c.t0 || t > c.t1 + .2) continue;
    const out = 1 - ss(seg(t, c.t1, c.t1 + .2));
    ctx.font = '700 64px "Aref Ruqaa"'; ctx.direction = 'rtl'; ctx.textAlign = 'center';
    const tw = ctx.measureText(c.text).width, x1 = 960 + tw / 2 + 10;
    const p = eo(seg(t, c.t0, c.t0 + Math.min(.9, .3 + tw / 1400)));
    ctx.save(); ctx.beginPath(); ctx.rect(x1 - (tw + 40) * p, 950, (tw + 40) * p + 20, 130); ctx.clip();
    ctx.globalAlpha = vis * out; ctx.fillStyle = rgba(INK, .95); ctx.fillText(c.text, 960, 1036); ctx.restore();
  }
  ctx.restore();
}

// ---------------- notes on the page ----------------
function notes(t) {
  handwrite(ctx, 'Day 1  ·  London  ·  sunny', 290, 330, 96, eo(seg(t, .15, 1.2)), { font: '"Reenie Beanie"', col: INK, alpha: .9, rot: -.03 });
  const sp = seg(t, 1.0, 1.5); if (sp > 0) { const c = [1210, 270]; drawPen(ctx, penStroke(ellipse(c[0], c[1], 30, 30, 16).concat([[c[0] + 30, c[1]]]), { w: 2.4, wob: .8, seed: 3, over: 4 }), eo(sp * 2), INK, .9);
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU, q = eo(seg(sp, .4 + k * .06, .6 + k * .06)); if (q > 0) drawPen(ctx, penStroke([[c[0] + Math.cos(a) * 42, c[1] + Math.sin(a) * 42], [c[0] + Math.cos(a) * 62, c[1] + Math.sin(a) * 62]], { w: 2.2, wob: .4, seed: 10 + k, over: 1 }), q, INK, .9); }
    if (t > 1.3) { ctx.save(); ctx.globalCompositeOperation = 'multiply'; dab(ctx, c[0], c[1], 30, .3, hex('#e9c35a'), .5 * ss(seg(t, 1.3, 1.7)), 4); ctx.restore(); } }
}

// door opening + interior
function doorOpen(t) {
  const o = ss(seg(t, 7.36, 7.62)); if (o <= 0) return;
  const D = DOOR, hw = (D.x1 - D.x0) / 2, arc = []; for (let k = 0; k <= 12; k++) { const a = Math.PI + k / 12 * Math.PI; arc.push([D.cx + Math.cos(a) * hw, D.top + Math.sin(a) * hw]); }
  const open = [[D.x0, D.base], ...arc, [D.x1, D.base]], colA = clamp((t - arrAt(D.cx, 2030) - .05) / .45);
  drawPrims(ctx, [{ k: 'knock', poly: open, a: .9 * o }, { k: 'wash', poly: open, col: hex('#4a3b33'), a: .55 + .25 * colA, seed: 5, j: 2 }], {});
  for (const s of [-1, 1]) {
    const hinge = s < 0 ? D.x0 : D.x1, wd = hw * (1 - .78 * o), ex = hinge - s * wd, leaf = [[hinge, D.base], [hinge, D.top - (s < 0 ? 0 : 0) - hw * .7], [ex, D.top - hw * .55 + 8 * o], [ex, D.base + 6 * o]];
    drawPrims(ctx, [{ k: 'knock', poly: leaf, a: .95 }, { k: 'wash', poly: leaf, col: hex('#2f6a6a'), a: .25 + .45 * colA, seed: 8 + s, j: 1.5 }, { k: 'ink', st: penStroke([...leaf, leaf[0]], { w: 2, wob: .5, seed: 12 + s, over: 3, smooth: false }) }], {});
  }
  drawPen(ctx, penStroke(open, { w: 2.2, wob: .5, seed: 20, over: 3, smooth: false }), 1, INK, .95);
}

// sweat drops and little heat squiggles over Youssef in the close-up
function embarrassFX(head, t) {
  const { c, r } = head;
  [[15.55, .95, -.15], [15.95, 1.0, .1]].forEach(([t0, side, dy], k) => {
    const a = t - t0; if (a < 0) return;
    const slide = Math.min(a, 1.2) * r * .25, x = c[0] + r * side * 1.02 + (k ? r * .05 : 0), y = c[1] - r * .35 + dy * r + slide, sz = r * .16;
    const drop = [[x, y - sz * 1.6], [x + sz * .75, y], [x + sz * .55, y + sz * .6], [x, y + sz * .85], [x - sz * .55, y + sz * .6], [x - sz * .75, y]];
    drawPrims(ctx, [{ k: 'knock', poly: drop, a: .85 * eo(a / .2) }, { k: 'wash', poly: drop, col: hex('#8fc0de'), a: .55 * eo(a / .2), seed: 60 + k, j: .4 }, { k: 'ink', st: penStroke([...drop, drop[0]], { w: Math.max(1, r * .05), wob: .2, seed: 61 + k, over: 1 }) }], { ink: eo(a / .25) });
  });
  for (let k = 0; k < 3; k++) {
    const t0 = 15.4 + k * .12, a = t - t0; if (a < 0) continue;
    const bx = c[0] - r * .6 + k * r * .55, by = c[1] - r * 1.35 - (k === 1 ? r * .15 : 0), pts = [];
    for (let i = 0; i <= 10; i++) { const u = i / 10; pts.push([bx + Math.sin(u * TAU * 1.2 + k) * r * .07, by - u * r * .45]); }
    const cyc = (a % 1.1) / 1.1; drawPen(ctx, penStroke(pts, { w: Math.max(1, r * .05), wob: .3, seed: 80 + k + boilOf(t), over: 0 }), eo(cyc / .45), INK, .8, ei(clamp((cyc - .5) / .5)));
  }
}

// ---------------- render ----------------
window.DUR = DUR;
window.render = t => {
  const cam = camera(t), M = camMat(cam), dm = detailMix(cam);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  ctx.fillStyle = rgba(PAPER); ctx.fillRect(0, 0, 1920, 1080);
  drawLayer(ctx, M, cam, paper, paper.canvas);
  // colour, revealed by the arrival field (with a darker wet front)
  if (t > ARR_MIN - .2) {
    if (t > ARR_MAX + .6) { ctx.globalCompositeOperation = 'multiply'; drawColour(ctx, M, cam, dm); }
    else {
      const front = buildMasks(t);
      for (const pass of front ? [0, 1] : [0]) {
        tctx.setTransform(1, 0, 0, 1, 0, 0); tctx.globalCompositeOperation = 'source-over'; tctx.clearRect(0, 0, 1920, 1080);
        drawColour(tctx, M, cam, dm);
        tctx.globalCompositeOperation = 'destination-in'; tctx.imageSmoothingEnabled = true; drawLayer(tctx, M, cam, MASKL, pass ? frontC : maskC);
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = pass ? .6 : 1; ctx.drawImage(tmpC, 0, 0); ctx.globalAlpha = 1;
      }
    }
  }
  ctx.globalCompositeOperation = 'source-over';
  drawInk(M, cam, dm, t);
  ctx.setTransform(...M); ctx.globalCompositeOperation = 'source-over';
  notes(t);
  // ---- figures ----
  const bo = boilOf(t);
  for (const e of extras) {
    const x = e.x0 + e.dx * t, d = Math.hypot(x - ORIGIN[0], (e.y - ORIGIN[1]) * 1.25), tInk = .1 + d / 3300;
    if (t < tInk || cam.cx - 960 / cam.z > x + 300) continue;
    const ph = t * 6 + e.seed, k = e.still ? 0 : 1, sw = Math.sin(ph);
    const pose = { hipY: .52, lean: .03, legL: .35 * sw * k, kneeL: .3 * k * Math.max(0, Math.cos(ph)), legR: -.35 * sw * k, kneeR: .3 * k * Math.max(0, -Math.cos(ph)), handL: e.still ? V(-.04, .62, .16) : V(-.17, .48, .12 * -sw), handR: e.still ? V(.04, .62, .17) : V(.17, .48, .12 * sw), nod: e.still ? .35 : 0 };
    const S = 300, prims = figure(LOOK[e.look], pose, { x, y: e.y, S, yaw: e.yaw }, { seed: e.seed * 10, boil: bo });
    const col = clamp((t - arrAt(x, e.y - 150) - .05) / .45);
    shadow(x, e.y, S, .3 * col);
    drawPrims(ctx, prims, { color: col, ink: inkProgress(prims, t, tInk, tInk + .4), clip: col < 1 ? bloomClip(x, e.y - S * .45, S * 1.1 * eo(col), e.seed) : null });
  }
  // Mia (behind Youssef in depth): ponytail, body, face
  if (t > 7.38) {
    doorOpen(t);
    const m = mia(t), prims = figure(LOOK.mia, m.pose, m.place, { seed: 50, boil: bo });
    const col = ss(seg(t, 7.5, 8.05)), inkP = inkProgress(prims, t, 7.42, 7.78);
    const clip = col < 1 ? bloomClip(m.place.x, m.place.y - MIA.S * .55, MIA.S * .95 * eo(col), 3) : null;
    if (t > 7.55) shadow(m.place.x, m.place.y, MIA.S, .25 * col);
    const pt = ponytail(prims.head, t, -.25 * m.pose.lean);
    drawPrims(ctx, pt, { color: col, ink: clamp((t - 7.6) / .2), clip });
    drawPrims(ctx, prims, { color: col, ink: inkP, clip });
    if (t > 7.7) drawPrims(ctx, face(prims.head, miaExpr(t), { nod: m.pose.nod, boil: bo }), { color: col, ink: clamp((t - 7.7) / .15) });
  }
  // Youssef + suitcase
  {
    const y = youssef(t), prims = figure(LOOK.youssef, y.pose, y.place, { seed: 70, boil: bo });
    const col = ss(seg(t, 1.95, 2.35)), inkP = inkProgress(prims, t, .12, .62), clip = col < 1 ? bloomClip(y.place.x, y.place.y - YS * .5, YS * 1.0 * eo(col), 5) : null;
    shadow(y.place.x, y.place.y, YS, .3 * col);
    const sc = suitcase(prims.hand.R, WALK_Y + 14, clamp(y.vk * 1.2), t);
    const scCol = ss(seg(t, .45, .85)), scInk = inkProgress(sc, t, .3, .6);
    const scClip = scCol < 1 ? bloomClip(prims.hand.R[0] - 20, WALK_Y - 60, 130 * eo(scCol), 9) : null;
    const behind = t < 2.6;
    if (behind) drawPrims(ctx, sc, { color: scCol, ink: scInk, clip: scClip });
    drawPrims(ctx, prims, { color: col, ink: inkP, clip });
    const ex = youExpr(t);
    drawPrims(ctx, face(prims.head, ex, { nod: y.pose.nod, boil: bo, beard: LOOK.youssef.hair, blush: ex.blush }), { color: Math.max(col, .0001), ink: clamp((t - .5) / .15) });
    if (!behind) drawPrims(ctx, sc, { color: scCol, ink: scInk, clip: scClip });
    if (t > 15.3) embarrassFX(prims.head, t);
    window.__HEAD = prims.head;
  }
  // the bus (in front of everything on the pavement)
  { const xc = busX(t); if (xc - BUS.len / 2 < W + 200 && xc + BUS.len / 2 > -100) { busWind(t); drawPrims(ctx, busPrims(xc, t), { color: 1 }); } }
  drawBubbles(t);
  // paper tooth over everything
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = toothPat;
  ctx.setTransform(cam.z * .8, 0, 0, cam.z * .8, M[4], M[5]);
  const iz = 1 / (cam.z * .8); ctx.fillRect((cam.cx - 1000 / cam.z) / .8, (cam.cy - 600 / cam.z) / .8, 2100 * iz, 1250 * iz); ctx.restore();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  caption(t);
  // end: the page whitens out
  const f = ss(seg(t, 16.5, 17.0)); if (f > 0) { ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = rgba(PAPER, f); ctx.fillRect(0, 0, 1920, 1080); }
  ctx.globalCompositeOperation = 'source-over';
};
window.TEXTS = t => {
  const cam = camera(t), out = [];
  BUB.forEach(b => { if (t >= b.t0 && t <= b.t1) { const a = toScreen(cam, b.cx - b.w / 2, b.cy - b.h / 2), c = toScreen(cam, b.cx + b.w / 2, b.cy + b.h / 2); out.push({ id: b.id, text: b.text, x0: a[0], y0: a[1], x1: c[0], y1: c[1] }); } });
  return out;
};
window.EV = [];
window.READY = true;
