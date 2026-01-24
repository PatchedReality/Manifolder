import * as esbuild from 'esbuild';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDir = path.join(__dirname, '..');
const watchMode = process.argv.includes('--watch');

const version = Math.floor(Date.now() / 1000);

console.log(`Building with version: ${version}${watchMode ? ' (watch mode)' : ''}`);

const buildOptions = {
  entryPoints: [path.join(clientDir, 'js/app.js')],
  bundle: true,
  format: 'esm',
  outfile: path.join(clientDir, 'dist/app.bundle.js'),
  external: ['three', 'three/*', 'hls.js'],
  minify: !watchMode,
  sourcemap: true,
};

if (watchMode) {
  const ctx = await esbuild.context(buildOptions);
  await ctx.watch();
  console.log('Watching for changes...');
} else {
  await esbuild.build(buildOptions);
}

// Generate versioned HTML to dist/app.html (source app.html stays clean)
const srcHtmlPath = path.join(clientDir, 'app.html');
const distHtmlPath = path.join(clientDir, 'dist/app.html');
let html = fs.readFileSync(srcHtmlPath, 'utf-8');

// Version the module script (path stays same - deployed structure is flat)
html = html.replace(
  /<script type="module" src="[^"]+"><\/script>/,
  `<script type="module" src="dist/app.bundle.js?v=${version}"></script>`
);

// Version the CSS
html = html.replace(
  /<link rel="stylesheet" href="css\/style\.css[^"]*">/,
  `<link rel="stylesheet" href="css/style.css?v=${version}">`
);

// Version the lib/mvmf scripts
html = html.replace(
  /<script src="lib\/mvmf\/([^"?]+)(\?v=\d+)?"><\/script>/g,
  `<script src="lib/mvmf/$1?v=${version}"></script>`
);

fs.writeFileSync(distHtmlPath, html);

console.log(`Build complete: dist/app.bundle.js?v=${version}`);