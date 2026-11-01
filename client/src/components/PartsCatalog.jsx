import { formatDuration } from '../format'

export default function PartsCatalog({ parts, bom, onAdd }) {
  return (
    <section className="card">
      <h2>Parts catalog</h2>
      <ul className="part-list">
        {parts.map((p) => (
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
    </section>
  )
}
