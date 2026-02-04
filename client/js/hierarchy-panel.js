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
    this.nodeElements = new Map();
    this.zoomCallbacks = [];

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

    this.model.on('expansionChanged', (node, expanded) => {
      if (expanded) {
        this.expandNode(node);
      } else {
        this.collapseNode(node);
      }
    });

    this.model.on('nodeUpdated', (node) => {
      this.refreshNode(node);
    });

    this.model.on('nodeInserted', ({ node, parentNode }) => {
      if (!parentNode) return;
      this.addNode(parentNode, node);
    });

    this.model.on('nodeChildrenChanged', (parentNode) => {
      this.setChildren(parentNode, parentNode.children);
      this.markNodeLoaded(parentNode);
    });

    this.model.on('nodeDeleted', ({ node, parentNode }) => {
      const nodeKey = this._nodeKey(node);
      const element = this.nodeElements.get(nodeKey);
      if (element) {
        this._removeNodeAndDescendants(nodeKey);
        element.remove();
      }
      if (parentNode) {
        const parentKey = this._nodeKey(parentNode);
        const parentElement = this.nodeElements.get(parentKey);
        if (parentElement && parentNode.children?.length === 0) {
          const toggle = parentElement.querySelector(':scope > .tree-node-content > .tree-toggle');
          if (toggle) toggle.textContent = '';
        }
      }
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

  _nodeKey(node) {
    if (typeof node === 'string') return node;
    return `${node.type}_${node.id}`;
  }

  _getNodeData(nodeKey) {
    const parts = nodeKey.split('_');
    if (parts.length < 2) return null;
    return this.model.getNode(parts[0], Number(parts[1]));
  }

  init() {
  }

  clearSearchFilter() {
    this.nodeElements.forEach((element) => {
      element.classList.remove('hidden');
      element.classList.remove('search-match');
    });
  }

  searchLocalNodes(searchTerm) {
    const matches = [];
    this.nodeElements.forEach((el, nodeKey) => {
      const data = this._getNodeData(nodeKey);
      if (data && data.name.toLowerCase().includes(searchTerm)) {
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
    this.nodeElements.forEach((element, nodeKey) => {
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
      this.expandToNode(matchKey, false);
    }

    // Scroll first match into view
    if (matchKeys.size > 0) {
      const firstMatchKey = matchKeys.values().next().value;
      const element = this.nodeElements.get(firstMatchKey);
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

    const element = this.nodeElements.get(nodeKey);
    if (!element) return;

    const parent = element.parentElement?.closest('.tree-node');
    if (parent) {
      const parentKey = `${parent.dataset.type}_${parent.dataset.id}`;
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

    // Always expand root to show first-level children
    const children = rootElement.querySelector(':scope > .tree-children');
    const toggle = rootElement.querySelector(':scope > .tree-node-content > .tree-toggle');
    if (children) children.style.display = 'block';
    if (toggle) toggle.textContent = '▼';
  }

  getRootNode() {
    return this.rootNode;
  }

  clear() {
    this.container.innerHTML = '';
    this.nodeElements.clear();
    this.selectedNode = null;
    this.rootNode = null;
  }

  _removeNodeAndDescendants(nodeKey) {
    const el = this.nodeElements.get(nodeKey);
    if (el) {
      const childEls = el.querySelectorAll('.tree-node');
      for (const childEl of childEls) {
        const childKey = `${childEl.dataset.type}_${childEl.dataset.id}`;
        this.nodeElements.delete(childKey);
      }
    }
    this.nodeElements.delete(nodeKey);
  }

  createNodeElement(nodeData) {
    const nodeKey = this._nodeKey(nodeData);

    const node = document.createElement('div');
    node.className = 'tree-node';
    node.dataset.id = nodeData.id;
    node.dataset.type = nodeData.type;
    if (nodeData.nodeType) {
      node.dataset.nodetype = nodeData.nodeType;
    }

    const content = document.createElement('div');
    content.className = 'tree-node-content';

    const toggle = document.createElement('span');
    toggle.className = 'tree-toggle';
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleNode(nodeKey);
    });
    if (nodeData.hasChildren || (nodeData.children && nodeData.children.length > 0)) {
      toggle.textContent = '▶';
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
      const data = this._getNodeData(nodeKey);
      if (data) {
        this.model.selectNode(data);
      }
    });

    content.addEventListener('dblclick', () => {
      const data = this._getNodeData(nodeKey);
      if (data) {
        this.zoomCallbacks.forEach(callback => callback(data));
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

    this.nodeElements.set(nodeKey, node);

    if (nodeData.children && nodeData.children.length > 0) {
      this._sortChildren(nodeData.children).forEach(child => {
        const childElement = this.createNodeElement(child);
        children.appendChild(childElement);
      });
    }

    return node;
  }

  addNode(parentOrKey, nodeData) {
    const parentKey = this._nodeKey(parentOrKey);
    const parentElement = this.nodeElements.get(parentKey);
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

    const toggle = parentElement.querySelector(':scope > .tree-node-content > .tree-toggle');
    if (toggle && !toggle.textContent) {
      toggle.textContent = '▶';
    }

    const nodeElement = this.createNodeElement(nodeData);
    const nodeName = (nodeData.name || '').toLowerCase();
    const existingChildren = childrenContainer.querySelectorAll(':scope > .tree-node');
    let inserted = false;
    for (const sibling of existingChildren) {
      const siblingLabel = sibling.querySelector('.tree-label');
      if (siblingLabel && nodeName.localeCompare(siblingLabel.textContent.toLowerCase()) < 0) {
        childrenContainer.insertBefore(nodeElement, sibling);
        inserted = true;
        break;
      }
    }
    if (!inserted) {
      childrenContainer.appendChild(nodeElement);
    }
  }

  setChildren(parentOrKey, children) {
    const parentKey = this._nodeKey(parentOrKey);
    const parentElement = this.nodeElements.get(parentKey);
    if (!parentElement) {
      return;
    }

    const childrenContainer = parentElement.querySelector(':scope > .tree-children');
    if (!childrenContainer) {
      return;
    }

    // Remove old tree-node children from Maps before clearing DOM
    const oldChildElements = childrenContainer.querySelectorAll(':scope > .tree-node');
    for (const oldEl of oldChildElements) {
      const oldKey = `${oldEl.dataset.type}_${oldEl.dataset.id}`;
      this._removeNodeAndDescendants(oldKey);
      oldEl.remove();
    }

    const toggle = parentElement.querySelector(':scope > .tree-node-content > .tree-toggle');
    if (!children || children.length === 0) {
      const nodeData = this._getNodeData(parentKey);
      if (nodeData && nodeData.hasChildren) {
        if (toggle && !toggle.textContent) {
          toggle.textContent = '▶';
        }
        // Keep or re-add loading indicator while children are still pending
        if (!childrenContainer.querySelector('.tree-loading')) {
          const loading = document.createElement('div');
          loading.className = 'tree-loading';
          loading.textContent = 'Loading...';
          loading.style.color = 'var(--text-muted)';
          loading.style.fontStyle = 'italic';
          loading.style.padding = '2px 4px';
          childrenContainer.appendChild(loading);
        }
      } else {
        childrenContainer.innerHTML = '';
        if (toggle) {
          toggle.textContent = '';
        }
        childrenContainer.style.display = 'none';
      }
      return;
    }

    // Has actual children to render — remove any loading indicator
    const loading = childrenContainer.querySelector('.tree-loading');
    if (loading) loading.remove();

    this._sortChildren(children).forEach(child => {
      const childElement = this.createNodeElement(child);
      childrenContainer.appendChild(childElement);
    });
  }

  selectNode(nodeOrKey) {
    if (this.selectedNode) {
      const prevContent = this.selectedNode.querySelector(':scope > .tree-node-content');
      if (prevContent) {
        prevContent.classList.remove('selected');
      }
    }

    const nodeKey = this._nodeKey(nodeOrKey);
    const node = this.nodeElements.get(nodeKey);
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
    const node = this.nodeElements.get(nodeKey);
    if (!node) {
      return;
    }

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
    const node = this.nodeElements.get(nodeKey);
    if (!node) {
      return;
    }

    const toggle = node.querySelector(':scope > .tree-node-content > .tree-toggle');
    const children = node.querySelector(':scope > .tree-children');

    if (!children) {
      return;
    }

    const nodeData = this._getNodeData(nodeKey);
    const isLoaded = nodeData?._loaded;
    const hasChildren = nodeData && (nodeData.hasChildren || (nodeData.children && nodeData.children.length > 0));
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

    if (!isLoaded) {
      const existingLoading = children.querySelector('.tree-loading');
      if (existingLoading) {
        existingLoading.remove();
      }

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
    const node = this.nodeElements.get(nodeKey);
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

    const nodeData = this._getNodeData(nodeKey);
    if (nodeData) {
      this.model.collapseNode(nodeData);
    }
  }

  expandToNode(nodeOrKey, respectModel = true) {
    const nodeKey = this._nodeKey(nodeOrKey);
    const node = this.nodeElements.get(nodeKey);
    if (!node) {
      return;
    }

    let parent = node.parentElement?.closest('.tree-node');
    while (parent) {
      if (respectModel) {
        const parentKey = `${parent.dataset.type}_${parent.dataset.id}`;
        const parentData = this._getNodeData(parentKey);
        if (parentData && !this.model.isNodeExpanded(parentData)) {
          break;
        }
      }

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

  getChildren(nodeOrKey) {
    const nodeKey = this._nodeKey(nodeOrKey);
    const nodeData = this._getNodeData(nodeKey);
    return nodeData ? nodeData.children : null;
  }

  isNodeExpanded(nodeOrKey) {
    const nodeKey = this._nodeKey(nodeOrKey);
    const node = this.nodeElements.get(nodeKey);
    if (!node) return false;

    const children = node.querySelector(':scope > .tree-children');
    return children && children.style.display !== 'none';
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
    const node = this.nodeElements.get(nodeKey);
    if (!node) return;

    const children = node.querySelector(':scope > .tree-children');
    if (!children) return;

    const hasChildElements = children.querySelectorAll(':scope > .tree-node').length > 0;
    const nodeData = this._getNodeData(nodeKey);
    const modelHasChildren = nodeData && nodeData.hasChildren;

    if (hasChildElements || !modelHasChildren) {
      const loading = children.querySelector('.tree-loading');
      if (loading) loading.remove();
    }

    if (!hasChildElements && !modelHasChildren) {
      const toggle = node.querySelector(':scope > .tree-node-content > .tree-toggle');
      if (toggle) toggle.textContent = '';
    }
  }

  _expandViaModel(nodeOrKey) {
    const nodeKey = this._nodeKey(nodeOrKey);
    const nodeData = this._getNodeData(nodeKey);
    if (nodeData) {
      this.model.expandNode(nodeData);
    }
  }

  _collapseViaModel(nodeOrKey) {
    const nodeKey = this._nodeKey(nodeOrKey);
    const nodeData = this._getNodeData(nodeKey);
    if (nodeData) {
      this.model.collapseNode(nodeData);
    }
  }

  expandChildren(nodeOrKey) {
    const nodeKey = this._nodeKey(nodeOrKey);
    const node = this.nodeElements.get(nodeKey);
    if (!node) {
      return;
    }

    this._expandViaModel(nodeKey);

    const childrenContainer = node.querySelector(':scope > .tree-children');
    if (!childrenContainer) {
      return;
    }

    const childNodes = childrenContainer.querySelectorAll(':scope > .tree-node');
    childNodes.forEach(childNode => {
      const childKey = `${childNode.dataset.type}_${childNode.dataset.id}`;
      this._expandViaModel(childKey);
    });
  }

  expandAllDescendants(nodeOrKey) {
    const nodeKey = this._nodeKey(nodeOrKey);
    const node = this.nodeElements.get(nodeKey);
    if (!node) {
      return;
    }

    this._expandViaModel(nodeKey);

    const childrenContainer = node.querySelector(':scope > .tree-children');
    if (!childrenContainer) {
      return;
    }

    const childNodes = childrenContainer.querySelectorAll(':scope > .tree-node');
    childNodes.forEach(childNode => {
      const childKey = `${childNode.dataset.type}_${childNode.dataset.id}`;
      this.expandAllDescendants(childKey);
    });
  }

  collapseAllDescendants(nodeOrKey) {
    const nodeKey = this._nodeKey(nodeOrKey);
    const node = this.nodeElements.get(nodeKey);
    if (!node) {
      return;
    }

    const childrenContainer = node.querySelector(':scope > .tree-children');
    if (childrenContainer) {
      const childNodes = childrenContainer.querySelectorAll(':scope > .tree-node');
      childNodes.forEach(childNode => {
        const childKey = `${childNode.dataset.type}_${childNode.dataset.id}`;
        this.collapseAllDescendants(childKey);
      });
    }

    this._collapseViaModel(nodeKey);
  }

  showContextMenu(nodeKey, x, y) {
    this.hideContextMenu();

    const node = this.nodeElements.get(nodeKey);
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
      const existingNode = this.model.getNode(ancestor.type, ancestor.id);

      if (existingNode) {
        const nodeKey = this._nodeKey(existingNode);
        visibleKeys.add(nodeKey);

        const isLoaded = existingNode._loaded;

        if (!isLoaded && loadNodeCallback) {
          this._expandViaModel(nodeKey);
          await loadNodeCallback(existingNode);
        } else {
          this._expandViaModel(nodeKey);
        }
      }
    }

    // Collect match node keys
    for (const match of results.matches) {
      const matchNode = this.model.getNode(match.type, match.id);
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
    const element = this.nodeElements.get(nodeKey);
    if (!element) return;

    const label = element.querySelector('.tree-label');
    if (label) {
      label.textContent = node.name;
      label.title = node.name;
    }

    const toggle = element.querySelector(':scope > .tree-node-content > .tree-toggle');
    if (toggle && !toggle.textContent && node.hasChildren) {
      toggle.textContent = '▶';
    }
  }

}
