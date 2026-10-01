'use client'

import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { ArrowRight, Braces, RefreshCw, TicketX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { getEvent, buildAdmissionPayload, type AdmissionPayload, type Ticket } from '@/lib/zk'
import { useProtocol } from '../protocol-provider'
import { CryptoBadge, ProtocolOnly, StateZone, TerminalLine, useCopy } from '../primitives'

const VALID_FOR_MS = 60_000
const RING_RADIUS = 47
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

export function AttendeePass() {
  const { ticket, setTab } = useProtocol()
  const pick = useCopy()

  if (!ticket) {
    return (
      <StateZone zone="shielded">
        <div className="flex flex-col items-center gap-5 py-14 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <TicketX className="size-6" aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-balance text-3xl font-semibold tracking-tighter">No pass to show yet</h3>
            <p className="max-w-sm text-pretty text-sm leading-relaxed text-muted-foreground">
              {pick(
                'Get a pass first and your live entry code will appear here.',
                'A dynamic admission proof can only be generated from an unspent ZecPass note in your vault.',
              )}
            </p>
          </div>
          <Button size="lg" className="h-12 rounded-full px-6 text-base" onClick={() => setTab('mint')}>
            Mint a Pass First
            <ArrowRight data-icon="inline-end" />
          </Button>
        </div>
      </StateZone>
    )
  }

  return <DynamicPass ticket={ticket} />
}

function DynamicPass({ ticket }: { ticket: Ticket }) {
  const event = getEvent(ticket.eventId)
  const [payload, setPayload] = useState<AdmissionPayload | null>(null)
  const [now, setNow] = useState(0)
  const [rotations, setRotations] = useState(0)
  const [inspectOpen, setInspectOpen] = useState(false)
  const pick = useCopy()

  useEffect(() => {
    let current = buildAdmissionPayload(ticket, VALID_FOR_MS)
    setPayload(current)
    setNow(Date.now())

    const id = setInterval(() => {
      const t = Date.now()
      if (t >= current.expiresAt) {
        current = buildAdmissionPayload(ticket, VALID_FOR_MS)
        setPayload(current)
        setRotations((r) => r + 1)
      }
      setNow(t)
    }, 250)
    return () => clearInterval(id)
  }, [ticket])

  const msLeft = payload ? Math.max(0, payload.expiresAt - now) : VALID_FOR_MS
  const secondsLeft = Math.ceil(msLeft / 1000)
  const progress = msLeft / VALID_FOR_MS
  const urgent = secondsLeft <= 10

  function regenerate() {
    setPayload(buildAdmissionPayload(ticket, VALID_FOR_MS))
    setNow(Date.now())
    setRotations((r) => r + 1)
  }

  return (
    <div className="grid gap-4 md:gap-6 lg:grid-cols-5">
      <StateZone zone="shielded" className="items-center gap-8 bg-dusk py-8 lg:col-span-3">
        <div className="relative flex items-center justify-center py-2">
          <svg viewBox="0 0 100 100" className="absolute size-72 -rotate-90 md:size-96" aria-hidden="true">
            <circle cx="50" cy="50" r={RING_RADIUS} fill="none" stroke="currentColor" strokeWidth="1.5" className="text-foreground/20" />
            <circle
              cx="50"
              cy="50"
              r={RING_RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={RING_CIRCUMFERENCE * (1 - progress)}
              className={cn(
                'transition-[stroke-dashoffset] duration-300',
                urgent ? 'text-primary' : 'text-foreground',
              )}
            />
          </svg>
          <div className="relative flex size-72 items-center justify-center md:size-96">
            <div
              key={payload?.nonce}
              className="animate-pulse-ring rounded-[1.75rem] bg-foreground p-4 text-background animate-in fade-in zoom-in-95"
            >
              {payload ? (
                <QRCodeSVG
                  value={JSON.stringify(payload)}
                  size={168}
                  level="L"
                  fgColor="currentColor"
                  bgColor="transparent"
                  aria-label="One-time zero-knowledge admission QR code"
                  role="img"
                />
              ) : (
                <div className="size-42" />
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 text-center">
          <p
            className={cn(
              'text-7xl font-semibold leading-none tracking-tighter tabular-nums',
              urgent ? 'text-primary' : 'text-foreground',
            )}
            aria-live="off"
          >
            00:{String(secondsLeft).padStart(2, '0')}
          </p>
          <p className="max-w-xs text-pretty text-sm leading-relaxed text-foreground/85 md:max-w-md">
            {pick(
              'Your code refreshes every 60 seconds, so screenshots won’t work.',
              'Generating one-time zero-knowledge admission proof from spend authority… Valid for 60s. Static screenshots will fail.',
            )}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          <ProtocolOnly>
            <Button
              className="h-11 rounded-full bg-background/85 px-5 text-foreground hover:bg-background"
              onClick={() => setInspectOpen(true)}
            >
              <Braces data-icon="inline-start" />
              Inspect signed payload
            </Button>
          </ProtocolOnly>
          <Button variant="ghost" className="h-11 rounded-full px-5 hover:bg-background/20" onClick={regenerate}>
            <RefreshCw data-icon="inline-start" />
            {pick('Refresh code', 'Rotate now')}
          </Button>
        </div>
      </StateZone>

      <section className="flex flex-col gap-5 rounded-[2rem] bg-card p-5 md:p-7 lg:col-span-2">
        <div className="flex flex-col gap-2">
          <span className="text-sm text-muted-foreground">Your pass</span>
          <h3 className="text-balance text-3xl font-semibold leading-none tracking-tighter">{event.title}</h3>
        </div>
        <div className="flex items-end gap-6">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Row</span>
            <span className="text-5xl font-semibold leading-none tracking-tighter tabular-nums">
              {String(ticket.row).padStart(2, '0')}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Seat</span>
            <span className="text-5xl font-semibold leading-none tracking-tighter tabular-nums">
              {String(ticket.seat).padStart(2, '0')}
            </span>
          </div>
          <span className="pb-1 text-sm text-muted-foreground">{ticket.tier}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <CryptoBadge tone="shielded" pulse>
            {pick('Ready to scan', 'Proof live')}
          </CryptoBadge>
          <ProtocolOnly>
            <CryptoBadge tone="muted">rotations: {rotations}</CryptoBadge>
          </ProtocolOnly>
        </div>
        <ProtocolOnly>
          <div className="flex flex-col gap-1.5 rounded-3xl bg-background/60 p-4 animate-in fade-in">
            <TerminalLine>derive rk ← ask + α (re-randomized)</TerminalLine>
            <TerminalLine>prove note in commitment tree (anchor)</TerminalLine>
            <TerminalLine>bind nonce + timestamp to spendAuthSig</TerminalLine>
            <TerminalLine>
              balance disclosed: <span className="text-shielded">none</span>
            </TerminalLine>
            <TerminalLine>
              identity disclosed: <span className="text-shielded">none</span>
            </TerminalLine>
          </div>
        </ProtocolOnly>
        <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
          {pick(
            'Show this code at the gate. Staff only see that your pass is valid. They never see your name, wallet or balance.',
            'Each code is signed by your spend authorization key with a fresh nonce. A shared screenshot is either expired or its nullifier is already marked spent at the gate.',
          )}
        </p>
      </section>

      <Sheet open={inspectOpen} onOpenChange={setInspectOpen}>
        <SheetContent side="right" className="w-full gap-0 sm:max-w-md!">
          <SheetHeader>
            <SheetTitle className="text-2xl tracking-tight">Signed ephemeral payload</SheetTitle>
            <SheetDescription>What the turnstile receives. No address, no balance, no name.</SheetDescription>
          </SheetHeader>
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 pb-4">
            <div className="flex items-center justify-between gap-2 font-mono text-[11px] text-muted-foreground">
              <span className="truncate">application/zecpass-admission+json</span>
              <span className={urgent ? 'text-primary' : 'text-shielded'}>ttl {secondsLeft}s</span>
            </div>
            <pre className="overflow-x-auto rounded-3xl bg-background p-4 font-mono text-[11px] leading-relaxed text-foreground/90">
              <PayloadJson payload={payload} />
            </pre>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function PayloadJson({ payload }: { payload: AdmissionPayload | null }) {
  if (!payload) return <span className="text-muted-foreground">{'// generating…'}</span>
  const entries = Object.entries(payload)
  return (
    <code className="whitespace-pre-wrap break-all">
      {'{\n'}
      {entries.map(([k, v], i) => (
        <span key={k}>
          {'  '}
          <span className="text-primary">{`"${k}"`}</span>
          {': '}
          <span className={typeof v === 'number' ? 'text-sage' : 'text-shielded'}>
            {typeof v === 'number' ? v : `"${v}"`}
          </span>
          {i < entries.length - 1 ? ',\n' : '\n'}
        </span>
      ))}
      {'}'}
    </code>
  )
}
