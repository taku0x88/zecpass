'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, Check, Fingerprint, Loader2, ShieldCheck, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import {
  deriveExternalNullifier,
  deriveIssuanceTxid,
  mintTicket,
  randomHex,
  sleep,
  truncateMiddle,
  type Ticket,
} from '@/lib/zk'
import { useProtocol } from '../protocol-provider'
import { CryptoBadge, HashField, useCopy } from '../primitives'

type StepOutput = { label: string; value: string }

const STEPS = [
  { title: 'Simulating blind identity attestation…', done: 'Blind identity attested' },
  { title: 'Encrypting payment memo to the venue viewing key…', done: 'Memo encrypted to venue IVK' },
  { title: 'Broadcasting shielded note issuance (IssueAction ZIP 227)…', done: 'IssueAction confirmed in block' },
]

const SYBIL_STEPS = [
  STEPS[0],
  { title: 'Querying spent identity-nullifier set…', done: 'Identity nullifier already spent' },
]

export type MintMode = 'mint' | 'sybil'

export function MintDialog({
  open,
  mode,
  onOpenChange,
}: {
  open: boolean
  /** Latched when the dialog opens: `sybil` replays an identity that already minted for this event. */
  mode: MintMode
  onOpenChange: (open: boolean) => void
}) {
  const { issueTicket, setTab, activeEvent: event, ticket: heldPass, price } = useProtocol()
  const pick = useCopy()
  const [step, setStep] = useState(0)
  const [outputs, setOutputs] = useState<StepOutput[]>([])
  const [minted, setMinted] = useState<Ticket | null>(null)
  const [rejectedNullifier, setRejectedNullifier] = useState<string | null>(null)
  const spentNullifier = heldPass?.eventId === event.id ? heldPass.externalNullifier : null

  useEffect(() => {
    if (!open) return
    let cancelled = false

    async function run() {
      setStep(0)
      setOutputs([])
      setMinted(null)
      setRejectedNullifier(null)

      const [derived] = await Promise.all([deriveExternalNullifier(event), sleep(1400)])
      if (cancelled) return
      // A Sybil replay derives the same blind identity, so it collides with the already-spent nullifier.
      const externalNullifier = mode === 'sybil' && spentNullifier ? spentNullifier : derived
      setOutputs([{ label: 'External nullifier · SHA-256 (32 bytes)', value: externalNullifier }])
      setStep(1)

      if (mode === 'sybil') {
        await sleep(1400)
        if (cancelled) return
        setOutputs((o) => [
          ...o,
          { label: 'Nullifier set lookup', value: `match found · spent at height ${heldPass?.issuanceHeight ?? '—'}` },
        ])
        setStep(2)
        setRejectedNullifier(externalNullifier)
        toast.error('Mint rejected · 1 pass per human', {
          description: `Identity nullifier ${truncateMiddle(externalNullifier, 2, 3)} is already spent.`,
        })
        return
      }

      await sleep(1500)
      if (cancelled) return
      setOutputs((o) => [...o, { label: 'Encrypted memo ciphertext (ChaCha20-Poly1305)', value: randomHex(40) }])
      setStep(2)

      const [ticket] = await Promise.all([mintTicket(event, externalNullifier), sleep(1700)])
      const txid = await deriveIssuanceTxid(ticket)
      if (cancelled) return
      setOutputs((o) => [...o, { label: 'Issuance txid · SHA-256', value: txid }])
      setStep(3)
      setMinted(ticket)
      issueTicket(ticket)
    }

    run()
    return () => {
      cancelled = true
    }
    // `mode` is latched on open; ticket/event changes mid-run must not restart the sequence.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, issueTicket])

  const complete = step === 3 && minted
  const rejected = Boolean(rejectedNullifier)
  const steps = mode === 'sybil' ? SYBIL_STEPS : STEPS
  const settled = Boolean(complete) || rejected

  return (
    <Dialog open={open} onOpenChange={(next) => (settled || !next ? onOpenChange(next) : undefined)}>
      <DialogContent
        className="max-h-[92dvh] gap-5 overflow-y-auto rounded-[2rem] p-5 sm:max-w-lg md:p-7"
        showCloseButton={settled}
      >
        <DialogHeader className="text-left">
          <span className={cn('text-sm font-medium', rejected ? 'text-destructive' : 'text-primary')}>
            {rejected ? pick('One pass per person', 'Sybil rate-limiter') : pick('Checkout', 'Shielded mint')}
          </span>
          <DialogTitle className="text-balance text-3xl font-semibold leading-none tracking-tighter">
            {rejected
              ? pick('Purchase Declined', 'Mint Rejected')
              : complete
                ? pick('Your pass is ready', 'Pass minted to your shielded balance')
                : pick('Buying Your Pass', 'Minting Shielded Pass')}
          </DialogTitle>
          <DialogDescription>
            {event.title} · {price(event.priceUsd).label} · 1 of 1 per human
          </DialogDescription>
        </DialogHeader>

        <ol className="flex flex-col gap-2" aria-live="polite">
          {steps.map((s, i) => {
            const failed = rejected && i === steps.length - 1
            const state = failed ? 'failed' : step > i ? 'done' : step === i ? 'active' : 'pending'
            return (
              <li
                key={s.title}
                className={cn(
                  'flex flex-col gap-2 rounded-3xl bg-secondary p-4 transition-all',
                  state === 'active' && 'ring-1 ring-primary/50',
                  state === 'failed' && 'bg-destructive/10 ring-1 ring-destructive/50',
                  state === 'pending' && 'opacity-50',
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      'flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold',
                      state === 'done' && 'bg-shielded text-shielded-foreground',
                      state === 'active' && 'bg-primary text-primary-foreground',
                      state === 'failed' && 'bg-destructive text-foreground',
                    )}
                  >
                    {state === 'failed' ? (
                      <X className="size-4" aria-hidden="true" />
                    ) : state === 'done' ? (
                      <Check className="size-4" aria-hidden="true" />
                    ) : state === 'active' ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    ) : (
                      i + 1
                    )}
                  </span>
                  <span className={cn('text-sm font-medium', state === 'failed' && 'text-destructive')}>
                    {state === 'done' || state === 'failed' ? s.done : s.title}
                  </span>
                </div>
                {outputs[i] && (
                  <div className="flex flex-col gap-1 pl-11 animate-in fade-in slide-in-from-top-1">
                    <span className="text-xs text-muted-foreground">{outputs[i].label}</span>
                    <code className="break-all font-mono text-[11px] leading-relaxed text-foreground/80">
                      {outputs[i].value}
                    </code>
                  </div>
                )}
              </li>
            )
          })}
        </ol>

        {rejectedNullifier && (
          <div
            role="alert"
            className="flex flex-col gap-4 rounded-3xl bg-destructive p-5 text-foreground animate-in fade-in zoom-in-95"
          >
            <div className="flex items-start gap-3">
              <Fingerprint className="mt-0.5 size-6 shrink-0" aria-hidden="true" />
              <p className="text-pretty text-base font-medium leading-relaxed">
                <span className="font-semibold">Mint Rejected:</span> Identity nullifier{' '}
                <code className="rounded-md bg-background/25 px-1.5 py-0.5 font-mono text-sm">
                  {truncateMiddle(rejectedNullifier, 2, 3)}
                </code>{' '}
                already spent for {event.title}. 1 pass per human policy enforced.
              </p>
            </div>
            <p className="text-pretty text-sm leading-relaxed text-foreground/85">
              No ZEC left your wallet. The blind attestation matched a nullifier that is already in the spent set, so
              the IssueAction was never built. Extra wallets don&apos;t help, because the nullifier comes from the
              person, not the address.
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="h-12 w-full rounded-full text-base font-semibold"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
        )}

        {complete && (
          <div className="flex flex-col gap-4 rounded-3xl bg-shielded/10 p-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-shielded">
                <ShieldCheck className="size-5" aria-hidden="true" />
                <span className="font-medium">Saved to Private Shielded Balance</span>
              </div>
              <CryptoBadge tone="shielded">Note #1</CryptoBadge>
            </div>
            <HashField label="Derived Ticket Note Hash" value={minted.noteHash} />
            <HashField label="ZSA Asset ID" value={minted.assetId} />
            <Button
              size="lg"
              className="h-12 w-full rounded-full text-base font-semibold"
              onClick={() => {
                onOpenChange(false)
                setTab('vault')
              }}
            >
              View Pass in Vault
              <ArrowRight data-icon="inline-end" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
