import { useState, useMemo, useRef } from 'react'
import { STARS } from '../data/hallOfFame'
import styles from './HallOfFame.module.css'

export function HallOfFame() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const gap = 6 * window.devicePixelRatio

  const scrollLeft = () => {
    setActiveIndex(prev => (prev === 0 ? STARS.length - 1 : prev - 1))
  }

  const scrollRight = () => {
    setActiveIndex(prev => (prev === STARS.length - 1 ? 0 : prev + 1))
  }

  const visibleStars = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) =>
      STARS[(activeIndex + i) % STARS.length]
    )
  }, [activeIndex])

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
            onClick={scrollLeft}
            aria-label="Предыдущий"
          >
            ←
          </button>

          <div className={styles.starsWrapper}>
            <div
              ref={containerRef}
              className={styles.starsContainer}
              style={{
                transform: `translateX(-${activeIndex * gap}px)`,
                transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              {visibleStars.map((star, index) => {
                const displayIndex = (activeIndex + index) % STARS.length
                const isCenter = displayIndex === 0
                const isLeft = displayIndex === 4
                const isRight = displayIndex === 1
                const isEdge = displayIndex === 3 || displayIndex === 2

                return (
                  <div
                    key={`${star.id}-${displayIndex}`}
                    className={`${styles.star} ${
                      isCenter ? styles.starBig :
                      isLeft || isRight ? styles.starSmall :
                      styles.starBlur
                    } ${isEdge ? styles.starEdge : ''}`}
                  >
                    <img src="/BigStar.svg" alt="" className={styles.starImage} />
                    {isCenter && (
                      <img
                        src="/CenterStarShine.svg"
                        alt=""
                        className={styles.starShine}
                        aria-hidden="true"
                      />
                    )}
                    <div className={styles.avatarWrapper}>
                      <img src={star.avatar} alt={star.name} className={styles.starAvatar} />
                      <img className={styles.avatarStroke} src="/Vector 3.svg" alt="" aria-hidden="true" />
                    </div>
                    {isCenter && (
                      <div className={styles.starLabel}>
                        <span className={styles.starLabelTop}>Лучший</span>
                        <span className={styles.starLabelBottom}>{star.role}</span>
                        <span className={styles.starLabelSmall}>Месяца</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <button
            className={styles.sliderArrowRight}
            onClick={scrollRight}
            aria-label="Следующий"
          >
            →
          </button>
        </div>
      </div>
    </section>
  )
}
