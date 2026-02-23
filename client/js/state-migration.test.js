import test from 'node:test';
import assert from 'node:assert/strict';
import { deflateRawSync, inflateRawSync } from 'node:zlib';

import { UIStateManager } from './ui-state-manager.js';
import { BookmarkManager } from './bookmark-manager.js';

function createMemoryStorage() {
  const store = new Map();
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, `${value}`);
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    }
  };
}

function decodePayload(url) {
  const search = new URL(url).search;
  const params = new URLSearchParams(search);
  const loc = params.get('loc');
  const base64 = loc.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const compressed = Buffer.from(padded, 'base64');
  const json = inflateRawSync(compressed).toString('utf8');
  return JSON.parse(json);
}

test('UI state migration upgrades legacy keys to scoped node UIDs', () => {
  globalThis.localStorage = createMemoryStorage();
  globalThis.window = {
    location: { href: 'https://app.example.com/' },
    top: { location: { href: 'https://app.example.com/' } }
  };

  const manager = new UIStateManager();
  const migrated = manager.migrate({
    version: 1,
    navigation: {
      mapUrl: 'https://maps.example.com/root.msf',
      selectedNodePath: [{ type: 'RMRoot', id: 1 }, { type: 'RMCObject', id: 104 }]
    },
    hierarchy: {
      expandedNodeIds: [{ key: 'RMRoot_1', parent: null }, { key: 'RMCObject_104', parent: 'RMRoot_1' }]
    }
  }, 'fs1_rootscope');

  assert.equal(migrated.version, 2);
  assert.deepEqual(migrated.navigation.selectedNodePath, [
    { nodeUid: 'fs1_rootscope:root:1', type: 'RMRoot', id: 1 },
    { nodeUid: 'fs1_rootscope:celestial:104', type: 'RMCObject', id: 104 }
  ]);
  assert.deepEqual(migrated.hierarchy.expandedNodeIds, [
    {
      nodeUid: 'fs1_rootscope:root:1',
      parentNodeUid: null,
      key: 'fs1_rootscope:root:1',
      parent: null
    },
    {
      nodeUid: 'fs1_rootscope:celestial:104',
      parentNodeUid: 'fs1_rootscope:root:1',
      key: 'fs1_rootscope:celestial:104',
      parent: 'fs1_rootscope:root:1'
    }
  ]);
});

test('bookmark share encode/decode roundtrip preserves scoped identities', () => {
  globalThis.localStorage = createMemoryStorage();
  globalThis.window = {
    location: { href: 'https://app.example.com/view' },
    top: { location: { href: 'https://app.example.com/view' } }
  };
  globalThis.btoa = (str) => Buffer.from(str, 'binary').toString('base64');
  globalThis.atob = (b64) => Buffer.from(b64, 'base64').toString('binary');
  globalThis.pako = {
    deflate(input) {
      return deflateRawSync(Buffer.from(input, 'utf8'));
    },
    inflate(input, options) {
      const out = inflateRawSync(Buffer.from(input));
      if (options?.to === 'string') {
        return out.toString('utf8');
      }
      return new Uint8Array(out);
    }
  };

  const stateManager = new UIStateManager();
  stateManager.state = stateManager.migrate({
    version: 2,
    navigation: {
      mapUrl: 'https://maps.example.com/root.msf',
      selectedNodePath: [
        { nodeUid: 'fs1_scope:root:1', type: 'RMRoot', id: 1 },
        { nodeUid: 'fs1_scope:terrestrial:10', type: 'RMTObject', id: 10 }
      ]
    },
    hierarchy: {
      expandedNodeIds: [
        { nodeUid: 'fs1_scope:root:1', parentNodeUid: null, key: 'fs1_scope:root:1', parent: null },
        {
          nodeUid: 'fs1_scope:terrestrial:10',
          parentNodeUid: 'fs1_scope:root:1',
          key: 'fs1_scope:terrestrial:10',
          parent: 'fs1_scope:root:1'
        }
      ]
    },
    viewBounds: {
      typeFilter: ['Root', 'Sector', 'Parcel'],
      orbitsVisible: false
    }
  });

  const bookmarks = new BookmarkManager(stateManager);
  const url = bookmarks.encodeStateToUrl();
  const decoded = bookmarks.decodeStateFromUrl(new URL(url).search);

  assert.equal(decoded.navigation.mapUrl, 'https://maps.example.com/root.msf');
  assert.deepEqual(decoded.navigation.selectedNodePath, [
    { nodeUid: 'fs1_scope:root:1', type: 'RMRoot', id: 1 },
    { nodeUid: 'fs1_scope:terrestrial:10', type: 'RMTObject', id: 10 }
  ]);
  assert.deepEqual(decoded.hierarchy.expandedNodeIds, [
    {
      nodeUid: 'fs1_scope:root:1',
      parentNodeUid: null,
      key: 'fs1_scope:root:1',
      parent: null
    },
    {
      nodeUid: 'fs1_scope:terrestrial:10',
      parentNodeUid: 'fs1_scope:root:1',
      key: 'fs1_scope:terrestrial:10',
      parent: 'fs1_scope:root:1'
    }
  ]);
  assert.equal(decoded.viewBounds.orbitsVisible, false);
});

test('decodeStateFromUrl migrates legacy v1 payload (no scopes array) to scope-native state', () => {
  globalThis.localStorage = createMemoryStorage();
  globalThis.window = {
    location: { href: 'https://app.example.com/view' },
    top: { location: { href: 'https://app.example.com/view' } }
  };
  globalThis.btoa = (str) => Buffer.from(str, 'binary').toString('base64');
  globalThis.atob = (b64) => Buffer.from(b64, 'base64').toString('binary');
  globalThis.pako = {
    deflate(input) {
      return deflateRawSync(Buffer.from(input, 'utf8'));
    },
    inflate(input, options) {
      const out = inflateRawSync(Buffer.from(input));
      if (options?.to === 'string') {
        return out.toString('utf8');
      }
      return new Uint8Array(out);
    }
  };

  const stateManager = new UIStateManager();
  const bookmarks = new BookmarkManager(stateManager);
  const legacyPayload = {
    m: 'https://maps.example.com/root.msf',
    p: 'R1,T10',
    e: 'T10:R1',
    o: 0
  };
  const loc = deflateRawSync(Buffer.from(JSON.stringify(legacyPayload), 'utf8'))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
  const decoded = bookmarks.decodeStateFromUrl(`?loc=${loc}`);

  assert.equal(decoded.version, 2);
  assert.equal(decoded.navigation.mapUrl, 'https://maps.example.com/root.msf');
  assert.deepEqual(decoded.navigation.selectedNodePath, [
    { nodeUid: null, type: 'RMRoot', id: 1 },
    { nodeUid: null, type: 'RMTObject', id: 10 }
  ]);
  assert.equal(Array.isArray(decoded.hierarchy.expandedNodeIds), true);
  assert.equal(decoded.viewBounds.orbitsVisible, false);
});

test('share payload budget trims expansion state before failing', () => {
  globalThis.localStorage = createMemoryStorage();
  globalThis.window = {
    location: { href: 'https://app.example.com/view' },
    top: { location: { href: 'https://app.example.com/view' } }
  };
  globalThis.btoa = (str) => Buffer.from(str, 'binary').toString('base64');
  globalThis.atob = (b64) => Buffer.from(b64, 'base64').toString('binary');
  globalThis.pako = {
    deflate(input) {
      return deflateRawSync(Buffer.from(input, 'utf8'));
    },
    inflate(input, options) {
      const out = inflateRawSync(Buffer.from(input));
      if (options?.to === 'string') {
        return out.toString('utf8');
      }
      return new Uint8Array(out);
    }
  };

  const stateManager = new UIStateManager();
  const expandedNodeIds = [];
  for (let i = 0; i < 200; i += 1) {
    expandedNodeIds.push({
      nodeUid: `fs1_scope:physical:${1000 + i}`,
      parentNodeUid: 'fs1_scope:root:1',
      key: `fs1_scope:physical:${1000 + i}`,
      parent: 'fs1_scope:root:1'
    });
  }

  stateManager.state = stateManager.migrate({
    version: 2,
    navigation: {
      mapUrl: 'https://maps.example.com/root.msf',
      selectedNodePath: [
        { nodeUid: 'fs1_scope:root:1', type: 'RMRoot', id: 1 }
      ]
    },
    hierarchy: { expandedNodeIds },
    viewBounds: {
      typeFilter: ['Root'],
      orbitsVisible: false
    }
  });

  const originalBudget = BookmarkManager.SHARE_URL_BUDGET;
  BookmarkManager.SHARE_URL_BUDGET = 260;

  try {
    const bookmarks = new BookmarkManager(stateManager);
    const url = bookmarks.encodeStateToUrl();
    const payload = decodePayload(url);
    assert.equal('e' in payload, false);

    BookmarkManager.SHARE_URL_BUDGET = 80;
    assert.throws(
      () => bookmarks.encodeStateToUrl(),
      /required core state/
    );
  } finally {
    BookmarkManager.SHARE_URL_BUDGET = originalBudget;
  }
});
