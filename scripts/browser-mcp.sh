#!/bin/bash
set -euo pipefail

# Launches (or reuses) a Chrome instance with remote debugging on port 9222 so
# an agent can drive the extension. Pair this with `WXT_MCP=1 yarn dev`, which
# builds the extension without WXT launching its own browser. See AGENTS.md.

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROFILE_DIR="$ROOT/.wxt/chrome-mcp-profile"
EXTENSION_DIR="$ROOT/.output/chrome-mv3-dev"
DEBUG_PORT=9222

# Already running? Nothing to do.
if curl -s --max-time 1 "http://localhost:$DEBUG_PORT/json/version" >/dev/null 2>&1; then
  echo "Chrome debug already up on http://localhost:$DEBUG_PORT"
  exit 0
fi

if [ ! -d "$EXTENSION_DIR" ]; then
  echo "Extension not built yet at $EXTENSION_DIR."
  echo "Start the dev server first:  WXT_MCP=1 yarn dev"
  exit 1
fi

echo "Launching Chrome with remote debugging on port $DEBUG_PORT..."
open -na "Google Chrome" --args \
  --user-data-dir="$PROFILE_DIR" \
  --load-extension="$EXTENSION_DIR" \
  --remote-debugging-port="$DEBUG_PORT" \
  --no-first-run \
  --no-default-browser-check

# Wait for the debug endpoint to come up.
for _ in $(seq 1 20); do
  if curl -s --max-time 1 "http://localhost:$DEBUG_PORT/json/version" >/dev/null 2>&1; then
    echo "Chrome debug ready on http://localhost:$DEBUG_PORT"
    exit 0
  fi
  sleep 0.5
done

echo "Chrome did not expose the debug port within the timeout." >&2
exit 1
