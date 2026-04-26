import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import styles from './Header.module.css'

type HeaderProps = {
  showPortfolioTitle?: boolean
}

export function Header({ showPortfolioTitle = false }: HeaderProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      setIsVisible(currentScrollY < lastScrollY || currentScrollY < 100)
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  return (
    <header className={`${styles.header} ${!isVisible ? styles.headerHidden : ''}`}>
      <div className={styles.headerLeft}>
        {showPortfolioTitle && (
          <Link to="/" className={styles.portfolioTitle}>ПОРТФОЛИО</Link>
        )}
      </div>
      <nav className={styles.nav} aria-label="Main navigation">
        <a href="#" className={styles.navLink}>
          <span>Проекты</span>
        </a>
        <a href="#" className={styles.navLink}>
          <span>
            Команды
            <img className={styles.icon} src="/icon.svg" alt="" aria-hidden="true" />
          </span>
        </a>
        <Link to="/vacancies" className={styles.navLink}>
          <span>
            Вакансии
            <img className={styles.icon} src="/icon.svg" alt="" aria-hidden="true" />
          </span>
        </Link>
        <button type="button" className={styles.actionButton} aria-label="Notifications">
          <img src="/Vector.svg" alt="Notifications" />
        </button>

        <button type="button" className={styles.actionButton} aria-label="Messages">
          <img src="/Vector (1).svg" alt="Messages" />
        </button>

        <Link to="/portfolio" className={styles.avatarWrapper} aria-label="Profile">
          <img className={styles.avatar} src="/avatar.svg" alt="User avatar" />
          <img className={styles.avatarStroke} src="/Vector 3.svg" alt="" aria-hidden="true" />
        </Link>
      </nav>
    </header>
  )
}
