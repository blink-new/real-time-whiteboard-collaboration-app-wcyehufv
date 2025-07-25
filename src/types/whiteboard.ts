export interface Point {
  x: number
  y: number
}

export interface DrawingPath {
  id: string
  points: Point[]
  color: string
  size: number
  tool: DrawingTool
  userId: string
  timestamp: number
}

export interface TextElement {
  id: string
  x: number
  y: number
  text: string
  color: string
  fontSize: number
  userId: string
  timestamp: number
  isEditing?: boolean
}

export interface ShapeElement {
  id: string
  type: 'rectangle' | 'circle' | 'line'
  startX: number
  startY: number
  endX: number
  endY: number
  color: string
  size: number
  userId: string
  timestamp: number
  filled?: boolean
}

export type DrawingTool = 'pen' | 'eraser' | 'rectangle' | 'circle' | 'line' | 'text' | 'select'

export interface UserCursor {
  userId: string
  x: number
  y: number
  name: string
  color: string
}

export interface WhiteboardState {
  paths: DrawingPath[]
  texts: TextElement[]
  shapes: ShapeElement[]
}

export interface WhiteboardHistory {
  states: WhiteboardState[]
  currentIndex: number
}

export interface User {
  id: string
  email: string
  displayName?: string
}

export interface Layer {
  id: string
  name: string
  visible: boolean
  locked: boolean
  opacity: number
  elements: (DrawingPath | TextElement | ShapeElement)[]
}