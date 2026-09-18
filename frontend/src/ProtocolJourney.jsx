import { useEffect, useRef, useState } from 'react'

import connectAvif from './assets/step-connect.avif'
import connectWebp from './assets/step-connect.webp'
import evaluateAvif from './assets/step-evaluate.avif'
import evaluateWebp from './assets/step-evaluate.webp'
import activateAvif from './assets/step-activate.avif'
import activateWebp from './assets/step-activate.webp'
import decayAvif from './assets/step-decay.avif'
import decayWebp from './assets/step-decay.webp'

const STEPS = [
  {
    n: '01',
    title: 'Connect',
    body: 'Two wallets create a mutual relationship. Rhizome begins with real connections rather than a static list of approved addresses.',
    avif: connectAvif,
    webp: connectWebp,
  },
  {
    n: '02',
    title: 'Evaluate',
    body: 'Envio derives a relationship signal from the activity, and it\u2019s checked against the Rhizome\u2019s membership requirement.',
    avif: evaluateAvif,
    webp: evaluateWebp,
  },
  {
    n: '03',
    title: 'Activate',
    body: 'When the requirement is met, membership becomes active \u2014 derived from the graph, not manually approved.',
    avif: activateAvif,
    webp: activateWebp,
  },
  {
    n: '04',
    title: 'Decay',
    body: 'When a qualifying connection falls outside its freshness window, it goes stale and membership updates to reflect it.',
    avif: decayAvif,
    webp: decayWebp,
  },
]

const AUTOPLAY_MS = 4000

function ProtocolJourney() {
  const [active, setActive] = useState(0)
  const [isHovering, setIsHovering] = useState(false)
  const [isPageHidden, setIsPageHidden] = useState(false)
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

  useEffect(() => {
    if (reducedMotionRef.current || isHovering || isPageHidden) return undefined
    const id = setInterval(() => {
      setActive((i) => (i + 1) % STEPS.length)
    }, AUTOPLAY_MS)
    return () => clearInterval(id)
  }, [active, isHovering, isPageHidden])

  return (
    <div
      className="journey-panel"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="journey-media">
        {STEPS.map((s, i) => (
          <picture key={s.n}>
            <source srcSet={s.avif} type="image/avif" />
            <source srcSet={s.webp} type="image/webp" />
            <img
              src={s.webp}
              alt=""
              className={i === active ? 'is-active' : ''}
              width="1200"
              height="569"
              loading={i === 0 ? 'eager' : 'lazy'}
            />
          </picture>
        ))}
      </div>

      <div className="journey-steps">
        {STEPS.map((s, i) => (
          <button
            key={s.n}
            type="button"
            className={`journey-step ${i === active ? 'is-active' : ''}`}
            onMouseEnter={() => setActive(i)}
            onClick={() => setActive(i)}
            aria-pressed={i === active}
          >
            <span className="journey-n">{s.n}</span>
            <h3>{s.title}</h3>
            <p>{s.body}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

export default ProtocolJourney