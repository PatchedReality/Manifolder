#\!/bin/bash
cd "$(dirname "$0")/.."
npx browser-sync start --server --files "client/**/*" "lib/**/*" --startPath client/app.html
