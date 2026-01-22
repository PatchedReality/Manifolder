# Plan: NodeFactory with MVMF Integration (Stages 1+2)

## Summary

Create a `NodeFactory` that:
1. **Consolidates** 6 duplicative parse/build methods into one (Stage 1)
2. **Uses MVMF classes internally** for data integrity (Stage 2)
3. **Converts to UI format** at the boundary (preserves UI compatibility)

**Full analysis:** See `docs/MVMF_DUPLICATION_ANALYSIS.md`

## Architecture

```
Server Response (pIAction.pResponse)
       ↓
NodeFactory.createNode(type, data, id)
       ↓
   ┌─────────────────────────────────┐
   │  MVMF Classes (internal)        │
   │  - RMCOMMON_TRANSFORM           │
   │  - RMCOMMON_BOUND               │
   │  - RMCOMMON_ORBIT_SPIN          │
   └─────────────────────────────────┘
       ↓
   toUIFormat() conversion
       ↓
UI-friendly object: {name, type, transform: {position: {x,y,z}, ...}, ...}
       ↓
UI Components (unchanged)
```

## What to Do

### Create: `client/js/node-factory.js`

```javascript
import { TERRESTRIAL_TYPE_MAP, CELESTIAL_TYPE_MAP } from '../shared/node-types.js';

export class NodeFactory {
  // --- MVMF-backed parsing (Stage 2) ---

  static parseTransform(pTransform) {
    if (!pTransform) return null;

    // Use MVMF class internally
    const mvTransform = new MV.MVRP.Map.Class.RMCOMMON_TRANSFORM();
    mvTransform.vPosition.Set(pTransform.Position[0], pTransform.Position[1], pTransform.Position[2]);
    mvTransform.qRotation.Set(pTransform.Rotation[0], pTransform.Rotation[1], pTransform.Rotation[2], pTransform.Rotation[3]);
    mvTransform.vScale.Set(pTransform.Scale[0], pTransform.Scale[1], pTransform.Scale[2]);

    // Convert to UI format at boundary
    return {
      position: { x: mvTransform.vPosition.dX, y: mvTransform.vPosition.dY, z: mvTransform.vPosition.dZ },
      rotation: { x: mvTransform.qRotation.dX, y: mvTransform.qRotation.dY, z: mvTransform.qRotation.dZ, w: mvTransform.qRotation.dW },
      scale: { x: mvTransform.vScale.dX, y: mvTransform.vScale.dY, z: mvTransform.vScale.dZ }
    };
  }

  static parseBound(pBound) {
    if (!pBound?.Max) return null;

    const mvBound = new MV.MVRP.Map.Class.RMCOMMON_BOUND();
    mvBound.Set(pBound.Max[0], pBound.Max[1], pBound.Max[2]);

    return { x: mvBound.dX, y: mvBound.dY, z: mvBound.dZ };
  }

  static parseOrbit(pOrbit) {
    if (!pOrbit?.dA) return null;

    const mvOrbit = new MV.MVRP.Map.Class.RMCOMMON_ORBIT_SPIN();
    mvOrbit.Set(pOrbit.tmPeriod, pOrbit.tmOrigin ?? pOrbit.tmStart ?? 0, pOrbit.dA, pOrbit.dB || pOrbit.dA);

    // Convert time units for UI
    const TIME_UNIT_TO_SECONDS = 1 / 64;
    return {
      period: mvOrbit.tmPeriod * TIME_UNIT_TO_SECONDS,
      phaseOffset: mvOrbit.tmOrigin * TIME_UNIT_TO_SECONDS,
      semiMajorAxis: mvOrbit.dA,
      semiMinorAxis: mvOrbit.dB
    };
  }

  // --- Consolidated node creation (Stage 1) ---

  static createNode(type, data, id) {
    // Dispatcher - replaces 6 separate methods
    switch (type) {
      case 'RMRoot':     return this.#buildRootNode(data, id);
      case 'RMCObject':  return this.#buildObjectNode(data, id, 'RMCObject', 'wsRMCObjectId', 'twRMCObjectIx');
      case 'RMTObject':  return this.#buildObjectNode(data, id, 'RMTObject', 'wsRMTObjectId', 'twRMTObjectIx');
      case 'RMPObject':  return this.#buildObjectNode(data, id, 'RMPObject', 'wsRMPObjectId', 'twRMPObjectIx');
      default: throw new Error(`Unknown node type: ${type}`);
    }
  }

  static #buildObjectNode(data, id, type, nameField, idField) {
    const parent = data.Parent || data;
    const nodeType = this.#resolveNodeType(parent, type);

    const node = {
      name: parent.pName?.[nameField] || parent.sName || `${type} ${id}`,
      type: type,
      nodeType: nodeType,
      class: parent.sClass,
      id: parent[idField] || id,
      transform: this.parseTransform(parent.pTransform),
      bound: this.parseBound(parent.pBound),
      orbit: type === 'RMCObject' ? this.parseOrbit(parent.pOrbit_Spin) : null,
      properties: this.#extractProperties(parent),
      children: [],
      hasChildren: false
    };

    // Parse children if present
    const aChild = data.aChild || [];
    for (const childGroup of aChild) {
      if (!Array.isArray(childGroup)) continue;
      for (const child of childGroup) {
        node.children.push(this.#parseChildNode(child));
      }
    }

    node.hasChildren = node.children.length > 0 || parent.nChildren > 0;
    return node;
  }

  // ... helper methods: #buildRootNode, #parseChildNode, #resolveNodeType, #extractProperties
}
```

### Modify: `client/js/mv-client.js`

Remove these methods (logic moved to NodeFactory):
- `_parseContainerNode`, `_parseTerrainNode`, `_parsePlaceableNode`
- `_buildContainerNode`, `_buildTerrainNode`, `_buildPlaceableNode`
- `_parseTransformFromData`, `_parseBoundFromData`, `_parseOrbitFromData`
- `_resolveNodeType`, `_extractProperties`

Replace usages:
```javascript
import { NodeFactory } from './node-factory.js';

// Before: const node = this._buildContainerNode(response, nodeId);
// After:
const node = NodeFactory.createNode('RMCObject', response, nodeId);
```

### Keep Unchanged
- `client/shared/node-types.js` - UI display mappings
- `client/js/hierarchy-panel.js` - no format changes
- `client/js/view-bounds.js` - no format changes
- `client/js/view-graph.js` - no format changes

## Benefits

| Benefit | How |
|---------|-----|
| Single point of change | 6 methods → 1 factory |
| MVMF as source of truth | Factory uses MVMF classes internally |
| UI compatibility | Converts to UI format at boundary |
| Type safety | MVMF classes validate data |
| Future Stage 3 ready | Can expose MVMF types to UI later |

## Verification

1. Run `./dev/serve.sh`
2. Verify hierarchy panel populates
3. Expand nodes - children load correctly
4. Check bounds visualization (orbits, positions)
5. Check graph visualization
6. Console shows no errors

## Future: Stage 3 (optional)

Update UI components to use MVMF types directly:
- `node.transform.position.x` → `node.mvTransform.vPosition.dX`
- Remove conversion layer
- Higher effort, touches view-bounds.js (2100 lines)