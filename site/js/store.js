// Progress, streak and the review deck — all in localStorage (guarded; the site works with storage blocked).
const KEY = 'yil.v1';
const INTERVALS = [1, 3, 7, 14, 30];           // days, SM-2-like steps; a wrong answer resets to step 0
const DAY = 864e5;
let mem = null;                                  // in-memory fallback when storage is blocked

function load() {
  if (mem) return mem;
  try { const raw = localStorage.getItem(KEY); mem = raw ? JSON.parse(raw) : null; } catch (e) { mem = null; }
  if (!mem || typeof mem !== 'object') mem = { episodes: {}, deck: {}, days: [] };
  mem.episodes ||= {}; mem.deck ||= {}; mem.days ||= [];
  return mem;
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { /* storage blocked: keep in memory */ } }

export const today = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const dayIndex = s => Math.round(new Date(s + 'T00:00:00').getTime() / DAY);

// ---- activity days + streak ----
export function touchDay() {
  const st = load(), t = today();
  if (!st.days.includes(t)) { st.days.push(t); st.days = st.days.slice(-400); save(); }
}
export function streak() {
  const st = load(); if (!st.days.length) return 0;
  const set = new Set(st.days.map(dayIndex)); let d = dayIndex(today());
  if (!set.has(d)) { if (!set.has(d - 1)) return 0; d -= 1; }   // yesterday's streak still counts until today ends
  let n = 0; while (set.has(d)) { n++; d--; }
  return n;
}

// ---- episodes ----
export function episodeState(id) { return load().episodes[id] || null; }
export function setEpisodeResult(id, { score, total, stars }) {
  const st = load(), prev = st.episodes[id] || {};
  st.episodes[id] = { ...prev, score, total, stars: Math.max(prev.stars || 0, stars), best: Math.max(prev.best || 0, score), done: (prev.done || 0) + 1, last: Date.now() };
  save();
}
// resume state inside an episode (so a reload keeps the place)
export function getResume(id) { const s = load().episodes[id]; return s && s.resume || null; }
export function setResume(id, resume) { const st = load(); st.episodes[id] = { ...(st.episodes[id] || {}), resume }; save(); }

// ---- review deck (key = `${ep}:${phrase}`) ----
export function recordAnswer(key, correct, when = Date.now()) {
  const st = load(), c = st.deck[key] || { s: -1, due: 0, n: 0, ok: 0 };
  c.n++; if (correct) c.ok++;
  if (correct) { c.s = Math.min(c.s + 1, INTERVALS.length - 1); c.due = when + INTERVALS[c.s] * DAY; }
  else { c.s = 0; c.due = when + INTERVALS[0] * DAY; c.lapse = (c.lapse || 0) + 1; }
  c.last = when; st.deck[key] = c; save();
  return c;
}
export function deck() { return load().deck; }
export function dueKeys(when = Date.now()) {
  const d = load().deck;
  return Object.keys(d).filter(k => d[k].due <= when).sort((a, b) => d[a].due - d[b].due);
}
export function dueCount(when = Date.now()) { return dueKeys(when).length; }
export function nextDue() { const d = load().deck, v = Object.values(d).map(c => c.due); return v.length ? Math.min(...v) : null; }
export function deckSize() { return Object.keys(load().deck).length; }
export function reviewDoneToday() { return load().reviewDay === today(); }
export function markReviewDone() { const st = load(); st.reviewDay = today(); save(); }
export function resetAll() { mem = { episodes: {}, deck: {}, days: [] }; save(); }
