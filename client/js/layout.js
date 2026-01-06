const URL_HISTORY_KEY = 'rp1-url-history';
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
    const tabs = document.querySelectorAll('.view-tab');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.setViewMode(tab.dataset.view);
      });
    });
  }

  setViewMode(mode) {
    this.viewMode = mode;

    const content = document.querySelector('.viewport-content');
    const v3d = document.getElementById('viewport-3d');
    const v2d = document.getElementById('viewport-2d');

    content.classList.remove('split-view');

    if (mode === '3d') {
      v3d.style.display = 'block';
      v2d.style.display = 'none';
    } else if (mode === '2d') {
      v3d.style.display = 'none';
      v2d.style.display = 'block';
    } else if (mode === 'split') {
      content.classList.add('split-view');
      v3d.style.display = 'block';
      v2d.style.display = 'block';
    }

    window.dispatchEvent(new Event('resize'));
  }

  getViewMode() {
    return this.viewMode;
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

    this.loadUrlHistory();

    select?.addEventListener('change', () => {
      if (select.value) {
        input.value = select.value;
        select.value = '';
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
    try {
      return JSON.parse(localStorage.getItem(URL_HISTORY_KEY)) || [];
    } catch {
      return [];
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
            this.setViewModeByKey('3d');
            break;
          case '2':
            e.preventDefault();
            this.setViewModeByKey('2d');
            break;
          case '3':
            e.preventDefault();
            this.setViewModeByKey('split');
            break;
        }
      }
    });
  }

  setViewModeByKey(mode) {
    const tabs = document.querySelectorAll('.view-tab');
    tabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.view === mode);
    });
    this.setViewMode(mode);
  }

  setStatus(message, state = 'disconnected') {
    const statusEl = document.getElementById('status-message');
    if (statusEl) {
      statusEl.textContent = message;
      statusEl.className = state;
    }
  }

  dispatchEvent(name, detail) {
    window.dispatchEvent(new CustomEvent(`rp1:${name}`, { detail }));
  }

  onLoad(callback) {
    window.addEventListener('rp1:load', (e) => callback(e.detail));
  }
}