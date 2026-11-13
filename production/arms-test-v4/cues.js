// Episode 1 — sound-effect cue list (window.EV). Scenes register cues while they are built from the timeline,
// so every cue sits on the same time as the picture event that causes it.
export const EV = [];
export function cue(t, type, extra = {}) { if (Number.isFinite(t)) EV.push({ t: Math.round(t * 1000) / 1000, type, ...extra }); }
export function finishCues() { EV.sort((a, b) => a.t - b.t); return EV; }
