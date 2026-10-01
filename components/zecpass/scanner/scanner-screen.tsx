'use client'

import { Info, ScanLine, Smartphone, WifiOff } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { type ScannerView, useProtocol } from '../protocol-provider'
import { AttendeePass } from './attendee-pass'
import { BouncerScanner } from './bouncer-scanner'

const triggerClass =
  'h-auto! rounded-full border-transparent! px-4 py-2.5 text-muted-foreground data-active:bg-foreground! data-active:text-background!'

export function ScannerScreen() {
  const { scannerView, setScannerView } = useProtocol()

  return (
    <Tabs value={scannerView} onValueChange={(v) => setScannerView(v as ScannerView)} className="gap-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-primary">Gate entry</span>
            <h2 className="text-balance text-4xl font-semibold leading-none tracking-tighter">
              Screenshot-proof entry
            </h2>
          </div>
          <OfflineVerificationBanner />
        </div>
        <TabsList className="h-auto! w-full rounded-full bg-card p-1 md:w-fit">
          <TabsTrigger value="attendee" className={triggerClass}>
            <Smartphone aria-hidden="true" />
            Attendee View
          </TabsTrigger>
          <TabsTrigger value="bouncer" className={triggerClass}>
            <ScanLine aria-hidden="true" />
            Bouncer Scanner
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="attendee">
        <AttendeePass />
      </TabsContent>
      <TabsContent value="bouncer">
        <BouncerScanner />
      </TabsContent>
    </Tabs>
  )
}

function OfflineVerificationBanner() {
  return (
    <div
      role="status"
      aria-label="Offline verification status"
      className="flex w-fit items-center gap-2.5 rounded-full bg-shielded/10 py-1.5 pr-1.5 pl-4 text-sm font-medium text-shielded"
    >
      <span className="relative flex size-2" aria-hidden="true">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-shielded opacity-60" />
        <span className="relative inline-flex size-2 rounded-full bg-shielded" />
      </span>
      Offline Verification Ready
      <Popover>
        <PopoverTrigger
          aria-label="How offline verification works"
          className="flex size-7 items-center justify-center rounded-full transition-colors hover:bg-shielded/15 focus-visible:outline-2 focus-visible:outline-shielded"
        >
          <Info className="size-4" aria-hidden="true" />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80 gap-3 rounded-3xl p-4">
          <PopoverHeader className="gap-1">
            <PopoverTitle className="flex items-center gap-2 text-base font-semibold tracking-tight">
              <WifiOff className="size-4 text-shielded" aria-hidden="true" />
              No cell data needed
            </PopoverTitle>
            <PopoverDescription className="text-pretty leading-relaxed">
              Proofs are generated and validated client-side via local Halo 2 ZK math. Zero cellular data or external
              RPC network connection required at arena gates.
            </PopoverDescription>
          </PopoverHeader>
        </PopoverContent>
      </Popover>
    </div>
  )
}
