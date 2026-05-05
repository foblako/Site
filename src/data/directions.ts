import type { Direction } from '../types'

// Seed data source for `scripts/export-seed.mjs` (generates backend JSON at
// build time). The runtime no longer imports this — the frontend reads
// directions from the API.
export const DIRECTIONS: Direction[] = [
  { id: 1, name: 'Frontend', technologies: ['HTML', 'JS', 'CSS', 'PHP'] },
  { id: 2, name: 'Backend', technologies: ['Python', 'Java', 'Go', 'Node.js'] },
  { id: 3, name: 'DevOps', technologies: ['Docker', 'Kubernetes', 'CI/CD'] },
  { id: 4, name: 'Mobile', technologies: ['Swift', 'Kotlin', 'Flutter'] },
  { id: 5, name: 'Data Science', technologies: ['Python', 'R', 'SQL', 'ML'] },
  { id: 6, name: 'Web-дизайн', technologies: ['Figma', 'Adobe', 'Sketch'] },
  { id: 7, name: 'Telegram Bot', technologies: ['Python', 'Node.js', 'API'] },
  { id: 8, name: 'Базы данных', technologies: ['PostgreSQL', 'MySQL', 'MongoDB'] },
  { id: 9, name: 'AI/ML', technologies: ['TensorFlow', 'PyTorch', 'OpenAI'] },
  { id: 10, name: 'Тестирование', technologies: ['Selenium', 'Jest', 'Cypress'] },
]
