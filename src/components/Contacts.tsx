import { Link } from 'react-router-dom'
import styles from './Contacts.module.css'

export function Contacts() {
  return (
    <section className={styles.contacts} aria-label="Контакты">
      <Link to="/vacancies" className={styles.moreVacancies}>
        <div className={styles.moreVacanciesContent}>
          <p className={styles.moreVacanciesText}>Больше вакансий тут</p>
          <img className={styles.moreVacanciesArrow} src="/arrow-right.svg" alt="" aria-hidden="true" />
        </div>
      </Link>
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
