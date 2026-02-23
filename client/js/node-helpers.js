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
export function resolveResourceUrl(ref, baseUrl = null) {
  if (!ref || typeof ref !== 'string') return null;
  const resolvedBaseUrl = baseUrl || resourceBaseUrl;

  // Handle action:// protocol
  if (ref.startsWith('action://')) {
    const path = ref.slice('action://'.length);
    return resolvedBaseUrl ? resolvedBaseUrl + path : null;
  }

  // Handle full URLs - pass through unchanged
  if (ref.startsWith('http://') || ref.startsWith('https://')) {
    return ref;
  }

  // Relative paths: use resourceBaseUrl
  return resolvedBaseUrl ? resolvedBaseUrl + ref : null;
}

/**
 * Gets MSF reference URL from a node's pResource property.
 * Returns the URL if it points to an MSF file, null otherwise.
 */
export function rotateByQuaternion(px, py, pz, qx, qy, qz, qw) {
  const ix = qw * px + qy * pz - qz * py;
  const iy = qw * py + qz * px - qx * pz;
  const iz = qw * pz + qx * py - qy * px;
  const iw = -qx * px - qy * py - qz * pz;

  return {
    x: ix * qw + iw * -qx + iy * -qz - iz * -qy,
    y: iy * qw + iw * -qy + iz * -qx - ix * -qz,
    z: iz * qw + iw * -qz + ix * -qy - iy * -qx
  };
}

export function multiplyQuaternions(q1, q2) {
  return {
    x: q1.w * q2.x + q1.x * q2.w + q1.y * q2.z - q1.z * q2.y,
    y: q1.w * q2.y - q1.x * q2.z + q1.y * q2.w + q1.z * q2.x,
    z: q1.w * q2.z + q1.x * q2.y - q1.y * q2.x + q1.z * q2.w,
    w: q1.w * q2.w - q1.x * q2.x - q1.y * q2.y - q1.z * q2.z
  };
}

export async function getMsfReference(node) {
  const ref = node?.resourceRef || node?.properties?.pResource?.sReference;
  if (!ref || typeof ref !== 'string') return null;

  const path = ref.split(/[?#]/, 1)[0];

  if (path.endsWith('.msf') || path.endsWith('.msf.json')) {
    return ref;
  }

  const needsFetch = path.endsWith('.json') || /\/\d+\/\d+$/.test(path);
  if (!needsFetch) return null;

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
