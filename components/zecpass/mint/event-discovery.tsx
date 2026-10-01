'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { CalendarDays, Check, MapPin, Scale, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { CATEGORIES, EVENTS, STATUS_COPY, type EventCategory, type ZecEvent } from '@/lib/zk'
import { useProtocol } from '../protocol-provider'
import { CryptoBadge } from '../primitives'

const STRIP_DAYS = ['2027-07-16', '2027-07-17', '2027-07-18', '2027-07-24', '2027-08-08']
const EVENT_DAYS = new Set(EVENTS.map((e) => e.day))

function isoToDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function dateToIso(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function dayParts(iso: string) {
  const date = isoToDate(iso)
  return {
    weekday: date.toLocaleDateString('en-GB', { weekday: 'short' }),
    day: date.toLocaleDateString('en-GB', { day: '2-digit' }),
    month: date.toLocaleDateString('en-GB', { month: 'short' }),
  }
}

export function EventDiscovery() {
  const { activeEvent, selectEvent, remainingFor } = useProtocol()
  const [day, setDay] = useState<string | null>(null)
  const [category, setCategory] = useState<EventCategory | 'all'>('all')
  const [calendarOpen, setCalendarOpen] = useState(false)

  const visible = useMemo(
    () => EVENTS.filter((e) => (!day || e.day === day) && (category === 'all' || e.category === category)),
    [day, category],
  )

  const pickedOffStrip = day && !STRIP_DAYS.includes(day) ? dayParts(day) : null

  return (
    <section aria-labelledby="discover-title" className="flex flex-col gap-5 rounded-[2rem] bg-card p-5 md:p-7">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">Event Discovery & Calendar</p>
          <h2 id="discover-title" className="text-balance text-4xl font-semibold leading-[0.95] tracking-tighter">
            Find your night
          </h2>
        </div>

        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger render={<Button variant="secondary" className="h-11 shrink-0 rounded-full px-4" />}>
            <CalendarDays data-icon="inline-start" />
            {pickedOffStrip ? `${pickedOffStrip.day} ${pickedOffStrip.month}` : 'Pick Date'}
          </PopoverTrigger>
          <PopoverContent align="end" className="w-auto rounded-3xl p-2">
            <Calendar
              mode="single"
              defaultMonth={isoToDate(day ?? STRIP_DAYS[1])}
              selected={day ? isoToDate(day) : undefined}
              onSelect={(date) => {
                setDay(date ? dateToIso(date) : null)
                setCalendarOpen(false)
              }}
              modifiers={{ hasEvent: [...EVENT_DAYS].map(isoToDate) }}
              modifiersClassNames={{ hasEvent: 'font-semibold text-primary' }}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="-mx-5 overflow-x-auto px-5 md:-mx-7 md:px-7 [scrollbar-width:none]">
        <div role="group" aria-label="Filter by date" className="flex w-max gap-2">
          <DateChip active={day === null} onClick={() => setDay(null)}>
            <span className="text-xs opacity-70">Every</span>
            <span className="text-2xl font-semibold leading-none tracking-tighter">All</span>
            <span className="text-xs opacity-70">Dates</span>
          </DateChip>
          {STRIP_DAYS.map((iso) => {
            const parts = dayParts(iso)
            return (
              <DateChip
                key={iso}
                active={day === iso}
                onClick={() => setDay(iso)}
                label={`${parts.weekday} ${parts.day} ${parts.month}`}
              >
                <span className="text-xs opacity-70">{parts.weekday}</span>
                <span className="text-2xl font-semibold leading-none tracking-tighter tabular-nums">{parts.day}</span>
                <span className="flex items-center gap-1 text-xs opacity-70">
                  {parts.month}
                  {EVENT_DAYS.has(iso) && <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />}
                </span>
              </DateChip>
            )
          })}
        </div>
      </div>

      <div className="-mx-5 overflow-x-auto px-5 md:-mx-7 md:px-7 [scrollbar-width:none]">
        <div role="group" aria-label="Filter by category" className="flex w-max gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={category === c.id}
              onClick={() => setCategory(c.id)}
              className={cn(
                'h-10 rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                category === c.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/70',
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-3xl bg-secondary p-5">
          <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
            No shielded drops match these filters yet.
          </p>
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => {
              setDay(null)
              setCategory('all')
            }}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="-mx-5 overflow-x-auto px-5 pb-1 md:mx-0 md:overflow-visible md:px-0 md:pb-0 [scrollbar-width:none]">
          <ul className="flex w-max snap-x snap-mandatory gap-3 md:grid md:w-full md:grid-cols-3">
            {visible.map((event) => (
              <li key={event.id} className="w-72 shrink-0 snap-start md:w-auto">
                <EventCard
                  event={event}
                  remaining={remainingFor(event.id)}
                  selected={event.id === activeEvent.id}
                  onSelect={() => selectEvent(event.id)}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

function DateChip({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean
  onClick: () => void
  label?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={label}
      onClick={onClick}
      className={cn(
        'flex w-16 flex-col items-center gap-1 rounded-3xl py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active ? 'bg-foreground text-background' : 'bg-secondary text-foreground hover:bg-secondary/70',
      )}
    >
      {children}
    </button>
  )
}

function EventCard({
  event,
  remaining,
  selected,
  onSelect,
}: {
  event: ZecEvent
  remaining: number
  selected: boolean
  onSelect: () => void
}) {
  const soldOut = event.status === 'waitlist'
  const { price } = useProtocol()
  const cost = price(event.priceUsd)

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        'group relative flex h-full w-full flex-col overflow-hidden rounded-[1.75rem] border-2 bg-secondary text-left transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        selected
          ? 'border-amber-500/50 shadow-[0_0_32px_-6px_rgb(245_158_11/0.45)]'
          : 'border-transparent hover:-translate-y-0.5 hover:border-amber-500/50 hover:shadow-[0_0_24px_-10px_rgb(245_158_11/0.4)]',
      )}
    >
      <div className="relative h-32 w-full">
        <Image
          src={event.image}
  alt=""
  fill
  loading="eager"
  sizes="(min-width: 768px) 30vw, 18rem"
          className={cn('object-cover transition-transform duration-500 group-hover:scale-105', soldOut && 'grayscale')}
        />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
          <CryptoBadge tone="ink" className={cn(event.status === 'sybil-queue' && 'text-shielded')}>
            {event.status === 'live' && <span className="size-1.5 animate-pulse rounded-full bg-primary" aria-hidden="true" />}
            {STATUS_COPY[event.status].label}
          </CryptoBadge>
          {selected && (
            <span className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Check className="size-4" aria-hidden="true" />
              <span className="sr-only">Selected</span>
            </span>
          )}
        </div>
      </div>

      <div className="relative flex items-center" aria-hidden="true">
        <span className="absolute -left-3 size-6 rounded-full bg-card" />
        <span className="mx-4 w-full border-t-2 border-dashed border-border" />
        <span className="absolute -right-3 size-6 rounded-full bg-card" />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4 pt-3">
        <div className="flex flex-col gap-1">
          <h3 className="text-pretty text-lg font-semibold leading-tight tracking-tight">{event.title}</h3>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span>{event.shortDate}</span>
            <span aria-hidden="true">·</span>
            <MapPin className="size-3.5" aria-hidden="true" />
            <span>{event.city}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <CryptoBadge tone="shielded" className="h-6 px-2.5">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            MEV Shielded
          </CryptoBadge>
          <CryptoBadge tone="primary" className="h-6 px-2.5">
            <Scale className="size-3.5" aria-hidden="true" />
            Fair Resale Capped
          </CryptoBadge>
        </div>
        <div className="mt-auto flex items-end justify-between gap-2">
          <p className="flex items-baseline gap-1">
            <span className="text-3xl font-semibold leading-none tracking-tighter tabular-nums">
              {cost.value}
            </span>
            <span className="text-xs text-muted-foreground">{cost.unit}</span>
          </p>
          <p className={cn('text-xs font-medium', soldOut ? 'text-destructive' : 'text-muted-foreground')}>
            {soldOut ? '100% Sold Out' : `${remaining.toLocaleString('en-US')} left`}
          </p>
        </div>
      </div>
    </button>
  )
}
