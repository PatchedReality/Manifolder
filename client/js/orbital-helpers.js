// Orbital mechanics helpers for celestial body positioning
import * as THREE from 'three';

// Time unit conversion: tmPeriod is in 1/64 second units
const TIME_UNIT_TO_SECONDS = 1 / 64;

/**
 * Extract orbital data from a node's properties
 * @param {Object} node - The node data
 * @returns {Object|null} Orbital parameters or null if no orbit data
 */
export function getOrbitData(node) {
  // Try explicit orbit property first (from server parsing)
  if (node.orbit) {
    return node.orbit;
  }

  // Fall back to properties.pOrbit_Spin
  const orbitSpin = node?.properties?.pOrbit_Spin;
  if (!orbitSpin) return null;

  const { tmPeriod, tmOrigin, tmStart, dA, dB } = orbitSpin;

  // Skip if no semi-major axis defined (no orbit)
  if (!dA || dA === 0) return null;

  // Use tmOrigin if available, fall back to tmStart
  const phaseOffset = tmOrigin ?? tmStart ?? 0;

  return {
    period: tmPeriod * TIME_UNIT_TO_SECONDS,           // in seconds
    phaseOffset: phaseOffset * TIME_UNIT_TO_SECONDS,   // in seconds
    semiMajorAxis: dA,                                  // in meters
    semiMinorAxis: dB || dA                             // in meters, default to circular
  };
}

/**
 * Calculate position on ellipse at given time
 * The ellipse is in the XZ plane with the parent (focus) at origin.
 * The node's transform.rotation should be applied to rotate the orbital plane.
 *
 * @param {Object} orbitData - From getOrbitData()
 * @param {number} time - Simulation time in seconds (default 0 for static)
 * @returns {Object} { x, y, z } position in meters relative to parent (focus)
 */
export function calculateOrbitalPosition(orbitData, time = 0) {
  const { period, phaseOffset, semiMajorAxis: a, semiMinorAxis: b } = orbitData;

  // Calculate mean anomaly (angle progressed since epoch)
  // For period=0, treat as stationary at angle 0
  let theta = 0;
  if (period > 0) {
    theta = ((time + phaseOffset) / period) * 2 * Math.PI;
  }

  // Calculate the linear eccentricity (distance from center to focus)
  const c = Math.sqrt(Math.max(0, a * a - b * b));

  // Position on ellipse centered at geometric center
  const x = a * Math.cos(theta);
  const z = b * Math.sin(theta);

  // Shift so focus (parent position) is at origin
  // For an ellipse, the focus is at (c, 0) from the center
  return {
    x: x - c,
    y: 0,    // XZ orbital plane before rotation
    z: z
  };
}

/**
 * Create an elliptical orbit path geometry
 * The ellipse is in the XZ plane, centered on the focus (not geometric center).
 * Apply rotation quaternion to orient the orbital plane.
 *
 * @param {number} semiMajorAxis - Semi-major axis (a) in scene units
 * @param {number} semiMinorAxis - Semi-minor axis (b) in scene units
 * @param {number} segments - Number of line segments (default 64)
 * @returns {THREE.BufferGeometry} Line geometry for the orbital path
 */
export function createOrbitPathGeometry(semiMajorAxis, semiMinorAxis, segments = 64) {
  const points = [];
  const a = semiMajorAxis;
  const b = semiMinorAxis;

  // Calculate linear eccentricity (distance from center to focus)
  const c = Math.sqrt(Math.max(0, a * a - b * b));

  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    // Ellipse centered on focus (parent position)
    const x = a * Math.cos(theta) - c;
    const z = b * Math.sin(theta);
    points.push(new THREE.Vector3(x, 0, z));
  }

  return new THREE.BufferGeometry().setFromPoints(points);
}

/**
 * Extract spin data from a node's properties
 * Spin is when tmPeriod > 0 but dA = 0 (no orbit, just rotation)
 * @param {Object} node - The node data
 * @returns {Object|null} Spin parameters or null if no spin data
 */
export function getSpinData(node) {
  const orbitSpin = node?.properties?.pOrbit_Spin;
  if (!orbitSpin) return null;

  const { tmPeriod, tmStart, dA } = orbitSpin;

  // Spin is when we have a period but no orbital axis (dA = 0)
  if (!tmPeriod || tmPeriod === 0) return null;
  if (dA && dA !== 0) return null; // Has orbit, not just spin

  return {
    period: tmPeriod * TIME_UNIT_TO_SECONDS,  // in seconds
    phaseOffset: (tmStart || 0) * TIME_UNIT_TO_SECONDS
  };
}

/**
 * Calculate spin angle at given time
 * @param {Object} spinData - From getSpinData()
 * @param {number} time - Simulation time in seconds
 * @returns {number} Rotation angle in radians around Y axis
 */
export function calculateSpinAngle(spinData, time = 0) {
  const { period, phaseOffset } = spinData;
  if (period <= 0) return 0;
  return ((time + phaseOffset) / period) * 2 * Math.PI;
}
