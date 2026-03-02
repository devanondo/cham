import type { DrawElement, PositionType } from './types'

export const adjustElementCoordinates = (element: DrawElement): { x1: number; y1: number; x2: number; y2: number } => {
  if (element.type === 'pencil') throw new Error('adjustElementCoordinates not for pencil')
  const { type, x1, y1, x2, y2 } = element
  if (type === 'rectangle') {
    const minX = Math.min(x1, x2)
    const maxX = Math.max(x1, x2)
    const minY = Math.min(y1, y2)
    const maxY = Math.max(y1, y2)
    return { x1: minX, y1: minY, x2: maxX, y2: maxY }
  } else {
    if (x1 < x2 || (x1 === x2 && y1 < y2)) {
      return { x1, y1, x2, y2 }
    } else {
      return { x1: x2, y1: y2, x2: x1, y2: y1 }
    }
  }
}

export const cursorForPosition = (position: PositionType): string => {
  switch (position) {
    case 'tl':
    case 'br':
    case 'start':
    case 'end':
      return 'nwse-resize'
    case 'tr':
    case 'bl':
      return 'nesw-resize'
    default:
      return 'move'
  }
}

export const resizedCoordinates = (
  clientX: number,
  clientY: number,
  position: PositionType,
  coordinates: { x1: number; y1: number; x2: number; y2: number }
): { x1: number; y1: number; x2: number; y2: number } | null => {
  const { x1, y1, x2, y2 } = coordinates
  switch (position) {
    case 'tl':
    case 'start':
      return { x1: clientX, y1: clientY, x2, y2 }
    case 'tr':
      return { x1, y1: clientY, x2: clientX, y2 }
    case 'bl':
      return { x1: clientX, y1, x2, y2: clientY }
    case 'br':
    case 'end':
      return { x1, y1, x2: clientX, y2: clientY }
    default:
      return null
  }
}

export const adjustmentRequired = (type: DrawElement['type']): boolean => type === 'line' || type === 'rectangle'

/** Get bounding box { x1, y1, x2, y2 } for drawing selection indicator */
export const getBoundingBox = (element: DrawElement): { x1: number; y1: number; x2: number; y2: number } => {
  if (element.type === 'pencil') {
    const xs = element.points.map((p) => p.x)
    const ys = element.points.map((p) => p.y)
    const padding = 4
    return {
      x1: Math.min(...xs) - padding,
      y1: Math.min(...ys) - padding,
      x2: Math.max(...xs) + padding,
      y2: Math.max(...ys) + padding,
    }
  }
  const { x1, y1, x2, y2 } = element
  const padding = 4
  return {
    x1: Math.min(x1, x2) - padding,
    y1: Math.min(y1, y2) - padding,
    x2: Math.max(x1, x2) + padding,
    y2: Math.max(y1, y2) + padding,
  }
}

const HANDLE_SIZE = 8

export const drawSelectionIndicator = (context: CanvasRenderingContext2D, element: DrawElement) => {
  const { x1, y1, x2, y2 } = getBoundingBox(element)
  context.save()
  context.strokeStyle = '#3b82f6'
  context.lineWidth = 2
  context.setLineDash([6, 4])
  context.strokeRect(x1, y1, x2 - x1, y2 - y1)
  context.setLineDash([])
  context.fillStyle = '#3b82f6'
  const handles = [
    [x1, y1],
    [x2, y1],
    [x2, y2],
    [x1, y2],
  ]
  handles.forEach(([hx, hy]) => {
    context.fillRect(hx - HANDLE_SIZE / 2, hy - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE)
  })
  context.restore()
}
