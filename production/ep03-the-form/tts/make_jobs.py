# Builds the TTS job list for episode 3 and dispatches it to the gemini-tts factory.
# python3 make_jobs.py [dispatch [vN] [job ...]]
# English is pinned with <lang>/<phoneme> IPA (General American); Arabic narration carries tagged English (lib/pron.py).
# Episode-local vocabulary (numbers with their stress, new words, the receptionist) is added here, not in lib/.
import json, os, subprocess, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'lib'))
import pron, lipsync
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import vocab   # episode 3 words: IPA + ARPAbet, transliterations (tts/vocab.py)

EP = "ep03"
AR_STYLE = ("Youssef, a friendly 26-year-old Egyptian man from Cairo, narrating his own travel diary in natural "
            "Egyptian Arabic (Cairo dialect). Warm, self-amused, intimate like telling a friend, medium pace. {}")
SARA = "Friendly young American woman, a warm English teacher from New York. Natural, clear, relaxed General American accent, medium pace. {}"
LOPEZ = ("Friendly, cheerful woman of about sixty, the receptionist of a language school in New York: warm, chatty, motherly, "
         "a natural New York American accent, clear, medium pace. {}")
YOU = "Friendly 26-year-old Egyptian man speaking English with a light, natural Egyptian accent. {}"
YOU_MODEL = ("Friendly 26-year-old Egyptian man practicing English carefully: clear, slow-ish, standard General American "
             "pronunciation with no foreign accent (these are model phrases learners repeat). {}")
VOICE = {"Sara": "Aoede", "Youssef": "Achird", "Lopez": "Gacrux"}
BASE = {"Sara": SARA, "Youssef": YOU, "Lopez": LOPEZ}

ar = {
 "ar01": ("تالت يوم ليّا في نيويورك. <short pause> المرة دي صحيت بدري… <short pause> ووصلت قبل الميعاد بعشر دقايق!", "Proud and pleased with himself."),
 "ar02": ("ومعايا الاستمارة. <short pause> ملّيتها كلها… <short pause> إلا خانة واحدة.", "Confident, then a little worried at the end."),
 "ar03": ("آي هاف توينتي سيكس ييرز… <short pause> يعني: عندي ستة وعشرين سنة. <short pause> ترجمتها من العربي كلمة كلمة… <short pause> وهي بصّتلي كإني شايل السنين دي في شنطتي!", "Panicked and comic, realizing his mistake."),
 "ar04": ("في الإنجليزي، إنت مش عندك سن… <short pause> إنت سنّك. <short pause> آيم توينتي سيكس… <short pause> زي آيم تايرد بالظبط.", "Relieved, explaining a discovery, a little amazed."),
 "ar05": ("سيكستين وسيكستي… <short pause> قريبين أوي من بعض. <short pause> الفرق في الضغطة: سيكستين، الضغطة في الآخر… <short pause> سيكستي، في الأول. <short pause> وهي فرحت أوي إني اديتها ستاشر سنة!", "Amused, explaining clearly, laughing at the end."),
 "ar06": ("أول كلاس ليّا في نيويورك… <short pause> ورا الباب ده، ناس جاية من كل حتة في الدنيا.", "Excited and a little nervous, a cliffhanger."),
 "ar07": ("تعالوا نشوف اتعلمت إيه النهارده. <short pause> الأول: الأرقام.", "Upbeat, like a friendly teacher."),
 "ar08": ("ومن تلتاشر لتسعتاشر… <short pause> كلهم آخرهم تيين.", "Clear and explanatory."),
 "ar09": ("والعشرات آخرها تيي.", "Clear and explanatory."),
 "ar10": ("وخلي بالك من الضغطة: <short pause> في تيين الضغطة في الآخر… <short pause> وفي تيي الضغطة في الأول.", "Clear and explanatory, stressing the important point."),
 "ar11": ("ولما حد يسألك: هاو أولد آر يو؟ <short pause> قول: آيم، وبعدها سنّك.", "Clear and friendly."),
 "ar12": ("لكن ما تقولش: آي هاف توينتي سيكس ييرز… <short pause> ولا: آيم توينتي سيكس ييرز، من غير أولد.", "Clear, a little playful, warning."),
 "ar13": ("وآخر حاجة: <short pause> إحنا بنقول ستة وعشرين، الستة الأول. <short pause> الإنجليزي بيقول العشرين الأول:", "Clear and explanatory."),
 "ar14": ("دورك! <short pause> سارة هتسألك… قول سنّك بصوت عالي.", "Energetic, encouraging."),
 "ar15": ("قلتها؟ برافو! <short pause> واكتب سنّك في الكومنتات… بالحروف الإنجليزي، مش بالأرقام.", "Proud and warm."),
 "ar16": ("وزي كل حلقة: <short pause> ادخل على الموقع وحل تمارين الحلقة، <short pause> خمس دقايق والأرقام تثبت. <short pause> اللينك في الوصف.", "Friendly nudge, encouraging, like a tip from a friend."),
 "ar17": ("الحلقة الجاية: أول كلاس. <short pause> زميلة جديدة… <short pause> وسؤال شكله سهل: وير آر يو فروم؟ <short pause> وأنا… اتلخبطت تاني.", "Teaser, mysterious and funny."),
}

en_single = {   # recap model phrases (learners repeat them) + the "your turn" question
 "r01": ("Sara", "One, two, three, four, five, six, seven, eight, nine, ten.", "Counting slowly and clearly for learners, a small pause after each number."),
 "r02": ("Youssef", "Thirteen, fourteen, fifteen, sixteen, seventeen, eighteen, nineteen.", "Counting slowly and clearly, the stress on the last syllable of each number (-TEEN)."),
 "r03": ("Sara", "Twenty, thirty, forty, fifty, sixty, seventy, eighty, ninety, one hundred.", "Counting slowly and clearly, the stress on the first syllable of each number."),
 "r04": ("Sara", "Thirteen. <short pause> Thirty. <short pause> Sixteen. <short pause> Sixty.", "A model of the stress contrast, slow: thirTEEN with the stress at the end, THIRty with the stress at the start; sixTEEN, SIXty. A clear pause after each word."),
 "r05": ("Sara", "How old are you?", "Clear and friendly, a model question."),
 "r06": ("Youssef", "I'm 26.", "Clear and friendly: I'm twenty-six."),
 "r07": ("Youssef", "I'm 26 years old.", "Clear and friendly: I'm twenty-six years old."),
 "r08": ("Youssef", "Twenty-six.", "Clear, a model word, the stress on TWEN."),
 "turn": ("Sara", "How old are you?", "Talking directly to the viewer, warm and inviting, a little slower."),
}

en_multi = {
 "en1": [
  ("Lopez", "Good morning! Can I help you?", "Cheerful, looking up from her desk."),
  ("Youssef", "Good morning! This is my form.", "Polite and proud, handing over a paper."),
  ("Lopez", "Thank you! Youssef… from Cairo. Nice! And how old are you?", "Reading the form aloud, friendly, then asking."),
  ("Youssef", "<short pause> I have 26 years.", "Proud and confident. He says exactly the words 'I have twenty-six years' (a learner's mistake): NOT 'I'm twenty-six' and NOT 'years old'."),
  ("Lopez", "<short pause> You… have… 26 years?", "Puzzled and amused, slowly repeating his strange sentence word by word."),
 ],
 "en2": [
  ("Sara", "Youssef! Not \"I have\". Say: I'm 26.", "A quick friendly whisper, helping him."),
  ("Youssef", "Oh! I'm 26!", "Understanding, relieved, clear: I'm twenty-six."),
 ],
 "en3": [
  ("Lopez", "OK! 26. Great!", "Writing on the form, cheerful: twenty-six."),
  ("Youssef", "And you? How old are you?", "Friendly and innocent, proud to ask back."),
  ("Lopez", "Me? <short pause> Ha! I'm sixty.", "Surprised, then laughing good-naturedly; says 'sixty' with the stress on SIX."),
  ("Youssef", "Sixteen?!", "Shocked and amazed. He says exactly 'sixteen' (six-TEEN, the stress at the end), NOT 'sixty'."),
  ("Lopez", "Sixteen? Oh, thank you! <short pause> No, no. Sixty! Six-zero!", "Flattered and laughing warmly, then clearly correcting him: SIXty, six-zero."),
 ],
 "en4": [
  ("Sara", "OK, Youssef! Class starts now. Room four!", "Cheerful, hurrying him along."),
  ("Youssef", "Now?! OK!", "Surprised, then excited."),
 ],
}

jobs = {}
for k, (text, mood) in ar.items():
    text = pron.tag(text)
    jobs[k] = {"text": text, "style": AR_STYLE.format(mood) + (pron.NOTE_AR if pron.has_english(text) else ''), "voice": "Achird",
               "transcript": {"language_codes": ["ar-EG"], "write_vtt": True}}
for k, (who, text, mood) in en_single.items():
    base = SARA if who == "Sara" else YOU_MODEL
    jobs[k] = {"text": pron.tag_line(text), "style": base.format(mood) + pron.NOTE, "voice": VOICE[who],
               "transcript": {"language_codes": ["en-US"], "write_vtt": True}}
for k, turns in en_multi.items():
    who = sorted({w for w, _, _ in turns})
    assert len(who) == 2, k   # the factory's multi-speaker mode takes exactly two speakers
    jobs[k] = {"turns": [{"speaker": w, "text": pron.tag_line(t), "style": BASE[w].format(m) + pron.NOTE} for w, t, m in turns],
               "speakers": {w: VOICE[w] for w in who}, "transcript": {"language_codes": ["en-US"], "write_vtt": True}}
for j in jobs.values():
    j.update(routing="quality", format="wav", temperature=1)
# Arabic left untagged that should have been English (a transliteration missing from PHRASES)
for k, j in jobs.items():
    if k.startswith('ar') and any(x in j['text'] for x in ('توينتي', 'سيكس', 'آي هاف', 'هاو', 'تيين', 'تيي', 'وير')):
        print('untagged transliteration in', k)
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
