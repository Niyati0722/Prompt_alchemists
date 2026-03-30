/**
 * CostEstimator.jsx
 * ─────────────────
 * NEW FILE — do NOT modify any existing file to add this component.
 * Import and render it in App.jsx right after <MaterialTable />.
 *
 * Usage:
 *   import CostEstimator from './components/CostEstimator'
 *   <CostEstimator walls={walls} plan={selectedPlan} />
 */

import materials from '../datas/materials.js'

// ─── Static cost-per-metre table (₹ / metre of wall) ─────────────────────────
const COST_PER_METRE = {
  'Red Brick':            1500,
  'AAC Blocks':           1200,
  'RCC':                  2000,
  'Steel Frame':          3500,
  'Hollow Concrete Block': 900,
  'Fly Ash Brick':        1100,
  'Lime Stone':            800,
  'Bamboo':                600,
  'Gypsum Board':          700,
  'Glass Partition':      2500,
}
const DEFAULT_COST_PER_METRE = 1200  // fallback for unknown materials

// ─── Helpers (mirrors MaterialTable / Explanation logic — no shared import) ──
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

const getScore = (material, lb) =>
  lb
    ? material.strengthScore * 0.6 + material.durabilityScore * 0.3 - material.costScore * 0.1
    : material.durabilityScore * 0.4 + material.strengthScore * 0.2 - material.costScore * 0.4

const getTopMaterial = (wall, allWalls) => {
  const lb = isLoadBearing(wall, allWalls)
  return materials
    .filter(m => lb ? m.type === 'loadbearing' || m.type === 'structural'
                    : m.type === 'partition'   || m.type === 'general')
    .map(m => ({ ...m, score: getScore(m, lb) }))
    .sort((a, b) => b.score - a.score)[0] || null
}

const getWallLengthMetres = (wall) => {
  // 1 metre ≈ 40 px (rough assumption for display — keeps numbers realistic)
  const px = Math.sqrt((wall.x2 - wall.x1) ** 2 + (wall.y2 - wall.y1) ** 2)
  return Math.max(1, Math.round(px / 40))
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

// ─── Cost Estimation Component ────────────────────────────────────────────────
const CostEstimator = ({ walls }) => {
  if (!walls || walls.length === 0) return null

  const rows = walls.map((wall, i) => {
    const topMat     = getTopMaterial(wall, walls)
    const matName    = topMat?.name || 'Unknown'
    const lengthM    = getWallLengthMetres(wall)
    const ratePerM   = COST_PER_METRE[matName] ?? DEFAULT_COST_PER_METRE
    const cost       = lengthM * ratePerM
    const lb         = isLoadBearing(wall, walls)
    const label      = getWallLabel(wall, i, walls)
    return { label, matName, lengthM, ratePerM, cost, lb }
  })

  const total = rows.reduce((sum, r) => sum + r.cost, 0)

  return (
    <section
      className="glass-card anim-fadeIn"
      style={{ marginBottom: 24, overflow: 'hidden', fontFamily: "'Inter', sans-serif" }}
    >
      {/* Header */}
      <div style={{
        padding: '22px 32px',
        borderBottom: '1px solid var(--glass-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            className="sec-num"
            style={{ background: 'linear-gradient(135deg, #059669, #0d9488)', boxShadow: '0 0 16px rgba(16,185,129,0.4)' }}
          >
            ₹
          </div>
          <div>
            <div className="sec-label">Bonus Feature</div>
            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 20, color: 'var(--text)', margin: 0 }}>
              Cost Estimation
            </h2>
          </div>
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace' }}>
          Based on recommended materials · ₹/metre
        </span>
      </div>

      <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Per-wall breakdown table */}
        <div className="glass-inset" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="dash-table">
              <thead>
                <tr>
                  {['Wall', 'Type', 'Material', 'Length (m)', 'Rate (₹/m)', 'Estimated Cost'].map(col => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600, color: 'var(--text)', fontSize: 13 }}>{row.label}</td>
                    <td>
                      <span className={`badge ${row.lb ? 'badge-purple' : 'badge-blue'}`} style={{ fontSize: 9 }}>
                        {row.lb ? 'Load-Bearing' : 'Partition'}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: '#fbbf24', fontWeight: 600 }}>{row.matName}</td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>{row.lengthM} m</td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: 'var(--text-3)' }}>
                      ₹{row.ratePerM.toLocaleString('en-IN')}
                    </td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                      ₹{row.cost.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Total banner */}
        <div style={{
          padding: '20px 24px',
          borderRadius: 14,
          background: 'linear-gradient(135deg, rgba(5,150,105,0.12), rgba(13,148,136,0.12))',
          border: '1px solid rgba(16,185,129,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 10px #34d399' }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
              Total Estimated Cost
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace' }}>
              ({walls.length} walls · approximate)
            </span>
          </div>
          <div style={{
            fontFamily: 'Poppins, sans-serif', fontWeight: 900, fontSize: 26,
            background: 'linear-gradient(135deg, #34d399, #67e8f9)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            ₹{total.toLocaleString('en-IN')}
          </div>
        </div>

        {/* Disclaimer */}
        <p style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace', margin: 0 }}>
          * Rates are indicative (2025 India average). Actual costs vary by region, contractor, and finishing.
          Pixel lengths converted at 40 px ≈ 1 m.
        </p>
      </div>
    </section>
  )
}

export default CostEstimator
