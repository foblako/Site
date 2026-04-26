import './App.css'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { Projects } from './components/Projects'
import { Directions } from './components/Directions'
import { HallOfFame } from './components/HallOfFame'
import { Vacancies as VacanciesSection } from './components/Vacancies'
import { Contacts } from './components/Contacts'
import { Portfolio } from './pages/Portfolio'
import { Project } from './pages/Project'
import { Vacancies } from './pages/Vacancies'
import { Projects as ProjectsPage } from './pages/Projects'

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

function HomePage() {
  return (
    <>
      <Header />
      <Hero />
      <Projects />
      <Directions />
      <HallOfFame />
      <VacanciesSection />
      <Contacts />
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/portfolio" element={<><Header showPortfolioTitle /><Portfolio /></>} />
        <Route path="/vacancies" element={<><Header showPortfolioTitle /><Vacancies /></>} />
        <Route path="/projects" element={<><Header showPortfolioTitle /><ProjectsPage /></>} />
        <Route path="/project/:id" element={<><Header showPortfolioTitle /><Project /></>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
