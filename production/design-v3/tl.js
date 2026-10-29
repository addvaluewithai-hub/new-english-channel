// Design v3 — a stand-in for the episode timeline: one narration line for the plate (no voice clips here).
export const TL = { narration: [] };
const isLatin = w => /[A-Za-z]/.test(w) && !/[؀-ۿ]/.test(w);
export function setNarration(ar, t0 = 0, t1 = 8) {
  // a Latin run ("Yes, please") is one token, as in the episode's aligned narration, so bidi never reorders it
  const ws = [];
  for (const w of ar.split(/\s+/).filter(Boolean)) { const last = ws[ws.length - 1]; if (last && isLatin(w) && isLatin(last)) ws[ws.length - 1] = last + ' ' + w; else ws.push(w); }
  const n = ws.length;
  const tok = ws.map((w, i) => ({ w: isLatin(w) ? w.replace(/[.,:…]+$/, '') : w, lat: isLatin(w), t0: t0 + (t1 - t0) * i / n, t1: t0 + (t1 - t0) * (i + 1) / n }));
  TL.narration = [{ id: 'd1', t0, t1, tok, ar }];
}
export function narrChunks(n) { return [{ idx: n.tok.map((o, i) => i), t0: n.t0, t1: n.t1 }]; }
