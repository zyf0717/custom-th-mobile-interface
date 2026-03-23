import { describe, expect, it, vi } from 'vitest'

import { useFavorites } from '../../../composables/useFavorites'

const STORAGE_KEY = 'custom-th-mobile-interface-favorites-test'

function ensureLocalStorageApi() {
  if (window.localStorage && typeof window.localStorage.setItem === 'function') {
    return
  }

  const store = new Map()
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
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
    },
  })
}

describe('useFavorites', () => {
  it('syncs IDs from saved favorites and marks songs as favorite', () => {
    ensureLocalStorageApi()
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        { id: '1001', name: 'Song A' },
        { id: 1002, name: 'Song B' },
        { name: 'Missing id' },
      ]),
    )

    const favorites = useFavorites({ storageKey: STORAGE_KEY })
    favorites.syncFavoriteSongIds()

    expect(favorites.isFavoriteSong('1001')).toBe(true)
    expect(favorites.isFavoriteSong(1002)).toBe(true)
    expect(favorites.isFavoriteSong('missing')).toBe(false)
  })

  it('handles malformed local storage values safely', () => {
    ensureLocalStorageApi()
    window.localStorage.setItem(STORAGE_KEY, 'not-json')

    const favorites = useFavorites({ storageKey: STORAGE_KEY })
    favorites.syncFavoriteSongIds()

    expect(favorites.isFavoriteSong('1001')).toBe(false)
  })

  it('adds a song and then removes it when toggled again', () => {
    ensureLocalStorageApi()
    const logEvent = vi.fn()
    const favorites = useFavorites({ storageKey: STORAGE_KEY, logEvent })

    favorites.toggleFavoriteSong({
      id: '2001',
      name: 'Lucky',
      singer: 'Tester',
      singerPic: '26940.jpg',
      cloud: 0,
    })

    const firstSaved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]')
    expect(firstSaved).toHaveLength(1)
    expect(firstSaved[0]).toEqual(
      expect.objectContaining({
        id: '2001',
        name: 'Lucky',
        singer: 'Tester',
        singerPic: '26940.jpg',
        cloud: false,
      }),
    )
    expect(logEvent).toHaveBeenCalledWith('Favorited song 2001')

    favorites.toggleFavoriteSong({ id: '2001' })

    const secondSaved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]')
    expect(secondSaved).toHaveLength(0)
    expect(logEvent).toHaveBeenLastCalledWith('Removed favorite song 2001')
  })
})
