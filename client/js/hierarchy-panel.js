/**
 * Copyright (c) 2026 Patched Reality, Inc.
 */

/**
 * HierarchyPanel - Tree view component for displaying map hierarchy
 * Supports lazy-loading, search filtering, and node selection
 */

import { CELESTIAL_NAMES } from '../shared/node-types.js';

export class HierarchyPanel {
  constructor(containerSelector, model) {
    this.container = document.querySelector(containerSelector);
    this.model = model;
    this.searchInput = document.getElementById('hierarchy-search');
    this.selectedNode = null;
    this.nodes = new Map();
    this.nodeData = new Map();
    this.loadedNodes = new Set();
    this.pendingExpandedKeys = null;

    this.zoomCallbacks = [];
    this._nextId = 1;

    this._bindModelEvents();
    this.init();
  }

  _bindModelEvents() {
    this.model.on('selectionChanged', (node) => {
      if (node) {
        this.expandToNode(node);
        this.selectNode(node);
      }
    });

    this.model.on('treeChanged', (tree) => {
      this.setData(tree);
    });

    this.model.on('nodeChildrenChanged', (parentNode) => {
      this.setChildren(parentNode, parentNode.children);
      this.markNodeLoaded(parentNode);
    });

    this.model.on('expansionChanged', (node, expanded) => {
      if (expanded) {
        this.expandNode(node);
      } else {
        this.collapseNode(node);
      }
    });

    this.model.on('nodeInserted', ({ node, parentNode }) => {
      if (parentNode) {
        this.addNode(parentNode, node);
      }
    });

    this.model.on('nodeUpdated', (node) => {
      this.refreshNode(node);
    });
  }

  // Sort children alphabetically by name
  _sortChildren(children) {
    if (!children || !Array.isArray(children)) return children;
    return [...children].sort((a, b) => {
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }

  // Generate globally unique key for each node
  _nodeKey(node) {
    if (typeof node === 'object') {
      // Assign a unique _uid if not already present
      if (!node._uid) {
        node._uid = this._nextId++;
      }
      return `node-${node._uid}`;
    }
    return node; // Already a key string
  }

  init() {
  }

  clearSearchFilter() {
    this.nodes.forEach((element) => {
      element.classList.remove('hidden');
      element.classList.remove('search-match');
    });
  }

  searchLocalNodes(searchTerm) {
    const matches = [];
    this.nodeData.forEach((data, nodeKey) => {
      if (data.name.toLowerCase().includes(searchTerm)) {
        matches.push({
          id: data.id,
          name: data.name,
          type: data.type,
          nodeType: data.nodeType
        });
      }
    });
    return matches;
  }

  _applySearchFilter(visibleKeys, matchKeys) {
    // Hide non-matching nodes, show matching ones
    this.nodes.forEach((element, nodeKey) => {
      element.classList.remove('search-match');
      if (visibleKeys.has(nodeKey)) {
        element.classList.remove('hidden');
        if (matchKeys.has(nodeKey)) {
          element.classList.add('search-match');
        }
      } else {
        element.classList.add('hidden');
      }
    });

    // Expand to each match so they're all visible
    for (const matchKey of matchKeys) {
      this.expandToNode(matchKey);
    }

    // Scroll first match into view
    if (matchKeys.size > 0) {
      const firstMatchKey = matchKeys.values().next().value;
      const element = this.nodes.get(firstMatchKey);
      if (element) {
        const content = element.querySelector(':scope > .tree-node-content');
        if (content) {
          content.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    }
  }

  addParentsToSet(nodeKey, set, depth = 0) {
    if (depth > 100 || set.has(nodeKey)) return;

    const element = this.nodes.get(nodeKey);
    if (!element) return;

    const parent = element.parentElement?.closest('.tree-node');
    if (parent) {
      const parentKey = `node-${parent.dataset.uid}`;
      set.add(parentKey);
      this.addParentsToSet(parentKey, set, depth + 1);
    }
  }

  setData(tree) {
    this.clear();
    this.rootNode = null;

    if (!tree) {
      return;
    }

    this.rootNode = tree;
    const rootElement = this.createNodeElement(tree);
    this.container.appendChild(rootElement);
  }

  getRootNode() {
    return this.rootNode;
  }

  clear() {
    this.container.innerHTML = '';
    this.nodes.clear();
    this.nodeData.clear();
    this.loadedNodes.clear();
    this.pendingExpandedKeys = null;
    this.selectedNode = null;
    this.rootNode = null;
    this._nextId = 1;
  }

  _removeNodeAndDescendants(nodeKey) {
    const el = this.nodes.get(nodeKey);
    if (el) {
      // Recursively clean up child DOM nodes
      const childEls = el.querySelectorAll('.tree-node');
      for (const childEl of childEls) {
        const childUid = childEl.dataset.uid;
        if (childUid) {
          const childKey = `node-${childUid}`;
          this.nodes.delete(childKey);
          this.nodeData.delete(childKey);
          this.loadedNodes.delete(childKey);
        }
      }
    }
    this.nodes.delete(nodeKey);
    this.nodeData.delete(nodeKey);
    this.loadedNodes.delete(nodeKey);
  }

  createNodeElement(nodeData) {
    // Ensure _uid is assigned first
    const nodeKey = this._nodeKey(nodeData);

    const node = document.createElement('div');
    node.className = 'tree-node';
    node.dataset.id = nodeData.id;
    node.dataset.type = nodeData.type;
    if (nodeData.nodeType) {
      node.dataset.nodetype = nodeData.nodeType;
    }
    node.dataset.uid = nodeData._uid;

    const content = document.createElement('div');
    content.className = 'tree-node-content';

    const toggle = document.createElement('span');
    toggle.className = 'tree-toggle';
    if (nodeData.hasChildren || (nodeData.children && nodeData.children.length > 0)) {
      toggle.textContent = '▶';
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleNode(nodeKey);
      });
    }

    const icon = document.createElement('span');
    icon.className = 'tree-icon';
    const isCelestial = CELESTIAL_NAMES.has(nodeData.nodeType);
    icon.textContent = isCelestial ? '▲' : '●';

    const label = document.createElement('span');
    label.className = 'tree-label';
    label.textContent = nodeData.name;
    label.title = nodeData.name;

    content.appendChild(toggle);
    content.appendChild(icon);
    content.appendChild(label);

    content.addEventListener('click', () => {
      const data = this.nodeData.get(nodeKey);
      if (data) {
        this.model.selectNode(data);
      }
    });

    content.addEventListener('dblclick', () => {
      const nodeData = this.nodeData.get(nodeKey);
      if (nodeData) {
        this.zoomCallbacks.forEach(callback => callback(nodeData));
      }
    });

    content.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.showContextMenu(nodeKey, e.clientX, e.clientY);
    });

    // Long-press for mobile context menu
    let longPressTimer = null;
    content.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      longPressTimer = setTimeout(() => {
        e.preventDefault();
        this.showContextMenu(nodeKey, touch.clientX, touch.clientY);
      }, 500);
    }, { passive: false });

    content.addEventListener('touchend', () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    });

    content.addEventListener('touchmove', () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    }, { passive: true });

    const children = document.createElement('div');
    children.className = 'tree-children';
    children.style.display = 'none';

    node.appendChild(content);
    node.appendChild(children);

    this.nodes.set(nodeKey, node);
    this.nodeData.set(nodeKey, nodeData);

    if (nodeData.children && nodeData.children.length > 0) {
      this.loadedNodes.add(nodeKey);
      this._sortChildren(nodeData.children).forEach(child => {
        const childElement = this.createNodeElement(child);
        children.appendChild(childElement);
      });
    }

    return node;
  }

  addNode(parentOrKey, nodeData) {
    const parentKey = this._nodeKey(parentOrKey);
    const parentElement = this.nodes.get(parentKey);
    if (!parentElement) {
      return;
    }

    const childrenContainer = parentElement.querySelector(':scope > .tree-children');
    if (!childrenContainer) {
      return;
    }

    const loadingIndicator = childrenContainer.querySelector('.tree-loading');
    if (loadingIndicator) {
      loadingIndicator.remove();
    }

    const nodeElement = this.createNodeElement(nodeData);
    childrenContainer.appendChild(nodeElement);
  }

  setChildren(parentOrKey, children) {
    const parentKey = this._nodeKey(parentOrKey);
    const parentElement = this.nodes.get(parentKey);
    if (!parentElement) {
      return;
    }

    const childrenContainer = parentElement.querySelector(':scope > .tree-children');
    if (!childrenContainer) {
      return;
    }

    // Remove old children from Maps before clearing DOM
    // Walk the DOM to find old children (parentNodeData.children may already point
    // to new children if model replaced them before emitting nodeChildrenChanged)
    const oldChildElements = childrenContainer.querySelectorAll(':scope > .tree-node');
    for (const oldEl of oldChildElements) {
      const oldUid = oldEl.dataset.uid;
      if (oldUid) {
        const oldKey = `node-${oldUid}`;
        this._removeNodeAndDescendants(oldKey);
      }
    }

    const parentNodeData = this.nodeData.get(parentKey);

    childrenContainer.innerHTML = '';
    this.loadedNodes.add(parentKey);

    // Update internal data cache
    if (parentNodeData) {
      parentNodeData.children = children;
      parentNodeData.hasChildren = children && children.length > 0;
    }

    // Hide toggle and collapse if no children
    const toggle = parentElement.querySelector(':scope > .tree-node-content > .tree-toggle');
    if (!children || children.length === 0) {
      if (toggle) {
        toggle.textContent = '';
      }
      childrenContainer.style.display = 'none';
      return;
    }

    this._sortChildren(children).forEach(child => {
      const childElement = this.createNodeElement(child);
      childrenContainer.appendChild(childElement);
    });

    // Check for pending expanded nodes and expand them
    if (this.pendingExpandedKeys && this.pendingExpandedKeys.size > 0) {
      children.forEach(child => {
        const lookupKey = `${child.type}_${child.id}`;
        if (this.pendingExpandedKeys.has(lookupKey)) {
          this.pendingExpandedKeys.delete(lookupKey);
          const childKey = this._nodeKey(child);
          this.expandNode(childKey);
        }
      });
      if (this.pendingExpandedKeys.size === 0) {
        this.pendingExpandedKeys = null;
      }
    }
  }

  selectNode(nodeOrKey) {
    const nodeKey = this._nodeKey(nodeOrKey);

    if (this.selectedNode) {
      const prevContent = this.selectedNode.querySelector(':scope > .tree-node-content');
      if (prevContent) {
        prevContent.classList.remove('selected');
      }
    }

    let node = this.nodes.get(nodeKey);

    // Fallback: if _uid-based lookup fails, find by type+id
    if (!node && typeof nodeOrKey === 'object' && nodeOrKey.type && nodeOrKey.id !== undefined) {
      for (const [key, data] of this.nodeData) {
        if (data.type === nodeOrKey.type && data.id === nodeOrKey.id) {
          node = this.nodes.get(key);
          if (node && data._uid) {
            nodeOrKey._uid = data._uid;
          }
          break;
        }
      }
    }

    if (!node) {
      return;
    }

    const content = node.querySelector(':scope > .tree-node-content');
    if (content) {
      content.classList.add('selected');
      content.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    this.selectedNode = node;
  }

  toggleNode(nodeOrKey) {
    const nodeKey = this._nodeKey(nodeOrKey);
    const node = this.nodes.get(nodeKey);
    if (!node) {
      return;
    }

    const toggle = node.querySelector(':scope > .tree-node-content > .tree-toggle');
    const children = node.querySelector(':scope > .tree-children');

    if (!children) {
      return;
    }

    const isExpanded = children.style.display !== 'none';

    if (isExpanded) {
      this.collapseNode(nodeKey);
    } else {
      this.expandNode(nodeKey);
    }
  }

  expandNode(nodeOrKey) {
    const nodeKey = this._nodeKey(nodeOrKey);
    const node = this.nodes.get(nodeKey);
    if (!node) {
      return;
    }

    const toggle = node.querySelector(':scope > .tree-node-content > .tree-toggle');
    const children = node.querySelector(':scope > .tree-children');

    if (!children) {
      return;
    }

    const nodeData = this.nodeData.get(nodeKey);
    const isLoaded = this.loadedNodes.has(nodeKey);
    const hasChildren = nodeData && (nodeData.hasChildren || (nodeData.children && nodeData.children.length > 0));

    // Don't expand if already loaded with no children
    if (isLoaded && !hasChildren) {
      return;
    }

    if (toggle) {
      toggle.textContent = '▼';
    }
    children.style.display = 'block';

    if (nodeData) {
      this.model.expandNode(nodeData);
    }

    if (!isLoaded && !children.querySelector('.tree-loading')) {
      const loading = document.createElement('div');
      loading.className = 'tree-loading';
      loading.textContent = 'Loading...';
      loading.style.color = 'var(--text-muted)';
      loading.style.fontStyle = 'italic';
      loading.style.padding = '2px 4px';
      children.appendChild(loading);

      if (nodeData) {
        this.model.loadNodeChildren(nodeData);
      }
    }
  }

  collapseNode(nodeOrKey) {
    const nodeKey = this._nodeKey(nodeOrKey);
    const node = this.nodes.get(nodeKey);
    if (!node) {
      return;
    }

    const toggle = node.querySelector(':scope > .tree-node-content > .tree-toggle');
    const children = node.querySelector(':scope > .tree-children');

    if (!children) {
      return;
    }

    if (toggle) {
      toggle.textContent = '▶';
    }
    children.style.display = 'none';

    const nodeData = this.nodeData.get(nodeKey);
    if (nodeData) {
      this.model.collapseNode(nodeData);
    }
  }

  expandToNode(nodeOrKey) {
    const nodeKey = this._nodeKey(nodeOrKey);
    let node = this.nodes.get(nodeKey);

    // Fallback: if _uid-based lookup fails, find by type+id
    if (!node && typeof nodeOrKey === 'object' && nodeOrKey.type && nodeOrKey.id !== undefined) {
      for (const [key, data] of this.nodeData) {
        if (data.type === nodeOrKey.type && data.id === nodeOrKey.id) {
          node = this.nodes.get(key);
          if (node && data._uid) {
            nodeOrKey._uid = data._uid;
          }
          break;
        }
      }
    }

    if (!node) {
      return;
    }

    let parent = node.parentElement?.closest('.tree-node');
    while (parent) {
      // Unhide the parent node (in case it was hidden by filter)
      parent.classList.remove('hidden');

      const children = parent.querySelector(':scope > .tree-children');
      const toggle = parent.querySelector(':scope > .tree-node-content > .tree-toggle');

      if (children) {
        children.style.display = 'block';
      }
      if (toggle) {
        toggle.textContent = '▼';
      }

      parent = parent.parentElement?.closest('.tree-node');
    }
  }

  onZoom(callback) {
    this.zoomCallbacks.push(callback);
  }

  getSelectedNode() {
    if (!this.selectedNode) return null;
    const uid = this.selectedNode.dataset.uid;
    return this.nodeData.get(`node-${uid}`);
  }

  getPathToNode(nodeOrKey) {
    const nodeKey = this._nodeKey(nodeOrKey);
    const element = this.nodes.get(nodeKey);
    if (!element) return null;

    const path = [];
    let current = element;

    while (current && current.classList.contains('tree-node')) {
      const uid = current.dataset.uid;
      const nodeData = this.nodeData.get(`node-${uid}`);
      if (nodeData) {
        path.unshift({ id: nodeData.id, type: nodeData.type });
      }
      current = current.parentElement?.closest('.tree-node');
    }

    return path;
  }

  getChildren(nodeOrKey) {
    const nodeKey = this._nodeKey(nodeOrKey);
    const nodeData = this.nodeData.get(nodeKey);
    return nodeData ? nodeData.children : null;
  }

  isNodeExpanded(nodeOrKey) {
    const nodeKey = this._nodeKey(nodeOrKey);
    const node = this.nodes.get(nodeKey);
    if (!node) return false;

    const children = node.querySelector(':scope > .tree-children');
    return children && children.style.display !== 'none';
  }

  getExpandedNodeKeys() {
    const keys = [];
    this.nodeData.forEach((nodeData, nodeKey) => {
      if (this.isNodeExpanded(nodeKey)) {
        keys.push(`${nodeData.type}_${nodeData.id}`);
      }
    });
    return keys;
  }

  expandNodesByKeys(keys) {
    if (!keys || keys.length === 0) return;

    this.pendingExpandedKeys = new Set(keys);

    this.nodeData.forEach((nodeData, nodeKey) => {
      const lookupKey = `${nodeData.type}_${nodeData.id}`;
      if (this.pendingExpandedKeys.has(lookupKey)) {
        this.expandNode(nodeKey);
      }
    });
  }

  getExpandedDescendants(nodeOrKey) {
    const results = [];
    const nodeKey = this._nodeKey(nodeOrKey);
    const nodeData = this.nodeData.get(nodeKey);

    if (!nodeData || !nodeData.children) return results;
    if (!this.isNodeExpanded(nodeData)) return results;

    const collectExpanded = (children, parentCumulativePos, parentId, parentCumulativeTransform) => {
      for (const child of children) {
        const childPos = this.getNodePosition(child);
        const cumulativePos = [
          parentCumulativePos[0] + childPos[0],
          parentCumulativePos[1] + childPos[1],
          parentCumulativePos[2] + childPos[2]
        ];

        const cumulativeTransform = {
          Position: cumulativePos,
          Rotation: this.getNodeRotation(child),
          Scale: this.getNodeScale(child)
        };

        const localTransform = {
          Position: childPos,
          Rotation: this.getNodeRotation(child),
          Scale: this.getNodeScale(child)
        };

        results.push({ node: child, cumulativeTransform, localTransform, parentId, parentCumulativeTransform });

        if (this.isNodeExpanded(child) && child.children) {
          const childId = `${child.type}_${child.id}`;
          const childCumulativeTransform = cumulativeTransform;
          collectExpanded(child.children, cumulativePos, childId, childCumulativeTransform);
        }
      }
    };

    const rootId = `${nodeData.type}_${nodeData.id}`;
    const rootTransform = { Position: [0, 0, 0], Rotation: [0, 0, 0, 1], Scale: [1, 1, 1] };
    collectExpanded(nodeData.children, [0, 0, 0], rootId, rootTransform);
    return results;
  }

  getNodePosition(node) {
    const pos = node.transform?.position;
    if (!pos) return [0, 0, 0];
    return [pos.x ?? 0, pos.y ?? 0, pos.z ?? 0];
  }

  getNodeRotation(node) {
    const rot = node.transform?.rotation;
    if (!rot) return [0, 0, 0, 1];
    return [rot.x ?? 0, rot.y ?? 0, rot.z ?? 0, rot.w ?? 1];
  }

  getNodeScale(node) {
    const scale = node.transform?.scale;
    if (!scale) return [1, 1, 1];
    return [scale.x ?? 1, scale.y ?? 1, scale.z ?? 1];
  }

  combineTransforms(parentTransform, childTransform) {
    if (!childTransform) return parentTransform;
    if (!parentTransform) return childTransform;

    const getPos = (t) => t.Position || t.position || [0, 0, 0];
    const getRot = (t) => t.Rotation || t.rotation || [0, 0, 0, 1];
    const getScale = (t) => t.Scale || t.scale || [1, 1, 1];

    const pPos = getPos(parentTransform);
    const cPos = getPos(childTransform);
    const pScale = getScale(parentTransform);
    const cScale = getScale(childTransform);

    return {
      Position: [
        pPos[0] + cPos[0],
        pPos[1] + cPos[1],
        pPos[2] + cPos[2]
      ],
      Rotation: getRot(childTransform),
      Scale: [
        pScale[0] * cScale[0],
        pScale[1] * cScale[1],
        pScale[2] * cScale[2]
      ]
    };
  }

  markNodeLoaded(nodeOrKey) {
    const nodeKey = this._nodeKey(nodeOrKey);
    this.loadedNodes.add(nodeKey);

    const node = this.nodes.get(nodeKey);
    if (node) {
      const children = node.querySelector(':scope > .tree-children');
      if (children) {
        const loading = children.querySelector('.tree-loading');
        if (loading) {
          loading.remove();
        }

        // Hide toggle if no children were loaded
        const hasChildren = children.querySelectorAll(':scope > .tree-node').length > 0;
        if (!hasChildren) {
          const toggle = node.querySelector(':scope > .tree-node-content > .tree-toggle');
          if (toggle) {
            toggle.textContent = '';
          }
          // Update data cache
          const nodeData = this.nodeData.get(nodeKey);
          if (nodeData) {
            nodeData.hasChildren = false;
          }
        }
      }
    }
  }

  expandChildren(nodeOrKey) {
    const nodeKey = this._nodeKey(nodeOrKey);
    const node = this.nodes.get(nodeKey);
    if (!node) {
      return;
    }

    this.expandNode(nodeKey);

    const childrenContainer = node.querySelector(':scope > .tree-children');
    if (!childrenContainer) {
      return;
    }

    const childNodes = childrenContainer.querySelectorAll(':scope > .tree-node');
    childNodes.forEach(childNode => {
      const childUid = childNode.dataset.uid;
      if (childUid) {
        this.expandNode(`node-${childUid}`);
      }
    });
  }

  expandAllDescendants(nodeOrKey) {
    const nodeKey = this._nodeKey(nodeOrKey);
    const node = this.nodes.get(nodeKey);
    if (!node) {
      return;
    }

    this.expandNode(nodeKey);

    const childrenContainer = node.querySelector(':scope > .tree-children');
    if (!childrenContainer) {
      return;
    }

    const childNodes = childrenContainer.querySelectorAll(':scope > .tree-node');
    childNodes.forEach(childNode => {
      const childUid = childNode.dataset.uid;
      if (childUid) {
        this.expandAllDescendants(`node-${childUid}`);
      }
    });
  }

  collapseAllDescendants(nodeOrKey) {
    const nodeKey = this._nodeKey(nodeOrKey);
    const node = this.nodes.get(nodeKey);
    if (!node) {
      return;
    }

    const childrenContainer = node.querySelector(':scope > .tree-children');
    if (childrenContainer) {
      const childNodes = childrenContainer.querySelectorAll(':scope > .tree-node');
      childNodes.forEach(childNode => {
        const childUid = childNode.dataset.uid;
        if (childUid) {
          this.collapseAllDescendants(`node-${childUid}`);
        }
      });
    }

    this.collapseNode(nodeKey);
  }

  showContextMenu(nodeKey, x, y) {
    this.hideContextMenu();

    const node = this.nodes.get(nodeKey);
    if (!node) {
      return;
    }

    const menu = document.createElement('div');
    menu.className = 'tree-context-menu';
    menu.id = 'tree-context-menu';

    const expandChildrenBtn = document.createElement('button');
    expandChildrenBtn.className = 'tree-context-menu-item';
    expandChildrenBtn.textContent = 'Expand Children';
    expandChildrenBtn.addEventListener('click', () => {
      this.expandChildren(nodeKey);
      this.hideContextMenu();
    });

    const expandAllBtn = document.createElement('button');
    expandAllBtn.className = 'tree-context-menu-item';
    expandAllBtn.textContent = 'Expand All';
    expandAllBtn.addEventListener('click', () => {
      this.expandAllDescendants(nodeKey);
      this.hideContextMenu();
    });

    const separator = document.createElement('div');
    separator.className = 'tree-context-menu-separator';

    const collapseAllBtn = document.createElement('button');
    collapseAllBtn.className = 'tree-context-menu-item';
    collapseAllBtn.textContent = 'Collapse All';
    collapseAllBtn.addEventListener('click', () => {
      this.collapseAllDescendants(nodeKey);
      this.hideContextMenu();
    });

    menu.appendChild(expandChildrenBtn);
    menu.appendChild(expandAllBtn);
    menu.appendChild(separator);
    menu.appendChild(collapseAllBtn);

    document.body.appendChild(menu);

    const menuRect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (x + menuRect.width > viewportWidth) {
      x = viewportWidth - menuRect.width - 8;
    }
    if (y + menuRect.height > viewportHeight) {
      y = viewportHeight - menuRect.height - 8;
    }

    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;

    this._contextMenuCloseHandler = (e) => {
      if (!menu.contains(e.target)) {
        this.hideContextMenu();
      }
    };
    this._contextMenuSetupTimeout = setTimeout(() => {
      this._contextMenuSetupTimeout = null;
      document.addEventListener('click', this._contextMenuCloseHandler);
      document.addEventListener('contextmenu', this._contextMenuCloseHandler);
      document.addEventListener('touchstart', this._contextMenuCloseHandler);
    }, 0);
  }

  hideContextMenu() {
    if (this._contextMenuSetupTimeout) {
      clearTimeout(this._contextMenuSetupTimeout);
      this._contextMenuSetupTimeout = null;
    }
    const menu = document.getElementById('tree-context-menu');
    if (menu) {
      menu.remove();
    }
    if (this._contextMenuCloseHandler) {
      document.removeEventListener('click', this._contextMenuCloseHandler);
      document.removeEventListener('contextmenu', this._contextMenuCloseHandler);
      document.removeEventListener('touchstart', this._contextMenuCloseHandler);
      this._contextMenuCloseHandler = null;
    }
  }

  async revealSearchResults(results, loadNodeCallback) {
    if (!results) {
      return;
    }

    // If no results, hide all nodes (empty search result)
    if (results.matches.length === 0 && results.paths.length === 0) {
      this._applySearchFilter(new Set(), new Set());
      return;
    }

    const visibleKeys = new Set();
    const matchKeys = new Set();

    // Sort paths by ancestor depth (highest first = closest to root), deduplicate
    const seenIds = new Set();
    const sortedPaths = [...results.paths]
      .sort((a, b) => b.ancestorDepth - a.ancestorDepth)
      .filter(p => {
        const key = `${p.type}_${p.id}`;
        if (seenIds.has(key)) return false;
        seenIds.add(key);
        return true;
      });

    // Expand ancestors in order (root to leaf), loading children as needed
    for (const ancestor of sortedPaths) {
      const existingNode = this.findNodeByTypeAndId(ancestor.type, ancestor.id);

      if (existingNode) {
        const nodeKey = this._nodeKey(existingNode);
        visibleKeys.add(nodeKey);

        const isLoaded = this.loadedNodes.has(nodeKey);

        if (!isLoaded && loadNodeCallback) {
          this.expandNode(nodeKey);
          await loadNodeCallback(existingNode);
        } else {
          this.expandNode(nodeKey);
        }
      }
    }

    // Collect match node keys
    for (const match of results.matches) {
      const matchNode = this.findNodeByTypeAndId(match.type, match.id);
      if (matchNode) {
        const nodeKey = this._nodeKey(matchNode);
        visibleKeys.add(nodeKey);
        matchKeys.add(nodeKey);
        this.addParentsToSet(nodeKey, visibleKeys);
      }
    }

    this._applySearchFilter(visibleKeys, matchKeys);
  }

  refreshNode(node) {
    const nodeKey = this._nodeKey(node);
    const element = this.nodes.get(nodeKey);
    if (!element) return;

    const label = element.querySelector('.tree-label');
    if (label) {
      label.textContent = node.name;
      label.title = node.name;
    }
  }

  findNodeByTypeAndId(type, id) {
    for (const [, nodeData] of this.nodeData) {
      if (nodeData.type === type && nodeData.id === id) {
        return nodeData;
      }
    }
    return null;
  }
}
