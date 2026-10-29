// Episode 1 — "اللي اتعلمته النهارده": the recap. Living Letters kinetic type, restyled into Bean People:
// cream paper, ink Fredoka words that are typeset as they are spoken (rise, land with a squash), a speaker rail + name tab
// under each line, a mustard highlighter on the spoken word, a red spell-check squiggle under mistakes, and two small
// presenter beans (Youssef right, Mia left). Every beat is keyed to recap items, lines and narration words in timeline.json.
import { P, rgba, mix, dark, light, rr, ell, grain } from './kit.js';
import { clamp, lerp, seg, ss, eo, eio, back } from '/core/lib.js';
import { TL, SEC, NARR, LINE, RECAP, nwT, has } from './tl.js';
import { charState, drawActor } from './story.js';
import { fold, F, ARM, CUP, CLAP } from './act.js';
import { SPEAKER, RUST, nameTab, squiggle, check, cross, repeatCue, sparkle } from './ui.js';
import { cue } from './cues.js';

const PAPER = '#FBF1E1', RULE = rgba(P.ink, .045), GROUND_Y = 900;
const FONT = s => `600 ${s}px "Fredoka"`;
const AR = '"Baloo Bhaijaan 2"';
const CAM = { x: 960, y: 540, z: 1 };
let R = null;
let MC = null;
const mw = (w, s) => { if (!MC) MC = document.createElement('canvas').getContext('2d'); MC.font = FONT(s); return MC.measureText(w).width; };

export function buildRecap() {
  const rc = SEC('recap');
  const it = id => RECAP(id) || { t0: rc.t0, t1: rc.t0 };
  const L = id => LINE(id);
  R = { rc, items: ['hi', 'am', 'im', 'name', 'too', 'sorry', 'bye'].map(id => ({ id, ...it(id) })) };
  R.title0 = rc.t0 + .55; R.title1 = it('hi').t0 - .35;
  R.tIY = nwT('ar10', w => /^I\s*Youssef/i.test(w), .3); R.tAna = (() => { const n = NARR('ar10'); const i = n ? n.tok.findIndex((o, k) => o.w.startsWith('أنا') && n.tok[k + 1] && n.tok[k + 1].w.startsWith('يوسف')) : -1; return i >= 0 ? n.tok[i].t0 : (n ? n.t0 + (n.t1 - n.t0) * .55 : R.tIY + 2); })();
  R.tAm = nwT('ar10', w => /^am\b/i.test(w), .97);
  R.tIm = nwT('ar11', w => /^I'?m$/i.test(w), .35); R.tOne = nwT('ar11', has('واحدة'), .9);
  R.tNice = nwT('ar13', w => /^Nice/i.test(w), .25); R.tMe = nwT('ar13', w => /^Me too/i.test(w), .7); R.tQul = (() => { const n = NARR('ar13'); return n ? n.tok[n.tok.length - 1].t0 : R.tMe + 1; })();
  R.tEar = NARR('ar14') ? NARR('ar14').t0 : it('sorry').t0;
  // repeat gaps: after a model line, until the next speech (narration or line) or the end of the recap
  const recapLines = TL.lines.filter(l => l.scene === 'recap');
  const speech = [...TL.narration.map(n => n.t0), ...TL.lines.map(l => l.t0)].sort((a, b) => a - b);
  R.gaps = [];
  // (only where the voice hands over to the learner: the next speech is narration, or the recap ends — not a Q → A pair)
  for (const l of recapLines) {
    const nx = Math.min(speech.find(s => s > l.t1 + .05) ?? rc.t1, rc.t1);
    const nextIsLine = TL.lines.some(m => Math.abs(m.t0 - nx) < .01);
    if (nx - l.t1 >= .8 && !nextIsLine) R.gaps.push({ t0: l.t1 + .18, t1: nx - .12, line: l });
  }
  R.tAsk = nwT('ar12', has('اسمك'), .6);
  // presenter Youssef mouths his narration clips (the diary voice's viseme track) and his own model lines; Mia hers
  const narrSpans = TL.narration.filter(n => n.t0 >= rc.t0 - .1 && n.t1 <= rc.t1 + .1).map(n => [n.t0, n.t1]);   // → TL.mouth_nar in these ranges
  // ---- presenters: two big beans that act (Youssef right facing left: his near arm is armR; Mia left facing right: armL) ----
  const hiT = it('hi').t0, sorryT = it('sorry').t0;
  const YK = 1.6, MK_ = 1.5, YX = 1690, MX = 285;
  R.YX = YX; R.MX = MX;
  const yRest = F('happy', { lx: -.5, happy: .35 }), mRest = F('happy', { lx: .5, happy: .35 });
  const yR = { id: 'youssef', talkExtra: narrSpans, base: { turn: -.3, face: yRest, armL: ARM.rest, armR: ARM.rest, alpha: 1, kmul: 1, sq: 1, lean: 0 },
    moves: [{ t0: rc.t0 + .2, t1: rc.t0 + 1.2, x0: 2250, x1: YX, y0: GROUND_Y, y1: GROUND_Y, k0: YK, k1: YK, step: .45 }], keys: [], jumps: [], blinks: [] };
  const mR = { id: 'mia', base: { turn: .3, face: mRest, armL: ARM.rest, armR: ARM.rest, alpha: 1, kmul: 1, sq: 1, lean: 0 },
    moves: [{ t0: hiT - 1.0, t1: hiT - .1, x0: -320, x1: MX, y0: GROUND_Y, y1: GROUND_Y, k0: MK_, k1: MK_, step: .45 }], keys: [], jumps: [], blinks: [] };
  const K = yR.keys, MK = mR.keys;
  const OPEN = { dx: .2, dy: -.03, bend: .05, w: 0 };                 // open hand toward the viewer / the board
  const FACEPALM = { dx: -.4, dy: -.31, bend: .25, w: 0 };            // armR across onto the face
  const nod = (keys, x) => keys.push({ t: x, sq: .95, d: .1 }, { t: x + .13, sq: 1, d: .12 }, { t: x + .28, sq: .955, d: .1 }, { t: x + .41, sq: 1, d: .14 });
  // hello wave on arrival
  K.push({ t: rc.t0 + 1.25, armR: { dx: .12, dy: .05, bend: .1, w: 0 }, d: .15 }, { t: rc.t0 + 1.4, armR: ARM.wave, d: .2 }, { t: rc.t0 + 2.6, armR: ARM.rest, d: .3 });
  // every model line: the speaker turns to us with an open hand and talks (lip sync from talk); the other looks over and nods
  for (const l of recapLines) {
    const ys = l.who === 'youssef', [SK, LK] = ys ? [K, MK] : [MK, K];
    SK.push({ t: l.t0 - .3, turn: ys ? -.1 : .1, face: F('happy', { lx: 0, ly: 0, happy: .45, bLy: .6, bRy: .6 }), [ys ? 'armL' : 'armR']: OPEN, d: .25 },
      { t: l.t1 + .35, turn: ys ? -.3 : .3, face: ys ? yRest : mRest, [ys ? 'armL' : 'armR']: ARM.rest, d: .3 });
    LK.push({ t: l.t0 - .15, face: F('happy', { lx: ys ? .75 : -.75, ly: -.05, happy: .55 }), d: .25 }, { t: l.t1 + .5, face: ys ? mRest : yRest, d: .3 });
    nod(LK, l.t1 - .05);
  }
  // waves on the greetings / goodbyes
  const r01 = L('r01'), r02 = L('r02'), r09 = L('r09'), r10 = L('r10');
  if (r01) MK.push({ t: r01.t0 - .3, armL: ARM.wave, d: .2 }, { t: r01.t1 + .6, armL: ARM.rest, d: .3 });
  if (r02) K.push({ t: r02.t0 - .3, armR: ARM.wave, d: .2 }, { t: r02.t1 + .6, armR: ARM.rest, d: .3 });
  if (r09) MK.push({ t: r09.t0 - .3, armL: ARM.wave, face: F('joy'), d: .2 }, { t: r09.t1 + 1.4, armL: ARM.rest, face: mRest, d: .3 });
  if (r10) K.push({ t: r10.t0 - .3, armR: ARM.wave, face: F('joy'), d: .2 }, { t: r10.t1 + .9, armR: ARM.rest, face: F('happy', { lx: -.2, happy: .5 }), d: .3 });
  // the mistakes: facepalm on the squiggle, sheepish scratch while it is explained, proud nod (hand on chest) on the fix
  const mistake = (tSq, tFix) => {
    K.push({ t: tSq - .05, armR: FACEPALM, face: F('embarrassed', { eye: .12, lx: 0, ly: .3 }), lean: -.025, d: .2 },
      { t: tSq + 1.3, armR: ARM.scratch, face: F('embarrassed', { lx: -.5, ly: .2 }), lean: -.015, d: .3 },
      { t: tFix - .1, armR: ARM.chest, face: F('joy', { bLy: .9, bRy: .9 }), lean: 0, turn: -.15, d: .25 },
      { t: tFix + 1.5, armR: ARM.rest, face: yRest, turn: -.3, d: .35 });
    nod(K, tFix + .15);
    MK.push({ t: tSq + .1, armL: CUP, face: F('happy', { lx: .7, happy: .8, mw: .09, mo: 0 }), d: .25 },
      { t: tSq + 1.4, armL: ARM.rest, face: F('happy', { lx: .6, bLy: .7, bRy: .7, happy: .3 }), d: .3 },
      { t: tFix, armL: CLAP, armR: CLAP, face: F('joy'), d: .18 }, { t: tFix + .9, armL: ARM.rest, armR: ARM.rest, face: mRest, d: .3 });
    yR.blinks.push(tSq - .05, tSq + 1.3, tFix - .1); mR.blinks.push(tSq + .1, tFix);
  };
  mistake(R.tIY + .5, R.tAm + .55);
  mistake(R.tMe + .4, R.tQul + .5);
  // I am → I'm: a small proud nod; Mia cups an ear for "Sorry?"
  K.push({ t: R.tIm + .45, face: F('joy', { lx: -.5 }), d: .2 }, { t: R.tIm + 1.4, face: yRest, d: .3 }); nod(K, R.tIm + .5);
  const r08 = L('r08');
  MK.push({ t: R.tEar - .1, armL: CUP, lean: .03, face: F('puzzled', { lx: .4 }), d: .3 }, { t: (r08 ? r08.t0 : sorryT + 3) - .35, armL: ARM.rest, lean: 0, d: .3 });
  // repeat gaps: Youssef turns to us with an open hand ("your turn"), Mia smiles at us
  for (const g of R.gaps) {
    K.push({ t: g.t0, turn: -.08, face: F('happy', { lx: 0, ly: 0, happy: .55 }), armL: OPEN, d: .3 }, { t: g.t1 - .1, turn: -.3, armL: ARM.rest, face: yRest, d: .3 });
    MK.push({ t: g.t0 + .1, face: F('happy', { lx: 0, ly: 0, happy: .6 }), d: .3 }, { t: g.t1 - .1, face: mRest, d: .3 });
  }
  K.sort((p, q) => p.t - q.t); MK.sort((p, q) => p.t - q.t);
  R.yR = yR; R.mR = mR;
  // ---- cues ----
  cue(R.title0, 'pop', { note: 'recap title' });
  cue(rc.t0 + .3, 'step', { who: 'youssef' }); cue(hiT - .6, 'step', { who: 'mia' });
  for (const l of recapLines) cue(l.t0 - .05, 'type', { note: 'line typesets: ' + l.text });
  cue(R.tIY, 'type'); cue(R.tIY + .5, 'squiggle'); cue(R.tIY + .9, 'error_buzz');
  cue(R.tAm - .15, 'caret'); cue(R.tAm + .3, 'type'); cue(R.tAm + .6, 'ding');
  cue(R.tIm + .05, 'squeeze'); cue(R.tIm + .4, 'pop', { note: "apostrophe lands: I'm" });
  cue(R.tNice, 'type'); cue(R.tMe, 'type'); cue(R.tMe + .4, 'squiggle'); cue(R.tMe + .75, 'error_buzz');
  cue(R.tQul, 'whoosh', { note: 'Me too → Nice to meet you too.' }); cue(R.tQul + .5, 'ding');
  for (const g of R.gaps) cue(g.t0, 'repeat', { dur: g.t1 - g.t0, note: 'learner repeats' });
  return R;
}

// ---- type rows ----
// items: [{w, t (typeset time), s0, s1 (spoken span), alpha?, dx?, sx?, mark?, col?, wob?}], laid out centred on x (baseline y)
function layoutRow(items, size) {
  const sp = mw(' ', size) * 1.05;
  let x = 0; const out = items.map(o => { const w = (o.width ?? mw(o.w, size)) * (o.sx ?? 1); const r = { ...o, x, ww: w }; x += w + sp * (o.gap ?? 1); return r; });
  const W = x - sp; out.forEach(o => o.x -= W / 2); return { out, W };
}
// opts: ghost (time the card appears, upcoming words at 25 % ink), mean (Arabic meaning under the line), meanHi (0..1 accent)
function drawRow(c, t, items, { x, y, size, who, alpha = 1, rail = true, ghost = null, mean = null, meanHi = 0 }) {
  if (alpha <= 0) return null;
  const { out, W } = layoutRow(items, size);
  const S = SPEAKER[who], col = who === 'mia' ? RUST : P.navy;
  const g = ghost != null ? seg(t, ghost, ghost + .3) : 0;
  c.save(); c.globalAlpha = alpha; c.font = FONT(size); c.textBaseline = 'alphabetic'; c.textAlign = 'left';
  const shown = out.filter(o => t >= o.t && (o.alpha ?? 1) > .05);
  const ry = y + size * .26;
  if (rail && (shown.length || g > 0)) {
    const vis = shown.length ? shown : out, lx = x + Math.min(...out.map(o => o.x)) - 12, rx0 = x + Math.max(...out.map(o => o.x + o.ww)) + 12;
    const k = shown.length ? eo(seg(t, shown[0].t, shown[0].t + .35)) : 0;
    if (g > 0) { rr(c, lx, ry, rx0 - lx, 9, 4.5); c.fillStyle = rgba(col, .18 * g); c.fill(); }
    if (k > 0) { const rx = x + Math.max(...vis.map(o => o.x + o.ww)) + 12; rr(c, lx, ry, (rx - lx) * k, 9, 4.5); c.fillStyle = rgba(col, .85); c.fill(); }
    const ta = Math.max(k, .45 * g);
    if (ta > 0) { c.globalAlpha = alpha * ta; tabAt(c, S, lx, ry); c.globalAlpha = alpha; }
  }
  // Arabic meaning, muted, under the line
  if (mean) {
    const ma = Math.max(g, shown.length ? 1 : 0);
    if (ma > 0) {
      c.save(); c.globalAlpha = alpha * ma; c.direction = 'rtl'; c.font = `700 50px ${AR}`; c.textAlign = 'center'; c.textBaseline = 'middle';
      const mwid = c.measureText(mean).width;
      if (meanHi > 0) { rr(c, x - mwid / 2 - 22, ry + 30, mwid + 44, 60, 30); c.fillStyle = rgba(P.mustard, .35 * meanHi); c.fill(); }
      c.fillStyle = rgba(P.ink, .58 + .3 * meanHi); c.fillText(mean, x, ry + 62); c.restore();
    }
  }
  for (const o of out) {
    const live = t >= o.t;
    if (!live && !(g > 0 && !o.typed && (o.alpha ?? 1) > .05)) continue;
    if (!live) {   // upcoming: ghost word in place
      c.save(); c.globalAlpha = alpha * .22 * g * (o.alpha ?? 1); c.fillStyle = P.ink; c.textAlign = 'center';
      c.translate(x + o.x + o.ww / 2 + (o.dx || 0), y); c.scale(o.sx ?? 1, 1);
      if (o.wob) c.fillText(o.w, 0, 0); else c.fillText(o.w, 0, 0);
      c.restore(); continue;
    }
    const p = o.typed ? 1 : seg(t, o.t, o.t + .3), q = o.typed ? 1 : t - o.t - .3;
    const sq = q > 0 ? 1 - .16 * Math.exp(-q * 9) * Math.cos(q * 26) : lerp(1.15, 1, p);
    const pop = ghost != null && !o.typed ? (1 + .14 * Math.sin(Math.PI * p)) : 1;   // ghosted words pop in place; others rise from the line
    const wx = x + o.x + o.ww / 2, wy = y + (ghost != null ? 0 : (1 - eo(p)) * 70);
    c.save(); c.globalAlpha = alpha * (ghost != null ? lerp(.22, 1, seg(p, 0, .3)) : seg(p, 0, .35)) * (o.alpha ?? 1); c.translate(wx + (o.dx || 0), wy);
    const cur = o.s0 != null && t >= o.s0 && t < o.s1 + .12;
    if (cur) { const k = eo(seg(t, o.s0, o.s0 + .18)); rr(c, -o.ww / 2 - 10, -size * .64, (o.ww + 20) * k, size * .74, 18); c.fillStyle = rgba(P.mustard, .55); c.fill(); }
    if (o.mark) { rr(c, -o.ww / 2 - 4, size * .1, (o.ww + 8) * o.mark, 10, 5); c.fillStyle = P.mustard; c.fill(); }
    c.scale(pop * (o.sx ?? 1) / Math.sqrt(sq), pop * sq);
    c.fillStyle = o.col || P.ink; c.textAlign = 'center';
    if (o.wob) {   // "Sorry?": the ? wobbles (Living Letters)
      const body = o.w.slice(0, -1), qw = mw('?', size), bw = mw(body, size);
      c.fillText(body, -qw / 2, 0);
      const k = t - o.t - .25, ang = k > 0 ? Math.sin(k * 8) * .3 * Math.exp(-k * .9) + .1 : 0;
      c.save(); c.translate(bw / 2 - qw / 2 + qw / 2, -size * .02); c.rotate(ang); c.fillText('?', 0, 0); c.restore();
    } else c.fillText(o.w, 0, 0);
    c.restore();
  }
  c.restore();
  return { out, W, x, y, size };
}
// speaker tab at the rail's left end; when that would reach the presenter bean, it tucks under the start of the rail
function tabAt(c, S, lx, ry) {
  c.save(); c.font = '400 26px "Lilita One"'; c.letterSpacing = '2px'; const tw = c.measureText(S.name).width + 31; c.restore();
  if (lx - tw - 14 >= 470) nameTab(c, S, lx - tw - 14, ry - 15, 26); else nameTab(c, S, lx, ry + 16, 26);
}
const fromLine = (id, stagger = 0) => { const l = LINE(id); return l ? l.tok.map((o, i) => ({ w: o.w, t: o.t0 - .06 + i * stagger, s0: o.t0, s1: o.t1 })) : []; };
const fit = (items, size, maxW = 920) => { const { W } = layoutRow(items, size); return W > maxW ? size * maxW / W : size; };
const wordX = (row, i) => row.x + row.out[i].x;

// ---- the paper set ----
function paper(c, t) {
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.fillStyle = PAPER; c.fillRect(0, 0, 1920, 1080);
  c.strokeStyle = RULE; c.lineWidth = 2;
  for (let y = 132; y < GROUND_Y; y += 76) { c.beginPath(); c.moveTo(0, y); c.lineTo(1920, y); c.stroke(); }
  c.strokeStyle = rgba(P.red, .22); c.lineWidth = 3; c.beginPath(); c.moveTo(1846, 0); c.lineTo(1846, GROUND_Y); c.stroke();   // right margin (RTL notebook)
  c.fillStyle = mix(PAPER, P.mustard, .16); c.fillRect(0, GROUND_Y, 1920, 1080 - GROUND_Y);
  c.fillStyle = rgba(P.ink, .08); c.fillRect(0, GROUND_Y, 1920, 4);
}

export function sceneRecap(c, t) {
  paper(c, t);
  // presenters
  for (const C of [R.mR, R.yR]) if (t > C.moves[0].t0 - .05) drawActor(c, CAM, C, t);
  // title → header pill
  titleCard(c, t);
  // items
  const I = R.items;
  for (let k = 0; k < I.length; k++) {
    const it = I[k], nx = I[k + 1];
    if (t < it.t0 - .05 || t > it.t1 + .35) continue;
    const carry = it.id === 'am' && nx && nx.id === 'im';            // "I am Youssef." flows straight into the I'm item
    const aIn = it.id === 'im' ? 1 : seg(t, it.t0 - .05, it.t0 + .2);
    const aOut = carry ? 1 : 1 - seg(t, it.t1 - .05, it.t1 + .3);
    if (carry && t >= it.t1) continue;
    const a = aIn * aOut, dy = (1 - aOut) * -40;
    c.save(); c.translate(0, dy);
    ITEM[it.id]?.(c, t, a, it);
    c.restore();
  }
  // repeat cue in the gaps after model lines
  for (const g of R.gaps) {
    const a = Math.min(seg(t, g.t0, g.t0 + .3), 1 - seg(t, g.t1 - .2, g.t1));
    if (a > 0) repeatCue(c, 960, 822, a, t);
  }
}

function titleCard(c, t) {
  const p = seg(t, R.title0, R.title0 + .5), m = eio(seg(t, R.title1, R.title1 + .6));
  if (p <= 0) return;
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
  const txt = 'اللي اتعلمته النهارده';
  c.direction = 'rtl'; c.textBaseline = 'middle'; c.textAlign = 'center';
  // big title, centre
  if (m < 1) {
    const s = back(p, 2) * (1 - m * .5), x = lerp(960, 1500, m), y = lerp(440, 90, m);
    c.globalAlpha = 1 - m;
    c.translate(x, y); c.scale(s, s);
    c.font = `800 120px ${AR}`; const w = c.measureText(txt).width;
    const k = eo(seg(t, R.title0 + .25, R.title0 + .8));
    rr(c, -w / 2 - 10, 34, (w + 20) * k, 26, 13); c.fillStyle = rgba(P.mustard, .8); c.fill();
    c.fillStyle = P.ink; c.fillText(txt, 0, 0);
    // pencil doodle
    c.save(); c.translate(-w / 2 - 90, -10); c.rotate(-.7); c.fillStyle = P.mustard; rr(c, -14, -60, 28, 100, 6); c.fill(); c.fillStyle = '#F2C9A0'; c.beginPath(); c.moveTo(-14, 40); c.lineTo(14, 40); c.lineTo(0, 70); c.fill(); c.fillStyle = P.ink; c.beginPath(); c.moveTo(-5, 60); c.lineTo(5, 60); c.lineTo(0, 70); c.fill(); c.fillStyle = P.red; rr(c, -14, -72, 28, 16, 5); c.fill(); c.restore();
    c.setTransform(1, 0, 0, 1, 0, 0);
  }
  // header pill (top right) once the items begin
  if (m > 0) {
    c.globalAlpha = m; c.font = `700 36px ${AR}`; const w = c.measureText(txt).width + 56;
    rr(c, 1800 - w, 62, w, 60, 30); c.fillStyle = P.navy; c.fill();
    c.fillStyle = P.cream; c.textAlign = 'right'; c.fillText(txt, 1800 - 28, 94);
  }
  c.restore();
}

// a small Arabic gloss pill (navy on a light navy tint)
function gloss(c, txt, x, y, a) {
  c.save(); c.globalAlpha = a; c.direction = 'rtl'; c.font = `800 64px ${AR}`; c.textAlign = 'center'; c.textBaseline = 'middle';
  const w = c.measureText(txt).width + 70, k = back(clamp(a * 1.3), 1.8);
  c.translate(x, y); c.scale(k, k);
  rr(c, -w / 2, -46, w, 92, 46); c.fillStyle = rgba(P.navy, .1); c.fill();
  c.fillStyle = P.navy; c.fillText(txt, 0, 4); c.restore();
}
// ---- items (each card comes in ghosted as soon as its item starts, while the Arabic explains) ----
const CX = 985, Y1 = 385, Y2 = 645, YS = 470;
const ITEM = {
  hi(c, t, a, it) {
    drawRow(c, t, fromLine('r01'), { x: CX, y: Y1, size: 140, who: 'mia', alpha: a, ghost: it.t0, mean: 'أهلًا' });
    drawRow(c, t, fromLine('r02'), { x: CX, y: Y2, size: 140, who: 'youssef', alpha: a, ghost: it.t0, mean: 'أهلًا' });
  },
  am(c, t, a, it) {
    const r03 = LINE('r03'), sp = r03 ? r03.tok : [];
    const ins = eio(seg(t, R.tAm, R.tAm + .35));   // the gap opens for "am"
    const reveal = t < R.tAm + .3 ? 0 : t < R.tAm + .45 ? 1 : 2;
    const items = [
      { w: 'I', t: R.tIY - .05, s0: sp[0]?.t0, s1: sp[0]?.t1 },
      { w: 'am', t: R.tAm + .3, typed: true, sx: ins, alpha: ins, gap: ins, s0: sp[1]?.t0, s1: sp[1]?.t1, mark: eo(seg(t, R.tAm + .5, R.tAm + .9)), col: t < R.tAm + .9 ? P.teal : P.ink, reveal },
      { w: 'Youssef.', t: R.tIY + .05, s0: sp[2]?.t0, s1: sp[2]?.t1 },
    ];
    const size = 150, y = YS;
    // "أنا يوسف" lights up while the narrator says it (Arabic has no verb here)
    const hi = seg(t, R.tAna - .1, R.tAna + .2) * (1 - seg(t, R.tAm - .2, R.tAm + .1));
    const row = drawRow(c, t, items.map(o => o.reveal === 1 ? { ...o, w: 'a', width: mw('am', size), dx: -(mw('am', size) - mw('a', size)) / 2 } : o),
      { x: CX, y, size, who: 'youssef', alpha: a, ghost: it.t0, mean: 'أنا يوسف', meanHi: hi });
    if (!row || t < R.tIY) return;
    c.save(); c.globalAlpha = a;
    const x0 = wordX(row, 0) - 6, x1 = wordX(row, 2) + row.out[2].ww - mw('.', size) + 6;
    // the red squiggle under the mistake, faded out when "am" goes in
    const sqFade = 1 - seg(t, R.tAm + .05, R.tAm + .3);
    if (sqFade > 0) { c.globalAlpha = a * sqFade; squiggle(c, x0, x1, y + 16, seg(t, R.tIY + .5, R.tIY + .95), 7, P.red, 7); c.globalAlpha = a; }
    cross(c, x1 + 70, y - 50, 34, seg(t, R.tIY + .9, R.tIY + 1.25) * (1 - seg(t, R.tAm + .35, R.tAm + .5)));
    check(c, x1 + 70, y - 50, 34, seg(t, R.tAm + .5, R.tAm + .85));
    // the caret, blinking between I and Youssef
    const ca = seg(t, R.tAm - .25, R.tAm - .1) * (1 - seg(t, R.tAm + .8, R.tAm + 1));
    if (ca > 0 && Math.floor((t - R.tAm) * 4) % 2 === 0 || (ca > 0 && t > R.tAm && t < R.tAm + .5)) {
      const typed = reveal === 0 ? 0 : reveal === 1 ? mw('a', size) : mw('am', size);
      const cx = reveal === 0 ? wordX(row, 0) + row.out[0].ww + 16 + row.out[1].ww / 2 : wordX(row, 1) + typed * ins + 10;
      c.fillStyle = P.teal; rr(c, cx - 3, y - size * .78, 7, size * .92, 3); c.fill();
    }
    c.restore();
  },
  im(c, t, a) {
    // "I am" squeezes into "I'm": the space closes, the a flattens away, an apostrophe drops in
    const r04 = LINE('r04'), sp = r04 ? r04.tok : [], r03 = LINE('r03'), s3 = r03 ? r03.tok : [];
    const u = eio(seg(t, R.tIm, R.tIm + .55)), ap = seg(t, R.tIm + .25, R.tIm + .55), size = 150;
    const Iw = mw('I', size), aw = mw('a', size), mW = mw('m', size), apw = mw("'", size), spw = mw(' ', size) * 1.05;
    const groupW = Iw + spw * (1 - u) + aw * (1 - u) + mW + apw * u;
    const youW = mw('Youssef.', size), W = groupW + spw + youW, x0 = CX - W / 2, y = YS;
    c.save(); c.globalAlpha = a;
    // rail, tab and meaning (same layout as drawRow)
    const ry = y + size * .26;
    rr(c, x0 - 12, ry, W + 24, 9, 4.5); c.fillStyle = rgba(P.navy, .85); c.fill();
    c.save(); c.font = '400 26px "Lilita One"'; c.letterSpacing = '2px'; const tw = c.measureText('YOUSSEF').width + 31; c.restore();
    tabAt(c, SPEAKER.youssef, x0 - 12, ry);
    c.save(); c.direction = 'rtl'; c.font = `700 50px ${AR}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = rgba(P.ink, .58); c.fillText('أنا يوسف', CX, ry + 62); c.restore();
    c.font = FONT(size); c.textBaseline = 'alphabetic'; c.textAlign = 'left';
    // "one word" pill behind I'm
    const one = eo(seg(t, R.tOne - .1, R.tOne + .3));
    const cur0 = sp[0] && t >= sp[0].t0 && t < sp[0].t1 + .12, cur1 = sp[1] && t >= sp[1].t0 && t < sp[1].t1 + .12;
    const said0 = (s3[0] && t >= s3[0].t0 && t < s3[0].t1 + .1) || (s3[1] && t >= s3[1].t0 && t < s3[1].t1 + .1);
    if (one > 0 || cur0 || said0) { rr(c, x0 - 12, y - size * .7, (groupW + 24), size * .8, 22); c.fillStyle = rgba(P.mustard, cur0 ? .6 : .45 * one); c.fill(); }
    if (cur1) { rr(c, x0 + groupW + spw - 10, y - size * .64, youW + 20, size * .74, 18); c.fillStyle = rgba(P.mustard, .55); c.fill(); }
    c.fillStyle = P.ink;
    let x = x0; c.fillText('I', x, y); x += Iw;
    if (u < 1) {   // the space + "a" collapse
      x += spw * (1 - u);
      c.save(); c.translate(x, y); c.scale(Math.max(.001, 1 - u), 1 + .2 * u); c.globalAlpha = a * (1 - u); c.fillText('a', 0, 0); c.restore();
      x += aw * (1 - u);
    }
    if (ap > 0) {   // apostrophe drops from above with a bounce
      const k = back(ap, 2.6), yy = y - (1 - k) * 180;
      c.save(); c.globalAlpha = a * seg(ap, 0, .3); c.fillStyle = P.teal; c.fillText("'", x, yy); c.restore();
      x += apw * u;
    }
    c.fillText('m', x, y); x += mW + spw;
    c.fillText('Youssef.', x, y);
    // bracket "كلمة واحدة" under I'm
    if (one > 0) { c.strokeStyle = rgba(P.teal, one); c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(x0, y + 22); c.quadraticCurveTo(x0 + groupW / 2, y + 30, x0 + groupW, y + 22); c.stroke(); }
    if (ap > .8) for (let i = 0; i < 4; i++) { const k = seg(t, R.tIm + .5, R.tIm + 1.1); if (k > 0 && k < 1) sparkle(c, x0 + Iw + 10 + Math.cos(i * 1.6) * 60 * k, y - size * .9 - Math.sin(i * 1.6) * 40 * k, 14 * (1 - k), P.mustard, i); }
    c.restore();
  },
  name(c, t, a, it) {
    const q = fromLine('r05'), an = fromLine('r06');
    // "اسمك إيه؟" (the narrator says it) lights up under the question before Mia asks it
    const r05 = LINE('r05'), hi = seg(t, R.tAsk - .1, R.tAsk + .2) * (1 - seg(t, (r05 ? r05.t0 : R.tAsk + 2) - .3, (r05 ? r05.t0 : R.tAsk + 2)));
    drawRow(c, t, q, { x: CX, y: Y1, size: fit(q, 120), who: 'mia', alpha: a, ghost: it.t0, mean: 'اسمك إيه؟', meanHi: hi });
    drawRow(c, t, an, { x: CX, y: Y2, size: fit(an, 120), who: 'youssef', alpha: a, ghost: it.t0, mean: 'اسمي يوسف' });
  },
  too(c, t, a, it) {
    const nice = ['Nice', 'to', 'meet', 'you.'].map((w, i) => ({ w, t: R.tNice + i * .09 }));
    drawRow(c, t, nice, { x: CX, y: Y1 - 10, size: 104, who: 'mia', alpha: a * (1 - .4 * seg(t, R.tQul, R.tQul + .4)), ghost: it.t0, mean: 'اتشرفت بيك' });
    // "Me too." (wrong) → "Nice to meet you too." (right)
    const sw = seg(t, R.tQul, R.tQul + .35);
    if (sw < 1) {
      const me = [{ w: 'Me', t: R.tMe }, { w: 'too.', t: R.tMe + .08 }];
      c.save(); c.translate(0, sw * 60);
      const row = drawRow(c, t, me, { x: CX, y: Y2, size: 130, who: 'youssef', alpha: a * (1 - sw) });
      if (row && t > R.tMe) {
        c.globalAlpha = a * (1 - sw);
        const x0 = wordX(row, 0) - 6, x1 = wordX(row, 1) + row.out[1].ww - mw('.', 130) + 6;
        squiggle(c, x0, x1, Y2 + 14, seg(t, R.tMe + .4, R.tMe + .8), 7, P.red, 7);
        cross(c, x1 + 70, Y2 - 45, 32, seg(t, R.tMe + .75, R.tMe + 1.1));
      }
      c.restore();
    }
    if (t > R.tQul) {
      const r07 = LINE('r07'), sp = r07 ? r07.tok : [];
      const right = ['Nice', 'to', 'meet', 'you', 'too.'].map((w, i) => ({ w, t: R.tQul + .15 + i * .07, s0: sp[i]?.t0, s1: sp[i]?.t1, mark: i === 4 ? eo(seg(t, R.tQul + .7, R.tQul + 1.1)) : 0 }));
      const size = fit(right, 130, 840), x = CX - 30;
      const row = drawRow(c, t, right, { x, y: Y2, size, who: 'youssef', alpha: a, mean: 'وأنا كمان اتشرفت بيك' });
      if (row) check(c, row.x + row.W / 2 + 48, Y2 - 45, 30, seg(t, R.tQul + .45, R.tQul + .8));
    }
  },
  sorry(c, t, a, it) {
    const s = fromLine('r08').map(o => ({ ...o, wob: true }));
    drawRow(c, t, s, { x: CX, y: 500, size: 180, who: 'mia', alpha: a, ghost: it.t0, mean: 'نعم؟ / مسمعتش' });
  },
  bye(c, t, a, it) {
    const b1 = fromLine('r09'), b2 = fromLine('r10');
    drawRow(c, t, b1, { x: CX, y: Y1, size: 130, who: 'mia', alpha: a, ghost: it.t0, mean: 'باي! أشوفك' });
    drawRow(c, t, b2, { x: CX, y: Y2, size: 130, who: 'youssef', alpha: a, ghost: it.t0, mean: 'مع السلامة' });
  },
};
