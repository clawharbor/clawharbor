#!/bin/bash
# Record a focused accomplishment video showing the actual feature/work
# Usage: record-accomplishment.sh <output_name> <feature_context> [duration]
# 
# feature_context examples:
#   "dashboard" - shows main office view
#   "xp-celebration" - triggers and shows XP animation
#   "keyboard-shortcuts" - demonstrates shortcuts
#   "meeting-room" - shows meeting room with agents
#   "accomplishments" - shows accomplishments feed
#   "quest-log" - shows quest log

set -e

OUTPUT_NAME="${1:?Usage: record-accomplishment.sh <output_name> <feature_context> [duration]}"
FEATURE="${2:-dashboard}"
DURATION="${3:-8}"

SCREENSHOTS_DIR="${HOME}/.openclaw/.status/screenshots"
TEMP_DIR="/tmp/clawharbor-recording"
mkdir -p "$SCREENSHOTS_DIR" "$TEMP_DIR"

VIDEO_FILE="$TEMP_DIR/${OUTPUT_NAME}-screen.mov"
FINAL_FILE="$SCREENSHOTS_DIR/${OUTPUT_NAME}.mp4"
DASHBOARD_URL="http://localhost:3333"

# Function to bring browser to front
focus_browser() {
  osascript -e '
  tell application "System Events"
    set browserList to {"Google Chrome", "Safari", "Firefox", "Arc"}
    repeat with browserName in browserList
      if (name of processes) contains browserName then
        tell application browserName to activate
        delay 0.5
        return true
      end if
    end repeat
  end tell
  ' 2>/dev/null || true
}

# Function to navigate to specific feature
show_feature() {
  local feature="$1"
  
  case "$feature" in
    "xp-celebration")
      # Trigger an XP celebration by posting an accomplishment
      curl -s -X POST http://localhost:3333/api/office/actions \
        -H "Content-Type: application/json" \
        -d '{"type":"add_accomplishment","accomplishment":{"icon":"⭐","title":"Demo XP","who":"Demo","detail":"Testing celebration"}}' > /dev/null
      sleep 1
      ;;
    "meeting-room"|"meeting")
      # Open demo mode which has active meeting
      open "${DASHBOARD_URL}/?demo=true" 2>/dev/null
      sleep 2
      ;;
    "accomplishments"|"feed")
      # Focus on accomplishments panel (could use keyboard shortcut 'A' if implemented)
      ;;
    "quest-log"|"quests")
      # Focus on quest log (could use keyboard shortcut 'Q' if implemented)
      ;;
    "dashboard"|*)
      # Just show the dashboard
      open "$DASHBOARD_URL" 2>/dev/null
      sleep 1.5
      ;;
  esac
}

# 1. Open/refresh the dashboard and show the relevant feature
show_feature "$FEATURE"

# 2. Bring browser to front
focus_browser

# 3. Give time for any animations to settle
sleep 0.5

# 4. Record the screen
/usr/sbin/screencapture -V "$DURATION" -x "$VIDEO_FILE" 2>/dev/null

if [ ! -f "$VIDEO_FILE" ]; then
  echo "ERROR: screencapture failed" >&2
  exit 1
fi

# 5. Compress to MP4
ffmpeg -y -i "$VIDEO_FILE" \
  -vf "scale=1280:-2" \
  -c:v libx264 -preset fast -crf 28 \
  -an \
  -movflags +faststart \
  "$FINAL_FILE" 2>/dev/null

rm -f "$VIDEO_FILE"

if [ -f "$FINAL_FILE" ]; then
  echo "${OUTPUT_NAME}.mp4"
else
  echo "ERROR: ffmpeg encoding failed" >&2
  exit 1
fi
