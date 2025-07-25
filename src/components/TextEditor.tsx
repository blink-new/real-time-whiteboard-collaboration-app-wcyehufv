import React, { useState, useRef, useEffect } from 'react'
import { TextElement } from '../types/whiteboard'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Check, X } from 'lucide-react'

interface TextEditorProps {
  textElement: TextElement
  onSave: (textElement: TextElement) => void
  onCancel: () => void
  zoom: number
  panOffset: { x: number; y: number }
}

export const TextEditor: React.FC<TextEditorProps> = ({
  textElement,
  onSave,
  onCancel,
  zoom,
  panOffset,
}) => {
  const [text, setText] = useState(textElement.text)
  const [fontSize, setFontSize] = useState(textElement.fontSize)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [])

  const handleSave = () => {
    if (text.trim()) {
      onSave({
        ...textElement,
        text: text.trim(),
        fontSize,
      })
    } else {
      onCancel()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
    }
  }

  const screenX = textElement.x * zoom + panOffset.x
  const screenY = textElement.y * zoom + panOffset.y

  return (
    <div
      className="absolute z-50"
      style={{
        left: screenX,
        top: screenY - 40, // Position above the text
        transform: 'translateX(-50%)',
      }}
    >
      {/* Text Input */}
      <div className="bg-white rounded-lg shadow-lg border p-3 min-w-[200px]">
        <div className="flex flex-col gap-2">
          <Input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter text..."
            className="text-sm"
            style={{
              fontSize: `${Math.max(12, fontSize * zoom * 0.5)}px`,
              color: textElement.color,
            }}
          />
          
          {/* Font Size Control */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Size:</label>
            <Input
              type="number"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              min={8}
              max={72}
              className="w-16 h-6 text-xs"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 justify-end">
            <Button
              size="sm"
              variant="ghost"
              onClick={onCancel}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              className="h-6 w-6 p-0"
            >
              <Check className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Preview Text */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: '50%',
          top: '100%',
          transform: 'translateX(-50%)',
          fontSize: `${fontSize * zoom}px`,
          color: textElement.color,
          fontFamily: 'Inter, sans-serif',
          whiteSpace: 'pre-wrap',
          marginTop: '8px',
        }}
      >
        {text || 'Enter text...'}
      </div>
    </div>
  )
}