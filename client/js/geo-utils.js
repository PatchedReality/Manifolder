/**
 * Copyright (c) 2026 Patched Reality, Inc.
 */

/**
 * Geo utilities for lat/long calculations on planetary surfaces.
 * Uses Y-up coordinate system with planet center at origin.
 */

// Position must be within 2% of surface radius to be considered "on surface"
export const SURFACE_PROXIMITY_TOLERANCE = 0.02;

/**
 * Calculate lat/long from world position (Y-up, planet-centered)
 * @param {Object} worldPos - {x, y, z} position in meters
 * @param {number} surfaceRadius - Planet surface radius in meters
 * @returns {{latitude: number, longitude: number}|null} - Degrees, or null if not on surface
 */
export function calculateLatLong(worldPos, surfaceRadius) {
  const { x, y, z } = worldPos;
  const R = Math.sqrt(x ** 2 + y ** 2 + z ** 2);

  if (Math.abs(R - surfaceRadius) > surfaceRadius * SURFACE_PROXIMITY_TOLERANCE) {
    return null;
  }

  const latitude = Math.asin(y / R) * (180 / Math.PI);
  const longitude = Math.atan2(x, z) * (180 / Math.PI);

  return { latitude, longitude };
}

/**
 * Format lat/long for display
 * @param {number} lat - Latitude in degrees
 * @param {number} lon - Longitude in degrees
 * @returns {string} - Formatted string like "47.2345°N, 2.3456°W"
 */
export function formatLatLong(lat, lon) {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lon).toFixed(4)}°${lonDir}`;
}

/**
 * Calculate sun position (azimuth and elevation) for a given location and time
 * @param {number} lat - Latitude in degrees
 * @param {number} lon - Longitude in degrees
 * @param {Date} date - Date/time for calculation
 * @returns {{azimuth: number, elevation: number}} - Azimuth (0=N, 90=E) and elevation in degrees
 */
export function calculateSunPosition(lat, lon, date = new Date()) {
  const rad = Math.PI / 180;
  const deg = 180 / Math.PI;

  // Day of year
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

  // Solar time
  const hours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  const solarTime = hours + lon / 15;

  // Solar declination (simplified)
  const declination = -23.45 * Math.cos(rad * 360 / 365 * (dayOfYear + 10));

  // Hour angle
  const hourAngle = (solarTime - 12) * 15;

  // Convert to radians
  const latRad = lat * rad;
  const decRad = declination * rad;
  const haRad = hourAngle * rad;

  // Solar elevation
  const sinElevation = Math.sin(latRad) * Math.sin(decRad) +
                       Math.cos(latRad) * Math.cos(decRad) * Math.cos(haRad);
  const elevation = Math.asin(sinElevation) * deg;

  // Solar azimuth
  const cosAzimuth = (Math.sin(decRad) - Math.sin(latRad) * sinElevation) /
                     (Math.cos(latRad) * Math.cos(elevation * rad));
  let azimuth = Math.acos(Math.max(-1, Math.min(1, cosAzimuth))) * deg;

  if (hourAngle > 0) {
    azimuth = 360 - azimuth;
  }

  return { azimuth, elevation };
}

/**
 * Get sun light color based on elevation
 * @param {number} elevation - Sun elevation in degrees
 * @returns {{color: number, intensity: number, skyHorizon: number, skyZenith: number}}
 */
export function getSunLightingParams(elevation) {
  if (elevation < -6) {
    // Night
    return {
      color: 0x1a1a40,
      intensity: 0.1,
      skyHorizon: 0x0a0a15,
      skyZenith: 0x000008,
      groundColor: 0x050508
    };
  } else if (elevation < 0) {
    // Twilight
    const t = (elevation + 6) / 6;
    return {
      color: 0x4a3060,
      intensity: 0.3 + t * 0.5,
      skyHorizon: 0x553355,
      skyZenith: 0x1a1a40,
      groundColor: 0x101015
    };
  } else if (elevation < 10) {
    // Golden hour
    const t = elevation / 10;
    return {
      color: 0xffaa66,
      intensity: 1.0 + t * 0.8,
      skyHorizon: 0xffaa77,
      skyZenith: 0x4477aa,
      groundColor: 0x1a1510
    };
  } else if (elevation < 30) {
    // Morning/evening
    const t = (elevation - 10) / 20;
    return {
      color: lerpColor(0xffd4a6, 0xfff4e6, t),
      intensity: 1.8 + t * 0.4,
      skyHorizon: lerpColor(0xeebb88, 0xc8dce8, t),
      skyZenith: lerpColor(0x5588bb, 0x4499dd, t),
      groundColor: 0x1a1a1c
    };
  } else {
    // Midday
    return {
      color: 0xffffff,
      intensity: 2.2,
      skyHorizon: 0xb4d4e8,
      skyZenith: 0x3388dd,
      groundColor: 0x1a1a1c
    };
  }
}

function lerpColor(a, b, t) {
  const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
  const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | bl;
}
