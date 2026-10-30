# Ep 2 "Good Morning?" (picture)

A 2D canvas animation in the approved **Bean People v2** look (the same modules as episode 1), rendered headlessly with the
lemo-opuscar library. `timeline.json` (built by `timeline.py` from the real voice clips) is the only source of timing: every
beat, bubble, word highlight, mouth shape and cue is derived from it, so regenerating the timeline re-times the picture and
the cue list. Nothing that comes from speech is hard-coded.

## Render

```bash
cd /home/user/ref/lemo-opuscar
export PLAYWRIGHT_CHROME=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell   # if needed
node core/render/still.mjs  <ep02-good-morning> 30.4 34.6 57.3 100.2       # stills → <ep>/stills
node core/render/video.mjs  <ep02-good-morning> --workers 3                # full episode → <ep>/out/video.mp4
node core/render/events.mjs <ep02-good-morning>                            # window.EV → <ep>/events.json (for the mix)
# preview a range (section ids or seconds); --size scales the canvas down:
node core/render/video.mjs  <ep02-good-morning> --q 'from=hall&to=coffee' --size 960x540 --out <ep>/out/preview.mp4
```

Page contract (unchanged): `window.DUR` (= `timeline.dur`), `window.render(t)` (a pure function of t that uses seeded
randomness only), `window.READY` (set after the timeline and the fonts have loaded) and `window.EV` (the cue list).
Optional query parameters: `?from=&to=` (a preview range; DUR and t become relative, EV times stay absolute) and `?tl=file.json`.

## Modules (the episode 1 split, extended)

| file | role |
|---|---|
| `kit.js` | Palette tokens, colour maths and the form pass (unchanged). |
| `bean.js` | The v2 characters (the mouth has the lip-sync extras `mround`, `mlip`, `mtng`), plus the episode 2 props: a takeaway coffee cup, the two-cup carrier, Sara's tote bag, the paper form, and `handPos` (hand positions for a pose, so a prop can be drawn behind a far hand or in front of a near one) and `drawHand` (the hand redrawn over a held prop). |
| `world.js` | The street from episode 1 (unchanged), plus two new flat interiors baked once: **Youssef's bedroom** (lilac wall, the window with morning light, bed + blanket, bedside table with the alarm clock, the red suitcase, a door) and the **school hallway** (cream wall over a navy-pastel wainscot, plank floor, a window, the notice board, a wall clock, a poster, teal doors, a plant). `blanket()` has a tucked and a thrown state. |
| `ui.js` | Bubbles, the Arabic plate and icons as in episode 1, plus: sun / afternoon / moon icons, a waving hand, `bigMark` (a popping "?" / "!"), and the `z z z` trail. |
| `tl.js`, `act.js` | As in episode 1: `mouthAt` reads the timeline's viseme track (`mouth` / `mouth_nar`, shapes A–H from `lib/lipsync.py`) and `VISEME` in `act.js` draws each shape as a mouth-parameter set, blended over ≈ 2 frames. |
| `cues.js` | Unchanged. |
| `story.js` | open (bedroom) → run (street) → hall + coffee (hallway) → door + bye (the school door, afternoon) + the form close-up. |
| `recap.js` | "اللي اتعلمته النهارده" with the six episode 2 items. |
| `outro.js` | Title card ("Good Morning?"), page wipe, "your turn", the site nudge (the full-screen call-to-action), the form teaser and the end card ("How old are you?"). |

## How the scenes map to the timeline

| section | picture | keyed to |
|---|---|---|
| open | The bedroom. The alarm clock on the bedside table shows 8:10 and rings from `alarm` until the slap just after `wake`; Youssef sleeps sitting up under the blanket with a `z z z`. At `wake` he jolts (a hop + eyes snap open), slaps the clock, looks at it and his eyes go wide; a short insert cuts to the clock (8:10). He points at the clock on "سبعة", scratches his head on "سمعتوش", looks again on "صحيت", and leaps out of bed on "وعشرة" (the blanket is thrown into a pile), lands with a "!", then runs out of the door on "جريت" with speed lines. The camera pushes slowly toward the clock under the title card ("يوسف في نيويورك" / "الحلقة 2" / "Good Morning?"), which leaves just before the cut to the street. | `beats.alarm`, `beats.wake`, `ar01` words, `ar02.t0`, `beats.title`, the start of `run` |
| run | The street from episode 1. Youssef runs (fast hop-walk, lean, no suitcase) from the far left to the school door while the camera follows; the yellow taxi passes behind. A thought bubble "Good morning!" with a little sun on the Latin token of `ar03`; his eyes droop on "نايم"; the door opens as he arrives. | `run` t0/t1, `ar03` words |
| hall | Cut to the hallway: Youssef is catching his breath (a panting squash), Sara hops in from the right with a two-cup carrier at `mia_enters`. "Good morning, Youssef! How are you?" in a bubble. At `yawn` he yawns big (eyes shut, mouth wide, hand near the mouth, a stretch), then mumbles "Good… night." half asleep (the eyes droop in the gap). At `laugh` Sara laughs (∩ eyes, hand over her mouth, three little bounces); Youssef snaps awake, then blushes `///` with a sweat drop; "Oh! Sorry! Good morning!" with arms up on "Oh!", a quick bow on "Sorry!" (overshoot, settle) and a hand on the chest on "Good morning!". At `ar04` the film cuts in to a close-up of the embarrassed Youssef with a slow push (no freeze): he looks away, up at us on "تمانية الصبح!", at Sara on "ضحكت", and shuts his eyes on "أنام". | hall `lines` (per token), `beats.mia_enters`, `beats.yawn`, `beats.laugh`, `ar04` words |
| coffee | Cut back to the two-shot. "So… how are you?" / "I'm OK… a little tired." (tired lids). On "Coffee?" Sara holds the carrier out across to him; on "Yes, please!" he reaches across and takes a cup (the carrier then holds one). "You're welcome." At `sip` he drinks (eyes shut, cup at the mouth), then his eyes go wide with a stretch, sparkles orbit his head, and he sighs happily. On "مش عارفها" a "?" pops over his head and he looks puzzled at Sara. The camera pushes in for the sip and eases back. | coffee `lines`, `beats.sip`, `ar05` words |
| door | Afternoon light (`tod` = 1 from the cut at `afternoon`). The school door from outside: Youssef stands by the doorway with an arm up holding the door; Sara comes out with her tote bag. "Thank you, Youssef!" / "Welcome!" (chest out: a stretch, a lean back, hand on the chest, proud shut eyes at `welcome`) / "You're welcome." (a gentle smile) / "You're welcome!" (he repeats it looking up, then is delighted). On "هحكيلكم" he turns to us. | door `lines`, `beats.welcome`, `ar06` words |
| bye | "Oh!" (a raised finger), the form comes out of the bag and is held out at `form`; Youssef takes it on "OK…", reads it and looks up on "thank you". Waves on the "Good night" exchange (`good_night`); Sara walks off to the right and the camera pushes toward Youssef, who nods to us on "وإنت ماشي، مش وإنت جاي" and looks down at the form on "الاستمارة". At `age_box` a cut to the close-up of the form in his two hands (Name / From / Age / Class), the `Age: ____` box lights up, and a big "?" pops over it on "سؤال". | bye `lines`, `beats.form`, `beats.good_night`, `beats.age_box`, `ar07` words |
| recap | A page-wipe to paper; the title shrinks into a header pill; Youssef presents on the right, Sara on the left. Items: **times** — three rows with a sun / low sun / moon icon: "Good morning." (Sara), "Good afternoon." (Youssef), "Good evening." (Sara), each with its Arabic meaning. **night** — a ghosted "Good night" used as a greeting (a small sun) gets the red squiggle, an ✗ and "مش تحية" on the narration; then "Good night!" with a moon + waving hand, typeset on his line, ✓ after it, "تصبح على خير (وإنت ماشي)". **how** — "How are you?" (Sara, "عامل إيه؟" lit on the Latin token) and three real answers that stack on "رد حقيقي", each typeset on its line. **andyou** — "And you?" / "وإنت؟". **welcome** — a ghosted "Thank you" from the narration, "Welcome." with the squiggle, ✗ and "ناقصة كلمة", then "You're welcome." (Sara) ✓ "عفوًا / العفو". **polite** — "Coffee, please." / "قهوة، لو سمحت" and "Sorry!" (the ! wobbles) / "آسف!". The presenters act as in episode 1 (facepalm + scratch on a squiggle, a proud nod on the fix, a wave on the good night, a small bow on "Sorry!"); the "كرّر" cue appears in each repeat gap. | `recap[]` items, `lines` r01–r12 (per-word highlight), Latin tokens and words in `ar09`–`ar13` |
| turn | A page-wipe back to the street (morning). Sara faces camera at the school door ("دورك!" wave), asks "Good morning! How are you?", then the "I'm ______." card with a mic, the 3-2-1 ring from `pause_start` to `pause_end`, the ✓, confetti, a clap on "برافو" and the comment icon on "واكتب". The hint under the slot reads "good · OK · tired". | `turn` line, `beats.pause_start` / `beats.pause_end`, `ar14` / `ar15` words |
| site | The "I'm ______." card leaves and Sara steps back into the doorway; Youssef comes out of the door as the street blurs and dims and the big site card slides up (the full-screen call-to-action) on `site_card` (the site's cream paper, header "يوسف في نيويورك · تمارين", progress dots, the "صلّح غلطة يوسف" exercise with Sara's "Good morning, Youssef!" as context). The exercise plays by itself: "Good night, Sara!" gets the red squiggle under "Good night", Youssef points at the card on "ادخل", a drawn hand taps the "Good morning" chip on "وحل" (the chip goes leaf), the sentence corrects to "Good morning, Sara!" with a mustard swash, a ✓ and a little confetti inside the card, and three stars fill one by one on "خمس" while Sara peeks out of the doorway and claps. On "اللينك" Youssef turns to us and points down at the mustard "اللينك في الوصف ⬇" pill that bounces under the card, bottom right, clear of the narration plate. The card slides away just before `next`. | `beats.site_card`, `ar17` words ("ادخل", "وحل", "خمس", "اللينك"), the start of `next` |
| next | The teaser: Youssef at the school door holding the form; a big card of the form pops on "الاستمارة" with the `Age` box; numbers float up on "أرقام" while he scratches his head; the "?" pops on "وسؤال"; Sara asks "How old are you?" from off screen (her bubble at the right edge, timed to the Latin token) and he answers "I have 26 years." in a bubble that gets the red squiggle and an ✗ on "غلط". End card at `end_card`: "الحلقة الجاية", "How old are you?", Youssef peeking in, the red "اشترك" pill with the bell that gets tapped, and a teal "حل التمارين" pill with a pencil for the site. Fades to ink. | `ar16` words and Latin tokens, `beats.end_card` |

## Sound cues (`window.EV`, also in `events.json`)

Each entry is `{t, type, ...}`. Some entries add fields: `dur` (s) for long sounds; `who` (`mia`/`youssef`) on `step`,
`bubble` and `laugh`; `run` on running steps; `n` on `countdown_tick`; `text` on `bubble`; and a human-readable `note`.

The episode 1 types are kept with the same meaning: `step`, `bubble`, `pop`, `thought`, `sparkle`, `sting`, `sting_shock`,
`sting_end`, `whoosh`, `cut_in`, `cut`, `page_turn`, `door_open`, `door_close`, `taxi` (was `bus`), `ambience_street`,
`ambience_afternoon`, `music_intro`, `music_recap`, `music_outro`, `alarm`, `gulp`, `type`, `caret`, `squiggle`,
`error_buzz`, `ding`, `repeat`, `mic_on`, `countdown_tick`, `confetti`, `cheer`, `click`, `bell` (`whoosh`, `squiggle`, `ding`,
`confetti`, `sparkle` and `pop` also serve the site card).
Not used this episode: `suitcase_roll`, `freeze`, `unfreeze`, `clock_spin`, `clock_tick`, `squeeze`.

| type | meaning |
|---|---|
| `alarm` | The bedside alarm rings from t = 0 until it is slapped (`dur`). |
| `yawn` | Youssef's big yawn (`dur`). |
| `laugh` | Sara's laugh (`who`, `dur`). |
| `sip` | The first sip of coffee. |
| `paper` | Paper / a prop changes hands: the cup, the form out of the bag, the form handed over, the form card in the teaser. |
| `stars` | The sparkles around his head after the sip (`dur`). |
| `ambience_hall` | A quiet school-interior bed under the hallway scenes (`dur`). |
| `click` | Also used for the slap on the alarm clock (as well as the subscribe tap). |
| `tap` | A soft click: the drawn hand taps the right chip in the site card. |
| `sting_shock` | The "!" on landing out of bed, and the "?" over the Age box. |
| `cut_in` / `cut` | The clock insert and back, the close-up on the embarrassed Youssef, the form close-up; the cuts between sets. |

## Speed (4-core container, no GPU)

- A full frame (render + screenshot) averages about 0.26 s over the whole episode at 1080p (79 stills every 2.5 s);
  the interiors and the street cost about the same, the recap is the cheapest.

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
- Check stills: `stills/contact_sheet_v3.jpg` (every 4.6 s), `stills/v3/` (key moments); ep02 `out/preview_v3.mp4` (hall → coffee, 540p).
