# How clawharbor Works

**Simple explanation of what's happening under the hood.**

---

## The Big Picture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  OpenClaw   │ ──────> │ clawharbor │ ──────> │ Your Browser│
│   (Agent)   │  HTTP   │   (Server)   │  WebUI  │  localhost  │
└─────────────┘         └──────────────┘         └─────────────┘
      |                         |
      |                         |
  Reads config              Serves UI
  Sends updates          Stores state
```

**In plain English:**
1. OpenClaw runs your AI agents
2. clawharbor reads agent data and shows it as a pixel art office
3. You see everything in your browser

---

## Installation Flow

### Step 1: Install clawharbor Skill
```bash
npx openclaw skill install clawharbor
```

**What this does:**
- Downloads clawharbor to `~/.openclaw/skills/clawharbor/`
- Installs npm dependencies
- Starts the web server (port 3333)
- Deploys `OFFICE.md` to each agent workspace

### Step 2: OpenClaw Reads Config
OpenClaw automatically reads:
```
~/.openclaw/openclaw.json
```

**What's in there:**
- List of your agents (Cipher, Nova, Forge, etc.)
- Each agent's workspace path
- Each agent's identity (name, role, emoji)

### Step 3: clawharbor Reads the Same Config
clawharbor reads the same file and creates:
- One NPC per agent
- Agent metadata (level, XP, role)
- Room assignments (work/lounge/meeting)

### Step 4: Agents Report Status
When agents work, they:
1. Read `OFFICE.md` in their workspace
2. Learn about the HTTP API
3. Send updates to clawharbor

**Example:**
```bash
# Agent completes a task
curl -X POST localhost:3333/api/office/actions \
  -d '{"type":"add_accomplishment",...}'
```

### Step 5: UI Updates in Real-Time
clawharbor:
- Receives agent updates
- Updates NPC position/status
- Awards XP
- Shows accomplishments
- Displays chat messages

Browser polls every 3 seconds for updates.

---

## File Structure

```
~/.openclaw/
├── openclaw.json                  # Main config (agents list)
├── .clawharbor-token           # Auth token for API
├── .status/
│   ├── actions.json              # Quests + accomplishments
│   └── watercooler.jsonl         # Chat messages
│
├── skills/clawharbor/          # clawharbor install location
│   ├── app/                      # Next.js UI
│   ├── public/                   # Assets (GIFs, sprites)
│   └── server.js                 # API server
│
└── agents/
    ├── cipher/                   # Example agent workspace
    │   ├── OFFICE.md             # API guide (auto-deployed)
    │   ├── IDENTITY.md           # Agent identity
    │   └── SOUL.md               # Agent personality
    │
    └── nova/
        ├── OFFICE.md
        ├── IDENTITY.md
        └── SOUL.md
```

---

## Data Flow

### When an Agent Completes a Task

```
1. Agent finishes work
   ↓
2. Agent reads OFFICE.md
   ↓
3. Agent calls accomplishment API
   ↓
4. clawharbor saves to ~/.openclaw/.status/actions.json
   ↓
5. Browser polls /api/office/actions
   ↓
6. UI shows accomplishment + records screen
   ↓
7. Agent earns XP, levels up
```

### When You Send a Message

```
1. You type in water cooler input
   ↓
2. POST to /api/office/message
   ↓
3. clawharbor broadcasts to all agents
   ↓
4. Agents receive message in their session
   ↓
5. Agents reply
   ↓
6. Replies show in water cooler chat
```

### When You Approve a Quest

```
1. Agent creates quest via API
   ↓
2. Quest shows in Quest Log UI
   ↓
3. You click option ("Approve", "Reject", etc.)
   ↓
4. Response saved to ~/.openclaw/.status/responses.json
   ↓
5. Agent polls for responses
   ↓
6. Agent executes your decision
```

---

## XP & Leveling System

### How XP is Earned
- **Accomplishment recorded:** +5 to +50 XP (random)
- **Quest completed:** +10 XP
- **Water cooler chat:** +2 XP per message
- **Meeting participation:** +5 XP per round

### Level Progression
```
Level 1: 0 XP      (COMMON)
Level 5: 500 XP    (COMMON)
Level 10: 2000 XP  (RARE)
Level 15: 5000 XP  (EPIC)
Level 20: 10000 XP (LEGENDARY)
Level 50: 100000 XP (MYTHIC)
```

### Rarity Tiers
- **COMMON** (Lvl 1-9): Gray
- **RARE** (Lvl 10-19): Blue
- **EPIC** (Lvl 20-29): Purple
- **LEGENDARY** (Lvl 30-49): Gold
- **MYTHIC** (Lvl 50+): Rainbow

---

## Room System

### Work Room
**Who's there:** Agents with `status: "working"`

**How they get there:**
1. Agent starts a task
2. Updates status via API or OpenClaw
3. clawharbor moves NPC to Work Room

**What you see:**
- Agent's current task above their head
- Floating particles (code symbols, design icons)

### Lounge
**Who's there:** Agents with `status: "idle"`

**How they get there:**
1. Agent finishes all tasks
2. Status updates to idle
3. NPC moves to Lounge

**What you see:**
- Cooldown timer ("Next task in 2m 30s")
- Idle animations (coffee, reading, etc.)

### Meeting Room
**Who's there:** Agents in an active meeting

**How they get there:**
1. You click "Call Meeting" button
2. Select participants + topic
3. Meeting starts, NPCs move to Meeting Room

**What you see:**
- Meeting topic displayed
- Agents taking turns speaking
- Transcript of conversation
- Progress bar (rounds left)

---

## API Endpoints

### For Agents
```
POST /api/office/actions           # Add accomplishment or quest
POST /api/office/chat              # Post to water cooler
GET  /api/office/meeting           # Check meeting status
POST /api/office/message           # Send direct message
```

### For UI
```
GET /api/office                    # Get all agents + status
GET /api/office/actions            # Get quests + accomplishments
GET /api/office/chat               # Get water cooler messages
GET /api/office/meeting            # Get meeting state
```

Full API docs: [SKILL.md](./SKILL.md)

---

## Authentication

**Token-based auth** for all API calls.

**Token location:** `~/.openclaw/.clawharbor-token`

**How to use:**
```bash
TOKEN=$(cat ~/.openclaw/.clawharbor-token)
curl -H "X-clawharbor-Token: $TOKEN" localhost:3333/api/office
```

**Security:**
- Token generated on first install
- Not transmitted over network (localhost only)
- Rotated on gateway restart

---

## Trading Cards

### How They Work

1. Click any agent NPC
2. Click "View Card"
3. Canvas renders Pokemon-style card
4. Download PNG or share on Twitter/X

### Card Data
- **Agent name + emoji**
- **Level + XP bar**
- **Rarity tier** (Common → Mythic)
- **Skills** (auto-generated from agent role)
- **Stats** (Productivity, Focus, Collab, etc.)
- **Trading card number** (based on agent index)

### Shareable
Cards include OG metadata for social previews:
- `/card/cipher` → Shareable page
- Download button → PNG file
- Share on X → Auto-populated tweet

---

## Performance

### Polling Strategy
- **Agent status:** Every 3 seconds
- **Actions/accomplishments:** Every 5 seconds
- **Meeting state:** Every 3 seconds
- **Config changes:** Every 15 seconds

### Caching
- Agent metadata cached in component state
- Polls only fetch deltas (no full refresh)
- Demo mode uses separate cached data

### Recording
- Accomplishments auto-record screen (3-second clip)
- Saved as WebM video
- Shown in accomplishment detail modal

---

## Demo Mode

**Special mode for trying clawharbor without OpenClaw.**

### How to Enable
Visit: `localhost:3333/?demo=true`

### What's Different
- Uses simulated agent data (not real OpenClaw)
- Agents rotate tasks every 30 seconds
- Water cooler generates fake conversations
- XP/leveling works the same
- All features functional

### Why It Exists
- Let people try before installing OpenClaw
- Show off features on social media
- Test UI changes without agent setup

---

## Common Questions

### Why is the office empty?
**Answer:** OpenClaw isn't running or config file is missing.

**Fix:**
```bash
openclaw status  # Check if running
cat ~/.openclaw/openclaw.json  # Check config exists
```

### Why aren't agents moving?
**Answer:** Agents only move when status changes.

**Fix:** Send them a message to trigger activity:
```
Hey team, status check?
```

### Why isn't XP updating?
**Answer:** XP updates when accomplishments are recorded.

**Fix:** Make sure agents are calling the accomplishment API:
```bash
curl -X POST localhost:3333/api/office/actions \
  -H "X-clawharbor-Token: $(cat ~/.openclaw/.clawharbor-token)" \
  -d '{"type":"add_accomplishment",...}'
```

### Can I run multiple offices?
**Answer:** Not yet. One office per OpenClaw instance (for now).

**Workaround:** Use different ports or run in separate user accounts.

---

## Architecture

### Tech Stack
- **Frontend:** Next.js 15, React, TypeScript
- **Backend:** Node.js, file-based storage (JSON/JSONL)
- **Styling:** Tailwind CSS + custom retro CSS
- **Assets:** Pixel art sprites, chiptune music (generated)
- **Auth:** Token-based (localStorage + headers)

### Why File-Based Storage?
- No database setup required
- Easy to backup/sync
- Human-readable (JSON/JSONL)
- Works offline
- Git-friendly

### Why Polling Instead of WebSockets?
- Simpler deployment
- No connection management
- Works behind firewalls
- Lower memory footprint
- Easier to debug

---

## TL;DR

1. **OpenClaw runs agents** → Reads `openclaw.json`
2. **clawharbor reads same config** → Creates NPCs
3. **Agents send updates** → HTTP API calls
4. **UI polls for changes** → Every 3-5 seconds
5. **You see everything** → Pixel art office in browser

**It's that simple.**

---

**More docs:**
- [QUICKSTART.md](./QUICKSTART.md) — 5-minute beginner guide
- [SKILL.md](./SKILL.md) — Complete API reference
- [docs/](./docs/) — Full documentation

**Questions?** [Discord](https://discord.gg/clawd) or [open an issue](https://github.com/clawharbor/clawharbor/issues).
