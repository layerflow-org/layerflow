/**
 * Tests for Enhanced Plugin Manager
 * @fileoverview Testing domain-aware plugin functionality
 */

import { EnhancedPluginManager, EnhancedPlugin } from '../src/enhanced-plugins';
import { NodeTypeDefinition, DirectiveDefinition } from '../src/registry';
import { GraphAST, ValidationError } from '../src/types';

describe('EnhancedPluginManager', () => {
  let manager: EnhancedPluginManager;

  beforeEach(() => {
    manager = new EnhancedPluginManager();
  });

  describe('Type Registration', () => {
    it('should register node types through manager', () => {
      const personType: NodeTypeDefinition = {
        name: 'person',
        domain: 'c4',
        description: 'C4 Person'
      };

      expect(() => manager.registerNodeType(personType)).not.toThrow();
      
      const registry = manager.getTypeRegistry();
      const retrieved = registry.getNodeType('person', 'c4');
      expect(retrieved).toBeDefined();
      expect(retrieved?.domain).toBe('c4');
    });

    it('should register directive through manager', () => {
      const contextDirective: DirectiveDefinition = {
        name: 'context',
        domain: 'c4',
        parser: (content) => ({ content })
      };

      expect(() => manager.registerDirective(contextDirective)).not.toThrow();
      
      const registry = manager.getDirectiveRegistry();
      const retrieved = registry.getDirective('context', 'c4');
      expect(retrieved).toBeDefined();
    });
  });

  describe('Enhanced Plugin Registration', () => {
    const createC4Plugin = (): EnhancedPlugin => ({
      name: 'c4-template',
      version: '1.0.0',
      domains: ['c4'],
      install: () => {},
      installEnhanced: (manager: EnhancedPluginManager) => {
        manager.registerNodeType({
          name: 'person',
          domain: 'c4',
          validation: (node) => {
            if (!node.metadata?.role) {
              return [{ path: `nodes.${node.id}`, message: 'Missing role', code: 'MISSING_ROLE' }];
            }
            return [];
          }
        });

        manager.registerDirective({
          name: 'context',
          domain: 'c4',
          parser: (content) => ({ content }),
          validator: (_directive, graph) => {
            const persons = graph.nodes.filter(n => n.type === 'person');
            if (persons.length === 0) {
              return [{ path: 'context', message: 'No person in context', code: 'NO_PERSON' }];
            }
            return [];
          }
        });
      }
    });

    it('should register enhanced plugin successfully', async () => {
      const plugin = createC4Plugin();
      await expect(manager.registerEnhanced(plugin)).resolves.not.toThrow();
      
      expect(manager.isRegistered('c4-template')).toBe(true);
      expect(manager.getAvailableDomains()).toContain('c4');
    });

    it('should call installEnhanced during registration', async () => {
      const plugin = createC4Plugin();
      await manager.registerEnhanced(plugin);
      
      // Check that types were registered
      const typeRegistry = manager.getTypeRegistry();
      const directiveRegistry = manager.getDirectiveRegistry();
      
      expect(typeRegistry.getNodeType('person', 'c4')).toBeDefined();
      expect(directiveRegistry.getDirective('context', 'c4')).toBeDefined();
    });

    it('should track plugin domain associations', async () => {
      const plugin = createC4Plugin();
      await manager.registerEnhanced(plugin);
      
      const pluginInfo = manager.getEnhancedPluginInfo('c4-template');
      expect(pluginInfo?.domains).toContain('c4');
    });

    it('should fail if dependency is missing', async () => {
      const pluginWithDependency: EnhancedPlugin = {
        name: 'dependent-plugin',
        version: '1.0.0',
        dependencies: ['non-existent-plugin'],
        install: () => {}
      };

      await expect(manager.registerEnhanced(pluginWithDependency))
        .rejects.toThrow('Plugin dependency "non-existent-plugin" is not registered');
    });
  });

  describe('Domain Activation', () => {
    beforeEach(async () => {
      // Register C4 plugin for testing
      const c4Plugin: EnhancedPlugin = {
        name: 'c4-template',
        version: '1.0.0',
        domains: ['c4'],
        install: () => {},
        installEnhanced: (manager) => {
          manager.registerNodeType({
            name: 'person',
            domain: 'c4'
          });
          manager.registerDirective({
            name: 'context',
            domain: 'c4',
            parser: (content) => ({ content })
          });
        }
      };
      await manager.registerEnhanced(c4Plugin);
    });

    it('should activate domain successfully', async () => {
      const result = await manager.activateDomain('c4');
      
      expect(result.domain).toBe('c4');
      expect(result.errors).toHaveLength(0);
      expect(result.types).toContain('person');
      expect(result.directives).toContain('context');
      expect(manager.isDomainActive('c4')).toBe(true);
    });

    it('should not activate same domain twice', async () => {
      await manager.activateDomain('c4');
      const result = await manager.activateDomain('c4');
      
      expect(result.plugins).toHaveLength(0); // No new plugins enabled
    });

    it('should deactivate domain', async () => {
      await manager.activateDomain('c4');
      expect(manager.isDomainActive('c4')).toBe(true);
      
      await manager.deactivateDomain('c4');
      expect(manager.isDomainActive('c4')).toBe(false);
    });
  });

  describe('Domain Detection', () => {
    beforeEach(async () => {
      // Register plugins with directives
      const c4Plugin: EnhancedPlugin = {
        name: 'c4-template',
        version: '1.0.0',
        domains: ['c4'],
        install: () => {},
        installEnhanced: (manager) => {
          manager.registerDirective({
            name: 'context',
            domain: 'c4',
            parser: (content) => ({ content })
          });
        }
      };

      const bpmnPlugin: EnhancedPlugin = {
        name: 'bpmn-template',
        version: '1.0.0',
        domains: ['bpmn'],
        install: () => {},
        installEnhanced: (manager) => {
          manager.registerDirective({
            name: 'process',
            domain: 'bpmn',
            parser: (content) => ({ content })
          });
        }
      };

      await manager.registerEnhanced(c4Plugin);
      await manager.registerEnhanced(bpmnPlugin);
    });

    it('should detect explicit domain declarations', () => {
      const lffText = `
        @domain: c4
        @title: Banking System
      `;
      
      const domains = manager.detectDomains(lffText);
      expect(domains).toContain('c4');
    });

    it('should detect implicit domains from directives', () => {
      const lffText = `
        @context:
          Customer [person] -> BankingSystem [system]
      `;
      
      const domains = manager.detectDomains(lffText);
      expect(domains).toContain('c4');
    });

    it('should detect multiple domains', () => {
      const lffText = `
        @domain: c4
        @context:
          Customer [person] -> System [system]
        
        @process:
          Start -> Task -> End
      `;
      
      const domains = manager.detectDomains(lffText);
      expect(domains).toContain('c4');
      expect(domains).toContain('bpmn');
    });
  });

  describe('Type-Aware Validation', () => {
    beforeEach(async () => {
      const plugin: EnhancedPlugin = {
        name: 'c4-template',
        version: '1.0.0',
        domains: ['c4'],
        install: () => {},
        installEnhanced: (manager) => {
          manager.registerNodeType({
            name: 'person',
            domain: 'c4',
            validation: (node) => {
              const errors: ValidationError[] = [];
              if (!node.metadata?.role) {
                errors.push({
                  path: `nodes.${node.id}.metadata.role`,
                  message: 'C4 Person must have a role',
                  code: 'C4_PERSON_MISSING_ROLE'
                });
              }
              return errors;
            }
          });
        }
      };
      await manager.registerEnhanced(plugin);
      await manager.activateDomain('c4');
    });

    it('should validate using registered type validators', () => {
      const graph: GraphAST = {
        nodes: [
          { id: 'user1', label: 'Customer', type: 'person', metadata: {} } // Missing role
        ],
        edges: []
      };

      const errors = manager.validateWithTypes(graph);
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('C4_PERSON_MISSING_ROLE');
    });

    it('should pass validation with valid types', () => {
      const graph: GraphAST = {
        nodes: [
          { id: 'user1', label: 'Customer', type: 'person', metadata: { role: 'Bank Customer' } }
        ],
        edges: []
      };

      const errors = manager.validateWithTypes(graph);
      expect(errors).toHaveLength(0);
    });
  });

  describe('Plugin Cleanup', () => {
    it('should clean up domain associations when unregistering', async () => {
      const plugin: EnhancedPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        domains: ['test'],
        install: () => {},
        installEnhanced: (manager) => {
          manager.registerNodeType({
            name: 'test-node',
            domain: 'test'
          });
        }
      };

      await manager.registerEnhanced(plugin);
      expect(manager.getAvailableDomains()).toContain('test');
      
      await manager.unregisterEnhanced('test-plugin');
      expect(manager.isRegistered('test-plugin')).toBe(false);
      expect(manager.getAvailableDomains()).not.toContain('test');
    });
  });
}); 