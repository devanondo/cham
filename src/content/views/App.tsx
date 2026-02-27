import Logo from '@/assets/crx.svg'
import { useEffect, useState } from 'react'
import './App.css'
import ScreenshotModal from './ScreenshotModal'

/**
 * Root React component rendered by the content script.
 * - Renders a small floating button (existing CRXJS demo UI).
 * - Listens for messages from the extension popup to show a screenshot modal.
 */
function App() {
  const [showDemo, setShowDemo] = useState(false)

  /**
   * When a screenshot is captured from the popup, we store its data URL here.
   * Presence of a value controls visibility of the ScreenshotModal component.
   */
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null)

  useEffect(() => {
    /**
     * Handle messages from the popup/background.
     * We care only about OPEN_CAPTURE_MODAL for now.
     */
    const handleMessage = (message: unknown) => {
      if (
        typeof message === 'object' &&
        message !== null &&
        'type' in message &&
        (message as any).type === 'OPEN_CAPTURE_MODAL' &&
        typeof (message as any).imageUrl === 'string'
      ) {
        setScreenshotUrl((message as any).imageUrl)
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

      {screenshotUrl && (
        <ScreenshotModal imageUrl={screenshotUrl} onClose={() => setScreenshotUrl(null)} />
      )}
    </>
  )
}

export default App
