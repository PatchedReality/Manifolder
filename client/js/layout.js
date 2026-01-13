/**
 * Copyright (c) 2026 Patched Reality, Inc.
 */

const URL_HISTORY_KEY = 'mv-url-history';
const MAX_URL_HISTORY = 10;

export class LayoutManager {
  constructor() {
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
  }

  setupResizers() {
    const handles = document.querySelectorAll('.resize-handle');

    handles.forEach(handle => {
      handle.addEventListener('mousedown', (e) => this.startResize(e, handle));
    });

    document.addEventListener('mousemove', (e) => this.doResize(e));
    document.addEventListener('mouseup', () => this.stopResize());
  }

  startResize(e, handle) {
    e.preventDefault();

    const target = handle.dataset.resize;
    let panel;
    let direction;

    if (target === 'hierarchy') {
      panel = this.panels.hierarchy;
      direction = 'right';
    } else if (target === 'inspector') {
      panel = this.panels.inspector;
      direction = 'left';
    }

    if (panel) {
      this.resizing = {
        panel,
        direction,
        startX: e.clientX,
        startWidth: panel.offsetWidth
      };

      handle.classList.add('active');
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }
  }

  doResize(e) {
    if (!this.resizing) {
      return;
    }

    const { panel, direction, startX, startWidth } = this.resizing;
    const deltaX = e.clientX - startX;

    let newWidth;
    if (direction === 'right') {
      newWidth = startWidth + deltaX;
    } else {
      newWidth = startWidth - deltaX;
    }

    const minWidth = parseInt(getComputedStyle(panel).minWidth) || 150;
    const maxWidth = parseInt(getComputedStyle(panel).maxWidth) || 500;

    newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
    panel.style.width = newWidth + 'px';

    window.dispatchEvent(new Event('resize'));
  }

  stopResize() {
    if (!this.resizing) {
      return;
    }

    document.querySelectorAll('.resize-handle').forEach(h => h.classList.remove('active'));
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    this.resizing = null;
  }

  setupViewTabs() {
    const toggles = document.querySelectorAll('.view-toggle');

    this.graphEnabled = true;
    this.boundsEnabled = true;
    this.resourceEnabled = false;

    toggles.forEach(toggle => {
      toggle.addEventListener('click', () => {
        const view = toggle.dataset.view;

        if (view === 'graph') {
          this.graphEnabled = !this.graphEnabled;
        } else if (view === 'bounds') {
          this.boundsEnabled = !this.boundsEnabled;
        } else if (view === 'resource') {
          this.resourceEnabled = !this.resourceEnabled;
        }

        // Ensure at least one view is enabled
        if (!this.graphEnabled && !this.boundsEnabled && !this.resourceEnabled) {
          if (view === 'graph') {
            this.boundsEnabled = true;
          } else if (view === 'bounds') {
            this.graphEnabled = true;
          } else {
            this.graphEnabled = true;
          }
        }

        this.updateViewToggles();
        this.updateViewDisplay();
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
    const select = document.getElementById('url-history');
    const input = document.getElementById('url-input');
    const loadBtn = document.getElementById('load-btn');
    const followLinkBtn = document.getElementById('follow-link-btn');

    this.followLinkUrl = null;
    this.loadUrlHistory();

    // Default to most recent URL
    const history = this.getUrlHistory();
    if (history.length > 0 && input) {
      input.value = history[0];
      // Auto-load after a short delay to ensure app is initialized
      setTimeout(() => {
        loadBtn?.click();
      }, 100);
    }

    select?.addEventListener('change', () => {
      if (select.value) {
        input.value = select.value;
        select.value = '';
        loadBtn?.click();
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
    const select = document.getElementById('url-history');
    if (!select) {
      return;
    }

    const history = this.getUrlHistory();

    select.innerHTML = '<option value="">Recent URLs...</option>';

    history.forEach(url => {
      const option = document.createElement('option');
      option.value = url;
      option.textContent = this.truncateUrl(url);
      select.appendChild(option);
    });
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
    if (view === 'graph') {
      this.graphEnabled = !this.graphEnabled;
    } else if (view === 'bounds') {
      this.boundsEnabled = !this.boundsEnabled;
    } else if (view === 'resource') {
      this.resourceEnabled = !this.resourceEnabled;
    }

    // Ensure at least one view is enabled
    if (!this.graphEnabled && !this.boundsEnabled && !this.resourceEnabled) {
      if (view === 'graph') {
        this.boundsEnabled = true;
      } else if (view === 'bounds') {
        this.graphEnabled = true;
      } else {
        this.graphEnabled = true;
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
}