/**
 * Copyright (c) 2026 Patched Reality, Inc.
 */

const UI_STATE_KEY = 'mv-ui-state';
const STATE_VERSION = 1;

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
    expandedNodeIds: [],
    typeFilter: null,
    timeScaleIndex: 4,
    orbitsVisible: true,
    selectedId: null,
    selectedType: null
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
        return this.migrate(parsed);
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

    const currentUrl = this.state.navigation.mapUrl;
    const newUrl = snapshot.navigation?.mapUrl;

    this.state = this.mergeWithDefaults(snapshot);
    this.save();

    // Defer heavy work to next tick so click handler returns immediately
    await new Promise(r => setTimeout(r, 0));

    const layoutState = snapshot.layout || {};
    const viewBoundsState = snapshot.viewBounds || {};
    const viewResourceState = snapshot.viewResource || {};

    app.layout.restoreStateValues(layoutState);
    app.viewBounds.restoreState(viewBoundsState);
    app.viewResource.restoreState(viewResourceState);

    if (newUrl && (newUrl !== currentUrl || !app.tree)) {
      document.getElementById('url-input').value = newUrl;
      await app.handleLoadMap(newUrl, { skipStateRestore: true });
    }

    app.layout.restoreStateUI(layoutState);

    if (!app.tree) {
      console.error('applyFullState: Map failed to load - tree is null');
      return false;
    }

    if (snapshot.hierarchy?.expandedNodeIds?.length > 0) {
      app.hierarchy.expandNodesByKeys(snapshot.hierarchy.expandedNodeIds);
    }

    if (snapshot.navigation?.selectedNodePath?.length > 0) {
      await app.restoreNodePath(snapshot.navigation.selectedNodePath);
    }

    return true;
  }

  cloneDefaults() {
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  mergeWithDefaults(parsed) {
    const merged = this.cloneDefaults();
    for (const key of Object.keys(DEFAULT_STATE)) {
      if (key === 'version') continue;
      if (parsed[key]) {
        merged[key] = { ...DEFAULT_STATE[key], ...parsed[key] };
      }
    }
    merged.version = STATE_VERSION;
    return merged;
  }

  migrate(oldState) {
    return this.cloneDefaults();
  }
}
