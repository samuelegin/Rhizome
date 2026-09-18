import { useEffect, useRef, useState } from 'react'

const SLIDES = [
  {
    n: '01',
    title: 'Relationships',
    body: 'Membership begins with real connections. Rhizome evaluates verifiable relationships that exist within the network rather than relying on a static list.',
  },
  {
    n: '02',
    title: 'Requirement',
    body: 'A community sets a membership requirement \u2014 a relationship signal, a freshness window, and how many active connections with its anchors are needed.',
  },
  {
    n: '03',
    title: 'Membership',
    body: 'When the requirement is met, membership becomes active. It is a derived state that can become inactive again if a connection goes stale.',
  },
  {
    n: '04',
    title: 'Rights',
    body: 'Active membership becomes a programmable right \u2014 usable for voting, resources, and rewards by any application that reads it.',
  },
]

const DRAG_THRESHOLD_RATIO = 0.18
const AUTOPLAY_MS = 4000

function getSizes() {
  const w = typeof window !== 'undefined' ? window.innerWidth : 1280
  if (w < 640) {
    return { active: Math.round(w * 0.74), inactive: Math.round(w * 0.2), gap: 12, height: 230 }
  }
  if (w < 1024) {
    return { active: 400, inactive: 160, gap: 14, height: 260 }
  }
  return { active: 480, inactive: 190, gap: 16, height: 280 }
}

function LifecycleCarousel() {
  const [index, setIndex] = useState(0)
  const [sizes, setSizes] = useState(getSizes)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [isPageHidden, setIsPageHidden] = useState(false)
  const dragRef = useRef({ startX: 0, active: false })
  const reducedMotionRef = useRef(false)

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  useEffect(() => {
    function onResize() {
      setSizes(getSizes())
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    function onVisibility() {
      setIsPageHidden(document.hidden)
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  const wrap = (i) => (i + SLIDES.length) % SLIDES.length
  const goTo = (i) => setIndex(wrap(i))
  const next = () => setIndex((i) => wrap(i + 1))
  const prev = () => setIndex((i) => wrap(i - 1))

  useEffect(() => {
    if (reducedMotionRef.current || isDragging || isHovering || isPageHidden) return undefined
    const id = setInterval(() => {
      setIndex((i) => wrap(i + 1))
    }, AUTOPLAY_MS)
    return () => clearInterval(id)
  }, [isDragging, isHovering, isPageHidden])

  const widthFor = (i) => (i === index ? sizes.active : sizes.inactive)

  function offsetFor(target) {
    let x = 0
    for (let i = 0; i < target; i += 1) {
      x += widthFor(i) + sizes.gap
    }
    return x
  }

  const translate = -offsetFor(index) + dragOffset

  function onPointerDown(e) {
    dragRef.current = { startX: e.clientX, active: true }
    setIsDragging(true)
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }

  function onPointerMove(e) {
    if (!dragRef.current.active) return
    setDragOffset(e.clientX - dragRef.current.startX)
  }

  function endDrag() {
    if (!dragRef.current.active) return
    const threshold = sizes.active * DRAG_THRESHOLD_RATIO
    if (dragOffset < -threshold) next()
    else if (dragOffset > threshold) prev()
    dragRef.current.active = false
    setIsDragging(false)
    setDragOffset(0)
  }

  return (
    <div
      className="lc-carousel"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="lc-viewport">
        <div
          className={`lc-track ${isDragging ? 'dragging' : ''}`}
          style={{ transform: `translateX(${translate}px)`, gap: `${sizes.gap}px` }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
          onPointerCancel={endDrag}
        >
          {SLIDES.map((s, i) => {
            const active = i === index
            return (
              <div
                key={s.n}
                className={`lc-card ${active ? 'is-active' : ''}`}
                style={{ width: `${widthFor(i)}px`, height: `${sizes.height}px` }}
              >
                <span className="lc-n">{s.n}</span>
                <h3>{s.title}</h3>
                {active && (
                  <>
                    <div className="lc-divider" />
                    <p className="lc-body">{s.body}</p>
                    <p className="lc-tag">Rhizome Protocol</p>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="lc-controls">
        <button
          type="button"
          className="lc-arrow"
          onClick={prev}
          aria-label="Previous stage"
        >
          <i className="bi bi-arrow-left" />
        </button>
        <div className="lc-dots">
          {SLIDES.map((s, i) => (
            <button
              key={s.n}
              type="button"
              className={`lc-dot ${i === index ? 'is-active' : ''}`}
              onClick={() => goTo(i)}
              aria-label={`Go to ${s.title}`}
            />
          ))}
        </div>
        <button
          type="button"
          className="lc-arrow"
          onClick={next}
          aria-label="Next stage"
        >
          <i className="bi bi-arrow-right" />
        </button>
      </div>
    </div>
  )
}

export default LifecycleCarousel
