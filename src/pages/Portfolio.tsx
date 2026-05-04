import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchDefaultPortfolio, useApi } from '../api'
import { ApiStatus } from '../components/ApiStatus'
import { Footer } from '../components/Footer'
import styles from './Portfolio.module.css'

export function Portfolio() {
  const navigate = useNavigate()
  const { data: profile, loading, error } = useApi(
    (signal) => fetchDefaultPortfolio(signal),
    [],
  )
  // Local override applied on top of the server name; stays null until the
  // user actually edits, so a refetch keeps the displayed name in sync.
  const [nameOverride, setNameOverride] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const displayName = nameOverride ?? profile?.name ?? ''

  const handleEditClick = () => {
    setEditValue(displayName)
    setIsEditing(true)
  }

  const handleSave = () => {
    if (editValue.trim()) {
      setNameOverride(editValue.trim())
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
    }
  }

  if (!profile) {
    return (
      <section className={styles.portfolio} aria-label="Портфолио">
        <ApiStatus loading={loading} error={error} />
      </section>
    )
  }

  return (
    <>
      <section className={styles.portfolio} aria-label="Портфолио">
      <div className={styles.portfolioGrid}>
        <div className={styles.avatarBlock}>
          <img className={styles.avatarLarge} src="/avatar.svg" alt="User avatar" />
          <img className={styles.avatarStroke} src="/Vector 3.svg" alt="" aria-hidden="true" />
        </div>

        <div className={styles.nameBlock}>
          {isEditing ? (
            <div className={styles.nameEdit}>
              <input
                className={styles.nameInput}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                autoFocus
              />
            </div>
          ) : (
            <div className={styles.nameDisplay}>
              <h1 className={styles.name}>{displayName}</h1>
              <button
                className={styles.editButton}
                type="button"
                onClick={handleEditClick}
                aria-label="Редактировать имя"
              >
                <img className={styles.editIcon} src="/EditName.svg" alt="" aria-hidden="true" />
              </button>
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
            <h2 className={styles.sectionTitle}><span className={styles.sectionSlash}>//</span> О себе</h2>
            <div className={styles.aboutText}>
              {profile.about.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>

          <div className={styles.skillsSection}>
            <h2 className={styles.sectionTitle}><span className={styles.sectionSlash}>//</span> Навыки</h2>
            <div className={styles.skillsList}>
              {profile.skills.map((skill) => (
                <span key={skill} className={styles.skillTag}>{skill}</span>
              ))}
            </div>
          </div>

          <div className={styles.goalsSection}>
            <h2 className={styles.sectionTitle}><span className={styles.sectionSlash}>//</span> Цели</h2>
            <ul className={styles.goalsList}>
              {profile.goals.map((goal) => (
                <li key={goal} className={styles.goalItem}>{goal}</li>
              ))}
            </ul>
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
