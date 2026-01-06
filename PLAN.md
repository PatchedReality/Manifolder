# RP1 Three.js Map Browser

## Architecture
```
Browser (three.js) → Node Proxy (Express/WS) → RP1 (wss://prod.rp1.com:443)
```

## Chunks (Sequential)

### Chunk 1: MVSB Protocol
**Output:** `server/mvsb.js`
**Input:** `docs/protocol-spec.md`
- 16-byte header: 6B packet + 2B control + 4B action + 2B size + 2B reserved
- Data types: BYTE, WORD, DWORD, QWORD, TWORD, DOUBLE, STRING_W
- Little-endian, exports createRequest() and parseResponse()

### Chunk 2: Proxy Server
**Output:** `server/index.js`, `server/rp1-proxy.js`
**Input:** `server/mvsb.js`, `docs/protocol-spec.md`
- Express on :3000 serving client/
- WebSocket endpoint /ws for browser
- Socket.IO client to wss://prod.rp1.com:443/WS
- C2A auth: TOKEN → Login(base64) → Session
- Forward map requests, return JSON to browser

### Chunk 3: Three.js Tree Viewer
**Output:** `client/index.html`, `client/js/tree-viewer.js`
**Input:** None (mock data)
- Three.js scene with OrbitControls
- Spheres for nodes, lines for parent-child
- CSS2DRenderer for labels
- Click to expand/collapse
- Colors: RMRoot=gold, RMCObject=blue, RMTObject=green, RMPObject=orange

### Chunk 4: Integration
**Output:** `client/js/app.js`, `client/js/rp1-client.js`, `client/css/style.css`
**Input:** Chunks 1-3 outputs
- RP1Client: WebSocket to /ws, login(), getMapTree()
- App: login form, status, wire client to tree viewer

## Verification
- Chunk 1: `node -e "require('./server/mvsb.js')"`
- Chunk 2: `npm start` connects to RP1
- Chunk 3: Open index.html, see 3D tree with mock data
- Chunk 4: Login with real creds, see real map tree
