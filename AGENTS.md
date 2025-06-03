# LayerFlow Contributor Guide

> **Руководство для разработчиков экосистемы LayerFlow**
>
> Практические советы по настройке среды разработки, тестированию, архитектуре и процессу контрибьютинга в монорепо LayerFlow.

---

## 🛠️ Среда разработки

### Workspace Navigation
- **Быстрый переход к пакету:** `pnpm --filter <package_name> run dev` вместо поиска через ls
- **Установка зависимостей:** `pnpm install --filter <package_name> <dependency>` для добавления пакетов в workspace
- **Запуск команд:** `pnpm run <command> --filter <package_name>` для выполнения скриптов в конкретном пакете
- **Проверка имени пакета:** смотрите поле `name` в `package.json` каждого пакета (игнорируйте корневой)

### Пакеты LayerFlow
```bash
# Основные пакеты
@layerflow/core      # Базовые типы, AST, валидация
@layerflow/parser    # LFF парсер на Chevrotain  
@layerflow/react     # React компоненты
@layerflow/collab    # Real-time коллаборация
@layerflow/cli       # CLI инструменты

# Примеры команд
pnpm --filter @layerflow/parser run build
pnpm --filter @layerflow/react run dev
pnpm install --filter @layerflow/core chevrotain
```

### Создание нового пакета
```bash
# React пакет с TypeScript
mkdir packages/new-package
cd packages/new-package
pnpm create vite@latest . --template react-ts

# Обновите package.json:
{
  "name": "@layerflow/new-package",
  "version": "0.1.0"
}

# Добавьте в pnpm-workspace.yaml если нужно
```

### IDE Setup
- **VS Code:** Установите расширения для TypeScript, ESLint, Prettier
- **TypeScript:** Проект использует строгий режим, включите `typescript.preferences.includePackageJsonAutoImports`
- **ESLint:** Конфигурация в корне проекта, настроена для монорепо
- **Debugging:** Используйте конфигурации debug в `.vscode/launch.json` для каждого пакета

---

## 🧪 Тестирование

### Структура тестов
```bash
# Найдите CI план
.github/workflows/     # GitHub Actions конфигурация

# Структура тестов в пакетах
packages/*/tests/      # Unit тесты
packages/*/src/**/*.test.ts  # Тесты рядом с кодом
```

### Команды тестирования
```bash
# Запуск всех тестов для пакета
pnpm run test --filter @layerflow/core

# Из корня пакета
cd packages/core && pnpm test

# Конкретный тест (Jest/Vitest pattern)
pnpm vitest run -t "LFF Parser should parse nodes"

# Тесты с покрытием
pnpm run test:coverage --filter @layerflow/parser

# Watch режим для разработки
pnpm run test:watch --filter @layerflow/react
```

### Требования к тестам
- **Покрытие:** Минимум 75% для core функциональности
- **Типы тестов:** Unit, integration, end-to-end для CLI
- **LFF Parser:** Обязательные тесты для новых грамматических правил
- **React компоненты:** Snapshot тесты + user interaction тесты
- **Плагины:** Тесты изоляции и интеграции

### Проверка качества
```bash
# Линтинг после изменения файлов/импортов
pnpm lint --filter @layerflow/parser

# Проверка типов TypeScript
pnpm run type-check --filter @layerflow/core

# Форматирование кода
pnpm run format --filter @layerflow/react

# Полная проверка перед коммитом
pnpm run ci --filter @layerflow/parser
```

---

## 🏗️ Архитектурные паттерны

### Core Architecture
- **@layerflow/core:** Source of truth для AST, валидации, CRUD операций
- **@layerflow/parser:** Единственный источник парсинга LFF → AST
- **Plugin система:** Расширяемость через хуки и middleware
- **Type safety:** 100% TypeScript coverage, строгие типы

### LFF Parser Development
```bash
# Тестирование грамматики
cd packages/parser
pnpm run grammar:test

# Парсинг конкретного файла
pnpm run parse examples/c4-model.lff

# Отладка CST → AST трансформации
pnpm run debug:ast examples/complex-diagram.lff
```

### Plugin Development
```typescript
// Создание плагина
const myPlugin = createPlugin('my-plugin', '1.0.0', (manager) => {
  manager.on('node:afterAdd', (context) => {
    // Ваша логика
  });
});

// Тестирование плагина
import { testPlugin } from '@layerflow/core/testing';
testPlugin(myPlugin, mockGraph);
```

---

## 📝 Pull Request процесс

### Формат заголовка PR
```
[<package_name>] <Title>

Примеры:
[core] Add validation for circular dependencies
[parser] Fix LFF lexer token precedence 
[react] Implement collaborative cursors
[cli] Add export to PlantUML command
[*] Update dependencies across all packages
```

### Процесс создания PR
1. **Создайте feature branch:** `git checkout -b feature/core-validation-update`
2. **Сделайте атомарные коммиты:** один логический изменение = один коммит
3. **Запустите тесты:** `pnpm run ci` перед push
4. **Обновите документацию:** README, CHANGELOG если нужно
5. **Добавьте/обновите тесты** для вашего кода

### Чеклист PR
- [ ] ✅ Все тесты проходят: `pnpm test`
- [ ] 🔍 Линтинг чистый: `pnpm lint`
- [ ] 📝 Типы корректны: `pnpm type-check`
- [ ] 📚 Документация обновлена (если нужно)
- [ ] 🧪 Тесты добавлены/обновлены
- [ ] 🔄 Совместимость с существующими API
- [ ] 📦 Версионность соблюдена (semver)

### Описание PR
```markdown
## 🎯 Что изменено
Краткое описание изменений

## 🧪 Как тестировать
Шаги для проверки функциональности

## ⚠️ Breaking Changes
Если есть несовместимые изменения

## 📝 Дополнительная информация
Ссылки на issues, дизайн документы и т.д.
```

---

## 🔧 Специфичные советы

### LFF Grammar Updates
```bash
# После изменения грамматики
cd packages/parser
pnpm run grammar:generate    # Генерация парсера
pnpm run test:grammar       # Тесты грамматики
pnpm run format:grammar     # Форматирование правил
```

### React Component Development
```bash
# Storybook для компонентов
cd packages/react
pnpm run storybook

# Тестирование компонентов
pnpm run test:components

# Snapshot обновление
pnpm run test:update-snapshots
```

### Performance Testing
```bash
# Большие графы (core)
pnpm run test:performance --filter @layerflow/core

# Время парсинга (parser)
pnpm run benchmark --filter @layerflow/parser

# Рендеринг (react)
pnpm run test:rendering --filter @layerflow/react
```

---

## 🐛 Отладка и траблшутинг

### Типичные проблемы
- **TypeScript ошибки:** Проверьте импорты между пакетами в workspace
- **Chevrotain CST ошибки:** Используйте `parser.debug()` для отладки грамматики
- **React компоненты:** Проверьте типы пропсов и обработчики событий
- **Plugin конфликты:** Изолируйте тесты плагинов

### Debug команды
```bash
# Отладка парсера
pnpm run debug:parser examples/failing.lff

# Визуализация AST
pnpm run visualize:ast examples/complex.lff

# Проверка зависимостей workspace
pnpm list --depth=0

# Очистка node_modules при проблемах
pnpm clean && pnpm install
```

---

## 📚 Полезные ресурсы

- **Chevrotain документация:** [chevrotain.io](https://chevrotain.io)
- **LFF спецификация:** `docs/lff-specification.md`
- **Архитектурные решения:** `docs/architecture/`
- **Примеры использования:** `examples/`
- **Community:** GitHub Discussions для вопросов

---

## 🤝 Контрибьютинг этики

- **Respectful code reviews:** Конструктивная критика кода, не личности
- **Open source принципы:** Вклад для пользы комьюнити
- **Документация:** Каждое изменение должно быть понятно другим
- **Backward compatibility:** Минимизируйте breaking changes

---

**Удачного контрибьютинга в LayerFlow! 🚀**
