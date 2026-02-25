/**
 * Copyright (c) 2026 Patched Reality, Inc.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createStarfield, createInfiniteGrid, calculateGridSpacing, updateGridSpacing, createLabelSprite } from './scene-helpers.js';
import { getOrbitData, calculateOrbitalPosition, createOrbitPathGeometry, getSpinData, calculateSpinAngle } from './orbital-helpers.js';
import { rotateByQuaternion } from '../lib/ManifolderClient/node-helpers.js';
import {
  NODE_TYPES,
  NODE_COLORS,
  CELESTIAL_NAMES,
  TERRESTRIAL_NAMES,
  PHYSICAL_NAMES
} from '../shared/node-types.js';
import { resolveResourceUrl } from '../lib/ManifolderClient/node-helpers.js';
import { NodeAdapter } from './node-adapter.js';

// Re-export NODE_TYPES for consumers
export { NODE_TYPES };

// Texture loader for celestial body surfaces
const textureLoader = new THREE.TextureLoader();

const DEFAULT_COLOR = 0x888888;
const SELECTION_COLOR = 0xffffff;

const CELESTIAL_TYPES = CELESTIAL_NAMES;

// Scale factors for logarithmic rendering (tunable)
const LOG_SCALE_FACTOR = 50;   // Controls visual distance compression
const FOCUS_VISUAL_SIZE = 100; // Visual size of focus node in scene units
const GLOBE_RADIUS = 100;
const POLYGON_OFFSET = 0.5; // Slight offset above sphere surface

/**
 * Find surface texture URL and spin data for a celestial node
 * Checks the node itself first, then looks for a Surface child
 * @param {Object} node - The celestial node (Planet, Star, Moon, etc.)
 * @returns {Object|null} { url, rotation, spinData } or null if no texture found
 */
function getSurfaceTexture(node) {
  // Helper to check if a string is an image URL
  const isImageUrl = (ref) => {
    if (!ref || typeof ref !== 'string') return false;
    const lower = ref.toLowerCase();
    return lower.endsWith('.jpg') || lower.endsWith('.jpeg') ||
           lower.endsWith('.png') || lower.endsWith('.gif') ||
           lower.endsWith('.webp') || lower.endsWith('.bmp');
  };

  const resolveTextureUrl = (ref, scopeNode = null) => {
    const scopeId = scopeNode?.fabricScopeId || node?.fabricScopeId || null;
    const scopeBaseUrl = NodeAdapter.getScopeResourceRoot(scopeId);
    return resolveResourceUrl(ref, scopeBaseUrl) || ref;
  };

  // Check the node itself first
  const nodeRef = node.properties?.pResource?.sReference;
  if (isImageUrl(nodeRef)) {
    return {
      url: resolveTextureUrl(nodeRef, node),
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      spinData: getSpinData(node)
    };
  }

  // Then check Surface children
  if (node.children) {
    for (const child of node.children) {
      if (child.nodeType === 'Surface') {
        const ref = child.properties?.pResource?.sReference;
        if (isImageUrl(ref)) {
          return {
            url: resolveTextureUrl(ref, child),
            rotation: child.transform?.rotation || { x: 0, y: 0, z: 0, w: 1 },
            spinData: getSpinData(child)
          };
        }
      }
    }
  }

  return null;
}

export class ViewBounds {
  constructor(containerSelector, stateManager, model) {
    this.container = document.querySelector(containerSelector);
    this.stateManager = stateManager;
    this.model = model;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.globe = null;

    this.nodeMeshes = new Map();
    this.orbitPaths = new Map();
    this.focusNode = null;

    this.msfLoadCallbacks = [];

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.scale = 1;
    this.scaleCalculated = false;

    this.typeFilter = new Set(NODE_TYPES.filter(t => t.name !== 'Root').map(t => t.name));

    this.orbitsVisible = true;

    this.simulationTime = 0;
    this.timeScale = 86400;
    this.lastFrameTime = null;

    this.animationFrameId = null;
    this.disposed = false;
    this.initialized = false;

    this._bindModelEvents();
    this.init();
    this.restoreState();
    if (this.initialized) {
      this.animate();
    }
  }

  _bindModelEvents() {
    this.model.on('selectionChanged', (node) => {
      if (node) {
        this.selectNode(node);
        this._pendingZoomNode = node;
        this.zoomToNode(node);
      }
    });

    this.model.on('treeChanged', (tree) => {
      this.setData(tree);
    });

    this.model.on('expansionChanged', (node, expanded) => {
      if (expanded) {
        this.expandNode(node);
      } else {
        this.collapseNode(node);
      }
    });

    this.model.on('dataChanged', () => this._scheduleRebuild());

    this.model.on('nodeUpdated', (node) => {
      const selected = this.model.getSelectedNode();
      if (selected && node === selected && node.worldPos) {
        this.selectNode(node);
      }
    });
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

    // Camera - extended far plane for large celestial scales
    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.01, 1000000);
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
    this.controls.minDistance = 0.1;
    this.controls.maxDistance = 500000;

    // Lights (store for disposal)
    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    this.hemiLight.position.set(0, 200, 0);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    this.dirLight.position.set(100, 200, 100);
    this.scene.add(this.dirLight);

    // Camera-attached fill light
    this.cameraLight = new THREE.PointLight(0xffffff, 0.5);
    this.camera.add(this.cameraLight);
    this.scene.add(this.camera);

    // Infinite Grid and Starfield
    this.gridHelper = createInfiniteGrid(this.scene);
    this.starfield = createStarfield(this.scene);

    this.setupEventListeners();
    this.initialized = true;
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
    // Store bound handlers for cleanup
    this.boundResizeHandler = () => this.onWindowResize();
    let downX, downY;
    this.boundPointerDownHandler = (e) => {
      downX = e.clientX;
      downY = e.clientY;
    };
    this.boundPointerUpHandler = (e) => {
      const dist = Math.sqrt((e.clientX - downX) ** 2 + (e.clientY - downY) ** 2);
      if (dist >= 5) return;
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
    };

    window.addEventListener('resize', this.boundResizeHandler);
    this.clickTimeout = null;
    this.renderer.domElement.addEventListener('pointerdown', this.boundPointerDownHandler);
    this.renderer.domElement.addEventListener('pointerup', this.boundPointerUpHandler);

    // ResizeObserver for container size changes
    this.resizeObserver = new ResizeObserver(() => this.onWindowResize());
    this.resizeObserver.observe(this.container);

    // Timescale slider for orbital animation
    this.setupTimescaleSlider();
  }

  setupTimescaleSlider() {
    const slider = document.getElementById('timescale-slider');
    const label = document.getElementById('timescale-label');
    if (!slider || !label) return;

    const timeLabels = ['Paused', '1 sec/sec', '1 min/sec', '1 hr/sec', '1 day/sec', '1 wk/sec', '1 mo/sec', '1 yr/sec'];
    const timeScales = [0, 1, 60, 3600, 86400, 604800, 2592000, 31536000];

    const clampIndex = (value) => Math.max(0, Math.min(timeLabels.length - 1, Math.round(value)));

    const updateLabel = (value) => {
      label.textContent = timeLabels[clampIndex(value)];
    };

    const sliderToTimeScale = (value) => {
      if (value < 0.5) return 0;
      return timeScales[clampIndex(value)];
    };

    slider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      this.timeScale = sliderToTimeScale(value);
      updateLabel(value);
      this.saveState();
    });

    // Initialize from slider's default value
    const initialValue = parseFloat(slider.value);
    this.timeScale = sliderToTimeScale(initialValue);
    updateLabel(initialValue);
  }

  setOrbitsVisible(visible) {
    this.orbitsVisible = visible;
    this.orbitPaths.forEach(orbitLine => {
      orbitLine.visible = visible;
    });
    this.saveState();
  }

  onWindowResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (width === 0 || height === 0) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  _raycastNodes(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const meshes = Array.from(this.nodeMeshes.values()).map(n => n.mesh);
    const intersects = this.raycaster.intersectObjects(meshes, false);

    // Deduplicate - keep only nearest hit per node (ray hits front and back faces)
    const seen = new Set();
    return intersects.filter(i => {
      const nd = i.object.userData.nodeData;
      if (!nd) return false;
      const key = this.model.nodeKey(nd);
      if (!key) return false;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  _findSelectedIndex(uniqueIntersects) {
    const selected = this.model.getSelectedNode();
    if (!selected) return -1;
    const selectedKey = this.model.nodeKey(selected);
    return uniqueIntersects.findIndex(i => {
      const nd = i.object.userData.nodeData;
      return nd && this.model.nodeKey(nd) === selectedKey;
    });
  }

  onClick(event) {
    const uniqueIntersects = this._raycastNodes(event);
    if (uniqueIntersects.length === 0) return;

    let targetIndex = 0;
    const currentIndex = this._findSelectedIndex(uniqueIntersects);

    if (currentIndex !== -1) {
      targetIndex = (currentIndex + 1) % uniqueIntersects.length;
    }

    const nodeData = uniqueIntersects[targetIndex].object.userData.nodeData;
    if (nodeData) {
      this.model.selectNode(nodeData);
    }
  }

  onDoubleClick(event) {
    const uniqueIntersects = this._raycastNodes(event);
    if (uniqueIntersects.length === 0) return;

    const currentIndex = this._findSelectedIndex(uniqueIntersects);

    let nodeData;
    if (currentIndex !== -1) {
      nodeData = uniqueIntersects[currentIndex].object.userData.nodeData;
    } else {
      nodeData = uniqueIntersects[0].object.userData.nodeData;
      if (nodeData) {
        this.model.selectNode(nodeData);
      }
    }

    if (nodeData) {
      this.zoomToNode(nodeData);
    }
  }

  animate() {
    if (this.disposed) return;

    this.animationFrameId = requestAnimationFrame(() => this.animate());
    this.controls.update();

    // Update orbital animation
    const now = performance.now();
    if (this.lastFrameTime !== null && this.timeScale > 0) {
      const deltaMs = now - this.lastFrameTime;
      this.simulationTime += (deltaMs / 1000) * this.timeScale;
      this.updateOrbitalPositions();
    }
    this.lastFrameTime = now;

    // Hide labels when bounds overflow view, scale when close
    const fovRad = this.camera.fov * Math.PI / 180;
    const aspect = this.camera.aspect;
    const tanHalfFov = Math.tan(fovRad / 2);

    this.nodeMeshes.forEach(({ mesh, label }) => {
      if (label && label.userData.baseScale) {
        const params = mesh.geometry.parameters;
        let visualHeight, visualWidth;

        if (mesh.geometry.type === 'SphereGeometry') {
          // Sphere uses unit radius scaled by mesh.scale
          visualHeight = params.radius * 2 * mesh.scale.y;
          visualWidth = params.radius * 2 * mesh.scale.x;
        } else {
          // Box geometry has direct width/height
          visualHeight = params.height;
          visualWidth = params.width;
        }

        const distForHeight = visualHeight / (2 * tanHalfFov);
        const distForWidth = visualWidth / (2 * tanHalfFov * aspect);
        const minDist = Math.max(distForHeight, distForWidth);

        const actualDist = this.camera.position.distanceTo(mesh.position);

        if (actualDist < minDist) {
          label.visible = false;
        } else {
          label.visible = true;
          // Shrink labels when camera is closer than the label's base width
          const baseWidth = label.userData.baseScale.x;
          const shrinkThreshold = baseWidth * 2;
          if (actualDist < shrinkThreshold) {
            const scaleFactor = Math.max(0.1, actualDist / shrinkThreshold);
            label.scale.copy(label.userData.baseScale).multiplyScalar(scaleFactor);
          } else {
            label.scale.copy(label.userData.baseScale);
          }
        }
      }
    });

    this.starfield.position.copy(this.camera.position);
    this.renderer.render(this.scene, this.camera);
  }

  setData(tree) {
    this.clearNodes();
    this.focusNode = null;

    if (tree) {
      this.buildNodeData(tree, null, this.model.inheritedPlanetContext);
      this.calculateDynamicScale();

      const selectedNode = this.model.getSelectedNode();
      if (selectedNode && this.isCelestialNode(selectedNode)) {
        this.focusNode = selectedNode;
      }

      this.rebuildVisibleNodes();
      this.fitToView();
    }
  }

  calculateDynamicScale() {
    // Find the extent of all node positions and bounds
    let maxExtent = 0;
    let nodeCount = 0;

    this.model.nodes.forEach(node => {
      if (node.worldPos) {
        const pos = node.worldPos;
        const bound = node._bound || { x: 0, y: 0, z: 0 };

        // Skip nodes at exact origin
        const dist = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z);
        if (dist < 0.1) return;

        nodeCount++;

        const extentX = Math.abs(pos.x) + (bound.x || 0);
        const extentY = Math.abs(pos.y) + (bound.y || 0);
        const extentZ = Math.abs(pos.z) + (bound.z || 0);

        maxExtent = Math.max(maxExtent, extentX, extentY, extentZ);
      }
    });

    // Target scene size of ~100 units for good camera handling
    const targetSize = 100;

    if (maxExtent > 0 && nodeCount > 0) {
      this.scale = targetSize / maxExtent;
      this.scaleCalculated = true;
    } else {
      // Fallback: assume Earth-scale if no positioned nodes found yet
      this.scale = 1 / 100000;
      // Don't mark as calculated - we'll try again when children are added
    }
  }

  clearNodes() {
    this.nodeMeshes.forEach(({ mesh, outline, label }) => {
      this.scene.remove(mesh);
      if (outline) this.scene.remove(outline);
      if (label) this.scene.remove(label);
    });
    this.nodeMeshes.clear();

    // Clear orbit paths
    this.orbitPaths.forEach(orbitLine => {
      this.scene.remove(orbitLine);
    });
    this.orbitPaths.clear();
  }

  createOrbitPath(node, parentNode) {
    const orbitData = node._orbitData;
    if (!orbitData || !parentNode) return null;

    // Get parent's animated position (handles hidden orbital parents)
    const parentScaledPos = this.getAnimatedNodePosition(parentNode);

    // Scale orbit semi-axes using same logarithmic formula as positions
    let scaledA, scaledB;
    if (this.focusNode) {
      const refUnit = this.getNodeBoundSize(this.focusNode);
      const logA = Math.log10(1 + orbitData.semiMajorAxis / refUnit);
      const logB = Math.log10(1 + orbitData.semiMinorAxis / refUnit);
      scaledA = logA * FOCUS_VISUAL_SIZE * LOG_SCALE_FACTOR / 10;
      scaledB = logB * FOCUS_VISUAL_SIZE * LOG_SCALE_FACTOR / 10;
    } else {
      scaledA = orbitData.semiMajorAxis * this.scale;
      scaledB = orbitData.semiMinorAxis * this.scale;
    }

    // Create ellipse geometry
    const geometry = createOrbitPathGeometry(scaledA, scaledB);

    // Get color from node type
    const typeName = node.nodeType || node.type;
    const color = NODE_COLORS[typeName] || DEFAULT_COLOR;

    const material = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.4,
      depthWrite: false
    });

    const orbitLine = new THREE.Line(geometry, material);

    // Apply node's rotation (orbital plane orientation)
    const localRot = node.transform?.rotation || { x: 0, y: 0, z: 0, w: 1 };
    const nodeQuat = new THREE.Quaternion(localRot.x, localRot.y, localRot.z, localRot.w);
    nodeQuat.normalize();

    // If parent has rotation, compose it with node rotation
    if (parentNode.worldRot) {
      const parentQuat = new THREE.Quaternion(
        parentNode.worldRot.x,
        parentNode.worldRot.y,
        parentNode.worldRot.z,
        parentNode.worldRot.w
      );
      parentQuat.normalize();
      orbitLine.quaternion.copy(parentQuat.multiply(nodeQuat));
    } else {
      orbitLine.quaternion.copy(nodeQuat);
    }

    // Position at parent (focus)
    orbitLine.position.set(parentScaledPos.x, parentScaledPos.y, parentScaledPos.z);

    // Respect current visibility setting
    orbitLine.visible = this.orbitsVisible;

    this.scene.add(orbitLine);

    return orbitLine;
  }

  _findOrbitalParent(node) {
    const orbitalParentId = node.properties?.pObjectHead?.twParentIx;
    if (orbitalParentId) {
      const parent = this.model.getNode('RMCObject', orbitalParentId);
      if (parent) return parent;
    }
    return node._parent;
  }

  _calculateRotatedOrbitalOffset(node) {
    const orbitalOffset = calculateOrbitalPosition(node._orbitData, this.simulationTime);

    const localRot = node.transform?.rotation || { x: 0, y: 0, z: 0, w: 1 };
    let rotated = rotateByQuaternion(
      orbitalOffset.x, orbitalOffset.y, orbitalOffset.z,
      localRot.x, localRot.y, localRot.z, localRot.w
    );

    const parentNode = this._findOrbitalParent(node);
    if (parentNode?.worldRot) {
      rotated = rotateByQuaternion(
        rotated.x, rotated.y, rotated.z,
        parentNode.worldRot.x, parentNode.worldRot.y, parentNode.worldRot.z, parentNode.worldRot.w
      );
    }

    return rotated;
  }

  _scaleOrbitalOffset(rotatedOrbital) {
    if (this.focusNode) {
      const refUnit = this.getNodeBoundSize(this.focusNode);
      const distance = Math.sqrt(
        rotatedOrbital.x * rotatedOrbital.x +
        rotatedOrbital.y * rotatedOrbital.y +
        rotatedOrbital.z * rotatedOrbital.z
      );
      if (distance > 0.001) {
        const logDistance = Math.log10(1 + distance / refUnit);
        const scaledDistance = logDistance * FOCUS_VISUAL_SIZE * LOG_SCALE_FACTOR / 10;
        const s = scaledDistance / distance;
        return { x: rotatedOrbital.x * s, y: rotatedOrbital.y * s, z: rotatedOrbital.z * s };
      }
      return { x: 0, y: 0, z: 0 };
    }
    return {
      x: rotatedOrbital.x * this.scale,
      y: rotatedOrbital.y * this.scale,
      z: rotatedOrbital.z * this.scale
    };
  }

  updateOrbitalPositions() {
    // First pass: update positions of orbital bodies

    this.nodeMeshes.forEach(({ mesh }, key) => {
      const node = mesh.userData.nodeData;
      if (!node || !node._orbitData) return;

      const parentNode = this._findOrbitalParent(node);
      if (!parentNode) return;

      const rotatedOrbital = this._calculateRotatedOrbitalOffset(node);
      const parentScaledPos = this.getAnimatedNodePosition(parentNode);
      const scaledOffset = this._scaleOrbitalOffset(rotatedOrbital);

      mesh.position.set(
        parentScaledPos.x + scaledOffset.x,
        parentScaledPos.y + scaledOffset.y,
        parentScaledPos.z + scaledOffset.z
      );

      const meshData = this.nodeMeshes.get(key);
      if (meshData.outline) meshData.outline.position.copy(mesh.position);
      if (meshData.label) meshData.label.position.copy(mesh.position);
    });

    // Second pass: update non-orbital children of moved parents
    this.nodeMeshes.forEach(({ mesh, outline, label }, key) => {
      const node = mesh.userData.nodeData;
      if (!node || node._orbitData) return; // Skip if has orbital data (already updated)

      const parentNode = node._parent;
      if (!parentNode) return;

      // Check if any ancestor moved (has orbital data)
      let ancestor = parentNode;
      let hasMovingAncestor = false;
      while (ancestor) {
        if (ancestor._orbitData) {
          hasMovingAncestor = true;
          break;
        }
        ancestor = ancestor._parent;
      }
      if (!hasMovingAncestor) return;

      // Position at parent's animated position (handles hidden orbital parents)
      const parentPos = this.getAnimatedNodePosition(parentNode);
      mesh.position.set(parentPos.x, parentPos.y, parentPos.z);
      if (outline) outline.position.copy(mesh.position);
      if (label) label.position.copy(mesh.position);
    });

    // Third pass: update orbit path positions (centered on parent)
    this.orbitPaths.forEach((orbitLine, key) => {
      const node = this.model.nodes.get(key);
      if (!node) return;

      const parentNode = node._parent;
      if (!parentNode) return;

      // Get parent's animated position (handles hidden orbital parents)
      const parentPos = this.getAnimatedNodePosition(parentNode);
      orbitLine.position.set(parentPos.x, parentPos.y, parentPos.z);
    });

    // Fourth pass: update spin rotations for celestial bodies with spin data
    this.nodeMeshes.forEach(({ mesh }) => {
      const surfaceInfo = mesh.userData.surfaceInfo;
      const baseQuat = mesh.userData.baseQuaternion;
      if (!surfaceInfo?.spinData || !baseQuat) return;

      // Calculate spin angle at current time
      const spinAngle = calculateSpinAngle(surfaceInfo.spinData, this.simulationTime);

      // Create spin rotation around Y axis (local up)
      const spinQuat = new THREE.Quaternion();
      spinQuat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), spinAngle);

      // Apply spin on top of base rotation (axial tilt)
      mesh.quaternion.copy(baseQuat).multiply(spinQuat);
    });
  }

  // Get animated position of a node, recursively calculating for hidden orbital parents
  getAnimatedNodePosition(node) {
    const key = this.model.nodeKey(node);
    const meshData = this.nodeMeshes.get(key);

    // If node has a mesh, use its current position
    if (meshData) {
      return {
        x: meshData.mesh.position.x,
        y: meshData.mesh.position.y,
        z: meshData.mesh.position.z
      };
    }

    // If node has orbital data, calculate its animated position
    if (node._orbitData) {
      const parentNode = this._findOrbitalParent(node);
      if (parentNode) {
        const rotatedOrbital = this._calculateRotatedOrbitalOffset(node);
        const parentPos = this.getAnimatedNodePosition(parentNode);
        const scaledOffset = this._scaleOrbitalOffset(rotatedOrbital);

        return {
          x: parentPos.x + scaledOffset.x,
          y: parentPos.y + scaledOffset.y,
          z: parentPos.z + scaledOffset.z
        };
      }
    }

    // Fallback to static position
    if (this.focusNode && this.isCelestialNode(node)) {
      return this.calculateLogarithmicPosition(node, this.focusNode);
    } else {
      return {
        x: node.worldPos.x * this.scale,
        y: node.worldPos.y * this.scale,
        z: node.worldPos.z * this.scale
      };
    }
  }

  buildNodeData(node, parentNode = null, planetContext = null) {
    const bound = node.bound || { x: 0, y: 0, z: 0 };

    // Check for orbital data
    const orbitData = getOrbitData(node);

    // Detect Surface node and create planet context for descendants
    if (node.nodeType === 'Surface' && bound.x > 0) {
      planetContext = {
        radius: bound.x,
        planetName: parentNode?.name || 'Unknown',
        celestialId: node.id
      };
    }

    node._bound = bound;
    node._orbitData = orbitData;
    if (planetContext) {
      node._planetContext = planetContext;
    }

    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        this.buildNodeData(child, node, planetContext);
      });
    }
  }

  rebuildVisibleNodes() {
    this.clearNodes();
    if (!this.model.tree) return;

    this.addVisibleNode(this.model.tree);

    const addExpandedChildren = (node) => {
      const shouldTraverse = this.model.isNodeExpanded(node) || node.isSearchAncestor;
      if (shouldTraverse && node.children) {
        node.children.forEach(child => {
          this.addVisibleNode(child);
          addExpandedChildren(child);
        });
      }
    };

    addExpandedChildren(this.model.tree);
    this.updateGridPosition();

    // Update orbital positions to match current simulation time (even when paused)
    if (this.simulationTime > 0) {
      this.updateOrbitalPositions();
    }
  }

  updateGridPosition() {
    if (!this.gridHelper) return;

    const SCALE = this.scale;
    let minY = Infinity;

    this.nodeMeshes.forEach(({ mesh }) => {
      const node = mesh.userData.nodeData;
      if (node && node.worldPos) {
        const bound = this.getEffectiveBound(node);
        const posY = node.worldPos.y * SCALE;
        const isCelestial = this.isCelestialNode(node);
        const he = this.computeHalfExtents(node, bound, SCALE);
        const bottomY = isCelestial ? posY - he.y : posY;
        if (bottomY < minY) minY = bottomY;
      }
    });

    if (minY !== Infinity) {
      this.gridHelper.position.y = minY - 50;
    }
  }

  addVisibleNode(node) {
    const key = this.model.nodeKey(node);

    if (!node.worldPos) {
      return;
    }

    // Create orbit path even for filtered nodes (orbit should still be visible)
    if (node._orbitData && !this.orbitPaths.has(key)) {
      const parentNode = node._parent;
      if (parentNode) {
        const orbitPath = this.createOrbitPath(node, parentNode);
        if (orbitPath) {
          this.orbitPaths.set(key, orbitPath);
        }
      }
    }

    // Check type filter for mesh creation
    if (!this.isTypeEnabled(node)) {
      return;
    }

    const worldPos = node.worldPos;
    const worldRot = node.worldRot;
    const bound = this.getEffectiveBound(node);

    const selectedNode = this.model.getSelectedNode();
    const isSelected = selectedNode && node.id === selectedNode.id && node.type === selectedNode.type;
    const hasChildren = node.hasChildren || (node.children && node.children.length > 0);
    const isExpanded = this.model.isNodeExpanded(node);

    const isCelestial = this.isCelestialNode(node);
    let scaledData = null;

    if (isCelestial && this.focusNode) {
      // Celestial node with focus - use logarithmic scaling

      const scaledPos = this.calculateLogarithmicPosition(node, this.focusNode);
      const scaledSize = this.calculateLogarithmicSize(node, this.focusNode);

      // Check if node has zero bounds - if so, calculate from children in scaled space
      const hasZeroBounds = !node._bound || (node._bound.x === 0 && node._bound.y === 0 && node._bound.z === 0);
      const focusNode = this.focusNode;
      const scaledChildBounds = hasZeroBounds ? this.calculateBoundsFromChildren(node, scaledPos, (child) => {
        const childScaledPos = this.calculateLogarithmicPosition(child, focusNode);
        const childOriginalSize = this.getNodeBoundSize(child);
        const childScaledSize = this.calculateLogarithmicSize(child, focusNode);
        const scale = childOriginalSize > 0.001 ? childScaledSize / childOriginalSize : 1;
        return { pos: childScaledPos, scale };
      }, true) : null;

      if (scaledChildBounds) {
        // Use bounds calculated from children's scaled positions
        scaledData = {
          x: scaledPos.x,
          y: scaledPos.y,
          z: scaledPos.z,
          halfX: scaledChildBounds.halfX,
          halfY: scaledChildBounds.halfY,
          halfZ: scaledChildBounds.halfZ
        };
      } else {
        // Scale bounds proportionally
        const originalSize = this.getNodeBoundSize(node);
        const sizeRatio = originalSize > 0.001 ? scaledSize / originalSize : 1;

        const he = this.computeHalfExtents(node, bound, sizeRatio);
        scaledData = {
          x: scaledPos.x,
          y: scaledPos.y,
          z: scaledPos.z,
          halfX: he.x,
          halfY: he.y,
          halfZ: he.z
        };
      }
    } else if (!isCelestial) {
      // Terrestrial node - use linear scaling relative to celestial parent
      const celestialParent = this.findCelestialParent(node);

      if (celestialParent && this.focusNode) {
        // Get parent's scaled position as our reference frame
        const parentScaledPos = this.calculateLogarithmicPosition(celestialParent, this.focusNode);
        const parentScaledSize = this.calculateLogarithmicSize(celestialParent, this.focusNode);
        const parentOriginalSize = this.getNodeBoundSize(celestialParent);

        // Position relative to parent, scaled by parent's scale factor
        const parentScale = parentOriginalSize > 0.001 ? parentScaledSize / parentOriginalSize : 1;
        const relX = worldPos.x - celestialParent.worldPos.x;
        const relY = worldPos.y - celestialParent.worldPos.y;
        const relZ = worldPos.z - celestialParent.worldPos.z;

        const he = this.computeHalfExtents(node, bound, parentScale);
        scaledData = {
          x: parentScaledPos.x + relX * parentScale,
          y: parentScaledPos.y + relY * parentScale,
          z: parentScaledPos.z + relZ * parentScale,
          halfX: he.x,
          halfY: he.y,
          halfZ: he.z
        };
      }
      // else: fall through to linear scaling (no celestial context)
    }
    // else: celestial but no focus - fall through to linear scaling

    // Skip celestial nodes at origin if using linear scaling (fallback)
    // Terrestrial nodes can legitimately be at origin relative to their world
    if (!scaledData && isCelestial) {
      const radius = Math.sqrt(worldPos.x * worldPos.x + worldPos.y * worldPos.y + worldPos.z * worldPos.z);
      if (radius < 0.1) {
        return;
      }
    }

    const meshData = this.createBoundingPolygon(node, worldPos, worldRot, bound, isSelected, hasChildren, isExpanded, scaledData);
    if (meshData) {
      this.nodeMeshes.set(key, meshData);
    }
  }

  createBoundingPolygon(node, worldPos, worldRot, bound, isSelected, hasChildren, isExpanded, scaledData = null) {
    // Skip celestial nodes at origin (unless pre-scaled data provided)
    // Terrestrial nodes can legitimately be at origin
    if (!scaledData && this.isCelestialNode(node)) {
      const nodeRadius = Math.sqrt(worldPos.x * worldPos.x + worldPos.y * worldPos.y + worldPos.z * worldPos.z);
      if (nodeRadius < 0.1) return null;
    }

    let center, halfX, halfY, halfZ;

    if (scaledData) {
      // Use pre-calculated scaled position and size (for celestial focus-based rendering)
      center = new THREE.Vector3(scaledData.x, scaledData.y, scaledData.z);
      halfX = scaledData.halfX;
      halfY = scaledData.halfY;
      halfZ = scaledData.halfZ;
    } else {
      // Use linear scaling (for terrestrial or fallback)
      const SCALE = this.scale;
      center = new THREE.Vector3(
        worldPos.x * SCALE,
        worldPos.y * SCALE,
        worldPos.z * SCALE
      );
      const he = this.computeHalfExtents(node, bound, SCALE, 100000);
      halfX = he.x;
      halfY = he.y;
      halfZ = he.z;
    }

    // Get color based on nodeType (set by server from bType), fallback to type
    const typeName = this.getDisplayType(node);
    const color = NODE_COLORS[typeName] || DEFAULT_COLOR;
    const isCelestial = this.isCelestialNode(node);
    let geometry, mesh, outline;

    // Apply rotation and position (normalize quaternion to prevent shearing)
    const rotQuat = new THREE.Quaternion(worldRot.x, worldRot.y, worldRot.z, worldRot.w);
    rotQuat.normalize();

    if (isCelestial) {
      // Create a spheroid (ellipsoid) that fits inside the bounding box
      // SphereGeometry(1) has radius=1, diameter=2, so scale by half-extents to get correct size
      geometry = new THREE.SphereGeometry(1, 32, 24);

      // Check for surface texture from Surface child
      const surfaceInfo = getSurfaceTexture(node);
      let material;

      if (surfaceInfo) {
        // Create material that will receive texture
        material = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: isSelected ? 0.9 : 0.8,
          side: THREE.DoubleSide,
          depthWrite: false
        });

        // Load texture asynchronously
        textureLoader.load(
          surfaceInfo.url,
          (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            material.map = texture;
            material.needsUpdate = true;
          },
          undefined,
          (err) => console.warn(`Failed to load surface texture: ${surfaceInfo.url}`, err)
        );
      } else {
        material = new THREE.MeshBasicMaterial({
          color: color,
          transparent: true,
          opacity: isSelected ? 0.35 : 0.15,
          side: THREE.DoubleSide,
          depthWrite: false
        });
      }

      mesh = new THREE.Mesh(geometry, material);
      mesh.scale.set(halfX, halfY, halfZ);

      // Apply surface rotation (axial tilt) if we have a texture
      if (surfaceInfo) {
        const surfaceQuat = new THREE.Quaternion(
          surfaceInfo.rotation.x,
          surfaceInfo.rotation.y,
          surfaceInfo.rotation.z,
          surfaceInfo.rotation.w
        );
        surfaceQuat.normalize();
        // Combine world rotation with surface rotation
        const combinedQuat = rotQuat.clone().multiply(surfaceQuat);
        mesh.quaternion.copy(combinedQuat);
        // Store for spin animation
        mesh.userData.surfaceInfo = surfaceInfo;
        mesh.userData.baseQuaternion = combinedQuat.clone();
      } else {
        mesh.quaternion.copy(rotQuat);
      }

      mesh.position.copy(center);
      mesh.userData.nodeData = node;
      this.scene.add(mesh);

      // Create a single ring around the equator
      const edgeColor = isSelected ? SELECTION_COLOR : color;
      const ringPoints = [];
      const ringSegments = 48;
      for (let i = 0; i <= ringSegments; i++) {
        const theta = (i / ringSegments) * Math.PI * 2;
        ringPoints.push(new THREE.Vector3(Math.cos(theta), 0, Math.sin(theta)));
      }
      const ringGeometry = new THREE.BufferGeometry().setFromPoints(ringPoints);
      const ringMaterial = new THREE.LineBasicMaterial({
        color: edgeColor,
        transparent: true,
        opacity: isSelected ? 1.0 : (hasChildren && !isExpanded ? 0.4 : 0.6)
      });

      outline = new THREE.Line(ringGeometry, ringMaterial);
      outline.scale.set(halfX, halfY, halfZ);
      outline.quaternion.copy(rotQuat);
      outline.position.copy(center);
      this.scene.add(outline);
    } else {
      // Create a 3D box for non-celestial nodes
      // Y offset positions box bottom at world position
      center.y += halfY;
      geometry = new THREE.BoxGeometry(halfX * 2, halfY * 2, halfZ * 2);
      const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: isSelected ? 0.35 : 0.15,
        side: THREE.DoubleSide,
        depthWrite: false
      });

      mesh = new THREE.Mesh(geometry, material);
      mesh.quaternion.copy(rotQuat);
      mesh.position.copy(center);
      mesh.userData.nodeData = node;
      this.scene.add(mesh);

      // Create wireframe edges - white when selected, otherwise node color
      const edgesGeometry = new THREE.EdgesGeometry(geometry);
      const edgeColor = isSelected ? SELECTION_COLOR : color;
      const edgesMaterial = new THREE.LineBasicMaterial({
        color: edgeColor,
        transparent: true,
        opacity: isSelected ? 1.0 : (hasChildren && !isExpanded ? 0.4 : 0.6)
      });

      outline = new THREE.LineSegments(edgesGeometry, edgesMaterial);
      outline.quaternion.copy(rotQuat);
      outline.position.copy(center);
      this.scene.add(outline);
    }

    // Create text label sprite at center of bounding box
    // Use the two largest dimensions to ensure label is visible regardless of rotation
    const sortedHalves = [halfX, halfY, halfZ].sort((a, b) => b - a);
    const label = this.createLabel(node.name || '(unnamed)', sortedHalves[0], sortedHalves[1]);
    label.position.copy(center);
    label.userData.baseScale = label.scale.clone();
    this.scene.add(label);

    return { mesh, outline, label };
  }

  createLabel(text, boxHalfWidth, boxHalfHeight) {
    const { sprite, aspect } = createLabelSprite(text);

    const boxWidth = boxHalfWidth * 2 * 0.8;
    const boxHeight = boxHalfHeight * 2 * 0.5;

    let labelHeight;
    if (boxWidth / aspect < boxHeight) {
      labelHeight = boxWidth / aspect;
    } else {
      labelHeight = boxHeight;
    }

    sprite.scale.set(labelHeight * aspect, labelHeight, 1);
    sprite.center.set(0.5, 0.5);

    return sprite;
  }

  selectNode(nodeOrId, type = null) {
    const node = (nodeOrId && typeof nodeOrId === 'object')
      ? nodeOrId
      : this.model.getNode(type, nodeOrId);
    if (node) {
      if (this.isCelestialNode(node)) {
        this.focusNode = node;
      }
      this.updateGridForNode(node);
    }

    this.rebuildVisibleNodes();
    this.saveState();
  }

  updateGridForNode(node) {
    if (!this.gridHelper) {
      return;
    }

    let visualSize;

    if (this.focusNode && this.isCelestialNode(node)) {
      // Logarithmic mode: use the visual size from calculateLogarithmicSize
      visualSize = this.calculateLogarithmicSize(node, this.focusNode);
    } else {
      // Linear mode: use scaled bounds
      const bound = this.getEffectiveBound(node);
      const maxExtent = Math.max(bound.x || 1, bound.y || 1, bound.z || 1) * 2;
      visualSize = maxExtent * this.scale;
    }

    const spacing = calculateGridSpacing(visualSize);

    // Calculate fade distance from furthest visible node
    let maxDistance = 100;
    this.nodeMeshes.forEach(({ mesh }) => {
      if (mesh) {
        const pos = mesh.position;
        const dist = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
        if (dist > maxDistance) {
          maxDistance = dist;
        }
      }
    });
    spacing.fadeDistance = maxDistance;

    updateGridSpacing(this.gridHelper, spacing);
  }

  expandNode(node) {
    this.rebuildVisibleNodes();
    this.saveState();
  }

  collapseNode(node) {
    this.rebuildVisibleNodes();
    this.saveState();
  }

  addChildren(parentNode, children) {
    if (!children || children.length === 0) return;

    const parentKey = this.model.nodeKey(parentNode);
    const parent = this.model.nodes.get(parentKey);
    if (!parent) return;

    const parentPlanetContext = parent._planetContext;

    children.forEach(child => {
      this.buildNodeData(child, parent, parentPlanetContext);
    });

    if (!parent.children) {
      parent.children = [];
    }
    children.forEach(child => {
      if (!parent.children.find(c => this.model.nodeKey(c) === this.model.nodeKey(child))) {
        parent.children.push(child);
      }
    });

    this._scheduleRebuild();
  }

  _scheduleRebuild() {
    if (this._rebuildTimer) return;
    this._rebuildTimer = setTimeout(() => {
      this._rebuildTimer = null;
      if (this.model.tree) {
        this.buildNodeData(this.model.tree, null, this.model.inheritedPlanetContext);
      }
      this.calculateDynamicScale();
      this.rebuildVisibleNodes();
      if (this._pendingZoomNode) {
        this.zoomToNode(this._pendingZoomNode);
        this._pendingZoomNode = null;
      }
    }, 250);
  }

  updateNode(node) {
    if (!node) return;
    const key = this.model.nodeKey(node);
    const existing = this.model.nodes.get(key);
    if (!existing) return;

    const parentNode = existing._parent;
    const planetContext = existing._planetContext || null;

    this.buildNodeData(node, parentNode, planetContext);
    this.rebuildVisibleNodes();
  }

  zoomToNode(node) {
    if (!node) return;

    let targetNode = node;
    if (!node.worldPos) {
      const key = this.model.nodeKey(node);
      targetNode = this.model.nodes.get(key);
      if (!targetNode || !targetNode.worldPos) return;
    }

    const bound = this.getEffectiveBound(targetNode);
    const key = this.model.nodeKey(targetNode);
    const meshData = this.nodeMeshes.get(key);

    let targetPos, boxWidth, boxHeight, boxDepth;

    // Always use current mesh position if available (for animated objects)
    if (meshData && meshData.mesh) {
      const mesh = meshData.mesh;
      targetPos = mesh.position.clone();

      // SphereGeometry uses scale for size, BoxGeometry has dimensions baked in
      if (mesh.geometry.type === 'SphereGeometry') {
        boxWidth = mesh.scale.x * 2;
        boxHeight = mesh.scale.y * 2;
        boxDepth = mesh.scale.z * 2;
      } else {
        const params = mesh.geometry.parameters;
        boxWidth = params.width || mesh.scale.x * 2;
        boxHeight = params.height || mesh.scale.y * 2;
        boxDepth = params.depth || mesh.scale.z * 2;
      }
    } else {
      // Fallback to static position
      const SCALE = this.scale;
      const worldPos = targetNode.worldPos;
      targetPos = new THREE.Vector3(
        worldPos.x * SCALE,
        worldPos.y * SCALE,
        worldPos.z * SCALE
      );
      const he = this.computeHalfExtents(targetNode, bound, SCALE);
      boxWidth = he.x * 2;
      boxHeight = he.y * 2;
      boxDepth = he.z * 2;
    }

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

    // Dynamically adjust camera near plane to allow viewing tiny objects
    // Near plane should be smaller than camera distance but not too small (causes z-fighting)
    const minNear = 1e-6;
    const desiredNear = cameraDistance * 0.1;
    const newNear = Math.max(desiredNear, minNear);
    if (this.camera.near !== newNear) {
      this.camera.near = newNear;
      this.camera.updateProjectionMatrix();
    }

    // Also update controls minDistance to allow getting this close
    this.controls.minDistance = newNear;

    // Position camera looking at target from current viewing direction
    const dir = this.camera.position.clone().sub(this.controls.target).normalize();
    if (dir.length() < 0.001) dir.set(0, 0, 1);
    const cameraPos = targetPos.clone().add(dir.multiplyScalar(cameraDistance));

    this.camera.position.copy(cameraPos);
    this.controls.target.copy(targetPos);
    this.controls.update();
  }

  onMsfLoad(callback) {
    this.msfLoadCallbacks.push(callback);
  }

  render() {
    // Called externally but Three.js handles rendering in animate loop
  }

  fitToView() {
    const SCALE = this.scale;
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    let count = 0;

    // Calculate bounding box of all visible nodes
    this.model.nodes.forEach(node => {
      if (node.worldPos) {
        const r = Math.sqrt(node.worldPos.x ** 2 + node.worldPos.y ** 2 + node.worldPos.z ** 2);
        if (r > 1000) {
          const px = node.worldPos.x * SCALE;
          const py = node.worldPos.y * SCALE;
          const pz = node.worldPos.z * SCALE;
          const bound = this.getEffectiveBound(node);
          const he = this.computeHalfExtents(node, bound, SCALE);

          minX = Math.min(minX, px - he.x);
          minY = Math.min(minY, py - he.y);
          minZ = Math.min(minZ, pz - he.z);
          maxX = Math.max(maxX, px + he.x);
          maxY = Math.max(maxY, py + he.y);
          maxZ = Math.max(maxZ, pz + he.z);
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
    this.saveState();
  }

  syncTypeFilterCheckboxes() {
    const dropdown = document.getElementById('type-filter-dropdown');
    if (!dropdown) return;

    // Sync individual type checkboxes (exclude orbits toggle which has no value)
    dropdown.querySelectorAll('.filter-category-items input[type="checkbox"]:not(#orbits-toggle), .filter-standalone input[type="checkbox"]').forEach(checkbox => {
      checkbox.checked = this.typeFilter.has(checkbox.value);
    });

    // Update category checkbox states (checked/indeterminate)
    dropdown.querySelectorAll('.filter-category').forEach(category => {
      const categoryCheckbox = category.querySelector('input[data-category]');
      const childCheckboxes = category.querySelectorAll('.filter-category-items input[type="checkbox"]:not(#orbits-toggle)');
      if (categoryCheckbox && childCheckboxes.length > 0) {
        const allChecked = Array.from(childCheckboxes).every(cb => cb.checked);
        const someChecked = Array.from(childCheckboxes).some(cb => cb.checked);
        categoryCheckbox.checked = allChecked;
        categoryCheckbox.indeterminate = someChecked && !allChecked;
      }
    });
  }

  resetTypeFilter() {
    this.typeFilter = new Set(NODE_TYPES.filter(t => t.name !== 'Root').map(t => t.name));
    this.orbitsVisible = true;
    this.syncTypeFilterCheckboxes();

    // Reset orbits checkbox
    const orbitsToggle = document.getElementById('orbits-toggle');
    if (orbitsToggle) {
      orbitsToggle.checked = true;
    }

    // Update orbit visibility
    this.orbitPaths.forEach(orbitLine => {
      orbitLine.visible = true;
    });

    this.rebuildVisibleNodes();
    this.saveState();
  }

  getDisplayType(node) {
    const nodeType = node.nodeType || node.type;

    // Map raw RM types to display types
    if (nodeType === 'RMRoot') return 'Root';
    if (nodeType === 'RMTObject') return 'Territory';
    if (nodeType === 'RMCObject') return 'Land';
    if (nodeType === 'RMPObject') return 'Physical';

    return nodeType;
  }

  isTypeEnabled(node) {
    const displayType = this.getDisplayType(node);
    return this.typeFilter.has(displayType);
  }

  isCelestialNode(node) {
    const displayType = this.getDisplayType(node);
    return CELESTIAL_TYPES.has(displayType);
  }

  isRelatedToFocus(node) {
    if (!this.focusNode) return true;

    // Focus node itself
    if (node === this.focusNode) return true;

    // Parent of focus
    const focusParent = this.focusNode._parent;
    if (focusParent === node) return true;

    // Children of focus (check if node's parent is focus)
    const nodeParent = node._parent;
    if (nodeParent === this.focusNode) return true;

    // Siblings (same parent as focus)
    if (focusParent && nodeParent === focusParent) return true;

    return false;
  }

  findCelestialParent(node) {
    let current = node._parent;
    while (current) {
      if (this.isCelestialNode(current)) {
        return current;
      }
      current = current._parent;
    }
    return null;
  }

  getNodeBoundSize(node) {
    const bound = this.getEffectiveBound(node);
    return Math.max(bound.x || 1, bound.y || 1, bound.z || 1);
  }

  // X/Z bounds are half-extents (radius). Y is full height for terrestrial, half-extent for celestial.
  computeHalfExtents(node, bound, scaleFactor, fallback = 1) {
    const isCelestial = this.isCelestialNode(node);
    return {
      x: (bound.x || fallback) * scaleFactor,
      y: isCelestial
        ? (bound.y || bound.x || fallback) * scaleFactor
        : (bound.y || bound.x || fallback) / 2 * scaleFactor,
      z: (bound.z || bound.x || fallback) * scaleFactor
    };
  }

  getEffectiveBound(node) {
    const bound = node._bound;

    // If node has non-zero bounds, use them
    if (bound && (bound.x > 0 || bound.y > 0 || bound.z > 0)) {
      return bound;
    }

    // Calculate bounds from children in world space (recursive to traverse unexpanded children)
    const result = this.calculateBoundsFromChildren(node, node.worldPos, null, true);
    if (!result) {
      return { x: 1, y: 1, z: 1 };
    }

    return {
      x: result.halfX,
      y: result.halfY,
      z: result.halfZ
    };
  }

  // Calculate bounds from children with optional coordinate transform
  // If getChildPosAndScale is provided, uses scaled space; otherwise uses world space
  // If recursive is true, traverse children regardless of expansion state (for ancestor bounds)
  calculateBoundsFromChildren(node, parentPos, getChildPosAndScale = null, recursive = false) {
    const isExpanded = this.model.isNodeExpanded(node);

    // For non-recursive calls, require node to be expanded
    // For recursive calls (ancestor bounds), traverse children regardless
    if (!recursive && !isExpanded) {
      return null;
    }

    if (!node.children || node.children.length === 0) {
      return null;
    }

    let maxExtentX = 0, maxExtentY = 0, maxExtentZ = 0;
    let hasValidChild = false;

    for (const child of node.children) {
      if (!child.worldPos || !this.isTypeEnabled(child)) continue;

      hasValidChild = true;

      let relX, relY, relZ;

      // Use child's max dimension as radius (sphere-like approximation)
      // If child has zero bounds, recursively get its effective bounds
      let childBound = child._bound || { x: 0, y: 0, z: 0 };
      const hasZeroChildBounds = childBound.x === 0 && childBound.y === 0 && childBound.z === 0;
      if (hasZeroChildBounds) {
        childBound = this.getEffectiveBound(child);
      }
      let childRadius;

      if (getChildPosAndScale) {
        // Scaled space (logarithmic) - get scaled position and size
        const { pos, scale } = getChildPosAndScale(child);
        relX = pos.x - parentPos.x;
        relY = pos.y - parentPos.y;
        relZ = pos.z - parentPos.z;
        const maxDim = Math.max(childBound.x || 0, childBound.y || 0, childBound.z || 0);
        childRadius = (maxDim || 1) * scale;
      } else {
        // World space - use positions directly
        relX = child.worldPos.x - parentPos.x;
        relY = child.worldPos.y - parentPos.y;
        relZ = child.worldPos.z - parentPos.z;
        const maxDim = Math.max(childBound.x || 0, childBound.y || 0, childBound.z || 0);
        childRadius = maxDim;
      }

      maxExtentX = Math.max(maxExtentX, Math.abs(relX) + childRadius);
      maxExtentY = Math.max(maxExtentY, Math.abs(relY) + childRadius);
      maxExtentZ = Math.max(maxExtentZ, Math.abs(relZ) + childRadius);
    }

    if (!hasValidChild) {
      return null;
    }

    return { halfX: maxExtentX, halfY: maxExtentY, halfZ: maxExtentZ };
  }

  calculateLogarithmicPosition(node, focusNode) {
    const focusPos = focusNode.worldPos;
    const nodePos = node.worldPos;
    if (!focusPos || !nodePos) return { x: 0, y: 0, z: 0 };

    // Distance vector from focus to node
    const dx = nodePos.x - focusPos.x;
    const dy = nodePos.y - focusPos.y;
    const dz = nodePos.z - focusPos.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (distance < 0.001) {
      // Node is at focus position
      return { x: 0, y: 0, z: 0 };
    }

    // Reference unit based on focus node's size
    const refUnit = this.getNodeBoundSize(focusNode);

    // Logarithmic scaling: compress large distances
    // Result in scene units relative to FOCUS_VISUAL_SIZE
    const logDistance = Math.log10(1 + distance / refUnit);
    const scaledDistance = logDistance * FOCUS_VISUAL_SIZE * LOG_SCALE_FACTOR / 10;

    // Preserve direction, apply scaled distance
    const scale = scaledDistance / distance;
    return {
      x: dx * scale,
      y: dy * scale,
      z: dz * scale
    };
  }

  calculateLogarithmicSize(node, focusNode) {
    const nodeSize = this.getNodeBoundSize(node);
    const focusSize = this.getNodeBoundSize(focusNode);

    // Focus node renders at FOCUS_VISUAL_SIZE
    if (nodeSize === focusSize) {
      return FOCUS_VISUAL_SIZE;
    }

    // Use cube root to compress extreme size differences while preserving visible ratios
    // Cube root of 1000x difference = 10x visual difference
    const ratio = nodeSize / focusSize;
    const scaleFactor = Math.pow(ratio, 1/3);  // Cube root

    // Apply to focus visual size, with min/max bounds
    return Math.max(5, Math.min(FOCUS_VISUAL_SIZE * 20, FOCUS_VISUAL_SIZE * scaleFactor));
  }

  shouldCullNode(node, focusNode) {
    // Don't cull the focus node itself
    if (node === focusNode) return false;

    // Don't cull nodes at the same position (likely parent/child containers)
    const focusPos = focusNode.worldPos;
    const nodePos = node.worldPos;
    if (!focusPos || !nodePos) return false;
    const dx = nodePos.x - focusPos.x;
    const dy = nodePos.y - focusPos.y;
    const dz = nodePos.z - focusPos.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (distance < 0.001) return false;

    // Cull nodes whose actual bounds are larger than 10x the focus node's bounds
    // This hides giant parent containers when viewing small objects
    const focusSize = this.getNodeBoundSize(focusNode);
    const nodeSize = this.getNodeBoundSize(node);
    return nodeSize > focusSize * 10;
  }

  saveState() {
    if (!this.stateManager) return;

    const typeFilterArray = Array.from(this.typeFilter);

    const slider = document.getElementById('timescale-slider');
    const timeScaleIndex = slider ? parseInt(slider.value) : 4;

    this.stateManager.updateSection('viewBounds', {
      typeFilter: typeFilterArray,
      timeScaleIndex: timeScaleIndex,
      orbitsVisible: this.orbitsVisible
    });
  }

  restoreState(state) {
    state = state || this.stateManager?.getSection('viewBounds') || {};

    if (state.typeFilter && Array.isArray(state.typeFilter)) {
      this.typeFilter = new Set(state.typeFilter);
      this.syncTypeFilterCheckboxes();
    }

    if (typeof state.timeScaleIndex === 'number') {
      const slider = document.getElementById('timescale-slider');
      const label = document.getElementById('timescale-label');
      if (slider) {
        slider.value = state.timeScaleIndex;
        const timeLabels = ['Paused', '1 sec/sec', '1 min/sec', '1 hr/sec', '1 day/sec', '1 wk/sec', '1 mo/sec', '1 yr/sec'];
        const timeScales = [0, 1, 60, 3600, 86400, 604800, 2592000, 31536000];
        this.timeScale = timeScales[state.timeScaleIndex] ?? 86400;
        if (label) {
          label.textContent = timeLabels[state.timeScaleIndex] || '1 day/sec';
        }
      }
    }

    if (typeof state.orbitsVisible === 'boolean') {
      this.orbitsVisible = state.orbitsVisible;
      const orbitsToggle = document.getElementById('orbits-toggle');
      if (orbitsToggle) {
        orbitsToggle.checked = state.orbitsVisible;
      }
    }

  }

  dispose() {
    this.disposed = true;

    // Stop animation loop
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Clear any pending click timeout
    if (this.clickTimeout) {
      clearTimeout(this.clickTimeout);
      this.clickTimeout = null;
    }

    // Remove event listeners
    window.removeEventListener('resize', this.boundResizeHandler);
    if (this.renderer?.domElement) {
      this.renderer.domElement.removeEventListener('pointerdown', this.boundPointerDownHandler);
      this.renderer.domElement.removeEventListener('pointerup', this.boundPointerUpHandler);
    }

    // Disconnect ResizeObserver
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    // Clear scene content (dispose geometry/materials)
    this.nodeMeshes.forEach(({ mesh, outline, label }) => {
      this.scene.remove(mesh);
      mesh.geometry?.dispose();
      if (mesh.material) {
        if (mesh.material.map) mesh.material.map.dispose();
        mesh.material.dispose();
      }
      if (outline) {
        this.scene.remove(outline);
        outline.geometry?.dispose();
        outline.material?.dispose();
      }
      if (label) {
        this.scene.remove(label);
        if (label.material?.map) label.material.map.dispose();
        label.material?.dispose();
      }
    });
    this.nodeMeshes.clear();

    // Clear orbit paths
    this.orbitPaths.forEach(orbitLine => {
      this.scene.remove(orbitLine);
      orbitLine.geometry?.dispose();
      orbitLine.material?.dispose();
    });
    this.orbitPaths.clear();

    // Dispose globe, starfield, and grid
    for (const obj of [this.globe, this.starfield, this.gridHelper]) {
      if (obj) {
        this.scene.remove(obj);
        obj.geometry?.dispose();
        obj.material?.dispose();
      }
    }

    // Dispose lights
    for (const light of [this.hemiLight, this.dirLight, this.cameraLight]) {
      light?.dispose();
    }

    // Dispose controls and renderer
    this.controls?.dispose();
    this.renderer?.dispose();
  }

}
