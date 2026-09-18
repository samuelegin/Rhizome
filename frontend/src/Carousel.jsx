import { useEffect, useLayoutEffect, useRef, useState } from 'react'

import relationshipsAvif from './assets/network-evolve.avif'
import relationshipsWebp from './assets/network-evolve.webp'
import verificationAvif from './assets/network-card.avif'
import verificationWebp from './assets/network-card.webp'
import decayAvif from './assets/feature-left.avif'
import decayWebp from './assets/feature-left.webp'

const SLIDES = [
  {
    key: 'relationships',
    eyebrow: 'Relationships',
    title: 'Membership begins with connection.',
    body: 'Rhizome derives membership from relationships that exist inside the network, rather than from a static list of approved addresses.',
    cta: 'Explore relationships',
    avif: relationshipsAvif,
    webp: relationshipsWebp,
    anchor: 'center',
  },
  {
    key: 'verification',
    eyebrow: 'Verification',
    title: 'Connections must prove their weight.',
    body: 'Relationships become Verified Connections only when they\u2019re backed by evidence and stay within the freshness window.',
    cta: 'How verification works',
    avif: verificationAvif,
    webp: verificationWebp,
    anchor: 'center',
  },
  {
    key: 'decay',
    eyebrow: 'Decay',
    title: 'Membership evolves when relationships do.',
    body: 'Connections that fall outside the freshness window go stale, and membership updates to reflect it.',
    cta: 'Explore decay',
    avif: decayAvif,
    webp: decayWebp,
    anchor: 'left',
  },
]

const GAP = 24
const DRAG_THRESHOLD_RATIO = 0.15
const AUTOPLAY_MS = 4000

function useMeasuredWidth() {
  const ref = useRef(null)
  const [width, setWidth] = useState(0)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return undefined
    setWidth(el.getBoundingClientRect().width)
    const ro = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return [ref, width]
}

function Carousel() {
  const [viewportRef, viewportWidth] = useMeasuredWidth()
  const slideRef = useRef(null)
  const [slideWidth, setSlideWidth] = useState(0)
  const [index, setIndex] = useState(0)
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
    function onVisibility() {
      setIsPageHidden(document.hidden)
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  useLayoutEffect(() => {
    if (slideRef.current) setSlideWidth(slideRef.current.getBoundingClientRect().width)
  }, [viewportWidth])

  useEffect(() => {
    if (!slideRef.current) return undefined
    const ro = new ResizeObserver((entries) => {
      setSlideWidth(entries[0].contentRect.width)
    })
    ro.observe(slideRef.current)
    return () => ro.disconnect()
  }, [])

  const lastIndex = SLIDES.length - 1
  const clampIndex = (i) => Math.max(0, Math.min(lastIndex, i))
  const wrapIndex = (i) => (i + SLIDES.length) % SLIDES.length
  const goTo = (i) => setIndex(clampIndex(i))
  const next = () => goTo(index + 1)
  const prev = () => goTo(index - 1)

  useEffect(() => {
    if (reducedMotionRef.current || isDragging || isHovering || isPageHidden) return undefined
    const id = setInterval(() => {
      setIndex((i) => wrapIndex(i + 1))
    }, AUTOPLAY_MS)
    return () => clearInterval(id)
  }, [isDragging, isHovering, isPageHidden])

  const step = slideWidth + GAP
  const baseTranslate = viewportWidth / 2 - (index * step + slideWidth / 2)
  const translate = baseTranslate + dragOffset

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
    const threshold = slideWidth * DRAG_THRESHOLD_RATIO
    if (dragOffset < -threshold) next()
    else if (dragOffset > threshold) prev()
    dragRef.current.active = false
    setIsDragging(false)
    setDragOffset(0)
  }

  return (
    <div
      className="carousel"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="carousel-viewport" ref={viewportRef}>
        <div
          className={`carousel-track ${isDragging ? 'dragging' : ''}`}
          style={{ transform: `translateX(${translate}px)`, gap: `${GAP}px` }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
          onPointerCancel={endDrag}
        >
          {SLIDES.map((s, i) => (
            <div
              className={`carousel-slide ${i === index ? 'is-active' : ''}`}
              key={s.key}
              ref={i === 0 ? slideRef : null}
            >
              <div className={`carousel-media anchor-${s.anchor}`}>
                <picture>
                  <source srcSet={s.avif} type="image/avif" />
                  <source srcSet={s.webp} type="image/webp" />
                  <img
                    src={s.webp}
                    alt=""
                    width="1200"
                    height="700"
                    loading={i === 0 ? 'eager' : 'lazy'}
                    draggable="false"
                  />
                </picture>
              </div>
              <div className="carousel-text">
                <p className="carousel-eyebrow">{s.eyebrow}</p>
                <h3>{s.title}</h3>
                <p className="carousel-body">{s.body}</p>
                <a href="#" className="editorial-link" onClick={(e) => e.preventDefault()}>
                  {s.cta} <i className="bi bi-arrow-right" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="carousel-controls">
        <button
          type="button"
          className="carousel-arrow"
          onClick={prev}
          disabled={index === 0}
          aria-label="Previous slide"
        >
          <i className="bi bi-arrow-left" />
        </button>
        <div className="carousel-dots">
          {SLIDES.map((s, i) => (
            <button
              key={s.key}
              type="button"
              className={`carousel-dot ${i === index ? 'is-active' : ''}`}
              onClick={() => goTo(i)}
              aria-label={`Go to ${s.eyebrow} slide`}
            />
          ))}
        </div>
        <button
          type="button"
          className="carousel-arrow"
          onClick={next}
          disabled={index === lastIndex}
          aria-label="Next slide"
        >
          <i className="bi bi-arrow-right" />
        </button>
      </div>
    </div>
  )
}

export default Carousel
