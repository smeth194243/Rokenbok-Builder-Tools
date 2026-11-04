// Small wrapper around fetch for talking to the Express API.
async function request(path, options) {
  const res = await fetch(`/api${path}`, options)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Request failed (${res.status})`)
  }
  if (res.status === 204) return null // e.g. DELETE has no body
  return res.json()
}

const jsonRequest = (method, body) => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

export const getParts = () => request('/parts')
export const createPart = (part) => request('/parts', jsonRequest('POST', part))
export const updatePart = (id, part) => request(`/parts/${id}`, jsonRequest('PUT', part))
export const deletePart = (id) => request(`/parts/${id}`, { method: 'DELETE' })

// items: [{ partId, quantity }]
export const calculateBom = (items, costPerKg, signal) =>
  request('/bom/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, costPerKg }),
    signal,
  })

// input: { unit, length, width, height? }
export const calculateFootprint = (input, signal) =>
  request('/footprint/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    signal,
  })
