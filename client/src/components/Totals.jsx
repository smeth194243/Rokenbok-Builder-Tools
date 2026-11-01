import { formatDuration, formatGrams, formatMoney } from '../format'

export default function Totals({ totals, error, costValid }) {
  if (error) return <section className="card"><p className="error">Could not calculate totals: {error}</p></section>
  if (!totals) return null

  const { spools } = totals
  const percent = Math.round(spools.spoolsUsed * 100)

  return (
    <section className="card totals">
      <h2>Totals</h2>
      <dl>
        <div>
          <dt>Parts</dt>
          <dd>
            {totals.partCount} <span className="sub">({totals.uniqueParts} types)</span>
          </dd>
        </div>
        <div>
          <dt>Filament</dt>
          <dd>{formatGrams(totals.filamentGrams)}</dd>
        </div>
        <div>
          <dt>Print time</dt>
          <dd>
            {formatDuration(totals.printTimeSeconds)} <span className="sub">(one printer)</span>
          </dd>
        </div>
        <div>
          <dt>Cost</dt>
          <dd>{costValid ? formatMoney(totals.cost) : '—'}</dd>
        </div>
      </dl>

      <div className="spool">
        <div className="spool-bar" role="img" aria-label={`${percent}% of a ${spools.spoolGrams} g spool`}>
          <div className="spool-fill" style={{ width: `${Math.min(percent, 100)}%` }} />
        </div>
        <p className="sub">
          {spools.spoolsUsed < 1
            ? `${percent}% of one ${spools.spoolGrams / 1000} kg spool`
            : `${spools.spoolsUsed} spools of ${spools.spoolGrams / 1000} kg — buy ${spools.spoolsToBuy}`}
        </p>
      </div>
    </section>
  )
}
