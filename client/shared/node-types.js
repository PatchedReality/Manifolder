/**
 * Copyright (c) 2026 Patched Reality, Inc.
 */

/**
 * Shared node type definitions for server and client
 * This is the single source of truth for node type mappings
 */

// Celestial types (used by RMCObject - containers)
// Order: cType 1-17
export const CELESTIAL_TYPE_MAP = {
  1: 'Universe',
  2: 'Supercluster',
  3: 'GalaxyCluster',
  4: 'Galaxy',
  5: 'Sector',
  6: 'Nebula',
  7: 'StarCluster',
  8: 'BlackHole',
  9: 'StarSystem',
  10: 'Star',
  11: 'PlanetSystem',
  12: 'Planet',
  13: 'Moon',
  14: 'Debris',
  15: 'Satellite',
  16: 'Transport',
  17: 'Surface'
};

// Terrestrial types (used by RMTObject - terrains)
// Order: bType 1-10
export const TERRESTRIAL_TYPE_MAP = {
  1: 'Root',
  2: 'Water',
  3: 'Land',
  4: 'Country',
  5: 'Territory',
  6: 'State',
  7: 'County',
  8: 'City',
  9: 'Community',
  10: 'Parcel'
};

// Placement type (used by RMPObject - placeables)
export const PLACEMENT_TYPE = 'Placement';

// All celestial type names (for categorization)
export const CELESTIAL_NAMES = new Set(Object.values(CELESTIAL_TYPE_MAP));

// All terrestrial type names (for categorization)
export const TERRESTRIAL_NAMES = new Set(Object.values(TERRESTRIAL_TYPE_MAP));

// All placement type names (for categorization)
export const PLACEMENT_NAMES = new Set([PLACEMENT_TYPE]);

// Display configuration for each type
// Order: Celestial, Terrestrial, Placement (for filter UI)
export const NODE_TYPES = [
  // Celestial types
  { name: 'Universe', color: 0xe0e0ff, cssVar: '--node-universe', category: 'celestial' },
  { name: 'Supercluster', color: 0xc0c0ff, cssVar: '--node-supercluster', category: 'celestial' },
  { name: 'GalaxyCluster', color: 0xa0a0ff, cssVar: '--node-galaxycluster', category: 'celestial' },
  { name: 'Galaxy', color: 0x8080ff, cssVar: '--node-galaxy', category: 'celestial' },
  { name: 'Sector', color: 0x98fb98, cssVar: '--node-sector', category: 'celestial' },
  { name: 'Nebula', color: 0xff80ff, cssVar: '--node-nebula', category: 'celestial' },
  { name: 'StarCluster', color: 0xffff80, cssVar: '--node-starcluster', category: 'celestial' },
  { name: 'BlackHole', color: 0x4a0080, cssVar: '--node-blackhole', category: 'celestial' },
  { name: 'StarSystem', color: 0xffcc00, cssVar: '--node-starsystem', category: 'celestial' },
  { name: 'Star', color: 0xffff00, cssVar: '--node-star', category: 'celestial' },
  { name: 'PlanetSystem', color: 0x88ff88, cssVar: '--node-planetsystem', category: 'celestial' },
  { name: 'Planet', color: 0x44ff88, cssVar: '--node-planet', category: 'celestial' },
  { name: 'Moon', color: 0xaaaaaa, cssVar: '--node-moon', category: 'celestial' },
  { name: 'Debris', color: 0x666666, cssVar: '--node-debris', category: 'celestial' },
  { name: 'Satellite', color: 0xcc8844, cssVar: '--node-satellite', category: 'celestial' },
  { name: 'Transport', color: 0xff4444, cssVar: '--node-transport', category: 'celestial' },
  { name: 'Surface', color: 0x44aa44, cssVar: '--node-surface', category: 'celestial' },
  // Terrestrial types
  { name: 'Root', color: 0xffd700, cssVar: '--node-root', category: 'terrestrial' },
  { name: 'Water', color: 0x2266cc, cssVar: '--node-water', category: 'terrestrial' },
  { name: 'Land', color: 0x4a9eff, cssVar: '--node-land', category: 'terrestrial' },
  { name: 'Country', color: 0x9370db, cssVar: '--node-country', category: 'terrestrial' },
  { name: 'Territory', color: 0xff7f50, cssVar: '--node-territory', category: 'terrestrial' },
  { name: 'State', color: 0x20b2aa, cssVar: '--node-state', category: 'terrestrial' },
  { name: 'County', color: 0x87ceeb, cssVar: '--node-county', category: 'terrestrial' },
  { name: 'City', color: 0xf08080, cssVar: '--node-city', category: 'terrestrial' },
  { name: 'Community', color: 0xdda0dd, cssVar: '--node-community', category: 'terrestrial' },
  { name: 'Parcel', color: 0xffaa44, cssVar: '--node-parcel', category: 'terrestrial' },
  // Placement type
  { name: 'Placement', color: 0xff8c42, cssVar: '--node-placement', category: 'placement' }
];

// Helper to get display type from raw RM type
export function getDisplayType(nodeType, rawType) {
  // If nodeType is already a display type, return it
  if (CELESTIAL_NAMES.has(nodeType) || TERRESTRIAL_NAMES.has(nodeType) || PLACEMENT_NAMES.has(nodeType)) {
    return nodeType;
  }

  // Map raw RM types to display types
  if (nodeType === 'RMRoot' || rawType === 'RMRoot') return 'Root';
  if (nodeType === 'RMTObject' || rawType === 'RMTObject') return 'Territory';
  if (nodeType === 'RMCObject' || rawType === 'RMCObject') return 'Land';
  if (nodeType === 'RMPObject' || rawType === 'RMPObject') return 'Placement';

  return nodeType;
}
