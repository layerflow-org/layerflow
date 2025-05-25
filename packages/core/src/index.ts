/**
 * LayerFlow Core - Main entry point
 * @fileoverview Unified export of all public APIs from LayerFlow Core
 * @public
 */

// Export all types
export * from './types';

// Export all classes and functions
export * from './graph';
export { 
  GraphValidator, 
  GraphMigrator, 
  validateGraph, 
  migrateGraph,
  GRAPH_SCHEMA,
  ValidationErrorCodes,
  ValidationWarningCodes,
  type ValidationError,
  type ValidationResult,
  type ValidationSeverity,
  type ValidationRule,
  type ValidationOptions
} from './validation';
export * from './plugins';
export * from './utils';

// Convenient aliases for common usage patterns
export { LayerFlowGraph as Graph } from './graph';
export { validateGraph as validate } from './validation';
export { migrateGraph as migrate } from './validation'; 