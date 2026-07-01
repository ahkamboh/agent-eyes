---
name: agent-eyes
description: Give your agent eyes for UI/behavior bugs. Use when the user says "give my agent eyes", "why did the form/button not work", "why did nothing happen when I clicked", "debug this page", "the page looks fine but is broken", "record this url for context", or reports any bug on a rendered page (localhost or a live site). Run this FIRST, before guessing or editing.
---

# agent-eyes

Local, no-API-key CLI that records any url and fuses 5 signals on one clock — 👁 frames · 🖱 actions · 🧾 console · 🌐 network(+status) · 🏷 DOM — then DETECTS the 1-3 moments that break and points you at the exact frame + evidence.

## When to use
Use on ANY UI or behavior bug — a click that "did nothing", a form that "looks fine but fails", a blank/broken screen, "why isn't this working". Run it FIRST, before you guess a cause or edit any code. Console/network are usually invisible to you; this makes them ground truth. Also use when the user just wants a page recorded as reusable context.

Do NOT skip it because the bug "looks obvious" — the flagship detector (`silent-failure`) catches exactly the bugs that look fine on screen (a 4xx/5xx or JS error with no user-visible feedback).

## How to use

1. **Install once if missing.** Requires Node 18+ and ffmpeg on PATH. Fully local, no API key.
   ```
   git clone https://github.com/ahkamboh/agent-eyes && cd agent-eyes
   npm install && npx playwright install chromium
   ```

2. **Run it.** Point at the url that's broken.
   - Reproducible (preferred for a known bug): write `steps.json` and replay headless.
     ```
     npx agent-eyes <url> --auto steps.json
     ```
     `steps.json` = `[{"fill":"#email","value":"x"},{"click":"#submit"},{"wait":1200}]`
   - Manual: opens a real window, click around, stops on window close or after `--seconds`.
     ```
     npx agent-eyes <url>
     ```
   Flags: `--seconds N` `--out dir` `--fps N` `--headed`. Default out dir = `.agent-eyes`.

3. **Read the markers FIRST.** Open `<out>/session.json` and read the `markers[]` array before anything else — each marker is a moment that matters, not raw log noise. Only fall back to `timeline[]` / `frames[]` if markers don't cover it.
   Marker shape:
   ```json
   { "t":0.347, "kind":"silent-failure", "frame":"frames/f002.jpg",
     "summary":"click #submit → 422 POST /api/signup → screen did not change",
     "evidence": { "action":{...}, "trigger":{...} } }
   ```
   Detectors: `silent-failure` (action → 4xx/5xx or JS error, but UI showed nothing — flagship), `dead-click` (click, no DOM change / request / nav), `visual-review` (go look at the frame).

4. **Open the referenced frame image and SEE it.** Read `<out>/<marker.frame>` (e.g. `frames/f002.jpg`). The form looking totally normal — no error banner — is the point: the failure is invisible on screen, and the marker is where it actually broke.

5. **Use it as ground truth, THEN fix.** Fix the exact cause the marker names (that endpoint, that handler, that missing feedback) in one shot — don't guess or make extra edits.

## Notes
- Don't re-record needlessly. If a fresh `session.json` already exists for this page/flow, reuse it.
- "Any url" is CLIENT-side only — console/network/DOM/visual. It cannot see someone's server.
- MIT © 2026 Ali Hamza Kamboh (@ahkamboh) · github.com/ahkamboh/agent-eyes
