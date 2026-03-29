import { useState, useEffect, useRef } from 'react'
import materials from '../datas/materials.js'
import plans from '../datas/Plans.js'

// ─── Scoring logic ────────────────────────────────────────────────────────────

const getScore = (material, isLoadBearing) => {
  if (isLoadBearing) {
    return (material.strengthScore * 0.6) +
           (material.durabilityScore * 0.3) -
           (material.costScore * 0.1)
  } else {
    return (material.durabilityScore * 0.4) +
           (material.strengthScore * 0.2) -
           (material.costScore * 0.4)
  }
}

const classifyWall = (wall, allWalls) => {
  const allX = allWalls.flatMap(w => [w.x1, w.x2])
  const allY = allWalls.flatMap(w => [w.y1, w.y2])
  const minX = Math.min(...allX), maxX = Math.max(...allX)
  const minY = Math.min(...allY), maxY = Math.max(...allY)
  return (
    Math.abs(wall.x1 - minX) < 10 ||
    Math.abs(wall.x1 - maxX) < 10 ||
    Math.abs(wall.y1 - minY) < 10 ||
    Math.abs(wall.y1 - maxY) < 10
  )
}

const getTopMaterials = (wall, allWalls) => {
  const lb = classifyWall(wall, allWalls)
  return materials
    .filter(m => lb
      ? m.type === 'loadbearing' || m.type === 'structural'
      : m.type === 'partition' || m.type === 'general')
    .map(m => ({ ...m, score: getScore(m, lb) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
}

const getWallLength = (w) =>
  Math.round(Math.sqrt((w.x2 - w.x1) ** 2 + (w.y2 - w.y1) ** 2))

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
      label,
      type: lb ? 'Load-Bearing' : 'Partition',
      lengthPx: length,
      isLongSpan: length > 150,
      topMaterial: top[0]?.name,
      topScore: top[0]?.score?.toFixed(2),
      alternatives: top.slice(1).map(m => m.name).join(', '),
    }
  })
  const loadBearingCount = wallSummaries.filter(w => w.type === 'Load-Bearing').length
  const partitionCount   = wallSummaries.filter(w => w.type === 'Partition').length
  const longSpans        = wallSummaries.filter(w => w.isLongSpan)
  const rooms            = planData?.rooms || []
  return { wallSummaries, loadBearingCount, partitionCount, longSpans, rooms, planName: planData?.name || 'Unknown Plan' }
}

// ─── Groq API ─────────────────────────────────────────────────────────────────

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

// ─── Sub-components ───────────────────────────────────────────────────────────

const Badge = ({ children, type }) => {
  const styles = {
    lb:       'bg-[#116466]/20 text-[#ffcb9a] border-[#116466]',
    partition:'bg-[#116466]/10 text-[#d1e8e2] border-[#116466]/50',
    material: 'bg-[#d9b08c]/20 text-[#d9b08c] border-[#d9b08c]/40',
  }
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase border ${styles[type] || styles.partition}`}>
      {children}
    </span>
  )
}

const StatCard = ({ label, value, accent }) => (
  <div
    className="flex-1 min-w-28 rounded-xl px-4 py-3 border border-[#116466]"
    style={{ backgroundColor: 'rgba(17,100,102,0.15)' }}
  >
    <div className="text-2xl font-extrabold leading-none" style={{ color: accent }}>
      {value}
    </div>
    <div className="mt-1 text-[10px] uppercase tracking-widest text-[#d1e8e2] opacity-70">
      {label}
    </div>
  </div>
)

const Spinner = () => (
  <div className="flex flex-col items-center gap-4 py-12">
    <div className="w-10 h-10 rounded-full border-4 border-[#116466] border-t-[#ffcb9a] animate-spin" />
    <p className="text-xs uppercase tracking-widest text-[#d1e8e2] opacity-60">
      Analysing structural data…
    </p>
  </div>
)

const SectionCard = ({ children, className = '' }) => (
  <div
    className={`rounded-xl border border-[#116466] overflow-hidden ${className}`}
    style={{ backgroundColor: 'rgba(17,100,102,0.1)' }}
  >
    {children}
  </div>
)

const SectionTitle = ({ icon, children, color = '#d9b08c' }) => (
  <div
    className="flex items-center gap-2 px-5 py-3 border-b border-[#116466] text-[10px] font-bold uppercase tracking-widest"
    style={{ color, backgroundColor: 'rgba(17,100,102,0.2)' }}
  >
    {icon}
    {children}
  </div>
)

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconInfo = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)
const IconWall = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
  </svg>
)
const IconWarn = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)
const IconCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IconStar = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)
const IconHome = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
)

// ─── Main Component ───────────────────────────────────────────────────────────

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

  // ── Empty state ──
  if (!walls || walls.length === 0) {
    return (
      <>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;600;700&display=swap');`}</style>
        <section
          id="explanation"
          className="max-w-6xl mx-auto mt-10 mb-10 rounded-2xl overflow-hidden shadow-2xl"
          style={{ backgroundColor: '#2c3531', fontFamily: "'Lato', sans-serif" }}
        >
          <div className="px-8 py-6 border-b border-[#116466]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#d9b08c] mb-1">Stage 05</p>
            <h2 className="text-2xl font-bold tracking-wide text-[#ffcb9a]">Structural Explainability</h2>
            <p className="text-sm text-[#d1e8e2] mt-1">Upload a floor plan to generate an AI-powered structural analysis.</p>
          </div>
          <div className="px-8 py-16 flex flex-col items-center gap-3">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#116466" strokeWidth="1.5">
              <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
            </svg>
            <p className="text-xs uppercase tracking-widest text-[#d1e8e2] opacity-40">No floor plan loaded</p>
          </div>
        </section>
      </>
    )
  }

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;600;700&display=swap');`}</style>

      <section
        id="explanation"
        className="max-w-6xl mx-auto mt-10 mb-10 rounded-2xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: '#2c3531', fontFamily: "'Lato', sans-serif" }}
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-[#116466]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#d9b08c] mb-1">Stage 05 · AI Analysis</p>
          <h2 className="text-2xl font-bold tracking-wide text-[#ffcb9a]">Structural Explainability</h2>
          <p className="text-sm text-[#d1e8e2] mt-1">Plain-language explanations of every structural decision — generated by AI.</p>
        </div>

        <div className="px-8 py-8 flex flex-col gap-6">

          {/* Stats row */}
          {context && (
            <div className="flex flex-wrap gap-3">
              <StatCard label="Walls Detected"  value={context.wallSummaries.length}  accent="#ffcb9a" />
              <StatCard label="Load-Bearing"    value={context.loadBearingCount}       accent="#d9b08c" />
              <StatCard label="Partition"       value={context.partitionCount}         accent="#d1e8e2" />
              <StatCard label="Long Spans"      value={context.longSpans.length}
                accent={context.longSpans.length > 0 ? '#ffcb9a' : '#d1e8e2'} />
              {plan && (
                <StatCard label="Plan"
                  value={plans[plan]?.name?.split('—')[0]?.trim() || plan}
                  accent="#d9b08c" />
              )}
            </div>
          )}

          {/* Loading */}
          {loading && <Spinner />}

          {/* Error */}
          {error && (
            <SectionCard>
              <SectionTitle icon={<IconWarn />} color="#ffcb9a">Analysis Failed</SectionTitle>
              <div className="px-5 py-4">
                <p className="text-sm text-[#d1e8e2]">
                  <span className="text-[#ffcb9a] font-semibold">Error: </span>
                  <span className="font-mono text-xs">{error}</span>
                </p>
                <p className="mt-2 text-xs text-[#d1e8e2] opacity-60">
                  Check that <code className="text-[#d9b08c]">VITE_GROQ_API_KEY</code> is set in your{' '}
                  <code className="text-[#d9b08c]">.env</code> file.
                </p>
              </div>
            </SectionCard>
          )}

          {/* Result */}
          {result && (
            <>
              {/* Summary */}
              <SectionCard>
                <SectionTitle icon={<IconInfo />}>Structural Summary</SectionTitle>
                <p className="px-5 py-4 text-sm text-[#d1e8e2] leading-relaxed">{result.summary}</p>
              </SectionCard>

              {/* Wall explanations */}
              <SectionCard>
                <SectionTitle icon={<IconWall />} color="#d1e8e2">Wall-by-Wall Explanation</SectionTitle>
                <div className="divide-y divide-[#116466]/40">
                  {result.wallExplanations?.map((item, i) => {
                    const ctxWall = context.wallSummaries.find(w => w.label === item.label) || context.wallSummaries[i]
                    const isLB = ctxWall?.type === 'Load-Bearing'
                    return (
                      <div key={i} className="px-5 py-4">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold border"
                            style={{
                              backgroundColor: isLB ? 'rgba(17,100,102,0.4)' : 'rgba(17,100,102,0.15)',
                              color: isLB ? '#ffcb9a' : '#d1e8e2',
                              borderColor: '#116466'
                            }}
                          >
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <strong className="text-sm text-[#ffcb9a]">{item.label}</strong>
                          <Badge type={isLB ? 'lb' : 'partition'}>{ctxWall?.type || 'Wall'}</Badge>
                          {ctxWall?.topMaterial && <Badge type="material">→ {ctxWall.topMaterial}</Badge>}
                        </div>
                        <div className="pl-9 flex flex-col gap-2">
                          <p className="text-xs text-[#d1e8e2] leading-relaxed">
                            <span className="text-[10px] uppercase tracking-widest font-bold text-[#d9b08c] mr-1">Why:</span>
                            {item.why}
                          </p>
                          <p className="text-xs text-[#d1e8e2] leading-relaxed">
                            <span className="text-[10px] uppercase tracking-widest font-bold text-[#d9b08c] mr-1">Trade-off:</span>
                            {item.tradeoff}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </SectionCard>

              {/* Structural concerns */}
              {result.structuralConcerns?.length > 0 ? (
                <SectionCard>
                  <SectionTitle icon={<IconWarn />} color="#ffcb9a">Structural Concerns</SectionTitle>
                  <ul className="px-5 py-4 flex flex-col gap-2">
                    {result.structuralConcerns.map((c, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#d1e8e2]">
                        <span className="mt-1 w-2 h-2 rounded-full bg-[#ffcb9a] shrink-0" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </SectionCard>
              ) : (
                <SectionCard>
                  <SectionTitle icon={<IconCheck />} color="#d1e8e2">No Structural Concerns Detected</SectionTitle>
                  <p className="px-5 py-4 text-xs text-[#d1e8e2] opacity-70">
                    All detected spans are within safe limits for the selected materials.
                  </p>
                </SectionCard>
              )}

              {/* Overall recommendation */}
              <SectionCard>
                <SectionTitle icon={<IconStar />} color="#d9b08c">Overall Recommendation</SectionTitle>
                <p className="px-5 py-4 text-sm text-[#d1e8e2] leading-relaxed">{result.overallRecommendation}</p>
              </SectionCard>

              {/* Rooms */}
              {context.rooms.length > 0 && (
                <SectionCard>
                  <SectionTitle icon={<IconHome />}>Room Layout ({context.rooms.length} rooms)</SectionTitle>
                  <div className="px-5 py-4 flex flex-wrap gap-2">
                    {context.rooms.map((room, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-full text-xs border border-[#116466] text-[#d1e8e2] font-mono"
                        style={{ backgroundColor: 'rgba(17,100,102,0.2)' }}
                      >
                        {room.name}
                      </span>
                    ))}
                  </div>
                </SectionCard>
              )}
            </>
          )}

        </div>
      </section>
    </>
  )
}

export default Explanation