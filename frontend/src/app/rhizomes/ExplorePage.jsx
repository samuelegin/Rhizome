import { useState } from 'react'
import { useAccount } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getUserRhizomes } from '../../lib/envio/client'
import RequireWallet from '../../components/wallet/RequireWallet'
import RhizomeRow from '../../components/rhizome/RhizomeRow'

const FILTERS = [['all', 'All'], ['member', 'Member'], ['open', 'Not a member']]

function ExploreContent() {
  const { address } = useAccount()
  const [q, setQ] = useState('')
  const [f, setF] = useState('all')
  const { data, isLoading, error } = useQuery({
    queryKey: ['userRhizomes', address],
    queryFn: () => getUserRhizomes(address),
    enabled: Boolean(address),
  })
  const rows = (data || []).filter(
    (r) => r.name.toLowerCase().includes(q.trim().toLowerCase()) && (f === 'all' || (f === 'member') === r.isMember),
  )

  return (
    <div className="rz-page">
      <h1 className="app-page-title">Explore Rhizomes</h1>
      <p className="page-lede">Every community on Rhizome, what it takes to join, and how close you are.</p>

      <div className="rz-tools">
        <input className="rz-search" type="search" placeholder="Search by name" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search Rhizomes" />
        <div className="rz-seg" role="group" aria-label="Filter by membership">
          {FILTERS.map(([k, label]) => (
            <button key={k} type="button" className={f === k ? 'is-on' : ''} aria-pressed={f === k} onClick={() => setF(k)}>{label}</button>
          ))}
        </div>
      </div>

      {error && <p className="app-empty-note">Could not load Rhizomes. Check that the indexer is running, then reload.</p>}
      {isLoading && <p className="app-empty-note">Loading Rhizomes…</p>}
      {data && data.length === 0 && (
        <p className="app-empty-note">No Rhizomes exist yet. <Link to="/app/create" className="rz-link">Create the first one.</Link></p>
      )}
      {data && data.length > 0 && rows.length === 0 && <p className="app-empty-note">No Rhizomes match that search.</p>}
      {rows.length > 0 && <div className="rz-list">{rows.map((r) => <RhizomeRow key={r.address} rhizome={r} />)}</div>}
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
