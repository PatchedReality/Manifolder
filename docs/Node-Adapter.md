# Node Adapter

**File**: `client/js/node-adapter.js`

NodeAdapter wraps raw MVMF model objects with a clean, normalized interface. All node data access in Manifolder goes through NodeAdapter — views and other components never read raw MVMF model objects directly.

## Creating NodeAdapters

NodeAdapters are created by the Model when processing server data:

```javascript
const adapter = new NodeAdapter(mvmfModelObject, scopeId);
```

For search results (which don't have full MVMF models), a static factory method creates stub adapters:

```javascript
const stub = NodeAdapter.fromSearchResult(searchResultData);
```

Search stubs have `_isSearchStub = true` and limited property access.

## Instance Properties

### Identity

| Property | Type | Description |
|----------|------|-------------|
| `type` | `string` | MVMF class type (`RMRoot`, `RMCObject`, `RMTObject`, `RMPObject`) |
| `id` | `number` | Numeric ID within the scope |
| `nodeUid` | `string` | Fully qualified UID: `{scopeId}:{prefix}:{id}` |
| `key` | `string` | Alias for `nodeUid` |
| `name` | `string` | Human-readable name from `pName` |
| `nodeType` | `string` | Resolved type name (e.g., "Planet", "City", "Physical") |
| `fabricScopeId` | `string` | The scope this node belongs to |

### Spatial Data

| Property | Type | Description |
|----------|------|-------------|
| `transform` | `{position, rotation, scale}` | Normalized local transform |
| `bound` | `{x, y, z}` | Normalized bounding half-extents |
| `worldPos` | `{x, y, z}` | Computed world-space position |
| `worldRot` | `{x, y, z, w}` | Computed world-space rotation (quaternion) |

### Resource Data

| Property | Type | Description |
|----------|------|-------------|
| `resourceUrl` | `string\|null` | Fully resolved resource URL |
| `resourceRef` | `string\|null` | Raw resource reference string |

### State

| Property | Type | Description |
|----------|------|-------------|
| `isReady` | `boolean` | Whether the MVMF model is fully loaded |
| `isExpanded` | `boolean` | Whether the node is expanded in the tree |
| `isSearchMatch` | `boolean` | Whether this node matches the current search |
| `isSearchAncestor` | `boolean` | Whether this node is an ancestor of a search match |
| `_isLoading` | `boolean` | Whether children are being loaded |

### Tree Structure

| Property | Type | Description |
|----------|------|-------------|
| `children` | `NodeAdapter[]` | Array of child adapters |
| `_parent` | `NodeAdapter\|null` | Parent adapter reference |

### Orbital Data

| Property | Type | Description |
|----------|------|-------------|
| `orbit` | `object\|null` | Extracted orbital parameters (celestial only) |
| `_orbitData` | `object` | View-owned orbital visualization data |
| `_planetContext` | `object` | View-owned planet context |

## Transform Normalization

Raw MVMF models store transforms in varying formats. NodeAdapter normalizes them:

### Position

The `_normalizeTransform()` method handles:
- Object format: `{ dPosX, dPosY, dPosZ }`
- Array format: `{ aPosition: [x, y, z] }`
- Missing data: defaults to `{x: 0, y: 0, z: 0}`

### Rotation

- Object format: `{ dRotX, dRotY, dRotZ, dRotW }`
- Array format: `{ aRotation: [x, y, z, w] }`
- Missing data: defaults to `{x: 0, y: 0, z: 0, w: 1}` (identity quaternion)

### Scale

- Object format: `{ dSclX, dSclY, dSclZ }`
- Array format: `{ aScale: [x, y, z] }`
- Missing data: defaults to `{x: 1, y: 1, z: 1}`

### Bounds

- Object format: `{ dX, dY, dZ }`
- Array format: `[x, y, z]`
- Missing data: defaults to `{x: 0, y: 0, z: 0}`

Results are cached in `_cachedTransform` and `_cachedBound`, invalidated by `markDirty()`.

## World Position Computation

The `worldPos` getter recursively computes world-space position by walking up the parent chain:

```
worldPos = parentWorldPos + parentWorldRot * localPosition
```

For celestial nodes with orbital data, the local position is replaced by the calculated orbital position:

1. Extract orbital parameters (semiMajorAxis, semiMinorAxis, period, phaseOffset)
2. Calculate position on ellipse using current simulation time
3. Rotate the orbital position by the node's local rotation quaternion
4. Apply parent's world rotation and translation

For non-orbital nodes, the local transform position is used directly.

## World Rotation Computation

The `worldRot` getter multiplies quaternions up the parent chain:

```
worldRot = parentWorldRot × localRotation
```

This uses Hamilton quaternion multiplication via the `multiplyQuaternions` helper.

## Resource URL Resolution

The `resourceUrl` getter resolves the raw resource reference to a full URL:

1. Reads `pResource.sReference` and `pResource.sName` from the MVMF model
2. Combines them to form the reference path
3. Resolves against the scope's resource root URL via `resolveResourceUrl()`

Resolution handles three URL schemes:
- `action://path` → scope resource root + path
- `https://...` → passed through unchanged
- `relative/path` → scope resource root + path

## Static Methods

### Scope Resource Roots

```javascript
NodeAdapter.setScopeResourceRoot(scopeId, baseUrl)
NodeAdapter.getScopeResourceRoot(scopeId)
```

Maintains a `Map<scopeId, baseUrl>` for resolving scope-relative resource URLs. Set when a scope is connected, read when resolving resource URLs.

### Search Result Factory

```javascript
NodeAdapter.fromSearchResult(resultData)
```

Creates a lightweight stub adapter from search result data. These stubs have limited properties and are marked with `_isSearchStub = true`.

## Cache Invalidation

```javascript
node.markDirty()
```

Clears `_cachedTransform` and `_cachedBound`, forcing recomputation on next access. Called by the Model when `nodeUpdated` events arrive from the server.
