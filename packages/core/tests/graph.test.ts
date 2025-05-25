/**
 * Unit tests for LayerFlowGraph
 * Tests core CRUD operations, validation, and plugin integration
 */

import { LayerFlowGraph, PluginManager, createPlugin, GraphNode } from '../src/index';

describe('LayerFlowGraph', () => {
  let graph: LayerFlowGraph;

  beforeEach(() => {
    graph = new LayerFlowGraph();
  });

  describe('Node Operations', () => {
    test('should add a node with auto-generated ID', async () => {
      const node = await graph.addNode({
        label: 'Test Node',
        type: 'service'
      });

      expect(node.id).toBeDefined();
      expect(node.label).toBe('Test Node');
      expect(node.type).toBe('service');
      expect(graph.getAllNodes()).toHaveLength(1);
    });

    test('should add a node with custom ID', async () => {
      const node = await graph.addNode({
        id: 'custom-id',
        label: 'Custom Node'
      });

      expect(node.id).toBe('custom-id');
      expect(graph.getNode('custom-id')).toEqual(node);
    });

    test('should throw error for duplicate node ID', async () => {
      await graph.addNode({ id: 'duplicate', label: 'First' });
      
      await expect(graph.addNode({ id: 'duplicate', label: 'Second' }))
        .rejects.toThrow('Node with ID "duplicate" already exists');
    });

    test('should throw error for empty label', async () => {
      await expect(graph.addNode({ label: '' }))
        .rejects.toThrow('Node label is required and cannot be empty');
    });

    test('should update existing node', async () => {
      const node = await graph.addNode({ label: 'Original Label' });
      
      const updated = graph.updateNode(node.id, { 
        label: 'Updated Label',
        type: 'updated'
      });
      
      expect(updated.label).toBe('Updated Label');
      expect(updated.type).toBe('updated');
      expect(updated.id).toBe(node.id);
    });

    test('should remove node and connected edges', async () => {
      const node1 = await graph.addNode({ label: 'Node 1' });
      const node2 = await graph.addNode({ label: 'Node 2' });
      await graph.addEdge({ from: node1.id, to: node2.id });

      const removed = graph.removeNode(node1.id);

      expect(removed).toBe(true);
      expect(graph.getNode(node1.id)).toBeUndefined();
      expect(graph.getAllEdges()).toHaveLength(0);
    });
  });

  describe('Edge Operations', () => {
    let node1: GraphNode;
    let node2: GraphNode;

    beforeEach(async () => {
      node1 = await graph.addNode({ label: 'Node 1' });
      node2 = await graph.addNode({ label: 'Node 2' });
    });

    test('should add edge between existing nodes', async () => {
      const edge = await graph.addEdge({
        from: node1.id,
        to: node2.id,
        type: 'connection'
      });

      expect(edge.from).toBe(node1.id);
      expect(edge.to).toBe(node2.id);
      expect(graph.getAllEdges()).toHaveLength(1);
    });

    test('should throw error for edge to non-existent node', async () => {
      await expect(graph.addEdge({
        from: node1.id,
        to: 'non-existent'
      })).rejects.toThrow('Target node "non-existent" does not exist');
    });

    test('should throw error for duplicate edge', async () => {
      await graph.addEdge({ from: node1.id, to: node2.id });
      
      await expect(graph.addEdge({ from: node1.id, to: node2.id }))
        .rejects.toThrow('Edge from');
    });

    test('should prevent self-loops when disabled', async () => {
      const strictGraph = new LayerFlowGraph({}, { allowSelfLoops: false });
      const node = await strictGraph.addNode({ label: 'Self Node' });

      await expect(strictGraph.addEdge({ from: node.id, to: node.id }))
        .rejects.toThrow('Self-referencing edge from');
    });

    test('should allow self-loops when enabled', async () => {
      const permissiveGraph = new LayerFlowGraph({}, { allowSelfLoops: true });
      const node = await permissiveGraph.addNode({ label: 'Self Node' });

      const edge = await permissiveGraph.addEdge({ from: node.id, to: node.id });
      expect(edge.from).toBe(node.id);
      expect(edge.to).toBe(node.id);
    });
  });

  describe('Layer Operations', () => {
    test('should get nodes by level', async () => {
      await graph.addNode({ label: 'Level 0', level: 0 });
      await graph.addNode({ label: 'Level 1', level: 1 });
      await graph.addNode({ label: 'Another Level 1', level: 1 });

      const level0Nodes = graph.getNodesAtLevel(0);
      const level1Nodes = graph.getNodesAtLevel(1);

      expect(level0Nodes).toHaveLength(1);
      expect(level1Nodes).toHaveLength(2);
    });

    test('should get all unique levels', async () => {
      await graph.addNode({ label: 'Node', level: 0 });
      await graph.addNode({ label: 'Node', level: 2 });
      await graph.addNode({ label: 'Node', level: 1 });

      const levels = graph.getAllLevels();
      expect(levels).toEqual([0, 1, 2]);
    });

    test('should move node to different level', async () => {
      const node = await graph.addNode({ label: 'Node', level: 0 });
      
      const updated = graph.moveNodeToLevel(node.id, 5);
      
      expect(updated.level).toBe(5);
      expect(graph.getNodesAtLevel(5)).toHaveLength(1);
    });
  });

  describe('Hierarchy Operations', () => {
    test('should handle parent-child relationships', async () => {
      const parent = await graph.addNode({ label: 'Parent' });
      const child = await graph.addNode({ 
        label: 'Child', 
        parentId: parent.id 
      });

      const children = graph.getChildNodes(parent.id);
      const parentNode = graph.getParentNode(child.id);

      expect(children).toHaveLength(1);
      expect(children[0].id).toBe(child.id);
      expect(parentNode?.id).toBe(parent.id);
    });

    test('should get root nodes', async () => {
      const root1 = await graph.addNode({ label: 'Root 1' });
      const root2 = await graph.addNode({ label: 'Root 2' });
      await graph.addNode({ label: 'Child', parentId: root1.id });

      const roots = graph.getRootNodes();
      expect(roots).toHaveLength(2);
      expect(roots.map(n => n.id)).toContain(root1.id);
      expect(roots.map(n => n.id)).toContain(root2.id);
    });

    test('should prevent circular parent references', async () => {
      const node1 = await graph.addNode({ label: 'Node 1' });
      const node2 = await graph.addNode({ label: 'Node 2', parentId: node1.id });

      expect(() => graph.setNodeParent(node1.id, node2.id))
        .toThrow('Setting parent would create circular reference');
    });
  });

  describe('Serialization', () => {
    test('should export to JSON', async () => {
      await graph.addNode({ label: 'Node 1' });
      await graph.addNode({ label: 'Node 2' });

      const json = graph.toJSON();

      expect(json.nodes).toHaveLength(2);
      expect(json.metadata?.title).toBe('Untitled Graph');
    });

    test('should create graph from JSON', () => {
      const json = {
        nodes: [{ id: 'test', label: 'Test Node' }],
        edges: [],
        metadata: { title: 'Test Graph' }
      };

      const newGraph = LayerFlowGraph.fromJSON(json);
      
      expect(newGraph.getAllNodes()).toHaveLength(1);
      expect(newGraph.getMetadata().title).toBe('Test Graph');
    });
  });

  describe('Plugin Integration', () => {
    test('should integrate with plugin manager', async () => {
      const pluginManager = new PluginManager();
      const hookCalls: string[] = [];

      const testPlugin = createPlugin(
        'test-plugin',
        '1.0.0',
        (manager) => {
          manager.on('node:afterAdd', () => {
            hookCalls.push('node:afterAdd');
          });
        }
      );

      await pluginManager.register(testPlugin);
      const pluginGraph = new LayerFlowGraph({}, {}, pluginManager);

      await pluginGraph.addNode({ label: 'Test Node' });

      expect(hookCalls).toContain('node:afterAdd');
    });
  });

  describe('Validation', () => {
    test('should validate graph structure', async () => {
      await graph.addNode({ id: 'valid-node', label: 'Valid Node' });
      
      const result = graph.validate();
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should detect validation errors', () => {
      // Manually create invalid graph state for testing
      (graph as any).ast.edges.push({ from: 'invalid', to: 'also-invalid' });
      
      const result = graph.validate();
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
}); 