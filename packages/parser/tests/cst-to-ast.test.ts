/**
 * Comprehensive CST-to-AST Converter Tests
 * @fileoverview Complete test suite for CST to LFF AST conversion with error handling
 */

import { CSTToASTConverter } from '../src/cst-to-ast';
import { LFFParser, LFFLexer } from '../src';
import type { LFFQ, LFFNodeDef, LFFEdgeDef, LFFDirectiveDef } from '../src/types';

describe('CST-to-AST Converter', () => {
  let converter: CSTToASTConverter;
  let parser: LFFParser;
  let lexer: LFFLexer;

  beforeEach(() => {
    converter = new CSTToASTConverter();
    parser = new LFFParser();
    lexer = new LFFLexer();
    parser.setLexer(lexer);
  });

  describe('Basic Conversion', () => {
    test('should convert simple directive', () => {
      const parseResult = parser.parseToCST('@title: "My Architecture"');
      expect(parseResult.success).toBe(true);
      
      if (parseResult.cst) {
        const astResult = converter.convert(parseResult.cst);
        
        expect(astResult.success).toBe(true);
        expect(astResult.errors).toHaveLength(0);
        expect(astResult.ast).toBeDefined();
        expect(astResult.ast?.directives).toHaveLength(1);
        
        const directive = astResult.ast?.directives[0] as LFFDirectiveDef;
        expect(directive.type).toBe('directive');
        expect(directive.name).toBe('title');
        expect(directive.value).toBe('"My Architecture"');
      }
    });

    test('should convert simple node', () => {
      const parseResult = parser.parseToCST('Frontend [web]');
      expect(parseResult.success).toBe(true);
      
      if (parseResult.cst) {
        const astResult = converter.convert(parseResult.cst);
        
        expect(astResult.success).toBe(true);
        expect(astResult.errors).toHaveLength(0);
        expect(astResult.ast?.nodes).toHaveLength(1);
        
        const node = astResult.ast?.nodes[0] as LFFNodeDef;
        expect(node.type).toBe('node');
        expect(node.name).toBe('Frontend');
        expect(node.nodeTypes).toEqual(['web']);
      }
    });

    test('should convert simple edge', () => {
      const parseResult = parser.parseToCST('Frontend -> Backend');
      expect(parseResult.success).toBe(true);
      
      if (parseResult.cst) {
        const astResult = converter.convert(parseResult.cst);
        
        expect(astResult.success).toBe(true);
        expect(astResult.errors).toHaveLength(0);
        expect(astResult.ast?.edges).toHaveLength(1);
        
        const edge = astResult.ast?.edges[0] as LFFEdgeDef;
        expect(edge.type).toBe('edge');
        expect(edge.from).toBe('Frontend');
        expect(edge.to).toBe('Backend');
        expect(edge.arrow).toBe('->');
      }
    });

    test('should convert node with anchor', () => {
      const parseResult = parser.parseToCST('Frontend &ui [web]');
      expect(parseResult.success).toBe(true);
      
      if (parseResult.cst) {
        const astResult = converter.convert(parseResult.cst);
        
        expect(astResult.success).toBe(true);
        expect(astResult.ast?.nodes).toHaveLength(1);
        
        const node = astResult.ast?.nodes[0] as LFFNodeDef;
        expect(node.anchor).toBe('ui');
      }
    });

    test('should convert node with level specification', () => {
      const parseResult = parser.parseToCST('Frontend [web] @1');
      expect(parseResult.success).toBe(true);
      
      if (parseResult.cst) {
        const astResult = converter.convert(parseResult.cst);
        
        expect(astResult.success).toBe(true);
        expect(astResult.ast?.nodes).toHaveLength(1);
        
        const node = astResult.ast?.nodes[0] as LFFNodeDef;
        expect(node.level).toBe('@1');
      }
    });

    test('should convert edge with anchor references', () => {
      const parseResult = parser.parseToCST('*ui -> *api');
      expect(parseResult.success).toBe(true);
      
      if (parseResult.cst) {
        const astResult = converter.convert(parseResult.cst);
        
        expect(astResult.success).toBe(true);
        expect(astResult.ast?.edges).toHaveLength(1);
        
        const edge = astResult.ast?.edges[0] as LFFEdgeDef;
        expect(edge.from).toBe('*ui');
        expect(edge.to).toBe('*api');
      }
    });
  });

  describe('Complex Document Conversion', () => {
    test('should convert complete LFF document', () => {
      const lffDocument = `
@title: "E-commerce Architecture"
@version: 1.2
@domain: web

Frontend &ui [web, react] @1:
  framework: react
  components: ["Header", "ProductList", "Cart"]

Backend &api [service] @2:
  database: postgresql
  cache: redis

Database &db [storage] @3

*ui -> *api: "REST API"
*api -> *db: "SQL queries"
Frontend <-> Backend: "WebSocket"
      `.trim();

      const parseResult = parser.parseToCST(lffDocument);
      expect(parseResult.success).toBe(true);
      
      if (parseResult.cst) {
        const astResult = converter.convert(parseResult.cst);
        
        expect(astResult.success).toBe(true);
        expect(astResult.errors).toHaveLength(0);
        expect(astResult.ast).toBeDefined();
        
        // Check directives
        expect(astResult.ast?.directives).toHaveLength(3);
        const titleDirective = astResult.ast?.directives.find(d => d.name === 'title');
        expect(titleDirective?.value).toBe('"E-commerce Architecture"');
        
        // Check nodes
        expect(astResult.ast?.nodes).toHaveLength(3);
        const frontendNode = astResult.ast?.nodes.find(n => n.name === 'Frontend');
        expect(frontendNode?.anchor).toBe('ui');
        expect(frontendNode?.nodeTypes).toEqual(['web', 'react']);
        expect(frontendNode?.level).toBe('@1');
        
        // Check edges
        expect(astResult.ast?.edges).toHaveLength(3);
        const restEdge = astResult.ast?.edges.find(e => e.label === '"REST API"');
        expect(restEdge?.from).toBe('*ui');
        expect(restEdge?.to).toBe('*api');
      }
    });

    test('should convert nested node structure', () => {
      const nestedDocument = `
Frontend:
  Components:
    Header
    Navigation
    Footer
  Services:
    AuthService
    ApiService
      `.trim();

      const parseResult = parser.parseToCST(nestedDocument);
      expect(parseResult.success).toBe(true);
      
      if (parseResult.cst) {
        const astResult = converter.convert(parseResult.cst);
        
        expect(astResult.success).toBe(true);
        expect(astResult.ast?.nodes.length).toBeGreaterThan(0);
        
        // Should have Frontend as root node
        const frontendNode = astResult.ast?.nodes.find(n => n.name === 'Frontend');
        expect(frontendNode).toBeDefined();
      }
    });

    test('should convert multiple arrow types', () => {
      const arrowDocument = `
A -> B
C => D
E <-> F
G --> H
      `.trim();

      const parseResult = parser.parseToCST(arrowDocument);
      expect(parseResult.success).toBe(true);
      
      if (parseResult.cst) {
        const astResult = converter.convert(parseResult.cst);
        
        expect(astResult.success).toBe(true);
        expect(astResult.ast?.edges).toHaveLength(4);
        
        const arrows = astResult.ast?.edges.map(e => e.arrow);
        expect(arrows).toContain('->');
        expect(arrows).toContain('=>');
        expect(arrows).toContain('<->');
        expect(arrows).toContain('-->');
      }
    });

    test('should convert arrays and complex values', () => {
      const complexDocument = `
@tags: [web, api, microservices]

Service:
  ports: [8080, 8443]
  enabled: true
  replicas: 3
  config:
    timeout: 30
    retries: 5
      `.trim();

      const parseResult = parser.parseToCST(complexDocument);
      expect(parseResult.success).toBe(true);
      
      if (parseResult.cst) {
        const astResult = converter.convert(parseResult.cst);
        
        expect(astResult.success).toBe(true);
        expect(astResult.ast?.directives).toHaveLength(1);
        
        const tagsDirective = astResult.ast?.directives[0];
        expect(tagsDirective.name).toBe('tags');
        expect(tagsDirective.value).toBe('[web, api, microservices]');
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle null CST input', () => {
      const astResult = converter.convert(null);
      
      expect(astResult.success).toBe(false);
      expect(astResult.errors).toHaveLength(1);
      expect(astResult.errors[0].code).toBe('NULL_CST');
    });

    test('should handle invalid CST structure', () => {
      const invalidCST = { name: 'invalid', children: {} };
      const astResult = converter.convert(invalidCST as any);
      
      expect(astResult.success).toBe(false);
      expect(astResult.errors.length).toBeGreaterThan(0);
    });

    test('should collect multiple conversion errors', () => {
      // Create a CST with multiple invalid elements
      const parseResult = parser.parseToCST('Frontend [web'); // Invalid syntax
      
      if (parseResult.cst) {
        const astResult = converter.convert(parseResult.cst);
        
        // Should handle gracefully even with parse errors
        expect(astResult).toBeDefined();
        expect(astResult.success).toBeDefined();
      }
    });

    test('should provide detailed error information', () => {
      const astResult = converter.convert(null);
      
      expect(astResult.errors[0]).toHaveProperty('message');
      expect(astResult.errors[0]).toHaveProperty('code');
      expect(astResult.errors[0]).toHaveProperty('location');
    });
  });

  describe('Validation and Consistency', () => {
    test('should validate anchor references', () => {
      const documentWithInvalidRef = `
Frontend &ui [web]
*nonexistent -> *ui
      `.trim();

      const parseResult = parser.parseToCST(documentWithInvalidRef);
      expect(parseResult.success).toBe(true);
      
      if (parseResult.cst) {
        const astResult = converter.convert(parseResult.cst);
        
        expect(astResult.success).toBe(true);
        // Should still convert but may have warnings
        expect(astResult.ast?.edges).toHaveLength(1);
      }
    });

    test('should validate level specifications', () => {
      const documentWithLevels = `
Frontend [web] @1
Backend [api] @2
Database [storage] @3
      `.trim();

      const parseResult = parser.parseToCST(documentWithLevels);
      expect(parseResult.success).toBe(true);
      
      if (parseResult.cst) {
        const astResult = converter.convert(parseResult.cst);
        
        expect(astResult.success).toBe(true);
        expect(astResult.ast?.nodes).toHaveLength(3);
        
        const levels = astResult.ast?.nodes.map(n => n.level);
        expect(levels).toEqual(['@1', '@2', '@3']);
      }
    });

    test('should handle duplicate node names', () => {
      const documentWithDuplicates = `
Frontend [web]
Frontend [mobile]
      `.trim();

      const parseResult = parser.parseToCST(documentWithDuplicates);
      expect(parseResult.success).toBe(true);
      
      if (parseResult.cst) {
        const astResult = converter.convert(parseResult.cst);
        
        expect(astResult.success).toBe(true);
        // Should handle duplicates gracefully
        expect(astResult.ast?.nodes.length).toBeGreaterThan(0);
      }
    });

    test('should validate directive values', () => {
      const documentWithDirectives = `
@title: "Valid Title"
@version: 1.0
@invalid_directive: 
      `.trim();

      const parseResult = parser.parseToCST(documentWithDirectives);
      expect(parseResult.success).toBe(true);
      
      if (parseResult.cst) {
        const astResult = converter.convert(parseResult.cst);
        
        expect(astResult.success).toBe(true);
        expect(astResult.ast?.directives.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Performance and Metrics', () => {
    test('should collect conversion metrics', () => {
      const parseResult = parser.parseToCST('Frontend -> Backend');
      expect(parseResult.success).toBe(true);
      
      if (parseResult.cst) {
        const astResult = converter.convert(parseResult.cst);
        
        expect(astResult.success).toBe(true);
        expect(astResult.metrics).toBeDefined();
        expect(astResult.metrics.conversionTime).toBeGreaterThanOrEqual(0);
        expect(astResult.metrics.nodeCount).toBeGreaterThanOrEqual(0);
        expect(astResult.metrics.edgeCount).toBeGreaterThanOrEqual(0);
      }
    });

    test('should handle large documents efficiently', () => {
      const largeDocument = Array.from({ length: 100 }, (_, i) => 
        `Service${i} -> Database${i}`
      ).join('\n');
      
      const parseResult = parser.parseToCST(largeDocument);
      expect(parseResult.success).toBe(true);
      
      if (parseResult.cst) {
        const startTime = performance.now();
        const astResult = converter.convert(parseResult.cst);
        const endTime = performance.now();
        
        expect(astResult.success).toBe(true);
        expect(endTime - startTime).toBeLessThan(1000); // Should complete in < 1s
        expect(astResult.ast?.edges).toHaveLength(100);
      }
    });
  });

  describe('AST Structure Validation', () => {
    test('should create valid discriminated union types', () => {
      const parseResult = parser.parseToCST('@title: "Test"\nFrontend -> Backend');
      expect(parseResult.success).toBe(true);
      
      if (parseResult.cst) {
        const astResult = converter.convert(parseResult.cst);
        
        expect(astResult.success).toBe(true);
        expect(astResult.ast).toBeDefined();
        
        // Check directive type discrimination
        const directive = astResult.ast?.directives[0];
        expect(directive?.type).toBe('directive');
        
        // Check edge type discrimination
        const edge = astResult.ast?.edges[0];
        expect(edge?.type).toBe('edge');
      }
    });

    test('should preserve source locations', () => {
      const parseResult = parser.parseToCST('Frontend -> Backend', { enableSourceInfo: true });
      expect(parseResult.success).toBe(true);
      
      if (parseResult.cst) {
        const astResult = converter.convert(parseResult.cst, { preserveLocations: true });
        
        expect(astResult.success).toBe(true);
        
        // Check that location information is preserved
        const edge = astResult.ast?.edges[0];
        expect(edge?.location).toBeDefined();
      }
    });

    test('should handle comments correctly', () => {
      const documentWithComments = `
# This is a comment
@title: "Test" # Inline comment
Frontend -> Backend # Another comment
      `.trim();

      const parseResult = parser.parseToCST(documentWithComments);
      expect(parseResult.success).toBe(true);
      
      if (parseResult.cst) {
        const astResult = converter.convert(parseResult.cst);
        
        expect(astResult.success).toBe(true);
        expect(astResult.ast?.directives).toHaveLength(1);
        expect(astResult.ast?.edges).toHaveLength(1);
      }
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty CST', () => {
      const parseResult = parser.parseToCST('');
      expect(parseResult.success).toBe(true);
      
      if (parseResult.cst) {
        const astResult = converter.convert(parseResult.cst);
        
        expect(astResult.success).toBe(true);
        expect(astResult.ast?.directives).toHaveLength(0);
        expect(astResult.ast?.nodes).toHaveLength(0);
        expect(astResult.ast?.edges).toHaveLength(0);
      }
    });

    test('should handle whitespace-only CST', () => {
      const parseResult = parser.parseToCST('   \n  \n   ');
      expect(parseResult.success).toBe(true);
      
      if (parseResult.cst) {
        const astResult = converter.convert(parseResult.cst);
        
        expect(astResult.success).toBe(true);
        expect(astResult.ast?.directives).toHaveLength(0);
        expect(astResult.ast?.nodes).toHaveLength(0);
        expect(astResult.ast?.edges).toHaveLength(0);
      }
    });

    test('should handle malformed CST gracefully', () => {
      const malformedCST = {
        name: 'document',
        children: {
          invalidChild: [{ name: 'invalid' }]
        }
      };

      const astResult = converter.convert(malformedCST as any);
      
      expect(astResult.success).toBe(false);
      expect(astResult.errors.length).toBeGreaterThan(0);
    });

    test('should handle deeply nested structures', () => {
      const deepNesting = `
Level1:
  Level2:
    Level3:
      Level4:
        Level5:
          DeepNode
      `.trim();

      const parseResult = parser.parseToCST(deepNesting);
      expect(parseResult.success).toBe(true);
      
      if (parseResult.cst) {
        const astResult = converter.convert(parseResult.cst);
        
        expect(astResult.success).toBe(true);
        expect(astResult.ast?.nodes.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Converter Configuration', () => {
    test('should create converter with custom options', () => {
      const customConverter = new CSTToASTConverter({
        preserveLocations: true,
        validateAnchors: true,
        strictMode: true
      });
      
      expect(customConverter).toBeDefined();
    });

    test('should handle strict mode validation', () => {
      const strictConverter = new CSTToASTConverter({ strictMode: true });
      
      const parseResult = parser.parseToCST('Frontend -> Backend');
      expect(parseResult.success).toBe(true);
      
      if (parseResult.cst) {
        const astResult = strictConverter.convert(parseResult.cst);
        
        expect(astResult.success).toBe(true);
        expect(astResult.ast).toBeDefined();
      }
    });

    test('should handle location preservation', () => {
      const locationConverter = new CSTToASTConverter({ preserveLocations: true });
      
      const parseResult = parser.parseToCST('Frontend -> Backend');
      expect(parseResult.success).toBe(true);
      
      if (parseResult.cst) {
        const astResult = locationConverter.convert(parseResult.cst);
        
        expect(astResult.success).toBe(true);
        
        // Check that locations are preserved
        const edge = astResult.ast?.edges[0];
        expect(edge?.location).toBeDefined();
      }
    });
  });
}); 