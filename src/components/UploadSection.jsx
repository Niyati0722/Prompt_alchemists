import { useState, useRef, useCallback } from 'react'
import axios from 'axios'

/* ---- Loading steps config ---- */
const STEPS = [
  { id: 1, label: 'Uploading image',         time: 600  },
  { id: 2, label: 'Detecting walls & edges', time: 1800 },
  { id: 3, label: 'Generating 3D model',     time: 1400 },
  { id: 4, label: 'Analyzing with AI',       time: 800  },
]

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const StepRow = ({ step, status, delay }) => {
  const styles = {
    pending: { dot: {}, label: { color: 'var(--text-dim)' } },
    active:  { dot: 'active', label: { color: 'var(--text)' } },
    done:    { dot: 'done',   label: { color: 'var(--teal-light)' } },
  }
  const s = styles[status] || styles.pending
  return (
    <div className="step-row" style={{ animationDelay: `${delay}s`, opacity: status === 'pending' ? 0.4 : 1 }}>
      <div className={`step-dot ${s.dot}`}>
        {status === 'done' ? <CheckIcon /> : status === 'active' ? (
          <div className="animate-spin" style={{
            width: 12, height: 12, borderRadius: '50%',
            border: '2px solid rgba(17,100,102,0.3)',
            borderTopColor: 'var(--cyan)'
          }} />
        ) : step.id}
      </div>
      <span style={{ fontSize: 13, fontFamily: 'DM Sans, sans-serif', fontWeight: status === 'active' ? 600 : 400, ...s.label }}>
        {step.label}
      </span>
      {status === 'done' && (
        <span style={{ marginLeft: 'auto', fontSize: 10, fontFamily: 'DM Mono, monospace', color: 'var(--teal-light)' }}>
          done
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
  const fileInputRef = useRef(null)

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
    if (!selectedPlan) return alert('Please select a plan type')
    if (!uploadedImage) return alert('Please upload a floor plan image')
    setLoading(true); setCurrentStep(0)

    // Animate steps
    let step = 0
    const advance = () => {
      if (step < STEPS.length - 1) {
        step++; setCurrentStep(step)
        setTimeout(advance, STEPS[step - 1].time)
      }
    }
    setTimeout(advance, STEPS[0].time)

    const formData = new FormData()
    formData.append('image', uploadedImage)
    try {
      const response = await axios.post('http://localhost:5000/parse', formData)
      setCurrentStep(STEPS.length) // all done
      setTimeout(() => { onWallsDetected(response.data); setLoading(false) }, 400)
    } catch {
      alert('Error parsing floor plan')
      setLoading(false); setCurrentStep(0)
    }
  }

  return (
    <section
      id="upload"
      className="glass rounded-2xl overflow-hidden mb-6 animate-fadeUp"
      style={{ animationDelay: '0.25s', opacity: 0 }}
    >
      {/* Section header */}
      <div className="px-8 py-5 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(17,100,102,0.2)', border: '1px solid rgba(17,100,102,0.4)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--teal-light)" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <div>
            <div className="section-label">Step 1</div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 20, color: 'var(--gold)', margin: 0 }}>
              Upload Floor Plan
            </h2>
          </div>
        </div>
        {preview && (
          <span className="tag tag-teal">Image ready</span>
        )}
      </div>

      <div className="px-8 py-8 flex flex-col gap-8">

        {/* Plan selector */}
        <div>
          <label className="section-label block mb-3">Select Plan Type</label>
          <select
            onChange={handlePlanChange}
            value={selectedPlan}
            style={{
              width: '100%', padding: '12px 16px',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 12, color: 'var(--text)',
              fontSize: 14, fontFamily: 'DM Sans, sans-serif',
              cursor: 'pointer', outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--teal-light)'}
            onBlur={e  => e.target.style.borderColor = 'var(--border)'}
          >
            <option value="" style={{ background: '#131c2e' }}>— Choose a floor plan —</option>
            <option value="planA" style={{ background: '#131c2e' }}>Plan A — 2 Bed / 1 Bath</option>
            <option value="planB" style={{ background: '#131c2e' }}>Plan B — 4 Bed / 3 Bath</option>
            <option value="planC" style={{ background: '#131c2e' }}>Plan C — 3 Bed / 2 Bath (L-shaped)</option>
          </select>
        </div>

        {/* Drag-drop upload */}
        <div>
          <label className="section-label block mb-3">Upload Floor Plan Image</label>
          <div
            className={`drop-zone ${isDragOver ? 'active' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            style={{ padding: preview ? '16px' : '40px 20px', transition: 'all 0.3s' }}
          >
            {preview ? (
              <div className="flex items-start gap-5">
                <img src={preview} alt="Uploaded floor plan"
                  className="rounded-xl object-contain"
                  style={{ maxWidth: 200, maxHeight: 160, border: '1px solid var(--border)' }} />
                <div className="flex-1 flex flex-col justify-center">
                  <div className="tag tag-teal mb-3" style={{ display: 'inline-flex', width: 'fit-content' }}>
                    ✓ Image loaded
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'DM Sans, sans-serif' }}>
                    {uploadedImage?.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4, fontFamily: 'DM Mono, monospace' }}>
                    {uploadedImage ? (uploadedImage.size / 1024).toFixed(1) + ' KB' : ''}
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); fileInputRef.current?.click() }}
                    className="btn-ghost mt-4 px-4 py-1.5 rounded-lg text-xs"
                    style={{ width: 'fit-content' }}
                  >
                    Change image
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="animate-float" style={{ color: 'var(--teal-light)', marginBottom: 12, display: 'inline-block' }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', fontFamily: 'Outfit, sans-serif', marginBottom: 6 }}>
                  Drag & drop your floor plan
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  or click to browse · PNG, JPG, WEBP supported
                </div>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />
        </div>

        {/* Generate button + loading */}
        <div>
          <label className="section-label block mb-3">Generate 3D Model</label>

          {loading ? (
            <div className="rounded-2xl p-6 animate-fadeIn"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-3 mb-5 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="animate-spin w-5 h-5 rounded-full"
                  style={{ border: '2px solid rgba(17,100,102,0.3)', borderTopColor: 'var(--cyan)', flexShrink: 0 }} />
                <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>
                  Analyzing floor plan…
                </div>
              </div>
              <div className="flex flex-col gap-1">
                {STEPS.map((step, i) => (
                  <StepRow
                    key={step.id}
                    step={step}
                    status={i < currentStep ? 'done' : i === currentStep ? 'active' : 'pending'}
                    delay={i * 0.08}
                  />
                ))}
              </div>
            </div>
          ) : (
            <button
              onClick={handleGenerate}
              className="btn-glow w-full py-4 rounded-2xl text-sm flex items-center justify-center gap-3"
              style={{ fontSize: 14 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              Generate 3D Model
            </button>
          )}
        </div>

      </div>
    </section>
  )
}

export default UploadSection
