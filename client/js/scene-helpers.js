import * as THREE from 'three';

/**
 * Creates a starfield surrounding the scene
 * @param {THREE.Scene} scene - The scene to add the starfield to
 * @param {Object} options - Configuration options
 * @returns {THREE.Points} The starfield points object
 */
export function createStarfield(scene, options = {}) {
  const {
    count = 3000,
    radius = 4000,
    color = 0x888888,
    size = 2
  } = options;

  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const theta = 2 * Math.PI * Math.random();
    const phi = Math.acos(2 * Math.random() - 1);
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color,
    size,
    sizeAttenuation: false,
    fog: false
  });

  const stars = new THREE.Points(geometry, material);
  scene.add(stars);

  return stars;
}

/**
 * Creates a ground grid
 * @param {THREE.Scene} scene - The scene to add the grid to
 * @param {Object} options - Configuration options
 * @returns {THREE.GridHelper} The grid helper object
 */
export function createGroundGrid(scene, options = {}) {
  const {
    size = 2000,
    divisions = 400,
    colorCenterLine = 0x666666,
    colorGrid = 0x222222
  } = options;

  const grid = new THREE.GridHelper(size, divisions, colorCenterLine, colorGrid);
  scene.add(grid);

  return grid;
}
