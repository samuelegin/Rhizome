import { useState } from 'react'
import { useAccount } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { getNetwork, DEMO_MODE } from '../../lib/envio/client'
import RequireWallet from '../../components/wallet/RequireWallet'
import NetworkGraph from '../../components/graph/NetworkGraph'
import ConnectionDetailPanel from '../../components/connection/ConnectionDetailPanel'
import DemoModeBanner from '../../components/ui/DemoModeBanner'

function NetworkContent() {
  const { address } = useAccount()
  const [selected, setSelected] = useState(null)
  const [showStale, setShowStale] = useState(true)

  const networkQuery = useQuery({
    queryKey: ['network', address],
    queryFn: () => getNetwork(address),
    enabled: Boolean(address),
  })

  return (
    <div className="network-page">
      {DEMO_MODE && <DemoModeBanner />}
      <div className="app-page-head">
        <h1 className="app-page-title">My Network</h1>
        <label className="network-toggle">
          <input type="checkbox" checked={showStale} onChange={(e) => setShowStale(e.target.checked)} />
          Show stale connections
        </label>
      </div>

      {networkQuery.data && (
        <div className="network-graph-wrap">
          <NetworkGraph
            center={address}
            connections={networkQuery.data.connections}
            secondHop={networkQuery.data.secondHop}
            showStale={showStale}
            onSelectConnection={setSelected}
          />
        </div>
      )}

      <ConnectionDetailPanel connection={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

function NetworkPage() {
  return (
    <RequireWallet>
      <NetworkContent />
    </RequireWallet>
  )
}

export default NetworkPage