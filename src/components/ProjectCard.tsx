import { useState } from 'react'
import styles from './ProjectCard.module.css'

type ProjectCardProps = {
  title: string
  description: string
  tags: string[]
  status: string
  statusIcon: string
  likes: number
  comments: number
  participants: number
  index: number
}

export function ProjectCard({
  title,
  description,
  tags,
  status,
  statusIcon,
  likes,
  comments,
  participants,
  index,
}: ProjectCardProps) {
  const [isFavorite, setIsFavorite] = useState(false)

  const handleFavorite = () => {
    setIsFavorite(!isFavorite)
  }

  const isEven = (index + 1) % 2 === 0

  return (
    <article className={`${styles.vacancy} ${isEven ? styles.vacancyEven : ''}`}>
      <div className={styles.vacancyInner}>
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.description}>{description}</p>

          <div className={styles.tags}>
            {tags.map((tag) => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))}
          </div>

          <div className={styles.stats}>
            <div className={styles.statItem}>
              <img src="/likeActive.svg" alt="Likes" className={styles.statIcon} />
              <span>{likes}</span>
            </div>
            <div className={styles.statItem}>
              <img src="/obsuzdenie.svg" alt="Comments" className={styles.statIcon} />
              <span>{comments}</span>
            </div>
            <div className={styles.statItem}>
              <img src="/Subscribers.svg" alt="Participants" className={styles.statIcon} />
              <span>{participants}</span>
            </div>
          </div>
        </div>

        <div className={styles.responsibilitiesBlock}>
          <div className={styles.responsibilitiesTitle}>Статус проекта:</div>
          <div className={styles.statusPill}>
            <img src={statusIcon} alt="" aria-hidden="true" />
            {status}
          </div>
        </div>

        <button
          className={`${styles.applyButton} ${isFavorite ? styles.applied : ''}`}
          onClick={handleFavorite}
          type="button"
        >
          {isFavorite && (
            <img className={styles.checkmark} src="/Galka.svg" alt="" aria-hidden="true" />
          )}
          {isFavorite ? 'В избранном' : 'В избранное'}
        </button>
      </div>
    </article>
  )
}