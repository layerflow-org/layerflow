**Отлично, это стратегический шаг!**
Сделать отдельную спецификацию "LFF DSL Core" для базового парсера — это то, с чего начинается любой зрелый стандарт.
Только после *защиты границ ядра* можно масштабировать экосистему.

---

# 📖 Спецификация ядра LFF DSL (Core Parser)

## 🎯 Миссия ядра

**LFF Core** — это минимальный набор конструкций, обеспечивающий:

* Строгий синтаксис архитектурных графов
* Явную структурированность
* Масштабируемость через плагины
* Человеко- и AI-читаемость
* Интероперабельность (легко конвертировать, валидировать, визуализировать)

> Всё, что связано с доменной семантикой, расширениями, AST-трансформациями — вынесено в плагины!

---

## 1. **Основные сущности ядра**

### 1.1 Узлы (Nodes)

```lff
Frontend
Backend
"User Service"
Database [postgres]
```

* **Имя** (строка, в кавычках если пробелы)
* **Тип(ы)** `[type1, type2]` — несемантические для ядра
* **Опционально**: метаданные через блок

### 1.2 Связи (Edges)

```lff
A -> B
A => B
A <-> B
A --> B
```

* `->`, `=>`, `<->`, `-->`
* Множественные (`=>`) и описания (`: desc`)
* Ядро не проверяет семантику, только структуру

### 1.3 Блоки и иерархия

```lff
System:
  Frontend
  Backend
```

* Отступы по 2 пробела
* Глубина блоков не ограничена
* Содержимое — любые допустимые строки

### 1.4 Директивы (Directives)

```lff
@title: Architecture
@version: 1.0
@import: ./other.lff
@theme: dark
```

* Начинаются с `@`
* Формат: `@ключ: значение`
* Парсер обязан поддерживать только базовые директивы: title, version, theme, import

### 1.5 Комментарии

```lff
# Этот текст игнорируется
```

* В начале строки или после кода

### 1.6 Метаданные узлов/блоков

```lff
Backend [api]:
  port: 8080
  replicas: 3
```

* Любой ключ: значение
* Тип значения: строка, число, булево, массив

### 1.7 Уровни детализации (Level)

```lff
@levels: 3
System [system] @1
Frontend [web] @2+
Legacy [service] @1-2
```

* Ядро хранит номера уровней, не задаёт семантику

### 1.8 Идентификаторы и ссылки

```lff
UserService &user [service]
API -> *user
```

* `&user` — ID-узел
* `*user` — ссылка

---

## 2. **Формальная грамматика ядра (EBNF)**

```ebnf
Document        ::= (Line NEWLINE)*
Line            ::= Directive | Node | Edge | Comment | Empty | Block

Directive       ::= INDENT? '@' Identifier ':' Value

Node            ::= INDENT? Identifier AnchorDef? TypeList? LevelSpec? Properties? Block?
AnchorDef       ::= '&' Identifier
TypeList        ::= '[' Identifier (',' Identifier)* ']'
LevelSpec       ::= '@' LevelRange
LevelRange      ::= Level | Level '+' | Level '-' Level
Level           ::= Digit+

Edge            ::= INDENT? Path Arrow Path Label?
Arrow           ::= '->' | '=>' | '<->' | '-->'
Label           ::= ':' Value

Block           ::= ':' NEWLINE (INDENT Line NEWLINE)+
Properties      ::= ':' (PropertyLine | PropertyBlock)
PropertyLine    ::= Value
PropertyBlock   ::= NEWLINE (INDENT Property NEWLINE)+
Property        ::= Identifier ':' Value

Comment         ::= INDENT? '#' Text*
Empty           ::= INDENT?

Identifier      ::= Letter (Letter | Digit | '_' | '-')*
Value           ::= QuotedString | UnquotedString | Number | Boolean | ArrayLiteral
QuotedString    ::= '"' Character* '"'
UnquotedString  ::= Word+
Number          ::= Digit+ ('.' Digit+)?
Boolean         ::= 'true' | 'false'
ArrayLiteral    ::= '[' ValueList? ']'
ValueList       ::= Value (',' Value)*

INDENT          ::= '  '+  // Кратно 2 пробелам
NEWLINE         ::= '\n' | '\r\n'
```

---

## 3. **Правила парсера ядра**

1. **Чётко различать core и плагины**

   * Любые нераспознанные директивы, типы, или свойства сохраняются как "расширения", но не валидируются ядром.

2. **Не знать о доменах!**

   * Ядро не проверяет смысл типа, директивы, связи, уровня.
   * Всё, что не регламентировано выше — "opaque" (непрозрачно для ядра).

3. **Валидировать только синтаксис**

   * Отступы кратны 2, блоки корректны, скобки/кавычки закрыты, ID уникальны.

4. **API ядра должно быть открытым для расширения**

   * Вся AST структура допускает произвольные ключи/значения, но парсер не делает выводов о доменной семантике.

---

## 4. **AST структура (Core)**

```typescript
interface LFFNode {
  id?: string
  name: string
  type?: string[]
  level?: string
  metadata?: Record<string, any>
  children?: LFFNode[]
}

interface LFFEdge {
  from: string
  to: string
  arrow: '->' | '=>' | '<->' | '-->'
  label?: string
  properties?: Record<string, any>
}

interface LFFDirective {
  key: string
  value: string | number | boolean | string[]
}

interface LFFDocument {
  nodes: LFFNode[]
  edges: LFFEdge[]
  directives: LFFDirective[]
  comments?: string[]
}
```

---

## 5. **Тесты соответствия ядра**

### Пример 1: Базовый граф

```lff
# Мой первый граф
Frontend [web] -> Backend [api] -> Database [postgres]
```

### Пример 2: Блоки и свойства

```lff
System:
  Frontend [web]:
    port: 3000
  Backend [api]:
    port: 4000
  Frontend -> Backend: REST
  Backend -> Database: SQL
```

### Пример 3: Директивы и уровни

```lff
@title: Simple System
@levels: 2

Gateway [gateway] @1
App [service] @2
Gateway -> App: request
```

---

## 6. **Расширение через плагины (пример интерфейса, но вне ядра)**

```typescript
interface LFFPlugin {
  extendGrammar?: (builder: GrammarBuilder) => void
  transformAST?: (ast: LFFDocument) => LFFDocument
  validators?: ((ast: LFFDocument) => ValidationError[])[]
}
```