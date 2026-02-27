/*
 * Copyright 2026 Patched Reality, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import { TERRESTRIAL_TYPE_MAP, CELESTIAL_TYPE_MAP, PHYSICAL_TYPE } from '../shared/node-types.js';
import { resolveResourceUrl, rotateByQuaternion, multiplyQuaternions } from '../lib/ManifolderClient/node-helpers.js';
import { getOrbitData, calculateOrbitalPosition } from './orbital-helpers.js';

const NAME_FIELDS = {
  RMRoot: 'wsRMRootId',
  RMCObject: 'wsRMCObjectId',
  RMTObject: 'wsRMTObjectId',
  RMPObject: 'wsRMPObjectId'
};

const TYPE_TO_PREFIX = {
  RMRoot: 'root',
  RMCObject: 'celestial',
  RMTObject: 'terrestrial',
  RMPObject: 'physical',
};

const TIME_UNIT_TO_SECONDS = 1 / 64;

export class NodeAdapter {
  static scopeResourceRoots = new Map();


  static setScopeResourceRoot(scopeId, rootUrl) {
    if (!scopeId) return;
    if (!rootUrl) {
      NodeAdapter.scopeResourceRoots.delete(scopeId);
      return;
    }
    NodeAdapter.scopeResourceRoots.set(scopeId, rootUrl.endsWith('/') ? rootUrl : `${rootUrl}/`);
  }

  static getScopeResourceRoot(scopeId) {
    if (!scopeId) return null;
    return NodeAdapter.scopeResourceRoots.get(scopeId) || null;
  }

  static fromSearchResult({ id, name, type, nodeType, scopeId }) {
    const nameField = NAME_FIELDS[type];
    const stub = {
      sID: type,
      twObjectIx: id,
      sName: name,
      IsReady: () => false
    };
    if (nameField) {
      stub.pName = { [nameField]: name };
    }
    if (nodeType !== undefined) {
      stub.pType = { bType: nodeType };
    }
    const adapter = new NodeAdapter(stub, scopeId);
    adapter._isSearchStub = true;
    return adapter;
  }

  constructor(model, scopeId = null) {
    this._model = model;
    this.fabricScopeId = scopeId || model?.scopeId || model?.__scopeId || 'fs1_unknown';
    this.children = [];
    this._parent = null;
    this._isLoading = false;

    // Cached normalized properties (invalidated by markDirty)
    this._cachedTransform = undefined;
    this._cachedBound = undefined;

    // View-owned properties
    this._orbitData = null;
    this._planetContext = null;
    this._uid = null;
  }

  get type() { return this._model.sID; }

  get id() { return this._model.twObjectIx; }

  get nodeUid() {
    if (this._model?.nodeUid) return this._model.nodeUid;
    const typePrefix = TYPE_TO_PREFIX[this.type] || this.type.toLowerCase();
    return `${this.fabricScopeId}:${typePrefix}:${this.id}`;
  }

  get key() { return this.nodeUid; }

  get name() {
    const nameField = NAME_FIELDS[this.type];
    return this._model.pName?.[nameField] || this._model.sName || `${this.type} ${this.id}`;
  }

  get nodeType() {
    if (this.type === 'RMRoot') return 'Root';
    if (this.type === 'RMPObject') return PHYSICAL_TYPE;

    const bType = this._model.pType?.bType ?? this._model.bType;
    if (bType !== undefined) {
      if (this.type === 'RMCObject' && CELESTIAL_TYPE_MAP[bType]) {
        return CELESTIAL_TYPE_MAP[bType];
      }
      if (this.type === 'RMTObject' && TERRESTRIAL_TYPE_MAP[bType]) {
        return TERRESTRIAL_TYPE_MAP[bType];
      }
    }

    return this.type;
  }

  get transform() {
    if (this._cachedTransform !== undefined) return this._cachedTransform;
    this._cachedTransform = this._normalizeTransform();
    return this._cachedTransform;
  }

  get bound() {
    if (this._cachedBound !== undefined) return this._cachedBound;
    this._cachedBound = this._normalizeBound();
    return this._cachedBound;
  }

  get worldPos() {
    const t = this.transform;
    if (!t) return null;
    const localPos = t.position;
    const localRot = t.rotation;
    const parent = this._parent;

    if (!parent) {
      return { x: localPos.x, y: localPos.y, z: localPos.z };
    }

    const parentWorldPos = parent.worldPos;
    const parentWorldRot = parent.worldRot;
    if (!parentWorldPos || !parentWorldRot) {
      return { x: localPos.x, y: localPos.y, z: localPos.z };
    }

    const orbit = getOrbitData(this);
    if (orbit) {
      const orbitalOffset = calculateOrbitalPosition(orbit, 0);
      const rotatedOrbital = rotateByQuaternion(
        orbitalOffset.x, orbitalOffset.y, orbitalOffset.z,
        localRot.x, localRot.y, localRot.z, localRot.w
      );
      const worldOrbital = rotateByQuaternion(
        rotatedOrbital.x, rotatedOrbital.y, rotatedOrbital.z,
        parentWorldRot.x, parentWorldRot.y, parentWorldRot.z, parentWorldRot.w
      );
      return {
        x: parentWorldPos.x + worldOrbital.x,
        y: parentWorldPos.y + worldOrbital.y,
        z: parentWorldPos.z + worldOrbital.z
      };
    }

    const rotatedPos = rotateByQuaternion(
      localPos.x, localPos.y, localPos.z,
      parentWorldRot.x, parentWorldRot.y, parentWorldRot.z, parentWorldRot.w
    );
    return {
      x: parentWorldPos.x + rotatedPos.x,
      y: parentWorldPos.y + rotatedPos.y,
      z: parentWorldPos.z + rotatedPos.z
    };
  }

  get worldRot() {
    const t = this.transform;
    if (!t) return null;
    const localRot = t.rotation;
    const parent = this._parent;

    if (!parent) {
      return { x: localRot.x, y: localRot.y, z: localRot.z, w: localRot.w };
    }

    const parentWorldRot = parent.worldRot;
    if (!parentWorldRot) {
      return { x: localRot.x, y: localRot.y, z: localRot.z, w: localRot.w };
    }

    return multiplyQuaternions(parentWorldRot, localRot);
  }

  get isReady() {
    return this._model?.IsReady?.() ?? false;
  }

  get isLoading() {
    if (this._isLoading && this.isReady) {
      this._isLoading = false;
    }
    return this._isLoading;
  }

  set isLoading(value) {
    this._isLoading = value;
  }

  get _loaded() {
    if (!this.isReady) return false;
    const expected = this._model.nChildren ?? 0;
    if (this.children.length !== expected) return false;
    return this.children.every(c => c.isReady);
  }

  get hasChildren() {
    return (this._model.nChildren || 0) > 0
      || this.children.length > 0
      || this._model.__attachmentExpandable === true;
  }

  get resourceUrl() {
    return this._resolveResourceUrl(this._model.pResource);
  }

  get resourceRef() {
    return this._model.pResource?.sReference || null;
  }

  get resourceName() {
    return this._model.pResource?.sName || null;
  }

  get orbit() {
    if (this.type !== 'RMCObject') return null;
    const pOrbit = this._model.pOrbit_Spin;
    if (!pOrbit?.dA || pOrbit.dA === 0) return null;

    return {
      period: (pOrbit.tmPeriod || 0) * TIME_UNIT_TO_SECONDS,
      phaseOffset: (pOrbit.tmOrigin ?? pOrbit.tmStart ?? 0) * TIME_UNIT_TO_SECONDS,
      semiMajorAxis: pOrbit.dA,
      semiMinorAxis: pOrbit.dB || pOrbit.dA
    };
  }

  get properties() {
    return this._model;
  }

  get class() {
    return this._model.pType?.sClass || null;
  }

  get assetUrl() {
    return this.type === 'RMPObject' ? this._model.sAssetUrl || null : null;
  }

  get rawData() {
    return this._model;
  }

  markDirty() {
    this._cachedTransform = undefined;
    this._cachedBound = undefined;
  }

  updateModel(newModel) {
    this._model = newModel;
    this._isSearchStub = false;
    this.markDirty();
  }

  // --- Private helpers ---

  _normalizeTransform() {
    const pt = this._model.pTransform;
    if (!pt) return null;

    return {
      position: this._toVec3(pt.vPosition),
      rotation: this._toQuat(pt.qRotation),
      scale: this._toVec3(pt.vScale, 1)
    };
  }

  _normalizeBound() {
    const pb = this._model.pBound;
    if (!pb) return null;

    return {
      x: pb.dX || 0,
      y: pb.dY || 0,
      z: pb.dZ || 0
    };
  }

  _toVec3(v, def = 0) {
    if (!v) return { x: def, y: def, z: def };
    if (Array.isArray(v)) return { x: v[0] || def, y: v[1] || def, z: v[2] || def };
    return { x: v.dX ?? v.x ?? def, y: v.dY ?? v.y ?? def, z: v.dZ ?? v.z ?? def };
  }

  _toQuat(v) {
    if (!v) return { x: 0, y: 0, z: 0, w: 1 };
    if (Array.isArray(v)) return { x: v[0] ?? 0, y: v[1] ?? 0, z: v[2] ?? 0, w: v[3] ?? 1 };
    return { x: v.dX ?? v.x ?? 0, y: v.dY ?? v.y ?? 0, z: v.dZ ?? v.z ?? 0, w: v.dW ?? v.w ?? 1 };
  }

  _resolveResourceUrl(pResource) {
    if (!pResource) return null;
    const scopeBaseUrl = NodeAdapter.scopeResourceRoots.get(this.fabricScopeId) || null;

    const ref = pResource.sReference;
    const name = pResource.sName;

    if (ref && (ref.startsWith('http://') || ref.startsWith('https://'))) {
      return ref;
    }

    if (ref && ref.startsWith('action://') && name) {
      return resolveResourceUrl(name, scopeBaseUrl);
    }

    if (ref) {
      return resolveResourceUrl(ref, scopeBaseUrl);
    }

    return null;
  }
}
