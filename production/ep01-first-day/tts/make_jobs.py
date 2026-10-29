# Builds the TTS job list for episode 1 and dispatches it to the gemini-tts factory.
# python3 make_jobs.py [dispatch]
import json, subprocess, sys

AR_STYLE = ("Youssef, a friendly 26-year-old Egyptian man from Cairo, narrating his own travel diary in natural "
            "Egyptian Arabic (Cairo dialect). Warm, self-amused, intimate like telling a friend, medium pace. {}")
MIA = "Friendly young American woman, a warm English teacher from New York. Natural, clear, relaxed American accent, medium pace. {}"
YOU = "Friendly 26-year-old Egyptian man speaking English with a light, natural Egyptian accent. {}"
SPK = {"Mia": "Aoede", "Youssef": "Achird"}

ar = {
 "ar01": ("اسمي يوسف. <short pause> مهندس من القاهرة، عندي ستة وعشرين سنة… <short pause> والنهارده أول يوم ليّا في لندن.", "Opening of the story, inviting."),
 "ar02": ("جاي أدرس إنجليزي وأشتغل هنا. <short pause> وكنت فاكر إن الإنجليزي بتاعي كويس… <short pause> لحد ما قابلت ميا.", "Ends with a small knowing laugh in the voice."),
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
 "ar16": ("دورك! <short pause> ميا بتسألك… رد عليها بصوت عالي.", "Energetic, encouraging."),
 "ar17": ("قلتها بـ آيم؟ <short pause> برافو عليك! <short pause> واكتبها في الكومنتات.", "Proud and warm."),
 "ar18": ("الحلقة الجاية: <short pause> صحيت متأخر، وأول ما شفت ميا سألتني: هاو آر يو؟… <short pause> وأنا رديت رد عمري ما هنساه.", "Teaser, mysterious and funny."),
}

en_single = {
 "r01": ("Mia", "Hi!", "Bright and clear, a model phrase for learners."),
 "r02": ("Youssef", "Hello!", "Clear and friendly, a model phrase for learners."),
 "r03": ("Youssef", "I am Youssef.", "Slow and clear, stressing the word 'am', a model phrase for learners."),
 "r04": ("Youssef", "I'm Youssef.", "Natural and confident, a model phrase for learners."),
 "r05": ("Mia", "What's your name?", "Clear, a model phrase for learners."),
 "r06": ("Youssef", "My name is Youssef.", "Clear and confident, a model phrase for learners."),
 "r07": ("Youssef", "Nice to meet you too.", "Warm and clear, a model phrase for learners."),
 "r08": ("Mia", "Sorry?", "A natural questioning 'Sorry?', as when you did not hear well."),
 "r09": ("Mia", "Bye! See you!", "Cheerful, a model phrase for learners."),
 "r10": ("Youssef", "Goodbye!", "Cheerful, a model phrase for learners."),
 "turn": ("Mia", "Hi! I'm Mia. <short pause> What's your name?", "Talking directly to the viewer, warm and inviting, a little slower."),
}

en_multi = {
 "en2": [
  ("Mia", "What's your name?", "Kind and patient, a little slower, helping a nervous beginner."),
  ("Youssef", "My name is Youssef.", "Careful and slow, choosing each word, then relieved."),
  ("Mia", "Youssef! <short pause> Nice to meet you, Youssef.", "Delighted and warm."),
  ("Youssef", "Nice to meet you too.", "Happy, relieved, a big smile in the voice."),
  ("Mia", "Come in, come in!", "Welcoming, cheerful."),
 ],
 "en3": [
  ("Mia", "Bye, Youssef! See you tomorrow!", "Cheerful, end of the school day."),
  ("Youssef", "Goodbye, Mia! See you!", "Happy, tired after a long day."),
  ("Mia", "<short pause> Class is at eight!", "Calling after him brightly, as an afterthought."),
  ("Youssef", "Eight?!", "Shocked, comic disbelief."),
 ],
}

jobs = {}
for k, (text, mood) in ar.items():
    jobs[k] = {"text": text, "style": AR_STYLE.format(mood), "voice": "Achird",
               "transcript": {"language_codes": ["ar-EG"], "write_vtt": True}}
for k, (who, text, mood) in en_single.items():
    jobs[k] = {"text": text, "style": (MIA if who == "Mia" else YOU).format(mood), "voice": SPK[who],
               "transcript": {"language_codes": ["en-US"], "write_vtt": True}}
for k, turns in en_multi.items():
    jobs[k] = {"turns": [{"speaker": w, "text": t, "style": (MIA if w == "Mia" else YOU).format(m)} for w, t, m in turns],
               "speakers": SPK, "transcript": {"language_codes": ["en-US"], "write_vtt": True}}
for j in jobs.values():
    j.update(routing="quality", format="wav", temperature=1)

json.dump(jobs, open("jobs.json", "w"), ensure_ascii=False, indent=1)
print(len(jobs), "jobs")

if "dispatch" in sys.argv:
    only = [a for a in sys.argv[2:]]
    ver = "v1"
    for k, req in jobs.items():
        if only and k not in only:
            continue
        body = {"event_type": "tts.generate", "client_payload": {"job_id": f"channel-ep01-{k}-{ver}", "request": req}}
        subprocess.run(["gh", "api", "-X", "POST", "repos/addvaluewithai-hub/gemini-tts/dispatches", "--input", "-"],
                       input=json.dumps(body).encode(), check=True)
        print("dispatched", k)
