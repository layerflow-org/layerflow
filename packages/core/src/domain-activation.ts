/**
 * Domain Activation System for LayerFlow Core
 * @fileoverview Automatic plugin activation based on domain detection
 * @public
 */

import { EnhancedPluginManager } from './enhanced-plugins';
import { GraphAST } from './types';

/**
 * Domain detection result
 * @public
 */
export interface DomainDetectionResult {
  /** Detected domain name */
  domain: string;
  /** Confidence score (0-1) */
  confidence: number;
  /** Detection source (directive, keyword, pattern) */
  source: 'directive' | 'keyword' | 'pattern';
  /** Line number where detected */
  line?: number;
}

/**
 * Domain activation configuration
 * @public
 */
export interface DomainActivationConfig {
  /** Auto-activate domains on detection */
  autoActivate: boolean;
  /** Minimum confidence threshold for activation */
  confidenceThreshold: number;
  /** Maximum domains to activate simultaneously */
  maxActiveDomains: number;
  /** Domain priority order for conflict resolution */
  domainPriority: string[];
}

/**
 * Domain detector interface for extensible detection strategies
 * @public
 */
export interface DomainDetector {
  /** Detector name */
  name: string;
  /** Detect domains in text content */
  detect(content: string): DomainDetectionResult[];
}

/**
 * Built-in directive detector (@domain:, @c4:, @k8s:, etc.)
 * @public
 */
export class DirectiveDetector implements DomainDetector {
  name = 'directive';

  detect(content: string): DomainDetectionResult[] {
    const results: DomainDetectionResult[] = [];
    const lines = content.split('\n');

    lines.forEach((line, _index) => {
      // Detect explicit @domain: directives
      const domainMatch = line.match(/@domain:\s*([a-zA-Z0-9-_]+)/);
      if (domainMatch) {
        results.push({
          domain: domainMatch[1],
          confidence: 1.0,
          source: 'directive',
          line: _index + 1
        });
      }

      // Detect domain-prefixed directives (@c4:, @k8s:, @bpmn:)
      const prefixMatch = line.match(/@([a-zA-Z0-9-_]+):/);
      if (prefixMatch) {
        const domain = prefixMatch[1];
        // Skip common non-domain directives and the 'domain' keyword itself
        if (!['level', 'style', 'nav', 'link', 'docs', 'domain'].includes(domain)) {
          results.push({
            domain,
            confidence: 0.9,
            source: 'directive',
            line: _index + 1
          });
        }
      }
    });

    return results;
  }
}

/**
 * Keyword-based domain detector
 * @public
 */
export class KeywordDetector implements DomainDetector {
  name = 'keyword';

  private domainKeywords = new Map<string, string[]>([
    ['c4', ['person', 'system', 'container', 'component', 'relationship']],
    ['k8s', ['deployment', 'service', 'pod', 'namespace', 'ingress', 'configmap']],
    ['bpmn', ['process', 'task', 'gateway', 'event', 'sequence-flow']],
    ['ddd', ['aggregate', 'entity', 'value-object', 'domain-service', 'repository']],
    ['aws', ['ec2', 'lambda', 's3', 'rds', 'vpc', 'cloudformation']],
    ['terraform', ['resource', 'provider', 'variable', 'output', 'module']]
  ]);

  detect(content: string): DomainDetectionResult[] {
    const results: DomainDetectionResult[] = [];
    const lines = content.split('\n');
    const domainScores = new Map<string, number>();

    lines.forEach((line, _index) => {
      const lowerLine = line.toLowerCase();
      for (const [domain, keywords] of this.domainKeywords) {
        for (const keyword of keywords) {
          // Use word boundaries to match exact words, not substrings
          const regex = new RegExp(`\\b${keyword}\\b`, 'i');
          if (regex.test(lowerLine)) {
            const currentScore = domainScores.get(domain) || 0;
            domainScores.set(domain, currentScore + 1);
          }
        }
      }
    });

    // Convert scores to confidence and create results
    for (const [domain, score] of domainScores) {
      if (score > 0) {
        const confidence = Math.round(Math.min(score * 0.2, 0.8) * 100) / 100; // Round to 2 decimal places
        results.push({
          domain,
          confidence,
          source: 'keyword'
        });
      }
    }

    return results;
  }
}

/**
 * Domain Activator - Core domain activation logic
 * @public
 */
export class DomainActivator {
  private detectors: DomainDetector[] = [];
  private activeDomains = new Set<string>();
  private config: DomainActivationConfig;

  constructor(
    private pluginManager: EnhancedPluginManager,
    config: Partial<DomainActivationConfig> = {}
  ) {
    this.config = {
      autoActivate: true,
      confidenceThreshold: 0.7,
      maxActiveDomains: 10,
      domainPriority: ['c4', 'k8s', 'bpmn', 'ddd', 'aws', 'terraform'],
      ...config
    };

    // Register built-in detectors
    this.addDetector(new DirectiveDetector());
    this.addDetector(new KeywordDetector());
  }

  /**
   * Add custom domain detector
   * @param detector - Domain detector to add
   */
  addDetector(detector: DomainDetector): void {
    this.detectors.push(detector);
  }

  /**
   * Detect domains in content
   * @param content - Text content to analyze
   * @returns Array of detection results
   */
  detectDomains(content: string): DomainDetectionResult[] {
    const allResults: DomainDetectionResult[] = [];

    for (const detector of this.detectors) {
      const results = detector.detect(content);
      allResults.push(...results);
    }

    // Merge results by domain and take highest confidence
    const domainMap = new Map<string, DomainDetectionResult>();
    for (const result of allResults) {
      const existing = domainMap.get(result.domain);
      if (!existing || result.confidence > existing.confidence) {
        domainMap.set(result.domain, result);
      }
    }

    return Array.from(domainMap.values())
      .filter(result => result.confidence >= this.config.confidenceThreshold)
      .sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Activate domain and load associated plugins
   * @param domain - Domain to activate
   * @param graph - Optional graph context for domain-specific initialization
   */
  async activateDomain(domain: string, graph?: GraphAST): Promise<void> {
    if (this.activeDomains.has(domain)) {
      return; // Already active
    }

    if (this.activeDomains.size >= this.config.maxActiveDomains) {
      throw new Error(`Maximum active domains (${this.config.maxActiveDomains}) reached`);
    }

    // Mark as active
    this.activeDomains.add(domain);

    // Trigger domain activation hooks in plugin manager
    await this.pluginManager.activateDomain(domain);

    // Domain-specific initialization
    if (graph) {
      await this.initializeDomainForGraph(domain, graph);
    }
  }

  /**
   * Deactivate domain
   * @param domain - Domain to deactivate
   */
  async deactivateDomain(domain: string): Promise<void> {
    if (!this.activeDomains.has(domain)) {
      return;
    }

    this.activeDomains.delete(domain);
    await this.pluginManager.deactivateDomain(domain);
  }

  /**
   * Get currently active domains
   * @returns Array of active domain names
   */
  getActiveDomains(): string[] {
    return Array.from(this.activeDomains);
  }

  /**
   * Auto-activate domains based on content analysis
   * @param content - Content to analyze
   * @param graph - Optional graph context
   * @returns Array of activated domains
   */
  async autoActivate(content: string, graph?: GraphAST): Promise<string[]> {
    if (!this.config.autoActivate) {
      return [];
    }

    const detectedDomains = this.detectDomains(content);
    const activatedDomains: string[] = [];

    // Sort by priority and confidence
    const sortedDomains = detectedDomains.sort((a, b) => {
      const aPriority = this.config.domainPriority.indexOf(a.domain);
      const bPriority = this.config.domainPriority.indexOf(b.domain);
      
      if (aPriority !== -1 && bPriority !== -1) {
        return aPriority - bPriority; // Higher priority first
      }
      if (aPriority !== -1) return -1;
      if (bPriority !== -1) return 1;
      
      return b.confidence - a.confidence; // Higher confidence first
    });

    for (const result of sortedDomains) {
      try {
        await this.activateDomain(result.domain, graph);
        activatedDomains.push(result.domain);
      } catch (error) {
        console.warn(`Failed to activate domain ${result.domain}:`, error);
      }
    }

    return activatedDomains;
  }

  /**
   * Initialize domain-specific features for a graph
   * @private
   */
  private async initializeDomainForGraph(domain: string, graph: GraphAST): Promise<void> {
    // Domain-specific graph initialization
    // This can be extended by plugins
    
    // Apply domain-specific validation rules
    for (const node of graph.nodes) {
      if (node.type && node.type.includes(':')) {
        const [nodeDomain] = node.type.split(':');
        if (nodeDomain === domain) {
          // TODO: Apply domain-specific node processing
          // Future: Use this.pluginManager.getTypesByDomain(domain) and getDirectivesByDomain(domain)
        }
      }
    }
  }
}

/**
 * Convenience function to create domain activator with default configuration
 * @param pluginManager - Enhanced plugin manager instance
 * @param config - Optional configuration overrides
 * @returns Configured domain activator
 */
export function createDomainActivator(
  pluginManager: EnhancedPluginManager,
  config?: Partial<DomainActivationConfig>
): DomainActivator {
  return new DomainActivator(pluginManager, config);
} 