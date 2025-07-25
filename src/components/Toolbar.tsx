import React from 'react'
import { Button } from './ui/button'
import { Separator } from './ui/separator'
import { Slider } from './ui/slider'
import { 
  Pen, 
  Eraser, 
  Square, 
  Circle, 
  Minus, 
  Type, 
  Trash2, 
  ZoomIn, 
  ZoomOut,
  Download,
  Undo,
  Redo,
  Layers,
  MousePointer
} from 'lucide-react'
import { DrawingTool } from '../types/whiteboard'

interface ToolbarProps {
  currentTool: DrawingTool
  onToolChange: (tool: DrawingTool) => void
  currentColor: string
  onColorChange: (color: string) => void
  currentSize: number
  onSizeChange: (size: number) => void
  onClearCanvas: () => void
  zoom: number
  onZoomChange: (zoom: number) => void
  onUndo: () => void
  onRedo: () => void
  onExport: () => void
  onToggleLayers: () => void
  canUndo: boolean
  canRedo: boolean
}

const colors = [
  '#2563EB', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#000000', // Black
  '#6B7280', // Gray
]

export const Toolbar: React.FC<ToolbarProps> = ({
  currentTool,
  onToolChange,
  currentColor,
  onColorChange,
  currentSize,
  onSizeChange,
  onClearCanvas,
  zoom,
  onZoomChange,
  onUndo,
  onRedo,
  onExport,
  onToggleLayers,
  canUndo,
  canRedo,
}) => {
  const handleZoomIn = () => {
    onZoomChange(Math.min(zoom * 1.2, 3))
  }

  const handleZoomOut = () => {
    onZoomChange(Math.max(zoom / 1.2, 0.5))
  }

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="floating-toolbar rounded-xl shadow-lg p-4">
        <div className="flex items-center gap-2">
          {/* Selection Tool */}
          <div className="flex items-center gap-1">
            <Button
              variant={currentTool === 'select' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onToolChange('select')}
              className="h-10 w-10"
              title="Select (V)"
            >
              <MousePointer className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-8" />

          {/* Drawing Tools */}
          <div className="flex items-center gap-1">
            <Button
              variant={currentTool === 'pen' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onToolChange('pen')}
              className="h-10 w-10"
              title="Pen (P)"
            >
              <Pen className="h-4 w-4" />
            </Button>
            <Button
              variant={currentTool === 'eraser' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onToolChange('eraser')}
              className="h-10 w-10"
              title="Eraser (E)"
            >
              <Eraser className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-8" />

          {/* Shape Tools */}
          <div className="flex items-center gap-1">
            <Button
              variant={currentTool === 'rectangle' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onToolChange('rectangle')}
              className="h-10 w-10"
              title="Rectangle (R)"
            >
              <Square className="h-4 w-4" />
            </Button>
            <Button
              variant={currentTool === 'circle' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onToolChange('circle')}
              className="h-10 w-10"
              title="Circle (C)"
            >
              <Circle className="h-4 w-4" />
            </Button>
            <Button
              variant={currentTool === 'line' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onToolChange('line')}
              className="h-10 w-10"
              title="Line (L)"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              variant={currentTool === 'text' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onToolChange('text')}
              className="h-10 w-10"
              title="Text (T)"
            >
              <Type className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-8" />

          {/* Color Palette */}
          <div className="flex items-center gap-1">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => onColorChange(color)}
                className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                  currentColor === color 
                    ? 'border-primary shadow-md scale-110' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                style={{ backgroundColor: color }}
                title={`Color: ${color}`}
              />
            ))}
          </div>

          <Separator orientation="vertical" className="h-8" />

          {/* Brush Size */}
          <div className="flex items-center gap-2 min-w-[120px]">
            <span className="text-sm text-muted-foreground">Size:</span>
            <Slider
              value={[currentSize]}
              onValueChange={(value) => onSizeChange(value[0])}
              max={20}
              min={1}
              step={1}
              className="flex-1"
            />
            <span className="text-sm font-medium w-6 text-center">{currentSize}</span>
          </div>

          <Separator orientation="vertical" className="h-8" />

          {/* Undo/Redo */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onUndo}
              disabled={!canUndo}
              className="h-10 w-10"
              title="Undo (Ctrl+Z)"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRedo}
              disabled={!canRedo}
              className="h-10 w-10"
              title="Redo (Ctrl+Y)"
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-8" />

          {/* Zoom Controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              className="h-10 w-10"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[50px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              className="h-10 w-10"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-8" />

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleLayers}
              className="h-10 w-10"
              title="Layers"
            >
              <Layers className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onExport}
              className="h-10 w-10"
              title="Export (Ctrl+S)"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearCanvas}
              className="h-10 w-10 text-destructive hover:text-destructive"
              title="Clear Canvas"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}