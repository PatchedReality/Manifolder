import * as esbuild from 'esbuild';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDir = path.join(__dirname, '..');

const version = Math.floor(Date.now() / 1000);

console.log(`Building with version: ${version}`);

// Bundle the app
await esbuild.build({
  entryPoints: [path.join(clientDir, 'js/app.js')],
  bundle: true,
  format: 'esm',
  outfile: path.join(clientDir, 'dist/app.bundle.js'),
  external: ['three', 'three/*', 'hls.js'],
  minify: true,
  sourcemap: true,
});

// Update HTML to reference the bundle
const htmlPath = path.join(clientDir, 'app.html');
let html = fs.readFileSync(htmlPath, 'utf-8');

// Replace the module script src (handles both unbundled and previously bundled versions)
html = html.replace(
  /<script type="module" src="[^"]+"><\/script>\s*<\/body>/,
  `<script type="module" src="dist/app.bundle.js?v=${version}"></script>\n</body>`
);

// Also version the CSS
html = html.replace(
  /<link rel="stylesheet" href="css\/style\.css[^"]*">/,
  `<link rel="stylesheet" href="css/style.css?v=${version}">`
);

fs.writeFileSync(htmlPath, html);

console.log(`Build complete: dist/app.bundle.js?v=${version}`);