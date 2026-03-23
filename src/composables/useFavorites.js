import { ref } from 'vue'

export function useFavorites({ storageKey, logEvent }) {
  const favoriteSongIds = ref(new Set())
  const favoriteSongs = ref([])

  function readFavorites() {
    const saved = window.localStorage.getItem(storageKey)

    if (!saved) {
      return []
    }

    try {
      const parsed = JSON.parse(saved)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  function normalizeFavoriteSong(song) {
    const songId = String(song?.id || '').trim()

    if (!songId) {
      return null
    }

    return {
      id: songId,
      name: String(song?.name || ''),
      singer: String(song?.singer || ''),
      singerPic: String(song?.singerPic || ''),
      cloud: Boolean(song?.cloud),
      savedAt: typeof song?.savedAt === 'string' && song.savedAt ? song.savedAt : new Date().toISOString(),
    }
  }

  function normalizeFavoritesList(entries) {
    const normalizedFavorites = []
    const seenIds = new Set()

    for (const entry of Array.isArray(entries) ? entries : []) {
      const normalizedEntry = normalizeFavoriteSong(entry)

      if (!normalizedEntry || seenIds.has(normalizedEntry.id)) {
        continue
      }

      seenIds.add(normalizedEntry.id)
      normalizedFavorites.push(normalizedEntry)
    }

    return normalizedFavorites
  }

  function writeFavorites(nextFavorites) {
    window.localStorage.setItem(storageKey, JSON.stringify(nextFavorites))
    favoriteSongs.value = nextFavorites
    favoriteSongIds.value = new Set(nextFavorites.map((song) => song.id))
  }

  function syncFavoriteSongIds() {
    const savedFavorites = readFavorites()
    const nextFavorites = normalizeFavoritesList(savedFavorites)

    if (JSON.stringify(savedFavorites) !== JSON.stringify(nextFavorites)) {
      writeFavorites(nextFavorites)
      return
    }

    favoriteSongs.value = nextFavorites
    favoriteSongIds.value = new Set(nextFavorites.map((song) => song.id))
  }

  function isFavoriteSong(songId) {
    return favoriteSongIds.value.has(String(songId))
  }

  function toggleFavoriteSong(song) {
    if (!song || !song.id) {
      return
    }

    const songId = String(song.id)
    const favorites = normalizeFavoritesList(readFavorites())
    const isExistingFavorite = favorites.some((entry) => String(entry?.id || '') === songId)

    if (isExistingFavorite) {
      const remaining = favorites.filter((entry) => String(entry?.id || '') !== songId)
      writeFavorites(remaining)
      logEvent?.(`Removed favorite song ${songId}`)
      return
    }

    const normalizedSong = normalizeFavoriteSong(song)

    if (!normalizedSong) {
      return
    }

    const nextFavorites = favorites.filter((entry) => String(entry?.id || '') !== songId)

    nextFavorites.push(normalizedSong)
    writeFavorites(nextFavorites)
    logEvent?.(`Favorited song ${songId}`)
  }

  function exportFavoriteSongs() {
    return JSON.stringify(normalizeFavoritesList(favoriteSongs.value), null, 2)
  }

  function importFavoriteSongs(entries) {
    if (!Array.isArray(entries)) {
      throw new Error('Favorites upload must contain a JSON array.')
    }

    const existingFavorites = normalizeFavoritesList(readFavorites())
    const nextFavorites = [...existingFavorites]
    const seenIds = new Set(existingFavorites.map((song) => song.id))
    let addedCount = 0
    let duplicateCount = 0
    let invalidCount = 0

    for (const entry of entries) {
      const normalizedEntry = normalizeFavoriteSong(entry)

      if (!normalizedEntry) {
        invalidCount += 1
        continue
      }

      if (seenIds.has(normalizedEntry.id)) {
        duplicateCount += 1
        continue
      }

      seenIds.add(normalizedEntry.id)
      nextFavorites.push(normalizedEntry)
      addedCount += 1
    }

    writeFavorites(nextFavorites)
    logEvent?.(`Imported favorites: ${addedCount} added, ${duplicateCount} duplicates skipped, ${invalidCount} invalid skipped`)

    return {
      addedCount,
      duplicateCount,
      invalidCount,
      totalCount: nextFavorites.length,
    }
  }

  return {
    favoriteSongs,
    exportFavoriteSongs,
    importFavoriteSongs,
    isFavoriteSong,
    syncFavoriteSongIds,
    toggleFavoriteSong,
  }
}
