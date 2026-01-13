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
import { CELESTIAL_NAMES, PLACEMENT_NAMES } from '../shared/node-types.js';
import { getMsfReference } from './node-helpers.js';

class App {
  constructor() {
    this.layout = new LayoutManager();
    this.hierarchy = new HierarchyPanel('#hierarchy-tree');
    this.viewGraph = new ViewGraph('#viewport-graph');
    this.viewBounds = new ViewBounds('#viewport-bounds');
    this.viewResource = new ViewResource('#viewport-resource');
    this.inspector = new InspectorPanel('#inspector-content');
    this.client = new MVClient();

    this.tree = null;
    this.loadingNodes = new Map(); // Track in-flight loads to prevent race conditions
    this.init();
  }

  init() {
    this.setupHierarchyEvents();
    this.setupViewEvents();
    this.setupLayoutEvents();
    this.setupClientEvents();
    this.setupTypeFilter();

    this.inspector.clear();
    this.layout.setFollowLink(null);
    this.layout.setStatus('Disconnected', 'disconnected');
  }

  setupTypeFilter() {
    const filterBtn = document.getElementById('type-filter-btn');
    const dropdown = document.getElementById('type-filter-dropdown');

    if (!filterBtn || !dropdown) return;

    // Split types into categories using shared type definitions
    // Root is standalone at top, not in any category
    const rootType = NODE_TYPES.find(t => t.name === 'Root');
    const celestialTypesList = NODE_TYPES.filter(t => CELESTIAL_NAMES.has(t.name));
    const terrestrialTypes = NODE_TYPES.filter(t => !CELESTIAL_NAMES.has(t.name) && !PLACEMENT_NAMES.has(t.name) && t.name !== 'Root');
    const placementTypesList = NODE_TYPES.filter(t => PLACEMENT_NAMES.has(t.name));

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
        const isCelestial = CELESTIAL_NAMES.has(type.name);
        const isPlacement = PLACEMENT_NAMES.has(type.name);
        let shapeClass, colorStyle;
        if (isCelestial) {
          shapeClass = 'type-triangle';
          colorStyle = 'border-bottom-color';
        } else if (isPlacement) {
          shapeClass = 'type-square';
          colorStyle = 'background';
        } else {
          shapeClass = 'type-dot';
          colorStyle = 'background';
        }
        label.innerHTML = `<input type="checkbox" value="${type.name}" checked><span class="${shapeClass}" style="${colorStyle}: var(${type.cssVar})"></span> ${type.name}`;
        items.appendChild(label);
      });

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
    dropdown.appendChild(createCategory('Placement', placementTypesList));

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
  }

  updateTypeFilter(dropdown) {
    // Collect from both category items and standalone checkboxes
    const categoryTypes = Array.from(dropdown.querySelectorAll('.filter-category-items input[type="checkbox"]'))
      .filter(cb => cb.checked)
      .map(cb => cb.value);
    const standaloneTypes = Array.from(dropdown.querySelectorAll('.filter-standalone input[type="checkbox"]'))
      .filter(cb => cb.checked)
      .map(cb => cb.value);
    const enabledTypes = [...standaloneTypes, ...categoryTypes];
    this.viewBounds.setTypeFilter(enabledTypes);
  }

  setupHierarchyEvents() {
    this.hierarchy.onSelect(node => {
      this.viewGraph.selectNode(node);
      this.viewBounds.selectNode(node.id, node.type);
      const expandedDescendants = this.hierarchy.getExpandedDescendants(node);
      this.viewResource.setNode(node, expandedDescendants);
      this.inspector.showNode(node);
      this.layout.setFollowLink(getMsfReference(node));

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
      this.layout.setFollowLink(getMsfReference(node));
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
      this.layout.setFollowLink(getMsfReference(node));
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
      console.error('MV Client error:', error);
      this.layout.setStatus('Error: ' + error.message, 'disconnected');
    });

    this.client.on('status', (msg) => {
      this.layout.setStatus(msg, 'loading');
    });
  }

  async handleLoadMap(url) {
    try {
      this.layout.setStatus('Loading map...', 'loading');

      const tree = await this.client.loadMap(url);
      this.tree = tree;

      this.hierarchy.setData(tree);
      this.viewGraph.setData(tree);
      this.viewBounds.setData(tree);
      this.viewResource.setResourceBaseUrl(url);
      this.inspector.clear();
      this.layout.setFollowLink(null);

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
    const key = `${node.type}_${node.id}`;

    // If already loading this node, return the existing promise
    if (this.loadingNodes.has(key)) {
      return this.loadingNodes.get(key);
    }

    const loadPromise = (async () => {
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
      } finally {
        this.loadingNodes.delete(key);
      }
    })();

    this.loadingNodes.set(key, loadPromise);
    return loadPromise;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
