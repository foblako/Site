import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchProjects, useApi } from '../api'
import { ApiStatus } from '../components/ApiStatus'
import { Footer } from '../components/Footer'
import { PROJECT_TAGS } from '../constants/filters'
import styles from './Projects.module.css'

export function Projects() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const { data: projects, loading, error } = useApi((signal) => fetchProjects(signal), [])

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const filteredProjects = (projects ?? []).filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTags = selectedTags.length === 0 ||
                       selectedTags.some(tag => project.tags.includes(`#${tag}`))
    return matchesSearch && matchesTags
  })

  return (
    <>
      <section className={styles.vacancies} aria-label="Страница проектов">
        <div className={styles.content}>
          <div className={styles.projectsHeader}>
            <h2 className={styles.projectsLead}>Представляем вам</h2>
            <div className={styles.highlightWrapper}>
              <h1 className={styles.highlightTitle}>
                <span className={styles.underlinedWord}>
                  лучшие
                  <img className={styles.underlineSvg} src="/Vector 1.svg" alt="" aria-hidden="true" />
                </span>{' '}проекты
              </h1>
            </div>
            <h2 className={styles.projectsSubhead}>базовой кафедры №536</h2>
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
              {PROJECT_TAGS.map(tag => (
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

          <ApiStatus
            loading={loading}
            error={error}
            empty={!loading && !error && filteredProjects.length === 0}
            emptyMessage="По заданным фильтрам ничего не найдено"
          />

          <div className={styles.projectsGrid}>
            {filteredProjects.map((project) => (
              <article key={project.id} className={styles.projectCard}>
                <div className={styles.cardImageWrapper} onClick={() => navigate(`/project/${project.id}`)} style={{ cursor: 'pointer' }}>
                  <img
                    className={styles.cardImage}
                    src={project.image}
                    alt={project.title}
                    loading="lazy"
                  />
                  <span className={styles.statusPill} data-status={project.status}>
                    <img className={styles.statusIcon} src={project.statusIcon} alt="" aria-hidden="true" />
                    {project.status}
                  </span>
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
                        {project.likes}
                      </span>
                      <span className={styles.statItem}>
                        <img
                          src="/obsuzdenie.svg"
                          alt="Comments"
                          className={styles.statIcon}
                        />
                        {project.comments}
                      </span>
                      <span className={styles.statItem}>
                        <img
                          src="/Subscribers.svg"
                          alt="Participants"
                          className={styles.statIcon}
                        />
                        {project.participants}
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

      <Footer />
    </>
  )
}
