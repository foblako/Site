import { DEPARTMENT_CONTACTS } from '../data/contacts'
import styles from './Footer.module.css'

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <h2 className={styles.footerTitle}>Контакты</h2>
        <p className={styles.footerInfo}>
          {DEPARTMENT_CONTACTS.phone}<br />
          {DEPARTMENT_CONTACTS.email}
        </p>
      </div>
    </footer>
  )
}
