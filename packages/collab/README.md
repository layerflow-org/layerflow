# 🔄 @layerflow/collab — Real-Time Collaboration for LayerFlow

![npm version](https://img.shields.io/npm/v/@layerflow/collab?style=flat-square)
![license](https://img.shields.io/npm/l/MPL-2.0?style=flat-square)

> Синхронизация на CRDT (Yjs), undo/redo, offline-first, поддержка тысяч одновременных пользователей.

---

## 🚀 Быстрый старт

```sh
npm install @layerflow/collab
````

---

## ⚡ Ключевые возможности

* Мгновенная синхронизация изменений (CRDT/Yjs)
* Undo/redo, offline-first (работает без интернета)
* Live cursors, presence, статус участников
* Интеграция с визуализатором и core
* WebSocket, WebRTC, кастомные транспорты

---

## 💡 Пример использования

```ts
import { LayerFlowCollabProvider } from '@layerflow/collab';
import { LayerFlowGraph } from '@layerflow/core';

const graph = new LayerFlowGraph();
const provider = new LayerFlowCollabProvider(graph, {
  url: 'wss://collab.layerflow.dev',
  room: 'my-room'
});

provider.on('update', patch => {
  // handle updates
});

provider.on('presence', users => {
  // handle presence
});
```

---

## 🛠️ Advanced

* Undo/redo: `provider.undo()`, `provider.redo()`
* Custom events: `provider.on('event', handler)`
* Отключение: `provider.disconnect()`

---

## 📚 Документация

* [Полная документация](https://github.com/layerflow-org/layerflow)
* [Core API](https://github.com/layerflow-org/layerflow/tree/main/packages/core)

---

## 🛡️ Лицензия

* MPL 2.0

---

## 🤝 Контрибьюторы

* Приветствуются пулл-реквесты: новые провайдеры, UX-расширения, тесты и интеграции!
