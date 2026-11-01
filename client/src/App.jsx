import { useEffect, useState } from 'react'
import { getParts } from './api'
import { formatDuration } from './format'

export default function App() {
  const [parts, setParts] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getParts()
      .then(setParts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="container">
      <h1>Rokenbok Tools</h1>
      <p className="subtitle">Parts catalog &mdash; 1 grid unit = 20 mm</p>

      {error && <p className="error">Could not load parts: {error}</p>}
      {loading && <p>Loading&hellip;</p>}

      {!loading && !error && (
        <table>
          <thead>
            <tr>
              <th>Part</th>
              <th>Grid (L&times;W&times;H)</th>
              <th>Size (mm)</th>
              <th>Filament</th>
              <th>Print time</th>
              <th>Model</th>
            </tr>
          </thead>
          <tbody>
            {parts.map((p) => (
              <tr key={p._id}>
                <td>
                  <strong>{p.name}</strong>
                  <div className="desc">{p.description}</div>
                </td>
                <td>
                  {p.gridSize.length}&times;{p.gridSize.width}&times;{p.gridSize.height}
                </td>
                <td>
                  {p.dimensionsMm.length}&times;{p.dimensionsMm.width}&times;{p.dimensionsMm.height}
                </td>
                <td>{p.filamentGrams} g</td>
                <td>{formatDuration(p.printTimeSeconds)}</td>
                <td>
                  {p.modelUrl && (
                    <a href={p.modelUrl} target="_blank" rel="noreferrer">
                      Printables
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
