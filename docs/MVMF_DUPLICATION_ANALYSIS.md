# MVMF Duplication Analysis

Analysis of duplicative data structures between client code and MVMF libraries.

## Executive Summary

The client code (`mv-client.js`) implements a complete node parsing layer that mirrors MVMF's serialization/deserialization architecture. This creates maintenance burden and potential for divergence.

**Recommendation:** Option C - Create a NodeFactory that:
1. **Consolidates** 6 duplicative parse/build methods into one (Stage 1)
2. **Uses MVMF classes internally** for data integrity (Stage 2)
3. **Converts to UI format** at the boundary (preserves UI compatibility)

---

## Duplicative Structures Found

### 1. Transform Data Structures

| Client Code | MVMF Equivalent | Location |
|-------------|-----------------|----------|
| `_parseTransformFromData()` → `{position, rotation, scale}` | `MV.MVRP.Map.Class.RMCOMMON_TRANSFORM` | mv-client.js:267-289 |

**Client Implementation:**
```javascript
return {
  position: { x: pTransform.Position[0], y: pTransform.Position[1], z: pTransform.Position[2] },
  rotation: { x: pTransform.Rotation[0], y: pTransform.Rotation[1], z: pTransform.Rotation[2], w: pTransform.Rotation[3] },
  scale: { x: pTransform.Scale[0], y: pTransform.Scale[1], z: pTransform.Scale[2] }
};
```

**MVMF Equivalent (MVRP_Map.js lines 69-99):**
```javascript
// RMCOMMON_TRANSFORM class with:
// - vPosition (DOUBLE3): dX, dY, dZ
// - qRotation (DOUBLE4): dX, dY, dZ, dW
// - vScale (DOUBLE3): dX, dY, dZ
```

### 2. Bound Data Structures

| Client Code | MVMF Equivalent | Location |
|-------------|-----------------|----------|
| `_parseBoundFromData()` → `{x, y, z}` | `MV.MVRP.Map.Class.RMCOMMON_BOUND` | mv-client.js:291-300 |

### 3. Orbit/Spin Data Structures

| Client Code | MVMF Equivalent | Location |
|-------------|-----------------|----------|
| `_parseOrbitFromData()` | `MV.MVRP.Map.Class.RMCOMMON_ORBIT_SPIN` | mv-client.js:302-316 |

**Note:** Client converts TIME_UNIT_TO_SECONDS; MVMF stores raw values.

### 4. Parallel Node Parsing (3x duplication)

| Client Methods | MVMF Equivalent | Lines |
|----------------|-----------------|-------|
| `_parseContainerNode()` | `MV.MVRP.Map.RMCOBJECT` | 318-333 |
| `_parseTerrainNode()` | `MV.MVRP.Map.RMTOBJECT` | 335-349 |
| `_parsePlaceableNode()` | `MV.MVRP.Map.RMPOBJECT` | 351-365 |
| `_buildContainerNode()` | SB variants | 367-402 |
| `_buildTerrainNode()` | SB variants | 404-438 |
| `_buildPlaceableNode()` | SB variants | 440-475 |

### 5. Node Type Mappings

| Client Code | MVMF Equivalent | Location |
|-------------|-----------------|----------|
| `CELESTIAL_TYPE_MAP`, `TERRESTRIAL_TYPE_MAP` | `MV.MVRP.Map.Class.RMCOMMON_TYPE` | shared/node-types.js:12-45 |

**Note:** Client maps add display names and colors for UI - these serve a different purpose and should be kept.

---

## MVMF Model Architecture

### Class Hierarchy

**Data Classes (MVRP_Map.js lines 19-283):**
- `RMCOMMON_TRANSFORM` - Position, Rotation, Scale
- `RMCOMMON_BOUND` - dX, dY, dZ dimensions
- `RMCOMMON_ORBIT_SPIN` - tmPeriod, tmOrigin, dA, dB
- `RMCOMMON_TYPE` - bType, bSubtype, bFiction, bMovable
- `RMCOMMON_RESOURCE` - qwResource, sName, sReference

**IO Classes (MVRP_Map.js lines 1761-2638):**
```
IO_RMROOT      → extends IO_OBJECT
IO_RMCOBJECT   → extends IO_OBJECT
IO_RMTOBJECT   → extends IO_OBJECT
IO_RMPOBJECT   → extends IO_OBJECT
```

Each provides:
- `factory()` - Creates instances with action definitions
- `Map_Read(pModel)` - Deserializes response data into model
- `Attach(bSubscribe)` - Initiates UPDATE request or subscription

### Data Flow

```
IO_RMCOBJECT (Network I/O layer)
    ↓
RMCOBJECT (Model instance via Model_Open)
    ↓
pData (raw response) → Map_Read() → pModel (typed properties)
```

---

## Current Data Flow (Client)

```
Socket Response (pIAction.pResponse)
       ↓
mv-client.js _parse*/_build* methods
       ↓
Plain JS objects: {name, type, nodeType, id, transform, bound, orbit, properties, children}
       ↓
UI Components:
  - hierarchy-panel.js: node.name, .type, .id, .hasChildren
  - view-graph.js: node.data.properties, node.data.children
  - view-bounds.js: node._worldPos, node._bound, node.transform
```

### Why Format Conversion Is Necessary

- **Server format:** `pTransform.Position[0], Position[1], Position[2]` (arrays)
- **UI format:** `position.x, position.y, position.z` (named properties)

---

## UI Component Dependencies

### hierarchy-panel.js (850 lines)
- `node.name` - display
- `node.type` - key generation
- `node.id` - identification
- `node.nodeType` - icon display
- `node.hasChildren` - toggle visibility
- `node.children[]` - recursive rendering
- `node.transform.position/rotation/scale` - position helpers (lines 578-638)

### view-graph.js (934 lines)
- `node.data` - stored as userData
- `node.id`, `node.type`, `node.nodeType` - colors, keys
- `node.data.properties.pResource.sReference` - texture loading
- `node.data.children` - graph building

### view-bounds.js (2120 lines) - HIGHEST RISK
- `node.transform.position`, `node.transform.rotation` - world position
- `node._worldPos`, `node._worldRot`, `node._bound`, `node._orbitData` - computed
- `node.bound` or `node._bound` - sizing
- `node.properties.pResource.sReference` - textures
- `node.properties.pObjectHead.twParentIx` - orbital parent lookup

---

## Refactoring Options

### Option A: Factory Consolidation Only

Consolidate 6 methods into factory, but don't use MVMF classes.

| Aspect | Assessment |
|--------|------------|
| Risk | Low |
| Effort | 1-2 days |
| MVMF Usage | None - still duplicates MVMF semantics |

### Option B: Full MVMF Model Integration

Use `pLnG.Model_Open('RMCObject', id)` instead of Request pattern.

| Aspect | Assessment |
|--------|------------|
| Risk | HIGH - view-bounds.js depends heavily on current format |
| Effort | 1-2 weeks |
| Benefits | Full model lifecycle, subscriptions, memory management |
| Breaking Changes | All UI components need updates |

### Option C: Hybrid - Factory with MVMF Internally (RECOMMENDED)

Combine Stage 1 (consolidation) + Stage 2 (MVMF internal usage).

| Aspect | Assessment |
|--------|------------|
| Risk | Low - UI format unchanged |
| Effort | 2-3 days |
| MVMF Usage | Factory uses MVMF classes, converts at boundary |
| Benefits | Best of both: consolidation + MVMF as source of truth |

---

## Breaking Change Risk Matrix

| Component | Option A | Option B | Option C |
|-----------|----------|----------|----------|
| hierarchy-panel.js | None | High | None |
| view-graph.js | None | High | None |
| view-bounds.js | None | **Very High** | None |
| node-types.js | None | None | None |

---

## Implementation

See [NODE_FACTORY_PLAN.md](./NODE_FACTORY_PLAN.md) for the implementation plan.