import { NavLink, Outlet, Link } from 'react-router-dom'
import ConnectButton from '../wallet/ConnectButton'
import logoWhite from '../../assets/brand/rhizome-logo-white.png'
import '../../app-shell.css'
import '../../app-design.css'

const NAV = [
  { to: '/app', label: 'Overview', end: true },
  { to: '/app/network', label: 'My Network' },
  { to: '/app/rhizomes', label: 'Rhizomes' },
  { to: '/app/explore', label: 'Explore' },
  { to: '/app/create', label: 'Create Rhizome', cta: true },
]

function AppShell() {
  return (
    <div className="app-shell tn-shell">
      <header className="tn">
        <Link to="/" className="tn-brand" aria-label="Rhizome home">
          <img src={logoWhite} alt="Rhizome" className="brand-logo" />
        </Link>
        <nav className="tn-links" aria-label="Main">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `tn-link ${item.cta ? 'is-cta' : ''} ${isActive ? 'is-active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="tn-wallet">
          <ConnectButton />
        </div>
      </header>
      <main className="tn-content">
        <Outlet />
      </main>
    </div>
  )
}

export default AppShell
