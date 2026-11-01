// Turns 976 seconds into "16m 16s".
export function formatDuration(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return s === 0 ? `${m}m` : `${m}m ${s}s`
}
