import { X } from 'lucide-react'
import { useRef, type FC } from 'react'
import './ScreenshotModal.css'
import DrawingTool from './DrawingTools'
import TextEditor from './right-side-actions/text-editor'
import type { DrawingToolHandle } from './drawing/types'

type ScreenshotModalProps = {
  imageUrl: string
  originalImageUrl?: string | null
  onClose: () => void
}

const ScreenshotModal: FC<ScreenshotModalProps> = ({ imageUrl, originalImageUrl, onClose }) => {
  const drawingRef = useRef<DrawingToolHandle>(null)

  const handleBackdropClick: React.MouseEventHandler<HTMLDivElement> = (event) => {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  const captureCanvas = (): File | null => drawingRef.current?.captureAsFile() ?? null

  return (
    <div className="screenshot-modal__overlay" onClick={handleBackdropClick}>
      <div className="screenshot-modal__content">
        <div className="screenshot-modal__layout">
          <div className="screenshot-modal__image-container">
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
              <DrawingTool ref={drawingRef} imageUrl={imageUrl} />
            </div>

            {originalImageUrl && (
              <div
                className=""
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  overflow: 'hidden',
                  gap: 10,
                }}
              >
                <div className="screenshot-modal__preview">
                  <img
                    src={originalImageUrl}
                    alt="Original full screenshot"
                    className="screenshot-modal__preview-image"
                  />
                </div>

                <h3 className="">Original Image</h3>
              </div>
            )}
          </div>
          <div className="screenshot-modal__right-side">
            <TextEditor captureCanvas={captureCanvas} onClose={onClose} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ScreenshotModal
