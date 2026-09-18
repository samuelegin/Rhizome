import { NavLink, Outlet, Link } from 'react-router-dom'
import ConnectButton from '../wallet/ConnectButton'
import '../../app-shell.css'

const PRIMARY_NAV = [
  { to: '/app', label: 'Overview', icon: 'bi-grid-1x2', end: true },
  { to: '/app/network', label: 'My Network', icon: 'bi-diagram-3' },
  { to: '/app/rhizomes', label: 'Rhizomes', icon: 'bi-hexagon' },
  { to: '/app/explore', label: 'Explore', icon: 'bi-compass' },
  { to: '/app/create', label: 'Create Rhizome', icon: 'bi-plus-circle' },
]

function AppShell() {
  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <Link to="/" className="brand app-brand">
          <i className="bi bi-diagram-3-fill" />
          <span>Rhizome</span>
        </Link>
        <nav className="app-nav">
          {PRIMARY_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `app-nav-link ${isActive ? 'is-active' : ''}`}
            >
              <i className={`bi ${item.icon}`} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <Link to="/app/demo" className="app-demo-link">
          <i className="bi bi-lightning-charge" />
          <span>Demo Environment</span>
        </Link>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <div className="app-topbar-spacer" />
          <ConnectButton />
        </header>
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppShell