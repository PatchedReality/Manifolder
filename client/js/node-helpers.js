/**
 * Gets the resource URL from a node's pResource property.
 * Returns URLs for JSON scene files or direct GLB/GLTF models.
 * Checks sReference first, then falls back to sName.
 */
export function getResourceUrl(node) {
  const pResource = node?.properties?.pResource;
  if (!pResource) return null;

  const ref = pResource.sReference;
  if (ref && typeof ref === 'string') {
    const lower = ref.toLowerCase();
    // Full URL to JSON
    if (lower.endsWith('.json') && (ref.startsWith('http://') || ref.startsWith('https://'))) {
      return { url: ref, type: 'json' };
    }
    // Direct GLB/GLTF path (server-relative or full URL)
    if (lower.endsWith('.glb') || lower.endsWith('.gltf')) {
      return { url: ref, type: 'glb' };
    }
  }

  const name = pResource.sName;
  if (name && typeof name === 'string') {
    const lower = name.toLowerCase();
    if (lower.endsWith('.json') && (name.startsWith('http://') || name.startsWith('https://'))) {
      return { url: name, type: 'json' };
    }
  }

  return null;
}
