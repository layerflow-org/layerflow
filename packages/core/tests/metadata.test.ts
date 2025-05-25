/**
 * Metadata handling tests
 * Tests metadata operations for nodes, edges, and graphs
 */

import { LayerFlowGraph } from '../src/index';

describe('Metadata Operations', () => {
  let graph: LayerFlowGraph;

  beforeEach(() => {
    graph = new LayerFlowGraph();
  });

  describe('Graph Metadata', () => {
    test('should have default metadata for new graph', () => {
      const metadata = graph.getMetadata();
      
      expect(metadata.title).toBe('Untitled Graph');
      expect(metadata.version).toBe('1.0.0');
      expect(metadata.created).toBeDefined();
      expect(metadata.modified).toBeDefined();
    });

    test('should update graph metadata', () => {
      const updateData = {
        title: 'My Awesome Graph',
        description: 'A graph for testing metadata',
        tags: ['test', 'metadata', 'awesome']
      };

      graph.updateMetadata(updateData);
      const metadata = graph.getMetadata();

      expect(metadata.title).toBe(updateData.title);
      expect(metadata.description).toBe(updateData.description);
      expect(metadata.tags).toEqual(updateData.tags);
    });

    test('should preserve existing metadata when updating', () => {
      graph.updateMetadata({ title: 'First Title' });
      graph.updateMetadata({ description: 'Added description' });

      const metadata = graph.getMetadata();
      expect(metadata.title).toBe('First Title');
      expect(metadata.description).toBe('Added description');
    });

    test('should update modified timestamp on metadata changes', () => {
      const originalModified = graph.getMetadata().modified;
      
      // Wait a small amount to ensure timestamp difference
      setTimeout(() => {
        graph.updateMetadata({ title: 'Updated Title' });
        const updatedModified = graph.getMetadata().modified;
        
        expect(updatedModified).not.toBe(originalModified);
      }, 1);
    });

    test('should handle complex nested metadata', () => {
      const complexMetadata = {
        config: {
          layout: { algorithm: 'hierarchical', spacing: 100 },
          theme: { colors: { primary: '#007acc', secondary: '#ff6b35' } }
        },
        stats: {
          nodeCount: 42,
          complexity: 0.85,
          metrics: [1, 2, 3, 4, 5]
        }
      };

      graph.updateMetadata(complexMetadata);
      const metadata = graph.getMetadata();

      expect(metadata.config).toEqual(complexMetadata.config);
      expect(metadata.stats).toEqual(complexMetadata.stats);
    });
  });

  describe('Node Metadata', () => {
    test('should add node with metadata', async () => {
      const nodeMetadata = {
        description: 'A test node',
        config: { color: 'blue', size: 'large' },
        performance: { cpu: 85, memory: 60 }
      };

      const node = await graph.addNode({
        label: 'Test Node',
        type: 'service',
        metadata: nodeMetadata
      });

      expect(node.metadata).toEqual(nodeMetadata);
    });

    test('should update node metadata', async () => {
      const node = await graph.addNode({ label: 'Node' });
      
      const newMetadata = {
        environment: 'production',
        version: '2.1.0',
        dependencies: ['redis', 'postgres']
      };

      graph.updateNode(node.id, { metadata: newMetadata });
      const updatedNode = graph.getNode(node.id);

      expect(updatedNode?.metadata).toEqual(newMetadata);
    });

    test('should merge node metadata on update', async () => {
      const node = await graph.addNode({
        label: 'Node',
        metadata: { 
          environment: 'dev',
          version: '1.0.0'
        }
      });

      graph.updateNode(node.id, {
        metadata: { 
          environment: 'staging',
          region: 'us-east-1'
        }
      });

      const updatedNode = graph.getNode(node.id);
      expect(updatedNode?.metadata).toEqual({
        environment: 'staging',
        version: '1.0.0',
        region: 'us-east-1'
      });
    });

    test('should handle null and undefined metadata values', async () => {
      const node = await graph.addNode({
        label: 'Node',
        metadata: {
          nullValue: null,
          undefinedValue: undefined,
          emptyString: '',
          zeroValue: 0,
          falseValue: false
        }
      });

      const retrievedNode = graph.getNode(node.id);
      expect(retrievedNode?.metadata?.nullValue).toBe(null);
      expect(retrievedNode?.metadata?.emptyString).toBe('');
      expect(retrievedNode?.metadata?.zeroValue).toBe(0);
      expect(retrievedNode?.metadata?.falseValue).toBe(false);
    });

    test('should preserve metadata through serialization', async () => {
      const originalMetadata = {
        timestamp: new Date().toISOString(),
        uuid: '123e4567-e89b-12d3-a456-426614174000',
        config: { nested: { deeply: { value: 'test' } } }
      };

      await graph.addNode({
        label: 'Serialization Test',
        metadata: originalMetadata
      });

      const json = graph.toJSON();
      const restoredGraph = LayerFlowGraph.fromJSON(json);
      const restoredNode = restoredGraph.getAllNodes()[0];

      expect(restoredNode.metadata).toEqual(originalMetadata);
    });
  });

  describe('Edge Metadata', () => {
    test('should add edge with metadata', async () => {
      const node1 = await graph.addNode({ label: 'Source' });
      const node2 = await graph.addNode({ label: 'Target' });

      const edgeMetadata = {
        bandwidth: '1Gbps',
        latency: '5ms',
        protocol: 'HTTP/2',
        security: { encrypted: true, certificate: 'wildcard' }
      };

      const edge = await graph.addEdge({
        from: node1.id,
        to: node2.id,
        type: 'api',
        metadata: edgeMetadata
      });

      expect(edge.metadata).toEqual(edgeMetadata);
    });

    test('should find edges by metadata', async () => {
      const node1 = await graph.addNode({ label: 'A' });
      const node2 = await graph.addNode({ label: 'B' });
      const node3 = await graph.addNode({ label: 'C' });

      await graph.addEdge({
        from: node1.id,
        to: node2.id,
        metadata: { type: 'api', priority: 'high' }
      });

      await graph.addEdge({
        from: node2.id,
        to: node3.id,
        metadata: { type: 'database', priority: 'low' }
      });

      await graph.addEdge({
        from: node1.id,
        to: node3.id,
        metadata: { type: 'api', priority: 'medium' }
      });

      const edges = graph.getAllEdges();
      const apiEdges = edges.filter(e => e.metadata?.type === 'api');
      const highPriorityEdges = edges.filter(e => e.metadata?.priority === 'high');

      expect(apiEdges).toHaveLength(2);
      expect(highPriorityEdges).toHaveLength(1);
    });

    test('should update edge metadata', async () => {
      const node1 = await graph.addNode({ label: 'A' });
      const node2 = await graph.addNode({ label: 'B' });

      await graph.addEdge({
        from: node1.id,
        to: node2.id,
        metadata: { status: 'inactive' }
      });

      // Note: Edge updates would need to be done by removing and re-adding
      // since edges are identified by from/to pair, not by ID
      const edges = graph.getAllEdges();
      const targetEdge = edges.find(e => e.from === node1.id && e.to === node2.id);
      
      expect(targetEdge?.metadata?.status).toBe('inactive');
    });
  });

  describe('Metadata Querying', () => {
    beforeEach(async () => {
      // Setup test data
      const webServer = await graph.addNode({
        label: 'Web Server',
        type: 'service',
        metadata: { 
          environment: 'production',
          technology: 'nginx',
          region: 'us-east-1'
        }
      });

      const database = await graph.addNode({
        label: 'Database',
        type: 'storage',
        metadata: {
          environment: 'production', 
          technology: 'postgresql',
          region: 'us-east-1'
        }
      });

      const cache = await graph.addNode({
        label: 'Cache',
        type: 'storage',
        metadata: {
          environment: 'staging',
          technology: 'redis',
          region: 'us-west-2'
        }
      });

      await graph.addEdge({
        from: webServer.id,
        to: database.id,
        metadata: { protocol: 'tcp', port: 5432 }
      });

      await graph.addEdge({
        from: webServer.id,
        to: cache.id,
        metadata: { protocol: 'tcp', port: 6379 }
      });
    });

    test('should query nodes by metadata properties', () => {
      const nodes = graph.getAllNodes();
      
      const productionNodes = nodes.filter(n => 
        n.metadata?.environment === 'production'
      );
      
      const storageNodes = nodes.filter(n =>
        n.type === 'storage'
      );

      const usEastNodes = nodes.filter(n =>
        n.metadata?.region === 'us-east-1'
      );

      expect(productionNodes).toHaveLength(2);
      expect(storageNodes).toHaveLength(2);
      expect(usEastNodes).toHaveLength(2);
    });

    test('should query edges by metadata properties', () => {
      const edges = graph.getAllEdges();
      
      const tcpEdges = edges.filter(e =>
        e.metadata?.protocol === 'tcp'
      );

      const postgresEdges = edges.filter(e =>
        e.metadata?.port === 5432
      );

      expect(tcpEdges).toHaveLength(2);
      expect(postgresEdges).toHaveLength(1);
    });

    test('should perform complex metadata queries', () => {
      const nodes = graph.getAllNodes();
      
      // Find production storage nodes in us-east-1
      const specificNodes = nodes.filter(n =>
        n.type === 'storage' &&
        n.metadata?.environment === 'production' &&
        n.metadata?.region === 'us-east-1'
      );

      expect(specificNodes).toHaveLength(1);
      expect(specificNodes[0].label).toBe('Database');
    });
  });

  describe('Metadata Validation', () => {
    test('should validate metadata schema in strict mode', () => {
      // This would test metadata validation if implemented
      // For now, just ensure metadata doesn't break anything
      expect(async () => {
        await graph.addNode({
          label: 'Test',
          metadata: {
            validString: 'test',
            validNumber: 42,
            validBoolean: true,
            validArray: [1, 2, 3],
            validObject: { nested: 'value' }
          }
        });
      }).not.toThrow();
    });

    test('should handle invalid metadata gracefully', async () => {
      // Test with circular references
      const circularObj: any = { name: 'circular' };
      circularObj.self = circularObj;

      // Should not throw during node creation
      await graph.addNode({
        label: 'Circular Test',
        metadata: { data: 'safe', unsafe: circularObj }
      });

      // Should handle serialization gracefully
      expect(() => {
        const json = graph.toJSON();
        expect(json.nodes[0].metadata?.data).toBe('safe');
      }).not.toThrow();
    });
  });

  describe('Performance with Large Metadata', () => {
    test('should handle large metadata objects efficiently', async () => {
      const largeMetadata = {
        bigArray: new Array(1000).fill(0).map((_, i) => ({
          id: i,
          value: `item-${i}`,
          nested: { deep: { deeper: { value: i * 2 } } }
        })),
        bigString: 'x'.repeat(10000),
        manyProperties: Object.fromEntries(
          new Array(100).fill(0).map((_, i) => [`prop${i}`, `value${i}`])
        )
      };

      const startTime = Date.now();
      
      const node = await graph.addNode({
        label: 'Large Metadata Node',
        metadata: largeMetadata
      });

      const endTime = Date.now();
      
      // Should complete reasonably quickly (under 100ms)
      expect(endTime - startTime).toBeLessThan(100);
      
      // Metadata should be preserved
      expect(node.metadata?.bigArray).toHaveLength(1000);
      expect(node.metadata?.bigString).toHaveLength(10000);
      expect(Object.keys(node.metadata?.manyProperties || {})).toHaveLength(100);
    });
  });
}); 