import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { PROJECT_SUMMARIES } from '../data/projects'
import styles from './Projects.module.css'

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
        {PROJECT_SUMMARIES.map((project) => (
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

      <Link to="/projects" className={styles.viewAll}>
        <div className={styles.viewAllContent}>
          <h2 className={styles.viewAllTitle}>Посмотрите все наши проекты</h2>
          <img className={styles.viewAllArrow} src="/arrow-right.svg" alt="" aria-hidden="true" />
        </div>
      </Link>
    </section>
  )
}
