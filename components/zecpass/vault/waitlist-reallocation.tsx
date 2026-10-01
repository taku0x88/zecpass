'use client'

import { useEffect, useState } from 'react'
import { ArrowDown, ArrowRight, Check, Flame, Loader2, Shuffle, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getEvent, mockUnifiedAddress, truncateMiddle, type Ticket } from '@/lib/zk'
import { CryptoBadge, StateZone } from '../primitives'
import { useProtocol } from '../protocol-provider'

const QUEUE_SIZE = 8

const stages = [
  { icon: Flame, label: 'Note burned · nullifier revealed to treasury' },
  { icon: Shuffle, label: 'Shuffling encrypted waitlist pool' },
  { icon: UserCheck, label: 'Seat reassigned to verified fan' },
]

export function WaitlistReallocation({
  ticket,
  receipt,
  onDone,
}: {
  ticket: Ticket
  receipt: string
  onDone: () => void
}) {
  const event = getEvent(ticket.eventId)
  const { price } = useProtocol()
  const [queue] = useState(() => Array.from({ length: QUEUE_SIZE }, () => mockUnifiedAddress()))
  const [winner] = useState(() => Math.floor(Math.random() * QUEUE_SIZE))
  const [stage, setStage] = useState(0)
  const [cursor, setCursor] = useState(-1)

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    timers.push(setTimeout(() => setStage(1), 1200))

    const hops = 14
    for (let i = 0; i < hops; i++) {
      timers.push(
        setTimeout(
          () => setCursor(i === hops - 1 ? winner : Math.floor(Math.random() * QUEUE_SIZE)),
          1300 + i * 140 + i * i * 6,
        ),
      )
    }
    timers.push(setTimeout(() => setStage(2), 1300 + hops * 140 + hops * hops * 6 + 300))
    return () => timers.forEach(clearTimeout)
  }, [winner])

  const settled = stage === 2

  return (
    <StateZone
      zone="shielded"
      action={
        <CryptoBadge tone={settled ? 'shielded' : 'primary'} pulse={!settled}>
          {settled ? 'Reallocated' : 'Reallocating'}
        </CryptoBadge>
      }
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-balance text-4xl font-semibold leading-none tracking-tighter">
          Encrypted Waitlist Reallocation
        </h2>
        <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
          Row {ticket.row}, Seat {ticket.seat} is being re-issued to a randomly drawn fan. You never learn who — and
          they never learn you.
        </p>
      </div>

      <ol className="grid gap-2 md:grid-cols-3">
        {stages.map(({ icon: Icon, label }, i) => {
          const state = stage > i || (settled && i === 2) ? 'done' : stage === i ? 'active' : 'pending'
          return (
            <li
              key={label}
              className={cn(
                'flex items-center gap-3 rounded-3xl bg-secondary p-4 text-sm transition-all',
                state === 'active' && 'ring-1 ring-primary/50',
                state === 'pending' && 'opacity-50',
              )}
            >
              <span
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-full bg-muted',
                  state === 'done' && 'bg-shielded text-shielded-foreground',
                  state === 'active' && 'bg-primary text-primary-foreground',
                )}
              >
                {state === 'done' ? (
                  <Check className="size-4" aria-hidden="true" />
                ) : state === 'active' ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Icon className="size-4" aria-hidden="true" />
                )}
              </span>
              <span>{label}</span>
            </li>
          )
        })}
      </ol>

      <div className="grid gap-4 md:grid-cols-[1fr_auto_2fr] md:items-center">
        <div
          className={cn(
            'flex flex-col gap-2 rounded-3xl bg-background/60 p-5 transition-all duration-700',
            stage >= 1 && 'opacity-50',
          )}
        >
          <span className="text-xs text-muted-foreground">Burned note</span>
          <span className="text-3xl font-semibold tracking-tighter">
            R{String(ticket.row).padStart(2, '0')} · S{String(ticket.seat).padStart(2, '0')}
          </span>
          <code className="break-all font-mono text-xs text-destructive line-through">
            {truncateMiddle(ticket.nullifier, 12, 8)}
          </code>
          <span className="text-xs text-muted-foreground">
            receipt <code className="font-mono">{truncateMiddle(receipt, 8, 6)}</code>
          </span>
        </div>

        <ArrowRight className="hidden size-5 text-primary md:block" aria-hidden="true" />
        <ArrowDown className="mx-auto size-5 text-primary md:hidden" aria-hidden="true" />

        <ul className="grid grid-cols-2 gap-2" aria-label="Encrypted waitlist queue of shielded addresses">
          {queue.map((n, i) => {
            const active = cursor === i
            const isWinner = settled && i === winner
            return (
              <li
                key={n}
                className={cn(
                  'flex items-center gap-2 rounded-2xl bg-secondary px-3 py-2.5 font-mono text-[11px] transition-all duration-150',
                  active && !settled && 'bg-primary text-primary-foreground',
                  isWinner && 'bg-shielded text-shielded-foreground',
                  !active && !isWinner && 'text-muted-foreground',
                  settled && !isWinner && 'opacity-40',
                )}
              >
                <span className="opacity-60">{String(i).padStart(2, '0')}</span>
                <span className="truncate">{truncateMiddle(n, 6, 4)}</span>
                {isWinner && <Check className="ml-auto size-3.5 shrink-0" aria-hidden="true" />}
              </li>
            )
          })}
        </ul>
      </div>

      <div aria-live="polite" className="min-h-6">
        {settled && (
          <div className="flex flex-col gap-3 rounded-3xl bg-shielded/10 p-5 animate-in fade-in md:flex-row md:items-center md:justify-between">
            <p className="text-sm leading-relaxed">
              Seat handed off to waitlist fan{' '}
              <code className="font-mono text-shielded">{truncateMiddle(queue[winner], 10, 6)}</code>. Refund of{' '}
              {price(event.priceUsd).label} settled.
            </p>
            <Button variant="secondary" className="h-11 rounded-full px-6" onClick={onDone}>
              Close
            </Button>
          </div>
        )}
      </div>
    </StateZone>
  )
}
