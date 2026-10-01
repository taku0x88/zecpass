'use client'

import { useState } from 'react'
import { Ban, Repeat } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getEvent, type Ticket } from '@/lib/zk'
import { ProtocolOnly, TerminalLine, useCopy } from '../primitives'
import { useProtocol } from '../protocol-provider'
import { BurnConfirmDialog } from './burn-confirm-dialog'
import { SwipeToConfirm } from './swipe-to-confirm'

const rules = [
  { consumer: 'Resell to a stranger', protocol: 'Transfer to chosen buyer', allowed: false },
  { consumer: 'Sell above face value', protocol: 'Resale above face value', allowed: false },
  { consumer: 'Return for a full refund', protocol: 'Burn to treasury at face value', allowed: true },
]

export function FairRefund({
  className,
  ticket,
  burning,
  onBurn,
}: {
  className?: string
  ticket: Ticket
  burning: boolean
  onBurn: () => void
}) {
  const event = getEvent(ticket.eventId)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [swipeKey, setSwipeKey] = useState(0)
  const pick = useCopy()
  const { price } = useProtocol()
  const refund = price(event.priceUsd)

  return (
    <section
      aria-labelledby="refund-heading"
      className={cn('flex flex-col gap-5 rounded-[2rem] bg-card p-5 md:p-7', className)}
    >
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-primary">{pick('No scalpers', 'Secondary market: disabled')}</span>
        <h2 id="refund-heading" className="text-balance text-3xl font-semibold leading-none tracking-tighter">
          {pick('Can’t Go? 100% Fair Refund', 'Cannot Attend? Protocol Fair Refund')}
        </h2>
      </div>

      <div className="flex items-end gap-3">
        <span className="text-6xl font-semibold leading-none tracking-tighter tabular-nums">
          {refund.value}
        </span>
        <span className="pb-1 text-sm leading-tight text-muted-foreground">
          {refund.unit} back
          <br />
          100% face value
        </span>
      </div>

      <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
        {pick(
          `Passes can't be resold, so scalpers can't profit. Return yours for the full ${refund.label} and your seat goes to the next fan on the waitlist.`,
          `To kill ticket scalping, peer-to-peer transfers are disabled. If you cannot go, burn your ticket back to the protocol treasury to receive a 100% face-value refund (${refund.label}). Your seat is automatically reassigned to the next verified fan in the encrypted waitlist pool.`,
        )}
      </p>

      <ul className="flex flex-col gap-1.5">
        {rules.map(({ consumer, protocol, allowed }) => (
          <li key={protocol} className="flex items-center gap-3 rounded-2xl bg-secondary px-4 py-3 text-sm">
            {allowed ? (
              <Repeat className="size-4 shrink-0 text-shielded" aria-hidden="true" />
            ) : (
              <Ban className="size-4 shrink-0 text-destructive" aria-hidden="true" />
            )}
            <span>{pick(consumer, protocol)}</span>
            <span className={cn('ml-auto text-xs font-semibold', allowed ? 'text-shielded' : 'text-destructive')}>
              {allowed ? 'Allowed' : pick('Blocked', 'Rejected')}
            </span>
          </li>
        ))}
      </ul>

      <ProtocolOnly>
      <div className="flex flex-col gap-1.5 rounded-3xl bg-background/60 p-4 animate-in fade-in">
        <TerminalLine>
          burn target: <span className="text-foreground">treasury.zecpass (BurnAction)</span>
        </TerminalLine>
        <TerminalLine>
          refund: <span className="text-shielded">{refund.label} → your Orchard UA</span>
        </TerminalLine>
        <TerminalLine>
          reassignment: <span className="text-foreground">random draw · encrypted waitlist</span>
        </TerminalLine>
      </div>
      </ProtocolOnly>

      <div className="mt-auto">
        <SwipeToConfirm
          key={swipeKey}
          label={`Burn Pass & Claim ${refund.label} Refund`}
          busyLabel={pick('Processing refund…', 'Generating burn proof…')}
          busy={burning}
          onConfirm={() => setConfirmOpen(true)}
        />
      </div>

      <BurnConfirmDialog
        open={confirmOpen}
        ticket={ticket}
        onCancel={() => {
          setConfirmOpen(false)
          setSwipeKey((k) => k + 1)
        }}
        onConfirm={() => {
          setConfirmOpen(false)
          onBurn()
        }}
      />
    </section>
  )
}
