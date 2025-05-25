# @layerflow/core

> **Базовое ядро архитектурной экосистемы LayerFlow.**
>
> Строгая AST-модель, типы, CRUD-API, плагины, валидация и миграция.  
> Никаких шаблонов, тем, UI, визуализации или AI — только фундаментальная логика.

---

## 📦 Описание

`@layerflow/core` — это сердце всей платформы LayerFlow.  
Библиотека реализует универсальную, многослойную, типизированную модель (AST) для построения, модификации, сериализации и валидации архитектурных графов.

Все парсеры, визуализаторы, шаблоны, темы и расширения LayerFlow используют именно эту модель.

---

## 🔑 Возможности

- **AST и типы:** единая модель узлов, связей, слоёв, уровней, группировок, метаданных
- **CRUD-операции:** добавление, изменение, удаление и поиск элементов графа с валидацией
- **Экспорт/импорт:** преобразование моделей в/из JSON (source of truth)
- **Плагины и хуки:** расширяемость через middleware/events с полной интеграцией
- **Валидация и миграция:** строгий контроль структуры, автоматический переход между версиями
- **TypeScript-first:** 100% строгая типизация и автодокументация
- **Детальная обработка ошибок:** осмысленные сообщения об ошибках с контекстом
- **Производительность:** оптимизированные операции с поддержкой больших графов

---

## 🚀 Быстрый старт

### Установка

```bash
pnpm add @layerflow/core
```

### Пример использования

```typescript
import { LayerFlowGraph, PluginManager, createPlugin } from '@layerflow/core';

// 1. Создание графа с плагинами
const pluginManager = new PluginManager();
const graph = new LayerFlowGraph({}, {}, pluginManager);

// 2. Добавление узлов с валидацией
const frontend = await graph.addNode({
  label: 'Frontend App',
  type: 'service',
  level: 0,
  metadata: { 
    technology: 'React',
    port: 3000 
  }
});

const backend = await graph.addNode({
  label: 'Backend API',
  type: 'service', 
  level: 1,
  metadata: { 
    technology: 'Node.js',
    port: 8080 
  }
});

// 3. Создание связей
const connection = await graph.addEdge({
  from: frontend.id,
  to: backend.id,
  type: 'http',
  label: 'API calls',
  metadata: { 
    protocol: 'REST',
    latency: '50ms' 
  }
});

// 4. Валидация и экспорт
const validation = graph.validate();
if (validation.valid) {
  const json = graph.toJSON();
  console.log('Graph exported:', json);
}
```

### Работа с плагинами

```typescript
// Создание кастомного плагина
const loggingPlugin = createPlugin(
  'custom-logger',
  '1.0.0',
  (manager) => {
    manager.on('node:afterAdd', (context) => {
      console.log(`Node added: ${context.data.label}`);
    });
    
    manager.on('edge:afterAdd', (context) => {
      console.log(`Edge added: ${context.data.from} -> ${context.data.to}`);
    });
  }
);

// Регистрация плагина
await pluginManager.register(loggingPlugin);
```

---

## 📚 API Документация

### LayerFlowGraph

Основной класс для работы с графами:

```typescript
// Создание графа
const graph = new LayerFlowGraph(initialAST?, options?, pluginManager?);

// Работа с узлами
const node = await graph.addNode({ label: 'My Node', type: 'service' });
const foundNode = graph.getNode(nodeId);
const updatedNode = graph.updateNode(nodeId, { label: 'Updated' });
const removed = graph.removeNode(nodeId);

// Работа с рёбрами
const edge = await graph.addEdge({ from: 'node1', to: 'node2' });
const allEdges = graph.getAllEdges();
const connections = graph.getConnectedEdges(nodeId);

// Слои и иерархия
const levelNodes = graph.getNodesAtLevel(1);
const children = graph.getChildNodes(parentId);
const parent = graph.getParentNode(childId);

// Валидация и сериализация
const result = graph.validate();
const json = graph.toJSON();
const jsonString = graph.toString(2); // pretty-printed
```

### Валидация

```typescript
import { GraphValidator, validateGraph } from '@layerflow/core';

// Быстрая валидация
const isValid = validateGraph(ast);

// Детальная валидация
const validator = new GraphValidator({
  strict: true,
  maxNodes: 1000,
  allowSelfLoops: false
});

const result = validator.validate(ast);
if (!result.valid) {
  console.error('Errors:', result.errors);
  console.warn('Warnings:', result.warnings);
}
```

### Система плагинов

```typescript
import { PluginManager, createPlugin } from '@layerflow/core';

const manager = new PluginManager();

// Создание плагина
const plugin = createPlugin('my-plugin', '1.0.0', (manager) => {
  manager.on('node:afterAdd', (context) => {
    // Обработка события добавления узла
  });
});

// Управление плагинами
await manager.register(plugin);
manager.enable('my-plugin');
manager.disable('my-plugin');
await manager.unregister('my-plugin');
```

---

## 🛡️ Обработка ошибок

Библиотека предоставляет детальные сообщения об ошибках:

```typescript
try {
  await graph.addNode({ label: '' }); // Пустой label
} catch (error) {
  // "Node label is required and cannot be empty. Provide a meaningful label for the node."
}

try {
  await graph.addEdge({ from: 'nonexistent', to: 'node1' });
} catch (error) {
  // "Source node "nonexistent" does not exist. Create the source node first or check the node ID."
}
```

---

## 🧪 Тестирование

```bash
# Запуск всех тестов
pnpm test

# Тесты с покрытием
pnpm run test:coverage

# Тесты в watch режиме
pnpm run test:watch
```

Покрытие тестами: **>75%** с комплексными edge-case тестами.

---

## 🔧 Разработка

```bash
# Сборка
pnpm run build

# Разработка с watch
pnpm run dev

# Проверка типов
pnpm run type-check

# Линтинг
pnpm run lint

# Генерация документации
pnpm run docs
```

---

## 📈 Roadmap

- [x] Базовая AST-модель, CRUD, миграции
- [x] Валидация структуры, детальные ошибки
- [x] Система плагинов и хуков
- [x] 100% покрытие тестами
- [x] Документация по API и типам
- [x] Интеграция хуков в CRUD операции
- [ ] Расширенные валидационные правила
- [ ] Поддержка схем и шаблонов
- [ ] Оптимизация производительности

---

## 🤝 Контрибьютинг

* Pull requests, баги, идеи и RFC — приветствуются!
* [CONTRIBUTING.md](https://github.com/layerflow-org/layerflow/blob/main/CONTRIBUTING.md)
* Issues и обсуждения: [GitHub Issues](https://github.com/layerflow-org/layerflow/issues)

---

## 📄 Лицензия

* **MPL 2.0** — свободное использование и развитие с защитой комьюнити.
