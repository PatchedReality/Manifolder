import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createStarfield, createGroundGrid } from './scene-helpers.js';

// Display node types with their colors (hex for Three.js, CSS var name for UI)
export const NODE_TYPES = [
  { name: 'Root', color: 0xffd700, cssVar: '--node-root' },
  { name: 'Land', color: 0x4a9eff, cssVar: '--node-land' },
  { name: 'Territory', color: 0xff7f50, cssVar: '--node-territory' },
  { name: 'Country', color: 0x9370db, cssVar: '--node-country' },
  { name: 'County', color: 0x87ceeb, cssVar: '--node-county' },
  { name: 'State', color: 0x20b2aa, cssVar: '--node-state' },
  { name: 'City', color: 0xf08080, cssVar: '--node-city' },
  { name: 'Sector', color: 0x98fb98, cssVar: '--node-sector' },
  { name: 'Community', color: 0xdda0dd, cssVar: '--node-community' }
];

// Build NODE_COLORS lookup from NODE_TYPES
const NODE_COLORS = {
  RMRoot: 0xffd700,
  RMCObject: 0x4a9eff,
  RMTObject: 0x50c878,
  RMPObject: 0xff8c42,
  ...Object.fromEntries(NODE_TYPES.map(t => [t.name, t.color]))
};

const DEFAULT_COLOR = 0x888888;
const SELECTION_COLOR = 0xffffff;
const GLOBE_RADIUS = 100;
const POLYGON_OFFSET = 0.5; // Slight offset above sphere surface

export class ViewBounds {
  constructor(containerSelector) {
    this.container = document.querySelector(containerSelector);
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.globe = null;

    this.nodeData = new Map();
    this.nodeMeshes = new Map();
    this.expandedNodes = new Set();
    this.tree = null;
    this.selectedId = null;
    this.selectedType = null;

    this.selectCallbacks = [];
    this.toggleCallbacks = [];

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Type filter - all types enabled by default
    this.typeFilter = new Set(NODE_TYPES.map(t => t.name));

    this.init();
    this.animate();
  }

  init() {
    if (!this.container) {
      console.error('ViewBounds: Container not found');
      return;
    }

    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 600;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x111111);

    // Camera
    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 10000);
    this.camera.position.set(0, 0, 300);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.container.appendChild(this.renderer.domElement);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.2;

    // Lights
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    hemiLight.position.set(0, 200, 0);
    this.scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(100, 200, 100);
    this.scene.add(dirLight);

    // Camera-attached fill light
    const cameraLight = new THREE.PointLight(0xffffff, 0.5);
    this.camera.add(cameraLight);
    this.scene.add(this.camera);

    // Ground Grid and Starfield
    this.gridHelper = createGroundGrid(this.scene);
    createStarfield(this.scene);

    this.setupEventListeners();
  }

  createGlobe() {
    // Wireframe sphere for the globe
    const geometry = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0x1a2a3a,
      wireframe: true,
      transparent: true,
      opacity: 0.3
    });
    this.globe = new THREE.Mesh(geometry, material);
    this.scene.add(this.globe);

    // Add latitude/longitude lines
    this.addGraticule();
  }

  addGraticule() {
    const material = new THREE.LineBasicMaterial({
      color: 0x2a4a6a,
      transparent: true,
      opacity: 0.4
    });

    // Latitude lines (every 30 degrees)
    for (let lat = -60; lat <= 60; lat += 30) {
      const points = [];
      const phi = (90 - lat) * Math.PI / 180;
      for (let lon = 0; lon <= 360; lon += 5) {
        const theta = lon * Math.PI / 180;
        const x = GLOBE_RADIUS * Math.sin(phi) * Math.cos(theta);
        const y = GLOBE_RADIUS * Math.cos(phi);
        const z = GLOBE_RADIUS * Math.sin(phi) * Math.sin(theta);
        points.push(new THREE.Vector3(x, y, z));
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, material);
      this.scene.add(line);
    }

    // Longitude lines (every 30 degrees)
    for (let lon = 0; lon < 360; lon += 30) {
      const points = [];
      const theta = lon * Math.PI / 180;
      for (let lat = -90; lat <= 90; lat += 5) {
        const phi = (90 - lat) * Math.PI / 180;
        const x = GLOBE_RADIUS * Math.sin(phi) * Math.cos(theta);
        const y = GLOBE_RADIUS * Math.cos(phi);
        const z = GLOBE_RADIUS * Math.sin(phi) * Math.sin(theta);
        points.push(new THREE.Vector3(x, y, z));
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, material);
      this.scene.add(line);
    }
  }

  createStarfield() {
    const geometry = new THREE.BufferGeometry();
    const count = 2000;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const r = 2000 + Math.random() * 2000;
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0x666688,
      size: 1.5,
      sizeAttenuation: false
    });
    const stars = new THREE.Points(geometry, material);
    this.scene.add(stars);
  }

  setupEventListeners() {
    window.addEventListener('resize', () => this.onResize());

    // Use click delay to distinguish single vs double click
    this.clickTimeout = null;
    this.renderer.domElement.addEventListener('click', (e) => {
      if (this.clickTimeout) {
        clearTimeout(this.clickTimeout);
        this.clickTimeout = null;
        this.onDoubleClick(e);
      } else {
        this.clickTimeout = setTimeout(() => {
          this.clickTimeout = null;
          this.onClick(e);
        }, 250);
      }
    });

    // ResizeObserver for container size changes
    this.resizeObserver = new ResizeObserver(() => this.onResize());
    this.resizeObserver.observe(this.container);
  }

  onResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (width === 0 || height === 0) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  onClick(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Get all polygon meshes
    const meshes = Array.from(this.nodeMeshes.values()).map(n => n.mesh);
    const intersects = this.raycaster.intersectObjects(meshes, false);

    if (intersects.length > 0) {
      // If first hit is already selected, try to click through to next object
      let targetIntersect = intersects[0];
      const firstNodeData = targetIntersect.object.userData.nodeData;

      if (firstNodeData &&
          firstNodeData.id === this.selectedId &&
          firstNodeData.type === this.selectedType &&
          intersects.length > 1) {
        targetIntersect = intersects[1];
      }

      const nodeData = targetIntersect.object.userData.nodeData;
      if (nodeData) {
        this.selectNode(nodeData.id, nodeData.type);
        this.selectCallbacks.forEach(cb => cb(nodeData));
      }
    }
  }

  onDoubleClick(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const meshes = Array.from(this.nodeMeshes.values()).map(n => n.mesh);
    const intersects = this.raycaster.intersectObjects(meshes, false);

    if (intersects.length > 0) {
      const mesh = intersects[0].object;
      const nodeData = mesh.userData.nodeData;
      if (nodeData) {
        this.selectNode(nodeData.id, nodeData.type);
        this.zoomToNode(nodeData);
        this.toggleNode(nodeData);
      }
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  setData(tree) {
    this.tree = tree;
    this.clearNodes();
    this.nodeData.clear();
    this.expandedNodes.clear();
    this.selectedId = null;
    this.selectedType = null;

    if (tree) {
      this.buildNodeData(tree);
      this.expandedNodes.add(this._getKey(tree.id, tree.type));
      this.rebuildVisibleNodes();
      this.fitToView();
    }
  }

  _getKey(id, type) {
    return `${type}_${id}`;
  }

  clearNodes() {
    this.nodeMeshes.forEach(({ mesh, outline, label }) => {
      this.scene.remove(mesh);
      if (outline) this.scene.remove(outline);
      if (label) this.scene.remove(label);
    });
    this.nodeMeshes.clear();
  }

  // Apply quaternion rotation to a 3D point
  rotateByQuaternion(px, py, pz, qx, qy, qz, qw) {
    const ix = qw * px + qy * pz - qz * py;
    const iy = qw * py + qz * px - qx * pz;
    const iz = qw * pz + qx * py - qy * px;
    const iw = -qx * px - qy * py - qz * pz;

    return {
      x: ix * qw + iw * -qx + iy * -qz - iz * -qy,
      y: iy * qw + iw * -qy + iz * -qx - ix * -qz,
      z: iz * qw + iw * -qz + ix * -qy - iy * -qx
    };
  }

  multiplyQuaternions(q1, q2) {
    return {
      x: q1.w * q2.x + q1.x * q2.w + q1.y * q2.z - q1.z * q2.y,
      y: q1.w * q2.y - q1.x * q2.z + q1.y * q2.w + q1.z * q2.x,
      z: q1.w * q2.z + q1.x * q2.y - q1.y * q2.x + q1.z * q2.w,
      w: q1.w * q2.w - q1.x * q2.x - q1.y * q2.y - q1.z * q2.z
    };
  }

  buildNodeData(node, parentWorldPos = null, parentWorldRot = null) {
    const localPos = node.transform?.position || { x: 0, y: 0, z: 0 };
    const localRot = node.transform?.rotation || { x: 0, y: 0, z: 0, w: 1 };
    const bound = node.bound || { x: 0, y: 0, z: 0 };

    let worldPos, worldRot;

    if (parentWorldPos && parentWorldRot) {
      const rotatedPos = this.rotateByQuaternion(
        localPos.x, localPos.y, localPos.z,
        parentWorldRot.x, parentWorldRot.y, parentWorldRot.z, parentWorldRot.w
      );
      worldPos = {
        x: parentWorldPos.x + rotatedPos.x,
        y: parentWorldPos.y + rotatedPos.y,
        z: parentWorldPos.z + rotatedPos.z
      };
      worldRot = this.multiplyQuaternions(parentWorldRot, localRot);
    } else {
      worldPos = { x: localPos.x, y: localPos.y, z: localPos.z };
      worldRot = { x: localRot.x, y: localRot.y, z: localRot.z, w: localRot.w };
    }

    const key = this._getKey(node.id, node.type);
    this.nodeData.set(key, node);

    node._worldPos = worldPos;
    node._worldRot = worldRot;
    node._bound = bound;

    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        this.buildNodeData(child, worldPos, worldRot);
      });
    }
  }

  rebuildVisibleNodes() {
    this.clearNodes();
    if (!this.tree) return;

    this.addVisibleNode(this.tree);

    const addExpandedChildren = (node) => {
      const key = this._getKey(node.id, node.type);
      if (this.expandedNodes.has(key) && node.children) {
        node.children.forEach(child => {
          this.addVisibleNode(child);
          addExpandedChildren(child);
        });
      }
    };

    addExpandedChildren(this.tree);
    this.updateGridPosition();
  }

  updateGridPosition() {
    if (!this.gridHelper) return;

    const SCALE = 1 / 100000;
    let minY = Infinity;

    this.nodeMeshes.forEach(({ mesh }) => {
      const node = mesh.userData.nodeData;
      if (node && node._worldPos) {
        const posY = node._worldPos.y * SCALE;
        const halfY = ((node._bound?.y || node._bound?.x || 100000) / 2) * SCALE;
        const bottomY = posY - halfY;
        if (bottomY < minY) minY = bottomY;
      }
    });

    if (minY !== Infinity) {
      this.gridHelper.position.y = minY - 50;
    }
  }

  addVisibleNode(node) {
    // Check type filter
    if (!this.isTypeEnabled(node)) return;

    const worldPos = node._worldPos;
    const worldRot = node._worldRot;
    const bound = node._bound;

    // Skip nodes at origin (root containers)
    const radius = Math.sqrt(worldPos.x * worldPos.x + worldPos.y * worldPos.y + worldPos.z * worldPos.z);
    if (radius < 1000) return;

    const key = this._getKey(node.id, node.type);
    const isSelected = node.id === this.selectedId && node.type === this.selectedType;
    const hasChildren = node.hasChildren || (node.children && node.children.length > 0);
    const isExpanded = this.expandedNodes.has(key);

    // Create polygon on sphere
    const meshData = this.createBoundingPolygon(node, worldPos, worldRot, bound, isSelected, hasChildren, isExpanded);
    if (meshData) {
      this.nodeMeshes.set(key, meshData);
    }
  }

  createBoundingPolygon(node, worldPos, worldRot, bound, isSelected, hasChildren, isExpanded) {
    // Skip nodes at origin
    const nodeRadius = Math.sqrt(worldPos.x * worldPos.x + worldPos.y * worldPos.y + worldPos.z * worldPos.z);
    if (nodeRadius < 1000) return null;

    // Use raw positions - scale to fit in view
    const SCALE = 1 / 100000;

    const center = new THREE.Vector3(
      worldPos.x * SCALE,
      worldPos.y * SCALE,
      worldPos.z * SCALE
    );

    let halfX = (bound.x || 100000) / 2 * SCALE;
    let halfY = (bound.y || bound.x || 100000) / 2 * SCALE;
    let halfZ = (bound.z || bound.x || 100000) / 2 * SCALE;

    // Get color based on nodeType (set by server from bType), fallback to type
    const typeName = node.nodeType || node.type;
    const color = NODE_COLORS[typeName] || DEFAULT_COLOR;

    // Create a 3D box
    const boxGeometry = new THREE.BoxGeometry(halfX * 2, halfY * 2, halfZ * 2);
    const boxMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: isSelected ? 0.35 : 0.15,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    const mesh = new THREE.Mesh(boxGeometry, boxMaterial);

    // Apply rotation and position (normalize quaternion to prevent shearing)
    const rotQuat = new THREE.Quaternion(worldRot.x, worldRot.y, worldRot.z, worldRot.w);
    rotQuat.normalize();
    mesh.quaternion.copy(rotQuat);
    mesh.position.copy(center);
    mesh.userData.nodeData = node;
    this.scene.add(mesh);

    // Create wireframe edges - white when selected, otherwise node color
    const edgesGeometry = new THREE.EdgesGeometry(boxGeometry);
    const edgeColor = isSelected ? SELECTION_COLOR : color;
    const edgesMaterial = new THREE.LineBasicMaterial({
      color: edgeColor,
      transparent: true,
      opacity: isSelected ? 1.0 : 0.6
    });

    if (hasChildren && !isExpanded) {
      edgesMaterial.opacity = 0.4;
    }

    const outline = new THREE.LineSegments(edgesGeometry, edgesMaterial);
    outline.quaternion.copy(rotQuat);
    outline.position.copy(center);
    this.scene.add(outline);

    // Create text label sprite at centroid, scaled to fit within bounds
    // Use the two largest dimensions to ensure label is visible regardless of rotation
    const sortedHalves = [halfX, halfY, halfZ].sort((a, b) => b - a);
    const label = this.createLabel(node.name || '(unnamed)', sortedHalves[0], sortedHalves[1]);
    label.position.copy(center);
    this.scene.add(label);

    return { mesh, outline, label };
  }

  createLabel(text, boxHalfWidth, boxHalfHeight) {
    const fontSize = 64;
    const font = `bold ${fontSize}px Arial`;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = font;

    const metrics = context.measureText(text);
    const textWidth = metrics.width;
    const textHeight = fontSize;

    const padding = 20;
    canvas.width = textWidth + padding * 2;
    canvas.height = textHeight + padding * 2;

    context.font = font;
    context.fillStyle = 'white';
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    context.strokeStyle = 'black';
    context.lineWidth = 4;
    context.lineJoin = 'round';

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    context.strokeText(text, cx, cy);
    context.fillText(text, cx, cy);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;

    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      depthTest: true,
      depthWrite: false,
      sizeAttenuation: true
    });

    const sprite = new THREE.Sprite(spriteMaterial);

    // Scale label to fit within box bounds (with some padding)
    const labelAspect = canvas.width / canvas.height;
    const boxWidth = boxHalfWidth * 2 * 0.8;
    const boxHeight = boxHalfHeight * 2 * 0.5;

    // Fit to the smaller constraint
    let labelHeight;
    if (boxWidth / labelAspect < boxHeight) {
      labelHeight = boxWidth / labelAspect;
    } else {
      labelHeight = boxHeight;
    }

    sprite.scale.set(labelHeight * labelAspect, labelHeight, 1);
    sprite.center.set(0.5, 0.5);
    sprite.renderOrder = 1;

    return sprite;
  }

  selectNode(id, type) {
    this.selectedId = id;
    this.selectedType = type;
    this.rebuildVisibleNodes();
  }

  toggleNode(node) {
    const key = this._getKey(node.id, node.type);
    const wasExpanded = this.expandedNodes.has(key);

    if (wasExpanded) {
      this.expandedNodes.delete(key);
    } else {
      this.expandedNodes.add(key);
    }

    this.rebuildVisibleNodes();
    this.toggleCallbacks.forEach(cb => cb(node, !wasExpanded));
  }

  expandNode(node) {
    const key = this._getKey(node.id, node.type);
    if (!this.expandedNodes.has(key)) {
      this.expandedNodes.add(key);
      this.rebuildVisibleNodes();
    }
  }

  collapseNode(node) {
    const key = this._getKey(node.id, node.type);
    if (this.expandedNodes.has(key)) {
      this.expandedNodes.delete(key);
      this.rebuildVisibleNodes();
    }
  }

  addChildren(parentNode, children) {
    if (!children || children.length === 0) return;

    const parentKey = this._getKey(parentNode.id, parentNode.type);
    const parent = this.nodeData.get(parentKey);
    if (!parent) return;

    const parentWorldPos = parent._worldPos;
    const parentWorldRot = parent._worldRot;

    children.forEach(child => {
      this.buildNodeData(child, parentWorldPos, parentWorldRot);
    });

    if (!parent.children) {
      parent.children = [];
    }
    children.forEach(child => {
      if (!parent.children.find(c => c.id === child.id && c.type === child.type)) {
        parent.children.push(child);
      }
    });

    this.rebuildVisibleNodes();
  }

  zoomToNode(node) {
    if (!node) return;

    // Use passed node if it has _worldPos, otherwise look it up in our data
    let targetNode = node;
    if (!node._worldPos) {
      const key = this._getKey(node.id, node.type);
      targetNode = this.nodeData.get(key);
      if (!targetNode || !targetNode._worldPos) return;
    }

    const worldPos = targetNode._worldPos;
    const radius = Math.sqrt(worldPos.x * worldPos.x + worldPos.y * worldPos.y + worldPos.z * worldPos.z);
    if (radius < 1000) return;

    const SCALE = 1 / 100000;
    const targetPos = new THREE.Vector3(
      worldPos.x * SCALE,
      worldPos.y * SCALE,
      worldPos.z * SCALE
    );

    const bound = targetNode._bound || { x: 1, y: 1, z: 1 };
    // Minimum bound of 1m to prevent division by zero on 0-size nodes
    const MIN_BOUND = 1;
    const boxWidth = Math.max(bound.x || MIN_BOUND, MIN_BOUND) * SCALE;
    const boxHeight = Math.max(bound.y || MIN_BOUND, MIN_BOUND) * SCALE;
    const boxDepth = Math.max(bound.z || MIN_BOUND, MIN_BOUND) * SCALE;

    // Calculate distance to fit box in view at 80% fill
    const fovRad = this.camera.fov * Math.PI / 180;
    const aspect = this.camera.aspect;

    // Distance needed to fit height (vertical FOV)
    const distForHeight = (boxHeight / 0.8) / (2 * Math.tan(fovRad / 2));
    // Distance needed to fit width (horizontal FOV)
    const distForWidth = (boxWidth / 0.8) / (2 * Math.tan(fovRad / 2) * aspect);
    // Also consider depth
    const distForDepth = (boxDepth / 0.8) / (2 * Math.tan(fovRad / 2));

    // Use the largest distance so everything fits
    const cameraDistance = Math.max(distForHeight, distForWidth, distForDepth);

    // Position camera looking at target from outside
    const dir = targetPos.clone().normalize();
    if (dir.length() < 0.001) dir.set(0, 0, 1);
    const cameraPos = targetPos.clone().add(dir.multiplyScalar(cameraDistance));

    this.camera.position.copy(cameraPos);
    this.controls.target.copy(targetPos);
    this.controls.update();
  }

  onSelect(callback) {
    this.selectCallbacks.push(callback);
  }

  onToggle(callback) {
    this.toggleCallbacks.push(callback);
  }

  render() {
    // Called externally but Three.js handles rendering in animate loop
  }

  fitToView() {
    const SCALE = 1 / 100000;
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    let count = 0;

    // Calculate bounding box of all visible nodes
    this.nodeData.forEach(node => {
      if (node._worldPos) {
        const r = Math.sqrt(node._worldPos.x ** 2 + node._worldPos.y ** 2 + node._worldPos.z ** 2);
        if (r > 1000) {
          const px = node._worldPos.x * SCALE;
          const py = node._worldPos.y * SCALE;
          const pz = node._worldPos.z * SCALE;
          const bound = node._bound || { x: 100000, y: 100000, z: 100000 };
          const hx = (bound.x || 100000) / 2 * SCALE;
          const hy = (bound.y || bound.x || 100000) / 2 * SCALE;
          const hz = (bound.z || bound.x || 100000) / 2 * SCALE;

          minX = Math.min(minX, px - hx);
          minY = Math.min(minY, py - hy);
          minZ = Math.min(minZ, pz - hz);
          maxX = Math.max(maxX, px + hx);
          maxY = Math.max(maxY, py + hy);
          maxZ = Math.max(maxZ, pz + hz);
          count++;
        }
      }
    });

    if (count === 0) return;

    // Calculate centroid and size
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const cz = (minZ + maxZ) / 2;
    const sizeX = maxX - minX;
    const sizeY = maxY - minY;
    const sizeZ = maxZ - minZ;

    const centroid = new THREE.Vector3(cx, cy, cz);

    // Calculate distance to fit all nodes in view
    const fovRad = this.camera.fov * Math.PI / 180;
    const aspect = this.camera.aspect;

    const distForHeight = (sizeY / 2) / Math.tan(fovRad / 2);
    const distForWidth = (sizeX / 2) / (Math.tan(fovRad / 2) * aspect);
    const distForDepth = (sizeZ / 2) / Math.tan(fovRad / 2);

    const cameraDistance = Math.max(distForHeight, distForWidth, distForDepth, 10) * 1.2;

    // Position camera looking at centroid from outside
    const dir = centroid.clone().normalize();
    if (dir.length() < 0.001) dir.set(0, 0, 1);
    const cameraPos = centroid.clone().add(dir.multiplyScalar(cameraDistance));

    this.camera.position.copy(cameraPos);
    this.controls.target.copy(centroid);
    this.controls.update();
  }

  // Compatibility getter for tests
  get visibleNodes() {
    return this.nodeMeshes;
  }

  setTypeFilter(enabledTypes) {
    this.typeFilter = new Set(enabledTypes);
    this.rebuildVisibleNodes();
  }

  isTypeEnabled(node) {
    // Use nodeType (set by server from bType) or fallback to type
    const nodeType = node.nodeType || node.type;

    // Check against known type names
    if (this.typeFilter.has(nodeType)) return true;

    // Map RM types to display types (fallback for nodes without nodeType)
    if (nodeType === 'RMRoot' && this.typeFilter.has('Root')) return true;
    if (nodeType === 'RMTObject' && this.typeFilter.has('Territory')) return true;
    if (nodeType === 'RMCObject' && this.typeFilter.has('Land')) return true;
    if (nodeType === 'RMPObject' && this.typeFilter.has('Sector')) return true;
    return false;
  }
}
