export type Currency = 'ZEC' | 'USD'

export type MoneyParts = { value: string; unit: string; label: string }

const usdFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })
const usdWholeFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

export function formatUsd(usd: number): string {
  if (usd > 0 && usd < 0.01) return '<$0.01'
  return Number.isInteger(usd) ? usdWholeFormatter.format(usd) : usdFormatter.format(usd)
}

/** ZEC amounts converted from round USD prices are intentionally shown with enough precision to look "unround". */
export function formatZecValue(zec: number): string {
  if (zec > 0 && zec < 0.001) return zec.toFixed(4)
  return zec.toFixed(3)
}

export function roundZec(zec: number): number {
  return Math.round(zec * 1e6) / 1e6
}

export function moneyParts(zec: number, usd: number, currency: Currency): MoneyParts {
  if (currency === 'USD') {
    const value = formatUsd(usd)
    return { value, unit: 'USD', label: value }
  }
  const value = formatZecValue(zec)
  return { value, unit: 'ZEC', label: `${value} ZEC` }
}
