# Model Layer

**File**: `client/js/model.js`

The Model is the single source of truth for all application state. It maintains the node tree, tracks selection and expansion, processes server events, and emits events that views subscribe to.

## Events

The Model emits 12 event types:

| Event | Payload | When |
|-------|---------|------|
| `treeChanged` | `(tree)` | New tree root set (map loaded) |
| `nodeChildrenChanged` | `(parentNode)` | A node's children list changed |
| `nodeUpdated` | `(node)` | A node's properties changed |
| `nodeInserted` | `({node, parentNode})` | New node added to tree |
| `nodeDeleted` | `({node, parentNode})` | Node removed from tree |
| `nodeLoadFailed` | `(node)` | Node failed to load from server |
| `dataChanged` | — | Debounced batch signal after any data change |
| `selectionChanged` | `(selectedNode, previousNode)` | Selected node changed |
| `expansionChanged` | `(node, isExpanded)` | Node expanded or collapsed |
| `disconnected` | — | Server connection lost |
| `searchStateChanged` | `(active, term)` | Search mode toggled |
| `searchResultsUpdated` | — | Search results ready to display |

### Subscribing to Events

```javascript
model.on('selectionChanged', (node, previousNode) => {
  // React to selection change
});

model.on('treeChanged', (tree) => {
  // Full tree replacement — rebuild everything
});
```

Use `model.off(event, handler)` to unsubscribe.

### The `dataChanged` Event

`dataChanged` is a debounced "something changed" signal. It fires after a `setTimeout(0)` delay, batching multiple rapid changes into one event. Views that need to do expensive operations (like rebuilding 3D scenes) listen to this instead of reacting to every individual change.

## Core State

```javascript
model.tree              // Root NodeAdapter
model.selectedNode      // Currently selected NodeAdapter
model.nodes             // Map<key, NodeAdapter> — indexed for O(1) lookups
model.rootScopeId       // Active scope ID
model.searchActive      // Whether search is active
model.searchTerm        // Current search text
```

## Tree Management

### Setting the Tree

```javascript
model.setTree(rootMvmfModel, planetContext, scopeId)
```

Called when a new map is loaded. Creates a NodeAdapter for the root, indexes it, and emits `treeChanged`.

The optional `planetContext` provides planetary metadata (name, radius, celestial ID) used for geographic calculations on descendant nodes.

### Node Indexing

Every NodeAdapter is stored in a `Map<key, NodeAdapter>` for O(1) lookups:

```javascript
model.getNode(key)              // Lookup by nodeUid
model.getNode(type, id, scopeId) // Lookup by type + id
```

The key format is `scopeId:prefix:id` (e.g., `fs1_earth:terrestrial:42`).

### Setting Children

```javascript
model.setChildren(parentNode, childMvmfModels)
```

When the server sends child data, the Model:
1. Creates NodeAdapters for each child
2. Merges with any attachment-mounted children
3. Indexes all new nodes
4. Emits `nodeChildrenChanged`

## Selection

```javascript
model.selectNode(node)
model.getSelectedNode()
```

`selectNode` sets the selection, opens the node for loading on the server, and emits `selectionChanged`.

If the target node doesn't exist yet (e.g., during state restoration), the key is stored in `_pendingSelectedKey` and automatically resolved when the node appears.

## Expansion

```javascript
model.expandNode(node)
model.collapseNode(node)
model.isNodeExpanded(node)
model.expandLevel(node)           // Expand immediate children
model.expandAllDescendants(node)  // Recursively expand everything
model.collapseAllDescendants(node)
```

Expanding a node:
1. Sets `node.isExpanded = true`
2. Opens the node's MVMF model for loading (triggers server data fetch)
3. If the node is an attachment, follows the link to a child scope
4. Emits `expansionChanged`

Collapsing a node:
1. Sets `node.isExpanded = false`
2. Detaches children (closes their MVMF models to free resources)
3. Clears pending state for descendants
4. Emits `expansionChanged`

### State Restoration

For restoring expansion from saved state:

```javascript
model.expandNodesByKeys(keyArray)
```

This uses a two-pass approach:
1. Register all keys as "pending expanded"
2. Expand nodes that exist now
3. As children load asynchronously, check if newly arrived nodes match pending keys and auto-expand them

## Attachments (Child Scopes)

When a node's resource references an MSF file, it's an **attachment point**. Expanding it triggers:

1. `_maybeExpandAttachment(node)` detects the MSF reference
2. The ManifolderClient follows the link, connecting to the child scope
3. `_buildAttachmentRootNode()` creates a synthetic NodeAdapter for the child scope's root
4. `_mountAttachmentChild()` inserts it as a child of the attachment node

### Cycle Detection

If following attachments would create a loop (scope A references scope B which references scope A), the Model creates a synthetic cycle node instead. Users can click it to navigate to the cycle target.

## Search

```javascript
model.search(searchText)
model.clearSearch()
model.setSearchActive(active, term)
```

Search combines local and server results:

1. **Local search**: Scans `model.nodes` for name matches
2. **Server search**: Sends search action to MVMF for each open scope
3. Results are processed in batches of 50 (with `setTimeout`) to avoid blocking
4. Matching nodes get `node.isSearchMatch = true`
5. Ancestor nodes get `node.isSearchAncestor = true`
6. Emits `searchStateChanged` and `searchResultsUpdated`

## Server Event Handling

The Model subscribes to ManifolderClient events:

### `nodeInserted`

When the server inserts a new child:
1. Finds or loads the parent NodeAdapter
2. Creates a NodeAdapter for the new child
3. Adds to parent's children and indexes it
4. Checks if the new node matches any pending expansion/selection

### `nodeUpdated`

When a node's properties change:
1. Calls `node.markDirty()` to clear cached transforms
2. Emits `nodeUpdated`

### `nodeDeleted`

When a node is removed:
1. Preserves pending state (if the deleted node was selected/expanded, saves the key)
2. Removes from parent's children
3. Removes from index (recursively for descendants)
4. Emits `nodeDeleted`

### `modelReady`

When a complete model loads:
1. Creates NodeAdapters for all children
2. Calls `setChildren()` on the parent
3. Emits events for views to update

## Utility Methods

```javascript
model.getPathToNode(node)      // Returns ancestor chain from root to node
model.nodeKey(node)             // Gets the node's key for indexing
model.getPlanetContext(node)    // Gets planetary metadata for geographic calculations
```

## Design Patterns

### Deferred Processing

Tree changes are deferred with `setTimeout(0)` to allow the DOM to render between operations. This prevents UI freezing during large tree operations.

### Pending State Preservation

When a node is deleted and then re-created (common during tree reorganizations), the Model preserves pending selection/expansion keys. When the equivalent node reappears, its state is automatically restored.

### Scope-Aware Indexing

Nodes are indexed by scope-qualified keys, allowing multiple scopes to coexist. The root scope and any number of attached child scopes can be loaded simultaneously, each maintaining their own node ID space.
