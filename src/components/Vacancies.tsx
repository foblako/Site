import styles from './Vacancies.module.css'
import { VacancyCard } from './VacancyCard'

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

export function Vacancies() {
  return (
    <section className={styles.vacancies} aria-label="Открытые вакансии">
      <div className={styles.divider} />
      
      <div className={styles.content}>
        <div className={styles.textBlock}>
          <h2 className={styles.titleTop}>Наши открытые</h2>
          <h2 className={styles.titleHighlighted}>вакансии в команды</h2>
          <h2 className={styles.titleBottom}>лучших разработчиков</h2>
        </div>

        <div className={styles.vacanciesGrid}>
          {vacancies.map((vacancy, index) => (
            <VacancyCard key={vacancy.id} {...vacancy} index={index} total={vacancies.length} />
          ))}
        </div>
      </div>
    </section>
  )
}
