import { AppShell } from '@/components/zecpass/app-shell'
import { ProtocolProvider } from '@/components/zecpass/protocol-provider'

export default function Page() {
  return (
    <ProtocolProvider>
      <main>
        <AppShell />
      </main>
    </ProtocolProvider>
  )
}
