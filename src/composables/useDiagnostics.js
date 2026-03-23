import { reactive } from 'vue'

export function useDiagnostics({ eventLimit = 25, reportStatusDurationMs = 4000 } = {}) {
  const diagnosticsState = reactive({
    lastError: '',
    lastRequest: '',
    lastRequestLabel: '',
    lastResponse: '',
    reportStatus: '',
    events: [],
  })

  let reportStatusTimeout = null

  function logDiagnosticEvent(message) {
    diagnosticsState.events.unshift(`${new Date().toISOString()} ${message}`)
    diagnosticsState.events.splice(eventLimit)
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
      }, reportStatusDurationMs)
    }
  }

  function disposeDiagnostics() {
    clearReportStatus()
  }

  return {
    diagnosticsState,
    logDiagnosticEvent,
    setLastRequest,
    setLastResponse,
    setLastError,
    setReportStatus,
    disposeDiagnostics,
  }
}
