import { useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'

/* ── Wall mesh with improved materials ── */
const Wall = ({ x1, y1, x2, y2, isOuter }) => {
  const scale = 0.05
  const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
  const angle = Math.atan2(y2 - y1, x2 - x1)
  const centerX = (x1 + x2) / 2
  const centerY = (y1 + y2) / 2
  const wallH = isOuter ? 3.2 : 2.8
  const wallThick = isOuter ? 0.28 : 0.16

  return (
    <mesh
      position={[centerX * scale, wallH / 2, centerY * scale]}
      rotation={[0, -angle, 0]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[length * scale, wallH, wallThick]} />
      <meshStandardMaterial
        color={isOuter ? '#1a4a4c' : '#1f5a5c'}
        roughness={0.7}
        metalness={0.1}
        envMapIntensity={0.4}
      />
    </mesh>
  )
}

/* ── Floor plane ── */
const Floor = ({ w, h }) => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
    <planeGeometry args={[w, h]} />
    <meshStandardMaterial color="#0e1e20" roughness={0.9} metalness={0.05} />
  </mesh>
)

/* ── Floor grid lines (decorative) ── */
const FloorGrid = ({ w, h }) => (
  <gridHelper args={[Math.max(w, h) * 1.1, 20, '#112828', '#0d2020']} position={[0, 0.01, 0]} />
)

/* ── Ceiling/roof suggestion ── */
const CeilingHint = ({ w, h }) => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 3.2, 0]} receiveShadow>
    <planeGeometry args={[w, h]} />
    <meshStandardMaterial color="#0c1a1c" roughness={1} metalness={0} transparent opacity={0.18} side={2} />
  </mesh>
)

/* ── Scene lighting ── */
const Lighting = () => (
  <>
    <ambientLight intensity={0.45} color="#a8d8dc" />
    <directionalLight
      position={[12, 16, 10]}
      intensity={1.4}
      color="#fde8c8"
      castShadow
      shadow-mapSize-width={1024}
      shadow-mapSize-height={1024}
      shadow-camera-far={60}
      shadow-camera-left={-20}
      shadow-camera-right={20}
      shadow-camera-top={20}
      shadow-camera-bottom={-20}
    />
    <directionalLight position={[-8, 10, -6]} intensity={0.4} color="#88c4ca" />
    <pointLight position={[0, 6, 0]} intensity={0.3} color="#22d3ee" distance={20} />
  </>
)

/* ── Main component ── */
const ThreeDViewer = ({ walls }) => {
  if (!walls || walls.length === 0) {
    return (
      <section
        id="threedmodel"
        className="glass rounded-2xl overflow-hidden mb-6"
        style={{ minHeight: 160 }}
      >
        <div className="px-8 py-5 flex items-center gap-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(17,100,102,0.15)', border: '1px solid rgba(17,100,102,0.3)' }}>
            <span style={{ fontSize: 16, color: 'var(--teal-light)' }}>◈</span>
          </div>
          <div>
            <div className="section-label">Step 2</div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 20, color: 'var(--gold)', margin: 0 }}>
              3D Model
            </h2>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div style={{ fontSize: 32, color: 'var(--text-dim)' }}>◈</div>
          <p style={{ fontSize: 12, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-dim)', fontFamily: 'Outfit, sans-serif' }}>
            Generate a floor plan to see the 3D model
          </p>
        </div>
      </section>
    )
  }

  const allX = walls.flatMap(w => [w.x1, w.x2])
  const allY = walls.flatMap(w => [w.y1, w.y2])
  const minX = Math.min(...allX), maxX = Math.max(...allX)
  const minY = Math.min(...allY), maxY = Math.max(...allY)
  const centerX = (minX + maxX) / 2
  const centerY = (minY + maxY) / 2
  const scale = 0.05
  const floorW = (maxX - minX) * scale + 3
  const floorH = (maxY - minY) * scale + 3

  // Classify outer walls
  const isOuter = (w) =>
    Math.abs(w.x1 - minX) < 10 || Math.abs(w.x1 - maxX) < 10 ||
    Math.abs(w.y1 - minY) < 10 || Math.abs(w.y1 - maxY) < 10

  return (
    <section
      id="threedmodel"
      className="glass rounded-2xl overflow-hidden mb-6 animate-fadeIn"
    >
      {/* Header */}
      <div className="px-8 py-5 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center animate-glow"
            style={{ background: 'rgba(17,100,102,0.25)', border: '1px solid rgba(17,100,102,0.5)' }}>
            <span style={{ fontSize: 16, color: 'var(--cyan)' }}>◈</span>
          </div>
          <div>
            <div className="section-label">Step 2</div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 20, color: 'var(--gold)', margin: 0 }}>
              3D Model
            </h2>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <span className="tag tag-teal">{walls.length} walls</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
            Three.js · WebGL
          </span>
        </div>
      </div>

      {/* Canvas */}
      <div style={{ background: 'linear-gradient(180deg, #080d18 0%, #0a1320 100%)', position: 'relative' }}>
        <div style={{ height: 520, width: '100%' }}>
          <Canvas
            shadows
            camera={{ position: [floorW * 0.9, floorH * 1.1, floorW * 0.9], fov: 55 }}
            gl={{ antialias: true, alpha: false }}
            style={{ background: 'transparent' }}
          >
            <color attach="background" args={['#080d18']} />
            <fog attach="fog" args={['#080d18', 20, 60]} />

            <Lighting />

            <group position={[-centerX * scale, 0, -centerY * scale]}>
              {walls.map((wall, index) => (
                <Wall
                  key={index}
                  x1={wall.x1} y1={wall.y1}
                  x2={wall.x2} y2={wall.y2}
                  isOuter={isOuter(wall)}
                />
              ))}
            </group>

            <Floor w={floorW} h={floorH} />
            <FloorGrid w={floorW} h={floorH} />
            <CeilingHint w={floorW * 0.95} h={floorH * 0.95} />

            <OrbitControls
              enableDamping
              dampingFactor={0.08}
              minDistance={4}
              maxDistance={40}
              maxPolarAngle={Math.PI / 2.1}
              autoRotate
              autoRotateSpeed={0.4}
            />
          </Canvas>
        </div>

        {/* Overlay hint */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none"
          style={{
            background: 'rgba(10,14,26,0.75)',
            backdropFilter: 'blur(8px)',
            border: '1px solid var(--border)',
            borderRadius: 100,
            padding: '6px 16px',
            fontSize: 11,
            color: 'var(--text-muted)',
            fontFamily: 'DM Mono, monospace',
            letterSpacing: '0.08em',
            whiteSpace: 'nowrap',
          }}>
          Drag to rotate · Scroll to zoom · Click to stop auto-rotate
        </div>
      </div>
    </section>
  )
}

export default ThreeDViewer
