# "First Day" — Mid-century Cartoon style test (17 s)

Series: Youssef, 26, Egyptian engineer, just arrived in London; each episode is a diary page narrated by him in Egyptian Arabic. This clip is a style pitch: the same 17 s scene every style test uses, told in 1950s flat / limited animation.

## Three candidate structures

1. **A single tracking walk (chosen).** One sideways "stand" pan follows Youssef along a flat-colour London street (terraces, a bus, a far clock tower) to a school door; a colour-block wipe turns the page to the doorstep two-shot; an iris from his head opens the close-up of his embarrassment; an iris-out closes on his face. The diary voice reads like a classroom-film narrator over a walk, which is exactly what the style does best (held bodies, moving legs/hands, captions on cards).
2. **Diary page.** Open on a paper diary page with a stamped date medallion; the street is a picture pasted on the page, then the camera pushes into it. Charming, but costs 2 s of the 7.7 s before Youssef is even in London.
3. **Split frame Cairo / London.** Two colour blocks, Cairo left, London right; Youssef steps across the line. Strong idea for an opening titles card, too much information for the first 7 s of a test clip.

Chosen: 1. It shows the set (street, school) and both characters in the style's own grammar, and its devices (wipe, iris, call-out bubble, iris-out) are reusable in every episode.

## Logline and arc
A nervous new arrival thinks his English is fine — until the first "Hi" at the school door.
Setup: bright street, suitcase, hopeful walk → Turn: Mia greets him, he answers "I... I Youssef." → End: "Sorry?" — he shrinks, blushes, the last circle closes on him.

## Benchmark (grammar only)
- 1950s UPA-era limited animation shorts: flat colour planes for rooms, geometric people, held bodies with only heads/hands moving, off-register colour. Learn: staging in profile on a single plane, colour as emotion (the ground changes colour for the close-up). Don't take: any character, drawing, lettering or music.
- 1950s classroom films: one sentence per picture, a caption card for every line. Learn: the caption card as the subtitle device.

## Shot list
| # | Time | Framing | Move | Why |
|---|---|---|---|---|
| 1 | 0.0–7.6 | Wide street, Youssef full figure (~1/3 frame height+) | Slow truck right on the stand following him; houses in front of a far skyline plane (two-layer parallax); a red bus crosses behind him the other way | Establish London and the walk to school in one take; the bus gives the city life without moving the held figure |
| — | 7.4–7.9 | Mia's door swings open on the school (door cel pops, starburst) | — | Mia appears on the beat 7.4 |
| T1 | 7.6–8.0 | Colour-block wipe (mustard block sweeps left→right) | 24 fps | "Turning the manual's page" to the doorstep |
| 2 | 8.0–14.75 | Two-shot, full figures at the school door: Mia left at door, Youssef right with suitcase | Slow push (≈6 %) | Dialogue; push collects the eye toward the mistake |
| T2 | 14.75–15.15 | Iris opening on Youssef's head: his face appears first as a round call-out (drawn at native line weight), then the circle grows to full frame | — | Circle to circle: the close-up *is* the call-out (signature move) |
| 3 | 15.1–17.0 | Close-up on Youssef (head and shoulders, drawn at native scale), coral ground with slow sunburst | Tiny push, then iris-out on his face 16.45–17.0 | Embarrassment; the last circle |

## Beat sheet
- 0.0 street already moving; Youssef walking in from the left, suitcase rolling.
- 0.6–2.6 sub 1 "أول يوم ليّا في لندن…" — Youssef looks up at the city.
- 2.6–5.6 sub 2 "وكنت فاكر إن الإنجليزي بتاعي كويس." — he straightens his jacket, proud (hand action), bus passes behind.
- 5.6–7.9 sub 3 "لحد ما قابلت ميا." — camera reaches the ENGLISH SCHOOL, he stops; 7.4 door opens, Mia steps out.
- 8.0–9.5 Mia "Hi! I'm Mia." — wave (anticipation, two swings, settle).
- 9.9–13.6 Youssef "Hello! I... I Youssef." — hand up to chest, nervous eyes, a sweat drop on the "I... I".
- 14.5 Mia "Sorry?" — head tilt, one brow up, a "?" ornament.
- 14.6 embarrassed: iris into the close-up — blush plane, eyes aside, sweat drops, shrink, hand at back of neck.
- 16.45–17.0 iris-out on his face.

## Cue map
No new music in this test: the finished voice track (`test_audio.wav`) is used unchanged so all nine styles compare on the same sound. Every visual hit is timed to `timeline.json` (lines, `talk` spans, beats). In a full episode the cool-jazz combo (vibraphone, flute, walking bass, brushes) would sit under this, with silence on the beat before "Sorry?".

## Sound design (for the series; not mixed into this test)
| Section | Ambience | Foley | Music |
|---|---|---|---|
| Street | low city bed, bus rumble pass | suitcase wheels clack on twos, footsteps | walking-bass + vibes, brushes |
| Doorstep | room tone at the door | door creak, wave swish | flute line under Mia, drop out before "Sorry?" |
| Close-up | silence, then a single muted-trumpet "wah" | sweat-drop pip, iris "shhk" | — |

## Subtitles and English lines
- Arabic diary narration: the style's **caption card** (paper slab, thin ink border, off-register colour cel, small turning stars), bottom-centre, RTL, Baloo Bhaijaan 2, three cards each ≥ 2.1 s.
- English dialogue: **round call-out bubbles** (paper card, ink ribbon, leader tail to the speaker's mouth), popping in with a back-ease on the line's t0, in Jost 600 with the speaker's name tag in Oleo Script; held to t1 + 0.6 s.
- Sign "ENGLISH SCHOOL" in Alfa Slab One, two-plate (ink over offset colour).

## Not the demo (checked after reading DEMO.md)
Structure (narrative walk → dialogue → reaction, not a step guide), opening (a moving street, not a product reveal), signature shot (face call-out iris into the embarrassment close-up, not a route pull-back), camera path (truck right → colour-block wipe → slow push → iris → iris-out on a face) and ending (iris-out on a blushing face, no end card) all differ from the demo. Shared on purpose: the style's own vocabulary (off-register cels, caption card, iris, colour-block wipe).

## Build notes
- `engine/toon.js` is the style engine with two additions: `LW.k` (ink width multiplier) and `REG.k` (register offset multiplier), so characters keep ~4 px lines and ~6 px off-register at any scale (wide 0.64×, two-shot 1×, close-up 2.6×).
- `chars.js`: Youssef and Mia rigs (held bodies, IK arms, ribbon legs with a walk cycle on twos, three-shape lip flaps from `timeline.json` `talk` spans, blush cel, sweat drops, rolling suitcase).
- `main.js`: three scenes, the transitions, the caption card (Baloo Bhaijaan 2, RTL) and the English bubbles (Jost 600 with an Oleo Script name tab), `TEXTS` for readcheck.
- `mux_local.sh`: copy of `core/render/mux.sh` with only the decoded-length check disabled (the 17 s track decodes fully; the check misreads it). Grain 3.
