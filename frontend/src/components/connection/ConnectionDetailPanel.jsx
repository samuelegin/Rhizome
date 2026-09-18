import { truncateAddress, formatDate, formatFreshnessPeriod } from '../../lib/formatters'
import ConnectionBadge from './ConnectionBadge'

function ConnectionDetailPanel({ connection, onClose }) {
  if (!connection) return null

  return (
    <div className="connection-panel-backdrop" onClick={onClose}>
      <div className="connection-panel" onClick={(e) => e.stopPropagation()}>
        <button className="connection-panel-close" onClick={onClose} aria-label="Close" type="button">
          <i className="bi bi-x-lg" />
        </button>

        <p className="connection-panel-eyebrow">Verified Connection</p>
        <h2 className="connection-panel-title">
          You ↔ {truncateAddress(connection.peer)}
        </h2>

        <div className="connection-panel-row">
          <span className="connection-panel-label">Signal</span>
          <span className="connection-panel-value">{connection.signalLabel}</span>
        </div>
        <div className="connection-panel-row">
          <span className="connection-panel-label">Evidence</span>
          <span className="connection-panel-value">{connection.evidenceCount} shared proposals</span>
        </div>
        <div className="connection-panel-row">
          <span className="connection-panel-label">First qualified</span>
          <span className="connection-panel-value">{formatDate(connection.firstQualifiedAt)}</span>
        </div>
        <div className="connection-panel-row">
          <span className="connection-panel-label">Last qualifying activity</span>
          <span className="connection-panel-value">{formatDate(connection.lastQualifiedAt)}</span>
        </div>
        <div className="connection-panel-row">
          <span className="connection-panel-label">Status</span>
          <ConnectionBadge status={connection.status} />
        </div>
        <div className="connection-panel-row">
          <span className="connection-panel-label">Freshness window</span>
          <span className="connection-panel-value">{formatFreshnessPeriod(connection.freshnessPeriodSeconds)}</span>
        </div>

        {connection.evidence && connection.evidence.length > 0 && (
          <div className="connection-panel-evidence">
            <p className="connection-panel-evidence-label">Evidence trail</p>
            <ul>
              {connection.evidence.map((e) => (
                <li key={e.proposalId}>
                  <span className="evidence-proposal">Proposal #{e.proposalId}</span>
                  <span className="evidence-title">{e.title}</span>
                  <span className="evidence-both">Both participated</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export default ConnectionDetailPanel