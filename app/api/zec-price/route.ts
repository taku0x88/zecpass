const COINGECKO_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=zcash&vs_currencies=usd&include_24hr_change=true'

/** Used only when the upstream price feed is unreachable, so the demo never shows a broken rate. */
const FALLBACK_USD = 45

export type ZecPriceResponse = {
  usd: number
  change24h: number | null
  live: boolean
  updatedAt: number
}

export async function GET() {
  try {
    const res = await fetch(COINGECKO_URL, {
      headers: { accept: 'application/json' },
      next: { revalidate: 60 },
    })
    if (!res.ok) throw new Error(`CoinGecko responded ${res.status}`)
    const data = (await res.json()) as { zcash?: { usd?: number; usd_24h_change?: number } }
    const usd = data.zcash?.usd
    if (typeof usd !== 'number' || usd <= 0) throw new Error('Missing zcash.usd in response')

    return Response.json({
      usd,
      change24h: data.zcash?.usd_24h_change ?? null,
      live: true,
      updatedAt: Date.now(),
    } satisfies ZecPriceResponse)
  } catch {
    return Response.json({
      usd: FALLBACK_USD,
      change24h: null,
      live: false,
      updatedAt: Date.now(),
    } satisfies ZecPriceResponse)
  }
}
