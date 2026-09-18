import '../App.css'
import ParticleNetwork from '../ParticleNetwork'
import Carousel from '../Carousel'
import LifecycleCarousel from '../LifecycleCarousel'
import ProtocolJourney from '../ProtocolJourney'
import UseCaseScroll from '../UseCaseScroll'
import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'

const NAV_LINKS = ['Protocol', 'Docs', 'Ecosystem', 'About']


const ARCHITECTURE_LAYERS = [
  { title: 'Rio', body: 'Governance and staking activity \u2014 the evidence environment relationships are drawn from.' },
  { title: 'Envio', body: 'Indexes that activity and derives relationship signals from it.' },
  { title: 'Verified Connections', body: 'Signals backed by evidence and a freshness window become verified, pairwise connections.' },
  { title: 'Rhizome', body: 'Reads active connections against a community\u2019s anchors to derive membership.' },
  { title: 'Monad', body: 'Records canonical connections and enforces membership-sensitive rights onchain.' },
]

// Reveals a headline with a fast, cinematic "speedster" drop: the
// element streaks down from above with directional motion-trail
// ghosts, then lands sharply and goes perfectly crisp. Runs once, only
// when the section scrolls into view, and is skipped entirely under
// prefers-reduced-motion (headline just appears in place).
function useDropReveal() {
  const ref = useRef(null)
  const [played, setPlayed] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return undefined

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPlayed(true)
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPlayed(true)
          observer.disconnect()
        }
      },
      { threshold: 0.4 }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return { ref, played }
}

const CONDITION_TABS = [
  { key: 'evidence', label: 'Evidence', body: 'Every Verified Connection is backed by evidence \u2014 like shared governance participation on Rio \u2014 rather than a subjective judgment.' },
  { key: 'signal', label: 'Signal', body: 'A Rhizome defines the relationship signal it looks for. The MVP signal is shared governance participation between two wallets.' },
  { key: 'freshness', label: 'Freshness', body: 'A connection only counts while it\u2019s active. Once qualifying activity falls outside the freshness window, the connection goes stale.' },
  { key: 'anchors', label: 'Anchors', body: 'A Rhizome starts with up to three bootstrap members who act as anchors. Membership is derived from active connections with those anchors.' },
]

const COMPARISON = [
  ['Admin decides who belongs', 'Verified connections decide who belongs'],
  ['Static member list', 'Derived membership'],
  ['Manual approval', 'Connection evaluation'],
  ['Manual removal', 'Membership becomes inactive'],
  ['Platform-specific roles', 'Shared, verifiable state'],
  ['Membership is assigned', 'Membership is derived'],
]

const DEV_INTEGRATIONS = [
  { icon: 'bi-code-slash', title: 'Read membership directly onchain', body: 'Call checkMembership from your own contract \u2014 no oracle, no offchain indexer required.' },
  { icon: 'bi-diagram-3', title: 'Compose rights into your app', body: 'Gate a mint, a vote, or a payout on live Rhizome membership instead of a static allowlist.' },
  { icon: 'bi-arrow-repeat', title: 'React to relationship changes', body: 'Membership changes emit a contract event \u2014 build logic that updates the moment a relationship expires or is revoked.' },
  { icon: 'bi-lightning-charge', title: 'Built for Monad throughput', body: 'Frequent relationship and membership updates stay cheap enough to re-check on every interaction.' },
]

const IRHIZOME_INTERFACE = `interface IRhizome {
  function checkMembership(
    address wallet,
    bytes32 rhizomeId
  ) external returns (bool active);

  function membershipOf(
    address wallet,
    bytes32 rhizomeId
  ) external view returns (bool active, uint64 since);
}`

function Landing() {
  const [activeTab, setActiveTab] = useState('evidence')
  const activeCondition = CONDITION_TABS.find((t) => t.key === activeTab)
  const scaleHeadline = useDropReveal()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="page">
      <div className="nav-wrap">
        <header className="nav">
          <div className="brand">
            <i className="bi bi-diagram-3-fill" />
            <span>Rhizome</span>
          </div>
          <nav className="nav-links">
            {NAV_LINKS.map((link) => (
              <a key={link} href="#">{link}</a>
            ))}
          </nav>
          <div className="nav-actions">
            <Link to="/app" className="btn-primary">Launch app</Link>
            <button
              className="nav-menu-btn"
              aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen((v) => !v)}
            >
              <i className={`bi ${mobileNavOpen ? 'bi-x-lg' : 'bi-list'}`} />
            </button>
          </div>
        </header>
        {mobileNavOpen && (
          <nav className="nav-mobile-menu">
            {NAV_LINKS.map((link) => (
              <a key={link} href="#" onClick={() => setMobileNavOpen(false)}>{link}</a>
            ))}
          </nav>
        )}
      </div>

      <main>
        <section className="hero">
          <div className="hero-graph-bg" aria-hidden="true">
            <ParticleNetwork />
          </div>
          <div className="hero-content">
            <p className="hero-eyebrow">Monad Metropolis · Social / Culture</p>
            <h1>
              Membership, proven
              <br />
              not assigned.
            </h1>
            <p className="hero-sub">
              A community isn't a list of approved addresses. It's a set of verified
              connections. When enough of them are active, membership emerges.
            </p>
            <div className="hero-actions">
              <Link to="/app" className="btn-primary">Launch app <i className="bi bi-arrow-right" /></Link>
              <button className="btn-ghost">Read the docs</button>
            </div>
          </div>
        </section>

        <section className="section-block feature">
          <p className="eyebrow">How membership evolves</p>
          <h2 className="section-heading">The graph can become the membership system.</h2>
          <p className="section-sub">
            Relationships form, go stale, and are evaluated against each community's
            membership requirement. Membership changes with the graph.
          </p>
          <Carousel />
        </section>

        <section className="section-block lifecycle">
          <div className="lifecycle-bg" />
          <p className="eyebrow light">Protocol lifecycle</p>
          <h2 className="section-heading light">
            From relationship
            <br />
            to programmable right.
          </h2>
          <LifecycleCarousel />
        </section>

        <section className="section-block alt journey-section">
          <p className="eyebrow">How Rhizome works</p>
          <h2 className="section-heading">Membership is a derived state.</h2>
          <p className="section-sub">
            You aren't permanently added to a Rhizome. Your active connections are evaluated
            against its membership requirement. If you qualify, your membership is active. If
            your connections go stale, it becomes inactive.
          </p>
          <ProtocolJourney />
        </section>

        <section className="section-block dark">
          <h2 className="section-heading light">The graph is the input. Active connections define membership.</h2>
          <p className="section-sub light">
            Rhizome doesn't ask who approved you. It asks whether your active connections
            satisfy the requirement right now.
          </p>
          <div className="graph-metrics-layout">
            <div className="graph-panel">
              <ParticleNetwork theme="dark" />
            </div>
            <div className="graph-example">
              <p className="graph-example-label">Alice's connections</p>
              <ul className="graph-example-list">
                <li className="is-active">
                  <i className="bi bi-check-circle-fill" />
                  Alice ↔ Bob — Verified Connection
                </li>
                <li className="is-active">
                  <i className="bi bi-check-circle-fill" />
                  Alice ↔ Charlie — Verified Connection
                </li>
                <li className="is-expired">
                  <i className="bi bi-x-circle-fill" />
                  Alice ↔ David — Stale
                </li>
              </ul>
              <div className="graph-example-rule">
                <span className="graph-example-rule-label">Membership requirement</span>
                <span className="graph-example-rule-value">2+ active connections</span>
              </div>
              <div className="graph-example-result">
                <span className="graph-example-result-label">Result</span>
                <span className="graph-example-result-value">Active member</span>
              </div>
            </div>
          </div>
          <p className="graph-note">
            Rhizome doesn't create social relationships. It evaluates what they mean for a
            community.
          </p>
        </section>

        <section className="section-block">
          <h2 className="section-heading">Define what belonging means.</h2>
          <div className="tabs">
            {CONDITION_TABS.map((t) => (
              <button
                key={t.key}
                className={`tab ${activeTab === t.key ? 'tab-active' : ''}`}
                onClick={() => setActiveTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <p className="tab-body">{activeCondition.body}</p>
        </section>

        <section className="section-block alt">
          <h2 className="section-heading">
            Stop managing lists.
            <br />
            Start deriving membership.
          </h2>
          <table className="comparison">
            <thead>
              <tr>
                <th>Traditional communities</th>
                <th>Rhizome</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map(([a, b]) => (
                <tr key={a}>
                  <td>{a}</td>
                  <td>{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="section-block scale-editorial" ref={scaleHeadline.ref}>
          <div className="scale-editorial-grid">
            <div className="scale-editorial-copy">
              <h2 className={`scale-drop-heading ${scaleHeadline.played ? 'is-dropped' : ''}`}>
                <span className="scale-drop-trail" aria-hidden="true">
                  A protocol for living
                  <br />
                  communities.
                </span>
                <span className="scale-drop-trail scale-drop-trail-2" aria-hidden="true">
                  A protocol for living
                  <br />
                  communities.
                </span>
                <span className="scale-drop-final">
                  A protocol for living
                  <br />
                  communities.
                </span>
              </h2>
            </div>
            <div className="scale-editorial-steps">
              {ARCHITECTURE_LAYERS.map((l, i) => (
                <div className="scale-step-row" key={l.title}>
                  <span className="scale-step-index">{String(i + 1).padStart(2, '0')}</span>
                  <div className="scale-step-body">
                    <h3>{l.title}</h3>
                    <p>{l.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="scale-editorial-rights">Voting · Resources · Rewards</p>
        </section>

        <section className="section-block">
          <h2 className="section-heading">Integrate Rhizome into your app.</h2>
          <p className="section-sub">
            Membership isn't a UI badge. It's shared, verifiable state that applications and
            contracts can independently evaluate.
          </p>
          <div className="dev-layout">
            <div className="dev-list">
              {DEV_INTEGRATIONS.map((d) => (
                <div className="dev-item" key={d.title}>
                  <i className={`bi ${d.icon}`} />
                  <div>
                    <h3>{d.title}</h3>
                    <p>{d.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="code-panel">
              <div className="code-panel-head">
                <span className="code-dot" />
                <span className="code-dot" />
                <span className="code-dot" />
                <span className="code-filename">IRhizome.sol</span>
              </div>
              <pre><code>{IRHIZOME_INTERFACE}</code></pre>
            </div>
          </div>
          <div className="hero-actions dev-cta">
            <button className="btn-primary">View developer docs <i className="bi bi-arrow-right" /></button>
          </div>
        </section>

        <section className="section-block alt usecase-section">
          <h2 className="section-heading">Where it starts</h2>
          <UseCaseScroll />
        </section>

        <section className="cta">
          <h2>
            Membership should move
            <br />
            with the community.
          </h2>
          <p>Build communities that evolve through real relationships.</p>
          <div className="hero-actions center">
            <Link to="/app" className="btn-primary">Launch Rhizome <i className="bi bi-arrow-right" /></Link>
            <button className="btn-ghost-dark">Read the docs</button>
          </div>
        </section>
      </main>
    </div>
  )
}

export default Landing
