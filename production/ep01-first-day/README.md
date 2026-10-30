# Ep 1 "First Day" (picture)

A 2D canvas animation in the approved **Bean People v2** look, rendered headlessly with the lemo-opuscar library.
`timeline.json` is the only source of timing. Every beat, bubble, word highlight, mouth shape and cue is derived from it, so
regenerating the timeline re-times the picture and the cue list. Nothing that comes from speech is hard-coded.

## Render

```bash
cd /home/user/ref/lemo-opuscar
export PLAYWRIGHT_CHROME=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell   # if needed
node core/render/still.mjs  <ep01-first-day> 36.2 45 107.3            # stills → <ep>/stills
node core/render/video.mjs  <ep01-first-day> --workers 3              # full episode → <ep>/out/video.mp4
node core/render/events.mjs <ep01-first-day>                          # window.EV → <ep>/events.json (for the mix)
# preview a range (section ids or seconds); --size scales the canvas down:
node core/render/video.mjs  <ep01-first-day> --q 'from=door&to=retry' --size 960x540 --out <ep>/out/preview.mp4
```

Page contract: `window.DUR` (= `timeline.dur`), `window.render(t)` (a pure function of t that uses seeded randomness
only), `window.READY` (set after the timeline and the fonts have loaded) and `window.EV` (the cue list).

Optional query parameters:
- `?from=&to=` sets a preview range. DUR and t become relative to the range, but the EV times stay absolute.
- `?tl=file.json` loads a different timeline file, for testing.

## Modules (the v2 split, extended)

| file | role |
|---|---|
| `kit.js` | Palette tokens, colour maths and the form pass. The crescent blur now runs at half resolution, canvases come from a size-aware pool, and every canvas is a CPU raster canvas. |
| `bean.js` | The v2 characters, with a tighter layer box and three lip-sync extras on the parametric mouth (`mround` rounded opening, `mlip` lower lip under the teeth, `mtng` tongue up; all 0 = the classic mouth). |
| `world.js` | The New York street (design v3): brownstones, the school on its stoop, the props along the walk. Adds a time-of-day sky (`tod`). Static layers are baked once into caches; the door, clock hands, taxi and clouds are drawn live. Depth of field is done by downsampling. |
| `ui.js` | Speech bubbles with name tabs and the timed word highlighter, the Arabic narration plate (RTL, words light up, bidi-safe Latin runs), thought bubbles and drawn icons: smiley, loop arrows, mic, ✓/✗, squiggle, alarm clock, bell, comment. |
| `tl.js` | Loads the timeline. Maps display tokens to word times, reads the viseme track (`mouth` / `mouth_nar`, Preston Blair shapes A–H built by `lib/lipsync.py`) with `mouthAt`, which blends the shapes over ≈ 2 frames and rests the mouth in the gaps, chunks the narration plate and finds narration words. |
| `act.js` | Acting: keyed pose tracks, hop-walk, blinks, eye darts, lip sync (`VISEME`: the 8 shapes as mouth-parameter sets, tinted by the speaker's smile) and the ponytail/quiff spring. |
| `story.js` | Sections open → street → door → retry (one continuous world), then day and bye. |
| `recap.js` | "اللي اتعلمته النهارده": Living Letters kinetic type on cream paper. |
| `outro.js` | Title card, page wipe, "your turn", the site nudge (the full-screen call-to-action), next-episode teaser and end card. |
| `cues.js` | The `window.EV` registry. Scenes register their cues while they are built from the timeline. |

## How the scenes map to the timeline

| section | picture | keyed to |
|---|---|---|
| open | Camera tilts down from the skyline; Youssef hop-walks in with the red suitcase. He stops to look up at New York on "نيويورك", the yellow taxi passes behind, and he glances at us, worried, on "قابلت سارة". The title card ("يوسف في نيويورك" / "الحلقة 1" / "First Day") pops in with a sting. | `ar01` / `ar02` words, `beats.title`, the start of `street` |
| street | Walking. A thought bubble rehearses "Hello!" with a drawn smile, and he grins on "وبابتسامة". He finds the school (sign, teal door) and walks to the door, which opens. | `ar03` words, `beats.school_seen`, `beats.door_open` |
| door | Sara is revealed in the doorway and hops out. Two-shot: "Hi! I'm Sara." with a wave, then "Hello! I… I Youssef." (the "I…" trembles). Sara leans in for "Sorry?", and the film cuts in to a close-up of Youssef. At the freeze: a cached, desaturated hold with a flash, a keyline frame, sweat and `///` blush, and ?/! marks that pop on the panicking narration. | door `lines` (per token), `beats.sorry`, `beats.freeze`, `ar05` punctuation |
| retry | The film unfreezes back to the two-shot. Sara is kind; Youssef answers with a hand on his chest; joy, small hops. On "Come in!" Sara steps aside and points. Both turn and go into the doorway, and the door closes during `ar06`. | retry `lines`, `beats.unfreeze`, `beats.come_in` |
| day | Close-up on the school clock: the hands spin from 9:05 to 3:30, the sky and grade warm to golden afternoon, and the camera pulls back. The door opens and both come out. | `day` t0/t1 |
| bye | Golden two-shot. Waves, then Youssef walks away. Sara calls "Class is at eight!", he whips round, and the film cuts to a close-up of "Eight?!" with a thought bubble holding a ringing alarm clock at 8:00. On "الجيش" he gives a deadpan look to camera. | bye `lines`, `beats.eight`, `ar08` words |
| recap | A page-wipe to paper. The title shrinks into a header pill, and the presenter beans are Youssef on the right and Sara on the left. Per item: hi/hello · "I Youssef." with a red squiggle and ✗, then the "أنا يوسف" gloss, the caret, `am` typed in and ✓ · "I am" squeezing into "I'm" · "اسمك إيه؟" gloss, then Q and A · "Nice to meet you." with "Me too." (squiggle) replaced by "Nice to meet you too." · "Sorry?" with a wobbling ? · "Bye! See you!" / "Goodbye!". A drawn "كرّر" cue appears in each repeat gap. | `recap[]` items, `lines` r01–r10 (per-word highlight), Latin tokens in `ar10` / `ar11` / `ar13` |
| turn | A page-wipe back to the street. Sara faces camera ("دورك!" wave). Her bubble, then the "I'm ______." card with a mic and a 3-2-1 ring from `pause_start` to `pause_end`, then ✓, confetti, a clap on "برافو", and a comment icon on "واكتبها". | `turn` line, `beats.pause_start` / `beats.pause_end`, `ar16` / `ar17` words |
| site | The "I'm ______." card leaves and Sara steps back into the doorway; Youssef comes out of the door as the street blurs and dims and the big site card slides up (the full-screen call-to-action) on `site_card` (the site's cream paper, header "يوسف في نيويورك · تمارين", progress dots, the "صلّح غلطة يوسف" exercise with Sara's line as context). The exercise plays by itself: "I Youssef." gets the red squiggle, Youssef points at the card on "ادخل", a drawn hand taps the "I'm" chip on "وحل" (the chip goes leaf), the sentence corrects to "I'm Youssef." with a mustard swash, a ✓ and a little confetti inside the card, and three stars fill one by one on "خمس" while Sara peeks out of the doorway and claps. On "اللينك" Youssef turns to us and points down at the mustard "اللينك في الوصف ⬇" pill that bounces under the card, bottom right, clear of the narration plate. The card slides away just before `next`. | `beats.site_card`, `ar19` words ("ادخل", "وحل", "خمس", "اللينك"), the start of `next` |
| next | A ringing alarm at 8:20, then Youssef running late (speed lines). Sara asks "How are you?" (her bubble is timed to the Latin token in `ar18`), and he gulps. End card: "الحلقة الجاية", "How are you?", Youssef, a red subscribe pill with a bell that gets tapped, and a teal "حل التمارين" pill with a pencil for the site (no platform logo). Fades to ink. | `ar18` words, `beats.end_card` |

## Sound cues (`window.EV`, also in `events.json`)

Each entry is `{t, type, ...}`. Some entries add fields: `dur` (s) for long sounds; `who` (`mia`/`youssef`) on `step` and
`bubble`; `run` on running steps; `n` on `countdown_tick`; `text` on `bubble`; and a human-readable `note`.

| type | meaning |
|---|---|
| `step` | One hop-walk landing (`who`; `run: true` when running). |
| `suitcase_roll` | Wheels rolling (`dur`; `fast` when running). |
| `bubble` | A speech bubble pops (`who`, `text`). |
| `pop` | A small UI or graphic pop: title words, the recap title, the card, an apostrophe, the comment icon, an excited hop. |
| `thought` | A thought bubble appears. |
| `sparkle` | The grin sparkle. |
| `sting` | Title card. |
| `sting_shock` | "Eight?!" |
| `sting_end` | End card. |
| `whoosh` | Camera moves and transitions; the site card in and out. |
| `cut_in` | Cut to the close-up. |
| `cut` | Cut on arrival (teaser). |
| `page_turn` | Page wipe, in and out of the recap. |
| `door_open` | The door opens. |
| `door_close` | The door closes. |
| `taxi` | The yellow taxi passes behind (`dur`, `pan`). |
| `ambience_street` | Morning street bed (`dur`). |
| `ambience_afternoon` | Afternoon bed (`dur`). |
| `music_intro` | Music bed under the opening (`dur`). |
| `music_recap` | Music bed under the recap (`dur`). |
| `music_outro` | Music bed under the outro (`dur`). |
| `freeze` | The freeze-frame pop. |
| `unfreeze` | The release. |
| `clock_spin` | The clock montage (`dur`). |
| `clock_tick` | Each hour the hands pass. |
| `alarm` | Alarm ringing (`dur`). |
| `gulp` | Nervous gulp. |
| `type` | Words typeset in the recap. |
| `caret` | The text caret appears. |
| `squiggle` | The red squiggle draws. |
| `error_buzz` | The ✗ badge. |
| `ding` | Correct / fixed / time up (✓). |
| `squeeze` | "I am" → "I'm". |
| `repeat` | Start of a learner repeat gap (`dur` = the gap). |
| `mic_on` | The countdown starts. |
| `countdown_tick` | 3, 2, 1 (`n`). |
| `confetti` | The praise burst. |
| `cheer` | "برافو". |
| `click` | The subscribe tap. |
| `tap` | A soft click: the drawn hand taps the right chip in the site card. |
| `bell` | The subscribe bell. |

## Speed (4-core container, no GPU)

- `render()` averages 120–130 ms per frame over the whole episode. The slowest frames, the golden close-ups, take about 440 ms.
- The screenshot adds about 80 ms per frame.
- A full frame costs about 0.2 s on average. The door + retry preview at 960×540 took 69 s for 769 frames with 4 workers.

## Notes
- Fonts and credits: see `CREDITS`. Every image is drawn in code; there are no brands or logos.
- `events.json`, `stills/` and `out/` are generated files. Re-run `events.mjs` after the timeline changes.

## Design v3 (this port)
- Series "يوسف في نيويورك": `world.js` is the New York set from `production/design-v3` (brownstones with stoops and fire escapes, far
  skyscrapers with water towers, the yellow taxi where the bus was — the cue is now `taxi` with the bus's timing — hydrant, subway sign,
  hot-dog cart and newspaper box spread along the walk so a shot holds 2–3 props at most; the school keeps its door language on a stoop).
- The teacher is **Sara**: name tab `SARA` (rust), site-card "سارة:", titles. Her internal id stays `mia` (timeline `who`, `talk`, `mouth`, cast keys).
- Arms are the approved **A2** jointed arms (`bean.js`, `ARMS = 'A2'`), with the owner's two tweaks: at rest the elbow bends only ~12° and the
  arm hangs close to the body (elbow tucked in), and the sleeve rim light is 40 % softer. `ARM.*` is the A2 pose table; `act.js` holds the
  shared gestures (PULL, CUP, CLAP, DIP, OPEN, RAISE, RUNARM, FACEPALM, REACH, …). A pose carries `bend` (min elbow bend), `elv`
  (elbow side), `flex` (0 = exactly the min bend) and `front` (both forearms drawn in front). The A2 reach is .33 H, so hand-overs use
  the arm on the other character's side, drawn in front (`front: true`), instead of a cross-body reach.
- The site section is the **full-screen call-to-action** (`outro.js`: `sceneSite`, `bigCard`, `linkBar`): blurred + dimmed street, the big
  card (1000 × 740) with the self-playing exercise, small Youssef pointing on the left, Sara peeking in from the right to clap at the stars,
  the mustard bar "حل تمارين الحلقة · اللينك في الوصف ⬇" on "اللينك". Cue names unchanged (`whoosh`, `squiggle`, `tap`, `ding`,
  `confetti`, `sparkle`, `pop`).
- The end card follows `frame_endcard.jpg`: the series title on top, "الحلقة الجاية", the question, the big teal "حل التمارين" and red "اشترك" pills.
- Owner review fixes: the sip hand target sits under the mouth with the cup tilted ~20° (`SIPPOSE`, `cupIn` rot); the form is held by its top corner at chest height with the sheet hanging below-left of the hand (`formHeld`, `HOLDF`, `LOOKF`); the recap presenters stand 110 px further in (`YX` 1580, `MX` 395, rows fit to 820 px) and Youssef's outer-arm poses are clamped so the hand never passes x = 1880 (`OUTR`).
- Check stills: `stills/contact_sheet_v3.jpg` (every 4.6 s), `stills/v3/` (key moments); ep02 `out/preview_v3.mp4` (hall → coffee, 540p).
