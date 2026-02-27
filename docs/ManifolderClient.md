# ManifolderClient

**File**: `client/lib/ManifolderClient/ManifolderClient.js`

ManifolderClient is the communication adapter between Manifolder and MVMF (Metaverse Virtual Machine Framework) Fabric servers. It abstracts the MVMF SDK behind a clean event-based interface.

ManifolderClient is maintained as a separate [open-source project](https://github.com/PatchedReality/ManifolderClient) and included in Manifolder as a git submodule at `client/lib/ManifolderClient/`.

## Overview

ManifolderClient handles:
- Connecting to Fabric servers via Socket.io
- Authenticating (optional admin key)
- Opening and caching MVMF model objects
- Translating low-level MVMF notifications into high-level events
- Executing actions (create, update, delete, search, move)
- Managing scope lifecycle

## Creating a Client

```javascript
import { createManifolderSubscriptionClient } from '../lib/ManifolderClient/ManifolderClient.js';

const client = createManifolderSubscriptionClient();
```

## Connection Flow

```javascript
const connection = await client.connectRoot({ fabricUrl: 'https://cdn2.rp1.com/config/enter.msf' });
// connection.scopeId - the scope identifier
// connection.rootModel - the root MVMF model object
```

### What Happens During Connection

1. **Load MSF config**: `new MV.MVRP.MSF(fabricUrl)` — loads the Fabric configuration file
2. **Wait for ready**: MSF reaches ready state
3. **Get map connection**: `pFabric.GetLnG('map')` — establishes the map socket connection
4. **Authenticate**: If an admin key is provided, `pLnG.Login(adminKey)`. Otherwise, anonymous access.
5. **Wait for login**: pLnG reaches LOGGEDIN state
6. **Open root model**: Opens the RMRoot object to start receiving tree data
7. **Emit `connected`**: Client is ready for use

## Events

The client emits these events:

| Event | Payload | Description |
|-------|---------|-------------|
| `connected` | — | Successfully connected and authenticated |
| `disconnected` | — | Connection lost |
| `nodeInserted` | `(scopeId, mvmfModel, parentType, parentId)` | Server inserted a child node |
| `nodeUpdated` | `(scopeId, id, type, mvmfModel)` | Server updated a node's properties |
| `nodeDeleted` | `(scopeId, id, type, parentType, parentId)` | Server deleted a node |
| `modelReady` | `({scopeId, mvmfModel})` | A model finished loading all initial data |
| `error` | `(Error)` | Connection or operation error |
| `status` | `(message)` | Status message for UI display |

### Subscribing

```javascript
client.on('nodeInserted', (scopeId, mvmfModel, parentType, parentId) => {
  // Handle new node
});

client.on('connected', () => {
  // Connection established
});
```

## MVMF Notification System

The client acts as an **observer** of MVMF model objects. It attaches itself to objects to receive notifications:

```javascript
pFabric.Attach(this);  // Listen for Fabric-level events
pLnG.Attach(this);     // Listen for connection events
pRMRoot.Attach(this);  // Listen for root model events
```

MVMF invokes these methods on the client when state changes:

| Callback | When |
|----------|------|
| `onReadyState(notice)` | Object finished loading |
| `onInserted(notice)` | Child inserted into parent |
| `onDeleted(notice)` | Child deleted from parent |
| `onChanged(notice)` | Child or properties changed |
| `onUpdated(notice)` | Object properties updated |

The client translates these low-level notifications into the high-level events listed above.

## Object Cache

The client maintains a cache of opened MVMF model objects:

```
Map<prefixedId, mvmfModel>
e.g., "celestial:42" → pRMCObject instance
```

When a node needs to be opened:
1. Check the cache
2. If not cached, open via MVMF SDK with the appropriate class
3. Cache the result
4. Attach the client as an observer

## Action Request Pattern

For mutations (create, update, delete, move), the client uses MVMF's action request-response pattern:

```
1. client.sendAction(parentObject, actionName, payloadFiller)
2. → pObject.Request(actionName)     // Create action request
3. → fill payload with payloadFiller  // Set parameters
4. → pIAction.Send(callback)          // Send to server
5. → Server processes and responds
6. → Client receives confirmation via notification callback
```

### Mutation Confirmation

After sending a mutation, the client waits for confirmation via the notification system:

```javascript
_confirmMutation(matchFn, description, timeoutMs = 5000)
```

This:
1. Checks recent events (last 60 seconds) for a match
2. If not found, waits for new mutation events
3. Returns when a matching event arrives
4. Times out after 5 seconds if no confirmation

## Operations

### Opening Models

```javascript
client.openModel(nodeType, nodeId, scopeId)
```

Opens a node's MVMF model for loading. This triggers the server to send child data, which arrives via `nodeInserted` events.

### Search

```javascript
client.searchNodes(searchText)
```

Sends a SEARCH action to the MVMF server for each root scope. Returns two result sets:
- Direct name matches
- Ancestor path nodes (for maintaining tree context)

### Resource Loading

```javascript
client.getResourceRootUrl({ scopeId })
```

Returns the base URL for resolving resource paths within a scope.

### Following Attachments

When the Model detects an attachment link (MSF reference), it uses the client to connect to the child scope, creating a new scope context with its own object cache and event stream.

## Helper Modules

### node-helpers.js

**File**: `client/lib/ManifolderClient/node-helpers.js`

Provides utility functions for working with node data:

| Function | Description |
|----------|-------------|
| `setResourceBaseUrl(url)` | Set the base URL for resolving relative resource paths |
| `getResourceBaseUrl()` | Get the current resource base URL |
| `resolveResourceUrl(ref, baseUrl)` | Resolve a resource reference to a full URL |
| `getMsfReference(node)` | Extract an MSF file URL from a node's resource (returns null if not an MSF) |
| `rotateByQuaternion(px,py,pz, qx,qy,qz,qw)` | Rotate a point by a quaternion |
| `multiplyQuaternions(q1, q2)` | Hamilton quaternion multiplication |

### Resource URL Resolution

Resources use three URL schemes:

| Scheme | Example | Resolution |
|--------|---------|------------|
| `action://` | `action://models/building.json` | `resourceBaseUrl + "models/building.json"` |
| Full URL | `https://cdn.example.com/model.glb` | Used directly |
| Relative | `models/building.json` | `resourceBaseUrl + "models/building.json"` |

## MVMF Vendor Libraries

The MVMF SDK is included as vendored JavaScript files in `client/lib/ManifolderClient/vendor/mv/`. These must be loaded in a specific order (defined in `app.html`):

1. `MVMF.js` — Core framework
2. `MVSB.js` — Sandbox
3. `MVXP.js` — Transport
4. `MVRest.js` — REST interface
5. `socket.io.min.js` — Socket.io client
6. `MVIO.js` — I/O layer
7. `MVRP.js` — Resource protocol
8. `MVRP_Dev.js` — Development tools
9. `MVRP_Map.js` — Map protocol

These libraries are not modified by Manifolder — they are maintained by [Metaversal Corporation](https://rp1.com).
