import './App.css'
import Header from './_components/header'

export default function App() {
  const handleCapture = () => {
    // Capture the visible area of the current tab
    chrome.tabs.captureVisibleTab({ format: 'png' }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message)
        return
      }

      if (!dataUrl) return

      // Send the captured image to the active tab so the content script
      // can open it in a modal overlay inside the page.
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTabId = tabs[0]?.id
        if (!activeTabId) return

        chrome.tabs.sendMessage(activeTabId, {
          type: 'OPEN_CAPTURE_MODAL',
          imageUrl: dataUrl,
        })
      })

      // Optionally close the popup after triggering the modal
      window.close()
    })
  }

  return (
    <div className="flex flex-col gap-3 p-3 min-w-[320px]">
      <Header />

      <button
        type="button"
        onClick={handleCapture}
        className="w-full px-3 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium"
      >
        Capture visible tab
      </button>
    </div>
  )
}
