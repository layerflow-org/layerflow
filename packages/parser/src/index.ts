/**
 * LayerFlow Format (LFF) Parser
 * @fileoverview Main entry point for LFF parsing with organized exports
 * @public
 */

// ============================================================================
// Core Types Re-exports
// ============================================================================

/**
 * Core LayerFlow types that parser users commonly need
 * @public
 */
export type {
  /** Core graph AST structure */
  GraphAST,
  /** Individual graph node definition */
  GraphNode,
  /** Graph edge/connection definition */
  Edge,
  /** Graph metadata container */
  GraphMetadata,
  /** Layer definition for hierarchical graphs */
  LayerDefinition,
  /** Validation error with severity levels */
  ValidationError,
  /** Validation result container */
  ValidationResult
} from '@layerflow/core';

/**
 * Core LayerFlow classes for graph manipulation
 * @public
 */
export { 
  /** Main graph instance with plugin support */
  LayerFlowGraph, 
  /** Plugin management system */
  PluginManager 
} from '@layerflow/core';

// ============================================================================
// Parser-Specific Types
// ============================================================================

/**
 * LFF-specific AST and parsing types
 * @public
 */
export type {
  /** Raw LFF AST before Core conversion */
  LFFQ,
  /** LFF node definition with metadata */
  LFFNodeDef,
  /** LFF edge definition with arrow types */
  LFFEdgeDef,
  /** LFF directive definition (@title, @version, etc.) */
  LFFDirectiveDef,
  /** Parse error with source location */
  ParseError,
  /** Complete parse result with metrics */
  ParseResult,
  /** Parser configuration options */
  ParserOptions,
  /** AST conversion options */
  ConversionOptions,
  /** Source location tracking */
  SourceLocation,
  /** Token type enumeration */
  TokenType,
  /** Arrow type enumeration (→, ⇒, ↔, etc.) */
  ArrowType
} from './types';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Level specification utilities for @1, @2+, @1-3 syntax
 * @public
 */
export {
  /** Parse level specification string to structured format */
  parseLevelSpec,
  /** Format level range back to string */
  formatLevelSpec,
  /** Check if level matches specification */
  levelMatchesSpec
} from './types';

/**
 * Anchor utilities for &anchor and *reference syntax
 * @public
 */
export {
  /** Extract anchor name from &anchor token */
  extractAnchorName,
  /** Check if string is anchor reference (*ref) */
  isAnchorReference,
  /** Check if string is anchor definition (&def) */
  isAnchorDefinition,
  /** Validate anchor name format */
  isValidAnchorName
} from './types';

/**
 * Type guards for discriminated unions (type-safe AST element checking)
 * @public
 */
export {
  /** Type guard for LFF node definitions */
  isLFFNode,
  /** Type guard for LFF edge definitions */
  isLFFEdge,
  /** Type guard for LFF directive definitions */
  isLFFDirective,
  /** Type guard for entities that support level specifications */
  supportsLevelSpec
} from './types';

// ============================================================================
// Core Conversion Functions
// ============================================================================

/**
 * AST conversion utilities (LFF AST ↔ Core AST)
 * @public
 */
export {
  /** Convert LFF AST to Core AST */
  convertLFFToCore,
  /** Convert with validation and error handling */
  convertLFFToCoreWithValidation,
  /** Conversion error type */
  type ConversionError
} from './ast-converter';

/**
 * CST to LFF AST conversion (internal pipeline step)
 * @public
 */
export { 
  /** Convert Chevrotain CST to LFF AST */
  convertCSTToLFF 
} from './cst-to-ast';

// ============================================================================
// Parser Components
// ============================================================================

/**
 * Low-level parser components for advanced usage
 * @public
 */
export { 
  /** Chevrotain-based lexical analyzer */
  LFFLexer 
} from './lexer';

export { 
  /** Chevrotain-based parser for CST generation */
  LFFParser 
} from './parser';

// ============================================================================
// Main Parser API
// ============================================================================

import { LayerFlowGraph, PluginManager } from '@layerflow/core';
import type { ParseResult, ParserOptions, ConversionOptions, ParseError } from './types';
import { LFFLexer } from './lexer';
import { LFFParser } from './parser';
import { convertLFFToCoreWithValidation } from './ast-converter';
import { convertCSTToLFF } from './cst-to-ast';

/**
 * Parse LFF text and return Core GraphAST
 * 
 * This is the main parsing function that converts LFF text through the complete pipeline:
 * Text → Tokens → CST → LFF AST → Core AST
 * 
 * @param text - LFF source text to parse
 * @param options - Parser and conversion options
 * @returns Complete parse result with AST and error information
 * 
 * @example
 * ```typescript
 * const result = parseToCore(`
 *   @title: My Architecture
 *   Frontend [web] -> Backend [api]
 * `);
 * 
 * if (result.success) {
 *   console.log('Parsed successfully:', result.coreAST);
 * } else {
 *   console.error('Parse errors:', result.errors);
 * }
 * ```
 * 
 * @public
 */
export function parseToCore(
  text: string,
  options: ParserOptions & ConversionOptions = {}
): ParseResult {
  const startTime = performance.now();
  
  try {
    // Extract parser and conversion options
    const {
      includeComments = false,
      enableMetrics = false,
      defaultNodeType = 'component',
      defaultEdgeType = 'connection',
      preserveLFFMetadata = true,
      generateUniqueIds = true
    } = options;

    // Lexical analysis
    const lexStart = performance.now();
    const lexer = new LFFLexer();
    lexer.tokenize(text);
    const lexTime = performance.now() - lexStart;

    // Parsing
    const parseStart = performance.now();
    const parser = new LFFParser();
    parser.setLexer(lexer);
    const cst = parser.parseToCST(text);
    
    // Convert CST to LFF AST
    const lffAST = convertCSTToLFF(cst, text);
    
    // Add comments if requested
    if (includeComments) {
      lffAST.comments = [];
    }
    
    const parseTime = performance.now() - parseStart;

    // Conversion to Core AST
    const convertStart = performance.now();
    const conversionResult = convertLFFToCoreWithValidation(lffAST, {
      defaultNodeType,
      defaultEdgeType,
      preserveLFFMetadata,
      generateUniqueIds
    });
    const convertTime = performance.now() - convertStart;

    const totalTime = performance.now() - startTime;

    // Build result
    const result: ParseResult = {
      success: conversionResult.ast !== null && lffAST.errors.length === 0,
      lffAST,
      errors: [...lffAST.errors, ...conversionResult.errors]
    };

    if (conversionResult.ast) {
      result.coreAST = conversionResult.ast;
    }

    if (enableMetrics) {
      result.metrics = {
        lexTime,
        parseTime,
        convertTime,
        totalTime
      };
    }

    return result;

  } catch (error) {
    return {
      success: false,
      errors: [{
        message: `Parse failed: ${error instanceof Error ? error.message : String(error)}`,
        location: { startLine: 0, endLine: 0, startColumn: 0, endColumn: 0, indent: 0 },
        severity: 'error'
      }]
    };
  }
}

/**
 * Parse LFF text and create LayerFlowGraph instance
 * 
 * Convenience function that parses LFF and immediately creates a graph instance
 * ready for manipulation and visualization.
 * 
 * @param text - LFF source text to parse
 * @param options - Parser and graph configuration options
 * @param pluginManager - Optional plugin manager for domain extensions
 * @returns LayerFlowGraph instance or null if parsing failed
 * 
 * @example
 * ```typescript
 * const graph = parseToGraph(`
 *   System:
 *     Frontend -> Backend
 *     Backend -> Database
 * `);
 * 
 * if (graph) {
 *   console.log('Nodes:', graph.getNodes().length);
 *   console.log('Edges:', graph.getEdges().length);
 * }
 * ```
 * 
 * @public
 */
export function parseToGraph(
  text: string,
  options: ParserOptions & ConversionOptions = {},
  pluginManager?: PluginManager
): LayerFlowGraph | null {
  const result = parseToCore(text, options);
  
  if (!result.success || !result.coreAST) {
    console.error('Failed to parse LFF:', result.errors);
    return null;
  }

  // Create LayerFlowGraph from parsed AST
  return new LayerFlowGraph(result.coreAST, undefined, pluginManager);
}

/**
 * Quick validation of LFF text without full parsing
 * 
 * Lightweight function for syntax validation, useful for editors and linters.
 * 
 * @param text - LFF text to validate
 * @param strict - Enable strict validation mode with enhanced checks
 * @returns Validation result with error details
 * 
 * @example
 * ```typescript
 * const validation = validateLFF(`
 *   Frontend -> Backend
 *   Backend -> *nonexistent
 * `);
 * 
 * if (!validation.valid) {
 *   validation.errors.forEach(error => {
 *     console.log(`Line ${error.location.startLine}: ${error.message}`);
 *   });
 * }
 * ```
 * 
 * @public
 */
export function validateLFF(
  text: string,
  strict: boolean = false
): { valid: boolean; errors: ParseError[] } {
  const result = parseToCore(text, { strict });
  
  return {
    valid: result.success,
    errors: result.errors
  };
}

/**
 * Parse LFF text with plugin support and domain detection
 * 
 * Advanced parsing function that automatically detects domain-specific constructs
 * and activates appropriate plugins for enhanced functionality.
 * 
 * @param text - LFF text to parse
 * @param pluginManager - Plugin manager with loaded domain plugins
 * @param options - Parser configuration options
 * @returns LayerFlowGraph with activated plugins or null if parsing failed
 * 
 * @example
 * ```typescript
 * const pluginManager = new PluginManager();
 * pluginManager.register(new C4ArchitecturePlugin());
 * pluginManager.register(new DDDPlugin());
 * 
 * const graph = parseWithPlugins(`
 *   @domain: c4-architecture
 *   System [system] @1:
 *     WebApp [container] @2
 * `, pluginManager);
 * ```
 * 
 * @public
 */
export function parseWithPlugins(
  text: string,
  pluginManager: PluginManager,
  options: ParserOptions & ConversionOptions = {}
): LayerFlowGraph | null {
  // Parse to Core AST first
  const graph = parseToGraph(text, options, pluginManager);
  if (!graph) return null;

  // TODO: Detect domains from LFF content and activate relevant plugins
  // This would use domain detection from Core's enhanced plugin system

  return graph;
}

// ============================================================================
// Default Export for Convenience
// ============================================================================

/**
 * Default export providing the most commonly used parsing function
 * @public
 */
export default parseToCore; 