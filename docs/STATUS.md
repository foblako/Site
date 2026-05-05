# Проект «БК №536»: статус и документация

Отчёт по тому, что в проекте уже сделано, что ещё нет, как это всё устроено и как поднимать локально. Обновляется по мере появления новых PR.

Последнее обновление: май 2026, после PR #16 (последний из серии «оживить кнопки» + админка).

---

## 1. Краткий обзор

Два независимых приложения в одном репозитории:

- **Фронтенд** — SPA на React + Vite (`src/`, `public/`, корневые `package.json`, `vite.config.ts`, `tsconfig*.json`). Рендерит портфолио кафедры: список проектов, страница проекта, вакансии, Hall of Fame, направления исследований, личное портфолио, страницы логина и админки.
- **Бэкенд** — FastAPI (`backend/`). Отдаёт те же данные по REST, хранит пользователей и их данные (профили, лайки, комментарии, отклики, аватары), выпускает JWT, обслуживает админ-CRUD.

Между ними — HTTP. Фронт читает данные из бека через `fetch`, адрес бека настраивается через `VITE_API_URL` (по умолчанию `http://localhost:8000`). Загруженные пользователями файлы (аватары) лежат в `backend/uploads/` и раздаются самим FastAPI как static.

```
┌──────────────────────┐   HTTP (JSON + multipart)   ┌────────────────────────┐
│   Frontend (Vite)    │ ──────────────────────────► │   Backend (FastAPI)    │
│   :5173              │                             │   :8000                │
│                      │                             │                        │
│   src/api/*   ◄──────┼─────────────────────────────┤   app/routers/*        │
│   useApi hook        │                             │   app/models/*         │
│   src/auth/*         │ ◄── /uploads/avatars/* ───  │   SQLAlchemy + Alembic │
│   src/components,    │                             │   SQLite (dev.db)      │
│   src/pages          │                             │   StaticFiles uploads/ │
└──────────────────────┘                             └────────────────────────┘
```

---

## 2. История PR-ов

| PR | Статус | Что внутри |
| -- | ------ | ---------- |
| [#4](https://github.com/foblako/Site/pull/4)   | merged | Скелет FastAPI-бэкенда: модели, миграции, публичные read-only ручки, сидер, CI (ruff+pytest). |
| [#5](https://github.com/foblako/Site/pull/5)   | merged | Фикс парсинга `CORS_ORIGINS` из `.env` (поддержка plain-string и CSV помимо JSON). |
| [#6](https://github.com/foblako/Site/pull/6)   | merged | Email/password-авторизация: таблица `users`, bcrypt, JWT access+refresh, ручки `/api/auth/register`, `/login`, `/refresh`, `/me`. |
| [#7](https://github.com/foblako/Site/pull/7)   | merged | Фронт-интеграция чтения: страницы перешли с `src/data/*.ts` на `fetch` к беку. `src/api/`, `useApi`, `ApiStatus`. |
| [#8](https://github.com/foblako/Site/pull/8)   | merged | Первая версия `docs/STATUS.md` — этот самый файл. |
| [#9](https://github.com/foblako/Site/pull/9)   | merged | Login UI + `useAuth` + хранение JWT в `localStorage` + автоматический refresh по 401. **Был случайно смержен в промежуточную ветку**, контент восстановлен в #10. |
| [#10](https://github.com/foblako/Site/pull/10) | merged | Cherry-pick login UI обратно в `main`. |
| [#11](https://github.com/foblako/Site/pull/11) | merged | Личный портфолио: таблица `user_profiles`, `GET/PATCH /api/portfolio/me`, инлайн-редактирование `name/about/skills/goals` на `/portfolio` под залогиненным юзером. |
| [#12](https://github.com/foblako/Site/pull/12) | merged | Лайки на проектах: `POST /api/projects/{id}/like` (toggle), таблица `project_likes`, `LikeButton` с оптимистичным UI, `likedByMe` на read-ручках. |
| [#13](https://github.com/foblako/Site/pull/13) | merged | Комментарии: `GET/POST /api/projects/{id}/comments`, `DELETE …/{comment_id}`, таблица `project_comments`, `CommentsSection` на детальной странице проекта. |
| [#14](https://github.com/foblako/Site/pull/14) | merged | Отклики на вакансии: `POST/DELETE /api/vacancies/{id}/apply`, `GET .../my-application`, таблица `vacancy_applications`, модалка с `<textarea>` на `VacancyCard`. |
| [#15](https://github.com/foblako/Site/pull/15) | merged | Загрузка аватарок: `POST/DELETE /api/users/me/avatar` (multipart), колонка `users.avatar_url`, кнопки «Загрузить/Удалить» на `/portfolio`, `/uploads` как `StaticFiles`. |
| [#16](https://github.com/foblako/Site/pull/16) | merged | Админка: dependency `require_admin`, роутер `/api/admin/*` (CRUD на projects/vacancies/directions/stars + просмотр откликов на вакансии), страница `/admin` с 5 вкладками, CLI `python -m app.make_admin <email>`. |

На момент написания этого обновления **открытых PR-ов нет**. Все ветки `devin/*` на удалённом — это уже смерженные исходники прошлых PR-ов, их можно безопасно удалить (см. п. 9).

---

## 3. Что уже работает

### 3.1 Бэкенд (готов до уровня MVP)

**Публичные read-only ручки** (PR #4, расширены в #12, #14):

| Ручка | Отдаёт |
| ----- | ------ |
| `GET /api/health`                    | `{"status":"ok"}` — healthcheck. |
| `GET /api/projects`                  | Список проектов (короткая карточка). С опциональным токеном — добавляет `likedByMe: bool`. |
| `GET /api/projects/{id}`             | Проект целиком (описание, стек, команда, отзывы, артефакты, ссылки). С опциональным токеном — `likedByMe: bool`. |
| `GET /api/projects/{id}/comments`    | Список комментариев к проекту, отсортирован по `created_at DESC`, с embedded автором `{id, displayName}`. |
| `GET /api/vacancies`                 | Список вакансий. С опциональным токеном — `appliedByMe: bool`. |
| `GET /api/vacancies/{id}`            | Одна вакансия. С опциональным токеном — `appliedByMe: bool`. |
| `GET /api/directions`                | Направления исследований (стек + описание). |
| `GET /api/hall-of-fame`              | Звёзды «Аллеи Славы». |
| `GET /api/contacts/department`       | Телефон и email кафедры. |
| `GET /api/portfolio/default`         | Профиль «по умолчанию», который показывается анонимам на `/portfolio`. |

**Аутентификация** (PR #6):

| Ручка | Делает |
| ----- | ------ |
| `POST /api/auth/register` | Регистрация по email + пароль (минимум 8 символов). `409 Conflict`, если email занят. |
| `POST /api/auth/login`    | Возвращает `{accessToken, refreshToken, tokenType: "bearer"}`. |
| `POST /api/auth/refresh`  | Меняет refresh на свежую пару. Access-токен на refresh не принимается и наоборот (в claim'е `type` отличаются). |
| `GET /api/auth/me`        | Текущий пользователь, включая `avatarUrl` (PR #15). Требует `Authorization: Bearer <accessToken>`. |

**Аутентифицированные мутации** (PR #11–#15):

| Ручка | Делает |
| ----- | ------ |
| `GET /api/portfolio/me`                          | Свой профиль; ленивое создание из дефолтного шаблона при первом обращении. |
| `PATCH /api/portfolio/me`                        | Частичный апдейт `name/info/about/skills/goals/works/contacts`. Массивы заменяются целиком. |
| `POST /api/projects/{id}/like`                   | Toggle лайка. Возвращает `{liked, likeCount}`. Денормализованный счётчик `projects.likes` поддерживается в синхроне. |
| `POST /api/projects/{id}/comments`               | Создать комментарий (1..2000 символов после strip). |
| `DELETE /api/projects/{id}/comments/{commentId}` | Удалить комментарий. Можно автору или админу — иначе 403. |
| `POST /api/vacancies/{id}/apply`                 | Откликнуться на вакансию (`{message: 1..4000}`). 409 на повторный отклик (UNIQUE по `(vacancy_id, user_id)`). |
| `DELETE /api/vacancies/{id}/apply`               | Отозвать свой отклик. 204 на успех, 404, если активного отклика нет. |
| `GET /api/vacancies/{id}/my-application`         | Свой отклик или 404. |
| `POST /api/users/me/avatar`                      | Загрузить аватар (`multipart/form-data`, поле `file`). Принимает png/jpg/jpeg/webp/gif до 5 МБ. Возвращает свежий `UserOut`. |
| `DELETE /api/users/me/avatar`                    | Сбросить аватар на дефолт. |

**Админ-ручки** (PR #16, под `require_admin` → 403 для обычных юзеров):

| Ручка | Делает |
| ----- | ------ |
| `POST/PATCH/DELETE /api/admin/projects[/{id}]`              | CRUD на проекты. 409 на дубль `project.id`. |
| `POST/PATCH/DELETE /api/admin/vacancies[/{id}]`             | CRUD на вакансии. |
| `GET /api/admin/vacancies/{id}/applications`                | Список откликнувшихся: email, имя, дата, текст сообщения. |
| `POST/PATCH/DELETE /api/admin/directions[/{id}]`            | CRUD на направления. 409 на дубль `direction.name`. |
| `POST/PATCH/DELETE /api/admin/stars[/{id}]`                 | CRUD на звёзды Hall of Fame. |

Назначить кого-то админом можно только через CLI: `python -m app.make_admin <email>` (HTTP-эндпоинта для self-promotion сознательно нет).

**Технические детали бэкенда:**

- Python 3.12, `fastapi`, `sqlalchemy[asyncio]`, `alembic`, `pyjwt`, `bcrypt`, `pydantic`, `pydantic-settings`, `python-multipart` (multipart-аплоуды), `aiosqlite`, `asyncpg`.
- БД: SQLite (`backend/dev.db`) для разработки. Миграции через Alembic в `backend/alembic/versions/`:
    - `0001_initial` — projects/vacancies/directions/hall_of_fame/department_contacts/portfolio_profiles.
    - `0002_users` — таблица `users`.
    - `0003_user_profiles` — личные портфолио.
    - `0004_project_likes` — лайки.
    - `0005_project_comments` — комментарии.
    - `0006_vacancy_applications` — отклики.
    - `0007_user_avatars` — `users.avatar_url` (через `batch_alter_table` для SQLite-совместимости).
- Сидер: `python -m app.seed` перечитывает `backend/seed_data/*.json` и заливает в БД (idempotent — можно гонять сколько угодно).
- Конфиг через `pydantic-settings` из `.env`:
    - `DATABASE_URL` — по умолчанию `sqlite+aiosqlite:///./dev.db`.
    - `CORS_ORIGINS` — список фронт-оригинов, принимает JSON-массив или CSV.
    - `JWT_SECRET` — подпись токенов (в dev можно любую длинную строку, в проде — случайный 64+ байта).
    - `ACCESS_TOKEN_TTL_MINUTES` (30), `REFRESH_TOKEN_TTL_DAYS` (14), `JWT_ALGORITHM` — параметры токенов.
    - `UPLOADS_DIR` (по умолчанию `./uploads`), `MAX_UPLOAD_SIZE_BYTES` (5 МБ).
- Аплоуды: `app/uploads.py::save_image_upload` валидирует расширение, MIME-префикс, пустоту и размер, имя файла генерится через `secrets.token_hex(16)` — клиентское имя не сохраняется.
- Тесты: 75 pytest-ов в `backend/tests/` (health, projects, vacancies, directions, hall-of-fame, contacts, portfolio, config-parsing, auth-flow, project_likes, project_comments, vacancy_applications, avatar_upload, admin).
- CI: `.github/workflows/backend.yml` — `ruff check`, `ruff format --check`, `pytest`. Триггерится на изменения в `backend/**`.

### 3.2 Фронтенд (готов до уровня MVP)

**Read-only страницы на API** (PR #7):

- `src/api/` — тонкий fetch-клиент:
    - `client.ts` — `apiRequest<T>` с `AbortSignal`, `ApiError` для не-2xx, базовый URL из `VITE_API_URL`. Поддерживает `FormData` (не ставит Content-Type — браузер сам делает `multipart/form-data; boundary=…`). Поддерживает `auth: true|false` и автоматический retry на 401 через refresh-handler.
    - `useApi.ts` — React-хук: вызывает fetcher на монтировании, возвращает `{ data, error, loading }`, отменяет in-flight запрос на unmount / смене deps.
    - Per-resource модули: `projects.ts`, `vacancies.ts`, `directions.ts`, `hallOfFame.ts`, `contacts.ts`, `portfolio.ts`, `auth.ts`, `comments.ts`, `uploads.ts`, `admin.ts`. Типы — из `src/types/index.ts`.
    - `index.ts` — barrel-экспорт.
- `src/components/ApiStatus.tsx` — единый компонент состояний «загрузка / ошибка / пусто».
- `src/constants/filters.ts` — `PROJECT_TAGS`, `VACANCY_TAGS` (UI-фильтры, не данные с бека).

**Auth-слой** (PR #9/#10):

- `src/auth/tokenStorage.ts` — пара `accessToken` + `refreshToken` в `localStorage` под одним ключом.
- `src/auth/AuthContext.tsx` — React-контекст с `{ user, status, login, register, logout, setUser }`. На маунте бутстрапится через `/api/auth/me`. Держит токены в `useRef`, чтобы fetch-клиент всегда видел актуальные.
- `src/auth/useAuth.ts` — хук, бросает, если использовать вне `<AuthProvider>`.
- `src/pages/Login.tsx` — вкладки «Вход / Регистрация» в одной карточке. После регистрации сразу логиним и редиректим на `/portfolio`.
- `src/components/Header.tsx` — статус `loading` → серый кружок, `anonymous` → кнопка «Войти», `authenticated` → аватар-кнопка с выпадашкой («Моё портфолио», «Админка» (только для `role==='admin'`), «Выйти»).
- В `apiRequest` встроена **одна попытка refresh** на 401 с дедупом параллельных in-flight refresh-promise-ов.

**Личное портфолио** (PR #11, #15):

- `pages/Portfolio.tsx` переключается по `useAuth().status`:
    - `authenticated` → `fetchMyPortfolio`, рядом с заголовками «О себе», «Навыки», «Цели» и рядом с именем — кнопки «изменить» / карандашики.
    - `anonymous` → `fetchDefaultPortfolio`, без редактирования.
- Редактирование: `name` инлайн-инпутом (Enter/Escape), `about` через textarea с разделителем-пустой-строкой на абзацы, `skills`/`goals` через textarea с разделителями `,` или `\n`. Оптимистичное обновление UI после успешного PATCH-а.
- Загрузка/удаление аватара: `accept="image/png,image/jpeg,image/webp,image/gif"`, человеческие сообщения на 413/415, синхронное обновление `user.avatarUrl` в `AuthContext` через `setUser`.

**Лайки** (PR #12):

- `src/components/LikeButton.tsx` — кнопка с сердечком + счётчик, оптимистичный toggle, откат при ошибке, `navigate('/login')` для анонимов. `stopPropagation` на клик, чтобы не тянуть переход по карточке.
- Используется на главной (`components/Projects.tsx`), `pages/Projects.tsx`, `pages/Project.tsx`.

**Комментарии** (PR #13):

- `src/components/CommentsSection.tsx` вставлен в `pages/Project.tsx` последней секцией:
    - Анонимам — ссылка «Войдите, чтобы оставить комментарий».
    - Залогиненным — `<textarea>` (max 2000, счётчик), кнопка «Отправить».
    - Список с автором, датой `toLocaleString('ru-RU')` и телом. Кнопка «Удалить» — у автора или админа.
    - Создание/удаление с оптимистичным UI.

**Отклики на вакансии** (PR #14):

- `src/components/VacancyCard.tsx` переписан:
    - Аноним → «Откликнуться» ведёт на `/login`.
    - Залогинен и не откликался → модалка с `<textarea>` (max 4000, счётчик).
    - Залогинен и уже откликнулся → кнопка «Вы откликнулись» с галочкой; клик отзывает отклик без модалки.

**Админ-страница** (PR #16):

- `pages/Admin.tsx` — 5 вкладок: «Проекты», «Вакансии», «Направления», «Звёзды», «Отклики».
    - Проекты и вакансии редактируются через JSON-textarea (escape-hatch для заведующего кафедрой; полноценный form-builder для `team`/`reviews`/`artifacts` сознательно не строили).
    - Направления и звёзды — обычные поля.
    - «Отклики» — read-only список: селектор вакансии сверху, карточки с email/именем/датой/текстом.
- Client-side guard: если `user.role !== 'admin'`, редирект на `/`. Это удобство, не security — реальная защита на беке (403).

**.env.example** в корне с `VITE_API_URL=http://localhost:8000`.

Файлы `src/data/*.ts` оставлены на месте — они теперь источник для `scripts/export-seed.mjs`, которым генерируется `backend/seed_data/*.json`. В приложении больше не импортируются.

---

## 4. Что ещё НЕ сделано

### 4.1 Инфраструктура / прод (главный блок)

- **Деплой**. Сейчас бек поднимается только локально. Варианты: Fly.io, Railway, VPS (Selectel/Timeweb) с Docker, Vercel/Netlify — только для фронта.
- **Постоянная БД**. SQLite хорош для dev, но под прод лучше Postgres. Переключение — одна строка в `DATABASE_URL` + `alembic upgrade head` на пустой БД; SQLAlchemy-модели уже в драйвер-агностичном стиле.
- **Файловое хранилище**. Сейчас аватары лежат в `backend/uploads/` и раздаются самим FastAPI. На проде это плохо: каждый рестарт контейнера без volume теряет файлы, бэкап ручной, CDN нет. Надо переехать на S3/R2/MinIO + presigned URLs.
- **Branch protection на `main`** — настраивается в GitHub Settings → Branches, требовать зелёный `lint-and-test`. **Ещё не включено**.
- **CI для фронта** — сейчас CI прогоняется только по бекендовым изменениям. Надо добавить workflow `frontend.yml` с `npm ci && npm run lint && npm run build`.
- **Rate-limit на `/login`** и на mutations — чтобы нельзя было брутфорсить пароли и спамить отклики/комменты.
- **Pre-commit хуки** — опционально, чтобы ruff/eslint гонялись локально перед коммитом.

### 4.2 Что не «подключено», хотя бек/фронт частично готовы

- **Скриншоты проектов и артефакты**. Бек умеет хранить `projects.screenshots[]` и `projects.artifacts[]` как JSON, но **ручки на загрузку файлов не сделаны** (планировалось `POST /api/projects/{id}/screenshots`, `POST /api/projects/{id}/artifacts`). Сейчас их можно только подставить в JSON-textarea админки в виде ссылок.
- **Отзывы на проект**. `projects.reviews` тоже в JSON, но `POST /api/projects/{id}/reviews` от обычного юзера не реализован — отзывы можно завести только через админку (как часть JSON проекта).
- **Редактирование `info` / `works` / `contacts` в личном портфолио**. Бек принимает их через `PATCH /api/portfolio/me`, но фронтового UI на этих полях нет (есть только `name/about/skills/goals`). Это TODO с PR #11.
- **Защищённые роуты на фронте**. Сейчас всё кроме `/admin` публично. Когда появится «Профиль / Настройки», понадобится компонент-обёртка `<RequireAuth>`.

### 4.3 Технические улучшения (не срочные)

- **Нормализация JSON-колонок**. Сейчас `projects.team`, `projects.reviews`, `projects.links`, `projects.tags`, `projects.tech_stack`, `projects.screenshots`, `projects.artifacts` хранятся как JSON внутри строки проекта. Это удобно на старте, но ломает фильтры вида «все отзывы с рейтингом ≥ 4» и аналитику. Вынести в отдельные таблицы (`project_team_members`, `project_reviews`, `project_links`) — рефакторинг на ~день.
- **Ресайз/перепаковка аватаров**. Сейчас `POST /api/users/me/avatar` принимает файл как есть до 5 МБ, что бессмысленно на маленькой аватарке. Добавить Pillow + `image.thumbnail((512, 512))` — отдельный PR.
- **Денормализованные счётчики** (`projects.likes`, `projects.comments`) защищены от ухода ниже нуля, но никто не пересчитывает их периодически. Если разъедется — нужен `UPDATE … SELECT COUNT(*) … GROUP BY …`-фиксер. Можно сделать как management-команду `python -m app.recount` — пока не нужно.
- **Логи в нормальный формат** (structlog / json-logs) и корреляционный ID запроса.
- **Метрики** (prom/grafana) — сильно потом.
- **Кэш для read-ручек** (`Cache-Control`, ETag) — сильно потом.
- **Замена `useApi` на `react-query`/`SWR`** — сейчас хватает своего, но если страниц станет больше и понадобится cross-page кэш или mutate-with-rollback — это правильное направление. Сигнатуры `useApi` и `useQuery` похожи, миграция несложная.

---

## 5. Как устроен бэкенд

### 5.1 Структура

```
backend/
├── app/
│   ├── __init__.py
│   ├── config.py            # pydantic-settings, читает .env
│   ├── db.py                # async engine + session factory + DI
│   ├── deps.py              # get_db, get_current_user, get_optional_user, require_admin
│   ├── main.py              # FastAPI app, CORS, routers include, /uploads StaticFiles
│   ├── security.py          # bcrypt хэш, JWT encode/decode (типы access|refresh)
│   ├── seed.py              # python -m app.seed → загрузка JSON в БД
│   ├── make_admin.py        # python -m app.make_admin <email> → promote to admin
│   ├── uploads.py           # save_image_upload (валидация + запись на диск)
│   ├── models/              # SQLAlchemy ORM (User, UserProfile, Project,
│   │                        #  ProjectLike, ProjectComment, Vacancy,
│   │                        #  VacancyApplication, Direction, HallOfFame,
│   │                        #  DepartmentContact, PortfolioProfile)
│   ├── routers/             # auth, projects, project_comments, vacancies,
│   │                        # directions, hall_of_fame, contacts, portfolio,
│   │                        # uploads, admin
│   └── schemas/             # Pydantic-схемы запросов/ответов (camelCase aliases)
├── alembic/
│   ├── env.py
│   └── versions/
│       ├── 0001_initial.py
│       ├── 0002_users.py
│       ├── 0003_user_profiles.py
│       ├── 0004_project_likes.py
│       ├── 0005_project_comments.py
│       ├── 0006_vacancy_applications.py
│       └── 0007_user_avatars.py
├── seed_data/               # Источник данных для сидера (JSON)
├── tests/                   # pytest (75 passed)
├── uploads/                 # gitignored, аватары и т.п.
├── .env.example
├── alembic.ini
├── Dockerfile
├── pyproject.toml           # зависимости + dev-extras
└── README.md
```

### 5.2 Модель данных (ER-диаграмма своими словами)

```
users                       (PR #6, #15)
├─ id PK
├─ email (unique)
├─ password_hash
├─ display_name
├─ avatar_url               nullable, ссылка вида /uploads/avatars/<token>.png
├─ role                     ("user" | "admin")
└─ created_at

user_profiles               (PR #11)   1:1 к users (PK = user_id, FK CASCADE)
├─ user_id PK FK → users.id
├─ name
├─ info               JSON массив {label, value}
├─ about              JSON массив строк
├─ skills             JSON массив строк
├─ goals              JSON массив строк
├─ works              JSON массив {label, url}
└─ contacts           JSON {phone, email, website}

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
├─ likes              денормализованный счётчик (PR #12)
├─ comments           денормализованный счётчик (PR #13)
├─ subscribers_count
└─ created_at, updated_at

project_likes               (PR #12)   N:M users × projects
├─ user_id  FK → users.id     (CASCADE)    PK part 1
├─ project_id FK → projects.id (CASCADE)   PK part 2
└─ created_at

project_comments            (PR #13)
├─ id PK (uuid-строка)
├─ project_id FK → projects.id (CASCADE)   indexed
├─ author_id  FK → users.id    (CASCADE)
├─ body       TEXT 1..2000
└─ created_at indexed

vacancies                   (PR #4)
├─ id PK (строковый slug)
├─ title, subtitle, description
├─ tags               JSON
├─ responsibilities   JSON массив
└─ created_at

vacancy_applications        (PR #14)
├─ id PK (uuid-строка)
├─ vacancy_id FK → vacancies.id (CASCADE)  indexed
├─ user_id    FK → users.id     (CASCADE)  indexed
├─ message    TEXT 1..4000
├─ created_at
└─ UNIQUE (vacancy_id, user_id)             — один активный отклик

directions                  (PR #4)
├─ id PK, name, slash_title
└─ stack              JSON массив строк

hall_of_fame                (PR #4)
├─ id PK, name, title, avatar_url
└─ order_index

department_contacts         (PR #4)
└─ phone, email           (одна строка; id=1 singleton)

portfolio_profiles          (PR #4)   — дефолтный шаблон для анонимов
├─ id PK ("default")
├─ name
├─ info               JSON массив {label, value}
├─ about              JSON массив строк
├─ skills             JSON массив строк
├─ goals              JSON массив строк
├─ works              JSON массив {label, url}
└─ contacts           JSON {phone, email, website}
```

JSON-колонки — осознанный компромисс на старте: они легко сериализуются в/из уже существующих TS-типов, но плохи для фильтров и агрегации. См. п. 4.3.

### 5.3 Поток аутентификации

```
1. Регистрация
   ┌──────┐  POST /api/auth/register {email, password, displayName?}
   │Front │ ─────────────────────────────────────────────────────────►
   └──────┘
                                                   bcrypt.hashpw(password)
                                                   INSERT INTO users
                                                   200 OK {id, email, …, avatarUrl: null}
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
   │Front │  → кладёт токены в localStorage (tokenStorage.ts)
   └──────┘

3. Защищённый запрос
   ┌──────┐  GET /api/auth/me
   │Front │  Authorization: Bearer <accessToken>
   └──────┘ ─────────────────────────────────────────────────────────►
                                        jwt.decode(type="access") → user_id
                                        SELECT FROM users
                                        200 OK {id, email, displayName, role, avatarUrl}

4. Access истёк (через 30 минут)
   ┌──────┐  GET /api/projects/intellect-search/like   ── 401 ──►
   │Front │  ◄──── client.ts ловит 401, дёргает refreshHandler
   │      │  POST /api/auth/refresh {refreshToken}
   │      │ ─────────────────────────────────────────────────────►
   └──────┘                       200 OK {accessToken, refreshToken} (новая пара)
   (фронт ретраит первоначальный запрос с новым access-токеном; параллельные
    401-ы делят одну in-flight refresh-promise, чтобы не дёргать /refresh
    несколько раз подряд)
```

Access-токен на 30 минут, refresh — на 14 дней. Оба подписаны одним `JWT_SECRET`, но в payload есть `type: "access" | "refresh"`, поэтому перепутать нельзя: endpoint `/refresh` принимает только `type=refresh`, все остальные — только `type=access`.

### 5.4 Опциональный auth и admin guard

В `app/deps.py` живут три зависимости:

- `get_current_user` — 401, если токена нет/битый. Используется на всех authed-ручках (`/auth/me`, лайки, комменты, отклики, аватары, `/portfolio/me`).
- `get_optional_user` — `None`, если токена нет/битый. Используется на read-ручках, которые хотят обогатить ответ для залогиненных (`likedByMe`, `appliedByMe`).
- `require_admin` — `403`, если `user.role != "admin"`. Подвешен на уровне всего роутера `/api/admin/*`, так что любой новый endpoint внутри получает гейт автоматически.

---

## 6. Как устроен фронтенд

### 6.1 Структура

```
src/
├── api/                       # клиент и fetch-обёртки
│   ├── client.ts              # apiRequest<T>, ApiError, BASE_URL,
│   │                          # auth-injection, refresh-retry на 401, FormData
│   ├── useApi.ts              # useApi hook (AbortController)
│   ├── auth.ts                # register, login, refresh, fetchMe
│   ├── projects.ts            # fetchProjects, fetchProject, toggleProjectLike
│   ├── comments.ts            # fetchProjectComments, createProjectComment, deleteProjectComment
│   ├── vacancies.ts           # fetchVacancies, fetchVacancy, applyToVacancy, withdrawVacancyApplication
│   ├── directions.ts
│   ├── hallOfFame.ts
│   ├── contacts.ts
│   ├── portfolio.ts           # fetchDefaultPortfolio, fetchMyPortfolio, updateMyPortfolio
│   ├── uploads.ts             # uploadAvatar, deleteAvatar
│   ├── admin.ts               # CRUD для проектов/вакансий/направлений/звёзд + applications
│   └── index.ts               # barrel
├── auth/                      # (PR #9/#10) — auth-слой
│   ├── tokenStorage.ts        # localStorage-обёртка
│   ├── AuthContext.tsx        # AuthProvider, статусы, login/register/logout/setUser
│   └── useAuth.ts
├── components/                # переиспользуемые блоки
│   ├── ApiStatus.tsx          # состояния загрузки/ошибки
│   ├── LikeButton.tsx         # (PR #12)
│   ├── CommentsSection.tsx    # (PR #13)
│   ├── Directions.tsx
│   ├── Footer.tsx
│   ├── HallOfFame.tsx
│   ├── Header.tsx             # (PR #9/#10) с auth-меню и пунктом «Админка»
│   ├── Hero.tsx
│   ├── Projects.tsx           # грид на главной
│   ├── ProjectCard.tsx        # (см. Notes — сейчас не используется)
│   ├── VacancyCard.tsx        # (PR #14) с модалкой отклика
│   ├── Contacts.tsx
│   └── *.module.css
├── constants/
│   └── filters.ts             # PROJECT_TAGS, VACANCY_TAGS
├── data/                      # источники для сидера (раньше — данные приложения)
│   └── projects.ts, vacancies.ts, directions.ts, portfolio.ts, hallOfFame.ts, contacts.ts
├── pages/
│   ├── Projects.tsx           # список с фильтром/поиском
│   ├── Project.tsx            # детальная (с лайком и комментариями)
│   ├── Vacancies.tsx
│   ├── Portfolio.tsx          # personal или default — по статусу auth
│   ├── Login.tsx              # (PR #9/#10) вход + регистрация
│   └── Admin.tsx              # (PR #16) 5 вкладок CRUD
├── types/
│   └── index.ts               # ProjectSummary, ProjectDetail, Vacancy, AuthUser, …
├── App.tsx                    # роуты + AuthProvider
├── main.tsx
└── index.css
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
alembic upgrade head                # применит все миграции 0001..0007
python -m app.seed
uvicorn app.main:app --reload
```

- Swagger: http://localhost:8000/docs
- Health: http://localhost:8000/api/health
- Прогнать тесты: `pytest`
- Сделать себя админом (для `/admin`): `python -m app.make_admin your@email.tld`

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

После того как админка живая (PR #16), можно вообще не пересобирать сид — заводить контент через `/admin`. Сид остаётся полезен для быстрого подъёма пустой БД с примерами.

---

## 8. Рекомендованный порядок следующих работ

Все «оживить кнопки» и админка — закрыты. Что осталось из не-сделанного, отсортировано по «дешевизне × ценности»:

1. **Branch protection на `main`** (1 минута, GitHub Settings → Branches; требовать `lint-and-test`).
2. **Frontend CI** — workflow `.github/workflows/frontend.yml`: `npm ci && npm run lint && npm run build`. Закрывает дыру, что фронтовые ошибки сейчас не ловятся CI.
3. **Деплой**:
    - фронт на Vercel/Netlify (`npm run build` → static),
    - бек на Fly.io / Railway с Postgres-аддоном (`DATABASE_URL=postgresql+asyncpg://…` + `alembic upgrade head` на старте),
    - `JWT_SECRET` сгенерировать (`python -c "import secrets; print(secrets.token_urlsafe(64))"`),
    - `CORS_ORIGINS` поправить на прод-домен фронта.
4. **Файловое хранилище** под аватары — S3-совместимый бакет (R2/MinIO/Selectel), переписать `app/uploads.py` на `boto3` + presigned URL. Без этого `/uploads` исчезает при каждом рестарте контейнера.
5. **Дозаполнение профиля** — UI на `info` / `works` / `contacts` (бек уже принимает).
6. **Скриншоты проектов и артефакты** — `POST /api/projects/{id}/screenshots`, `POST /api/projects/{id}/artifacts` + аплоуд в админке.
7. **Rate-limit на `/login` и mutations** — `slowapi` или nginx ingress.
8. **Ресайз аватаров** через Pillow.

---

## 9. Открытые вопросы / долги

- [ ] Branch protection на `main` всё ещё не включён.
- [ ] CI только для бека, фронт-линт/билд в GitHub Actions не гоняется.
- [ ] `JWT_SECRET` в `backend/.env.example` — это dev-плейсхолдер, в прод-деплое обязательно сгенерировать свой (`python -c "import secrets; print(secrets.token_urlsafe(64))"`).
- [ ] Нет страницы 404 / «общая ошибка загрузки» на верхнем уровне — пока только `ApiStatus` внутри каждой страницы.
- [ ] Нет формальной схемы ошибок от бека (сейчас `{"detail": "..."}` по умолчанию от FastAPI — нормально для MVP).
- [ ] `src/components/ProjectCard.tsx` — dead code, никем не импортируется (см. примечание из PR #12). Можно удалить отдельным «уборочным» PR-ом.
- [ ] Аватары и любые другие будущие аплоуды живут на локальном диске бека — на проде надо заменить на S3-совместимое хранилище **до** первого деплоя, иначе файлы будут теряться при рестартах.

### 9.1 Старые ветки `devin/*`

Все 12 веток `devin/*` на удалённом — это исходники уже смерженных PR-ов (#4–#16). Соответствующие коммиты (squash-merged) лежат в `main`. Эти ветки **можно безопасно удалить** через GitHub UI (Branches → корзина) или одной строкой:

```bash
git push origin --delete \
  devin/1777803818-fastapi-backend-skeleton \
  devin/1777914555-fix-cors-env-parsing \
  devin/1777918872-fastapi-auth \
  devin/1777920707-frontend-api-integration \
  devin/1777996374-project-status-docs \
  devin/1777996502-frontend-auth \
  devin/1777998133-personal-profile \
  devin/1777998658-project-likes \
  devin/1777999046-project-comments \
  devin/1777999529-vacancy-applications \
  devin/1777999878-avatar-uploads \
  devin/1778000343-admin-crud
```

История не потеряется — она вся уже в `main` через squash-коммиты.
