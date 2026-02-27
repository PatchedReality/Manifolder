# Build System

**File**: `client/scripts/build.js`

Manifolder uses [esbuild](https://esbuild.github.io/) for JavaScript bundling.

## Build Configuration

```javascript
{
  entryPoints: ['client/js/app.js'],
  bundle: true,
  outfile: 'client/dist/app.bundle.js',
  format: 'esm',
  sourcemap: true,
  minify: true,              // false in watch mode
  external: ['three', 'three/*', 'hls.js']
}
```

### Key Settings

| Setting | Value | Reason |
|---------|-------|--------|
| `format` | `esm` | ES modules for native browser import |
| `sourcemap` | `true` | Always enabled for debugging |
| `minify` | `true` / `false` | Minified in production, readable in watch mode |
| `external` | `three`, `hls.js` | Loaded from CDN via import map, not bundled |

### External Dependencies

Three.js and HLS.js are excluded from the bundle because they're loaded from CDNs via the [import map](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap) in `app.html`:

```html
<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/",
    "hls.js": "https://cdn.jsdelivr.net/npm/hls.js@1.5.7/dist/hls.mjs"
  }
}
</script>
```

## Commands

### Production Build

```bash
cd client
npm run build
```

Runs esbuild with minification enabled. Output: `client/dist/app.bundle.js` + source map.

### Watch Mode

```bash
cd client
npm run watch
```

Watches `client/js/` for changes and rebuilds automatically. Minification is disabled for readable output.

### Tests

```bash
cd client
npm test
```

Runs the ManifolderClient test suite using Node.js's built-in `--test` runner.

## Cache Busting

After each build, the build script updates `app.html` with version query parameters:

```html
<!-- Before -->
<script src="dist/app.bundle.js?v=1709234567"></script>
<link href="css/style.css?v=1709234567">

<!-- After rebuild -->
<script src="dist/app.bundle.js?v=1709234890"></script>
<link href="css/style.css?v=1709234890">
```

The version is the current time in seconds since epoch. This applies to:
- The bundle script (`dist/app.bundle.js`)
- The stylesheet (`css/style.css`)
- All vendor SDK scripts (`lib/ManifolderClient/vendor/mv/*.js`)

## What Gets Bundled

The bundle includes all application JavaScript:
- `app.js` (entry point)
- `model.js`
- `node-adapter.js`
- All view files (`view-graph.js`, `view-bounds.js`, `view-resource.js`)
- All panel files (`hierarchy-panel.js`, `inspector-panel.js`)
- `layout.js`
- `bookmark-manager.js`
- `ui-state-manager.js`
- `node-factory.js`
- `scene-helpers.js`
- `geo-utils.js`
- `orbital-helpers.js`
- `shared/node-types.js`
- `lib/ManifolderClient/ManifolderClient.js`
- `lib/ManifolderClient/node-helpers.js`

### Not Bundled

- Three.js and addons (CDN via import map)
- HLS.js (CDN via import map)
- pako (CDN, loaded as global)
- MVMF vendor SDK libraries (loaded as script tags, expose globals)
- socket.io (loaded as vendor script)

## Deployment

Since Manifolder is a static web app, deployment involves:
1. Running `npm run build`
2. Uploading the `client/` directory contents to the web server

## Adding New Files

When adding a new JavaScript file:

1. Create the file in `client/js/`
2. Import it from an existing file in the bundle graph (usually `app.js` or another module that's already imported)
3. esbuild will automatically include it in the next build

No configuration changes are needed — esbuild follows import statements from the entry point.

## Dependencies

### Runtime (npm)

| Package | Version | Purpose |
|---------|---------|---------|
| `socket.io-client` | ^4.8.3 | Socket.io client for Fabric communication |
| `ws` | ^8.16.0 | WebSocket implementation |
| `xmlhttprequest-ssl` | ^2.1.2 | XMLHttpRequest polyfill |

### Dev (npm)

| Package | Version | Purpose |
|---------|---------|---------|
| `esbuild` | ^0.20.0 | JavaScript bundler |
| `typescript` | ^5.6.0 | Type checking (used for IDE support) |
