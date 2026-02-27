/*
 * Copyright 2026 Patched Reality, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

const UI_STATE_KEY = 'mv-ui-state';
const STATE_VERSION = 2;

const CLASS_TO_PREFIX = {
  RMRoot: 'root',
  RMCObject: 'celestial',
  RMTObject: 'terrestrial',
  RMPObject: 'physical'
};

const PREFIX_TO_CLASS = {
  root: 'RMRoot',
  celestial: 'RMCObject',
  terrestrial: 'RMTObject',
  physical: 'RMPObject'
};

function parseNumericId(value) {
  const parsed = Number.parseInt(`${value}`, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseNodeUid(nodeUid) {
  if (typeof nodeUid !== 'string') return null;
  const parts = nodeUid.split(':');
  if (parts.length < 3) return null;
  const id = parseNumericId(parts.pop());
  const prefix = parts.pop();
  const scopeId = parts.join(':');
  if (!scopeId || id === null || !PREFIX_TO_CLASS[prefix]) {
    return null;
  }
  return {
    scopeId,
    prefix,
    type: PREFIX_TO_CLASS[prefix],
    id
  };
}

function buildNodeUid(scopeId, typeOrPrefix, id) {
  if (!scopeId) return null;
  const prefix = CLASS_TO_PREFIX[typeOrPrefix] || typeOrPrefix;
  const numericId = parseNumericId(id);
  if (!prefix || numericId === null || !PREFIX_TO_CLASS[prefix]) {
    return null;
  }
  return `${scopeId}:${prefix}:${numericId}`;
}

function parseLegacyKey(value) {
  if (typeof value !== 'string') return null;
  const match = /^([A-Za-z]+)_(\d+)$/.exec(value);
  if (!match) return null;
  return {
    type: match[1],
    id: parseNumericId(match[2])
  };
}

const DEFAULT_STATE = {
  version: STATE_VERSION,
  navigation: {
    mapUrl: '',
    selectedNodePath: []
  },
  layout: {
    hierarchyWidth: 285,
    inspectorWidth: 280,
    hierarchyMinimized: false,
    inspectorMinimized: false,
    graphEnabled: true,
    boundsEnabled: true,
    resourceEnabled: false
  },
  hierarchy: {
    expandedNodeIds: []
  },
  inspector: {
    showRawJson: false,
    showResource: false
  },
  viewBounds: {
    typeFilter: null,
    timeScaleIndex: 4,
    orbitsVisible: true
  },
  viewResource: {
    showBounds: false
  }
};

export class UIStateManager {
  constructor() {
    this.state = this.load();
  }

  load() {
    try {
      const stored = localStorage.getItem(UI_STATE_KEY);
      if (!stored) {
        return this.cloneDefaults();
      }

      const parsed = JSON.parse(stored);
      if (parsed.version !== STATE_VERSION) {
        const migrated = this.migrate(parsed);
        this.state = migrated;
        this.save();
        return migrated;
      }
      return this.mergeWithDefaults(parsed);
    } catch {
      return this.cloneDefaults();
    }
  }

  save() {
    try {
      localStorage.setItem(UI_STATE_KEY, JSON.stringify(this.state));
    } catch {
      // localStorage unavailable or full
    }
  }

  resetAndReload() {
    const currentMapUrl = this.state.navigation?.mapUrl;
    this.state = this.cloneDefaults();
    if (currentMapUrl) {
      this.state.navigation.mapUrl = currentMapUrl;
    }
    this.save();
    window.location.reload();
  }

  getSection(section) {
    return this.state[section] || {};
  }

  updateSection(section, data) {
    this.state[section] = { ...this.state[section], ...data };
    this.save();
  }

  getFullState() {
    return JSON.parse(JSON.stringify(this.state));
  }

  async applyFullState(snapshot, app) {
    if (!snapshot) return false;
    let normalizedSnapshot = this.mergeWithDefaults(snapshot);
    const currentUrl = this.state.navigation.mapUrl;
    const newUrl = normalizedSnapshot.navigation?.mapUrl;

    this.state = normalizedSnapshot;
    this.save();

    // Defer heavy work to next tick so click handler returns immediately
    await new Promise(r => setTimeout(r, 0));

    const layoutState = normalizedSnapshot.layout || {};
    const viewBoundsState = normalizedSnapshot.viewBounds || {};
    const viewResourceState = normalizedSnapshot.viewResource || {};

    app.layout.restoreStateValues(layoutState);
    app.viewBounds.restoreState(viewBoundsState);
    app.viewResource.restoreState(viewResourceState);

    if (newUrl && (newUrl !== currentUrl || !app.model.tree)) {
      document.getElementById('url-input').value = newUrl;
      await app.handleLoadMap(newUrl, { skipStateRestore: true });
    }

    if (app.activeScopeId) {
      normalizedSnapshot = this.mergeWithDefaults(normalizedSnapshot, app.activeScopeId);
      this.state = normalizedSnapshot;
      this.save();
    }

    app.layout.restoreStateUI(layoutState);

    if (!app.model.tree) {
      console.error('applyFullState: Map failed to load - tree is null');
      return false;
    }

    if (normalizedSnapshot.hierarchy?.expandedNodeIds?.length > 0) {
      app.model.expandNodesByKeys(normalizedSnapshot.hierarchy.expandedNodeIds);
    }

    if (normalizedSnapshot.navigation?.selectedNodePath?.length > 0) {
      app.restoreNodePath(normalizedSnapshot.navigation.selectedNodePath);
    }

    return true;
  }

  cloneDefaults() {
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  mergeWithDefaults(parsed, rootScopeId = null) {
    const merged = this.cloneDefaults();
    for (const key of Object.keys(DEFAULT_STATE)) {
      if (key === 'version') continue;
      if (parsed[key]) {
        merged[key] = { ...DEFAULT_STATE[key], ...parsed[key] };
      }
    }
    const resolvedScopeId = rootScopeId || this._inferRootScopeId(merged);
    merged.navigation.selectedNodePath = this._normalizeSelectedNodePath(
      merged.navigation.selectedNodePath,
      resolvedScopeId
    );
    merged.hierarchy.expandedNodeIds = this._normalizeExpandedNodeIds(
      merged.hierarchy.expandedNodeIds,
      resolvedScopeId
    );
    merged.version = STATE_VERSION;
    return merged;
  }

  migrate(oldState, rootScopeId = null) {
    return this.mergeWithDefaults(oldState || {}, rootScopeId);
  }

  _inferRootScopeId(state) {
    const selectedPath = state?.navigation?.selectedNodePath || [];
    for (const step of selectedPath) {
      const parsed = parseNodeUid(step?.nodeUid);
      if (parsed?.scopeId) {
        return parsed.scopeId;
      }
    }

    const expanded = state?.hierarchy?.expandedNodeIds || [];
    for (const entry of expanded) {
      const candidate = typeof entry === 'string'
        ? entry
        : entry?.nodeUid || entry?.key || null;
      const parsed = parseNodeUid(candidate);
      if (parsed?.scopeId) {
        return parsed.scopeId;
      }
    }

    return null;
  }

  _entryToNodeUid(entry, rootScopeId = null) {
    if (typeof entry === 'string') {
      if (parseNodeUid(entry)) {
        return entry;
      }
      const legacy = parseLegacyKey(entry);
      if (legacy && rootScopeId) {
        return buildNodeUid(rootScopeId, legacy.type, legacy.id);
      }
      return null;
    }

    if (!entry || typeof entry !== 'object') {
      return null;
    }

    if (parseNodeUid(entry.nodeUid)) {
      return entry.nodeUid;
    }

    if (parseNodeUid(entry.key)) {
      return entry.key;
    }

    const legacy = parseLegacyKey(entry.key);
    if (legacy && rootScopeId) {
      return buildNodeUid(rootScopeId, legacy.type, legacy.id);
    }

    const type = entry.type;
    const id = parseNumericId(entry.id);
    if (type && id !== null && rootScopeId) {
      return buildNodeUid(rootScopeId, type, id);
    }

    return null;
  }

  _normalizeSelectedNodePath(path, rootScopeId = null) {
    if (!Array.isArray(path) || path.length === 0) {
      return [];
    }

    const normalized = [];
    for (const step of path) {
      const nodeUid = this._entryToNodeUid(step, rootScopeId);
      const parsedUid = parseNodeUid(nodeUid);
      const type = step?.type || parsedUid?.type || null;
      const id = parseNumericId(step?.id ?? parsedUid?.id);
      if (!type || id === null) {
        continue;
      }
      normalized.push({
        nodeUid: nodeUid || null,
        type,
        id
      });
    }

    return normalized;
  }

  _normalizeExpandedNodeIds(expandedNodeIds, rootScopeId = null) {
    if (!Array.isArray(expandedNodeIds) || expandedNodeIds.length === 0) {
      return [];
    }

    const normalized = [];
    for (const entry of expandedNodeIds) {
      const nodeCandidate = typeof entry === 'string'
        ? entry
        : entry?.nodeUid || entry?.key || null;
      const parentCandidate = typeof entry === 'string'
        ? null
        : entry?.parentNodeUid || entry?.parent || null;

      const nodeUid = this._entryToNodeUid(nodeCandidate, rootScopeId);
      const parentNodeUid = this._entryToNodeUid(parentCandidate, rootScopeId);

      const key = nodeUid || (typeof nodeCandidate === 'string' ? nodeCandidate : null);
      if (!key) {
        continue;
      }

      const parent = parentNodeUid || (typeof parentCandidate === 'string' ? parentCandidate : null);
      normalized.push({
        nodeUid: nodeUid || null,
        parentNodeUid: parentNodeUid || null,
        key,
        parent: parent || null
      });
    }

    return normalized;
  }
}
