import { truncateAddress } from '../../lib/formatters'
import ConnectionBadge from '../connection/ConnectionBadge'

function ConnectionsList({ connections, onSelectConnection }) {
  if (connections.length === 0) {
    return null
  }

  return (
    <ul className="connections-list">
      {connections.map((connection) => (
        <li key={connection.peer}>
          <button
            type="button"
            className="connections-list-row"
            onClick={() => onSelectConnection?.(connection)}
          >
            <span className="connections-list-peer">{truncateAddress(connection.peer, 4)}</span>
            <span className="connections-list-signal">{connection.signalLabel}</span>
            <ConnectionBadge status={connection.status} />
          </button>
        </li>
      ))}
    </ul>
  )
}

export default ConnectionsList
