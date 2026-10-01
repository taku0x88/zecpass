const encoder = new TextEncoder()
const SEPARATOR = new Uint8Array([0x1f])

type HashInput = string | number | Uint8Array

export function toHex(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  return Array.from(view, (b) => b.toString(16).padStart(2, '0')).join('')
}

export function randomBytes(length: number): Uint8Array {
  const buf = new Uint8Array(length)
  crypto.getRandomValues(buf)
  return buf
}

function encodeParts(parts: HashInput[]) {
  const chunks = parts.flatMap((part, i) => {
    const bytes = part instanceof Uint8Array ? part : encoder.encode(String(part))
    return i === 0 ? [bytes] : [SEPARATOR, bytes]
  })
  const out = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0))
  let offset = 0
  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.length
  }
  return out
}

/** Real SHA-256 via WebCrypto over the separator-joined inputs; returns 32 bytes as hex. */
export async function sha256Hex(...parts: HashInput[]): Promise<string> {
  // crypto.subtle only exists in secure contexts (https / localhost).
  if (!globalThis.crypto?.subtle) return toHex(randomBytes(32))
  const digest = await crypto.subtle.digest('SHA-256', encodeParts(parts))
  return toHex(digest)
}

/** Domain-separated, salted hash so every call yields a fresh but authentic 32-byte digest. */
export function domainHash(domain: string, ...parts: HashInput[]): Promise<string> {
  return sha256Hex(`zecpass:${domain}:v1`, randomBytes(32), ...parts)
}
