import * as esbuild from 'esbuild';
import * as fs from 'fs';
import * as path from 'path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDir = path.join(__dirname, '..');
const watchMode = process.argv.includes('--watch');

const version = Math.floor(Date.now() / 1000);

console.log(
  `Building with version: ${version}${watchMode ? ' (watch mode)' : ''}`
);

const buildOptions = {
  entryPoints: [path.join(clientDir, 'js/app.js')],
  bundle: true,
  format: 'esm',
  outfile: path.join(clientDir, 'dist/app.bundle.js'),
  external: ['three', 'three/*', 'hls.js'],
  minify: !watchMode,
  sourcemap: true
};

let captureRevision;
const captureOptions = {
  entryPoints: [path.join(clientDir, 'js/capture.js')],
  bundle: true,
  format: 'esm',
  outfile: path.join(clientDir, 'dist/capture.bundle.js'),
  minify: true,
  plugins: [
    {
      name: 'capture-revision',
      setup(build) {
        build.onLoad({ filter: /[/\\]js[/\\]capture\.js$/ }, () => {
          const files = fs
            .readdirSync(path.join(clientDir, 'js'))
            .filter((name) => name.endsWith('.js'))
            .sort()
            .map((name) => path.join(clientDir, 'js', name));
          const sourceHash = createHash('sha256');
          for (const file of files)
            sourceHash
              .update(path.basename(file))
              .update(fs.readFileSync(file));
          const lockfile = path.join(clientDir, 'package-lock.json');
          sourceHash.update(fs.readFileSync(lockfile));
          captureRevision = `${execFileSync('git', ['rev-parse', 'HEAD'], { cwd: clientDir, encoding: 'utf8' }).trim()}:${sourceHash.digest('hex')}`;
          return {
            contents:
              `const CAPTURE_REVISION = ${JSON.stringify(captureRevision)};\n` +
              fs.readFileSync(path.join(clientDir, 'js/capture.js'), 'utf8'),
            loader: 'js',
            resolveDir: path.join(clientDir, 'js'),
            watchFiles: [...files, lockfile],
            watchDirs: [path.join(clientDir, 'js')]
          };
        });
        build.onEnd((result) => {
          if (result.errors.length) return;
          const captureDigest = createHash('sha256')
            .update(fs.readFileSync(captureOptions.outfile))
            .digest('hex');
          fs.writeFileSync(
            path.join(clientDir, 'dist/capture-manifest.json'),
            JSON.stringify(
              {
                contractVersion: 1,
                rendererRevision: captureRevision,
                bundleSha256: captureDigest,
                three: '0.160.0',
                hls: '1.5.7'
              },
              null,
              2
            ) + '\n'
          );
        });
      }
    }
  ]
};
for (const name of ['draco', 'basis']) {
  fs.cpSync(
    path.join(clientDir, 'node_modules/three/examples/jsm/libs', name),
    path.join(clientDir, 'dist', name),
    { recursive: true }
  );
}

if (watchMode) {
  const ctx = await esbuild.context(buildOptions);
  const capture = await esbuild.context(captureOptions);
  await capture.watch();
  await ctx.watch();
  console.log('Watching for changes...');
} else {
  await esbuild.build(captureOptions);
  await esbuild.build(buildOptions);
}

// Update app.html in place with versioned references for cache busting
const htmlPath = path.join(clientDir, 'app.html');
let html = fs.readFileSync(htmlPath, 'utf-8');

html = html.replace(
  /<script type="module" src="dist\/app\.bundle\.js[^"]*"><\/script>/,
  `<script type="module" src="dist/app.bundle.js?v=${version}"></script>`
);

html = html.replace(
  /<link rel="stylesheet" href="css\/style\.css[^"]*">/,
  `<link rel="stylesheet" href="css/style.css?v=${version}">`
);

html = html.replace(
  /<script src="lib\/ManifolderClient\/vendor\/mv\/([^"?]+)(\?v=\d+)?"><\/script>/g,
  `<script src="lib/ManifolderClient/vendor/mv/$1?v=${version}"></script>`
);

fs.writeFileSync(htmlPath, html);

console.log(`Build complete: dist/app.bundle.js?v=${version}`);
