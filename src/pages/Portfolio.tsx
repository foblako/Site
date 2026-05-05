import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ApiError,
  fetchDefaultPortfolio,
  fetchMyPortfolio,
  updateMyPortfolio,
  useApi,
} from '../api'
import type { PortfolioPatch } from '../api'
import { useAuth } from '../auth/useAuth'
import { ApiStatus } from '../components/ApiStatus'
import { Footer } from '../components/Footer'
import type { UserProfile } from '../types'
import styles from './Portfolio.module.css'

type SectionKey = 'name' | 'about' | 'skills' | 'goals'

type EditState = { section: SectionKey; value: string } | null

export function Portfolio() {
  const navigate = useNavigate()
  const { status } = useAuth()
  const isAuthenticated = status === 'authenticated'

  const { data: serverProfile, loading, error } = useApi<UserProfile>(
    (signal) => (isAuthenticated ? fetchMyPortfolio(signal) : fetchDefaultPortfolio(signal)),
    [isAuthenticated],
  )

  // Optimistic overlay: PATCH succeeds → we keep the latest copy locally so
  // edits are visible even before the next refetch. Reset whenever the server
  // profile identity changes (e.g. logout → anonymous → login again).
  const [profile, setProfile] = useState<UserProfile | null>(null)
  useEffect(() => {
    setProfile(serverProfile ?? null)
  }, [serverProfile])

  const [edit, setEdit] = useState<EditState>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const startEdit = (section: SectionKey, value: string) => {
    setSaveError(null)
    setEdit({ section, value })
  }

  const cancelEdit = () => {
    setEdit(null)
    setSaveError(null)
  }

  const applyPatch = async (patch: PortfolioPatch) => {
    setSaving(true)
    setSaveError(null)
    try {
      const updated = await updateMyPortfolio(patch)
      setProfile(updated)
      setEdit(null)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setSaveError('Сессия истекла — войдите заново.')
      } else if (err instanceof ApiError && err.status === 422) {
        setSaveError('Проверьте заполнение полей.')
      } else {
        setSaveError('Не удалось сохранить. Попробуйте ещё раз.')
      }
    } finally {
      setSaving(false)
    }
  }

  const saveEdit = () => {
    if (edit === null) return
    switch (edit.section) {
      case 'name': {
        const trimmed = edit.value.trim()
        if (!trimmed) {
          setSaveError('Имя не может быть пустым.')
          return
        }
        void applyPatch({ name: trimmed })
        break
      }
      case 'about': {
        const paragraphs = edit.value
          .split(/\n{2,}/)
          .map((p) => p.trim())
          .filter((p) => p.length > 0)
        void applyPatch({ about: paragraphs })
        break
      }
      case 'skills':
      case 'goals': {
        const items = edit.value
          .split(/[,\n]/)
          .map((item) => item.trim())
          .filter((item) => item.length > 0)
        void applyPatch({ [edit.section]: items } as PortfolioPatch)
        break
      }
    }
  }

  if (!profile) {
    return (
      <section className={styles.portfolio} aria-label="Портфолио">
        <ApiStatus loading={loading} error={error} />
      </section>
    )
  }

  const canEdit = isAuthenticated
  const isEditingSection = (section: SectionKey) => edit?.section === section

  const renderEditControls = () => (
    <div className={styles.editControls}>
      {saveError && <span className={styles.editError}>{saveError}</span>}
      <button
        type="button"
        className={styles.editActionSave}
        onClick={saveEdit}
        disabled={saving}
      >
        {saving ? 'Сохраняю…' : 'Сохранить'}
      </button>
      <button
        type="button"
        className={styles.editActionCancel}
        onClick={cancelEdit}
        disabled={saving}
      >
        Отмена
      </button>
    </div>
  )

  return (
    <>
      <section className={styles.portfolio} aria-label="Портфолио">
      <div className={styles.portfolioGrid}>
        <div className={styles.avatarBlock}>
          <img className={styles.avatarLarge} src="/avatar.svg" alt="User avatar" />
          <img className={styles.avatarStroke} src="/Vector 3.svg" alt="" aria-hidden="true" />
        </div>

        <div className={styles.nameBlock}>
          {isEditingSection('name') ? (
            <div className={styles.nameEdit}>
              <input
                className={styles.nameInput}
                type="text"
                value={edit?.value ?? ''}
                onChange={(e) => setEdit({ section: 'name', value: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEdit()
                  else if (e.key === 'Escape') cancelEdit()
                }}
                autoFocus
              />
              {renderEditControls()}
            </div>
          ) : (
            <div className={styles.nameDisplay}>
              <h1 className={styles.name}>{profile.name}</h1>
              {canEdit && (
                <button
                  className={styles.editButton}
                  type="button"
                  onClick={() => startEdit('name', profile.name)}
                  aria-label="Редактировать имя"
                >
                  <img className={styles.editIcon} src="/EditName.svg" alt="" aria-hidden="true" />
                </button>
              )}
            </div>
          )}
        </div>

        <div className={styles.emptyRight} />

        <div className={styles.leftColumn} />

        <div className={styles.middleColumn}>
          <div className={styles.infoSection}>
            <h2 className={styles.sectionTitle}><span className={styles.sectionSlash}>//</span> Основная информация</h2>
            <div className={styles.infoList}>
              {profile.info.map((item) => (
                <div key={item.label} className={styles.infoItem}>
                  <span className={styles.infoLabel}>{item.label}:</span>
                  <span className={styles.infoValue}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.aboutSection}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionSlash}>//</span> О себе
              {canEdit && !isEditingSection('about') && (
                <button
                  className={styles.sectionEditButton}
                  type="button"
                  onClick={() => startEdit('about', profile.about.join('\n\n'))}
                  aria-label="Редактировать раздел «О себе»"
                >
                  изменить
                </button>
              )}
            </h2>
            {isEditingSection('about') ? (
              <div className={styles.sectionEdit}>
                <textarea
                  className={styles.sectionTextarea}
                  value={edit?.value ?? ''}
                  onChange={(e) => setEdit({ section: 'about', value: e.target.value })}
                  rows={6}
                  placeholder="Один абзац. Для нового абзаца оставь пустую строку."
                  autoFocus
                />
                {renderEditControls()}
              </div>
            ) : (
              <div className={styles.aboutText}>
                {profile.about.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            )}
          </div>

          <div className={styles.skillsSection}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionSlash}>//</span> Навыки
              {canEdit && !isEditingSection('skills') && (
                <button
                  className={styles.sectionEditButton}
                  type="button"
                  onClick={() => startEdit('skills', profile.skills.join(', '))}
                  aria-label="Редактировать навыки"
                >
                  изменить
                </button>
              )}
            </h2>
            {isEditingSection('skills') ? (
              <div className={styles.sectionEdit}>
                <textarea
                  className={styles.sectionTextarea}
                  value={edit?.value ?? ''}
                  onChange={(e) => setEdit({ section: 'skills', value: e.target.value })}
                  rows={3}
                  placeholder="Через запятую: Python, TypeScript, …"
                  autoFocus
                />
                {renderEditControls()}
              </div>
            ) : (
              <div className={styles.skillsList}>
                {profile.skills.map((skill) => (
                  <span key={skill} className={styles.skillTag}>{skill}</span>
                ))}
              </div>
            )}
          </div>

          <div className={styles.goalsSection}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionSlash}>//</span> Цели
              {canEdit && !isEditingSection('goals') && (
                <button
                  className={styles.sectionEditButton}
                  type="button"
                  onClick={() => startEdit('goals', profile.goals.join('\n'))}
                  aria-label="Редактировать цели"
                >
                  изменить
                </button>
              )}
            </h2>
            {isEditingSection('goals') ? (
              <div className={styles.sectionEdit}>
                <textarea
                  className={styles.sectionTextarea}
                  value={edit?.value ?? ''}
                  onChange={(e) => setEdit({ section: 'goals', value: e.target.value })}
                  rows={4}
                  placeholder="Каждая цель с новой строки."
                  autoFocus
                />
                {renderEditControls()}
              </div>
            ) : (
              <ul className={styles.goalsList}>
                {profile.goals.map((goal) => (
                  <li key={goal} className={styles.goalItem}>{goal}</li>
                ))}
              </ul>
            )}
          </div>

          <div className={styles.worksSection}>
            <h2 className={styles.sectionTitle}><span className={styles.sectionSlash}>//</span> Мои работы</h2>
            <div className={styles.worksLinks}>
              {profile.works.map((work) => (
                <a key={work.label} href={work.url} className={styles.workLink} target="_blank" rel="noopener noreferrer">
                  {work.label}: {work.url}
                </a>
              ))}
            </div>
          </div>

          <div className={styles.projectsSection}>
            <h2 className={styles.sectionTitle}><span className={styles.sectionSlash}>//</span> Участие в проектах</h2>
            <div className={styles.projectsGrid}>
              <div className={styles.projectCard} onClick={() => navigate('/project/intellect-search')} style={{ cursor: 'pointer' }}>
                <span className={styles.projectStatus}>
                  <img src="/status-completed.svg" alt="" aria-hidden="true" />
                  Завершен
                </span>
                <img className={styles.projectImage} src="/intellectsearch.svg" alt="Интеллектуальный поиск" />
                <div className={styles.projectName}>Интеллектуальный поиск</div>
              </div>
              <div className={styles.projectCard} onClick={() => navigate('/project/kafedra-site')} style={{ cursor: 'pointer' }}>
                <span className={styles.projectStatus}>
                  <img src="/status-archived.svg" alt="" aria-hidden="true" />
                  В архиве
                </span>
                <img className={styles.projectImage} src="/siteKafedri.svg" alt="Сайт кафедры" />
                <div className={styles.projectName}>Сайт кафедры</div>
              </div>
              <div className={styles.projectCard} onClick={() => navigate('/project/russian-roulette')} style={{ cursor: 'pointer' }}>
                <span className={styles.projectStatus}>
                  <img src="/status-cancelled.svg" alt="" aria-hidden="true" />
                  Отменен
                </span>
                <img className={styles.projectImage} src="/IgraRuletkka.svg" alt="Игра в русскую рулетку" />
                <div className={styles.projectName}>Игра в русскую рулетку</div>
              </div>
              <div className={styles.projectCard} onClick={() => navigate('/project/mindmosaic')} style={{ cursor: 'pointer' }}>
                <span className={styles.projectStatus}>
                  <img src="/status-in-progress.svg" alt="" aria-hidden="true" />
                  В разработке
                </span>
                <img className={styles.projectImage} src="/MindMosaic.svg" alt="MindMosaic" />
                <div className={styles.projectName}>MindMosaic</div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.rightColumn}>
          <div className={styles.contactsSection}>
            <h2 className={styles.sectionTitle}><span className={styles.sectionSlash}>//</span> Контакты</h2>
            <div className={styles.contactsList}>
              <p className={styles.contactItem}>Телефон: {profile.contacts.phone}</p>
              <p className={styles.contactItem}>Почта: {profile.contacts.email}</p>
              <p className={styles.contactItem}>Сайт: {profile.contacts.website}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <Footer />
    </>
  )
}
