import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SettingsPanel from '../../components/SettingsPanel.vue'
import {
  FAVORITES_STORAGE_KEY,
  TEST_BASE_URL,
  setupDefaultAppTestState,
} from './appTestHarness'

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

vi.mock('../../services/kodApi', () => ({
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

vi.mock('../../services/browserLocation', () => ({
  reloadPage: locationReload,
}))

vi.mock('jsqr', () => ({
  default: decodeQrCode,
}))

import App from '../../App.vue'

describe('App', () => {
  beforeEach(() => {
    setupDefaultAppTestState({
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
    })
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
    window.localStorage.setItem('custom-th-mobile-interface-mic-controlled', 'true')

    const wrapper = mount(App)

    await flushPromises()
    await wrapper.get('[data-test="command-mic-up"]').trigger('click')
    await flushPromises()

    expect(micUp).toHaveBeenCalledWith(TEST_BASE_URL)
    expect(fetchPlaylist).toHaveBeenCalledTimes(2)

    wrapper.unmount()
  })

  it('sends mic down from the command bar and refreshes the playlist', async () => {
    window.localStorage.setItem('custom-th-mobile-interface-mic-controlled', 'true')

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
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:custom-th-mobile-interface-report')
    expect(wrapper.text()).toContain('Issue report downloaded. Attach it to your email.')

    wrapper.unmount()
  })

  it('renders critical control glyphs without mojibake', async () => {
    const wrapper = mount(App)

    await flushPromises()

    expect(wrapper.get('[data-test="save-base-url"]').text()).toBe('➤')
    expect(wrapper.get('[data-test="favorite-song-9029901"]').text()).toBe('Fav')
    expect(wrapper.get('[data-test="promote-song-9029901"]').text()).toBe('⏫')
    expect(wrapper.get('[data-test="add-song-9029901"]').text()).toContain('Add')
    expect(wrapper.get('[data-test="playlist-favorite-song-1486462"]').text()).toBe('Fav')
    expect(wrapper.get('[data-test="playlist-promote-song-1486462"]').text()).toBe('⏫')
    expect(wrapper.get('[data-test="delete-song-1486462"]').text()).toBe('Del')
    expect(wrapper.get('[data-test="command-tone-down"]').text()).toBe('♭')
    expect(wrapper.get('[data-test="command-tone-reset"]').text()).toBe('♮')
    expect(wrapper.get('[data-test="command-tone-up"]').text()).toBe('♯')
    expect(wrapper.get('[data-test="command-mute"]').text()).toBe('🔇')
    expect(wrapper.get('[data-test="command-music-down"]').text()).toBe('🔉')
    expect(wrapper.get('[data-test="command-music-up"]').text()).toBe('🔊')
    expect(wrapper.get('[data-test="command-play"]').text()).toBe('⏯')
    expect(wrapper.get('[data-test="command-skip"]').text()).toBe('⏭')
    expect(wrapper.get('[data-test="command-toggle-mixer"]').text()).toBe('☰')

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

  it('saves and reloads a base URL from setup without extra permission preflight', async () => {
    window.history.replaceState({}, '', '/')

    const wrapper = mount(App)

    await flushPromises()
    await wrapper.get('[data-test="base-url-input"]').setValue('http://10.0.0.25:8080')
    await wrapper.get('[data-test="save-base-url"]').trigger('click')
    await flushPromises()

    expect(locationReload).toHaveBeenCalledTimes(1)
    expect(window.location.search).toBe('?baseUrl=http%3A%2F%2F10.0.0.25%3A8080')

    wrapper.unmount()
  })

  it('rejects an unrecognisable server URL and shows an inline error', async () => {
    const wrapper = mount(App)

    await flushPromises()
    await wrapper.get('[data-test="base-url-input"]').setValue('http//not-valid')
    await wrapper.get('[data-test="save-base-url"]').trigger('click')
    await flushPromises()

    expect(locationReload).not.toHaveBeenCalled()
    expect(wrapper.find('[data-test="base-url-error"]').exists()).toBe(true)
    expect(wrapper.get('[data-test="base-url-error"]').text()).toContain('valid server URL')

    wrapper.unmount()
  })

  it('loads local API data on startup', async () => {
    const wrapper = mount(App)

    await flushPromises()

    expect(searchSongs).toHaveBeenCalledWith(
      TEST_BASE_URL,
      expect.objectContaining({ page: 0 }),
    )
    expect(fetchPlaylist).toHaveBeenCalledWith(TEST_BASE_URL)
    expect(fetchSingers).toHaveBeenCalledWith(
      TEST_BASE_URL,
      expect.objectContaining({ page: 0 }),
    )

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
