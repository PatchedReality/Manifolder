# RP1 Metaverse Protocol Reverse Engineering Toolkit

A comprehensive toolkit for analyzing and understanding the RP1 metaverse protocol. This project includes protocol documentation, analysis tools, and a reference client implementation based on reverse engineering of the official JavaScript client.

## Overview

The RP1 protocol is a multi-layered real-time communication system for 3D metaverse applications, featuring:

- **MVIO**: Socket.IO v4 transport layer
- **MVSB**: Binary message serialization (custom 16-byte header format)
- **MVRP**: Avatar state synchronization and world management
- **MVRP_Map**: Hierarchical 3D scene structure

## Project Structure

```
.
├── client/
│   └── simple-client.js          # Reference client implementation
├── tools/
│   ├── packet-logger.js          # Multi-format packet logging
│   ├── ws-analyzer.js            # WebSocket protocol analyzer
│   └── api-explorer.js           # HTTP API endpoint discovery
├── viewer/
│   ├── earth-viewer.html         # 3D Earth map viewer (standalone)
│   └── README.md                 # Viewer documentation
├── docs/
│   ├── protocol-spec.md          # Complete protocol specification
│   ├── api-reference.md          # API reference documentation
│   └── findings.md               # Detailed analysis and findings
└── logs/                         # Generated log files (created on run)
```

## Documentation

### Protocol Documentation

- **[Protocol Specification](docs/protocol-spec.md)** - Complete protocol layer documentation
  - MVIO (Socket.IO transport)
  - MVSB (Binary serialization)
  - MVRP (Avatar and world protocol)
  - MVRP_Map (Scene hierarchy)

- **[API Reference](docs/api-reference.md)** - API endpoint reference
  - Configuration endpoints
  - WebSocket events
  - Authentication flow
  - Model operations (RUser, RPersona, RZone, etc.)

- **[Findings](docs/findings.md)** - Detailed reverse engineering findings
  - Discovery log
  - Protocol analysis
  - Security considerations
  - Open questions

## Installation

```bash
npm install
```

## Usage

### WebSocket Traffic Analyzer

Capture and analyze WebSocket traffic between client and server:

```bash
# Observe for 30 seconds (default)
npm run ws-analyzer

# Observe for 60 seconds
node tools/ws-analyzer.js 60000

# Connect to custom endpoint
node tools/ws-analyzer.js 30000 wss://custom-endpoint.example.com
```

**Output:**
- Console: Colored real-time packet display
- `logs/{session-id}.jsonl` - JSON Lines format for programmatic analysis
- `logs/{session-id}.log` - Human-readable log file
- `logs/{session-id}.har` - HAR format (if enabled)

**Features:**
- Automatic Engine.IO packet type detection
- MVSB binary header parsing
- Event counting and statistics
- Color-coded console output

### API Endpoint Explorer

Discover and analyze HTTP API endpoints:

```bash
# Explore default endpoint (hello.rp1.com)
npm run api-explorer

# Explore custom base URL
node tools/api-explorer.js https://custom.example.com
```

**Output:**
- Console: Discovery progress and results
- `docs/api-discovery/api-discovery.json` - Complete discovery report

**Discovery patterns:**
- Configuration endpoints (`/hello.msf`, `/config/site.msf`)
- Map API endpoints (`/rmroot/update`, `/rmcobject/search`, etc.)
- Authentication endpoints
- Common API patterns (`/api/*`, `/v1/*`)

### Simple Client

Reference client demonstrating protocol usage:

```bash
# Connect and observe
npm run simple-client
```

**Features:**
- Configuration loading from hello.msf
- WebSocket connection establishment
- Authentication flow (requires valid credentials)
- Event observation and logging
- Graceful shutdown (Ctrl+C)

**Usage in code:**

```javascript
import RP1Client from './client/simple-client.js';

const client = new RP1Client();

await client.connect();

// Authenticate (requires valid credentials)
await client.authenticate({
  companyId: 'your-company-id',
  serviceId: 'your-service-id'
});

// Open persona
await client.openPersona(userIx, personaIx);

// Join zone
await client.joinZone('zone-id');

// Update avatar state
client.updateAvatarState({
  control: 0,
  volume: 128,
  rotation: { dX: 0, dY: 0, dZ: 0, dW: 1 },
  leftHand: { dX: -0.5, dY: 1.0, dZ: 0.3 },
  rightHand: { dX: 0.5, dY: 1.0, dZ: 0.3 }
});

// Observe events
await client.observe(30000); // 30 seconds

client.close();
```

### Earth Map Viewer

Interactive 3D visualization of the RP1 Earth map hierarchy:

```bash
# Open in browser (may require HTTP server due to CORS)
open viewer/earth-viewer.html

# Or serve via HTTP
cd viewer
python3 -m http.server 8000
# Then open: http://localhost:8000/earth-viewer.html
```

**Features:**
- **Hierarchy View**: Force-directed graph or spatial layout showing map structure
  - Click nodes to select and view details
  - Load children on-demand
  - Toggle between force and spatial layouts
- **Explorer View**: First-person WASD navigation through 3D space
  - Move: W/A/S/D keys
  - Look: Mouse (click to lock pointer)
  - Up/Down: Space/Shift
- **Progressive Loading**: Automatically loads Earth config → RMROOT → RMCOBJECT containers
- **Color-coded nodes**: White (root), Green (containers), Blue (terrain), Yellow (placeables)

**Controls:**
- Click "Hierarchy" or "Explorer" to switch views
- Click "Force" or "Spatial" to change layout mode
- Click nodes to select them
- Click "Load Children" to expand selected node

See [viewer/README.md](viewer/README.md) for complete documentation.

## Tools API

### PacketLogger

```javascript
import PacketLogger from './tools/packet-logger.js';

const logger = new PacketLogger({
  sessionId: 'my-session',
  logDir: 'logs',
  enableConsole: true,
  enableFile: true,
  enableHAR: true
});

// Log connection events
logger.logConnection('connected', { socketId: '...' });

// Log sent messages
logger.logSend('subscribe', { objectId: '123' });

// Log received messages
logger.logReceive('refresh', { updateType: 'UPDATE', data: {...} });

// Log binary messages
logger.logSend('RPersona:update', null, binaryBuffer);

// Log errors
logger.logError('connection-failed', error);

// Get statistics
logger.printStatistics();

// Close and save
logger.close();
```

### WebSocketAnalyzer

```javascript
import WebSocketAnalyzer from './tools/ws-analyzer.js';

const analyzer = new WebSocketAnalyzer({
  configUrl: 'https://hello.rp1.com/hello.msf',
  enableHAR: true
});

// Fetch configuration
await analyzer.fetchConfig();

// Connect
analyzer.connect();

// Register event handlers
analyzer.on('refresh', (data) => {
  console.log('Refresh event:', data);
});

// Send events
analyzer.emit('subscribe', { objectId: '123' }, (response) => {
  console.log('Response:', response);
});

// Send binary data
analyzer.emitBinary('RPersona:update', buffer);

// Helper methods
analyzer.subscribe('object-id', 'RPersona');
analyzer.unsubscribe('object-id');
analyzer.sendAction('TOKEN', { sRDCompanyId: '...' });

// Statistics
analyzer.printEventStatistics();

// Cleanup
analyzer.close();
```

### APIExplorer

```javascript
import APIExplorer from './tools/api-explorer.js';

const explorer = new APIExplorer({
  baseUrl: 'https://hello.rp1.com',
  outputDir: 'docs/api-discovery'
});

// Probe single endpoint
const result = await explorer.probe('/hello.msf', 'GET');

// Test all HTTP methods
const results = await explorer.probeEndpoint('/hello.msf');

// Discover common endpoints
await explorer.discoverCommonEndpoints();

// Analyze endpoint in detail
await explorer.analyzeEndpoint('/hello.msf');

// Full discovery run
await explorer.run();

// Generate and save report
explorer.printSummary();
explorer.saveReport('my-discovery.json');
```

## Protocol Overview

### Connection Flow

1. **Fetch configuration** from `https://hello.rp1.com/hello.msf`
2. **Connect WebSocket** to endpoint from config (e.g., `wss://prod-friends.rp1.com`)
3. **Socket.IO handshake** (Engine.IO v4 protocol)
4. **Authenticate** via TOKEN action
5. **Open models** (RUser, RPersona)
6. **Join zone** for spatial updates
7. **Real-time communication** (avatar updates, audio, proximity events)

### Binary Message Format (MVSB)

All binary messages use a 16-byte header:

```
Offset | Size | Field          | Description
-------|------|----------------|----------------------------------
0x00   | 6    | twPacketIx     | Packet identifier
0x06   | 2    | wControl       | Control flags (0x0000/0x0001/0x0002)
0x08   | 4    | dwAction       | Action code
0x0C   | 2    | wSend          | Payload size in bytes
0x0E   | 2    | Reserved       | Reserved (0x0000)
0x10   | N    | Payload        | Binary payload
```

### Avatar State (96 bytes)

```
Offset | Size | Field              | Type
-------|------|--------------------|----------
0x00   | 1    | bControl           | BYTE
0x01   | 1    | bVolume            | BYTE
0x02   | 32   | qRotation          | QUATERNION (4x DOUBLE)
0x22   | 24   | vLeftHand          | VECTOR3 (3x DOUBLE)
0x3A   | 24   | vRightHand         | VECTOR3 (3x DOUBLE)
0x52   | 14   | (additional data)  | Various
```

## Key Findings

### Architecture Strengths

- **Efficient binary protocol** - 96-byte avatar state vs. verbose JSON
- **Proximity-based streaming** - Bandwidth scales with nearby avatars, not total population
- **Hierarchical scenes** - Progressive loading (universe → galaxy → planet → parcel)
- **Multi-coordinate systems** - Cartesian, cylindrical, and geographic coordinates

### Areas Requiring Live Testing

- Action code mappings (dwAction values)
- Error code semantics (nResult codes)
- Rate limiting thresholds
- Token lifecycle and refresh
- Audio codec identification

### Security Notes

- ✓ TLS required (wss://)
- ✓ Token-based authentication
- ⚠ Reconnection disabled (client must handle)
- ⚠ WebSocket-only (no polling fallback)
- ? Message signing/integrity verification
- ? Rate limiting implementation

## Bandwidth Estimates

**Per client in populated area (50 nearby avatars):**

- Avatar updates (10Hz): 48 KB/sec outbound
- Audio streaming: ~1-2 Mbps inbound (with proximity attenuation)
- Total: ~2-3 Mbps sustained

## Development

### Running Tests

```bash
npm test
```

### Code Formatting

```bash
npx prettier --write .
```

### Development Mode (Auto-reload)

```bash
npx nodemon tools/ws-analyzer.js
```

## Limitations

1. **Authentication** - Requires valid credentials from RP1 service
2. **Closed Source** - Server implementation not available for analysis
3. **Active Development** - Protocol may change (current version: v0.23.21)
4. **Limited Testing** - Many protocol features unverified without live access

## Contributing

This is a research/educational project for understanding metaverse protocols.

When adding findings:
1. Update `docs/findings.md` with discoveries
2. Update `docs/protocol-spec.md` if protocol details change
3. Add test cases to verify assumptions

## Future Work

- [ ] Map all action codes (dwAction values)
- [ ] Document all error codes (nResult values)
- [ ] Identify audio codec (likely Opus)
- [ ] Analyze physics synchronization
- [ ] Test video support (UPDATE_VISIO)
- [ ] Build protocol validator/fuzzer
- [ ] Create interactive protocol visualization

## License

Research and educational purposes only. Respect the terms of service of any systems you analyze.

## Acknowledgments

Analysis based on publicly accessible JavaScript client code from:
- `https://cdn2.rp1.com/v0.0.137/js/mv/`

Built with:
- socket.io-client v4.7.x
- winston (logging)
- chalk (console colors)
- axios (HTTP requests)
