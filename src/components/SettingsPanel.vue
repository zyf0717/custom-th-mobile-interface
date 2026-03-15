<script setup>
import jsQR from 'jsqr'
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
  'Disclaimer: through this app, your device is communicating directly with the karaoke device over a local network, and does not communicate with any external server.'

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
  connectStatus: {
    type: String,
    default: '',
  },
  connectPending: {
    type: Boolean,
    default: false,
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
let scannerFrameHandle = null
let scannerDetectInFlight = false
let scannerCanvas = null
let scannerContext = null

const SCAN_INTERVAL_MS = 250

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
      navigator.mediaDevices?.getUserMedia,
  )
}

function ensureScannerCanvas() {
  if (!scannerCanvas) {
    scannerCanvas = document.createElement('canvas')
  }

  if (!scannerContext) {
    scannerContext = scannerCanvas.getContext('2d', { willReadFrequently: true })
  }

  return Boolean(scannerContext)
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
  scannerOpen.value = true

  try {
    if (!ensureScannerCanvas()) {
      stopScanner('Camera scanning is not available because this browser cannot read video frames.')
      return
    }

    scannerStream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: {
          ideal: 'environment',
        },
      },
    })
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
    window.clearTimeout(scannerFrameHandle)
    scannerFrameHandle = null
  }

  scannerDetectInFlight = false

  if (scannerStream) {
    scannerStream.getTracks().forEach((track) => track.stop())
    scannerStream = null
  }

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

  scannerFrameHandle = window.setTimeout(() => {
    scannerFrameHandle = null
    void scanCurrentFrame()
  }, SCAN_INTERVAL_MS)
}

async function scanCurrentFrame() {
  if (!scannerOpen.value || scannerDetectInFlight || !scannerVideoRef.value || !ensureScannerCanvas()) {
    return
  }

  const video = scannerVideoRef.value
  const width = video.videoWidth
  const height = video.videoHeight

  if (!width || !height) {
    queueNextScanFrame()
    return
  }

  scannerDetectInFlight = true

  try {
    scannerCanvas.width = width
    scannerCanvas.height = height
    scannerContext.drawImage(video, 0, 0, width, height)

    const imageData = scannerContext.getImageData(0, 0, width, height)
    const detectedCode = jsQR(imageData.data, width, height, {
      inversionAttempts: 'attemptBoth',
    })

    if (detectedCode?.data) {
      const scannedBaseUrl = extractBaseUrlFromQrPayload(detectedCode.data)

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
  <header class="hero settings-hero">
    <section class="hero-copy settings-block settings-block-intro">
      <div class="settings-block-header">
        <h1>Open KOD</h1>
      </div>
      <p class="subtitle">
        An alternative interface for the same device endpoints used by the default KOD app.
      </p>
      <p class="field-help">
        <strong>NOTE:</strong> This app currently does not work on iOS due to local network access issues.
      </p>
    </section>

    <section v-if="notePlacement === 'header'" class="settings-block stack">
      <div class="settings-block-header">
        <p class="settings-kicker">Disclaimer</p>
        <h2>Privacy</h2>
      </div>
      <p class="field-help settings-note">
        <em>{{ DISCLAIMER_TEXT }}</em>
      </p>
    </section>

    <form class="stack settings-form" @submit.prevent="$emit('save-base-url')">
      <section class="settings-block stack">
        <div class="settings-block-header">
          <h2>Connect</h2>
        </div>

        <div class="stack">
          <span class="field-help">Scan the QR code on the KTV display:</span>
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
        </div>

        <label>
          <span class="field-help">Or enter the server URL here, for example: <code>http://device-ip:8080</code></span>
          <div class="input-action-row">
            <input
              data-test="base-url-input"
              type="url"
              :value="baseUrlInput"
              @keydown.enter.prevent="$emit('save-base-url')"
              @input="updateBaseUrlInput"
            />
            <button data-test="save-base-url" type="button" class="button-emoji" @click="$emit('save-base-url')">➤</button>
          </div>
        </label>
        <p v-if="connectPending || connectStatus" data-test="connect-status" class="field-help settings-status">
          {{ connectPending ? 'Waiting for local network permission...' : connectStatus }}
        </p>

        <div class="theme-control">
          <span class="field-help">Toggle to override auto-theme:</span>
          <button
            data-test="theme-toggle"
            type="button"
            class="button-secondary theme-toggle"
            :aria-pressed="isDarkMode"
            :title="isDarkMode ? 'Switch to light theme until reload' : 'Switch to dark theme until reload'"
            @click="$emit('update:is-dark-mode', !isDarkMode)"
          >
            {{ isDarkMode ? '☀︎' : '⏾' }}
          </button>
        </div>

        <div class="toggle-text-row">
          <span class="field-help">Check if microphones controlled by KOD: </span>
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
      </section>

      <section class="settings-block stack settings-support">
        <div class="settings-block-header">
          <h2>Need Help?</h2>
          <p class="field-help">Download a report and send it to support if the app is not behaving as expected.</p>
        </div>
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
      </section>

      <section v-if="notePlacement === 'footer'" class="settings-block stack">
        <div class="settings-block-header">
          <p class="settings-kicker">Disclaimer</p>
          <h2>Privacy</h2>
        </div>
        <p class="field-help settings-note">
          <em>{{ DISCLAIMER_TEXT }}</em>
        </p>
      </section>
    </form>
  </header>
</template>
