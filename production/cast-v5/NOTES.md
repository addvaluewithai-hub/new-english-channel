# Cast v5 — "flat people" (design stills only)

This folder holds design stills only. No episode or `production/lib/` file was changed.
- Page: `index.html` + `main.js`, using the lemo-opuscar contract (`window.DUR`, `window.render(t)`, `window.READY`).
- Views: `?v=lineup`, `?v=sheet&who=youssef|sara`, `?v=coffee`, `?v=coffeeflat`, `?v=bench`.
- Rig: `cast.js`, about 590 lines and self-contained. It needs only `/core/lib.js`.
- Sets: `ep02set/` holds unchanged copies of ep02's `world.js`, `kit.js` and `bean.js`. The render server only serves this folder, and `world.js` imports `bean.js` for the suitcase. `hallflat.js` is the flattened hallway.

Render commands (from `/home/user/ref/lemo-opuscar`, with `PLAYWRIGHT_CHROME` set):
```
node core/render/still.mjs <dir> 0 --q 'v=lineup' --size 2400x1350
node core/render/still.mjs <dir> 0 --q 'v=sheet&who=sara' --size 2560x1620
node core/render/still.mjs <dir> 0 --q 'v=coffee'          # 1920x1080
```

## Design rules
**Shape language (silhouette first).** Each character is a different geometric silhouette, and the black silhouette row in `cast_lineup.jpg` is the test for it:

| character | height (px @1) | silhouette idea | signature shape |
|---|---|---|---|
| Youssef | ~410 | average rectangle; squared jaw (jaw n 3.1) | short curly crown, open navy blazer V |
| Sara | ~450 + tail | tall, slim, narrow waist | high ponytail comma, round glasses |
| Mrs. Lopez | ~330 | short and wide barrel (shoulders 132, hips 158) | bun on top, red round glasses, crossed arms |
| Ana | ~390 | triangle: bob on top, A-line skirt flaring 1.75x | wavy bob with a teal clip |
| Leo | ~470 incl. hair | tallest, lanky, boxy hoodie | big curly cloud crown |
| Mei | ~345 | small, oversized-sweater block | helmet bob with blunt bangs |

**Proportions.**
- The head is about 1 : 3.4 of the body height. That is adult, but still big enough to read a face on a phone.
- Eyes sit at the head's vertical middle (+.055 h). Brows sit at −.135 h, the nose at +.2 h and the mouth at +.33 h.
- Necks are visible. Lopez's neck is nearly hidden on purpose, because she is the older and stockier one.
- Legs make up 30–45 % of the height and differ per character.

**Construction.** Every part is a separate shape:
- The head is a superellipse with separate top and jaw exponents plus a chin taper.
- The neck is drawn in the darker skin tone.
- The torso is a trapezoid with rounded shoulders, and the clothes are clipped to it.
- Arms are uniform round-capped tubes in 2 segments, solved by angles or by 2-bone IK, and end in mitten hands: `relax`, `open`, `wave` (finger hints), `point` (index finger), `fist`/`hold`, `flat`.
- Legs are 2-segment tubes ending in a shoe profile.

**Turn.** `turn` 0 / .5 / 1 gives the front, 3/4 and side views from the same code.
- Face features are placed by longitude on the head, as in bean v2.
- The far arm and far leg move behind the body and take their flat shadow tone.

**Flat rules.**
- Solid fills only: no gradients, gloss, rim light or form pass.
- Each part gets at most one flat darker shape: lapels and blazer front, the ribbed hems, the ponytail's inner curl, curl separations, the neck, the eye-lid plane, the far limbs and one skirt fold.
- The only translucent element is the flat contact-shadow ellipse.

**Line / no-line decision: no outlines.** Shapes separate by colour. There is one exception: where a limb crosses its own body in the same colour (navy sleeve on navy blazer), a 2.5 px darker edge is drawn, clipped to the torso. Without it, crossed arms and a cup held at the chest became a single blob.

**Face kit.** The adult acting comes from the lids, not from sparkle.
- **Eyes:** white with a big dark pupil, no highlight. A skin-toned upper lid sits over the eye, closing 0–1 and tilting for sad or angry. It has a heavy ink lash line along its edge. A lower lid pushes up for a smile. Two other eye shapes exist: the happy ∩ and the closed eye.
- **Brows:** thick, with lift and tilt set per side, which is how the skeptical face gets one brow up.
- **Nose:** a small flat darker wedge in the front and 3/4 views; a profile bump in the side view.
- **Blush and sweat:** temporary, embarrassed only. There is no permanent blush.
- **Mouths:** X (rest) and A–H match `lib/lipsync.py`'s Preston Blair set. The expression mouths are smile, grin, laugh, flat, frown, smirk, wavy, o, yawn and bite.
- **Presets:** neutral, kind, happy, embarrassed, shocked, skeptical, laughing, sleepy, confident, worried, talk.

**Poses** (`ARM`, mirrored to arm b with `B()`): rest, wave, point, hip, chest, cup, offer, scratch, crossTop + crossUnder, shrug.
- `WALK` holds 4 keys: contact, down, passing, up.
- The ground is solved from the lowest foot. A walk therefore bobs on its own, and nothing hops.

## Palette per character (tokens + mixes)
- **Youssef:**
  - skin `#B87A4B`, hair and brows `#2B2233`
  - blazer navy `#2E3D7C` over a cream tee `#FFF6E8`
  - grey-denim trousers (`#6E7C9C` mixed toward `#9AA3B5`), ink shoes
- **Sara:**
  - skin `#F6CDB0`, hair ginger = mix(red, mustard, .38)
  - mustard cardigan over a cream top, teal trousers, red shoes
  - navy glasses, teal hair tie
- **Mrs. Lopez:**
  - skin `#D9A27C`, hair grey-lilac `#C9C6D6`
  - sage cardigan = mix(mix(leaf, grey), cream) over a cream blouse
  - navy-ink skirt, red glasses, navy name badge
- **Ana:** skin `#D8A47F` (olive), hair `#3A2630`, teal clip, red tee, navy A-line skirt.
- **Leo:**
  - skin `#8A5A3C`, hair `#2A1E26`
  - green hoodie = mix(leaf, `#3E8A4A`) with cream drawstrings
  - jeans = mix(navy, sky), cream sneakers
- **Mei:**
  - skin `#F2CFA6`, hair `#1F1A2A`
  - lilac sweater = mix(mix(navy, red, .3), cream, .52) with a cream collar
  - ink-navy trousers with cuffs, cream sneakers

## What would change in the episodes to adopt it
1. Swap `bean.js` for `cast.js` in each episode. The signature is `drawChar(c, id, x, groundY, scale, pose)`. The pose fields map like this:
   - `turn` replaces `turn`.
   - `dir` replaces the bean's negative turn: −1 = facing left.
   - Expression faces come from `face(name, overrides)`.
   - Both arms are set in `arms:{a,b}`.
   - Props attach to a hand: `prop:{hand, draw}`.
2. Scale. Humans are about 1.5x taller than the beans: the beans were H 270 at k .9, the humans are ~420 world px. Two-shot cameras need about 15 % less zoom, or characters drawn at ~0.75 scale. Speech-bubble anchors must move to the new head centre (`over` callback gives `headC`).
3. Re-map `act.js`:
   - The acting vocabulary (`EXPR`, `ARM.*`, `PULL`, `CUP`, `REACH`…) moves to lid, brow and mouth parameters and IK targets.
   - `liveFace` / lip sync only needs to set `face.mouth` to the viseme letter. The shapes are already A–H, so there is no parameter blending. Viseme crossfades can be 1-frame pops, which is standard for flat style.
   - Hop-walks become the 4-key `WALK`, interpolated per step (lerp the angles), at about 0.5 s per step.
   - Squash & stretch on bodies goes away. Keep it only on props and FX.
   - The ponytail spring can drive `po.swing`.
4. The bean form pass (`formed()`: crescent shade, rim light, blur) is no longer used on characters, which removes the per-character offscreen blur.
5. The sets: see the next section. The current ep02 sets still carry gradients, drop shadows and a cast window light. Next to flat characters, they read as a second style.

## Sets: keep or flatten?
Compare `frame_coffee.jpg` (ep02 hallway as-is) with `frame_coffee_flatbg.jpg` (flattened in `hallflat.js`: no gradients, no drop shadows, no window light, fewer panel and plank lines, plain notes, four clock ticks).
- My read is that the flat version belongs to the characters and the as-is version does not quite.
- The as-is wainscot, floor gradient and light wedge pull it toward the older "soft-shaded" look.
- The flat version is also quieter, so the characters pop more.

Recommendation: flatten the interior sets with light edits, as `hallflat.js` shows. That means deleting gradients and shadows and halving the detail lines, not redesigning. The street set needs the same treatment. One cool sky gradient can stay, because sky is the one place a gradient still reads as flat.

## Render cost (headless chromium, CPU canvas; `?v=bench`, 60 iterations, flushed each time)
| what | ms / frame |
|---|---|
| 2 characters at two-shot size (1.8x) + a full-frame fill | 3.3 |
| coffee frame: ep02 hallway (baked bitmap blit) + 2 characters | 8.6 |
| coffee frame: flat hallway drawn live (no bake) + 2 characters | 3.5 |
| 6 characters (lineup scale) | 5.1 |

A character costs about 1–1.5 ms, which is cheap: there are no offscreen layers, no blur filters and no compositing passes. The flat hallway is cheaper to draw live than to blit the baked 1.7x bitmap of the shaded one.

## Honest assessment / known gaps
**What works:**
- The cast now reads as adults with distinct silhouettes. Ponytail, cloud hair, bun, bob, helmet bob and squared curls each read as a black shape.
- Faces read at phone size in the two-shot. The lid acting (sleepy, skeptical, embarrassed) does most of the work.
- Limbs look intentional: tubes with mittens, shoulders capped in the sleeve colour.

**Weak spots still open:**
- **Mei and Mrs. Lopez silhouettes:** the closest pair in the silhouette row (both compact blocks). Height and the bun separate them, but Mei could use one more signature: a tote bag or backpack, or a longer cardigan.
- **Hands are simple mittens.** `relax` hands at the sides still look a bit like paddles at large sizes. A 3/4 "cupped" rest hand would help.
- **Side view:**
  - The profile is basic: a small nose bump, and the mouth is clipped at the edge.
  - The 3/4 view of Youssef's hair has a slightly hard back edge.
  - Close-ups in 3/4 and side views would need a dedicated profile mouth.
- **Expression crops on the Sara sheet** are dominated by the ponytail at 3/4. That is on-model, but it crowds the panel.
- **The walk** is 4 keys only, with no in-betweens. It has not been tested in motion.
- **Feet in 3/4:** the far foot is mostly hidden behind the near one.
- **Leo and Mei** were designed from the brief only, with no prior model, and got the least iteration (one lineup pose each, no sheets).
