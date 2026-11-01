import { useEffect, useState } from 'react'

// Like useState, but the value is saved in the browser's localStorage so it
// survives a page refresh. Falls back to plain state if storage is blocked.
//
// FUTURE: builds will be saved to MongoDB (with accounts) so they can be
// loaded from any browser. This hook is the only place that would change.
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw === null ? initialValue : JSON.parse(raw)
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // storage unavailable (private mode, quota) - keep working in memory
    }
  }, [key, value])

  return [value, setValue]
}
