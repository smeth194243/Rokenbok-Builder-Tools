// Small wrapper around fetch for talking to the Express API.
async function request(path) {
  const res = await fetch(`/api${path}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Request failed (${res.status})`)
  }
  return res.json()
}

export const getParts = () => request('/parts')
