# clawharbor Installer Skill

**Install and launch the clawharbor virtual office dashboard.**

## What This Does

1. Clones the clawharbor repo to `~/clawharbor/`
2. Installs dependencies
3. Launches the Next.js server on port 3333
4. Opens your browser to the dashboard
5. Shows your agents in a charming retro office

## When to Use

- User asks to "install clawharbor"
- User wants to "connect clawharbor to workspace"
- User wants to "see the virtual office"
- User clicks the CTA on clawharbor.work

## How It Works

### Installation Flow

```bash
# 1. Clone repo
git clone https://github.com/clawharbor/clawharbor.git ~/clawharbor

# 2. Install dependencies
cd ~/clawharbor && npm install

# 3. Create launcher script
cat > ~/.local/bin/clawharbor <<'EOF'
#!/bin/bash
cd ~/clawharbor && npm run dev
EOF
chmod +x ~/.local/bin/clawharbor

# 4. Launch
clawharbor
```

### Success Criteria

- ✅ Repo cloned to `~/clawharbor/`
- ✅ Dependencies installed (should see "added N packages")
- ✅ Server running on port 3333
- ✅ Browser opens to http://localhost:3333
- ✅ Agents appear in the office

## Post-Install

After installation, the user can:
- Run `clawharbor` from anywhere to launch
- Visit http://localhost:3333 anytime
- See real-time updates as agents work

## Troubleshooting

**Port 3333 already in use?**
```bash
# Find and kill the process
lsof -ti:3333 | xargs kill -9
```

**OpenClaw not found?**
- Make sure OpenClaw is installed: `openclaw status`
- Check config exists: `ls ~/.openclaw/openclaw.json`

**No agents showing?**
- Add agents to `~/.openclaw/openclaw.json` → `agents.list[]`
- Make sure at least one agent has sessions

## Uninstall

```bash
rm -rf ~/clawharbor
rm ~/.local/bin/clawharbor
```

## Security

- Only installs to `~/clawharbor/` (user directory, no sudo)
- Only reads from `~/.openclaw/` (no writes)
- No external API calls (all local data)
- Open source, auditable code

## Reference Files

- Main repo: https://github.com/clawharbor/clawharbor
- Install script: `./install.sh` (in this skill directory)
- Landing page: https://clawharbor.work
