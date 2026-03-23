export function downloadTextFile(filename, text) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(objectUrl)
}

export function buildDiagnosticsReport({
  version,
  generatedAt,
  baseUrl,
  activeMobileTab,
  activeBrowseTab,
  isDarkMode,
  micControlledByKod,
  searchForm,
  displayPage,
  searchMaxPage,
  singerForm,
  singerDisplayPage,
  singerMaxPage,
  playlistItemCount,
  lastRequestLabel,
  lastRequest,
  lastResponse,
  lastError,
  userAgent,
  events,
}) {
  const lines = [
    'Open KOD issue report',
    `Version: ${version}`,
    `Generated: ${generatedAt}`,
    `Base URL: ${baseUrl}`,
    `Active mobile tab: ${activeMobileTab}`,
    `Active browse tab: ${activeBrowseTab}`,
    `Theme: ${isDarkMode ? 'dark' : 'light'}`,
    `Mic controlled by KOD: ${micControlledByKod ? 'yes' : 'no'}`,
    `Top Hits filters: title="${searchForm.songName}" singer="${searchForm.singer}" lang="${searchForm.lang}" songType="${searchForm.songType}" sortType="${searchForm.sortType}"`,
    `Top Hits page: ${displayPage}${searchMaxPage ? `/${searchMaxPage}` : ''}`,
    `Singer filters: singer="${singerForm.singer}" country="${singerForm.singerType}"`,
    `Singer page: ${singerDisplayPage}${singerMaxPage ? `/${singerMaxPage}` : ''}`,
    `Playlist items: ${playlistItemCount}`,
    `Last request: ${lastRequestLabel || 'n/a'} ${lastRequest || ''}`.trim(),
    `Last response: ${lastResponse || 'n/a'}`,
    `Last error: ${lastError || 'none'}`,
    `User agent: ${userAgent}`,
    'Recent events:',
    ...events,
  ]

  return lines.join('\n')
}

export function buildReportFilename(now = new Date()) {
  const stamp = now.toISOString().replace(/[:.]/g, '-')
  return `open-kod-issue-report-${stamp}.txt`
}
