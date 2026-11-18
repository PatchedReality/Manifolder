import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtemp,
  mkdir,
  copyFile,
  writeFile,
  readFile,
  rm,
  symlink
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { createHash } from 'node:crypto';

test('watch rebuilds capture output and its revision and digest after a source edit', async () => {
  const root = await mkdtemp(join(tmpdir(), 'capture-watch-'));
  let child;
  let output = '';
  const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
  const waitFor = async (condition) => {
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline) {
      if (child.exitCode !== null) throw new Error(output);
      if (await condition()) return;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    assert.fail(
      'Capture watcher did not rebuild within its test deadline. ' + output
    );
  };
  try {
    await mkdir(join(root, 'scripts'));
    await mkdir(join(root, 'js'));
    await writeFile(join(root, 'package.json'), '{"type":"module"}');
    await writeFile(join(root, 'package-lock.json'), '{}');
    await writeFile(
      join(root, 'app.html'),
      '<script type="module" src="dist/app.bundle.js"></script>'
    );
    await writeFile(join(root, 'js/app.js'), 'console.log("app");');
    const entry = 'console.log(CAPTURE_REVISION, "first");';
    await writeFile(join(root, 'js/capture.js'), entry);
    await copyFile(
      new URL('./build.js', import.meta.url),
      join(root, 'scripts/build.js')
    );
    await symlink(
      fileURLToPath(new URL('../node_modules', import.meta.url)),
      join(root, 'node_modules')
    );
    execFileSync('git', ['init', '-q', root]);
    execFileSync('git', ['add', '.'], { cwd: root });
    execFileSync(
      'git',
      [
        '-c',
        'user.name=Capture Test',
        '-c',
        'user.email=capture@example.test',
        '-c',
        'core.hooksPath=/dev/null',
        'commit',
        '-qm',
        'capture fixture'
      ],
      { cwd: root }
    );
    child = spawn(process.execPath, ['scripts/build.js', '--watch'], {
      cwd: root
    });
    child.stdout.on('data', (data) => {
      output += data;
    });
    child.stderr.on('data', (data) => {
      output += data;
    });
    const manifest = () =>
      readFile(join(root, 'dist/capture-manifest.json'), 'utf8')
        .then(JSON.parse)
        .catch(() => null);
    await waitFor(async () => Boolean(await manifest()));
    const first = await manifest();
    await writeFile(
      join(root, 'js/capture.js'),
      entry.replace('first', 'second')
    );
    await waitFor(async () => {
      const next = await manifest();
      return next && next.rendererRevision !== first.rendererRevision;
    });
    const next = await manifest();
    const bytes = await readFile(join(root, 'dist/capture.bundle.js'));
    assert.notEqual(next.bundleSha256, first.bundleSha256);
    assert.equal(next.bundleSha256, digest(bytes));
    assert.ok(bytes.toString().includes(next.rendererRevision));
    assert.ok(bytes.toString().includes('second'));
  } finally {
    if (child && child.exitCode === null) {
      child.kill('SIGTERM');
      await once(child, 'exit');
    }
    await rm(root, { recursive: true, force: true });
  }
});
