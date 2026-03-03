import { useEffect, useState } from 'react'
import './App.css'
import ScreenshotModal from './ScreenshotModal'
import ScreenSelectionOverlay, { type SelectionRect } from './ScreenSelectionOverlay'
import { setTokenAndUserInfo } from '@/store/slices/authSlice'
import { UserInfoResponse } from '@/types/auth.type'
import { useAppDispatch } from '@/store'

function App() {
  const dispatch = useAppDispatch()
  /** Original full screenshot (full visible tab). */
  const [originalScreenshotUrl, setOriginalScreenshotUrl] = useState<string | null>(null)
  /** Cropped / active screenshot shown in the editor modal. */
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null)
  /** Whether the selection overlay is visible. */
  const [isSelecting, setIsSelecting] = useState(false)

  type ViewportSize = { width: number; height: number }

  /** Crop a captured full-page image using selection in viewport coordinates. */
  const cropImageFromSelectionOnViewport = (imageUrl: string, selection: SelectionRect, viewport: ViewportSize) => {
    return new Promise<string>((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const { naturalWidth, naturalHeight } = img
        if (!naturalWidth || !naturalHeight) {
          reject(new Error('Image has invalid dimensions'))
          return
        }
        // Map viewport selection directly to image pixel coordinates (captureVisibleTab may scale).
        const scaleX = naturalWidth / viewport.width
        const scaleY = naturalHeight / viewport.height
        let srcX = Math.max(0, selection.x * scaleX)
        let srcY = Math.max(0, selection.y * scaleY)
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
      const payload = message as {
        type?: string
        imageUrl?: string
        selection?: SelectionRect
        viewport?: ViewportSize
        access_token?: string
        userInfo?: UserInfoResponse
      }

      if (payload.type === 'OPEN_CAPTURE_MODAL' && typeof payload.imageUrl === 'string') {
        setScreenshotUrl(payload.imageUrl)
        return
      }

      if (payload.type === 'START_AREA_SELECTION') {
        if (payload.access_token && payload.userInfo) {
          dispatch(
            setTokenAndUserInfo({
              access_token: payload.access_token,
              userInfo: payload.userInfo,
            })
          )
        }
        setIsSelecting(true)
        return
      }

      if (
        payload.type === 'AREA_CAPTURE_READY' &&
        typeof payload.imageUrl === 'string' &&
        payload.selection &&
        payload.viewport
      ) {
        setOriginalScreenshotUrl(payload.imageUrl)
        cropImageFromSelectionOnViewport(payload.imageUrl, payload.selection, payload.viewport)
          .then((croppedUrl) => {
            setScreenshotUrl(croppedUrl)
          })
          .catch((err) => {
            console.error('Failed to crop image from selection:', err)
          })
        return
      }
    }
    chrome.runtime.onMessage.addListener(handleMessage)
    return () => chrome.runtime.onMessage.removeListener(handleMessage)
  }, [])

  return (
    <>
      <div className="popup-container" />

      {/* Show selection overlay on top of the live page. Screenshot is captured AFTER selection. */}
      {isSelecting && (
        <ScreenSelectionOverlay
          imageUrl={null}
          onCancel={() => {
            setIsSelecting(false)
          }}
          onSelectionComplete={(selection, viewport) => {
            // Hide the overlay first, then capture on the next frame so it is
            // not included in the screenshot.
            setIsSelecting(false)
            requestAnimationFrame(() => {
              chrome.runtime.sendMessage({
                type: 'REQUEST_CAPTURE_AFTER_SELECTION',
                selection,
                viewport,
              })
            })
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
