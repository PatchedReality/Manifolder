/**
 * Copyright (c) 2026 Patched Reality, Inc.
 *
 * NodeFactory - Resource data fetching and processing.
 * Node creation logic has moved to NodeAdapter.
 */

import { resolveResourceUrl } from './node-helpers.js';

export class NodeFactory {
  static async getResourceData(node) {
    if (!node.resourceUrl) return null;
    if (node._resourceData !== undefined) return node._resourceData;
    if (node._resourceLoading) return node._resourceLoading;

    node._resourceLoading = this.#fetchAndProcessResource(node.resourceUrl);
    try {
      node._resourceData = await node._resourceLoading;
    } catch (err) {
      console.error('Failed to fetch resource data:', node.resourceUrl, err);
      node._resourceData = null;
    }
    node._resourceLoading = null;
    return node._resourceData;
  }

  static async #fetchAndProcessResource(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('json')) {
      return null;
    }

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
