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
  singerState: {
    type: Object,
    required: true,
  },
  singerForm: {
    type: Object,
    required: true,
  },
  singerCountryOptions: {
    type: Array,
    required: true,
  },
  singerDisplayPage: {
    type: Number,
    required: true,
  },
  singerPageInput: {
    type: [Number, String],
    required: true,
  },
  singerImageUrl: {
    type: Function,
    required: true,
  },
})

const emit = defineEmits([
  'go-to-setup',
  'submit-search',
  'reset-search',
  'search-top-hits-by-singer',
  'update:singer-page-input',
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

function updateSingerPageInput(event) {
  const nextValue = event.target.value
  emit('update:singer-page-input', nextValue === '' ? '' : Number(nextValue))
}
</script>

<template>
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

    <div v-if="singerState.errorMessage" class="empty empty-state error-state">
      <span>{{ singerState.errorMessage }}</span>
      <button data-test="singer-go-setup" type="button" class="button-secondary" @click="emit('go-to-setup')">
        Go to Setup
      </button>
    </div>
    <template v-else>
      <details ref="filterPanelRef" class="filter-panel">
        <summary class="filter-summary">Search options</summary>
        <form data-test="singer-search-form" class="grid-form filter-form" @submit.prevent="submitSearch">
          <label>
            Singer
            <input v-model="singerForm.singer" data-test="singer-search-name" type="text" placeholder="Insert name" />
          </label>
          <label>
            Country
            <select v-model="singerForm.singerType" data-test="singer-search-country">
              <option v-for="option in singerCountryOptions" :key="option.value" :value="option.value">
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
            :disabled="singerState.page === 0 || singerState.loading"
            @click="emit('go-to-previous-page')"
          >
            ◀
          </button>
          <span>{{ singerDisplayPage }}<template v-if="singerState.maxPage">/{{ singerState.maxPage }}</template></span>
          <button
            type="button"
            class="page-arrow page-arrow-next"
            :disabled="singerState.loading"
            @click="emit('go-to-next-page')"
          >
            ▶
          </button>
        </div>
        <div class="page-jump-row">
          <label class="page-jump">
            <input
              :value="singerPageInput"
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              @input="updateSingerPageInput"
            />
          </label>
          <button type="button" :disabled="singerState.loading" @click="emit('go-to-page')">
            Go
          </button>
        </div>
      </div>

      <ul v-if="singerState.singers.length" class="singer-list">
        <li v-for="singer in singerState.singers" :key="`${singer.name}-${singer.picture}`" class="singer-list-item">
          <button
            :data-test="`singer-result-${singer.name}`"
            type="button"
            class="singer-row singer-result-button"
            @click="emit('search-top-hits-by-singer', singer.name)"
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
      <div v-else class="empty empty-state">
        <span>{{ singerState.loading ? 'Loading singers...' : 'No singers returned yet.' }}</span>
      </div>

      <div class="pagination-stack">
        <div class="pagination-bar">
          <button
            data-test="singer-page-prev"
            type="button"
            class="page-arrow page-arrow-prev"
            :disabled="singerState.page === 0 || singerState.loading"
            @click="emit('go-to-previous-page')"
          >
            ◀
          </button>
          <span>{{ singerDisplayPage }}<template v-if="singerState.maxPage">/{{ singerState.maxPage }}</template></span>
          <button
            data-test="singer-page-next"
            type="button"
            class="page-arrow page-arrow-next"
            :disabled="singerState.loading"
            @click="emit('go-to-next-page')"
          >
            ▶
          </button>
        </div>
        <div class="page-jump-row">
          <label class="page-jump">
            <input
              :value="singerPageInput"
              data-test="singer-page-input"
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              @input="updateSingerPageInput"
            />
          </label>
          <button type="button" data-test="singer-page-go" :disabled="singerState.loading" @click="emit('go-to-page')">
            Go
          </button>
        </div>
      </div>
    </template>
  </section>
</template>
