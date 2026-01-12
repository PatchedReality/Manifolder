import * as THREE from 'three';

/**
 * Creates an infinite ground grid using a shader
 * @param {THREE.Scene} scene - The scene to add the grid to
 * @param {Object} options - Configuration options
 * @returns {THREE.Mesh} The grid mesh
 */
export function createInfiniteGrid(scene, options = {}) {
  const {
    size = 100000,
    gridSpacing = 10,
    majorGridSpacing = 100,
    fadeDistance = 10000
  } = options;

  const vertexShader = `
    varying vec3 vWorldPosition;
    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `;

  const fragmentShader = `
    precision highp float;

    uniform float uGridSpacing;
    uniform float uMajorGridSpacing;
    uniform float uFadeDistance;
    varying vec3 vWorldPosition;

    float gridLine(float coord, float lineWidth) {
      float wrappedCoord = mod(coord, 1.0);
      return step(wrappedCoord, lineWidth) + step(1.0 - lineWidth, wrappedCoord);
    }

    void main() {
      float distanceFromCenter = length(vWorldPosition.xz);
      float fadeAlpha = 1.0 - smoothstep(uFadeDistance * 0.3, uFadeDistance, distanceFromCenter);

      if (fadeAlpha < 0.01) discard;

      vec2 minorCoord = vWorldPosition.xz / uGridSpacing;
      vec2 majorCoord = vWorldPosition.xz / uMajorGridSpacing;

      float lineWidth = 0.02;
      float minorLine = max(gridLine(minorCoord.x, lineWidth), gridLine(minorCoord.y, lineWidth));
      float majorLine = max(gridLine(majorCoord.x, lineWidth * 0.25), gridLine(majorCoord.y, lineWidth * 0.25));

      vec3 baseColor = vec3(0.06, 0.08, 0.12);
      vec3 minorColor = vec3(0.16, 0.31, 0.39);
      vec3 majorColor = vec3(0.24, 0.55, 0.63);

      float lineAlpha = max(minorLine * 0.3, majorLine * 0.5);
      float baseAlpha = .8;

      vec3 color = mix(baseColor, mix(minorColor, majorColor, majorLine), lineAlpha > 0.0 ? 1.0 : 0.0);
      float alpha = max(lineAlpha, baseAlpha) * fadeAlpha;  

      if (alpha < 0.01) discard;
      gl_FragColor = vec4(color, alpha);
    }
  `;

  const geometry = new THREE.PlaneGeometry(size, size, 1, 1);
  geometry.rotateX(-Math.PI / 2);

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uGridSpacing: { value: gridSpacing },
      uMajorGridSpacing: { value: majorGridSpacing },
      uFadeDistance: { value: fadeDistance }
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  const grid = new THREE.Mesh(geometry, material);
  grid.frustumCulled = false;
  scene.add(grid);

  return grid;
}

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
    fog: false,
    depthWrite: false
  });

  const stars = new THREE.Points(geometry, material);
  stars.renderOrder = -1000;
  stars.frustumCulled = false;
  scene.add(stars);

  return stars;
}
