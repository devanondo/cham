import type { DrawElement, PositionType } from './types'

export const adjustElementCoordinates = (element: DrawElement): { x1: number; y1: number; x2: number; y2: number } => {
  if (element.type === 'pencil') throw new Error('adjustElementCoordinates not for pencil')
  const { type, x1, y1, x2, y2 } = element
  if (type === 'rectangle' || type === 'blur') {
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

export const adjustmentRequired = (type: DrawElement['type']): boolean =>
  type === 'line' || type === 'rectangle' || type === 'blur'

/** True if two rectangles overlap (intersect). */
export const rectsIntersect = (
  a: { x1: number; y1: number; x2: number; y2: number },
  b: { x1: number; y1: number; x2: number; y2: number }
): boolean => !(a.x2 < b.x1 || a.x1 > b.x2 || a.y2 < b.y1 || a.y1 > b.y2)

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

/** Union bounding box of multiple elements by id */
export const getGroupBoundingBox = (
  ids: number[],
  elements: DrawElement[]
): { x1: number; y1: number; x2: number; y2: number } | null => {
  if (ids.length === 0) return null
  let x1 = Infinity
  let y1 = Infinity
  let x2 = -Infinity
  let y2 = -Infinity
  for (const id of ids) {
    const el = elements.find((e) => e.id === id)
    if (!el) continue
    const box = getBoundingBox(el)
    x1 = Math.min(x1, box.x1)
    y1 = Math.min(y1, box.y1)
    x2 = Math.max(x2, box.x2)
    y2 = Math.max(y2, box.y2)
  }
  if (x1 === Infinity) return null
  return { x1, y1, x2, y2 }
}

const HANDLE_TOLERANCE = 5

/** Position within a rect (for group selection box): tl, tr, bl, br, or inside */
export const positionInRect = (
  x: number,
  y: number,
  rect: { x1: number; y1: number; x2: number; y2: number }
): PositionType | null => {
  const { x1, y1, x2, y2 } = rect
  if (Math.abs(x - x1) < HANDLE_TOLERANCE && Math.abs(y - y1) < HANDLE_TOLERANCE) return 'tl'
  if (Math.abs(x - x2) < HANDLE_TOLERANCE && Math.abs(y - y1) < HANDLE_TOLERANCE) return 'tr'
  if (Math.abs(x - x1) < HANDLE_TOLERANCE && Math.abs(y - y2) < HANDLE_TOLERANCE) return 'bl'
  if (Math.abs(x - x2) < HANDLE_TOLERANCE && Math.abs(y - y2) < HANDLE_TOLERANCE) return 'br'
  if (x >= x1 && x <= x2 && y >= y1 && y <= y2) return 'inside'
  return null
}

const HANDLE_SIZE = 8

export const drawSelectionIndicator = (context: CanvasRenderingContext2D, element: DrawElement) => {
  const { x1, y1, x2, y2 } = getBoundingBox(element)
  drawSelectionIndicatorRect(context, x1, y1, x2, y2)
}

/** Draw selection indicator for a rect (e.g. group selection box) */
export const drawSelectionIndicatorRect = (
  context: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) => {
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
