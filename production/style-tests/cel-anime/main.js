// "First Day" — 80s cel anime style test (daylight London). Picture only; the voice track is supplied.
import { canvas, W, H, LWK, rgba, mix, TAU, cel, poly, line, rng } from './cel.js';
import { makePost } from './post.js';
import { YOUSSEF as PY, MIA as PM } from './pal.js';
import { figure, walkPose, hand } from './body.js';
import { head } from './head.js';
import { suitcase, bus } from './props.js';
import * as PL from './plates.js';
import { hud, SUBS } from './hud.js';

const qs = new URLSearchParams(location.search);
const TL = await (await fetch('timeline.json')).json();
const [sc, g] = canvas(W, H), [gc, e] = canvas(W, H), [lc, L] = canvas(W, H), [ovc, ov] = canvas(W, H);
const post = makePost(document.getElementById('gl'));

await document.fonts.load('italic 900 64px Kanit', 'ENGLISH SCHOOL');
await document.fonts.load('600 54px "Barlow SC"'); await document.fonts.load('700 30px "Barlow SC"');
await document.fonts.load('800 60px "Baloo Bhaijaan 2"', 'أول يوم ليّا في لندن');

// ——— time helpers: characters on twos, performance beats on threes ———
const q12 = t => Math.floor(t * 12 + 1e-6) / 12, q8 = t => Math.floor(t * 8 + 1e-6) / 8;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x)), seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const ss = x => x * x * (3 - 2 * x), eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2, eo = x => 1 - Math.pow(1 - x, 3);
const lerp = (a, b, u) => a + (b - a) * u;
const ramp = (t, keys) => { if (t <= keys[0][0]) return keys[0][1]; for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) { const [t0, v0] = keys[i - 1], [t1, v1] = keys[i]; return lerp(v0, v1, ss((t - t0) / (t1 - t0))); } return keys[keys.length - 1][1]; };

// lip flaps: 3–4 mouth shapes at 8 fps inside the word spans from timeline.json
const FLAP = { mia: ['wide', 'talk', 'oh', 'talk'], youssef: ['talk', 'wide', 'oh', 'talk'] };
function mouthAt(who, t, rest) {
  const tq = q8(t);
  const F = who === 'mia' && t > 14 ? ['talk', 'oh', 'talk', 'oh'] : FLAP[who];
  for (const [a, b, w] of TL.talk) if (w === who && tq >= a - .02 && tq < b) return F[Math.floor((tq - a) * 8 + .01) % 4];
  return rest;
}
const blinkAt = (t, list) => list.some(b => t >= b && t < b + .125);

// ——— assets painted once ———
const A = {
  far: PL.craneFar(), near: PL.craneNear(), school: PL.schoolPlate(), door: PL.doorPlate(),
};
A.track = PL.smear(PL.trackPlate(), 14); A.fore = PL.trackFore();
{ const [c, x] = canvas(A.fore.w, H); x.filter = 'blur(4px)'; x.drawImage(A.fore.c, 0, 0); A.foreB = c; }
A.doorBlur = PL.blurred(A.door, 9);

// draw a figure at screen (x, groundY) with scale k; keeps the outline at ~2.4 px whatever the size
function fig(ctx, x, y, k, D) {
  LWK.k = clamp(2.4 / (1.6 * k), .45, 14);
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k); figure(ctx, D); ctx.restore(); LWK.k = 1;
}
function blit(ctx, P, key, x, y, k = 1) { ctx.drawImage(P[key], x, y, P.w * k, P.h * k); }
function plateDraw(P, x, y, k = 1) { blit(g, P, 'c', x, y, k); blit(e, P, 'e', x, y, k); }

// ——— shots ———
const SH = [[0, 4.1, 'crane'], [4.1, 6.2, 'track'], [6.2, 7.6, 'school'], [7.6, 14.45, 'two'], [14.45, 15.55, 'mia'], [15.55, 17.01, 'cu']];

function walkWithCase(t, x, y, k, o = {}) {
  const ph = q12(t) * (o.rate || 1) + (o.ph0 || 0);
  const wp = walkPose(ph % 1, o.amp ?? 1);
  const D = { who: 'y', P: PY, ...wp,
    arms: { n: [-.42, -.05, 'fist'], f: [wp.armSwing * .8 + .05, .35, 'fist'] },
    headO: { expr: o.expr || 'excited', look: o.look, open: o.blink ? 0 : undefined, mouth: o.mouth },
    tilt: o.tilt || 0,
    onNearHand: (gg, wr, ang, ground) => {
      // solve the tilt so the wheels touch the ground while the grip sits in the hand
      let best = .5, err = 1e9;
      for (let th = .15; th < 1.25; th += .01) { const gy = gripAt(th)[1]; const e2 = Math.abs((wr[1] - gy) - ground); if (e2 < err) { err = e2; best = th; } }
      const [gx, gy] = gripAt(best);
      gg.save(); gg.translate(wr[0] - gx, wr[1] - gy); suitcase(gg, { tilt: best }); gg.restore();
    } };
  fig(L, x, y, k, D);
}
function gripAt(th) { const x0 = -20, H = 380, y0 = -H - 30, hy = y0 - 40 - 230, gx = x0 + 125, gy = hy - 10, c = Math.cos(th), s = Math.sin(th); return [gx * c - gy * s, gx * s + gy * c]; }

const S = {};
// 1 — multiplane crane down from the sky to the street; the bus crosses and reveals the tiny hero
S.crane = (t) => {
  const u = eio(seg(t, .25, 3.0));
  const farY = -920 * u, nearY = -1520 * u, dx = -40 * u;
  plateDraw(A.far, dx * .5, farY);
  plateDraw(A.near, dx - 40, nearY);
  // foreground lamp post (fastest layer)
  const fy = 1240 - 1900 * u + 1900;
  lampPost(g, 150 + dx * 1.6, fy - 1900 * (1 - u) * 0 , 1.25);
  // hero on the far pavement
  const gy = PL.CRANE.gy + nearY + 70;
  const walkT = Math.max(0, t - 3.45);
  const yx = 1180 + dx + walkT * 110;
  if (t < 3.45) {
    const D = { who: 'y', P: PY, legs: { n: [.03, .04], f: [-.05, .06] }, arms: { n: [-.25, -.05, 'fist'], f: [.08, .2, 'rest'] }, tilt: -.12,
      headO: { expr: 'excited', look: [.3, -.8] } };
    fig(L, yx, gy, .108, D);
    L.save(); L.translate(yx - 46, gy); L.scale(.108, .108); suitcase(L, { tilt: 0, handle: 1 }); L.restore();
  } else walkWithCase(walkT, yx, gy, .108, { look: [.3, -.4] });
  // bus on the road, on ones (no smear: it is a cel), with speed streaks
  const bt = seg(t, 1.55, 3.55), bx = 2050 - 3300 * bt;
  if (bt > 0 && bt < 1) {
    L.save(); L.translate(bx, PL.CRANE.gy + nearY + 210); bus(L, 1.02, -t * 9); L.restore();
    L.save(); L.strokeStyle = rgba('#ffffff', .55); L.lineWidth = 3; const R = rng(Math.floor(t * 24));
    for (let i = 0; i < 7; i++) { const yy = PL.CRANE.gy + nearY + 210 - 40 - R() * 400, xx = bx + 1000 + R() * 200; L.beginPath(); L.moveTo(xx, yy); L.lineTo(xx + 200 + R() * 300, yy); L.stroke(); }
    L.restore();
  }
};
function lampPost(ctx, x, base, k) {
  ctx.save(); ctx.translate(x, base); ctx.scale(k, k);
  const P = { f: '#24302c', s: '#121a17', h: '#4e6660', l: '#06090a' };
  cel(ctx, poly([[-14, 0], [14, 0], [9, -500], [-9, -500]]), { ...P, so: [-6, 0], ho: [3, 0], lw: 2 });
  cel(ctx, poly([[-30, 0], [30, 0], [24, -120], [-24, -120]]), { ...P, so: [-10, 0], lw: 2 });
  cel(ctx, poly([[-32, -500], [32, -500], [46, -560], [-46, -560]]), { ...P, lw: 2 });
  cel(ctx, poly([[-38, -560], [38, -560], [48, -650], [-48, -650]]), { f: '#e8f0f4', s: '#a8bcc8', so: [-10, 0], l: P.l, lw: 2 });
  cel(ctx, poly([[-56, -650], [56, -650], [0, -700]]), { ...P, so: [-6, 3], lw: 2 });
  ctx.restore();
}

// 2 — side tracking, 4 layers: sky/terrace plate (1×), hero (held in frame), lamp posts (1.8×, smeared)
S.track = (t, lt) => {
  const v = 330, off = -lt * v - 200;
  plateDraw(A.track, off, 0);
  const blink = blinkAt(lt, [.95]);
  const look = lt < 1.2 ? [.25, -.65] : [.4, 0];
  const expr = lt < 1.25 ? 'excited' : 'nervous';
  walkWithCase(lt, 860, PL.TRACK.gy + 150, .45, { expr, look, blink, tilt: lt < 1.2 ? -.08 : 0 });
  // foreground posts on ones, smeared
  const fx = -lt * v * 1.8 + 300;
  L.drawImage(A.foreB, fx, 0);
};

// 3 — the school, low angle, slow push; light sweep across the sign; the door opens and Mia steps out
S.school = (t, lt) => {
  const k = 1 + .05 * eio(seg(lt, 0, 1.4)), y = -420 + 24 * lt;
  for (const c of [g, e, L]) { c.save(); c.translate(960, 540); c.scale(k, k); c.translate(-960, -540); }
  plateDraw(A.school, 0, y);
  // sign light sweep (emissive band across the letters) + star glint
  const SG = A.school.sign, sw = seg(lt, .15, 1.0), sgx = SG.x - SG.w * .58 + sw * SG.w * 1.16, sgy = SG.y + y;
  if (sw > 0 && sw < 1) { e.save(); e.beginPath(); e.rect(SG.x - SG.w / 2, sgy - 50, SG.w, 100); e.clip(); e.fillStyle = rgba('#fff4c0', .9); e.beginPath(); e.moveTo(sgx - 30, sgy - 60); e.lineTo(sgx + 10, sgy - 60); e.lineTo(sgx - 20, sgy + 60); e.lineTo(sgx - 60, sgy + 60); e.fill(); e.restore(); }
  if (lt > .95 && lt < 1.3) star(e, SG.x + SG.w * .44, sgy - 30, 70 * Math.sin(seg(lt, .95, 1.3) * Math.PI));
  // the doorway: both leaves swing open at 7.2; Mia steps out at mia_appears (7.4)
  const open = eo(seg(q12(t), 7.17, 7.34));
  const fy0 = PL.SCH.gy - 290, fy1 = PL.SCH.gy - 20, x0 = PL.schX(920 + 200, fy0), x1 = PL.schX(920 + 360, fy0), dY = fy0 + y, dh = fy1 - fy0;
  if (open > 0) {
    const cw = x1 - x0, mid = (x0 + x1) / 2;
    g.fillStyle = '#e8c896'; g.fillRect(x0, dY, cw, dh); g.fillStyle = '#c99a68'; g.fillRect(x0, dY + dh * .62, cw, dh * .38);
    g.fillStyle = rgba('#fff4d8', .9); g.fillRect(mid - 18, dY + 30, 36, 60); e.fillStyle = rgba('#ffe8b0', .4); e.fillRect(mid - 18, dY + 30, 36, 60);
    const lw = cw / 2 * (1 - open * .82);
    g.fillStyle = '#1f4f9c'; g.fillRect(x0, dY, lw, dh); g.fillRect(x1 - lw, dY, lw, dh);
    g.fillStyle = '#163a74'; g.fillRect(x0 + lw - 6, dY, 6, dh); g.fillRect(x1 - lw, dY, 6, dh);
    if (t >= 7.34) {
      const st = q12(seg(t, 7.34, 7.6) * 1), mk = .118 + .014 * st;
      fig(L, mid, dY + dh + 10 * st, mk, { who: 'm', P: PM, mirror: true, legs: { n: [.12 * (1 - st), .14 * (1 - st)], f: [-.08, .08] }, arms: { n: [-.1, .2, 'rest'], f: [.2 + .9 * st, .3 + .6 * st, 'open'] }, headO: { expr: 'smile' } });
    }
  }
  for (const c of [g, e, L]) c.restore();
};
function star(ctx, x, y, r) {
  if (r <= 1) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = '#fff6d0';
  for (const [a, l] of [[0, 1], [Math.PI / 2, 1], [Math.PI / 4, .45], [-Math.PI / 4, .45]]) { ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(-r * l, 0); ctx.lineTo(0, -r * .06); ctx.lineTo(r * l, 0); ctx.lineTo(0, r * .06); ctx.fill(); ctx.restore(); }
  ctx.restore();
}

// 4 — locked two-shot with lip flaps; slow push after Youssef's line
function twoPoses(t) {
  // —— Mia (right, on the step, mirrored: faces Youssef) ——
  const tq = q12(t), tb = q8(t);
  const waveUp = ramp(tq, [[7.8, 0], [7.95, -.15], [8.15, 1], [9.5, 1], [9.8, 0]]);   // anticipation dip, raise, hold, lower
  const waveOsc = Math.sin(tb * TAU * 2.2) * .32 * seg(tq, 8.15, 8.3) * (1 - seg(tq, 9.4, 9.55));
  const puzz = seg(tq, 13.75, 14.1);
  const mia = { who: 'm', P: PM, mirror: true, legs: { n: [.02, .02], f: [-.06, .05] },
    arms: { n: [-.08, .25, 'rest'], f: [lerp(.15, 2.45, waveUp), lerp(.3, .55 + waveOsc, waveUp), waveUp > .5 ? 'open' : 'rest'] },
    tilt: lerp(0, -.12, puzz) + (t > 8 && t < 9.5 ? .03 : 0),
    headO: { expr: puzz > .3 ? 'puzzled' : (t < 9.6 ? 'smileopen' : 'smile'), mouth: mouthAt('mia', t, puzz > .3 ? 'oh' : (t < 9.6 ? 'smileopen' : 'smile')), open: blinkAt(t, [7.75, 10.7, 12.2]) ? 0 : undefined, look: puzz > .3 ? [.15, .1] : [0, .1], sway: Math.sin(tq * 3) * .3, ph: tq * .5 } };
  // —— Youssef (left, faces right) ——
  const hello = ramp(tq, [[9.8, 0], [9.95, 1], [10.6, 1], [10.85, 0]]);
  const scratch = ramp(tq, [[11.0, 0], [11.3, 1]]);
  const lean = ramp(tq, [[9.8, 0], [9.9, -.03], [10.0, .05], [10.5, .02], [11.2, -.02]]);
  let expr = 'smile', look = [.2, 0];
  if (t < 8.1) { expr = 'excited'; look = [.3, -.1]; }
  else if (t < 9.85) expr = 'smile';
  else if (t < 10.6) expr = 'smileopen';
  else if (t < 13.5) { expr = 'nervous'; look = [((Math.floor(tb * 2) % 3) - 1) * .45, .15]; }
  else if (t < 14.1) { expr = 'smile'; look = [.25, 0]; }
  else { expr = 'gulp'; look = [.3, 0]; }
  const yous = { who: 'y', P: PY, legs: { n: [.03, .04], f: [-.04, .05] },
    arms: { n: [lerp(-.1, -2.35, scratch), lerp(.15, -2.08, scratch), 'fist'], f: [lerp(.12, 1.25, hello), lerp(.2, 1.35, hello), hello > .5 ? 'open' : 'rest'] },
    nearOver: scratch > .5, tilt: lean + (scratch > .5 ? .06 : 0),
    headO: { expr, look, mouth: mouthAt('youssef', t, expr === 'smileopen' ? 'smileopen' : undefined), open: blinkAt(t, [8.6, 11.9]) ? 0 : undefined, sweat: t > 12.3 && t < 13.6 ? .2 : (t > 14.1 ? .35 : null) } };
  return { mia, yous };
}
S.two = (t, lt) => {
  const k = 1 + .07 * eio(seg(t, 12.9, 14.45));
  for (const c of [g, e, L]) { c.save(); c.translate(960, 470); c.scale(k, k); c.translate(-960, -470); }
  plateDraw(A.door, -180, -40);
  const { mia, yous } = twoPoses(t);
  // suitcase stands upright behind Youssef
  L.save(); L.translate(300, 1250); L.scale(.82, .82); LWK.k = 1.8; suitcase(L, { tilt: 0, handle: 1 }); LWK.k = 1; L.restore();
  fig(L, 640, 1310, .82, yous);
  fig(L, 1430, 1242, .82, mia);
  for (const c of [g, e, L]) c.restore();
};

// 5 — Mia, medium close-up: "Sorry?"
S.mia = (t, lt) => {
  plateDraw(A.doorBlur, -1320, -560, 1.5);
  const tq = q12(t), tilt = -.12 - .08 * eo(seg(tq, 14.45, 14.8));
  const D = { who: 'm', P: PM, mirror: true, legs: { n: [0, 0], f: [0, 0] }, arms: { n: [-.05, .2, 'rest'], f: [.1, .3, 'rest'] }, tilt,
    headO: { expr: 'puzzled', mouth: mouthAt('mia', t, 'oh'), open: blinkAt(t, [14.62]) ? 0 : undefined, look: [.2, .05], ph: tq * .5 } };
  fig(L, 1180, 3190, 2.35, D);
};

// 6 — Youssef close-up: the embarrassed freeze (impact frame first)
S.cu = (t, lt) => {
  const impact = lt < 2 / 24;
  const tq = q12(t);
  if (impact) {
    g.fillStyle = '#f4f0ff'; g.fillRect(0, 0, W, H);
    const R = rng(7); g.fillStyle = '#1a1030';
    for (let i = 0; i < 90; i++) { const a = R() * TAU, w = .006 + R() * .02, r0 = 260 + R() * 200; g.beginPath(); g.moveTo(860 + Math.cos(a) * r0, 470 + Math.sin(a) * r0); g.lineTo(860 + Math.cos(a - w) * 2400, 470 + Math.sin(a - w) * 2400); g.lineTo(860 + Math.cos(a + w) * 2400, 470 + Math.sin(a + w) * 2400); g.fill(); }
  } else {
    // gag card: flat painted violet-blue with light bands sweeping across (move light, not drawings)
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#5a6fc8'); gr.addColorStop(1, '#8fa4e8'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 5; i++) { const x = ((lt * 520 + i * 470) % 2600) - 500; g.fillStyle = rgba('#c8d4ff', .28); g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 140, 0); g.lineTo(x - 260, H); g.lineTo(x - 400, H); g.fill(); }
  }
  const jit = Math.floor(tq * 12) % 2 ? 2 : -2;
  const D = { who: 'y', P: PY, legs: { n: [0, 0], f: [0, 0] }, arms: { n: [-.05, .1, 'rest'], f: [.1, .2, 'rest'] }, tilt: .04,
    headO: { expr: 'shock', blush: .6, sweat: .1 + .9 * eo(seg(tq, 15.75, 16.6)), sweatSize: 1.7 } };
  if (impact) { D.P = silhouette(PY); }
  fig(L, 840 + jit, 3900, 2.75, D);
};
// vertical gloom lines on the forehead (comedic blue lines), drawn in head space of the CU
function gloom(ctx, x, y, k) {
  ctx.save(); ctx.translate(x, y - 1202 * k); ctx.translate(-8 * k, 140 * k); ctx.rotate(.04); ctx.scale(1.08 * k, 1.08 * k); ctx.translate(8, -140);
  ctx.globalAlpha = .5; ctx.strokeStyle = '#3c3aa0'; ctx.lineCap = 'round';
  for (let i = 0; i < 6; i++) { ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(-30 + i * 13, -34 + (i % 2) * 4); ctx.lineTo(-30 + i * 13, -6 + (i % 3) * 5); ctx.stroke(); }
  ctx.restore();
}
const SIL = {};
function silhouette(P) {
  if (SIL.p) return SIL.p;
  const out = {}; const dk = { f: '#1a1030', s: '#1a1030', h: '#1a1030', l: '#f4f0ff' };
  for (const [k, v] of Object.entries(P)) out[k] = typeof v === 'string' ? '#1a1030' : { ...dk };
  out.white_eye = '#f4f0ff'; out.lash = '#f4f0ff';
  return (SIL.p = out);
}

function render(t) {
  for (const x of [g, e, L]) { x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.filter = 'none'; }
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H); e.fillStyle = '#000'; e.fillRect(0, 0, W, H); L.clearRect(0, 0, W, H);
  const sh = SH.find(s => t >= s[0] && t < s[1]) || SH[SH.length - 1];
  S[sh[2]](t, t - sh[0]);
  // cel layer over the painted plate; its silhouette is stamped black into the emissive canvas so glow never bleeds through
  g.drawImage(lc, 0, 0);
  e.save(); e.globalCompositeOperation = 'destination-out'; e.drawImage(lc, 0, 0); e.globalCompositeOperation = 'destination-over'; e.fillStyle = '#000'; e.fillRect(0, 0, W, H); e.restore();
  if (qs.get('nosub')) ov.clearRect(0, 0, W, H); else hud(ov, t);
  const fade = 1 - ss(seg(t, 16.45, 17.0));
  const o = { power: Math.min(1, t / .45), expo: 1.0 * fade, bloom: .55, halo: .1, thr: .96, sk: .04, lift: .02, contrast: .1, sat: 1.06, tint: [1, .99, .975], fade: 0, shadowTint: [.12, .08, .2] };
  if (t >= 15.55 + 2 / 24 && t < 15.55 + 7 / 24) o.track = .55 * (1 - (t - 15.63) / .21);
  post.render(sc, gc, Math.round(t * 24), ovc, qs.get('raw') ? { ...o, scan: 0, grille: 0, bloom: 0, halo: 0, noiseA: 0, corner: 0, glow: 0, power: 1, track: 0 } : o);
}
window.DUR = 17;
window.render = render;
window.TEXTS = t => [];
render(parseFloat(qs.get('t') ?? '10.5'));
window.READY = true;
