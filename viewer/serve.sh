#!/bin/bash
echo "Starting HTTP server on http://localhost:8000"
echo "Opening earth-viewer-native.html in browser..."
echo ""
echo "Available pages:"
echo "  - http://localhost:8000/earth-viewer-native.html (uses RP1 JavaScript)"
echo "  - http://localhost:8000/earth-viewer.html (custom three.js version)"
echo ""

# Start server
python3 -m http.server 8000
