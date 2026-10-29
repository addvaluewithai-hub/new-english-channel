# Treatment — "Silhouettes on Colour" style test (17 s)

**Idea.** Youssef's diary told like a series of cinema posters: London at golden hour, everyone a crisp
silhouette, emotion carried by light. The only sharp detail is the words — which is exactly what a
language channel wants the eye to land on.

| time | shot | picture | light / emotion |
|---|---|---|---|
| 0.0–7.75 | 1 · wide establishing, slow push (×1.0→1.25) | Dusk skyline (clock tower, terraces, trees), red double-decker crossing, lamp post, leaves framing top-left. Youssef strides in pulling his red suitcase, stops, looks up at the backlit ENGLISH SCHOOL sign, two excited bounces, tugs his blazer straight. Door opens (6.6), Mia steps into the lit doorway (7.4). | dusk rose → door light spills onto the pavement |
| 7.75–15.4 | 2 · two-shot, sun between them | Youssef against the sky glow, Mia framed by the lit doorway. "Hi! I'm Mia." = big wave (ponytail swings). "Hello! I... I Youssef." = stiff wave, look-down hesitation, hand to chest, searching look up, pat, open-hand "Youssef." Mia cocks her head (13.8), leans in palm-up: "Sorry?" | sky warms on the wave; the speaker's rim lights up word by word; cool shift on "Sorry?" |
| 15.4–17.0 | 3 · close single on Youssef | Profile against a pale, defocused sun. Shoulders drop, head bows, hand goes to the back of his head and scratches. Fade out from 16.5. | full cool palette; door light (Mia) as a warm strip at frame right |

**Text.** Arabic diary narration (Reem Kufi) bottom-centre on the dark pavement, 3 lines ≥ 2 s each.
English lines (DM Serif Display) sit in the same lower band, under the speaker, with a coloured name label
(red = Youssef, teal = Mia), a hairline to the speaker's feet (an arrow when the speaker is off-screen), and
karaoke words: dim until spoken, then full with an accent underline.

**Build.** `index.html` + `main.js` (Canvas2D, deterministic `render(t)`), fonts self-hosted. Render:
`node core/render/video.mjs <dir> --fps 24 --workers 2 --out <dir>/out/video.mp4`, then
`sh mux_local.sh out/video.mp4 ../audio/test_audio.wav silhouettes.mp4 24 2`.
