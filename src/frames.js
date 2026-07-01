// frames.js — sample keyframes from the recorded video with ffmpeg (the scrolltape stack),
// so a vision-capable agent can SEE the state at any timestamp. Also emits a friendly run.mp4.
const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

async function sampleFrames(videoPath, outDir, fps = 3) {
  if (!videoPath || !fs.existsSync(videoPath)) return [];
  const framesDir = path.join(outDir, 'frames');
  fs.mkdirSync(framesDir, { recursive: true });

  execFileSync('ffmpeg', ['-y', '-i', videoPath, '-vf', `fps=${fps}`, '-qscale:v', '3', path.join(framesDir, 'f%03d.jpg')], { stdio: 'ignore' });
  try {
    execFileSync('ffmpeg', ['-y', '-i', videoPath, '-movflags', 'faststart', '-pix_fmt', 'yuv420p', path.join(outDir, 'run.mp4')], { stdio: 'ignore' });
  } catch (e) { /* mp4 is a nicety; frames are what matter */ }

  const files = fs.readdirSync(framesDir).filter(f => /^f\d+\.jpg$/.test(f)).sort();
  return files.map((f, i) => ({ t: +((i + 0.5) / fps).toFixed(3), file: path.join('frames', f) }));
}

module.exports = { sampleFrames };
