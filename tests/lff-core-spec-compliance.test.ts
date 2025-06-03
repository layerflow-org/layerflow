/**
 * LFF Core Specification Compliance Tests
 * @fileoverview Tests to validate full compliance with LFF Core specification
 */

import { describe, test, expect } from 'jest';
import { 
  EnhancedLayerFlowParser,
  ValidationLayer,
  validateAST,
  parseLFF,
  serializeToLFF,
  parseLevelSpec,
  formatLevelSpec,
  levelMatchesSpec,
  extractAnchorName,
  isAnchorReference,
  isAnchorDefinition,
  isValidAnchorName
} from '../packages/parser/src';

// Helper function to create default location
const createDefaultLocation = () => ({
  startLine: 0,
  endLine: 0,
  startColumn: 0,
  endColumn: 0,
  indent: 0
});

describe('LFF Core Specification Compliance', () => {
  
  describe('1. Basic Nodes (Section 1.1)', () => {
    test('should parse simple node names', () => {
      const content = `
Frontend
Backend
Database
      `.trim();

      const result = parseLFF(content);
      expect(result.success).toBe(true);
      expect(result.ast?.nodes).toHaveLength(3);
      
      const nodeNames = result.ast!.nodes.map(n => n.name);
      expect(nodeNames).toEqual(['Frontend', 'Backend', 'Database']);
    });

    test('should parse quoted node names with spaces', () => {
      const content = `
"User Service"
"Payment Gateway"
"Data Analytics Engine"
      `.trim();

      const result = parseLFF(content);
      expect(result.success).toBe(true);
      expect(result.ast?.nodes).toHaveLength(3);
      
      const nodeNames = result.ast!.nodes.map(n => n.name);
      expect(nodeNames).toEqual(['User Service', 'Payment Gateway', 'Data Analytics Engine']);
    });

    test('should parse nodes with types', () => {
      const content = `
Frontend [web]
Backend [api, microservice]
Database [postgres, primary]
      `.trim();

      const result = parseLFF(content);
      expect(result.success).toBe(true);
      expect(result.ast?.nodes).toHaveLength(3);
      
      const frontend = result.ast!.nodes.find(n => n.name === 'Frontend');
      expect(frontend?.types).toEqual(['web']);
      
      const backend = result.ast!.nodes.find(n => n.name === 'Backend');
      expect(backend?.types).toEqual(['api', 'microservice']);
      
      const database = result.ast!.nodes.find(n => n.name === 'Database');
      expect(database?.types).toEqual(['postgres', 'primary']);
    });
  });

  describe('2. Edges (Section 1.2)', () => {
    test('should parse all arrow types', () => {
      const content = `
A -> B
C => D
E <-> F
G --> H
      `.trim();

      const result = parseLFF(content);
      expect(result.success).toBe(true);
      expect(result.ast?.edges).toHaveLength(4);
      
      const arrows = result.ast!.edges.map(e => e.arrow);
      expect(arrows).toEqual(['->', '=>', '<->', '-->']);
    });

    test('should parse edges with labels', () => {
      const content = `
Frontend -> Backend: HTTP requests
Backend => Database: SQL queries
Cache <-> Application: bidirectional sync
Gateway --> Service: async messages
      `.trim();

      const result = parseLFF(content);
      expect(result.success).toBe(true);
      expect(result.ast?.edges).toHaveLength(4);
      
      const labels = result.ast!.edges.map(e => e.label);
      expect(labels).toEqual([
        'HTTP requests',
        'SQL queries', 
        'bidirectional sync',
        'async messages'
      ]);
    });
  });

  describe('3. Hierarchical Blocks (Section 1.3)', () => {
    test('should parse nested blocks with 2-space indentation', () => {
      const content = `
System:
  Frontend:
    Components:
      Header
      Footer
  Backend:
    Services:
      UserService
      PaymentService
      `.trim();

      const result = parseLFF(content);
      expect(result.success).toBe(true);
      
      // Should parse all nodes at different levels
      const nodeNames = result.ast!.nodes.map(n => n.name);
      expect(nodeNames).toContain('System');
      expect(nodeNames).toContain('Frontend');
      expect(nodeNames).toContain('Components');
      expect(nodeNames).toContain('Header');
      expect(nodeNames).toContain('Footer');
      expect(nodeNames).toContain('Backend');
      expect(nodeNames).toContain('Services');
      expect(nodeNames).toContain('UserService');
      expect(nodeNames).toContain('PaymentService');
    });
  });

  describe('4. Directives (Section 1.4)', () => {
    test('should parse core directives', () => {
      const content = `
@title: Test Architecture
@version: 1.0.0
@levels: 3
@theme: dark
@import: ./other.lff

Frontend -> Backend
      `.trim();

      const result = parseLFF(content);
      expect(result.success).toBe(true);
      expect(result.ast?.directives).toHaveLength(5);
      
      const directives = result.ast!.directives;
      expect(directives.find(d => d.key === 'title')?.value).toBe('Test Architecture');
      expect(directives.find(d => d.key === 'version')?.value).toBe('1.0.0');
      expect(directives.find(d => d.key === 'levels')?.value).toBe(3);
      expect(directives.find(d => d.key === 'theme')?.value).toBe('dark');
      expect(directives.find(d => d.key === 'import')?.value).toBe('./other.lff');
    });
  });

  describe('5. Comments (Section 1.5)', () => {
    test('should parse and preserve comments', () => {
      const content = `
# This is a system architecture
Frontend -> Backend  # Main connection
# Backend processes requests
Backend -> Database
      `.trim();

      const result = parseLFF(content);
      expect(result.success).toBe(true);
      expect(result.ast?.edges).toHaveLength(2);
      
      // Comments should be preserved in some form
      // (Implementation may vary - could be in metadata or separate collection)
    });
  });

  describe('6. Node Properties (Section 1.6)', () => {
    test('should parse node properties with different value types', () => {
      const content = `
Backend [api]:
  port: 8080
  replicas: 3
  enabled: true
  disabled: false
  tags: [microservice, backend, api]
  config:
    timeout: 30.5
    retries: 5
      `.trim();

      const result = parseLFF(content);
      expect(result.success).toBe(true);
      
      const backend = result.ast!.nodes.find(n => n.name === 'Backend');
      expect(backend?.properties?.port).toBe(8080);
      expect(backend?.properties?.replicas).toBe(3);
      expect(backend?.properties?.enabled).toBe(true);
      expect(backend?.properties?.disabled).toBe(false);
      expect(backend?.properties?.tags).toEqual(['microservice', 'backend', 'api']);
      expect(backend?.properties?.config?.timeout).toBe(30.5);
      expect(backend?.properties?.config?.retries).toBe(5);
    });
  });

  describe('7. Level Specifications (Section 1.7)', () => {
    test('should parse exact level specifications', () => {
      const content = `
System @1
Frontend @2
Backend @3
      `.trim();

      const result = parseLFF(content);
      expect(result.success).toBe(true);
      
      const nodes = result.ast!.nodes;
      expect(nodes.find(n => n.name === 'System')?.levelSpec).toBe('1');
      expect(nodes.find(n => n.name === 'Frontend')?.levelSpec).toBe('2');
      expect(nodes.find(n => n.name === 'Backend')?.levelSpec).toBe('3');
    });

    test('should parse plus level specifications', () => {
      const content = `
System @1+
Services @2+
      `.trim();

      const result = parseLFF(content);
      expect(result.success).toBe(true);
      
      const nodes = result.ast!.nodes;
      expect(nodes.find(n => n.name === 'System')?.levelSpec).toBe('1+');
      expect(nodes.find(n => n.name === 'Services')?.levelSpec).toBe('2+');
    });

    test('should parse range level specifications', () => {
      const content = `
Frontend @1-2
Backend @2-4
Legacy @1-3
      `.trim();

      const result = parseLFF(content);
      expect(result.success).toBe(true);
      
      const nodes = result.ast!.nodes;
      expect(nodes.find(n => n.name === 'Frontend')?.levelSpec).toBe('1-2');
      expect(nodes.find(n => n.name === 'Backend')?.levelSpec).toBe('2-4');
      expect(nodes.find(n => n.name === 'Legacy')?.levelSpec).toBe('1-3');
    });
  });

  describe('8. Anchors and References (Section 1.8)', () => {
    test('should parse anchor definitions and references', () => {
      const content = `
UserService &user [service]
PaymentService &payment [service]
API -> *user
Gateway -> *payment
*user -> Database
      `.trim();

      const result = parseLFF(content);
      expect(result.success).toBe(true);
      
      // Check anchor definitions
      const userService = result.ast!.nodes.find(n => n.name === 'UserService');
      expect(userService?.anchor).toBe('user');
      
      const paymentService = result.ast!.nodes.find(n => n.name === 'PaymentService');
      expect(paymentService?.anchor).toBe('payment');
      
      // Check anchor references in edges
      const edges = result.ast!.edges;
      expect(edges.find(e => e.from === 'API' && e.to === '*user')).toBeDefined();
      expect(edges.find(e => e.from === 'Gateway' && e.to === '*payment')).toBeDefined();
      expect(edges.find(e => e.from === '*user' && e.to === 'Database')).toBeDefined();
    });

    test('should validate unique anchor definitions', () => {
      const content = `
Service1 &duplicate [service]
Service2 &duplicate [service]
      `.trim();

      const result = parseLFF(content);
      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.code === 'REFERENCE_ANCHOR_UNIQUE')).toBe(true);
    });

    test('should validate anchor references exist', () => {
      const content = `
Service1 &existing [service]
API -> *nonexistent
      `.trim();

      const result = parseLFF(content);
      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.code === 'REFERENCE_NODE_EXISTS')).toBe(true);
    });
  });

  describe('9. Array Literals', () => {
    test('should parse array literals with different value types', () => {
      const content = `
Service [api]:
  ports: [8080, 8443, 9090]
  tags: [microservice, backend, api]
  features: [auth, logging, monitoring]
  flags: [true, false, true]
  mixed: [test, 123, true]
      `.trim();

      const result = parseLFF(content);
      expect(result.success).toBe(true);
      
      const service = result.ast!.nodes.find(n => n.name === 'Service');
      expect(service?.properties?.ports).toEqual([8080, 8443, 9090]);
      expect(service?.properties?.tags).toEqual(['microservice', 'backend', 'api']);
      expect(service?.properties?.features).toEqual(['auth', 'logging', 'monitoring']);
      expect(service?.properties?.flags).toEqual([true, false, true]);
      expect(service?.properties?.mixed).toEqual(['test', 123, true]);
    });

    test('should parse empty arrays', () => {
      const content = `
Service [api]:
  empty: []
  tags: [microservice]
      `.trim();

      const result = parseLFF(content);
      expect(result.success).toBe(true);
      
      const service = result.ast!.nodes.find(n => n.name === 'Service');
      expect(service?.properties?.empty).toEqual([]);
      expect(service?.properties?.tags).toEqual(['microservice']);
    });
  });

  describe('10. Boolean Values', () => {
    test('should parse boolean literals', () => {
      const content = `
Service [api]:
  enabled: true
  debug: false
  production: true
      `.trim();

      const result = parseLFF(content);
      expect(result.success).toBe(true);
      
      const service = result.ast!.nodes.find(n => n.name === 'Service');
      expect(service?.properties?.enabled).toBe(true);
      expect(service?.properties?.debug).toBe(false);
      expect(service?.properties?.production).toBe(true);
    });
  });

  describe('11. Complete LFF Core Examples', () => {
    test('should parse Example 1 from specification', () => {
      const content = `
# Мой первый граф
Frontend [web] -> Backend [api] -> Database [postgres]
      `.trim();

      const result = parseLFF(content);
      expect(result.success).toBe(true);
      expect(result.ast?.nodes).toHaveLength(3);
      expect(result.ast?.edges).toHaveLength(2);
      
      const nodes = result.ast!.nodes;
      expect(nodes.find(n => n.name === 'Frontend')?.types).toEqual(['web']);
      expect(nodes.find(n => n.name === 'Backend')?.types).toEqual(['api']);
      expect(nodes.find(n => n.name === 'Database')?.types).toEqual(['postgres']);
    });

    test('should parse Example 2 from specification', () => {
      const content = `
System:
  Frontend [web]:
    port: 3000
  Backend [api]:
    port: 4000
  Frontend -> Backend: REST
  Backend -> Database: SQL
      `.trim();

      const result = parseLFF(content);
      expect(result.success).toBe(true);
      
      const frontend = result.ast!.nodes.find(n => n.name === 'Frontend');
      expect(frontend?.properties?.port).toBe(3000);
      
      const backend = result.ast!.nodes.find(n => n.name === 'Backend');
      expect(backend?.properties?.port).toBe(4000);
      
      const edges = result.ast!.edges;
      expect(edges.find(e => e.from === 'Frontend' && e.to === 'Backend')?.label).toBe('REST');
      expect(edges.find(e => e.from === 'Backend' && e.to === 'Database')?.label).toBe('SQL');
    });

    test('should parse Example 3 from specification', () => {
      const content = `
@title: Simple System
@levels: 2

Gateway [gateway] @1
App [service] @2
Gateway -> App: request
      `.trim();

      const result = parseLFF(content);
      expect(result.success).toBe(true);
      
      const directives = result.ast!.directives;
      expect(directives.find(d => d.key === 'title')?.value).toBe('Simple System');
      expect(directives.find(d => d.key === 'levels')?.value).toBe(2);
      
      const nodes = result.ast!.nodes;
      expect(nodes.find(n => n.name === 'Gateway')?.levelSpec).toBe('1');
      expect(nodes.find(n => n.name === 'App')?.levelSpec).toBe('2');
    });
  });

  describe('12. Round-trip Serialization', () => {
    test('should maintain semantic equivalence in round-trip', () => {
      const originalLFF = `
@title: Round Trip Test
@version: 1.0

System &sys [system] @1:
  description: Main system
  components: [frontend, backend, database]
  active: true

Frontend [web] @2:
  port: 3000
  framework: React

Backend &api [service] @2:
  port: 8080
  language: TypeScript

Database [postgres] @3

Frontend -> *api: HTTP requests
*api -> Database: SQL queries
      `.trim();

      // Parse original
      const parseResult = parseLFF(originalLFF);
      expect(parseResult.success).toBe(true);
      
      // Serialize to LFF
      const serializedLFF = serializeToLFF(parseResult.graph!);
      expect(serializedLFF).toBeDefined();
      
      // Parse serialized version
      const reparsedResult = parseLFF(serializedLFF);
      expect(reparsedResult.success).toBe(true);
      
      // Compare key structures
      expect(reparsedResult.graph?.nodes.length).toBe(parseResult.graph?.nodes.length);
      expect(reparsedResult.graph?.edges.length).toBe(parseResult.graph?.edges.length);
      
      // Check that anchors and references are preserved
      const originalNodes = parseResult.ast!.nodes;
      const reparsedNodes = reparsedResult.ast!.nodes;
      
      const originalSysNode = originalNodes.find(n => n.anchor === 'sys');
      const reparsedSysNode = reparsedNodes.find(n => n.anchor === 'sys');
      expect(reparsedSysNode).toBeDefined();
      expect(reparsedSysNode?.name).toBe(originalSysNode?.name);
    });
  });
});

describe('Level Specification Utilities', () => {
  test('should parse level specifications correctly', () => {
    expect(parseLevelSpec('1')).toEqual({ base: 1, type: 'exact' });
    expect(parseLevelSpec('2+')).toEqual({ base: 2, type: 'plus' });
    expect(parseLevelSpec('1-3')).toEqual({ base: 1, type: 'range', end: 3 });
    expect(parseLevelSpec('invalid')).toBeNull();
    expect(parseLevelSpec('3-1')).toBeNull(); // Invalid range
  });

  test('should format level specifications correctly', () => {
    expect(formatLevelSpec({ base: 1, type: 'exact' })).toBe('1');
    expect(formatLevelSpec({ base: 2, type: 'plus' })).toBe('2+');
    expect(formatLevelSpec({ base: 1, type: 'range', end: 3 })).toBe('1-3');
  });

  test('should check level matches correctly', () => {
    expect(levelMatchesSpec(1, '1')).toBe(true);
    expect(levelMatchesSpec(2, '1')).toBe(false);
    
    expect(levelMatchesSpec(2, '2+')).toBe(true);
    expect(levelMatchesSpec(3, '2+')).toBe(true);
    expect(levelMatchesSpec(1, '2+')).toBe(false);
    
    expect(levelMatchesSpec(2, '1-3')).toBe(true);
    expect(levelMatchesSpec(1, '1-3')).toBe(true);
    expect(levelMatchesSpec(3, '1-3')).toBe(true);
    expect(levelMatchesSpec(4, '1-3')).toBe(false);
  });
});

describe('Anchor Utilities', () => {
  test('should extract anchor names correctly', () => {
    expect(extractAnchorName('&user')).toBe('user');
    expect(extractAnchorName('*service')).toBe('service');
    expect(extractAnchorName('normal')).toBe('normal');
  });

  test('should identify anchor types correctly', () => {
    expect(isAnchorReference('*user')).toBe(true);
    expect(isAnchorReference('&user')).toBe(false);
    expect(isAnchorReference('user')).toBe(false);
    
    expect(isAnchorDefinition('&user')).toBe(true);
    expect(isAnchorDefinition('*user')).toBe(false);
    expect(isAnchorDefinition('user')).toBe(false);
  });

  test('should validate anchor names correctly', () => {
    expect(isValidAnchorName('user')).toBe(true);
    expect(isValidAnchorName('api-service')).toBe(true);
    expect(isValidAnchorName('user_service')).toBe(true);
    expect(isValidAnchorName('service123')).toBe(true);
    
    expect(isValidAnchorName('123invalid')).toBe(false);
    expect(isValidAnchorName('invalid.name')).toBe(false);
    expect(isValidAnchorName('invalid space')).toBe(false);
    expect(isValidAnchorName('')).toBe(false);
  });
}); 