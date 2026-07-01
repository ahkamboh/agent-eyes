<div align="center">

# 👁 agent-eyes

### Give your AI coding agent eyes.

A **local, MIT, no-API-key** CLI that records any URL, fuses **5 signals on one clock**, **detects the moments that break**, and hands your coding agent the exact frame + the error — so it stops guessing.

[![License: MIT](https://img.shields.io/badge/License-MIT-black.svg)](LICENSE)
[![Node 18+](https://img.shields.io/badge/Node-18%2B-black.svg)](https://nodejs.org)
[![Playwright](https://img.shields.io/badge/Playwright-powered-black.svg)](https://playwright.dev)
[![No API key](https://img.shields.io/badge/API%20key-none-black.svg)](#)
[![Local](https://img.shields.io/badge/runs-100%25%20local-black.svg)](#)

`npx agent-eyes <url>`

</div>

---

## The problem

Your agent is blind.

When you say *"the signup is broken,"* a console-only agent sees a form that looks completely normal. It can't watch the click. It can't see the `422` come back. It can't tell that the screen never changed. So it **guesses** — and guessing means wrong edits, extra edits, and burned tokens on a bug it never actually saw.

Millions of new "vibe coders" only know how to prompt. They don't know to open the console or the network tab. Neither does their agent — unless you give it eyes.

**agent-eyes** lets the agent *run the app first*, watch what really happens, and get ground truth before it touches a single line.

---

## ⚡ The proven demo

We pointed agent-eyes at a broken signup form. To a console-only agent, the form looks fine — so it guesses. Here's what agent-eyes said instead:

```
🔴 silent-failure @ 0.35s — click #submit → 422 POST /api/signup → screen did not change (no user-visible feedback)   (frames/f002.jpg)
```

And here is `frames/f002.jpg` — the frame captured at that exact moment:

> The form looks **totally fine**. No error banner. No red text. Nothing.

**That's the whole point.** The failure is *invisible on screen*. The user clicked submit, the server rejected it with a `422`, and the UI gave zero feedback. A screenshot alone lies to you. A console log alone is a haystack. agent-eyes fuses them and says: *here is the frame, here is the click that caused it, here is the status code, and here is why it's a bug.*

The agent jumps straight to the fix.

---

## ⚡ One-time setup: paste this into your agent

This is the hero move. Paste this block **once** into Claude Code / Cursor / Codex. It installs agent-eyes and teaches your agent to reach for it *first* on any UI or behavior bug.

```
Set up agent-eyes so you can see what the app actually does.

1. Install it once:
   git clone https://github.com/ahkamboh/agent-eyes && cd agent-eyes
   npm install
   npx playwright install chromium
   (Requires Node 18+ and ffmpeg on PATH.)

2. From now on, whenever I report a UI bug, a "broken" feature, or any
   "it doesn't work" behavior — BEFORE you edit any code — run:

     npx agent-eyes <url> --auto steps.json --seconds 8

   where steps.json replays the flow I described, e.g.:
     [
       { "fill": "#email", "value": "test@example.com" },
       { "fill": "#password", "value": "hunter2" },
       { "click": "#submit" },
       { "wait": 1200 }
     ]

   (Or run `npx agent-eyes <url>` with no --auto to drive it yourself.)

3. Read `.agent-eyes/session.json`. Look at markers[] FIRST — those are the
   1–3 moments that actually broke (silent-failure, dead-click, visual-review).
   Open the frame each marker points to and confirm with your own eyes.

4. Fix the bug based on that ground truth. Do NOT guess from the code alone.
```

Now your agent watches the real app before it edits it — one shot, fewer tokens, no wrong turns.

---

## Install

```bash
git clone https://github.com/ahkamboh/agent-eyes
cd agent-eyes
npm install
npx playwright install chromium
```

**Requirements:** Node 18+ · `ffmpeg` on your PATH · no API key, fully local.

---

## CLI usage

```bash
npx agent-eyes <url> [--auto steps.json] [--seconds N] [--out dir] [--fps N] [--headed]
```

| Mode | Command | What happens |
|------|---------|--------------|
| **Manual** | `npx agent-eyes <url>` | Opens a real browser window. You click around. Stops when you close the window or after `--seconds`. |
| **Auto** | `npx agent-eyes <url> --auto steps.json` | Headless. Replays your `steps.json` and captures everything. |

**Flags**

| Flag | Default | Description |
|------|---------|-------------|
| `--auto <file>` | — | Replay a steps file headlessly instead of driving by hand |
| `--seconds N` | — | Stop after N seconds |
| `--out <dir>` | `.agent-eyes` | Output directory |
| `--fps N` | — | Frame capture rate |
| `--headed` | off | Force a visible window even in auto mode |

**steps.json** is a simple list of actions:

```json
[
  { "fill": "#email", "value": "test@example.com" },
  { "click": "#submit" },
  { "wait": 1200 }
]
```

**Output** (default `.agent-eyes/`):

- `session.json` — **markers[] first**, then `timeline[]` + `frames[]`
- `frames/f###.jpg` — the captured frames
- `run.mp4` — the full recording

Point it at anything: your localhost, a live site, or someone else's page.

---

## What it captures — 5 streams, one clock

Everything is timestamped against a **single shared clock**, so a click, the request it fired, the console error it threw, the DOM change it caused (or didn't), and the frame on screen all line up to the same moment.

| Stream | | What it records |
|--------|--|-----------------|
| 👁 **Video / frames** | | Screenshots + `run.mp4` of the actual pixels |
| 🖱 **Actions** | | Every click, fill, and navigation |
| 🧾 **Console** | | Logs, warnings, and JS errors |
| 🌐 **Network** | | Requests + **response status codes** (the 4xx/5xx that matter) |
| 🏷 **DOM changes** | | What actually changed in the page after each action |

Recording all five is table stakes. The value is what comes next.

---

## The markers = the hero

Playwright Trace and other recorders already dump all the events. That's the problem — they dump **all** the events. Five hundred rows of timeline is not insight; it's a second haystack.

agent-eyes' job is **detection**. It finds the 1–3 moments that actually broke and points the agent straight at them, with the frame attached. The agent *jumps to the problem* instead of sifting.

**Detectors in v0.1:**

| Detector | Fires when | Why it matters |
|----------|-----------|----------------|
| 🔴 **silent-failure** *(flagship)* | An action caused a **4xx/5xx or JS error**, but the UI showed the user **nothing** | Looks fine, is broken. The most expensive bug to catch by eye. |
| ⚪ **dead-click** | You clicked and **nothing happened** — no DOM change, no request, no navigation | The button that isn't wired up. |
| 🔵 **visual-review** | A frame worth eyeballing | Hands your already-vision-capable agent the exact image to check for blank / broken / overlapping UI. |

Detection is why agent-eyes beats a raw recording: it doesn't just show the agent everything — it shows the agent **what's wrong**.

---

## session.json shape

`markers[]` come first — that's what the agent reads before anything else:

```json
{
  "t": 0.347,
  "kind": "silent-failure",
  "frame": "frames/f002.jpg",
  "summary": "click #submit → 422 POST /api/signup → screen did not change",
  "evidence": {
    "action":  { "type": "click", "selector": "#submit", "t": 0.31 },
    "trigger": { "type": "network", "method": "POST", "url": "/api/signup", "status": 422, "t": 0.34 }
  }
}
```

Each marker carries a timestamp, a kind, the frame to look at, a human summary, and the **evidence** — the action that caused it and the trigger that proves it. After `markers[]` come the full `timeline[]` and `frames[]` if the agent wants to dig deeper.

---

## How it works

```
   record  ─▶  frames  ─▶  detect  ─▶  emit
      │           │          │          │
  Playwright   ffmpeg     fuse 5      session.json
  drives the   slices     streams     (markers[] first)
  page &       the .mp4   on one      + frames/*.jpg
  taps all 5   into       clock,      + run.mp4
  streams      f###.jpg   flag the
                          moments
```

1. **Record** — Playwright opens the URL and taps all five streams against one clock (manually, or replaying `steps.json`).
2. **Frames** — ffmpeg turns the recording into indexed JPGs so every moment has an image.
3. **Detect** — the fused timeline runs through the detectors; the 1–3 real problems get flagged and matched to their frame.
4. **Emit** — everything is written to `session.json` (markers first), plus the frames and the full video.

---

## Honest limits

- **"Any URL" is client-side only.** agent-eyes sees console, network, DOM, and pixels — the browser's view. It **cannot see someone else's server**. When it flags a `500`, it's reporting the response the browser received, not reading their backend.
- **The recording engine is commodity.** Playwright Trace and RCE record too. The value here is the **markers** + **record-anything** + the **agent-first "run it first" UX** — not the recording itself.
- **Visual heuristics are early.** v0.1 catches JS crashes and 4xx/5xx with no UI feedback. Blank-frame, overflow, and stuck-spinner detection are coming (see roadmap).
- **Not affiliated** with Playwright, Cursor, Anthropic, or anyone else.

---

## Roadmap

More detectors — the recording stays the same; the intelligence grows:

- [ ] **overflow** — content spilling / clipped layout
- [ ] **blank-frame** — the page rendered nothing
- [ ] **stuck-spinner** — a loader that never resolves
- [ ] **regression-vs-baseline** — diff this run against a known-good one and flag what changed
- [ ] richer visual heuristics for overlapping / broken UI

---

<div align="center">

**MIT © 2026 [Ali Hamza Kamboh](https://github.com/ahkamboh) ([@ahkamboh](https://github.com/ahkamboh))**

Repo: [github.com/ahkamboh/agent-eyes](https://github.com/ahkamboh/agent-eyes)

Built with Claude Code.

</div>