import { useState, useRef, useCallback } from 'react'
import axios from 'axios'

const STEPS = [
  { id: 1, label: 'Uploading image to server'     },
  { id: 2, label: 'Running wall detection (OpenCV)'},
  { id: 3, label: 'Building 3D geometry'           },
  { id: 4, label: 'Generating AI explanation'      },
]

const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const SpinDot = () => (
  <div className="anim-spin" style={{
    width: 13, height: 13, borderRadius: '50%',
    border: '2px solid rgba(59,130,246,0.25)',
    borderTopColor: '#60a5fa',
  }} />
)

const StepRow = ({ step, status, delay }) => {
  const isPending = status === 'pending'
  const isActive  = status === 'active'
  const isDone    = status === 'done'
  return (
    <div className="step-row" style={{ animationDelay: `${delay}s`, opacity: isPending ? 0.35 : 1 }}>
      <div className={`step-dot ${isActive ? 'active' : isDone ? 'done' : ''}`}>
        {isDone ? <CheckIcon /> : isActive ? <SpinDot /> : step.id}
      </div>
      <span style={{
        fontSize: 13, fontWeight: isActive ? 600 : 400,
        color: isDone ? '#6ee7b7' : isActive ? '#e2e8f0' : '#475569',
        transition: 'color 0.3s',
      }}>
        {step.label}
      </span>
      {isDone && (
        <span style={{ marginLeft: 'auto', fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: '#34d399' }}>
          ✓
        </span>
      )}
    </div>
  )
}

const UploadSection = ({ onWallsDetected, onPlanSelected, onPreviewChange }) => {
  const [selectedPlan, setSelectedPlan]   = useState('')
  const [uploadedImage, setUploadedImage] = useState(null)
  const [preview, setPreview]             = useState(null)
  const [loading, setLoading]             = useState(false)
  const [currentStep, setCurrentStep]     = useState(0)
  const [isDragOver, setIsDragOver]       = useState(false)
  const fileRef = useRef(null)

  const STEP_TIMES = [500, 1600, 1200, 900]

  const handlePlanChange = (e) => {
    setSelectedPlan(e.target.value)
    onPlanSelected(e.target.value)
  }

  const processFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return
    setUploadedImage(file)
    const reader = new FileReader()
    reader.onload = (ev) => {
      setPreview(ev.target.result)
      if (onPreviewChange) onPreviewChange(ev.target.result)
    }
    reader.readAsDataURL(file)
  }, [onPreviewChange])

  const handleImageUpload = (e) => processFile(e.target.files[0])
  const handleDrop = (e) => {
    e.preventDefault(); setIsDragOver(false)
    processFile(e.dataTransfer.files[0])
  }

  const handleGenerate = async () => {
    if (!selectedPlan)   return alert('Please select a plan type')
    if (!uploadedImage)  return alert('Please upload a floor plan image')
    setLoading(true); setCurrentStep(0)

    // Animate steps with timing
    let s = 0
    const advance = () => {
      if (s < STEPS.length - 1) {
        s++; setCurrentStep(s)
        setTimeout(advance, STEP_TIMES[s - 1])
      }
    }
    setTimeout(advance, STEP_TIMES[0])

    const formData = new FormData()
    formData.append('image', uploadedImage)
    try {
      const response = await axios.post('http://localhost:5000/parse', formData)
      setCurrentStep(STEPS.length)
      setTimeout(() => { onWallsDetected(response.data); setLoading(false) }, 500)
    } catch {
      alert('Error parsing floor plan')
      setLoading(false); setCurrentStep(0)
    }
  }

  return (
    <section id="upload" style={{ fontFamily: "'Inter', sans-serif", marginBottom: 24 }}>
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '22px 32px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="sec-num">1</div>
            <div>
              <div className="sec-label">Step One</div>
              <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 20, color: 'var(--text)', margin: 0 }}>
                Upload Floor Plan
              </h2>
            </div>
          </div>
          {preview && <span className="badge badge-green">✓ Image ready</span>}
        </div>

        <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 28 }}>

          {/* Plan selector */}
          <div>
            <label className="sec-label" style={{ display: 'block', marginBottom: 10 }}>Plan Type</label>
            <select
              onChange={handlePlanChange}
              value={selectedPlan}
              style={{
                width: '100%', padding: '13px 18px',
                background: 'rgba(15,23,42,0.7)',
                border: '1px solid var(--glass-border)',
                borderRadius: 10, color: 'var(--text)',
                fontSize: 14, fontFamily: 'Inter, sans-serif',
                cursor: 'pointer', outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onFocus={e => { e.target.style.borderColor = 'var(--blue)'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.15)'; }}
              onBlur={e  => { e.target.style.borderColor = 'var(--glass-border)'; e.target.style.boxShadow = 'none'; }}
            >
              <option value="" style={{ background: '#0f172a' }}>— Choose a floor plan type —</option>
              <option value="planA" style={{ background: '#0f172a' }}>Plan A — 2 Bed / 1 Bath</option>
              <option value="planB" style={{ background: '#0f172a' }}>Plan B — 4 Bed / 3 Bath</option>
              <option value="planC" style={{ background: '#0f172a' }}>Plan C — 3 Bed / 2 Bath (L-shaped)</option>
            </select>
          </div>

          {/* Drag-drop zone */}
          <div>
            <label className="sec-label" style={{ display: 'block', marginBottom: 10 }}>Floor Plan Image</label>
            <div
              className={`drop-zone ${isDragOver ? 'active' : ''}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              style={{ padding: preview ? '20px' : '52px 24px' }}
            >
              {preview ? (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <img src={preview} alt="Floor plan preview"
                      style={{ width: 180, height: 140, objectFit: 'contain', borderRadius: 10, border: '1px solid var(--glass-border)', background: 'rgba(15,23,42,0.6)' }} />
                    <div style={{ position: 'absolute', top: 6, right: 6 }}>
                      <span className="badge badge-green" style={{ fontSize: 9 }}>LOADED</span>
                    </div>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{uploadedImage?.name}</div>
                    <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-3)' }}>
                      {uploadedImage ? (uploadedImage.size / 1024).toFixed(1) + ' KB' : ''}
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); fileRef.current?.click() }}
                      className="btn btn-secondary"
                      style={{ width: 'fit-content', padding: '7px 14px', fontSize: 12, marginTop: 4 }}
                    >
                      Change image
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', pointerEvents: 'none' }}>
                  <div className="anim-float" style={{ display: 'inline-block', marginBottom: 14 }}>
                    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="url(#upGrad)" strokeWidth="1.5">
                      <defs>
                        <linearGradient id="upGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#3b82f6"/>
                          <stop offset="100%" stopColor="#8b5cf6"/>
                        </linearGradient>
                      </defs>
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
                    Drop your floor plan here
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                    or click to browse · PNG, JPG, WEBP
                  </div>
                  <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                    {['Architectural', 'Blueprint', 'Sketch'].map(t => (
                      <span key={t} className="badge badge-blue" style={{ fontSize: 9 }}>{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
          </div>

          {/* Generate / Loading */}
          <div>
            <label className="sec-label" style={{ display: 'block', marginBottom: 10 }}>Generate</label>
            {loading ? (
              <div className="glass-inset anim-fadeIn" style={{ padding: '22px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, paddingBottom: 16, borderBottom: '1px solid var(--glass-border)' }}>
                  <div className="anim-spin" style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid rgba(59,130,246,0.2)', borderTopColor: '#60a5fa', flexShrink: 0 }} />
                  <div style={{ fontWeight: 700, fontSize: 15 }}>
                    <span className="grad-text">Analyzing floor plan</span>
                    <span style={{ color: 'var(--blue-light)', fontSize: 18, letterSpacing: 3 }} className="anim-flicker">...</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {STEPS.map((step, i) => (
                    <StepRow
                      key={step.id} step={step}
                      status={i < currentStep ? 'done' : i === currentStep ? 'active' : 'pending'}
                      delay={i * 0.07}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <button onClick={handleGenerate} className="btn btn-primary" style={{ width: '100%', padding: '16px 32px', fontSize: 15, borderRadius: 12 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                Generate 3D Model
              </button>
            )}
          </div>

        </div>
      </div>
    </section>
  )
}

export default UploadSection
