# @layerflow/react

> **React-компоненты для интерактивной визуализации архитектурных графов LayerFlow.**
>
> Мощные, настраиваемые компоненты на базе Cytoscape.js для отрисовки многоуровневых архитектурных диаграмм с поддержкой LFF-кода, live-редактирования и collaborative-режима.

---

## 📦 Описание

`@layerflow/react` — библиотека React-компонентов для визуализации и интерактивной работы с архитектурными графами LayerFlow. Поддерживает как прямую передачу AST-модели, так и live-парсинг LFF-кода с возможностью совместного редактирования.

Все компоненты интегрированы с `@layerflow/core` и `@layerflow/parser`, обеспечивая полную совместимость с экосистемой LayerFlow.

---

## 🔑 Возможности

- **Интерактивная визуализация:** Cytoscape.js с поддержкой zoom, pan, selection, drilling
- **Многорежимные компоненты:** только граф, граф + редактор, полноэкранный режим
- **Live-парсинг LFF:** автоматическое обновление графа при изменении кода
- **Bidirectional sync:** изменения графа автоматически обновляют код
- **Темы и стили:** C4 Model, DevOps, Kubernetes, кастомные темы
- **Collaborative editing:** real-time совместная работа через Yjs
- **TypeScript-first:** полная типизация и автодополнение
- **Responsive design:** адаптивная вёрстка для всех устройств
- **Plugin support:** расширяемость через систему плагинов
- **Performance:** оптимизированный рендеринг больших графов

---

## 🚀 Быстрый старт

### Установка

```bash
pnpm add @layerflow/react @layerflow/core @layerflow/parser
```

### Базовое использование

```tsx
import React from 'react';
import { LayerFlowGraph, LayerFlowEditor, LayerFlowViewer } from '@layerflow/react';

// 1. Простая визуализация по коду
function App() {
  const lffCode = `
    frontend: Frontend App [service]
    backend: Backend API [service] 
    database: PostgreSQL [database]
    
    frontend -> backend: API calls
    backend -> database: SQL queries
  `;

  return (
    <LayerFlowViewer
      code={lffCode}
      theme="c4-model"
      height="600px"
    />
  );
}

// 2. Полный редактор с кодом
function ArchitectureEditor() {
  const [code, setCode] = React.useState(lffCode);
  
  return (
    <LayerFlowEditor
      code={code}
      onCodeChange={setCode}
      showCodePanel={true}
      theme="devops"
      layout="split-horizontal"
      height="800px"
    />
  );
}

// 3. Граф по готовой AST-модели
function GraphFromModel() {
  const [ast, setAst] = React.useState(myASTModel);
  
  return (
    <LayerFlowGraph
      ast={ast}
      onASTChange={setAst}
      interactive={true}
      theme="kubernetes"
      showMinimap={true}
    />
  );
}
```

### Collaborative режим

```tsx
import { LayerFlowCollaborativeEditor } from '@layerflow/react';
import { YjsProvider } from '@layerflow/collab';

function CollabEditor() {
  const provider = new YjsProvider('ws://localhost:1234', 'my-document');
  
  return (
    <LayerFlowCollaborativeEditor
      provider={provider}
      showCursors={true}
      showUserList={true}
      enableVoiceChat={false}
      theme="c4-model"
    />
  );
}
```

---

## 📚 Компоненты

### LayerFlowViewer

Компонент только для просмотра графов без возможности редактирования:

```tsx
<LayerFlowViewer
  // Источник данных (один из):
  code="frontend -> backend"           // LFF код
  ast={astModel}                      // Готовая AST модель
  file="/path/to/diagram.lff"         // Загрузка из файла
  url="https://api.example.com/graph" // Загрузка по URL
  
  // Визуализация
  theme="c4-model"                    // Тема: c4-model, devops, kubernetes, custom
  layout="force-directed"             // Алгоритм раскладки
  height="600px"                      // Высота компонента
  width="100%"                        // Ширина компонента
  
  // Интерактивность
  zoomEnabled={true}                  // Возможность зумирования
  panEnabled={true}                   // Возможность панорамирования
  selectionEnabled={false}            // Выделение элементов
  showMinimap={true}                  // Мини-карта навигации
  
  // События
  onNodeClick={(node) => {}}          // Клик по узлу
  onEdgeClick={(edge) => {}}          // Клик по связи
  onBackgroundClick={() => {}}        // Клик по фону
  onZoomChange={(zoom) => {}}         // Изменение зума
/>
```

### LayerFlowEditor

Полноценный редактор с возможностью редактирования кода и графа:

```tsx
<LayerFlowEditor
  // Данные
  code={lffCode}                      // Начальный LFF код
  onCodeChange={(code) => {}}         // Изменение кода
  onASTChange={(ast) => {}}           // Изменение AST модели
  
  // Интерфейс
  showCodePanel={true}                // Показать панель кода
  showPropertiesPanel={false}         // Показать панель свойств
  showLayersPanel={true}              // Показать панель слоёв
  layout="split-horizontal"           // Расположение: split-horizontal, split-vertical, tabs
  
  // Редактор кода
  codeEditorProps={{
    language: 'lff',
    theme: 'vs-dark',
    fontSize: 14,
    wordWrap: true,
    minimap: { enabled: false }
  }}
  
  // Валидация
  enableValidation={true}             // Включить валидацию
  showErrors={true}                   // Показывать ошибки
  showWarnings={true}                 // Показывать предупреждения
  
  // Авто-сохранение
  autoSave={true}                     // Автосохранение
  autoSaveInterval={2000}             // Интервал автосохранения (мс)
  
  // События
  onSave={(code, ast) => {}}          // Сохранение
  onExport={(format) => {}}           // Экспорт в форматы
  onValidationChange={(errors) => {}} // Изменение валидации
/>
```

### LayerFlowGraph

Компонент для работы с готовой AST-моделью:

```tsx
<LayerFlowGraph
  // Модель
  ast={astModel}                      // AST модель
  onASTChange={(ast) => {}}           // Изменение модели
  
  // Режим
  interactive={true}                  // Интерактивное редактирование
  readOnly={false}                    // Только чтение
  
  // Стилизация
  theme="devops"                      // Тема
  customStyles={cyStylesheet}         // Кастомные стили Cytoscape
  
  // Функциональность
  enableDragAndDrop={true}            // Drag & Drop узлов
  enableContextMenu={true}            // Контекстное меню
  enableKeyboardShortcuts={true}      // Горячие клавиши
  
  // Плагины
  plugins={[c4Plugin, devopsPlugin]}  // Массив плагинов
  
  // Производительность
  virtualizeNodes={1000}              // Виртуализация для большых графов
  enableClustering={true}             // Кластеризация узлов
/>
```

### LayerFlowCollaborativeEditor

Collaborative-редактор с real-time синхронизацией:

```tsx
<LayerFlowCollaborativeEditor
  // Коллаборация
  provider={yjsProvider}              // Yjs Provider
  user={{                             // Информация о пользователе
    id: 'user-123',
    name: 'John Doe',
    color: '#ff6b6b'
  }}
  
  // UI коллаборации
  showCursors={true}                  // Курсоры других пользователей
  showUserList={true}                 // Список активных пользователей
  showUserAvatars={true}              // Аватары пользователей
  enableVoiceChat={false}             // Голосовой чат
  enableTextChat={true}               // Текстовый чат
  
  // Конфликты
  conflictResolution="last-write-wins" // Стратегия разрешения конфликтов
  showConflictIndicators={true}       // Индикаторы конфликтов
  
  // События
  onUserJoin={(user) => {}}           // Подключение пользователя
  onUserLeave={(user) => {}}          // Отключение пользователя
  onConflict={(conflict) => {}}       // Конфликт изменений
/>
```

---

## 🎨 Темы и стилизация

### Встроенные темы

```tsx
// C4 Model - классическая архитектурная нотация
<LayerFlowViewer theme="c4-model" />

// DevOps - для инфраструктуры и CI/CD
<LayerFlowViewer theme="devops" />

// Kubernetes - для cloud-native архитектур
<LayerFlowViewer theme="kubernetes" />

// Минималистичная светлая тема
<LayerFlowViewer theme="minimal-light" />

// Тёмная тема для разработчиков
<LayerFlowViewer theme="dark-professional" />
```

### Кастомная тема

```tsx
const customTheme = {
  name: 'my-theme',
  nodes: {
    service: {
      backgroundColor: '#3498db',
      borderColor: '#2980b9',
      color: '#ffffff',
      shape: 'round-rectangle'
    },
    database: {
      backgroundColor: '#e74c3c',
      borderColor: '#c0392b',
      color: '#ffffff',
      shape: 'ellipse'
    }
  },
  edges: {
    default: {
      lineColor: '#95a5a6',
      targetArrowColor: '#95a5a6',
      width: 2
    }
  }
};

<LayerFlowViewer theme={customTheme} />
```

---

## 🔧 Интеграция с файлами

### Загрузка из файла

```tsx
function FileViewer() {
  const [file, setFile] = React.useState(null);
  
  return (
    <div>
      <input 
        type="file" 
        accept=".lff,.layerflow,.lf"
        onChange={(e) => setFile(e.target.files[0])}
      />
      
      {file && (
        <LayerFlowViewer
          file={file}
          theme="c4-model"
          height="600px"
        />
      )}
    </div>
  );
}
```

### Экспорт и загрузка

```tsx
function EditorWithExport() {
  const editorRef = React.useRef(null);
  
  const handleExport = async (format) => {
    const data = await editorRef.current.export(format);
    
    // Скачивание файла
    const blob = new Blob([data], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diagram.${format}`;
    a.click();
  };
  
  return (
    <>
      <LayerFlowEditor
        ref={editorRef}
        code={code}
        onCodeChange={setCode}
      />
      
      <div>
        <button onClick={() => handleExport('lff')}>Экспорт LFF</button>
        <button onClick={() => handleExport('mermaid')}>Экспорт Mermaid</button>
        <button onClick={() => handleExport('plantuml')}>Экспорт PlantUML</button>
        <button onClick={() => handleExport('json')}>Экспорт JSON</button>
        <button onClick={() => handleExport('png')}>Экспорт PNG</button>
      </div>
    </>
  );
}
```

---

## ⚡ Производительность

### Оптимизация больших графов

```tsx
<LayerFlowGraph
  ast={largeAST}
  // Виртуализация узлов
  virtualizeNodes={1000}
  
  // Кластеризация при большом количестве узлов
  enableClustering={true}
  clusterThreshold={50}
  
  // Ленивая загрузка
  lazyLoadLevels={true}
  maxVisibleLevels={3}
  
  // Оптимизация рендеринга
  enableWebGL={true}
  batchUpdates={true}
  updateThrottle={16} // 60fps
/>
```

---

## 🧪 Примеры использования

### Простая архитектурная диаграмма

```tsx
const simpleArchitecture = `
  // C4 Model Example
  user: User [person]
  
  level 0 {
    webapp: Web Application [software_system]
    mobile: Mobile App [software_system]
  }
  
  level 1 {
    api: API Gateway [container]
    auth: Auth Service [container]
    business: Business Logic [container]
  }
  
  level 2 {
    db: Database [component]
    cache: Redis Cache [component]
  }
  
  user -> webapp: Uses
  user -> mobile: Uses
  webapp -> api: HTTPS
  mobile -> api: HTTPS
  api -> auth: Validates
  api -> business: Routes
  business -> db: Queries
  business -> cache: Caches
`;

<LayerFlowEditor
  code={simpleArchitecture}
  theme="c4-model"
  showCodePanel={true}
  height="800px"
/>
```

### DevOps pipeline

```tsx
const devopsPipeline = `
  // DevOps Infrastructure
  dev: Developer [person]
  
  level 0 {
    github: GitHub [vcs]
    ci: GitHub Actions [ci]
  }
  
  level 1 {
    registry: Docker Registry [registry]
    k8s: Kubernetes [orchestrator]
  }
  
  level 2 {
    app: Application Pod [pod]
    db: Database Pod [pod]
    monitoring: Monitoring Stack [pod]
  }
  
  dev -> github: Push code
  github -> ci: Trigger build
  ci -> registry: Push image
  ci -> k8s: Deploy
  k8s -> app: Manages
  k8s -> db: Manages
  k8s -> monitoring: Monitors
`;

<LayerFlowViewer
  code={devopsPipeline}
  theme="devops"
  layout="hierarchical"
  height="600px"
/>
```

---

## 📈 Roadmap

- [ ] Базовые компоненты визуализации
- [ ] Интеграция с парсером и core
- [ ] Live-редактирование и bidirectional sync
- [ ] Collaborative editing с Yjs
- [ ] Plugin система для React компонентов
- [ ] Мобильная адаптация и touch-жесты
- [ ] WebGL рендеринг для производительности
- [ ] Экспорт в векторные форматы
- [ ] Поддержка тем C4, DevOps, Kubernetes
- [ ] Интеграция с популярными дизайн-системами

---

## 🤝 Контрибьютинг

* Pull requests, баги, идеи и RFC — приветствуются!
* [CONTRIBUTING.md](https://github.com/layerflow-org/layerflow/blob/main/CONTRIBUTING.md)
* Issues и обсуждения: [GitHub Issues](https://github.com/layerflow-org/layerflow/issues)

---

## 📄 Лицензия

* **MPL 2.0** — свободное использование и развитие с защитой комьюнити. 