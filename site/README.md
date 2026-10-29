# يوسف في لندن — الموقع المصاحب (companion site)

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
  audio/epNN/rNN.mp3  the episodes' model phrases (48 kbps mono mp3 made from production/epNN/voices/rNN.wav)
  data/episodes.json  the series, units and the episode list (titles, status live|soon, colour, YouTube link)
  data/epNN.json      one episode: phrases, Youssef's mistakes, the exercise items
  js/engine/          the show's drawing code, unchanged apart from local imports: lib.js, kit.js, bean.js, act.js
  js/bean-widget.js   draws a bean on any <canvas> with the show's idle loop + reactions
  js/store.js         localStorage (guarded): streak days, episode results, the SM-2-like review deck
  js/exercises.js     the five exercise types + `normalise()` (episode JSON → runnable items)
  js/session.js       the shared runner: top bar, progress dots, bean stage, feedback bar
  js/ep.js, js/home.js, js/review.js   the three pages
  js/ui.js            small helpers: DOM, audio, confetti, toast, share
```

The beans are the same `bean.js` the episodes are rendered with (same `CAST`, `EXPR` presets, form pass), so the site
draws exactly the show's characters. `bean-widget.js` adds the idle loop from the episodes (breathing, seeded blinks,
eye darts) and a few reactions (`happy`, `embarrassed`, `clap`, `yawn`, `wave`, `oops`, `think`). Reduced motion is respected.

## Exercise types

| type | Arabic | what the viewer does |
|---|---|---|
| `listen` | اسمع واختار | plays a clip; choose the Arabic meaning (`mode: "ar"`) or the exact English (`mode: "en"`) among 3 |
| `fix` | صلّح غلطة يوسف | the wrong sentence with a red squiggle; tap the right chip; Youssef gets embarrassed, then happy |
| `order` | رتّب الكلمات | word tiles to put in order (optional `extra` distractor tiles, optional `join` of two phrases) |
| `gap` | كمّل الجملة | one gap, 3 chips |
| `speak` | قولها بصوت عالي | Mia asks (her clip), a 3-2-1 ring, then "قلتها؟" self-check; with `webkitSpeechRecognition` the mic listens and matches `keywords` |

Scoring: an item counts when it is right on the first try. Stars: ≥ 90 % → 3, ≥ 60 % → 2, else 1.

## Memorisation

`store.js` keeps one card per phrase (`ep01:im`): correct answers move it up the intervals 1 → 3 → 7 → 14 → 30 days,
a wrong answer resets it to step 0 (due tomorrow). The home page shows how many cards are due today;
`review.html` builds up to 10 exercises from the due cards, rotating types 1–4 (fix items come from the episode's
`mistakes` list). A streak is the count of consecutive days with any activity. Everything is wrapped in try/catch
and falls back to memory when storage is blocked.

## Adding an episode

1. Convert the model clips: `ffmpeg -i rNN.wav -ac 1 -ar 32000 -b:a 48k site/audio/ep03/rNN.mp3`.
2. Write `data/ep03.json` (copy `ep02.json`): `phrases` (id, en, ar, who, audio), `mistakes` (wrong, span to replace,
   optional `mark` for the squiggle, chips, answer, explain) and ~12 `items`. In a `listen` item the first option is the
   correct one (options are shuffled on screen).
3. In `data/episodes.json` set the episode's `status` to `live`, add the `youtube` link, blurb and colour.

Nothing else changes: the home page, the review deck and the end screen read the JSON.

## Run locally

```
cd site && python3 -m http.server 8000     # then open http://localhost:8000/
```

## Deploy

`.github/workflows/pages.yml` runs on every push to `main` that touches `site/**`: it uploads `site/` with
`actions/upload-pages-artifact` and deploys with `actions/deploy-pages` (Pages is enabled by `configure-pages`
with `enablement: true`). There is no build step. In the repository settings, Pages → Source must be "GitHub Actions".
