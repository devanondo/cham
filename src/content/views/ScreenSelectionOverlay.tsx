import type { FC, MouseEvent as ReactMouseEvent } from 'react'
import { useRef, useState } from 'react'

export type SelectionRect = {
  x: number
  y: number
  width: number
  height: number
}

/** Display rect of the image on screen (e.g. when using object-fit: contain). */
export type ImageDisplayInfo = {
  naturalWidth: number
  naturalHeight: number
  displayRect: { left: number; top: number; width: number; height: number }
}

/**
 * Overlay that lets the user select a rectangular area.
 * When imageUrl is provided, the image is shown and the selection is drawn on top of it,
 * and onSelectionComplete receives imageDisplayInfo so the caller can crop the original image.
 */
type ScreenSelectionOverlayProps = {
  onCancel: () => void
  onSelectionComplete: (
    selection: SelectionRect,
    viewport: { width: number; height: number },
    imageDisplayInfo?: ImageDisplayInfo
  ) => void
  /** When set, this image is shown and the user selects on it; selection is in viewport coords and imageDisplayInfo is passed for cropping. */
  imageUrl?: string | null
}

const ScreenSelectionOverlay: FC<ScreenSelectionOverlayProps> = ({
  onCancel,
  onSelectionComplete,
  imageUrl,
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null)
  const [selection, setSelection] = useState<SelectionRect | null>(null)
  const [cursorPosition, setCursorPosition] = useState<{ x: number; y: number } | null>(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const imageRef = useRef<HTMLImageElement>(null)

  const handleMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    const x = event.clientX
    const y = event.clientY
    setStartPoint({ x, y })
    setSelection({ x, y, width: 0, height: 0 })
    setIsDragging(true)
  }

  const handleMouseMove = (event: ReactMouseEvent<HTMLDivElement>) => {
    setCursorPosition({ x: event.clientX, y: event.clientY })
    if (!isDragging || !startPoint) return
    const currentX = event.clientX
    const currentY = event.clientY
    const x = Math.min(startPoint.x, currentX)
    const y = Math.min(startPoint.y, currentY)
    const width = Math.abs(currentX - startPoint.x)
    const height = Math.abs(currentY - startPoint.y)
    setSelection({ x, y, width, height })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    if (!hasSelection || !selection) {
      onCancel()
      return
    }
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const viewport = { width: viewportWidth, height: viewportHeight }

    if (imageUrl && imageRef.current && imageLoaded) {
      const img = imageRef.current
      const rect = img.getBoundingClientRect()
      const imageDisplayInfo: ImageDisplayInfo = {
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        displayRect: {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        },
      }
      onSelectionComplete(selection, viewport, imageDisplayInfo)
    } else {
      onSelectionComplete(selection, viewport)
    }
  }

  const hasSelection = !!selection && selection.width > 4 && selection.height > 4

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{
        cursor: 'crosshair',
        backgroundColor: imageUrl ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.6)',
        position: 'fixed',
        inset: 0,
        zIndex: 2147483646,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* When imageUrl is provided, show the original image so user selects on it */}
      {imageUrl && (
        <img
          ref={imageRef}
          src={imageUrl}
          alt="Screenshot to select area"
          onLoad={() => setImageLoaded(true)}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        />
      )}

      {hasSelection && selection && (
        <div
          style={{
            position: 'fixed',
            left: `${selection.x}px`,
            top: `${selection.y}px`,
            width: `${selection.width}px`,
            height: `${selection.height}px`,
            border: '2px solid #3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            boxShadow: '0 0 0 1px rgba(15, 23, 42, 0.5)',
            pointerEvents: 'none',
          }}
        />
      )}

      {cursorPosition && (
        <div
          style={{
            position: 'fixed',
            left: cursorPosition.x + 12,
            top: cursorPosition.y + 12,
            fontSize: '11px',
            padding: '4px 8px',
            borderRadius: '9999px',
            background: 'rgba(15, 23, 42, 0.9)',
            color: '#e5e7eb',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {imageUrl ? 'Select area on image. Release to crop.' : 'Click and drag to select area. Release mouse to capture.'}
        </div>
      )}
    </div>
  )
}

export default ScreenSelectionOverlay
