import { useState } from 'react'
import styles from './Projects.module.css'
import portfolioStyles from './Portfolio.module.css'
import { ProjectCard } from '../components/ProjectCard'

const projects = [
  {
    id: 'intellect-search',
    title: 'Интеллектуальный поиск',
    description: 'Интеллектуальный поиск — это инновационная система, позволяющая быстро и удобно находить документы из коллекции кафедры.',
    tags: ['Frontend', 'Backend', 'Базы_данных'],
    status: 'Завершен',
    statusIcon: '/status-completed.svg',
    likes: 1452,
    comments: 213,
    participants: 3,
  },
  {
    id: 'kafedra-site',
    title: 'Сайт кафедры',
    description: 'Сайт кафедры — интернет-ресурс, представляющий информацию о научных проектах и учебных инициативах.',
    tags: ['Web-дизайн', 'Backend', 'Frontend', 'Telegram_Bot'],
    status: 'В архиве',
    statusIcon: '/status-archived.svg',
    likes: 1013,
    comments: 191,
    participants: 17,
  },
  {
    id: 'russian-roulette',
    title: 'Игра в русскую рулетку',
    description: 'Проект позволяет играть онлайн в классическую рулетку с несколькими режимами и рейтингом участников.',
    tags: ['Frontend', 'Telegram_Bot'],
    status: 'Отменен',
    statusIcon: '/status-cancelled.svg',
    likes: 987,
    comments: 125,
    participants: 1,
  },
  {
    id: 'mindmosaic',
    title: 'MindMosaic for Vega MIREA Mobile App',
    description: 'MindMosaic — интеллектуальная платформа для управления учебными данными и рекомендациями по развитию.',
    tags: ['AI_товары', 'Mobile', 'Analytics'],
    status: 'В разработке',
    statusIcon: '/status-in-progress.svg',
    likes: 771,
    comments: 79,
    participants: 2,
  },
  {
    id: 'data-shop',
    title: 'Дата-Шоп',
    description: 'Мощная платформа для аналитики и визуализации данных, созданная для образовательных проектов.',
    tags: ['Data_Science', 'Базы_данных'],
    status: 'Идёт набор',
    statusIcon: '/status-recruiting.svg',
    likes: 312,
    comments: 13,
    participants: 0,
  },
]

const allTags = ['Frontend', 'Backend', 'Web-дизайн', 'Telegram_Bot', 'AI_товары', 'Mobile', 'Analytics', 'Data_Science', 'Базы_данных']

export function Projects() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTags = selectedTags.length === 0 ||
                       selectedTags.some(tag => project.tags.includes(tag))
    return matchesSearch && matchesTags
  })
  return (
    <>
    <section className={styles.vacancies} aria-label="Страница проектов">
      <div className={styles.content}>
        <div className={styles.textBlock}>
          <h1 className={styles.titleTop}>Наши реализованные</h1>
          <h1 className={styles.titleHighlighted}>проекты команд</h1>
          <h1 className={styles.titleBottom}>лучших студентов</h1>
        </div>

        <div className={styles.filterBlock}>
          <div className={styles.searchSection}>
            <div className={styles.searchInput}>
              <input
                type="text"
                placeholder="Поиск"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.input}
              />
              <img src="/search.svg" alt="" aria-hidden="true" className={styles.searchIcon} />
            </div>

            <div className={styles.filterButtons}>
              <button className={styles.filterButton} aria-label="Сортировка">
                <img src="/sort.svg" alt="" aria-hidden="true" />
              </button>
              <button className={styles.filterButton} aria-label="Фильтр">
                <img src="/filter.svg" alt="" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className={styles.tagsContainer}>
            {allTags.map(tag => (
              <button
                key={tag}
                className={`${styles.tag} ${selectedTags.includes(tag) ? styles.tagActive : ''}`}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.vacanciesGrid}>
          {filteredProjects.map((project, index) => (
            <ProjectCard key={project.id} {...project} index={index} total={projects.length} />
          ))}
        </div>

        <div className={styles.backToTopContainer}>
          <button 
            className={styles.backToTopButton}
            onClick={() => window.scrollTo(0, 0)}
            type="button"
          >
            На этом всё<br />Вернуться в начало
          </button>
        </div>
      </div>
    </section>

    <footer className={portfolioStyles.footer}>
      <div className={portfolioStyles.footerContent}>
        <h2 className={portfolioStyles.footerTitle}>Контакты</h2>
        <p className={portfolioStyles.footerInfo}>
          +7 (499) 215-65-65 доб. 2404<br />
          vega@mirea.ru
        </p>
      </div>
    </footer>
    </>
  )
}