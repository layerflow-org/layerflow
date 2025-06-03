/**
 * Main graph model and operations for LayerFlow
 * @fileoverview Core graph class with CRUD operations, serialization, and layered functionality
 * @public
 */

import { 
  GraphAST, 
  GraphNode, 
  Edge, 
  GraphMetadata, 
  LayerDefinition, 
  GraphOptions,
  ValidationResult 
} from './types';
import { 
  generateId, 
  deepClone, 
  getCurrentTimestamp, 
  isValidId,
  DEFAULT_GRAPH_VERSION,
  DEFAULT_NODE_TYPE,
  DEFAULT_EDGE_TYPE 
} from './utils';
import { PluginManager, PluginHookContext } from './plugins';

/**
 * Main class for working with LayerFlow graphs
 * Provides CRUD operations, serialization, and layered architecture support
 * @public
 */
export class LayerFlowGraph {
  private ast: GraphAST;
  private options: GraphOptions;
  private pluginManager: PluginManager | undefined;

  /**
   * Creates a new LayerFlowGraph instance
   * @param ast - Initial graph structure (optional)
   * @param options - Configuration options (optional)
   * @param pluginManager - Plugin manager for hooks (optional)
   * @public
   */
  constructor(ast?: Partial<GraphAST>, options?: GraphOptions, pluginManager?: PluginManager) {
    this.options = {
      strict: false,
      autoGenerateIds: true,
      allowSelfLoops: false,
      ...options
    };
    
    this.ast = this.normalizeAST(ast);
    this.pluginManager = pluginManager;

    // Emit graph creation hook
    this.emitHook('graph:created', { data: this.ast });
  }

  /**
   * Sets the plugin manager for this graph instance
   * Allows enabling plugin hooks and event handling for graph operations
   * @param pluginManager - Plugin manager to use for hooks
   * @example
   * ```typescript
   * const pluginManager = new PluginManager();
   * graph.setPluginManager(pluginManager);
   * ```
   * @public
   */
  setPluginManager(pluginManager: PluginManager): void {
    this.pluginManager = pluginManager;
  }

  /**
   * Gets the current plugin manager instance
   * @returns Plugin manager instance or undefined if not set
   * @example
   * ```typescript
   * const manager = graph.getPluginManager();
   * if (manager) {
   *   manager.emit('custom:event', { data: 'example' });
   * }
   * ```
   * @public
   */
  getPluginManager(): PluginManager | undefined {
    return this.pluginManager;
  }

  /**
   * Emits a hook event if plugin manager is available
   * @param hookType - Type of hook to emit
   * @param data - Additional data to pass to hook handlers
   * @private
   */
  private async emitHook(hookType: string, data?: any): Promise<void> {
    if (this.pluginManager) {
      const context: PluginHookContext = {
        graph: this,
        data,
        metadata: { timestamp: getCurrentTimestamp() }
      };
      await this.pluginManager.emit(hookType as any, context);
    }
  }

  /**
   * Gets the current AST representation of the graph
   * Returns a deep clone to prevent external mutations
   * @returns Readonly copy of the graph AST
   * @example
   * ```typescript
   * const ast = graph.getAST();
   * console.log(`Graph has ${ast.nodes.length} nodes and ${ast.edges.length} edges`);
   * ```
   * @public
   */
  getAST(): Readonly<GraphAST> {
    return Object.freeze(deepClone(this.ast));
  }

  /**
   * Gets graph metadata including title, version, timestamps, and custom properties
   * @returns Graph metadata object (readonly copy)
   * @example
   * ```typescript
   * const metadata = graph.getMetadata();
   * console.log(`Graph "${metadata.title}" version ${metadata.version}`);
   * ```
   * @public
   */
  getMetadata(): Readonly<GraphMetadata> {
    return Object.freeze(deepClone(this.ast.metadata || {}));
  }

  /**
   * Updates graph metadata by merging with existing metadata
   * Automatically updates the 'modified' timestamp
   * @param metadata - Metadata to merge with existing metadata
   * @example
   * ```typescript
   * graph.updateMetadata({
   *   title: 'My Architecture',
   *   description: 'Microservices architecture diagram',
   *   tags: ['microservices', 'api', 'database']
   * });
   * ```
   * @public
   */
  updateMetadata(metadata: Partial<GraphMetadata>): void {
    this.ast.metadata = {
      ...this.ast.metadata,
      ...metadata,
      modified: getCurrentTimestamp()
    };
  }

  // ===============================
  // NODE OPERATIONS
  // ===============================

  /**
   * Adds a new node to the graph with validation and plugin hooks
   * @param node - Node to add (id is optional if autoGenerateIds is enabled)
   * @returns The created node with guaranteed ID
   * @throws {Error} If node ID already exists, label is empty, or validation fails
   * @example
   * ```typescript
   * // Add node with auto-generated ID
   * const node1 = await graph.addNode({
   *   label: 'Web Server',
   *   type: 'service',
   *   level: 1,
   *   metadata: { port: 8080, technology: 'nginx' }
   * });
   * 
   * // Add node with custom ID
   * const node2 = await graph.addNode({
   *   id: 'db-primary',
   *   label: 'Primary Database',
   *   type: 'storage',
   *   level: 2
   * });
   * ```
   * @public
   */
  async addNode(node: Omit<GraphNode, 'id'> & { id?: string }): Promise<GraphNode> {
    const nodeId = node.id || (this.options.autoGenerateIds ? generateId('node') : '');
    
    if (!isValidId(nodeId)) {
      throw new Error('Node ID is required when autoGenerateIds is disabled. Provide a valid non-empty string ID.');
    }

    // Check for duplicate IDs
    if (this.getNode(nodeId)) {
      throw new Error(`Node with ID "${nodeId}" already exists. Node IDs must be unique within the graph.`);
    }

    // Validate required fields
    if (!node.label || node.label.trim() === '') {
      throw new Error('Node label is required and cannot be empty. Provide a meaningful label for the node.');
    }

    // Validate parent exists if specified
    if (node.parentId && !this.getNode(node.parentId)) {
      throw new Error(`Parent node "${node.parentId}" does not exist. Create the parent node first or remove the parentId.`);
    }

    // Prevent circular parent references
    if (node.parentId && this.wouldCreateCircularReference(nodeId, node.parentId)) {
      throw new Error(`Setting parent "${node.parentId}" for node "${nodeId}" would create a circular reference. Check the parent hierarchy.`);
    }

    const newNode: GraphNode = {
      type: DEFAULT_NODE_TYPE,
      level: 0,
      ...node,
      id: nodeId
    };

    // Emit before hook
    await this.emitHook('node:beforeAdd', newNode);

    this.ast.nodes.push(newNode);

    // Emit after hook
    await this.emitHook('node:afterAdd', newNode);

    return deepClone(newNode);
  }

  /**
   * Gets a node by its unique identifier
   * @param id - Node ID to find
   * @returns The node if found, undefined otherwise (returns a deep clone)
   * @example
   * ```typescript
   * const node = graph.getNode('web-server-1');
   * if (node) {
   *   console.log(`Found node: ${node.label} (${node.type})`);
   * }
   * ```
   * @public
   */
  getNode(id: string): GraphNode | undefined {
    const node = this.ast.nodes.find(n => n.id === id);
    return node ? deepClone(node) : undefined;
  }

  /**
   * Gets all nodes in the graph
   * @returns Array of all nodes (deep cloned to prevent mutations)
   * @example
   * ```typescript
   * const allNodes = graph.getAllNodes();
   * const serviceNodes = allNodes.filter(node => node.type === 'service');
   * console.log(`Found ${serviceNodes.length} service nodes`);
   * ```
   * @public
   */
  getAllNodes(): GraphNode[] {
    return deepClone(this.ast.nodes);
  }

  /**
   * Updates an existing node by merging provided updates with current data
   * @param id - ID of the node to update
   * @param updates - Partial node data to merge (metadata is merged deeply)
   * @returns The updated node (deep clone)
   * @throws {Error} If node is not found
   * @example
   * ```typescript
   * const updatedNode = graph.updateNode('web-server-1', {
   *   label: 'Updated Web Server',
   *   metadata: { 
   *     port: 9090,
   *     newField: 'value' // Will be merged with existing metadata
   *   }
   * });
   * ```
   * @public
   */
  updateNode(id: string, updates: Partial<Omit<GraphNode, 'id'>>): GraphNode {
    const nodeIndex = this.ast.nodes.findIndex(n => n.id === id);
    
    if (nodeIndex === -1) {
      throw new Error(`Node with ID "${id}" not found. Check the node ID or create the node first.`);
    }

    const currentNode = this.ast.nodes[nodeIndex]!;
    
    // Validate label if being updated
    if (updates.label !== undefined && (!updates.label || updates.label.trim() === '')) {
      throw new Error('Node label cannot be empty. Provide a meaningful label for the node.');
    }

    // Validate parent if being updated
    if (updates.parentId !== undefined && updates.parentId && !this.getNode(updates.parentId)) {
      throw new Error(`Parent node "${updates.parentId}" does not exist. Create the parent node first or remove the parentId.`);
    }

    // Prevent circular parent references if parent is being updated
    if (updates.parentId && this.wouldCreateCircularReference(id, updates.parentId)) {
      throw new Error(`Setting parent "${updates.parentId}" for node "${id}" would create a circular reference. Check the parent hierarchy.`);
    }

    // Emit before hook
    this.emitHook('node:beforeUpdate', { nodeId: id, updates, currentNode });
    
    // Merge metadata properly if provided
    const mergedMetadata = updates.metadata 
      ? { ...currentNode.metadata, ...updates.metadata }
      : currentNode.metadata;

    this.ast.nodes[nodeIndex] = {
      ...currentNode,
      ...updates,
      ...(mergedMetadata && { metadata: mergedMetadata })
    } as GraphNode;

    const updatedNode = deepClone(this.ast.nodes[nodeIndex]) as GraphNode;

    // Emit after hook
    this.emitHook('node:afterUpdate', updatedNode);

    return updatedNode;
  }

  /**
   * Removes a node and all connected edges from the graph
   * @param id - ID of the node to remove
   * @returns True if node was removed, false if not found
   * @example
   * ```typescript
   * const removed = graph.removeNode('old-service');
   * if (removed) {
   *   console.log('Node and all its connections removed');
   * } else {
   *   console.log('Node not found');
   * }
   * ```
   * @public
   */
  removeNode(id: string): boolean {
    const nodeIndex = this.ast.nodes.findIndex(n => n.id === id);
    
    if (nodeIndex === -1) {
      return false;
    }

    const nodeToRemove = this.ast.nodes[nodeIndex];

    // Emit before hook
    this.emitHook('node:beforeRemove', { nodeId: id, node: nodeToRemove });

    // Remove the node
    this.ast.nodes.splice(nodeIndex, 1);
    
    // Remove all edges connected to this node
    const removedEdges = this.ast.edges.filter(edge => edge.from === id || edge.to === id);
    this.ast.edges = this.ast.edges.filter(
      edge => edge.from !== id && edge.to !== id
    );

    // Emit after hook
    this.emitHook('node:afterRemove', { nodeId: id, node: nodeToRemove, removedEdges });

    return true;
  }

  // ===============================
  // EDGE OPERATIONS
  // ===============================

  /**
   * Adds a new edge to the graph with validation and plugin hooks
   * @param edge - Edge to add with source and target node IDs
   * @returns The created edge (deep clone)
   * @throws {Error} If nodes don't exist, edge already exists, or validation fails
   * @example
   * ```typescript
   * // Add a simple connection
   * const edge1 = await graph.addEdge({
   *   from: 'web-server',
   *   to: 'database',
   *   type: 'http',
   *   label: 'API calls'
   * });
   * 
   * // Add edge with metadata
   * const edge2 = await graph.addEdge({
   *   from: 'service-a',
   *   to: 'service-b',
   *   type: 'async',
   *   metadata: { 
   *     protocol: 'message-queue',
   *     latency: '5ms'
   *   }
   * });
   * ```
   * @public
   */
  async addEdge(edge: Edge): Promise<Edge> {
    // Validate required fields
    if (!isValidId(edge.from)) {
      throw new Error('Edge source (from) is required and must be a non-empty string. Provide a valid source node ID.');
    }

    if (!isValidId(edge.to)) {
      throw new Error('Edge target (to) is required and must be a non-empty string. Provide a valid target node ID.');
    }

    // Validate that both nodes exist
    if (!this.getNode(edge.from)) {
      throw new Error(`Source node "${edge.from}" does not exist. Create the source node first or check the node ID.`);
    }
    
    if (!this.getNode(edge.to)) {
      throw new Error(`Target node "${edge.to}" does not exist. Create the target node first or check the node ID.`);
    }

    // Check for duplicate edges
    if (this.getEdge(edge.from, edge.to)) {
      throw new Error(`Edge from "${edge.from}" to "${edge.to}" already exists. Each node pair can have only one direct edge.`);
    }

    // Validate self-loops if not allowed
    if (!this.options.allowSelfLoops && edge.from === edge.to) {
      throw new Error(`Self-referencing edge from "${edge.from}" to itself is not allowed. Enable allowSelfLoops option or use different nodes.`);
    }

    const newEdge: Edge = {
      type: DEFAULT_EDGE_TYPE,
      ...edge
    };

    // Emit before hook
    await this.emitHook('edge:beforeAdd', newEdge);

    this.ast.edges.push(newEdge);

    // Emit after hook
    await this.emitHook('edge:afterAdd', newEdge);

    return deepClone(newEdge);
  }

  /**
   * Gets an edge between two specific nodes
   * @param from - Source node ID
   * @param to - Target node ID
   * @returns The edge if found, undefined otherwise (deep clone)
   * @example
   * ```typescript
   * const edge = graph.getEdge('web-server', 'database');
   * if (edge) {
   *   console.log(`Connection type: ${edge.type}`);
   * }
   * ```
   * @public
   */
  getEdge(from: string, to: string): Edge | undefined {
    const edge = this.ast.edges.find(e => e.from === from && e.to === to);
    return edge ? deepClone(edge) : undefined;
  }

  /**
   * Gets all edges in the graph
   * @returns Array of all edges (deep cloned)
   * @example
   * ```typescript
   * const allEdges = graph.getAllEdges();
   * const httpConnections = allEdges.filter(edge => edge.type === 'http');
   * console.log(`Found ${httpConnections.length} HTTP connections`);
   * ```
   * @public
   */
  getAllEdges(): Edge[] {
    return deepClone(this.ast.edges);
  }

  /**
   * Gets all edges connected to a specific node (incoming and outgoing)
   * @param nodeId - Node ID to find connections for
   * @returns Array of connected edges (deep cloned)
   * @example
   * ```typescript
   * const connections = graph.getConnectedEdges('web-server');
   * const incoming = connections.filter(edge => edge.to === 'web-server');
   * const outgoing = connections.filter(edge => edge.from === 'web-server');
   * ```
   * @public
   */
  getConnectedEdges(nodeId: string): Edge[] {
    return deepClone(
      this.ast.edges.filter(edge => edge.from === nodeId || edge.to === nodeId)
    );
  }

  /**
   * Removes an edge between two nodes
   * @param from - Source node ID
   * @param to - Target node ID
   * @returns True if edge was removed, false if not found
   * @example
   * ```typescript
   * const removed = graph.removeEdge('old-service', 'database');
   * if (removed) {
   *   console.log('Connection removed');
   * }
   * ```
   * @public
   */
  removeEdge(from: string, to: string): boolean {
    const edgeIndex = this.ast.edges.findIndex(
      e => e.from === from && e.to === to
    );
    
    if (edgeIndex === -1) {
      return false;
    }

    const edgeToRemove = this.ast.edges[edgeIndex];

    // Emit before hook
    this.emitHook('edge:beforeRemove', { from, to, edge: edgeToRemove });

    this.ast.edges.splice(edgeIndex, 1);

    // Emit after hook
    this.emitHook('edge:afterRemove', { from, to, edge: edgeToRemove });

    return true;
  }

  // ===============================
  // LAYER OPERATIONS
  // ===============================

  /**
   * Gets all nodes at a specific layer level
   * @param level - Layer level to query (0-based)
   * @returns Array of nodes at the specified level (deep cloned)
   * @example
   * ```typescript
   * const frontendNodes = graph.getNodesAtLevel(0); // Presentation layer
   * const businessNodes = graph.getNodesAtLevel(1); // Business logic layer
   * const dataNodes = graph.getNodesAtLevel(2);     // Data layer
   * ```
   * @public
   */
  getNodesAtLevel(level: number): GraphNode[] {
    return deepClone(
      this.ast.nodes.filter(node => (node.level || 0) === level)
    );
  }

  /**
   * Gets all unique levels present in the graph
   * @returns Sorted array of unique level numbers
   * @example
   * ```typescript
   * const levels = graph.getAllLevels(); // e.g., [0, 1, 2, 4]
   * console.log(`Graph has ${levels.length} layers`);
   * ```
   * @public
   */
  getAllLevels(): number[] {
    const levels = new Set(this.ast.nodes.map(node => node.level || 0));
    return Array.from(levels).sort((a, b) => a - b);
  }

  /**
   * Moves a node to a different layer level
   * @param nodeId - ID of the node to move
   * @param level - Target level (0-based)
   * @returns The updated node (deep clone)
   * @throws {Error} If node is not found
   * @example
   * ```typescript
   * // Move a service from business layer to data layer
   * const movedNode = graph.moveNodeToLevel('cache-service', 2);
   * ```
   * @public
   */
  moveNodeToLevel(nodeId: string, level: number): GraphNode {
    return this.updateNode(nodeId, { level });
  }

  /**
   * Gets all layer definitions
   * @returns Array of layer definitions
   */
  getAllLayers(): LayerDefinition[] {
    return deepClone(this.ast.layers || []);
  }

  /**
   * Adds a new layer definition
   * @param layer - Layer definition to add
   * @returns The created layer definition
   */
  addLayer(layer: LayerDefinition): LayerDefinition {
    if (!this.ast.layers) {
      this.ast.layers = [];
    }

    // Check if layer with this level already exists
    const existingLayer = this.ast.layers.find(l => l.level === layer.level);
    if (existingLayer) {
      throw new Error(`Layer with level ${layer.level} already exists`);
    }

    this.ast.layers.push(layer);
    return deepClone(layer);
  }

  /**
   * Gets a layer definition by level
   * @param level - Layer level to find
   * @returns Layer definition if found, undefined otherwise
   */
  getLayer(level: number): LayerDefinition | undefined {
    const layer = this.ast.layers?.find(l => l.level === level);
    return layer ? deepClone(layer) : undefined;
  }

  /**
   * Updates an existing layer definition
   * @param level - Level of the layer to update
   * @param updates - Partial layer data to merge
   * @returns The updated layer definition
   */
  updateLayer(level: number, updates: Partial<Omit<LayerDefinition, 'level'>>): LayerDefinition {
    if (!this.ast.layers) {
      throw new Error(`Layer with level ${level} not found`);
    }

    const layerIndex = this.ast.layers.findIndex(l => l.level === level);
    if (layerIndex === -1) {
      throw new Error(`Layer with level ${level} not found`);
    }

    this.ast.layers[layerIndex] = {
      ...this.ast.layers[layerIndex],
      ...updates
    } as LayerDefinition;

    return deepClone(this.ast.layers[layerIndex]) as LayerDefinition;
  }

  /**
   * Removes a layer definition
   * @param level - Level of the layer to remove
   * @returns True if layer was removed, false if not found
   */
  removeLayer(level: number): boolean {
    if (!this.ast.layers) {
      return false;
    }

    const layerIndex = this.ast.layers.findIndex(l => l.level === level);
    if (layerIndex === -1) {
      return false;
    }

    this.ast.layers.splice(layerIndex, 1);
    return true;
  }

  // ===============================
  // SEARCH AND TRAVERSAL
  // ===============================

  /**
   * Finds nodes matching a predicate function
   * @param predicate - Function to test each node
   * @returns Array of matching nodes
   */
  findNodes(predicate: (node: GraphNode) => boolean): GraphNode[] {
    return deepClone(this.ast.nodes.filter(predicate));
  }

  /**
   * Finds nodes by type
   * @param type - Node type to search for
   * @returns Array of nodes with the specified type
   */
  findNodesByType(type: string): GraphNode[] {
    return this.findNodes(node => node.type === type);
  }

  /**
   * Gets immediate neighbors of a node
   * @param nodeId - Node ID to find neighbors for
   * @returns Array of neighboring nodes
   */
  getNeighbors(nodeId: string): GraphNode[] {
    const connectedEdges = this.getConnectedEdges(nodeId);
    const neighborIds = new Set<string>();
    
    connectedEdges.forEach(edge => {
      if (edge.from === nodeId) {
        neighborIds.add(edge.to);
      }
      if (edge.to === nodeId) {
        neighborIds.add(edge.from);
      }
    });

    return Array.from(neighborIds)
      .map(id => this.getNode(id))
      .filter((_node): _node is GraphNode => _node !== undefined);
  }

  // ===============================
  // HIERARCHY OPERATIONS
  // ===============================

  /**
   * Gets all child nodes of a parent node
   * @param parentId - Parent node ID
   * @returns Array of child nodes
   */
  getChildNodes(parentId: string): GraphNode[] {
    return deepClone(
      this.ast.nodes.filter(node => node.parentId === parentId)
    );
  }

  /**
   * Gets the parent node of a child node
   * @param childId - Child node ID
   * @returns Parent node if found, undefined otherwise
   */
  getParentNode(childId: string): GraphNode | undefined {
    const child = this.getNode(childId);
    if (!child || !child.parentId) {
      return undefined;
    }
    return this.getNode(child.parentId);
  }

  /**
   * Sets the parent of a node
   * @param nodeId - ID of the node to set parent for
   * @param parentId - ID of the parent node (or undefined to remove parent)
   * @returns The updated node
   */
  setNodeParent(nodeId: string, parentId?: string): GraphNode {
    // Validate parent exists if provided
    if (parentId && !this.getNode(parentId)) {
      throw new Error(`Parent node "${parentId}" does not exist`);
    }

    // Prevent circular references
    if (parentId && this.wouldCreateCircularReference(nodeId, parentId)) {
      throw new Error('Setting parent would create circular reference');
    }

    return this.updateNode(nodeId, { parentId });
  }

  /**
   * Gets all root nodes (nodes without parents)
   * @returns Array of root nodes
   */
  getRootNodes(): GraphNode[] {
    return deepClone(
      this.ast.nodes.filter(node => !node.parentId)
    );
  }

  /**
   * Gets the full hierarchy path from root to a specific node
   * @param nodeId - Node ID to get path for
   * @returns Array of nodes from root to target node
   */
  getNodePath(nodeId: string): GraphNode[] {
    const path: GraphNode[] = [];
    let currentNode = this.getNode(nodeId);

    while (currentNode) {
      path.unshift(currentNode);
      currentNode = currentNode.parentId ? this.getNode(currentNode.parentId) : undefined;
    }

    return path;
  }

  /**
   * Checks if setting a parent would create a circular reference
   * @param nodeId - Node that would get a new parent
   * @param parentId - Proposed parent node ID
   * @returns True if circular reference would be created
   */
  private wouldCreateCircularReference(nodeId: string, parentId: string): boolean {
    let currentId: string | undefined = parentId;
    const visited = new Set<string>();

    while (currentId) {
      if (currentId === nodeId) {
        return true;
      }

      if (visited.has(currentId)) {
        // Already visited, break to prevent infinite loop
        break;
      }

      visited.add(currentId);
      const currentNode = this.getNode(currentId);
      currentId = currentNode?.parentId;
    }

    return false;
  }

  // ===============================
  // SERIALIZATION
  // ===============================

  /**
   * Exports the graph to JSON format (GraphAST)
   * @returns JSON representation of the graph (deep cloned)
   * @example
   * ```typescript
   * const json = graph.toJSON();
   * localStorage.setItem('my-graph', JSON.stringify(json));
   * ```
   * @public
   */
  toJSON(): GraphAST {
    return deepClone(this.ast);
  }

  /**
   * Creates a LayerFlowGraph from JSON data
   * @param json - JSON representation of a graph (GraphAST)
   * @param options - Configuration options for the new graph
   * @returns New LayerFlowGraph instance
   * @example
   * ```typescript
   * const jsonData = JSON.parse(localStorage.getItem('my-graph'));
   * const graph = LayerFlowGraph.fromJSON(jsonData, {
   *   strict: true,
   *   allowSelfLoops: false
   * });
   * ```
   * @public
   */
  static fromJSON(json: GraphAST, options?: GraphOptions): LayerFlowGraph {
    return new LayerFlowGraph(json, options);
  }

  /**
   * Exports the graph to a JSON string with optional formatting
   * @param space - Number of spaces for indentation (optional)
   * @returns JSON string representation
   * @example
   * ```typescript
   * // Compact JSON
   * const compact = graph.toString();
   * 
   * // Pretty-printed JSON
   * const formatted = graph.toString(2);
   * console.log(formatted);
   * ```
   * @public
   */
  toString(space?: number): string {
    return JSON.stringify(this.toJSON(), null, space);
  }

  // ===============================
  // VALIDATION
  // ===============================

  /**
   * Validates the current graph structure against built-in rules
   * @returns Validation result with any errors or warnings
   * @example
   * ```typescript
   * const result = graph.validate();
   * if (!result.valid) {
   *   console.error('Graph validation failed:', result.errors);
   * }
   * if (result.warnings?.length) {
   *   console.warn('Graph warnings:', result.warnings);
   * }
   * ```
   * @public
   */
  validate(): ValidationResult {
    const errors: ValidationResult['errors'] = [];
    const warnings: ValidationResult['warnings'] = [];

    // Validate nodes
    this.ast.nodes.forEach((node, index) => {
      if (!isValidId(node.id)) {
        errors.push({
          path: `nodes[${index}].id`,
          message: 'Node ID must be a non-empty string',
          code: 'INVALID_NODE_ID'
        });
      }

      if (!node.label || node.label.trim() === '') {
        warnings.push({
          path: `nodes[${index}].label`,
          message: 'Node label is empty',
          code: 'EMPTY_NODE_LABEL'
        });
      }
    });

    // Validate edges
    this.ast.edges.forEach((edge, index) => {
      if (!this.getNode(edge.from)) {
        errors.push({
          path: `edges[${index}].from`,
          message: `Source node "${edge.from}" does not exist`,
          code: 'INVALID_EDGE_SOURCE'
        });
      }

      if (!this.getNode(edge.to)) {
        errors.push({
          path: `edges[${index}].to`,
          message: `Target node "${edge.to}" does not exist`,
          code: 'INVALID_EDGE_TARGET'
        });
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  // ===============================
  // PRIVATE METHODS
  // ===============================

  /**
   * Normalizes and validates initial AST data
   */
  private normalizeAST(ast?: Partial<GraphAST>): GraphAST {
    const normalized: GraphAST = {
      nodes: [],
      edges: [],
      metadata: {
        title: 'Untitled Graph',
        version: DEFAULT_GRAPH_VERSION,
        created: getCurrentTimestamp(),
        modified: getCurrentTimestamp()
      },
      ...ast
    };

    // Ensure metadata has required fields
    if (normalized.metadata) {
      normalized.metadata = {
        ...normalized.metadata,
        version: normalized.metadata.version || DEFAULT_GRAPH_VERSION,
        modified: getCurrentTimestamp()
      };
    }

    return normalized;
  }
} 