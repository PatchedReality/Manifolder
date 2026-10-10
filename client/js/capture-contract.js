// Capture v1 accepts only a closed, controller-authenticated SDK snapshot.
export function validateSnapshot(target, snapshot, limit = 1000) {
  if (!target?.fabricId || !target?.campusId || snapshot?.target?.fabricId !== target.fabricId ||
      snapshot?.target?.campusId !== target.campusId || String(snapshot?.root?.record?.twObjectIx) !== String(target.campusId)) {
    throw new Error('capture_target_mismatch');
  }
  if (!snapshot.scopeId || !snapshot.resourceRoot) throw new Error('capture_target_invalid');
  const keys = new Set(); const pending = [snapshot.root]; let resources = 0;
  while (pending.length) {
    const node = pending.pop(); const record = node?.record;
    if (!record || !['RMRoot','RMCObject','RMTObject','RMPObject'].includes(record.sID) ||
        !Number.isSafeInteger(record.twObjectIx) || !Number.isSafeInteger(record.nChildren) || record.nChildren < 0 ||
        !Array.isArray(node.children) || record.nChildren !== node.children.length) throw new Error('capture_incomplete_snapshot');
    const key = `${record.sID}:${record.twObjectIx}`;
    if (keys.has(key)) throw new Error('capture_duplicate_node');
    keys.add(key); if (keys.size > limit) throw new Error('capture_node_limit');
    if (record.pResource?.sReference) resources++;
    // Attachment expansion requires another authenticated scope; v1 refuses partial captures.
    if (record.pType?.bSubtype === 255) throw new Error('capture_unsupported_attachment');
    pending.push(...node.children);
  }
  return { nodeCount: keys.size, resourceCount: resources };
}

// Bounding sphere is conservative for every camera orientation and both viewport axes.
export function captureCameraDistance(radius, fovDegrees, aspect) {
  if (![radius,fovDegrees,aspect].every(Number.isFinite) || radius <= 0 || aspect <= 0 || fovDegrees <= 0 || fovDegrees >= 180) throw new Error('capture_no_geometry');
  const vertical = fovDegrees * Math.PI / 360;
  const horizontal = Math.atan(Math.tan(vertical) * aspect);
  return radius / Math.sin(Math.min(vertical, horizontal)) * 1.1;
}
