export const TEST_BASE_URL = 'http://10.0.0.20:8080'
export const FAVORITES_STORAGE_KEY = 'custom-th-mobile-interface-favorites'

export function buildSearchResponse() {
  return {
    page: 0,
    maxPage: 45658,
    number: 1,
    songs: [
      {
        id: '9029901',
        name: 'Lucky',
        singer: 'Tester',
        cloud: false,
        singerPic: '26940.jpg',
      },
    ],
    raw: { page: 0 },
  }
}

export function buildPlaylistResponse() {
  return {
    number: 1,
    hasChange: 'true',
    statePlay: false,
    stateMute: false,
    stateMuOr: false,
    songs: [
      {
        id: '1486462',
        name: 'Ten Years',
        singer: 'Eason',
      },
    ],
    raw: { number: 1 },
  }
}

export function buildSingerResponse() {
  return {
    page: 0,
    maxPage: 10515,
    number: 2,
    singers: [
      {
        name: '\u5468\u6770\u4f26',
        picture: '27356.jpg',
      },
      {
        name: '\u5218\u5fb7\u534e',
        picture: '26554.jpg',
      },
    ],
    raw: { page: 0 },
  }
}

export function buildEmptySearchResponse() {
  return {
    page: 0,
    maxPage: null,
    number: 0,
    songs: [],
    raw: { page: 0 },
  }
}

export function buildEmptySingerResponse() {
  return {
    page: 0,
    maxPage: null,
    number: 0,
    singers: [],
    raw: { page: 0 },
  }
}

function ensureLocalStorageApi() {
  if (window.localStorage && typeof window.localStorage.clear === 'function') {
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

export function setupDefaultAppTestState(mocks, baseUrl = TEST_BASE_URL) {
  const {
    searchSongs,
    fetchPlaylist,
    fetchSingers,
    queueSong,
    prioritizeSong,
    deleteSong,
    toggleVocals,
    restartDevice,
    togglePlay,
    skipSong,
    toggleMute,
    musicUp,
    musicDown,
    micUp,
    micDown,
    toneReset,
    toneDown,
    toneUp,
    decodeQrCode,
    createObjectUrl,
    revokeObjectUrl,
    anchorClick,
    getUserMedia,
    stopMediaTrack,
    videoPlay,
    videoPause,
    locationReload,
    canvasDrawImage,
    canvasGetImageData,
    canvasGetContext,
    matchMedia,
    matchMediaAddEventListener,
    matchMediaRemoveEventListener,
  } = mocks

  window.history.replaceState({}, '', `/?baseUrl=${encodeURIComponent(baseUrl)}`)
  ensureLocalStorageApi()
  window.localStorage.clear()
  URL.createObjectURL = createObjectUrl
  URL.revokeObjectURL = revokeObjectUrl
  HTMLAnchorElement.prototype.click = anchorClick

  searchSongs.mockReset()
  fetchPlaylist.mockReset()
  fetchSingers.mockReset()
  queueSong.mockReset()
  prioritizeSong.mockReset()
  deleteSong.mockReset()
  toggleVocals.mockReset()
  restartDevice.mockReset()
  togglePlay.mockReset()
  skipSong.mockReset()
  toggleMute.mockReset()
  musicUp.mockReset()
  musicDown.mockReset()
  micUp.mockReset()
  micDown.mockReset()
  toneReset.mockReset()
  toneDown.mockReset()
  toneUp.mockReset()
  decodeQrCode.mockReset()
  createObjectUrl.mockReset()
  revokeObjectUrl.mockReset()
  anchorClick.mockReset()
  getUserMedia.mockReset()
  stopMediaTrack.mockReset()
  videoPlay.mockReset()
  videoPause.mockReset()
  locationReload.mockReset()
  canvasDrawImage.mockReset()
  canvasGetImageData.mockReset()
  canvasGetContext.mockReset()
  matchMedia.mockReset()
  matchMediaAddEventListener.mockReset()
  matchMediaRemoveEventListener.mockReset()

  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: {
      getUserMedia,
    },
  })
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: matchMedia,
  })
  HTMLMediaElement.prototype.play = videoPlay
  HTMLMediaElement.prototype.pause = videoPause
  HTMLCanvasElement.prototype.getContext = canvasGetContext
  videoPlay.mockResolvedValue()
  matchMedia.mockImplementation(() => ({
    matches: false,
    addEventListener: matchMediaAddEventListener,
    removeEventListener: matchMediaRemoveEventListener,
  }))
  getUserMedia.mockResolvedValue({
    getTracks: () => [{ stop: stopMediaTrack }],
  })
  canvasGetContext.mockReturnValue({
    drawImage: canvasDrawImage,
    getImageData: canvasGetImageData,
  })
  canvasGetImageData.mockReturnValue({
    data: new Uint8ClampedArray(4),
    width: 1,
    height: 1,
  })

  searchSongs.mockResolvedValue(buildSearchResponse())
  fetchPlaylist.mockResolvedValue(buildPlaylistResponse())
  fetchSingers.mockResolvedValue(buildSingerResponse())
  queueSong.mockResolvedValue({ cmd: 'Add1', code: '0' })
  prioritizeSong.mockResolvedValue({ cmd: 'Pro1', code: '0' })
  deleteSong.mockResolvedValue({ cmd: 'Del1', code: '0' })
  toggleVocals.mockResolvedValue({ cmd: 'MuOr', code: '0' })
  restartDevice.mockResolvedValue({ cmd: 'Reset', code: '0' })
  togglePlay.mockResolvedValue({ cmd: 'Play', code: '0' })
  skipSong.mockResolvedValue({ cmd: 'Skip', code: '0' })
  toggleMute.mockResolvedValue({ cmd: 'Mute', code: '0' })
  musicUp.mockResolvedValue({ cmd: 'Music_up', code: '0' })
  musicDown.mockResolvedValue({ cmd: 'Music_down', code: '0' })
  micUp.mockResolvedValue({ cmd: 'Mic_up', code: '0' })
  micDown.mockResolvedValue({ cmd: 'Mic_down', code: '0' })
  toneReset.mockResolvedValue({ cmd: 'Tone_nom', code: '0' })
  toneDown.mockResolvedValue({ cmd: 'Tone_down', code: '0' })
  toneUp.mockResolvedValue({ cmd: 'Tone_up', code: '0' })
  decodeQrCode.mockReturnValue(null)
  createObjectUrl.mockReturnValue('blob:custom-th-mobile-interface-report')
}
