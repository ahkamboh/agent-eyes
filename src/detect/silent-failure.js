// silent-failure — an action triggered an error (4xx/5xx or a JS exception), but the UI
// showed the user NOTHING. The hardest bug for an agent to spot from code alone, because
// the screen "looks fine." This is the flagship detector.
function shortUrl(u) { try { return new URL(u).pathname; } catch (e) { return u; } }
function actionStr(a) { return a ? `${a.action}${a.target ? ' ' + a.target : ''}` : 'an action'; }

module.exports = function silentFailure(timeline) {
  const out = [];
  for (const ev of timeline) {
    const isError =
      (ev.type === 'network' && ev.status >= 400) ||
      (ev.type === 'network' && ev.status === 0) ||
      ev.type === 'pageerror' ||
      (ev.type === 'console' && ev.level === 'error');
    if (!isError) continue;

    // did the screen visibly react in the next second? (a banner, new element, text)
    const reacted = timeline.some(e => e.type === 'dom' && e.userVisible && e.t > ev.t && e.t <= ev.t + 1.0);
    if (reacted) continue;

    const act = timeline.filter(e => e.type === 'action' && e.t <= ev.t).pop();
    const trigger = ev.type === 'network'
      ? `${ev.status || 'failed'} ${ev.method} ${shortUrl(ev.url)}`
      : (ev.text || 'JS error').slice(0, 90);

    out.push({
      t: ev.t,
      kind: 'silent-failure',
      summary: `${actionStr(act)} → ${trigger} → screen did not change (no user-visible feedback)`,
      evidence: { action: act || null, trigger: ev },
    });
  }
  return out;
};
