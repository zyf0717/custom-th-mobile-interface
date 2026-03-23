import { ref } from 'vue'

export function useFavorites({ storageKey, logEvent }) {
  const favoriteSongIds = ref(new Set())

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

  function syncFavoriteSongIds() {
    const nextIds = readFavorites()
      .map((song) => (song?.id ? String(song.id) : ''))
      .filter(Boolean)

    favoriteSongIds.value = new Set(nextIds)
  }

  function isFavoriteSong(songId) {
    return favoriteSongIds.value.has(String(songId))
  }

  function toggleFavoriteSong(song) {
    if (!song || !song.id) {
      return
    }

    const songId = String(song.id)
    const favorites = readFavorites()
    const isExistingFavorite = favorites.some((entry) => String(entry?.id || '') === songId)

    if (isExistingFavorite) {
      const remaining = favorites.filter((entry) => String(entry?.id || '') !== songId)
      window.localStorage.setItem(storageKey, JSON.stringify(remaining))
      syncFavoriteSongIds()
      logEvent?.(`Removed favorite song ${songId}`)
      return
    }

    const nextFavorites = favorites.filter((entry) => String(entry?.id || '') !== songId)

    nextFavorites.push({
      id: songId,
      name: song.name || '',
      singer: song.singer || '',
      singerPic: song.singerPic || '',
      cloud: Boolean(song.cloud),
      savedAt: new Date().toISOString(),
    })

    window.localStorage.setItem(storageKey, JSON.stringify(nextFavorites))
    syncFavoriteSongIds()
    logEvent?.(`Favorited song ${songId}`)
  }

  return {
    isFavoriteSong,
    syncFavoriteSongIds,
    toggleFavoriteSong,
  }
}
