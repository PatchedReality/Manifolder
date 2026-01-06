import { LayoutManager } from './layout.js';
import { HierarchyPanel } from './hierarchy-panel.js';
import { View3D } from './view-3d.js';
import { View2D } from './view-2d.js';
import { InspectorPanel } from './inspector-panel.js';
import { RP1Client } from './rp1-client.js';

class App {
  constructor() {
    this.layout = new LayoutManager();
    this.hierarchy = new HierarchyPanel('#hierarchy-tree');
    this.view3d = new View3D('#viewport-3d');
    this.view2d = new View2D('#viewport-2d');
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

    this.inspector.clear();
    this.layout.setStatus('Disconnected', 'disconnected');
  }

  setupHierarchyEvents() {
    this.hierarchy.onSelect(node => {
      this.view3d.selectNode(node.id);
      this.view2d.selectNode(node.id);
      this.inspector.showNode(node);
    });

    this.hierarchy.onExpand(node => {
      this.loadNodeChildren(node);
    });
  }

  setupViewEvents() {
    this.view3d.onSelect(node => {
      this.hierarchy.selectNode(node);
      this.hierarchy.expandToNode(node);
      this.view2d.selectNode(node.id);
      this.inspector.showNode(node);
    });

    this.view2d.onSelect(node => {
      this.hierarchy.selectNode(node);
      this.hierarchy.expandToNode(node);
      this.view3d.selectNode(node.id);
      this.inspector.showNode(node);
    });
  }

  setupLayoutEvents() {
    this.layout.onLogin(async ({ email, password }) => {
      await this.handleLogin(email, password);
    });

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
      this.updateLoginButton(false);
    });

    this.client.on('error', (error) => {
      console.error('RP1 Client error:', error);
      this.layout.setStatus('Error: ' + error.message, 'disconnected');
    });

    this.client.on('status', (msg) => {
      this.layout.setStatus(msg, 'loading');
    });
  }

  async handleLogin(email, password) {
    try {
      this.layout.setStatus('Connecting...', 'loading');
      await this.client.connect();

      this.layout.setStatus('Logging in...', 'loading');
      const result = await this.client.login(email, password);

      if (result.success) {
        this.layout.setStatus('Logged in', 'connected');
        this.updateLoginButton(true);
      } else {
        this.layout.setStatus('Login failed: ' + result.error, 'disconnected');
      }
    } catch (error) {
      this.layout.setStatus('Login error: ' + error.message, 'disconnected');
    }
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
      this.view3d.setData(tree);
      this.view2d.setData(tree);
      this.inspector.clear();

      this.layout.setStatus('Map loaded', 'connected');
    } catch (error) {
      this.layout.setStatus('Load error: ' + error.message, 'disconnected');
    }
  }

  async loadNodeChildren(node) {
    try {
      const nodeData = await this.client.getNode(node.id, node.type);
      if (nodeData && nodeData.children) {
        this.hierarchy.setChildren(node, nodeData.children);
      }
      this.hierarchy.markNodeLoaded(node);
    } catch (error) {
      console.error('Failed to load children:', error);
      this.hierarchy.markNodeLoaded(node);
    }
  }

  updateLoginButton(loggedIn) {
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
      if (loggedIn) {
        loginBtn.textContent = 'Logged In';
        loginBtn.classList.add('logged-in');
      } else {
        loginBtn.textContent = 'Login';
        loginBtn.classList.remove('logged-in');
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
