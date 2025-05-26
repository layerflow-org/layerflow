/**
 * Enhanced Plugin Manager with Type Registry and Domain Support
 * @fileoverview Extended plugin system with domain-aware capabilities
 * @public
 */

import { PluginManager, Plugin, PluginInfo } from './plugins';
import { 
  TypeRegistry, 
  DirectiveRegistry, 
  NodeTypeDefinition, 
  EdgeTypeDefinition, 
  DirectiveDefinition 
} from './registry';
import { GraphAST, ValidationError } from './types';

/**
 * Enhanced plugin interface with domain registration capabilities
 * @public
 */
export interface EnhancedPlugin extends Plugin {
  /** Domains this plugin supports */
  domains?: string[];
  /** Plugin dependencies */
  dependencies?: string[];
  /** Extended installation function with enhanced manager */
  installEnhanced?: (manager: EnhancedPluginManager) => void | Promise<void>;
}

/**
 * Domain activation result
 * @public
 */
export interface DomainActivationResult {
  /** Domain name that was activated */
  domain: string;
  /** Plugins that were loaded for this domain */
  plugins: string[];
  /** Types that were registered */
  types: string[];
  /** Directives that were registered */
  directives: string[];
  /** Any errors during activation */
  errors: string[];
}

/**
 * Enhanced Plugin Manager with type registry and domain support
 * Extends the base PluginManager with domain-aware capabilities
 * @public
 */
export class EnhancedPluginManager extends PluginManager {
  private typeRegistry = new TypeRegistry();
  private directiveRegistry = new DirectiveRegistry();
  private activeDomains = new Set<string>();
  private domainPlugins = new Map<string, Set<string>>();
  private pluginDomains = new Map<string, Set<string>>();

  /**
   * Registers a node type definition
   * @param definition - Node type definition to register
   * @throws {Error} If type registration fails
   * @example
   * ```typescript
   * manager.registerNodeType({
   *   name: 'person',
   *   domain: 'c4',
   *   validation: (node) => validateC4Person(node),
   *   autoComplete: [{ name: 'role', type: 'string', required: true }]
   * });
   * ```
   */
  registerNodeType(definition: NodeTypeDefinition): void {
    try {
      this.typeRegistry.registerNodeType(definition);
      this.trackDomainType(definition.domain, `node:${definition.name}`);
    } catch (error) {
      throw new Error(`Failed to register node type: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Registers an edge type definition
   * @param definition - Edge type definition to register
   * @throws {Error} If type registration fails
   */
  registerEdgeType(definition: EdgeTypeDefinition): void {
    try {
      this.typeRegistry.registerEdgeType(definition);
      this.trackDomainType(definition.domain, `edge:${definition.name}`);
    } catch (error) {
      throw new Error(`Failed to register edge type: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Registers a directive definition
   * @param definition - Directive definition to register
   * @throws {Error} If directive registration fails
   * @example
   * ```typescript
   * manager.registerDirective({
   *   name: 'context',
   *   domain: 'c4',
   *   parser: (content) => parseC4Context(content),
   *   validator: (directive, graph) => validateC4Context(directive, graph)
   * });
   * ```
   */
  registerDirective(definition: DirectiveDefinition): void {
    try {
      this.directiveRegistry.registerDirective(definition);
      this.trackDomainType(definition.domain, `directive:${definition.name}`);
    } catch (error) {
      throw new Error(`Failed to register directive: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Gets the type registry instance
   * @returns Type registry for accessing registered types
   */
  getTypeRegistry(): TypeRegistry {
    return this.typeRegistry;
  }

  /**
   * Gets the directive registry instance
   * @returns Directive registry for accessing registered directives
   */
  getDirectiveRegistry(): DirectiveRegistry {
    return this.directiveRegistry;
  }

  /**
   * Activates a domain by loading associated plugins and types
   * @param domain - Domain name to activate
   * @returns Promise with activation result
   * @example
   * ```typescript
   * const result = await manager.activateDomain('c4');
   * console.log(`Activated domain ${result.domain} with ${result.types.length} types`);
   * ```
   */
  async activateDomain(domain: string): Promise<DomainActivationResult> {
    const result: DomainActivationResult = {
      domain,
      plugins: [],
      types: [],
      directives: [],
      errors: []
    };

    try {
      // Check if domain is already active
      if (this.activeDomains.has(domain)) {
        return result;
      }

      // Mark domain as active
      this.activeDomains.add(domain);

      // Load plugins for this domain
      const domainPlugins = this.domainPlugins.get(domain) || new Set();
      for (const pluginName of domainPlugins) {
        if (!this.isEnabled(pluginName)) {
          try {
            this.enable(pluginName);
            result.plugins.push(pluginName);
          } catch (error) {
            result.errors.push(`Failed to enable plugin ${pluginName}: ${error}`);
          }
        }
      }

      // Collect registered types and directives
      result.types = this.typeRegistry.getNodeTypesByDomain(domain)
        .map(type => type.name)
        .concat(this.typeRegistry.getEdgeTypesByDomain(domain).map(type => type.name));
      
      result.directives = this.directiveRegistry.getDirectivesByDomain(domain)
        .map(directive => directive.name);

      console.info(`Domain "${domain}" activated with ${result.types.length} types and ${result.directives.length} directives`);
      
      return result;
    } catch (error) {
      result.errors.push(`Domain activation failed: ${error instanceof Error ? error.message : String(error)}`);
      this.activeDomains.delete(domain); // Rollback
      return result;
    }
  }

  /**
   * Deactivates a domain and unloads its resources
   * @param domain - Domain name to deactivate
   */
  async deactivateDomain(domain: string): Promise<void> {
    if (!this.activeDomains.has(domain)) {
      return;
    }

    try {
      // Disable plugins for this domain
      const domainPlugins = this.domainPlugins.get(domain) || new Set();
      for (const pluginName of domainPlugins) {
        if (this.isEnabled(pluginName)) {
          this.disable(pluginName);
        }
      }

      // Unregister types and directives
      this.typeRegistry.unregisterDomain(domain);
      this.directiveRegistry.unregisterDomain(domain);

      // Mark domain as inactive
      this.activeDomains.delete(domain);

      console.info(`Domain "${domain}" deactivated`);
    } catch (error) {
      console.error(`Failed to deactivate domain "${domain}":`, error);
      throw error;
    }
  }

  /**
   * Gets list of currently active domains
   * @returns Array of active domain names
   */
  getActiveDomains(): string[] {
    return Array.from(this.activeDomains);
  }

  /**
   * Checks if a domain is currently active
   * @param domain - Domain name to check
   * @returns True if domain is active
   */
  isDomainActive(domain: string): boolean {
    return this.activeDomains.has(domain);
  }

  /**
   * Gets all available domains (registered by plugins)
   * @returns Array of all available domain names
   */
  getAvailableDomains(): string[] {
    const typeRegistryDomains = this.typeRegistry.getAllDomains();
    const directiveRegistryDomains = this.directiveRegistry.getAllDomains();
    const pluginDomains = Array.from(this.domainPlugins.keys());
    
    return Array.from(new Set([
      ...typeRegistryDomains,
      ...directiveRegistryDomains,
      ...pluginDomains
    ]));
  }

  /**
   * Detects domains from LFF text content
   * @param text - LFF text to analyze
   * @returns Array of detected domain names
   * @example
   * ```typescript
   * const domains = manager.detectDomains(`
   *   @domain: c4
   *   @context:
   *     Customer [person] -> System [system]
   * `);
   * console.log(domains); // ['c4']
   * ```
   */
  detectDomains(text: string): string[] {
    const domains = new Set<string>();

    // Explicit domain declarations
    const domainMatches = text.match(/@domain\s*:\s*([a-zA-Z0-9_-]+)/g);
    if (domainMatches) {
      domainMatches.forEach(match => {
        const domain = match.replace(/@domain\s*:\s*/, '').trim();
        domains.add(domain);
      });
    }

    // Implicit domain detection based on registered directives
    for (const domain of this.directiveRegistry.getAllDomains()) {
      const directives = this.directiveRegistry.getDirectivesByDomain(domain);
      for (const directive of directives) {
        const pattern = new RegExp(`@${directive.name}\\s*:`);
        if (pattern.test(text)) {
          domains.add(domain);
        }
      }
    }

    return Array.from(domains);
  }

  /**
   * Registers an enhanced plugin with domain awareness
   * @param plugin - Enhanced plugin to register
   * @returns Promise that resolves when plugin is installed
   */
  async registerEnhanced(plugin: EnhancedPlugin): Promise<void> {
    // Check dependencies
    if (plugin.dependencies) {
      for (const dependency of plugin.dependencies) {
        if (!this.isRegistered(dependency)) {
          throw new Error(`Plugin dependency "${dependency}" is not registered. Install it first.`);
        }
      }
    }

    // Register with base plugin manager
    await this.register(plugin);

    // Track domain associations
    if (plugin.domains) {
      for (const domain of plugin.domains) {
        if (!this.domainPlugins.has(domain)) {
          this.domainPlugins.set(domain, new Set());
        }
        this.domainPlugins.get(domain)!.add(plugin.name);

        if (!this.pluginDomains.has(plugin.name)) {
          this.pluginDomains.set(plugin.name, new Set());
        }
        this.pluginDomains.get(plugin.name)!.add(domain);
      }
    }

    // Call enhanced installation if available
    if (plugin.installEnhanced) {
      try {
        await Promise.resolve(plugin.installEnhanced(this));
      } catch (error) {
        console.error(`Enhanced installation failed for plugin "${plugin.name}":`, error);
        // Continue with basic registration
      }
    }
  }

  /**
   * Unregisters an enhanced plugin and cleans up domain associations
   * @param pluginName - Name of plugin to unregister
   * @returns Promise that resolves when plugin is uninstalled
   */
  async unregisterEnhanced(pluginName: string): Promise<void> {
    // Get plugin domains before unregistering
    const domains = this.pluginDomains.get(pluginName) || new Set();

    // Clean up domain associations first
    for (const domain of domains) {
      const domainPlugins = this.domainPlugins.get(domain);
      if (domainPlugins) {
        domainPlugins.delete(pluginName);
        
        // If this was the last plugin for the domain, clean up the domain completely
        if (domainPlugins.size === 0) {
          this.domainPlugins.delete(domain);
          
          // Deactivate domain if no plugins left
          if (this.activeDomains.has(domain)) {
            await this.deactivateDomain(domain);
          }
          
          // Clean up types and directives for this domain
          this.typeRegistry.unregisterDomain(domain);
          this.directiveRegistry.unregisterDomain(domain);
        }
      }
    }

    this.pluginDomains.delete(pluginName);

    // Unregister from base plugin manager
    await this.unregister(pluginName);
  }

  /**
   * Validates a graph AST using registered type validators
   * @param ast - Graph AST to validate
   * @param domains - Specific domains to validate against (optional)
   * @returns Array of validation errors
   */
  validateWithTypes(ast: GraphAST, domains?: string[]): ValidationError[] {
    const errors: ValidationError[] = [];
    const domainsToCheck = domains || this.getActiveDomains();

    // Validate nodes with type-specific validators
    for (const node of ast.nodes) {
      if (node.type) {
        for (const domain of domainsToCheck) {
          const typeDef = this.typeRegistry.getNodeType(node.type, domain);
          if (typeDef && typeDef.validation) {
            try {
              const typeErrors = typeDef.validation(node);
              errors.push(...typeErrors);
            } catch (error) {
              errors.push({
                path: `nodes.${node.id}`,
                message: `Type validation failed: ${error instanceof Error ? error.message : String(error)}`,
                code: 'TYPE_VALIDATION_ERROR'
              });
            }
          }
        }
      }
    }

    // Validate edges with type-specific validators
    for (const edge of ast.edges) {
      if (edge.type) {
        for (const domain of domainsToCheck) {
          const typeDef = this.typeRegistry.getEdgeType(edge.type, domain);
          if (typeDef && typeDef.validation) {
            try {
              const sourceNode = ast.nodes.find(n => n.id === edge.from);
              const targetNode = ast.nodes.find(n => n.id === edge.to);
              const typeErrors = typeDef.validation(edge, sourceNode, targetNode);
              errors.push(...typeErrors);
            } catch (error) {
              errors.push({
                path: `edges.${edge.from}-${edge.to}`,
                message: `Edge type validation failed: ${error instanceof Error ? error.message : String(error)}`,
                code: 'EDGE_TYPE_VALIDATION_ERROR'
              });
            }
          }
        }
      }
    }

    return errors;
  }

  /**
   * Gets enhanced plugin information including domain associations
   * @param pluginName - Name of plugin to get info for
   * @returns Enhanced plugin info or undefined
   */
  getEnhancedPluginInfo(pluginName: string): (PluginInfo & { domains?: string[] }) | undefined {
    const baseInfo = this.getPluginInfo(pluginName);
    if (!baseInfo) {
      return undefined;
    }

    const domains = Array.from(this.pluginDomains.get(pluginName) || []);
    return {
      ...baseInfo,
      ...(domains.length > 0 && { domains })
    };
  }

  /**
   * Private helper to track domain-type associations
   * @private
   */
  private trackDomainType(_domain: string, _type: string): void {
    // TODO: Implement domain type tracking for analytics
  }

  /**
   * Get all node types for a specific domain
   * @param domain - Domain to get types for
   * @returns Array of node type definitions
   */
  getTypesByDomain(domain: string): NodeTypeDefinition[] {
    return this.typeRegistry.getNodeTypesByDomain(domain);
  }

  /**
   * Get all directives for a specific domain
   * @param domain - Domain to get directives for
   * @returns Array of directive definitions
   */
  getDirectivesByDomain(domain: string): DirectiveDefinition[] {
    return this.directiveRegistry.getDirectivesByDomain(domain);
  }
} 