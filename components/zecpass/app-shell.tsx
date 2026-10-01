'use client'

import { ScanLine, Ticket, Vault } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AppHeader } from './app-header'
import { DemoControl } from './demo-control'
import { type AppTab, useProtocol } from './protocol-provider'
import { ZoneLabel } from './primitives'
import { MintScreen } from './mint/mint-screen'
import { VaultScreen } from './vault/vault-screen'
import { ScannerScreen } from './scanner/scanner-screen'

const tabs: { value: AppTab; label: string; short: string; icon: typeof Ticket }[] = [
  { value: 'mint', label: 'Event & Mint', short: 'Mint', icon: Ticket },
  { value: 'vault', label: 'My Ticket & Vault', short: 'My Pass', icon: Vault },
  { value: 'scanner', label: 'Turnstile Scanner', short: 'Gate', icon: ScanLine },
]

export function AppShell() {
  const { tab, setTab, epoch } = useProtocol()

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pt-5 pb-44 md:px-8 md:pt-8 md:pb-24">
        <AppHeader />

        <Tabs value={tab} onValueChange={(v) => setTab(v as AppTab)} className="gap-6">
          <div className="flex items-center justify-between gap-3">
            <TabsList
              aria-label="ZecPass screens"
              className="fixed inset-x-3 bottom-3 z-40 grid h-auto! grid-cols-3 gap-1 rounded-full border bg-card/90 p-1.5 shadow-2xl shadow-background backdrop-blur-xl md:static md:inset-auto md:w-fit md:grid-cols-[repeat(3,auto)] md:bg-card md:shadow-none"
            >
              {tabs.map(({ value, label, short, icon: Icon }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="h-auto! min-w-0 flex-col gap-1 rounded-full border-transparent! px-3 py-2 text-muted-foreground data-active:bg-foreground! data-active:text-background! md:flex-row md:gap-2 md:px-5 md:py-3"
                >
                  <Icon className="size-5 md:size-4" aria-hidden="true" />
                  <span className="text-xs font-medium md:hidden">{short}</span>
                  <span className="hidden text-sm font-medium md:inline">{label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            <div className="hidden items-center gap-2 lg:flex" aria-label="State legend">
              <ZoneLabel zone="public" />
              <ZoneLabel zone="shielded" />
            </div>
          </div>

          <TabsContent value="mint">
            <MintScreen key={`mint-${epoch}`} />
          </TabsContent>
          <TabsContent value="vault">
            <VaultScreen key={`vault-${epoch}`} />
          </TabsContent>
          <TabsContent value="scanner">
            <ScannerScreen key={`scanner-${epoch}`} />
          </TabsContent>
        </Tabs>

        <footer className="flex flex-col gap-1 border-t pt-4 font-mono text-[11px] text-muted-foreground md:flex-row md:justify-between">
          <span>{'ZecPass v0.1 · buildathon demo · cryptography simulated client-side (WebCrypto SHA-256)'}</span>
          <span>{'network: zcash-testnet · pool: orchard · ZSA (ZIP 226/227)'}</span>
        </footer>
      </div>
      <DemoControl />
    </div>
  )
}
