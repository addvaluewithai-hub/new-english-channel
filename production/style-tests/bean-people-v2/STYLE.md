# Bean People v2 — style guide ("Youssef in London")

Minimal, polished flat-vector. Every shape has one soft crescent shade plus a rim light. Faces are big and read at phone size. Warm London daylight.
Code: `kit.js` (tokens, form pass), `bean.js` (characters), `world.js` (street), `ui.js` (type), `main.js` (`?sheet=1|2|3`, `?frame=1|2|3`).

## Palette: 8 tokens (everything else is mixed from these)
| token | hex | use |
|---|---|---|
| ink | #2A2742 | pupils, mouths, text, darks (no black anywhere) |
| cream | #FFF6E8 | sclera, bubbles, stucco, window frames, tees |
| sky | #9BD3EC | sky, glass (mixed with navy), haze |
| red | #E8483A | suitcase, bus, phone box, Mia's shoes |
| navy | #2E3D7C | Youssef's jacket, school sign, lamp posts, his name tab |
| mustard | #F5B63E | Mia's cardigan, trims, word highlighter |
| teal | #1E9D93 | Mia's skirt and hair tie, school door, planters |
| leaf | #69B464 | trees, window boxes |
Materials: skin Youssef #B9773F, Mia #F9CDAA · hair #24203A / #CB5530. Shade is a cool violet #6F62A8 (multiply), so the light is warm and the shadows cool. Pastels = token + cream.

## Construction (shared by every character; a new character is a new `CAST` entry)
- **Bean:** one superellipse egg (n≈2.4–2.5) with a slight pear taper (0.11–0.15). Head and body are one shape. Height H: Youssef 1.00, Mia 0.92.
- **Vertical map (fraction of H from the ground):** eyes .665 · brows .78 · mouth .548 · blush .585 · clothing line .45 · shoulders .375. The face sits in the top 55 %.
- **Placement by longitude φ:** each surface feature has an angle around the bean, so turn −1…1 gives front, 3/4 and side views from the same code. Hidden features (cos < .12) drop out.
- **Eyes:** cream sclera 0.061×0.077 H with a violet top shadow, pupil 0.045 H with two specular dots, and an ink lash line (Mia adds an outer flick). The lids are the edges of the visible eye: the upper lid is for acting, the lower lid is the cheek push of a smile. Variants: happy ∩ arc, blink line.
- **Brows:** rounded capsules (0.088 × 0.031 H) with a slight arch. Two numbers per brow: lift and tilt (tilt > 0 = inner end up = worried; < 0 = cross). Check the direction at final size.
- **Mouth (parametric):** width, open, smile, wobble, teeth, asym. Closed = an ink stroke; open = a maroon "D" with tongue and teeth. The shapes are rest, A, E, O, smile, wobbly, gritted and skew, and any two blend frame to frame.
- **Blush + sweat:** blush ovals at all times (stronger on brown skin). Embarrassed adds `///` hatch lines and a light-blue drop on the temple.
- **Arms:** a stubby stroked quadratic (0.082 H), shaded by an offset darker stroke, ending in a round hand (0.047 H). Poses are hand offsets from the shoulder plus a bend: rest, out, pull, wave, chest, scratch, shrug, hip. When the body turns, the far arm goes behind the body.
- **Feet:** tiny ovals (Youssef dark brown, Mia red), partly under the bean.
- **Hair:** a cap above a hairline function of φ, clipped to a slightly inflated bean for volume, with a soft cast shadow on the forehead and a sheen arc. Youssef: side-swept fringe and a front quiff, clean-shaven. Mia: scalloped bangs, side tendrils, a high ponytail on a spring and a teal tie.
- **Clothes:** bands follow the surface. Youssef wears a navy jacket with a V, lapels and one button over a white tee. Mia wears a mustard cardigan with a scoop, placket, buttons and ribbed hem, a cream top and a teal skirt.
- **Form pass (`formed`):** render the object flat, then multiply a crescent (the silhouette minus itself shifted toward the light, edge blurred about 1.6 % of H). Add bottom occlusion and a screen rim light on the upper-left. Light always comes from the upper-left.
- **Contact shadow:** a soft violet radial ellipse (0.44 × 0.065 H), shifted right. It stays on the ground and shrinks during a hop.

## Motion rules (Phase 2)
- **Anticipation → action → follow-through** on every gesture. A wave dips the arm first; a "Sorry?" lean overshoots and settles (`back`, `spring`).
- **Squash & stretch:** `sq` scales about the ground and keeps the volume (x = 1/√sq). Squash to 0.9 on landings, stretch to 1.07 in the air.
- **Hop-walk:** steps 0.42 s apart. Each step goes squash, lift (parabola, ≈ 0.1 H), stretch, then a damped landing squash. Feet alternate and the body leans ≈ 0.05 into the walk. The suitcase follows with a 0.06 s lag and a wheel wobble.
- **Idle:** breathing ±1.2 % stretch on a 3.2 s cycle, eyes darting every 1.5–2.5 s (pupils lead the head by 2 frames).
- **Blink:** 0.14 s, every 2.5–4 s (seeded), and on every major expression change.
- **Ponytail:** a damped spring on the body's vertical speed and lean (overshoot 30 %, settles in ≈ 0.6 s). The quiff gets the same at 1/4.
- **Expressions blend** over 4–6 frames, never popping. Exception: one deliberate pop for the "Sorry?" freeze. Lip sync comes from the timeline's `talk` spans: A/E/O cycle per word and close between words.
- **Mia's "Sorry?" is at 15.05–15.39 s** in the audio (the timeline says 14.5). Youssef's embarrassment starts after it (≈ 15.5 s).

## Camera grammar
- **One world → screen function** (`toScreen`) and parallax layers: sky 0, far skyline .12, across-the-road terrace and bus .45, our pavement and the school 1, lamp foreground 1.3.
- **Atmospheric fade:** far +85 % haze, mid +24 %. Close shots blur the background as depth of field (mid/far ≈ 2 px in the two-shot, everything ≈ 6–9 px in the close-up).
- **Shots:** wide establishing (truck right with Youssef) → push in to a two-shot at the door (Mia's entrance) → slow push during his line → **cut-in close-up on his face** for "Sorry?" and the embarrassed hold.
- **Framing:** at key moments the subject is ≥ 1/3 of the frame height. Captions and bubbles never cover faces. The camera eases with `eio`, and holds at least 0.8 s before a move.

## Type
- **English bubbles:** Fredoka 600 at **64 px**, ink on #FFFDF8, radius 44, flat violet drop shadow, curved tail to the speaker's head. Name tab in Lilita One 30 px: YOUSSEF navy, MIA rust #C24A28. Upcoming words show at 30 % ink, spoken words at full ink, and the current word gets a mustard highlighter swash. The bubble pops in with `back` overshoot from the tail.
- **Arabic narration:** Baloo Bhaijaan 2 700 at 54 px, RTL, cream on an ink plate (86 %) centred at the bottom, with a navy "يوسف" tab on the right. Words light up right to left as narrated; the current word is mustard.
- **Sign:** Lilita One, cream on navy with a mustard keyline. No brands, logos or real people; landmarks are generic.
