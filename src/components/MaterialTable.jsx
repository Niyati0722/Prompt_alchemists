import materials from '../datas/materials.js'
import plans from '../datas/Plans.js'

/* ── Scoring logic — UNCHANGED ── */
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

/* ── Score bar ── */
const ScoreBar = ({ value, max = 10 }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <div className="score-bar-track">
      <div className="score-bar-fill" style={{ width: `${Math.min(value / max * 100, 100)}%` }} />
    </div>
    <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-3)' }}>{value}/10</span>
  </div>
)

const MaterialTable = ({ walls, plan }) => {
  if (!walls || walls.length === 0) {
    return (
      <section id="materials" className="glass-card" style={{ marginBottom: 24, overflow: 'hidden' }}>
        <div style={{ padding: '22px 32px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="sec-num">3</div>
          <div>
            <div className="sec-label">Step Three</div>
            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 20, color: 'var(--text)', margin: 0 }}>Material Recommendations</h2>
          </div>
        </div>
        <div style={{ padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 34, opacity: 0.12 }}>◈</div>
          <p style={{ fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace' }}>
            Awaiting analysis
          </p>
        </div>
      </section>
    )
  }

  const rooms = plan ? plans[plan]?.rooms : []

  return (
    <section id="materials" className="glass-card anim-fadeIn" style={{ marginBottom: 24, overflow: 'hidden', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ padding: '22px 32px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="sec-num" style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)', boxShadow: '0 0 16px rgba(99,102,241,0.4)' }}>3</div>
          <div>
            <div className="sec-label">Step Three</div>
            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 20, color: 'var(--text)', margin: 0 }}>Material Recommendations</h2>
          </div>
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace' }}>
          Scored by structural suitability
        </span>
      </div>

      <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {walls.map((wall, index) => {
          const lb     = isLoadBearing(wall, walls)
          const top    = getTopMaterials(wall, walls)
          const label  = getWallLabel(wall, index, walls)
          return (
            <div key={index} className="glass-inset" style={{ overflow: 'hidden', transition: 'border-color 0.3s' }}>
              {/* Wall header */}
              <div style={{
                padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10,
                borderBottom: '1px solid var(--glass-border)',
                background: 'rgba(15,23,42,0.4)',
              }}>
                <span style={{
                  width: 30, height: 30, borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800,
                  background: lb ? 'linear-gradient(135deg, #1d4ed8, #6d28d9)' : 'rgba(255,255,255,0.05)',
                  color: lb ? 'white' : 'var(--text-3)',
                  border: `1px solid ${lb ? 'rgba(99,102,241,0.5)' : 'var(--border)'}`,
                  boxShadow: lb ? '0 0 12px rgba(99,102,241,0.3)' : 'none',
                  fontFamily: 'JetBrains Mono, monospace',
                }}>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{label}</span>
                <span className={`badge ${lb ? 'badge-purple' : 'badge-blue'}`} style={{ marginLeft: 4 }}>
                  {lb ? 'Load-Bearing' : 'Partition'}
                </span>
              </div>

              {/* Table */}
              <div style={{ overflowX: 'auto' }}>
                <table className="dash-table">
                  <thead>
                    <tr>
                      {['Rank', 'Material', 'Cost', 'Strength', 'Durability', 'Score'].map(col => (
                        <th key={col}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {top.map((m, i) => (
                      <tr key={i}>
                        <td><div className={`rank rank-${i+1}`}>{i + 1}</div></td>
                        <td>
                          <span style={{ fontWeight: 600, color: i === 0 ? '#fbbf24' : 'var(--text)', fontSize: 13 }}>
                            {m.name}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${m.cost === 'Low' ? 'badge-green' : m.cost === 'High' ? 'badge-red' : 'badge-amber'}`} style={{ fontSize: 9 }}>
                            {m.cost}
                          </span>
                        </td>
                        <td><ScoreBar value={m.strengthScore} /></td>
                        <td><ScoreBar value={m.durabilityScore} /></td>
                        <td>
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: 700, color: i === 0 ? '#fbbf24' : 'var(--text-2)' }}>
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

        {/* Rooms */}
        {rooms && rooms.length > 0 && (
          <div className="glass-inset" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--glass-border)', background: 'rgba(15,23,42,0.4)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', letterSpacing: '0.05em' }}>
                Room Layout
              </span>
              <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-3)', marginLeft: 4 }}>
                {rooms.length} rooms
              </span>
            </div>
            <div style={{ padding: '14px 20px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {rooms.map((room, i) => (
                <span key={i} className="badge badge-cyan">{room.name}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default MaterialTable
