/**
 * Bidirectional Sync Tests
 * @fileoverview Test suite for bidirectional synchronization between Parser and Core
 */

import { parseLFF, serializeToLFF } from '../src/index';
import type { GraphAST } from '@layerflow/core';

describe('Bidirectional Sync Tests', () => {
  test('Should parse LFF and serialize back to LFF (round-trip)', () => {
    const originalLFF = `@title: Test Architecture
@version: 1.0

Frontend [web]
Backend [api]
Database [postgres]

Frontend -> Backend: HTTP
Backend -> Database: SQL`;

    // Parse LFF to GraphAST
    const parseResult = parseLFF(originalLFF);
    expect(parseResult.success).toBe(true);
    expect(parseResult.graph).toBeDefined();

    // Serialize GraphAST back to LFF
    const serializedLFF = serializeToLFF(parseResult.graph!);
    
    // Parse the serialized LFF again
    const secondParseResult = parseLFF(serializedLFF);
    expect(secondParseResult.success).toBe(true);
    
    // Compare structures
    const originalGraph = parseResult.graph!;
    const roundTripGraph = secondParseResult.graph!;
    
    expect(roundTripGraph.nodes).toHaveLength(originalGraph.nodes.length);
    expect(roundTripGraph.edges).toHaveLength(originalGraph.edges.length);
    expect(roundTripGraph.metadata?.title).toBe(originalGraph.metadata?.title);
    expect(roundTripGraph.metadata?.version).toBe(originalGraph.metadata?.version);
  });

  test('Should handle hierarchical structures in round-trip', () => {
    const originalLFF = `@title: Hierarchical System

System:
  Frontend [web]:
    port: 3000
    replicas: 2
  Backend [api]:
    port: 8080
  Database [postgres]:
    host: localhost
    
Frontend -> Backend: REST
Backend -> Database: SQL`;

    // Round-trip test
    const parseResult = parseLFF(originalLFF);
    expect(parseResult.success).toBe(true);
    
    const serializedLFF = serializeToLFF(parseResult.graph!);
    const secondParseResult = parseLFF(serializedLFF);
    expect(secondParseResult.success).toBe(true);
    
    // Check hierarchy preservation
    const originalGraph = parseResult.graph!;
    const roundTripGraph = secondParseResult.graph!;
    
    const systemNode = roundTripGraph.nodes.find(n => n.label === 'System');
    const frontendNode = roundTripGraph.nodes.find(n => n.label === 'Frontend');
    const backendNode = roundTripGraph.nodes.find(n => n.label === 'Backend');
    
    expect(systemNode).toBeDefined();
    expect(frontendNode?.parentId).toBe(systemNode?.id);
    expect(backendNode?.parentId).toBe(systemNode?.id);
    
    // Check metadata preservation
    expect(frontendNode?.metadata?.port).toBe(3000);
    expect(frontendNode?.metadata?.replicas).toBe(2);
    expect(backendNode?.metadata?.port).toBe(8080);
  });

  test('Should handle edge types correctly in round-trip', () => {
    const originalLFF = `A [service]
B [service]
C [database]

A -> B: sync
A => C: async
B <-> C: bidirectional
A --> C: dashed`;

    const parseResult = parseLFF(originalLFF);
    expect(parseResult.success).toBe(true);
    
    const serializedLFF = serializeToLFF(parseResult.graph!);
    const secondParseResult = parseLFF(serializedLFF);
    expect(secondParseResult.success).toBe(true);
    
    const edges = secondParseResult.graph!.edges;
    expect(edges).toHaveLength(4);
    
    const syncEdge = edges.find(e => e.label === 'sync');
    const asyncEdge = edges.find(e => e.label === 'async');
    const biEdge = edges.find(e => e.label === 'bidirectional');
    const dashedEdge = edges.find(e => e.label === 'dashed');
    
    expect(syncEdge?.type).toBe('simple');
    expect(asyncEdge?.type).toBe('multiple');
    expect(biEdge?.type).toBe('bidirectional');
    expect(dashedEdge?.type).toBe('dashed');
  });

  test('Should handle complex metadata in round-trip', () => {
    const originalLFF = `@title: Complex System
@description: "A complex system with metadata"
@tags: [microservices, cloud, api]
@custom: "custom value"

"User Service" [microservice]:
  replicas: 3
  memory: "512Mi"
  env: [production, staging]
  config:
    database: postgres
    cache: redis`;

    const parseResult = parseLFF(originalLFF);
    expect(parseResult.success).toBe(true);
    
    const serializedLFF = serializeToLFF(parseResult.graph!);
    const secondParseResult = parseLFF(serializedLFF);
    expect(secondParseResult.success).toBe(true);
    
    const graph = secondParseResult.graph!;
    
    // Check metadata
    expect(graph.metadata?.title).toBe('Complex System');
    expect(graph.metadata?.description).toBe('A complex system with metadata');
    expect(graph.metadata?.tags).toEqual(['microservices', 'cloud', 'api']);
    expect(graph.metadata?.custom).toBe('custom value');
    
    // Check node metadata
    const userService = graph.nodes.find(n => n.label === 'User Service');
    expect(userService?.metadata?.replicas).toBe(3);
    expect(userService?.metadata?.memory).toBe('512Mi');
    expect(userService?.metadata?.env).toEqual(['production', 'staging']);
  });

  test('Should create valid GraphAST from manual construction', () => {
    // Manually create GraphAST
    const manualGraph: GraphAST = {
      nodes: [
        {
          id: 'frontend',
          label: 'Frontend',
          type: 'web',
          level: 1,
          metadata: { port: 3000 }
        },
        {
          id: 'backend',
          label: 'Backend', 
          type: 'api',
          level: 1,
          metadata: { port: 8080 }
        }
      ],
      edges: [
        {
          from: 'frontend',
          to: 'backend',
          type: 'simple',
          label: 'HTTP API'
        }
      ],
      metadata: {
        title: 'Manual Graph',
        version: '1.0'
      }
    };

    // Serialize to LFF
    const lffContent = serializeToLFF(manualGraph);
    
    // Parse back
    const parseResult = parseLFF(lffContent);
    expect(parseResult.success).toBe(true);
    
    const graph = parseResult.graph!;
    expect(graph.nodes).toHaveLength(2);
    expect(graph.edges).toHaveLength(1);
    expect(graph.metadata?.title).toBe('Manual Graph');
    
    const frontend = graph.nodes.find(n => n.label === 'Frontend');
    const backend = graph.nodes.find(n => n.label === 'Backend');
    
    expect(frontend?.type).toBe('web');
    expect(frontend?.level).toBe(1);
    expect(frontend?.metadata?.port).toBe(3000);
    
    expect(backend?.type).toBe('api');
    expect(backend?.level).toBe(1);
    expect(backend?.metadata?.port).toBe(8080);
  });

  test('Should handle serialization options', () => {
    const graph: GraphAST = {
      nodes: [
        { id: 'a', label: 'Service A', type: 'api' },
        { id: 'b', label: 'Service B', type: 'web' }
      ],
      edges: [
        { from: 'a', to: 'b', type: 'simple' }
      ],
      metadata: { title: 'Test' }
    };

    // Test different indent sizes
    const lff2Spaces = serializeToLFF(graph, { indentSize: 2 });
    const lff4Spaces = serializeToLFF(graph, { indentSize: 4 });
    
    expect(lff2Spaces).toContain('@title: Test');
    expect(lff4Spaces).toContain('@title: Test');
    
    // Both should parse successfully
    expect(parseLFF(lff2Spaces).success).toBe(true);
    expect(parseLFF(lff4Spaces).success).toBe(true);
  });
}); 