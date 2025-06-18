/**
 * Parser-specific types for LayerFlow Format (LFF)
 * @fileoverview Types specific to LFF parsing with discriminated unions and strict typing
 * @public
 */

// Re-export core types that parser uses
export type {
  GraphAST,
  GraphNode,
  Edge,
  GraphMetadata,
  LayerDefinition,
  ValidationError,
  ValidationResult
} from '@layerflow/core';

// Import GraphAST for direct use
import type { GraphAST } from '@layerflow/core';

// ============================================================================
// Source Location and Error Types
// ============================================================================

/**
 * Source location in LFF text with precise positioning information
 * 
 * @public
 * @interface SourceLocation
 */
export interface SourceLocation {
  /** Starting line number (1-indexed) */
  startLine: number;
  /** Ending line number (1-indexed, inclusive) */
  endLine: number;
  /** Starting column number (1-indexed) */
  startColumn: number;
  /** Ending column number (1-indexed, inclusive) */
  endColumn: number;
  /** Indentation level (0-based, number of spaces/tabs) */
  indent: number;
}

/**
 * Parse error with source location and severity classification
 * 
 * @public
 * @interface ParseError
 */
export interface ParseError {
  /** Human-readable error message */
  message: string;
  /** Exact location where error occurred */
  location: SourceLocation;
  /** Optional error code for programmatic handling */
  code?: string;
  /** Error severity level affecting compilation flow */
  severity: 'error' | 'warning' | 'info';
}

// ============================================================================
// LFF Token System
// ============================================================================

/**
 * Complete enumeration of LFF token types for lexical analysis
 * 
 * @public
 * @enum TokenType
 */
export enum TokenType {
  // Basic value tokens
  IDENTIFIER = 'IDENTIFIER',
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN_TRUE = 'BOOLEAN_TRUE',
  BOOLEAN_FALSE = 'BOOLEAN_FALSE',
  
  // Structural delimiter tokens
  COLON = 'COLON',
  COMMA = 'COMMA',
  ARROW = 'ARROW',
  BRACKET_OPEN = 'BRACKET_OPEN',
  BRACKET_CLOSE = 'BRACKET_CLOSE',
  
  // LFF-specific semantic tokens
  DIRECTIVE = 'DIRECTIVE',
  ANCHOR_DEF = 'ANCHOR_DEF',        // &user
  ANCHOR_REF = 'ANCHOR_REF',        // *user
  LEVEL_SPEC = 'LEVEL_SPEC',        // @1, @2+, @1-3
  COMMENT = 'COMMENT',
  
  // Layout and control tokens
  NEWLINE = 'NEWLINE',
  INDENT = 'INDENT',
  DEDENT = 'DEDENT',
  EOF = 'EOF'
}

/**
 * LFF token with position and indentation tracking
 * 
 * @public
 * @interface LFFToken
 */
export interface LFFToken {
  /** Token type classification */
  type: TokenType;
  /** Raw token value from source text */
  value: string;
  /** Line number where token appears (1-indexed) */
  line: number;
  /** Column number where token starts (1-indexed) */
  column: number;
  /** Indentation level of the line containing this token */
  indent: number;
}

/**
 * Arrow types supported in LFF edge definitions
 * 
 * @public
 * @enum ArrowType
 */
export enum ArrowType {
  /** Simple unidirectional arrow: A -> B */
  SIMPLE = '->',
  /** Multiple/broadcast arrow: A => B */
  MULTIPLE = '=>',
  /** Bidirectional arrow: A <-> B */
  BIDIRECTIONAL = '<->',
  /** Dashed/optional arrow: A --> B */
  DASHED = '-->'
}

// ============================================================================
// Level Specification System (Type-Safe)
// ============================================================================

/**
 * Level range specification for hierarchical positioning
 * 
 * @public
 * @interface LevelRange
 */
export interface LevelRange {
  /** Base level number (1-indexed) */
  base: number;
  /** Type of level specification */
  type: 'exact' | 'plus' | 'range';
  /** End level for range specifications (only present when type === 'range') */
  end?: number;
}

/**
 * Entities that support level specifications in LFF
 * 
 * @public
 * @interface LevelSupported
 */
export interface LevelSupported {
  /** 
   * Level specification string (@1, @2+, @1-3)
   * Only present for entities that support hierarchical positioning
   */
  levelSpec?: string;
}

/**
 * Entities that do not support level specifications
 * 
 * @public
 * @interface LevelUnsupported
 */
export interface LevelUnsupported {
  /** Level specifications are not supported for this entity type */
  levelSpec?: never;
}

// ============================================================================
// LFF AST Node Types (Discriminated Unions)
// ============================================================================

/**
 * Base interface for all LFF AST elements with common properties
 * 
 * @public
 * @interface LFFASTBase
 */
export interface LFFASTBase {
  /** Discriminator field for type-safe switching */
  type: string;
  /** Source location where this element was defined */
  location: SourceLocation;
}

/**
 * LFF node definition with hierarchical support
 * 
 * Nodes support level specifications for hierarchical positioning
 * and can contain child nodes for tree structures.
 * 
 * @public
 * @interface LFFNodeDef
 * @extends LFFASTBase
 * @extends LevelSupported
 */
export interface LFFNodeDef extends LFFASTBase, LevelSupported {
  /** Discriminator: always 'node' */
  type: 'node';
  
  /** 
   * Node identifier/name
   * Must be unique within its scope unless using anchors
   */
  name: string;
  
  /** 
   * Anchor definition for this node (&anchor)
   * Allows referencing this node from other locations
   * Optional: only present when explicitly defined in source
   */
  anchor?: string;
  
  /** 
   * Type annotations for this node [type1, type2]
   * Used for domain-specific classification and validation
   * Optional: defaults to parser's defaultNodeType if not specified
   */
  types?: string[];
  
  /** 
   * Level specification for hierarchical positioning (@1, @2+, @1-3)
   * Optional: only present for nodes with explicit level declarations
   * When absent, level is inferred from indentation
   */
  levelSpec?: string;
  
  /** 
   * Custom properties as key-value pairs
   * Optional: only present when properties are explicitly defined
   * Supports nested objects and arrays
   */
  properties?: Record<string, any>;
  
  /** 
   * Child nodes for hierarchical structures
   * Optional: only present for nodes that contain other nodes
   * Maintains source order for layout preservation
   */
  children?: LFFNodeDef[];
}

/**
 * LFF edge definition for connections between nodes
 * 
 * Edges do not support level specifications as they represent
 * relationships rather than hierarchical positions.
 * 
 * @public
 * @interface LFFEdgeDef
 * @extends LFFASTBase
 * @extends LevelUnsupported
 */
export interface LFFEdgeDef extends LFFASTBase, LevelUnsupported {
  /** Discriminator: always 'edge' */
  type: 'edge';
  
  /** 
   * Source node identifier or anchor reference
   * Can be a direct name or anchor reference (*anchor)
   */
  from: string;
  
  /** 
   * Target node identifier or anchor reference
   * Can be a direct name or anchor reference (*anchor)
   */
  to: string;
  
  /** 
   * Arrow type defining the relationship semantics
   * Determines visual representation and semantic meaning
   */
  arrow: ArrowType | string;
  
  /** 
   * Optional edge label for documentation
   * Only present when explicitly specified in source
   */
  label?: string;
  
  /** 
   * Custom properties for edge metadata
   * Optional: only present when properties are explicitly defined
   * Common properties: weight, color, style, etc.
   */
  properties?: Record<string, any>;
}

/**
 * LFF directive definition for document metadata
 * 
 * Directives do not support level specifications as they represent
 * document-wide configuration rather than hierarchical elements.
 * 
 * @public
 * @interface LFFDirectiveDef
 * @extends LFFASTBase
 * @extends LevelUnsupported
 */
export interface LFFDirectiveDef extends LFFASTBase, LevelUnsupported {
  /** Discriminator: always 'directive' */
  type: 'directive';
  
  /** 
   * Directive name (title, version, domain, etc.)
   * Determines how the directive value should be interpreted
   */
  name: string;
  
  /** 
   * Directive value with type-specific semantics
   * - string: for text values like @title: "My Graph"
   * - number: for numeric values like @version: 1.2
   * - boolean: for flags like @strict: true
   * - string[]: for lists like @tags: [web, api]
   */
  value: string | number | boolean | string[];
}

/**
 * Union type for all LFF AST elements
 * 
 * @public
 * @type LFFASTElement
 */
export type LFFASTElement = LFFNodeDef | LFFEdgeDef | LFFDirectiveDef;

/**
 * Complete LFF AST structure before conversion to Core AST
 * 
 * @public
 * @interface LFFQ
 */
export interface LFFQ {
  /** All node definitions found in the source */
  nodes: LFFNodeDef[];
  
  /** All edge definitions found in the source */
  edges: LFFEdgeDef[];
  
  /** All directive definitions found in the source */
  directives: LFFDirectiveDef[];
  
  /** Parse errors encountered during analysis */
  errors: ParseError[];
  
  /** 
   * Extracted comments from source
   * Optional: only present when includeComments option is enabled
   * Preserves comment text and location for documentation tools
   */
  comments?: string[];
  
  /** 
   * Source text metadata for debugging and tooling
   * Optional: only present when source tracking is enabled
   */
  sourceInfo?: {
    /** Original source text */
    text: string;
    /** Source split into lines for error reporting */
    lines: string[];
    /** Optional file path for multi-file parsing */
    filePath?: string;
  };
}

// ============================================================================
// Parser Configuration
// ============================================================================

/**
 * Parser behavior configuration options
 * 
 * @public
 * @interface ParserOptions
 */
export interface ParserOptions {
  /** 
   * Enable strict parsing mode with enhanced validation
   * Default: false
   * When true: enforces stricter syntax rules and type checking
   */
  strict?: boolean;
  
  /** 
   * Include source location information in AST nodes
   * Default: true
   * When false: omits location data to reduce memory usage
   */
  includeLocations?: boolean;
  
  /** 
   * Extract and preserve comments in the AST
   * Default: false
   * When true: comments are available in LFFQ.comments array
   */
  includeComments?: boolean;
  
  /** 
   * Automatically generate unique IDs for nodes without explicit names
   * Default: true
   * When true: creates IDs like "node_1", "node_2" for unnamed nodes
   */
  autoGenerateIds?: boolean;
  
  /** 
   * Maximum nesting depth for hierarchical structures
   * Default: 10
   * Prevents infinite recursion and stack overflow
   */
  maxDepth?: number;
  
  /** 
   * Generate source maps for debugging and tooling
   * Default: false
   * When true: creates detailed mapping between source and AST
   */
  enableSourceMap?: boolean;
  
  /** 
   * Collect performance metrics during parsing
   * Default: false
   * When true: measures timing for each parsing phase
   */
  enableMetrics?: boolean;
}

/**
 * AST conversion configuration (LFF AST → Core AST)
 * 
 * @public
 * @interface ConversionOptions
 */
export interface ConversionOptions {
  /** 
   * Default node type for nodes without explicit type annotations
   * Default: "component"
   * Used when node has no [type] specification
   */
  defaultNodeType?: string;
  
  /** 
   * Default edge type for edges without explicit type annotations
   * Default: "connection"
   * Used when edge has no type specification in properties
   */
  defaultEdgeType?: string;
  
  /** 
   * Preserve LFF-specific metadata in Core AST
   * Default: true
   * When true: keeps levelSpec, anchor info in node metadata
   */
  preserveLFFMetadata?: boolean;
  
  /** 
   * Generate unique IDs for all nodes during conversion
   * Default: true
   * When true: ensures all nodes have unique identifiers
   */
  generateUniqueIds?: boolean;

  /** @deprecated Use generateUniqueIds */
  generateIds?: boolean;

  /** Enable strict validation mode */
  strictMode?: boolean;

  /** Preserve source locations in output (legacy option) */
  preserveSourceLocations?: boolean;

  /** Enable debug mode with extra diagnostics */
  debugMode?: boolean;
}

/**
 * Complete parse result with success status and detailed information
 * 
 * @public
 * @interface ParseResult
 */
export interface ParseResult {
  /** Whether parsing completed successfully without errors */
  success: boolean;
  
  /** 
   * Raw LFF AST before Core conversion
   * Optional: only present when parsing succeeds
   */
  lffAST?: LFFQ;
  
  /** 
   * Converted Core AST ready for graph operations
   * Optional: only present when conversion succeeds
  */
  coreAST?: GraphAST;

  /**
   * Legacy alias for `coreAST` used in older tests and integrations
   * @deprecated Use `coreAST` instead
   */
  ast?: GraphAST;
  
  /** All errors encountered during parsing and conversion */
  errors: ParseError[];
  
  /** 
   * Performance metrics for optimization
   * Optional: only present when enableMetrics option is true
   */
  metrics?: {
    /** Time spent in lexical analysis (ms) */
    lexTime: number;
    /** Time spent in parsing (ms) */
    parseTime: number;
    /** Time spent in AST conversion (ms) */
    convertTime: number;
    /** Total parsing time (ms) */
    totalTime: number;
  };
}

// ============================================================================
// Level Specification Utilities (Type-Safe)
// ============================================================================

/**
 * Parse level specification string into structured format
 * 
 * @param spec - Level specification string (@1, @2+, @1-3)
 * @returns Parsed level range or null if invalid format
 * 
 * @example
 * ```typescript
 * parseLevelSpec("@1")    // { base: 1, type: 'exact' }
 * parseLevelSpec("@2+")   // { base: 2, type: 'plus' }
 * parseLevelSpec("@1-3")  // { base: 1, type: 'range', end: 3 }
 * parseLevelSpec("@abc")  // null (invalid)
 * ```
 * 
 * @public
 */
export function parseLevelSpec(spec: string): LevelRange | null {
  const cleanSpec = spec.replace(/^@/, '').trim();
  
  if (/^\d+$/.test(cleanSpec)) {
    // @1
    return { base: parseInt(cleanSpec, 10), type: 'exact' };
  }
  
  if (/^\d+\+$/.test(cleanSpec)) {
    // @2+
    return { base: parseInt(cleanSpec.slice(0, -1), 10), type: 'plus' };
  }
  
  const rangeMatch = cleanSpec.match(/^(\d+)-(\d+)$/);
  if (rangeMatch && rangeMatch[1] && rangeMatch[2]) {
    // @1-3
    const start = parseInt(rangeMatch[1], 10);
    const end = parseInt(rangeMatch[2], 10);
    return { base: start, type: 'range', end };
  }
  
  return null;
}

/**
 * Format level range back to specification string
 * 
 * @param range - Level range object
 * @returns Formatted level specification string
 * 
 * @public
 */
export function formatLevelSpec(range: LevelRange): string {
  switch (range.type) {
    case 'exact':
      return `@${range.base}`;
    case 'plus':
      return `@${range.base}+`;
    case 'range':
      return `@${range.base}-${range.end}`;
    default:
      return `@${range.base}`;
  }
}

/**
 * Check if level matches specification
 * 
 * @param level - Level number to test
 * @param spec - Level specification string
 * @returns True if level matches the specification
 * 
 * @public
 */
export function levelMatchesSpec(level: number, spec: string): boolean {
  const range = parseLevelSpec(spec);
  if (!range) return false;
  
  switch (range.type) {
    case 'exact':
      return level === range.base;
    case 'plus':
      return level >= range.base;
    case 'range':
      return level >= range.base && level <= (range.end || range.base);
    default:
      return false;
  }
}

// ============================================================================
// Anchor Utilities (Type-Safe)
// ============================================================================

/**
 * Extract anchor name from &anchor or *anchor token
 * 
 * @param token - Anchor token with prefix
 * @returns Clean anchor name without prefix
 * 
 * @public
 */
export function extractAnchorName(token: string): string {
  return token.replace(/^[&*]/, '');
}

/**
 * Check if string is anchor reference (*anchor)
 * 
 * @param ref - String to test
 * @returns True if string is valid anchor reference
 * 
 * @public
 */
export function isAnchorReference(ref: string): boolean {
  return /^\*[a-zA-Z_][a-zA-Z0-9_]*$/.test(ref);
}

/**
 * Check if string is anchor definition (&anchor)
 * 
 * @param def - String to test
 * @returns True if string is valid anchor definition
 * 
 * @public
 */
export function isAnchorDefinition(def: string): boolean {
  return /^&[a-zA-Z_][a-zA-Z0-9_]*$/.test(def);
}

/**
 * Validate anchor name format
 * 
 * @param name - Anchor name to validate
 * @returns True if name follows valid anchor naming rules
 * 
 * @public
 */
export function isValidAnchorName(name: string): boolean {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
}

// ============================================================================
// Type Guards for Discriminated Unions
// ============================================================================

/**
 * Type guard for LFF node definitions
 * 
 * @param element - LFF AST element to test
 * @returns True if element is a node definition
 * 
 * @public
 */
export function isLFFNode(element: LFFASTElement): element is LFFNodeDef {
  return element.type === 'node';
}

/**
 * Type guard for LFF edge definitions
 * 
 * @param element - LFF AST element to test
 * @returns True if element is an edge definition
 * 
 * @public
 */
export function isLFFEdge(element: LFFASTElement): element is LFFEdgeDef {
  return element.type === 'edge';
}

/**
 * Type guard for LFF directive definitions
 * 
 * @param element - LFF AST element to test
 * @returns True if element is a directive definition
 * 
 * @public
 */
export function isLFFDirective(element: LFFASTElement): element is LFFDirectiveDef {
  return element.type === 'directive';
}

/**
 * Type guard for entities that support level specifications
 * 
 * @param element - LFF AST element to test
 * @returns True if element supports level specifications
 * 
 * @public
 */
export function supportsLevelSpec(element: LFFASTElement): element is LFFNodeDef {
  return isLFFNode(element);
} 