import { useParams } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { getRhizomeQualification, DEMO_MODE } from '../../lib/envio/client'
import { CONTRACT_ADDRESSES } from '../../lib/contracts/addresses'
import RequireWallet from '../../components/wallet/RequireWallet'
import WhyAmIAMember from '../../components/membership/WhyAmIAMember'
import ConnectionBadge from '../../components/connection/ConnectionBadge'
import DemoModeBanner from '../../components/ui/DemoModeBanner'
import { truncateAddress } from '../../lib/formatters'

function RhizomeDetailContent() {
  const { address: rhizomeAddress } = useParams()
  const { address: wallet } = useAccount()

  const qualificationQuery = useQuery({
    queryKey: ['qualification', rhizomeAddress, wallet],
    queryFn: () => getRhizomeQualification(rhizomeAddress, wallet),
    enabled: Boolean(rhizomeAddress) && Boolean(wallet),
  })

  if (qualificationQuery.isLoading) {
    return <p className="app-empty-note">Loading Rhizome...</p>
  }

  const data = qualificationQuery.data

  if (!data) {
    return <p className="app-empty-note">Rhizome not found.</p>
  }

  const isMember = data.qualifyingConnections.length >= data.rhizome.minimumConnections
  const connectionByAnchor = new Map(data.qualifyingConnections.map((c) => [c.peer.toLowerCase(), c]))
  const memberSpaceAddress =
    data.rhizome.address?.toLowerCase() === CONTRACT_ADDRESSES.DEMO_RHIZOME?.toLowerCase()
      ? CONTRACT_ADDRESSES.DEMO_MEMBER_SPACE
      : null

  return (
    <div className="rhizome-detail-page">
      {DEMO_MODE && <DemoModeBanner />}

      <div className="app-page-head">
        <div>
          <p className="rhizome-detail-eyebrow">{data.rhizome.signalLabel}</p>
          <h1 className="app-page-title">{data.rhizome.name}</h1>
          <p className="rhizome-detail-tagline">A community formed through shared governance participation.</p>
        </div>
        <span className={`membership-status ${isMember ? 'is-member' : 'is-not-member'}`}>
          <i className={`bi ${isMember ? 'bi-check-circle-fill' : 'bi-circle'}`} />
          {isMember ? 'Member' : 'Not a member'}
        </span>
      </div>

      <section className="overview-section">
        <h2>Membership</h2>
        <p className="rhizome-detail-requirement">
          {data.rhizome.minimumConnections} active connection{data.rhizome.minimumConnections === 1 ? '' : 's'}{' '}
          required · {data.rhizome.freshnessPeriodDays}-day freshness window
        </p>
      </section>

      <section className="overview-section">
        <h2>Your connections</h2>
        {data.anchors.length > 0 ? (
          <table className="rhizome-connections-table">
            <thead>
              <tr>
                <th>Anchor</th>
                <th>Signal</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.anchors.map((anchor) => {
                const connection = connectionByAnchor.get(anchor.toLowerCase())
                return (
                  <tr key={anchor}>
                    <td>{truncateAddress(anchor)}</td>
                    <td>{data.rhizome.signalLabel}</td>
                    <td>
                      {connection ? (
                        <ConnectionBadge status={connection.status} />
                      ) : (
                        <span className="rhizome-connection-none">Not connected</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <p className="app-empty-note">This Rhizome has no bootstrap members yet.</p>
        )}
      </section>

      <section className="overview-section">
        <WhyAmIAMember
          rhizomeName={data.rhizome.name}
          minimumConnections={data.rhizome.minimumConnections}
          qualifyingConnections={data.qualifyingConnections}
        />
      </section>

      <section className="overview-section rhizome-memberspace-section">
        <h2>MemberSpace</h2>
        {isMember ? (
          <>
            <p>You have access because your relationship graph satisfies this Rhizome's membership conditions.</p>
            {memberSpaceAddress ? (
              <p className="rhizome-memberspace-address">Contract: {truncateAddress(memberSpaceAddress, 6)}</p>
            ) : (
              <p className="app-empty-note">No MemberSpace contract is linked to this Rhizome yet.</p>
            )}
          </>
        ) : (
          <p className="app-empty-note">
            You need {data.rhizome.minimumConnections} active connections to this Rhizome's anchors to unlock
            MemberSpace access.
          </p>
        )}
      </section>
    </div>
  )
}

function RhizomeDetailPage() {
  return (
    <RequireWallet>
      <RhizomeDetailContent />
    </RequireWallet>
  )
}

export default RhizomeDetailPage
