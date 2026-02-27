/*
 * Copyright 2026 Patched Reality, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * InspectorPanel - Displays details about the selected map node
 * Shows basic info, transform, bounds, and raw JSON data
 */

import { NodeFactory } from './node-factory.js';
import { calculateLatLong, formatLatLong } from './geo-utils.js';

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
  constructor(containerSelector, stateManager, model) {
    this.container = document.querySelector(containerSelector);
    this.stateManager = stateManager;
    this.model = model;
    this.currentNode = null;
    this.showRawJson = false;
    this.showResource = false;
    this.restoreState();

    this.model.on('selectionChanged', (node) => {
      if (node) {
        this.showNode(node);
      }
    });

    this.model.on('dataChanged', () => {
      const node = this.model.getSelectedNode();
      if (node) this.showNode(node);
    });

    this.model.on('treeChanged', () => {
      this.clear();
    });
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
    this._renderLocation(nodeData);
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

  _renderLocation(node) {
    const planetContext = this.model.getPlanetContext(node);
    if (!node.worldPos || !planetContext) return;

    const coords = calculateLatLong(node.worldPos, planetContext.radius);
    if (!coords) return;

    const section = this._createSection('Location');

    const valueContainer = document.createElement('span');
    valueContainer.className = 'inspector-value inspector-location-value';
    valueContainer.innerHTML = `${formatLatLong(coords.latitude, coords.longitude)}<span class="inspector-planet-name"> (${planetContext.planetName})</span>`;

    this._addRowWithElement(section, 'Lat/Long', valueContainer);
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

  _createCollapsibleSection(options) {
    const { title, isExpanded, stateKey, getCopyText, extraElements = [] } = options;

    const container = document.createElement('div');
    container.className = 'inspector-raw';
    if (isExpanded) {
      container.classList.add('expanded');
    }

    const header = document.createElement('div');
    header.className = 'inspector-raw-header';

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'inspector-toggle-btn';
    toggleBtn.innerHTML = isExpanded ? '▼' : '▶';
    toggleBtn.title = isExpanded ? `Hide ${title}` : `Show ${title}`;

    const titleSpan = document.createElement('span');
    titleSpan.textContent = title;
    titleSpan.className = 'inspector-raw-title';

    const copyBtn = document.createElement('button');
    copyBtn.className = 'inspector-copy-btn';
    copyBtn.title = 'Copy to clipboard';
    copyBtn.innerHTML = '&#128203;';

    const content = document.createElement('pre');
    content.className = 'inspector-raw-content';
    content.style.display = isExpanded ? 'block' : 'none';

    const toggle = () => {
      this[stateKey] = !this[stateKey];
      content.style.display = this[stateKey] ? 'block' : 'none';
      toggleBtn.innerHTML = this[stateKey] ? '▼' : '▶';
      toggleBtn.title = this[stateKey] ? `Hide ${title}` : `Show ${title}`;
      container.classList.toggle('expanded', this[stateKey]);
      for (const el of extraElements) {
        el.style.display = this[stateKey] ? 'block' : 'none';
      }
      this.saveState();
    };

    toggleBtn.addEventListener('click', toggle);
    titleSpan.addEventListener('click', toggle);
    titleSpan.style.cursor = 'pointer';

    copyBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(getCopyText());
        copyBtn.innerHTML = '&#10003;';
        setTimeout(() => { copyBtn.innerHTML = '&#128203;'; }, 1500);
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
        copyBtn.innerHTML = '!';
        setTimeout(() => { copyBtn.innerHTML = '&#128203;'; }, 1500);
      }
    });

    header.appendChild(toggleBtn);
    header.appendChild(titleSpan);
    header.appendChild(copyBtn);
    container.appendChild(header);
    container.appendChild(content);

    return { container, content };
  }

  _renderRawJson(node) {
    const jsonText = JSON.stringify(node.rawData || node, null, 2);
    const linkedHtml = this._linkifyRawJson(jsonText, node);

    const { container, content } = this._createCollapsibleSection({
      title: 'Raw JSON',
      isExpanded: this.showRawJson,
      stateKey: 'showRawJson',
      getCopyText: () => jsonText
    });

    content.innerHTML = linkedHtml;
    this.container.appendChild(container);
  }

  _renderResource(node) {
    if (!node.resourceUrl) {
      return;
    }

    const urlHeader = document.createElement('div');
    urlHeader.className = 'inspector-resource-url';
    const urlLink = document.createElement('a');
    urlLink.href = node.resourceUrl;
    urlLink.target = '_blank';
    urlLink.textContent = node.resourceUrl;
    urlHeader.appendChild(urlLink);
    urlHeader.style.display = this.showResource ? 'block' : 'none';

    const { container, content } = this._createCollapsibleSection({
      title: 'Resource',
      isExpanded: this.showResource,
      stateKey: 'showResource',
      getCopyText: () => content.textContent,
      extraElements: [urlHeader]
    });

    content.textContent = 'Loading...';
    container.insertBefore(urlHeader, content);
    this.container.appendChild(container);

    this._loadResource(node, content);
  }

  async _loadResource(node, contentElement) {
    try {
      const data = await NodeFactory.getResourceData(node);
      if (!data) {
        contentElement.textContent = 'No resource metadata';
        return;
      }
      contentElement.innerHTML = this._formatResourceJson(data);
    } catch (err) {
      contentElement.textContent = `Failed to load: ${err.message}`;
    }
  }

  _formatResourceJson(data, indent = 0) {
    const pad = '  '.repeat(indent);
    const pad1 = '  '.repeat(indent + 1);

    if (data === null) return 'null';
    if (typeof data === 'boolean') return data.toString();
    if (typeof data === 'number') return data.toString();
    if (typeof data === 'string') {
      const escaped = data.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `"${escaped}"`;
    }

    if (Array.isArray(data)) {
      if (data.length === 0) return '[]';
      const items = data.map(item => pad1 + this._formatResourceJson(item, indent + 1));
      return `[\n${items.join(',\n')}\n${pad}]`;
    }

    if (typeof data === 'object') {
      const keys = Object.keys(data).filter(k => !k.startsWith('_'));
      if (keys.length === 0) return '{}';

      const lines = keys.map(key => {
        const value = data[key];
        const escaped = key.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        let formattedValue;

        // Check for corresponding _url property
        const urlKey = `_${key}Url`;
        const url = data[urlKey] || data._url;

        if (url && typeof value === 'string') {
          const escapedValue = value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          formattedValue = `"<a href="${url}" target="_blank" class="inspector-file-link">${escapedValue}</a>"`;
        } else {
          formattedValue = this._formatResourceJson(value, indent + 1);
        }

        return `${pad1}"${escaped}": ${formattedValue}`;
      });

      return `{\n${lines.join(',\n')}\n${pad}}`;
    }

    return String(data);
  }

  _linkifyRawJson(jsonText, node) {
    let html = jsonText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const pResource = node?.rawData?.pResource || node?.properties?.pResource;

    if (node?.resourceUrl) {
      // Link sName if it has a value and contributed to resourceUrl
      if (pResource?.sName) {
        html = html.replace(
          `"sName": "${pResource.sName}"`,
          `"sName": "<a href="${node.resourceUrl}" target="_blank" class="inspector-file-link">${pResource.sName}</a>"`
        );
      }
      // Link sReference if it's not action:// (those use sName for the actual file)
      if (pResource?.sReference && !pResource.sReference.startsWith('action://')) {
        html = html.replace(
          `"sReference": "${pResource.sReference}"`,
          `"sReference": "<a href="${node.resourceUrl}" target="_blank" class="inspector-file-link">${pResource.sReference}</a>"`
        );
      }
    } else if (pResource?.sReference?.startsWith('http')) {
      // Link sReference if it's already a full URL (textures, images, etc.)
      html = html.replace(
        `"sReference": "${pResource.sReference}"`,
        `"sReference": "<a href="${pResource.sReference}" target="_blank" class="inspector-file-link">${pResource.sReference}</a>"`
      );
    }

    return html;
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

  _createVectorDisplay(vec, components) {
    const div = document.createElement('div');
    div.className = 'inspector-vector';

    for (const axis of components) {
      div.appendChild(this._createVectorComponent(axis, vec[axis]));
    }

    return div;
  }

  _createVector3(vec) {
    return this._createVectorDisplay(vec, 'xyz');
  }

  _createVector4(vec) {
    return this._createVectorDisplay(vec, 'xyzw');
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
