import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import styles from './Header.module.css'

const API_BASE = (
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000'
).replace(/\/$/, '')

type HeaderProps = {
  showPortfolioTitle?: boolean
}

export function Header({ showPortfolioTitle = false }: HeaderProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const { user, status, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      setIsVisible(currentScrollY < lastScrollY || currentScrollY < 100)
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  useEffect(() => {
    if (!menuOpen) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current === null) return
      if (!menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  const handleLogout = () => {
    logout()
    setMenuOpen(false)
    navigate('/')
  }

  return (
    <header className={`${styles.header} ${!isVisible ? styles.headerHidden : ''}`}>
      <div className={styles.headerLeft}>
        {showPortfolioTitle && (
          <Link to="/" className={styles.portfolioTitle}>ПОРТФОЛИО</Link>
        )}
      </div>
      <nav className={styles.nav} aria-label="Main navigation">
        <Link to="/projects" className={styles.navLink}>
          <span>Проекты</span>
        </Link>
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

        {status === 'authenticated' && user !== null ? (
          <div className={styles.authMenu} ref={menuRef}>
            <button
              type="button"
              className={styles.avatarWrapper}
              aria-label={`Профиль ${user.displayName}`}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <img
                className={styles.avatar}
                src={user.avatarUrl !== null ? `${API_BASE}${user.avatarUrl}` : '/avatar.svg'}
                alt="User avatar"
              />
              <img className={styles.avatarStroke} src="/Vector 3.svg" alt="" aria-hidden="true" />
            </button>
            {menuOpen && (
              <div className={styles.authDropdown} role="menu">
                <div className={styles.authMenuHeader}>
                  <strong>{user.displayName}</strong>
                  <span>{user.email}</span>
                </div>
                <Link
                  to="/portfolio"
                  className={styles.authMenuItem}
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                >
                  Моё портфолио
                </Link>
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className={styles.authMenuItem}
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                  >
                    Админка
                  </Link>
                )}
                <button
                  type="button"
                  className={styles.authMenuItem}
                  role="menuitem"
                  onClick={handleLogout}
                >
                  Выйти
                </button>
              </div>
            )}
          </div>
        ) : status === 'loading' ? (
          <span className={styles.authLoading} aria-hidden="true" />
        ) : (
          <Link to="/login" className={styles.loginButton}>
            Войти
          </Link>
        )}
      </nav>
    </header>
  )
}
