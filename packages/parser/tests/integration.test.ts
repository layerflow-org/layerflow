/**
 * Comprehensive Integration Tests
 * @fileoverview Complete integration test suite for the entire LFF parser pipeline
 */

import { parseLFF, createParser, LFFParser, LFFLexer } from '../src';
import { CSTToASTConverter } from '../src/cst-to-ast';
import { ASTConverter } from '../src/ast-converter';
import { LFFSerializer } from '../src/lff-serializer';

describe('LFF Parser Integration', () => {
  describe('Full Pipeline Tests', () => {
    test('should parse, convert, and serialize complete LFF document', async () => {
      const lffDocument = `
@title: "E-commerce Platform"
@version: 2.1
@domain: web
@author: "Architecture Team"

# Frontend Layer
Frontend &ui [web, react] @1:
  framework: react
  version: "18.2"
  components: ["Header", "ProductList", "Cart", "Checkout"]
  features:
    routing: true
    state_management: redux
    testing: jest

# Backend Services
Backend &api [service, nodejs] @2:
  runtime: nodejs
  version: "18.0"
  database: postgresql
  cache: redis
  auth: jwt
  endpoints:
    - "/api/products"
    - "/api/users"
    - "/api/orders"

# Data Layer
Database &db [storage, postgresql] @3:
  engine: postgresql
  version: "14.0"
  tables: ["users", "products", "orders"]
  
Cache &cache [storage, redis] @3:
  engine: redis
  version: "7.0"
  purpose: session_storage

# External Services
PaymentGateway &payment [external] @4:
  provider: stripe
  api_version: "2023-10-16"

# Connections
*ui -> *api: "REST API calls"
*api -> *db: "SQL queries"
*api -> *cache: "Session management"
*api -> *payment: "Payment processing"
*ui <-> *api: "WebSocket for real-time updates"
      `.trim();

      // Test full pipeline
      const result = parseLFF(lffDocument);
      
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.ast).toBeDefined();
      
      // Verify metadata
      expect(result.ast?.metadata?.title).toBe('"E-commerce Platform"');
      expect(result.ast?.metadata?.version).toBe('2.1');
      expect(result.ast?.metadata?.domain).toBe('web');
      expect(result.ast?.metadata?.author).toBe('"Architecture Team"');
      
      // Verify nodes
      expect(result.ast?.nodes).toHaveLength(5);
      const frontendNode = result.ast?.nodes.find(n => n.name === 'Frontend');
      expect(frontendNode?.anchor).toBe('ui');
      expect(frontendNode?.nodeTypes).toEqual(['web', 'react']);
      expect(frontendNode?.level).toBe('@1');
      expect(frontendNode?.properties?.framework).toBe('react');
      
      // Verify edges
      expect(result.ast?.edges).toHaveLength(5);
      const restEdge = result.ast?.edges.find(e => e.label === '"REST API calls"');
      expect(restEdge?.from).toBe('*ui');
      expect(restEdge?.to).toBe('*api');
      expect(restEdge?.arrow).toBe('->');
      
      // Test serialization round-trip
      if (result.ast) {
        const serializer = new LFFSerializer();
        const serialized = serializer.serialize(result.ast);
        
        expect(serialized).toContain('@title: "E-commerce Platform"');
        expect(serialized).toContain('Frontend &ui [web, react] @1:');
        expect(serialized).toContain('framework: react');
        expect(serialized).toContain('*ui -> *api: "REST API calls"');
      }
    });

    test('should handle complex nested structures', async () => {
      const complexDocument = `
@title: "Microservices Architecture"

# Application Layer
Application:
  Frontend:
    WebApp &webapp [spa, react]:
      framework: react
      bundler: webpack
      testing: cypress
    MobileApp &mobile [mobile, react-native]:
      framework: react-native
      platform: ["ios", "android"]
  
  Backend:
    APIGateway &gateway [gateway, nginx]:
      proxy: nginx
      load_balancer: true
    
    Services:
      UserService &users [service, nodejs]:
        database: postgresql
        cache: redis
      ProductService &products [service, python]:
        database: mongodb
        search: elasticsearch
      OrderService &orders [service, java]:
        database: postgresql
        messaging: rabbitmq

# Infrastructure Layer  
Infrastructure @3:
  Database:
    PostgreSQL &postgres [database]:
      version: "14.0"
      replicas: 2
    MongoDB &mongo [database]:
      version: "6.0"
      sharding: true
    
  Cache:
    Redis &redis [cache]:
      version: "7.0"
      cluster: true
  
  Messaging:
    RabbitMQ &rabbitmq [queue]:
      version: "3.11"
      clustering: true

# Connections
*webapp -> *gateway: "HTTPS"
*mobile -> *gateway: "HTTPS"
*gateway -> *users: "HTTP"
*gateway -> *products: "HTTP"
*gateway -> *orders: "HTTP"
*users -> *postgres: "SQL"
*products -> *mongo: "NoSQL"
*orders -> *postgres: "SQL"
*users -> *redis: "Cache"
*orders -> *rabbitmq: "Events"
      `.trim();

      const result = parseLFF(complexDocument);
      
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.ast?.nodes.length).toBeGreaterThan(10);
      expect(result.ast?.edges.length).toBeGreaterThan(8);
      
      // Verify nested structure handling
      const appNode = result.ast?.nodes.find(n => n.name === 'Application');
      expect(appNode).toBeDefined();
      
      // Verify anchor resolution
      const httpsEdges = result.ast?.edges.filter(e => e.label === '"HTTPS"');
      expect(httpsEdges).toHaveLength(2);
    });

    test('should handle error recovery and partial parsing', () => {
      const documentWithErrors = `
@title: "Test with Errors"

# Valid content
Frontend [web] -> Backend [api]

# Invalid syntax
Backend [api -> Database  # Missing closing bracket
Service [  # Incomplete

# More valid content after errors
Cache [redis]
Frontend -> Cache
      `.trim();

      const result = parseLFF(documentWithErrors);
      
      // Should not crash and should provide partial results
      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      // Should still parse valid parts
      expect(result.ast?.nodes.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Tests', () => {
    test('should handle large documents efficiently', async () => {
      // Generate large document
      const largeDocument = [
        '@title: "Large Architecture"',
        '@version: 1.0',
        '',
        // Generate 500 nodes
        ...Array.from({ length: 500 }, (_, i) => 
          `Service${i} &svc${i} [service] @${Math.floor(i / 50) + 1}:`
        ),
        '',
        // Generate 499 edges
        ...Array.from({ length: 499 }, (_, i) => 
          `*svc${i} -> *svc${i + 1}: "Connection ${i}"`
        )
      ].join('\n');

      const startTime = performance.now();
      const result = parseLFF(largeDocument);
      const endTime = performance.now();

      expect(result.success).toBe(true);
      expect(result.ast?.nodes).toHaveLength(500);
      expect(result.ast?.edges).toHaveLength(499);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete in < 5s
    });

    test('should handle deeply nested structures', () => {
      // Generate deeply nested structure
      const deepNesting = Array.from({ length: 20 }, (_, i) => 
        '  '.repeat(i) + `Level${i}:`
      ).join('\n') + '\n' + '  '.repeat(20) + 'DeepNode';

      const result = parseLFF(deepNesting);
      
      expect(result.success).toBe(true);
      expect(result.ast?.nodes.length).toBeGreaterThan(0);
    });

    test('should handle many concurrent parsing operations', async () => {
      const documents = Array.from({ length: 10 }, (_, i) => 
        `@title: "Document ${i}"\nService${i} -> Database${i}`
      );

      const startTime = performance.now();
      const results = await Promise.all(
        documents.map(doc => Promise.resolve(parseLFF(doc)))
      );
      const endTime = performance.now();

      expect(results).toHaveLength(10);
      expect(results.every(r => r.success)).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in < 1s
    });
  });

  describe('Edge Cases and Robustness', () => {
    test('should handle empty and whitespace-only documents', () => {
      const emptyResults = [
        parseLFF(''),
        parseLFF('   '),
        parseLFF('\n\n\n'),
        parseLFF('\t\t\t'),
        parseLFF('# Only comments\n# More comments')
      ];

      emptyResults.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.ast?.nodes).toHaveLength(0);
        expect(result.ast?.edges).toHaveLength(0);
      });
    });

    test('should handle unicode and special characters', () => {
      const unicodeDocument = `
@title: "Architecture with émojis 🚀"
@description: "Supports unicode: αβγ, 中文, العربية"

Frontend_🌐 [web]:
  name: "Frontend with émojis"
  description: "Supports unicode: αβγ"

Backend_⚡ [api]:
  name: "Backend with symbols"
  
Frontend_🌐 -> Backend_⚡: "Unicode connection 🔗"
      `.trim();

      const result = parseLFF(unicodeDocument);
      
      expect(result.success).toBe(true);
      expect(result.ast?.nodes).toHaveLength(2);
      expect(result.ast?.edges).toHaveLength(1);
    });

    test('should handle very long lines', () => {
      const longLine = 'Service_' + 'x'.repeat(1000) + ' [web] -> Database_' + 'y'.repeat(1000);
      const result = parseLFF(longLine);
      
      expect(result.success).toBe(true);
      expect(result.ast?.nodes).toHaveLength(2);
      expect(result.ast?.edges).toHaveLength(1);
    });

    test('should handle mixed line endings', () => {
      const mixedLineEndings = 'Frontend [web]\r\nBackend [api]\nDatabase [storage]\r\nFrontend -> Backend\r\nBackend -> Database';
      const result = parseLFF(mixedLineEndings);
      
      expect(result.success).toBe(true);
      expect(result.ast?.nodes).toHaveLength(3);
      expect(result.ast?.edges).toHaveLength(2);
    });

    test('should handle malformed but recoverable syntax', () => {
      const malformedDocument = `
@title "Missing colon"
@version: 1.0

Frontend [web  # Missing closing bracket
Backend [api]

Frontend -> Backend  # This should still work
      `.trim();

      const result = parseLFF(malformedDocument);
      
      // Should provide partial results even with errors
      expect(result).toBeDefined();
      expect(result.ast?.nodes.length).toBeGreaterThan(0);
    });
  });

  describe('Parser Configuration and Options', () => {
    test('should respect parser configuration options', () => {
      const parser = createParser({
        enableCaching: false,
        strictMode: true,
        validateAnchors: true
      });

      const document = `
Frontend &ui [web]
*missing -> *ui  # Invalid anchor reference
      `.trim();

      const result = parser.parse(document);
      
      // Strict mode should catch anchor validation errors
      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.code?.includes('ANCHOR'))).toBe(true);
    });

    test('should handle different output formats', () => {
      const document = 'Frontend [web] -> Backend [api]';
      
      const parser = createParser();
      const cstResult = parser.parseToCST(document);
      const astResult = parser.parse(document);
      
      expect(cstResult.success).toBe(true);
      expect(cstResult.cst).toBeDefined();
      
      expect(astResult.success).toBe(true);
      expect(astResult.ast).toBeDefined();
    });

    test('should support custom lexer configuration', () => {
      const lexer = new LFFLexer();
      const parser = new LFFParser();
      parser.setLexer(lexer);
      
      const document = 'Frontend [web] -> Backend [api]';
      const result = parser.parseToCST(document);
      
      expect(result.success).toBe(true);
      expect(result.cst).toBeDefined();
    });
  });

  describe('Real-world Scenarios', () => {
    test('should parse typical web application architecture', () => {
      const webAppArchitecture = `
@title: "Modern Web Application"
@version: 1.0
@domain: web

# Client Layer
WebClient &client [spa, react] @1:
  framework: react
  state: redux
  routing: react-router

# API Layer
APIGateway &gateway [gateway] @2:
  technology: nginx
  ssl: true

# Service Layer
AuthService &auth [service] @3:
  technology: nodejs
  database: postgresql
  
UserService &users [service] @3:
  technology: nodejs
  database: postgresql
  
ProductService &products [service] @3:
  technology: python
  database: mongodb

# Data Layer
PostgreSQL &postgres [database] @4:
  version: "14.0"
  
MongoDB &mongo [database] @4:
  version: "6.0"

# Connections
*client -> *gateway: "HTTPS"
*gateway -> *auth: "HTTP"
*gateway -> *users: "HTTP"
*gateway -> *products: "HTTP"
*auth -> *postgres: "SQL"
*users -> *postgres: "SQL"
*products -> *mongo: "NoSQL"
      `.trim();

      const result = parseLFF(webAppArchitecture);
      
      expect(result.success).toBe(true);
      expect(result.ast?.nodes).toHaveLength(7);
      expect(result.ast?.edges).toHaveLength(7);
      
      // Verify levels are correctly parsed
      const levels = result.ast?.nodes.map(n => n.level).filter(Boolean);
      expect(levels).toContain('@1');
      expect(levels).toContain('@2');
      expect(levels).toContain('@3');
      expect(levels).toContain('@4');
    });

    test('should parse microservices architecture', () => {
      const microservicesArchitecture = `
@title: "Microservices Platform"
@pattern: microservices

# API Gateway
Gateway &gw [gateway, kong] @1:
  load_balancing: true
  rate_limiting: true

# Core Services
UserService &users [service] @2:
  language: java
  framework: spring-boot
  
OrderService &orders [service] @2:
  language: nodejs
  framework: express
  
PaymentService &payments [service] @2:
  language: python
  framework: fastapi

# Data Stores
UserDB &userdb [database, postgresql] @3
OrderDB &orderdb [database, mongodb] @3
PaymentDB &paymentdb [database, postgresql] @3

# Message Queue
EventBus &events [queue, rabbitmq] @3:
  clustering: true

# Connections
*gw -> *users
*gw -> *orders
*gw -> *payments
*users -> *userdb
*orders -> *orderdb
*payments -> *paymentdb
*orders -> *events: "Order events"
*payments -> *events: "Payment events"
      `.trim();

      const result = parseLFF(microservicesArchitecture);
      
      expect(result.success).toBe(true);
      expect(result.ast?.nodes).toHaveLength(8);
      expect(result.ast?.edges).toHaveLength(8);
      
      // Verify microservices pattern
      const services = result.ast?.nodes.filter(n => 
        n.nodeTypes?.includes('service')
      );
      expect(services).toHaveLength(3);
    });

    test('should parse cloud-native architecture', () => {
      const cloudNativeArchitecture = `
@title: "Cloud-Native Application"
@platform: kubernetes
@cloud: aws

# Ingress
LoadBalancer &lb [ingress, alb] @1:
  ssl_termination: true

# Application Pods
WebApp &webapp [pod, nodejs] @2:
  replicas: 3
  resources:
    cpu: "500m"
    memory: "512Mi"

API &api [pod, python] @2:
  replicas: 5
  resources:
    cpu: "1000m"
    memory: "1Gi"

# Managed Services
Database &db [managed, rds] @3:
  engine: postgresql
  multi_az: true

Cache &cache [managed, elasticache] @3:
  engine: redis
  cluster_mode: true

# Storage
ObjectStore &s3 [storage, s3] @3:
  versioning: true
  encryption: true

# Connections
*lb -> *webapp: "HTTP/HTTPS"
*lb -> *api: "HTTP/HTTPS"
*webapp -> *api: "Internal HTTP"
*api -> *db: "PostgreSQL"
*api -> *cache: "Redis"
*webapp -> *s3: "Static assets"
      `.trim();

      const result = parseLFF(cloudNativeArchitecture);
      
      expect(result.success).toBe(true);
      expect(result.ast?.nodes).toHaveLength(6);
      expect(result.ast?.edges).toHaveLength(6);
      
      // Verify cloud-native metadata
      expect(result.ast?.metadata?.platform).toBe('kubernetes');
      expect(result.ast?.metadata?.cloud).toBe('aws');
    });
  });

  describe('Error Scenarios and Recovery', () => {
    test('should provide helpful error messages', () => {
      const invalidDocuments = [
        {
          content: 'Frontend [web -> Backend',
          expectedError: 'Missing closing bracket'
        },
        {
          content: '*undefined -> Backend',
          expectedError: 'Undefined anchor'
        },
        {
          content: '@invalid_directive',
          expectedError: 'Invalid directive'
        }
      ];

      invalidDocuments.forEach(({ content, expectedError }) => {
        const result = parseLFF(content);
        
        expect(result.success).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        // Error messages should be helpful (basic check)
        expect(result.errors[0].message).toBeDefined();
      });
    });

    test('should handle parser state recovery', () => {
      const documentWithMultipleErrors = `
@title: "Error Recovery Test"

Frontend [web  # Error 1: Missing bracket
Backend [api]

Invalid syntax here  # Error 2: Invalid syntax

Service [database] -> Cache [redis]  # This should still parse
      `.trim();

      const result = parseLFF(documentWithMultipleErrors);
      
      // Should collect multiple errors but continue parsing
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.ast?.nodes.length).toBeGreaterThan(0);
    });
  });
}); 