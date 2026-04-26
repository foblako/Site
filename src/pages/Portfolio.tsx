import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './Portfolio.module.css'

const skills = [
  'HTML', 'CSS', 'JavaScript', 'Python', 'React', 'TypeScript',
  'Node.js', 'Django', 'Git', 'Docker', 'SQL', 'Figma',
]

const goals = [
  'Выучить Python',
  'Закрыть долг по физ-ре',
  'Получить красный диплом',
]

export function Portfolio() {
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('Программик Айтишникович')
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(displayName)

  const handleEditClick = () => {
    setEditValue(displayName)
    setIsEditing(true)
  }

  const handleSave = () => {
    if (editValue.trim()) {
      setDisplayName(editValue.trim())
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

  const infoItems = [
    { label: 'Образовательная программа', value: 'Бакалавриат' },
    { label: 'Группа', value: 'КМБО-05-55' },
    { label: 'Курс', value: '4 курс' },
    { label: 'Шифр', value: '55К666' },
    { label: 'Институт', value: 'ИИИ' },
    { label: 'Формирующее подразделение', value: 'БК 536 РТУ МИРЭА' },
    { label: 'Специальность', value: 'Прикладная математика и информатика' },
    { label: 'Год приёма', value: '2055' },
  ]

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
              {infoItems.map((item) => (
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
              <p>
                Я люблю работать над проектами, которые позволяют мне применять теорию на практике.
                В своей учебе я сосредоточен на разработке веб-приложений и изучении алгоритмов.
                Участвовал в нескольких хакатонах, где смог не только улучшить свои технические навыки,
                но и научиться работать в команде.
              </p>
              <p>
                Кроме программирования, меня интересуют новые технологии, такие как искусственный интеллект
                и машинное обучение. Я всегда открыт для новых идей и возможностей сотрудничества,
                поэтому не стесняйтесь обращаться ко мне!
              </p>
              <p>
                В свободное время я люблю читать книги по саморазвитию и смотреть научно-популярные фильмы.
                Я верю, что постоянное обучение и обмен опытом — ключ к успеху в этой быстро меняющейся области.
              </p>
            </div>
          </div>

          <div className={styles.skillsSection}>
            <h2 className={styles.sectionTitle}><span className={styles.sectionSlash}>//</span> Навыки</h2>
            <div className={styles.skillsList}>
              {skills.map((skill) => (
                <span key={skill} className={styles.skillTag}>{skill}</span>
              ))}
            </div>
          </div>

          <div className={styles.goalsSection}>
            <h2 className={styles.sectionTitle}><span className={styles.sectionSlash}>//</span> Цели</h2>
            <ul className={styles.goalsList}>
              {goals.map((goal) => (
                <li key={goal} className={styles.goalItem}>{goal}</li>
              ))}
            </ul>
          </div>

          <div className={styles.worksSection}>
            <h2 className={styles.sectionTitle}><span className={styles.sectionSlash}>//</span> Мои работы</h2>
            <div className={styles.worksLinks}>
              <a href="http://example_github.com" className={styles.workLink} target="_blank" rel="noopener noreferrer">
                Github: http://example_github.com
              </a>
              <a href="http://example_gitlab.com" className={styles.workLink} target="_blank" rel="noopener noreferrer">
                Gitlab: http://example_gitlab.com
              </a>
              <a href="http://example_behance.com" className={styles.workLink} target="_blank" rel="noopener noreferrer">
                Behance: http://example_behance.com
              </a>
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
              <p className={styles.contactItem}>Телефон: +7(999)-123-45-67</p>
              <p className={styles.contactItem}>Почта: prog_it@mail.com</p>
              <p className={styles.contactItem}>Сайт: http://example.ru</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <h2 className={styles.footerTitle}>Контакты</h2>
        <p className={styles.footerInfo}>
          +7 (499) 215-65-65 доб. 2404<br />
          vega@mirea.ru
        </p>
      </div>
    </footer>
    </>
  )
}
