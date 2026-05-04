/**
 * UI-only filter constants that are not driven by the backend.
 *
 * These are the chip labels rendered above the projects/vacancies grids.
 * They're hardcoded on purpose — they describe the categories the UI lets
 * users filter by, not server-side data.
 */

export const PROJECT_TAGS = [
  'Frontend',
  'Backend',
  'Web-дизайн',
  'Telegram_Bot',
  'AI_товары',
  'Mobile',
  'Analytics',
  'Data_Science',
  'Базы_данных',
] as const

export const VACANCY_TAGS = [
  'C++',
  'React',
  'Python',
  'TypeScript',
  'Django',
  'Docker',
  'Kubernetes',
  'Swift',
  'Kotlin',
  'Flutter',
  'ML',
  'TensorFlow',
] as const
