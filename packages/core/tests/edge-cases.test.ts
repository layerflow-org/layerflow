/**
 * Edge cases and error handling tests
 * Tests boundary conditions, error scenarios, and validation edge cases
 */

import { LayerFlowGraph, GraphValidator, GraphNode } from '../src/index';
import { GraphAST } from '../src/types';

describe('Edge Cases and Error Handling', () => {
  describe('Graph Construction Edge Cases', () => {
    test('should handle empty AST gracefully', () => {
      const graph = new LayerFlowGraph({});
      
      expect(graph.getAllNodes()).toHaveLength(0);
      expect(graph.getAllEdges()).toHaveLength(0);
      expect(graph.getMetadata().title).toBe('Untitled Graph');
    });

    test('should handle malformed AST with missing fields', () => {
      const malformedAST = {
        nodes: [{ id: 'test' } as any], // Missing required label
        edges: []
      };
      
      const graph = new LayerFlowGraph(malformedAST);
      const validation = graph.validate();
      
      // Missing label should be a warning, not an error in LayerFlowGraph validation
      expect(validation.valid).toBe(true);
      expect(validation.warnings?.some(w => w.code === 'EMPTY_NODE_LABEL')).toBe(true);
      expect(validation.errors.some(e => e.code === 'INVALID_EDGE_SOURCE')).toBe(false);
    });

    test('should handle null and undefined values', () => {
      const graph = new LayerFlowGraph(undefined);
      
      expect(graph.getAllNodes()).toHaveLength(0);
      expect(graph.toJSON()).toHaveProperty('nodes');
      expect(graph.toJSON()).toHaveProperty('edges');
    });
  });

  describe('Validation Edge Cases', () => {
    test('should detect orphaned edges', () => {
      const invalidAST: GraphAST = {
        nodes: [
          { id: 'node1', label: 'Node 1' }
        ],
        edges: [
          { from: 'node1', to: 'nonexistent' },
          { from: 'missing', to: 'node1' }
        ]
      };

      const validator = new GraphValidator();
      const result = validator.validate(invalidAST);

      expect(result.valid).toBe(false);
      expect(result.errors.filter(e => e.code === 'INVALID_NODE_REFERENCE')).toHaveLength(2);
    });

    test('should handle complex circular references', () => {
      const circularAST: GraphAST = {
        nodes: [
          { id: 'a', label: 'A', parentId: 'c' },
          { id: 'b', label: 'B', parentId: 'a' },
          { id: 'c', label: 'C', parentId: 'b' }
        ],
        edges: []
      };

      const validator = new GraphValidator();
      const result = validator.validate(circularAST);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'CIRCULAR_PARENT_REFERENCE')).toBe(true);
    });

    test('should validate empty strings and whitespace', () => {
      const invalidAST: GraphAST = {
        nodes: [
          { id: '', label: 'Empty ID' },
          { id: '   ', label: 'Whitespace ID' },
          { id: 'valid', label: '' },
          { id: 'valid2', label: '   ' }
        ],
        edges: []
      };

      const validator = new GraphValidator();
      const result = validator.validate(invalidAST);

      expect(result.valid).toBe(false);
      expect(result.errors.filter(e => e.code === 'MISSING_NODE_ID')).toHaveLength(2);
      expect(result.errors.filter(e => e.code === 'MISSING_NODE_LABEL')).toHaveLength(2);
    });

    test('should handle strict mode correctly', () => {
      const graphWithWarnings: GraphAST = {
        nodes: [{ id: 'test', label: 'Test' }],
        edges: [],
        metadata: {} // Missing title and version
      };

      const strictValidator = new GraphValidator({ strict: true });
      const lenientValidator = new GraphValidator({ strict: false });

      const strictResult = strictValidator.validate(graphWithWarnings);
      const lenientResult = lenientValidator.validate(graphWithWarnings);

      expect(strictResult.valid).toBe(false);
      expect(lenientResult.valid).toBe(true);
      expect(lenientResult.warnings?.length).toBeGreaterThan(0);
    });
  });

  describe('CRUD Edge Cases', () => {
    let graph: LayerFlowGraph;

    beforeEach(() => {
      graph = new LayerFlowGraph();
    });

    test('should handle adding node with circular parent during creation', async () => {
      await expect(graph.addNode({
        id: 'child',
        label: 'Child',
        parentId: 'child' // Self-reference
      })).rejects.toThrow('Parent node "child" does not exist');
    });

    test('should handle updating non-existent node', () => {
      expect(() => graph.updateNode('nonexistent', { label: 'Updated' }))
        .toThrow('Node with ID "nonexistent" not found');
    });

    test('should handle removing non-existent node', () => {
      const result = graph.removeNode('nonexistent');
      expect(result).toBe(false);
    });

    test('should handle edge operations with invalid nodes', async () => {
      const node = await graph.addNode({ label: 'Valid Node' });

      await expect(graph.addEdge({
        from: 'invalid',
        to: node.id
      })).rejects.toThrow('Source node "invalid" does not exist');

      await expect(graph.addEdge({
        from: node.id,
        to: 'invalid'
      })).rejects.toThrow('Target node "invalid" does not exist');
    });

    test('should handle empty and whitespace labels', async () => {
      await expect(graph.addNode({ label: '' }))
        .rejects.toThrow('Node label is required and cannot be empty');

      await expect(graph.addNode({ label: '   ' }))
        .rejects.toThrow('Node label is required and cannot be empty');
    });
  });

  describe('Serialization Edge Cases', () => {
    test('should handle large graphs', async () => {
      const graph = new LayerFlowGraph();
      
      // Add many nodes
      const nodes: any[] = [];
      for (let i = 0; i < 1000; i++) {
        const node = await graph.addNode({ label: `Node ${i}` });
        nodes.push(node);
      }

      // Add many edges
      for (let i = 0; i < 999; i++) {
        await graph.addEdge({
          from: nodes[i].id,
          to: nodes[i + 1].id
        });
      }

      const json = graph.toJSON();
      expect(json.nodes).toHaveLength(1000);
      expect(json.edges).toHaveLength(999);

      // Test round-trip serialization
      const newGraph = LayerFlowGraph.fromJSON(json);
      expect(newGraph.getAllNodes()).toHaveLength(1000);
      expect(newGraph.getAllEdges()).toHaveLength(999);
    });

    test('should handle special characters in labels and metadata', async () => {
      const graph = new LayerFlowGraph();
      
      const node = await graph.addNode({
        label: 'Node with "quotes" and \n newlines',
        metadata: {
          description: 'Special chars: <>&"\'',
          unicode: '🚀 Unicode test 中文',
          json: { nested: { data: true } }
        }
      });

      const json = graph.toJSON();
      const restored = LayerFlowGraph.fromJSON(json);
      const restoredNode = restored.getNode(node.id);

      expect(restoredNode?.label).toBe(node.label);
      expect(restoredNode?.metadata).toEqual(node.metadata);
    });
  });

  describe('Memory and Performance Edge Cases', () => {
    test('should handle deep cloning without stack overflow', async () => {
      const graph = new LayerFlowGraph();
      
      // Create deeply nested metadata
      let deepObject: any = {};
      let current = deepObject;
      for (let i = 0; i < 100; i++) {
        current.next = { level: i };
        current = current.next;
      }

      const node = await graph.addNode({
        label: 'Deep Node',
        metadata: { deep: deepObject }
      });

      // Should not throw stack overflow
      const retrieved = graph.getNode(node.id);
      expect(retrieved?.metadata?.deep).toBeDefined();
    });

    test('should handle concurrent operations gracefully', async () => {
      const graph = new LayerFlowGraph();
      
      // Simulate concurrent node additions
      const promises: Promise<GraphNode>[] = [];
      for (let i = 0; i < 100; i++) {
        promises.push(graph.addNode({ label: `Concurrent Node ${i}` }));
      }

      const nodes = await Promise.all(promises);
      expect(nodes).toHaveLength(100);
      expect(graph.getAllNodes()).toHaveLength(100);

      // All nodes should have unique IDs
      const ids = nodes.map(n => n.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(100);
    });
  });
}); 