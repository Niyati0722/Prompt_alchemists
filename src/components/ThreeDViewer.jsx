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
      <meshStandardMaterial color="#116466" />
    </mesh>
  )
}

const ThreeDViewer = ({ walls }) => {
  if (!walls || walls.length === 0) {
    return (
      <>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;600;700&display=swap');`}</style>
        <div
          id="threedmodel"
          className="w-full flex items-center justify-center py-16"
          style={{ backgroundColor: '#2c3531', fontFamily: "'Lato', sans-serif" }}
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-[#d1e8e2] opacity-60">
            No walls to display yet
          </p>
        </div>
      </>
    )
  }

  const allX = walls.flatMap(w => [w.x1, w.x2])
  const allY = walls.flatMap(w => [w.y1, w.y2])
  const minX = Math.min(...allX)
  const maxX = Math.max(...allX)
  const minY = Math.min(...allY)
  const maxY = Math.max(...allY)
  const centerX = (minX + maxX) / 2
  const centerY = (minY + maxY) / 2

  const scale = 0.05
  const floorW = (maxX - minX) * scale + 2
  const floorH = (maxY - minY) * scale + 2

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;600;700&display=swap');`}</style>

      <div
        id="threedmodel"
        className="w-full overflow-hidden"
        style={{ backgroundColor: '#2c3531', fontFamily: "'Lato', sans-serif" }}
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-[#116466]">
          <h2 className="text-2xl font-bold tracking-wide text-[#ffcb9a]">
            3D Model
          </h2>
          <p className="text-sm text-[#d1e8e2] mt-1 font-normal">
            Orbit, zoom, and pan to inspect your floor plan
          </p>
        </div>

        {/* Canvas */}
        <div className="px-8 py-6">
          <div
            className="w-full overflow-hidden border border-[#116466]"
            style={{ height: '500px' }}
          >
            <Canvas camera={{ position: [10, 15, 20], fov: 60 }}>
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 10, 5]} intensity={1} />

              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <planeGeometry args={[floorW, floorH]} />
                <meshStandardMaterial color="#d1e8e2" />
              </mesh>

              <group position={[-centerX * scale, 0, -centerY * scale]}>
                {walls.map((wall, index) => (
                  <Wall key={index} x1={wall.x1} y1={wall.y1} x2={wall.x2} y2={wall.y2} />
                ))}
              </group>

              <OrbitControls />
            </Canvas>
          </div>

          <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-[#d9b08c] text-right">
            Left drag · Scroll zoom · Right drag pan
          </p>
        </div>
      </div>
    </>
  )
}

export default ThreeDViewer