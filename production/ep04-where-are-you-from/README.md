# Ep 4 "Where Are You From?" (picture + sound)

Same pipeline and look as episodes 1–2 (Bean People v3, A3 arms, the shared `kit.js ui.js act.js tl.js cues.js` unchanged; `bean.js`
= ep02's plus the new classmate **Ana**). `timeline.json` (built by `timeline.py` from the voice clips) is the only source of timing.
Script: `SCRIPT.md`. Render / preview / cue commands: as in `production/EPISODE_BRIEF.md`.

## What is new in this episode

| file | change |
|---|---|
| `bean.js` | `CAST.ana` (H 266): olive skin, a dark wavy **bob** with a side-swept fringe and a teal clip (`hairline` ana branch + `bob()`), a red top with a cream collar over teal trousers (`clothes` ana branch), lashes like Sara. Everything else is ep02's file byte for byte (incl. the `drawTray` `o.cups` fix). |
| `world.js` | The **classroom** set (`classStatic`, baked once; `drawClass`): pale sky wall over a mustard wainscot, plain paper bunting, the window onto the NY street (a brownstone, far towers, a water tower), the whiteboard (writing is live: `boardWriting`), the world map (equirectangular blobs; live pins `pin()` for Spain / Egypt (Cairo) / New York with labels and a pulse), a teal door that swings open progressively, one empty desk. `deskFront()` draws a student desk in front of a seated bean (the modesty panel reaches the floor so resting hands stay hidden). |
| `story.js` | One continuous classroom scene (`sceneClass`) for open → intro → fix → hook. Students sit (`seat` key: 22 px behind the desk) and stand to speak. The freeze is ep01's cached, desaturated close-up with ?/! on the panic narration, plus a red squiggle under "am" in his frozen bubble (`squiggleWord`). Ana's name tab (`SPEAKER.ana`, dark teal) is added from here so `ui.js` stays shared; Ana's idle eye darts use her own phase. |
| `timeline.py` | `tlkit.WHO['Ana'] = 'ana'` (runtime patch, lib untouched); episode vocabulary added to `lipsync.LEX`. |
| `tts/make_jobs.py` | IPA for every new word (`pron.OVERRIDE`) and the transliterated phrases (`pron.PHRASES`). Gemini multi-speaker takes exactly two voices, so the three-person class is cut into two-voice jobs (en1 Sara+Ana, en2/en3 Sara+Youssef) and solo clips (en4a/b/c, en5, en6; en4 was a Youssef+Ana job, re-done as three solo clips so each line is surely in its own voice). Ana = Laomedeia with a "light, natural Spanish accent" style and her own note (the IPA pins the words, not the accent). `tts/fetch.py` downloads results (pages the runs API by hand), `tts/check.py` = Gemini text + Whisper small. |
| `recap.js` | ep02's current layout (text column 560–1400, smaller presenters, auto-fit, ✓ room) with six items: **from** (`I from Egypt.` ✗ → `I'm from Egypt.`), **live** (`I am live in Queens.` ✗ → `I live in Queens.`), **rule** (the comparison card: `I'm from` has am / `I live` has none, "am" struck out), **are** (`Are you from Madrid?` → `Yes, I am.` / `No, I'm not.`), **in** (`in Cairo · in New York`, `I live at Cairo.` ✗ → `I live in New York.`), **nat** (Egypt → Egyptian, Spain → Spanish, America → American, capital letters lit). |
| `outro.js` | Title "الحلقة 4 · Where Are You From?"; your turn in the classroom (`I'm from ______.`, hint Egypt · Jordan · Morocco); ep02's big CTA card with the "I am live in Queens." exercise; teaser = the hard-hat/blueprint job card, floating job words, "What do you do?" → "I am engineer." with the squiggle; end card "What do you do?". |
| `mix.py` | ep02 levels; score plan for this episode's beats (freeze and "stuck" dun-dun-duuun, a chime when each student stands, "Cairo!" sting); new cue `chair`; classroom room tone + the street faint through the window. |

Unused generated clips: `r05` ("Are you from New York?") and `r06` ("Yes, I am.") were cut from the recap for length; they are used on
the companion site (`site/audio/ep04/`).
