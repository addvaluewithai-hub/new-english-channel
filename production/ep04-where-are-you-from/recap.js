// Episode 4 — "اللي اتعلمته النهارده": the recap. Living Letters kinetic type, restyled into Bean People:
// cream paper, ink Fredoka words that are typeset as they are spoken (rise, land with a squash), a speaker rail + name tab
// under each line, a mustard highlighter on the spoken word, a red spell-check squiggle under mistakes, and two small
// presenter beans (Youssef right, Sara left). Every beat is keyed to recap items, lines and narration words in timeline.json.
import { P, rgba, mix, dark, light, rr, ell, grain } from './kit.js';
import { clamp, lerp, seg, ss, eo, eio, back } from '/core/lib.js';
import { TL, SEC, NARR, LINE, RECAP, nwT, has } from './tl.js';
import { charState, drawActor } from './story.js';
import { fold, F, ARM, CUP, CLAP, DIP, OPEN, POINT, FACEPALM } from './act.js';
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
  R = { rc, items: ['from', 'live', 'rule', 'are', 'in', 'nat'].map(id => ({ id, ...it(id) })) };
  R.title0 = rc.t0 + .55; R.title1 = it('from').t0 - .35;
  // keys into the narration (Latin tokens and Arabic words) that time the cards
  const lat = re => w => re.test(w);
  R.tWhereQ = nwT('ar07', lat(/^Where are/i), .2); R.tImFrom7 = nwT('ar07', lat(/^I'm from/), .45); R.tIFrom = nwT('ar07', lat(/^I from/), .8); R.tWrong7 = nwT('ar07', has('غلط'), .95);
  R.tWhereLive = nwT('ar08', lat(/^Where do/i), .15); R.tILiveIn = nwT('ar08', lat(/^I live in/), .4); R.tNoAm = nwT('ar08', has('خالص'), .65); R.tIamLive = nwT('ar08', lat(/^I am live/), .8); R.tWrong8 = nwT('ar08', has('غلط'), .95);
  R.tImFrom9 = nwT('ar09', lat(/^I'm from/), .1); R.tAm9 = nwT('ar09', has('فيها'), .3); R.tVerb = nwT('ar09', has('فعل'), .6); R.tILive9 = nwT('ar09', lat(/^I live/), .75); R.tWithout = nwT('ar09', has('غير'), .92);
  R.tAreQ = nwT('ar10', lat(/^Are you/i), .25); R.tYes = nwT('ar10', lat(/^Yes/), .6); R.tNo = nwT('ar10', lat(/^No/), .9);
  R.tInRule = nwT('ar11', has('بتاخد'), .2); R.tInCairo = nwT('ar11', lat(/^in Cairo/), .45); R.tInNY = nwT('ar11', lat(/^in New/), .65); R.tAtCairo = nwT('ar11', lat(/^at Cairo/), .9);
  R.tNat = nwT('ar12', has('والجنسية'), .4); R.tCap = nwT('ar12', has('كبير'), .9);
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
  // presenter Youssef mouths his narration clips (the diary voice's viseme track) and his own model lines; Sara hers
  const narrSpans = TL.narration.filter(n => n.t0 >= rc.t0 - .1 && n.t1 <= rc.t1 + .1).map(n => [n.t0, n.t1]);   // → TL.mouth_nar in these ranges
  // ---- presenters: two big beans that act (Youssef right facing left: his near arm is armR; Sara left facing right: armL) ----
  const hiT = it('times').t0;
  const YK = 1.6, MK_ = 1.5, YX = 1580, MX = 395;   // 110 px in from the frame edges, clear of the text column (rows fit to 820 px) and the plate
  // Youssef's outer arm (armR: screen-right, he faces left) must never leave the frame: a pose whose hand would pass x = 1880 is
  // pulled in (hand x ≈ YX + shoulder .34 H + dx H + the wave swing + the hand radius, H = 300 · YK)
  const OUTR = A => { const lim = (1880 - 27 - .34 * 300 * YK - YX) / (300 * YK) - (A.w ? .08 : 0); return A.dx > lim ? { ...A, dx: lim } : A; };
  R.YX = YX; R.MX = MX;
  const yRest = F('happy', { lx: -.5, happy: .35 }), mRest = F('happy', { lx: .5, happy: .35 });
  const yR = { id: 'youssef', talkExtra: narrSpans, base: { turn: -.3, face: yRest, armL: ARM.rest, armR: ARM.rest, alpha: 1, kmul: 1, sq: 1, lean: 0 },
    moves: [{ t0: rc.t0 + .2, t1: rc.t0 + 1.2, x0: 2250, x1: YX, y0: GROUND_Y, y1: GROUND_Y, k0: YK, k1: YK, step: .45 }], keys: [], jumps: [], blinks: [] };
  const mR = { id: 'mia', base: { turn: .3, face: mRest, armL: ARM.rest, armR: ARM.rest, alpha: 1, kmul: 1, sq: 1, lean: 0 },
    moves: [{ t0: hiT - 1.0, t1: hiT - .1, x0: -320, x1: MX, y0: GROUND_Y, y1: GROUND_Y, k0: MK_, k1: MK_, step: .45 }], keys: [], jumps: [], blinks: [] };
  const K = yR.keys, MK = mR.keys;
  const nod = (keys, x) => keys.push({ t: x, sq: .95, d: .1 }, { t: x + .13, sq: 1, d: .12 }, { t: x + .28, sq: .955, d: .1 }, { t: x + .41, sq: 1, d: .14 });
  // hello wave on arrival
  K.push({ t: rc.t0 + 1.25, armR: DIP, d: .15 }, { t: rc.t0 + 1.4, armR: ARM.wave, d: .2 }, { t: rc.t0 + 2.6, armR: ARM.rest, d: .3 });
  // every model line: the speaker turns to us with an open hand and talks (lip sync from talk); the other looks over and nods
  for (const l of recapLines) {
    const ys = l.who === 'youssef', [SK, LK] = ys ? [K, MK] : [MK, K];
    SK.push({ t: l.t0 - .3, turn: ys ? -.1 : .1, face: F('happy', { lx: 0, ly: 0, happy: .45, bLy: .6, bRy: .6 }), [ys ? 'armL' : 'armR']: OPEN, d: .25 },
      { t: l.t1 + .35, turn: ys ? -.3 : .3, face: ys ? yRest : mRest, [ys ? 'armL' : 'armR']: ARM.rest, d: .3 });
    LK.push({ t: l.t0 - .15, face: F('happy', { lx: ys ? .75 : -.75, ly: -.05, happy: .55 }), d: .25 }, { t: l.t1 + .5, face: ys ? mRest : yRest, d: .3 });
    nod(LK, l.t1 - .05);
  }
  const r02 = L('r02'), r04 = L('r04'), r09 = L('r09'), r10 = L('r10');
  // the mistakes: facepalm on the squiggle, sheepish scratch while it is explained, proud nod (hand on chest) on the fix
  const mistake = (tSq, tFix, clap = true) => {
    K.push({ t: tSq - .05, armR: FACEPALM, face: F('embarrassed', { eye: .12, lx: 0, ly: .3 }), lean: -.025, d: .2 },
      { t: tSq + 1.1, armR: ARM.scratch, face: F('embarrassed', { lx: -.5, ly: .2 }), lean: -.015, d: .3 },
      { t: tFix - .1, armR: ARM.chest, face: F('joy', { bLy: .9, bRy: .9 }), lean: 0, turn: -.15, d: .25 },
      { t: tFix + 1.5, armR: ARM.rest, face: yRest, turn: -.3, d: .35 });
    nod(K, tFix + .15);
    MK.push({ t: tSq + .1, armL: CUP, face: F('happy', { lx: .7, happy: .8, mw: .09, mo: 0 }), d: .25 },
      { t: tSq + 1.2, armL: ARM.rest, face: F('happy', { lx: .6, bLy: .7, bRy: .7, happy: .3 }), d: .3 });
    if (clap) MK.push({ t: tFix, armL: CLAP, armR: CLAP, face: F('joy'), d: .18 }, { t: tFix + .9, armL: ARM.rest, armR: ARM.rest, face: mRest, d: .3 });
    yR.blinks.push(tSq - .05, tSq + 1.1, tFix - .1); mR.blinks.push(tSq + .1, tFix);
  };
  mistake(R.tIFrom + .2, r02 ? r02.t1 + .1 : R.tWrong7 + 3);
  mistake(R.tIamLive + .2, r04 ? r04.t1 + .1 : R.tWrong8 + 3);
  mistake(R.tAtCairo + .2, r09 ? r09.t1 + .1 : R.tAtCairo + 3, false);
  // the main point: Youssef counts it out on the comparison card (an open hand to each row)
  K.push({ t: R.tImFrom9 - .2, armL: OPEN, face: F('happy', { lx: -.6, ly: -.2, happy: .5 }), d: .25 }, { t: R.tILive9 - .2, armL: POINT, face: F('happy', { lx: -.6, ly: .2, happy: .5, bLy: .9, bRy: .9 }), d: .25 },
    { t: R.tWithout + .9, armL: ARM.rest, face: yRest, d: .3 });
  MK.push({ t: R.tWithout, face: F('joy', { lx: .6 }), d: .2 }, { t: R.tWithout + 1.0, face: mRest, d: .3 });
  // the nationalities: Youssef beams on "Egyptian"
  if (r10) K.push({ t: r10.t0 - .3, armL: ARM.chest, face: F('joy'), d: .25 }, { t: r10.t1 + .6, armL: ARM.rest, face: yRest, d: .3 });
  // repeat gaps: Youssef turns to us with an open hand ("your turn"), Sara smiles at us
  for (const g of R.gaps) {
    K.push({ t: g.t0, turn: -.08, face: F('happy', { lx: 0, ly: 0, happy: .55 }), armL: OPEN, d: .3 }, { t: g.t1 - .1, turn: -.3, armL: ARM.rest, face: yRest, d: .3 });
    MK.push({ t: g.t0 + .1, face: F('happy', { lx: 0, ly: 0, happy: .6 }), d: .3 }, { t: g.t1 - .1, face: mRest, d: .3 });
  }
  for (const k of K) if (k.armR) k.armR = OUTR(k.armR);
  K.sort((p, q) => p.t - q.t); MK.sort((p, q) => p.t - q.t);
  R.yR = yR; R.mR = mR;
  // ---- cues ----
  cue(R.title0, 'pop', { note: 'recap title' });
  cue(rc.t0 + .3, 'step', { who: 'youssef' }); cue(hiT - .6, 'step', { who: 'mia' });
  for (const l of recapLines) cue(l.t0 - .05, 'type', { note: 'line typesets: ' + l.text });
  cue(R.tIFrom, 'type'); cue(R.tIFrom + .2, 'squiggle'); cue(R.tIFrom + .6, 'error_buzz'); if (r02) cue(r02.t1 + .1, 'ding');
  cue(R.tIamLive, 'type'); cue(R.tIamLive + .2, 'squiggle'); cue(R.tIamLive + .6, 'error_buzz'); if (r04) cue(r04.t1 + .1, 'ding');
  cue(R.tImFrom9, 'pop', { note: 'the comparison card' }); cue(R.tAm9, 'caret'); cue(R.tILive9, 'pop'); cue(R.tWithout, 'squiggle', { dur: .35, note: 'am struck out' });
  cue(R.tAreQ, 'pop'); cue(R.tInCairo, 'pop'); cue(R.tInNY, 'pop'); cue(R.tAtCairo, 'type'); cue(R.tAtCairo + .2, 'squiggle'); cue(R.tAtCairo + .6, 'error_buzz'); if (r09) cue(r09.t1 + .1, 'ding');
  cue(R.tCap, 'sparkle', { note: 'capital letters light up' });
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
function drawRow(c, t, items, { x, y, size, who, alpha = 1, rail = true, ghost = null, mean = null, meanHi = 0, meanSize = 50, meanCol = null }) {
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
      c.save(); c.globalAlpha = alpha * ma; c.direction = 'rtl'; c.font = `700 ${meanSize}px ${AR}`; c.textAlign = 'center'; c.textBaseline = 'middle';
      const mwid = c.measureText(mean).width, my = ry + 12 + meanSize;
      if (meanHi > 0) { rr(c, x - mwid / 2 - 22, my - meanSize * .62, mwid + 44, meanSize * 1.24, meanSize * .62); c.fillStyle = rgba(P.mustard, .35 * meanHi); c.fill(); }
      c.fillStyle = meanCol || rgba(P.ink, .58 + .3 * meanHi); c.fillText(mean, x, my); c.restore();
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
  if (lx - tw - 14 >= 560) nameTab(c, S, lx - tw - 14, ry - 15, 26); else nameTab(c, S, lx, ry + 16, 26);
}
const fromLine = (id, stagger = 0) => { const l = LINE(id); return l ? l.tok.map((o, i) => ({ w: o.w, t: o.t0 - .06 + i * stagger, s0: o.t0, s1: o.t1 })) : []; };
const fit = (items, size, maxW = 820) => { const { W } = layoutRow(items, size); return W > maxW ? size * maxW / W : size; };
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
  let cueY = 822;
  for (let k = 0; k < I.length; k++) {
    const it = I[k];
    if (t < it.t0 - .05 || t > it.t1 + .35) continue;
    const aIn = seg(t, it.t0 - .05, it.t0 + .2), aOut = 1 - seg(t, it.t1 - .05, it.t1 + .3);
    const a = aIn * aOut, dy = (1 - aOut) * -40;
    if (CUEY[it.id]) cueY = CUEY[it.id];
    c.save(); c.translate(0, dy);
    ITEM[it.id]?.(c, t, a, it);
    c.restore();
  }
  // repeat cue in the gaps after model lines
  for (const g of R.gaps) {
    const a = Math.min(seg(t, g.t0, g.t0 + .3), 1 - seg(t, g.t1 - .2, g.t1));
    if (a > 0) repeatCue(c, 960, cueY, a, t);
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
    const s = back(p, 2) * (1 - m * .5), x = lerp(900, 1500, m), y = lerp(440, 90, m);   // the big title sits a little left of centre, clear of Youssef (now 110 px in from the edge)
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
const CX = 1000, CUEY = { from: 822, live: 822, rule: 822, are: 150, in: 822, nat: 822 };
const ghostRow = (words, who) => words.map(w => ({ w, t: 1e9 }));   // a row that stays ghosted
// the wrong sentence: ghosted words that pop in, a red squiggle under the bad span (word indices i0..i1), an ✗ and a red note
function wrongRow(c, t, a, words, tIn, i0, i1, note, y, size = 92) {
  const A = a * seg(t, tIn - .05, tIn + .25);
  if (A <= 0) return null;
  const row = drawRow(c, t, ghostRow(words), { x: CX, y, size, who: 'youssef', alpha: A, ghost: tIn - .05 });
  if (!row) return null;
  c.save(); c.globalAlpha = A;
  const x0 = wordX(row, i0) - 6, x1 = wordX(row, i1) + row.out[i1].ww + 6;
  squiggle(c, x0, x1, y + 18, seg(t, tIn + .2, tIn + .6), 7, P.red, 7);
  cross(c, row.x + row.W / 2 + 70, y - size * .45, 30, seg(t, tIn + .6, tIn + .95));
  const pa = seg(t, tIn + .7, tIn + 1.0);
  if (pa > 0 && note) { c.globalAlpha = A * pa; c.direction = 'rtl'; c.font = `700 38px ${AR}`; c.textAlign = 'center'; c.textBaseline = 'middle'; const w = c.measureText(note).width + 50; rr(c, CX - w / 2, y + 40, w, 58, 29); c.fillStyle = rgba(P.red, .12); c.fill(); c.fillStyle = P.red; c.fillText(note, CX, y + 70); }
  c.restore();
  return row;
}
// a model line typeset on its speaker's rail, with its Arabic meaning, a ✓ after it is spoken, and optional marked words
function modelRow(c, t, a, id, who, y, size, mean, o = {}) {
  const l = LINE(id); const items = fromLine(id).map((w, i) => ({ ...w, mark: o.mark && o.mark.includes(i) ? eo(seg(t, (l ? l.t1 : 0) - .1, (l ? l.t1 : 0) + .3)) : 0 }));
  const sz = fit(items, size, 820);
  const row = drawRow(c, t, items, { x: CX + (o.dx || 0), y, size: sz, who, alpha: a, ghost: o.ghost, mean, meanSize: o.meanSize || 40, meanHi: o.meanHi || 0 });
  if (row && l && o.tick) check(c, row.x + row.W / 2 + 56, y - sz * .55, 30, seg(t, l.t1 + .1, l.t1 + .45));
  return row;
}
const ITEM = {
  // "Where are you from?" → "I'm from Egypt." (I from Egypt ✗)
  from(c, t, a, it) {
    wrongRow(c, t, a, ['I', 'from', 'Egypt.'], R.tIFrom, 0, 1, "ناقصة 'm", 250);
    modelRow(c, t, a, 'r01', 'mia', 470, 96, 'إنت منين؟', { ghost: it.t0, meanHi: seg(t, R.tWhereQ - .1, R.tWhereQ + .2) * (1 - seg(t, R.tImFrom7 - .2, R.tImFrom7)) });
    modelRow(c, t, a, 'r02', 'youssef', 660, 110, 'أنا من مصر.', { ghost: it.t0, tick: true, mark: [0] });
  },
  // "Where do you live?" → "I live in Queens." (I am live ✗)
  live(c, t, a, it) {
    wrongRow(c, t, a, ['I', 'am', 'live', 'in', 'Queens.'], R.tIamLive, 1, 1, 'مفيش am مع live', 250);
    modelRow(c, t, a, 'r03', 'mia', 470, 96, 'ساكن فين؟', { ghost: it.t0, meanHi: seg(t, R.tWhereLive - .1, R.tWhereLive + .2) * (1 - seg(t, R.tILiveIn - .2, R.tILiveIn)) });
    modelRow(c, t, a, 'r04', 'youssef', 660, 110, 'أنا ساكن في كوينز.', { ghost: it.t0, tick: true, mark: [1] });
  },
  // the main point: I'm from (with be) / I live (no be)
  rule(c, t, a, it) {
    const a1 = a * seg(t, R.tImFrom9 - .1, R.tImFrom9 + .2), a2 = a * seg(t, R.tILive9 - .1, R.tILive9 + .2), S1 = 124;
    if (a1 > 0) {
      const row = drawRow(c, t, ["I'm", 'from', 'Egypt.'].map(w => ({ w, t: -1, typed: true })), { x: CX, y: 330, size: S1, who: 'youssef', alpha: a1 });
      if (row) {   // the 'm lights up: be is here
        const k = eo(seg(t, R.tAm9 - .1, R.tAm9 + .25)), x0 = wordX(row, 0) + mw('I', S1) - 4, w = mw("'m", S1) + 10;
        c.save(); c.globalAlpha = a1; rr(c, x0, 330 - S1 * .78, w * k, S1 * .96, 16); c.fillStyle = rgba(P.mustard, .55); c.fill();
        c.font = FONT(S1); c.textAlign = 'left'; c.fillStyle = P.ink; if (k > 0) c.fillText("'m", x0 + 4, 330);
        tag(c, "be ✓", wordX(row, 0) - 40, 330 - S1 * .45, k, P.leaf, -1); c.restore();
      }
    }
    if (a2 > 0) {
      const ws = ['I', 'am', 'live', 'in', 'Queens.'], k = eo(seg(t, R.tWithout - .1, R.tWithout + .35));
      const row = drawRow(c, t, ws.map((w, i) => ({ w, t: -1, typed: true, col: i === 1 ? P.red : null, alpha: i === 1 ? 1 - .7 * k : 1 })), { x: CX, y: 620, size: S1, who: 'youssef', alpha: a2 });
      if (row) {
        const x0 = wordX(row, 1) - 8, w = row.out[1].ww + 16;
        c.save(); c.globalAlpha = a2; c.strokeStyle = P.red; c.lineWidth = 10; c.lineCap = 'round';
        if (k > 0) { c.beginPath(); c.moveTo(x0, 620 - S1 * .3); c.lineTo(x0 + w * k, 620 - S1 * .38); c.stroke(); }
        const lv = eo(seg(t, R.tVerb - .1, R.tVerb + .3));   // "live" is the verb: a teal underline
        if (lv > 0) { const lx = wordX(row, 2); c.strokeStyle = P.teal; c.lineWidth = 9; c.beginPath(); c.moveTo(lx, 620 + 20); c.lineTo(lx + row.out[2].ww * lv, 620 + 20); c.stroke(); }
        tag(c, "no be", wordX(row, 0) - 40, 620 - S1 * .45, k, P.red, -1); c.restore();
      }
    }
  },
  // Are you from …? → Yes, I am. / No, I'm not.
  are(c, t, a, it) {
    const r07 = LINE('r07');
    modelRow(c, t, a, 'r07', 'youssef', 300, 100, 'إنت من مدريد؟', { ghost: it.t0, meanHi: seg(t, R.tAreQ - .1, R.tAreQ + .2) * (1 - seg(t, (r07 ? r07.t0 : 1e9) - .3, r07 ? r07.t0 : 1e9)) });
    // the two short answers side by side: "Yes, I am." (typeset on the narration) and "No, I'm not." (Sara's model line)
    const yA = a * seg(t, R.tYes - .1, R.tYes + .2);
    if (yA > 0) {
      const row = drawRow(c, t, ['Yes,', 'I', 'am.'].map((w, i) => ({ w, t: R.tYes - .05 + i * .08 })), { x: CX - 230, y: 590, size: 96, who: 'mia', alpha: yA, mean: 'أيوه.', meanSize: 40 });
      if (row) check(c, row.x + row.W / 2 + 46, 590 - 52, 26, seg(t, R.tYes + .4, R.tYes + .7), P.leaf);
    }
    modelRow(c, t, a * seg(t, R.tNo - .1, R.tNo + .2), 'r08', 'mia', 590, 96, 'لأ.', { ghost: R.tNo - .1, dx: 250 });
  },
  // in + a city: "in Cairo, in New York" — never "at Cairo"
  in(c, t, a, it) {
    const chip = (txt, x, y, k) => { if (k <= 0) return; const s = back(k, 2); c.save(); c.globalAlpha = a; c.translate(x, y); c.scale(s, s); c.font = FONT(64); c.textAlign = 'center'; c.textBaseline = 'middle';
      const w = mw(txt, 64) + 60; rr(c, -w / 2, -46, w, 92, 46); c.fillStyle = rgba(P.leaf, .2); c.fill(); c.fillStyle = P.ink; c.fillText(txt, 0, 4);
      c.fillStyle = rgba(P.mustard, .55); rr(c, -w / 2 + 26, 20, mw('in', 64) + 8, 10, 5); c.fill(); c.restore(); };
    chip('in Cairo', CX - 230, 250, seg(t, R.tInCairo - .1, R.tInCairo + .3)); chip('in New York', CX + 210, 250, seg(t, R.tInNY - .1, R.tInNY + .3));
    wrongRow(c, t, a, ['I', 'live', 'at', 'Cairo.'], R.tAtCairo, 2, 2, 'المدينة: in', 440, 96);
    modelRow(c, t, a, 'r09', 'mia', 680, 110, 'أنا ساكنة في نيويورك.', { ghost: R.tAtCairo + .9, tick: true, mark: [2] });
  },
  // country → nationality, both with a capital letter
  nat(c, t, a, it) {
    const rows = [['r10', 'youssef', 'مصر ← مصري'], ['r11', 'mia', 'إسبانيا ← إسباني'], ['r12', 'mia', 'أمريكا ← أمريكي']];
    const cap = eo(seg(t, R.tCap - .1, R.tCap + .3)), S2 = 100;
    rows.forEach(([id, who, mean], i) => {
      const y = 300 + i * 190, l = LINE(id); const words = l ? l.tok : [];
      const items = words.map((o, j) => ({ w: o.w.replace(/[.]$/, ''), t: o.t0 - .06, s0: o.t0, s1: o.t1, gap: j === 0 ? 3.2 : 1 }));
      if (!items.length) return;
      const row = drawRow(c, t, items, { x: CX, y, size: S2, who, alpha: a, ghost: it.t0, mean, meanSize: 38 });
      if (!row) return;
      c.save(); c.globalAlpha = a;
      // the arrow between the two words
      const ax0 = wordX(row, 0) + row.out[0].ww + 26, ax1 = wordX(row, 1) - 26, ka = seg(t, items[1].t - .3, items[1].t);
      if (ka > 0) { c.strokeStyle = rgba(P.ink, .45); c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(ax0, y - 34); c.lineTo(lerp(ax0, ax1, ka), y - 34); c.stroke();
        c.beginPath(); c.moveTo(lerp(ax0, ax1, ka) - 16, y - 48); c.lineTo(lerp(ax0, ax1, ka), y - 34); c.lineTo(lerp(ax0, ax1, ka) - 16, y - 20); c.stroke(); }
      // capital letters: a mustard box behind each first letter
      if (cap > 0) for (const j of [0, 1]) { if (t < items[j].t) continue; const x0 = wordX(row, j) - 4, w = mw(items[j].w[0], S2) + 8; rr(c, x0, y - S2 * .8, w * cap, S2 * .98, 12); c.fillStyle = rgba(P.mustard, .5); c.fill();
        c.font = FONT(S2); c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillStyle = P.red; c.fillText(items[j].w[0], x0 + 4, y); }
      c.restore();
    });
  },
};
// a small pill label next to a row ("be ✓" / "no be"), right-aligned to x
function tag(c, txt, x, y, k, col, side = -1) {
  if (k <= 0) return;
  c.save(); c.font = '600 40px "Fredoka"'; c.textBaseline = 'middle'; c.textAlign = 'center';
  const w = c.measureText(txt).width + 36, s = back(k, 2), cx = x - w / 2;
  c.translate(cx, y); c.scale(s, s); rr(c, -w / 2, -30, w, 60, 30); c.fillStyle = rgba(col, .16); c.fill(); c.fillStyle = col === P.leaf ? dark(P.leaf, .25) : col; c.fillText(txt, 0, 2); c.restore();
}
