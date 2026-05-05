# Проект «БК №536»: статус и документация

Отчёт по тому, что в проекте уже сделано, что ещё нет, как это всё устроено и как поднимать локально. Обновляется по мере появления новых PR.

Последнее обновление: май 2026, после PR #18 (frontend CI). Этот документ — самодостаточный путеводитель: разделы 1–6 про «что есть и как устроено», 7–8 про локальный запуск и ручную проверку в WSL, 9 про деплой в прод, 10 — шпаргалка для устной презентации проекта, 11–12 — план дальнейших работ и долги.

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

### 1.1 Что видит пользователь

Коротко по страницам, чтобы можно было рассказывать «по экранам»:

| URL              | Кто видит              | Что там                                                                                                  |
| ---------------- | ---------------------- | -------------------------------------------------------------------------------------------------------- |
| `/`              | все                    | Hero, секция «Проекты» (топ-карточки), «Направления», «Hall of Fame», «Вакансии», «Контакты». Лендинг.    |
| `/projects`      | все                    | Полный список проектов с поиском по названию и фильтрами по тегам. Кнопка-сердечко (лайк) на каждой карточке. |
| `/project/:id`   | все                    | Детальная страница: описание, технический стек, команда, скриншоты, артефакты, рейтинг сообщества и экспертов, отзывы, лайк, комментарии (с авторизацией для постинга). |
| `/vacancies`     | все                    | Список вакансий. Кнопка «Откликнуться» открывает модалку с текстовым полем (для залогиненных) или ведёт на `/login` (для анонимов). |
| `/portfolio`     | все, но контент разный | Аноним — дефолтный шаблон («Программик Айтишникович»). Залогиненный — свой профиль (имя, «о себе», навыки, цели, аватар) с кнопками-карандашиками для редактирования. |
| `/login`         | анонимы                | Вкладки «Вход / Регистрация» в одной карточке. После регистрации автологин и редирект на `/portfolio`.    |
| `/admin`         | только `role=admin`    | 5 вкладок CRUD: «Проекты», «Вакансии», «Направления», «Звёзды» (Hall of Fame), «Отклики» (read-only список откликов с фильтром по вакансии). Не-админам — редирект на `/`. |

### 1.2 Типичные пользовательские сценарии

1. **Аноним → активный юзер.** Открыл `/`, посмотрел проекты, нажал сердечко → редирект `/login` → зарегистрировался → автологин → вернулся к проектам → лайкнул, написал комментарий. Лайк/коммент сохраняются после рефреша; в шапке появился аватар-плейсхолдер с выпадашкой.

2. **Студент ищет, к чему присоединиться.** `/vacancies` → выбрал вакансию → «Откликнуться» → модалка с письмом «здравствуйте, я …» → submit. Карточка превращается в «Вы откликнулись». Можно отозваться одним кликом.

3. **Студент ведёт своё портфолио.** `/portfolio` → отредактировал имя, описание, навыки, цели → загрузил аватар (PNG/JPG/WEBP/GIF до 5 МБ) → аватар отразился и в шапке, и на странице. Поля сохраняются на беке (`PATCH /api/portfolio/me`).

4. **Заведующий кафедрой управляет контентом.** Через CLI делает себя админом (`python -m app.make_admin chair@mirea.ru`), логинится, в выпадашке появляется «Админка» → `/admin` → создаёт новый проект (JSON-textarea с подставленным шаблоном), добавляет вакансию, смотрит, кто откликнулся.

5. **Сессия истекает.** Через 30 минут access-токен умирает. Любой запрос отвечает 401 → фронт-клиент молча идёт в `/api/auth/refresh`, получает свежую пару → ретраит исходный запрос. Юзер ничего не замечает; refresh живёт 14 дней.

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
| [#17](https://github.com/foblako/Site/pull/17) | merged | Обновление `docs/STATUS.md` под актуальный `main` (PR #8…#16). |
| [#18](https://github.com/foblako/Site/pull/18) | merged | Frontend CI: `.github/workflows/frontend.yml` (`npm ci → npm run lint → npm run build` на Node 22). |

На момент написания этого обновления **открытых PR-ов нет**. Все ветки `devin/*` на удалённом — это уже смерженные исходники прошлых PR-ов, их можно безопасно удалить (см. п. 12.1).

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
- **Branch protection на `main`** — настраивается в GitHub Settings → Branches, требовать зелёные `lint-and-test` (бек) и `lint-and-build` (фронт). **Ещё не включено** — это шаг, который автоматически из workflow не сделать, нужен GitHub UI.
- **~~CI для фронта~~** — сделано в PR #18 (`.github/workflows/frontend.yml`: `npm ci → npm run lint → npm run build` на Node 22, path-filter на фронт-файлы).
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

## 7. Локальная разработка в WSL — пошагово

Этот раздел написан для случая «у меня Windows, я хочу всё поднять на своей машине». Если ты уже на Linux/macOS — большинство шагов идентичны, просто пропусти про WSL.

### 7.1 Что должно быть установлено в WSL

> **Важно:** не пытайся ставить Node для Windows и запускать `npm` оттуда. Vite будет валиться с `EPERM` или `EACCES` при попытке писать кэш в `/mnt/c/...`. Всё ставить **внутри WSL**, держать репозиторий **в WSL FS** (`~/`, не `/mnt/c/...`).

В чистой Ubuntu 22.04 WSL2:

```bash
# Системное обновление
sudo apt update && sudo apt upgrade -y

# Сборочный минимум + git + sqlite cli (для отладки БД)
sudo apt install -y build-essential git curl sqlite3

# Python 3.12 (в Ubuntu 22.04 по умолчанию 3.10 — ставим явно)
sudo add-apt-repository -y ppa:deadsnakes/ppa
sudo apt update
sudo apt install -y python3.12 python3.12-venv python3.12-dev

# Node.js через nvm (НЕ через apt — apt-овая версия слишком старая для Vite 8)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install 22
nvm alias default 22
```

Проверить:

```bash
python3.12 --version   # Python 3.12.x
node --version         # v22.x
npm --version          # 10.x или 11.x
git --version
```

### 7.2 Получить репозиторий

```bash
mkdir -p ~/projects
cd ~/projects
git clone https://github.com/foblako/Site.git site
cd site
```

> Не клонируй в `/mnt/c/...` — Windows-FS работает в WSL2 заметно медленнее, и в редких случаях ломается hot-reload (Vite не получает file-events с NTFS).

### 7.3 Поднять бек (терминал 1)

```bash
cd ~/projects/site/backend

# venv именно из python3.12
python3.12 -m venv .venv
source .venv/bin/activate

# project-deps + dev-deps (pytest, ruff, ...)
pip install -U pip
pip install -e ".[dev]"

# .env с дефолтами (JWT_SECRET, CORS_ORIGINS, DATABASE_URL=sqlite+aiosqlite:///./dev.db)
cp .env.example .env

# применить все миграции 0001..0007 → создаст dev.db и схему
alembic upgrade head

# залить начальные проекты/вакансии/направления/звёзды из backend/seed_data/*.json
python -m app.seed

# запустить dev-сервер с автоперезагрузкой
uvicorn app.main:app --reload
```

После этого:

- Swagger UI: <http://localhost:8000/docs> (можно ткнуть руками во все ручки)
- Health: <http://localhost:8000/api/health> → `{"status":"ok"}`
- БД-файл: `backend/dev.db`
- Тесты (в **новом** терминале с активным venv): `pytest` — должно пройти 75 тестов.

### 7.4 Поднять фронт (терминал 2)

```bash
cd ~/projects/site

# .env.local нужен, только если бек на нестандартном хосте/порту;
# по умолчанию VITE_API_URL=http://localhost:8000 уже зашит в src/api/client.ts
cp .env.example .env.local 2>/dev/null || true

# первая установка
npm ci

# dev-сервер с HMR
npm run dev
```

Сайт откроется на <http://localhost:5173>. **Важная особенность WSL2:** этот URL работает прямо из браузера Windows — WSL2 проксирует localhost-порты в хостовую систему, дополнительной настройки не нужно.

### 7.5 Сделать себя админом (терминал 3, опционально)

Регистрация через UI создаёт юзера с `role='user'`. Чтобы `/admin` стал доступен — повысить роль через CLI:

```bash
cd ~/projects/site/backend
source .venv/bin/activate
python -m app.make_admin your-email@mail.ru
# → Granted admin role to your-email@mail.ru
```

Перезайти на сайте (logout/login), и в выпадашке шапки появится «Админка» → `/admin`.

### 7.6 Заглянуть в БД (терминал 3, опционально)

```bash
cd ~/projects/site/backend
sqlite3 dev.db
```

Полезные запросы:

```sql
.tables
SELECT id, email, role FROM users;
SELECT user_id, project_id FROM project_likes;
SELECT id, project_id, author_id, content FROM project_comments;
SELECT user_id, vacancy_id, message FROM vacancy_applications;
```

Выйти: `.quit`.

### 7.7 Обновить сид-данные

Сид грузит `backend/seed_data/*.json` в БД (с `if not exists`-логикой). Если хочешь поправить «начальные» проекты/вакансии:

1. Отредактируй `src/data/projects.ts` (или соответствующий TS-файл — это первоисточник).
2. Сгенерируй JSON для бека: `node scripts/export-seed.mjs` (из корня репо).
3. Перезалей БД: с активным venv в `backend/` запусти `python -m app.seed`.

Если контент уже завёлся — проще править его через `/admin`, сид нужен только для быстрого подъёма пустой БД на новой машине.

### 7.8 Сбросить состояние

Самое грубое — удалить `backend/dev.db` и `backend/uploads/` и пройти 7.3 ещё раз:

```bash
cd ~/projects/site/backend
rm -f dev.db
rm -rf uploads/
alembic upgrade head && python -m app.seed
```

Это сбрасывает **всех** юзеров, лайки, комменты и т.д. — для local-only.

### 7.9 Типичные грабли

| Симптом                                                            | Причина                                                              | Решение                                                                                 |
| ------------------------------------------------------------------ | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `npm run dev` падает с `EPERM` / `EACCES`                          | репо лежит в `/mnt/c/...` или Node поставлен в Windows               | Перенести репо в `~/projects/...` (WSL FS), Node ставить через nvm в WSL                |
| Фронт грузится, но все запросы возвращают «Не удалось…»            | Бек не запущен или `VITE_API_URL` указывает не туда                  | Открой `http://localhost:8000/api/health` — должно быть `{"status":"ok"}`               |
| `/login` возвращает «CORS error» в DevTools                        | `CORS_ORIGINS` в `backend/.env` не содержит `http://localhost:5173` | Дописать его в `.env`, перезапустить uvicorn                                            |
| Лайки/комменты молча не сохраняются                                | access-токен умер (>30 мин), в localStorage старый                   | Logout → login, или просто F5 — клиент сам сходит на `/api/auth/refresh`                |
| `python -m app.seed` падает с `UNIQUE constraint failed: users.email` | сид запущен второй раз поверх существующей БД                        | Это безопасно — пропусти ошибку или начни с 7.8 (rm dev.db)                             |
| После `pip install -e ".[dev]"` ошибка про `aiosqlite` или `bcrypt` | системные dev-headers не стоят                                       | `sudo apt install -y python3.12-dev libpq-dev libssl-dev`                               |
| `alembic upgrade head` ругается на «Target database is not up to date» | в `dev.db` остался ручной кривой state                                | Удалить `dev.db`, повторить                                                             |
| `npm run dev` стартует, но HMR не работает (страница не обновляется) | Vite не получает file-events с Windows FS                            | Снова — репо должен лежать в WSL FS                                                     |

---

## 8. Локальное тестирование — что прокликать

Это пошаговый smoke-test после успешного запуска по разделу 7. Цель — убедиться, что весь user-flow работает end-to-end. Чек-лист удобно прогонять перед каждым релизом.

### 8.1 Чтение (анонимный пользователь)

- [ ] Открыть <http://localhost:5173> — лендинг отрисовался: hero, секции «Проекты» / «Направления» / «Hall of Fame» / «Вакансии» / «Контакты».
- [ ] `/projects` → отображается сетка проектов (минимум те, что засеяны).
- [ ] Ввести в поле поиска часть названия проекта → список фильтруется.
- [ ] Кликнуть по тегу → URL получает query-параметр, список ограничен.
- [ ] Кликнуть по карточке проекта → `/project/<id>`, детальная страница рендерит описание, команду, скриншоты-плейсхолдеры, рейтинги, отзывы (если засеяны).
- [ ] `/vacancies` → список вакансий с фильтрами по тегам/направлениям.
- [ ] `/portfolio` → отрисовался дефолтный шаблон-портфолио (Программик Айтишникович).
- [ ] `/admin` → редирект на `/` (потому что не залогинен).

### 8.2 Регистрация и логин

- [ ] На странице проекта нажать сердечко → редирект на `/login` (так как анон не может лайкать).
- [ ] Вкладка «Регистрация»: ввести email, пароль (≥8 символов), отображаемое имя → submit.
- [ ] После регистрации произошёл автологин: в шапке появился аватар-плейсхолдер с инициалом, ник в выпадашке.
- [ ] Logout (выпадашка → «Выйти») → шапка снова показывает «Войти».
- [ ] Login тем же email/password → залогинились.

### 8.3 Лайки

- [ ] Залогинен. На `/projects` нажать сердечко на одной из карточек — заполнилось, счётчик +1.
- [ ] Refresh (F5) → сердечко осталось заполненным, счётчик не сбросился.
- [ ] В терминале с sqlite: `SELECT * FROM project_likes;` → видна строка с твоим `user_id`.
- [ ] Повторно нажать сердечко → отжалось, счётчик -1.

### 8.4 Комментарии

- [ ] Открыть `/project/<id>` → внизу секция комментариев. Если ещё нет — увидишь «Комментариев пока нет».
- [ ] Написать комментарий, отправить → появился сверху списка с твоим именем и временем «только что».
- [ ] Под своим комментом видно «Удалить». Под чужими (например, засеянными) — нет.
- [ ] Нажать «Удалить» → исчез из списка.

### 8.5 Отклик на вакансию

- [ ] `/vacancies` → выбрать любую → «Откликнуться».
- [ ] Открылась модалка с textarea «Сопроводительное письмо…».
- [ ] Отправить → модалка закрылась, кнопка карточки превратилась в «Вы откликнулись».
- [ ] Refresh → состояние карточки сохранилось.
- [ ] `SELECT * FROM vacancy_applications;` → твоя заявка есть.
- [ ] Нажать «Вы откликнулись» → заявка отозвана, кнопка снова «Откликнуться».

### 8.6 Личное портфолио и аватар

- [ ] `/portfolio` → теперь это не дефолтный шаблон, а **твой** профиль (то имя, что вводил при регистрации).
- [ ] Кликнуть карандашик возле имени → инлайн-редактор → поменять → сохранить.
- [ ] Вернуться на `/` — в шапке имя обновилось.
- [ ] Заполнить поля «О себе», «Навыки», «Цели» → каждое сохраняется отдельно (PATCH-ом по разделу).
- [ ] Загрузить аватар (PNG/JPG/WEBP, до 5 МБ) → в шапке и на `/portfolio` появилась картинка.
- [ ] Открыть `http://localhost:8000/uploads/avatars/<filename>` напрямую — отдаётся как static.
- [ ] «Удалить аватар» → вернулся placeholder с инициалом.

### 8.7 Админка

- [ ] В терминале: `python -m app.make_admin твой-email@mail.ru`.
- [ ] На сайте: logout → login → в выпадашке появился пункт «Админка».
- [ ] `/admin` загрузился, видны 5 вкладок: «Проекты», «Вакансии», «Направления», «Звёзды», «Отклики».
- [ ] Вкладка «Проекты» → «Создать» → JSON-форма с шаблоном → отредактировать `title` → сохранить → новый проект появился.
- [ ] Открыть `/projects` (в новой вкладке) → созданный проект виден.
- [ ] В админке: «Удалить» этот проект → исчез из `/projects`.
- [ ] Вкладка «Отклики» → выбрать вакансию из 8.5 → виден список заявок (минимум — твоя).

### 8.8 Истечение access-токена

- [ ] Открыть DevTools → Application → Local Storage → `auth.access` — это JWT, у него `exp` через 30 минут от создания.
- [ ] Подождать 30+ минут (или вручную поправить токен на невалидный, или временно укоротить `JWT_ACCESS_TTL_MIN=1` в `backend/.env` и перезапустить бек).
- [ ] Любое действие (лайк, коммент) → клиент получит 401, но **молча** сходит в `/api/auth/refresh`, обновит пару и повторит запрос. Юзер ничего не увидит.
- [ ] Если refresh тоже истёк (14 дней) → залогинен как анон, перенаправление на `/login`.

### 8.9 Ошибки и edge cases

- [ ] Остановить бек (`Ctrl+C` в терминале 1) → на сайте при перезагрузке любой страницы внутри карточек / списков видна плашка «Не удалось получить данные с сервера».
- [ ] Поднять бек обратно → F5 → данные вернулись.
- [ ] Открыть DevTools → Network → попробовать отправить лайк/коммент с выключенным беком → запрос фейлится; UI откатывает оптимистичное состояние.

---

## 9. Деплой в продакшн

Сейчас в проекте нет ни деплой-скриптов, ни production-конфига — раздел описывает, **как** это сделать (один из рабочих вариантов). После прохождения этого раздела у тебя будет:

- фронт на CDN (быстро, бесплатно, HTTPS из коробки),
- бек на PaaS-сервисе с Docker,
- managed Postgres вместо локального SQLite,
- S3-совместимое хранилище для аватаров (важно: без этого аплоуды теряются при каждом рестарте),
- кастомный домен (опционально).

### 9.1 Обзор архитектуры

```
                          ┌──────────────────────────┐
                          │  vega.example.ru         │  ← кастомный домен (Cloudflare DNS)
                          └─────────────┬────────────┘
                                        │
              ┌─────────────────────────┴─────────────────────────┐
              │                                                   │
              ▼                                                   ▼
  ┌──────────────────────┐                          ┌──────────────────────┐
  │  Vercel              │                          │  Fly.io              │
  │  Static SPA (dist/)  │  HTTPS, JSON+multipart   │  FastAPI in Docker   │
  │  → vega.example.ru   │ ───────────────────────► │  api.vega.example.ru │
  └──────────────────────┘                          └─────────┬────────────┘
                                                              │
                                                ┌─────────────┴───────────┐
                                                │                         │
                                                ▼                         ▼
                                    ┌──────────────────────┐   ┌──────────────────────┐
                                    │  Postgres            │   │  Cloudflare R2       │
                                    │  (Fly Postgres /     │   │  (S3-совместимый)    │
                                    │   Neon / Supabase)   │   │  bucket: vega-avatars│
                                    └──────────────────────┘   └──────────────────────┘
```

Альтернативы по компонентам — в 9.7.

### 9.2 Шаг 0: что подготовить заранее

1. **Сгенерировать `JWT_SECRET`** (64 байта, не из dev-`.env.example`):
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(64))"
   ```
   Сохранить в менеджере паролей. Потерять = разлогинить всех.

2. **Аккаунты:**
   - GitHub (есть);
   - Vercel (https://vercel.com/signup, можно через GitHub OAuth);
   - Fly.io (https://fly.io/app/sign-up — карту просят, но в free hobby tier без списания);
   - Cloudflare (для R2 и DNS — https://dash.cloudflare.com/sign-up).

3. **CLI-утилиты в WSL:**
   ```bash
   # Vercel CLI (опционально — UI достаточно)
   npm i -g vercel

   # flyctl
   curl -L https://fly.io/install.sh | sh
   echo 'export FLYCTL_INSTALL="$HOME/.fly"' >> ~/.bashrc
   echo 'export PATH="$FLYCTL_INSTALL/bin:$PATH"' >> ~/.bashrc
   source ~/.bashrc

   flyctl auth login
   ```

### 9.3 Шаг 1: Postgres

> Локально мы на SQLite (через `aiosqlite`). На проде SQLite **не подходит** (один файл, нет конкурентности, теряется при рестарте контейнера). Переезжаем на Postgres + asyncpg.

**Вариант А — Fly Postgres** (живёт рядом с беком, минимальная latency):

```bash
flyctl postgres create --name vega-db --region fra --vm-size shared-cpu-1x --volume-size 1
# CLI выведет DATABASE_URL вида:
#   postgres://postgres:<pwd>@vega-db.flycast:5432/postgres
```

Чтобы наш код понял asyncpg, поменять схему на `postgresql+asyncpg://...`:
```
postgresql+asyncpg://postgres:<pwd>@vega-db.flycast:5432/postgres
```

**Вариант Б — Neon free tier** (https://neon.tech): создать проект, скопировать `connection string`, заменить префикс на `postgresql+asyncpg://`.

**Проверить миграции на Postgres локально:**

```bash
cd backend
source .venv/bin/activate
pip install asyncpg
DATABASE_URL='postgresql+asyncpg://...' alembic upgrade head
DATABASE_URL='postgresql+asyncpg://...' python -m app.seed
```

Если миграции прошли — значит схема Postgres-совместима. Если упало — открыть тикет и чинить миграцию (обычно проблема в `JSON` vs `JSONB` или `BOOLEAN`-defaults; у нас уже всё аккуратно).

### 9.4 Шаг 2: S3 (Cloudflare R2)

Нужно **до** деплоя бека — иначе аватары будут жить в эфемерном файловом слое контейнера и теряться при рестартах.

1. Cloudflare → R2 → Create bucket → name: `vega-avatars`, location: автоматический.
2. Manage R2 API Tokens → Create API token: разрешения `Object Read & Write` на этот bucket. Сохранить **Access Key ID** и **Secret Access Key**.
3. Settings → Public access → Allow public access (если хотим прямые ссылки `https://pub-...r2.dev/...`) или оставить приватным (тогда бек должен отдавать presigned URL).

**Изменения в коде, которые понадобятся** (это не тема этого PR-а — выделить отдельным):

- `backend/pyproject.toml`: добавить `boto3 = "^1.34"` в deps.
- `backend/app/uploads.py`: переписать `save_avatar(...)` так, чтобы вместо `Path.write_bytes` грузить в R2 через `boto3.client("s3", endpoint_url=..., ...)`. URL-возврат — `https://pub-XXX.r2.dev/avatars/<uuid>.<ext>`.
- `backend/app/main.py`: убрать `app.mount("/uploads", StaticFiles(...))` и саму `uploads/` директорию.
- В `.env` (и Fly secrets) добавить:
  ```
  S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
  S3_BUCKET=vega-avatars
  S3_ACCESS_KEY_ID=...
  S3_SECRET_ACCESS_KEY=...
  S3_PUBLIC_URL_BASE=https://pub-XXX.r2.dev
  ```

Как временный костыль на самый первый деплой — можно оставить локальные uploads и прицепить Fly volume (см. 9.5), но **обязательно** заменить на S3 до того, как у юзеров появятся реальные аватары: при ресайзинге машины volume может переехать, при `fly deploy` без `--strategy bluegreen` будет даунтайм.

### 9.5 Шаг 3: Бэкенд на Fly.io

В `backend/` уже есть `Dockerfile` — `fly launch` его подхватит.

```bash
cd ~/projects/site/backend

# Один раз — генерирует fly.toml. На вопросы:
#  - app name: vega-api (или другое уникальное)
#  - region: fra (Frankfurt) — ближе всего к РФ из европейских
#  - Postgres: NO (мы уже создали отдельно в 9.3)
#  - Redis: NO
#  - Deploy now: NO
flyctl launch --no-deploy

# Записать секреты (Fly хранит их зашифрованно, не путать с .env)
flyctl secrets set \
  JWT_SECRET="<сгенерированный в 9.2>" \
  DATABASE_URL="postgresql+asyncpg://...из 9.3..." \
  CORS_ORIGINS="https://vega.example.ru,https://vega-frontend.vercel.app" \
  S3_ENDPOINT="..." \
  S3_BUCKET="vega-avatars" \
  S3_ACCESS_KEY_ID="..." \
  S3_SECRET_ACCESS_KEY="..." \
  S3_PUBLIC_URL_BASE="..."

# В fly.toml дописать release_command — он запустится перед каждым деплоем
# (накатит миграции на Postgres до того, как новый код пойдёт принимать запросы):
#
#   [deploy]
#     release_command = "alembic upgrade head"
#
# (отредактировать руками)

# Первый деплой
flyctl deploy

# Один раз — залить сид на пустую БД
flyctl ssh console -C "python -m app.seed"

# Сделать кого-то админом
flyctl ssh console -C "python -m app.make_admin chair@mirea.ru"

# URL приложения
flyctl status   # → https://vega-api.fly.dev
```

**Если временно остаёмся на локальных uploads** (без S3): в `fly.toml` добавить mount:

```toml
[mounts]
  source      = "vega_uploads"
  destination = "/app/uploads"
```

И создать volume: `flyctl volumes create vega_uploads --region fra --size 1`.

### 9.6 Шаг 4: Фронт на Vercel

1. https://vercel.com/new → Import Git Repository → выбрать `foblako/Site`.
2. Framework Preset: **Vite** (Vercel определит автоматически).
3. Root Directory: `.` (корень репо).
4. Build Command: `npm run build`. Output Directory: `dist`. Install Command: `npm ci`.
5. Environment Variables → добавить:
   ```
   VITE_API_URL=https://vega-api.fly.dev
   ```
6. Deploy.

Через ~1 минуту получишь URL вида `https://site-foblako.vercel.app`.

**Замкнуть круг** — добавить URL фронта в CORS бека:

```bash
flyctl secrets set CORS_ORIGINS="https://site-foblako.vercel.app"
flyctl deploy
```

(Vercel ещё генерирует preview-URL для каждого PR — если хочется тестировать предпрод, в `CORS_ORIGINS` можно дописать паттерн `https://*-foblako.vercel.app` через несколько origin-ов.)

### 9.7 Шаг 5 (опционально): кастомный домен

Допустим, есть домен `vega.example.ru` в Cloudflare:

1. **Vercel → Settings → Domains → Add → vega.example.ru.** Vercel выдаст CNAME-таргет. В Cloudflare DNS добавить `CNAME vega → cname.vercel-dns.com.`, проксирование Cloudflare выключить (серый облачко) — Vercel хочет управлять SSL сам.
2. **Fly → `flyctl certs add api.vega.example.ru`.** Fly выдаст A/AAAA. В Cloudflare DNS добавить эти записи (для api можно оставить серое облачко).
3. На беке: `flyctl secrets set CORS_ORIGINS="https://vega.example.ru,https://www.vega.example.ru"; flyctl deploy`.
4. На фронте: Vercel → Env Var `VITE_API_URL=https://api.vega.example.ru` → Redeploy.

### 9.8 Альтернативы по компонентам

| Компонент   | Использовали выше      | Альтернативы                                                                                                                                                                              |
| ----------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend    | Vercel                 | Netlify, Cloudflare Pages, GitHub Pages (CDN-only, без сервер-сайд-редиректов), Yandex Cloud Static Hosting.                                                                              |
| Backend     | Fly.io                 | Railway (one-click, дороже на масштабе), Render, DigitalOcean App Platform, обычный VPS (Selectel/Timeweb/Hetzner) + Docker Compose + Caddy для HTTPS.                                    |
| DB          | Fly Postgres           | Neon (serverless, 0.5 ГБ free), Supabase (то же + GoTrue/Realtime — нам не нужно), Railway Postgres, managed Yandex.Cloud Postgres.                                                       |
| File storage | Cloudflare R2          | Backblaze B2, MinIO (self-hosted), Selectel S3, AWS S3 (дороже).                                                                                                                          |
| DNS+CDN     | Cloudflare             | Yandex DNS Hosting (без CDN), reg.ru, AWS Route 53.                                                                                                                                       |

Самое дешёвое для маленького проекта: **Cloudflare Pages + Fly.io + Neon free + Cloudflare R2** — всё бесплатно при низком трафике.

### 9.9 Альтернативный путь: всё на одном VPS через Docker Compose

Подходит, если кафедра против внешних PaaS. Минимальный сетап на VPS:

1. Купить VPS у Selectel/Timeweb (1 vCPU, 1–2 ГБ RAM хватает).
2. На сервере: `apt install docker.io docker-compose-v2 git`.
3. `git clone` + написать `docker-compose.prod.yml` примерно так:

   ```yaml
   services:
     api:
       build: ./backend
       env_file: .env.prod   # JWT_SECRET, DATABASE_URL, CORS_ORIGINS, S3_*
       depends_on: [db]
       restart: unless-stopped
       command: >
         sh -c "alembic upgrade head &&
                uvicorn app.main:app --host 0.0.0.0 --port 8000"
     db:
       image: postgres:16
       environment:
         POSTGRES_PASSWORD: <secret>
       volumes: [pgdata:/var/lib/postgresql/data]
       restart: unless-stopped
     web:
       image: caddy:2
       ports: ["80:80", "443:443"]
       volumes:
         - ./Caddyfile:/etc/caddy/Caddyfile
         - caddy_data:/data
       depends_on: [api]
       restart: unless-stopped
   volumes: { pgdata: {}, caddy_data: {} }
   ```

   Caddyfile:

   ```
   vega.example.ru {
       root * /srv/dist
       file_server
       try_files {path} /index.html
   }
   api.vega.example.ru {
       reverse_proxy api:8000
   }
   ```

4. На локальной машине собрать фронт: `npm run build`, скопировать `dist/` на сервер в `/srv/dist`.
5. `docker compose -f docker-compose.prod.yml up -d`.

Caddy сам получает Let's Encrypt-сертификаты, без ручного certbot.

### 9.10 Бэкапы и наблюдаемость (критично, но за рамками первого деплоя)

- **Postgres backups.** Managed-провайдеры (Neon/Supabase/Fly) делают snapshots сами. Для self-hosted — `pg_dump | gzip` каждую ночь в S3 через cron.
- **Sentry для ошибок.** В `backend/pyproject.toml` добавить `sentry-sdk`, в `app/main.py`:
  ```python
  import sentry_sdk
  sentry_sdk.init(dsn=os.getenv("SENTRY_DSN"), traces_sample_rate=0.1)
  ```
  и в `src/main.tsx` — `@sentry/react`. DSN-ы — env-vars.
- **Uptime monitoring.** UptimeRobot (free 50 мониторов) пингует `/api/health` каждые 5 минут.
- **Логи.** Fly хранит логи 7 дней (`flyctl logs`). Vercel — логи функций (у нас их нет, фронт static).

### 9.11 CI/CD (после ручного первого деплоя)

После того, как ручной деплой работает — автоматизировать:

- **Vercel** уже автодеплоит каждый push в `main` (и preview-URL для каждого PR), ничего настраивать не нужно.
- **Fly** — добавить `.github/workflows/deploy-backend.yml`:
  ```yaml
  on:
    push:
      branches: [main]
      paths: [backend/**, .github/workflows/deploy-backend.yml]
  jobs:
    deploy:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: superfly/flyctl-actions/setup-flyctl@v1
        - run: flyctl deploy --remote-only
          working-directory: backend
          env:
            FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
  ```
  Токен: `flyctl auth token` → положить в GitHub Secrets.

---

## 10. Шпаргалка: как описать проект за минуту

### 10.1 Лифтовая презентация (30 секунд)

> «Это сайт-портфолио кафедры БК №536 МИРЭА. Студенты показывают проекты и пишут отзывы, преподаватели заводят вакансии, выпускники светятся в Hall of Fame. Стек — React + FastAPI + Postgres. Фронт лежит на CDN, бек в Docker на Fly.io. JWT-авторизация со автоматическим refresh, S3 для аватаров, админ-панель с CRUD на весь контент.»

### 10.2 Тех-стек (что и зачем)

| Слой        | Технология                                       | Почему она                                                                 |
| ----------- | ------------------------------------------------ | -------------------------------------------------------------------------- |
| Frontend    | React 19 + Vite 8 + TypeScript                   | Стандарт сегодня; быстрый dev-сервер; типы → меньше багов на ревью.        |
| Стили       | CSS Modules                                      | Изоляция без рантайм-зависимостей и без CSS-in-JS-runtime cost.            |
| Routing     | react-router-dom v7                              | Декларативный, минимальный.                                                |
| API-client  | свой `apiRequest` поверх `fetch`                 | Одно место для авто-refresh JWT; без `axios` или `react-query` пока хватает.|
| Backend     | FastAPI (Python 3.12)                            | Быстро писать, OpenAPI-спека из коробки, async из коробки.                 |
| ORM         | SQLAlchemy 2 (async) + Alembic                   | Промышленный стандарт, понятные миграции.                                  |
| DB          | SQLite (dev) → Postgres (prod)                   | SQLite — ноль конфигурации локально; Postgres — конкурентность и бэкапы.   |
| Auth        | JWT (jose) + bcrypt                              | Stateless, без redis-sessions; refresh-токен 14 дней.                      |
| Хранилище   | локальный диск (dev) → S3-совместимое (prod)     | На проде контейнеры эфемерны → S3 обязателен.                              |

### 10.3 Что особенно важно понимать про архитектуру

1. **Фронт и бек полностью независимы.** Фронт — статика (HTML/JS/CSS), деплоится на CDN. Бек — API, ничего про фронт не знает (отдаёт CORS-разрешения для конкретных origin-ов). Можно подменить фронт на нативное мобильное приложение — бек продолжит работать.
2. **Все мутации требуют JWT.** `Authorization: Bearer <access>`. Если access умер — клиент молча идёт в `/api/auth/refresh` с long-lived refresh-токеном и ретраит запрос. Юзеру не показывается «сессия истекла».
3. **Роли — две.** `user` (по умолчанию) и `admin` (выдаётся через CLI `python -m app.make_admin`). `require_admin` — FastAPI dependency, который кидает 403, если роль не та. Все `/api/admin/*` ручки за ним.
4. **Лайки/комменты/отклики хранятся в отдельных таблицах,** не как JSON-колонки в проектах. Денормализованные счётчики (`projects.likes_count`) обновляются триггером в SQL — на чтении быстро, на записи дорого, но запись тут редкая.
5. **Идемпотентность мутаций.** Лайк = toggle (повторный POST убирает лайк); отклик на вакансию = `POST /apply` создаёт запись, повторный возвращает 409 «вы уже откликались»; `DELETE /apply` снимает.
6. **`useApi`-хук везде, кроме сложных страниц.** Это дешёвая обёртка над `apiRequest` с управлением `loading/error/data`. На странице проекта, где нужны 3 параллельных запроса, написана собственная логика.

### 10.4 Что объяснить, если спросят «а почему не…»

- **«Почему не Next.js?»** — у нас нет SSR-нужд (сайт за логином, SEO нужен только для лендинга, а лендинг и так почти весь статический). Vite + React-Router быстрее в разработке и легче в деплое.
- **«Почему не Django/Flask?»** — FastAPI даёт async, OpenAPI и Pydantic-валидацию из коробки; писать меньше boilerplate-кода.
- **«Почему JWT, а не cookie-сессии?»** — фронт и бек на разных доменах, JWT снимает CSRF-вопрос полностью. На минусах — нужно вручную делать refresh, что у нас и сделано.
- **«Почему SQLite на старте?»** — ноль конфигурации, миграции работают, можно показывать проект без поднятия Postgres-контейнера. Под прод миграции совместимы — переезд за один env-var.
- **«Почему JSON-колонки в проектах (`screenshots`, `artifacts`, `team`, `reviews`)?»** — на старте удобнее: одна модель `Project` без 5 связанных таблиц. По мере роста — нормализуем (это в плане п. 11).
- **«Почему свой `useApi`, а не TanStack Query?»** — пока 3 экрана с чтением, кэш и ретраи не нужны. Сигнатура совместима, миграция — однострочная.

### 10.5 Отвечать на «как это запустить»

1. Клонируем репо в WSL.
2. Бек: `cd backend && python3.12 -m venv .venv && source .venv/bin/activate && pip install -e ".[dev]" && cp .env.example .env && alembic upgrade head && python -m app.seed && uvicorn app.main:app --reload`.
3. Фронт (другой терминал, корень репо): `npm ci && npm run dev`.
4. `http://localhost:5173`.

(Полностью — раздел 7. С чек-листом проверки — раздел 8.)

---

## 11. Рекомендованный порядок следующих работ

Все «оживить кнопки» и админка — закрыты. Фронтовый CI добавлен в PR #18. Что осталось из не-сделанного, отсортировано по «дешевизне × ценности»:

1. **Branch protection на `main`** (1 минута, GitHub Settings → Branches → Add rule → require `lint-and-build` (frontend) + `lint-and-test` (backend)).
2. **S3 для аватаров** (раздел 9.4) — обязательно до первого настоящего деплоя.
3. **Деплой по разделу 9** (Postgres + Fly + Vercel + R2). Можно поэтапно: сначала фронт на Vercel + бек на Fly с локальной SQLite в volume → потом Postgres → потом R2.
4. **Дозаполнение профиля** — UI на `info` / `works` / `contacts` (бек уже принимает).
5. **Скриншоты проектов и артефакты** — `POST /api/projects/{id}/screenshots`, `POST /api/projects/{id}/artifacts` + аплоуд в админке.
6. **Восстановление пароля по email** (`/forgot` → токен → `/reset`).
7. **Email-верификация после регистрации** (без неё нельзя слать важные письма).
8. **Rate-limit на `/login` и mutations** — `slowapi` или nginx ingress.
9. **Ресайз аватаров** через Pillow.
10. **Sentry + Uptime monitoring** (раздел 9.10).
11. **E2E-тесты на Playwright** для критичных flow.

---

## 12. Открытые вопросы / долги

- [ ] Branch protection на `main` всё ещё не включён (включается только в GitHub UI).
- [ ] `JWT_SECRET` в `backend/.env.example` — это dev-плейсхолдер, в прод-деплое обязательно сгенерировать свой (`python -c "import secrets; print(secrets.token_urlsafe(64))"`).
- [ ] Нет страницы 404 / «общая ошибка загрузки» на верхнем уровне — пока только `ApiStatus` внутри каждой страницы.
- [ ] Нет формальной схемы ошибок от бека (сейчас `{"detail": "..."}` по умолчанию от FastAPI — нормально для MVP).
- [ ] `src/components/ProjectCard.tsx` — dead code, никем не импортируется (см. примечание из PR #12). Можно удалить отдельным «уборочным» PR-ом.
- [ ] Аватары и любые другие будущие аплоуды живут на локальном диске бека — на проде надо заменить на S3-совместимое хранилище (раздел 9.4) **до** первого деплоя, иначе файлы будут теряться при рестартах.
- [ ] Нет E2E-тестов на фронте (Playwright). На бек 75 pytest-ов, на фронт — ноль.
- [ ] Нет адаптивной вёрстки под мобильные/планшеты (всё рисовалось под десктоп).
- [ ] Нет SEO-обвязки (`<title>`/`<meta>`/OpenGraph/sitemap), социальные шаринги покажут пустоту.
- [ ] Нет согласия на обработку ПДн (152-ФЗ требует, если разворачиваться публично в РФ).

### 12.1 Старые ветки `devin/*`

На удалённом могут оставаться ветки `devin/*` — это исходники уже смерженных PR-ов (#4–#16+). Соответствующие коммиты (squash-merged) лежат в `main`. Эти ветки **можно безопасно удалить** через GitHub UI (Branches → корзина) или одной строкой:

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

История не потеряется — она вся уже в `main` через squash-коммиты. Список выше актуален на дату последнего обновления документа; при появлении новых веток дописать вручную или вычистить разом через `git branch -r --merged origin/main | grep devin/`.
