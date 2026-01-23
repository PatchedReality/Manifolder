/**
 * Copyright (c) 2026 Patched Reality, Inc.
 */

const ACTION_CDN_BASE = 'https://cdn.rp1.com/res/action/';
const LEGACY_CDN_BASE = 'https://cdn.rp1.com/res/glb/tiles/';

let resourceBaseUrl = null;

/**
 * Sets the base URL for resolving relative resource paths.
 * When set, relative paths resolve against this URL.
 * When null/empty, falls back to legacy CDN behavior.
 */
export function setResourceBaseUrl(url) {
  if (!url) {
    resourceBaseUrl = null;
    return;
  }
  try {
    const parsed = new URL(url);
    resourceBaseUrl = parsed.origin + '/';
  } catch (e) {
    resourceBaseUrl = null;
  }
}

/**
 * Gets the current resource base URL, or null if using legacy fallback.
 */
export function getResourceBaseUrl() {
  return resourceBaseUrl;
}

/**
 * Resolves a resource reference to a full URL.
 * Handles action:// protocol, full URLs, and relative paths.
 */
export function resolveResourceUrl(ref) {
  if (!ref || typeof ref !== 'string') return null;

  // Handle action:// protocol - always goes to global CDN
  if (ref.startsWith('action://')) {
    const path = ref.slice('action://'.length);
    return ACTION_CDN_BASE + path;
  }

  // Handle full URLs - pass through unchanged
  if (ref.startsWith('http://') || ref.startsWith('https://')) {
    return ref;
  }

  // Relative paths: use resourceBaseUrl if set, otherwise legacy CDN fallback
  if (resourceBaseUrl) {
    return resourceBaseUrl + ref;
  }
  return LEGACY_CDN_BASE + ref;
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

