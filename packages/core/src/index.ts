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

// Export new registry and enhanced plugin system
export * from './registry';
export * from './enhanced-plugins';
export * from './domain-activation';

// Convenient aliases for common usage patterns
export { LayerFlowGraph as Graph } from './graph';
export { validateGraph as validate } from './validation';
export { migrateGraph as migrate } from './validation';

// New aliases for enhanced functionality
export { EnhancedPluginManager as EnhancedManager } from './enhanced-plugins';
export { TypeRegistry as Registry } from './registry'; 