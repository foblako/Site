import { useState } from 'react'
import styles from './Vacancies.module.css'
import portfolioStyles from './Portfolio.module.css'
import { VacancyCard } from '../components/VacancyCard'

const vacancies = [
  {
    id: 1,
    title: 'Программист С++',
    description: 'Автоматизация проведения лабораторных работ по программированию',
    tags: ['C++', 'Автоматизация', 'Лабораторные'],
    responsibilities: 'Разработка и поддержка системы автоматического тестирования',
    responsibilitiesList: [
      'Разработка модулей системы на C++',
      'Написание unit-тестов',
      'Документирование кода',
      'Взаимодействие с командой frontend-разработчиков',
    ],
  },
  {
    id: 2,
    title: 'Frontend разработчик',
    description: 'Создание современных пользовательских интерфейсов',
    tags: ['React', 'TypeScript', 'CSS'],
    responsibilities: 'Разработка клиентской части веб-приложений',
    responsibilitiesList: [
      'Разработка компонентов на React',
      'Верстка макетов',
      'Оптимизация производительности',
      'Работа с состоянием приложения',
    ],
  },
  {
    id: 3,
    title: 'Backend разработчик Python',
    description: 'Разработка серверной части веб-приложений',
    tags: ['Python', 'Django', 'PostgreSQL'],
    responsibilities: 'Проектирование и разработка API',
    responsibilitiesList: [
      'Разработка REST API',
      'Работа с базами данных',
      'Оптимизация запросов',
      'Интеграция с внешними сервисами',
    ],
  },
  {
    id: 4,
    title: 'DevOps инженер',
    description: 'Автоматизация процессов разработки и деплоя',
    tags: ['Docker', 'Kubernetes', 'CI/CD'],
    responsibilities: 'Настройка и поддержка инфраструктуры',
    responsibilitiesList: [
      'Настройка CI/CD пайплайнов',
      'Контейнеризация приложений',
      'Мониторинг систем',
      'Автоматизация рутинных задач',
    ],
  },
  {
    id: 5,
    title: 'Mobile разработчик',
    description: 'Разработка мобильных приложений для iOS и Android',
    tags: ['Swift', 'Kotlin', 'Flutter'],
    responsibilities: 'Создание кроссплатформенных приложений',
    responsibilitiesList: [
      'Разработка мобильных приложений',
      'Интеграция с API',
      'Работа с локальным хранилищем',
      'Публикация в сторах',
    ],
  },
  {
    id: 6,
    title: 'Data Scientist',
    description: 'Анализ данных и построение ML-моделей',
    tags: ['Python', 'ML', 'TensorFlow'],
    responsibilities: 'Исследование данных и разработка моделей',
    responsibilitiesList: [
      'Сбор и обработка данных',
      'Построение ML-моделей',
      'Анализ результатов',
      'Внедрение моделей в продакшн',
    ],
  },
]

const allTags = ['C++', 'React', 'Python', 'TypeScript', 'Django', 'Docker', 'Kubernetes', 'Swift', 'Kotlin', 'Flutter', 'ML', 'TensorFlow']

export function Vacancies() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const filteredVacancies = vacancies.filter(vacancy => {
    const matchesSearch = vacancy.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         vacancy.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTags = selectedTags.length === 0 ||
                       selectedTags.some(tag => vacancy.tags.includes(tag))
    return matchesSearch && matchesTags
  })
  return (
    <>
    <section className={styles.vacancies} aria-label="Страница вакансий">
      <div className={styles.content}>
        <div className={styles.textBlock}>
          <h1 className={styles.titleTop}>Наши открытые</h1>
          <h1 className={styles.titleHighlighted}>вакансии в команды</h1>
          <h1 className={styles.titleBottom}>лучших разработчиков</h1>
        </div>

        <div className={styles.filterBlock}>
          <div className={styles.searchSection}>
            <div className={styles.searchInput}>
              <input
                type="text"
                placeholder="Поиск"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.input}
              />
              <img src="/search.svg" alt="" aria-hidden="true" className={styles.searchIcon} />
            </div>

            <div className={styles.filterButtons}>
              <button className={styles.filterButton} aria-label="Сортировка">
                <img src="/sort.svg" alt="" aria-hidden="true" />
              </button>
              <button className={styles.filterButton} aria-label="Фильтр">
                <img src="/filter.svg" alt="" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className={styles.tagsContainer}>
            {allTags.map(tag => (
              <button
                key={tag}
                className={`${styles.tag} ${selectedTags.includes(tag) ? styles.tagActive : ''}`}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.vacanciesGrid}>
          {filteredVacancies.map((vacancy, index) => (
            <VacancyCard key={vacancy.id} {...vacancy} index={index} total={vacancies.length} />
          ))}
        </div>

        <div className={styles.backToTopContainer}>
          <button 
            className={styles.backToTopButton}
            onClick={() => window.scrollTo(0, 0)}
            type="button"
          >
            На этом всё<br />Вернуться в начало
          </button>
        </div>
      </div>
    </section>

    <footer className={portfolioStyles.footer}>
      <div className={portfolioStyles.footerContent}>
        <h2 className={portfolioStyles.footerTitle}>Контакты</h2>
        <p className={portfolioStyles.footerInfo}>
          +7 (499) 215-65-65 доб. 2404<br />
          vega@mirea.ru
        </p>
      </div>
    </footer>
    </>
  )
}
