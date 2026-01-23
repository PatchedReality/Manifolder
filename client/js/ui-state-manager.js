/**
 * Copyright (c) 2026 Patched Reality, Inc.
 */

const UI_STATE_KEY = 'mv-ui-state';
const STATE_VERSION = 1;

const DEFAULT_STATE = {
  version: STATE_VERSION,
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
    this.state = this.cloneDefaults();
    localStorage.removeItem(UI_STATE_KEY);
    localStorage.removeItem('selectedNodeId');
    localStorage.removeItem('selectedNodeType');
    localStorage.removeItem('selectedNodePath');
    window.location.reload();
  }

  getSection(section) {
    return this.state[section] || {};
  }

  updateSection(section, data) {
    this.state[section] = { ...this.state[section], ...data };
    this.save();
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
