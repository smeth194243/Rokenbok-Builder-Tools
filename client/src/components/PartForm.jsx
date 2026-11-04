import { useState } from 'react'
import { GRID_UNIT_MM } from '../constants'

const EMPTY = {
  name: '',
  category: '',
  description: '',
  length: '1',
  width: '1',
  height: '1',
  filamentGrams: '',
  minutes: '0',
  seconds: '0',
  modelUrl: '',
}

function toForm(part) {
  if (!part) return EMPTY
  return {
    name: part.name,
    category: part.category,
    description: part.description ?? '',
    length: String(part.gridSize.length),
    width: String(part.gridSize.width),
    height: String(part.gridSize.height),
    filamentGrams: String(part.filamentGrams),
    minutes: String(Math.floor(part.printTimeSeconds / 60)),
    seconds: String(part.printTimeSeconds % 60),
    modelUrl: part.modelUrl ?? '',
  }
}

const isWhole = (text, min, max) => {
  const n = Number(text)
  return text.trim() !== '' && Number.isInteger(n) && n >= min && n <= max
}

// Returns { error } or { payload } ready to send to the API.
function validate(f) {
  if (!f.name.trim()) return { error: 'Name is required.' }
  if (!f.category.trim()) return { error: 'Category is required.' }
  for (const [label, value] of [['Length', f.length], ['Width', f.width], ['Height', f.height]]) {
    if (!isWhole(value, 1, 1000)) return { error: `${label} must be a whole number of grid units (1 or more).` }
  }
  const grams = Number(f.filamentGrams)
  if (f.filamentGrams.trim() === '' || !Number.isFinite(grams) || grams < 0) {
    return { error: 'Filament must be a number of grams (0 or more).' }
  }
  if (!isWhole(f.minutes, 0, 100000)) return { error: 'Print minutes must be a whole number (0 or more).' }
  if (!isWhole(f.seconds, 0, 59)) return { error: 'Print seconds must be a whole number from 0 to 59.' }
  const printTimeSeconds = Number(f.minutes) * 60 + Number(f.seconds)
  if (printTimeSeconds < 1) return { error: 'Print time must be greater than 0.' }
  if (f.modelUrl.trim() && !/^https?:\/\/\S+$/i.test(f.modelUrl.trim())) {
    return { error: 'Model link must start with http:// or https://' }
  }

  return {
    payload: {
      name: f.name.trim(),
      category: f.category.trim().toLowerCase(),
      description: f.description.trim(),
      // The server works out the size in mm from the grid size.
      gridSize: { length: Number(f.length), width: Number(f.width), height: Number(f.height) },
      filamentGrams: grams,
      printTimeSeconds,
      modelUrl: f.modelUrl.trim(),
    },
  }
}

export default function PartForm({ part, categories, onSave, onCancel }) {
  const [form, setForm] = useState(() => toForm(part))
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    const result = validate(form)
    if (result.error) return setError(result.error)
    setError(null)
    setSaving(true)
    try {
      await onSave(result.payload) // the parent closes the form on success
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  const sizeKnown = [form.length, form.width, form.height].every((v) => isWhole(v, 1, 1000))
  const sizeHint = sizeKnown
    ? `${form.length * GRID_UNIT_MM} × ${form.width * GRID_UNIT_MM} × ${form.height * GRID_UNIT_MM} mm`
    : '—'

  return (
    <form className="card part-form" onSubmit={submit} noValidate>
      <h2>{part ? `Edit ${part.name}` : 'Add a part'}</h2>

      <div className="form-fields">
        <label className="span-2">
          Name
          <input value={form.name} onChange={set('name')} maxLength={60} />
        </label>
        <label>
          Category
          <input value={form.category} onChange={set('category')} list="category-options" maxLength={30} />
          <datalist id="category-options">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>
        <label className="span-3">
          Description
          <input value={form.description} onChange={set('description')} maxLength={500} />
        </label>

        <fieldset className="span-3">
          <legend>Size in grid units</legend>
          <div className="inline-fields">
            <label>
              Length
              <input type="number" min="1" step="1" value={form.length} onChange={set('length')} />
            </label>
            <label>
              Width
              <input type="number" min="1" step="1" value={form.width} onChange={set('width')} />
            </label>
            <label>
              Height
              <input type="number" min="1" step="1" value={form.height} onChange={set('height')} />
            </label>
            <span className="sub size-hint">= {sizeHint}</span>
          </div>
        </fieldset>

        <label>
          Filament (g)
          <input type="number" min="0" step="any" value={form.filamentGrams} onChange={set('filamentGrams')} />
        </label>
        <fieldset className="span-2">
          <legend>Print time</legend>
          <div className="inline-fields">
            <label>
              Minutes
              <input type="number" min="0" step="1" value={form.minutes} onChange={set('minutes')} />
            </label>
            <label>
              Seconds
              <input type="number" min="0" max="59" step="1" value={form.seconds} onChange={set('seconds')} />
            </label>
          </div>
        </fieldset>

        <label className="span-3">
          <span>
            Model link <span className="sub">(optional)</span>
          </span>
          <input type="url" value={form.modelUrl} onChange={set('modelUrl')} placeholder="https://" />
        </label>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="form-actions">
        <button type="submit" disabled={saving}>
          {saving ? 'Saving…' : part ? 'Save changes' : 'Add part'}
        </button>
        <button type="button" className="secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>
    </form>
  )
}
