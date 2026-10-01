'use client'

import { useState } from 'react'
import { Lock, Ticket as TicketIcon, Users } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { getEvent, truncateMiddle, type Ticket } from '@/lib/zk'
import { Chip, CryptoBadge, HashField, ProtocolOnly, useCopy } from '../primitives'
import { useProtocol } from '../protocol-provider'

const pad = (n: number) => String(n).padStart(2, '0')

export function TicketCard({ ticket, burning }: { ticket: Ticket; burning?: boolean }) {
  const [reveal, setReveal] = useState(false)
  const event = getEvent(ticket.eventId)
  const pick = useCopy()
  const { price } = useProtocol()

  return (
    <div className="flex flex-col gap-4">
      <article
        aria-label={`${event.title} ticket, row ${ticket.row}, seat ${ticket.seat}`}
        className={cn(
          'relative overflow-hidden rounded-[2rem] bg-secondary shadow-2xl shadow-primary/10 transition-all duration-1000',
          burning && 'scale-95 opacity-0 blur-sm saturate-0',
        )}
      >
        <div className="relative isolate flex flex-col gap-8 bg-ember p-6 text-primary-foreground md:p-7">
          <div className="pointer-events-none absolute inset-0 -z-10 animate-holo bg-holo opacity-70 mix-blend-overlay" aria-hidden="true" />
          <div className="flex items-start justify-between gap-3">
            <span className="text-sm font-medium opacity-75">
              {pick('ZecPass · Admission', 'ZecPass · Shielded Admission')}
            </span>
            <CryptoBadge tone="ink" pulse className="text-shielded">
              {pick('Valid', 'Unspent')}
            </CryptoBadge>
          </div>
          <h2 className="text-balance text-5xl font-semibold leading-[0.9] tracking-tighter md:text-6xl">{event.title}</h2>
          <div className="flex items-end justify-between gap-4">
            <div className="flex items-end gap-3">
              <span className="text-4xl font-semibold leading-none tracking-tighter tabular-nums">{event.doorsTime}</span>
              <span className="text-sm font-medium leading-tight opacity-75">
                {event.date}
                <br />
                Wembley Stadium
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-semibold leading-none tracking-tighter">1</span>
              <span className="text-sm font-medium opacity-75">pass</span>
            </div>
          </div>
        </div>

        <div className="relative h-0" aria-hidden="true">
          <span className="absolute -top-4 -left-4 size-8 rounded-full bg-card" />
          <span className="absolute -top-4 -right-4 size-8 rounded-full bg-card" />
          <span className="absolute inset-x-6 top-0 border-t-2 border-dashed border-card/60" />
        </div>

        <div className="flex flex-col gap-6 p-6 md:p-7">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Row</span>
              <span className="text-6xl font-semibold leading-none tracking-tighter tabular-nums">{pad(ticket.row)}</span>
            </div>
            <div className="flex flex-1 items-center gap-2 pt-5" aria-hidden="true">
              <span className="flex-1 border-t-2 border-dotted border-muted-foreground/40" />
              <TicketIcon className="size-5 text-primary" />
              <span className="flex-1 border-t-2 border-dotted border-muted-foreground/40" />
            </div>
            <div className="flex flex-col items-end">
              <span className="text-sm text-muted-foreground">Seat</span>
              <span className="text-6xl font-semibold leading-none tracking-tighter tabular-nums">{pad(ticket.seat)}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Chip icon={Users}>{ticket.tier}</Chip>
            <Chip icon={Lock}>Non-transferable</Chip>
            <Chip>{price(event.priceUsd).label} face</Chip>
          </div>

          <ProtocolOnly>
            <div className="flex flex-col gap-1 animate-in fade-in">
              <span className="text-xs text-muted-foreground">ZSA Asset ID</span>
              <code className="break-all font-mono text-xs leading-relaxed text-primary">{ticket.assetId}</code>
            </div>
          </ProtocolOnly>
        </div>
      </article>

      <ProtocolOnly>
      <div className="flex flex-col gap-4 rounded-3xl bg-background/60 p-4 animate-in fade-in">
        <label className="flex cursor-pointer items-center justify-between gap-4">
          <span className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">Show raw cryptographic details</span>
            <span className="text-xs text-muted-foreground">Only decryptable with your full viewing key</span>
          </span>
          <Switch checked={reveal} onCheckedChange={setReveal} />
        </label>

        {reveal ? (
          <div className="grid gap-3 animate-in fade-in slide-in-from-top-1 md:grid-cols-2">
            <HashField label="Shielded Commitment Hash (cmx)" value={ticket.commitment} />
            <HashField label="Diversified Receiver (Orchard UA)" value={ticket.receiver} prefix="" />
            <HashField label="Ticket Note Hash" value={ticket.noteHash} />
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground">Issuance Height</span>
              <div className="rounded-2xl bg-background/60 px-3.5 py-2.5 font-mono text-xs tabular-nums">
                #{ticket.issuanceHeight.toLocaleString('en-US')}
              </div>
            </div>
          </div>
        ) : (
          <p className="font-mono text-xs text-muted-foreground">
            {'cmx: '}
            {truncateMiddle(ticket.commitment, 6, 4).replace(/[0-9a-f]/g, '•')}
            {'  ·  pk_d: ••••••  ·  height: ••••••'}
          </p>
        )}
      </div>
      </ProtocolOnly>
    </div>
  )
}
