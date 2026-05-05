# Проект «БК №536»: статус и документация

Отчёт по тому, что в проекте уже сделано, что ещё нет, как это всё устроено и как поднимать локально. Обновляется по мере появления новых PR.

Последнее обновление: апрель 2026, после PR #7.

---

## 1. Краткий обзор

Два независимых приложения в одном репозитории:

- **Фронтенд** — SPA на React + Vite (`src/`, `public/`, корневые `package.json`, `vite.config.ts`, `tsconfig*.json`). Рендерит портфолио кафедры: список проектов, страница проекта, вакансии, Hall of Fame, направления исследований.
- **Бэкенд** — FastAPI (`backend/`). Отдаёт те же данные по REST, хранит пользователей для аутентификации, выпускает JWT.

Между ними — HTTP. Фронт читает данные из бека через `fetch`, адрес бека настраивается через `VITE_API_URL` (по умолчанию `http://localhost:8000`).

```
┌──────────────────────┐   HTTP (JSON)   ┌────────────────────────┐
│   Frontend (Vite)    │ ──────────────► │   Backend (FastAPI)    │
│   :5173              │                 │   :8000                │
│                      │                 │                        │
│   src/api/*   ◄──────┼─────────────────┤   app/routers/*        │
│   useApi hook        │                 │   app/models/*         │
│   src/components,    │                 │   SQLAlchemy + Alembic │
│   src/pages          │                 │   SQLite (dev.db)      │
└──────────────────────┘                 └────────────────────────┘
```

---

## 2. История PR-ов

| PR | Статус | Что внутри |
| -- | ------ | ---------- |
| [#4](https://github.com/foblako/Site/pull/4) | merged | Скелет FastAPI-бэкенда: модели, миграции, публичные read-only ручки, сидер, CI (ruff+pytest). |
| [#5](https://github.com/foblako/Site/pull/5) | merged | Фикс парсинга `CORS_ORIGINS` из `.env` (поддержка plain-string и CSV помимо JSON). |
| [#6](https://github.com/foblako/Site/pull/6) | merged | Email/password-авторизация: таблица `users`, bcrypt, JWT access+refresh, ручки `/api/auth/register`, `/login`, `/refresh`, `/me`. |
| [#7](https://github.com/foblako/Site/pull/7) | open    | Фронт-интеграция чтения: страницы перешли с `src/data/*.ts` на `fetch` к беку. `src/api/`, `useApi`, `ApiStatus`. |

---

## 3. Что уже работает

### 3.1 Бэкенд (готов)

**Публичные read-only ручки** (PR #4):

| Ручка | Отдаёт |
| ----- | ------ |
| `GET /api/health`                    | `{"status":"ok"}` — healthcheck. |
| `GET /api/projects`                  | Список проектов (короткая карточка для грида). |
| `GET /api/projects/{id}`             | Проект целиком (описание, стек, команда, отзывы, артефакты, ссылки). |
| `GET /api/vacancies`                 | Список вакансий. |
| `GET /api/vacancies/{id}`            | Одна вакансия. |
| `GET /api/directions`                | Направления исследований (стек + описание). |
| `GET /api/hall-of-fame`              | Звёзды «Аллеи Славы». |
| `GET /api/contacts/department`       | Телефон и email кафедры. |
| `GET /api/portfolio/default`         | Профиль «по умолчанию», который показывается на `/portfolio`. |

**Аутентификация** (PR #6):

| Ручка | Делает |
| ----- | ------ |
| `POST /api/auth/register` | Регистрация по email + пароль (минимум 8 символов). `409 Conflict`, если email занят. |
| `POST /api/auth/login`    | Возвращает `{accessToken, refreshToken, tokenType: "bearer"}`. |
| `POST /api/auth/refresh`  | Меняет refresh на свежую пару. Access-токен на refresh не принимается и наоборот (в claim'е `type` отличаются). |
| `GET /api/auth/me`        | Текущий пользователь. Требует `Authorization: Bearer <accessToken>`. |

**Технические детали бэкенда:**

- Python 3.12, `fastapi`, `sqlalchemy`, `alembic`, `pyjwt`, `bcrypt`, `pydantic`, `pydantic-settings`.
- БД: SQLite (`backend/dev.db`) для разработки. Миграции через Alembic в `backend/alembic/versions/` (`0001_initial`, `0002_users`).
- Сидер: `python -m app.seed` перечитывает `backend/seed_data/*.json` и заливает в БД (idempotent — можно гонять сколько угодно).
- Конфиг через `pydantic-settings` из `.env`:
    - `DATABASE_URL` — по умолчанию `sqlite:///./dev.db`.
    - `CORS_ORIGINS` — список фронт-оригинов, принимает JSON-массив или CSV.
    - `JWT_SECRET` — подписка токенов (в dev можно любую длинную строку, в проде — случайный 32+ байта).
    - `JWT_ACCESS_TTL_MINUTES`, `JWT_REFRESH_TTL_DAYS`, `JWT_ALGORITHM` — параметры токенов.
- Тесты: 29 pytest-ов в `backend/tests/` (health, projects, vacancies, directions, hall-of-fame, contacts, portfolio, config-parsing, auth-flow).
- CI: `.github/workflows/backend.yml` — `ruff check`, `ruff format --check`, `pytest`. Триггерится на изменения в `backend/**`.

### 3.2 Фронтенд (готов)

**Реализовано** (PR #7 после мерджа; до мерджа — это диф ветки `devin/1777920707-frontend-api-integration`):

- `src/api/` — тонкий fetch-клиент:
    - `client.ts` — `apiRequest<T>` с `AbortSignal`, `ApiError` для не-2xx, базовый URL из `VITE_API_URL`.
    - `useApi.ts` — React-хук: вызывает fetcher на монтировании, возвращает `{ data, error, loading }`, отменяет in-flight запрос на unmount / смене deps.
    - Per-resource модули: `projects.ts`, `vacancies.ts`, `directions.ts`, `hallOfFame.ts`, `contacts.ts`, `portfolio.ts`. Типы берутся из `src/types/index.ts`.
    - `index.ts` — barrel-экспорт.
- `src/components/ApiStatus.tsx` — единый компонент состояний «загрузка / ошибка / пусто».
- `src/constants/filters.ts` — `PROJECT_TAGS`, `VACANCY_TAGS` (UI-фильтры, не данные с бека).
- Страницы переведены с импорта `src/data/*.ts` на `fetch`:
    - `components/Footer.tsx` (контакты), `components/Directions.tsx`, `components/HallOfFame.tsx`, `components/Projects.tsx`, `components/Vacancies.tsx`.
    - `pages/Projects.tsx` (грид + поиск + фильтры), `pages/Vacancies.tsx`, `pages/Project.tsx` (детальная), `pages/Portfolio.tsx`.
- `.env.example` в корне с `VITE_API_URL=http://localhost:8000`.

Файлы `src/data/*.ts` оставлены на месте — они теперь источник для `scripts/export-seed.mjs`, которым генерируется `backend/seed_data/*.json`. В приложении больше не импортируются.

---

## 4. Что ещё НЕ сделано

### 4.1 Фронт-авторизация (login UI)
- Форма регистрации и логина.
- Хранилище токенов (localStorage / sessionStorage).
- `useAuth`-хук + React-контекст: `{ user, loading, login, register, logout }`.
- Прозрачный refresh access-токена по 401.
- Кнопка в шапке: залогинен → аватар + меню «Выход», не залогинен → «Войти».
- Защищённые роуты (если нужно, пока все публичные).

### 4.2 Мутации на беке и фронте
Сейчас все кнопки действий — декоративные. Нужны ручки **и** их подключение:

| Действие | Ручка | Текущее состояние |
| -------- | ----- | ----------------- |
| Лайк проекта       | `POST /api/projects/{id}/like`        | нет ни бека, ни фронта |
| Комментарий        | `GET/POST /api/projects/{id}/comments`| нет |
| Отклик на вакансию | `POST /api/vacancies/{id}/apply`       | нет |
| Отзыв на проект    | `POST /api/projects/{id}/reviews`      | нет |
| Редактирование своего профиля | `PATCH /api/portfolio/me`    | нет |

### 4.3 Загрузка файлов
- Аватарки: `POST /api/users/me/avatar`.
- Скриншоты проектов, артефакты: `POST /api/projects/{id}/screenshots`, `POST /api/projects/{id}/artifacts`.
- Нужен storage (пока — локальная папка `backend/uploads/`, потом — S3/R2/MinIO).

### 4.4 Админка
CRUD на проекты/вакансии/направления/stars/department-contacts под `role == "admin"`. Чтобы добавлять новое без правки кода и рестарта.

### 4.5 Инфраструктура / прод
- **Деплой**. Сейчас бек поднимается только локально. Варианты: Fly.io, Railway, VPS (Selectel/Timeweb) с Docker, Vercel/Netlify — только для фронта.
- **Постоянная БД**. SQLite хорош для dev, но под прод лучше Postgres. Переключение — одна строка в `DATABASE_URL` + пересобрать миграции; SQLAlchemy-модели уже в драйвер-агностичном стиле.
- **Rate-limit на `/login`** — чтобы нельзя было брутфорсить пароли.
- **Branch protection на `main`** — настраивается в GitHub Settings → Branches, требовать зелёный `lint-and-test`. **Ещё не включено**.
- **CI для фронта** — сейчас CI прогоняется только по бекендовым изменениям. Надо добавить workflow `frontend.yml` с `npm ci && npm run lint && npm run build`.
- **Pre-commit хуки** — опционально, чтобы ruff/eslint гонялись локально перед коммитом.

### 4.6 Технические улучшения (не срочные)
- Нормализовать JSON-колонки. Сейчас `projects.team`, `projects.reviews`, `projects.links` и т.п. хранятся как JSON внутри строки проекта. Это удобно на старте, но ломает фильтры вида «все отзывы с рейтингом ≥ 4» и аналитику. Вынести в отдельные таблицы (`project_team_members`, `project_reviews`, `project_links`) — рефакторинг на ~день.
- Логи в нормальный формат (structlog / json-logs) и корреляционный ID запроса.
- Метрики (prom/grafana) — сильно потом.
- Кэш для read-ручек (`Cache-Control`, ETag) — сильно потом.

---

## 5. Как устроен бэкенд

### 5.1 Структура

```
backend/
├── app/
│   ├── __init__.py
│   ├── config.py            # pydantic-settings, читает .env
│   ├── db.py                # SQLAlchemy engine + SessionLocal
│   ├── deps.py              # get_db, current_user
│   ├── main.py              # FastAPI app, CORS, routers include
│   ├── security.py          # bcrypt хэш, JWT encode/decode
│   ├── seed.py              # python -m app.seed → загрузка JSON в БД
│   ├── models/              # SQLAlchemy-модели (User, Project, Vacancy…)
│   ├── routers/             # auth, projects, vacancies, directions,
│   │                        #  hall_of_fame, contacts, portfolio
│   └── schemas/             # Pydantic-схемы запросов/ответов
├── alembic/
│   ├── env.py
│   └── versions/
│       ├── 0001_initial.py
│       └── 0002_users.py
├── seed_data/               # Источник данных для сидера (JSON)
├── tests/                   # pytest
├── .env.example
├── alembic.ini
├── Dockerfile
├── pyproject.toml           # зависимости + dev-extras
└── README.md
```

### 5.2 Модель данных (ER-диаграмма своими словами)

```
users                       (PR #6)
├─ id PK
├─ email (unique)
├─ password_hash
├─ display_name
├─ role                     ("user" | "admin")
└─ created_at

projects                    (PR #4)
├─ id PK (строковый slug, например "intellect-search")
├─ title, subtitle, description
├─ status                   ("completed" | "archived" | "cancelled" | "in_progress" | "recruiting")
├─ start_date
├─ community_rating, experts_rating
├─ image_url
├─ tags               JSON массив строк
├─ tech_stack         JSON массив строк
├─ team               JSON массив объектов {name, period, role, avatar_url}
├─ reviews            JSON массив объектов {author, title, rating, text}
├─ screenshots        JSON массив строк (URL)
├─ artifacts          JSON массив объектов {label, url}
├─ links              JSON массив объектов {label, url}
├─ likes, comments_count, subscribers_count
└─ created_at, updated_at

vacancies                   (PR #4)
├─ id PK (строковый slug)
├─ title, subtitle, description
├─ tags               JSON
├─ responsibilities   JSON массив
└─ created_at

directions                  (PR #4)
├─ id PK, title, slash_title
└─ stack              JSON массив строк

hall_of_fame                (PR #4)
├─ id PK, name, title, avatar_url
└─ order_index

department_contacts         (PR #4)
└─ phone, email           (одна строка; id=1 singleton)

portfolio_profiles          (PR #4)
├─ id PK ("default" для дефолтного)
├─ name
├─ info               JSON массив {label, value}
├─ about              JSON массив строк
├─ skills             JSON массив строк
├─ goals              JSON массив строк
├─ works              JSON массив {label, url}
└─ contacts           JSON {phone, email, website}
```

JSON-колонки — осознанный компромисс на старте: они легко сериализуются в/из уже существующих TS-типов, но плохи для фильтров и агрегации. См. п. 4.6.

### 5.3 Поток аутентификации

```
1. Регистрация
   ┌──────┐  POST /api/auth/register {email, password, displayName?}
   │Front │ ─────────────────────────────────────────────────────────►
   └──────┘
                                                   bcrypt.hashpw(password)
                                                   INSERT INTO users
                                                   200 OK {id, email, …}
   ┌──────┐ ◄─────────────────────────────────────────────────────────
   │Front │
   └──────┘

2. Логин
   ┌──────┐  POST /api/auth/login {email, password}
   │Front │ ─────────────────────────────────────────────────────────►
   └──────┘
                                        bcrypt.checkpw, jwt.encode(access, refresh)
                                        200 OK {accessToken, refreshToken, tokenType:"bearer"}
   ┌──────┐ ◄─────────────────────────────────────────────────────────
   │Front │  → кладёт токены в localStorage
   └──────┘

3. Защищённый запрос
   ┌──────┐  GET /api/auth/me
   │Front │  Authorization: Bearer <accessToken>
   └──────┘ ─────────────────────────────────────────────────────────►
                                        jwt.decode → получаем user_id
                                        SELECT FROM users
                                        200 OK {id, email, displayName, role}

4. Access истёк (через 30 минут)
   ┌──────┐  GET /api/auth/me
   │Front │ ─────────────────────────────────────────────────────────►
                                                   401 Unauthorized
   ┌──────┐ ◄──────
   │Front │
   │      │  POST /api/auth/refresh {refreshToken}
   │      │ ─────────────────────────────────────────────────────────►
   └──────┘                       200 OK {accessToken, refreshToken} (новая пара)
   (фронт ретраит первоначальный запрос с новым access-токеном)
```

Access-токен на 30 минут, refresh — на 14 дней. Оба подписаны одним `JWT_SECRET`, но в payload есть `type: "access" | "refresh"`, поэтому перепутать нельзя: endpoint `/refresh` принимает только `type=refresh`, все остальные — только `type=access`.

---

## 6. Как устроен фронтенд

### 6.1 Структура

```
src/
├── api/                       # (PR #7) клиент и fetch-обёртки
│   ├── client.ts              # apiRequest<T>, ApiError, BASE_URL
│   ├── useApi.ts              # useApi hook (AbortController)
│   ├── projects.ts            # fetchProjects, fetchProject
│   ├── vacancies.ts
│   ├── directions.ts
│   ├── hallOfFame.ts
│   ├── contacts.ts
│   ├── portfolio.ts
│   └── index.ts               # barrel
├── components/                # переиспользуемые блоки
│   ├── ApiStatus.tsx          # (PR #7) состояния загрузки/ошибки
│   ├── Directions.tsx
│   ├── Footer.tsx
│   ├── HallOfFame.tsx
│   ├── Header.tsx
│   ├── Projects.tsx           # грид на главной
│   ├── ProjectCard.tsx, VacancyCard.tsx, StarCard.tsx, …
│   └── *.module.css
├── constants/
│   └── filters.ts             # (PR #7) PROJECT_TAGS, VACANCY_TAGS
├── data/                      # исходники для сидера (раньше — данные приложения)
│   └── projects.ts, vacancies.ts, directions.ts, portfolio.ts, …
├── pages/
│   ├── Home.tsx (через App.tsx композицию)
│   ├── Projects.tsx           # список с фильтром/поиском
│   ├── Project.tsx            # детальная
│   ├── Vacancies.tsx
│   └── Portfolio.tsx
├── types/
│   └── index.ts               # ProjectSummary, ProjectDetail, Vacancy, …
├── App.tsx, main.tsx, index.css
```

### 6.2 Паттерн работы с API

```tsx
import { fetchProjects, useApi } from '../api'
import { ApiStatus } from '../components/ApiStatus'

function ProjectsPage() {
  const { data: projects, loading, error } = useApi(
    (signal) => fetchProjects(signal),
    [],
  )

  return (
    <>
      <ApiStatus
        loading={loading}
        error={error}
        empty={!loading && !error && (projects ?? []).length === 0}
      />
      {(projects ?? []).map((p) => <ProjectCard key={p.id} {...p} />)}
    </>
  )
}
```

Почему не react-query / SWR:
- страниц с чтением мало, ретраев/кэширования на старте не нужно;
- `useApi` легко заменить на `@tanstack/react-query` позже — сигнатура почти такая же;
- меньше зависимостей → меньше проблем с версиями.

---

## 7. Локальная разработка с нуля

### 7.1 Требования
- Python 3.12+
- Node.js 20.19+ или 22.13+ или ≥24 (см. `package.json` → `engines`)
- **Если разработка под Windows — ставить Node именно внутри WSL**, не из-под Windows. Иначе `npm run dev` упадёт с `EPERM` при попытке записи в `C:\Windows\.vite\…`.
- SQLite (входит в стандартную поставку Python).

### 7.2 Поднять бек

```bash
cd backend
python -m venv .venv
source .venv/bin/activate           # Windows: .venv\Scripts\activate
pip install -e ".[dev]"

cp .env.example .env                # отредактировать при желании
alembic upgrade head
python -m app.seed
uvicorn app.main:app --reload
```

- Swagger: http://localhost:8000/docs
- Health: http://localhost:8000/api/health
- Прогнать тесты: `pytest`

### 7.3 Поднять фронт (в отдельном терминале)

```bash
# В корне репо (не в backend/)
cp .env.example .env.local          # опционально; содержит VITE_API_URL
npm install
npm run dev
```

- Сайт: http://localhost:5173
- Lint: `npm run lint`
- Прод-билд: `npm run build` (собирается в `dist/`)

### 7.4 Обновить сид-данные
Если нужно поправить «начальные» проекты/вакансии/…:

1. Отредактировать `src/data/projects.ts` (или соответствующий файл).
2. Сгенерировать JSON для бека: `node scripts/export-seed.mjs`.
3. Перезалить БД: `python -m app.seed` в `backend/` (с активным venv).

Второй вариант — редактировать прямо `backend/seed_data/*.json`, но тогда TS-источник и бекендовый источник разъедутся, и следующий экспорт всё перетрёт.

---

## 8. Рекомендованный порядок следующих работ

Вариант **«быстрее увидеть живой сайт для конечного пользователя»**:

1. **Branch protection на `main`** (сам пользователь, 1 минута).
2. **Login UI** — форма логина/регистрации, `useAuth`, 401-refresh.
3. **Мутации «лайки + комменты»** — сначала ручки, потом фронт.
4. **Мутации «отклик на вакансию»** — то же самое.
5. **Редактирование своего профиля** — `PATCH /api/portfolio/me` + форма.
6. **Загрузка аватарки** — минимальная работа с файлами.
7. **Деплой фронта (Vercel) + бека (Fly.io)** — сайт становится доступен в интернете.
8. **Админка CRUD** — последней.

Вариант **«сначала весь бек, потом весь фронт»** — дольше до видимого результата, но проще разделять работу.

---

## 9. Открытые вопросы / долги
- [ ] Branch protection на `main` всё ещё не включён.
- [ ] CI только для бека, фронт-линт/билд в GitHub Actions не гоняется.
- [ ] JWT_SECRET в `backend/.env.example` — это dev-плейсхолдер, в прод-деплое обязательно сгенерировать свой (`python -c "import secrets; print(secrets.token_urlsafe(48))"`).
- [ ] Нет страницы 404 / «ошибка загрузки» на верхнем уровне — пока только ApiStatus внутри каждой страницы.
- [ ] Нет формальной схемы ошибок от бека (сейчас `{"detail": "..."}` по умолчанию от FastAPI — нормально для MVP).
