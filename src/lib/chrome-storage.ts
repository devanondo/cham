const get = <T>(key: string): Promise<T | null> =>
  new Promise((resolve) => {
    chrome.storage.local.get(key, (result) => {
      resolve((result[key] as T) ?? null)
    })
  })

const set = (key: string, value: unknown): Promise<void> =>
  new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, resolve)
  })

const remove = (key: string): Promise<void> =>
  new Promise((resolve) => {
    chrome.storage.local.remove(key, resolve)
  })

export const chromeStorage = { get, set, remove }
