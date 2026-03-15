<script setup>
import { nextTick, onBeforeUnmount, ref } from 'vue'
import { extractBaseUrlFromQrPayload } from '../lib/baseUrl'

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
  'scanner-detected-base-url',
  'download-report',
  'update:base-url-input',
  'update:is-dark-mode',
  'update:mic-controlled-by-kod',
])

const scannerVideoRef = ref(null)
const scannerOpen = ref(false)
const scannerStatus = ref('')

let scannerStream = null
let scannerDetector = null
let scannerFrameHandle = null
let scannerDetectInFlight = false

function updateBaseUrlInput(event) {
  emit('update:base-url-input', event.target.value)
}

function supportEmailHref(address) {
  return `mailto:${address}?subject=${SUPPORT_EMAIL_SUBJECT}&body=${SUPPORT_EMAIL_BODY}`
}

function canUseCameraScanner() {
  return Boolean(
    typeof window !== 'undefined' &&
      typeof navigator !== 'undefined' &&
      navigator.mediaDevices?.getUserMedia &&
      window.BarcodeDetector,
  )
}

function createBarcodeDetector() {
  try {
    return new window.BarcodeDetector({ formats: ['qr_code'] })
  } catch {
    return new window.BarcodeDetector()
  }
}

async function toggleScanner() {
  if (scannerOpen.value) {
    stopScanner()
    return
  }

  await startScanner()
}

async function startScanner() {
  if (!canUseCameraScanner()) {
    scannerStatus.value = 'Camera scanning needs a browser with camera access and QR detection support.'
    return
  }

  scannerStatus.value = 'Requesting camera access...'

  try {
    scannerStream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: {
          ideal: 'environment',
        },
      },
    })
    scannerDetector = createBarcodeDetector()
    scannerOpen.value = true
    scannerStatus.value = 'Point the camera at the QR code on the KTV display.'
    await nextTick()

    if (scannerVideoRef.value) {
      scannerVideoRef.value.srcObject = scannerStream
      await scannerVideoRef.value.play?.()
    }

    queueNextScanFrame()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    stopScanner(`Unable to start the camera scanner: ${message}`)
  }
}

function stopScanner(message = '') {
  if (scannerFrameHandle !== null) {
    window.cancelAnimationFrame(scannerFrameHandle)
    scannerFrameHandle = null
  }

  scannerDetectInFlight = false

  if (scannerStream) {
    scannerStream.getTracks().forEach((track) => track.stop())
    scannerStream = null
  }

  scannerDetector = null

  if (scannerVideoRef.value) {
    scannerVideoRef.value.pause?.()
    scannerVideoRef.value.srcObject = null
  }

  scannerOpen.value = false
  scannerStatus.value = message
}

function queueNextScanFrame() {
  if (!scannerOpen.value || scannerFrameHandle !== null) {
    return
  }

  scannerFrameHandle = window.requestAnimationFrame(scanCurrentFrame)
}

async function scanCurrentFrame() {
  scannerFrameHandle = null

  if (!scannerOpen.value || !scannerDetector || scannerDetectInFlight || !scannerVideoRef.value) {
    return
  }

  scannerDetectInFlight = true

  try {
    const detectedCodes = await scannerDetector.detect(scannerVideoRef.value)
    const detectedCode = detectedCodes.find((code) => typeof code.rawValue === 'string' && code.rawValue.trim())

    if (detectedCode) {
      const scannedBaseUrl = extractBaseUrlFromQrPayload(detectedCode.rawValue)

      if (scannedBaseUrl) {
        emit('scanner-detected-base-url', scannedBaseUrl)
        stopScanner(`Connected using ${scannedBaseUrl}.`)
        return
      }

      scannerStatus.value = 'QR code scanned, but it did not contain a usable server URL.'
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    scannerStatus.value = `Unable to scan the QR code: ${message}`
  } finally {
    scannerDetectInFlight = false

    if (scannerOpen.value) {
      queueNextScanFrame()
    }
  }
}

onBeforeUnmount(() => {
  stopScanner()
})
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
        <span class="field-help">Scan the QR code on the KTV display, or paste the server URL here, for example: <code>http://192.168.0.8:8080</code></span>
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
      <div class="scanner-block">
        <div class="settings-support-actions">
          <button data-test="toggle-qr-scanner" type="button" class="button-secondary" @click="toggleScanner">
            {{ scannerOpen ? 'Stop camera scanner' : 'Scan QR with camera' }}
          </button>
        </div>
        <div v-if="scannerOpen" class="scanner-preview">
          <video ref="scannerVideoRef" data-test="qr-scanner-video" autoplay muted playsinline />
        </div>
        <p v-if="scannerStatus" class="field-help scanner-status">{{ scannerStatus }}</p>
      </div>
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
