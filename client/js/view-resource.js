/**
 * Copyright (c) 2026 Patched Reality, Inc.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Sky } from 'three/addons/objects/Sky.js';
import Hls from 'hls.js';
import { createSkyDome, createStarfield, createInfiniteGrid, calculateGridSpacing, updateGridSpacing } from './scene-helpers.js';
import { resolveResourceUrl } from './node-helpers.js';
import { calculateSunPosition, getSunLightingParams, calculateLatLong } from './geo-utils.js';
import { NODE_COLORS } from '../shared/node-types.js';

export class ViewResource {
  constructor(containerSelector, stateManager, model) {
    this.container = document.querySelector(containerSelector);
    this.stateManager = stateManager;
    this.model = model;
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
    this.videoPlanes = [];  // Video meshes for click-to-play
    this.hlsInstances = [];  // HLS.js instances for cleanup
    this.clock = new THREE.Clock();

    this.metadataCache = new Map();
    this.glbCache = new Map();

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.currentResourceUrl = null;
    this.currentNode = null;
    this.isLoading = false;
    this.loadRequestId = 0;  // Increments on each load to handle race conditions

    this.showBounds = false;
    this.boundsGroup = null;

    // Sun lighting state
    this.location = { latitude: 0, longitude: 0 }; // Default: equator/prime meridian
    this.timeOffset = 0; // Hours offset from current time
    this.isEarthBased = false;

    this.statusCallbacks = [];

    this.animationFrameId = null;
    this.disposed = false;
    this.initialized = false;

    this._bindModelEvents();
    this.init();
    if (this.initialized) {
      this.animate();
    }
  }

  _bindModelEvents() {
    this.model.on('selectionChanged', (node) => {
      if (!node) return;

      const planetContext = this.model.getPlanetContext(node);
      if (node._worldPos && planetContext?.radius) {
        const coords = calculateLatLong(node._worldPos, planetContext.radius);
        if (coords) {
          this.setLocation(coords.latitude, coords.longitude);
        } else {
          this.setLocation(0, 0);
        }
      } else {
        this.setLocation(0, 0);
      }

      this.setNode(node);
    });

    this.model.on('dataChanged', () => {
      this.currentResourceUrl = null;
      this._refreshIfSelected();
    });
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

    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100000);
    this.camera.position.set(50, 30, 50);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = .75;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // Environment map for soft IBL lighting
    this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.pmremGenerator.compileEquirectangularShader();
    const roomEnv = new RoomEnvironment();
    this.scene.environment = this.pmremGenerator.fromScene(roomEnv).texture;
    roomEnv.dispose();

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.2;

    // Late afternoon sunlight (shadow camera frustum set dynamically in _fitShadowCamera)
    this.keyLight = new THREE.DirectionalLight(0xffebd6, 2.1);
    this.keyLight.position.set(85, 52, 50);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.width = 4096;
    this.keyLight.shadow.mapSize.height = 4096;
    this.keyLight.shadow.bias = -0.0005;
    this.scene.add(this.keyLight);
    this.scene.add(this.keyLight.target);

    this.scene.add(this.camera);

    // Set up KTX2 loader for compressed textures (store for disposal)
    this.ktx2Loader = new KTX2Loader();
    this.ktx2Loader.setTranscoderPath('https://www.gstatic.com/basis-universal/versioned/2021-04-15-ba1c3e4/');
    this.ktx2Loader.detectSupport(this.renderer);
    this.gltfLoader.setKTX2Loader(this.ktx2Loader);

    this.gridHelper = createInfiniteGrid(this.scene);

    // Three.js Sky for daytime atmospheric scattering
    this.sky = new Sky();
    this.sky.scale.setScalar(450000);
    this.scene.add(this.sky);

    // Sky parameters - adjusted dynamically in updateSunLighting based on elevation
    const skyUniforms = this.sky.material.uniforms;
    skyUniforms.mieCoefficient.value = 0.005;
    skyUniforms.mieDirectionalG.value = 0.7;

    // Night sky - gradient dome and starfield
    this.skyDome = createSkyDome(this.scene);
    this.skyDome.visible = false;
    this.starfield = createStarfield(this.scene, { radius: 80000 });
    this.starfield.visible = false;

    this.setupTimeSlider();
    this.setResourceMode(false);

    // Invisible ground plane that only shows shadows
    const shadowPlaneGeo = new THREE.PlaneGeometry(2000, 2000);
    shadowPlaneGeo.rotateX(-Math.PI / 2);
    this.shadowPlane = new THREE.Mesh(shadowPlaneGeo, new THREE.ShadowMaterial({ opacity: 0.4 }));
    this.shadowPlane.receiveShadow = true;
    this.scene.add(this.shadowPlane);

    // Store bound handlers for cleanup
    this.boundResizeHandler = () => this.onWindowResize();
    this.boundDblClickHandler = (e) => this.onDoubleClick(e);
    this.boundClickHandler = (e) => this.onClick(e);

    window.addEventListener('resize', this.boundResizeHandler);
    this.setupEventListeners();
    this.setupBoundsToggle();
    this.initialized = true;
  }

  setupEventListeners() {
    this.renderer.domElement.addEventListener('dblclick', this.boundDblClickHandler);
    this.renderer.domElement.addEventListener('click', this.boundClickHandler);
  }

  setupTimeSlider() {
    // Calculate current solar time at location to set initial slider position
    const now = new Date();
    const currentSolarHours = (now.getUTCHours() + now.getUTCMinutes() / 60 + this.location.longitude / 15 + 24) % 24;
    // Slider is 0-24 starting from 8am, so convert current time to slider value
    const sliderValue = (currentSolarHours - 8 + 24) % 24;

    this.timeSlider = document.getElementById('time-slider');
    this.timeHourInput = document.getElementById('time-hour');
    this.timeMinuteInput = document.getElementById('time-minute');

    if (this.timeSlider) {
      this.timeSlider.value = sliderValue.toFixed(4);
      this.timeSliderValue = sliderValue;

      this.boundTimeSliderHandler = () => {
        this.timeSliderValue = parseFloat(this.timeSlider.value);
        this.updateSunLighting();
      };
      this.timeSlider.addEventListener('input', this.boundTimeSliderHandler);
    }

    if (this.timeHourInput && this.timeMinuteInput) {
      this.boundTimeInputHandler = () => {
        const h = parseInt(this.timeHourInput.value) || 0;
        const m = parseInt(this.timeMinuteInput.value) || 0;
        const solarHours = h + m / 60;
        this.timeSliderValue = (solarHours - 8 + 24) % 24;
        if (this.timeSlider) {
          this.timeSlider.value = this.timeSliderValue.toFixed(4);
        }
        this.updateSunLighting();
      };

      this.timeHourInput.addEventListener('change', this.boundTimeInputHandler);
      this.timeMinuteInput.addEventListener('change', this.boundTimeInputHandler);
    }

  }

  updateSunLighting() {
    // Calculate time: slider goes 0-24 hours starting from 8am
    const sliderHours = this.timeSliderValue ?? 4;
    const solarHours = (8 + sliderHours) % 24;

    // Create a date for sun position calculation
    const now = new Date();
    const utcHours = solarHours - this.location.longitude / 15;
    now.setUTCHours(Math.floor(utcHours), (utcHours % 1) * 60, 0, 0);

    const { azimuth, elevation } = calculateSunPosition(
      this.location.latitude,
      this.location.longitude,
      now
    );

    // Position directional light based on sun azimuth/elevation
    const elevRad = elevation * Math.PI / 180;
    const azimRad = azimuth * Math.PI / 180;

    const lightDir = new THREE.Vector3(
      Math.cos(elevRad) * Math.sin(azimRad),
      Math.sin(elevRad),
      Math.cos(elevRad) * Math.cos(azimRad)
    );
    const target = this.keyLight.target.position;
    const distance = this.keyLight.position.distanceTo(target) || 100;
    this.keyLight.position.copy(target).add(lightDir.multiplyScalar(distance));

    // Get lighting params based on sun elevation
    const params = getSunLightingParams(elevation);
    this.keyLight.color.setHex(params.color);
    this.keyLight.intensity = params.intensity;

    // Update Sky addon sun position (phi = zenith angle, theta = azimuth)
    const phi = (90 - elevation) * Math.PI / 180;
    const theta = azimuth * Math.PI / 180;
    const sunPosition = new THREE.Vector3().setFromSphericalCoords(1, phi, theta);
    this.sky.material.uniforms.sunPosition.value.copy(sunPosition);

    // Adjust sky parameters based on sun elevation
    // Keep clear blue sky until sun is very low, then ramp up haze for sunset
    let rayleigh, turbidity;
    if (elevation > 5) {
      // Daytime - clear blue sky
      rayleigh = 0.08;
      turbidity = 0.3;
    } else if (elevation > 0) {
      // Near horizon - ramp up for sunset/sunrise
      const t = (5 - elevation) / 5;
      rayleigh = 0.08 + t * (3 - 0.08);
      turbidity = 0.3 + t * (10 - 0.3);
    } else {
      // Below horizon
      rayleigh = 3;
      turbidity = 10;
    }
    this.sky.material.uniforms.rayleigh.value = rayleigh;
    this.sky.material.uniforms.turbidity.value = turbidity;

    // Day/night/twilight transitions
    if (elevation > 0) {
      // Daytime - use Sky addon
      this.sky.visible = true;
      this.skyDome.visible = false;
      this.starfield.visible = false;
    } else if (elevation > -12) {
      // Twilight - Sky fades out, stars fade in
      this.sky.visible = true;
      this.skyDome.visible = false;
      this.starfield.visible = true;
      this.starfield.material.opacity = Math.abs(elevation) / 12;
      this.starfield.material.transparent = true;
    } else {
      // Night - use skyDome gradient and starfield
      this.sky.visible = false;
      this.skyDome.visible = true;
      this.starfield.visible = true;
      this.starfield.material.opacity = 1;

      // Update night sky dome colors
      if (this.skyDome?.material?.uniforms) {
        this.skyDome.material.uniforms.uHorizonColor.value.setHex(params.skyHorizon);
        this.skyDome.material.uniforms.uZenithColor.value.setHex(params.skyZenith);
        this.skyDome.material.uniforms.uGroundColor.value.setHex(params.groundColor);
      }
    }

    // Update time inputs
    const h = Math.floor(solarHours);
    const m = Math.floor((solarHours % 1) * 60);
    if (this.timeHourInput && document.activeElement !== this.timeHourInput) {
      this.timeHourInput.value = h.toString().padStart(2, '0');
    }
    if (this.timeMinuteInput && document.activeElement !== this.timeMinuteInput) {
      this.timeMinuteInput.value = m.toString().padStart(2, '0');
    }
  }

  setLocation(latitude, longitude) {
    this.location = { latitude, longitude };
    this.isEarthBased = true;
    this.setResourceMode(true);
  }

  clearLocation() {
    this.isEarthBased = false;
    this.location = { latitude: 0, longitude: 0 };
  }

  setResourceMode(hasResource) {
    const showTimeControl = hasResource && this.isEarthBased;

    // Show/hide time control (left toolbar) - only for earth-based
    const toolbarLeft = this.container?.querySelector('.resource-toolbar-left');
    if (toolbarLeft) {
      toolbarLeft.style.display = showTimeControl ? '' : 'none';
    }

    // Show/hide bounds toggle (right toolbar) - for any resource
    const toolbar = this.container?.querySelector('.resource-toolbar');
    if (toolbar) {
      toolbar.style.display = hasResource ? '' : 'none';
    }

    // Toggle between sun lighting and starfield
    if (showTimeControl) {
      this.updateSunLighting();
    } else {
      // No resource or non-earth - show starfield night sky
      this.sky.visible = false;
      this.skyDome.visible = true;
      this.starfield.visible = true;
      this.starfield.material.opacity = 1;
      // Set night sky colors
      if (this.skyDome?.material?.uniforms) {
        this.skyDome.material.uniforms.uHorizonColor.value.setHex(0x0a0a15);
        this.skyDome.material.uniforms.uZenithColor.value.setHex(0x000010);
        this.skyDome.material.uniforms.uGroundColor.value.setHex(0x050508);
      }
      // Dim the key light
      if (this.keyLight) {
        this.keyLight.intensity = 0.3;
      }
    }
  }

  onClick(event) {
    if (this.videoPlanes.length === 0) return;

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.videoPlanes, false);

    if (intersects.length > 0) {
      const mesh = intersects[0].object;
      const video = mesh.userData.video;
      if (video) {
        if (video.paused) {
          video.muted = false;
          video.play();
        } else {
          video.pause();
        }
      }
    }
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
    this.skyDome.position.copy(this.camera.position);
    if (this.starfield) {
      this.starfield.position.copy(this.camera.position);
    }
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

  _refreshIfSelected() {
    const selectedNode = this.model.getSelectedNode();
    if (selectedNode) {
      this.setNode(selectedNode);
    }
  }

  setNode(node) {
    this.currentNode = node;

    if (!this.container.offsetHeight) return;

    clearTimeout(this._setNodeDebounce);
    this._setNodeDebounce = setTimeout(() => this._applySetNode(node), 150);
  }

  _applySetNode(node) {
    if (node !== this.currentNode) return;

    const resourceUrls = this._collectResourceUrls(node);
    if (resourceUrls.length === 0) {
      this.clearScene();
      this.currentResourceUrl = null;
      this.setStatus('No resource', '');
      this.setResourceMode(false);
      return;
    }

    const nodeKey = `${node.type}_${node.id}`;
    const cacheKey = `${nodeKey}:${resourceUrls.sort().join('|')}`;
    if (cacheKey === this.currentResourceUrl) {
      return;
    }

    this.currentResourceUrl = cacheKey;
    this.loadNodeHierarchy(node, resourceUrls.length);
  }

  _collectResourceUrls(node) {
    const urls = [];
    if (node.resourceUrl) urls.push(node.resourceUrl);
    if (this.model.isNodeExpanded(node) && node.children) {
      for (const child of node.children) {
        urls.push(...this._collectResourceUrls(child));
      }
    }
    return urls;
  }

  async loadNodeHierarchy(rootNode, resourceCount) {
    const requestId = ++this.loadRequestId;
    this.isLoading = true;

    this.clearScene();
    this.contentGroup = new THREE.Group();
    this.scene.add(this.contentGroup);
    this._precomputeScale(rootNode);
    this.setStatus(`Loading ${resourceCount} resource(s)...`, 'loading');

    const isCancelled = () => requestId !== this.loadRequestId;

    try {
      await this._loadNodeRecursive(rootNode, this.contentGroup, requestId, true);

      if (isCancelled()) {
        this.cleanupCancelledLoad();
        return;
      }

      this._precomputedScale = false;
      this.centerContentAtOrigin();
      this.fitCameraToContent();
      this.applyWorldOrientation();
      this.animateCameraToContent();
      this.updateGridFromContent();
      this.updateBoundsDisplay();
      this.setStatus('', '');
      this.setResourceMode(true);
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

  _applyNodeTransformToGroup(group, transform) {
    const pos = transform.position || { x: 0, y: 0, z: 0 };
    const rot = transform.rotation || { x: 0, y: 0, z: 0, w: 1 };
    const scl = transform.scale || { x: 1, y: 1, z: 1 };
    group.position.set(pos.x, pos.y, pos.z);
    group.quaternion.set(rot.x, rot.y, rot.z, rot.w);
    group.scale.set(scl.x, scl.y, scl.z);
  }

  async _loadNodeRecursive(node, parentGroup, requestId, isRoot = false) {
    if (requestId !== this.loadRequestId) return;

    const hasResource = !!node.resourceUrl;
    const expandedChildren = this.model.isNodeExpanded(node) && node.children;
    const hasTransform = !isRoot && node.transform;

    const needsGroup = hasTransform && (hasResource || expandedChildren);
    let target = parentGroup;

    if (needsGroup) {
      target = new THREE.Group();
      target.name = node.name || 'node';
      this._applyNodeTransformToGroup(target, node.transform);
      parentGroup.add(target);
    }

    if (hasResource) {
      const resourceRef = node.resourceRef;
      const actionType = resourceRef?.startsWith('action://')
        ? resourceRef.slice('action://'.length).split(/[:/]/)[0]
        : null;
      if (actionType === 'rotator' && node.resourceName) {
        await this.setupRotator({ resourceName: node.resourceName }, parentGroup, requestId);
      } else {
        const nodeTransform = (hasTransform && !needsGroup) ? node.transform : null;
        const lower = node.resourceUrl.toLowerCase();
        if (lower.endsWith('.glb') || lower.endsWith('.gltf')) {
          await this.loadDirectGlb(node.resourceUrl, nodeTransform, requestId, target);
        } else {
          await this.loadResourceWithTransform(node.resourceUrl, nodeTransform, requestId, target);
        }
      }
    }

    if (expandedChildren) {
      await Promise.all(node.children.map(child =>
        this._loadNodeRecursive(child, target, requestId)
      ));
    }
  }

  cleanupCancelledLoad() {
    if (this.contentGroup) {
      this.scene.remove(this.contentGroup);
      this.contentGroup = null;
    }
    this.loadedModels = [];
    this.rotators = [];

    // Clean up video elements from cancelled load
    for (const mesh of this.videoPlanes) {
      const video = mesh.userData.video;
      if (video) {
        video.pause();
        video.src = '';
        video.load();
      }
    }
    this.videoPlanes = [];

    for (const hls of this.hlsInstances) {
      hls.destroy();
    }
    this.hlsInstances = [];
  }

  async loadDirectGlb(url, nodeTransform, requestId, targetGroup = null) {
    return new Promise((resolve) => {
      this.gltfLoader.load(
        url,
        (gltf) => {
          const group = targetGroup || this.contentGroup;
          // Check if this request is still current before adding to scene
          if (requestId !== this.loadRequestId || !group) {
            resolve();
            return;
          }
          const model = gltf.scene;
          this.setupModelMaterials(model);
          if (nodeTransform) {
            this.applyNodeTransform(model, nodeTransform);
          }
          group.add(model);
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

  async loadActionResource(resourceRef, resourceName, nodeTransform, requestId, targetGroup = null) {
    const group = targetGroup || this.contentGroup;
    const actionType = resourceRef?.replace('action://', '').replace(/\.json$/, '');

    if (actionType === 'rotator' && resourceName) {
      await this.setupRotator({ resourceName }, group, requestId);
      return;
    }

    const transformMatrix = new THREE.Matrix4();
    if (nodeTransform) {
      const pos = nodeTransform.Position || nodeTransform.position || [0, 0, 0];
      const rot = nodeTransform.Rotation || nodeTransform.rotation || [0, 0, 0, 1];
      const scale = nodeTransform.Scale || nodeTransform.scale || [1, 1, 1];
      transformMatrix.compose(
        new THREE.Vector3(pos[0], pos[1], pos[2]),
        new THREE.Quaternion(rot[0] ?? 0, rot[1] ?? 0, rot[2] ?? 0, rot[3] ?? 1),
        new THREE.Vector3(scale[0] ?? 1, scale[1] ?? 1, scale[2] ?? 1)
      );
    }

    const obj = {
      resourceReference: resourceRef,
      resourceName: resourceName,
      objectBounds: null,
      transform: transformMatrix
    };

    const model = await this.loadPhysicalObject(obj, requestId);
    if (model && group && (requestId === null || requestId === this.loadRequestId)) {
      this.setupModelMaterials(model);
      group.add(model);
      this.loadedModels.push(model);
    }
  }

  async loadResourceWithTransform(url, nodeTransform, requestId, targetGroup = null) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`Failed to fetch ${url}: HTTP ${response.status}`);
        return;
      }

      if (requestId !== this.loadRequestId) return;

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('json')) {
        return;
      }

      const baseDir = url.substring(0, url.lastIndexOf('/') + 1);
      const data = await response.json();
      await this.processResourceData(data, nodeTransform, requestId, baseDir, targetGroup);
    } catch (error) {
      console.warn(`Error loading resource ${url}:`, error);
    }
  }

  async loadResourceJson(url) {
    if (this.isLoading) return;
    this.isLoading = true;

    // Default to Earth at 0/0 for direct URL loads
    if (!this.isEarthBased) {
      this.setLocation(0, 0);
    }

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

      const baseDir = url.substring(0, url.lastIndexOf('/') + 1);
      const data = await response.json();
      await this.processResourceData(data, null, requestId, baseDir);

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

  async processResourceData(data, nodeTransform = null, requestId = null, baseDir = null, targetGroup = null) {
    const group = targetGroup || this.contentGroup;

    // Handle metadata files (have lods, no blueprint)
    const lods = data?.lods || data?.LODs;
    if (lods && lods.length > 0) {
      const lod0 = lods[0];
      const glbName = typeof lod0 === 'string' ? lod0 : lod0._url || lod0.file || lod0.name;
      if (glbName) {
        const glbUrl = glbName.startsWith('http') ? glbName : (baseDir ? baseDir + glbName : glbName);
        const model = await this.loadGlb(glbUrl, requestId);
        if (model && group && (requestId === null || requestId === this.loadRequestId)) {
          this.setupModelMaterials(model);
          if (nodeTransform) {
            this.applyNodeTransform(model, nodeTransform);
          }
          group.add(model);
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
      return;
    }

    if (!this.isEarthBased && this.isSimplePhysicalBlueprint(blueprint)) {
      this.setLocation(0, 0);
    }

    if (requestId !== null && requestId !== this.loadRequestId) return;

    const result = await this.processBlueprintNode(blueprint, requestId);
    if (result && group && (requestId === null || requestId === this.loadRequestId)) {
      this.setupModelMaterials(result);
      if (nodeTransform) {
        this.applyNodeTransform(result, nodeTransform);
      }
      group.add(result);
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
        const childActionType = child.resourceReference?.startsWith('action://')
          ? child.resourceReference.split('/').pop().replace(/\.json$/, '')
          : null;
        if (childActionType === 'rotator') {
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

  isSimplePhysicalBlueprint(blueprint) {
    if (!blueprint) return false;

    const isPhysical = blueprint.blueprintType === 'physical' && blueprint.resourceReference;
    if (isPhysical) return true;

    if (blueprint.children && blueprint.children.length > 0) {
      const hasOnlyPhysicalChildren = blueprint.children.every(child =>
        child.blueprintType === 'physical' ||
        child.resourceReference?.startsWith('action://')
      );
      if (hasOnlyPhysicalChildren) return true;
    }

    return false;
  }

  async fetchResourceJson(resourceName, requestId = null) {
    if (!resourceName) return null;
    const url = resolveResourceUrl(resourceName);
    if (!url) {
      console.warn('fetchResourceJson: Could not resolve URL for', resourceName);
      return null;
    }

    try {
      const response = await fetch(url);
      if (requestId !== null && requestId !== this.loadRequestId) return null;
      if (!response.ok) {
        console.warn(`fetchResourceJson: HTTP ${response.status} for ${url}`);
        return null;
      }
      return await response.json();
    } catch (e) {
      console.error('fetchResourceJson: Failed to fetch', url, e);
      return null;
    }
  }

  async setupRotator(rotatorNode, targetGroup, requestId = null) {
    const data = await this.fetchResourceJson(rotatorNode.resourceName, requestId);
    if (!data) return;

    const parentLevels = data?.body?.parent || 0;
    let target = targetGroup;
    for (let i = 0; i < parentLevels && target.parent; i++) {
      target = target.parent;
    }

    const axisArray = data?.body?.axis || [0, 1, 0];
    const speed = data?.body?.rotSpeed || 10;

    this.rotators.push({
      target: target,
      axis: new THREE.Vector3(axisArray[0], axisArray[1], axisArray[2]).normalize(),
      speed: speed
    });
  }

  setupModelMaterials(model) {
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        // Ensure materials work with environment lighting
        if (child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          for (const mat of materials) {
            if (mat.isMeshStandardMaterial || mat.isMeshPhysicalMaterial) {
              mat.envMapIntensity = 1.0;
            }
          }
        }
      }
    });
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
    const quaternion = new THREE.Quaternion(rot[0] ?? 0, rot[1] ?? 0, rot[2] ?? 0, rot[3] ?? 1);
    const scaleVec = new THREE.Vector3(scale[0] ?? 1, scale[1] ?? 1, scale[2] ?? 1);

    offsetMatrix.compose(position, quaternion, scaleVec);
    model.applyMatrix4(offsetMatrix);
  }

  async loadPhysicalObject(obj, requestId = null) {
    const { resourceReference, resourceName, objectBounds, transform } = obj;

    // Extract action type from action:// references (strip .json if present)
    let actionType = null;
    if (resourceReference?.startsWith('action://')) {
      actionType = resourceReference.split('/').pop().replace(/\.json$/, '');
    }

    // Handle point lights
    if (actionType === 'pointlight') {
      return this.loadPointLight(resourceName, transform, requestId);
    }

    // Handle text sprites
    if (actionType === 'showtext') {
      return this.loadTextSprite(resourceName, transform, objectBounds, requestId);
    }

    // Handle video planes
    if (actionType === 'video') {
      return this.loadVideoPlane(resourceName, transform, objectBounds, requestId);
    }

    // Skip non-visual action types (behavioral, UI, sync components)
    const nonVisualActions = [
      'collider',
      'interior',
      'testswitch',
      'player_controller',
      'activity',
      'modeshow',
      'textinput',
      'demolight',
      'textsync',
      'button',
      'entitysync',
      'widgetframe',
      'actioncon',
      'motor',
      'rotator',
    ];
    if (actionType && nonVisualActions.includes(actionType)) {
      return null;
    }

    // Handle nested scenes (action://scene means load resourceName as another scene)
    if (actionType === 'scene' && resourceName) {
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
    const { metadata, baseDir } = await this.loadMetadata(resourceReference);
    const lods = metadata?.lods || metadata?.LODs;
    if (!metadata || !lods || lods.length === 0) {
      console.warn(`No LODs in metadata: ${resourceReference}`);
      return null;
    }

    const lod0 = lods[0];
    const glbName = typeof lod0 === 'string' ? lod0 : lod0._url || lod0.file || lod0.name;

    if (!glbName) {
      console.warn(`No GLB filename in metadata: ${resourceReference}`);
      return null;
    }

    const glbUrl = glbName.startsWith('http') ? glbName : (baseDir ? baseDir + glbName : glbName);
    const model = await this.loadGlb(glbUrl, requestId);
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

      if (requestId !== null && requestId !== this.loadRequestId) return null;

      const data = await response.json();
      const blueprint = data?.body?.blueprint;
      if (!blueprint) {
        console.warn(`No blueprint in nested scene: ${sceneName}`);
        return null;
      }

      return this.processBlueprintNode(blueprint, requestId);
    } catch (error) {
      console.warn(`Error loading nested scene ${sceneName}:`, error);
      return null;
    }
  }

  async loadTextSprite(resourceName, transform, objectBounds, requestId = null) {
    const data = await this.fetchResourceJson(resourceName, requestId);
    const text = data?.body?.text || 'Text';

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
    let color = new THREE.Color(1, 0.9, 0.8);
    let intensity = 1;
    let distance = 100;

    const data = await this.fetchResourceJson(resourceName, requestId);
    const colorArray = data?.body?.color;
    if (colorArray && colorArray.length >= 3) {
      color = new THREE.Color(colorArray[0], colorArray[1], colorArray[2]);
      if (colorArray.length >= 4) {
        distance = colorArray[3];
        intensity = Math.min(colorArray[3] / 100, 10);
      }
    }

    // Create point light
    const light = new THREE.PointLight(color, intensity, distance);

    // Apply transform
    light.applyMatrix4(transform);

    return light;
  }

  async loadVideoPlane(resourceName, transform, objectBounds, requestId = null) {
    const data = await this.fetchResourceJson(resourceName, requestId);
    const sources = data?.body?.streamConfig?.sources;
    const videoUrl = sources?.[0];

    if (!videoUrl) {
      return null;
    }

    // Create video element
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.loop = true;
    video.muted = true;
    video.playsInline = true;

    // Handle HLS streams
    const isHls = videoUrl.toLowerCase().includes('.m3u8');
    if (isHls && Hls.isSupported()) {
      const hls = new Hls();
      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS error:', data.type, data.details);
      });
      hls.loadSource(videoUrl);
      hls.attachMedia(video);
      this.hlsInstances.push(hls);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS support
      video.src = videoUrl;
    } else {
      video.src = videoUrl;
    }

    // Create video texture
    const texture = new THREE.VideoTexture(video);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.colorSpace = THREE.SRGBColorSpace;

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide
    });

    // Start with 1x1, update to video aspect when metadata loads
    const geometry = new THREE.PlaneGeometry(1, 1);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData.video = video;
    mesh.userData.isVideoPlane = true;

    let geometryUpdated = false;
    const updateGeometryFromVideo = () => {
      if (geometryUpdated) return true;
      if (video.videoWidth && video.videoHeight) {
        const aspect = video.videoWidth / video.videoHeight;
        mesh.geometry.dispose();
        mesh.geometry = new THREE.PlaneGeometry(aspect, 1);
        geometryUpdated = true;
        return true;
      }
      return false;
    };

    // Check if metadata already loaded, otherwise listen for multiple events
    // (Safari's native HLS may fire loadedmetadata with 0x0, but loadeddata has dimensions)
    if (!updateGeometryFromVideo()) {
      video.addEventListener('loadedmetadata', updateGeometryFromVideo, { once: true });
      video.addEventListener('loadeddata', updateGeometryFromVideo, { once: true });
      video.addEventListener('error', (e) => {
        console.error('Video error:', e, video.error);
      });
    }


    // Apply transform
    mesh.applyMatrix4(transform);

    // Track for click handling
    this.videoPlanes.push(mesh);

    return mesh;
  }

  async loadMetadata(metadataRef) {
    const url = resolveResourceUrl(metadataRef);
    if (!url) return { metadata: null, baseDir: null };

    if (this.metadataCache.has(url)) {
      const baseDir = url.substring(0, url.lastIndexOf('/') + 1);
      return { metadata: this.metadataCache.get(url), baseDir };
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`Metadata not found: ${metadataRef}`);
        return { metadata: null, baseDir: null };
      }
      const metadata = await response.json();
      this.metadataCache.set(url, metadata);
      const baseDir = url.substring(0, url.lastIndexOf('/') + 1);
      return { metadata, baseDir };
    } catch (error) {
      console.warn(`Failed to load metadata ${metadataRef}:`, error);
      return { metadata: null, baseDir: null };
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

  _nodeTransformToMatrix(transform) {
    const pos = transform.position || { x: 0, y: 0, z: 0 };
    const rot = transform.rotation || { x: 0, y: 0, z: 0, w: 1 };
    const scl = transform.scale || { x: 1, y: 1, z: 1 };
    return new THREE.Matrix4().compose(
      new THREE.Vector3(pos.x, pos.y, pos.z),
      new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w),
      new THREE.Vector3(scl.x, scl.y, scl.z)
    );
  }

  _computeNodeBounds(node, parentMatrix, isRoot = false) {
    const localMatrix = (!isRoot && node.transform)
      ? this._nodeTransformToMatrix(node.transform)
      : new THREE.Matrix4();

    const worldMatrix = new THREE.Matrix4().multiplyMatrices(parentMatrix, localMatrix);
    const bounds = new THREE.Box3();

    if (node.bound && node.bound.x != null && node.bound.y != null && node.bound.z != null) {
      const halfX = node.bound.x / 2;
      const halfZ = node.bound.z / 2;
      const localBox = new THREE.Box3(
        new THREE.Vector3(-halfX, 0, -halfZ),
        new THREE.Vector3(halfX, node.bound.y, halfZ)
      );
      const corners = [
        new THREE.Vector3(localBox.min.x, localBox.min.y, localBox.min.z),
        new THREE.Vector3(localBox.min.x, localBox.min.y, localBox.max.z),
        new THREE.Vector3(localBox.min.x, localBox.max.y, localBox.min.z),
        new THREE.Vector3(localBox.min.x, localBox.max.y, localBox.max.z),
        new THREE.Vector3(localBox.max.x, localBox.min.y, localBox.min.z),
        new THREE.Vector3(localBox.max.x, localBox.min.y, localBox.max.z),
        new THREE.Vector3(localBox.max.x, localBox.max.y, localBox.min.z),
        new THREE.Vector3(localBox.max.x, localBox.max.y, localBox.max.z),
      ];
      for (const corner of corners) {
        corner.applyMatrix4(worldMatrix);
        bounds.expandByPoint(corner);
      }
    } else if (!isRoot && node.transform) {
      const pos = new THREE.Vector3().setFromMatrixPosition(worldMatrix);
      bounds.expandByPoint(pos);
    }

    if (this.model.isNodeExpanded(node) && node.children) {
      for (const child of node.children) {
        const childBounds = this._computeNodeBounds(child, worldMatrix);
        if (!childBounds.isEmpty()) {
          bounds.union(childBounds);
        }
      }
    }

    return bounds;
  }

  _precomputeScale(rootNode) {
    const identity = new THREE.Matrix4();
    const bounds = this._computeNodeBounds(rootNode, identity, true);

    if (bounds.isEmpty() || !isFinite(bounds.min.x) || !isFinite(bounds.max.x)) {
      this.resetCamera();
      return;
    }

    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    bounds.getSize(size);
    bounds.getCenter(center);

    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim <= 0) {
      this.resetCamera();
      return;
    }

    const targetSize = 1500;
    const minScale = 0.0001;
    const maxScale = 10000;
    let scale = targetSize / maxDim;
    scale = Math.max(minScale, Math.min(maxScale, scale));

    this.contentGroup.scale.setScalar(scale);
    this._precomputedScale = true;

    const scaledSize = size.clone().multiplyScalar(scale);
    const finalDistance = this._cameraDistanceForSize(scaledSize);
    const scaledCenter = center.clone().multiplyScalar(scale);
    const direction = new THREE.Vector3(1, 0.5, 1).normalize();
    this.camera.position.copy(scaledCenter).add(direction.multiplyScalar(finalDistance));
    this.controls.target.copy(scaledCenter);
    this.controls.update();
  }

  _computeLoadedModelsBounds() {
    if (!this.contentGroup || this.loadedModels.length === 0) return null;

    this.contentGroup.updateMatrixWorld(true);

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

    if (boundingBox.isEmpty() || validCount === 0) return null;
    return boundingBox;
  }

  centerContentAtOrigin() {
    const boundingBox = this._computeLoadedModelsBounds();
    if (!boundingBox) return;

    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    boundingBox.getCenter(center);
    boundingBox.getSize(size);

    if (this._precomputedScale) {
      this.contentGroup.position.set(0, -boundingBox.min.y, 0);
    } else {
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
      this.contentGroup.position.set(0, -boundingBox.min.y * scale, 0);
    }
  }

  applyWorldOrientation() {
    if (!this.contentGroup || !this.currentNode?._worldRot) return;

    const worldRot = this.currentNode._worldRot;
    const quaternion = new THREE.Quaternion(worldRot.x, worldRot.y, worldRot.z, worldRot.w);

    // Extract just the yaw (rotation around Y) - ignore tilt from Earth's curvature
    const euler = new THREE.Euler().setFromQuaternion(quaternion, 'YXZ');
    this.contentGroup.rotation.y = euler.y;
  }

  animateCameraToContent() {
    const boundingBox = this._computeLoadedModelsBounds();
    if (!boundingBox) {
      this.resetCamera();
      return;
    }

    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    boundingBox.getCenter(center);
    boundingBox.getSize(size);

    const finalDistance = this._cameraDistanceForSize(size);
    if (!isFinite(finalDistance) || !isFinite(center.x)) {
      this.resetCamera();
      return;
    }

    this._positionGroundPlane(boundingBox.min.y);

    const direction = new THREE.Vector3(1, 0.5, 1).normalize();
    const targetPosition = center.clone().add(direction.multiplyScalar(finalDistance));
    this.animateCamera(targetPosition, center);
  }

  fitCameraToContent() {
    const boundingBox = this._computeLoadedModelsBounds();
    if (!boundingBox) {
      this.resetCamera();
      return;
    }

    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    boundingBox.getCenter(center);
    boundingBox.getSize(size);

    const finalDistance = this._cameraDistanceForSize(size);
    if (!isFinite(finalDistance) || !isFinite(center.x)) {
      this.resetCamera();
      return;
    }

    const direction = new THREE.Vector3(1, 0.5, 1).normalize();
    this.camera.position.copy(center).add(direction.multiplyScalar(finalDistance));
    this.controls.target.copy(center);
    this.controls.update();

    this._positionGroundPlane(boundingBox.min.y);
    this._fitShadowCamera(size, center);
  }

  _fitShadowCamera(size, center) {
    if (!this.keyLight) return;

    const maxDim = Math.max(size.x, size.y, size.z);
    const halfExtent = maxDim * 0.75;
    const shadow = this.keyLight.shadow;

    shadow.camera.left = -halfExtent;
    shadow.camera.right = halfExtent;
    shadow.camera.top = halfExtent;
    shadow.camera.bottom = -halfExtent;

    const lightDistance = halfExtent * 2;
    shadow.camera.near = lightDistance - halfExtent;
    shadow.camera.far = lightDistance + halfExtent;
    shadow.camera.updateProjectionMatrix();

    const lightDir = this.keyLight.position.clone().sub(center).normalize();
    if (lightDir.length() < 0.01) lightDir.set(1, 1, 1).normalize();
    this.keyLight.position.copy(center).add(lightDir.multiplyScalar(lightDistance));
    this.keyLight.target.position.copy(center);
    this.keyLight.target.updateMatrixWorld();

    shadow.needsUpdate = true;
  }

  _cameraDistanceForSize(size) {
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = this.camera.fov * (Math.PI / 180);
    const distance = (maxDim / 2) / Math.tan(fov / 2) * 1.5;
    return Math.max(5, Math.min(5000, distance));
  }

  _positionGroundPlane(minY) {
    if (!isFinite(minY)) return;
    if (this.gridHelper) this.gridHelper.position.y = minY;
    if (this.shadowPlane) this.shadowPlane.position.y = minY - 0.01;
  }

  resetCamera() {
    this.controls.target.set(0, 0, 0);
    this.camera.position.set(50, 30, 50);
    this.controls.update();
    this._positionGroundPlane(0);
  }

  clearScene() {
    if (!this.initialized) return;

    this._precomputedScale = false;

    if (this.contentGroup) {
      this.scene.remove(this.contentGroup);
    }
    this.clearBoundsGroup();
    this._positionGroundPlane(0);
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
    this.rotators = [];

    // Clean up video elements and HLS instances
    for (const mesh of this.videoPlanes) {
      const video = mesh.userData.video;
      if (video) {
        video.pause();
        video.src = '';
        video.load();
      }
    }
    this.videoPlanes = [];

    for (const hls of this.hlsInstances) {
      hls.destroy();
    }
    this.hlsInstances = [];

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
      this.renderer.domElement.removeEventListener('click', this.boundClickHandler);
    }

    // Remove bounds toggle listener
    const toggle = document.getElementById('resource-bounds-toggle');
    if (toggle && this.boundBoundsToggleHandler) {
      toggle.removeEventListener('change', this.boundBoundsToggleHandler);
    }

    // Remove time slider listeners
    if (this.timeSlider && this.boundTimeSliderHandler) {
      this.timeSlider.removeEventListener('input', this.boundTimeSliderHandler);
    }
    if (this.boundTimeInputHandler) {
      this.timeHourInput?.removeEventListener('change', this.boundTimeInputHandler);
      this.timeMinuteInput?.removeEventListener('change', this.boundTimeInputHandler);
    }

    // Clear scene content
    this.clearScene();

    // Dispose scene helpers
    for (const obj of [this.sky, this.skyDome, this.gridHelper, this.shadowPlane, this.starfield]) {
      if (obj) {
        obj.geometry?.dispose();
        obj.material?.dispose();
      }
    }

    // Dispose lights
    this.keyLight?.dispose();

    // Dispose environment
    this.scene?.environment?.dispose();
    this.pmremGenerator?.dispose();

    // Dispose loaders, controls, and renderer
    this.dracoLoader?.dispose();
    this.ktx2Loader?.dispose();
    this.controls?.dispose();
    this.renderer?.dispose();
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

  setupBoundsToggle() {
    const toggle = document.getElementById('resource-bounds-toggle');
    if (!toggle) return;

    // Restore saved state
    const state = this.stateManager?.getSection('viewResource') || {};
    if (typeof state.showBounds === 'boolean') {
      this.showBounds = state.showBounds;
      toggle.checked = state.showBounds;
    }

    this.boundBoundsToggleHandler = () => {
      this.showBounds = toggle.checked;
      this.updateBoundsDisplay();
      this.saveState();
    };
    toggle.addEventListener('change', this.boundBoundsToggleHandler);
  }

  saveState() {
    if (!this.stateManager) return;
    this.stateManager.updateSection('viewResource', {
      showBounds: this.showBounds
    });
  }

  restoreState(state) {
    state = state || this.stateManager?.getSection('viewResource') || {};

    if (typeof state.showBounds === 'boolean') {
      this.showBounds = state.showBounds;
      const toggle = document.getElementById('resource-bounds-toggle');
      if (toggle) {
        toggle.checked = state.showBounds;
      }
      this.updateBoundsDisplay();
    }
  }

  updateBoundsDisplay() {
    this.clearBoundsGroup();

    if (!this.showBounds || !this.contentGroup || !this.currentNode) return;

    this.boundsGroup = new THREE.Group();
    this.boundsGroup.name = 'boundsGroup';

    this._addBoundsRecursive(this.currentNode, this.boundsGroup, true);

    this.contentGroup.add(this.boundsGroup);
  }

  _addBoundsRecursive(node, parentGroup, isRoot = false) {
    const group = new THREE.Group();

    if (!isRoot && node.transform) {
      this._applyNodeTransformToGroup(group, node.transform);
    }

    if (node.bound) {
      const box = this.createNodeBoundingBox(node);
      if (box) {
        group.add(box);
      }
    }

    if (this.model.isNodeExpanded(node) && node.children) {
      for (const child of node.children) {
        this._addBoundsRecursive(child, group);
      }
    }

    parentGroup.add(group);
  }

  clearBoundsGroup() {
    if (!this.boundsGroup) return;

    this.boundsGroup.traverse((child) => {
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (child.material) {
        if (child.material.map) {
          child.material.map.dispose();
        }
        child.material.dispose();
      }
    });
    if (this.boundsGroup.parent) {
      this.boundsGroup.parent.remove(this.boundsGroup);
    }
    this.boundsGroup = null;
  }

  createNodeBoundingBox(node) {
    const bound = node.bound;
    if (!bound || bound.x == null || bound.y == null || bound.z == null) return null;

    const color = this.getNodeColor(node);
    const group = new THREE.Group();
    group.name = `bounds-${node.name || 'node'}`;

    const geometry = new THREE.BoxGeometry(bound.x, bound.y, bound.z);
    const edges = new THREE.EdgesGeometry(geometry);
    const material = new THREE.LineBasicMaterial({ color: color });
    const wireframe = new THREE.LineSegments(edges, material);

    wireframe.position.y = bound.y / 2;

    group.add(wireframe);

    const labelHeight = Math.max(bound.x, bound.y, bound.z) * 0.08;
    const label = this.createBoundsLabel(node.name || 'Node', color, labelHeight);
    label.position.set(0, bound.y + labelHeight * 0.6, 0);
    group.add(label);

    geometry.dispose();

    return group;
  }

  createBoundsLabel(text, color, worldHeight) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const fontSize = 48;
    const padding = 8;

    ctx.font = `bold ${fontSize}px Arial`;
    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;

    canvas.width = Math.ceil(textWidth) + padding * 2;
    canvas.height = fontSize + padding * 2;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Text
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.fillStyle = '#' + new THREE.Color(color).getHexString();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      depthWrite: false
    });

    const sprite = new THREE.Sprite(material);

    // Scale sprite based on requested world height, maintaining aspect ratio
    const aspectRatio = canvas.width / canvas.height;
    sprite.scale.set(worldHeight * aspectRatio, worldHeight, 1);

    return sprite;
  }

  getNodeColor(node) {
    if (!node.nodeType) return 0xffffff;
    return NODE_COLORS[node.nodeType] ?? 0xffffff;
  }
}
