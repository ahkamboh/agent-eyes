// emit.js — write the agent-consumable artifact: session.json (markers first, then the full
// timeline + frames), leaving run.mp4 + frames/ on disk. The agent reads markers[] to jump
// straight to the problem, then opens the referenced frame + evidence.
const fs = require('fs');
const path = require('path');

function emit({ timeline, frames, markers, url, mode, duration, outDir }) {
  const session = {
    tool: 'agent-eyes',
    version: '0.1.0',
    url,
    mode,
    duration: +Number(duration).toFixed(2),
    recordedFrames: frames.length,
    video: fs.existsSync(path.join(outDir, 'run.mp4')) ? 'run.mp4' : null,
    // the hero: the moments that matter, each with the frame to look at + the evidence
    markers: markers.map(m => ({ t: m.t, kind: m.kind, frame: m.frame, summary: m.summary, evidence: m.evidence })),
    // the full record, if the agent wants to dig
    frames,
    timeline,
  };

  fs.writeFileSync(path.join(outDir, 'session.json'), JSON.stringify(session, null, 2));
  try { fs.rmSync(path.join(outDir, '_video'), { recursive: true, force: true }); } catch (e) {}
  return session;
}

module.exports = { emit };
