import materials from '../datas/materials.js'
import plans from '../datas/Plans.js'

// scoring formula
// load bearing walls: strength matters more
// partition walls: cost matters more
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

// classify wall as load bearing or partition
const isLoadBearing = (wall, allWalls) => {
  const allX = allWalls.flatMap(w => [w.x1, w.x2])
  const allY = allWalls.flatMap(w => [w.y1, w.y2])
  const minX = Math.min(...allX)
  const maxX = Math.max(...allX)
  const minY = Math.min(...allY)
  const maxY = Math.max(...allY)

  // outer walls are load bearing
  const isOuter = (
    Math.abs(wall.x1 - minX) < 10 ||
    Math.abs(wall.x1 - maxX) < 10 ||
    Math.abs(wall.y1 - minY) < 10 ||
    Math.abs(wall.y1 - maxY) < 10
  )

  return isOuter
}

const getTopMaterials = (wall, allWalls) => {
  const loadBearing = isLoadBearing(wall, allWalls)

  // filter relevant materials
  const relevant = materials.filter(m => {
    if (loadBearing) {
      return m.type === 'loadbearing' || m.type === 'structural'
    } else {
      return m.type === 'partition' || m.type === 'general'
    }
  })

  // score and sort
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

  if (Math.abs(wall.y1 - minY) < 10) return 'Top outer wall'
  if (Math.abs(wall.y1 - maxY) < 10) return 'Bottom outer wall'
  if (Math.abs(wall.x1 - minX) < 10) return 'Left outer wall'
  if (Math.abs(wall.x1 - maxX) < 10) return 'Right outer wall'
  return `Inner wall ${index + 1}`
}

const MaterialTable = ({ walls, plan }) => {
  if (!walls || walls.length === 0) {
    return <p className="text-center text-gray-600 text-lg mt-6">No walls detected yet</p>
  }

  const rooms = plan ? plans[plan]?.rooms : []

  return (
    <div id="materials" className="max-w-6xl mx-auto mt-10 p-6 bg-white rounded-2xl shadow-lg">
      <h2 className="text-3xl font-bold text-gray-800 mb-8">Material Recommendations</h2>

      {walls.map((wall, index) => {
        const loadBearing = isLoadBearing(wall, walls)
        const topMaterials = getTopMaterials(wall, walls)
        const label = getWallLabel(wall, index, walls)

        return (
          <div key={index} className="mb-8 p-5 border border-gray-200 rounded-xl shadow-sm">
            <h4 className="text-xl font-semibold text-gray-800 mb-4">
              {label} —
              {loadBearing ? ' Load Bearing' : ' Partition'}
            </h4>

            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-300 text-sm text-left">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="border border-gray-300 px-4 py-2">Rank</th>
                    <th className="border border-gray-300 px-4 py-2">Material</th>
                    <th className="border border-gray-300 px-4 py-2">Cost</th>
                    <th className="border border-gray-300 px-4 py-2">Strength</th>
                    <th className="border border-gray-300 px-4 py-2">Durability</th>
                    <th className="border border-gray-300 px-4 py-2">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {topMaterials.map((m, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2">{i + 1}</td>
                      <td className="border border-gray-300 px-4 py-2">{m.name}</td>
                      <td className="border border-gray-300 px-4 py-2">{m.cost}</td>
                      <td className="border border-gray-300 px-4 py-2">{m.strength}</td>
                      <td className="border border-gray-300 px-4 py-2">{m.durability}</td>
                      <td className="border border-gray-300 px-4 py-2">{m.score.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}

      {rooms && rooms.length > 0 && (
        <div className="mt-10 p-5 bg-gray-50 rounded-xl border border-gray-200">
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">Rooms in this plan</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            {rooms.map((room, i) => (
              <li key={i}>
                {room.name} — {room.type}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default MaterialTable