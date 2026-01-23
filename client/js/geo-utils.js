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
