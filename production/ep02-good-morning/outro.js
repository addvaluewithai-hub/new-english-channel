// Episode 2 — title card, page wipe, "your turn" (Mia asks the viewer, 3-2-1 countdown), the site nudge (a phone card of the
// companion website whose exercise plays by itself), next-episode teaser (the form) and end card.
import { P, rgba, mix, dark, light, rr, ell, grain } from './kit.js';
import { clamp, lerp, seg, ss, eo, ei, eio, back, hash } from '/core/lib.js';
import { TL, SEC, BEAT, NARR, LINE, nwT, has } from './tl.js';
import { drawWorld, toScreen, GROUND } from './world.js';
import { drawForm } from './bean.js';
import { charState, drawActor, head, camAt, dofOf, speedLines } from './story.js';
import { fold, F, ARM, CUP, CLAP, POINT, PULL } from './act.js';
import { bubble, lineBubble, wordStates, micIcon, check, sparkle, commentIcon, alarmClock, timeTag, SPEAKER, bigMark, squiggle, cross } from './ui.js';
import { cue } from './cues.js';

const AR = '"Baloo Bhaijaan 2"';
let O = null;

export function buildOutro() {
  const tu = SEC('turn'), nx = SEC('next'), op = SEC('open'), st = SEC('run');
  const bT = BEAT('title', op.t1 - 3), p0 = BEAT('pause_start', tu.t0 + 7), p1 = BEAT('pause_end', p0 + 4.5), bEnd = BEAT('end_card', nx.t1 - 4);
  const n16 = NARR('ar14'), n17 = NARR('ar15'), n18 = NARR('ar16'), L = LINE('turn');
  O = { tu, nx, bT, tTitleOut: st.t0 - .42, p0, p1, bEnd, L, n18 };
  // ---------------- your turn: Mia faces the camera ----------------
  const tDor = nwT('ar14', has('دورك'), .05), tRud = nwT('ar14', has('رد'), .6), tBravo = nwT('ar15', has('برافو'), .4), tWrite = nwT('ar15', has('واكتب'), .7);
  const tWhat = L ? (L.tok.find(o => /^How/i.test(o.w)) || L.tok[0]).t0 : p0 - 2;
  O.tBravo = tBravo; O.tWrite = tWrite;
  const mT = { id: 'mia', base: { turn: 0, face: F('happy', { happy: .45 }), armL: ARM.rest, armR: ARM.rest, alpha: 1, kmul: 1 },
    moves: [{ t0: tu.t0 - 1, t1: tu.t0 - .9, x0: 1530, x1: 1530, k0: .9, k1: .9 }], keys: [], jumps: [], blinks: [] };
  const K = mT.keys;
  K.push({ t: tDor - .3, armL: { dx: .12, dy: .06, bend: .1, w: 0 }, d: .15 }, { t: tDor - .1, armL: ARM.wave, face: F('joy'), d: .2 },
    { t: tDor + 1.0, armL: ARM.rest, face: F('happy', { happy: .5 }), d: .3 },
    { t: tRud - .15, armR: { dx: .2, dy: -.02, bend: -.05, w: 0 }, face: F('happy', { happy: .4, bLy: .6, bRy: .6 }), d: .25 }, { t: n16 ? n16.t1 + .2 : tRud + 1, armR: ARM.rest, d: .3 });
  if (L) K.push({ t: L.t0 - .3, face: F('happy', { happy: .35 }), d: .2 }, { t: tWhat - .1, lean: .025, armR: { dx: .2, dy: .0, bend: .05, w: 0 }, face: F('happy', { bLy: .9, bRy: .9, happy: .2 }), d: .3 });
  K.push({ t: p0 - .1, lean: .035, armR: CUP, face: F('happy', { bLy: 1, bRy: 1, happy: .25, mo: .02, lx: .25, ly: -.05 }), d: .35 },
    { t: p1 - .05, lean: 0, armR: CLAP, armL: CLAP, face: F('joy'), d: .2 }, { t: p1 + 1.2, armR: ARM.rest, armL: ARM.rest, face: F('happy', { happy: .6 }), d: .3 },
    { t: tBravo - .2, armL: CLAP, armR: CLAP, face: F('joy'), d: .18 }, { t: tBravo + .9, armL: ARM.rest, armR: ARM.rest, face: F('happy', { happy: .55 }), d: .3 },
    { t: tWrite - .1, armR: { dx: .2, dy: -.05, bend: -.05, w: 0 }, d: .25 }, { t: tWrite + 1.4, armR: ARM.rest, d: .3 });
  const third = (p1 - p0) / 3;
  for (let i = 0; i < 3; i++) mT.jumps.push({ t: p0 + i * third + .05, h: .015, d: .3 });
  mT.jumps.push({ t: p1, h: .07, d: .4 }, { t: tBravo, h: .06, d: .38 });
  mT.blinks.push(p0 - .1, p1 - .05);
  O.mT = mT;
  O.camT = [
    { t: tu.t0 - 1, x: 1661, y: 700, z: 2.45 },
    { t: L ? L.t0 : tu.t0 + 3, d: 2.5, x: 1655, y: 696, z: 2.6 },
    { t: p1, d: .5, x: 1650, y: 694, z: 2.66 },
  ];
  O.countdown = [0, 1, 2].map(i => p0 + i * third);
  // ---------------- site: "solve the episode's exercises on the website" — a phone card whose exercise plays itself ----------------
  const si = SEC('site'), bSite = BEAT('site_card', si.t1 > 0 ? si.t0 : nx.t0 - 8), NS = 'ar17';
  const tEnter = nwT(NS, has('ادخل'), .35), tSolve = nwT(NS, has('وحل'), .45), tFive = nwT(NS, has('خمس'), .68), tLink = nwT(NS, has('اللينك'), .88);
  const sOut = nx.t0 - .4;   // the card leaves before the teaser
  O.bSite = bSite; O.tEnter = tEnter; O.tSolve = tSolve; O.tFive = tFive; O.tLink = tLink; O.sOut = sOut;
  // the mini exercise, mirrored from the site's "fix Youssef's mistake" item for this episode
  O.EX = { n: 1, context: 'Good morning, Youssef!', wrong: 'Good night, Mia!', span: 'Good night', answer: 'Good morning', chips: ['Good bye', 'Good morning', 'Good night'], right: 1 };
  // Mia steps back into the doorway as the card comes, and peeks out to clap at the stars
  mT.moves.push({ t0: bSite + .05, t1: bSite + .62, x0: 1530, x1: 1534, y0: GROUND, y1: 805, k0: .9, k1: .62, step: .28 },
    { t0: tFive - .1, t1: tFive + .4, x0: 1534, x1: 1486, y0: 805, y1: 822, k0: .62, k1: .66, step: .5 });
  K.push({ t: bSite - .05, turn: 1.0, armL: ARM.rest, armR: ARM.rest, face: F('happy', { happy: .4 }), d: .3 }, { t: bSite + .25, turn: 2.05, d: .35 },
    { t: bSite + .15, clip: 1 }, { t: bSite + .22, alpha: 0, d: .4 },
    { t: tFive - .3, turn: .15, face: F('happy', { happy: .45, lx: .4 }), d: .01 }, { t: tFive - .12, alpha: 1, d: .15 },
    { t: tFive + .4, armL: CLAP, armR: CLAP, face: F('joy'), d: .2 }, { t: tFive + 1.7, armL: ARM.rest, armR: ARM.rest, face: F('happy', { happy: .5, lx: .4 }), d: .3 });
  mT.jumps.push({ t: tFive + .45, h: .03, d: .3 }, { t: tFive + .8, h: .03, d: .3 });
  // Youssef comes out of the door, stands beside the card and presents it
  const yS = { id: 'youssef', base: { turn: .2, face: F('happy', { happy: .4, lx: .3, lid: .1 }), armL: ARM.rest, armR: ARM.rest, alpha: 0, clip: 1, kmul: 1 },
    moves: [{ t0: bSite + .35, t1: bSite + 1.4, x0: 1530, x1: 1640, y0: 800, y1: GROUND, k0: .6, k1: .85, step: .35 }], keys: [], jumps: [], blinks: [] };
  yS.keys.push({ t: bSite + .35, alpha: 1, d: .25 }, { t: bSite + .85, clip: null }, { t: bSite + 1.0, turn: .3, face: F('happy', { happy: .45, lx: .55 }), d: .5 },
    { t: tEnter - .15, armR: POINT, lean: .03, face: F('happy', { happy: .4, lx: .45, bLy: .65, bRy: .65 }), d: .25 },
    { t: tSolve + .3, face: F('joy', { lx: .55 }), d: .2 },
    { t: tFive + .2, armR: ARM.up, armL: ARM.up, lean: 0, face: F('joy', { lx: .3 }), d: .25 },
    { t: tLink - .2, turn: 0, armL: ARM.rest, armR: { dx: .18, dy: .2, bend: -.05, w: 0 }, face: F('happy', { happy: .45, lx: .35, ly: .35 }), d: .25 },
    { t: sOut + .1, armR: ARM.rest, face: F('happy', { happy: .45 }), d: .3 });
  yS.jumps.push({ t: tSolve + .3, h: .04, d: .34 }, { t: tFive + .25, h: .07, d: .4 });
  yS.blinks.push(bSite + 1.0, tEnter - .15, tLink - .2);
  O.yS = yS;
  // ---------------- next: the form, numbers, "How old are you?", "I have 26 years." (wrong) → end card ----------------
  const tFormN = nwT('ar16', has('الاستمارة'), .15), tNums = nwT('ar16', has('أرقام'), .3), tQ = nwT('ar16', has('وسؤال'), .4);
  const how = n18 ? n18.tok.find(o => /^How old/i.test(o.w)) : null, said = n18 ? n18.tok.find(o => /^I have/i.test(o.w)) : null;
  const tWrong = nwT('ar16', has('غلط'), .97);
  O.tFormN = tFormN; O.tNums = tNums; O.how = how; O.said = said; O.tWrong = tWrong;
  const yN = { id: 'youssef', base: { turn: .2, face: F('puzzled', { lx: -.3, ly: .5 }), armL: { dx: .12, dy: -.14, bend: -.25, w: 0 }, armR: ARM.rest, alpha: 1, kmul: 1 },
    moves: [{ t0: 0, t1: .1, x0: 1330, x1: 1330, k0: .9, k1: .9 }], keys: [], jumps: [], blinks: [],
    talkExtra: said ? [[said.t0, said.t1]] : [] };   // he mouths the diary voice's "I have 26 years." (TL.mouth_nar)
  yN.keys.push({ t: tNums - .1, armR: ARM.scratch, face: F('puzzled', { lx: -.4, ly: .3, sweat: .4 }), lean: -.02, d: .3 },
    { t: how ? how.t0 - .2 : tQ, face: F('worried', { lx: .6, ly: -.1, sweat: .7 }), turn: .35, d: .3 },
    { t: said ? said.t0 - .3 : tQ + 2, face: F('happy', { happy: .35, lx: .6, mw: .12, bLy: .8, bRy: .8, sweat: .5 }), armR: ARM.chest, lean: 0, turn: .4, d: .3 },
    { t: tWrong - .15, face: F('embarrassed', { lx: 0, ly: .2 }), armR: ARM.scratch, turn: .2, d: .25 });
  yN.jumps.push({ t: said ? said.t0 - .2 : tQ + 2, h: .04, d: .34 }); yN.blinks.push(tNums - .1, how ? how.t0 - .2 : tQ, tWrong - .15);
  O.yN = yN;
  O.camN = [{ t: nx.t0 - 1, x: 1280, y: 690, z: 2.1 }, { t: nx.t0, d: Math.max(1, bEnd - nx.t0), x: 1300, y: 686, z: 2.3 }];
  // ---------------- cues ----------------
  cue(bT, 'sting', { note: 'title card' });
  cue(bT + .1, 'pop'); cue(bT + .45, 'pop'); cue(bT + .8, 'pop');
  cue(O.tTitleOut, 'whoosh', { note: 'title out' });
  cue(tu.t0 - .1, 'page_turn', { note: 'paper → street' });
  cue(tDor, 'pop');
  if (L) cue(L.t0 - .18, 'bubble', { who: 'mia', text: L.text });
  if (how) cue(how.t0 - .2, 'bubble', { who: 'mia', text: 'How are you?' });
  cue(p0 - .35, 'pop', { note: "I'm ______. card" });
  cue(p0, 'mic_on');
  O.countdown.forEach((x, i) => cue(x, 'countdown_tick', { n: 3 - i }));
  cue(p1, 'ding', { note: 'time up' });
  cue(p1 + .05, 'confetti');
  cue(tBravo, 'cheer');
  cue(tWrite, 'pop', { note: 'comment icon' });
  cue(bSite, 'whoosh', { note: 'site card in' });
  cue(bSite + .33, 'step', { who: 'mia' }); cue(bSite + .6, 'step', { who: 'mia' });
  for (let i = 1; i <= 3; i++) cue(bSite + .35 + i * .35, 'step', { who: 'youssef' });
  cue(bSite + .8, 'squiggle');
  cue(tSolve, 'tap', { note: 'the hand taps the right chip' });
  cue(tSolve + .3, 'ding', { note: 'the sentence is fixed' });
  cue(tSolve + .35, 'confetti', { note: 'small, inside the card' });
  for (let i = 0; i < 3; i++) cue(tFive + .25 + i * .28, 'sparkle', { note: `star ${i + 1}` });
  cue(tLink, 'pop', { note: 'link-in-the-description arrow' });
  cue(sOut, 'whoosh', { note: 'site card out' });
  cue(nx.t0, 'whoosh', { note: 'teaser' });
  cue(tFormN, 'paper', { note: 'the form card' });
  for (let i = 0; i < 6; i++) cue(tNums + i * .18, 'pop', { note: 'a number floats up' });
  cue(tQ + .1, 'pop', { note: '? over the Age box' });
  if (how) cue(how.t0 - .2, 'bubble', { who: 'mia', text: 'How old are you?' });
  if (said) cue(said.t0 - .2, 'bubble', { who: 'youssef', text: 'I have 26 years.' });
  cue(tWrong, 'squiggle'); cue(tWrong + .35, 'error_buzz');
  cue(bEnd, 'sting_end', { note: 'end card' });
  cue(bEnd + 1.3, 'pop', { note: 'subscribe button' });
  cue(bEnd + 2.1, 'click'); cue(bEnd + 2.2, 'bell');
  cue(bEnd + 1.55, 'pop', { note: 'exercises pill' });
  return O;
}

// ---------------- title card (over the walking street) ----------------
export function titleCard(c, t) {
  const t0 = O.bT, t1 = O.tTitleOut;
  if (t < t0 || t > t1 + .4) return;
  const out = eio(seg(t, t1, t1 + .38));
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
  // soft cream veil behind the card so it reads over the skyline
  c.save(); c.translate(960, 320); c.scale(1, .5);
  const v = c.createRadialGradient(0, 0, 60, 0, 0, 720); v.addColorStop(0, rgba(P.cream, .7 * (1 - out) * seg(t, t0, t0 + .3))); v.addColorStop(1, rgba(P.cream, 0));
  c.fillStyle = v; c.fillRect(-960, -720, 1920, 1440); c.restore();
  c.translate(960, 330); const so = 1 + .12 * out; c.scale(so, so); c.globalAlpha = 1 - out;
  // episode pill
  const k1 = back(seg(t, t0 + .35, t0 + .7), 2.2);
  if (k1 > 0) {
    c.save(); c.translate(0, -175); c.scale(k1, k1); c.direction = 'rtl'; c.font = `700 48px ${AR}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    const w = c.measureText('الحلقة 2').width + 64; rr(c, -w / 2, -36, w, 72, 36); c.fillStyle = P.red; c.fill();
    c.fillStyle = P.cream; c.fillText('الحلقة 2', 0, 5); c.restore();
  }
  // يوسف في لندن — word by word (RTL: right word first)
  c.direction = 'rtl'; c.font = `800 168px ${AR}`; c.textAlign = 'center'; c.textBaseline = 'middle';
  const words = ['يوسف', 'في', 'لندن'], gap = 40, ws = words.map(w => c.measureText(w).width), W = ws.reduce((a, b) => a + b, 0) + gap * 2;
  let xr = W / 2;
  words.forEach((w, i) => {
    const k = back(seg(t, t0 + .05 + i * .14, t0 + .45 + i * .14), 2.4), cx = xr - ws[i] / 2; xr -= ws[i] + gap;
    if (k <= 0) return;
    c.save(); c.translate(cx, -10 + (1 - k) * 40); c.scale(k, k);
    c.lineJoin = 'round'; c.lineWidth = 22; c.strokeStyle = P.cream; c.strokeText(w, 0, 8);
    c.fillStyle = rgba('#1E1B33', .18); c.fillText(w, 6, 16);
    c.fillStyle = i === 2 ? P.red : P.navy; c.fillText(w, 0, 8);
    c.restore();
  });
  // Good Morning? — letters drop in (the ? wobbles)
  const fd = 'Good Morning?'; c.direction = 'ltr'; c.font = '400 104px "Lilita One"'; c.textAlign = 'left'; c.letterSpacing = '3px';
  const fw = c.measureText(fd).width; let x = -fw / 2;
  [...fd].forEach((ch, i) => {
    const k = back(seg(t, t0 + .55 + i * .045, t0 + .85 + i * .045), 2.6), w = c.measureText(ch).width + 3;
    if (k > 0 && ch !== ' ') {
      const q = ch === '?', wob = q ? Math.sin((t - t0 - 1.2) * 7) * .22 * Math.exp(-Math.max(0, t - t0 - 1.2) * .8) : 0;
      c.save(); c.translate(x + w / 2, 165 - (1 - k) * 60); c.rotate((1 - k) * .3 * (i % 2 ? 1 : -1) + wob); c.textAlign = 'center';
      c.lineWidth = 16; c.lineJoin = 'round'; c.strokeStyle = P.navy; c.strokeText(ch, 0, 0); c.fillStyle = q ? P.red : P.mustard; c.fillText(ch, 0, 0); c.restore();
    }
    x += w;
  });
  c.letterSpacing = '0px';
  for (let i = 0; i < 6; i++) { const k = seg(t, t0 + .5 + i * .1, t0 + 1.1 + i * .1); if (k > 0 && k < 1) { const a = i * 1.1 + .4; sparkle(c, Math.cos(a) * (420 + 120 * k), Math.sin(a) * (170 + 60 * k), 22 * Math.sin(Math.PI * k), i % 2 ? P.mustard : P.cream, a); } }
  c.restore();
}

// ---------------- page wipe: the new page slides over from the right (Arabic page turn), soft curl shadow ----------------
export function wipe(c, p, drawOld, drawNew) {
  if (p <= 0) return drawOld();
  if (p >= 1) return drawNew();
  drawOld();
  const e = eio(p), x = lerp(1990, -70, e);
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
  const g = c.createLinearGradient(x - 90, 0, x, 0); g.addColorStop(0, 'rgba(42,39,66,0)'); g.addColorStop(1, 'rgba(42,39,66,.28)');
  c.fillStyle = g; c.fillRect(x - 90, 0, 90, 1080);
  c.beginPath(); c.rect(x, 0, 1920 - x + 2, 1080); c.clip();
  drawNew();
  c.setTransform(1, 0, 0, 1, 0, 0);
  const h = c.createLinearGradient(x, 0, x + 70, 0); h.addColorStop(0, 'rgba(255,251,240,.75)'); h.addColorStop(.35, 'rgba(255,251,240,.2)'); h.addColorStop(1, 'rgba(42,39,66,.07)');
  c.fillStyle = h; c.fillRect(x, 0, 70, 1080);
  c.restore();
}

// ---------------- your turn ----------------
export function sceneTurn(c, t) {
  const cam = camAt(O.camT, t);
  drawWorld(c, cam, t, { door: 1, dof: dofOf(cam.z), clock: 9.0 });
  const st = drawActor(c, cam, O.mT, t, { door: 1 });
  const h = head(st, 'mia', 1.12);
  if (O.L && h) lineBubble(c, O.L, t, { x: h[0] + 40, y: h[1], side: 0, lift: 60, maxW: 1100 }, { until: O.p0 - .3 });
  card(c, t);
  return { cam };
}
function card(c, t, out = 0) {   // out: 0..1 exit (the site card takes its place)
  const t0 = O.p0 - .35, p = seg(t, t0, t0 + .45);
  if (p <= 0 || out >= 1) return;
  const k = back(p, 1.9) * (1 - .12 * out), cx = 1400, cy = 430;
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.translate(cx, cy); c.scale(k, k); c.globalAlpha = clamp(p * 3) * (1 - out);
  rr(c, -380, -210 + 12, 760, 420, 46); c.fillStyle = rgba('#2A2742', .16); c.fill();
  rr(c, -380, -210, 760, 420, 46); c.fillStyle = '#FFFDF8'; c.fill();
  // mic badge (pulses while waiting)
  const wait = t >= O.p0 && t < O.p1;
  ell(c, -270, -95, 62, 62); c.fillStyle = wait ? P.red : P.navy; c.fill();
  micIcon(c, -270, -86, .95, P.cream, wait ? (t - O.p0) * 1.3 : 0);
  // countdown ring + digit
  const prog = seg(t, O.p0, O.p1);
  ell(c, 270, -95, 64, 64); c.fillStyle = rgba(P.ink, .07); c.fill();
  if (prog > 0) { c.beginPath(); c.arc(270, -95, 56, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * prog); c.strokeStyle = P.mustard; c.lineWidth = 14; c.lineCap = 'round'; c.stroke(); }
  if (wait) {
    const i = Math.min(2, Math.floor(prog * 3)), u = prog * 3 - i, s = back(seg(u, 0, .25), 2.4) * (1 - .25 * seg(u, .8, 1));
    c.save(); c.translate(270, -88); c.scale(s, s); c.font = '400 88px "Lilita One"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = P.ink; c.fillText(String(3 - i), 0, 4); c.restore();
  } else if (t >= O.p1) check(c, 270, -95, 52, seg(t, O.p1, O.p1 + .5));
  else { c.font = '400 70px "Lilita One"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = rgba(P.ink, .35); c.fillText('3', 270, -88); }
  // I'm ______.
  c.font = '600 112px "Fredoka"'; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillStyle = P.ink;
  const iw = c.measureText("I'm").width, slot = 330, dw = c.measureText('.').width, W = iw + 24 + slot + dw, x0 = -W / 2, by = 110;
  c.fillText("I'm", x0, by);
  const sx = x0 + iw + 24;
  if (wait) { const pul = .5 + .5 * Math.sin((t - O.p0) * 6); rr(c, sx - 8, by - 92, slot + 16, 112, 22); c.fillStyle = rgba(P.mustard, .14 + .12 * pul); c.fill(); }
  c.strokeStyle = P.mustard; c.lineWidth = 10; c.lineCap = 'round'; c.setLineDash([26, 18]); c.lineDashOffset = -t * 40;
  c.beginPath(); c.moveTo(sx, by + 8); c.lineTo(sx + slot, by + 8); c.stroke(); c.setLineDash([]);
  c.fillText('.', sx + slot + 4, by);
  // hint under the slot (small, quiet): the three real answers
  c.font = '500 34px "Fredoka"'; c.textAlign = 'center'; c.fillStyle = rgba(P.ink, .45); c.fillText('good  ·  OK  ·  tired', sx + slot / 2, by + 62);
  // praise: sparkles out of the slot
  if (t > O.p1) for (let i = 0; i < 10; i++) {
    const u = seg(t, O.p1 + .05 + (i % 3) * .05, O.p1 + 1.2 + (i % 3) * .05); if (u <= 0 || u >= 1) continue;
    const a = hash(i * 3.7) * Math.PI * 2, r = 80 + 260 * eo(u);
    sparkle(c, sx + slot / 2 + Math.cos(a) * r, by - 40 + Math.sin(a) * r * .6 - 80 * u, 22 * (1 - u), [P.mustard, P.red, P.teal, P.leaf][i % 4], a + u * 4);
  }
  c.restore();
  // confetti across the frame
  confetti(c, t, O.p1 + .05);
  // comment nudge
  const ck = seg(t, O.tWrite - .05, O.tWrite + .35);
  if (ck > 0) { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1 - out; const s = back(ck, 2.2); c.translate(cx + 300, cy + 240); c.scale(s, s); commentIcon(c, 0, 0, 1.1, P.navy); c.restore(); }
}
function confetti(c, t, t0) {
  const u = t - t0; if (u < 0 || u > 2.6) return;
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
  const cols = [P.mustard, P.red, P.teal, P.leaf, P.navy, P.sky];
  for (let i = 0; i < 70; i++) {
    const h1 = hash(i * 1.37), h2 = hash(i * 2.91), h3 = hash(i * 5.17);
    const x = 1400 + (h1 - .5) * 900 + (h2 - .5) * 240 * u, y = 380 - (600 + 300 * h2) * u + 900 * u * u * (.6 + .4 * h3);
    if (y > 1100) continue;
    c.save(); c.translate(x, y); c.rotate(u * (3 + 6 * h3) + h1 * 6); c.globalAlpha = 1 - seg(u, 1.9, 2.6);
    c.fillStyle = cols[i % cols.length]; rr(c, -9, -5, 18, 10 * Math.abs(Math.cos(u * 8 + i)), 3); c.fill(); c.restore();
  }
  c.restore();
}

// ---------------- site: the companion website's exercise as a phone-shaped card that plays by itself ----------------
// The street and the camera stay as at the end of "your turn". Mia steps back into the doorway, Youssef comes out and presents the
// card; the exercise is keyed to the narration words (tap on "وحل", stars on "خمس", the arrow on "اللينك").
const SITE = { cx: 1430, cy: 440, w: 480, h: 680 };
export function sceneSite(c, t) {
  const cam = camAt(O.camT, t);
  drawWorld(c, cam, t, { door: 1, dof: dofOf(cam.z), clock: 9.0 });
  drawActor(c, cam, O.mT, t, { door: 1 });
  drawActor(c, cam, O.yS, t, { door: 1 });
  if (t < O.bSite + .35) card(c, t, seg(t, O.bSite, O.bSite + .3));   // the "I'm ______." card leaves
  siteCard(c, t);
  linkArrow(c, t);
  return { cam };
}
// a drawn pointing hand (finger tip at x,y)
function handCursor(c, x, y, s = 1, a = 1) {
  if (a <= 0) return;
  c.save(); c.globalAlpha = a; c.translate(x, y); c.scale(s, s); c.rotate(-.35); c.translate(0, 50);
  c.fillStyle = '#FFFDF8'; c.strokeStyle = P.ink; c.lineWidth = 5; c.lineJoin = 'round';
  c.beginPath(); c.roundRect(-14, -50, 28, 70, 14); c.roundRect(-40, 0, 80, 64, 22); c.fill(); c.stroke();
  c.restore();
}
function star(c, x, y, r, fill, stroke) {
  c.save(); c.translate(x, y); c.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * .46 : r; c.lineTo(Math.cos(a) * q, Math.sin(a) * q); }
  c.closePath(); c.lineJoin = 'round';
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = 3; c.stroke(); }
  c.restore();
}
function siteCard(c, t) {
  const { bSite, sOut, tSolve, tFive, EX } = O;
  const pin = seg(t, bSite, bSite + .6), pout = seg(t, sOut, sOut + .4);
  if (pin <= 0 || pout >= 1) return;
  const dy = (1 - back(pin, 1.25)) * 1000 + ei(pout) * 1000, { cx, cy, w, h } = SITE;
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.translate(cx - w / 2, cy - h / 2 + dy);
  // the phone: the site's cream, ruled paper, with a soft drop shadow
  rr(c, 0, 14, w, h, 46); c.fillStyle = rgba('#2A2742', .18); c.fill();
  rr(c, 0, 0, w, h, 46); c.fillStyle = P.cream; c.fill();
  c.save(); rr(c, 0, 0, w, h, 46); c.clip();
  c.fillStyle = rgba('#6F62A8', .09); for (let y = 108; y < h; y += 40) c.fillRect(0, y, w, 1.5);
  // the site's top bar + progress dots (LTR, like the site)
  c.fillStyle = rgba(P.ink, .12); c.fillRect(0, 66, w, 2);
  c.direction = 'rtl'; c.font = `800 28px ${AR}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = P.navy; c.fillText('يوسف في لندن · تمارين', w / 2, 36);
  for (let i = 0; i < 12; i++) {
    const x = w / 2 - 88 + i * 16, cur = i === EX.n - 1, r = cur ? 7 : 5;
    ell(c, x, 90, r, r); c.fillStyle = i < EX.n - 1 ? P.leaf : cur ? P.mustard : '#FFFDF8'; c.fill();
    if (i >= EX.n) { c.strokeStyle = rgba(P.ink, .3); c.lineWidth = 2; c.stroke(); }
  }
  // layout of the exercise card: the chips wrap like the site's, the stars row sits under them
  const X0 = 22, X1 = w - 22, CW = X1 - X0, GAP = 10;
  c.font = '600 24px "Fredoka"'; c.direction = 'ltr';
  const chipW = EX.chips.map(s => c.measureText(s).width + 38), rows = [[]]; let rw = 0;
  chipW.forEach((cw, i) => { const r = rows[rows.length - 1]; if (r.length && rw + GAP + cw > CW - 28) { rows.push([i]); rw = cw; } else { r.push(i); rw += (r.length > 1 ? GAP : 0) + cw; } });
  const chipsY = 395, starsY = chipsY + rows.length * 52 + (rows.length - 1) * GAP + 64, cardH = starsY + 44 - 116;
  rr(c, X0, 116 + 6, CW, cardH, 24); c.fillStyle = rgba('#6F62A8', .16); c.fill();
  rr(c, X0, 116, CW, cardH, 24); c.fillStyle = '#FFFDF8'; c.fill();
  // kind row: number badge + "fix Youssef's mistake"
  ell(c, X1 - 32, 160, 20, 20); c.fillStyle = P.mustard; c.fill();
  c.font = '400 22px "Lilita One"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = P.ink; c.fillText(String(EX.n), X1 - 32, 162);
  c.direction = 'rtl'; c.font = `800 26px ${AR}`; c.textAlign = 'right'; c.fillStyle = P.navy; c.fillText('صلّح غلطة يوسف', X1 - 64, 162);
  // context (what Mia said), prompt
  rr(c, X0 + 18, 190, CW - 36, 48, 14); c.fillStyle = '#DDEFF8'; c.fill();
  c.font = `700 20px ${AR}`; c.fillStyle = P.ink; const who = 'ميا:', ww = c.measureText(who).width; c.fillText(who, X1 - 32, 216);
  c.direction = 'ltr'; c.font = '500 22px "Fredoka"'; c.textAlign = 'right'; c.fillText(EX.context, X1 - 32 - ww - 8, 216);
  c.direction = 'rtl'; c.font = `800 23px ${AR}`; c.textAlign = 'right'; c.fillStyle = P.ink; c.fillText('يوسف غلط… الكلمة الصح إيه؟', X1 - 18, 274);
  // the sentence: the wrong span with the squiggle, then the answer on a mustard swash + ✓
  const fixed = t >= tSolve + .3, fk = seg(t, tSolve + .3, tSolve + .55), si = EX.wrong.indexOf(EX.span);
  const pre = EX.wrong.slice(0, si), span = fixed ? EX.answer : EX.span, post = EX.wrong.slice(si + EX.span.length);
  c.direction = 'ltr'; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  let fs = 48; c.font = `600 ${fs}px "Fredoka"`; const full = c.measureText(pre + span + post).width;
  if (full > CW - 44) { fs = Math.floor(fs * (CW - 44) / full); c.font = `600 ${fs}px "Fredoka"`; }
  const wPre = c.measureText(pre).width, wSpan = c.measureText(span).width, wAll = c.measureText(pre + span + post).width, sx0 = w / 2 - wAll / 2, by = 352;
  if (fixed) { rr(c, sx0 + wPre - 6, by - fs * .78, (wSpan + 12) * eo(fk), fs * .98, 10); c.fillStyle = rgba(P.mustard, .5); c.fill(); }
  c.fillStyle = P.ink; c.fillText(pre + span + post, sx0, by);
  if (!fixed) squiggle(c, sx0 + wPre, sx0 + wPre + wSpan, by + 14, seg(t, bSite + .8, bSite + 1.25), 5, P.red, 4);
  else check(c, sx0 + wAll + 32, by - 14, 16, seg(t, tSolve + .3, tSolve + .75));
  // the chips (the right one goes leaf when tapped)
  const press = seg(t, tSolve, tSolve + .1) * (1 - seg(t, tSolve + .12, tSolve + .3)); let hit = null;
  rows.forEach((r, ri) => {
    const rowW = r.reduce((a, i, k) => a + chipW[i] + (k ? GAP : 0), 0); let x = w / 2 - rowW / 2; const y = chipsY + ri * (52 + GAP) + 26;
    for (const i of r) {
      const cw = chipW[i], on = i === EX.right && t >= tSolve, pr = i === EX.right ? press : 0, cxx = x + cw / 2;
      c.save(); c.translate(cxx, y); c.scale(1 - .06 * pr, 1 - .06 * pr);
      rr(c, -cw / 2, -26 + 3, cw, 52, 26); c.fillStyle = on ? P.leaf : rgba(P.ink, .12); c.fill();
      rr(c, -cw / 2, -26, cw, 52, 26); c.fillStyle = on ? '#DCEFD8' : '#FFFDF8'; c.fill(); c.strokeStyle = on ? P.leaf : rgba(P.ink, .12); c.lineWidth = 2; c.stroke();
      c.font = '600 24px "Fredoka"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = P.ink; c.fillText(EX.chips[i], 0, 1);
      c.restore();
      if (i === EX.right) hit = [cxx, y];
      x += cw + GAP;
    }
  });
  // the stars row fills one by one (with a sparkle each)
  for (let i = 0; i < 3; i++) {
    const x = w / 2 + (i - 1) * 68, k = seg(t, tFive + .25 + i * .28, tFive + .55 + i * .28);
    star(c, x, starsY, 22, null, rgba(P.ink, .3));
    if (k > 0) { c.save(); c.translate(x, starsY); const s = back(k, 2.6); c.scale(s, s); star(c, 0, 0, 22, P.mustard, null); c.restore(); }
    if (k > 0 && k < 1) for (let j = 0; j < 5; j++) { const a = j * 1.26 + i; sparkle(c, x + Math.cos(a) * (30 + 26 * k), starsY + Math.sin(a) * (30 + 26 * k), 7 * Math.sin(Math.PI * k), j % 2 ? P.mustard : P.red, a); }
  }
  // a little confetti out of the sentence when it is fixed
  const u = t - (tSolve + .35);
  if (u > 0 && u < 1.6) { const cols = [P.mustard, P.red, P.teal, P.leaf, P.navy];
    for (let i = 0; i < 26; i++) { const h1 = hash(i * 1.37 + 9), h2 = hash(i * 2.91 + 9), h3 = hash(i * 5.17 + 9);
      const x = w / 2 + (h1 - .5) * 120 + (h1 - .5) * 420 * u, y = by - 30 - (260 + 160 * h2) * u + 520 * u * u * (.6 + .4 * h3);
      c.save(); c.translate(x, y); c.rotate(u * (3 + 6 * h3) + h1 * 6); c.globalAlpha = 1 - seg(u, 1.1, 1.6); c.fillStyle = cols[i % cols.length]; rr(c, -6, -3.5, 12, 7 * Math.abs(Math.cos(u * 8 + i)), 2); c.fill(); c.restore(); } }
  c.restore();   // phone clip
  // the hand comes up from below the card, taps the right chip and leaves
  if (hit) {
    const hk = seg(t, tSolve - .8, tSolve - .05), lv = seg(t, tSolve + .35, tSolve + .9);
    if (hk > 0 && lv < 1) handCursor(c, lerp(w + 80, hit[0] + 4, eio(hk)) + lv * 90, lerp(h + 120, hit[1] + 6, eio(hk)) + press * 6 + lv * 260, .85, 1 - seg(lv, .5, 1));
  }
  c.restore();
}
// "the link is in the description": a mustard pill with a drawn down-arrow, bouncing under the card (never over the plate)
function linkArrow(c, t) {
  const k = back(seg(t, O.tLink - .05, O.tLink + .35), 2.2), out = seg(t, O.sOut + .1, O.sOut + .4);
  if (k <= 0 || out >= 1) return;
  const u = t - O.tLink, bounce = Math.abs(Math.sin(u * 5.5)) * 16 * Math.exp(-Math.max(0, u - 2.5) * .5);
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.translate(SITE.cx + 40, 868 - bounce); c.scale(k, k); c.globalAlpha = 1 - out;
  c.direction = 'rtl'; c.font = `800 40px ${AR}`; c.textAlign = 'right'; c.textBaseline = 'middle';
  const label = 'اللينك في الوصف', bw = c.measureText(label).width + 60 + 76;
  rr(c, -bw / 2, -36 + 7, bw, 72, 36); c.fillStyle = rgba('#2A2742', .2); c.fill();
  rr(c, -bw / 2, -36, bw, 72, 36); c.fillStyle = P.mustard; c.fill();
  c.fillStyle = P.ink; c.fillText(label, bw / 2 - 30, 5);
  c.save(); c.translate(-bw / 2 + 46, 2 + bounce * .25); c.fillStyle = P.navy;
  c.beginPath(); c.moveTo(-8, -24); c.lineTo(8, -24); c.lineTo(8, 0); c.lineTo(22, 0); c.lineTo(0, 24); c.lineTo(-22, 0); c.lineTo(-8, 0); c.closePath(); c.fill();
  c.restore(); c.restore();
}

// ---------------- next episode teaser: the form in his hands, numbers floating, "How old are you?" ----------------
export function sceneNext(c, t) {
  const cam = camAt(O.camN, t);
  drawWorld(c, cam, t, { door: 1, dof: dofOf(cam.z), clock: 9.0 });
  const R = drawActor(c, cam, O.yN, t, { door: 1 });
  const h = head(R, 'youssef');
  // the form card (a big copy of the sheet) on the left, with the ? over the Age box and floating numbers
  const fk = back(seg(t, O.tFormN - .1, O.tFormN + .35), 2), q = seg(t, O.tNums + .9, O.tNums + 1.25);
  if (fk > 0) {
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.translate(470, 520); c.scale(fk, fk); c.rotate(-.05 + Math.sin(t * .8) * .012);
    drawForm(c, 0, 0, 600, 440, { rot: 0, text: true, age: q });
    bigMark(c, 150, 30, '?', 150, q, .1 + Math.sin((t - O.tNums) * 5) * .1, P.mustard);
    c.restore();
  }
  const nums = ['1', '2', '3', '7', '26', '10', '5', '18'];
  nums.forEach((n, i) => {
    const t0 = O.tNums + i * .18, u = seg(t, t0, t0 + 2.6 + (i % 3) * .4); if (u <= 0 || u >= 1) return;
    const a = hash(i * 2.3) * Math.PI * 2, x = 470 + Math.cos(a) * (320 + 60 * hash(i)) + Math.sin(u * 5 + i) * 18, y = 520 + Math.sin(a) * 200 - u * 260;
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = Math.sin(Math.PI * u); c.translate(x, y); c.rotate(Math.sin(u * 4 + i) * .2); c.scale(.7 + .5 * eo(Math.min(1, u * 3)), .7 + .5 * eo(Math.min(1, u * 3)));
    c.font = '700 72px "Fredoka"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = rgba('#1E1B33', .2); c.fillText(n, 4, 5); c.fillStyle = [P.teal, P.red, P.navy, P.mustard][i % 4]; c.fillText(n, 0, 0); c.restore();
  });
  // Mia (off screen right) asks "How old are you?"; he answers "I have 26 years." and the squiggle says no
  if (O.how && h) {
    const hw = O.how, words = ['How', 'old', 'are', 'you?'], n = words.length;
    const tok = words.map((w, i) => ({ w, t0: hw.t0 + (hw.t1 - hw.t0) * i / n, t1: hw.t0 + (hw.t1 - hw.t0) * (i + 1) / n }));
    const pop = seg(t, hw.t0 - .2, hw.t0 + .1), out = seg(t, (O.said ? O.said.t0 : O.bEnd) - .45, (O.said ? O.said.t0 : O.bEnd) - .25);
    bubble(c, { x: 1905, y: 430, who: 'mia', words: wordStates(tok, t), side: -1, lift: 90, pop, out });
  }
  if (O.said && h) {
    const sw = O.said, words = ['I', 'have', '26', 'years.'], n = words.length;
    const tok = words.map((w, i) => ({ w, t0: sw.t0 + (sw.t1 - sw.t0) * i / n, t1: sw.t0 + (sw.t1 - sw.t0) * (i + 1) / n }));
    const pop = seg(t, sw.t0 - .2, sw.t0 + .1), out = seg(t, O.bEnd - .5, O.bEnd - .3);
    const box = bubble(c, { x: h[0] + 20, y: h[1], who: 'youssef', words: wordStates(tok, t), side: -1, lift: 70, pop, out });
    if (box && t > O.tWrong) {
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1 - out;
      squiggle(c, box.x + 50, box.x + box.w - 50, box.y + box.h - 30, seg(t, O.tWrong, O.tWrong + .4), 6, P.red, 6);
      cross(c, box.x + box.w - 10, box.y + 10, 28, seg(t, O.tWrong + .35, O.tWrong + .7));
      c.restore();
    }
  }
  return { cam };
}

// ---------------- end card ----------------
export function endCard(c, t) {
  const t0 = O.bEnd, u = t - t0;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.fillStyle = '#FBF1E1'; c.fillRect(0, 0, 1920, 1080);
  c.fillStyle = mix('#FBF1E1', P.mustard, .16); c.fillRect(0, 900, 1920, 180);
  // الحلقة الجاية
  const k1 = back(seg(u, .05, .45), 2.2);
  c.save(); c.translate(960, 190); c.scale(k1, k1); c.direction = 'rtl'; c.font = `800 92px ${AR}`; c.textAlign = 'center'; c.textBaseline = 'middle';
  const w = c.measureText('الحلقة الجاية').width + 90; rr(c, -w / 2, -66, w, 132, 66); c.fillStyle = P.navy; c.fill();
  c.fillStyle = P.cream; c.fillText('الحلقة الجاية', 0, 10); c.restore();
  // How old are you?
  const k2 = back(seg(u, .3, .75), 2.2);
  c.save(); c.translate(960, 470); c.scale(k2, k2); c.font = '600 150px "Fredoka"'; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  const hw = c.measureText('How old are you').width, qw = c.measureText('?').width;
  rr(c, -(hw + qw) / 2 - 10, 18, (hw + qw + 20) * eo(seg(u, .7, 1.1)), 22, 11); c.fillStyle = P.mustard; c.fill();
  c.fillStyle = P.ink; c.textAlign = 'left'; c.fillText('How old are you', -(hw + qw) / 2, 0);
  const qa = Math.sin(u * 7) * .25 * Math.exp(-Math.max(0, u - .7) * .6) + .12;
  c.save(); c.translate((hw + qw) / 2 - qw / 2, -60); c.rotate(qa); c.fillStyle = P.red; c.textAlign = 'center'; c.fillText('?', 0, 60); c.restore();
  c.restore();
  // nervous Youssef peeking in from the left
  const yk = { id: 'youssef', base: { turn: .45, face: F('nervous', { sweat: 1, lx: .6, ly: -.2, mt: .7 }), armL: ARM.rest, armR: { dx: .15, dy: -.05, bend: .1, w: 0 }, alpha: 1, kmul: 1 },
    moves: [{ t0: t0 + .4, t1: t0 + 1.0, x0: -200, x1: 300, y0: 980, y1: 980, k0: 1.05, k1: 1.05, step: .3 }], keys: [], jumps: [], blinks: [] };
  drawActor(c, { x: 960, y: 540, z: 1 }, yk, t);
  // subscribe nudge (no platform logo): a red pill with a bell, tapped by a drawn hand
  const k3 = back(seg(u, 1.2, 1.6), 2), tap = seg(u, 2.0, 2.15) * (1 - seg(u, 2.25, 2.45)), on = u > 2.1;
  if (k3 > 0) {
    c.save(); c.translate(1320, 780); c.scale(k3 * (1 - .06 * tap), k3 * (1 - .06 * tap));
    c.direction = 'rtl'; c.font = `800 60px ${AR}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    const label = 'اشترك', bw = c.measureText(label).width + 170;   // "subscribe" (the tap rings the bell; the label never says subscribed)
    rr(c, -bw / 2, -50 + 8, bw, 100, 50); c.fillStyle = rgba('#2A2742', .2); c.fill();
    rr(c, -bw / 2, -50, bw, 100, 50); c.fillStyle = P.red; c.fill();
    c.fillStyle = P.cream; c.fillText(label, 30, 6);
    // bell
    const ring = on ? Math.sin((u - 2.1) * 30) * .35 * Math.exp(-(u - 2.1) * 2.5) : 0;
    c.save(); c.translate(-bw / 2 + 58, 0); c.rotate(ring); c.fillStyle = P.mustard;
    c.beginPath(); c.moveTo(-22, 16); c.quadraticCurveTo(-20, -24, 0, -26); c.quadraticCurveTo(20, -24, 22, 16); c.closePath(); c.fill();
    rr(c, -27, 12, 54, 9, 4); c.fill(); ell(c, 0, 26, 7, 7); c.fill(); c.restore();
    c.restore();
    // the hand cursor
    const hk = seg(u, 1.5, 2.0), lv = eio(seg(u, 2.5, 3.0)), hx = lerp(1250, 1205, eio(hk)) + lv * 60, hy = lerp(1060, 835, eio(hk)) + tap * 8 + lv * 160;
    if (hk > 0 && u < 3.0) {
      c.save(); c.globalAlpha = 1 - seg(u, 2.6, 3.0); c.translate(hx, hy); c.rotate(-.35);
      c.fillStyle = '#FFFDF8'; c.strokeStyle = P.ink; c.lineWidth = 5; c.lineJoin = 'round';
      c.beginPath(); c.roundRect(-14, -50, 28, 70, 14); c.roundRect(-40, 0, 80, 64, 22); c.fill(); c.stroke();
      c.restore();
    }
  }
  // "solve the exercises" (the companion site): a teal pill with a pencil, left of the subscribe pill
  const k4 = back(seg(u, 1.45, 1.85), 2);
  if (k4 > 0) {
    c.save(); c.translate(900, 780); c.scale(k4, k4);
    c.direction = 'rtl'; c.font = `800 60px ${AR}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    const label = 'حل التمارين', bw = c.measureText(label).width + 170;
    rr(c, -bw / 2, -50 + 8, bw, 100, 50); c.fillStyle = rgba('#2A2742', .2); c.fill();
    rr(c, -bw / 2, -50, bw, 100, 50); c.fillStyle = P.teal; c.fill();
    c.fillStyle = P.cream; c.fillText(label, 30, 6);
    // pencil
    c.save(); c.translate(-bw / 2 + 58, 2); c.rotate(.78);
    c.fillStyle = P.mustard; rr(c, -9, -30, 18, 44, 3); c.fill();
    c.fillStyle = P.cream; c.fillRect(-9, -30, 18, 8);
    c.fillStyle = P.red; rr(c, -9, -36, 18, 8, 3); c.fill();
    c.fillStyle = '#F3DDB8'; c.beginPath(); c.moveTo(-9, 14); c.lineTo(9, 14); c.lineTo(0, 30); c.closePath(); c.fill();
    c.fillStyle = P.ink; c.beginPath(); c.moveTo(-3.5, 24); c.lineTo(3.5, 24); c.lineTo(0, 30); c.closePath(); c.fill();
    c.restore();
    c.restore();
  }
}
export { O };
