# Plan: Latitude/Longitude Calculation for Terrestrial Objects

## Status
**Implemented** - Phase 1 (basic display) + Phase 2 (magnitude inference) + Phase 3 (RP1 integration).

## Summary
Display latitude and longitude coordinates in the Inspector panel for terrestrial objects on planetary surfaces.

---

## Coordinate System Discovery

### World Position (`_worldPos`)
- Uses **Y-up** right-handed coordinate system (consistent with celestial system)
- Y-axis points toward north pole
- X and Z form the equatorial plane
- Units in meters
- Origin at planet center

### Verification
"Meet City" node placed at geographic null point (0°N, 0°E):
- `_worldPos: { x: 222209, y: 222344, z: 6363240 }`
- Magnitude: ~6,371,000m (Earth's radius)
- Calculated: 2.0°N, 2.0°E (close to 0°/0° as expected)

---

## Conversion Formula

```javascript
function calculateLatLong(worldPos, surfaceRadius) {
  const { x, y, z } = worldPos;
  const R = Math.sqrt(x * x + y * y + z * z);

  // Verify point is on surface (within tolerance)
  if (Math.abs(R - surfaceRadius) > surfaceRadius * 0.01) {
    return null; // Not on surface
  }

  const latitude = Math.asin(y / R) * (180 / Math.PI);
  const longitude = Math.atan2(x, z) * (180 / Math.PI);

  return { latitude, longitude };
}

// Format for display
function formatLatLong(lat, lon) {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lon).toFixed(4)}°${lonDir}`;
}
```

---

## Data Hierarchy Context

### When Celestial Fabric is Loaded (via Follow Link)

```
Planet (e.g., Earth)
├── bound: { x: 6471000, ... }         // planet radius
└── Surface
    ├── bound: { x: 6371000, ... }     // surface radius
    ├── rotation: { quaternion }        // axial tilt (~23.4° for Earth)
    └── Attachment Point
        └── [terrestrial MSF]           // earth.msf content
```

**Approach**: Walk up hierarchy from terrestrial root to find Surface/Planet ancestor:

```javascript
function findPlanetContext(attachmentNode) {
  let node = attachmentNode.parent;
  while (node) {
    if (node.nodeType === 'Surface') {
      return {
        radius: node.bound.x,
        planetName: node.parent?.name
      };
    }
    node = node.parent;
  }
  return null;
}
```

### When Only Terrestrial MSF is Loaded Directly

No celestial parent means:
- `_worldPos` is relative to MSF root at (0,0,0)
- No axial tilt rotation applied
- Planet radius unknown

**Options (in order of preference):**

1. **Don't show lat/long** - Most honest, no guessing
2. **Infer from magnitude** - Match `_worldPos` magnitude to known planet radii
3. **User specifies** - Dropdown to select planet context
4. **MSF metadata** - Future: add `planetContext` to MSF format

---

## Implementation Plan

### Phase 1: Basic Implementation (Implemented)
1. ~~Add `findPlanetContext()` when following links~~ → Using magnitude inference instead
2. ~~Store context on the terrestrial MSF root node~~ → Not needed with magnitude inference
3. Add lat/long display to Inspector when context available ✓
4. Show: `Lat/Long: 47.2°N, 2.3°E (Earth)` ✓

### Phase 2: Surface Ancestor Detection (Implemented)

Planet context is derived from the hierarchy - no hardcoded radii:
- `view-bounds.js` detects Surface nodes during tree traversal
- Creates `_planetContext = { radius: bound.x, planetName: parent.name }`
- Propagates context to all descendant nodes

Only RP1-specific data (celestialId) requires a lookup table:
```javascript
const RP1_CELESTIAL_IDS = {
  'Earth': 104,
};
```

### Files Modified
- `client/js/view-bounds.js` - Propagates `_planetContext` from Surface nodes to descendants ✓
- `client/js/inspector-panel.js` - Display lat/long + GO→ button using `_planetContext` ✓
- `client/css/style.css` - Location section styles ✓

---

## Notes

- Terrestrial local `position` values may use different orientation (possibly Z-up internally)
- The `_worldPos` is always computed in Y-up after hierarchy transforms applied
- Earth Surface has rotation quaternion `(0, 0, 0.2028, 0.9792)` = ~23.4° axial tilt
- Consider future transition to Z-up coordinate system (mentioned as possibility)

---

## Phase 3: RP1 Deep-Link Integration (Implemented)

### RP1 URL Format
```
https://enter.rp1.com/?start_cid=<CELESTIAL_ID>&start_geo=[<LAT>,<LON>,<RADIUS>]
```

### Known Celestial IDs (stored in KNOWN_PLANETS)
- Earth: 104
- Mars, Moon: TBD (GO→ button hidden until celestialId added)

### Implementation ✓
1. Add "GO→" button in Inspector when lat/long is available ✓
2. Button generates RP1 URL and opens in new tab ✓
3. Example URL for Earth location: `https://enter.rp1.com/?start_cid=104&start_geo=[39.70989,-75.11976,6371000]` ✓

---

## References
- Meet City test case: Node at ~0°/0° with `_worldPos` magnitude = Earth radius
- Earth surface radius: 6,371,000m
- Earth axial tilt: ~23.4°