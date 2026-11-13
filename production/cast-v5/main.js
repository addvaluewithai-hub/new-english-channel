// loader: ?r=6 → the v6 "bolder" rig and pages (main6.js / cast6.js); default → v5 (main5.js / cast.js)
const R = new URLSearchParams(location.search).get('r');
import(R === '6' ? './main6.js' : './main5.js');
