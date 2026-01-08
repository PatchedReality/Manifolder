import { LayoutManager } from './layout.js';
import { HierarchyPanel } from './hierarchy-panel.js';
import { ViewGraph } from './view-graph.js';
import { ViewBounds, NODE_TYPES } from './view-bounds.js';
import { ViewResource } from './view-resource.js';
import { InspectorPanel } from './inspector-panel.js';
import { RP1Client } from './rp1-client.js';

class App {
  constructor() {
    this.layout = new LayoutManager();
    this.hierarchy = new HierarchyPanel('#hierarchy-tree');
    this.viewGraph = new ViewGraph('#viewport-graph');
    this.viewBounds = new ViewBounds('#viewport-bounds');
    this.viewResource = new ViewResource('#viewport-resource');
    this.inspector = new InspectorPanel('#inspector-content');
    this.client = new RP1Client();

    this.tree = null;
    this.init();
  }

  init() {
    this.setupHierarchyEvents();
    this.setupViewEvents();
    this.setupLayoutEvents();
    this.setupClientEvents();
    this.setupTypeFilter();

    this.inspector.clear();
    this.layout.setStatus('Disconnected', 'disconnected');
  }

  setupTypeFilter() {
    const filterBtn = document.getElementById('type-filter-btn');
    const dropdown = document.getElementById('type-filter-dropdown');

    if (!filterBtn || !dropdown) return;

    // Split types into categories
    const celestialTypes = new Set([
      'Universe', 'Supercluster', 'GalaxyCluster', 'Galaxy', 'BlackHole',
      'Nebula', 'StarCluster', 'Constellation', 'StarSystem', 'Star',
      'PlanetSystem', 'Planet', 'Moon', 'Debris', 'Satellite', 'Transport', 'Surface'
    ]);

    const terrestrialTypes = NODE_TYPES.filter(t => !celestialTypes.has(t.name));
    const celestialTypesList = NODE_TYPES.filter(t => celestialTypes.has(t.name));

    // Helper to create a category
    const createCategory = (name, types) => {
      const category = document.createElement('div');
      category.className = 'filter-category';

      const header = document.createElement('label');
      header.className = 'filter-category-header';
      header.innerHTML = `<input type="checkbox" data-category="${name}" checked> ${name}`;
      category.appendChild(header);

      const items = document.createElement('div');
      items.className = 'filter-category-items';

      types.forEach(type => {
        const label = document.createElement('label');
        const isCelestial = celestialTypes.has(type.name);
        const shapeClass = isCelestial ? 'type-triangle' : 'type-dot';
        const colorStyle = isCelestial ? 'border-bottom-color' : 'background';
        label.innerHTML = `<input type="checkbox" value="${type.name}" checked><span class="${shapeClass}" style="${colorStyle}: var(${type.cssVar})"></span> ${type.name}`;
        items.appendChild(label);
      });

      category.appendChild(items);
      return category;
    };

    dropdown.appendChild(createCategory('Terrestrial', terrestrialTypes));
    dropdown.appendChild(createCategory('Celestial', celestialTypesList));

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

    // Handle individual checkbox changes
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
  }

  updateTypeFilter(dropdown) {
    const enabledTypes = Array.from(dropdown.querySelectorAll('.filter-category-items input[type="checkbox"]'))
      .filter(cb => cb.checked)
      .map(cb => cb.value);
    this.viewBounds.setTypeFilter(enabledTypes);
  }

  setupHierarchyEvents() {
    this.hierarchy.onSelect(node => {
      this.viewGraph.selectNode(node);
      this.viewBounds.selectNode(node.id, node.type);
      const expandedDescendants = this.hierarchy.getExpandedDescendants(node);
      this.viewResource.setNode(node, expandedDescendants);
      this.inspector.showNode(node);

      localStorage.setItem('selectedNodeId', node.id);
      localStorage.setItem('selectedNodeType', node.type);

      // Save path from root to this node for restoration
      const path = this.hierarchy.getPathToNode(node);
      if (path) {
        localStorage.setItem('selectedNodePath', JSON.stringify(path));
      }
    });

    this.hierarchy.onZoom(node => {
      this.viewGraph.zoomToNode(node);
      this.viewBounds.zoomToNode(node);
    });

    this.hierarchy.onToggle((node, expanded) => {
      if (expanded) {
        const children = this.hierarchy.getChildren(node);
        if (children && children.length > 0) {
          this.viewGraph.addChildren(node, children);
          this.viewBounds.addChildren(node, children);
        }
        this.viewBounds.expandNode(node);
      } else {
        this.viewGraph.removeDescendants(node);
        this.viewBounds.collapseNode(node);
      }

      this.viewGraph.selectNode(node);
      this.viewGraph.zoomToNode(node);
      this.viewBounds.zoomToNode(node);
    });

    this.hierarchy.onExpand(node => {
      this.loadNodeChildren(node);
    });
  }

  setupViewEvents() {
    this.viewGraph.onSelect(node => {
      this.hierarchy.selectNode(node);
      this.hierarchy.expandToNode(node);
      this.viewBounds.selectNode(node.id, node.type);
      const expandedDescendants = this.hierarchy.getExpandedDescendants(node);
      this.viewResource.setNode(node, expandedDescendants);
      this.inspector.showNode(node);
    });

    this.viewGraph.onToggle(node => {
      this.hierarchy.toggleNode(node);
      this.viewBounds.zoomToNode(node);
    });

    this.viewGraph.onMsfLoad(url => {
      this.layout.setUrl(url);
      this.handleLoadMap(url);
    });

    this.viewBounds.onSelect(node => {
      this.hierarchy.selectNode(node);
      this.hierarchy.expandToNode(node);
      this.viewGraph.selectNode(node);
      const expandedDescendants = this.hierarchy.getExpandedDescendants(node);
      this.viewResource.setNode(node, expandedDescendants);
      this.inspector.showNode(node);
    });

    this.viewBounds.onToggle((node, expanded) => {
      if (expanded) {
        this.hierarchy.expandNode(node);
        const children = this.hierarchy.getChildren(node);
        if (children && children.length > 0) {
          this.viewBounds.addChildren(node, children);
        }
      } else {
        this.hierarchy.collapseNode(node);
      }
      this.viewBounds.zoomToNode(node);
      this.viewGraph.zoomToNode(node);
    });

    this.viewBounds.onMsfLoad(url => {
      this.layout.setUrl(url);
      this.handleLoadMap(url);
    });
  }

  setupLayoutEvents() {
    this.layout.onLoad(async ({ url }) => {
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
      console.error('RP1 Client error:', error);
      this.layout.setStatus('Error: ' + error.message, 'disconnected');
    });

    this.client.on('status', (msg) => {
      this.layout.setStatus(msg, 'loading');
    });
  }

  async handleLoadMap(url) {
    try {
      // Auto-connect if not connected
      if (!this.client.connected) {
        this.layout.setStatus('Connecting...', 'loading');
        await this.client.connect();
      }

      this.layout.setStatus('Loading map...', 'loading');

      const tree = await this.client.loadMap(url);
      this.tree = tree;

      this.hierarchy.setData(tree);
      this.viewGraph.setData(tree);
      this.viewBounds.setData(tree);
      this.inspector.clear();

      this.layout.setStatus('Map loaded', 'connected');

      if (tree) {
        // Expand all nodes at top 3 levels
        const expandLevel = (nodes, depth) => {
          if (depth > 3 || !nodes) return;
          nodes.forEach(node => {
            this.hierarchy.expandNode(node);
            if (node.children && node.children.length > 0) {
              expandLevel(node.children, depth + 1);
            }
          });
        };

        this.hierarchy.expandNode(tree);
        if (tree.children) {
          expandLevel(tree.children, 2);
        }

        // Try to restore previously selected node via path
        const savedPath = localStorage.getItem('selectedNodePath');
        if (savedPath) {
          await this.restoreNodePath(JSON.parse(savedPath));
        } else {
          this.hierarchy.selectNode(tree);
          setTimeout(() => {
            this.viewGraph.zoomToNode(tree);
          }, 100);
        }
      }
    } catch (error) {
      this.layout.setStatus('Load error: ' + error.message, 'disconnected');
    }
  }

  findNodeById(tree, id) {
    if (tree.id === id) return tree;
    if (tree.children) {
      for (const child of tree.children) {
        const found = this.findNodeById(child, id);
        if (found) return found;
      }
    }
    return null;
  }

  async restoreNodePath(path) {
    if (!path || path.length === 0 || !this.tree) {
      this.hierarchy.selectNode(this.tree);
      return;
    }

    let currentNode = this.tree;

    for (let i = 1; i < path.length; i++) {
      const targetId = path[i].id;
      const targetType = path[i].type;

      // Expand current node first
      this.hierarchy.expandNode(currentNode);

      // Load children if not already loaded
      if (!currentNode.children || currentNode.children.length === 0) {
        try {
          await this.loadNodeChildren(currentNode);
          // Small delay to let UI update
          await new Promise(r => setTimeout(r, 50));
        } catch (err) {
          console.warn('Failed to load children during restore:', err);
          break;
        }
      }

      // Find target child in the loaded children
      let nextNode = currentNode.children?.find(c => c.id === targetId && c.type === targetType);

      if (!nextNode) {
        // Try by id only if type match failed
        nextNode = currentNode.children?.find(c => c.id === targetId);
      }

      if (!nextNode) {
        console.warn('Could not find node in path:', targetId, targetType);
        break;
      }

      currentNode = nextNode;
    }

    // Expand tree to show the node, then select it
    this.hierarchy.expandToNode(currentNode);
    this.hierarchy.selectNode(currentNode);
    this.viewBounds.selectNode(currentNode.id, currentNode.type);
    this.viewBounds.zoomToNode(currentNode);
    setTimeout(() => {
      this.viewGraph.zoomToNode(currentNode);
    }, 100);
  }

  async loadNodeChildren(node) {
    try {
      const nodeData = await this.client.getNode(node.id, node.type);
      if (nodeData && nodeData.children) {
        this.hierarchy.setChildren(node, nodeData.children);
        this.viewGraph.addChildren(node, nodeData.children);
        this.viewBounds.addChildren(node, nodeData.children);

        const selectedNode = this.hierarchy.getSelectedNode();
        if (selectedNode && selectedNode._uid === node._uid) {
          const expandedDescendants = this.hierarchy.getExpandedDescendants(node);
          this.viewResource.setNode(node, expandedDescendants);
        }
      }
      this.hierarchy.markNodeLoaded(node);
    } catch (error) {
      console.error('Failed to load children:', error);
      this.hierarchy.markNodeLoaded(node);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
