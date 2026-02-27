#!/bin/bash
# Publish clawharbor to ClawhHub
# Run: bash scripts/publish-to-clawhub.sh
#
# First time: clawhub login (opens browser)

set -e

echo "🏢 Publishing clawharbor to ClawhHub..."
echo ""

# Check auth
if ! clawhub whoami &>/dev/null; then
  echo "❌ Not logged in. Run: clawhub login"
  exit 1
fi

echo "✅ Authenticated as: $(clawhub whoami 2>&1)"
echo ""

# Publish from repo root (SKILL.md is there)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"

clawhub publish "$REPO_DIR" \
  --slug clawharbor \
  --name "clawharbor" \
  --version 0.1.0 \
  --changelog "Initial release — pixel art NPCs, water cooler, XP system, quest log, trading cards, chiptune music, auto-work, activity log" \
  --tags latest

echo ""
echo "🎉 Published! View at: https://clawhub.ai/skills/clawharbor"
echo ""
echo "Users can now install with:"
echo "  clawhub install clawharbor"
