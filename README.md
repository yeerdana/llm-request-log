# Журнал запросов к LLM

SPA на React + TypeScript (Vite) для админ-панели API-шлюза: клиент видит, какие запросы к моделям он сделал, сколько они стоили и как быстро модели ответили. Данные — JSON на 600 записей, сгенерированный скриптом; загружаются через TanStack Query с имитацией сетевой задержки.

Демо: после включения GitHub Pages — `https://<пользователь>.github.io/<репозиторий>/` (деплой описан ниже).

| Требование ТЗ | Где реализовано |
|---|---|
| SPA на React + TypeScript (Vite) | [`src/`](src), [`vite.config.ts`](vite.config.ts) |
| JSON 500+ записей, сгенерированный скриптом (время, модель, статус 200/429/500, токены вх./вых., задержка, стоимость) | [`scripts/generate-data.mjs`](scripts/generate-data.mjs) → [`public/data/requests.json`](public/data/requests.json) (600 записей, фиксированный seed) |
| Таблица с пагинацией и сортировкой по времени, задержке, стоимости | [`requests-table.tsx`](src/features/log/requests-table.tsx), [`sortRecords`, `paginate`](src/lib/records.ts) |
| Фильтры по модели, статусу, датам, сохраняются в URL | [`filters-bar.tsx`](src/features/log/filters-bar.tsx), [`use-query-state.ts`](src/hooks/use-query-state.ts), [`query-state.ts`](src/lib/query-state.ts) |
| Карточки итогов: число запросов, доля ошибок, средняя задержка, сумма | [`summary-cards.tsx`](src/features/log/summary-cards.tsx), [`computeTotals`](src/lib/records.ts) |
| График задержки по времени (Recharts) | [`latency-chart.tsx`](src/features/log/latency-chart.tsx), [`latencySeries`](src/lib/records.ts) |
| TanStack Query с имитацией сетевой задержки | [`log-page.tsx`](src/features/log/log-page.tsx), [`api.ts`](src/lib/api.ts) (700 мс) |
| Тесты Vitest на фильтрацию и подсчёт итогов | [`records.test.ts`](src/lib/records.test.ts), [`query-state.test.ts`](src/lib/query-state.test.ts) и др. |
| Типизация без `any` | правило `@typescript-eslint/no-explicit-any: error` в [`eslint.config.js`](eslint.config.js), `strict` в tsconfig; ответ сервера проверяется type guard-ами, а не приводится |
| Вёрстка от 360 px | сетка `grid-cols-1 → sm → lg`, таблица с горизонтальной прокруткой внутри карточки, карточки итогов 2×2 |
| Пустое состояние и состояние ошибки | [`states.tsx`](src/features/log/states.tsx): пусто (с кнопкой «Сбросить фильтры»), ошибка (с кнопкой «Повторить»), скелетоны при загрузке |
| **Бонус:** Tailwind и тёмная тема | Tailwind 4, переключатель темы (по умолчанию — системная), графики и компоненты используют CSS-переменные темы |

## Быстрый старт

```bash
npm ci
npm run dev        # http://localhost:5173
```

Продакшен-сборка и локальная проверка:

```bash
npm run build && npm run preview
```

Посмотреть состояние ошибки: добавьте в адрес `?fail=1` (загрузка «упадёт», кнопка «Повторить» после удаления параметра загрузит данные).

## Тесты и проверки — одной командой

```bash
npm test           # vitest run
```

То же, что делает CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)):

```bash
npm run lint && npm run typecheck && npm test && npm run build
```

Что покрыто тестами (32 теста):

| Область | Что проверяется |
|---|---|
| `filterRecords` | модель, статус, границы дат (включительно, UTC), комбинация фильтров, перевёрнутый диапазон, отсутствие мутации |
| `sortRecords` | время / задержка / стоимость в обе стороны, стабильность при равных значениях |
| `computeTotals` | число, доля ошибок (не-200), средняя задержка, сумма, пустой список без `NaN` |
| `latencySeries`, `paginate` | почасовое усреднение, зажим страницы в диапазон |
| `parseQueryState` / `serializeQueryState` | разбор URL, мусорные значения, round-trip, значения по умолчанию не попадают в URL |
| `parseRecords` | проверка формата ответа без `any` |
| Страница (Testing Library) | ошибка + повтор, пустое состояние + сброс, сортировка пишется в URL |

## Данные

```bash
npm run generate-data
```

Скрипт [`scripts/generate-data.mjs`](scripts/generate-data.mjs) детерминирован: фиксированы seed ГПСЧ и дата начала, поэтому повторный запуск даёт тот же файл. 600 записей за 14 дней, 6 моделей, примерно 92 % ответов 200, по 4 % — 429 и 500. У запросов с ошибкой нет выходных токенов и стоимость 0 (модель ничего не вернула); 429 отвечают быстро, 500 — медленно. Стоимость считается из цены за миллион токенов конкретной модели.

Формат записи:

```json
{ "id": "req_0001", "timestamp": "2026-09-28T00:03:35.103Z", "model": "gemini-flash",
  "status": 200, "input_tokens": 204, "output_tokens": 100, "latency_ms": 817, "cost_usd": 0.000311 }
```

## Фильтры в URL

Состояние страницы целиком хранится в строке запроса, поэтому его переживает перезагрузка, им можно поделиться ссылкой, а кнопки «назад»/«вперёд» работают:

```
/?model=gpt-4o&status=429&from=2026-10-01&to=2026-10-05&sort=-latency_ms&page=2
```

| Параметр | Значение |
|---|---|
| `model` | название модели |
| `status` | `200`, `429` или `500` |
| `from`, `to` | даты `YYYY-MM-DD`, UTC, обе границы включительно |
| `sort` | `timestamp`, `latency_ms`, `cost_usd`; минус впереди — по убыванию (по умолчанию `-timestamp`) |
| `page` | номер страницы (по 20 записей) |

## Решения

- **Чистые функции отдельно от React.** Фильтрация, сортировка, итоги, ряд для графика и разбор URL лежат в [`src/lib/`](src/lib) и тестируются без DOM.
- **URL — единственный источник правды.** Хук [`useQueryState`](src/hooks/use-query-state.ts) читает `location.search` через `useSyncExternalStore` и пишет через `history.pushState`; отдельного состояния фильтров в React нет, расхождения невозможны. Роутер для одной страницы не нужен. Неверные значения в URL не ломают страницу, а заменяются значениями по умолчанию. Смена фильтра сбрасывает страницу на первую.
- **Время везде в UTC**: границы дат, подписи и почасовые интервалы графика, чтобы результат не зависел от часового пояса браузера (и тесты были детерминированы).
- **Ответ сервера не приводится к типу, а проверяется** ([`parseRecords`](src/lib/api.ts)): так в коде нет `any`, а некорректные данные дают понятную ошибку.
- **Ошибка загрузки** заменяет страницу сообщением с кнопкой «Повторить» (`refetch`); автоповторы TanStack Query отключены, чтобы ошибка показывалась сразу.
- **Итоги и график считаются по отфильтрованным записям** (до пагинации), поэтому всегда соответствуют фильтрам.
- Простая таблица на `<table>` вместо TanStack Table: сортировка и пагинация уже вынесены в чистые функции, тяжёлая зависимость не нужна.

## Деплой на GitHub Pages

[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) при пуше в `main` запускает тесты, собирает проект и публикует `dist`. Базовый путь берётся из переменной окружения `VITE_BASE` (в workflow — `/<имя репозитория>/`), без неё `base` равен `/`, поэтому `npm run dev` и `npm run preview` работают как обычно. В настройках репозитория нужно один раз выбрать Settings → Pages → Source: GitHub Actions.

## Структура проекта

```
scripts/generate-data.mjs        генератор данных (seed фиксирован)
public/data/requests.json        сгенерированный журнал, 600 записей
src/lib/                         типы, фильтры, сортировка, итоги, URL-состояние, загрузка (+ тесты)
src/hooks/use-query-state.ts     состояние страницы в URL
src/features/log/                страница: фильтры, карточки, график, таблица, состояния
src/components/ui/               shadcn-компоненты из шаблона (только используемые)
.github/workflows/               CI и деплой на Pages
```

## Происхождение кода

Проект основан на открытом шаблоне [shadcnstore/shadcn-dashboard-landing-template](https://github.com/shadcnstore/shadcn-dashboard-landing-template) (версия `vite-version`, лицензия MIT, текст — в [`LICENSE`](LICENSE)). Взяты сборка (Vite + Tailwind 4 + eslint/tsconfig), набор shadcn-компонентов на Base UI, обёртка графиков Recharts, тема и переключатель тёмной темы с анимацией.

| Было в шаблоне | Стало |
|---|---|
| Админ-панель с сайдбаром, роутингом (react-router), страницами dashboard, mail, chat, calendar, tasks, users, settings, pricing, faqs, errors | Одна страница «Журнал запросов к LLM», без роутера и сайдбара |
| Страницы входа/регистрации и лендинг | Удалены |
| ~40 shadcn-компонентов, drag-and-drop, формы, zustand, zod, date-picker, кастомайзер тем, GTM-аналитика, демо-изображения | Оставлены 10 используемых (button, badge, card, chart, select, input, label, alert, skeleton, table), остальное и зависимости удалены |
| Демо-таблица и график на захардкоженных данных | Таблица, карточки и график на данных из JSON через TanStack Query; свои пагинация, сортировка, фильтры |
| Состояние только в React / localStorage | Фильтры, сортировка и страница в URL |
| Нет тестов, `any` не запрещён | Vitest + Testing Library, `no-explicit-any` как ошибка, CI |
| Деплой через `VITE_BASENAME` для роутера | `VITE_BASE` для `base` Vite + workflow GitHub Pages |
