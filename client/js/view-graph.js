import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createStarfield, createGroundGrid } from './scene-helpers.js';

const NODE_COLORS = {
  RMRoot: 0xffd700,
  RMCObject: 0x4a9eff,
  RMTObject: 0x50c878,
  RMPObject: 0xff8c42,

  // Terrestrial types
  Root: 0xffd700,
  Water: 0x2266cc,
  Land: 0x4a9eff,
  Country: 0x9370db,
  Territory: 0xff7f50,
  State: 0x20b2aa,
  County: 0x87ceeb,
  City: 0xf08080,
  Community: 0xdda0dd,
  Sector: 0x98fb98,
  Parcel: 0xffaa44,

  // Celestial types
  Universe: 0xe0e0ff,
  Supercluster: 0xb8b8ff,
  GalaxyCluster: 0x9090ff,
  Galaxy: 0x8080ff,
  BlackHole: 0x303030,
  Nebula: 0xff80ff,
  StarCluster: 0xffffaa,
  Constellation: 0xaaffff,
  StarSystem: 0xffdd44,
  Star: 0xffff00,
  PlanetSystem: 0x44aaff,
  Planet: 0x44ff88,
  Moon: 0xcccccc,
  Debris: 0x666666,
  Satellite: 0x88ff88,
  Transport: 0xff8800,
  Surface: 0x886644
};

const HIGHLIGHT_INTENSITY = 1.5;
const DEFAULT_NODE_RADIUS = 2;
const SELECTION_COLOR = 0xffffff;

// Texture loader (shared instance)
const textureLoader = new THREE.TextureLoader();

// Force Layout Parameters
const REPULSION = 600;
const SPRING_LENGTH = 50;
const SPRING_K = 0.02;
const DAMPING = 0.92;
const MAX_VELOCITY = 5;

export class ViewGraph {
  constructor(containerSelector) {
    this.container = document.querySelector(containerSelector);
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    
    // Graph Data
    this.graphNodes = [];
    this.graphLinks = [];
    this.nodeMeshes = new Map(); // id -> Mesh
    this.linkLines = null; // THREE.LineSegments
    
    // Interaction
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.selectCallbacks = [];
    this.toggleCallbacks = [];
    this.msfLoadCallbacks = [];
    this.selectedId = null;
    this.highlightMesh = null;

    this.init();
    this.animate();
  }

  _getKey(id, type) {
    return `${type}_${id}`;
  }

  _getTextureUrl(nodeData) {
    // Check for pResource.sReference texture URL (only image types)
    const ref = nodeData?.properties?.pResource?.sReference;
    if (ref && typeof ref === 'string') {
      const lower = ref.toLowerCase();
      if (lower.endsWith('.jpg') || lower.endsWith('.jpeg') ||
          lower.endsWith('.png') || lower.endsWith('.gif') ||
          lower.endsWith('.webp') || lower.endsWith('.bmp')) {
        return ref;
      }
    }
    return null;
  }

  _getMsfReference(nodeData) {
    // Check for pResource.sReference that points to an MSF file
    const ref = nodeData?.properties?.pResource?.sReference;
    if (ref && typeof ref === 'string' && (ref.endsWith('.msf') || ref.endsWith('.msf.json'))) {
      return ref;
    }
    return null;
  }

  _createNodeMaterial(nodeData, color) {
    const textureUrl = this._getTextureUrl(nodeData);

    if (textureUrl) {
      const material = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.5,
        metalness: 0.1
      });

      textureLoader.load(
        textureUrl,
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          material.map = texture;
          material.needsUpdate = true;
        },
        undefined,
        (err) => {
          console.warn(`Failed to load texture: ${textureUrl}`, err);
          material.color.setHex(color);
        }
      );

      return material;
    }

    return new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.3,
      metalness: 0.1
    });
  }

  init() {
    if (!this.container) {
      console.error('View3D: Container not found');
      return;
    }

    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x111111);
    // Fog for depth cue (low density to keep nodes visible from far away)
    this.scene.fog = new THREE.FogExp2(0x111111, 0.0005);

    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 600;

    // Camera
    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 10000);
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
    // Hemisphere light for nice gradient ambient
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    hemiLight.position.set(0, 200, 0);
    this.scene.add(hemiLight);

    // Main directional light (sun-like)
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(100, 200, 100);
    this.scene.add(dirLight);

    // Fill light attached to camera
    const pointLight = new THREE.PointLight(0xffffff, 0.5);
    this.camera.add(pointLight); 
    this.scene.add(this.camera);

    // Ground Grid and Starfield
    this.gridHelper = createGroundGrid(this.scene);
    this.starfield = createStarfield(this.scene);

    this.setupEventListeners();
  }

  setupEventListeners() {
    window.addEventListener('resize', () => this.onWindowResize());
    
    // Use pointerdown/up to distinguish clicks from drags
    let downX, downY;
    this.renderer.domElement.addEventListener('pointerdown', (e) => {
      downX = e.clientX;
      downY = e.clientY;
    });
    
    this.renderer.domElement.addEventListener('pointerup', (e) => {
      const dist = Math.sqrt(Math.pow(e.clientX - downX, 2) + Math.pow(e.clientY - downY, 2));
      if (dist < 5) { // Threshold for click vs drag
        this.onClick(e);
      }
    });

    this.renderer.domElement.addEventListener('dblclick', (e) => {
      this.onDoubleClick(e);
    });
  }

  onDoubleClick(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children);

    const nodeIntersect = intersects.find(hit => hit.object.userData && hit.object.userData.id !== undefined);

    if (nodeIntersect) {
      const { id, type } = nodeIntersect.object.userData;
      const node = this.graphNodes.find(n => n.id === id && n.type === type);
      if (node) {
        // Check for MSF reference - prompt to load instead of toggling
        const msfUrl = this._getMsfReference(node.data);
        if (msfUrl) {
          if (confirm(`Load map: ${msfUrl}?`)) {
            this.msfLoadCallbacks.forEach(cb => cb(msfUrl));
          }
        } else {
          this.toggleCallbacks.forEach(cb => cb(node.data));
        }
      }
    }
  }

  zoomToNode(node) {
    const mesh = this.nodeMeshes.get(this._getKey(node.id, node.type));
    if (!mesh) return;

    // Calculate camera offset direction (keep current viewing angle)
    const direction = this.camera.position.clone().sub(this.controls.target).normalize();
    const distance = 120;

    this.animateCamera(mesh, direction, distance);
  }

  animateCamera(targetMesh, direction, distance) {
    const startPos = this.camera.position.clone();
    const startLookAt = this.controls.target.clone();
    const duration = 1500;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = this.easeInOutQuart(progress);

      // Track mesh's current position
      const targetLookAt = targetMesh.position.clone();
      const targetCamPos = targetLookAt.clone().add(direction.clone().multiplyScalar(distance));

      this.camera.position.lerpVectors(startPos, targetCamPos, eased);
      this.controls.target.lerpVectors(startLookAt, targetLookAt, eased);
      this.controls.update();

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  easeInOutQuart(t) {
    return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
  }

  onWindowResize() {
    if (!this.container || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  setData(tree) {
    this.clearScene();
    if (!tree) return;

    // 1. Flatten tree to graph
    this.buildGraph(tree);

    // 2. Create meshes
    this.createVisuals();

    // 3. Initial camera fit (approximate)
    this.controls.reset();
  }

  buildGraph(tree) {
    this.graphNodes = [];
    this.graphLinks = [];

    const traverse = (node, parentIndex = -1) => {
      const nodeIndex = this.graphNodes.length;
      
      // Initialize physics state
      this.graphNodes.push({
        id: node.id,
        type: node.type,
        nodeType: node.nodeType,
        data: node,
        x: (Math.random() - 0.5) * 100,
        y: (Math.random() - 0.5) * 100,
        z: (Math.random() - 0.5) * 100,
        vx: 0, vy: 0, vz: 0
      });

      if (parentIndex !== -1) {
        this.graphLinks.push({
          source: parentIndex,
          target: nodeIndex
        });
      }

      if (node.children) {
        node.children.forEach(child => traverse(child, nodeIndex));
      }
    };

    traverse(tree);
    console.log(`Graph built: ${this.graphNodes.length} nodes, ${this.graphLinks.length} links`);
  }

  createVisuals() {
    const geometry = new THREE.SphereGeometry(DEFAULT_NODE_RADIUS, 16, 12);

    this.graphNodes.forEach((node, index) => {
      const color = NODE_COLORS[node.nodeType] || NODE_COLORS[node.type] || 0x888888;
      const material = this._createNodeMaterial(node.data, color);
      const mesh = new THREE.Mesh(geometry, material);
      
      mesh.userData = { 
        id: node.id,
        type: node.type,
        index: index,
        originalColor: color 
      };

      const label = this.createLabel(node.data);
      mesh.add(label);

      this.scene.add(mesh);
      this.nodeMeshes.set(this._getKey(node.id, node.type), mesh);
    });

    // Links geometry (dynamic)
        if (this.graphLinks.length > 0) {
          const lineGeometry = new THREE.BufferGeometry();
          const positions = new Float32Array(this.graphLinks.length * 2 * 3); // 2 points * 3 coords
          lineGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
          
          const lineMaterial = new THREE.LineBasicMaterial({
            color: 0x888888,
            transparent: true,
            opacity: 0.8
          });      
      this.linkLines = new THREE.LineSegments(lineGeometry, lineMaterial);
      this.linkLines.frustumCulled = false; // Always render, as bounds change
      this.scene.add(this.linkLines);
    }
  }

  addChildren(parentNode, children) {
    if (!children || children.length === 0) return;

    const parentKey = this._getKey(parentNode.id, parentNode.type);
    const parentIndex = this.graphNodes.findIndex(n => this._getKey(n.id, n.type) === parentKey);

    if (parentIndex === -1) {
      console.warn(`View3D: Parent node ${parentNode.name} not found in graph`);
      return;
    }

    const parentGraphNode = this.graphNodes[parentIndex];

    children.forEach((child) => {
      // Check for duplicates
      if (this.nodeMeshes.has(this._getKey(child.id, child.type))) return;

      const nodeIndex = this.graphNodes.length;

      // Initialize with position relative to parent to avoid explosions
      this.graphNodes.push({
        id: child.id,
        type: child.type,
        nodeType: child.nodeType,
        data: child,
        x: parentGraphNode.x + (Math.random() - 0.5) * 10,
        y: parentGraphNode.y + (Math.random() - 0.5) * 10,
        z: parentGraphNode.z + (Math.random() - 0.5) * 10,
        vx: 0, vy: 0, vz: 0
      });

      this.graphLinks.push({
        source: parentIndex,
        target: nodeIndex
      });

      // Create mesh
      const geometry = new THREE.SphereGeometry(DEFAULT_NODE_RADIUS, 16, 12);
      const color = NODE_COLORS[child.nodeType] || NODE_COLORS[child.type] || 0x888888;
      const material = this._createNodeMaterial(child, color);
      const mesh = new THREE.Mesh(geometry, material);
      
      mesh.userData = { 
        id: child.id,
        type: child.type,
        index: nodeIndex,
        originalColor: color 
      };

      const label = this.createLabel(child);
      mesh.add(label);

      // Set initial position
      mesh.position.set(
        this.graphNodes[nodeIndex].x,
        this.graphNodes[nodeIndex].y,
        this.graphNodes[nodeIndex].z
      );

      this.scene.add(mesh);
      this.nodeMeshes.set(this._getKey(child.id, child.type), mesh);
    });

    this.updateLinkLinesGeometry();
  }

  removeDescendants(parentNode) {
    const parentKey = this._getKey(parentNode.id, parentNode.type);
    const indicesToRemove = new Set();

    // Build adjacency list for fast lookup
    const childrenMap = new Map();
    this.graphLinks.forEach(link => {
       if (!childrenMap.has(link.source)) childrenMap.set(link.source, []);
       childrenMap.get(link.source).push(link.target);
    });

    const collect = (pIndex) => {
       const kids = childrenMap.get(pIndex);
       if (kids) {
          kids.forEach(kIndex => {
             if (!indicesToRemove.has(kIndex)) {
                indicesToRemove.add(kIndex);
                collect(kIndex);
             }
          });
       }
    };

    const parentIndex = this.graphNodes.findIndex(n => this._getKey(n.id, n.type) === parentKey);

    collect(parentIndex);

    if (indicesToRemove.size === 0) return;

    // 1. Remove Meshes
    indicesToRemove.forEach(index => {
        const node = this.graphNodes[index];
        const key = this._getKey(node.id, node.type);
        const mesh = this.nodeMeshes.get(key);
        if (mesh) {
            this.scene.remove(mesh);
            mesh.geometry.dispose();
            mesh.material.dispose();
            this.nodeMeshes.delete(key);
        }
    });

    // 2. Filter Nodes and create Index Map
    const newNodes = [];
    const indexMap = new Map(); // old -> new
    
    let newIndex = 0;
    for (let i = 0; i < this.graphNodes.length; i++) {
        if (!indicesToRemove.has(i)) {
            newNodes.push(this.graphNodes[i]);
            indexMap.set(i, newIndex);
            newIndex++;
        }
    }
    
    this.graphNodes = newNodes;

    // 3. Filter Links and remap
    const newLinks = [];
    this.graphLinks.forEach(link => {
        if (!indicesToRemove.has(link.source) && !indicesToRemove.has(link.target)) {
            newLinks.push({
                source: indexMap.get(link.source),
                target: indexMap.get(link.target)
            });
        }
    });
    
    this.graphLinks = newLinks;
    
    this.updateLinkLinesGeometry();
  }

  updateLinkLinesGeometry() {
    if (this.linkLines) {
      this.scene.remove(this.linkLines);
      this.linkLines.geometry.dispose();
      this.linkLines.material.dispose();
      this.linkLines = null;
    }

    if (this.graphLinks.length > 0) {
      const lineGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(this.graphLinks.length * 2 * 3);
      lineGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      
      const lineMaterial = new THREE.LineBasicMaterial({ 
        color: 0x888888, 
        transparent: true, 
        opacity: 0.8 
      });
      
      this.linkLines = new THREE.LineSegments(lineGeometry, lineMaterial);
      this.linkLines.frustumCulled = false;
      this.scene.add(this.linkLines);
    }
  }

  clearScene() {
    if (this.highlightMesh) {
      if (this.highlightMesh.parent) {
        this.highlightMesh.parent.remove(this.highlightMesh);
      }
      this.highlightMesh.geometry.dispose();
      this.highlightMesh.material.dispose();
      this.highlightMesh = null;
    }

    this.nodeMeshes.forEach(mesh => {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
    });
    this.nodeMeshes.clear();

    if (this.linkLines) {
      this.scene.remove(this.linkLines);
      this.linkLines.geometry.dispose();
      this.linkLines.material.dispose();
      this.linkLines = null;
    }
    
    this.selectedId = null;
  }

  updatePhysics() {
    if (this.graphNodes.length === 0) return;

    // Repulsion (simplified O(N^2) for now - optimize if slow)
    for (let i = 0; i < this.graphNodes.length; i++) {
      const n1 = this.graphNodes[i];
      for (let j = i + 1; j < this.graphNodes.length; j++) {
        const n2 = this.graphNodes[j];
        
        const dx = n1.x - n2.x;
        const dy = n1.y - n2.y;
        const dz = n1.z - n2.z;
        const distSq = dx*dx + dy*dy + dz*dz + 0.1; // Avoid div/0
        const dist = Math.sqrt(distSq);
        
        // F = k / d^2
        const force = REPULSION / distSq;
        
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        const fz = (dz / dist) * force;

        n1.vx += fx; n1.vy += fy; n1.vz += fz;
        n2.vx -= fx; n2.vy -= fy; n2.vz -= fz;
      }
    }

    // Spring forces (Links) + hierarchical Y constraint
    for (const link of this.graphLinks) {
      const parent = this.graphNodes[link.source];
      const child = this.graphNodes[link.target];

      const dx = child.x - parent.x;
      const dy = child.y - parent.y;
      const dz = child.z - parent.z;
      const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);

      // Spring force
      const force = (dist - SPRING_LENGTH) * SPRING_K;

      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      const fz = (dz / dist) * force;

      parent.vx += fx; parent.vy += fy; parent.vz += fz;
      child.vx -= fx; child.vy -= fy; child.vz -= fz;

      // Hierarchical force: push child below parent (soft constraint)
      const minGap = 30;
      const yDiff = parent.y - child.y;
      if (yDiff < minGap) {
        const correction = (minGap - yDiff) * 0.02;
        child.vy -= correction;
        parent.vy += correction * 0.2;
      }
    }

    // Center gravity (pull to 0,0,0)
    for (const n of this.graphNodes) {
      n.vx -= n.x * 0.005;
      n.vy -= n.y * 0.005;
      n.vz -= n.z * 0.005;
    }

    // Integrate
    for (const n of this.graphNodes) {
      // Limit velocity
      const vSq = n.vx*n.vx + n.vy*n.vy + n.vz*n.vz;
      if (vSq > MAX_VELOCITY * MAX_VELOCITY) {
        const scale = MAX_VELOCITY / Math.sqrt(vSq);
        n.vx *= scale; n.vy *= scale; n.vz *= scale;
      }

      n.x += n.vx;
      n.y += n.vy;
      n.z += n.vz;

      n.vx *= DAMPING;
      n.vy *= DAMPING;
      n.vz *= DAMPING;
    }
  }

  updateVisuals() {
    if (this.graphNodes.length === 0) return;

    let minY = Infinity;

    // Update node positions
    this.graphNodes.forEach(node => {
      const mesh = this.nodeMeshes.get(this._getKey(node.id, node.type));
      if (mesh) {
        mesh.position.set(node.x, node.y, node.z);
        if (node.y < minY) minY = node.y;
      }
    });

    // Update grid position to be below the lowest node
    if (this.gridHelper && minY !== Infinity) {
      // Smoothly follow the bottom (with some padding)
      const targetY = minY - 50;
      this.gridHelper.position.y += (targetY - this.gridHelper.position.y) * 0.1;
    }

    // Update link lines
    if (this.linkLines && this.graphLinks.length > 0) {
      const positions = this.linkLines.geometry.attributes.position.array;
      let ptr = 0;
      for (const link of this.graphLinks) {
        const n1 = this.graphNodes[link.source];
        const n2 = this.graphNodes[link.target];
        
        positions[ptr++] = n1.x;
        positions[ptr++] = n1.y;
        positions[ptr++] = n1.z;
        
        positions[ptr++] = n2.x;
        positions[ptr++] = n2.y;
        positions[ptr++] = n2.z;
      }
      this.linkLines.geometry.attributes.position.needsUpdate = true;
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    this.updatePhysics();
    this.updateVisuals();
    this.controls.update();
    this.starfield.position.copy(this.camera.position);
    this.renderer.render(this.scene, this.camera);
  }

  onClick(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children);

    // Filter to only node meshes
    const nodeIntersect = intersects.find(hit => hit.object.userData && hit.object.userData.id !== undefined);

    if (nodeIntersect) {
      const { id, type } = nodeIntersect.object.userData;
      this.selectNode({ id, type });
      
      const node = this.graphNodes.find(n => n.id === id && n.type === type);
      if (node) {
        this.selectCallbacks.forEach(cb => cb(node.data));
      }
    } else {
      // Deselect if clicked background? 
      // Optional, maybe keep selection
    }
  }

  selectNode(node) {
    const key = this._getKey(node.id, node.type);
    
    // Remove previous highlight
    if (this.highlightMesh) {
      if (this.highlightMesh.parent) {
        this.highlightMesh.parent.remove(this.highlightMesh);
      }
      this.highlightMesh.geometry.dispose();
      this.highlightMesh.material.dispose();
      this.highlightMesh = null;
    }

    this.selectedId = key;

    // Highlight new
    const mesh = this.nodeMeshes.get(key);
    if (mesh) {
      // Create a slightly larger wireframe sphere
      const geometry = new THREE.SphereGeometry(DEFAULT_NODE_RADIUS * 1.2, 16, 12);
      const material = new THREE.MeshBasicMaterial({ 
        color: SELECTION_COLOR,
        wireframe: true,
        transparent: true,
        opacity: 0.5
      });
      
      this.highlightMesh = new THREE.Mesh(geometry, material);
      mesh.add(this.highlightMesh);
    }
  }

  onSelect(callback) {
    this.selectCallbacks.push(callback);
  }

  onToggle(callback) {
    this.toggleCallbacks.push(callback);
  }

  onMsfLoad(callback) {
    this.msfLoadCallbacks.push(callback);
  }

  createLabel(node) {
    const text = node.name || node.type || 'Unknown';

    // High-resolution for sharp text
    const fontSize = 64; 
    const font = `bold ${fontSize}px Arial`;
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = font;
    
    // Measure text
    const metrics = context.measureText(text);
    const textWidth = metrics.width;
    const textHeight = fontSize; // Basic height approximation
    
    // Canvas size with padding
    const padding = 20;
    canvas.width = textWidth + padding * 2;
    canvas.height = textHeight + padding * 2;
    
    // Draw
    context.font = font;
    context.fillStyle = 'white';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    // Shadow/Outline
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
    texture.generateMipmaps = false; // Mipmaps can cause blur on sprites sometimes
    
    const spriteMaterial = new THREE.SpriteMaterial({ 
        map: texture, 
        depthTest: true, 
        depthWrite: false,
        sizeAttenuation: true 
    });
    
    const sprite = new THREE.Sprite(spriteMaterial);
    
    // Fixed world height for the label (e.g., 3 units high)
    const labelWorldHeight = 3; 
    const aspectRatio = canvas.width / canvas.height;
    
    sprite.scale.set(labelWorldHeight * aspectRatio, labelWorldHeight, 1);
    sprite.center.set(0.5, 0); 
    sprite.position.y = DEFAULT_NODE_RADIUS + 0.5;
    sprite.renderOrder = 1;
    
    return sprite;
  }
}