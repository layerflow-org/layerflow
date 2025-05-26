# 🚀 @layerflow/cli — LayerFlow Command-Line Tool

![npm version](https://img.shields.io/npm/v/@layerflow/cli?style=flat-square)
![license](https://img.shields.io/npm/l/MPL-2.0?style=flat-square)

## 📦 Быстрый старт

1. **Установка через npm или pnpm**
    ```sh
    npm install -g @layerflow/cli
    # или
    pnpm add -g @layerflow/cli
    ```

2. **Проверить версию и доступность:**
    ```sh
    layerflow --version
    ```

---

## ⚡ Основные команды

| Команда               | Описание                                             |
|-----------------------|-----------------------------------------------------|
| `validate`            | Проверка `.lff` или `.json` графа на валидность     |
| `convert`             | Конвертация между форматами (LFF ↔ JSON ↔ Mermaid)  |
| `export`              | Экспорт графа в SVG, PNG, JPEG                      |
| `info`                | Просмотр метаданных и структуры графа               |
| `init`                | Генерация шаблонного графа                          |
| `help`                | Справка по командам                                 |

---

## 💡 Примеры использования

### Проверка графа на валидность

```sh
layerflow validate my-architecture.lff
```

### Конвертация в Mermaid

```sh
layerflow convert --from lff --to mermaid my.lff -o my.mmd
```

### Экспорт графа в SVG

```sh
layerflow export my-architecture.lff --format svg --out diagram.svg
```

### Генерация шаблонного файла

```sh
layerflow init --template c4 --out example.lff
```

### Просмотр структуры и метаданных

```sh
layerflow info my-architecture.lff
```

---

## 🔧 Интеграция с CI/CD

CLI легко интегрируется с любыми пайплайнами DevOps:

```yaml
# Пример GitHub Actions: validate LayerFlow diagrams
- name: Validate architecture diagrams
  run: layerflow validate diagrams/**/*.lff
```

---

## 📚 Документация

* [Полная документация LayerFlow](https://github.com/layerflow-org/layerflow)
* [Формат LFF и спецификации](https://github.com/layerflow-org/layerflow/docs)
* [Core API](https://github.com/layerflow-org/layerflow/tree/main/packages/core)

---

## ❓ FAQ

**Q: Какие форматы поддерживаются?**
A: `.lff`, `.layerflow`, `.json`, `.mmd`, `.svg`, `.puml` (см. Roadmap).

**Q: Можно ли расширять команды?**
A: Да, поддерживаются плагины для конвертеров и экспортёров (roadmap).

---

## 🛡️ Лицензия

* MPL 2.0

---

## 🤝 Контрибьюторам

* Pull Requests и фичи приветствуются!
* [CONTRIBUTING.md](https://github.com/layerflow-org/layerflow/blob/main/CONTRIBUTING.md)