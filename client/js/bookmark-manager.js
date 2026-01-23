/**
 * Copyright (c) 2026 Patched Reality, Inc.
 */

const STORAGE_KEY = 'mv-bookmarks';

export class BookmarkManager {
  constructor(stateManager) {
    this.stateManager = stateManager;
    this.bookmarks = this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('Failed to load bookmarks:', e);
      return [];
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.bookmarks));
    } catch (e) {
      console.warn('Failed to save bookmarks:', e);
    }
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  save(name) {
    const state = this.stateManager.getFullState();
    const bookmark = {
      id: this.generateId(),
      name: name || 'Untitled',
      state,
      nodeType: state.navigation?.selectedNodePath?.[state.navigation.selectedNodePath.length - 1]?.type || null,
      timestamp: Date.now()
    };

    this.bookmarks.unshift(bookmark);
    this.saveToStorage();
    return bookmark;
  }

  load(id) {
    return this.bookmarks.find(b => b.id === id)?.state || null;
  }

  rename(id, newName) {
    const bookmark = this.bookmarks.find(b => b.id === id);
    if (bookmark) {
      bookmark.name = newName;
      this.saveToStorage();
      return true;
    }
    return false;
  }

  delete(id) {
    const index = this.bookmarks.findIndex(b => b.id === id);
    if (index !== -1) {
      this.bookmarks.splice(index, 1);
      this.saveToStorage();
      return true;
    }
    return false;
  }

  list() {
    return this.bookmarks.map(b => ({
      id: b.id,
      name: b.name,
      timestamp: b.timestamp,
      nodeType: b.nodeType,
      mapUrl: b.state?.navigation?.mapUrl
    }));
  }

  async applyState(state, app) {
    return this.stateManager.applyFullState(state, app);
  }
}
