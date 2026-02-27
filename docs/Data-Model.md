# Data Model

Manifolder visualizes data from the Metaverse Spatial Fabric (MSF), a hierarchical spatial data structure organized into three tiers. For complete documentation on the Spatial Fabric architecture, see the [Spatial Fabric Architecture](https://wiki.rp1.com/en/home/spatial-fabric/architecture) wiki.

## Node Categories

Every node in the Spatial Fabric belongs to one of three categories:

### Celestial Objects

Celestial objects represent astronomical bodies and structures. They use spherical bounding volumes and can have orbital mechanics (elliptical paths around parent bodies).

| Type | bType | Description |
|------|-------|-------------|
| Universe | 1 | Top-level container |
| Supercluster | 2 | Galaxy supercluster |
| GalaxyCluster | 3 | Cluster of galaxies |
| Galaxy | 4 | Single galaxy |
| BlackHole | 5 | Black hole |
| Nebula | 6 | Nebula |
| StarCluster | 7 | Star cluster |
| Constellation | 8 | Constellation grouping |
| StarSystem | 9 | Star system |
| Star | 10 | Individual star |
| PlanetSystem | 11 | Planetary system |
| Planet | 12 | Planet |
| Moon | 13 | Natural satellite |
| Debris | 14 | Space debris |
| Satellite | 15 | Artificial satellite |
| Transport | 16 | Transport vessel |
| Surface | 17 | Planetary surface |

### Terrestrial Objects

Terrestrial objects represent geographic regions on a planetary surface. They use rectangular bounding volumes and form a spatial subdivision from continent-scale down to individual parcels.

| Type | bType | Description |
|------|-------|-------------|
| Root | 1 | Container root |
| Water | 2 | Water body |
| Land | 3 | Land mass |
| Country | 4 | Country |
| Territory | 5 | Territory/region |
| State | 6 | State/province |
| County | 7 | County/district |
| City | 8 | City/town |
| Community | 9 | Neighborhood/community |
| Sector | 10 | City block/sector |
| Parcel | 11 | Individual land parcel |

### Physical Objects

Physical objects represent 3D assets placed within the spatial hierarchy. They have resource references pointing to GLB models.

| Type | Description |
|------|-------------|
| Physical | A 3D object with a model resource |

## MVMF Type Classes

The MVMF SDK uses four internal class types that correspond to the categories above:

| MVMF Class | Prefix | Category |
|------------|--------|----------|
| `RMRoot` | `root` | Root container |
| `RMCObject` | `celestial` | Celestial |
| `RMTObject` | `terrestrial` | Terrestrial |
| `RMPObject` | `physical` | Physical |

## Node Properties

Each node in the Spatial Fabric carries several property groups:

### pName
Contains the node's name and identifiers.

### pTransform
Spatial transform with position, rotation (quaternion), and scale:
```json
{
  "pTransform": {
    "dPosX": 0.0, "dPosY": 0.0, "dPosZ": 0.0,
    "dRotX": 0.0, "dRotY": 0.0, "dRotZ": 0.0, "dRotW": 1.0,
    "dSclX": 1.0, "dSclY": 1.0, "dSclZ": 1.0
  }
}
```

The transform can also be stored as arrays (`aPosition`, `aRotation`, `aScale`). NodeAdapter normalizes both formats.

### pBound
Spatial extent (half-extents of the bounding volume):
```json
{
  "pBound": {
    "dX": 100.0, "dY": 50.0, "dZ": 100.0
  }
}
```

### pResource
Reference to external resources (3D models, metadata, MSF links):
```json
{
  "pResource": {
    "sReference": "action://models/building.json",
    "sName": "building.json"
  }
}
```

Resource URLs support three formats:
- **`action://` protocol**: Resolved relative to the scope's resource root URL
- **Full HTTP(S) URLs**: Used directly
- **Relative paths**: Resolved relative to the scope's resource root URL

### Orbital Properties (Celestial only)

Celestial bodies can have orbital mechanics data:
- `semiMajorAxis`: Half the longest diameter of the elliptical orbit
- `semiMinorAxis`: Half the shortest diameter
- `period`: Orbital period (time for one complete orbit)
- `phaseOffset`: Starting position on the orbit

## Node UIDs

Each node has a unique identifier with the format:

```
{scopeId}:{prefix}:{numericId}
```

For example: `fs1_earth:terrestrial:42`

- **scopeId**: Identifies which Fabric scope the node belongs to (e.g., `fs1_earth`)
- **prefix**: The category prefix (`root`, `celestial`, `terrestrial`, `physical`)
- **numericId**: The node's numeric ID within its scope

## Scopes and Attachments

### Scopes

A scope is a single connected Fabric instance. The initially loaded MSF defines the root scope. Each scope has:
- A unique scope ID
- A resource root URL for resolving relative resource paths
- Its own node ID space

### Attachments

Nodes can reference other MSF files via their `pResource` property. When a user expands such a node, Manifolder:

1. Detects the MSF reference in the node's resource
2. Connects to the referenced Fabric as a new child scope
3. Creates a synthetic root adapter for the child scope
4. Mounts it as a child of the attachment node in the tree

This allows a single tree to span multiple Fabric instances — for example, a celestial hierarchy linking to a terrestrial map of Earth.

**Cycle detection**: If following attachments would create a cycle (scope A → scope B → scope A), Manifolder creates a synthetic "cycle" node instead and does not follow the link.

## Type Colors

Each node type has an assigned color used throughout the UI (hierarchy icons, 3D objects, inspector labels). These are defined in `client/shared/node-types.js`, the single source of truth for type information.

Colors are exposed as CSS custom properties (e.g., `--node-planet`, `--node-city`) and injected into the page at startup via `generateNodeTypeStylesheet()`. This ensures JavaScript logic and CSS styling always agree on type colors.

### Color Reference

| Type | Color | CSS Variable |
|------|-------|-------------|
| Universe | `#e0e0ff` | `--node-universe` |
| Supercluster | `#c8b0ff` | `--node-supercluster` |
| GalaxyCluster | `#b088ff` | `--node-galaxycluster` |
| Galaxy | `#9060ff` | `--node-galaxy` |
| BlackHole | `#4a0080` | `--node-blackhole` |
| Nebula | `#ff60d0` | `--node-nebula` |
| StarCluster | `#ffe088` | `--node-starcluster` |
| Constellation | `#80c0ff` | `--node-constellation` |
| StarSystem | `#ffd060` | `--node-starsystem` |
| Star | `#ffff60` | `--node-star` |
| PlanetSystem | `#90d0a0` | `--node-planetsystem` |
| Planet | `#60b0ff` | `--node-planet` |
| Moon | `#c0c0d0` | `--node-moon` |
| Debris | `#808080` | `--node-debris` |
| Satellite | `#a0a0b0` | `--node-satellite` |
| Transport | `#d09060` | `--node-transport` |
| Surface | `#70a070` | `--node-surface` |
| Root | `#a0a0a0` | `--node-root` |
| Water | `#4090d0` | `--node-water` |
| Land | `#60a050` | `--node-land` |
| Country | `#d0a040` | `--node-country` |
| Territory | `#c09040` | `--node-territory` |
| State | `#b08040` | `--node-state` |
| County | `#a07030` | `--node-county` |
| City | `#d06030` | `--node-city` |
| Community | `#c05020` | `--node-community` |
| Sector | `#b04010` | `--node-sector` |
| Parcel | `#a03000` | `--node-parcel` |
| Physical | `#80b0c0` | `--node-physical` |
