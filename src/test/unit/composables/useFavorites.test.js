import { describe, expect, it, vi } from 'vitest'

import { useFavorites } from '../../../composables/useFavorites'

const STORAGE_KEY = 'teoheng-web-app-favorites-test'

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

  it('imports favorites by appending new songs and skipping duplicates', () => {
    ensureLocalStorageApi()
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        { id: '1001', name: 'Song A', singer: 'Singer A', savedAt: '2026-03-23T09:00:00.000Z' },
      ]),
    )
    const logEvent = vi.fn()
    const favorites = useFavorites({ storageKey: STORAGE_KEY, logEvent })

    const result = favorites.importFavoriteSongs([
      { id: '1001', name: 'Song A updated' },
      { id: '1002', name: 'Song B', singer: 'Singer B', cloud: 1 },
      { name: 'Missing id' },
    ])

    const savedFavorites = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]')

    expect(result).toEqual({
      addedCount: 1,
      duplicateCount: 1,
      invalidCount: 1,
      totalCount: 2,
    })
    expect(savedFavorites).toHaveLength(2)
    expect(savedFavorites[0]).toEqual(
      expect.objectContaining({
        id: '1001',
        name: 'Song A',
      }),
    )
    expect(savedFavorites[1]).toEqual(
      expect.objectContaining({
        id: '1002',
        name: 'Song B',
        singer: 'Singer B',
        cloud: true,
      }),
    )
    expect(logEvent).toHaveBeenLastCalledWith('Imported favorites: 1 added, 1 duplicates skipped, 1 invalid skipped')
  })

  it('exports normalized favorites as formatted JSON', () => {
    ensureLocalStorageApi()
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        { id: '1001', name: 'Song A', singer: 'Singer A', cloud: 0 },
        { id: '1001', name: 'Duplicate Song A' },
      ]),
    )

    const favorites = useFavorites({ storageKey: STORAGE_KEY })
    favorites.syncFavoriteSongIds()

    const exportedFavorites = JSON.parse(favorites.exportFavoriteSongs())

    expect(exportedFavorites).toHaveLength(1)
    expect(exportedFavorites[0]).toEqual(
      expect.objectContaining({
        id: '1001',
        name: 'Song A',
        singer: 'Singer A',
        cloud: false,
      }),
    )
  })
})
