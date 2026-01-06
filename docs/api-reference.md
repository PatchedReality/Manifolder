# RP1 Protocol API Reference

## Configuration Endpoint

### GET /hello.msf

**Base URL:** `https://hello.rp1.com`

**Description:** Returns service configuration for initializing metaverse connection

**Request:**
```http
GET /hello.msf HTTP/1.1
Host: hello.rp1.com
```

**Response:**
```json
{
  "map": {
    "namespace": "metaversal/map_hello",
    "service": "MVIO",
    "require": "MVRP_Map",
    "connect": "hello.rp1.com:443",
    "bAuth": false,
    "RootUrl": "https://hello.rp1.com",
    "Scene": 1
  }
}
```

**Response Fields:**
- `namespace` (string): Service identifier in format "metaversal/{service_name}"
- `service` (string): Protocol layer to use ("MVIO" = real-time I/O)
- `require` (string): Required JavaScript module name
- `connect` (string): TLS connection endpoint (host:port)
- `bAuth` (boolean): Whether basic auth is required
- `RootUrl` (string): Base URL for HTTP REST APIs
- `Scene` (number): Initial scene/world ID to load

## WebSocket Connection

### Socket.IO Endpoint

**URL:** `wss://prod-friends.rp1.com/socket.io/`

**Query Parameters:**
- `EIO=4` - Engine.IO protocol version
- `transport=websocket` - Transport type

**Connection Options:**
```javascript
{
  autoConnect: false,
  reconnection: false,
  transports: ['websocket']
}
```

### Engine.IO Packet Types

| Type | Name    | Direction | Description                    |
|------|---------|-----------|--------------------------------|
| 0    | open    | S→C       | Connection handshake           |
| 1    | close   | Bi-dir    | Connection close               |
| 2    | ping    | S→C       | Keepalive ping                 |
| 3    | pong    | C→S       | Keepalive pong response        |
| 4    | message | Bi-dir    | Socket.IO message payload      |
| 5    | upgrade | Bi-dir    | Transport upgrade (not used)   |
| 6    | noop    | Bi-dir    | No operation                   |

### Socket.IO Events

#### Core Events

**connect**
- **Direction:** Server → Client
- **Description:** Socket connected successfully
- **Payload:** None
- **Handler:** Triggers MVIO `onOpen()`

**connect_error**
- **Direction:** Server → Client
- **Description:** Connection failed
- **Payload:** Error object
- **Handler:** Triggers error handling

**disconnect**
- **Direction:** Server → Client
- **Description:** Socket disconnected
- **Payload:** Reason string
- **Handler:** Triggers MVIO `onClose()`

#### Subscription Events

**subscribe**
- **Direction:** Client → Server
- **Description:** Subscribe to object updates
- **Request:**
```javascript
{
  objectId: string,     // Object identifier
  modelType: string     // e.g., "RPersona", "RZone"
}
```
- **Response:**
```javascript
{
  nResult: 0,           // 0 = success
  data: object          // Object data
}
```

**unsubscribe**
- **Direction:** Client → Server
- **Description:** Unsubscribe from object updates
- **Request:**
```javascript
{
  objectId: string
}
```
- **Response:**
```javascript
{
  nResult: 0
}
```

**refresh**
- **Direction:** Server → Client
- **Description:** Real-time object update notification
- **Payload:**
```javascript
{
  objectId: string,
  updateType: string,   // e.g., "UPDATE", "UPDATE_AUDIO"
  data: object          // Updated object data
}
```

**recover**
- **Direction:** Client → Server
- **Description:** Recover data after reconnection
- **Request:**
```javascript
{
  lastPacketIx: number  // Last received packet ID
}
```
- **Response:**
```javascript
{
  nResult: 0,
  missed: array         // Array of missed updates
}
```

## Authentication Actions

### TOKEN Action

**Direction:** Client → Server (MVSB binary protocol)

**Action Code:** TBD (defined in server implementation)

**Request Binary Structure:**
```
Header (16 bytes):
  twPacketIx:  6 bytes (auto-incremented)
  wControl:    0x0000 (request with response)
  dwAction:    [TOKEN action code]
  wSend:       [payload size]
  Reserved:    0x0000

Payload:
  sRDCompanyId: STRING_W
  sRDServiceId: STRING_W
```

**Response:**
```javascript
{
  dwResult: 0,          // 0 = success
  sToken: string        // Authentication token (base64 encoded)
}
```

**Usage:**
```javascript
// After receiving token
const encodedToken = btoa(response.sToken);
Login('token=' + encodedToken);
```

## Model Operations

### RUser Model

**RPERSONA_OPEN**
- **Description:** Open/load a user persona
- **Request:**
```javascript
{
  twUserIx: number,      // User index
  twRPersonaIx: number   // Persona index (0 = default)
}
```
- **Response:**
```javascript
{
  nResult: 0,
  persona: {
    twRPersonaIx: number,
    sName: string,
    // ... additional persona fields
  }
}
```

**RPERSONA_CLOSE**
- **Description:** Close/unload a persona
- **Request:**
```javascript
{
  twRPersonaIx: number
}
```
- **Response:**
```javascript
{
  nResult: 0
}
```

**RPERSONA_ASSUME**
- **Description:** Switch active persona
- **Request:**
```javascript
{
  twRPersonaIx: number
}
```
- **Response:**
```javascript
{
  nResult: 0
}
```

### RPersona Model

**UPDATE (Avatar State)**
- **Description:** Update avatar position, rotation, and state
- **Request Binary Structure:**
```
RAVATAR_STATE (96 bytes):
  bControl:        BYTE      // Control flags
  bVolume:         BYTE      // Audio volume (0-255)
  qRotation:       FLOAT4    // Head rotation quaternion
  vLeftHand:       DOUBLE3   // Left hand position
  vRightHand:      DOUBLE3   // Right hand position
  abFacial:        BYTE[32]  // Facial expression data
  vPosition:       DOUBLE3   // Avatar position
  // ... additional fields
```
- **Response:**
```javascript
{
  nResult: 0
}
```

**UPDATE_AUDIO**
- **Description:** Stream audio chunk
- **Request:**
```javascript
{
  twRPersonaIx: number,
  audioData: ArrayBuffer,    // Compressed audio samples
  timestamp: number          // Server time reference
}
```
- **Response:** None (fire-and-forget)

**UPDATE_VISIO**
- **Description:** Stream video chunk (if video enabled)
- **Request:**
```javascript
{
  twRPersonaIx: number,
  videoData: ArrayBuffer,
  timestamp: number
}
```
- **Response:** None

**FIND**
- **Description:** Locate persona in world
- **Request:**
```javascript
{
  sPersonaName: string       // Persona name or ID
}
```
- **Response:**
```javascript
{
  nResult: 0,
  twRPersonaIx: number,
  vPosition: { dX, dY, dZ },
  sZoneId: string
}
```

**MUTE**
- **Description:** Mute/unmute persona audio
- **Request:**
```javascript
{
  twRPersonaIx: number,
  bMuted: boolean           // true = muted, false = unmuted
}
```
- **Response:**
```javascript
{
  nResult: 0
}
```

### RZone Model

**ASSIGN**
- **Description:** Assign persona to zone
- **Request:**
```javascript
{
  twRPersonaIx: number,
  sZoneId: string
}
```
- **Response:**
```javascript
{
  nResult: 0
}
```

**MOVE**
- **Description:** Transfer persona between zones
- **Request:**
```javascript
{
  twRPersonaIx: number,
  sFromZoneId: string,
  sToZoneId: string
}
```
- **Response:**
```javascript
{
  nResult: 0
}
```

**PAUSE / CONTINUE**
- **Description:** Pause/resume zone activity
- **Request:**
```javascript
{
  sZoneId: string
}
```
- **Response:**
```javascript
{
  nResult: 0
}
```

**NEAREST_OPEN**
- **Direction:** Server → Client
- **Description:** Avatar entered proximity range
- **Payload:**
```javascript
{
  twRPersonaIx: number,
  vPosition: { dX, dY, dZ },
  qRotation: { dX, dY, dZ, dW }
}
```

**NEAREST_CLOSE**
- **Direction:** Server → Client
- **Description:** Avatar left proximity range
- **Payload:**
```javascript
{
  twRPersonaIx: number
}
```

### RRoot Model

**RZONE_OPEN_NEW**
- **Description:** Create new zone
- **Request:**
```javascript
{
  sZoneName: string,
  capacity: number           // Max avatars
}
```
- **Response:**
```javascript
{
  nResult: 0,
  sZoneId: string
}
```

**RZONE_CLOSE**
- **Description:** Close existing zone
- **Request:**
```javascript
{
  sZoneId: string
}
```
- **Response:**
```javascript
{
  nResult: 0
}
```

## Map/Scene APIs

### RMROOT Operations

**rmroot/update**
- **Method:** GET
- **URL:** `{RootUrl}/rmroot/update`
- **Response:**
```javascript
{
  twRMRootIx: number,
  sName: string,
  children: array           // Child RMCOBJECT references
}
```

### RMCOBJECT Operations

**rmcobject/search**
- **Method:** POST
- **URL:** `{RootUrl}/rmcobject/search`
- **Request:**
```javascript
{
  position: {
    dX: number,
    dY: number,
    dZ: number
  },
  radius: number,           // Search radius
  sTextQuery: string        // Optional text search
}
```
- **Response:**
```javascript
{
  results: [
    {
      twRMCObjectIx: number,
      bType: number,        // Container type (1-17)
      sName: string,
      transform: {
        position: { dX, dY, dZ },
        rotation: { dX, dY, dZ, dW },
        scale: { dX, dY, dZ }
      },
      bound: {              // Bounding ellipsoid
        radiusX: number,
        radiusY: number,
        radiusZ: number
      }
    }
  ]
}
```

**rmcobject/update**
- **Method:** GET
- **URL:** `{RootUrl}/rmcobject/update?ix={objectIndex}`
- **Response:**
```javascript
{
  twRMCObjectIx: number,
  bType: number,
  sName: string,
  transform: object,
  bound: object,
  children: array           // Child objects (RMTOBJECT)
}
```

### RMTOBJECT Operations

**rmtobject/search**
- **Method:** POST
- **URL:** `{RootUrl}/rmtobject/search`
- **Request/Response:** Similar to rmcobject/search
- **Notes:** Returns terrain objects (type 1-11)

**rmtobject/update**
- **Method:** GET
- **URL:** `{RootUrl}/rmtobject/update?ix={objectIndex}`
- **Response:**
```javascript
{
  twRMTObjectIx: number,
  bType: number,            // Terrain type (1-11)
  sName: string,
  transform: object,
  bound: object,
  children: array           // Child placeables (RMPOBJECT)
}
```

### RMPOBJECT Operations

**rmpobject/update**
- **Method:** GET
- **URL:** `{RootUrl}/rmpobject/update?ix={objectIndex}`
- **Response:**
```javascript
{
  twRMPObjectIx: number,
  sName: string,
  sAssetUrl: string,        // 3D model URL
  transform: object
}
```

## Error Responses

All API responses include `nResult` or `dwResult` status code:

| Code | Meaning                          |
|------|----------------------------------|
| 0    | Success                          |
| 1    | General error                    |
| 2    | Authentication required          |
| 3    | Permission denied                |
| 4    | Not found                        |
| 5    | Invalid parameters               |
| 6    | Server capacity exceeded         |
| 7    | Rate limit exceeded              |

**Note:** Specific error codes beyond 1 require live testing to verify.

## Rate Limiting

**Implementation:** Server-side (details not exposed in client source)

**Expected Limits:**
- Connection attempts: Unknown
- Messages per second: Unknown
- Audio/video bandwidth: Unknown

**Recommendation:** Implement exponential backoff for retries

## Data Type Reference

### STRING_W Encoding

Wide strings use UTF-16LE with 2-byte length prefix:

```
Offset | Size    | Field
-------|---------|------------------
0x00   | 2       | wLength (characters, not bytes)
0x02   | wLength*2 | UTF-16LE string data
```

### Coordinate Types

**VECTOR3 / DOUBLE3:**
```
dX: Float64 (8 bytes)
dY: Float64 (8 bytes)
dZ: Float64 (8 bytes)
Total: 24 bytes
```

**QUATERNION / FLOAT4:**
```
dX: Float64 (8 bytes)
dY: Float64 (8 bytes)
dZ: Float64 (8 bytes)
dW: Float64 (8 bytes)
Total: 32 bytes
```

**DCOORD:**
```
bCoord: UInt8 (1 byte)      // 0=Cartesian, 1=Cylindrical, 2=Geographic
dA: Float64 (8 bytes)
dB: Float64 (8 bytes)
dC: Float64 (8 bytes)
Total: 25 bytes
```

## Example Message Flows

### Complete Connection Sequence

```
1. Fetch config
   GET https://hello.rp1.com/hello.msf

2. Connect WebSocket
   WSS wss://prod-friends.rp1.com/socket.io/?EIO=4&transport=websocket

3. Engine.IO handshake
   S→C: 0{"sid":"xxx","pingInterval":25000,"pingTimeout":60000}

4. Authenticate
   C→S: emit('TOKEN', { sRDCompanyId: "...", sRDServiceId: "..." }, callback)
   S→C: callback({ dwResult: 0, sToken: "..." })

5. Login
   C→S: Login('token=base64(token)')

6. Open models
   C→S: emit('RUser:rpersona_open', { twUserIx: ..., twRPersonaIx: 0 }, callback)
   S→C: callback({ nResult: 0, persona: {...} })

7. Join zone
   C→S: emit('RZone:assign', { twRPersonaIx: ..., sZoneId: "..." }, callback)
   S→C: callback({ nResult: 0 })

8. Receive proximity events
   S→C: emit('refresh', { objectId: "...", updateType: "NEAREST_OPEN", data: {...} })

9. Send avatar updates (loop)
   C→S: emit('RPersona:update', { binaryAvatarState }, callback)
```

### Avatar Update Loop

```
setInterval(() => {
  const state = new RAVATAR_STATE();
  state.vPosition = getCurrentPosition();
  state.qRotation = getCurrentRotation();
  state.bVolume = getMicrophoneVolume();

  client.emit('RPersona:update', state.toBinary(), (response) => {
    if (response.nResult !== 0) {
      console.error('Update failed:', response);
    }
  });
}, 100); // 10Hz update rate
```
