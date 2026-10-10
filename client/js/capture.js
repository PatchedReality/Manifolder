import * as THREE from 'three';
import { Model } from './model.js';
import { ViewResource } from './view-resource.js';
import { validateSnapshot, captureCameraDistance } from './capture-contract.js';

const revision = typeof CAPTURE_REVISION === 'undefined' ? 'unbuilt' : CAPTURE_REVISION;
let used = false;
async function capture(request) {
  if (used) throw new Error('capture_context_already_used');
  used = true;
  if (request?.contractVersion !== 1) throw new Error('capture_contract_mismatch');
  const discovery = validateSnapshot(request.target, request.snapshot);
  const model = new Model({ on() {} });
  const root = model.setCaptureSnapshot(request.snapshot);
  const view = new ViewResource('#capture', null, model, { capture: true });
  if (!view.initialized) throw new Error('capture_webgl_unavailable');
  view.currentNode = root;
  await view.loadNodeHierarchy(root, discovery.resourceCount);
  if (view.captureAssetFailures.length || view.captureAssetProgress.loaded !== view.captureAssetProgress.total || view.captureAssetProgress.total > 1000 || view.nodeResourceGroups.size !== discovery.resourceCount || view.isLoading) throw new Error('capture_required_asset_failed');
  // No runtime animation, wall-clock sunlight, UI chrome, grid or sky contributes pixels.
  view.controls.enabled = false;
  for (const object of [view.gridHelper, view.sky, view.skyDome, view.starfield, view.shadowPlane, view.boundsGroup]) {
    if (object) object.visible = false;
  }
  view.scene.background = new THREE.Color(0xe7edf2);
  view.keyLight.color.setHex(0xffebd6);
  view.keyLight.intensity = 2.1;
  view.contentGroup.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(view.contentGroup);
  let meshCount = 0;
  view.contentGroup.traverse(object => {
    object.userData.captureOrder = meshCount;
    if (object.isMesh && object.geometry?.attributes?.position?.count > 0) meshCount++;
  });
  // Concurrent asset decoding changes allocation IDs. Three's default opaque sort
  // uses those IDs, making coplanar/blended pixels depend on network completion.
  // Preserve caller renderOrder and depth; break ties by stable scene traversal.
  const order = (a, b) => a.groupOrder - b.groupOrder || a.renderOrder - b.renderOrder;
  const tie = (a, b) => a.object.userData.captureOrder - b.object.userData.captureOrder;
  view.renderer.setOpaqueSort((a, b) => order(a, b) || a.z - b.z || tie(a, b));
  view.renderer.setTransparentSort((a, b) => order(a, b) || b.z - a.z || tie(a, b));
  if (!meshCount || bounds.isEmpty()) throw new Error('capture_no_geometry');
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  const radius = size.length() / 2;
  const distance = captureCameraDistance(radius, view.camera.fov, 640 / 360);
  view.camera.aspect = 640 / 360;
  view.camera.near = Math.max(0.001, (distance - radius) / 10);
  view.camera.far = (distance + radius) * 2;
  view.camera.position.copy(center).add(new THREE.Vector3(1, 0.65, 1).normalize().multiplyScalar(distance));
  view.camera.lookAt(center);
  view.camera.updateProjectionMatrix();
  view.keyLight.position.copy(center).add(new THREE.Vector3(1, 2, 1).normalize().multiplyScalar(distance));
  view._fitShadowCamera(size, center);
  await document.fonts.ready;
  await view.renderer.compileAsync(view.scene, view.camera);
  if (view.captureAssetFailures.length) throw new Error('capture_required_asset_failed');
  view.renderer.render(view.scene, view.camera);
  const gl = view.renderer.getContext();
  gl.finish();
  if (gl.isContextLost() || gl.getError() !== gl.NO_ERROR) throw new Error('capture_frame_failed');
  const jpeg = view.renderer.domElement.toDataURL('image/jpeg', 0.85);
  if (!jpeg.startsWith('data:image/jpeg;base64,') || atob(jpeg.split(',')[1]).length > 512 * 1024) throw new Error('capture_output_limit');
  const receipt = {
    contractVersion: 1, target: request.target, rendererRevision: revision,
    discovery: { source: 'controller-snapshot', closed: true, ...discovery },
    resources: { requiredNodeResources: discovery.resourceCount, completedNodeResources: view.nodeResourceGroups.size, failedAssets: 0, trackedAssets: view.captureAssetProgress.total, blueprintNodes: view.captureBlueprintNodes },
    camera: { min: bounds.min.toArray(), max: bounds.max.toArray(), position: view.camera.position.toArray(), near: view.camera.near, far: view.camera.far },
    frame: { ready: true, width: 640, height: 360, meshCount, animationTime: 0 },
  };
  return { receipt, jpeg };
}
window.manifolderCapture = Object.freeze({ contractVersion: 1, rendererRevision: revision, capture });
