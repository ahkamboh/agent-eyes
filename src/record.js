// record.js — launch any URL and capture the 5 streams on ONE clock, so they can be fused.
//   👁 video   🖱 actions   🧾 console   🌐 network(status)   🏷 DOM changes
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function record({ url, steps, headed, seconds, outDir }) {
  const videoDir = path.join(outDir, '_video');
  fs.mkdirSync(videoDir, { recursive: true });

  const browser = await chromium.launch({ headless: !headed });
  const context = await browser.newContext({
    recordVideo: { dir: videoDir, size: { width: 1280, height: 800 } },
    viewport: { width: 1280, height: 800 },
  });

  const start = Date.now();
  const t = () => +((Date.now() - start) / 1000).toFixed(3);
  const timeline = [];
  const push = e => timeline.push({ t: t(), ...e });

  const page = await context.newPage();

  // --- Node-side streams (fire in Node, so timestamps share the clock) ---
  page.on('console', m => push({ type: 'console', level: m.type(), text: m.text().slice(0, 300) }));
  page.on('pageerror', e => push({ type: 'pageerror', level: 'error', text: (e.message || String(e)).slice(0, 300) }));
  page.on('response', r => push({ type: 'network', method: r.request().method(), url: r.url(), status: r.status() }));
  page.on('requestfailed', r => push({ type: 'network', method: r.method(), url: r.url(), status: 0, failed: r.failure() && r.failure().errorText }));
  page.on('framenavigated', f => { if (f === page.mainFrame()) push({ type: 'nav', url: f.url() }); });

  // --- Page-side streams: DOM mutations always; user actions only in manual mode ---
  await page.exposeBinding('__ae', (_src, ev) => push(ev));
  await page.addInitScript(({ captureActions }) => {
    const send = o => { try { window.__ae(o); } catch (e) { /* binding not ready yet */ } };
    const startObs = () => {
      const mo = new MutationObserver(muts => {
        let added = '';
        for (const m of muts) {
          if (m.addedNodes) m.addedNodes.forEach(n => { added += (n.textContent || '') + ' '; });
          if (m.type === 'characterData') added += (m.target.textContent || '') + ' ';
        }
        added = added.replace(/\s+/g, ' ').trim();
        send({ type: 'dom', kind: 'mutation', addedText: added.slice(0, 120), userVisible: added.length > 0 });
      });
      mo.observe(document.documentElement, { subtree: true, childList: true, characterData: true });
    };
    if (document.body) startObs(); else addEventListener('DOMContentLoaded', startObs);

    if (captureActions) {
      const sel = el => {
        if (!el || !el.tagName) return '';
        if (el.id) return '#' + el.id;
        let c = el.className;
        c = (c && c.baseVal !== undefined) ? c.baseVal : c;
        const first = (c ? String(c).trim().split(/\s+/)[0] : '');
        return el.tagName.toLowerCase() + (first ? '.' + first : '');
      };
      addEventListener('click', e => send({ type: 'action', action: 'click', target: sel(e.target), text: (e.target.textContent || '').trim().slice(0, 40) }), true);
      addEventListener('input', e => send({ type: 'action', action: 'input', target: sel(e.target) }), true);
      addEventListener('submit', e => send({ type: 'action', action: 'submit', target: sel(e.target) }), true);
    }
  }, { captureActions: !steps });

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    .catch(e => push({ type: 'nav-error', text: String(e.message || e).slice(0, 200) }));

  if (steps) {
    for (const s of steps) {
      try {
        if (s.fill !== undefined) { push({ type: 'action', action: 'fill', target: s.fill }); await page.fill(s.fill, String(s.value ?? '')); }
        else if (s.click !== undefined) { push({ type: 'action', action: 'click', target: s.click }); await page.click(s.click); }
        else if (s.type !== undefined) { push({ type: 'action', action: 'type', target: s.type }); await page.type(s.type, String(s.value ?? '')); }
        else if (s.goto !== undefined) { push({ type: 'action', action: 'goto', target: s.goto }); await page.goto(s.goto); }
        else if (s.wait !== undefined) { await page.waitForTimeout(s.wait); }
      } catch (err) { push({ type: 'step-error', text: String(err.message || err).slice(0, 200) }); }
    }
    await page.waitForTimeout(500);
  } else {
    console.log('   (manual mode — interact with the page; recording stops when you close it or after ' + seconds + 's)');
    await Promise.race([
      page.waitForEvent('close', { timeout: 0 }).catch(() => {}),
      page.waitForTimeout(seconds * 1000),
    ]);
  }

  const duration = t();
  const video = page.video();
  await context.close(); // finalizes the .webm
  let videoPath = null;
  try { videoPath = video ? await video.path() : null; } catch (e) { videoPath = null; }
  await browser.close();

  return { timeline, videoPath, duration };
}

module.exports = { record };
