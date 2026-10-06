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
    retry: false,
  })

  const data = networkQuery.data
  const visibleList = (data?.connections ?? []).filter((c) => showStale || c.status === 'active')

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

      <div className="network-body">
        {/* The graph always renders (your wallet is the centre node), even while loading or if the indexer fails. */}
        <div className="network-graph-wrap">
          <NetworkGraph
            center={address}
            connections={data?.connections}
            secondHop={data?.secondHop}
            showStale={showStale}
            onSelectConnection={setSelected}
          />
        </div>

        <aside className="network-side">
          {networkQuery.isLoading && <p className="network-status">Loading your network…</p>}
          {networkQuery.isError && (
            <p className="network-status is-error">
              {networkQuery.error?.message}. Showing your wallet only.
            </p>
          )}
          {data && data.connections.length === 0 && (
            <p className="network-status">No connections yet for this wallet.</p>
          )}
          {data && <ConnectionsList connections={visibleList} onSelectConnection={setSelected} />}
        </aside>
      </div>

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
