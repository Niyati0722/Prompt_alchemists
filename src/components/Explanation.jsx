import { useState, useEffect, useRef } from 'react'
import materials from '../datas/materials.js'
import plans from '../datas/Plans.js'

// ─── Scoring logic (mirrors MaterialTable.jsx) ──────────────────────────────

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

// ─── Build structured context for the LLM ────────────────────────────────────

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
  const partitionCount = wallSummaries.filter(w => w.type === 'Partition').length
  const longSpans = wallSummaries.filter(w => w.isLongSpan)
  const rooms = planData?.rooms || []

  return { wallSummaries, loadBearingCount, partitionCount, longSpans, rooms, planName: planData?.name || 'Unknown Plan' }
}

// ─── Groq API call ──────────────────────────────────────────────────────────

const callGroqAPI = async (context) => {
  const { wallSummaries, loadBearingCount, partitionCount, longSpans, rooms, planName } = context

  const prompt = `You are a structural engineering assistant analyzing a floor plan for a hackathon demo. Be concise but insightful. Non-experts should understand your explanations.

Floor Plan: ${planName}
Rooms: ${rooms.map(r => r.name).join(', ') || 'Not specified'}
Total Walls Detected: ${wallSummaries.length} (${loadBearingCount} load-bearing, ${partitionCount} partition)
${longSpans.length > 0 ? `Long-Span Walls (>150px, potential structural concern): ${longSpans.map(w => w.label).join(', ')}` : 'No unusually long spans detected.'}

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
  const clean = raw.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}

// ─── Sub-components (Tailwind styled) ────────────────────────────────────────

const Badge = ({ children, color }) => {
  const base = 'inline-block px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase border'
  const palette =
    color === 'amber'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : color === 'red'
      ? 'bg-red-50 text-red-700 border-red-200'
      : color === 'blue'
      ? 'bg-blue-50 text-blue-700 border-blue-200'
      : 'bg-slate-50 text-slate-700 border-slate-200'
  return <span className={`${base} ${palette}`}>{children}</span>
}

const StatCard = ({ label, value, accent }) => (
  <div className="flex-1 min-w-30 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
    <div
      className="text-2xl font-extrabold font-mono leading-none"
      style={{ color: accent }}
    >
      {value}
    </div>
    <div className="mt-1 text-[11px] uppercase tracking-[0.16em] text-gray-500">
      {label}
    </div>
  </div>
)

const Spinner = () => (
  <div className="flex flex-col items-center gap-4 py-10">
    <div className="w-10 h-10 border-4 border-gray-200 border-t-4 border-t-amber-500 rounded-full animate-spin" />
    <p className="text-xs text-gray-500 font-mono">
      Analysing structural data…
    </p>
  </div>
)

// ─── Main Component ───────────────────────────────────────────────────────────

const Explanation = ({ walls, plan }) => {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const prevKey = useRef(null)

  // Re-run analysis whenever walls or plan changes
  useEffect(() => {
    if (!walls || walls.length === 0) {
      setResult(null)
      setError(null)
      return
    }

    const key = JSON.stringify({ walls: walls.length, plan })
    if (key === prevKey.current) return
    prevKey.current = key

    const context = buildAnalysisContext(walls, plan)

    setLoading(true)
    setResult(null)
    setError(null)

    callGroqAPI(context)
      .then(parsed => {
        setResult({ ...parsed, _context: context })
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [walls, plan])

  // Empty state
  if (!walls || walls.length === 0) {
    return (
      <section
        id="explanation"
        className="mt-10 px-6 py-8 bg-gray-50 border-t border-gray-200"
      >
        <div className="mb-6">
          <span className="inline-block text-[11px] font-mono text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-1 mb-3 tracking-[0.16em] uppercase">
            Stage 05
          </span>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            Structural Explainability
          </h2>
          <p className="text-sm text-gray-600">
            Upload a floor plan to generate an AI-powered structural analysis.
          </p>
        </div>
        <div className="border border-dashed border-gray-300 rounded-xl p-10 flex flex-col items-center gap-3 bg-white">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#94A3B8"
            strokeWidth="1.5"
          >
            <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
          </svg>
          <p className="text-xs text-gray-500 font-mono">
            No floor plan loaded
          </p>
        </div>
      </section>
    )
  }

  const context = walls.length > 0 ? buildAnalysisContext(walls, plan) : null

  return (
    <section
      id="explanation"
      className="mt-10 px-6 py-8 bg-gray-50 border-t border-gray-200"
    >
      {/* Header */}
      <div className="mb-6">
        <span className="inline-block text-[11px] font-mono text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-1 mb-3 tracking-[0.16em] uppercase">
          Stage 05 · AI Analysis
        </span>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          Structural Explainability
        </h2>
        <p className="text-sm text-gray-600">
          Plain-language explanations of every structural decision — generated by Claude.
        </p>
      </div>

      {/* Stats row */}
      {context && (
        <div className="flex flex-wrap gap-3 mb-7">
          <StatCard label="Walls Detected" value={context.wallSummaries.length} accent="#f59e0b" />
          <StatCard label="Load-Bearing" value={context.loadBearingCount} accent="#ef4444" />
          <StatCard label="Partition" value={context.partitionCount} accent="#3b82f6" />
          <StatCard
            label="Long Spans"
            value={context.longSpans.length}
            accent={context.longSpans.length > 0 ? '#f97316' : '#22c55e'}
          />
          {plan && (
            <StatCard
              label="Plan"
              value={plans[plan]?.name?.split('—')[0]?.trim() || plan}
              accent="#a78bfa"
            />
          )}
        </div>
      )}

      {/* Loading */}
      {loading && <Spinner />}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-5">
          <div className="text-sm">
            <strong className="text-red-600">Analysis failed:</strong>
            <span className="text-gray-700 ml-2 font-mono text-xs">
              {error}
            </span>
          </div>
          <p className="mt-2 text-xs text-gray-600">
            Check that <code className="text-amber-600">VITE_GROQ_API_KEY</code> is set in your{' '}
            <code className="text-amber-600">.env</code> file.
          </p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="flex flex-col gap-4">
          {/* Summary card */}
          <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 shadow-sm">
            <div className="flex items-center text-[11px] font-semibold tracking-[0.16em] uppercase text-gray-500 mb-2">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2"
                className="mr-1.5"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Structural Summary
            </div>
            <p className="text-sm text-gray-800 leading-relaxed">
              {result.summary}
            </p>
          </div>

          {/* Wall explanations */}
          <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 shadow-sm">
            <div className="flex items-center text-[11px] font-semibold tracking-[0.16em] uppercase text-gray-500 mb-3">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                className="mr-1.5"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="9" y1="21" x2="9" y2="9" />
              </svg>
              Wall-by-Wall Explanation
            </div>
            <div className="flex flex-col divide-y divide-gray-100">
              {result.wallExplanations?.map((item, i) => {
                const ctxWall =
                  context.wallSummaries.find(w => w.label === item.label) ||
                  context.wallSummaries[i]
                const isLB = ctxWall?.type === 'Load-Bearing'
                return (
                  <div key={i} className="py-3">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-[11px] font-mono font-bold border ${
                          isLB
                            ? 'bg-red-50 text-red-600 border-red-200'
                            : 'bg-blue-50 text-blue-600 border-blue-200'
                        }`}
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <strong className="text-sm text-gray-900">
                        {item.label}
                      </strong>
                      <Badge color={isLB ? 'red' : 'blue'}>
                        {ctxWall?.type || 'Wall'}
                      </Badge>
                      {ctxWall?.topMaterial && (
                        <Badge color="amber">→ {ctxWall.topMaterial}</Badge>
                      )}
                    </div>
                    <div className="pl-10 flex flex-col gap-1.5">
                      <p className="text-xs text-gray-700 leading-relaxed">
                        <span className="text-[11px] uppercase tracking-[0.12em] font-semibold text-gray-500 mr-1">
                          Why:
                        </span>
                        {item.why}
                      </p>
                      <p className="text-xs text-gray-700 leading-relaxed">
                        <span className="text-[11px] uppercase tracking-[0.12em] font-semibold text-gray-500 mr-1">
                          Trade-off:
                        </span>
                        {item.tradeoff}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Structural concerns */}
          {result.structuralConcerns?.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl px-5 py-4 shadow-sm">
              <div className="flex items-center text-[11px] font-semibold tracking-[0.16em] uppercase text-orange-600 mb-2">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="2"
                  className="mr-1.5"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                Structural Concerns
              </div>
              <ul className="mt-1 list-disc list-inside space-y-1.5 text-sm text-gray-800">
                {result.structuralConcerns.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}

          {/* No concerns */}
          {result.structuralConcerns?.length === 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4 shadow-sm">
              <div className="flex items-center text-[11px] font-semibold tracking-[0.16em] uppercase text-emerald-600 mb-1">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="2"
                  className="mr-1.5"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                No Structural Concerns Detected
              </div>
              <p className="mt-1 text-xs text-gray-700">
                All detected spans are within safe limits for the selected materials.
              </p>
            </div>
          )}

          {/* Overall recommendation */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-5 py-4 shadow-sm">
            <div className="flex items-center text-[11px] font-semibold tracking-[0.16em] uppercase text-indigo-600 mb-2">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#a78bfa"
                strokeWidth="2"
                className="mr-1.5"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              Overall Recommendation
            </div>
            <p className="text-sm text-indigo-900 leading-relaxed">
              {result.overallRecommendation}
            </p>
          </div>

          {/* Rooms reference */}
          {context.rooms.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 shadow-sm">
              <div className="flex items-center text-[11px] font-semibold tracking-[0.16em] uppercase text-gray-500 mb-2">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#64748B"
                  strokeWidth="2"
                  className="mr-1.5"
                >
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                Room Layout ({context.rooms.length} rooms)
              </div>
              <div className="flex flex-wrap gap-2 mt-1">
                {context.rooms.map((room, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full text-xs bg-slate-50 border border-slate-200 text-slate-700 font-mono"
                  >
                    {room.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

export default Explanation