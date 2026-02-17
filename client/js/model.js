/**
 * Copyright (c) 2026 Patched Reality, Inc.
 */

import { NodeAdapter } from './node-adapter.js';

/**
 * Model - Single source of truth for shared application state.
 * Subscribes to MVClient server events and maintains the node tree.
 * Views subscribe to Model events and only hold rendering-specific state.
 * Uses the same on/off callback pattern as MVClient.
 */
export class Model {
  constructor(client) {
    this.client = client;
    this.tree = null;
    this.nodes = new Map();
    this.selectedNode = null;
    this._pendingExpandedKeys = null;  // Map<key, parentKey> for storage restore
    this._pendingSelectedKey = null;
    this.inheritedPlanetContext = null;

    this._dataChangedTimer = null;

    // Search state
    this.searchActive = false;
    this.searchTerm = '';

    this.callbacks = {
      treeChanged: [],
      nodeChildrenChanged: [],
      nodeUpdated: [],
      nodeInserted: [],
      nodeDeleted: [],
      nodeLoadFailed: [],
      dataChanged: [],
      selectionChanged: [],
      expansionChanged: [],
      disconnected: [],
      searchStateChanged: [],
      searchResultsUpdated: []
    };

    this._bindClientEvents();
  }

  _bindClientEvents() {
    this.client.on('nodeInserted', ({ mvmfModel, parentType, parentId }) => {
      if (!mvmfModel) return;
      this._handleNodeInserted(mvmfModel, parentType, parentId);
    });

    this.client.on('nodeUpdated', ({ id, type, mvmfModel }) => {
      this._handleNodeUpdated(id, type, mvmfModel);
    });

    this.client.on('nodeDeleted', ({ id, type, sourceParentType, sourceParentId }) => {
      this._handleNodeDeleted(id, type, sourceParentType, sourceParentId);
    });

    this.client.on('modelReady', (data) => {
      this._onModelReady(data);
    });

    this.client.on('disconnected', () => {
      this._emit('disconnected');
    });
  }

  on(event, handler) {
    if (this.callbacks[event]) {
      this.callbacks[event].push(handler);
    }
  }

  off(event, handler) {
    if (this.callbacks[event]) {
      const index = this.callbacks[event].indexOf(handler);
      if (index !== -1) {
        this.callbacks[event].splice(index, 1);
      }
    }
  }

  _scheduleDataChanged() {
    if (!this._dataChangedTimer) {
      this._dataChangedTimer = setTimeout(() => {
        this._dataChangedTimer = null;
        this._emit('dataChanged');
      }, 0);
    }
  }

  _emit(event, ...args) {
    this.callbacks[event]?.forEach(handler => {
      try {
        handler(...args);
      } catch (e) {
        console.error(`Model event handler error [${event}]:`, e);
      }
    });
  }

  nodeKey(node) {
    if (!node) return null;
    return `${node.type}_${node.id}`;
  }

  // --- Tree Management ---

  setTree(rootModel, inheritedPlanetContext = null) {
    this.nodes.clear();
    this.selectedNode = null;
    this._pendingExpandedKeys = null;
    this._pendingSelectedKey = null;
    this._pendingLiveUpdateKeys = null;
    this.inheritedPlanetContext = inheritedPlanetContext;

    if (rootModel) {
      this.tree = new NodeAdapter(rootModel);
      const childModels = this.client.enumerateChildren(rootModel);
      if (childModels.length > 0) {
        this.tree.children = childModels.map(c => new NodeAdapter(c));
      }
      this._indexNode(this.tree, null);
    } else {
      this.tree = null;
    }

    this._emit('treeChanged', this.tree);
  }

  _indexNode(node, parent) {
    if (!node) return;
    const key = node.key;
    this.nodes.set(key, node);
    node._parent = parent;

    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        this._indexNode(child, node);
      }
    }
  }

  getNode(type, id) {
    return this.nodes.get(`${type}_${id}`) || null;
  }

  setChildren(parentNode, children) {
    if (!parentNode) return;

    if (parentNode.children) {
      for (const oldChild of parentNode.children) {
        this._removeFromIndex(oldChild);
      }
    }
    if (!this.selectedNode && this._pendingSelectedKey) {
      const savedKey = this._pendingSelectedKey;
      this.selectNode(parentNode);
      this._pendingSelectedKey = savedKey;
    }

    parentNode.children = children;

    if (children) {
      for (const child of children) {
        this._indexNode(child, parentNode);
      }
    }

    this._emit('nodeChildrenChanged', parentNode);

    // Check after emit so hierarchy DOM elements exist before selection fires
    this._checkPendingSelection();

    this._scheduleDataChanged();

    if (children) {
      for (const child of children) {
        if (this._pendingExpandedKeys) {
          this._checkPendingExpansion(child);
        }
        this._checkPendingLiveUpdate(child);
      }
    }

    this._checkExpandAllDescendants(parentNode, children);
  }

  _detachChildren(node) {
    if (!node?.children) return;
    for (const child of node.children) {
      this._detachChildren(child);
      this.client.closeModel({ sID: child.type, twObjectIx: child.id });
    }
  }

  _removeFromIndex(node) {
    if (!node) return;
    const key = node.key;
    this.nodes.delete(key);
    if (node.isExpanded) {
      if (!this._pendingExpandedKeys) {
        this._pendingExpandedKeys = new Map();
      }
      this._pendingExpandedKeys.set(key, node._parent?.key || null);
    }
    if (node.liveUpdatesEnabled) {
      if (!this._pendingLiveUpdateKeys) {
        this._pendingLiveUpdateKeys = new Set();
      }
      this._pendingLiveUpdateKeys.add(key);
    }
    if (this.selectedNode?.key === key) {
      this._pendingSelectedKey = key;
      this.selectedNode = null;
    }
    if (node.children) {
      for (const child of node.children) {
        this._removeFromIndex(child);
      }
    }
  }

  _checkPendingSelection() {
    if (!this._pendingSelectedKey) return;
    const newSelected = this.nodes.get(this._pendingSelectedKey);
    if (newSelected) {
      this._pendingSelectedKey = null;
      this.selectNode(newSelected);
    }
  }

  // --- Node Loading ---

  _openNode(node) {
    if (!node) return;
    this.client.openModel({ sID: node.type, twObjectIx: node.id });
    node.isLoading = true;
    this._emit('nodeUpdated', node);
  }

  // --- Selection ---

  selectNode(node) {
    const previousNode = this.selectedNode;
    if (previousNode === node) return;

    this.selectedNode = node;
    this._pendingSelectedKey = null;
    if (node) {
      this._openNode(node);
    }
    this._emit('selectionChanged', node, previousNode);
  }

  getSelectedNode() {
    return this.selectedNode;
  }

  // --- Expansion ---

  expandNode(node) {
    if (!node || node.isExpanded) return;
    node.isExpanded = true;
    this._openNode(node);
    this._emit('expansionChanged', node, true);
  }


  collapseNode(node) {
    if (!node || !node.isExpanded) return;

    node.isExpanded = false;
    node.expandAllActive = false;
    node.isSearchAncestor = false;
    this._detachChildren(node);
    this._clearDescendantPendingKeys(node);

    this._emit('expansionChanged', node, false);
  }

  isNodeExpanded(node) {
    return node?.isExpanded === true;
  }

  getExpandedNodeKeys() {
    const keys = [];
    for (const [key, node] of this.nodes) {
      if (node.isExpanded) {
        keys.push({ key, parent: node._parent?.key || null });
      }
    }
    if (this._pendingExpandedKeys) {
      for (const [key, parentKey] of this._pendingExpandedKeys) {
        keys.push({ key, parent: parentKey });
      }
    }
    return keys;
  }

  addPendingExpandedKey(key, parentKey = null) {
    if (!this._pendingExpandedKeys) {
      this._pendingExpandedKeys = new Map();
    }
    this._pendingExpandedKeys.set(key, parentKey);
  }

  expandNodesByKeys(keys) {
    if (!keys?.length) return;
    this._pendingExpandedKeys = new Map();

    // Two-pass approach: first register all pending keys, then expand found nodes.
    // This prevents race conditions where synchronous modelReady events
    // check for pending keys before they've been registered.
    // Store keys (not node refs) because nodes may be replaced during expansion.
    const keysToExpand = [];

    for (const item of keys) {
      const key = typeof item === 'string' ? item : item.key;
      const parentKey = typeof item === 'string' ? null : item.parent;

      if (this.nodes.has(key)) {
        keysToExpand.push(key);
      } else {
        this._pendingExpandedKeys.set(key, parentKey);
      }
    }

    for (const key of keysToExpand) {
      const node = this.nodes.get(key);
      if (node) {
        this.expandNode(node);
      }
    }

    if (this._pendingExpandedKeys.size === 0) {
      this._pendingExpandedKeys = null;
    }
  }

  _checkPendingExpansion(node) {
    if (!node || !this._pendingExpandedKeys) return;
    const key = node.key;
    if (this._pendingExpandedKeys.has(key)) {
      const parentKey = this._pendingExpandedKeys.get(key);
      this._pendingExpandedKeys.delete(key);

      // Ensure parent is attached so this node is visible
      if (parentKey) {
        const parentNode = this.nodes.get(parentKey);
        if (parentNode && !parentNode.isReady) {
          this._openNode(parentNode);
        }
      }

      // Defer expansion - look up current node by key to avoid stale references
      setTimeout(() => {
        const currentNode = this.nodes.get(key);
        if (currentNode) {
          this.expandNode(currentNode);
        }
      }, 0);

      if (this._pendingExpandedKeys.size === 0) {
        this._pendingExpandedKeys = null;
      }
    }
  }

  _checkPendingLiveUpdate(node) {
    if (!node || !this._pendingLiveUpdateKeys) return;
    const key = node.key;
    if (this._pendingLiveUpdateKeys.has(key)) {
      this._pendingLiveUpdateKeys.delete(key);
      this.enableLiveUpdates(node);
      if (this._pendingLiveUpdateKeys.size === 0) {
        this._pendingLiveUpdateKeys = null;
      }
    }
  }

  _clearDescendantPendingKeys(node) {
    if (!node || !this._pendingExpandedKeys?.size) return;

    const nodeKey = node.key;

    const keysToDelete = [];
    for (const [key, parentKey] of this._pendingExpandedKeys) {
      if (this._isDescendantOfKey(key, parentKey, nodeKey)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this._pendingExpandedKeys.delete(key);
    }

    if (this._pendingExpandedKeys.size === 0) {
      this._pendingExpandedKeys = null;
    }
  }

  _isDescendantOfKey(key, parentKey, ancestorKey) {
    if (parentKey === ancestorKey) return true;
    if (!parentKey) return false;

    const grandparentKey = this._pendingExpandedKeys.get(parentKey);
    if (grandparentKey !== undefined) {
      return this._isDescendantOfKey(parentKey, grandparentKey, ancestorKey);
    }

    const parentNode = this.nodes.get(parentKey);
    if (parentNode?._parent) {
      const gpKey = parentNode._parent.key;
      return gpKey === ancestorKey || this._isDescendantOfKey(parentKey, gpKey, ancestorKey);
    }

    return false;
  }

  expandChildren(node) {
    if (!node) return;
    this.expandNode(node);
    if (node.children) {
      for (const child of node.children) {
        this.expandNode(child);
      }
    }
  }

  expandAllDescendants(node) {
    if (!node) return;
    const hasChildren = node.children?.length > 0 || node.hasChildren;
    if (!hasChildren) return;

    let ancestor = node._parent;
    while (ancestor) {
      if (!ancestor.isExpanded) return;
      ancestor = ancestor._parent;
    }

    node.expandAllActive = true;
    node.isExpanded = true;
    this._openNode(node);
    this._emit('expansionChanged', node, true);

    if (node.children) {
      for (const child of node.children) {
        setTimeout(() => this.expandAllDescendants(child), 0);
      }
    }
  }

  collapseAllDescendants(node) {
    if (!node) return;

    const hasChildren = node.children?.length > 0 || node.hasChildren;
    if (!hasChildren) return;

    // Collect all nodes to collapse first (iterative to avoid stack overflow)
    const toCollapse = [];
    const queue = [node];
    while (queue.length > 0) {
      const current = queue.shift();
      const currentHasChildren = current.children?.length > 0 || current.hasChildren;
      if (!currentHasChildren) continue;

      if (current.isExpanded || current.expandAllActive) {
        toCollapse.push(current);
      }
      if (current.children) {
        queue.push(...current.children);
      }
    }

    // Clear all pending expanded keys that are descendants
    this._clearDescendantPendingKeys(node);

    // Detach + close children of collapsed nodes
    for (const n of toCollapse) {
      this._detachChildren(n);
    }

    // Collapse all collected nodes synchronously
    for (const n of toCollapse) {
      n.isExpanded = false;
      n.expandAllActive = false;
      n.isSearchAncestor = false;
    }

    // Emit events after all state changes are complete
    for (const n of toCollapse) {
      this._emit('expansionChanged', n, false);
    }

    // Trigger dataChanged so _restoringStateHandler can finalize state
    this._scheduleDataChanged();
  }

  _checkExpandAllDescendants(parentNode, children) {
    if (!parentNode.expandAllActive || !children) return;

    parentNode.expandAllActive = false;

    for (const child of children) {
      this.expandAllDescendants(child);
    }
  }

  // --- Live Updates ---

  enableLiveUpdates(node) {
    if (!node) return;
    node.liveUpdatesEnabled = true;
    this.client.subscribe({ sID: node.type, twObjectIx: node.id });
    this._emit('nodeUpdated', node);
    if (node.isExpanded && node.children) {
      for (const child of node.children) {
        this.enableLiveUpdates(child);
      }
    }
  }

  disableLiveUpdates(node) {
    if (!node) return;
    node.liveUpdatesEnabled = false;
    this.client.closeModel({ sID: node.type, twObjectIx: node.id });
    this._emit('nodeUpdated', node);
    if (node.children) {
      for (const child of node.children) {
        if (child.liveUpdatesEnabled) {
          this.disableLiveUpdates(child);
        }
      }
    }
  }

  isLiveUpdateEnabled(node) {
    return node.liveUpdatesEnabled;
  }

  getLiveUpdateNodeKeys() {
    const keys = [];
    for (const [key, node] of this.nodes) {
      if (node.liveUpdatesEnabled) {
        keys.push(key);
      }
    }
    return keys;
  }

  enableLiveUpdatesByKeys(keys) {
    if (!keys || keys.length === 0) return;
    if (!this._pendingLiveUpdateKeys) {
      this._pendingLiveUpdateKeys = new Set();
    }
    for (const key of keys) {
      const node = this.nodes.get(key);
      if (node) {
        node.liveUpdatesEnabled = true;
        this.client.subscribe({ sID: node.type, twObjectIx: node.id });
        this._emit('nodeUpdated', node);
      } else {
        this._pendingLiveUpdateKeys.add(key);
      }
    }
    if (this._pendingLiveUpdateKeys.size === 0) {
      this._pendingLiveUpdateKeys = null;
    }
  }

  // --- Client Event Handlers ---

  _handleNodeInserted(mvmfModel, parentType, parentId) {
    const childKey = `${mvmfModel.sID}_${mvmfModel.twObjectIx}`;

    const parentNode = (parentType && parentId !== undefined)
      ? this.getNode(parentType, parentId)
      : null;

    if (!parentNode) {
      return;
    }

    const existingIdx = parentNode.children.findIndex(
      c => c.type === mvmfModel.sID && c.id === mvmfModel.twObjectIx
    );
    if (existingIdx !== -1) {
      const node = parentNode.children[existingIdx];
      node.updateModel(mvmfModel);
      this._emit('nodeUpdated', node);
      this._scheduleDataChanged();
      return;
    }

    const existingNode = this.nodes.get(childKey);
    if (existingNode && existingNode._parent && existingNode._parent !== parentNode) {
      const oldParent = existingNode._parent;
      const oldIdx = oldParent.children.indexOf(existingNode);
      if (oldIdx !== -1) {
        oldParent.children.splice(oldIdx, 1);
      }
      existingNode.updateModel(mvmfModel);
      parentNode.children.push(existingNode);
      existingNode._parent = parentNode;
      if (parentNode.liveUpdatesEnabled && !existingNode.liveUpdatesEnabled) {
        existingNode.liveUpdatesEnabled = true;
        this.client.subscribe({ sID: existingNode.type, twObjectIx: existingNode.id });
      }
      this._emit('nodeInserted', { node: existingNode, parentNode });
      this._checkPendingExpansion(existingNode);
      this._checkPendingSelection();
      this._scheduleDataChanged();
      return;
    }

    const adapter = new NodeAdapter(mvmfModel);
    parentNode.children.push(adapter);
    this._indexNode(adapter, parentNode);

    this._emit('nodeInserted', { node: adapter, parentNode });
    this._checkPendingExpansion(adapter);
    this._checkPendingSelection();
    this._scheduleDataChanged();
  }

  _handleNodeUpdated(id, type, mvmfModel) {
    const key = `${type}_${id}`;
    const adapter = this.nodes.get(key);
    if (adapter) {
      if (mvmfModel) {
        adapter.updateModel(mvmfModel);
      } else {
        adapter.markDirty();
      }
      this._emit('nodeUpdated', adapter);
      this._scheduleDataChanged();
    }
  }

  _handleNodeDeleted(id, type, sourceParentType, sourceParentId) {
    const sourceParent = (sourceParentType && sourceParentId !== undefined)
      ? this.getNode(sourceParentType, sourceParentId)
      : null;

    if (sourceParent?.children) {
      const idx = sourceParent.children.findIndex(c => c.type === type && c.id === id);
      if (idx !== -1) {
        const removed = sourceParent.children.splice(idx, 1)[0];
        this._removeFromIndex(removed);
        if (!this.selectedNode && this._pendingSelectedKey) {
          const savedKey = this._pendingSelectedKey;
          this.selectNode(sourceParent);
          this._pendingSelectedKey = savedKey;
        }
        this._emit('nodeDeleted', { node: removed, parentNode: sourceParent });
        this._scheduleDataChanged();
      }
    }
  }

  _onModelReady({ mvmfModel }) {
    if (!mvmfModel) return;
    const key = `${mvmfModel.sID}_${mvmfModel.twObjectIx}`;
    const adapter = this.nodes.get(key);
    if (!adapter) return;

    adapter.updateModel(mvmfModel);
    const children = this.client.enumerateChildren(mvmfModel);
    this.setChildren(adapter, children.map(c => new NodeAdapter(c)));
    this._emit('nodeUpdated', adapter);
    this._scheduleDataChanged();
  }

  // --- Search ---

  setSearchActive(active, term = '') {
    const wasActive = this.searchActive;
    this.searchActive = active;
    this.searchTerm = term;

    if (wasActive !== active) {
      this._emit('searchStateChanged', active, term);
    }
  }

  async search(searchText) {
    if (!searchText || searchText.length < 2) {
      this.clearSearch();
      return;
    }

    // Clear previous search flags before starting new search
    this._clearSearchFlags();
    this.setSearchActive(true, searchText);

    // Search local nodes in model
    const localMatches = this._searchLocalNodes(searchText.toLowerCase());

    // Search server if connected
    let serverResults = { matches: [], paths: [] };
    if (this.client.connected) {
      serverResults = await this.client.searchNodes(searchText);
    }

    // Check if search is still current (user may have typed more)
    if (this.searchTerm !== searchText) return;

    // Merge and dedupe results
    const seenKeys = new Set();
    const allMatches = [];

    for (const match of serverResults.matches) {
      const key = `${match.type}_${match.id}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        allMatches.push(match);
      }
    }

    for (const match of localMatches) {
      const key = `${match.type}_${match.id}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        allMatches.push(match);
      }
    }

    const mergedResults = {
      matches: allMatches,
      paths: serverResults.paths || []
    };

    // Process results asynchronously
    this._processSearchResults(mergedResults);
  }

  _searchLocalNodes(searchTerm) {
    const matches = [];
    for (const [key, node] of this.nodes) {
      if (node.name && node.name.toLowerCase().includes(searchTerm)) {
        matches.push({
          id: node.id,
          name: node.name,
          type: node.type,
          nodeType: node.nodeType
        });
      }
    }
    return matches;
  }

  _processSearchResults(results) {
    // Sort paths by ancestorDepth descending so parents are processed before children
    const sortedPaths = [...(results.paths || [])].sort((a, b) =>
      (b.ancestorDepth || 0) - (a.ancestorDepth || 0)
    );
    const items = [
      ...sortedPaths,
      ...(results.matches || [])
    ];

    // Process in batches to avoid blocking UI
    const BATCH_SIZE = 50;
    let index = 0;

    const processBatch = () => {
      // Abort if search was cleared
      if (!this.searchActive) return;

      const batchEnd = Math.min(index + BATCH_SIZE, items.length);

      for (; index < batchEnd; index++) {
        const item = items[index];
        const key = `${item.type}_${item.id}`;

        let node = this.nodes.get(key);
        if (!node) {
          // Create new node
          node = NodeAdapter.fromSearchResult(item);
          this.nodes.set(key, node);

          // Wire parent link - only if actual parent exists, don't fall back to root
          let parentNode = null;
          if (item.parentType && item.parentId !== undefined && item.parentId !== null) {
            parentNode = this.getNode(item.parentType, item.parentId);
          }
          if (parentNode) {
            node._parent = parentNode;
            // Only add to children if not already there
            if (!parentNode.children.includes(node)) {
              parentNode.children.push(node);
            }
            this._emit('nodeInserted', { node, parentNode });
          }
        } else if (!node._parent) {
          // Node exists but wasn't wired to parent yet - try again
          let parentNode = null;
          if (item.parentType && item.parentId !== undefined && item.parentId !== null) {
            parentNode = this.getNode(item.parentType, item.parentId);
          }
          if (parentNode) {
            node._parent = parentNode;
            if (!parentNode.children.includes(node)) {
              parentNode.children.push(node);
            }
            this._emit('nodeInserted', { node, parentNode });
          }
        }

        // State on the node itself
        const isMatch = results.matches?.some(m => m.type === item.type && m.id === item.id);
        if (isMatch) {
          node.isSearchMatch = true;
          this._emit('nodeUpdated', node);
        }

        // Mark ancestors (with cycle detection)
        const visited = new Set();
        let parent = node._parent;
        while (parent && !visited.has(parent.key)) {
          visited.add(parent.key);
          if (!parent.isSearchAncestor) {
            parent.isSearchAncestor = true;
            this._emit('nodeUpdated', parent);
          }
          parent = parent._parent;
        }
      }

      if (index < items.length) {
        setTimeout(processBatch, 0);
      } else {
        // Mark root as ancestor
        if (this.tree && !this.tree.isSearchAncestor) {
          this.tree.isSearchAncestor = true;
          this._emit('nodeUpdated', this.tree);
        }
      }
    };

    processBatch();
  }

  _clearSearchFlags() {
    for (const [key, node] of this.nodes) {
      if (node.isSearchMatch || node.isSearchAncestor) {
        node.isSearchMatch = false;
        node.isSearchAncestor = false;
        this._emit('nodeUpdated', node);
      }
    }
  }

  clearSearch() {
    if (!this.searchActive) return;
    this._clearSearchFlags();
    this.setSearchActive(false);
  }

  // --- Context & Path Utilities ---

  getPlanetContext(node) {
    return node?._planetContext || this.inheritedPlanetContext || null;
  }

  getPathToNode(node) {
    const path = [];
    const visited = new Set();
    let current = node;
    while (current && !visited.has(current.key)) {
      visited.add(current.key);
      path.unshift({ id: current.id, type: current.type });
      current = current._parent;
    }
    return path;
  }

}
