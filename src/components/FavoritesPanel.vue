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
  favoriteSongs: {
    type: Array,
    required: true,
  },
  favoriteCount: {
    type: Number,
    required: true,
  },
  favoriteDisplayPage: {
    type: Number,
    required: true,
  },
  favoritePageInput: {
    type: [Number, String],
    required: true,
  },
  favoriteTotalPages: {
    type: Number,
    required: true,
  },
  favoritesTransferStatus: {
    type: String,
    required: true,
  },
  singerImageUrl: {
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
  'promote-song',
  'add-song',
  'favorite-song',
  'download-favorites',
  'import-favorites',
  'update:favorite-page-input',
  'go-to-previous-page',
  'go-to-next-page',
  'go-to-page',
])

const uploadInputRef = ref(null)

function updateFavoritePageInput(event) {
  const nextValue = event.target.value
  emit('update:favorite-page-input', nextValue === '' ? '' : Number(nextValue))
}

function triggerUpload() {
  uploadInputRef.value?.click()
}

function handleFileChange(event) {
  const [file] = Array.from(event.target.files || [])

  emit('import-favorites', file)
  event.target.value = ''
}
</script>

<template>
  <section
    class="panel stack mobile-panel"
    :class="{
      'mobile-panel-hidden': activeMobileTab !== 'favorites',
      'desktop-panel-hidden': activeBrowseTab !== 'favorites',
    }"
  >
    <div class="section-heading panel-heading">
      <div>
        <h2>Favourites</h2>
      </div>
    </div>

    <div class="favorites-toolbar">
      <div class="favorites-actions">
        <button
          data-test="favorites-download"
          type="button"
          class="button-secondary"
          :disabled="favoriteCount === 0"
          @click="emit('download-favorites')"
        >
          Download JSON
        </button>
        <button data-test="favorites-upload" type="button" class="button-secondary" @click="triggerUpload">
          Upload JSON
        </button>
        <input
          ref="uploadInputRef"
          data-test="favorites-upload-input"
          class="visually-hidden"
          type="file"
          accept=".json,application/json"
          @change="handleFileChange"
        />
      </div>
      <p v-if="favoritesTransferStatus" data-test="favorites-transfer-status" class="field-help">
        {{ favoritesTransferStatus }}
      </p>
    </div>

    <template v-if="favoriteCount">
      <div class="pagination-stack">
        <div class="pagination-bar">
          <button
            type="button"
            class="page-arrow page-arrow-prev"
            :disabled="favoriteDisplayPage === 1"
            @click="emit('go-to-previous-page')"
          >
            Prev
          </button>
          <span>{{ favoriteDisplayPage }}/{{ favoriteTotalPages }}</span>
          <button
            type="button"
            class="page-arrow page-arrow-next"
            :disabled="favoriteDisplayPage === favoriteTotalPages"
            @click="emit('go-to-next-page')"
          >
            Next
          </button>
        </div>
        <div class="page-jump-row">
          <label class="page-jump">
            <input :value="favoritePageInput" type="text" inputmode="numeric" pattern="[0-9]*" @input="updateFavoritePageInput" />
          </label>
          <button type="button" @click="emit('go-to-page')">
            Go
          </button>
        </div>
      </div>

      <div class="table-wrap">
        <table>
          <tbody>
            <tr v-for="song in favoriteSongs" :key="song.id">
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
                    :data-test="`favorite-panel-remove-song-${song.id}`"
                    type="button"
                    class="button-secondary button-command button-emoji"
                    :aria-label="`Remove ${song.name} from favorites`"
                    @click="emit('favorite-song', song)"
                  >
                    &#11088;&#65039;
                  </button>
                  <button
                    :data-test="`favorite-panel-promote-song-${song.id}`"
                    type="button"
                    class="button-secondary button-command button-emoji"
                    :disabled="isSongPending(song.id)"
                    @click="emit('promote-song', song.id)"
                  >
                    &#9195;
                  </button>
                  <button
                    :data-test="`favorite-panel-add-song-${song.id}`"
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
        </table>
      </div>

      <div class="pagination-stack">
        <div class="pagination-bar">
          <button
            data-test="favorites-page-prev"
            type="button"
            class="page-arrow page-arrow-prev"
            :disabled="favoriteDisplayPage === 1"
            @click="emit('go-to-previous-page')"
          >
            Prev
          </button>
          <span>{{ favoriteDisplayPage }}/{{ favoriteTotalPages }}</span>
          <button
            data-test="favorites-page-next"
            type="button"
            class="page-arrow page-arrow-next"
            :disabled="favoriteDisplayPage === favoriteTotalPages"
            @click="emit('go-to-next-page')"
          >
            Next
          </button>
        </div>
        <div class="page-jump-row">
          <label class="page-jump">
            <input
              :value="favoritePageInput"
              data-test="favorites-page-input"
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              @input="updateFavoritePageInput"
            />
          </label>
          <button type="button" data-test="favorites-page-go" @click="emit('go-to-page')">
            Go
          </button>
        </div>
      </div>
    </template>
    <div v-else class="empty empty-state">
      <span>No favourites saved yet.</span>
    </div>
  </section>
</template>
