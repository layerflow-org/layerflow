import { LFFSerializer, createLFFSerializer } from '../src/lff-serializer';
import type { GraphAST } from '@layerflow/core';

describe('LFF Serializer', () => {
  test('serializes basic graph', () => {
    const graph: GraphAST = {
      metadata: { title: 'Test' },
      nodes: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' }
      ],
      edges: [ { from: 'a', to: 'b', label: 'HTTP' } ]
    };
    const serializer = new LFFSerializer();
    const result = serializer.serialize(graph);
    expect(result).toContain('@title: Test');
    expect(result).toContain('A');
    expect(result).toContain('B');
  });

  test('supports presets', () => {
    const graph: GraphAST = { metadata: {}, nodes: [], edges: [] };
    const serializer = createLFFSerializer('compact');
    const result = serializer.serialize(graph);
    expect(typeof result).toBe('string');
  });

  test('provides metrics', () => {
    const graph: GraphAST = { metadata: {}, nodes: [], edges: [] };
    const serializer = new LFFSerializer();
    const output = serializer.serializeWithMetrics(graph);
    expect(output.metrics.serializationTime).toBeGreaterThanOrEqual(0);
  });
});
