/**
 * Copyright (c) 2026 Patched Reality, Inc.
 */

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
    this.inheritedPlanetContext = null;

    this.callbacks = {
      treeChanged: [],
      nodeChildrenChanged: [],
      nodeUpdated: [],
      nodeInserted: [],
      nodeDeleted: [],
      selectionChanged: [],
      expansionChanged: []
    };

    this._bindClientEvents();
  }

  _bindClientEvents() {
    this.client.on('nodeInserted', ({ node, parentModel }) => {
      if (!node) return;
      const parentType = parentModel?.sID;
      const parentId = parentModel?.twObjectIx;
      this._handleNodeInserted(node, parentType, parentId);
    });

    this.client.on('nodeUpdated', (node) => {
      if (!node) return;
      this._handleNodeUpdated(node);
    });

    this.client.on('nodeDeleted', ({ id, type }) => {
      this._handleNodeDeleted(id, type);
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

  setTree(tree, inheritedPlanetContext = null) {
    this.tree = tree;
    this.nodes.clear();
    this.selectedNode = null;
    this.expandedNodes.clear();
    this._pendingExpandedKeys = null;
    this.inheritedPlanetContext = inheritedPlanetContext;

    if (tree) {
      this._indexNode(tree, null);
    }

    this._emit('treeChanged', tree);
  }

  _indexNode(node, parent) {
    const key = this.nodeKey(node);
    if (key) {
      this.nodes.set(key, node);
    }
    node._parent = parent;

    if (node.children && node.children.length > 0) {
      node._loaded = true;
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

    // Remove old children from index
    if (parentNode.children) {
      for (const oldChild of parentNode.children) {
        this._removeFromIndex(oldChild);
      }
    }

    parentNode.children = children;

    if (children) {
      for (const child of children) {
        this._indexNode(child, parentNode);
      }
    }

    this._emit('nodeChildrenChanged', parentNode);

    // Check pending expansions AFTER nodeChildrenChanged so views have created DOM elements
    if (children && this._pendingExpandedKeys) {
      for (const child of children) {
        this._checkPendingExpansion(child);
      }
    }
  }

  _removeFromIndex(node) {
    const key = this.nodeKey(node);
    if (key) {
      this.nodes.delete(key);
      this.expandedNodes.delete(key);
    }
    if (node.children) {
      for (const child of node.children) {
        this._removeFromIndex(child);
      }
    }
  }

  // --- Selection ---

  selectNode(node) {
    const previousNode = this.selectedNode;
    if (previousNode === node) return;

    this.selectedNode = node;
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
    this._emit('expansionChanged', node, false);
  }

  isNodeExpanded(node) {
    return this.expandedNodes.has(this.nodeKey(node));
  }

  getExpandedNodeKeys() {
    return Array.from(this.expandedNodes);
  }

  expandNodesByKeys(keys) {
    if (!keys || keys.length === 0) return;
    this._pendingExpandedKeys = null;
    for (const key of keys) {
      const node = this.nodes.get(key);
      if (node) {
        this.expandNode(node);
      } else {
        if (!this._pendingExpandedKeys) {
          this._pendingExpandedKeys = new Set();
        }
        this._pendingExpandedKeys.add(key);
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

  // --- Client Event Handlers ---

  _handleNodeInserted(node, parentType, parentId) {
    const parentNode = (parentType && parentId !== undefined)
      ? this.getNode(parentType, parentId)
      : null;

    if (parentNode) {
      if (!parentNode.children) {
        parentNode.children = [];
      }
      parentNode.children.push(node);
      this._indexNode(node, parentNode);
    }

    this._emit('nodeInserted', { node, parentNode });
  }

  _handleNodeUpdated(updatedNode) {
    const key = this.nodeKey(updatedNode);
    const existing = this.nodes.get(key);
    if (existing) {
      const previousResourceUrl = existing.resourceUrl;
      const { children, ...updates } = updatedNode;
      Object.assign(existing, updates);
      this._emit('nodeUpdated', existing, previousResourceUrl);
    }
  }

  _handleNodeDeleted(id, type) {
    const key = `${type}_${id}`;
    const node = this.nodes.get(key);
    if (node) {
      if (node._parent?.children) {
        const idx = node._parent.children.indexOf(node);
        if (idx !== -1) {
          node._parent.children.splice(idx, 1);
        }
      }
      this._removeFromIndex(node);
    }
    this._emit('nodeDeleted', { id, type });
  }

  // --- Node Loading ---

  markNodeLoaded(node) {
    if (node) {
      node._loaded = true;
    }
  }

  async loadNodeChildren(node) {
    if (!node?.type || node.id === undefined) return;

    if (node._loading) {
      return node._loading;
    }

    const key = this.nodeKey(node);

    const loadPromise = (async () => {
      try {
        const nodeData = await this.client.getNode(node.id, node.type);
        if (nodeData) {
          if (nodeData.transform) node.transform = nodeData.transform;
          if (nodeData.bound) node.bound = nodeData.bound;
          if (nodeData.children) {
            this.setChildren(node, nodeData.children);
          }
        }
      } catch (err) {
        console.error(`Model: Failed to load children for ${key}:`, err);
      } finally {
        this.markNodeLoaded(node);
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
