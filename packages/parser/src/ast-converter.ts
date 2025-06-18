/**
 * AST Converter: LFF AST → Core AST with Visitor Pattern and Enhanced Validation
 * @fileoverview Enterprise-grade converter with extensible architecture and comprehensive validation
 * @public
 */

import type { GraphAST, GraphNode, Edge } from '@layerflow/core';
import type { 
  LFFQ, 
  LFFNodeDef, 
  LFFEdgeDef, 
  LFFDirectiveDef, 
  ConversionOptions,
  ParseError
} from './types';
import { generateId } from '@layerflow/core';

// ============================================================================
// Debug Logging System
// ============================================================================

/**
 * Debug logger with compile-time flags
 */
class ConversionLogger {
  private static enabled = process.env.NODE_ENV === 'development' || process.env.LFF_DEBUG === 'true';
  private static prefix = '[LFF-Converter]';

  static debug(message: string, data?: any): void {
    if (this.enabled) {
      console.debug(`${this.prefix} ${message}`, data || '');
    }
  }

  static warn(message: string, data?: any): void {
    if (this.enabled) {
      console.warn(`${this.prefix} ${message}`, data || '');
    }
  }

  static error(message: string, error?: any): void {
    if (this.enabled) {
      console.error(`${this.prefix} ${message}`, error || '');
    }
  }

  static time(label: string): void {
    if (this.enabled) {
      console.time(`${this.prefix} ${label}`);
    }
  }

  static timeEnd(label: string): void {
    if (this.enabled) {
      console.timeEnd(`${this.prefix} ${label}`);
    }
  }
}

// ============================================================================
// Validation System
// ============================================================================

/**
 * Validation result with detailed information
 */
export interface ValidationResult {
  valid: boolean;
  errors: ConversionError[];
  warnings: ConversionError[];
}

/**
 * Enhanced conversion error with context
 */
export interface ConversionError extends ParseError {
  type: 'conversion';
  category: 'anchor' | 'level' | 'type' | 'reference' | 'structure' | 'metadata';
  nodeId?: string;
  edgeId?: string;
  suggestion?: string;
  autoFixable?: boolean;
}

/**
 * Comprehensive validator for LFF AST
 */
class LFFValidator {
  private errors: ConversionError[] = [];
  private warnings: ConversionError[] = [];
  private anchors = new Map<string, { nodeId: string; location: any }>();
  private references = new Set<string>();

  /**
   * Validate complete LFF AST
   */
  validate(lffAST: LFFQ): ValidationResult {
    ConversionLogger.time('Validation');
    
    this.errors = [];
    this.warnings = [];
    this.anchors.clear();
    this.references.clear();

    // Phase 1: Structural validation
    this.validateStructure(lffAST);
    
    // Phase 2: Semantic validation
    this.validateSemantics(lffAST);
    
    // Phase 3: Cross-reference validation
    this.validateReferences();

    ConversionLogger.timeEnd('Validation');
    ConversionLogger.debug(`Validation complete: ${this.errors.length} errors, ${this.warnings.length} warnings`);

    return {
      valid: this.errors.length === 0,
      errors: [...this.errors],
      warnings: [...this.warnings]
    };
  }

  /**
   * Validate AST structure
   */
  private validateStructure(lffAST: LFFQ): void {
    // Validate nodes
    this.validateNodesStructure(lffAST.nodes);
    
    // Validate edges
    for (const edge of lffAST.edges) {
      this.validateEdgeStructure(edge);
    }
    
    // Validate directives
    for (const directive of lffAST.directives) {
      this.validateDirectiveStructure(directive);
    }
  }

  /**
   * Validate nodes structure recursively
   */
  private validateNodesStructure(nodes: LFFNodeDef[], parentLevel = 0): void {
    for (const node of nodes) {
      // Validate node name
      if (!node.name || node.name.trim().length === 0) {
        this.addError('structure', 'Node name cannot be empty', node.location, {
          suggestion: 'Provide a descriptive name for the node',
          autoFixable: false
        });
      }

      // Validate anchor
      if (node.anchor) {
        if (this.anchors.has(node.anchor)) {
          this.addError('anchor', `Duplicate anchor definition: &${node.anchor}`, node.location, {
            suggestion: 'Use unique anchor names',
            autoFixable: false
          });
        } else {
          this.anchors.set(node.anchor, { nodeId: node.name, location: node.location });
        }
      }

      // Validate level specification
      if (node.levelSpec) {
        const levelValidation = this.validateLevelSpec(node.levelSpec);
        if (!levelValidation.valid) {
          const options: {
            suggestion?: string;
            autoFixable?: boolean;
          } = { autoFixable: true };
          if (levelValidation.suggestion) {
            options.suggestion = levelValidation.suggestion;
          }
          this.addError('level', levelValidation.error, node.location, options);
        }
      }

      // Validate types
      if (node.types) {
        for (const type of node.types) {
          if (!this.isValidTypeName(type)) {
            this.addWarning('type', `Potentially invalid type name: ${type}`, node.location, {
              suggestion: 'Use alphanumeric characters and underscores only',
              autoFixable: true
            });
          }
        }
      }

      // Recursively validate children
      if (node.children && node.children.length > 0) {
        this.validateNodesStructure(node.children, parentLevel + 1);
      }
    }
  }

  /**
   * Validate edge structure
   */
  private validateEdgeStructure(edge: LFFEdgeDef): void {
    // Validate source and target
    if (!edge.from || edge.from.trim().length === 0) {
      this.addError('structure', 'Edge source cannot be empty', edge.location);
    }
    
    if (!edge.to || edge.to.trim().length === 0) {
      this.addError('structure', 'Edge target cannot be empty', edge.location);
    }

    // Collect references
    if (edge.from.startsWith('*')) {
      this.references.add(edge.from.slice(1));
    }
    if (edge.to.startsWith('*')) {
      this.references.add(edge.to.slice(1));
    }

    // Validate arrow type
    if (!this.isValidArrowType(edge.arrow)) {
      this.addWarning('structure', `Unknown arrow type: ${edge.arrow}`, edge.location, {
        suggestion: 'Use standard arrow types: ->, =>, <->, -->',
        autoFixable: false
      });
    }
  }

  /**
   * Validate directive structure
   */
  private validateDirectiveStructure(directive: LFFDirectiveDef): void {
    // Validate directive name
    if (!directive.name || directive.name.trim().length === 0) {
      this.addError('structure', 'Directive name cannot be empty', directive.location);
    }

    // Validate known directives
    const knownDirectives = ['title', 'version', 'description', 'author', 'domain', 'tags', 'strict'];
    if (!knownDirectives.includes(directive.name)) {
      this.addWarning('metadata', `Unknown directive: @${directive.name}`, directive.location, {
        suggestion: `Known directives: ${knownDirectives.join(', ')}`,
        autoFixable: false
      });
    }
  }

  /**
   * Validate semantic rules
   */
  private validateSemantics(lffAST: LFFQ): void {
    // Check for circular references in hierarchy
    this.validateHierarchy(lffAST.nodes);
    
    // Validate directive combinations
    this.validateDirectiveCombinations(lffAST.directives);
  }

  /**
   * Validate node hierarchy for circular references
   */
  private validateHierarchy(nodes: LFFNodeDef[], visited = new Set<string>(), path: string[] = []): void {
    for (const node of nodes) {
      if (visited.has(node.name)) {
        this.addError('structure', `Circular reference detected in hierarchy: ${path.join(' -> ')} -> ${node.name}`, node.location);
        continue;
      }

      if (node.children && node.children.length > 0) {
        visited.add(node.name);
        path.push(node.name);
        this.validateHierarchy(node.children, visited, path);
        path.pop();
        visited.delete(node.name);
      }
    }
  }

  /**
   * Validate directive combinations
   */
  private validateDirectiveCombinations(directives: LFFDirectiveDef[]): void {
    const directiveMap = new Map<string, LFFDirectiveDef>();
    
    for (const directive of directives) {
      if (directiveMap.has(directive.name)) {
        this.addWarning('metadata', `Duplicate directive: @${directive.name}`, directive.location, {
          suggestion: 'Remove duplicate directives',
          autoFixable: true
        });
      }
      directiveMap.set(directive.name, directive);
    }

    // Validate version format
    const version = directiveMap.get('version');
    if (version && typeof version.value === 'string') {
      if (!/^\d+\.\d+(\.\d+)?$/.test(version.value)) {
        this.addWarning('metadata', 'Version should follow semantic versioning (e.g., 1.0.0)', version.location, {
          suggestion: 'Use format: major.minor.patch',
          autoFixable: false
        });
      }
    }
  }

  /**
   * Validate cross-references
   */
  private validateReferences(): void {
    for (const ref of this.references) {
      if (!this.anchors.has(ref)) {
        this.addError('reference', `Undefined anchor reference: *${ref}`, 
          { startLine: 0, endLine: 0, startColumn: 0, endColumn: 0, indent: 0 }, {
          suggestion: `Define anchor &${ref} or check spelling`,
          autoFixable: false
        });
      }
    }
  }

  /**
   * Validate level specification format
   */
  private validateLevelSpec(levelSpec: string): 
    | { valid: true }
    | { valid: false; error: string; suggestion?: string } {
    if (!levelSpec.startsWith('@')) {
      return { valid: false, error: 'Level specification must start with @', suggestion: 'Use @1, @2+, or @1-3 format' };
    }

    const spec = levelSpec.substring(1);
    
    if (spec === '0') {
      return { valid: false, error: 'Level 0 is not allowed', suggestion: 'Levels start from 1, use @1' };
    }

    if (!/^[1-9]\d*(?:\+|(?:-(?:[1-9]\d*)))?$/.test(spec)) {
      return { valid: false, error: 'Invalid level specification format', suggestion: 'Use @1, @2+, or @1-3 format' };
    }

    const rangeMatch = spec.match(/^(\d+)-(\d+)$/);
    if (rangeMatch && rangeMatch[1] && rangeMatch[2]) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      if (start >= end) {
        return { valid: false, error: 'Invalid range: start must be less than end', suggestion: `Use @${start}-${start + 1} or higher` };
      }
    }

    return { valid: true };
  }

  /**
   * Check if type name is valid
   */
  private isValidTypeName(type: string): boolean {
    return /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(type);
  }

  /**
   * Check if arrow type is valid
   */
  private isValidArrowType(arrow: string | any): boolean {
    const validArrows = ['->', '=>', '<->', '-->'];
    return validArrows.includes(String(arrow));
  }

  /**
   * Add validation error
   */
  private addError(category: ConversionError['category'], message: string, location: any, options: {
    suggestion?: string;
    autoFixable?: boolean;
    nodeId?: string;
    edgeId?: string;
  } = {}): void {
    const error: ConversionError = {
      type: 'conversion',
      category,
      message,
      location,
      severity: 'error'
    };

    // Only add defined optional properties
    if (options.suggestion !== undefined) {
      error.suggestion = options.suggestion;
    }
    if (options.autoFixable !== undefined) {
      error.autoFixable = options.autoFixable;
    }
    if (options.nodeId !== undefined) {
      error.nodeId = options.nodeId;
    }
    if (options.edgeId !== undefined) {
      error.edgeId = options.edgeId;
    }

    this.errors.push(error);
  }

  /**
   * Add validation warning
   */
  private addWarning(category: ConversionError['category'], message: string, location: any, options: {
    suggestion?: string;
    autoFixable?: boolean;
    nodeId?: string;
    edgeId?: string;
  } = {}): void {
    const warning: ConversionError = {
      type: 'conversion',
      category,
      message,
      location,
      severity: 'warning'
    };

    // Only add defined optional properties
    if (options.suggestion !== undefined) {
      warning.suggestion = options.suggestion;
    }
    if (options.autoFixable !== undefined) {
      warning.autoFixable = options.autoFixable;
    }
    if (options.nodeId !== undefined) {
      warning.nodeId = options.nodeId;
    }
    if (options.edgeId !== undefined) {
      warning.edgeId = options.edgeId;
    }

    this.warnings.push(warning);
  }
}

// ============================================================================
// Utility Mappers (DRY Principle)
// ============================================================================

/**
 * Common mapping utilities to avoid duplication
 */
class ConversionMappers {
  /**
   * Map LFF arrow type to Core edge type
   */
  static mapArrowToEdgeType(arrow: string | any): string {
    const arrowMap: Record<string, string> = {
      '->': 'connection',
      '=>': 'dataflow',
      '<->': 'bidirectional',
      '-->': 'dependency'
    };
    
    return arrowMap[String(arrow)] || 'connection';
  }

  /**
   * Parse level from level specification
   */
  static parseLevelFromSpec(levelSpec: string): number {
    const match = levelSpec.match(/@?(\d+)/);
    return match && match[1] ? parseInt(match[1], 10) : 1;
  }

  /**
   * Generate unique node ID
   */
  static generateNodeId(name: string, generateUnique: boolean): string {
    return generateUnique ? generateId() : this.sanitizeId(name);
  }

  /**
   * Sanitize string for use as ID
   */
  static sanitizeId(input: string): string {
    return input
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_|_$/g, '');
  }

  /**
   * Resolve node reference (handle anchor references)
   */
  static resolveNodeReference(ref: string, anchorMap: Map<string, string>): string {
    if (ref.startsWith('*')) {
      const anchorName = ref.slice(1);
      const resolved = anchorMap.get(anchorName);
      if (!resolved) {
        throw new Error(`Undefined anchor reference: ${ref}`);
      }
      return resolved;
    }
    return ref;
  }

  /**
   * Extract metadata from properties
   */
  static extractMetadata(properties?: Record<string, any>, lffMetadata?: any): Record<string, any> {
    return {
      ...(properties || {}),
      ...(lffMetadata && { lff: lffMetadata })
    };
  }
}

// ============================================================================
// Visitor Pattern Implementation
// ============================================================================

/**
 * Visitor interface for AST traversal
 */
export interface ASTVisitor<T = any> {
  visitNode(node: LFFNodeDef, context: ConversionContext): T;
  visitEdge(edge: LFFEdgeDef, context: ConversionContext): T;
  visitDirective(directive: LFFDirectiveDef, context: ConversionContext): T;
}

/**
 * Conversion context for visitor pattern
 */
export interface ConversionContext {
  anchorMap: Map<string, string>;
  options: Required<ConversionOptions>;
  parentId?: string;
  level: number;
  path: string[];
}

/**
 * Node converter visitor
 */
class NodeConverterVisitor implements ASTVisitor<GraphNode[]> {
  visitNode(node: LFFNodeDef, context: ConversionContext): GraphNode[] {
    ConversionLogger.debug(`Converting node: ${node.name}`, { level: context.level, parent: context.parentId });

    const nodeId = ConversionMappers.generateNodeId(node.name, context.options.generateUniqueIds);
    
    // Register anchor
    if (node.anchor) {
      context.anchorMap.set(node.anchor, nodeId);
      ConversionLogger.debug(`Registered anchor: &${node.anchor} -> ${nodeId}`);
    }

    // Calculate level
    let level = context.level;
    if (node.levelSpec) {
      level = ConversionMappers.parseLevelFromSpec(node.levelSpec);
    }

    // Determine node type
    const nodeType = node.types?.[0] || context.options.defaultNodeType;

    // Create LFF metadata
    const lffMetadata = context.options.preserveLFFMetadata ? {
      originalName: node.name,
      ...(node.anchor && { anchor: node.anchor }),
      ...(node.types && node.types.length > 1 && { additionalTypes: node.types.slice(1) }),
      ...(node.levelSpec && { levelSpec: node.levelSpec }),
      location: node.location
    } : undefined;

    // Create Core node
    const coreNode: GraphNode = {
      id: nodeId,
      label: node.name,
      type: nodeType,
      level,
      ...(context.parentId && { parentId: context.parentId }),
      metadata: ConversionMappers.extractMetadata(node.properties, lffMetadata)
    };

    const result = [coreNode];

    // Process children recursively
    if (node.children && node.children.length > 0) {
      const childContext: ConversionContext = {
        ...context,
        parentId: nodeId,
        level: level + 1,
        path: [...context.path, node.name]
      };

      for (const child of node.children) {
        const childNodes = this.visitNode(child, childContext);
        result.push(...childNodes);
      }
    }

    return result;
  }

  visitEdge(): GraphNode[] {
    throw new Error('NodeConverterVisitor should not visit edges');
  }

  visitDirective(): GraphNode[] {
    throw new Error('NodeConverterVisitor should not visit directives');
  }
}

/**
 * Edge converter visitor
 */
class EdgeConverterVisitor implements ASTVisitor<Edge> {
  visitEdge(edge: LFFEdgeDef, context: ConversionContext): Edge {
    ConversionLogger.debug(`Converting edge: ${edge.from} ${edge.arrow} ${edge.to}`);

    const from = ConversionMappers.resolveNodeReference(edge.from, context.anchorMap);
    const to = ConversionMappers.resolveNodeReference(edge.to, context.anchorMap);
    const edgeType = ConversionMappers.mapArrowToEdgeType(edge.arrow);

    const lffMetadata = context.options.preserveLFFMetadata ? {
      arrow: edge.arrow,
      location: edge.location
    } : undefined;

    return {
      from,
      to,
      type: edgeType,
      ...(edge.label && { label: edge.label }),
      metadata: ConversionMappers.extractMetadata(edge.properties, lffMetadata)
    };
  }

  visitNode(): Edge {
    throw new Error('EdgeConverterVisitor should not visit nodes');
  }

  visitDirective(): Edge {
    throw new Error('EdgeConverterVisitor should not visit directives');
  }
}

/**
 * Directive processor visitor
 */
class DirectiveProcessorVisitor implements ASTVisitor<Record<string, any>> {
  visitDirective(directive: LFFDirectiveDef, _context: ConversionContext): Record<string, any> {
    ConversionLogger.debug(`Processing directive: @${directive.name} = ${directive.value}`);

    const metadata: Record<string, any> = {};

    // Handle special directives
    switch (directive.name) {
      case 'title':
        metadata.title = directive.value;
        break;
      case 'version':
        metadata.version = directive.value;
        break;
      case 'description':
        metadata.description = directive.value;
        break;
      case 'author':
        metadata.author = directive.value;
        break;
      case 'domain':
        metadata.domain = directive.value;
        break;
      case 'tags':
        metadata.tags = Array.isArray(directive.value) ? directive.value : [directive.value];
        break;
      case 'strict':
        metadata.strict = Boolean(directive.value);
        break;
      default:
        // Store custom directives
        if (!metadata.directives) {
          metadata.directives = {};
        }
        metadata.directives[directive.name] = directive.value;
    }

    return metadata;
  }

  visitNode(): Record<string, any> {
    throw new Error('DirectiveProcessorVisitor should not visit nodes');
  }

  visitEdge(): Record<string, any> {
    throw new Error('DirectiveProcessorVisitor should not visit edges');
  }
}

// ============================================================================
// Main Converter with Visitor Pattern
// ============================================================================

/**
 * Enhanced AST converter using visitor pattern
 */
export class EnhancedASTConverter {
  private validator = new LFFValidator();
  private nodeVisitor = new NodeConverterVisitor();
  private edgeVisitor = new EdgeConverterVisitor();
  private directiveVisitor = new DirectiveProcessorVisitor();

  /**
   * Convert LFF AST to Core AST with comprehensive validation
   */
  convert(lffAST: LFFQ, options: ConversionOptions = {}): {
    ast: GraphAST | null;
    errors: ConversionError[];
    warnings: ConversionError[];
    metrics?: {
      validationTime: number;
      conversionTime: number;
      totalTime: number;
    };
    /** Legacy success flag */
    success?: boolean;
    /** Legacy graph alias for ast */
    graph?: GraphAST | null;
    /** Optional debug info */
    debugInfo?: Record<string, any>;
  } {
    const startTime = performance.now();
    ConversionLogger.time('Total Conversion');

    // Normalize options
    const normalizedOptions: Required<ConversionOptions> = {
      defaultNodeType: options.defaultNodeType || 'component',
      defaultEdgeType: options.defaultEdgeType || 'connection',
      preserveLFFMetadata: options.preserveLFFMetadata ?? true,
      generateUniqueIds: options.generateUniqueIds ?? options.generateIds ?? true,
      strictMode: options.strictMode ?? false,
      preserveSourceLocations: options.preserveSourceLocations ?? false,
      debugMode: options.debugMode ?? false,
      generateIds: options.generateIds ?? options.generateUniqueIds ?? true
    };

    // Phase 1: Validation
    ConversionLogger.debug('Starting validation phase');
    const validation = this.validator.validate(lffAST);
    
    if (!validation.valid) {
      ConversionLogger.error(`Validation failed with ${validation.errors.length} errors`);
      return {
        ast: null,
        errors: validation.errors,
        warnings: validation.warnings,
        success: false,
        graph: null
      };
    }

    // Phase 2: Conversion
    ConversionLogger.debug('Starting conversion phase');
    const conversionStart = performance.now();
    
    try {
      const context: ConversionContext = {
        anchorMap: new Map(),
        options: normalizedOptions,
        level: 0,
        path: []
      };

      // Convert nodes
      const nodes: GraphNode[] = [];
      for (const node of lffAST.nodes) {
        const convertedNodes = this.nodeVisitor.visitNode(node, context);
        nodes.push(...convertedNodes);
      }

      // Convert edges
      const edges: Edge[] = [];
      for (const edge of lffAST.edges) {
        const convertedEdge = this.edgeVisitor.visitEdge(edge, context);
        edges.push(convertedEdge);
      }

      // Process directives
      let metadata: Record<string, any> = {};
      for (const directive of lffAST.directives) {
        const directiveMetadata = this.directiveVisitor.visitDirective(directive, context);
        metadata = { ...metadata, ...directiveMetadata };
      }

      // Add parser metadata
      if (normalizedOptions.preserveLFFMetadata) {
        metadata.parser = {
          version: '2.0.0',
          source: 'lff-enhanced',
          parseErrors: lffAST.errors,
          ...(lffAST.comments && { comments: lffAST.comments })
        };
      }

      const conversionTime = performance.now() - conversionStart;
      const totalTime = performance.now() - startTime;

      ConversionLogger.timeEnd('Total Conversion');
      ConversionLogger.debug(`Conversion complete: ${nodes.length} nodes, ${edges.length} edges`);

      const ast: GraphAST = { nodes, edges, metadata };
      return {
        ast,
        errors: [],
        warnings: validation.warnings,
        metrics: {
          validationTime: conversionStart - startTime,
          conversionTime,
          totalTime
        },
        success: true,
        graph: ast
      };

    } catch (error) {
      ConversionLogger.error('Conversion failed', error);
      
      const conversionError: ConversionError = {
        type: 'conversion',
        category: 'structure',
        message: `Conversion failed: ${error instanceof Error ? error.message : String(error)}`,
        location: { startLine: 0, endLine: 0, startColumn: 0, endColumn: 0, indent: 0 },
        severity: 'error'
      };

      return {
        ast: null,
        errors: [conversionError],
        warnings: validation.warnings,
        success: false,
        graph: null
      };
    }
  }

  /**
   * Register custom visitor for extensions
   */
  registerVisitor<T>(elementType: 'node' | 'edge' | 'directive', visitor: ASTVisitor<T>): void {
    switch (elementType) {
      case 'node':
        this.nodeVisitor = visitor as any;
        break;
      case 'edge':
        this.edgeVisitor = visitor as any;
        break;
      case 'directive':
        this.directiveVisitor = visitor as any;
        break;
    }
    ConversionLogger.debug(`Registered custom visitor for ${elementType}`);
  }
}

// ============================================================================
// Public API (Backward Compatibility)
// ============================================================================

/**
 * Convert LFF AST to Core GraphAST (legacy API)
 * @deprecated Use EnhancedASTConverter for better features
 */
export function convertLFFToCore(lffAST: LFFQ, options: ConversionOptions = {}): GraphAST {
  const converter = new EnhancedASTConverter();
  const result = converter.convert(lffAST, options);
  
  if (!result.ast) {
    throw new Error(`Conversion failed: ${result.errors.map(e => e.message).join(', ')}`);
  }
  
  return result.ast;
}

/**
 * Convert with validation (enhanced API)
 */
export function convertLFFToCoreWithValidation(
  lffAST: LFFQ,
  options: ConversionOptions = {}
): {
  ast: GraphAST | null;
  errors: ConversionError[];
  warnings?: ConversionError[];
} {
  const converter = new EnhancedASTConverter();
  const result = converter.convert(lffAST, options);
  
  return {
    ast: result.ast,
    errors: result.errors,
    warnings: result.warnings
  };
}

/**
 * Create converter instance for advanced usage
 */
export function createConverter(): EnhancedASTConverter {
  return new EnhancedASTConverter();
}
export { EnhancedASTConverter as ASTConverter };

