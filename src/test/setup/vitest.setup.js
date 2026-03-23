import { afterEach, vi } from 'vitest'

function ensureLocalStorageApi() {
  if (window.localStorage && typeof window.localStorage.clear === 'function') {
    return
  }

  const store = new Map()
  const localStorageMock = {
    getItem(key) {
      return store.has(key) ? store.get(key) : null
    },
    setItem(key, value) {
      store.set(String(key), String(value))
    },
    removeItem(key) {
      store.delete(key)
    },
    clear() {
      store.clear()
    },
  }

  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: localStorageMock,
  })
}

afterEach(() => {
  document.body.innerHTML = ''
  document.head.innerHTML = ''
  ensureLocalStorageApi()
  window.localStorage.clear()
  vi.restoreAllMocks()
  vi.useRealTimers()
})
