import { VACANCIES } from '../data/vacancies'
import { VacancyCard } from './VacancyCard'
import styles from './Vacancies.module.css'

export function Vacancies() {
  return (
    <section className={styles.vacancies} aria-label="Открытые вакансии">
      <div className={styles.divider} />

      <div className={styles.content}>
        <div className={styles.textBlock}>
          <h2 className={styles.titleTop}>Наши открытые</h2>
          <h2 className={styles.titleHighlighted}>вакансии в команды</h2>
          <h2 className={styles.titleBottom}>лучших разработчиков</h2>
        </div>

        <div className={styles.vacanciesGrid}>
          {VACANCIES.map((vacancy, index) => (
            <VacancyCard key={vacancy.id} {...vacancy} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}
