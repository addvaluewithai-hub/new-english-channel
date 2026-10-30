# Episode 3 layout -> timeline.json. The alignment of words to the voice is in ../lib/tlkit.py.
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, os.path.join(HERE, '..', 'lib')); sys.path.insert(0, os.path.join(HERE, 'tts'))
import tlkit
import vocab   # noqa: F401  episode 3 words -> lipsync.LEX (numbers, the new words); see tts/vocab.py
from tlkit import Builder

tlkit.WHO['Lopez'] = 'lopez'   # the receptionist (a new character, this episode)

b = Builder(HERE,
            solo={'r01': 'Sara', 'r02': 'Youssef', 'r03': 'Sara', 'r04': 'Sara', 'r05': 'Sara', 'r06': 'Youssef',
                  'r07': 'Youssef', 'r08': 'Youssef', 'turn': 'Sara'})
line = lambda pred: [l for l in b.T['lines'] if pred(l['text'])][-1]
# 1. Opening: an early, calm walk to school with the form
b.section('open')
b.hold(.6)
b.put('ar01', .4)
b.put('ar02', .5)
b.beat('title')
b.hold(3.2)
# 2a. The reception desk: "I have 26 years." -> freeze
b.section('desk')
b.hold(.5)
b.put('en1', 0, scene='desk')
b.beat('hand_over', line(lambda s: s.startswith('Good morning! This'))['t0'] + .5)
b.beat('mistake', line(lambda s: s.startswith('I have'))['t0'])
b.beat('freeze', b.last_line()['t1'] + .15)
b.hold(.6)
b.put('ar03', .5)
b.beat('unfreeze')
# 2b. Sara helps: "I'm 26!"
b.section('fix')
b.beat('mia_enters')
b.hold(1.0)
b.put('en2', .3, scene='fix')
b.put('ar04', .5)
# 2c. Sixteen or sixty?
b.section('sixty')
b.put('en3', 0, scene='sixty')
b.beat('write', line(lambda s: s.startswith('OK!'))['t0'])
b.beat('ask', line(lambda s: s.startswith('And you'))['t0'])
b.beat('sixteen', line(lambda s: s.startswith('Sixteen?!'))['t0'])
b.beat('laugh', b.last_line()['t0'])
b.hold(.5)
b.put('ar05', .5)
# 2d. Room 4: the first class (the hook into episode 4)
b.section('room')
b.put('en4', .3, scene='room')
b.beat('walk')
b.put('ar06', 1.0)
b.beat('door_open', b.T['narration'][-1]['t0'] + 1.2)
# 3. Recap
b.section('recap')
b.beat('recap_title')
b.hold(2.0)
b.recap([('ar07', .4, 'count'), ('r01', 'R', 'count'),
         ('ar08', .4, 'teen'), ('r02', 'R', 'teen'),
         ('ar09', .4, 'ty'), ('r03', 'R', 'ty'),
         ('ar10', .4, 'stress'), ('r04', 'R', 'stress'),
         ('ar11', .4, 'age'), ('r05', .4, 'age'), ('r06', .5, 'age'), ('r07', 'R', 'age'),
         ('ar12', 1.4, 'wrong'),
         ('ar13', .4, 'order'), ('r08', 'R', 'order')])
# 4. Your turn
b.section('turn')
b.put('ar14', .4)
b.put('turn', .3, scene='turn')
b.beat('pause_start')
b.hold(4.5)
b.beat('pause_end')
b.put('ar15', .6)
# 4b. Solve the exercises on the site
b.section('site')
b.beat('site_card')
b.hold(.5)
b.put('ar16', .8)
# 5. Next time
b.section('next')
b.put('ar17', .5)
b.beat('end_card')
b.hold(4.0)
b.finish()
