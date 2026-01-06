# RP1 Earth Map Viewer

A standalone three.js-based 3D viewer for exploring the RP1 Earth map hierarchy.

## Features

### Two Visualization Modes

1. **Hierarchy View** - Interactive node-based visualization
   - **Force-Directed Layout**: Nodes automatically arrange based on connections
   - **Spatial Layout**: Nodes positioned at actual 3D coordinates from map data
   - Click nodes to select and view details
   - Load children on-demand by clicking "Load Children"

2. **Explorer View** - First-person WASD navigation
   - Navigate through 3D space like a first-person game
   - View actual geometry and bounding boxes
   - Pointer-lock mouse controls for looking around

### Progressive Loading

- Loads `earth.msf` configuration
- Fetches RMROOT (Earth root)
- Loads RMCOBJECT containers (top-level regions)
- On-demand loading of deeper hierarchy levels (RMTOBJECT, RMPOBJECT)

### Data Hierarchy

```
RMROOT (Earth)
  └─ RMCOBJECT (Containers: Continents, regions, etc.)
      └─ RMTOBJECT (Terrain: Parcels, districts, etc.)
          └─ RMPOBJECT (Placeables: Objects, props, etc.)
```

## Usage

### Opening the Viewer

Simply open `earth-viewer.html` in a modern web browser:

```bash
# From the project root
open viewer/earth-viewer.html

# Or navigate to it in your browser
# file:///path/to/Metaverse/viewer/earth-viewer.html
```

**Note**: If you encounter CORS errors when loading from `file://`, you can serve it via HTTP:

```bash
# Option 1: Python SimpleHTTPServer
cd viewer
python3 -m http.server 8000

# Then open: http://localhost:8000/earth-viewer.html
```

```bash
# Option 2: Node.js http-server (if installed)
npx http-server viewer -p 8000

# Then open: http://localhost:8000/earth-viewer.html
```

### Controls

#### Hierarchy View

| Action | Control |
|--------|---------|
| Rotate view | Left-click and drag |
| Zoom | Mouse wheel |
| Pan | Right-click and drag |
| Select node | Left-click on node |
| Load children | Click "Load Children" button after selecting node |
| Switch layout | Click "Force" or "Spatial" buttons |

#### Explorer View

| Action | Control |
|--------|---------|
| Move forward | `W` |
| Move backward | `S` |
| Move left | `A` |
| Move right | `D` |
| Move up | `Space` |
| Move down | `Shift` |
| Look around | Move mouse (click canvas to lock pointer) |
| Exit pointer lock | `Esc` |

#### Global Controls

| Action | Control |
|--------|---------|
| Switch to Hierarchy | Click "Hierarchy" button |
| Switch to Explorer | Click "Explorer" button |
| Reset camera | Click "Reset Camera" button |
| Toggle help | Click "Help" button |

## UI Elements

### Controls Panel (Top Left)
- **View Mode**: Switch between Hierarchy and Explorer views
- **Layout**: Toggle between Force and Spatial layouts (Hierarchy view only)
- **Reset Camera**: Return camera to default position
- **Help**: Show/hide keyboard controls

### Info Panel (Top Right)
- Displays selected node information:
  - Name
  - Type (RMROOT, RMCOBJECT, RMTOBJECT, or RMPOBJECT)
  - ID
  - Number of children
  - Position coordinates
- **Load Children** button: Loads child nodes for selected node

### Stats Display (Top Center)
- FPS: Current frames per second
- Nodes: Total number of loaded nodes

### Loading Indicator (Bottom Center)
- Shows during data loading operations
- Displays current loading status and progress

### Help Overlay (Bottom Right)
- Quick reference for controls
- Toggleable with "Help" button

## Node Color Coding

Nodes are color-coded by type:
- **White** - RMROOT (Earth root)
- **Green** - RMCOBJECT (Containers)
- **Blue** - RMTOBJECT (Terrain)
- **Yellow** - RMPOBJECT (Placeables)

Node size also varies by hierarchy level (larger = higher in hierarchy).

## API Endpoints Used

The viewer connects to the following RP1 API endpoints:

- `https://cdn2.rp1.com/config/earth.msf` - Configuration
- `https://prod-map-earth.rp1.com/rmroot/update` - Root object
- `https://prod-map-earth.rp1.com/rmcobject/update?ix={id}` - Container objects
- `https://prod-map-earth.rp1.com/rmtobject/update?ix={id}` - Terrain objects
- `https://prod-map-earth.rp1.com/rmpobject/update?ix={id}` - Placeable objects

## Technical Details

### Dependencies

Loaded from CDN (no installation required):
- Three.js r160 (3D rendering engine)
- OrbitControls (Camera controls for Hierarchy view)

### Architecture

**Hierarchy View**:
- Custom force-directed graph algorithm
- Real-time physics simulation for node layout
- Spring forces between parent-child nodes
- Repulsion forces between all nodes
- Automatic link line updates

**Explorer View**:
- First-person camera controller
- WASD movement with mouse look
- Pointer-lock API for immersive controls
- Quaternion-based rotation (YXZ order)

**Data Management**:
- Progressive loading to minimize initial load time
- Map cache to track loaded nodes
- On-demand child loading
- Graceful error handling

### Browser Compatibility

Requires a modern browser with:
- WebGL support
- ES6+ JavaScript
- Pointer Lock API (for Explorer view)
- Canvas 2D (for text labels)

Tested on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Limitations

### Current Implementation

1. **Limited Initial Load**: Loads only first 10 RMCOBJECT nodes to prevent overwhelming the initial view
2. **Child Load Limit**: Loads maximum 20 children when expanding a node
3. **No Asset Loading**: External 3D models (glTF, FBX) referenced by `sAssetUrl` are not yet loaded
4. **Simple Geometry**: Uses bounding boxes instead of actual mesh geometry
5. **No Collision Detection**: Explorer view allows clipping through objects

### CORS Considerations

If loading from `file://` protocol, you may encounter CORS errors when fetching from `cdn2.rp1.com`. Solutions:

1. Serve via local HTTP server (recommended)
2. Use browser extensions to disable CORS (development only)
3. Run through the Node.js toolkit with a proxy server

## Future Enhancements

Potential improvements:
- [ ] glTF/FBX model loader for actual 3D assets
- [ ] Collision detection in Explorer view
- [ ] Minimap showing current position
- [ ] Search functionality for finding nodes by name
- [ ] Bookmarking favorite locations
- [ ] Export view as image/video
- [ ] VR support for immersive exploration
- [ ] Real-time WebSocket updates from live map changes
- [ ] Terrain height maps and textures
- [ ] Distance-based LOD (Level of Detail)

## Troubleshooting

### "Failed to load Earth map" Error

**Cause**: CORS restrictions or network issues

**Solutions**:
1. Serve the file via HTTP server instead of opening directly
2. Check browser console for specific error messages
3. Verify internet connection (needs access to cdn2.rp1.com)
4. Check if RP1 API endpoints are accessible

### Force Layout Nodes Overlapping

**Cause**: Too many nodes loaded at once or insufficient simulation time

**Solutions**:
1. Wait longer for simulation to settle
2. Switch to Spatial layout for exact positioning
3. Reload with fewer initial nodes

### Poor Performance / Low FPS

**Cause**: Too many nodes or slow hardware

**Solutions**:
1. Limit number of loaded nodes
2. Use Spatial layout (no physics simulation)
3. Close other applications
4. Try in a different browser

### Explorer View Controls Not Working

**Cause**: Pointer not locked or wrong view mode

**Solutions**:
1. Click on canvas to activate pointer lock
2. Ensure "Explorer" button is highlighted
3. Check browser console for errors
4. Try refreshing the page

## Integration with Toolkit

The viewer is a standalone component of the RP1 Protocol Toolkit. It complements:

- **tools/ws-analyzer.js** - WebSocket protocol analysis
- **tools/api-explorer.js** - HTTP API endpoint discovery
- **client/simple-client.js** - Reference protocol implementation
- **docs/** - Protocol specification and findings

Together, these tools provide comprehensive reverse engineering capabilities for the RP1 metaverse protocol.

## Credits

Built using:
- [Three.js](https://threejs.org/) - 3D JavaScript library
- RP1 Map API - Metaverse map data

Part of the RP1 Protocol Reverse Engineering Toolkit.
