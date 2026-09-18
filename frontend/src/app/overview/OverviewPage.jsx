import { useAccount } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getNetwork, getUserRhizomes, getRhizomeQualification, DEMO_MODE } from '../../lib/envio/client'
import RequireWallet from '../../components/wallet/RequireWallet'
import RhizomeSummaryCard from '../../components/rhizome/RhizomeSummaryCard'
import WhyAmIAMember from '../../components/membership/WhyAmIAMember'
import DemoModeBanner from '../../components/ui/DemoModeBanner'

function OverviewContent() {
  const { address } = useAccount()

  const networkQuery = useQuery({
    queryKey: ['network', address],
    queryFn: () => getNetwork(address),
    enabled: Boolean(address),
  })

  const rhizomesQuery = useQuery({
    queryKey: ['userRhizomes', address],
    queryFn: () => getUserRhizomes(address),
    enabled: Boolean(address),
  })

  const primaryRhizomeAddress = rhizomesQuery.data?.[0]?.address

  const qualificationQuery = useQuery({
    queryKey: ['qualification', primaryRhizomeAddress, address],
    queryFn: () => getRhizomeQualification(primaryRhizomeAddress, address),
    enabled: Boolean(address) && Boolean(primaryRhizomeAddress),
  })

  const activeCount = networkQuery.data?.connections.filter((c) => c.status === 'active').length ?? 0
  const staleCount = networkQuery.data?.connections.filter((c) => c.status === 'stale').length ?? 0

  return (
    <div className="overview-page">
      {DEMO_MODE && <DemoModeBanner />}

      <h1 className="app-page-title">Your Network</h1>

      <div className="overview-stats">
        <div className="overview-stat">
          <span className="overview-stat-value">{activeCount}</span>
          <span className="overview-stat-label">Active connections</span>
        </div>
        <div className="overview-stat">
          <span className="overview-stat-value">{staleCount}</span>
          <span className="overview-stat-label">Stale connections</span>
        </div>
        <div className="overview-stat">
          <span className="overview-stat-value">{rhizomesQuery.data?.length ?? 0}</span>
          <span className="overview-stat-label">Rhizomes</span>
        </div>
      </div>

      <section className="overview-section">
        <div className="overview-section-head">
          <h2>Your Rhizomes</h2>
          <Link to="/app/explore" className="editorial-link">
            Explore more <i className="bi bi-arrow-right" />
          </Link>
        </div>
        {rhizomesQuery.data && rhizomesQuery.data.length > 0 ? (
          <div className="rhizome-summary-grid">
            {rhizomesQuery.data.map((r) => (
              <RhizomeSummaryCard key={r.address} rhizome={r} />
            ))}
          </div>
        ) : (
          <p className="app-empty-note">No Rhizomes yet — explore existing ones or create your own.</p>
        )}
      </section>

      {qualificationQuery.data && (
        <section className="overview-section">
          <WhyAmIAMember
            rhizomeName={qualificationQuery.data.rhizome.name}
            minimumConnections={qualificationQuery.data.rhizome.minimumConnections}
            qualifyingConnections={qualificationQuery.data.qualifyingConnections}
          />
        </section>
      )}
    </div>
  )
}

function OverviewPage() {
  return (
    <RequireWallet>
      <OverviewContent />
    </RequireWallet>
  )
}

export default OverviewPage
