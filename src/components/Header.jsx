import { Link } from 'react-scroll'

const Header = () => {
  return (
    <nav
      className="fixed top-0 left-0 w-full z-50"
      style={{
        backgroundColor: 'rgba(10, 14, 26, 0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <style>{`
        .nav-link {
          position: relative; cursor: pointer;
          padding: 6px 16px;
          font-size: 12px;
          font-family: 'Outfit', sans-serif;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text-muted);
          border-radius: 8px;
          transition: color 0.2s, background 0.2s;
        }
        .nav-link::after {
          content: '';
          position: absolute; bottom: -1px; left: 50%;
          transform: translateX(-50%);
          width: 0; height: 2px;
          background: linear-gradient(90deg, var(--teal-light), var(--cyan));
          border-radius: 2px;
          transition: width 0.25s ease;
        }
        .nav-link:hover { color: var(--text); background: rgba(17,100,102,0.1); }
        .nav-link:hover::after, .nav-link.active::after { width: 60%; }
        .nav-link.active { color: var(--gold); }
        .nav-logo-dot { animation: float 3s ease-in-out infinite; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
      `}</style>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}
        className="flex items-center justify-between h-16">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="nav-logo-dot w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black"
            style={{
              background: 'linear-gradient(135deg, var(--teal), #0a5254)',
              border: '1px solid rgba(26,143,146,0.5)',
              boxShadow: '0 0 16px rgba(17,100,102,0.4)',
              fontFamily: 'Outfit, sans-serif',
              color: 'var(--gold)',
            }}>
            ◈
          </div>
          <div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 16, color: 'var(--gold)', lineHeight: 1 }}>
              ArchAI
            </div>
            <div style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--teal-light)', lineHeight: 1.4 }}>
              Prompt Alchemists
            </div>
          </div>
        </div>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {[
            { to: 'upload',      label: 'Upload'    },
            { to: 'threedmodel', label: '3D Model'  },
            { to: 'materials',   label: 'Materials' },
            { to: 'explanation', label: 'Analysis'  },
          ].map(({ to, label }) => (
            <Link
              key={to} to={to} smooth spy
              activeClass="active"
              className="nav-link"
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Status pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{ background: 'rgba(17,100,102,0.12)', border: '1px solid rgba(17,100,102,0.3)', fontSize: 11, fontFamily: 'DM Mono, monospace' }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#4ade80' }} />
          <span style={{ color: 'var(--text-muted)' }}>AI Ready</span>
        </div>
      </div>
    </nav>
  )
}

export default Header
