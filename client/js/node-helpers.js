/**
 * Gets the resource JSON URL from a node's pResource property.
 * Checks sReference first, then falls back to sName.
 */
export function getResourceUrl(node) {
  const pResource = node?.properties?.pResource;
  if (!pResource) return null;

  const ref = pResource.sReference;
  if (ref && typeof ref === 'string' &&
      ref.toLowerCase().endsWith('.json') &&
      (ref.startsWith('http://') || ref.startsWith('https://'))) {
    return ref;
  }

  const name = pResource.sName;
  if (name && typeof name === 'string' &&
      name.toLowerCase().endsWith('.json') &&
      (name.startsWith('http://') || name.startsWith('https://'))) {
    return name;
  }

  return null;
}
