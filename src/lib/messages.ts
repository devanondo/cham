import type { LoginResponse } from '@/store/slices/authSlice'
import type { WorkspaceResponse } from '@/types/workspace.type'

// ─── Message Types ────────────────────────────────────────────────────────────

export type AppMessage =
  | { type: 'AUTH_STATE_CHANGED'; payload: { access_token: string; user: LoginResponse['user'] } | null }
  | { type: 'WORKSPACE_STATE_CHANGED'; payload: WorkspaceResponse }
  | { type: 'GET_AUTH_STATE' }
  | { type: 'GET_WORKSPACE_STATE' }
  | { type: 'LOGOUT' }

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Send a message to the background service worker */
export const sendToBackground = (message: AppMessage): Promise<unknown> =>
  chrome.runtime.sendMessage(message)

/** Broadcast a message to all active content script tabs */
export const broadcastToTabs = (message: AppMessage): void => {
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      if (tab.id != null) {
        chrome.tabs.sendMessage(tab.id, message).catch(() => {
          // Tab may not have content script — ignore
        })
      }
    }
  })
}
