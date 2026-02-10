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

  _updateToggleIcon(element, nodeData) {
    const toggle = element.querySelector(':scope > .tree-node-content > .tree-toggle');
    if (!toggle) return;

    if (!nodeData.hasChildren) {
      toggle.textContent = '';
    } else {
      toggle.textContent = nodeData.isExpanded ? '▼' : '▶';
    }
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

    this.model.on('searchStateChanged', (active) => {
      this.container.classList.toggle('search-active', active);
      if (!active) {
        // Expand path to selection when search clears
        const selected = this.model.getSelectedNode();
        if (selected) {
          // Actually expand ancestors in model so hierarchy stays visible
          let ancestor = selected._parent;
          while (ancestor) {
            if (!ancestor.isExpanded) {
              this.model.expandNode(ancestor);
            }
            ancestor = ancestor._parent;
          }
          this.expandToNode(selected, true);
          this.selectNode(selected);
        }
      }
    });

    this.model.on('expansionChanged', (node) => {
      this.refreshNode(node);
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
    });

    this.model.on('nodeLoadFailed', (node) => {
      const nodeKey = this._nodeKey(node);
      const element = this.nodeElements.get(nodeKey);
      if (!element) return;

      const children = element.querySelector(':scope > .tree-children');
      if (!children) return;

      const loading = children.querySelector('.tree-loading');
      if (loading) {
        loading.textContent = 'Load failed - click to retry';
        loading.style.cursor = 'pointer';
        loading.onclick = () => {
          loading.textContent = 'Loading...';
          loading.style.cursor = 'default';
          loading.onclick = null;
          this.model.expandNode(node);
        };
      }
    });

    this.model.on('nodeDeleted', ({ node, parentNode }) => {
      const nodeKey = this._nodeKey(node);
      const element = this.nodeElements.get(nodeKey);
      if (element) {
        this._removeNodeAndDescendants(nodeKey);
        element.remove();
      }
      if (parentNode) {
        this.refreshNode(parentNode);
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

  addParentsToSet(nodeKey, set, depth = 0) {
    if (depth > 100) return;

    const element = this.nodeElements.get(nodeKey);
    if (!element) return;

    const parent = element.parentElement?.closest('.tree-node');
    if (parent) {
      const parentKey = `${parent.dataset.type}_${parent.dataset.id}`;
      if (set.has(parentKey)) return;
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
    if (this.model.isLiveUpdateEnabled(nodeData)) {
      content.classList.add('live-updates');
    }

    const toggle = document.createElement('span');
    toggle.className = 'tree-toggle';
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleNode(nodeKey);
    });

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
    children.style.display = nodeData.isExpanded ? 'block' : 'none';

    node.appendChild(content);
    node.appendChild(children);

    this._updateToggleIcon(node, nodeData);
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

    this.refreshNode(parentOrKey);

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

    if (children && children.length > 0) {
      this._sortChildren(children).forEach(child => {
        const childElement = this.createNodeElement(child);
        childrenContainer.appendChild(childElement);
        // Sync child's isExpanded state from model (for restored expansion state)
        this.refreshNode(child);
      });
    }

    this.refreshNode(parentOrKey);
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

    const nodeData = this._getNodeData(nodeKey);
    if (nodeData) {
      this.model.selectNode(nodeData);
    }
  }

  expandNode(nodeOrKey) {
    const nodeKey = this._nodeKey(nodeOrKey);
    const nodeData = this._getNodeData(nodeKey);
    if (nodeData) {
      this.model.expandNode(nodeData);
    }
  }

  collapseNode(nodeOrKey) {
    const nodeKey = this._nodeKey(nodeOrKey);
    const nodeData = this._getNodeData(nodeKey);
    if (nodeData) {
      this.model.collapseNode(nodeData);
    }
  }

  expandToNode(nodeOrKey, respectModel = true) {
    const nodeKey = this._nodeKey(nodeOrKey);
    const node = this.nodeElements.get(nodeKey);
    if (!node) return;

    let parent = node.parentElement?.closest('.tree-node');
    while (parent) {
      const parentKey = `${parent.dataset.type}_${parent.dataset.id}`;
      const parentData = this._getNodeData(parentKey);

      if (respectModel && parentData && !this.model.isNodeExpanded(parentData)) {
        break;
      }

      parent.classList.remove('hidden');
      if (parentData) {
        this.refreshNode(parentData);
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

  expandChildren(nodeOrKey) {
    const nodeKey = this._nodeKey(nodeOrKey);
    const nodeData = this._getNodeData(nodeKey);
    if (nodeData) {
      this.model.expandChildren(nodeData);
      this.model.selectNode(nodeData);
    }
  }

  expandAllDescendants(nodeOrKey) {
    const nodeKey = this._nodeKey(nodeOrKey);
    const nodeData = this._getNodeData(nodeKey);
    if (nodeData) {
      this.model.expandAllDescendants(nodeData);
      this.model.selectNode(nodeData);
    }
  }

  collapseAllDescendants(nodeOrKey) {
    const nodeKey = this._nodeKey(nodeOrKey);
    const nodeData = this._getNodeData(nodeKey);
    if (nodeData) {
      this.model.collapseAllDescendants(nodeData);
      this.model.selectNode(nodeData);
    }
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

    const separator = document.createElement('div');
    separator.className = 'tree-context-menu-separator';

    const collapseAllBtn = document.createElement('button');
    collapseAllBtn.className = 'tree-context-menu-item';
    collapseAllBtn.textContent = 'Collapse All';
    collapseAllBtn.addEventListener('click', () => {
      this.collapseAllDescendants(nodeKey);
      this.hideContextMenu();
    });

    const nodeData = this._getNodeData(nodeKey);
    const isLive = nodeData && this.model.isLiveUpdateEnabled(nodeData);

    const liveUpdateSeparator = document.createElement('div');
    liveUpdateSeparator.className = 'tree-context-menu-separator';

    const liveUpdateBtn = document.createElement('button');
    liveUpdateBtn.className = 'tree-context-menu-item';
    liveUpdateBtn.textContent = isLive ? 'Disable Live Updates' : 'Enable Live Updates';
    liveUpdateBtn.addEventListener('click', () => {
      const data = this._getNodeData(nodeKey);
      if (data) {
        if (this.model.isLiveUpdateEnabled(data)) {
          this.model.disableLiveUpdates(data);
        } else {
          this.model.enableLiveUpdates(data);
        }
      }
      this.hideContextMenu();
    });

    menu.appendChild(expandChildrenBtn);
    menu.appendChild(separator);
    menu.appendChild(collapseAllBtn);
    menu.appendChild(liveUpdateSeparator);
    menu.appendChild(liveUpdateBtn);

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

  refreshNode(nodeOrKey) {
    const nodeKey = this._nodeKey(nodeOrKey);
    const element = this.nodeElements.get(nodeKey);
    if (!element) return;

    const node = this._getNodeData(nodeKey);
    if (!node) return;

    // Label
    const label = element.querySelector('.tree-label');
    if (label) {
      label.textContent = node.name;
      label.title = node.name;
    }

    // Toggle icon
    this._updateToggleIcon(element, node);

    // Live updates indicator
    const content = element.querySelector(':scope > .tree-node-content');
    if (content) {
      content.classList.toggle('live-updates', this.model.isLiveUpdateEnabled(node));
    }

    // Children visibility
    const children = element.querySelector(':scope > .tree-children');
    if (children) {
      children.style.display = node.isExpanded ? 'block' : 'none';

      // Loading indicator
      const loading = children.querySelector('.tree-loading');
      if (node.isLoading && node.isExpanded) {
        if (!loading) {
          const newLoading = document.createElement('div');
          newLoading.className = 'tree-loading';
          newLoading.textContent = 'Loading...';
          newLoading.style.color = 'var(--text-muted)';
          newLoading.style.fontStyle = 'italic';
          newLoading.style.padding = '2px 4px';
          children.appendChild(newLoading);
        }
      } else if (loading) {
        loading.remove();
      }
    }

    // Search state
    element.classList.toggle('search-match', !!node.isSearchMatch);
    element.classList.toggle('search-ancestor', !!node.isSearchAncestor);
  }

}
