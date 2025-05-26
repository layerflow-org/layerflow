/**
 * LayerFlow Format (LFF) Parser - Chevrotain-based CST Builder
 * @fileoverview Pure CST parser with plugin support and advanced diagnostics
 * @public
 */

import { CstParser, IToken, CstNode } from 'chevrotain';
import { 
  coreTokens,
  Identifier, StringLiteral, NumberLiteral, BooleanTrue, BooleanFalse,
  Directive, LevelSpec, AnchorDef, AnchorRef,
  ArrowSimple, ArrowMultiple, ArrowBidirectional, ArrowDashed,
  Colon, BracketOpen, BracketClose, Comma, Newline, Indent, Comment
} from './lexer';
import { LFFLexer } from './lexer';

// ============================================================================
// Plugin System Types
// ============================================================================

/**
 * Grammar rule extension for plugin system
 * @public
 */
export interface GrammarRule {
  /** Unique rule name */
  name: string;
  /** Rule implementation function */
  implementation: () => void;
  /** Dependencies on other rules */
  dependencies?: string[];
  /** Priority for rule ordering */
  priority?: number;
}

/**
 * Grammar extension registry
 * @public
 */
export interface GrammarExtension {
  /** Extension identifier */
  id: string;
  /** Extension name */
  name: string;
  /** Grammar rules to add */
  rules: GrammarRule[];
  /** Tokens to add */
  tokens?: any[];
}

// ============================================================================
// Diagnostics System
// ============================================================================

/**
 * Parse diagnostic with severity and context
 * @public
 */
export interface ParseDiagnostic {
  /** Diagnostic severity level */
  severity: 'error' | 'warning' | 'info' | 'hint';
  /** Human-readable message */
  message: string;
  /** Error code for programmatic handling */
  code?: string;
  /** Source location */
  location: {
    startLine: number;
    endLine: number;
    startColumn: number;
    endColumn: number;
  };
  /** Related information */
  relatedInformation?: {
    location: { startLine: number; endLine: number; startColumn: number; endColumn: number };
    message: string;
  }[];
  /** Suggested fixes */
  fixes?: {
    title: string;
    edits: {
      range: { startLine: number; endLine: number; startColumn: number; endColumn: number };
      newText: string;
    }[];
  }[];
}

/**
 * Diagnostics collector service
 * @public
 */
export class DiagnosticsService {
  private diagnostics: ParseDiagnostic[] = [];

  /**
   * Add diagnostic
   */
  addDiagnostic(diagnostic: ParseDiagnostic): void {
    this.diagnostics.push(diagnostic);
  }

  /**
   * Add error diagnostic
   */
  addError(message: string, location: ParseDiagnostic['location'], code?: string): void {
    const diagnostic: ParseDiagnostic = {
      severity: 'error',
      message,
      location
    };
    if (code) {
      diagnostic.code = code;
    }
    this.addDiagnostic(diagnostic);
  }

  /**
   * Add warning diagnostic
   */
  addWarning(message: string, location: ParseDiagnostic['location'], code?: string): void {
    const diagnostic: ParseDiagnostic = {
      severity: 'warning',
      message,
      location
    };
    if (code) {
      diagnostic.code = code;
    }
    this.addDiagnostic(diagnostic);
  }

  /**
   * Get all diagnostics
   */
  getDiagnostics(): ParseDiagnostic[] {
    return [...this.diagnostics];
  }

  /**
   * Get diagnostics by severity
   */
  getDiagnosticsBySeverity(severity: ParseDiagnostic['severity']): ParseDiagnostic[] {
    return this.diagnostics.filter(d => d.severity === severity);
  }

  /**
   * Clear all diagnostics
   */
  clear(): void {
    this.diagnostics = [];
  }

  /**
   * Check if has errors
   */
  hasErrors(): boolean {
    return this.diagnostics.some(d => d.severity === 'error');
  }
}

// ============================================================================
// Caching System
// ============================================================================

/**
 * Parse result cache entry
 */
interface CacheEntry {
  /** Cached CST */
  cst: CstNode;
  /** Cached diagnostics */
  diagnostics: ParseDiagnostic[];
  /** Parse time */
  parseTime: number;
  /** Content hash */
  hash: string;
  /** Timestamp */
  timestamp: number;
}

/**
 * Parse result cache with LRU eviction
 * @public
 */
export class ParseCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize: number;
  private maxAge: number;

  constructor(maxSize: number = 100, maxAge: number = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.maxAge = maxAge;
  }

  /**
   * Generate content hash
   */
  private hash(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Get cached result
   */
  get(content: string): CacheEntry | null {
    const hash = this.hash(content);
    const entry = this.cache.get(hash);
    
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(hash);
      return null;
    }
    
    // Move to end (LRU)
    this.cache.delete(hash);
    this.cache.set(hash, entry);
    
    return entry;
  }

  /**
   * Set cache entry
   */
  set(content: string, cst: CstNode, diagnostics: ParseDiagnostic[], parseTime: number): void {
    const hash = this.hash(content);
    
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    
    this.cache.set(hash, {
      cst,
      diagnostics: [...diagnostics],
      parseTime,
      hash,
      timestamp: Date.now()
    });
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number; hitRate?: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }
}

// ============================================================================
// Enhanced Parse Result
// ============================================================================

/**
 * Enhanced parse result with diagnostics and metrics
 * @public
 */
export interface EnhancedParseResult {
  /** Whether parsing succeeded */
  success: boolean;
  /** Generated CST (only for successful parses) */
  cst: CstNode | null;
  /** All diagnostics (errors, warnings, etc.) */
  diagnostics: ParseDiagnostic[];
  /** Performance metrics */
  metrics: {
    /** Lexical analysis time (ms) */
    lexTime: number;
    /** Parsing time (ms) */
    parseTime: number;
    /** Total time (ms) */
    totalTime: number;
    /** Whether result was cached */
    fromCache: boolean;
    /** Token count */
    tokenCount: number;
  };
  /** Source information */
  sourceInfo?: {
    /** Original content */
    content: string;
    /** Content lines */
    lines: string[];
    /** File path (if available) */
    filePath?: string;
  };
}

// ============================================================================
// Main Parser Class
// ============================================================================

/**
 * Enhanced LFF Parser with plugin support and advanced diagnostics
 * 
 * This parser focuses solely on CST generation and delegates AST conversion
 * to separate modules. Supports grammar extensions via plugins and provides
 * comprehensive diagnostics and caching.
 * 
 * @public
 */
export class LFFParser extends CstParser {
  private lexer?: LFFLexer;
  private diagnostics: DiagnosticsService;
  private cache: ParseCache;
  private extensions: Map<string, GrammarExtension> = new Map();
  private enableCaching: boolean;

  // ============================================================================
  // Core Grammar Rules (LFF Specification)
  // ============================================================================

  /**
   * Document root rule
   */
  public document = this.RULE('document', () => {
    this.MANY(() => {
      this.OR([
        { ALT: () => this.SUBRULE(this.directive) },
        { ALT: () => this.SUBRULE(this.node) },
        { ALT: () => this.SUBRULE(this.edge) },
        { ALT: () => this.SUBRULE(this.comment) },
        { ALT: () => this.CONSUME(Newline) }
      ]);
    });
  });

  /**
   * Directive rule (@title: value)
   */
  public directive = this.RULE('directive', () => {
    this.CONSUME(Directive);
    this.CONSUME(Colon);
    this.SUBRULE(this.value);
    this.OPTION(() => this.CONSUME(Newline));
  });

  /**
   * Node definition rule
   */
  public node = this.RULE('node', () => {
    this.SUBRULE(this.nodeIdentifier);
    
    // Optional anchor definition (&anchor)
    this.OPTION(() => this.SUBRULE(this.anchorDef));
    
    // Optional type list [type1, type2]
    this.OPTION2(() => this.SUBRULE(this.typeList));
    
    // Optional level specification (@1, @2+, @1-3)
    this.OPTION3(() => this.SUBRULE(this.levelSpec));
    
    // Optional node content (properties or children)
    this.OPTION4(() => {
      this.CONSUME(Colon);
      this.OR([
        { ALT: () => this.SUBRULE(this.nodeBlock) },
        { ALT: () => this.SUBRULE(this.value) }
      ]);
    });
    
    this.OPTION5(() => this.CONSUME(Newline));
  });

  /**
   * Edge definition rule (from -> to)
   */
  public edge = this.RULE('edge', () => {
    this.SUBRULE(this.nodeReference, { LABEL: 'from' });
    this.SUBRULE(this.arrow);
    this.SUBRULE2(this.nodeReference, { LABEL: 'to' });
    
    // Optional edge label
    this.OPTION(() => {
      this.CONSUME(Colon);
      this.SUBRULE(this.value, { LABEL: 'label' });
    });
    
    this.OPTION2(() => this.CONSUME(Newline));
  });

  /**
   * Anchor definition rule (&anchor)
   */
  public anchorDef = this.RULE('anchorDef', () => {
    this.CONSUME(AnchorDef);
  });

  /**
   * Anchor reference rule (*anchor)
   */
  public anchorRef = this.RULE('anchorRef', () => {
    this.CONSUME(AnchorRef);
  });

  /**
   * Level specification rule (@1, @2+, @1-3)
   */
  public levelSpec = this.RULE('levelSpec', () => {
    this.CONSUME(LevelSpec);
  });

  /**
   * Node identifier rule
   */
  public nodeIdentifier = this.RULE('nodeIdentifier', () => {
    this.OR([
      { ALT: () => this.CONSUME(Identifier) },
      { ALT: () => this.CONSUME(StringLiteral) }
    ]);
  });

  /**
   * Node reference rule (for edges)
   */
  public nodeReference = this.RULE('nodeReference', () => {
    this.OR([
      { ALT: () => this.CONSUME(Identifier) },
      { ALT: () => this.CONSUME(StringLiteral) },
      { ALT: () => this.SUBRULE(this.anchorRef) }
    ]);
  });

  /**
   * Type list rule [type1, type2]
   */
  public typeList = this.RULE('typeList', () => {
    this.CONSUME(BracketOpen);
    this.MANY_SEP({
      SEP: Comma,
      DEF: () => this.CONSUME(Identifier, { LABEL: 'type' })
    });
    this.CONSUME(BracketClose);
  });

  /**
   * Arrow rule (all arrow types)
   */
  public arrow = this.RULE('arrow', () => {
    this.OR([
      { ALT: () => this.CONSUME(ArrowBidirectional) },
      { ALT: () => this.CONSUME(ArrowDashed) },
      { ALT: () => this.CONSUME(ArrowMultiple) },
      { ALT: () => this.CONSUME(ArrowSimple) }
    ]);
  });

  /**
   * Node block rule (indented content)
   */
  public nodeBlock = this.RULE('nodeBlock', () => {
    this.CONSUME(Newline);
    this.MANY(() => {
      this.CONSUME(Indent);
      this.OR([
        { ALT: () => this.SUBRULE(this.property) },
        { ALT: () => this.SUBRULE(this.node) },
        { ALT: () => this.SUBRULE(this.comment) }
      ]);
    });
  });

  /**
   * Property rule (key: value)
   */
  public property = this.RULE('property', () => {
    this.CONSUME(Identifier, { LABEL: 'key' });
    this.CONSUME(Colon);
    this.SUBRULE(this.value);
    this.OPTION(() => this.CONSUME(Newline));
  });

  /**
   * Value rule (all value types)
   */
  public value = this.RULE('value', () => {
    this.OR([
      { ALT: () => this.CONSUME(StringLiteral) },
      { ALT: () => this.CONSUME(NumberLiteral) },
      { ALT: () => this.CONSUME(BooleanTrue) },
      { ALT: () => this.CONSUME(BooleanFalse) },
      { ALT: () => this.CONSUME(Identifier) },
      { ALT: () => this.SUBRULE(this.arrayLiteral) }
    ]);
  });

  /**
   * Array literal rule [value1, value2]
   */
  public arrayLiteral = this.RULE('arrayLiteral', () => {
    this.CONSUME(BracketOpen);
    this.MANY_SEP({
      SEP: Comma,
      DEF: () => this.SUBRULE(this.value)
    });
    this.CONSUME(BracketClose);
  });

  /**
   * Comment rule
   */
  public comment = this.RULE('comment', () => {
    this.CONSUME(Comment);
    this.OPTION(() => this.CONSUME(Newline));
  });

  // ============================================================================
  // Constructor and Initialization
  // ============================================================================

  constructor(options: {
    enableCaching?: boolean;
    cacheSize?: number;
    cacheMaxAge?: number;
  } = {}) {
    super(coreTokens, {
      recoveryEnabled: true,
      nodeLocationTracking: 'full',
      maxLookahead: 3
    });

    this.diagnostics = new DiagnosticsService();
    this.enableCaching = options.enableCaching ?? true;
    this.cache = new ParseCache(options.cacheSize, options.cacheMaxAge);

    this.performSelfAnalysis();
  }

  // ============================================================================
  // Plugin System
  // ============================================================================

  /**
   * Register grammar extension
   * 
   * @param extension - Grammar extension to register
   * @throws Error if extension conflicts with existing rules
   * 
   * @example
   * ```typescript
   * parser.registerGrammarExtension({
   *   id: 'c4-architecture',
   *   name: 'C4 Architecture Extension',
   *   rules: [{
   *     name: 'c4Container',
   *     implementation: () => {
   *       // Custom grammar rule implementation
   *     }
   *   }]
   * });
   * ```
   */
  registerGrammarExtension(extension: GrammarExtension): void {
    if (this.extensions.has(extension.id)) {
      throw new Error(`Grammar extension '${extension.id}' is already registered`);
    }

    // Validate extension rules
    for (const rule of extension.rules) {
      if (typeof this[rule.name as keyof this] !== 'undefined') {
        throw new Error(`Rule '${rule.name}' conflicts with existing grammar`);
      }
    }

    // Register extension
    this.extensions.set(extension.id, extension);

    // Add rules to parser (would require dynamic rule registration)
    // This is a simplified version - full implementation would need
    // to rebuild the parser with new rules
    if (extension.id) {
      console.warn(`Grammar extension '${extension.id}' registered but dynamic rule addition not fully implemented`);
    }
  }

  /**
   * Unregister grammar extension
   */
  unregisterGrammarExtension(extensionId: string): boolean {
    return this.extensions.delete(extensionId);
  }

  /**
   * Get registered extensions
   */
  getRegisteredExtensions(): GrammarExtension[] {
    return Array.from(this.extensions.values());
  }

  // ============================================================================
  // Lexer Integration
  // ============================================================================

  /**
   * Set lexer instance for parsing
   * 
   * @param lexer - LFFLexer instance
   */
  setLexer(lexer: LFFLexer): void {
    this.lexer = lexer;
  }

  // ============================================================================
  // Main Parsing Interface
  // ============================================================================

  /**
   * Parse LFF content to CST with comprehensive diagnostics
   * 
   * This method focuses solely on CST generation and does not perform
   * AST conversion. Use separate AST conversion modules for that purpose.
   * 
   * @param content - LFF source text
   * @param options - Parse options
   * @returns Enhanced parse result with diagnostics and metrics
   * 
   * @example
   * ```typescript
   * const parser = new LFFParser();
   * parser.setLexer(new LFFLexer());
   * 
   * const result = parser.parseToCST(`
   *   @title: My Architecture
   *   Frontend [web] -> Backend [api]
   * `);
   * 
   * if (result.success) {
   *   console.log('CST generated successfully');
   *   console.log('Parse time:', result.metrics.parseTime, 'ms');
   * } else {
   *   result.diagnostics.forEach(diag => {
   *     console.error(`${diag.severity}: ${diag.message}`);
   *   });
   * }
   * ```
   */
  parseToCST(
    content: string, 
    options: {
      filePath?: string;
      enableSourceInfo?: boolean;
      bypassCache?: boolean;
    } = {}
  ): EnhancedParseResult {
    const startTime = performance.now();
    
    // Clear previous diagnostics
    this.diagnostics.clear();

    // Check cache first
    if (this.enableCaching && !options.bypassCache) {
      const cached = this.cache.get(content);
      if (cached) {
        const result: EnhancedParseResult = {
          success: !this.diagnostics.hasErrors(),
          cst: cached.cst,
          diagnostics: cached.diagnostics,
          metrics: {
            lexTime: 0,
            parseTime: cached.parseTime,
            totalTime: performance.now() - startTime,
            fromCache: true,
            tokenCount: 0
          }
        };
        
        if (options.enableSourceInfo) {
          result.sourceInfo = {
            content,
            lines: content.split('\n'),
            ...(options.filePath && { filePath: options.filePath })
          };
        }
        
        return result;
      }
    }

    // Validate lexer
    if (!this.lexer) {
      this.diagnostics.addError(
        'Lexer not initialized. Call setLexer() first.',
        { startLine: 0, endLine: 0, startColumn: 0, endColumn: 0 },
        'LEXER_NOT_INITIALIZED'
      );
      
      return this.createFailureResult(content, startTime, options);
    }

    // Phase 1: Lexical analysis
    const lexStart = performance.now();
    const lexResult = this.lexer.tokenize(content);
    const lexTime = performance.now() - lexStart;

    // Convert lexer errors to diagnostics
    lexResult.errors.forEach(error => {
      this.diagnostics.addError(
        error.message || 'Lexical error',
        {
          startLine: error.line || 0,
          endLine: error.line || 0,
          startColumn: error.column || 0,
          endColumn: (error.column || 0) + (error.length || 1)
        },
        'LEXICAL_ERROR'
      );
    });

    if (lexResult.errors.length > 0) {
      return this.createFailureResult(content, startTime, options, lexTime);
    }

    // Phase 2: Syntactic analysis
    const parseStart = performance.now();
    this.input = lexResult.tokens;
    
    let cst: CstNode | null = null;
    try {
      cst = this.document();
    } catch (error) {
      this.diagnostics.addError(
        `Parse error: ${error instanceof Error ? error.message : String(error)}`,
        { startLine: 0, endLine: 0, startColumn: 0, endColumn: 0 },
        'PARSE_ERROR'
      );
    }
    
    const parseTime = performance.now() - parseStart;

    // Convert parser errors to diagnostics
    this.errors.forEach(error => {
      const token = error.token;
      this.diagnostics.addError(
        error.message,
        {
          startLine: token.startLine || 0,
          endLine: token.endLine || token.startLine || 0,
          startColumn: token.startColumn || 0,
          endColumn: token.endColumn || token.startColumn || 0
        },
        'SYNTAX_ERROR'
      );
    });

    const totalTime = performance.now() - startTime;
    const success = !this.diagnostics.hasErrors() && cst !== null;

    // Cache successful results
    if (success && this.enableCaching && cst) {
      this.cache.set(content, cst, this.diagnostics.getDiagnostics(), parseTime);
    }

    const result: EnhancedParseResult = {
      success,
      cst,
      diagnostics: this.diagnostics.getDiagnostics(),
      metrics: {
        lexTime,
        parseTime,
        totalTime,
        fromCache: false,
        tokenCount: lexResult.tokens.length
      }
    };
    
    if (options.enableSourceInfo) {
      result.sourceInfo = {
        content,
        lines: content.split('\n'),
        ...(options.filePath && { filePath: options.filePath })
      };
    }
    
    return result;
  }

  /**
   * Create failure result
   */
  private createFailureResult(
    content: string, 
    startTime: number, 
    options: { filePath?: string; enableSourceInfo?: boolean },
    lexTime: number = 0
  ): EnhancedParseResult {
    const result: EnhancedParseResult = {
      success: false,
      cst: null,
      diagnostics: this.diagnostics.getDiagnostics(),
      metrics: {
        lexTime,
        parseTime: 0,
        totalTime: performance.now() - startTime,
        fromCache: false,
        tokenCount: 0
      }
    };
    
    if (options.enableSourceInfo) {
      result.sourceInfo = {
        content,
        lines: content.split('\n'),
        ...(options.filePath && { filePath: options.filePath })
      };
    }
    
    return result;
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Get CST node children safely
   * 
   * @param cst - CST node
   * @param childName - Child name
   * @returns Child nodes array
   */
  static getChildren(cst: CstNode, childName: string): CstNode[] {
    return (cst.children?.[childName] as CstNode[]) || [];
  }

  /**
   * Get first child safely
   * 
   * @param cst - CST node
   * @param childName - Child name
   * @returns First child or undefined
   */
  static getFirstChild(cst: CstNode, childName: string): CstNode | undefined {
    const children = this.getChildren(cst, childName);
    return children.length > 0 ? children[0] : undefined;
  }

  /**
   * Extract token value safely
   * 
   * @param token - Token
   * @returns Token value or empty string
   */
  static getTokenValue(token: IToken): string {
    return token?.image || '';
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; maxSize: number; hitRate?: number } {
    return this.cache.getStats();
  }

  /**
   * Clear parse cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get current diagnostics
   */
  getDiagnostics(): ParseDiagnostic[] {
    return this.diagnostics.getDiagnostics();
  }
} 