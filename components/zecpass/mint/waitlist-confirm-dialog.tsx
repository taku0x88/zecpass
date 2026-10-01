'use client'

import { useState } from 'react'
import { Check, Loader2, LockKeyhole, RotateCcw, Shuffle, Undo2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { domainHash } from '@/lib/crypto'
import { truncateMiddle, type ZecEvent } from '@/lib/zk'
import { useProtocol } from '../protocol-provider'

const COMMIT_STEPS = [
  'Deriving blind identity nullifier',
  'Shielding deposit into private escrow',
  'Inserting commitment into reallocation queue',
]

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function WaitlistConfirmDialog({
  open,
  event,
  onOpenChange,
  onJoined,
}: {
  open: boolean
  event: ZecEvent
  onOpenChange: (open: boolean) => void
  onJoined: (commitment: string) => void
}) {
  const [step, setStep] = useState<number | null>(null)
  const [commitment, setCommitment] = useState<string | null>(null)
  const committing = step !== null
  const { price } = useProtocol()
  const deposit = price(event.priceUsd).label

  const terms = [
    {
      icon: LockKeyhole,
      title: `${deposit} goes into private escrow`,
      body: 'Your deposit is shielded. Nobody can see who paid or how much is in your wallet.',
      tone: 'text-shielded',
    },
    {
      icon: Shuffle,
      title: 'You get the next burned pass',
      body: 'When a holder burns their ticket for a refund, the blind nullifier queue gives it to the next verified fan. No bidding, no markup.',
      tone: 'text-primary',
    },
    {
      icon: Undo2,
      title: 'Auto-refund if no seat frees up',
      body: `If no seat comes back before doors open, the full ${deposit} is returned to your shielded address.`,
      tone: 'text-foreground',
    },
  ]

  async function handleConfirm() {
    setStep(0)
    const hashPromise = domainHash('waitlist-commitment', event.id)
    for (let i = 1; i <= COMMIT_STEPS.length; i++) {
      await sleep(750)
      setStep(i)
    }
    const hash = await hashPromise
    setCommitment(hash)
    await sleep(350)
    onJoined(hash)
    setStep(null)
    setCommitment(null)
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !committing && onOpenChange(next)}>
      <DialogContent showCloseButton={false} className="gap-5 rounded-[2rem] bg-card p-6 ring-primary/25 sm:max-w-md">
        <div className="flex flex-col gap-3">
          <span className="flex size-12 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Users className="size-5" aria-hidden="true" />
          </span>
          <DialogTitle className="text-balance text-3xl font-semibold leading-none tracking-tighter">
            {committing ? 'Joining the blind queue' : 'Join the waitlist?'}
          </DialogTitle>
          <DialogDescription className="text-pretty leading-relaxed">
            {committing
              ? `Joining the ${event.title} waitlist without revealing who you are.`
              : `${event.title} is sold out. Here's exactly what happens when you join:`}
          </DialogDescription>
        </div>

        {committing ? (
          <ol className="flex flex-col gap-2" aria-live="polite">
            {COMMIT_STEPS.map((label, i) => {
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
                    <Loader2
                      className={`size-4 shrink-0 text-primary ${active ? 'animate-spin' : ''}`}
                      aria-hidden="true"
                    />
                  )}
                  <span className={done ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
                </li>
              )
            })}
            <li className="pt-1 text-center font-mono text-xs text-muted-foreground">
              {commitment ? `cm ${truncateMiddle(commitment, 10, 8)}` : 'computing SHA-256 commitment…'}
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
              <Button size="lg" className="h-14 rounded-full text-base font-semibold" onClick={handleConfirm}>
                <LockKeyhole className="size-4" aria-hidden="true" />
                Confirm &amp; escrow {deposit}
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="h-14 rounded-full text-base font-semibold"
                onClick={() => onOpenChange(false)}
              >
                <RotateCcw className="size-4" aria-hidden="true" />
                Not now
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
