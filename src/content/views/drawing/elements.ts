import getStroke from 'perfect-freehand'
import rough from 'roughjs/bundled/rough.esm'
import {
  BLUR_RADIUS_PX,
  DEFAULT_STROKE,
  DEFAULT_TEXT_FONT_SIZE,
  MAX_TEXT_FONT_SIZE,
  MIN_TEXT_FONT_SIZE,
} from './constants'
import type { DrawElement, TextElement } from './types'

const generator = rough.generator()

const ROUGH_OPTIONS = (stroke: string) => ({ stroke, strokeWidth: 2 })

/** Default text font size proportional to canvas/background size. */
export const getDefaultTextFontSizeForCanvas = (canvasWidth: number, canvasHeight: number): number => {
  const base = Math.min(canvasWidth, canvasHeight) * 0.025
  return Math.round(Math.min(MAX_TEXT_FONT_SIZE, Math.max(MIN_TEXT_FONT_SIZE, base)))
}

export const createElement = (
  id: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  type: 'line' | 'rectangle' | 'blur' | 'pencil' | 'text',
  stroke?: string
): DrawElement => {
  const strokeColor = stroke ?? DEFAULT_STROKE
  // Use thicker stroke for line/rectangle for better visibility
  const options: any = { stroke: strokeColor, strokeWidth: 2 }
  switch (type) {
    case 'line':
    case 'rectangle': {
      const roughElement =
        type === 'line'
          ? generator.line(x1, y1, x2, y2, options)
          : generator.rectangle(x1, y1, x2 - x1, y2 - y1, options)
      return { id, x1, y1, x2, y2, type, roughElement, stroke: strokeColor } as DrawElement
    }
    case 'blur':
      return { id, type: 'blur', x1, y1, x2, y2 }
    case 'pencil':
      return { id, type, points: [{ x: x1, y: y1 }], stroke: strokeColor }
    case 'text':
      return { id, type, x1, y1, x2, y2, text: '', stroke: strokeColor, fontSize: DEFAULT_TEXT_FONT_SIZE }
    default:
      throw new Error(`Type not recognised: ${type}`)
  }
}

const getSvgPathFromStroke = (stroke: number[][]): string => {
  if (!stroke.length) return ''
  const d = stroke.reduce(
    (acc: (string | number)[], [x0, y0], i: number, arr: number[][]) => {
      const [x1, y1] = arr[(i + 1) % arr.length]
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2)
      return acc
    },
    ['M', ...stroke[0], 'Q'] as (string | number)[]
  )
  d.push('Z')
  return d.join(' ')
}

export const drawElement = (
  roughCanvas: { draw: (drawable: unknown) => void },
  context: CanvasRenderingContext2D,
  element: DrawElement
) => {
  switch (element.type) {
    case 'line':
    case 'rectangle': {
      const strokeColor = element.stroke ?? DEFAULT_STROKE
      const opts = ROUGH_OPTIONS(strokeColor)
      const drawable =
        element.type === 'line'
          ? generator.line(element.x1, element.y1, element.x2, element.y2, opts)
          : generator.rectangle(element.x1, element.y1, element.x2 - element.x1, element.y2 - element.y1, opts)
      roughCanvas.draw(drawable)
      break
    }
    case 'pencil': {
      const strokePath = getSvgPathFromStroke(getStroke(element.points))
      context.fillStyle = element.stroke ?? DEFAULT_STROKE
      context.fill(new Path2D(strokePath))
      break
    }
    case 'text': {
      const te = element as TextElement
      const fontSize = te.fontSize ?? DEFAULT_TEXT_FONT_SIZE
      const padding = Math.round(fontSize * 0.4)
      const lineHeight = fontSize * 1.2
      const lines = (element.text ?? '').split(/\r?\n/)
      context.fillStyle = te.stroke ?? DEFAULT_STROKE
      context.fillRect(element.x1, element.y1, element.x2 - element.x1, element.y2 - element.y1)
      context.textBaseline = 'top'
      context.font = `${fontSize}px Inter`
      context.fillStyle = '#ffffff'
      lines.forEach((line, i) => {
        context.fillText(line, element.x1 + padding, element.y1 + padding + i * lineHeight)
      })
      break
    }
    case 'blur': {
      const canvas = context.canvas
      const x1 = Math.max(0, Math.min(element.x1, element.x2))
      const y1 = Math.max(0, Math.min(element.y1, element.y2))
      const x2 = Math.min(canvas.width, Math.max(element.x1, element.x2))
      const y2 = Math.min(canvas.height, Math.max(element.y1, element.y2))
      const w = Math.max(1, Math.round(x2 - x1))
      const h = Math.max(1, Math.round(y2 - y1))
      const off = document.createElement('canvas')
      off.width = w
      off.height = h
      const offCtx = off.getContext('2d')
      if (!offCtx) break
      offCtx.drawImage(canvas, x1, y1, w, h, 0, 0, w, h)
      offCtx.filter = `blur(${BLUR_RADIUS_PX}px)`
      offCtx.drawImage(off, 0, 0, w, h, 0, 0, w, h)
      context.drawImage(off, 0, 0, w, h, x1, y1, w, h)
      break
    }
    default: {
      const _exhaust: never = element
      throw new Error(`Type not recognised: ${(_exhaust as DrawElement).type}`)
    }
  }
}
