# "Day 1: London" — 16-bit Pixel RPG style test (17 s)

## Three candidate structures
1. **Quest log.** The diary is a quest journal: DAY 1 title over a side-scrolling London street, a status window boasts ENGLISH ★★★★★, the school door is the "dungeon entrance", the conversation is the encounter, and "Sorry?" knocks the stat down star by star. Game UI tells the inner story.
2. **Save file.** Opens on a save screen ("FILE 1 · CAIRO") → NEW FILE "LONDON" loads; the episode plays; ends on a save prompt. Strong series bookend, but the save screen eats the hook seconds and the 17 s has no room for it.
3. **Battle encounter.** Mia appears with the encounter swirl and the dialogue plays as a turn-based battle (YOUSSEF used HELLO!). Funny, but it turns a friendly teacher into an "enemy" — wrong tone for a learning series.

**Chosen: 1, Quest log.** It keeps Mia friendly, the stat window is a reusable series device (every episode can raise or drop a skill), and the drop of ★★★★★ is a visual joke an Arabic speaker reads without English.

## Logline and arc
On his first day in London, Youssef rolls his red suitcase to the English school, sure his English is five-star — until one missing word makes the stat crash.
Setup: proud arrival (stat ★★★★★). Turn: "Hello! I... I Youssef." / "Sorry?". End: stars blink out, he turns to us, sweating.

## Benchmark
Mid-90s console RPG town scenes and their dialogue system (portrait boxes that type, status windows, screen shake). Learn: legible locked framings, face acting in portraits, UI as a narrator, integer-pixel camera. Don't take: any game's UI frames, fonts, characters, melodies.

## Shot list
| # | Time | Framing / angle | Move | Why |
|---|---|---|---|---|
| A1 | 0.0–1.8 | Wide: sky, clock tower far, roofs; title "DAY 1 · LONDON" | integer-pixel tilt down sky → street | hook: we are in a game world; scale of the city |
| A2 | 1.8–7.0 | Wide side view, street with terraced houses, red double-decker in the road layer | side-scroll tracking Youssef (parallax: tower / houses / road) | journey, excitement; bus pass gives energy |
| A3 | 5.6–7.0 | Same, camera settles on the ENGLISH SCHOOL; Youssef stops at the door, looks up | camera locks | arrival, nerves |
| — | 7.0 | mosaic cross (peak = cut) | transition in the medium | |
| B1 | 7.0–14.5 | Two-shot, 3/4 top-down RPG town view: school door top-centre, Mia in doorway facing us, Youssef back view at the threshold | locked, 1-px breathing | "back view at a threshold" = first day; dialogue staging |
| B2 | 14.5–15.4 | Same; "Sorry?" | screen shake 3-2-1 px | the hit |
| B3 | 15.4–17.0 | Youssef turns to face camera (sweat, blush); dialogue box with his embarrassed portrait; stat window drops ★★★★★ → ★☆☆☆☆ | lock, palette step fade at 16.5 | closer beat carried by the portrait (style's close-up) |

## Beat sheet
- 0.0 palette steps up from black (4 levels). 0.3 title window types "DAY 1 · LONDON".
- 0.7–2.75 Arabic sub 1 · 2.75–5.9 sub 2 · 5.9–7.9 sub 3 (aligned to the diary word timings, +0.6 s offset).
- 1.0–4.2 bus drives right→left in the road layer.
- 3.3 status window slides in: "YOUSSEF / ENGLISH ★★★★★" (on "...الإنجليزي بتاعي كويس").
- 6.3 Youssef stops, looks up at the sign; 6.6 sweat-free nervous hop.
- 7.0 mosaic cut to two-shot. 7.4 door slides open, Mia steps out.
- 8.0 Mia box types "Hi! I'm Mia." + wave (8.0–9.5).
- 9.9 Youssef box "Hello! I... I Youssef." types with the pauses of the voice; cursor ▼ stops while he hesitates.
- 14.5 Mia "Sorry?" puzzled portrait, head tilt, "?" bubble; shake.
- 15.4 Youssef turns to us, sweat drop, blush; box: Youssef embarrassed portrait "......"; stars blink out one by one 15.6–16.4.
- 16.5–17.0 palette step fade to black.

## Cue map / sound
The voice track (`test_audio.wav`) is final and is the only audio: narration 0.6–7.7, dialogue per `timeline.json`. Picture events lock to it: text typing follows the `talk` spans, mouths flap only inside `talk` spans, shake on 14.5, stat drop starts after "Sorry?" ends (15.5). No score added in this test (a series would add a chip score: pulse lead + triangle bass + echo, ducked 8 dB under voice, and text blips per speaker).

## Subtitle and title design
- English lines: the RPG dialog box in the framebuffer (bottom quarter), 32×32 portrait left, original variable-width pixel font (cap 7 px) with 1-px shadow, typing ~38 cps, ▼ blink when done, name tab above.
- Arabic narration: same box skin ("diary" variant with a notebook icon instead of a portrait); the Arabic itself is drawn crisp in Baloo Bhaijaan 2 at 1080p (RTL, right-aligned) because no OFL pixel Arabic face reads well at this size.
- Title "DAY 1 · LONDON" in the pixel font at 2×, ink outline, row gradient.
