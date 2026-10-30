# Episode 2 layout -> timeline.json. The alignment of words to the voice is in ../lib/tlkit.py.
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, os.path.join(HERE, '..', 'lib'))
from tlkit import Builder

b = Builder(HERE,
            solo={'r01': 'Sara', 'r02': 'Youssef', 'r03': 'Sara', 'r04': 'Youssef', 'r05': 'Sara', 'r06': 'Youssef',
                  'r07': 'Youssef', 'r08': 'Youssef', 'r09': 'Youssef', 'r10': 'Sara', 'r11': 'Youssef', 'r12': 'Youssef',
                  'turn': 'Sara'},
            latin=[('جود مورنينج', 'Good morning'), ('جود نايت', 'Good night'), ('يور ويلكم', "You're welcome"),
                   ('ويلكم', 'Welcome'), ('آند يو', 'And you'), ('ثانك يو', 'Thank you'), ('بليز', 'Please'),
                   ('سوري', 'Sorry'), ('هاو أولد آر يو', 'How old are you'), ('آي هاف توينتي سيكس ييرز', 'I have 26 years')])
# 1. Opening: the alarm
b.section('open')
b.beat('alarm')
b.hold(1.2)
b.beat('wake')
b.put('ar01', .3)
b.put('ar02', .5)
b.beat('title')
b.hold(3.2)
# 2a. Running to school
b.section('run')
b.hold(.3)
b.put('ar03', .5)
# 2b. The hallway: Good... night
b.section('hall')
b.beat('mia_enters')
b.hold(.8)
b.put('en1', 0, scene='hall')
yawn = [l for l in b.T['lines'] if l['text'].startswith('Good…')][-1]
b.beat('yawn', yawn['t0'] - 1.6)   # the yawn starts on the "Oh…" before the words
b.beat('laugh', [l for l in b.T['lines'] if l['text'].startswith('Good night?')][-1]['t0'])
b.hold(.5)
b.put('ar04', .5)
# 2c. Coffee
b.section('coffee')
b.put('en2', 0, scene='coffee')
b.beat('sip', b.last_line()['t1'] + .5)
b.hold(1.3)
b.put('ar05', .6)
# 2d. Holding the door: Welcome!
b.section('door')
b.beat('afternoon')
b.hold(.6)
b.put('en3', 0, scene='door')
b.beat('welcome', [l for l in b.T['lines'] if l['text'] == 'Welcome!'][-1]['t0'])
b.hold(.4)
b.put('ar06', .5)
# 2e. The form and good night
b.section('bye')
b.put('en4', 0, scene='bye')
b.beat('form', [l for l in b.T['lines'] if l['text'].startswith('Oh!')][-1]['t0'] + .9)
b.beat('good_night', [l for l in b.T['lines'] if l['text'].startswith('Good night, Mia')][-1]['t0'])
b.hold(.5)
b.put('ar07', 1.0)
b.beat('age_box', b.T['narration'][-1]['t1'] - 1.8)
# 3. Recap
b.section('recap')
b.beat('recap_title')
b.hold(2.0)
b.recap([('ar08', .4, None),
         ('r01', .3, 'times'), ('r02', .3, 'times'), ('r03', 'R', 'times'),
         ('ar09', .4, 'night'), ('r04', 'R', 'night'),
         ('ar10', .4, 'how'), ('r05', .4, 'how'), ('r06', .5, 'how'), ('r07', .5, 'how'), ('r08', 'R', 'how'),
         ('ar11', .3, 'andyou'), ('r09', 'R', 'andyou'),
         ('ar12', .4, 'welcome'), ('r10', 'R', 'welcome'),
         ('ar13', .4, 'polite'), ('r11', .5, 'polite'), ('r12', 'R', 'polite')])
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
b.put('ar17', .8)
# 5. Next time
b.section('next')
b.put('ar16', .5)
b.beat('end_card')
b.hold(4.0)
b.finish()
