# API Reference

Complete class and method reference for Manifolder's JavaScript modules.

---

## App

**File**: `client/js/app.js`

The application orchestrator. Creates all components and wires them together.

### Constructor

```javascript
new App()
```

Creates UIStateManager, ManifolderClient, Model, all Views, BookmarkManager, and calls `init()`.

### Methods

| Method | Description |
|--------|-------------|
| `init()` | Wires up events, restores state, checks URL params |
| `handleLoadMap(url, options?)` | Connect to Fabric, build tree, restore state. Options: `{ skipStateRestore: boolean }` |
| `restoreNodePath(path)` | Traverse ancestry path to restore selection |
| `updateTypeFilter(dropdown)` | Read checkbox states and apply to Bounds view |
| `updateRP1GoButton(node)` | Show/hide Go To button based on geographic data |
| `checkUrlForSharedState()` | Check `?msf=` and `?loc=` URL params |
| `renderBookmarkList(container)` | Render bookmark dropdown items |
| `startBookmarkEdit(item, bookmark)` | Inline rename UI for a bookmark |

---

## Model

**File**: `client/js/model.js`

Central state manager. Single source of truth.

### Constructor

```javascript
new Model(client)
```

- `client` — ManifolderClient instance

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `tree` | `NodeAdapter` | Root of current tree |
| `selectedNode` | `NodeAdapter` | Currently selected node |
| `nodes` | `Map<string, NodeAdapter>` | All indexed nodes |
| `rootScopeId` | `string` | Active root scope ID |
| `searchActive` | `boolean` | Whether search mode is on |
| `searchTerm` | `string` | Current search text |
| `inheritedPlanetContext` | `object` | Planet context for child scopes |

### Event Methods

| Method | Description |
|--------|-------------|
| `on(event, handler)` | Subscribe to event |
| `off(event, handler)` | Unsubscribe from event |

### Tree Methods

| Method | Parameters | Description |
|--------|-----------|-------------|
| `setTree(rootModel, planetContext, scopeId)` | MVMF model, planet data, scope ID | Initialize tree from server data |
| `setChildren(parentNode, children)` | NodeAdapter, MVMF model[] | Set node's children |
| `getNode(key)` | `string` | Lookup by nodeUid |
| `getNode(type, id, scopeId?)` | `string`, `number`, `string?` | Lookup by type + id |
| `getPathToNode(node)` | `NodeAdapter` | Get ancestry chain to root |
| `nodeKey(node)` | `NodeAdapter` | Get node's index key |
| `getPlanetContext(node)` | `NodeAdapter` | Get planetary metadata |

### Selection Methods

| Method | Parameters | Description |
|--------|-----------|-------------|
| `selectNode(node)` | `NodeAdapter` | Change selection |
| `getSelectedNode()` | — | Get current selection |

### Expansion Methods

| Method | Parameters | Description |
|--------|-----------|-------------|
| `expandNode(node)` | `NodeAdapter` | Expand and load children |
| `collapseNode(node)` | `NodeAdapter` | Collapse and detach children |
| `isNodeExpanded(node)` | `NodeAdapter` | Query expansion state |
| `expandLevel(node)` | `NodeAdapter` | Expand immediate children |
| `expandAllDescendants(node)` | `NodeAdapter` | Recursively expand all |
| `collapseAllDescendants(node)` | `NodeAdapter` | Recursively collapse all |
| `getExpandedNodeKeys()` | — | Get all expanded keys (including pending) |
| `expandNodesByKeys(keys)` | `string[]` | Restore expansion from saved state |
| `addPendingExpandedKey(key)` | `string` | Register key for deferred expansion |

### Search Methods

| Method | Parameters | Description |
|--------|-----------|-------------|
| `search(searchText)` | `string` | Execute local + server search |
| `clearSearch()` | — | Clear search flags and state |
| `setSearchActive(active, term)` | `boolean`, `string` | Toggle search mode |

### Events Emitted

See [Model Layer — Events](Model-Layer.md#events) for the full event reference.

---

## NodeAdapter

**File**: `client/js/node-adapter.js`

Wraps raw MVMF model objects with normalized computed properties.

### Constructor

```javascript
new NodeAdapter(mvmfModel, scopeId)
```

### Computed Properties

| Property | Type | Description |
|----------|------|-------------|
| `type` | `string` | MVMF class type |
| `id` | `number` | Numeric ID |
| `nodeUid` | `string` | `scopeId:prefix:id` |
| `key` | `string` | Alias for nodeUid |
| `name` | `string` | Human-readable name |
| `nodeType` | `string` | Resolved type name |
| `fabricScopeId` | `string` | Scope identifier |
| `transform` | `{position, rotation, scale}` | Normalized local transform |
| `bound` | `{x, y, z}` | Bounding half-extents |
| `worldPos` | `{x, y, z}` | World-space position |
| `worldRot` | `{x, y, z, w}` | World-space rotation |
| `resourceUrl` | `string\|null` | Resolved resource URL |
| `resourceRef` | `string\|null` | Raw resource reference |
| `isReady` | `boolean` | Model fully loaded |
| `orbit` | `object\|null` | Orbital parameters |
| `children` | `NodeAdapter[]` | Child adapters |

### Instance Methods

| Method | Description |
|--------|-------------|
| `markDirty()` | Clear cached transform/bound |

### Static Methods

| Method | Parameters | Description |
|--------|-----------|-------------|
| `setScopeResourceRoot(scopeId, url)` | `string`, `string` | Set resource base URL for scope |
| `getScopeResourceRoot(scopeId)` | `string` | Get resource base URL |
| `fromSearchResult(data)` | `object` | Create stub adapter from search result |

---

## NodeFactory

**File**: `client/js/node-factory.js`

Loads and processes resource metadata.

### Static Methods

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `getResourceData(node)` | `NodeAdapter` | `Promise<object\|null>` | Fetch and cache resource JSON. Handles LOD metadata and blueprint resources. |

---

## ViewGraph

**File**: `client/js/view-graph.js`

Force-directed 3D graph view.

### Constructor

```javascript
new ViewGraph(containerSelector, stateManager, model)
```

### Methods

| Method | Parameters | Description |
|--------|-----------|-------------|
| `setData(tree)` | `NodeAdapter` | Rebuild graph from tree |
| `syncGraph()` | — | Sync graph with current expansion state |
| `selectNode(node)` | `NodeAdapter` | Highlight node |
| `zoomToNode(node)` | `NodeAdapter` | Animated camera move |
| `addChildren(parentKey, children)` | `string`, `NodeAdapter[]` | Add expanded children |
| `removeDescendants(nodeKey)` | `string` | Remove collapsed subtree |
| `onMsfLoad(callback)` | `function` | Register MSF load handler |

---

## ViewBounds

**File**: `client/js/view-bounds.js`

3D spatial bounds visualization with orbital animation.

### Constructor

```javascript
new ViewBounds(containerSelector, stateManager, model)
```

### Methods

| Method | Parameters | Description |
|--------|-----------|-------------|
| `setData(tree)` | `NodeAdapter` | Full scene rebuild |
| `expandNode(node)` | `NodeAdapter` | Add children to scene |
| `collapseNode(node)` | `NodeAdapter` | Remove descendants from scene |
| `selectNode(node)` | `NodeAdapter` | Update focus and highlight |
| `zoomToNode(node)` | `NodeAdapter` | Animated camera move |
| `setTypeFilter(types)` | `string[]` | Show only specified types |
| `resetTypeFilter()` | — | Restore default filter |
| `setOrbitsVisible(visible)` | `boolean` | Toggle orbit path lines |
| `syncTypeFilterCheckboxes()` | — | Sync UI checkboxes with state |
| `onMsfLoad(callback)` | `function` | Register MSF load handler |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `orbitsVisible` | `boolean` | Current orbit visibility state |

---

## ViewResource

**File**: `client/js/view-resource.js`

3D model/asset viewer.

### Constructor

```javascript
new ViewResource(containerSelector, stateManager, model)
```

### Methods

| Method | Parameters | Description |
|--------|-----------|-------------|
| `setNode(node)` | `NodeAdapter` | Load and display node's 3D model |
| `clearScene()` | — | Remove all loaded models |
| `updateSunLighting(node)` | `NodeAdapter` | Position sun for node's location |
| `setTimeOfDay(hour)` | `number` | Adjust sun position (0–24) |
| `setShowBounds(visible)` | `boolean` | Toggle bounding box wireframes |

---

## HierarchyPanel

**File**: `client/js/hierarchy-panel.js`

Tree navigation panel.

### Constructor

```javascript
new HierarchyPanel(containerSelector, model)
```

### Methods

| Method | Parameters | Description |
|--------|-----------|-------------|
| `setData(tree)` | `NodeAdapter` | Rebuild entire tree DOM |
| `selectNode(node)` | `NodeAdapter` | Highlight and scroll into view |
| `expandToNode(node)` | `NodeAdapter` | Expand ancestors to reveal node |
| `addNode(parentNode, childNode)` | `NodeAdapter`, `NodeAdapter` | Insert child (sorted) |
| `setChildren(parentNode, children)` | `NodeAdapter`, `NodeAdapter[]` | Replace all children |
| `refreshNode(node)` | `NodeAdapter` | Update single node display |
| `onZoom(callback)` | `function` | Register double-click zoom handler |

---

## InspectorPanel

**File**: `client/js/inspector-panel.js`

Property inspector panel.

### Constructor

```javascript
new InspectorPanel(containerSelector, stateManager, model)
```

### Methods

| Method | Parameters | Description |
|--------|-----------|-------------|
| `showNode(node)` | `NodeAdapter` | Render all sections for node |
| `clear()` | — | Clear the panel |

---

## LayoutManager

**File**: `client/js/layout.js`

Panel layout, resizing, and view toggling.

### Constructor

```javascript
new LayoutManager(stateManager)
```

### Methods

| Method | Parameters | Description |
|--------|-----------|-------------|
| `restoreState()` | — | Load layout state from UIStateManager |
| `setUrl(url)` | `string` | Set URL input field value |
| `setFollowLink(url)` | `string\|null` | Show/hide Follow Link button |
| `setStatus(message, type)` | `string`, `string` | Update status bar. Type: `connected`, `disconnected`, `loading` |
| `onLoad(callback)` | `function` | Register Load button handler |

---

## UIStateManager

**File**: `client/js/ui-state-manager.js`

UI state persistence via localStorage.

### Constructor

```javascript
new UIStateManager()
```

### Methods

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `getFullState()` | — | `object` | Get complete state snapshot |
| `getSection(name)` | `string` | `object` | Get specific state section |
| `updateSection(name, data)` | `string`, `object` | — | Merge data into section and save |
| `applyFullState(state, app)` | `object`, `App` | `Promise<boolean>` | Restore full UI state |
| `migrate(state)` | `object` | `object` | Run version migrations |
| `mergeWithDefaults(state)` | `object` | `object` | Fill missing keys with defaults |
| `resetAndReload()` | — | — | Clear localStorage and reload |

---

## BookmarkManager

**File**: `client/js/bookmark-manager.js`

Bookmark save/load/share functionality.

### Constructor

```javascript
new BookmarkManager(stateManager)
```

### Methods

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `save(name)` | `string` | `object` | Save current state as bookmark |
| `load(id)` | `string` | `object\|null` | Load bookmark state by ID |
| `rename(id, newName)` | `string`, `string` | `boolean` | Rename a bookmark |
| `delete(id)` | `string` | `boolean` | Delete a bookmark |
| `list()` | — | `object[]` | List all bookmarks (summary) |
| `applyState(state, app)` | `object`, `App` | `Promise<boolean>` | Apply bookmark state |
| `encodeStateToUrl()` | — | `string` | Create shareable URL |
| `decodeStateFromUrl(search)` | `string` | `object\|null` | Decode shared URL |

### Static Properties

| Property | Value | Description |
|----------|-------|-------------|
| `SHARE_VERSION` | `2` | Current share format version |
| `SHARE_URL_BUDGET` | `2000` | Max URL length |
| `TYPE_CODES` | `object` | MVMF class → single char code |
| `CODE_TYPES` | `object` | Single char code → MVMF class |
| `PREFIX_CODES` | `object` | Prefix → single char code |
| `FILTER_TYPES` | `string[]` | All 29 type names in order |

---

## Geo Utilities

**File**: `client/js/geo-utils.js`

Geographic calculation functions.

| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `calculateLatLong(worldPos, surfaceRadius)` | `{x,y,z}`, `number` | `{latitude, longitude}\|null` | Convert world position to lat/long (Y-up, planet-centered). Returns null if position is >2% from surface. |
| `formatLatLong(lat, lon)` | `number`, `number` | `string` | Format as "47.2345°N, 2.3456°W" |
| `calculateSunPosition(lat, lon, date?)` | `number`, `number`, `Date?` | `{azimuth, elevation}` | Solar position in degrees. Azimuth: 0=N, 90=E. |
| `getSunLightingParams(elevation)` | `number` | `object` | Light color and intensity for solar elevation |

---

## Orbital Helpers

**File**: `client/js/orbital-helpers.js`

Orbital mechanics functions.

| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `getOrbitData(node)` | `NodeAdapter` | `object\|null` | Extract orbit parameters from node properties |
| `calculateOrbitalPosition(orbitData, time)` | `object`, `number` | `{x, y, z}` | Position on ellipse at simulation time |
| `getSpinData(node)` | `NodeAdapter` | `object\|null` | Extract rotation/spin data |
| `calculateSpinAngle(spinData, time)` | `object`, `number` | `number` | Rotation angle at time |
| `createOrbitPathGeometry(orbitData)` | `object` | `BufferGeometry` | Three.js ellipse geometry for orbit line |

---

## Node Helpers

**File**: `client/lib/ManifolderClient/node-helpers.js`

Resource URL resolution and quaternion math.

| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `setResourceBaseUrl(url)` | `string` | — | Set global resource base URL |
| `getResourceBaseUrl()` | — | `string\|null` | Get current resource base URL |
| `resolveResourceUrl(ref, baseUrl?)` | `string`, `string?` | `string\|null` | Resolve resource reference to full URL |
| `getMsfReference(node)` | `NodeAdapter` | `Promise<string\|null>` | Get MSF URL from node resource (if applicable) |
| `rotateByQuaternion(px,py,pz, qx,qy,qz,qw)` | 7 numbers | `{x,y,z}` | Rotate point by quaternion |
| `multiplyQuaternions(q1, q2)` | 2 quaternions | `{x,y,z,w}` | Hamilton quaternion multiply |

---

## Scene Helpers

**File**: `client/js/scene-helpers.js`

Shared Three.js utility functions.

| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `createInfiniteGrid()` | — | `Mesh` | Shader-based infinite ground plane |
| `createSkyDome(horizonColor?, zenithColor?)` | hex?, hex? | `Mesh` | Gradient sky hemisphere |
| `createStarfield(count?)` | `number?` | `Points` | Star particle system (default 3000 at 80km) |
| `createLabelSprite(text, options?)` | `string`, `object?` | `Sprite` | Canvas-rendered text label |

---

## node-types.js

**File**: `client/shared/node-types.js`

Single source of truth for node type definitions.

### Exports

| Export | Type | Description |
|--------|------|-------------|
| `CELESTIAL_TYPE_MAP` | `object` | bType number → type name (1–17) |
| `TERRESTRIAL_TYPE_MAP` | `object` | bType number → type name (1–11) |
| `PHYSICAL_TYPE` | `string` | `"Physical"` |
| `NODE_TYPES` | `array` | All types with `{name, color, cssVar, category}` |
| `NODE_COLORS` | `object` | Type name → hex color (includes RM-class fallbacks) |
| `CELESTIAL_NAMES` | `Set<string>` | Set of all celestial type names |
| `PHYSICAL_NAMES` | `Set<string>` | Set of all physical type names |
| `generateNodeTypeStylesheet()` | `function` | Returns CSS string with variables and tree-icon rules |
