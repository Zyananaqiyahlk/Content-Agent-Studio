import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const NAV = [
  { to: '/dashboard', icon: '🏠', label: 'Dashboard'  },
  { to: '/insights',  icon: '📸', label: 'IG Insights', badge: 'LIVE' },
  { to: '/schedule',  icon: '📅', label: 'Schedule'   },
  { to: '/scripts',   icon: '🎬', label: 'Scripts'    },
  { to: '/studio',    icon: '🎥', label: 'Studio'     },
  { to: '/chat',      icon: '🤖', label: 'AI Chat'    },
  { to: '/outreach',  icon: '📧', label: 'Outreach'   },
  { to: '/credits',   icon: '💳', label: 'Credits'    },
  { to: '/settings',  icon: '⚙️',  label: 'Settings'  },
]

export default function Sidebar() {
  const { user, credits, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <nav className="sidebar">
      <div className="sidebar-brand">
        <div className="logo">{initials}</div>
        <div className="brand-text">
          <div className="brand-name">{user?.brandName || user?.name || 'Studio'}</div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'capitalize' }}>
            {user?.niche || 'content creation'}
          </div>
        </div>
      </div>

      {NAV.map(({ to, icon, label, badge }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
        >
          <span className="nav-icon">{icon}</span>
          {label}
          {badge && (
            <span style={{
              marginLeft: 'auto',
              fontSize: 9,
              fontWeight: 800,
              background: '#E1306C',
              color: '#fff',
              padding: '1px 5px',
              borderRadius: 4,
              letterSpacing: '0.05em',
            }}>
              {badge}
            </span>
          )}
        </NavLink>
      ))}

      <div className="sidebar-footer">
        <div className="credits-chip">⚡ {credits ?? 0} credits</div>
        <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
          Sign out
        </button>
      </div>
    </nav>
  )
}
