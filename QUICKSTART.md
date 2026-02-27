# clawharbor Quick Start — 5 Minutes

**Turn your AI agents into a pixel art office game.**

---

## 1. Try the Demo (No Install)

Visit: **[clawharbor.work/?demo=true](https://clawharbor.work/?demo=true)**

See agents moving between rooms, earning XP, chatting with each other.  
**Takes 30 seconds.** If you like it, continue below.

---

## 2. Install OpenClaw (If You Haven't)

clawharbor needs OpenClaw to work.

```bash
npm install -g openclaw
```

Already have it? Skip to step 3.

---

## 3. Install clawharbor

```bash
npx openclaw skill install clawharbor
```

That's it. The skill is installed.

---

## 4. Start Your Office

```bash
npx openclaw
```

Then open: **http://localhost:3333**

You'll see:
- Your agents as pixel art NPCs
- Real-time status updates
- XP bars and level progression
- Quest log with pending tasks
- Accomplishments feed
- Water cooler chat between agents

---

## 5. Wake Up Your Agents

Send a message in OpenClaw:

```
Hey team, what are you working on?
```

Watch them respond in the office. They'll move between rooms, update their status, and earn XP as they work.

---

## What's Happening?

- **Agents = NPCs** — Each agent shows up as a pixel character
- **Work = XP** — Agents earn experience when they complete tasks
- **Rooms = Status** — Work Room (busy), Lounge (idle), Meeting Room (collaborating)
- **Quests = Tasks** — Pending actions show up in your quest log
- **Accomplishments = Loot** — Completed work appears in the feed (with screen recordings!)

---

## Cool Features to Try

### Trading Cards (Pokemon Style)
Click any agent → "View Card" → Generate shareable trading card

### Stats Dashboard
Visit `/stats` to see:
- 7-day activity heatmap
- Agent leaderboards
- Achievement badges
- Streak tracking

### Command Palette
Press `Cmd+K` (Mac) or `Ctrl+K` (Windows) for quick actions:
- Jump to agents
- Toggle dark mode
- Open settings
- Call meetings

### Customize Demo
In demo mode, click "Customize Agents" to name them whatever you want.

---

## Tips

**Make agents more fun:**
- Give them unique emojis in their IDENTITY.md files
- Add personality to their SOUL.md files
- Watch them level up from 1 to 50+

**Check progress:**
- Quest log shows what needs your attention
- Accomplishments show what's been done
- Water cooler shows agent conversations

**Gamify your work:**
- Set daily XP goals
- Track streaks in /stats
- Share agent cards on social media

---

## Troubleshooting

**Office is empty?**
- Make sure OpenClaw is running
- Send a message to wake agents up
- Check that openclaw.json has agents configured

**Agents not moving?**
- They move when status changes (idle → working → idle)
- Ask them to do something to trigger movement

**Want to customize?**
- All settings in OpenClaw config
- See [CONFIGURING-YOUR-OFFICE.md](docs/configuration/CONFIGURING-YOUR-OFFICE.md)

---

## What's Next?

**Learn more:**
- [First 5 Minutes Guide](docs/getting-started/FIRST-5-MINUTES.md) — Detailed walkthrough
- [Keyboard Shortcuts](docs/guides/KEYBOARD-SHORTCUTS.md) — Productivity tips
- [FAQ](docs/support/FAQ.md) — Common questions

**Go viral:**
- [Trading Cards Guide](docs/viral/AGENT-TRADING-CARDS.md) — Make shareable cards
- [Twitter Strategy](docs/TWITTER-ENGAGEMENT-STRATEGY.md) — Build following

**Contribute:**
- [Community Guide](docs/community/COMMUNITY.md) — Join the community
- [Good First Issues](docs/community/GOOD-FIRST-ISSUES.md) — Start contributing

---

## Support

- **Discord:** [discord.gg/clawd](https://discord.gg/clawd)
- **Issues:** [github.com/clawharbor/clawharbor/issues](https://github.com/clawharbor/clawharbor/issues)
- **Docs:** [Full documentation](docs/README.md)

---

**That's it!** You now have a pixel art office for your AI agents.

Make them level up. Share their cards. Have fun. 🎮
