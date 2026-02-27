import './App.css'
import Header from './_components/header'

export default function App() {
  const handleCapture = () => {
    // Tell the content script to start area selection.
    // The actual screenshot will be captured AFTER the user finishes
    // selecting the area (from the background service worker), so the
    // image always reflects the current scroll position.
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTabId = tabs[0]?.id
      if (!activeTabId) return

      chrome.tabs.sendMessage(activeTabId, {
        type: 'START_AREA_SELECTION',
      })
    })

    // Close the popup once the capture flow has been started.
    window.close()
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
