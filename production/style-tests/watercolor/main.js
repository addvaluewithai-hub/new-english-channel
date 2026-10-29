// ---------- Youssef's Diary, Day 1: render(t) ----------
let PAPER_IMG;
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
window.DUR = 17;
const TL = {
  subs: [[0.45, 2.45, 'أول يوم ليّا في لندن…'], [2.45, 5.55, 'وكنت فاكر إن الإنجليزي بتاعي كويس.'], [5.55, 7.95, 'لحد ما قابلت ميا.']],
  talk: [[8.2, 8.64, 'mia'], [8.7, 8.84, 'mia'], [8.8, 9.24, 'mia'], [10.1, 10.54, 'youssef'], [11.4, 11.74, 'youssef'], [12.5, 12.84, 'youssef'], [12.8, 13.34, 'youssef'], [15.05, 15.39, 'mia']],
};

// ---------- camera: one continuous move over one painted sheet ----------
const camX = monotone([[0, 1950], [1.6, 2010], [4, 2400], [6.6, 2880], [7.4, 3000], [8.4, 3090], [14.75, 3094], [15.95, 2958], [17, 2952]]);
const camY = monotone([[0, 482], [4, 500], [7, 512], [8.4, 505], [14.75, 505], [15.95, 517], [17, 514]]);
const camZ = monotone([[0, .7], [2.5, .77], [5.5, .9], [7.0, 1.0], [8.4, 1.45], [14.75, 1.5], [15.95, 3.1], [17, 3.22]]);
const cam = t => ({ cx: camX(t), cy: camY(t), z: camZ(t) });
const W2S = (c, wx, wy) => [960 + (wx - c.cx) * c.z, 540 + (wy - c.cy) * c.z];
const setCam = (c, par = 1) => { const zl = 1 + (c.z - 1) * par, cy = lerp(482, c.cy, par); ctx.setTransform(zl, 0, 0, zl, 960 - c.cx * par * zl, 540 - cy * zl); };
const FRONT = t => t < 1.75 ? lerp(-280, 2060, eio(seg(t, .05, 1.75))) : 2060;

// ---------- performance: poses as functions of t ----------
const k = keys => monotone(keys);
const YX = k([[0, 1100], [1, 1356], [6.3, 2700], [7.0, 2880], [17, 2880]]);
const Y_SM = k([[0, .7], [6.8, .7], [7.35, .45], [7.9, .95], [9.7, .85], [10.4, .6], [11.3, .25], [13.7, .3], [14.5, .2], [14.85, -.2], [17, -.2]]);
const Y_BR = k([[0, .4], [7.3, .5], [7.6, 1], [8.6, .4], [10, .3], [11.2, .1], [14.5, .45], [14.95, .15], [17, .15]]);
const Y_WO = k([[0, 0], [10.9, 0], [11.4, .6], [13.8, .5], [14.4, .3], [14.85, 1], [17, 1]]);
const Y_LX = k([[0, 1.5], [6.8, 1.5], [7.2, 1], [7.6, 2], [11.5, 2], [11.75, 1], [12.35, 1], [12.55, 2], [14.75, 2], [15.05, -1.5], [17, -1.5]]);
const Y_LY = k([[0, 0], [6.8, 0], [7.15, -2.2], [7.45, -2.2], [7.75, -.5], [11.5, -.5], [11.75, 2], [12.35, 2], [12.55, -.5], [14.75, -.5], [15.05, 2.4], [17, 2.4]]);
const Y_TI = k([[0, 0], [6.8, 0], [7.15, -.15], [7.5, -.15], [7.9, -.04], [11.5, -.04], [11.8, .06], [12.35, .06], [12.6, -.04], [14.7, -.04], [15.1, .11], [17, .12]]);
const M_SM = k([[7, .7], [8, .95], [9.6, .9], [12.6, .85], [13.3, .3], [14.3, 0], [15.6, .05], [17, .1]]);
const M_BR = k([[7, .5], [8.2, .7], [9.8, .25], [12.8, .2], [13.6, .35], [17, .35]]);
const M_TI = k([[7, 0], [8.2, -.04], [9.6, 0], [13.2, 0], [14.3, .13], [15.8, .14], [17, .1]]);
const blinkAt = (t, list) => { let b = 0; for (const s of list) b = Math.max(b, 1 - Math.abs(t - s) / .07); return clamp(b); };
function mouthOpen(t, who) {
  let o = 0;
  for (const [a, b, w] of TL.talk) if (w === who && t > a - .02 && t < b + .06) {
    const u = clamp((t - a) / (b - a)), n = Math.max(1, Math.round((b - a) / .15));
    o = Math.max(o, (.3 + .7 * Math.abs(Math.sin(u * Math.PI * n))) * Math.pow(Math.sin(Math.PI * u), .4));
  }
  return o;
}
// hand targets blended between gestures (2-bone IK solves the elbow)
function blendTargets(t, keys) {          // keys: [[t, [x,y]], ...] monotone per axis
  const fx = monotone(keys.map(([a, p]) => [a, p[0]])), fy = monotone(keys.map(([a, p]) => [a, p[1]]));
  return [fx(t), fy(t)];
}
let YN_X, YN_Y, MN_X, MN_Y;
function buildTracks() {
  const YN = [[6.6, [20, -138]], [7.2, [18, -140]], [9.8, [20, -142]], [10.05, [70, -342]], [10.65, [72, -346]], [11.0, [34, -205]], [11.35, [26, -226]], [12.3, [27, -224]], [12.55, [25, -230]], [12.9, [62, -205]], [13.5, [64, -200]], [14.0, [22, -150]], [14.55, [20, -146]], [14.95, [-8, -291]], [17, [-8, -289]]];
  YN_X = monotone(YN.map(([a, p]) => [a, p[0]])); YN_Y = monotone(YN.map(([a, p]) => [a, p[1]]));
  const MN = [[7.0, [16, -140]], [7.85, [16, -142]], [8.15, [64, -350]], [9.5, [66, -352]], [10.1, [18, -142]], [14.25, [18, -142]], [14.6, [50, -206]], [15.7, [52, -208]], [16.6, [30, -170]], [17, [28, -166]]];
  MN_X = monotone(MN.map(([a, p]) => [a, p[0]])); MN_Y = monotone(MN.map(([a, p]) => [a, p[1]]));
}

function youssefPose(t) {
  const x = YX(t), ph = (x - 1100) / 324 * Math.PI * 2, wk = 1 - ss(seg(t, 6.55, 7.05));
  const A = .3 * wk, bend = c => wk * (.06 + .75 * Math.pow(Math.max(0, c), 1.4));
  const legN = [A * Math.sin(ph) + (1 - wk) * .05, bend(Math.cos(ph)) + (1 - wk) * .03];
  const legF = [A * Math.sin(ph + Math.PI) - (1 - wk) * .04, bend(Math.cos(ph + Math.PI)) + (1 - wk) * .03];
  // near arm: walking swing (FK) blended into gesture targets
  const sw = -.32 * Math.sin(ph), S = [12, -258], E = addv(S, sw, 64), Wr = addv(E, sw + .3, 62);
  let tgt = [YN_X(t), YN_Y(t)];
  if (t < 7.2) { const kk = ss(seg(t, 6.6, 7.2)); tgt = [lerp(Wr[0], tgt[0], kk), lerp(Wr[1], tgt[1], kk)]; }
  if (t > 10.05 && t < 10.75) tgt[0] += Math.sin((t - 10.05) * 17) * 9 * Math.sin(Math.PI * seg(t, 10.05, 10.75));   // little wave
  if (t > 14.95) tgt[1] += Math.sin(t * 9) * 3;                                                                    // rubbing the neck
  const open = (t > 9.95 && t < 10.85) || (t > 12.75 && t < 13.6);
  const flat = t > 11.2 && t < 12.7;
  // the suitcase: tilted and trailing while walking, upright once he stops
  const cs = { x: lerp(-112, -178, wk), th: lerp(0, .4 + .03 * Math.sin(ph * 2), wk) };
  const top = apP(mulM(trM(cs.x, 0), rotAt(cs.th, 0, 0)), [44, -132]), rod = lerp(30, 40, wk);
  const hand = [top[0] + Math.sin(cs.th) * rod, top[1] - Math.cos(cs.th) * rod];
  const shUp = 5 * ss(seg(t, 14.7, 15.1)) - 2 * ss(seg(t, 9.8, 10.1)) * (1 - ss(seg(t, 10.6, 11)));
  const breath = Math.sin(t * 2.1) * 1.2 * (1 - wk);
  return {
    legN, legF, lean: .05 * wk + .03 * ss(seg(t, 9.9, 10.2)) * (1 - ss(seg(t, 10.8, 11.2))) - .025 * ss(seg(t, 14.7, 15.2)), bob: breath, shUp,
    armN: { target: tgt, bend: -1, open: open || flat, spread: flat ? -.2 : 0 }, armF: { target: hand, bend: 1 }, case: cs,
    tilt: Y_TI(t) + wk * .025 * Math.sin(ph * 2),
    face: { smile: Y_SM(t), brow: Y_BR(t), worry: Y_WO(t), lx: Y_LX(t), ly: Y_LY(t), blink: blinkAt(t, [2.2, 4.6, 8.7, 12.0, 14.25, 16.55]), open: mouthOpen(t, 'youssef'), grim: t > 14.85 ? 1 : 0, blush: ss(seg(t, 14.7, 15.6)), sweat: ss(seg(t, 15.3, 15.7)), sweatSlide: ss(seg(t, 15.6, 17.2)) },
  };
}
function miaPose(t) {
  let tgt = [MN_X(t), MN_Y(t)];
  if (t > 8.15 && t < 9.55) tgt[0] += Math.sin((t - 8.15) * 15) * 11 * Math.sin(Math.PI * seg(t, 8.15, 9.55));
  const open = (t > 8.0 && t < 9.8) || (t > 14.45 && t < 16.4);
  const lean = .05 * ss(seg(t, 14.3, 14.8)) * (1 - .5 * ss(seg(t, 16, 17)));
  return {
    legN: [.03, .02], legF: [-.05, .02], lean, bob: Math.sin(t * 1.9 + 1) * 1, shUp: 0, skirt: Math.sin(t * 1.6) * 1.2,
    armN: { target: tgt, bend: -1, open, spread: t > 14.45 ? -.5 : 0 }, armF: { target: [-12, -140], bend: -1 },
    tilt: M_TI(t),
    face: { smile: M_SM(t), brow: M_BR(t), worry: 0, browR: -4 * ss(seg(t, 14.2, 14.6)), lx: 1.5, ly: -.2, blink: blinkAt(t, [9.3, 11.6, 13.4, 16.1]), open: mouthOpen(t, 'mia'), tail: Math.sin(t * 1.7) * .6 + M_TI(t) * 3 },
  };
}
const MIA_X = 3300, MIA_Y = 752, MIA_S = .94;

function drawCharacter(c, x, y, face, s, G, p = 1) {
  ctx.save(); const M = ctx.getTransform(); ctx.transform(face * s, 0, 0, s, x, y); drawFigure(ctx, G, p); ctx.setTransform(M); ctx.restore();
}
// world-space position of a figure-local point (mouth anchors for the notes)
const figPt = (x, y, face, s, lx, ly) => [x + face * s * lx, y + s * ly];

// ---------- annotations: hand-written English notes on lifted paper ----------
function liftPatch(x0, y0, x1, y1, a, seed) {
  if (a <= 0) return;
  withSeed(seed, () => {
    PAPER_PAT.setTransform(new DOMMatrix()); ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = PAPER_PAT;
    const h = y1 - y0;
    for (let i = 0; i < 2; i++) { const yy = y0 + h * (.3 + .4 * i), s = mk(qcurve(x0 - 14, yy + rnd(-3, 3), x1 + 18, yy + rnd(-3, 3), rnd(-4, 4), 10), h * .78, PAPER, { prof: 'even', nb: 0 }); ctx.beginPath(); ribbonPath(ctx, s, 1); ctx.fill(); }
    ctx.restore();
  });
}
function leader(x0, y0, x1, y1, p, bend = 20, a = .75) {
  if (p <= 0) return;
  const pts = qcurve(x0, y0, x1, y1, bend, 20), m = Math.max(1, Math.round(20 * clamp(p)));
  ctx.beginPath(); for (let i = 0; i <= m; i++) i ? ctx.lineTo(pts[i][0], pts[i][1]) : ctx.moveTo(pts[i][0], pts[i][1]);
  ctx.strokeStyle = rgba(INK, a); ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.stroke();
  if (p >= 1) { ctx.beginPath(); ctx.arc(x1, y1, 3.5, 0, 7); ctx.fillStyle = rgba(INK, a); ctx.fill(); }
}
const NOTE_FONT = '600 68px Caveat';
const TEXTS_NOW = [];
// txt written left to right (wFrac: revealed fraction of the width), anchored by a pen leader to (ax, ay)
function note(id, txt, x, y, wFrac, alpha, ax, ay, lp, o = {}) {
  if (alpha <= 0) return;
  ctx.save(); ctx.font = NOTE_FONT; const w = ctx.measureText(txt).width;
  ctx.globalAlpha = alpha;
  liftPatch(x - 10, y - 50, x - 10 + (w + 20) * clamp(wFrac * 1.15 + .12), y + 26, .78, o.seed || 3);
  if (ax !== undefined) leader(o.lx ?? x + w * .5, o.ly ?? y + 30, ax, ay, lp, o.bend ?? 30);
  ctx.beginPath(); ctx.rect(x - 8, y - 80, (w + 16) * clamp(wFrac), 130); ctx.clip();
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.shadowColor = rgba(PAPER, .95); ctx.shadowBlur = 14;
  ctx.fillStyle = rgba(INK, .93); ctx.fillText(txt, x, y); ctx.shadowBlur = 0; ctx.fillText(txt, x, y);
  ctx.restore();
  TEXTS_NOW.push({ id, text: txt, x0: x, y0: y - 60, x1: x + w, y1: y + 20 });
  return w;
}
function drawNotes(t, c) {
  // two-shot ↔ close-up layout
  const kz = eio(seg(t, 14.8, 15.9));
  const ym = W2S(c, ...LAST.ym), mm = W2S(c, ...(LAST.mm || [MIA_X, MIA_Y - 280]));
  // Mia: "Hi! I'm Mia."
  if (t > 7.95 && t < 14.4) {
    const a = ss(seg(t, 7.95, 8.15)) * (1 - ss(seg(t, 13.95, 14.35)));
    ctx.font = NOTE_FONT; const w = ctx.measureText("Hi! I'm Mia.").width, x = mm[0] - 70 - w;
    note('mia1', "Hi! I'm Mia.", x, 380, eo(seg(t, 8.05, 8.95)), a, mm[0] - 12, mm[1], seg(t, 7.95, 8.4), { lx: x + w - 10, ly: 404, bend: -20, seed: 11 });
  }
  // Youssef: "Hello! I... I Youssef." — written as he says it
  if (t > 9.85) {
    ctx.font = NOTE_FONT;
    const full = 'Hello! I... I Youssef.', wf = s => ctx.measureText(s).width / ctx.measureText(full).width;
    const rev = monotone([[9.95, 0], [10.55, wf('Hello!')], [11.35, wf('Hello!')], [11.8, wf('Hello! I...')], [12.45, wf('Hello! I...')], [12.85, wf('Hello! I... I')], [12.9, wf('Hello! I... I')], [13.45, 1]]);
    const fw = ctx.measureText(full).width, x = lerp(ym[0] + 70 - fw, 830, kz), y = lerp(250, 190, kz);
    const a = ss(seg(t, 9.85, 10.05));
    const w = note('you1', full, x, y, rev(t), a, ym[0] + 24, ym[1] + 2, seg(t, 9.9, 10.3), { lx: lerp(x + fw - 30, x + 30, kz), ly: y + 30, bend: lerp(-12, 25, kz), seed: 12 });
    // the diary's red pen: the missing word
    const cp = seg(t, 15.75, 16.15);
    if (cp > 0 && w) {
      ctx.save(); ctx.font = NOTE_FONT; const cx = x + ctx.measureText('Hello! I... I').width + ctx.measureText(' ').width * .5;
      withSeed(31, () => drawS(ctx, mk([[cx - 12, y + 26], [cx, y + 6], [cx + 12, y + 26]], 5, '#cf4a2c', { prof: 'even', nb: 0, a: .95 }), eo(seg(t, 15.75, 15.95))));
      const wa = eo(seg(t, 15.92, 16.25));
      ctx.font = '700 54px Caveat'; const aw = ctx.measureText('am').width;
      ctx.beginPath(); ctx.rect(cx - aw / 2 - 6, y - 140, (aw + 12) * wa, 90); ctx.clip();
      ctx.fillStyle = 'rgba(207,74,44,.95)'; ctx.textAlign = 'center'; ctx.shadowColor = rgba(PAPER, .95); ctx.shadowBlur = 12; ctx.fillText('am', cx, y - 62); ctx.shadowBlur = 0; ctx.fillText('am', cx, y - 62);
      ctx.restore();
      if (wa > 0) TEXTS_NOW.push({ id: 'am', text: 'am', x0: cx - aw / 2, y0: y - 110, x1: cx + aw / 2, y1: y - 50 });
    }
  }
  // Mia: "Sorry?"
  if (t > 14.45) {
    ctx.font = NOTE_FONT; const sw = ctx.measureText('Sorry?').width;
    const x = Math.min(mm[0] - 70 - sw, 1560), y = lerp(380, 560, kz);
    const ax = Math.min(mm[0] - 12, 1915), ay = mm[1];
    note('mia2', 'Sorry?', x, y, eo(seg(t, 14.55, 15.25)), ss(seg(t, 14.45, 14.65)), ax, ay, seg(t, 14.5, 14.9), { lx: lerp(x + sw - 10, x + sw - 10, kz), ly: y + 24, bend: lerp(-20, -30, kz), seed: 13 });
  }
}
const LAST = {};

// ---------- Arabic diary subtitle + journal header ----------
function drawSubs(t) {
  for (const [a, b, txt] of TL.subs) {
    const f = ss(seg(t, a - .1, a + .15)) * (1 - ss(seg(t, b - .15, b + .05))); if (f <= 0) continue;
    ctx.save(); ctx.globalAlpha = f; ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.font = '700 56px Amiri'; const w = ctx.measureText(txt).width;
    liftPatch(960 - w / 2 - 20, 975, 960 + w / 2 + 20, 1045, .75, 21);
    ctx.shadowColor = rgba(PAPER, 1); ctx.shadowBlur = 18; ctx.fillStyle = rgba(INK, .9);
    ctx.fillText(txt, 960, 1030); ctx.shadowBlur = 0; ctx.fillText(txt, 960, 1030);
    ctx.restore();
  }
}
function drawHeader(t) {
  const f = ss(seg(t, .8, 1.3)) * (1 - ss(seg(t, 6.6, 7.2))); if (f <= 0) return;
  ctx.save(); ctx.globalAlpha = f; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.font = '400 19px "IBM Plex Mono"'; ctx.letterSpacing = '6px'; ctx.fillStyle = rgba(INK, .72); ctx.fillText('DAY 01', 96, 92); ctx.letterSpacing = '0px';
  ctx.font = 'italic 600 76px "Cormorant Garamond"'; const w = ctx.measureText('London').width;
  ctx.save(); ctx.beginPath(); ctx.rect(80, 90, (w + 30) * eio(seg(t, 1.0, 2.0)), 100); ctx.clip();
  ctx.shadowColor = rgba(PAPER, .9); ctx.shadowBlur = 12; ctx.fillStyle = INK; ctx.fillText('London', 92, 166); ctx.restore();
  withSeed(41, () => drawS(ctx, mk(qcurve(96, 186, 96 + w, 183, 3, 10), 7, '#6f97b7', { prof: 'even', nb: 3, a: .8 }), eo(seg(t, 1.6, 2.3))));
  ctx.restore();
  TEXTS_NOW.push({ id: 'hdr', text: 'DAY 01 London', x0: 92, y0: 70, x1: 92 + w, y1: 190 });
}

// ---------- the sheet ----------
let GRAIN;
function wavyClipRight(F, seed = 0) { ctx.beginPath(); ctx.moveTo(-20, -20); for (let y = -20; y <= 1100; y += 30) ctx.lineTo(F + (vnoise(y * .012 + seed) - .5) * 220, y); ctx.lineTo(-20, 1100); ctx.closePath(); ctx.clip(); }
function skyClip(c) {
  ctx.beginPath(); ctx.moveTo(-10, -10); ctx.lineTo(1930, -10);
  for (let sx = 1930; sx >= -10; sx -= 5) { const wx = c.cx + (sx - 960) / c.z; ctx.lineTo(sx, 540 + (skyY(wx) + 6 - c.cy) * c.z); }
  ctx.closePath(); ctx.clip();
}
function objProgress(o, t, c) { const X = 960 + (o.x0 - c.cx) * c.z; return clamp((FRONT(t) - X) / 560); }
function drawObjs(list, t, c) {
  for (const o of list) {
    const X0 = 960 + (o.spr.x0 - c.cx) * c.z, X1 = 960 + (o.spr.x1 - c.cx) * c.z; if (X1 < -20 || X0 > 1940) continue;
    const p = objProgress(o, t, c); if (p <= 0) continue;
    if (p >= 1) drawSpr(ctx, o.spr); else { drawList(ctx, o.S, p); if (o.extra) o.extra(ctx, seg(p, .85, 1)); }
  }
}
function drawBus(t, c) {
  const fx = 3700 - 1250 * (t - 1.1); if (t < 1.1 || t > 4.2) return;
  setCam(c); ctx.save(); ctx.translate(fx, 960); ctx.scale(1.22, 1.22);
  PAPER_PAT.setTransform(ctx.getTransform().invertSelf());
  ctx.beginPath(); polyPath(ctx, BUS.body); ctx.fillStyle = PAPER_PAT; ctx.fill();
  drawSpr(ctx, BUS.spr);
  // dry-brush speed trails behind it
  withSeed(55, () => { for (let i = 0; i < 4; i++) { const yy = -420 + i * 100 + rnd(-10, 10); drawS(ctx, mk(qcurve(BUS.L + 10, yy, BUS.L + 210 + rnd(0, 120), yy + rnd(-4, 4), 2, 8), rnd(8, 14), '#c4392a', { prof: 'tip', nb: 3, a: .25 })); } });
  ctx.restore();
}
function drawMist(t, c) {
  const m = eio(seg(t, 16.15, 17)); if (m <= 0) return;
  const [hx, hy] = W2S(c, YX(t) + 10, GY - 250);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  for (const [grow, a] of [[160, .45], [70, .7], [0, 1]]) {
    const rx = lerp(1600, 940, m) + grow, ry = lerp(1150, 640, m) + grow * .7;
    ctx.save(); ctx.beginPath(); ctx.rect(-20, -20, 1960, 1120);
    for (let i = 0; i <= 64; i++) { const an = i / 64 * Math.PI * 2, r = 1 + (vnoise(i * .45 + grow) - .5) * .16 + Math.sin(an * 3 + t) * .02; const x = hx + Math.cos(an) * rx * r, y = hy + Math.sin(an) * ry * r; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.closePath(); ctx.clip('evenodd'); ctx.globalAlpha = a * m; ctx.drawImage(PAPER_IMG, 0, 0); ctx.restore();
  }
  ctx.restore();
}

function render(t) {
  TEXTS_NOW.length = 0;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.shadowBlur = 0;
  ctx.drawImage(PAPER_IMG, 0, 0);
  const c = cam(t), F = FRONT(t);
  // sky + far city, painted only above the rooftops
  ctx.save(); if (F < 2000) wavyClipRight(F, 3); skyClip(c);
  ctx.globalAlpha = 1 - .5 * ss(seg(c.z, 1.1, 1.6)); ctx.drawImage(SKY, 0, -20 - (c.cy - 482) * .15); ctx.globalAlpha = 1;
  setCam(c, FAR.par); ctx.drawImage(FAR.cv, FAR.x0, FAR.y0, FAR.x1 - FAR.x0, FAR.y1 - FAR.y0);
  ctx.restore();
  // ground strip
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); if (F < 2000) wavyClipRight(F, 7); setCam(c); ctx.drawImage(STRIP.cv, STRIP.x0, STRIP.y0, STRIP.x1 - STRIP.x0, STRIP.y1 - STRIP.y0); ctx.restore();
  // buildings
  setCam(c); drawObjs(OBJ, t, c);
  // Mia paints herself into the doorway
  if (t > 7.25) { setCam(c); const G = figure({ kind: 'm' }, miaPose(t), 5000); LAST.mm = figPt(MIA_X, MIA_Y, -1, MIA_S, ...G.mouth); drawCharacter(ctx, MIA_X, MIA_Y, -1, MIA_S, G, eio(seg(t, 7.3, 8.15))); }
  // Youssef
  { setCam(c); const G = figure({ kind: 'y' }, youssefPose(t), 3000); LAST.ym = figPt(YX(t), GY, 1, 1, ...G.mouth); drawCharacter(ctx, YX(t), GY, 1, 1, G, ss(seg(t, .15, 1.2))); }
  setCam(c); drawObjs(FRONT_OBJ, t, c);
  drawBus(t, c);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  drawMist(t, c);
  drawHeader(t); drawNotes(t, c); drawSubs(t);
  // pigment sits in the paper: the sheet's tooth over everything
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = .6; ctx.drawImage(GRAIN, 0, 0);
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
}
window.render = render;
window.TEXTS = t => { render(t); return TEXTS_NOW.slice(); };

(async () => {
  PAPER_IMG = new Image(); PAPER_IMG.src = 'paper.jpg'; await PAPER_IMG.decode();
  await Promise.all(['600 68px Caveat', '700 54px Caveat', 'italic 600 76px "Cormorant Garamond"', '600 40px "Cormorant Garamond"', '400 19px "IBM Plex Mono"', '700 56px Amiri'].map(f => document.fonts.load(f, 'Aa أول يوم')));
  PAPER_PAT = ctx.createPattern(PAPER_IMG, 'no-repeat');
  // grain: the paper's own tooth as a mid-grey relief map
  { const g = document.createElement('canvas'); g.width = 1920; g.height = 1080; const gc = g.getContext('2d'); gc.drawImage(PAPER_IMG, 0, 0);
    const id = gc.getImageData(0, 0, 1920, 1080), d = id.data; let mean = 0; for (let i = 0; i < d.length; i += 4) mean += d[i + 1]; mean /= d.length / 4;
    for (let i = 0; i < d.length; i += 4) { const v = clamp(128 + (d[i + 1] - mean) * 3.2, 0, 255); d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
    gc.putImageData(id, 0, 0); GRAIN = g; }
  buildTracks(); buildWorld(); buildBus();
  window.READY = true;
})();
