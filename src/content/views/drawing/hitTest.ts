import type { DrawElement, PositionType, ResizePosition } from './types'

export const nearPoint = (
  x: number,
  y: number,
  x1: number,
  y1: number,
  name: ResizePosition | 'start' | 'end'
): ResizePosition | 'start' | 'end' | null => {
  return Math.abs(x - x1) < 5 && Math.abs(y - y1) < 5 ? name : null
}

const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2))

export const onLine = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x: number,
  y: number,
  maxDistance = 1
): 'inside' | null => {
  const a = { x: x1, y: y1 }
  const b = { x: x2, y: y2 }
  const c = { x, y }
  const offset = distance(a, b) - (distance(a, c) + distance(b, c))
  return Math.abs(offset) < maxDistance ? 'inside' : null
}

export const positionWithinElement = (x: number, y: number, element: DrawElement): PositionType | null => {
  switch (element.type) {
    case 'line': {
      const { x1, y1, x2, y2 } = element
      const on = onLine(x1, y1, x2, y2, x, y)
      const start = nearPoint(x, y, x1, y1, 'start')
      const end = nearPoint(x, y, x2, y2, 'end')
      return start || end || on
    }
    case 'rectangle': {
      const { x1, y1, x2, y2 } = element
      const topLeft = nearPoint(x, y, x1, y1, 'tl')
      const topRight = nearPoint(x, y, x2, y1, 'tr')
      const bottomLeft = nearPoint(x, y, x1, y2, 'bl')
      const bottomRight = nearPoint(x, y, x2, y2, 'br')
      const inside = x >= x1 && x <= x2 && y >= y1 && y <= y2 ? 'inside' : null
      return topLeft || topRight || bottomLeft || bottomRight || inside
    }
    case 'pencil': {
      const betweenAnyPoint = element.points.some((point, index) => {
        const nextPoint = element.points[index + 1]
        if (!nextPoint) return false
        return onLine(point.x, point.y, nextPoint.x, nextPoint.y, x, y, 5) != null
      })
      return betweenAnyPoint ? 'inside' : null
    }
    case 'text': {
      const { x1, y1, x2, y2 } = element
      const minX = Math.min(x1, x2)
      const maxX = Math.max(x1, x2)
      const minY = Math.min(y1, y2)
      const maxY = Math.max(y1, y2)
      const topLeft = nearPoint(x, y, x1, y1, 'tl')
      const topRight = nearPoint(x, y, x2, y1, 'tr')
      const bottomLeft = nearPoint(x, y, x1, y2, 'bl')
      const bottomRight = nearPoint(x, y, x2, y2, 'br')
      const inside = x >= minX && x <= maxX && y >= minY && y <= maxY ? 'inside' : null
      return topLeft || topRight || bottomLeft || bottomRight || inside
    }
    default:
      throw new Error(`Type not recognised: ${(element as DrawElement).type}`)
  }
}

/** Return the topmost element at (x, y) (last in draw order = visually on top). */
export const getElementAtPosition = (
  x: number,
  y: number,
  elements: DrawElement[]
): (DrawElement & { position: PositionType }) | undefined => {
  const withPosition = elements.map((element) => ({
    ...element,
    position: positionWithinElement(x, y, element),
  }))
  for (let i = withPosition.length - 1; i >= 0; i--) {
    const el = withPosition[i]
    if (el.position !== null) return el as DrawElement & { position: PositionType }
  }
  return undefined
}
