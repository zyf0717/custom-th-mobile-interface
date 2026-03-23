import { reactive, ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'

import { useKodApi } from '../../../composables/useKodApi'

function createApiContext() {
  const activeBaseUrl = ref('http://10.0.0.20:8080')
  const searchForm = reactive({ songName: ' Lucky ', singer: ' Tester ', songType: '', lang: '', sortType: '' })
  const searchState = reactive({ page: 0, maxPage: null, loading: false, songs: [], errorMessage: '' })
  const pageInput = ref(1)
  const playlistState = reactive({ loading: false, songs: [] })
  const singerForm = reactive({ singer: ' Jay ', singerType: '全部' })
  const singerState = reactive({ page: 0, maxPage: null, loading: false, singers: [], errorMessage: '' })
  const singerPageInput = ref(1)

  const setLastRequest = vi.fn()
  const setLastResponse = vi.fn()
  const setLastError = vi.fn()
  const logDiagnosticEvent = vi.fn()

  const searchSongs = vi.fn()
  const fetchPlaylist = vi.fn()
  const fetchSingers = vi.fn()
  const queueSong = vi.fn()
  const prioritizeSong = vi.fn()
  const deleteSong = vi.fn()

  const api = useKodApi({
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
  })

  return {
    activeBaseUrl,
    searchState,
    pageInput,
    playlistState,
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
    api,
  }
}

describe('useKodApi', () => {
  it('skips search when base URL is not configured', async () => {
    const ctx = createApiContext()
    ctx.activeBaseUrl.value = ''

    await ctx.api.runSearch()

    expect(ctx.searchSongs).not.toHaveBeenCalled()
    expect(ctx.setLastResponse).toHaveBeenCalledWith('Search skipped: no base URL configured')
  })

  it('runs search and updates state from response', async () => {
    const ctx = createApiContext()
    ctx.searchSongs.mockResolvedValue({
      page: 1,
      maxPage: 3,
      number: 1,
      songs: [{ id: '1', name: 'Lucky' }],
    })

    await ctx.api.runSearch()

    expect(ctx.searchSongs).toHaveBeenCalledWith(
      'http://10.0.0.20:8080',
      expect.objectContaining({ songName: 'Lucky', singer: 'Tester', page: 0 }),
    )
    expect(ctx.searchState.page).toBe(1)
    expect(ctx.pageInput.value).toBe(2)
    expect(ctx.searchState.songs).toEqual([{ id: '1', name: 'Lucky' }])
    expect(ctx.setLastError).toHaveBeenCalledWith('')
  })

  it('toggles addSong to remove when the song is already queued', async () => {
    const ctx = createApiContext()
    ctx.playlistState.songs = [{ id: '1486462', name: 'Ten Years' }]
    ctx.fetchPlaylist.mockResolvedValue({ number: 0, songs: [] })
    ctx.deleteSong.mockResolvedValue({ cmd: 'Del1', code: '0' })

    await ctx.api.addSong('1486462')

    expect(ctx.queueSong).not.toHaveBeenCalled()
    expect(ctx.deleteSong).toHaveBeenCalledWith('http://10.0.0.20:8080', '1486462')
    expect(ctx.fetchPlaylist).toHaveBeenCalledTimes(1)
  })

  it('runs singer search and updates singer state', async () => {
    const ctx = createApiContext()
    ctx.fetchSingers.mockResolvedValue({
      page: 2,
      maxPage: 5,
      number: 1,
      singers: [{ name: '周杰伦', picture: '1.jpg' }],
    })

    await ctx.api.runSingerSearch()

    expect(ctx.fetchSingers).toHaveBeenCalledWith(
      'http://10.0.0.20:8080',
      expect.objectContaining({ singer: 'Jay', singerType: '全部', page: 0 }),
    )
    expect(ctx.singerState.page).toBe(2)
    expect(ctx.singerPageInput.value).toBe(3)
  })

  it('prevents duplicate global command runs while busy', async () => {
    const ctx = createApiContext()
    ctx.fetchPlaylist.mockResolvedValue({ number: 0, songs: [] })

    let resolveCommand
    const commandRunner = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveCommand = resolve
        }),
    )

    const first = ctx.api.runGlobalCommand(commandRunner)
    await ctx.api.runGlobalCommand(commandRunner)

    expect(commandRunner).toHaveBeenCalledTimes(1)

    resolveCommand({ cmd: 'Mute', code: '0' })
    await first

    expect(ctx.fetchPlaylist).toHaveBeenCalledTimes(1)
    expect(ctx.api.commandBarBusy.value).toBe(false)
  })

  it('blocks duplicate addSong calls while the first is in flight', async () => {
    const ctx = createApiContext()
    ctx.fetchPlaylist.mockResolvedValue({ number: 0, songs: [] })

    let resolveQueue
    ctx.queueSong.mockImplementation(() => new Promise((resolve) => { resolveQueue = resolve }))

    const first = ctx.api.addSong('999')
    await ctx.api.addSong('999')

    expect(ctx.queueSong).toHaveBeenCalledTimes(1)

    resolveQueue({ cmd: 'Add1', code: '0' })
    await first

    expect(ctx.queueSong).toHaveBeenCalledTimes(1)
    expect(ctx.fetchPlaylist).toHaveBeenCalledTimes(1)
  })

  it('blocks duplicate promoteSong calls while the first is in flight', async () => {
    const ctx = createApiContext()
    ctx.fetchPlaylist.mockResolvedValue({ number: 0, songs: [] })

    let resolvePrioritize
    ctx.prioritizeSong.mockImplementation(() => new Promise((resolve) => { resolvePrioritize = resolve }))

    const first = ctx.api.promoteSong('999')
    await ctx.api.promoteSong('999')

    expect(ctx.prioritizeSong).toHaveBeenCalledTimes(1)

    resolvePrioritize({ cmd: 'Pro1', code: '0' })
    await first

    expect(ctx.prioritizeSong).toHaveBeenCalledTimes(1)
    expect(ctx.fetchPlaylist).toHaveBeenCalledTimes(1)
  })

  it('blocks duplicate removeSong calls while the first is in flight', async () => {
    const ctx = createApiContext()
    ctx.fetchPlaylist.mockResolvedValue({ number: 0, songs: [] })

    let resolveDelete
    ctx.deleteSong.mockImplementation(() => new Promise((resolve) => { resolveDelete = resolve }))

    const first = ctx.api.removeSong('999')
    await ctx.api.removeSong('999')

    expect(ctx.deleteSong).toHaveBeenCalledTimes(1)

    resolveDelete({ cmd: 'Del1', code: '0' })
    await first

    expect(ctx.deleteSong).toHaveBeenCalledTimes(1)
    expect(ctx.fetchPlaylist).toHaveBeenCalledTimes(1)
  })

  it('discards a stale playlist response when a newer request has already resolved', async () => {
    const ctx = createApiContext()

    let resolvePoll
    let resolveForced
    ctx.fetchPlaylist
      .mockImplementationOnce(() => new Promise((resolve) => { resolvePoll = resolve }))
      .mockImplementationOnce(() => new Promise((resolve) => { resolveForced = resolve }))

    const pollPromise = ctx.api.refreshPlaylist()
    const forcedPromise = ctx.api.refreshPlaylist(true)

    resolveForced({ number: 1, songs: [{ id: '999', name: 'Forced Song' }] })
    await forcedPromise

    expect(ctx.playlistState.songs).toEqual([{ id: '999', name: 'Forced Song' }])

    resolvePoll({ number: 1, songs: [{ id: '111', name: 'Stale Song' }] })
    await pollPromise

    expect(ctx.playlistState.songs).toEqual([{ id: '999', name: 'Forced Song' }])
  })
})
