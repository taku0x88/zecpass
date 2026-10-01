'use client'

import { Flame, RotateCcw, Shuffle, Wallet, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { getEvent, truncateMiddle, type Ticket } from '@/lib/zk'
import { useProtocol } from '../protocol-provider'

export function BurnConfirmDialog({
  open,
  ticket,
  onCancel,
  onConfirm,
}: {
  open: boolean
  ticket: Ticket
  onCancel: () => void
  onConfirm: () => void
}) {
  const event = getEvent(ticket.eventId)
  const { price } = useProtocol()
  const refund = price(event.priceUsd).label
  const consequences = [
    {
      icon: Flame,
      title: 'Your pass is destroyed',
      body: `Row ${ticket.row}, Seat ${ticket.seat} is burned back to the protocol treasury. This can't be undone.`,
      tone: 'text-destructive',
    },
    {
      icon: Wallet,
      title: `You get ${refund} back`,
      body: 'The full face value lands privately in your shielded wallet. No fees, no markup.',
      tone: 'text-shielded',
    },
    {
      icon: Shuffle,
      title: 'Your seat goes to another fan',
      body: 'It is handed to a randomly drawn, verified fan on the encrypted waitlist. You can’t pick who.',
      tone: 'text-primary',
    },
  ]

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent
        showCloseButton={false}
        className="gap-5 rounded-[2rem] bg-card p-6 ring-destructive/25 sm:max-w-md"
      >
        <div className="flex flex-col gap-3">
          <span className="flex size-12 items-center justify-center rounded-full bg-destructive/15 text-destructive">
            <TriangleAlert className="size-5" aria-hidden="true" />
          </span>
          <DialogTitle className="text-balance text-3xl font-semibold leading-none tracking-tighter">
            Burn this pass for good?
          </DialogTitle>
          <DialogDescription className="text-pretty leading-relaxed">
            You&apos;re about to give up your ticket to {event.title}. Here&apos;s exactly what happens next:
          </DialogDescription>
        </div>

        <ul className="flex flex-col gap-2">
          {consequences.map(({ icon: Icon, title, body, tone }) => (
            <li key={title} className="flex gap-3 rounded-3xl bg-secondary p-4">
              <Icon className={`mt-0.5 size-5 shrink-0 ${tone}`} aria-hidden="true" />
              <div className="flex flex-col gap-1">
                <span className="font-semibold leading-tight">{title}</span>
                <span className="text-pretty text-sm leading-relaxed text-muted-foreground">{body}</span>
              </div>
            </li>
          ))}
        </ul>

        <p className="text-center font-mono text-xs text-muted-foreground">
          note {truncateMiddle(ticket.noteHash, 8, 6)} → treasury.zecpass
        </p>

        <div className="flex flex-col gap-2">
          <Button size="lg" className="h-14 rounded-full text-base font-semibold" onClick={onCancel}>
            <RotateCcw className="size-4" aria-hidden="true" />
            Keep my ticket
          </Button>
          <Button
            size="lg"
            variant="ghost"
            className="h-14 rounded-full bg-destructive/15 text-base font-semibold text-destructive hover:bg-destructive/25 hover:text-destructive"
            onClick={onConfirm}
          >
            <Flame className="size-4" aria-hidden="true" />
            Yes, burn &amp; refund {refund}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
