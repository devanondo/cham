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

chrome.runtime.onMessage.addListener((message: unknown, _sender, _sendResponse) => {
  if (
    typeof message !== 'object' ||
    message === null ||
    !('type' in message) ||
    (message as { type?: string }).type !== 'REQUEST_CAPTURE_AFTER_SELECTION'
  ) {
    return
  }

  const payload = message as CaptureAfterSelectionMessage

  chrome.tabs.captureVisibleTab({ format: 'png' }, (dataUrl) => {
    if (chrome.runtime.lastError) {
      console.error('Error capturing visible tab:', chrome.runtime.lastError.message)
      return
    }

    if (!dataUrl) return

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTabId = tabs[0]?.id
      if (!activeTabId) return

      const responseMessage: AreaCaptureReadyMessage = {
        type: 'AREA_CAPTURE_READY',
        imageUrl: dataUrl,
        selection: payload.selection,
        viewport: payload.viewport,
      }

      chrome.tabs.sendMessage(activeTabId, responseMessage)
    })
  })
})

