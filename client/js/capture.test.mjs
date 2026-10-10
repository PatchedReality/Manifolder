import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSnapshot, captureCameraDistance } from './capture-contract.js';
const target = { fabricId: 'fabric-1', campusId: '11' };
const leaf = (id) => ({ record: { sID: 'RMTObject', twObjectIx: id, nChildren: 0 }, children: [] });
const snapshot = () => ({ target, scopeId: 'capture', resourceRoot: 'https://assets.example/', root: leaf(11) });
test('closed non-map snapshot preserves every descendant regardless of UI state', () => {
 const s = snapshot(); s.root.children=[leaf(12)]; s.root.record.nChildren=1;
 assert.equal(validateSnapshot(target,s).nodeCount,2);
});
test('rejects missing descendant, duplicate node and target mismatch', () => {
 const s=snapshot(); s.root.record.nChildren=1;
 assert.throws(()=>validateSnapshot(target,s), /incomplete/);
 s.root.children=[leaf(11)]; assert.throws(()=>validateSnapshot(target,s), /duplicate/);
 assert.throws(()=>validateSnapshot({...target,campusId:'12'},snapshot()), /target/);
});
test('node limit and malformed child counts cannot certify closure', () => {
 const s=snapshot(); s.root.record.nChildren=undefined;
 assert.throws(()=>validateSnapshot(target,s), /incomplete/);
 assert.throws(()=>validateSnapshot(target,snapshot(),0), /limit/);
});
test('camera fits horizontal and vertical bounds without a distance cap', () => {
 const tall=captureCameraDistance(100,60,16/9);
 const narrow=captureCameraDistance(100,60,0.25);
 assert.ok(narrow>tall); assert.ok(captureCameraDistance(100000,60,16/9)>5000);
 assert.throws(()=>captureCameraDistance(0,60,1), /geometry/);
});

test('counts resources on descendants even when UI marks them hidden or collapsed', () => {
  const s=snapshot(); const child=leaf(12);
  child.record.pResource={sReference:'hidden.glb'}; child.record.isExpanded=false; child.record.isHiddenInResource=true;
  s.root.record.nChildren=1; s.root.children=[child];
  assert.equal(validateSnapshot(target,s).resourceCount,1);
});
