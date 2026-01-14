/**
 * Copyright (c) 2026 Patched Reality, Inc.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { createStarfield, createInfiniteGrid, calculateGridSpacing, updateGridSpacing } from './scene-helpers.js';
import { getResourceUrl, resolveResourceUrl } from './node-helpers.js';

export class ViewResource {
  constructor(containerSelector) {
    this.container = document.querySelector(containerSelector);
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;

    this.gltfLoader = new GLTFLoader();

    // Set up Draco loader for compressed geometry (store for disposal)
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    this.gltfLoader.setDRACOLoader(this.dracoLoader);
    this.loadedModels = [];
    this.contentGroup = null;
    this.rotators = [];  // Active rotator animations
    this.clock = new THREE.Clock();

    this.metadataCache = new Map();
    this.glbCache = new Map();

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.currentResourceUrl = null;
    this.currentNode = null;
    this.isLoading = false;
    this.loadRequestId = 0;  // Increments on each load to handle race conditions

    this.resourceBaseUrl = '';  // Base URL for loading resources (from MSF server)

    this.statusCallbacks = [];

    this.animationFrameId = null;
    this.disposed = false;
    this.initialized = false;

    this.init();
    if (this.initialized) {
      this.animate();
    }
  }

  init() {
    if (!this.container) {
      console.error('ViewResource: Container not found');
      return;
    }

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0c0c14);

    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 600;

    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 10000);
    this.camera.position.set(5, 5, 10);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.2;

    this.hemiLight = new THREE.HemisphereLight(0x4466aa, 0x1a1a2e, 0.8);
    this.hemiLight.position.set(0, 200, 0);
    this.scene.add(this.hemiLight);

    this.keyLight = new THREE.DirectionalLight(0xfff5e6, 2.0);
    this.keyLight.position.set(50, 100, 50);
    this.scene.add(this.keyLight);

    this.rimLight = new THREE.DirectionalLight(0x6699ff, 0.8);
    this.rimLight.position.set(-50, 30, -50);
    this.scene.add(this.rimLight);

    this.cameraLight = new THREE.PointLight(0xffffff, 0.3);
    this.camera.add(this.cameraLight);
    this.scene.add(this.camera);

    // Set up KTX2 loader for compressed textures (store for disposal)
    this.ktx2Loader = new KTX2Loader();
    this.ktx2Loader.setTranscoderPath('https://www.gstatic.com/basis-universal/versioned/2021-04-15-ba1c3e4/');
    this.ktx2Loader.detectSupport(this.renderer);
    this.gltfLoader.setKTX2Loader(this.ktx2Loader);

    this.gridHelper = createInfiniteGrid(this.scene);
    this.starfield = createStarfield(this.scene, { radius: 2500 });

    // Store bound handlers for cleanup
    this.boundResizeHandler = () => this.onWindowResize();
    this.boundDblClickHandler = (e) => this.onDoubleClick(e);

    window.addEventListener('resize', this.boundResizeHandler);
    this.setupEventListeners();
    this.initialized = true;
  }

  setupEventListeners() {
    this.renderer.domElement.addEventListener('dblclick', this.boundDblClickHandler);
  }

  onDoubleClick(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const intersects = this.raycaster.intersectObjects(this.loadedModels, true);
    if (intersects.length > 0) {
      const hitObject = intersects[0].object;
      this.zoomToObject(hitObject);
    } else {
      this.fitCameraToContent();
    }
  }

  zoomToObject(object) {
    const boundingBox = new THREE.Box3().setFromObject(object);
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    boundingBox.getCenter(center);
    boundingBox.getSize(size);

    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = this.camera.fov * (Math.PI / 180);
    const distance = (maxDim / 2) / Math.tan(fov / 2) * 2;
    const minDistance = 2;
    const finalDistance = Math.max(distance, minDistance);

    const direction = this.camera.position.clone().sub(this.controls.target).normalize();
    const targetPosition = center.clone().add(direction.multiplyScalar(finalDistance));

    this.animateCamera(targetPosition, center);
  }

  animateCamera(targetPosition, targetLookAt) {
    // Cancel any existing camera animation
    if (this.cameraAnimationId) {
      cancelAnimationFrame(this.cameraAnimationId);
      this.cameraAnimationId = null;
    }

    const startPosition = this.camera.position.clone();
    const startLookAt = this.controls.target.clone();
    const duration = 500;
    const startTime = performance.now();

    const animate = (currentTime) => {
      if (this.disposed) return;

      const elapsed = currentTime - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      this.camera.position.lerpVectors(startPosition, targetPosition, eased);
      this.controls.target.lerpVectors(startLookAt, targetLookAt, eased);
      this.controls.update();

      if (t < 1) {
        this.cameraAnimationId = requestAnimationFrame(animate);
      } else {
        this.cameraAnimationId = null;
      }
    };

    this.cameraAnimationId = requestAnimationFrame(animate);
  }

  onWindowResize() {
    if (!this.container || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (width === 0 || height === 0) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    if (this.disposed) return;

    this.animationFrameId = requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    this.updateRotators(delta);

    this.controls.update();
    this.starfield.position.copy(this.camera.position);
    this.renderer.render(this.scene, this.camera);
  }

  updateRotators(delta) {
    for (const rotator of this.rotators) {
      const { target, axis, speed } = rotator;
      if (target && target.parent) {
        const angle = speed * delta * (Math.PI / 180);  // Convert degrees/sec to radians
        target.rotateOnAxis(axis, angle);
      }
    }
  }

  setResourceBaseUrl(msfUrl) {
    try {
      const url = new URL(msfUrl);
      this.resourceBaseUrl = url.origin;
    } catch (e) {
      console.warn('Invalid MSF URL for resource base:', msfUrl);
      this.resourceBaseUrl = '';
    }
  }

  _resolveResourceUrl(path) {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    if (this.resourceBaseUrl && path.startsWith('/')) {
      return this.resourceBaseUrl + path;
    }
    return path;
  }

  setNode(node, expandedDescendants = []) {
    this.currentNode = node;

    const resourcesToLoad = [];

    const nodeResourceUrl = getResourceUrl(node);
    if (nodeResourceUrl) {
      resourcesToLoad.push({
        url: nodeResourceUrl,
        transform: null
      });
    }

    for (const { node: childNode, cumulativeTransform } of expandedDescendants) {
      const childResourceUrl = getResourceUrl(childNode);
      if (childResourceUrl) {
        resourcesToLoad.push({
          url: childResourceUrl,
          transform: cumulativeTransform
        });
      }
    }

    if (resourcesToLoad.length === 0) {
      this.clearScene();
      this.currentResourceUrl = null;
      this.setStatus('No resource', '');
      return;
    }

    const cacheKey = resourcesToLoad.map(r => r.url).sort().join('|');
    if (cacheKey === this.currentResourceUrl) {
      return;
    }

    this.currentResourceUrl = cacheKey;
    this.loadMultipleResources(resourcesToLoad);
  }

  async loadMultipleResources(resourcesToLoad) {
    // Increment request ID to invalidate any in-progress loads
    const requestId = ++this.loadRequestId;
    this.isLoading = true;

    this.clearScene();
    this.contentGroup = new THREE.Group();
    this.scene.add(this.contentGroup);
    this.setStatus(`Loading ${resourcesToLoad.length} resource(s)...`, 'loading');

    try {
      for (const { url, transform } of resourcesToLoad) {
        // Check if this request is still current
        if (requestId !== this.loadRequestId) return;

        const lower = url.toLowerCase();
        if (lower.endsWith('.glb') || lower.endsWith('.gltf')) {
          await this.loadDirectGlb(url, transform, requestId);
        } else {
          await this.loadResourceWithTransform(url, transform, requestId);
        }
      }

      // Final check before updating UI
      if (requestId !== this.loadRequestId) return;

      this.centerContentAtOrigin();
      this.fitCameraToContent();
      this.updateGridFromContent();
      this.setStatus('', '');
    } catch (error) {
      if (requestId === this.loadRequestId) {
        this.setStatus(`Failed: ${error.message}`, 'error');
        console.error('Resource load error:', error);
      }
    } finally {
      if (requestId === this.loadRequestId) {
        this.isLoading = false;
      }
    }
  }

  async loadDirectGlb(url, nodeTransform, requestId) {
    return new Promise((resolve) => {
      this.gltfLoader.load(
        url,
        (gltf) => {
          // Check if this request is still current before adding to scene
          if (requestId !== this.loadRequestId) {
            resolve();
            return;
          }
          const model = gltf.scene;
          if (nodeTransform) {
            this.applyNodeTransform(model, nodeTransform);
          }
          this.contentGroup.add(model);
          this.loadedModels.push(model);
          if (this.loadedModels.length === 1) {
            this.centerContentAtOrigin();
          }
          resolve();
        },
        undefined,
        (error) => {
          console.warn(`Failed to load GLB ${url}:`, error);
          resolve();
        }
      );
    });
  }

  async loadResourceWithTransform(url, nodeTransform, requestId) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`Failed to fetch ${url}: HTTP ${response.status}`);
        return;
      }

      // Check if this request is still current
      if (requestId !== this.loadRequestId) return;

      const data = await response.json();
      await this.processResourceData(data, nodeTransform, requestId);
    } catch (error) {
      console.warn(`Error loading resource ${url}:`, error);
    }
  }


  async loadResourceJson(url) {
    if (this.isLoading) return;
    this.isLoading = true;

    this.clearScene();
    this.contentGroup = new THREE.Group();
    this.scene.add(this.contentGroup);
    this.setStatus('Loading resource...', 'loading');

    const requestId = ++this.loadRequestId;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      if (requestId !== this.loadRequestId) return;

      const data = await response.json();
      await this.processResourceData(data, null, requestId);

      if (requestId !== this.loadRequestId) return;

      this.fitCameraToContent();
      this.updateGridFromContent();
      this.setStatus('', '');
    } catch (error) {
      if (requestId === this.loadRequestId) {
        this.setStatus(`Failed: ${error.message}`, 'error');
        console.error('Resource load error:', error);
      }
    } finally {
      if (requestId === this.loadRequestId) {
        this.isLoading = false;
      }
    }
  }

  async processResourceData(data, nodeTransform = null, requestId = null) {
    // Handle metadata files (have lods, no blueprint)
    const lods = data?.lods || data?.LODs;
    if (lods && lods.length > 0) {
      const lod0 = lods[0];
      const glbName = typeof lod0 === 'string' ? lod0 : lod0.file || lod0.name;
      if (glbName) {
        const model = await this.loadGlb(glbName, requestId);
        if (model && (requestId === null || requestId === this.loadRequestId)) {
          if (nodeTransform) {
            this.applyNodeTransform(model, nodeTransform);
          }
          this.contentGroup.add(model);
          this.loadedModels.push(model);
          if (this.loadedModels.length === 1) {
            this.centerContentAtOrigin();
          }
        }
      }
      return;
    }

    // Handle scene files (have body.blueprint)
    const blueprint = data?.body?.blueprint;
    if (!blueprint) {
      console.warn('No blueprint or LODs in resource data');
      return;
    }

    // Check if this request is still current
    if (requestId !== null && requestId !== this.loadRequestId) return;

    // Process blueprint recursively to preserve group hierarchy (needed for rotators)
    const result = await this.processBlueprintNode(blueprint, requestId);
    if (result && (requestId === null || requestId === this.loadRequestId)) {
      if (nodeTransform) {
        this.applyNodeTransform(result, nodeTransform);
      }
      this.contentGroup.add(result);
      this.loadedModels.push(result);
      if (this.loadedModels.length === 1) {
        this.centerContentAtOrigin();
      }
    }
  }

  async processBlueprintNode(node, requestId = null) {
    // Check if request is still current
    if (requestId !== null && requestId !== this.loadRequestId) return null;

    const hasChildren = node.children && Array.isArray(node.children) && node.children.length > 0;
    const isPhysical = node.blueprintType === 'physical' && node.resourceReference;

    // Create transform for this node
    const pos = node.pos || [0, 0, 0];
    const rot = node.rot || [0, 0, 0, 1];
    const scale = node.scale || [1, 1, 1];

    // For nodes with children, create a THREE.Group
    if (hasChildren) {
      const group = new THREE.Group();
      group.name = node.name || 'group';

      // Apply local transform to group
      group.position.set(pos[0], pos[1], pos[2]);
      group.quaternion.set(rot[0], rot[1], rot[2], rot[3]);
      group.scale.set(scale[0], scale[1], scale[2]);

      // If this node also has a resource (e.g., sign with text children), load it first
      if (isPhysical) {
        const obj = {
          resourceReference: node.resourceReference,
          resourceName: node.resourceName,
          objectBounds: node.objectBounds,
          transform: new THREE.Matrix4()
        };
        const nodeModel = await this.loadPhysicalObject(obj, requestId);
        if (nodeModel) {
          group.add(nodeModel);
        }
      }

      // Process children and collect any rotators
      const pendingRotators = [];
      for (const child of node.children) {
        // Check if request is still current before each child
        if (requestId !== null && requestId !== this.loadRequestId) return null;

        // Check for rotator - handle specially
        if (child.resourceReference === 'action://rotator.json') {
          pendingRotators.push(child);
          continue;
        }

        const childResult = await this.processBlueprintNode(child, requestId);
        if (childResult) {
          group.add(childResult);
        }
      }

      // Set up rotators to target this group
      for (const rotatorNode of pendingRotators) {
        if (requestId !== null && requestId !== this.loadRequestId) return null;
        await this.setupRotator(rotatorNode, group, requestId);
      }

      return group.children.length > 0 || pendingRotators.length > 0 ? group : null;
    }

    // For leaf physical nodes, load the resource
    if (isPhysical) {
      const obj = {
        resourceReference: node.resourceReference,
        resourceName: node.resourceName,
        objectBounds: node.objectBounds,
        transform: new THREE.Matrix4()  // Identity - transform applied separately
      };

      const model = await this.loadPhysicalObject(obj, requestId);
      if (model) {
        // Apply local transform
        model.position.set(pos[0], pos[1], pos[2]);
        model.quaternion.set(rot[0], rot[1], rot[2], rot[3]);
        model.scale.set(scale[0], scale[1], scale[2]);
      }
      return model;
    }

    return null;
  }

  async setupRotator(rotatorNode, targetGroup, requestId = null) {
    const resourceName = rotatorNode.resourceName;
    if (!resourceName) return;

    try {
      const url = resolveResourceUrl('action://' + resourceName);
      const response = await fetch(url);
      if (!response.ok) return;

      // Check if request is still current after fetch
      if (requestId !== null && requestId !== this.loadRequestId) return;

      const data = await response.json();
      const axisArray = data?.body?.axis || [0, 1, 0];
      const speed = data?.body?.rotSpeed || 10;

      this.rotators.push({
        target: targetGroup,
        axis: new THREE.Vector3(axisArray[0], axisArray[1], axisArray[2]).normalize(),
        speed: speed
      });
    } catch (e) {
      console.warn(`Failed to load rotator params: ${resourceName}`);
    }
  }

  applyNodeTransform(model, transform) {
    if (!transform) return;

    const pos = transform.Position || transform.position || [0, 0, 0];
    const rot = transform.Rotation || transform.rotation || [0, 0, 0, 1];
    const scale = transform.Scale || transform.scale || [1, 1, 1];

    if (!isFinite(pos[0]) || !isFinite(pos[1]) || !isFinite(pos[2])) {
      return;
    }

    const offsetMatrix = new THREE.Matrix4();
    const position = new THREE.Vector3(pos[0], pos[1], pos[2]);
    const quaternion = new THREE.Quaternion(rot[0] || 0, rot[1] || 0, rot[2] || 0, rot[3] || 1);
    const scaleVec = new THREE.Vector3(scale[0] || 1, scale[1] || 1, scale[2] || 1);

    offsetMatrix.compose(position, quaternion, scaleVec);
    model.applyMatrix4(offsetMatrix);
  }

  async loadPhysicalObject(obj, requestId = null) {
    const { resourceReference, resourceName, objectBounds, transform } = obj;

    // Handle point lights
    if (resourceReference === 'action://pointlight.json') {
      return this.loadPointLight(resourceName, transform, requestId);
    }

    // Handle text sprites
    if (resourceReference === 'action://showtext.json') {
      return this.loadTextSprite(resourceName, transform, objectBounds, requestId);
    }

    // Skip non-visual action types (behavioral, UI, sync components)
    const nonVisualActions = [
      'action://collider.json',
      'action://interior.json',
      'action://video.json',
      'action://testswitch.json',
      'action://player_controller.json',
      'action://activity.json',
      'action://modeshow.json',
      'action://textinput.json',
      'action://demolight.json',
      'action://textsync.json',
      'action://button.json',
      'action://entitysync.json',
      'action://widgetframe.json',
      'action://actioncon.json',
    ];
    if (nonVisualActions.includes(resourceReference)) {
      return null;
    }

    // Handle nested scenes (action://scene.json means load resourceName as another scene)
    if (resourceReference === 'action://scene.json' && resourceName) {
      return this.loadNestedScene(resourceName, transform, requestId);
    }

    // Handle direct GLB/GLTF references
    const refLower = resourceReference.toLowerCase();
    if (refLower.endsWith('.glb') || refLower.endsWith('.gltf')) {
      const model = await this.loadGlb(resourceReference, requestId);
      if (model) {
        model.applyMatrix4(transform);
      }
      return model;
    }

    // Handle metadata files with LODs
    const metadata = await this.loadMetadata(resourceReference);
    const lods = metadata?.lods || metadata?.LODs;
    if (!metadata || !lods || lods.length === 0) {
      console.warn(`No LODs in metadata: ${resourceReference}`);
      return null;
    }

    const lod0 = lods[0];
    const glbName = typeof lod0 === 'string' ? lod0 : lod0.file || lod0.name;

    if (!glbName) {
      console.warn(`No GLB filename in metadata: ${resourceReference}`);
      return null;
    }

    const model = await this.loadGlb(glbName, requestId);
    if (!model) {
      return null;
    }

    model.applyMatrix4(transform);

    return model;
  }

  async loadNestedScene(sceneName, parentTransform, requestId = null) {
    try {
      const url = resolveResourceUrl('action://' + sceneName);
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`Failed to load nested scene: ${sceneName}`);
        return null;
      }

      // Check if request is still current after fetch
      if (requestId !== null && requestId !== this.loadRequestId) return null;

      const data = await response.json();
      const blueprint = data?.body?.blueprint;
      if (!blueprint) {
        console.warn(`No blueprint in nested scene: ${sceneName}`);
        return null;
      }

      // Process blueprint recursively to preserve group hierarchy
      const result = await this.processBlueprintNode(blueprint, requestId);
      return result;
    } catch (error) {
      console.warn(`Error loading nested scene ${sceneName}:`, error);
      return null;
    }
  }

  async loadTextSprite(resourceName, transform, objectBounds, requestId = null) {
    let text = 'Text';

    if (resourceName) {
      try {
        const url = resolveResourceUrl('action://' + resourceName);
        const response = await fetch(url);
        if (requestId !== null && requestId !== this.loadRequestId) return null;
        if (response.ok) {
          const data = await response.json();
          text = data?.body?.text || 'Text';
        }
      } catch (e) {
        console.warn(`Failed to load text params: ${resourceName}`);
      }
    }

    // Create canvas for text
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const fontSize = 64;
    ctx.font = `bold ${fontSize}px Arial`;

    // Measure text and size canvas
    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;
    const textHeight = fontSize * 1.2;

    canvas.width = Math.ceil(textWidth) + 20;
    canvas.height = Math.ceil(textHeight) + 20;

    // Redraw with correct canvas size
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    // Create plane mesh (respects rotation unlike sprites)
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.FrontSide,
      depthWrite: false
    });

    // Create 1-unit wide plane (aspect ratio preserved), scale handles final size
    const aspectRatio = canvas.height / canvas.width;
    const planeWidth = 1;
    const planeHeight = aspectRatio;

    const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
    const mesh = new THREE.Mesh(geometry, material);

    // Apply transform
    mesh.applyMatrix4(transform);

    return mesh;
  }

  async loadPointLight(resourceName, transform, requestId = null) {
    // Load light parameters from resourceName
    let color = new THREE.Color(1, 0.9, 0.8);  // Default warm white
    let intensity = 1;
    let distance = 100;

    if (resourceName) {
      try {
        const url = resolveResourceUrl('action://' + resourceName);
        const response = await fetch(url);
        if (requestId !== null && requestId !== this.loadRequestId) return null;
        if (response.ok) {
          const data = await response.json();
          const colorArray = data?.body?.color;
          if (colorArray && colorArray.length >= 3) {
            color = new THREE.Color(colorArray[0], colorArray[1], colorArray[2]);
            // Fourth value could be intensity or distance
            if (colorArray.length >= 4) {
              distance = colorArray[3];
              intensity = Math.min(colorArray[3] / 100, 10);  // Scale intensity
            }
          }
        }
      } catch (e) {
        console.warn(`Failed to load point light params: ${resourceName}`);
      }
    }

    // Create point light
    const light = new THREE.PointLight(color, intensity, distance);

    // Apply transform
    light.applyMatrix4(transform);

    return light;
  }

  async loadMetadata(metadataRef) {
    const url = resolveResourceUrl(metadataRef);
    if (!url) return null;

    if (this.metadataCache.has(url)) {
      return this.metadataCache.get(url);
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`Metadata not found: ${metadataRef}`);
        return null;
      }
      const metadata = await response.json();
      this.metadataCache.set(url, metadata);
      return metadata;
    } catch (error) {
      console.warn(`Failed to load metadata ${metadataRef}:`, error);
      return null;
    }
  }

  async loadGlb(glbName, requestId = null) {
    const url = resolveResourceUrl(glbName);

    if (this.glbCache.has(url)) {
      return this.glbCache.get(url).clone();
    }

    return new Promise((resolve) => {
      this.gltfLoader.load(
        url,
        (gltf) => {
          if (requestId !== null && requestId !== this.loadRequestId) {
            resolve(null);
            return;
          }
          this.glbCache.set(url, gltf.scene);
          resolve(gltf.scene.clone());
        },
        undefined,
        (error) => {
          console.warn(`Failed to load GLB ${glbName}:`, error);
          resolve(null);
        }
      );
    });
  }

  centerContentAtOrigin() {
    if (!this.contentGroup || this.loadedModels.length === 0) return;

    const boundingBox = new THREE.Box3();
    let validCount = 0;

    for (const model of this.loadedModels) {
      const modelBox = new THREE.Box3().setFromObject(model);
      if (!modelBox.isEmpty() && isFinite(modelBox.min.x) && isFinite(modelBox.max.x)) {
        boundingBox.union(modelBox);
        validCount++;
      }
    }

    if (boundingBox.isEmpty() || !isFinite(boundingBox.min.x) || validCount === 0) {
      return;
    }

    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    boundingBox.getCenter(center);
    boundingBox.getSize(size);

    const maxDim = Math.max(size.x, size.y, size.z);
    const targetSize = 1500;
    const minScale = 0.0001;
    const maxScale = 10000;
    let scale = maxDim > 0 ? targetSize / maxDim : 1;
    scale = Math.max(minScale, Math.min(maxScale, scale));

    if (!isFinite(scale) || !isFinite(center.x)) {
      return;
    }

    this.contentGroup.scale.setScalar(scale);
    this.contentGroup.position.set(
      -center.x * scale,
      -boundingBox.min.y * scale,
      -center.z * scale
    );

  }

  fitCameraToContent() {
    if (!this.contentGroup || this.loadedModels.length === 0) {
      this.resetCamera();
      return;
    }

    // Force update world matrices after centering transform was applied
    this.contentGroup.updateMatrixWorld(true);

    // Compute bounds by iterating valid models (setFromObject can return NaN if any child is invalid)
    const boundingBox = new THREE.Box3();
    let validCount = 0;

    for (const model of this.loadedModels) {
      const modelBox = new THREE.Box3().setFromObject(model);
      if (!modelBox.isEmpty() && isFinite(modelBox.min.x) && isFinite(modelBox.max.x) &&
          isFinite(modelBox.min.y) && isFinite(modelBox.max.y) &&
          isFinite(modelBox.min.z) && isFinite(modelBox.max.z)) {
        boundingBox.union(modelBox);
        validCount++;
      }
    }

    if (boundingBox.isEmpty() || validCount === 0) {
      this.resetCamera();
      return;
    }

    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    boundingBox.getCenter(center);
    boundingBox.getSize(size);

    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = this.camera.fov * (Math.PI / 180);
    const distance = (maxDim / 2) / Math.tan(fov / 2) * 1.5;

    const minDistance = 5;
    const maxDistance = 5000;
    const finalDistance = Math.max(minDistance, Math.min(maxDistance, distance));

    if (!isFinite(finalDistance) || !isFinite(center.x)) {
      this.resetCamera();
      return;
    }

    const direction = new THREE.Vector3(1, 0.5, 1).normalize();
    this.camera.position.copy(center).add(direction.multiplyScalar(finalDistance));
    this.controls.target.copy(center);
    this.controls.update();

    if (this.gridHelper && isFinite(boundingBox.min.y)) {
      this.gridHelper.position.y = boundingBox.min.y;
    }
  }

  resetCamera() {
    this.controls.target.set(0, 0, 0);
    this.camera.position.set(50, 30, 50);
    this.controls.update();
    if (this.gridHelper) {
      this.gridHelper.position.y = 0;
    }
  }

  clearScene() {
    if (!this.initialized) return;

    if (this.contentGroup) {
      this.scene.remove(this.contentGroup);
    }
    if (this.gridHelper) {
      this.gridHelper.position.y = 0;
    }
    this.loadedModels.forEach(model => {
      model.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => this.disposeMaterial(m));
          } else {
            this.disposeMaterial(child.material);
          }
        }
      });
    });
    this.loadedModels = [];
    this.contentGroup = null;
    this.currentResourceUrl = null;
    this.rotators = [];

    // Clear and dispose cached GLB scenes
    for (const [, cachedScene] of this.glbCache) {
      cachedScene.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => this.disposeMaterial(m));
          } else {
            this.disposeMaterial(child.material);
          }
        }
      });
    }
    this.glbCache.clear();
    this.metadataCache.clear();
  }

  disposeMaterial(material) {
    if (material.map) material.map.dispose();
    if (material.normalMap) material.normalMap.dispose();
    if (material.roughnessMap) material.roughnessMap.dispose();
    if (material.metalnessMap) material.metalnessMap.dispose();
    if (material.aoMap) material.aoMap.dispose();
    if (material.emissiveMap) material.emissiveMap.dispose();
    if (material.lightMap) material.lightMap.dispose();
    if (material.envMap) material.envMap.dispose();
    if (material.alphaMap) material.alphaMap.dispose();
    if (material.bumpMap) material.bumpMap.dispose();
    if (material.displacementMap) material.displacementMap.dispose();
    if (material.specularMap) material.specularMap.dispose();
    material.dispose();
  }

  dispose() {
    this.disposed = true;

    // Stop animation loop
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Stop camera animation
    if (this.cameraAnimationId) {
      cancelAnimationFrame(this.cameraAnimationId);
      this.cameraAnimationId = null;
    }

    // Remove event listeners
    window.removeEventListener('resize', this.boundResizeHandler);
    if (this.renderer?.domElement) {
      this.renderer.domElement.removeEventListener('dblclick', this.boundDblClickHandler);
    }

    // Clear scene content
    this.clearScene();

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
    if (this.keyLight) this.keyLight.dispose();
    if (this.rimLight) this.rimLight.dispose();
    if (this.cameraLight) this.cameraLight.dispose();

    // Dispose loaders
    if (this.dracoLoader) {
      this.dracoLoader.dispose();
    }
    if (this.ktx2Loader) {
      this.ktx2Loader.dispose();
    }

    // Dispose controls
    if (this.controls) {
      this.controls.dispose();
    }

    // Dispose renderer
    if (this.renderer) {
      this.renderer.dispose();
    }
  }

  setStatus(message, state = '') {
    const statusEl = this.container?.querySelector('.resource-status');
    if (statusEl) {
      statusEl.textContent = message;
      statusEl.className = 'resource-status';
      if (state) statusEl.classList.add(state);
    }
    this.statusCallbacks.forEach(cb => cb(message, state));
  }

  onStatus(callback) {
    this.statusCallbacks.push(callback);
  }

  offStatus(callback) {
    const index = this.statusCallbacks.indexOf(callback);
    if (index !== -1) {
      this.statusCallbacks.splice(index, 1);
    }
  }

  updateGridFromContent() {
    if (!this.gridHelper || !this.contentGroup || this.loadedModels.length === 0) {
      return;
    }

    const boundingBox = new THREE.Box3();
    for (const model of this.loadedModels) {
      const modelBox = new THREE.Box3().setFromObject(model);
      if (!modelBox.isEmpty() && isFinite(modelBox.min.x)) {
        boundingBox.union(modelBox);
      }
    }

    if (boundingBox.isEmpty()) {
      return;
    }

    const size = new THREE.Vector3();
    boundingBox.getSize(size);
    const characteristicSize = Math.cbrt(size.x * size.y * size.z);
    const spacing = calculateGridSpacing(characteristicSize);

    // Fade distance based on furthest extent from origin
    const center = new THREE.Vector3();
    boundingBox.getCenter(center);
    const maxExtent = Math.max(
      Math.abs(boundingBox.min.x), Math.abs(boundingBox.max.x),
      Math.abs(boundingBox.min.z), Math.abs(boundingBox.max.z)
    );
    spacing.fadeDistance = maxExtent;

    updateGridSpacing(this.gridHelper, spacing);
  }
}
