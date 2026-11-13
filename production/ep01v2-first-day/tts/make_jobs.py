# Builds the TTS job list for episode 1 v2 (the tighter test cut) and dispatches the NEW clips to the gemini-tts factory.
# python3 make_jobs.py [dispatch [vN] [job ...]]
# The ♻️ clips (open, en2, en3, r01-r10, turn) are copied from ep01-first-day/voices and are never dispatched; their job entries
# stay here with the original text so tlkit can tokenize/align them.
# English is pinned with <lang>/<phoneme> IPA (General American); Arabic narration carries tagged English (lib/pron.py).
# Gemini multi-speaker jobs take exactly two voices, so the class is cut into two-voice jobs (Leo + Youssef, Mei + Youssef);
# EN-6 and the fast round EN-7 are single-voice clips (EN-7: one clip per question/answer, placed with a 1.3 s answer gap).
import json, os, subprocess, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'lib'))
import pron, lipsync

# ---- v2 vocabulary (extends lib/ without editing it) ----
LEXV2 = {'hey': 'HH EY', 'leo': 'L IY OW', 'mei': 'M EY'}
lipsync.LEX.update({k: v for k, v in LEXV2.items() if k not in lipsync.LEX})
pron.OVERRIDE.update({'leo': 'ˈlioʊ', 'mei': 'meɪ', 'hey': 'heɪ', 'hello': 'həˈloʊ', 'sorry': 'ˈsɑri', "i'm": 'aɪm', 'am': 'æm',
                      'meet': 'mit', 'nice': 'naɪs', 'too': 'tu', 'see': 'si', 'name': 'neɪm', "what's": 'wʌts', 'your': 'jʊr',
                      'is': 'ɪz', 'oh': 'oʊ', 'goodbye': 'ɡʊdˈbaɪ'})

EP = "ep01v2"
AR_STYLE = ("Youssef, a friendly 26-year-old Egyptian man from Cairo, narrating his own travel diary in natural "
            "Egyptian Arabic (Cairo dialect). Warm, self-amused, lively and brisk, like telling a friend a funny story; keep a "
            "quick pace with no long pauses. {}")
SARA = "Friendly young American woman, a warm English teacher from New York. Natural, clear, relaxed General American accent. {}"
YOU = "Friendly 26-year-old Egyptian man speaking English with a light, natural Egyptian accent. {}"
YOU_MODEL = ("Friendly 26-year-old Egyptian man practicing English carefully: clear, standard General American "
             "pronunciation with no foreign accent (these are model phrases learners repeat). {}")
LEO = ("Leo, a cheerful, easygoing 24-year-old Latino-American guy, a student in a small English class in New York. Young, warm, "
       "upbeat, a smile in his voice, natural American English. {}")
MEI = ("Mei, a soft-spoken, friendly 23-year-old young woman from Taiwan, a student in a small English class in New York. She speaks "
       "clear simple English with a light, natural Taiwanese Mandarin accent; gentle and a little shy. {}")
NOTE_MEI = (" Bracketed tags and XML/IPA pronunciation markup in the text are silent instructions and must never be spoken; "
            "say exactly the tagged English words, with a light, natural Taiwanese Mandarin accent.")
VOICE = {"Sara": "Aoede", "Youssef": "Achird", "Leo": "Puck", "Mei": "Leda"}
STYLE = {"Sara": SARA, "Youssef": YOU, "Leo": LEO, "Mei": MEI}
NOTE = {"Sara": pron.NOTE, "Youssef": pron.NOTE, "Leo": pron.NOTE, "Mei": NOTE_MEI}

# ---------------- the ♻️ clips (from ep01-first-day, not dispatched) ----------------
REUSED = {"open", "en2", "en3", "turn"} | {f"r{i:02d}" for i in range(1, 11)}
reused_single = {
 "r01": ("Sara", "Hi!", "Bright and clear, a model phrase for learners."),
 "r02": ("Youssef", "Hello!", "Clear and friendly."),
 "r03": ("Youssef", "I am Youssef.", "Slow and clear, stressing the word 'am'."),
 "r04": ("Youssef", "I'm Youssef.", "Natural and confident."),
 "r05": ("Sara", "What's your name?", "Clear, a model phrase for learners."),
 "r06": ("Youssef", "My name is Youssef.", "Clear and confident."),
 "r07": ("Youssef", "Nice to meet you too.", "Warm and clear."),
 "r08": ("Sara", "Sorry?", "A natural questioning 'Sorry?', as when you did not hear well."),
 "r09": ("Sara", "Bye! See you!", "Cheerful, a model phrase for learners."),
 "r10": ("Youssef", "Goodbye!", "Cheerful."),
 "turn": ("Sara", "Hi! I'm Sara. <short pause> What's your name?", "Talking directly to the viewer, warm and inviting, a little slower."),
}
reused_multi = {
 "open": [
  ("Sara", "Hi! I'm Sara.", "Cheerful, welcoming a new student at the door."),
  ("Youssef", "Hello! I... I Youssef.", "Nervous beginner. He makes a typical beginner mistake and says exactly the words 'I Youssef' with NO 'am'; pronounce 'I' clearly and fully each time, then his name."),
  ("Sara", "<short pause> Sorry?", "Puzzled but kind."),
 ],
 "en2": [
  ("Sara", "What's your name?", "Kind and patient, a little slower, helping a nervous beginner."),
  ("Youssef", "My name is Youssef.", "Careful and slow, choosing each word, then relieved."),
  ("Sara", "Youssef! <short pause> Nice to meet you, Youssef.", "Delighted and warm."),
  ("Youssef", "Nice to meet you too.", "Happy, relieved, a big smile in the voice."),
  ("Sara", "Come in, come in!", "Welcoming, cheerful."),
 ],
 "en3": [
  ("Sara", "Bye, Youssef! See you tomorrow!", "Cheerful, end of the school day."),
  ("Youssef", "Goodbye, Sara! See you!", "Happy, tired after a long day."),
  ("Sara", "<short pause> Class is at eight!", "Calling after him brightly, as an afterthought."),
  ("Youssef", "Eight?!", "Shocked, comic disbelief."),
 ],
}

# ---------------- new clips ----------------
ar = {
 "ar00": ("استنوا… <short pause> خلّوني أحكيلكم من الأول.", "Playful, a quick aside to the audience after an embarrassing moment, rewinding the story."),
 "ar01": ("اسمي يوسف، مهندس من القاهرة، والنهارده أول يوم ليّا في نيويورك. <short pause> وطول الطريق وأنا بتمرّن:", "Upbeat and inviting, a little proud."),
 "ar05": ("سوري؟! <short pause> هي ما سمعتنيش؟ ولا أنا قلت حاجة غلط؟", "Panicked and embarrassed, fast, comic."),
 "ar06": ("المرة دي فهمتني على طول. <short pause> الفرق كان كلمة واحدة… هقولكم عليها.", "Relieved, then teasing."),
 "ar07": ("وفي الكلاس… قلتها صح. <short pause> مرة، واتنين، وتلاتة.", "Proud and happy, counting with growing confidence."),
 "ar08": ("تمانية الصبح؟! <short pause> أنا جاي أدرس… ولا جاي الجيش؟", "Shocked, comic."),
 "ar10": ("أنا قلت: آي يوسف. <short pause> في العربي: أنا يوسف، من غير فعل… <short pause> بس الإنجليزي لازم: آم.", "Clear and explanatory, friendly teacher, brisk."),
 "ar11": ("ومختصرها: آيم.", "Clear and light."),
 "ar13": ("ولما حد يقولك: نايس تو ميت يو، <short pause> الرد:", "Clear and light."),
 "ar12": ("يلا بسرعة… جاوب قبل يوسف!", "Energetic, playful, a quick game challenge."),
 "ar16": ("دورك! <short pause> سارة بتسألك:", "Energetic, encouraging."),
 "ar17": ("قلتها بـ آيم؟ <short pause> برافو!", "Proud and warm."),
 "ar19": ("حل تمارين الحلقة… <short pause> خمس دقايق، واللينك في الوصف.", "Friendly nudge, like a tip from a friend."),
 "ar18": ("الحلقة الجاية: <short pause> سارة هتسألني: هاو آر يو؟… <short pause> وأنا هرد رد عمري ما هنساه.", "Teaser, mysterious and funny."),
}
FAST = "Quick and snappy, a fast quiz round: say it promptly, with no pause before or after."
en_single = {
 "en1a": ("Youssef", "Hello! <short pause> Hi! <short pause> Hello!",
          "Walking along the street, rehearsing to himself out loud under his breath at first, growing more confident each time; "
          "the last 'Hello!' bright and proud. He says exactly three words: Hello, Hi, Hello."),
 "e6s": ("Sara", "I'm Sara.", "Bright and clear, a quick model phrase."),
 "e6l": ("Leo", "I'm Leo.", "Cheerful and clear, a quick model phrase."),
 "e6m": ("Mei", "I'm Mei.", "Soft and clear, smiling, a quick model phrase."),
 "e7q1": ("Sara", "Hi!", FAST + " A bright, clear greeting 'Hi!' with a clear H sound (rhymes with 'my'); it is NOT 'Bye'."),  # v2: v1 sounded like "Bye"
 "e7a1": ("Youssef", "Hello!", FAST + " Clear model pronunciation."),
 "e7q2": ("Sara", "What's your name?", FAST),
 "e7a2": ("Youssef", "I'm Youssef.", FAST + " Clear model pronunciation."),
 "e7q3": ("Sara", "Nice to meet you.", FAST),
 "e7a3": ("Youssef", "Nice to meet you too.", FAST + " Clear model pronunciation."),
 "e7q4": ("Sara", "Bye!", FAST),
 "e7a4": ("Youssef", "See you!", FAST + " Clear model pronunciation."),
}
en_multi = {
 "en4": [
  ("Leo", "Hey! I'm Leo.", "Turning round from his desk with a big friendly grin, relaxed and welcoming."),
  ("Youssef", "Hi, Leo! I'm Youssef. Nice to meet you.", "A man's natural speaking voice, friendly and now confident; he says 'I'm Youssef' correctly."),
  ("Leo", "Nice to meet you too!", "Warm and upbeat."),
 ],
 "en5": [
  ("Mei", "Hello! What's your name?", "Shy and friendly, a little quiet."),
  ("Youssef", "My name is Youssef.", "A man's natural speaking voice, friendly, normal volume."),
  ("Mei", "Sorry?", "She did not hear well: a soft, questioning 'Sorry?'."),
  ("Youssef", "Youssef! I'm Youssef!", "A man's voice, louder and clearer, smiling and confident, repeating his name for her."),
  ("Mei", "Oh! Hi, Youssef! I'm Mei.", "Delighted, a little laugh, warm."),
 ],
}

jobs = {}
for k, (text, mood) in ar.items():
    text = pron.tag(text)
    jobs[k] = {"text": text, "style": AR_STYLE.format(mood) + (pron.NOTE_AR if pron.has_english(text) else ''), "voice": "Achird",
               "transcript": {"language_codes": ["ar-EG"], "write_vtt": True}}
for k, (who, text, mood) in {**reused_single, **en_single}.items():
    base = YOU_MODEL if who == "Youssef" and (k.startswith('r') or k.startswith('e7')) else STYLE[who]
    jobs[k] = {"text": pron.tag_line(text), "style": base.format(mood) + NOTE[who], "voice": VOICE[who],
               "transcript": {"language_codes": ["en-US"], "write_vtt": True}}
for k, turns in {**reused_multi, **en_multi}.items():
    who = sorted({w for w, _, _ in turns})
    assert len(who) == 2, k   # Gemini multi-speaker: exactly two voices per job
    jobs[k] = {"turns": [{"speaker": w, "text": pron.tag_line(t), "style": STYLE[w].format(m) + NOTE[w]} for w, t, m in turns],
               "speakers": {w: VOICE[w] for w in who}, "transcript": {"language_codes": ["en-US"], "write_vtt": True}}
for j in jobs.values():
    j.update(routing="quality", format="wav", temperature=1)
if pron.MISSING:
    print("no IPA for:", sorted(pron.MISSING))

HERE = os.path.dirname(os.path.abspath(__file__))
json.dump(jobs, open(os.path.join(HERE, "jobs.json"), "w"), ensure_ascii=False, indent=1)
print(len(jobs), "jobs,", len([k for k in jobs if k not in REUSED]), "new")

if "dispatch" in sys.argv:
    rest = sys.argv[sys.argv.index("dispatch") + 1:]
    ver = rest[0] if rest and rest[0].startswith("v") else "v1"
    only = [a for a in rest if not a.startswith("v")]
    for k, req in jobs.items():
        if k in REUSED or (only and k not in only):
            continue
        body = {"event_type": "tts.generate", "client_payload": {"job_id": f"channel-{EP}-{k}-{ver}", "request": req}}
        subprocess.run(["gh", "api", "-X", "POST", "repos/addvaluewithai-hub/gemini-tts/dispatches", "--input", "-"],
                       input=json.dumps(body).encode(), check=True)
        print("dispatched", k)
