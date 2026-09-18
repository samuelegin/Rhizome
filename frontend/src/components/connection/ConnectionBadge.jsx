function ConnectionBadge({ status }) {
  const isActive = status === 'active'
  return (
    <span className={`connection-badge ${isActive ? 'is-active' : 'is-stale'}`}>
      <span className="connection-badge-dot" aria-hidden="true" />
      {isActive ? 'Active' : 'Stale'}
    </span>
  )
}

export default ConnectionBadge