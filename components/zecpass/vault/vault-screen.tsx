'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { ArrowRight, TicketX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getEvent, deriveBurnReceipt, sleep, truncateMiddle, type Ticket } from '@/lib/zk'
import { useProtocol } from '../protocol-provider'
import { StateZone } from '../primitives'
import { TicketCard } from './ticket-card'
import { FairRefund } from './fair-refund'
import { WaitlistReallocation } from './waitlist-reallocation'

type Phase = 'idle' | 'burning' | 'reallocating'

export function VaultScreen() {
  const { ticket, burnTicket, setTab, devMode, price } = useProtocol()
  const [phase, setPhase] = useState<Phase>('idle')
  const [burned, setBurned] = useState<{ ticket: Ticket; receipt: string } | null>(null)

  async function handleBurn() {
    if (!ticket || phase !== 'idle') return
    const snapshot = ticket
    const event = getEvent(snapshot.eventId)
    setPhase('burning')
    const [receipt] = await Promise.all([deriveBurnReceipt(snapshot), sleep(1600)])
    burnTicket()
    setBurned({ ticket: snapshot, receipt })
    setPhase('reallocating')
    toast.success(`+${price(event.priceUsd).label} refunded to your shielded address`, {
      description: devMode
        ? `Burn receipt ${truncateMiddle(receipt, 8, 6)} · Orchard · 1 confirmation`
        : 'Your seat is going to the next fan in line.',
    })
  }

  if (phase === 'reallocating' && burned) {
    return (
      <WaitlistReallocation
        ticket={burned.ticket}
        receipt={burned.receipt}
        onDone={() => {
          setPhase('idle')
          setBurned(null)
        }}
      />
    )
  }

  if (!ticket) {
    return (
      <StateZone zone="shielded">
        <div className="flex flex-col items-center gap-5 py-14 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <TicketX className="size-6" aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-balance text-3xl font-semibold tracking-tighter">No passes yet</h2>
            <p className="max-w-sm text-pretty text-sm leading-relaxed text-muted-foreground">
              {devMode
                ? 'Your wallet holds no ZecPass notes. Mint one at face value from the primary box office.'
                : 'Get a pass at face value from the box office and it will show up here.'}
            </p>
          </div>
          <Button size="lg" className="h-12 rounded-full px-6 text-base" onClick={() => setTab('mint')}>
            Go to Box Office
            <ArrowRight data-icon="inline-end" />
          </Button>
        </div>
      </StateZone>
    )
  }

  return (
    <div className="grid gap-4 md:gap-6 lg:grid-cols-5">
      <div className="flex flex-col gap-4 md:gap-6 lg:col-span-3">
        <StateZone zone="shielded">
          <TicketCard ticket={ticket} burning={phase === 'burning'} />
        </StateZone>
      </div>
      <FairRefund className="lg:col-span-2" ticket={ticket} burning={phase === 'burning'} onBurn={handleBurn} />
    </div>
  )
}
