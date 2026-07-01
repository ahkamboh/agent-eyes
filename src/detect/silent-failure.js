// silent-failure — a USER ACTION triggered an error (4xx/5xx or a JS exception), but the UI
// showed the user NOTHING. The hardest bug to spot from code alone: the screen "looks fine."
// Flagship detector.
//
// False-positive guard: only flag an error that FOLLOWS a user *trigger* action (click /
// submit / navigation) within a short window. Background noise — analytics beacons, load-time
// 404s, third-party errors with no user action behind them — is ignored.
const TRIGGERS = new Set(['click', 'submit', 'goto']);

function shortUrl(u) { try { return new URL(u).pathname; } catch (e) { return u; } }
function actionStr(a) { return a ? `${a.action}${a.target ? ' ' + a.target : ''}` : 'an action'; }

module.exports = function silentFailure(timeline, opts = {}) {
  const window = opts.window ?? 3.0; // an error counts as "caused by" an action only within N seconds
  const out = [];
  for (const ev of timeline) {
    const isError =
      (ev.type === 'network' && (ev.status >= 400 || ev.status === 0)) ||
      ev.type === 'pageerror' ||
      (ev.type === 'console' && ev.level === 'error');
    if (!isError) continue;

    // GUARD: require a recent user trigger action — else it's background noise, not a silent failure.
    const act = timeline.filter(e => e.type === 'action' && TRIGGERS.has(e.action) && e.t <= ev.t).pop();
    if (!act || (ev.t - act.t) > window) continue;

    // did the screen visibly react in the next second? (a banner, new element, text)
    const reacted = timeline.some(e => e.type === 'dom' && e.userVisible && e.t > ev.t && e.t <= ev.t + 1.0);
    if (reacted) continue;

    const trigger = ev.type === 'network'
      ? `${ev.status || 'failed'} ${ev.method} ${shortUrl(ev.url)}`
      : (ev.text || 'JS error').slice(0, 90);

    out.push({
      t: ev.t,
      kind: 'silent-failure',
      summary: `${actionStr(act)} → ${trigger} → screen did not change (no user-visible feedback)`,
      evidence: { action: act, trigger: ev },
    });
  }
  return out;
};
