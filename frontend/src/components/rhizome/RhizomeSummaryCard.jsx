import { Link } from 'react-router-dom'

function RhizomeSummaryCard({ rhizome }) {
  return (
    <Link to={`/app/rhizomes/${rhizome.address}`} className="rhizome-summary-card">
      <div className="rhizome-summary-head">
        <h3>{rhizome.name}</h3>
        <span className={`membership-status ${rhizome.isMember ? 'is-member' : 'is-not-member'}`}>
          <i className={`bi ${rhizome.isMember ? 'bi-check-circle-fill' : 'bi-circle'}`} />
          {rhizome.isMember ? 'Member' : 'Not a member'}
        </span>
      </div>
      <p className="rhizome-summary-requirement">
        {rhizome.qualifyingCount} / {rhizome.minimumConnections} active connections
      </p>
    </Link>
  )
}

export default RhizomeSummaryCard