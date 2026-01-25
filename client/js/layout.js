/**
 * Copyright (c) 2026 Patched Reality, Inc.
 */

const URL_HISTORY_KEY = 'mv-url-history';
const MAX_URL_HISTORY = 10;

export class LayoutManager {
  constructor(stateManager) {
    this.stateManager = stateManager;
    this.panels = {
      hierarchy: document.getElementById('hierarchy-panel'),
      viewport: document.getElementById('viewport-panel'),
      inspector: document.getElementById('inspector-panel')
    };

    this.viewMode = '3d';
    this.resizing = null;

    this.init();
  }

  init() {
    this.setupResizers();
    this.setupViewTabs();
    this.setupUrlHistory();
    this.setupKeyboardShortcuts();
    this.setupPanelMinimize();
  }

  setupResizers() {
    const handles = document.querySelectorAll('.resize-handle');

    handles.forEach(handle => {
      handle.addEventListener('mousedown', (e) => this.startResize(e, handle));
      handle.addEventListener('touchstart', (e) => this.startResize(e, handle), { passive: false });
    });

    document.addEventListener('mousemove', (e) => this.doResize(e));
    document.addEventListener('mouseup', () => this.stopResize());
    document.addEventListener('touchmove', (e) => this.doResize(e), { passive: false });
    document.addEventListener('touchend', () => this.stopResize());
    document.addEventListener('touchcancel', () => this.stopResize());
  }

  startResize(e, handle) {
    e.preventDefault();

    const target = handle.dataset.resize;
    const panelConfig = {
      hierarchy: { panel: this.panels.hierarchy, direction: 'right' },
      inspector: { panel: this.panels.inspector, direction: 'left' }
    };

    const config = panelConfig[target];
    if (!config) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    this.resizing = {
      panel: config.panel,
      direction: config.direction,
      startX: clientX,
      startWidth: config.panel.offsetWidth
    };

    handle.classList.add('active');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }

  doResize(e) {
    if (!this.resizing) return;

    const { panel, direction, startX, startWidth } = this.resizing;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const deltaX = clientX - startX;

    const rawWidth = direction === 'right' ? startWidth + deltaX : startWidth - deltaX;

    const minWidth = parseInt(getComputedStyle(panel).minWidth) || 150;
    const maxWidth = parseInt(getComputedStyle(panel).maxWidth) || 500;
    const newWidth = Math.max(minWidth, Math.min(maxWidth, rawWidth));

    panel.style.width = newWidth + 'px';
    window.dispatchEvent(new Event('resize'));
  }

  stopResize() {
    if (!this.resizing) return;

    document.querySelectorAll('.resize-handle').forEach(h => h.classList.remove('active'));
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    this.resizing = null;
    this.saveState();
  }

  setupPanelMinimize() {
    // Minimize buttons
    document.querySelectorAll('.panel-minimize').forEach(btn => {
      btn.addEventListener('click', () => {
        const panelName = btn.dataset.panel;
        this.minimizePanel(panelName);
      });
    });

    // Restore buttons
    document.getElementById('restore-hierarchy')?.addEventListener('click', () => {
      this.restorePanel('hierarchy');
    });

    document.getElementById('restore-inspector')?.addEventListener('click', () => {
      this.restorePanel('inspector');
    });
  }

  minimizePanel(panelName) {
    const panel = this.panels[panelName];
    const restoreBtn = document.getElementById(`restore-${panelName}`);
    const resizeHandle = document.querySelector(`.resize-handle[data-resize="${panelName}"]`);

    if (panel) {
      panel.classList.add('minimized');
    }
    if (restoreBtn) {
      restoreBtn.classList.remove('hidden');
    }
    if (resizeHandle) {
      resizeHandle.classList.add('hidden');
    }

    window.dispatchEvent(new Event('resize'));
    this.saveState();
  }

  restorePanel(panelName) {
    const panel = this.panels[panelName];
    const restoreBtn = document.getElementById(`restore-${panelName}`);
    const resizeHandle = document.querySelector(`.resize-handle[data-resize="${panelName}"]`);

    if (panel) {
      panel.classList.remove('minimized');
    }
    if (restoreBtn) {
      restoreBtn.classList.add('hidden');
    }
    if (resizeHandle) {
      resizeHandle.classList.remove('hidden');
    }

    window.dispatchEvent(new Event('resize'));
    this.saveState();
  }

  setupViewTabs() {
    const toggles = document.querySelectorAll('.view-toggle');

    this.graphEnabled = true;
    this.boundsEnabled = true;
    this.resourceEnabled = false;

    toggles.forEach(toggle => {
      toggle.addEventListener('click', () => {
        this.toggleView(toggle.dataset.view);
        this.saveState();
      });
    });

    this.updateViewDisplay();
  }

  updateViewToggles() {
    const toggles = document.querySelectorAll('.view-toggle');
    toggles.forEach(toggle => {
      const view = toggle.dataset.view;
      if (view === 'graph') {
        toggle.classList.toggle('active', this.graphEnabled);
      } else if (view === 'bounds') {
        toggle.classList.toggle('active', this.boundsEnabled);
      } else if (view === 'resource') {
        toggle.classList.toggle('active', this.resourceEnabled);
      }
    });
  }

  updateViewDisplay() {
    const content = document.querySelector('.viewport-content');
    const vGraph = document.getElementById('viewport-graph');
    const vBounds = document.getElementById('viewport-bounds');
    const vResource = document.getElementById('viewport-resource');

    content.classList.remove('split-view', 'triple-view');

    const enabledCount = [this.graphEnabled, this.boundsEnabled, this.resourceEnabled].filter(Boolean).length;

    vGraph.style.display = this.graphEnabled ? 'block' : 'none';
    vBounds.style.display = this.boundsEnabled ? 'block' : 'none';
    vResource.style.display = this.resourceEnabled ? 'block' : 'none';

    if (enabledCount === 3) {
      content.classList.add('triple-view');
    } else if (enabledCount === 2) {
      content.classList.add('split-view');
    }

    window.dispatchEvent(new Event('resize'));
  }

  setViewMode(mode) {
    if (mode === 'graph') {
      this.graphEnabled = true;
      this.boundsEnabled = false;
    } else if (mode === 'bounds') {
      this.graphEnabled = false;
      this.boundsEnabled = true;
    } else if (mode === 'both') {
      this.graphEnabled = true;
      this.boundsEnabled = true;
    }
    this.updateViewToggles();
    this.updateViewDisplay();
  }

  getViewMode() {
    if (this.graphEnabled && this.boundsEnabled) return 'both';
    if (this.graphEnabled) return 'graph';
    return 'bounds';
  }

  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('hidden');
      const firstInput = modal.querySelector('input');
      firstInput?.focus();
    }
  }

  hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('hidden');
      modal.querySelectorAll('input').forEach(input => input.value = '');
    }
  }

  setupUrlHistory() {
    const dropdownBtn = document.getElementById('url-dropdown-btn');
    const dropdown = document.getElementById('url-dropdown');
    const input = document.getElementById('url-input');
    const loadBtn = document.getElementById('load-btn');
    const followLinkBtn = document.getElementById('follow-link-btn');

    this.followLinkUrl = null;
    this.loadUrlHistory();

    // Use saved mapUrl from state, or fall back to most recent URL in history
    // Skip auto-load if there's a shared URL param - let checkUrlForSharedState handle it
    let hasSharedUrl = false;
    try {
      hasSharedUrl = (window.top.location.search || window.location.search).includes('loc=');
    } catch (e) {
      hasSharedUrl = window.location.search.includes('loc=');
    }
    if (!hasSharedUrl) {
      const navState = this.stateManager?.getSection('navigation');
      const savedUrl = navState?.mapUrl;
      const history = this.getUrlHistory();
      const initialUrl = savedUrl || (history.length > 0 ? history[0] : null);

      if (initialUrl && input) {
        input.value = initialUrl;
        setTimeout(() => {
          loadBtn?.click();
        }, 100);
      }
    }

    dropdownBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown?.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
      if (!dropdown?.contains(e.target) && e.target !== dropdownBtn) {
        dropdown?.classList.add('hidden');
      }
    });

    loadBtn?.addEventListener('click', () => {
      const url = input.value.trim();
      if (url) {
        this.addToUrlHistory(url);
        this.dispatchEvent('load', { url });
      }
    });

    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        loadBtn?.click();
      }
    });

    followLinkBtn?.addEventListener('click', () => {
      if (this.followLinkUrl) {
        this.setUrl(this.followLinkUrl);
        this.dispatchEvent('load', { url: this.followLinkUrl });
      }
    });
  }

  loadUrlHistory() {
    const dropdown = document.getElementById('url-dropdown');
    const list = dropdown?.querySelector('.url-dropdown-list');
    if (!list) return;

    const history = this.getUrlHistory();
    const input = document.getElementById('url-input');
    const loadBtn = document.getElementById('load-btn');

    list.innerHTML = '';

    if (history.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'url-dropdown-empty';
      empty.textContent = 'No recent URLs';
      list.appendChild(empty);
      return;
    }

    for (const url of history) {
      const item = document.createElement('div');
      item.className = 'url-dropdown-item';
      item.textContent = this.truncateUrl(url);
      item.title = url;
      item.addEventListener('click', () => {
        input.value = url;
        dropdown.classList.add('hidden');
        loadBtn?.click();
      });
      list.appendChild(item);
    }
  }

  getUrlHistory() {
    const defaultUrls = [
      'https://cdn2.rp1.com/config/enter.msf',
      'https://cdn2.rp1.com/config/earth.msf'
    ];
    try {
      const stored = JSON.parse(localStorage.getItem(URL_HISTORY_KEY));
      return stored && stored.length > 0 ? stored : defaultUrls;
    } catch {
      return defaultUrls;
    }
  }

  addToUrlHistory(url) {
    let history = this.getUrlHistory();

    history = history.filter(u => u !== url);
    history.unshift(url);
    history = history.slice(0, MAX_URL_HISTORY);

    try {
      localStorage.setItem(URL_HISTORY_KEY, JSON.stringify(history));
    } catch {
      // localStorage unavailable or full
    }

    this.loadUrlHistory();
  }

  setUrl(url) {
    const input = document.getElementById('url-input');
    if (input) {
      input.value = url;
    }
    this.addToUrlHistory(url);
  }

  setFollowLink(url) {
    this.followLinkUrl = url;
    const btn = document.getElementById('follow-link-btn');
    if (btn) {
      btn.classList.toggle('hidden', !url);
    }
  }

  truncateUrl(url, maxLength = 50) {
    if (url.length <= maxLength) {
      return url;
    }
    return url.substring(0, maxLength - 3) + '...';
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            this.toggleView('graph');
            break;
          case '2':
            e.preventDefault();
            this.toggleView('bounds');
            break;
          case '3':
            e.preventDefault();
            this.toggleView('resource');
            break;
        }
      }
    });
  }

  toggleView(view) {
    switch (view) {
      case 'graph':
        this.graphEnabled = !this.graphEnabled;
        break;
      case 'bounds':
        this.boundsEnabled = !this.boundsEnabled;
        break;
      case 'resource':
        this.resourceEnabled = !this.resourceEnabled;
        break;
    }

    // Ensure at least one view is enabled - default to graph if all disabled
    if (!this.graphEnabled && !this.boundsEnabled && !this.resourceEnabled) {
      if (view === 'bounds' || view === 'resource') {
        this.graphEnabled = true;
      } else {
        this.boundsEnabled = true;
      }
    }

    this.updateViewToggles();
    this.updateViewDisplay();
  }

  setStatus(message, state = 'disconnected') {
    const statusEl = document.getElementById('status-message');
    if (statusEl) {
      statusEl.textContent = message;
      statusEl.className = state;
    }
  }

  dispatchEvent(name, detail) {
    window.dispatchEvent(new CustomEvent(`mv:${name}`, { detail }));
  }

  onLoad(callback) {
    window.addEventListener('mv:load', (e) => callback(e.detail));
  }

  saveState() {
    if (!this.stateManager) return;
    this.stateManager.updateSection('layout', {
      hierarchyWidth: this.panels.hierarchy.offsetWidth,
      inspectorWidth: this.panels.inspector.offsetWidth,
      hierarchyMinimized: this.panels.hierarchy.classList.contains('minimized'),
      inspectorMinimized: this.panels.inspector.classList.contains('minimized'),
      graphEnabled: this.graphEnabled,
      boundsEnabled: this.boundsEnabled,
      resourceEnabled: this.resourceEnabled
    });
  }

  restoreStateValues(state) {
    state = state || this.stateManager?.getSection('layout') || {};

    if (typeof state.graphEnabled === 'boolean') {
      this.graphEnabled = state.graphEnabled;
    }
    if (typeof state.boundsEnabled === 'boolean') {
      this.boundsEnabled = state.boundsEnabled;
    }
    if (typeof state.resourceEnabled === 'boolean') {
      this.resourceEnabled = state.resourceEnabled;
    }
  }

  restoreStateUI(state) {
    state = state || this.stateManager?.getSection('layout') || {};

    if (state.hierarchyWidth) {
      this.panels.hierarchy.style.width = state.hierarchyWidth + 'px';
    }
    if (state.inspectorWidth) {
      this.panels.inspector.style.width = state.inspectorWidth + 'px';
    }

    if (state.hierarchyMinimized) {
      this.minimizePanelWithoutSave('hierarchy');
    } else {
      this.restorePanelWithoutSave('hierarchy');
    }
    if (state.inspectorMinimized) {
      this.minimizePanelWithoutSave('inspector');
    } else {
      this.restorePanelWithoutSave('inspector');
    }

    this.updateViewToggles();
    this.updateViewDisplay();
  }

  restoreState() {
    const state = this.stateManager?.getSection('layout') || {};
    this.restoreStateValues(state);
    this.restoreStateUI(state);
  }

  minimizePanelWithoutSave(panelName) {
    const panel = this.panels[panelName];
    const restoreBtn = document.getElementById(`restore-${panelName}`);
    const resizeHandle = document.querySelector(`.resize-handle[data-resize="${panelName}"]`);

    if (panel) {
      panel.classList.add('minimized');
    }
    if (restoreBtn) {
      restoreBtn.classList.remove('hidden');
    }
    if (resizeHandle) {
      resizeHandle.classList.add('hidden');
    }

    window.dispatchEvent(new Event('resize'));
  }

  restorePanelWithoutSave(panelName) {
    const panel = this.panels[panelName];
    const restoreBtn = document.getElementById(`restore-${panelName}`);
    const resizeHandle = document.querySelector(`.resize-handle[data-resize="${panelName}"]`);

    if (panel) {
      panel.classList.remove('minimized');
    }
    if (restoreBtn) {
      restoreBtn.classList.add('hidden');
    }
    if (resizeHandle) {
      resizeHandle.classList.remove('hidden');
    }

    window.dispatchEvent(new Event('resize'));
  }
}
