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

function RhizomeRow({ rhizome: r }) {
  const need = r.minimumConnections
  return (
    <Link to={`/app/rhizomes/${r.address}`} className={`rz-row ${r.isMember ? 'is-member' : ''}`}>
      <div className="rz-main">
        <h3>{r.name}</h3>
        <p>
          Needs {need} {need === 1 ? 'connection' : 'connections'} to anchors through {r.signalLabel || 'shared activity'}, active within the last {r.freshnessPeriodDays ?? 30} days.
        </p>
      </div>
      <RhizomeNodes have={r.qualifyingCount} need={need} />
      <span className={`rz-pill ${r.isMember ? 'is-member' : ''}`}>
        {r.isMember ? 'Member' : `${r.qualifyingCount} of ${need} connected`}
      </span>
    </Link>
  )
}

export default RhizomeRow
