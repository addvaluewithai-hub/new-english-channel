# Builds the TTS job list for episode 2 and dispatches it to the gemini-tts factory.
# python3 make_jobs.py [dispatch [job ...]]
import json, os, subprocess, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'lib'))
import pron

EP = "ep02"
AR_STYLE = ("Youssef, a friendly 26-year-old Egyptian man from Cairo, narrating his own travel diary in natural "
            "Egyptian Arabic (Cairo dialect). Warm, self-amused, intimate like telling a friend, medium pace. {}")
MIA = "Friendly young American woman, a warm English teacher from New York. Natural, clear, relaxed American accent, medium pace. {}"
YOU = "Friendly 26-year-old Egyptian man speaking English with a light, natural Egyptian accent. {}"
SPK = {"Mia": "Aoede", "Youssef": "Achird"}

ar = {
 "ar01": ("تاني يوم ليّا في لندن. <short pause> المنبه رن الساعة سبعة… وأنا ما سمعتوش. <short pause> صحيت الساعة تمانية وعشرة.", "Sleepy at first, then alarmed."),
 "ar02": ("جريت على المدرسة من غير فطار ولا قهوة… <short pause> وده كان الغلط الأول في اليوم.", "Rushed, with a knowing laugh at the end."),
 "ar03": ("طول الطريق وأنا بحضّر تحية الصبح. <short pause> عارفها: جود مورنينج! <short pause> سهلة… بس أنا كنت نايم وأنا بجري.", "Out of breath, self-mocking."),
 "ar04": ("قلتلها تصبحي على خير… <short pause> الساعة تمانية الصبح! <short pause> هي ضحكت، وأنا كنت عايز أرجع أنام من الكسوف.", "Mortified, comic."),
 "ar05": ("أول شفطة قهوة… ورجعت بني آدم. <short pause> وخدت بالي إنها ردت بجملة مش عارفها: <short pause> يور ويلكم.", "Relieved and content, then curious."),
 "ar06": ("قلت: ويلكم! زي ما بنقول عفوًا… <short pause> بس طلعت ناقصة كلمة. <short pause> هحكيلكم.", "Confident then sheepish, teasing."),
 "ar07": ("وفي الآخر، قلتها صح: <short pause> جود نايت بتتقال وإنت ماشي، مش وإنت جاي. <short pause> بس الاستمارة دي… فيها سؤال وقفت قدامه.", "Satisfied, then a worried cliffhanger."),
 "ar08": ("تعالوا نشوف اتعلمت إيه النهارده.", "Upbeat, like a friendly teacher."),
 "ar09": ("الصبح، وبعد الضهر، وبالليل. <short pause> لكن جود نايت مش تحية… <short pause> دي للوداع بس، وإنت ماشي أو رايح تنام.", "Clear and explanatory, friendly teacher."),
 "ar10": ("ولما حد يسألك: هاو آر يو؟ <short pause> ما تردش رد محفوظ. قول رد حقيقي:", "Clear, a little playful."),
 "ar11": ("وبعدها اسأله هو: آند يو؟", "Clear and explanatory."),
 "ar12": ("ولما حد يقولك: ثانك يو، <short pause> ما تقولش: ويلكم، لوحدها. <short pause> الرد الصح:", "Clear and explanatory."),
 "ar13": ("وكلمتين من الذوق: <short pause> بليز لما تطلب، <short pause> وسوري لما تغلط.", "Clear and warm."),
 "ar14": ("دورك! <short pause> ميا بتسألك… رد عليها رد حقيقي، بصوت عالي.", "Energetic, encouraging."),
 "ar15": ("رديت؟ برافو! <short pause> واكتب في الكومنتات: إنت عامل إيه النهارده… بالإنجليزي.", "Proud and warm."),
 "ar16": ("الحلقة الجاية: الاستمارة. <short pause> أرقام، وسؤال: هاو أولد آر يو؟… <short pause> وأنا قلت: آي هاف توينتي سيكس ييرز. <short pause> وطلعت غلط.", "Teaser, mysterious and funny."),
}

en_single = {
 "r01": ("Mia", "Good morning.", "Bright and clear, a model phrase for learners."),
 "r02": ("Youssef", "Good afternoon.", "Clear and friendly, a model phrase for learners."),
 "r03": ("Mia", "Good evening.", "Warm and clear, a model phrase for learners."),
 "r04": ("Youssef", "Good night!", "Cheerful goodbye, a model phrase for learners."),
 "r05": ("Mia", "How are you?", "Clear, with the natural falling intonation, a model phrase for learners."),
 "r06": ("Youssef", "I'm good, thanks!", "Natural and upbeat, a model phrase for learners."),
 "r07": ("Youssef", "I'm OK… a little tired.", "Natural, slightly tired, a model phrase for learners."),
 "r08": ("Youssef", "Not bad!", "Casual and natural, a model phrase for learners."),
 "r09": ("Youssef", "And you?", "Friendly, a model phrase for learners."),
 "r10": ("Mia", "You're welcome.", "Warm and clear, stressing both words, a model phrase for learners."),
 "r11": ("Youssef", "Coffee, please.", "Polite and clear, a model phrase for learners."),
 "r12": ("Youssef", "Sorry!", "A quick apologetic 'Sorry!', a model phrase for learners."),
 "turn": ("Mia", "Good morning! <short pause> How are you?", "Talking directly to the viewer, warm and inviting, a little slower."),
}

en_multi = {
 "en1": [
  ("Mia", "Good morning, Youssef! How are you?", "Cheerful, holding two coffees."),
  ("Youssef", "<long pause> Good… night.", "Half asleep, yawning through the words, slow and mumbled. He really says 'Good night' by mistake."),
  ("Mia", "Good night?!", "Surprised and laughing kindly."),
  ("Youssef", "Oh! Sorry! Good morning!", "Suddenly awake, flustered, quick."),
 ],
 "en2": [
  ("Mia", "So… how are you?", "Gentle, giving him a second chance."),
  ("Youssef", "I'm OK… a little tired.", "Honest, tired, a small smile."),
  ("Mia", "Oh, sorry! Coffee?", "Sympathetic, offering."),
  ("Youssef", "Yes, please! Thank you!", "Grateful, brightening up."),
  ("Mia", "You're welcome.", "Warm."),
 ],
 "en3": [
  ("Mia", "Thank you, Youssef!", "Cheerful, he is holding the door for her."),
  ("Youssef", "Welcome!", "Confident, proud of himself. He says only the single word 'Welcome'."),
  ("Mia", "<short pause> You're welcome.", "Smiling, gently correcting, stressing 'You're'."),
  ("Youssef", "You're welcome!", "Repeating it carefully, pleased."),
 ],
 "en4": [
  ("Mia", "Oh! One more thing. This form, please. For tomorrow.", "Remembering something, handing him a paper."),
  ("Youssef", "OK… thank you.", "A little unsure, looking at the paper."),
  ("Mia", "Good night, Youssef!", "Cheerful goodbye, end of the day."),
  ("Youssef", "Good night, Mia!", "Confident and happy, he got it right this time."),
 ],
}

jobs = {}
for k, (text, mood) in ar.items():
    text = pron.tag(text)   # English inside the Arabic gets <lang>/<phoneme> markup
    jobs[k] = {"text": text, "style": AR_STYLE.format(mood) + (pron.NOTE if pron.has_english(text) else ''), "voice": "Achird",
               "transcript": {"language_codes": ["ar-EG"], "write_vtt": True}}
for k, (who, text, mood) in en_single.items():
    jobs[k] = {"text": text, "style": (MIA if who == "Mia" else YOU).format(mood), "voice": SPK[who],
               "transcript": {"language_codes": ["en-US"], "write_vtt": True}}
for k, turns in en_multi.items():
    jobs[k] = {"turns": [{"speaker": w, "text": t, "style": (MIA if w == "Mia" else YOU).format(m)} for w, t, m in turns],
               "speakers": SPK, "transcript": {"language_codes": ["en-US"], "write_vtt": True}}
for j in jobs.values():
    j.update(routing="quality", format="wav", temperature=1)

try:
    old = json.load(open('jobs.json'))
    for k, v in old.items():
        jobs.setdefault(k, v)
except FileNotFoundError:
    pass
json.dump(jobs, open("jobs.json", "w"), ensure_ascii=False, indent=1)
print(len(jobs), "jobs")

if "dispatch" in sys.argv:
    only = sys.argv[sys.argv.index("dispatch") + 1:]
    ver = sys.argv[sys.argv.index("dispatch") + 1] if len(sys.argv) > sys.argv.index("dispatch") + 1 and sys.argv[sys.argv.index("dispatch") + 1].startswith("v") else "v1"
    only = [a for a in only if not a.startswith("v")]
    for k, req in jobs.items():
        if only and k not in only:
            continue
        body = {"event_type": "tts.generate", "client_payload": {"job_id": f"channel-{EP}-{k}-{ver}", "request": req}}
        subprocess.run(["gh", "api", "-X", "POST", "repos/addvaluewithai-hub/gemini-tts/dispatches", "--input", "-"],
                       input=json.dumps(body).encode(), check=True)
        print("dispatched", k)
