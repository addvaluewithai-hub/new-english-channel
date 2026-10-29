# "First Day in London": Rubber Hose style test (17 s)

Style: 1930s Rubber Hose Cartoon (`rubber-hose`). Strictly greyscale, cool silver-nitrate grey ramp
(a London print, not the warm paper of the library demo), 4:3 gate, film damage, characters on twos.
Audio: the given voice track `test_audio.wav`, unchanged (no score in a style test; the picture is cut
to a 120 bpm grid so a hot-band score can be laid in later without re-timing).

## Three candidate structures
1. **A street that dances him in.** One trucking pan along a London street where every house,
   lamp post and the bus breathe on the beat; Youssef struts with his suitcase like he owns the
   tune, and the street "delivers" him to the school door. The turn: the music of his confidence
   dies at one word ("Sorry?"). *Chosen*: the medium's native move (the whole world on the beat)
   carries the diary line "I thought my English was good", and the band-stop silence is the gag.
2. **Out of the inkwell.** A pen draws Youssef on a blank street, he hops into London. Nice, but it
   spends 3 s on a device that every episode would repeat; and it is the style's cliché.
3. **Iris on one eye.** Open on Youssef's nervous pie eye, iris widens to show London. Strong hook,
   but the establishing shot then has no travel; reserved as a possible episode opener.

## Logline and arc
A cocky little engineer bounces through a dancing London to his first English class, and one
missing word deflates him like a balloon.
Setup (confident walk, the city sways with him) → turn (Mia's friendly "Hi!", his broken reply,
her puzzled "Sorry?" as her ponytail curls into a question mark) → ending (he shrinks, his face
"fills up" dark like a thermometer, steam whistles from his ears; iris closes on him).

## Benchmark
Early-1930s Fleischer street numbers (grammar only): the whole set dancing, theatre staging,
reaction close-ups as the joke. Learn: stage-wide staging, held reaction, everything breathing in
phase. Don't take: any character, design, gag or melody.

## Shot list (120 bpm, beat = 12 frames = 0.5 s)
| # | t | Framing / move | Why |
|---|---|---|---|
| 1 | 0.0–6.0 | Iris in (0–0.6), then stage-wide trucking pan left→right beside Youssef walking one step per beat; bus overtakes behind him, clock tower in the distance, the school slides into frame at the end | Establish London + his excitement; pursuit grammar = momentum |
| 2 | 6.0–15.0 | Medium-full two-shot at the school steps, locked theatre camera, slow push-in 7.4→9.0 when Mia springs out of the door | The dialogue is a routine on a stage; the push says "this matters" |
| 3 | 15.0–17.0 | Hard cut on the beat to a medium close-up of Youssef; iris out 16.1–17.0 | "The reaction is the joke"; iris = the film is an object, a clean episode button |

## Beat sheet
- 0.0 iris opens on the street; 0.7 card 1 "أول يوم ليّا في لندن…" Youssef bouncing in from left.
- 2.75 card 2; 3.0 the bus rolls past behind him; houses sway; he tips his hat-less head to the clock tower.
- 5.75 card 3 "لحد ما قابلت ميا."; the school with its ENGLISH SCHOOL sign arrives.
- 6.0 cut: he hops to a stop below the steps, straightens jacket, gulps.
- 7.4 door bangs open, Mia springs out (squash → stretch → settle). 8.0 "Hi! I'm Mia." big wave.
- 9.9 Youssef: offers a hand, knees knock, sweat drops; "Hello! I... I Youssef." card.
- 13.6–14.5 a hold: everyone frozen except his blink (band-stop).
- 14.5 "Sorry?" Mia leans in, brow up, ponytail curls into a "?" (transformation).
- 15.0 cut to Youssef: he squashes down, darkness rises from collar to hair, steam puffs from ears,
  he hides behind the suitcase handle; 16.1 iris closes on his eyes; 17.0 black.

## Cue map
120 bpm, 34 beats. Cuts land on beats 12 (6.0) and 30 (15.0). Breathing = cos(2π·beats), on twos.
Steps on every beat in shot 1. Freeze of the background breathing 13.6–14.5 and 14.5–15.0 (the stop).

## Sound design
Voice track only (given). Planned for the series: stride piano + banjo + tuba walk (shot 1), band
stop at "Sorry?", slide-whistle down + trombone smear on the shrink, kettle-whistle steam.

## Subtitles and titles
- Arabic narration: a period title card (near-black plate, white double rule, dot-and-ring corners)
  at the bottom of the gate, RTL, Aref Ruqaa Bold (Egyptian film-title calligraphy of the period,
  everyday handwriting for Egyptian viewers), held ≥ 1.8 s each.
- English dialogue: a white "speech card" (IM Fell English SC, large) with an ink tail pointing at
  the speaker, popping on and off with no fade; the speaker's name in Limelight caps above it.

## Review round (one fix pass)
- First pass: characters ~25 % of frame height, faces unreadable; the pan overtook Youssef at 4 s;
  the "close-up" was a full shot. Fixed: per-layer cameras (far .25 / mid .62 / near 1.0, near at
  z 1.3), a tracking pan that eases in and only pulls ahead at the end to reveal the school; stage
  two-shot at z 1.25→1.4; close shot at z 2.85→3.05.
- Beard read as a black mask and hid the brows: thinner jaw band, brows moved below the hairline.
- Ear-steam read as whiskers / thought bubbles: replaced with scattered, fading puffs; the turned-up
  collar now flanks the face instead of covering it; the "flush" is held for the close shot only.

## Measured
Render 0.23 s/frame steady (≈0.37 s/frame including the ~55 s background paint at start-up),
408 frames in 153 s on one worker, CPU only. Master −14.0 LUFS, TP −1.2 dB, grain 3.
