/**
 * Comprehensive LFF Serializer Tests
 * @fileoverview Complete test suite for LFF serializer with formatting options and validation
 */

import { LFFSerializer, SerializationOptions, FormattingPresets } from '../src/lff-serializer';
import type { GraphAST } from '@layerflow/core';

describe('LFF Serializer', () => {
  let serializer: LFFSerializer;

  beforeEach(() => {
    serializer = new LFFSerializer();
  });

  describe('Basic Serialization', () => {
    test('should serialize simple graph', () => {
      const graph: GraphAST = {
        metadata: {
          title: 'Test Architecture',
          version: '1.0'
        },
        nodes: [
          {
            id: 'frontend',
            name: 'Frontend',
            type: 'web',
            level: 1
          },
          {
            id: 'backend',
            name: 'Backend',
            type: 'api',
            level: 2
          }
        ],
        edges: [
          {
            id: 'edge1',
            from: 'frontend',
            to: 'backend',
            type: 'simple',
            label: 'HTTP API'
          }
        ]
      };

      const result = serializer.serialize(graph);
      
      expect(result).toContain('@title: Test Architecture');
      expect(result).toContain('@version: 1.0');
      expect(result).toContain('Frontend [web] @1');
      expect(result).toContain('Backend [api] @2');
      expect(result).toContain('Frontend -> Backend: HTTP API');
    });

    test('should serialize nodes with properties', () => {
      const graph: GraphAST = {
        metadata: {},
        nodes: [
          {
            id: 'frontend',
            name: 'Frontend',
            type: 'web',
            properties: {
              framework: 'react',
              version: '18.0',
              enabled: true,
              ports: [3000, 3001]
            }
          }
        ],
        edges: []
      };

      const result = serializer.serialize(graph);
      
      expect(result).toContain('Frontend [web]:');
      expect(result).toContain('framework: react');
      expect(result).toContain('version: 18.0');
      expect(result).toContain('enabled: true');
      expect(result).toContain('ports: [3000, 3001]');
    });

    test('should serialize different edge types', () => {
      const graph: GraphAST = {
        metadata: {},
        nodes: [
          { id: 'a', name: 'A', type: 'service' },
          { id: 'b', name: 'B', type: 'service' },
          { id: 'c', name: 'C', type: 'service' },
          { id: 'd', name: 'D', type: 'service' }
        ],
        edges: [
          { id: 'e1', from: 'a', to: 'b', type: 'simple' },
          { id: 'e2', from: 'b', to: 'c', type: 'multiple' },
          { id: 'e3', from: 'c', to: 'd', type: 'bidirectional' },
          { id: 'e4', from: 'd', to: 'a', type: 'dashed' }
        ]
      };

      const result = serializer.serialize(graph);
      
      expect(result).toContain('A -> B');
      expect(result).toContain('B => C');
      expect(result).toContain('C <-> D');
      expect(result).toContain('D --> A');
    });

    test('should serialize anchors', () => {
      const graph: GraphAST = {
        metadata: {},
        nodes: [
          {
            id: 'frontend',
            name: 'Frontend',
            type: 'web',
            anchor: 'ui'
          },
          {
            id: 'backend',
            name: 'Backend',
            type: 'api',
            anchor: 'api'
          }
        ],
        edges: [
          {
            id: 'edge1',
            from: 'ui',
            to: 'api',
            type: 'simple'
          }
        ]
      };

      const result = serializer.serialize(graph);
      
      expect(result).toContain('Frontend &ui [web]');
      expect(result).toContain('Backend &api [api]');
      expect(result).toContain('*ui -> *api');
    });
  });

  describe('Formatting Options', () => {
    test('should apply compact formatting', () => {
      const graph: GraphAST = {
        metadata: { title: 'Test' },
        nodes: [
          { id: 'a', name: 'A', type: 'service' },
          { id: 'b', name: 'B', type: 'service' }
        ],
        edges: [
          { id: 'e1', from: 'a', to: 'b', type: 'simple' }
        ]
      };

      const compactSerializer = new LFFSerializer(FormattingPresets.COMPACT);
      const result = compactSerializer.serialize(graph);
      
      // Compact format should have minimal spacing
      expect(result.split('\n').length).toBeLessThan(10);
      expect(result).not.toContain('\n\n'); // No double newlines
    });

    test('should apply pretty formatting', () => {
      const graph: GraphAST = {
        metadata: { title: 'Test' },
        nodes: [
          { 
            id: 'a', 
            name: 'A', 
            type: 'service',
            properties: { framework: 'react' }
          }
        ],
        edges: []
      };

      const prettySerializer = new LFFSerializer(FormattingPresets.PRETTY);
      const result = prettySerializer.serialize(graph);
      
      // Pretty format should have nice spacing
      expect(result).toContain('\n\n'); // Section separators
      expect(result.split('\n').length).toBeGreaterThan(5);
    });

    test('should apply strict formatting', () => {
      const graph: GraphAST = {
        metadata: { title: 'Test' },
        nodes: [
          { id: 'a', name: 'A', type: 'service' }
        ],
        edges: []
      };

      const strictSerializer = new LFFSerializer(FormattingPresets.STRICT);
      const result = strictSerializer.serialize(graph);
      
      // Strict format should use double quotes consistently
      expect(result).toContain('"Test"');
      expect(result).not.toContain("'"); // No single quotes
    });

    test('should apply minimal formatting', () => {
      const graph: GraphAST = {
        metadata: { title: 'Test' },
        nodes: [
          { id: 'a', name: 'A', type: 'service' }
        ],
        edges: []
      };

      const minimalSerializer = new LFFSerializer(FormattingPresets.MINIMAL);
      const result = minimalSerializer.serialize(graph);
      
      // Minimal format should be very concise
      expect(result.length).toBeLessThan(50);
      expect(result.split('\n').length).toBeLessThan(5);
    });

    test('should handle custom indentation', () => {
      const graph: GraphAST = {
        metadata: {},
        nodes: [
          {
            id: 'a',
            name: 'A',
            type: 'service',
            properties: { framework: 'react' }
          }
        ],
        edges: []
      };

      const customOptions: SerializationOptions = {
        indentation: {
          type: 'tabs',
          size: 1
        }
      };

      const customSerializer = new LFFSerializer(customOptions);
      const result = customSerializer.serialize(graph);
      
      expect(result).toContain('\t'); // Should use tabs
    });

    test('should handle custom spacing', () => {
      const graph: GraphAST = {
        metadata: { title: 'Test' },
        nodes: [
          { id: 'a', name: 'A', type: 'service' },
          { id: 'b', name: 'B', type: 'service' }
        ],
        edges: []
      };

      const customOptions: SerializationOptions = {
        spacing: {
          betweenSections: 3,
          betweenNodes: 2
        }
      };

      const customSerializer = new LFFSerializer(customOptions);
      const result = customSerializer.serialize(graph);
      
      // Should have custom spacing
      const lines = result.split('\n');
      expect(lines.filter(line => line === '').length).toBeGreaterThan(3);
    });

    test('should handle quote style preferences', () => {
      const graph: GraphAST = {
        metadata: { title: 'Test Title' },
        nodes: [],
        edges: []
      };

      const singleQuoteOptions: SerializationOptions = {
        formatting: {
          quoteStyle: 'single'
        }
      };

      const singleQuoteSerializer = new LFFSerializer(singleQuoteOptions);
      const result = singleQuoteSerializer.serialize(graph);
      
      expect(result).toContain("'Test Title'");
      expect(result).not.toContain('"Test Title"');
    });

    test('should handle adaptive quotes', () => {
      const graph: GraphAST = {
        metadata: { 
          title: "Title with 'single quotes'",
          description: 'Description with "double quotes"'
        },
        nodes: [],
        edges: []
      };

      const adaptiveOptions: SerializationOptions = {
        formatting: {
          quoteStyle: 'adaptive'
        }
      };

      const adaptiveSerializer = new LFFSerializer(adaptiveOptions);
      const result = adaptiveSerializer.serialize(graph);
      
      // Should choose appropriate quotes to avoid escaping
      expect(result).toContain('"Title with \'single quotes\'"');
      expect(result).toContain("'Description with \"double quotes\"'");
    });
  });

  describe('Array and Object Formatting', () => {
    test('should format arrays inline when short', () => {
      const graph: GraphAST = {
        metadata: {},
        nodes: [
          {
            id: 'a',
            name: 'A',
            type: 'service',
            properties: {
              ports: [80, 443]
            }
          }
        ],
        edges: []
      };

      const result = serializer.serialize(graph);
      
      expect(result).toContain('ports: [80, 443]');
    });

    test('should format arrays multiline when long', () => {
      const graph: GraphAST = {
        metadata: {},
        nodes: [
          {
            id: 'a',
            name: 'A',
            type: 'service',
            properties: {
              ports: [8000, 8001, 8002, 8003, 8004, 8005, 8006, 8007, 8008, 8009]
            }
          }
        ],
        edges: []
      };

      const options: SerializationOptions = {
        formatting: {
          wrapArrays: true,
          maxLineLength: 50
        }
      };

      const customSerializer = new LFFSerializer(options);
      const result = customSerializer.serialize(graph);
      
      // Should wrap long arrays
      expect(result).toContain('ports: [');
      expect(result).toContain('  8000,');
    });

    test('should format nested objects', () => {
      const graph: GraphAST = {
        metadata: {},
        nodes: [
          {
            id: 'a',
            name: 'A',
            type: 'service',
            properties: {
              config: {
                database: {
                  host: 'localhost',
                  port: 5432
                },
                cache: {
                  host: 'redis',
                  port: 6379
                }
              }
            }
          }
        ],
        edges: []
      };

      const result = serializer.serialize(graph);
      
      expect(result).toContain('config:');
      expect(result).toContain('  database:');
      expect(result).toContain('    host: localhost');
      expect(result).toContain('  cache:');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle empty graph', () => {
      const emptyGraph: GraphAST = {
        metadata: {},
        nodes: [],
        edges: []
      };

      const result = serializer.serialize(emptyGraph);
      
      expect(result).toBe('');
    });

    test('should handle graph with only metadata', () => {
      const metadataOnlyGraph: GraphAST = {
        metadata: {
          title: 'Test',
          version: '1.0'
        },
        nodes: [],
        edges: []
      };

      const result = serializer.serialize(metadataOnlyGraph);
      
      expect(result).toContain('@title: Test');
      expect(result).toContain('@version: 1.0');
      expect(result.split('\n').length).toBe(2);
    });

    test('should handle null/undefined values', () => {
      const graphWithNulls: GraphAST = {
        metadata: {
          title: 'Test',
          description: null as any
        },
        nodes: [
          {
            id: 'a',
            name: 'A',
            type: 'service',
            properties: {
              value: null,
              undefined: undefined
            }
          }
        ],
        edges: []
      };

      const result = serializer.serialize(graphWithNulls);
      
      expect(result).toContain('@title: Test');
      expect(result).not.toContain('description:');
      expect(result).not.toContain('value:');
      expect(result).not.toContain('undefined:');
    });

    test('should handle special characters in names', () => {
      const graph: GraphAST = {
        metadata: {},
        nodes: [
          {
            id: 'special',
            name: 'Service with spaces & symbols',
            type: 'service'
          }
        ],
        edges: []
      };

      const result = serializer.serialize(graph);
      
      expect(result).toContain('"Service with spaces & symbols"');
    });

    test('should handle circular references in properties', () => {
      const circularObj: any = { name: 'test' };
      circularObj.self = circularObj;

      const graph: GraphAST = {
        metadata: {},
        nodes: [
          {
            id: 'a',
            name: 'A',
            type: 'service',
            properties: {
              circular: circularObj
            }
          }
        ],
        edges: []
      };

      expect(() => serializer.serialize(graph)).not.toThrow();
    });

    test('should handle very deep nesting', () => {
      let deepObj: any = { value: 'deep' };
      for (let i = 0; i < 100; i++) {
        deepObj = { nested: deepObj };
      }

      const graph: GraphAST = {
        metadata: {},
        nodes: [
          {
            id: 'a',
            name: 'A',
            type: 'service',
            properties: {
              deep: deepObj
            }
          }
        ],
        edges: []
      };

      expect(() => serializer.serialize(graph)).not.toThrow();
    });
  });

  describe('Performance and Large Graphs', () => {
    test('should handle large graphs efficiently', () => {
      const largeGraph: GraphAST = {
        metadata: { title: 'Large Graph' },
        nodes: Array.from({ length: 1000 }, (_, i) => ({
          id: `node${i}`,
          name: `Node${i}`,
          type: 'service',
          level: Math.floor(i / 100) + 1
        })),
        edges: Array.from({ length: 999 }, (_, i) => ({
          id: `edge${i}`,
          from: `node${i}`,
          to: `node${i + 1}`,
          type: 'simple'
        }))
      };

      const startTime = performance.now();
      const result = serializer.serialize(largeGraph);
      const endTime = performance.now();

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(10000);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in < 1s
    });

    test('should provide serialization metrics', () => {
      const graph: GraphAST = {
        metadata: { title: 'Test' },
        nodes: [
          { id: 'a', name: 'A', type: 'service' },
          { id: 'b', name: 'B', type: 'service' }
        ],
        edges: [
          { id: 'e1', from: 'a', to: 'b', type: 'simple' }
        ]
      };

      const result = serializer.serializeWithMetrics(graph);
      
      expect(result.serialized).toBeDefined();
      expect(result.metrics).toBeDefined();
      expect(result.metrics.serializationTime).toBeGreaterThanOrEqual(0);
      expect(result.metrics.outputSize).toBeGreaterThan(0);
      expect(result.metrics.nodeCount).toBe(2);
      expect(result.metrics.edgeCount).toBe(1);
    });
  });

  describe('Round-trip Compatibility', () => {
    test('should maintain round-trip compatibility', () => {
      const originalGraph: GraphAST = {
        metadata: {
          title: 'Test Architecture',
          version: '1.0',
          domain: 'web'
        },
        nodes: [
          {
            id: 'frontend',
            name: 'Frontend',
            type: 'web',
            anchor: 'ui',
            level: 1,
            properties: {
              framework: 'react',
              version: '18.0'
            }
          },
          {
            id: 'backend',
            name: 'Backend',
            type: 'api',
            anchor: 'api',
            level: 2
          }
        ],
        edges: [
          {
            id: 'edge1',
            from: 'ui',
            to: 'api',
            type: 'simple',
            label: 'HTTP API'
          }
        ]
      };

      const serialized = serializer.serialize(originalGraph);
      
      // Basic validation that serialized format contains expected elements
      expect(serialized).toContain('@title: Test Architecture');
      expect(serialized).toContain('Frontend &ui [web] @1:');
      expect(serialized).toContain('framework: react');
      expect(serialized).toContain('Backend &api [api] @2');
      expect(serialized).toContain('*ui -> *api: HTTP API');
    });

    test('should validate round-trip integrity', () => {
      const graph: GraphAST = {
        metadata: { title: 'Test' },
        nodes: [
          { id: 'a', name: 'A', type: 'service' }
        ],
        edges: []
      };

      const serialized = serializer.serialize(graph);
      const validation = serializer.validateRoundTrip(graph, serialized);
      
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  describe('Custom Serialization Options', () => {
    test('should support custom line endings', () => {
      const graph: GraphAST = {
        metadata: { title: 'Test' },
        nodes: [
          { id: 'a', name: 'A', type: 'service' },
          { id: 'b', name: 'B', type: 'service' }
        ],
        edges: []
      };

      const windowsOptions: SerializationOptions = {
        formatting: {
          lineEnding: '\r\n'
        }
      };

      const windowsSerializer = new LFFSerializer(windowsOptions);
      const result = windowsSerializer.serialize(graph);
      
      expect(result).toContain('\r\n');
    });

    test('should support custom separators', () => {
      const graph: GraphAST = {
        metadata: {},
        nodes: [
          {
            id: 'a',
            name: 'A',
            type: 'service',
            properties: {
              tags: ['web', 'api', 'service']
            }
          }
        ],
        edges: []
      };

      const customOptions: SerializationOptions = {
        formatting: {
          arraySeparator: ' | ',
          objectSeparator: ' = '
        }
      };

      const customSerializer = new LFFSerializer(customOptions);
      const result = customSerializer.serialize(graph);
      
      expect(result).toContain('[web | api | service]');
    });

    test('should support output filtering', () => {
      const graph: GraphAST = {
        metadata: {
          title: 'Test',
          internal: 'secret'
        },
        nodes: [
          {
            id: 'a',
            name: 'A',
            type: 'service',
            properties: {
              public: 'visible',
              private: 'hidden'
            }
          }
        ],
        edges: []
      };

      const filterOptions: SerializationOptions = {
        output: {
          includeMetadata: ['title'], // Only include title
          excludeProperties: ['private'] // Exclude private properties
        }
      };

      const filterSerializer = new LFFSerializer(filterOptions);
      const result = filterSerializer.serialize(graph);
      
      expect(result).toContain('@title: Test');
      expect(result).not.toContain('internal:');
      expect(result).toContain('public: visible');
      expect(result).not.toContain('private:');
    });
  });
}); 