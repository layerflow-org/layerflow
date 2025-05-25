/**
 * Validation and migration utilities for LayerFlow graphs
 * @fileoverview Advanced validation, schema checking, and version migration
 * @public
 */

import { GraphAST } from './types';
import { isValidId, DEFAULT_GRAPH_VERSION } from './utils';

/**
 * JSON Schema definition for GraphAST validation
 * @public
 */
export const GRAPH_SCHEMA = {
  type: 'object',
  required: ['nodes', 'edges'],
  properties: {
    nodes: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'label'],
        properties: {
          id: { type: 'string', minLength: 1 },
          label: { type: 'string', minLength: 1 },
          type: { type: 'string' },
          level: { type: 'number', minimum: 0 },
          metadata: { type: 'object' }
        }
      }
    },
    edges: {
      type: 'array',
      items: {
        type: 'object',
        required: ['from', 'to'],
        properties: {
          from: { type: 'string', minLength: 1 },
          to: { type: 'string', minLength: 1 },
          type: { type: 'string' },
          label: { type: 'string' },
          metadata: { type: 'object' }
        }
      }
    },
    metadata: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        version: { type: 'string' },
        created: { type: 'string' },
        modified: { type: 'string' },
        tags: {
          type: 'array',
          items: { type: 'string' }
        }
      }
    }
  }
} as const;

/**
 * Validation rule types
 * @public
 */
export type ValidationRule = 
  | 'REQUIRED_FIELDS'
  | 'UNIQUE_IDS' 
  | 'VALID_REFERENCES'
  | 'NO_SELF_LOOPS'
  | 'NO_DUPLICATE_EDGES'
  | 'VALID_LEVELS'
  | 'VALID_METADATA';

/**
 * Validation configuration options
 * @public
 */
export interface ValidationOptions {
  /** Rules to enforce during validation */
  rules?: ValidationRule[];
  /** Whether to treat warnings as errors */
  strict?: boolean;
  /** Maximum allowed graph size */
  maxNodes?: number;
  /** Maximum allowed edges */
  maxEdges?: number;
  /** Allow self-referencing edges */
  allowSelfLoops?: boolean;
}

/**
 * Validation severity levels
 */
export type ValidationSeverity = 'error' | 'warning' | 'info';

/**
 * Detailed validation error with structured information
 */
export interface ValidationError {
  /** Unique error code for programmatic handling */
  readonly code: string;
  /** Human-readable error message */
  readonly message: string;
  /** Severity level */
  readonly severity: ValidationSeverity;
  /** Path to the problematic element (e.g., 'nodes[0].id') */
  readonly path?: string | undefined;
  /** Additional contextual data */
  readonly context?: Record<string, any> | undefined;
  /** Suggested fix or recommendation */
  readonly suggestion?: string | undefined;
}

/**
 * Validation result with detailed error reporting
 */
export interface ValidationResult {
  /** Whether the graph passes validation */
  readonly valid: boolean;
  /** Critical errors that prevent graph from functioning */
  readonly errors: readonly ValidationError[];
  /** Non-critical warnings that should be addressed */
  readonly warnings: readonly ValidationError[];
  /** Informational messages */
  readonly info: readonly ValidationError[];
  /** Summary statistics */
  readonly summary: {
    readonly nodeCount: number;
    readonly edgeCount: number;
    readonly errorCount: number;
    readonly warningCount: number;
    readonly infoCount: number;
  };
}

/**
 * Standard validation error codes
 */
export const ValidationErrorCodes = {
  // Node validation errors
  MISSING_NODE_ID: 'MISSING_NODE_ID',
  MISSING_NODE_LABEL: 'MISSING_NODE_LABEL', 
  DUPLICATE_NODE_ID: 'DUPLICATE_NODE_ID',
  INVALID_NODE_TYPE: 'INVALID_NODE_TYPE',
  CIRCULAR_PARENT_REFERENCE: 'CIRCULAR_PARENT_REFERENCE',
  INVALID_PARENT_REFERENCE: 'INVALID_PARENT_REFERENCE',
  
  // Edge validation errors  
  MISSING_EDGE_SOURCE: 'MISSING_EDGE_SOURCE',
  MISSING_EDGE_TARGET: 'MISSING_EDGE_TARGET',
  INVALID_NODE_REFERENCE: 'INVALID_NODE_REFERENCE',
  DUPLICATE_EDGE: 'DUPLICATE_EDGE',
  SELF_LOOP_EDGE: 'SELF_LOOP_EDGE',
  
  // Graph validation errors
  MISSING_METADATA: 'MISSING_METADATA',
  INVALID_VERSION: 'INVALID_VERSION',
  EMPTY_GRAPH: 'EMPTY_GRAPH',
  MAX_NODES_EXCEEDED: 'MAX_NODES_EXCEEDED',
  MAX_EDGES_EXCEEDED: 'MAX_EDGES_EXCEEDED',
  
  // Type validation errors
  INVALID_METADATA_TYPE: 'INVALID_METADATA_TYPE',
  INVALID_SCHEMA_VERSION: 'INVALID_SCHEMA_VERSION'
} as const;

/**
 * Validation warning codes  
 */
export const ValidationWarningCodes = {
  MISSING_TITLE: 'MISSING_TITLE',
  MISSING_DESCRIPTION: 'MISSING_DESCRIPTION',
  MISSING_VERSION: 'MISSING_VERSION',
  ORPHANED_NODE: 'ORPHANED_NODE',
  LARGE_NODE_COUNT: 'LARGE_NODE_COUNT',
  DEEP_NESTING: 'DEEP_NESTING'
} as const;

/**
 * Advanced graph validator with configurable rules
 * @public
 */
export class GraphValidator {
  private options: Required<ValidationOptions>;

  constructor(options: ValidationOptions = {}) {
    this.options = {
      rules: [
        'REQUIRED_FIELDS',
        'UNIQUE_IDS',
        'VALID_REFERENCES',
        'NO_SELF_LOOPS',
        'NO_DUPLICATE_EDGES',
        'VALID_LEVELS',
        'VALID_METADATA'
      ],
      strict: false,
      maxNodes: 10000,
      maxEdges: 50000,
      allowSelfLoops: false,
      ...options
    };
  }

  /**
   * Creates a validation error with required fields
   * @private
   */
  private createError(
    code: string, 
    message: string, 
    severity: ValidationSeverity = 'error',
    path?: string,
    context?: Record<string, any>,
    suggestion?: string
  ): ValidationError {
    return {
      code,
      message,
      severity,
      path,
      context,
      suggestion
    };
  }

  /**
   * Creates a validation warning
   * @private  
   */
  private createWarning(
    code: string,
    message: string,
    path?: string,
    context?: Record<string, any>,
    suggestion?: string
  ): ValidationError {
    return this.createError(code, message, 'warning', path, context, suggestion);
  }

  /**
   * Validates a LayerFlow graph AST against configured rules
   * @param ast - Graph AST to validate
   * @returns Detailed validation result
   * @public
   */
  validate(ast: GraphAST): ValidationResult {
    if (!ast) {
      return {
        valid: false,
        errors: [this.createError('INVALID_AST', 'Graph AST is null or undefined')],
        warnings: [],
        info: [],
        summary: {
          nodeCount: 0,
          edgeCount: 0,
          errorCount: 1,
          warningCount: 0,
          infoCount: 0
        }
      };
    }

    const allErrors: ValidationError[] = [];
    const allWarnings: ValidationError[] = [];

    // Check graph size limits first
    const nodeCount = ast.nodes?.length || 0;
    const edgeCount = ast.edges?.length || 0;

    if (nodeCount > this.options.maxNodes) {
      allErrors.push(this.createError(
        'MAX_NODES_EXCEEDED',
        `Graph exceeds maximum node limit (${this.options.maxNodes})`,
        'error',
        'nodes'
      ));
    }

    if (edgeCount > this.options.maxEdges) {
      allErrors.push(this.createError(
        'MAX_EDGES_EXCEEDED', 
        `Graph exceeds maximum edge limit (${this.options.maxEdges})`,
        'error',
        'edges'
      ));
    }

    // Apply each validation rule
    for (const rule of this.options.rules) {
      const { errors, warnings } = this.applyRule(rule, ast);
      allErrors.push(...errors);
      allWarnings.push(...warnings);
    }

    // In strict mode, treat warnings as errors
    const finalErrors = this.options.strict ? [...allErrors, ...allWarnings] : allErrors;
    const finalWarnings = this.options.strict ? [] : allWarnings;

    return {
      valid: finalErrors.length === 0,
      errors: finalErrors,
      warnings: finalWarnings,
      info: [],
      summary: {
        nodeCount,
        edgeCount,
        errorCount: finalErrors.length,
        warningCount: finalWarnings.length,
        infoCount: 0
      }
    };
  }

  /**
   * Validates a specific validation rule
   * @param rule - Rule to apply
   * @param ast - Graph AST to validate
   * @returns Validation results for this rule
   */
  private applyRule(rule: ValidationRule, ast: GraphAST): { errors: ValidationError[], warnings: ValidationError[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    switch (rule) {
      case 'REQUIRED_FIELDS':
        this.validateRequiredFields(ast, errors);
        break;

      case 'UNIQUE_IDS':
        this.validateUniqueIds(ast, errors);
        break;

      case 'VALID_REFERENCES':
        this.validateReferences(ast, errors);
        break;

      case 'NO_SELF_LOOPS':
        if (!this.options.allowSelfLoops) {
          this.validateNoSelfLoops(ast, errors);
        }
        break;

      case 'NO_DUPLICATE_EDGES':
        this.validateNoDuplicateEdges(ast, errors);
        break;

      case 'VALID_LEVELS':
        this.validateLevels(ast, warnings);
        break;

      case 'VALID_METADATA':
        this.validateMetadata(ast, warnings);
        break;
    }

    return { errors, warnings };
  }

  /**
   * Validates required fields in nodes and edges
   */
  private validateRequiredFields(ast: GraphAST, errors: ValidationError[]): void {
    ast.nodes.forEach((node, index) => {
      if (!isValidId(node.id)) {
        errors.push(this.createError(
          'MISSING_NODE_ID',
          'Node ID is required and must be non-empty',
          'error',
          `nodes[${index}].id`
        ));
      }

      if (!node.label || node.label.trim() === '') {
        errors.push(this.createError(
          'MISSING_NODE_LABEL',
          'Node label is required and must be non-empty',
          'error',
          `nodes[${index}].label`
        ));
      }
    });

    ast.edges.forEach((edge, index) => {
      if (!isValidId(edge.from)) {
        errors.push(this.createError(
          'MISSING_EDGE_SOURCE',
          'Edge source is required and must be non-empty',
          'error',
          `edges[${index}].from`
        ));
      }

      if (!isValidId(edge.to)) {
        errors.push(this.createError(
          'MISSING_EDGE_TARGET',
          'Edge target is required and must be non-empty',
          'error',
          `edges[${index}].to`
        ));
      }
    });
  }

  /**
   * Validates that all node IDs are unique
   */
  private validateUniqueIds(ast: GraphAST, errors: ValidationError[]): void {
    const seenIds = new Set<string>();
    const duplicates = new Set<string>();

    ast.nodes.forEach((node, index) => {
      if (seenIds.has(node.id)) {
        duplicates.add(node.id);
        errors.push(this.createError(
          'DUPLICATE_NODE_ID',
          `Duplicate node ID: "${node.id}"`,
          'error',
          `nodes[${index}].id`
        ));
      } else {
        seenIds.add(node.id);
      }
    });
  }

  /**
   * Validates that all edge references point to existing nodes
   */
  private validateReferences(ast: GraphAST, errors: ValidationError[]): void {
    const nodeIds = new Set(ast.nodes.map(node => node.id));

    ast.edges.forEach((edge, index) => {
      if (!nodeIds.has(edge.from)) {
        errors.push(this.createError(
          'INVALID_NODE_REFERENCE',
          `Reference to non-existent node: "${edge.from}"`,
          'error',
          `edges[${index}].from`
        ));
      }

      if (!nodeIds.has(edge.to)) {
        errors.push(this.createError(
          'INVALID_NODE_REFERENCE',
          `Reference to non-existent node: "${edge.to}"`,
          'error',
          `edges[${index}].to`
        ));
      }
    });

    // Validate parent references
    ast.nodes.forEach((node, index) => {
      if (node.parentId && !nodeIds.has(node.parentId)) {
        errors.push(this.createError(
          'INVALID_PARENT_REFERENCE',
          `Reference to non-existent parent node: "${node.parentId}"`,
          'error',
          `nodes[${index}].parentId`
        ));
      }
    });

    // Check for circular parent references
    ast.nodes.forEach((node, index) => {
      if (node.parentId && this.hasCircularParentReference(ast, node.id)) {
        errors.push(this.createError(
          'CIRCULAR_PARENT_REFERENCE',
          `Circular parent reference detected for node: "${node.id}"`,
          'error',
          `nodes[${index}].parentId`
        ));
      }
    });
  }

  /**
   * Checks if a node has circular parent references
   * @param ast - Graph AST to check
   * @param nodeId - Node ID to check for circular references
   * @returns True if circular reference exists
   */
  private hasCircularParentReference(ast: GraphAST, nodeId: string): boolean {
    const visited = new Set<string>();
    let currentId: string | undefined = nodeId;

    while (currentId) {
      if (visited.has(currentId)) {
        return true;
      }
      visited.add(currentId);
      
      const currentNode = ast.nodes.find(n => n.id === currentId);
      currentId = currentNode?.parentId;
    }

    return false;
  }

  /**
   * Validates that there are no self-referencing edges
   */
  private validateNoSelfLoops(ast: GraphAST, errors: ValidationError[]): void {
    ast.edges.forEach((edge, index) => {
      if (edge.from === edge.to) {
        errors.push(this.createError(
          'SELF_LOOP_EDGE',
          `Self-referencing edge not allowed: "${edge.from}" -> "${edge.to}"`,
          'error',
          `edges[${index}]`
        ));
      }
    });
  }

  /**
   * Validates that there are no duplicate edges
   */
  private validateNoDuplicateEdges(ast: GraphAST, errors: ValidationError[]): void {
    const seenEdges = new Set<string>();

    ast.edges.forEach((edge, index) => {
      const edgeKey = `${edge.from}->${edge.to}`;
      if (seenEdges.has(edgeKey)) {
        errors.push(this.createError(
          'DUPLICATE_EDGE',
          `Duplicate edge: "${edge.from}" -> "${edge.to}"`,
          'error',
          `edges[${index}]`
        ));
      } else {
        seenEdges.add(edgeKey);
      }
    });
  }

  /**
   * Validates layer level consistency
   */
  private validateLevels(ast: GraphAST, warnings: ValidationError[]): void {
    const levels = ast.nodes
      .map(node => node.level || 0)
      .filter((level, index, arr) => arr.indexOf(level) === index)
      .sort((a, b) => a - b);

    // Check for gaps in level sequence
    for (let i = 1; i < levels.length; i++) {
      if (levels[i] - levels[i - 1] > 1) {
        warnings.push(this.createWarning(
          'LEVEL_GAP',
          `Gap in layer levels: missing level ${levels[i - 1] + 1}`,
          'nodes'
        ));
      }
    }
  }

  /**
   * Validates metadata structure
   */
  private validateMetadata(ast: GraphAST, warnings: ValidationError[]): void {
    if (!ast.metadata?.title) {
      warnings.push(this.createWarning(
        'MISSING_TITLE',
        'Graph title is recommended',
        'metadata.title'
      ));
    }

    if (!ast.metadata?.version) {
      warnings.push(this.createWarning(
        'MISSING_VERSION',
        'Graph version is recommended',
        'metadata.version'
      ));
    }
  }
}

/**
 * Migration manager for handling version upgrades
 * @public
 */
export class GraphMigrator {
  /**
   * Migrates a graph from one version to another
   * @param ast - Graph AST to migrate
   * @param targetVersion - Target version to migrate to
   * @returns Migrated graph AST
   */
  migrate(ast: GraphAST, targetVersion: string = DEFAULT_GRAPH_VERSION): GraphAST {
    const currentVersion = ast.metadata?.version || '1.0.0';
    
    if (currentVersion === targetVersion) {
      return ast;
    }

    let migrated = { ...ast };

    // Apply version-specific migrations
    if (this.shouldMigrate(currentVersion, '1.0.0', targetVersion)) {
      migrated = this.migrateTo_1_0_0(migrated);
    }

    // Update version in metadata
    migrated.metadata = {
      ...migrated.metadata,
      version: targetVersion,
      modified: new Date().toISOString()
    };

    return migrated;
  }

  /**
   * Checks if migration is needed between versions
   */
  private shouldMigrate(current: string, migration: string, target: string): boolean {
    // Simple version comparison - in production, use proper semver comparison
    return this.compareVersions(current, migration) < 0 && 
           this.compareVersions(migration, target) <= 0;
  }

  /**
   * Simple version comparison (for demonstration)
   */
  private compareVersions(a: string, b: string): number {
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
   * Migration to version 1.0.0
   */
  private migrateTo_1_0_0(ast: GraphAST): GraphAST {
    // Example migration: ensure all nodes have a type
    const migratedNodes = ast.nodes.map(node => ({
      ...node,
      type: node.type || 'component',
      level: node.level || 0
    }));

    // Example migration: ensure all edges have a type
    const migratedEdges = ast.edges.map(edge => ({
      ...edge,
      type: edge.type || 'connection'
    }));

    return {
      ...ast,
      nodes: migratedNodes,
      edges: migratedEdges
    };
  }
}

/**
 * Quick validation function for basic graph validation
 * @param ast - Graph AST to validate
 * @returns True if graph is valid, false otherwise
 * @public
 */
export function validateGraph(ast: GraphAST): boolean {
  const validator = new GraphValidator();
  const result = validator.validate(ast);
  return result.valid;
}

/**
 * Quick migration function with default settings
 * @param ast - Graph AST to migrate
 * @param targetVersion - Target version (default: latest)
 * @returns Migrated graph AST
 * @public
 */
export function migrateGraph(ast: GraphAST, targetVersion?: string): GraphAST {
  const migrator = new GraphMigrator();
  return migrator.migrate(ast, targetVersion);
} 