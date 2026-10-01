'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import useSWR from 'swr'
import type { ZecPriceResponse } from '@/app/api/zec-price/route'
import { moneyParts, roundZec, type Currency, type MoneyParts } from '@/lib/money'
import {
  EVENT,
  EVENTS,
  WALLET,
  deriveExternalNullifier,
  getEvent,
  mintTicket,
  type Ticket,
  type ZecEvent,
} from '@/lib/zk'

export type AppTab = 'mint' | 'vault' | 'scanner'
export type ScannerView = 'attendee' | 'bouncer'
export type DemoPreset = 'fresh' | 'holder' | 'gate' | 'sybil' | 'fraud'
/** Adversarial demo scenarios that arm a rejection path instead of the happy path. */
export type DemoScenario = 'sybil' | 'fraud'

type ProtocolState = {
  tab: AppTab
  setTab: (tab: AppTab) => void
  scannerView: ScannerView
  setScannerView: (view: ScannerView) => void
  activeEvent: ZecEvent
  selectEvent: (id: string) => void
  remainingFor: (id: string) => number
  isWaitlisted: (id: string) => boolean
  waitlistPositionFor: (id: string) => number | null
  /** Escrows the face value and returns the fan's blind-queue position. */
  joinWaitlist: (id: string) => number
  /** Removes the fan's blind commitment and returns the escrowed deposit. */
  leaveWaitlist: (id: string) => number
  ticket: Ticket | null
  ticketEvent: ZecEvent | null
  /** Shielded wallet balance, denominated in ZEC. */
  balance: number
  currency: Currency
  setCurrency: (currency: Currency) => void
  /** Live ZEC/USD rate (falls back to a static estimate if the feed is unreachable). */
  zecUsd: number
  priceLive: boolean
  priceLoading: boolean
  /** Converts a USD-pegged price into the ZEC amount at the current rate. */
  usdToZec: (usd: number) => number
  /** Formats a USD-pegged price (ticket face value) in the selected currency. */
  price: (usd: number) => MoneyParts
  /** Formats a ZEC-denominated amount (balance, fees) in the selected currency. */
  amount: (zec: number) => MoneyParts
  /** Reveals raw hashes, circuit steps and protocol jargon for technical reviewers. */
  devMode: boolean
  setDevMode: (on: boolean) => void
  /** Remaining supply for the active event. */
  remaining: number
  admitted: boolean
  epoch: number
  activePreset: DemoPreset
  scenario: DemoScenario | null
  issueTicket: (ticket: Ticket) => void
  burnTicket: () => void
  markAdmitted: () => void
  applyPreset: (preset: DemoPreset) => Promise<void>
}

const ProtocolContext = createContext<ProtocolState | null>(null)

const TAB_FOR_PRESET: Record<DemoPreset, AppTab> = {
  fresh: 'mint',
  holder: 'vault',
  gate: 'scanner',
  sybil: 'mint',
  fraud: 'scanner',
}

const initialSupply = () => Object.fromEntries(EVENTS.map((e) => [e.id, e.initialRemaining]))

const FALLBACK_ZEC_USD = 45

const fetchPrice = async (url: string): Promise<ZecPriceResponse> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Price feed responded ${res.status}`)
  return res.json()
}

export function ProtocolProvider({ children }: { children: React.ReactNode }) {
  const [tab, setTab] = useState<AppTab>('mint')
  const [scannerView, setScannerView] = useState<ScannerView>('attendee')
  const [activeEventId, setActiveEventId] = useState(EVENT.id)
  const [supply, setSupply] = useState<Record<string, number>>(initialSupply)
  const [waitlist, setWaitlist] = useState<Record<string, number>>({})
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [balance, setBalance] = useState(WALLET.startingBalance)
  const [admitted, setAdmitted] = useState(false)
  const [epoch, setEpoch] = useState(0)
  const [scenario, setScenario] = useState<DemoScenario | null>(null)
  const [devMode, setDevMode] = useState(false)
  const [currency, setCurrency] = useState<Currency>('USD')

  const { data: priceData, isLoading: priceLoading } = useSWR('/api/zec-price', fetchPrice, {
    refreshInterval: 60_000,
    revalidateOnFocus: false,
  })
  const zecUsd = priceData?.usd ?? FALLBACK_ZEC_USD
  const priceLive = priceData?.live ?? false

  const usdToZec = useCallback((usd: number) => roundZec(usd / zecUsd), [zecUsd])
  const price = useCallback((usd: number) => moneyParts(usd / zecUsd, usd, currency), [zecUsd, currency])
  const amount = useCallback((zec: number) => moneyParts(zec, zec * zecUsd, currency), [zecUsd, currency])

  const activeEvent = getEvent(activeEventId)
  const ticketEvent = ticket ? getEvent(ticket.eventId) : null

  const remainingFor = useCallback((id: string) => supply[id] ?? 0, [supply])
  const isWaitlisted = useCallback((id: string) => id in waitlist, [waitlist])
  const waitlistPositionFor = useCallback((id: string) => waitlist[id] ?? null, [waitlist])
  const joinWaitlist = useCallback(
    (id: string) => {
      if (id in waitlist) return waitlist[id]
      const event = getEvent(id)
      const position = event.waitlistSize + 1
      setWaitlist((w) => ({ ...w, [id]: position }))
      setBalance((b) => roundZec(b - usdToZec(event.priceUsd)))
      return position
    },
    [waitlist, usdToZec],
  )
  const leaveWaitlist = useCallback(
    (id: string) => {
      if (!(id in waitlist)) return 0
      const refund = usdToZec(getEvent(id).priceUsd)
      setWaitlist(({ [id]: _removed, ...rest }) => rest)
      setBalance((b) => roundZec(b + refund))
      return refund
    },
    [waitlist, usdToZec],
  )

  const issueTicket = useCallback(
    (next: Ticket) => {
      const event = getEvent(next.eventId)
      setTicket(next)
      setAdmitted(false)
      setBalance((b) => roundZec(b - usdToZec(event.priceUsd)))
      setSupply((s) => ({ ...s, [event.id]: Math.max(0, (s[event.id] ?? 0) - 1) }))
    },
    [usdToZec],
  )

  const burnTicket = useCallback(() => {
    if (ticket) {
      const refund = usdToZec(getEvent(ticket.eventId).priceUsd)
      setBalance((b) => roundZec(b + refund))
    }
    setTicket(null)
    setAdmitted(false)
    setScenario(null)
  }, [ticket, usdToZec])

  const markAdmitted = useCallback(() => setAdmitted(true), [])

  const applyPreset = useCallback(async (preset: DemoPreset) => {
    const next = preset === 'fresh' ? null : await mintTicket(EVENT, await deriveExternalNullifier(EVENT))
    setActiveEventId(EVENT.id)
    setTicket(next)
    // State E: the pass was already admitted, so any re-presentation is a replay.
    setAdmitted(preset === 'fraud')
    setWaitlist({})
    setBalance(next ? roundZec(WALLET.startingBalance - usdToZec(EVENT.priceUsd)) : WALLET.startingBalance)
    setSupply({ ...initialSupply(), ...(next ? { [EVENT.id]: EVENT.initialRemaining - 1 } : {}) })
    setScannerView(preset === 'gate' || preset === 'fraud' ? 'bouncer' : 'attendee')
    setScenario(preset === 'sybil' || preset === 'fraud' ? preset : null)
    setTab(TAB_FOR_PRESET[preset])
    setEpoch((e) => e + 1)
  }, [usdToZec])

  const activePreset: DemoPreset =
    scenario ?? (tab === 'scanner' && scannerView === 'bouncer' ? 'gate' : ticket ? 'holder' : 'fresh')

  const remaining = supply[activeEventId] ?? 0

  const value = useMemo(
    () => ({
      tab,
      setTab,
      scannerView,
      setScannerView,
      activeEvent,
      selectEvent: setActiveEventId,
      remainingFor,
      isWaitlisted,
      waitlistPositionFor,
      joinWaitlist,
      leaveWaitlist,
      ticket,
      ticketEvent,
      balance,
      currency,
      setCurrency,
      zecUsd,
      priceLive,
      priceLoading,
      usdToZec,
      price,
      amount,
      devMode,
      setDevMode,
      remaining,
      admitted,
      epoch,
      activePreset,
      scenario,
      issueTicket,
      burnTicket,
      markAdmitted,
      applyPreset,
    }),
    [
      tab,
      scannerView,
      activeEvent,
      remainingFor,
      isWaitlisted,
      waitlistPositionFor,
      joinWaitlist,
      leaveWaitlist,
      ticket,
      ticketEvent,
      balance,
      currency,
      zecUsd,
      priceLive,
      priceLoading,
      usdToZec,
      price,
      amount,
      devMode,
      remaining,
      admitted,
      epoch,
      activePreset,
      scenario,
      issueTicket,
      burnTicket,
      markAdmitted,
      applyPreset,
    ],
  )

  return <ProtocolContext.Provider value={value}>{children}</ProtocolContext.Provider>
}

export function useProtocol() {
  const ctx = useContext(ProtocolContext)
  if (!ctx) throw new Error('useProtocol must be used within ProtocolProvider')
  return ctx
}
