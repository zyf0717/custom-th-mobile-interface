import { describe, expect, it, vi } from 'vitest'

import { useDiagnostics } from '../../../composables/useDiagnostics'

describe('useDiagnostics', () => {
  it('tracks latest request/response/error values', () => {
    const diagnostics = useDiagnostics()

    diagnostics.setLastRequest('SearchServlet', 'page=1')
    diagnostics.setLastResponse('ok')
    diagnostics.setLastError('none')

    expect(diagnostics.diagnosticsState.lastRequestLabel).toBe('SearchServlet')
    expect(diagnostics.diagnosticsState.lastRequest).toBe('page=1')
    expect(diagnostics.diagnosticsState.lastResponse).toBe('ok')
    expect(diagnostics.diagnosticsState.lastError).toBe('none')
  })

  it('limits stored events to eventLimit', () => {
    const diagnostics = useDiagnostics({ eventLimit: 2 })

    diagnostics.logDiagnosticEvent('one')
    diagnostics.logDiagnosticEvent('two')
    diagnostics.logDiagnosticEvent('three')

    expect(diagnostics.diagnosticsState.events).toHaveLength(2)
    expect(diagnostics.diagnosticsState.events[0]).toContain('three')
    expect(diagnostics.diagnosticsState.events[1]).toContain('two')
  })

  it('clears report status after configured timeout', async () => {
    vi.useFakeTimers()
    const diagnostics = useDiagnostics({ reportStatusDurationMs: 1000 })

    diagnostics.setReportStatus('Downloaded')
    expect(diagnostics.diagnosticsState.reportStatus).toBe('Downloaded')

    await vi.advanceTimersByTimeAsync(1000)
    expect(diagnostics.diagnosticsState.reportStatus).toBe('')
  })

  it('disposes the status timer without clearing current text', async () => {
    vi.useFakeTimers()
    const diagnostics = useDiagnostics({ reportStatusDurationMs: 1000 })

    diagnostics.setReportStatus('Downloaded')
    diagnostics.disposeDiagnostics()

    await vi.advanceTimersByTimeAsync(1000)
    expect(diagnostics.diagnosticsState.reportStatus).toBe('Downloaded')
  })
})
