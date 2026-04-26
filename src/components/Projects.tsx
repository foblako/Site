import { useNavigate } from 'react-router-dom'
import styles from './Projects.module.css'

type Project = {
  id: string
  title: string
  description: string
  image: string
  tags: string[]
  status?: string
  statusIcon?: string
  likes?: number
  comments?: number
  participants?: number
}

const projects: Project[] = [
  {
    id: 'intellect-search',
    title: 'Интеллектуальный поиск',
    description:
      'Интеллектуальный поиск — это инновационная система, позволяющая быстро и удобно находить документы из коллекции кафедры.',
    image: '/intellectsearch.svg',
    tags: ['#Frontend', '#Backend', '#Базы_данных'],
    status: 'Завершен',
    statusIcon: '/status-completed.svg',
    likes: 1452,
    comments: 213,
    participants: 3,
  },
  {
    id: 'kafedra-site',
    title: 'Сайт кафедры',
    description:
      'Сайт кафедры — интернет-ресурс, представляющий информацию о научных проектах и учебных инициативах.',
    image: '/siteKafedri.svg',
    tags: ['#Web-дизайн', '#Backend', '#Frontend', '#Telegram_Bot'],
    status: 'В архиве',
    statusIcon: '/status-archived.svg',
    likes: 1013,
    comments: 191,
    participants: 17,
  },
  {
    id: 'russian-roulette',
    title: 'Игра в русскую рулетку',
    description:
      'Проект позволяет играть онлайн в классическую рулетку с несколькими режимами и рейтингом участников.',
    image: '/IgraRuletkka.svg',
    tags: ['#Frontend', '#Telegram_Bot'],
    status: 'Отменен',
    statusIcon: '/status-cancelled.svg',
    likes: 987,
    comments: 125,
    participants: 1,
  },
  {
    id: 'mindmosaic',
    title: 'MindMosaic for Vega MIREA Mobile App',
    description:
      'MindMosaic — интеллектуальная платформа для управления учебными данными и рекомендациями по развитию.',
    image: '/MindMosaic.svg',
    tags: ['#AI_товары', '#Mobile', '#Analytics'],
    status: 'В разработке',
    statusIcon: '/status-in-progress.svg',
    likes: 771,
    comments: 79,
    participants: 2,
  },
  {
    id: 'data-shop',
    title: 'Дата-Шоп',
    description:
      'Мощная платформа для аналитики и визуализации данных, созданная для образовательных проектов.',
    image: '/dataShar.svg',
    tags: ['#Data_Science', '#Базы_данных'],
    status: 'Идёт набор',
    statusIcon: '/status-recruiting.svg',
    likes: 312,
    comments: 13,
    participants: 0,
  },
]

export function Projects() {
  const navigate = useNavigate()

  return (
    <section id="projects" className={styles.projectsSection} aria-label="Projects">
      <div className={styles.projectsHeader}>
        <h2 className={styles.projectsLead}>Представляем вам</h2>
        <div className={styles.highlightWrapper}>
          <h1 className={styles.highlightTitle}>
            <span className={styles.underlinedWord}>
              лучшие
              <img className={styles.underlineSvg} src="/Vector 1.svg" alt="" aria-hidden="true" />
            </span>
            {' '}проекты
          </h1>
        </div>
        <h2 className={styles.projectsSubhead}>базовой кафедры №536</h2>
      </div>

      <div className={styles.projectsGrid}>
        {projects.map((project) => (
          <article key={project.id} className={styles.projectCard}>
            <div className={styles.cardImageWrapper} onClick={() => navigate(`/project/${project.id}`)} style={{ cursor: 'pointer' }}>
              <img
                className={styles.cardImage}
                src={project.image}
                alt={project.title}
                loading="lazy"
              />
              {project.status ? (
                <span className={styles.statusPill} data-status={project.status}>
                  {project.statusIcon && (
                    <img className={styles.statusIcon} src={project.statusIcon} alt="" aria-hidden="true" />
                  )}
                  {project.status}
                </span>
              ) : null}
            </div>

            <div className={styles.cardContent}>
              <h3 className={styles.cardTitle} onClick={() => navigate(`/project/${project.id}`)} style={{ cursor: 'pointer' }}>{project.title}</h3>

              <p className={styles.cardDescription}>{project.description}</p>

              <div className={styles.cardBottom}>
                <div className={styles.cardTags}>
                  {project.tags.map((tag) => (
                    <span key={tag} className={styles.cardTag}>
                      {tag}
                    </span>
                  ))}
                </div>

                <div className={styles.cardStats}>
                  <span className={styles.statItem}>
                    <img
                      src="/likeActive.svg"
                      alt="Likes"
                      className={styles.statIcon}
                    />
                    {project.likes ?? 0}
                  </span>
                  <span className={styles.statItem}>
                    <img
                      src="/obsuzdenie.svg"
                      alt="Comments"
                      className={styles.statIcon}
                    />
                    {project.comments ?? 0}
                  </span>
                  <span className={styles.statItem}>
                    <img
                      src="/Subscribers.svg"
                      alt="Participants"
                      className={styles.statIcon}
                    />
                    {project.participants ?? 0}
                  </span>
                </div>
              </div>

              <button className={styles.detailsButton} type="button" onClick={() => navigate(`/project/${project.id}`)}>
                Подробнее <span aria-hidden>→</span>
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className={styles.viewAll} onClick={() => navigate('/projects')} style={{ cursor: 'pointer' }}>
        <div className={styles.viewAllContent}>
          <h2 className={styles.viewAllTitle}>Посмотрите все наши проекты</h2>
          <img className={styles.viewAllArrow} src="/arrow-right.svg" alt="" aria-hidden="true" />
        </div>
      </div>
    </section>
  )
}
