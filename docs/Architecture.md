# Architecture

Manifolder follows a strict **Model-View-Controller (MVC)** pattern with event-driven communication between layers.

## High-Level Overview

```
┌──────────────────────────────────────────────────────────────┐
│                     Fabric Server (MVMF)                     │
└─────────────────────────────┬────────────────────────────────┘
                              │ Socket.io
┌─────────────────────────────▼────────────────────────────────┐
│                  ManifolderClient (Adapter)                  │
│     Translates MVMF notifications → high-level events        │
└─────────────────────────────┬────────────────────────────────┘
                              │ Events: nodeInserted, nodeUpdated,
                              │         nodeDeleted, modelReady
┌─────────────────────────────▼────────────────────────────────┐
│                        Model (State)                         │
│        Tree structure, selection, expansion, search          │
│        Wraps raw data via NodeAdapter                        │
└─────────────────────────────┬────────────────────────────────┘
                              │ Events: selectionChanged, treeChanged,
                              │         expansionChanged, dataChanged, ...
      ┌───────────┬───────────┼───────────┬───────────┐
      │           │           │           │           │
┌─────▼─────┐ ┌──▼────┐ ┌────▼────┐ ┌────▼─────┐ ┌──▼───────┐
│   Graph   │ │Bounds │ │Resource │ │Hierarchy │ │Inspector │
│   View    │ │ View  │ │  View   │ │  Panel   │ │  Panel   │
└───────────┘ └───────┘ └─────────┘ └──────────┘ └──────────┘
```

## Core Principles

### 1. Model is the Single Source of Truth

All application state lives in the Model. Views and panels never maintain their own copies of tree structure, selection, or expansion state. When they need data, they read it from the Model or from NodeAdapter properties on the nodes themselves.

### 2. State Lives on Objects

State belongs on the objects themselves, not in separate tracking collections.

**Correct** — expansion state on the node:
```javascript
node.isExpanded = true;
```

**Incorrect** — parallel tracking collection:
```javascript
this._expandedNodes = new Set();
this._expandedNodes.add(node);
```

This applies to: expansion state, search match flags, loading state, attachment mounts.

### 3. Event-Driven Updates

Views subscribe to Model events and react to changes. They never call each other directly.

```javascript
// View subscribes to model
model.on('selectionChanged', (node) => {
  this.highlightNode(node);
  this.zoomToNode(node);
});

// Model emits when state changes
model.selectNode(someNode);
// → triggers selectionChanged
// → all views update independently
```

### 4. Unidirectional Data Flow

User actions flow in one direction:

```
User Action → View Handler → Model Method → Model Event → View Update
```

For server-initiated changes:

```
Server Notification → ManifolderClient Event → Model Handler → Model Event → View Update
```

Views never modify the Model directly or communicate with each other.

## Component Responsibilities

### App (`app.js`)

The orchestrator. Creates all components, wires up events between them, handles map loading, and manages state restoration.

| Responsibility | Description |
|----------------|-------------|
| Initialization | Creates Model, Views, Panels, Managers |
| Event wiring | Connects Model events to cross-cutting concerns |
| Map loading | `handleLoadMap()` — connects to Fabric, creates tree |
| State restoration | Restores expansion/selection from saved state |
| UI setup | Configures search, type filter, bookmarks, share |

### Model (`model.js`)

The single source of truth for application state. Subscribes to ManifolderClient events and emits events to Views.

See [Model Layer](Model-Layer.md) for full documentation.

### NodeAdapter (`node-adapter.js`)

Wraps raw MVMF model objects with computed properties. All node data access goes through NodeAdapter.

See [Node Adapter](Node-Adapter.md) for full documentation.

### ManifolderClient (`lib/ManifolderClient/`)

The communication adapter between Manifolder and MVMF Fabric servers. Handles Socket.io connections, MVMF SDK interactions, and translates low-level notifications into high-level events.

See [ManifolderClient](ManifolderClient.md) for full documentation.

### Views

Each view subscribes to Model events and maintains only rendering state (Three.js objects, DOM elements).

See [View Layer](View-Layer.md) for full documentation.

### UIStateManager (`ui-state-manager.js`)

Persists UI-specific state (panel sizes, view toggles, expansion IDs) to localStorage. Separate from the Model to maintain MVC separation — the Model holds application state, UIStateManager holds presentation state.

See [State Persistence](State-Persistence.md) for full documentation.

### BookmarkManager (`bookmark-manager.js`)

Saves, loads, and shares complete view snapshots. Uses pako compression for URL encoding.

See [Bookmarks & Sharing](Bookmarks-and-Sharing.md) for full documentation.

## File Dependency Graph

```
app.js
├── model.js
│   └── (subscribes to) ManifolderClient
├── node-adapter.js
├── view-graph.js ──────────┐
├── view-bounds.js ─────────┤ (all subscribe to model.js)
├── view-resource.js ───────┤
├── hierarchy-panel.js ─────┤
├── inspector-panel.js ─────┘
├── layout.js
├── ui-state-manager.js
├── bookmark-manager.js
├── geo-utils.js
└── shared/node-types.js
```

## Initialization Sequence

1. `DOMContentLoaded` fires
2. `App` constructor runs:
   - Injects node type CSS stylesheet
   - Creates `UIStateManager`
   - Creates `ManifolderClient` (Socket.io client)
   - Creates `Model` (subscribes to client events)
   - Creates all Views and Panels (subscribe to model events)
   - Creates `BookmarkManager`
3. `App.init()`:
   - Wires up cross-cutting event handlers
   - Restores layout state from localStorage
   - Checks URL for `?msf=` or `?loc=` parameters
4. If a map URL is found (from URL params or saved state):
   - `handleLoadMap()` connects to Fabric server
   - Model builds tree from received data
   - Views render initial state
   - Saved expansion/selection is restored

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Language | Vanilla JavaScript (ES modules) |
| 3D Rendering | Three.js v0.160.0 |
| Real-time Communication | Socket.io (via ManifolderClient) |
| Bundler | esbuild |
| Video Streaming | HLS.js |
| Compression | pako (for URL sharing) |
| Styling | CSS with custom properties |
| Storage | localStorage |
| Fonts | Inter (UI), JetBrains Mono (code) |
