# State Persistence

**File**: `client/js/ui-state-manager.js`

Manifolder persists UI state across sessions using localStorage. The UIStateManager handles saving, loading, migrating, and applying state.

## State Structure

```javascript
{
  version: 2,
  navigation: {
    mapUrl: "https://cdn2.rp1.com/config/enter.msf",
    selectedNodePath: [
      { nodeUid: "scope1:root:0", type: "RMRoot", id: 0 },
      { nodeUid: "scope1:celestial:1", type: "RMCObject", id: 1 },
      // ... path from root to selected node
    ]
  },
  layout: {
    hierarchyWidth: 285,
    inspectorWidth: 280,
    hierarchyMinimized: false,
    inspectorMinimized: false,
    graphEnabled: true,
    boundsEnabled: true,
    resourceEnabled: true
  },
  hierarchy: {
    expandedNodeIds: [
      { nodeUid: "scope1:root:0", parentNodeUid: null },
      { nodeUid: "scope1:celestial:1", parentNodeUid: "scope1:root:0" },
      // ... all expanded nodes with their parents
    ]
  },
  inspector: {
    showRawJson: false,
    showResource: false
  },
  viewBounds: {
    typeFilter: ["Universe", "Galaxy", "Star", "Planet", ...],
    timeScaleIndex: 0,
    orbitsVisible: true
  },
  viewResource: {
    showBounds: false
  }
}
```

## localStorage Keys

| Key | Content |
|-----|---------|
| `mv-ui-state` | Main UI state (structure above) |
| `mv-bookmarks` | Saved bookmarks array |
| `mv-url-history` | Recent MSF URLs |

## Operations

### Loading State

```javascript
const stateManager = new UIStateManager();
// Automatically loads from localStorage on construction
```

State is merged with defaults, so missing keys get default values.

### Saving State

```javascript
stateManager.updateSection('hierarchy', {
  expandedNodeIds: model.getExpandedNodeKeys()
});
```

Each `updateSection` call merges the data into the specified section and writes to localStorage immediately.

### Getting State

```javascript
const fullState = stateManager.getFullState();
const section = stateManager.getSection('navigation');
```

### Applying Full State (Bookmarks / Shared Links)

```javascript
await stateManager.applyFullState(state, app);
```

This restores the complete UI state:
1. Loads the map URL (if different from current)
2. Restores layout (panel widths, view toggles)
3. Restores view settings (type filter, orbits, time scale)
4. Restores expansion state
5. Restores selection

### Reset

```javascript
stateManager.resetAndReload();
```

Clears localStorage and reloads the page.

## State Migration

State has a version field to support schema changes. The current version is 2.

### v1 → v2 Migration

Version 1 used legacy node keys (e.g., `RMCObject_42`). Version 2 uses scope-aware UIDs (e.g., `fs1_earth:celestial:42`).

The migration process:
1. Detects `version: 1` (or missing version)
2. Converts `selectedNodePath` entries from `{type, id}` to `{nodeUid, type, id}`
3. Converts `expandedNodeIds` from `{key: "RMCObject_42", parent: "RMRoot_0"}` to `{nodeUid: "scope:celestial:42", parentNodeUid: "scope:root:0"}`
4. Infers the scope ID from available data
5. Sets `version: 2`

Migration runs automatically on load and when applying bookmarks.

## Node UID Format

State entries reference nodes using scope-aware UIDs:

```
{scopeId}:{prefix}:{numericId}
```

Example: `fs1_earth:terrestrial:42`

Components:
- **scopeId**: Identifies the Fabric scope (e.g., `fs1_earth`)
- **prefix**: Node category (`root`, `celestial`, `terrestrial`, `physical`)
- **numericId**: The node's numeric ID within its scope

### Normalization

The manager normalizes various key formats:
- Modern UIDs: `scope:prefix:id` → used as-is
- Legacy keys: `RMCObject_42` → converted to `scope:celestial:42` (scope inferred)
- Object entries: `{type: "RMCObject", id: 42}` → converted to UID

## Integration with Other Components

### App

The App saves state on these events:
- **Selection change** → saves `navigation.selectedNodePath`
- **Expansion change** → saves `hierarchy.expandedNodeIds`
- **Map loaded** → saves `navigation.mapUrl`

During initialization, the App restores state:
1. Loads saved map URL
2. After tree loads, restores expansion from saved keys
3. Restores selection via path traversal

### Layout Manager

Saves on:
- Panel resize → `layout.hierarchyWidth`, `layout.inspectorWidth`
- Panel minimize/restore → `layout.hierarchyMinimized`, `layout.inspectorMinimized`
- View toggle → `layout.graphEnabled`, `layout.boundsEnabled`, `layout.resourceEnabled`

### Views

- **Bounds view**: Saves/restores type filter, time scale index, orbits visibility
- **Resource view**: Saves/restores show-bounds toggle
- **Inspector**: Saves/restores raw JSON and resource section collapse states
