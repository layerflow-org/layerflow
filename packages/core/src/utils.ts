/**
 * Utility functions for LayerFlow Core
 * @fileoverview Common utilities for ID generation, cloning, and constants
 * @public
 */

/**
 * Current version of the LayerFlow Core library
 * @public
 */
export const LAYERFLOW_VERSION = '0.1.0';

/**
 * Default graph format version
 * @public
 */
export const DEFAULT_GRAPH_VERSION = '1.0.0';

/**
 * Default node type when none is specified
 * @public
 */
export const DEFAULT_NODE_TYPE = 'component';

/**
 * Default edge type when none is specified
 * @public
 */
export const DEFAULT_EDGE_TYPE = 'connection';

/**
 * Generates a unique identifier with optional prefix
 * @param prefix - Optional prefix for the ID (default: 'node')
 * @returns A unique string identifier
 * @public
 */
export function generateId(prefix: string = 'node'): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Deep clone utility with circular reference protection
 * @param obj - Object to clone
 * @param visited - Set of visited objects to prevent circular references
 * @returns Deep cloned object
 * @public
 */
export function deepClone<T>(obj: T, visited = new WeakSet()): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // Prevent circular references
  if (visited.has(obj as any)) {
    return {} as T; // Return empty object for circular references
  }

  visited.add(obj as any);

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }

  if (obj instanceof Array) {
    return obj.map(item => deepClone(item, visited)) as T;
  }

  if (typeof obj === 'object') {
    const cloned = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        (cloned as any)[key] = deepClone((obj as any)[key], visited);
      }
    }
    return cloned;
  }

  return obj;
}

/**
 * Safely parses JSON string with error handling
 * @param jsonString - JSON string to parse
 * @param fallback - Fallback value if parsing fails
 * @returns Parsed object or fallback value
 * @public
 */
export function safeJsonParse<T>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.warn('Failed to parse JSON, using fallback:', error);
    return fallback;
  }
}

/**
 * Checks if a value is a valid non-empty string
 * @param value - Value to check
 * @returns True if value is a non-empty string
 * @public
 */
export function isValidId(value: any): value is string {
  return typeof value === 'string' && value.length > 0 && value.trim().length > 0;
}

/**
 * Normalizes a string to be used as an identifier
 * @param str - String to normalize
 * @returns Normalized identifier string
 * @public
 */
export function normalizeId(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Gets current timestamp in ISO format
 * @returns ISO timestamp string
 * @public
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Debounces a function call
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 * @public
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (..._args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(..._args), wait);
  };
}

/**
 * Creates a readonly version of an object
 * @param obj - Object to make readonly
 * @returns Readonly version of the object
 * @public
 */
export function makeReadonly<T>(obj: T): Readonly<T> {
  return Object.freeze(deepClone(obj));
}

/**
 * Validates a semantic version string
 * @param version - Version string to validate
 * @returns True if version is valid semver format
 * @public
 */
export function isValidVersion(version: string): boolean {
  const semverRegex = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
  return semverRegex.test(version);
}

/**
 * Compares two semantic version strings
 * @param a - First version
 * @param b - Second version
 * @returns -1 if a < b, 0 if a === b, 1 if a > b
 * @public
 */
export function compareVersions(a: string, b: string): number {
  const aParts = a.split('.').map(Number);
  const bParts = b.split('.').map(Number);

  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const aPart = aParts[i] || 0;
    const bPart = bParts[i] || 0;

    if (aPart < bPart) return -1;
    if (aPart > bPart) return 1;
  }

  return 0;
}

/**
 * Validates a node type string
 * @param type - Node type to validate
 * @returns True if type is valid
 * @public
 */
export function isValidNodeType(type: string): boolean {
  return typeof type === 'string' && 
         type.length > 0 && 
         /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(type);
}

/**
 * Validates an edge type string
 * @param type - Edge type to validate
 * @returns True if type is valid
 * @public
 */
export function isValidEdgeType(type: string): boolean {
  return typeof type === 'string' && 
         type.length > 0 && 
         /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(type);
} 