#!/bin/bash
# Record a Loom-style screen capture of the clawharbor dashboard
# Usage: record-loom.sh <output_filename> [duration_seconds] [tts_text]
# Outputs the final mp4 path on success

set -e

OUTPUT_NAME="${1:?Usage: record-loom.sh <output_name> [duration] [tts_text]}"
DURATION="${2:-6}"
TTS_TEXT="${3:-}"

SCREENSHOTS_DIR="${HOME}/.openclaw/.status/screenshots"
TEMP_DIR="/tmp/clawharbor-recording"
mkdir -p "$SCREENSHOTS_DIR" "$TEMP_DIR"

VIDEO_FILE="$TEMP_DIR/${OUTPUT_NAME}-screen.mov"
FINAL_FILE="$SCREENSHOTS_DIR/${OUTPUT_NAME}.mp4"

# Function to get window bounds and focus clawharbor browser window
get_window_region() {
  # Returns: x,y,width,height or empty string if window not found
  osascript 2>/dev/null <<'APPLESCRIPT' || echo ""
    tell application "System Events"
      set browserApps to {"Google Chrome", "Safari", "Firefox", "Brave Browser", "Arc"}
      repeat with browserApp in browserApps
        if exists (process browserApp) then
          tell process browserApp
            set frontmost to true
            delay 0.2
            -- Try to find window with "clawharbor" or "localhost:3333" in title
            set windowList to every window
            repeat with w in windowList
              try
                set windowTitle to name of w
                if windowTitle contains "clawharbor" or windowTitle contains "localhost:3333" then
                  perform action "AXRaise" of w
                  delay 0.3
                  
                  -- Get window position and size
                  set windowPos to position of w
                  set windowSize to size of w
                  set windowX to item 1 of windowPos
                  set windowY to item 2 of windowPos
                  set windowW to item 1 of windowSize
                  set windowH to item 2 of windowSize
                  
                  return "" & windowX & "," & windowY & "," & windowW & "," & windowH
                end if
              end try
            end repeat
          end tell
        end if
      end repeat
    end tell
    return ""
APPLESCRIPT
}

# Get the window region
REGION=$(get_window_region)

if [ -z "$REGION" ]; then
  echo "ERROR: clawharbor window not found. Is http://localhost:3333 open in a browser?" >&2
  exit 1
fi

# Small delay to ensure window is focused and fully rendered
sleep 0.5

# Record only the clawharbor window region
/usr/sbin/screencapture -V "$DURATION" -R "$REGION" -x "$VIDEO_FILE" 2>/dev/null

if [ ! -f "$VIDEO_FILE" ]; then
  echo "ERROR: screencapture failed" >&2
  exit 1
fi

# Add voiceover if TTS text provided
if [ -n "$TTS_TEXT" ] && command -v say &>/dev/null; then
  AUDIO_FILE="$TEMP_DIR/${OUTPUT_NAME}-audio.aiff"
  say -o "$AUDIO_FILE" --rate=180 "$TTS_TEXT" 2>/dev/null

  ffmpeg -y -i "$VIDEO_FILE" -i "$AUDIO_FILE" \
    -vf "scale=1280:-2" \
    -c:v libx264 -preset fast -crf 28 \
    -c:a aac -b:a 128k \
    -shortest \
    -movflags +faststart \
    "$FINAL_FILE" 2>/dev/null

  rm -f "$AUDIO_FILE"
else
  # No audio, just encode video
  ffmpeg -y -i "$VIDEO_FILE" \
    -vf "scale=1280:-2" \
    -c:v libx264 -preset fast -crf 28 \
    -an \
    -movflags +faststart \
    "$FINAL_FILE" 2>/dev/null
fi

rm -f "$VIDEO_FILE"

if [ -f "$FINAL_FILE" ]; then
  echo "${OUTPUT_NAME}.mp4"
else
  echo "ERROR: ffmpeg encoding failed" >&2
  exit 1
fi
