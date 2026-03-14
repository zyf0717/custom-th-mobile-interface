<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import {
  DEFAULT_BASE_URL,
  deleteSong,
  fetchPlaylist,
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
const STORAGE_KEY = 'open-kod-base-url'
const THEME_STORAGE_KEY = 'open-kod-theme'
const CLOUD_MARKER = '\u2601'
const LANGUAGE_OPTIONS = [
  { label: 'All', value: '\u5168\u90e8' },
  { label: 'Mandarin', value: '\u56fd\u8bed' },
  { label: 'Cantonese', value: '\u7ca4\u8bed' },
  { label: 'English', value: '\u82f1\u8bed' },
]

const activeBaseUrl = ref(window.localStorage.getItem(STORAGE_KEY) || DEFAULT_BASE_URL)
const baseUrlInput = ref(activeBaseUrl.value)
const autoRefresh = ref(true)
const pageInput = ref(1)
const activeMobileTab = ref('search')
const commandBarBusy = ref(false)
const commandBarRef = ref(null)
const isDarkMode = ref(window.localStorage.getItem(THEME_STORAGE_KEY) === 'dark')

const searchForm = reactive({
  songName: '',
  singer: '',
  lang: LANGUAGE_OPTIONS[0].value,
  songType: '',
  sortType: '',
})

const searchState = reactive({
  page: 0,
  maxPage: null,
  number: 0,
  status: 'Ready to search.',
  loading: false,
  songs: [],
})

const playlistState = reactive({
  loading: false,
  number: 0,
  songs: [],
})

let pollHandle = null
let commandBarResizeObserver = null

const displayPage = computed(() => searchState.page + 1)

function resetSearch() {
  searchForm.songName = ''
  searchForm.singer = ''
  searchForm.lang = LANGUAGE_OPTIONS[0].value
  searchForm.songType = ''
  searchForm.sortType = ''
  searchState.page = 0
  pageInput.value = 1
  runSearch()
}

function resolveBaseUrl(value) {
  return value.trim() || DEFAULT_BASE_URL
}

function singerImageUrl(fileName) {
  if (!fileName) {
    return ''
  }

  return new URL(`singer/${fileName}`, `${resolveBaseUrl(activeBaseUrl.value).replace(/\/+$/, '')}/`).toString()
}

async function runSearch() {
  searchState.loading = true
  searchState.status = `Searching page ${displayPage.value}...`

  try {
    const response = await searchSongs(activeBaseUrl.value, {
      songName: searchForm.songName.trim(),
      songType: searchForm.songType.trim(),
      singer: searchForm.singer.trim(),
      lang: searchForm.lang.trim(),
      sortType: searchForm.sortType.trim(),
      page: searchState.page,
    })

    searchState.page = response.page
    pageInput.value = response.page + 1
    searchState.maxPage = response.maxPage
    searchState.number = response.number
    searchState.songs = response.songs
    searchState.status = response.songs.length
      ? `Showing ${response.number} result(s) on page ${response.page + 1}.`
      : 'No songs returned for this query.'
  } catch (error) {
    searchState.songs = []
    searchState.status = error.message
    console.error(error)
  } finally {
    searchState.loading = false
  }
}

async function refreshPlaylist() {
  playlistState.loading = true

  try {
    const response = await fetchPlaylist(activeBaseUrl.value)
    playlistState.number = response.number
    playlistState.songs = response.songs
  } catch (error) {
    console.error(error)
  } finally {
    playlistState.loading = false
  }
}

async function addSong(songId) {
  if (!songId) {
    return
  }

  try {
    await queueSong(activeBaseUrl.value, songId)
    await refreshPlaylist()
  } catch (error) {
    console.error(error)
  }
}

async function promoteSong(songId) {
  if (!songId) {
    return
  }

  try {
    await prioritizeSong(activeBaseUrl.value, songId)
    await refreshPlaylist()
  } catch (error) {
    console.error(error)
  }
}

async function removeSong(songId) {
  if (!songId) {
    return
  }

  try {
    await deleteSong(activeBaseUrl.value, songId)
    await refreshPlaylist()
  } catch (error) {
    console.error(error)
  }
}

async function runGlobalCommand(commandRunner) {
  if (commandBarBusy.value) {
    return
  }

  commandBarBusy.value = true

  try {
    await commandRunner(activeBaseUrl.value)
    await refreshPlaylist()
  } catch (error) {
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
  runSearch()
  refreshPlaylist()
}

function syncPolling() {
  if (pollHandle) {
    window.clearInterval(pollHandle)
    pollHandle = null
  }

  if (autoRefresh.value) {
    pollHandle = window.setInterval(() => {
      refreshPlaylist()
    }, POLL_INTERVAL_MS)
  }
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

watch(autoRefresh, () => {
  syncPolling()
})

watch(isDarkMode, () => {
  applyTheme()
})

onMounted(() => {
  applyTheme()
  syncPolling()
  runSearch()
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

  window.removeEventListener('resize', updateCommandBarOffset)
})
</script>

<template>
  <main class="app-shell">
    <section class="hero-panel panel desktop-only">
      <header class="hero">
        <div class="hero-copy">
          <h1>Open KOD</h1>
          <p class="subtitle">
            An alternative interface for the same device endpoints used by the default KOD app.
          </p>
          <p class="subtitle">
            <em>Note: this web app does not send any device data outside your local network.</em>
          </p>
        </div>

        <form class="stack" @submit.prevent="saveBaseUrl">
          <label>
            <span class="field-help">Scan the QR code on the KTV display, then paste the server URL here, for example: <code>http://192.168.1.123:8080</code></span>
            <div class="input-action-row">
              <input
                v-model="baseUrlInput"
                data-test="base-url-input"
                type="url"
                placeholder="http://192.168.0.8:8080"
              />
              <button data-test="save-base-url" type="button" class="button-emoji" @click="saveBaseUrl">➤</button>
            </div>
          </label>
          <button
            type="button"
            class="button-secondary theme-toggle"
            :aria-pressed="isDarkMode"
            :title="isDarkMode ? 'Switch to light theme' : 'Switch to dark theme'"
            @click="isDarkMode = !isDarkMode"
          >
            {{ isDarkMode ? '☀︎' : '⏾' }}
          </button>
        </form>
      </header>
    </section>

    <div class="mobile-tabs section-gap" role="tablist" aria-label="Main panels">
      <button
        type="button"
        class="mobile-tab"
        :class="{ 'mobile-tab-active': activeMobileTab === 'settings' }"
        :aria-selected="activeMobileTab === 'settings'"
        @click="activeMobileTab = 'settings'"
      >
        Settings
      </button>
      <button
        type="button"
        class="mobile-tab"
        :class="{ 'mobile-tab-active': activeMobileTab === 'search' }"
        :aria-selected="activeMobileTab === 'search'"
        @click="activeMobileTab = 'search'"
      >
        Search
      </button>
      <button
        type="button"
        class="mobile-tab"
        :class="{ 'mobile-tab-active': activeMobileTab === 'playlist' }"
        :aria-selected="activeMobileTab === 'playlist'"
        @click="activeMobileTab = 'playlist'"
      >
        Playlist
      </button>
    </div>

    <div class="main-panels section-gap">
      <section class="panel stack mobile-panel mobile-only" :class="{ 'mobile-panel-hidden': activeMobileTab !== 'settings' }">
        <div class="hero-copy">
          <h1>Open KOD</h1>
          <p class="subtitle">
            An alternative interface for the same device endpoints used by the default KOD app.
          </p>
          <p class="subtitle">
            <em>Note: this web app does not send any device data outside your local network.</em>
          </p>
        </div>

        <form class="stack" @submit.prevent="saveBaseUrl">
          <label>
            <span class="field-help">Scan the QR code on the KTV display, then paste the server URL here, for example: <code>http://192.168.1.123:8080</code></span>
            <div class="input-action-row">
              <input
                v-model="baseUrlInput"
                data-test="base-url-input"
                type="url"
                placeholder="http://192.168.0.8:8080"
              />
              <button data-test="save-base-url" type="button" class="button-emoji" @click="saveBaseUrl">➤</button>
            </div>
          </label>
          <button
            type="button"
            class="button-secondary theme-toggle"
            :aria-pressed="isDarkMode"
            :title="isDarkMode ? 'Switch to light theme' : 'Switch to dark theme'"
            @click="isDarkMode = !isDarkMode"
          >
            {{ isDarkMode ? '☀︎' : '⏾' }}
          </button>
        </form>
      </section>

      <section class="panel stack mobile-panel" :class="{ 'mobile-panel-hidden': activeMobileTab !== 'search' }">
        <div class="section-heading panel-heading">
          <div>
            <h2>Song Search</h2>
          </div>
        </div>

        <details class="filter-panel">
          <summary class="filter-summary">Search options</summary>
          <form class="grid-form filter-form" @submit.prevent="submitSearch">
            <label>
              Song name
              <input v-model="searchForm.songName" type="text" placeholder="Song title" />
            </label>
            <label>
              Singer
              <input v-model="searchForm.singer" type="text" placeholder="Singer name" />
            </label>
            <label>
              Language
              <select v-model="searchForm.lang">
                <option v-for="option in LANGUAGE_OPTIONS" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </label>
            <label>
              Song type
              <input v-model="searchForm.songType" type="text" placeholder="Optional" />
            </label>
            <label>
              Sort type
              <input v-model="searchForm.sortType" type="text" placeholder="Optional" />
            </label>
            <div class="filter-actions">
              <button data-test="search-submit" type="submit" :disabled="searchState.loading">
                Search
              </button>
              <button type="button" class="button-secondary" :disabled="searchState.loading" @click="resetSearch">
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
            <button type="button" @click="goToPreviousPage" :disabled="searchState.page === 0 || searchState.loading">
              ◀
            </button>
            <span>Page {{ displayPage }}</span>
            <button type="button" @click="goToNextPage" :disabled="searchState.loading">
              ▶
            </button>
          </div>
          <div class="page-jump-row">
            <label class="page-jump">
              <span>Page:</span>
              <input v-model.number="pageInput" type="number" min="1" />
            </label>
            <button type="button" @click="goToPage" :disabled="searchState.loading">
              Go
            </button>
          </div>
        </div>
      </section>

      <section class="panel stack mobile-panel" :class="{ 'mobile-panel-hidden': activeMobileTab !== 'playlist' }">
        <div class="section-heading panel-heading">
          <div>
            <h2>Playlist</h2>
          </div>
          <div class="toolbar">
            <label class="checkbox">
              <input v-model="autoRefresh" type="checkbox" />
              Auto refresh
            </label>
            <button
              data-test="refresh-playlist"
              type="button"
              @click="refreshPlaylist"
              :disabled="playlistState.loading"
            >
              {{ playlistState.loading ? 'Refreshing...' : 'Refresh' }}
            </button>
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
          <button data-test="command-mic-down" type="button" :disabled="commandBarBusy" @click="runGlobalCommand(micDown)">
            🎤-
          </button>
          <button data-test="command-mic-up" type="button" :disabled="commandBarBusy" @click="runGlobalCommand(micUp)">
            🎤+
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
