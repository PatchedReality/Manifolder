/**
 * HierarchyPanel - Tree view component for displaying map hierarchy
 * Supports lazy-loading, search filtering, and node selection
 */
export class HierarchyPanel {
  constructor(containerSelector) {
    this.container = document.querySelector(containerSelector);
    this.searchInput = document.getElementById('hierarchy-search');
    this.selectedNode = null;
    this.nodes = new Map();
    this.nodeData = new Map();
    this.loadedNodes = new Set();

    this.selectCallbacks = [];
    this.expandCallbacks = [];
    this._nextId = 1;

    this.init();
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
    this.setupSearch();
  }

  setupSearch() {
    if (!this.searchInput) {
      return;
    }

    let debounceTimer;
    this.searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        this.filterNodes(e.target.value.toLowerCase().trim());
      }, 150);
    });
  }

  filterNodes(searchTerm) {
    if (!searchTerm) {
      this.nodes.forEach((element) => {
        element.classList.remove('hidden');
        element.classList.remove('search-match');
      });
      return;
    }

    const matchingKeys = new Set();

    this.nodeData.forEach((data, nodeKey) => {
      if (data.name.toLowerCase().includes(searchTerm)) {
        matchingKeys.add(nodeKey);
        this.addParentsToSet(nodeKey, matchingKeys);
      }
    });

    this.nodes.forEach((element, nodeKey) => {
      if (matchingKeys.has(nodeKey)) {
        element.classList.remove('hidden');
        const data = this.nodeData.get(nodeKey);
        if (data && data.name.toLowerCase().includes(searchTerm)) {
          element.classList.add('search-match');
        } else {
          element.classList.remove('search-match');
        }
      } else {
        element.classList.add('hidden');
        element.classList.remove('search-match');
      }
    });
  }

  addParentsToSet(nodeKey, set) {
    const element = this.nodes.get(nodeKey);
    if (!element) {
      return;
    }

    const parent = element.parentElement?.closest('.tree-node');
    if (parent) {
      const parentKey = `node-${parent.dataset.uid}`;
      set.add(parentKey);
      this.addParentsToSet(parentKey, set);
    }
  }

  setData(tree) {
    this.clear();

    if (!tree) {
      return;
    }

    const rootElement = this.createNodeElement(tree);
    this.container.appendChild(rootElement);
  }

  clear() {
    this.container.innerHTML = '';
    this.nodes.clear();
    this.nodeData.clear();
    this.loadedNodes.clear();
    this.selectedNode = null;
    this._nextId = 1;
  }

  createNodeElement(nodeData) {
    // Ensure _uid is assigned first
    const nodeKey = this._nodeKey(nodeData);

    const node = document.createElement('div');
    node.className = 'tree-node';
    node.dataset.id = nodeData.id;
    node.dataset.type = nodeData.type;
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
    icon.textContent = '●';

    const label = document.createElement('span');
    label.className = 'tree-label';
    label.textContent = nodeData.name;
    label.title = nodeData.name;

    content.appendChild(toggle);
    content.appendChild(icon);
    content.appendChild(label);

    content.addEventListener('click', () => {
      this.selectNode(nodeKey);
    });

    const children = document.createElement('div');
    children.className = 'tree-children';
    children.style.display = 'none';

    node.appendChild(content);
    node.appendChild(children);

    this.nodes.set(nodeKey, node);
    this.nodeData.set(nodeKey, nodeData);

    if (nodeData.children && nodeData.children.length > 0) {
      this.loadedNodes.add(nodeKey);
      nodeData.children.forEach(child => {
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

    childrenContainer.innerHTML = '';
    this.loadedNodes.add(parentKey);

    children.forEach(child => {
      const childElement = this.createNodeElement(child);
      childrenContainer.appendChild(childElement);
    });
  }

  selectNode(nodeOrKey) {
    const nodeKey = this._nodeKey(nodeOrKey);

    if (this.selectedNode) {
      const prevContent = this.selectedNode.querySelector(':scope > .tree-node-content');
      if (prevContent) {
        prevContent.classList.remove('selected');
      }
    }

    const node = this.nodes.get(nodeKey);
    if (!node) {
      return;
    }

    const content = node.querySelector(':scope > .tree-node-content');
    if (content) {
      content.classList.add('selected');
    }

    this.selectedNode = node;

    const nodeData = this.nodeData.get(nodeKey);
    if (nodeData) {
      this.selectCallbacks.forEach(callback => callback(nodeData));
    }
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

    if (toggle) {
      toggle.textContent = '▼';
    }
    children.style.display = 'block';

    if (!this.loadedNodes.has(nodeKey)) {
      const loading = document.createElement('div');
      loading.className = 'tree-loading';
      loading.textContent = 'Loading...';
      loading.style.color = 'var(--text-muted)';
      loading.style.fontStyle = 'italic';
      loading.style.padding = '2px 4px';
      children.appendChild(loading);

      const nodeData = this.nodeData.get(nodeKey);
      if (nodeData) {
        this.expandCallbacks.forEach(callback => callback(nodeData));
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
  }

  expandToNode(nodeOrKey) {
    const nodeKey = this._nodeKey(nodeOrKey);
    const node = this.nodes.get(nodeKey);
    if (!node) {
      return;
    }

    let parent = node.parentElement?.closest('.tree-node');
    while (parent) {
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

  onSelect(callback) {
    this.selectCallbacks.push(callback);
  }

  onExpand(callback) {
    this.expandCallbacks.push(callback);
  }

  getSelectedNode() {
    if (!this.selectedNode) {
      return null;
    }
    const nodeKey = `node-${this.selectedNode.dataset.uid}`;
    return this.nodeData.get(nodeKey);
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
      }
    }
  }
}
