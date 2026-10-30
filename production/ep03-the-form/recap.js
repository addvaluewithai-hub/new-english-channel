// Episode 3 — "اللي اتعلمته النهارده": the recap. Living Letters kinetic type, restyled into Bean People:
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
// the text column between the presenters (Sara x ≈ 395 ± 190 with her arms, Youssef x ≈ 1580 ± 200): rows, tabs, glosses and marks stay inside
const COL = { x0: 560, x1: 1400 }, COLW = 740;   // rows above the presenters' heads (y < 430) may use 900 px
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
  R = { rc, items: ['count', 'teen', 'ty', 'stress', 'age', 'wrong', 'order'].map(id => ({ id, ...it(id) })) };
  R.title0 = rc.t0 + .55; R.title1 = it('count').t0 - .35;
  // keys into the narration (Latin tokens and Arabic words) that time the cards
  R.tNums = nwT('ar07', has('الأرقام'), .85);
  R.tTeen = nwT('ar08', w => /^-teen/.test(w), .85); R.tTy = nwT('ar09', w => /^-ty/.test(w), .8);
  R.tStressW = nwT('ar10', has('الضغطة'), .2); R.tEnd = nwT('ar10', has('الآخر'), .5); R.tStart = nwT('ar10', has('الأول'), .95);
  R.tHowOld = nwT('ar11', w => /^How old/.test(w), .3); R.tSay = nwT('ar11', w => /^I'm/.test(w), .75);
  R.tW1 = nwT('ar12', w => /^I have/.test(w), .3); R.tW2 = nwT('ar12', w => /^I'm 26 years/.test(w), .65); R.tOld = nwT('ar12', w => /^old/.test(w), .92);
  R.tSix = nwT('ar13', has('ستة'), .35); R.tSixFirst = nwT('ar13', has('الستة'), .55); R.tEng = nwT('ar13', has('الإنجليزي'), .7); R.tTwentyFirst = nwT('ar13', has('العشرين'), .85);
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
  const narrSpans = TL.narration.filter(n => n.t0 >= rc.t0 - .1 && n.t1 <= rc.t1 + .1).map(n => [n.t0, n.t1]);   // → TL.mouth_nar in these ranges
  // ---- presenters: two big beans that act (Youssef right facing left: his near arm is armR; Sara left facing right: armL) ----
  const hiT = it('count').t0;
  const YK = 1.4, MK_ = 1.32, YX = 1580, MX = 395;   // 110 px in from the frame edges, clear of the text column (rows fit to 820 px) and the plate
  const OUTR = A => { const lim = (1880 - 27 - .34 * 300 * YK - YX) / (300 * YK) - (A.w ? .08 : 0); return A.dx > lim ? { ...A, dx: lim } : A; };
  R.YX = YX; R.MX = MX;
  const yRest = F('happy', { lx: -.5, happy: .35 }), mRest = F('happy', { lx: .5, happy: .35 });
  const yR = { id: 'youssef', talkExtra: narrSpans, base: { turn: -.3, face: yRest, armL: ARM.rest, armR: ARM.rest, alpha: 1, kmul: 1, sq: 1, lean: 0 },
    moves: [{ t0: rc.t0 + .2, t1: rc.t0 + 1.2, x0: 2250, x1: YX, y0: GROUND_Y, y1: GROUND_Y, k0: YK, k1: YK, step: .45 }], keys: [], jumps: [], blinks: [] };
  const mR = { id: 'mia', base: { turn: .3, face: mRest, armL: ARM.rest, armR: ARM.rest, alpha: 1, kmul: 1, sq: 1, lean: 0 },
    moves: [{ t0: hiT - 1.0, t1: hiT - .1, x0: -320, x1: MX, y0: GROUND_Y, y1: GROUND_Y, k0: MK_, k1: MK_, step: .45 }], keys: [], jumps: [], blinks: [] };
  const K = yR.keys, MK = mR.keys;
  const nod = (keys, x) => keys.push({ t: x, sq: .95, d: .1 }, { t: x + .13, sq: 1, d: .12 }, { t: x + .28, sq: .955, d: .1 }, { t: x + .41, sq: 1, d: .14 });
  K.push({ t: rc.t0 + 1.25, armR: DIP, d: .15 }, { t: rc.t0 + 1.4, armR: ARM.wave, d: .2 }, { t: rc.t0 + 2.6, armR: ARM.rest, d: .3 });
  // every model line: the speaker turns to us with an open hand and talks (lip sync from talk); the other looks over and nods
  for (const l of recapLines) {
    const ys = l.who === 'youssef', [SK, LK] = ys ? [K, MK] : [MK, K];
    SK.push({ t: l.t0 - .3, turn: ys ? -.1 : .1, face: F('happy', { lx: 0, ly: 0, happy: .45, bLy: .6, bRy: .6 }), [ys ? 'armL' : 'armR']: OPEN, d: .25 },
      { t: l.t1 + .35, turn: ys ? -.3 : .3, face: ys ? yRest : mRest, [ys ? 'armL' : 'armR']: ARM.rest, d: .3 });
    LK.push({ t: l.t0 - .15, face: F('happy', { lx: ys ? .75 : -.75, ly: -.05, happy: .55 }), d: .25 }, { t: l.t1 + .5, face: ys ? mRest : yRest, d: .3 });
    nod(LK, l.t1 - .05);
  }
  // counting: the speaker beats the numbers with small nods; the stress pairs: Sara taps the air on the stressed syllables
  const beatNods = (keys, l) => { if (l) l.tok.forEach((o, i) => { if (i % 2 === 0) keys.push({ t: o.t0, sq: .97, d: .08 }, { t: o.t0 + .12, sq: 1, d: .12 }); }); };
  beatNods(MK, L('r01')); beatNods(K, L('r02')); beatNods(MK, L('r03'));
  const r04 = L('r04'), r05 = L('r05'), r08 = L('r08');
  if (r04) r04.tok.forEach(o => MK.push({ t: o.t0 + (/teen/i.test(o.w) ? .18 : 0), armR: { ...OPEN, dy: -.1 }, sq: .96, d: .08 }, { t: o.t0 + (/teen/i.test(o.w) ? .3 : .12), sq: 1, d: .12 }));
  if (r05) MK.push({ t: r05.t0 - .3, armL: { ...OPEN, dx: .18 }, d: .25 }, { t: r05.t1 + .4, armL: ARM.rest, d: .3 });
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
  mistake(R.tW1 + .3, R.tOld + .35);
  // the order trap: Youssef points at the Arabic, then at the English
  K.push({ t: R.tSix - .2, armL: POINT, face: F('happy', { lx: -.6, ly: -.2, happy: .4 }), d: .25 }, { t: R.tTwentyFirst - .2, armL: { ...POINT, dy: .02 }, face: F('happy', { lx: -.6, ly: .1, happy: .5 }), d: .25 },
    { t: r08 ? r08.t0 - .3 : R.tTwentyFirst + 1.5, armL: ARM.rest, d: .3 });
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
  for (const id of ['r01', 'r02', 'r03']) { const l = L(id); if (l) l.tok.forEach(o => cue(o.t0, 'tick', { note: 'number card ' + o.w })); }
  cue(R.tTeen, 'pop', { note: '-teen lights up' }); cue(R.tTy, 'pop', { note: '-ty lights up' });
  cue(R.tStressW, 'pop', { note: 'stress pairs' }); cue(R.tEnd, 'ding', { note: 'TEEN dots' }); cue(R.tStart, 'ding', { note: 'THIR dots' });
  cue(R.tHowOld, 'pop'); cue(R.tSay, 'caret');
  cue(R.tW1, 'type'); cue(R.tW1 + .35, 'squiggle'); cue(R.tW1 + .75, 'error_buzz');
  cue(R.tW2, 'type'); cue(R.tW2 + .35, 'squiggle'); cue(R.tW2 + .75, 'error_buzz');
  cue(R.tOld, 'caret', { note: 'old inserted' }); cue(R.tOld + .4, 'ding', { note: 'the two fixes' });
  cue(R.tSix, 'pop', { note: 'ستة وعشرين' }); cue(R.tTwentyFirst, 'whoosh', { note: 'flip to twenty-six' }); if (r08) cue(r08.t1 + .1, 'ding');
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
function drawRow(c, t, items, { x, y, size, who, alpha = 1, rail = true, ghost = null, mean = null, meanHi = 0, meanSize = 50, meanCol = null, maxW = null }) {
  if (alpha <= 0) return null;
  if (maxW == null) maxW = y < 430 ? 900 : COLW;
  { const W0 = layoutRow(items, size).W; if (W0 > maxW) size *= maxW / W0; }   // every row fits the text column (clear of both presenters)
  const spw = mw(' ', size) * 1.05;
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
  // Arabic meaning, muted, under the line (shifted right past a tucked name tab so the two never overlap)
  const tabEnd = rail ? tabAt(c, S, x + Math.min(...out.map(o => o.x)) - 12, ry, false) : null;
  if (mean) {
    const ma = Math.max(g, shown.length ? 1 : 0);
    if (ma > 0) {
      c.save(); c.globalAlpha = alpha * ma; c.direction = 'rtl'; c.font = `700 ${meanSize}px ${AR}`; c.textAlign = 'center'; c.textBaseline = 'middle';
      const mwid = c.measureText(mean).width; let my = ry + 12 + meanSize, mx = x;
      if (tabEnd != null && x - mwid / 2 - 22 < tabEnd) { mx = Math.min(tabEnd + mwid / 2 + 22, COL.x1 - mwid / 2); if (mx - mwid / 2 < tabEnd + 8) { mx = x; my += 40; } }
      if (meanHi > 0) { rr(c, mx - mwid / 2 - 22, my - meanSize * .62, mwid + 44, meanSize * 1.24, meanSize * .62); c.fillStyle = rgba(P.mustard, .35 * meanHi); c.fill(); }
      c.fillStyle = meanCol || rgba(P.ink, .58 + .3 * meanHi); c.fillText(mean, mx, my); c.restore();
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
    const pop = ghost != null && !o.typed ? (1 + Math.min(.14, .6 * spw / Math.max(1, o.ww)) * Math.sin(Math.PI * p)) : 1;   // capped so a long word never grows into its neighbour's space   // ghosted words pop in place; others rise from the line
    const wx = x + o.x + o.ww / 2, wy = y + (ghost != null ? 0 : (1 - eo(p)) * 70);
    c.save(); c.globalAlpha = alpha * (ghost != null ? lerp(.22, 1, seg(p, 0, .3)) : seg(p, 0, .35)) * (o.alpha ?? 1); c.translate(wx + (o.dx || 0), wy);
    const cur = o.s0 != null && t >= o.s0 && t < o.s1 + .12;
    if (cur) { const k = eo(seg(t, o.s0, o.s0 + .18)); rr(c, -o.ww / 2 - 10, -size * .64, (o.ww + 20) * k, size * .74, 18); c.fillStyle = rgba(P.mustard, .55); c.fill(); }
    if (o.mark) { rr(c, -o.ww / 2 - 4, size * .1, (o.ww + 8) * o.mark, 10, 5); c.fillStyle = P.mustard; c.fill(); }
    c.scale(pop * (o.sx ?? 1) / Math.sqrt(sq), pop * sq);
    c.fillStyle = o.col || P.ink; c.textAlign = 'center';
    if (o.wob && /[?!؟]$/.test(o.w)) {   // "Sorry?" / "Sorry!": the final mark wobbles (Living Letters) — the word keeps its own mark
      const mk = o.w.slice(-1), body = o.w.slice(0, -1), qw = mw(mk, size), bw = mw(body, size);
      c.fillText(body, -qw / 2, 0);
      const k = t - o.t - .25, ang = k > 0 ? Math.sin(k * 8) * .3 * Math.exp(-k * .9) + .1 : 0;
      c.save(); c.translate(bw / 2, -size * .02); c.rotate(ang); c.fillText(mk, 0, 0); c.restore();
    } else c.fillText(o.w, 0, 0);
    c.restore();
  }
  c.restore();
  return { out, W, x, y, size };
}
// speaker tab at the rail's left end; when that would reach the presenter bean, it tucks under the start of the rail
function tabAt(c, S, lx, ry, draw = true) {
  c.save(); c.font = '400 26px "Lilita One"'; c.letterSpacing = '2px'; const tw = c.measureText(S.name).width + 31; c.restore();
  const left = lx - tw - 14 >= COL.x0;
  if (draw) { if (left) nameTab(c, S, lx - tw - 14, ry - 15, 26); else nameTab(c, S, lx, ry + 16, 26); }
  return left ? null : lx + tw + 22;   // the x the gloss must start after when the tab is tucked under the rail
}
const fromLine = (id, stagger = 0) => { const l = LINE(id); return l ? l.tok.map((o, i) => ({ w: o.w, t: o.t0 - .06 + i * stagger, s0: o.t0, s1: o.t1 })) : []; };
const fit = (items, size, maxW = COLW) => { const { W } = layoutRow(items, size); return W > maxW ? size * maxW / W : size; };
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
const CX = 985, CUEY = { count: 822, teen: 822, ty: 822, stress: 836, age: 150, wrong: 822, order: 822 };
const ghostRow = (words, who) => words.map(w => ({ w, t: 1e9 }));   // a row that stays ghosted
// a number card: the digits big, the word under them (a part of the word can be coloured: hi = [start, col]); k = pop, cur = being said
function numCard(c, x, y, w, h, num, word, { k = 1, ghost = 0, cur = 0, hi = null, mute = 0 } = {}) {
  const a = Math.max(ghost * .3, k > 0 ? 1 : 0);
  if (a <= 0) return;
  const s = k > 0 ? back(clamp(k), 2.2) : 1;
  c.save(); c.globalAlpha *= a * (1 - .5 * mute); c.translate(x, y); c.scale(s, s);
  rr(c, -w / 2, -h / 2 + 8, w, h, 22); c.fillStyle = rgba('#2A2742', .12); c.fill();
  rr(c, -w / 2, -h / 2, w, h, 22); c.fillStyle = cur > 0 ? mix('#FFFDF8', P.mustard, .35 * cur) : '#FFFDF8'; c.fill();
  c.strokeStyle = cur > 0 ? rgba(P.mustard, cur) : rgba(P.ink, .1); c.lineWidth = 4; c.stroke();
  c.font = `400 ${num.length > 2 ? 78 : 96}px "Lilita One"`; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillStyle = P.navy; c.fillText(num, 0, h * .14);
  // the word, fitted to the card, with an optional coloured ending (-teen / -ty)
  let fs = 34; c.font = `600 ${fs}px "Fredoka"`; let ww = c.measureText(word).width; if (ww > w - 16) { fs = fs * (w - 16) / ww; c.font = `600 ${fs}px "Fredoka"`; ww = c.measureText(word).width; }
  const by = h * .38;
  if (hi) {
    const [i0, col] = hi, A = word.slice(0, i0), B = word.slice(i0), wa = c.measureText(A).width;
    c.textAlign = 'left'; c.fillStyle = rgba(P.ink, .75); c.fillText(A, -ww / 2, by);
    c.fillStyle = col; c.font = `700 ${fs}px "Fredoka"`; c.fillText(B, -ww / 2 + wa, by);
    if (typeof hi[2] === 'number' && hi[2] > 0) { rr(c, -ww / 2 + wa - 3, by + 6, (c.measureText(B).width + 6) * hi[2], 6, 3); c.fillStyle = col; c.fill(); }
  } else { c.fillStyle = rgba(P.ink, .75); c.fillText(word, 0, by); }
  c.restore();
}
// a grid of number cards keyed to a counting line: map[i] = the token that says card i (or -1: shown muted from the start)
function countGrid(c, t, a, it, nums, words, lineId, map, { hiFrom = null, hiCol = P.red, hiT = 1e9, rows = [5, 5] } = {}) {
  const l = LINE(lineId), W = 150, Hc = 208, G = 18, ys = [370, 640];
  let n = 0;
  rows.forEach((cnt, r) => {
    const rowW = cnt * W + (cnt - 1) * G;
    for (let j = 0; j < cnt; j++, n++) {
      const i = n, ti = map[i], tk = l && ti >= 0 ? l.tok[Math.min(ti, l.tok.length - 1)] : null;
      const t0 = tk ? tk.t0 - .05 : it.t0 + .2 + i * .05, k = seg(t, t0, t0 + .3);
      const cur = tk ? seg(t, tk.t0 - .05, tk.t0 + .05) * (1 - seg(t, tk.t1, tk.t1 + .15)) : 0;
      const hk = hiFrom && hiFrom[i] != null ? [hiFrom[i], hiCol, seg(t, hiT, hiT + .4)] : null;
      c.save(); c.globalAlpha = a;
      numCard(c, CX - rowW / 2 + W / 2 + j * (W + G), ys[r], W, Hc, nums[i], words[i], { k: ti < 0 ? seg(t, it.t0, it.t0 + .3) : k, ghost: seg(t, it.t0, it.t0 + .3), cur, hi: t >= hiT - .05 || ti < 0 ? hk : null, mute: ti < 0 ? 1 : 0 });
      c.restore();
    }
  });
}
// a stress pair row: the number + its word split into syllables (the stressed one big, mustard underlay, a dot that drops in on `dot`)
function syllables(c, x, y, parts, size, col, dot, cur) {
  c.save(); c.textBaseline = 'alphabetic'; c.textAlign = 'left';
  const sz = st => st ? size : size * .66, ws = parts.map(([s, st]) => { c.font = `${st ? 700 : 600} ${sz(st)}px "Fredoka"`; return c.measureText(s).width; });
  const gap = size * .14, W = ws.reduce((a, b) => a + b, 0) + gap * (parts.length - 1);
  if (cur > 0) { rr(c, x - W / 2 - 16, y - size * .92, (W + 32) * eo(cur), size * 1.12, 20); c.fillStyle = rgba(P.mustard, .35); c.fill(); }
  let px = x - W / 2;
  parts.forEach(([s, st], i) => {
    c.font = `${st ? 700 : 600} ${sz(st)}px "Fredoka"`; c.fillStyle = st ? col : rgba(P.ink, .7); c.fillText(s, px, y);
    if (st && dot > 0) { const d = back(clamp(dot), 2.6); ell(c, px + ws[i] / 2, y - size * .95 - (1 - d) * 26, size * .1 * d, size * .1 * d); c.fill(); }
    if (i < parts.length - 1) { c.fillStyle = rgba(P.ink, .3); ell(c, px + ws[i] + gap / 2, y - size * .3, 4, 4); c.fill(); }
    px += ws[i] + gap;
  });
  c.restore();
  return W;
}
const ITEM = {
  // 1–10: two rows of cards, each pops as Sara says it
  count(c, t, a, it) {
    countGrid(c, t, a, it, ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'], ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'], 'r01', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  },
  // 11–20: 11, 12 and 20 are there (muted); 13–19 pop as Youssef says them; their -teen lights up red on the narration
  teen(c, t, a, it) {
    countGrid(c, t, a, it, ['11', '12', '13', '14', '15', '16', '17', '18', '19', '20'], ['eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'], 'r02',
      [-1, -1, 0, 1, 2, 3, 4, 5, 6, -1], { hiFrom: [null, null, 4, 4, 3, 3, 5, 4, 4, null], hiCol: P.red, hiT: R.tTeen });
  },
  // the tens: -ty lights up teal
  ty(c, t, a, it) {
    countGrid(c, t, a, it, ['20', '30', '40', '50', '60', '70', '80', '90', '100'], ['twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety', 'one hundred'], 'r03',
      [0, 1, 2, 3, 4, 5, 6, 7, 8], { hiFrom: [4, 4, 3, 3, 3, 5, 4, 4, null], hiCol: P.teal, hiT: R.tTy, rows: [5, 4] });
  },
  // the stress pairs: thir·TEEN / THIR·ty …; the dots drop on the narration ("في الآخر" / "في الأول"); Sara says 13 / 30 / 16 / 60
  stress(c, t, a, it) {
    const l = LINE('r04'), tk = i => l ? l.tok[Math.min(i, l.tok.length - 1)] : null;
    const P4 = [['13', [['thir', 0], ['TEEN', 1]], '30', [['THIR', 1], ['ty', 0]], 0, 1], ['14', [['four', 0], ['TEEN', 1]], '40', [['FOR', 1], ['ty', 0]], -1, -1],
      ['15', [['fif', 0], ['TEEN', 1]], '50', [['FIF', 1], ['ty', 0]], -1, -1], ['16', [['six', 0], ['TEEN', 1]], '60', [['SIX', 1], ['ty', 0]], 2, 3]];
    c.save(); c.globalAlpha = a;
    // column heads
    const hk = seg(t, it.t0, it.t0 + .3);
    c.globalAlpha = a * hk; c.font = '700 40px "Fredoka"'; c.textAlign = 'center'; c.fillStyle = P.red; c.fillText('-teen', CX - 210, 205); c.fillStyle = P.teal; c.fillText('-ty', CX + 210, 205);
    c.direction = 'rtl'; c.font = `700 32px ${AR}`; c.fillStyle = rgba(P.ink, .55); c.fillText('الضغطة في الآخر', CX - 210, 250); c.fillText('الضغطة في الأول', CX + 210, 250); c.direction = 'ltr';
    P4.forEach(([n1, s1, n2, s2, i1, i2], r) => {
      const y = 360 + r * 128, k = seg(t, it.t0 + .2 + r * .12, it.t0 + .5 + r * .12); if (k <= 0) return;
      c.globalAlpha = a * k;
      const c1 = i1 >= 0 && tk(i1) ? seg(t, tk(i1).t0 - .05, tk(i1).t0 + .1) * (1 - seg(t, tk(i1).t1, tk(i1).t1 + .2)) : 0;
      const c2 = i2 >= 0 && tk(i2) ? seg(t, tk(i2).t0 - .05, tk(i2).t0 + .1) * (1 - seg(t, tk(i2).t1, tk(i2).t1 + .2)) : 0;
      c.font = '400 54px "Lilita One"'; c.textAlign = 'right'; c.fillStyle = P.navy; c.fillText(n1, CX - 330, y);
      c.fillStyle = P.red; syllables(c, CX - 160, y, s1, 76, P.red, seg(t, R.tEnd + r * .1, R.tEnd + .35 + r * .1), c1);
      c.fillStyle = rgba(P.ink, .25); c.fillRect(CX - 2, y - 60, 4, 70);
      c.font = '400 54px "Lilita One"'; c.textAlign = 'left'; c.fillStyle = P.navy; c.fillText(n2, CX + 70, y);
      c.fillStyle = P.teal; syllables(c, CX + 250, y, s2, 76, P.teal, seg(t, R.tStart + r * .1, R.tStart + .35 + r * .1), c2);
    });
    c.restore();
  },
  // "How old are you?" and the two right answers
  age(c, t, a, it) {
    const q = fromLine('r05'), r05 = LINE('r05');
    const hi = seg(t, R.tHowOld - .1, R.tHowOld + .2) * (1 - seg(t, (r05 ? r05.t0 : R.tHowOld + 3) - .3, r05 ? r05.t0 : R.tHowOld + 3));
    drawRow(c, t, q, { x: CX - 20, y: 280, size: fit(q, 104, 740), who: 'mia', alpha: a, ghost: it.t0, mean: 'عندك كام سنة؟', meanHi: hi, meanSize: 44 });
    const s = seg(t, R.tSay - .1, R.tSay + .2);
    [['r06', 'عندي 26 سنة.'], ['r07', 'عندي 26 سنة. (نفس المعنى)']].forEach(([id, mean], i) => {
      const items = fromLine(id), size = fit(items, 110, 720);
      drawRow(c, t, items.map(o => ({ ...o, mark: /^I'm$/.test(o.w) ? eo(s) * (1 - seg(t, (LINE(id) ? LINE(id).t0 : 1e9) - .2, LINE(id) ? LINE(id).t0 : 1e9)) : 0 })), { x: CX - 20, y: 500 + i * 200, size, who: 'youssef', alpha: a, ghost: it.t0 + .2, mean, meanSize: 40 });
    });
  },
  // the two mistakes, squiggled, each with its fix in leaf green
  wrong(c, t, a, it) {
    const rows = [{ w: ['I', 'have', '26', 'years.'], t: R.tW1, y: 290, pill: 'ترجمة حرفية', fix: "I'm 26." }, { w: ["I'm", '26', 'years.'], t: R.tW2, y: 600, pill: 'ناقصة كلمة', fix: "I'm 26 years old." }];
    rows.forEach((r, i) => {
      const ra = a * seg(t, r.t - .05, r.t + .25); if (ra <= 0) return;
      const row = drawRow(c, t, r.w.map((w, j) => ({ w, t: r.t - .05 + j * .07 })), { x: CX - 30, y: r.y, size: 110, who: 'youssef', alpha: ra, maxW: COLW - 150 });   // room for the ✗
      if (!row) return;
      c.save(); c.globalAlpha = ra;
      const x0 = i === 0 ? wordX(row, 0) - 6 : wordX(row, 2) - 6, x1 = row.x + row.W / 2 - mw('.', 110) + 6;
      squiggle(c, x0, x1, r.y + 18, seg(t, r.t + .35, r.t + .75), 7, P.red, 7);
      cross(c, row.x + row.W / 2 + 64, r.y - 50, 30, seg(t, r.t + .75, r.t + 1.1));
      const pa = seg(t, r.t + .8, r.t + 1.1);
      if (pa > 0) { c.globalAlpha = ra * pa; c.direction = 'rtl'; c.font = `700 36px ${AR}`; c.textAlign = 'center'; c.textBaseline = 'middle'; const w = c.measureText(r.pill).width + 50; rr(c, row.x + row.W / 2 - w + 40, r.y + 40, w, 56, 28); c.fillStyle = rgba(P.red, .12); c.fill(); c.fillStyle = P.red; c.fillText(r.pill, row.x + row.W / 2 - w / 2 + 40, r.y + 70); c.direction = 'ltr'; }
      // the fix (leaf, with a ✓) under it, when the narration says "old"
      const fk = seg(t, R.tOld + .3 + i * .25, R.tOld + .6 + i * .25);
      if (fk > 0) {
        c.globalAlpha = ra * fk; c.font = FONT(72); c.textAlign = 'center'; c.textBaseline = 'alphabetic';
        const fw = c.measureText(r.fix).width, fx = Math.max(COL.x0 + 80 + fw / 2, CX - 40), fy = r.y + 175;
        c.fillStyle = P.leaf; c.fillText('→', fx - fw / 2 - 52, fy);
        rr(c, fx - fw / 2 - 12, fy - 66, (fw + 24) * eo(fk), 80, 18); c.fillStyle = rgba(P.leaf, .18); c.fill();
        c.fillStyle = dark(P.leaf, .35); c.fillText(r.fix, fx, fy);
        check(c, fx + fw / 2 + 50, fy - 28, 28, seg(t, R.tOld + .5 + i * .25, R.tOld + .85 + i * .25));
      }
      c.restore();
    });
  },
  // the order trap: ستة وعشرين (6 + 20, the ones first) → twenty-six (20 + 6, the tens first)
  order(c, t, a, it) {
    const ka = a * seg(t, R.tSix - .1, R.tSix + .25), ke = a * seg(t, R.tTwentyFirst - .1, R.tTwentyFirst + .25), r08 = LINE('r08');
    const blk = (x, y, txt, font, sub, n, col, k, rtl) => {
      if (k <= 0) return;
      c.save(); c.globalAlpha = k; c.translate(x, y); const s = back(clamp(k * 1.2), 2); c.scale(s, s);
      c.direction = rtl ? 'rtl' : 'ltr'; c.font = font; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
      const w = c.measureText(txt).width + 50;
      rr(c, -w / 2, -92, w, 128, 26); c.fillStyle = '#FFFDF8'; c.fill(); c.strokeStyle = rgba(col, .6); c.lineWidth = 4; c.stroke();
      c.fillStyle = P.ink; c.fillText(txt, 0, 4);
      c.direction = 'ltr'; c.font = '400 52px "Lilita One"'; c.fillStyle = col; c.fillText(sub, 0, 92);
      ell(c, 0, -110, 24, 24); c.fillStyle = col; c.fill(); c.font = '400 32px "Lilita One"'; c.fillStyle = P.cream; c.textBaseline = 'middle'; c.fillText(n, 0, -108);
      c.restore();
    };
    const AF = `800 84px ${AR}`, EF = '600 84px "Fredoka"';
    // Arabic: read right → left: ستة (1) then عشرين (2)
    blk(CX + 170, 330, 'ستة', AF, '6', '1', P.red, ka, true);
    if (ka > 0) { c.save(); c.globalAlpha = ka; c.direction = 'rtl'; c.font = `800 70px ${AR}`; c.textAlign = 'center'; c.fillStyle = rgba(P.ink, .5); c.fillText('و', CX + 15, 330); c.restore(); }
    blk(CX - 150, 330, 'عشرين', AF, '20', '2', P.red, ka * seg(t, R.tSix + .15, R.tSix + .4), true);
    if (ka > 0) { c.save(); c.globalAlpha = ka * seg(t, R.tSixFirst - .1, R.tSixFirst + .2); arrowLine(c, CX + 300, 245, CX - 290, 245, P.red); c.restore(); }
    // English: read left → right: twenty (1) then six (2)
    const k2 = ke * seg(t, R.tTwentyFirst + .1, R.tTwentyFirst + .4);
    blk(CX - 150, 640, 'twenty', EF, '20', '1', P.teal, ke, false);
    if (ke > 0) { c.save(); c.globalAlpha = ke; c.font = EF; c.textAlign = 'center'; c.fillStyle = rgba(P.ink, .5); c.fillText('-', CX + 30, 640); c.restore(); }
    blk(CX + 180, 640, 'six', EF, '6', '2', P.teal, k2, false);
    if (ke > 0) { c.save(); c.globalAlpha = k2; arrowLine(c, CX - 300, 555, CX + 290, 555, P.teal); c.restore(); }
    // r08 "Twenty-six." highlight under the English blocks
    if (r08 && t > r08.t0 - .1) { const cur = seg(t, r08.t0 - .1, r08.t0 + .1) * (1 - seg(t, r08.t1, r08.t1 + .3)); c.save(); c.globalAlpha = a * cur; rr(c, CX - 330, 540, 660, 210, 30); c.strokeStyle = P.mustard; c.lineWidth = 8; c.stroke(); c.restore(); }
    if (r08) check(c, CX + 380, 600, 32, seg(t, r08.t1 + .1, r08.t1 + .45));
  },
};
// a reading-direction arrow
function arrowLine(c, x0, y, x1, y1, col) {
  const d = Math.sign(x1 - x0);
  c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 7; c.lineCap = 'round'; c.setLineDash([18, 14]);
  c.beginPath(); c.moveTo(x0, y); c.lineTo(x1 - d * 20, y1); c.stroke(); c.setLineDash([]);
  c.beginPath(); c.moveTo(x1, y1); c.lineTo(x1 - d * 28, y1 - 16); c.lineTo(x1 - d * 28, y1 + 16); c.closePath(); c.fill();
}
