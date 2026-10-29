# Silhouettes on Colour (ظلال على ألوان) — style guide

**Look.** A cinema poster at golden hour. Every object is a flat, crisp-edged silhouette; the colour lives in
the sky and in 4 parallax planes that fade toward the horizon (atmospheric haze). No outlines, no textures,
no faces. The only sharp detail is TEXT (English lines, Arabic narration, the school sign).

**Palette tokens** (three moods, interpolated over time; every layer colour derives from the mood):
| token | dusk (base) | warm (joy) | cool (unease) |
|---|---|---|---|
| skyTop / skyMid | #1b1640 / #5a2d68 | #2a1a48 / #7a3a6a | #0f1433 / #2c3466 |
| skyLow / horizon | #d4646c / #f6ad72 | #ec7a62 / #ffc27a | #5d6aa3 / #a3a9cf |
| far / far2 (L1/L2) | #b86a86 / #84466f | #cf7d84 / #9a5270 | #6c6f9f / #4a4c80 |
| mid / road (L3) | #4e2656 / #35203f | #5f2d58 / #40224a | #2e2f5e / #23244a |
| near (L4) / ink (characters) | #22152f / #0f0a16 | #281734 / #120a17 | #171833 / #0a0b17 |
| window light / rim | #ffc370 / #ffd59a | #ffd27a / #ffe0a6 | #f2c98a / #c9d3ff |
Fixed accents: suitcase red `#e5483d` (Youssef's only colour), cardigan teal `#2fa89c` (Mia's only colour),
text cream `#fff4e2`, label red `#ff7a68`, label teal `#62d9cb`. Nothing else is saturated.

**Planes** (parallax p = how much the plane follows camera pan/zoom): L0 sky+sun p .03 · L1 far skyline + clock
tower p .15 · L2 rooftops/trees p .35 · L3 terrace, bus, road p .6 · L4 street, school, characters p 1 ·
L5 foreground leaves p 1.5. A haze gradient (mood `horizon`) rises from the base of L1–L3. Each plane is one flat
colour; the only exceptions are lit windows (warm rectangles) and the door light.

**Silhouette construction.** Characters are rigs of smooth closed paths (head profile, torso) + round-capped
limbs solved with 2-bone IK (hand/foot targets are what we animate). Scale: 1 cm = 1.35 world units.
- Youssef (176 cm): short flat-top hair with a small front quiff, full beard squaring the chin, straight nose,
  blazer silhouette (padded shoulder, open hem notch), trousers, a RED rolling suitcase with telescopic handle.
- Mia (166 cm): rounded crown + high ponytail on a spring (secondary motion), small upturned nose, TEAL
  cardigan (torso + sleeves), A-line skirt, slim legs, flats.
- Profiles only (3/4 views break the read). Keep 20+ cm of air between characters so shapes never merge.
- Characters are darker than anything behind them; stage them against sky glow or a lit doorway.

**Light = speech + emotion.** Each character has a rim of `rim` light on the side facing the sun (2-pass
offset mask). Rim strength 0.35 idle → 0.7 during their line → 1.0 on each spoken word; a soft halo blooms behind
the speaker's head. Mood shifts: dusk → warm on a friendly beat (wave), → cool on confusion ("Sorry?").

**Motion rules.** Poses are keyed (monotone cubic) and always ease; holds keep a 2.2 Hz breath. Acting =
posture first (lean, head pitch, shoulder drop), then one clear hand gesture per beat. Head nods on each
spoken word (≤ 2°). Walks are distance-driven (no foot sliding). Secondary motion: ponytail spring, suitcase
settle. Never more than one big gesture on screen at once.

**Camera grammar.** 1 wide establishing (slow push, ≤ 25 % zoom), 2 two-shot (characters on thirds, sun
between them), 3 close single for the emotional beat. Hard cuts only. Background planes are rendered at
lower resolution as the shot tightens (½ in two-shot, ¼ in close-up) = cheap depth of field.

**Type.** English line = hero: DM Serif Display 96 px cream, centred over the speaker's side of the frame,
words dim (45 %) until spoken, then full + accent underline under the active word. Above it a speaker label:
accent dot + Josefin Sans 600 26 px caps, letter-spaced 9 px, in the speaker's colour, and a hairline pointer
to the speaker's head. Arabic narration: Reem Kufi 500 54 px cream, centred at y 1010 on the dark pavement,
≥ 1.8 s per line. Chapter mark: Josefin caps + Reem Kufi, small, top corner. Soft ink shadow under all text.
