const REQUEST_TIMEOUT_MS = 10000

export const DEFAULT_BASE_URL = 'http://192.168.0.8:8080'

function normalizeBaseUrl(baseUrl) {
  return `${baseUrl.replace(/\/+$/, '')}/`
}

function buildUrl(baseUrl, path, params, options = {}) {
  const url = new URL(path.replace(/^\/+/, ''), normalizeBaseUrl(baseUrl))
  const includeEmptyString = options.includeEmptyString === true

  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== null &&
      value !== undefined &&
      (value !== '' || includeEmptyString)
    ) {
      url.searchParams.set(key, String(value))
    }
  })

  return url.toString()
}

export function jsonp(baseUrl, path, params = {}, options = {}) {
  return new Promise((resolve, reject) => {
    const callbackName = `__openKodJsonp_${Date.now()}_${Math.random().toString(36).slice(2)}`
    const requestUrl = buildUrl(baseUrl, path, {
      ...params,
      jsonpCallback: callbackName,
      _: Date.now(),
    }, options)
    const script = document.createElement('script')

    const cleanup = () => {
      delete window[callbackName]
      script.remove()
    }

    const timeoutHandle = window.setTimeout(() => {
      cleanup()
      reject(new Error(`Request timed out for ${path}`))
    }, REQUEST_TIMEOUT_MS)

    window[callbackName] = (payload) => {
      window.clearTimeout(timeoutHandle)
      cleanup()
      resolve(payload)
    }

    script.onerror = () => {
      window.clearTimeout(timeoutHandle)
      cleanup()
      reject(new Error(`Unable to load ${requestUrl}`))
    }

    script.src = requestUrl
    document.body.appendChild(script)
  })
}

function normalizeSearchSong(song) {
  return {
    id: song.sONGBM ?? '',
    name: song.sONGNAME ?? '',
    singer: song.sINGER ?? '',
    singerPic: song.sINGERPIC ?? '',
    cloud: Number(song.cLOUD) === 1,
  }
}

function normalizePlaylistSong(song) {
  return {
    id: song.xH ?? '',
    name: song.sONGNAME ?? '',
    singer: song.sINGER ?? '',
  }
}

function normalizeSinger(song) {
  return {
    name: song.name ?? '',
    picture: song.picture ?? '',
  }
}

export async function searchSongs(baseUrl, params) {
  const payload = await jsonp(baseUrl, 'SearchServlet', params, { includeEmptyString: true })

  return {
    page: Number(payload.page ?? params.page ?? 0),
    maxPage: Number.isFinite(Number(payload.maxPage)) ? Number(payload.maxPage) : null,
    number: Number(payload.number ?? payload.songList?.length ?? 0),
    songs: Array.isArray(payload.songList) ? payload.songList.map(normalizeSearchSong) : [],
    raw: payload,
  }
}

export async function queueSong(baseUrl, songId) {
  return sendCommand(baseUrl, 'Add1', songId)
}

export async function prioritizeSong(baseUrl, songId) {
  return sendCommand(baseUrl, 'Pro1', songId)
}

export async function deleteSong(baseUrl, songId) {
  return sendCommand(baseUrl, 'Del1', songId)
}

export async function toggleVocals(baseUrl) {
  return sendCommand(baseUrl, 'MuOr')
}

export async function togglePlay(baseUrl) {
  return sendCommand(baseUrl, 'Play')
}

export async function skipSong(baseUrl) {
  return sendCommand(baseUrl, 'Skip')
}

export async function restartDevice(baseUrl) {
  return sendCommand(baseUrl, 'Reset')
}

export async function toggleMute(baseUrl) {
  return sendCommand(baseUrl, 'Mute')
}

export async function musicUp(baseUrl) {
  return sendCommand(baseUrl, 'Music_up')
}

export async function musicDown(baseUrl) {
  return sendCommand(baseUrl, 'Music_down')
}

export async function micUp(baseUrl) {
  return sendCommand(baseUrl, 'Mic_up')
}

export async function micDown(baseUrl) {
  return sendCommand(baseUrl, 'Mic_down')
}

export async function toneReset(baseUrl) {
  return sendCommand(baseUrl, 'Tone_nom')
}

export async function toneDown(baseUrl) {
  return sendCommand(baseUrl, 'Tone_down')
}

export async function toneUp(baseUrl) {
  return sendCommand(baseUrl, 'Tone_up')
}

export async function fetchPlaylist(baseUrl) {
  const payload = await jsonp(baseUrl, 'PlaylistServlet', {
    onSelectPage: true,
    type: 1,
  })

  return {
    hasChange: payload.hasChange,
    statePlay: payload.statePlay,
    stateMute: payload.stateMute,
    stateMuOr: payload.stateMuOr,
    number: Number(payload.number ?? payload.songList?.length ?? 0),
    songs: Array.isArray(payload.songList) ? payload.songList.map(normalizePlaylistSong) : [],
    raw: payload,
  }
}

export async function fetchSingers(baseUrl, params) {
  const payload = await jsonp(baseUrl, 'SingerServlet', params, { includeEmptyString: true })

  return {
    page: Number(payload.page ?? params.page ?? 0),
    maxPage: Number.isFinite(Number(payload.maxPage)) ? Number(payload.maxPage) : null,
    number: Number(payload.number ?? payload.singerList?.length ?? 0),
    singers: Array.isArray(payload.singerList) ? payload.singerList.map(normalizeSinger) : [],
    raw: payload,
  }
}

function sendCommand(baseUrl, cmd, cmdValue) {
  return jsonp(baseUrl, 'CommandServlet', {
    cmd,
    cmdValue,
  })
}
