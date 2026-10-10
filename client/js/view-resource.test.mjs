import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

class Group {
  constructor() {
    this.children = []; this.parent = null; this.userData = {};
    this.position = { set() {} }; this.quaternion = { set() {} }; this.scale = { set() {} };
  }
  add(child) { child.parent?.remove(child); child.parent = this; this.children.push(child); }
  remove(child) { this.children = this.children.filter(value => value !== child); child.parent = null; }
  clone() {
    const clone = new Group(); clone.geometry = this.geometry; clone.material = this.material;
    for (const child of this.children) clone.add(child.clone());
    return clone;
  }
  traverse(callback) { callback(this); for (const child of this.children) child.traverse(callback); }
}

class Mesh extends Group {
  constructor(geometry, material) { super(); this.geometry = geometry; this.material = material; }
  applyMatrix4() {}
}

class HlsStub {
  static Events = { ERROR: 'error' };
  static isSupported() { return true; }
  on() {}
  loadSource() {}
  attachMedia(video) { this.video = video; }
  destroy() { this.destroyed = true; }
}

async function loadClass(name) {
  const sourcePath = process.env.VIEWER_JS_ROOT
    ? `${process.env.VIEWER_JS_ROOT}/view-${name}.js` : new URL(`./view-${name}.js`, import.meta.url);
  const source = await fs.readFile(sourcePath, 'utf8');
  const calls = { render: 0, controls: 0, rotators: 0, clock: 0, cancelled: [] };
  const context = vm.createContext({ console, setTimeout, clearTimeout, performance,
    document: { hidden: false }, fetch: async () => { throw Error('unexpected external request'); },
    requestAnimationFrame: () => 1, cancelAnimationFrame: id => calls.cancelled.push(id) });
  const imports = new Map();
  for (const match of source.matchAll(/import\s+(\*\s+as\s+\w+|\{[^}]*\}|\w+)\s+from\s+['"]([^'"]+)['"]/g)) {
    const names = imports.get(match[2]) || new Set();
    if (match[1].startsWith('{')) {
      for (const item of match[1].slice(1, -1).split(',')) names.add(item.trim().split(/\s+as\s+/)[0]);
    } else if (!match[1].startsWith('*')) names.add('default');
    imports.set(match[2], names);
  }
  const module = new vm.SourceTextModule(source, { context });
  await module.link(specifier => {
    const values = specifier === 'three' ? { Group, Mesh, Matrix4: class {}, TextureLoader: class {},
      VideoTexture: class { dispose() {} }, PlaneGeometry: class { dispose() {} },
      MeshBasicMaterial: class { constructor(options) { Object.assign(this, options); } dispose() {} } }
      : specifier === 'hls.js' ? { default: HlsStub }
      : { resolveResourceUrl: value => value, NodeAdapter: { getScopeResourceRoot: () => '' } };
    const names = [...new Set([...imports.get(specifier), ...Object.keys(values)])].filter(Boolean);
    return new vm.SyntheticModule(names, function () {
      for (const name of names) this.setExport(name, values[name]);
    }, { context });
  });
  await module.evaluate();
  return { Class: module.namespace[name === 'resource' ? 'ViewResource' : 'ViewBounds'], calls, context };
}

async function resource() {
  const { Class, calls, context } = await loadClass('resource');
  const view = Object.create(Class.prototype);
  Object.assign(view, {
    initialized: true, disposed: false, loadRequestId: 1, isLoading: false,
    container: { offsetHeight: 600, offsetWidth: 800, clientHeight: 600, clientWidth: 800 },
    scene: new Group(), contentGroup: new Group(), loadedModels: [],
    nodeGroups: new Map(), nodeResourceGroups: new Map(),
    glbCache: new Map(), metadataCache: new Map(), rotators: [], videoPlanes: [], hlsInstances: [],
    currentResourceUrl: null, currentRootKey: null, _wasHidden: false,
    model: { nodeKey: node => node.key, isNodeExpanded: node => !!node.expanded },
    _fetchSemaphore: { active: 0, limit: 1, queue: [] },
    clock: { getDelta: () => { calls.clock++; return 0.1; } },
    controls: { update: () => calls.controls++ },
    renderer: { render: () => calls.render++, setSize: () => {} },
    camera: { position: {}, updateProjectionMatrix: () => {} },
    sky: { position: { copy: () => {} } }, skyDome: { position: { copy: () => {} } },
  });
  view.scene.add(view.contentGroup);
  for (const name of ['clearBoundsGroup', '_positionGroundPlane', 'setStatus', 'setResourceMode',
    'setupModelMaterials', 'centerContentAtOrigin', 'applyWorldOrientation', 'updateBoundsDisplay',
    '_precomputeScale', 'fitCameraToContent', 'animateCameraToContent', 'updateGridFromContent']) view[name] = () => {};
  return { view, calls, context };
}

const tick = () => new Promise(resolve => setImmediate(resolve));

test('collapsing 6000 resources prunes models in one batch and retains a sibling', async () => {
  const { view } = await resource();
  for (let i = 0; i < 6000; i++) {
    const key = `node:${i}`, group = new Group(), model = new Group();
    group.add(model); view.contentGroup.add(group); view.loadedModels.push(model);
    view.nodeGroups.set(key, null); view.nodeResourceGroups.set(key, group);
  }
  const retained = new Group(); view.contentGroup.add(retained); view.loadedModels.push(retained);
  view.nodeGroups.set('retained', null);
  let checks = 0;
  const original = view._isInGroup;
  view._isInGroup = function (...args) { checks++; return original.apply(this, args); };
  view._removeStaleNodes(new Set(['retained']));
  assert.deepEqual(view.loadedModels, [retained]);
  assert.equal(view.nodeResourceGroups.size, 0);
  assert.ok(checks <= 6001, `expected linear membership checks, got ${checks}`);
});

test('failed GLB retries on expansion while completed siblings stay loaded', async () => {
  const { view } = await resource();
  const loads = []; let fail = true;
  view.gltfLoader = { load: (url, done, progress, error) => {
    loads.push(url);
    if (url === 'retry.glb' && fail) { fail = false; error(new Error('transient')); }
    else done({ scene: new Group() });
  } };
  const root = { key: 'root', expanded: true, children: [
    { key: 'ready', resourceUrl: 'ready.glb' }, { key: 'retry', resourceUrl: 'retry.glb' }
  ] };
  view.currentNode = root;
  await view._applySetNode(root);
  const ready = view.nodeResourceGroups.get('ready');
  root.children.push({ key: 'new', resourceUrl: 'new.glb' });
  await view._applySetNode(root);
  assert.equal(loads.filter(url => url === 'retry.glb').length, 2);
  assert.equal(loads.filter(url => url === 'ready.glb').length, 1);
  assert.equal(view.nodeResourceGroups.get('ready'), ready);
  assert.equal(view.loadedModels.length, 3);
});

test('removing a resource URL or child drops its model and rotator while retaining siblings', async () => {
  const { view } = await resource();
  view.loadDirectGlb = async (url, transform, requestId, group) => {
    const model = new Group(); group.add(model); view.loadedModels.push(model);
    if (url === 'removed.glb') view.rotators.push({ target: model, sourceNodeKey: null });
    return true;
  };
  const removed = { key: 'removed', resourceUrl: 'removed.glb' };
  const root = { key: 'root', expanded: true, children: [
    { key: 'retained', resourceUrl: 'retained.glb' }, removed
  ] };
  view.currentNode = root;
  await view._applySetNode(root);
  const retained = view.nodeResourceGroups.get('retained');
  delete removed.resourceUrl;
  await view._applySetNode(root);
  assert.equal(view.loadedModels.length, 1); assert.equal(view.rotators.length, 0);
  assert.equal(view.nodeResourceGroups.get('retained'), retained);
  removed.resourceUrl = 'removed.glb';
  await view._applySetNode(root);
  root.children.pop();
  await view._applySetNode(root);
  assert.equal(view.loadedModels.length, 1); assert.equal(view.rotators.length, 0);
  assert.equal(view.nodeResourceGroups.get('retained'), retained);
  assert.equal(view.nodeResourceGroups.has('removed'), false);
});

test('HTTP failure remains retryable and a successful JSON resource reports completion', async () => {
  const { view, context } = await resource();
  let requests = 0;
  context.fetch = async () => ({ ok: ++requests > 1, status: 503,
    headers: { get: () => 'application/json' }, json: async () => ({ lods: ['model.glb'] }) });
  view.gltfLoader = { load: (url, done) => done({ scene: new Group() }) };
  const node = { key: 'retry', resourceUrl: 'model.json' };
  await view._drawNode(node, view.contentGroup, view.loadRequestId, true);
  assert.equal(view.nodeResourceGroups.get(node.key).userData.resourceState.complete, false);
  view.loadRequestId++;
  await view._drawNode(node, view.contentGroup, view.loadRequestId, true);
  assert.equal(requests, 2);
  assert.equal(view.loadedModels.length, 1);
  assert.equal(view.nodeResourceGroups.get(node.key).userData.resourceState.complete, true);
});

test('hiding during the first root load still frames the completed content on resume', async () => {
  const { view } = await resource();
  const root = { key: 'new-root', resourceUrl: 'slow.glb' };
  view.currentNode = root;
  let callback, fits = 0;
  view.gltfLoader = { load: (url, done) => { callback = done; } };
  view.fitCameraToContent = () => fits++;
  const loading = view._applySetNode(root);
  await tick();
  view.container.offsetHeight = 0; view.onWindowResize();
  callback({ scene: new Group() }); await loading;
  view.container.offsetHeight = 600;
  view.gltfLoader = { load: (url, done) => done({ scene: new Group() }) };
  await view._applySetNode(root);
  assert.equal(fits, 1);
  assert.equal(view.contentGroup.userData.needsCameraFit, false);
});

test('suspending a camera animation leaves framing pending on the retained scene', async () => {
  const { view, calls } = await resource();
  view.cameraAnimationId = 7;
  view._suspendResourceLoads();
  assert.ok(calls.cancelled.includes(7));
  assert.equal(view.contentGroup.userData.needsCameraFit, true);
});

function videoMesh(view, group) {
  const mesh = new Group(), calls = { pause: 0, load: 0, destroy: 0, listeners: 0 };
  mesh.userData.isVideoPlane = true;
  mesh.userData.video = { src: 'stream.m3u8', pause: () => calls.pause++, load: () => calls.load++ };
  mesh.userData.hls = { destroy: () => calls.destroy++ };
  mesh.userData.releaseVideoListeners = () => calls.listeners++;
  group.add(mesh); view.videoPlanes.push(mesh); view.hlsInstances.push(mesh.userData.hls);
  return { mesh, calls };
}

test('video loader binds HLS ownership so removal shuts down the actual controller', async () => {
  const { view, context } = await resource();
  let pauses = 0, loads = 0;
  const video = { pause: () => pauses++, load: () => loads++,
    addEventListener() {}, removeEventListener() {} };
  context.document.createElement = () => video;
  view.fetchResourceJson = async () => ({ body: { streamConfig: { sources: ['stream.m3u8'] } } });
  const mesh = await view.loadVideoPlane('video.json', {}, null, view.loadRequestId, '');
  const controller = view.hlsInstances[0];
  assert.equal(mesh.userData.hls, controller);
  assert.equal(controller.video, video);
  const group = new Group(); group.add(mesh); view.contentGroup.add(group);
  view.nodeResourceGroups.set('video', group);
  view._removeNodeResource('video');
  assert.equal(controller.destroyed, true);
  assert.equal(pauses, 1); assert.equal(loads, 1);
  assert.equal(video.src, ''); assert.equal(view.videoPlanes.length, 0);
  assert.equal(view.hlsInstances.length, 0);
});

test('resource replacement releases video and HLS while retained sibling media stays active', async () => {
  const { view } = await resource();
  const removed = new Group(), retained = new Group();
  view.contentGroup.add(removed); view.contentGroup.add(retained);
  view.nodeResourceGroups.set('removed', removed);
  const a = videoMesh(view, removed), b = videoMesh(view, retained);
  view._removeNodeResource('removed');
  assert.deepEqual(a.calls, { pause: 1, load: 1, destroy: 1, listeners: 1 });
  assert.deepEqual(b.calls, { pause: 0, load: 0, destroy: 0, listeners: 0 });
  assert.deepEqual(view.videoPlanes, [b.mesh]);
  assert.equal(view.hlsInstances.length, 1);
  assert.equal(a.mesh.userData.video, null);
  view.clearScene();
  assert.equal(a.calls.destroy, 1); assert.equal(b.calls.destroy, 1);
});

test('cancelling a partial blueprint releases video and rotators before a retained-root retry', async () => {
  const { view } = await resource();
  let media;
  view.loadPhysicalObject = async () => {
    const temporary = new Group(); media = videoMesh(view, temporary);
    view.rotators.push({ target: media.mesh, sourceNodeKey: null });
    view.loadRequestId++;
    return media.mesh;
  };
  const result = await view.processBlueprintNode({ blueprintType: 'physical', resourceReference: 'video',
    children: [{ blueprintType: 'physical', resourceReference: 'later' }] }, view.loadRequestId);
  assert.equal(result, null);
  assert.equal(view.videoPlanes.length, 0); assert.equal(view.hlsInstances.length, 0);
  assert.equal(view.rotators.length, 0); assert.equal(media.calls.destroy, 1);
});

test('expanding the same scoped root preserves existing resource groups and caches', async () => {
  const { view } = await resource();
  const node = { key: 'scope-A:physical:23', resourceUrl: 'a.glb', expanded: true, children: [] };
  view.currentNode = node;
  view.currentRootKey = node.key;
  view.currentResourceUrl = `${node.key}:a.glb`;
  const content = view.contentGroup;
  const cached = new Group();
  view.glbCache.set('old.glb', cached);
  node.children.push({ key: 'scope-A:physical:24', resourceUrl: 'b.glb' });
  view.loadNodeHierarchy = async () => {};
  await view._applySetNode(node);
  assert.equal(view.contentGroup, content);
  assert.equal(view.glbCache.get('old.glb'), cached);
});

test('a different scope with the same local node ID is a new resource root', async () => {
  const { view } = await resource();
  const node = { key: 'scope-B:physical:23', resourceUrl: 'a.glb' };
  view.currentNode = node;
  view.currentRootKey = 'scope-A:physical:23';
  view.currentResourceUrl = 'scope-A:physical:23:a.glb';
  view.glbCache.set('old.glb', new Group());
  view.loadNodeHierarchy = async () => {};
  await view._applySetNode(node);
  assert.equal(view.glbCache.size, 0);
  assert.equal(view.currentRootKey, node.key);
});

test('no-resource selection invalidates queued GLB work before it starts decoding', async () => {
  const { view } = await resource();
  let decodes = 0;
  view.gltfLoader = { load: () => decodes++ };
  const oldId = view.loadRequestId;
  view._fetchSemaphore.active = 1;
  const load = view.loadDirectGlb('old.glb', null, oldId, new Group());
  await tick();
  const empty = { key: 'scope-A:physical:99' };
  view.currentNode = empty;
  await view._applySetNode(empty);
  assert.ok(view.loadRequestId > oldId);
  view._releaseFetchSlot();
  await load;
  assert.equal(decodes, 0);
  assert.equal(view._fetchSemaphore.active, 0);
  assert.equal(view.isLoading, false);
});

test('a late decoded GLB is disposed instead of attaching to a detached resource group', async () => {
  const { view } = await resource();
  let callback;
  view.gltfLoader = { load: (url, done) => { callback = done; } };
  const detached = new Group();
  const load = view.loadDirectGlb('old.glb', null, view.loadRequestId, detached);
  await tick();
  view.clearScene();
  let disposed = 0;
  const model = new Group(); model.geometry = { dispose: () => disposed++ };
  callback({ scene: model });
  await load;
  assert.equal(detached.children.length, 0);
  assert.equal(view.loadedModels.length, 0);
  assert.equal(disposed, 1);
});

test('changing a resource under a retained node reloads only that resource', async () => {
  const { view } = await resource();
  const node = { key: 'scope-A:physical:23', resourceUrl: 'a.glb' };
  const loads = [];
  view.loadDirectGlb = async (url, transform, id, group) => {
    loads.push(url); const model = new Group(); group.add(model); view.loadedModels.push(model); return true;
  };
  await view._drawNode(node, view.contentGroup, view.loadRequestId, true);
  const content = view.contentGroup;
  node.resourceUrl = 'b.glb';
  await view._drawNode(node, view.contentGroup, view.loadRequestId, true);
  assert.deepEqual(loads, ['a.glb', 'b.glb']);
  assert.equal(view.contentGroup, content);
  assert.equal(view.loadedModels.length, 1);
});

test('superseding an unfinished resource retries it without refetching completed siblings', async () => {
  const { view } = await resource();
  const a = { key: 'scope-A:physical:1', resourceUrl: 'ready.glb' };
  const b = { key: 'scope-A:physical:2', resourceUrl: 'pending.glb' };
  const loads = []; let resolve;
  view.loadDirectGlb = async url => { loads.push(url); if (loads.length === 2) await new Promise(done => resolve = done); return true; };
  await view._drawNode(a, view.contentGroup, view.loadRequestId, true);
  const pending = view._drawNode(b, view.contentGroup, view.loadRequestId, true);
  await tick(); view.loadRequestId++;
  await view._drawNode(a, view.contentGroup, view.loadRequestId, true);
  await view._drawNode(b, view.contentGroup, view.loadRequestId, true);
  resolve(); await pending;
  assert.deepEqual(loads, ['ready.glb', 'pending.glb', 'pending.glb']);
});

test('hidden resource views skip GPU rendering, controls, and rotator updates', async () => {
  const { view, calls } = await resource();
  view.container.offsetHeight = 0;
  view.updateRotators = () => calls.rotators++;
  view.animate();
  assert.equal(calls.render, 0); assert.equal(calls.controls, 0); assert.equal(calls.rotators, 0);
  assert.equal(calls.clock, 1);
});

test('hidden debounced resource application does no collection or loading', async () => {
  const { view } = await resource(); const node = { key: 'scope-A:physical:1' };
  view.currentNode = node; view.container.offsetHeight = 0;
  let collected = 0; view._collectResourceUrls = () => { collected++; return []; };
  await view._applySetNode(node);
  assert.equal(collected, 0);
});

test('restoring visibility refreshes the latest selected node through the existing resize path', async () => {
  const { view } = await resource(); const node = { key: 'scope-A:physical:1' };
  view.currentNode = node; view.container.offsetHeight = 0; view.container.clientHeight = 0;
  view.onWindowResize();
  const generation = view.loadRequestId;
  view.container.offsetHeight = view.container.clientHeight = 600;
  let selected; view.setNode = value => selected = value;
  view.onWindowResize();
  assert.equal(selected, node); assert.ok(generation > 1);
});

test('hidden bounds views skip controls and orbital work and reset elapsed-time baseline', async () => {
  const { Class, calls } = await loadClass('bounds');
  const view = Object.create(Class.prototype);
  Object.assign(view, { disposed: false, container: { offsetHeight: 0, offsetWidth: 800 },
    controls: { update: () => calls.controls++ }, lastFrameTime: 0, timeScale: 1,
    updateOrbitalPositions: () => { throw Error('hidden orbital work'); } });
  view.animate();
  assert.equal(calls.controls, 0); assert.ok(view.lastFrameTime > 0);
});

test('actual hierarchy expansion loads only the newly expanded resource', async () => {
  const { view } = await resource();
  const root = { key: 'scope-A:terrestrial:23', expanded: true, children: [
    { key: 'scope-A:physical:1', resourceUrl: 'ready.glb' }
  ] };
  view.currentNode = root;
  const loads = [];
  view.loadDirectGlb = async (url, transform, id, group) => {
    loads.push(url); const model = new Group(); group.add(model); view.loadedModels.push(model); return true;
  };
  await view._applySetNode(root);
  const retained = view.nodeResourceGroups.get(root.children[0].key);
  root.children.push({ key: 'scope-A:physical:2', resourceUrl: 'new.glb' });
  await view._applySetNode(root);
  assert.deepEqual(loads, ['ready.glb', 'new.glb']);
  assert.equal(view.nodeResourceGroups.get(root.children[0].key), retained);
  assert.equal(view.loadedModels.length, 2);
});

test('loader ownership preserves a retained cached clone when its sibling is removed', async () => {
  const { view } = await resource();
  let geometries = 0, materials = 0;
  const geometry = { dispose: () => geometries++ };
  const material = { dispose: () => materials++ };
  const template = new Group(); template.geometry = geometry; template.material = material;
  view.gltfLoader = { load: (url, done) => done({ scene: template }) };
  const clone = await view.loadGlb('shared.glb', view.loadRequestId, '');
  const retainedClone = await view.loadGlb('shared.glb', view.loadRequestId, '');
  const retained = new Group(); retained.add(retainedClone); view.contentGroup.add(retained);
  view.nodeResourceGroups.set('scope-A:physical:2', retained);
  view.loadedModels.push(retainedClone);
  const group = new Group(); group.add(clone); view.contentGroup.add(group);
  view.nodeResourceGroups.set('scope-A:physical:1', group);
  view.loadedModels.push(clone);
  view._removeNodeResource('scope-A:physical:1');
  assert.equal(geometries, 0); assert.equal(materials, 0);
  assert.equal(view.loadedModels.length, 1);
  assert.equal(retainedClone.parent, retained);
  view.clearScene();
  assert.equal(geometries, 1); assert.equal(materials, 1);
  assert.equal(view.glbCache.size, 0);
});

test('late metadata cannot repopulate a cache after an empty selection', async () => {
  const { view, context } = await resource();
  let resolveJson;
  context.fetch = async () => ({ ok: true, json: () => new Promise(resolve => resolveJson = resolve) });
  const loading = view.loadMetadata('old.json', '', view.loadRequestId);
  await tick(); view.clearScene(); resolveJson({ lods: ['old.glb'] });
  const result = await loading;
  assert.equal(result.metadata, null);
  assert.equal(view.metadataCache.size, 0);
});

test('late cached GLB decode is disposed without restoring the cleared cache', async () => {
  const { view } = await resource();
  let callback, disposed = 0;
  view.gltfLoader = { load: (url, done) => callback = done };
  const loading = view.loadGlb('old.glb', view.loadRequestId, '');
  await tick(); view.clearScene();
  const model = new Group(); model.geometry = { dispose: () => disposed++ };
  callback({ scene: model });
  assert.equal(await loading, null);
  assert.equal(disposed, 1); assert.equal(view.glbCache.size, 0);
});

test('hidden-tab transition invalidates work and visible frames still render', async () => {
  const { view, calls, context } = await resource();
  view.updateRotators = () => calls.rotators++;
  context.document.hidden = true;
  view.animate();
  assert.equal(calls.render, 0); assert.ok(view.loadRequestId > 1);
  context.document.hidden = false;
  view.currentNode = null;
  view.animate();
  assert.equal(calls.render, 1); assert.equal(calls.controls, 1); assert.equal(calls.rotators, 1);
});

test('retained-root redraw cannot perform post-load updates after scene cancellation', async () => {
  const { view } = await resource();
  const node = { key: 'scope-A:physical:1', resourceUrl: 'a.glb' };
  view.currentNode = node;
  view.loadDirectGlb = async () => true;
  await view._applySetNode(node);
  let resolveDraw, updates = 0;
  view._drawNode = () => new Promise(resolve => resolveDraw = resolve);
  view.applyWorldOrientation = () => updates++;
  const redraw = view._applySetNode(node);
  await tick(); view.clearScene(); resolveDraw(); await redraw;
  assert.equal(updates, 0);
});

test('swapping child resource URLs advances the load generation despite the same URL multiset', async () => {
  const { view } = await resource();
  const root = { key: 'scope-A:terrestrial:23', expanded: true, children: [
    { key: 'scope-A:physical:1', resourceUrl: 'a.glb' },
    { key: 'scope-A:physical:2', resourceUrl: 'b.glb' }
  ] };
  view.currentNode = root; view.loadDirectGlb = async () => true;
  await view._applySetNode(root);
  const generation = view.loadRequestId;
  [root.children[0].resourceUrl, root.children[1].resourceUrl] = [root.children[1].resourceUrl, root.children[0].resourceUrl];
  await view._applySetNode(root);
  assert.ok(view.loadRequestId > generation);
});

test('a 6000-resource root fetches one additional model when one child is added', async () => {
  const { view } = await resource();
  const root = { key: 'scope-A:terrestrial:23', expanded: true, children: Array.from({ length: 6000 }, (_, i) =>
    ({ key: `scope-A:physical:${i}`, resourceUrl: `building-${i}.glb` })) };
  view.currentNode = root;
  let fetches = 0; view.loadDirectGlb = async () => { fetches++; return true; };
  await view._applySetNode(root);
  assert.equal(fetches, 6000);
  root.children.push({ key: 'scope-A:physical:6000', resourceUrl: 'building-6000.glb' });
  await view._applySetNode(root);
  assert.equal(fetches, 6001);
});

test('capture rejects a failed required child instead of accepting partial siblings', async () => {
  const { view } = await resource(); view.captureMode = true;
  view.gltfLoader = { load: (url, done, progress, error) => url === 'bad.glb' ? error(new Error('failed')) : done({ scene: new Group() }) };
  await assert.rejects(view.loadNodeHierarchy({key:'root',expanded:true,children:[{key:'good',resourceUrl:'good.glb'},{key:'bad',resourceUrl:'bad.glb'}]},2), /capture_required_resource_failed/);
});

test('capture awaits delayed required asset and rejects unsupported active content', async () => {
  const { view } = await resource(); view.captureMode = true;
  let finish; view.gltfLoader = { load: (url, done) => { finish=done; } };
  let settled=false;
  const pending=view.loadNodeHierarchy({key:'root',resourceUrl:'slow.glb'},1).then(()=>{settled=true;});
  await tick(); assert.equal(settled,false);
  finish({scene:new Group()}); await pending; assert.equal(settled,true);
  await assert.rejects(view.loadPhysicalObject({resourceReference:'action://video'}), /capture_unsupported_content/);
});
