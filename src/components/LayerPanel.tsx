import React, { useState } from 'react'
import { WhiteboardState, DrawingPath, TextElement, ShapeElement } from '../types/whiteboard'
import { Button } from './ui/button'
import { Separator } from './ui/separator'
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Trash2, 
  X,
  Pen,
  Type,
  Square,
  Circle,
  Minus
} from 'lucide-react'

interface LayerPanelProps {
  whiteboardState: WhiteboardState
  onStateChange: (state: WhiteboardState) => void
  onClose: () => void
}

type ElementType = 'path' | 'text' | 'shape'

interface LayerElement {
  id: string
  type: ElementType
  name: string
  visible: boolean
  locked: boolean
  element: DrawingPath | TextElement | ShapeElement
}

export const LayerPanel: React.FC<LayerPanelProps> = ({
  whiteboardState,
  onStateChange,
  onClose,
}) => {
  const [selectedElements, setSelectedElements] = useState<string[]>([])

  // Convert whiteboard state to layer elements
  const layerElements: LayerElement[] = [
    ...whiteboardState.paths.map((path, index) => ({
      id: path.id,
      type: 'path' as ElementType,
      name: `Drawing ${index + 1}`,
      visible: true,
      locked: false,
      element: path,
    })),
    ...whiteboardState.texts.map((text, index) => ({
      id: text.id,
      type: 'text' as ElementType,
      name: text.text || `Text ${index + 1}`,
      visible: true,
      locked: false,
      element: text,
    })),
    ...whiteboardState.shapes.map((shape, index) => ({
      id: shape.id,
      type: 'shape' as ElementType,
      name: `${shape.type.charAt(0).toUpperCase() + shape.type.slice(1)} ${index + 1}`,
      visible: true,
      locked: false,
      element: shape,
    })),
  ].sort((a, b) => b.element.timestamp - a.element.timestamp) // Most recent first

  const getElementIcon = (type: ElementType, element: any) => {
    switch (type) {
      case 'path':
        return <Pen className="h-4 w-4" />
      case 'text':
        return <Type className="h-4 w-4" />
      case 'shape':
        if (element.type === 'rectangle') return <Square className="h-4 w-4" />
        if (element.type === 'circle') return <Circle className="h-4 w-4" />
        if (element.type === 'line') return <Minus className="h-4 w-4" />
        return <Square className="h-4 w-4" />
      default:
        return <Square className="h-4 w-4" />
    }
  }

  const deleteElements = (elementIds: string[]) => {
    const newState = {
      paths: whiteboardState.paths.filter(p => !elementIds.includes(p.id)),
      texts: whiteboardState.texts.filter(t => !elementIds.includes(t.id)),
      shapes: whiteboardState.shapes.filter(s => !elementIds.includes(s.id)),
    }
    onStateChange(newState)
    setSelectedElements([])
  }

  const deleteElement = (elementId: string) => {
    deleteElements([elementId])
  }

  const deleteSelected = () => {
    if (selectedElements.length > 0) {
      deleteElements(selectedElements)
    }
  }

  const selectAll = () => {
    setSelectedElements(layerElements.map(el => el.id))
  }

  const clearSelection = () => {
    setSelectedElements([])
  }

  const toggleSelection = (elementId: string) => {
    setSelectedElements(prev => 
      prev.includes(elementId)
        ? prev.filter(id => id !== elementId)
        : [...prev, elementId]
    )
  }

  return (
    <div className="fixed right-4 top-4 bottom-4 w-80 bg-white rounded-xl shadow-lg border z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold text-lg">Layers</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Controls */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={selectAll}
            disabled={layerElements.length === 0}
          >
            Select All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearSelection}
            disabled={selectedElements.length === 0}
          >
            Clear
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={deleteSelected}
            disabled={selectedElements.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete ({selectedElements.length})
          </Button>
        </div>
      </div>

      {/* Layer List */}
      <div className="flex-1 overflow-y-auto">
        {layerElements.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p>No elements on canvas</p>
            <p className="text-sm mt-1">Start drawing to see layers here</p>
          </div>
        ) : (
          <div className="p-2">
            {layerElements.map((layerElement) => (
              <div
                key={layerElement.id}
                className={`flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                  selectedElements.includes(layerElement.id) 
                    ? 'bg-blue-50 border border-blue-200' 
                    : ''
                }`}
                onClick={() => toggleSelection(layerElement.id)}
              >
                {/* Element Icon */}
                <div 
                  className="flex-shrink-0 p-1 rounded"
                  style={{ color: layerElement.element.color }}
                >
                  {getElementIcon(layerElement.type, layerElement.element)}
                </div>

                {/* Element Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {layerElement.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {layerElement.type} • {new Date(layerElement.element.timestamp).toLocaleTimeString()}
                  </div>
                </div>

                {/* Color Indicator */}
                <div
                  className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
                  style={{ backgroundColor: layerElement.element.color }}
                />

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                    title={layerElement.visible ? 'Hide' : 'Show'}
                  >
                    {layerElement.visible ? (
                      <Eye className="h-3 w-3" />
                    ) : (
                      <EyeOff className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                    title={layerElement.locked ? 'Unlock' : 'Lock'}
                  >
                    {layerElement.locked ? (
                      <Lock className="h-3 w-3" />
                    ) : (
                      <Unlock className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteElement(layerElement.id)
                    }}
                    className="h-6 w-6 p-0 opacity-60 hover:opacity-100 text-destructive"
                    title="Delete"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="p-4 border-t bg-gray-50 rounded-b-xl">
        <div className="text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>Total elements:</span>
            <span className="font-medium">{layerElements.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Selected:</span>
            <span className="font-medium">{selectedElements.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Drawings:</span>
            <span className="font-medium">{whiteboardState.paths.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Shapes:</span>
            <span className="font-medium">{whiteboardState.shapes.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Texts:</span>
            <span className="font-medium">{whiteboardState.texts.length}</span>
          </div>
        </div>
      </div>
    </div>
  )
}