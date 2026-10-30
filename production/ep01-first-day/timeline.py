# Episode 1 layout -> timeline.json. The alignment of words to the voice is in ../lib/tlkit.py.
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, os.path.join(HERE, '..', 'lib'))
from tlkit import Builder

b = Builder(HERE,
            solo={'r01': 'Sara', 'r02': 'Youssef', 'r03': 'Youssef', 'r04': 'Youssef', 'r05': 'Sara', 'r06': 'Youssef',
                  'r07': 'Youssef', 'r08': 'Sara', 'r09': 'Sara', 'r10': 'Youssef', 'turn': 'Sara'},
            # the voice added "اسمك إيه؟", so the plate shows it
            display={'ar12': 'ولو عايز تسأل حد عن اسمه: اسمك إيه؟ <short pause> والرد:'},
)
# 1. Opening
b.section('open')
b.hold(.6)
b.put('ar01', .3)
b.put('ar02', .5)
b.beat('title')
b.hold(3.2)
# 2a. Street
b.section('street')
b.hold(.4)
b.put('ar03', .6)
b.beat('school_seen')
s, e = b.put('ar04', .2)
b.beat('door_open', e - .6)
# 2b. Door: the mistake
b.section('door')
b.hold(.5)
b.put('open', 0, scene='door')
b.beat('sorry', b.last_line()['t0'])
b.beat('freeze', b.last_line()['t1'] + .15)
b.hold(.6)
b.put('ar05', .5)
b.beat('unfreeze')
# 2c. Second try
b.section('retry')
b.put('en2', .4, scene='retry')
b.beat('come_in', b.last_line()['t0'])
b.put('ar06', .6)
# 2d. The day passes
b.section('day')
b.beat('day_start')
b.put('ar07', 1.2)
# 2e. Goodbye
b.section('bye')
b.hold(.4)
b.put('en3', 0, scene='bye')
b.beat('eight', b.last_line()['t0'])
b.hold(.5)
b.put('ar08', 1.0)
# 3. Recap
b.section('recap')
b.beat('recap_title')
b.hold(2.0)
b.recap([('ar09', .4, None), ('r01', .35, 'hi'), ('r02', 'R', 'hi'),
         ('ar10', .4, 'am'), ('r03', 'R', 'am'), ('ar11', .4, 'im'), ('r04', 'R', 'im'),
         ('ar12', .4, 'name'), ('r05', .4, 'name'), ('r06', 'R', 'name'),
         ('ar13', .4, 'too'), ('r07', 'R', 'too'), ('ar14', .4, 'sorry'), ('r08', 'R', 'sorry'),
         ('ar15', .4, 'bye'), ('r09', .35, 'bye'), ('r10', 'R', 'bye')])
# 4. Your turn
b.section('turn')
b.put('ar16', .4)
b.put('turn', .3, scene='turn')
b.beat('pause_start')
b.hold(4.5)
b.beat('pause_end')
b.put('ar17', .6)
# 4b. Solve the exercises on the site
b.section('site')
b.beat('site_card')
b.hold(.5)
b.put('ar19', .8)
# 5. Next time
b.section('next')
b.put('ar18', .5)
b.beat('end_card')
b.hold(4.0)
b.finish()
