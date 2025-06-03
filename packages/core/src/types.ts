/**
 * Core types and interfaces for LayerFlow
 * @fileoverview Defines the fundamental data structures for layered architecture graphs
 * @public
 */

/**
 * Represents a node in the LayerFlow graph
 * @public
 */
export interface GraphNode {
  /** Unique identifier for the node */
  id: string;
  /** Human-readable label for the node */
  label: string;
  /** Optional legacy name field */
  name?: string;
  /** Type classification of the node (e.g., 'service', 'database', 'frontend') */
  type?: string;
  /** Layer level for hierarchical organization (0-based) */
  level?: number;
  /** Parent node ID for hierarchical structures */
  parentId?: string | undefined;
  /** Additional metadata for the node */
  metadata?: Record<string, any>;
}

/**
 * Represents an edge (connection) between two nodes in the graph
 * @public
 */
export interface Edge {
  /** Optional identifier for the edge */
  id?: string;
  /** Source node identifier */
  from: string;
  /** Target node identifier */
  to: string;
  /** Type of connection (e.g., 'http', 'database', 'async') */
  type?: string;
  /** Optional label for the edge */
  label?: string;
  /** Additional metadata for the edge */
  metadata?: Record<string, any>;
}

/**
 * Main Abstract Syntax Tree structure for LayerFlow graphs
 * @public
 */
export interface GraphAST {
  /** Collection of nodes in the graph */
  nodes: GraphNode[];
  /** Collection of edges connecting the nodes */
  edges: Edge[];
  /** Layer definitions for explicit level management */
  layers?: LayerDefinition[];
  /** Graph-level metadata and configuration */
  metadata?: GraphMetadata;
}

/**
 * Metadata container for graph-level information
 * @public
 */
export interface GraphMetadata {
  /** Title of the graph */
  title?: string;
  /** Description of the graph */
  description?: string;
  /** Version of the graph format */
  version?: string;
  /** Creation timestamp */
  created?: string;
  /** Last modification timestamp */
  modified?: string;
  /** Tags for categorization */
  tags?: string[];
  /** Additional custom metadata */
  [key: string]: any;
}

/**
 * Definition for a layer in the hierarchical structure
 * @public
 */
export interface LayerDefinition {
  /** Layer level (0-based) */
  level: number;
  /** Human-readable title for the layer */
  title?: string;
  /** Detailed description of the layer */
  description?: string;
  /** Visual styling information */
  style?: LayerStyle;
  /** Whether the layer is visible in visualizations */
  visible?: boolean;
}

/**
 * Styling information for layers
 * @public
 */
export interface LayerStyle {
  /** Background color for the layer */
  backgroundColor?: string;
  /** Text color for layer elements */
  textColor?: string;
  /** Border color for the layer */
  borderColor?: string;
  /** Opacity level (0-1) */
  opacity?: number;
  /** Custom styling properties for future extensibility */
  customStyles?: Record<string, any>;
}

/**
 * Result of graph validation operations
 * @public
 */
export interface ValidationResult {
  /** Whether the validation passed */
  valid: boolean;
  /** List of validation errors if any */
  errors: ValidationError[];
  /** List of validation warnings if any */
  warnings?: ValidationWarning[];
}

/**
 * Validation error details
 * @public
 */
export interface ValidationError {
  /** Path to the problematic element */
  path: string;
  /** Human-readable error message */
  message: string;
  /** Error code for programmatic handling */
  code: string;
}

/**
 * Validation warning details
 * @public
 */
export interface ValidationWarning {
  /** Path to the element causing warning */
  path: string;
  /** Human-readable warning message */
  message: string;
  /** Warning code for programmatic handling */
  code: string;
}

/**
 * Configuration options for graph operations
 * @public
 */
export interface GraphOptions {
  /** Whether to perform strict validation */
  strict?: boolean;
  /** Whether to auto-generate missing IDs */
  autoGenerateIds?: boolean;
  /** Whether to allow self-referencing edges */
  allowSelfLoops?: boolean;
  /** Default metadata to apply */
  defaultMetadata?: Record<string, any>;
} 