import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SettingsPanel from '../../components/SettingsPanel.vue'
import {
  FAVORITES_STORAGE_KEY,
  TEST_BASE_URL,
  buildEmptySearchResponse,
  buildEmptySingerResponse,
  buildSingerResponse,
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

  it('does not offer setup navigation for empty top hits results', async () => {
    window.history.replaceState({}, '', '/?baseUrl=http%3A%2F%2F10.0.0.20%3A8080')
    searchSongs.mockResolvedValue(buildEmptySearchResponse())

    const wrapper = mount(App)

    await flushPromises()
    expect(wrapper.text()).toContain('No results yet.')
    expect(wrapper.find('[data-test="top-hits-go-setup"]').exists()).toBe(false)

    wrapper.unmount()
  })

  it('does not offer setup navigation for empty singer results', async () => {
    window.history.replaceState({}, '', '/?baseUrl=http%3A%2F%2F10.0.0.20%3A8080')
    fetchSingers.mockResolvedValue(buildEmptySingerResponse())

    const wrapper = mount(App)

    await flushPromises()
    await wrapper.findAll('button.mobile-tab')[2].trigger('click')
    expect(wrapper.text()).toContain('No singers returned yet.')
    expect(wrapper.find('[data-test="singer-go-setup"]').exists()).toBe(false)

    wrapper.unmount()
  })

  it('offers a path back to setup when top hits fails to load', async () => {
    searchSongs.mockRejectedValue(new Error('connect ECONNREFUSED'))

    const wrapper = mount(App)

    await flushPromises()
    const mobilePanels = wrapper.findAll('section.mobile-panel')
    const topHitsPanel = mobilePanels[1]

    expect(wrapper.text()).toContain('Unable to load songs. Check the server URL in Setup.')
    expect(wrapper.find('[data-test="search-form"]').exists()).toBe(false)
    expect(topHitsPanel.find('.results-label').exists()).toBe(false)
    expect(topHitsPanel.find('.table-wrap').exists()).toBe(false)
    expect(topHitsPanel.find('.pagination-stack').exists()).toBe(false)

    await wrapper.get('[data-test="top-hits-go-setup"]').trigger('click')

    expect(mobilePanels[0].classes()).not.toContain('mobile-panel-hidden')
    expect(mobilePanels[1].classes()).toContain('mobile-panel-hidden')

    wrapper.unmount()
  })

  it('offers a path back to setup when singer search fails to load', async () => {
    fetchSingers.mockRejectedValue(new Error('connect ECONNREFUSED'))

    const wrapper = mount(App)

    await flushPromises()
    await wrapper.findAll('button.mobile-tab')[2].trigger('click')
    const mobilePanels = wrapper.findAll('section.mobile-panel')
    const singerPanel = mobilePanels[2]

    expect(wrapper.text()).toContain('Unable to load singers. Check the server URL in Setup.')
    expect(wrapper.find('[data-test="singer-search-form"]').exists()).toBe(false)
    expect(singerPanel.find('.results-label').exists()).toBe(false)
    expect(singerPanel.find('.singer-list').exists()).toBe(false)
    expect(singerPanel.find('[data-test="singer-page-go"]').exists()).toBe(false)

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

  it('adds a top hits song to favorites in local storage', async () => {
    const wrapper = mount(App)

    await flushPromises()
    await wrapper.get('[data-test="favorite-song-9029901"]').trigger('click')

    const favorites = JSON.parse(window.localStorage.getItem(FAVORITES_STORAGE_KEY) || '[]')

    expect(favorites).toHaveLength(1)
    expect(favorites[0]).toEqual(
      expect.objectContaining({
        id: '9029901',
        name: 'Lucky',
        singer: 'Tester',
        singerPic: '26940.jpg',
        cloud: false,
      }),
    )
    expect(favorites[0].savedAt).toMatch(/\d{4}-\d{2}-\d{2}T/)
    expect(wrapper.get('[data-test="favorite-song-9029901"]').text()).toBe('⭐️')

    wrapper.unmount()
  })

  it('loads existing favorites from local storage and shows the added icon', async () => {
    window.localStorage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify([
        {
          id: '9029901',
          name: 'Lucky',
          singer: 'Tester',
          singerPic: '26940.jpg',
          cloud: false,
          savedAt: '2026-03-23T09:00:00.000Z',
        },
      ]),
    )

    const wrapper = mount(App)

    await flushPromises()

    expect(wrapper.get('[data-test="favorite-song-9029901"]').text()).toBe('⭐️')

    wrapper.unmount()
  })

  it('adds a playlist song to favorites in local storage', async () => {
    const wrapper = mount(App)

    await flushPromises()
    await wrapper.get('[data-test="playlist-favorite-song-1486462"]').trigger('click')

    const favorites = JSON.parse(window.localStorage.getItem(FAVORITES_STORAGE_KEY) || '[]')

    expect(favorites).toHaveLength(1)
    expect(favorites[0]).toEqual(
      expect.objectContaining({
        id: '1486462',
        name: 'Ten Years',
        singer: 'Eason',
        singerPic: '',
        cloud: false,
      }),
    )
    expect(wrapper.get('[data-test="playlist-favorite-song-1486462"]').text()).toBe('⭐️')

    wrapper.unmount()
  })

  it('removes a song from favorites when clicking the added icon again', async () => {
    const wrapper = mount(App)

    await flushPromises()
    await wrapper.get('[data-test="favorite-song-9029901"]').trigger('click')
    await wrapper.get('[data-test="favorite-song-9029901"]').trigger('click')

    const favorites = JSON.parse(window.localStorage.getItem(FAVORITES_STORAGE_KEY) || '[]')

    expect(favorites).toHaveLength(0)
    expect(wrapper.get('[data-test="favorite-song-9029901"]').text()).toBe('Fav')

    wrapper.unmount()
  })

  it('deletes a queued top hits song via add button toggle', async () => {
    searchSongs.mockResolvedValue({
      page: 0,
      maxPage: 1,
      number: 1,
      songs: [
        {
          id: '1486462',
          name: 'Ten Years',
          singer: 'Eason',
          cloud: false,
          singerPic: '',
        },
      ],
      raw: { page: 0 },
    })

    const wrapper = mount(App)

    await flushPromises()

    expect(wrapper.get('[data-test="add-song-1486462"]').text()).toContain('Del')

    await wrapper.get('[data-test="add-song-1486462"]').trigger('click')
    await flushPromises()

    expect(deleteSong).toHaveBeenCalledWith(TEST_BASE_URL, '1486462')
    expect(fetchPlaylist).toHaveBeenCalledTimes(2)

    wrapper.unmount()
  })


})
