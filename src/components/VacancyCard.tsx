import { useState } from 'react'
import styles from './VacancyCard.module.css'

type VacancyCardProps = {
  title: string
  description: string
  tags: string[]
  responsibilities: string
  responsibilitiesList: string[]
  index: number
  total: number
}

export function VacancyCard({
  title,
  description,
  tags,
  responsibilities,
  responsibilitiesList,
  index,
  total,
}: VacancyCardProps) {
  const [isApplied, setIsApplied] = useState(false)

  const handleApply = () => {
    setIsApplied(!isApplied)
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
        </div>

        <div className={styles.responsibilitiesBlock}>
          <h4 className={styles.responsibilitiesTitle}>Обязанности:</h4>
          <p className={styles.responsibilitiesText}>{responsibilities}</p>
          <ul className={styles.responsibilitiesList}>
            {responsibilitiesList.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>

        <button
          className={`${styles.applyButton} ${isApplied ? styles.applied : ''}`}
          onClick={handleApply}
          type="button"
        >
          {isApplied && (
            <img className={styles.checkmark} src="/Galka.svg" alt="" aria-hidden="true" />
          )}
          {isApplied ? 'Вы откликнулись' : 'Откликнуться'}
        </button>
      </div>
    </article>
  )
}
