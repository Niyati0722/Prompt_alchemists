import { useState, useEffect } from 'react'
import { Link } from 'react-scroll'

const Header = () => {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 100,
      fontFamily: "'Inter', sans-serif",
      background: scrolled ? 'rgba(9,14,26,0.92)' : 'transparent',
      backdropFilter: scrolled ? 'blur(24px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(99,179,237,0.1)' : '1px solid transparent',
      transition: 'all 0.4s ease',
    }}>
      <style>{`
        .nav-link {
          position: relative; cursor: pointer;
          padding: 7px 16px; border-radius: 8px;
          font-size: 12px; font-weight: 600;
          letter-spacing: 0.08em; text-transform: uppercase;
          color: rgba(148,163,184,0.85);
          transition: color 0.2s, background 0.2s;
        }
        .nav-link::after {
          content: ''; position: absolute;
          bottom: 2px; left: 50%; transform: translateX(-50%);
          width: 0; height: 2px; border-radius: 2px;
          background: linear-gradient(90deg, #3b82f6, #8b5cf6);
          transition: width 0.25s ease;
        }
        .nav-link:hover { color: #e2e8f0; background: rgba(59,130,246,0.08); }
        .nav-link:hover::after, .nav-link.active::after { width: 55%; }
        .nav-link.active { color: #93c5fd; }
        .logo-glow {
          filter: drop-shadow(0 0 8px rgba(99,102,241,0.6));
          transition: filter 0.3s;
        }
        .logo-glow:hover { filter: drop-shadow(0 0 14px rgba(99,102,241,0.9)); }
      `}</style>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>

        {/* Logo */}
        <div className="logo-glow" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, color: 'white', fontWeight: 900, fontFamily: 'Poppins, sans-serif',
            boxShadow: '0 0 20px rgba(99,102,241,0.45)',
          }}>⬡</div>
          <div>
            <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 900, fontSize: 17, background: 'linear-gradient(135deg, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1 }}>
              ArchAI
            </div>
            <div style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(148,163,184,0.6)', fontFamily: 'JetBrains Mono, monospace' }}>
              Floor Intelligence
            </div>
          </div>
        </div>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {[
            { to: 'upload',      label: 'Upload'    },
            { to: 'threedmodel', label: '3D Model'  },
            { to: 'materials',   label: 'Materials' },
            { to: 'explanation', label: 'Analysis'  },
          ].map(({ to, label }) => (
            <Link key={to} to={to} smooth spy activeClass="active" className="nav-link">
              {label}
            </Link>
          ))}
        </div>

        {/* Status */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '6px 14px', borderRadius: 100,
          background: 'rgba(52,211,153,0.08)',
          border: '1px solid rgba(52,211,153,0.2)',
          fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
          color: 'rgba(110,231,183,0.85)',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', flexShrink: 0,
            boxShadow: '0 0 6px #34d399', animation: 'pulse-glow 2s ease-in-out infinite' }} />
          AI Online
        </div>
      </div>
    </nav>
  )
}

export default Header
