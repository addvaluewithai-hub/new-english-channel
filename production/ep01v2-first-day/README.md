# Ep 1 v2 "First Day" — the tighter test cut (picture + sound)

Same lesson and mistake as `../ep01-first-day/` (untouched, for the side-by-side), rebuilt for density. Script: `SCRIPT.md`.
Build: `python timeline.py` (lemo-opuscar venv python: numpy/soundfile) → `node core/render/events.mjs <ep>` → `python mix.py` → `python make_srt.py`.

What changed vs the original
- `timeline.py`: every gap is **audible** silence (a clip's first sound starts `gap` s after the previous clip's last sound; the silent
  file edges overlap). Title 1.5 s, "your turn" 3.5 s, end card 2.5 s, 0.9 s repeat gaps only after r02/r04/r06/r07/r08/r10 (`T['repeat']`),
  none in EN-6/EN-7; EN-7 = 8 single clips, each answer 1.3 s after the question. Prints the density stats at the end.
- Story (`story.js`): hook on the door two-shot → freeze on "Sorry?" (AR-00) → VHS rewind (scanlines, RGB split, tracking, ◀◀ REW,
  the open scrubbed backwards) → title → street walk with EN-1a rehearsal bubble → door opens (wider angle) → AR-05 close-up (no
  second freeze) → EN-2 → class (ep04 set, no pins/Ana; Mei · Youssef · Leo desks) → bye (golden, no clock montage).
- Cast (`bean.js`, from ep04's): `leo` (warm brown skin, curls, leaf hoodie; voice Puck, tab dark leaf) and `mei` (black bob with
  bangs, lilac sweater = SHADE lifted with cream; voice Leda, tab violet SHADE). Name tabs are added in `story.js` (ui.js unchanged).
- Recap (`recap.js`): no opening line; "too" without the Me-too detour; name-card trio (EN-6) with bean heads; the fast round (EN-7).
- Outro: faster title pops, keys re-pointed to the new AR-16/17/18/19 words, no comment nudge, end card at 1/0.62 speed.
- Sound (`mix.py`): new score plan; `rewind` (tape scrub), `tick` (light timer tick), `chair`, classroom bed.
- Voices: ♻️ open, en2, en3, r01–r10, turn copied from ep01; new clips `channel-ep01v2-<key>-v1` (e7q1, e7q4 = v2; rejected v1s in `voices/rejected/`).
