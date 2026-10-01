'use client'

import { useState } from 'react'
import { ArrowLeft, Check, Loader2, LogOut, Undo2, UserX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { domainHash } from '@/lib/crypto'
import { truncateMiddle, type ZecEvent } from '@/lib/zk'
import { useProtocol } from '../protocol-provider'

const EXIT_STEPS = ['Revealing exit nullifier for your queue slot', 'Releasing shielded escrow note']

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function LeaveWaitlistDialog({
  open,
  event,
  position,
  onOpenChange,
  onLeft,
}: {
  open: boolean
  event: ZecEvent
  position: number | null
  onOpenChange: (open: boolean) => void
  onLeft: () => void
}) {
  const [step, setStep] = useState<number | null>(null)
  const [nullifier, setNullifier] = useState<string | null>(null)
  const leaving = step !== null
  const { price } = useProtocol()
  const deposit = price(event.priceUsd).label

  const terms = [
    {
      icon: Undo2,
      title: `${deposit} comes straight back`,
      body: 'The full escrow deposit returns to your shielded address. No cancellation fee.',
      tone: 'text-shielded',
    },
    {
      icon: UserX,
      title: `You give up position #${position ?? '—'}`,
      body: 'Your blind commitment is removed from the queue. Rejoining later puts you at the back.',
      tone: 'text-primary',
    },
  ]

  async function handleConfirm() {
    setStep(0)
    const hashPromise = domainHash('waitlist-exit', event.id)
    for (let i = 1; i <= EXIT_STEPS.length; i++) {
      await sleep(700)
      setStep(i)
    }
    setNullifier(await hashPromise)
    await sleep(350)
    onLeft()
    setStep(null)
    setNullifier(null)
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !leaving && onOpenChange(next)}>
      <DialogContent showCloseButton={false} className="gap-5 rounded-[2rem] bg-card p-6 ring-destructive/25 sm:max-w-md">
        <div className="flex flex-col gap-3">
          <span className="flex size-12 items-center justify-center rounded-full bg-destructive/15 text-destructive">
            <LogOut className="size-5" aria-hidden="true" />
          </span>
          <DialogTitle className="text-balance text-3xl font-semibold leading-none tracking-tighter">
            {leaving ? 'Leaving the queue' : 'Leave the waitlist?'}
          </DialogTitle>
          <DialogDescription className="text-pretty leading-relaxed">
            {leaving
              ? 'Removing your spot and returning your deposit privately.'
              : `You're currently waiting for a ${event.title} pass. Here's what happens if you leave:`}
          </DialogDescription>
        </div>

        {leaving ? (
          <ol className="flex flex-col gap-2" aria-live="polite">
            {EXIT_STEPS.map((label, i) => {
              const done = step > i
              const active = step === i
              return (
                <li
                  key={label}
                  className={`flex items-center gap-3 rounded-3xl bg-secondary p-4 text-sm transition-opacity ${
                    done || active ? 'opacity-100' : 'opacity-40'
                  }`}
                >
                  {done ? (
                    <Check className="size-4 shrink-0 text-shielded" aria-hidden="true" />
                  ) : (
                    <Loader2 className={`size-4 shrink-0 text-primary ${active ? 'animate-spin' : ''}`} aria-hidden="true" />
                  )}
                  <span className={done ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
                </li>
              )
            })}
            <li className="pt-1 text-center font-mono text-xs text-muted-foreground">
              {nullifier ? `nf ${truncateMiddle(nullifier, 10, 8)}` : 'computing SHA-256 exit nullifier…'}
            </li>
          </ol>
        ) : (
          <>
            <ul className="flex flex-col gap-2">
              {terms.map(({ icon: Icon, title, body, tone }) => (
                <li key={title} className="flex gap-3 rounded-3xl bg-secondary p-4">
                  <Icon className={`mt-0.5 size-5 shrink-0 ${tone}`} aria-hidden="true" />
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold leading-tight">{title}</span>
                    <span className="text-pretty text-sm leading-relaxed text-muted-foreground">{body}</span>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex flex-col gap-2">
              <Button
                size="lg"
                variant="destructive"
                className="h-14 rounded-full text-base font-semibold"
                onClick={handleConfirm}
              >
                <LogOut className="size-4" aria-hidden="true" />
                Leave &amp; refund {deposit}
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="h-14 rounded-full text-base font-semibold"
                onClick={() => onOpenChange(false)}
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                Keep my spot
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
