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

chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  if (typeof message !== 'object' || message === null || !('type' in message)) return

  const msg = message as { type: string }

  // ─── Capture messages ──────────────────────────────────────────────────────
  if (msg.type === 'REQUEST_FULL_CAPTURE' || msg.type === 'REQUEST_CAPTURE_AFTER_SELECTION') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTabId = tabs[0]?.id
      if (activeTabId == null) return
      if (msg.type === 'REQUEST_FULL_CAPTURE') {
        handleRequestFullCapture(activeTabId)
      } else {
        handleRequestCaptureAfterSelection(message as CaptureAfterSelectionMessage, activeTabId)
      }
    })
    return
  }

  // ─── Auth relay ────────────────────────────────────────────────────────────
  if (msg.type === 'AUTH_STATE_CHANGED' || msg.type === 'LOGOUT') {
    // Relay to all content script tabs
    chrome.tabs.query({}, (tabs) => {
      for (const tab of tabs) {
        if (tab.id != null) {
          chrome.tabs.sendMessage(tab.id, message).catch(() => {})
        }
      }
    })
    return
  }

  if (msg.type === 'GET_AUTH_STATE') {
    chrome.storage.local.get(['access_token', 'user'], (result) => {
      sendResponse({ access_token: result.access_token ?? null, user: result.user ?? null })
    })
    return true // keep channel open for async sendResponse
  }

  // ─── Workspace relay ───────────────────────────────────────────────────────
  if (msg.type === 'WORKSPACE_STATE_CHANGED') {
    chrome.tabs.query({}, (tabs) => {
      for (const tab of tabs) {
        if (tab.id != null) {
          chrome.tabs.sendMessage(tab.id, message).catch(() => {})
        }
      }
    })
    return
  }

  if (msg.type === 'GET_WORKSPACE_STATE') {
    chrome.storage.local.get('workspaces', (result) => {
      sendResponse({ workspaces: result.workspaces ?? null })
    })
    return true
  }
})

