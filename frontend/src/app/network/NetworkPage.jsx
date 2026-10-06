import { useState } from 'react'
import { useAccount } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { getNetwork, DEMO_MODE } from '../../lib/envio/client'
import RequireWallet from '../../components/wallet/RequireWallet'
import NetworkGraph from '../../components/graph/NetworkGraph'
import ConnectionsList from '../../components/graph/ConnectionsList'
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

      {/* The graph always renders (your wallet is the centre node), even while loading or if the indexer fails. */}
      <div className="network-graph-wrap">
        <NetworkGraph
          center={address}
          connections={networkQuery.data?.connections}
          secondHop={networkQuery.data?.secondHop}
          showStale={showStale}
          onSelectConnection={setSelected}
        />
      </div>

      {networkQuery.isLoading && <p className="network-status">Loading your network…</p>}
      {networkQuery.isError && (
        <p className="network-status is-error">
          Couldn&apos;t load connections from the indexer ({networkQuery.error?.message}). Showing your wallet only.
        </p>
      )}
      {networkQuery.data && networkQuery.data.connections.length === 0 && (
        <p className="network-status">No connections yet for this wallet.</p>
      )}

      {networkQuery.data && (
        <>
          <ConnectionsList
            connections={networkQuery.data.connections.filter((c) => showStale || c.status === 'active')}
            onSelectConnection={setSelected}
          />
        </>
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
