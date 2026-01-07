import { LayoutManager } from './layout.js';
import { HierarchyPanel } from './hierarchy-panel.js';
import { ViewGraph } from './view-graph.js';
import { ViewBounds, NODE_TYPES } from './view-bounds.js';
import { InspectorPanel } from './inspector-panel.js';
import { RP1Client } from './rp1-client.js';

class App {
  constructor() {
    this.layout = new LayoutManager();
    this.hierarchy = new HierarchyPanel('#hierarchy-tree');
    this.viewGraph = new ViewGraph('#viewport-graph');
    this.viewBounds = new ViewBounds('#viewport-bounds');
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

    // Build filter checkboxes from NODE_TYPES
    NODE_TYPES.forEach(type => {
      const label = document.createElement('label');
      label.innerHTML = `<input type="checkbox" value="${type.name}" checked><span class="type-dot" style="background: var(${type.cssVar})"></span> ${type.name}`;
      dropdown.appendChild(label);
    });

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

    // Handle checkbox changes
    const checkboxes = dropdown.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        const enabledTypes = Array.from(dropdown.querySelectorAll('input[type="checkbox"]'))
          .filter(cb => cb.checked)
          .map(cb => cb.value);
        this.viewBounds.setTypeFilter(enabledTypes);
      });
    });
  }

  setupHierarchyEvents() {
    this.hierarchy.onSelect(node => {
      this.viewGraph.selectNode(node);
      this.viewBounds.selectNode(node.id, node.type);
      this.inspector.showNode(node);
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
      this.inspector.showNode(node);
    });

    this.viewGraph.onToggle(node => {
      this.hierarchy.toggleNode(node);
      this.viewBounds.zoomToNode(node);
    });

    this.viewBounds.onSelect(node => {
      this.hierarchy.selectNode(node);
      this.hierarchy.expandToNode(node);
      this.viewGraph.selectNode(node);
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
        // Auto-drill down to the lowest child of type 'Root'
        let targetNode = tree;
        
        // Keep drilling down as long as we have children and the current node is a 'Root'
        // We want to stop AT the last Root node (e.g. Earth), so we check the children.
        while (
          targetNode && 
          targetNode.children && 
          targetNode.children.length > 0
        ) {
          // Check if the first child is also a Root. 
          // If so, we assume it's a wrapper and go down.
          // Note: This assumes a linear chain of Roots or that we follow the first one.
          // Adjust if we need to handle multiple Root children differently.
          const firstChild = targetNode.children[0];
          if ((firstChild.nodeType === 'Root' || firstChild.type === 'RMRoot')) {
             targetNode = firstChild;
          } else {
             break;
          }
        }

        this.hierarchy.selectNode(targetNode);
        this.hierarchy.expandToNode(targetNode);
        this.hierarchy.expandNode(targetNode);
        
        // Force a slight delay to ensure the renderer has had a frame to update positions if needed
        setTimeout(() => {
          this.viewGraph.zoomToNode(targetNode);
        }, 100);
      }
    } catch (error) {
      this.layout.setStatus('Load error: ' + error.message, 'disconnected');
    }
  }

  async loadNodeChildren(node) {
    try {
      const nodeData = await this.client.getNode(node.id, node.type);
      if (nodeData && nodeData.children) {
        this.hierarchy.setChildren(node, nodeData.children);
        this.viewGraph.addChildren(node, nodeData.children);
        this.viewBounds.addChildren(node, nodeData.children);
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
