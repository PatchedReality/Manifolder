/**
 * Copyright (c) 2026 Patched Reality, Inc.
 */

const STORAGE_KEY = 'mv-bookmarks';

export class BookmarkManager {
  constructor(stateManager) {
    this.stateManager = stateManager;
    this.bookmarks = this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
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
      state,
      nodeType: state.navigation?.selectedNodePath?.[state.navigation.selectedNodePath.length - 1]?.type || null,
      timestamp: Date.now()
    };

    this.bookmarks.unshift(bookmark);
    this.saveToStorage();
    return bookmark;
  }

  load(id) {
    return this.bookmarks.find(b => b.id === id)?.state || null;
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
    return this.stateManager.applyFullState(state, app);
  }

  // Type codes for compact encoding
  static TYPE_CODES = { RMRoot: 'R', RMCObject: 'C', RMTObject: 'T', RMPObject: 'P' };
  static CODE_TYPES = { R: 'RMRoot', C: 'RMCObject', T: 'RMTObject', P: 'RMPObject' };

  // All filter types in order (index = compact code)
  static FILTER_TYPES = [
    'Universe', 'Supercluster', 'GalaxyCluster', 'Galaxy', 'Sector', 'Nebula',
    'StarCluster', 'BlackHole', 'StarSystem', 'Star', 'PlanetSystem', 'Planet',
    'Moon', 'Debris', 'Satellite', 'Transport', 'Surface', 'Root', 'Water',
    'Land', 'Country', 'Territory', 'State', 'County', 'City', 'Community',
    'Parcel', 'Placement'
  ];

  encodeStateToUrl() {
    const full = this.stateManager.getFullState();

    // Compact path: [{id:1,type:"RMCObject"},...] -> "C1,C2,T3"
    const path = full.navigation?.selectedNodePath;
    const compactPath = path?.length > 0
      ? path.map(n => `${BookmarkManager.TYPE_CODES[n.type] || 'X'}${n.id}`).join(',')
      : null;

    // Compact expanded: ["RMCObject_1",...] -> "C1,T2"
    const expanded = full.hierarchy?.expandedNodeIds;
    const compactExpanded = expanded?.length > 0
      ? expanded.map(s => {
          const [type, id] = s.split('_');
          return `${BookmarkManager.TYPE_CODES[type] || 'X'}${id}`;
        }).join(',')
      : null;

    // Compact typeFilter: encode as disabled indices (shorter when most are enabled)
    const typeFilter = full.viewBounds?.typeFilter;
    let compactFilter = null;
    if (typeFilter) {
      const allTypes = new Set(BookmarkManager.FILTER_TYPES);
      const enabled = new Set(typeFilter);
      const disabled = [...allTypes].filter(t => !enabled.has(t));
      if (disabled.length > 0 && disabled.length < enabled.size) {
        // Encode disabled as "-" prefix
        compactFilter = '-' + disabled.map(t => BookmarkManager.FILTER_TYPES.indexOf(t)).join(',');
      } else if (disabled.length > 0) {
        // Encode enabled
        compactFilter = typeFilter.map(t => BookmarkManager.FILTER_TYPES.indexOf(t)).join(',');
      }
    }

    const minimal = { v: 2, m: full.navigation?.mapUrl };
    if (compactPath) minimal.p = compactPath;
    if (compactExpanded) minimal.e = compactExpanded;
    if (compactFilter) minimal.t = compactFilter;
    if (full.viewBounds?.orbitsVisible === false) minimal.o = 0;

    const json = JSON.stringify(minimal);
    const compressed = pako.deflate(json);
    const base64 = this.toBase64Url(compressed);
    const baseUrl = window.top !== window ? window.top.location.href : window.location.href;
    const url = new URL(baseUrl);
    url.hash = `b=${base64}`;
    return url.toString();
  }

  decodeStateFromUrl(hash) {
    if (!hash || !hash.startsWith('#b=')) {
      return null;
    }

    try {
      const base64 = hash.slice(3);
      const compressed = this.fromBase64Url(base64);
      const json = pako.inflate(compressed, { to: 'string' });
      const minimal = JSON.parse(json);

      // Decode path: "C1,C2,T3" -> [{id:1,type:"RMCObject"},...]
      let selectedNodePath = [];
      if (minimal.p) {
        selectedNodePath = minimal.p.split(',').map(s => {
          const code = s[0];
          const id = parseInt(s.slice(1), 10);
          return { id, type: BookmarkManager.CODE_TYPES[code] || 'RMCObject' };
        });
      }

      // Decode expanded: "C1,T2" -> ["RMCObject_1","RMTObject_2"]
      let expandedNodeIds = [];
      if (minimal.e) {
        expandedNodeIds = minimal.e.split(',').map(s => {
          const code = s[0];
          const id = s.slice(1);
          return `${BookmarkManager.CODE_TYPES[code] || 'RMCObject'}_${id}`;
        });
      }

      // Decode typeFilter
      let typeFilter = null;
      if (minimal.t) {
        if (minimal.t.startsWith('-')) {
          // Disabled indices - start with all, remove disabled
          const disabledIndices = minimal.t.slice(1).split(',').map(Number);
          const disabled = new Set(disabledIndices.map(i => BookmarkManager.FILTER_TYPES[i]));
          typeFilter = BookmarkManager.FILTER_TYPES.filter(t => !disabled.has(t));
        } else {
          // Enabled indices
          typeFilter = minimal.t.split(',').map(i => BookmarkManager.FILTER_TYPES[parseInt(i, 10)]);
        }
      }

      return {
        navigation: {
          mapUrl: minimal.m,
          selectedNodePath
        },
        hierarchy: { expandedNodeIds },
        viewBounds: {
          typeFilter,
          orbitsVisible: minimal.o !== 0
        }
      };
    } catch (e) {
      console.warn('Failed to decode shared state from URL:', e);
      return null;
    }
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
