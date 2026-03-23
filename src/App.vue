<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import packageJson from '../package.json'
import CommandBar from './components/CommandBar.vue'
import FavoritesPanel from './components/FavoritesPanel.vue'
import PlaylistPanel from './components/PlaylistPanel.vue'
import SingerPanel from './components/SingerPanel.vue'
import SettingsPanel from './components/SettingsPanel.vue'
import TopHitsPanel from './components/TopHitsPanel.vue'
import { useDiagnostics } from './composables/useDiagnostics'
import { useFavorites } from './composables/useFavorites'
import { useKodApi } from './composables/useKodApi'
import { reloadPage } from './services/browserLocation'
import {
  buildDiagnosticsReport as buildDiagnosticsReportText,
  buildReportFilename,
  downloadTextFile,
} from './services/diagnosticsReport'
import { resolveBaseUrl } from './lib/baseUrl'
import {
  BASE_URL_QUERY_PARAM,
  DIAGNOSTIC_EVENT_LIMIT,
  FAVORITES_STORAGE_KEY,
  FAVORITES_PAGE_SIZE,
  LANGUAGE_OPTIONS,
  MIC_CONTROL_STORAGE_KEY,
  POLL_INTERVAL_MS,
  SINGER_COUNTRY_OPTIONS,
  SONG_TYPE_OPTIONS,
  SUPPORT_EMAIL,
} from './constants/appOptions'
import {
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
} from './services/kodApi'

const initialBaseUrl = getBaseUrlFromQuery()
const initialPrimaryTab = initialBaseUrl ? 'topHits' : 'settings'
const activeBaseUrl = ref(initialBaseUrl)
const baseUrlInput = ref(initialBaseUrl)
const pageInput = ref(1)
const singerPageInput = ref(1)
const favoritesPageInput = ref(1)
const activeMobileTab = ref(initialPrimaryTab)
const activeBrowseTab = ref(initialPrimaryTab)
const commandBarRef = ref(null)
const systemPrefersDarkMode = ref(getSystemDarkModePreference())
const themeOverride = ref(null)
const isDarkMode = computed(() => themeOverride.value ?? systemPrefersDarkMode.value)
const micControlledByKod = ref(window.localStorage.getItem(MIC_CONTROL_STORAGE_KEY) === 'true')
const showMixerControls = ref(false)
const favoritesPage = ref(0)
const favoritesTransferStatus = ref('')

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
  errorMessage: '',
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
  errorMessage: '',
})

const {
  diagnosticsState,
  logDiagnosticEvent,
  setLastRequest,
  setLastResponse,
  setLastError,
  setReportStatus,
  disposeDiagnostics,
} = useDiagnostics({ eventLimit: DIAGNOSTIC_EVENT_LIMIT })

let pollHandle = null
let commandBarResizeObserver = null
let themeMediaQuery = null

const displayPage = computed(() => searchState.page + 1)
const singerDisplayPage = computed(() => singerState.page + 1)

function clearSearchForm() {
  searchForm.songName = ''
  searchForm.singer = ''
  searchForm.lang = LANGUAGE_OPTIONS[0].value
  searchForm.songType = ''
  searchForm.sortType = ''
}

function resetSearch() {
  clearSearchForm()
}

function hasConfiguredBaseUrl() {
  return Boolean(activeBaseUrl.value.trim())
}

function getBaseUrlFromQuery() {
  const currentUrl = new URL(window.location.href)
  return resolveBaseUrl(currentUrl.searchParams.get(BASE_URL_QUERY_PARAM) || '')
}

function getSystemDarkModePreference() {
  return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ?? false
}

function setThemeOverride(nextValue) {
  themeOverride.value = nextValue
}

function syncBaseUrlQuery(value) {
  const currentUrl = new URL(window.location.href)
  const trimmedValue = value.trim()

  if (trimmedValue) {
    currentUrl.searchParams.set(BASE_URL_QUERY_PARAM, trimmedValue)
  } else {
    currentUrl.searchParams.delete(BASE_URL_QUERY_PARAM)
  }

  window.history.replaceState({}, '', currentUrl)
}

function reloadIntoPrimaryTab() {
  reloadPage()
}

function buildDiagnosticsReport() {
  return buildDiagnosticsReportText({
    version: packageJson.version,
    generatedAt: new Date().toISOString(),
    baseUrl: activeBaseUrl.value,
    activeMobileTab: activeMobileTab.value,
    activeBrowseTab: activeBrowseTab.value,
    isDarkMode: isDarkMode.value,
    micControlledByKod: micControlledByKod.value,
    searchForm,
    displayPage: displayPage.value,
    searchMaxPage: searchState.maxPage,
    singerForm,
    singerDisplayPage: singerDisplayPage.value,
    singerMaxPage: singerState.maxPage,
    playlistItemCount: playlistState.songs.length,
    lastRequestLabel: diagnosticsState.lastRequestLabel,
    lastRequest: diagnosticsState.lastRequest,
    lastResponse: diagnosticsState.lastResponse,
    lastError: diagnosticsState.lastError,
    userAgent: navigator.userAgent,
    events: diagnosticsState.events,
  })
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
  if (!fileName || !hasConfiguredBaseUrl()) {
    return ''
  }

  return new URL(`singer/${fileName}`, `${activeBaseUrl.value.replace(/\/+$/, '')}/`).toString()
}

const {
  commandBarBusy,
  runSearch,
  refreshPlaylist,
  runSingerSearch,
  addSong,
  promoteSong,
  removeSong,
  runGlobalCommand,
  isSongQueued,
  isSongPending,
} = useKodApi({
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

function submitSingerSearch() {
  singerState.page = 0
  singerPageInput.value = 1
  runSingerSearch()
}

function resetSingerSearch() {
  singerForm.singer = ''
  singerForm.singerType = SINGER_COUNTRY_OPTIONS[0].value
}

function searchTopHitsBySinger(singerName) {
  clearSearchForm()
  searchForm.singer = singerName.trim()
  setBrowseTab('topHits')
  searchState.page = 0
  pageInput.value = 1
  runSearch()
}

function setMobileTab(tab) {
  activeMobileTab.value = tab
}

function setBrowseTab(tab) {
  activeBrowseTab.value = tab
  activeMobileTab.value = tab
}

function goToSetup() {
  setBrowseTab('settings')
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

function goToPreviousFavoritesPage() {
  if (favoritesPage.value === 0) {
    return
  }

  favoritesPage.value -= 1
  favoritesPageInput.value = favoritesPage.value + 1
}

function goToNextFavoritesPage() {
  if (favoritesPage.value >= favoriteTotalPages.value - 1) {
    return
  }

  favoritesPage.value += 1
  favoritesPageInput.value = favoritesPage.value + 1
}

function goToFavoritesPage() {
  const nextPage = Math.min(Math.max(1, Number(favoritesPageInput.value) || 1), favoriteTotalPages.value)

  favoritesPage.value = nextPage - 1
  favoritesPageInput.value = nextPage
}

const baseUrlError = ref('')

async function saveResolvedBaseUrl(nextBaseUrl = baseUrlInput.value) {
  const trimmedBaseUrl = nextBaseUrl.trim()
  const resolvedBaseUrl = resolveBaseUrl(nextBaseUrl)

  if (trimmedBaseUrl && !resolvedBaseUrl) {
    baseUrlError.value = 'Enter a valid server URL, for example: http://device-ip:8080'
    return
  }

  baseUrlError.value = ''
  baseUrlInput.value = resolvedBaseUrl

  if (!resolvedBaseUrl) {
    activeBaseUrl.value = ''
    syncBaseUrlQuery('')
    logDiagnosticEvent('Base URL cleared')
    reloadIntoPrimaryTab()
    return
  }

  activeBaseUrl.value = resolvedBaseUrl
  syncBaseUrlQuery(resolvedBaseUrl)
  logDiagnosticEvent(`Base URL saved: ${resolvedBaseUrl}`)
  reloadIntoPrimaryTab()
}

async function saveBaseUrl() {
  await saveResolvedBaseUrl(baseUrlInput.value)
}

async function handleScannedBaseUrl(scannedBaseUrl) {
  await saveResolvedBaseUrl(scannedBaseUrl)
}

function initializeDeviceAccess() {
  syncPolling()
  runSearch()
  runSingerSearch()
  refreshPlaylist()
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
}

function syncThemePreference(event) {
  systemPrefersDarkMode.value = event.matches
}

function saveMicControlPreference() {
  window.localStorage.setItem(MIC_CONTROL_STORAGE_KEY, micControlledByKod.value ? 'true' : 'false')
}

function buildFavoritesFilename(now = new Date()) {
  const stamp = now.toISOString().replace(/[:.]/g, '-')
  return `teoheng-web-app-favorites-${stamp}.json`
}

function buildFavoritesImportStatus({ addedCount, duplicateCount, invalidCount, totalCount }) {
  const details = [`${addedCount} added`]

  if (duplicateCount) {
    details.push(`${duplicateCount} duplicates skipped`)
  }

  if (invalidCount) {
    details.push(`${invalidCount} invalid skipped`)
  }

  details.push(`${totalCount} total`)

  return `Imported favourites: ${details.join(', ')}.`
}

function downloadFavorites() {
  try {
    downloadTextFile(buildFavoritesFilename(), exportFavoriteSongs(), 'application/json;charset=utf-8')
    favoritesTransferStatus.value = `Downloaded ${favoriteSongs.value.length} favourites.`
    logDiagnosticEvent(`Favorites downloaded (${favoriteSongs.value.length} items)`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    favoritesTransferStatus.value = 'Unable to download favourites.'
    setLastError(message)
    logDiagnosticEvent(`Favorites download failed: ${message}`)
  }
}

async function importFavorites(file) {
  if (!file) {
    return
  }

  try {
    const parsed = JSON.parse(await file.text())
    const { addedCount, duplicateCount, invalidCount, totalCount } = importFavoriteSongs(parsed)
    favoritesTransferStatus.value = buildFavoritesImportStatus({ addedCount, duplicateCount, invalidCount, totalCount })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    favoritesTransferStatus.value = 'Unable to import favourites JSON.'
    setLastError(message)
    logDiagnosticEvent(`Favorites import failed: ${message}`)
  }
}

const {
  favoriteSongs,
  exportFavoriteSongs,
  importFavoriteSongs,
  isFavoriteSong,
  syncFavoriteSongIds,
  toggleFavoriteSong: addFavoriteSong,
} = useFavorites({
  storageKey: FAVORITES_STORAGE_KEY,
  logEvent: logDiagnosticEvent,
})

const favoriteTotalPages = computed(() => Math.max(1, Math.ceil(favoriteSongs.value.length / FAVORITES_PAGE_SIZE)))
const favoriteDisplayPage = computed(() => favoritesPage.value + 1)
const pagedFavoriteSongs = computed(() => {
  const startIndex = favoritesPage.value * FAVORITES_PAGE_SIZE
  return favoriteSongs.value.slice(startIndex, startIndex + FAVORITES_PAGE_SIZE)
})

watch(isDarkMode, () => {
  applyTheme()
})

watch(micControlledByKod, () => {
  saveMicControlPreference()
})

watch(
  () => favoriteSongs.value.length,
  () => {
    const maxPageIndex = Math.max(0, favoriteTotalPages.value - 1)

    if (favoritesPage.value > maxPageIndex) {
      favoritesPage.value = maxPageIndex
    }

    favoritesPageInput.value = favoritesPage.value + 1
  },
)

onMounted(() => {
  syncFavoriteSongIds()
  applyTheme()
  themeMediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)') ?? null

  if (themeMediaQuery) {
    themeMediaQuery.addEventListener('change', syncThemePreference)
  }

  logDiagnosticEvent('Session started')
  initializeDeviceAccess()
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

  if (themeMediaQuery) {
    themeMediaQuery.removeEventListener('change', syncThemePreference)
  }

  disposeDiagnostics()

  window.removeEventListener('resize', updateCommandBarOffset)
})
</script>

<template>
  <main class="app-shell">
    <div class="mobile-tabs section-gap" role="tablist" aria-label="Main panels">
      <button
        data-test="mobile-tab-settings"
        type="button"
        class="mobile-tab"
        :class="{ 'mobile-tab-active': activeMobileTab === 'settings' }"
        :aria-selected="activeMobileTab === 'settings'"
        @click="setBrowseTab('settings')"
      >
        Setup
      </button>
      <button
        data-test="mobile-tab-top-hits"
        type="button"
        class="mobile-tab"
        :class="{ 'mobile-tab-active': activeMobileTab === 'topHits' }"
        :aria-selected="activeMobileTab === 'topHits'"
        @click="setBrowseTab('topHits')"
      >
        Top Hits
      </button>
      <button
        data-test="mobile-tab-singer"
        type="button"
        class="mobile-tab"
        :class="{ 'mobile-tab-active': activeMobileTab === 'singer' }"
        :aria-selected="activeMobileTab === 'singer'"
        @click="setBrowseTab('singer')"
      >
        Singer
      </button>
      <button
        data-test="mobile-tab-playlist"
        type="button"
        class="mobile-tab"
        :class="{ 'mobile-tab-active': activeMobileTab === 'playlist' }"
        :aria-selected="activeMobileTab === 'playlist'"
        @click="setMobileTab('playlist')"
      >
        Playlist
      </button>
      <button
        data-test="mobile-tab-favorites"
        type="button"
        class="mobile-tab"
        :class="{ 'mobile-tab-active': activeMobileTab === 'favorites' }"
        :aria-selected="activeMobileTab === 'favorites'"
        @click="setBrowseTab('favorites')"
      >
        Favourites
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
      <button
        data-test="desktop-tab-favorites"
        type="button"
        class="mobile-tab"
        :class="{ 'mobile-tab-active': activeBrowseTab === 'favorites' }"
        :aria-selected="activeBrowseTab === 'favorites'"
        @click="setBrowseTab('favorites')"
      >
        Favourites
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
            :base-url-error="baseUrlError"
            :is-dark-mode="isDarkMode"
            :mic-controlled-by-kod="micControlledByKod"
            :report-status="diagnosticsState.reportStatus"
            :support-email="SUPPORT_EMAIL"
            note-placement="footer"
            @download-report="downloadIssueReport"
            @scanner-detected-base-url="handleScannedBaseUrl"
            @save-base-url="saveBaseUrl"
            @update:base-url-input="baseUrlInput = $event"
            @update:is-dark-mode="setThemeOverride"
            @update:mic-controlled-by-kod="micControlledByKod = $event"
          />
        </section>

        <TopHitsPanel
          :active-mobile-tab="activeMobileTab"
          :active-browse-tab="activeBrowseTab"
          :search-state="searchState"
          :search-form="searchForm"
          :language-options="LANGUAGE_OPTIONS"
          :song-type-options="SONG_TYPE_OPTIONS"
          :display-page="displayPage"
          :page-input="pageInput"
          :singer-image-url="singerImageUrl"
          :is-favorite-song="isFavoriteSong"
          :is-song-queued="isSongQueued"
          :is-song-pending="isSongPending"
          @go-to-setup="goToSetup"
          @submit-search="submitSearch"
          @reset-search="resetSearch"
          @promote-song="promoteSong"
          @add-song="addSong"
          @favorite-song="addFavoriteSong"
          @update:page-input="pageInput = $event"
          @go-to-previous-page="goToPreviousPage"
          @go-to-next-page="goToNextPage"
          @go-to-page="goToPage"
        />

        <SingerPanel
          :active-mobile-tab="activeMobileTab"
          :active-browse-tab="activeBrowseTab"
          :singer-state="singerState"
          :singer-form="singerForm"
          :singer-country-options="SINGER_COUNTRY_OPTIONS"
          :singer-display-page="singerDisplayPage"
          :singer-page-input="singerPageInput"
          :singer-image-url="singerImageUrl"
          @go-to-setup="goToSetup"
          @submit-search="submitSingerSearch"
          @reset-search="resetSingerSearch"
          @search-top-hits-by-singer="searchTopHitsBySinger"
          @update:singer-page-input="singerPageInput = $event"
          @go-to-previous-page="goToPreviousSingerPage"
          @go-to-next-page="goToNextSingerPage"
          @go-to-page="goToSingerPage"
        />

        <FavoritesPanel
          :active-mobile-tab="activeMobileTab"
          :active-browse-tab="activeBrowseTab"
          :favorite-songs="pagedFavoriteSongs"
          :favorite-count="favoriteSongs.length"
          :favorite-display-page="favoriteDisplayPage"
          :favorite-page-input="favoritesPageInput"
          :favorite-total-pages="favoriteTotalPages"
          :favorites-transfer-status="favoritesTransferStatus"
          :singer-image-url="singerImageUrl"
          :is-song-queued="isSongQueued"
          :is-song-pending="isSongPending"
          @download-favorites="downloadFavorites"
          @import-favorites="importFavorites"
          @promote-song="promoteSong"
          @add-song="addSong"
          @favorite-song="addFavoriteSong"
          @update:favorite-page-input="favoritesPageInput = $event"
          @go-to-previous-page="goToPreviousFavoritesPage"
          @go-to-next-page="goToNextFavoritesPage"
          @go-to-page="goToFavoritesPage"
        />
      </div>

      <PlaylistPanel
        :active-mobile-tab="activeMobileTab"
        :playlist-state="playlistState"
        :poll-interval-ms="POLL_INTERVAL_MS"
        :is-favorite-song="isFavoriteSong"
        :is-song-pending="isSongPending"
        @promote-song="promoteSong"
        @remove-song="removeSong"
        @favorite-song="addFavoriteSong"
      />
    </div>
  </main>

  <div ref="commandBarRef" class="command-bar">
    <CommandBar
      :command-bar-busy="commandBarBusy"
      :mic-controlled-by-kod="micControlledByKod"
      :show-mixer-controls="showMixerControls"
      @toggle-mixer="showMixerControls = !showMixerControls"
      @reset="runGlobalCommand(restartDevice)"
      @vocals="runGlobalCommand(toggleVocals)"
      @play="runGlobalCommand(togglePlay)"
      @skip="runGlobalCommand(skipSong)"
      @tone-down="runGlobalCommand(toneDown)"
      @tone-reset="runGlobalCommand(toneReset)"
      @tone-up="runGlobalCommand(toneUp)"
      @mute="runGlobalCommand(toggleMute)"
      @music-down="runGlobalCommand(musicDown)"
      @music-up="runGlobalCommand(musicUp)"
      @mic-down="runGlobalCommand(micDown)"
      @mic-up="runGlobalCommand(micUp)"
    />
  </div>
</template>
