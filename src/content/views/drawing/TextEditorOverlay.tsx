import type { TextElement } from './types'
import { DEFAULT_TEXT_FONT_SIZE } from './constants'

type TextEditorOverlayProps = {
  visible: boolean
  textareaViewport: { left: number; top: number } | null
  selectedElement: TextElement | null
  activeColor: string
  textInputRef: React.RefObject<HTMLDivElement | null>
  onBlur: (e: React.FocusEvent<HTMLDivElement>) => void
}

export const TextEditorOverlay = ({
  visible,
  textareaViewport,
  selectedElement,
  activeColor,
  textInputRef,
  onBlur,
}: TextEditorOverlayProps) => {
  if (!visible || !selectedElement || !textareaViewport) return null
  const left = Number.isFinite(textareaViewport.left) ? textareaViewport.left : 0
  const top = Number.isFinite(textareaViewport.top) ? textareaViewport.top : 0
  const fontSize = selectedElement.fontSize ?? DEFAULT_TEXT_FONT_SIZE
  const borderColor = selectedElement.stroke ?? activeColor
  const lineHeight = fontSize * 1.1
  const padding = Math.round(fontSize * 0.4)
  return (
    <div
      ref={textInputRef}
      className="drawing-tools__text-input"
      contentEditable
      suppressContentEditableWarning
      onBlur={onBlur}
      data-placeholder="Type here..."
      style={{
        position: 'absolute',
        left,
        top,
        minWidth: 80,
        minHeight: 24,
        fontSize: `${fontSize}px`,
        lineHeight: `${lineHeight}px`,
        margin: 0,
        padding,
        border: `1px solid ${borderColor}`,
        borderRadius: 0,
        outline: 'none',
        overflow: 'auto',
        background: selectedElement.stroke ?? activeColor,
        color: '#ffffff',
        zIndex: 9999,
        pointerEvents: 'auto',
        whiteSpace: 'pre-wrap',
      }}
    />
  )
}
