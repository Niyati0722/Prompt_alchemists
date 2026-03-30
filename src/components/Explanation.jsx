import { useState, useEffect, useRef } from 'react'
import materials from '../datas/materials.js'
import plans from '../datas/Plans.js'

/* ══════════════════════════════════════════════════════
   ALL SCORING / CONTEXT LOGIC — UNCHANGED
══════════════════════════════════════════════════════ */

const getScore = (material, isLoadBearing) => {
  if (isLoadBearing) {
    return (material.strengthScore * 0.6) + (material.durabilityScore * 0.3) - (material.costScore * 0.1)
  } else {
    return (material.durabilityScore * 0.4) + (material.strengthScore * 0.2) - (material.costScore * 0.4)
  }
}

const classifyWall = (wall, allWalls) => {
  const allX = allWalls.flatMap(w => [w.x1, w.x2])
  const allY = allWalls.flatMap(w => [w.y1, w.y2])
  const minX = Math.min(...allX), maxX = Math.max(...allX)
  const minY = Math.min(...allY), maxY = Math.max(...allY)
  return (
    Math.abs(wall.x1 - minX) < 10 || Math.abs(wall.x1 - maxX) < 10 ||
    Math.abs(wall.y1 - minY) < 10 || Math.abs(wall.y1 - maxY) < 10
  )
}

const getTopMaterials = (wall, allWalls) => {
  const lb = classifyWall(wall, allWalls)
  return materials
    .filter(m => lb ? m.type === 'loadbearing' || m.type === 'structural'
                    : m.type === 'partition'   || m.type === 'general')
    .map(m => ({ ...m, score: getScore(m, lb) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
}

const getWallLength = (w) => Math.round(Math.sqrt((w.x2 - w.x1) ** 2 + (w.y2 - w.y1) ** 2))

const getWallLabel = (wall, index, allWalls) => {
  const allX = allWalls.flatMap(w => [w.x1, w.x2])
  const allY = allWalls.flatMap(w => [w.y1, w.y2])
  const minX = Math.min(...allX), maxX = Math.max(...allX)
  const minY = Math.min(...allY), maxY = Math.max(...allY)
  if (Math.abs(wall.y1 - minY) < 10) return 'Top Outer Wall'
  if (Math.abs(wall.y1 - maxY) < 10) return 'Bottom Outer Wall'
  if (Math.abs(wall.x1 - minX) < 10) return 'Left Outer Wall'
  if (Math.abs(wall.x1 - maxX) < 10) return 'Right Outer Wall'
  return `Inner Wall ${index + 1}`
}

const buildAnalysisContext = (walls, plan) => {
  const planData = plan ? plans[plan] : null
  const wallSummaries = walls.map((wall, i) => {
    const lb = classifyWall(wall, walls)
    const label = getWallLabel(wall, i, walls)
    const length = getWallLength(wall)
    const top = getTopMaterials(wall, walls)
    return {
      label, type: lb ? 'Load-Bearing' : 'Partition',
      lengthPx: length, isLongSpan: length > 150,
      topMaterial: top[0]?.name, topScore: top[0]?.score?.toFixed(2),
      alternatives: top.slice(1).map(m => m.name).join(', '),
    }
  })
  const loadBearingCount = wallSummaries.filter(w => w.type === 'Load-Bearing').length
  const partitionCount   = wallSummaries.filter(w => w.type === 'Partition').length
  const longSpans        = wallSummaries.filter(w => w.isLongSpan)
  const rooms            = planData?.rooms || []
  return { wallSummaries, loadBearingCount, partitionCount, longSpans, rooms, planName: planData?.name || 'Unknown Plan' }
}

/* ── GROQ API — UNCHANGED ── */
const callGroqAPI = async (context) => {
  const { wallSummaries, loadBearingCount, partitionCount, longSpans, rooms, planName } = context
  const prompt = `You are a structural engineering assistant analyzing a floor plan for a hackathon demo. Be concise but insightful. Non-experts should understand your explanations.

Floor Plan: ${planName}
Rooms: ${rooms.map(r => r.name).join(', ') || 'Not specified'}
Total Walls Detected: ${wallSummaries.length} (${loadBearingCount} load-bearing, ${partitionCount} partition)
${longSpans.length > 0 ? `Long-Span Walls (>150px): ${longSpans.map(w => w.label).join(', ')}` : 'No unusually long spans detected.'}

Wall-by-Wall Analysis:
${wallSummaries.map(w =>
  `- ${w.label} [${w.type}]: length=${w.lengthPx}px → Top material: ${w.topMaterial} (score ${w.topScore}), alternatives: ${w.alternatives}`
).join('\n')}

Respond ONLY with a JSON object (no markdown, no backticks) with this exact structure:
{
  "summary": "2-3 sentence plain-English overview of the structural system",
  "wallExplanations": [
    {
      "label": "<wall label>",
      "why": "<one sentence: why this material suits this wall's role>",
      "tradeoff": "<one sentence: cost vs strength tradeoff the builder should know>"
    }
  ],
  "structuralConcerns": ["<concern 1>", "<concern 2>"],
  "overallRecommendation": "1-2 sentence actionable advice for the builder"
}`

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}` },
    body: JSON.stringify({ model: 'llama-3.3-70b-versatile', max_tokens: 1000, messages: [{ role: 'user', content: prompt }] }),
  })
  if (!response.ok) { const err = await response.json(); throw new Error(err?.error?.message || 'Groq API request failed') }
  const data = await response.json()
  const raw = data.choices?.[0]?.message?.content || ''
  return JSON.parse(raw.replace(/```json|```/g, '').trim())
}

/* ══════════════════════════════════════════════════════
   UI SUB-COMPONENTS
══════════════════════════════════════════════════════ */

const StatCard = ({ label, value, accent = '#60a5fa' }) => (
  <div className="glass-inset" style={{ padding: '14px 18px', flex: '1 1 90px' }}>
    <div style={{ fontSize: 28, fontWeight: 800, color: accent, fontFamily: 'Poppins, sans-serif', lineHeight: 1 }}>
      {value}
    </div>
    <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-3)', marginTop: 5, fontFamily: 'JetBrains Mono, monospace' }}>
      {label}
    </div>
  </div>
)

const Spinner = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '48px 0' }}>
    <div style={{
      width: 38, height: 38, borderRadius: '50%',
      border: '3px solid rgba(59,130,246,0.15)',
      borderTopColor: '#60a5fa',
      animation: 'spin 0.8s linear infinite',
    }} />
    <p style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace' }}>
      Analysing with AI…
    </p>
  </div>
)

const InfoBlock = ({ title, icon, accentColor = 'var(--text-2)', children }) => (
  <div className="glass-inset" style={{ overflow: 'hidden' }}>
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '11px 18px', borderBottom: '1px solid var(--glass-border)',
      background: 'rgba(15,23,42,0.5)',
    }}>
      <span style={{ color: accentColor }}>{icon}</span>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: accentColor, fontFamily: 'JetBrains Mono, monospace' }}>
        {title}
      </span>
    </div>
    {children}
  </div>
)

const CopyBtn = ({ text }) => {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }
  return (
    <button onClick={handleCopy} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: 12, gap: 6 }}>
      {copied ? (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
          Copied!
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
          </svg>
          Copy Report
        </>
      )}
    </button>
  )
}

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════ */

const Explanation = ({ walls, plan }) => {
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const prevKey = useRef(null)

  useEffect(() => {
    if (!walls || walls.length === 0) { setResult(null); setError(null); return }
    const key = JSON.stringify({ walls: walls.length, plan })
    if (key === prevKey.current) return
    prevKey.current = key
    const context = buildAnalysisContext(walls, plan)
    setLoading(true); setResult(null); setError(null)
    callGroqAPI(context)
      .then(parsed => { setResult({ ...parsed, _context: context }); setLoading(false) })
      .catch(err   => { setError(err.message); setLoading(false) })
  }, [walls, plan])

  const context = walls && walls.length > 0 ? buildAnalysisContext(walls, plan) : null

  const getFullText = () => {
    if (!result) return ''
    return [
      result.summary,
      ...(result.wallExplanations || []).map(w => `${w.label}: ${w.why} ${w.tradeoff}`),
      ...(result.structuralConcerns || []),
      result.overallRecommendation,
    ].join('\n\n')
  }

  /* Empty state */
  if (!walls || walls.length === 0) {
    return (
      <section id="explanation" className="glass-card" style={{ marginBottom: 24, overflow: 'hidden', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ padding: '22px 32px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="sec-num">4</div>
          <div>
            <div className="sec-label">Step Four</div>
            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 20, color: 'var(--text)', margin: 0 }}>Structural Analysis</h2>
          </div>
        </div>
        <div style={{ padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 34, opacity: 0.1 }}>◉</div>
          <p style={{ fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace' }}>
            AI analysis will appear after generation
          </p>
        </div>
      </section>
    )
  }

  return (
    <section id="explanation" className="glass-card anim-fadeIn" style={{ marginBottom: 24, overflow: 'hidden', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ padding: '22px 32px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="sec-num" style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)', boxShadow: '0 0 16px rgba(99,102,241,0.4)' }}>4</div>
          <div>
            <div className="sec-label">Step Four · AI Analysis</div>
            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 20, color: 'var(--text)', margin: 0 }}>Structural Explainability</h2>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {result && <CopyBtn text={getFullText()} />}
          <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-3)' }}>
            LLaMA 3.3 · 70B
          </span>
        </div>
      </div>

      <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Stats */}
        {context && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <StatCard label="Total Walls"    value={context.wallSummaries.length} accent="#60a5fa" />
            <StatCard label="Load-Bearing"   value={context.loadBearingCount}      accent="#c4b5fd" />
            <StatCard label="Partition"      value={context.partitionCount}        accent="#94a3b8" />
            <StatCard label="Long Spans"     value={context.longSpans.length}      accent={context.longSpans.length > 0 ? '#fb923c' : '#64748b'} />
            {plan && <StatCard label="Plan"  value={plans[plan]?.name?.split('—')[0]?.trim() || plan} accent="#67e8f9" />}
          </div>
        )}

        {loading && <Spinner />}

        {error && (
          <InfoBlock title="Analysis Failed" accentColor="#f87171"
            icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
          >
            <div style={{ padding: '14px 18px' }}>
              <p style={{ fontSize: 13, color: 'var(--text)' }}>
                <span style={{ color: '#f87171', fontWeight: 600 }}>Error: </span>
                <code style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{error}</code>
              </p>
              <p style={{ marginTop: 8, fontSize: 12, color: 'var(--text-3)' }}>
                Ensure <code style={{ color: '#fbbf24', fontFamily: 'JetBrains Mono, monospace' }}>VITE_GROQ_API_KEY</code> is set in your <code style={{ color: '#fbbf24', fontFamily: 'JetBrains Mono, monospace' }}>.env</code>
              </p>
            </div>
          </InfoBlock>
        )}

        {result && (
          <>
            {/* Summary */}
            <InfoBlock title="Structural Summary" accentColor="#60a5fa"
              icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
            >
              <p style={{ padding: '16px 18px', fontSize: 14, lineHeight: 1.85, color: 'var(--text-2)' }}>{result.summary}</p>
            </InfoBlock>

            {/* Wall-by-wall */}
            <InfoBlock title="Wall-by-Wall Breakdown" accentColor="var(--text-2)"
              icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>}
            >
              <div>
                {result.wallExplanations?.map((item, i) => {
                  const ctxWall = context.wallSummaries.find(w => w.label === item.label) || context.wallSummaries[i]
                  const isLB = ctxWall?.type === 'Load-Bearing'
                  return (
                    <div key={i} style={{
                      padding: '16px 18px',
                      borderBottom: i < result.wallExplanations.length - 1 ? '1px solid rgba(30,58,95,0.3)' : 'none',
                    }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <span style={{
                          width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace',
                          background: isLB ? 'linear-gradient(135deg, #1d4ed8, #6d28d9)' : 'rgba(255,255,255,0.05)',
                          color: isLB ? 'white' : 'var(--text-3)',
                          border: `1px solid ${isLB ? 'rgba(99,102,241,0.5)' : 'var(--border)'}`,
                          boxShadow: isLB ? '0 0 10px rgba(99,102,241,0.35)' : 'none',
                        }}>
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <strong style={{ fontSize: 13, color: '#fbbf24', fontWeight: 700 }}>{item.label}</strong>
                        <span className={`badge ${isLB ? 'badge-purple' : 'badge-blue'}`}>{ctxWall?.type || 'Wall'}</span>
                        {ctxWall?.topMaterial && <span className="badge badge-cyan">→ {ctxWall.topMaterial}</span>}
                      </div>
                      <div style={{ paddingLeft: 36, display: 'flex', flexDirection: 'column', gap: 7 }}>
                        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7 }}>
                          <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700, color: '#60a5fa', marginRight: 7, fontFamily: 'JetBrains Mono, monospace' }}>WHY</span>
                          {item.why}
                        </p>
                        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-3)', lineHeight: 1.7 }}>
                          <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700, color: 'var(--text-3)', marginRight: 7, fontFamily: 'JetBrains Mono, monospace' }}>TRADE-OFF</span>
                          {item.tradeoff}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </InfoBlock>

            {/* Concerns */}
            {result.structuralConcerns?.length > 0 ? (
              <InfoBlock title="Structural Concerns" accentColor="#fb923c"
                icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
              >
                <ul style={{ listStyle: 'none', padding: '12px 18px', margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {result.structuralConcerns.map((c, i) => (
                    <li key={i} style={{ display: 'flex', gap: 10, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fb923c', flexShrink: 0, marginTop: 6 }} />
                      {c}
                    </li>
                  ))}
                </ul>
              </InfoBlock>
            ) : (
              <InfoBlock title="No Structural Concerns" accentColor="#34d399"
                icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>}
              >
                <p style={{ padding: '12px 18px', fontSize: 13, color: 'var(--text-3)' }}>
                  All detected spans are within safe limits for selected materials.
                </p>
              </InfoBlock>
            )}

            {/* Recommendation */}
            <InfoBlock title="Overall Recommendation" accentColor="#fbbf24"
              icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
            >
              <p style={{ padding: '16px 18px', fontSize: 14, lineHeight: 1.85, color: 'var(--text-2)' }}>
                {result.overallRecommendation}
              </p>
            </InfoBlock>

            {/* Rooms */}
            {context.rooms.length > 0 && (
              <InfoBlock title={`Room Layout · ${context.rooms.length} rooms`} accentColor="var(--text-3)"
                icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}
              >
                <div style={{ padding: '12px 18px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {context.rooms.map((room, i) => (
                    <span key={i} className="badge badge-blue">{room.name}</span>
                  ))}
                </div>
              </InfoBlock>
            )}
          </>
        )}
      </div>
    </section>
  )
}

export default Explanation
