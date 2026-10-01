'use client'

import { Code2, ShieldCheck, ShieldHalf, UserRound } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { formatUsd, type Currency } from '@/lib/money'
import { WALLET, truncateMiddle } from '@/lib/zk'
import { useProtocol } from './protocol-provider'
import { CryptoBadge, ProtocolOnly } from './primitives'

export function AppHeader() {
  return (
    <header className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
            aria-hidden="true"
          >
            <ShieldHalf className="size-5" />
          </div>
          <div className="flex min-w-0 flex-col">
            <h1 className="flex items-baseline gap-2 text-2xl font-semibold leading-none tracking-tighter">
              ZecPass
              <ProtocolOnly>
                <span className="hidden whitespace-nowrap font-mono text-xs font-normal tracking-normal text-muted-foreground lg:inline">
                  {'// Native Shielded Admittance'}
                </span>
              </ProtocolOnly>
            </h1>
            <p className="mt-1 truncate text-sm text-muted-foreground">Fair-price tickets. Private by default.</p>
          </div>
        </div>
        <ProtocolModeToggle />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <AccountPill />
        <div className="flex items-center gap-2 max-sm:w-full">
          <CurrencyToggle />
          <ZecPricePill />
        </div>
      </div>
    </header>
  )
}

function AccountPill() {
  const { balance, amount, devMode } = useProtocol()
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3 rounded-full bg-card p-1.5 pr-2">
      <div
        className="flex size-11 shrink-0 items-center justify-center rounded-full bg-foreground text-background"
        aria-hidden="true"
      >
        <UserRound className="size-5" />
      </div>
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="truncate text-sm font-medium text-foreground">
          @{WALLET.username}
          {devMode && (
            <span className="ml-2 font-mono text-xs font-normal text-muted-foreground" title={WALLET.unifiedAddress}>
              {truncateMiddle(WALLET.unifiedAddress, 4, 4)}
            </span>
          )}
        </span>
        <span className="truncate text-xs tabular-nums text-muted-foreground">
          <span className="sr-only">Balance: </span>
          {amount(balance).label}
        </span>
      </div>
      <CryptoBadge tone="shielded" pulse className="ml-auto">
        <ShieldCheck className="size-3.5" aria-hidden="true" />
        {devMode ? 'Shielded Orchard Active' : 'Private'}
      </CryptoBadge>
    </div>
  )
}

const CURRENCIES: Currency[] = ['USD', 'ZEC']

function CurrencyToggle() {
  const { currency, setCurrency } = useProtocol()
  return (
    <div role="radiogroup" aria-label="Display currency" className="flex h-14 shrink-0 items-center gap-1 rounded-full bg-card p-1.5">
      {CURRENCIES.map((c) => {
        const selected = currency === c
        return (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setCurrency(c)}
            className={cn(
              'h-full rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              selected ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {c}
          </button>
        )
      })}
    </div>
  )
}

function ZecPricePill() {
  const { zecUsd, priceLive, priceLoading } = useProtocol()
  const status = priceLoading ? 'Loading rate' : priceLive ? 'Live rate' : 'Estimated rate'
  return (
    <div
      className="flex h-14 min-w-0 flex-1 items-center gap-2.5 rounded-full bg-card px-4 sm:flex-none"
      aria-live="polite"
    >
      <span className="relative flex size-2 shrink-0" aria-hidden="true">
        {priceLive && <span className="absolute inline-flex size-full animate-ping rounded-full bg-shielded opacity-60" />}
        <span className={cn('relative inline-flex size-2 rounded-full', priceLive ? 'bg-shielded' : 'bg-muted-foreground')} />
      </span>
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="whitespace-nowrap text-sm font-medium tabular-nums">
          1 $ZEC = {priceLoading ? '…' : formatUsd(zecUsd)}
        </span>
        <span className="text-xs text-muted-foreground">{status}</span>
      </span>
    </div>
  )
}

function ProtocolModeToggle() {
  const { devMode, setDevMode } = useProtocol()
  return (
    <label
      className={cn(
        'flex h-14 shrink-0 cursor-pointer items-center gap-2.5 rounded-full px-4 transition-colors',
        devMode ? 'bg-foreground text-background' : 'bg-card text-foreground',
      )}
    >
      <Code2 className="size-4 shrink-0" aria-hidden="true" />
      <span className="flex flex-col leading-tight">
        <span className="text-sm font-medium">Protocol</span>
        <span className={cn('hidden text-xs sm:block', devMode ? 'text-background/70' : 'text-muted-foreground')}>
          Dev mode
        </span>
      </span>
      <Switch checked={devMode} onCheckedChange={setDevMode} aria-label="Dev / Protocol Mode" />
    </label>
  )
}
