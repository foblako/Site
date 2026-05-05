export type ProjectSummary = {
  id: string
  title: string
  description: string
  image: string
  tags: string[]
  status: string
  statusIcon: string
  likes: number
  comments: number
  participants: number
  /** `null` when the caller is anonymous (or seed data without a user
   * context); `true`/`false` once a valid access token is attached.
   */
  likedByMe?: boolean | null
}

export type ProjectLikeResponse = {
  liked: boolean
  likeCount: number
}

export type TeamMember = {
  name: string
  role: string
  avatar: string
  period: string
}

export type Review = {
  author: string
  text: string
  rating: number
}

export type Artifact = {
  name: string
  url: string
}

export type ProjectDetail = ProjectSummary & {
  fullDescription: string
  team: TeamMember[]
  technologies: string[]
  startDate: string
  communityRating: number
  expertsRating: number
  screenshots: number
  reviews: Review[]
  artifacts: Artifact[]
}

export type Vacancy = {
  id: number
  title: string
  description: string
  tags: string[]
  responsibilities: string
  responsibilitiesList: string[]
  /** `null` for anonymous callers; `true`/`false` once the access token
   * identifies a user that has (or has not) submitted an application.
   */
  appliedByMe?: boolean | null
}

export type VacancyApplication = {
  id: string
  vacancyId: number
  message: string
  createdAt: string
}

export type Direction = {
  id: number
  name: string
  technologies: string[]
}

export type HallOfFameStar = {
  id: number
  name: string
  role: string
  avatar: string
}

export type UserProfile = {
  name: string
  info: { label: string; value: string }[]
  about: string[]
  skills: string[]
  goals: string[]
  works: { label: string; url: string }[]
  contacts: { phone: string; email: string; website: string }
}

export type CommentAuthor = {
  id: string
  displayName: string
}

export type Comment = {
  id: string
  body: string
  createdAt: string
  author: CommentAuthor
}

export type AuthUser = {
  id: string
  email: string
  displayName: string
  role: string
  avatarUrl: string | null
  createdAt: string
}

export type TokenPair = {
  accessToken: string
  refreshToken: string
  tokenType: string
}
