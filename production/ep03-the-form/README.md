# Ep 3 "The Form" (picture + sound)

Same construction as episodes 1–2 (Bean People v3, A3 arms, the lemo-opuscar renderer): `timeline.json` (built by `timeline.py`
from the real voice clips) is the only source of timing; every beat, bubble, word highlight, mouth shape and cue derives from it.
Commands, page contract and module roles are those of `../ep02-good-morning/README.md` (render from `/home/user/ref/lemo-opuscar`).

## What is new in this episode
- **Mrs. Lopez** (`CAST.lopez` in `bean.js`, voice Gacrux): the school receptionist, ≈ 60 — the same egg, a silver bun on the crown,
  red round glasses (`sp.glasses`, drawn in `face()`), a cream blouse with a collar under a sage-teal cardigan (teal + leaf), a pen.
  Name tab `MRS. LOPEZ` (deep teal, `ui.js` SPEAKER), her own blink/dart seeds (`act.js`). Timeline id `lopez` (`tlkit.WHO['Lopez']`
  is set in `timeline.py`, not in `lib/`). Apart from these additions the shared modules match ep02's current files
  (incl. the QA fix `drawTray o.cups`).
- **The reception set** (`world.js`: `receptionStatic`, `counterFront`, `room4Live`, `drawReception`, `drawCounter`): the hallway's wall,
  wainscot and floor; the door of **Room 4** (big "4" plaque, opens progressively onto a warm classroom), a window, the wall clock
  (7:52 → 8:00 over the scene), the RECEPTION sign (low enough to stay whole in the two- and three-shots), a shelf, the counter
  whose front is a separate layer drawn over Mrs. Lopez (her lower body is behind it), the desk bell.
- `drawForm` takes `ageVal` + `write` (26 handwritten in teal, revealed as it is written); `drawPen`.

## Scenes
| section | picture |
|---|---|
| open | The street at 7:50 (a "7:50 ✓" tag by the school clock): Youssef walks in calmly with the form, proud (chest out), reads the form; "إلا خانة واحدة" → worried, a "?". Title card "The Form". |
| desk | The reception two-shot. He hands the form across the counter (low reach), she lays it on the counter, reads it, raises her pen: "How old are you?" — "I have 26 years." — her smile freezes, push in on her puzzled echo → **freeze-frame** close-up on Youssef (desaturated, keyline, "?/!" marks): on "عندي" a card عندي 26 سنة → *I have 26 years* (squiggled on "كلمة كلمة"), on "شنطتي" a red suitcase with a "26 years" luggage tag. |
| fix | Sara walks in with her tote bag, whispers (hand at her mouth) "Youssef! Not "I have". Say: I'm 26." → "Oh! I'm 26!" (raised finger). ar04: push in on Youssef (nod on "سنّك", hand on chest on "I'm 26", a tired slump on "I'm tired"). |
| sixty | Insert: her hand writes 26 in the Age box (✓). Three-shot: "And you? How old are you?" (Sara gasps, hand over mouth) — "Me? I'm sixty!" — "Sixteen?!" (jump, arms up, a red "16?!" tag) — "Sixteen? Oh, thank you! No. Sixty! Six-zero!" (clasped hands, ∩ eyes, wagging hand; a teal "60 / 6 · 0" tag replaces the 16?!), Sara laughs. ar05: the stress cards six·TEEN / SIX·ty pop on the words. |
| room | "OK, Youssef! Class starts now. Room four!" (Sara points) — "Now?! OK!" (jump, waves to Mrs. Lopez). Both walk to Room 4, the door opens progressively (warm light, a murmur of the class), Sara goes in (clipped to the doorway); ar06 over a slow push. |
| recap | Items `count` (cards 1–10 pop on r01), `teen` (11–20; 13–19 on r02, -teen lights red on the narration), `ty` (20–100, -ty teal), `stress` (13/30 … 16/60 with the stressed syllable big + a dot; dots drop on "في الآخر" / "في الأول"; r04 lights its pairs), `age` (How old are you? / I'm 26. / I'm 26 years old.), `wrong` (both mistakes squiggled + ✗ + pill, the fixes in leaf with ✓ on "old"), `order` (ستة و عشرين 6 + 20 read ← vs twenty-six 20 + 6 read →; r08). Text column 560–1400 between the presenters (ep02 QA layout). |
| turn / site / next | As ep02: Sara asks "How old are you?" (hint "twenty-two · thirty · forty-five"); the CTA card (ep02's bigger 1180 × 780 version) with the fix exercise "I have 26 years." → "I'm 26"; the teaser at Room 4 (a classmate as a dark silhouette with a "?" — her design belongs to ep04 — and Sara's "Where are you from?"); end card "Where are you from?". |

## Voices
`tts/make_jobs.py` (IPA-pinned, `tts/vocab.py` holds the episode's words: every number with its stress, e.g. thirteen θɝˈtin,
thirty ˈθɝdi, sixteen sɪkˈstin, sixty ˈsɪksti, twenty-six ˈtwɛnti sɪks). Versions: v1 for all; v2 `en3` (v1 garbled "Me? Ha!"),
`r01–r03` (pace), `ar09`/`ar10` (the voice read "-ty" as the letters T-Y / "tie": it now gets "tee", the plate shows -ty via
`timeline.py`'s display override); v3 `ar05` (shortened). `tts/tighten.py` shortens long silences (counting clips ≤ .24 s, r04 ≤ .4 s,
narration ≤ .45 s, dialogue ≤ .55 s) and moves the transcript word times; untouched clips are in `voices/orig/`.

## Sound
`mix.py` = ep02's mixer with the episode's score plan (calm theme for the walk, a light strum at the desk, the comic reed on the
freeze, Sara's chime, an up-run on "Sixteen?!", a sting on the laugh, the theme to Room 4) and one new cue type, `chatter`
(the class behind the door). Standard levels (MUSIC .15 with a 90 % duck, FX .4 with a 60 % duck).
