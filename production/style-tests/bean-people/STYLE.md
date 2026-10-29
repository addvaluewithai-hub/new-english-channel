# Bean People (ناس الفول) — style sheet

**Look.** Flat vector storybook: soft, rounded, no outlines anywhere. Every shape is a filled path.
Depth comes from flat value steps (tints toward cream, shades toward ink), never gradients.
Light comes from the upper left; one flat shade crescent per volume, lower right. A faint static
paper tooth (≈5 % noise, screen-space) sits over everything so flats don't feel digital.

**Palette (world = 7 tokens).** `ink #1E2235` · `cream #FAF3E6` · `sky #BFE0E6` · `teal #2B9488` ·
`mustard #F0B53F` · `tomato #E2523F` · `navy #2C3E70`.
Derived only by `tint(c,k)` = mix toward cream (k ∈ .35/.55/.65/.8) and `shade(c,k)` = mix toward ink (k ≈ .25).
Character-only tokens: Youssef bean `#A8653F`, Mia bean `#F4BC98`, Mia hair `#B5492A`.
Tomato is reserved for "Youssef things" (suitcase, bus, blush); teal for "Mia things" (hem, bow, name tab).

**Character construction.**
- Body = one capsule ("bean"): domed top, softly squared bottom, sides bulge 3 %. Height ≈ 1.65–1.7× width.
- Clothing = a colour band clipped to the bean (lower ~40 %). Hair = a cap clipped to the bean + one
  silhouette accessory outside it (Youssef: quiff; Mia: ponytail + teal bow).
- Face lives in the top third and slides sideways with `facing` (−1…1): that is the whole "turn".
- Eyes = ink dots with one cream catch-light; blink = vertical squash; joy = upward arcs.
- Brows = short rounded bars (raise / worry tilt / one-sided arch). Mouth = one stroke, or a filled
  D-shape when open (ink with a tomato tongue). No noses, no ears, no fingers.
- Limbs: stubby sleeve stroke + round hand nub, tiny shoe ovals. Hands only exist to wave, point, hold.
- Contact shadow = flat ink ellipse 14 % that shrinks with lift.

**Motion.**
- Everything moves on eased curves (ease-in-out for travel, back-ease for pops, damped spring for landings).
- Squash & stretch preserves area (`w = 1/√s`); pivot at the feet. Anticipation squash before every hop.
- Walk = bounce per step + alternating shoe ovals; speech = mouth on word spans, plus a small body bob.
- Secondary motion (ponytail, sweat drop) is a pure function of the body's recent velocity — deterministic.
- Holds are never dead: blinks on a schedule, ~1 % breathing scale.

**Camera grammar.**
- One world, one `world → screen` function with per-layer parallax (sky 0, skyline .25–.45, street 1).
- Establishing wide → slow eased push following the hero → two-shot (characters ≈ 40 % frame height)
  → snap-zoom (0.3 s, ease-out) to a close-up for the emotional beat.
- Transitions are geometric: iris-in to open, iris-out on the hero's face to close.

**Type.**
- English dialogue: Fredoka 600 in cream rounded bubbles with a flat drop shadow; a name tab in the
  speaker's colour (Lilita One). Words karaoke-darken as they are spoken (learners see the timing).
- Arabic narration: Baloo Bhaijaan 2 800, cream on an ink pill at the bottom, RTL, ≥ 1.8 s per line,
  with a small mustard "diary" mark at the right (start) edge.
- Signage: Lilita One. Teaching hints (e.g. a missing-word slot) are mustard dashed boxes.
