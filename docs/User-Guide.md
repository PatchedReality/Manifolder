# User Guide

Manifolder provides a three-panel layout for exploring Spatial Fabric hierarchies:

```
┌─────────────────────────────────────────────────────────────────┐
│                           Toolbar                               │
├───────────┬─────────────────────────────────┬───────────────────┤
│           │                                 │                   │
│ Hierarchy │           Viewport              │     Inspector     │
│   Panel   │    (Graph / Bounds / Resource)  │       Panel       │
│           │                                 │                   │
├───────────┴─────────────────────────────────┴───────────────────┤
│                          Status Bar                             │
└─────────────────────────────────────────────────────────────────┘
```

## Toolbar

The toolbar runs across the top of the application.

### Loading Maps

1. Enter an MSF (Metaverse Spatial Fabric) URL in the input field
2. Click **Load** (or press Enter)
3. The status bar shows connection progress

The **URL History** dropdown (▾) shows recently loaded URLs for quick re-loading.

### Follow Link

When the selected node has an attachment (a reference to another MSF file), the **Follow Link** button appears. Clicking it loads the linked MSF, displaying its content as a child scope within the current tree.

### Bookmarks

- **★ (Add Bookmark)**: Saves the current view state — map URL, selected node, expanded nodes, and view settings — as a named bookmark
- **▼ (Bookmarks dropdown)**: Lists saved bookmarks. Click one to restore that state. Use ✎ to rename or × to delete.

### Share

The **↗ (Share)** button copies a URL to the clipboard that encodes the current view state. Anyone who opens that URL will see the same map, selection, expansion state, and view filter settings.

Shared URLs use pako compression to keep them compact. If the full state exceeds the URL budget (2000 characters), the encoder progressively drops expansion state, type filters, and orbit settings.

### Go To (RP1)

For Earth-based maps, the **Go To→** button opens the selected location in the [RP1 metaverse client](https://enter.rp1.com). This is only visible when the selected node has geographic coordinates.

### Reset View

Clears all saved state (localStorage) and reloads the application from scratch.

---

## Hierarchy Panel (Left)

The hierarchy panel displays the node tree with expand/collapse navigation.

### Tree Navigation

- **Click a node** to select it (updates all views and the Inspector)
- **Click the arrow** (▶/▼) to expand or collapse a node
- **Double-click** a node to expand it and zoom to it in the active view

### Node Icons

Nodes are identified by shape and color:
- **▲ Triangle**: Celestial objects (Universe, Galaxy, Star, Planet, etc.)
- **● Circle**: Terrestrial objects (Land, Country, City, Parcel, etc.)
- **■ Square**: Physical objects

Colors are assigned per node type (see [Data Model](Data-Model.md) for the full type list).

### Search

Type in the search box to filter the tree. Search matches are highlighted, and ancestor nodes along the path to each match are shown to maintain tree context. The search queries both local (already-loaded) nodes and the server.

Press **Escape** or click **✕** to clear the search.

### Context Menu

Right-click a node (or long-press on mobile) for additional options:

- **Expand Level**: Expands one level deeper across all currently expanded branches of the selected node
- **Collapse All**: Recursively collapses the selected node and all its descendants

### Loading States

- **"Loading..."** appears when node children are being fetched from the server
- **"Loading attachment..."** appears when following an attachment link to a child scope
- **"Load failed — click to retry"** appears on error; click to retry

---

## Viewport Panel (Center)

The viewport hosts up to three visualization modes that can be enabled simultaneously.

### How Selection and Expansion Affect Views

Selection and hierarchy expansion control what each view displays:

- **Selection is synchronized**: Selecting a node in any panel updates all other panels
- **Graph View**: Shows the entire loaded tree. Expanding nodes in the hierarchy adds them to the graph
- **Bounds View**: Shows 3D spatial bounds for expanded nodes (filtered by the Type Filter)
- **Resource View**: Shows 3D models for the selected node and its expanded descendants

### Common 3D Controls

All three views share the same camera controls:

| Action | Mouse | Touch |
|--------|-------|-------|
| Orbit/Rotate | Left-click drag | One-finger drag |
| Zoom | Scroll wheel | Pinch |
| Pan | Right-click drag | Two-finger drag |
| Select | Left-click | Tap |
| Focus/Zoom-to | Double-click | Double-tap |

### Graph View

A 3D force-directed graph showing node relationships. Nodes are rendered as spheres, connected by lines showing parent-child relationships. The physics simulation positions nodes to minimize overlap while maintaining hierarchy structure.

- Nodes are colored by type
- Labels appear as sprites
- The selected node gets a white wireframe highlight
- Double-clicking an unexpanded node expands it; double-clicking a leaf node with an MSF resource prompts to load it

### Bounds View

A 3D spatial visualization showing bounding volumes:

- **Celestial objects**: Rendered as spheres with surface textures when available
- **Terrestrial objects**: Rendered as bounding boxes
- **Orbital paths**: Elliptical lines showing trajectories
- **Labels**: Sprite-based, scaling with distance

#### Bounds-Specific Controls

- **Time Scale**: A slider controlling orbital animation speed, from Paused to 1 year/second (8 presets)
- **Type Filter**: Toggle visibility of specific node types by category (Celestial, Terrestrial, Physical), with an Orbits toggle
- **Orbits**: Checkbox to show/hide orbital path lines

The Bounds view uses logarithmic scaling to make astronomical distances viewable in a single scene. See [Views](Views.md) for technical details on the scaling system.

### Resource View

A 3D model viewer for GLB assets linked to nodes:

- Loads and displays GLTF Binary (GLB) 3D models
- Supports blueprint hierarchies with nested objects
- Automatic LOD (Level of Detail) selection
- Video textures via HLS streaming
- Rotator animations from configuration data
- Point lights and text sprites from blueprint data

#### Resource-Specific Controls

- **Grid**: An adaptive grid that scales based on loaded content
- **Show Bounds**: Toggle bounding volume wireframes for loaded models
- **Time of Day**: A slider to adjust sun position for realistic lighting (visible for Earth-based nodes)

The Time of Day control calculates sun position based on the node's geographic coordinates using a simplified solar position algorithm.

### Multi-View Layout

Toggle views using the buttons above the viewport, or keyboard shortcuts:

| Shortcut | View |
|----------|------|
| `Ctrl/Cmd + 1` | Toggle Graph |
| `Ctrl/Cmd + 2` | Toggle Bounds |
| `Ctrl/Cmd + 3` | Toggle Resource |

When multiple views are enabled, they appear side-by-side (split view for 2, triple view for 3). At least one view is always active.

---

## Inspector Panel (Right)

Shows detailed information about the selected node:

### Sections

- **Basic Info**: Name, type (with color indicator), class, and numeric ID
- **Location**: Latitude/longitude coordinates (shown for nodes on a planet with a known radius)
- **Transform**: Position (x, y, z), rotation (quaternion), and scale vectors
- **Bounds**: Spatial dimensions (width, height, depth)
- **Raw JSON**: Expandable section showing the complete raw node data. Click 📋 to copy to clipboard.
- **Resource**: Expandable section showing linked resource metadata (if the node has a resource reference). File links in the data are clickable.

---

## Panel Management

- **Resize**: Drag the borders between panels to adjust widths (150–500px range)
- **Minimize**: Click the **−** button in a panel header to collapse it to just the header bar
- **Restore**: Click the restore button to re-expand a minimized panel

All panel sizes and states persist across sessions via localStorage.

---

## URL Parameters

| Parameter | Description |
|-----------|-------------|
| `?msf=<url>` | Load a specific MSF file on startup. The parameter is consumed after loading. |
| `?loc=<encoded>` | Encoded shared state (generated by the Share button). Contains map URL, selection, expansion, and view settings. |

---

## Mobile Support

Manifolder works on mobile devices with some adaptations:

- **Touch gestures**: Pinch to zoom, drag to orbit, tap to select
- **Long-press**: Opens the context menu (equivalent to right-click)
- **Responsive layout**: Panels use horizontal scrolling on narrow screens
