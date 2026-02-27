# Bookmarks & Sharing

**File**: `client/js/bookmark-manager.js`

Manifolder supports saving, restoring, and sharing complete view states through bookmarks and shareable URLs.

## Bookmarks

### Saving a Bookmark

Click the **★** button in the toolbar. A bookmark captures:
- Map URL
- Selected node path (from root to selected node)
- All expanded node IDs (with parent references)
- View settings (type filter, orbits visibility)

The bookmark is named after the selected node (or "Untitled") and stored in localStorage.

### Managing Bookmarks

Click the **▼** dropdown to see saved bookmarks:
- **Click** a bookmark to restore its state
- **✎** to rename
- **×** to delete

### Restoring a Bookmark

Restoring a bookmark:
1. Loads the saved map URL (if different from current)
2. Applies the full UI state via `UIStateManager.applyFullState()`
3. Expands saved nodes and selects the saved target

### Storage Format

Bookmarks are stored in localStorage under the key `mv-bookmarks` as a JSON array:

```javascript
[
  {
    id: "lq2a5x3b7",           // Unique ID (timestamp + random)
    name: "Downtown Chicago",   // User-editable name
    state: { /* full UI state */ },
    nodeType: "RMTObject",      // Type of selected node (for display)
    timestamp: 1709234567890    // Creation time
  }
]
```

## Shareable URLs

### Creating a Share Link

Click the **↗** button. This:
1. Captures the current UI state
2. Encodes it as a compact JSON payload
3. Compresses with pako (deflate)
4. Base64URL-encodes the compressed data
5. Appends as `?loc=...` query parameter
6. Copies the URL to the clipboard

### URL Budget

Share URLs target a 2000-character budget. If the full state exceeds this, the encoder progressively drops information:

| Attempt | Included | Excluded |
|---------|----------|----------|
| 1 | Everything | — |
| 2 | Path, type filter, orbits | Expanded nodes |
| 3 | Path, orbits | Expanded nodes, type filter |
| 4 | Path only | Everything else |

If even the core state exceeds the budget, an error is shown.

### Payload Format (v2)

```javascript
{
  v: 2,                          // Version
  m: "https://cdn2.rp1.com/...", // Map URL
  scopes: ["fs1_earth", "fs1_moon"], // Scope ID list
  p: "0.R0,0.C1,0.T42",        // Selected path (encoded refs)
  e: "0.R0,0.C1:0.R0,0.T42:0.C1", // Expanded nodes (with parents)
  t: "-17,18",                   // Type filter (compact)
  o: 0                           // Orbits visible (0=false, absent=true)
}
```

### Node Reference Encoding

Nodes are encoded as `{scopeIndex}.{typeCode}{id}`:
- **scopeIndex**: Index into the `scopes` array (0-based)
- **typeCode**: Single letter — `R`=root, `C`=celestial, `T`=terrestrial, `P`=physical
- **id**: Numeric node ID

Example: `0.T42` = scope index 0, terrestrial node #42

For expanded nodes, parent references use `:` separator: `0.T42:0.C1` means node T42, parent C1.

### Type Filter Encoding

The filter encodes which types are enabled/disabled using index numbers:

- **Positive list** (`"0,3,11"`): These type indices are enabled
- **Negative list** (`"-17,18"`): These type indices are disabled (all others enabled)

The encoder uses whichever representation is shorter.

### Decoding a Share Link

When someone opens a URL with `?loc=...`:

1. Extract the `loc` parameter
2. Base64URL-decode
3. Decompress with pako (inflate)
4. Parse JSON
5. Detect version (v2 has `scopes` array; v1 is legacy)
6. Decode node references using scope list
7. Build full state object
8. Apply via `stateManager.applyFullState()`

The URL parameter is consumed (removed from the address bar) after processing.

### Legacy Format (v1)

Version 1 share links used direct type codes without scope indexing:
- Path: `"C1,C2,T3"` → `[{type: "RMCObject", id: 1}, ...]`
- Expanded: `"C1,T2:C1"` → `[{key: "RMCObject_1"}, {key: "RMTObject_2", parent: "RMCObject_1"}]`

Legacy links are automatically detected and decoded.

## URL Parameters

| Parameter | Description |
|-----------|-------------|
| `?msf=<url>` | Load a specific MSF URL. Consumed after loading. |
| `?loc=<data>` | Encoded share state. Consumed after decoding and applying. |

If both are present, `?msf=` takes precedence.

## Implementation Details

### Compression

Share URLs use [pako](https://github.com/nicmart/pako) (a JavaScript implementation of zlib) for compression:
- **Encoding**: `pako.deflate(jsonString)` → `Uint8Array`
- **Decoding**: `pako.inflate(compressedBytes, { to: 'string' })` → JSON string

### Base64URL

Standard Base64 is not URL-safe, so the encoder converts:
- `+` → `-`
- `/` → `_`
- Strips trailing `=` padding

The decoder reverses these substitutions before decoding.

### Scope Deduplication

The `scopes` array in the payload deduplicates scope IDs. Each node reference uses an index into this array, reducing payload size when many nodes share the same scope.
