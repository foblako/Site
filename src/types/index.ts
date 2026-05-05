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
}

export type Direction = {
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

export type AuthUser = {
  id: string
  email: string
  displayName: string
  role: string
  createdAt: string
}

export type TokenPair = {
  accessToken: string
  refreshToken: string
  tokenType: string
}
