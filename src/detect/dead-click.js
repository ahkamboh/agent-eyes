// dead-click — the user clicked something and NOTHING happened: no DOM change, no
// navigation, no network request in the next 500ms. The classic "this button is broken."
module.exports = function deadClick(timeline) {
  const out = [];
  for (const ev of timeline) {
    if (!(ev.type === 'action' && ev.action === 'click')) continue;
    const after = timeline.filter(e => e.t > ev.t && e.t <= ev.t + 0.5);
    const didSomething = after.some(e =>
      (e.type === 'dom' && e.userVisible) || e.type === 'nav' || e.type === 'network');
    if (didSomething) continue;
    out.push({
      t: ev.t,
      kind: 'dead-click',
      summary: `clicked ${ev.target || 'element'} → nothing happened (no DOM change, no request, no navigation)`,
      evidence: { action: ev },
    });
  }
  return out;
};
