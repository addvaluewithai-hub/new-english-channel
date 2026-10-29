# Living Letters (الحروف العايشة) - style sheet

## Look
Flat colour on warm paper. No outlines, no gradients, no textures, no shadows except one
soft drop under chips. Everything on screen is either a letterform or a plain geometric
primitive (rounded rect, circle, stroke). Generous negative space: at most ~35 % of the
frame is "ink" in any shot. The ground is a single paper-dark band; it is also the stage
the spoken English words stand on.

## Palette tokens
| token | hex | use |
|---|---|---|
| paper | #F5EEE1 | sky / background |
| ground | #EADCC4 | ground band = word stage |
| ink | #1F2A44 | eyes, mouths, signs, shoes, Arabic subtitle pill |
| red | #E0412F | London red: bus, suitcase, DAY tag |
| cityA / cityB | #C9D3E8 / #EBD2C6 | architecture letters (alternating), windows = paper @ 60 % |
| youssef | #B5713F | body of "Y"; beard #5B3520; jacket #22315A; his speech #8A4A22 |
| mia | #F2B33D | body of "M"; hair #D9652B; outfit #1D8A84; her speech #13716C |
| school | #CFE4DF | school facade; door #2C3E66 |
| violet | #7B5CD6 | grammar helpers only ("am", the empty slot). Never decoration |
| blush / sweat | #F08A7E / #8FC8EA | emotion marks, max two per shot |

## Typography
- **Bagel Fat One** = the cast. Characters, spoken words, signs, BUS. Heavy round
  strokes are wide enough to carry eyes.
- **Anton** = architecture. Tall condensed caps are buildings (LONDON skyline, towers).
- **Baloo Bhaijaan 2 800** = Arabic narration subtitle, cream on an ink pill, bottom centre,
  RTL, one line, >= 1.8 s on screen.
- Spoken English is set at 68-84 px, speaker-coloured, sentence case, never all caps.

## How letters act
- A character = one capital. Rule of three bands: glyph colour = the character,
  top band = hair, bottom band = outfit. Face sits where the glyph is widest.
- Faces: two white eyes with ink pupils, short ink brows, one tiny mouth. Blush and a
  sweat drop are the only extra marks. Arms are single round-cap strokes in outfit colour
  with a body-colour dot hand; they appear only when needed (wave, pull) and retract.
- Feet are two ink "serifs" under the glyph; walking = alternating serif lifts + body hop.
- Spoken words are born at the speaker's mouth, arc out and land on the ground stage
  with a squash. They stay as long as the sentence matters and can act (I... trembles,
  the ? of Sorry? wobbles). A coloured floor rail under a row = who said it.
- Grammar is visible as space: a missing word is a dashed violet slot; the missing word
  itself is a violet character with eyes that can peek, walk in and fill the slot.

## Motion
- Springs everywhere: overshoot on entry (back 1.6-2.0), squash 0.75-0.85 on landings,
  settle within 0.3-0.4 s. Holds breathe (1-2 % scale) and blink; nothing is ever frozen.
- Type enters by being *typeset*: rises from the ground line or drops from above and lands.
- Everything is a pure function of t (deterministic), 24 fps, no stepping.

## Camera grammar
- One world-to-screen camera (centre + zoom). Moves are eased in log-zoom space.
- Establishing = z 1.0 wide, slow drift. Two-shot = z ~1.1, characters at thirds.
  Close-up = z ~1.8 on one character, ground stage kept in frame for the words.
- Scene changes go *through a letter*: the camera dives into a counter or ring (the O of
  LONDON = the London Eye) and the next place is already living inside it. No hard cuts.
- Screen-space layers on top: subtitle pill, DAY tag, word rows (anchored under speakers).
