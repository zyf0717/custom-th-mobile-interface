import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  searchSongs,
  fetchPlaylist,
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
} = vi.hoisted(() => ({
  searchSongs: vi.fn(),
  fetchPlaylist: vi.fn(),
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
}))

vi.mock('./lib/kodApi', () => ({
  DEFAULT_BASE_URL: 'http://192.168.0.8:8080',
  DEFAULT_LANG: '\u56fd\u8bed',
  deleteSong,
  fetchPlaylist,
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

describe('App', () => {
  beforeEach(() => {
    searchSongs.mockReset()
    fetchPlaylist.mockReset()
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

    searchSongs.mockResolvedValue(buildSearchResponse())
    fetchPlaylist.mockResolvedValue(buildPlaylistResponse())
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
  })

  it('loads search results and playlist items on mount', async () => {
    const wrapper = mount(App)

    await flushPromises()

    expect(searchSongs).toHaveBeenCalledTimes(1)
    expect(fetchPlaylist).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('Lucky')
    expect(wrapper.text()).toContain('Ten Years')

    wrapper.unmount()
  })

  it('renders singer image URLs from the active base URL', async () => {
    const wrapper = mount(App)

    await flushPromises()

    const image = wrapper.get('img.singer-icon')
    expect(image.attributes('src')).toBe('http://192.168.0.8:8080/singer/26940.jpg')

    wrapper.unmount()
  })

  it('resets search fields back to defaults', async () => {
    const wrapper = mount(App)

    await flushPromises()
    await wrapper.get('summary.filter-summary').trigger('click')
    await wrapper.get('input[placeholder="Song title"]').setValue('Later')
    await wrapper.get('input[placeholder="Singer name"]').setValue('Rene')
    await wrapper.get('select').setValue('\u82f1\u8bed')
    await wrapper.get('button.button-secondary').trigger('click')
    await flushPromises()

    expect(wrapper.get('input[placeholder="Song title"]').element.value).toBe('')
    expect(wrapper.get('input[placeholder="Singer name"]').element.value).toBe('')
    expect(wrapper.get('select').element.value).toBe('\u5168\u90e8')

    wrapper.unmount()
  })

  it('switches between mobile tabs', async () => {
    const wrapper = mount(App)

    await flushPromises()
    const mobileTabs = wrapper.findAll('button.mobile-tab')
    const mobilePanels = wrapper.findAll('section.mobile-panel')
    await mobileTabs[1].trigger('click')

    expect(wrapper.text()).toContain('Playlist')
    expect(mobilePanels[1].classes()).not.toContain('mobile-panel-hidden')
    expect(mobilePanels[0].classes()).toContain('mobile-panel-hidden')

    wrapper.unmount()
  })

  it('queues a song from the search results and refreshes the playlist', async () => {
    const wrapper = mount(App)

    await flushPromises()
    await wrapper.get('[data-test="add-song-9029901"]').trigger('click')
    await flushPromises()

    expect(queueSong).toHaveBeenCalledWith('http://192.168.0.8:8080', '9029901')
    expect(fetchPlaylist).toHaveBeenCalledTimes(2)

    wrapper.unmount()
  })

  it('prioritizes a song from the search results and refreshes the playlist', async () => {
    const wrapper = mount(App)

    await flushPromises()
    await wrapper.get('[data-test="promote-song-9029901"]').trigger('click')
    await flushPromises()

    expect(prioritizeSong).toHaveBeenCalledWith('http://192.168.0.8:8080', '9029901')
    expect(fetchPlaylist).toHaveBeenCalledTimes(2)

    wrapper.unmount()
  })

  it('deletes a song from the playlist and refreshes the playlist', async () => {
    const wrapper = mount(App)

    await flushPromises()
    await wrapper.get('[data-test="delete-song-1486462"]').trigger('click')
    await flushPromises()

    expect(deleteSong).toHaveBeenCalledWith('http://192.168.0.8:8080', '1486462')
    expect(fetchPlaylist).toHaveBeenCalledTimes(2)

    wrapper.unmount()
  })

  it('prioritizes a song from the playlist and refreshes the playlist', async () => {
    const wrapper = mount(App)

    await flushPromises()
    await wrapper.get('[data-test="playlist-promote-song-1486462"]').trigger('click')
    await flushPromises()

    expect(prioritizeSong).toHaveBeenCalledWith('http://192.168.0.8:8080', '1486462')
    expect(fetchPlaylist).toHaveBeenCalledTimes(2)

    wrapper.unmount()
  })

  it('toggles vocals from the command bar and refreshes the playlist', async () => {
    const wrapper = mount(App)

    await flushPromises()
    await wrapper.get('[data-test="command-vocals"]').trigger('click')
    await flushPromises()

    expect(toggleVocals).toHaveBeenCalledWith('http://192.168.0.8:8080')
    expect(fetchPlaylist).toHaveBeenCalledTimes(2)

    wrapper.unmount()
  })

  it('sends mute from the command bar and refreshes the playlist', async () => {
    const wrapper = mount(App)

    await flushPromises()
    await wrapper.get('[data-test="command-mute"]').trigger('click')
    await flushPromises()

    expect(toggleMute).toHaveBeenCalledWith('http://192.168.0.8:8080')
    expect(fetchPlaylist).toHaveBeenCalledTimes(2)

    wrapper.unmount()
  })

  it('sends play from the command bar and refreshes the playlist', async () => {
    const wrapper = mount(App)

    await flushPromises()
    await wrapper.get('[data-test="command-play"]').trigger('click')
    await flushPromises()

    expect(togglePlay).toHaveBeenCalledWith('http://192.168.0.8:8080')
    expect(fetchPlaylist).toHaveBeenCalledTimes(2)

    wrapper.unmount()
  })

  it('sends skip from the command bar and refreshes the playlist', async () => {
    const wrapper = mount(App)

    await flushPromises()
    await wrapper.get('[data-test="command-skip"]').trigger('click')
    await flushPromises()

    expect(skipSong).toHaveBeenCalledWith('http://192.168.0.8:8080')
    expect(fetchPlaylist).toHaveBeenCalledTimes(2)

    wrapper.unmount()
  })

  it('sends tone reset from the command bar and refreshes the playlist', async () => {
    const wrapper = mount(App)

    await flushPromises()
    await wrapper.get('[data-test="command-tone-reset"]').trigger('click')
    await flushPromises()

    expect(toneReset).toHaveBeenCalledWith('http://192.168.0.8:8080')
    expect(fetchPlaylist).toHaveBeenCalledTimes(2)

    wrapper.unmount()
  })

  it('sends mic up from the command bar and refreshes the playlist', async () => {
    const wrapper = mount(App)

    await flushPromises()
    await wrapper.get('[data-test="command-mic-up"]').trigger('click')
    await flushPromises()

    expect(micUp).toHaveBeenCalledWith('http://192.168.0.8:8080')
    expect(fetchPlaylist).toHaveBeenCalledTimes(2)

    wrapper.unmount()
  })

  it('sends mic down from the command bar and refreshes the playlist', async () => {
    const wrapper = mount(App)

    await flushPromises()
    await wrapper.get('[data-test="command-mic-down"]').trigger('click')
    await flushPromises()

    expect(micDown).toHaveBeenCalledWith('http://192.168.0.8:8080')
    expect(fetchPlaylist).toHaveBeenCalledTimes(2)

    wrapper.unmount()
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

    expect(window.localStorage.getItem('open-kod-base-url')).toBe('http://10.0.0.20:8080')
    expect(searchSongs).toHaveBeenLastCalledWith(
      'http://10.0.0.20:8080',
      expect.objectContaining({ page: 0 }),
    )
    expect(fetchPlaylist).toHaveBeenLastCalledWith('http://10.0.0.20:8080')

    wrapper.unmount()
  })

  it('normalizes saved base URLs with a trailing slash before using singer images', async () => {
    window.localStorage.setItem('open-kod-base-url', 'http://10.0.0.20:8080/')

    const wrapper = mount(App)

    await flushPromises()

    const image = wrapper.get('img.singer-icon')
    expect(image.attributes('src')).toBe('http://10.0.0.20:8080/singer/26940.jpg')

    wrapper.unmount()
  })

})
