/**
 * Comprehensive Parser Tests
 * @fileoverview Complete test suite for LFF parser with CST generation and diagnostics
 */

import { LFFParser, LFFLexer } from '../src';
import type { EnhancedParseResult } from '../src/parser';

describe('LFF Parser', () => {
  let parser: LFFParser;
  let lexer: LFFLexer;

  beforeEach(() => {
    parser = new LFFParser();
    lexer = new LFFLexer();
    parser.setLexer(lexer);
  });

  describe('Basic CST Generation', () => {
    test('should parse simple directive', () => {
      const result = parser.parseToCST('@title: "My Architecture"');
      
      expect(result.success).toBe(true);
      expect(result.cst).toBeDefined();
      expect(result.diagnostics).toHaveLength(0);
      expect(result.metrics.tokenCount).toBeGreaterThan(0);
    });

    test('should parse simple node', () => {
      const result = parser.parseToCST('Frontend [web]');
      
      expect(result.success).toBe(true);
      expect(result.cst).toBeDefined();
      expect(result.diagnostics).toHaveLength(0);
    });

    test('should parse simple edge', () => {
      const result = parser.parseToCST('Frontend -> Backend');
      
      expect(result.success).toBe(true);
      expect(result.cst).toBeDefined();
      expect(result.diagnostics).toHaveLength(0);
    });

    test('should parse node with anchor', () => {
      const result = parser.parseToCST('Frontend &ui [web]');
      
      expect(result.success).toBe(true);
      expect(result.cst).toBeDefined();
      expect(result.diagnostics).toHaveLength(0);
    });

    test('should parse node with level specification', () => {
      const result = parser.parseToCST('Frontend [web] @1');
      
      expect(result.success).toBe(true);
      expect(result.cst).toBeDefined();
      expect(result.diagnostics).toHaveLength(0);
    });

    test('should parse edge with anchor reference', () => {
      const result = parser.parseToCST('*ui -> *api');
      
      expect(result.success).toBe(true);
      expect(result.cst).toBeDefined();
      expect(result.diagnostics).toHaveLength(0);
    });
  });

  describe('Complex Document Parsing', () => {
    test('should parse complete LFF document', () => {
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
  auth: jwt

Database &db [storage] @3

*ui -> *api: "REST API"
*api -> *db: "SQL queries"
Frontend <-> Backend: "WebSocket"
      `.trim();

      const result = parser.parseToCST(lffDocument);
      
      expect(result.success).toBe(true);
      expect(result.cst).toBeDefined();
      expect(result.diagnostics).toHaveLength(0);
      expect(result.metrics.tokenCount).toBeGreaterThan(30);
    });

    test('should parse nested node structure', () => {
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

      const result = parser.parseToCST(nestedDocument);
      
      expect(result.success).toBe(true);
      expect(result.cst).toBeDefined();
      expect(result.diagnostics).toHaveLength(0);
    });

    test('should parse multiple arrow types', () => {
      const arrowDocument = `
A -> B
C => D
E <-> F
G --> H
      `.trim();

      const result = parser.parseToCST(arrowDocument);
      
      expect(result.success).toBe(true);
      expect(result.cst).toBeDefined();
      expect(result.diagnostics).toHaveLength(0);
    });

    test('should parse arrays and complex values', () => {
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

      const result = parser.parseToCST(complexDocument);
      
      expect(result.success).toBe(true);
      expect(result.cst).toBeDefined();
      expect(result.diagnostics).toHaveLength(0);
    });
  });

  describe('Error Handling and Diagnostics', () => {
    test('should handle lexer initialization error', () => {
      const parserWithoutLexer = new LFFParser();
      const result = parserWithoutLexer.parseToCST('Frontend -> Backend');
      
      expect(result.success).toBe(false);
      expect(result.diagnostics.length).toBeGreaterThan(0);
      expect(result.diagnostics[0].code).toBe('LEXER_NOT_INITIALIZED');
    });

    test('should handle syntax errors gracefully', () => {
      const invalidSyntax = 'Frontend [web -> Backend'; // Missing closing bracket
      const result = parser.parseToCST(invalidSyntax);
      
      expect(result.success).toBe(false);
      expect(result.diagnostics.length).toBeGreaterThan(0);
      expect(result.diagnostics[0].severity).toBe('error');
    });

    test('should provide detailed error locations', () => {
      const invalidSyntax = 'Frontend\nBackend [invalid\nService';
      const result = parser.parseToCST(invalidSyntax);
      
      expect(result.success).toBe(false);
      expect(result.diagnostics.length).toBeGreaterThan(0);
      
      const error = result.diagnostics[0];
      expect(error.location).toBeDefined();
      expect(error.location.startLine).toBeGreaterThan(0);
      expect(error.location.startColumn).toBeGreaterThan(0);
    });

    test('should handle multiple errors', () => {
      const multipleErrors = `
Frontend [web
Backend [api
Service [
      `.trim();

      const result = parser.parseToCST(multipleErrors);
      
      expect(result.success).toBe(false);
      expect(result.diagnostics.length).toBeGreaterThan(1);
    });

    test('should categorize diagnostic severity', () => {
      const result = parser.parseToCST('Frontend [web');
      
      expect(result.success).toBe(false);
      const errors = result.diagnostics.filter(d => d.severity === 'error');
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('Performance and Caching', () => {
    test('should collect performance metrics', () => {
      const result = parser.parseToCST('Frontend -> Backend');
      
      expect(result.metrics).toBeDefined();
      expect(result.metrics.lexTime).toBeGreaterThanOrEqual(0);
      expect(result.metrics.parseTime).toBeGreaterThanOrEqual(0);
      expect(result.metrics.totalTime).toBeGreaterThanOrEqual(0);
      expect(result.metrics.fromCache).toBe(false);
    });

    test('should cache parse results', () => {
      const content = 'Frontend -> Backend';
      
      // First parse
      const result1 = parser.parseToCST(content);
      expect(result1.success).toBe(true);
      expect(result1.metrics.fromCache).toBe(false);
      
      // Second parse should use cache
      const result2 = parser.parseToCST(content);
      expect(result2.success).toBe(true);
      expect(result2.metrics.fromCache).toBe(true);
    });

    test('should bypass cache when requested', () => {
      const content = 'Frontend -> Backend';
      
      // First parse
      parser.parseToCST(content);
      
      // Second parse with cache bypass
      const result = parser.parseToCST(content, { bypassCache: true });
      expect(result.success).toBe(true);
      expect(result.metrics.fromCache).toBe(false);
    });

    test('should handle large documents efficiently', () => {
      const largeDocument = Array.from({ length: 100 }, (_, i) => 
        `Service${i} -> Database${i}`
      ).join('\n');
      
      const startTime = performance.now();
      const result = parser.parseToCST(largeDocument);
      const endTime = performance.now();
      
      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in < 1s
    });

    test('should provide cache statistics', () => {
      parser.parseToCST('Frontend -> Backend');
      parser.parseToCST('Service -> Database');
      
      const stats = parser.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);
      expect(stats.maxSize).toBeGreaterThan(0);
    });

    test('should clear cache', () => {
      parser.parseToCST('Frontend -> Backend');
      
      let stats = parser.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);
      
      parser.clearCache();
      stats = parser.getCacheStats();
      expect(stats.size).toBe(0);
    });
  });

  describe('Source Information', () => {
    test('should include source info when requested', () => {
      const content = 'Frontend -> Backend';
      const result = parser.parseToCST(content, { 
        enableSourceInfo: true,
        filePath: 'test.lff'
      });
      
      expect(result.success).toBe(true);
      expect(result.sourceInfo).toBeDefined();
      expect(result.sourceInfo?.content).toBe(content);
      expect(result.sourceInfo?.lines).toEqual([content]);
      expect(result.sourceInfo?.filePath).toBe('test.lff');
    });

    test('should exclude source info by default', () => {
      const result = parser.parseToCST('Frontend -> Backend');
      
      expect(result.success).toBe(true);
      expect(result.sourceInfo).toBeUndefined();
    });

    test('should track line information correctly', () => {
      const multilineContent = 'Frontend\nBackend\nDatabase';
      const result = parser.parseToCST(multilineContent, { enableSourceInfo: true });
      
      expect(result.success).toBe(true);
      expect(result.sourceInfo?.lines).toHaveLength(3);
      expect(result.sourceInfo?.lines).toEqual(['Frontend', 'Backend', 'Database']);
    });
  });

  describe('Plugin System', () => {
    test('should register grammar extensions', () => {
      const extension = {
        id: 'test-extension',
        name: 'Test Extension',
        rules: [{
          name: 'testRule',
          implementation: () => {},
          priority: 1
        }]
      };
      
      expect(() => parser.registerGrammarExtension(extension)).not.toThrow();
    });

    test('should prevent duplicate extension registration', () => {
      const extension = {
        id: 'test-extension',
        name: 'Test Extension',
        rules: [{
          name: 'testRule',
          implementation: () => {}
        }]
      };
      
      parser.registerGrammarExtension(extension);
      expect(() => parser.registerGrammarExtension(extension)).toThrow();
    });

    test('should unregister extensions', () => {
      const extension = {
        id: 'test-extension',
        name: 'Test Extension',
        rules: [{
          name: 'testRule',
          implementation: () => {}
        }]
      };
      
      parser.registerGrammarExtension(extension);
      const removed = parser.unregisterGrammarExtension('test-extension');
      expect(removed).toBe(true);
      
      const removedAgain = parser.unregisterGrammarExtension('test-extension');
      expect(removedAgain).toBe(false);
    });

    test('should list registered extensions', () => {
      const extension = {
        id: 'test-extension',
        name: 'Test Extension',
        rules: [{
          name: 'testRule',
          implementation: () => {}
        }]
      };
      
      parser.registerGrammarExtension(extension);
      const extensions = parser.getRegisteredExtensions();
      
      expect(extensions).toHaveLength(1);
      expect(extensions[0].id).toBe('test-extension');
    });
  });

  describe('CST Utility Methods', () => {
    test('should extract CST children safely', () => {
      const result = parser.parseToCST('Frontend -> Backend');
      expect(result.success).toBe(true);
      
      if (result.cst) {
        const children = LFFParser.getChildren(result.cst, 'document');
        expect(Array.isArray(children)).toBe(true);
      }
    });

    test('should extract first child safely', () => {
      const result = parser.parseToCST('Frontend -> Backend');
      expect(result.success).toBe(true);
      
      if (result.cst) {
        const firstChild = LFFParser.getFirstChild(result.cst, 'document');
        expect(firstChild).toBeDefined();
      }
    });

    test('should extract token values safely', () => {
      const mockToken = { image: 'Frontend' };
      const value = LFFParser.getTokenValue(mockToken as any);
      expect(value).toBe('Frontend');
      
      const emptyValue = LFFParser.getTokenValue({} as any);
      expect(emptyValue).toBe('');
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty input', () => {
      const result = parser.parseToCST('');
      
      expect(result.success).toBe(true);
      expect(result.cst).toBeDefined();
      expect(result.diagnostics).toHaveLength(0);
    });

    test('should handle whitespace-only input', () => {
      const result = parser.parseToCST('   \n  \n   ');
      
      expect(result.success).toBe(true);
      expect(result.cst).toBeDefined();
    });

    test('should handle comments-only input', () => {
      const result = parser.parseToCST('# Comment 1\n# Comment 2');
      
      expect(result.success).toBe(true);
      expect(result.cst).toBeDefined();
      expect(result.diagnostics).toHaveLength(0);
    });

    test('should handle mixed content with comments', () => {
      const mixedContent = `
# Architecture definition
@title: "My App"

# Frontend layer
Frontend [web] # React app
# Backend layer  
Backend [api]  # Node.js API

# Connections
Frontend -> Backend # HTTP calls
      `.trim();

      const result = parser.parseToCST(mixedContent);
      
      expect(result.success).toBe(true);
      expect(result.cst).toBeDefined();
      expect(result.diagnostics).toHaveLength(0);
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

      const result = parser.parseToCST(deepNesting);
      
      expect(result.success).toBe(true);
      expect(result.cst).toBeDefined();
      expect(result.diagnostics).toHaveLength(0);
    });

    test('should handle special characters in strings', () => {
      const specialChars = `
@title: "App with émojis 🚀 and symbols ©®™"
Service: "Contains: colons, [brackets], and @symbols"
      `.trim();

      const result = parser.parseToCST(specialChars);
      
      expect(result.success).toBe(true);
      expect(result.cst).toBeDefined();
      expect(result.diagnostics).toHaveLength(0);
    });
  });

  describe('Parser Configuration', () => {
    test('should create parser with custom options', () => {
      const customParser = new LFFParser({
        enableCaching: false,
        cacheSize: 50,
        cacheMaxAge: 60000
      });
      
      expect(customParser).toBeDefined();
      expect(customParser.getCacheStats().maxSize).toBe(50);
    });

    test('should handle parser without caching', () => {
      const noCacheParser = new LFFParser({ enableCaching: false });
      noCacheParser.setLexer(new LFFLexer());
      
      const content = 'Frontend -> Backend';
      const result1 = noCacheParser.parseToCST(content);
      const result2 = noCacheParser.parseToCST(content);
      
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.metrics.fromCache).toBe(false);
      expect(result2.metrics.fromCache).toBe(false);
    });
  });
}); 