import { useEffect, useRef, useState } from 'react'

import hackathonAvif from './assets/usecases/usecase-hackathon.avif'
import hackathonWebp from './assets/usecases/usecase-hackathon.webp'
import opensourceAvif from './assets/usecases/usecase-opensource.avif'
import opensourceWebp from './assets/usecases/usecase-opensource.webp'
import researchAvif from './assets/usecases/usecase-research.avif'
import researchWebp from './assets/usecases/usecase-research.webp'
import creatorsAvif from './assets/usecases/usecase-creators.avif'
import creatorsWebp from './assets/usecases/usecase-creators.webp'
import workinggroupsAvif from './assets/usecases/usecase-workinggroups.avif'
import workinggroupsWebp from './assets/usecases/usecase-workinggroups.webp'

const STEPS = [
  {
    title: 'Hackathon teams',
    body: 'Membership emerges from collaboration.',
    avif: hackathonAvif,
    webp: hackathonWebp,
  },
  {
    title: 'Open-source communities',
    body: 'Membership emerges from contributions.',
    avif: opensourceAvif,
    webp: opensourceWebp,
  },
  {
    title: 'Research groups',
    body: 'Membership emerges from collaboration and endorsement.',
    avif: researchAvif,
    webp: researchWebp,
  },
  {
    title: 'Creator collectives',
    body: 'Membership emerges from shared production.',
    avif: creatorsAvif,
    webp: creatorsWebp,
  },
  {
    title: 'Temporary working groups',
    body: 'Membership exists while relationships remain active.',
    avif: workinggroupsAvif,
    webp: workinggroupsWebp,
  },
]

const LAST = STEPS.length - 1

function usePinnedScrollProgress(ref, enabled) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!enabled) return undefined
    const node = ref.current
    if (!node) return undefined

    let ticking = false

    function update() {
      ticking = false
      const rect = node.getBoundingClientRect()
      const total = rect.height - window.innerHeight
      if (total <= 0) {
        setProgress(0)
        return
      }
      const scrolled = -rect.top
      setProgress(Math.min(1, Math.max(0, scrolled / total)))
    }

    function onScroll() {
      if (ticking) return
      ticking = true
      window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [ref, enabled])

  return progress
}

function usePinnedEligible() {
  const [eligible, setEligible] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(min-width: 900px)')
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

    function evaluate() {
      setEligible(query.matches && !motionQuery.matches)
    }

    evaluate()
    query.addEventListener('change', evaluate)
    motionQuery.addEventListener('change', evaluate)
    return () => {
      query.removeEventListener('change', evaluate)
      motionQuery.removeEventListener('change', evaluate)
    }
  }, [])

  return eligible
}

function UseCaseScroll() {
  const wrapperRef = useRef(null)
  const pinnedEligible = usePinnedEligible()
  const progress = usePinnedScrollProgress(wrapperRef, pinnedEligible)
  const p = progress * LAST
  const activeIndex = Math.min(LAST, Math.round(p))

  if (!pinnedEligible) {
    return (
      <div className="usecase-stacked">
        {STEPS.map((s, i) => (
          <div className="usecase-stacked-row" key={s.title}>
            <span className="usecase-index">{String(i + 1).padStart(2, '0')}</span>
            <div className="usecase-stacked-body">
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="usecase-scroll" ref={wrapperRef} style={{ height: `${STEPS.length * 100}vh` }}>
      <div className="usecase-scroll-pin">
        <div className="usecase-scroll-progress" aria-hidden="true">
          <span
            className="usecase-scroll-progress-fill"
            style={{ transform: `scaleY(${progress})` }}
          />
        </div>
        <div className="usecase-scroll-grid">
          <div className="usecase-scroll-text">
            {STEPS.map((s, i) => {
              const dist = p - i
              const opacity = Math.max(0, 1 - Math.abs(dist))
              const translate = Math.max(-1, Math.min(1, dist)) * 36
              return (
                <div
                  className="usecase-scroll-text-block"
                  key={s.title}
                  style={{
                    opacity,
                    transform: `translateY(${translate}px)`,
                    pointerEvents: i === activeIndex ? 'auto' : 'none',
                  }}
                  aria-hidden={i !== activeIndex}
                >
                  <span className="usecase-index">{String(i + 1).padStart(2, '0')}</span>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </div>
              )
            })}
          </div>
          <div className="usecase-scroll-visual">
            {STEPS.map((s, i) => {
              const dist = p - i
              const opacity = Math.max(0, 1 - Math.abs(dist))
              const scale = 1 - Math.min(1, Math.abs(dist)) * 0.06
              const z = 100 - Math.round(Math.abs(dist) * 10)
              return (
                <picture
                  className="usecase-scroll-image"
                  key={s.title}
                  style={{ opacity, transform: `scale(${scale})`, zIndex: z }}
                >
                  <source srcSet={s.avif} type="image/avif" />
                  <img src={s.webp} alt="" loading="lazy" decoding="async" />
                </picture>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default UseCaseScroll
