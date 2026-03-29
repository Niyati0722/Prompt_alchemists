import materials from '../datas/materials.js'
import plans from '../datas/Plans.js'

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

const isLoadBearing = (wall, allWalls) => {
  const allX = allWalls.flatMap(w => [w.x1, w.x2])
  const allY = allWalls.flatMap(w => [w.y1, w.y2])
  const minX = Math.min(...allX)
  const maxX = Math.max(...allX)
  const minY = Math.min(...allY)
  const maxY = Math.max(...allY)

  return (
    Math.abs(wall.x1 - minX) < 10 ||
    Math.abs(wall.x1 - maxX) < 10 ||
    Math.abs(wall.y1 - minY) < 10 ||
    Math.abs(wall.y1 - maxY) < 10
  )
}

const getTopMaterials = (wall, allWalls) => {
  const loadBearing = isLoadBearing(wall, allWalls)
  const relevant = materials.filter(m => {
    if (loadBearing) return m.type === 'loadbearing' || m.type === 'structural'
    else return m.type === 'partition' || m.type === 'general'
  })
  return relevant
    .map(m => ({ ...m, score: getScore(m, loadBearing) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
}

const getWallLabel = (wall, index, allWalls) => {
  const allX = allWalls.flatMap(w => [w.x1, w.x2])
  const allY = allWalls.flatMap(w => [w.y1, w.y2])
  const minX = Math.min(...allX)
  const maxX = Math.max(...allX)
  const minY = Math.min(...allY)
  const maxY = Math.max(...allY)

  if (Math.abs(wall.y1 - minY) < 10) return 'Top Outer Wall'
  if (Math.abs(wall.y1 - maxY) < 10) return 'Bottom Outer Wall'
  if (Math.abs(wall.x1 - minX) < 10) return 'Left Outer Wall'
  if (Math.abs(wall.x1 - maxX) < 10) return 'Right Outer Wall'
  return `Inner Wall ${index + 1}`
}

const rankColors = ['#ffcb9a', '#d9b08c', '#d1e8e2']

const MaterialTable = ({ walls, plan }) => {
  if (!walls || walls.length === 0) {
    return (
      <>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;600;700&display=swap');`}</style>
        <div
          id="materials"
          className="max-w-6xl mx-auto mt-10 mb-10 rounded-2xl flex items-center justify-center py-16"
          style={{ backgroundColor: '#2c3531', fontFamily: "'Lato', sans-serif" }}
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-[#d1e8e2] opacity-60">
            No walls detected yet
          </p>
        </div>
      </>
    )
  }

  const rooms = plan ? plans[plan]?.rooms : []

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;600;700&display=swap');
        #materials { font-family: 'Lato', sans-serif; }
        .mat-row:hover td { background-color: rgba(17, 100, 102, 0.15); }
      `}</style>

      <div
        id="materials"
        className="max-w-6xl mx-auto mt-10 mb-10 rounded-2xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: '#2c3531' }}
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-[#116466]">
          <h2 className="text-2xl font-bold tracking-wide text-[#ffcb9a]">
            Material Recommendations
          </h2>
          <p className="text-sm text-[#d1e8e2] mt-1">
            Top 3 materials ranked by suitability for each wall type
          </p>
        </div>

        <div className="px-8 py-8 flex flex-col gap-8">

          {walls.map((wall, index) => {
            const loadBearing = isLoadBearing(wall, walls)
            const topMaterials = getTopMaterials(wall, walls)
            const label = getWallLabel(wall, index, walls)

            return (
              <div
                key={index}
                className="rounded-xl overflow-hidden border border-[#116466]"
              >
                {/* Wall sub-header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-[#116466]"
                  style={{ backgroundColor: 'rgba(17,100,102,0.2)' }}
                >
                  <span
                    className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full"
                    style={{
                      backgroundColor: loadBearing ? '#116466' : 'rgba(17,100,102,0.3)',
                      color: loadBearing ? '#ffcb9a' : '#d1e8e2'
                    }}
                  >
                    {loadBearing ? 'Load Bearing' : 'Partition'}
                  </span>
                  <h4 className="text-base font-semibold text-[#d1e8e2]">
                    {label}
                  </h4>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm text-left">
                    <thead>
                      <tr style={{ backgroundColor: 'rgba(17,100,102,0.15)' }}>
                        {['Rank', 'Material', 'Cost', 'Strength', 'Durability', 'Score'].map(col => (
                          <th
                            key={col}
                            className="px-5 py-3 text-xs font-bold uppercase tracking-widest border-b border-[#116466]"
                            style={{ color: '#d9b08c' }}
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {topMaterials.map((m, i) => (
                        <tr key={i} className="mat-row border-b border-[#116466]/40 last:border-0 transition-colors duration-150">
                          <td className="px-5 py-3">
                            <span
                              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-[#2c3531]"
                              style={{ backgroundColor: rankColors[i] }}
                            >
                              {i + 1}
                            </span>
                          </td>
                          <td className="px-5 py-3 font-semibold text-[#ffcb9a]">{m.name}</td>
                          <td className="px-5 py-3 text-[#d1e8e2]">{m.cost}</td>
                          <td className="px-5 py-3 text-[#d1e8e2]">{m.strength}</td>
                          <td className="px-5 py-3 text-[#d1e8e2]">{m.durability}</td>
                          <td className="px-5 py-3 font-bold text-[#d9b08c]">{m.score.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}

          {/* Rooms section */}
          {rooms && rooms.length > 0 && (
            <div className="rounded-xl border border-[#116466] overflow-hidden">
              <div
                className="px-5 py-4 border-b border-[#116466]"
                style={{ backgroundColor: 'rgba(17,100,102,0.2)' }}
              >
                <h3 className="text-base font-semibold tracking-wide text-[#ffcb9a]">
                  Rooms in this Plan
                </h3>
              </div>
              <div className="px-5 py-4 flex flex-col gap-2">
                {rooms.map((room, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-[#d9b08c]" />
                    <span className="text-sm text-[#d1e8e2]">
                      {room.name}
                      <span className="text-[#d9b08c] ml-2 text-xs font-semibold uppercase tracking-wider">
                        {room.type}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}

export default MaterialTable