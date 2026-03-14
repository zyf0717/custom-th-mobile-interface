<script setup>
const SUPPORT_EMAIL_SUBJECT = encodeURIComponent('Open KOD issue report')
const SUPPORT_EMAIL_BODY = encodeURIComponent(
  [
    'Hi,',
    '',
    'I am reporting an issue with Open KOD.',
    '',
    'Please find the downloaded issue report attached.',
    '',
    'Thanks,',
  ].join('\n'),
)

const DISCLAIMER_TEXT =
  'Disclaimer: through this web app, your device is communicating directly with the karaoke device over a local network, and does not relay data to any external server.'

defineProps({
  baseUrlInput: {
    type: String,
    required: true,
  },
  isDarkMode: {
    type: Boolean,
    required: true,
  },
  micControlledByKod: {
    type: Boolean,
    required: true,
  },
  reportStatus: {
    type: String,
    default: '',
  },
  supportEmail: {
    type: String,
    required: true,
  },
  notePlacement: {
    type: String,
    default: 'footer',
  },
})

const emit = defineEmits([
  'save-base-url',
  'download-report',
  'update:base-url-input',
  'update:is-dark-mode',
  'update:mic-controlled-by-kod',
])

function updateBaseUrlInput(event) {
  emit('update:base-url-input', event.target.value)
}

function supportEmailHref(address) {
  return `mailto:${address}?subject=${SUPPORT_EMAIL_SUBJECT}&body=${SUPPORT_EMAIL_BODY}`
}
</script>

<template>
  <header class="hero">
    <div class="hero-copy">
      <h1>Open KOD</h1>
      <p class="subtitle">
        An alternative interface for the same device endpoints used by the default KOD app.
      </p>
      <p v-if="notePlacement === 'header'" class="field-help settings-note">
        <em>{{ DISCLAIMER_TEXT }}</em>
      </p>
    </div>

    <form class="stack" @submit.prevent="$emit('save-base-url')">
      <label>
        <span class="field-help">Scan the QR code on the KTV display, then paste the server URL here, for example: <code>http://192.168.0.8:8080</code></span>
        <div class="input-action-row">
          <input
            data-test="base-url-input"
            type="url"
            placeholder="http://192.168.0.8:8080"
            :value="baseUrlInput"
            @input="updateBaseUrlInput"
          />
          <button data-test="save-base-url" type="button" class="button-emoji" @click="$emit('save-base-url')">➤</button>
        </div>
      </label>
      <div class="theme-control">
        <span class="field-help">Light/Dark theme:</span>
        <button
          type="button"
          class="button-secondary theme-toggle"
          :aria-pressed="isDarkMode"
          :title="isDarkMode ? 'Switch to light theme' : 'Switch to dark theme'"
          @click="$emit('update:is-dark-mode', !isDarkMode)"
        >
          {{ isDarkMode ? '☀︎' : '⏾' }}
        </button>
      </div>
      <div class="toggle-text-row">
        <span class="field-help">Microphones controlled by KOD: </span>
        <button
          data-test="mic-controlled-toggle"
          type="button"
          class="button-secondary text-toggle"
          :aria-pressed="micControlledByKod"
          :title="micControlledByKod ? 'Disable KOD microphone controls' : 'Enable KOD microphone controls'"
          @click="$emit('update:mic-controlled-by-kod', !micControlledByKod)"
        >
          {{ micControlledByKod ? '✓' : '\u00A0' }}
        </button>
      </div>
      <div class="stack settings-support">
        <div class="settings-support-actions">
          <button data-test="download-report" type="button" class="button-secondary" @click="$emit('download-report')">
            Download issue report
          </button>
        </div>
        <p class="field-help">
          After downloading the issue report, attach the <code>.txt</code> file to a new email and send it to
          <a :href="supportEmailHref(supportEmail)"><code>{{ supportEmail }}</code></a>.
        </p>
        <p v-if="reportStatus" class="field-help settings-status">{{ reportStatus }}</p>
      </div>
      <div v-if="notePlacement === 'footer'" class="settings-note-block">
        <hr class="settings-divider" />
        <p class="field-help settings-note">
          <em>{{ DISCLAIMER_TEXT }}</em>
        </p>
      </div>
    </form>
  </header>
</template>
