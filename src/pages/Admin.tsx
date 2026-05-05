import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ApiError,
  createDirection,
  createProject,
  useApi,
  createStar,
  createVacancy,
  deleteDirection,
  deleteProject,
  deleteStar,
  deleteVacancy,
  fetchDirections,
  fetchHallOfFame,
  fetchProjects,
  fetchVacancies,
  fetchVacancyApplications,
  updateDirection,
  updateProject,
  updateStar,
  updateVacancy,
} from '../api'
import type { AdminVacancyApplication } from '../api'
import { useAuth } from '../auth/useAuth'
import { Footer } from '../components/Footer'
import type {
  Direction,
  HallOfFameStar,
  ProjectSummary,
  Vacancy,
} from '../types'
import styles from './Admin.module.css'

type Tab = 'projects' | 'vacancies' | 'directions' | 'stars' | 'applications'

const TABS: { key: Tab; label: string }[] = [
  { key: 'projects', label: 'Проекты' },
  { key: 'vacancies', label: 'Вакансии' },
  { key: 'directions', label: 'Направления' },
  { key: 'stars', label: 'Звёзды' },
  { key: 'applications', label: 'Отклики' },
]

const PROJECT_TEMPLATE = JSON.stringify(
  {
    id: 'my-new-project',
    title: 'Название проекта',
    description: 'Короткое описание',
    image: '/projects/my-new-project.png',
    status: 'В разработке',
    statusIcon: '/icons/development.svg',
    participants: 0,
    tags: ['tag'],
    fullDescription: 'Развернутое описание',
    startDate: '2025-01-01',
    communityRating: 0,
    expertsRating: 0,
    screenshots: 0,
    technologies: [],
    team: [],
    reviews: [],
    artifacts: [],
  },
  null,
  2,
)

const VACANCY_TEMPLATE = JSON.stringify(
  {
    title: 'Название вакансии',
    description: 'Краткое описание',
    tags: ['frontend'],
    responsibilities: 'Что предстоит делать',
    responsibilitiesList: ['пункт 1', 'пункт 2'],
  },
  null,
  2,
)

function describeError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 403) return 'Нет прав администратора.'
    if (err.status === 401) return 'Сессия истекла — войдите заново.'
    if (err.status === 404) return 'Объект не найден (возможно, уже удалён).'
    if (err.status === 409) return 'Конфликт: объект с такими данными уже существует.'
    if (err.status === 422) return 'Ошибка в данных — проверьте JSON/поля.'
    return `Ошибка ${err.status}: ${err.message}`
  }
  return 'Неизвестная ошибка сети.'
}

export function Admin() {
  const { user, status } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('projects')

  useEffect(() => {
    if (status === 'loading') return
    if (status !== 'authenticated' || user?.role !== 'admin') {
      navigate('/', { replace: true })
    }
  }, [status, user, navigate])

  if (status !== 'authenticated' || user?.role !== 'admin') {
    return (
      <section className={styles.admin} aria-label="Админка">
        <p className={styles.checking}>Проверяем доступ…</p>
      </section>
    )
  }

  return (
    <>
      <section className={styles.admin} aria-label="Админка">
        <h1 className={styles.title}>// Админка</h1>
        <div className={styles.tabs} role="tablist">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              className={tab === t.key ? styles.tabActive : styles.tab}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className={styles.tabBody}>
          {tab === 'projects' && <ProjectsPane />}
          {tab === 'vacancies' && <VacanciesPane />}
          {tab === 'directions' && <DirectionsPane />}
          {tab === 'stars' && <StarsPane />}
          {tab === 'applications' && <ApplicationsPane />}
        </div>
      </section>
      <Footer />
    </>
  )
}

// --------------------------------------------------------------------------- //
// Projects
// --------------------------------------------------------------------------- //

function ProjectsPane() {
  const [items, setItems] = useState<ProjectSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [json, setJson] = useState(PROJECT_TEMPLATE)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const reload = async () => {
    try {
      setItems(await fetchProjects())
    } catch (err) {
      setError(describeError(err))
    }
  }

  useEffect(() => {
    void reload()
  }, [])

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      const payload = JSON.parse(json)
      if (editingId !== null) {
        await updateProject(editingId, payload)
      } else {
        await createProject(payload)
      }
      setEditingId(null)
      setJson(PROJECT_TEMPLATE)
      await reload()
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError(`Невалидный JSON: ${err.message}`)
      } else {
        setError(describeError(err))
      }
    } finally {
      setBusy(false)
    }
  }

  const edit = (project: ProjectSummary) => {
    setEditingId(project.id)
    setJson(JSON.stringify(project, null, 2))
  }

  const remove = async (id: string) => {
    if (!confirm(`Удалить проект ${id}?`)) return
    try {
      await deleteProject(id)
      await reload()
    } catch (err) {
      setError(describeError(err))
    }
  }

  return (
    <div className={styles.pane}>
      <div className={styles.formBlock}>
        <h2>{editingId !== null ? `Редактируем ${editingId}` : 'Новый проект'}</h2>
        <p className={styles.hint}>
          Вставь JSON с полями (id для создания обязателен). Списки <code>team</code>,{' '}
          <code>reviews</code>, <code>artifacts</code> — массивы объектов.
        </p>
        <textarea
          className={styles.jsonArea}
          value={json}
          onChange={(e) => setJson(e.target.value)}
          spellCheck={false}
          rows={18}
        />
        {error !== null && <p className={styles.error}>{error}</p>}
        <div className={styles.formActions}>
          <button type="button" className={styles.primary} onClick={submit} disabled={busy}>
            {busy ? 'Сохраняю…' : editingId !== null ? 'Сохранить' : 'Создать'}
          </button>
          {editingId !== null && (
            <button
              type="button"
              className={styles.secondary}
              onClick={() => {
                setEditingId(null)
                setJson(PROJECT_TEMPLATE)
                setError(null)
              }}
            >
              Отмена
            </button>
          )}
        </div>
      </div>

      <div className={styles.listBlock}>
        <h2>Существующие проекты</h2>
        {items === null ? (
          <p>Загружаю…</p>
        ) : items.length === 0 ? (
          <p>Пока пусто.</p>
        ) : (
          <ul className={styles.itemList}>
            {items.map((project) => (
              <li key={project.id} className={styles.item}>
                <div className={styles.itemInfo}>
                  <strong>{project.title}</strong>
                  <span className={styles.itemMeta}>
                    id: {project.id} · {project.status}
                  </span>
                </div>
                <div className={styles.itemActions}>
                  <button type="button" onClick={() => edit(project)}>
                    Редактировать
                  </button>
                  <button
                    type="button"
                    className={styles.danger}
                    onClick={() => void remove(project.id)}
                  >
                    Удалить
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// --------------------------------------------------------------------------- //
// Vacancies
// --------------------------------------------------------------------------- //

function VacanciesPane() {
  const [items, setItems] = useState<Vacancy[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [json, setJson] = useState(VACANCY_TEMPLATE)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)

  const reload = async () => {
    try {
      setItems(await fetchVacancies())
    } catch (err) {
      setError(describeError(err))
    }
  }

  useEffect(() => {
    void reload()
  }, [])

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      const payload = JSON.parse(json)
      if (editingId !== null) {
        await updateVacancy(editingId, payload)
      } else {
        await createVacancy(payload)
      }
      setEditingId(null)
      setJson(VACANCY_TEMPLATE)
      await reload()
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError(`Невалидный JSON: ${err.message}`)
      } else {
        setError(describeError(err))
      }
    } finally {
      setBusy(false)
    }
  }

  const edit = (v: Vacancy) => {
    setEditingId(v.id)
    const rest = {
      title: v.title,
      description: v.description,
      tags: v.tags,
      responsibilities: v.responsibilities,
      responsibilitiesList: v.responsibilitiesList,
    }
    setJson(JSON.stringify(rest, null, 2))
  }

  const remove = async (id: number) => {
    if (!confirm(`Удалить вакансию #${id}?`)) return
    try {
      await deleteVacancy(id)
      await reload()
    } catch (err) {
      setError(describeError(err))
    }
  }

  return (
    <div className={styles.pane}>
      <div className={styles.formBlock}>
        <h2>{editingId !== null ? `Редактируем вакансию #${editingId}` : 'Новая вакансия'}</h2>
        <textarea
          className={styles.jsonArea}
          value={json}
          onChange={(e) => setJson(e.target.value)}
          spellCheck={false}
          rows={12}
        />
        {error !== null && <p className={styles.error}>{error}</p>}
        <div className={styles.formActions}>
          <button type="button" className={styles.primary} onClick={submit} disabled={busy}>
            {busy ? 'Сохраняю…' : editingId !== null ? 'Сохранить' : 'Создать'}
          </button>
          {editingId !== null && (
            <button
              type="button"
              className={styles.secondary}
              onClick={() => {
                setEditingId(null)
                setJson(VACANCY_TEMPLATE)
                setError(null)
              }}
            >
              Отмена
            </button>
          )}
        </div>
      </div>

      <div className={styles.listBlock}>
        <h2>Существующие вакансии</h2>
        {items === null ? (
          <p>Загружаю…</p>
        ) : items.length === 0 ? (
          <p>Пока пусто.</p>
        ) : (
          <ul className={styles.itemList}>
            {items.map((v) => (
              <li key={v.id} className={styles.item}>
                <div className={styles.itemInfo}>
                  <strong>{v.title}</strong>
                  <span className={styles.itemMeta}>id: {v.id}</span>
                </div>
                <div className={styles.itemActions}>
                  <button type="button" onClick={() => edit(v)}>
                    Редактировать
                  </button>
                  <button
                    type="button"
                    className={styles.danger}
                    onClick={() => void remove(v.id)}
                  >
                    Удалить
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// --------------------------------------------------------------------------- //
// Directions
// --------------------------------------------------------------------------- //

function DirectionsPane() {
  const [items, setItems] = useState<Direction[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [technologies, setTechnologies] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)

  const reload = async () => {
    try {
      setItems(await fetchDirections())
    } catch (err) {
      setError(describeError(err))
    }
  }

  useEffect(() => {
    void reload()
  }, [])

  const reset = () => {
    setEditingId(null)
    setName('')
    setTechnologies('')
    setError(null)
  }

  const submit = async () => {
    const techList = technologies
      .split(/[\n,]/)
      .map((x) => x.trim())
      .filter(Boolean)
    setBusy(true)
    setError(null)
    try {
      if (editingId !== null) {
        await updateDirection(editingId, { name, technologies: techList })
      } else {
        await createDirection({ name, technologies: techList })
      }
      reset()
      await reload()
    } catch (err) {
      setError(describeError(err))
    } finally {
      setBusy(false)
    }
  }

  const edit = (d: Direction) => {
    setEditingId(d.id)
    setName(d.name)
    setTechnologies(d.technologies.join(', '))
  }

  const remove = async (id: number) => {
    if (!confirm(`Удалить направление #${id}?`)) return
    try {
      await deleteDirection(id)
      await reload()
    } catch (err) {
      setError(describeError(err))
    }
  }

  return (
    <div className={styles.pane}>
      <div className={styles.formBlock}>
        <h2>{editingId !== null ? 'Редактировать направление' : 'Новое направление'}</h2>
        <label className={styles.field}>
          <span>Название</span>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className={styles.field}>
          <span>Технологии (через запятую)</span>
          <input
            type="text"
            value={technologies}
            onChange={(e) => setTechnologies(e.target.value)}
          />
        </label>
        {error !== null && <p className={styles.error}>{error}</p>}
        <div className={styles.formActions}>
          <button
            type="button"
            className={styles.primary}
            onClick={submit}
            disabled={busy || name.trim() === ''}
          >
            {busy ? 'Сохраняю…' : editingId !== null ? 'Сохранить' : 'Создать'}
          </button>
          {editingId !== null && (
            <button type="button" className={styles.secondary} onClick={reset}>
              Отмена
            </button>
          )}
        </div>
      </div>

      <div className={styles.listBlock}>
        <h2>Направления</h2>
        {items === null ? (
          <p>Загружаю…</p>
        ) : (
          <ul className={styles.itemList}>
            {items.map((d) => (
              <li key={d.id} className={styles.item}>
                <div className={styles.itemInfo}>
                  <strong>{d.name}</strong>
                  <span className={styles.itemMeta}>
                    {d.technologies.join(', ') || '—'}
                  </span>
                </div>
                <div className={styles.itemActions}>
                  <button type="button" onClick={() => edit(d)}>
                    Редактировать
                  </button>
                  <button
                    type="button"
                    className={styles.danger}
                    onClick={() => void remove(d.id)}
                  >
                    Удалить
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// --------------------------------------------------------------------------- //
// Stars (Hall of Fame)
// --------------------------------------------------------------------------- //

function StarsPane() {
  const [items, setItems] = useState<HallOfFameStar[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [avatar, setAvatar] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)

  const reload = async () => {
    try {
      setItems(await fetchHallOfFame())
    } catch (err) {
      setError(describeError(err))
    }
  }

  useEffect(() => {
    void reload()
  }, [])

  const reset = () => {
    setEditingId(null)
    setName('')
    setRole('')
    setAvatar('')
    setError(null)
  }

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      if (editingId !== null) {
        await updateStar(editingId, { name, role, avatar })
      } else {
        await createStar({ name, role, avatar })
      }
      reset()
      await reload()
    } catch (err) {
      setError(describeError(err))
    } finally {
      setBusy(false)
    }
  }

  const edit = (s: HallOfFameStar) => {
    setEditingId(s.id)
    setName(s.name)
    setRole(s.role)
    setAvatar(s.avatar)
  }

  const remove = async (id: number) => {
    if (!confirm(`Удалить звезду #${id}?`)) return
    try {
      await deleteStar(id)
      await reload()
    } catch (err) {
      setError(describeError(err))
    }
  }

  return (
    <div className={styles.pane}>
      <div className={styles.formBlock}>
        <h2>{editingId !== null ? 'Редактировать звезду' : 'Новая звезда'}</h2>
        <label className={styles.field}>
          <span>Имя</span>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className={styles.field}>
          <span>Роль</span>
          <input type="text" value={role} onChange={(e) => setRole(e.target.value)} />
        </label>
        <label className={styles.field}>
          <span>Путь к аватару (/public/... или URL)</span>
          <input type="text" value={avatar} onChange={(e) => setAvatar(e.target.value)} />
        </label>
        {error !== null && <p className={styles.error}>{error}</p>}
        <div className={styles.formActions}>
          <button
            type="button"
            className={styles.primary}
            onClick={submit}
            disabled={busy || name.trim() === '' || role.trim() === '' || avatar.trim() === ''}
          >
            {busy ? 'Сохраняю…' : editingId !== null ? 'Сохранить' : 'Создать'}
          </button>
          {editingId !== null && (
            <button type="button" className={styles.secondary} onClick={reset}>
              Отмена
            </button>
          )}
        </div>
      </div>

      <div className={styles.listBlock}>
        <h2>Зал славы</h2>
        {items === null ? (
          <p>Загружаю…</p>
        ) : (
          <ul className={styles.itemList}>
            {items.map((s) => (
              <li key={s.id} className={styles.item}>
                <div className={styles.itemInfo}>
                  <strong>{s.name}</strong>
                  <span className={styles.itemMeta}>{s.role}</span>
                </div>
                <div className={styles.itemActions}>
                  <button type="button" onClick={() => edit(s)}>
                    Редактировать
                  </button>
                  <button
                    type="button"
                    className={styles.danger}
                    onClick={() => void remove(s.id)}
                  >
                    Удалить
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// --------------------------------------------------------------------------- //
// Applications (read-only)
// --------------------------------------------------------------------------- //

function ApplicationsPane() {
  const { data: vacancies } = useApi<Vacancy[]>((signal) => fetchVacancies(signal), [])
  const [selected, setSelected] = useState<number | null>(null)

  const effectiveId = selected ?? vacancies?.[0]?.id ?? null
  const selectedVacancy = useMemo(
    () => vacancies?.find((v) => v.id === effectiveId) ?? null,
    [vacancies, effectiveId],
  )

  return (
    <div className={styles.applicationsPane}>
      <label className={styles.field}>
        <span>Вакансия</span>
        <select
          value={effectiveId ?? ''}
          onChange={(e) => setSelected(Number(e.target.value))}
        >
          {(vacancies ?? []).map((v) => (
            <option key={v.id} value={v.id}>
              #{v.id} — {v.title}
            </option>
          ))}
        </select>
      </label>

      {selectedVacancy !== null && (
        <p className={styles.hint}>Отклики на «{selectedVacancy.title}»</p>
      )}

      {effectiveId !== null ? (
        <ApplicationsList key={effectiveId} vacancyId={effectiveId} />
      ) : (
        <p>Нет вакансий.</p>
      )}
    </div>
  )
}

function ApplicationsList({ vacancyId }: { vacancyId: number }) {
  const { data, error, loading } = useApi<AdminVacancyApplication[]>(
    (signal) => fetchVacancyApplications(vacancyId, signal),
    [vacancyId],
  )

  if (loading) return <p>Загружаю…</p>
  if (error !== undefined) return <p className={styles.error}>{describeError(error)}</p>
  if (data === undefined || data.length === 0) return <p>Пока никто не откликнулся.</p>

  return (
    <ul className={styles.applicationList}>
      {data.map((a) => (
        <li key={a.id} className={styles.applicationItem}>
          <div className={styles.applicationHeader}>
            <strong>{a.applicant.displayName}</strong>
            <span className={styles.itemMeta}>
              {a.applicant.email} · {new Date(a.createdAt).toLocaleString('ru-RU')}
            </span>
          </div>
          <p className={styles.applicationMessage}>{a.message}</p>
        </li>
      ))}
    </ul>
  )
}
