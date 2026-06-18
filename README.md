# 🎹 Клавирон

Подбор клавишных инструментов по целям и бюджету через квиз с интеграцией Google Sheets и Apps Script.

## Структура проекта

```
.
├── index.html       # Лендинг с квизом
├── style.css        # Стили (тёмная тема, responsive)
├── app.js           # Логика квиза, демо-режим, API
└── gas/
    └── Code.gs      # Google Apps Script для бэкенда
```

## Логика работы

1. **Квиз** — 4 вопроса: цель, бюджет, уровень, формат
2. **Подбор** — из Google Sheets (лист `catalog`) через Apps Script
3. **Preview** — бесплатные 2 модели
4. **Paywall** — тарифы Start (2), Smart (4), Pro (6)
5. **Заказ** — запись в лист `orders`

## Деплой

### 1. GitHub Pages

1. Перейдите в **Settings → Pages**
2. Выберите `main` ветку, папку `/ (root)`
3. Сохраните и дождитесь публикации
4. Сайт будет доступен по `https://zakharovvb.github.io/-.html/`

### 2. Google Apps Script

1. Откройте Google Sheets, создайте листы:
   - `catalog` — колонки: `id`, `brand`, `model`, `type`, `keys`, `price`, ...
   - `offers` — колонки: `id`, `price`
   - `orders` — колонки: `orderid`, `date`, `status`, `plan`, `goal`, `budget`, `experience`, `format`, `email`, `amount`

2. Откройте **Extensions → Apps Script**
3. Вставьте код из `gas/Code.gs`
4. Замените `SPREADSHEET_ID` на ID вашей таблицы
5. Нажмите **Deploy → New deployment**
6. Выберите **Web app**, доступ `Anyone`
7. Скопируйте URL вида `https://script.google.com/.../exec`

### 3. Подключение

1. Откройте `app.js`
2. Замените:
   ```js
   const GASCATALOGURL = 'https://script.google.com/macros/s/YOUR_DEPLOY_ID/exec';
   const DEMO_MODE = false; // включить live-режим
   ```
3. Закоммитьте изменения

## Тарифы

| План   | Моделей | Цена   |
|--------|---------|-------|
| Start  | 2       | 490₽  |
| Smart  | 4       | 890₽  |
| Pro    | 6       | 1490₽ |

## Технологии

- HTML/CSS/JS — статичный фронт
- Google Sheets — база данных
- Apps Script — бэкенд API
- GitHub Pages — хостинг

## Демо-режим

В `app.js` есть `DEMO_MODE = true`, который показывает тестовые модели без подключения к Apps Script. После настройки бэкенда поставьте `false`.

## Лицензия

MIT
