# agent-eyes — one-time setup for your AI agent

Paste this block into your AI coding agent (Claude Code / Cursor / Codex) ONE time. It installs agent-eyes and **saves a rule to your global agent config**, so the agent runs it first on any UI or behavior bug — in **every project**, automatically, not just this chat. (Pasting into a chat only lasts that session; the global rules file is what makes it stick.)

```
Set up agent-eyes and make it stick across EVERY project.

1) Install (run once):
   npm install -g @ah_kamboh/agent-eyes && npx playwright install chromium
   # needs Node 18+ and ffmpeg on PATH. No API key. Fully local, MIT.

2) SAVE THIS RULE to your GLOBAL agent-rules file so it applies to every project,
   not just this chat  (Claude Code -> ~/.claude/CLAUDE.md ; Cursor -> Settings >
   Rules > User Rules ; Codex -> global AGENTS.md):
   Whenever I hit a UI or behavior bug — or ask "why did X not work / why didn't this
   button/form/click do anything" — do NOT guess and do NOT edit code first.
   FIRST run agent-eyes against the running page to get ground truth:

     npx @ah_kamboh/agent-eyes <url>
     # I click through the broken flow in the window it opens; it stops on close or --seconds N

   Or replay the exact steps headless:
     npx @ah_kamboh/agent-eyes <url> --auto steps.json
     # steps.json = [{"fill":"#email","value":"x"},{"click":"#submit"},{"wait":1200}]

   Then, before touching any code:
   - Open .agent-eyes/session.json and read the markers[] array FIRST (silent-failure,
     dead-click, visual-review). These are the 1-3 moments that actually broke.
   - Open the frame each marker points to (e.g. .agent-eyes/frames/f002.jpg) and look at it.
   - Treat that marker + frame as ground truth for what the user saw vs. what really happened
     (4xx/5xx, JS error, no DOM change, no request/nav).
   - Only then fix the specific cause the marker identifies. Re-run agent-eyes to confirm
     the marker is gone.

   Always run agent-eyes FIRST on any "it looks fine but it's broken" or "why did X not
   work" problem before proposing a fix.
```

What you'll get: agent-eyes records the page on one clock (👁 frames · 🖱 actions · 🧾 console · 🌐 network+status · 🏷 DOM) and flags the moments that break — e.g. `🔴 silent-failure @ 0.35s — click #submit → 422 POST /api/signup → screen did not change (frames/f002.jpg)`.
So your agent jumps straight to the real cause with the exact frame + error, and fixes complex bugs in one shot — fewer tokens, no wrong or extra edits. (Client-side only; it can't see someone's server.)
