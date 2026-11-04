import { useMemo, useState } from 'react'
import { formatDuration } from '../format'

const SORTS = {
  name: { label: 'Name (A–Z)', compare: (a, b) => a.name.localeCompare(b.name) },
  filament: { label: 'Filament (low to high)', compare: (a, b) => a.filamentGrams - b.filamentGrams },
  time: { label: 'Print time (short to long)', compare: (a, b) => a.printTimeSeconds - b.printTimeSeconds },
}

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1)

export default function PartsCatalog({ parts, bom, onAdd }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState('name')

  // Categories come from the data, so new part types show up automatically.
  const categories = useMemo(() => [...new Set(parts.map((p) => p.category))].sort(), [parts])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return parts
      .filter((p) => category === 'all' || p.category === category)
      .filter((p) => !q || `${p.name} ${p.description} ${p.category}`.toLowerCase().includes(q))
      .sort(SORTS[sort].compare)
  }, [parts, query, category, sort])

  const filtered = query.trim() !== '' || category !== 'all'
  const clearFilters = () => {
    setQuery('')
    setCategory('all')
  }

  return (
    <section className="card">
      <div className="card-header">
        <h2>Parts catalog</h2>
        <span className="sub">
          {filtered ? `${visible.length} of ${parts.length} parts` : `${parts.length} parts`}
        </span>
      </div>

      <div className="toolbar">
        <input
          type="search"
          className="search"
          placeholder="Search parts…"
          aria-label="Search parts"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="toolbar-row">
          <select aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {capitalize(c)}
              </option>
            ))}
          </select>
          <select aria-label="Sort by" value={sort} onChange={(e) => setSort(e.target.value)}>
            {Object.entries(SORTS).map(([key, { label }]) => (
              <option key={key} value={key}>
                Sort: {label}
              </option>
            ))}
          </select>
          {filtered && (
            <button type="button" className="link-button" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="empty">No parts match your search.</p>
      ) : (
        <ul className="part-list">
          {visible.map((p) => (
            <li key={p._id} className="part-item">
              <div>
                <strong>{p.name}</strong>
                <div className="desc">{p.description}</div>
                <div className="meta">
                  {p.gridSize.length}&times;{p.gridSize.width}&times;{p.gridSize.height} units
                  {' · '}
                  {p.dimensionsMm.length}&times;{p.dimensionsMm.width}&times;{p.dimensionsMm.height} mm
                  {' · '}
                  {p.filamentGrams} g{' · '}
                  {formatDuration(p.printTimeSeconds)}
                  {p.modelUrl && (
                    <>
                      {' · '}
                      <a href={p.modelUrl} target="_blank" rel="noreferrer">
                        model
                      </a>
                    </>
                  )}
                </div>
              </div>
              <button type="button" onClick={() => onAdd(p._id)}>
                Add{bom[p._id] ? ` (${bom[p._id]})` : ''}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
