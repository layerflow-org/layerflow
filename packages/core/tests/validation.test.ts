/**
 * Unit tests for validation module
 * Tests GraphValidator, GraphMigrator, and validation rules
 */

import { 
  GraphValidator, 
  GraphMigrator, 
  validateGraph, 
  migrateGraph
} from '../src/index';
import { GraphAST } from '../src/types';

describe('GraphValidator', () => {
  let validator: GraphValidator;

  beforeEach(() => {
    validator = new GraphValidator();
  });

  describe('Basic Validation', () => {
    test('should validate correct graph', () => {
      const validGraph: GraphAST = {
        nodes: [
          { id: 'node1', label: 'Node 1' },
          { id: 'node2', label: 'Node 2' }
        ],
        edges: [
          { from: 'node1', to: 'node2' }
        ]
      };

      const result = validator.validate(validGraph);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should detect missing node IDs', () => {
      const invalidGraph: GraphAST = {
        nodes: [
          { id: '', label: 'Invalid Node' }
        ],
        edges: []
      };

      const result = validator.validate(invalidGraph);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'MISSING_NODE_ID')).toBe(true);
    });

    test('should detect duplicate node IDs', () => {
      const invalidGraph: GraphAST = {
        nodes: [
          { id: 'duplicate', label: 'Node 1' },
          { id: 'duplicate', label: 'Node 2' }
        ],
        edges: []
      };

      const result = validator.validate(invalidGraph);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'DUPLICATE_NODE_ID')).toBe(true);
    });

    test('should detect invalid edge references', () => {
      const invalidGraph: GraphAST = {
        nodes: [
          { id: 'node1', label: 'Node 1' }
        ],
        edges: [
          { from: 'node1', to: 'nonexistent' }
        ]
      };

      const result = validator.validate(invalidGraph);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'INVALID_NODE_REFERENCE')).toBe(true);
    });
  });

  describe('Validation Rules', () => {
    test('should enforce NO_SELF_LOOPS rule', () => {
      const validator = new GraphValidator({
        rules: ['NO_SELF_LOOPS'],
        allowSelfLoops: false
      });

      const graphWithSelfLoop: GraphAST = {
        nodes: [{ id: 'node1', label: 'Node 1' }],
        edges: [{ from: 'node1', to: 'node1' }]
      };

      const result = validator.validate(graphWithSelfLoop);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'SELF_LOOP_EDGE')).toBe(true);
    });

    test('should detect duplicate edges', () => {
      const validator = new GraphValidator({
        rules: ['NO_DUPLICATE_EDGES']
      });

      const graphWithDuplicates: GraphAST = {
        nodes: [
          { id: 'node1', label: 'Node 1' },
          { id: 'node2', label: 'Node 2' }
        ],
        edges: [
          { from: 'node1', to: 'node2' },
          { from: 'node1', to: 'node2' }
        ]
      };

      const result = validator.validate(graphWithDuplicates);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'DUPLICATE_EDGE')).toBe(true);
    });

    test('should detect circular parent references', () => {
      const graphWithCircular: GraphAST = {
        nodes: [
          { id: 'node1', label: 'Node 1', parentId: 'node2' },
          { id: 'node2', label: 'Node 2', parentId: 'node1' }
        ],
        edges: []
      };

      const result = validator.validate(graphWithCircular);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'CIRCULAR_PARENT_REFERENCE')).toBe(true);
    });
  });

  describe('Size Limits', () => {
    test('should enforce node limits', () => {
      const validator = new GraphValidator({ maxNodes: 2 });
      
      const largeGraph: GraphAST = {
        nodes: [
          { id: 'node1', label: 'Node 1' },
          { id: 'node2', label: 'Node 2' },
          { id: 'node3', label: 'Node 3' }
        ],
        edges: []
      };

      const result = validator.validate(largeGraph);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'MAX_NODES_EXCEEDED')).toBe(true);
    });

    test('should enforce edge limits', () => {
      const validator = new GraphValidator({ maxEdges: 1 });
      
      const graphWithManyEdges: GraphAST = {
        nodes: [
          { id: 'node1', label: 'Node 1' },
          { id: 'node2', label: 'Node 2' },
          { id: 'node3', label: 'Node 3' }
        ],
        edges: [
          { from: 'node1', to: 'node2' },
          { from: 'node2', to: 'node3' }
        ]
      };

      const result = validator.validate(graphWithManyEdges);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'MAX_EDGES_EXCEEDED')).toBe(true);
    });
  });
});

describe('GraphMigrator', () => {
  let migrator: GraphMigrator;

  beforeEach(() => {
    migrator = new GraphMigrator();
  });

  test('should not migrate if versions match', () => {
    const graph: GraphAST = {
      nodes: [],
      edges: [],
      metadata: { version: '1.0.0' }
    };

    const migrated = migrator.migrate(graph, '1.0.0');
    expect(migrated).toEqual(graph);
  });

  test('should update version after migration', () => {
    const graph: GraphAST = {
      nodes: [],
      edges: [],
      metadata: { version: '0.9.0' }
    };

    const migrated = migrator.migrate(graph, '1.0.0');
    expect(migrated.metadata?.version).toBe('1.0.0');
    expect(migrated.metadata?.modified).toBeDefined();
  });

  test('should apply migration transformations', () => {
    const oldGraph: GraphAST = {
      nodes: [
        { id: 'node1', label: 'Node without type' }
      ],
      edges: [
        { from: 'node1', to: 'node1' }
      ],
      metadata: { version: '0.9.0' }
    };

    const migrated = migrator.migrate(oldGraph, '1.0.0');
    
    // Check that migration added default types
    expect(migrated.nodes[0].type).toBe('component');
    expect(migrated.edges[0].type).toBe('connection');
  });
});

describe('Utility Functions', () => {
  test('validateGraph should return boolean', () => {
    const validGraph: GraphAST = {
      nodes: [{ id: 'test', label: 'Test' }],
      edges: []
    };

    const invalidGraph: GraphAST = {
      nodes: [{ id: '', label: 'Invalid' }],
      edges: []
    };

    expect(validateGraph(validGraph)).toBe(true);
    expect(validateGraph(invalidGraph)).toBe(false);
  });

  test('migrateGraph should use default version', () => {
    const graph: GraphAST = {
      nodes: [],
      edges: [],
      metadata: { version: '0.9.0' }
    };

    const migrated = migrateGraph(graph);
    expect(migrated.metadata?.version).toBeDefined();
  });
}); 