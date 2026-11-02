import { NavLink, Route, Routes } from 'react-router-dom'
import BuildPage from './pages/BuildPage'
import FootprintPage from './pages/FootprintPage'

export default function App() {
  return (
    <div className="container">
      <header className="site-header">
        <h1>Rokenbok Tools</h1>
        <nav className="nav">
          <NavLink to="/" end>
            Build planner
          </NavLink>
          <NavLink to="/footprint">Footprint</NavLink>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<BuildPage />} />
        <Route path="/footprint" element={<FootprintPage />} />
        <Route path="*" element={<p>Page not found.</p>} />
      </Routes>
    </div>
  )
}
