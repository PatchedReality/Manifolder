/**
 * Copyright (c) 2026 Patched Reality, Inc.
 */

let resourceBaseUrl = null;

/**
 * Sets the base URL for resolving relative resource paths.
 * This must be set from the MSF's sRootUrl before loading resources.
 */
export function setResourceBaseUrl(url) {
  if (!url) {
    resourceBaseUrl = null;
    return;
  }
  try {
    new URL(url);
    resourceBaseUrl = url.endsWith('/') ? url : url + '/';
  } catch (e) {
    console.error('Invalid resource base URL:', url, e);
    resourceBaseUrl = null;
  }
}

/**
 * Gets the current resource base URL.
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

  // Handle action:// protocol
  if (ref.startsWith('action://')) {
    const path = ref.slice('action://'.length);
    return resourceBaseUrl ? resourceBaseUrl + path : null;
  }

  // Handle full URLs - pass through unchanged
  if (ref.startsWith('http://') || ref.startsWith('https://')) {
    return ref;
  }

  // Relative paths: use resourceBaseUrl
  return resourceBaseUrl ? resourceBaseUrl + ref : null;
}

/**
 * Gets MSF reference URL from a node's pResource property.
 * Returns the URL if it points to an MSF file, null otherwise.
 */
export async function getMsfReference(node) {
  const ref = node?.resourceRef || node?.properties?.pResource?.sReference;
  if (!ref || typeof ref !== 'string') return null;

  if (ref.endsWith('.msf') || ref.endsWith('.msf.json')) {
    return ref;
  }

  if (ref.startsWith('http://') || ref.startsWith('https://')) {
    try {
      const response = await fetch(ref);
      if (!response.ok) return null;
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('json')) return null;
      const data = await response.json();
      if (data?.map?.sRequire && data?.map?.wClass !== undefined) {
        return ref;
      }
    } catch (e) {
      return null;
    }
  }

  return null;
}

