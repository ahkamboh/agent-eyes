// visual-break — point the (already vision-capable) agent at frames it should EYEBALL for
// pixel-level breakage (blank screen, overlap, clipped text, spinner-forever). The tool
// doesn't ship a vision model — the coding agent IS one — so here we only surface the
// candidate frame at each hard error. v0.1 covers JS crashes + 5xx; heuristics (overflow,
// blank-frame, stuck-spinner) land next.
module.exports = function visualBreak(timeline) {
  const out = [];
  const hard = timeline.filter(e => e.type === 'pageerror' || (e.type === 'network' && e.status >= 500));
  for (const ev of hard) {
    out.push({
      t: ev.t,
      kind: 'visual-review',
      summary: `look at the screen here — a ${ev.type === 'pageerror' ? 'JS crash' : ev.status + ' error'} occurred; check for blank / broken / overlapping UI`,
      evidence: { trigger: ev },
    });
  }
  return out;
};
