import { useEffect, useMemo, useRef, useState } from 'react'
import { truncateAddress } from '../../lib/formatters'

const WIDTH = 720
const HEIGHT = 520
const CENTER = { x: WIDTH / 2, y: HEIGHT / 2 }
const RING_1 = 165
const RING_2 = 250

const CENTER_WANDER_RADIUS = 7
const FIRST_HOP_WANDER_RADIUS = 13
const SECOND_HOP_WANDER_RADIUS = 9
const WANDER_PERIOD_MIN = 4200
const WANDER_PERIOD_MAX = 8600

function polarPoint(center, radius, angle) {
  return {
    x: center.x + radius * Math.cos(angle),
    y: center.y + radius * Math.sin(angle),
  }
}

function makeWander(radius) {
  return {
    radius,
    phaseX: Math.random() * Math.PI * 2,
    phaseY: Math.random() * Math.PI * 2,
    freqX: (Math.PI * 2) / (WANDER_PERIOD_MIN + Math.random() * (WANDER_PERIOD_MAX - WANDER_PERIOD_MIN)),
    freqY: (Math.PI * 2) / (WANDER_PERIOD_MIN + Math.random() * (WANDER_PERIOD_MAX - WANDER_PERIOD_MIN)),
  }
}

function NetworkGraph({ center, connections, secondHop = [], onSelectConnection, showStale = true }) {
  const [hovered, setHovered] = useState(null)

  const centerNodeRef = useRef(null)
  const centerLabelRef = useRef(null)
  const nodeRefs = useRef(new Map())
  const edgeRefs = useRef(new Map())
  const wanderRefs = useRef(new Map())

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

  useEffect(() => {
    const liveKeys = new Set(['center'])
    firstHopPositions.forEach(({ connection }) => liveKeys.add(`node-${connection.peer}`))
    secondHopPositions.forEach(({ connection }) => liveKeys.add(`node2-${connection.peer}`))

    if (!wanderRefs.current.has('center')) {
      wanderRefs.current.set('center', makeWander(CENTER_WANDER_RADIUS))
    }
    firstHopPositions.forEach(({ connection }) => {
      const key = `node-${connection.peer}`
      if (!wanderRefs.current.has(key)) {
        wanderRefs.current.set(key, makeWander(FIRST_HOP_WANDER_RADIUS))
      }
    })
    secondHopPositions.forEach(({ connection }) => {
      const key = `node2-${connection.peer}`
      if (!wanderRefs.current.has(key)) {
        wanderRefs.current.set(key, makeWander(SECOND_HOP_WANDER_RADIUS))
      }
    })
    for (const key of wanderRefs.current.keys()) {
      if (!liveKeys.has(key)) wanderRefs.current.delete(key)
    }
  }, [firstHopPositions, secondHopPositions])

  useEffect(() => {
    const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (reduceMotionQuery.matches) return undefined

    let rafId = null
    let running = false

    function offsetFor(wander, time) {
      return {
        dx: Math.sin(time * wander.freqX + wander.phaseX) * wander.radius,
        dy: Math.cos(time * wander.freqY + wander.phaseY) * wander.radius,
      }
    }

    function step(time) {
      const centerWander = wanderRefs.current.get('center')
      let centerFloat = CENTER
      if (centerWander && centerNodeRef.current) {
        const { dx, dy } = offsetFor(centerWander, time)
        centerFloat = { x: CENTER.x + dx, y: CENTER.y + dy }
        centerNodeRef.current.setAttribute('transform', `translate(${centerFloat.x}, ${centerFloat.y})`)
      }

      firstHopPositions.forEach(({ connection, point }) => {
        const key = `node-${connection.peer}`
        const wander = wanderRefs.current.get(key)
        const node = nodeRefs.current.get(key)
        const edge = edgeRefs.current.get(key)
        if (!wander || !node) return
        const { dx, dy } = offsetFor(wander, time)
        const floated = { x: point.x + dx, y: point.y + dy }
        node.setAttribute('transform', `translate(${floated.x}, ${floated.y})`)
        if (edge) {
          edge.setAttribute('x1', centerFloat.x)
          edge.setAttribute('y1', centerFloat.y)
          edge.setAttribute('x2', floated.x)
          edge.setAttribute('y2', floated.y)
        }
        node.dataset.x = floated.x
        node.dataset.y = floated.y
      })

      secondHopPositions.forEach(({ connection, point: anchor }) => {
        const key = `node2-${connection.peer}`
        const wander = wanderRefs.current.get(key)
        const node = nodeRefs.current.get(key)
        const edge = edgeRefs.current.get(key)
        const parentNode = nodeRefs.current.get(`node-${connection.via}`)
        if (!wander || !node) return
        const { dx, dy } = offsetFor(wander, time)
        const floated = { x: anchor.x + dx, y: anchor.y + dy }
        node.setAttribute('transform', `translate(${floated.x}, ${floated.y})`)
        if (edge) {
          const parentX = parentNode ? Number(parentNode.dataset.x) : anchor.x
          const parentY = parentNode ? Number(parentNode.dataset.y) : anchor.y
          edge.setAttribute('x1', parentX)
          edge.setAttribute('y1', parentY)
          edge.setAttribute('x2', floated.x)
          edge.setAttribute('y2', floated.y)
        }
      })

      if (running) rafId = requestAnimationFrame(step)
    }

    function start() {
      if (running) return
      running = true
      rafId = requestAnimationFrame(step)
    }

    function stop() {
      running = false
      if (rafId) cancelAnimationFrame(rafId)
      rafId = null
    }

    function handleVisibility() {
      if (document.hidden) stop()
      else start()
    }

    start()
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      stop()
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [firstHopPositions, secondHopPositions])

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="network-graph"
      role="img"
      aria-label="Your network of verified connections"
    >
      {firstHopPositions.map(({ connection, point }) => (
        <line
          key={`edge-${connection.peer}`}
          ref={(el) => edgeRefs.current.set(`node-${connection.peer}`, el)}
          x1={CENTER.x}
          y1={CENTER.y}
          x2={point.x}
          y2={point.y}
          className={`graph-edge ${connection.status === 'active' ? 'is-active' : 'is-stale'}`}
        />
      ))}

      {secondHopPositions.map(({ connection, parentPoint, point }) => (
        <line
          key={`edge2-${connection.peer}`}
          ref={(el) => edgeRefs.current.set(`node2-${connection.peer}`, el)}
          x1={parentPoint.x}
          y1={parentPoint.y}
          x2={point.x}
          y2={point.y}
          className={`graph-edge graph-edge-2 ${connection.status === 'active' ? 'is-active' : 'is-stale'}`}
        />
      ))}

      {secondHopPositions.map(({ connection, point }) => (
        <g
          key={`node2-${connection.peer}`}
          ref={(el) => nodeRefs.current.set(`node2-${connection.peer}`, el)}
          className={`graph-node graph-node-2 ${connection.status === 'active' ? 'is-active' : 'is-stale'}`}
          transform={`translate(${point.x}, ${point.y})`}
        >
          <circle r="7" />
          <text y="20" textAnchor="middle">{truncateAddress(connection.peer, 3)}</text>
        </g>
      ))}

      {firstHopPositions.map(({ connection, point }) => (
        <g
          key={`node-${connection.peer}`}
          ref={(el) => nodeRefs.current.set(`node-${connection.peer}`, el)}
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

      <g
        ref={(el) => {
          centerNodeRef.current = el
        }}
        className="graph-node graph-node-center"
        transform={`translate(${CENTER.x}, ${CENTER.y})`}
      >
        <circle r="20" />
        <text ref={centerLabelRef} y="36" textAnchor="middle">{truncateAddress(center, 4)} (you)</text>
      </g>
    </svg>
  )
}

export default NetworkGraph
