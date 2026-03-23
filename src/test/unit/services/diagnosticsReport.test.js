import { describe, expect, it, vi } from 'vitest'

import {
  buildDiagnosticsReport,
  buildReportFilename,
  downloadTextFile,
} from '../../../services/diagnosticsReport'

describe('diagnosticsReport service', () => {
  it('builds report text with expected sections', () => {
    const report = buildDiagnosticsReport({
      version: '0.1.0',
      generatedAt: '2026-03-23T10:00:00.000Z',
      baseUrl: 'http://10.0.0.20:8080',
      activeMobileTab: 'topHits',
      activeBrowseTab: 'topHits',
      isDarkMode: false,
      micControlledByKod: true,
      searchForm: { songName: 'Lucky', singer: 'Tester', lang: '', songType: '', sortType: '' },
      displayPage: 1,
      searchMaxPage: 5,
      singerForm: { singer: 'Jay', singerType: '全部' },
      singerDisplayPage: 2,
      singerMaxPage: 10,
      playlistItemCount: 3,
      lastRequestLabel: 'SearchServlet',
      lastRequest: 'page=0',
      lastResponse: 'ok',
      lastError: '',
      userAgent: 'Vitest',
      events: ['2026-03-23T10:00:00.000Z Session started'],
    })

    expect(report).toContain('custom-th-mobile-interface issue report')
    expect(report).toContain('Version: 0.1.0')
    expect(report).toContain('Top Hits page: 1/5')
    expect(report).toContain('Singer page: 2/10')
    expect(report).toContain('Recent events:')
  })

  it('builds deterministic report filename from provided date', () => {
    const fileName = buildReportFilename(new Date('2026-03-23T10:00:00.123Z'))
    expect(fileName).toBe('custom-th-mobile-interface-issue-report-2026-03-23T10-00-00-123Z.txt')
  })

  it('downloads text with blob URL lifecycle', () => {
    const createObjectURL = vi.fn().mockReturnValue('blob:custom-th-mobile-interface')
    const revokeObjectURL = vi.fn()
    const click = vi.fn()

    URL.createObjectURL = createObjectURL
    URL.revokeObjectURL = revokeObjectURL
    HTMLAnchorElement.prototype.click = click

    downloadTextFile('report.txt', 'hello')

    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect(click).toHaveBeenCalledTimes(1)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:custom-th-mobile-interface')
  })
})
