// Episode 1 — timeline access. timeline.json (built by timeline.py from the voice clips) is the single source of truth:
// every time used by the picture comes from here (sections, beats, lines, narration words, talk spans, recap items).
import { clamp, seg, hash } from '/core/lib.js';

export let TL = null;
export async function loadTimeline() {
  const r = await fetch(new URLSearchParams(location.search).get('tl') || 'timeline.json', { cache: 'no-store' });
  TL = await r.json();
  TL.lines.forEach((l, i) => { l.i = i; l.tok = tokens(l.text, l.words, l.t0, l.t1); });
  TL.narration.forEach(n => { n.tok = narrTokens(n); });
  TL.talk.sort((a, b) => a[0] - b[0]);
  return TL;
}

// ---- lookups (all tolerant: a missing entry never throws) ----
export const SEC = id => TL.sections.find(s => s.id === id) || { id, t0: 0, t1: 0 };
export const BEAT = (k, d = 0) => TL.beats[k] ?? d;
export const NARR = id => TL.narration.find(n => n.id === id) || null;
export const LINES = scene => TL.lines.filter(l => l.scene === scene);
export const LINE = id => TL.lines.find(l => l.id === id) || null;
export const RECAP = id => TL.recap.find(r => r.id === id) || null;
export const sectionAt = t => { for (const s of TL.sections) if (t < s.t1) return s; return TL.sections[TL.sections.length - 1]; };
export const isLatin = w => /[A-Za-z]/.test(w) && !/[؀-ۿ]/.test(w);

// display tokens of an English line, each with its spoken time. The transcript words drive the timing; the script text drives
// the spelling. Same count → 1:1; otherwise times are spread by character position (robust to transcription differences).
function tokens(text, words, t0, t1) {
  const tx = text.split(/\s+/).filter(Boolean);
  if (!words || !words.length) return tx.map((w, i) => ({ w, t0: t0 + (t1 - t0) * i / tx.length, t1: t0 + (t1 - t0) * (i + 1) / tx.length }));
  if (words.length === tx.length) return tx.map((w, i) => ({ w, t0: words[i].t0, t1: words[i].t1 }));
  const L = tx.reduce((a, w) => a + w.length + 1, 0), WL = words.reduce((a, w) => a + w.w.length + 1, 0);
  const at = f => {   // time at a fraction of the word stream's characters
    let acc = 0;
    for (const w of words) { const n = (w.w.length + 1) / WL; if (f <= acc + n) return w.t0 + (w.t1 - w.t0) * clamp((f - acc) / n); acc += n; }
    return words[words.length - 1].t1;
  };
  let acc = 0;
  return tx.map(w => { const a = acc / L; acc += w.length + 1; return { w, t0: at(a), t1: at(Math.min(1, (acc - 1) / L)) }; });
}
// narration tokens: the aligned words are the display units (a Latin run such as "I Youssef." is one token)
function narrTokens(n) {
  const ws = n.words && n.words.length ? n.words : null;
  const raw = ws ? ws.map(w => ({ w: w.w, t0: w.t0, t1: w.t1 })) : tokens(n.ar, null, n.t0, n.t1);
  return raw.map(o => {
    const lat = isLatin(o.w);
    // Latin runs inside the Arabic plate: drop trailing sentence punctuation so bidi never pushes it to the wrong side
    return { ...o, lat, w: lat ? o.w.replace(/[.,:…]+$/, '') : o.w };
  });
}

// time of a token in a narration clip matched by a predicate (else a fraction of the clip): keys picture beats to the voice
export function nwT(id, pred, frac = .5) {
  const n = NARR(id); if (!n) return null;
  const k = n.tok.find(o => pred(o.w));
  return k ? k.t0 : n.t0 + (n.t1 - n.t0) * frac;
}
export const has = s => w => w.includes(s);

// ---- lip sync from talk spans: A/E/O cycle per word, closes between words ----
// who: 'mia' | 'youssef'. extra: additional spans [[t0,t1]] (e.g. narration words when Youssef presents on camera)
export function talkAt(who, t, extra) {
  let best = null;
  const test = (a, b) => {
    if (t < a - .05 || t > b + .06) return;
    const e = Math.min(seg(t, a - .05, a + .03), 1 - seg(t, b - .02, b + .06));
    const syl = .5 + .5 * Math.abs(Math.sin((t - a) * Math.PI * 6.2 + .6));
    const v = e * syl;
    if (!best || v > best.open) best = { open: v, shape: Math.floor(hash(a * 13.7) * 3) };
  };
  for (const [a, b, w] of TL.talk) { if (a > t + .1) break; if (w === who) test(a, b); }
  if (extra) for (const [a, b] of extra) test(a, b);
  return best || { open: 0, shape: 0 };
}

// ---- narration plate chunks: phrases split at punctuation, merged to a readable width, each shown while it is spoken ----
export function narrChunks(n, measure, maxW = 1380) {
  if (n.chunks) return n.chunks;
  const phrases = []; let cur = [];
  n.tok.forEach((o, i) => { cur.push(i); if (/[،.…؟!:]$/.test(n.words?.[i]?.w ?? o.w) || o.lat) { phrases.push(cur); cur = []; } });
  if (cur.length) phrases.push(cur);
  const width = idx => idx.reduce((a, i) => a + measure(n.tok[i]), 0) + 18 * (idx.length - 1);
  const dur = idx => n.tok[idx[idx.length - 1]].t1 - n.tok[idx[0]].t0;
  const chunks = [];
  for (const ph of phrases) {
    const last = chunks[chunks.length - 1];
    if (last && (width([...last, ...ph]) <= 900 || ((dur(last) < 1.5 || dur(ph) < .9) && width([...last, ...ph]) <= maxW))) last.push(...ph);
    else if (width(ph) > maxW) {   // a very long phrase: split by width
      let part = [];
      for (const i of ph) { if (part.length && width([...part, i]) > maxW) { chunks.push(part); part = []; } part.push(i); }
      if (part.length) chunks.push(part);
    } else chunks.push([...ph]);
  }
  n.chunks = chunks.map((idx, k) => ({ idx, t0: k ? n.tok[idx[0]].t0 - .08 : n.t0 - .25 }));
  n.chunks.forEach((ch, k) => { ch.t1 = k < n.chunks.length - 1 ? n.chunks[k + 1].t0 : n.t1 + .55; });
  return n.chunks;
}
