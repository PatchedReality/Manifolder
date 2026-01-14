/**
 * Copyright (c) 2026 Patched Reality, Inc.
 */

const CDN_RES_BASE = 'https://cdn.rp1.com/res/';
const DEFAULT_JSON_PATH = 'glb/tiles/';

/**
 * Resolves a resource reference to a full URL.
 * Handles action:// protocol, full URLs, and relative paths.
 */
export function resolveResourceUrl(ref) {
  if (!ref || typeof ref !== 'string') return null;

  // Handle action:// protocol
  if (ref.startsWith('action://')) {
    const path = ref.slice('action://'.length);
    return CDN_RES_BASE + 'action/' + path;
  }

  // Handle full URLs
  if (ref.startsWith('http://') || ref.startsWith('https://')) {
    return ref;
  }

  // Default: assume glb/tiles path for relative references
  return CDN_RES_BASE + DEFAULT_JSON_PATH + ref;
}

/**
 * Gets MSF reference URL from a node's pResource property.
 * Returns the URL if it points to an MSF file, null otherwise.
 */
export function getMsfReference(node) {
  const ref = node?.properties?.pResource?.sReference;
  if (ref && typeof ref === 'string' && (ref.endsWith('.msf') || ref.endsWith('.msf.json'))) {
    return ref;
  }
  return null;
}

/**
 * Gets the resolved resource URL from a node's pResource property.
 * Returns full URL for JSON scene files or direct GLB/GLTF models.
 */
export function getResourceUrl(node) {
  const pResource = node?.properties?.pResource;
  if (!pResource) return null;

  const ref = pResource.sReference;
  const name = pResource.sName;

  if (ref && typeof ref === 'string') {
    const lower = ref.toLowerCase();

    // Full URL to JSON
    if (lower.endsWith('.json') && (ref.startsWith('http://') || ref.startsWith('https://'))) {
      return ref;
    }

    // Direct GLB/GLTF path
    if (lower.endsWith('.glb') || lower.endsWith('.gltf')) {
      return resolveResourceUrl(ref);
    }

    // Relative JSON in sReference (no http, no action://)
    if (lower.endsWith('.json') && !ref.startsWith('http://') && !ref.startsWith('https://') && !ref.startsWith('action://')) {
      return resolveResourceUrl(ref);
    }

    // action://* with sName being the actual filename
    if (ref.startsWith('action://') && name && typeof name === 'string') {
      const nameLower = name.toLowerCase();
      if (nameLower.endsWith('.json') && !name.startsWith('http://') && !name.startsWith('https://')) {
        // sName is the actual file, load from /res/action/
        return CDN_RES_BASE + 'action/' + name;
      }
    }
  }

  // Full URL JSON in sName
  if (name && typeof name === 'string') {
    const lower = name.toLowerCase();
    if (lower.endsWith('.json') && (name.startsWith('http://') || name.startsWith('https://'))) {
      return name;
    }
  }

  return null;
}
