import { useEffect, useState } from 'react'
import './App.css'
import ScreenshotModal from './ScreenshotModal'
import ScreenSelectionOverlay, { type ImageDisplayInfo, type SelectionRect } from './ScreenSelectionOverlay'

/**
 * Root React component rendered by the content script.
 * - Listens for messages from the extension popup to:
 *   - Start an area selection flow: capture full screenshot first, then show it with selection overlay so the user selects on the image; crop the original image by that selection.
 *   - Show the final (cropped) screenshot inside a modal editor.
 */
function App() {
  /** Original full screenshot (used when selection was drawn on the image). */
  const [originalScreenshotUrl, setOriginalScreenshotUrl] = useState<string | null>(null)
  /** Cropped / active screenshot shown in the editor modal. */
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null)
  /** Whether the selection overlay is visible. */
  const [isSelecting, setIsSelecting] = useState(false)
  /** Full screenshot to show inside the overlay so the user selects on the image. Set when FULL_CAPTURE_READY is received. */
  const [selectionImageUrl, setSelectionImageUrl] = useState<string | null>(null)

  type ViewportSize = { width: number; height: number }

  /** Crop the original image using selection in viewport coords and how the image was displayed (object-fit contain). */
  const cropImageFromSelectionOnImage = (
    imageUrl: string,
    selection: SelectionRect,
    imageDisplayInfo: ImageDisplayInfo
  ) => {
    return new Promise<string>((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const { naturalWidth, naturalHeight } = img
        if (!naturalWidth || !naturalHeight) {
          reject(new Error('Image has invalid dimensions'))
          return
        }
        const { displayRect } = imageDisplayInfo
        // Map viewport selection to image pixel coordinates
        const scaleX = naturalWidth / displayRect.width
        const scaleY = naturalHeight / displayRect.height
        let srcX = Math.max(0, (selection.x - displayRect.left) * scaleX)
        let srcY = Math.max(0, (selection.y - displayRect.top) * scaleY)
        let srcWidth = Math.max(1, selection.width * scaleX)
        let srcHeight = Math.max(1, selection.height * scaleY)
        srcWidth = Math.min(srcWidth, naturalWidth - srcX)
        srcHeight = Math.min(srcHeight, naturalHeight - srcY)
        if (srcWidth < 1 || srcHeight < 1) {
          reject(new Error('Selection outside image'))
          return
        }
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(srcWidth)
        canvas.height = Math.round(srcHeight)
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Could not get 2D context for canvas'))
          return
        }
        ctx.drawImage(img, srcX, srcY, srcWidth, srcHeight, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/png'))
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = imageUrl
    })
  }

  useEffect(() => {
    const handleMessage = (message: unknown) => {
      if (typeof message !== 'object' || message === null || !('type' in message)) return
      const payload = message as { type?: string; imageUrl?: string; selection?: SelectionRect; viewport?: ViewportSize }

      if (payload.type === 'OPEN_CAPTURE_MODAL' && typeof payload.imageUrl === 'string') {
        setScreenshotUrl(payload.imageUrl)
        return
      }

      if (payload.type === 'START_AREA_SELECTION') {
        setIsSelecting(true)
        setSelectionImageUrl(null)
        chrome.runtime.sendMessage({ type: 'REQUEST_FULL_CAPTURE' })
        return
      }

      if (payload.type === 'FULL_CAPTURE_READY' && typeof payload.imageUrl === 'string') {
        setSelectionImageUrl(payload.imageUrl)
      }
    }
    chrome.runtime.onMessage.addListener(handleMessage)
    return () => chrome.runtime.onMessage.removeListener(handleMessage)
  }, [])

  return (
    <>
      <div className="popup-container" />

      {/* Only show selection overlay after we have the captured image, so the capture does not include the overlay. */}
      {isSelecting && selectionImageUrl && (
        <ScreenSelectionOverlay
          imageUrl={selectionImageUrl}
          onCancel={() => {
            setIsSelecting(false)
            setSelectionImageUrl(null)
          }}
          onSelectionComplete={(selection, _viewport, imageDisplayInfo) => {
            if (imageDisplayInfo && selectionImageUrl) {
              setOriginalScreenshotUrl(selectionImageUrl)
              cropImageFromSelectionOnImage(selectionImageUrl, selection, imageDisplayInfo)
                .then((croppedUrl) => {
                  setScreenshotUrl(croppedUrl)
                  setIsSelecting(false)
                  setSelectionImageUrl(null)
                })
                .catch((err) => {
                  console.error('Failed to crop image from selection:', err)
                  setIsSelecting(false)
                  setSelectionImageUrl(null)
                })
            } else {
              setIsSelecting(false)
              setSelectionImageUrl(null)
            }
          }}
        />
      )}

      {screenshotUrl && (
        <ScreenshotModal
          imageUrl={screenshotUrl}
          originalImageUrl={originalScreenshotUrl}
          onClose={() => setScreenshotUrl(null)}
        />
      )}
    </>
  )
}

export default App
