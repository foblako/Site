import { useState, useEffect } from 'react'
import { STARS } from '../data/hallOfFame'
import styles from './HallOfFame.module.css'

function mod(n: number, m: number) {
  return ((n % m) + m) % m
}

const EASING = 'cubic-bezier(0.4, 0, 0.2, 1)'
const DURATION = '0.5s'

export function HallOfFame() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [skipIds, setSkipIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (skipIds.size > 0) {
      const id = setTimeout(() => setSkipIds(new Set()), 50)
      return () => clearTimeout(id)
    }
  }, [skipIds])

  const slide = (direction: number) => {
    const wrappingIdx = mod(activeIndex - direction * 2, STARS.length)
    setSkipIds(new Set([STARS[wrappingIdx].id]))
    setActiveIndex(prev => mod(prev + direction, STARS.length))
  }

  const getOffset = (starIndex: number): number => {
    let diff = starIndex - activeIndex
    const n = STARS.length
    if (diff > n / 2) diff -= n
    if (diff < -n / 2) diff += n
    return diff
  }

  return (
    <section className={styles.hallOfFame} aria-label="Аллея Славы">
      <div className={styles.content}>
        <div className={styles.textBlock}>
          <h2 className={styles.title}>Наши звёзды с</h2>
          <h2 className={styles.highlightedTitle}>
            <span>Аллеи Славы</span>
            <img className={styles.starIcon} src="/star.svg" alt="" aria-hidden="true" />
          </h2>
          <h2 className={styles.subtitle}>сияют ярче, чем в Голливуде</h2>
        </div>

        <div className={styles.slider}>
          <button
            className={styles.sliderArrowLeft}
            onClick={() => slide(-1)}
            aria-label="Предыдущий"
          >
            ←
          </button>

          <div className={styles.starsWrapper}>
            <div className={styles.starsContainer}>
              {STARS.map((star, index) => {
                const offset = getOffset(index)
                const isCenter = offset === 0
                const absOffset = Math.abs(offset)
                const scale = isCenter ? 1 : absOffset === 1 ? 0.65 : 0.45
                const skip = skipIds.has(star.id)
                const normalOpacity = isCenter ? 1 : absOffset === 1 ? 0.6 : 0.3
                const transition = skip
                  ? 'none'
                  : `transform ${DURATION} ${EASING}, opacity ${DURATION} ${EASING}, filter ${DURATION} ${EASING}`

                return (
                  <div
                    key={star.id}
                    className={styles.starItem}
                    style={{
                      transform: `translateX(calc(-50% + ${offset * 16}rem)) scale(${scale})`,
                      opacity: skip ? 0 : normalOpacity,
                      filter: absOffset >= 2 ? 'blur(4px)' : 'none',
                      zIndex: isCenter ? 3 : absOffset === 1 ? 2 : 1,
                      transition,
                    }}
                  >
                    <img src="/BigStar.svg" alt="" className={styles.starImage} />
                    <img
                      src="/CenterStarShine.svg"
                      alt=""
                      className={styles.starShine}
                      style={{ opacity: isCenter ? 1 : 0 }}
                      aria-hidden="true"
                    />
                    <div className={styles.avatarWrapper}>
                      <img src={star.avatar} alt={star.name} className={styles.starAvatar} />
                      <img className={styles.avatarStroke} src="/Vector 3.svg" alt="" aria-hidden="true" />
                    </div>
                    <div
                      className={styles.starLabel}
                      style={{ opacity: isCenter ? 1 : 0 }}
                    >
                      <span className={styles.starLabelTop}>Лучший</span>
                      <span className={styles.starLabelBottom}>{star.role}</span>
                      <span className={styles.starLabelSmall}>Месяца</span>
                      <span className={styles.starName}>{star.name}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <button
            className={styles.sliderArrowRight}
            onClick={() => slide(1)}
            aria-label="Следующий"
          >
            →
          </button>
        </div>
      </div>
    </section>
  )
}
