import { useEffect, useMemo, useState } from 'react'
import { createPart, deletePart, getParts, updatePart } from '../api'
import PartForm from '../components/PartForm'
import { formatDuration } from '../format'

export default function PartsPage() {
  const [parts, setParts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  // editing: null (form closed) | { part: null } (adding) | { part } (editing that part)
  const [editing, setEditing] = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const [actionError, setActionError] = useState(null)

  useEffect(() => {
    getParts()
      .then(setParts)
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const sorted = useMemo(() => [...parts].sort((a, b) => a.name.localeCompare(b.name)), [parts])
  const categories = useMemo(() => [...new Set(parts.map((p) => p.category))].sort(), [parts])

  const handleSave = async (payload) => {
    if (editing.part) {
      const saved = await updatePart(editing.part._id, payload)
      setParts((ps) => ps.map((p) => (p._id === saved._id ? saved : p)))
    } else {
      const saved = await createPart(payload)
      setParts((ps) => [...ps, saved])
    }
    setEditing(null)
  }

  const handleDelete = async (id) => {
    try {
      await deletePart(id)
      setParts((ps) => ps.filter((p) => p._id !== id))
      setConfirmId(null)
      setActionError(null)
    } catch (err) {
      setActionError(err.message)
    }
  }

  const startEdit = (part) => {
    setConfirmId(null)
    setActionError(null)
    setEditing({ part })
  }

  return (
    <>
      <p className="subtitle">
        Add, edit or remove parts. Changes show up in the Build planner right away. Sizes in mm are worked out from the
        grid size.
      </p>

      {loadError && <p className="error">Could not load parts: {loadError}</p>}
      {loading && <p>Loading&hellip;</p>}

      {!loading && !loadError && (
        <>
          {editing ? (
            <PartForm
              key={editing.part?._id ?? 'new'}
              part={editing.part}
              categories={categories}
              onSave={handleSave}
              onCancel={() => setEditing(null)}
            />
          ) : (
            <div className="page-actions">
              <button type="button" onClick={() => startEdit(null)}>
                Add part
              </button>
            </div>
          )}

          {actionError && <p className="error">{actionError}</p>}

          <section className="card">
            <h2>All parts ({parts.length})</h2>
            {parts.length === 0 ? (
              <p className="empty">No parts yet. Add one above.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Part</th>
                    <th>Category</th>
                    <th>Grid</th>
                    <th>Size (mm)</th>
                    <th>Filament</th>
                    <th>Print time</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((p) => (
                    <tr key={p._id}>
                      <td>
                        <strong>{p.name}</strong>
                        {p.description && <div className="desc">{p.description}</div>}
                      </td>
                      <td>{p.category}</td>
                      <td>
                        {p.gridSize.length}&times;{p.gridSize.width}&times;{p.gridSize.height}
                      </td>
                      <td>
                        {p.dimensionsMm.length}&times;{p.dimensionsMm.width}&times;{p.dimensionsMm.height}
                      </td>
                      <td>{p.filamentGrams} g</td>
                      <td>{formatDuration(p.printTimeSeconds)}</td>
                      <td className="row-actions">
                        {confirmId === p._id ? (
                          <>
                            <span>Delete?</span>
                            <button type="button" className="danger" onClick={() => handleDelete(p._id)}>
                              Yes
                            </button>
                            <button type="button" className="secondary" onClick={() => setConfirmId(null)}>
                              No
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="link-button"
                              aria-label={`Edit ${p.name}`}
                              onClick={() => startEdit(p)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="link-button danger-text"
                              aria-label={`Delete ${p.name}`}
                              onClick={() => setConfirmId(p._id)}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </>
  )
}
