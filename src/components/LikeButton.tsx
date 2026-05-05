import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError, toggleProjectLike } from '../api'
import { useAuth } from '../auth/useAuth'
import styles from './LikeButton.module.css'

type LikeButtonProps = {
  projectId: string
  likes: number
  likedByMe: boolean | null | undefined
  className?: string
  iconClassName?: string
}

/**
 * Heart-icon toggle. Reads its initial state from the project summary and
 * then owns it locally so the surrounding list does not need to refetch
 * after every click. Anonymous visitors are redirected to `/login`.
 */
export function LikeButton({
  projectId,
  likes,
  likedByMe,
  className,
  iconClassName,
}: LikeButtonProps) {
  const navigate = useNavigate()
  const { status } = useAuth()

  const [count, setCount] = useState(likes)
  const [liked, setLiked] = useState<boolean>(likedByMe ?? false)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    setCount(likes)
  }, [likes])
  useEffect(() => {
    setLiked(likedByMe ?? false)
  }, [likedByMe])

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = async (event) => {
    event.stopPropagation()
    if (status !== 'authenticated') {
      navigate('/login')
      return
    }
    if (pending) return

    // Optimistic flip — reverts on error.
    const prevLiked = liked
    const prevCount = count
    setLiked(!prevLiked)
    setCount(prevCount + (prevLiked ? -1 : 1))
    setPending(true)
    try {
      const response = await toggleProjectLike(projectId)
      setLiked(response.liked)
      setCount(response.likeCount)
    } catch (err) {
      setLiked(prevLiked)
      setCount(prevCount)
      if (err instanceof ApiError && err.status === 401) {
        navigate('/login')
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <button
      type="button"
      className={`${styles.likeButton} ${liked ? styles.liked : ''} ${className ?? ''}`}
      onClick={handleClick}
      aria-pressed={liked}
      aria-label={liked ? 'Убрать лайк' : 'Поставить лайк'}
      disabled={pending}
    >
      <img
        src="/likeActive.svg"
        alt=""
        aria-hidden="true"
        className={`${styles.icon} ${iconClassName ?? ''}`}
      />
      <span>{count}</span>
    </button>
  )
}
