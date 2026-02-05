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
    this.expandedNodes = new Set();
    this._pendingExpandedKeys = null;
    this._pendingSelectedKey = null;
    this._liveUpdateKeys = new Set();
    this.inheritedPlanetContext = null;

    this._dataChangedTimer = null;

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
      disconnected: []
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

    this.client.on('modelReady', ({ mvmfModel }) => {
      this._upgradeStubModel(mvmfModel);
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
    this.expandedNodes.clear();
    this._pendingExpandedKeys = null;
    this._pendingSelectedKey = null;
    this._liveUpdateKeys = new Set();
    this.inheritedPlanetContext = inheritedPlanetContext;

    if (rootModel) {
      this.tree = this._createAdapterTree(rootModel);
      this._indexNode(this.tree, null);
    } else {
      this.tree = null;
    }

    this._emit('treeChanged', this.tree);
  }

  _createAdapterTree(mvmfModel) {
    const adapter = new NodeAdapter(mvmfModel);
    const childModels = this.client.enumerateChildren(mvmfModel);
    adapter.children = childModels.map(c => new NodeAdapter(c));
    return adapter;
  }

  _indexNode(node, parent) {
    const key = this.nodeKey(node);
    if (key) {
      this.nodes.set(key, node);
    }
    node._parent = parent;

    if (parent?.liveUpdatesEnabled || this._liveUpdateKeys.has(key)) {
      node.liveUpdatesEnabled = true;
      this._liveUpdateKeys.add(key);
      this.client.enableLiveUpdates({ sID: node.type, twObjectIx: node.id });
    }

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

    if (children && this._pendingExpandedKeys) {
      for (const child of children) {
        this._checkPendingExpansion(child);
      }
    }

    this._checkExpandAllDescendants(parentNode, children);
  }

  // Moves expanded keys to _pendingExpandedKeys instead of discarding them,
  // so they restore automatically when replacement nodes appear
  _removeFromIndex(node) {
    const key = this.nodeKey(node);
    if (key) {
      this.nodes.delete(key);
      if (this.expandedNodes.delete(key)) {
        if (!this._pendingExpandedKeys) {
          this._pendingExpandedKeys = new Set();
        }
        this._pendingExpandedKeys.add(key);
      }
      if (this.selectedNode && this.nodeKey(this.selectedNode) === key) {
        this._pendingSelectedKey = key;
        this.selectedNode = null;
      }
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

  // --- Selection ---

  selectNode(node) {
    const previousNode = this.selectedNode;
    if (previousNode === node) return;

    this.selectedNode = node;
    this._pendingSelectedKey = null;
    this._emit('selectionChanged', node, previousNode);
  }

  getSelectedNode() {
    return this.selectedNode;
  }

  // --- Expansion ---

  expandNode(node) {
    const key = this.nodeKey(node);
    if (!key || this.expandedNodes.has(key)) return;

    this.expandedNodes.add(key);
    this._emit('expansionChanged', node, true);
  }

  collapseNode(node) {
    const key = this.nodeKey(node);
    if (!key || !this.expandedNodes.has(key)) return;

    this.expandedNodes.delete(key);
    // Explicit collapse — remove from pending too so it doesn't come back
    if (this._pendingExpandedKeys) {
      this._pendingExpandedKeys.delete(key);
    }
    this._emit('expansionChanged', node, false);
  }

  isNodeExpanded(node) {
    return this.expandedNodes.has(this.nodeKey(node));
  }

  getExpandedNodeKeys() {
    if (!this._pendingExpandedKeys) {
      return Array.from(this.expandedNodes);
    }
    const keys = new Set(this.expandedNodes);
    for (const key of this._pendingExpandedKeys) {
      keys.add(key);
    }
    return Array.from(keys);
  }

  addPendingExpandedKey(key) {
    if (!this._pendingExpandedKeys) {
      this._pendingExpandedKeys = new Set();
    }
    this._pendingExpandedKeys.add(key);
  }

  expandNodesByKeys(keys) {
    if (!keys || keys.length === 0) return;
    this._pendingExpandedKeys = null;
    for (const key of keys) {
      const node = this.nodes.get(key);
      if (node) {
        this.expandNode(node);
      } else {
        this.addPendingExpandedKey(key);
      }
    }
  }

  _checkPendingExpansion(node) {
    if (!this._pendingExpandedKeys) return;
    const key = this.nodeKey(node);
    if (this._pendingExpandedKeys.has(key)) {
      this._pendingExpandedKeys.delete(key);
      this.expandNode(node);
      if (this._pendingExpandedKeys.size === 0) {
        this._pendingExpandedKeys = null;
      }
    }
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

    const key = this.nodeKey(node);
    if (!key) return;

    if (!this._expandAllKeys) {
      this._expandAllKeys = new Set();
    }
    this._expandAllKeys.add(key);

    this.expandNode(node);

    if (node._loadFailed) {
      this.loadNodeChildren(node);
    }

    if (node.children) {
      for (const child of node.children) {
        setTimeout(() => this.expandAllDescendants(child), 0);
      }
    }
  }

  collapseAllDescendants(node) {
    if (!node) return;
    if (!node.children?.length) return;

    const key = this.nodeKey(node);
    if (key && this._expandAllKeys) {
      this._expandAllKeys.delete(key);
    }

    this.collapseNode(node);
    for (const child of node.children) {
      setTimeout(() => this.collapseAllDescendants(child), 0);
    }
  }

  _checkExpandAllDescendants(parentNode, children) {
    if (!this._expandAllKeys || !children) return;
    const parentKey = this.nodeKey(parentNode);
    if (!parentKey || !this._expandAllKeys.has(parentKey)) return;

    for (const child of children) {
      this.expandAllDescendants(child);
    }
  }

  // --- Live Updates ---

  enableLiveUpdates(node) {
    const key = this.nodeKey(node);
    node.liveUpdatesEnabled = true;
    this._liveUpdateKeys.add(key);
    this.client.enableLiveUpdates({ sID: node.type, twObjectIx: node.id });
    this._emit('nodeUpdated', node);
    if (node.children) {
      for (const child of node.children) {
        this.enableLiveUpdates(child);
      }
    }
    this._refreshSubtree(node);
  }

  disableLiveUpdates(node) {
    const key = this.nodeKey(node);
    node.liveUpdatesEnabled = false;
    this._liveUpdateKeys.delete(key);
    this.client.disableLiveUpdates({ sID: node.type, twObjectIx: node.id });
    this._emit('nodeUpdated', node);
    if (node.children) {
      for (const child of node.children) {
        this.disableLiveUpdates(child);
      }
    }
  }

  isLiveUpdateEnabled(node) {
    return node.liveUpdatesEnabled;
  }

  _refreshSubtree(node) {
    if (node._loaded) {
      this.loadNodeChildren(node);
    }
    if (node.children) {
      for (const child of node.children) {
        this._refreshSubtree(child);
      }
    }
  }

  getLiveUpdateNodeKeys() {
    return Array.from(this._liveUpdateKeys);
  }

  enableLiveUpdatesByKeys(keys) {
    if (!keys || keys.length === 0) return;
    for (const key of keys) {
      this._liveUpdateKeys.add(key);
      const node = this.nodes.get(key);
      if (node) {
        node.liveUpdatesEnabled = true;
        this.client.enableLiveUpdates({ sID: node.type, twObjectIx: node.id });
        this._emit('nodeUpdated', node);
      }
    }
  }

  // --- Client Event Handlers ---

  _handleNodeInserted(mvmfModel, parentType, parentId) {
    const childKey = `${mvmfModel.sID}_${mvmfModel.twObjectIx}`;
    if (mvmfModel.IsReady && !mvmfModel.IsReady()) {
      return;
    }

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
        this._liveUpdateKeys.add(childKey);
        this.client.enableLiveUpdates({ sID: existingNode.type, twObjectIx: existingNode.id });
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

  _upgradeStubModel(mvmfModel) {
    if (!mvmfModel) return;
    const key = `${mvmfModel.sID}_${mvmfModel.twObjectIx}`;
    const adapter = this.nodes.get(key);
    if (adapter) {
      adapter.updateModel(mvmfModel);
      this._emit('nodeUpdated', adapter);
      this._scheduleDataChanged();
    }
  }

  // --- Node Loading ---

  async loadNodeChildren(node) {
    if (!node?.type || node.id === undefined) return;

    node._loadFailed = false;

    if (node._loading) return node._loading;

    const key = this.nodeKey(node);
    if (this.nodes.get(key) !== node) return;

    const loadPromise = (async () => {
      try {
        const childModels = await this.client.fetchChildren(
          { sID: node.type, twObjectIx: node.id }
        );
        if (this.nodes.get(key) !== node) return;
        const childAdapters = childModels.map(c => new NodeAdapter(c));
        this.setChildren(node, childAdapters);
      } catch (err) {
        console.error(`Model: Failed to load children for ${key}:`, err);
        if (this.nodes.get(key) === node) {
          node._loadFailed = true;
          this._emit('nodeLoadFailed', node);
        }
      } finally {
        node._loading = null;
      }
    })();

    node._loading = loadPromise;
    return loadPromise;
  }

  // --- Context & Path Utilities ---

  getPlanetContext(node) {
    return node?._planetContext || this.inheritedPlanetContext || null;
  }

  getPathToNode(node) {
    const path = [];
    let current = node;
    while (current) {
      path.unshift({ id: current.id, type: current.type });
      current = current._parent;
    }
    return path;
  }

}
