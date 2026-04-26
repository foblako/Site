import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import styles from './Hero.module.css'

gsap.registerPlugin(ScrollToPlugin)

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null)

  const scrollToProjects = () => {
    const projects = document.getElementById('projects')
    if (!projects) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    gsap.to(window, {
      duration: prefersReducedMotion ? 0 : 0.9,
      scrollTo: { y: projects, autoKill: false },
      ease: 'power2.inOut',
      overwrite: true,
    })
  }

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    let isAnimating = false
    let accumulatedDelta = 0
    let resetTimer: number | undefined
    const THRESHOLD = 30 // минимальная суммарная дельта для срабатывания (гасит случайные касания тачпада)
    const ANIMATION_MS = 900

    const handleWheel = (e: WheelEvent) => {
      // Работаем только пока hero реально на экране
      const rect = section.getBoundingClientRect()
      const heroVisible = rect.bottom > window.innerHeight * 0.5
      if (!heroVisible) return

      // Во время анимации глотаем все wheel-события, чтобы не дёргалось
      if (isAnimating) {
        e.preventDefault()
        return
      }

      // Вверх — не вмешиваемся, обычная прокрутка
      if (e.deltaY <= 0) {
        accumulatedDelta = 0
        return
      }

      accumulatedDelta += e.deltaY

      // Сбрасываем накопитель, если пользователь перестал крутить
      if (resetTimer) window.clearTimeout(resetTimer)
      resetTimer = window.setTimeout(() => {
        accumulatedDelta = 0
      }, 200)

      if (accumulatedDelta < THRESHOLD) return

      e.preventDefault()
      isAnimating = true
      accumulatedDelta = 0

      scrollToProjects()

      window.setTimeout(() => {
        isAnimating = false
      }, ANIMATION_MS)
    }

    section.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      section.removeEventListener('wheel', handleWheel)
      if (resetTimer) window.clearTimeout(resetTimer)
    }
  }, [])

  return (
    <section ref={sectionRef} className={styles.heroRoot} aria-label="Hero section">
      <div className={styles.backgroundText} aria-hidden="true">
        БК 536
      </div>
      <div className={styles.content}>
        <div className={styles.titleWrapper}>
          <h1 className={styles.title}>ПОРТФОЛИО</h1>
          <div className={styles.corners}>
            <span className={`${styles.corner} ${styles.cornerTopLeft}`} />
            <span className={`${styles.corner} ${styles.cornerTopRight}`} />
            <span className={`${styles.corner} ${styles.cornerBottomLeft}`} />
            <span className={`${styles.corner} ${styles.cornerBottomRight}`} />
          </div>
        </div>

        <div className={styles.bottom}>
          <p className={styles.subtitle}>
            Здесь представлены лучшие проекты наших талантливых студентов
          </p>
          <button
            className={styles.scrollButton}
            onClick={scrollToProjects}
            aria-label="Прокрутить вниз"
            type="button"
          >
            <img src="/Line 4.svg" alt="" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  )
}
