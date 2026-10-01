'use client'

import { useId, useRef, useState } from 'react'
import { ChevronRight, Flame, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const HANDLE = 56
const PAD = 4
const THRESHOLD = 0.85

export function SwipeToConfirm({
  label,
  busyLabel,
  busy,
  onConfirm,
}: {
  label: string
  busyLabel: string
  busy: boolean
  onConfirm: () => void
}) {
  const hintId = useId()
  const trackRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ startX: number; originX: number; moved: boolean } | null>(null)
  const [x, setX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [nudge, setNudge] = useState(false)

  const maxX = () => Math.max(0, (trackRef.current?.clientWidth ?? 0) - HANDLE - PAD * 2)
  const progress = maxX() > 0 ? x / maxX() : 0

  function confirm() {
    setX(maxX())
    onConfirm()
  }

  function onPointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    if (busy) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { startX: e.clientX, originX: x, moved: false }
    setDragging(true)
  }

  function onPointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    if (!drag.current || !dragging) return
    const dx = e.clientX - drag.current.startX
    if (Math.abs(dx) > 4) drag.current.moved = true
    setX(Math.min(maxX(), Math.max(0, drag.current.originX + dx)))
  }

  function onPointerUp() {
    if (!dragging) return
    setDragging(false)
    if (maxX() > 0 && x >= maxX() * THRESHOLD) confirm()
    else setX(0)
  }

  function onClick(e: React.MouseEvent<HTMLButtonElement>) {
    const moved = drag.current?.moved
    drag.current = null
    if (busy) return
    // detail === 0 means keyboard activation (Enter / Space): confirm directly.
    if (e.detail === 0) return confirm()
    if (!moved) {
      setNudge(true)
      setTimeout(() => setNudge(false), 600)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={trackRef}
        className="relative flex h-16 items-center overflow-hidden rounded-full bg-destructive/15 p-1 ring-1 ring-destructive/30"
      >
        <div
          className={cn('absolute inset-y-0 left-0 rounded-full bg-destructive/35', !dragging && 'transition-[width] duration-300')}
          style={{ width: x + HANDLE + PAD * 2 }}
          aria-hidden="true"
        />
        <span
          className="pointer-events-none absolute inset-0 flex items-center justify-center gap-1 pr-4 pl-16 text-sm font-semibold text-destructive"
          style={{ opacity: busy ? 1 : 1 - progress * 0.9 }}
          aria-hidden="true"
        >
          <span className="truncate">{busy ? busyLabel : label}</span>
          {!busy && (
            <>
              <ChevronRight className="size-4 shrink-0 opacity-70" />
              <ChevronRight className="-ml-2.5 size-4 shrink-0 opacity-40" />
            </>
          )}
        </span>
        <button
          type="button"
          aria-label={label}
          aria-describedby={hintId}
          disabled={busy}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onClick={onClick}
          className={cn(
            'relative z-10 flex size-14 shrink-0 cursor-grab touch-none items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg active:cursor-grabbing disabled:cursor-wait',
            !dragging && 'transition-transform duration-300',
            nudge && 'animate-nudge',
          )}
          style={{ transform: `translateX(${x}px)` }}
        >
          {busy ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <Flame className="size-5" aria-hidden="true" />}
        </button>
      </div>
      <p id={hintId} className="text-center text-xs text-muted-foreground">
        Slide to confirm · or focus the handle and press Enter
      </p>
    </div>
  )
}
