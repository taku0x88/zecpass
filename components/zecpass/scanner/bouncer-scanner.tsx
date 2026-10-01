'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Database, Loader2, ScanLine, ShieldAlert, ShieldCheck, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { randomHex, sleep, truncateMiddle } from '@/lib/zk'
import { useProtocol } from '../protocol-provider'
import { CryptoBadge, StateZone, useCopy } from '../primitives'

type ScanResult =
  | { kind: 'idle' }
  | { kind: 'scanning'; check: number }
  | { kind: 'granted'; row: number; seat: number; nullifier: string }
  | { kind: 'denied'; reason: DenyReason; nullifier: string; failedCheck?: number }

type LogEntry = { id: string; ok: boolean; nullifier: string; time: string; note: string }
type DenyReason = 'spent' | 'fraud'

const CHECKS = {
  consumer: ['Pass is genuine', 'Code is fresh (under 60s)', 'Not already used'],
  protocol: ['Verify halo2 proof', 'Check timestamp window (≤ 60s)', 'Query nullifier set'],
}
const CHECK_COUNT = CHECKS.protocol.length
const REASONS: Record<DenyReason, { consumer: string; protocol: string }> = {
  spent: {
    consumer: 'This pass was already used at Gate B.',
    protocol: 'Ticket Nullifier already spent at Turnstile Gate B.',
  },
  fraud: {
    consumer: 'Screenshot detected. This code has expired or was already used.',
    protocol: 'Ephemeral proof timestamp expired (>60s) or Nullifier already redeemed at Gate A.',
  },
}

const VENUE_SEES: { consumer: string; protocol: string; visible: boolean }[] = [
  { consumer: 'Pass is valid', protocol: 'Proof validity', visible: true },
  { consumer: 'One-time entry code', protocol: 'Nullifier (unlinkable)', visible: true },
  { consumer: 'Your name or wallet', protocol: 'Wallet address', visible: false },
  { consumer: 'Your balance', protocol: 'Shielded balance', visible: false },
  { consumer: 'Purchase history', protocol: 'Purchase history', visible: false },
]

export function BouncerScanner() {
  const { ticket, admitted, markAdmitted, scenario, devMode } = useProtocol()
  const pick = useCopy()
  const [result, setResult] = useState<ScanResult>({ kind: 'idle' })
  const [log, setLog] = useState<LogEntry[]>([])
  const [alarm, setAlarm] = useState(0)
  const autoScanned = useRef(false)

  const busy = result.kind === 'scanning'

  async function runChecks(stopAt = CHECK_COUNT) {
    for (let i = 0; i < stopAt; i++) {
      setResult({ kind: 'scanning', check: i })
      await sleep(550)
    }
  }

  function deny(reason: DenyReason, nullifier: string, note: string, failedCheck?: number) {
    setResult({ kind: 'denied', reason, nullifier, failedCheck })
    setAlarm((a) => a + 1)
    pushLog({ ok: false, nullifier, note })
  }

  async function scanFraud() {
    const nullifier = ticket?.nullifier ?? randomHex(32)
    // Fails at the timestamp window: a screenshot carries a proof minted more than 60s ago.
    await runChecks(2)
    deny('fraud', nullifier, 'screenshot replay', 1)
    toast.error('Fraud attempt blocked at Gate A', {
      description: 'Static screenshot replay: stale proof and redeemed nullifier.',
    })
  }

  // State E arrives on a freshly mounted scanner; the ref keeps Strict Mode from firing the scan twice.
  useEffect(() => {
    if (scenario !== 'fraud' || autoScanned.current) return
    const t = setTimeout(() => {
      autoScanned.current = true
      scanFraud()
    }, 500)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario])

  function pushLog(entry: Omit<LogEntry, 'id' | 'time'>) {
    const time = new Date().toLocaleTimeString('en-GB', { hour12: false })
    setLog((l) => [{ ...entry, id: randomHex(6), time }, ...l].slice(0, 6))
  }

  async function scanValid() {
    const nullifier = ticket ? ticket.nullifier : randomHex(32)
    await runChecks()
    if (ticket && admitted) {
      deny('spent', nullifier, 'replay of admitted pass')
      return
    }
    const row = ticket?.row ?? 4
    const seat = ticket?.seat ?? 12
    setResult({ kind: 'granted', row, seat, nullifier })
    pushLog({ ok: true, nullifier, note: `R${row} S${seat}` })
    if (ticket) markAdmitted()
  }

  async function scanDuplicate() {
    const nullifier = ticket?.nullifier ?? randomHex(32)
    await runChecks()
    deny('spent', nullifier, 'duplicate / expired')
  }

  return (
    <div className="grid gap-4 md:gap-6 lg:grid-cols-5">
      {alarm > 0 && (
        <div
          key={alarm}
          className="pointer-events-none fixed inset-0 z-40 animate-alarm bg-destructive/25 shadow-[inset_0_0_0_6px_var(--destructive)]"
          aria-hidden="true"
        />
      )}
      <section className="flex flex-col gap-4 rounded-[2rem] bg-card p-3 md:p-5 lg:col-span-3">
        <div className="flex items-center justify-between gap-2 px-2 pt-2">
          <span className="text-sm text-muted-foreground">Turnstile Gate A · Wembley</span>
          <CryptoBadge tone={busy ? 'primary' : 'shielded'} pulse>
            {busy ? 'Verifying' : 'Armed'}
          </CryptoBadge>
        </div>

        <div className="flex items-center gap-2 self-start rounded-full bg-secondary px-3 py-1.5 text-xs text-muted-foreground mx-2">
          <Database className="size-3.5 shrink-0 text-shielded" aria-hidden="true" />
          {devMode ? (
            <span>
              Cached Merkle Root: <span className="font-mono text-foreground">Height #2,841,902</span>{' '}
              <span className="text-shielded">(Sync verified locally)</span>
            </span>
          ) : (
            <span>
              Pass list saved on device · <span className="text-shielded">works offline</span>
            </span>
          )}
        </div>

        <Viewfinder result={result} devMode={devMode} />

        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            size="lg"
            onClick={scanValid}
            disabled={busy}
            className="h-14 rounded-full bg-shielded text-base font-semibold text-shielded-foreground hover:bg-shielded/90"
          >
            <ScanLine data-icon="inline-start" />
            Simulate Scan Valid Ticket
          </Button>
          <Button
            size="lg"
            onClick={scanDuplicate}
            disabled={busy}
            className="h-14 rounded-full bg-destructive text-base font-semibold text-foreground hover:bg-destructive/90"
          >
            <ShieldAlert data-icon="inline-start" />
            Simulate Duplicate / Expired Pass
          </Button>
        </div>
      </section>

      <div className="flex flex-col gap-4 md:gap-6 lg:col-span-2">
        <StateZone zone="public">
          <div className="flex flex-col gap-1">
            <h3 className="text-2xl font-semibold tracking-tight">What the venue learns</h3>
            <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
              {pick(
                'Only whether the pass is valid. Nothing about who you are.',
                'A single bit — valid or not — plus the spent nullifier to block replays.',
              )}
            </p>
          </div>
          <ul className="flex flex-col gap-1.5 text-sm">
            {VENUE_SEES.map((item) => (
              <li key={item.protocol} className="flex items-center justify-between rounded-2xl bg-secondary px-4 py-3">
                <span>{pick(item.consumer, item.protocol)}</span>
                <span className={cn('text-xs font-semibold', item.visible ? 'text-public' : 'text-shielded')}>
                  {item.visible ? pick('Shared', 'Revealed') : pick('Hidden', 'Shielded')}
                </span>
              </li>
            ))}
          </ul>
        </StateZone>

        <section className="flex flex-col gap-3 rounded-[2rem] bg-card p-5 md:p-7" aria-labelledby="gate-log">
          <h3 id="gate-log" className="text-sm font-medium text-muted-foreground">
            {pick('Gate log', 'Gate log · spent nullifier set')}
          </h3>
          {log.length === 0 ? (
            <p className="font-mono text-xs text-muted-foreground">{'> awaiting first scan…'}</p>
          ) : (
            <ul className="flex flex-col gap-2" aria-live="polite">
              {log.map((e) => (
                <li key={e.id} className="flex items-center gap-2 font-mono text-[11px] animate-in fade-in slide-in-from-top-1">
                  {e.ok ? (
                    <Check className="size-3.5 shrink-0 text-shielded" aria-hidden="true" />
                  ) : (
                    <X className="size-3.5 shrink-0 text-destructive" aria-hidden="true" />
                  )}
                  <span className="text-muted-foreground">{e.time}</span>
                  {devMode ? <span className="truncate">{truncateMiddle(e.nullifier, 6, 4)}</span> : null}
                  <span className={cn('ml-auto shrink-0', e.ok ? 'text-shielded' : 'text-destructive')}>{e.note}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

function Viewfinder({ result, devMode }: { result: ScanResult; devMode: boolean }) {
  const checks = devMode ? CHECKS.protocol : CHECKS.consumer
  const tone =
    result.kind === 'granted' ? 'border-shielded' : result.kind === 'denied' ? 'border-destructive' : 'border-foreground'

  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[1.75rem] bg-background sm:aspect-[4/3]">
      <div className="absolute inset-0 bg-terminal-grid" aria-hidden="true" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,var(--background)_95%)]" aria-hidden="true" />

      <div className="absolute inset-x-[20%] top-[12%] bottom-[40%] sm:inset-x-[26%] sm:bottom-[38%]" aria-hidden="true">
        {[
          'top-0 left-0 border-t-4 border-l-4 rounded-tl-3xl',
          'top-0 right-0 border-t-4 border-r-4 rounded-tr-3xl',
          'bottom-0 left-0 border-b-4 border-l-4 rounded-bl-3xl',
          'bottom-0 right-0 border-b-4 border-r-4 rounded-br-3xl',
        ].map((pos) => (
          <span key={pos} className={cn('absolute size-10 transition-colors', pos, tone)} />
        ))}
        {(result.kind === 'idle' || result.kind === 'scanning') && (
          <span className="absolute inset-x-3 h-0.5 animate-scanline rounded-full bg-primary shadow-[0_0_16px_var(--primary)]" />
        )}
      </div>

      <div className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full bg-card/80 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur">
        <span className="inline-block size-1.5 animate-pulse rounded-full bg-destructive" aria-hidden="true" />
        CAM-01 · live
      </div>

      <div className="absolute inset-x-3 bottom-3" aria-live="polite">
        {result.kind === 'idle' && (
          <p className="text-center text-sm text-muted-foreground">Align attendee QR within frame</p>
        )}
        {result.kind === 'scanning' && (
          <ul className="flex flex-col gap-1.5 rounded-3xl bg-card/90 p-4 backdrop-blur">
            {checks.map((c, i) => (
              <li key={c} className={cn('flex items-center gap-2 text-sm', i > result.check && 'opacity-40')}>
                {i < result.check ? (
                  <Check className="size-4 text-shielded" aria-hidden="true" />
                ) : i === result.check ? (
                  <Loader2 className="size-4 animate-spin text-primary" aria-hidden="true" />
                ) : (
                  <span className="size-4" />
                )}
                {c}
              </li>
            ))}
          </ul>
        )}
        {result.kind === 'granted' && (
          <div className="flex items-start gap-3 rounded-3xl bg-shielded p-5 text-shielded-foreground animate-in fade-in zoom-in-95">
            <ShieldCheck className="size-7 shrink-0" aria-hidden="true" />
            <div className="flex min-w-0 flex-col gap-1">
              <p className="text-xl font-semibold leading-tight tracking-tight">
                Access Granted: Row {result.row}, Seat {result.seat}.
              </p>
              <p className="text-sm font-medium">
                {devMode ? 'Identity & Balance: 100% Shielded.' : 'Your identity stays private.'}
              </p>
              {devMode ? (
                <p className="truncate font-mono text-[11px] opacity-70">
                  nullifier {truncateMiddle(result.nullifier, 10, 6)} → marked spent
                </p>
              ) : null}
            </div>
          </div>
        )}
        {result.kind === 'denied' && (
          <div className="flex items-start gap-3 rounded-3xl bg-destructive p-5 text-foreground animate-in fade-in zoom-in-95">
            <ShieldAlert className="size-7 shrink-0" aria-hidden="true" />
            <div className="flex min-w-0 flex-col gap-1">
              <p className="text-xl font-semibold leading-tight tracking-tight">Access Denied</p>
              <p className="text-sm font-medium">{REASONS[result.reason][devMode ? 'protocol' : 'consumer']}</p>
              {result.failedCheck !== undefined && (
                <p className="text-xs font-medium opacity-85">Failed check: {checks[result.failedCheck]}</p>
              )}
              {devMode ? (
                <p className="truncate font-mono text-[11px] opacity-80">
                  double-spend prevented · {truncateMiddle(result.nullifier, 10, 6)}
                </p>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
