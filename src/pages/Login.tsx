import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../api'
import { Footer } from '../components/Footer'
import { useAuth } from '../auth/useAuth'
import styles from './Login.module.css'

type Mode = 'login' | 'register'

export function Login() {
  const navigate = useNavigate()
  const { user, status, login, register, logout } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const resetFeedback = () => {
    setErrorMessage(null)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    resetFeedback()
    setSubmitting(true)
    try {
      if (mode === 'login') {
        await login(email.trim(), password)
        navigate('/portfolio')
      } else {
        await register(email.trim(), password, displayName.trim())
        // Auto-login after successful registration so the user doesn't have
        // to type the password again.
        await login(email.trim(), password)
        navigate('/portfolio')
      }
    } catch (err) {
      setErrorMessage(describeError(err, mode))
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'authenticated' && user !== null) {
    return (
      <>
        <section className={styles.page} aria-label="Аккаунт">
          <div className={styles.card}>
            <h1 className={styles.title}>Вы уже вошли</h1>
            <div className={styles.accountBlock}>
              <p className={styles.accountEmail}>{user.displayName}</p>
              <p className={styles.hint}>{user.email}</p>
            </div>
            <Link to="/portfolio" className={styles.submit} style={{ textAlign: 'center', textDecoration: 'none' }}>
              В портфолио
            </Link>
            <button
              type="button"
              className={styles.tab}
              onClick={() => {
                logout()
                setMode('login')
              }}
            >
              Выйти
            </button>
          </div>
        </section>
        <Footer />
      </>
    )
  }

  return (
    <>
      <section className={styles.page} aria-label={mode === 'login' ? 'Вход' : 'Регистрация'}>
        <div className={styles.card}>
          <h1 className={styles.title}>
            {mode === 'login' ? 'Вход в портфолио' : 'Регистрация'}
          </h1>
          <p className={styles.subtitle}>
            {mode === 'login'
              ? 'Войдите, чтобы ставить лайки, писать отзывы и откликаться на вакансии.'
              : 'Создайте аккаунт, чтобы участвовать в жизни кафедры.'}
          </p>

          <div className={styles.tabs} role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              className={`${styles.tab} ${mode === 'login' ? styles.tabActive : ''}`}
              onClick={() => {
                setMode('login')
                resetFeedback()
              }}
            >
              Вход
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'register'}
              className={`${styles.tab} ${mode === 'register' ? styles.tabActive : ''}`}
              onClick={() => {
                setMode('register')
                resetFeedback()
              }}
            >
              Регистрация
            </button>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div className={styles.field}>
                <label className={styles.label} htmlFor="login-name">
                  Имя для отображения
                </label>
                <input
                  id="login-name"
                  className={styles.input}
                  type="text"
                  autoComplete="name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  minLength={1}
                  maxLength={128}
                />
              </div>
            )}

            <div className={styles.field}>
              <label className={styles.label} htmlFor="login-email">
                Email
              </label>
              <input
                id="login-email"
                className={styles.input}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="login-password">
                Пароль
              </label>
              <input
                id="login-password"
                className={styles.input}
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={mode === 'register' ? 8 : 1}
                maxLength={128}
              />
              {mode === 'register' && (
                <p className={styles.hint}>Минимум 8 символов.</p>
              )}
            </div>

            {errorMessage !== null && (
              <p className={styles.error} role="alert">
                {errorMessage}
              </p>
            )}

            <button type="submit" className={styles.submit} disabled={submitting}>
              {submitting
                ? 'Подождите…'
                : mode === 'login'
                  ? 'Войти'
                  : 'Зарегистрироваться и войти'}
            </button>
          </form>
        </div>
      </section>
      <Footer />
    </>
  )
}

function describeError(err: unknown, mode: Mode): string {
  if (err instanceof ApiError) {
    if (err.status === 401) {
      return 'Неверный email или пароль.'
    }
    if (err.status === 409) {
      return 'Аккаунт с таким email уже существует. Войдите вместо регистрации.'
    }
    if (err.status === 422) {
      return 'Проверьте поля формы: возможно, email некорректен или пароль слишком короткий.'
    }
    return err.message
  }
  return mode === 'login'
    ? 'Не удалось войти. Попробуйте ещё раз.'
    : 'Не удалось зарегистрироваться. Попробуйте ещё раз.'
}
