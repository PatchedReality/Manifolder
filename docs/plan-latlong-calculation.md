# Plan: Latitude/Longitude Calculation for Terrestrial Objects

## Status
Research complete, implementation deferred.

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

### Phase 1: Basic Implementation
1. Add `findPlanetContext()` when following links from celestial to terrestrial
2. Store context on the terrestrial MSF root node
3. Add lat/long display to Inspector when context available
4. Show: `Lat/Long: 47.2°N, 2.3°E (Earth)`

### Phase 2: Fallback Detection (Optional)
```javascript
const KNOWN_PLANETS = {
  'Earth': { radius: 6371000, tolerance: 50000 },
  'Mars':  { radius: 3389500, tolerance: 30000 },
  'Moon':  { radius: 1737400, tolerance: 20000 },
};

function inferPlanetFromMagnitude(worldPosMagnitude) {
  for (const [name, { radius, tolerance }] of Object.entries(KNOWN_PLANETS)) {
    if (Math.abs(worldPosMagnitude - radius) < tolerance) {
      return { name, radius };
    }
  }
  return null;
}
```

### Files to Modify
- `client/js/inspector-panel.js` - Display lat/long in node details
- `client/js/msf-loader.js` (or equivalent) - Capture planet context when following links
- `client/js/app.js` - Pass context through when loading linked MSFs

---

## Notes

- Terrestrial local `position` values may use different orientation (possibly Z-up internally)
- The `_worldPos` is always computed in Y-up after hierarchy transforms applied
- Earth Surface has rotation quaternion `(0, 0, 0.2028, 0.9792)` = ~23.4° axial tilt
- Consider future transition to Z-up coordinate system (mentioned as possibility)

---

## References
- Meet City test case: Node at ~0°/0° with `_worldPos` magnitude = Earth radius
- Earth surface radius: 6,371,000m
- Earth axial tilt: ~23.4°