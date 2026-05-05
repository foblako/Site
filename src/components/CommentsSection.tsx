import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ApiError,
  createProjectComment,
  deleteProjectComment,
  fetchProjectComments,
} from '../api'
import { useAuth } from '../auth/useAuth'
import type { Comment } from '../types'
import styles from './CommentsSection.module.css'

type CommentsSectionProps = {
  projectId: string
  /** Optional CSS-Modules class for the `<h2>` heading so the section can
   * inherit the host page's typography (project detail uses its own style). */
  headingClassName?: string
  headingSlashClassName?: string
}

function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function CommentsSection({
  projectId,
  headingClassName,
  headingSlashClassName,
}: CommentsSectionProps) {
  const { user, status } = useAuth()
  const isAuthenticated = status === 'authenticated'

  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  const [draft, setDraft] = useState('')
  const [posting, setPosting] = useState(false)
  const [postError, setPostError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setListError(null)
    fetchProjectComments(projectId, controller.signal)
      .then((data) => setComments(data))
      .catch((err) => {
        if (controller.signal.aborted) return
        setListError(
          err instanceof ApiError && err.status === 404
            ? 'Проект не найден.'
            : 'Не удалось загрузить комментарии.',
        )
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [projectId])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const trimmed = draft.trim()
    if (trimmed.length === 0 || posting) return
    setPosting(true)
    setPostError(null)
    try {
      const created = await createProjectComment(projectId, trimmed)
      setComments((prev) => [created, ...prev])
      setDraft('')
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setPostError('Сессия истекла — войдите заново.')
      } else if (err instanceof ApiError && err.status === 422) {
        setPostError('Комментарий не может быть пустым или длиннее 2000 символов.')
      } else {
        setPostError('Не удалось опубликовать комментарий.')
      }
    } finally {
      setPosting(false)
    }
  }

  const handleDelete = async (commentId: string) => {
    const previous = comments
    setComments((prev) => prev.filter((c) => c.id !== commentId))
    try {
      await deleteProjectComment(projectId, commentId)
    } catch {
      // Revert on any failure — simpler than tracking per-row error state.
      setComments(previous)
    }
  }

  const canDelete = (comment: Comment): boolean => {
    if (user === null) return false
    return comment.author.id === user.id || user.role === 'admin'
  }

  const renderHeading = () => (
    <h2 className={headingClassName}>
      <span className={headingSlashClassName}>//</span> Комментарии
      {!loading && comments.length > 0 ? ` (${comments.length})` : ''}
    </h2>
  )

  return (
    <div className={styles.section}>
      {renderHeading()}

      {isAuthenticated ? (
        <form className={styles.form} onSubmit={handleSubmit}>
          <textarea
            className={styles.textarea}
            placeholder="Оставьте комментарий…"
            value={draft}
            maxLength={2000}
            rows={3}
            onChange={(event) => setDraft(event.target.value)}
            disabled={posting}
          />
          <div className={styles.formBottom}>
            <span className={styles.counter}>{draft.trim().length}/2000</span>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={posting || draft.trim().length === 0}
            >
              {posting ? 'Отправка…' : 'Отправить'}
            </button>
          </div>
          {postError !== null && <p className={styles.error}>{postError}</p>}
        </form>
      ) : (
        <p className={styles.loginPrompt}>
          <Link to="/login" className={styles.loginLink}>
            Войдите
          </Link>
          , чтобы оставить комментарий.
        </p>
      )}

      {loading && <p className={styles.muted}>Загрузка комментариев…</p>}
      {listError !== null && <p className={styles.error}>{listError}</p>}
      {!loading && listError === null && comments.length === 0 && (
        <p className={styles.muted}>Пока никто не оставил комментарий.</p>
      )}

      <ul className={styles.list}>
        {comments.map((comment) => (
          <li key={comment.id} className={styles.item}>
            <div className={styles.itemHeader}>
              <span className={styles.author}>{comment.author.displayName}</span>
              <span className={styles.timestamp}>{formatDate(comment.createdAt)}</span>
              {canDelete(comment) && (
                <button
                  type="button"
                  className={styles.deleteButton}
                  onClick={() => handleDelete(comment.id)}
                  aria-label="Удалить комментарий"
                >
                  Удалить
                </button>
              )}
            </div>
            <p className={styles.body}>{comment.body}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
