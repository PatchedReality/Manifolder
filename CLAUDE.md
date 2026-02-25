## Tech stack
- Vanilla JavaScript (ES modules), no framework
- Three.js for 3D views (ViewGraph, ViewBounds, ViewResource)
- Socket.io via ManifolderClient for real-time communication with MVMF platform
- esbuild for bundling (`client/scripts/build.js`)
- `client/lib/ManifolderClient/` is a git submodule containing ManifolderClient and vendored MVMF SDK libraries — do not modify directly

## Architecture
- Follow MVC principles: Model is the single source of truth. Views reflect Model state. Do not spread state information across layers or maintain parallel state.
- Keep state at the lowest level: State belongs ON the objects themselves (e.g., `node.attached = true`), not in separate tracking collections (e.g., `_attachedNodes = new Set()`). Do not create parallel data structures to track object state.
- Event-driven: Views subscribe to Model via `model.on(event, handler)` and react to changes. Do not have views directly call other views.
- `NodeAdapter` wraps raw MVMF model objects with computed properties (`worldPos`, `worldRot`, `transform`, `bound`). Access node data through NodeAdapter, not raw model objects.
- `client/shared/node-types.js` is the single source of truth for type names, colors, and CSS variables. Derive type lookups from it rather than hardcoding.