import { Link } from 'react-router-dom'

export function RhizomeNodes({ have, need }) {
  const n = Math.min(Math.max(need, 1), 6)
  const f = Math.min(have, n)
  const gap = 26
  const w = (n - 1) * gap + 20
  return (
    <svg className="rz-nodes" width={w} height="20" viewBox={`0 0 ${w} 20`} role="img" aria-label={`${have} of ${need} connections`}>
      {Array.from({ length: n - 1 }, (_, i) => (
        <line key={i} x1={10 + i * gap} y1="10" x2={10 + (i + 1) * gap} y2="10" className={i + 1 < f ? 'on' : ''} />
      ))}
      {Array.from({ length: n }, (_, i) => (
        <circle key={i} cx={10 + i * gap} cy="10" r="6" className={i < f ? 'on' : ''} />
      ))}
    </svg>
  )
}

const plural = (n) => `${n} ${n === 1 ? 'connection' : 'connections'}`

/* Large panel for "your" Rhizomes. Members invert to white. */
export function RhizomePass({ rhizome: r }) {
  return (
    <Link to={`/app/rhizomes/${r.address}`} className={`pass ${r.isMember ? 'is-member' : ''}`}>
      <div className="pass-top">
        <h3>{r.name}</h3>
        <span className="pass-state">{r.isMember ? 'Member' : 'Not a member yet'}</span>
      </div>
      <p className="pass-rule">
        Connect with {plural(r.minimumConnections)} to its anchors through {r.signalLabel || 'shared activity'}, kept active within {r.freshnessPeriodDays ?? 30} days.
      </p>
      <div className="pass-foot">
        <RhizomeNodes have={r.qualifyingCount} need={r.minimumConnections} />
        <span>{r.qualifyingCount} of {r.minimumConnections} connected</span>
      </div>
    </Link>
  )
}

/* Dense directory row for Explore. */
function RhizomeRow({ rhizome: r }) {
  return (
    <Link to={`/app/rhizomes/${r.address}`} className={`dir-row ${r.isMember ? 'is-member' : ''}`}>
      <span className="dir-name">{r.name}</span>
      <span className="dir-dim">{r.signalLabel || 'Shared activity'}</span>
      <span className="dir-dim">{plural(r.minimumConnections)} in {r.freshnessPeriodDays ?? 30} days</span>
      <span className="dir-dim">{r.anchors?.length ?? 0}</span>
      <span className="dir-you">
        <RhizomeNodes have={r.qualifyingCount} need={r.minimumConnections} />
        {r.isMember ? 'Member' : `${r.qualifyingCount} of ${r.minimumConnections}`}
      </span>
    </Link>
  )
}

export default RhizomeRow
