/**
 * InspectorPanel - Displays details about the selected map node
 * Shows basic info, transform, bounds, and raw JSON data
 */

const TYPE_COLORS = {
  RMRoot: 'var(--node-rmroot)',
  RMCObject: 'var(--node-rmcobject)',
  RMTObject: 'var(--node-rmtobject)',
  RMPObject: 'var(--node-rmpobject)'
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

    const typeValue = document.createElement('span');
    typeValue.className = 'inspector-value';
    const typeColor = TYPE_COLORS[node.type] || 'var(--text-muted)';
    typeValue.innerHTML = `<span style="color: ${typeColor}">&#9679;</span> ${node.type || 'Unknown'}`;
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

  _renderRawJson(node) {
    const rawDiv = document.createElement('div');
    rawDiv.className = 'inspector-raw';

    const toggle = document.createElement('button');
    toggle.className = 'inspector-raw-toggle';
    toggle.textContent = this.showRawJson ? '\u25BC Raw JSON' : '\u25B6 Raw JSON';

    const content = document.createElement('pre');
    content.className = 'inspector-raw-content';
    if (this.showRawJson) {
      content.classList.add('expanded');
    }
    content.textContent = JSON.stringify(node, null, 2);

    toggle.addEventListener('click', () => {
      this.showRawJson = !this.showRawJson;
      toggle.textContent = this.showRawJson ? '\u25BC Raw JSON' : '\u25B6 Raw JSON';
      content.classList.toggle('expanded', this.showRawJson);
    });

    rawDiv.appendChild(toggle);
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
