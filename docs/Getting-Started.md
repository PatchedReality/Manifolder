# Getting Started

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- npm (included with Node.js)
- A modern web browser (Chrome, Firefox, Safari, Edge)

## Installation

Clone the repository with its submodule:

```bash
git clone --recurse-submodules https://github.com/PatchedReality/Manifolder.git
cd Manifolder
```

If you've already cloned without submodules, initialize them:

```bash
git submodule update --init --recursive
```

Install dependencies:

```bash
cd client
npm install
```

## Building

### Production Build

```bash
npm run build
```

This bundles `client/js/app.js` into `client/dist/app.bundle.js` (minified, with source maps) and updates `client/app.html` with cache-busting version query parameters.

### Development (Watch Mode)

```bash
npm run watch
```

Watches for file changes and rebuilds automatically. Output is not minified in watch mode for easier debugging.

## Running Locally

Manifolder is a static web application — it needs a local HTTP server to run (ES modules require HTTP, not `file://`).

### Recommended: `dev/serve.sh`

The included dev server runs esbuild in watch mode and [browser-sync](https://browsersync.io/) together, so file changes automatically rebuild the bundle and refresh the browser:

```bash
./dev/serve.sh
```

This starts esbuild watch in the background and browser-sync with caching disabled (via `dev/bs-config.js`). It opens `client/app.html` automatically.

### Manual alternatives

Using Python:

```bash
cd client
python3 -m http.server 8080
```

Using Node.js (npx):

```bash
cd client
npx serve .
```

Then open `http://localhost:8080/app.html` in your browser.

With manual servers you'll need to run `npm run watch` separately in another terminal for automatic rebuilds.

## Loading a Map

When Manifolder opens, enter an MSF (Metaverse Spatial Fabric) URL in the toolbar and click **Load**. The default map is:

```
https://cdn2.rp1.com/config/enter.msf
```

You can also pass an MSF URL as a query parameter:

```
http://localhost:8080/app.html?msf=https://cdn2.rp1.com/config/enter.msf
```

## Running Tests

```bash
cd client
npm test
```

This runs the ManifolderClient test suite using Node.js's built-in test runner.

## Project Layout

```
Manifolder/
├── client/                     # Web application
│   ├── app.html                # HTML entry point
│   ├── js/                     # Application JavaScript (ES modules)
│   │   ├── app.js              # Main orchestrator
│   │   ├── model.js            # MVC Model (state management)
│   │   ├── node-adapter.js     # Wraps raw MVMF objects
│   │   ├── view-graph.js       # Force-directed graph view
│   │   ├── view-bounds.js      # 3D spatial bounds view
│   │   ├── view-resource.js    # 3D model/asset viewer
│   │   ├── hierarchy-panel.js  # Tree navigation panel
│   │   ├── inspector-panel.js  # Property inspector panel
│   │   ├── layout.js           # Panel layout management
│   │   ├── bookmark-manager.js # Bookmark save/load/share
│   │   ├── ui-state-manager.js # UI state persistence
│   │   ├── node-factory.js     # Resource data loading
│   │   ├── scene-helpers.js    # Three.js utilities
│   │   ├── geo-utils.js        # Geographic calculations
│   │   └── orbital-helpers.js  # Orbital mechanics
│   ├── css/
│   │   └── style.css           # All styles (dark theme)
│   ├── shared/
│   │   └── node-types.js       # Node type definitions (colors, names)
│   ├── lib/
│   │   └── ManifolderClient/   # Git submodule (Fabric client library)
│   ├── dist/
│   │   └── app.bundle.js       # Built output
│   └── scripts/
│       └── build.js            # esbuild configuration
├── scripts/                    # Standalone utility scripts
├── docs/                       # Documentation
├── README.md
├── CLAUDE.md                   # AI assistant instructions
├── LICENSE                     # Apache 2.0
└── deploy.sh                   # Deployment script
```

## External Dependencies

Manifolder loads several libraries from CDNs (configured in `app.html`):

| Library | Version | Purpose |
|---------|---------|---------|
| [Three.js](https://threejs.org/) | 0.160.0 | 3D rendering (Graph, Bounds, Resource views) |
| [HLS.js](https://github.com/video-dev/hls.js/) | 1.5.7 | Video texture streaming |
| [pako](https://github.com/nicmart/pako) | 2.1.0 | Compression for URL sharing |

npm dependencies (bundled by esbuild):

| Package | Purpose |
|---------|---------|
| socket.io-client | Real-time communication with Fabric servers |
| ws | WebSocket support |
| esbuild (dev) | JavaScript bundling |

## Next Steps

- Read the [User Guide](User-Guide.md) to learn how to use Manifolder
- Read the [Architecture](Architecture.md) overview to understand how the code is structured
- Explore the [Data Model](Data-Model.md) to understand the Spatial Fabric hierarchy
