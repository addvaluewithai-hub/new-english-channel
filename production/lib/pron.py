"""English inside the Arabic narration: wrap it in <lang>/<phoneme> markup so Gemini TTS says it with a clean
General American pronunciation (the technique proven in the owner's `tts` repo). The transcript side strips the tags."""
import re

# Egyptian transliteration as written in the scripts -> (English text, IPA, General American)
PHRASES = [
    ('آي يوسف', 'I Youssef', 'aɪ ˈjuːsɛf'),
    ('آيم', "I'm", 'aɪm'),
    ('آم', 'am', 'æm'),
    ('نايس تو ميت يو', 'Nice to meet you', 'naɪs tə mit ju'),
    ('مي تو', 'Me too', 'mi tu'),
    ('هاو أولد آر يو', 'How old are you', 'haʊ oʊld ɑr ju'),
    ('هاو آر يو', 'How are you', 'haʊ ɑr ju'),
    ('جود مورنينج', 'Good morning', 'ɡʊd ˈmɔrnɪŋ'),
    ('جود نايت', 'Good night', 'ɡʊd naɪt'),
    ('يور ويلكم', "You're welcome", 'jʊr ˈwɛlkəm'),
    ('ويلكم', 'Welcome', 'ˈwɛlkəm'),
    ('آند يو', 'And you', 'ænd ju'),
    ('ثانك يو', 'Thank you', 'θæŋk ju'),
    ('بليز', 'Please', 'pliz'),
    ('سوري', 'Sorry', 'ˈsɑri'),
    ('آي هاف توينتي سيكس ييرز', 'I have 26 years', 'aɪ hæv ˈtwɛnti sɪks jɪrz'),
]
NOTE = (" Bracketed tags and XML/IPA pronunciation markup in the text are silent instructions and must never be spoken; "
        "say the tagged English words with a clean, natural General American pronunciation, then continue in Egyptian Arabic.")


def en(text, ipa):
    return f'<lang xml:lang="en-US"><phoneme alphabet="ipa" ph="{ipa}">{text}</phoneme></lang>'


def tag(text):
    """Replace every transliterated English phrase in an Arabic line with the tagged English."""
    for ar, enx, ipa in sorted(PHRASES, key=lambda p: -len(p[0])):
        text = re.sub(ar + r'(?=[\s،؛؟.!…:]|$)', en(enx, ipa), text)
    return text


def has_english(text):
    return '<lang' in text
