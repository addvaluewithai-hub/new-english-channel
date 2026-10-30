# Episode 4 layout -> timeline.json. The alignment of words to the voice is in ../lib/tlkit.py.
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, os.path.join(HERE, '..', 'lib'))
import tlkit, lipsync
from tlkit import Builder
tlkit.WHO['Ana'] = 'ana'   # the classmate from Madrid (episode 4): her own id in lines / talk / mouth
lipsync.LEX.update({k: v for k, v in {"let's": 'L EH T S', 'ana': 'AA N AH', 'first': 'F ER S T', 'everybody': 'EH V R IY B AA D IY',
    'spain': 'S P EY N', 'brooklyn': 'B R UH K L IH N', 'turn': 'T ER N', 'queens': 'K W IY N Z', 'madrid': 'M AH D R IH D',
    'spanish': 'S P AE N IH SH', 'egyptian': 'IH JH IH P SH AH N', 'american': 'AH M EH R IH K AH N', 'america': 'AH M EH R IH K AH',
    'new': 'N UW', 'york': 'Y AO R K', 'next': 'N EH K S T', 'question': 'K W EH S CH AH N', 'class': 'K L AE S', 'great': 'G R EY T',
    'everybody!': 'EH V R IY B AA D IY'}.items() if k not in lipsync.LEX})

b = Builder(HERE,
            solo={'r01': 'Sara', 'r02': 'Youssef', 'r03': 'Sara', 'r04': 'Youssef', 'r05': 'Youssef', 'r06': 'Sara', 'r07': 'Youssef',
                  'r08': 'Sara', 'r09': 'Sara', 'r10': 'Youssef', 'r11': 'Sara', 'r12': 'Sara', 'turn': 'Sara', 'en5': 'Sara', 'en6': 'Sara', 'en4a': 'Youssef', 'en4b': 'Ana', 'en4c': 'Youssef'},
            latin=[('وير آر يو فروم', 'Where are you from'), ('وير دو يو ليف', 'Where do you live'), ('آر يو فروم', 'Are you from'),
                   ('آي فروم إيجيبت', 'I from Egypt'), ('آيم فروم', "I'm from"), ('آي آم ليف', 'I am live'), ('آي ليف إن', 'I live in'),
                   ('آي ليف', 'I live'), ('ليف', 'live'), ('يس، آي آم', 'Yes, I am'), ('نو، آيم نوت', "No, I'm not"), ('إن كايرو', 'in Cairo'),
                   ('إن نيويورك', 'in New York'), ('آت كايرو', 'at Cairo'), ('كايرو', 'Cairo'), ('وات دو يو دو', 'What do you do'),
                   ('آي آم إنجينير', 'I am engineer')])
L = lambda pred: [l for l in b.T['lines'] if pred(l['text'])][-1]
# 1. Opening: the classroom; Youssef comes in and sits down; the title
b.section('open')
b.beat('enter', .2)
b.hold(.9)
b.put('ar01', .4)
b.put('ar02', .5)
b.beat('title')
b.hold(3.2)
# 2a. Ana first; then Youssef: "I am live in Queens." -> the freeze
b.section('intro')
b.hold(.2)
b.put('en1', .5, scene='intro')
b.beat('ana_up', L(lambda s: s.startswith('Hi, everybody'))['t0'] - .7)
b.beat('ana_down', L(lambda s: s.startswith('Great'))['t0'] + .2)
b.put('en2', 0, scene='intro')
yl = L(lambda s: s.startswith('Hello!'))
b.beat('you_up', yl['t0'] - .75)
b.beat('freeze', yl['t1'] + .15)
b.hold(.15 + .45)
b.put('ar03', .5)
b.beat('unfreeze')
# 2b. Sara's fix on the board, "Where in Egypt?" "Cairo!"; Ana: Madrid, Spanish / Egyptian; Sara: American
b.section('fix')
b.hold(.2)
b.put('en3', .4, scene='fix')
b.beat('board', L(lambda s: s.startswith('I live'))['t0'] - .3)
b.beat('cairo', L(lambda s: s.startswith('Cairo'))['t0'])
b.put('ar04', .5)
b.put('en4a', .35, scene='fix')
b.put('en4b', .35, scene='fix')
b.put('en4c', .3, scene='fix')
b.put('en5', .5, scene='fix')
# 2c. The next question: "So, Youssef… what do you do?" -> he freezes again
b.section('hook')
b.put('en6', 0, scene='hook')
b.beat('stuck', b.last_line()['t1'] + .1)
b.hold(.7)
b.put('ar05', .9)
# 3. Recap
b.section('recap')
b.beat('recap_title')
b.hold(2.0)
b.recap([('ar06', .4, None),
         ('ar07', .4, 'from'), ('r01', .4, 'from'), ('r02', 'R', 'from'),
         ('ar08', .4, 'live'), ('r03', .4, 'live'), ('r04', 'R', 'live'),
         ('ar09', .7, 'rule'),
         ('ar10', .4, 'are'), ('r07', .4, 'are'), ('r08', 'R', 'are'),
         ('ar11', .4, 'in'), ('r09', 'R', 'in'),
         ('ar12', .4, 'nat'), ('r10', .5, 'nat'), ('r11', .5, 'nat'), ('r12', 'R', 'nat')])
# 4. Your turn
b.section('turn')
b.put('ar13', .4)
b.put('turn', .3, scene='turn')
b.beat('pause_start')
b.hold(4.5)
b.beat('pause_end')
b.put('ar14', .6)
# 4b. Solve the exercises on the site
b.section('site')
b.beat('site_card')
b.hold(.5)
b.put('ar15', .8)
# 5. Next time
b.section('next')
b.put('ar16', .5)
b.beat('end_card')
b.hold(4.0)
b.finish()
