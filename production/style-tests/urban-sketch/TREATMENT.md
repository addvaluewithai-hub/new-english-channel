# "First Day" — style test, Urban Sketch · Pen & Wash

17 s, 1920×1080, 24 fps. Picture only; the finished voice track (`test_audio.wav`) and `timeline.json` are fixed inputs.

## Three candidate structures

1. **One diary page, one camera journey (chosen).** The whole clip is a single sketchbook spread: Youssef's diary. The camera travels across it from the street to the school door and ends on his face. The page *is* his diary, which is exactly the narrator's voice ("my first day..."), so the medium carries the series premise.
2. **Page turn per beat.** Street on page 1, door on page 2, close-up on page 3, joined by page turns. Clear, but three turns in 17 s is choppy and wastes the dialogue time.
3. **Ink-only memory, colour on contact.** The street is only line; colour arrives the moment Mia speaks to him. Strong idea, but the brief asks for "a bright day", and the owner should judge the full palette.

Chosen: 1, with a bit of 3: the street starts as line and the colour arrives *following Youssef* (his red suitcase is the first coloured thing), so the page fills in as his day begins.

## Logline and arc

A new arrival walks a London street drawn in his own sketchbook, meets his teacher, and fumbles his first English sentence.
Setup (arrival, excited) → turn ("I... I Youssef." / "Sorry?") → ending (blush blooms in watercolour on his cheeks; hold; fade to paper).

## Benchmark (grammar only)

- Urban-sketchers' travel journals: line first, wash after, handwritten date/place notes in the margin. Learn: margins, off-register colour, page edge fraying. Don't take: any specific drawing or layout.
- Sempé-style street drawings for staging small figures in big streets. Learn: scale, air. Don't take: characters or compositions.

## Shot list

| # | t | Framing | Move | Why |
|---|---|---|---|---|
| 1 | 0.0–3.2 | Wide: the spread, street with terraces, clock tower far, red bus | slow lateral pan + slight push, pen draws tower/houses, bus drives through | establishing; "the world before colour" becomes a bright day |
| 2 | 3.2–7.4 | Full shot, Youssef walking right with red suitcase | lateral follow on a damped spring (hand-held lag) | travel; excited/nervous walk (quick steps, glance up at the sign) |
| 3 | 7.4–14.5 | Two-shot at the "ENGLISH SCHOOL" door | camera settles (eased), slow push-in during his hesitation | dialogue; both figures ≥ 1/3 frame height |
| 4 | 14.5–17.0 | Medium close-up on Youssef | punch-in with short shake on "Sorry?" | the embarrassed beat; blush wash blooms, ink sweat drops |

Transitions are camera travel on the page; the end fades to paper (the last 0.5 s).

## Beat sheet

- 0.0 page, corner note "Day 1 · London · sunny" writes on; pen lines of the far street.
- 0.6 narration line 1 writes on (right-to-left) in the lower margin.
- 1.0–3.0 bus crosses; colour arrives behind it.
- 3.2 Youssef enters frame left, suitcase rolling; wash follows him.
- ~4.8 narration line 2; 6.4 he looks up at the sign "ENGLISH SCHOOL", small hop of excitement.
- 6.9 narration line 3 "...until I met Mia."; 7.4 Mia blooms in the doorway.
- 8.0 Mia: "Hi! I'm Mia." waves (anticipation, wave x2, settle). Bubble draws on.
- 9.9 Youssef: "Hello! I... I Youssef." — hand to chest, hesitation pauses on the "I...".
- 14.5 Mia "Sorry?" head tilt, hand to ear; punch-in on Youssef; 14.6 blush blooms, sweat drops, he scratches his head.
- 16.5–17.0 fade to paper.

## Sound

The voice track is final and fixed; no music/foley added for this style test (a full episode would add pen hiss, street ambience and a jazz-waltz bed per STYLE.md §7).

## Type

- Arabic narration: handwritten in Ruq'ah (Aref Ruqaa, the everyday Egyptian handwriting), dark sepia ink, written on right-to-left in the lower page margin, ≥ 1.8 s per line.
- English lines: hand-lettered speech bubbles (Caveat 700) in ink with a loose pen outline and a pale wash tint of the speaker's colour (Mia mustard, Youssef navy-blue), written on left-to-right.
- Corner note: Reenie Beanie.

## Build notes (after the demo study)

- Engine: copied from the style demo (`engine.js`: pen strokes, washes, foliage, figure rig) with three additions: separate skirt colour, an open-jacket/cardigan shirt strip, a bigger-head option (`headR`) for readable acting, and a fast one-path pen for bulk strokes.
- No WebGL: the page is baked once into Canvas 2D layers (paper, watercolour, ink) at 1× for the whole 5120×2880 page and at 2.5× for the school area (two-shot and close-up stay sharp). Colour arrival is a 640×360 field turned into an alpha mask every frame, plus a soft wet-front pass. The opening sketch is played back stroke by stroke from the stroke list, then the baked ink takes over.
- Native moves used: *line before colour* (the page sketches itself in about 1.4 s), *colour as arrival* (the red bus paints the street as it passes; the school stays line-only until Mia opens the door), *the one coloured thing* (the red suitcase is the first colour on the page).
- Faces: the style leaves faces blank. For dialogue and lip-flaps I added a few pen marks (dot eyes, brows, a mouth that opens on `talk` spans, the beard as a wash). The embarrassment is a pink wash blooming on his cheeks, ink sweat drops and heat squiggles.
- Arabic caption: Ruq'ah handwriting written right to left on a torn paper strip in the lower margin. It is anchored to the screen, not the page, so a line never pans out of frame mid-sentence. This is a deliberate exception to "text moves with the camera".
- English lines are written into the bubbles in sync with the spoken words (Youssef's "Hello! / I... / I Youssef." appears word group by word group).
- Sound is out of scope here (fixed voice track). A full episode would add pen hiss, street ambience and a jazz-waltz bed.
