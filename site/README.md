# يوسف في نيويورك — الموقع المصاحب (companion site)

Static site, no backend, vanilla HTML/CSS/JS (ES modules). After each YouTube episode the viewer comes here to do that
episode's exercises; every phrase they answer feeds a spaced-repetition review deck kept in `localStorage`.

Deployed to GitHub Pages from this folder (`site/`), so every path is relative and the site lives under
`https://<user>.github.io/new-english-channel/`.

## Structure

```
site/
  index.html          home: hero with the two beans, streak, today's review, unit progress, episode cards
  ep.html?id=ep01     one episode's exercises (one item at a time), then the end screen
  review.html         today's review session (~2 min, mixed types across episodes); ?all=1 reviews the whole deck
  css/site.css        palette tokens (from production/style-tests/bean-people-v2/STYLE.md), type, components
  fonts/              Fredoka, Lilita One, Baloo Bhaijaan 2, Lalezar (copied from the episode) + fonts.css
  audio/epNN/rNN.mp3  the episodes' model phrases (48 kbps mono mp3 made from production/epNN/voices/rNN.wav);
                      turn.mp3 = the episode's "your turn" question (used by the speak item's `ask`)
  data/episodes.json  the series, units and the episode list (titles, status live|soon, colour, YouTube link)
  data/epNN.json      one episode: phrases, Youssef's mistakes, the exercise items
  js/engine/          the show's drawing code (see below): lib.js, kit.js, bean.js, act.js + tl.js (the site's timeline stand-in)
  js/bean-widget.js   draws a bean on any <canvas> with the show's idle loop, smoothed A3 arms, lip sync + reactions
  js/store.js         localStorage (guarded): streak days, episode results, the SM-2-like review deck
  js/exercises.js     the five exercise types + `normalise()` (episode JSON → runnable items)
  js/session.js       the shared runner: top bar, progress dots, bean stage, feedback bar
  js/ep.js, js/home.js, js/review.js   the three pages
  js/ui.js            small helpers: DOM, audio, confetti, toast, share; SPEAKERS (tab name + Arabic name per character)
```

The beans are the episodes' own drawing code (design v3, "A3" arms: one smooth curve with a soft elbow, shoulder cap, taper,
cuff, bigger hand with a thumb), so the site draws exactly the show's characters:

| site file | copied from | changes |
|---|---|---|
| `engine/kit.js` | `production/ep02-good-morning/kit.js` | import path `/core/lib.js` → `./lib.js` |
| `engine/bean.js` | `production/ep02-good-morning/bean.js` | import path; plus the later cast merged in: `lopez` (Mrs. Lopez, from ep03's bean.js) and `ana` (from ep04's) |
| `engine/act.js` | `production/ep03-the-form/act.js` (= ep02's + lopez's dart seed) | import paths (`./lib.js`, `./tl.js`) |
| `engine/tl.js` | site-only | `mouthAt()` verbatim from the episodes' tl.js, reading a synthetic viseme track the widget writes per clip |
| `engine/lib.js` | the render library's `core/lib.js` (the helpers the engine imports) | — |

Youssef and Sara render pixel-identical to the episode engine, and Mrs. Lopez / Ana to theirs (checked pose by pose). The
internal id of Sara stays `mia` (as in the episodes); everything shown says Sara. When the episodes' engine changes again,
re-copy these files and redo only the import paths (and the cast merge if a new episode adds a character).

`bean-widget.js` drives a bean like the episodes do: keyed tracks folded with `fold`, arms time-smoothed with `smoothArms`
(so every gesture eases in and out), the ponytail / quiff springs (`springAt`), seeded blinks and eye darts, breathing, and
lip sync through the episodes' viseme shapes (`lipsync`): `talk(sec)` writes a plausible viseme track for a clip of `sec`
seconds. Reactions: `happy`, `embarrassed`, `clap`, `yawn`, `wave`, `oops`, `think`, `surprised`. Beans are framed against
Youssef's height, so Sara stands a head shorter, as in the show. Reduced motion is respected.

## Exercise types

| type | Arabic | what the viewer does |
|---|---|---|
| `listen` | اسمع واختار | plays a clip; choose the Arabic meaning (`mode: "ar"`) or the exact English (`mode: "en"`) among 3 |
| `fix` | صلّح غلطة يوسف | the wrong sentence with a red squiggle; tap the right chip; Youssef gets embarrassed, then happy |
| `order` | رتّب الكلمات | word tiles to put in order (optional `extra` distractor tiles, optional `join` of two phrases) |
| `gap` | كمّل الجملة | one gap, 3 chips |
| `speak` | قولها بصوت عالي | the `asks` phrase's speaker asks (optional `ask: {en, audio}` = the episode's own "your turn" line and clip), a 3-2-1 ring, then "قلتها؟" self-check; with `webkitSpeechRecognition` the mic listens and matches `keywords` |

Scoring: an item counts when it is right on the first try. Stars: ≥ 90 % → 3, ≥ 60 % → 2, else 1.

## Memorisation

`store.js` keeps one card per phrase (`ep01:im`): correct answers move it up the intervals 1 → 3 → 7 → 14 → 30 days,
a wrong answer resets it to step 0 (due tomorrow). The home page shows how many cards are due today;
`review.html` builds up to 10 exercises from the due cards, rotating types 1–4 (fix items come from the episode's
`mistakes` list). A streak is the count of consecutive days with any activity. Everything is wrapped in try/catch
and falls back to memory when storage is blocked.

## Adding an episode

`episodes.json` already lists episodes 3 and 4 (titles, colour, blurb, YouTube placeholder) with `"status": "soon"`, and the
site already knows their new characters (`who: "lopez"` = Mrs. Lopez, tab MRS. LOPEZ; `who: "ana"` = Ana, tab ANA). So when
their data arrives:

1. Drop in `data/ep03.json` and the clips in `audio/ep03/` (same for ep04).
2. In `data/episodes.json` set the episode's `status` to `"live"` (and, once the video is up, replace the `youtube` link).

That's all: the home card, the exercises (`ep.html?id=ep03` works even before the flip, for a preview), the review deck and the
end screen read the JSON. A phrase's `who` picks the bean and the bubble tab (`youssef`, `mia` = Sara, `lopez`, `ana`); the speak
prompt uses that character's Arabic name.

Writing an episode file from scratch: convert the model clips (`ffmpeg -i rNN.wav -ac 1 -ar 32000 -b:a 48k audio/epNN/rNN.mp3`,
plus `turn.wav` → `turn.mp3`), then copy `ep02.json`: `phrases` (id, en, ar, who, audio — the `en` text exactly as the clip says
it), `mistakes` (wrong, span to replace, optional `mark` for the squiggle, chips, answer, explain) and ~12 `items`. In a `listen`
item the first option is the correct one (options are shuffled on screen); a `gap` item may carry its own `ar` when it gaps a
longer line than its phrase; a `speak` item may carry `ask: {en, audio}` for the episode's "your turn" line.

## Run locally

```
cd site && python3 -m http.server 8000     # then open http://localhost:8000/
```

## Deploy

`.github/workflows/pages.yml` runs on every push to `main` that touches `site/**`: it uploads `site/` with
`actions/upload-pages-artifact` and deploys with `actions/deploy-pages` (Pages is enabled by `configure-pages`
with `enablement: true`). There is no build step. In the repository settings, Pages → Source must be "GitHub Actions".
