import styles from './Directions.module.css'

type Direction = {
  name: string
  technologies: string[]
}

const directions: Direction[] = [
  { name: 'Frontend', technologies: ['HTML', 'JS', 'CSS', 'PHP'] },
  { name: 'Backend', technologies: ['Python', 'Java', 'Go', 'Node.js'] },
  { name: 'DevOps', technologies: ['Docker', 'Kubernetes', 'CI/CD'] },
  { name: 'Mobile', technologies: ['Swift', 'Kotlin', 'Flutter'] },
  { name: 'Data Science', technologies: ['Python', 'R', 'SQL', 'ML'] },
  { name: 'Web-дизайн', technologies: ['Figma', 'Adobe', 'Sketch'] },
  { name: 'Telegram Bot', technologies: ['Python', 'Node.js', 'API'] },
  { name: 'Базы данных', technologies: ['PostgreSQL', 'MySQL', 'MongoDB'] },
  { name: 'AI/ML', technologies: ['TensorFlow', 'PyTorch', 'OpenAI'] },
  { name: 'Тестирование', technologies: ['Selenium', 'Jest', 'Cypress'] },
]

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
          {directions.map((item) => (
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
