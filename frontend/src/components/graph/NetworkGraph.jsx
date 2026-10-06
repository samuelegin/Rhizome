import { useEffect, useMemo, useRef, useState } from 'react'
import { truncateAddress } from '../../lib/formatters'

const EMPTY = []
const HIT_RADIUS = 22 // viewBox units around a node that count as hovering it
const MOUSE_RADIUS = 120
const MOUSE_PULL = 0.9 // nodes drift gently toward the cursor

const WIDTH = 1100
const HEIGHT = 620
const CENTER = { x: WIDTH / 2, y: HEIGHT / 2 }

const REPULSION = 1100
const LINK_DISTANCE = 170
const LINK_STRENGTH = 0.018
const CENTER_PULL = 0.0006
const CENTER_NODE_PULL = 0.0035
const COLLISION_PADDING = 6
const DAMPING = 0.9
const MAX_SPEED = 0.045
const JITTER = 0.0009
const BOUNDS_MARGIN = 60
const BOUNDS_PUSH = 0.002

function nodeRadius({ isCenter, evidenceCount = 1 }) {
  if (isCenter) return 11
  return evidenceCount >= 3 ? 8 : 6
}

function reconcileGraph(existing, connections, secondHop, centerAddress) {
  const previousNodes = existing ? new Map(existing.nodes.map((n) => [n.id, n])) : new Map()
  const nodes = new Map()
  const links = []

  function getOrCreateNode(key, isCenter, status, evidenceCount, spawnRadiusRange) {
    const prior = previousNodes.get(key)
    if (prior) {
      prior.status = status
      prior.radius = nodeRadius({ isCenter, evidenceCount })
      nodes.set(key, prior)
      return
    }
    const angle = Math.random() * Math.PI * 2
    const [minR, maxR] = spawnRadiusRange
    const radius = minR + Math.random() * (maxR - minR)
    nodes.set(key, {
      id: key,
      isCenter,
      status,
      radius: nodeRadius({ isCenter, evidenceCount }),
      x: CENTER.x + Math.cos(angle) * radius,
      y: CENTER.y + Math.sin(angle) * radius,
      vx: 0,
      vy: 0,
    })
  }

  getOrCreateNode('center', true, undefined, undefined, [0, 20])

  connections.forEach((c) => {
    const key = c.peer.toLowerCase()
    getOrCreateNode(key, false, c.status, c.evidenceCount, [90, 310])
    links.push({ source: 'center', target: key, status: c.status })
  })

  secondHop.forEach((c) => {
    const key = c.peer.toLowerCase()
    const viaKey = c.via?.toLowerCase()
    if (!viaKey || !nodes.has(viaKey) || nodes.has(key)) return
    getOrCreateNode(key, false, c.status, c.evidenceCount, [200, 460])
    links.push({ source: viaKey, target: key, status: c.status })
  })

  // Wallet info for the hover/click tooltip.
  const directKeys = new Set(connections.map((c) => c.peer.toLowerCase()))
  const list = Array.from(nodes.values())
  list.forEach((n) => {
    n.address = n.isCenter ? centerAddress || '' : n.id
    n.label = n.isCenter ? 'You' : directKeys.has(n.id) ? 'Connection' : 'Friend of a connection'
  })

  return { nodes: list, links }
}

function NetworkGraph({ center, connections = EMPTY, secondHop = EMPTY, showStale = true, onSelectConnection }) {
  const visibleConnections = useMemo(
    () => connections.filter((c) => showStale || c.status === 'active'),
    [connections, showStale]
  )
  const visibleSecondHop = useMemo(
    () => secondHop.filter((c) => showStale || c.status === 'active'),
    [secondHop, showStale]
  )

  const graphRef = useRef(null)
  const inputsRef = useRef({})
  const svgRef = useRef(null)
  const tipRef = useRef(null)
  const mouseRef = useRef({ x: 0, y: 0, active: false })
  const hoverIdRef = useRef(null)
  const pinnedIdRef = useRef(null)
  const [hoverId, setHoverId] = useState(null)
  const [pinned, setPinned] = useState(null) // { id, copied }
  const nodeElRefs = useRef(new Map())
  const linkElRefs = useRef(new Map())

  useEffect(() => {
    const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

    let rafId = null
    let running = false

    function applyForces() {
      const { nodes, links } = graphRef.current
      const byId = new Map(nodes.map((n) => [n.id, n]))

      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const a = nodes[i]
          const b = nodes[j]
          const dx = b.x - a.x
          const dy = b.y - a.y
          const distSq = Math.max(dx * dx + dy * dy, 1)
          const dist = Math.sqrt(distSq)
          const force = REPULSION / distSq
          const fx = (dx / dist) * force
          const fy = (dy / dist) * force
          a.vx -= fx
          a.vy -= fy
          b.vx += fx
          b.vy += fy

          const minDist = a.radius + b.radius + COLLISION_PADDING
          if (dist < minDist) {
            const overlap = (minDist - dist) / 2
            const nx = dx / dist
            const ny = dy / dist
            a.x -= nx * overlap
            a.y -= ny * overlap
            b.x += nx * overlap
            b.y += ny * overlap
          }
        }
      }

      links.forEach((link) => {
        const a = byId.get(link.source)
        const b = byId.get(link.target)
        if (!a || !b) return
        const dx = b.x - a.x
        const dy = b.y - a.y
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1)
        const force = (dist - LINK_DISTANCE) * LINK_STRENGTH
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force
        a.vx += fx
        a.vy += fy
        b.vx -= fx
        b.vy -= fy
      })

      nodes.forEach((n) => {
        const pull = n.isCenter ? CENTER_NODE_PULL : CENTER_PULL
        n.vx += (CENTER.x - n.x) * pull
        n.vy += (CENTER.y - n.y) * pull

        n.vx += (Math.random() - 0.5) * JITTER
        n.vy += (Math.random() - 0.5) * JITTER

        // Interactive: nodes near the cursor drift toward it (stop at the pointer).
        const m = mouseRef.current
        if (m.active) {
          const mx = m.x - n.x
          const my = m.y - n.y
          const md = Math.sqrt(mx * mx + my * my)
          if (md < MOUSE_RADIUS && md > 14) {
            const pull = (1 - md / MOUSE_RADIUS) * MOUSE_PULL
            n.x += (mx / md) * pull
            n.y += (my / md) * pull
          }
        }

        if (n.x < BOUNDS_MARGIN) n.vx += BOUNDS_PUSH * (BOUNDS_MARGIN - n.x)
        if (n.x > WIDTH - BOUNDS_MARGIN) n.vx -= BOUNDS_PUSH * (n.x - (WIDTH - BOUNDS_MARGIN))
        if (n.y < BOUNDS_MARGIN) n.vy += BOUNDS_PUSH * (BOUNDS_MARGIN - n.y)
        if (n.y > HEIGHT - BOUNDS_MARGIN) n.vy -= BOUNDS_PUSH * (n.y - (HEIGHT - BOUNDS_MARGIN))

        n.vx *= DAMPING
        n.vy *= DAMPING

        const speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy)
        if (speed > MAX_SPEED) {
          n.vx = (n.vx / speed) * MAX_SPEED
          n.vy = (n.vy / speed) * MAX_SPEED
        }

        n.x += n.vx
        n.y += n.vy
      })
    }

    function render() {
      const { nodes, links } = graphRef.current
      nodes.forEach((n) => {
        const el = nodeElRefs.current.get(n.id)
        if (el) el.setAttribute('transform', `translate(${n.x}, ${n.y})`)
      })
      const tipId = pinnedIdRef.current || hoverIdRef.current
      if (tipId && tipRef.current) {
        const tn = nodes.find((n) => n.id === tipId)
        if (tn) {
          tipRef.current.style.left = `${(tn.x / WIDTH) * 100}%`
          tipRef.current.style.top = `${(tn.y / HEIGHT) * 100}%`
        }
      }
      links.forEach((link, i) => {
        const el = linkElRefs.current.get(i)
        const a = nodes.find((n) => n.id === link.source)
        const b = nodes.find((n) => n.id === link.target)
        if (el && a && b) {
          el.setAttribute('x1', a.x)
          el.setAttribute('y1', a.y)
          el.setAttribute('x2', b.x)
          el.setAttribute('y2', b.y)
        }
      })
    }

    function step() {
      if (!graphRef.current) {
        if (running) rafId = requestAnimationFrame(step)
        return
      }
      applyForces()
      render()
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
      else if (!reduceMotionQuery.matches) start()
    }

    if (!reduceMotionQuery.matches) start()
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      stop()
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  // Reconcile during render so wallets that arrive after mount show up at once.
  const inputs = inputsRef.current
  if (
    !graphRef.current ||
    inputs.c !== visibleConnections ||
    inputs.s !== visibleSecondHop ||
    inputs.center !== center
  ) {
    graphRef.current = reconcileGraph(graphRef.current, visibleConnections, visibleSecondHop, center)
    inputsRef.current = { c: visibleConnections, s: visibleSecondHop, center }
  }

  const { nodes, links } = graphRef.current

  function toSvgPoint(e) {
    const svg = svgRef.current
    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    return pt.matrixTransform(svg.getScreenCTM().inverse())
  }

  function handleMove(e) {
    if (!svgRef.current) return
    const p = toSvgPoint(e)
    mouseRef.current = { x: p.x, y: p.y, active: true }
    let best = null
    let bestD = Infinity
    for (const n of graphRef.current.nodes) {
      const d = Math.hypot(n.x - p.x, n.y - p.y)
      if (d < HIT_RADIUS + n.radius && d < bestD) {
        best = n
        bestD = d
      }
    }
    const id = best ? best.id : null
    if (id !== hoverIdRef.current) {
      hoverIdRef.current = id
      setHoverId(id)
    }
  }

  function handleLeave() {
    mouseRef.current.active = false
    hoverIdRef.current = null
    setHoverId(null)
  }

  function handleClick() {
    const n = graphRef.current.nodes.find((x) => x.id === hoverIdRef.current)
    if (!n) {
      pinnedIdRef.current = null
      setPinned(null)
      return
    }
    pinnedIdRef.current = n.id
    setPinned({ id: n.id, copied: false })
    if (n.address && navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(n.address)
        .then(() => setPinned((p) => (p && p.id === n.id ? { ...p, copied: true } : p)))
        .catch(() => {})
    }
    const conn = connections.find((c) => c.peer.toLowerCase() === n.id)
    if (conn && onSelectConnection) onSelectConnection(conn)
  }

  const tipNode = nodes.find((n) => n.id === (pinned ? pinned.id : hoverId))

  return (
    <div className="network-graph-stage">
    <svg
      ref={svgRef}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onClick={handleClick}
      style={{ cursor: hoverId ? 'pointer' : 'default' }}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="network-graph network-graph-ambient"
      role="img"
      aria-label="Your network of verified connections, shown as a living, drifting graph"
    >
      {links.map((link, i) => (
        <line
          key={`${link.source}-${link.target}`}
          ref={(el) => linkElRefs.current.set(i, el)}
          x1={nodes.find((n) => n.id === link.source)?.x}
          y1={nodes.find((n) => n.id === link.source)?.y}
          x2={nodes.find((n) => n.id === link.target)?.x}
          y2={nodes.find((n) => n.id === link.target)?.y}
          className={`graph-edge ${link.status === 'active' ? 'is-active' : 'is-stale'}`}
        />
      ))}

      {nodes.map((n) => (
        <g
          key={n.id}
          ref={(el) => nodeElRefs.current.set(n.id, el)}
          className={`graph-node ${n.isCenter ? 'is-center' : n.status === 'active' ? 'is-active' : 'is-stale'}${
            n.id === hoverId || (pinned && n.id === pinned.id) ? ' is-hover' : ''
          }`}
          transform={`translate(${n.x}, ${n.y})`}
        >
          <circle r={n.radius} />
        </g>
      ))}
    </svg>
    {tipNode && tipNode.address && (
      <div
        ref={tipRef}
        className="graph-tip"
        style={{ left: `${(tipNode.x / WIDTH) * 100}%`, top: `${(tipNode.y / HEIGHT) * 100}%` }}
      >
        <span className="graph-tip-label">{tipNode.label}</span>
        <code>{pinned && pinned.id === tipNode.id ? tipNode.address : truncateAddress(tipNode.address)}</code>
        <span className="graph-tip-hint">
          {pinned && pinned.id === tipNode.id
            ? pinned.copied
              ? 'Copied ✓'
              : 'Click empty space to close'
            : 'Click to copy full address'}
        </span>
      </div>
    )}
    </div>
  )
}

export default NetworkGraph
