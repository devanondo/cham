import type { FC, MouseEvent as ReactMouseEvent } from 'react'
import { useState } from 'react'

/**
 * Overlay that lets the user select a rectangular area on top of
 * the captured screenshot.
 *
 * Props:
 * - onCancel: called when the user cancels selection.
 * - onSelectionComplete: called with the final selection rectangle (in
 *   viewport coordinates) and the current viewport size, so the caller
 *   can decide when and how to capture/crop the screenshot.
 *
 * Implementation notes:
 * - We render the screenshot stretched to cover the viewport (100vw x 100vh).
 * - The selection rectangle uses viewport coordinates.
 * - We map viewport selection -> image pixel coordinates using the
 *   ratio between image natural size and window size.
 */
type ScreenSelectionOverlayProps = {
  onCancel: () => void
  onSelectionComplete: (
    selection: SelectionRect,
    viewport: {
      width: number
      height: number
    },
  ) => void
}

type SelectionRect = {
  x: number
  y: number
  width: number
  height: number
}

const ScreenSelectionOverlay: FC<ScreenSelectionOverlayProps> = ({ onCancel, onSelectionComplete }) => {
  const [isDragging, setIsDragging] = useState(false)
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null)
  const [selection, setSelection] = useState<SelectionRect | null>(null)
  const [cursorPosition, setCursorPosition] = useState<{ x: number; y: number } | null>(null)

  /**
   * Begin a drag operation to start drawing a selection rectangle.
   */
  const handleMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    // Only respond to left-click.
    if (event.button !== 0) return

    const x = event.clientX
    const y = event.clientY

    setStartPoint({ x, y })
    setSelection({
      x,
      y,
      width: 0,
      height: 0,
    })
    setIsDragging(true)
  }

  /**
   * Update the selection rectangle while dragging.
   */
  const handleMouseMove = (event: ReactMouseEvent<HTMLDivElement>) => {
    // Track cursor position so we can show helper text next to it.
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

  /**
   * Stop dragging when mouse is released.
   * As soon as the user finishes the drag, we immediately crop
   * the selected region and return it (click + drag + release = capture).
   */
  const handleMouseUp = () => {
    setIsDragging(false)

    // Only capture if we have a reasonably-sized selection.
    if (!hasSelection) {
      onCancel()
      return
    }

    captureSelection()
  }

  /**
   * Crop the selected area from the original screenshot and
   * notify the caller with the selection and current viewport
   * size. The caller is responsible for performing the actual
   * screenshot capture (via background) and cropping.
   */
  const captureSelection = () => {
    if (!selection) {
      onCancel()
      return
    }

    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    onSelectionComplete(selection, {
      width: viewportWidth,
      height: viewportHeight,
    })
  }

  const hasSelection = !!selection && selection.width > 4 && selection.height > 4

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{
        cursor: 'crosshair',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        position: 'fixed',
        inset: 0,
        zIndex: 2147483646,
      }}
    >
      {/* Selection rectangle visual feedback */}
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

      {/* Helper text that follows the mouse cursor */}
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
          Click and drag to select area. Release mouse to capture.
        </div>
      )}
    </div>
  )
}

export default ScreenSelectionOverlay
