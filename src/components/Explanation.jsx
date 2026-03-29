import { useState, useEffect, useRef } from 'react'
import materials from '../datas/materials.js'
import plans from '../datas/Plans.js'

/* ═══════════════════════════════════════════════
   Scoring / context logic — UNCHANGED
═══════════════════════════════════════════════ */

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

/* ═══════════════════════════════════════════════
   Groq API — UNCHANGED
═══════════════════════════════════════════════ */

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
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err?.error?.message || 'Groq API request failed')
  }

  const data = await response.json()
  const raw = data.choices?.[0]?.message?.content || ''
  return JSON.parse(raw.replace(/```json|```/g, '').trim())
}

/* ═══════════════════════════════════════════════
   UI Sub-components
═══════════════════════════════════════════════ */

const StatCard = ({ label, value, accent = 'var(--gold)' }) => (
  <div className="stat-card" style={{ minWidth: 100 }}>
    <div style={{ fontSize: 26, fontWeight: 800, color: accent, fontFamily: 'Outfit, sans-serif', lineHeight: 1 }}>
      {value}
    </div>
    <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginTop: 4, fontFamily: 'Outfit, sans-serif' }}>
      {label}
    </div>
  </div>
)

const Spinner = () => (
  <div className="flex flex-col items-center gap-4 py-12">
    <div className="animate-spin" style={{
      width: 36, height: 36, borderRadius: '50%',
      border: '3px solid rgba(17,100,102,0.2)',
      borderTopColor: 'var(--cyan)',
    }} />
    <p style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'Outfit, sans-serif' }}>
      Analysing structural data…
    </p>
  </div>
)

const Block = ({ title, icon, color = 'var(--gold-dim)', children }) => (
  <div className="card-inset overflow-hidden">
    <div className="flex items-center gap-2 px-5 py-3" style={{ borderBottom: '1px solid var(--border)', background: 'rgba(17,100,102,0.06)' }}>
      <span style={{ color: color }}>{icon}</span>
      <span style={{ fontSize: 10, fontFamily: 'Outfit, sans-serif', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: color }}>
        {title}
      </span>
    </div>
    {children}
  </div>
)

const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button onClick={copy} className="btn-ghost px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5">
      {copied ? (
        <>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--teal-light)" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
          Copied!
        </>
      ) : (
        <>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
          </svg>
          Copy
        </>
      )}
    </button>
  )
}

/* ═══════════════════════════════════════════════
   Main Component
═══════════════════════════════════════════════ */

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

  /* ── Empty state ── */
  if (!walls || walls.length === 0) {
    return (
      <section id="explanation" className="glass rounded-2xl overflow-hidden mb-6">
        <div className="px-8 py-5 flex items-center gap-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(17,100,102,0.15)', border: '1px solid rgba(17,100,102,0.3)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--teal-light)" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div>
            <div className="section-label">Step 4</div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 20, color: 'var(--gold)', margin: 0 }}>
              Structural Analysis
            </h2>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-14 gap-3">
          <div style={{ fontSize: 28, color: 'var(--text-dim)' }}>◉</div>
          <p style={{ fontSize: 12, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-dim)', fontFamily: 'Outfit, sans-serif' }}>
            AI analysis will appear after generation
          </p>
        </div>
      </section>
    )
  }

  /* ── Full result ── */
  const fullText = result ? [
    result.summary,
    ...(result.wallExplanations || []).map(w => `${w.label}: ${w.why} ${w.tradeoff}`),
    ...(result.structuralConcerns || []),
    result.overallRecommendation,
  ].join('\n\n') : ''

  return (
    <section id="explanation" className="glass rounded-2xl overflow-hidden mb-6 animate-fadeIn">
      {/* Header */}
      <div className="px-8 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(17,100,102,0.2)', border: '1px solid rgba(17,100,102,0.4)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div>
            <div className="section-label">Step 4 · AI Analysis</div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 20, color: 'var(--gold)', margin: 0 }}>
              Structural Explainability
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {result && <CopyButton text={fullText} />}
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
            LLaMA 3.3 70B
          </span>
        </div>
      </div>

      <div className="px-8 py-8 flex flex-col gap-5">

        {/* Stats row */}
        {context && (
          <div className="flex flex-wrap gap-3">
            <StatCard label="Walls Detected"  value={context.wallSummaries.length} accent="var(--gold)" />
            <StatCard label="Load-Bearing"    value={context.loadBearingCount}      accent="#fb923c" />
            <StatCard label="Partition"       value={context.partitionCount}        accent="var(--text-muted)" />
            <StatCard label="Long Spans"      value={context.longSpans.length}      accent={context.longSpans.length > 0 ? '#fb923c' : 'var(--text-muted)'} />
            {plan && (
              <StatCard
                label="Plan"
                value={plans[plan]?.name?.split('—')[0]?.trim() || plan}
                accent="var(--gold-dim)"
              />
            )}
          </div>
        )}

        {/* Loading */}
        {loading && <Spinner />}

        {/* Error */}
        {error && (
          <Block title="Analysis Failed" icon={
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          } color="#fb923c">
            <div className="px-5 py-4">
              <p style={{ fontSize: 13, color: 'var(--text)' }}>
                <span style={{ color: '#fb923c', fontWeight: 600 }}>Error: </span>
                <code style={{ fontFamily: 'DM Mono, monospace', fontSize: 12 }}>{error}</code>
              </p>
              <p style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                Ensure <code style={{ color: 'var(--gold)', fontFamily: 'DM Mono, monospace' }}>VITE_GROQ_API_KEY</code> is set in your{' '}
                <code style={{ color: 'var(--gold)', fontFamily: 'DM Mono, monospace' }}>.env</code> file.
              </p>
            </div>
          </Block>
        )}

        {/* Result */}
        {result && (
          <>
            {/* Summary */}
            <Block title="Structural Summary" icon={
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            }>
              <p style={{ padding: '16px 20px', fontSize: 14, lineHeight: 1.8, color: 'var(--text)' }}>
                {result.summary}
              </p>
            </Block>

            {/* Wall explanations */}
            <Block title="Wall-by-Wall Breakdown" icon={
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
              </svg>
            } color="var(--text)">
              <div>
                {result.wallExplanations?.map((item, i) => {
                  const ctxWall = context.wallSummaries.find(w => w.label === item.label) || context.wallSummaries[i]
                  const isLB = ctxWall?.type === 'Load-Bearing'
                  return (
                    <div key={i} style={{ padding: '16px 20px', borderBottom: i < result.wallExplanations.length - 1 ? '1px solid rgba(30,48,80,0.5)' : 'none' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <span style={{
                          width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontFamily: 'Outfit, sans-serif', fontWeight: 800,
                          background: isLB ? 'rgba(17,100,102,0.35)' : 'rgba(17,100,102,0.12)',
                          color: isLB ? 'var(--cyan)' : 'var(--text-muted)',
                          border: `1px solid ${isLB ? 'rgba(17,100,102,0.6)' : 'var(--border)'}`,
                          flexShrink: 0,
                        }}>
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <strong style={{ fontSize: 13, color: 'var(--gold)', fontFamily: 'Outfit, sans-serif' }}>
                          {item.label}
                        </strong>
                        <span className={`tag ${isLB ? 'tag-load' : 'tag-muted'}`}>{ctxWall?.type || 'Wall'}</span>
                        {ctxWall?.topMaterial && (
                          <span className="tag tag-teal">→ {ctxWall.topMaterial}</span>
                        )}
                      </div>
                      <div style={{ paddingLeft: 36, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <p style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.7, margin: 0 }}>
                          <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.14em', fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: 'var(--gold-dim)', marginRight: 6 }}>Why</span>
                          {item.why}
                        </p>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>
                          <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.14em', fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: 'var(--text-muted)', marginRight: 6 }}>Trade-off</span>
                          {item.tradeoff}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Block>

            {/* Structural concerns */}
            {result.structuralConcerns?.length > 0 ? (
              <Block title="Structural Concerns" icon={
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              } color="#fb923c">
                <ul style={{ listStyle: 'none', padding: '12px 20px', margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {result.structuralConcerns.map((c, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fb923c', flexShrink: 0, marginTop: 6 }} />
                      {c}
                    </li>
                  ))}
                </ul>
              </Block>
            ) : (
              <Block title="No Structural Concerns" icon={
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              } color="var(--teal-light)">
                <p style={{ padding: '12px 20px', fontSize: 12, color: 'var(--text-muted)' }}>
                  All detected spans are within safe limits for the selected materials.
                </p>
              </Block>
            )}

            {/* Overall recommendation */}
            <Block title="Overall Recommendation" icon={
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            }>
              <p style={{ padding: '16px 20px', fontSize: 14, lineHeight: 1.8, color: 'var(--text)' }}>
                {result.overallRecommendation}
              </p>
            </Block>

            {/* Rooms */}
            {context.rooms.length > 0 && (
              <Block title={`Room Layout · ${context.rooms.length} rooms`} icon={
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              } color="var(--text-muted)">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '14px 20px' }}>
                  {context.rooms.map((room, i) => (
                    <span key={i} className="tag tag-teal">{room.name}</span>
                  ))}
                </div>
              </Block>
            )}
          </>
        )}

      </div>
    </section>
  )
}

export default Explanation
