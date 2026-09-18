export function truncateAddress(address, chars = 4) {
  if (!address) return ''
  return `${address.slice(0, 2 + chars)}...${address.slice(-chars)}`
}

export function formatDate(timestampSeconds) {
  if (!timestampSeconds) return '—'
  const d = new Date(Number(timestampSeconds) * 1000)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function daysUntilStale(lastQualifiedAtSeconds, freshnessPeriodSeconds) {
  const staleAt = Number(lastQualifiedAtSeconds) + Number(freshnessPeriodSeconds)
  const nowSeconds = Date.now() / 1000
  return Math.ceil((staleAt - nowSeconds) / 86400)
}

export function isActive(lastQualifiedAtSeconds, freshnessPeriodSeconds) {
  return daysUntilStale(lastQualifiedAtSeconds, freshnessPeriodSeconds) >= 0
}

export function formatFreshnessPeriod(seconds) {
  const days = Math.round(Number(seconds) / 86400)
  return `${days} day${days === 1 ? '' : 's'}`
}