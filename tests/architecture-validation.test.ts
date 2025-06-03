/**
 * Architecture Validation Tests
 * @fileoverview Tests to validate the architectural improvements
 */

import { describe, test, expect } from 'jest';
import { 
  EnhancedLayerFlowParser,
  ValidationLayer,
  validateAST,
  parseLFF,
  serializeToLFF
} from '../packages/parser/src';

// Helper function to create default location
const createDefaultLocation = () => ({
  startLine: 0,
  endLine: 0,
  startColumn: 0,
  endColumn: 0,
  indent: 0
});

describe('Architecture Validation', () => {
  describe('Lexer-Parser Integration', () => {
    test('should properly integrate lexer and parser', () => {
      const parser = new EnhancedLayerFlowParser();
      const content = `
@title: Test Architecture
Frontend [web] -> Backend [api]
Backend -> Database [postgres]
      `.trim();

      const result = parser.parse(content);
      
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.ast).toBeDefined();
      expect(result.graph).toBeDefined();
    });

    test('should handle lexical errors gracefully', () => {
      const parser = new EnhancedLayerFlowParser();
      const content = `
Frontend [web] -> Backend [api
      `.trim(); // Missing closing bracket

      const result = parser.parse(content);
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should handle parsing errors gracefully', () => {
      const parser = new EnhancedLayerFlowParser();
      const content = `
Frontend -> -> Backend
      `.trim(); // Invalid syntax

      const result = parser.parse(content);
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Validation Layer Separation', () => {
    test('should validate AST independently', () => {
      const validationLayer = new ValidationLayer();
      
      // Create a valid AST
      const validAST = {
        nodes: [
          {
            astId: 'node1',
            name: 'Frontend',
            types: ['web'],
            location: createDefaultLocation()
          },
          {
            astId: 'node2', 
            name: 'Backend',
            types: ['api'],
            location: createDefaultLocation()
          }
        ],
        edges: [
          {
            astId: 'edge1',
            from: 'Frontend',
            to: 'Backend',
            arrow: '->' as const,
            location: createDefaultLocation()
          }
        ],
        directives: [],
        metadata: {}
      };

      const result = validationLayer.validate(validAST);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.metrics).toBeDefined();
      expect(result.metrics?.nodeCount).toBe(2);
      expect(result.metrics?.edgeCount).toBe(1);
    });

    test('should detect validation errors', () => {
      const validationLayer = new ValidationLayer();
      
      // Create an invalid AST
      const invalidAST = {
        nodes: [
          {
            astId: 'node1',
            name: '', // Invalid: empty name
            types: ['web'],
            location: createDefaultLocation()
          }
        ],
        edges: [
          {
            astId: 'edge1',
            from: 'Frontend',
            to: 'NonExistentNode', // Invalid: references non-existent node
            arrow: '->' as const,
            location: createDefaultLocation()
          }
        ],
        directives: [],
        metadata: {}
      };

      const result = validationLayer.validate(invalidAST);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      // Check specific error types
      const errorCodes = result.errors.map(e => e.code);
      expect(errorCodes).toContain('SYNTAX_NODE_NAME_REQUIRED');
      expect(errorCodes).toContain('REFERENCE_NODE_EXISTS');
    });

    test('should validate level specifications', () => {
      const validationLayer = new ValidationLayer();
      
      const astWithInvalidLevel = {
        nodes: [
          {
            astId: 'node1',
            name: 'Frontend',
            levelSpec: 'invalid-level', // Invalid level format
            location: createDefaultLocation()
          }
        ],
        edges: [],
        directives: [],
        metadata: {}
      };

      const result = validationLayer.validate(astWithInvalidLevel);
      
      expect(result.warnings.length).toBeGreaterThan(0);
      const warningCodes = result.warnings.map(w => w.code);
      expect(warningCodes).toContain('SEMANTIC_LEVEL_VALID');
    });
  });

  describe('Bidirectional Sync', () => {
    test('should maintain round-trip consistency', () => {
      const originalLFF = `
@title: Round Trip Test
@version: 1.0

System:
  Frontend [web] @1:
    port: 3000
    framework: React
  Backend [api] @1:
    port: 8080
    language: TypeScript
  Database [postgres] @2

Frontend -> Backend: HTTP requests
Backend -> Database: SQL queries
      `.trim();

      // Parse LFF → GraphAST
      const parseResult = parseLFF(originalLFF);
      expect(parseResult.success).toBe(true);
      expect(parseResult.graph).toBeDefined();

      // Serialize GraphAST → LFF
      const serializedLFF = serializeToLFF(parseResult.graph!);
      expect(serializedLFF).toBeDefined();
      expect(serializedLFF.length).toBeGreaterThan(0);

      // Parse again to verify consistency
      const secondParseResult = parseLFF(serializedLFF);
      expect(secondParseResult.success).toBe(true);
      
      // Compare key structures
      expect(secondParseResult.graph?.nodes.length).toBe(parseResult.graph?.nodes.length);
      expect(secondParseResult.graph?.edges.length).toBe(parseResult.graph?.edges.length);
    });

    test('should preserve metadata in round-trip', () => {
      const lffWithMetadata = `
@title: Metadata Test
@description: Testing metadata preservation
@tags: [test, architecture, metadata]

Service [microservice]:
  replicas: 3
  memory: 512Mi
  cpu: 100m
      `.trim();

      const parseResult = parseLFF(lffWithMetadata);
      expect(parseResult.success).toBe(true);
      
      const serialized = serializeToLFF(parseResult.graph!);
      const reparsed = parseLFF(serialized);
      
      expect(reparsed.success).toBe(true);
      expect(reparsed.graph?.metadata?.title).toBe('Metadata Test');
      expect(reparsed.graph?.metadata?.description).toBe('Testing metadata preservation');
    });
  });

  describe('Error Recovery and Diagnostics', () => {
    test('should provide detailed error locations', () => {
      const parser = new EnhancedLayerFlowParser();
      const invalidContent = `
Frontend [web]
Backend
Frontend -> NonExistent
      `.trim();

      const result = parser.parse(invalidContent);
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      // Check that errors have location information
      for (const error of result.errors) {
        expect(error.location).toBeDefined();
        expect(error.message).toBeDefined();
        expect(error.code).toBeDefined();
      }
    });

    test('should handle strict vs non-strict validation', () => {
      const strictParser = new EnhancedLayerFlowParser({ strict: true });
      const lenientParser = new EnhancedLayerFlowParser({ strict: false });
      
      const contentWithWarnings = `
Frontend [web] @invalid-level -> Backend [api]
      `.trim();

      const strictResult = strictParser.parse(contentWithWarnings);
      const lenientResult = lenientParser.parse(contentWithWarnings);
      
      // Strict mode should fail on warnings
      expect(strictResult.success).toBe(false);
      
      // Lenient mode should succeed with warnings
      expect(lenientResult.success).toBe(true);
      expect(lenientResult.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Plugin Architecture', () => {
    test('should support plugin registration', () => {
      const parser = new EnhancedLayerFlowParser();
      
      // Test that parser can be created with plugins
      const parserWithPlugins = new EnhancedLayerFlowParser({
        grammarPlugins: [] // Empty for now, but architecture supports it
      });
      
      expect(parserWithPlugins).toBeDefined();
    });

    test('should support validation rule customization', () => {
      const validationLayer = new ValidationLayer();
      
      // Add custom validation rule
      validationLayer.addRule({
        name: 'custom.test.rule',
        description: 'Test custom rule',
        severity: 'warning',
        validate: (ast) => {
          return ast.nodes.length > 5 ? [{
            rule: 'custom.test.rule',
            message: 'Too many nodes',
            severity: 'warning' as const
          }] : [];
        }
      });

      const astWithManyNodes = {
        nodes: Array.from({ length: 6 }, (_, i) => ({
          astId: `node${i}`,
          name: `Node${i}`,
          location: createDefaultLocation()
        })),
        edges: [],
        directives: [],
        metadata: {}
      };

      const result = validationLayer.validate(astWithManyNodes);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0].code).toBe('CUSTOM_TEST_RULE');
    });
  });

  describe('Performance and Metrics', () => {
    test('should provide parsing metrics', () => {
      const parser = new EnhancedLayerFlowParser({ enableMetrics: true });
      const content = `
Frontend [web] -> Backend [api] -> Database [postgres]
      `.trim();

      const result = parser.parse(content);
      
      expect(result.success).toBe(true);
      expect(result.metrics).toBeDefined();
      expect(result.metrics?.totalTime).toBeGreaterThan(0);
      expect(result.metrics?.parseTime).toBeGreaterThan(0);
    });

    test('should provide validation metrics', () => {
      const validationLayer = new ValidationLayer();
      const ast = {
        nodes: [{ 
          astId: 'n1', 
          name: 'Test',
          location: createDefaultLocation()
        }],
        edges: [],
        directives: [],
        metadata: {}
      };

      const result = validationLayer.validate(ast);
      
      expect(result.metrics).toBeDefined();
      expect(result.metrics?.validationTime).toBeGreaterThan(0);
      expect(result.metrics?.rulesChecked).toBeGreaterThan(0);
    });
  });
});

describe('LFF Specification Compliance', () => {
  test('should parse basic node definitions', () => {
    const content = `
Frontend
"Backend Service"
Database [postgres]
Cache [redis, memory]
    `.trim();

    const result = parseLFF(content);
    expect(result.success).toBe(true);
    expect(result.ast?.nodes).toHaveLength(4);
    
    const nodes = result.ast!.nodes;
    expect(nodes[0].name).toBe('Frontend');
    expect(nodes[1].name).toBe('Backend Service');
    expect(nodes[2].types).toContain('postgres');
    expect(nodes[3].types).toContain('redis');
    expect(nodes[3].types).toContain('memory');
  });

  test('should parse edge definitions', () => {
    const content = `
A -> B
C => D: multiple connection
E <-> F: bidirectional
G --> H: dashed
    `.trim();

    const result = parseLFF(content);
    expect(result.success).toBe(true);
    expect(result.ast?.edges).toHaveLength(4);
    
    const edges = result.ast!.edges;
    expect(edges[0].arrow).toBe('->');
    expect(edges[1].arrow).toBe('=>');
    expect(edges[1].label).toBe('multiple connection');
    expect(edges[2].arrow).toBe('<->');
    expect(edges[3].arrow).toBe('-->');
  });

  test('should parse hierarchical blocks', () => {
    const content = `
System:
  Frontend [web]:
    port: 3000
  Backend [api]:
    port: 8080
    Database [postgres]:
      host: localhost
    `.trim();

    const result = parseLFF(content);
    expect(result.success).toBe(true);
    
    // Check that hierarchical structure is preserved
    const nodes = result.ast!.nodes;
    expect(nodes.length).toBeGreaterThan(0);
    
    // Check that properties are captured
    const frontendNode = nodes.find(n => n.name === 'Frontend');
    expect(frontendNode?.properties?.port).toBe(3000);
  });

  test('should parse directives', () => {
    const content = `
@title: Test System
@version: 1.0.0
@levels: 3

Frontend -> Backend
    `.trim();

    const result = parseLFF(content);
    expect(result.success).toBe(true);
    expect(result.ast?.directives).toHaveLength(3);
    
    const directives = result.ast!.directives;
    expect(directives.find(d => d.key === 'title')?.value).toBe('Test System');
    expect(directives.find(d => d.key === 'version')?.value).toBe('1.0.0');
    expect(directives.find(d => d.key === 'levels')?.value).toBe(3);
  });
}); 