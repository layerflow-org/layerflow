/**
 * Type Registry and Directive Registry for LayerFlow Core
 * @fileoverview Extensible type system for domain-specific plugins
 * @public
 */

import { GraphNode, Edge, GraphAST, ValidationError } from './types';

/**
 * Property schema for IDE autocompletion and validation
 * @public
 */
export interface PropertySchema {
  /** Property name */
  name: string;
  /** Property type (string, number, boolean, array, object) */
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  /** Human-readable description */
  description?: string;
  /** Whether the property is required */
  required?: boolean;
  /** Default value for the property */
  defaultValue?: any;
  /** Allowed values for enum-like properties */
  allowedValues?: any[];
}

/**
 * Node type definition for domain-specific validation and tooling
 * @public
 */
export interface NodeTypeDefinition {
  /** Type name (e.g., 'person', 'system', 'deployment') */
  name: string;
  /** Domain this type belongs to (e.g., 'c4', 'k8s', 'bpmn') */
  domain: string;
  /** Human-readable description */
  description?: string;
  /** Icon identifier for UI rendering */
  icon?: string;
  /** Visual category for grouping */
  category?: string;
  /** Custom validation function */
  validation?: (node: GraphNode) => ValidationError[];
  /** Property schemas for IDE autocompletion */
  autoComplete?: PropertySchema[];
  /** Default metadata applied when creating nodes of this type */
  defaultMetadata?: Record<string, any>;
  /** Visual styling defaults */
  defaultStyle?: Record<string, any>;
}

/**
 * Edge type definition for connection semantics
 * @public
 */
export interface EdgeTypeDefinition {
  /** Type name (e.g., 'http', 'database', 'async') */
  name: string;
  /** Domain this edge type belongs to */
  domain: string;
  /** Human-readable description */
  description?: string;
  /** Custom validation function */
  validation?: (edge: Edge, sourceNode?: GraphNode, targetNode?: GraphNode) => ValidationError[];
  /** Property schemas for IDE autocompletion */
  autoComplete?: PropertySchema[];
  /** Default metadata for edges of this type */
  defaultMetadata?: Record<string, any>;
  /** Default visual styling */
  defaultStyle?: Record<string, any>;
}

/**
 * Directive parser function type
 * @public
 */
export type DirectiveParser = (content: string, context?: any) => any;

/**
 * Directive validator function type
 * @public
 */
export type DirectiveValidator = (directive: any, graph: GraphAST) => ValidationError[];

/**
 * AST transformer function type
 * @public
 */
export type ASTTransformer = (directive: any, graph: GraphAST) => GraphAST;

/**
 * Directive definition for domain-specific syntax extensions
 * @public
 */
export interface DirectiveDefinition {
  /** Directive name (e.g., 'context', 'aggregate', 'deployment') */
  name: string;
  /** Domain this directive belongs to */
  domain: string;
  /** Human-readable description */
  description?: string;
  /** Parser function for directive syntax */
  parser: DirectiveParser;
  /** Optional semantic validator */
  validator?: DirectiveValidator;
  /** Optional AST transformer */
  transformer?: ASTTransformer;
  /** Property schemas for directive parameters */
  autoComplete?: PropertySchema[];
}

/**
 * Registry for managing node and edge types
 * @public
 */
export class TypeRegistry {
  private nodeTypes = new Map<string, NodeTypeDefinition>();
  private edgeTypes = new Map<string, EdgeTypeDefinition>();
  private domainTypes = new Map<string, Set<string>>();

  /**
   * Registers a new node type
   * @param definition - Node type definition
   * @throws {Error} If type name conflicts with existing registration
   */
  registerNodeType(definition: NodeTypeDefinition): void {
    const key = `${definition.domain}:${definition.name}`;
    
    if (this.nodeTypes.has(key)) {
      throw new Error(`Node type "${key}" is already registered`);
    }

    this.nodeTypes.set(key, definition);
    
    // Track types by domain
    if (!this.domainTypes.has(definition.domain)) {
      this.domainTypes.set(definition.domain, new Set());
    }
    this.domainTypes.get(definition.domain)!.add(definition.name);
  }

  /**
   * Registers a new edge type
   * @param definition - Edge type definition
   * @throws {Error} If type name conflicts with existing registration
   */
  registerEdgeType(definition: EdgeTypeDefinition): void {
    const key = `${definition.domain}:${definition.name}`;
    
    if (this.edgeTypes.has(key)) {
      throw new Error(`Edge type "${key}" is already registered`);
    }

    this.edgeTypes.set(key, definition);
  }

  /**
   * Gets a node type definition
   * @param name - Type name or domain:name
   * @param domain - Domain name (optional if name includes domain)
   * @returns Node type definition or undefined
   */
  getNodeType(name: string, domain?: string): NodeTypeDefinition | undefined {
    const key = domain ? `${domain}:${name}` : name;
    return this.nodeTypes.get(key) || this.nodeTypes.get(name);
  }

  /**
   * Gets an edge type definition
   * @param name - Type name or domain:name  
   * @param domain - Domain name (optional if name includes domain)
   * @returns Edge type definition or undefined
   */
  getEdgeType(name: string, domain?: string): EdgeTypeDefinition | undefined {
    const key = domain ? `${domain}:${name}` : name;
    return this.edgeTypes.get(key) || this.edgeTypes.get(name);
  }

  /**
   * Gets all node types for a specific domain
   * @param domain - Domain name
   * @returns Array of node type definitions
   */
  getNodeTypesByDomain(domain: string): NodeTypeDefinition[] {
    return Array.from(this.nodeTypes.values()).filter(type => type.domain === domain);
  }

  /**
   * Gets all edge types for a specific domain
   * @param domain - Domain name
   * @returns Array of edge type definitions
   */
  getEdgeTypesByDomain(domain: string): EdgeTypeDefinition[] {
    return Array.from(this.edgeTypes.values()).filter(type => type.domain === domain);
  }

  /**
   * Gets all registered domains
   * @returns Array of domain names
   */
  getAllDomains(): string[] {
    return Array.from(this.domainTypes.keys());
  }

  /**
   * Checks if a domain is registered
   * @param domain - Domain name to check
   * @returns True if domain has registered types
   */
  hasDomain(domain: string): boolean {
    return this.domainTypes.has(domain);
  }

  /**
   * Unregisters all types for a domain (used when uninstalling plugins)
   * @param domain - Domain name to unregister
   */
  unregisterDomain(domain: string): void {
    // Remove node types
    for (const [key, definition] of this.nodeTypes.entries()) {
      if (definition.domain === domain) {
        this.nodeTypes.delete(key);
      }
    }

    // Remove edge types
    for (const [key, definition] of this.edgeTypes.entries()) {
      if (definition.domain === domain) {
        this.edgeTypes.delete(key);
      }
    }

    // Remove domain tracking
    this.domainTypes.delete(domain);
  }

  /**
   * Gets all registered node types
   * @returns Array of all node type definitions
   */
  getAllNodeTypes(): NodeTypeDefinition[] {
    return Array.from(this.nodeTypes.values());
  }

  /**
   * Gets all registered edge types
   * @returns Array of all edge type definitions
   */
  getAllEdgeTypes(): EdgeTypeDefinition[] {
    return Array.from(this.edgeTypes.values());
  }
}

/**
 * Registry for managing directive definitions
 * @public
 */
export class DirectiveRegistry {
  private directives = new Map<string, DirectiveDefinition>();
  private domainDirectives = new Map<string, Set<string>>();

  /**
   * Registers a new directive
   * @param definition - Directive definition
   * @throws {Error} If directive name conflicts with existing registration
   */
  registerDirective(definition: DirectiveDefinition): void {
    const key = `${definition.domain}:${definition.name}`;
    
    if (this.directives.has(key)) {
      throw new Error(`Directive "${key}" is already registered`);
    }

    this.directives.set(key, definition);
    
    // Track directives by domain
    if (!this.domainDirectives.has(definition.domain)) {
      this.domainDirectives.set(definition.domain, new Set());
    }
    this.domainDirectives.get(definition.domain)!.add(definition.name);
  }

  /**
   * Gets a directive definition
   * @param name - Directive name or domain:name
   * @param domain - Domain name (optional if name includes domain)
   * @returns Directive definition or undefined
   */
  getDirective(name: string, domain?: string): DirectiveDefinition | undefined {
    const key = domain ? `${domain}:${name}` : name;
    return this.directives.get(key) || this.directives.get(name);
  }

  /**
   * Gets all directives for a specific domain
   * @param domain - Domain name
   * @returns Array of directive definitions
   */
  getDirectivesByDomain(domain: string): DirectiveDefinition[] {
    return Array.from(this.directives.values()).filter(directive => directive.domain === domain);
  }

  /**
   * Gets all registered domains
   * @returns Array of domain names
   */
  getAllDomains(): string[] {
    return Array.from(this.domainDirectives.keys());
  }

  /**
   * Unregisters all directives for a domain
   * @param domain - Domain name to unregister
   */
  unregisterDomain(domain: string): void {
    for (const [key, definition] of this.directives.entries()) {
      if (definition.domain === domain) {
        this.directives.delete(key);
      }
    }
    this.domainDirectives.delete(domain);
  }

  /**
   * Gets all registered directives
   * @returns Array of all directive definitions
   */
  getAllDirectives(): DirectiveDefinition[] {
    return Array.from(this.directives.values());
  }
} 
