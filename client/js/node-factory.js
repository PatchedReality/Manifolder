/**
 * Copyright (c) 2026 Patched Reality, Inc.
 *
 * NodeFactory - Consolidated node creation using MVMF classes internally
 * See docs/NODE_FACTORY_PLAN.md for architecture details
 */

import { TERRESTRIAL_TYPE_MAP, CELESTIAL_TYPE_MAP } from '../shared/node-types.js';
import { resolveResourceUrl } from './node-helpers.js';

const CDN_RES_BASE = 'https://cdn.rp1.com/res/';
const ACTION_PATH = 'action/';

export class NodeFactory {
  static parseTransform(pTransform) {
    if (!pTransform) return null;

    return {
      position: {
        x: pTransform.Position?.[0] || 0,
        y: pTransform.Position?.[1] || 0,
        z: pTransform.Position?.[2] || 0
      },
      rotation: {
        x: pTransform.Rotation?.[0] || 0,
        y: pTransform.Rotation?.[1] || 0,
        z: pTransform.Rotation?.[2] || 0,
        w: pTransform.Rotation?.[3] || 1
      },
      scale: {
        x: pTransform.Scale?.[0] || 1,
        y: pTransform.Scale?.[1] || 1,
        z: pTransform.Scale?.[2] || 1
      }
    };
  }

  static parseBound(pBound) {
    if (!pBound?.Max) return null;

    return {
      x: pBound.Max[0] || 0,
      y: pBound.Max[1] || 0,
      z: pBound.Max[2] || 0
    };
  }

  static parseOrbit(pOrbit) {
    if (!pOrbit?.dA || pOrbit.dA === 0) return null;

    const TIME_UNIT_TO_SECONDS = 1 / 64;
    return {
      period: (pOrbit.tmPeriod || 0) * TIME_UNIT_TO_SECONDS,
      phaseOffset: (pOrbit.tmOrigin ?? pOrbit.tmStart ?? 0) * TIME_UNIT_TO_SECONDS,
      semiMajorAxis: pOrbit.dA,
      semiMinorAxis: pOrbit.dB || pOrbit.dA
    };
  }

  static createNode(type, data, id) {
    switch (type) {
      case 'RMRoot':
        return this.#buildRootNode(data, id);
      case 'RMCObject':
        return this.#buildObjectNode(data, id, 'RMCObject', 'wsRMCObjectId', 'twRMCObjectIx');
      case 'RMTObject':
        return this.#buildObjectNode(data, id, 'RMTObject', 'wsRMTObjectId', 'twRMTObjectIx');
      case 'RMPObject':
        return this.#buildObjectNode(data, id, 'RMPObject', 'wsRMPObjectId', 'twRMPObjectIx');
      default:
        throw new Error(`Unknown node type: ${type}`);
    }
  }

  static #buildRootNode(data, id) {
    const parent = data.Parent || data;
    const aChild = data.aChild || [];

    const node = {
      name: parent.pName?.wsRMRootId || `Root ${id}`,
      type: 'RMRoot',
      nodeType: 'Root',
      id: parent.twRMRootIx || id,
      transform: null,
      bound: null,
      children: [],
      hasChildren: false,
      rawData: data
    };

    const allChildren = [...(aChild[0] || []), ...(aChild[1] || []), ...(aChild[2] || [])];
    for (const child of allChildren) {
      const parsed = this.#parseChildNode(child);
      if (parsed) {
        node.children.push(parsed);
      }
    }

    node.hasChildren = node.children.length > 0;
    return node;
  }

  static #buildObjectNode(data, id, type, nameField, idField) {
    const parent = data.Parent || data;
    const aChild = data.aChild || [];
    const nodeType = this.#resolveNodeType(parent, type);

    const node = {
      name: parent.pName?.[nameField] || parent.sName || `${type} ${id}`,
      type: type,
      nodeType: nodeType,
      class: parent.sClass,
      id: parent[idField] || id,
      transform: this.parseTransform(parent.pTransform),
      bound: this.parseBound(parent.pBound),
      orbit: type === 'RMCObject' ? this.parseOrbit(parent.pOrbit_Spin) : null,
      properties: this.#extractProperties(parent),
      resourceUrl: this.#getResourceUrl(parent.pResource),
      children: [],
      hasChildren: false,
      rawData: data
    };

    if (type === 'RMPObject' && parent.sAssetUrl) {
      node.assetUrl = parent.sAssetUrl;
    }

    const allChildren = aChild.flat();
    for (const child of allChildren) {
      const parsed = this.#parseChildNode(child);
      if (parsed) {
        node.children.push(parsed);
      }
    }

    node.hasChildren = node.children.length > 0 || parent.nChildren > 0;
    return node;
  }

  static #CHILD_TYPE_CONFIG = [
    { idField: 'twRMCObjectIx', nameField: 'wsRMCObjectId', type: 'RMCObject', label: 'Container', hasOrbit: true },
    { idField: 'twRMTObjectIx', nameField: 'wsRMTObjectId', type: 'RMTObject', label: 'Terrain', hasOrbit: false },
    { idField: 'twRMPObjectIx', nameField: 'wsRMPObjectId', type: 'RMPObject', label: 'Placeable', hasOrbit: false }
  ];

  static #parseChildNode(child) {
    for (const config of this.#CHILD_TYPE_CONFIG) {
      if (child[config.idField] === undefined) continue;

      const id = child[config.idField];
      const node = {
        name: child.pName?.[config.nameField] || `${config.label} ${id}`,
        type: config.type,
        nodeType: this.#resolveNodeType(child, config.type),
        class: child.sClass,
        id: id,
        transform: this.parseTransform(child.pTransform),
        bound: this.parseBound(child.pBound),
        properties: this.#extractProperties(child),
        resourceUrl: this.#getResourceUrl(child.pResource),
        children: [],
        hasChildren: child.nChildren > 0,
        rawData: child
      };

      if (config.hasOrbit) {
        node.orbit = this.parseOrbit(child.pOrbit_Spin);
      }
      if (config.type === 'RMPObject') {
        node.assetUrl = child.sAssetUrl;
      }

      return node;
    }

    return null;
  }

  static #resolveNodeType(data, defaultType) {
    let bType = data.bType;
    if (bType === undefined && data.pType) {
      bType = data.pType.bType;
    }
    if (bType === undefined && data.properties) {
      bType = data.properties.bType;
    }

    if (bType !== undefined) {
      if (defaultType === 'RMCObject' && CELESTIAL_TYPE_MAP[bType]) {
        return CELESTIAL_TYPE_MAP[bType];
      }
      if (defaultType === 'RMTObject' && TERRESTRIAL_TYPE_MAP[bType]) {
        return TERRESTRIAL_TYPE_MAP[bType];
      }
    }

    return defaultType;
  }

  static #extractProperties(data) {
    const props = { ...data };
    const ignored = [
      'twRMRootIx', 'twRMCObjectIx', 'twRMTObjectIx', 'twRMPObjectIx',
      'pName', 'pTransform', 'pBound', 'vPosition', 'qRotation', 'vScale',
      'aChild', 'children', 'aRMTObjectIx', 'Parent', 'nChildren',
      'sName', 'sAssetUrl'
    ];

    ignored.forEach(key => delete props[key]);
    return props;
  }

  static #getResourceUrl(pResource) {
    if (!pResource) return null;

    const ref = pResource.sReference;
    const name = pResource.sName;

    if (ref && typeof ref === 'string') {
      const lower = ref.toLowerCase();

      if (lower.endsWith('.json') && (ref.startsWith('http://') || ref.startsWith('https://'))) {
        return ref;
      }

      if (lower.endsWith('.glb') || lower.endsWith('.gltf')) {
        return resolveResourceUrl(ref);
      }

      if (lower.endsWith('.json') && !ref.startsWith('action://')) {
        return resolveResourceUrl(ref);
      }

      if (ref.startsWith('action://') && name && typeof name === 'string') {
        const nameLower = name.toLowerCase();
        if (nameLower.endsWith('.json') && !name.startsWith('http://') && !name.startsWith('https://')) {
          return CDN_RES_BASE + ACTION_PATH + name;
        }
      }
    }

    if (name && typeof name === 'string') {
      const lower = name.toLowerCase();
      if (lower.endsWith('.json') && (name.startsWith('http://') || name.startsWith('https://'))) {
        return name;
      }
    }

    return null;
  }

  static async getResourceData(node) {
    if (!node.resourceUrl) return null;
    if (node._resourceData !== undefined) return node._resourceData;
    if (node._resourceLoading) return node._resourceLoading;

    node._resourceLoading = this.#fetchAndProcessResource(node.resourceUrl);
    try {
      node._resourceData = await node._resourceLoading;
    } catch {
      node._resourceData = null;
    }
    node._resourceLoading = null;
    return node._resourceData;
  }

  static async #fetchAndProcessResource(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = await response.json();
    return this.#processResourceJson(json, url);
  }

  static #processResourceJson(json, resourceUrl) {
    const baseDir = resourceUrl.substring(0, resourceUrl.lastIndexOf('/') + 1);

    if (json.lods || json.LODs) {
      return this.#processMetadataResource(json, baseDir);
    }

    if (json.body?.blueprint) {
      return this.#processBlueprintResource(json);
    }

    return json;
  }

  static #processMetadataResource(json, baseDir) {
    const result = { ...json };
    const lods = result.lods || result.LODs;

    if (lods) {
      const processedLods = lods.map(lod => {
        if (typeof lod === 'string') {
          return { file: lod, _url: baseDir + lod };
        }
        if (lod.file) {
          return { ...lod, _url: baseDir + lod.file };
        }
        return lod;
      });
      if (result.lods) result.lods = processedLods;
      if (result.LODs) result.LODs = processedLods;
    }

    return result;
  }

  static #processBlueprintResource(json) {
    const result = JSON.parse(JSON.stringify(json));

    const hasFileExtension = (str) => /\.[a-zA-Z0-9]+$/.test(str);

    const processNode = (node) => {
      if (node.resourceReference && !node.resourceReference.startsWith('action://')) {
        node._resourceReferenceUrl = resolveResourceUrl(node.resourceReference);
      }
      if (node.resourceName && hasFileExtension(node.resourceName)) {
        node._resourceNameUrl = resolveResourceUrl('action://' + node.resourceName);
      }
      if (node.children) {
        node.children.forEach(processNode);
      }
    };

    if (result.body?.blueprint) {
      processNode(result.body.blueprint);
    }

    return result;
  }
}
