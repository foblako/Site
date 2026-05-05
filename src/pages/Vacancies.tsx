import { useState } from 'react'
import { fetchVacancies, useApi } from '../api'
import { ApiStatus } from '../components/ApiStatus'
import { Footer } from '../components/Footer'
import { VacancyCard } from '../components/VacancyCard'
import { VACANCY_TAGS } from '../constants/filters'
import styles from './Vacancies.module.css'

export function Vacancies() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const { data: vacancies, loading, error } = useApi((signal) => fetchVacancies(signal), [])

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const filteredVacancies = (vacancies ?? []).filter(vacancy => {
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
            {VACANCY_TAGS.map(tag => (
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

        <ApiStatus
          loading={loading}
          error={error}
          empty={!loading && !error && filteredVacancies.length === 0}
          emptyMessage="По заданным фильтрам ничего не найдено"
        />

        <div className={styles.vacanciesGrid}>
          {filteredVacancies.map((vacancy, index) => (
            <VacancyCard key={vacancy.id} {...vacancy} index={index} />
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

    <Footer />
    </>
  )
}
