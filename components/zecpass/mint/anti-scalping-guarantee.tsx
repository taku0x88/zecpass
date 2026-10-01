'use client'

import { Fingerprint, Gauge, ShieldOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProtocolOnly, useCopy } from '../primitives'

const features = [
  {
    icon: ShieldOff,
    tag: 'MEMPOOL::SEALED',
    title: { consumer: 'No Bot Sniping', protocol: 'Sealed Mempool' },
    body: {
      consumer: 'Bots can’t see or jump ahead of your purchase while it’s processing.',
      protocol:
        'Zero MEV bot frontrunning inside the Orchard pool. Pending mints are encrypted notes — bots cannot see, reorder, or snipe them.',
    },
    surface: 'bg-sage text-sage-foreground',
  },
  {
    icon: Fingerprint,
    tag: 'SYBIL::NULLIFIER',
    title: { consumer: 'One Per Person', protocol: 'Sybil Rate-Limiter' },
    body: {
      consumer: 'Every real fan gets one ticket. A second try is blocked, without revealing who you are.',
      protocol:
        '1 ticket per human via blind identity nullifiers. A second attestation from the same person collides and is rejected — without revealing who they are.',
    },
    surface: 'bg-foreground text-background',
  },
  {
    icon: Gauge,
    tag: 'PRICE::CAP_1.50',
    title: { consumer: 'Face Value, Always', protocol: 'Strict Price Cap' },
    body: {
      consumer: 'No resale markups, ever. Can’t make it? Get a 100% fair refund instead.',
      protocol:
        'Protocol-level restriction preventing secondary markups. Transfers are disabled; the only exit is a burn back to the treasury at face value.',
    },
    surface: 'bg-primary text-primary-foreground',
  },
]

export function AntiScalpingGuarantee() {
  const pick = useCopy()
  return (
    <section aria-labelledby="guarantee-heading" className="flex flex-col gap-5 rounded-[2rem] bg-card p-3 md:p-5">
      <div className="flex flex-col gap-2 px-3 pt-3 md:flex-row md:items-end md:justify-between md:px-2 md:pt-2">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-primary">{pick('Our promise', 'Protocol guarantees')}</span>
          <h2 id="guarantee-heading" className="text-balance text-3xl font-semibold tracking-tighter md:text-4xl">
            Anti-Scalping Guarantee
          </h2>
        </div>
        <p className="max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
          {pick(
            'Built into the ticket itself, not buried in the terms of service.',
            'Enforced by circuit constraints and ZSA issuance rules — not by terms of service.',
          )}
        </p>
      </div>
      <ul className="flex flex-col md:grid md:grid-cols-3 md:gap-3">
        {features.map(({ icon: Icon, tag, title, body, surface }, i) => (
          <li
            key={tag}
            className={cn(
              'relative flex flex-col gap-4 rounded-[1.75rem] p-6',
              surface,
              i > 0 && '-mt-8 md:mt-0',
              i < features.length - 1 && 'pb-14 md:pb-6',
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-2">
                <ProtocolOnly>
                  <span className="font-mono text-[11px] tracking-wider opacity-60">{tag}</span>
                </ProtocolOnly>
                <h3 className="text-2xl font-semibold leading-none tracking-tight">
                  {pick(title.consumer, title.protocol)}
                </h3>
              </div>
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-background text-foreground">
                <Icon className="size-5" aria-hidden="true" />
              </div>
            </div>
            <p className="text-pretty text-sm leading-relaxed opacity-80">{pick(body.consumer, body.protocol)}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
