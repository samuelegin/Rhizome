import { useAccount } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getUserRhizomes } from '../../lib/envio/client'
import RequireWallet from '../../components/wallet/RequireWallet'
import RhizomeRow from '../../components/rhizome/RhizomeRow'

function RhizomesContent() {
  const { address } = useAccount()
  const me = address.toLowerCase()
  const { data, isLoading, error } = useQuery({
    queryKey: ['userRhizomes', address],
    queryFn: () => getUserRhizomes(address),
    enabled: Boolean(address),
  })
  const mine = (data || []).filter(
    (r) => r.isMember || r.qualifyingCount > 0 || r.creator?.toLowerCase() === me || r.anchors?.some((a) => a.toLowerCase() === me),
  )
  const member = mine.filter((r) => r.isMember)
  const building = mine.filter((r) => !r.isMember)

  return (
    <div className="rz-page">
      <h1 className="app-page-title">Your Rhizomes</h1>
      <p className="page-lede">Communities you belong to, and the ones you are building connections toward.</p>

      {error && <p className="app-empty-note">Could not load your Rhizomes. Check that the indexer is running, then reload.</p>}
      {isLoading && <p className="app-empty-note">Loading your Rhizomes…</p>}

      {data && mine.length === 0 && (
        <div className="rz-empty">
          <p>You are not part of any Rhizome yet. Join one by building connections with its anchors, or start your own.</p>
          <div className="rz-actions">
            <Link to="/app/explore" className="rz-btn is-primary">Explore Rhizomes</Link>
            <Link to="/app/create" className="rz-btn">Create a Rhizome</Link>
          </div>
        </div>
      )}

      {member.length > 0 && (
        <section className="rz-group">
          <h2>Member</h2>
          <div className="rz-list">{member.map((r) => <RhizomeRow key={r.address} rhizome={r} />)}</div>
        </section>
      )}
      {building.length > 0 && (
        <section className="rz-group">
          <h2>Building connections</h2>
          <div className="rz-list">{building.map((r) => <RhizomeRow key={r.address} rhizome={r} />)}</div>
        </section>
      )}
    </div>
  )
}

function RhizomesPage() {
  return (
    <RequireWallet>
      <RhizomesContent />
    </RequireWallet>
  )
}

export default RhizomesPage
