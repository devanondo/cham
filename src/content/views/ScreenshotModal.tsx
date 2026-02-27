import { Circle, X } from 'lucide-react'
import type { FC } from 'react'

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
    <div style={overlayStyle} onClick={handleBackdropClick}>
      <div style={contentStyle}>
        <div
          style={{
            display: 'flex',
            gap: '24px',
            height: '100%',
          }}
        >
          <div style={imageContainerStyle}>
            {/* Main working image: the selected / cropped area */}
            <div
              className=""
              style={{
                flexShrink: 0,
              }}
            >
              <img src={imageUrl} alt="Captured screenshot" style={imageStyle} />
            </div>

            {/* Optional small preview of the original full screenshot */}
            {originalImageUrl && (
              <div
                style={{
                  position: 'absolute',
                  right: 16,
                  bottom: 16,
                  width: 200,
                  height: 120,
                  borderRadius: 8,
                  overflow: 'hidden',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.35)',
                  border: '1px solid rgba(15, 23, 42, 0.4)',
                  background: '#020617',
                }}
              >
                <img
                  src={originalImageUrl}
                  alt="Original full screenshot"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              </div>
            )}

            {/* Reserved space for future image editing toolbar */}
            <div className="" style={toolbarContainerStyle}>
              <div className="" style={toolbarItemStyle}>
                <Circle size={20} />
              </div>
            </div>
          </div>
          <div style={rightSideStyle}>
            <h2 className="">Title</h2>
          </div>
        </div>

        <button type="button" aria-label="Close screenshot" style={closeButtonStyle} onClick={onClose}>
          <X />
        </button>
      </div>
    </div>
  )
}

export default ScreenshotModal

const toolbarContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
}
const toolbarItemStyle: React.CSSProperties = {
  width: '40px',
  height: '40px',
  border: '1px solid green',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.6)',
  zIndex: 2147483647,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backdropFilter: 'blur(2px)',
}

const contentStyle: React.CSSProperties = {
  position: 'relative',
  maxWidth: '90vw',
  width: '100%',
  maxHeight: '90vh',
  height: '100%',
  background: '#fff',
  borderRadius: 12,
  overflow: 'hidden',
  boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
  border: '1px solid rgba(255,255,255,0.08)',
}

const imageStyle: React.CSSProperties = {
  display: 'block',
  // width: '100%',
  // height: '100%',
  objectFit: 'contain',
}

const closeButtonStyle: React.CSSProperties = {
  position: 'absolute',
  top: 8,
  right: 8,
  width: 32,
  height: 32,
  borderRadius: 9999,
  border: 'none',
  background: 'rgba(15, 23, 42, 0.9)',
  color: '#e5e7eb',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
  padding: '2px',
}

const rightSideStyle: React.CSSProperties = {
  width: '420px',
  height: 'auto',
  padding: '16px',
  borderLeft: '1px solid #e5e7eb',
}

const imageContainerStyle: React.CSSProperties = {
  flex: 1,
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  flexDirection: 'column',
  gap: '16px',
  justifyContent: 'space-between',
  padding: '16px',
}
