import { useEffect, useMemo, useState } from 'react'
import { calculateBom, getParts } from './api'
import BomPanel, { MAX_QTY } from './components/BomPanel'
import PartsCatalog from './components/PartsCatalog'
import Totals from './components/Totals'
import { useLocalStorage } from './hooks/useLocalStorage'

export default function App() {
  const [parts, setParts] = useState([])
  const [loadError, setLoadError] = useState(null)
  const [loading, setLoading] = useState(true)

  // The build is { [partId]: quantity }. Kept in localStorage for now.
  const [bom, setBom] = useLocalStorage('rokenbok.bom.v1', {})
  const [costInput, setCostInput] = useLocalStorage('rokenbok.costPerKg.v1', '20')

  const [result, setResult] = useState(null)
  const [calcError, setCalcError] = useState(null)

  useEffect(() => {
    getParts()
      .then(setParts)
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false))
  }, [])

  // Rows for parts that still exist (ignores stale ids left in localStorage).
  const rows = useMemo(() => {
    const byId = new Map(parts.map((p) => [p._id, p]))
    return Object.entries(bom)
      .filter(([id]) => byId.has(id))
      .map(([id, quantity]) => ({ part: byId.get(id), quantity }))
  }, [parts, bom])

  const costPerKg = Number(costInput)
  const costValid = costInput !== '' && Number.isFinite(costPerKg) && costPerKg >= 0

  // Ask the server for totals whenever the build or price changes.
  useEffect(() => {
    if (rows.length === 0) return
    const controller = new AbortController()
    const timer = setTimeout(() => {
      const items = rows.map(({ part, quantity }) => ({ partId: part._id, quantity }))
      calculateBom(items, costValid ? costPerKg : 0, controller.signal)
        .then((data) => {
          setResult(data)
          setCalcError(null)
        })
        .catch((err) => {
          if (err.name !== 'AbortError') setCalcError(err.message)
        })
    }, 200) // small delay so typing a quantity doesn't fire a request per keystroke
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [rows, costPerKg, costValid])

  // An empty build has nothing to show, whatever the last response was.
  const shown = rows.length > 0 ? result : null
  const shownError = rows.length > 0 ? calcError : null

  const lineById = useMemo(
    () => Object.fromEntries((shown?.lines ?? []).map((l) => [l.partId, l])),
    [shown]
  )

  const addPart = (id) => setBom((b) => ({ ...b, [id]: Math.min((b[id] ?? 0) + 1, MAX_QTY) }))

  const setQuantity = (id, raw) => {
    const n = Math.floor(Number(raw))
    const quantity = Number.isFinite(n) ? Math.min(Math.max(n, 1), MAX_QTY) : 1
    setBom((b) => ({ ...b, [id]: quantity }))
  }

  const removePart = (id) =>
    setBom((b) => {
      const { [id]: _removed, ...rest } = b
      return rest
    })

  return (
    <div className="container">
      <h1>Rokenbok Tools</h1>
      <p className="subtitle">Plan a build and estimate the filament, print time and cost &mdash; 1 grid unit = 20 mm</p>

      {loadError && <p className="error">Could not load parts: {loadError}</p>}
      {loading && <p>Loading&hellip;</p>}

      {!loading && !loadError && (
        <div className="columns">
          <PartsCatalog parts={parts} bom={bom} onAdd={addPart} />
          <div className="right">
            <BomPanel
              rows={rows}
              lineById={lineById}
              costValid={costValid}
              costPerKg={costInput}
              onCostChange={setCostInput}
              onQuantity={setQuantity}
              onRemove={removePart}
              onClear={() => setBom({})}
            />
            <Totals totals={shown?.totals} error={shownError} costValid={costValid} />
          </div>
        </div>
      )}
    </div>
  )
}
