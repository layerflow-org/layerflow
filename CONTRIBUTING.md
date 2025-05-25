# 🤝 CONTRIBUTING TO LAYERFLOW

Спасибо, что хотите внести вклад в LayerFlow!  
Мы стремимся сделать архитектуру и визуализацию графов доступной и мощной для всех.

## Как начать

1. **Fork** this repository
2. **Clone** your fork and set up locally
3. Make your changes in a new branch (`feature/your-feature` or `fix/your-bug`)
4. Ensure all tests pass (`pnpm test`)
5. Submit a **Pull Request** (PR) with a clear description of your change

## Общие правила

- Пишите осознанно: делайте коммиты с понятными сообщениями
- Следите за типами и TSDoc-комментариями в новых файлах
- Все публичные методы и новые типы должны быть описаны в README/docs
- Покрывайте код тестами (Jest, edge-cases приветствуются)
- Для больших изменений — обсудите идею в [Issues](https://github.com/layerflow/layerflow/issues) или [Discussions](https://github.com/layerflow/layerflow/discussions)

## Стиль кода

- Используем TypeScript, строгую типизацию
- Договорённость по форматированию — prettier (при необходимости)
- Соблюдайте архитектуру: core, плагины, валидация, utils — разделяйте ответственности

## Тесты

- Все фичи/фиксы — с тестами
- Используйте snapshot-тесты для AST/graph, unit-тесты для плагинов

## Вопросы?

- Используйте [Issues](https://github.com/layerflow/layerflow/issues) для багов/фичей
- Для обсуждений и предложений — [Discussions](https://github.com/layerflow/layerflow/discussions)

Спасибо за вклад в LayerFlow — вместе мы делаем инструмент лучше!
