import { useState, useEffect, useRef } from 'react'
import Header from './components/Header'
import UploadSection from './components/UploadSection'
import ThreeDViewer from './components/ThreeDViewer'
import MaterialTable from './components/MaterialTable'
import Explanation from './components/Explanation'
import WallOverlay from './components/WallOverlay'
import heroBg from './assets/hero.png'

/* ══════════════════════════════════════
   Scroll Reveal Hook
══════════════════════════════════════ */
const useReveal = () => {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add('in'); obs.disconnect() } }, { threshold: 0.06 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return ref
}

/* ══════════════════════════════════════
   Hero Section
══════════════════════════════════════ */
const Hero = ({ onStart }) => {
  return (
    <div style={{
      position: 'relative', width: '100%',
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      {/* Background image */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        backgroundImage: `url(${heroBg})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        filter: 'blur(3px) brightness(0.35)',
        animation: 'hero-zoom 20s ease-in-out infinite alternate',
        transform: 'scale(1.05)',
      }} />

      {/* Gradient overlays */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        background: 'linear-gradient(180deg, rgba(9,14,26,0.3) 0%, rgba(15,23,42,0.7) 60%, rgba(15,23,42,1) 100%)',
      }} />
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(59,130,246,0.08) 0%, transparent 70%)',
        animation: 'drift 18s ease-in-out infinite',
      }} />

      {/* Dot grid */}
      <div className="dot-grid" style={{ position: 'absolute', inset: 0, zIndex: 2, opacity: 0.3 }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', maxWidth: 740, padding: '0 28px' }}>

        {/* Badge */}
        <div className="anim-fadeUp op0" style={{ animationDelay: '0.1s', marginBottom: 28 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '7px 18px', borderRadius: 100,
            background: 'rgba(59,130,246,0.1)',
            border: '1px solid rgba(59,130,246,0.3)',
            backdropFilter: 'blur(12px)',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#60a5fa', boxShadow: '0 0 8px #3b82f6' }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#93c5fd', fontFamily: 'JetBrains Mono, monospace' }}>
              AI-Powered Architecture Platform
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="anim-fadeUp op0" style={{ animationDelay: '0.22s' }}>
          <h1 style={{
            fontFamily: 'Poppins, sans-serif', fontWeight: 900,
            fontSize: 'clamp(36px, 6vw, 68px)',
            lineHeight: 1.08, marginBottom: 20,
            background: 'linear-gradient(135deg, #ffffff 0%, #93c5fd 40%, #c4b5fd 80%, #67e8f9 100%)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            animation: 'gradient-shift 5s ease-in-out infinite',
          }}>
            Transform Floor Plans<br />into 3D Intelligence
          </h1>
        </div>

        {/* Subtitle */}
        <div className="anim-fadeUp op0" style={{ animationDelay: '0.36s', marginBottom: 40 }}>
          <p style={{
            fontSize: 'clamp(15px, 2vw, 18px)', color: 'rgba(148,163,184,0.85)',
            lineHeight: 1.75, maxWidth: 560, margin: '0 auto',
          }}>
            Upload any floor plan image. Our AI detects structural walls with OpenCV,
            builds an immersive 3D model in Three.js, scores material choices,
            and delivers a plain-English structural analysis — instantly.
          </p>
        </div>

        {/* CTA button + glass card */}
        <div className="anim-fadeUp op0" style={{ animationDelay: '0.5s', marginBottom: 56 }}>
          <div style={{
            display: 'inline-block',
            padding: 3, borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(59,130,246,0.4), rgba(139,92,246,0.4))',
          }}>
            <button
              onClick={onStart}
              className="btn btn-primary"
              style={{ padding: '16px 48px', fontSize: 16, borderRadius: 12 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              Get Started
            </button>
          </div>
        </div>

        {/* Feature pills */}
        <div className="anim-fadeUp op0" style={{ animationDelay: '0.65s', display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
          {[
            { icon: '⬡', label: 'Wall Detection', sub: 'OpenCV' },
            { icon: '◈', label: '3D Engine',      sub: 'Three.js' },
            { icon: '◉', label: 'AI Analysis',    sub: 'LLaMA 3.3' },
            { icon: '⬤', label: 'Materials',      sub: 'Scored' },
          ].map(({ icon, label, sub }) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '10px 18px', borderRadius: 10,
              background: 'rgba(15,23,42,0.6)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(99,179,237,0.12)',
            }}>
              <span style={{ fontSize: 18, background: 'linear-gradient(135deg, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{icon}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', lineHeight: 1 }}>{label}</div>
                <div style={{ fontSize: 9, color: 'rgba(100,116,139,0.8)', fontFamily: 'JetBrains Mono, monospace', marginTop: 2 }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Scroll hint */}
        <div style={{ marginTop: 56, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, opacity: 0.4 }}>
          <span style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace' }}>Scroll</span>
          <div style={{ width: 1, height: 36, background: 'linear-gradient(180deg, rgba(148,163,184,0.5), transparent)' }} />
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════
   Wall Visualization Panel
══════════════════════════════════════ */
const WallVizPanel = ({ walls, imageSrc }) => {
  const ref = useReveal()
  if (!walls || !imageSrc) return null
  return (
    <div ref={ref} className="reveal glass-card" style={{ overflow: 'hidden', marginBottom: 24 }}>
      <div style={{ padding: '18px 28px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', boxShadow: '0 0 8px rgba(99,102,241,0.6)' }} />
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', background: 'linear-gradient(90deg, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Detection Overlay
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span className="badge badge-blue" style={{ gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#60a5fa' }} />
            Outer walls
          </span>
          <span className="badge badge-purple" style={{ gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#a78bfa' }} />
            Inner walls
          </span>
        </div>
      </div>
      <div style={{ padding: '20px 28px' }}>
        <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 14, fontFamily: 'JetBrains Mono, monospace' }}>
          Wall detection results overlaid on your upload · {walls.length} walls · length labels in px
        </p>
        <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--glass-border)', maxWidth: 600, background: 'var(--bg-3)' }}>
          <WallOverlay walls={walls} imageSrc={imageSrc} width={600} height={440} />
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════
   Results header banner
══════════════════════════════════════ */
const ResultsBanner = ({ walls }) => {
  const ref = useReveal()
  if (!walls || walls.length === 0) return null
  return (
    <div ref={ref} className="reveal" style={{
      padding: '18px 28px', marginBottom: 24, borderRadius: 14,
      background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))',
      border: '1px solid rgba(99,102,241,0.2)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 10px #34d399' }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
          Analysis Complete
        </span>
        <span className="badge badge-blue">{walls.length} walls detected</span>
      </div>
      <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace' }}>
        Scroll down to explore all results ↓
      </span>
    </div>
  )
}

/* ══════════════════════════════════════
   Footer
══════════════════════════════════════ */
const Footer = () => (
  <footer style={{ position: 'relative', overflow: 'hidden', marginTop: 40 }}>
    {/* Background */}
    <div style={{
      position: 'absolute', inset: 0,
      backgroundImage: `url(${heroBg})`,
      backgroundSize: 'cover', backgroundPosition: 'center 70%',
      filter: 'blur(4px) brightness(0.2)',
    }} />
    <div style={{
      position: 'absolute', inset: 0,
      background: 'linear-gradient(0deg, rgba(9,14,26,0.98) 0%, rgba(15,23,42,0.85) 100%)',
    }} />
    <div style={{ position: 'absolute', inset: 0 }} className="dot-grid" />

    <div style={{ position: 'relative', zIndex: 10 }}>
      {/* Divider glow */}
      <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.4), rgba(139,92,246,0.4), transparent)' }} />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 28px 36px' }}>
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 28, marginBottom: 36 }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, boxShadow: '0 0 20px rgba(99,102,241,0.4)',
              }}>⬡</div>
              <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 900, fontSize: 22, background: 'linear-gradient(135deg, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                ArchAI
              </span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.7, maxWidth: 260 }}>
              Powered by AI Floor Intelligence.<br />
              Built by Prompt Alchemists.
            </p>
          </div>

          {/* Tech stack */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 14, fontFamily: 'JetBrains Mono, monospace' }}>
              Stack
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                ['React + Vite', 'Frontend'],
                ['Three.js', '3D Rendering'],
                ['OpenCV + Python', 'Wall Detection'],
                ['LLaMA 3.3 70B', 'AI Analysis'],
                ['Node.js + Express', 'Backend'],
              ].map(([tech, role]) => (
                <div key={tech} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(99,102,241,0.5)', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--text-2)', fontFamily: 'JetBrains Mono, monospace' }}>{tech}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-3)' }}>· {role}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tagline card */}
          <div style={{
            padding: '20px 24px', borderRadius: 14,
            background: 'rgba(59,130,246,0.06)', backdropFilter: 'blur(12px)',
            border: '1px solid rgba(59,130,246,0.15)',
            maxWidth: 220, textAlign: 'center',
          }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>⬡</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
              Powered by AI Floor Intelligence
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.6 }}>
              From 2D blueprint to full structural analysis in seconds.
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: '1px solid rgba(30,58,95,0.4)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace' }}>
            © 2025 Prompt Alchemists. Hackathon Project.
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px #34d399' }} />
            <span style={{ fontSize: 11, color: 'rgba(110,231,183,0.7)', fontFamily: 'JetBrains Mono, monospace' }}>All systems operational</span>
          </div>
        </div>
      </div>
    </div>
  </footer>
)

/* ══════════════════════════════════════
   APP
══════════════════════════════════════ */
const App = () => {
  const [walls, setWalls]             = useState(null)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [preview, setPreview]         = useState(null)
  const uploadRef = useRef(null)

  const handleStart = () => {
    uploadRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const handleReset = () => {
    setWalls(null); setSelectedPlan(null); setPreview(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const hasResults = !!(walls && walls.length > 0)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: "'Inter', sans-serif" }}>
      {/* Global keyframes injected once */}
      <style>{`
        @keyframes hero-zoom { from{transform:scale(1)} to{transform:scale(1.06)} }
        @keyframes drift { 0%,100%{transform:translate(0,0)} 50%{transform:translate(20px,-15px)} }
        @keyframes gradient-shift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes pulse-glow { 0%,100%{box-shadow:0 0 0 0 rgba(52,211,153,0.4)} 50%{box-shadow:0 0 0 6px rgba(52,211,153,0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes step-in { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
        @keyframes data-flicker { 0%,100%{opacity:1} 92%{opacity:1} 93%{opacity:0.5} 94%{opacity:1} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <Header />

      {/* Hero */}
      <Hero onStart={handleStart} />

      {/* Main content */}
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 28px 0' }}>

        {/* Upload section anchor */}
        <div ref={uploadRef}>
          <UploadSection
            onWallsDetected={setWalls}
            onPlanSelected={setSelectedPlan}
            onPreviewChange={setPreview}
          />
        </div>

        {hasResults && (
          <>
            <ResultsBanner walls={walls} />
            <WallVizPanel walls={walls} imageSrc={preview} />
          </>
        )}

        <ThreeDViewer walls={walls} />
        <MaterialTable walls={walls} plan={selectedPlan} />
        <Explanation walls={walls} plan={selectedPlan} />

        {hasResults && (
          <div style={{ textAlign: 'center', padding: '20px 0 48px' }}>
            <button onClick={handleReset} className="btn btn-secondary" style={{ padding: '12px 28px', borderRadius: 10, fontSize: 13, gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
              </svg>
              Start New Analysis
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}

export default App
