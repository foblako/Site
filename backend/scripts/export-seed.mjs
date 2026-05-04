// Re-exports `src/data/*.ts` into `backend/seed_data/*.json` so that the FastAPI
// seeder can load the same content the React frontend ships with.
//
//   npx tsx backend/scripts/export-seed.mjs
//
// Re-run this whenever `src/data/*.ts` changes.

import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '..', '..')
const DATA_DIR = resolve(REPO_ROOT, 'src', 'data')
const OUT_DIR = resolve(REPO_ROOT, 'backend', 'seed_data')

const out = (name, data) => {
  const p = resolve(OUT_DIR, name)
  mkdirSync(dirname(p), { recursive: true })
  writeFileSync(p, JSON.stringify(data, null, 2) + '\n', 'utf8')
  console.log('wrote', p)
}

const { PROJECT_SUMMARIES, PROJECT_DETAILS } = await import(resolve(DATA_DIR, 'projects.ts'))
const { VACANCIES } = await import(resolve(DATA_DIR, 'vacancies.ts'))
const { DIRECTIONS } = await import(resolve(DATA_DIR, 'directions.ts'))
const { STARS } = await import(resolve(DATA_DIR, 'hallOfFame.ts'))
const { DEFAULT_USER } = await import(resolve(DATA_DIR, 'portfolio.ts'))
const { DEPARTMENT_CONTACTS } = await import(resolve(DATA_DIR, 'contacts.ts'))

out('projects.json', { summaries: PROJECT_SUMMARIES, details: PROJECT_DETAILS })
out('vacancies.json', VACANCIES)
out('directions.json', DIRECTIONS)
out('hall_of_fame.json', STARS)
out('portfolio.json', DEFAULT_USER)
out('contacts.json', DEPARTMENT_CONTACTS)
