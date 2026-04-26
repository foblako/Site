import { useParams, useNavigate } from 'react-router-dom'
import styles from './Project.module.css'

type Project = {
  id: string
  title: string
  description: string
  fullDescription: string
  image: string
  tags: string[]
  status?: string
  statusIcon?: string
  likes?: number
  comments?: number
  participants?: number
  team?: { name: string; role: string; avatar?: string; period?: string }[]
  technologies?: string[]
  startDate?: string
  communityRating?: number
  expertsRating?: number
  screenshots?: number
  reviews?: { author: string; text: string; rating?: number }[]
  artifacts?: { name: string; url: string }[]
}

const projects: Record<string, Project> = {
  'intellect-search': {
    id: 'intellect-search',
    title: 'Интеллектуальный поиск',
    description: 'Интеллектуальный поиск — это инновационная система, позволяющая быстро и удобно находить документы из коллекции кафедры.',
    fullDescription: `Интеллектуальный поиск — это инновационная система, позволяющая быстро и удобно находить документы из коллекции кафедры.

Проект использует современные алгоритмы поиска и машинного обучения для предоставления релевантных результатов. Система анализирует запрос пользователя, учитывая контекст и предыдущие взаимодействия, чтобы предоставить наиболее подходящие документы.

Основные возможности включают полнотекстовый поиск, фильтрацию по категориям, сортировку по релевантности и дате, а также интеграцию с существующей инфраструктурой кафедры.`,
    image: '/intellectsearch.svg',
    tags: ['#Frontend', '#Backend', '#Базы_данных'],
    status: 'Завершен',
    statusIcon: '/status-completed.svg',
    likes: 1452,
    comments: 213,
    participants: 3,
    startDate: '01.09.2020',
    communityRating: 4.2,
    expertsRating: 4.8,
    team: [
      { name: 'Иванов И.И.', role: 'Frontend-разработчик', avatar: '/avatar.svg', period: 'с 2020 по н/в' },
      { name: 'Петров П.П.', role: 'Backend-разработчик', avatar: '/avatar.svg', period: 'с 2020 по 2022' },
      { name: 'Сидоров С.С.', role: 'Дизайнер', avatar: '/avatar.svg', period: 'с 2021 по н/в' },
    ],
    technologies: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Elasticsearch'],
    screenshots: 5,
    reviews: [
      { author: 'Алексей К.', text: 'Отличный проект! Очень удобный поиск документов.', rating: 5 },
      { author: 'Мария С.', text: 'Полезная система для работы с документами кафедры.', rating: 4 },
    ],
    artifacts: [
      { name: 'Презентация', url: '#' },
      { name: 'Документация', url: '#' },
    ],
  },
  'kafedra-site': {
    id: 'kafedra-site',
    title: 'Сайт кафедры',
    description: 'Сайт кафедры — интернет-ресурс, представляющий информацию о научных проектах и учебных инициативах.',
    fullDescription: `Сайт кафедры — интернет-ресурс, представляющий информацию о научных проектах и учебных инициативах.

Платформа предоставляет удобный интерфейс для студентов и преподавателей, позволяя легко находить информацию о курсах, расписании, научных проектах и достижениях кафедры. Сайт регулярно обновляется и дополняется новыми материалами.

Проект включает интеграцию с Telegram-ботом для уведомлений и автоматизации коммуникации.`,
    image: '/siteKafedri.svg',
    tags: ['#Web-дизайн', '#Backend', '#Frontend', '#Telegram_Bot'],
    status: 'В архиве',
    statusIcon: '/status-archived.svg',
    likes: 1013,
    comments: 191,
    participants: 17,
    startDate: '15.03.2021',
    communityRating: 3.8,
    expertsRating: 4.1,
    team: [
      { name: 'Завьялов Антон', role: 'Руководитель проекта', avatar: '/avatar.svg', period: 'с 2021 по н/в' },
      { name: 'Дрейфельд Денис', role: 'Fullstack-разработчик', avatar: '/avatar.svg', period: 'с 2021 по н/в' },
    ],
    technologies: ['React', 'Express.js', 'MongoDB', 'Telegram Bot API'],
    screenshots: 5,
    reviews: [
      { author: 'Дмитрий В.', text: 'Хороший информационный ресурс.', rating: 4 },
    ],
    artifacts: [
      { name: 'ТЗ', url: '#' },
    ],
  },
  'russian-roulette': {
    id: 'russian-roulette',
    title: 'Игра в русскую рулетку',
    description: 'Проект позволяет играть онлайн в классическую рулетку с несколькими режимами и рейтингом участников.',
    fullDescription: `Проект позволяет играть онлайн в классическую рулетку с несколькими режимами и рейтингом участников.

Игра поддерживает несколько режимов: классический, быстрый и турнирный. Система рейтинга позволяет отслеживать прогресс игроков и создавать справедливые匹配ования. Интеграция с Telegram-ботом обеспечивает уведомления о начале игры и результатах.`,
    image: '/IgraRuletkka.svg',
    tags: ['#Frontend', '#Telegram_Bot'],
    status: 'Отменен',
    statusIcon: '/status-cancelled.svg',
    likes: 987,
    comments: 125,
    participants: 1,
    startDate: '10.06.2022',
    communityRating: 3.5,
    expertsRating: 3.2,
    team: [
      { name: 'Морозов М.М.', role: 'Fullstack-разработчик', avatar: '/avatar.svg', period: 'с 2022 по 2023' },
    ],
    technologies: ['React', 'WebSocket', 'Telegram Bot API'],
    screenshots: 5,
    reviews: [
      { author: 'Игорь Т.', text: 'Интересная идея, но не хватило реализации.', rating: 3 },
    ],
    artifacts: [],
  },
  'mindmosaic': {
    id: 'mindmosaic',
    title: 'MindMosaic for Vega MIREA Mobile App',
    description: 'MindMosaic — интеллектуальная платформа для управления учебными данными и рекомендациями по развитию.',
    fullDescription: `MindMosaic — интеллектуальная платформа для управления учебными данными и рекомендациями по развитию.

Платформа использует алгоритмы искусственного интеллекта для анализа учебных данных студента и предоставления персонализированных рекомендаций по развитию. Система учитывает успеваемость, интересы и карьерные цели для формирования индивидуального плана развития.

Мобильное приложение обеспечивает удобный доступ ко всем функциям платформы в любое время.`,
    image: '/MindMosaic.svg',
    tags: ['#AI_товары', '#Mobile', '#Analytics'],
    status: 'В разработке',
    statusIcon: '/status-in-progress.svg',
    likes: 771,
    comments: 79,
    participants: 2,
    startDate: '20.01.2023',
    communityRating: 4.5,
    expertsRating: 4.7,
    team: [
      { name: 'Волков В.В.', role: 'ML-инженер', avatar: '/avatar.svg', period: 'с 2023 по н/в' },
      { name: 'Лебедев Л.Л.', role: 'Mobile-разработчик', avatar: '/avatar.svg', period: 'с 2023 по н/в' },
    ],
    technologies: ['Python', 'TensorFlow', 'React Native', 'FastAPI'],
    screenshots: 5,
    reviews: [
      { author: 'Елена П.', text: 'Отличная платформа для управления учебными данными!', rating: 5 },
      { author: 'Андрей Р.', text: 'Перспективный проект с хорошей аналитикой.', rating: 4 },
    ],
    artifacts: [
      { name: 'Презентация', url: '#' },
      { name: 'Исследование', url: '#' },
    ],
  },
  'data-shop': {
    id: 'data-shop',
    title: 'Дата-Шоп',
    description: 'Мощная платформа для аналитики и визуализации данных, созданная для образовательных проектов.',
    fullDescription: `Мощная платформа для аналитики и визуализации данных, созданная для образовательных проектов.

Платформа предоставляет инструменты для сбора, обработки и визуализации данных. Пользователи могут создавать интерактивные дашборды, настраивать отчёты и делиться результатами с коллегами. Система поддерживает различные источники данных и форматы экспорта.

Проект находится в стадии активного набора участников для расширения функциональности.`,
    image: '/dataShar.svg',
    tags: ['#Data_Science', '#Базы_данных'],
    status: 'Идёт набор',
    statusIcon: '/status-recruiting.svg',
    likes: 312,
    comments: 13,
    participants: 0,
    startDate: '05.11.2023',
    communityRating: 4.0,
    expertsRating: 4.3,
    team: [],
    technologies: ['Python', 'Pandas', 'D3.js', 'PostgreSQL'],
    screenshots: 5,
    reviews: [
      { author: 'Ольга Н.', text: 'Удобная платформа для работы с данными, но ещё сыровата.', rating: 4 },
    ],
    artifacts: [
      { name: 'Руководство пользователя', url: '#' },
    ],
  },
}

export function Project() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const project = id ? projects[id] : undefined

  if (!project) {
    return (
      <section className={styles.notFound}>
        <h1>Проект не найден</h1>
        <button onClick={() => navigate(-1)}>Назад</button>
      </section>
    )
  }

  return (
    <>
      <section className={styles.project} aria-label={project.title}>
        <div className={styles.projectGrid}>
          <div className={styles.leftTopBlock}>
            <div className={styles.projectCardBlock}>
              <img className={styles.projectImageLarge} src={project.image} alt={project.title} />
              <img className={styles.projectBorder} src="/ProjectBorder.svg" alt="" aria-hidden="true" />
            </div>
            <div className={styles.statsSection}>
              <div className={styles.statItem}>
                <img src="/likeActive.svg" alt="Likes" className={styles.statIcon} />
                <span>{project.likes ?? 0}</span>
              </div>
              <div className={styles.statItem}>
                <img src="/obsuzdenie.svg" alt="Comments" className={styles.statIcon} />
                <span>{project.comments ?? 0}</span>
              </div>
              <div className={styles.statItem}>
                <img src="/Subscribers.svg" alt="Participants" className={styles.statIcon} />
                <span>{project.participants ?? 0}</span>
              </div>
            </div>
          </div>

          <div className={styles.nameBlock}>
            <h1 className={styles.name}>{project.title}</h1>
          </div>

          <div className={styles.emptyRight} />

          <div className={styles.middleColumn}>

            <div className={styles.infoSection}>
              <h2 className={styles.sectionTitle}><span className={styles.sectionSlash}>//</span> Основная информация</h2>
              <div className={styles.infoList}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Дата начала:</span>
                  <span className={styles.dateBadge}>
                    <img src="/calendar.svg" alt="" aria-hidden="true" className={styles.dateIcon} />
                    {project.startDate || '—'}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Статус:</span>
                  {project.status ? (
                    <span className={styles.statusPill} data-status={project.status}>
                      {project.statusIcon && (
                        <img className={styles.statusIcon} src={project.statusIcon} alt="" aria-hidden="true" />
                      )}
                      {project.status}
                    </span>
                  ) : (
                    <span>—</span>
                  )}
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Оценка сообщества:</span>
                  <span className={styles.ratingBadge}>
                    <img src="/ministar.svg" alt="Star" className={styles.ratingStar} />
                    {project.communityRating ?? '—'}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Оценка знатоков:</span>
                  <span className={styles.ratingBadge}>
                    <img src="/ministar.svg" alt="Star" className={styles.ratingStar} />
                    {project.expertsRating ?? '—'}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.aboutSection}>
              <h2 className={styles.sectionTitle}><span className={styles.sectionSlash}>//</span> Описание проекта</h2>
              <div className={styles.aboutText}>
                {project.fullDescription.split('\n\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>

            <div className={styles.tagsSection}>
              <h2 className={styles.sectionTitle}><span className={styles.sectionSlash}>//</span> Теги проекта</h2>
              <div className={styles.tagsList}>
                {project.tags.map((tag) => (
                  <span key={tag} className={styles.tagItem}>{tag}</span>
                ))}
              </div>
            </div>

            {project.technologies && project.technologies.length > 0 && (
              <div className={styles.skillsSection}>
                <h2 className={styles.sectionTitle}><span className={styles.sectionSlash}>//</span> Стек технологий</h2>
                <div className={styles.skillsList}>
                  {project.technologies.map((tech) => (
                    <span key={tech} className={styles.skillTag}>{tech}</span>
                  ))}
                </div>
              </div>
            )}

            {project.team && project.team.length > 0 && (
              <div className={styles.teamSection}>
                <h2 className={styles.sectionTitle}><span className={styles.sectionSlash}>//</span> Команда проекта</h2>
                <div className={styles.teamList}>
                  {project.team.map((member, index) => (
                    <div key={index} className={styles.teamMember}>
                      <div className={styles.avatarWrapper}>
                        <img className={styles.memberAvatar} src={member.avatar || '/avatar.svg'} alt={member.name} />
                        <img className={styles.avatarStroke} src="/Vector 3.svg" alt="" aria-hidden="true" />
                      </div>
                      <div className={styles.memberInfo}>
                        <span className={styles.memberName}>{member.name}</span>
                        <div className={styles.memberRole}>
                          <span>{member.period}</span>
                          <span className={styles.memberRoleSeparator}>|</span>
                          <span>{member.role}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {project.screenshots && project.screenshots > 0 && (
              <div className={styles.screenshotsSection}>
                <h2 className={styles.sectionTitle}><span className={styles.sectionSlash}>//</span> Изображения</h2>
                <div className={styles.screenshotsGrid}>
                  {Array.from({ length: project.screenshots }).map((_, index) => (
                    <div key={index} className={styles.screenshotPlaceholder} />
                  ))}
                </div>
              </div>
            )}

            {project.reviews && project.reviews.length > 0 && (
              <div className={styles.reviewsSection}>
                <h2 className={styles.sectionTitle}><span className={styles.sectionSlash}>//</span> Отзывы</h2>
                <div className={styles.reviewsList}>
                  {project.reviews.map((review, index) => (
                    <div key={index} className={styles.reviewCard}>
                      <span className={styles.reviewAuthor}>{review.author}</span>
                      <div className={styles.reviewMiddle}>
                        <span className={styles.reviewRecommend}>{review.rating !== undefined && review.rating >= 3 ? 'Рекомендую' : 'Не рекомендую'}</span>
                        <div className={styles.reviewRating}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <img
                              key={i}
                              src={i < (review.rating ?? 0) ? '/ministar-filled.svg' : '/ministar-black.svg'}
                              alt="Star"
                              className={styles.reviewStar}
                            />
                          ))}
                        </div>
                      </div>
                      <p className={styles.reviewText}>{review.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {project.artifacts && project.artifacts.length > 0 && (
              <div className={styles.artifactsSection}>
                <h2 className={styles.sectionTitle}><span className={styles.sectionSlash}>//</span> Артефакты</h2>
                <div className={styles.artifactsList}>
                  {project.artifacts.map((artifact, index) => (
                    <div key={index} className={styles.artifactItem}>
                      <span>{artifact.name}</span>
                      <a href={artifact.url} className={styles.downloadButton} aria-label={`Скачать ${artifact.name}`}>
                        <img src="/download.svg" alt="" aria-hidden="true" className={styles.downloadIcon} />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className={styles.rightColumn}>
            <div className={styles.linksSection}>
              <h2 className={styles.sectionTitle}><span className={styles.sectionSlash}>//</span> Ссылки</h2>
              <div className={styles.linksList}>
                <a href="#" className={styles.linkItem}>Github проекта</a>
                <a href="#" className={styles.linkItem}>Демо</a>
                <a href="#" className={styles.linkItem}>Документация</a>
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
