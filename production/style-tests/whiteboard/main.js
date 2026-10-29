const mod = await import('./film.js');
await document.fonts.load('700 54px Ruqaa', 'أول يوم ليّا في لندن…');
const F = await mod.build();
const ctx = document.getElementById('c').getContext('2d');
window.DUR = F.dur; window.EV = F.ev; window.SUBS = F.subs;
window.render = t => F.render(ctx, t);
window.READY = true;
