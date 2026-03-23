import { createServer } from 'node:http'

const HOST = process.env.MOCK_KOD_HOST || '0.0.0.0'
const PORT = Number(process.env.MOCK_KOD_PORT || 8080)
const PAGE_SIZE = 8
const SINGER_PAGE_SIZE = 10

const SONGS = [
  song('100001', 'Small Lucky', 'Hebe', '26940.jpg', { lang: '\u56fd\u8bed', singerType: '\u6e2f\u53f0', cloud: false, rank: 98, releaseOrder: 4 }),
  song('100002', 'Blue and White Porcelain', 'Jay Chou', '27356.jpg', { lang: '\u56fd\u8bed', singerType: '\u6e2f\u53f0', cloud: false, rank: 99, releaseOrder: 2 }),
  song('100003', 'Ten Years', 'Eason Chan', '26554.jpg', { lang: '\u7ca4\u8bed', singerType: '\u6e2f\u53f0', cloud: false, rank: 97, releaseOrder: 3 }),
  song('100004', 'Later', 'Rene Liu', '27111.jpg', { lang: '\u56fd\u8bed', singerType: '\u6e2f\u53f0', cloud: false, rank: 93, releaseOrder: 6 }),
  song('100005', 'Ordinary Road', 'Pu Shu', '26777.jpg', { lang: '\u56fd\u8bed', singerType: '\u5927\u9646', cloud: true, rank: 94, releaseOrder: 5 }),
  song('100006', 'Love Confession', 'Jay Chou', '27356.jpg', { lang: '\u56fd\u8bed', singerType: '\u6e2f\u53f0', cloud: true, rank: 95, releaseOrder: 1 }),
  song('100007', 'Kiss Goodbye', 'Jacky Cheung', '27426.jpg', { lang: '\u56fd\u8bed', singerType: '\u6e2f\u53f0', cloud: false, rank: 91, releaseOrder: 7 }),
  song('100008', 'Boundless Oceans, Vast Skies', 'Beyond', '27888.jpg', { lang: '\u7ca4\u8bed', singerType: '\u6e2f\u53f0', cloud: false, rank: 96, releaseOrder: 8 }),
  song('100009', 'Lemon', 'Kenshi Yonezu', '28100.jpg', { lang: '\u65e5\u8bed', singerType: '\u65e5\u672c', cloud: true, rank: 88, releaseOrder: 9 }),
  song('100010', 'Dynamite', 'BTS', '28200.jpg', { lang: '\u97e9\u8bed', singerType: '\u97e9\u56fd', cloud: true, rank: 87, releaseOrder: 10 }),
  song('100011', 'Yesterday Once More', 'Carpenters', '28300.jpg', { lang: '\u82f1\u8bed', singerType: '\u82f1\u8bed', cloud: false, rank: 84, releaseOrder: 11 }),
  song('100012', 'Moon Represents My Heart', 'Teresa Teng', '28400.jpg', { lang: '\u56fd\u8bed', singerType: '\u6e2f\u53f0', cloud: false, rank: 92, releaseOrder: 12 }),
]

const state = {
  playlist: [
    playlistEntry(SONGS[2]),
    playlistEntry(SONGS[0]),
  ],
  statePlay: false,
  stateMute: false,
  stateMuOr: false,
  musicLevel: 10,
  micLevel: 10,
  tone: 0,
}

function song(id, name, singer, singerPic, options) {
  return {
    id,
    name,
    singer,
    singerPic,
    lang: options.lang,
    singerType: options.singerType,
    songType: options.songType || '',
    cloud: options.cloud ? 1 : 0,
    rank: options.rank || 0,
    releaseOrder: options.releaseOrder || 0,
  }
}

function playlistEntry(sourceSong) {
  return {
    id: sourceSong.id,
    name: sourceSong.name,
    singer: sourceSong.singer,
  }
}

function sendJsonp(response, callbackName, payload, statusCode = 200) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/javascript; charset=utf-8',
    'Cache-Control': 'no-store',
  })
  response.end(`${callbackName}(${JSON.stringify(payload)})`)
}

function sendText(response, text, statusCode = 200) {
  response.writeHead(statusCode, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
  })
  response.end(text)
}

function sendSvg(response, title) {
  const safeTitle = escapeHtml(title)
  const initials = safeTitle
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
    || 'OK'
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">',
    '<rect width="256" height="256" rx="28" fill="#dbe4ee" />',
    '<rect x="16" y="16" width="224" height="224" rx="22" fill="#8ba3bf" />',
    `<text x="128" y="124" text-anchor="middle" font-family="Arial, sans-serif" font-size="56" fill="#ffffff">${escapeHtml(initials)}</text>`,
    `<text x="128" y="184" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#f8fafc">${safeTitle}</text>`,
    '</svg>',
  ].join('')

  response.writeHead(200, {
    'Content-Type': 'image/svg+xml; charset=utf-8',
    'Cache-Control': 'no-store',
  })
  response.end(svg)
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function getCallbackName(url) {
  const callbackName = url.searchParams.get('jsonpCallback')
  return /^[A-Za-z_$][\w$]*$/.test(callbackName || '') ? callbackName : null
}

function matchesFilter(value, query) {
  if (!query) {
    return true
  }

  return String(value).toLowerCase().includes(String(query).trim().toLowerCase())
}

function paginate(items, requestedPage, pageSize) {
  const total = items.length
  const maxPage = total ? Math.ceil(total / pageSize) : null
  const normalizedPage = total ? Math.min(Math.max(requestedPage, 0), maxPage - 1) : 0
  const start = normalizedPage * pageSize

  return {
    page: normalizedPage,
    maxPage,
    number: total,
    items: items.slice(start, start + pageSize),
  }
}

function buildSearchPayload(url) {
  const songName = url.searchParams.get('songName') || ''
  const singer = url.searchParams.get('singer') || ''
  const lang = url.searchParams.get('lang') || ''
  const songType = url.searchParams.get('songType') || ''
  const sortType = url.searchParams.get('sortType') || ''
  const page = Number(url.searchParams.get('page') || 0)

  let songs = SONGS.filter((item) => {
    if (!matchesFilter(item.name, songName)) {
      return false
    }
    if (!matchesFilter(item.singer, singer)) {
      return false
    }
    if (lang && lang !== '\u5168\u90e8' && item.lang !== lang) {
      return false
    }
    if (songType && item.songType !== songType) {
      return false
    }
    return true
  })

  if (sortType === 'TopByNewSong') {
    songs = songs.toSorted((left, right) => right.releaseOrder - left.releaseOrder)
  } else {
    songs = songs.toSorted((left, right) => right.rank - left.rank)
  }

  const result = paginate(songs, Number.isFinite(page) ? page : 0, PAGE_SIZE)

  return {
    page: result.page,
    maxPage: result.maxPage,
    number: result.number,
    songList: result.items.map((item) => ({
      cLOUD: item.cloud,
      sINGER: item.singer,
      sINGERPIC: item.singerPic,
      sONGBM: item.id,
      sONGNAME: item.name,
    })),
  }
}

function buildSingerPayload(url) {
  const singer = url.searchParams.get('singer') || ''
  const singerType = url.searchParams.get('singerType') || ''
  const page = Number(url.searchParams.get('page') || 0)

  const uniqueSingers = new Map()
  for (const item of SONGS) {
    if (!uniqueSingers.has(item.singer)) {
      uniqueSingers.set(item.singer, {
        name: item.singer,
        picture: item.singerPic,
        singerType: item.singerType,
        popularity: item.rank,
      })
    }
  }

  let singers = Array.from(uniqueSingers.values()).filter((item) => {
    if (!matchesFilter(item.name, singer)) {
      return false
    }
    if (singerType && singerType !== '\u5168\u90e8' && item.singerType !== singerType) {
      return false
    }
    return true
  })

  singers = singers.toSorted((left, right) => right.popularity - left.popularity)

  const result = paginate(singers, Number.isFinite(page) ? page : 0, SINGER_PAGE_SIZE)

  return {
    page: result.page,
    maxPage: result.maxPage,
    number: result.number,
    singerList: result.items.map((item) => ({
      name: item.name,
      picture: item.picture,
    })),
  }
}

function buildPlaylistPayload() {
  return {
    hasChange: 'true',
    number: state.playlist.length,
    songList: state.playlist.map((item) => ({
      sINGER: item.singer,
      sONGNAME: item.name,
      xH: item.id,
    })),
    stateMuOr: state.stateMuOr,
    stateMute: state.stateMute,
    statePlay: state.statePlay,
  }
}

function applyCommand(url) {
  const cmd = url.searchParams.get('cmd') || ''
  const cmdValue = url.searchParams.get('cmdValue') || ''
  const song = SONGS.find((item) => item.id === cmdValue)

  switch (cmd) {
    case 'Add1':
      if (song && !state.playlist.some((item) => item.id === song.id)) {
        state.playlist.push(playlistEntry(song))
      }
      break
    case 'Del1':
      state.playlist = state.playlist.filter((item) => item.id !== cmdValue)
      break
    case 'Pro1': {
      const index = state.playlist.findIndex((item) => item.id === cmdValue)
      if (index >= 0) {
        const [item] = state.playlist.splice(index, 1)
        state.playlist.unshift(item)
      } else if (song) {
        state.playlist.unshift(playlistEntry(song))
      }
      break
    }
    case 'Reset':
      state.statePlay = true
      state.stateMute = false
      state.stateMuOr = false
      state.musicLevel = 10
      state.micLevel = 10
      state.tone = 0
      break
    case 'Play':
      state.statePlay = !state.statePlay
      break
    case 'Skip':
      state.playlist.shift()
      break
    case 'Mute':
      state.stateMute = !state.stateMute
      break
    case 'MuOr':
      state.stateMuOr = !state.stateMuOr
      break
    case 'Music_up':
      state.musicLevel = Math.min(state.musicLevel + 1, 20)
      break
    case 'Music_down':
      state.musicLevel = Math.max(state.musicLevel - 1, 0)
      break
    case 'Mic_up':
      state.micLevel = Math.min(state.micLevel + 1, 20)
      break
    case 'Mic_down':
      state.micLevel = Math.max(state.micLevel - 1, 0)
      break
    case 'Tone_up':
      state.tone = Math.min(state.tone + 1, 6)
      break
    case 'Tone_down':
      state.tone = Math.max(state.tone - 1, -6)
      break
    case 'Tone_nom':
      state.tone = 0
      break
    default:
      break
  }

  return {
    cmd,
    cmdValue,
    code: '0',
  }
}

const server = createServer((request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`)

  if (url.pathname === '/') {
    sendText(
      response,
      [
        'Open KOD mock server',
        '',
        `SearchServlet: http://127.0.0.1:${PORT}/SearchServlet`,
        `SingerServlet: http://127.0.0.1:${PORT}/SingerServlet`,
        `PlaylistServlet: http://127.0.0.1:${PORT}/PlaylistServlet`,
        `CommandServlet: http://127.0.0.1:${PORT}/CommandServlet`,
      ].join('\n'),
    )
    return
  }

  if (url.pathname.startsWith('/singer/')) {
    const fileName = decodeURIComponent(url.pathname.slice('/singer/'.length))
    const title = SONGS.find((item) => item.singerPic === fileName)?.singer || 'Open KOD'
    sendSvg(response, title)
    return
  }

  const callbackName = getCallbackName(url)
  if (!callbackName) {
    sendText(response, 'Missing or invalid jsonpCallback parameter', 400)
    return
  }

  if (url.pathname === '/SearchServlet') {
    sendJsonp(response, callbackName, buildSearchPayload(url))
    return
  }

  if (url.pathname === '/SingerServlet') {
    sendJsonp(response, callbackName, buildSingerPayload(url))
    return
  }

  if (url.pathname === '/PlaylistServlet') {
    sendJsonp(response, callbackName, buildPlaylistPayload())
    return
  }

  if (url.pathname === '/CommandServlet') {
    sendJsonp(response, callbackName, applyCommand(url))
    return
  }

  sendText(response, `Unknown path: ${url.pathname}`, 404)
})

server.listen(PORT, HOST, () => {
  console.log(`Open KOD mock server listening on http://${HOST}:${PORT}`)
  console.log(`Use base URL: http://127.0.0.1:${PORT}`)
})
