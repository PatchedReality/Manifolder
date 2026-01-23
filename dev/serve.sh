#!/bin/bash
cd "$(dirname "$0")/.."

# Start esbuild watch in background
(cd client && npm run watch) &
WATCH_PID=$!

# Cleanup on exit
trap "kill $WATCH_PID 2>/dev/null" EXIT

# Start browser-sync
npx browser-sync start --server --files "client/dist/*" "client/css/*" "client/*.html" "lib/**/*" --startPath client/app.html
