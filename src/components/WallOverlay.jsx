import { useEffect, useRef } from 'react'

/**
 * Draws detected wall lines on top of the uploaded floor plan image.
 * Wall coordinate data comes from props — NO logic changed.
 */
const WallOverlay = ({ walls, imageSrc, width = 480, height = 360 }) => {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!walls || !imageSrc || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')
    canvas.width  = width
    canvas.height = height

    const img = new Image()
    img.onload = () => {
      // Draw image scaled to canvas
      ctx.drawImage(img, 0, 0, width, height)

      // Compute wall coordinate bounds for normalizing to canvas
      const allX = walls.flatMap(w => [w.x1, w.x2])
      const allY = walls.flatMap(w => [w.y1, w.y2])
      const minX = Math.min(...allX), maxX = Math.max(...allX)
      const minY = Math.min(...allY), maxY = Math.max(...allY)
      const rangeX = maxX - minX || 1
      const rangeY = maxY - minY || 1

      const pad = 24
      const mapX = (x) => pad + ((x - minX) / rangeX) * (width  - pad * 2)
      const mapY = (y) => pad + ((y - minY) / rangeY) * (height - pad * 2)

      // Classify outer walls
      const isOuter = (w) =>
        Math.abs(w.x1 - minX) < 10 || Math.abs(w.x1 - maxX) < 10 ||
        Math.abs(w.y1 - minY) < 10 || Math.abs(w.y1 - maxY) < 10

      // Draw walls
      walls.forEach((wall) => {
        const outer = isOuter(wall)
        const x1 = mapX(wall.x1), y1 = mapY(wall.y1)
        const x2 = mapX(wall.x2), y2 = mapY(wall.y2)

        // Glow shadow
        ctx.shadowColor  = outer ? 'rgba(139,92,246,0.8)' : 'rgba(59,130,246,0.7)'
        ctx.shadowBlur   = outer ? 10 : 7

        // Wall line
        ctx.beginPath()
        ctx.moveTo(x1, y1); ctx.lineTo(x2, y2)
        ctx.strokeStyle = outer ? '#a78bfa' : '#60a5fa'
        ctx.lineWidth   = outer ? 2.5 : 1.8
        ctx.lineCap     = 'round'
        ctx.stroke()

        ctx.shadowBlur = 0

        // Length label
        const midX = (x1 + x2) / 2
        const midY = (y1 + y2) / 2
        const len  = Math.round(Math.sqrt((wall.x2 - wall.x1) ** 2 + (wall.y2 - wall.y1) ** 2))

        // Badge background
        const label = `${len}px`
        ctx.font = '500 9px Inter, sans-serif'
        const tw = ctx.measureText(label).width
        const bw = tw + 10, bh = 14
        const bx = midX - bw / 2, by = midY - bh / 2

        ctx.fillStyle   = outer ? 'rgba(139,92,246,0.85)' : 'rgba(59,130,246,0.85)'
        ctx.strokeStyle = 'rgba(255,255,255,0.15)'
        ctx.lineWidth   = 0.5
        const br = 3
        ctx.beginPath()
        ctx.moveTo(bx + br, by)
        ctx.lineTo(bx + bw - br, by)
        ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + br)
        ctx.lineTo(bx + bw, by + bh - br)
        ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - br, by + bh)
        ctx.lineTo(bx + br, by + bh)
        ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - br)
        ctx.lineTo(bx, by + br)
        ctx.quadraticCurveTo(bx, by, bx + br, by)
        ctx.closePath()
        ctx.fill(); ctx.stroke()

        ctx.fillStyle   = 'rgba(255,255,255,0.95)'
        ctx.textAlign   = 'center'
        ctx.textBaseline= 'middle'
        ctx.fillText(label, midX, midY + 0.5)
      })

      // End-point dots
      walls.forEach((wall) => {
        [[wall.x1, wall.y1], [wall.x2, wall.y2]].forEach(([x, y]) => {
          ctx.beginPath()
          ctx.arc(mapX(x), mapY(y), 3, 0, Math.PI * 2)
          ctx.fillStyle   = 'rgba(255,255,255,0.7)'
          ctx.shadowColor = 'rgba(59,130,246,0.9)'
          ctx.shadowBlur  = 6
          ctx.fill()
          ctx.shadowBlur  = 0
        })
      })
    }
    img.src = imageSrc
  }, [walls, imageSrc, width, height])

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', display: 'block', borderRadius: 10 }}
    />
  )
}

export default WallOverlay
