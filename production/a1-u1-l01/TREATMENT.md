# A1 · U1 · L01 — Hello! I'm Youssef | أهلًا! أنا يوسف

Style: **Paper Pop-up Book** (lemo-opuscar `paper-popup`). Language: Egyptian-Arabic narrator, American-English dialogue.
Target length ≈ 3:00–3:30. Output 1920×1080, 30 fps (the style suits 60; 30 halves the software-WebGL render time for this pilot).

## 1. Three candidate structures

1. **Textbook march** — book opens on a phrase board, one card per phrase, narrator explains, quiz at the end. Clear, but no hook and no turn: a lesson, not a film.
2. **Story first, then breakdown** — a clean dialogue scene, then the breakdown, then practice. Good, but the first 10 s are just two people saying hello: nothing to want.
3. **The wrong first sentence** ✅ — Youssef's very first English sentence fails (`Hello! I Youssef.` → Mia: `…Sorry?`). His speech bubble crumples. We learn why, fix it with a paper mechanism, and the film ends with the **same scene done right**.

**Chosen: 3.** It has a hook in the first 3 s (a mistake every Arab learner makes), one subject with one goal (say who he is), one turn (the fix) and an ending that echoes the opening. The paper medium makes the mistake visible: a bubble you can crumple, a word you can slide in.

## 2. Logline and arc

Youssef, just arrived in London, gets his very first English sentence wrong, and by the end of the page he gets it right.

- **Setup:** London spread pops up. Mia greets him. He says `I Youssef`. The bubble crumples. Title sign drops.
- **Learn:** page turn to the phrase board: six phrase cards spring up one by one, each spoken by a character and explained by the narrator, then a "say it with me" round.
- **Turn:** the mistake explained: Arabic `أنا يوسف` has no verb; a pull-tab slides the card `am` between `I` and `Youssef`, then the two cards fold into `I'm`. Second mistake: `Me too.` crumples, `Nice to meet you too.` pops up.
- **Your turn:** Mia faces the reader: "What's your name?" A pull-tab clock gives the viewer time to answer aloud.
- **Ending:** page turns back to London: the same scene, done right, with a typed-on "PERFECT!" rating. Goodbye. The book closes. Call to action: write `Hi! I'm …` in the comments.

## 3. Benchmark

- **Learn from:** Sabuda-style pop-up books (rise order, pull-tabs as the event); picture-book language-learning shows that repeat a phrase after a model with a held pause; *Paper Mario*-style typed bubbles and ratings as quiz feedback.
- **Don't take:** any character, design, logo, melody or shot. No real brands, no copied landmarks.

## 4. Shot list (summary)

| # | Section | Framing / move | Why |
|---|---|---|---|
| 1 | Book opens on the desk | rising crane from human height → descending dolly into London spread | entering the book's scale; arrival |
| 2 | Mia meets Youssef | eye-level macro track, two-shot | being inside the conversation |
| 3 | `I Youssef.` crumples | push-in on Youssef's face + bubble | the feeling of getting it wrong |
| 4 | Title sign drops on strings | locked medium, sign swings | the title is a paper object |
| 5 | Page turn → phrase board | 3/4 pull-up over the spread | new setting; the "map" of the lesson |
| 6 | Each phrase card | locked frame per card, small push | the card *is* the event |
| 7 | Mistake: pull-tab `am` | top-down locked on the tab | the trick is the event (before/after) |
| 8 | `Me too.` crumples | close insert | a mistake becoming a lesson |
| 9 | Your turn | Mia close-up facing the lens, reverse to the blurred room | the reader is in the scene |
| 10 | Retake + PERFECT! | eye-level two-shot, push-in on the rating | the payoff, bookend of shot 2 |
| 11 | Book closes | rising crane leaving the book small | summary; the end |

## 5. Sound design

| Section | Ambience | Foley | Music |
|---|---|---|---|
| Open | room tone + soft city murmur (paper world) | book creak, pop-up snaps back to front, tiny footsteps | toy-piano + pizzicato motif enters after the first pop |
| Mistake | music cuts out → **silence** before `…Sorry?` | paper crumple | none |
| Title | room tone | string-drop tinks, sign swing | motif returns |
| Phrase board | room tone | one pop snap per card, typing blips on bubbles | light loop, ducked under voices |
| The fix | **silence** before the pull-tab | tab slide, card fold, crease | glockenspiel sting on `I'm` |
| Your turn | clock tick from the room | tab ticks as a countdown | none (held breath) |
| Retake | city murmur | footsteps, bubble blips, rating stamp | motif, full |
| Close | room tone | page swish, closing thump | final music-box cadence |

## 6. Subtitles and titles

- English on screen as **paper cards and speech bubbles** (Fredoka); the narrator's Arabic as bottom subtitles (Baloo Bhaijaan 2, cream with a thick dark-brown outline) with the English phrase it explains shown above in Fredoka.
- Title: cardboard sign on strings: `Lesson 1 · Hello! I'm Youssef` / `الدرس الأول · أهلًا! أنا يوسف` (Lilita One / Lalezar).
- Every subtitle holds ≥ max(1.8 s, speech + 0.6 s).

## 7. Voices (Gemini TTS factory)

| Role | Voice | Style |
|---|---|---|
| Narrator (Egyptian Arabic) | Zephyr | warm, friendly Egyptian tutor; English words said clearly in an American accent |
| Mia (American teacher) | Aoede | friendly young American woman, natural, clear |
| Youssef (Egyptian, 26) | Achird | friendly young Egyptian man speaking English with a light Egyptian accent |

The script is in `script.json`; one factory job per section, word timestamps from the factory's transcript.
