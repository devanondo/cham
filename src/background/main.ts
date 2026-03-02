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

type CaptureAfterSelectionMessage = {
  type: 'REQUEST_CAPTURE_AFTER_SELECTION'
  selection: SelectionRect
  viewport: ViewportSize
}

type AreaCaptureReadyMessage = {
  type: 'AREA_CAPTURE_READY'
  imageUrl: string
  selection: SelectionRect
  viewport: ViewportSize
}

type RequestFullCaptureMessage = { type: 'REQUEST_FULL_CAPTURE' }

type FullCaptureReadyMessage = { type: 'FULL_CAPTURE_READY'; imageUrl: string }

function handleRequestFullCapture(activeTabId: number) {
  chrome.tabs.captureVisibleTab({ format: 'png' }, (dataUrl) => {
    if (chrome.runtime.lastError) {
      console.error('Error capturing visible tab:', chrome.runtime.lastError.message)
      return
    }
    if (!dataUrl) return
    chrome.tabs.sendMessage(activeTabId, {
      type: 'FULL_CAPTURE_READY',
      imageUrl: dataUrl,
    } as FullCaptureReadyMessage)
  })
}

function handleRequestCaptureAfterSelection(payload: CaptureAfterSelectionMessage, activeTabId: number) {
  chrome.tabs.captureVisibleTab({ format: 'png' }, (dataUrl) => {
    if (chrome.runtime.lastError) {
      console.error('Error capturing visible tab:', chrome.runtime.lastError.message)
      return
    }
    if (!dataUrl) return
    chrome.tabs.sendMessage(activeTabId, {
      type: 'AREA_CAPTURE_READY',
      imageUrl: dataUrl,
      selection: payload.selection,
      viewport: payload.viewport,
    } as AreaCaptureReadyMessage)
  })
}

chrome.runtime.onMessage.addListener((message: unknown, _sender, _sendResponse) => {
  if (typeof message !== 'object' || message === null || !('type' in message)) return

  const msg = message as { type: string }
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTabId = tabs[0]?.id
    if (activeTabId == null) return

    if (msg.type === 'REQUEST_FULL_CAPTURE') {
      handleRequestFullCapture(activeTabId)
      return
    }
    if (msg.type === 'REQUEST_CAPTURE_AFTER_SELECTION') {
      handleRequestCaptureAfterSelection(message as CaptureAfterSelectionMessage, activeTabId)
    }
  })
})

