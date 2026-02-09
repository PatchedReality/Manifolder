/**
 * Copyright (c) 2026 Patched Reality, Inc.
 */

import { LayoutManager } from './layout.js';
import { HierarchyPanel } from './hierarchy-panel.js';
import { ViewGraph } from './view-graph.js';
import { ViewBounds, NODE_TYPES } from './view-bounds.js';
import { ViewResource } from './view-resource.js';
import { InspectorPanel } from './inspector-panel.js';
import { MVClient } from './mv-client.js';
import { CELESTIAL_NAMES, PHYSICAL_NAMES } from '../shared/node-types.js';
import { getMsfReference } from './node-helpers.js';
import { UIStateManager } from './ui-state-manager.js';
import { BookmarkManager } from './bookmark-manager.js';
import { calculateLatLong } from './geo-utils.js';
import { Model } from './model.js';

class App {
  constructor() {
    this.stateManager = new UIStateManager();
    this.client = new MVClient();
    this.model = new Model(this.client);
    this.layout = new LayoutManager(this.stateManager);
    this.hierarchy = new HierarchyPanel('#hierarchy-tree', this.model);
    this.viewGraph = new ViewGraph('#viewport-graph', this.stateManager, this.model);
    this.viewBounds = new ViewBounds('#viewport-bounds', this.stateManager, this.model);
    this.viewResource = new ViewResource('#viewport-resource', this.stateManager, this.model);
    this.inspector = new InspectorPanel('#inspector-content', this.stateManager, this.model);
    this.bookmarkManager = new BookmarkManager(this.stateManager);

    this.rp1GoBtn = document.getElementById('rp1-go-btn');
    this.init();
  }

  updateRP1GoButton(node) {
    if (!this.rp1GoBtn) return;

    const planetContext = this.model.getPlanetContext(node);
    if (!node?._worldPos || !planetContext?.celestialId) {
      this.rp1GoBtn.classList.add('hidden');
      return;
    }

    const coords = calculateLatLong(node._worldPos, planetContext.radius);
    if (!coords) {
      this.rp1GoBtn.classList.add('hidden');
      return;
    }

    const url = `https://enter.rp1.com/?start_cid=${planetContext.celestialId}&start_geo=[${coords.latitude.toFixed(5)},${coords.longitude.toFixed(5)},${planetContext.radius}]`;

    this.rp1GoBtn.href = url;
    this.rp1GoBtn.classList.remove('hidden');
  }

  init() {
    this.setupModelEvents();
    this.setupHierarchyEvents();
    this.setupViewEvents();
    this.setupLayoutEvents();
    this.setupClientEvents();
    this.setupTypeFilter();
    this.setupResetButton();
    this.setupAsyncSearch();
    this.setupBookmarks();
    this.setupShareButton();

    this.layout.restoreState();
    this.layout.setFollowLink(null);
    this.layout.setStatus('Disconnected', 'disconnected');

    this.checkUrlForSharedState();
  }

  setupModelEvents() {
    this.model.on('selectionChanged', (node) => {
      if (!node) return;

      getMsfReference(node).then(url => this.layout.setFollowLink(url));
      this.updateRP1GoButton(node);

      if (this._zoomOnSelectionKey && this.model.nodeKey(node) === this._zoomOnSelectionKey) {
        this._zoomOnSelectionKey = null;
        this.viewBounds.zoomToNode(node);
        setTimeout(() => this.viewGraph.zoomToNode(node), 100);
      }

      if (!this._restoringState) {
        const path = this.model.getPathToNode(node);
        this.stateManager.updateSection('navigation', {
          selectedNodePath: path || []
        });
      }
    });

    this.model.on('expansionChanged', (node, expanded) => {
      // Always save state on collapse (user action), skip only during expansion restoration
      if (!this._restoringState || !expanded) {
        this.stateManager.updateSection('hierarchy', {
          expandedNodeIds: this.model.getExpandedNodeKeys()
        });
      }
    });

    this.model.on('nodeUpdated', (node) => {
      if (!this._restoringState) {
        this.stateManager.updateSection('hierarchy', {
          liveUpdateNodeIds: this.model.getLiveUpdateNodeKeys()
        });
      }
    });
  }

  setupResetButton() {
    const resetBtn = document.getElementById('reset-view-btn');
    resetBtn?.addEventListener('click', () => {
      this.stateManager.resetAndReload();
    });
  }

  setupBookmarks() {
    const addBtn = document.getElementById('add-bookmark-btn');
    const bookmarksBtn = document.getElementById('bookmarks-btn');
    const dropdown = document.getElementById('bookmark-dropdown');
    const bookmarkList = dropdown?.querySelector('.bookmark-list');

    if (!addBtn || !bookmarksBtn || !dropdown || !bookmarkList) return;

    addBtn.addEventListener('click', () => {
      const selectedNode = this.model.getSelectedNode();
      const name = selectedNode?.name || selectedNode?.type || 'Untitled';
      this.bookmarkManager.save(name);
      this.renderBookmarkList(bookmarkList);
    });

    bookmarksBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.renderBookmarkList(bookmarkList);
      dropdown.classList.toggle('hidden');
    });

    document.addEventListener('click', () => {
      dropdown.classList.add('hidden');
    });

    dropdown.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  setupShareButton() {
    const shareBtn = document.getElementById('share-btn');
    const toast = document.getElementById('share-toast');

    if (!shareBtn) return;

    shareBtn.addEventListener('click', async () => {
      const url = this.bookmarkManager.encodeStateToUrl();

      try {
        await navigator.clipboard.writeText(url);
        this.showShareToast(toast);
      } catch (e) {
        console.warn('Failed to copy to clipboard:', e);
        prompt('Copy this link:', url);
      }
    });
  }

  showShareToast(toast) {
    if (!toast) return;

    toast.classList.remove('hidden');
    toast.classList.add('visible');

    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => {
        toast.classList.add('hidden');
      }, 300);
    }, 2000);
  }

  async checkUrlForSharedState() {
    let targetWindow;
    try {
      targetWindow = window.top;
      targetWindow.location.search; // Test access
    } catch {
      targetWindow = window;
    }

    const search = targetWindow.location.search;
    if (!search?.includes('loc=')) return;

    const state = this.bookmarkManager.decodeStateFromUrl(search);
    if (!state) {
      console.error('Failed to decode shared link - URL may be corrupted');
      this.layout.setStatus('Invalid shared link', 'disconnected');
      return;
    }

    targetWindow.history.replaceState(null, '', targetWindow.location.pathname);

    try {
      const success = await this.bookmarkManager.applyState(state, this);
      if (!success) {
        console.error('Failed to apply shared state - map may be unavailable');
        this.layout.setStatus('Failed to load shared link', 'disconnected');
      }
    } catch (err) {
      console.error('Error applying shared state:', err);
      this.layout.setStatus('Error loading shared link', 'disconnected');
    }
  }

  renderBookmarkList(container) {
    const bookmarks = this.bookmarkManager.list();
    container.innerHTML = '';

    bookmarks.forEach(bookmark => {
      const item = document.createElement('div');
      item.className = 'bookmark-item';
      item.dataset.id = bookmark.id;

      const nameSpan = document.createElement('span');
      nameSpan.className = 'bookmark-item-name';
      nameSpan.textContent = bookmark.name;
      nameSpan.title = bookmark.name;

      item.addEventListener('click', async () => {
        const state = this.bookmarkManager.load(bookmark.id);
        if (state) {
          document.getElementById('bookmark-dropdown')?.classList.add('hidden');
          try {
            const success = await this.bookmarkManager.applyState(state, this);
            if (!success) {
              this.layout.setStatus('Failed to load bookmark', 'disconnected');
            }
          } catch (err) {
            console.error('Error loading bookmark:', err);
            this.layout.setStatus('Error loading bookmark', 'disconnected');
          }
        }
      });

      const actions = document.createElement('div');
      actions.className = 'bookmark-item-actions';

      const editBtn = document.createElement('button');
      editBtn.className = 'bookmark-item-btn';
      editBtn.textContent = '✎';
      editBtn.title = 'Rename';
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.startBookmarkEdit(item, bookmark);
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'bookmark-item-btn';
      deleteBtn.textContent = '×';
      deleteBtn.title = 'Delete';
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.bookmarkManager.delete(bookmark.id);
        this.renderBookmarkList(container);
      });

      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);

      item.appendChild(nameSpan);
      item.appendChild(actions);
      container.appendChild(item);
    });
  }

  startBookmarkEdit(item, bookmark) {
    const nameSpan = item.querySelector('.bookmark-item-name');
    const actions = item.querySelector('.bookmark-item-actions');

    nameSpan.style.display = 'none';
    actions.style.display = 'none';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'bookmark-edit-input';
    input.value = bookmark.name;

    let finished = false;
    const finishEdit = () => {
      if (finished) return;
      finished = true;
      const newName = input.value.trim() || bookmark.name;
      this.bookmarkManager.rename(bookmark.id, newName);
      input.remove();
      nameSpan.textContent = newName;
      nameSpan.style.display = '';
      actions.style.display = '';
    };

    input.addEventListener('blur', finishEdit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        finishEdit();
      } else if (e.key === 'Escape') {
        input.value = bookmark.name;
        finishEdit();
      }
    });

    item.insertBefore(input, nameSpan);
    input.focus();
    input.select();
  }

  setupAsyncSearch() {
    const searchInput = document.getElementById('hierarchy-search');
    const clearBtn = document.getElementById('hierarchy-search-clear');
    const searchStatus = document.getElementById('search-status');
    if (!searchInput) return;

    let asyncDebounceTimer;
    let currentSearchId = 0;

    const clearSearch = () => {
      searchInput.value = '';
      clearBtn?.classList.remove('visible');
      if (searchStatus) searchStatus.textContent = '';
      currentSearchId++;
      this.hierarchy.clearSearchFilter();
    };

    const updateClearButton = () => {
      clearBtn?.classList.toggle('visible', !!searchInput.value);
    };

    const updateSearchStatus = (unavailable) => {
      if (!searchStatus) return;
      searchStatus.textContent = unavailable?.length > 0 ? 'Server search unavailable' : '';
    };

    searchInput.addEventListener('input', (e) => {
      clearTimeout(asyncDebounceTimer);
      updateClearButton();

      const searchText = e.target.value.trim();

      if (!searchText || searchText.length < 2) {
        if (!searchText) {
          currentSearchId++;
          this.hierarchy.clearSearchFilter();
          updateSearchStatus([]);
        }
        return;
      }

      asyncDebounceTimer = setTimeout(async () => {
        const searchId = ++currentSearchId;

        // Do local search on already-loaded nodes
        const localMatches = this.hierarchy.searchLocalNodes(searchText.toLowerCase());

        // Do server search if connected
        let serverResults = { matches: [], paths: [], unavailable: [] };
        if (this.client.connected) {
          serverResults = await this.client.searchNodes(searchText);
        }

        // Check if this search is still current (newer search may have started)
        if (searchId !== currentSearchId) return;

        updateSearchStatus(serverResults.unavailable);

        // Merge and dedupe results
        const seenKeys = new Set();
        const mergedMatches = [];

        // Add server matches first
        for (const match of serverResults.matches) {
          const key = `${match.type}_${match.id}`;
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            mergedMatches.push(match);
          }
        }

        // Add local matches
        for (const match of localMatches) {
          const key = `${match.type}_${match.id}`;
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            mergedMatches.push(match);
          }
        }

        const mergedResults = {
          matches: mergedMatches,
          paths: serverResults.paths
        };

        // Final check before applying results
        if (searchId !== currentSearchId) return;

        // Always apply filter - with no results, this hides everything
        await this.hierarchy.revealSearchResults(mergedResults, (node) => this.model.loadNodeChildren(node));
      }, 300);
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        clearSearch();
      }
    });

    clearBtn?.addEventListener('click', () => {
      clearSearch();
      searchInput.focus();
    });
  }

  setupTypeFilter() {
    const filterBtn = document.getElementById('type-filter-btn');
    const dropdown = document.getElementById('type-filter-dropdown');

    if (!filterBtn || !dropdown) return;

    // Split types into categories using shared type definitions
    // Root is standalone at top, not in any category
    const rootType = NODE_TYPES.find(t => t.name === 'Root');
    const celestialTypesList = NODE_TYPES.filter(t => CELESTIAL_NAMES.has(t.name));
    const terrestrialTypes = NODE_TYPES.filter(t => !CELESTIAL_NAMES.has(t.name) && !PHYSICAL_NAMES.has(t.name) && t.name !== 'Root');
    const physicalTypesList = NODE_TYPES.filter(t => PHYSICAL_NAMES.has(t.name));

    const createCategory = (name, types) => {
      const category = document.createElement('div');
      category.className = 'filter-category';

      const header = document.createElement('label');
      header.className = 'filter-category-header';
      header.innerHTML = `<input type="checkbox" data-category="${name}" checked> ${name}`;
      category.appendChild(header);

      const items = document.createElement('div');
      items.className = 'filter-category-items';

      for (const type of types) {
        const label = document.createElement('label');
        const isCelestial = CELESTIAL_NAMES.has(type.name);
        const isPhysical = PHYSICAL_NAMES.has(type.name);

        let shapeClass, colorStyle;
        if (isCelestial) {
          shapeClass = 'type-triangle';
          colorStyle = 'border-bottom-color';
        } else if (isPhysical) {
          shapeClass = 'type-square';
          colorStyle = 'background';
        } else {
          shapeClass = 'type-dot';
          colorStyle = 'background';
        }

        label.innerHTML = `<input type="checkbox" value="${type.name}" checked><span class="${shapeClass}" style="${colorStyle}: var(${type.cssVar})"></span> ${type.name}`;
        items.appendChild(label);
      }

      category.appendChild(items);
      return category;
    };

    // Add Root as standalone at top (unchecked by default)
    if (rootType) {
      const rootLabel = document.createElement('label');
      rootLabel.className = 'filter-standalone';
      rootLabel.innerHTML = `<input type="checkbox" value="Root"><span class="type-dot" style="background: var(${rootType.cssVar})"></span> Root`;
      dropdown.appendChild(rootLabel);
    }

    const celestialCategory = createCategory('Celestial', celestialTypesList);

    // Add Orbits toggle at top of Celestial category items
    const orbitsLabel = document.createElement('label');
    orbitsLabel.className = 'filter-orbits-toggle';
    orbitsLabel.innerHTML = `<input type="checkbox" id="orbits-toggle" checked> Orbits`;
    const celestialItems = celestialCategory.querySelector('.filter-category-items');
    celestialItems.insertBefore(orbitsLabel, celestialItems.firstChild);

    dropdown.appendChild(celestialCategory);
    dropdown.appendChild(createCategory('Terrestrial', terrestrialTypes));
    dropdown.appendChild(createCategory('Physical', physicalTypesList));

    // Add reset button
    const resetBtn = document.createElement('button');
    resetBtn.className = 'filter-reset-btn';
    resetBtn.textContent = 'Reset to Defaults';
    resetBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.viewBounds.resetTypeFilter();
    });
    dropdown.appendChild(resetBtn);

    // Handle Orbits toggle
    const orbitsToggle = document.getElementById('orbits-toggle');
    if (orbitsToggle) {
      orbitsToggle.addEventListener('change', (e) => {
        this.viewBounds.setOrbitsVisible(e.target.checked);
      });
    }

    // Toggle dropdown
    filterBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('hidden');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      dropdown.classList.add('hidden');
    });

    // Prevent dropdown from closing when clicking inside it
    dropdown.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Handle category checkbox changes (toggle all children)
    dropdown.querySelectorAll('input[data-category]').forEach(categoryCheckbox => {
      categoryCheckbox.addEventListener('change', () => {
        const category = categoryCheckbox.closest('.filter-category');
        const childCheckboxes = category.querySelectorAll('.filter-category-items input[type="checkbox"]');
        childCheckboxes.forEach(cb => {
          cb.checked = categoryCheckbox.checked;
        });
        this.updateTypeFilter(dropdown);
      });
    });

    // Handle individual checkbox changes in categories
    dropdown.querySelectorAll('.filter-category-items input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        // Update category checkbox state
        const category = checkbox.closest('.filter-category');
        const categoryCheckbox = category.querySelector('input[data-category]');
        const childCheckboxes = category.querySelectorAll('.filter-category-items input[type="checkbox"]');
        const allChecked = Array.from(childCheckboxes).every(cb => cb.checked);
        const someChecked = Array.from(childCheckboxes).some(cb => cb.checked);
        categoryCheckbox.checked = allChecked;
        categoryCheckbox.indeterminate = someChecked && !allChecked;
        this.updateTypeFilter(dropdown);
      });
    });

    // Handle standalone checkbox changes (Root)
    dropdown.querySelectorAll('.filter-standalone input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.updateTypeFilter(dropdown);
      });
    });

    // Sync checkboxes with restored state
    this.viewBounds.syncTypeFilterCheckboxes();

    // Sync orbits checkbox separately (excluded from type filter sync)
    if (orbitsToggle) {
      orbitsToggle.checked = this.viewBounds.orbitsVisible;
    }
  }

  updateTypeFilter(dropdown) {
    const getCheckedValues = (selector) =>
      Array.from(dropdown.querySelectorAll(selector))
        .filter(cb => cb.checked)
        .map(cb => cb.value);

    const categoryTypes = getCheckedValues('.filter-category-items input[type="checkbox"]');
    const standaloneTypes = getCheckedValues('.filter-standalone input[type="checkbox"]');
    this.viewBounds.setTypeFilter([...standaloneTypes, ...categoryTypes]);
  }

  setupHierarchyEvents() {
    this.hierarchy.onZoom(node => {
      this.viewGraph.zoomToNode(node);
      this.viewBounds.zoomToNode(node);
    });
  }

  setupViewEvents() {
    this.viewGraph.onMsfLoad(url => {
      this.layout.setUrl(url);
      this.handleLoadMap(url);
    });

    this.viewBounds.onMsfLoad(url => {
      this.layout.setUrl(url);
      this.handleLoadMap(url);
    });
  }

  setupLayoutEvents() {
    this.layout.onLoad(async ({ url }) => {
      // Capture planet context from selected node before loading new map
      const selectedNode = this.model.getSelectedNode();
      if (selectedNode) {
        this.model.inheritedPlanetContext = this.model.getPlanetContext(selectedNode);
      }
      await this.handleLoadMap(url);
    });
  }

  setupClientEvents() {
    this.client.on('connected', () => {
      this.layout.setStatus('Connected', 'connected');
    });

    this.client.on('disconnected', () => {
      this.layout.setStatus('Disconnected', 'disconnected');
    });

    this.client.on('error', (error) => {
      console.error('MV Client error:', error);
      this.layout.setStatus('Error: ' + error.message, 'disconnected');
    });

    this.client.on('status', (msg) => {
      this.layout.setStatus(msg, 'loading');
    });

  }

  async handleLoadMap(url, { skipStateRestore = false } = {}) {
    try {
      this.layout.setStatus('Loading map...', 'loading');

      const tree = await this.client.loadMap(url);

      // Detect Earth MSF and set default planet context
      let planetContext = this.model.inheritedPlanetContext;
      if (!planetContext && url.includes('earth.msf')) {
        planetContext = {
          planetName: 'Earth',
          celestialId: 104,
          radius: 6371000
        };
      }

      this.model.setTree(tree, planetContext);

      this.layout.setFollowLink(null);
      this.rp1GoBtn?.classList.add('hidden');

      this.layout.setStatus('Map loaded', 'connected');
      this.stateManager.updateSection('navigation', { mapUrl: url });

      const root = this.model.tree;
      if (root) {
        if (skipStateRestore) {
          this.model.expandNode(root);
        } else {
          this._restoringState = true;
          this._clearRestoringStateWhenReady();

          const hierarchyState = this.stateManager.getSection('hierarchy');
          const hasSavedExpanded = hierarchyState.expandedNodeIds?.length > 0;

          this.model.expandNode(root);
          if (root.children) {
            for (const child of root.children) {
              this.model.expandNode(child);
            }
          }
          if (hasSavedExpanded) {
            this.model.expandNodesByKeys(hierarchyState.expandedNodeIds);
          }
          if (hierarchyState.liveUpdateNodeIds?.length > 0) {
            this.model.enableLiveUpdatesByKeys(hierarchyState.liveUpdateNodeIds);
          }

          const navState = this.stateManager.getSection('navigation');
          if (navState.selectedNodePath?.length > 0) {
            this.restoreNodePath(navState.selectedNodePath);
          } else {
            this.model.selectNode(root);
            setTimeout(() => {
              this.viewGraph.zoomToNode(root);
            }, 100);
          }
        }
      }
    } catch (error) {
      this.layout.setStatus('Load error: ' + error.message, 'disconnected');
    }
  }

  _clearRestoringStateWhenReady() {
    if (this._restoringStateTimeout) {
      clearTimeout(this._restoringStateTimeout);
    }
    if (this._restoringStateHandler) {
      this.model.off('dataChanged', this._restoringStateHandler);
    }

    this._restoringStateHandler = () => {
      if (!this._restoringState) return;
      if (this.model._pendingExpandedKeys || this.model._pendingSelectedKey) return;

      this._restoringState = false;
      this.model.off('dataChanged', this._restoringStateHandler);
      this._restoringStateHandler = null;
      if (this._restoringStateTimeout) {
        clearTimeout(this._restoringStateTimeout);
        this._restoringStateTimeout = null;
      }

      this.stateManager.updateSection('hierarchy', {
        expandedNodeIds: this.model.getExpandedNodeKeys(),
        liveUpdateNodeIds: this.model.getLiveUpdateNodeKeys()
      });
    };

    this.model.on('dataChanged', this._restoringStateHandler);

    this._restoringStateTimeout = setTimeout(() => {
      this._restoringStateTimeout = null;
      if (this._restoringState) {
        this._restoringState = false;
        if (this._restoringStateHandler) {
          this.model.off('dataChanged', this._restoringStateHandler);
          this._restoringStateHandler = null;
        }
      }
    }, 10000);
  }

  restoreNodePath(path) {
    if (!this.model.tree) return;
    if (!path || path.length === 0) {
      this.model.selectNode(this.model.tree);
      return;
    }

    let startIndex = path.findIndex(p => p.id === this.model.tree.id && p.type === this.model.tree.type);
    if (startIndex === -1) {
      this.model.selectNode(this.model.tree);
      return;
    }

    // Ensure all intermediate nodes in the path are expanded (or pending expansion)
    // so the MVMF event cascade will load their children, eventually reaching the target
    for (let i = startIndex; i < path.length - 1; i++) {
      const key = `${path[i].type}_${path[i].id}`;
      const node = this.model.getNode(path[i].type, path[i].id);
      if (node) {
        this.model.expandNode(node);
      } else {
        this.model.addPendingExpandedKey(key);
      }
    }

    // Select the target node now if it exists, otherwise set pending selection
    const targetStep = path[path.length - 1];
    const targetKey = `${targetStep.type}_${targetStep.id}`;
    const targetNode = this.model.getNode(targetStep.type, targetStep.id);

    if (targetNode) {
      this.model.selectNode(targetNode);
      this.viewBounds.zoomToNode(targetNode);
      setTimeout(() => this.viewGraph.zoomToNode(targetNode), 100);
    } else {
      this.model._pendingSelectedKey = targetKey;
      this._zoomOnSelectionKey = targetKey;
    }
  }

}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
