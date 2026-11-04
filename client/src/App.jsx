import { NavLink, Route, Routes } from 'react-router-dom'
import BuildPage from './pages/BuildPage'
import FootprintPage from './pages/FootprintPage'
import PartsPage from './pages/PartsPage'
import { WHAT_IS_ROKENBOK_URL } from './constants'

export default function App() {
  return (
    <div className="container">
      <header className="site-header">
        <div>
          <h1>Rokenbok Tools</h1>
          <a className="what-is" href={WHAT_IS_ROKENBOK_URL} target="_blank" rel="noreferrer">
            <span aria-hidden="true">&#9654;</span> What is Rokenbok?
          </a>
        </div>
        <nav className="nav">
          <NavLink to="/" end>
            Build planner
          </NavLink>
          <NavLink to="/footprint">Footprint</NavLink>
          <NavLink to="/parts">Parts</NavLink>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<BuildPage />} />
        <Route path="/footprint" element={<FootprintPage />} />
        <Route path="/parts" element={<PartsPage />} />
        <Route path="*" element={<p>Page not found.</p>} />
      </Routes>
    </div>
  )
}
