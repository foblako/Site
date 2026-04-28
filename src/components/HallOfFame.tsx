import { useState } from 'react'
import styles from './HallOfFame.module.css'

const stars = [
  { id: 1, name: 'Иван Петров', role: 'Frontend', avatar: '/avatar.svg' },
  { id: 2, name: 'Мария Иванова', role: 'Дизайнер', avatar: '/avatar.svg' },
  { id: 3, name: 'Алексей Смирнов', role: 'Backend', avatar: '/avatar.svg' },
  { id: 4, name: 'Елена Козлова', role: 'DevOps', avatar: '/avatar.svg' },
  { id: 5, name: 'Дмитрий Морозов', role: 'Mobile', avatar: '/avatar.svg' },
]

function mod(n: number, m: number) {
  return ((n % m) + m) % m
}

export function HallOfFame() {
  const [activeIndex, setActiveIndex] = useState(0)

  const scrollLeft = () => {
    setActiveIndex(prev => mod(prev - 1, stars.length))
  }

  const scrollRight = () => {
    setActiveIndex(prev => mod(prev + 1, stars.length))
  }

  const getOffset = (starIndex: number): number => {
    let diff = starIndex - activeIndex
    const n = stars.length
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
            onClick={scrollLeft}
            aria-label="Предыдущий"
          >
            ←
          </button>

          <div className={styles.starsWrapper}>
            <div className={styles.starsContainer}>
              {stars.map((star, index) => {
                const offset = getOffset(index)
                const isCenter = offset === 0
                const absOffset = Math.abs(offset)
                const scale = isCenter ? 1 : absOffset === 1 ? 0.65 : 0.45

                return (
                  <div
                    key={star.id}
                    className={styles.starItem}
                    style={{
                      transform: `translateX(calc(-50% + ${offset * 16}rem)) scale(${scale})`,
                      opacity: isCenter ? 1 : absOffset === 1 ? 0.6 : 0.3,
                      filter: absOffset >= 2 ? 'blur(4px)' : 'none',
                      zIndex: isCenter ? 3 : absOffset === 1 ? 2 : 1,
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
