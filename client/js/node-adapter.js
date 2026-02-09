/**
 * Copyright (c) 2026 Patched Reality, Inc.
 */

import { TERRESTRIAL_TYPE_MAP, CELESTIAL_TYPE_MAP, PHYSICAL_TYPE } from '../shared/node-types.js';
import { resolveResourceUrl } from './node-helpers.js';

const NAME_FIELDS = {
  RMRoot: 'wsRMRootId',
  RMCObject: 'wsRMCObjectId',
  RMTObject: 'wsRMTObjectId',
  RMPObject: 'wsRMPObjectId'
};

const TIME_UNIT_TO_SECONDS = 1 / 64;

export class NodeAdapter {
  constructor(model) {
    this._model = model;
    this.children = [];
    this._parent = null;
    this.liveUpdatesEnabled = false;

    // Cached normalized properties (invalidated by markDirty)
    this._cachedTransform = undefined;
    this._cachedBound = undefined;

    // View-owned computed properties
    this._worldPos = null;
    this._worldRot = null;
    this._orbitData = null;
    this._planetContext = null;
    this._uid = null;
  }

  get type() { return this._model.sID; }

  get id() { return this._model.twObjectIx; }

  get key() { return `${this.type}_${this.id}`; }

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

  get isReady() {
    return this._model?.IsReady?.() ?? false;
  }

  get _loaded() {
    if (!this.isReady) return false;
    const expected = this._model.nChildren ?? 0;
    if (this.children.length !== expected) return false;
    return this.children.every(c => c.isReady);
  }

  get hasChildren() {
    return (this._model.nChildren || 0) > 0 || this.children.length > 0;
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

    const ref = pResource.sReference;
    const name = pResource.sName;

    if (ref && (ref.startsWith('http://') || ref.startsWith('https://'))) {
      return ref;
    }

    if (ref && ref.startsWith('action://') && name) {
      return resolveResourceUrl(name);
    }

    if (ref) {
      return resolveResourceUrl(ref);
    }

    return null;
  }
}
