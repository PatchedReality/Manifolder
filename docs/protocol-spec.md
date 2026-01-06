# RP1 Metaverse Protocol Specification

**Protocol Version:** MVRP v0.23.21
**Last Updated:** 2026-01-05
**Transport:** Socket.IO v4.8.1 over WebSocket

## Overview

The RP1 metaverse protocol is a multi-layered system for real-time 3D avatar synchronization, spatial audio, and world state management. The architecture consists of:

- **MVIO**: Socket.IO connection layer
- **MVSB**: Metaversal Service Bus (binary serialization)
- **MVRP**: RP1 Platform protocol (avatar and world state)
- **MVRP_Map**: Spatial hierarchy and scene management

## Architecture Layers

### Layer 1: MVIO (Socket.IO Transport)

**Purpose:** WebSocket connection management and Socket.IO event routing

**Connection Parameters:**
```javascript
{
  autoConnect: false,
  reconnection: false,
  transports: ['websocket']
}
```

**Endpoint Format:**
- Secure: `wss://{host}:{port}`
- Standard: `ws://{host}:{port}`
- Example: `wss://prod-friends.rp1.com/socket.io/?EIO=4&transport=websocket`

**Socket.IO Events:**
- `connect` - Connection established
- `connect_error` - Connection failed
- `disconnect` - Connection closed
- Custom events: `subscribe`, `unsubscribe`, `recover`, `refresh`

**Connection States:**
```
SOCKETCONNECT → SOCKETCONNECTING → Connected
LOGGEDOUT → LOGGING → LOGGEDIN
```

### Layer 2: MVSB (Metaversal Service Bus)

**Purpose:** Binary message serialization and request/response routing

#### Message Structure

All MVSB messages use a 16-byte header followed by binary payload:

```
Offset | Size | Field        | Description
-------|------|--------------|----------------------------------
0x00   | 6    | twPacketIx   | Packet identifier (TWORD)
0x06   | 2    | wControl     | Control flags (WORD)
0x08   | 4    | dwAction     | Action code (DWORD)
0x0C   | 2    | wSend        | Payload size in bytes (WORD)
0x0E   | 2    | Reserved     | Reserved for future use (WORD)
0x10   | N    | Payload      | Binary payload (N = wSend bytes)
```

#### Control Flags

| Value  | Type                      | Description                          |
|--------|---------------------------|--------------------------------------|
| 0x0000 | Request (with response)   | Client expects server response       |
| 0x0001 | Request (no response)     | Fire-and-forget message              |
| 0x0002 | Response                  | Server response to client request    |

#### Binary Data Types

| Type   | Bytes | Encoding Method       | Description                |
|--------|-------|-----------------------|----------------------------|
| BYTE   | 1     | setUint8/getUint8     | Unsigned 8-bit integer     |
| WORD   | 2     | setUint16/getUint16   | Unsigned 16-bit integer    |
| DWORD  | 4     | setUint32/getUint32   | Unsigned 32-bit integer    |
| QWORD  | 8     | setBigUint64/getBigUint64 | Unsigned 64-bit integer |
| TWORD  | 6     | Custom                | Extended 48-bit addressing |
| DOUBLE | 8     | setFloat64/getFloat64 | IEEE 754 double precision  |
| STRING_W | Variable | UTF-16LE with length prefix | Wide string |

**Byte Order:** Little-endian for all multi-byte values

#### Response Codes

All responses include `nResult` status code:
- `0` = Success
- Non-zero = Error (specific codes vary by action)

### Layer 3: MVRP (RP1 Platform Protocol)

**Purpose:** Avatar state, user management, and real-time synchronization

#### Core Data Structures

**FLOAT3 / DOUBLE3:**
```
{
  dX: number,
  dY: number,
  dZ: number
}
```

**FLOAT4 / DOUBLE4 (Quaternion):**
```
{
  dX: number,
  dY: number,
  dZ: number,
  dW: number
}
```

**FCOORD / DCOORD (Coordinate System):**
```
{
  bCoord: byte,  // 0=Cartesian, 1=Cylindrical, 2=Geographic
  dA: double,
  dB: double,
  dC: double
}
```

**POSITION_UNIVERSAL:**
```
{
  parentReference: identifier,
  relativePosition: DCOORD
}
```

**RAVATAR_STATE (96 bytes):**
```
{
  control: byte,           // Avatar control flags
  volume: byte,            // Audio volume level
  rotation: quaternion,    // Head rotation
  handPositions: {         // VR hand tracking
    left: DOUBLE3,
    right: DOUBLE3
  },
  facialExpression: byte[], // Facial animation data
  // ... additional fields
}
```

#### Entity Types

**RRoot (Server):**
- Zone management
- Actions: `RZONE_OPEN_NEW`, `RZONE_CLOSE`

**RUser (User Account):**
- Persona lifecycle management
- Actions: `RPERSONA_OPEN`, `RPERSONA_CLOSE`, `RPERSONA_ASSUME`

**RPersona (Avatar Instance):**
- Real-time avatar state updates
- Actions:
  - `UPDATE` - Position/rotation update
  - `UPDATE_AUDIO` - Audio stream chunk
  - `UPDATE_VISIO` - Video stream chunk
  - `FIND` - Locate persona
  - `MUTE` - Mute/unmute audio

**RZone (Spatial Area):**
- Proximity-based updates
- Actions:
  - `PAUSE` / `CONTINUE` - Zone activity control
  - `ASSIGN` - Assign user to zone
  - `MOVE` - Transfer between zones
  - `NEAREST_OPEN` / `NEAREST_CLOSE` - Proximity events

#### Proximity System

The proximity handler processes batched avatar updates containing:
- 96-byte avatar state structures per persona
- Audio sample buffers
- Control signals
- Position-based culling for bandwidth optimization

### Layer 4: MVRP_Map (Scene Hierarchy)

**Purpose:** 3D world structure and spatial indexing

#### Object Hierarchy

```
RMROOT (Universe)
  └─ RMCOBJECT (Container: Galaxy, Star System, Planet, etc.)
      └─ RMTOBJECT (Terrain: Continents, Regions, Parcels, etc.)
          └─ RMPOBJECT (Placeable: Props, furniture, etc.)
```

#### Container Object Types (RMCOBJECT)

| Type | Name            | Description                    |
|------|-----------------|--------------------------------|
| 1    | Galaxy          | Top-level container            |
| 2    | Star System     | Solar system                   |
| 3    | Planet          | Planetary body                 |
| ...  | ...             | Additional container types     |
| 17   | Custom          | User-defined container         |

#### Terrain Object Types (RMTOBJECT)

| Type | Name            | Description                    |
|------|-----------------|--------------------------------|
| 1    | Continent       | Large land mass                |
| 2    | Region          | Regional division              |
| 3    | District        | District/province              |
| 4    | Parcel          | Land parcel                    |
| ...  | ...             | Additional terrain types       |
| 11   | Custom          | User-defined terrain           |

#### Transform Structure

```
{
  position: VECTOR3,      // 3D position (dX, dY, dZ)
  rotation: QUATERNION,   // Rotation (dX, dY, dZ, dW)
  scale: VECTOR3         // Scale factors
}
```

#### Spatial Queries

**Search Actions:**
- `rmcobject/search` - Query containers by position or text
- `rmtobject/search` - Query terrain by position or text

**Bounding Volumes:**
```
ELLIPSOID {
  radiusX: double,
  radiusY: double,
  radiusZ: double
}
```

## Connection Flow

### 1. Initial Connection

```
1. Load configuration from https://hello.rp1.com/hello.msf
   Response: {
     "map": {
       "namespace": "metaversal/map_hello",
       "service": "MVIO",
       "connect": "hello.rp1.com:443",
       "RootUrl": "https://hello.rp1.com",
       "Scene": 1
     }
   }

2. Parse endpoint and establish WebSocket
   URL: wss://prod-friends.rp1.com/socket.io/?EIO=4&transport=websocket

3. Socket.IO handshake (Engine.IO v4 protocol)
   - Server sends: 0{"sid":"...","upgrades":[],"pingInterval":...,"pingTimeout":...}
   - Client responds to ping packets (2) with pong (3)
```

### 2. Authentication

```
1. Client sends TOKEN action:
   {
     sRDCompanyId: "...",
     sRDServiceId: "..."
   }

2. Server responds with token

3. Client calls Login with base64-encoded token:
   Login('token=' + base64(token))

4. Server validates and transitions to LOGGEDIN state

5. Client opens RUser model and loads RPersona
```

### 3. Scene Loading

```
1. Load RMROOT (universe root)
2. Open RMCOBJECT containers (hierarchical)
3. Load RMTOBJECT terrain in current zone
4. Subscribe to RZone for proximity updates
5. Begin receiving avatar updates via Proximity handler
```

### 4. Real-time Communication

```
1. Avatar position updates (continuous):
   - Client sends RPERSONA UPDATE with RAVATAR_STATE
   - Server broadcasts to nearby clients in same zone

2. Audio streaming:
   - Client captures mic input with echo suppression
   - Sends UPDATE_AUDIO with compressed audio samples
   - Server routes to proximity-based recipients
   - Clients play with latency compensation

3. Proximity events:
   - Server sends NEAREST_OPEN when avatar enters range
   - Client subscribes to new avatar's updates
   - Server sends NEAREST_CLOSE when avatar leaves range
   - Client unsubscribes to reduce bandwidth
```

## API Endpoints

### HTTP REST Endpoints

Base URL: `https://hello.rp1.com` (from config)

**Map Services:**
- `GET /rmroot/update` - Fetch root object updates
- `POST /rmcobject/search` - Search container objects
- `POST /rmtobject/search` - Search terrain objects
- `GET /rmcobject/update` - Fetch container updates
- `GET /rmtobject/update` - Fetch terrain updates
- `GET /rmpobject/update` - Fetch placeable updates

**Authentication:**
- Token-based authentication via `TOKEN` action
- Credentials passed as base64-encoded query parameter

### WebSocket MVIO Service Endpoints

Connected via Socket.IO to `wss://prod-friends.rp1.com`

**Model Operations (180+ total):**
- `RMRoot:rmcobject_open` - Open container object
- `RMCObject:transform` - Get/set object transform
- `RMTObject:bound` - Get terrain bounding volume
- `RUser:rpersona_open` - Open user persona
- `RPersona:update` - Update avatar state
- `RZone:assign` - Assign persona to zone

## Audio Pipeline

**Client-Side Processing:**
1. Microphone capture (WebRTC getUserMedia)
2. Echo cancellation/suppression
3. Compression
4. Chunked transmission via UPDATE_AUDIO

**Server-Side Routing:**
1. Receive audio chunks from sender
2. Calculate proximity to other avatars
3. Apply distance-based volume attenuation
4. Route to nearby clients in zone

**Playback:**
1. Receive compressed audio chunks
2. Decompress
3. Apply latency compensation (server time sync)
4. Mix with other audio sources
5. Apply 3D spatialization based on avatar position
6. Output to speakers

## Protocol Versioning

**Current Version:** MVRP v0.23.21
**CDN Version:** v0.0.137
**Engine.IO:** v4
**Socket.IO:** v4.8.1

**Backward Compatibility:**
- Reserved fields in binary protocol allow future extensions
- Client checks server version on handshake
- Graceful degradation for unsupported features

## Security Considerations

**Transport Security:**
- TLS 1.2+ required (wss:// protocol)
- Certificate validation enforced

**Authentication:**
- Token-based authentication
- Tokens expire (TTL not documented in source)
- Persona-level authorization for actions

**Message Validation:**
- Server validates all action codes
- Payload size limits enforced (wSend field)
- Rate limiting on per-client basis (implementation details not exposed)

## Error Codes

Response `nResult` values:
- `0` - Success
- `1` - General error
- Additional codes TBD (requires live testing)

## Known Limitations

Based on source code analysis:
- No automatic reconnection (client must handle)
- WebSocket-only transport (no polling fallback in current config)
- Token refresh mechanism not documented in client source
- Maximum payload size not specified in protocol
- Zone capacity limits not exposed in protocol layer
