import { useState } from 'react'
import styles from './HallOfFame.module.css'

const stars = [
  { id: 1, name: 'Иван Петров', role: 'Frontend', avatar: '/avatar.svg' },
  { id: 2, name: 'Мария Иванова', role: 'Дизайнер', avatar: '/avatar.svg' },
  { id: 3, name: 'Алексей Смирнов', role: 'Backend', avatar: '/avatar.svg' },
  { id: 4, name: 'Елена Козлова', role: 'DevOps', avatar: '/avatar.svg' },
  { id: 5, name: 'Дмитрий Морозов', role: 'Mobile', avatar: '/avatar.svg' },
]

export function HallOfFame() {
  const [activeIndex, setActiveIndex] = useState(0)

  const scrollLeft = () => {
    setActiveIndex(prev => (prev === 0 ? stars.length - 1 : prev - 1))
  }

  const scrollRight = () => {
    setActiveIndex(prev => (prev === stars.length - 1 ? 0 : prev + 1))
  }

  // Получаем 5 звёзд для отображения, начиная с activeIndex
  const visibleStars = Array.from({ length: 5 }, (_, i) => 
    stars[(activeIndex + i) % stars.length]
  )

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
              {visibleStars.map((star, index) => {
                const isCenter = index === 2
                const isLeft = index === 1
                const isRight = index === 3
                const isEdge = index === 0 || index === 4

                return (
                  <div
                    key={`${star.id}-${activeIndex}-${index}`}
                    className={`${styles.star} ${
                      isCenter ? styles.starBig :
                      isLeft || isRight ? styles.starSmall :
                      styles.starBlur
                    } ${isEdge ? styles.starEdge : ''}`}
                  >
                    <img src="/BigStar.svg" alt="" className={styles.starImage} />
                    {isCenter && (
                      <img src="/CenterStarShine.svg" alt="" className={styles.starShine} aria-hidden="true" />
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
