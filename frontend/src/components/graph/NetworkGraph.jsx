import { useMemo, useState } from 'react'
import { truncateAddress } from '../../lib/formatters'

const WIDTH = 720
const HEIGHT = 520
const CENTER = { x: WIDTH / 2, y: HEIGHT / 2 }
const RING_1 = 165
const RING_2 = 250

function polarPoint(center, radius, angle) {
  return {
    x: center.x + radius * Math.cos(angle),
    y: center.y + radius * Math.sin(angle),
  }
}

/**
 * Central wallet/user node with connected wallets arranged around it.
 * Active connections are highlighted, stale connections are visibly
 * muted/dashed, and (per the spec) fully inactive connections are
 * hidden by default via `showStale`.
 */
function NetworkGraph({ center, connections, secondHop = [], onSelectConnection, showStale = true }) {
  const [hovered, setHovered] = useState(null)

  const visibleConnections = useMemo(
    () => connections.filter((c) => showStale || c.status === 'active'),
    [connections, showStale]
  )

  const firstHopPositions = useMemo(() => {
    const n = visibleConnections.length
    return visibleConnections.map((c, i) => {
      const angle = (i / Math.max(n, 1)) * Math.PI * 2 - Math.PI / 2
      return { connection: c, angle, point: polarPoint(CENTER, RING_1, angle) }
    })
  }, [visibleConnections])

  const firstHopByAddress = useMemo(() => {
    const map = new Map()
    firstHopPositions.forEach((p) => map.set(p.connection.peer.toLowerCase(), p))
    return map
  }, [firstHopPositions])

  const secondHopPositions = useMemo(() => {
    return secondHop
      .filter((c) => showStale || c.status === 'active')
      .map((c) => {
        const parent = firstHopByAddress.get(c.via?.toLowerCase())
        if (!parent) return null
        const point = polarPoint(CENTER, RING_2, parent.angle + 0.35)
        return { connection: c, parentPoint: parent.point, point }
      })
      .filter(Boolean)
  }, [secondHop, firstHopByAddress, showStale])

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="network-graph"
      role="img"
      aria-label="Your network of verified connections"
    >
      {/* edges: center -> first hop */}
      {firstHopPositions.map(({ connection, point }) => (
        <line
          key={`edge-${connection.peer}`}
          x1={CENTER.x}
          y1={CENTER.y}
          x2={point.x}
          y2={point.y}
          className={`graph-edge ${connection.status === 'active' ? 'is-active' : 'is-stale'}`}
        />
      ))}

      {/* edges: first hop -> second hop */}
      {secondHopPositions.map(({ connection, parentPoint, point }) => (
        <line
          key={`edge2-${connection.peer}`}
          x1={parentPoint.x}
          y1={parentPoint.y}
          x2={point.x}
          y2={point.y}
          className={`graph-edge graph-edge-2 ${connection.status === 'active' ? 'is-active' : 'is-stale'}`}
        />
      ))}

      {/* second-hop nodes */}
      {secondHopPositions.map(({ connection, point }) => (
        <g
          key={`node2-${connection.peer}`}
          className={`graph-node graph-node-2 ${connection.status === 'active' ? 'is-active' : 'is-stale'}`}
          transform={`translate(${point.x}, ${point.y})`}
        >
          <circle r="7" />
          <text y="20" textAnchor="middle">{truncateAddress(connection.peer, 3)}</text>
        </g>
      ))}

      {/* first-hop nodes */}
      {firstHopPositions.map(({ connection, point }) => (
        <g
          key={`node-${connection.peer}`}
          className={`graph-node ${connection.status === 'active' ? 'is-active' : 'is-stale'} ${
            hovered === connection.peer ? 'is-hovered' : ''
          }`}
          transform={`translate(${point.x}, ${point.y})`}
          onMouseEnter={() => setHovered(connection.peer)}
          onMouseLeave={() => setHovered(null)}
          onClick={() => onSelectConnection?.(connection)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onSelectConnection?.(connection)
          }}
        >
          <circle r="14" />
          <text y="30" textAnchor="middle">{truncateAddress(connection.peer, 4)}</text>
        </g>
      ))}

      {/* center node */}
      <g className="graph-node graph-node-center" transform={`translate(${CENTER.x}, ${CENTER.y})`}>
        <circle r="20" />
        <text y="36" textAnchor="middle">{truncateAddress(center, 4)} (you)</text>
      </g>
    </svg>
  )
}

export default NetworkGraph
