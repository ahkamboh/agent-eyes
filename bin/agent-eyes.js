#!/usr/bin/env node
// agent-eyes — record any URL, detect where it breaks, hand the agent the frame + error.
const path = require('path');
const fs = require('fs');
const { record } = require('../src/record');
const { sampleFrames } = require('../src/frames');
const { detectAll } = require('../src/detect');
const { emit } = require('../src/emit');

function help() {
  console.log(`👁  agent-eyes — eyes + context for your AI coding agent

  agent-eyes <url> [options]

  --auto <steps.json>   replay steps headless (reproducible). Steps: [{"fill":"#sel","value":"x"},{"click":"#sel"},{"wait":800}]
  --seconds <n>         manual mode: record a real window for n seconds (default 20)
  --out <dir>           output dir (default .agent-eyes)
  --fps <n>             keyframes per second sampled from the video (default 3)
  --headed / --headless override the window mode

  Writes <out>/session.json (markers + timeline), <out>/frames/*.jpg, <out>/run.mp4`);
}

function parseArgs(argv) {
  const a = { seconds: 20, out: '.agent-eyes', fps: 3, headed: null, auto: null };
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const x = argv[i];
    if (x === '--auto') a.auto = argv[++i];
    else if (x === '--seconds') a.seconds = +argv[++i];
    else if (x === '--out') a.out = argv[++i];
    else if (x === '--fps') a.fps = +argv[++i];
    else if (x === '--headed') a.headed = true;
    else if (x === '--headless') a.headed = false;
    else if (x === '-h' || x === '--help') { help(); process.exit(0); }
    else rest.push(x);
  }
  a.url = rest[0];
  return a;
}

(async () => {
  const args = parseArgs(process.argv.slice(2));
  if (!args.url) { help(); process.exit(1); }

  const outDir = path.resolve(args.out);
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const headed = args.headed !== null ? args.headed : !args.auto;
  let steps = null;
  if (args.auto) {
    const raw = fs.existsSync(args.auto) ? fs.readFileSync(args.auto, 'utf8') : args.auto;
    steps = JSON.parse(raw);
  }

  console.log(`👁  agent-eyes → recording ${args.url}  (${args.auto ? 'auto' : 'manual · ' + args.seconds + 's'})`);
  const rec = await record({ url: args.url, steps, headed, seconds: args.seconds, outDir });
  console.log(`   captured ${rec.timeline.length} events in ${rec.duration.toFixed(1)}s`);

  const frames = await sampleFrames(rec.videoPath, outDir, args.fps)
    .catch(e => { console.warn('   (ffmpeg frames skipped: ' + e.message + ')'); return []; });

  const markers = detectAll(rec.timeline, frames);
  emit({ ...rec, frames, markers, url: args.url, mode: args.auto ? 'auto' : 'manual', outDir });

  console.log(`\n${markers.length ? '🔴' : '✅'}  ${markers.length} marker(s) — the moments that matter:`);
  for (const m of markers) console.log(`   • [${m.kind} @ ${m.t.toFixed(2)}s] ${m.summary}${m.frame ? '  (' + m.frame + ')' : ''}`);
  console.log(`\n→ ${path.join(args.out, 'session.json')}   (${frames.length} frames · run.mp4)`);
  console.log('   Agents: read session.json → markers[] first → open the frame → fix.');
})().catch(e => { console.error('agent-eyes error:', e && e.stack || e); process.exit(1); });
