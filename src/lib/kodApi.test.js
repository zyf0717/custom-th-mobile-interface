import { describe, expect, it, vi } from 'vitest'

import {
  deleteSong,
  fetchPlaylist,
  fetchSingers,
  jsonp,
  micDown,
  micUp,
  musicDown,
  musicUp,
  prioritizeSong,
  queueSong,
  restartDevice,
  searchSongs,
  skipSong,
  toneDown,
  toneReset,
  toneUp,
  togglePlay,
  toggleMute,
  toggleVocals,
} from './kodApi'

const TEST_BASE_URL = 'http://10.0.0.20:8080'

function getInjectedScript() {
  const script = document.body.querySelector('script')

  if (!script) {
    throw new Error('Expected a JSONP script tag to be injected')
  }

  return script
}

function resolveJsonpRequest(payload) {
  const script = getInjectedScript()
  const callbackName = new URL(script.src).searchParams.get('jsonpCallback')
  window[callbackName](payload)
}

describe('kodApi', () => {
  it('builds a SearchServlet JSONP request and normalizes search results', async () => {
    const resultPromise = searchSongs(TEST_BASE_URL, {
      songName: '',
      songType: '',
      singer: '',
      lang: '\u56fd\u8bed',
      sortType: '',
      page: 0,
    })

    const script = getInjectedScript()
    const requestUrl = new URL(script.src)

    expect(requestUrl.pathname).toBe('/SearchServlet')
    expect(requestUrl.searchParams.get('songName')).toBe('')
    expect(requestUrl.searchParams.get('songType')).toBe('')
    expect(requestUrl.searchParams.get('singer')).toBe('')
    expect(requestUrl.searchParams.get('lang')).toBe('\u56fd\u8bed')
    expect(requestUrl.searchParams.get('sortType')).toBe('')
    expect(requestUrl.searchParams.get('page')).toBe('0')
    expect(requestUrl.searchParams.get('jsonpCallback')).toMatch(/^__openKodJsonp_/)

    resolveJsonpRequest({
      maxPage: 45658,
      number: 1,
      page: 0,
      songList: [
        {
          cLOUD: 1,
          sINGER: 'Tester',
          sONGBM: '9029901',
          sONGNAME: 'Lucky',
        },
      ],
    })

    await expect(resultPromise).resolves.toEqual({
      maxPage: 45658,
      number: 1,
      page: 0,
      raw: {
        maxPage: 45658,
        number: 1,
        page: 0,
        songList: [
          {
            cLOUD: 1,
            sINGER: 'Tester',
            sONGBM: '9029901',
            sONGNAME: 'Lucky',
          },
        ],
      },
      songs: [
        {
          cloud: true,
          id: '9029901',
          name: 'Lucky',
          singer: 'Tester',
          singerPic: '',
        },
      ],
    })

    expect(document.body.querySelector('script')).toBeNull()
  })

  it('preserves singerPic filenames from search responses', async () => {
    const resultPromise = searchSongs(TEST_BASE_URL, {
      lang: '\u5168\u90e8',
      page: 0,
    })

    resolveJsonpRequest({
      maxPage: 1,
      number: 1,
      page: 0,
      songList: [
        {
          cLOUD: 0,
          sINGER: 'Hebe',
          sINGERPIC: '26940.jpg',
          sONGBM: '9029901',
          sONGNAME: 'Small Lucky',
        },
      ],
    })

    await expect(resultPromise).resolves.toEqual({
      maxPage: 1,
      number: 1,
      page: 0,
      raw: {
        maxPage: 1,
        number: 1,
        page: 0,
        songList: [
          {
            cLOUD: 0,
            sINGER: 'Hebe',
            sINGERPIC: '26940.jpg',
            sONGBM: '9029901',
            sONGNAME: 'Small Lucky',
          },
        ],
      },
      songs: [
        {
          cloud: false,
          id: '9029901',
          name: 'Small Lucky',
          singer: 'Hebe',
          singerPic: '26940.jpg',
        },
      ],
    })
  })

  it('uses the base URL correctly when it already has a trailing slash', async () => {
    const commandPromise = queueSong(`${TEST_BASE_URL}/`, '9029901')
    const requestUrl = new URL(getInjectedScript().src)

    expect(requestUrl.origin).toBe(TEST_BASE_URL)
    expect(requestUrl.pathname).toBe('/CommandServlet')
    expect(requestUrl.searchParams.get('cmdValue')).toBe('9029901')

    resolveJsonpRequest({ cmd: 'Add1', code: '0' })

    await expect(commandPromise).resolves.toEqual({ cmd: 'Add1', code: '0' })
  })

  it('sends the Add1 command with the selected song id', async () => {
    const commandPromise = queueSong(TEST_BASE_URL, '9029901')
    const requestUrl = new URL(getInjectedScript().src)

    expect(requestUrl.pathname).toBe('/CommandServlet')
    expect(requestUrl.searchParams.get('cmd')).toBe('Add1')
    expect(requestUrl.searchParams.get('cmdValue')).toBe('9029901')

    resolveJsonpRequest({ cmd: 'Add1', code: '0' })

    await expect(commandPromise).resolves.toEqual({ cmd: 'Add1', code: '0' })
  })

  it('sends the Pro1 command with the selected song id', async () => {
    const commandPromise = prioritizeSong(TEST_BASE_URL, '9029901')
    const requestUrl = new URL(getInjectedScript().src)

    expect(requestUrl.pathname).toBe('/CommandServlet')
    expect(requestUrl.searchParams.get('cmd')).toBe('Pro1')
    expect(requestUrl.searchParams.get('cmdValue')).toBe('9029901')

    resolveJsonpRequest({ cmd: 'Pro1', code: '0' })

    await expect(commandPromise).resolves.toEqual({ cmd: 'Pro1', code: '0' })
  })

  it('sends the Del1 command with the selected song id', async () => {
    const commandPromise = deleteSong(TEST_BASE_URL, '1673128')
    const requestUrl = new URL(getInjectedScript().src)

    expect(requestUrl.pathname).toBe('/CommandServlet')
    expect(requestUrl.searchParams.get('cmd')).toBe('Del1')
    expect(requestUrl.searchParams.get('cmdValue')).toBe('1673128')

    resolveJsonpRequest({ cmd: 'Del1', code: '0' })

    await expect(commandPromise).resolves.toEqual({ cmd: 'Del1', code: '0' })
  })

  it('sends the MuOr command without a song id', async () => {
    const commandPromise = toggleVocals(TEST_BASE_URL)
    const requestUrl = new URL(getInjectedScript().src)

    expect(requestUrl.pathname).toBe('/CommandServlet')
    expect(requestUrl.searchParams.get('cmd')).toBe('MuOr')
    expect(requestUrl.searchParams.get('cmdValue')).toBeNull()

    resolveJsonpRequest({ cmd: 'MuOr', code: '0' })

    await expect(commandPromise).resolves.toEqual({ cmd: 'MuOr', code: '0' })
  })

  it('sends the Play command without a song id', async () => {
    const commandPromise = togglePlay(TEST_BASE_URL)
    const requestUrl = new URL(getInjectedScript().src)

    expect(requestUrl.pathname).toBe('/CommandServlet')
    expect(requestUrl.searchParams.get('cmd')).toBe('Play')

    resolveJsonpRequest({ cmd: 'Play', code: '0' })

    await expect(commandPromise).resolves.toEqual({ cmd: 'Play', code: '0' })
  })

  it('sends the Skip command without a song id', async () => {
    const commandPromise = skipSong(TEST_BASE_URL)
    const requestUrl = new URL(getInjectedScript().src)

    expect(requestUrl.pathname).toBe('/CommandServlet')
    expect(requestUrl.searchParams.get('cmd')).toBe('Skip')

    resolveJsonpRequest({ cmd: 'Skip', code: '0' })

    await expect(commandPromise).resolves.toEqual({ cmd: 'Skip', code: '0' })
  })

  it('sends the Reset command without a song id', async () => {
    const commandPromise = restartDevice(TEST_BASE_URL)
    const requestUrl = new URL(getInjectedScript().src)

    expect(requestUrl.pathname).toBe('/CommandServlet')
    expect(requestUrl.searchParams.get('cmd')).toBe('Reset')

    resolveJsonpRequest({ cmd: 'Reset', code: '0' })

    await expect(commandPromise).resolves.toEqual({ cmd: 'Reset', code: '0' })
  })

  it('sends the Mute command without a song id', async () => {
    const commandPromise = toggleMute(TEST_BASE_URL)
    const requestUrl = new URL(getInjectedScript().src)

    expect(requestUrl.pathname).toBe('/CommandServlet')
    expect(requestUrl.searchParams.get('cmd')).toBe('Mute')

    resolveJsonpRequest({ cmd: 'Mute', code: '0' })

    await expect(commandPromise).resolves.toEqual({ cmd: 'Mute', code: '0' })
  })

  it('sends the Music_up command without a song id', async () => {
    const commandPromise = musicUp(TEST_BASE_URL)
    const requestUrl = new URL(getInjectedScript().src)

    expect(requestUrl.pathname).toBe('/CommandServlet')
    expect(requestUrl.searchParams.get('cmd')).toBe('Music_up')

    resolveJsonpRequest({ cmd: 'Music_up', code: '0' })

    await expect(commandPromise).resolves.toEqual({ cmd: 'Music_up', code: '0' })
  })

  it('sends the Music_down command without a song id', async () => {
    const commandPromise = musicDown(TEST_BASE_URL)
    const requestUrl = new URL(getInjectedScript().src)

    expect(requestUrl.pathname).toBe('/CommandServlet')
    expect(requestUrl.searchParams.get('cmd')).toBe('Music_down')

    resolveJsonpRequest({ cmd: 'Music_down', code: '0' })

    await expect(commandPromise).resolves.toEqual({ cmd: 'Music_down', code: '0' })
  })

  it('sends the Mic_up command without a song id', async () => {
    const commandPromise = micUp(TEST_BASE_URL)
    const requestUrl = new URL(getInjectedScript().src)

    expect(requestUrl.pathname).toBe('/CommandServlet')
    expect(requestUrl.searchParams.get('cmd')).toBe('Mic_up')

    resolveJsonpRequest({ cmd: 'Mic_up', code: '0' })

    await expect(commandPromise).resolves.toEqual({ cmd: 'Mic_up', code: '0' })
  })

  it('sends the Mic_down command without a song id', async () => {
    const commandPromise = micDown(TEST_BASE_URL)
    const requestUrl = new URL(getInjectedScript().src)

    expect(requestUrl.pathname).toBe('/CommandServlet')
    expect(requestUrl.searchParams.get('cmd')).toBe('Mic_down')

    resolveJsonpRequest({ cmd: 'Mic_down', code: '0' })

    await expect(commandPromise).resolves.toEqual({ cmd: 'Mic_down', code: '0' })
  })

  it('sends the Tone_nom command without a song id', async () => {
    const commandPromise = toneReset(TEST_BASE_URL)
    const requestUrl = new URL(getInjectedScript().src)

    expect(requestUrl.pathname).toBe('/CommandServlet')
    expect(requestUrl.searchParams.get('cmd')).toBe('Tone_nom')

    resolveJsonpRequest({ cmd: 'Tone_nom', code: '0' })

    await expect(commandPromise).resolves.toEqual({ cmd: 'Tone_nom', code: '0' })
  })

  it('sends the Tone_down command without a song id', async () => {
    const commandPromise = toneDown(TEST_BASE_URL)
    const requestUrl = new URL(getInjectedScript().src)

    expect(requestUrl.pathname).toBe('/CommandServlet')
    expect(requestUrl.searchParams.get('cmd')).toBe('Tone_down')

    resolveJsonpRequest({ cmd: 'Tone_down', code: '0' })

    await expect(commandPromise).resolves.toEqual({ cmd: 'Tone_down', code: '0' })
  })

  it('sends the Tone_up command without a song id', async () => {
    const commandPromise = toneUp(TEST_BASE_URL)
    const requestUrl = new URL(getInjectedScript().src)

    expect(requestUrl.pathname).toBe('/CommandServlet')
    expect(requestUrl.searchParams.get('cmd')).toBe('Tone_up')

    resolveJsonpRequest({ cmd: 'Tone_up', code: '0' })

    await expect(commandPromise).resolves.toEqual({ cmd: 'Tone_up', code: '0' })
  })

  it('normalizes playlist data from PlaylistServlet', async () => {
    const playlistPromise = fetchPlaylist(TEST_BASE_URL)
    const requestUrl = new URL(getInjectedScript().src)

    expect(requestUrl.pathname).toBe('/PlaylistServlet')
    expect(requestUrl.searchParams.get('type')).toBe('1')
    expect(requestUrl.searchParams.get('onSelectPage')).toBe('true')

    resolveJsonpRequest({
      hasChange: 'true',
      number: 2,
      songList: [
        { sINGER: 'Dreamer', sONGNAME: 'Youth', xH: '1503296' },
        { sINGER: 'Eason', sONGNAME: 'Ten Years', xH: '1486462' },
      ],
      stateMuOr: false,
      stateMute: false,
      statePlay: false,
    })

    await expect(playlistPromise).resolves.toEqual({
      hasChange: 'true',
      number: 2,
      raw: {
        hasChange: 'true',
        number: 2,
        songList: [
          { sINGER: 'Dreamer', sONGNAME: 'Youth', xH: '1503296' },
          { sINGER: 'Eason', sONGNAME: 'Ten Years', xH: '1486462' },
        ],
        stateMuOr: false,
        stateMute: false,
        statePlay: false,
      },
      songs: [
        { id: '1503296', name: 'Youth', singer: 'Dreamer' },
        { id: '1486462', name: 'Ten Years', singer: 'Eason' },
      ],
      stateMuOr: false,
      stateMute: false,
      statePlay: false,
    })
  })

  it('normalizes singer data from SingerServlet', async () => {
    const singerPromise = fetchSingers(TEST_BASE_URL, {
      singer: '',
      singerType: '\u5168\u90e8',
      sortType: '',
      page: 0,
    })
    const requestUrl = new URL(getInjectedScript().src)

    expect(requestUrl.pathname).toBe('/SingerServlet')
    expect(requestUrl.searchParams.get('singer')).toBe('')
    expect(requestUrl.searchParams.get('singerType')).toBe('\u5168\u90e8')
    expect(requestUrl.searchParams.get('sortType')).toBe('')
    expect(requestUrl.searchParams.get('page')).toBe('0')

    resolveJsonpRequest({
      maxPage: 10515,
      number: 2,
      page: 0,
      singerList: [
        { name: '\u5468\u6770\u4f26', picture: '27356.jpg' },
        { name: '\u5218\u5fb7\u534e', picture: '26554.jpg' },
      ],
    })

    await expect(singerPromise).resolves.toEqual({
      maxPage: 10515,
      number: 2,
      page: 0,
      raw: {
        maxPage: 10515,
        number: 2,
        page: 0,
        singerList: [
          { name: '\u5468\u6770\u4f26', picture: '27356.jpg' },
          { name: '\u5218\u5fb7\u534e', picture: '26554.jpg' },
        ],
      },
      singers: [
        { name: '\u5468\u6770\u4f26', picture: '27356.jpg' },
        { name: '\u5218\u5fb7\u534e', picture: '26554.jpg' },
      ],
    })
  })

  it('rejects JSONP requests that time out', async () => {
    vi.useFakeTimers()

    const requestPromise = jsonp(TEST_BASE_URL, 'SearchServlet', { page: 0 })
    const rejection = expect(requestPromise).rejects.toThrow('Request timed out for SearchServlet')

    await vi.advanceTimersByTimeAsync(10000)

    await rejection
    expect(document.body.querySelector('script')).toBeNull()
  })
})
