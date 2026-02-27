import type { FC } from 'react'

/**
 * Full-screen overlay that displays a captured screenshot on top of the page.
 * This lives in the content script React tree and is controlled via props.
 */
type ScreenshotModalProps = {
  /** Data URL of the captured screenshot (png / jpeg). */
  imageUrl: string
  /** Called when the user closes the modal (clicks X or backdrop). */
  onClose: () => void
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
  maxHeight: '90vh',
  background: '#111827',
  borderRadius: 12,
  overflow: 'hidden',
  boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
  border: '1px solid rgba(255,255,255,0.08)',
}

const imageStyle: React.CSSProperties = {
  display: 'block',
  maxWidth: '100%',
  maxHeight: '100%',
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
  fontSize: 20,
  lineHeight: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
}

const ScreenshotModal: FC<ScreenshotModalProps> = ({ imageUrl, onClose }) => {
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
        <img src={imageUrl} alt="Captured screenshot" style={imageStyle} />
        <button
          type="button"
          aria-label="Close screenshot"
          style={closeButtonStyle}
          onClick={onClose}
        >
          ×
        </button>
      </div>
    </div>
  )
}

export default ScreenshotModal

