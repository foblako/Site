/**
 * Small inline status banner used by every screen that fetches from the API.
 *
 * Shows a Russian-language message during loading or when a request fails.
 * Styling is intentionally minimal — once we wire up real skeletons we can
 * replace this in one place.
 */

import styles from './ApiStatus.module.css'

type Props = {
  loading?: boolean
  error?: Error
  empty?: boolean
  emptyMessage?: string
}

export function ApiStatus({
  loading,
  error,
  empty,
  emptyMessage = 'Пока ничего нет',
}: Props) {
  if (loading) {
    return <p className={styles.status}>Загрузка…</p>
  }
  if (error) {
    return (
      <p className={`${styles.status} ${styles.error}`}>
        Не удалось получить данные с сервера: {error.message}
      </p>
    )
  }
  if (empty) {
    return <p className={styles.status}>{emptyMessage}</p>
  }
  return null
}
