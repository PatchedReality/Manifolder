/**
 * Copyright (c) 2026 Patched Reality, Inc.
 */

/**
 * InspectorPanel - Displays details about the selected map node
 * Shows basic info, transform, bounds, and raw JSON data
 */

import { getResourceUrl, resolveResourceUrl } from './node-helpers.js';

const TYPE_COLORS = {
  RMRoot: 'var(--node-rmroot)',
  RMCObject: 'var(--node-rmcobject)',
  RMTObject: 'var(--node-rmtobject)',
  RMPObject: 'var(--node-rmpobject)',

  // Terrestrial Node Types
  Root: 'var(--node-root)',
  Land: 'var(--node-land)',
  Territory: 'var(--node-territory)',
  Country: 'var(--node-country)',
  County: 'var(--node-county)',
  State: 'var(--node-state)',
  City: 'var(--node-city)',
  Sector: 'var(--node-sector)',
  Community: 'var(--node-community)',

  // Celestial Node Types
  Universe: 'var(--node-universe)',
  Supercluster: 'var(--node-supercluster)',
  GalaxyCluster: 'var(--node-galaxycluster)',
  Galaxy: 'var(--node-galaxy)',
  BlackHole: 'var(--node-blackhole)',
  Nebula: 'var(--node-nebula)',
  StarCluster: 'var(--node-starcluster)',
  Constellation: 'var(--node-constellation)',
  StarSystem: 'var(--node-starsystem)',
  Star: 'var(--node-star)',
  PlanetSystem: 'var(--node-planetsystem)',
  Planet: 'var(--node-planet)',
  Moon: 'var(--node-moon)',
  Debris: 'var(--node-debris)',
  Satellite: 'var(--node-satellite)',
  Transport: 'var(--node-transport)',
  Surface: 'var(--node-surface)'
};

export class InspectorPanel {
  constructor(containerSelector, stateManager) {
    this.container = document.querySelector(containerSelector);
    this.stateManager = stateManager;
    this.currentNode = null;
    this.showRawJson = false;
    this.showResource = false;
    this.resourceCache = new Map();
    this.restoreState();
  }

  saveState() {
    if (!this.stateManager) return;
    this.stateManager.updateSection('inspector', {
      showRawJson: this.showRawJson,
      showResource: this.showResource
    });
  }

  restoreState() {
    if (!this.stateManager) return;
    const state = this.stateManager.getSection('inspector');
    this.showRawJson = state.showRawJson || false;
    this.showResource = state.showResource || false;
  }

  showNode(nodeData) {
    if (!this.container) {
      return;
    }

    this.currentNode = nodeData;
    this.container.innerHTML = '';

    this._renderBasicInfo(nodeData);
    this._renderTransform(nodeData);
    this._renderBounds(nodeData);
    this._renderRawJson(nodeData);
    this._renderResource(nodeData);
  }

  clear() {
    if (!this.container) {
      return;
    }

    this.currentNode = null;
    this.container.innerHTML = '<div class="inspector-empty">Select an object to inspect</div>';
  }

  _renderBasicInfo(node) {
    const section = this._createSection('Basic Info');

    this._addRow(section, 'Name', node.name || '(unnamed)');

    if (node.class) {
      this._addRow(section, 'Class', node.class);
    }

    // Use nodeType (set by server from bType), fall back to type
    const displayType = node.nodeType || node.type || 'Unknown';
    const typeColor = TYPE_COLORS[displayType] || TYPE_COLORS[node.type] || 'var(--text-muted)';

    const typeValue = document.createElement('span');
    typeValue.className = 'inspector-value';
    typeValue.innerHTML = `<span style="color: ${typeColor}">&#9679;</span> ${displayType}`;
    this._addRowWithElement(section, 'Type', typeValue);

    this._addRow(section, 'ID', node.id !== undefined ? String(node.id) : '(none)');

    this.container.appendChild(section);
  }

  _renderTransform(node) {
    if (!node.transform) {
      return;
    }

    const section = this._createSection('Transform');
    const transform = node.transform;

    if (transform.position) {
      const posVector = this._createVector3(transform.position);
      this._addRowWithElement(section, 'Position', posVector);
    }

    if (transform.rotation) {
      const rotVector = this._createVector4(transform.rotation);
      this._addRowWithElement(section, 'Rotation', rotVector);
    }

    if (transform.scale) {
      const scaleVector = this._createVector3(transform.scale);
      this._addRowWithElement(section, 'Scale', scaleVector);
    }

    this.container.appendChild(section);
  }

  _renderBounds(node) {
    if (!node.bound) {
      return;
    }

    const section = this._createSection('Bounds');
    const sizeVector = this._createVector3(node.bound);
    this._addRowWithElement(section, 'Size', sizeVector);

    this.container.appendChild(section);
  }

  _renderProperties(node) {
    if (!node.properties || Object.keys(node.properties).length === 0) {
      return;
    }

    const section = this._createSection('Properties');
    
    // Sort keys for consistent display
    Object.entries(node.properties)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .forEach(([key, value]) => {
        let displayValue = value;
        if (typeof value === 'object' && value !== null) {
          displayValue = JSON.stringify(value);
        }
        this._addRow(section, key, String(displayValue));
      });

    this.container.appendChild(section);
  }

  _renderRawJson(node) {
    const rawDiv = document.createElement('div');
    rawDiv.className = 'inspector-raw';
    if (this.showRawJson) {
      rawDiv.classList.add('expanded');
    }

    const header = document.createElement('div');
    header.className = 'inspector-raw-header';

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'inspector-toggle-btn';
    toggleBtn.innerHTML = this.showRawJson ? '▼' : '▶';
    toggleBtn.title = this.showRawJson ? 'Hide JSON' : 'Show JSON';

    const title = document.createElement('span');
    title.textContent = 'Raw JSON';
    title.className = 'inspector-raw-title';

    const copyBtn = document.createElement('button');
    copyBtn.className = 'inspector-copy-btn';
    copyBtn.title = 'Copy to clipboard';
    copyBtn.innerHTML = '&#128203;';

    const jsonText = JSON.stringify(node.rawData || node, null, 2);
    const linkedHtml = this._linkifyRawJson(jsonText);

    const content = document.createElement('pre');
    content.className = 'inspector-raw-content';
    content.innerHTML = linkedHtml;
    content.style.display = this.showRawJson ? 'block' : 'none';

    const toggleJson = () => {
      this.showRawJson = !this.showRawJson;
      content.style.display = this.showRawJson ? 'block' : 'none';
      toggleBtn.innerHTML = this.showRawJson ? '▼' : '▶';
      toggleBtn.title = this.showRawJson ? 'Hide JSON' : 'Show JSON';
      rawDiv.classList.toggle('expanded', this.showRawJson);
      this.saveState();
    };

    toggleBtn.addEventListener('click', toggleJson);
    title.addEventListener('click', toggleJson);
    title.style.cursor = 'pointer';

    copyBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(jsonText);
        copyBtn.innerHTML = '&#10003;';
        setTimeout(() => { copyBtn.innerHTML = '&#128203;'; }, 1500);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    });

    header.appendChild(toggleBtn);
    header.appendChild(title);
    header.appendChild(copyBtn);

    rawDiv.appendChild(header);
    rawDiv.appendChild(content);
    this.container.appendChild(rawDiv);
  }


  _renderResource(node) {
    const resourceUrl = getResourceUrl(node);
    if (!resourceUrl) {
      return;
    }

    const resourceDiv = document.createElement('div');
    resourceDiv.className = 'inspector-raw';
    if (this.showResource) {
      resourceDiv.classList.add('expanded');
    }

    const header = document.createElement('div');
    header.className = 'inspector-raw-header';

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'inspector-toggle-btn';
    toggleBtn.innerHTML = this.showResource ? '▼' : '▶';
    toggleBtn.title = this.showResource ? 'Hide Resource' : 'Show Resource';

    const title = document.createElement('span');
    title.textContent = 'Resource';
    title.className = 'inspector-raw-title';

    const copyBtn = document.createElement('button');
    copyBtn.className = 'inspector-copy-btn';
    copyBtn.title = 'Copy to clipboard';
    copyBtn.innerHTML = '&#128203;';

    const urlHeader = document.createElement('div');
    urlHeader.className = 'inspector-resource-url';
    const urlLink = document.createElement('a');
    urlLink.href = resourceUrl;
    urlLink.target = '_blank';
    urlLink.textContent = resourceUrl;
    urlHeader.appendChild(urlLink);
    urlHeader.style.display = this.showResource ? 'block' : 'none';

    const content = document.createElement('pre');
    content.className = 'inspector-raw-content';
    content.textContent = 'Loading...';
    content.style.display = this.showResource ? 'block' : 'none';

    const toggleResource = () => {
      this.showResource = !this.showResource;
      urlHeader.style.display = this.showResource ? 'block' : 'none';
      content.style.display = this.showResource ? 'block' : 'none';
      toggleBtn.innerHTML = this.showResource ? '▼' : '▶';
      toggleBtn.title = this.showResource ? 'Hide Resource' : 'Show Resource';
      resourceDiv.classList.toggle('expanded', this.showResource);
      this.saveState();
    };

    toggleBtn.addEventListener('click', toggleResource);
    title.addEventListener('click', toggleResource);
    title.style.cursor = 'pointer';

    copyBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(content.textContent);
        copyBtn.innerHTML = '&#10003;';
        setTimeout(() => { copyBtn.innerHTML = '&#128203;'; }, 1500);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    });

    header.appendChild(toggleBtn);
    header.appendChild(title);
    header.appendChild(copyBtn);

    resourceDiv.appendChild(header);
    resourceDiv.appendChild(urlHeader);
    resourceDiv.appendChild(content);
    this.container.appendChild(resourceDiv);

    // Fetch the resource JSON
    this._loadResource(resourceUrl, content);
  }

  async _loadResource(url, contentElement) {
    // Check cache first
    if (this.resourceCache.has(url)) {
      contentElement.innerHTML = this.resourceCache.get(url);
      return;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const json = await response.json();
      const jsonText = JSON.stringify(json, null, 2);
      const linkedHtml = this._linkifyResourceJson(jsonText, url);
      this.resourceCache.set(url, linkedHtml);
      contentElement.innerHTML = linkedHtml;
    } catch (err) {
      contentElement.textContent = `Failed to load: ${err.message}`;
    }
  }

  _linkifyResourceJson(jsonText, baseUrl) {
    const baseDir = baseUrl.substring(0, baseUrl.lastIndexOf('/') + 1);
    const escaped = jsonText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    return escaped.replace(
      /"file":\s*"([^"]+)"/g,
      (match, filename) => {
        const fullUrl = baseDir + filename;
        return `"file": "<a href="${fullUrl}" target="_blank" class="inspector-file-link">${filename}</a>"`;
      }
    );
  }

  _linkifyRawJson(jsonText) {
    const escaped = jsonText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Match "sName" or "sReference": "filename.ext" patterns
    return escaped.replace(
      /"(sName|sReference)":\s*"([^"]+\.[a-zA-Z0-9]+)"/g,
      (match, key, value) => {
        // Skip action:// protocol (linkify the actual resource names, not the protocol)
        if (value.startsWith('action://')) {
          return match;
        }
        // Full URLs link directly
        if (value.startsWith('http://') || value.startsWith('https://')) {
          return `"${key}": "<a href="${value}" target="_blank" class="inspector-file-link">${value}</a>"`;
        }
        // Relative paths get resolved
        const fullUrl = resolveResourceUrl(value);
        return `"${key}": "<a href="${fullUrl}" target="_blank" class="inspector-file-link">${value}</a>"`;
      }
    );
  }

  _createSection(title) {
    const section = document.createElement('div');
    section.className = 'inspector-section';

    const header = document.createElement('div');
    header.className = 'inspector-section-header';
    header.textContent = title;

    section.appendChild(header);
    return section;
  }

  _addRow(section, label, value) {
    const row = document.createElement('div');
    row.className = 'inspector-row';

    const labelSpan = document.createElement('span');
    labelSpan.className = 'inspector-label';
    labelSpan.textContent = label;

    const valueSpan = document.createElement('span');
    valueSpan.className = 'inspector-value';
    valueSpan.textContent = value;

    row.appendChild(labelSpan);
    row.appendChild(valueSpan);
    section.appendChild(row);
  }

  _addRowWithElement(section, label, element) {
    const row = document.createElement('div');
    row.className = 'inspector-row';

    const labelSpan = document.createElement('span');
    labelSpan.className = 'inspector-label';
    labelSpan.textContent = label;

    row.appendChild(labelSpan);
    row.appendChild(element);
    section.appendChild(row);
  }

  _createVector3(vec) {
    const div = document.createElement('div');
    div.className = 'inspector-vector';

    div.appendChild(this._createVectorComponent('x', vec.x));
    div.appendChild(this._createVectorComponent('y', vec.y));
    div.appendChild(this._createVectorComponent('z', vec.z));

    return div;
  }

  _createVector4(vec) {
    const div = document.createElement('div');
    div.className = 'inspector-vector';

    div.appendChild(this._createVectorComponent('x', vec.x));
    div.appendChild(this._createVectorComponent('y', vec.y));
    div.appendChild(this._createVectorComponent('z', vec.z));
    div.appendChild(this._createVectorComponent('w', vec.w));

    return div;
  }

  _createVectorComponent(axis, value) {
    const span = document.createElement('span');
    span.className = `inspector-vector-component ${axis}`;
    span.textContent = this._formatNumber(value);
    return span;
  }

  _formatNumber(value) {
    if (value === undefined || value === null) {
      return '0.00';
    }
    if (typeof value === 'number') {
      return value.toFixed(2);
    }
    return String(value);
  }
}
