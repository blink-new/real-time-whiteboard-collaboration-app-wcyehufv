import React, { useRef, useEffect, useState, useCallback } from 'react'
import { blink } from '../blink/client'
import { DrawingTool, Point, DrawingPath, UserCursor, WhiteboardState, User, TextElement, ShapeElement, WhiteboardHistory } from '../types/whiteboard'
import { Toolbar } from './Toolbar'
import { UserCursors } from './UserCursors'
import { UserPresence } from './UserPresence'
import { TextEditor } from './TextEditor'
import { LayerPanel } from './LayerPanel'

export const Whiteboard: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<Point | null>(null)
  const [currentTool, setCurrentTool] = useState<DrawingTool>('pen')
  const [currentColor, setCurrentColor] = useState('#2563EB')
  const [currentSize, setCurrentSize] = useState(3)
  const [currentPath, setCurrentPath] = useState<Point[]>([])
  const [whiteboardState, setWhiteboardState] = useState<WhiteboardState>({
    paths: [],
    texts: [],
    shapes: []
  })
  const [history, setHistory] = useState<WhiteboardHistory>({
    states: [{ paths: [], texts: [], shapes: [] }],
    currentIndex: 0
  })
  const [userCursors, setUserCursors] = useState<UserCursor[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [onlineUsers, setOnlineUsers] = useState<any[]>([])
  const [zoom, setZoom] = useState(1)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [editingText, setEditingText] = useState<TextElement | null>(null)
  const [showLayers, setShowLayers] = useState(false)

  // Generate consistent color for user
  const generateUserColor = useCallback((userId: string) => {
    const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16']
    const hash = userId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    return colors[Math.abs(hash) % colors.length]
  }, [])

  // History management
  const saveToHistory = useCallback((newState: WhiteboardState) => {
    setHistory(prev => {
      const newStates = prev.states.slice(0, prev.currentIndex + 1)
      newStates.push(newState)
      
      // Limit history to 50 states
      if (newStates.length > 50) {
        newStates.shift()
        return {
          states: newStates,
          currentIndex: newStates.length - 1
        }
      }
      
      return {
        states: newStates,
        currentIndex: newStates.length - 1
      }
    })
  }, [])

  const undo = useCallback(() => {
    setHistory(prev => {
      if (prev.currentIndex > 0) {
        const newIndex = prev.currentIndex - 1
        setWhiteboardState(prev.states[newIndex])
        return { ...prev, currentIndex: newIndex }
      }
      return prev
    })
  }, [])

  const redo = useCallback(() => {
    setHistory(prev => {
      if (prev.currentIndex < prev.states.length - 1) {
        const newIndex = prev.currentIndex + 1
        setWhiteboardState(prev.states[newIndex])
        return { ...prev, currentIndex: newIndex }
      }
      return prev
    })
  }, [])

  // Canvas drawing functions
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !canvas) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }, [])

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) return

    clearCanvas()

    ctx.save()
    ctx.scale(zoom, zoom)
    ctx.translate(panOffset.x / zoom, panOffset.y / zoom)

    // Draw all shapes
    whiteboardState.shapes.forEach(shape => {
      ctx.strokeStyle = shape.color
      ctx.lineWidth = shape.size
      ctx.lineCap = 'round'

      ctx.beginPath()
      
      if (shape.type === 'rectangle') {
        const width = shape.endX - shape.startX
        const height = shape.endY - shape.startY
        ctx.rect(shape.startX, shape.startY, width, height)
      } else if (shape.type === 'circle') {
        const centerX = (shape.startX + shape.endX) / 2
        const centerY = (shape.startY + shape.endY) / 2
        const radius = Math.sqrt(
          Math.pow(shape.endX - shape.startX, 2) + Math.pow(shape.endY - shape.startY, 2)
        ) / 2
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
      } else if (shape.type === 'line') {
        ctx.moveTo(shape.startX, shape.startY)
        ctx.lineTo(shape.endX, shape.endY)
      }
      
      ctx.stroke()
    })

    // Draw all paths
    whiteboardState.paths.forEach(path => {
      if (path.points.length < 2) return

      ctx.strokeStyle = path.color
      ctx.lineWidth = path.size
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      ctx.beginPath()
      ctx.moveTo(path.points[0].x, path.points[0].y)
      
      for (let i = 1; i < path.points.length; i++) {
        ctx.lineTo(path.points[i].x, path.points[i].y)
      }
      
      ctx.stroke()
    })

    // Draw all texts
    whiteboardState.texts.forEach(text => {
      if (text.id === editingText?.id) return // Skip if currently editing
      
      ctx.fillStyle = text.color
      ctx.font = `${text.fontSize}px Inter, sans-serif`
      ctx.fillText(text.text, text.x, text.y)
    })

    ctx.restore()
  }, [whiteboardState, zoom, panOffset, clearCanvas, editingText])

  const getCanvasPoint = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

    return {
      x: (clientX - rect.left - panOffset.x) / zoom,
      y: (clientY - rect.top - panOffset.y) / zoom
    }
  }, [zoom, panOffset])

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const point = getCanvasPoint(e)

    if (currentTool === 'text') {
      // Create new text element
      const textElement: TextElement = {
        id: `text_${Date.now()}_${Math.random()}`,
        x: point.x,
        y: point.y,
        text: '',
        color: currentColor,
        fontSize: currentSize * 4,
        userId: user?.id || 'anonymous',
        timestamp: Date.now(),
        isEditing: true
      }
      
      setEditingText(textElement)
      setWhiteboardState(prev => ({
        ...prev,
        texts: [...prev.texts, textElement]
      }))
      return
    }

    if (['rectangle', 'circle', 'line'].includes(currentTool)) {
      setIsDragging(true)
      setDragStart(point)
      return
    }

    setIsDrawing(true)
    setCurrentPath([point])
  }, [currentTool, getCanvasPoint, currentColor, currentSize, user?.id])

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const point = getCanvasPoint(e)

    if (isDragging && dragStart && ['rectangle', 'circle', 'line'].includes(currentTool)) {
      // Preview shape while dragging
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (!ctx) return

      redrawCanvas() // Clear and redraw existing content

      ctx.save()
      ctx.scale(zoom, zoom)
      ctx.translate(panOffset.x / zoom, panOffset.y / zoom)
      
      ctx.strokeStyle = currentColor
      ctx.lineWidth = currentSize
      ctx.lineCap = 'round'
      ctx.setLineDash([5, 5]) // Dashed preview

      ctx.beginPath()
      
      if (currentTool === 'rectangle') {
        const width = point.x - dragStart.x
        const height = point.y - dragStart.y
        ctx.rect(dragStart.x, dragStart.y, width, height)
      } else if (currentTool === 'circle') {
        const centerX = (dragStart.x + point.x) / 2
        const centerY = (dragStart.y + point.y) / 2
        const radius = Math.sqrt(
          Math.pow(point.x - dragStart.x, 2) + Math.pow(point.y - dragStart.y, 2)
        ) / 2
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
      } else if (currentTool === 'line') {
        ctx.moveTo(dragStart.x, dragStart.y)
        ctx.lineTo(point.x, point.y)
      }
      
      ctx.stroke()
      ctx.restore()
      return
    }

    if (!isDrawing || currentTool === 'text') return

    setCurrentPath(prev => [...prev, point])

    // Draw on canvas immediately for smooth experience
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || currentPath.length === 0) return

    ctx.save()
    ctx.scale(zoom, zoom)
    ctx.translate(panOffset.x / zoom, panOffset.y / zoom)
    
    ctx.strokeStyle = currentTool === 'eraser' ? '#FAFAFA' : currentColor
    ctx.lineWidth = currentSize
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    ctx.beginPath()
    const lastPoint = currentPath[currentPath.length - 2] || point
    ctx.moveTo(lastPoint.x, lastPoint.y)
    ctx.lineTo(point.x, point.y)
    ctx.stroke()
    
    ctx.restore()
  }, [isDrawing, isDragging, dragStart, currentTool, currentPath, currentColor, currentSize, zoom, panOffset, getCanvasPoint, redrawCanvas])

  const stopDrawing = useCallback(async () => {
    if (isDragging && dragStart && ['rectangle', 'circle', 'line'].includes(currentTool)) {
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const endPoint = {
        x: (rect.width / 2 - panOffset.x) / zoom, // This will be updated by the last mouse position
        y: (rect.height / 2 - panOffset.y) / zoom
      }

      // Get the actual end point from the last mouse position
      const lastMouseEvent = (window as any).lastMouseEvent
      if (lastMouseEvent) {
        const actualEndPoint = getCanvasPoint(lastMouseEvent)
        endPoint.x = actualEndPoint.x
        endPoint.y = actualEndPoint.y
      }

      const shapeData: ShapeElement = {
        id: `shape_${Date.now()}_${Math.random()}`,
        type: currentTool as 'rectangle' | 'circle' | 'line',
        startX: dragStart.x,
        startY: dragStart.y,
        endX: endPoint.x,
        endY: endPoint.y,
        color: currentColor,
        size: currentSize,
        userId: user?.id || 'anonymous',
        timestamp: Date.now()
      }

      const newState = {
        ...whiteboardState,
        shapes: [...whiteboardState.shapes, shapeData]
      }

      setWhiteboardState(newState)
      saveToHistory(newState)

      // Broadcast to other users
      await blink.realtime.publish('whiteboard-room', 'drawing-shape', shapeData)

      setIsDragging(false)
      setDragStart(null)
      return
    }

    if (!isDrawing || currentPath.length === 0) return

    const pathData: DrawingPath = {
      id: `path_${Date.now()}_${Math.random()}`,
      points: currentPath,
      color: currentTool === 'eraser' ? '#FAFAFA' : currentColor,
      size: currentSize,
      tool: currentTool,
      userId: user?.id || 'anonymous',
      timestamp: Date.now()
    }

    const newState = {
      ...whiteboardState,
      paths: [...whiteboardState.paths, pathData]
    }

    setWhiteboardState(newState)
    saveToHistory(newState)

    // Broadcast to other users
    await blink.realtime.publish('whiteboard-room', 'drawing-path', pathData)

    setIsDrawing(false)
    setCurrentPath([])
  }, [isDrawing, isDragging, dragStart, currentPath, currentTool, currentColor, currentSize, user?.id, whiteboardState, saveToHistory, getCanvasPoint, zoom, panOffset])

  // Store last mouse event for shape drawing
  const handleMouseMove = useCallback(async (e: React.MouseEvent) => {
    (window as any).lastMouseEvent = e
    
    const point = getCanvasPoint(e)
    
    // Broadcast cursor position
    await blink.realtime.publish('whiteboard-room', 'cursor-move', {
      x: point.x,
      y: point.y
    }, {
      userId: user?.id,
      metadata: { 
        displayName: user?.displayName || user?.email?.split('@')[0] || 'Anonymous',
        color: generateUserColor(user?.id || '')
      }
    })

    // Continue drawing if in drawing mode
    if (isDrawing || isDragging) {
      draw(e)
    }
  }, [getCanvasPoint, user, isDrawing, isDragging, draw, generateUserColor])

  const handleClearCanvas = useCallback(async () => {
    const newState = { paths: [], texts: [], shapes: [] }
    setWhiteboardState(newState)
    saveToHistory(newState)
    clearCanvas()
    await blink.realtime.publish('whiteboard-room', 'clear-canvas', {})
  }, [clearCanvas, saveToHistory])

  const handleTextSave = useCallback(async (textElement: TextElement) => {
    const newState = {
      ...whiteboardState,
      texts: whiteboardState.texts.map(t => 
        t.id === textElement.id ? { ...textElement, isEditing: false } : t
      )
    }
    
    setWhiteboardState(newState)
    saveToHistory(newState)
    setEditingText(null)
    
    // Broadcast to other users
    await blink.realtime.publish('whiteboard-room', 'text-update', textElement)
  }, [whiteboardState, saveToHistory])

  const handleTextCancel = useCallback(() => {
    if (editingText) {
      const newState = {
        ...whiteboardState,
        texts: whiteboardState.texts.filter(t => t.id !== editingText.id)
      }
      setWhiteboardState(newState)
    }
    setEditingText(null)
  }, [editingText, whiteboardState])

  const exportCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Create a temporary canvas with white background
    const tempCanvas = document.createElement('canvas')
    const tempCtx = tempCanvas.getContext('2d')
    if (!tempCtx) return

    tempCanvas.width = canvas.width
    tempCanvas.height = canvas.height

    // Fill with white background
    tempCtx.fillStyle = '#FFFFFF'
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)

    // Draw the whiteboard content
    tempCtx.drawImage(canvas, 0, 0)

    // Download the image
    const link = document.createElement('a')
    link.download = `whiteboard-${Date.now()}.png`
    link.href = tempCanvas.toDataURL()
    link.click()
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            e.preventDefault()
            if (e.shiftKey) {
              redo()
            } else {
              undo()
            }
            break
          case 'y':
            e.preventDefault()
            redo()
            break
          case 's':
            e.preventDefault()
            exportCanvas()
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo, exportCanvas])

  // Initialize auth and realtime
  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
    })
    return unsubscribe
  }, [])

  // Setup realtime collaboration
  useEffect(() => {
    if (!user?.id) return

    let channel: any = null

    const setupRealtime = async () => {
      channel = blink.realtime.channel('whiteboard-room')
      await channel.subscribe({
        userId: user.id,
        metadata: { 
          displayName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
          color: generateUserColor(user.id)
        }
      })

      // Listen for drawing events
      channel.onMessage((message: any) => {
        if (message.type === 'drawing-path') {
          setWhiteboardState(prev => {
            const newState = {
              ...prev,
              paths: [...prev.paths, message.data]
            }
            saveToHistory(newState)
            return newState
          })
        } else if (message.type === 'drawing-shape') {
          setWhiteboardState(prev => {
            const newState = {
              ...prev,
              shapes: [...prev.shapes, message.data]
            }
            saveToHistory(newState)
            return newState
          })
        } else if (message.type === 'text-update') {
          setWhiteboardState(prev => {
            const newState = {
              ...prev,
              texts: prev.texts.some(t => t.id === message.data.id)
                ? prev.texts.map(t => t.id === message.data.id ? message.data : t)
                : [...prev.texts, message.data]
            }
            saveToHistory(newState)
            return newState
          })
        } else if (message.type === 'cursor-move') {
          setUserCursors(prev => {
            const filtered = prev.filter(cursor => cursor.userId !== message.userId)
            return [...filtered, {
              userId: message.userId,
              x: message.data.x,
              y: message.data.y,
              name: message.metadata?.displayName || 'Anonymous',
              color: message.metadata?.color || '#666'
            }]
          })
        } else if (message.type === 'clear-canvas') {
          const newState = { paths: [], texts: [], shapes: [] }
          setWhiteboardState(newState)
          saveToHistory(newState)
          clearCanvas()
        }
      })

      // Listen for presence changes
      channel.onPresence((users: any[]) => {
        setOnlineUsers(users)
      })
    }

    setupRealtime().catch(console.error)

    return () => {
      channel?.unsubscribe()
    }
  }, [user?.id, user?.displayName, user?.email, generateUserColor, clearCanvas, saveToHistory])

  // Redraw when state changes
  useEffect(() => {
    redrawCanvas()
  }, [redrawCanvas])

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      redrawCanvas()
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [redrawCanvas])

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading whiteboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 whiteboard-canvas"
        onMouseDown={startDrawing}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />

      {/* User Cursors */}
      <UserCursors cursors={userCursors} currentUserId={user.id} />

      {/* Text Editor */}
      {editingText && (
        <TextEditor
          textElement={editingText}
          onSave={handleTextSave}
          onCancel={handleTextCancel}
          zoom={zoom}
          panOffset={panOffset}
        />
      )}

      {/* Floating Toolbar */}
      <Toolbar
        currentTool={currentTool}
        onToolChange={setCurrentTool}
        currentColor={currentColor}
        onColorChange={setCurrentColor}
        currentSize={currentSize}
        onSizeChange={setCurrentSize}
        onClearCanvas={handleClearCanvas}
        zoom={zoom}
        onZoomChange={setZoom}
        onUndo={undo}
        onRedo={redo}
        onExport={exportCanvas}
        onToggleLayers={() => setShowLayers(!showLayers)}
        canUndo={history.currentIndex > 0}
        canRedo={history.currentIndex < history.states.length - 1}
      />

      {/* Layer Panel */}
      {showLayers && (
        <LayerPanel
          whiteboardState={whiteboardState}
          onStateChange={setWhiteboardState}
          onClose={() => setShowLayers(false)}
        />
      )}

      {/* User Presence */}
      <UserPresence users={onlineUsers} />
    </div>
  )
}