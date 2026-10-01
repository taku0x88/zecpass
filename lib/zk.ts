import { domainHash, sha256Hex } from './crypto'

export function randomHex(bytes: number): string {
  const buf = new Uint8Array(bytes)
  crypto.getRandomValues(buf)
  return Array.from(buf, (b) => b.toString(16).padStart(2, '0')).join('')
}

const BECH32M_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'

/** Mock Orchard-only Unified Address: `u1` HRP + bech32m data (length matches real Orchard UAs). */
export function mockUnifiedAddress(length = 106): string {
  const buf = new Uint8Array(length - 2)
  crypto.getRandomValues(buf)
  return `u1${Array.from(buf, (b) => BECH32M_CHARSET[b & 31]).join('')}`
}

export function truncateMiddle(value: string, head = 6, tail = 4): string {
  if (value.length <= head + tail + 1) return value
  return `${value.slice(0, head)}…${value.slice(-tail)}`
}

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const WALLET = {
  unifiedAddress:
    'u1zq7m4k2x9vr8e3hdl5nfa0cw6tjpsy4gu8kx3m2rqw7vd9hc5ef0ln6ta8bj3sy2pk4mzx8x9q',
  diversifierIndex: 7,
  pool: 'Orchard',
  username: 'zooko1234',
  startingBalance: 12.4,
}

export type EventCategory = 'concerts' | 'summits' | 'underground'
export type DropStatus = 'live' | 'sybil-queue' | 'waitlist'

export const CATEGORIES: { id: EventCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All Events' },
  { id: 'concerts', label: 'Concerts' },
  { id: 'summits', label: 'Summits & Tech' },
  { id: 'underground', label: 'Underground' },
]

export const STATUS_COPY: Record<DropStatus, { label: string; short: string }> = {
  live: { label: 'Primary Drop Live', short: 'Drop live' },
  'sybil-queue': { label: 'Sybil Queue Open', short: 'Queue open' },
  waitlist: { label: 'Waitlist Pool Only', short: 'Sold out' },
}

export type ZecEvent = {
  id: string
  title: string
  subtitle: string
  category: EventCategory
  status: DropStatus
  /** ISO calendar day, used by the date strip + calendar filter. */
  day: string
  date: string
  shortDate: string
  dayMonth: string
  weekday: string
  year: string
  doorsTime: string
  timezone: string
  venue: string
  city: string
  /** Face value pegged in USD so ticket prices never move with ZEC volatility. */
  priceUsd: number
  totalSupply: number
  initialRemaining: number
  waitlistSize: number
  assetDescription: string
  issuer: string
  image: string
  imageAlt: string
  seating: { row: number; seat: number; tier: string; section: string }
}

export const EVENTS: ZecEvent[] = [
  {
    id: 'oasis-wembley',
    title: 'Oasis Live at Wembley',
    subtitle: '100% Shielded',
    category: 'concerts',
    status: 'live',
    day: '2027-07-17',
    date: 'Sat, 17 Jul 2027',
    shortDate: 'Sat 17 Jul',
    dayMonth: '17.07',
    weekday: 'Saturday',
    year: '2027',
    doorsTime: '18:00',
    timezone: 'BST',
    venue: 'Wembley Stadium',
    city: 'London',
    priceUsd: 150,
    totalSupply: 3000,
    initialRemaining: 2840,
    waitlistSize: 0,
    assetDescription: 'ZECPASS/OASIS-WEMBLEY-2027/GA',
    issuer: 'zecpass.venue.wembley',
    image: '/images/wembley-night.png',
    imageAlt: 'Stadium crowd under warm stage lights',
    seating: { row: 4, seat: 12, tier: 'Pitch Standing', section: 'Block C' },
  },
  {
    id: 'zcon-global',
    title: 'Zcon Global Privacy Summit',
    subtitle: 'Shielded Delegate Pass',
    category: 'summits',
    status: 'sybil-queue',
    day: '2027-07-24',
    date: 'Sat, 24 Jul 2027',
    shortDate: 'Sat 24 Jul',
    dayMonth: '24.07',
    weekday: 'Saturday',
    year: '2027',
    doorsTime: '09:30',
    timezone: 'WEST',
    venue: 'Centro de Congressos',
    city: 'Lisbon',
    priceUsd: 75,
    totalSupply: 1200,
    initialRemaining: 418,
    waitlistSize: 0,
    assetDescription: 'ZECPASS/ZCON-GLOBAL-2027/DELEGATE',
    issuer: 'zecpass.venue.zcon',
    image: '/images/zcon-summit.png',
    imageAlt: 'Silhouetted audience facing a keynote stage in amber light',
    seating: { row: 7, seat: 21, tier: 'Delegate', section: 'Main Hall' },
  },
  {
    id: 'berghain-showcase',
    title: 'Berghain Shielded Showcase',
    subtitle: 'No photos, no doxxing',
    category: 'underground',
    status: 'waitlist',
    day: '2027-08-08',
    date: 'Sun, 08 Aug 2027',
    shortDate: 'Sun 08 Aug',
    dayMonth: '08.08',
    weekday: 'Sunday',
    year: '2027',
    doorsTime: '23:59',
    timezone: 'CEST',
    venue: 'Berghain',
    city: 'Berlin',
    priceUsd: 50,
    totalSupply: 500,
    initialRemaining: 0,
    waitlistSize: 3,
    assetDescription: 'ZECPASS/BERGHAIN-SHOWCASE-2027/FLOOR',
    issuer: 'zecpass.venue.berghain',
    image: '/images/berlin-club.png',
    imageAlt: 'Dancing crowd inside a vast concrete hall cut by orange light beams',
    seating: { row: 1, seat: 1, tier: 'Floor', section: 'Halle' },
  },
]

export const EVENT = EVENTS[0]

export function getEvent(id: string): ZecEvent {
  return EVENTS.find((e) => e.id === id) ?? EVENT
}

export type Ticket = {
  eventId: string
  assetId: string
  noteHash: string
  commitment: string
  receiver: string
  nullifier: string
  externalNullifier: string
  issuanceHeight: number
  row: number
  seat: number
  tier: string
  section: string
}

/** Blind sybil nullifier scoped to this event: same human + same event always collides. */
export function deriveExternalNullifier(event: ZecEvent): Promise<string> {
  return domainHash('sybil-external-nullifier', event.issuer, event.assetDescription)
}

export async function mintTicket(event: ZecEvent, externalNullifier: string): Promise<Ticket> {
  const rseed = randomHex(32)
  // ZSA asset IDs are deterministic from issuer key + asset description.
  const assetId = await sha256Hex('zecpass:zsa-asset-id:v1', event.issuer, event.assetDescription)
  const commitment = await domainHash('note-commitment', assetId, externalNullifier, rseed)
  const [noteHash, nullifier] = await Promise.all([
    sha256Hex('zecpass:note-hash:v1', commitment),
    domainHash('note-nullifier', commitment),
  ])
  return {
    eventId: event.id,
    assetId,
    noteHash,
    commitment,
    receiver: mockUnifiedAddress(),
    nullifier,
    externalNullifier,
    issuanceHeight: 2_981_400 + Math.floor(Math.random() * 900),
    ...event.seating,
  }
}

export function deriveBurnReceipt(ticket: Ticket): Promise<string> {
  return sha256Hex('zecpass:burn-receipt:v1', ticket.nullifier, ticket.commitment, Date.now())
}

export function deriveIssuanceTxid(ticket: Ticket): Promise<string> {
  return sha256Hex('zecpass:issue-txid:v1', ticket.commitment, ticket.issuanceHeight)
}

export type AdmissionPayload = {
  nullifier: string
  timestamp: number
  expiresAt: number
  nonce: string
  proof: string
  rk: string
  spendAuthSig: string
}

export function buildAdmissionPayload(ticket: Ticket, validForMs = 60_000): AdmissionPayload {
  const now = Date.now()
  return {
    nullifier: ticket.nullifier,
    timestamp: now,
    expiresAt: now + validForMs,
    nonce: randomHex(16),
    proof: `zk-SNARK:halo2:${randomHex(48)}`,
    rk: randomHex(32),
    spendAuthSig: randomHex(64),
  }
}
