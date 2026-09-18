import { useEffect, useRef } from 'react'

// Tuning constants — kept calm and understated on purpose.
const DESKTOP_COUNT = 42
const MOBILE_COUNT = 16
const MOBILE_BREAKPOINT = 768
const LINK_DIST = 140 // px at which nodes start connecting
const SPEED_MIN = 0.006 // px/ms
const SPEED_MAX = 0.016 // px/ms
const WANDER_STRENGTH = 0.0022 // radians of turn per ms, randomized
const MOUSE_RADIUS = 110
const MOUSE_STEER = 0.035 // how strongly nodes steer toward the cursor (0-1 blend per frame)

const NODE_PULSE_CHANCE = 0.22 // fraction of nodes that ever pulse
const NODE_PULSE_PERIOD_MIN = 5200 // ms per pulse cycle
const NODE_PULSE_PERIOD_MAX = 9000
const NODE_PULSE_OPACITY = 0.22 // extra opacity added at peak
const NODE_PULSE_RADIUS = 0.9 // extra px radius added at peak
const NODE_GLOW_ALPHA = 0.1 // peak alpha of the soft halo behind a pulsing node

const LINK_HIGHLIGHT_RATIO = 0.16 // fraction of possible pairs eligible to be "verified" links
const LINK_PULSE_PERIOD_MIN = 7000
const LINK_PULSE_PERIOD_MAX = 13000
const LINK_HIGHLIGHT_BOOST = 0.4 // extra opacity (as a multiple of base link opacity) at peak

const THEMES = {
  light: {
    nodeColor: '90, 90, 90',
    linkColor: '110, 110, 110',
    nodeOpacity: 0.62,
    linkOpacity: 0.28,
  },
  lightMobile: {
    nodeColor: '0, 0, 0',
    linkColor: '0, 0, 0',
    nodeOpacity: 0.75,
    linkOpacity: 0.3,
  },
  dark: {
    nodeColor: '255, 255, 255',
    linkColor: '255, 255, 255',
    nodeOpacity: 0.85,
    linkOpacity: 0.22,
  },
}

function isMobileWidth() {
  return typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT
}

function pickTheme(theme) {
  if (theme === 'light' && isMobileWidth()) return THEMES.lightMobile
  return THEMES[theme] || THEMES.light
}


function ParticleNetwork({ theme = 'light' }) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const paletteRef = useRef(pickTheme(theme))

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return undefined

    const { nodeColor: NODE_COLOR, linkColor: LINK_COLOR, nodeOpacity: NODE_OPACITY, linkOpacity: LINK_OPACITY } =
      paletteRef.current

    const ctx = canvas.getContext('2d')
    const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

    let width = 0
    let height = 0
    let nodes = []
    let highlightPairs = new Map()
    let rafId = null
    let running = false
    let lastTime = performance.now()
    let wasMobile = isMobileWidth()
    const mouse = { x: 0, y: 0, active: false }

    function makeNode() {
      const pulsing = Math.random() < NODE_PULSE_CHANCE
      const pulsePeriod =
        NODE_PULSE_PERIOD_MIN + Math.random() * (NODE_PULSE_PERIOD_MAX - NODE_PULSE_PERIOD_MIN)
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        angle: Math.random() * Math.PI * 2,
        speed: SPEED_MIN + Math.random() * (SPEED_MAX - SPEED_MIN),
        turnBias: (Math.random() - 0.5) * WANDER_STRENGTH,
        r: 1.8 + Math.random() * 1.8,
        // Desynced per-node pulse: own phase + own speed so nothing reads
        // as a single global loop.
        pulsing,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseFreq: pulsing ? (Math.PI * 2) / pulsePeriod : 0,
      }
    }

    function createNodes(count) {
      const arr = []
      for (let i = 0; i < count; i++) arr.push(makeNode())
      return arr
    }

    function createHighlightPairs(count) {
      const map = new Map()
      if (count < 2) return map
      const maxPairs = Math.max(2, Math.round(count * LINK_HIGHLIGHT_RATIO))
      let guard = 0
      while (map.size < maxPairs && guard < maxPairs * 20) {
        guard++
        const i = Math.floor(Math.random() * count)
        let j = Math.floor(Math.random() * count)
        if (i === j) continue
        const key = i < j ? `${i}-${j}` : `${j}-${i}`
        if (map.has(key)) continue
        const period =
          LINK_PULSE_PERIOD_MIN + Math.random() * (LINK_PULSE_PERIOD_MAX - LINK_PULSE_PERIOD_MIN)
        map.set(key, {
          phase: Math.random() * Math.PI * 2,
          freq: (Math.PI * 2) / period,
        })
      }
      return map
    }

    function resize() {
      const rect = container.getBoundingClientRect()
      width = Math.max(1, rect.width)
      height = Math.max(1, rect.height)
      const dpr = Math.min(window.devicePixelRatio || 1, 2)

      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const mobileNow = isMobileWidth()
      const targetCount = mobileNow ? MOBILE_COUNT : DESKTOP_COUNT

      if (nodes.length === 0 || mobileNow !== wasMobile) {
        nodes = createNodes(targetCount)
        highlightPairs = createHighlightPairs(targetCount)
        wasMobile = mobileNow
      } else {
        // Keep existing nodes in view after a plain resize.
        nodes.forEach((n) => {
          n.x = Math.min(n.x, width)
          n.y = Math.min(n.y, height)
        })
      }
    }

    function drawFrame() {
      ctx.clearRect(0, 0, width, height)

      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i]
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < LINK_DIST) {
            let alpha = (1 - dist / LINK_DIST) * LINK_OPACITY

            const pair = highlightPairs.get(`${i}-${j}`)
            if (pair) {
              const glow = Math.sin(pair.phase) * 0.5 + 0.5 // 0..1, eased by sine
              alpha += LINK_OPACITY * LINK_HIGHLIGHT_BOOST * glow
            }

            ctx.strokeStyle = `rgba(${LINK_COLOR}, ${alpha.toFixed(3)})`
            ctx.lineWidth = 0.9
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }

      for (const n of nodes) {
        let radius = n.r
        let opacity = NODE_OPACITY

        if (n.pulsing) {
          const glow = Math.sin(n.pulsePhase) * 0.5 + 0.5 // 0..1
          radius += NODE_PULSE_RADIUS * glow
          opacity = Math.min(1, NODE_OPACITY + NODE_PULSE_OPACITY * glow)

          // Soft halo — very low alpha, slightly larger than the node.
          const haloAlpha = NODE_GLOW_ALPHA * glow
          if (haloAlpha > 0.004) {
            ctx.beginPath()
            ctx.arc(n.x, n.y, radius * 2.4, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(${NODE_COLOR}, ${haloAlpha.toFixed(3)})`
            ctx.fill()
          }
        }

        ctx.beginPath()
        ctx.arc(n.x, n.y, radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${NODE_COLOR}, ${opacity.toFixed(3)})`
        ctx.fill()
      }
    }

    function step(time) {
      const dt = Math.min(time - lastTime, 48)
      lastTime = time

      for (const pair of highlightPairs.values()) {
        pair.phase += pair.freq * dt
      }

      for (const n of nodes) {
        if (n.pulsing) n.pulsePhase += n.pulseFreq * dt

        // Slow organic wander: the heading drifts a little each frame.
        n.angle += n.turnBias * dt + (Math.random() - 0.5) * WANDER_STRENGTH * dt

        // Extremely gentle steering toward the cursor when nearby —
        // a blend of the current heading, not a hard pull.
        if (mouse.active) {
          const dx = mouse.x - n.x
          const dy = mouse.y - n.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < MOUSE_RADIUS && dist > 1) {
            const targetAngle = Math.atan2(dy, dx)
            let diff = targetAngle - n.angle
            // normalize to [-PI, PI] so the blend takes the short way round
            diff = Math.atan2(Math.sin(diff), Math.cos(diff))
            n.angle += diff * MOUSE_STEER * (1 - dist / MOUSE_RADIUS)
          }
        }

        n.x += Math.cos(n.angle) * n.speed * dt
        n.y += Math.sin(n.angle) * n.speed * dt

        const margin = 24
        if (n.x < -margin) n.x = width + margin
        if (n.x > width + margin) n.x = -margin
        if (n.y < -margin) n.y = height + margin
        if (n.y > height + margin) n.y = -margin
      }

      drawFrame()

      if (running) rafId = requestAnimationFrame(step)
    }

    function start() {
      if (running) return
      running = true
      lastTime = performance.now()
      rafId = requestAnimationFrame(step)
    }

    function stop() {
      running = false
      if (rafId) cancelAnimationFrame(rafId)
      rafId = null
    }

    function handleMouseMove(e) {
      const rect = container.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        mouse.x = x
        mouse.y = y
        mouse.active = true
      } else {
        mouse.active = false
      }
    }

    function handleMouseLeave() {
      mouse.active = false
    }

    function handleResize() {
      resize()
      if (reduceMotionQuery.matches) drawFrame()
    }

    function handleVisibility() {
      if (document.hidden) {
        stop()
      } else if (!reduceMotionQuery.matches) {
        start()
      }
    }

    function handleReduceMotionChange() {
      if (reduceMotionQuery.matches) {
        stop()
        drawFrame()
      } else {
        start()
      }
    }

    resize()

    if (reduceMotionQuery.matches) {
      drawFrame()
    } else {
      start()
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('mouseleave', handleMouseLeave)
    document.addEventListener('visibilitychange', handleVisibility)

    if (reduceMotionQuery.addEventListener) {
      reduceMotionQuery.addEventListener('change', handleReduceMotionChange)
    } else if (reduceMotionQuery.addListener) {
      // Safari < 14 fallback
      reduceMotionQuery.addListener(handleReduceMotionChange)
    }

    return () => {
      stop()
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
      document.removeEventListener('visibilitychange', handleVisibility)
      if (reduceMotionQuery.removeEventListener) {
        reduceMotionQuery.removeEventListener('change', handleReduceMotionChange)
      } else if (reduceMotionQuery.removeListener) {
        reduceMotionQuery.removeListener(handleReduceMotionChange)
      }
    }
  }, [])

  return (
    <div ref={containerRef} className="particle-network" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  )
}

export default ParticleNetwork
