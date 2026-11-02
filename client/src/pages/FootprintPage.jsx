import { useEffect, useState } from 'react'
import { calculateFootprint } from '../api'
import { formatNumber } from '../format'
import { useLocalStorage } from '../hooks/useLocalStorage'

const UNIT_OPTIONS = [
  { value: 'blocks', label: 'Blocks' },
  { value: 'units', label: 'Grid units (20 mm)' },
  { value: 'mm', label: 'Millimetres' },
  { value: 'cm', label: 'Centimetres' },
  { value: 'in', label: 'Inches' },
  { value: 'ft', label: 'Feet' },
  { value: 'm', label: 'Metres' },
]
const GRID_UNITS = ['blocks', 'units']

// A dimension is usable when it is a positive number (whole for grid units).
function parseDimension(text, unit) {
  if (text.trim() === '') return null
  const n = Number(text)
  if (!Number.isFinite(n) || n <= 0) return null
  if (GRID_UNITS.includes(unit) && !Number.isInteger(n)) return null
  return n
}

export default function FootprintPage() {
  const [form, setForm] = useLocalStorage('rokenbok.footprint.v1', {
    unit: 'blocks',
    length: '3',
    width: '2',
    height: '',
  })
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const length = parseDimension(form.length, form.unit)
  const width = parseDimension(form.width, form.unit)
  const heightTyped = form.height.trim() !== ''
  const height = heightTyped ? parseDimension(form.height, form.unit) : undefined
  const valid = length !== null && width !== null && height !== null

  // JSON string as the effect dependency so we only re-run when the numbers change.
  const requestKey = valid ? JSON.stringify({ unit: form.unit, length, width, height }) : null

  useEffect(() => {
    if (!requestKey) return
    const controller = new AbortController()
    const timer = setTimeout(() => {
      calculateFootprint(JSON.parse(requestKey), controller.signal)
        .then((data) => {
          setResult(data)
          setError(null)
        })
        .catch((err) => {
          if (err.name !== 'AbortError') setError(err.message)
        })
    }, 200)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [requestKey])

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  const shown = valid ? result : null
  const isGridInput = GRID_UNITS.includes(form.unit)
  const wholeNumbers = isGridInput ? 'Whole numbers only.' : ''

  return (
    <>
      <p className="subtitle">
        Convert between blocks, grid units and real-world sizes. Enter a build in blocks to see how big it is, or enter
        the space you have to see the largest build that fits.
      </p>

      <div className="columns">
        <section className="card">
          <h2>Measurement</h2>
          <div className="form-grid">
            <label>
              Unit
              <select value={form.unit} onChange={update('unit')}>
                {UNIT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Length
              <input type="number" min="0" step="any" value={form.length} onChange={update('length')} />
            </label>
            <label>
              Width
              <input type="number" min="0" step="any" value={form.width} onChange={update('width')} />
            </label>
            <label>
              <span>
                Height <span className="sub">(optional)</span>
              </span>
              <input type="number" min="0" step="any" value={form.height} onChange={update('height')} />
            </label>
          </div>
          {!valid && (
            <p className="hint">
              Enter a length and width greater than 0. {wholeNumbers}
            </p>
          )}

          <div className="explainer">
            <strong>What&rsquo;s a block?</strong> One full beam with a connector cube on each end: 9 grid units
            (180 mm). Each extra beam and cube adds another block: 8 more grid units (160 mm). So 1 block = 180 mm,
            2 = 340 mm, 3 = 500 mm.
          </div>
        </section>

        <div className="right">
          {error && <p className="error">Could not calculate: {error}</p>}
          {shown && <Results data={shown} />}
        </div>
      </div>
    </>
  )
}

function Results({ data }) {
  const { dimensions, area, unit } = data
  const cols = [
    ['Length', dimensions.length],
    ['Width', dimensions.width],
    ...(dimensions.height ? [['Height', dimensions.height]] : []),
  ]
  const isGridInput = GRID_UNITS.includes(unit)

  const rows = [
    { label: 'Blocks that fit', get: (d) => d.fit.blocks, strong: true },
    { label: 'Grid units that fit', get: (d) => d.fit.units, strong: true },
    { label: 'Millimetres', get: (d) => d.exact.mm },
    { label: 'Centimetres', get: (d) => d.exact.cm },
    { label: 'Inches', get: (d) => d.exact.in },
    { label: 'Feet', get: (d) => d.exact.ft },
    ...(isGridInput ? [] : [{ label: 'Leftover (mm)', get: (d) => d.fit.slackMm }]),
  ]

  const l = dimensions.length.fit
  const w = dimensions.width.fit

  return (
    <>
      <section className="card totals">
        <h2>{isGridInput ? 'Your build' : 'Largest build that fits'}</h2>
        <p className="big">
          {l.blocks} &times; {w.blocks} blocks
        </p>
        <p className="sub">
          {l.units} &times; {w.units} grid units &middot; {formatNumber(l.unitsMm)} &times; {formatNumber(w.unitsMm)}{' '}
          mm
          {l.blocks === 0 || w.blocks === 0 ? ' — too small to fit a block (one block is 180 mm)' : ''}
        </p>
      </section>

      <section className="card">
        <h2>Dimensions</h2>
        <table>
          <thead>
            <tr>
              <th />
              {cols.map(([name]) => (
                <th key={name}>{name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label}>
                <th scope="row">{r.label}</th>
                {cols.map(([name, d]) => (
                  <td key={name} className={r.strong ? 'strong' : undefined}>
                    {formatNumber(r.get(d))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {!isGridInput && (
          <p className="hint">&ldquo;That fit&rdquo; rows show the largest whole number that fits inside what you entered.</p>
        )}
      </section>

      <section className="card">
        <h2>Floor area</h2>
        <table>
          <thead>
            <tr>
              <th />
              <th>{isGridInput ? 'Your build' : 'As entered'}</th>
              {!isGridInput && <th>Whole grid only</th>}
            </tr>
          </thead>
          <tbody>
            {[
              ['Square inches', 'in2'],
              ['Square feet', 'ft2'],
              ['Square centimetres', 'cm2'],
              ['Square metres', 'm2'],
            ].map(([label, key]) => (
              <tr key={key}>
                <th scope="row">{label}</th>
                <td>{formatNumber(area.exact[key])}</td>
                {!isGridInput && <td>{formatNumber(area.fit[key])}</td>}
              </tr>
            ))}
            <tr>
              <th scope="row">Grid cells (20 mm squares)</th>
              <td>{isGridInput ? formatNumber(area.fit.cells) : '—'}</td>
              {!isGridInput && <td>{formatNumber(area.fit.cells)}</td>}
            </tr>
          </tbody>
        </table>
      </section>
    </>
  )
}
