/**
 * LayerFlow Format (LFF) Lexer with Enhanced Performance and Diagnostics
 * @fileoverview High-performance lexical analyzer with strict validation and detailed error reporting
 * @public
 */

import { createToken, Lexer, TokenType as ChevrotainTokenType, ILexingError, IToken } from 'chevrotain';
import { SourceLocation } from './types';

// ============================================================================
// Enhanced Error Reporting
// ============================================================================

/**
 * Enhanced lexing error with detailed context
 * @public
 */
export interface EnhancedLexingError extends ILexingError {
  /** Error severity */
  severity: 'error' | 'warning';
  /** Error code for programmatic handling */
  code: string;
  /** Suggested fixes */
  suggestions?: string[];
  /** Context around the error */
  context?: {
    before: string;
    after: string;
    line: string;
  };
}

/**
 * Lexing result with enhanced diagnostics
 * @public
 */
export interface EnhancedLexingResult {
  /** Successfully tokenized tokens */
  tokens: IToken[];
  /** Lexing errors with enhanced information */
  errors: EnhancedLexingError[];
  /** Performance metrics */
  metrics: {
    /** Total lexing time (ms) */
    lexTime: number;
    /** Number of tokens generated */
    tokenCount: number;
    /** Characters processed per second */
    throughput: number;
  };
  /** Source information */
  sourceInfo: {
    /** Total characters */
    length: number;
    /** Number of lines */
    lineCount: number;
    /** Character encoding detected */
    encoding?: string;
  };
}

// ============================================================================
// Performance-Optimized Token Definitions (Order-Sensitive)
// ============================================================================

// PERFORMANCE: Most frequent tokens first for faster matching

/**
 * Whitespace token (most common, processed first)
 */
export const Whitespace = createToken({
  name: 'Whitespace',
  pattern: /[ \t]+/,
  group: Lexer.SKIPPED,
  line_breaks: false
});

/**
 * Identifier token (very common, early in order)
 * STRICT: Must start with letter, can contain letters, numbers, underscores, hyphens
 */
export const Identifier = createToken({
  name: 'Identifier',
  pattern: /[a-zA-Z][a-zA-Z0-9_-]{0,63}/,  // Max 64 chars for performance
  line_breaks: false
});

/**
 * Newline token (structural, frequent)
 */
export const Newline = createToken({
  name: 'Newline',
  pattern: /\r?\n/,
  line_breaks: true
});

/**
 * Colon token (very frequent in LFF)
 */
export const Colon = createToken({
  name: 'Colon',
  pattern: /:/,
  line_breaks: false
});

// ============================================================================
// Arrow Tokens (Order Critical for Longest Match)
// ============================================================================

/**
 * Bidirectional arrow (longest pattern first)
 * STRICT: Exact match only
 */
export const ArrowBidirectional = createToken({
  name: 'ArrowBidirectional',
  pattern: /<->/,
  line_breaks: false
});

/**
 * Dashed arrow (second longest)
 * STRICT: Exact match only
 */
export const ArrowDashed = createToken({
  name: 'ArrowDashed',
  pattern: /-->/,
  line_breaks: false
});

/**
 * Multiple/broadcast arrow
 * STRICT: Exact match only
 */
export const ArrowMultiple = createToken({
  name: 'ArrowMultiple',
  pattern: /=>/,
  line_breaks: false
});

/**
 * Simple arrow (most common, last to avoid conflicts)
 * STRICT: Exact match only
 */
export const ArrowSimple = createToken({
  name: 'ArrowSimple',
  pattern: /->/,
  line_breaks: false
});

// ============================================================================
// LFF-Specific Tokens (Strict Validation)
// ============================================================================

/**
 * Level specification token
 * STRICT: @{number}[+|{-number}] format only
 * Examples: @1, @2+, @1-3, @10-15
 * Invalid: @0, @1-, @1-0, @abc
 */
export const LevelSpec = createToken({
  name: 'LevelSpec',
  pattern: /@(?:[1-9]\d*(?:\+|(?:-(?:[1-9]\d*)))?)/, // No @0, proper ranges
  line_breaks: false
});

/**
 * Directive token
 * STRICT: @{identifier} format, reserved keywords validation
 * Examples: @title, @version, @domain
 * Invalid: @123, @-invalid, @@double
 */
export const Directive = createToken({
  name: 'Directive',
  pattern: /@(?:title|version|domain|author|description|tags|strict|encoding|[a-zA-Z][a-zA-Z0-9_-]{0,31})/,
  line_breaks: false
});

/**
 * Anchor definition token
 * STRICT: &{valid-identifier} format only
 * Examples: &user, &api-service, &database_1
 * Invalid: &123, &-invalid, &&double
 */
export const AnchorDef = createToken({
  name: 'AnchorDef',
  pattern: /&[a-zA-Z][a-zA-Z0-9_-]{0,31}/,  // Max 32 chars total
  line_breaks: false
});

/**
 * Anchor reference token
 * STRICT: *{valid-identifier} format only
 * Examples: *user, *api-service, *database_1
 * Invalid: *123, *-invalid, **double
 */
export const AnchorRef = createToken({
  name: 'AnchorRef',
  pattern: /\*[a-zA-Z][a-zA-Z0-9_-]{0,31}/,  // Max 32 chars total
  line_breaks: false
});

// ============================================================================
// Structural Tokens
// ============================================================================

/**
 * Indentation token
 * STRICT: Only even number of spaces (2, 4, 6, 8, etc.)
 * Maximum 16 levels (32 spaces) for performance
 */
export const Indent = createToken({
  name: 'Indent',
  pattern: /^(?:  ){1,16}/,  // 2-32 spaces, even only
  line_breaks: false
});

/**
 * Array/type list opening bracket
 */
export const BracketOpen = createToken({
  name: 'BracketOpen',
  pattern: /\[/,
  line_breaks: false
});

/**
 * Array/type list closing bracket
 */
export const BracketClose = createToken({
  name: 'BracketClose',
  pattern: /\]/,
  line_breaks: false
});

/**
 * Comma separator for arrays and type lists
 */
export const Comma = createToken({
  name: 'Comma',
  pattern: /,/,
  line_breaks: false
});

// ============================================================================
// Literal Value Tokens (Strict Validation)
// ============================================================================

/**
 * String literal token
 * STRICT: Proper escape sequence validation
 * Supports: \n, \t, \r, \\, \", \'
 * Invalid: \x, \u without proper format
 */
export const StringLiteral = createToken({
  name: 'StringLiteral',
  pattern: /"(?:[^"\\]|\\[ntr\\"])*"/,
  line_breaks: false
});

/**
 * Number literal token
 * STRICT: Integer or decimal format only
 * Examples: 123, 123.45, 0, 0.1
 * Invalid: .123, 123., 123.45.67, 01 (leading zeros)
 */
export const NumberLiteral = createToken({
  name: 'NumberLiteral',
  pattern: /(?:0|[1-9]\d*)(?:\.\d+)?/,
  line_breaks: false
});

/**
 * Boolean true literal
 * STRICT: Exact match only
 */
export const BooleanTrue = createToken({
  name: 'BooleanTrue',
  pattern: /true/,
  line_breaks: false,
  longer_alt: Identifier  // Prevent "truex" from being tokenized as "true" + "x"
});

/**
 * Boolean false literal
 * STRICT: Exact match only
 */
export const BooleanFalse = createToken({
  name: 'BooleanFalse',
  pattern: /false/,
  line_breaks: false,
  longer_alt: Identifier  // Prevent "falsex" from being tokenized as "false" + "x"
});

// ============================================================================
// Comment Token
// ============================================================================

/**
 * Comment token
 * STRICT: # followed by any characters until end of line
 */
export const Comment = createToken({
  name: 'Comment',
  pattern: /#[^\r\n]*/,
  group: 'comments',
  line_breaks: false
});

// ============================================================================
// Performance-Optimized Token Array
// ============================================================================

/**
 * Core token array optimized for performance
 * Order is critical: most frequent tokens first, longest patterns before shorter ones
 */
export const coreTokens: ChevrotainTokenType[] = [
  // PERFORMANCE: Most frequent tokens first
  Whitespace,              // Most common
  Identifier,              // Very common
  Newline,                 // Structural, frequent
  Colon,                   // Very frequent in LFF
  
  // CORRECTNESS: Longest patterns first to avoid conflicts
  ArrowBidirectional,      // <-> (longest arrow)
  ArrowDashed,             // --> (second longest)
  ArrowMultiple,           // => 
  ArrowSimple,             // -> (shortest arrow)
  
  // LFF-SPECIFIC: Order matters for @ prefix
  LevelSpec,               // @1, @2+ (before Directive to avoid conflicts)
  Directive,               // @title, @version
  
  // ANCHORS: Order doesn't matter between these
  AnchorDef,               // &anchor
  AnchorRef,               // *anchor
  
  // LITERALS: Specific before general
  StringLiteral,           // "string"
  BooleanTrue,             // true (before Identifier)
  BooleanFalse,            // false (before Identifier)
  NumberLiteral,           // 123, 123.45
  
  // STRUCTURAL: Order doesn't matter
  BracketOpen,             // [
  BracketClose,            // ]
  Comma,                   // ,
  
  // LAYOUT: Last
  Comment,                 // # comment
  Indent                   // Leading spaces
];

// ============================================================================
// Enhanced LFF Lexer with Diagnostics
// ============================================================================

/**
 * Enhanced LFF Lexer with performance optimization and detailed error reporting
 * 
 * Features:
 * - Performance-optimized token ordering
 * - Strict regex validation
 * - Enhanced error diagnostics with suggestions
 * - Metrics collection
 * - Plugin support for token extensions
 * 
 * @public
 */
export class LFFLexer {
  private lexer: Lexer;
  private tokens: ChevrotainTokenType[];
  private errorPatterns: Map<string, { code: string; suggestions: string[] }> = new Map();

  constructor() {
    this.tokens = [...coreTokens];
    this.lexer = new Lexer(this.tokens, {
      // Performance optimizations
      ensureOptimizations: true,
      positionTracking: 'full',
      lineTerminatorsPattern: /\n|\r\n?/g,
      lineTerminatorCharacters: ['\n', '\r']
    });
    
    this.initializeErrorPatterns();
  }

  /**
   * Initialize common error patterns and their suggestions
   */
  private initializeErrorPatterns(): void {
    this.errorPatterns = new Map([
      // Level specification errors
      ['@0', { code: 'INVALID_LEVEL_ZERO', suggestions: ['Use @1 instead (levels start from 1)'] }],
      ['@-', { code: 'INCOMPLETE_LEVEL_RANGE', suggestions: ['Use @1-3 format for level ranges'] }],
      ['@@', { code: 'DOUBLE_AT_SYMBOL', suggestions: ['Use single @ for directives and levels'] }],
      
      // Anchor errors
      ['&-', { code: 'INVALID_ANCHOR_START', suggestions: ['Anchor names must start with a letter'] }],
      ['*-', { code: 'INVALID_REFERENCE_START', suggestions: ['Reference names must start with a letter'] }],
      ['&&', { code: 'DOUBLE_ANCHOR_SYMBOL', suggestions: ['Use single & for anchor definitions'] }],
      ['**', { code: 'DOUBLE_REFERENCE_SYMBOL', suggestions: ['Use single * for anchor references'] }],
      
      // Arrow errors
      ['<-', { code: 'INCOMPLETE_BIDIRECTIONAL_ARROW', suggestions: ['Use <-> for bidirectional arrows'] }],
      ['--', { code: 'INCOMPLETE_DASHED_ARROW', suggestions: ['Use --> for dashed arrows'] }],
      
      // String errors
      ['"', { code: 'UNTERMINATED_STRING', suggestions: ['Close string with matching quote'] }],
      
      // Number errors
      ['.', { code: 'INVALID_NUMBER_FORMAT', suggestions: ['Use 0.5 instead of .5', 'Numbers cannot start with decimal point'] }],
      
      // Indentation errors
      [' ', { code: 'INVALID_INDENTATION', suggestions: ['Use even number of spaces (2, 4, 6, 8, etc.)', 'Maximum 32 spaces (16 levels)'] }]
    ]);
  }

  /**
   * Enhanced tokenization with detailed error reporting and metrics
   * 
   * @param text - Input text to tokenize
   * @param options - Tokenization options
   * @returns Enhanced lexing result with diagnostics and metrics
   * 
   * @example
   * ```typescript
   * const lexer = new LFFLexer();
   * const result = lexer.tokenize(`
   *   @title: "My Architecture"
   *   Frontend [web] -> Backend [api]
   * `);
   * 
   * if (result.errors.length === 0) {
   *   console.log(`Tokenized ${result.tokens.length} tokens in ${result.metrics.lexTime}ms`);
   * } else {
   *   result.errors.forEach(error => {
   *     console.error(`${error.severity}: ${error.message} (${error.code})`);
   *     error.suggestions?.forEach(suggestion => {
   *       console.log(`  Suggestion: ${suggestion}`);
   *     });
   *   });
   * }
   * ```
   */
  tokenize(text: string, options: {
    includeComments?: boolean;
    collectMetrics?: boolean;
    enhancedErrors?: boolean;
  } = {}): EnhancedLexingResult {
    const startTime = performance.now();
    const lines = text.split(/\r?\n/);
    
    // Basic tokenization
    const basicResult = this.lexer.tokenize(text);
    const lexTime = performance.now() - startTime;
    
    // Enhanced error processing
    const enhancedErrors: EnhancedLexingError[] = [];
    
    if (options.enhancedErrors !== false) {
      basicResult.errors.forEach(error => {
        const enhanced = this.enhanceError(error, text, lines);
        enhancedErrors.push(enhanced);
      });
      
      // Additional validation for common mistakes
      this.validateCommonMistakes(text, lines, enhancedErrors);
    } else {
      // Convert basic errors to enhanced format
      basicResult.errors.forEach(error => {
        enhancedErrors.push({
          ...error,
          severity: 'error',
          code: 'LEXICAL_ERROR'
        });
      });
    }

    // Filter tokens based on options
    let tokens = basicResult.tokens;
    if (!options.includeComments) {
      tokens = tokens.filter(token => token.tokenType.name !== 'Comment');
    }

    // Calculate metrics
    const metrics = {
      lexTime,
      tokenCount: tokens.length,
      throughput: text.length / (lexTime / 1000) // chars per second
    };

    const sourceInfo = {
      length: text.length,
      lineCount: lines.length,
      encoding: this.detectEncoding(text)
    };

    return {
      tokens,
      errors: enhancedErrors,
      metrics,
      sourceInfo
    };
  }

  /**
   * Enhance basic lexing error with context and suggestions
   */
  private enhanceError(error: ILexingError, text: string, lines: string[]): EnhancedLexingError {
    const line = error.line || 1;
    const column = error.column || 1;
    const lineText = lines[line - 1] || '';
    
    // Extract context around error
    const before = lineText.substring(0, column - 1);
    const after = lineText.substring(column - 1);
    
    // Try to identify error pattern
    const errorChar = text[error.offset || 0] || '';
    const errorPattern = this.identifyErrorPattern(errorChar, before, after);
    
    const enhanced: EnhancedLexingError = {
      ...error,
      severity: 'error',
      code: errorPattern?.code || 'UNKNOWN_TOKEN',
      suggestions: errorPattern?.suggestions || [],
      context: {
        before,
        after,
        line: lineText
      }
    };

    return enhanced;
  }

  /**
   * Identify error pattern and provide suggestions
   */
  private identifyErrorPattern(errorChar: string, before: string, after: string): { code: string; suggestions: string[] } | null {
    // Check for common patterns
    for (const [pattern, info] of this.errorPatterns) {
      if (before.endsWith(pattern) || after.startsWith(pattern) || errorChar === pattern) {
        return info;
      }
    }

    // Context-based error detection
    if (errorChar === '@') {
      if (/\d/.test(after.charAt(0))) {
        return { code: 'INVALID_DIRECTIVE_NAME', suggestions: ['Directive names must start with a letter'] };
      }
    }

    if (errorChar === '&' || errorChar === '*') {
      if (/\d/.test(after.charAt(0))) {
        return { code: 'INVALID_ANCHOR_NAME', suggestions: ['Anchor names must start with a letter'] };
      }
    }

    return null;
  }

  /**
   * Validate common mistakes not caught by basic lexing
   */
  private validateCommonMistakes(text: string, lines: string[], errors: EnhancedLexingError[]): void {
    lines.forEach((line, lineIndex) => {
      const lineNumber = lineIndex + 1;
      
      // Check for odd indentation
      const indentMatch = line.match(/^( +)/);
      if (indentMatch && indentMatch[1] && indentMatch[1].length % 2 !== 0) {
        const indentLength = indentMatch[1].length;
        errors.push({
          message: `Invalid indentation: ${indentLength} spaces (must be even)`,
          line: lineNumber,
          column: 1,
          length: indentLength,
          offset: text.indexOf(line),
          severity: 'error',
          code: 'ODD_INDENTATION',
          suggestions: [
            `Use ${Math.floor(indentLength / 2) * 2} or ${Math.ceil(indentLength / 2) * 2} spaces`,
            'LFF requires even number of spaces for indentation'
          ],
          context: {
            before: '',
            after: line,
            line
          }
        });
      }

      // Check for tabs
      if (line.includes('\t')) {
        const tabIndex = line.indexOf('\t');
        errors.push({
          message: 'Tabs are not allowed in LFF, use spaces for indentation',
          line: lineNumber,
          column: tabIndex + 1,
          length: 1,
          offset: text.indexOf(line) + tabIndex,
          severity: 'error',
          code: 'TAB_CHARACTER',
          suggestions: [
            'Replace tabs with spaces',
            'Use 2 spaces per indentation level'
          ],
          context: {
            before: line.substring(0, tabIndex),
            after: line.substring(tabIndex + 1),
            line
          }
        });
      }

      // Check for trailing whitespace
      if (line.endsWith(' ') || line.endsWith('\t')) {
        errors.push({
          message: 'Trailing whitespace detected',
          line: lineNumber,
          column: line.trimEnd().length + 1,
          length: line.length - line.trimEnd().length,
          offset: text.indexOf(line) + line.trimEnd().length,
          severity: 'warning',
          code: 'TRAILING_WHITESPACE',
          suggestions: ['Remove trailing whitespace'],
          context: {
            before: line.trimEnd(),
            after: '',
            line
          }
        });
      }
    });
  }

  /**
   * Detect text encoding (basic implementation)
   */
  private detectEncoding(text: string): string {
    // Basic UTF-8 detection
    try {
      const encoded = new TextEncoder().encode(text);
      const decoded = new TextDecoder('utf-8', { fatal: true }).decode(encoded);
      return decoded === text ? 'utf-8' : 'unknown';
    } catch {
      return 'unknown';
    }
  }

  /**
   * Get all registered tokens
   */
  getTokens(): ChevrotainTokenType[] {
    return [...this.tokens];
  }

  /**
   * Add new token for extensions
   * 
   * @param token - Token configuration
   * @param position - Position in token array (for performance optimization)
   */
  addToken(token: ChevrotainTokenType, position?: number): void {
    if (position !== undefined && position >= 0 && position < this.tokens.length) {
      this.tokens.splice(position, 0, token);
    } else {
      this.tokens.push(token);
    }
    
    // Recreate lexer with new tokens
    this.lexer = new Lexer(this.tokens, {
      ensureOptimizations: true,
      positionTracking: 'full'
    });
  }

  /**
   * Remove token by name
   */
  removeToken(tokenName: string): boolean {
    const index = this.tokens.findIndex(token => token.name === tokenName);
    if (index !== -1) {
      this.tokens.splice(index, 1);
      this.lexer = new Lexer(this.tokens);
      return true;
    }
    return false;
  }

  /**
   * Create source location from token
   */
  static createSourceLocation(token: IToken): SourceLocation {
    return {
      startLine: token.startLine || 0,
      endLine: token.endLine || token.startLine || 0,
      startColumn: token.startColumn || 0,
      endColumn: token.endColumn || token.startColumn || 0,
      indent: 0  // Will be calculated by parser
    };
  }

  /**
   * Get lexer performance statistics
   */
  getStats(): {
    tokenCount: number;
    averageTokenLength: number;
    mostFrequentTokens: { name: string; count: number }[];
  } {
    // This would require tracking token usage over time
    // Simplified implementation for now
    return {
      tokenCount: this.tokens.length,
      averageTokenLength: 0,
      mostFrequentTokens: []
    };
  }
}

// ============================================================================
// Enhanced Utility Functions
// ============================================================================

/**
 * Check if token is an arrow with type validation
 */
export function isArrowToken(token: IToken): boolean {
  return token && [
    'ArrowSimple',
    'ArrowMultiple', 
    'ArrowBidirectional',
    'ArrowDashed'
  ].includes(token.tokenType.name);
}

/**
 * Get arrow type from token with validation
 */
export function getArrowType(token: IToken): string {
  if (!isArrowToken(token)) {
    throw new Error(`Token ${token.tokenType.name} is not an arrow token`);
  }
  
  switch (token.tokenType.name) {
    case 'ArrowSimple': return '->';
    case 'ArrowMultiple': return '=>';
    case 'ArrowBidirectional': return '<->';
    case 'ArrowDashed': return '-->';
    default: return '->';
  }
}

/**
 * Validate level specification format
 */
export function validateLevelSpec(levelSpec: string): { valid: boolean; error?: string; suggestion?: string } {
  if (!levelSpec.startsWith('@')) {
    return { valid: false, error: 'Level specification must start with @', suggestion: 'Use @1, @2+, or @1-3 format' };
  }

  const spec = levelSpec.substring(1);
  
  // Check for @0
  if (spec === '0') {
    return { valid: false, error: 'Level 0 is not allowed', suggestion: 'Levels start from 1, use @1' };
  }

  // Validate format
  if (!/^[1-9]\d*(?:\+|(?:-(?:[1-9]\d*)))?$/.test(spec)) {
    return { valid: false, error: 'Invalid level specification format', suggestion: 'Use @1, @2+, or @1-3 format' };
  }

  // Validate range
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
 * Validate anchor name format
 */
export function validateAnchorName(anchorName: string): { valid: boolean; error?: string; suggestion?: string } {
  if (anchorName.length === 0) {
    return { valid: false, error: 'Anchor name cannot be empty', suggestion: 'Use a descriptive name like &user or &database' };
  }

  if (anchorName.length > 32) {
    return { valid: false, error: 'Anchor name too long (max 32 characters)', suggestion: 'Use a shorter, descriptive name' };
  }

  if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(anchorName)) {
    return { valid: false, error: 'Invalid anchor name format', suggestion: 'Use letters, numbers, underscores, and hyphens only' };
  }

  return { valid: true };
}

/**
 * Extract and validate anchor name from token
 */
export function extractAnchorName(token: IToken): { name: string; valid: boolean; error?: string } {
  if (!token?.image) {
    return { name: '', valid: false, error: 'Token has no image' };
  }

  const name = token.image.substring(1); // Remove & or *
  const validation = validateAnchorName(name);
  
  const result: { name: string; valid: boolean; error?: string } = {
    name,
    valid: validation.valid
  };
  
  if (validation.error) {
    result.error = validation.error;
  }
  
  return result;
}

/**
 * Check if token is a level specification with validation
 */
export function isLevelSpecToken(token: IToken): boolean {
  return token?.tokenType?.name === 'LevelSpec';
}

/**
 * Check if token is an anchor definition with validation
 */
export function isAnchorDefToken(token: IToken): boolean {
  return token?.tokenType?.name === 'AnchorDef';
}

/**
 * Check if token is an anchor reference with validation
 */
export function isAnchorRefToken(token: IToken): boolean {
  return token?.tokenType?.name === 'AnchorRef';
} 