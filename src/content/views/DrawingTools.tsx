import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import rough from 'roughjs/bundled/rough.esm'
import './ScreenshotModal.css'
import type { DrawElement, LineOrRectElement, PencilElement, SelectedElement, TextElement } from './drawing/types'
import type { ActionType, PositionType, ToolType } from './drawing/types'
import { DEFAULT_TEXT_FONT_SIZE, MAX_TEXT_FONT_SIZE, MIN_TEXT_FONT_SIZE, PENCIL_CURSOR_SVG } from './drawing/constants'
import { getCanvasCoords, canvasToViewport } from './drawing/coordinates'
import { getElementAtPosition } from './drawing/hitTest'
import {
  adjustmentRequired,
  adjustElementCoordinates,
  cursorForPosition,
  drawSelectionIndicator,
  drawSelectionIndicatorRect,
  getBoundingBox,
  getGroupBoundingBox,
  positionInRect,
  rectsIntersect,
  resizedCoordinates,
} from './drawing/resize'
import { createElement, drawElement, getDefaultTextFontSizeForCanvas } from './drawing/elements'
import { useHistory } from './drawing/useHistory'
import { DrawingToolbar } from './drawing/DrawingToolbar'
import { TextEditorOverlay } from './drawing/TextEditorOverlay'
import type { DrawingToolHandle, DrawingToolProps } from './drawing/types'

const DrawingTool = forwardRef<DrawingToolHandle, DrawingToolProps>(({ imageUrl }, ref) => {
  const [elements, setElements, undo, redo] = useHistory<DrawElement[]>([])
  const [action, setAction] = useState<ActionType>('none')
  const [tool, setTool] = useState<ToolType>('text')
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  /** Marquee selection box in canvas coords (when dragging to select multiple). */
  const [selectionMarquee, setSelectionMarquee] = useState<{
    startX: number
    startY: number
    endX: number
    endY: number
  } | null>(null)
  const textInputRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  /** When moving multiple: mouse start and initial bounds of each selected element */
  const moveInitialRef = useRef<{
    mouseX: number
    mouseY: number
    bounds: Map<number, { x1: number; y1: number; x2: number; y2: number } | { points: { x: number; y: number }[] }>
  } | null>(null)
  /** When resizing multiple: group box and position at start, and initial bounds of each selected element */
  const resizeInitialRef = useRef<{
    groupBox: { x1: number; y1: number; x2: number; y2: number }
    position: PositionType
    bounds: Map<number, { x1: number; y1: number; x2: number; y2: number } | { points: { x: number; y: number }[] }>
  } | null>(null)
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
      const idsToDraw = selectedIds.length > 0 ? selectedIds : selectedElement ? [selectedElement.id] : []
      if (idsToDraw.length > 1) {
        const groupBox = getGroupBoundingBox(idsToDraw, elements)
        if (groupBox) drawSelectionIndicatorRect(context, groupBox.x1, groupBox.y1, groupBox.x2, groupBox.y2)
      } else {
        idsToDraw.forEach((id) => {
          const el = elements.find((e) => e.id === id)
          if (el) drawSelectionIndicator(context, el)
        })
      }
    }
    if (tool === 'selection' && action === 'selecting' && selectionMarquee) {
      const x1 = Math.min(selectionMarquee.startX, selectionMarquee.endX)
      const y1 = Math.min(selectionMarquee.startY, selectionMarquee.endY)
      const x2 = Math.max(selectionMarquee.startX, selectionMarquee.endX)
      const y2 = Math.max(selectionMarquee.startY, selectionMarquee.endY)
      const w = x2 - x1
      const h = y2 - y1
      if (w > 0 && h > 0) {
        context.save()
        context.fillStyle = 'rgba(59, 130, 246, 0.12)'
        context.fillRect(x1, y1, w, h)
        context.strokeStyle = 'rgba(59, 130, 246, 0.45)'
        context.lineWidth = 1.5
        context.setLineDash([4, 4])
        context.strokeRect(x1, y1, w, h)
        context.restore()
      }
    }
  }, [
    elements,
    action,
    selectedElement,
    selectedIds,
    selectionMarquee,
    tool,
    backgroundImage,
    canvasWidth,
    canvasHeight,
  ])

  const deleteSelectedElement = () => {
    if (action === 'writing') return
    const idsToDelete =
      selectedIds.length > 0 ? new Set(selectedIds) : selectedElement ? new Set<number>([selectedElement.id]) : null
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

  useImperativeHandle(ref, () => ({
    captureAsFile: () => {
      const canvas = canvasRef.current
      if (!canvas) return null
      try {
        const dataUrl = canvas.toDataURL('image/png')
        const byteString = atob(dataUrl.split(',')[1])
        const arrayBuffer = new ArrayBuffer(byteString.length)
        const uint8Array = new Uint8Array(arrayBuffer)
        for (let i = 0; i < byteString.length; i++) {
          uint8Array[i] = byteString.charCodeAt(i)
        }
        const blob = new Blob([arrayBuffer], { type: 'image/png' })
        return new File([blob], `screenshot-${Date.now()}.png`, { type: 'image/png' })
      } catch (e) {
        console.warn('Canvas capture failed:', e)
        return null
      }
    },
  }))

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
          const idsToDelete = selIds.length > 0 ? new Set(selIds) : sel ? new Set<number>([sel.id]) : new Set<number>()
          const next = elementsRef.current.filter((e) => !idsToDelete.has(e.id)).map((e, i) => ({ ...e, id: i }))
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
      case 'blur':
        if (x2 !== null && y2 !== null) {
          elementsCopy[id] = createElement(id, x1, y1, x2, y2, 'blur')
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
          const lineHeight = newFontSize * 1.1
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
          const lineHeight = currentFontSize * 1.2
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
      const currentSelectedIds = selectedIdsRef.current
      const currentElements = elementsRef.current
      if (currentSelectedIds.length > 1) {
        const groupBox = getGroupBoundingBox(currentSelectedIds, currentElements)
        if (groupBox) {
          const pos = positionInRect(x, y, groupBox)
          if (pos !== null) {
            setSelectionMarquee(null)
            const bounds = new Map<
              number,
              { x1: number; y1: number; x2: number; y2: number } | { points: { x: number; y: number }[] }
            >()
            currentSelectedIds.forEach((id) => {
              const el = currentElements.find((e) => e.id === id)
              if (!el) return
              if (el.type === 'pencil') bounds.set(id, { points: el.points.map((p) => ({ ...p })) })
              else bounds.set(id, { x1: el.x1, y1: el.y1, x2: el.x2, y2: el.y2 })
            })
            if (pos === 'inside') {
              moveInitialRef.current = { mouseX: x, mouseY: y, bounds }
              setAction('moving')
            } else {
              resizeInitialRef.current = { groupBox: { ...groupBox }, position: pos, bounds }
              setAction('resizing')
            }
            return
          }
        }
      }
      const element = getElementAtPosition(x, y, currentElements)
      if (!element) {
        setSelectedElement(null)
        setSelectedIds([])
        setSelectionMarquee({ startX: x, startY: y, endX: x, endY: y })
        setAction('selecting')
        return
      }
      setSelectionMarquee(null)
      moveInitialRef.current = null
      resizeInitialRef.current = null
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
    if (tool === 'selection' && action !== 'selecting') {
      if (selectedIds.length > 1) {
        const groupBox = getGroupBoundingBox(selectedIds, elements)
        if (groupBox) {
          const pos = positionInRect(x, y, groupBox)
          event.currentTarget.style.cursor = pos ? cursorForPosition(pos) : 'default'
        } else event.currentTarget.style.cursor = 'default'
      } else {
        const element = getElementAtPosition(x, y, elements)
        event.currentTarget.style.cursor = element ? cursorForPosition(element.position) : 'default'
      }
    }
    if (action === 'selecting') {
      event.currentTarget.style.cursor = 'crosshair'
      if (selectionMarquee) {
        setSelectionMarquee((prev) => (prev ? { ...prev, endX: x, endY: y } : null))
      }
      return
    }
    if (action === 'drawing') {
      const index = elements.length - 1
      const el = elements[index]
      const x1 = el.type === 'pencil' ? el.points[0].x : el.x1
      const y1 = el.type === 'pencil' ? el.points[0].y : el.y1
      const drawTool = tool === 'selection' ? 'line' : tool
      updateElement(index, x1, y1, x, y, drawTool)
    } else if (action === 'moving') {
      if (moveInitialRef.current) {
        const { mouseX, mouseY, bounds } = moveInitialRef.current
        const deltaX = x - mouseX
        const deltaY = y - mouseY
        const currentElements = elementsRef.current
        setElements(
          currentElements.map((el) => {
            const b = bounds.get(el.id)
            if (!b) return el
            if ('points' in b) {
              return {
                ...el,
                points: b.points.map((p) => ({ x: p.x + deltaX, y: p.y + deltaY })),
              } as PencilElement
            }
            return {
              ...el,
              x1: b.x1 + deltaX,
              y1: b.y1 + deltaY,
              x2: b.x2 + deltaX,
              y2: b.y2 + deltaY,
            } as DrawElement
          }),
          true
        )
      } else if (selectedElement) {
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
      }
    } else if (action === 'resizing') {
      if (resizeInitialRef.current) {
        const { groupBox, position, bounds } = resizeInitialRef.current
        const newBox = resizedCoordinates(x, y, position, groupBox)
        if (newBox) {
          const oldW = groupBox.x2 - groupBox.x1
          const oldH = groupBox.y2 - groupBox.y1
          const newW = newBox.x2 - newBox.x1
          const newH = newBox.y2 - newBox.y1
          if (oldW > 0 && oldH > 0) {
            const scaleX = newW / oldW
            const scaleY = newH / oldH
            const currentElements = elementsRef.current
            setElements(
              currentElements.map((el) => {
                const b = bounds.get(el.id)
                if (!b) return el
                if ('points' in b) {
                  return {
                    ...el,
                    points: b.points.map((p) => ({
                      x: newBox.x1 + (p.x - groupBox.x1) * scaleX,
                      y: newBox.y1 + (p.y - groupBox.y1) * scaleY,
                    })),
                  } as PencilElement
                }
                const nX1 = newBox.x1 + (b.x1 - groupBox.x1) * scaleX
                const nY1 = newBox.y1 + (b.y1 - groupBox.y1) * scaleY
                const nX2 = newBox.x1 + (b.x2 - groupBox.x1) * scaleX
                const nY2 = newBox.y1 + (b.y2 - groupBox.y1) * scaleY
                const scale = (scaleX + scaleY) / 2
                if (el.type === 'text') {
                  const textEl = el as TextElement
                  const newFontSize = Math.round(
                    Math.min(
                      MAX_TEXT_FONT_SIZE,
                      Math.max(MIN_TEXT_FONT_SIZE, (textEl.fontSize ?? DEFAULT_TEXT_FONT_SIZE) * scale)
                    )
                  )
                  return { ...textEl, x1: nX1, y1: nY1, x2: nX2, y2: nY2, fontSize: newFontSize } as TextElement
                }
                return { ...el, x1: nX1, y1: nY1, x2: nX2, y2: nY2 } as DrawElement
              }),
              true
            )
          }
        }
      } else if (selectedElement && selectedElement.type !== 'pencil') {
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
  }

  const handleMouseUp = () => {
    if (action === 'selecting' && selectionMarquee) {
      const x1 = Math.min(selectionMarquee.startX, selectionMarquee.endX)
      const y1 = Math.min(selectionMarquee.startY, selectionMarquee.endY)
      const x2 = Math.max(selectionMarquee.startX, selectionMarquee.endX)
      const y2 = Math.max(selectionMarquee.startY, selectionMarquee.endY)
      const box = { x1, y1, x2, y2 }
      const ids: number[] = []
      elements.forEach((el) => {
        if (rectsIntersect(getBoundingBox(el), box)) ids.push(el.id)
      })
      setSelectedIds(ids)
      selectedIdsRef.current = ids
      const primary = ids.length > 0 ? elements.find((e) => e.id === ids[ids.length - 1]) : null
      setSelectedElement(primary ? ({ ...primary } as SelectedElement) : null)
      setSelectionMarquee(null)
      setAction('none')
      return
    }
    if (action === 'resizing' && resizeInitialRef.current && selectedIds.length > 0) {
      const idsToAdjust = selectedIds
      const elementsCopy = [...elements]
      let changed = false
      idsToAdjust.forEach((id) => {
        const el = elementsCopy.find((e) => e.id === id)
        if (el && adjustmentRequired(el.type)) {
          const { x1, y1, x2, y2 } = adjustElementCoordinates(el as LineOrRectElement)
          const idx = elementsCopy.findIndex((e) => e.id === id)
          if (idx >= 0) {
            elementsCopy[idx] = { ...el, x1, y1, x2, y2 } as DrawElement
            changed = true
          }
        }
      })
      if (changed) setElements(elementsCopy, true)
    } else if (selectedElement) {
      const index = selectedElement.id
      const el = elements[index]
      if ((action === 'drawing' || action === 'resizing') && adjustmentRequired(el.type)) {
        const { x1, y1, x2, y2 } = adjustElementCoordinates(el as LineOrRectElement)
        updateElement(el.id, x1, y1, x2, y2, el.type)
      }
    }
    if (action === 'writing') return
    moveInitialRef.current = null
    resizeInitialRef.current = null
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
        marginTop: '0px',
        position: 'relative',
        zIndex: 1000,
      }}
    >
      <canvas
        ref={canvasRef}
        id="canvas"
        width={canvasWidth}
        height={canvasHeight}
        style={{
          display: 'block',
          width: '100%',
          height: 'auto',
          maxHeight: '70vh',
          cursor: tool === 'pencil' ? `url("${PENCIL_CURSOR_SVG}") 2 22, crosshair` : undefined,
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        Canvas
      </canvas>
      <div
        className=""
        style={{
          display: 'flex',
          justifyContent: 'center',
          height: 'fit-content',
          paddingTop: '10px',
          paddingBottom: '10px',
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
      </div>
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
})

export default DrawingTool
