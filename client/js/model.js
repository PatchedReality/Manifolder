/*
 * Copyright 2026 Patched Reality, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import { NodeAdapter } from './node-adapter.js';
import { getMsfReference } from '../lib/ManifolderClient/node-helpers.js';

const TYPE_TO_PREFIX = {
  RMRoot: 'root',
  RMCObject: 'celestial',
  RMTObject: 'terrestrial',
  RMPObject: 'physical'
};

const PREFIX_TO_TYPE = {
  root: 'RMRoot',
  celestial: 'RMCObject',
  terrestrial: 'RMTObject',
  physical: 'RMPObject'
};

const NAME_FIELDS = {
  RMRoot: 'wsRMRootId',
  RMCObject: 'wsRMCObjectId',
  RMTObject: 'wsRMTObjectId',
  RMPObject: 'wsRMPObjectId'
};

/**
 * Model - Single source of truth for shared application state.
 * Subscribes to server events and maintains the node tree.
 * Views subscribe to Model events and only hold rendering-specific state.
 */
export class Model {
  constructor(client) {
    this.client = client;
    this.tree = null;
    this.rootScopeId = null;
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
      searchResultsUpdated: [],
      stateRestored: []
    };

    this._bindClientEvents();
  }

  _bindClientEvents() {
    this.client.on('nodeInserted', ({ scopeId, mvmfModel, parentType, parentId }) => {
      if (!mvmfModel) return;
      this._handleNodeInserted(scopeId, mvmfModel, parentType, parentId);
    });

    this.client.on('nodeUpdated', ({ scopeId, id, type, mvmfModel }) => {
      this._handleNodeUpdated(scopeId, id, type, mvmfModel);
    });

    this.client.on('nodeDeleted', ({ scopeId, id, type, sourceParentType, sourceParentId }) => {
      this._handleNodeDeleted(scopeId, id, type, sourceParentType, sourceParentId);
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

  isRestoringState() {
    return this._pendingExpandedKeys !== null;
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
    return node.nodeUid || node.key;
  }

  // --- Tree Management ---

  setTree(rootModel, inheritedPlanetContext = null, rootScopeId = null) {
    this.nodes.clear();
    this.selectedNode = null;
    this._pendingExpandedKeys = null;
    this._pendingSelectedKey = null;
    this.inheritedPlanetContext = inheritedPlanetContext;
    this.rootScopeId = rootScopeId;

    if (rootModel) {
      this.tree = new NodeAdapter(rootModel, rootScopeId);
      const childModels = this.client.enumerateChildren({ scopeId: rootScopeId, model: rootModel });
      if (childModels.length > 0) {
        this.tree.children = childModels.map(c => new NodeAdapter(c, rootScopeId));
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

  getNode(typeOrKey, id, scopeId = this.rootScopeId) {
    if (id === undefined) {
      return this.nodes.get(typeOrKey) || null;
    }
    for (const node of this.nodes.values()) {
      if (node.type === typeOrKey && node.id === id) {
        if (!scopeId || node.fabricScopeId === scopeId) {
          return node;
        }
      }
    }
    return null;
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

    const mergedChildren = this._mergeChildrenWithAttachmentMounts(parentNode, children);
    parentNode.children = mergedChildren;

    if (mergedChildren) {
      for (const child of mergedChildren) {
        this._indexNode(child, parentNode);
      }
    }

    this._emit('nodeChildrenChanged', parentNode);

    // Check after emit so hierarchy DOM elements exist before selection fires
    this._checkPendingSelection();

    this._scheduleDataChanged();

    if (mergedChildren) {
      for (const child of mergedChildren) {
        if (this._pendingExpandedKeys) {
          this._checkPendingExpansion(child);
        }
      }
    }

    this._checkExpandAllDescendants(parentNode, mergedChildren);
  }

  _detachChildren(node) {
    if (!node?.children) return;
    for (const child of node.children) {
      this._detachChildren(child);
      if (child.isSyntheticAttachmentCycle) {
        continue;
      }
      this.client.closeModel({ scopeId: child.fabricScopeId || this.rootScopeId, sID: child.type, twObjectIx: child.id });
    }
  }

  _removeFromIndex(node) {
    if (!node) return;
    const key = node.key;
    this.nodes.delete(key);
    node._attachmentMountedChild = null;
    node._attachmentExpansionState = null;
    if (node.isExpanded) {
      if (!this._pendingExpandedKeys) {
        this._pendingExpandedKeys = new Map();
      }
      this._pendingExpandedKeys.set(key, node._parent?.key || null);
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
    if (node.isSyntheticAttachmentCycle) return;
    this.client.openModel({ scopeId: node.fabricScopeId || this.rootScopeId, sID: node.type, twObjectIx: node.id });
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
    this._maybeExpandAttachment(node).catch((error) => {
      console.warn('Attachment expansion failed:', error);
    });
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
      const rawKey = typeof item === 'string' ? item : (item.nodeUid || item.key);
      const rawParentKey = typeof item === 'string' ? null : (item.parentNodeUid || item.parent);
      const key = this._normalizeStateNodeKey(rawKey, item?.type, item?.id);
      const parentKey = this._normalizeStateNodeKey(rawParentKey, item?.parentType, item?.parentId);

      if (!key) {
        continue;
      }

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
      this._emit('stateRestored');
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
        this._emit('stateRestored');
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
      this._emit('stateRestored');
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

  _normalizeStateNodeKey(key, fallbackType = null, fallbackId = null) {
    if (typeof key === 'string') {
      if (key.includes(':')) {
        return key;
      }
      const legacy = /^([A-Za-z]+)_(\d+)$/.exec(key);
      if (legacy && this.rootScopeId) {
        const prefix = TYPE_TO_PREFIX[legacy[1]];
        if (prefix) {
          return `${this.rootScopeId}:${prefix}:${legacy[2]}`;
        }
      }
      return key;
    }

    if (!this.rootScopeId) {
      return null;
    }

    const numericId = Number.parseInt(`${fallbackId}`, 10);
    if (!Number.isFinite(numericId)) {
      return null;
    }
    const prefix = TYPE_TO_PREFIX[fallbackType];
    if (!prefix) {
      return null;
    }
    return `${this.rootScopeId}:${prefix}:${numericId}`;
  }

  _formatObjectId(node) {
    if (!node?.type || node.id == null) {
      return null;
    }
    const prefix = TYPE_TO_PREFIX[node.type];
    if (!prefix) {
      return null;
    }
    const numericId = Number.parseInt(`${node.id}`, 10);
    if (!Number.isFinite(numericId)) {
      return null;
    }
    if (prefix === 'root') {
      return 'root';
    }
    return `${prefix}:${numericId}`;
  }

  _parseObjectId(objectId) {
    if (objectId === 'root') {
      return { type: 'RMRoot', id: 1, prefix: 'root' };
    }
    if (typeof objectId !== 'string') {
      return null;
    }
    const [prefix, idRaw] = objectId.split(':');
    const type = PREFIX_TO_TYPE[prefix];
    const id = Number.parseInt(`${idRaw}`, 10);
    if (!type || !Number.isFinite(id)) {
      return null;
    }
    return { type, id, prefix };
  }

  _mergeChildrenWithAttachmentMounts(parentNode, children) {
    const merged = [];
    if (Array.isArray(children)) {
      for (const child of children) {
        if (!child?._isAttachmentMountedChild) {
          merged.push(child);
        }
      }
    }

    const mounted = parentNode?._attachmentMountedChild;
    if (mounted && !merged.some((candidate) => candidate.key === mounted.key)) {
      merged.push(mounted);
    }

    return merged;
  }

  _checkAttachmentExpandable(node) {
    if (!node || node._model.__attachmentExpandable) return;
    const ref = node._model?.pResource?.sReference;
    if (!ref) return;
    getMsfReference(node).then(msfUrl => {
      if (msfUrl && !node._model.__attachmentExpandable) {
        node._model.__attachmentExpandable = true;
        this._emit('nodeUpdated', node);
      }
    }).catch(() => {});
  }

  _setAttachmentNodeState(node, { loading = false, error = null } = {}) {
    if (!node) return;
    node._attachmentLoading = loading;
    node._attachmentError = error;
    if (loading || error) {
      node._model.__attachmentExpandable = true;
    }
    this._emit('nodeUpdated', node);
  }

  _buildAttachmentRootNode(attachmentNode, followResult) {
    const parsedRoot = this._parseObjectId(followResult?.root?.id || 'root');
    if (!parsedRoot) {
      return null;
    }

    const nameField = NAME_FIELDS[parsedRoot.type];
    const rootModel = {
      sID: parsedRoot.type,
      twObjectIx: parsedRoot.id,
      nChildren: followResult?.root?.childCount ?? 0,
      IsReady: () => false,
      pName: nameField ? { [nameField]: followResult?.root?.name || parsedRoot.type } : undefined,
      pResource: {
        sReference: followResult?.childFabricUrl || null
      }
    };
    const adapter = new NodeAdapter(rootModel, followResult.childScopeId);
    adapter._attachmentFromNodeUid = attachmentNode.key;
    adapter._isAttachmentMountedChild = true;
    return adapter;
  }

  _buildAttachmentCycleNode(attachmentNode, error) {
    const cycleTargetRaw = error?.details?.existingNodeUid || null;
    const cycleTargetNode = cycleTargetRaw && cycleTargetRaw.includes(':')
      ? cycleTargetRaw
      : null;
    const cycleTargetScopeId = cycleTargetNode ? cycleTargetNode.split(':').slice(0, -2).join(':') : cycleTargetRaw;
    const label = error?.details?.existingLabel || cycleTargetRaw || 'existing scope';
    const cycleKey = `${attachmentNode.key}:cycle:${label}`;

    return {
      key: cycleKey,
      nodeUid: cycleKey,
      fabricScopeId: attachmentNode.fabricScopeId || this.rootScopeId,
      type: 'RMPObject',
      id: -1,
      nodeType: 'Attachment',
      name: `Cycle detected - go to existing (${label})`,
      children: [],
      isExpanded: false,
      isLoading: false,
      hasChildren: false,
      isSyntheticAttachmentCycle: true,
      cycleTargetNodeUid: cycleTargetNode,
      cycleTargetScopeId,
      _isAttachmentMountedChild: true
    };
  }

  _mountAttachmentChild(parentNode, childNode) {
    if (!parentNode || !childNode) {
      return;
    }
    parentNode._attachmentMountedChild = childNode;
    parentNode._model.__attachmentExpandable = true;
    this.setChildren(parentNode, parentNode.children || []);
  }

  async _maybeExpandAttachment(node) {
    if (!node || node.isSyntheticAttachmentCycle || !node.isExpanded) {
      return;
    }

    const existingState = node._attachmentExpansionState;
    if (existingState?.status === 'loading' || existingState?.status === 'loaded') {
      return;
    }

    const scopeId = node.fabricScopeId || this.rootScopeId;
    const objectId = this._formatObjectId(node);
    if (!scopeId || !objectId) {
      return;
    }

    const msfRef = await getMsfReference(node);
    if (!msfRef) {
      node._attachmentExpansionState = { status: 'not-attachment' };
      return;
    }

    node._model.__attachmentExpandable = true;
    node._attachmentExpansionState = { status: 'loading', msfRef };
    this._setAttachmentNodeState(node, { loading: true, error: null });

    try {
      const followResult = await this.client.followAttachment({
        scopeId,
        objectId,
        autoOpenRoot: true
      });

      const childResourceRoot = this.client.getResourceRootUrl({ scopeId: followResult.childScopeId });
      if (childResourceRoot) {
        NodeAdapter.setScopeResourceRoot(followResult.childScopeId, childResourceRoot);
      }

      const mountedRoot = this._buildAttachmentRootNode(node, followResult);
      if (mountedRoot) {
        this._mountAttachmentChild(node, mountedRoot);
      }

      node._attachmentExpansionState = {
        status: 'loaded',
        childScopeId: followResult.childScopeId
      };
      this._setAttachmentNodeState(node, { loading: false, error: null });
    } catch (error) {
      if (error?.code === 'ATTACHMENT_CYCLE_DETECTED') {
        const cycleNode = this._buildAttachmentCycleNode(node, error);
        this._mountAttachmentChild(node, cycleNode);
        node._attachmentExpansionState = {
          status: 'cycle',
          error
        };
        this._setAttachmentNodeState(node, { loading: false, error: null });
        return;
      }

      node._attachmentExpansionState = {
        status: 'error',
        message: error?.message || 'Attachment load failed'
      };
      this._setAttachmentNodeState(node, {
        loading: false,
        error: error?.message || 'Attachment load failed'
      });
    }
  }

  activateAttachmentCycleNode(nodeOrKey) {
    const cycleNode = typeof nodeOrKey === 'string'
      ? this.nodes.get(nodeOrKey)
      : nodeOrKey;
    if (!cycleNode?.isSyntheticAttachmentCycle) {
      return false;
    }

    let target = cycleNode.cycleTargetNodeUid
      ? this.nodes.get(cycleNode.cycleTargetNodeUid)
      : null;

    if (!target && cycleNode.cycleTargetScopeId) {
      for (const candidate of this.nodes.values()) {
        if (candidate.fabricScopeId === cycleNode.cycleTargetScopeId && candidate.type === 'RMRoot') {
          target = candidate;
          break;
        }
      }
    }

    if (!target) {
      return false;
    }

    let parent = target._parent;
    while (parent) {
      if (!parent.isExpanded) {
        this.expandNode(parent);
      }
      parent = parent._parent;
    }
    this.selectNode(target);
    return true;
  }

  expandLevel(node) {
    if (!node) return;
    this.expandNode(node);

    const toExpand = [];
    const walk = (n) => {
      if (!n.isExpanded || !n.children) return;
      for (const child of n.children) {
        if (!child.isExpanded) {
          toExpand.push(child);
        } else {
          walk(child);
        }
      }
    };
    walk(node);

    const expandNext = (i) => {
      if (i >= toExpand.length) {
        this._scheduleDataChanged();
        return;
      }
      this.expandNode(toExpand[i]);
      setTimeout(() => expandNext(i + 1), 0);
    };
    if (toExpand.length > 0) {
      setTimeout(() => expandNext(0), 0);
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
      setTimeout(() => this.expandAllDescendants(child), 0);
    }
  }

  // --- Client Event Handlers ---

  _handleNodeInserted(scopeId, mvmfModel, parentType, parentId) {
    const childKey = new NodeAdapter(mvmfModel, scopeId).key;

    const parentNode = (parentType && parentId !== undefined)
      ? this.getNode(parentType, parentId, scopeId)
      : null;

    if (!parentNode) {
      return;
    }

    const existingIdx = parentNode.children.findIndex(
      c => c.key === childKey
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
      this._emit('nodeInserted', { node: existingNode, parentNode });
      this._checkPendingExpansion(existingNode);
      this._checkPendingSelection();
      this._scheduleDataChanged();
      return;
    }

    const adapter = new NodeAdapter(mvmfModel, scopeId);
    parentNode.children.push(adapter);
    this._indexNode(adapter, parentNode);

    this._emit('nodeInserted', { node: adapter, parentNode });
    this._checkPendingExpansion(adapter);
    this._checkPendingSelection();
    this._scheduleDataChanged();
    this._checkAttachmentExpandable(adapter);
  }

  _handleNodeUpdated(scopeId, id, type, mvmfModel) {
    const key = mvmfModel
      ? new NodeAdapter(mvmfModel, scopeId).key
      : null;
    const adapter = key
      ? this.nodes.get(key)
      : this.getNode(type, id, scopeId);
    if (adapter) {
      if (mvmfModel) {
        adapter.updateModel(mvmfModel);
      } else {
        adapter.markDirty();
      }
      this._emit('nodeUpdated', adapter);
      this._scheduleDataChanged();
      this._checkAttachmentExpandable(adapter);
    }
  }

  _handleNodeDeleted(scopeId, id, type, sourceParentType, sourceParentId) {
    const sourceParent = (sourceParentType && sourceParentId !== undefined)
      ? this.getNode(sourceParentType, sourceParentId, scopeId)
      : null;

    if (sourceParent?.children) {
      const idx = sourceParent.children.findIndex(c => c.type === type && c.id === id && (!scopeId || c.fabricScopeId === scopeId));
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

  _onModelReady({ scopeId, mvmfModel }) {
    if (!mvmfModel) return;
    const key = new NodeAdapter(mvmfModel, scopeId).key;
    const adapter = this.nodes.get(key);
    if (!adapter) return;

    adapter.updateModel(mvmfModel);
    const childScopeId = scopeId || adapter.fabricScopeId || this.rootScopeId;
    const children = this.client.enumerateChildren({ scopeId: childScopeId, model: mvmfModel });
    const newChildren = children.map(c => new NodeAdapter(c, childScopeId));

    if (this._childrenMatch(adapter, newChildren)) {
      this._updateChildModels(adapter, newChildren);
    } else {
      this.setChildren(adapter, newChildren);
    }
    this._emit('nodeUpdated', adapter);
    this._scheduleDataChanged();
  }

  _childrenMatch(parentNode, newChildren) {
    const existing = parentNode.children;
    if (!existing || !newChildren) return !existing && !newChildren;
    if (existing.length !== newChildren.length) return false;
    for (let i = 0; i < existing.length; i++) {
      if (existing[i].key !== newChildren[i].key) return false;
    }
    return true;
  }

  _updateChildModels(parentNode, newChildren) {
    for (let i = 0; i < parentNode.children.length; i++) {
      parentNode.children[i].updateModel(newChildren[i]._model);
      this._emit('nodeUpdated', parentNode.children[i]);
    }
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

    // Search server across open scopes
    const serverResults = { matches: [], paths: [] };
    const searchScopeIds = this._getSearchScopeIds();
    if (searchScopeIds.length > 0) {
      const searchCalls = await Promise.allSettled(
        searchScopeIds.map((scopeId) => this.client.searchNodes({ scopeId, searchText }))
      );
      for (let i = 0; i < searchCalls.length; i++) {
        const scopeId = searchScopeIds[i];
        const call = searchCalls[i];
        if (call.status !== 'fulfilled' || !call.value) {
          continue;
        }
        const result = call.value;
        if (Array.isArray(result.matches)) {
          for (const match of result.matches) {
            serverResults.matches.push({
              ...match,
              scopeId: match?.scopeId || scopeId
            });
          }
        }
        if (Array.isArray(result.paths)) {
          for (const path of result.paths) {
            serverResults.paths.push({
              ...path,
              scopeId: path?.scopeId || scopeId
            });
          }
        }
      }
    }

    // Check if search is still current (user may have typed more)
    if (this.searchTerm !== searchText) return;

    // Merge and dedupe results
    const seenKeys = new Set();
    const allMatches = [];

    for (const match of serverResults.matches) {
      const key = this._getSearchResultKey(match, match.scopeId);
      if (!key) {
        continue;
      }
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        allMatches.push(match);
      }
    }

    for (const match of localMatches) {
      const key = this._getSearchResultKey(match, match.scopeId);
      if (!key) {
        continue;
      }
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
          nodeUid: node.key,
          scopeId: node.fabricScopeId || this.rootScopeId,
          id: node.id,
          name: node.name,
          type: node.type,
          nodeType: node.nodeType
        });
      }
    }
    return matches;
  }

  _getSearchScopeIds() {
    const fromRegistry = typeof this.client.listScopes === 'function'
      ? this.client.listScopes()
          .map((scope) => scope?.scopeId)
          .filter((scopeId) => typeof scopeId === 'string' && scopeId.length > 0)
      : [];
    if (fromRegistry.length > 0) {
      return fromRegistry;
    }
    return this.rootScopeId ? [this.rootScopeId] : [];
  }

  _extractScopeIdFromNodeUid(nodeUid) {
    if (typeof nodeUid !== 'string' || !nodeUid.includes(':')) {
      return null;
    }
    const parts = nodeUid.split(':');
    if (parts.length < 3) {
      return null;
    }
    parts.pop();
    parts.pop();
    const scopeId = parts.join(':');
    return scopeId || null;
  }

  _buildNodeUid(scopeId, type, id) {
    if (!scopeId || typeof type !== 'string') {
      return null;
    }
    const prefix = TYPE_TO_PREFIX[type];
    if (!prefix) {
      return null;
    }
    const numericId = Number.parseInt(`${id}`, 10);
    if (!Number.isFinite(numericId)) {
      return null;
    }
    return `${scopeId}:${prefix}:${numericId}`;
  }

  _getResultScopeId(item, fallbackScopeId = this.rootScopeId) {
    if (!item || typeof item !== 'object') {
      return fallbackScopeId || null;
    }
    if (typeof item.scopeId === 'string' && item.scopeId.length > 0) {
      return item.scopeId;
    }
    const fromNodeUid = this._extractScopeIdFromNodeUid(item.nodeUid || item.key);
    if (fromNodeUid) {
      return fromNodeUid;
    }
    return fallbackScopeId || null;
  }

  _getSearchResultKey(item, fallbackScopeId = this.rootScopeId) {
    const nodeUid = item?.nodeUid || item?.key;
    if (typeof nodeUid === 'string' && nodeUid.includes(':')) {
      return nodeUid;
    }
    const scopeId = this._getResultScopeId(item, fallbackScopeId);
    const scopedKey = this._buildNodeUid(scopeId, item?.type, item?.id);
    if (scopedKey) {
      return scopedKey;
    }
    if (item?.type && item?.id != null) {
      return `${item.type}_${item.id}`;
    }
    return null;
  }

  _getSearchParentKey(item, fallbackScopeId = this.rootScopeId) {
    const parentNodeUid = item?.parentNodeUid;
    if (typeof parentNodeUid === 'string' && parentNodeUid.includes(':')) {
      return parentNodeUid;
    }
    const scopeId = this._getResultScopeId(item, fallbackScopeId);
    return this._buildNodeUid(scopeId, item?.parentType, item?.parentId);
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
    const matchKeys = new Set(
      (results.matches || [])
        .map((match) => this._getSearchResultKey(match, match?.scopeId))
        .filter(Boolean)
    );

    // Process in batches to avoid blocking UI
    const BATCH_SIZE = 50;
    let index = 0;

    const processBatch = () => {
      // Abort if search was cleared
      if (!this.searchActive) return;

      const batchEnd = Math.min(index + BATCH_SIZE, items.length);

      for (; index < batchEnd; index++) {
        const item = items[index];
        const scopeId = this._getResultScopeId(item, this.rootScopeId);
        const key = this._getSearchResultKey(item, scopeId);
        if (!key) {
          continue;
        }

        let node = this.nodes.get(key);
        if (!node) {
          // Create new node
          node = NodeAdapter.fromSearchResult({
            ...item,
            scopeId
          });
          this.nodes.set(node.key, node);

          // Wire parent link - only if actual parent exists, don't fall back to root
          let parentNode = null;
          const parentKey = this._getSearchParentKey(item, scopeId);
          if (parentKey) {
            parentNode = this.nodes.get(parentKey);
          }
          if (!parentNode && item.parentType && item.parentId !== undefined && item.parentId !== null) {
            parentNode = this.getNode(item.parentType, item.parentId, scopeId);
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
          const parentKey = this._getSearchParentKey(item, scopeId);
          if (parentKey) {
            parentNode = this.nodes.get(parentKey);
          }
          if (!parentNode && item.parentType && item.parentId !== undefined && item.parentId !== null) {
            parentNode = this.getNode(item.parentType, item.parentId, scopeId);
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
        const isMatch = matchKeys.has(key);
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
      path.unshift({ nodeUid: current.key, id: current.id, type: current.type });
      current = current._parent;
    }
    return path;
  }

}
