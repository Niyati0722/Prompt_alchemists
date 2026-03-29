import materials from '../datas/materials.js'
import plans from '../datas/Plans.js'

/* ── Scoring / classification (unchanged logic) ── */
const getScore = (material, isLoadBearing) => {
  if (isLoadBearing) {
    return (material.strengthScore * 0.6) + (material.durabilityScore * 0.3) - (material.costScore * 0.1)
  } else {
    return (material.durabilityScore * 0.4) + (material.strengthScore * 0.2) - (material.costScore * 0.4)
  }
}

const isLoadBearing = (wall, allWalls) => {
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
  const lb = isLoadBearing(wall, allWalls)
  const relevant = materials.filter(m =>
    lb ? m.type === 'loadbearing' || m.type === 'structural'
       : m.type === 'partition'   || m.type === 'general'
  )
  return relevant
    .map(m => ({ ...m, score: getScore(m, lb) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
}

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

/* ── Rank colors ── */
const rankClass = ['rank-1', 'rank-2', 'rank-3']

/* ── Score bar ── */
const ScoreBar = ({ value, max = 10 }) => {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div style={{ height: 4, background: 'rgba(17,100,102,0.2)', borderRadius: 2, overflow: 'hidden', width: 60 }}>
      <div style={{
        height: '100%', width: `${pct}%`,
        background: 'linear-gradient(90deg, var(--teal), var(--cyan))',
        borderRadius: 2,
        transition: 'width 0.6s ease',
      }} />
    </div>
  )
}

const MaterialTable = ({ walls, plan }) => {
  if (!walls || walls.length === 0) {
    return (
      <section id="materials" className="glass rounded-2xl overflow-hidden mb-6">
        <div className="px-8 py-5 flex items-center gap-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(17,100,102,0.15)', border: '1px solid rgba(17,100,102,0.3)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--teal-light)" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
            </svg>
          </div>
          <div>
            <div className="section-label">Step 3</div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 20, color: 'var(--gold)', margin: 0 }}>
              Material Recommendations
            </h2>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-14 gap-3">
          <div style={{ fontSize: 28, color: 'var(--text-dim)' }}>⬡</div>
          <p style={{ fontSize: 12, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-dim)', fontFamily: 'Outfit, sans-serif' }}>
            Awaiting floor plan analysis
          </p>
        </div>
      </section>
    )
  }

  const rooms = plan ? plans[plan]?.rooms : []

  return (
    <section id="materials" className="glass rounded-2xl overflow-hidden mb-6 animate-fadeIn">
      {/* Header */}
      <div className="px-8 py-5 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(17,100,102,0.2)', border: '1px solid rgba(17,100,102,0.4)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
            </svg>
          </div>
          <div>
            <div className="section-label">Step 3</div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 20, color: 'var(--gold)', margin: 0 }}>
              Material Recommendations
            </h2>
          </div>
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
          Top 3 per wall · scored by suitability
        </span>
      </div>

      <div className="px-8 py-8 flex flex-col gap-6">
        {walls.map((wall, index) => {
          const lb        = isLoadBearing(wall, walls)
          const topMats   = getTopMaterials(wall, walls)
          const label     = getWallLabel(wall, index, walls)

          return (
            <div key={index} className="card-inset overflow-hidden">
              {/* Wall sub-header */}
              <div className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: '1px solid var(--border)', background: 'rgba(17,100,102,0.07)' }}>
                <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{
                    fontFamily: 'Outfit, sans-serif',
                    background: lb ? 'rgba(17,100,102,0.35)' : 'rgba(17,100,102,0.12)',
                    color: lb ? 'var(--cyan)' : 'var(--text-muted)',
                    border: `1px solid ${lb ? 'rgba(17,100,102,0.6)' : 'var(--border)'}`,
                  }}>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h4 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 14, color: 'var(--text)', margin: 0 }}>
                  {label}
                </h4>
                <span className={`tag ${lb ? 'tag-load' : 'tag-muted'}`} style={{ marginLeft: 4 }}>
                  {lb ? 'Load-Bearing' : 'Partition'}
                </span>
              </div>

              {/* Material rows */}
              <div className="overflow-x-auto">
                <table className="styled">
                  <thead>
                    <tr>
                      {['Rank', 'Material', 'Cost', 'Strength', 'Durability', 'Score'].map(col => (
                        <th key={col}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {topMats.map((m, i) => (
                      <tr key={i}>
                        <td>
                          <div className={`rank-badge ${rankClass[i]}`}>{i + 1}</div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: i === 0 ? 'var(--gold)' : 'var(--text)', fontFamily: 'Outfit, sans-serif' }}>
                            {m.name}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{m.cost}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <ScoreBar value={m.strengthScore} />
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>{m.strength}</span>
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <ScoreBar value={m.durabilityScore} />
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>{m.durability}</span>
                          </div>
                        </td>
                        <td>
                          <span style={{
                            fontFamily: 'DM Mono, monospace',
                            fontWeight: 700,
                            fontSize: 14,
                            color: i === 0 ? 'var(--gold)' : 'var(--text-muted)',
                          }}>
                            {m.score.toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}

        {/* Rooms grid */}
        {rooms && rooms.length > 0 && (
          <div className="card-inset overflow-hidden">
            <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border)', background: 'rgba(17,100,102,0.07)' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--teal-light)" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 13, color: 'var(--gold)', margin: 0 }}>
                Room Layout
              </h3>
              <span style={{ marginLeft: 4, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
                {rooms.length} rooms
              </span>
            </div>
            <div className="flex flex-wrap gap-2 px-5 py-4">
              {rooms.map((room, i) => (
                <span key={i} className="tag tag-teal" style={{ gap: 5 }}>
                  <span style={{ fontSize: 8, opacity: 0.7 }}>⬡</span>
                  {room.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default MaterialTable
