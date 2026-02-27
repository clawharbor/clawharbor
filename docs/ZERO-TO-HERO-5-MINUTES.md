# Zero to Hero: Your First 5 Minutes with clawharbor

**From "What is this?" to "My agents are in the office" in under 5 minutes.**

---

## What You'll See

By the end of this guide:
- ✅ Your OpenClaw agents appear as pixel art NPCs
- ✅ They earn XP for completing tasks
- ✅ You can watch them work in real-time
- ✅ Quest log shows what needs your attention
- ✅ Accomplishments feed shows what got done

**No configuration. No setup. Just works.**

---

## Step 1: See the Demo (30 seconds)

Open this in your browser:
```
https://clawharbor.work/?demo=true
```

**What you're seeing:**
- Scout (purple shirt) in the Work Room — actively working
- Cipher (blue shirt) in the Lounge — on cooldown
- Nova (pink shirt) at level 18 with 4,500 XP
- Quest log on the right — "LAUNCH" is ready
- Accomplishments feed — what got done today

**This is what YOUR OpenClaw agents will look like.**

---

## Step 2: Install clawharbor (2 minutes)

### Option A: If you have OpenClaw already

```bash
# Install the skill
openclaw skill install clawharbor

# Start the dashboard
npx clawharbor
```

Open: http://localhost:3333

**That's it.** Your agents are now in the office.

---

### Option B: If you don't have OpenClaw yet

1. Install OpenClaw:
   ```bash
   npm install -g openclaw
   ```

2. Follow the setup wizard (creates your first agent)

3. Install clawharbor:
   ```bash
   openclaw skill install clawharbor
   npx clawharbor
   ```

Open: http://localhost:3333

---

## Step 3: Understand What You're Seeing (2 minutes)

### The Office Layout

**Work Room** (left):
- Agents actively working on tasks
- NPCs walk around, earn XP, chat
- See real-time progress

**Lounge** (right):
- Agents on cooldown/idle
- Waiting for next assignment
- Cooldown timers show when they'll self-assign again

**Quest Log** (right panel):
- Pending decisions that need human input
- Click to see details
- Prioritized by urgency (critical/high/medium)

**Accomplishments Feed** (bottom):
- What got done today
- Each agent's completed tasks
- Real-time updates

---

### What the NPCs Show

**Level & XP Bar**:
- Earned by completing tasks
- Levels up like an RPG character
- Shows agent productivity over time

**Thought Bubbles**:
- What the agent is working on right now
- Updates in real-time
- Click NPC to see full details

**Plumbobs** (Sims-style icons):
- Green: Working
- Blue: Idle
- Orange: Needs attention

---

## Step 4: Try It Out (30 seconds)

### Give Your Agent a Task

In your terminal:
```bash
openclaw send "scout, find me 3 articles about AI coding agents"
```

**Watch clawharbor:**
1. Scout appears in the Work Room
2. Thought bubble shows the task
3. XP bar fills as they work
4. Accomplishment appears when done

**This is the magic moment** — seeing your agent work instead of reading logs.

---

## Common Questions

### "Do I need to configure anything?"

**No.** clawharbor auto-detects:
- Your OpenClaw agents from config
- Active sessions (who's working)
- Cron jobs (scheduled tasks)
- Quest log (pending decisions)

Zero config required.

---

### "Can I customize the agents?"

**Yes!** Edit `clawharbor.config.json`:

```json
{
  "agents": {
    "scout": {
      "name": "Scout McScouterson",
      "skinColor": "#FFE0BD",
      "shirtColor": "#9B59B6",
      "role": "Influencer Hunter"
    }
  }
}
```

Restart the dashboard to see changes.

---

### "Does this slow down my agents?"

**No.** clawharbor just reads from:
- `~/.openclaw/agents/*/sessions/sessions.json`
- Accomplishments API
- Quest log files

Your agents run exactly the same. This is just a visual layer.

---

### "Can I use this with other AI frameworks?"

**Not yet.** clawharbor is OpenClaw-specific because it:
- Reads OpenClaw's session format
- Uses OpenClaw's agent configs
- Integrates with OpenClaw's skill system

But it's open source — fork it if you want to adapt it!

---

## What's Next?

### Level 1: Watch Your Agents Work
- Keep the dashboard open while your agents run
- See real-time progress instead of terminal logs
- Catch issues faster (idle agents, stuck tasks)

### Level 2: Manage Your Team
- Quest log shows what needs your input
- Accomplishments feed shows what shipped
- Cooldown timers tell you when agents will self-assign

### Level 3: Optimize Productivity
- Track which agents are most productive (XP/level)
- See coordination patterns (who works together)
- Identify bottlenecks (agents waiting on decisions)

### Level 4: Show It Off
- Share your office with teammates
- Screenshot your level 18 agent for Twitter
- Make productivity feel like a game

---

## Troubleshooting

### "I don't see any agents"

**Check:**
1. OpenClaw is running: `openclaw status`
2. You have agents configured: `openclaw agents list`
3. Dashboard is connected: Refresh http://localhost:3333

### "Agents aren't updating"

**Try:**
1. Give an agent a task: `openclaw send "agent_name, say hello"`
2. Refresh the dashboard
3. Check browser console for errors

### "Port 3333 is already in use"

**Fix:**
```bash
# Use a different port
npx clawharbor --port 3334
```

Or kill the existing process:
```bash
lsof -ti:3333 | xargs kill
```

---

## Tips & Tricks

### Keep It Open
Run clawharbor in a separate browser window. Pin it to a second monitor. Glance over to see what's happening.

### Follow the Quest Log
When a quest appears, it means your agent needs your decision. Handle it fast to keep momentum.

### Celebrate Accomplishments
When an accomplishment pops up, take a second to appreciate it. Your agent just shipped something.

### Screenshot Your Progress
Level 18 agent? 50 accomplishments today? Screenshot it and share. People love seeing the progress.

---

## What Makes This Different?

**Traditional dev tools:**
- ❌ Terminal logs (boring, hard to parse)
- ❌ Status APIs (text-based, no personality)
- ❌ Chat transcripts (linear, no overview)

**clawharbor:**
- ✅ Visual (pixel art NPCs, office environment)
- ✅ Real-time (watch agents move, work, level up)
- ✅ Gamified (XP, levels, quests, accomplishments)
- ✅ Fun (Sims meets AI agents)

**This is vibe coding for AI agents.**

---

## Resources

- **Demo**: https://clawharbor.work/?demo=true
- **GitHub**: [Link when public]
- **Docs**: All guides in `clawharbor/docs/`
- **Discord**: [OpenClaw community]
- **Twitter**: [@__tfresh](https://x.com/__tfresh)

---

## Got Questions?

Open an issue on GitHub or ping us on Discord. We built this in a weekend, so feedback is gold.

---

**Time to completion: 5 minutes**  
**Expected result: Your agents are in the office**  
**Next step: Watch them work**

Welcome to clawharbor. 🎨
