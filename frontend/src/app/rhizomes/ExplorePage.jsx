import { useState } from 'react'
import { useAccount } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getUserRhizomes } from '../../lib/envio/client'
import RequireWallet from '../../components/wallet/RequireWallet'
import RhizomeRow from '../../components/rhizome/RhizomeRow'

function ExploreContent() {
  const { address } = useAccount()
  const [q, setQ] = useState('')
  const [f, setF] = useState('all')
  const { data, isLoading, error } = useQuery({
    queryKey: ['userRhizomes', address],
    queryFn: () => getUserRhizomes(address),
    enabled: Boolean(address),
  })
  const all = data || []
  const tabs = [
    ['all', 'All', all.length],
    ['member', 'Member', all.filter((r) => r.isMember).length],
    ['open', 'Not a member', all.filter((r) => !r.isMember).length],
  ]
  const rows = all.filter(
    (r) => r.name.toLowerCase().includes(q.trim().toLowerCase()) && (f === 'all' || (f === 'member') === r.isMember),
  )

  return (
    <div className="page">
      <h1 className="app-page-title">Explore</h1>
      <p className="page-lede">Find a community, see what it asks of you, and where you stand.</p>

      <div className="dir-tools">
        <div className="dir-tabs" role="group" aria-label="Filter by membership">
          {tabs.map(([k, label, n]) => (
            <button key={k} type="button" className={f === k ? 'is-on' : ''} aria-pressed={f === k} onClick={() => setF(k)}>
              {label} <span>{n}</span>
            </button>
          ))}
        </div>
        <input className="dir-search" type="search" placeholder="Search by name" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search Rhizomes" />
      </div>

      {error && <p className="app-empty-note">Could not load Rhizomes. Check that the indexer is running, then reload.</p>}
      {isLoading && <p className="app-empty-note">Loading Rhizomes…</p>}
      {data && all.length === 0 && (
        <p className="app-empty-note">No Rhizomes exist yet. <Link to="/app/create" className="rz-link">Create the first one.</Link></p>
      )}
      {all.length > 0 && rows.length === 0 && <p className="app-empty-note">No Rhizomes match that search.</p>}
      {rows.length > 0 && (
        <div className="dir">
          <div className="dir-head">
            <span>Name</span><span>Signal</span><span>Requirement</span><span>Anchors</span><span>You</span>
          </div>
          {rows.map((r) => <RhizomeRow key={r.address} rhizome={r} />)}
        </div>
      )}
    </div>
  )
}

function ExplorePage() {
  return (
    <RequireWallet>
      <ExploreContent />
    </RequireWallet>
  )
}

export default ExplorePage
