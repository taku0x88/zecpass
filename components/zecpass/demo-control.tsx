'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Check, Loader2, SlidersHorizontal, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type DemoPreset, useProtocol } from './protocol-provider'

const presets: { id: DemoPreset; letter: string; title: string; description: string; attack?: boolean }[] = [
  { id: 'fresh', letter: 'A', title: 'Fresh Buyer', description: 'Empty vault · can mint a pass' },
  { id: 'holder', letter: 'B', title: 'Active Ticket Holder', description: 'Holds a pass · view or burn for refund' },
  { id: 'gate', letter: 'C', title: 'Venue Turnstile Gate', description: 'Bouncer scanner · scanning in guests' },
  {
    id: 'sybil',
    letter: 'D',
    title: 'Duplicate / Sybil Rejection',
    description: 'Second mint, same identity · rejected',
    attack: true,
  },
  {
    id: 'fraud',
    letter: 'E',
    title: 'Turnstile Fraud Attempt',
    description: 'Screenshot / replayed QR · denied at gate',
    attack: true,
  },
]

export function DemoControl() {
  const { applyPreset, activePreset } = useProtocol()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState<DemoPreset | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  async function select(preset: (typeof presets)[number]) {
    setPending(preset.id)
    await applyPreset(preset.id)
    setPending(null)
    setOpen(false)
    toast(`State ${preset.letter}: ${preset.title}`, { description: preset.description })
  }

  return (
    <div
      ref={rootRef}
      className="fixed right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 flex flex-col items-end gap-3 md:right-6 md:bottom-6"
    >
      {open && (
        <div
          id="demo-control-panel"
          role="dialog"
          aria-label="Demo Control"
          className="w-[min(21rem,calc(100vw-2rem))] rounded-[1.75rem] border bg-popover p-2 shadow-2xl shadow-background animate-in fade-in slide-in-from-bottom-2"
        >
          <div className="flex items-start justify-between gap-3 px-3 pt-2 pb-3">
            <div className="flex flex-col gap-0.5">
              <p className="text-base font-semibold tracking-tight">Demo Control</p>
              <p className="text-xs text-muted-foreground">Jump the protocol into a preset state</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Close demo control"
            >
              <X className="size-4" />
            </button>
          </div>
          <ul className="flex max-h-[min(28rem,calc(100dvh-12rem))] flex-col gap-1 overflow-y-auto">
            {presets.map((preset, index) => {
              const active = activePreset === preset.id
              const firstAttack = preset.attack && !presets[index - 1]?.attack
              return (
                <li key={preset.id} className="flex flex-col gap-1">
                  {firstAttack && (
                    <span className="px-3 pt-3 pb-1 text-xs font-medium text-destructive">Attack simulations</span>
                  )}
                  <button
                    type="button"
                    onClick={() => select(preset)}
                    disabled={pending !== null}
                    aria-pressed={active}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-3xl p-3 text-left transition-colors hover:bg-secondary disabled:opacity-60',
                      active && 'bg-secondary',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                        active
                          ? preset.attack
                            ? 'bg-destructive text-foreground'
                            : 'bg-primary text-primary-foreground'
                          : preset.attack
                            ? 'bg-destructive/15 text-destructive'
                            : 'bg-muted text-foreground',
                      )}
                      aria-hidden="true"
                    >
                      {pending === preset.id ? <Loader2 className="size-4 animate-spin" /> : preset.letter}
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="text-sm font-medium">
                        State {preset.letter}: {preset.title}
                      </span>
                      <span className="text-xs text-muted-foreground">{preset.description}</span>
                    </span>
                    {active && (
                      <Check
                        className={cn('ml-auto size-4 shrink-0', preset.attack ? 'text-destructive' : 'text-primary')}
                        aria-hidden="true"
                      />
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
      <button
        type="button"
        aria-expanded={open}
        aria-controls="demo-control-panel"
        onClick={() => setOpen((o) => !o)}
        aria-label="Demo Control"
        className="flex size-12 items-center justify-center gap-2 rounded-full bg-foreground text-sm font-semibold text-background shadow-2xl shadow-background transition-transform hover:scale-[1.03] active:scale-95 md:h-11 md:w-auto md:pr-5 md:pl-4"
      >
        <SlidersHorizontal className="size-4" aria-hidden="true" />
        <span className="hidden md:inline">Demo Control</span>
      </button>
    </div>
  )
}
