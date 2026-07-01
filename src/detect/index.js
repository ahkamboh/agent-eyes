// detect/index.js — run every detector over the fused timeline, attach the frame the agent
// should look at, and de-duplicate. Markers are the "hero": they turn a pile of events into
// the 1-3 moments that actually matter, so the agent jumps straight to the problem.
const deadClick = require('./dead-click');
const silentFailure = require('./silent-failure');
const visualBreak = require('./visual-break');

function detectAll(timeline, frames) {
  const nearestFrame = t => frames.length
    ? frames.reduce((a, b) => Math.abs(b.t - t) < Math.abs(a.t - t) ? b : a).file
    : null;

  let markers = [
    ...silentFailure(timeline),
    ...deadClick(timeline),
    ...visualBreak(timeline),
  ].map(m => ({ ...m, frame: nearestFrame(m.t) }));

  // de-dupe: same kind within 0.25s; and drop a bare visual-review if a silent-failure already covers it
  markers.sort((a, b) => a.t - b.t);
  const kept = [];
  for (const m of markers) {
    if (kept.some(k => k.kind === m.kind && Math.abs(k.t - m.t) < 0.25)) continue;
    if (m.kind === 'visual-review' && kept.some(k => k.kind === 'silent-failure' && Math.abs(k.t - m.t) < 0.4)) continue;
    kept.push(m);
  }
  return kept;
}

module.exports = { detectAll };
