// MVMF Class IDs
export const ClassIds = {
  RMRoot: 70,
  RMCObject: 71,
  RMTObject: 72,
  RMPObject: 73,
} as const;

// Prefix mapping for class-prefixed object references
export const ClassPrefixes: Record<string, number> = {
  root: 70,
  celestial: 71,
  terrestrial: 72,
  physical: 73,
};

export const ClassIdToPrefix: Record<number, string> = {
  70: 'root',
  71: 'celestial',
  72: 'terrestrial',
  73: 'physical',
};

// Parse "terrestrial:3" → { classId: 72, numericId: 3 }, "root" → { classId: 70, numericId: 1 }
export function parseObjectRef(ref: string): { classId: number; numericId: number } {
  if (ref === 'root') {
    return { classId: ClassIds.RMRoot, numericId: 1 };
  }
  const colonIndex = ref.indexOf(':');
  if (colonIndex === -1) {
    throw new Error(`Invalid object reference "${ref}". Expected format: "class:id" (e.g., "physical:42", "terrestrial:3") or "root".`);
  }
  const prefix = ref.substring(0, colonIndex);
  const classId = ClassPrefixes[prefix];
  if (classId === undefined) {
    throw new Error(`Unknown class prefix "${prefix}" in reference "${ref}". Valid prefixes: ${Object.keys(ClassPrefixes).join(', ')}`);
  }
  const numericId = parseInt(ref.substring(colonIndex + 1), 10);
  if (isNaN(numericId)) {
    throw new Error(`Invalid numeric ID in reference "${ref}".`);
  }
  return { classId, numericId };
}

// Reverse of parseObjectRef: formatObjectRef(72, 3) → "terrestrial:3"
export function formatObjectRef(classId: number, numericId: number): string {
  const prefix = ClassIdToPrefix[classId];
  if (!prefix) {
    throw new Error(`Unknown class ID ${classId}`);
  }
  if (classId === ClassIds.RMRoot) {
    return 'root';
  }
  return `${prefix}:${numericId}`;
}

// ObjectTypeMap: maps "class:subtype" strings to { classId, bType }
export const ObjectTypeMap: Record<string, { classId: number; subtype: number }> = {
  // Celestial subtypes (class 71)
  'celestial:universe': { classId: 71, subtype: 1 },
  'celestial:supercluster': { classId: 71, subtype: 2 },
  'celestial:galaxy_cluster': { classId: 71, subtype: 3 },
  'celestial:galaxy': { classId: 71, subtype: 4 },
  'celestial:black_hole': { classId: 71, subtype: 5 },
  'celestial:nebula': { classId: 71, subtype: 6 },
  'celestial:star_cluster': { classId: 71, subtype: 7 },
  'celestial:constellation': { classId: 71, subtype: 8 },
  'celestial:star_system': { classId: 71, subtype: 9 },
  'celestial:star': { classId: 71, subtype: 10 },
  'celestial:planet_system': { classId: 71, subtype: 11 },
  'celestial:planet': { classId: 71, subtype: 12 },
  'celestial:moon': { classId: 71, subtype: 13 },
  'celestial:debris': { classId: 71, subtype: 14 },
  'celestial:satellite': { classId: 71, subtype: 15 },
  'celestial:transport': { classId: 71, subtype: 16 },
  'celestial:surface': { classId: 71, subtype: 17 },

  // Terrestrial subtypes (class 72)
  'terrestrial:root': { classId: 72, subtype: 1 },
  'terrestrial:water': { classId: 72, subtype: 2 },
  'terrestrial:land': { classId: 72, subtype: 3 },
  'terrestrial:country': { classId: 72, subtype: 4 },
  'terrestrial:territory': { classId: 72, subtype: 5 },
  'terrestrial:state': { classId: 72, subtype: 6 },
  'terrestrial:county': { classId: 72, subtype: 7 },
  'terrestrial:city': { classId: 72, subtype: 8 },
  'terrestrial:community': { classId: 72, subtype: 9 },
  'terrestrial:sector': { classId: 72, subtype: 10 },
  'terrestrial:parcel': { classId: 72, subtype: 11 },

  // Physical subtypes (class 73)
  'physical': { classId: 73, subtype: 0 },
  'physical:transport': { classId: 73, subtype: 1 },
};

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface Transform {
  position: Vector3;
  rotation: Quaternion;
  scale: Vector3;
}

export interface Orbit {
  period: number;
  start: number;
  a: number;
  b: number;
}

export interface CelestialProperties {
  mass: number;
  gravity: number;
  color: number;
  brightness: number;
  reflectivity: number;
}

export interface FabricObject {
  id: string;
  parentId: string | null;
  name: string;
  transform: Transform;
  resourceReference: string | null;
  resourceName: string | null;
  bound: Vector3 | null;
  classId: number;
  subtype: number;
  children: string[] | null;
  orbit?: Orbit | null;
  properties?: CelestialProperties | null;
}

export interface Scene {
  id: string;
  name: string;
  rootObjectId: string;
  classId: number;
}

export interface ObjectFilter {
  namePattern?: string;
  type?: string;
}

export interface SearchQuery {
  namePattern?: string;
  positionRadius?: { center: Vector3; radius: number };
  resourceUrl?: string;
}

export interface CreateObjectParams {
  parentId: string;
  name: string;
  position?: Vector3;
  rotation?: Quaternion;
  scale?: Vector3;
  resourceReference?: string;
  resourceName?: string;
  bound?: Vector3;
  objectType?: string;
  orbit?: Orbit;
  properties?: CelestialProperties;
  skipParentRefetch?: boolean;
}

export interface UpdateObjectParams {
  objectId: string;
  name?: string;
  position?: Vector3;
  rotation?: Quaternion;
  scale?: Vector3;
  resourceReference?: string;
  resourceName?: string;
  bound?: Vector3;
  orbit?: Orbit;
  properties?: CelestialProperties;
  skipRefetch?: boolean;
}

export interface BulkOperation {
  type: 'create' | 'update' | 'delete' | 'move';
  params: CreateObjectParams | UpdateObjectParams | { objectId: string } | { objectId: string; newParentId: string };
}

export interface ConnectionStatus {
  connected: boolean;
  fabricUrl: string | null;
  currentSceneId: string | null;
  currentSceneName: string | null;
  resourceRootUrl: string | null;
}
