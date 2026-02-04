/**
 * Copyright (c) 2026 Patched Reality, Inc.
 */

import * as THREE from 'three';

/**
 * Creates an infinite ground grid using a shader
 * @param {THREE.Scene} scene - The scene to add the grid to
 * @param {Object} options - Configuration options
 * @returns {THREE.Mesh} The grid mesh
 */
export function createInfiniteGrid(scene, options = {}) {
  const {
    size = 200000,
    gridSpacing = 10,
    majorGridSpacing = 100
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
    varying vec3 vWorldPosition;

    float gridLine(float coord, float lineWidth) {
      float wrappedCoord = mod(coord, 1.0);
      return step(wrappedCoord, lineWidth) + step(1.0 - lineWidth, wrappedCoord);
    }

    void main() {
      vec2 minorCoord = vWorldPosition.xz / uGridSpacing;
      vec2 majorCoord = vWorldPosition.xz / uMajorGridSpacing;

      float lineWidth = 0.02;
      float minorLine = max(gridLine(minorCoord.x, lineWidth), gridLine(minorCoord.y, lineWidth));
      float majorLine = max(gridLine(majorCoord.x, lineWidth * 0.25), gridLine(majorCoord.y, lineWidth * 0.25));

      vec3 baseColor = vec3(0.06, 0.08, 0.12);
      vec3 minorColor = vec3(0.16, 0.31, 0.39);
      vec3 majorColor = vec3(0.24, 0.55, 0.63);

      float lineAlpha = max(minorLine * 0.3, majorLine * 0.5);
      float baseAlpha = 0.8;

      vec3 color = mix(baseColor, mix(minorColor, majorColor, majorLine), lineAlpha > 0.0 ? 1.0 : 0.0);
      float alpha = max(lineAlpha, baseAlpha);

      gl_FragColor = vec4(color, alpha);
    }
  `;

  const geometry = new THREE.PlaneGeometry(size, size, 1, 1);
  geometry.rotateX(-Math.PI / 2);

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uGridSpacing: { value: gridSpacing },
      uMajorGridSpacing: { value: majorGridSpacing }
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  const grid = new THREE.Mesh(geometry, material);
  grid.frustumCulled = false;
  grid.renderOrder = -1;
  scene.add(grid);

  return grid;
}

/**
 * Creates a sky dome with gradient from horizon to zenith
 * @param {THREE.Scene} scene - The scene to add the sky to
 * @param {Object} options - Configuration options
 * @returns {THREE.Mesh} The sky dome mesh
 */
export function createSkyDome(scene, options = {}) {
  const {
    radius = 90000,
    horizonColor = new THREE.Color(0x87ceeb),
    zenithColor = new THREE.Color(0x1e90ff),
    groundColor = new THREE.Color(0x0c0c14)
  } = options;

  const vertexShader = `
    varying vec3 vPosition;
    void main() {
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform vec3 uHorizonColor;
    uniform vec3 uZenithColor;
    uniform vec3 uGroundColor;
    varying vec3 vPosition;

    void main() {
      float height = normalize(vPosition).y;
      vec3 color;
      if (height >= 0.0) {
        float t = pow(height, 0.4);
        color = mix(uHorizonColor, uZenithColor, t);
      } else {
        float t = pow(-height, 0.6);
        color = mix(uHorizonColor, uGroundColor, t);
      }
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  const geometry = new THREE.SphereGeometry(radius, 32, 32);

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uHorizonColor: { value: horizonColor },
      uZenithColor: { value: zenithColor },
      uGroundColor: { value: groundColor }
    },
    vertexShader,
    fragmentShader,
    side: THREE.BackSide,
    depthWrite: false
  });

  const sky = new THREE.Mesh(geometry, material);
  sky.renderOrder = -1001;
  sky.frustumCulled = false;
  scene.add(sky);

  return sky;
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

/**
 * Calculates appropriate grid spacing based on a characteristic size
 * Uses order of magnitude to determine spacing
 * @param {number} characteristicSize - The characteristic size to base grid on
 * @returns {Object} { gridSpacing, majorGridSpacing }
 */
export function calculateGridSpacing(characteristicSize) {
  if (!characteristicSize || characteristicSize <= 0) {
    return {
      gridSpacing: 10,
      majorGridSpacing: 100
    };
  }

  // Clamp to reasonable range to avoid solid grid (too small) or invisible grid (too large)
  const clampedSize = Math.max(1, Math.min(100000, characteristicSize));
  const gridSpacing = Math.pow(10, Math.floor(Math.log10(clampedSize)));
  const majorGridSpacing = gridSpacing * 10;

  return { gridSpacing, majorGridSpacing };
}

/**
 * Updates the grid spacing uniforms for an existing infinite grid
 * @param {THREE.Mesh} gridMesh - The grid mesh returned by createInfiniteGrid
 * @param {Object} options - New spacing options
 */
/**
 * Creates a label sprite from text using canvas rendering
 * @param {string} text - The label text
 * @returns {{ sprite: THREE.Sprite, aspect: number }} The sprite and its aspect ratio
 */
export function createLabelSprite(text) {
  const fontSize = 64;
  const font = `bold ${fontSize}px Arial`;

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  context.font = font;

  const metrics = context.measureText(text);
  const textWidth = metrics.width;
  const textHeight = fontSize;

  const padding = 20;
  canvas.width = textWidth + padding * 2;
  canvas.height = textHeight + padding * 2;

  context.font = font;
  context.fillStyle = 'white';
  context.textAlign = 'center';
  context.textBaseline = 'middle';

  context.strokeStyle = 'black';
  context.lineWidth = 4;
  context.lineJoin = 'round';

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  context.strokeText(text, cx, cy);
  context.fillText(text, cx, cy);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;

  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    depthTest: true,
    depthWrite: false,
    sizeAttenuation: true
  });

  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.renderOrder = 1;

  const aspect = canvas.width / canvas.height;
  return { sprite, aspect };
}

export function updateGridSpacing(gridMesh, options = {}) {
  if (!gridMesh || !gridMesh.material || !gridMesh.material.uniforms) {
    return;
  }

  const { gridSpacing, majorGridSpacing } = options;

  if (gridSpacing !== undefined) {
    gridMesh.material.uniforms.uGridSpacing.value = gridSpacing;
  }
  if (majorGridSpacing !== undefined) {
    gridMesh.material.uniforms.uMajorGridSpacing.value = majorGridSpacing;
  }
}
