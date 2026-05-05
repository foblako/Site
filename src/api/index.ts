export {
  ApiError,
  apiRequest,
  setAuthAccessTokenProvider,
  setAuthRefreshHandler,
} from './client'
export { useApi } from './useApi'
export type { ApiState } from './useApi'

export { fetchProject, fetchProjects, toggleProjectLike } from './projects'
export { fetchVacancies, fetchVacancy } from './vacancies'
export { fetchDirections } from './directions'
export { fetchHallOfFame } from './hallOfFame'
export { fetchDefaultPortfolio, fetchMyPortfolio, updateMyPortfolio } from './portfolio'
export type { PortfolioPatch } from './portfolio'
export { fetchDepartmentContacts } from './contacts'
export type { DepartmentContacts } from './contacts'

export { fetchMe, login, refresh, register } from './auth'
export type { LoginPayload, RegisterPayload } from './auth'
