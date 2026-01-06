import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const NODE_COLORS = {
  RMRoot: 0xffd700,
  RMCObject: 0x4a9eff,
  RMTObject: 0x50c878,
  RMPObject: 0xff8c42
};

const HIGHLIGHT_INTENSITY = 1.5;
const DEFAULT_SPHERE_RADIUS = 1;
const CAMERA_ZOOM_PADDING = 2;

export class View3D {
  constructor(containerSelector) {
    this.container = document.querySelector(containerSelector);
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.nodes = new Map();
    this.nodeData = new Map();
    this.selectedId = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.selectCallbacks = [];
    this.animationId = null;

    this.init();
    this.animate();
  }

  init() {
    if (!this.container) {
      console.error('View3D: Container not found');
      return;
    }

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a1a);

    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 600;

    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100000);
    this.camera.position.set(0, 100, 200);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1;
    this.controls.screenSpacePanning = true;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight.position.set(100, 100, 100);
    this.scene.add(directionalLight);

    const gridHelper = new THREE.GridHelper(1000, 50, 0x444444, 0x333333);
    this.scene.add(gridHelper);

    this.setupEventListeners();
  }

  setupEventListeners() {
    window.addEventListener('resize', () => this.onWindowResize());

    this.renderer.domElement.addEventListener('click', (event) => this.onClick(event));
  }

  onWindowResize() {
    if (!this.container || !this.camera || !this.renderer) {
      return;
    }

    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  onClick(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const clickableObjects = [];
    this.nodes.forEach((obj) => {
      if (obj.userData && obj.userData.clickable) {
        if (obj.userData.isBox && obj.userData.hitbox) {
          clickableObjects.push(obj.userData.hitbox);
        } else {
          clickableObjects.push(obj);
        }
      }
    });

    const intersects = this.raycaster.intersectObjects(clickableObjects, false);

    if (intersects.length > 0) {
      const intersected = intersects[0].object;
      let nodeId = intersected.userData.nodeId;

      if (nodeId === undefined && intersected.parent) {
        nodeId = intersected.parent.userData.nodeId;
      }

      if (nodeId !== undefined) {
        this.selectNode(nodeId);
        const nodeData = this.nodeData.get(nodeId);
        if (nodeData) {
          this.selectCallbacks.forEach(cb => cb(nodeData));
        }
      }
    }
  }

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    if (this.controls) {
      this.controls.update();
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  setData(tree) {
    this.clearNodes();

    if (!tree) {
      return;
    }

    this.buildSceneFromTree(tree, { x: 0, y: 0, z: 0 });
    this.fitCameraToScene();
  }

  clearNodes() {
    this.nodes.forEach((obj) => {
      this.scene.remove(obj);
      this.disposeObject(obj);
    });
    this.nodes.clear();
    this.nodeData.clear();
    this.selectedId = null;
  }

  disposeObject(obj) {
    if (obj.children) {
      obj.children.forEach(child => this.disposeObject(child));
    }
    if (obj.geometry) {
      obj.geometry.dispose();
    }
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach(m => m.dispose());
      } else {
        obj.material.dispose();
      }
    }
  }

  buildSceneFromTree(node, parentPosition) {
    const position = this.getNodePosition(node, parentPosition);
    this.addNode(node, position);

    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        this.buildSceneFromTree(child, position);
      });
    }
  }

  getNodePosition(node, parentPosition) {
    let localPos = { x: 0, y: 0, z: 0 };

    if (node.transform && node.transform.position) {
      localPos = node.transform.position;
    }

    return {
      x: parentPosition.x + localPos.x,
      y: parentPosition.y + localPos.y,
      z: parentPosition.z + localPos.z
    };
  }

  addNode(nodeData, worldPosition) {
    const color = NODE_COLORS[nodeData.type] || 0xaaaaaa;
    let mesh;

    const hasBounds = nodeData.bound && nodeData.bound.x > 0;

    if (hasBounds) {
      mesh = this.createWireframeBox(nodeData.bound, color);
    } else {
      mesh = this.createSphere(DEFAULT_SPHERE_RADIUS, color);
    }

    if (worldPosition) {
      mesh.position.set(worldPosition.x, worldPosition.y, worldPosition.z);
    } else if (nodeData.transform && nodeData.transform.position) {
      const pos = nodeData.transform.position;
      mesh.position.set(pos.x, pos.y, pos.z);
    }

    mesh.userData.nodeId = nodeData.id;
    mesh.userData.clickable = true;
    mesh.userData.originalColor = color;

    this.scene.add(mesh);
    this.nodes.set(nodeData.id, mesh);
    this.nodeData.set(nodeData.id, nodeData);
  }

  createWireframeBox(bounds, color) {
    const group = new THREE.Group();

    const geometry = new THREE.BoxGeometry(bounds.x, bounds.y, bounds.z);
    const edges = new THREE.EdgesGeometry(geometry);
    const material = new THREE.LineBasicMaterial({ color: color });
    const wireframe = new THREE.LineSegments(edges, material);
    group.add(wireframe);

    const hitboxGeometry = new THREE.BoxGeometry(bounds.x, bounds.y, bounds.z);
    const hitboxMaterial = new THREE.MeshBasicMaterial({
      visible: false,
      transparent: true,
      opacity: 0
    });
    const hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
    group.add(hitbox);

    group.userData.wireframe = wireframe;
    group.userData.hitbox = hitbox;
    group.userData.isBox = true;

    geometry.dispose();

    return group;
  }

  createSphere(radius, color) {
    const geometry = new THREE.SphereGeometry(radius, 16, 12);
    const material = new THREE.MeshBasicMaterial({
      color: color,
      wireframe: true
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData.isSphere = true;
    return mesh;
  }

  selectNode(id) {
    if (this.selectedId !== null && this.selectedId !== id) {
      this.unhighlightNode(this.selectedId);
    }

    this.selectedId = id;
    this.highlightNode(id);
    this.zoomToNode(id);
  }

  highlightNode(id) {
    const mesh = this.nodes.get(id);
    if (!mesh) {
      return;
    }

    const originalColor = mesh.userData.originalColor;
    const highlightColor = new THREE.Color(originalColor);
    highlightColor.multiplyScalar(HIGHLIGHT_INTENSITY);

    if (mesh.userData.isBox && mesh.userData.wireframe) {
      mesh.userData.wireframe.material.color = highlightColor;
      mesh.userData.wireframe.material.linewidth = 2;
    } else if (mesh.material) {
      mesh.material.color = highlightColor;
    }
  }

  unhighlightNode(id) {
    const mesh = this.nodes.get(id);
    if (!mesh) {
      return;
    }

    const originalColor = new THREE.Color(mesh.userData.originalColor);

    if (mesh.userData.isBox && mesh.userData.wireframe) {
      mesh.userData.wireframe.material.color = originalColor;
      mesh.userData.wireframe.material.linewidth = 1;
    } else if (mesh.material) {
      mesh.material.color = originalColor;
    }
  }

  zoomToNode(id) {
    const mesh = this.nodes.get(id);
    if (!mesh) {
      return;
    }

    const nodeData = this.nodeData.get(id);
    let distance = 50;

    if (nodeData && nodeData.bound && nodeData.bound.x > 0) {
      const maxDim = Math.max(nodeData.bound.x, nodeData.bound.y, nodeData.bound.z);
      distance = maxDim * CAMERA_ZOOM_PADDING;
    }

    const targetPosition = mesh.position.clone();
    const cameraOffset = new THREE.Vector3(distance * 0.7, distance * 0.5, distance);
    const newCameraPosition = targetPosition.clone().add(cameraOffset);

    this.animateCamera(newCameraPosition, targetPosition);
  }

  animateCamera(targetCameraPos, targetLookAt) {
    const startPos = this.camera.position.clone();
    const startLookAt = this.controls.target.clone();
    const duration = 500;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = this.easeOutCubic(progress);

      this.camera.position.lerpVectors(startPos, targetCameraPos, eased);
      this.controls.target.lerpVectors(startLookAt, targetLookAt, eased);
      this.controls.update();

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  fitCameraToScene() {
    if (this.nodes.size === 0) {
      return;
    }

    const box = new THREE.Box3();

    this.nodes.forEach((mesh) => {
      box.expandByObject(mesh);
    });

    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    const fov = this.camera.fov * (Math.PI / 180);
    let cameraDistance = maxDim / (2 * Math.tan(fov / 2));
    cameraDistance *= 1.5;

    this.camera.position.set(
      center.x + cameraDistance * 0.5,
      center.y + cameraDistance * 0.5,
      center.z + cameraDistance
    );
    this.camera.lookAt(center);
    this.controls.target.copy(center);
    this.controls.update();
  }

  onSelect(callback) {
    this.selectCallbacks.push(callback);
  }
}
