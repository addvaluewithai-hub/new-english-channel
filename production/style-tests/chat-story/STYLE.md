# STYLE — "Youssef's Phone" (موبايل يوسف)

The whole story lives on Youssef's phone. One generic, brand-free messenger UI, flat avatars, soft
paper-coloured room behind the phone. Calm, clean, legible; emotion comes from UI behaviour, not detail.

## Look
- Flat vector only: rounded rects, circles, single fills. No outlines on UI, no gradients except the
  room background and one soft phone shadow. No emoji glyphs, no logos, no real app chrome.
- The phone is a graphite slab (radius 66, bezel 14) floating in a soft room. Everything else is inside it.
- Max ~6 colours visible per shot. Generous padding (24 px grid inside the screen).

## Palette tokens
| token | hex | use |
|---|---|---|
| room-diary | #F3EADF | background, diary act (warm paper) |
| room-meet | #E2EEEA | background, meeting act (mint) |
| room-blush | #F5E1DE | background, embarrassed beat |
| ink | #1E2433 | primary text, phone body #1C202B |
| sub | #8A8F9C | secondary text, ticks |
| paper | #FBFAF7 | screen background; panel #F1EEE8 |
| you | #24375F | Youssef bubble (white text), jacket |
| suitcase | #E2493F | Youssef accent, LIVE dot, squiggle |
| mia-teal | #17A096 | Mia accent ring, chips; Mia bubble = white, teal name |
| mustard | #E8B13A | Mia cardigan · auburn hair #B4532C |
| blush | #F2898A | cheeks (alpha 0–0.7) |

## UI components (one set, reused every episode)
- Status bar (time 10:24, 3 signal bars, battery), app header (title + small grey subtitle).
- Notes app: Arabic title, attached photo card (radius 22, location chip), RTL dictation: grey interim text, words turn ink on the spoken word.
- Camera viewfinder: full-screen illustration + white shutter ring; flash = white fill 0.15 s.
- Face-to-face mode (landscape): two portrait tiles (Mia left, Youssef right) + chat column between.
  Speaker tile gets an accent ring + live waveform. Header: red LIVE pill "Face-to-face".
- Bubbles: radius 26, tail toward the speaker's tile. Mia = white / ink text; Youssef = navy / white.
  Typing indicator = 3 dots inside a bubble, bouncing 0.6 s cycle. Status: double tick + "heard".
- Reaction chip: small round pill on a bubble corner (teal "?" from Mia). Spell squiggle: suitcase red.

## Avatars
- Shoulders-up, head = rounded oval, no nose line, dot eyes, arc brows, one mouth shape.
- Youssef: skin #A86E4B, short black hair #1B1B22, trimmed beard (darker skin-overlay #2A2024 alpha .85),
  navy jacket + white tee V. Badge: red suitcase. Mia: skin #F4D3BE, auburn ponytail, mustard cardigan,
  teal tee. Expressions are swapped, not tweened: smile / nervous / embarrassed / puzzled; every swap
  "pops" (scale 0.94 → 1, 0.18 s) like a profile picture updating. Talking = mouth open + accent ring pulse.

## Motion rules
- Deterministic f(t). UI enters with eo/back easing 0.25–0.45 s; nothing linear except bus and waveform.
- Words appear on the spoken word (timeline `talk` spans / transcript), never earlier than 0.1 s before.
- The phone always breathes (±0.5°, ±4 px, 5 s period). Mode change = the phone turns to landscape (0.6 s).

## Camera grammar
- Establishing: whole phone in the room (zoom ≈ 0.8). Diary: slow push into the note (→1.25).
- Two-shot: landscape phone fills the frame (≈1.6) — both tiles + chat visible.
- Close-up: push into the speaker's tile (≈2.4) for the emotional beat. Cuts are never hard: all eased moves.
- End: hold, fade to room colour in the last 0.5 s.

## Type
- English UI + bubbles: Inter (600 bubbles 30 px, 500 UI 15–18 px). Arabic: IBM Plex Sans Arabic
  (500 body 36 px, line 60, 700 title), RTL, right-aligned. On screen, bubble text ≥ 44 px after camera zoom.
