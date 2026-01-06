# RP1 Protocol Reverse Engineering Findings

**Analysis Date:** 2026-01-05
**Methodology:** Source code analysis of client-side JavaScript implementation

## Discovery Log

### Initial Discovery (2026-01-05)

**Entry Point:** `https://hello.rp1.com/hello.msf`

Discovered service configuration endpoint returning JSON with metaverse connection parameters. Key finding: WebSocket endpoint `wss://prod-friends.rp1.com/socket.io/?EIO=4&transport=websocket`

**Page Source Analysis:**

Examined HTML source of RP1 Dev Center page, revealing complete client architecture:
- Socket.IO v4.8.1 usage confirmed
- CDN base: `https://cdn2.rp1.com/v0.0.137/`
- Core modules: MVIO, MVSB, MVRP, MVRP_Map
- Application initialization: `new APPDEV('https://cdn2.rp1.com/v0.0.137/', 'prod', false, '')`

**Source Code Retrieval:**

Successfully fetched and analyzed 5 core JavaScript modules:
1. `MVIO.js` - Socket.IO integration layer
2. `rp1conn.js` - Connection manager
3. `MVRP.js` - RP1 Platform protocol
4. `MVSB.js` - Service bus and binary serialization
5. `MVRP_Map.js` - Scene hierarchy and spatial queries

## Key Findings

### Architecture Layers

**4-Layer Protocol Stack Identified:**

1. **Transport (MVIO):** Socket.IO v4 over WebSocket-only
2. **Serialization (MVSB):** Custom binary protocol with 16-byte header
3. **Application (MVRP):** Avatar state, user management
4. **Scene (MVRP_Map):** 3D world hierarchy

This layered approach allows independent evolution of transport and application protocols.

### Binary Protocol Structure

**MVSB Header Format (16 bytes):**

```
[6-byte Packet ID][2-byte Control][4-byte Action][2-byte Payload Size][2-byte Reserved]
```

**Critical Discovery:** Control flags differentiate message types:
- `0x0000` = Request expecting response
- `0x0001` = Fire-and-forget request
- `0x0002` = Response packet

This allows request/response pairing over stateless WebSocket transport.

**Data Type System:**

Discovered 6-byte TWORD type (48-bit addressing) alongside standard BYTE/WORD/DWORD/QWORD. This suggests:
- Large object ID space (2^48 = 281 trillion objects)
- Likely global unique identifiers across distributed servers
- Future-proofing for massive scale

### Authentication Mechanism

**Token-Based Flow:**

1. Client requests TOKEN action with RDCompanyId and RDServiceId
2. Server returns token (appears to be session-based)
3. Client encodes token as base64 and passes to Login()
4. Server validates and transitions to LOGGEDIN state

**Open Question:** Token expiration and refresh mechanism not evident in client source. Likely handled server-side with error codes triggering re-authentication.

### Avatar State Protocol

**RAVATAR_STATE Structure (96 bytes):**

Fixed-size binary structure for real-time synchronization:
- Position: 3D double-precision (24 bytes)
- Rotation: Quaternion (32 bytes for double precision)
- Hand tracking: Left/right positions (48 bytes)
- Control flags, volume, facial data (remaining bytes)

**Bandwidth Calculation:**
- 96 bytes per avatar per update
- At 10Hz update rate: 960 bytes/sec per avatar
- For 50 nearby avatars: 48 KB/sec = ~384 Kbps

This explains proximity-based culling system (NEAREST_OPEN/CLOSE events).

### Proximity System

**Intelligent Bandwidth Management:**

Server sends NEAREST_OPEN when avatar enters range:
- Client subscribes to that avatar's updates
- Begins receiving position/audio streams

Server sends NEAREST_CLOSE when avatar leaves range:
- Client unsubscribes
- Stops receiving updates

**Hypothesis:** Server likely uses spatial indexing (octree or grid) to efficiently determine proximity relationships. Zones act as coarse-grained buckets, with fine-grained proximity within zones.

### Audio Pipeline

**Multi-Stage Processing:**

1. **Capture:** WebRTC getUserMedia API
2. **Processing:** Echo cancellation/suppression (likely WebAudio API)
3. **Compression:** Format not specified in source (likely Opus codec)
4. **Transmission:** Chunked via UPDATE_AUDIO action
5. **Routing:** Server applies distance-based attenuation
6. **Playback:** Latency compensation using synchronized server time

**Server Time Synchronization:**

Discovered `MV.MVSB.SERVICE.ITIME.Tick()` callback system. Server periodically sends time reference, allowing clients to:
- Compensate for network latency in audio playback
- Synchronize animations across clients
- Order events correctly in distributed system

### Scene Hierarchy

**3-Level Object Model:**

```
RMROOT → RMCOBJECT (containers) → RMTOBJECT (terrain) → RMPOBJECT (placeables)
```

**Container types (17 total):** Galaxy → Star System → Planet → ...
**Terrain types (11 total):** Continent → Region → District → Parcel → ...

**Design Rationale:** Hierarchical structure allows:
- Progressive loading (load planet before loading all parcels)
- Spatial queries at different granularities
- Access control at container level (e.g., private planets)

### Coordinate Systems

**Multiple Coordinate Modes:**

DCOORD structure supports 3 coordinate systems:
- `bCoord=0`: Cartesian (X, Y, Z)
- `bCoord=1`: Cylindrical (radius, angle, height)
- `bCoord=2`: Geographic (latitude, longitude, altitude)

**Observation:** Geographic coordinates suggest real-world Earth mapping capability. Could be used for location-based metaverse experiences tied to physical locations.

### Module Architecture

**Namespace System:**

Services identified by namespace string: `"metaversal/{service_name}"`

**Known Services:**
- `metaversal/map_hello` (discovered in hello.msf)

**Module Dependencies:**

hello.msf specifies `"require": "MVRP_Map"`, indicating:
- Services can declare required client modules
- Lazy loading of features based on service needs
- Extensibility for custom services

## Validated Hypotheses

### ✓ Socket.IO is the transport

**Evidence:** Direct usage of `io()` function from socket.io-client library, confirmed version 4.8.1.

### ✓ Binary protocol for performance

**Evidence:** MVSB ByteStream class with explicit binary encoding. 96-byte fixed avatar state structure confirms performance optimization over JSON.

### ✓ Proximity-based streaming

**Evidence:** NEAREST_OPEN/CLOSE events, RZone model with ASSIGN/MOVE actions, Proximity class processing batched avatar updates.

### ✓ Token authentication

**Evidence:** TOKEN action in authentication flow, base64 encoding, persona loading after successful login.

## Open Questions

### 1. Server Infrastructure

**Question:** How are zones distributed across servers?

**Observations:**
- Single WebSocket endpoint (prod-friends.rp1.com) discovered
- Zone ASSIGN/MOVE actions suggest server-side zone management
- No evidence of client-side server selection

**Hypothesis:** Load balancer routes connections, zones are sharded across backend servers, MOVE action triggers server-to-server handoff.

**How to Validate:** Connect and observe connection during zone transfers. Monitor for reconnection or transparent migration.

### 2. Token Lifecycle

**Question:** How long do tokens last? How are they refreshed?

**Observations:**
- No refresh logic found in client source
- No token expiration timestamp in response
- Error handling exists but specific codes unknown

**How to Validate:** Maintain connection for extended period (hours). Monitor for token expiration errors and server-initiated re-authentication.

### 3. Action Code Mapping

**Question:** What are the specific dwAction codes for each action?

**Observations:**
- Action codes referenced symbolically in source (e.g., `pAction.Action`)
- Actual numeric values not hardcoded in analyzed modules
- Likely defined in minified/obfuscated portions or server-side

**How to Validate:** Capture live traffic with packet logger. Build reverse mapping of action codes to action names.

### 4. Maximum Payload Size

**Question:** What is the max value for wSend field?

**Observations:**
- wSend is 2-byte WORD (max 65,535 bytes)
- No explicit limits documented in source
- Large payloads likely chunked or rejected

**How to Validate:** Send progressively larger payloads until server rejects or chunks.

### 5. Rate Limiting Thresholds

**Question:** What are the specific rate limits?

**Observations:**
- No client-side rate limiting found
- Server-side enforcement assumed
- Exponential backoff mentioned in code comments

**How to Validate:** Stress test with increasing message rates until throttling observed. Document response codes.

### 6. Audio Codec

**Question:** Which audio codec is used for compression?

**Observations:**
- UPDATE_AUDIO sends ArrayBuffer (binary data)
- Echo cancellation mentioned (WebRTC APIs)
- Compression format not specified

**Hypothesis:** Likely Opus codec (WebRTC standard, low latency, good compression)

**How to Validate:** Capture audio payload, analyze binary signature. Check for Opus magic bytes or packet structure.

### 7. Video Support

**Question:** Is UPDATE_VISIO actively used?

**Observations:**
- UPDATE_VISIO action exists in MVRP
- No video capture/playback code found in analyzed modules
- May be experimental or premium feature

**How to Validate:** Test sending UPDATE_VISIO messages. Check if server accepts and routes to other clients.

### 8. Error Code Semantics

**Question:** What do specific nResult/dwResult codes mean?

**Known:**
- 0 = Success

**Unknown:**
- Meaning of codes 1-255+
- Error messages or just numeric codes?

**How to Validate:** Trigger various error conditions (auth failures, invalid actions, etc.). Build error code dictionary.

### 9. Physics Synchronization

**Question:** How are physics (collisions, gravity) synchronized?

**Observations:**
- No physics code found in analyzed modules
- Avatar state includes position but no velocity/acceleration
- May be client-side predicted with server authority

**How to Validate:** Observe avatar movement under physics (falling, collisions). Determine if server sends physics updates or just position corrections.

### 10. Asset Loading

**Question:** What 3D model formats are supported?

**Observations:**
- RMPOBJECT has `sAssetUrl` field
- No model loader code in analyzed modules (likely in unanalyzed files)
- CDN structure suggests centralized asset hosting

**Hypothesis:** Common formats like glTF, FBX, or proprietary format

**How to Validate:** Load sample RMPOBJECT and examine asset URL. Download asset and identify format.

## Anomalies

### 1. Disabled Reconnection

**Observation:** `reconnection: false` in Socket.IO options

**Expected:** Automatic reconnection is Socket.IO default and best practice

**Possible Reasons:**
- Custom reconnection logic at application layer
- Stateful sessions that can't resume automatically
- Deliberate choice for debugging/development

**Impact:** Clients must manually reconnect on connection loss

### 2. WebSocket-Only Transport

**Observation:** `transports: ['websocket']` excludes polling fallback

**Expected:** Socket.IO typically enables long-polling fallback for restrictive networks

**Possible Reasons:**
- Performance optimization (no polling overhead)
- Target audience assumption (modern browsers/networks)
- Simplified server infrastructure

**Impact:** Connections may fail in restrictive firewall environments

### 3. No Compression

**Observation:** No mention of message compression (gzip, deflate, etc.)

**Expected:** Large JSON/binary payloads typically compressed

**Possible Reasons:**
- Binary protocol already compact
- CPU vs bandwidth trade-off favoring no compression
- Compression at transport layer (TLS compression)

**Impact:** Higher bandwidth usage than compressed alternatives

### 4. 6-Byte Packet IDs

**Observation:** TWORD type for packet identifiers (48-bit)

**Expected:** 32-bit or 64-bit identifiers more common

**Possible Reasons:**
- Balance between ID space size and header overhead
- Custom requirement for distributed ID generation
- Legacy decision from earlier protocol version

**Impact:** Unusual alignment, may complicate parsing

## Security Analysis

### Transport Layer

**✓ TLS Required:** `wss://` protocol enforced

**✓ Certificate Validation:** Standard browser WebSocket security

**⚠ No Certificate Pinning:** Client doesn't validate specific certificates (normal for web apps)

### Authentication

**✓ Token-Based:** Avoids sending passwords repeatedly

**⚠ Token Storage:** Not analyzed (likely sessionStorage or memory)

**⚠ Token Transmission:** Tokens sent over TLS, but base64 encoding is not encryption

**? Token Expiration:** Unknown, requires testing

### Message Integrity

**? Signature Verification:** No evidence of message signing in client source

**? Replay Protection:** No nonce or timestamp validation observed

**Assumption:** Server tracks packet sequence (twPacketIx) to detect replays

### Authorization

**Model-Level:** RUser/RPersona structure suggests per-persona permissions

**Action-Level:** Server presumably validates actions against user permissions

**Data Access:** Proximity system inherently limits data exposure (only nearby avatars visible)

### Rate Limiting

**Implementation:** Server-side (details unknown)

**Client Impact:** Error codes likely returned on excessive usage

**DoS Protection:** Assumed present but not documented

## Performance Considerations

### Bandwidth Usage Per Client

**Avatar Updates (10Hz):**
- Outbound: 96 bytes × 10 = 960 bytes/sec
- Inbound (50 nearby avatars): 96 bytes × 10 × 50 = 48 KB/sec

**Audio (continuous):**
- Outbound: ~20-40 Kbps (estimated, codec-dependent)
- Inbound: ~1-2 Mbps for 50 avatars (with proximity attenuation)

**Total Estimate:** 2-3 Mbps for densely populated areas

### Latency Sensitivity

**Critical Paths:**
- Avatar position updates: High (impacts perceived responsiveness)
- Audio streaming: Critical (latency noticeable above ~150ms)
- Scene loading: Low (can be progressive)

**Optimization:** Server time sync allows client-side prediction and latency compensation

### CPU Usage

**Binary Serialization:** More CPU-efficient than JSON parsing

**Audio Processing:** Echo cancellation can be CPU-intensive (WebRTC handles this)

**3D Rendering:** Not analyzed (separate graphics engine)

### Memory Usage

**Object Caching:** MVSB.SB_OBJECT suggests in-memory object cache

**Avatar State:** 96 bytes × nearby avatars (manageable)

**Audio Buffers:** Ring buffers for playback latency compensation

## Protocol Comparison

### vs Traditional REST

**Advantages:**
- Real-time bidirectional communication
- Efficient binary encoding
- Event-driven updates (no polling)

**Trade-offs:**
- More complex client implementation
- Stateful connection (vs stateless HTTP)
- Requires WebSocket support

### vs Other Metaverse Protocols

**Similar to:**
- Unity Netcode (real-time state sync)
- Unreal Engine Replication (object subscription)
- VRChat protocol (avatar + audio streaming)

**Differentiators:**
- Hierarchical scene model (RMROOT/RMCOBJECT/RMTOBJECT/RMPOBJECT)
- Multi-coordinate system support (Cartesian/Cylindrical/Geographic)
- Service bus abstraction (MVSB)

### vs WebRTC Data Channels

**Why Socket.IO instead of WebRTC:**
- Simpler NAT traversal (wss:// through proxies)
- Built-in reconnection (if enabled)
- Room/namespace support
- No STUN/TURN server complexity

**Trade-off:**
- Potentially higher latency than peer-to-peer WebRTC

## Implementation Recommendations

### For Client Developers

1. **Implement Reconnection Logic:** Since `reconnection: false`, build custom reconnection with exponential backoff

2. **Cache Object Data:** Use MVSB object caching pattern to minimize redundant data transfers

3. **Predict Movement:** Interpolate avatar positions between updates for smooth rendering

4. **Audio Buffering:** Implement jitter buffer for audio playback (100-200ms)

5. **Lazy Load Scenes:** Load RMROOT → RMCOBJECT → RMTOBJECT progressively based on camera proximity

### For Server Operators

1. **Monitor Zone Population:** Implement zone splitting when capacity exceeded

2. **Spatial Indexing:** Use octree or grid for efficient proximity queries

3. **Rate Limiting:** Protect against malicious clients sending excessive updates

4. **Load Balancing:** Distribute zones across servers based on population

5. **Telemetry:** Track packet loss, latency, bandwidth per client for capacity planning

### For Security Researchers

1. **Fuzz Binary Protocol:** Test malformed MVSB headers and payloads

2. **Token Analysis:** Reverse engineer token structure and entropy

3. **Injection Testing:** Attempt SQL/NoSQL injection via STRING_W fields

4. **Replay Attacks:** Test packet sequence validation

5. **Proximity Bypasses:** Attempt to subscribe to distant avatars (authz bypass)

## Next Steps

### Immediate Actions

1. **Build Packet Logger:** Capture live traffic to validate protocol spec
2. **Map Action Codes:** Create numeric mapping of all dwAction values
3. **Test Authentication:** Obtain real tokens and validate flow
4. **Measure Bandwidth:** Profile actual bandwidth usage in various scenarios
5. **Document Error Codes:** Trigger errors and catalog nResult values

### Future Research

1. **Server Implementation:** Reverse engineer server-side logic (if source available)
2. **Asset Pipeline:** Analyze 3D model loading and rendering
3. **Voice Chat Deep Dive:** Identify audio codec and quality settings
4. **Physics Engine:** Understand client/server physics synchronization
5. **Anti-Cheat:** Investigate cheat detection mechanisms (if any)

## Conclusion

The RP1 protocol is a well-designed, layered system optimized for real-time 3D avatar synchronization. Key strengths:

- **Performance:** Binary protocol with fixed-size structures
- **Scalability:** Proximity-based streaming limits bandwidth
- **Flexibility:** Multi-coordinate system, hierarchical scenes
- **Reliability:** Request/response pattern over WebSocket

Areas requiring live testing:
- Action code mappings
- Error code semantics
- Rate limiting thresholds
- Token lifecycle
- Audio codec identification

The protocol appears production-ready with thoughtful optimization for metaverse use cases.
