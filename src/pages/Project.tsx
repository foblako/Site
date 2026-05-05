import { useNavigate, useParams } from 'react-router-dom'
import { ApiError, fetchProject, useApi } from '../api'
import { ApiStatus } from '../components/ApiStatus'
import { Footer } from '../components/Footer'
import { LikeButton } from '../components/LikeButton'
import styles from './Project.module.css'

export function Project() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: project, loading, error } = useApi(
    (signal) => {
      if (!id) {
        return Promise.reject(new ApiError(404, 'Проект не найден'))
      }
      return fetchProject(id, signal)
    },
    [id],
  )

  if (loading || error || !project) {
    return (
      <section className={styles.notFound}>
        <ApiStatus loading={loading} error={error} empty={!loading && !error} emptyMessage="Проект не найден" />
        {!loading && (
          <button onClick={() => navigate(-1)}>Назад</button>
        )}
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
                <LikeButton
                  projectId={project.id}
                  likes={project.likes}
                  likedByMe={project.likedByMe}
                  iconClassName={styles.statIcon}
                />
              </div>
              <div className={styles.statItem}>
                <img src="/obsuzdenie.svg" alt="Comments" className={styles.statIcon} />
                <span>{project.comments}</span>
              </div>
              <div className={styles.statItem}>
                <img src="/Subscribers.svg" alt="Participants" className={styles.statIcon} />
                <span>{project.participants}</span>
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
                    {project.startDate}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Статус:</span>
                  <span className={styles.statusPill} data-status={project.status}>
                    <img className={styles.statusIcon} src={project.statusIcon} alt="" aria-hidden="true" />
                    {project.status}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Оценка сообщества:</span>
                  <span className={styles.ratingBadge}>
                    <img src="/ministar.svg" alt="Star" className={styles.ratingStar} />
                    {project.communityRating}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Оценка знатоков:</span>
                  <span className={styles.ratingBadge}>
                    <img src="/ministar.svg" alt="Star" className={styles.ratingStar} />
                    {project.expertsRating}
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

            {project.technologies.length > 0 && (
              <div className={styles.skillsSection}>
                <h2 className={styles.sectionTitle}><span className={styles.sectionSlash}>//</span> Стек технологий</h2>
                <div className={styles.skillsList}>
                  {project.technologies.map((tech) => (
                    <span key={tech} className={styles.skillTag}>{tech}</span>
                  ))}
                </div>
              </div>
            )}

            {project.team.length > 0 && (
              <div className={styles.teamSection}>
                <h2 className={styles.sectionTitle}><span className={styles.sectionSlash}>//</span> Команда проекта</h2>
                <div className={styles.teamList}>
                  {project.team.map((member) => (
                    <div key={`${member.name}-${member.role}`} className={styles.teamMember}>
                      <div className={styles.avatarWrapper}>
                        <img className={styles.memberAvatar} src={member.avatar} alt={member.name} />
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

            {project.screenshots > 0 && (
              <div className={styles.screenshotsSection}>
                <h2 className={styles.sectionTitle}><span className={styles.sectionSlash}>//</span> Изображения</h2>
                <div className={styles.screenshotsGrid}>
                  {Array.from({ length: project.screenshots }).map((_, index) => (
                    <div key={index} className={styles.screenshotPlaceholder} />
                  ))}
                </div>
              </div>
            )}

            {project.reviews.length > 0 && (
              <div className={styles.reviewsSection}>
                <h2 className={styles.sectionTitle}><span className={styles.sectionSlash}>//</span> Отзывы</h2>
                <div className={styles.reviewsList}>
                  {project.reviews.map((review) => (
                    <div key={`${review.author}-${review.rating}`} className={styles.reviewCard}>
                      <span className={styles.reviewAuthor}>{review.author}</span>
                      <div className={styles.reviewMiddle}>
                        <span className={styles.reviewRecommend}>{review.rating >= 3 ? 'Рекомендую' : 'Не рекомендую'}</span>
                        <div className={styles.reviewRating}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <img
                              key={i}
                              src={i < review.rating ? '/ministar-filled.svg' : '/ministar-black.svg'}
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

            {project.artifacts.length > 0 && (
              <div className={styles.artifactsSection}>
                <h2 className={styles.sectionTitle}><span className={styles.sectionSlash}>//</span> Артефакты</h2>
                <div className={styles.artifactsList}>
                  {project.artifacts.map((artifact) => (
                    <div key={artifact.name} className={styles.artifactItem}>
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

      <Footer />
    </>
  )
}
