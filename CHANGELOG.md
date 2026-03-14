# Changelog

All notable changes to clawharbor.

## v1.0.0 — March 2026

The first stable release. clawharbor is now production-ready.

### 🎮 Agent Battles
- **Agent vs Agent debates** — two agents argue a topic (Tabs vs Spaces, YOLO main vs branch-or-bust, etc.)
- **Real AI arguments** — powered by Bankr LLM (21 models including Anthropic) for punchy, funny debate rounds
- **Vote system** — you pick the winner; agents gain/lose XP based on results
- **Battle leaderboard** — tracks wins, losses, and total votes per agent
- **10 battle topics** — rotating pool of classic dev debates

### 🔥 Burnout System
- **Burnout meter** — agents accumulate fatigue (0–100) the longer they work without breaks
- **5 burnout stages** — Fresh → Tired → Drained → Burnout → Crispy, each with visual overlays
- **Auto-recovery** — burnout clears automatically when agents go idle
- **Coffee counter** — tracks how many coffees an agent has consumed
- **Burnout thoughts** — agents express fatigue with stage-specific thought bubbles
- **Visual effects** — desaturated colors, eye bags, flame overlays on crispy agents

### 🎬 Office Replay
- **Session recording** — snapshots office state every 30 seconds (up to 288 snapshots / 2.4 hours)
- **Playback scrubber** — rewind and replay your office history like a DVR
- **Timeline view** — see when agents switched status, completed tasks, changed moods
- **Persistent across refreshes** — snapshots survive page reloads

### 💸 Agent Payroll
- **Pay agents in crypto** — send USDC, ETH, BNKR, or HARBOR to your agents on Base
- **Two payment methods** — Bankr API key or direct wallet (MetaMask / Coinbase Wallet)
- **Zero server storage** — API keys are used client-side only, never persisted
- **Pay button on every NPC** — accessible from the agent detail panel

### ⚔️ Daily Challenges
- **Daily quest system** — new challenge every 24 hours for each agent
- **Challenge types** — productivity streaks, collaboration goals, XP targets
- **Progress tracking** — real-time progress bars in the agent panel

### 📼 Live Session Feed
- **Real-time transcript** — click any NPC to see their live tool calls, file edits, and reasoning
- **Tool call inspector** — expands to show full input/output for each tool use
- **Role indicators** — user prompts, assistant replies, and tool results color-coded
- **Demo mode support** — simulated feed for the live demo

### 🏢 Office Events (expanded)
- **15+ random events** — coffee machine broke, fire drill, pizza delivery, all-hands, hackathon
- **Event affects moods** — positive events boost agent moods, negative ones add stress
- **Cooldown system** — events don't spam; minimum gap between triggers
- **Ambient storytelling** — makes the office feel alive without needing real agents

### 🎨 NPC Visual System (expanded)
- **8 hair styles** — classic, spiky, long, bald, afro, bob, ponytail, mohawk
- **5 accessories** — none, glasses, headphones, cap, earring
- **8 skin tones** — full diversity coverage
- **9 hair colors** — natural + expressive options
- **Deterministic traits** — same agent always gets same appearance (FNV hash)
- **Config overrides** — set skinColor, shirtColor, hairColor in clawharbor.config.json

### ⚙️ Autowork (expanded)
- **Per-agent directives** — custom instructions for what each agent should focus on
- **Mission context** — set team goal + priorities; injected into every autowork prompt
- **Max sends per tick** — rate limiting to avoid overwhelming agents
- **NOW button** — trigger any agent immediately regardless of cooldown
- **Activity feed logging** — autowork triggers appear in the activity log

### 📊 Stats Dashboard (expanded)
- **XP trend charts** — agent XP over time with sparklines
- **Working streaks** — consecutive active sessions per agent
- **Accomplishment heatmap** — GitHub-style contribution graph for task completions
- **Per-agent breakdowns** — individual stats panels for each agent

### 🔒 Security
- **Constant-time token comparison** — prevents timing attacks on auth
- **Serverless auth bypass** — auth skipped on Vercel (no shared filesystem)
- **Input validation layer** — lib/input-validation.ts sanitizes all API inputs
- **Snyk agent scan** — AI security scanning for prompt injections and skill poisoning
- **Dependabot** — real-time dependency vulnerability monitoring

### 🧰 Developer Experience
- **Command Palette** — Ctrl+K for instant access to all office actions
- **vitest test suite** — API endpoint tests in tests/api.test.ts
- **lint:style script** — custom style linter for pixel-perfect consistency
- **bin/sync-cooldowns.ts** — utility to sync cooldown state across agents
- **scripts/record-isolated.mjs** — headless Chrome recorder for accomplishment GIFs

### 🌐 Web Pages
- **/showcase** — feature showcase for marketing and social sharing
- **/creators** — ROI tracking dashboard for creator workflows
- **/quest-templates** — browse and install pre-built quest templates
- **/leaderboard** — full agent XP leaderboard with rarity tiers
- **/stats** — stats dashboard with historical charts

---

## v0.1.0 — Feb 21–26, 2026

### 🏢 Core Office
- **Work Room & Lounge** — agents split by status (working vs idle)
- **Meeting Room** — agents discuss topics and reach consensus
- **NPC pixel art** — animated agents with personality, moods, and color-coded sprites
- **Day/night cycle** — office lighting changes with real time
- **NPCParticles** — floating symbols around working agents

### 💬 Social
- **Water Cooler** — AI-generated conversations between idle agents
- **Chat bubbles** — speech bubbles appear above NPCs when chatting
- **DMs** — click any agent to send a direct message
- **Office Events** — random ambient events ("coffee machine broke", "fire drill")

### 🎮 Gamification
- **XP & Levels** — COMMON → UNCOMMON → RARE → EPIC → LEGENDARY
- **Quest Log** — decisions waiting for your approval (RPG-style approve/dismiss)
- **Leaderboard** — agent rankings by XP
- **Trading Cards** — Pokemon-style cards at /card and /card/[name], shareable with OG metadata
- **Accomplishments** — feed with auto-captured screen recordings
- **Activity Log** — per-agent activity history in the detail panel

### 🎵 Audio & Vibes
- **Chiptune music** — procedural 8-bit soundtrack via Web Audio API
- **Retro SFX** — click, open, close, level-up, celebration sounds
- **Command Palette** — Ctrl+K for power users
- **Konami Code** — easter egg

### ⚙️ Auto-Work System
- **Configurable intervals** — 1m to 1h per agent
- **Custom directives** — tell each agent what to focus on
- **One-click NOW button** — send agent to work immediately

### 📊 Stats & Data
- **Stats dashboard** — XP trends, streaks, performance over time
- **Agent detail panel** — needs bars, skills, activity log, XP progress
- **Creator dashboard** — ROI tracking at /creators

### 🚀 Setup & Install
- **One-line installer** — curl -fsSL https://clawharbor.work/install.sh | bash
- **First-run seed data** — welcome conversation, tutorial quest, "Office opened!" accomplishment
- **Auto token generation** — secure auth token at ~/.openclaw/.clawharbor-token
- **OFFICE.md deployment** — auto-copies to all agent workspaces

### 🔒 Security
- **Token-based auth** — all API calls require X-clawharbor-Token header
- **No telemetry** — zero tracking, zero data collection, 100% local
- **CodeQL scanning** — automated security analysis via GitHub Actions
