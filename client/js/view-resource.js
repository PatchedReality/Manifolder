import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createStarfield, createInfiniteGrid } from './scene-helpers.js';
import { getResourceUrl } from './node-helpers.js';

const GLB_CDN_BASE = 'https://cdn.rp1.com/res/glb/tiles/';

export class ViewResource {
  constructor(containerSelector) {
    this.container = document.querySelector(containerSelector);
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;

    this.gltfLoader = new GLTFLoader();
    this.loadedModels = [];
    this.contentGroup = null;

    this.metadataCache = new Map();
    this.glbCache = new Map();

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.currentResourceUrl = null;
    this.currentNode = null;
    this.isLoading = false;

    this.statusCallbacks = [];

    this.init();
    this.animate();
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

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.2;

    const hemiLight = new THREE.HemisphereLight(0x4466aa, 0x1a1a2e, 0.8);
    hemiLight.position.set(0, 200, 0);
    this.scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff5e6, 2.0);
    keyLight.position.set(50, 100, 50);
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x6699ff, 0.8);
    rimLight.position.set(-50, 30, -50);
    this.scene.add(rimLight);

    const cameraLight = new THREE.PointLight(0xffffff, 0.3);
    this.camera.add(cameraLight);
    this.scene.add(this.camera);

    this.gridHelper = createInfiniteGrid(this.scene);
    createStarfield(this.scene, { radius: 2500 });

    window.addEventListener('resize', () => this.onWindowResize());
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.renderer.domElement.addEventListener('dblclick', (e) => this.onDoubleClick(e));
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
    const startPosition = this.camera.position.clone();
    const startLookAt = this.controls.target.clone();
    const duration = 500;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      this.camera.position.lerpVectors(startPosition, targetPosition, eased);
      this.controls.target.lerpVectors(startLookAt, targetLookAt, eased);
      this.controls.update();

      if (t < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
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
    requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  setNode(node, expandedDescendants = []) {
    this.currentNode = node;

    const resourcesToLoad = [];

    const nodeUrl = getResourceUrl(node);
    if (nodeUrl) {
      resourcesToLoad.push({ url: nodeUrl, transform: null });
    }

    for (const { node: childNode, cumulativeTransform } of expandedDescendants) {
      const childUrl = getResourceUrl(childNode);
      if (childUrl) {
        resourcesToLoad.push({ url: childUrl, transform: cumulativeTransform });
      }
    }

    if (resourcesToLoad.length === 0) {
      this.clearScene();
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
    if (this.isLoading) return;
    this.isLoading = true;

    this.clearScene();
    this.contentGroup = new THREE.Group();
    this.scene.add(this.contentGroup);
    this.setStatus(`Loading ${resourcesToLoad.length} resource(s)...`, 'loading');

    try {
      for (const { url, transform } of resourcesToLoad) {
        await this.loadResourceWithTransform(url, transform);
      }

      this.centerContentAtOrigin();
      this.fitCameraToContent();
      this.setStatus('', '');
    } catch (error) {
      this.setStatus(`Failed: ${error.message}`, 'error');
      console.error('Resource load error:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async loadResourceWithTransform(url, nodeTransform) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`Failed to fetch ${url}: HTTP ${response.status}`);
        return;
      }

      const data = await response.json();
      await this.processResourceData(data, nodeTransform);
    } catch (error) {
      console.warn(`Error loading resource ${url}:`, error);
    }
  }


  async loadResourceJson(url) {
    if (this.isLoading) return;
    this.isLoading = true;

    this.clearScene();
    this.setStatus('Loading resource...', 'loading');

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      await this.processResourceData(data);

      this.fitCameraToContent();
      this.setStatus('', '');
    } catch (error) {
      this.setStatus(`Failed: ${error.message}`, 'error');
      console.error('Resource load error:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async processResourceData(data, nodeTransform = null) {
    const blueprint = data?.body?.blueprint;
    if (!blueprint) {
      console.warn('No blueprint in resource data');
      return;
    }

    const physicalObjects = this.collectPhysicalObjects(blueprint);

    if (physicalObjects.length === 0) {
      return;
    }

    const loadPromises = physicalObjects.map(obj => this.loadPhysicalObject(obj));
    const models = await Promise.all(loadPromises);

    models.filter(Boolean).forEach(model => {
      if (nodeTransform) {
        this.applyNodeTransform(model, nodeTransform);
      }
      this.contentGroup.add(model);
      this.loadedModels.push(model);
    });
  }

  applyNodeTransform(model, transform) {
    if (!transform) return;

    const pos = transform.Position || transform.position || [0, 0, 0];
    const rot = transform.Rotation || transform.rotation || [0, 0, 0, 1];
    const scale = transform.Scale || transform.scale || [1, 1, 1];

    if (!isFinite(pos[0]) || !isFinite(pos[1]) || !isFinite(pos[2])) {
      console.warn('Invalid position in transform, skipping', pos);
      return;
    }

    const offsetMatrix = new THREE.Matrix4();
    const position = new THREE.Vector3(pos[0], pos[1], pos[2]);
    const quaternion = new THREE.Quaternion(rot[0] || 0, rot[1] || 0, rot[2] || 0, rot[3] || 1);
    const scaleVec = new THREE.Vector3(scale[0] || 1, scale[1] || 1, scale[2] || 1);

    offsetMatrix.compose(position, quaternion, scaleVec);
    model.applyMatrix4(offsetMatrix);
  }

  collectPhysicalObjects(node, parentTransform = null) {
    const objects = [];

    const worldTransform = this.computeWorldTransform(node, parentTransform);

    if (node.blueprintType === 'physical' && node.resourceReference) {
      objects.push({
        resourceReference: node.resourceReference,
        transform: worldTransform
      });
    }

    if (node.children && Array.isArray(node.children)) {
      node.children.forEach(child => {
        objects.push(...this.collectPhysicalObjects(child, worldTransform));
      });
    }

    return objects;
  }

  computeWorldTransform(node, parentTransform) {
    const pos = node.pos || [0, 0, 0];
    const rot = node.rot || [0, 0, 0, 1];
    const scale = node.scale || [1, 1, 1];

    const localMatrix = new THREE.Matrix4();
    const position = new THREE.Vector3(pos[0], pos[1], pos[2]);
    const quaternion = new THREE.Quaternion(rot[0], rot[1], rot[2], rot[3]);
    const scaleVec = new THREE.Vector3(scale[0], scale[1], scale[2]);

    localMatrix.compose(position, quaternion, scaleVec);

    if (parentTransform) {
      const worldMatrix = new THREE.Matrix4();
      worldMatrix.multiplyMatrices(parentTransform, localMatrix);
      return worldMatrix;
    }

    return localMatrix;
  }

  async loadPhysicalObject(obj) {
    const { resourceReference, transform } = obj;

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

    const model = await this.loadGlb(glbName);
    if (!model) {
      return null;
    }

    model.applyMatrix4(transform);

    return model;
  }

  async loadMetadata(metadataRef) {
    const url = `${GLB_CDN_BASE}${metadataRef}`;

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

  async loadGlb(glbName) {
    const url = `${GLB_CDN_BASE}${glbName}`;

    if (this.glbCache.has(url)) {
      return this.glbCache.get(url).clone();
    }

    return new Promise((resolve) => {
      this.gltfLoader.load(
        url,
        (gltf) => {
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
      console.warn('No valid bounding boxes found', {
        validCount,
        totalModels: this.loadedModels.length
      });
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
      console.warn('Invalid scale or center, skipping centering');
      return;
    }

    this.contentGroup.scale.setScalar(scale);
    this.contentGroup.position.copy(center).multiplyScalar(-scale);

    console.log('centerContent:', {
      originalCenter: center.toArray(),
      originalMin: boundingBox.min.toArray(),
      scale,
      expectedWorldMinY: (boundingBox.min.y - center.y) * scale,
      groupPosition: this.contentGroup.position.toArray()
    });
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
      console.warn('No valid bounding boxes in fitCamera', {
        validCount,
        totalModels: this.loadedModels.length
      });
      this.resetCamera();
      return;
    }

    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    boundingBox.getCenter(center);
    boundingBox.getSize(size);

    console.log('fitCamera bounds:', {
      center: center.toArray(),
      size: size.toArray(),
      min: boundingBox.min.toArray(),
      max: boundingBox.max.toArray()
    });

    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = this.camera.fov * (Math.PI / 180);
    const distance = (maxDim / 2) / Math.tan(fov / 2) * 1.5;

    const minDistance = 5;
    const maxDistance = 5000;
    const finalDistance = Math.max(minDistance, Math.min(maxDistance, distance));

    if (!isFinite(finalDistance) || !isFinite(center.x)) {
      console.warn('Invalid camera position, resetting');
      this.resetCamera();
      return;
    }

    const direction = new THREE.Vector3(1, 0.5, 1).normalize();
    this.camera.position.copy(center).add(direction.multiplyScalar(finalDistance));
    this.controls.target.copy(center);
    this.controls.update();

    if (this.gridHelper && isFinite(boundingBox.min.y)) {
      this.gridHelper.position.y = boundingBox.min.y - 0.1;
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
  }

  disposeMaterial(material) {
    if (material.map) material.map.dispose();
    if (material.normalMap) material.normalMap.dispose();
    if (material.roughnessMap) material.roughnessMap.dispose();
    if (material.metalnessMap) material.metalnessMap.dispose();
    if (material.aoMap) material.aoMap.dispose();
    if (material.emissiveMap) material.emissiveMap.dispose();
    material.dispose();
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
}
