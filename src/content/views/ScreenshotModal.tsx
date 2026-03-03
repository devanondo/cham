import { X } from 'lucide-react'
import type { FC } from 'react'
import './ScreenshotModal.css'
import DrawingTool from './DrawingTools'
import TextEditor from './right-side-actions/text-editor'

/**
 * Full-screen overlay that displays a captured screenshot on top of the page.
 * This lives in the content script React tree and is controlled via props.
 */
type ScreenshotModalProps = {
  /** Data URL of the active / cropped screenshot (png / jpeg). */
  imageUrl: string
  /** Optional original full screenshot to show in a small preview. */
  originalImageUrl?: string | null
  /** Called when the user closes the modal (clicks X or backdrop). */
  onClose: () => void
}

const ScreenshotModal: FC<ScreenshotModalProps> = ({ imageUrl, originalImageUrl, onClose }) => {
  /**
   * Close when the user clicks on the dark backdrop area, but not
   * when they click inside the content card.
   */
  const handleBackdropClick: React.MouseEventHandler<HTMLDivElement> = (event) => {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="screenshot-modal__overlay" onClick={handleBackdropClick}>
      <div className="screenshot-modal__content">
        <div className="screenshot-modal__layout">
          <div className="screenshot-modal__image-container">
            {/* Main working image: the selected / cropped area */}

            <button
              type="button"
              aria-label="Close screenshot"
              className="screenshot-modal__close-button"
              onClick={onClose}
            >
              <X size={16} />
            </button>
            <div
              style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              <DrawingTool imageUrl={imageUrl} />
            </div>

            {/* Optional small preview of the original full screenshot */}
            {originalImageUrl && (
              <div className="screenshot-modal__preview">
                <img
                  src={originalImageUrl}
                  alt="Original full screenshot"
                  className="screenshot-modal__preview-image"
                />
              </div>
            )}
          </div>
          <div className="screenshot-modal__right-side">
            <TextEditor />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ScreenshotModal
