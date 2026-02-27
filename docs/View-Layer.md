# View Layer

The view layer consists of five components that subscribe to [Model events](Model-Layer.md#events) and render the application UI. Views never modify model state directly — they read from the Model and NodeAdapters, and delegate user actions back to the Model.

## View Components

| Component | File | Purpose |
|-----------|------|---------|
| [ViewGraph](#viewgraph) | `view-graph.js` | 3D force-directed graph |
| [ViewBounds](#viewbounds) | `view-bounds.js` | 3D spatial bounds visualization |
| [ViewResource](#viewresource) | `view-resource.js` | 3D model/asset viewer |
| [HierarchyPanel](#hierarchypanel) | `hierarchy-panel.js` | Tree navigation |
| [InspectorPanel](#inspectorpanel) | `inspector-panel.js` | Property inspector |

For detailed technical documentation of each view's rendering, scaling, and interaction systems, see [Views](Views.md).

## Common Pattern

All views follow the same initialization pattern:

```javascript
class SomeView {
  constructor(containerSelector, stateManager, model) {
    this.container = document.querySelector(containerSelector);
    this.model = model;
    this.stateManager = stateManager;

    // Subscribe to model events
    model.on('selectionChanged', (node) => this.selectNode(node));
    model.on('treeChanged', (tree) => this.setData(tree));
    // ... more subscriptions

    // Set up Three.js scene (for 3D views)
    this.initScene();
  }
}
```

## Event Subscription Matrix

| Event | Graph | Bounds | Resource | Inspector | Hierarchy |
|-------|:-----:|:------:|:--------:|:---------:|:---------:|
| `selectionChanged` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `treeChanged` | ✓ | ✓ | — | ✓ | ✓ |
| `expansionChanged` | ✓ | ✓ | — | — | ✓ |
| `nodeChildrenChanged` | ✓ | — | — | — | ✓ |
| `dataChanged` | ✓ | ✓ | ✓ | ✓ | — |
| `nodeUpdated` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `nodeInserted` | — | — | — | — | ✓ |
| `nodeDeleted` | — | — | — | — | ✓ |
| `nodeLoadFailed` | — | — | — | — | ✓ |
| `searchStateChanged` | — | — | — | — | ✓ |

## ViewGraph

**File**: `client/js/view-graph.js` (1012 lines)

Renders a force-directed 3D graph showing the tree hierarchy.

### How It Works

1. On `treeChanged`: Builds a flat list of graph nodes and links from the tree
2. Physics simulation runs each frame to position nodes
3. Three.js renders spheres (nodes) and lines (links)
4. On `expansionChanged`: Adds/removes nodes and links, restarts simulation
5. On `selectionChanged`: Highlights selected node and animates camera

### Key Methods

| Method | Description |
|--------|-------------|
| `setData(tree)` | Rebuilds entire graph from tree root |
| `syncGraph()` | Updates graph to match current expansion state |
| `selectNode(node)` | Highlights node, starts zoom animation |
| `zoomToNode(node)` | Animated camera move to node |
| `addChildren(parentKey, children)` | Adds expanded children to graph |
| `removeDescendants(nodeKey)` | Removes collapsed subtree from graph |

## ViewBounds

**File**: `client/js/view-bounds.js` (1884 lines)

Renders spatial bounding volumes with orbital animation. The most complex view due to astronomical scale handling.

### How It Works

1. On `treeChanged`: Collects all visible nodes, creates meshes
2. Applies logarithmic scaling for position and cube-root scaling for size
3. Animates orbital positions using Keplerian mechanics
4. Type filter controls which node types are visible
5. On `expansionChanged`: Adds/removes nodes from scene

### Key Methods

| Method | Description |
|--------|-------------|
| `setData(tree)` | Full scene rebuild from tree |
| `expandNode(node)` | Add node's children to scene |
| `collapseNode(node)` | Remove node's descendants from scene |
| `selectNode(node)` | Update focus, highlight, zoom |
| `setTypeFilter(types)` | Show only specified types |
| `setOrbitsVisible(visible)` | Toggle orbit path lines |
| `syncTypeFilterCheckboxes()` | Sync UI checkboxes with internal state |
| `resetTypeFilter()` | Restore default filter |

## ViewResource

**File**: `client/js/view-resource.js` (2094 lines)

Loads and displays 3D models (GLB) for the selected node and its expanded descendants.

### How It Works

1. On `selectionChanged`: Loads the selected node's resource
2. Fetches resource metadata JSON → determines if it's a LOD set or blueprint
3. Loads GLB via GLTFLoader (with DRACO and KTX2 support)
4. Positions sun based on geographic coordinates
5. On expansion changes: Loads additional descendant models

### Key Methods

| Method | Description |
|--------|-------------|
| `setNode(node)` | Load and display a node's 3D model |
| `clearScene()` | Remove all loaded models |
| `updateSunLighting(node)` | Position sun for geographic location |
| `setTimeOfDay(hour)` | Adjust sun position via slider |
| `setShowBounds(visible)` | Toggle bounding box wireframes |

## HierarchyPanel

**File**: `client/js/hierarchy-panel.js` (710 lines)

Renders the tree as a scrollable, expandable list.

### How It Works

1. On `treeChanged`: Builds DOM tree recursively from root
2. Each node element has toggle (▶/▼), icon (▲/●), and label
3. Click events delegate to `model.selectNode()` and `model.expandNode()`
4. On `nodeChildrenChanged`: Replaces children DOM elements
5. On `searchStateChanged`: Toggles search mode CSS class, shows matches + ancestors

### DOM Structure

```html
<div class="tree-node" data-nodeUid="fs1_earth:terrestrial:42">
  <div class="tree-node-content">
    <span class="tree-toggle">▼</span>
    <span class="tree-icon" style="color: var(--node-city)">●</span>
    <span class="tree-label">Chicago</span>
  </div>
  <div class="tree-children">
    <!-- Recursive child nodes -->
    <div class="tree-loading">Loading...</div>
  </div>
</div>
```

### Key Methods

| Method | Description |
|--------|-------------|
| `setData(tree)` | Rebuild entire tree DOM |
| `selectNode(node)` | Highlight and scroll into view |
| `expandToNode(node)` | Expand ancestors to make node visible |
| `addNode(parentNode, childNode)` | Insert child (sorted alphabetically) |
| `setChildren(parentNode, children)` | Replace all children |
| `refreshNode(node)` | Update a single node's display |

### Context Menu

Right-click (or long-press on mobile, 500ms threshold) opens a context menu with:
- **Expand Level**: Calls `model.expandLevel(node)` — expands immediate children
- **Collapse All**: Calls `model.collapseAllDescendants(node)` — recursively collapses

## InspectorPanel

**File**: `client/js/inspector-panel.js` (500 lines)

Displays detailed information about the selected node.

### How It Works

1. On `selectionChanged`: Reads node properties and renders sections
2. Collapsible sections persist their open/closed state via UIStateManager
3. Raw JSON and Resource sections load on demand

### Sections

| Section | Data Source | Details |
|---------|-----------|---------|
| Basic Info | `node.name`, `node.nodeType`, `node.id` | Type color dot |
| Location | `calculateLatLong(node.worldPos, radius)` | Only shown if on a planet |
| Transform | `node.transform` | Position, rotation (quat), scale |
| Bounds | `node.bound` | Size as {x, y, z} |
| Raw JSON | `node._model` (raw MVMF data) | Collapsible, with copy button |
| Resource | `NodeFactory.getResourceData(node)` | Collapsible, loaded on demand |

### Key Methods

| Method | Description |
|--------|-------------|
| `showNode(node)` | Render all sections for the node |
| `clear()` | Clear the panel |

## Layout Manager

**File**: `client/js/layout.js` (556 lines)

Manages the panel layout, resizing, and view toggling.

### Responsibilities

- **Panel resizing**: Draggable borders between hierarchy, viewport, and inspector panels (150–500px range)
- **View toggling**: Enable/disable Graph, Bounds, Resource views
- **Keyboard shortcuts**: Ctrl+1/2/3 for view toggles
- **Multi-view layout**: Applies CSS classes for split (2 views) or triple (3 views) layout
- **Panel minimize/restore**: Collapse panels to header bar only
- **URL history**: Maintains a dropdown of 10 recent MSF URLs
- **Status bar**: Connection status display
- **Follow Link button**: Shows/hides based on selected node's MSF reference

### Key Methods

| Method | Description |
|--------|-------------|
| `restoreState()` | Load layout state from UIStateManager |
| `setUrl(url)` | Set the URL input field value |
| `setFollowLink(url)` | Show/hide the Follow Link button |
| `setStatus(message, type)` | Update status bar (`connected`/`disconnected`/`loading`) |
| `onLoad(callback)` | Register handler for the Load button |
