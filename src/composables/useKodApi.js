import { computed, reactive, ref } from 'vue'

export function useKodApi({
  activeBaseUrl,
  searchForm,
  searchState,
  pageInput,
  playlistState,
  singerForm,
  singerState,
  singerPageInput,
  setLastRequest,
  setLastResponse,
  setLastError,
  logDiagnosticEvent,
  searchSongs,
  fetchPlaylist,
  fetchSingers,
  queueSong,
  prioritizeSong,
  deleteSong,
}) {
  const commandBarBusy = ref(false)
  const pendingSongIds = reactive(new Set())
  let playlistRequestSeq = 0
  const queuedSongIds = computed(() => new Set(playlistState.songs.map((song) => String(song.id))))

  function hasConfiguredBaseUrl() {
    return Boolean(activeBaseUrl.value.trim())
  }

  async function runSearch() {
    if (!hasConfiguredBaseUrl()) {
      searchState.loading = false
      searchState.maxPage = null
      searchState.songs = []
      searchState.errorMessage = ''
      setLastResponse('Search skipped: no base URL configured')
      return
    }

    searchState.loading = true
    searchState.errorMessage = ''

    try {
      setLastRequest(
        'SearchServlet',
        `page=${searchState.page} songName="${searchForm.songName.trim()}" singer="${searchForm.singer.trim()}" lang="${searchForm.lang.trim()}" songType="${searchForm.songType.trim()}" sortType="${searchForm.sortType.trim()}"`,
      )
      const response = await searchSongs(activeBaseUrl.value, {
        songName: searchForm.songName.trim(),
        singer: searchForm.singer.trim(),
        songType: searchForm.songType.trim(),
        lang: searchForm.lang.trim(),
        sortType: searchForm.sortType.trim(),
        page: searchState.page,
      })

      searchState.page = response.page
      searchState.maxPage = response.maxPage
      pageInput.value = response.page + 1
      searchState.songs = response.songs
      searchState.errorMessage = ''
      setLastResponse(`Search returned ${response.number} result(s), max page ${response.maxPage ?? 'n/a'}`)
      setLastError('')
      logDiagnosticEvent(`Search returned ${response.number} result(s)`)
    } catch (error) {
      searchState.maxPage = null
      searchState.songs = []
      searchState.errorMessage = 'Unable to load songs. Check the server URL in Setup.'
      setLastError(error instanceof Error ? error.message : String(error))
      setLastResponse('Search failed')
      logDiagnosticEvent(`Search failed`)
      console.error(error)
    } finally {
      searchState.loading = false
    }
  }

  async function refreshPlaylist(force = false) {
    if (playlistState.loading && !force) {
      return
    }

    if (!hasConfiguredBaseUrl()) {
      playlistState.loading = false
      playlistState.songs = []
      setLastResponse('Playlist skipped: no base URL configured')
      return
    }

    const seq = ++playlistRequestSeq
    playlistState.loading = true

    try {
      setLastRequest('PlaylistServlet', 'type=1 onSelectPage=true')
      const response = await fetchPlaylist(activeBaseUrl.value)
      if (seq !== playlistRequestSeq) {
        return
      }
      playlistState.songs = response.songs
      setLastResponse(`Playlist returned ${response.number} item(s)`)
      setLastError('')
    } catch (error) {
      if (seq !== playlistRequestSeq) {
        return
      }
      setLastError(error instanceof Error ? error.message : String(error))
      setLastResponse('Playlist refresh failed')
      logDiagnosticEvent('Playlist refresh failed')
      console.error(error)
    } finally {
      if (seq === playlistRequestSeq) {
        playlistState.loading = false
      }
    }
  }

  async function runSingerSearch() {
    if (!hasConfiguredBaseUrl()) {
      singerState.loading = false
      singerState.maxPage = null
      singerState.singers = []
      singerState.errorMessage = ''
      setLastResponse('Singer search skipped: no base URL configured')
      return
    }

    singerState.loading = true
    singerState.errorMessage = ''

    try {
      setLastRequest('SingerServlet', `page=${singerState.page} singer="${singerForm.singer.trim()}" singerType="${singerForm.singerType}"`)
      const response = await fetchSingers(activeBaseUrl.value, {
        singer: singerForm.singer.trim(),
        singerType: singerForm.singerType,
        sortType: '',
        page: singerState.page,
      })

      singerState.page = response.page
      singerState.maxPage = response.maxPage
      singerPageInput.value = response.page + 1
      singerState.singers = response.singers
      singerState.errorMessage = ''
      setLastResponse(`Singer search returned ${response.number} result(s), max page ${response.maxPage ?? 'n/a'}`)
      setLastError('')
      logDiagnosticEvent(`Singer search returned ${response.number} result(s)`)
    } catch (error) {
      singerState.maxPage = null
      singerState.singers = []
      singerState.errorMessage = 'Unable to load singers. Check the server URL in Setup.'
      setLastError(error instanceof Error ? error.message : String(error))
      setLastResponse('Singer search failed')
      logDiagnosticEvent('Singer search failed')
      console.error(error)
    } finally {
      singerState.loading = false
    }
  }

  function isSongQueued(songId) {
    return queuedSongIds.value.has(String(songId))
  }

  function isSongPending(songId) {
    return pendingSongIds.has(String(songId))
  }

  async function removeSong(songId) {
    if (!songId || !hasConfiguredBaseUrl()) {
      return
    }

    const idStr = String(songId)
    if (pendingSongIds.has(idStr)) {
      return
    }

    pendingSongIds.add(idStr)
    try {
      setLastRequest('CommandServlet', `cmd=Del1 cmdValue=${songId}`)
      await deleteSong(activeBaseUrl.value, songId)
      setLastResponse(`Command Del1 succeeded for ${songId}`)
      setLastError('')
      logDiagnosticEvent(`Deleted song ${songId}`)
      await refreshPlaylist(true)
    } catch (error) {
      setLastError(error instanceof Error ? error.message : String(error))
      setLastResponse('Command Del1 failed')
      logDiagnosticEvent(`Delete failed for ${songId}`)
      console.error(error)
    } finally {
      pendingSongIds.delete(idStr)
    }
  }

  async function addSong(songId) {
    if (!songId || !hasConfiguredBaseUrl()) {
      return
    }

    const idStr = String(songId)
    if (pendingSongIds.has(idStr)) {
      return
    }

    pendingSongIds.add(idStr)
    const wasQueued = isSongQueued(songId)
    try {
      if (wasQueued) {
        setLastRequest('CommandServlet', `cmd=Del1 cmdValue=${songId}`)
        await deleteSong(activeBaseUrl.value, songId)
        setLastResponse(`Command Del1 succeeded for ${songId}`)
        setLastError('')
        logDiagnosticEvent(`Deleted song ${songId}`)
      } else {
        setLastRequest('CommandServlet', `cmd=Add1 cmdValue=${songId}`)
        await queueSong(activeBaseUrl.value, songId)
        setLastResponse(`Command Add1 succeeded for ${songId}`)
        setLastError('')
        logDiagnosticEvent(`Queued song ${songId}`)
      }
      await refreshPlaylist(true)
    } catch (error) {
      setLastError(error instanceof Error ? error.message : String(error))
      setLastResponse(wasQueued ? 'Command Del1 failed' : 'Command Add1 failed')
      logDiagnosticEvent(wasQueued ? `Delete failed for ${songId}` : `Queue failed for ${songId}`)
      console.error(error)
    } finally {
      pendingSongIds.delete(idStr)
    }
  }

  async function promoteSong(songId) {
    if (!songId || !hasConfiguredBaseUrl()) {
      return
    }

    const idStr = String(songId)
    if (pendingSongIds.has(idStr)) {
      return
    }

    pendingSongIds.add(idStr)
    try {
      setLastRequest('CommandServlet', `cmd=Pro1 cmdValue=${songId}`)
      await prioritizeSong(activeBaseUrl.value, songId)
      setLastResponse(`Command Pro1 succeeded for ${songId}`)
      setLastError('')
      logDiagnosticEvent(`Prioritized song ${songId}`)
      await refreshPlaylist(true)
    } catch (error) {
      setLastError(error instanceof Error ? error.message : String(error))
      setLastResponse('Command Pro1 failed')
      logDiagnosticEvent(`Prioritize failed for ${songId}`)
      console.error(error)
    } finally {
      pendingSongIds.delete(idStr)
    }
  }

  async function runGlobalCommand(commandRunner) {
    if (commandBarBusy.value || !hasConfiguredBaseUrl()) {
      return
    }

    commandBarBusy.value = true

    try {
      setLastRequest('CommandServlet', `cmd=${commandRunner.name || 'unknown'}`)
      await commandRunner(activeBaseUrl.value)
      setLastResponse(`Command ${commandRunner.name || 'unknown'} succeeded`)
      setLastError('')
      logDiagnosticEvent(`Command ${commandRunner.name || 'unknown'} succeeded`)
      await refreshPlaylist(true)
    } catch (error) {
      setLastError(error instanceof Error ? error.message : String(error))
      setLastResponse(`Command ${commandRunner.name || 'unknown'} failed`)
      logDiagnosticEvent(`Command ${commandRunner.name || 'unknown'} failed`)
      console.error(error)
    } finally {
      commandBarBusy.value = false
    }
  }

  return {
    commandBarBusy,
    runSearch,
    refreshPlaylist,
    runSingerSearch,
    addSong,
    promoteSong,
    removeSong,
    runGlobalCommand,
    isSongQueued,
    isSongPending,
  }
}
