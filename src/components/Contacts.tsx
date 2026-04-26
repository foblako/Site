import { useNavigate } from 'react-router-dom'
import styles from './Contacts.module.css'

export function Contacts() {
  const navigate = useNavigate()

  return (
    <section className={styles.contacts} aria-label="Контакты">
      <div 
        className={styles.moreVacancies}
        onClick={() => navigate('/vacancies')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            navigate('/vacancies')
          }
        }}
      >
        <div className={styles.moreVacanciesContent}>
          <p className={styles.moreVacanciesText}>Больше вакансий тут</p>
          <img className={styles.moreVacanciesArrow} src="/arrow-right.svg" alt="" aria-hidden="true" />
        </div>
      </div>
      <div className={styles.contactsInfo}>
        <h2 className={styles.title}>Контакты</h2>
        <p className={styles.info}>
          +7 (499) 215-65-65 доб. 2404<br />
          vega@mirea.ru
        </p>
      </div>
    </section>
  )
}
