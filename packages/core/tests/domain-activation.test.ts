/// <reference types="jest" />

/**
 * Tests for Domain Activation System
 * @fileoverview Testing automatic domain detection and activation
 */

import { 
  DomainActivator, 
  DirectiveDetector, 
  KeywordDetector,
  DomainDetectionResult,
  createDomainActivator
} from '../src/domain-activation';
import { EnhancedPluginManager } from '../src/enhanced-plugins';

describe('DirectiveDetector', () => {
  let detector: DirectiveDetector;

  beforeEach(() => {
    detector = new DirectiveDetector();
  });

  it('should detect explicit @domain: directives', () => {
    const content = `
@domain: c4
@level: 1

person: User
system: E-commerce
    `;

    const results = detector.detect(content);
    
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({
      domain: 'c4',
      confidence: 1.0,
      source: 'directive',
      line: 2
    });
  });

  it('should detect domain-prefixed directives', () => {
    const content = `
@c4: context
@k8s: namespace production
@bpmn: process order-fulfillment
    `;

    const results = detector.detect(content);
    
    expect(results).toHaveLength(3);
    expect(results.map(r => r.domain)).toEqual(['c4', 'k8s', 'bpmn']);
    expect(results.every(r => r.confidence === 0.9)).toBe(true);
    expect(results.every(r => r.source === 'directive')).toBe(true);
  });

  it('should skip common non-domain directives', () => {
    const content = `
@level: 1
@style: color=blue
@nav: up
@link: https://example.com
@docs: README.md
    `;

    const results = detector.detect(content);
    
    expect(results).toHaveLength(0);
  });
});

describe('KeywordDetector', () => {
  let detector: KeywordDetector;

  beforeEach(() => {
    detector = new KeywordDetector();
  });

  it('should detect C4 keywords', () => {
    const content = `
person: Customer
system: Payment Gateway
container: Web Application
component: Authentication Service
relationship: uses
    `;

    const results = detector.detect(content);
    
    // Filter only results above confidence threshold (0.7 by default)
    const significantResults = results.filter(r => r.confidence >= 0.7);
    
    expect(significantResults).toHaveLength(1);
    expect(significantResults[0].domain).toBe('c4');
    expect(significantResults[0].confidence).toBe(0.8); // 5 keywords * 0.2 = 1.0, but capped at 0.8
    expect(significantResults[0].source).toBe('keyword');
  });

  it('should detect Kubernetes keywords', () => {
    const content = `
deployment: web-app
service: api-service
pod: worker-pod
    `;

    const results = detector.detect(content);
    
    expect(results).toHaveLength(1);
    expect(results[0].domain).toBe('k8s');
    expect(results[0].confidence).toBe(0.6); // 3 keywords * 0.2 = 0.6
  });

  it('should detect multiple domains', () => {
    const content = `
# C4 Architecture
person: User
system: API Gateway

# Kubernetes Deployment  
deployment: web-app
service: api-service

# BPMN Process
process: order-fulfillment
task: validate-payment
    `;

    const results = detector.detect(content);
    
    expect(results).toHaveLength(3);
    const domains = results.map(r => r.domain).sort();
    expect(domains).toEqual(['bpmn', 'c4', 'k8s']);
  });

  it('should cap confidence at 0.8 for keyword detection', () => {
    const content = `
person: User
system: API
container: Web
component: Auth
relationship: uses
person: Admin
system: Database
container: Cache
component: Logger
relationship: connects
    `;

    const results = detector.detect(content);
    
    expect(results).toHaveLength(1);
    expect(results[0].domain).toBe('c4');
    expect(results[0].confidence).toBe(0.8); // Capped at 0.8
  });
});

describe('DomainActivator', () => {
  let pluginManager: EnhancedPluginManager;
  let activator: DomainActivator;

  beforeEach(() => {
    pluginManager = new EnhancedPluginManager();
    activator = new DomainActivator(pluginManager);
  });

  describe('Domain Detection', () => {
    it('should detect domains from content', () => {
      const content = `
@domain: c4
person: Customer
system: Payment Gateway
      `;

      const results = activator.detectDomains(content);
      
      expect(results).toHaveLength(1);
      expect(results[0].domain).toBe('c4');
      expect(results[0].confidence).toBe(1.0); // Directive detection wins
    });

    it('should merge results and take highest confidence', () => {
      const content = `
@c4: context
person: Customer
system: Payment Gateway
container: Web App
component: Auth Service
relationship: uses
      `;

      const results = activator.detectDomains(content);
      
      expect(results).toHaveLength(1);
      expect(results[0].domain).toBe('c4');
      expect(results[0].confidence).toBe(0.9); // Directive detection gives 0.9, keyword gives 0.8
    });

    it('should filter by confidence threshold', () => {
      const lowConfidenceActivator = new DomainActivator(pluginManager, {
        confidenceThreshold: 0.8
      });

      const content = `
deployment: web-app
service: api-service
      `;

      const results = lowConfidenceActivator.detectDomains(content);
      
      expect(results).toHaveLength(0); // 0.4 confidence < 0.8 threshold
    });

    it('should sort results by confidence', () => {
      const content = `
@c4: context
deployment: web-app
service: api-service
pod: worker-pod
namespace: production
      `;

      const results = activator.detectDomains(content);
      
      expect(results).toHaveLength(2);
      expect(results[0].domain).toBe('c4'); // Higher confidence first
      expect(results[1].domain).toBe('k8s');
    });
  });

  describe('Domain Activation', () => {
    it('should activate domain successfully', async () => {
      await activator.activateDomain('c4');
      
      const activeDomains = activator.getActiveDomains();
      expect(activeDomains).toContain('c4');
    });

    it('should not activate same domain twice', async () => {
      await activator.activateDomain('c4');
      await activator.activateDomain('c4'); // Should not throw
      
      const activeDomains = activator.getActiveDomains();
      expect(activeDomains.filter(d => d === 'c4')).toHaveLength(1);
    });

    it('should respect maximum active domains limit', async () => {
      const limitedActivator = new DomainActivator(pluginManager, {
        maxActiveDomains: 2
      });

      await limitedActivator.activateDomain('c4');
      await limitedActivator.activateDomain('k8s');
      
      await expect(limitedActivator.activateDomain('bpmn'))
        .rejects.toThrow('Maximum active domains (2) reached');
    });

    it('should deactivate domain successfully', async () => {
      await activator.activateDomain('c4');
      await activator.deactivateDomain('c4');
      
      const activeDomains = activator.getActiveDomains();
      expect(activeDomains).not.toContain('c4');
    });
  });

  describe('Auto Activation', () => {
    it('should auto-activate domains based on content', async () => {
      const content = `
@domain: c4
person: Customer
system: Payment Gateway
      `;

      const activatedDomains = await activator.autoActivate(content);
      
      expect(activatedDomains).toContain('c4');
      expect(activator.getActiveDomains()).toContain('c4');
    });

    it('should respect domain priority order', async () => {
      const priorityActivator = new DomainActivator(pluginManager, {
        domainPriority: ['k8s', 'c4', 'bpmn']
      });

      const content = `
@c4: context
@k8s: namespace
@bpmn: process
      `;

      const activatedDomains = await priorityActivator.autoActivate(content);
      
      expect(activatedDomains[0]).toBe('k8s'); // Highest priority
      expect(activatedDomains[1]).toBe('c4');
      expect(activatedDomains[2]).toBe('bpmn');
    });

    it('should not auto-activate when disabled', async () => {
      const manualActivator = new DomainActivator(pluginManager, {
        autoActivate: false
      });

      const content = `
@domain: c4
person: Customer
      `;

      const activatedDomains = await manualActivator.autoActivate(content);
      
      expect(activatedDomains).toHaveLength(0);
      expect(manualActivator.getActiveDomains()).toHaveLength(0);
    });

    it('should handle activation failures gracefully', async () => {
      // Mock plugin manager to throw error
      jest.spyOn(pluginManager, 'activateDomain').mockRejectedValue(new Error('Plugin not found'));

      const content = `@domain: c4`;
      const activatedDomains = await activator.autoActivate(content);
      
      expect(activatedDomains).toHaveLength(0);
    });
  });

  describe('Custom Detectors', () => {
    it('should support custom domain detectors', () => {
      const customDetector = {
        name: 'custom',
        detect: (content: string): DomainDetectionResult[] => {
          if (content.includes('custom-keyword')) {
            return [{
              domain: 'custom',
              confidence: 0.9,
              source: 'pattern' as const
            }];
          }
          return [];
        }
      };

      activator.addDetector(customDetector);

      const content = 'This has a custom-keyword in it';
      const results = activator.detectDomains(content);
      
      expect(results).toHaveLength(1);
      expect(results[0].domain).toBe('custom');
      expect(results[0].source).toBe('pattern');
    });
  });
});

describe('Integration Tests', () => {
  let pluginManager: EnhancedPluginManager;
  let activator: DomainActivator;

  beforeEach(() => {
    pluginManager = new EnhancedPluginManager();
    activator = new DomainActivator(pluginManager);

    // Register some test types and directives
    pluginManager.registerNodeType({
      name: 'person',
      domain: 'c4',
      description: 'C4 Person'
    });

    pluginManager.registerDirective({
      name: 'context',
      domain: 'c4',
      parser: (content) => ({ content }),
      validator: (_directive, graph) => {
        const persons = graph.nodes.filter(n => n.type === 'person');
        if (persons.length === 0) {
          return [{ path: 'context', message: 'No persons', code: 'NO_PERSONS' }];
        }
        return [];
      }
    });
  });

  it('should integrate domain activation with plugin manager', async () => {
    const content = `
@domain: c4
person: Customer
    `;

    await activator.autoActivate(content);
    
    expect(activator.getActiveDomains()).toContain('c4');
    
    // Verify types and directives are available
    const c4Types = pluginManager.getTypesByDomain('c4');
    const c4Directives = pluginManager.getDirectivesByDomain('c4');
    
    expect(c4Types).toHaveLength(1);
    expect(c4Types[0].name).toBe('person');
    expect(c4Directives).toHaveLength(1);
    expect(c4Directives[0].name).toBe('context');
  });
});

describe('createDomainActivator', () => {
  it('should create domain activator with default configuration', () => {
    const pluginManager = new EnhancedPluginManager();
    const activator = createDomainActivator(pluginManager);
    
    expect(activator).toBeInstanceOf(DomainActivator);
    expect(activator.getActiveDomains()).toHaveLength(0);
  });

  it('should create domain activator with custom configuration', () => {
    const pluginManager = new EnhancedPluginManager();
    const activator = createDomainActivator(pluginManager, {
      autoActivate: false,
      maxActiveDomains: 5
    });
    
    expect(activator).toBeInstanceOf(DomainActivator);
  });
}); 