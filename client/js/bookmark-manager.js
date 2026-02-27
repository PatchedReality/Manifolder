/*
 * Copyright 2026 Patched Reality, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

const STORAGE_KEY = 'mv-bookmarks';

function parseNumericId(value) {
  const parsed = Number.parseInt(`${value}`, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export class BookmarkManager {
  static SHARE_VERSION = 2;
  static SHARE_URL_BUDGET = 2000;

  // Legacy class-name type codes
  static TYPE_CODES = { RMRoot: 'R', RMCObject: 'C', RMTObject: 'T', RMPObject: 'P' };
  static CODE_TYPES = { R: 'RMRoot', C: 'RMCObject', T: 'RMTObject', P: 'RMPObject' };

  // scope-native prefix codes
  static PREFIX_CODES = { root: 'R', celestial: 'C', terrestrial: 'T', physical: 'P' };
  static CODE_PREFIXES = { R: 'root', C: 'celestial', T: 'terrestrial', P: 'physical' };
  static TYPE_PREFIXES = { RMRoot: 'root', RMCObject: 'celestial', RMTObject: 'terrestrial', RMPObject: 'physical' };
  static PREFIX_TYPES = { root: 'RMRoot', celestial: 'RMCObject', terrestrial: 'RMTObject', physical: 'RMPObject' };

  // All filter types in order (index = compact code)
  static FILTER_TYPES = [
    'Universe', 'Supercluster', 'GalaxyCluster', 'Galaxy', 'BlackHole', 'Nebula',
    'StarCluster', 'Constellation', 'StarSystem', 'Star', 'PlanetSystem', 'Planet',
    'Moon', 'Debris', 'Satellite', 'Transport', 'Surface', 'Root', 'Water',
    'Land', 'Country', 'Territory', 'State', 'County', 'City', 'Community',
    'Sector', 'Parcel', 'Physical'
  ];

  constructor(stateManager) {
    this.stateManager = stateManager;
    this.bookmarks = this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        return [];
      }

      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) {
        return [];
      }

      let changed = false;
      const migrated = parsed.map((bookmark) => {
        const next = { ...(bookmark || {}) };
        const migratedState = this.stateManager.migrate(next.state || {});
        if (JSON.stringify(migratedState) !== JSON.stringify(next.state || {})) {
          changed = true;
        }
        next.state = migratedState;
        next.nodeType = migratedState.navigation?.selectedNodePath?.[migratedState.navigation.selectedNodePath.length - 1]?.type
          || next.nodeType
          || null;
        return next;
      });

      if (changed) {
        this.bookmarks = migrated;
        this.saveToStorage();
      }

      return migrated;
    } catch (e) {
      console.warn('Failed to load bookmarks:', e);
      return [];
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.bookmarks));
    } catch (e) {
      console.warn('Failed to save bookmarks:', e);
    }
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  save(name) {
    const state = this.stateManager.getFullState();
    const bookmark = {
      id: this.generateId(),
      name: name || 'Untitled',
      state: this.stateManager.migrate(state),
      nodeType: state.navigation?.selectedNodePath?.[state.navigation.selectedNodePath.length - 1]?.type || null,
      timestamp: Date.now()
    };

    this.bookmarks.unshift(bookmark);
    this.saveToStorage();
    return bookmark;
  }

  load(id) {
    const state = this.bookmarks.find(b => b.id === id)?.state || null;
    return state ? this.stateManager.migrate(state) : null;
  }

  rename(id, newName) {
    const bookmark = this.bookmarks.find(b => b.id === id);
    if (bookmark) {
      bookmark.name = newName;
      this.saveToStorage();
      return true;
    }
    return false;
  }

  delete(id) {
    const index = this.bookmarks.findIndex(b => b.id === id);
    if (index !== -1) {
      this.bookmarks.splice(index, 1);
      this.saveToStorage();
      return true;
    }
    return false;
  }

  list() {
    return this.bookmarks.map(b => ({
      id: b.id,
      name: b.name,
      timestamp: b.timestamp,
      nodeType: b.nodeType,
      mapUrl: b.state?.navigation?.mapUrl
    }));
  }

  async applyState(state, app) {
    return this.stateManager.applyFullState(this.stateManager.migrate(state || {}), app);
  }

  encodeStateToUrl() {
    const full = this.stateManager.getFullState();
    const normalized = this.stateManager.migrate(full);

    const attempts = [
      { includeExpanded: true, includeTypeFilter: true, includeOrbits: true },
      { includeExpanded: false, includeTypeFilter: true, includeOrbits: true },
      { includeExpanded: false, includeTypeFilter: false, includeOrbits: true },
      { includeExpanded: false, includeTypeFilter: false, includeOrbits: false }
    ];

    for (const attempt of attempts) {
      const url = this._buildShareUrl(normalized, attempt);
      if (url.length <= BookmarkManager.SHARE_URL_BUDGET) {
        return url;
      }
    }

    throw new Error('Share payload exceeds budget for required core state.');
  }

  _buildShareUrl(state, options) {
    const payload = this._buildSharePayload(state, options);
    const json = JSON.stringify(payload);
    const compressed = pako.deflate(json);
    const base64 = this.toBase64Url(compressed);

    let baseUrl;
    try {
      baseUrl = window.top.location.href;
    } catch {
      baseUrl = window.location.href;
    }

    const url = new URL(baseUrl);
    url.hash = '';
    url.searchParams.set('loc', base64);
    return url.toString();
  }

  _buildSharePayload(state, { includeExpanded, includeTypeFilter, includeOrbits }) {
    const scopes = [];
    const scopeIndexById = new Map();
    const fallbackScopeId = this._inferRootScopeId(state);

    const encodeNodeRef = (entry, explicitScopeId = null) => {
      const nodeUid = this._entryToNodeUid(entry, explicitScopeId || fallbackScopeId);
      const parsed = this._parseNodeUid(nodeUid);
      if (!parsed) {
        return null;
      }

      let scopeIndex = scopeIndexById.get(parsed.scopeId);
      if (scopeIndex == null) {
        scopeIndex = scopes.length;
        scopes.push(parsed.scopeId);
        scopeIndexById.set(parsed.scopeId, scopeIndex);
      }

      const code = BookmarkManager.PREFIX_CODES[parsed.prefix] || 'P';
      return `${scopeIndex}.${code}${parsed.id}`;
    };

    const payload = {
      v: BookmarkManager.SHARE_VERSION,
      m: state.navigation?.mapUrl || '',
      scopes
    };

    const path = state.navigation?.selectedNodePath || [];
    const pathRefs = [];
    for (const step of path) {
      const ref = encodeNodeRef(step);
      if (ref) {
        pathRefs.push(ref);
      }
    }
    if (pathRefs.length > 0) {
      payload.p = pathRefs.join(',');
    }

    if (includeExpanded) {
      const expanded = state.hierarchy?.expandedNodeIds || [];
      const expandedRefs = [];
      for (const entry of expanded) {
        const nodeRef = encodeNodeRef(entry);
        if (!nodeRef) {
          continue;
        }
        const parentCandidate = typeof entry === 'string'
          ? null
          : (entry.parentNodeUid || entry.parent || null);
        const parentRef = parentCandidate ? encodeNodeRef(parentCandidate) : null;
        expandedRefs.push(parentRef ? `${nodeRef}:${parentRef}` : nodeRef);
      }
      if (expandedRefs.length > 0) {
        payload.e = expandedRefs.join(',');
      }
    }

    if (includeTypeFilter) {
      const compactFilter = this._encodeTypeFilter(state.viewBounds?.typeFilter || null);
      if (compactFilter) {
        payload.t = compactFilter;
      }
    }

    if (includeOrbits && state.viewBounds?.orbitsVisible === false) {
      payload.o = 0;
    }

    return payload;
  }

  decodeStateFromUrl(search) {
    const params = new URLSearchParams(search);
    const base64 = params.get('loc');
    if (!base64) {
      return null;
    }

    try {
      const compressed = this.fromBase64Url(base64);
      const json = pako.inflate(compressed, { to: 'string' });
      const minimal = JSON.parse(json);

      if (Array.isArray(minimal.scopes)) {
        return this._decodeScopeSharedState(minimal);
      }

      return this._decodeLegacySharedState(minimal);
    } catch (e) {
      console.error('Failed to decode shared state from URL:', e);
      console.error('Problematic loc parameter:', base64);
      return null;
    }
  }

  _decodeScopeSharedState(minimal) {
    const scopes = Array.isArray(minimal.scopes) ? minimal.scopes : [];

    const selectedNodePath = this._decodeNodeRefList(minimal.p, scopes).map((step) => ({
      nodeUid: step.nodeUid,
      type: step.type,
      id: step.id
    }));

    const expandedNodeIds = this._decodeExpandedRefList(minimal.e, scopes);

    return this.stateManager.mergeWithDefaults({
      navigation: {
        mapUrl: minimal.m,
        selectedNodePath
      },
      hierarchy: { expandedNodeIds },
      viewBounds: {
        typeFilter: this._decodeTypeFilter(minimal.t),
        orbitsVisible: minimal.o !== 0
      }
    });
  }

  _decodeLegacySharedState(minimal) {
    // Legacy path: "C1,C2,T3" -> [{id:1,type:"RMCObject"},...]
    let selectedNodePath = [];
    if (minimal.p) {
      selectedNodePath = minimal.p.split(',').map(s => {
        const code = s[0];
        const id = parseInt(s.slice(1), 10);
        return { id, type: BookmarkManager.CODE_TYPES[code] || 'RMCObject' };
      });
    }

    // Legacy expanded: "C1,T2" or "C1:R0,T2:C1" -> [{key,parent},...]
    let expandedNodeIds = [];
    if (minimal.e) {
      expandedNodeIds = minimal.e.split(',').map(s => {
        const parts = s.split(':');
        const nodeCode = parts[0][0];
        const nodeId = parts[0].slice(1);
        const key = `${BookmarkManager.CODE_TYPES[nodeCode] || 'RMCObject'}_${nodeId}`;

        let parent = null;
        if (parts[1]) {
          const parentCode = parts[1][0];
          const parentId = parts[1].slice(1);
          parent = `${BookmarkManager.CODE_TYPES[parentCode] || 'RMCObject'}_${parentId}`;
        }
        return { key, parent };
      });
    }

    return this.stateManager.migrate({
      version: 1,
      navigation: {
        mapUrl: minimal.m,
        selectedNodePath
      },
      hierarchy: { expandedNodeIds },
      viewBounds: {
        typeFilter: this._decodeTypeFilter(minimal.t),
        orbitsVisible: minimal.o !== 0
      }
    });
  }

  _encodeTypeFilter(typeFilter) {
    if (!typeFilter) {
      return null;
    }

    const allTypes = new Set(BookmarkManager.FILTER_TYPES);
    const enabled = new Set(typeFilter);
    const disabled = [...allTypes].filter((t) => !enabled.has(t));

    if (disabled.length > 0 && disabled.length < enabled.size) {
      return '-' + disabled.map((t) => BookmarkManager.FILTER_TYPES.indexOf(t)).join(',');
    }
    if (disabled.length > 0) {
      return typeFilter.map((t) => BookmarkManager.FILTER_TYPES.indexOf(t)).join(',');
    }
    return null;
  }

  _decodeTypeFilter(encoded) {
    if (!encoded) {
      return null;
    }

    if (encoded.startsWith('-')) {
      const disabledIndices = encoded.slice(1).split(',').map(Number);
      const disabled = new Set(disabledIndices.map((i) => BookmarkManager.FILTER_TYPES[i]));
      return BookmarkManager.FILTER_TYPES.filter((t) => !disabled.has(t));
    }

    return encoded.split(',').map((i) => BookmarkManager.FILTER_TYPES[parseInt(i, 10)]);
  }

  _decodeNodeRefList(refList, scopes) {
    if (!refList) {
      return [];
    }

    const entries = refList.split(',');
    const nodes = [];
    for (const ref of entries) {
      const decoded = this._decodeNodeRef(ref, scopes);
      if (decoded) {
        nodes.push(decoded);
      }
    }
    return nodes;
  }

  _decodeExpandedRefList(refList, scopes) {
    if (!refList) {
      return [];
    }

    const entries = refList.split(',');
    const expanded = [];
    for (const token of entries) {
      const [nodeRef, parentRef] = token.split(':');
      const node = this._decodeNodeRef(nodeRef, scopes);
      if (!node) {
        continue;
      }
      const parent = parentRef ? this._decodeNodeRef(parentRef, scopes) : null;
      expanded.push({
        nodeUid: node.nodeUid,
        parentNodeUid: parent?.nodeUid || null,
        key: node.nodeUid,
        parent: parent?.nodeUid || null
      });
    }

    return expanded;
  }

  _decodeNodeRef(ref, scopes) {
    if (typeof ref !== 'string') {
      return null;
    }

    const match = /^(\d+)\.([RCTP])(\d+)$/.exec(ref);
    if (!match) {
      return null;
    }

    const scopeIndex = Number.parseInt(match[1], 10);
    const prefix = BookmarkManager.CODE_PREFIXES[match[2]];
    const id = Number.parseInt(match[3], 10);
    const scopeId = scopes[scopeIndex];

    if (!scopeId || !prefix || !Number.isFinite(id)) {
      return null;
    }

    return {
      nodeUid: `${scopeId}:${prefix}:${id}`,
      type: BookmarkManager.PREFIX_TYPES[prefix],
      id
    };
  }

  _inferRootScopeId(state) {
    const selectedPath = state?.navigation?.selectedNodePath || [];
    for (const step of selectedPath) {
      const parsed = this._parseNodeUid(step?.nodeUid || step?.key || null);
      if (parsed?.scopeId) {
        return parsed.scopeId;
      }
    }

    const expanded = state?.hierarchy?.expandedNodeIds || [];
    for (const entry of expanded) {
      const candidate = typeof entry === 'string' ? entry : (entry?.nodeUid || entry?.key || null);
      const parsed = this._parseNodeUid(candidate);
      if (parsed?.scopeId) {
        return parsed.scopeId;
      }
    }

    return null;
  }

  _entryToNodeUid(entry, fallbackScopeId = null) {
    if (typeof entry === 'string') {
      if (this._parseNodeUid(entry)) {
        return entry;
      }
      const legacy = /^([A-Za-z]+)_(\d+)$/.exec(entry);
      if (legacy && fallbackScopeId) {
        return this._buildNodeUid(fallbackScopeId, legacy[1], legacy[2]);
      }
      return null;
    }

    if (!entry || typeof entry !== 'object') {
      return null;
    }

    if (this._parseNodeUid(entry.nodeUid)) {
      return entry.nodeUid;
    }

    if (this._parseNodeUid(entry.key)) {
      return entry.key;
    }

    if (typeof entry.key === 'string') {
      const legacy = /^([A-Za-z]+)_(\d+)$/.exec(entry.key);
      if (legacy && fallbackScopeId) {
        return this._buildNodeUid(fallbackScopeId, legacy[1], legacy[2]);
      }
    }

    const numericId = parseNumericId(entry.id);
    if (fallbackScopeId && entry.type && numericId !== null) {
      return this._buildNodeUid(fallbackScopeId, entry.type, numericId);
    }

    return null;
  }

  _parseNodeUid(nodeUid) {
    if (typeof nodeUid !== 'string') {
      return null;
    }

    const parts = nodeUid.split(':');
    if (parts.length < 3) {
      return null;
    }

    const id = parseNumericId(parts.pop());
    const prefix = parts.pop();
    const scopeId = parts.join(':');
    if (!scopeId || id === null || !BookmarkManager.PREFIX_TYPES[prefix]) {
      return null;
    }

    return {
      scopeId,
      prefix,
      type: BookmarkManager.PREFIX_TYPES[prefix],
      id
    };
  }

  _buildNodeUid(scopeId, typeOrPrefix, id) {
    if (!scopeId) {
      return null;
    }

    const prefix = BookmarkManager.TYPE_PREFIXES[typeOrPrefix] || typeOrPrefix;
    const numericId = parseNumericId(id);
    if (!prefix || numericId === null || !BookmarkManager.PREFIX_TYPES[prefix]) {
      return null;
    }

    return `${scopeId}:${prefix}:${numericId}`;
  }

  toBase64Url(uint8Array) {
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const base64 = btoa(binary);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  fromBase64Url(base64url) {
    let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}
