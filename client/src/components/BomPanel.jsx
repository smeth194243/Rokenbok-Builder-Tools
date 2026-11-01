import { formatDuration, formatGrams, formatMoney } from '../format'

export const MAX_QTY = 9999

export default function BomPanel({ rows, lineById, costValid, costPerKg, onCostChange, onQuantity, onRemove, onClear }) {
  return (
    <section className="card">
      <div className="card-header">
        <h2>Bill of materials</h2>
        {rows.length > 0 && (
          <button type="button" className="link-button" onClick={onClear}>
            Clear all
          </button>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="empty">No parts yet. Add some from the catalog.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Part</th>
              <th>Qty</th>
              <th>Filament</th>
              <th>Time</th>
              <th>Cost</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map(({ part, quantity }) => {
              const line = lineById[part._id]
              return (
                <tr key={part._id}>
                  <td>{part.name}</td>
                  <td>
                    <input
                      type="number"
                      className="qty"
                      min="1"
                      max={MAX_QTY}
                      value={quantity}
                      aria-label={`Quantity of ${part.name}`}
                      onChange={(e) => onQuantity(part._id, e.target.value)}
                    />
                  </td>
                  <td>{line ? formatGrams(line.filamentGrams) : '…'}</td>
                  <td>{line ? formatDuration(line.printTimeSeconds) : '…'}</td>
                  <td>{line && costValid ? formatMoney(line.cost) : costValid ? '…' : '—'}</td>
                  <td>
                    <button
                      type="button"
                      className="link-button"
                      aria-label={`Remove ${part.name}`}
                      onClick={() => onRemove(part._id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      <label className="cost-input">
        Filament cost ($ per kg)
        <input
          type="number"
          min="0"
          step="0.01"
          value={costPerKg}
          onChange={(e) => onCostChange(e.target.value)}
        />
      </label>
    </section>
  )
}
