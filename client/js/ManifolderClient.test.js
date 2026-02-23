import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

class MockNotification {
  constructor() {
    this._readyState = 0;
  }

  attachTo() {}

  detachFrom() {}

  ReadyState(nextState) {
    if (typeof nextState !== 'undefined') {
      this._readyState = nextState;
    }
    return this._readyState;
  }
}

globalThis.MV = {
  MVMF: {
    NOTIFICATION: MockNotification,
    Escape: (value) => value,
  },
  MVRP: {},
};

const {
  SingleScopeClient,
  ManifolderClient,
  asManifolderSubscriptionClient,
  asManifolderPromiseClient,
  createManifolderSubscriptionClient,
  createManifolderPromiseClient,
  normalizeUrl,
  computeRootScopeId,
  computeChildScopeId,
  computeNodeUid,
} = await import('./ManifolderClient.js');

const TEST_CLASS_IDS = Object.freeze({
  RMRoot: 70,
  RMCObject: 71,
  RMTObject: 72,
  RMPObject: 73,
});

test('scope utilities normalize URLs deterministically', async () => {
  const normalizedA = normalizeUrl('HTTPS://EXAMPLE.com:443//fabric//world.msf/');
  const normalizedB = normalizeUrl('https://example.com/fabric/world.msf');
  assert.equal(normalizedA, normalizedB);

  const rootA = await computeRootScopeId('https://example.com/fabric/world.msf');
  const rootB = await computeRootScopeId('https://EXAMPLE.com/fabric/world.msf/');
  const rootWithQuery = await computeRootScopeId('https://example.com/fabric/world.msf?tenant=1');
  assert.equal(rootA, rootB);
  assert.notEqual(rootA, rootWithQuery);

  const parentNodeUid = computeNodeUid(rootA, TEST_CLASS_IDS.RMPObject, 99);
  const childA = await computeChildScopeId(parentNodeUid, 'https://child.example.com/maps/a.msf/');
  const childB = await computeChildScopeId(parentNodeUid, 'https://CHILD.example.com/maps/a.msf');
  assert.equal(childA, childB);
  assert.match(childA, /^1_[a-f0-9]{16}$/);
});

test('computeNodeUid formats node identity with class prefix', () => {
  const uid = computeNodeUid('fs1_demo', TEST_CLASS_IDS.RMTObject, 123);
  assert.equal(uid, 'fs1_demo:terrestrial:123');
});

test('scope registry and cycle utility basics', () => {
  const client = new ManifolderClient();
  assert.deepEqual(client.listScopes(), []);

  client._registerScope({
    scopeId: 'A',
    fabricUrl: 'https://a.test/map.msf',
    parentScopeId: null,
    attachmentNodeUid: null,
    depth: 0,
  });
  client._registerScope({
    scopeId: 'B',
    fabricUrl: 'https://b.test/map.msf',
    parentScopeId: 'A',
    attachmentNodeUid: 'A:physical:1',
    depth: 1,
  });
  client._registerScope({
    scopeId: 'C',
    fabricUrl: 'https://c.test/map.msf',
    parentScopeId: 'B',
    attachmentNodeUid: 'B:physical:2',
    depth: 2,
  });

  const cycle = client._detectCycle('A', 'C');
  assert.deepEqual(cycle, { isCycle: true, existingScopeId: 'A' });
  assert.deepEqual(client._detectCycle('D', 'C'), { isCycle: false });
});

test('invalidate object cache across sibling scopes on the same fabric', () => {
  const client = new ManifolderClient();
  const runtimeA = new SingleScopeClient();
  const runtimeB = new SingleScopeClient();
  const runtimeC = new SingleScopeClient();
  const closeCalls = [];

  const attachCloseTracking = (runtime, label) => {
    runtime.pLnG = {
      Model_Open: () => ({ sID: 'RMPObject', twObjectIx: 42 }),
      Model_Close: (_model) => {
        closeCalls.push(label);
      },
    };
  };

  attachCloseTracking(runtimeA, 'A');
  attachCloseTracking(runtimeB, 'B');
  attachCloseTracking(runtimeC, 'C');

  runtimeA.objectCache.set('physical:42', { id: 'physical:42', sID: 'RMPObject', twObjectIx: 42 });
  runtimeB.objectCache.set('physical:42', { id: 'physical:42', sID: 'RMPObject', twObjectIx: 42 });
  runtimeC.objectCache.set('physical:42', { id: 'physical:42', sID: 'RMPObject', twObjectIx: 42 });

  client.scopeRuntimes.set('A', runtimeA);
  client.scopeRuntimes.set('B', runtimeB);
  client.scopeRuntimes.set('C', runtimeC);

  client._registerScope({
    scopeId: 'A',
    fabricUrl: 'https://example.com:443/fabric/shared.msf/',
    parentScopeId: null,
    attachmentNodeUid: null,
    depth: 0,
  });
  client._registerScope({
    scopeId: 'B',
    fabricUrl: 'https://EXAMPLE.com/fabric/shared.msf',
    parentScopeId: 'A',
    attachmentNodeUid: 'A:physical:10',
    depth: 1,
  });
  client._registerScope({
    scopeId: 'C',
    fabricUrl: 'https://other.example.com/fabric/other.msf',
    parentScopeId: null,
    attachmentNodeUid: null,
    depth: 0,
  });

  client._invalidateObjectCachesAcrossFabric('A', 'physical:42');

  assert.equal(runtimeA.objectCache.has('physical:42'), false);
  assert.equal(runtimeB.objectCache.has('physical:42'), false);
  assert.equal(runtimeC.objectCache.has('physical:42'), true);
  assert.deepEqual(closeCalls.sort(), ['A', 'B']);
});

test('concurrent connectRoot calls dedupe for same scope', async () => {
  const client = new ManifolderClient();
  const runtime = new SingleScopeClient();
  runtime._acquireBootstrapRequirements = () => {};
  runtime._releaseBootstrapRequirements = () => {};

  const fabricUrl = 'https://example.com/fabric/shared.msf';
  const scopeId = await computeRootScopeId(fabricUrl);
  client.scopeRuntimes.set(scopeId, runtime);
  client._registerScope({
    scopeId,
    fabricUrl,
    parentScopeId: null,
    attachmentNodeUid: null,
    depth: 0,
  });

  const originalMSF = globalThis.MV.MVRP.MSF;
  let openCalls = 0;
  globalThis.MV.MVRP.MSF = class FakeMSF {
    constructor() {
      openCalls += 1;
      this.pMSFConfig = { map: {} };
    }
    Attach(observer) {
      setTimeout(() => observer.connectResolve?.(), 0);
    }
    Detach() {}
  };
  globalThis.MV.MVRP.MSF.eMETHOD = { GET: 'GET' };

  try {
    const [a, b] = await Promise.all([
      client.connectRoot({ fabricUrl }),
      client.connectRoot({ fabricUrl }),
    ]);
    assert.equal(openCalls, 1);
    assert.equal(a.scopeId, scopeId);
    assert.equal(b.scopeId, scopeId);
  } finally {
    globalThis.MV.MVRP.MSF = originalMSF;
  }
});

test('cache invalidation applies to create/delete/move/bulk in multi-path scenario', async () => {
  const client = new ManifolderClient();
  const promiseClient = asManifolderPromiseClient(client);
  const scopeId = 'fs1_cache_scope';
  const runtime = new SingleScopeClient();
  const invalidated = [];

  const makeObject = (id, parentId) => ({
    id,
    parentId,
    name: id,
    transform: {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    },
    resourceReference: null,
    resourceName: null,
    bound: null,
    classId: TEST_CLASS_IDS.RMPObject,
    subtype: 0,
    children: [],
  });

  runtime.createObject = async (params) => makeObject('physical:101', params.parentId);
  runtime.deleteObject = async () => {};
  runtime.moveObject = async (objectId, newParentId) => makeObject(objectId, newParentId);
  runtime.bulkUpdate = async () => ({ success: 4, failed: 0, createdIds: ['physical:300'], errors: [] });
  runtime.objectCache.set('physical:11', { wClass_Parent: TEST_CLASS_IDS.RMPObject, twParentIx: 5 });
  runtime.objectCache.set('physical:12', { wClass_Parent: TEST_CLASS_IDS.RMPObject, twParentIx: 6 });

  client._invalidateObjectIdsAcrossFabric = (_scopeId, objectIds) => {
    invalidated.push(...objectIds.filter((value) => typeof value === 'string' && value.length > 0));
  };
  client.scopeRuntimes.set(scopeId, runtime);
  client._registerScope({
    scopeId,
    fabricUrl: 'https://example.com/fabric/shared.msf',
    parentScopeId: null,
    attachmentNodeUid: null,
    depth: 0,
  });

  await promiseClient.createObject({ scopeId, parentId: 'physical:10', name: 'created', objectType: 'physical' });
  await promiseClient.deleteObject({ scopeId, objectId: 'physical:11' });
  await promiseClient.moveObject({ scopeId, objectId: 'physical:12', newParentId: 'physical:99' });
  await promiseClient.bulkUpdate({
    scopeId,
    operations: [
      { type: 'create', params: { parentId: 'physical:20', name: 'new-child' } },
      { type: 'update', params: { objectId: 'physical:21', name: 'updated' } },
      { type: 'delete', params: { objectId: 'physical:22' } },
      { type: 'move', params: { objectId: 'physical:23', newParentId: 'physical:24' } },
    ],
  });

  const ids = new Set(invalidated);
  assert.equal(ids.has('physical:10'), true);
  assert.equal(ids.has('physical:11'), true);
  assert.equal(ids.has('physical:5'), true);
  assert.equal(ids.has('physical:12'), true);
  assert.equal(ids.has('physical:6'), true);
  assert.equal(ids.has('physical:99'), true);
  assert.equal(ids.has('physical:20'), true);
  assert.equal(ids.has('physical:21'), true);
  assert.equal(ids.has('physical:22'), true);
  assert.equal(ids.has('physical:23'), true);
  assert.equal(ids.has('physical:24'), true);
  assert.equal(ids.has('physical:300'), true);
});

test('operations reject with SCOPE_CLOSING when scope is closing', async () => {
  const client = new ManifolderClient();
  const promiseClient = asManifolderPromiseClient(client);
  const scopeId = 'fs1_closing_scope';
  client.closingScopes.add(scopeId);
  client.scopeRuntimes.set(scopeId, new SingleScopeClient());
  client._registerScope({
    scopeId,
    fabricUrl: 'https://example.com/fabric/shared.msf',
    parentScopeId: null,
    attachmentNodeUid: null,
    depth: 0,
  });

  await assert.rejects(
    () => promiseClient.getObject({ scopeId, objectId: 'physical:1' }),
    (error) => error?.code === 'SCOPE_CLOSING'
  );
});

test('lifecycle events carry scope attribution and child status does not override root status', () => {
  const client = new ManifolderClient();
  const rootRuntime = new SingleScopeClient();
  const childRuntime = new SingleScopeClient();

  client._registerScope({
    scopeId: 'fs1_root',
    fabricUrl: 'https://example.com/root.msf',
    parentScopeId: null,
    attachmentNodeUid: null,
    depth: 0,
  });
  client._registerScope({
    scopeId: 'fs1_child',
    fabricUrl: 'https://example.com/child.msf',
    parentScopeId: 'fs1_root',
    attachmentNodeUid: 'fs1_root:physical:7',
    depth: 1,
  });

  client._wireScopeRuntime('fs1_root', rootRuntime);
  client._wireScopeRuntime('fs1_child', childRuntime);

  const connectedScopes = [];
  const disconnectedScopes = [];
  const statuses = [];
  client.on('connected', (event) => connectedScopes.push(event.scopeId));
  client.on('disconnected', (event) => disconnectedScopes.push(event.scopeId));
  client.on('status', (status) => statuses.push(status));

  rootRuntime._emit('connected');
  childRuntime._emit('connected');
  childRuntime._emit('status', 'child-status');
  rootRuntime._emit('status', 'root-status');
  childRuntime._emit('disconnected');

  assert.deepEqual(connectedScopes, ['fs1_root', 'fs1_child']);
  assert.deepEqual(disconnectedScopes, ['fs1_child']);
  assert.deepEqual(statuses, ['root-status']);
});

test('followAttachment missing object returns ATTACHMENT_NOT_FOUND', async () => {
  const client = new ManifolderClient();
  const promiseClient = asManifolderPromiseClient(client);
  const scopeId = 'fs1_parent';
  const runtime = new SingleScopeClient();
  runtime.connected = true;
  runtime.openWithKnownType = async () => {
    throw new Error('Failed to open RMPObject with id 999');
  };

  client.scopeRuntimes.set(scopeId, runtime);
  client._registerScope({
    scopeId,
    fabricUrl: 'https://example.com/parent.msf',
    parentScopeId: null,
    attachmentNodeUid: null,
    depth: 0,
  });

  await assert.rejects(
    () => promiseClient.followAttachment({ scopeId, objectId: 'physical:999' }),
    (error) => error?.code === 'ATTACHMENT_NOT_FOUND'
      && error?.scopeId === scopeId
      && error?.details?.objectId === 'physical:999'
  );
});

test('followAttachment cycle preserves details.existingNodeUid/details.existingLabel', async () => {
  const client = new ManifolderClient();
  const promiseClient = asManifolderPromiseClient(client);
  const scopeId = 'fs1_parent';
  const attachmentId = 'physical:10';
  const childFabricUrl = 'https://child.example.com/fabric/world.msf';
  const attachmentNodeUid = `${scopeId}:physical:10`;
  const candidateChildScopeId = await computeChildScopeId(attachmentNodeUid, childFabricUrl);

  const parentRuntime = new SingleScopeClient();
  parentRuntime.connected = true;
  parentRuntime.objectCache.set(attachmentId, {
    IsReady: () => true,
    Child_Enum: () => {},
    wClass_Object: TEST_CLASS_IDS.RMPObject,
    twObjectIx: 10,
    twParentIx: 1,
    wClass_Parent: TEST_CLASS_IDS.RMRoot,
    pName: { wsRMPObjectId: 'Attachment Node' },
    pType: { bType: 0 },
    pTransform: {
      vPosition: { dX: 0, dY: 0, dZ: 0 },
      qRotation: { dX: 0, dY: 0, dZ: 0, dW: 1 },
      vScale: { dX: 1, dY: 1, dZ: 1 },
    },
    pResource: { sReference: childFabricUrl, sName: '' },
    nChildren: 0,
  });

  const existingRuntime = new SingleScopeClient();
  existingRuntime.pRMRoot = {
    wClass_Object: TEST_CLASS_IDS.RMRoot,
    twObjectIx: 1,
    pName: { wsRMPObjectId: 'Existing Root Label' },
  };

  client.scopeRuntimes.set(scopeId, parentRuntime);
  client.scopeRuntimes.set(candidateChildScopeId, existingRuntime);
  client._registerScope({
    scopeId: candidateChildScopeId,
    fabricUrl: childFabricUrl,
    parentScopeId: null,
    attachmentNodeUid: null,
    depth: 0,
  });
  client._registerScope({
    scopeId,
    fabricUrl: 'https://parent.example.com/fabric/world.msf',
    parentScopeId: candidateChildScopeId,
    attachmentNodeUid: `${candidateChildScopeId}:physical:1`,
    depth: 1,
  });

  await assert.rejects(
    () => promiseClient.followAttachment({ scopeId, objectId: attachmentId }),
    (error) => error?.code === 'ATTACHMENT_CYCLE_DETECTED'
      && error?.details?.existingNodeUid === `${candidateChildScopeId}:root:1`
      && typeof error?.details?.existingLabel === 'string'
  );
});

function formatTestObjectRef(classId, numericId) {
  const prefixes = {
    [TEST_CLASS_IDS.RMRoot]: 'root',
    [TEST_CLASS_IDS.RMCObject]: 'celestial',
    [TEST_CLASS_IDS.RMTObject]: 'terrestrial',
    [TEST_CLASS_IDS.RMPObject]: 'physical',
  };
  const prefix = prefixes[classId];
  if (!prefix) throw new Error(`Unknown class ID ${classId}`);
  if (classId === TEST_CLASS_IDS.RMRoot) return 'root';
  return `${prefix}:${numericId}`;
}

const LIVE_FIXTURE_PATH = 'test/fixtures/manifolder/live/latest.json';
let liveFixture = null;
if (existsSync(LIVE_FIXTURE_PATH)) {
  try {
    liveFixture = JSON.parse(readFileSync(LIVE_FIXTURE_PATH, 'utf-8'));
  } catch {
    liveFixture = null;
  }
}

function getRawNotice(handler, fallback, predicate = null) {
  const candidates = (liveFixture?.rawNotices || [])
    .filter((entry) => entry.handler === handler)
    .map((entry) => entry.notice);
  if (!predicate) {
    return candidates[0] || fallback;
  }
  const matched = candidates.find(predicate);
  return matched || fallback;
}

test('interface views expose only intended client surfaces', () => {
  const base = new ManifolderClient();
  const subscriptionClient = asManifolderSubscriptionClient(base);
  const promiseClient = asManifolderPromiseClient(base);

  assert.equal(typeof subscriptionClient.on, 'function');
  assert.equal(typeof subscriptionClient.connectRoot, 'function');
  assert.equal(typeof subscriptionClient.openModel, 'function');
  assert.equal('listScenes' in subscriptionClient, false);
  assert.equal('loadMap' in subscriptionClient, false);

  assert.equal(typeof promiseClient.connectRoot, 'function');
  assert.equal(typeof promiseClient.listScenes, 'function');
  assert.equal(typeof promiseClient.createObject, 'function');
  assert.equal('on' in promiseClient, false);
});

test('factory constructors expose isolated interface surfaces', () => {
  const subscriptionClient = createManifolderSubscriptionClient();
  const promiseClient = createManifolderPromiseClient();

  assert.equal(typeof subscriptionClient.connectRoot, 'function');
  assert.equal(typeof subscriptionClient.on, 'function');
  assert.equal('listScenes' in subscriptionClient, false);

  assert.equal(typeof promiseClient.connectRoot, 'function');
  assert.equal(typeof promiseClient.listScenes, 'function');
  assert.equal('openModel' in promiseClient, false);
});

test('interface surfaces invoke all contract methods with bound client context', async () => {
  const client = new ManifolderClient();
  const called = [];

  const allMethods = [
    'connectRoot',
    'closeScope',
    'getScopeStatus',
    'listScopes',
    'followAttachment',
    'getResourceRootUrl',
    'on',
    'off',
    'openModel',
    'closeModel',
    'enumerateChildren',
    'searchNodes',
    'listScenes',
    'openScene',
    'createScene',
    'deleteScene',
    'listObjects',
    'getObject',
    'createObject',
    'updateObject',
    'deleteObject',
    'moveObject',
    'bulkUpdate',
    'findObjects',
  ];

  for (const methodName of allMethods) {
    client[methodName] = function mockMethod(...args) {
      called.push({ methodName, args, self: this });
      if (methodName === 'on' || methodName === 'off' || methodName === 'openModel'
        || methodName === 'closeModel') {
        return undefined;
      }
      if (methodName === 'enumerateChildren') {
        return [];
      }
      return Promise.resolve({ methodName });
    };
  }

  const subscriptionClient = asManifolderSubscriptionClient(client);
  const promiseClient = asManifolderPromiseClient(client);

  await subscriptionClient.connectRoot({ fabricUrl: 'https://example.com/map.msf' });
  await subscriptionClient.closeScope({ scopeId: 'fs1_scope' });
  await subscriptionClient.getScopeStatus({ scopeId: 'fs1_scope' });
  await subscriptionClient.listScopes();
  await subscriptionClient.followAttachment({ scopeId: 'fs1_scope', objectId: 'physical:1' });
  subscriptionClient.getResourceRootUrl({ scopeId: 'fs1_scope' });
  subscriptionClient.on('status', () => {});
  subscriptionClient.off('status', () => {});
  subscriptionClient.openModel({ scopeId: 'fs1_scope', sID: 'RMPObject', twObjectIx: 1 });
  subscriptionClient.closeModel({ scopeId: 'fs1_scope', sID: 'RMPObject', twObjectIx: 1 });
  subscriptionClient.enumerateChildren({ scopeId: 'fs1_scope', model: {} });
  await subscriptionClient.searchNodes({ scopeId: 'fs1_scope', searchText: 'earth' });

  await promiseClient.connectRoot({ fabricUrl: 'https://example.com/map.msf' });
  await promiseClient.closeScope({ scopeId: 'fs1_scope' });
  await promiseClient.getScopeStatus({ scopeId: 'fs1_scope' });
  await promiseClient.listScopes();
  await promiseClient.followAttachment({ scopeId: 'fs1_scope', objectId: 'physical:1' });
  promiseClient.getResourceRootUrl({ scopeId: 'fs1_scope' });
  await promiseClient.listScenes({ scopeId: 'fs1_scope' });
  await promiseClient.openScene({ scopeId: 'fs1_scope', sceneId: 'physical:1' });
  await promiseClient.createScene({ scopeId: 'fs1_scope', name: 'scene' });
  await promiseClient.deleteScene({ scopeId: 'fs1_scope', sceneId: 'physical:1' });
  await promiseClient.listObjects({ scopeId: 'fs1_scope', anchorObjectId: 'physical:1' });
  await promiseClient.getObject({ scopeId: 'fs1_scope', objectId: 'physical:1' });
  await promiseClient.createObject({ scopeId: 'fs1_scope', parentId: 'root', name: 'obj' });
  await promiseClient.updateObject({ scopeId: 'fs1_scope', objectId: 'physical:1', name: 'obj2' });
  await promiseClient.deleteObject({ scopeId: 'fs1_scope', objectId: 'physical:1' });
  await promiseClient.moveObject({ scopeId: 'fs1_scope', objectId: 'physical:1', newParentId: 'physical:2' });
  await promiseClient.bulkUpdate({ scopeId: 'fs1_scope', operations: [] });
  await promiseClient.findObjects({ scopeId: 'fs1_scope', anchorObjectId: 'physical:1', query: { namePattern: 'x' } });

  const methodNamesSeen = new Set(called.map((entry) => entry.methodName));
  for (const methodName of allMethods) {
    assert.equal(methodNamesSeen.has(methodName), true, `Expected method to be called: ${methodName}`);
  }
  for (const entry of called) {
    assert.equal(entry.self, client, `Expected bound context for ${entry.methodName}`);
  }
});

test('openScene rejects invalid scene references', async () => {
  const client = new SingleScopeClient();
  client.connected = true;

  await assert.rejects(() => client.openScene('invalid'), /Invalid object reference/);
  await assert.rejects(() => client.openScene('unknown:1'), /Unknown class prefix/);
  await assert.rejects(() => client.openScene('physical:not-a-number'), /Invalid numeric ID/);
});

test('event emitter on/off keeps ordering and isolation', () => {
  const client = new ManifolderClient();
  const subscriptionClient = asManifolderSubscriptionClient(client);
  const calls = [];
  const first = (payload) => calls.push(`first:${payload.value}`);
  const second = (payload) => calls.push(`second:${payload.value}`);

  subscriptionClient.on('status', first);
  subscriptionClient.on('status', second);
  client._emit('status', { value: 1 });
  subscriptionClient.off('status', first);
  client._emit('status', { value: 2 });

  assert.deepEqual(calls, ['first:1', 'second:1', 'second:2']);
});

test('sendAction delegates action transport to _sendAction', async () => {
  const client = new SingleScopeClient();
  let sendCalled = false;
  const pIAction = {
    pRequest: {},
    Send() {
      sendCalled = true;
    },
  };
  const pObject = {
    Request(actionName) {
      assert.equal(actionName, 'NAME');
      return pIAction;
    },
  };

  let observedTimeout = 0;
  client._sendAction = async (action, timeoutMs) => {
    assert.equal(action, pIAction);
    observedTimeout = timeoutMs;
    return { nResult: 0 };
  };

  const response = await client.sendAction(
    pObject,
    'NAME',
    (payload) => {
      payload.wsRMPObjectId = 'Updated Name';
    },
    123,
  );

  assert.equal(observedTimeout, 123);
  assert.equal(pIAction.pRequest.wsRMPObjectId, 'Updated Name');
  assert.equal(sendCalled, false);
  assert.deepEqual(response, { nResult: 0 });
});

test('_sendAction times out when callback never returns', async () => {
  const client = new SingleScopeClient();
  const pIAction = {
    Send() {},
  };

  await assert.rejects(() => client._sendAction(pIAction, 10), /Request timeout/);
});

test('anonymous mode does not enforce scene CUD gating at the client layer', async () => {
  const client = new SingleScopeClient();
  client.connected = true;
  client.loggedIn = false;

  client.createObject = async (params) => {
    assert.equal(params.parentId, 'root');
    return { id: 'physical:77', classId: TEST_CLASS_IDS.RMPObject };
  };
  await assert.doesNotReject(() => client.createScene('test-scene'));

  client.pRMRoot = { wClass_Object: TEST_CLASS_IDS.RMRoot, twObjectIx: 1 };
  client.waitForReady = async () => {};
  client.sendAction = async () => ({ nResult: 0 });
  client._confirmMutation = async () => {};
  await assert.doesNotReject(() => client.deleteScene('physical:77'));
});

test('anonymous mode allows listScenes as a read operation', async () => {
  const client = new SingleScopeClient();
  client.connected = true;
  client.loggedIn = false;
  client.pRMRoot = {};
  client.waitForReady = async () => {};
  client.enumAllChildTypes = (_root, cb) => {
    cb({ wClass_Object: TEST_CLASS_IDS.RMPObject, twObjectIx: 1, pName: { wsRMPObjectId: 'Scene A' } });
  };

  const scenes = await client.listScenes();
  assert.deepEqual(scenes, [{
    id: 'physical:1',
    name: 'Scene A',
    rootObjectId: 'physical:1',
    classId: TEST_CLASS_IDS.RMPObject,
  }]);
});

test('rmxToFabricObject rejects unknown class IDs', () => {
  const client = new SingleScopeClient();
  assert.throws(
    () => client.rmxToFabricObject({ wClass_Object: 999, twObjectIx: 1, pName: { wsRMPObjectId: 'x' } }),
    /Unknown class ID/,
  );
});

test('getObjectName prefers physical, then terrestrial, then celestial name fields', () => {
  const client = new SingleScopeClient();
  assert.equal(client.getObjectName({ pName: { wsRMPObjectId: 'physical-name' } }), 'physical-name');
  assert.equal(client.getObjectName({ pName: { wsRMTObjectId: 'terrestrial-name' } }), 'terrestrial-name');
  assert.equal(client.getObjectName({ pName: { wsRMCObjectId: 'celestial-name' } }), 'celestial-name');
  assert.equal(client.getObjectName({ twObjectIx: 7 }), 'Object 7');
});

test('translateError applies rewrites and terminology substitutions', () => {
  const client = new SingleScopeClient();
  const rewritten = client.translateError(
    "Parent's Type_bType must be equal to SURFACE when its parent's class is RMCOBJECT",
  );
  assert.equal(
    rewritten,
    'celestial:surface is the only celestial type that accepts terrestrial children',
  );

  const translated = client.translateError('RMPOBJECT_OPEN failed for RMPObject');
  assert.match(translated, /create physical child/i);
  assert.match(translated, /physical/i);
});

test('formatResponseError includes translated server errors', () => {
  const client = new SingleScopeClient();
  const response = {
    nResult: 17,
    aResultSet: [[
      { sError: "Parent's Type_bType must be equal to PARCEL when its parent's class is RMTOBJECT" },
      { sError: 'RMPOBJECT_OPEN failed' },
    ]],
  };

  const message = client.formatResponseError('Create failed', response);
  assert.match(message, /^Create failed: error 17:/);
  assert.match(message, /terrestrial:parcel is the only terrestrial type that accepts physical children/);
  assert.match(message, /create physical child failed/i);
});

test('sendAction rejects missing SEARCH action with explicit message', async () => {
  const client = new SingleScopeClient();
  const pObject = { Request: () => null };
  await assert.rejects(
    () => client.sendAction(pObject, 'SEARCH', () => {}),
    /Search is only available for celestial or terrestrial roots/,
  );
});

test('sendAction rejects missing non-SEARCH actions with translated message', async () => {
  const client = new SingleScopeClient();
  const pObject = { Request: () => null };
  await assert.rejects(
    () => client.sendAction(pObject, 'RMPOBJECT_OPEN', () => {}),
    /Cannot create physical child under this parent type/,
  );
});

test('sendAction remaps generic timeout into action-specific timeout message', async () => {
  const client = new SingleScopeClient();
  const pIAction = { pRequest: {}, Send() {} };
  const pObject = { Request: () => pIAction };
  client._sendAction = async () => {
    throw new Error('Request timeout');
  };

  await assert.rejects(
    () => client.sendAction(pObject, 'NAME', () => {}),
    /Timeout waiting for NAME action response/,
  );
});

test('ensureConnected reconnects via stored connection details when disconnected', async () => {
  const client = new SingleScopeClient();
  client.connected = false;
  client.fabricUrl = 'https://example.com/map.msf';
  client.adminKey = 'secret';
  let called = null;

  client.connect = async (url, adminKey) => {
    called = { url, adminKey };
  };

  await client.ensureConnected();
  assert.deepEqual(called, { url: 'https://example.com/map.msf', adminKey: 'secret' });
});

test('ensureConnected throws when no connection context is available', async () => {
  const client = new SingleScopeClient();
  client.connected = false;
  client.fabricUrl = null;
  client.adminKey = null;
  await assert.rejects(() => client.ensureConnected(), /Not connected\. Call connect\(\) or connectRoot\(\) first/);
});

test('_collectSearchableIndices handles scene roots and direct scoped roots', () => {
  const client = new SingleScopeClient();

  const sceneRoot = {
    Child_Enum(type, _ctx, cb) {
      if (type === 'RMCObject') cb({ sID: 'RMCObject', twObjectIx: 11 });
      if (type === 'RMTObject') cb({ sID: 'RMTObject', twObjectIx: 22 });
    },
  };
  client._collectSearchableIndices(sceneRoot);
  assert.deepEqual(client.searchableRMCObjectIndices, [11]);
  assert.deepEqual(client.searchableRMTObjectIndices, [22]);

  client._collectSearchableIndices({ sID: 'RMCObject', twObjectIx: 5 });
  assert.deepEqual(client.searchableRMCObjectIndices, [5]);
  assert.deepEqual(client.searchableRMTObjectIndices, []);

  client._collectSearchableIndices({ sID: 'RMTObject', twObjectIx: 6 });
  assert.deepEqual(client.searchableRMCObjectIndices, []);
  assert.deepEqual(client.searchableRMTObjectIndices, [6]);
});

test('searchNodes aggregates matches and deduplicates unavailable object types', async () => {
  const client = new SingleScopeClient();
  client.connected = true;
  client.searchableRMCObjectIndices = [1];
  client.searchableRMTObjectIndices = [2];

  client._searchObjectType = async (objectType, objectIx) => ({
    matches: [{ id: objectIx }],
    paths: [{ id: objectIx + 100 }],
    unavailable: objectType === 'RMCObject' ? 'RMCObject' : 'RMCObject',
  });

  const result = await client.searchNodes('planet');
  assert.equal(result.matches.length, 2);
  assert.equal(result.paths.length, 2);
  assert.deepEqual(result.unavailable, ['RMCObject']);
});

test('_searchObjectType builds request payload and maps result sets', async () => {
  const client = new SingleScopeClient();
  const pIAction = { pRequest: {} };
  const model = {
    IsReady: () => true,
    Request: (name) => (name === 'SEARCH' ? pIAction : null),
  };
  client.pLnG = {
    Model_Open: (_type, _ix) => model,
  };

  client._sendAction = async () => ({
    nResult: 0,
    aResultSet: [
      [{
        ObjectHead_twObjectIx: 7,
        Name_wsRMCObjectId: 'Earth',
        Type_bType: 12,
        ObjectHead_wClass_Parent: 71,
        ObjectHead_twParentIx: 1,
      }],
      [{
        ObjectHead_twObjectIx: 1,
        Name_wsRMCObjectId: 'Solar',
        Type_bType: 9,
        ObjectHead_wClass_Parent: 70,
        ObjectHead_twParentIx: 1,
        nAncestor: 1,
        nOrder: 0,
      }],
    ],
  });

  const result = await client._searchObjectType('RMCObject', 123, 'EARTH');
  assert.equal(pIAction.pRequest.twRMCObjectIx, 123);
  assert.equal(pIAction.pRequest.sText, 'earth');
  assert.equal(result.matches[0].name, 'Earth');
  assert.equal(result.matches[0].parentType, 'RMCObject');
  assert.equal(result.paths[0].ancestorDepth, 1);
});

test('enumerateChildren returns all known child types', () => {
  const client = new SingleScopeClient();
  const model = {
    Child_Enum(type, _ctx, cb) {
      if (type === 'RMCObject') cb({ sID: 'RMCObject', twObjectIx: 1 });
      if (type === 'RMTObject') cb({ sID: 'RMTObject', twObjectIx: 2 });
      if (type === 'RMPObject') cb({ sID: 'RMPObject', twObjectIx: 3 });
    },
  };

  const children = client.enumerateChildren(model);
  assert.equal(children.length, 3);
  assert.deepEqual(children.map((c) => c.twObjectIx), [1, 2, 3]);
});

test('rmxToFabricObject sets children=null when children exist but are not loaded', () => {
  const client = new SingleScopeClient();
  client.enumAllChildTypes = (_obj, _cb) => {};

  const mapped = client.rmxToFabricObject({
    wClass_Object: TEST_CLASS_IDS.RMPObject,
    twObjectIx: 42,
    nChildren: 2,
    pName: { wsRMPObjectId: 'Cube' },
  });

  assert.equal(mapped.id, 'physical:42');
  assert.equal(mapped.name, 'Cube');
  assert.equal(mapped.children, null);
});

test('listScenes deduplicates scene IDs and maps names', async () => {
  const client = new SingleScopeClient();
  client.connected = true;
  client.loggedIn = true;
  client.pRMRoot = {};
  client.waitForReady = async () => {};
  client.enumAllChildTypes = (_root, cb) => {
    cb({ wClass_Object: TEST_CLASS_IDS.RMPObject, twObjectIx: 1, pName: { wsRMPObjectId: 'Scene A' } });
    cb({ wClass_Object: TEST_CLASS_IDS.RMPObject, twObjectIx: 1, pName: { wsRMPObjectId: 'Scene A Duplicate' } });
    cb({ wClass_Object: TEST_CLASS_IDS.RMTObject, twObjectIx: 2, pName: { wsRMTObjectId: 'Scene B' } });
  };

  const scenes = await client.listScenes();
  assert.equal(scenes.length, 2);
  assert.deepEqual(scenes.map((s) => s.id), ['physical:1', 'terrestrial:2']);
  assert.deepEqual(scenes.map((s) => s.name), ['Scene A', 'Scene B']);
});

test('createScene delegates to createObject with root parent and default bound', async () => {
  const client = new SingleScopeClient();
  client.loggedIn = true;
  let capturedParams = null;
  client.createObject = async (params) => {
    capturedParams = params;
    return { id: 'physical:99', classId: TEST_CLASS_IDS.RMPObject };
  };

  const scene = await client.createScene('My Scene');
  assert.deepEqual(capturedParams, {
    parentId: 'root',
    name: 'My Scene',
    objectType: undefined,
    bound: { x: 150, y: 150, z: 150 },
  });
  assert.deepEqual(scene, {
    id: 'physical:99',
    name: 'My Scene',
    rootObjectId: 'physical:99',
    classId: TEST_CLASS_IDS.RMPObject,
  });
});

test('getScopeStatus returns scope metadata and resource root URL', () => {
  const client = new ManifolderClient();
  const promiseClient = asManifolderPromiseClient(client);
  const runtime = new SingleScopeClient();
  runtime.connected = true;
  runtime.fabricUrl = 'https://example.com/map.msf';
  runtime.currentSceneId = 'physical:1';
  runtime.pFabric = { pMSFConfig: { map: { sRootUrl: 'https://cdn.example.com/resources/' } } };
  client.scopeRuntimes.set('fs1_test_scope', runtime);

  assert.deepEqual(promiseClient.getScopeStatus({ scopeId: 'fs1_test_scope' }), {
    scopeId: 'fs1_test_scope',
    connected: true,
    fabricUrl: 'https://example.com/map.msf',
    currentSceneId: 'physical:1',
    currentSceneName: null,
    resourceRootUrl: 'https://cdn.example.com/resources/',
  });
});

test('onInserted consumes MVMF notice shape and emits nodeInserted', () => {
  const client = new SingleScopeClient();
  client.connected = true;
  const notice = getRawNotice('onInserted', {
    pCreator: { sID: 'RMRoot', wClass_Object: TEST_CLASS_IDS.RMRoot, twObjectIx: 1 },
    pData: {
      pChild: {
        sID: 'RMPObject',
        wClass_Object: TEST_CLASS_IDS.RMPObject,
        twObjectIx: 42,
        pName: { wsRMPObjectId: 'Cube' },
      },
      pChange: { sType: 'RMPOBJECT_OPEN' },
    },
  }, (candidate) => Boolean(candidate?.pData?.pChild?.wClass_Object && candidate?.pData?.pChild?.twObjectIx));
  const parent = notice.pCreator;
  const child = notice.pData?.pChild;
  let emitted = null;
  client.on('nodeInserted', (payload) => {
    emitted = payload;
  });

  client.onInserted(notice);

  assert.equal(client.objectCache.get(formatTestObjectRef(child.wClass_Object, child.twObjectIx)), child);
  assert.deepEqual(emitted, {
    mvmfModel: child,
    parentType: parent.sID,
    parentId: parent.twObjectIx,
  });
});

test('onInserted derives parent metadata from child when creator metadata is missing', () => {
  const client = new SingleScopeClient();
  client.connected = true;
  const child = {
    sID: 'RMPObject',
    wClass_Object: TEST_CLASS_IDS.RMPObject,
    twObjectIx: 42,
    wClass_Parent: TEST_CLASS_IDS.RMRoot,
    twParentIx: 1,
    pName: { wsRMPObjectId: 'Cube' },
  };

  client.onInserted({
    pCreator: { sID: 'RMRoot', wClass_Object: null, twObjectIx: null },
    pData: { pChild: child, pChange: { sType: 'RMPOBJECT_OPEN' } },
  });

  const lastMutation = client.recentMutationEvents[client.recentMutationEvents.length - 1];
  assert.equal(lastMutation.parentClassId, TEST_CLASS_IDS.RMRoot);
  assert.equal(lastMutation.parentObjectId, 1);
});

test('onInserted prefers child parent metadata over creator metadata when they differ', () => {
  const client = new SingleScopeClient();
  client.connected = true;
  const child = {
    sID: 'RMPObject',
    wClass_Object: TEST_CLASS_IDS.RMPObject,
    twObjectIx: 45,
    wClass_Parent: TEST_CLASS_IDS.RMPObject,
    twParentIx: 12,
    pName: { wsRMPObjectId: 'Nested Child' },
  };

  client.onInserted({
    pCreator: { sID: 'RMRoot', wClass_Object: TEST_CLASS_IDS.RMRoot, twObjectIx: 1 },
    pData: { pChild: child, pChange: { sType: 'RMPOBJECT_OPEN' } },
  });

  const lastMutation = client.recentMutationEvents[client.recentMutationEvents.length - 1];
  assert.equal(lastMutation.parentClassId, TEST_CLASS_IDS.RMPObject);
  assert.equal(lastMutation.parentObjectId, 12);
});

test('onInserted does not auto-attach child model when observed from parent notification', () => {
  const client = new SingleScopeClient();
  let attachCalls = 0;
  const child = {
    sID: 'RMPObject',
    wClass_Object: TEST_CLASS_IDS.RMPObject,
    twObjectIx: 44,
    pName: { wsRMPObjectId: 'Attachable Child' },
    Attach() {
      attachCalls += 1;
    },
  };

  client.onInserted({
    pCreator: { sID: 'RMRoot', wClass_Object: TEST_CLASS_IDS.RMRoot, twObjectIx: 1 },
    pData: { pChild: child, pChange: { sType: 'RMPOBJECT_OPEN' } },
  });

  assert.equal(attachCalls, 0);
  assert.equal(client.attachedObjects.has(child), false);
  assert.equal(client.objectCache.get('physical:44'), child);
});

test('onInserted tolerates null child payload without emitting nodeInserted', () => {
  const client = new SingleScopeClient();
  client.connected = true;
  let emitted = false;
  client.on('nodeInserted', () => {
    emitted = true;
  });

  client.onInserted({
    pCreator: { sID: 'RMRoot', wClass_Object: TEST_CLASS_IDS.RMRoot, twObjectIx: 1 },
    pData: { pChild: null, pChange: null },
  });

  assert.equal(emitted, false);
});

test('onUpdated consumes MVMF notice shape and emits nodeUpdated', () => {
  const client = new SingleScopeClient();
  client.connected = true;
  const notice = getRawNotice('onUpdated', {
    pCreator: {
      sID: 'RMPObject',
      wClass_Object: TEST_CLASS_IDS.RMPObject,
      twObjectIx: 7,
      pName: { wsRMPObjectId: 'Creator' },
    },
    pData: {
      pChild: {
        sID: 'RMPObject',
        wClass_Object: TEST_CLASS_IDS.RMPObject,
        twObjectIx: 8,
        pName: { wsRMPObjectId: 'Child' },
      },
    },
  }, (candidate) => Boolean(candidate?.pData?.pChild?.wClass_Object && candidate?.pData?.pChild?.twObjectIx));
  const child = notice.pData?.pChild;
  let emitted = null;
  client.on('nodeUpdated', (payload) => {
    emitted = payload;
  });

  client.onUpdated(notice);

  assert.equal(client.objectCache.get(formatTestObjectRef(child.wClass_Object, child.twObjectIx)), child);
  assert.deepEqual(emitted, {
    id: child.twObjectIx,
    type: child.sID,
    mvmfModel: child,
  });
});

test('onUpdated tolerates null child payload and falls back to creator model', () => {
  const client = new SingleScopeClient();
  client.connected = true;
  const creator = { sID: 'RMPObject', wClass_Object: TEST_CLASS_IDS.RMPObject, twObjectIx: 1 };
  let emitted = null;
  client.on('nodeUpdated', (payload) => {
    emitted = payload;
  });

  client.onUpdated({
    pCreator: creator,
    pData: { pChild: null },
  });

  assert.deepEqual(emitted, {
    id: creator.twObjectIx,
    type: creator.sID,
    mvmfModel: creator,
  });
});

test('onDeleting consumes MVMF notice shape, evicts cache, and emits nodeDeleted', () => {
  const client = new SingleScopeClient();
  client.connected = true;
  const notice = getRawNotice('onDeleting', {
    pCreator: { sID: 'RMPObject', wClass_Object: TEST_CLASS_IDS.RMPObject, twObjectIx: 1 },
    pData: {
      pChild: {
        sID: 'RMPObject',
        wClass_Object: TEST_CLASS_IDS.RMPObject,
        twObjectIx: 9,
        pName: { wsRMPObjectId: 'Delete Me' },
      },
      pChange: { sType: 'RMPOBJECT_CLOSE' },
    },
  }, (candidate) => Boolean(candidate?.pData?.pChild?.wClass_Object && candidate?.pData?.pChild?.twObjectIx));
  const parent = notice.pCreator;
  const child = notice.pData?.pChild;
  const prefixedId = formatTestObjectRef(child.wClass_Object, child.twObjectIx);
  client.objectCache.set(prefixedId, child);
  let emitted = null;
  client.on('nodeDeleted', (payload) => {
    emitted = payload;
  });

  client.onDeleting(notice);

  assert.equal(client.objectCache.has(prefixedId), false);
  assert.deepEqual(emitted, {
    id: child.twObjectIx,
    type: child.sID,
    sourceParentType: parent.sID,
    sourceParentId: parent.twObjectIx,
  });
});

test('onDeleting tolerates null child payload without emitting nodeDeleted', () => {
  const client = new SingleScopeClient();
  client.connected = true;
  let emitted = false;
  client.on('nodeDeleted', () => {
    emitted = true;
  });

  client.onDeleting({
    pCreator: { sID: 'RMPObject', wClass_Object: TEST_CLASS_IDS.RMPObject, twObjectIx: 1 },
    pData: { pChild: null, pChange: null },
  });

  assert.equal(emitted, false);
});

test('onChanged uses pData.pChange.sType and child membership to classify insert/delete', () => {
  const client = new SingleScopeClient();
  const parent = {
    sID: 'RMPObject',
    wClass_Object: TEST_CLASS_IDS.RMPObject,
    twObjectIx: 1,
    IsReady: () => true,
  };
  const child = {
    sID: 'RMPObject',
    wClass_Object: TEST_CLASS_IDS.RMPObject,
    twObjectIx: 11,
    pName: { wsRMPObjectId: 'Child' },
  };
  const inserted = [];
  const deleted = [];
  client.on('nodeInserted', (payload) => inserted.push(payload));
  client.on('nodeDeleted', (payload) => deleted.push(payload));

  client.onChanged({
    pCreator: parent,
    pData: { pChild: child, pChange: { sType: 'RMPOBJECT_OPEN' } },
  });
  assert.equal(inserted.length, 1);
  assert.equal(deleted.length, 0);

  client._isChildOf = () => false;
  client.onChanged({
    pCreator: parent,
    pData: { pChild: child, pChange: { sType: 'SOMETHING_ELSE' } },
  });
  assert.equal(inserted.length, 1);
  assert.equal(deleted.length, 1);
  assert.deepEqual(deleted[0], {
    id: 11,
    type: 'RMPObject',
    sourceParentType: 'RMPObject',
    sourceParentId: 1,
  });
});

test('onChanged classifies present non-open child as update', () => {
  const client = new SingleScopeClient();
  const parent = {
    sID: 'RMPObject',
    wClass_Object: TEST_CLASS_IDS.RMPObject,
    twObjectIx: 1,
    IsReady: () => true,
  };
  const child = {
    sID: 'RMPObject',
    wClass_Object: TEST_CLASS_IDS.RMPObject,
    twObjectIx: 12,
    pName: { wsRMPObjectId: 'Updated Child' },
  };
  client._isChildOf = () => true;
  let updated = null;
  client.on('nodeUpdated', (payload) => {
    updated = payload;
  });

  client.onChanged({
    pCreator: parent,
    pData: { pChild: child, pChange: { sType: 'RMPOBJECT_NAME' } },
  });

  assert.deepEqual(updated, {
    id: 12,
    type: 'RMPObject',
    mvmfModel: child,
  });
  const lastMutation = client.recentMutationEvents[client.recentMutationEvents.length - 1];
  assert.equal(lastMutation.kind, 'updated');
  assert.equal(lastMutation.classId, TEST_CLASS_IDS.RMPObject);
  assert.equal(lastMutation.objectId, 12);
});

test('onChanged OPEN prefers child parent metadata and caches child model', () => {
  const client = new SingleScopeClient();
  const parent = {
    sID: 'RMRoot',
    wClass_Object: TEST_CLASS_IDS.RMRoot,
    twObjectIx: 1,
    IsReady: () => true,
  };
  const child = {
    sID: 'RMPObject',
    wClass_Object: TEST_CLASS_IDS.RMPObject,
    twObjectIx: 13,
    wClass_Parent: TEST_CLASS_IDS.RMPObject,
    twParentIx: 99,
    pName: { wsRMPObjectId: 'Nested Child' },
    Attach() {},
  };

  client.onChanged({
    pCreator: parent,
    pData: { pChild: child, pChange: { sType: 'RMPOBJECT_OPEN' } },
  });

  const lastMutation = client.recentMutationEvents[client.recentMutationEvents.length - 1];
  assert.equal(lastMutation.kind, 'inserted');
  assert.equal(lastMutation.parentClassId, TEST_CLASS_IDS.RMPObject);
  assert.equal(lastMutation.parentObjectId, 99);
  assert.equal(client.objectCache.get('physical:13'), child);
});

test('_confirmMutation resolves from recorded notification and throws on timeout', async () => {
  const client = new SingleScopeClient();
  const parent = { sID: 'RMRoot', wClass_Object: TEST_CLASS_IDS.RMRoot, twObjectIx: 1 };
  const child = {
    sID: 'RMPObject',
    wClass_Object: TEST_CLASS_IDS.RMPObject,
    twObjectIx: 100,
    pName: { wsRMPObjectId: 'Waited Child' },
  };

  const waitPromise = client._confirmMutation(
    (event) => event.kind === 'inserted' && event.childObjectId === 100,
    'insert child',
    50,
  );
  setTimeout(() => {
    client.onInserted({ pCreator: parent, pData: { pChild: child } });
  }, 0);
  await waitPromise;

  await assert.rejects(() => client._confirmMutation(
    () => false,
    'force timeout',
    5,
  ), /Timeout waiting for mutation notification: force timeout/);
});

test('_confirmMutation matches nested insert when notice creator differs from child parent', async () => {
  const client = new SingleScopeClient();
  const wait = client._confirmMutation(
    (event) => event.kind === 'inserted'
      && event.childClassId === TEST_CLASS_IDS.RMPObject
      && event.childObjectId === 501
      && event.parentClassId === TEST_CLASS_IDS.RMPObject
      && event.parentObjectId === 77,
    'nested insert',
    50,
  );

  client.onChanged({
    pCreator: {
      sID: 'RMRoot',
      wClass_Object: TEST_CLASS_IDS.RMRoot,
      twObjectIx: 1,
      IsReady: () => true,
    },
    pData: {
      pChild: {
        sID: 'RMPObject',
        wClass_Object: TEST_CLASS_IDS.RMPObject,
        twObjectIx: 501,
        wClass_Parent: TEST_CLASS_IDS.RMPObject,
        twParentIx: 77,
        pName: { wsRMPObjectId: 'Nested child' },
      },
      pChange: { sType: 'RMPOBJECT_OPEN' },
    },
  });

  await wait;
});

test('createObject confirmation matches inserted event when parent metadata is missing', async () => {
  const client = new SingleScopeClient();
  client.connected = true;
  client.pRMRoot = { wClass_Object: TEST_CLASS_IDS.RMRoot, twObjectIx: 1 };
  client.waitForReady = async () => {};
  client.sendAction = async () => ({
    nResult: 0,
    aResultSet: [[{ twRMPObjectIx: 321 }]],
  });
  let matched = false;
  client._confirmMutation = async (matchFn) => {
    matched = matchFn({
      kind: 'inserted',
      childClassId: TEST_CLASS_IDS.RMPObject,
      childObjectId: 321,
      parentClassId: null,
      parentObjectId: null,
      name: 'NoParentMetadata',
      timestamp: Date.now(),
    });
    assert.equal(matched, true);
  };

  const created = await client.createObject({ parentId: 'root', name: 'NoParentMetadata' });
  assert.equal(created.id, 'physical:321');
  assert.equal(matched, true);
});

test('createObject attaches cached parent model before sending action', async () => {
  const client = new SingleScopeClient();
  client.connected = true;
  let attachCalls = 0;
  const cachedParent = {
    sID: 'RMPObject',
    wClass_Object: TEST_CLASS_IDS.RMPObject,
    twObjectIx: 10,
    Attach() {
      attachCalls += 1;
    },
  };
  client.objectCache.set('physical:10', cachedParent);
  client.sendAction = async () => ({
    nResult: 0,
    aResultSet: [[{ twRMPObjectIx: 333 }]],
  });
  client._confirmMutation = async () => {};

  const created = await client.createObject({
    parentId: 'physical:10',
    name: 'Attached Parent Create',
    objectType: 'physical',
  });

  assert.equal(created.id, 'physical:333');
  assert.equal(attachCalls, 1);
  assert.equal(client.attachedObjects.has(cachedParent), true);
});

test('moveObject evicts moved object cache entry so later operations reload authoritative parent', async () => {
  const client = new SingleScopeClient();
  client.connected = true;
  const objectId = 'physical:17';
  const newParentId = 'physical:9';
  const movingObject = {
    sID: 'RMPObject',
    wClass_Object: TEST_CLASS_IDS.RMPObject,
    twObjectIx: 17,
    wClass_Parent: TEST_CLASS_IDS.RMPObject,
    twParentIx: 5,
    pName: { wsRMPObjectId: 'Movable' },
    pTransform: {
      vPosition: { dX: 0, dY: 0, dZ: 0 },
      qRotation: { dX: 0, dY: 0, dZ: 0, dW: 1 },
      vScale: { dX: 1, dY: 1, dZ: 1 },
    },
    pResource: {},
    pType: { bType: 0 },
  };
  client.objectCache.set(objectId, movingObject);
  client.objectCache.set(newParentId, {
    sID: 'RMPObject',
    wClass_Object: TEST_CLASS_IDS.RMPObject,
    twObjectIx: 9,
  });
  client.sendAction = async () => ({ nResult: 0 });
  client._confirmMutation = async () => {};

  const moved = await client.moveObject(objectId, newParentId, true);
  assert.equal(moved.parentId, newParentId);
  assert.equal(client.objectCache.has(objectId), false);
});

test('deleteObject confirmation matches deleted event when parent metadata is missing', async () => {
  const client = new SingleScopeClient();
  client.connected = true;
  const objectId = 'physical:17';
  const parentId = 'physical:5';
  client.objectCache.set(objectId, {
    wClass_Object: TEST_CLASS_IDS.RMPObject,
    twObjectIx: 17,
    wClass_Parent: TEST_CLASS_IDS.RMPObject,
    twParentIx: 5,
  });
  client.objectCache.set(parentId, {
    wClass_Object: TEST_CLASS_IDS.RMPObject,
    twObjectIx: 5,
  });
  client.sendAction = async () => ({ nResult: 0 });
  let matched = false;
  client._confirmMutation = async (matchFn) => {
    matched = matchFn({
      kind: 'deleted',
      classId: TEST_CLASS_IDS.RMPObject,
      objectId: 17,
      parentClassId: null,
      parentObjectId: null,
      timestamp: Date.now(),
    });
    assert.equal(matched, true);
  };

  await client.deleteObject(objectId);
  assert.equal(matched, true);
});
