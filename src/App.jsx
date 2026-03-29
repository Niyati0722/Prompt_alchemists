import { useState, useEffect, useRef } from 'react'
import Header from './components/Header'
import UploadSection from './components/UploadSection'
import ThreeDViewer from './components/ThreeDViewer'
import MaterialTable from './components/MaterialTable'
import Explanation from './components/Explanation'

/* ---------- Scroll reveal hook ---------- */
const useReveal = () => {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { el.classList.add('in'); obs.disconnect() }
    }, { threshold: 0.08 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return ref
}

/* ---------- Hero section ---------- */
const Hero = ({ hasResults }) => {
  if (hasResults) return null
  return (
    <div className="reveal animate-fadeUp" style={{ animationDelay: '0.1s' }}>
      <div className="relative overflow-hidden rounded-2xl glass mb-2"
        style={{ background: 'linear-gradient(135deg, #0d1525 0%, #111e32 50%, #0a1520 100%)' }}>
        {/* Background grid */}
        <div className="absolute inset-0 dot-grid opacity-60 pointer-events-none" />
        {/* Radial glow */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 80%, rgba(17,100,102,0.15) 0%, transparent 70%)' }} />

        <div className="relative z-10 px-8 py-14 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
            style={{ background: 'rgba(17,100,102,0.18)', border: '1px solid rgba(17,100,102,0.4)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" style={{ backgroundColor: 'var(--cyan)' }} />
            <span className="section-label" style={{ fontSize: 9 }}>AI-Powered Architecture</span>
          </div>

          <h1 className="gradient-text text-5xl font-black tracking-tight mb-4 leading-tight"
            style={{ fontFamily: 'Outfit, sans-serif' }}>
            Floor Plan → 3D Model<br />in Seconds
          </h1>
          <p className="text-base max-w-lg mx-auto leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Upload any floor plan image. Our AI detects walls, generates an immersive 3D model,
            recommends materials, and explains every structural decision.
          </p>

          <div className="flex items-center justify-center gap-8 mt-10 pt-8"
            style={{ borderTop: '1px solid var(--border)' }}>
            {[
              { icon: '⬡', label: 'Wall Detection', sub: 'OpenCV + Python' },
              { icon: '◈', label: '3D Generation', sub: 'Three.js Engine' },
              { icon: '◉', label: 'AI Analysis',   sub: 'LLaMA 3.3 70B' },
            ].map(({ icon, label, sub }) => (
              <div key={label} className="text-center">
                <div className="text-2xl mb-1" style={{ color: 'var(--teal-light)' }}>{icon}</div>
                <div className="text-xs font-semibold" style={{ color: 'var(--text)', fontFamily: 'Outfit, sans-serif' }}>{label}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace', fontSize: 10 }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- Reset button ---------- */
const ResetBar = ({ onReset }) => (
  <div className="flex justify-end mb-2">
    <button onClick={onReset} className="btn-ghost px-5 py-2 rounded-xl text-sm flex items-center gap-2">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
      </svg>
      Upload New Image
    </button>
  </div>
)

/* ---------- Before / After ---------- */
const BeforeAfter = ({ preview, walls }) => {
  const ref = useReveal()
  if (!preview || !walls || walls.length === 0) return null
  return (
    <div ref={ref} className="reveal glass rounded-2xl overflow-hidden mb-2">
      <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <span className="section-label">Results</span>
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          <span className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
            {walls.length} walls detected
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-0">
        {/* Before */}
        <div className="p-6" style={{ borderRight: '1px solid var(--border)' }}>
          <div className="section-label mb-3">Original Upload</div>
          <img src={preview} alt="Uploaded floor plan"
            className="w-full rounded-xl object-contain"
            style={{ maxHeight: 280, background: 'var(--surface-2)', border: '1px solid var(--border)' }} />
        </div>
        {/* After */}
        <div className="p-6">
          <div className="section-label mb-3">3D Model Generated</div>
          <div className="w-full rounded-xl flex items-center justify-center"
            style={{ height: 280, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <div className="text-center">
              <div className="text-3xl mb-2">◈</div>
              <div className="text-xs font-semibold" style={{ color: 'var(--teal-light)', fontFamily: 'Outfit, sans-serif' }}>
                Scroll down to explore
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Full 3D model below ↓
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- App ---------- */
const App = () => {
  const [walls, setWalls]           = useState(null)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [preview, setPreview]       = useState(null)

  const handleWalls = (data) => setWalls(data)
  const handlePlan  = (plan) => setSelectedPlan(plan)
  const handlePreview = (src)  => setPreview(src)
  const handleReset = () => {
    setWalls(null); setSelectedPlan(null); setPreview(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const hasResults = !!(walls && walls.length > 0)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', fontFamily: "'DM Sans', sans-serif" }}>
      <Header />

      <main className="pt-24 pb-16" style={{ maxWidth: 1200, margin: '0 auto', padding: '96px 24px 64px' }}>
        <Hero hasResults={hasResults} />

        <div className={hasResults ? 'animate-fadeIn' : ''}>
          <UploadSection
            onWallsDetected={handleWalls}
            onPlanSelected={handlePlan}
            onPreviewChange={handlePreview}
          />
        </div>

        {hasResults && (
          <>
            <BeforeAfter preview={preview} walls={walls} />
            <ResetBar onReset={handleReset} />
          </>
        )}

        <ThreeDViewer walls={walls} />
        <MaterialTable walls={walls} plan={selectedPlan} />
        <Explanation walls={walls} plan={selectedPlan} />

        {hasResults && (
          <div className="mt-8 text-center">
            <button onClick={handleReset} className="btn-glow px-8 py-3 rounded-xl text-sm flex items-center gap-2 mx-auto">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
              </svg>
              Upload New Image
            </button>
          </div>
        )}
      </main>

      <footer style={{ borderTop: '1px solid var(--border)', backgroundColor: 'var(--bg-2)', padding: '24px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}
          className="flex items-center justify-between">
          <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: 'var(--gold)', fontSize: 14 }}>
            ArchAI
          </span>
          <span style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
            Prompt Alchemists · 2025
          </span>
          <div className="flex items-center gap-1" style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'DM Mono, monospace' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--teal-light)' }} />
            <span>All systems operational</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
