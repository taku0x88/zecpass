'use client'

import { useState } from 'react'
import { Check, Copy, Eye, Lock, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { truncateMiddle } from '@/lib/zk'
import { useProtocol } from './protocol-provider'

export function useDevMode() {
  return useProtocol().devMode
}

/** Renders protocol internals only when Dev / Protocol Mode is on. */
export function ProtocolOnly({ children }: { children: React.ReactNode }) {
  return useDevMode() ? <>{children}</> : null
}

/** Picks consumer copy by default and protocol copy in Dev / Protocol Mode. */
export function useCopy() {
  const devMode = useDevMode()
  return <T,>(consumer: T, protocol: T) => (devMode ? protocol : consumer)
}

type Zone = 'public' | 'shielded'

const zoneCopy: Record<Zone, { label: string; protocolLabel: string; hint: string }> = {
  public: { label: 'Public', protocolLabel: 'Public State', hint: 'anyone can see' },
  shielded: { label: 'Private', protocolLabel: 'Shielded State', hint: 'only you can see' },
}

export function ZoneLabel({ zone, className }: { zone: Zone; className?: string }) {
  const devMode = useDevMode()
  const Icon = zone === 'public' ? Eye : Lock
  return (
    <div
      className={cn(
        'inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium',
        zone === 'public' ? 'bg-public/12 text-public' : 'bg-shielded/12 text-shielded',
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      <span>{devMode ? zoneCopy[zone].protocolLabel : zoneCopy[zone].label}</span>
      <span className="font-normal text-muted-foreground">{'· '}{zoneCopy[zone].hint}</span>
    </div>
  )
}

export function StateZone({
  zone,
  children,
  className,
  action,
}: {
  zone: Zone
  children: React.ReactNode
  className?: string
  action?: React.ReactNode
}) {
  return (
    <section
      className={cn(
        'relative flex flex-col gap-5 rounded-[2rem] border bg-card p-5 md:p-7',
        zone === 'public' ? 'border-dashed border-public/30' : 'border-transparent',
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ZoneLabel zone={zone} />
        {action}
      </div>
      {children}
    </section>
  )
}

type Tone = 'shielded' | 'primary' | 'public' | 'destructive' | 'muted' | 'ink'

const toneClasses: Record<Tone, string> = {
  shielded: 'bg-shielded/12 text-shielded',
  primary: 'bg-primary/12 text-primary',
  public: 'bg-public/12 text-public',
  destructive: 'bg-destructive/12 text-destructive',
  muted: 'bg-muted text-muted-foreground',
  ink: 'bg-background/85 text-foreground backdrop-blur',
}

export function CryptoBadge({
  tone = 'primary',
  children,
  pulse,
  className,
}: {
  tone?: Tone
  children: React.ReactNode
  pulse?: boolean
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-medium whitespace-nowrap',
        toneClasses[tone],
        className,
      )}
    >
      {pulse && (
        <span className="relative flex size-1.5" aria-hidden="true">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-60" />
          <span className="relative inline-flex size-1.5 rounded-full bg-current" />
        </span>
      )}
      {children}
    </span>
  )
}

export function Chip({ icon: Icon, children, className }: { icon?: LucideIcon; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 rounded-full bg-muted px-3.5 py-2 text-sm font-medium', className)}>
      {Icon && <Icon className="size-4 text-muted-foreground" aria-hidden="true" />}
      {children}
    </span>
  )
}

export function StatTile({
  label,
  value,
  unit,
  className,
}: {
  label: string
  value: React.ReactNode
  unit?: string
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-1 rounded-3xl bg-secondary p-4', className)}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="flex items-baseline gap-1">
        <span className="text-2xl font-semibold tracking-tight tabular-nums">{value}</span>
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </dd>
    </div>
  )
}

export function HashField({
  label,
  value,
  prefix = '',
  truncate = true,
}: {
  label: string
  value: string
  prefix?: string
  truncate?: boolean
}) {
  const [copied, setCopied] = useState(false)
  const full = `${prefix}${value}`
  const display = truncate ? truncateMiddle(full, 14, 10) : full

  async function copy() {
    await navigator.clipboard?.writeText(full).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2 rounded-2xl bg-background/60 px-3.5 py-2.5">
        <code className="min-w-0 flex-1 break-all font-mono text-xs text-foreground/90">{display}</code>
        <button
          type="button"
          onClick={copy}
          className="shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
          aria-label={`Copy ${label}`}
        >
          {copied ? <Check className="size-3.5 text-shielded" /> : <Copy className="size-3.5" />}
        </button>
      </div>
    </div>
  )
}

export function TerminalLine({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn('font-mono text-xs leading-relaxed text-muted-foreground', className)}>
      <span className="text-primary" aria-hidden="true">
        {'> '}
      </span>
      {children}
    </p>
  )
}
