#!/bin/bash
# Quick style lint — catches common mistakes before they ship
# Run: bash scripts/lint-style.sh

ERRORS=0

# Check for Tailwind utility classes in components/app (not node_modules)
TAILWIND_FILES=$(grep -rn 'className="[^"]*\(bg-\|text-\|flex \|p-[0-9]\|m-[0-9]\|rounded\|shadow\|grid \|w-\|h-\|gap-\|space-\)' \
  components/ app/ --include="*.tsx" --include="*.ts" 2>/dev/null \
  | grep -v 'xp-\|achievement-\|celebration' || true)

if [ -n "$TAILWIND_FILES" ]; then
  echo "❌ ERROR: Tailwind CSS classes detected (use inline styles instead):"
  echo "$TAILWIND_FILES"
  ERRORS=$((ERRORS + 1))
fi

# Check for stray docs in root
ALLOWED="CHANGELOG.md CLA.md CONTRIBUTING.md INSTALL.md QUICKSTART.md README.md SECURITY.md SKILL.md STATUS-FILES.md TROUBLESHOOTING.md WHAT-IS-THIS.md"
shopt -s nullglob
for f in *.md; do
  match=0
  for a in $ALLOWED; do
    if [ "$f" = "$a" ]; then match=1; break; fi
  done
  if [ $match -eq 0 ]; then
    echo "❌ ERROR: Unexpected doc in root: $f (move to docs/)"
    ERRORS=$((ERRORS + 1))
  fi
done

for f in *.txt; do
  echo "❌ ERROR: Unexpected .txt in root: $f (move to docs/)"
  ERRORS=$((ERRORS + 1))
done
shopt -u nullglob

if [ $ERRORS -gt 0 ]; then
  echo ""
  echo "Found $ERRORS style issue(s). Fix before committing."
  exit 1
else
  echo "✅ Style lint passed"
fi
