/**
 * Copyright (c) 2026 Patched Reality, Inc.
 *
 *
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createStarfield, createInfiniteGrid, updateGridSpacing, createLabelSprite } from './scene-helpers.js';
import { NODE_COLORS } from '../shared/node-types.js';

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
const SETTLE_THRESHOLD = 0.01;
const REPULSION_CUTOFF_SQ = 500 * 500;

export class ViewGraph {
  constructor(containerSelector, stateManager, model) {
    this.container = document.querySelector(containerSelector);
    this.stateManager = stateManager;
    this.model = model;
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
    this.msfLoadCallbacks = [];
    this.highlightMesh = null;

    this.animationFrameId = null;
    this.cameraAnimationId = null;
    this.disposed = false;
    this.initialized = false;
    this.settled = false;

    this._bindModelEvents();
    this.init();
    if (this.initialized) {
      this.animate();
    }
  }

  _bindModelEvents() {
    this.model.on('selectionChanged', (node) => {
      if (node) {
        this.selectNode(node);
      }
    });

    this.model.on('treeChanged', (tree) => {
      this.setData(tree);
    });

    this.model.on('expansionChanged', (node, expanded) => {
      if (expanded) {
        if (node.children) {
          this.addChildren(node, node.children);
        }
      } else {
        this.removeDescendants(node);
      }
    });

    this.model.on('dataChanged', () => this.syncGraph());
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

  async _getMsfReference(nodeData) {
    const { getMsfReference } = await import('./node-helpers.js');
    return getMsfReference(nodeData);
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
      console.error('ViewGraph: Container not found');
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

    // Lights (store for disposal)
    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    this.hemiLight.position.set(0, 200, 0);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    this.dirLight.position.set(100, 200, 100);
    this.scene.add(this.dirLight);

    this.cameraLight = new THREE.PointLight(0xffffff, 0.5);
    this.camera.add(this.cameraLight);
    this.scene.add(this.camera);

    // Shared geometry for nodes (disposed once in dispose())
    this.nodeGeometry = new THREE.SphereGeometry(DEFAULT_NODE_RADIUS, 16, 12);

    // Infinite Grid and Starfield
    this.gridHelper = createInfiniteGrid(this.scene);
    this.starfield = createStarfield(this.scene);

    this.setupEventListeners();
    this.initialized = true;
  }

  setupEventListeners() {
    // Store bound handlers for cleanup
    this.boundResizeHandler = () => this.onWindowResize();
    this.boundDblClickHandler = (e) => this.onDoubleClick(e);

    // Track pointer position for click vs drag detection
    let downX, downY;
    this.boundPointerDownHandler = (e) => {
      downX = e.clientX;
      downY = e.clientY;
    };
    this.boundPointerUpHandler = (e) => {
      const dist = Math.sqrt(Math.pow(e.clientX - downX, 2) + Math.pow(e.clientY - downY, 2));
      if (dist < 5) {
        this.onClick(e);
      }
    };

    window.addEventListener('resize', this.boundResizeHandler);
    this.renderer.domElement.addEventListener('pointerdown', this.boundPointerDownHandler);
    this.renderer.domElement.addEventListener('pointerup', this.boundPointerUpHandler);
    this.renderer.domElement.addEventListener('dblclick', this.boundDblClickHandler);
  }

  async onDoubleClick(event) {
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
        const msfUrl = await this._getMsfReference(node.data);
        if (msfUrl) {
          if (confirm(`Load map: ${msfUrl}?`)) {
            this.msfLoadCallbacks.forEach(cb => cb(msfUrl));
          }
        } else {
          if (this.model.isNodeExpanded(node.data)) {
            this.model.collapseNode(node.data);
          } else {
            this.model.expandNode(node.data);
          }
          this.model.selectNode(node.data);
        }
      }
    }
  }

  zoomToNode(node) {
    const mesh = this.nodeMeshes.get(this.model.nodeKey(node));
    if (!mesh) return;

    // Calculate camera offset direction (keep current viewing angle)
    const direction = this.camera.position.clone().sub(this.controls.target).normalize();
    const distance = 120;

    this.animateCamera(mesh, direction, distance);
  }

  animateCamera(targetMesh, direction, distance) {
    // Cancel any existing camera animation
    if (this.cameraAnimationId) {
      cancelAnimationFrame(this.cameraAnimationId);
      this.cameraAnimationId = null;
    }

    const startPos = this.camera.position.clone();
    const startLookAt = this.controls.target.clone();
    const duration = 1500;
    const startTime = performance.now();

    const animate = (currentTime) => {
      if (this.disposed) return;

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
        this.cameraAnimationId = requestAnimationFrame(animate);
      } else {
        this.cameraAnimationId = null;
      }
    };

    this.cameraAnimationId = requestAnimationFrame(animate);
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

    this.buildGraph(tree);
    this.createVisuals();
    this.wakePhysics();
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
  }

  _createNodeMesh(node, index) {
    const color = NODE_COLORS[node.nodeType] || NODE_COLORS[node.type] || 0x888888;
    const material = this._createNodeMaterial(node.data, color);
    const mesh = new THREE.Mesh(this.nodeGeometry, material);
    mesh.userData = { id: node.id, type: node.type, index, originalColor: color };
    const label = this.createLabel(node.data);
    mesh.add(label);
    mesh.position.set(node.x, node.y, node.z);
    this.scene.add(mesh);
    this.nodeMeshes.set(this.model.nodeKey(node), mesh);
    return mesh;
  }

  _updateNodeLabel(mesh, node) {
    const newName = node.name || node.type || 'Unknown';
    const currentLabel = mesh.children.find(c => c.userData?.text);
    if (currentLabel && currentLabel.userData.text !== newName) {
      mesh.remove(currentLabel);
      if (currentLabel.material?.map) currentLabel.material.map.dispose();
      if (currentLabel.material) currentLabel.material.dispose();
      mesh.add(this.createLabel(node));
    }
  }

  createVisuals() {
    this.graphNodes.forEach((node, index) => {
      this._createNodeMesh(node, index);
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

    const parentKey = this.model.nodeKey(parentNode);
    const parentIndex = this.graphNodes.findIndex(n => this.model.nodeKey(n) === parentKey);

    if (parentIndex === -1) {
      console.warn(`View3D: Parent node ${parentNode.name} not found in graph`);
      return;
    }

    const parentGraphNode = this.graphNodes[parentIndex];

    children.forEach((child) => {
      const childKey = this.model.nodeKey(child);
      if (this.nodeMeshes.has(childKey)) {
        const existing = this.graphNodes.find(n => n.id === child.id && n.type === child.type);
        if (existing) existing.data = child;
        return;
      }

      const nodeIndex = this.graphNodes.length;
      const graphNode = {
        id: child.id, type: child.type, nodeType: child.nodeType, data: child,
        x: parentGraphNode.x + (Math.random() - 0.5) * 10,
        y: parentGraphNode.y + (Math.random() - 0.5) * 10,
        z: parentGraphNode.z + (Math.random() - 0.5) * 10,
        vx: 0, vy: 0, vz: 0
      };
      this.graphNodes.push(graphNode);
      this.graphLinks.push({ source: parentIndex, target: nodeIndex });
      this._createNodeMesh(graphNode, nodeIndex);
    });

    this.updateLinkLinesGeometry();
    this.wakePhysics();
  }

  removeDescendants(parentNode) {
    const parentKey = this.model.nodeKey(parentNode);
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

    const parentIndex = this.graphNodes.findIndex(n => this.model.nodeKey(n) === parentKey);

    collect(parentIndex);

    if (indicesToRemove.size === 0) return;

    // 1. Remove Meshes
    indicesToRemove.forEach(index => {
        const node = this.graphNodes[index];
        const key = this.model.nodeKey(node);
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

  syncGraph() {
    if (!this.model.tree) return;

    // Collect expected node keys by walking the model tree respecting expansion
    const expectedKeys = new Set();
    const walkTree = (node) => {
      expectedKeys.add(this.model.nodeKey(node));
      if (this.model.isNodeExpanded(node) && node.children) {
        for (const child of node.children) {
          walkTree(child);
        }
      }
    };
    walkTree(this.model.tree);

    // Remove graph nodes not in expected set
    const keysToRemove = new Set();
    for (let i = 0; i < this.graphNodes.length; i++) {
      const key = this.model.nodeKey(this.graphNodes[i]);
      if (!expectedKeys.has(key)) {
        keysToRemove.add(key);
        const mesh = this.nodeMeshes.get(key);
        if (mesh) {
          this.scene.remove(mesh);
          mesh.material.dispose();
          this.nodeMeshes.delete(key);
        }
      }
    }

    if (keysToRemove.size > 0) {
      this.graphNodes = this.graphNodes.filter(n => !keysToRemove.has(this.model.nodeKey(n)));
    }

    // Build set of existing keys for quick lookup
    const existingKeys = new Set(this.graphNodes.map(n => this.model.nodeKey(n)));

    // Add new nodes and update existing ones
    const reconcile = (node, parentGraphNode) => {
      const key = this.model.nodeKey(node);
      let graphNode;

      if (!existingKeys.has(key)) {
        const px = parentGraphNode ? parentGraphNode.x + (Math.random() - 0.5) * 10 : (Math.random() - 0.5) * 100;
        const py = parentGraphNode ? parentGraphNode.y + (Math.random() - 0.5) * 10 : (Math.random() - 0.5) * 100;
        const pz = parentGraphNode ? parentGraphNode.z + (Math.random() - 0.5) * 10 : (Math.random() - 0.5) * 100;

        graphNode = {
          id: node.id, type: node.type, nodeType: node.nodeType, data: node,
          x: px, y: py, z: pz, vx: 0, vy: 0, vz: 0
        };
        this.graphNodes.push(graphNode);
        existingKeys.add(key);
        this._createNodeMesh(graphNode, this.graphNodes.length - 1);
      } else {
        graphNode = this.graphNodes.find(n => this.model.nodeKey(n) === key);
        graphNode.data = node;
        const mesh = this.nodeMeshes.get(key);
        if (mesh) this._updateNodeLabel(mesh, node);
      }

      if (this.model.isNodeExpanded(node) && node.children) {
        for (const child of node.children) {
          reconcile(child, graphNode);
        }
      }
    };
    reconcile(this.model.tree, null);

    // Rebuild links from parent-child relationships
    const keyToIndex = new Map();
    this.graphNodes.forEach((n, i) => keyToIndex.set(this.model.nodeKey(n), i));

    this.graphLinks = [];
    const buildLinks = (node) => {
      const parentKey = this.model.nodeKey(node);
      const parentIndex = keyToIndex.get(parentKey);
      if (this.model.isNodeExpanded(node) && node.children) {
        for (const child of node.children) {
          const childKey = this.model.nodeKey(child);
          const childIndex = keyToIndex.get(childKey);
          if (parentIndex !== undefined && childIndex !== undefined) {
            this.graphLinks.push({ source: parentIndex, target: childIndex });
          }
          buildLinks(child);
        }
      }
    };
    buildLinks(this.model.tree);

    this.updateLinkLinesGeometry();
    this.wakePhysics();
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
    if (!this.initialized) return;

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
      // Don't dispose geometry - it's shared (this.nodeGeometry)
      // Dispose material and any label sprites
      mesh.material.dispose();
      mesh.children.forEach(child => {
        if (child.material?.map) child.material.map.dispose();
        if (child.material) child.material.dispose();
      });
    });
    this.nodeMeshes.clear();

    if (this.linkLines) {
      this.scene.remove(this.linkLines);
      this.linkLines.geometry.dispose();
      this.linkLines.material.dispose();
      this.linkLines = null;
    }

    this.graphNodes = [];
    this.graphLinks = [];
  }

  wakePhysics() {
    this.settled = false;
  }

  updatePhysics() {
    if (this.graphNodes.length === 0 || this.settled) return;

    // Repulsion with distance cutoff
    for (let i = 0; i < this.graphNodes.length; i++) {
      const n1 = this.graphNodes[i];
      for (let j = i + 1; j < this.graphNodes.length; j++) {
        const n2 = this.graphNodes[j];

        const dx = n1.x - n2.x;
        const dy = n1.y - n2.y;
        const dz = n1.z - n2.z;
        const distSq = dx*dx + dy*dy + dz*dz + 0.1;

        if (distSq > REPULSION_CUTOFF_SQ) continue;

        const dist = Math.sqrt(distSq);
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

    // Integrate and check for settling
    let maxVSq = 0;
    for (const n of this.graphNodes) {
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

      const newVSq = n.vx*n.vx + n.vy*n.vy + n.vz*n.vz;
      if (newVSq > maxVSq) maxVSq = newVSq;
    }

    if (maxVSq < SETTLE_THRESHOLD * SETTLE_THRESHOLD) {
      this.settled = true;
    }
  }

  updateVisuals() {
    if (this.graphNodes.length === 0) return;

    let minY = Infinity;
    let maxXZ = 0;

    // Update node positions
    this.graphNodes.forEach(node => {
      const mesh = this.nodeMeshes.get(this.model.nodeKey(node));
      if (mesh) {
        mesh.position.set(node.x, node.y, node.z);
        if (node.y < minY) minY = node.y;
        const distXZ = Math.sqrt(node.x * node.x + node.z * node.z);
        if (distXZ > maxXZ) maxXZ = distXZ;
      }
    });

    // Update grid position to be below the lowest node
    if (this.gridHelper && minY !== Infinity) {
      // Smoothly follow the bottom (with some padding)
      const targetY = minY - 50;
      this.gridHelper.position.y += (targetY - this.gridHelper.position.y) * 0.1;

      // Update fade distance based on furthest node
      updateGridSpacing(this.gridHelper, { fadeDistance: Math.max(100, maxXZ) });
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
    if (this.disposed) return;

    this.animationFrameId = requestAnimationFrame(() => this.animate());

    if (!this.container.offsetHeight) return;

    this.updatePhysics();
    if (!this.settled) {
      this.updateVisuals();
    }
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
      const node = this.graphNodes.find(n => n.id === id && n.type === type);
      if (node) {
        this.model.selectNode(node.data);
      }
    }
  }

  selectNode(node) {
    const key = this.model.nodeKey(node);

    // Remove previous highlight
    if (this.highlightMesh) {
      if (this.highlightMesh.parent) {
        this.highlightMesh.parent.remove(this.highlightMesh);
      }
      this.highlightMesh.geometry.dispose();
      this.highlightMesh.material.dispose();
      this.highlightMesh = null;
    }

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

  onMsfLoad(callback) {
    this.msfLoadCallbacks.push(callback);
  }

  createLabel(node) {
    const text = node.name || node.type || 'Unknown';
    const { sprite, aspect } = createLabelSprite(text);

    const labelWorldHeight = 3;
    sprite.scale.set(labelWorldHeight * aspect, labelWorldHeight, 1);
    sprite.center.set(0.5, 0);
    sprite.position.y = DEFAULT_NODE_RADIUS + 0.5;
    sprite.userData.text = text;

    return sprite;
  }

  dispose() {
    this.disposed = true;

    // Stop animation loops
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.cameraAnimationId) {
      cancelAnimationFrame(this.cameraAnimationId);
      this.cameraAnimationId = null;
    }

    // Remove event listeners
    window.removeEventListener('resize', this.boundResizeHandler);
    if (this.renderer?.domElement) {
      this.renderer.domElement.removeEventListener('pointerdown', this.boundPointerDownHandler);
      this.renderer.domElement.removeEventListener('pointerup', this.boundPointerUpHandler);
      this.renderer.domElement.removeEventListener('dblclick', this.boundDblClickHandler);
    }

    // Clear scene content
    this.clearScene();

    // Dispose shared geometry
    if (this.nodeGeometry) {
      this.nodeGeometry.dispose();
    }

    // Dispose scene helpers
    if (this.starfield) {
      this.starfield.geometry?.dispose();
      this.starfield.material?.dispose();
    }
    if (this.gridHelper) {
      this.gridHelper.geometry?.dispose();
      this.gridHelper.material?.dispose();
    }

    // Dispose lights
    if (this.hemiLight) this.hemiLight.dispose();
    if (this.dirLight) this.dirLight.dispose();
    if (this.cameraLight) this.cameraLight.dispose();

    // Dispose controls and renderer
    if (this.controls) this.controls.dispose();
    if (this.renderer) this.renderer.dispose();
  }
}