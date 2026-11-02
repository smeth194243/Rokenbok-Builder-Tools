// Turns seconds into "16m 16s" or "5h 12m".
export function formatDuration(totalSeconds) {
  if (!totalSeconds) return '0m'
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) return m === 0 ? `${h}h` : `${h}h ${m}m`
  if (m === 0) return `${s}s`
  return s === 0 ? `${m}m` : `${m}m ${s}s`
}

export const formatMoney = (n) => `$${n.toFixed(2)}`

export function formatGrams(g) {
  return g >= 1000 ? `${(g / 1000).toFixed(2)} kg` : `${g} g`
}

// 1234.5 -> "1,234.5" (at most 3 decimals)
export const formatNumber = (n) => Number(n).toLocaleString(undefined, { maximumFractionDigits: 3 })
