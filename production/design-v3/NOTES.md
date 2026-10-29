# Design v3 — "Youssef in New York" (يوسف في نيويورك)

Stills only, for approval. New folder; the episode folders are untouched. Modules copied from ep02 (`kit.js`, `bean.js`, `ui.js`,
fonts) plus a new `world.js` (the New York set), a `tl.js` stand-in (one narration line for the plate) and `main.js` (the frames).

Render: `node core/render/still.mjs <design-v3> 3 --q 'f=<frame>&arms=A|B|C|v2' --out <dir>`
with `f` = `ny_wide` · `ny_door` · `ny_night` · `arms` (model sheet) · `arms_frame` · `cta` · `endcard`.

| file | what |
|---|---|
| `frame_ny_wide.jpg` | NY street, morning: Youssef hop-walks with the red suitcase, the yellow taxi passes behind, subway sign post, hydrant, hot-dog cart, newspaper box, bishop's-crook lamps, brownstones with stoops + fire escapes, far skyscrapers with water towers (and a generic bridge, far left) |
| `frame_ny_door.jpg` | the two-shot at the school door, afternoon: Sara on the NY stoop in the doorway, Youssef at its foot; SARA name tab |
| `frame_ny_night.jpg` | optional: the same wide shot at night (moon upper-left, stars, lit windows, the lamp's pool of light) |
| `arms_options.jpg` | model sheet: arm options A / B / C on both characters, 5 poses + a 3/4 view, with the measured cost per row |
| `frame_arms_A/B/C.jpg` | the door two-shot with that option: Sara holds two coffee cups, Youssef points |
| `frame_cta.jpg` | the full-screen exercises call-to-action: dimmed + blurred street, the big site card, Youssef small pointing, the mustard bar, the plate at y ≈ 1000 |
| `frame_endcard.jpg` | the end card: series title, "الحلقة الجاية", "How old are you?", the bigger teal + red pills |

## 1. New York set (`world.js`)
Same palette tokens, same parallax factors (sky 0 · far .12 · mid .45 · near 1 · lamp 1.3), same haze (far +85 % at the base,
mid +24 %), same bake-once caches and the same `drawWorld(c, cam, t, o)` call, so the episode cameras work unchanged.
`o.busX` became `o.taxiX`; `o.night` (0..1) is new. The school keeps its facade, sign, fanlight, columns and the teal door; the
door now sits on a six-step stoop with cheek walls and iron railings (`STOOP` exports the step geometry). Brownstone colour is
mixed from red + mustard + ink; the far skyline is mixed from sky + violet as before. Nothing is a landmark; "SUBWAY" and "TAXI"
are plain lettering, no logos.

## 2. Arms & shoulders (`bean.js`, `ARMS = 'v2' | 'A' | 'B' | 'C'`, `setArms()`)
Shared by all three: a fixed shoulder anchor on the silhouette at .375 H with a small sleeve bump drawn into the body's form
pass; a tapered sleeve (shoulder .076 H → wrist .046 H) with the v2 shading language (darker full tube + lit tube shifted to the
light); a cuff band (Youssef: dark navy + a sliver of shirt, Sara: ribbed mustard); the round hand 15 % bigger (.054 H); the far
arm's hand swings .13 H forward so it always shows past the chest (no more vanishing arm). Poses are hand targets from the
shoulder (`ARM3`), with `flex` = how far the elbow may stick out (a relaxed arm shortens its bones toward the chord, since the
elbow going back in depth cannot be drawn flat) and `app` = the forearm's approach direction for the bendy arm.

| option | construction | reach | measured cost, 2 characters at k = 1, 1080p | code |
|---|---|---|---|---|
| current (v2) | one quadratic stroke, constant width, ball hand | .18–.28 H | 32.5 ms (the body form pass dominates) | — |
| **A jointed tapered** | 2-bone IK (upper .175 H + forearm .165 H, up to 12 % stretch), fillet at the elbow | .34 H | 32.2 ms (±0) | ≈ 110 lines shared by A/B/C |
| B bendy sleeve | one cubic S-curve, no elbow | .34 H | 30.4 ms (−2 ms, fewer samples) | same |
| C short stubby jointed | as A with bones .125 + .115 H | .24 H | 32.0 ms (±0) | same |

The cost is noise-level for all three: the arm is ~60 path samples and two fills; the body's form pass (crescent + rim light)
is what the frame pays for. The measurement runs in the page when the sheet renders (`window.COST`, 3 passes, best of 30 draws).
Stills (render + screenshot) are 0.17–0.30 s each on this 4-core box, as in the episodes.

**Recommendation: A (jointed tapered).** It fixes every point on the owner's list (shoulder, taper, elbow, rest, both arms) and
reads at phone size: the elbow gives the point / hold / wave a clear silhouette. B is the smoothest to animate (one curve, no
IK pops) but holds and points look boneless at full size; C keeps the bean feel but cannot reach the head or point across.
If A is approved, the episode poses map 1:1 (`ARM3` has every v2 pose plus `hold`, `point`, `door`); the hop-walk arm swing,
the wave and the spring code need no change. Suggested follow-up: animate the elbow side (`el`) on big gestures so the arm
does not flip when a hand target crosses the shoulder line.

## 3. Full-screen CTA (`frameCTA`, `bigCard`)
The street is drawn with 9 px depth-of-field on every layer and dimmed 50 % ink; the card is 1000 × 740 (68 % of the frame
height) in the site's look (cream paper, ruled lines, "يوسف في نيويورك · تمارين" header, progress dots, the white exercise
card with the mustard number badge, "صلّح غلطة يوسف", Sara's context pill, the prompt, the sentence at 84 px with the red
squiggle, the chips with the chosen one in leaf + ✓, three stars). Type is ≥ 32 px inside the card, so on a 400 px-wide phone
the smallest text is ~7 px and the sentence ~17 px. Youssef (k .92) points from the left; the mustard bar (48 px) sits at
y 858, clear of the plate at y 1000. In the episode this replaces `siteCard` + `linkArrow` in `outro.js` (same beats:
squiggle → tap → fix → stars → "اللينك"), ≈ +1 ms/frame for the blurred background (the `soft()` down-sampled blur).

## 4. Name change
`SPEAKER.mia.name = 'SARA'` (rust tab unchanged); hair, clothes and the `mia` id in code are unchanged. The site card says "سارة:".
