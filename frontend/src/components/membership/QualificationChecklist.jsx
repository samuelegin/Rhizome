import { truncateAddress } from '../../lib/formatters'
import ConnectionBadge from '../connection/ConnectionBadge'

function QualificationChecklist({ qualifyingConnections, minimumConnections }) {
  const count = qualifyingConnections.length
  const met = count >= minimumConnections

  return (
    <div className="qualification-checklist">
      <ul>
        {qualifyingConnections.map((c) => (
          <li key={c.peer} className="qualification-row">
            <i className="bi bi-check-circle-fill qualification-check" />
            <div className="qualification-row-body">
              <span className="qualification-peer">{truncateAddress(c.peer)}</span>
              <span className="qualification-meta">
                Verified Connection · {c.signalLabel} · {c.evidenceCount} shared proposals
              </span>
            </div>
            <ConnectionBadge status={c.status} />
          </li>
        ))}
      </ul>
      <div className={`qualification-total ${met ? 'is-met' : ''}`}>
        {count} / {minimumConnections} required
      </div>
    </div>
  )
}

export default QualificationChecklist