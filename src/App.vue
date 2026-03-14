<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import packageJson from '../package.json'
import SettingsPanel from './components/SettingsPanel.vue'
import {
  DEFAULT_BASE_URL,
  deleteSong,
  fetchPlaylist,
  fetchSingers,
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
} from './lib/kodApi'

const POLL_INTERVAL_MS = 5000
const DIAGNOSTIC_EVENT_LIMIT = 25
const SUPPORT_EMAIL = 'zyf0717@gmail.com'
const STORAGE_KEY = 'open-kod-base-url'
const THEME_STORAGE_KEY = 'open-kod-theme'
const MIC_CONTROL_STORAGE_KEY = 'open-kod-mic-controlled'
const CLOUD_MARKER = '\u2601'
const LANGUAGE_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Mandarin', value: '\u56fd\u8bed' },
  { label: 'Cantonese', value: '\u7ca4\u8bed' },
  { label: 'Hokkien', value: '\u95fd\u8bed' },
  { label: 'English', value: '\u82f1\u8bed' },
  { label: 'Japanese', value: '\u65e5\u8bed' },
  { label: 'Korean', value: '\u97e9\u8bed' },
  { label: 'Thai', value: '\u6cf0\u8bed' },
  { label: 'Vietnamese', value: '\u8d8a\u5357\u8bed' },
  { label: 'Khmer', value: '\u67ec\u57d4\u5be8\u8bed' },
  { label: 'Burmese', value: '\u7f05\u7538\u8bed' },
  { label: 'Lao', value: '\u8001\u631d\u8bed' },
  { label: 'Hindi', value: '\u5370\u5ea6\u8bed' },
  { label: 'Malay', value: '\u5deb\u8bed' },
  { label: 'Indonesian', value: '\u5370\u5c3c\u8bed' },
  { label: 'Filipino', value: '\u83f2\u5f8b\u5bbe\u8bed' },
  { label: 'Russian', value: '\u4fc4\u8bed' },
  { label: 'French', value: '\u6cd5\u8bed' },
  { label: 'Other', value: '\u5176\u4ed6' },
]
const SONG_TYPE_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Birthday', value: '\u751f\u65e5' },
  { label: 'Celebration', value: '\u559c\u5e86' },
  { label: "Children's", value: '\u513f\u6b4c' },
  { label: 'Duet', value: '\u5bf9\u5531' },
  { label: 'Folk', value: '\u6c11\u6b4c' },
  { label: 'Medley', value: '\u4e32\u70e7' },
  { label: 'Nostalgia', value: '\u6000\u65e7' },
  { label: 'Opera', value: '\u620f\u66f2' },
  { label: 'Romanised', value: '\u5b57\u5e55' },
]
const SORT_TYPE_OPTIONS = [
  { label: 'Top Hits', value: '' },
  { label: 'New Songs', value: 'TopByNewSong' },
]
const SINGER_COUNTRY_OPTIONS = [
  { label: 'All', value: '\u5168\u90e8' },
  { label: 'China', value: '\u5927\u9646' },
  { label: 'Hong Kong / Taiwan', value: '\u6e2f\u53f0' },
  { label: 'English', value: '\u82f1\u8bed' },
  { label: 'Japan', value: '\u65e5\u672c' },
  { label: 'Korea', value: '\u97e9\u56fd' },
  { label: 'Vietnam', value: '\u8d8a\u5357' },
  { label: 'Cambodia', value: '\u67ec\u57d4\u5be8' },
  { label: 'India', value: '\u5370\u5ea6' },
  { label: 'Thailand', value: '\u6cf0\u56fd' },
  { label: 'Philippines', value: '\u83f2\u5f8b\u5bbe' },
  { label: 'Malaysia', value: '\u9a6c\u6765\u897f\u4e9a' },
  { label: 'Myanmar', value: '\u7f05\u7538' },
  { label: 'Indonesia', value: '\u5370\u5c3c' },
  { label: 'Laos', value: '\u8001\u631d' },
  { label: 'Russia', value: '\u4fc4\u7f57\u65af' },
  { label: 'France', value: '\u6cd5\u56fd' },
  { label: 'Other', value: '\u5176\u4ed6' },
]

const activeBaseUrl = ref(window.localStorage.getItem(STORAGE_KEY) || DEFAULT_BASE_URL)
const baseUrlInput = ref(activeBaseUrl.value)
const pageInput = ref(1)
const singerPageInput = ref(1)
const activeMobileTab = ref('topHits')
const activeBrowseTab = ref('topHits')
const commandBarBusy = ref(false)
const commandBarRef = ref(null)
const isDarkMode = ref(window.localStorage.getItem(THEME_STORAGE_KEY) === 'dark')
const micControlledByKod = ref(window.localStorage.getItem(MIC_CONTROL_STORAGE_KEY) === 'true')
const showMixerControls = ref(false)

const searchForm = reactive({
  songName: '',
  singer: '',
  lang: LANGUAGE_OPTIONS[0].value,
  songType: '',
  sortType: '',
})

const singerForm = reactive({
  singer: '',
  singerType: SINGER_COUNTRY_OPTIONS[0].value,
})

const searchState = reactive({
  page: 0,
  maxPage: null,
  loading: false,
  songs: [],
})

const playlistState = reactive({
  loading: false,
  songs: [],
})

const singerState = reactive({
  page: 0,
  maxPage: null,
  loading: false,
  singers: [],
})

const diagnosticsState = reactive({
  lastError: '',
  lastRequest: '',
  lastRequestLabel: '',
  lastResponse: '',
  reportStatus: '',
  events: [],
})

let pollHandle = null
let commandBarResizeObserver = null
let reportStatusTimeout = null

const displayPage = computed(() => searchState.page + 1)
const singerDisplayPage = computed(() => singerState.page + 1)

function clearSearchForm() {
  searchForm.songName = ''
  searchForm.singer = ''
  searchForm.lang = LANGUAGE_OPTIONS[0].value
  searchForm.songType = ''
  searchForm.sortType = ''
  searchState.page = 0
  pageInput.value = 1
}

function resetSearch() {
  clearSearchForm()
  runSearch()
}

function resolveBaseUrl(value) {
  return value.trim() || DEFAULT_BASE_URL
}

function logDiagnosticEvent(message) {
  diagnosticsState.events.unshift(`${new Date().toISOString()} ${message}`)
  diagnosticsState.events.splice(DIAGNOSTIC_EVENT_LIMIT)
}

function setLastRequest(label, details) {
  diagnosticsState.lastRequestLabel = label
  diagnosticsState.lastRequest = details
}

function setLastResponse(details) {
  diagnosticsState.lastResponse = details
}

function setLastError(message) {
  diagnosticsState.lastError = message
}

function clearReportStatus() {
  if (reportStatusTimeout) {
    window.clearTimeout(reportStatusTimeout)
    reportStatusTimeout = null
  }
}

function setReportStatus(message) {
  clearReportStatus()
  diagnosticsState.reportStatus = message

  if (message) {
    reportStatusTimeout = window.setTimeout(() => {
      diagnosticsState.reportStatus = ''
      reportStatusTimeout = null
    }, 4000)
  }
}

function downloadTextFile(filename, text) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(objectUrl)
}

function buildDiagnosticsReport() {
  const lines = [
    'Open KOD issue report',
    `Version: ${packageJson.version}`,
    `Generated: ${new Date().toISOString()}`,
    `Base URL: ${activeBaseUrl.value}`,
    `Active mobile tab: ${activeMobileTab.value}`,
    `Active browse tab: ${activeBrowseTab.value}`,
    `Theme: ${isDarkMode.value ? 'dark' : 'light'}`,
    `Mic controlled by KOD: ${micControlledByKod.value ? 'yes' : 'no'}`,
    `Top Hits filters: title="${searchForm.songName}" singer="${searchForm.singer}" lang="${searchForm.lang}" songType="${searchForm.songType}" sortType="${searchForm.sortType}"`,
    `Top Hits page: ${displayPage.value}${searchState.maxPage ? `/${searchState.maxPage}` : ''}`,
    `Singer filters: singer="${singerForm.singer}" country="${singerForm.singerType}"`,
    `Singer page: ${singerDisplayPage.value}${singerState.maxPage ? `/${singerState.maxPage}` : ''}`,
    `Playlist items: ${playlistState.songs.length}`,
    `Last request: ${diagnosticsState.lastRequestLabel || 'n/a'} ${diagnosticsState.lastRequest || ''}`.trim(),
    `Last response: ${diagnosticsState.lastResponse || 'n/a'}`,
    `Last error: ${diagnosticsState.lastError || 'none'}`,
    `User agent: ${navigator.userAgent}`,
    'Recent events:',
    ...diagnosticsState.events,
  ]

  return lines.join('\n')
}

function buildReportFilename() {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  return `open-kod-issue-report-${stamp}.txt`
}

function downloadIssueReport() {
  try {
    downloadTextFile(buildReportFilename(), buildDiagnosticsReport())
    setReportStatus('Issue report downloaded. Attach it to your email.')
    logDiagnosticEvent('Issue report downloaded')
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    setReportStatus('Unable to download the issue report on this browser.')
    setLastError(message)
    logDiagnosticEvent(`Issue report download failed: ${message}`)
  }
}

function singerImageUrl(fileName) {
  if (!fileName) {
    return ''
  }

  return new URL(`singer/${fileName}`, `${resolveBaseUrl(activeBaseUrl.value).replace(/\/+$/, '')}/`).toString()
}

async function runSearch() {
  searchState.loading = true

  try {
    setLastRequest('SearchServlet', `page=${searchState.page} songName="${searchForm.songName.trim()}" singer="${searchForm.singer.trim()}" lang="${searchForm.lang.trim()}" songType="${searchForm.songType.trim()}" sortType="${searchForm.sortType.trim()}"`)
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
    setLastResponse(`Search returned ${response.number} result(s), max page ${response.maxPage ?? 'n/a'}`)
    setLastError('')
    logDiagnosticEvent(`Search returned ${response.number} result(s)`)
  } catch (error) {
    searchState.maxPage = null
    searchState.songs = []
    setLastError(error instanceof Error ? error.message : String(error))
    setLastResponse('Search failed')
    logDiagnosticEvent(`Search failed: ${diagnosticsState.lastError}`)
    console.error(error)
  } finally {
    searchState.loading = false
  }
}

async function refreshPlaylist(force = false) {
  if (playlistState.loading && !force) {
    return
  }

  playlistState.loading = true

  try {
    setLastRequest('PlaylistServlet', 'type=1 onSelectPage=true')
    const response = await fetchPlaylist(activeBaseUrl.value)
    playlistState.songs = response.songs
    setLastResponse(`Playlist returned ${response.number} item(s)`)
    setLastError('')
  } catch (error) {
    setLastError(error instanceof Error ? error.message : String(error))
    setLastResponse('Playlist refresh failed')
    logDiagnosticEvent(`Playlist refresh failed: ${diagnosticsState.lastError}`)
    console.error(error)
  } finally {
    playlistState.loading = false
  }
}

async function runSingerSearch() {
  singerState.loading = true

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
    setLastResponse(`Singer search returned ${response.number} result(s), max page ${response.maxPage ?? 'n/a'}`)
    setLastError('')
    logDiagnosticEvent(`Singer search returned ${response.number} result(s)`)
  } catch (error) {
    singerState.maxPage = null
    singerState.singers = []
    setLastError(error instanceof Error ? error.message : String(error))
    setLastResponse('Singer search failed')
    logDiagnosticEvent(`Singer search failed: ${diagnosticsState.lastError}`)
    console.error(error)
  } finally {
    singerState.loading = false
  }
}

function submitSingerSearch() {
  singerState.page = 0
  singerPageInput.value = 1
  runSingerSearch()
}

function resetSingerSearch() {
  singerForm.singer = ''
  singerForm.singerType = SINGER_COUNTRY_OPTIONS[0].value
  singerState.page = 0
  singerPageInput.value = 1
  runSingerSearch()
}

function searchTopHitsBySinger(singerName) {
  clearSearchForm()
  searchForm.singer = singerName.trim()
  setBrowseTab('topHits')
  runSearch()
}

function setMobileTab(tab) {
  activeMobileTab.value = tab

  if (tab === 'topHits' || tab === 'singer') {
    activeBrowseTab.value = tab
  }
}

function setBrowseTab(tab) {
  activeBrowseTab.value = tab
  activeMobileTab.value = tab
}

function goToPreviousSingerPage() {
  if (singerState.page === 0 || singerState.loading) {
    return
  }

  singerState.page -= 1
  singerPageInput.value = singerState.page + 1
  runSingerSearch()
}

function goToNextSingerPage() {
  if (singerState.loading) {
    return
  }

  singerState.page += 1
  singerPageInput.value = singerState.page + 1
  runSingerSearch()
}

function goToSingerPage() {
  if (singerState.loading) {
    return
  }

  const nextPage = Math.max(1, Number(singerPageInput.value) || 1)
  singerState.page = nextPage - 1
  singerPageInput.value = nextPage
  runSingerSearch()
}

async function addSong(songId) {
  if (!songId) {
    return
  }

  try {
    setLastRequest('CommandServlet', `cmd=Add1 cmdValue=${songId}`)
    await queueSong(activeBaseUrl.value, songId)
    setLastResponse(`Command Add1 succeeded for ${songId}`)
    setLastError('')
    logDiagnosticEvent(`Queued song ${songId}`)
    await refreshPlaylist(true)
  } catch (error) {
    setLastError(error instanceof Error ? error.message : String(error))
    setLastResponse('Command Add1 failed')
    logDiagnosticEvent(`Queue failed for ${songId}: ${diagnosticsState.lastError}`)
    console.error(error)
  }
}

async function promoteSong(songId) {
  if (!songId) {
    return
  }

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
    logDiagnosticEvent(`Prioritize failed for ${songId}: ${diagnosticsState.lastError}`)
    console.error(error)
  }
}

async function removeSong(songId) {
  if (!songId) {
    return
  }

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
    logDiagnosticEvent(`Delete failed for ${songId}: ${diagnosticsState.lastError}`)
    console.error(error)
  }
}

async function runGlobalCommand(commandRunner) {
  if (commandBarBusy.value) {
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
    logDiagnosticEvent(`Command ${commandRunner.name || 'unknown'} failed: ${diagnosticsState.lastError}`)
    console.error(error)
  } finally {
    commandBarBusy.value = false
  }
}

function submitSearch() {
  searchState.page = 0
  pageInput.value = 1
  runSearch()
}

function goToPreviousPage() {
  if (searchState.page === 0 || searchState.loading) {
    return
  }

  searchState.page -= 1
  pageInput.value = searchState.page + 1
  runSearch()
}

function goToNextPage() {
  if (searchState.loading) {
    return
  }

  searchState.page += 1
  pageInput.value = searchState.page + 1
  runSearch()
}

function goToPage() {
  if (searchState.loading) {
    return
  }

  const nextPage = Math.max(1, Number(pageInput.value) || 1)
  searchState.page = nextPage - 1
  pageInput.value = nextPage
  runSearch()
}

function saveBaseUrl() {
  activeBaseUrl.value = resolveBaseUrl(baseUrlInput.value)
  baseUrlInput.value = activeBaseUrl.value
  window.localStorage.setItem(STORAGE_KEY, activeBaseUrl.value)
  logDiagnosticEvent(`Base URL saved: ${activeBaseUrl.value}`)
  runSearch()
  runSingerSearch()
  refreshPlaylist(true)
}

function syncPolling() {
  if (pollHandle) {
    window.clearInterval(pollHandle)
    pollHandle = null
  }

  pollHandle = window.setInterval(() => {
    refreshPlaylist()
  }, POLL_INTERVAL_MS)
}

function updateCommandBarOffset() {
  const height = commandBarRef.value
    ? Math.ceil(commandBarRef.value.getBoundingClientRect().height)
    : 0

  document.documentElement.style.setProperty('--command-bar-offset', `${height + 16}px`)
}

function applyTheme() {
  document.documentElement.dataset.theme = isDarkMode.value ? 'dark' : 'light'
  window.localStorage.setItem(THEME_STORAGE_KEY, isDarkMode.value ? 'dark' : 'light')
}

function saveMicControlPreference() {
  window.localStorage.setItem(MIC_CONTROL_STORAGE_KEY, micControlledByKod.value ? 'true' : 'false')
}

watch(isDarkMode, () => {
  applyTheme()
})

watch(micControlledByKod, () => {
  saveMicControlPreference()
})

onMounted(() => {
  applyTheme()
  logDiagnosticEvent('Session started')
  syncPolling()
  runSearch()
  runSingerSearch()
  refreshPlaylist()
  updateCommandBarOffset()

  if (typeof ResizeObserver !== 'undefined' && commandBarRef.value) {
    commandBarResizeObserver = new ResizeObserver(() => {
      updateCommandBarOffset()
    })
    commandBarResizeObserver.observe(commandBarRef.value)
  }

  window.addEventListener('resize', updateCommandBarOffset)
})

onBeforeUnmount(() => {
  if (pollHandle) {
    window.clearInterval(pollHandle)
  }

  if (commandBarResizeObserver) {
    commandBarResizeObserver.disconnect()
  }

  clearReportStatus()

  window.removeEventListener('resize', updateCommandBarOffset)
})
</script>

<template>
  <main class="app-shell">
    <div class="mobile-tabs section-gap" role="tablist" aria-label="Main panels">
      <button
        type="button"
        class="mobile-tab"
        :class="{ 'mobile-tab-active': activeMobileTab === 'settings' }"
        :aria-selected="activeMobileTab === 'settings'"
        @click="setMobileTab('settings')"
      >
        Setup
      </button>
      <button
        type="button"
        class="mobile-tab"
        :class="{ 'mobile-tab-active': activeMobileTab === 'topHits' }"
        :aria-selected="activeMobileTab === 'topHits'"
        @click="setBrowseTab('topHits')"
      >
        Top Hits
      </button>
      <button
        type="button"
        class="mobile-tab"
        :class="{ 'mobile-tab-active': activeMobileTab === 'singer' }"
        :aria-selected="activeMobileTab === 'singer'"
        @click="setBrowseTab('singer')"
      >
        Singer
      </button>
      <button
        type="button"
        class="mobile-tab"
        :class="{ 'mobile-tab-active': activeMobileTab === 'playlist' }"
        :aria-selected="activeMobileTab === 'playlist'"
        @click="setMobileTab('playlist')"
      >
        Playlist
      </button>
    </div>

    <div class="desktop-tabs desktop-only section-gap" role="tablist" aria-label="Main panels">
      <button
        data-test="desktop-tab-settings"
        type="button"
        class="mobile-tab"
        :class="{ 'mobile-tab-active': activeBrowseTab === 'settings' }"
        :aria-selected="activeBrowseTab === 'settings'"
        @click="setBrowseTab('settings')"
      >
        Setup
      </button>
      <button
        data-test="desktop-tab-top-hits"
        type="button"
        class="mobile-tab"
        :class="{ 'mobile-tab-active': activeBrowseTab === 'topHits' }"
        :aria-selected="activeBrowseTab === 'topHits'"
        @click="setBrowseTab('topHits')"
      >
        Top Hits
      </button>
      <button
        data-test="desktop-tab-singer"
        type="button"
        class="mobile-tab"
        :class="{ 'mobile-tab-active': activeBrowseTab === 'singer' }"
        :aria-selected="activeBrowseTab === 'singer'"
        @click="setBrowseTab('singer')"
      >
        Singer
      </button>
    </div>

    <div class="main-panels section-gap">
      <div class="primary-column stack">
        <section
          class="panel stack mobile-panel settings-panel"
          :class="{
            'mobile-panel-hidden': activeMobileTab !== 'settings',
            'desktop-panel-hidden': activeBrowseTab !== 'settings',
          }"
        >
          <SettingsPanel
            :base-url-input="baseUrlInput"
            :is-dark-mode="isDarkMode"
            :mic-controlled-by-kod="micControlledByKod"
            :report-status="diagnosticsState.reportStatus"
            :support-email="SUPPORT_EMAIL"
            note-placement="footer"
            @download-report="downloadIssueReport"
            @save-base-url="saveBaseUrl"
            @update:base-url-input="baseUrlInput = $event"
            @update:is-dark-mode="isDarkMode = $event"
            @update:mic-controlled-by-kod="micControlledByKod = $event"
          />
        </section>

        <section
          class="panel stack mobile-panel"
          :class="{
            'mobile-panel-hidden': activeMobileTab !== 'topHits',
            'desktop-panel-hidden': activeBrowseTab !== 'topHits',
          }"
        >
        <div class="section-heading panel-heading">
          <div>
            <h2>Top Hits</h2>
          </div>
        </div>

        <details class="filter-panel">
          <summary class="filter-summary">Search options</summary>
          <form data-test="search-form" class="grid-form filter-form" @submit.prevent="submitSearch">
            <label>
              Song title
              <input v-model="searchForm.songName" data-test="search-song-name" type="text" placeholder="Insert title" />
            </label>
            <label>
              Singer
              <input v-model="searchForm.singer" data-test="search-singer" type="text" placeholder="Insert name" />
            </label>
            <label>
              Language
              <select v-model="searchForm.lang" data-test="search-language">
                <option v-for="option in LANGUAGE_OPTIONS" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </label>
            <label>
              Song type
              <select v-model="searchForm.songType" data-test="search-song-type">
                <option v-for="option in SONG_TYPE_OPTIONS" :key="option.value || 'all-song-type'" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </label>
            <!--
            <label>
              Sort type
              <select v-model="searchForm.sortType" data-test="search-sort-type">
                <option v-for="option in SORT_TYPE_OPTIONS" :key="option.value || 'default-sort-type'" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </label>
            -->
            <div class="filter-actions">
              <button data-test="search-submit" type="submit" :disabled="searchState.loading">
                Search
              </button>
              <button
                data-test="search-reset"
                type="button"
                class="button-secondary"
                :disabled="searchState.loading"
                @click="resetSearch"
              >
                Reset
              </button>
            </div>
          </form>
        </details>

        <p class="results-label">Search results:</p>

        <div class="table-wrap">
          <table>
            <tbody v-if="searchState.songs.length">
              <tr v-for="song in searchState.songs" :key="song.id">
                <td>
                  <div class="singer-cell">
                    <img
                      v-if="song.singerPic"
                      :src="singerImageUrl(song.singerPic)"
                      :alt="`${song.singer} portrait`"
                      class="singer-icon"
                      loading="lazy"
                    />
                  </div>
                </td>
                <td>
                  <div class="song-meta">
                    <div class="song-title-row">
                      <strong>{{ song.name }}</strong>
                    </div>
                    <div class="song-artist">{{ song.singer }}</div>
                  </div>
                </td>
                <td class="action-cell">
                  <button
                    :data-test="`promote-song-${song.id}`"
                    type="button"
                    class="button-secondary button-command button-emoji"
                    @click="promoteSong(song.id)"
                  >
                    ⏫
                  </button>
                  <button
                    :data-test="`add-song-${song.id}`"
                    type="button"
                    class="button-secondary button-command"
                    @click="addSong(song.id)"
                  >
                    ➕<span v-if="song.cloud" class="button-cloud"> ({{ CLOUD_MARKER }})</span>
                  </button>
                </td>
              </tr>
            </tbody>
            <tbody v-else>
              <tr>
                <td colspan="3" class="empty">No results yet.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pagination-stack">
          <div class="pagination-bar">
            <button type="button" class="page-arrow page-arrow-prev" @click="goToPreviousPage" :disabled="searchState.page === 0 || searchState.loading">
              ◀
            </button>
            <span>Page {{ displayPage }}<template v-if="searchState.maxPage">/{{ searchState.maxPage }}</template></span>
            <button type="button" class="page-arrow page-arrow-next" @click="goToNextPage" :disabled="searchState.loading">
              ▶
            </button>
          </div>
          <div class="page-jump-row">
            <label class="page-jump">
              <span>Page:</span>
              <input v-model.number="pageInput" type="text" inputmode="numeric" pattern="[0-9]*" />
            </label>
            <button type="button" @click="goToPage" :disabled="searchState.loading">
              Go
            </button>
          </div>
        </div>
        </section>

        <section
          class="panel stack mobile-panel"
          :class="{
            'mobile-panel-hidden': activeMobileTab !== 'singer',
            'desktop-panel-hidden': activeBrowseTab !== 'singer',
          }"
        >
          <div class="section-heading panel-heading">
            <div>
              <h2>Singer</h2>
            </div>
          </div>

          <details class="filter-panel">
            <summary class="filter-summary">Search options</summary>
            <form data-test="singer-search-form" class="grid-form filter-form" @submit.prevent="submitSingerSearch">
              <label>
                Singer
                <input v-model="singerForm.singer" data-test="singer-search-name" type="text" placeholder="Insert name" />
              </label>
              <label>
                Country
                <select v-model="singerForm.singerType" data-test="singer-search-country">
                  <option v-for="option in SINGER_COUNTRY_OPTIONS" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
              </label>
              <div class="filter-actions">
                <button data-test="singer-search-submit" type="submit" :disabled="singerState.loading">
                  Search
                </button>
                <button
                  data-test="singer-search-reset"
                  type="button"
                  class="button-secondary"
                  :disabled="singerState.loading"
                  @click="resetSingerSearch"
                >
                  Reset
                </button>
              </div>
            </form>
          </details>

          <p class="results-label">Search results:</p>

          <ul v-if="singerState.singers.length" class="singer-list">
            <li v-for="singer in singerState.singers" :key="`${singer.name}-${singer.picture}`" class="singer-list-item">
              <button
                :data-test="`singer-result-${singer.name}`"
                type="button"
                class="singer-row singer-result-button"
                @click="searchTopHitsBySinger(singer.name)"
              >
                <img
                  v-if="singer.picture"
                  :src="singerImageUrl(singer.picture)"
                  :alt="`${singer.name} portrait`"
                  class="singer-icon"
                  loading="lazy"
                />
                <div class="song-meta">
                  <div class="song-title-row">
                    <strong>{{ singer.name }}</strong>
                  </div>
                </div>
              </button>
            </li>
          </ul>
          <p v-else class="empty">{{ singerState.loading ? 'Loading singers...' : 'No singers returned yet.' }}</p>

          <div class="pagination-stack">
            <div class="pagination-bar">
              <button
                data-test="singer-page-prev"
                type="button"
                class="page-arrow page-arrow-prev"
                @click="goToPreviousSingerPage"
                :disabled="singerState.page === 0 || singerState.loading"
              >
                ◀
              </button>
              <span>Page {{ singerDisplayPage }}<template v-if="singerState.maxPage">/{{ singerState.maxPage }}</template></span>
              <button data-test="singer-page-next" type="button" class="page-arrow page-arrow-next" @click="goToNextSingerPage" :disabled="singerState.loading">
                ▶
              </button>
            </div>
            <div class="page-jump-row">
              <label class="page-jump">
                <span>Page:</span>
                <input v-model.number="singerPageInput" data-test="singer-page-input" type="text" inputmode="numeric" pattern="[0-9]*" />
              </label>
              <button type="button" data-test="singer-page-go" @click="goToSingerPage" :disabled="singerState.loading">
                Go
              </button>
            </div>
          </div>
        </section>
      </div>

      <section class="panel stack mobile-panel" :class="{ 'mobile-panel-hidden': activeMobileTab !== 'playlist' }">
        <div class="section-heading panel-heading">
          <div>
            <h2>Playlist</h2>
            <p class="field-help playlist-subtitle">
              <em>Refreshes automatically every {{ POLL_INTERVAL_MS / 1000 }} seconds.</em>
            </p>
          </div>
        </div>

        <ol v-if="playlistState.songs.length" class="playlist">
          <li v-for="song in playlistState.songs" :key="`${song.id}-${song.name}`">
            <div class="playlist-row">
              <div class="song-meta">
                <div class="song-title-row">
                  <strong>{{ song.name }}</strong>
                </div>
                <div class="song-artist">{{ song.singer }}</div>
              </div>
              <div class="action-cell">
                <button
                  :data-test="`playlist-promote-song-${song.id}`"
                  type="button"
                  class="button-secondary button-command button-emoji"
                  @click="promoteSong(song.id)"
                >
                  ⏫
                </button>
                <button
                  :data-test="`delete-song-${song.id}`"
                  type="button"
                  class="button-secondary button-danger button-emoji"
                  @click="removeSong(song.id)"
                >
                  ⛔
                </button>
              </div>
            </div>
          </li>
        </ol>
        <p v-else class="empty">Playlist is empty.</p>
      </section>
    </div>
  </main>

  <div ref="commandBarRef" class="command-bar">
    <div class="command-bar-inner">
      <div v-show="showMixerControls" class="command-bar-row command-bar-row-primary">
        <div class="command-group">
          <span class="command-group-label">Pitch</span>
          <div class="command-group-buttons">
            <button data-test="command-tone-down" type="button" :disabled="commandBarBusy" @click="runGlobalCommand(toneDown)">
              ♭
            </button>
            <button data-test="command-tone-reset" type="button" :disabled="commandBarBusy" @click="runGlobalCommand(toneReset)">
              ♮
            </button>
            <button data-test="command-tone-up" type="button" :disabled="commandBarBusy" @click="runGlobalCommand(toneUp)">
              ♯
            </button>
          </div>
        </div>
        <div class="command-group">
          <span class="command-group-label">Volume</span>
          <div class="command-group-buttons">
            <button data-test="command-mute" type="button" :disabled="commandBarBusy" @click="runGlobalCommand(toggleMute)">
              🔇
            </button>
            <button data-test="command-music-down" type="button" :disabled="commandBarBusy" @click="runGlobalCommand(musicDown)">
              🔉
            </button>
            <button data-test="command-music-up" type="button" :disabled="commandBarBusy" @click="runGlobalCommand(musicUp)">
              🔊
            </button>
            <button data-test="command-mic-down" type="button" :disabled="commandBarBusy || !micControlledByKod" @click="runGlobalCommand(micDown)">
              🎤-
            </button>
            <button data-test="command-mic-up" type="button" :disabled="commandBarBusy || !micControlledByKod" @click="runGlobalCommand(micUp)">
              🎤+
            </button>
          </div>
        </div>
      </div>
      <div class="command-bar-row command-bar-row-secondary">
        <button data-test="command-reset" type="button" :disabled="commandBarBusy" @click="runGlobalCommand(restartDevice)">
          Replay
        </button>
        <button data-test="command-vocals" type="button" :disabled="commandBarBusy" @click="runGlobalCommand(toggleVocals)">
          Vocals
        </button>
        <button data-test="command-play" type="button" :disabled="commandBarBusy" @click="runGlobalCommand(togglePlay)">
          ⏯
        </button>
        <button data-test="command-skip" type="button" :disabled="commandBarBusy" @click="runGlobalCommand(skipSong)">
          ⏭
        </button>
        <button
          data-test="command-toggle-mixer"
          type="button"
          :aria-expanded="showMixerControls"
          :title="showMixerControls ? 'Hide pitch and volume controls' : 'Show pitch and volume controls'"
          @click="showMixerControls = !showMixerControls"
        >
          ☰
        </button>
      </div>
    </div>
  </div>
</template>
