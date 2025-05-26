# 📖 LayerFlow File Format (LFF) - Спецификация языка
### Версия 1.0 | Новый стандарт для описания архитектуры

## 🎯 Философия LFF

**LFF** - это новый стандарт для описания многоуровневых графов архитектуры, разработанный с нуля для современных потребностей разработки и эры ИИ.

### Основные принципы
- **🎯 Ясность**: Один способ записать одну вещь
- **📏 Строгость**: Четкие правила без двусмысленности  
- **🔄 Простота**: Минимальный но мощный синтаксис
- **🤖 AI-First**: Нативная поддержка ИИ-генерации и парсинга
- **📖 Читаемость**: Интуитивно понятен людям
- **🏗️ Архитектурность**: Создан специально для описания систем

---

## 🆚 Почему новый стандарт?

### Проблемы существующих решений

| Решение | Ограничения | LFF решает |
|---------|-------------|------------|
| **Mermaid** | Слабая типизация, нет многоуровневости | Строгие типы, уровни детализации, AI-ready |
| **PlantUML** | Тяжелый синтаксис, Java-зависимость, устаревший подход | Легкий синтаксис, кроссплатформенность, современный |
| **Graphviz DOT** | Низкоуровневый, нет семантики, сложно читать | Высокоуровневый, семантически богатый, читаемый |
| **C4-PlantUML** | Привязка к PlantUML, ограниченная расширяемость | Независимый, гибкие расширения |
| **Structurizr DSL** | Узкая специализация, коммерческая привязка | Универсальный, открытый стандарт |

### Уникальные возможности LFF

#### 🏗️ Архитектурная семантика
```lff
# LFF понимает архитектурные концепции на уровне языка
PaymentService [service, critical, microservice]:
  port: 8080
  replicas: 3
  sla: 99.9%
```

#### 📐 Многоуровневая детализация  
```lff
# Один файл - несколько уровней абстракции
@levels: 3

System [system] @1 -> ExternalAPI [external] @1

System [system] @2:
  Frontend [web] @2
  Backend [api] @2
  Database [storage] @2

Backend [api] @3:
  Controller [component] @3
  Service [component] @3 
  Repository [component] @3
```

#### 🤖 AI-Native дизайн
```lff
# Синтаксис оптимизирован для ИИ-генерации
@ai-prompt: "Create microservices architecture for e-commerce"
@generated-by: "Claude-3.5-Sonnet"
@confidence: 0.95

UserService [service, generated]:
  confidence: 0.98
  reasoning: "Handles user authentication and profiles"
```

#### 🧩 Композиция и переиспользование
```lff
# Импорты и паттерны
@import: ./patterns/microservice.lff as ms
@import: ./domains/kubernetes.lff as k8s

UserManagement: ms.StandardService
  +Caching [redis]     # Расширение паттерна
  -Database           # Удаление части паттерна
```

#### 🎨 Доменные расширения

### C4 Architecture Model

```lff
@domain: c4
@title: Banking System Architecture

# Context Level
@context:
  Customer [person]:
    description: Bank customer with personal account
    
  "Banking System" [system]:
    description: Internet banking system
    
  "Email System" [external]:
    description: Microsoft Exchange email system
    
  Customer -> "Banking System": Uses
  "Banking System" -> "Email System": Sends emails

# Container Level  
@container "Banking System":
  "Web Application" [container.spa]:
    technology: React SPA
    responsibility: User interface
    
  "API Application" [container.api]:
    technology: Java Spring Boot
    responsibility: Business logic and API
    
  "Database" [container.database]:
    technology: PostgreSQL
    responsibility: Data storage
    
  "Web Application" -> "API Application": API calls [HTTPS/JSON]
  "API Application" -> "Database": Reads/writes [JDBC]

# Component Level
@component "API Application":
  "Security Component" [component]:
    responsibility: Authentication and authorization
    
  "Account Component" [component]:
    responsibility: Account management
    
  "Transfer Component" [component]:
    responsibility: Money transfers
```

### Domain-Driven Design

```lff
@domain: ddd
@title: E-commerce Bounded Contexts

# Strategic Design
@core-domain: "Order Management"
@supporting-domains: ["User Management", "Inventory", "Payments"]
@generic-domains: ["Notifications", "Audit"]

# Context Mapping
"Order Management" [bounded-context, core]:
  relationship: Customer-Supplier
  upstream: ["User Management", "Inventory"]
  downstream: ["Payments", "Notifications"]
  
"User Management" [bounded-context, supporting]:
  anti-corruption-layer: true
  
"Payments" [bounded-context, supporting]:
  integration: Published Language
  
# Aggregates
@aggregate "Order":
  root: Order
  entities: [Order, OrderLine, DeliveryInfo]
  value-objects: [Money, Address, ProductId]
  domain-events: [OrderCreated, OrderShipped, OrderCancelled]
  
# Domain Events
OrderCreated [domain-event]:
  aggregate: Order
  data: [orderId, customerId, amount, items]
  
OrderShipped [domain-event]:
  aggregate: Order
  triggers: ["Send notification", "Update inventory"]
```

### Lean Startup / Hypothesis Mapping

```lff
@domain: lean-startup
@title: Product Discovery Board

# Personas
"Tech-Savvy Millennial" [persona]:
  age: 25-35
  pain-points: ["No time", "Complex interfaces", "High prices"]
  goals: ["Save time", "Simple solutions", "Value for money"]

# Problems
"Complex Checkout Process" [problem, validated]:
  persona: "Tech-Savvy Millennial" 
  evidence: ["User interviews", "Analytics data"]
  impact: high
  
# Solutions  
"One-Click Checkout" [solution, hypothesis]:
  addresses: "Complex Checkout Process"
  effort: medium
  confidence: low
  
# Experiments
"A/B Test Checkout Flow" [experiment]:
  hypothesis: "One-Click Checkout"
  success-metric: "Conversion rate +15%"
  timeline: "2 weeks"
  status: running

# Value Propositions
"Save 80% checkout time" [value-prop]:
  for: "Tech-Savvy Millennial"
  evidence: "A/B Test Checkout Flow"
```

### Business Process (BPMN-style)

```lff
@domain: bpmn
@title: Order Fulfillment Process

# Process Flow
Start [start-event] -> "Receive Order" [user-task]
"Receive Order" -> "Validate Payment" [service-task]
"Validate Payment" -> "Payment OK?" [exclusive-gateway]

"Payment OK?" =>
  "Process Order" [service-task]: condition = "payment.valid"
  "Reject Order" [service-task]: condition = "!payment.valid"
  
"Process Order" -> "Check Inventory" [business-rule-task]
"Check Inventory" -> "In Stock?" [exclusive-gateway]

"In Stock?" =>
  "Ship Order" [send-task]: condition = "inventory.available"
  "Backorder" [user-task]: condition = "!inventory.available"

"Ship Order" -> "Order Complete" [end-event]
"Reject Order" -> "Order Rejected" [end-event]
"Backorder" -> "Notify Customer" [send-task] -> End [end-event]
```

### Data Flow / Analytics

```lff
@domain: data-pipeline
@title: Customer Analytics Pipeline

# Data Sources
"User Events" [data-source.streaming]:
  format: JSON
  volume: "1M events/day"
  schema: {userId, event, timestamp, properties}
  
"CRM Database" [data-source.batch]:
  format: PostgreSQL
  schedule: daily
  tables: [customers, orders, products]

# Transformations
"User Events" -> "Enrich with User Data" [transform]:
  join: "CRM Database"
  output: enriched_events
  
"Enrich with User Data" -> "Calculate Metrics" [transform]:
  metrics: [DAU, conversion_rate, churn_risk]
  window: 30d

# Outputs  
"Calculate Metrics" =>
  "Dashboard" [data-sink.realtime]: stakeholders = ["Product", "Marketing"]
  "ML Model" [data-sink.batch]: purpose = "Churn Prediction"
  "Data Warehouse" [data-sink.batch]: retention = "2 years"
```

### Team Topologies

```lff
@domain: team-topologies
@title: Engineering Organization

# Team Types
"Platform Team" [team.platform]:
  mission: "Enable rapid delivery for stream-aligned teams"
  cognitive-load: platform
  size: 8
  
"User Experience Team" [team.stream-aligned]:
  mission: "Deliver great user experience"
  cognitive-load: ["Frontend", "UX Research", "Design"]
  size: 6
  
"Data Team" [team.stream-aligned]:
  mission: "Enable data-driven decisions"
  cognitive-load: ["Analytics", "ML", "Data Engineering"]  
  size: 5

# Interactions
"Platform Team" -> "User Experience Team" [collaboration]:
  interaction: X-as-a-Service
  frequency: on-demand
  
"Platform Team" -> "Data Team" [collaboration]:
  interaction: Facilitating
  frequency: weekly
  
"User Experience Team" <-> "Data Team" [collaboration]:
  interaction: Collaboration
  frequency: bi-weekly
```

### Карта гипотез (Byndyusoft)

```lff
@domain: hypothesis-mapping
@title: Стратегический план продукта
@author: "Product Team"
@reference: "https://картагипотез.рф"

# Субъекты (кто влияет на достижение цели)
"Пользователи мобильного приложения" [subject]:
  type: primary
  behavior: "Используют приложение для покупок"
  pain-points: ["Долгая загрузка", "Сложная навигация"]
  influence: high
  
"Команда разработки" [subject]:
  type: internal
  behavior: "Создают новые фичи"
  constraints: ["Ограниченный бюджет", "Короткие спринты"]
  influence: medium

"Конкуренты" [subject]:
  type: external  
  behavior: "Выпускают новые продукты"
  threat-level: high
  influence: medium

# Цели (чего хотим достичь)
"Увеличить конверсию до 15%" [goal]:
  metric: "Conversion rate"
  current-value: "8%"
  target-value: "15%"
  deadline: "Q2 2025"
  priority: critical
  owner: "Product Manager"

"Снизить время загрузки до 2 сек" [goal]:
  metric: "Page load time"
  current-value: "5.2s"
  target-value: "2s" 
  deadline: "Q1 2025"
  priority: high
  owner: "Tech Lead"

# Гипотезы (как мы можем достичь цели)
"Упростить процесс оформления заказа" [hypothesis]:
  goal: "Увеличить конверсию до 15%"
  subject: "Пользователи мобильного приложения"
  assumption: "Пользователи не завершают покупку из-за сложности процесса"
  success-criteria: "Конверсия воронки покупки +5%"
  confidence: medium
  effort: high
  impact: high
  
"Оптимизировать загрузку изображений" [hypothesis]:
  goal: "Снизить время загрузки до 2 сек"
  subject: "Пользователи мобильного приложения"  
  assumption: "Большие изображения замедляют загрузку"
  success-criteria: "Время загрузки главной страницы <2s"
  confidence: high
  effort: medium
  impact: high

# Задачи (что нужно сделать)
"Провести интервью с пользователями" [task]:
  hypothesis: "Упростить процесс оформления заказа"
  type: research
  description: "Изучить поведение пользователей в воронке"
  assignee: "UX Researcher"
  timeline: "2 недели"
  status: planned
  
"A/B тест упрощенной формы заказа" [task]:
  hypothesis: "Упростить процесс оформления заказа"
  type: experiment
  description: "Тестировать форму с 3 полями вместо 8"
  success-metric: "Конверсия формы +20%"
  sample-size: "1000 пользователей"
  timeline: "1 месяц"
  status: in-progress

"Внедрить lazy loading для изображений" [task]:
  hypothesis: "Оптимизировать загрузку изображений"
  type: development
  description: "Загружать изображения по мере скролла"
  technical-complexity: medium
  timeline: "1 спринт"
  status: done

# Связи влияния
"Пользователи мобильного приложения" -> "Увеличить конверсию до 15%": влияют
"Команда разработки" -> "Снизить время загрузки до 2 сек": реализуют
"Конкуренты" -> "Увеличить конверсию до 15%": угрожают

# Причинно-следственные связи
"Упростить процесс оформления заказа" -> "Увеличить конверсию до 15%": способствует
"Оптимизировать загрузку изображений" -> "Снизить время загрузки до 2 сек": обеспечивает

# Реализация гипотез через задачи
"Упростить процесс оформления заказа" =>
  "Провести интервью с пользователями": research
  "A/B тест упрощенной формы заказа": experiment
  
"Оптимизировать загрузку изображений" =>
  "Внедрить lazy loading для изображений": implementation

# Метрики и отслеживание
@metrics:
  - name: "Conversion rate"
    current: "8%"
    target: "15%"
    measurement: weekly
    
  - name: "Page load time" 
    current: "5.2s"
    target: "2s"
    measurement: daily

# HADI циклы (Hypothesis - Action - Data - Insight)
@hadi-cycle "Упрощение заказа":
  hypothesis: "Упростить процесс оформления заказа"
  action: "A/B тест упрощенной формы заказа"
  data: "Конверсия тестовой группы: 12%"
  insight: "Упрощение формы действительно работает"
  next-step: "Развернуть на всех пользователей"
```

### Wardley Mapping

```lff
@domain: wardley-mapping
@title: Evolution of E-commerce Platform

# Value Chain (top to bottom)
Customer [user]:
  needs: "Complete purchase online"
  
"Online Shopping" [capability]:
  visible-to: Customer
  evolution: product
  
"Payment Processing" [capability]:
  visible-to: Customer
  evolution: commodity
  
"Product Catalog" [capability]:
  evolution: custom-built
  
"User Authentication" [capability]:
  evolution: product
  
"Cloud Infrastructure" [capability]:
  evolution: commodity
  
# Dependencies (lower supports upper)
Customer -> "Online Shopping": uses
"Online Shopping" -> "Payment Processing": requires
"Online Shopping" -> "Product Catalog": requires  
"Online Shopping" -> "User Authentication": requires
"Product Catalog" -> "Cloud Infrastructure": hosted-on
"User Authentication" -> "Cloud Infrastructure": hosted-on

# Evolution stages
@evolution-axis:
  genesis: "Novel, uncertain, constantly changing"
  custom-built: "Emerging, rapidly evolving"  
  product: "Stabilising, best practices emerging"
  commodity: "Mature, standardised, stable"

# Strategic moves
@movement "Migrate to SaaS Auth":
  component: "User Authentication" 
  from: custom-built
  to: product
  rationale: "Focus on core business value"
  timeline: "Q2 2025"
```

---

## 🚀 Быстрый старт

### Простейший граф
```lff
# Комментарий начинается с #
Frontend -> Backend -> Database
```

### Граф с типами
```lff
Frontend [web] -> Backend [api] -> Database [postgres]
```

### Граф с группировкой  
```lff
System:
  Frontend [web]
  Backend [api] 
  Database [postgres]
  
  Frontend -> Backend -> Database
```

---

## 📝 Синтаксис

### 1. Комментарии
```lff
# Это строчный комментарий
Frontend -> Backend  # Комментарий в конце строки
```

**Правила:**
- Начинаются с `#`
- До конца строки
- Игнорируются парсером

### 2. Узлы (Nodes)

#### Простые узлы
```lff
Frontend          # Простое имя
Backend           # Еще один узел
"User Service"    # Имя с пробелами в кавычках
```

#### Узлы с типами
```lff
Frontend [web]                    # Один тип
Backend [api, microservice]       # Несколько типов
Database [postgres, primary]      # Тип + характеристика
```

#### Узлы с метаданными
```lff
Backend [api]:
  port: 8080
  replicas: 3
  memory: 2Gb
```

**Правила типов:**
- Типы в квадратных скобках `[type1, type2]`
- Разделяются запятыми
- Только буквы, цифры, `-`, `_`
- Без пробелов внутри типа

### 3. Связи (Edges)

#### Базовые стрелки
```lff
A -> B           # Простая связь
A => B           # Множественная связь  
A <-> B          # Двунаправленная связь
A --> B          # Пунктирная связь (зависимость)
```

#### Связи с описанием
```lff
Frontend -> Backend: REST API
API -> Database: SQL queries
```

#### Множественные связи
```lff
Gateway =>
  UserService: /users
  OrderService: /orders
  PaymentService: /payments
```

**Строгие правила стрелок:**
- `->` : направленная связь
- `=>` : множественная связь (только с отступом)
- `<->` : двунаправленная связь  
- `-->` : пунктирная связь (зависимость)

### 4. Блоки и группировка

#### Простые блоки
```lff
Backend:
  API
  Services
  Database
```

#### Вложенные блоки
```lff
System:
  Frontend:
    WebApp [react]
    MobileApp [flutter]
  Backend:
    API [rest]
    Services:
      UserService [microservice]
      OrderService [microservice]
```

#### Блоки с типами
```lff
Backend [container]:
  port: 8080
  
  API [component]
  Services [layer]
```

**Правила блоков:**
- Блок создается символом `:` 
- Содержимое на следующих строках с отступом +2 пробела
- Может содержать узлы, связи, метаданные

### 5. Директивы

#### Метаданные документа
```lff
@title: E-commerce Architecture
@version: 1.0
@author: Team Alpha
@description: System overview
```

#### Настройки отображения
```lff
@layout: hierarchical    # hierarchical | force | circular
@direction: top-bottom   # top-bottom | left-right | bottom-top | right-left  
@theme: dark            # light | dark
@levels: 3              # Количество уровней детализации
```

#### Импорты
```lff
@import: ./common/services.lff
@import: ./patterns.lff as patterns
```

**Правила директив:**
- Начинаются с `@`
- Формат: `@key: value`
- Обрабатываются первыми
- Могут быть в любом месте файла

### 6. Уровни детализации

#### Определение уровней
```lff
@levels: 3

# Уровень 1 - Системы (по умолчанию все элементы видны на всех уровнях)
System [system]:
  Frontend [web]
  Backend [api] 
  Database [storage]

# Уровень 2 - Компоненты (показываем детали с уровня 2)
Frontend [web] @2+:
  Components [layer] @3:
    LoginForm [component]
    Dashboard [component]

# Альтернативный синтаксис - суффикс в типе
Backend [api.2]:     # Видим с уровня 2
  Controller [component.3]  # Видим с уровня 3
  Service [component.3] 
  Repository [component.3]
```

#### Управление видимостью
```lff
# Простые варианты
Monitoring [service]        # Видим на всех уровнях (по умолчанию)
DebugTools [tool] @3        # Только на уровне 3
LoadBalancer [infra] @2+    # С уровня 2 и выше
LegacyCode [service] @1-2   # Только на уровнях 1-2
```

**Правила уровней:**
- По умолчанию элемент виден на всех уровнях
- `@N` - только на уровне N
- `@N+` - с уровня N и выше  
- `@N-M` - с уровня N по уровень M
- `.N` в типе - альтернативный синтаксис

### 7. Навигация и breadcrumbs

#### Breadcrumbs для AI/UI навигации
```lff
@title: E-commerce Architecture
@breadcrumbs: "System > E-commerce > Payment Flow"

# Автоматические breadcrumbs на основе иерархии
System:
  Frontend:
    # Breadcrumb: System > Frontend
    Components:
      # Breadcrumb: System > Frontend > Components
      LoginForm [component]
      
# Явные breadcrumbs
PaymentFlow:
  @breadcrumb: "Business Logic > Payment > Workflow"
  
  InitiatePayment [step]:
    @breadcrumb: "Business Logic > Payment > Workflow > Initiate"
```

#### Навигационные метки
```lff
# Навигационные хинты для больших диаграмм
@navigation:
  up: "System Overview"
  down: "Component Details"
  related: ["Security Architecture", "Data Flow"]
  
# Контекстная навигация
UserService [service]:
  @nav-context:
    level-up: "Microservices Layer"
    level-down: "User Components"
    siblings: ["AuthService", "ProfileService"]
    dependencies: ["Database", "MessageQueue"]
```

### 8. ID, якоря и ссылки

#### Уникальные идентификаторы
```lff
# Явные ID для узлов
user-service &user-svc [service]:
  port: 8080
  
# Ссылки на узлы по ID
APIGateway [gateway] -> *user-svc: forwards requests

# Составные ID с namespace
System.Auth.UserService &auth.user [service]
System.Payment.UserService &payment.user [service]

APIGateway => 
  *auth.user: /auth/*
  *payment.user: /payment/*
```

#### Внешние ссылки и интеграция
```lff
# Ссылки на внешние диаграммы
PaymentService [service]:
  @link: "./payment-details.lff#payment-flow"
  @docs: "https://wiki.company.com/payments#architecture"
  
# Cross-reference между файлами
UserFlow:
  @import: "./user-management.lff"
  @ref: user-management.UserService
  
# Deep links для больших графов
"Complex System":
  @deep-link: "system.frontend.components.dashboard.widgets.user-widget"
```

#### Bookmarks и shortcuts
```lff
# Закладки для быстрой навигации
@bookmarks:
  critical-path: ["APIGateway", "UserService", "Database"]
  security-layer: ["Auth", "Firewall", "Encryption"]
  data-flow: ["Ingress", "Processing", "Storage", "Analytics"]
  
# Shortcuts для команд
@shortcuts:
  "Ctrl+1": focus "System.Frontend"
  "Ctrl+2": focus "System.Backend" 
  "Ctrl+3": focus "System.Database"
```

### 9. Стилизация и визуальное оформление

#### CSS-совместимые стили
```lff
@style critical-service:
  border: "2px solid #ff4444"
  background: "#ffe6e6"
  color: "#cc0000"
  font-weight: bold
  box-shadow: "0 2px 4px rgba(255,68,68,0.3)"
  
@style experimental:
  border: "1px dashed #ffaa00"
  background: "linear-gradient(45deg, #fff8e6, #ffeecc)"
  color: "#996600"
  opacity: 0.8
  
PaymentService [service.critical-service]:
  @style: critical-service

NewFeature [service.experimental]:
  @style: experimental
```

#### Стилизация групп и уровней
```lff
# Стили для разных уровней
@level-styles:
  1:  # Системный уровень
    background: "#f0f8ff"
    border: "2px solid #4169e1"
    font-size: "18px"
    
  2:  # Контейнерный уровень
    background: "#f5f5f5"
    border: "1px solid #808080"
    font-size: "14px"
    
  3:  # Компонентный уровень
    background: "#ffffff"
    border: "1px solid #cccccc"
    font-size: "12px"

# Стили для типов узлов
@type-styles:
  service:
    shape: "rounded-rectangle"
    background: "#e6f3ff"
    border: "1px solid #0066cc"
    
  database:
    shape: "cylinder"
    background: "#ffe6f3"
    border: "1px solid #cc0066"
    
  external:
    shape: "hexagon"
    background: "#f0f0f0"
    border: "2px dashed #666666"
```

#### Условная стилизация
```lff
# Стили в зависимости от состояния
@conditional-styles:
  - when: "status == 'critical'"
    style:
      border: "3px solid #ff0000"
      background: "#ffcccc"
      animation: "pulse 2s infinite"
      
  - when: "performance.latency > 1000"
    style:
      border: "2px solid #ff8800"
      background: "#fff4e6"
      
  - when: "environment == 'production'"
    style:
      border: "2px solid #00aa00"
      background: "#e6ffe6"

# Применение условных стилей
UserService [service]:
  status: critical
  performance:
    latency: 1200
  environment: production
  # Автоматически применятся стили для critical и high latency
```

#### Темы оформления
```lff
@theme dark:
  background: "#2d2d2d"
  text: "#ffffff"
  primary: "#4db8ff"
  secondary: "#ff6b9d"
  success: "#4dff88"
  warning: "#ffeb4d"
  error: "#ff4d4d"
  
@theme corporate:
  background: "#ffffff"
  text: "#333333"
  primary: "#0066cc"
  secondary: "#6600cc"
  accent: "#ff6600"
  border-radius: "4px"
  font-family: "Arial, sans-serif"

# Применение темы
@apply-theme: dark
```

---

## 🔧 Формальная грамматика (EBNF)

```ebnf
Document        ::= (Line NEWLINE)*
Line            ::= Directive | Node | Edge | Comment | Empty | PatternDef | MixinDef | StyleDef | ThemeDef

// Основные элементы
Directive       ::= INDENT? DirectiveType
Node            ::= INDENT? NodeDef
Edge            ::= INDENT? Path Arrow Path Label? Properties?
Comment         ::= INDENT? '#' Text*
Empty           ::= INDENT?

// Определение узла с ID и якорями
NodeDef         ::= NodeId? Identifier AnchorDef? TypeList? LevelSpec? Properties? Block?
NodeId          ::= Path '.'  // Namespace ID (System.Frontend.Component)
AnchorDef       ::= '&' Identifier  // Определение якоря (&user-svc)
AnchorRef       ::= '*' Identifier  // Ссылка на якорь (*user-svc)

// Расширенные директивы
DirectiveType   ::= StandardDir | DomainDir | LevelsDir | WhenDir | ImportDir | ProvenanceDir | 
                    NavigationDir | StyleDir | BookmarkDir | ThemeDir | BreadcrumbDir
StandardDir     ::= '@' Identifier ':' Value
DomainDir       ::= '@domain:' Identifier
LevelsDir       ::= '@levels:' LevelRangeList
WhenDir         ::= '@when' Condition ':'
ImportDir       ::= '@import:' Path ('as' Identifier)? | '@ref:' NodePath
ProvenanceDir   ::= '@' ('generated-by' | 'confidence' | 'ai-prompt') ':' Value

// Новые директивы
NavigationDir   ::= '@navigation:' NavigationBlock | '@nav-context:' NavContextBlock
BreadcrumbDir   ::= '@breadcrumbs:' String | '@breadcrumb:' String
BookmarkDir     ::= '@bookmarks:' BookmarkBlock | '@shortcuts:' ShortcutBlock
StyleDir        ::= '@level-styles:' LevelStyleBlock | '@type-styles:' TypeStyleBlock | 
                    '@conditional-styles:' ConditionalStyleBlock
ThemeDir        ::= '@theme' Identifier ':' ThemeBlock | '@apply-theme:' Identifier

// Навигационные блоки
NavigationBlock ::= NEWLINE (INDENT NavProperty NEWLINE)+
NavProperty     ::= ('up' | 'down' | 'related') ':' (String | ArrayLiteral)
NavContextBlock ::= NEWLINE (INDENT NavContextProp NEWLINE)+
NavContextProp  ::= ('level-up' | 'level-down' | 'siblings' | 'dependencies') ':' (String | ArrayLiteral)

// Закладки и shortcuts
BookmarkBlock   ::= NEWLINE (INDENT BookmarkItem NEWLINE)+
BookmarkItem    ::= Identifier ':' ArrayLiteral
ShortcutBlock   ::= NEWLINE (INDENT ShortcutItem NEWLINE)+
ShortcutItem    ::= String ':' ('focus' String | 'goto' String | 'highlight' ArrayLiteral)

// Стилизация
StyleDef        ::= '@style' Identifier ':' NEWLINE StyleBlock
StyleBlock      ::= (INDENT StyleProperty NEWLINE)+
StyleProperty   ::= CSSProperty ':' CSSValue
CSSProperty     ::= ('border' | 'background' | 'color' | 'font-weight' | 'font-size' | 'font-family' | 
                     'box-shadow' | 'opacity' | 'border-radius' | 'shape' | 'animation')
CSSValue        ::= String | Number

// Уровневые и типовые стили
LevelStyleBlock ::= NEWLINE (INDENT LevelStyle NEWLINE)+
LevelStyle      ::= Level ':' NEWLINE (INDENT INDENT StyleProperty NEWLINE)+
TypeStyleBlock  ::= NEWLINE (INDENT TypeStyle NEWLINE)+
TypeStyle       ::= Identifier ':' NEWLINE (INDENT INDENT StyleProperty NEWLINE)+

// Условные стили
ConditionalStyleBlock ::= NEWLINE (INDENT ConditionalStyle NEWLINE)+
ConditionalStyle ::= '- when:' String NEWLINE INDENT 'style:' NEWLINE (INDENT INDENT StyleProperty NEWLINE)+

// Темы
ThemeDef        ::= '@theme' Identifier ':' NEWLINE ThemeBlock
ThemeBlock      ::= (INDENT ThemeProperty NEWLINE)+
ThemeProperty   ::= ('background' | 'text' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 
                     'accent' | 'border-radius' | 'font-family') ':' String

// Паттерны
PatternDef      ::= '@pattern' Identifier ParamList? ':' NEWLINE Block
PatternInvoke   ::= Identifier ':' Identifier ('(' ArgList ')')?
ParamList       ::= '(' Parameter (',' Parameter)* ')'
Parameter       ::= '$' Identifier ('=' Value)?
ArgList         ::= Value (',' Value)*

// Миксины
MixinDef        ::= '@mixin' Identifier ':' NEWLINE Block  
MixinApply      ::= Identifier ('@' Identifier)+

// Типы и уровни
TypeList        ::= '[' TypeName (',' TypeName)* ']'
TypeName        ::= Identifier ('.' (Level | Identifier))? | MixinApply
LevelSpec       ::= '@' LevelRange
LevelRange      ::= Level | Level '+' | Level '-' Level
LevelRangeList  ::= LevelRange (',' LevelRange)*
Level           ::= Digit+

// Свойства (расширенные для ссылок)
Properties      ::= ':' (PropertyLine | PropertyBlock)
PropertyLine    ::= Value
PropertyBlock   ::= NEWLINE (INDENT Property NEWLINE)+
Property        ::= Identifier ':' Value | LinkProperty
LinkProperty    ::= ('@link' | '@docs' | '@deep-link') ':' String

// Блоки
Block           ::= ':' NEWLINE (INDENT Line NEWLINE)+

// Связи и пути (с поддержкой якорей)
Path            ::= PathElement ('.' PathElement)* | AnchorRef
PathElement     ::= Identifier | Wildcard
NodePath        ::= Identifier ('.' Identifier)* ('#' Identifier)?
Wildcard        ::= '*'
Arrow           ::= '->' | '=>' | '<->' | '-->'
Label           ::= ':' Value

// Условная логика
Condition       ::= BoolExpr | CompareExpr | LogicalExpr
BoolExpr        ::= Identifier | Boolean
CompareExpr     ::= Identifier Operator Value
LogicalExpr     ::= Condition ('and' | 'or') Condition | '!' Condition
Operator        ::= '==' | '!=' | '>' | '<' | '>=' | '<='

// Значения и литералы
Value           ::= String | Number | Boolean | ArrayLiteral | BlockScalar
String          ::= QuotedString | UnquotedString
QuotedString    ::= '"' Character* '"'
UnquotedString  ::= Word+
Number          ::= Digit+ ('.' Digit+)?
Boolean         ::= 'true' | 'false'
ArrayLiteral    ::= '[' ValueList? ']'
ValueList       ::= Value (',' Value)*
BlockScalar     ::= '|' NEWLINE (INDENT Text NEWLINE)+

// Базовые токены
Identifier      ::= Letter (Letter | Digit | '_' | '-')*
Letter          ::= [a-zA-Z]
Digit           ::= [0-9]
Word            ::= Letter | Digit | '_' | '-'
Character       ::= [^"\n\r]
Text            ::= [^\n\r]*
Path            ::= [a-zA-Z0-9._/-]+
INDENT          ::= '  '+  // Кратно 2 пробелам
NEWLINE         ::= '\n' | '\r\n'
```

### Примеры применения грамматики

#### Навигация и breadcrumbs
```lff
@title: Microservices Architecture
@breadcrumbs: "System > E-commerce > Services"

@navigation:
  up: "System Overview"
  down: "Service Details"
  related: ["Data Architecture", "Security"]

System:
  # Breadcrumb: System
  Services:
    # Breadcrumb: System > Services
    UserService [service]:
      @breadcrumb: "System > Services > User Management"
      @nav-context:
        siblings: ["OrderService", "PaymentService"]
        dependencies: ["UserDB", "AuthService"]
```

#### ID, якоря и ссылки
```lff
# Namespace ID и якоря
Frontend.Components.UserWidget &user-widget [component]:
  @link: "./user-details.lff#user-flow"
  
Backend.Services.UserService &user-svc [service]:
  @docs: "https://wiki.company.com/user-service"

# Ссылки между узлами
APIGateway [gateway] => 
  *user-svc: /api/users/*
  *payment-svc: /api/payments/*

# Cross-reference
@import: "./shared-components.lff"
@ref: shared-components.Authentication#auth-flow

# Deep links
"Complex Dashboard":
  @deep-link: "frontend.components.dashboard.widgets.user-metrics"
```

#### Стилизация
```lff
@style critical:
  border: "3px solid #ff0000"
  background: "#ffcccc"
  animation: "pulse 2s infinite"

@level-styles:
  1:
    background: "#f0f8ff"
    font-size: "18px"
  2:
    background: "#f5f5f5"
    font-size: "14px"

@conditional-styles:
  - when: "status == 'critical'"
    style:
      border: "3px solid #ff0000"
      background: "#ffcccc"

PaymentService [service]:
  status: critical
  @style: critical
```

#### Закладки и shortcuts
```lff
@bookmarks:
  critical-path: ["Gateway", "UserService", "Database"]
  monitoring: ["Metrics", "Logs", "Alerts"]

@shortcuts:
  "Ctrl+1": focus "System.Frontend"
  "Ctrl+2": goto "System.Backend.Services"
  "Ctrl+H": highlight ["critical-path"]
```

#### Темы
```lff
@theme dark-mode:
  background: "#2d2d2d"
  text: "#ffffff"
  primary: "#4db8ff"
  error: "#ff4d4d"

@apply-theme: dark-mode
```

#### Паттерны
```lff
@pattern Microservice($name, $db_type = "postgresql"):
  "$name API" [rest-api]
  "$name Service" [domain-service] 
  "$name Database" [$db_type]
  
  "$name API" -> "$name Service" -> "$name Database"

UserService: Microservice("User", "mongodb")
```

#### Миксины
```lff
@mixin Monitored:
  @ensures:
    -> Metrics [prometheus]
    -> Logs [fluentd]

@mixin Secured:
  @ensures:
    -> Auth [oauth2]
    -> Audit [event-log]

PaymentService [service] @Monitored @Secured
```

#### Условная логика
```lff
@when environment == "production":
  Monitoring [prometheus]
  
@when team-size > 8 and domain == "payments":
  SplitService [microservice]
```

#### Wildcards и списки
```lff
# Wildcard connections
Services.* -> Database: queries
Frontend.Components.* -> API: requests

# Array values
Environments: ["dev", "staging", "prod"]
Compliance: ["GDPR", "PCI-DSS", "SOX"]
```

#### Блок-скаляры
```lff
@description: |
  Это многострочное описание
  системы платежей, которое может
  содержать детальную информацию

PaymentService [service]:
  documentation: |
    Сервис обрабатывает все платежи
    и интегрируется с внешними системами
```

#### Provenance для AI
```lff
@generated-by: "Claude-3.5-Sonnet"
@confidence: 0.95
@ai-prompt: "Create microservices architecture for e-commerce"

UserService [service, generated]:
  confidence: 0.98
  reasoning: |
    Выделен отдельно для управления
    пользователями и аутентификации
```

---

## 🎨 Стандартные типы узлов

### Архитектурные типы
```lff
# Системы
System [system]
Service [service] 
Component [component]
Module [module]

# Роли
Actor [actor]
User [user]
Admin [admin]

# Технические  
Database [database]
API [api]
Queue [queue]
Cache [cache]

# Специальные
External [external]     # Внешняя система
Group [group]          # Группировка элементов  
Layer [layer]          # Архитектурный слой
```

### Стандартные атрибуты типов
```lff
# Технология
Backend [service, nodejs]
Database [storage, postgres]
Queue [messaging, rabbitmq]

# Состояние
LegacyAPI [api, deprecated]
NewService [service, experimental] 
ProductionDB [database, production]

# Критичность
PaymentService [service, critical]
LoggingService [service, optional]
```

---

## 📚 Примеры использования

### 1. Микросервисная архитектура
```lff
@title: E-commerce Microservices
@levels: 3

# Уровень 1 - Общая картина
System [system]:
  API Gateway [gateway] @1+
  Services [layer] @1+ 
  Data [layer] @1+
  
  API Gateway -> Services -> Data

# Уровень 2 - Сервисы
Services [layer] @2+:
  UserService [service] @2+
  OrderService [service] @2+
  PaymentService [service, critical] @2+
  
  API Gateway =>
    UserService: /users
    OrderService: /orders  
    PaymentService: /payments

# Уровень 3 - Детали сервисов
UserService [service.3]:
  port: 8001
  replicas: 3
  
  Controller [component.3]
  BusinessLogic [component.3]
  Repository [component.3]
  
  Controller -> BusinessLogic -> Repository
```

### 2. C4 Model
```lff
@title: Online Banking System
@notation: c4

# Context Level  
Customer [person] -> "Banking System" [system]: Uses
"Banking System" -> "Email System" [external]: Sends emails

# Container Level
"Banking System" [system]:
  "Web App" [container, spa]:
    technology: React
    
  "API App" [container, api]:
    technology: Java Spring
    port: 8080
    
  Database [container, database]:
    technology: PostgreSQL
    
  "Web App" -> "API App": HTTPS/JSON
  "API App" -> Database: JDBC
```

### 3. Kubernetes манифест  
```lff
@title: Production Deployment
@domain: kubernetes
@namespace: production

# Ingress
Ingress [k8s-ingress]:
  host: api.company.com
  tls: true

# Services
UserService [k8s-deployment]:
  replicas: 3
  image: "user-service:1.2.3"
  port: 8080
  resources:
    cpu: "500m"
    memory: "1Gi"

OrderService [k8s-deployment]:
  replicas: 2
  image: "order-service:1.1.0"
  port: 8081

# Database
PostgreSQL [k8s-statefulset]:
  replicas: 1
  storage: "50Gi"
  
# Connections
Ingress =>
  UserService: /users/*
  OrderService: /orders/*
  
UserService -> PostgreSQL: user data
OrderService -> PostgreSQL: order data
```

### 3. Комплексная архитектура с навигацией и стилизацией
```lff
@title: Enterprise E-commerce Platform
@breadcrumbs: "System > E-commerce > Production Architecture"
@version: 2.1.0
@apply-theme: enterprise

# Навигация и закладки
@navigation:
  up: "System Landscape"
  down: "Service Details"
  related: ["Security Architecture", "Data Flow", "Deployment"]

@bookmarks:
  critical-path: ["APIGateway", "UserService", "PaymentService", "Database"]
  monitoring: ["Prometheus", "Grafana", "AlertManager"]
  security-layer: ["Auth", "Firewall", "Encryption"]

@shortcuts:
  "Ctrl+1": focus "Frontend"
  "Ctrl+2": focus "Backend.Services"
  "Ctrl+3": focus "Infrastructure"
  "Ctrl+M": highlight ["monitoring"]

# Темы и стили
@theme enterprise:
  background: "#f8fafc"
  text: "#1e293b"
  primary: "#0066cc"
  critical: "#dc2626"
  warning: "#f59e0b"
  success: "#059669"

@style critical-service:
  border: "3px solid #dc2626"
  background: "#fef2f2"
  color: "#991b1b"
  font-weight: bold
  animation: "pulse 3s infinite"

@style monitoring:
  border: "1px dashed #059669"
  background: "#f0fdf4"
  shape: "hexagon"

@conditional-styles:
  - when: "replicas < 2"
    style:
      border: "2px solid #f59e0b"
      background: "#fffbeb"
  - when: "status == 'critical'"
    style:
      border: "3px solid #dc2626"
      animation: "pulse 2s infinite"

# Архитектура с ID и якорями
Frontend &frontend [layer]:
  @breadcrumb: "System > E-commerce > Frontend"
  @nav-context:
    level-down: "Web Components"
    siblings: ["Backend", "Infrastructure"]
    
  "Web Application" &web-app [spa]:
    @link: "./frontend-details.lff#component-architecture"
    technology: "React 18"
    replicas: 3
    
  "Mobile App" &mobile-app [mobile]:
    @link: "./mobile-details.lff#native-components"
    technology: "React Native"

Backend &backend [layer]:
  @breadcrumb: "System > E-commerce > Backend"
  @nav-context:
    level-down: "Microservices"
    siblings: ["Frontend", "Infrastructure"]
    
  "API Gateway" &api-gateway [gateway.critical-service]:
    @docs: "https://wiki.company.com/api-gateway"
    technology: "Kong"
    replicas: 2
    status: critical
    
  Services &services [group]:
    @deep-link: "backend.services.user-management.components"
    
    "User Service" &user-svc [service]:
      @nav-context:
        siblings: ["OrderService", "PaymentService"]
        dependencies: ["UserDB", "AuthService"]
      port: 8001
      replicas: 3
      
    "Order Service" &order-svc [service]:
      port: 8002
      replicas: 2
      
    "Payment Service" &payment-svc [service.critical-service]:
      @link: "./payment-details.lff#payment-flow"
      port: 8003
      replicas: 5
      status: critical

Infrastructure &infra [layer]:
  @breadcrumb: "System > E-commerce > Infrastructure"
  
  Monitoring &monitoring [group.monitoring]:
    "Prometheus" &prometheus [metrics]:
      @docs: "https://prometheus.company.com"
      
    "Grafana" &grafana [dashboard]:
      @link: "https://grafana.company.com/d/overview"
      
    "AlertManager" &alerts [alerting]:
      replicas: 1  # Применится warning style
  
  Storage &storage [group]:
    "User Database" &user-db [database, postgres]:
      replicas: 3
      
    "Order Database" &order-db [database, postgres]:
      replicas: 2
      
    "Cache" &redis [cache, redis]:
      replicas: 3

# Связи с использованием якорей
*frontend => *api-gateway: HTTPS requests
*api-gateway => 
  *user-svc: /api/users/*
  *order-svc: /api/orders/*  
  *payment-svc: /api/payments/*

# Мониторинг всех сервисов
Services.* -> *prometheus: metrics
*prometheus -> *grafana: visualization
*prometheus -> *alerts: notifications

# Данные
*user-svc -> *user-db: user data
*order-svc -> *order-db: order data
Services.* -> *redis: caching

# Cross-references
@import: "./shared-patterns.lff"
@ref: shared-patterns.MonitoringStack#prometheus-config
@ref: shared-patterns.DatabaseCluster#postgres-ha
```

---

## 🤖 Руководство для LLM

### Правила генерации LFF

1. **Структура документа:**
   - Начинайте с директив `@title`, `@version`
   - Объявляйте все узлы перед связями
   - Группируйте связанные элементы в блоки

2. **Именование:**
   - Используйте camelCase или "Quoted Names"
   - Избегайте специальных символов кроме `-`, `_`
   - Делайте имена понятными: `UserService` а не `US`

3. **Типизация:**
   - Всегда указывайте типы: `[service]`, `[database]`
   - Используйте стандартные типы из спецификации
   - Добавляйте характеристики: `[service, critical]`

4. **Связи:**
   - Используйте `->` для обычных связей
   - `=>` для множественных (с отступом)
   - Добавляйте описания: `Service -> DB: queries`

5. **Отступы:**
   - Строго 2 пробела на уровень
   - Проверяйте консистентность отступов
   - Не смешивайте пробелы и табы

### Алгоритм парсинга для LLM

1. **Препроцессинг:**
   - Удалить комментарии
   - Нормализовать отступы  
   - Разбить на токены

2. **Обработка директив:**
   - Найти все строки начинающиеся с `@`
   - Извлечь метаданные документа
   - Настроить контекст парсинга

3. **Создание узлов:**
   - Найти строки с идентификаторами без стрелок
   - Извлечь типы из `[...]`
   - Обработать блоки с метаданными

4. **Создание связей:**
   - Найти строки со стрелками `->`, `=>`, etc.
   - Резолвить пути к узлам
   - Добавить метаданные связей

5. **Построение иерархии:**
   - Использовать отступы для группировки
   - Создать дерево элементов
   - Связать родительские и дочерние элементы

---

## ✅ Валидация и проверки

### Синтаксические проверки
- [ ] Корректные отступы (кратные 2)
- [ ] Закрытые кавычки в именах
- [ ] Валидные стрелки
- [ ] Корректный формат директив

### Семантические проверки  
- [ ] Все ссылки на узлы разрешимы
- [ ] Нет циклических зависимостей
- [ ] Корректные типы узлов
- [ ] Валидные значения директив

### LLM-специфичные проверки
- [ ] Консистентное именование
- [ ] Логичная структура 
- [ ] Полнота описания
- [ ] Соответствие домену

---

## 📖 Best Practices

### Для людей
1. **Начинайте просто** - от общего к деталям
2. **Группируйте логически** - используйте блоки  
3. **Именуйте понятно** - избегайте аббревиатур
4. **Документируйте решения** - через метаданные
5. **Используйте уровни** - для управления сложностью
6. **📍 Добавляйте навигацию** - breadcrumbs и контексты для больших диаграмм
7. **🎨 Стилизуйте осмысленно** - выделяйте критичные компоненты
8. **🔗 Используйте ID и якоря** - для связности и переиспользования

### Для LLM  
1. **Будьте последовательны** - одинаковые паттерны для похожих элементов
2. **Избегайте двусмысленности** - один способ записи
3. **Проверяйте синтаксис** - следуйте формальной грамматике
4. **Используйте типы** - помогают в понимании семантики
5. **Валидируйте результат** - перед выводом пользователю
6. **🧭 Генерируйте навигацию** - автоматические breadcrumbs на основе иерархии
7. **🎯 Применяйте ID** - для ссылок между частями больших графов
8. **📖 Добавляйте bookmarks** - для критических путей и важных компонентов

### Для больших диаграмм
1. **🗺️ Структурируйте иерархически** - используйте namespace ID
2. **📌 Создавайте закладки** - для быстрой навигации
3. **🔄 Используйте cross-reference** - связывайте связанные диаграммы
4. **⚡ Добавляйте shortcuts** - для часто используемых элементов
5. **🎨 Применяйте темы** - для консистентного оформления
6. **📍 Документируйте навигацию** - up/down/related контексты

---

## 🌐 Экосистема LFF

### Текущее состояние (v1.0)

#### ✅ Готово
- **Спецификация LFF 1.0** - Полное описание синтаксиса и семантики
- **@layerflow/core** - Базовые типы и интерфейсы
- **Формальная грамматика** - EBNF описание для создания парсеров
- **Примеры и тесты** - Набор референсных LFF файлов
- **🧭 Навигация и breadcrumbs** - Автоматическая и явная навигация по диаграммам
- **🎨 Система стилизации** - CSS-совместимые стили, темы, условная стилизация
- **🔗 ID, якоря и ссылки** - Уникальные идентификаторы и cross-reference
- **📌 Закладки и shortcuts** - Быстрая навигация по большим графам

#### 🚧 В разработке  
- **@layerflow/parser** - TypeScript парсер с плагинной архитектурой
- **Plugin System** - Система регистрации и управления плагинами
- **@layerflow/c4-template** - Первый референсный плагин для C4
- **Базовая валидация** - Синтаксические и семантические проверки

### Roadmap развития

#### 📅 Q1 2025 - Плагинная основа
- [ ] Завершить базовый парсер с plugin API
- [ ] **@layerflow/c4-template** - C4 Architecture Model плагин (базовый)
- [ ] **@layerflow/k8s-template** - Kubernetes resources плагин (базовый)
- [ ] CLI инструмент с поддержкой плагинов
- [ ] VS Code расширение с plugin-aware подсветкой

#### 📅 Q2 2025 - Основные плагины
- [ ] **@layerflow/bpmn-template** - Business Process плагин
- [ ] **@layerflow/ddd-template** - Domain-Driven Design плагин
- [ ] **@layerflow/hypothesis-template** - Карта гипотез плагин
- [ ] Веб-компонент для рендеринга с плагинами
- [ ] Базовая документация по созданию плагинов

#### 📅 Q3 2025 - Enterprise-grade система (КЛЮЧЕВОЙ КВАРТАЛ)
**Месяц 1: Core Extensions API**
- [ ] **Type Registry System** - регистрация и управление типами
- [ ] **Directive Registry System** - расширяемые директивы
- [ ] **Enhanced PluginManager API** - расширенный интерфейс плагинов
- [ ] **Validation Registry** - кастомные правила валидации

**Месяц 2: Domain-Aware Parser**
- [ ] **Автоматическая активация доменов** - @domain: c4 → загрузка плагина
- [ ] **Implicit domain detection** - @context → c4, @deployment → k8s
- [ ] **Plugin-aware парсер** - поддержка зарегистрированных директив
- [ ] **Domain-specific валидация** - проверки с учетом активных доменов

**Месяц 3: Reference Implementation**
- [ ] **Полноценный C4 плагин** - с type registry и директивами
- [ ] **Conflict resolution** - разрешение конфликтов между плагинами
- [ ] **Plugin composition** - взаимодействие между плагинами
- [ ] **IDE integration** - автокомплит на основе зарегистрированных типов

#### 📅 Q4 2025 - Экосистема мирового уровня
**Enterprise плагины:**
- [ ] **@layerflow/aws-template** - AWS Architecture с full type registry
- [ ] **@layerflow/azure-template** - Azure плагин с автокомплитом
- [ ] **@layerflow/terraform-template** - Infrastructure as Code плагин
- [ ] **@layerflow/monitoring-template** - Observability плагин с зависимостями

**Advanced возможности:**
- [ ] **Plugin Marketplace** - регистрация и distribution плагинов
- [ ] **Plugin Certification Program** - верификация качества плагинов
- [ ] **Namespaced Types** - c4:system vs k8s:system resolution
- [ ] **Plugin Dependencies** - автоматическое управление зависимостями
- [ ] **AI Plugin Generator** - генерация плагинов из описания

### Как принять участие

#### Для разработчиков
```bash
# Клонировать монорепозиторий
git clone https://github.com/layerflow/layerflow
cd layerflow

# Установить зависимости
pnpm install

# Запустить тесты ядра
pnpm test:core

# Разработка плагина
pnpm create-plugin --name my-domain-template
cd packages/my-domain-template

# Тестирование плагина
pnpm test:plugin
pnpm build
```

#### Для разработчиков плагинов
```typescript
// Создание нового плагина
import { LFFPlugin, GrammarBuilder } from '@layerflow/parser'

const myPlugin: LFFPlugin = {
  name: 'my-domain-template',
  version: '1.0.0',
  
  extendGrammar: (builder: GrammarBuilder) => {
    // Добавить доменные директивы
    builder.addDirective('my-directive', parseMyDirective)
  },
  
  transformAST: (ast) => {
    // Доменная трансформация AST
    return transformMyDomain(ast)
  }
}

export default myPlugin
```

#### Для сообщества
- **🔌 Создание плагинов** - Новые доменные расширения
- **🐛 Баг-репорты** - Проблемы в ядре или плагинах
- **💡 Предложения** - Идеи для новых плагинов
- **📝 Примеры** - LFF файлы с использованием плагинов
- **📚 Документация** - Туториалы по созданию плагинов

#### Для компаний
- **🏢 Enterprise плагины** - Создание корпоративных расширений  
- **💰 Спонсорство экосистемы** - Поддержка развития платформы
- **🎓 Обучение команд** - Внедрение LFF и плагинов
- **🤝 Партнерство** - Интеграция с существующими инструментами
- **🔒 Private plugin registry** - Корпоративные решения

---

## 🔄 Совместимость и миграция

### Планируемая поддержка форматов

#### Импорт (планируется в Q2-Q3 2025)
```bash
# Планируемые конвертеры
layerflow convert --from mermaid diagram.mmd --to lff > diagram.lff
layerflow convert --from plantuml-c4 architecture.puml --to lff > architecture.lff
layerflow convert --from dot graph.dot --to lff > graph.lff
```

#### Экспорт (планируется в Q2 2025)
```bash
# Для совместимости с существующими системами
layerflow export --to mermaid diagram.lff > diagram.mmd
layerflow export --to plantuml diagram.lff > diagram.puml
layerflow export --to json diagram.lff > diagram.json
```

### Версионирование
- **Мажорная версия**: Изменения синтаксиса (1.0 -> 2.0)
- **Минорная версия**: Новые возможности (1.0 -> 1.1)  
- **Патч версия**: Исправления и уточнения (1.0.1 -> 1.0.2)

### Текущая версия
```lff
@lff-version: 1.0
@specification: 1.0
@status: initial-release
```

---

## 🎯 Цели и видение LFF

### Почему нужен новый стандарт

#### Архитектурные вызовы
- **📈 Растущая сложность систем** требует многоуровневого представления
- **🤖 ИИ в разработке** нуждается в структурированных форматах
- **☁️ Cloud-native архитектуры** требуют новых способов описания
- **🔄 DevOps и IaC** интегрируются с архитектурной документацией

### Планируемые преимущества

#### Для разработчиков
- **🚀 Скорость документирования** - простой синтаксис, будущие ИИ-помощники
- **🔗 Интеграция с кодом** - планируемый парсинг из исходников
- **👥 Командная работа** - читаемость, git-friendly формат
- **📊 Аналитика архитектуры** - машинная обработка диаграмм

#### Для индустрии (долгосрочные цели)
- **🏢 Enterprise adoption** - планируемые корпоративные инструменты
- **🎓 Образование** - потенциал для университетских курсов
- **📚 Документация** - цель стать стандартом для архитектурных решений
- **🛠️ Tooling ecosystem** - развитие экосистемы инструментов

### Критерии успеха

#### Краткосрочные (2025)
- [ ] 100+ GitHub звезд
- [ ] 10+ контрибьюторов
- [ ] 5+ компаний используют в пилотных проектах
- [ ] Базовая экосистема инструментов

#### Среднесрочные (2026-2027)
- [ ] 1000+ GitHub звезд
- [ ] 50+ контрибьюторов  
- [ ] 100+ компаний используют в продакшене
- [ ] Поддержка в популярных IDE
- [ ] Интеграция с major cloud providers

#### Долгосрочные (2028+)
- [ ] Признание как индустриальный стандарт
- [ ] Включение в образовательные программы
- [ ] Enterprise tooling и сертификации
- [ ] Широкая экосистема плагинов и расширений

---

## 📋 Спецификация соответствия

### Уровни поддержки LFF

#### ✅ LFF Core (минимальная поддержка)
- Базовый синтаксис узлов и связей
- Типизация узлов `[type]`
- Блоки и иерархия с отступами
- Директивы метаданных `@key: value`
- Комментарии `#`

#### 🔧 LFF Extended (рекомендуемая поддержка)
- Многоуровневость `@N`
- Импорты `@import:`
- Доменные расширения `@domain:`
- Расширенная валидация
- 🧭 **Навигация** - breadcrumbs, контексты, закладки
- 🎨 **Стилизация** - CSS-стили, темы, условное оформление
- 🔗 **ID и якоря** - уникальные идентификаторы, cross-reference

#### 🔌 LFF Plugin Support (полная поддержка)
- **Plugin API** - регистрация и управление плагинами
- **Расширение грамматики** - добавление доменных директив
- **AST трансформации** - доменная обработка
- **Паттерны и стили** - готовые шаблоны плагинов
- **Композиция плагинов** - одновременное использование нескольких
- **Зависимости плагинов** - управление связями между плагинами

### Тестирование (планируется в Q2 2025)
```bash
# Тестирование соответствия ядра
layerflow test-compliance --level core my-parser/
layerflow test-compliance --level extended my-parser/
layerflow test-compliance --level plugin-support my-parser/

# Валидация с плагинами
layerflow validate --strict --plugins c4-template,k8s-template diagram.lff
layerflow lint --rules architectural --plugins bpmn-template process.lff

# Управление плагинами
layerflow plugin list
layerflow plugin install @layerflow/c4-template
layerflow plugin create my-domain-template --template basic

# Тестирование плагинов
layerflow plugin test @layerflow/c4-template
layerflow plugin validate my-plugin/ --against core-api
```

### Референсные тесты
- **Синтаксические тесты** - Корректность парсинга
- **Семантические тесты** - Валидация связей и типов  
- **Примеры доменов** - C4, Kubernetes, микросервисы
- **Edge cases** - Граничные случаи и ошибки

### Правила для Team Topologies

```lff
@domain: team-topologies
@validation-rules:
  - cognitive-load-limit: "Stream-aligned team should own <3 domains"
  - platform-team-ratio: "1 platform team per 4-8 stream teams"
  - interaction-modes: "Must specify interaction mode between teams"

@lint team-topologies:
  - error: "Team cognitive load exceeded"
  - warn: "Missing interaction mode"
  - info: "Consider team API for this interaction"
```

### Правила для Карты гипотез

```lff
@domain: hypothesis-mapping
@validation-rules:
  - subject-required: "Карта должна содержать минимум одного субъекта"
  - goal-has-metrics: "Каждая цель должна иметь измеримые показатели"
  - hypothesis-links-goal: "Каждая гипотеза должна быть связана с целью"
  - task-implements-hypothesis: "Каждая задача должна реализовывать гипотезу"
  - hadi-cycle-complete: "HADI цикл должен содержать все 4 элемента"

# Семантические проверки
@lint hypothesis-mapping:
  - error: "Гипотеза не связана ни с одной целью"
  - error: "Цель без измеримых показателей"
  - warn: "Задача не имеет ответственного (assignee)"
  - warn: "Высокая уверенность (confidence=high) без данных"
  - info: "Рассмотрите создание HADI цикла для этой гипотезы"
  - info: "Субъект с высоким влиянием требует особого внимания"
```

### Правила для Wardley Mapping

```lff
@domain: wardley-mapping
@validation-rules:
  - value-chain-required: "Должна быть четкая цепочка ценности от пользователя"
  - evolution-stages: "Компоненты должны иметь стадию эволюции"  
  - dependencies-logical: "Зависимости должны следовать логике"
  - movement-rationale: "Стратегические движения должны иметь обоснование"

@lint wardley-mapping:
  - error: "Компонент без стадии эволюции"
  - error: "Циклическая зависимость в цепочке ценности"
  - warn: "Движение против эволюции (из commodity в genesis)"
  - warn: "Критический компонент в genesis стадии"
  - info: "Рассмотрите аутсорсинг commodity компонентов"
```

---

## 🎛️ Расширенные директивы

### Метаданные и аннотации

```lff
# Документирование решений
@decision: "Chose MongoDB for flexibility"
@rationale: "Need to handle varying product schemas"
@alternatives: ["PostgreSQL JSON", "GraphQL Federation"]
@trade-offs: "Consistency vs Flexibility"

# Статус и жизненный цикл
@status: experimental     # experimental | stable | deprecated
@maturity: prototype      # prototype | mvp | production
@lifecycle: active        # active | maintenance | sunset

# Качественные атрибуты
@performance: 
  latency: "<100ms"
  throughput: "1000 req/s"
  
@security:
  classification: confidential
  encryption: "AES-256"
  
@compliance: ["GDPR", "PCI-DSS", "SOX"]
```

### Связь с внешними системами

```lff
# Интеграция с документацией
@docs: 
  confluence: "https://wiki.company.com/architecture"
  adr: "./docs/adr/001-microservices.md"
  runbook: "./runbooks/payment-service.md"

# Связь с кодом
@code:
  repository: "https://github.com/company/payment-service"
  main-branch: "main"
  deploy-branch: "production"

# Мониторинг и наблюдаемость  
@monitoring:
  dashboard: "https://grafana.company.com/d/payments"
  alerts: "https://prometheus.company.com/alerts/payments"
  logs: "https://kibana.company.com/app/payments"

# CI/CD и развертывание
@deployment:
  pipeline: "https://jenkins.company.com/job/payment-service"
  environments: ["dev", "staging", "prod"]
  strategy: blue-green
```

### Условная логика

```lff
# Среда выполнения
@when environment == "production":
  Monitoring [prometheus]
  Alerting [pagerduty]
  
@when environment == "development":
  DebugTools [debugger]
  MockServices [wiremock]

# Возможности системы  
@feature-flag "new-payment-flow":
  OldPaymentService [service] @when !feature-flag
  NewPaymentService [service] @when feature-flag

# Размер команды
@if team-size > 8:
  # Разделить на два контекста
  UserProfile [bounded-context]
  UserPermissions [bounded-context]
@else:
  # Один контекст
  UserManagement [bounded-context]
```

---

## 🔌 Плагинная архитектура LFF

### Философия расширений

LFF использует **плагинную архитектуру** для поддержки доменных расширений, обеспечивая:
- **Единый базовый парсер** - вся основная грамматика в `@layerflow/parser`
- **Легкие плагины** - доменная логика в отдельных пакетах
- **Динамическое расширение** - регистрация плагинов по требованию
- **Масштабируемость** - новые домены без изменения ядра

### Архитектура системы

```lff
@title: LFF Plugin Architecture
@domain: system-design

Core:
  "@layerflow/parser" [core-parser]:
    description: "Базовая LFF грамматика и AST"
    responsibility: ["Лексинг", "Парсинг", "Базовая валидация"]
    
  "Plugin System" [plugin-system]:
    description: "Регистрация и управление плагинами"
    responsibility: ["Plugin registry", "AST transformation", "Grammar extension"]

Templates:
  "@layerflow/c4-template" [plugin]:
    extends: "C4 Architecture Model"
    provides: ["@context", "@container", "@component"]
    
  "@layerflow/k8s-template" [plugin]:
    extends: "Kubernetes resources"
    provides: ["@deployment", "@service", "@ingress"]
    
  "@layerflow/bpmn-template" [plugin]:
    extends: "Business Process Model"
    provides: ["@process", "@task", "@gateway"]
    
  "@layerflow/ddd-template" [plugin]:
    extends: "Domain-Driven Design"
    provides: ["@bounded-context", "@aggregate", "@domain-event"]

"@layerflow/parser" -> "Plugin System": registers plugins
Templates.* -> "Plugin System": extend grammar
```

### 1. Базовый парсер (@layerflow/parser)

#### Интерфейс парсера
```typescript
import { parseLFF, registerPlugin, PluginConfig } from '@layerflow/parser'

// Базовый парсинг
const { ast, errors } = parseLFF(lffText)

// С плагинами
const { ast, errors } = parseLFF(lffText, {
  plugins: ['c4-template', 'k8s-template'],
  strict: true
})

// Регистрация плагина
registerPlugin(c4Plugin)
```

#### Базовая грамматика
```typescript
interface BaseLFFGrammar {
  // Основные элементы
  nodes: NodeDef[]
  edges: EdgeDef[]
  blocks: BlockDef[]
  directives: DirectiveDef[]
  
  // Расширяемые части
  customDirectives: Map<string, DirectiveHandler>
  customTransforms: ASTTransformFn[]
  
  // Валидация
  validators: ValidationRule[]
}
```

### 2. Структура плагина

#### Интерфейс плагина
```typescript
interface LFFPlugin {
  name: string
  version: string
  
  // Расширение грамматики
  extendGrammar?: (builder: GrammarBuilder) => void
  
  // Трансформация AST
  transformAST?: (ast: LFFNode[]) => LFFNode[]
  
  // Валидация
  validators?: ValidationRule[]
  
  // Ресурсы плагина
  patterns?: Record<string, PatternDef>
  styles?: Record<string, StyleDef>
  snippets?: Record<string, string>
}
```

#### Расширение грамматики
```typescript
interface GrammarBuilder {
  // Новые директивы
  addDirective(name: string, parser: DirectiveParser): void
  
  // Новые типы узлов
  addNodeType(type: string, validator: NodeValidator): void
  
  // Новые типы связей
  addEdgeType(type: string, parser: EdgeParser): void
  
  // Новые блоки
  addBlockType(type: string, parser: BlockParser): void
}
```

### 3. Пример плагина: C4 Template

#### Определение плагина
```typescript
// @layerflow/c4-template/src/index.ts
import { 
  LFFPlugin, 
  GrammarBuilder, 
  ASTNode,
  ValidationRule 
} from '@layerflow/parser'

const c4Plugin: LFFPlugin = {
  name: 'c4-template',
  version: '1.0.0',
  
  extendGrammar: (builder: GrammarBuilder) => {
    // C4-специфичные директивы
    builder.addDirective('context', parseContextBlock)
    builder.addDirective('container', parseContainerBlock)  
    builder.addDirective('component', parseComponentBlock)
    
    // C4 типы узлов
    builder.addNodeType('person', validatePersonNode)
    builder.addNodeType('system', validateSystemNode)
    builder.addNodeType('container', validateContainerNode)
    builder.addNodeType('component', validateComponentNode)
  },
  
  transformAST: (ast: ASTNode[]) => {
    // Группировка узлов по C4 уровням
    const transformed = groupByC4Levels(ast)
    
    // Добавление технологических меток
    addTechnologyLabels(transformed)
    
    // Валидация C4 правил
    validateC4Hierarchy(transformed)
    
    return transformed
  },
  
  validators: [
    {
      name: 'c4-hierarchy',
      rule: 'Components must be inside containers',
      check: validateC4Hierarchy
    },
    {
      name: 'c4-technology',
      rule: 'Containers must specify technology',
      check: validateTechnologyRequired
    }
  ],
  
  patterns: {
    SystemContext: `
      @context:
        Customer [person] -> System [system]: Uses
        System -> ExternalAPI [external]: Integrates
    `,
    
    ContainerView: `
      @container "System":
        WebApp [container.spa]:
          technology: "React"
        API [container.api]:
          technology: "Node.js"
        Database [container.database]:
          technology: "PostgreSQL"
    `,
    
    ComponentView: `
      @component "API":
        Controller [component]
        Service [component]  
        Repository [component]
        
        Controller -> Service -> Repository
    `
  },
  
  styles: {
    person: {
      shape: 'circle',
      background: '#1168bd',
      color: '#ffffff'
    },
    system: {
      shape: 'rounded-rectangle',
      background: '#1168bd',
      color: '#ffffff'
    },
    container: {
      shape: 'rounded-rectangle', 
      background: '#438dd5',
      color: '#ffffff'
    },
    component: {
      shape: 'rectangle',
      background: '#85bbf0',
      color: '#000000'
    }
  },
  
  snippets: {
    'c4-context': '@context:\n  $1 [person] -> $2 [system]: $3',
    'c4-container': '@container "$1":\n  $2 [container]:\n    technology: "$3"',
    'c4-component': '@component "$1":\n  $2 [component]:\n    responsibility: "$3"'
  }
}

export default c4Plugin
```

#### Использование плагина
```typescript
// В пользовательском коде
import { parseLFF, registerPlugin } from '@layerflow/parser'
import c4Plugin from '@layerflow/c4-template'

// Регистрация плагина
registerPlugin(c4Plugin)

// LFF с C4 нотацией
const c4Diagram = `
@domain: c4
@title: Banking System

@context:
  Customer [person] -> BankingSystem [system]: Uses
  BankingSystem -> EmailSystem [external]: Sends emails

@container "BankingSystem":
  WebApp [container.spa]:
    technology: "React"
  API [container.api]:
    technology: "Java Spring"
  Database [container.database]:
    technology: "PostgreSQL"
`

// Парсинг с C4 плагином
const { ast, errors } = parseLFF(c4Diagram, {
  plugins: ['c4-template']
})

// AST содержит C4-специфичные узлы
console.log(ast.c4Levels) // { context: [...], containers: [...] }
```

### 4. Дополнительные плагины

#### Kubernetes Template
```typescript
// @layerflow/k8s-template
const k8sPlugin: LFFPlugin = {
  name: 'k8s-template',
  
  extendGrammar: (builder) => {
    builder.addDirective('deployment', parseDeployment)
    builder.addDirective('service', parseService)
    builder.addDirective('ingress', parseIngress)
    builder.addDirective('namespace', parseNamespace)
  },
  
  patterns: {
    Microservice: `
      @deployment "$name":
        replicas: 3
        image: "$image"
        ports: [8080]
        
      @service "$name-svc":
        selector: "$name"
        ports: [80:8080]
    `
  }
}
```

#### BPMN Template  
```typescript
// @layerflow/bpmn-template
const bpmnPlugin: LFFPlugin = {
  name: 'bpmn-template',
  
  extendGrammar: (builder) => {
    builder.addDirective('process', parseProcess)
    builder.addNodeType('start-event', validateStartEvent)
    builder.addNodeType('end-event', validateEndEvent)
    builder.addNodeType('user-task', validateUserTask)
    builder.addNodeType('service-task', validateServiceTask)
    builder.addNodeType('exclusive-gateway', validateGateway)
  },
  
  validators: [
    {
      name: 'bpmn-flow',
      rule: 'Process must have start and end events',
      check: validateProcessFlow
    }
  ]
}
```

### 5. Композиция плагинов

#### Множественные плагины
```typescript
// Использование нескольких плагинов одновременно
const { ast, errors } = parseLFF(complexDiagram, {
  plugins: ['c4-template', 'k8s-template', 'monitoring-template']
})

// Плагины могут взаимодействовать через AST
```

#### Зависимости плагинов
```typescript
const monitoringPlugin: LFFPlugin = {
  name: 'monitoring-template',
  dependencies: ['k8s-template'], // Требует k8s плагин
  
  transformAST: (ast) => {
    // Добавляет мониторинг к k8s ресурсам
    addMonitoringToK8sResources(ast)
    return ast
  }
}
```

### 6. Преимущества архитектуры

#### Масштабируемость
- **Новые домены** без изменения ядра
- **Независимая разработка** плагинов
- **Версионирование** плагинов отдельно от парсера

#### Производительность
- **Ленивая загрузка** - только нужные плагины
- **Кэширование** результатов трансформации
- **Параллельная обработка** плагинов

#### Экосистема
- **Community plugins** - открытая разработка
- **Enterprise plugins** - коммерческие расширения  
- **Custom plugins** - внутренние плагины компаний

### 7. Техническая готовность ядра (Анализ Q2 2025)

#### ✅ Готовые компоненты
```typescript
// @layerflow/core/types.ts - Суперчистое ядро
interface GraphNode {
  id: string
  type?: string              // Универсальный string тип
  metadata?: Record<string, any>  // Расширяемость без breaking changes
  level?: number
  // ...остальные поля
}

// @layerflow/core/plugins.ts - Solid foundation
interface PluginManager {
  install(plugin: Plugin): void
  uninstall(name: string): void
  emit(event: string, data: any): Promise<void>  // Async hooks
  // ...хуки для graph:created, node:beforeAdd
}
```

#### ❌ Недостающие компоненты для enterprise-уровня

**1. Type Registry System**
```typescript
// Нужно добавить в ядро
interface NodeTypeDefinition {
  name: string                    // 'service', 'system', 'container'
  description?: string           // Человекочитаемое описание
  icon?: string                  // Для UI/визуализации
  category?: string              // 'c4', 'k8s', 'bpmn'
  defaultMetadata?: Record<string, any>
  validation?: (node: GraphNode) => ValidationError[]
  autoComplete?: PropertySchema[]  // Для IDE поддержки
}

interface TypeRegistry {
  registerType(type: NodeTypeDefinition): void
  getType(name: string): NodeTypeDefinition | undefined
  getAllTypes(): NodeTypeDefinition[]
  getTypesByCategory(category: string): NodeTypeDefinition[]
}
```

**2. Directive Registry System**
```typescript
interface DirectiveDefinition {
  name: string                   // '@context', '@aggregate'
  domain: string                 // 'c4', 'ddd', 'bpmn'
  parser: DirectiveParser        // Парсинг синтаксиса
  validator?: DirectiveValidator // Семантическая валидация
  transformer?: ASTTransformer   // Преобразование AST
}

interface DirectiveRegistry {
  registerDirective(directive: DirectiveDefinition): void
  getDirective(name: string): DirectiveDefinition | undefined
  getDirectivesByDomain(domain: string): DirectiveDefinition[]
}
```

**3. Domain Activation System**
```typescript
interface DomainActivator {
  // При встрече @domain: c4 автоматически:
  activateDomain(domain: string, graph: GraphAST): void
  
  // 1. Загружает нужный плагин
  // 2. Регистрирует типы и директивы
  // 3. Применяет доменные правила валидации
  // 4. Настраивает автокомплит для редакторов
}
```

#### 🎯 Roadmap технических улучшений

### Q3 2025 - Type Registry & Domain System

#### Месяц 1: Core Extensions API
```typescript
// Расширение PluginManager API
interface EnhancedPluginManager extends PluginManager {
  // Type Registry
  registerNodeType(definition: NodeTypeDefinition): void
  registerEdgeType(definition: EdgeTypeDefinition): void
  
  // Directive Registry  
  registerDirective(directive: DirectiveDefinition): void
  
  // Validation Registry
  registerValidationRule(rule: ValidationRule): void
  
  // Domain Activation
  activateDomain(domain: string): void
  getActiveDomains(): string[]
}
```

#### Месяц 2: Domain-Aware Parser
```typescript
// Расширяемый парсер с поддержкой новых директив
interface PluginAwareParser {
  // Парсер знает о зарегистрированных директивах
  parseDocument(text: string, activeDomains: string[]): ParseResult
  
  // Автоматическая активация доменов
  detectDomains(text: string): string[]  // @domain: c4 → ['c4']
  
  // Валидация с учетом активных типов
  validateWithDomains(ast: GraphAST, domains: string[]): ValidationError[]
}
```

#### Месяц 3: Reference Implementation
```typescript
// @layerflow/c4-template - Полноценный плагин
const c4Plugin: EnhancedPlugin = {
  name: 'c4-template',
  version: '1.0.0',
  
  install: (manager: EnhancedPluginManager) => {
    // Регистрация C4 типов
    manager.registerNodeType({
      name: 'person',
      description: 'C4 Person',
      category: 'c4',
      icon: 'user-circle',
      defaultMetadata: {
        shape: 'circle',
        color: '#1168bd'
      },
      validation: validatePersonNode,
      autoComplete: [
        { name: 'role', type: 'string', required: false },
        { name: 'department', type: 'string', required: false }
      ]
    })
    
    manager.registerNodeType({
      name: 'system',
      description: 'C4 Software System', 
      category: 'c4',
      validation: validateSystemNode
    })
    
    // Регистрация C4 директив
    manager.registerDirective({
      name: 'context',
      domain: 'c4',
      parser: parseContextBlock,
      validator: validateC4Context,
      transformer: transformToC4Context
    })
    
    manager.registerDirective({
      name: 'container',
      domain: 'c4', 
      parser: parseContainerBlock,
      validator: validateC4Container
    })
    
    // C4-специфичные правила валидации
    manager.registerValidationRule({
      name: 'c4-hierarchy',
      domains: ['c4'],
      validate: (graph) => validateC4Hierarchy(graph)
    })
  }
}
```

### Q4 2025 - Advanced Plugin Ecosystem

#### Конфликт-резолюция между плагинами
```typescript
interface ConflictResolver {
  // Стратегии разрешения конфликтов типов
  resolveTypeConflict(
    type1: NodeTypeDefinition, 
    type2: NodeTypeDefinition
  ): NodeTypeDefinition
  
  // Приоритеты плагинов
  setPluginPriority(pluginName: string, priority: number): void
  
  // Namespace для типов
  registerNamespacedType(namespace: string, type: NodeTypeDefinition): void
}

// Пример: конфликт между c4:system и k8s:system
manager.registerNamespacedType('c4', systemType)
manager.registerNamespacedType('k8s', systemType)

// В LFF файле:
"Payment System" [c4:system] -> "Kubernetes Cluster" [k8s:system]
```

#### Plugin Dependencies & Composition
```typescript
interface PluginDependency {
  name: string
  version: string
  optional?: boolean
}

interface ComposablePlugin extends EnhancedPlugin {
  dependencies?: PluginDependency[]
  
  // Хук для взаимодействия с другими плагинами
  compose?: (installedPlugins: Map<string, Plugin>) => void
}

// Пример: monitoring плагин расширяет k8s плагин
const monitoringPlugin: ComposablePlugin = {
  name: 'monitoring-template',
  dependencies: [
    { name: 'k8s-template', version: '^1.0.0' }
  ],
  
  compose: (plugins) => {
    const k8sPlugin = plugins.get('k8s-template')
    if (k8sPlugin) {
      // Добавляем мониторинг к k8s ресурсам
      enhanceK8sWithMonitoring(k8sPlugin)
    }
  }
}
```

### 8. Стратегические архитектурные решения

#### Официальные vs Кастомные типы
```typescript
// Трёхуровневая система типов
enum TypeLevel {
  CORE = 'core',        // Встроенные: 'service', 'database'
  OFFICIAL = 'official', // @layerflow/c4-template
  CUSTOM = 'custom'      // Пользовательские плагины
}

interface TypeMetadata {
  level: TypeLevel
  source: string        // '@layerflow/c4-template' или 'my-company/plugin'
  verified?: boolean    // Прошел ли сертификацию
}
```

#### Domain Activation Strategy
```typescript
// Автоматическая активация доменов
class AutoDomainActivator {
  detectAndActivate(text: string): string[] {
    const domains = this.extractDomains(text)  // @domain: c4
    const implicitDomains = this.detectImplicit(text)  // @context → c4
    
    return [...domains, ...implicitDomains]
  }
  
  private detectImplicit(text: string): string[] {
    const rules = [
      { pattern: /@context\s*:/, domain: 'c4' },
      { pattern: /@deployment\s*:/, domain: 'k8s' },
      { pattern: /@aggregate\s*:/, domain: 'ddd' }
    ]
    
    return rules
      .filter(rule => rule.pattern.test(text))
      .map(rule => rule.domain)
  }
}
```

#### Backward Compatibility Strategy
```typescript
interface CompatibilityLayer {
  // Миграция старых схем на новые типы
  migrateNode(oldNode: any, targetVersion: string): GraphNode
  
  // Поддержка deprecated типов
  handleDeprecatedType(type: string): NodeTypeDefinition | null
  
  // Версионирование плагинов
  resolvePluginVersion(plugin: string, requestedVersion: string): Plugin
}
```

### 9. Текущая готовность ядра (Q2 2025)

| Компонент | Статус | Q3 2025 | Q4 2025 | Критичность |
|-----------|--------|---------|---------|-------------|
| **Базовая плагин-система** | ✅ | — | — | Core |
| **Хуки событий** | ✅ | — | — | Core |
| **Type Registry** | ❌ | ✅ | ✅ | **Critical** |
| **Directive Registry** | ❌ | ✅ | ✅ | **Critical** |
| **Domain Activation** | ❌ | ✅ | ✅ | **Critical** |
| **Конфликт-резолюция** | ❌ | ❌ | ✅ | High |
| **Plugin Dependencies** | ❌ | ❌ | ✅ | High |
| **Namespaced Types** | ❌ | ❌ | ✅ | Medium |
| **IDE Integration** | ❌ | ✅ | ✅ | High |
| **Plugin Marketplace** | ❌ | ❌ | ✅ | Medium |

**Заключение**: Ядро имеет solid foundation, но для industrial-grade экосистемы критически необходимы Type Registry, Directive Registry и Domain Activation в Q3 2025.

### 10. PoC: Полноценный C4 плагин

#### Пример C4 Template с Type Registry
```typescript
// @layerflow/c4-template/src/types.ts
export const c4NodeTypes: NodeTypeDefinition[] = [
  {
    name: 'person',
    description: 'A person who interacts with the software system',
    category: 'c4',
    icon: 'user-circle',
    defaultMetadata: {
      shape: 'circle',
      background: '#1168bd',
      color: '#ffffff'
    },
    validation: (node) => {
      const errors: ValidationError[] = []
      if (!node.metadata?.role) {
        errors.push({
          type: 'warning',
          message: 'Person should have a role defined',
          node: node.id
        })
      }
      return errors
    },
    autoComplete: [
      { name: 'role', type: 'string', description: 'Person role or job title' },
      { name: 'department', type: 'string', description: 'Department or team' },
      { name: 'responsibilities', type: 'array', description: 'List of responsibilities' }
    ]
  },
  
  {
    name: 'system',
    description: 'A software system that delivers value to users',
    category: 'c4',
    defaultMetadata: {
      shape: 'rounded-rectangle',
      background: '#1168bd',
      color: '#ffffff'
    },
    validation: (node) => {
      const errors: ValidationError[] = []
      if (!node.metadata?.purpose) {
        errors.push({
          type: 'error', 
          message: 'System must have a defined purpose',
          node: node.id
        })
      }
      return errors
    },
    autoComplete: [
      { name: 'purpose', type: 'string', required: true },
      { name: 'technology', type: 'string' },
      { name: 'team', type: 'string' }
    ]
  }
]

// @layerflow/c4-template/src/directives.ts
export const c4Directives: DirectiveDefinition[] = [
  {
    name: 'context',
    domain: 'c4',
    description: 'Defines the system context view',
    parser: (content: string) => {
      // Парсинг @context: блока
      return parseContextBlock(content)
    },
    validator: (directive, graph) => {
      // Проверка C4 Context правил:
      // - Должен содержать хотя бы одного person
      // - Должен содержать хотя бы одну system
      const persons = graph.nodes.filter(n => n.type === 'person')
      const systems = graph.nodes.filter(n => n.type === 'system')
      
      const errors: ValidationError[] = []
      if (persons.length === 0) {
        errors.push({
          type: 'error',
          message: 'Context view must include at least one person',
          directive: directive.name
        })
      }
      if (systems.length === 0) {
        errors.push({
          type: 'error', 
          message: 'Context view must include at least one system',
          directive: directive.name
        })
      }
      
      return errors
    },
    transformer: (directive, graph) => {
      // Трансформация: группировка узлов в C4 context
      return {
        ...graph,
        metadata: {
          ...graph.metadata,
          c4Level: 'context',
          c4Scope: directive.scope
        }
      }
    }
  }
]

// @layerflow/c4-template/src/index.ts
const c4Plugin: EnhancedPlugin = {
  name: 'c4-template',
  version: '1.0.0',
  
  install: (manager: EnhancedPluginManager) => {
    // Регистрация типов
    c4NodeTypes.forEach(type => manager.registerNodeType(type))
    
    // Регистрация директив
    c4Directives.forEach(directive => manager.registerDirective(directive))
    
    // C4-специфичные правила валидации
    manager.registerValidationRule({
      name: 'c4-hierarchy',
      domains: ['c4'],
      validate: (graph) => {
        // Проверка C4 иерархии:
        // person -> system -> container -> component
        return validateC4Hierarchy(graph)
      }
    })
    
    manager.registerValidationRule({
      name: 'c4-relationships',
      domains: ['c4'],
      validate: (graph) => {
        // Проверка допустимых связей в C4
        return validateC4Relationships(graph)
      }
    })
  },
  
  patterns: {
    SystemContext: `
      @domain: c4
      @context:
        Customer [person]:
          role: "Bank customer"
        BankingSystem [system]:
          purpose: "Allows customers to view account information"
        EmailSystem [external]:
          purpose: "Sends emails to customers"
          
        Customer -> BankingSystem: "Views account balances"
        BankingSystem -> EmailSystem: "Sends notifications"
    `,
    
    ContainerView: `
      @domain: c4
      @container "BankingSystem":
        WebApp [container.spa]:
          technology: "React"
          purpose: "User interface for banking"
        API [container.api]:
          technology: "Java Spring Boot"
          purpose: "Business logic and data access"
        Database [container.database]:
          technology: "PostgreSQL"
          purpose: "Stores account information"
          
        WebApp -> API: "Makes API calls [HTTPS/JSON]"
        API -> Database: "Reads/writes data [JDBC]"
    `
  }
}

export default c4Plugin
```

#### Использование PoC C4 плагина
```typescript
import { parseLFF, registerPlugin } from '@layerflow/parser'
import c4Plugin from '@layerflow/c4-template'

// Регистрация плагина
registerPlugin(c4Plugin)

// LFF с автоматической активацией C4 домена
const bankingSystem = `
@context:  // Автоматически активирует C4 домен
  Customer [person]:
    role: "Bank customer"
    department: "Retail"
    
  BankingSystem [system]:
    purpose: "Online banking platform"
    technology: "Microservices"
    
  Customer -> BankingSystem: "Uses for banking operations"
`

// Парсинг с автоматической активацией домена
const { ast, errors, activeDomains } = parseLFF(bankingSystem)

console.log(activeDomains) // ['c4']
console.log(ast.c4Level)   // 'context'

// Валидация прошла успешно - есть person и system
console.log(errors)        // []
```

---

*LFF 1.0 - Новый стандарт архитектурной документации для эры ИИ* 🚀