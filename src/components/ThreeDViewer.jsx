import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

const Wall = ({ x1, y1, x2, y2 }) => {
  const scale = 0.05
  const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
  const angle = Math.atan2(y2 - y1, x2 - x1)
  const centerX = (x1 + x2) / 2
  const centerY = (y1 + y2) / 2

  return (
    <mesh
      position={[centerX * scale, 1.5, centerY * scale]}
      rotation={[0, -angle, 0]}
    >
      <boxGeometry args={[length * scale, 3, 0.2]} />
      <meshStandardMaterial color="#555555" />
    </mesh>
  )
}

const ThreeDViewer = ({ walls }) => {
  if (!walls || walls.length === 0) {
    return <p className="text-center text-gray-600 text-lg mt-6">No walls to display yet</p>
  }

  // find center of all walls
  const allX = walls.flatMap(w => [w.x1, w.x2])
  const allY = walls.flatMap(w => [w.y1, w.y2])
  const minX = Math.min(...allX)
  const maxX = Math.max(...allX)
  const minY = Math.min(...allY)
  const maxY = Math.max(...allY)
  const centerX = (minX + maxX) / 2
  const centerY = (minY + maxY) / 2

  // floor size based on actual plan size
  const scale = 0.05
  const floorW = (maxX - minX) * scale + 2
  const floorH = (maxY - minY) * scale + 2

  return (
    <div id="threedmodel" className="max-w-6xl mx-auto mt-10 p-6 bg-white rounded-2xl shadow-lg">
      <h2 className="text-3xl font-bold text-gray-800 mb-4">3D Model</h2>
      <div className="h-125 w-full rounded-xl overflow-hidden border border-gray-200">
        <Canvas camera={{ position: [10, 15, 20], fov: 60 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />

          {/* floor centered properly */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
            <planeGeometry args={[floorW, floorH]} />
            <meshStandardMaterial color="lightyellow" />
          </mesh>

          {/* walls centered using offset */}
          <group position={[-centerX * scale, 0, -centerY * scale]}>
            {walls.map((wall, index) => (
              <Wall
                key={index}
                x1={wall.x1}
                y1={wall.y1}
                x2={wall.x2}
                y2={wall.y2}
              />
            ))}
          </group>

          <OrbitControls />
        </Canvas>
      </div>
    </div>
  )
}

export default ThreeDViewer