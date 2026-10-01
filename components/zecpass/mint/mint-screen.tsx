'use client'

import { useState } from 'react'
import { ArrowRight, Check, Fingerprint, Lock, LogOut, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useProtocol } from '../protocol-provider'
import { CryptoBadge, ProtocolOnly, StatTile, StateZone, TerminalLine, useCopy } from '../primitives'
import { EventDiscovery } from './event-discovery'
import { EventHero } from './event-hero'
import { AntiScalpingGuarantee } from './anti-scalping-guarantee'
import { MintDialog, type MintMode } from './mint-dialog'
import { WaitlistConfirmDialog } from './waitlist-confirm-dialog'
import { LeaveWaitlistDialog } from './leave-waitlist-dialog'

export function MintScreen() {
  const {
    ticket,
    ticketEvent,
    setTab,
    balance,
    activeEvent: event,
    isWaitlisted,
    waitlistPositionFor,
    joinWaitlist,
    leaveWaitlist,
    scenario,
    price,
    amount,
    usdToZec,
  } = useProtocol()
  // The screen remounts on every demo preset, so State D can open straight into the Sybil replay.
  const [open, setOpen] = useState(scenario === 'sybil')
  const [mintMode, setMintMode] = useState<MintMode>(scenario === 'sybil' ? 'sybil' : 'mint')
  const [waitlistOpen, setWaitlistOpen] = useState(false)
  const [leaveOpen, setLeaveOpen] = useState(false)
  const pick = useCopy()

  function openMint(mode: MintMode) {
    setMintMode(mode)
    setOpen(true)
  }

  const ownsThisPass = ticket?.eventId === event.id
  const holdsOtherPass = Boolean(ticket) && !ownsThisPass
  const soldOut = event.status === 'waitlist'
  const waitlisted = isWaitlisted(event.id)
  const position = waitlistPositionFor(event.id)
  const faceValue = price(event.priceUsd)
  const deposit = faceValue.label
  const canAffordDeposit = balance >= usdToZec(event.priceUsd)
  const fee = amount(0.0001)

  function handleJoined() {
    const pos = joinWaitlist(event.id)
    setWaitlistOpen(false)
    toast.success(`Joined encrypted waitlist at Position #${pos}.`, {
      description: 'Your ZEC is held in private escrow and will auto-refund if unfulfilled.',
      classNames: { toast: '!bg-shielded !text-shielded-foreground', description: '!text-shielded-foreground/85' },
    })
  }

  function handleLeft() {
    const refund = leaveWaitlist(event.id)
    setLeaveOpen(false)
    toast.success(`+${amount(refund).label} refunded to your shielded address`, {
      description: `You've left the ${event.title} waitlist. Your queue slot has been released.`,
      classNames: { toast: '!bg-shielded !text-shielded-foreground', description: '!text-shielded-foreground/85' },
    })
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <EventDiscovery />

      <div className="grid gap-4 md:gap-6 lg:grid-cols-5">
        <EventHero className="lg:col-span-3" />

        <StateZone zone="shielded" className="lg:col-span-2">
          <div className="flex flex-col gap-3">
            <h2 className="text-balance text-4xl font-semibold leading-[0.95] tracking-tighter">
              {soldOut
                ? pick('Join the Fair Waitlist', 'Join Encrypted Waitlist Pool')
                : pick('Get Your Pass', 'Mint Shielded Pass')}
            </h2>
            <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
              {soldOut
                ? pick(
                                          `Sold out. Hold a ${deposit} deposit to join the line. If a fan returns their pass, it goes to the next person in line. You get your deposit back if no seat frees up.`,
                    `Primary allocation sold out. Deposit ${deposit} into the shielded burn-and-refund pool. When an existing pass holder burns their ticket for a refund, the protocol's blind nullifier queue automatically assigns it to the next verified fan.`,
                  )
                : event.status === 'sybil-queue'
                  ? pick(
                      'The fair queue is open. One spot per real person, so bots with a thousand wallets still count as zero.',
                      'The Sybil queue is open. Your blind attestation joins a fair queue, so bots with a thousand wallets still count as zero humans.',
                    )
                  : pick(
                      'One pass per person, always at face value. Your payment stays private.',
                      'One pass per person, always at face value. Your payment and identity stay private. The venue only learns that one real fan bought one ticket.',
                    )}
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-2">
            <StatTile label={soldOut ? 'Escrow deposit' : 'Face value'} value={faceValue.value} unit={faceValue.unit} />
            {soldOut ? (
              <StatTile label="Your position" value={position ? `#${position}` : '—'} unit="in queue" />
            ) : (
              <StatTile label="Per person" value="1" unit="pass" />
            )}
            {soldOut ? (
              <StatTile label="Pool size" value={(event.waitlistSize + (waitlisted ? 1 : 0)).toLocaleString('en-US')} unit="fans" />
            ) : (
              <StatTile label="Network fee" value={fee.value} unit={fee.unit} />
            )}
            <StatTile label="Your balance" value={amount(balance).value} unit={amount(balance).unit} />
          </dl>

          <ProtocolOnly>
          <div className="flex flex-col gap-1.5 rounded-3xl bg-background/60 p-4 animate-in fade-in">
            <TerminalLine>
              payer identity: <span className="text-shielded">hidden</span>
            </TerminalLine>
            <TerminalLine>
              {soldOut ? 'pool entry: ' : 'memo recipient: '}
              <span className="text-shielded">{soldOut ? 'blind commitment' : 'venue IVK only'}</span>
            </TerminalLine>
            <TerminalLine>
              {event.status === 'sybil-queue' ? 'ordering: ' : 'issuance: '}
              <span className="text-foreground">
                {event.status === 'sybil-queue'
                  ? 'fair, by blind nullifier'
                  : soldOut
                    ? 'on burn · ZIP 227'
                    : 'IssueAction · ZIP 227'}
              </span>
            </TerminalLine>
          </div>
          </ProtocolOnly>

          {ownsThisPass && scenario === 'sybil' ? (
            <div className="flex flex-col gap-2">
              <Button
                size="lg"
                className="h-14 w-full animate-pulse-ring rounded-full text-base font-semibold"
                onClick={() => openMint('sybil')}
              >
                <Lock data-icon="inline-start" />
                {pick('Buy Pass', 'Mint Shielded Pass')} · {deposit}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Sybil test: this identity already minted a pass for this event.
              </p>
            </div>
          ) : ownsThisPass ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 rounded-3xl bg-shielded/10 p-4 text-sm text-shielded">
                <Fingerprint className="size-5 shrink-0" aria-hidden="true" />
                <span>
                  {pick(
                    'You have your pass. Limit one per person.',
                    'Identity nullifier consumed. 1-ticket-per-human limit reached.',
                  )}
                </span>
              </div>
              <Button
                size="lg"
                variant="secondary"
                className="h-14 w-full rounded-full text-base"
                onClick={() => setTab('vault')}
              >
                Open My Ticket & Vault
                <ArrowRight data-icon="inline-end" />
              </Button>
            </div>
          ) : holdsOtherPass ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 rounded-3xl bg-secondary p-4 text-sm text-muted-foreground">
                <Fingerprint className="size-5 shrink-0 text-primary" aria-hidden="true" />
                <span className="text-pretty">
                  This demo wallet already holds a pass for{' '}
                  <span className="font-medium text-foreground">{ticketEvent?.title}</span>. Burn it for a refund first
                  to mint here.
                </span>
              </div>
              <Button
                size="lg"
                variant="secondary"
                className="h-14 w-full rounded-full text-base"
                onClick={() => setTab('vault')}
              >
                Open My Ticket & Vault
                <ArrowRight data-icon="inline-end" />
              </Button>
            </div>
          ) : soldOut ? (
            waitlisted ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-3 rounded-3xl bg-shielded/10 p-4 text-sm text-shielded">
                  <Check className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                  <span className="text-pretty leading-relaxed">
                    <span className="font-semibold">
                      {pick(`You're #${position} in line.`, `Position #${position} in the blind queue.`)}
                    </span>{' '}
                    {pick(
                      `Your ${deposit} is refunded automatically if no seat frees up.`,
                      `${deposit} is held in private escrow and auto-refunds if no seat frees up.`,
                    )}
                  </span>
                </div>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 w-full rounded-full border-destructive/40 text-base font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setLeaveOpen(true)}
                >
                  <LogOut data-icon="inline-start" />
                  Leave Waitlist &amp; Refund {deposit}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Button
                  size="lg"
                  className="h-14 w-full rounded-full text-base font-semibold"
                  disabled={!canAffordDeposit}
                  onClick={() => setWaitlistOpen(true)}
                >
                  <Users data-icon="inline-start" />
                  Join Blind Waitlist ({deposit})
                </Button>
                {!canAffordDeposit && (
                  <p className="text-center text-xs text-destructive">Not enough shielded ZEC for the escrow deposit.</p>
                )}
              </div>
            )
          ) : (
            <Button
              size="lg"
              className="h-14 w-full animate-pulse-ring rounded-full text-base font-semibold"
              onClick={() => openMint('mint')}
            >
              <Lock data-icon="inline-start" />
              {pick('Buy Pass', 'Mint Shielded Pass')} · {deposit}
            </Button>
          )}

          <div className="flex flex-wrap gap-2">
            <CryptoBadge tone="muted">{pick('No bots', 'halo2 · no trusted setup')}</CryptoBadge>
            <CryptoBadge tone="muted">{pick('100% Fair Refund', 'Orchard action')}</CryptoBadge>
          </div>
        </StateZone>
      </div>

      <AntiScalpingGuarantee />

      <MintDialog open={open} mode={mintMode} onOpenChange={setOpen} />
      <WaitlistConfirmDialog open={waitlistOpen} event={event} onOpenChange={setWaitlistOpen} onJoined={handleJoined} />
      <LeaveWaitlistDialog
        open={leaveOpen}
        event={event}
        position={position}
        onOpenChange={setLeaveOpen}
        onLeft={handleLeft}
      />
    </div>
  )
}
