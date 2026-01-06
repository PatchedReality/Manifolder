const NODE_COLORS = {
  RMRoot: '#ffd700',
  RMCObject: '#4a9eff',
  RMTObject: '#50c878',
  RMPObject: '#ff8c42'
};

const DEFAULT_NODE_SIZE = 10;
const MIN_ZOOM = 0.01;
const MAX_ZOOM = 10;
const ZOOM_SENSITIVITY = 0.001;

export class View2D {
  constructor(containerSelector) {
    this.container = document.querySelector(containerSelector);
    this.canvas = null;
    this.ctx = null;
    this.nodes = new Map();
    this.nodeData = new Map();
    this.tree = null;
    this.selectedId = null;
    this.viewMode = 'nested';

    this.panX = 0;
    this.panY = 0;
    this.zoom = 1;

    this.isDragging = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;

    this.selectCallbacks = [];

    this.init();
  }

  init() {
    if (!this.container) {
      console.error('View2D: Container not found');
      return;
    }

    this.canvas = document.createElement('canvas');
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.display = 'block';
    this.container.appendChild(this.canvas);

    this.ctx = this.canvas.getContext('2d');

    this.resizeCanvas();
    this.setupEventListeners();
  }

  setupEventListeners() {
    window.addEventListener('resize', () => this.onResize());

    this.canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
    this.canvas.addEventListener('mouseleave', () => this.onMouseUp());
    this.canvas.addEventListener('click', (e) => this.onClick(e));
    this.canvas.addEventListener('dblclick', (e) => this.onDoubleClick(e));

    this.resizeObserver = new ResizeObserver(() => this.onResize());
    this.resizeObserver.observe(this.container);
  }

  onResize() {
    this.resizeCanvas();
    this.render();
  }

  resizeCanvas() {
    const rect = this.container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;

    this.ctx.scale(dpr, dpr);

    this.canvasWidth = rect.width;
    this.canvasHeight = rect.height;
  }

  onWheel(e) {
    e.preventDefault();

    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldXBefore = (mouseX - this.panX) / this.zoom;
    const worldYBefore = (mouseY - this.panY) / this.zoom;

    const delta = -e.deltaY * ZOOM_SENSITIVITY;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, this.zoom * (1 + delta)));

    this.zoom = newZoom;

    this.panX = mouseX - worldXBefore * this.zoom;
    this.panY = mouseY - worldYBefore * this.zoom;

    this.render();
  }

  onMouseDown(e) {
    if (e.button === 0) {
      this.isDragging = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      this.canvas.style.cursor = 'grabbing';
    }
  }

  onMouseMove(e) {
    if (this.isDragging) {
      const deltaX = e.clientX - this.lastMouseX;
      const deltaY = e.clientY - this.lastMouseY;

      this.panX += deltaX;
      this.panY += deltaY;

      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;

      this.render();
    }
  }

  onMouseUp() {
    this.isDragging = false;
    this.canvas.style.cursor = 'default';
  }

  onClick(e) {
    if (this.isDragging) {
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldX = (mouseX - this.panX) / this.zoom;
    const worldY = (mouseY - this.panY) / this.zoom;

    const clickedNode = this.findNodeAtPoint(worldX, worldY);

    if (clickedNode) {
      this.selectNode(clickedNode.id);
      this.selectCallbacks.forEach(cb => cb(clickedNode));
    }
  }

  onDoubleClick() {
    this.fitToView();
  }

  findNodeAtPoint(worldX, worldY) {
    let foundNode = null;
    let smallestArea = Infinity;

    this.nodeData.forEach((node, id) => {
      const nodeInfo = this.nodes.get(id);
      if (!nodeInfo) {
        return;
      }

      const { x, y, width, height } = nodeInfo;

      if (worldX >= x && worldX <= x + width &&
          worldY >= y && worldY <= y + height) {
        const area = width * height;
        if (area < smallestArea) {
          smallestArea = area;
          foundNode = node;
        }
      }
    });

    return foundNode;
  }

  setData(tree) {
    this.tree = tree;
    this.nodes.clear();
    this.nodeData.clear();
    this.selectedId = null;

    if (tree) {
      this.buildNodeMap(tree, { x: 0, y: 0 });
    }

    this.fitToView();
    this.render();
  }

  buildNodeMap(node, parentPosition) {
    const position = this.getNodePosition(node, parentPosition);

    let width = DEFAULT_NODE_SIZE;
    let height = DEFAULT_NODE_SIZE;

    if (node.bound && node.bound.x > 0) {
      width = node.bound.x;
      height = node.bound.z || node.bound.x;
    }

    const nodeInfo = {
      x: position.x - width / 2,
      y: position.y - height / 2,
      width,
      height,
      worldX: position.x,
      worldY: position.y
    };

    this.nodes.set(node.id, nodeInfo);
    this.nodeData.set(node.id, node);

    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        this.buildNodeMap(child, position);
      });
    }
  }

  getNodePosition(node, parentPosition) {
    let localX = 0;
    let localY = 0;

    if (node.transform && node.transform.position) {
      localX = node.transform.position.x || 0;
      localY = node.transform.position.z || 0;
    }

    return {
      x: parentPosition.x + localX,
      y: parentPosition.y + localY
    };
  }

  selectNode(id) {
    this.selectedId = id;
    this.render();
  }

  setViewMode(mode) {
    if (mode === 'nested' || mode === 'flat') {
      this.viewMode = mode;
      this.render();
    }
  }

  fitToView() {
    if (this.nodes.size === 0) {
      this.panX = this.canvasWidth / 2;
      this.panY = this.canvasHeight / 2;
      this.zoom = 1;
      return;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    this.nodes.forEach(({ x, y, width, height }) => {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + width);
      maxY = Math.max(maxY, y + height);
    });

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    if (contentWidth <= 0 || contentHeight <= 0) {
      return;
    }

    const padding = 40;
    const availableWidth = this.canvasWidth - padding * 2;
    const availableHeight = this.canvasHeight - padding * 2;

    const scaleX = availableWidth / contentWidth;
    const scaleY = availableHeight / contentHeight;
    this.zoom = Math.min(scaleX, scaleY, MAX_ZOOM);

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    this.panX = this.canvasWidth / 2 - centerX * this.zoom;
    this.panY = this.canvasHeight / 2 - centerY * this.zoom;
  }

  render() {
    if (!this.ctx || !this.canvasWidth || !this.canvasHeight) {
      return;
    }

    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    this.drawGrid();

    if (this.viewMode === 'nested') {
      this.renderNested();
    } else {
      this.renderFlat();
    }
  }

  drawGrid() {
    const gridSize = 50;
    const scaledGridSize = gridSize * this.zoom;

    if (scaledGridSize < 10) {
      return;
    }

    this.ctx.strokeStyle = '#333333';
    this.ctx.lineWidth = 1;

    const offsetX = this.panX % scaledGridSize;
    const offsetY = this.panY % scaledGridSize;

    this.ctx.beginPath();

    for (let x = offsetX; x < this.canvasWidth; x += scaledGridSize) {
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvasHeight);
    }

    for (let y = offsetY; y < this.canvasHeight; y += scaledGridSize) {
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvasWidth, y);
    }

    this.ctx.stroke();
  }

  renderNested() {
    if (this.tree) {
      this.renderNodeNested(this.tree, 0);
    }
  }

  renderNodeNested(node, depth) {
    this.drawNode(node, depth);

    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        this.renderNodeNested(child, depth + 1);
      });
    }
  }

  renderFlat() {
    this.nodeData.forEach((node) => {
      this.drawNode(node, 0);
    });
  }

  drawNode(node, depth) {
    const nodeInfo = this.nodes.get(node.id);
    if (!nodeInfo) {
      return;
    }

    const { x, y, width, height } = nodeInfo;
    const color = NODE_COLORS[node.type] || '#aaaaaa';
    const isSelected = node.id === this.selectedId;

    const screenX = x * this.zoom + this.panX;
    const screenY = y * this.zoom + this.panY;
    const screenWidth = width * this.zoom;
    const screenHeight = height * this.zoom;

    if (screenX + screenWidth < 0 || screenX > this.canvasWidth ||
        screenY + screenHeight < 0 || screenY > this.canvasHeight) {
      return;
    }

    if (isSelected) {
      this.ctx.fillStyle = this.hexToRgba(color, 0.3);
      this.ctx.fillRect(screenX, screenY, screenWidth, screenHeight);
    }

    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = isSelected ? 4 : 2;
    this.ctx.strokeRect(screenX, screenY, screenWidth, screenHeight);

    const minLabelSize = 30;
    if (screenWidth > minLabelSize && screenHeight > minLabelSize) {
      this.drawLabel(node.name || `Node ${node.id}`, screenX, screenY, screenWidth, screenHeight, color);
    }
  }

  drawLabel(text, x, y, width, height, color) {
    const maxFontSize = 14;
    const minFontSize = 8;
    const fontSize = Math.max(minFontSize, Math.min(maxFontSize, height / 4));

    this.ctx.font = `${fontSize}px Inter, sans-serif`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    const metrics = this.ctx.measureText(text);
    let displayText = text;

    if (metrics.width > width - 10) {
      const maxChars = Math.floor((width - 20) / (metrics.width / text.length));
      if (maxChars > 3) {
        displayText = text.substring(0, maxChars - 3) + '...';
      } else {
        return;
      }
    }

    const centerX = x + width / 2;
    const centerY = y + height / 2;

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    const padding = 4;
    const textWidth = this.ctx.measureText(displayText).width;
    this.ctx.fillRect(
      centerX - textWidth / 2 - padding,
      centerY - fontSize / 2 - padding,
      textWidth + padding * 2,
      fontSize + padding * 2
    );

    this.ctx.fillStyle = color;
    this.ctx.fillText(displayText, centerX, centerY);
  }

  hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  onSelect(callback) {
    this.selectCallbacks.push(callback);
  }

  getSelectedNode() {
    if (this.selectedId === null) {
      return null;
    }
    return this.nodeData.get(this.selectedId);
  }

  dispose() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    window.removeEventListener('resize', this.onResize);

    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }

    this.nodes.clear();
    this.nodeData.clear();
    this.selectCallbacks = [];
  }
}
