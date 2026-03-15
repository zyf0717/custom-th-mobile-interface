import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SettingsPanel from './components/SettingsPanel.vue'

const {
  searchSongs,
  fetchPlaylist,
  fetchSingers,
  queueSong,
  prioritizeSong,
  deleteSong,
  micDown,
  micUp,
  musicUp,
  musicDown,
  skipSong,
  toneReset,
  toneDown,
  toneUp,
  togglePlay,
  toggleMute,
  toggleVocals,
  restartDevice,
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
} = vi.hoisted(() => ({
  searchSongs: vi.fn(),
  fetchPlaylist: vi.fn(),
  fetchSingers: vi.fn(),
  queueSong: vi.fn(),
  prioritizeSong: vi.fn(),
  deleteSong: vi.fn(),
  toggleVocals: vi.fn(),
  restartDevice: vi.fn(),
  togglePlay: vi.fn(),
  skipSong: vi.fn(),
  toggleMute: vi.fn(),
  musicUp: vi.fn(),
  musicDown: vi.fn(),
  micUp: vi.fn(),
  micDown: vi.fn(),
  toneReset: vi.fn(),
  toneDown: vi.fn(),
  toneUp: vi.fn(),
  decodeQrCode: vi.fn(),
  createObjectUrl: vi.fn(),
  revokeObjectUrl: vi.fn(),
  anchorClick: vi.fn(),
  getUserMedia: vi.fn(),
  stopMediaTrack: vi.fn(),
  videoPlay: vi.fn(),
  videoPause: vi.fn(),
  locationReload: vi.fn(),
  canvasDrawImage: vi.fn(),
  canvasGetImageData: vi.fn(),
  canvasGetContext: vi.fn(),
  matchMedia: vi.fn(),
  matchMediaAddEventListener: vi.fn(),
  matchMediaRemoveEventListener: vi.fn(),
}))

const TEST_BASE_URL = 'http://10.0.0.20:8080'

vi.mock('./lib/kodApi', () => ({
  deleteSong,
  fetchPlaylist,
  fetchSingers,
  micDown,
  micUp,
  prioritizeSong,
  queueSong,
  restartDevice,
  searchSongs,
  skipSong,
  musicDown,
  musicUp,
  toneDown,
  toneReset,
  toneUp,
  togglePlay,
  toggleMute,
  toggleVocals,
}))

vi.mock('./lib/browserLocation', () => ({
  reloadPage: locationReload,
}))

vi.mock('jsqr', () => ({
  default: decodeQrCode,
}))

import App from './App.vue'

function buildSearchResponse() {
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

function buildPlaylistResponse() {
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

function buildSingerResponse() {
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

function buildEmptySearchResponse() {
  return {
    page: 0,
    maxPage: null,
    number: 0,
    songs: [],
    raw: { page: 0 },
  }
}

function buildEmptySingerResponse() {
  return {
    page: 0,
    maxPage: null,
    number: 0,
    singers: [],
    raw: { page: 0 },
  }
}

describe('App', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', `/?baseUrl=${encodeURIComponent(TEST_BASE_URL)}`)
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
    createObjectUrl.mockReturnValue('blob:open-kod-report')
  })

  it('loads search results and playlist items on mount', async () => {
    const wrapper = mount(App)

    await flushPromises()

    expect(searchSongs).toHaveBeenCalledTimes(1)
    expect(fetchPlaylist).toHaveBeenCalledTimes(1)
    expect(fetchSingers).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('Lucky')
    expect(wrapper.text()).toContain('Ten Years')
    expect(wrapper.text()).toContain('\u5468\u6770\u4f26')

    wrapper.unmount()
  })

  it('renders singer image URLs from the active base URL', async () => {
    const wrapper = mount(App)

    await flushPromises()

    const image = wrapper.get('img.singer-icon')
    expect(image.attributes('src')).toBe(`${TEST_BASE_URL}/singer/26940.jpg`)

    wrapper.unmount()
  })

  it('resets search fields back to defaults', async () => {
    const wrapper = mount(App)

    await flushPromises()
    await wrapper.get('summary.filter-summary').trigger('click')
    await wrapper.get('[data-test="search-song-name"]').setValue('Later')
    await wrapper.get('[data-test="search-singer"]').setValue('Eason')
    await wrapper.get('[data-test="search-language"]').setValue('\u82f1\u8bed')
    await wrapper.get('[data-test="search-song-type"]').setValue('\u5bf9\u5531')
    await wrapper.get('[data-test="search-reset"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-test="search-song-name"]').element.value).toBe('')
    expect(wrapper.get('[data-test="search-singer"]').element.value).toBe('')
    expect(wrapper.get('[data-test="search-language"]').element.value).toBe('')
    expect(wrapper.get('[data-test="search-song-type"]').element.value).toBe('')

    wrapper.unmount()
  })

  it('switches between mobile tabs', async () => {
    const wrapper = mount(App)

    await flushPromises()
    const mobilePanels = wrapper.findAll('section.mobile-panel')
    await wrapper.findAll('button.mobile-tab')[2].trigger('click')

    expect(wrapper.text()).toContain('Singer')
    expect(mobilePanels[2].classes()).not.toContain('mobile-panel-hidden')
    expect(mobilePanels[0].classes()).toContain('mobile-panel-hidden')

    wrapper.unmount()
  })

  it('offers a path back to setup from empty top hits results', async () => {
    window.history.replaceState({}, '', '/?baseUrl=http%3A%2F%2F10.0.0.20%3A8080')
    searchSongs.mockResolvedValue(buildEmptySearchResponse())

    const wrapper = mount(App)

    await flushPromises()
    const mobilePanels = wrapper.findAll('section.mobile-panel')
    await wrapper.get('[data-test="top-hits-go-setup"]').trigger('click')

    expect(mobilePanels[0].classes()).not.toContain('mobile-panel-hidden')
    expect(mobilePanels[1].classes()).toContain('mobile-panel-hidden')

    wrapper.unmount()
  })

  it('offers a path back to setup from empty singer results', async () => {
    window.history.replaceState({}, '', '/?baseUrl=http%3A%2F%2F10.0.0.20%3A8080')
    fetchSingers.mockResolvedValue(buildEmptySingerResponse())

    const wrapper = mount(App)

    await flushPromises()
    const mobilePanels = wrapper.findAll('section.mobile-panel')
    await wrapper.findAll('button.mobile-tab')[2].trigger('click')
    await wrapper.get('[data-test="singer-go-setup"]').trigger('click')

    expect(mobilePanels[0].classes()).not.toContain('mobile-panel-hidden')
    expect(mobilePanels[2].classes()).toContain('mobile-panel-hidden')

    wrapper.unmount()
  })

  it('starts on setup when there is no base URL query param', async () => {
    window.history.replaceState({}, '', '/')
    const wrapper = mount(App)

    await flushPromises()

    expect(searchSongs).not.toHaveBeenCalled()
    expect(fetchPlaylist).not.toHaveBeenCalled()
    expect(fetchSingers).not.toHaveBeenCalled()

    const mobilePanels = wrapper.findAll('section.mobile-panel')
    expect(mobilePanels[0].classes()).not.toContain('mobile-panel-hidden')
    expect(mobilePanels[1].classes()).toContain('mobile-panel-hidden')

    wrapper.unmount()
  })

  it('switches between desktop browse tabs', async () => {
    const wrapper = mount(App)

    await flushPromises()
    const desktopTabs = wrapper.findAll('[data-test^="desktop-tab-"]')
    const mobilePanels = wrapper.findAll('section.mobile-panel')
    await desktopTabs[2].trigger('click')

    expect(desktopTabs[2].classes()).toContain('mobile-tab-active')
    expect(desktopTabs[1].classes()).not.toContain('mobile-tab-active')
    expect(mobilePanels[1].classes()).toContain('desktop-panel-hidden')
    expect(mobilePanels[2].classes()).not.toContain('desktop-panel-hidden')

    wrapper.unmount()
  })

  it('pages singer results independently', async () => {
    fetchSingers
      .mockResolvedValueOnce(buildSingerResponse())
      .mockResolvedValueOnce({
        page: 1,
        maxPage: 10515,
        number: 2,
        singers: [
          {
            name: '\u8c2d\u548f\u9e9f',
            picture: '26971.jpg',
          },
          {
            name: '\u5f20\u5b66\u53cb',
            picture: '27426.jpg',
          },
        ],
        raw: { page: 1 },
      })

    const wrapper = mount(App)

    await flushPromises()
    await wrapper.findAll('button.mobile-tab')[2].trigger('click')
    await wrapper.get('[data-test="singer-page-input"]').setValue(2)
    await wrapper.get('[data-test="singer-page-go"]').trigger('click')
    await flushPromises()

    expect(fetchSingers).toHaveBeenLastCalledWith(
      TEST_BASE_URL,
      expect.objectContaining({ page: 1, singerType: '\u5168\u90e8' }),
    )
    expect(wrapper.text()).toContain('\u8c2d\u548f\u9e9f')

    wrapper.unmount()
  })

  it('searches singers with the selected country filter', async () => {
    const wrapper = mount(App)

    await flushPromises()
    await wrapper.findAll('button.mobile-tab')[2].trigger('click')
    await wrapper.get('[data-test="singer-search-name"]').setValue('\u5468')
    await wrapper.get('[data-test="singer-search-country"]').setValue('\u5927\u9646')
    await wrapper.get('[data-test="singer-search-form"]').trigger('submit')
    await flushPromises()

    expect(fetchSingers).toHaveBeenLastCalledWith(
      TEST_BASE_URL,
      expect.objectContaining({
        singer: '\u5468',
        singerType: '\u5927\u9646',
        page: 0,
      }),
    )

    wrapper.unmount()
  })

  it('pages singer results with the next arrow', async () => {
    fetchSingers
      .mockResolvedValueOnce(buildSingerResponse())
      .mockResolvedValueOnce({
        page: 1,
        maxPage: 10515,
        number: 2,
        singers: [
          {
            name: '\u8c2d\u548f\u9e9f',
            picture: '26971.jpg',
          },
          {
            name: '\u5f20\u5b66\u53cb',
            picture: '27426.jpg',
          },
        ],
        raw: { page: 1 },
      })

    const wrapper = mount(App)

    await flushPromises()
    await wrapper.findAll('button.mobile-tab')[2].trigger('click')
    await wrapper.get('[data-test="singer-page-next"]').trigger('click')
    await flushPromises()

    expect(fetchSingers).toHaveBeenLastCalledWith(
      TEST_BASE_URL,
      expect.objectContaining({ page: 1, singerType: '\u5168\u90e8' }),
    )
    expect(wrapper.text()).toContain('\u8c2d\u548f\u9e9f')

    wrapper.unmount()
  })

  it('moves from a singer result into a top hits singer search', async () => {
    const wrapper = mount(App)

    await flushPromises()
    const mobilePanels = wrapper.findAll('section.mobile-panel')
    await wrapper.findAll('button.mobile-tab')[2].trigger('click')
    await wrapper.get('[data-test="singer-result-\u5468\u6770\u4f26"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-test="search-singer"]').element.value).toBe('\u5468\u6770\u4f26')
    expect(searchSongs).toHaveBeenLastCalledWith(
      TEST_BASE_URL,
      expect.objectContaining({
        singer: '\u5468\u6770\u4f26',
        songName: '',
        songType: '',
        sortType: '',
        lang: '',
        page: 0,
      }),
    )
    expect(mobilePanels[1].classes()).not.toContain('mobile-panel-hidden')
    expect(mobilePanels[2].classes()).toContain('mobile-panel-hidden')

    wrapper.unmount()
  })

  it('queues a song from the search results and refreshes the playlist', async () => {
    const wrapper = mount(App)

    await flushPromises()
    await wrapper.get('[data-test="add-song-9029901"]').trigger('click')
    await flushPromises()

    expect(queueSong).toHaveBeenCalledWith(TEST_BASE_URL, '9029901')
    expect(fetchPlaylist).toHaveBeenCalledTimes(2)

    wrapper.unmount()
  })

  it('searches songs with the singer filter', async () => {
    const wrapper = mount(App)

    await flushPromises()
    await wrapper.get('summary.filter-summary').trigger('click')
    await wrapper.get('[data-test="search-singer"]').setValue('Eason')
    await wrapper.get('[data-test="search-form"]').trigger('submit')
    await flushPromises()

    expect(searchSongs).toHaveBeenLastCalledWith(
      TEST_BASE_URL,
      expect.objectContaining({
        singer: 'Eason',
        page: 0,
      }),
    )

    wrapper.unmount()
  })

  it('prioritizes a song from the search results and refreshes the playlist', async () => {
    const wrapper = mount(App)

    await flushPromises()
    await wrapper.get('[data-test="promote-song-9029901"]').trigger('click')
    await flushPromises()

    expect(prioritizeSong).toHaveBeenCalledWith(TEST_BASE_URL, '9029901')
    expect(fetchPlaylist).toHaveBeenCalledTimes(2)

    wrapper.unmount()
  })

  it('deletes a song from the playlist and refreshes the playlist', async () => {
    const wrapper = mount(App)

    await flushPromises()
    await wrapper.get('[data-test="delete-song-1486462"]').trigger('click')
    await flushPromises()

    expect(deleteSong).toHaveBeenCalledWith(TEST_BASE_URL, '1486462')
    expect(fetchPlaylist).toHaveBeenCalledTimes(2)

    wrapper.unmount()
  })

  it('prioritizes a song from the playlist and refreshes the playlist', async () => {
    const wrapper = mount(App)

    await flushPromises()
    await wrapper.get('[data-test="playlist-promote-song-1486462"]').trigger('click')
    await flushPromises()

    expect(prioritizeSong).toHaveBeenCalledWith(TEST_BASE_URL, '1486462')
    expect(fetchPlaylist).toHaveBeenCalledTimes(2)

    wrapper.unmount()
  })

  it('toggles vocals from the command bar and refreshes the playlist', async () => {
    const wrapper = mount(App)

    await flushPromises()
    await wrapper.get('[data-test="command-vocals"]').trigger('click')
    await flushPromises()

    expect(toggleVocals).toHaveBeenCalledWith(TEST_BASE_URL)
    expect(fetchPlaylist).toHaveBeenCalledTimes(2)

    wrapper.unmount()
  })

  it('sends mute from the command bar and refreshes the playlist', async () => {
    const wrapper = mount(App)

    await flushPromises()
    await wrapper.get('[data-test="command-mute"]').trigger('click')
    await flushPromises()

    expect(toggleMute).toHaveBeenCalledWith(TEST_BASE_URL)
    expect(fetchPlaylist).toHaveBeenCalledTimes(2)

    wrapper.unmount()
  })

  it('sends play from the command bar and refreshes the playlist', async () => {
    const wrapper = mount(App)

    await flushPromises()
    await wrapper.get('[data-test="command-play"]').trigger('click')
    await flushPromises()

    expect(togglePlay).toHaveBeenCalledWith(TEST_BASE_URL)
    expect(fetchPlaylist).toHaveBeenCalledTimes(2)

    wrapper.unmount()
  })

  it('sends skip from the command bar and refreshes the playlist', async () => {
    const wrapper = mount(App)

    await flushPromises()
    await wrapper.get('[data-test="command-skip"]').trigger('click')
    await flushPromises()

    expect(skipSong).toHaveBeenCalledWith(TEST_BASE_URL)
    expect(fetchPlaylist).toHaveBeenCalledTimes(2)

    wrapper.unmount()
  })

  it('sends tone reset from the command bar and refreshes the playlist', async () => {
    const wrapper = mount(App)

    await flushPromises()
    await wrapper.get('[data-test="command-tone-reset"]').trigger('click')
    await flushPromises()

    expect(toneReset).toHaveBeenCalledWith(TEST_BASE_URL)
    expect(fetchPlaylist).toHaveBeenCalledTimes(2)

    wrapper.unmount()
  })

  it('sends mic up from the command bar and refreshes the playlist', async () => {
    window.localStorage.setItem('open-kod-mic-controlled', 'true')

    const wrapper = mount(App)

    await flushPromises()
    await wrapper.get('[data-test="command-mic-up"]').trigger('click')
    await flushPromises()

    expect(micUp).toHaveBeenCalledWith(TEST_BASE_URL)
    expect(fetchPlaylist).toHaveBeenCalledTimes(2)

    wrapper.unmount()
  })

  it('sends mic down from the command bar and refreshes the playlist', async () => {
    window.localStorage.setItem('open-kod-mic-controlled', 'true')

    const wrapper = mount(App)

    await flushPromises()
    await wrapper.get('[data-test="command-mic-down"]').trigger('click')
    await flushPromises()

    expect(micDown).toHaveBeenCalledWith(TEST_BASE_URL)
    expect(fetchPlaylist).toHaveBeenCalledTimes(2)

    wrapper.unmount()
  })

  it('disables mic volume buttons until KOD microphone control is enabled', async () => {
    const wrapper = mount(App)

    await flushPromises()

    expect(wrapper.get('[data-test="command-mic-up"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-test="command-mic-down"]').attributes('disabled')).toBeDefined()

    wrapper.unmount()
  })

  it('enables mic volume buttons when the KOD microphone toggle is switched on', async () => {
    const wrapper = mount(App)

    await flushPromises()
    await wrapper.findAll('[data-test="mic-controlled-toggle"]')[0].trigger('click')

    expect(wrapper.get('[data-test="command-mic-up"]').attributes('disabled')).toBeUndefined()
    expect(wrapper.get('[data-test="command-mic-down"]').attributes('disabled')).toBeUndefined()

    wrapper.unmount()
  })

  it('downloads a diagnostics report from Setup', async () => {
    const wrapper = mount(App)

    await flushPromises()
    await wrapper.get('[data-test="download-report"]').trigger('click')
    await flushPromises()

    expect(createObjectUrl).toHaveBeenCalledTimes(1)
    expect(anchorClick).toHaveBeenCalledTimes(1)
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:open-kod-report')
    expect(wrapper.text()).toContain('Issue report downloaded. Attach it to your email.')

    wrapper.unmount()
  })

  it('lets the setup theme toggle override the system theme until reload only', async () => {
    const wrapper = mount(App)

    await flushPromises()

    expect(document.documentElement.dataset.theme).toBe('light')

    await wrapper.get('[data-test="theme-toggle"]').trigger('click')
    await flushPromises()

    expect(document.documentElement.dataset.theme).toBe('dark')

    wrapper.unmount()

    const reloadedWrapper = mount(App)

    await flushPromises()

    expect(document.documentElement.dataset.theme).toBe('light')

    reloadedWrapper.unmount()
  })

  it('prevents duplicate global command calls while a command is in flight', async () => {
    let resolveCommand
    toggleMute.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCommand = resolve
        }),
    )

    const wrapper = mount(App)

    await flushPromises()
    const muteButton = wrapper.get('[data-test="command-mute"]')
    await muteButton.trigger('click')
    await muteButton.trigger('click')

    expect(toggleMute).toHaveBeenCalledTimes(1)

    resolveCommand({ cmd: 'Mute', code: '0' })
    await flushPromises()

    wrapper.unmount()
  })

  it('saves the edited base URL before running new requests', async () => {
    const wrapper = mount(App)

    await flushPromises()
    await wrapper.get('[data-test="base-url-input"]').setValue('http://10.0.0.20:8080')
    await wrapper.get('[data-test="save-base-url"]').trigger('click')
    await flushPromises()

    expect(window.location.search).toBe('?baseUrl=http%3A%2F%2F10.0.0.20%3A8080')
    expect(locationReload).toHaveBeenCalledTimes(1)

    wrapper.unmount()
  })

  it('normalizes a saved bare host and port into http in the query string', async () => {
    const wrapper = mount(App)

    await flushPromises()
    await wrapper.get('[data-test="base-url-input"]').setValue('192.168.0.8:8080')
    await wrapper.get('[data-test="save-base-url"]').trigger('click')
    await flushPromises()

    expect(window.location.search).toBe('?baseUrl=http%3A%2F%2F192.168.0.8%3A8080')
    expect(locationReload).toHaveBeenCalledTimes(1)

    wrapper.unmount()
  })

  it('saves a scanned base URL and reuses it for follow-up requests', async () => {
    const wrapper = mount(App)

    await flushPromises()
    wrapper.getComponent(SettingsPanel).vm.$emit('scanner-detected-base-url', 'http://10.0.0.30:8080')
    await flushPromises()

    expect(window.location.search).toBe('?baseUrl=http%3A%2F%2F10.0.0.30%3A8080')
    expect(locationReload).toHaveBeenCalledTimes(1)

    wrapper.unmount()
  })

  it('opens the camera preview without relying on BarcodeDetector', async () => {
    window.BarcodeDetector = undefined

    const wrapper = mount(App)

    await flushPromises()
    await wrapper.get('[data-test="toggle-qr-scanner"]').trigger('click')
    await flushPromises()

    expect(getUserMedia).toHaveBeenCalledWith({
      audio: false,
      video: {
        facingMode: {
          ideal: 'environment',
        },
      },
    })
    expect(wrapper.find('[data-test="qr-scanner-video"]').exists()).toBe(true)

    wrapper.unmount()
  })

  it('normalizes saved base URLs with a trailing slash before using singer images', async () => {
    window.history.replaceState({}, '', '/?baseUrl=http%3A%2F%2F10.0.0.20%3A8080%2F')

    const wrapper = mount(App)

    await flushPromises()

    const image = wrapper.get('img.singer-icon')
    expect(image.attributes('src')).toBe('http://10.0.0.20:8080/singer/26940.jpg')

    wrapper.unmount()
  })

  it('reads the base URL from the browser query string on load', async () => {
    window.history.replaceState({}, '', '/?baseUrl=http%3A%2F%2F10.0.0.40%3A8080')

    const wrapper = mount(App)

    await flushPromises()

    expect(wrapper.get('[data-test="base-url-input"]').element.value).toBe('http://10.0.0.40:8080')
    expect(searchSongs).toHaveBeenLastCalledWith(
      'http://10.0.0.40:8080',
      expect.objectContaining({ page: 0 }),
    )
    expect(wrapper.findAll('button.mobile-tab')[1].classes()).toContain('mobile-tab-active')

    wrapper.unmount()
  })

  it('normalizes a bare host and port from the browser query string on load', async () => {
    window.history.replaceState({}, '', '/?baseUrl=192.168.0.8%3A8080')

    const wrapper = mount(App)

    await flushPromises()

    expect(wrapper.get('[data-test="base-url-input"]').element.value).toBe('http://192.168.0.8:8080')
    expect(searchSongs).toHaveBeenLastCalledWith(
      'http://192.168.0.8:8080',
      expect.objectContaining({ page: 0 }),
    )

    wrapper.unmount()
  })

})
