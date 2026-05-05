import { fetchDepartmentContacts, useApi } from '../api'
import styles from './Footer.module.css'

export function Footer() {
  const { data: contacts } = useApi((signal) => fetchDepartmentContacts(signal), [])

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <h2 className={styles.footerTitle}>Контакты</h2>
        {contacts && (
          <p className={styles.footerInfo}>
            {contacts.phone}<br />
            {contacts.email}
          </p>
        )}
      </div>
    </footer>
  )
}
