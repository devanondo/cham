import {
  ArrowUpRight,
  Circle,
  CornerUpLeft,
  CornerUpRight,
  Droplet,
  Eye,
  Hand,
  Slash,
  Square,
  Type,
  X,
} from 'lucide-react'
import React, { useEffect, useRef, useState, type FC, type ReactElement } from 'react'
import './ScreenshotModal.css'

/**
 * Full-screen overlay that displays a captured screenshot on top of the page.
 * This lives in the content script React tree and is controlled via props.
 */
type ScreenshotModalProps = {
  /** Data URL of the active / cropped screenshot (png / jpeg). */
  imageUrl: string
  /** Optional original full screenshot to show in a small preview. */
  originalImageUrl?: string | null
  /** Called when the user closes the modal (clicks X or backdrop). */
  onClose: () => void
}

const tools: { id: string; icon: ReactElement }[] = [
  { id: 'eyedropper', icon: <Droplet size={18} /> },
  { id: 'rectangle', icon: <Square size={18} /> },
  { id: 'circle', icon: <Circle size={18} /> },
  { id: 'arrow', icon: <ArrowUpRight size={18} /> },
  { id: 'line', icon: <Slash size={18} /> },
  { id: 'text', icon: <Type size={18} /> },
  { id: 'preview', icon: <Eye size={18} /> },
  { id: 'pan', icon: <Hand size={18} /> },
]

const COLOR_OPTIONS: string[] = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#a3e635', // lime
]

const ScreenshotModal: FC<ScreenshotModalProps> = ({ imageUrl, originalImageUrl, onClose }) => {
  const [activeTool, setActiveTool] = useState<string>('rectangle')
  const [activeColor, setActiveColor] = useState<string>('#8b5cf6')
  const [colorMenuOpen, setColorMenuOpen] = useState<boolean>(false)
  const colorDropdownRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!colorMenuOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (!colorDropdownRef.current) return
      if (!colorDropdownRef.current.contains(event.target as Node)) {
        setColorMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [colorMenuOpen])
  /**
   * Close when the user clicks on the dark backdrop area, but not
   * when they click inside the content card.
   */
  const handleBackdropClick: React.MouseEventHandler<HTMLDivElement> = (event) => {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="screenshot-modal__overlay" onClick={handleBackdropClick}>
      <div className="screenshot-modal__content">
        <div className="screenshot-modal__layout">
          <div className="screenshot-modal__image-container">
            {/* Toolbar */}
            <div className="screenshot-modal__toolbar">
              {/* Color swatch */}
              <div className="relative">
                <button
                  type="button"
                  className={`screenshot-modal__toolbar-item screenshot-modal__toolbar-item--swatch ${activeTool === 'eyedropper' ? 'screenshot-modal__toolbar-item--active' : ''}`}
                  onClick={(event) => {
                    event.stopPropagation()
                    setActiveTool('eyedropper')
                    setColorMenuOpen((open) => !open)
                  }} 
                > 
                  <span
                    className="screenshot-modal__color-swatch"
                    style={{ backgroundColor: activeColor }}
                  />
                </button>

                {activeTool === 'eyedropper' && colorMenuOpen && (
                  <div
                    ref={colorDropdownRef}
                    className="screenshot-modal__color-dropdown"
                    onClick={(event) => event.stopPropagation()}
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

              {/* Main tools */}

              {tools.map((tool) => (
                <React.Fragment key={tool.id}>
                  <button
                    type="button"
                    className={`screenshot-modal__toolbar-item ${activeTool === tool.id ? 'screenshot-modal__toolbar-item--active' : ''}`}
                    onClick={() => setActiveTool(tool.id)}
                  >
                    {tool.icon}
                  </button>
                </React.Fragment>
              ))}

              {/* Undo / Redo */}
              <div className="screenshot-modal__toolbar-divider" />
              <button type="button" className="screenshot-modal__toolbar-item">
                <CornerUpLeft size={18} />
              </button>
              <button type="button" className="screenshot-modal__toolbar-item">
                <CornerUpRight size={18} />
              </button>
            </div>

            {/* Main working image: the selected / cropped area */}
            <div className="screenshot-modal__main-image-wrapper">
              <img src={imageUrl} alt="Captured screenshot" className="screenshot-modal__image" />
            </div>

            {/* Optional small preview of the original full screenshot */}
            {originalImageUrl && (
              <div className="screenshot-modal__preview">
                <img
                  src={originalImageUrl}
                  alt="Original full screenshot"
                  className="screenshot-modal__preview-image"
                />
              </div>
            )}
          </div>
          <div className="screenshot-modal__right-side">
            <h2 className="">Title</h2>
          </div>
        </div>

        <button
          type="button"
          aria-label="Close screenshot"
          className="screenshot-modal__close-button"
          onClick={onClose}
        >
          <X />
        </button>
      </div>
    </div>
  )
}

export default ScreenshotModal
