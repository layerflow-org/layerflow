/// <reference types="jest" />

/**
 * Tests for Type Registry and Directive Registry
 * @fileoverview Comprehensive testing of domain-aware type system
 */

import { 
  TypeRegistry, 
  DirectiveRegistry, 
  NodeTypeDefinition, 
  EdgeTypeDefinition, 
  DirectiveDefinition
} from '../src/registry';
import { GraphNode, Edge, GraphAST, ValidationError } from '../src/types';

describe('TypeRegistry', () => {
  let registry: TypeRegistry;

  beforeEach(() => {
    registry = new TypeRegistry();
  });

  describe('Node Type Registration', () => {
    const c4PersonType: NodeTypeDefinition = {
      name: 'person',
      domain: 'c4',
      description: 'C4 Architecture Person',
      validation: (node: GraphNode) => {
        const errors: ValidationError[] = [];
        if (!node.metadata?.role) {
          errors.push({
            path: `nodes.${node.id}.metadata.role`,
            message: 'C4 Person must have a role defined',
            code: 'C4_PERSON_MISSING_ROLE'
          });
        }
        return errors;
      },
      autoComplete: [
        { name: 'role', type: 'string', required: true },
        { name: 'department', type: 'string' }
      ],
      defaultMetadata: {
        shape: 'circle',
        color: '#1168bd'
      }
    };

    it('should register a node type successfully', () => {
      expect(() => registry.registerNodeType(c4PersonType)).not.toThrow();
    });

    it('should throw error when registering duplicate type', () => {
      registry.registerNodeType(c4PersonType);
      expect(() => registry.registerNodeType(c4PersonType)).toThrow(
        'Node type "c4:person" is already registered'
      );
    });

    it('should retrieve registered node type', () => {
      registry.registerNodeType(c4PersonType);
      const retrieved = registry.getNodeType('person', 'c4');
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('person');
      expect(retrieved?.domain).toBe('c4');
    });

    it('should return undefined for non-existent type', () => {
      const retrieved = registry.getNodeType('nonexistent', 'c4');
      expect(retrieved).toBeUndefined();
    });

    it('should get types by domain', () => {
      registry.registerNodeType(c4PersonType);
      const systemType: NodeTypeDefinition = {
        name: 'system',
        domain: 'c4',
        description: 'C4 System'
      };
      registry.registerNodeType(systemType);

      const c4Types = registry.getNodeTypesByDomain('c4');
      expect(c4Types).toHaveLength(2);
      expect(c4Types.map(t => t.name)).toContain('person');
      expect(c4Types.map(t => t.name)).toContain('system');
    });

    it('should track domains correctly', () => {
      registry.registerNodeType(c4PersonType);
      expect(registry.hasDomain('c4')).toBe(true);
      expect(registry.hasDomain('k8s')).toBe(false);
      expect(registry.getAllDomains()).toContain('c4');
    });

    it('should unregister domain types', () => {
      registry.registerNodeType(c4PersonType);
      expect(registry.hasDomain('c4')).toBe(true);
      
      registry.unregisterDomain('c4');
      expect(registry.hasDomain('c4')).toBe(false);
      expect(registry.getNodeType('person', 'c4')).toBeUndefined();
    });

    it('should validate node using registered type validator', () => {
      registry.registerNodeType(c4PersonType);
      const type = registry.getNodeType('person', 'c4');
      
      // Test validation with missing role
      const invalidNode: GraphNode = {
        id: 'user1',
        label: 'Customer',
        type: 'person',
        metadata: {} // Missing role
      };
      
      const errors = type?.validation?.(invalidNode) || [];
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('C4_PERSON_MISSING_ROLE');
      
      // Test validation with valid role
      const validNode: GraphNode = {
        id: 'user2',
        label: 'Customer',
        type: 'person',
        metadata: { role: 'Bank Customer' }
      };
      
      const validErrors = type?.validation?.(validNode) || [];
      expect(validErrors).toHaveLength(0);
    });
  });

  describe('Edge Type Registration', () => {
    const httpEdgeType: EdgeTypeDefinition = {
      name: 'http',
      domain: 'web',
      description: 'HTTP connection',
      validation: (edge: Edge) => {
        const errors: ValidationError[] = [];
        if (!edge.metadata?.protocol) {
          errors.push({
            path: `edges.${edge.from}-${edge.to}.metadata.protocol`,
            message: 'HTTP edge must specify protocol',
            code: 'HTTP_MISSING_PROTOCOL'
          });
        }
        return errors;
      }
    };

    it('should register edge type successfully', () => {
      expect(() => registry.registerEdgeType(httpEdgeType)).not.toThrow();
    });

    it('should retrieve registered edge type', () => {
      registry.registerEdgeType(httpEdgeType);
      const retrieved = registry.getEdgeType('http', 'web');
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('http');
      expect(retrieved?.domain).toBe('web');
    });

    it('should get edge types by domain', () => {
      registry.registerEdgeType(httpEdgeType);
      const websocketType: EdgeTypeDefinition = {
        name: 'websocket',
        domain: 'web',
        description: 'WebSocket connection'
      };
      registry.registerEdgeType(websocketType);

      const webTypes = registry.getEdgeTypesByDomain('web');
      expect(webTypes).toHaveLength(2);
      expect(webTypes.map(t => t.name)).toContain('http');
      expect(webTypes.map(t => t.name)).toContain('websocket');
    });
  });

  describe('Multiple Domains', () => {
    it('should handle multiple domains independently', () => {
      const c4System: NodeTypeDefinition = {
        name: 'system',
        domain: 'c4',
        description: 'C4 System'
      };
      
      const k8sSystem: NodeTypeDefinition = {
        name: 'system',
        domain: 'k8s',
        description: 'Kubernetes System'
      };

      registry.registerNodeType(c4System);
      registry.registerNodeType(k8sSystem);

      expect(registry.getNodeType('system', 'c4')?.description).toBe('C4 System');
      expect(registry.getNodeType('system', 'k8s')?.description).toBe('Kubernetes System');
      expect(registry.getAllDomains()).toEqual(expect.arrayContaining(['c4', 'k8s']));
    });
  });
});

describe('DirectiveRegistry', () => {
  let registry: DirectiveRegistry;

  beforeEach(() => {
    registry = new DirectiveRegistry();
  });

  describe('Directive Registration', () => {
    const contextDirective: DirectiveDefinition = {
      name: 'context',
      domain: 'c4',
      description: 'C4 Context diagram',
      parser: (content: string) => {
        return { type: 'context', content };
      },
      validator: (_directive, graph) => {
        const errors: ValidationError[] = [];
        const personNodes = graph.nodes.filter(n => n.type === 'person');
        if (personNodes.length === 0) {
          errors.push({
            path: 'context',
            message: 'Context diagram must include at least one person',
            code: 'C4_CONTEXT_NO_PERSON'
          });
        }
        return errors;
      }
    };

    it('should register directive successfully', () => {
      expect(() => registry.registerDirective(contextDirective)).not.toThrow();
    });

    it('should throw error when registering duplicate directive', () => {
      registry.registerDirective(contextDirective);
      expect(() => registry.registerDirective(contextDirective)).toThrow(
        'Directive "c4:context" is already registered'
      );
    });

    it('should retrieve registered directive', () => {
      registry.registerDirective(contextDirective);
      const retrieved = registry.getDirective('context', 'c4');
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('context');
      expect(retrieved?.domain).toBe('c4');
    });

    it('should get directives by domain', () => {
      registry.registerDirective(contextDirective);
      const containerDirective: DirectiveDefinition = {
        name: 'container',
        domain: 'c4',
        description: 'C4 Container diagram',
        parser: (content: string) => ({ type: 'container', content })
      };
      registry.registerDirective(containerDirective);

      const c4Directives = registry.getDirectivesByDomain('c4');
      expect(c4Directives).toHaveLength(2);
      expect(c4Directives.map(d => d.name)).toContain('context');
      expect(c4Directives.map(d => d.name)).toContain('container');
    });

    it('should execute directive parser', () => {
      registry.registerDirective(contextDirective);
      const directive = registry.getDirective('context', 'c4');
      
      const result = directive?.parser('test content');
      expect(result).toEqual({ type: 'context', content: 'test content' });
    });

    it('should execute directive validator', () => {
      registry.registerDirective(contextDirective);
      const directive = registry.getDirective('context', 'c4');
      
      // Test with graph missing person
      const invalidGraph: GraphAST = {
        nodes: [{ id: 'sys1', label: 'System', type: 'system' }],
        edges: []
      };
      
      const errors = directive?.validator?.({}, invalidGraph) || [];
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('C4_CONTEXT_NO_PERSON');
      
      // Test with valid graph
      const validGraph: GraphAST = {
        nodes: [
          { id: 'user1', label: 'Customer', type: 'person' },
          { id: 'sys1', label: 'System', type: 'system' }
        ],
        edges: []
      };
      
      const validErrors = directive?.validator?.({}, validGraph) || [];
      expect(validErrors).toHaveLength(0);
    });

    it('should unregister domain directives', () => {
      registry.registerDirective(contextDirective);
      expect(registry.getDirective('context', 'c4')).toBeDefined();
      
      registry.unregisterDomain('c4');
      expect(registry.getDirective('context', 'c4')).toBeUndefined();
    });
  });

  describe('Multiple Domains', () => {
    it('should handle directives from different domains', () => {
      const c4Context: DirectiveDefinition = {
        name: 'context',
        domain: 'c4',
        description: 'C4 Context',
        parser: (content) => ({ type: 'c4-context', content })
      };
      
      const bpmnProcess: DirectiveDefinition = {
        name: 'process',
        domain: 'bpmn',
        description: 'BPMN Process',
        parser: (content) => ({ type: 'bpmn-process', content })
      };

      registry.registerDirective(c4Context);
      registry.registerDirective(bpmnProcess);

      expect(registry.getDirective('context', 'c4')?.description).toBe('C4 Context');
      expect(registry.getDirective('process', 'bpmn')?.description).toBe('BPMN Process');
      expect(registry.getAllDomains()).toEqual(expect.arrayContaining(['c4', 'bpmn']));
    });
  });
});

describe('Integration Tests', () => {
  it('should work together for domain-specific validation', () => {
    const typeRegistry = new TypeRegistry();
    const directiveRegistry = new DirectiveRegistry();

    // Register C4 types
    typeRegistry.registerNodeType({
      name: 'person',
      domain: 'c4',
      validation: (node) => {
        if (!node.metadata?.role) {
          return [{ path: `nodes.${node.id}`, message: 'Missing role', code: 'MISSING_ROLE' }];
        }
        return [];
      }
    });

    // Register C4 directive
    directiveRegistry.registerDirective({
      name: 'context',
      domain: 'c4',
      parser: (content) => ({ content }),
      validator: (_directive, graph) => {
        const persons = graph.nodes.filter(n => n.type === 'person');
        if (persons.length === 0) {
          return [{ path: 'context', message: 'No persons', code: 'NO_PERSONS' }];
        }
        return [];
      }
    });

    // Test combined validation
    const graph: GraphAST = {
      nodes: [
        { id: 'user1', label: 'Customer', type: 'person', metadata: { role: 'Customer' } }
      ],
      edges: []
    };

    const personType = typeRegistry.getNodeType('person', 'c4');
    const contextDirective = directiveRegistry.getDirective('context', 'c4');

    const typeErrors = personType?.validation?.(graph.nodes[0]) || [];
    const directiveErrors = contextDirective?.validator?.({}, graph) || [];

    expect(typeErrors).toHaveLength(0);
    expect(directiveErrors).toHaveLength(0);
  });
}); 