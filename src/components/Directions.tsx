import { DIRECTIONS } from '../data/directions'
import styles from './Directions.module.css'

export function Directions() {
  return (
    <section className={styles.directions} aria-label="Направления">
      <div className={styles.content}>
        <h2 className={styles.title}>
          <span>А это основные</span>
        </h2>
        <h2 className={styles.highlightedTitle}>
          <span>направлени</span>
          <img className={styles.letterY} src="/z.svg" alt="" aria-hidden="true" />
        </h2>
        <h2 className={styles.subtitle}>исследований и разработки</h2>

        <div className={styles.list}>
          {DIRECTIONS.map((item) => (
            <div key={item.name} className={styles.listItem}>
              <div className={styles.listLeft}>
                <span className={styles.listSlash}>//</span>
                <span className={styles.listName}>{item.name}</span>
              </div>
              <div className={styles.listRight}>
                {item.technologies.map((tech) => (
                  <span key={tech} className={styles.listTech}>{tech}</span>
                ))}
                <img className={styles.listArrow} src="/arrow-right.svg" alt="" aria-hidden="true" />
              </div>
            </div>
          ))}
          <div className={styles.listItemLast}>
            <div className={styles.listLeft}>
              <span className={styles.listSlash}>//</span>
              <span className={styles.listText}>И многие другие</span>
            </div>
            <img className={styles.listArrow} src="/arrow-right.svg" alt="" aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  )
}
