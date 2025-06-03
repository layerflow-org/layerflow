/**
 * Comprehensive AST Converter Tests
 * @fileoverview Complete test suite for LFF AST to Core AST conversion with validation
 */

import { ASTConverter } from '../src/ast-converter';
import { CSTToASTConverter } from '../src/cst-to-ast';
import { LFFParser, LFFLexer } from '../src';
import type { LFFQ, ConversionOptions } from '../src/types';

describe('AST Converter', () => {
  let converter: ASTConverter;
  let cstConverter: CSTToASTConverter;
  let parser: LFFParser;
  let lexer: LFFLexer;

  beforeEach(() => {
    converter = new ASTConverter();
    cstConverter = new CSTToASTConverter();
    parser = new LFFParser();
    lexer = new LFFLexer();
    parser.setLexer(lexer);
  });

  describe('Basic Conversion', () => {
    test('should convert simple LFF AST to Core AST', async () => {
      const lffDocument = `
@title: "Test Architecture"
Frontend [web] -> Backend [api]
      `.trim();

      const parseResult = parser.parseToCST(lffDocument);
      expect(parseResult.success).toBe(true);
      
      if (parseResult.cst) {
        const astResult = cstConverter.convert(parseResult.cst);
        expect(astResult.success).toBe(true);
        
        if (astResult.ast) {
          const coreResult = await converter.convert(astResult.ast);
          
          expect(coreResult.success).toBe(true);
          expect(coreResult.errors).toHaveLength(0);
          expect(coreResult.graph).toBeDefined();
          expect(coreResult.graph?.nodes).toHaveLength(2);
          expect(coreResult.graph?.edges).toHaveLength(1);
        }
      }
    });

    test('should convert nodes with properties', async () => {
      const lffDocument = `
Frontend [web]:
  framework: react
  version: "18.0"
  enabled: true
      `.trim();

      const parseResult = parser.parseToCST(lffDocument);
      expect(parseResult.success).toBe(true);
      
      if (parseResult.cst) {
        const astResult = cstConverter.convert(parseResult.cst);
        expect(astResult.success).toBe(true);
        
        if (astResult.ast) {
          const coreResult = await converter.convert(astResult.ast);
          
          expect(coreResult.success).toBe(true);
          expect(coreResult.graph?.nodes).toHaveLength(1);
          
          const node = coreResult.graph?.nodes[0];
          expect(node?.properties).toBeDefined();
          expect(node?.properties?.framework).toBe('react');
          expect(node?.properties?.version).toBe('"18.0"');
          expect(node?.properties?.enabled).toBe(true);
        }
      }
    });

    test('should convert edges with labels', async () => {
      const lffDocument = `
Frontend -> Backend: "HTTP API"
Service => Database: "SQL queries"
      `.trim();

      const parseResult = parser.parseToCST(lffDocument);
      expect(parseResult.success).toBe(true);
      
      if (parseResult.cst) {
        const astResult = cstConverter.convert(parseResult.cst);
        expect(astResult.success).toBe(true);
        
        if (astResult.ast) {
          const coreResult = await converter.convert(astResult.ast);
          
          expect(coreResult.success).toBe(true);
          expect(coreResult.graph?.edges).toHaveLength(2);
          
          const httpEdge = coreResult.graph?.edges.find(e => e.label === '"HTTP API"');
          expect(httpEdge).toBeDefined();
          expect(httpEdge?.type).toBe('simple');
          
          const sqlEdge = coreResult.graph?.edges.find(e => e.label === '"SQL queries"');
          expect(sqlEdge).toBeDefined();
          expect(sqlEdge?.type).toBe('multiple');
        }
      }
    });

    test('should convert anchors correctly', async () => {
      const lffDocument = `
Frontend &ui [web]
Backend &api [service]
*ui -> *api
      `.trim();

      const parseResult = parser.parseToCST(lffDocument);
      expect(parseResult.success).toBe(true);
      
      if (parseResult.cst) {
        const astResult = cstConverter.convert(parseResult.cst);
        expect(astResult.success).toBe(true);
        
        if (astResult.ast) {
          const coreResult = await converter.convert(astResult.ast);
          
          expect(coreResult.success).toBe(true);
          expect(coreResult.graph?.nodes).toHaveLength(2);
          expect(coreResult.graph?.edges).toHaveLength(1);
          
          const edge = coreResult.graph?.edges[0];
          expect(edge?.from).toBe('ui'); // Should resolve anchor reference
          expect(edge?.to).toBe('api');
        }
      }
    });

    test('should handle level specifications', async () => {
      const lffDocument = `
Frontend [web] @1
Backend [api] @2
Database [storage] @3
      `.trim();

      const parseResult = parser.parseToCST(lffDocument);
      expect(parseResult.success).toBe(true);
      
      if (parseResult.cst) {
        const astResult = cstConverter.convert(parseResult.cst);
        expect(astResult.success).toBe(true);
        
        if (astResult.ast) {
          const coreResult = await converter.convert(astResult.ast);
          
          expect(coreResult.success).toBe(true);
          expect(coreResult.graph?.nodes).toHaveLength(3);
          
          const nodes = coreResult.graph?.nodes || [];
          const levels = nodes.map(n => n.level);
          expect(levels).toContain(1);
          expect(levels).toContain(2);
          expect(levels).toContain(3);
        }
      }
    });
  });

  describe('Complex Document Conversion', () => {
    test('should convert complete architecture', async () => {
      const lffDocument = `
@title: "E-commerce Platform"
@version: 2.0
@domain: web

Frontend &ui [web, react] @1:
  framework: react
  version: "18.0"
  components: ["Header", "ProductList", "Cart"]

Backend &api [service, nodejs] @2:
  runtime: nodejs
  database: postgresql
  cache: redis

Database &db [storage, postgresql] @3:
  engine: postgresql
  version: "14.0"

Cache &cache [storage, redis] @3:
  engine: redis
  version: "7.0"

*ui -> *api: "REST API calls"
*api -> *db: "SQL queries"
*api -> *cache: "Cache operations"
*ui <-> *api: "WebSocket connection"
      `.trim();

      const parseResult = parser.parseToCST(lffDocument);
      expect(parseResult.success).toBe(true);
      
      if (parseResult.cst) {
        const astResult = cstConverter.convert(parseResult.cst);
        expect(astResult.success).toBe(true);
        
        if (astResult.ast) {
          const coreResult = await converter.convert(astResult.ast);
          
          expect(coreResult.success).toBe(true);
          expect(coreResult.graph).toBeDefined();
          
          // Check metadata
          expect(coreResult.graph?.metadata?.title).toBe('"E-commerce Platform"');
          expect(coreResult.graph?.metadata?.version).toBe('2.0');
          expect(coreResult.graph?.metadata?.domain).toBe('web');
          
          // Check nodes
          expect(coreResult.graph?.nodes).toHaveLength(4);
          
          // Check edges
          expect(coreResult.graph?.edges).toHaveLength(4);
          
          // Verify anchor resolution
          const restEdge = coreResult.graph?.edges.find(e => e.label === '"REST API calls"');
          expect(restEdge?.from).toBe('ui');
          expect(restEdge?.to).toBe('api');
        }
      }
    });

    test('should handle nested node structures', async () => {
      const lffDocument = `
Application:
  Frontend:
    Components:
      Header
      Navigation
      Footer
    Services:
      AuthService
      ApiService
  Backend:
    Controllers:
      UserController
      ProductController
    Services:
      DatabaseService
      CacheService
      `.trim();

      const parseResult = parser.parseToCST(lffDocument);
      expect(parseResult.success).toBe(true);
      
      if (parseResult.cst) {
        const astResult = cstConverter.convert(parseResult.cst);
        expect(astResult.success).toBe(true);
        
        if (astResult.ast) {
          const coreResult = await converter.convert(astResult.ast);
          
          expect(coreResult.success).toBe(true);
          expect(coreResult.graph?.nodes.length).toBeGreaterThan(0);
          
          // Should have hierarchical structure
          const appNode = coreResult.graph?.nodes.find(n => n.name === 'Application');
          expect(appNode).toBeDefined();
        }
      }
    });
  });

  describe('Error Handling and Validation', () => {
    test('should handle null LFF AST input', async () => {
      const coreResult = await converter.convert(null as any);
      
      expect(coreResult.success).toBe(false);
      expect(coreResult.errors).toHaveLength(1);
      expect(coreResult.errors[0].code).toBe('NULL_AST');
    });

    test('should validate anchor references', async () => {
      const lffDocument = `
Frontend &ui [web]
*nonexistent -> *ui
*ui -> *missing
      `.trim();

      const parseResult = parser.parseToCST(lffDocument);
      expect(parseResult.success).toBe(true);
      
      if (parseResult.cst) {
        const astResult = cstConverter.convert(parseResult.cst);
        expect(astResult.success).toBe(true);
        
        if (astResult.ast) {
          const coreResult = await converter.convert(astResult.ast, { 
            validateAnchors: true 
          });
          
          expect(coreResult.success).toBe(false);
          expect(coreResult.errors.length).toBeGreaterThan(0);
          
          const anchorErrors = coreResult.errors.filter(e => 
            e.code === 'UNDEFINED_ANCHOR_REFERENCE'
          );
          expect(anchorErrors.length).toBeGreaterThan(0);
        }
      }
    });

    test('should handle duplicate node IDs', async () => {
      const lffDocument = `
Frontend [web]
Frontend [mobile]
      `.trim();

      const parseResult = parser.parseToCST(lffDocument);
      expect(parseResult.success).toBe(true);
      
      if (parseResult.cst) {
        const astResult = cstConverter.convert(parseResult.cst);
        expect(astResult.success).toBe(true);
        
        if (astResult.ast) {
          const coreResult = await converter.convert(astResult.ast);
          
          expect(coreResult.success).toBe(true);
          // Should handle duplicates by generating unique IDs
          expect(coreResult.graph?.nodes).toHaveLength(2);
          
          const nodeIds = coreResult.graph?.nodes.map(n => n.id) || [];
          const uniqueIds = new Set(nodeIds);
          expect(uniqueIds.size).toBe(nodeIds.length);
        }
      }
    });

    test('should validate level specifications', async () => {
      const lffDocument = `
Frontend [web] @invalid
Backend [api] @-1
      `.trim();

      const parseResult = parser.parseToCST(lffDocument);
      
      if (parseResult.cst) {
        const astResult = cstConverter.convert(parseResult.cst);
        
        if (astResult.ast) {
          const coreResult = await converter.convert(astResult.ast, { 
            validateLevels: true 
          });
          
          // Should handle invalid levels gracefully
          expect(coreResult.success).toBe(true);
          expect(coreResult.graph?.nodes).toHaveLength(2);
        }
      }
    });

    test('should collect multiple validation errors', async () => {
      const lffDocument = `
Frontend &ui [web]
Backend &ui [api]  # Duplicate anchor
*missing -> *ui    # Missing anchor
*ui -> *nonexistent # Missing anchor
      `.trim();

      const parseResult = parser.parseToCST(lffDocument);
      expect(parseResult.success).toBe(true);
      
      if (parseResult.cst) {
        const astResult = cstConverter.convert(parseResult.cst);
        expect(astResult.success).toBe(true);
        
        if (astResult.ast) {
          const coreResult = await converter.convert(astResult.ast, { 
            validateAnchors: true,
            strictMode: true
          });
          
          expect(coreResult.errors.length).toBeGreaterThan(1);
        }
      }
    });
  });

  describe('Performance and Metrics', () => {
    test('should collect conversion metrics', async () => {
      const lffDocument = `
Frontend -> Backend
Service -> Database
      `.trim();

      const parseResult = parser.parseToCST(lffDocument);
      expect(parseResult.success).toBe(true);
      
      if (parseResult.cst) {
        const astResult = cstConverter.convert(parseResult.cst);
        expect(astResult.success).toBe(true);
        
        if (astResult.ast) {
          const coreResult = await converter.convert(astResult.ast);
          
          expect(coreResult.success).toBe(true);
          expect(coreResult.metrics).toBeDefined();
          expect(coreResult.metrics.conversionTime).toBeGreaterThanOrEqual(0);
          expect(coreResult.metrics.nodeCount).toBeGreaterThanOrEqual(0);
          expect(coreResult.metrics.edgeCount).toBeGreaterThanOrEqual(0);
          expect(coreResult.metrics.validationTime).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test('should handle large documents efficiently', async () => {
      const largeDocument = Array.from({ length: 100 }, (_, i) => 
        `Service${i} -> Database${i}`
      ).join('\n');
      
      const parseResult = parser.parseToCST(largeDocument);
      expect(parseResult.success).toBe(true);
      
      if (parseResult.cst) {
        const astResult = cstConverter.convert(parseResult.cst);
        expect(astResult.success).toBe(true);
        
        if (astResult.ast) {
          const startTime = performance.now();
          const coreResult = await converter.convert(astResult.ast);
          const endTime = performance.now();
          
          expect(coreResult.success).toBe(true);
          expect(endTime - startTime).toBeLessThan(2000); // Should complete in < 2s
          expect(coreResult.graph?.nodes).toHaveLength(200); // 100 services + 100 databases
          expect(coreResult.graph?.edges).toHaveLength(100);
        }
      }
    });

    test('should provide detailed performance breakdown', async () => {
      const lffDocument = `
Frontend [web] -> Backend [api] -> Database [storage]
      `.trim();

      const parseResult = parser.parseToCST(lffDocument);
      expect(parseResult.success).toBe(true);
      
      if (parseResult.cst) {
        const astResult = cstConverter.convert(parseResult.cst);
        expect(astResult.success).toBe(true);
        
        if (astResult.ast) {
          const coreResult = await converter.convert(astResult.ast, { 
            collectDetailedMetrics: true 
          });
          
          expect(coreResult.success).toBe(true);
          expect(coreResult.metrics.phases).toBeDefined();
          expect(coreResult.metrics.phases?.nodeConversion).toBeGreaterThanOrEqual(0);
          expect(coreResult.metrics.phases?.edgeConversion).toBeGreaterThanOrEqual(0);
          expect(coreResult.metrics.phases?.validation).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  describe('Conversion Options', () => {
    test('should respect conversion options', async () => {
      const lffDocument = `
Frontend &ui [web] -> Backend &api [service]
      `.trim();

      const parseResult = parser.parseToCST(lffDocument);
      expect(parseResult.success).toBe(true);
      
      if (parseResult.cst) {
        const astResult = cstConverter.convert(parseResult.cst);
        expect(astResult.success).toBe(true);
        
        if (astResult.ast) {
          const options: ConversionOptions = {
            generateIds: true,
            validateAnchors: true,
            preserveSourceLocations: true,
            strictMode: false
          };
          
          const coreResult = await converter.convert(astResult.ast, options);
          
          expect(coreResult.success).toBe(true);
          expect(coreResult.graph?.nodes.every(n => n.id)).toBe(true);
        }
      }
    });

    test('should handle strict mode', async () => {
      const lffDocument = `
Frontend [web]
*missing -> Frontend
      `.trim();

      const parseResult = parser.parseToCST(lffDocument);
      expect(parseResult.success).toBe(true);
      
      if (parseResult.cst) {
        const astResult = cstConverter.convert(parseResult.cst);
        expect(astResult.success).toBe(true);
        
        if (astResult.ast) {
          const strictResult = await converter.convert(astResult.ast, { 
            strictMode: true,
            validateAnchors: true
          });
          
          expect(strictResult.success).toBe(false);
          expect(strictResult.errors.length).toBeGreaterThan(0);
        }
      }
    });

    test('should preserve source locations when requested', async () => {
      const lffDocument = `Frontend -> Backend`;

      const parseResult = parser.parseToCST(lffDocument, { enableSourceInfo: true });
      expect(parseResult.success).toBe(true);
      
      if (parseResult.cst) {
        const astResult = cstConverter.convert(parseResult.cst, { preserveLocations: true });
        expect(astResult.success).toBe(true);
        
        if (astResult.ast) {
          const coreResult = await converter.convert(astResult.ast, { 
            preserveSourceLocations: true 
          });
          
          expect(coreResult.success).toBe(true);
          
          const edge = coreResult.graph?.edges[0];
          expect(edge?.sourceLocation).toBeDefined();
        }
      }
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty LFF AST', async () => {
      const emptyAST: LFFQ = {
        type: 'document',
        directives: [],
        nodes: [],
        edges: []
      };

      const coreResult = await converter.convert(emptyAST);
      
      expect(coreResult.success).toBe(true);
      expect(coreResult.graph?.nodes).toHaveLength(0);
      expect(coreResult.graph?.edges).toHaveLength(0);
      expect(coreResult.graph?.metadata).toBeDefined();
    });

    test('should handle AST with only directives', async () => {
      const lffDocument = `
@title: "Test"
@version: 1.0
@domain: web
      `.trim();

      const parseResult = parser.parseToCST(lffDocument);
      expect(parseResult.success).toBe(true);
      
      if (parseResult.cst) {
        const astResult = cstConverter.convert(parseResult.cst);
        expect(astResult.success).toBe(true);
        
        if (astResult.ast) {
          const coreResult = await converter.convert(astResult.ast);
          
          expect(coreResult.success).toBe(true);
          expect(coreResult.graph?.nodes).toHaveLength(0);
          expect(coreResult.graph?.edges).toHaveLength(0);
          expect(coreResult.graph?.metadata?.title).toBe('"Test"');
        }
      }
    });

    test('should handle malformed LFF AST gracefully', async () => {
      const malformedAST = {
        type: 'document',
        directives: [{ type: 'invalid' }],
        nodes: [{ type: 'node', name: null }],
        edges: []
      };

      const coreResult = await converter.convert(malformedAST as any);
      
      expect(coreResult.success).toBe(false);
      expect(coreResult.errors.length).toBeGreaterThan(0);
    });

    test('should handle circular references', async () => {
      const lffDocument = `
A -> B
B -> C
C -> A
      `.trim();

      const parseResult = parser.parseToCST(lffDocument);
      expect(parseResult.success).toBe(true);
      
      if (parseResult.cst) {
        const astResult = cstConverter.convert(parseResult.cst);
        expect(astResult.success).toBe(true);
        
        if (astResult.ast) {
          const coreResult = await converter.convert(astResult.ast);
          
          expect(coreResult.success).toBe(true);
          expect(coreResult.graph?.edges).toHaveLength(3);
          
          // Should detect circular reference
          expect(coreResult.warnings?.some(w => 
            w.code === 'CIRCULAR_REFERENCE'
          )).toBe(true);
        }
      }
    });
  });

  describe('Converter Configuration', () => {
    test('should create converter with custom options', () => {
      const customConverter = new ASTConverter({
        generateIds: true,
        validateAnchors: true,
        strictMode: false,
        preserveSourceLocations: true
      });
      
      expect(customConverter).toBeDefined();
    });

    test('should handle debug mode', async () => {
      const debugConverter = new ASTConverter({ debugMode: true });
      
      const lffDocument = `Frontend -> Backend`;
      const parseResult = parser.parseToCST(lffDocument);
      expect(parseResult.success).toBe(true);
      
      if (parseResult.cst) {
        const astResult = cstConverter.convert(parseResult.cst);
        expect(astResult.success).toBe(true);
        
        if (astResult.ast) {
          const coreResult = await debugConverter.convert(astResult.ast);
          
          expect(coreResult.success).toBe(true);
          expect(coreResult.debugInfo).toBeDefined();
        }
      }
    });
  });
}); 