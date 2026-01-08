/**
 * InspectorPanel - Displays details about the selected map node
 * Shows basic info, transform, bounds, and raw JSON data
 */

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
  constructor(containerSelector) {
    this.container = document.querySelector(containerSelector);
    this.currentNode = null;
    this.showRawJson = false;
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
  }

  clear() {
    if (!this.container) {
      return;
    }

    this.currentNode = null;
    this.showRawJson = false;
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

    const jsonText = JSON.stringify(node, null, 2);

    const content = document.createElement('pre');
    content.className = 'inspector-raw-content';
    content.textContent = jsonText;
    content.style.display = this.showRawJson ? 'block' : 'none';

    const toggleJson = () => {
      this.showRawJson = !this.showRawJson;
      content.style.display = this.showRawJson ? 'block' : 'none';
      toggleBtn.innerHTML = this.showRawJson ? '▼' : '▶';
      toggleBtn.title = this.showRawJson ? 'Hide JSON' : 'Show JSON';
      rawDiv.classList.toggle('expanded', this.showRawJson);
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
