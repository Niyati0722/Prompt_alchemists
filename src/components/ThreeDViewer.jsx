import { useRef, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import plans from '../datas/Plans.js'

/* ═══════════════════════════════════════════════════════
   LOAD CLASSIFICATION
═══════════════════════════════════════════════════════ */
const LOAD = {
  high: {
    key: 'high',
    label: 'Structural / Load-Bearing',
    color: '#ef4444',
    emissive: '#7f1d1d',
    wallH: 3.2,
    wallThick: 0.28,
    dotColor: '#fca5a5',
  },
  medium: {
    key: 'medium',
    label: 'Semi Load-Bearing',
    color: '#f59e0b',
    emissive: '#78350f',
    wallH: 3.0,
    wallThick: 0.20,
    dotColor: '#fcd34d',
  },
  low: {
    key: 'low',
    label: 'Partition / Non-Structural',
    color: '#22c55e',
    emissive: '#14532d',
    wallH: 2.7,
    wallThick: 0.13,
    dotColor: '#86efac',
  },
}

const LOAD_SHORT = { high: 'STRUCTURAL', medium: 'SEMI-LOAD', low: 'PARTITION' }

const classifyWall = (wall, minX, maxX, minY, maxY) => {
  const { x1, y1, x2, y2 } = wall
  const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
  const tol = 14
  const onBoundary =
    Math.min(Math.abs(x1 - minX), Math.abs(x2 - minX)) < tol ||
    Math.min(Math.abs(x1 - maxX), Math.abs(x2 - maxX)) < tol ||
    Math.min(Math.abs(y1 - minY), Math.abs(y2 - minY)) < tol ||
    Math.min(Math.abs(y1 - maxY), Math.abs(y2 - maxY)) < tol
  if (onBoundary) return LOAD.high
  if (len >= 80)  return LOAD.medium
  return LOAD.low
}

/* ═══════════════════════════════════════════════════════
   ROOM METADATA
═══════════════════════════════════════════════════════ */
const ROOM_META = {
  living:   { icon: '🛋', color: '#60a5fa', glow: '#1d4ed8' },
  bedroom:  { icon: '🛏', color: '#c084fc', glow: '#7e22ce' },
  kitchen:  { icon: '🍳', color: '#fb923c', glow: '#c2410c' },
  bathroom: { icon: '🚿', color: '#22d3ee', glow: '#0e7490' },
  entrance: { icon: '🚪', color: '#4ade80', glow: '#166534' },
  dining:   { icon: '🍽', color: '#f97316', glow: '#9a3412' },
  utility:  { icon: '🔧', color: '#94a3b8', glow: '#334155' },
  default:  { icon: '📐', color: '#a78bfa', glow: '#4c1d95' },
}

const getRoomMeta = (type) => ROOM_META[type] || ROOM_META.default

/**
 * Spread rooms evenly across the floor plan bounding box.
 * Returns each room enriched with its approximate 3-D centre (world space).
 */
const assignRoomPositions = (rooms, minX, maxX, minY, maxY, scale, offsetX, offsetZ) => {
  const cols  = rooms.length <= 3 ? 1 : rooms.length <= 6 ? 2 : 3
  const rows  = Math.ceil(rooms.length / cols)
  const cellW = (maxX - minX) / cols
  const cellH = (maxY - minY) / rows

  return rooms.map((room, i) => {
    const col    = i % cols
    const row    = Math.floor(i / cols)
    const worldX = (minX + cellW * (col + 0.5)) * scale - offsetX
    const worldZ = (minY + cellH * (row + 0.5)) * scale - offsetZ
    return { ...room, worldX, worldZ, cellW: cellW * scale, cellH: cellH * scale }
  })
}

/* ═══════════════════════════════════════════════════════
   3-D: PULSING DOT
═══════════════════════════════════════════════════════ */
const PulsingDot = ({ position, color }) => {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (ref.current) ref.current.scale.setScalar(1 + 0.25 * Math.sin(clock.getElapsedTime() * 3))
  })
  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.07, 8, 8]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.2} toneMapped={false} />
    </mesh>
  )
}

/* ═══════════════════════════════════════════════════════
   3-D: HTML LABELS
═══════════════════════════════════════════════════════ */
const CoordLabel = ({ position, text, color }) => (
  <Html position={position} style={{ pointerEvents: 'none' }}>
    <div style={{
      background: 'rgba(8,13,24,0.88)', border: `1px solid ${color}`,
      borderRadius: 5, padding: '2px 6px', fontSize: 9,
      fontFamily: 'DM Mono, monospace', color, whiteSpace: 'nowrap',
      letterSpacing: '0.04em', transform: 'translate(-50%,-130%)', backdropFilter: 'blur(4px)',
    }}>
      {text}
    </div>
  </Html>
)

const WallNameLabel = ({ position, name, loadLabel, color }) => (
  <Html position={position} style={{ pointerEvents: 'none' }}>
    <div style={{
      background: 'rgba(8,13,24,0.92)', border: `1px solid ${color}`,
      borderRadius: 7, padding: '4px 9px', display: 'flex',
      flexDirection: 'column', alignItems: 'center', gap: 1,
      transform: 'translate(-50%,-110%)', backdropFilter: 'blur(6px)',
      boxShadow: `0 0 10px ${color}44`, whiteSpace: 'nowrap',
    }}>
      <span style={{ fontSize: 11, fontFamily: 'Outfit, sans-serif', fontWeight: 700, color, letterSpacing: '0.06em' }}>{name}</span>
      <span style={{ fontSize: 8, fontFamily: 'DM Mono, monospace', color: `${color}bb`, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{loadLabel}</span>
    </div>
  </Html>
)

/* ═══════════════════════════════════════════════════════
   3-D: WALL MESH
═══════════════════════════════════════════════════════ */
const Wall = ({ wall, index, load, scale, showCoords, showNames }) => {
  const { x1, y1, x2, y2 } = wall
  const length  = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
  const angle   = Math.atan2(y2 - y1, x2 - x1)
  const cx      = (x1 + x2) / 2
  const cy      = (y1 + y2) / 2
  const { color, emissive, wallH, wallThick, dotColor } = load

  const p1      = [x1 * scale, wallH * 0.6, y1 * scale]
  const p2      = [x2 * scale, wallH * 0.6, y2 * scale]
  const pCenter = [cx * scale, wallH + 0.35, cy * scale]
  const wallId  = `W-${String(index + 1).padStart(2, '0')}`

  return (
    <group>
      <mesh position={[cx * scale, wallH / 2, cy * scale]} rotation={[0, -angle, 0]} castShadow receiveShadow>
        <boxGeometry args={[length * scale, wallH, wallThick]} />
        <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.35} roughness={0.65} metalness={0.08} />
      </mesh>

      <PulsingDot position={p1} color={dotColor} />
      <PulsingDot position={p2} color={dotColor} />

      {showCoords && (
        <>
          <CoordLabel position={p1} text={`(${x1}, ${y1})`} color={dotColor} />
          <CoordLabel position={p2} text={`(${x2}, ${y2})`} color={dotColor} />
        </>
      )}

      {showNames && (
        <WallNameLabel position={pCenter} name={wallId} loadLabel={LOAD_SHORT[load.key]} color={color} />
      )}
    </group>
  )
}

/* ═══════════════════════════════════════════════════════
   3-D: ROOM FLOOR HIGHLIGHT + FLOATING LABEL
═══════════════════════════════════════════════════════ */
const RoomHighlight = ({ room }) => {
  const ref  = useRef()
  const meta = getRoomMeta(room.type)

  useFrame(({ clock }) => {
    if (ref.current)
      ref.current.material.opacity = 0.11 + 0.06 * Math.sin(clock.getElapsedTime() * 2)
  })

  return (
    <group>
      <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[room.worldX, 0.03, room.worldZ]}>
        <planeGeometry args={[room.cellW * 0.88, room.cellH * 0.88]} />
        <meshStandardMaterial color={meta.color} emissive={meta.color} emissiveIntensity={0.4} transparent opacity={0.13} />
      </mesh>

      <Html position={[room.worldX, 0.6, room.worldZ]} style={{ pointerEvents: 'none' }}>
        <div style={{
          background: 'rgba(8,13,24,0.92)', border: `1.5px solid ${meta.color}`,
          borderRadius: 10, padding: '6px 14px',
          display: 'flex', alignItems: 'center', gap: 7,
          transform: 'translate(-50%,-50%)', backdropFilter: 'blur(8px)',
          boxShadow: `0 0 18px ${meta.color}55`, whiteSpace: 'nowrap',
        }}>
          <span style={{ fontSize: 16 }}>{meta.icon}</span>
          <span style={{ fontSize: 12, fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: meta.color, letterSpacing: '0.04em' }}>
            {room.name}
          </span>
        </div>
      </Html>
    </group>
  )
}

/* ═══════════════════════════════════════════════════════
   3-D: CAMERA RIG — smooth fly-to
═══════════════════════════════════════════════════════ */
const CameraRig = ({ goal, controlsRef }) => {
  const { camera } = useThree()
  useFrame(() => {
    if (!goal || !controlsRef.current) return
    const { px, py, pz, tx, ty, tz } = goal
    const s = 0.055
    camera.position.x += (px - camera.position.x) * s
    camera.position.y += (py - camera.position.y) * s
    camera.position.z += (pz - camera.position.z) * s
    controlsRef.current.target.x += (tx - controlsRef.current.target.x) * s
    controlsRef.current.target.y += (ty - controlsRef.current.target.y) * s
    controlsRef.current.target.z += (tz - controlsRef.current.target.z) * s
    controlsRef.current.update()
  })
  return null
}

/* ═══════════════════════════════════════════════════════
   3-D: SCENE PRIMITIVES
═══════════════════════════════════════════════════════ */
const Floor     = ({ w, h }) => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
    <planeGeometry args={[w, h]} />
    <meshStandardMaterial color="#0e1e20" roughness={0.9} metalness={0.05} />
  </mesh>
)
const FloorGrid = ({ w, h }) => (
  <gridHelper args={[Math.max(w, h) * 1.1, 20, '#112828', '#0d2020']} position={[0, 0.01, 0]} />
)
const CeilingHint = ({ w, h }) => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 3.2, 0]}>
    <planeGeometry args={[w, h]} />
    <meshStandardMaterial color="#0c1a1c" roughness={1} transparent opacity={0.15} side={2} />
  </mesh>
)
const Lighting = () => (
  <>
    <ambientLight intensity={0.5} color="#b0d8dc" />
    <directionalLight position={[12, 16, 10]} intensity={1.3} color="#fde8c8" castShadow
      shadow-mapSize-width={1024} shadow-mapSize-height={1024}
      shadow-camera-far={60} shadow-camera-left={-20} shadow-camera-right={20}
      shadow-camera-top={20} shadow-camera-bottom={-20} />
    <directionalLight position={[-8, 10, -6]} intensity={0.35} color="#88c4ca" />
    <pointLight position={[0, 6, 0]} intensity={0.25} color="#22d3ee" distance={20} />
  </>
)

/* ═══════════════════════════════════════════════════════
   UI: LOAD LEGEND
═══════════════════════════════════════════════════════ */
const LoadLegend = ({ counts }) => (
  <div style={{
    position: 'absolute', top: 16, left: 16, zIndex: 10,
    background: 'rgba(8,13,24,0.82)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12, padding: '10px 14px', backdropFilter: 'blur(10px)', minWidth: 210,
  }}>
    <div style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#4b6e70', fontFamily: 'DM Mono, monospace', marginBottom: 8 }}>
      Wall Load Classification
    </div>
    {Object.values(LOAD).map(({ key, label, color, dotColor }) => (
      <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: dotColor, boxShadow: `0 0 6px ${dotColor}`, flexShrink: 0 }} />
        <div style={{ flex: 1, fontSize: 11, fontFamily: 'Outfit, sans-serif', fontWeight: 600, color }}>{label}</div>
        <div style={{ fontSize: 10, fontFamily: 'DM Mono, monospace', color: '#4b6e70' }}>{counts[key] ?? 0}</div>
      </div>
    ))}
  </div>
)

/* ═══════════════════════════════════════════════════════
   UI: TOGGLE PILLS
═══════════════════════════════════════════════════════ */
const TogglePill = ({ active, onToggle, activeColor, label, activeLabel }) => (
  <button onClick={onToggle} style={{
    background: active ? `${activeColor}22` : 'rgba(8,13,24,0.82)',
    border: `1px solid ${active ? `${activeColor}88` : 'rgba(255,255,255,0.08)'}`,
    borderRadius: 10, padding: '7px 13px', backdropFilter: 'blur(10px)',
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
    transition: 'all 0.2s', width: '100%',
  }}>
    <div style={{ width: 7, height: 7, borderRadius: '50%', background: active ? activeColor : '#4b6e70', boxShadow: active ? `0 0 6px ${activeColor}` : 'none', flexShrink: 0 }} />
    <span style={{ fontSize: 10, fontFamily: 'DM Mono, monospace', letterSpacing: '0.08em', color: active ? activeColor : '#4b6e70' }}>
      {active ? activeLabel : label}
    </span>
  </button>
)

const OverlayToggles = ({ showCoords, onToggleCoords, showNames, onToggleNames }) => (
  <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 148 }}>
    <TogglePill active={showNames}  onToggle={onToggleNames}  activeColor="#c084fc" label="SHOW NAMES"  activeLabel="NAMES ON"  />
    <TogglePill active={showCoords} onToggle={onToggleCoords} activeColor="#22c55e" label="SHOW COORDS" activeLabel="COORDS ON" />
  </div>
)

/* ═══════════════════════════════════════════════════════
   UI: ROOM NAV STRIP
═══════════════════════════════════════════════════════ */
const RoomNav = ({ rooms, activeIdx, onSelect, onOverview }) => (
  <div style={{
    borderBottom: '1px solid var(--border)',
    padding: '10px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    overflowX: 'auto',
    scrollbarWidth: 'none',
    background: 'rgba(8,13,24,0.4)',
  }}>
    {/* Section label */}
    <span style={{ fontSize: 9, fontFamily: 'DM Mono, monospace', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#4b6e70', flexShrink: 0, marginRight: 4 }}>
      Navigate
    </span>

    {/* Overview */}
    <button onClick={onOverview} style={{
      flexShrink: 0,
      background: activeIdx === null ? 'rgba(17,100,102,0.28)' : 'rgba(17,100,102,0.07)',
      border: `1px solid ${activeIdx === null ? 'rgba(17,100,102,0.65)' : 'rgba(17,100,102,0.2)'}`,
      borderRadius: 10, padding: '6px 13px', cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s',
      boxShadow: activeIdx === null ? '0 0 10px rgba(17,100,102,0.25)' : 'none',
    }}>
      <span style={{ fontSize: 13 }}>🏠</span>
      <span style={{ fontSize: 11, fontFamily: 'Outfit, sans-serif', fontWeight: 600, color: activeIdx === null ? 'var(--teal-light)' : 'var(--text-muted)', letterSpacing: '0.02em' }}>
        Overview
      </span>
    </button>

    <div style={{ width: 1, height: 26, background: 'var(--border)', flexShrink: 0 }} />

    {/* Room buttons */}
    {rooms.map((room, i) => {
      const meta   = getRoomMeta(room.type)
      const active = activeIdx === i
      return (
        <button key={i} onClick={() => onSelect(i)} style={{
          flexShrink: 0,
          background: active ? `${meta.color}20` : 'rgba(255,255,255,0.03)',
          border: `1px solid ${active ? `${meta.color}70` : 'rgba(255,255,255,0.07)'}`,
          borderRadius: 10, padding: '6px 13px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s',
          boxShadow: active ? `0 0 12px ${meta.color}33` : 'none',
        }}>
          <span style={{ fontSize: 14 }}>{meta.icon}</span>
          <span style={{ fontSize: 11, fontFamily: 'Outfit, sans-serif', fontWeight: 600, color: active ? meta.color : 'var(--text-muted)', letterSpacing: '0.02em' }}>
            {room.name}
          </span>
          {active && <div style={{ width: 5, height: 5, borderRadius: '50%', background: meta.color, boxShadow: `0 0 5px ${meta.color}`, marginLeft: 2 }} />}
        </button>
      )
    })}
  </div>
)

/* ═══════════════════════════════════════════════════════
   MAIN EXPORT
═══════════════════════════════════════════════════════ */
const ThreeDViewer = ({ walls, plan }) => {
  const [showCoords,    setShowCoords]    = useState(false)
  const [showNames,     setShowNames]     = useState(false)
  const [activeRoomIdx, setActiveRoomIdx] = useState(null)
  const [cameraGoal,    setCameraGoal]    = useState(null)
  const controlsRef = useRef()

  useEffect(() => { setActiveRoomIdx(null); setCameraGoal(null) }, [walls])

  /* ── Empty state ── */
  if (!walls || walls.length === 0) {
    return (
      <section id="threedmodel" className="glass rounded-2xl overflow-hidden mb-6" style={{ minHeight: 160 }}>
        <div className="px-8 py-5 flex items-center gap-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(17,100,102,0.15)', border: '1px solid rgba(17,100,102,0.3)' }}>
            <span style={{ fontSize: 16, color: 'var(--teal-light)' }}>◈</span>
          </div>
          <div>
            <div className="section-label">Step 2</div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 20, color: 'var(--gold)', margin: 0 }}>3D Model</h2>
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

  /* ── Bounds ── */
  const allX    = walls.flatMap(w => [w.x1, w.x2])
  const allY    = walls.flatMap(w => [w.y1, w.y2])
  const minX    = Math.min(...allX), maxX = Math.max(...allX)
  const minY    = Math.min(...allY), maxY = Math.max(...allY)
  const centerX = (minX + maxX) / 2
  const centerY = (minY + maxY) / 2
  const scale   = 0.05
  const floorW  = (maxX - minX) * scale + 3
  const floorH  = (maxY - minY) * scale + 3
  const offsetX = centerX * scale
  const offsetZ = centerY * scale

  /* ── Classify ── */
  const classified = walls.map(w => ({ wall: w, load: classifyWall(w, minX, maxX, minY, maxY) }))
  const counts = { high: 0, medium: 0, low: 0 }
  classified.forEach(({ load }) => counts[load.key]++)

  /* ── Rooms ── */
  const planRooms    = plan && plans[plan]?.rooms ? plans[plan].rooms : []
  const roomsWithPos = assignRoomPositions(planRooms, minX, maxX, minY, maxY, scale, offsetX, offsetZ)

  /* ── Camera goals ── */
  const defaultGoal = { px: floorW * 0.9, py: floorH * 1.1, pz: floorW * 0.9, tx: 0, ty: 0, tz: 0 }

  const handleRoomSelect = (i) => {
    setActiveRoomIdx(i)
    const r = roomsWithPos[i]
    const dist = Math.max(r.cellW, r.cellH) * 0.9 + 2.5
    setCameraGoal({ px: r.worldX + dist * 0.7, py: 3.8, pz: r.worldZ + dist * 0.7, tx: r.worldX, ty: 0, tz: r.worldZ })
  }

  const handleOverview = () => { setActiveRoomIdx(null); setCameraGoal(defaultGoal) }

  const activeRoom = activeRoomIdx !== null ? roomsWithPos[activeRoomIdx] : null

  return (
    <section id="threedmodel" className="glass rounded-2xl overflow-hidden mb-6 animate-fadeIn">

      {/* Header */}
      <div className="px-8 py-5 flex items-center justify-between" style={{ borderBottom: planRooms.length > 0 ? 'none' : '1px solid var(--border)' }}>
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center animate-glow"
            style={{ background: 'rgba(17,100,102,0.25)', border: '1px solid rgba(17,100,102,0.5)' }}>
            <span style={{ fontSize: 16, color: 'var(--cyan)' }}>◈</span>
          </div>
          <div>
            <div className="section-label">Step 2</div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 20, color: 'var(--gold)', margin: 0 }}>3D Model</h2>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <div style={{ display: 'flex', gap: 6 }}>
            {Object.values(LOAD).map(({ key, dotColor }) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, boxShadow: `0 0 4px ${dotColor}` }} />
                <span style={{ fontSize: 10, fontFamily: 'DM Mono, monospace', color: dotColor }}>{counts[key]}</span>
              </div>
            ))}
          </div>
          <span className="tag tag-teal">{walls.length} walls</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>Three.js · WebGL</span>
        </div>
      </div>

      {/* Room Navigation */}
      {planRooms.length > 0 && (
        <RoomNav rooms={planRooms} activeIdx={activeRoomIdx} onSelect={handleRoomSelect} onOverview={handleOverview} />
      )}

      {/* Canvas */}
      <div style={{ background: 'linear-gradient(180deg,#080d18 0%,#0a1320 100%)', position: 'relative' }}>
        <LoadLegend counts={counts} />
        <OverlayToggles
          showCoords={showCoords} onToggleCoords={() => setShowCoords(v => !v)}
          showNames={showNames}   onToggleNames={() => setShowNames(v => !v)}
        />

        {/* Active room badge */}
        {activeRoom && (() => {
          const meta = getRoomMeta(activeRoom.type)
          return (
            <div style={{
              position: 'absolute', bottom: 48, left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(8,13,24,0.9)', border: `1px solid ${meta.color}66`,
              borderRadius: 100, padding: '5px 18px', zIndex: 10,
              display: 'flex', alignItems: 'center', gap: 8, backdropFilter: 'blur(8px)',
              boxShadow: `0 0 18px ${meta.color}33`, whiteSpace: 'nowrap',
            }}>
              <span style={{ fontSize: 14 }}>{meta.icon}</span>
              <span style={{ fontSize: 11, fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: meta.color }}>{activeRoom.name}</span>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: meta.color, boxShadow: `0 0 5px ${meta.color}` }} />
            </div>
          )
        })()}

        <div style={{ height: 540, width: '100%' }}>
          <Canvas shadows camera={{ position: [floorW * 0.9, floorH * 1.1, floorW * 0.9], fov: 55 }} gl={{ antialias: true }}>
            <color attach="background" args={['#080d18']} />
            <fog attach="fog" args={['#080d18', 22, 65]} />

            <Lighting />
            <CameraRig goal={cameraGoal} controlsRef={controlsRef} />

            {/* Walls (in local space) */}
            <group position={[-offsetX, 0, -offsetZ]}>
              {classified.map(({ wall, load }, i) => (
                <Wall key={i} index={i} wall={wall} load={load} scale={scale} showCoords={showCoords} showNames={showNames} />
              ))}
            </group>

            {/* Room highlight (world space) */}
            {activeRoom && <RoomHighlight room={activeRoom} />}

            <Floor w={floorW} h={floorH} />
            <FloorGrid w={floorW} h={floorH} />
            <CeilingHint w={floorW * 0.95} h={floorH * 0.95} />

            <OrbitControls
              ref={controlsRef}
              enableDamping dampingFactor={0.08}
              minDistance={2} maxDistance={50}
              maxPolarAngle={Math.PI / 2.1}
              autoRotate={activeRoomIdx === null}
              autoRotateSpeed={0.4}
            />
          </Canvas>
        </div>

        {/* Hint bar */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none" style={{
          background: 'rgba(10,14,26,0.75)', backdropFilter: 'blur(8px)',
          border: '1px solid var(--border)', borderRadius: 100,
          padding: '6px 16px', fontSize: 11, color: 'var(--text-muted)',
          fontFamily: 'DM Mono, monospace', letterSpacing: '0.08em', whiteSpace: 'nowrap',
        }}>
          {activeRoomIdx !== null
            ? 'Drag to explore · Click Overview to return'
            : 'Click a room above to fly there · Drag to rotate'}
        </div>
      </div>
    </section>
  )
}

export default ThreeDViewer
