export type ToolType = 'selection' | 'line' | 'rectangle' | 'blur' | 'pencil' | 'text'
export type ActionType = 'none' | 'drawing' | 'moving' | 'resizing' | 'writing' | 'selecting'
export type ResizePosition = 'tl' | 'tr' | 'bl' | 'br' | 'start' | 'end'
export type PositionType = ResizePosition | 'inside'

export interface LineOrRectElement {
  id: number
  type: 'line' | 'rectangle'
  x1: number
  y1: number
  x2: number
  y2: number
  roughElement: unknown
  stroke?: string
}

export interface PencilElement {
  id: number
  type: 'pencil'
  points: { x: number; y: number }[]
  stroke?: string
}

export interface TextElement {
  id: number
  type: 'text'
  x1: number
  y1: number
  x2: number
  y2: number
  text: string
  stroke?: string
  fontSize?: number
}

export interface BlurElement {
  id: number
  type: 'blur'
  x1: number
  y1: number
  x2: number
  y2: number
}

export type DrawElement = LineOrRectElement | PencilElement | TextElement | BlurElement

export type SelectedElement = DrawElement & {
  position?: PositionType
  offsetX?: number
  offsetY?: number
  xOffsets?: number[]
  yOffsets?: number[]
}

export type DrawingToolProps = {
  imageUrl?: string | null
}

export interface DrawingToolHandle {
  captureAsFile: () => File | null
}
