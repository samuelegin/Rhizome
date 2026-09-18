const SEED = [
  [30, 40], [110, 20], [190, 55], [260, 30],
  [55, 110], [140, 95], [225, 120],
  [90, 170], [200, 180],
]

const EDGES = [
  [0, 1], [1, 2], [2, 3], [0, 4], [1, 5], [2, 5],
  [3, 6], [4, 5], [5, 6], [4, 7], [5, 8], [6, 8], [7, 8],
]

// Deterministic, staggered timing per edge so nothing reads as synchronized.
function edgeTiming(i) {
  const duration = (4.4 + ((i * 0.9) % 3.2)).toFixed(2) // ~4.4s–7.6s
  const delay = ((i * 0.73) % 2.6).toFixed(2) // 0s–2.6s
  const reverse = i % 2 === 1 // alternate A→B / B→A
  return { duration, delay, reverse }
}

function GraphMark({ nodes = 9, height = 220, highlight = true, animated = false }) {
  const seed = SEED.slice(0, nodes)

  return (
    <svg
      viewBox="0 0 290 200"
      height={height}
      className={`graph-mark${animated ? ' graph-mark-animated' : ''}`}
      aria-hidden="true"
    >
      {EDGES.map(([a, b], i) => {
        const isHi = highlight && (i === 4 || i === 9)
        const [x1, y1] = seed[a]
        const [x2, y2] = seed[b]
        const { duration, delay, reverse } = edgeTiming(i)
        return (
          <g key={i}>
            {/* static base line — never animated */}
            <line x1={x1} y1={y1} x2={x2} y2={y2} className={isHi ? 'edge edge-hi' : 'edge'} />
            {/* traveling pulse overlay */}
            {animated && (
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                pathLength="1"
                className={`edge-pulse${reverse ? ' edge-pulse-reverse' : ''}`}
                style={{
                  animationDuration: `${duration}s`,
                  animationDelay: `${delay}s`,
                }}
              />
            )}
          </g>
        )
      })}
      {seed.map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={i % 3 === 0 ? 6 : 4.5}
          className={`node${animated ? ' node-animated' : ''}`}
          style={animated ? { animationDelay: `${((i * 0.8) % 4).toFixed(2)}s` } : undefined}
        />
      ))}
    </svg>
  )
}

export default GraphMark