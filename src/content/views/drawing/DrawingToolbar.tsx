import {
  Camera,
  CornerUpLeft,
  CornerUpRight,
  Focus,
  MousePointer2,
  Pencil,
  Slash,
  Square,
  Trash2,
  Type,
} from 'lucide-react'
import type { ReactElement } from 'react'
import type { ToolType } from './types'
import { COLOR_OPTIONS } from './constants'

const DRAWING_TOOLS: { id: ToolType; icon: ReactElement }[] = [
  { id: 'selection', icon: <MousePointer2 size={18} /> },
  { id: 'line', icon: <Slash size={18} /> },
  { id: 'rectangle', icon: <Square size={18} /> },
  { id: 'blur', icon: <Focus size={18} /> },
  { id: 'pencil', icon: <Pencil size={18} /> },
  { id: 'text', icon: <Type size={18} /> },
]

type DrawingToolbarProps = {
  tool: ToolType
  setTool: (t: ToolType) => void
  activeColor: string
  setActiveColor: (c: string) => void
  colorMenuOpen: boolean
  setColorMenuOpen: (open: boolean) => void
  colorDropdownRef: React.RefObject<HTMLDivElement | null>
  undo: () => void
  redo: () => void
  deleteSelectedElement: () => void
  selectedElement: unknown
  action: string
  takeCanvasScreenshot: () => void
}

export const DrawingToolbar = ({
  tool,
  setTool,
  activeColor,
  setActiveColor,
  colorMenuOpen,
  setColorMenuOpen,
  colorDropdownRef,
  undo,
  redo,
  deleteSelectedElement,
  selectedElement,
  action,
  takeCanvasScreenshot,
}: DrawingToolbarProps) => (
  <div className="screenshot-modal__toolbar" style={{ position: 'absolute' }}>
    <div className="relative">
      <button
        type="button"
        className={`screenshot-modal__toolbar-item screenshot-modal__toolbar-item--swatch ${colorMenuOpen ? 'screenshot-modal__toolbar-item--active' : ''}`}
        onClick={(e) => {
          e.stopPropagation()
          setColorMenuOpen(!colorMenuOpen)
        }}
      >
        <span className="screenshot-modal__color-swatch" style={{ backgroundColor: activeColor }} />
      </button>
      {colorMenuOpen && (
        <div
          ref={colorDropdownRef}
          className="screenshot-modal__color-dropdown"
          onClick={(e) => e.stopPropagation()}
        >
          {COLOR_OPTIONS.map((color) => (
            <button
              key={color}
              type="button"
              className={`screenshot-modal__color-option ${activeColor === color ? 'screenshot-modal__color-option--active' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => {
                setActiveColor(color)
                setColorMenuOpen(false)
              }}
            />
          ))}
        </div>
      )}
    </div>
    {DRAWING_TOOLS.map((t) => (
      <button
        key={t.id}
        type="button"
        className={`screenshot-modal__toolbar-item ${tool === t.id ? 'screenshot-modal__toolbar-item--active' : ''}`}
        onClick={() => setTool(t.id)}
      >
        {t.icon}
      </button>
    ))}
    <div className="screenshot-modal__toolbar-divider" />
    <button type="button" className="screenshot-modal__toolbar-item" onClick={undo} title="Undo">
      <CornerUpLeft size={18} />
    </button>
    <button type="button" className="screenshot-modal__toolbar-item" onClick={redo} title="Redo">
      <CornerUpRight size={18} />
    </button>
    <button
      type="button"
      className="screenshot-modal__toolbar-item"
      onClick={deleteSelectedElement}
      title="Delete selected"
      disabled={!selectedElement || action === 'writing'}
      style={{ opacity: selectedElement && action !== 'writing' ? 1 : 0.5 }}
    >
      <Trash2 size={18} />
    </button>
    <div className="screenshot-modal__toolbar-divider" />
    <button
      type="button"
      className="screenshot-modal__toolbar-item"
      onClick={takeCanvasScreenshot}
      title="Save canvas as image"
    >
      <Camera size={18} />
    </button>
  </div>
)
