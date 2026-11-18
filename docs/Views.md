# Views

Manifolder provides three viewport visualization modes. Each view subscribes to [Model events](Model-Layer.md#events) and renders independently.

## Graph View

**File**: `client/js/view-graph.js`

A 3D force-directed graph that shows the tree hierarchy as connected spheres.

### Physics Simulation

The graph uses a custom physics engine to position nodes:

| Parameter | Value | Description |
|-----------|-------|-------------|
| Repulsion force | 600 N | Pushes nodes apart |
| Repulsion cutoff | 500 m | Max distance for repulsion |
| Spring constant | 0.02 | Attracts connected nodes |
| Spring rest length | 50 units | Target distance between parent-child |
| Hierarchy gap | 30 m | Vertical spacing between levels |
| Damping | 0.92 | Velocity decay per frame |
| Max velocity | 5 units | Speed cap |
| Settle threshold | 0.01 | Velocity² below which simulation stops |
| Gravity | 0.005 | Gentle pull toward origin |

The simulation runs each frame and settles when all nodes fall below the velocity threshold.

### Rendering

- **Node meshes**: Shared `SphereGeometry` (radius 2, 16×12 segments) with `MeshStandardMaterial`, colored by node type
- **Labels**: Canvas-rendered `Sprite` labels with stroke outline
- **Selection highlight**: Larger wireframe sphere (1.2× radius, white)
- **Links**: Dynamic `BufferGeometry` lines updated each frame
- **Background**: Starfield particle system + infinite grid
- **Lighting**: Hemisphere light + directional light + camera-mounted point light

### Interaction

- **Click**: Select a node
- **Double-click**: Toggle expand/collapse. If the node is a leaf with an MSF resource, prompt to load it.
- **Drag detection**: A 5px movement threshold distinguishes clicks from drags

### Camera Animation

Zooming to a selected node uses a 1.5-second animation with `easeInOutQuart` easing. The camera maintains its orbital angle relative to the target position.

---

## Bounds View

**File**: `client/js/view-bounds.js`

A 3D visualization of spatial bounding volumes with orbital animation. This is the most complex view, handling astronomical scale ranges from galaxies to surface parcels.

### What Gets Displayed

The Bounds view shows nodes that are:
1. Expanded in the hierarchy (or are direct children of an expanded node)
2. Not filtered out by the Type Filter
3. Within the culling threshold (bounds ≤ 10× the focus node's bounds)

### Shape Rendering

| Node Category | Shape | Details |
|---------------|-------|---------|
| Celestial | Sphere | Surface textures from `pResource.sReference` or Surface children |
| Terrestrial | Box | Wireframe or solid based on type |
| Physical | Box | Colored by type |

Labels are rendered as sprites that automatically hide when the object fills the viewport, and shrink proportionally to distance.

### Scaling System

The Bounds view must handle extreme scale differences — a Universe is ~10²⁶ meters across while a building is ~10¹ meters. Two scaling modes address this:

#### Global Linear Scale (Default)

All nodes are scaled by a single factor: `targetSize / maxExtent` (target = 100 scene units). This works well when all visible nodes are of similar scale.

#### Logarithmic Focus Mode

When a focus node is set (typically the selected node's parent), the view switches to logarithmic scaling:

**Position scaling** — Distances from the focus node are compressed logarithmically:
```
sceneDistance = log10(1 + realDistance / referenceUnit) × FOCUS_VISUAL_SIZE × 50 / 10
```
Where `referenceUnit` is the focus node's bound size.

Approximate mapping:
- 1× focus node distance → ~30 scene units
- 10× focus node distance → ~50 scene units
- 1000× focus node distance → ~150 scene units

**Size scaling** — Object sizes use cube root compression relative to the focus node:
- The focus node always renders at a fixed visual size (FOCUS_VISUAL_SIZE = 100)
- An object 8× larger renders at 2× visual size
- An object 1000× larger renders at 10× visual size

**Culling** — Nodes whose bounds exceed 10× the focus node's bounds are hidden entirely.

### Orbital Animation

For celestial bodies with orbital data, the view calculates elliptical positions using Keplerian mechanics:

1. Read orbit parameters: `semiMajorAxis`, `semiMinorAxis`, `period`, `phaseOffset`
2. Calculate mean anomaly from simulation time
3. Solve Kepler's equation for eccentric anomaly
4. Convert to position on ellipse
5. Rotate by node's local rotation quaternion
6. Apply parent's world rotation and position
7. Recurse through hidden orbital parents

**Time Scale presets** (slider):

| Setting | Speed |
|---------|-------|
| Paused | 0 |
| 1 sec/sec | Real-time |
| 1 min/sec | 60× |
| 1 hr/sec | 3,600× |
| 1 day/sec | 86,400× |
| 1 wk/sec | 604,800× |
| 1 mo/sec | 2,592,000× |
| 1 yr/sec | 31,536,000× |

**Orbit path lines** are rendered as ellipse geometries and can be toggled on/off.

**Spin animation** rotates bodies with axial rotation data (e.g., Earth's daily rotation).

### Type Filter

The type filter lets users show/hide specific node types. Filter categories match the three node categories:

- **Celestial**: Universe through Surface (17 types)
- **Terrestrial**: Root through Parcel (11 types)
- **Physical**: Physical (1 type)

Category-level checkboxes toggle all types in that category. The Orbits toggle is included in the Celestial category controls.

### Selection

Clicking in the Bounds view performs a raycast. When multiple nodes overlap, successive clicks cycle through them. The raycast deduplicates results, keeping the nearest hit per node.

---

## Resource View

**File**: `client/js/view-resource.js`

A 3D model viewer that loads and displays GLB assets associated with nodes.

### What Gets Loaded

The Resource view loads 3D models for:
- The selected node (if it has a resource URL)
- All expanded descendants of the selected node that have resource URLs

This means expanding more children in the hierarchy progressively loads more 3D models into the scene.

### Model Loading

1. The view reads `node.resourceUrl` (resolved via [NodeAdapter](Node-Adapter.md))
2. It fetches the resource metadata JSON
3. **Metadata resources** (with `lods` or `LODs` arrays): Selects the highest-detail LOD and loads its GLB file
4. **Blueprint resources** (with `body.blueprint`): Walks the blueprint tree, loading each child node's GLB
5. GLB files are loaded via Three.js `GLTFLoader` with `DRACOLoader` for compressed geometry and `KTX2Loader` for compressed textures

### Blueprint Hierarchies

Blueprint resources describe a tree of physical objects with positions, rotations, and resource references:

```json
{
  "body": {
    "blueprint": {
      "name": "Building",
      "position": [0, 0, 0],
      "rotation": [0, 0, 0, 1],
      "resourceReference": "models/building.glb",
      "children": [
        {
          "name": "Sign",
          "position": [2, 3, 0],
          "resourceReference": "models/sign.glb"
        }
      ]
    }
  }
}
```

The view recursively walks this tree, creating Three.js groups with the specified transforms and loading each referenced GLB.

### Special Features

**Video textures**: Nodes with HLS stream references create video mesh planes. Click to play/pause.

**Rotator animations**: Action resources can specify continuous rotation animations applied to loaded models.

**Point lights**: Blueprint nodes can define point lights with color, intensity, and position.

**Text sprites**: Blueprint nodes can define text labels rendered as canvas-based sprites.

### Lighting System

The Resource view uses physically-based lighting:

- **Sun light**: Directional light (0xffebd6, intensity 2.1) with 4096×4096 shadow maps
- **Image-based lighting**: `RoomEnvironment` via `PMREMGenerator` for ambient reflections
- **Sky**: Three.js `Sky` addon for atmospheric scattering (daytime) or `SkyDome` gradient + starfield (nighttime)

#### Geographic Sun Positioning

For Earth-based nodes, the Time of Day slider calculates realistic sun position:

1. Reads latitude/longitude from the node's world position
2. Calculates solar declination from the day of year
3. Computes hour angle from solar time
4. Derives azimuth and elevation angles
5. Updates sky shader uniforms and light direction

Lighting varies by solar elevation:
- **Night** (< -6°): Dark blue ambient, stars visible
- **Twilight** (-6° to 0°): Purple tones, low intensity
- **Golden hour** (0° to 10°): Warm orange
- **Morning/evening** (10° to 30°): Transitional warm-to-neutral
- **Midday** (> 30°): White, full intensity

### Caching

Both resource metadata JSON and loaded GLB models are cached to avoid redundant network requests when navigating between nodes.

### Show Bounds Toggle

When enabled, wireframe bounding boxes are overlaid on loaded models, matching the Bounds view's visualization for reference.

---

## Coordinate System

All views use a right-handed coordinate system with Y-axis up and units in meters.

---

## Model Event Subscriptions

Each view subscribes to different model events:

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

---

## Three.js Usage Summary

| Feature | Implementation |
|---------|---------------|
| Geometry | Shared SphereGeometry, BoxGeometry, PlaneGeometry, dynamic BufferGeometry |
| Materials | MeshStandardMaterial (PBR), ShaderMaterial (grid, sky), LineBasicMaterial (orbits) |
| Textures | CanvasTexture (labels), ImageTexture (surfaces), VideoTexture (streams) |
| Lighting | HemisphereLight, DirectionalLight, PointLight, RoomEnvironment IBL |
| Controls | OrbitControls (all views) |
| Selection | Raycaster |
| Post-processing | Sky shader, SkyDome shader, ACES filmic tone mapping |
| Optimization | Frustum culling disabled for grid/stars, label LOD |

---

## Scene Helpers

**File**: `client/js/scene-helpers.js`

Shared Three.js utilities used across views:

- `createInfiniteGrid()`: Shader-based infinite ground plane with major/minor grid lines
- `createSkyDome()`: Gradient sky mesh from horizon to zenith colors
- `createStarfield()`: Spherical point cloud of 3000 stars at 80km radius
- `createLabelSprite()`: Canvas-rendered text label with stroke outline, returned as a Three.js Sprite

## Generation capture contract v1

`capture.html` is a noninteractive, one-job entrypoint sharing `Model`, `NodeAdapter`
and `ViewResource`. Build with `npm ci && npm run build` in `client`. Distribute
`capture.html` and the complete `dist` directory together. The capture bundle includes
exact Three.js 0.160.0 and HLS 1.5.7 dependencies and local Draco/Basis decoders; it
uses no CDN import map. `dist/capture-manifest.json` records the source revision,
source digest and bundle digest. The controller must pin and verify the artifact.

After the module loads, call `window.manifolderCapture.capture(request)` with:

```js
{
  contractVersion: 1,
  target: { fabricId: 'generation-fabric-id', campusId: '8117' },
  snapshot: {
    target: { fabricId: 'generation-fabric-id', campusId: '8117' },
    scopeId: 'job-scope', resourceRoot: 'https://authorized-assets.example/',
    root: {
      record: { sID: 'RMTObject', twObjectIx: 8117, nChildren: 0, /* SDK fields */ },
      children: []
    }
  }
}
```

Every record is the SDK record consumed by NodeAdapter (`pTransform`, `pResource`,
`pBound`, etc.). Children recursively use the same `{record, children}` shape.
The trusted controller authenticates the live target and completely enumerates its
SDK subtree before submission. The renderer checks exact target/root identity,
unique nodes, child counts and a 1,000-node limit. This establishes snapshot closure,
**not independent proof of the controller's live discovery**; the receipt explicitly
identifies `controller-snapshot` evidence. There is no browser credential or SDK
connection, and UI expansion/hidden state is never imported. Attachments to other
scopes are unsupported in v1 and fail rather than producing partial captures.

The promise rejects on missing assets, unsupported active content (including video),
missing geometry, failed shaders/context or output exceeding 512 KiB. Supported
static scene/pointlight/text resources and zero-time rotators reuse viewer semantics.
LoadingManager tracks GLTF subresources; successful top-level resource promises alone
are insufficient. The final frame awaits font and shader readiness, freezes animations,
uses fixed lighting/background and fits a bounding sphere to both viewport axes.
Capture render sorting uses scene traversal to break equal-depth ties instead of
allocation IDs, so concurrent asset completion does not choose the visible surface.
Return value is `{receipt, jpeg}`: the JPEG data URL is 640×360, and the receipt contains
target, renderer revision, closure/resource evidence, world bounds and final camera.
A page permits one capture attempt; close its context afterwards. The worker owns
hard cancellation, transfer/CPU/memory limits, credential isolation and the authorized
resource gateway. This page is not a secure arbitrary-URL screenshot service.

Run `node --test client/js/capture.test.mjs` and
`node --experimental-vm-modules --test client/js/view-resource.test.mjs` from the
repository root. Live scene/fixture capture and container isolation evidence belong
to the consuming worker's integration gate; these unit tests do not establish them.
