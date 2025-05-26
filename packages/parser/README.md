# @layerflow/parser

Парсер LayerFlow Format (LFF) для конвертации LFF-текста в LayerFlow Core GraphAST.

## 🎯 Концепция

**Parser** — это мост между LFF DSL и LayerFlow Core. Он:

- **Парсит** LFF синтаксис в промежуточное AST представление
- **Конвертирует** промежуточное AST в стандартное Core GraphAST  
- **Интегрируется** с системой плагинов LayerFlow Core
- **Валидирует** синтаксис и семантику

## 📦 Установка

```bash
npm install @layerflow/parser @layerflow/core
```

## 🚀 Быстрый старт

### Базовое использование

```typescript
import { parseToGraph, parseToCore } from '@layerflow/parser';

// LFF текст
const lffText = `
@title: My Architecture
@version: 1.0

Frontend [web] @1
Backend [api] @2
Database [postgres] @3

Frontend -> Backend: HTTP
Backend -> Database: SQL
`;

// Парсинг в LayerFlowGraph (готов к использованию)
const graph = parseToGraph(lffText);
if (graph) {
  console.log(`Parsed ${graph.getNodes().length} nodes`);
  graph.addNode({ id: 'cache', label: 'Cache', type: 'redis' });
}

// Парсинг в Core AST (для низкоуровневой работы)
const result = parseToCore(lffText);
if (result.success && result.coreAST) {
  console.log('Core AST:', result.coreAST);
}
```

### С плагинами

```typescript
import { parseWithPlugins, PluginManager } from '@layerflow/parser';

// Создаем менеджер плагинов
const pluginManager = new PluginManager();

// Парсинг с активными плагинами
const graph = parseWithPlugins(lffText, pluginManager);
```

### Валидация

```typescript
import { validateLFF } from '@layerflow/parser';

const validation = validateLFF(lffText, true); // strict mode
if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
}
```

## 🏗️ API

### Основные функции

#### `parseToCore(text, options?)`

Парсит LFF в Core GraphAST.

```typescript
interface ParseResult {
  success: boolean;
  lffAST?: LFFQ;           // Промежуточное LFF AST
  coreAST?: GraphAST;      // Core AST
  errors: ParseError[];
  metrics?: {
    lexTime: number;
    parseTime: number;
    convertTime: number;
    totalTime: number;
  };
}
```

#### `parseToGraph(text, options?, pluginManager?)`

Парсит LFF и создает LayerFlowGraph.

```typescript
parseToGraph(
  text: string,
  options?: ParserOptions & ConversionOptions,
  pluginManager?: PluginManager
): LayerFlowGraph | null
```

#### `validateLFF(text, strict?)`

Быстрая валидация LFF.

```typescript
validateLFF(text: string, strict?: boolean): {
  valid: boolean;
  errors: ParseError[];
}
```

### Опции парсера

```typescript
interface ParserOptions {
  strict?: boolean;              // Строгий режим
  includeLocations?: boolean;    // Включать позиции в исходном тексте
  includeComments?: boolean;     // Включать комментарии
  autoGenerateIds?: boolean;     // Автогенерация ID узлов
  maxDepth?: number;            // Максимальная глубина вложенности
  enableSourceMap?: boolean;     // Включить source mapping
  enableMetrics?: boolean;       // Включить метрики производительности
}

interface ConversionOptions {
  defaultNodeType?: string;      // Тип узла по умолчанию
  defaultEdgeType?: string;      // Тип связи по умолчанию
  preserveLFFMetadata?: boolean; // Сохранять LFF метаданные
  generateUniqueIds?: boolean;   // Генерировать уникальные ID
}
```

## 🔧 Поддерживаемый синтаксис LFF

### Узлы

```lff
# Простые узлы
Frontend
Backend
"User Service"

# С типами
Frontend [web]
Backend [api, microservice]

# С уровнями
Frontend [web] @1
Backend [api] @2
Database [postgres] @3

# С якорями
UserService &user [service]
```

### Связи

```lff
# Простые связи
Frontend -> Backend
Frontend => Backend: HTTP
Frontend <-> Backend
Frontend --> Backend

# С якорями
Frontend -> *user
*user -> Database
```

### Блоки и иерархия

```lff
System:
  Frontend [web]:
    port: 3000
    replicas: 2
  Backend [api]:
    port: 8080
    database: postgres
    
  Frontend -> Backend: REST API
```

### Директивы

```lff
@title: My Architecture
@version: 1.0
@author: Developer
@description: System architecture
@theme: dark
@levels: 3
```

### Уровни детализации

```lff
# Точный уровень
Component @1

# Уровень и выше
Service @2+

# Диапазон уровней  
Module @1-3
```

## 🔗 Интеграция с Core

Parser полностью интегрирован с LayerFlow Core:

### Типы из Core

```typescript
// Переэкспортированы из Core
export type {
  GraphAST,
  GraphNode, 
  Edge,
  GraphMetadata,
  LayerDefinition,
  ValidationError,
  ValidationResult
} from '@layerflow/core';

export { LayerFlowGraph, PluginManager } from '@layerflow/core';
```

### Система плагинов

Parser использует систему плагинов Core, а не дублирует функционал.

### Валидация

Использует валидаторы Core для проверки итогового GraphAST.

## 🎯 Архитектурные принципы

1. **Core как основа** — Parser расширяет Core, не дублирует
2. **Разделение ответственности** — Parser только преобразует LFF → Core AST
3. **Совместимость типов** — Использует типы Core везде где возможно
4. **Минимальная поверхность API** — Простые функции для основных случаев

## 🤝 Взаимодействие с Core

```typescript
import { LayerFlowGraph } from '@layerflow/core';
import { parseToCore } from '@layerflow/parser';

// Парсинг LFF
const result = parseToCore(lffText);

// Создание графа Core
const graph = new LayerFlowGraph(result.coreAST);

// Использование всех возможностей Core
graph.addNode({id: 'new', label: 'New Node'});
graph.validateGraph();
graph.toJSON();
```

## 📝 Примеры

### C4 Architecture

```lff
@title: C4 Model Example
@context: Software System

Person [person] @1:
  name: Customer
  description: Bank customer

System [system] @1:
  name: Banking System
  description: Internet banking system

System [external] @1:
  name: Email System
  description: External email provider

Customer -> Banking System: Uses
Banking System -> Email System: Sends notifications
```

### Kubernetes Deployment

```lff
@title: K8s Architecture
@namespace: production

Ingress [ingress] @1
Service [service] @2  
Deployment [deployment] @3
Pod [pod] @4

Ingress -> Service: Routes traffic
Service -> Deployment: Load balances
Deployment -> Pod: Manages
```

## 🧪 Тестирование

```bash
npm test                    # Запуск тестов
npm run test:watch         # Режим отслеживания
npm run test:coverage      # Покрытие кода
```

## 📖 Дополнительная документация

- [LFF Core Specification](spec/lff-core-spec.md) — Спецификация базового синтаксиса
- [LayerFlow Core](../core/README.md) — Документация по Core
- [Архитектура проекта](../../docs/architecture.md) — Общая архитектура

## 🔄 Миграция

При обновлении с предыдущих версий parser:

```typescript
// Было
import { parseLFF } from '@layerflow/parser';
const ast = parseLFF(text);

// Стало
import { parseToCore } from '@layerflow/parser';
const result = parseToCore(text);
if (result.success) {
  const ast = result.coreAST;
}
```

## 📄 Лицензия

MIT © LayerFlow Team