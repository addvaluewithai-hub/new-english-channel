# Treatment — "First Day" (style test, 80s Cel Anime, daylight)

17 s, 1920×1080, 24 fps. Picture only: the voice track `audio/test_audio.wav` and `timeline.json` are fixed.

## Three candidate structures
1. **Small hero in a huge painted world → two-hander → gag reaction** (chosen). A multiplane crane down a tall painted London plate finds a tiny flat Youssef; a side-track walk to the school; a locked two-shot at the door; a reaction punch-in on Youssef. Uses two native moves of the style (small flat hero in a huge painted world; stillness/held close-up with a light-band sweep) and the anime gag vocabulary (sweat drop, blush, flat gag background) that a comedy-of-errors series will reuse every episode.
2. **Mock opening credits**: roster cards (Youssef, Mia) with chrome name titles, then the dialogue. Strong style flavour but it spends the narration on titles instead of the story.
3. **In the middle of a conversation**: open on the two-shot, narration as a flashback. Loses the "arrival" the narration describes.

Why 1: the narration is literally an arrival ("my first day in London"), so the world must be shown first; the dialogue is a two-hander; the punchline is a reaction. Opening image = the sky over London; ending = a held close-up of the embarrassed hero (an anime "freeze" ending a series can reuse as its episode-end beat).

## Logline and arc
A confident new arrival discovers, in one word, that his English isn't as good as he thought.
Setup (arrival, hope) → turn ("I... I Youssef." / "Sorry?") → ending (held embarrassed close-up).

## Benchmark
Late-80s OVA / TV slice-of-life openings in daylight: painted skies with lit cumulus undersides, flat cels with hard shadow crescents, held drawings with cycles, deadpan reaction close-ups.
Learn: plate-vs-cel contrast, limited-animation timing, crane reveal, sweat-drop/blush gag grammar, held bust with light band.
Don't take: any character design, logo, shot or place name from a specific work.

## Colour model (daylight, 色指定)
Sky cobalt → pale horizon, white cumulus with warm-grey undersides; brick terraces in warm red-brown with cream trim; slate roofs blue-grey; pavement warm grey; bus signal red. Youssef's accent = his **red suitcase** (pops in every set). Lines: skin warm dark brown, hair dark purple, clothes dark version of fill. Bloom is driven by an emissive plate (sun glints on windows, clock face, sky near the sun, school sign) — daylight "backlit cel" = sun flare and window glints.

## Shot list
| # | t | Framing / move | Why |
|---|---|---|---|
| 1 | 0.0–4.1 | Extreme wide, **multiplane crane down** a tall painted plate: sky + clouds → clock tower → terraced street; red double-decker crosses on ones; tiny Youssef enters with suitcase | A world revealed layer by layer; small hero in a huge world |
| 2 | 4.1–6.4 | Full shot, **side tracking with 4 parallax layers** (houses, railings, lamp posts in fg); Youssef walks on twos, looks around excited | Momentum, his excitement/nerves |
| 3 | 6.4–7.6 | Low angle on the ENGLISH SCHOOL façade, slow tilt up; door opens, Mia steps out at 7.4 | "until I met Mia" lands on her entrance |
| 4 | 7.6–14.45 | **Locked two-shot** with lip flaps, slight push-in after 12.8; Mia waves; Youssef hesitates (hand to neck, eyes darting); Mia's brows knit from 13.7 | Conversation grammar |
| 5 | 14.45–15.55 | Medium close-up of Mia, head tilt, one brow up: "Sorry?" | Her puzzlement must read |
| 6 | 15.55–17.0 | **Close-up of Youssef**, flat gag background + light-band sweep, sweat drop slides, blush, frozen smile; fade from 16.5 | Held peak; the embarrassed beat |

Cuts are hard cuts (style: no dissolves); one white flash into shot 6.

## Motion
Characters on twos (12 fps); blinks, lip flaps, gestures on threes (8 fps); camera, bus and light bands on ones. Hair/cloth ribbons on a 4-drawing cycle.

## Sound
Fixed voice track supplied; no score or foley added in this test (picture only).

## Subtitles
On the tape, composited inside the CRT pass. Arabic narration: Baloo Bhaijaan 2 (800), cream-yellow with thick dark-brown outline, RTL, split into 2 lines of ≥ 1.8 s. English dialogue: Barlow Semi Condensed 600 ~56 px cream-yellow for Youssef, a second colour (pale cyan) for Mia, each with a small boxed speaker tag.

## As built (notes after production)
- Screen direction kept left→right: Youssef walks right, so in the two-shot he stands on the LEFT facing right and Mia on the step on the RIGHT, mirrored to face him; Mia's MCU faces left, Youssef's CU faces right (shot/reverse-shot).
- Shot 1 crane 0–4.1 s (far plate 0.6× vs near plate, foreground lamp post fastest; the bus crosses on ones and reveals tiny Youssef); shot 2 side-track 4.1–6.2; shot 3 low-angle school with keystone, gold sign light-sweep + star glint, doors open at 7.2 and Mia steps out at 7.34; shot 4 two-shot 7.6–14.45 (push-in from 12.9); shot 5 Mia MCU 14.45–15.55; shot 6 two-frame impact frame (black silhouette over radial lines) + 5 frames of tape tracking noise, then the held CU with light bands, sliding sweat drop and blush; fade 16.45–17.0. CRT power-on 0–0.45 s.
- Characters: one head function per character (3/4 view + mirror) and one body rig; expressions = presets (brows, lids, iris size, mouth set); lip flaps from timeline.json `talk` spans at 8 fps; characters on twos, blinks/flaps on threes.
- Mux: core/render/mux.sh refused the supplied WAV (its decoded-length check stops ~2.9 s short because of loudnorm's look-ahead in this ffmpeg build), so the same command it runs (two-pass loudnorm −14 LUFS/−1.2 dBTP, noise c0s=2, x264 CRF 19, AAC 256k) was run by hand; result −14.0 LUFS, peak −1.2 dB, 17.000 s.
