# Builds the TTS job list for episode 4 and dispatches it to the gemini-tts factory.
# python3 make_jobs.py [dispatch [vN] [job ...]]
# English is pinned with <lang>/<phoneme> IPA (General American); Arabic narration carries tagged English (lib/pron.py).
# Gemini multi-speaker jobs take exactly two voices, so the three-person class is cut into two-voice jobs (or solo clips).
import json, os, subprocess, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'lib'))
import pron, lipsync

# ---- episode 4 vocabulary (extends lib/ without editing it) ----
LEX4 = {"let's": 'L EH T S', 'ana': 'AA N AH', 'first': 'F ER S T', 'everybody': 'EH V R IY B AA D IY', 'spain': 'S P EY N',
        'brooklyn': 'B R UH K L IH N', 'turn': 'T ER N', 'queens': 'K W IY N Z', 'madrid': 'M AH D R IH D', 'spanish': 'S P AE N IH SH',
        'egyptian': 'IH JH IH P SH AH N', 'american': 'AH M EH R IH K AH N', 'america': 'AH M EH R IH K AH', 'new': 'N UW',
        'york': 'Y AO R K', 'next': 'N EH K S T', 'question': 'K W EH S CH AH N', 'class': 'K L AE S', 'great': 'G R EY T'}
lipsync.LEX.update({k: v for k, v in LEX4.items() if k not in lipsync.LEX})
pron.OVERRIDE.update({'egypt': 'ˈidʒɪpt', 'egyptian': 'iˈdʒɪpʃən', 'spain': 'speɪn', 'spanish': 'ˈspænɪʃ', 'madrid': 'məˈdrɪd',
                      'queens': 'kwinz', 'brooklyn': 'ˈbrʊklɪn', 'ana': 'ˈɑnə', 'live': 'lɪv', 'cairo': 'ˈkaɪroʊ', 'from': 'frəm',
                      'american': 'əˈmɛrɪkən', 'america': 'əˈmɛrɪkə', 'everybody': 'ˈɛvriˌbɑdi', 'first': 'fɚst', 'turn': 'tɚn',
                      "let's": 'lɛts', 'next': 'nɛkst', 'question': 'ˈkwɛstʃən', 'where': 'wɛr', 'your': 'jʊr', "you're": 'jʊr',
                      'great': 'ɡreɪt', 'class': 'klæs', 'what': 'wʌt', 'do': 'du', 'yes': 'jɛs', 'not': 'nɑt', 'no': 'noʊ',
                      'hello': 'həˈloʊ', 'thank': 'θæŋk', 'sorry': 'ˈsɑri', 'good': 'ɡʊd', 'meet': 'mit', 'in': 'ɪn', 'am': 'æm',
                      "i'm": 'aɪm', 'are': 'ɑr', 'oh': 'oʊ'})
pron.PHRASES += [
    ('وير آر يو فروم', 'Where are you from', 'wɛr ɑr ju frʌm'),
    ('وير دو يو ليف', 'Where do you live', 'wɛr du ju lɪv'),
    ('آر يو فروم', 'Are you from', 'ɑr ju frʌm'),
    ('آي فروم إيجيبت', 'I from Egypt', 'aɪ frʌm ˈidʒɪpt'),
    ('آيم فروم', "I'm from", 'aɪm frʌm'),
    ('آي آم ليف', 'I am live', 'aɪ æm lɪv'),
    ('آي ليف إن', 'I live in', 'aɪ lɪv ɪn'),
    ('آي ليف', 'I live', 'aɪ lɪv'),
    ('ليف', 'live', 'lɪv'),
    ('يس، آي آم', 'Yes, I am', 'jɛs aɪ æm'),
    ('نو، آيم نوت', "No, I'm not", 'noʊ aɪm nɑt'),
    ('إن كايرو', 'in Cairo', 'ɪn ˈkaɪroʊ'),
    ('إن نيويورك', 'in New York', 'ɪn nu ˈjɔrk'),
    ('آت كايرو', 'at Cairo', 'æt ˈkaɪroʊ'),
    ('كايرو', 'Cairo', 'ˈkaɪroʊ'),
    ('إن', 'in', 'ɪn'),
    ('وات دو يو دو', 'What do you do', 'wʌt du ju du'),
    ('آي آم إنجينير', 'I am engineer', 'aɪ æm ˌɛndʒəˈnɪr'),
]

EP = "ep04"
AR_STYLE = ("Youssef, a friendly 26-year-old Egyptian man from Cairo, narrating his own travel diary in natural "
            "Egyptian Arabic (Cairo dialect). Warm, self-amused, intimate like telling a friend, medium pace. {}")
SARA = "Friendly young American woman, a warm English teacher from New York. Natural, clear, relaxed General American accent, medium pace. {}"
YOU = "Friendly 26-year-old Egyptian man speaking English with a light, natural Egyptian accent. {}"
YOU_MODEL = ("Friendly 26-year-old Egyptian man practicing English carefully: clear, slow-ish, standard General American "
             "pronunciation with no foreign accent (these are model phrases learners repeat). {}")
ANA = ("Ana, a friendly, bubbly 25-year-old woman from Madrid, Spain, a student in an English class in New York. She speaks "
       "simple English with a light, natural Spanish accent (soft Spanish vowels, a slightly tapped r), cheerful and a bit chatty. {}")
NOTE_ANA = (" Bracketed tags and XML/IPA pronunciation markup in the text are silent instructions and must never be spoken; "
            "say exactly the tagged English words, with a light, natural Spanish accent.")
VOICE = {"Sara": "Aoede", "Youssef": "Achird", "Ana": "Laomedeia"}
STYLE = {"Sara": SARA, "Youssef": YOU, "Ana": ANA}
NOTE = {"Sara": pron.NOTE, "Youssef": pron.NOTE, "Ana": NOTE_ANA}

ar = {
 "ar01": ("خلّصت الاستمارة… <short pause> وأخيرًا، أول كلاس ليّا في نيويورك. <short pause> فصل صغير، وخريطة للعالم كله… وزميلة جديدة.", "Excited and a little nervous, the first day of class."),
 "ar02": ("وعلى السبورة سؤال: وير آر يو فروم؟ <short pause> سهل! أنا عارف آيم من أول يوم… <short pause> هقولها في كل حتة.", "Overconfident and cheerful, a little cocky."),
 "ar03": ("استنى… آي آم ليف؟! <short pause> أنا من أول يوم بحط آم في كل جملة… <short pause> حتى اللي مالهاش دعوة!", "Panicked, frozen in the moment, comic and self-mocking."),
 "ar04": ("سارة صلّحتها من غير ما تكسفني. <short pause> ولما قلت كايرو… حسيت إني سفير مصر في الفصل!", "Relieved, then proud and funny."),
 "ar05": ("وبعدين سارة سألت السؤال اللي بعده… <short pause> وأنا اتجمدت تاني. <short pause> أنا مهندس… بس دي بتتقال إزاي؟", "A worried cliffhanger, comic."),
 "ar06": ("تعالوا نشوف اتعلمت إيه النهارده.", "Upbeat, like a friendly teacher."),
 "ar07": ("لما حد يسألك: وير آر يو فروم؟ <short pause> قول: آيم فروم… <short pause> ومتنساش آم: آي فروم إيجيبت… غلط.", "Clear and explanatory, friendly teacher."),
 "ar08": ("ولما يسألك: وير دو يو ليف؟ <short pause> قول: آي ليف إن… <short pause> وهنا مفيش آم خالص. آي آم ليف… غلط.", "Clear, stressing the point, a little playful."),
 "ar09": ("يعني: آيم فروم فيها آم… <short pause> لكن ليف فعل، يبقى: آي ليف، من غير آم.", "Slow and clear: this is the main point of the lesson."),
 "ar10": ("ولو عايز تسأل: آر يو فروم…؟ <short pause> الرد: يس، آي آم. <short pause> أو: نو، آيم نوت.", "Clear and explanatory."),
 "ar11": ("والمدن والبلاد بتاخد إن: <short pause> إن كايرو، إن نيويورك… <short pause> مش آت كايرو.", "Clear and explanatory."),
 "ar12": ("وآخر حاجة: البلد والجنسية… <short pause> والاتنين بيتكتبوا بحرف كبير.", "Clear and warm."),
 "ar13": ("دورك! <short pause> سارة بتسألك… قول بلدك بصوت عالي.", "Energetic, encouraging."),
 "ar14": ("قلتها؟ برافو! <short pause> واكتب في الكومنتات: إنت منين، وساكن فين… بالإنجليزي.", "Proud and warm."),
 "ar15": ("وزي كل حلقة: <short pause> ادخل على الموقع وحل تمارين الحلقة، <short pause> خمس دقايق والجمل تثبت. <short pause> اللينك في الوصف.", "Friendly nudge, encouraging, like a tip from a friend."),
 "ar16": ("الحلقة الجاية: الشغل. <short pause> سارة سألتني: وات دو يو دو؟ <short pause> وأنا قلت: آي آم إنجينير. <short pause> وطلعت ناقصة حاجة صغيرة.", "Teaser, mysterious and funny."),
}

en_single = {   # recap model phrases (learners repeat them), story lines said alone, and the "your turn" question
 "r01": ("Sara", "Where are you from?", "Clear and friendly, a model question for learners, natural falling intonation."),
 "r02": ("Youssef", "I'm from Egypt.", "Clear and proud, a model answer."),
 "r03": ("Sara", "Where do you live?", "Clear and friendly, a model question."),
 "r04": ("Youssef", "I live in Queens.", "Clear model answer: 'I live in Queens', stressing 'live'."),
 "r05": ("Youssef", "Are you from New York?", "A friendly question with rising intonation."),
 "r06": ("Sara", "Yes, I am.", "Warm and clear, a short answer, stress on 'am'."),
 "r07": ("Youssef", "Are you from Madrid?", "A friendly question with rising intonation."),
 "r08": ("Sara", "No, I'm not.", "Warm and clear, smiling, a short answer, stress on 'not'."),
 "r09": ("Sara", "I live in New York.", "Clear and friendly, stressing 'in'."),
 "r10": ("Youssef", "Egypt. <short pause> Egyptian.", "Slow and clear: the country, then the nationality; note the stress moves: EE-jipt, then ee-JIP-shun."),
 "r11": ("Sara", "Spain. <short pause> Spanish.", "Slow and clear: the country, then the nationality."),
 "r12": ("Sara", "America. <short pause> American.", "Slow and clear: the country, then the nationality."),
 "turn": ("Sara", "Hi! <short pause> Where are you from?", "Talking directly to the viewer, warm and inviting, a little slower."),
 "en5": ("Sara", "And I'm American. From New York!", "Laughing a little, joining in happily, proud of her city."),
 "en6": ("Sara", "OK! Next question. <short pause> So, Youssef… what do you do?", "Cheerful teacher moving on, turning to Youssef with a curious, friendly question."),
}

en_multi = {
 "en1": [
  ("Sara", "OK, class! Let's meet. Where are you from? Ana, you first!", "Bright and welcoming, opening the first class. She says every word, including the question 'Where are you from?'."),
  ("Ana", "Hi, everybody! I'm Ana. I'm from Spain. I live in Brooklyn.", "Standing up happily, chatty and friendly, introducing herself to the class."),
  ("Sara", "Great! Thank you, Ana.", "Warm and pleased."),
 ],
 "en2": [
  ("Sara", "Youssef? <short pause> Your turn.", "Friendly, inviting the next student."),
  ("Youssef", "Hello! I'm Youssef. I'm from Egypt. <short pause> I am live in Queens.",
   "Standing up, proud and confident. IMPORTANT: this is a learner's mistake on purpose: he says exactly the words "
   "'I am live in Queens' with the word 'am' clearly said before 'live'. Do NOT correct it to 'I live in Queens'."),
 ],
 "en3": [
  ("Sara", "I live in Queens.", "After a short, kind pause, gently correcting him, smiling, stressing 'live', with no 'am'."),
  ("Youssef", "Oh! Sorry. I live in Queens.", "Embarrassed, then repeating it carefully and correctly."),
  ("Sara", "Good! Where in Egypt?", "Encouraging, curious."),
  ("Youssef", "Cairo!", "Proud and happy, one word."),
 ],
 "en4": [
  ("Youssef", "Ana, are you from Madrid?", "Turning to his classmate, friendly and curious."),
  ("Ana", "Yes, I am! I'm Spanish. And you're Egyptian!", "Delighted and chatty, pointing at him."),
  ("Youssef", "Yes! I'm Egyptian.", "Proud and smiling."),
 ],
}

jobs = {}
for k, (text, mood) in ar.items():
    text = pron.tag(text)
    jobs[k] = {"text": text, "style": AR_STYLE.format(mood) + (pron.NOTE_AR if pron.has_english(text) else ''), "voice": "Achird",
               "transcript": {"language_codes": ["ar-EG"], "write_vtt": True}}
for k, (who, text, mood) in en_single.items():
    base = YOU_MODEL if who == "Youssef" and k.startswith('r') else STYLE[who]
    jobs[k] = {"text": pron.tag_line(text), "style": base.format(mood) + NOTE[who], "voice": VOICE[who],
               "transcript": {"language_codes": ["en-US"], "write_vtt": True}}
for k, turns in en_multi.items():
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
