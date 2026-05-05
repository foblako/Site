import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ApiError,
  applyToVacancy,
  withdrawVacancyApplication,
} from '../api'
import { useAuth } from '../auth/useAuth'
import styles from './VacancyCard.module.css'

type VacancyCardProps = {
  id: number
  title: string
  description: string
  tags: string[]
  responsibilities: string
  responsibilitiesList: string[]
  index: number
  appliedByMe?: boolean | null
}

export function VacancyCard({
  id,
  title,
  description,
  tags,
  responsibilities,
  responsibilitiesList,
  index,
  appliedByMe,
}: VacancyCardProps) {
  const navigate = useNavigate()
  const { status } = useAuth()
  const isAuthenticated = status === 'authenticated'

  const [isApplied, setIsApplied] = useState<boolean>(appliedByMe ?? false)
  useEffect(() => {
    setIsApplied(appliedByMe ?? false)
  }, [appliedByMe])

  const [modalOpen, setModalOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (modalOpen) {
      // Give the browser a tick before focusing — otherwise the opening
      // click eats the focus event on some browsers.
      setTimeout(() => textareaRef.current?.focus(), 0)
    }
  }, [modalOpen])

  const handleApplyClick = () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    if (isApplied) {
      // Toggle off — withdraw on click without a modal; the server returns
      // 204 and we flip the local state.
      void (async () => {
        try {
          await withdrawVacancyApplication(id)
          setIsApplied(false)
        } catch {
          // Leave UI as-is and let the user try again.
        }
      })()
      return
    }
    setMessage('')
    setSubmitError(null)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setSubmitError(null)
  }

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()
    const trimmed = message.trim()
    if (trimmed.length === 0 || submitting) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      await applyToVacancy(id, trimmed)
      setIsApplied(true)
      setModalOpen(false)
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setSubmitError('Вы уже откликались на эту вакансию.')
        setIsApplied(true)
      } else if (err instanceof ApiError && err.status === 401) {
        navigate('/login')
      } else if (err instanceof ApiError && err.status === 422) {
        setSubmitError('Сообщение не может быть пустым или длиннее 4000 символов.')
      } else {
        setSubmitError('Не удалось отправить отклик. Попробуйте ещё раз.')
      }
    } finally {
      setSubmitting(false)
    }
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
          onClick={handleApplyClick}
          type="button"
        >
          {isApplied && (
            <img className={styles.checkmark} src="/Galka.svg" alt="" aria-hidden="true" />
          )}
          {isApplied ? 'Вы откликнулись' : 'Откликнуться'}
        </button>
      </div>

      {modalOpen && (
        <div
          className={styles.modalBackdrop}
          onClick={(event) => {
            if (event.target === event.currentTarget) closeModal()
          }}
          role="presentation"
        >
          <form className={styles.modal} onSubmit={handleSubmit}>
            <h3 className={styles.modalTitle}>Отклик на «{title}»</h3>
            <p className={styles.modalSubtitle}>
              Расскажите коротко о себе — что умеете и почему хотите сюда. Работодатель увидит это сообщение вместе с вашим профилем.
            </p>
            <textarea
              ref={textareaRef}
              className={styles.modalTextarea}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Ваше сообщение…"
              maxLength={4000}
              rows={6}
              disabled={submitting}
            />
            <div className={styles.modalFooter}>
              <span className={styles.modalCounter}>{message.trim().length}/4000</span>
              <div className={styles.modalButtons}>
                <button
                  type="button"
                  className={styles.modalCancel}
                  onClick={closeModal}
                  disabled={submitting}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className={styles.modalSubmit}
                  disabled={submitting || message.trim().length === 0}
                >
                  {submitting ? 'Отправка…' : 'Отправить'}
                </button>
              </div>
            </div>
            {submitError !== null && <p className={styles.modalError}>{submitError}</p>}
          </form>
        </div>
      )}
    </article>
  )
}
