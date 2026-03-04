/**
 * Persistent cookie-like storage using chrome.storage.local with expiry support.
 * - Survives extension reloads, browser restarts, and tab closes
 * - Each value is stored with an expiry timestamp
 * - Expired values are treated as if they don't exist (auto-cleared on read)
 * - Shared across ALL extension contexts (popup, content, background, sidepanel)
 */

const DEFAULT_EXPIRY_DAYS = 7

interface StorageEntry<T> {
  value: T
  expiresAt: number // Unix ms timestamp
}

const get = <T>(key: string): Promise<T | null> =>
  new Promise((resolve) => {
    chrome.storage.local.get(key, (result) => {
      const entry = result[key] as StorageEntry<T> | undefined
      if (!entry) return resolve(null)

      if (Date.now() > entry.expiresAt) {
        chrome.storage.local.remove(key)
        return resolve(null)
      }

      resolve(entry.value)
    })
  })

const set = <T>(key: string, value: T, expiryDays = DEFAULT_EXPIRY_DAYS): Promise<void> =>
  new Promise((resolve) => {
    const entry: StorageEntry<T> = {
      value,
      expiresAt: Date.now() + expiryDays * 24 * 60 * 60 * 1000,
    }
    chrome.storage.local.set({ [key]: entry }, resolve)
  })

const remove = (key: string): Promise<void> =>
  new Promise((resolve) => {
    chrome.storage.local.remove(key, resolve)
  })

const clear = (): Promise<void> =>
  new Promise((resolve) => {
    chrome.storage.local.clear(resolve)
  })

export const cookieStorage = { get, set, remove, clear }
