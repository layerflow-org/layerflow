/**
 * LFF Serializer - Enterprise-grade bidirectional converter with configurable formatting
 * @fileoverview Converts GraphAST back to LFF format with idiomatic generation and customizable output
 * @public
 */

import type { GraphAST, GraphNode, Edge } from '@layerflow/core';

// ============================================================================
// Configuration and Types
// ============================================================================

/**
 * Comprehensive serialization options
 * @public
 */
export interface LFFSerializerOptions {
  /** Indentation configuration */
  indentation?: {
    /** Indentation type: 'spaces' | 'tabs' */
    type?: 'spaces' | 'tabs';
    /** Size for spaces (default: 2) */
    size?: number;
  };
  
  /** Line ending style */
  lineEndings?: 'lf' | 'crlf' | 'cr';
  
  /** Quote style configuration */
  quotes?: {
    /** Quote style: 'single' | 'double' | 'smart' */
    style?: 'single' | 'double' | 'smart';
    /** Force quotes even when not needed */
    forceQuotes?: boolean;
  };
  
  /** Spacing configuration */
  spacing?: {
    /** Space around colons in key-value pairs */
    aroundColons?: boolean;
    /** Space around arrows in edges */
    aroundArrows?: boolean;
    /** Empty lines between sections */
    betweenSections?: number;
  };
  
  /** Sorting options */
  sorting?: {
    /** Sort nodes alphabetically */
    nodes?: boolean;
    /** Sort edges alphabetically */
    edges?: boolean;
    /** Sort directives alphabetically */
    directives?: boolean;
    /** Sort node properties */
    properties?: boolean;
  };
  
  /** Output formatting */
  formatting?: {
    /** Maximum line length before wrapping */
    maxLineLength?: number;
    /** Wrap long arrays */
    wrapArrays?: boolean;
    /** Align property values */
    alignValues?: boolean;
  };
  
  /** Content filtering */
  include?: {
    /** Include comments from metadata */
    comments?: boolean;
    /** Include LFF-specific metadata */
    lffMetadata?: boolean;
    /** Include parser metadata */
    parserMetadata?: boolean;
  };
}

/**
 * Internal structure representation before formatting
 * @private
 */
interface LFFStructure {
  directives: LFFDirectiveStructure[];
  nodes: LFFNodeStructure[];
  edges: LFFEdgeStructure[];
}

interface LFFDirectiveStructure {
  name: string;
  value: any;
  comment?: string;
}

interface LFFNodeStructure {
  name: string;
  types?: string[];
  levelSpec?: string;
  anchor?: string;
  properties?: Record<string, any>;
  children?: LFFNodeStructure[];
  comment?: string;
}

interface LFFEdgeStructure {
  from: string;
  to: string;
  arrow: string;
  label?: string;
  properties?: Record<string, any>;
  comment?: string;
}

// ============================================================================
// Formatting Engine
// ============================================================================

/**
 * Configurable formatter for LFF output
 * @private
 */
class LFFFormatter {
  private options: Required<LFFSerializerOptions>;
  
  constructor(options: LFFSerializerOptions = {}) {
    this.options = this.normalizeOptions(options);
  }
  
  /**
   * Normalize and set defaults for options
   */
  private normalizeOptions(options: LFFSerializerOptions): Required<LFFSerializerOptions> {
    return {
      indentation: {
        type: options.indentation?.type || 'spaces',
        size: options.indentation?.size || 2
      },
      lineEndings: options.lineEndings || 'lf',
      quotes: {
        style: options.quotes?.style || 'smart',
        forceQuotes: options.quotes?.forceQuotes || false
      },
      spacing: {
        aroundColons: options.spacing?.aroundColons ?? true,
        aroundArrows: options.spacing?.aroundArrows ?? true,
        betweenSections: options.spacing?.betweenSections ?? 1
      },
      sorting: {
        nodes: options.sorting?.nodes || false,
        edges: options.sorting?.edges || false,
        directives: options.sorting?.directives || false,
        properties: options.sorting?.properties || false
      },
      formatting: {
        maxLineLength: options.formatting?.maxLineLength || 120,
        wrapArrays: options.formatting?.wrapArrays || true,
        alignValues: options.formatting?.alignValues || false
      },
      include: {
        comments: options.include?.comments || false,
        lffMetadata: options.include?.lffMetadata || true,
        parserMetadata: options.include?.parserMetadata || false
      }
    };
  }
  
  /**
   * Format complete LFF structure
   */
  formatStructure(structure: LFFStructure): string {
    const sections: string[] = [];
    
    // Format directives
    if (structure.directives.length > 0) {
      const directiveLines = this.formatDirectives(structure.directives);
      sections.push(directiveLines);
    }
    
    // Format nodes
    if (structure.nodes.length > 0) {
      const nodeLines = this.formatNodes(structure.nodes);
      sections.push(nodeLines);
    }
    
    // Format edges
    if (structure.edges.length > 0) {
      const edgeLines = this.formatEdges(structure.edges);
      sections.push(edgeLines);
    }
    
    // Join sections with configured spacing
    const sectionSeparator = this.getLineEnding().repeat((this.options.spacing?.betweenSections ?? 1) + 1);
    return sections.join(sectionSeparator).trim();
  }
  
  /**
   * Format directives section
   */
  private formatDirectives(directives: LFFDirectiveStructure[]): string {
    const sorted = this.options.sorting.directives 
      ? [...directives].sort((a, b) => a.name.localeCompare(b.name))
      : directives;
    
    return sorted.map(directive => this.formatDirective(directive)).join(this.getLineEnding());
  }
  
  /**
   * Format single directive
   */
  private formatDirective(directive: LFFDirectiveStructure): string {
    const colon = this.options.spacing.aroundColons ? ': ' : ':';
    const value = this.formatValue(directive.value);
    let line = `@${directive.name}${colon}${value}`;
    
    if (directive.comment && this.options.include.comments) {
      line += ` # ${directive.comment}`;
    }
    
    return line;
  }
  
  /**
   * Format nodes section
   */
  private formatNodes(nodes: LFFNodeStructure[], level = 0): string {
    const sorted = this.options.sorting.nodes 
      ? [...nodes].sort((a, b) => a.name.localeCompare(b.name))
      : nodes;
    
    return sorted.map(node => this.formatNode(node, level)).join(this.getLineEnding());
  }
  
  /**
   * Format single node
   */
  private formatNode(node: LFFNodeStructure, level = 0): string {
    const lines: string[] = [];
    const indent = this.getIndent(level);
    
    // Build main node line
    let nodeLine = indent + this.formatNodeName(node.name);
    
    // Add anchor
    if (node.anchor) {
      nodeLine += ` &${node.anchor}`;
    }
    
    // Add types
    if (node.types && node.types.length > 0) {
      const typeList = node.types.join(', ');
      nodeLine += ` [${typeList}]`;
    }
    
    // Add level specification
    if (node.levelSpec) {
      nodeLine += ` ${node.levelSpec}`;
    }
    
    // Check if node has content
    const hasProperties = node.properties && Object.keys(node.properties).length > 0;
    const hasChildren = node.children && node.children.length > 0;
    
    if (hasProperties || hasChildren) {
      nodeLine += ':';
      lines.push(nodeLine);
      
      // Add properties
      if (hasProperties && node.properties) {
        lines.push(...this.formatNodeProperties(node.properties, level + 1));
      }
      
      // Add children
      if (hasChildren && node.children) {
        lines.push(this.formatNodes(node.children, level + 1));
      }
    } else {
      lines.push(nodeLine);
    }
    
    // Add comment
    if (node.comment && this.options.include.comments) {
      lines[lines.length - 1] += ` # ${node.comment}`;
    }
    
    return lines.join(this.getLineEnding());
  }
  
  /**
   * Format node properties
   */
  private formatNodeProperties(properties: Record<string, any>, level: number): string[] {
    const entries = Object.entries(properties);
    const sorted = this.options.sorting.properties 
      ? entries.sort(([a], [b]) => a.localeCompare(b))
      : entries;
    
    const lines = sorted.map(([key, value]) => {
      const indent = this.getIndent(level);
      const colon = this.options.spacing.aroundColons ? ': ' : ':';
      return `${indent}${key}${colon}${this.formatValue(value)}`;
    });
    
    // Align values if requested
    if (this.options.formatting.alignValues && lines.length > 1) {
      return this.alignPropertyValues(lines);
    }
    
    return lines;
  }
  
  /**
   * Format edges section
   */
  private formatEdges(edges: LFFEdgeStructure[]): string {
    const sorted = this.options.sorting.edges 
      ? [...edges].sort((a, b) => `${a.from}-${a.to}`.localeCompare(`${b.from}-${b.to}`))
      : edges;
    
    return sorted.map(edge => this.formatEdge(edge)).join(this.getLineEnding());
  }
  
  /**
   * Format single edge
   */
  private formatEdge(edge: LFFEdgeStructure): string {
    const fromName = this.formatNodeName(edge.from);
    const toName = this.formatNodeName(edge.to);
    const arrow = this.options.spacing.aroundArrows 
      ? ` ${edge.arrow} ` 
      : edge.arrow;
    
    let line = `${fromName}${arrow}${toName}`;
    
    if (edge.label) {
      const colon = this.options.spacing.aroundColons ? ': ' : ':';
      line += `${colon}${this.formatValue(edge.label)}`;
    }
    
    if (edge.comment && this.options.include.comments) {
      line += ` # ${edge.comment}`;
    }
    
    return line;
  }
  
  /**
   * Format any value with proper quoting and escaping
   */
  private formatValue(value: any): string {
    if (value === null || value === undefined) {
      return 'null';
    }
    
    if (typeof value === 'string') {
      return this.formatString(value);
    }
    
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    
    if (Array.isArray(value)) {
      return this.formatArray(value);
    }
    
    if (typeof value === 'object') {
      return this.formatString(JSON.stringify(value));
    }
    
    return String(value);
  }
  
  /**
   * Format string with appropriate quoting
   */
  private formatString(str: string): string {
    const needsQuotes = this.options.quotes.forceQuotes || 
      str.includes(' ') || 
      str.includes(':') || 
      str.includes('[') || 
      str.includes(']') ||
      str.includes('#') ||
      str.includes('@') ||
      str.includes('&') ||
      str.includes('*') ||
      str.trim() !== str;
    
    if (!needsQuotes) {
      return str;
    }
    
    const quote = this.getQuoteChar(str);
    const escaped = str.replace(new RegExp(quote, 'g'), `\\${quote}`);
    return `${quote}${escaped}${quote}`;
  }
  
  /**
   * Format array with optional wrapping
   */
  private formatArray(arr: any[]): string {
    const items = arr.map(item => this.formatValue(item));
    const inline = `[${items.join(', ')}]`;
    
    if (!this.options.formatting?.wrapArrays || 
        inline.length <= (this.options.formatting?.maxLineLength ?? 80)) {
      return inline;
    }
    
    // Multi-line array format
    const indentStr = this.getIndent(1);
    const itemLines = items.map(item => `${indentStr}${item}`);
    return `[\n${itemLines.join(',\n')}\n]`;
  }
  
  /**
   * Format node name with escaping if needed
   */
  private formatNodeName(name: string): string {
    return this.formatString(name);
  }
  
  /**
   * Get appropriate quote character
   */
  private getQuoteChar(str: string): string {
    switch (this.options.quotes.style) {
      case 'single':
        return "'";
      case 'double':
        return '"';
      case 'smart':
        // Use single quotes unless string contains single quotes
        return str.includes("'") && !str.includes('"') ? '"' : "'";
      default:
        return '"';
    }
  }
  
  /**
   * Get indentation string
   */
  private getIndent(level: number): string {
    const unit = this.options.indentation?.type === 'tabs' 
      ? '\t' 
      : ' '.repeat(this.options.indentation?.size ?? 2);
    return unit.repeat(level);
  }
  
  /**
   * Get line ending string
   */
  private getLineEnding(): string {
    switch (this.options.lineEndings) {
      case 'crlf': return '\r\n';
      case 'cr': return '\r';
      case 'lf':
      default: return '\n';
    }
  }
  
  /**
   * Align property values for better readability
   */
  private alignPropertyValues(lines: string[]): string[] {
    const colonPositions = lines.map(line => {
      const pos = line.indexOf(':');
      return pos >= 0 ? pos : 0;
    });
    const maxColonPos = Math.max(...colonPositions);
    
    return lines.map((line, index) => {
      const colonPos = colonPositions[index];
      if (colonPos === undefined || colonPos === 0) return line;
      const padding = ' '.repeat(maxColonPos - colonPos);
      return line.replace(':', padding + ':');
    });
  }
}

// ============================================================================
// Structure Builder
// ============================================================================

/**
 * Builds LFF structure from GraphAST
 * @private
 */
class LFFStructureBuilder {
  private options: Required<LFFSerializerOptions>;
  
  constructor(options: Required<LFFSerializerOptions>) {
    this.options = options;
  }
  
  /**
   * Build complete LFF structure from GraphAST
   */
  buildStructure(graph: GraphAST): LFFStructure {
    return {
      directives: this.buildDirectives(graph.metadata || {}),
      nodes: this.buildNodes(graph.nodes),
      edges: this.buildEdges(graph.edges)
    };
  }
  
  /**
   * Build directives from metadata
   */
  private buildDirectives(metadata: Record<string, any>): LFFDirectiveStructure[] {
    const directives: LFFDirectiveStructure[] = [];
    
    // Standard metadata fields
    const standardFields = ['title', 'description', 'version', 'author', 'domain', 'tags'];
    
    for (const field of standardFields) {
      if (metadata[field] !== undefined) {
        directives.push({
          name: field,
          value: metadata[field]
        });
      }
    }
    
    // Custom directives
    if (metadata.directives) {
      for (const [name, value] of Object.entries(metadata.directives)) {
        directives.push({ name, value });
      }
    }
    
    // Parser metadata (if included)
    if (this.options.include.parserMetadata && metadata.parser) {
      directives.push({
        name: 'parser',
        value: metadata.parser
      });
    }
    
    return directives;
  }
  
  /**
   * Build nodes structure with hierarchy
   */
  private buildNodes(nodes: GraphNode[]): LFFNodeStructure[] {
    const nodeMap = new Map<string, GraphNode>();
    const rootNodes: GraphNode[] = [];
    
    // Index nodes and find roots
    for (const node of nodes) {
      nodeMap.set(node.id, node);
      if (!node.parentId) {
        rootNodes.push(node);
      }
    }
    
    // Build hierarchical structure
    return rootNodes.map(node => this.buildNodeStructure(node, nodeMap));
  }
  
  /**
   * Build single node structure with children
   */
  private buildNodeStructure(node: GraphNode, nodeMap: Map<string, GraphNode>): LFFNodeStructure {
    const structure: LFFNodeStructure = {
      name: node.label
    };
    
    // Add type
    if (node.type) {
      structure.types = [node.type];
    }
    
    // Add level specification
    if (node.level !== undefined) {
      structure.levelSpec = `@${node.level}`;
    }
    
    // Extract LFF metadata
    if (node.metadata?.lff && this.options.include.lffMetadata) {
      if (node.metadata.lff.anchor) {
        structure.anchor = node.metadata.lff.anchor;
      }
      if (node.metadata.lff.additionalTypes && node.type) {
        structure.types = [node.type, ...node.metadata.lff.additionalTypes];
      }
      if (node.metadata.lff.levelSpec) {
        structure.levelSpec = node.metadata.lff.levelSpec;
      }
    }
    
    // Add properties (excluding LFF metadata)
    if (node.metadata) {
      const properties = { ...node.metadata };
      if (!this.options.include.lffMetadata) {
        delete properties.lff;
      }
      if (!this.options.include.parserMetadata) {
        delete properties.parser;
      }
      
      if (Object.keys(properties).length > 0) {
        structure.properties = properties;
      }
    }
    
    // Add children
    const children = Array.from(nodeMap.values()).filter(n => n.parentId === node.id);
    if (children.length > 0) {
      structure.children = children.map(child => this.buildNodeStructure(child, nodeMap));
    }
    
    return structure;
  }
  
  /**
   * Build edges structure
   */
  private buildEdges(edges: Edge[]): LFFEdgeStructure[] {
    return edges.map(edge => this.buildEdgeStructure(edge));
  }
  
  /**
   * Build single edge structure
   */
  private buildEdgeStructure(edge: Edge): LFFEdgeStructure {
    const structure: LFFEdgeStructure = {
      from: edge.from,
      to: edge.to,
      arrow: this.mapEdgeTypeToArrow(edge.type)
    };
    
    if (edge.label) {
      structure.label = edge.label;
    }
    
    // Add properties (excluding LFF metadata)
    if (edge.metadata) {
      const properties = { ...edge.metadata };
      if (!this.options.include.lffMetadata) {
        delete properties.lff;
      }
      
      if (Object.keys(properties).length > 0) {
        structure.properties = properties;
      }
    }
    
    return structure;
  }
  
  /**
   * Map Core edge type to LFF arrow
   */
  private mapEdgeTypeToArrow(type?: string): string {
    switch (type) {
      case 'dataflow': return '=>';
      case 'bidirectional': return '<->';
      case 'dependency': return '-->';
      case 'connection':
      default: return '->';
    }
  }
}

// ============================================================================
// Main Serializer Class
// ============================================================================

/**
 * Enhanced LFF Serializer with configurable formatting
 * @public
 */
export class EnhancedLFFSerializer {
  private formatter: LFFFormatter;
  private structureBuilder: LFFStructureBuilder;
  
  constructor(private options: LFFSerializerOptions = {}) {
    this.formatter = new LFFFormatter(options);
    this.structureBuilder = new LFFStructureBuilder(this.formatter['options']);
  }
  
  /**
   * Serialize GraphAST to LFF format
   * @param graph - GraphAST from core
   * @param overrideOptions - Options to override for this serialization
   * @returns LFF formatted string
   */
  serialize(graph: GraphAST, overrideOptions?: Partial<LFFSerializerOptions>): string {
    // Create temporary serializer if options are overridden
    if (overrideOptions) {
      const mergedOptions = { ...this.options, ...overrideOptions };
      const tempSerializer = new EnhancedLFFSerializer(mergedOptions);
      return tempSerializer.serialize(graph);
    }
    
    // Build structure
    const structure = this.structureBuilder.buildStructure(graph);
    
    // Format structure
    return this.formatter.formatStructure(structure);
  }
  
  /**
   * Update serializer options
   */
  updateOptions(options: Partial<LFFSerializerOptions>): void {
    this.options = { ...this.options, ...options };
    this.formatter = new LFFFormatter(this.options);
    this.structureBuilder = new LFFStructureBuilder(this.formatter['options']);
  }
  
  /**
   * Get current options
   */
  getOptions(): LFFSerializerOptions {
    return { ...this.options };
  }
}

// ============================================================================
// Legacy Compatibility
// ============================================================================

/**
 * Legacy LFF Serializer for backward compatibility
 * @deprecated Use EnhancedLFFSerializer for better features
 * @public
 */
export class LFFSerializer extends EnhancedLFFSerializer {
  constructor() {
    super({
      indentation: { type: 'spaces', size: 2 },
      quotes: { style: 'double' },
      spacing: { aroundColons: true, aroundArrows: true, betweenSections: 1 }
    });
  }
}

// ============================================================================
// Preset Configurations
// ============================================================================

/**
 * Predefined formatting presets
 * @public
 */
export const LFFFormattingPresets = {
  /**
   * Compact formatting for minimal file size
   */
  compact: {
    indentation: { type: 'spaces' as const, size: 1 },
    spacing: { aroundColons: false, aroundArrows: false, betweenSections: 0 },
    quotes: { style: 'smart' as const },
    formatting: { wrapArrays: false }
  } satisfies LFFSerializerOptions,
  
  /**
   * Pretty formatting for human readability
   */
  pretty: {
    indentation: { type: 'spaces' as const, size: 2 },
    spacing: { aroundColons: true, aroundArrows: true, betweenSections: 1 },
    quotes: { style: 'smart' as const },
    formatting: { wrapArrays: true, alignValues: true },
    sorting: { nodes: true, edges: true, directives: true, properties: true }
  } satisfies LFFSerializerOptions,
  
  /**
   * Strict formatting for consistent style
   */
  strict: {
    indentation: { type: 'spaces' as const, size: 2 },
    spacing: { aroundColons: true, aroundArrows: true, betweenSections: 1 },
    quotes: { style: 'double' as const, forceQuotes: true },
    formatting: { maxLineLength: 80, wrapArrays: true },
    sorting: { nodes: true, edges: true, directives: true, properties: true }
  } satisfies LFFSerializerOptions,
  
  /**
   * Minimal formatting for version control
   */
  minimal: {
    indentation: { type: 'spaces' as const, size: 2 },
    spacing: { aroundColons: false, aroundArrows: false, betweenSections: 0 },
    quotes: { style: 'smart' as const },
    formatting: { wrapArrays: false },
    sorting: { nodes: true, edges: true, directives: true }
  } satisfies LFFSerializerOptions
};

// ============================================================================
// Public API
// ============================================================================

/**
 * Global enhanced serializer instance
 * @public
 */
export const globalLFFSerializer = new EnhancedLFFSerializer();

/**
 * Convenience function to serialize GraphAST to LFF
 * @param graph - GraphAST to serialize
 * @param options - Serialization options or preset name
 * @returns LFF formatted string
 * @public
 */
export function serializeToLFF(
  graph: GraphAST, 
  options?: LFFSerializerOptions | keyof typeof LFFFormattingPresets
): string {
  if (typeof options === 'string') {
    const preset = LFFFormattingPresets[options];
    if (!preset) {
      throw new Error(`Unknown formatting preset: ${options}`);
    }
    return globalLFFSerializer.serialize(graph, preset);
  }
  
  return globalLFFSerializer.serialize(graph, options);
}

/**
 * Create serializer with specific preset
 * @param preset - Preset name
 * @returns Configured serializer instance
 * @public
 */
export function createLFFSerializer(preset: keyof typeof LFFFormattingPresets): EnhancedLFFSerializer {
  const presetOptions = LFFFormattingPresets[preset];
  return new EnhancedLFFSerializer(presetOptions);
}

/**
 * Validate serialization round-trip
 * @param graph - Original GraphAST
 * @param serialized - Serialized LFF string
 * @returns Validation result
 * @public
 */
export function validateRoundTrip(_graph: GraphAST, _serialized: string): {
  valid: boolean;
  errors: string[];
} {
  // TODO: Implement round-trip validation
  // This would parse the serialized LFF back to GraphAST and compare
  return {
    valid: true,
    errors: []
  };
} 