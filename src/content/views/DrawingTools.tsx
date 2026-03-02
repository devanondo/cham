import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import rough from 'roughjs/bundled/rough.esm'
import './ScreenshotModal.css'
import type { DrawElement, LineOrRectElement, PencilElement, SelectedElement, TextElement } from './drawing/types'
import type { ActionType, ToolType } from './drawing/types'
import { DEFAULT_TEXT_FONT_SIZE, MAX_TEXT_FONT_SIZE, MIN_TEXT_FONT_SIZE, PENCIL_CURSOR_SVG } from './drawing/constants'
import { getCanvasCoords, canvasToViewport } from './drawing/coordinates'
import { getElementAtPosition } from './drawing/hitTest'
import {
  adjustmentRequired,
  adjustElementCoordinates,
  cursorForPosition,
  drawSelectionIndicator,
  resizedCoordinates,
} from './drawing/resize'
import { createElement, drawElement, getDefaultTextFontSizeForCanvas } from './drawing/elements'
import { useHistory } from './drawing/useHistory'
import { DrawingToolbar } from './drawing/DrawingToolbar'
import { TextEditorOverlay } from './drawing/TextEditorOverlay'
import type { DrawingToolProps } from './drawing/types'

const DrawingTool = ({ imageUrl }: DrawingToolProps) => {
  const [elements, setElements, undo, redo] = useHistory<DrawElement[]>([])
  const [action, setAction] = useState<ActionType>('none')
  const [tool, setTool] = useState<ToolType>('text')
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const textInputRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const colorDropdownRef = useRef<HTMLDivElement | null>(null)
  const [activeColor, setActiveColor] = useState<string>('#3b82f6')
  const [colorMenuOpen, setColorMenuOpen] = useState<boolean>(false)
  const [textareaViewport, setTextareaViewport] = useState<{ left: number; top: number } | null>(null)
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null)

  const canvasWidth = backgroundImage ? backgroundImage.naturalWidth : window.innerWidth
  const canvasHeight = backgroundImage ? backgroundImage.naturalHeight : window.innerHeight

  useEffect(() => {
    if (!imageUrl) {
      setBackgroundImage(null)
      return
    }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => setBackgroundImage(img)
    img.onerror = () => setBackgroundImage(null)
    img.src = imageUrl
    return () => setBackgroundImage(null)
  }, [imageUrl])

  useLayoutEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return
    context.clearRect(0, 0, canvas.width, canvas.height)
    if (backgroundImage) {
      context.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height)
    }
    const roughCanvas = rough.canvas(canvas)
    elements.forEach((element) => {
      if (action === 'writing' && selectedElement?.id === element.id) return
      drawElement(roughCanvas, context, element)
    })
    if (tool === 'selection' && action === 'none') {
      const idsToDraw =
        selectedIds.length > 0 ? selectedIds : selectedElement ? [selectedElement.id] : []
      idsToDraw.forEach((id) => {
        const el = elements.find((e) => e.id === id)
        if (el) drawSelectionIndicator(context, el)
      })
    }
  }, [elements, action, selectedElement, selectedIds, tool, backgroundImage, canvasWidth, canvasHeight])

  const deleteSelectedElement = () => {
    if (action === 'writing') return
    const idsToDelete =
      selectedIds.length > 0
        ? new Set(selectedIds)
        : selectedElement
          ? new Set<number>([selectedElement.id])
          : null
    if (!idsToDelete) return
    const newElements = elements.filter((e) => !idsToDelete.has(e.id)).map((e, i) => ({ ...e, id: i }))
    setElements(newElements)
    setSelectedElement(null)
    setSelectedIds([])
  }

  const takeCanvasScreenshot = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    try {
      const dataUrl = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.download = `canvas-screenshot-${Date.now()}.png`
      a.href = dataUrl
      a.click()
    } catch (e) {
      console.warn('Canvas export failed (e.g. tainted by cross-origin image):', e)
    }
  }

  const selectedElementRef = useRef(selectedElement)
  const selectedIdsRef = useRef<number[]>(selectedIds)
  const actionRef = useRef(action)
  const elementsRef = useRef(elements)
  selectedElementRef.current = selectedElement
  selectedIdsRef.current = selectedIds
  actionRef.current = action
  elementsRef.current = elements

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'z') {
        if (event.shiftKey) redo()
        else undo()
        return
      }
      const sel = selectedElementRef.current
      const selIds = selectedIdsRef.current
      const act = actionRef.current
      if ((event.key === 'Delete' || event.key === 'Backspace') && (sel || selIds.length) && act !== 'writing') {
        const target = event.target as HTMLElement
        if (target?.tagName !== 'INPUT' && target?.tagName !== 'TEXTAREA') {
          event.preventDefault()
          const idsToDelete =
            selIds.length > 0 ? new Set(selIds) : sel ? new Set<number>([sel.id]) : new Set<number>()
          const next = elementsRef.current
            .filter((e) => !idsToDelete.has(e.id))
            .map((e, i) => ({ ...e, id: i }))
          setElements(next)
          setSelectedElement(null)
          setSelectedIds([])
        }
      }
    }
    document.addEventListener('keydown', handleKeydown)
    return () => document.removeEventListener('keydown', handleKeydown)
  }, [undo, redo, setElements])

  useLayoutEffect(() => {
    if (action !== 'writing' || !selectedElement || selectedElement.type !== 'text') return
    const el = textInputRef.current
    if (el) {
      el.textContent = selectedElement.text ?? ''
      const id = requestAnimationFrame(() => {
        el.focus()
        const range = document.createRange()
        range.selectNodeContents(el)
        const sel = window.getSelection()
        sel?.removeAllRanges()
        sel?.addRange(range)
      })
      return () => cancelAnimationFrame(id)
    }
  }, [action, selectedElement])

  useEffect(() => {
    if (!colorMenuOpen) return
    const handleClickOutside = (event: MouseEvent) => {
      if (colorDropdownRef.current?.contains(event.target as Node)) return
      setColorMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [colorMenuOpen])

  const updateElement = (
    id: number,
    x1: number,
    y1: number,
    x2: number | null,
    y2: number | null,
    type: DrawElement['type'],
    options?: { text?: string }
  ) => {
    const elementsCopy = [...elements]
    switch (type) {
      case 'line':
      case 'rectangle':
        if (x2 !== null && y2 !== null) {
          const existing = elementsCopy[id] as LineOrRectElement
          elementsCopy[id] = createElement(id, x1, y1, x2, y2, type, existing.stroke)
        }
        break
      case 'pencil':
        if (x2 !== null && y2 !== null) {
          const el = elementsCopy[id] as PencilElement
          el.points = [...el.points, { x: x2, y: y2 }]
        }
        break
      case 'text': {
        const existing = elementsCopy[id] as TextElement
        const text = options?.text ?? existing.text
        const currentFontSize = existing.fontSize ?? DEFAULT_TEXT_FONT_SIZE
        if (x2 !== null && y2 !== null) {
          const nx1 = Math.min(x1, x2)
          const ny1 = Math.min(y1, y2)
          const nx2 = Math.max(x1, x2)
          const ny2 = Math.max(y1, y2)
          const oldW = existing.x2 - existing.x1
          const oldH = existing.y2 - existing.y1
          const newW = nx2 - nx1
          const newH = ny2 - ny1
          let newFontSize = currentFontSize
          if (oldW > 0 && oldH > 0 && (newW !== oldW || newH !== oldH)) {
            const scale = Math.min(newH / oldH, newW / oldW)
            newFontSize = Math.round(
              Math.min(MAX_TEXT_FONT_SIZE, Math.max(MIN_TEXT_FONT_SIZE, currentFontSize * scale))
            )
          }
          const ctx = canvasRef.current?.getContext('2d')
          const lines = (text ?? '').split(/\r?\n/)
          const padding = Math.round(newFontSize * 0.4)
          const lineHeight = newFontSize * 1.05
          let textWidth = 0
          if (ctx) {
            ctx.font = `${newFontSize}px Inter`
            lines.forEach((line) => {
              const w = ctx.measureText(line).width
              if (w > textWidth) textWidth = w
            })
          }
          const textHeight = lines.length * lineHeight
          const newX2 = nx1 + textWidth + padding * 2
          const newY2 = ny1 + textHeight + padding * 2
          elementsCopy[id] = {
            ...existing,
            x1: nx1,
            y1: ny1,
            x2: newX2,
            y2: newY2,
            text,
            fontSize: newFontSize,
          } as TextElement
        } else {
          const ctx = canvasRef.current?.getContext('2d')
          const lineHeight = currentFontSize * 1.05
          const padding = Math.round(currentFontSize * 0.4)
          const lines = (text ?? '').split(/\r?\n/)
          let textWidth = 0
          if (ctx) {
            ctx.font = `${currentFontSize}px Inter`
            lines.forEach((line) => {
              const w = ctx.measureText(line).width
              if (w > textWidth) textWidth = w
            })
          }
          const textHeight = lines.length * lineHeight
          const newX2 = x1 + textWidth + padding * 2
          const newY2 = y1 + textHeight + padding * 2
          elementsCopy[id] = { ...existing, x1, y1, x2: newX2, y2: newY2, text } as TextElement
        }
        break
      }
      default:
        throw new Error(`Type not recognised: ${type}`)
    }
    setElements(elementsCopy, true)
  }

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (action === 'writing') return
    if (tool === 'text' && textInputRef.current && document.activeElement === textInputRef.current) return
    const canvas = event.currentTarget
    const { x, y } = getCanvasCoords(canvas, event.clientX, event.clientY)
    if (tool === 'selection') {
      const element = getElementAtPosition(x, y, elements)
      if (!element) {
        setSelectedElement(null)
        setSelectedIds([])
        return
      }
      const isMulti = event.shiftKey
      if (element.type === 'text' && event.detail === 2) {
        const offsetX = x - element.x1
        const offsetY = y - element.y1
        setSelectedElement({ ...element, offsetX, offsetY })
        setSelectedIds([element.id])
        setElements((prevState) => prevState)
        const { x: viewportLeft, y: viewportTop } = canvasToViewport(canvas, element.x1, element.y1)
        const rect = containerRef.current?.getBoundingClientRect()
        const left = rect ? viewportLeft - rect.left : viewportLeft
        const top = rect ? viewportTop - rect.top - 2 : viewportTop - 2
        setTextareaViewport({ left, top })
        setAction('writing')
        return
      }
      if (element.type === 'pencil') {
        const xOffsets = element.points.map((point) => x - point.x)
        const yOffsets = element.points.map((point) => y - point.y)
        setSelectedElement({ ...element, xOffsets, yOffsets })
      } else {
        const offsetX = x - element.x1
        const offsetY = y - element.y1
        setSelectedElement({ ...element, offsetX, offsetY })
      }
      setSelectedIds((prev) => {
        if (!isMulti) return [element.id]
        return prev.includes(element.id) ? prev.filter((id) => id !== element.id) : [...prev, element.id]
      })
      setElements((prevState) => prevState)
      setAction(element.position === 'inside' ? 'moving' : 'resizing')
    } else if (tool === 'text') {
      const hit = getElementAtPosition(x, y, elements)
      if (hit?.type === 'text') {
        const offsetX = x - hit.x1
        const offsetY = y - hit.y1
        setSelectedElement({ ...hit, offsetX, offsetY })
        setSelectedIds([hit.id])
        setElements((prevState) => prevState)
        const { x: viewportLeft, y: viewportTop } = canvasToViewport(canvas, hit.x1, hit.y1)
        const rect = containerRef.current?.getBoundingClientRect()
        const left = rect ? viewportLeft - rect.left : viewportLeft
        const top = rect ? viewportTop - rect.top - 2 : viewportTop - 2
        setTextareaViewport({ left, top })
        setAction('writing')
        return
      }
      const id = elements.length
      let element = createElement(id, x, y, x, y, tool, activeColor) as TextElement
      element = { ...element, fontSize: getDefaultTextFontSizeForCanvas(canvasWidth, canvasHeight) }
      setElements((prevState: DrawElement[]) => [...prevState, element])
      setSelectedElement(element)
      setSelectedIds([element.id])
      const { x: viewportLeft, y: viewportTop } = canvasToViewport(canvas, x, y)
      const rect = containerRef.current?.getBoundingClientRect()
      const left = rect ? viewportLeft - rect.left : viewportLeft
      const top = rect ? viewportTop - rect.top - 2 : viewportTop - 2
      setTextareaViewport({ left, top })
      setAction('writing')
    } else {
      const id = elements.length
      const element = createElement(id, x, y, x, y, tool, activeColor)
      setElements((prevState: DrawElement[]) => [...prevState, element])
      setSelectedElement(element)
      setSelectedIds([element.id])
      setAction('drawing')
    }
  }

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = event.currentTarget
    const { x, y } = getCanvasCoords(canvas, event.clientX, event.clientY)
    if (tool === 'selection') {
      const element = getElementAtPosition(x, y, elements)
      event.currentTarget.style.cursor = element ? cursorForPosition(element.position) : 'default'
    }
    if (action === 'drawing') {
      const index = elements.length - 1
      const el = elements[index]
      const x1 = el.type === 'pencil' ? el.points[0].x : el.x1
      const y1 = el.type === 'pencil' ? el.points[0].y : el.y1
      const drawTool = tool === 'selection' ? 'line' : tool
      updateElement(index, x1, y1, x, y, drawTool)
    } else if (action === 'moving' && selectedElement) {
      if (selectedElement.type === 'pencil') {
        const xOffsets = selectedElement.xOffsets ?? []
        const yOffsets = selectedElement.yOffsets ?? []
        const newPoints = selectedElement.points.map((_, idx) => ({
          x: x - xOffsets[idx],
          y: y - yOffsets[idx],
        }))
        const elementsCopy = [...elements]
        const existing = elementsCopy[selectedElement.id] as PencilElement
        elementsCopy[selectedElement.id] = { ...existing, points: newPoints }
        setElements(elementsCopy, true)
      } else {
        const { id, x1, x2, y1, y2, type } = selectedElement
        const offsetX = selectedElement.offsetX ?? 0
        const offsetY = selectedElement.offsetY ?? 0
        const width = x2 - x1
        const height = y2 - y1
        const newX1 = x - offsetX
        const newY1 = y - offsetY
        const moveOptions = type === 'text' ? { text: selectedElement.text } : undefined
        updateElement(id, newX1, newY1, newX1 + width, newY1 + height, type, moveOptions)
      }
    } else if (action === 'resizing' && selectedElement && selectedElement.type !== 'pencil') {
      const { id, type, position } = selectedElement
      const position_ = position ?? 'inside'
      const coords =
        'x1' in selectedElement
          ? { x1: selectedElement.x1, y1: selectedElement.y1, x2: selectedElement.x2, y2: selectedElement.y2 }
          : null
      if (coords) {
        const resized = resizedCoordinates(x, y, position_, coords)
        if (resized) {
          const opts = selectedElement.type === 'text' ? { text: selectedElement.text } : undefined
          updateElement(id, resized.x1, resized.y1, resized.x2, resized.y2, type, opts)
        }
      }
    }
  }

  const handleMouseUp = () => {
    if (selectedElement) {
      const index = selectedElement.id
      const el = elements[index]
      if ((action === 'drawing' || action === 'resizing') && adjustmentRequired(el.type)) {
        const { x1, y1, x2, y2 } = adjustElementCoordinates(el as LineOrRectElement)
        updateElement(el.id, x1, y1, x2, y2, el.type)
      }
    }
    if (action === 'writing') return
    setAction('none')
  }

  const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    if (!selectedElement || selectedElement.type !== 'text') return
    const { id, x1, y1, type } = selectedElement
    const text = (event.target as HTMLDivElement).innerText ?? ''
    setTextareaViewport(null)
    setAction('none')
    setSelectedElement(null)
    updateElement(id, x1, y1, null, null, type, { text })
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        border: '1px solid blue',
        marginTop: '0px',
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        position: 'relative',
        zIndex: 1000,
      }}
    >
      <DrawingToolbar
        tool={tool}
        setTool={setTool}
        activeColor={activeColor}
        setActiveColor={setActiveColor}
        colorMenuOpen={colorMenuOpen}
        setColorMenuOpen={setColorMenuOpen}
        colorDropdownRef={colorDropdownRef}
        undo={undo}
        redo={redo}
        deleteSelectedElement={deleteSelectedElement}
        selectedElement={selectedElement}
        action={action}
        takeCanvasScreenshot={takeCanvasScreenshot}
      />
      <canvas
        ref={canvasRef}
        id="canvas"
        width={canvasWidth}
        height={canvasHeight}
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          display: 'block',
          cursor: tool === 'pencil' ? `url("${PENCIL_CURSOR_SVG}") 2 22, crosshair` : undefined,
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        Canvas
      </canvas>
      <TextEditorOverlay
        visible={action === 'writing' && selectedElement?.type === 'text'}
        textareaViewport={textareaViewport}
        selectedElement={selectedElement?.type === 'text' ? selectedElement : null}
        activeColor={activeColor}
        textInputRef={textInputRef}
        onBlur={handleBlur}
      />
    </div>
  )
}

export default DrawingTool
