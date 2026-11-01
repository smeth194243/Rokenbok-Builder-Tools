// Small wrapper around fetch for talking to the Express API.
async function request(path, options) {
  const res = await fetch(`/api${path}`, options)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Request failed (${res.status})`)
  }
  return res.json()
}

export const getParts = () => request('/parts')

// items: [{ partId, quantity }]
export const calculateBom = (items, costPerKg, signal) =>
  request('/bom/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, costPerKg }),
    signal,
  })
