import { RotateCcw, Save, Trash2, Undo2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type HandwritingCanvasProps = {
  value?: string
  onChange: (value?: string) => void
}

export function HandwritingCanvas({ value, onChange }: HandwritingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const isDrawingRef = useRef(false)
  const [history, setHistory] = useState<string[]>(value ? [value] : [])

  const fitCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const ratio = window.devicePixelRatio || 1
    const previous = canvas.toDataURL()
    canvas.width = Math.round(rect.width * ratio)
    canvas.height = Math.round(rect.height * ratio)
    const context = canvas.getContext('2d')
    if (!context) return
    context.scale(ratio, ratio)
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.lineWidth = 4
    context.strokeStyle = '#2f2a24'
    context.fillStyle = '#fffdf6'
    context.fillRect(0, 0, rect.width, rect.height)
    if (previous && previous.length > 100) drawImage(previous)
  }

  const drawImage = (source?: string) => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context || !source) return
    const image = new Image()
    image.onload = () => {
      const rect = canvas.getBoundingClientRect()
      context.fillStyle = '#fffdf6'
      context.fillRect(0, 0, rect.width, rect.height)
      context.drawImage(image, 0, 0, rect.width, rect.height)
    }
    image.src = source
  }

  useEffect(() => {
    fitCanvas()
    drawImage(value)
    const listener = () => fitCanvas()
    window.addEventListener('resize', listener)
    return () => window.removeEventListener('resize', listener)
    // Canvas sizing should run once and when the source value changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    const rect = canvas?.getBoundingClientRect()
    return {
      x: event.clientX - (rect?.left || 0),
      y: event.clientY - (rect?.top || 0),
    }
  }

  const start = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return
    isDrawingRef.current = true
    canvas.setPointerCapture(event.pointerId)
    const current = point(event)
    context.beginPath()
    context.moveTo(current.x, current.y)
  }

  const move = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return
    const context = canvasRef.current?.getContext('2d')
    if (!context) return
    const current = point(event)
    context.lineTo(current.x, current.y)
    context.stroke()
  }

  const end = () => {
    if (!isDrawingRef.current) return
    isDrawingRef.current = false
    const next = canvasRef.current?.toDataURL('image/png')
    if (!next) return
    setHistory((items) => [...items, next])
    onChange(next)
  }

  const clear = () => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return
    const rect = canvas.getBoundingClientRect()
    context.fillStyle = '#fffdf6'
    context.fillRect(0, 0, rect.width, rect.height)
    setHistory([])
    onChange(undefined)
  }

  const undo = () => {
    const nextHistory = history.slice(0, -1)
    const previous = nextHistory[nextHistory.length - 1]
    setHistory(nextHistory)
    if (previous) {
      drawImage(previous)
      onChange(previous)
    } else {
      clear()
    }
  }

  const save = () => {
    const next = canvasRef.current?.toDataURL('image/png')
    if (next) onChange(next)
  }

  return (
    <div className="space-y-3">
      <canvas
        ref={canvasRef}
        className="drawing-canvas"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
      />
      <div className="grid grid-cols-4 gap-2">
        <button className="btn px-2" type="button" onClick={undo} aria-label="Undo drawing">
          <Undo2 size={18} />
        </button>
        <button className="btn px-2" type="button" onClick={clear} aria-label="Clear drawing">
          <Trash2 size={18} />
        </button>
        <button className="btn px-2" type="button" onClick={() => drawImage(value)} aria-label="Restore saved drawing">
          <RotateCcw size={18} />
        </button>
        <button className="btn-primary px-2" type="button" onClick={save} aria-label="Save drawing">
          <Save size={18} />
        </button>
      </div>
    </div>
  )
}
