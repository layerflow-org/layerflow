/**
 * Plugin system for LayerFlow Core
 * @fileoverview Extensible plugin architecture with hooks and lifecycle management
 * @public
 */

import { LayerFlowGraph } from './graph';

/**
 * Plugin hook types for different graph operations
 */

/**
 * Plugin hook event types
 * @public
 */
export type PluginHookType = 
  | 'graph:created'
  | 'graph:loaded'
  | 'graph:beforeSave'
  | 'graph:afterSave'
  | 'node:beforeAdd'
  | 'node:afterAdd'
  | 'node:beforeUpdate'
  | 'node:afterUpdate'
  | 'node:beforeRemove'
  | 'node:afterRemove'
  | 'edge:beforeAdd'
  | 'edge:afterAdd'
  | 'edge:beforeRemove'
  | 'edge:afterRemove'
  | 'validation:beforeValidate'
  | 'validation:afterValidate';

/**
 * Plugin hook context data
 * @public
 */
export interface PluginHookContext {
  graph: LayerFlowGraph;
  data?: any;
  metadata?: Record<string, any>;
}

/**
 * Plugin hook handler function
 * @public
 */
export type PluginHookHandler = (_context: PluginHookContext) => void | Promise<void>;

/**
 * Plugin interface
 * @public
 */
export interface Plugin {
  /** Unique plugin identifier */
  name: string;
  /** Plugin version */
  version: string;
  /** Plugin description */
  description?: string | undefined;
  /** Plugin author */
  author?: string | undefined;
  /** Plugin initialization function */
  install: (_manager: PluginManager) => void | Promise<void>;
  /** Plugin cleanup function */
  uninstall?: ((_manager: PluginManager) => void | Promise<void>) | undefined;
  /** Plugin configuration options */
  options?: Record<string, any> | undefined;
}

/**
 * Plugin metadata information
 * @public
 */
export interface PluginInfo {
  name: string;
  version: string;
  description?: string | undefined;
  author?: string | undefined;
  installed: boolean;
  enabled: boolean;
  options?: Record<string, any> | undefined;
}

/**
 * Event emitter for plugin hooks
 * @public
 */
export class PluginEventEmitter {
  private hooks: Map<PluginHookType, Set<PluginHookHandler>> = new Map();

  /**
   * Registers a hook handler for a specific event type
   * @param hookType - Type of hook to listen for
   * @param handler - Handler function to execute
   */
  on(hookType: PluginHookType, handler: PluginHookHandler): void {
    if (!this.hooks.has(hookType)) {
      this.hooks.set(hookType, new Set());
    }
    this.hooks.get(hookType)!.add(handler);
  }

  /**
   * Unregisters a hook handler
   * @param hookType - Type of hook to stop listening for
   * @param handler - Handler function to remove
   */
  off(hookType: PluginHookType, handler: PluginHookHandler): void {
    const handlers = this.hooks.get(hookType);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.hooks.delete(hookType);
      }
    }
  }

  /**
   * Emits a hook event to all registered handlers
   * @param hookType - Type of hook to emit
   * @param context - Context data to pass to handlers
   */
  async emit(hookType: PluginHookType, context: PluginHookContext): Promise<void> {
    const handlers = this.hooks.get(hookType);
    if (!handlers || handlers.size === 0) {
      return;
    }

    const promises = Array.from(handlers).map(handler => {
      try {
        return Promise.resolve(handler(context));
      } catch (error) {
        console.error(`Error in plugin hook handler for ${hookType}:`, error);
        return Promise.resolve();
      }
    });

    await Promise.all(promises);
  }

  /**
   * Gets all registered hook types
   * @returns Array of registered hook types
   */
  getRegisteredHooks(): PluginHookType[] {
    return Array.from(this.hooks.keys());
  }

  /**
   * Gets the number of handlers for a specific hook type
   * @param hookType - Hook type to check
   * @returns Number of registered handlers
   */
  getHandlerCount(hookType: PluginHookType): number {
    return this.hooks.get(hookType)?.size || 0;
  }
}

/**
 * Plugin manager for LayerFlow Core
 * Manages plugin lifecycle, hooks, and event emission
 * @public
 */
export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private enabledPlugins: Set<string> = new Set();
  private eventEmitter: PluginEventEmitter = new PluginEventEmitter();
  private globalOptions: Record<string, any> = {};

  /**
   * Registers a plugin with the manager
   * @param plugin - Plugin to register
   * @returns Promise that resolves when plugin is installed
   */
  async register(plugin: Plugin): Promise<void> {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin "${plugin.name}" is already registered`);
    }

    try {
      // Install the plugin
      await Promise.resolve(plugin.install(this));
      
      // Add to registry
      this.plugins.set(plugin.name, plugin);
      this.enabledPlugins.add(plugin.name);

      console.info(`Plugin "${plugin.name}" v${plugin.version} registered successfully`);
    } catch (error) {
      console.error(`Failed to register plugin "${plugin.name}":`, error);
      throw new Error(`Plugin registration failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Unregisters a plugin from the manager
   * @param pluginName - Name of the plugin to unregister
   * @returns Promise that resolves when plugin is uninstalled
   */
  async unregister(pluginName: string): Promise<void> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      throw new Error(`Plugin "${pluginName}" is not registered`);
    }

    try {
      // Call uninstall if available
      if (plugin.uninstall) {
        await Promise.resolve(plugin.uninstall(this));
      }

      // Remove from registry
      this.plugins.delete(pluginName);
      this.enabledPlugins.delete(pluginName);

      console.info(`Plugin "${pluginName}" unregistered successfully`);
    } catch (error) {
      console.error(`Failed to unregister plugin "${pluginName}":`, error);
      throw new Error(`Plugin unregistration failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Enables a registered plugin
   * @param pluginName - Name of the plugin to enable
   */
  enable(pluginName: string): void {
    if (!this.plugins.has(pluginName)) {
      throw new Error(`Plugin "${pluginName}" is not registered`);
    }
    this.enabledPlugins.add(pluginName);
  }

  /**
   * Disables a registered plugin
   * @param pluginName - Name of the plugin to disable
   */
  disable(pluginName: string): void {
    this.enabledPlugins.delete(pluginName);
  }

  /**
   * Checks if a plugin is registered
   * @param pluginName - Name of the plugin to check
   * @returns True if plugin is registered
   */
  isRegistered(pluginName: string): boolean {
    return this.plugins.has(pluginName);
  }

  /**
   * Checks if a plugin is enabled
   * @param pluginName - Name of the plugin to check
   * @returns True if plugin is enabled
   */
  isEnabled(pluginName: string): boolean {
    return this.enabledPlugins.has(pluginName);
  }

  /**
   * Gets information about a registered plugin
   * @param pluginName - Name of the plugin
   * @returns Plugin information or undefined if not found
   */
  getPluginInfo(pluginName: string): PluginInfo | undefined {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      return undefined;
    }

    return {
      name: plugin.name,
      version: plugin.version,
      description: plugin.description,
      author: plugin.author,
      installed: true,
      enabled: this.isEnabled(pluginName),
      options: plugin.options
    };
  }

  /**
   * Gets information about all registered plugins
   * @returns Array of plugin information
   */
  getAllPlugins(): PluginInfo[] {
    return Array.from(this.plugins.values()).map(plugin => ({
      name: plugin.name,
      version: plugin.version,
      description: plugin.description,
      author: plugin.author,
      installed: true,
      enabled: this.isEnabled(plugin.name),
      options: plugin.options
    }));
  }

  /**
   * Registers a hook handler for plugin events
   * @param hookType - Type of hook to listen for
   * @param handler - Handler function to execute
   */
  on(hookType: PluginHookType, handler: PluginHookHandler): void {
    this.eventEmitter.on(hookType, handler);
  }

  /**
   * Unregisters a hook handler
   * @param hookType - Type of hook to stop listening for
   * @param handler - Handler function to remove
   */
  off(hookType: PluginHookType, handler: PluginHookHandler): void {
    this.eventEmitter.off(hookType, handler);
  }

  /**
   * Emits a hook event to all registered handlers
   * @param hookType - Type of hook to emit
   * @param context - Context data to pass to handlers
   */
  async emit(hookType: PluginHookType, context: PluginHookContext): Promise<void> {
    await this.eventEmitter.emit(hookType, context);
  }

  /**
   * Sets global options for the plugin manager
   * @param options - Global options to set
   */
  setGlobalOptions(options: Record<string, any>): void {
    this.globalOptions = { ...this.globalOptions, ...options };
  }

  /**
   * Gets global options
   * @returns Global options object
   */
  getGlobalOptions(): Record<string, any> {
    return { ...this.globalOptions };
  }

  /**
   * Gets the event emitter for direct access
   * @returns Plugin event emitter instance
   */
  getEventEmitter(): PluginEventEmitter {
    return this.eventEmitter;
  }
}

/**
 * Creates a simple plugin for basic functionality
 * @param name - Plugin name
 * @param version - Plugin version
 * @param installFn - Installation function
 * @param uninstallFn - Optional uninstallation function
 * @returns Plugin instance
 * @public
 */
export function createPlugin(
  name: string,
  version: string,
  installFn: (_manager: PluginManager) => void | Promise<void>,
  uninstallFn?: (_manager: PluginManager) => void | Promise<void>
): Plugin {
  const plugin: Plugin = {
    name,
    version,
    install: installFn
  };
  
  if (uninstallFn) {
    plugin.uninstall = uninstallFn;
  }
  
  return plugin;
}

/**
 * Built-in logging plugin for development and debugging
 * @public
 */
export const LoggingPlugin: Plugin = {
  name: 'core-logging',
  version: '1.0.0',
  description: 'Built-in logging plugin for debugging and development',
  author: 'LayerFlow Core',
  
  install: (manager: PluginManager) => {
    // Log all hook events
    const hookTypes: PluginHookType[] = [
      'graph:created',
      'graph:loaded',
      'node:beforeAdd',
      'node:afterAdd',
      'edge:beforeAdd',
      'edge:afterAdd'
    ];

    hookTypes.forEach(hookType => {
      manager.on(hookType, (context) => {
        console.log(`[LayerFlow] Hook: ${hookType}`, {
          graphNodeCount: context.graph.getAllNodes().length,
          graphEdgeCount: context.graph.getAllEdges().length,
          data: context.data
        });
      });
    });
  }
}; 