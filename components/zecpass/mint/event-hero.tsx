'use client'

import Image from 'next/image'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { STATUS_COPY } from '@/lib/zk'
import { useProtocol } from '../protocol-provider'
import { CryptoBadge, ZoneLabel, useCopy } from '../primitives'

export function EventHero({ className }: { className?: string }) {
  const { activeEvent: event, remaining, price } = useProtocol()
  const pick = useCopy()
  const sold = event.totalSupply - remaining
  const pct = (remaining / event.totalSupply) * 100
  const soldOut = event.status === 'waitlist'

  return (
    <section
      aria-labelledby="event-title"
      aria-live="polite"
      className={cn('relative flex flex-col overflow-hidden rounded-[2rem] bg-card', className)}
    >
      <div
        key={event.id}
        className="relative isolate flex min-h-[26rem] flex-col gap-6 p-6 pb-14 animate-in fade-in duration-500 md:min-h-[30rem] md:p-8 md:pb-16"
      >
        <Image
          src={event.image}
          alt={event.imageAlt}
          fill
  loading="eager"
  fetchPriority="high"
  sizes="(min-width: 1024px) 60vw, 100vw"
          className={cn('-z-20 object-cover', soldOut && 'grayscale-[60%]')}
        />
        <div className="absolute inset-0 -z-10 bg-dusk-veil" aria-hidden="true" />

        <div className="flex flex-wrap gap-2">
          <CryptoBadge tone="ink" className={cn(event.status === 'sybil-queue' && 'text-shielded')}>
            {STATUS_COPY[event.status].label}
          </CryptoBadge>
          {soldOut ? (
            <CryptoBadge tone="ink" className="text-destructive">
              100% Sold Out
            </CryptoBadge>
          ) : (
            <CryptoBadge tone="ink" className="text-shielded">
              {pick('100% Private', '100% Shielded')}
            </CryptoBadge>
          )}
        </div>

        <div className="mt-auto flex flex-col gap-2">
          <h2 id="event-title" className="text-lg font-medium text-foreground/90">
            {event.title} <span className="text-foreground/70">· {event.subtitle}</span>
          </h2>
          <p className="flex flex-col font-semibold leading-[0.85] tracking-tighter">
            <span className="text-8xl tabular-nums md:text-9xl">{event.dayMonth}</span>
            <span className="text-6xl md:text-7xl">{event.weekday}</span>
          </p>
        </div>

        <div className="flex items-end gap-3">
          <span className="text-4xl font-semibold leading-none tracking-tighter tabular-nums">{event.doorsTime}</span>
          <span className="text-sm font-medium leading-tight text-foreground/85">
            Doors open {event.timezone} · {event.year}
            <br />
            {event.venue}, {event.city}
          </span>
        </div>
      </div>

      <div className="relative -mt-8 flex flex-col gap-5 rounded-[2rem] bg-card p-5 md:p-7">
        <ZoneLabel zone="public" />
        <dl className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <dt className="text-sm text-muted-foreground">Face value</dt>
            <dd className="flex items-baseline gap-1.5">
              <span className="text-5xl font-semibold tracking-tighter tabular-nums text-primary">
                {price(event.priceUsd).value}
              </span>
              <span className="text-sm text-muted-foreground">{price(event.priceUsd).unit}</span>
            </dd>
            <dd className="text-xs text-muted-foreground">Strictly capped</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-sm text-muted-foreground">Remaining</dt>
            <dd className="flex items-baseline gap-1.5">
              <span className={cn('text-5xl font-semibold tracking-tighter tabular-nums', soldOut && 'text-muted-foreground')}>
                {remaining.toLocaleString('en-US')}
              </span>
              <span className="text-sm text-muted-foreground">/ {event.totalSupply.toLocaleString('en-US')}</span>
            </dd>
            {soldOut ? (
              <dd className="text-xs font-medium text-destructive">(Sold Out – Fair Waitlist Active)</dd>
            ) : (
              <dd className="text-xs text-muted-foreground">{`${sold.toLocaleString('en-US')} passes issued`}</dd>
            )}
          </div>
        </dl>
        <div className="flex flex-col gap-2">
          <Progress
            value={pct}
            aria-label="Remaining ticket supply"
            className="h-2 rounded-full [&_[data-slot=progress-indicator]]:rounded-full [&_[data-slot=progress-indicator]]:bg-primary"
          />
          <div className="flex justify-between gap-2 text-xs text-muted-foreground">
            <span>
              {soldOut
                ? pick('Seats return only when a fan refunds', 'Seats return only via burn-and-refund')
                : pick('Fixed supply · no resale markups', 'Supply cap enforced by issuer key')}
            </span>
            <span className="tabular-nums">{pct.toFixed(1)}% available</span>
          </div>
        </div>
      </div>
    </section>
  )
}
