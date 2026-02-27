# Manifolder Wiki

**Manifolder** is a web-based explorer for the [Open Metaverse](https://omb.wiki/) [Spatial Fabric](https://omb.wiki/en/spatial-fabric/architecture/), a hierarchical spatial data structure that describes everything from galaxies down to individual buildings. It provides interactive 2D and 3D views of map data, allowing developers and content creators to inspect node hierarchies, spatial bounds, and properties.

Manifolder is an open source project created and maintained by [Patched Reality, Inc.](https://patchedreality.com) and is publicly available at [patchedreality.com/manifolder](https://patchedreality.com/manifolder).

---

## Documentation

### Using Manifolder

| Page | Description |
|------|-------------|
| [Getting Started](Getting-Started.md) | Installation, building, and running locally |
| [User Guide](User-Guide.md) | Complete guide to the Manifolder interface |
| [Views](Views.md) | Deep dive into Graph, Bounds, and Resource views |
| [Bookmarks & Sharing](Bookmarks-and-Sharing.md) | Saving, restoring, and sharing view states |

### Understanding the Data

| Page | Description |
|------|-------------|
| [Data Model](Data-Model.md) | The Metaverse Spatial Fabric, node types, and type system |
| [Node Adapter](Node-Adapter.md) | How raw Fabric data is normalized for client use |

### Developer Guide

| Page | Description |
|------|-------------|
| [Architecture](Architecture.md) | High-level architecture, MVC pattern, data flow |
| [Model Layer](Model-Layer.md) | State management, events, tree operations |
| [ManifolderClient](ManifolderClient.md) | Communication with Fabric servers via MVMF |
| [View Layer](View-Layer.md) | How views subscribe to model events and render |
| [State Persistence](State-Persistence.md) | UIStateManager, localStorage, state migration |
| [Build System](Build-System.md) | esbuild bundling, watch mode, deployment |
| [Styling](Styling.md) | CSS architecture, variables, and theming |
| [API Reference](API-Reference.md) | Complete class and method reference |

### Related Projects

- **[ManifolderClient](https://github.com/PatchedReality/ManifolderClient)** — JavaScript client library for connecting to Fabric servers
- **[ManifolderMCP](https://github.com/PatchedReality/ManifolderMCP)** — MCP server that allows AI agents to browse and edit Fabric scenes
