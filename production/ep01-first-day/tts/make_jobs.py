# Builds the TTS job list for episode 1 and dispatches it to the gemini-tts factory.
# python3 make_jobs.py [dispatch [vN] [job ...]]
# English is pinned with <lang>/<phoneme> IPA (General American); Arabic narration carries tagged English (lib/pron.py).
import json, os, subprocess, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'lib'))
import pron

EP = "ep01"
AR_STYLE = ("Youssef, a friendly 26-year-old Egyptian man from Cairo, narrating his own travel diary in natural "
            "Egyptian Arabic (Cairo dialect). Warm, self-amused, intimate like telling a friend, medium pace. {}")
SARA = "Friendly young American woman, a warm English teacher from New York. Natural, clear, relaxed General American accent, medium pace. {}"
YOU = "Friendly 26-year-old Egyptian man speaking English with a light, natural Egyptian accent. {}"
YOU_MODEL = ("Friendly 26-year-old Egyptian man practicing English carefully: clear, slow-ish, standard General American "
             "pronunciation with no foreign accent (these are model phrases learners repeat). {}")
SPK = {"Sara": "Aoede", "Youssef": "Achird"}

ar = {
 "ar01": ("اسمي يوسف. <short pause> مهندس من القاهرة، عندي ستة وعشرين سنة… <short pause> والنهارده أول يوم ليّا في نيويورك.", "Opening of the story, inviting."),
 "ar02": ("جاي أدرس إنجليزي وأشتغل هنا. <short pause> وكنت فاكر إن الإنجليزي بتاعي كويس… <short pause> لحد ما قابلت سارة.", "Ends with a small knowing laugh in the voice."),
 "ar03": ("طول الطريق من المطار وأنا بحضّر أول جملة هقولها. <short pause> هقولها بثقة… وبابتسامة.", "Confident, a bit proud."),
 "ar04": ("ولقيت المدرسة. <short pause> باب أزرق، ويافطة كبيرة… <short pause> والباب اتفتح.", "Building suspense at the end."),
 "ar05": ("سوري؟! <short pause> هي ما سمعتنيش؟ ولا أنا قلت حاجة غلط؟ <short pause> ما أنا قلت اسمي أهو!", "Panicked and embarrassed, faster, comic."),
 "ar06": ("المرة دي فهمتني على طول. <short pause> الفرق كان كلمة واحدة صغيرة… هحكيلكم عليها في الآخر.", "Relieved, then teasing."),
 "ar07": ("اليوم عدّى بسرعة. <short pause> كلاس، وناس جديدة، وكلام كتير ما فهمتش نصه.", "Light, a bit tired, amused."),
 "ar08": ("تمانية الصبح؟! <short pause> هو أنا جاي أدرس… ولا جاي الجيش؟", "Shocked, comic."),
 "ar09": ("تعالوا نشوف اتعلمت إيه النهارده.", "Upbeat, like a friendly teacher."),
 "ar10": ("أول حاجة، غلطتي. <short pause> أنا قلت: آي يوسف. <short pause> في العربي بنقول أنا يوسف من غير أي فعل… <short pause> لكن في الإنجليزي لازم يبقى فيه: آم.", "Clear and explanatory, friendly teacher."),
 "ar11": ("وغالبًا بنختصرها لـ: آيم، <short pause> وبتتقال بسرعة كأنها كلمة واحدة.", "Clear and explanatory."),
 "ar12": ("ولو عايز تسأل حد عن اسمه، <short pause> والرد:", "Clear and explanatory."),
 "ar13": ("ولما حد يقولك: نايس تو ميت يو، <short pause> ما تقولش: مي تو. <short pause> قول:", "Clear, a little playful."),
 "ar14": ("ولو ما سمعتش كويس، قول ببساطة:", "Clear and explanatory."),
 "ar15": ("وإنت ماشي:", "Light."),
 "ar16": ("دورك! <short pause> سارة بتسألك… رد عليها بصوت عالي.", "Energetic, encouraging."),
 "ar17": ("قلتها بـ آيم؟ <short pause> برافو عليك! <short pause> واكتبها في الكومنتات.", "Proud and warm."),
 "ar18": ("الحلقة الجاية: <short pause> صحيت متأخر، وأول ما شفت سارة سألتني: هاو آر يو؟… <short pause> وأنا رديت رد عمري ما هنساه.", "Teaser, mysterious and funny."),
 "ar19": ("وعشان الجمل دي تثبت في دماغك… <short pause> ادخل على الموقع وحل تمارين الحلقة. <short pause> خمس دقايق بس. <short pause> اللينك في الوصف.", "Friendly nudge, encouraging, like a tip from a friend."),
}

en_single = {   # recap model phrases (learners repeat them) + the "your turn" question
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

en_multi = {
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

jobs = {}
for k, (text, mood) in ar.items():
    text = pron.tag(text)   # English inside the Arabic gets <lang>/<phoneme> markup
    jobs[k] = {"text": text, "style": AR_STYLE.format(mood) + (pron.NOTE_AR if pron.has_english(text) else ''), "voice": "Achird",
               "transcript": {"language_codes": ["ar-EG"], "write_vtt": True}}
for k, (who, text, mood) in en_single.items():
    base = SARA if who == "Sara" else YOU_MODEL
    jobs[k] = {"text": pron.tag_line(text), "style": base.format(mood) + pron.NOTE, "voice": SPK[who],
               "transcript": {"language_codes": ["en-US"], "write_vtt": True}}
for k, turns in en_multi.items():
    jobs[k] = {"turns": [{"speaker": w, "text": pron.tag_line(t), "style": (SARA if w == "Sara" else YOU).format(m) + pron.NOTE}
                         for w, t, m in turns],
               "speakers": SPK, "transcript": {"language_codes": ["en-US"], "write_vtt": True}}
for j in jobs.values():
    j.update(routing="quality", format="wav", temperature=1)
if pron.MISSING:
    print("no IPA for:", sorted(pron.MISSING))

json.dump(jobs, open("jobs.json", "w"), ensure_ascii=False, indent=1)
print(len(jobs), "jobs")

if "dispatch" in sys.argv:
    rest = sys.argv[sys.argv.index("dispatch") + 1:]
    ver = rest[0] if rest and rest[0].startswith("v") else "v1"
    only = [a for a in rest if not a.startswith("v")]
    for k, req in jobs.items():
        if only and k not in only:
            continue
        body = {"event_type": "tts.generate", "client_payload": {"job_id": f"channel-{EP}-{k}-{ver}", "request": req}}
        subprocess.run(["gh", "api", "-X", "POST", "repos/addvaluewithai-hub/gemini-tts/dispatches", "--input", "-"],
                       input=json.dumps(body).encode(), check=True)
        print("dispatched", k)
