/**
 * Plugin system tests
 * Tests PluginManager, hooks, lifecycle, and graph integration
 */

import { 
  PluginManager, 
  PluginEventEmitter,
  createPlugin,
  LoggingPlugin,
  LayerFlowGraph,
  PluginHookContext 
} from '../src/index';

describe('Plugin System', () => {
  let pluginManager: PluginManager;

  beforeEach(() => {
    pluginManager = new PluginManager();
  });

  describe('PluginManager', () => {
    test('should register and unregister plugins', async () => {
      const testPlugin = createPlugin(
        'test-plugin',
        '1.0.0',
        () => {},
        () => {}
      );

      await pluginManager.register(testPlugin);
      
      expect(pluginManager.isRegistered('test-plugin')).toBe(true);
      expect(pluginManager.isEnabled('test-plugin')).toBe(true);

      await pluginManager.unregister('test-plugin');
      
      expect(pluginManager.isRegistered('test-plugin')).toBe(false);
      expect(pluginManager.isEnabled('test-plugin')).toBe(false);
    });

    test('should prevent duplicate plugin registration', async () => {
      const plugin1 = createPlugin('duplicate', '1.0.0', () => {});
      const plugin2 = createPlugin('duplicate', '2.0.0', () => {});

      await pluginManager.register(plugin1);
      
      await expect(pluginManager.register(plugin2))
        .rejects.toThrow('Plugin "duplicate" is already registered');
    });

    test('should handle plugin installation errors', async () => {
      const brokenPlugin = createPlugin(
        'broken-plugin',
        '1.0.0',
        () => {
          throw new Error('Installation failed');
        }
      );

      await expect(pluginManager.register(brokenPlugin))
        .rejects.toThrow('Plugin registration failed');
      
      expect(pluginManager.isRegistered('broken-plugin')).toBe(false);
    });

    test('should enable and disable plugins', async () => {
      const plugin = createPlugin('toggle-plugin', '1.0.0', () => {});
      
      await pluginManager.register(plugin);
      expect(pluginManager.isEnabled('toggle-plugin')).toBe(true);

      pluginManager.disable('toggle-plugin');
      expect(pluginManager.isEnabled('toggle-plugin')).toBe(false);

      pluginManager.enable('toggle-plugin');
      expect(pluginManager.isEnabled('toggle-plugin')).toBe(true);
    });

    test('should get plugin information', async () => {
      const plugin = createPlugin(
        'info-plugin',
        '1.2.3',
        () => {}
      );
      plugin.description = 'Test plugin for info';
      plugin.author = 'Test Author';

      await pluginManager.register(plugin);
      
      const info = pluginManager.getPluginInfo('info-plugin');
      expect(info).toEqual({
        name: 'info-plugin',
        version: '1.2.3',
        description: 'Test plugin for info',
        author: 'Test Author',
        installed: true,
        enabled: true,
        options: undefined
      });
    });

    test('should list all plugins', async () => {
      const plugin1 = createPlugin('plugin1', '1.0.0', () => {});
      const plugin2 = createPlugin('plugin2', '2.0.0', () => {});

      await pluginManager.register(plugin1);
      await pluginManager.register(plugin2);

      const allPlugins = pluginManager.getAllPlugins();
      expect(allPlugins).toHaveLength(2);
      expect(allPlugins.map(p => p.name)).toContain('plugin1');
      expect(allPlugins.map(p => p.name)).toContain('plugin2');
    });
  });

  describe('Plugin Hooks', () => {
    test('should emit and handle hook events', async () => {
      const hookCalls: string[] = [];
      
      pluginManager.on('node:afterAdd', (context) => {
        hookCalls.push(`node-added-${context.data?.label}`);
      });

      pluginManager.on('edge:afterAdd', (context) => {
        hookCalls.push(`edge-added-${context.data?.from}-${context.data?.to}`);
      });

      const graph = new LayerFlowGraph();
      
      await pluginManager.emit('node:afterAdd', {
        graph,
        data: { label: 'TestNode' }
      });

      await pluginManager.emit('edge:afterAdd', {
        graph, 
        data: { from: 'A', to: 'B' }
      });

      expect(hookCalls).toContain('node-added-TestNode');
      expect(hookCalls).toContain('edge-added-A-B');
    });

    test('should handle multiple handlers for same hook', async () => {
      let handler1Called = false;
      let handler2Called = false;

      pluginManager.on('graph:created', () => { handler1Called = true; });
      pluginManager.on('graph:created', () => { handler2Called = true; });

      await pluginManager.emit('graph:created', {
        graph: new LayerFlowGraph()
      });

      expect(handler1Called).toBe(true);
      expect(handler2Called).toBe(true);
    });

    test('should handle hook handler errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      pluginManager.on('node:afterAdd', () => {
        throw new Error('Handler error');
      });

      // Should not throw
      await expect(pluginManager.emit('node:afterAdd', {
        graph: new LayerFlowGraph(),
        data: { label: 'Test' }
      })).resolves.not.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    test('should remove hook handlers', async () => {
      let handlerCalled = false;
      
      const handler = () => { handlerCalled = true; };
      
      pluginManager.on('node:beforeAdd', handler);
      pluginManager.off('node:beforeAdd', handler);

      await pluginManager.emit('node:beforeAdd', {
        graph: new LayerFlowGraph()
      });

      expect(handlerCalled).toBe(false);
    });
  });

  describe('Graph Integration', () => {
    test('should integrate with LayerFlowGraph', async () => {
      const hookEvents: string[] = [];
      
      const trackingPlugin = createPlugin(
        'tracking',
        '1.0.0',
        (manager) => {
          manager.on('graph:created', () => void hookEvents.push('graph:created'));
          manager.on('node:afterAdd', (ctx) => void hookEvents.push(`node:afterAdd:${ctx.data?.label}`));
          manager.on('edge:afterAdd', (ctx) => void hookEvents.push(`edge:afterAdd:${ctx.data?.from}-${ctx.data?.to}`));
        }
      );

      await pluginManager.register(trackingPlugin);
      
      const graph = new LayerFlowGraph({}, {}, pluginManager);
      const node1 = await graph.addNode({ label: 'Node1' });
      const node2 = await graph.addNode({ label: 'Node2' });
      await graph.addEdge({ from: node1.id, to: node2.id });

      expect(hookEvents).toContain('graph:created');
      expect(hookEvents).toContain('node:afterAdd:Node1');
      expect(hookEvents).toContain('node:afterAdd:Node2');
      expect(hookEvents.some(e => e.startsWith('edge:afterAdd:'))).toBe(true);
    });

    test('should provide correct context to hooks', async () => {
      let capturedContext: PluginHookContext | undefined;
      
      pluginManager.on('node:afterAdd', (context) => {
        capturedContext = context;
      });

      const graph = new LayerFlowGraph({}, {}, pluginManager);
      const node = await graph.addNode({ label: 'TestNode', type: 'service' });

      expect(capturedContext).toBeDefined();
      expect(capturedContext?.graph).toBe(graph);
      expect(capturedContext?.data).toEqual(node);
      expect(capturedContext?.metadata?.timestamp).toBeDefined();
    });

    test('should work without plugin manager', async () => {
      const graph = new LayerFlowGraph({}, { allowSelfLoops: true });
      
      // Should not throw errors
      const node = await graph.addNode({ label: 'No Plugin Node' });
      await graph.addEdge({ from: node.id, to: node.id });
      
      expect(graph.getAllNodes()).toHaveLength(1);
      expect(graph.getAllEdges()).toHaveLength(1);
    });
  });

  describe('Built-in Plugins', () => {
    test('should register LoggingPlugin successfully', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await pluginManager.register(LoggingPlugin);
      
      expect(pluginManager.isRegistered('core-logging')).toBe(true);
      
      const graph = new LayerFlowGraph({}, {}, pluginManager);
      await graph.addNode({ label: 'Logged Node' });

      expect(consoleLogSpy).toHaveBeenCalled();
      consoleLogSpy.mockRestore();
    });
  });

  describe('PluginEventEmitter', () => {
    let emitter: PluginEventEmitter;

    beforeEach(() => {
      emitter = new PluginEventEmitter();
    });

    test('should track registered hooks', () => {
      const handler = () => {};
      
      emitter.on('node:afterAdd', handler);
      emitter.on('edge:afterAdd', handler);

      const registeredHooks = emitter.getRegisteredHooks();
      expect(registeredHooks).toContain('node:afterAdd');
      expect(registeredHooks).toContain('edge:afterAdd');
    });

    test('should count handlers per hook', () => {
      const handler1 = () => {};
      const handler2 = () => {};

      emitter.on('node:afterAdd', handler1);
      emitter.on('node:afterAdd', handler2);

      expect(emitter.getHandlerCount('node:afterAdd')).toBe(2);
      expect(emitter.getHandlerCount('edge:afterAdd')).toBe(0);
    });

    test('should clean up empty hook sets', () => {
      const handler = () => {};
      
      emitter.on('node:afterAdd', handler);
      expect(emitter.getHandlerCount('node:afterAdd')).toBe(1);
      
      emitter.off('node:afterAdd', handler);
      expect(emitter.getHandlerCount('node:afterAdd')).toBe(0);
      expect(emitter.getRegisteredHooks()).not.toContain('node:afterAdd');
    });
  });

  describe('createPlugin Helper', () => {
    test('should create plugin with minimal parameters', () => {
      const plugin = createPlugin('simple', '1.0.0', () => {});
      
      expect(plugin.name).toBe('simple');
      expect(plugin.version).toBe('1.0.0');
      expect(plugin.install).toBeInstanceOf(Function);
      expect(plugin.uninstall).toBeUndefined();
    });

    test('should create plugin with uninstall function', () => {
      const installFn = () => {};
      const uninstallFn = () => {};
      
      const plugin = createPlugin('full', '1.0.0', installFn, uninstallFn);
      
      expect(plugin.install).toBe(installFn);
      expect(plugin.uninstall).toBe(uninstallFn);
    });
  });

  describe('Global Options', () => {
    test('should set and get global options', () => {
      const options = { debug: true, maxPlugins: 10 };
      
      pluginManager.setGlobalOptions(options);
      
      const retrieved = pluginManager.getGlobalOptions();
      expect(retrieved).toEqual(options);
    });

    test('should merge global options', () => {
      pluginManager.setGlobalOptions({ option1: 'value1' });
      pluginManager.setGlobalOptions({ option2: 'value2' });
      
      const options = pluginManager.getGlobalOptions();
      expect(options).toEqual({
        option1: 'value1',
        option2: 'value2'
      });
    });
  });
}); 