import Logo from '@/assets/crx.svg'
import { useEffect, useState } from 'react'
import './App.css'
import ScreenshotModal from './ScreenshotModal'
import ScreenSelectionOverlay from './ScreenSelectionOverlay'

/**
 * Root React component rendered by the content script.
 * - Renders a small floating button (existing CRXJS demo UI).
 * - Listens for messages from the extension popup to:
 *   - Start an area selection flow on top of the page.
 *   - Show the final (cropped) screenshot inside a modal editor.
 */
function App() {
  const [showDemo, setShowDemo] = useState(false)

  /**
   * Original full screenshot as captured from the popup.
   * This can be retained "in the background" while the user works with
   * a cropped / edited version.
   */
  const [originalScreenshotUrl, setOriginalScreenshotUrl] = useState<string | null>(null)

  /**
   * Cropped / active screenshot that is currently opened in the editor modal.
   */
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null)

  /**
   * Whether the user is currently selecting an area on top of the page.
   */
  const [isSelecting, setIsSelecting] = useState(false)

  type SelectionRect = {
    x: number
    y: number
    width: number
    height: number
  }

  type ViewportSize = {
    width: number
    height: number
  }

  const cropImageFromSelection = (imageUrl: string, selection: SelectionRect, viewport: ViewportSize) => {
    return new Promise<string>((resolve, reject) => {
      const img = new Image()

      img.onload = () => {
        const { naturalWidth, naturalHeight } = img

        if (!naturalWidth || !naturalHeight) {
          reject(new Error('Image has invalid dimensions'))
          return
        }

        const scaleX = naturalWidth / viewport.width
        const scaleY = naturalHeight / viewport.height

        const srcX = Math.max(0, selection.x * scaleX)
        const srcY = Math.max(0, selection.y * scaleY)
        const srcWidth = Math.max(1, selection.width * scaleX)
        const srcHeight = Math.max(1, selection.height * scaleY)

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

      img.onerror = (err) => {
        reject(err instanceof Error ? err : new Error('Failed to load image'))
      }

      img.src = imageUrl
    })
  }

  useEffect(() => {
    /**
     * Handle messages from the popup/background.
     * We support:
     * - START_AREA_SELECTION: enable selection overlay; screenshot is taken
     *   AFTER selection is finished, so it reflects the latest scroll.
     * - AREA_CAPTURE_READY: background has captured the full screenshot for
     *   the current viewport + scroll; we crop it to the selected area and
     *   open the modal.
     * - OPEN_CAPTURE_MODAL: directly open modal with provided image.
     */
    const handleMessage = (message: unknown) => {
      if (typeof message !== 'object' || message === null || !('type' in message)) return

      const payload = message as {
        type?: string
        imageUrl?: string
        selection?: SelectionRect
        viewport?: ViewportSize
      }

      if (payload.type === 'OPEN_CAPTURE_MODAL' && typeof payload.imageUrl === 'string') {
        // Direct modal open (no area selection).
        setScreenshotUrl(payload.imageUrl)
        return
      }

      if (payload.type === 'START_AREA_SELECTION') {
        // Enter selection mode; screenshot will be captured later by background.
        setIsSelecting(true)
        return
      }

      if (
        payload.type === 'AREA_CAPTURE_READY' &&
        typeof payload.imageUrl === 'string' &&
        payload.selection &&
        payload.viewport
      ) {
        // Background has captured the current visible tab for the active
        // viewport/scroll. Use the selection + viewport info to crop the
        // selected area from this full screenshot.
        setOriginalScreenshotUrl(payload.imageUrl)

        cropImageFromSelection(payload.imageUrl, payload.selection, payload.viewport)
          .then((croppedUrl) => {
            setScreenshotUrl(croppedUrl)
          })
          .catch((error) => {
            console.error('Failed to crop image from selection:', error)
          })
      }
    }

    chrome.runtime.onMessage.addListener(handleMessage)

    // Cleanup the listener when the React tree is unmounted.
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage)
    }
  }, [])

  const toggleDemo = () => setShowDemo((prev) => !prev)

  return (
    <>
      <div className="popup-container">
        {showDemo && (
          <div className={`popup-content ${showDemo ? 'opacity-100' : 'opacity-0'}`}>
            <h1>HELLO CRXJS</h1>
          </div>
        )}
        <button className="toggle-button" onClick={toggleDemo}>
          <img src={Logo} alt="CRXJS logo" className="button-icon" />
        </button>
      </div>

      {/* Area selection overlay on top of the page. */}
      {isSelecting && (
        <ScreenSelectionOverlay
          onCancel={() => {
            setIsSelecting(false)
          }}
          onSelectionComplete={(selection, viewport) => {
            // Once the user has finished selecting an area, ask the
            // background service worker to capture the current visible tab.
            // It will respond with the full screenshot for this viewport +
            // scroll position, which we then crop to this selection.
            setIsSelecting(false)

            chrome.runtime.sendMessage({
              type: 'REQUEST_CAPTURE_AFTER_SELECTION',
              selection,
              viewport,
            })
          }}
        />
      )}

      {/* Modal editor that works with the selected (or full) screenshot. */}
      {screenshotUrl && (
        <ScreenshotModal
          imageUrl={screenshotUrl}
          originalImageUrl={originalScreenshotUrl}
          onClose={() => {
            setScreenshotUrl(null)
          }}
        />
      )}
    </>
  )
}

export default App
