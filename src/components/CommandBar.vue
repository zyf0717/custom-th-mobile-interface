<script setup>
defineProps({
  commandBarBusy: {
    type: Boolean,
    required: true,
  },
  micControlledByKod: {
    type: Boolean,
    required: true,
  },
  showMixerControls: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits([
  'toggle-mixer',
  'reset',
  'vocals',
  'play',
  'skip',
  'tone-down',
  'tone-reset',
  'tone-up',
  'mute',
  'music-down',
  'music-up',
  'mic-down',
  'mic-up',
])
</script>

<template>
  <div class="command-bar-inner">
    <div v-show="showMixerControls" class="command-bar-row command-bar-row-primary">
      <div class="command-group">
        <span class="command-group-label">Pitch</span>
        <div class="command-group-buttons">
          <button data-test="command-tone-down" type="button" :disabled="commandBarBusy" @click="emit('tone-down')">
            ♭
          </button>
          <button data-test="command-tone-reset" type="button" :disabled="commandBarBusy" @click="emit('tone-reset')">
            ♮
          </button>
          <button data-test="command-tone-up" type="button" :disabled="commandBarBusy" @click="emit('tone-up')">
            ♯
          </button>
        </div>
      </div>
      <div class="command-group">
        <span class="command-group-label">Volume</span>
        <div class="command-group-buttons">
          <button data-test="command-mute" type="button" :disabled="commandBarBusy" @click="emit('mute')">
            🔇
          </button>
          <button data-test="command-music-down" type="button" :disabled="commandBarBusy" @click="emit('music-down')">
            🔉
          </button>
          <button data-test="command-music-up" type="button" :disabled="commandBarBusy" @click="emit('music-up')">
            🔊
          </button>
          <button data-test="command-mic-down" type="button" :disabled="commandBarBusy || !micControlledByKod" @click="emit('mic-down')">
            🎤-
          </button>
          <button data-test="command-mic-up" type="button" :disabled="commandBarBusy || !micControlledByKod" @click="emit('mic-up')">
            🎤+
          </button>
        </div>
      </div>
    </div>
    <div class="command-bar-row command-bar-row-secondary">
      <button data-test="command-reset" type="button" :disabled="commandBarBusy" @click="emit('reset')">
        Replay
      </button>
      <button data-test="command-vocals" type="button" :disabled="commandBarBusy" @click="emit('vocals')">
        Vocals
      </button>
      <button data-test="command-play" type="button" :disabled="commandBarBusy" @click="emit('play')">
        ⏯
      </button>
      <button data-test="command-skip" type="button" :disabled="commandBarBusy" @click="emit('skip')">
        ⏭
      </button>
      <button
        data-test="command-toggle-mixer"
        type="button"
        :aria-expanded="showMixerControls"
        :title="showMixerControls ? 'Hide pitch and volume controls' : 'Show pitch and volume controls'"
        @click="emit('toggle-mixer')"
      >
        ☰
      </button>
    </div>
  </div>
</template>
