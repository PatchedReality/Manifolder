# RP1 Native JavaScript Framework Analysis

## Overview

This document summarizes the analysis of the RP1 JavaScript framework from cdn2.rp1.com (v0.0.137), including how to properly initialize the framework, create IO sessions, and read data from RMROOT objects.

## Files Downloaded

All RP1 JavaScript files have been downloaded to `lib/rp1/`:

- `jquery-3.3.1.js` - jQuery 3.3.1
- `socket.io.min.js` - Socket.IO client 4.8.1
- `MVMF.js` - Metaversal Model Foundation v0.23.29 (core framework)
- `MVSB.js` - Metaversal Socket Binary v0.23.7 (serialization)
- `MVRest.js` - Metaversal REST v0.23.4
- `MVXP.js` - Metaversal Experience v0.23.7
- `MVIO.js` - Metaversal Socket IO v0.23.7 (Socket.IO layer)
- `MVRP.js` - Metaversal RP1 Platform v0.23.21
- `MVRP_Map.js` - Metaversal RP1 Map v0.23.10

## Key Findings

### 1. MVIO.SERVICE Structure

**MVIO.SERVICE is a CLASS, not a function.** This is a critical finding.

```javascript
// WRONG (from previous attempts):
MVIO.SERVICE()

// CORRECT:
MV.MVIO.SERVICE.factory()  // Get a factory
// OR
MV.MVMF.Core.Service_Open(namespace, serviceID, connectionString)
```

**Class Details:**
- Extends: `MV.MVMF.SERVICE`
- Constructor: `(pReference, pNamespace)`
- Static method: `factory()` returns `new FACTORY('MVIO')`
- Has nested classes: `CLIENT`, `FACTORY`, `IREFERENCE`

### 2. IO_SESSION Creation Sequence

For unauthenticated connections (no login required):

```javascript
// 1. Get the IO_SESSION_NULL factory
const sessionFactory = MV.MVIO.IO_SESSION_NULL.factory();

// 2. Create a session reference
const sessionRef = sessionFactory.Reference('MVIO');

// 3. Open a client from the service
const clientRef = MV.MVIO.SERVICE.CLIENT.Reference(0); // twClientIx = 0
const pClient = pService.Client_Open(clientRef);

// 4. Create the session
const pSession = sessionRef.Create(pClient);

// 5. Initialize with a model (if using a model)
pSession.initialize(pModel);

// 6. Connect
pSession.Connect();
```

**IO_SESSION Details:**
- Extends: `MV.MVMF.SOURCE_SESSION`
- Has `Progress()` method that logs connection events
- Connection progress events:
  - `SOCKETCONNECT_ATTEMPT`
  - `SOCKETCONNECT_RESULT`
  - `LOGIN_ATTEMPT` (if authentication used)
  - `LOGIN_RESULT`
  - `LOGOUT_ATTEMPT`
  - `LOGOUT_RESULT`
- Auto-reconnect logic with exponential backoff (1s, 2s, 4s, ..., max 64s)

### 3. IO_RMROOT Creation and Read() Sequence

To read the root map object:

```javascript
// 1. Get the IO_RMROOT factory
const rmrootFactory = MV.MVRP.Map.IO_RMROOT.factory();

// 2. Create a reference to the root object
// Parameters: (sID, twObjectIx)
const rmrootRef = new MV.MVRP.Map.RMROOT.IREFERENCE('RMRoot', 1);

// 3. Get the client from the session
const pClient = pSession.pClient;

// 4. Create the IO_RMROOT source object
const pIORoot = rmrootFactory.Create(pClient);
// OR
const pIORoot = rmrootRef.Create(pClient);

// 5. Create a model for the root
const pModel = new MV.MVRP.Map.RMROOT(rmrootRef, pIORoot);

// 6. Initialize the source with the model
pIORoot.initialize(pModel);

// 7. Attach to start reading
// false = use UPDATE action (one-time read)
// true = use SUBSCRIBE action (live updates)
pIORoot.Attach(false);

// 8. Data is received via socket and stored in:
// - pIORoot.pData (raw data)
// - pModel.pName (parsed name)
// - pModel.pOwner (parsed owner)
```

**IO_RMROOT Details:**
- Extends: `MV.MVRP.Map.IO_OBJECT`
- Class ID: `70`
- Actions available:
  - `UPDATE` - One-time read of current state
  - `NAME` - Get/set name
  - `OWNER` - Get/set owner
  - `RMCOBJECT_OPEN` - Open child objects
  - `RMCOBJECT_CLOSE` - Close child objects
- `Attach(false)` triggers the UPDATE action
- Response comes through socket and calls `Map_Write()`
- Data structure:
  ```javascript
  pData: {
    pName: { wsRMRootId: "..." },
    pOwner: { twRPersonaIx: ... }
  }
  ```

### 4. Connection String Format

```
wss://hostname:port?session=session_id
```

Examples:
- `wss://prod-map-earth.rp1.com:443?session=null` (no session)
- `wss://prod-map-earth.rp1.com:443?session=abc123` (with session)

The connection string is parsed by `MV.MVMF.SERVICE.IREFERENCE`:
- Extracts protocol (ws/wss for secure)
- Extracts hostname
- Extracts port
- Extracts query parameters (session, etc.)

### 5. Socket.IO Configuration

The framework uses Socket.IO with these options:

```javascript
{
    autoConnect: false,      // Manual connection control
    reconnection: false,     // Manual reconnection logic
    transports: ['websocket'] // WebSocket only, no polling
}
```

Socket events registered:
- `connect` - Socket connected
- `connect_error` - Connection error
- `disconnect` - Socket disconnected
- `onAny` - Catches all custom events (actions like 'recover', 'refresh', etc.)

### 6. Framework Initialization Flow

#### Load Order

Libraries must be loaded in this specific order:

1. `MVMF.js` - Core framework (provides MV namespace)
2. `MVSB.js` - Serialization/binary support
3. `MVRest.js` - REST API support
4. `MVXP.js` - Experience system
5. `MVIO.js` - Socket.IO layer
6. `MVRP.js` - RP1 platform base
7. `MVRP_Map.js` - Map-specific objects

#### Plugin Installation

Each library has an `Install(pCore, pPlugin)` function:

```javascript
// Example for MVIO
MV.MVIO.Install(MV.MVMF.Core, {
    Factory_Services: (factories) => {
        // Register service factories
        for (const factory of factories) {
            MV.MVMF.Core.Factory_Register('service', factory);
        }
    },
    Factory_Sources: (factories) => {
        // Register source factories
        for (const factory of factories) {
            MV.MVMF.Core.Factory_Register('source', factory);
        }
    },
    Factory_Models: (factories) => {
        // Register model factories
        for (const factory of factories) {
            MV.MVMF.Core.Factory_Register('model', factory);
        }
    },
    Factory_Packages: (factories) => {
        // Register package factories
    }
});
```

### 7. Browser API Dependencies

The framework requires extensive browser APIs:

#### window
- `window.location.hostname` - For zone detection
- `window` - General global namespace

#### document
- `document.createElement()` - For canvas creation
- `document.cookie` - For cookie operations

#### Canvas 2D Context
- `fillText()`
- `measureText()`
- `fillRect()`
- `rect()`
- `fill()`
- `rotate()`
- `translate()`
- `save()`
- `restore()`
- `toDataURL()`
- Properties: `font`, `textBaseline`, `fillStyle`

#### navigator
- `navigator.userAgent`
- `navigator.appVersion`
- `navigator.appName`
- `navigator.plugins`
- `navigator.cookieEnabled`

#### Other Globals
- `screen.width`, `screen.height`, `screen.pixelDepth`
- `Intl.DateTimeFormat()`
- `location.hostname`, `location.pathname`

### 8. Object Class Hierarchy

#### Base Classes (MVMF)
- `MV.MVMF.SERVICE` - Base service class
- `MV.MVMF.SOURCE_SESSION` - Base session class
- `MV.MVMF.MEM.SOURCE` - Base source object class
- `MV.MVMF.MODEL_OBJECT` - Base model class
- `MV.MVMF.CLIENT` - Base client class

#### IO Layer (MVIO)
- `MV.MVIO.SERVICE` extends `MV.MVMF.SERVICE`
- `MV.MVIO.SERVICE.CLIENT` extends `MV.MVMF.CLIENT`
- `MV.MVIO.IO_SESSION` extends `MV.MVMF.SOURCE_SESSION`
- `MV.MVIO.IO_SESSION_NULL` extends `MV.MVIO.IO_SESSION`
- `MV.MVIO.IO_OBJECT` extends `MV.MVMF.MEM.SOURCE`

#### Map Objects (MVRP.Map)
- `MV.MVRP.Map.RMROOT` extends `MV.MVMF.MODEL_OBJECT`
- `MV.MVRP.Map.IO_RMROOT` extends `MV.MVRP.Map.IO_OBJECT`
- `MV.MVRP.Map.RMCOBJECT` extends `MV.MVMF.MODEL_OBJECT`
- `MV.MVRP.Map.IO_RMCOBJECT` extends `MV.MVRP.Map.IO_OBJECT`
- Similar for RMTOBJECT, RMPOBJECT, etc.

## Complete Example (Pseudocode)

```javascript
// 1. Load all libraries (in order)
require('lib/rp1/MVMF.js');
require('lib/rp1/MVSB.js');
require('lib/rp1/MVRest.js');
require('lib/rp1/MVXP.js');
require('lib/rp1/MVIO.js');
require('lib/rp1/MVRP.js');
require('lib/rp1/MVRP_Map.js');

// 2. Install plugins
MV.MVIO.Install(MV.MVMF.Core, pluginCallbacks);
MV.MVRP.Map.Install(MV.MVMF.Core, pluginCallbacks);

// 3. Open service
const connectionString = 'wss://prod-map-earth.rp1.com:443?session=null';
const pService = MV.MVMF.Core.Service_Open('MVIO', 'MVIO', connectionString);

// 4. Create session
const sessionFactory = MV.MVIO.IO_SESSION_NULL.factory();
const sessionRef = sessionFactory.Reference('MVIO');
const clientRef = MV.MVIO.SERVICE.CLIENT.Reference(0);
const pClient = pService.Client_Open(clientRef);
const pSession = sessionRef.Create(pClient);

// 5. Connect
pSession.Connect();

// 6. Wait for connection...
// Check pSession progress events

// 7. Create RMROOT object
const rmrootRef = new MV.MVRP.Map.RMROOT.IREFERENCE('RMRoot', 1);
const pIORoot = rmrootRef.Create(pClient);
const pModel = new MV.MVRP.Map.RMROOT(rmrootRef, pIORoot);
pIORoot.initialize(pModel);

// 8. Read data
pIORoot.Attach(false); // Triggers UPDATE action

// 9. Wait for response...
// Data arrives in pIORoot.pData and pModel.pName/pOwner
```

## Challenges with Node.js Execution

The framework was designed for browser execution and has several dependencies that make direct Node.js execution difficult:

1. **Circular dependencies** - The framework has circular object references that cause stack overflow with naive polyfills
2. **Canvas fingerprinting** - Requires full Canvas 2D API implementation
3. **DOM manipulation** - Expects real DOM objects in some places
4. **jQuery expectations** - Some parts expect jQuery to be available

## Recommendations

For server-side usage, consider these approaches:

### Option 1: Puppeteer (Recommended)
Run the framework in a headless Chromium browser:

```javascript
const puppeteer = require('puppeteer');
const browser = await puppeteer.launch();
const page = await browser.newPage();

// Load framework scripts
await page.addScriptTag({ path: 'lib/rp1/MVMF.js' });
// ... load other scripts

// Execute your code
const result = await page.evaluate(() => {
    // Full browser environment available
    // Run initialization sequence here
});
```

### Option 2: JSDOM
Use JSDOM for a lighter-weight DOM implementation:

```javascript
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost',
    pretendToBeVisual: true,
    resources: 'usable'
});

global.window = dom.window;
global.document = dom.window.document;
// ... set up other globals
```

### Option 3: Reverse Engineer Protocol
Analyze the Socket.IO messages and implement a minimal client without the full framework:

1. Capture WebSocket messages from browser
2. Identify binary format (uses MVSB serialization)
3. Implement minimal request/response handling
4. Skip all the browser-specific initialization

## Socket.IO Message Structure

From analyzing MVIO.js and MVSB.js:

### Request Format
```javascript
{
    action: "RMRoot:update",  // Action name
    // ... action-specific parameters
    twRMRootIx: 1            // Object index
}
```

### Response Format
```javascript
{
    nResult: 0,              // 0 = success
    // ... response data
}
```

### Binary Serialization
The MVSB library handles serialization:
- Uses DataView for binary read/write
- Supports: BYTE, WORD, DWORD, TWORD, FLOAT, DOUBLE, STRING, BINARY
- Has MAP definitions for each class
- Can serialize to/from binary buffers

## Test Harness

A test harness has been created at `tools/test-rp1-native.cjs` that documents the proper initialization sequence. Run it to see the key findings:

```bash
node tools/test-rp1-native.cjs
```

## Further Analysis Needed

To create a fully working implementation, you would need to:

1. Determine the exact object indexes for different map roots
2. Understand the RMCOBJECT hierarchy (how child objects are structured)
3. Handle all socket events ('recover', 'refresh', etc.)
4. Implement proper error handling and reconnection logic
5. Test with actual authentication (IO_SESSION with login)

## References

- CDN Base: https://cdn2.rp1.com/
- Version: v0.0.137
- Server: prod-map-earth.rp1.com:443
- Protocol: WebSocket (wss://)
- Framework: Socket.IO 4.8.1
