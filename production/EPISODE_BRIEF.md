# How to produce an episode of "يوسف في نيويورك" (the standard, as of episodes 1–2)

Everything below was decided with the channel owner. Episodes 1–2 are the approved reference: copy their structure, look and sound.

## Reference episodes
- `production/ep01-first-day/` and `production/ep02-good-morning/`: read `SCRIPT.md`, `README.md`, `timeline.py`, `tts/make_jobs.py`, `mix.py`, `make_srt.py`, and the page modules (`kit.js bean.js world.js ui.js act.js tl.js story.js recap.js outro.js main.js cues.js index.html`). The shared modules (`kit.js bean.js ui.js act.js tl.js cues.js`) are identical in both; copy them unchanged.
- Shared Python: `production/lib/tlkit.py` (timeline builder: word alignment, lip-sync tracks), `production/lib/pron.py` (IPA pinning of English), `production/lib/lipsync.py`. **Do not edit `production/lib/`** (another episode is being built at the same time). Extend in your own episode instead: add transliteration phrases with `pron.PHRASES.append((ar, en, ipa))` and new English words with `lipsync.LEX[word] = 'ARPABET'` / `pron.OVERRIDE[word] = 'ipa'` at the top of your `tts/make_jobs.py`, and the same `lipsync.LEX` additions at the top of your `timeline.py` (before `b.finish()`), plus the Builder's `latin=[...]` for the plate.
- Series bible: `series/SERIES.md`. Curriculum: `curriculum/a1/unit-01-first-contact.md`.

## Format (3–3:30)
1. Opening (~15 s): Youssef narrates in Egyptian Arabic (diary voice), then the title card "يوسف في نيويورك · الحلقة N · <English title>".
2. Story (~2:00): the situation in English between the characters; Youssef comments in Egyptian Arabic. One main mistake (the curriculum's "Arab mistakes"), shown with a freeze/close-up beat, then fixed in the story.
3. "اللي اتعلمته النهارده" recap (~60 s): Living-Letters cards, model phrases spoken by the characters with a repeat gap after each, Arabic meaning under each phrase, the red squiggle for the mistake and the fix with a ✓.
4. "دورك" (~15 s): Sara asks the viewer, card with mic + 3-2-1 countdown.
5. "حل التمارين" (~8 s): full-screen exercise card + mustard bar "حل تمارين الحلقة · اللينك في الوصف ⬇".
6. Next episode teaser (~10 s) + end card (series title, "الحلقة الجاية", the next question, the two pills).

## Characters and voices (Gemini TTS)
- Youssef: Achird (English with a light Egyptian accent in the story; recap model phrases in clean General American; diary narration in Egyptian Arabic).
- Sara (internal id `mia`, displayed "SARA"): Aoede, American teacher from New York.
- New characters: a new CAST entry in `bean.js` copies (same egg construction, own colours/hair/clothes from the 8 palette tokens + mixes); pick a fitting Gemini voice (list in `/home/user/gemini-tts/docs/API.md`).
- All English text in every job is pinned with `pron.tag_line(...)` / Arabic narration with `pron.tag(...)` (see ep02 `tts/make_jobs.py`; copy its structure). Every English word you use must have an IPA (the script prints `no IPA for: [...]`; add the missing ones as above until it prints nothing).

## Voice generation (paid, approved by the owner for these episodes)
- `cd <ep>/tts && python3 make_jobs.py dispatch v1` sends jobs to `repos/addvaluewithai-hub/gemini-tts` (event `tts.generate`); job ids `channel-epNN-<key>-v1`.
- Results: poll `gh run list -R addvaluewithai-hub/gemini-tts`, then get the Cloudinary URLs with `gh run view <id> -R addvaluewithai-hub/gemini-tts --log | grep -oE 'https://res\.cloudinary\.com/[^" ]*channel-epNN-[a-z0-9]+-v1\.(wav|transcript\.json)'` and download to `<ep>/voices/<key>.wav|.transcript.json`.
- Check every clip: Gemini's `recognized_text` + Whisper (`/home/user/ref/lemo-opuscar/.venv/bin/python` with `faster_whisper`, model "small"). The deliberate mistake must actually be said (TTS tends to "correct" it; regenerate with a stronger style prompt, e.g. "says exactly the words ... with NO ..."). Regenerate any garbled clip as v2/v3.

## Picture
- Copy the ep02 folder structure, adapt `story.js` (your scenes), `recap.js` (your items), `outro.js` (your turn/site/teaser/end card texts), `world.js` (sets: the NY street + school exterior, the bedroom, the school hallway exist; add a set only if the story needs one, e.g. a reception desk or a classroom, in the same style).
- Arms: A3 (default in `bean.js`), smoothed by `smoothArms`; poses from `act.js`. Never cover faces with props; the cup goes to the mouth, papers are held at chest height; no hand may leave the frame (recap presenters at x 395 / 1580).
- Everything keyed off `timeline.json` (sections, beats, lines, narration words, talk, mouth, mouth_nar, recap items).
- Commands (run from `/home/user/ref/lemo-opuscar`, with `PLAYWRIGHT_CHROME=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell`): stills `node core/render/still.mjs <ep> <t>...`, preview `node core/render/video.mjs <ep> --q 'from=<section>&to=<section>' --size 960x540 --workers 3 --out <ep>/out/preview.mp4`, cues `node core/render/events.mjs <ep>`.

## Sound
- `mix.py` from ep02, standard levels: `MUSIC = .15` with a 90 % duck under speech, music-only passages at lvl ≈ .5, `FX = .4` with a 60 % duck under speech, footsteps .05. Adapt the score plan (the `block(...)`/`sting(...)` lines) to your sections and beats; map any new cue types in `H`.
- Subtitles: `make_srt.py` → `<ep>/<ep-folder>.srt`.

## Quality bar before you report
- Contact sheet of the whole episode (a still every ~2.5 s) and LOOK at every cell. 540p previews of the dialogue scenes; 8-fps strips around every gesture/hand-over; fix any pop, clipping, covered face, off-frame limb, overlapping text, wrong name tab, Arabic shaping problems.
- `python mix.py` runs with no "unhandled event types"; `make_srt.py` runs.
- Render speed ≤ ~0.35 s/frame.
- Do not commit or push and do not dispatch the GitHub render; the coordinator does that after review.
