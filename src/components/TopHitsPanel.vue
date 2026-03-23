<script setup>
import { ref } from 'vue'

defineProps({
  activeMobileTab: {
    type: String,
    required: true,
  },
  activeBrowseTab: {
    type: String,
    required: true,
  },
  searchState: {
    type: Object,
    required: true,
  },
  searchForm: {
    type: Object,
    required: true,
  },
  languageOptions: {
    type: Array,
    required: true,
  },
  songTypeOptions: {
    type: Array,
    required: true,
  },
  displayPage: {
    type: Number,
    required: true,
  },
  pageInput: {
    type: [Number, String],
    required: true,
  },
  singerImageUrl: {
    type: Function,
    required: true,
  },
  isFavoriteSong: {
    type: Function,
    required: true,
  },
  isSongQueued: {
    type: Function,
    required: true,
  },
  isSongPending: {
    type: Function,
    required: true,
  },
})

const emit = defineEmits([
  'go-to-setup',
  'submit-search',
  'reset-search',
  'promote-song',
  'add-song',
  'favorite-song',
  'update:page-input',
  'go-to-previous-page',
  'go-to-next-page',
  'go-to-page',
])

const filterPanelRef = ref(null)

function collapseFilterPanel() {
  if (filterPanelRef.value) {
    filterPanelRef.value.open = false
  }
}

function submitSearch() {
  emit('submit-search')
  collapseFilterPanel()
}

function resetSearch() {
  emit('reset-search')
  collapseFilterPanel()
}

function updatePageInput(event) {
  const nextValue = event.target.value
  emit('update:page-input', nextValue === '' ? '' : Number(nextValue))
}
</script>

<template>
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

    <div v-if="searchState.errorMessage" class="empty empty-state error-state">
      <span>{{ searchState.errorMessage }}</span>
      <button data-test="top-hits-go-setup" type="button" class="button-secondary" @click="emit('go-to-setup')">
        Go to Setup
      </button>
    </div>
    <template v-else>
      <details ref="filterPanelRef" class="filter-panel">
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
              <option v-for="option in languageOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>
          <label>
            Song type
            <select v-model="searchForm.songType" data-test="search-song-type">
              <option v-for="option in songTypeOptions" :key="option.value || 'all-song-type'" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>
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

      <div class="pagination-stack">
        <div class="pagination-bar">
          <button
            type="button"
            class="page-arrow page-arrow-prev"
            :disabled="searchState.page === 0 || searchState.loading"
            @click="emit('go-to-previous-page')"
          >
            ◀
          </button>
          <span>{{ displayPage }}<template v-if="searchState.maxPage">/{{ searchState.maxPage }}</template></span>
          <button type="button" class="page-arrow page-arrow-next" :disabled="searchState.loading" @click="emit('go-to-next-page')">
            ▶
          </button>
        </div>
        <div class="page-jump-row">
          <label class="page-jump">
            <input :value="pageInput" type="text" inputmode="numeric" pattern="[0-9]*" @input="updatePageInput" />
          </label>
          <button type="button" :disabled="searchState.loading" @click="emit('go-to-page')">
            Go
          </button>
        </div>
      </div>

      <div class="table-wrap">
        <table>
          <tbody v-if="searchState.songs.length">
            <tr v-for="song in searchState.songs" :key="song.id">
              <td class="top-hit-main-cell">
                <div class="top-hit-row-content">
                  <img
                    v-if="song.singerPic"
                    :src="singerImageUrl(song.singerPic)"
                    :alt="`${song.singer} portrait`"
                    class="singer-icon"
                    loading="lazy"
                  />
                  <div class="song-meta">
                    <div class="song-title-row">
                      <strong>{{ song.name }}</strong>
                    </div>
                    <div class="song-artist">{{ song.singer }}</div>
                  </div>
                </div>
              </td>
              <td class="top-hit-action-cell">
                <div class="action-cell">
                  <button
                    :data-test="`favorite-song-${song.id}`"
                    type="button"
                    class="button-secondary button-command button-emoji"
                    :aria-label="isFavoriteSong(song.id) ? `Remove ${song.name} from favorites` : `Add ${song.name} to favorites`"
                    @click="emit('favorite-song', song)"
                  >
                    {{ isFavoriteSong(song.id) ? '⭐️' : 'Fav' }}
                  </button>
                  <button
                    :data-test="`promote-song-${song.id}`"
                    type="button"
                    class="button-secondary button-command button-emoji"
                    :disabled="isSongPending(song.id)"
                    @click="emit('promote-song', song.id)"
                  >
                    ⏫
                  </button>
                  <button
                    :data-test="`add-song-${song.id}`"
                    type="button"
                    class="button-secondary button-command"
                  :disabled="isSongPending(song.id)"
                  @click="emit('add-song', song.id)"
                >
                  {{ isSongQueued(song.id) ? 'Del' : 'Add' }}
                </button>
              </div>
            </td>
            </tr>
          </tbody>
          <tbody v-else>
            <tr class="top-hits-empty-row">
              <td colspan="2" class="empty">
                <div class="empty-state">
                  <span>{{ searchState.loading ? 'Loading songs...' : 'No results yet.' }}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination-stack">
        <div class="pagination-bar">
          <button
            type="button"
            class="page-arrow page-arrow-prev"
            :disabled="searchState.page === 0 || searchState.loading"
            @click="emit('go-to-previous-page')"
          >
            ◀
          </button>
          <span>{{ displayPage }}<template v-if="searchState.maxPage">/{{ searchState.maxPage }}</template></span>
          <button type="button" class="page-arrow page-arrow-next" :disabled="searchState.loading" @click="emit('go-to-next-page')">
            ▶
          </button>
        </div>
        <div class="page-jump-row">
          <label class="page-jump">
            <input :value="pageInput" type="text" inputmode="numeric" pattern="[0-9]*" @input="updatePageInput" />
          </label>
          <button type="button" :disabled="searchState.loading" @click="emit('go-to-page')">
            Go
          </button>
        </div>
      </div>
    </template>
  </section>
</template>
