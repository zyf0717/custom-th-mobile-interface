const URL_PATTERN = /\bhttps?:\/\/[^\s"'<>]+/i
const HOST_PATTERN = /\b((?:\d{1,3}\.){3}\d{1,3}|localhost|(?:[a-z0-9-]+\.)+[a-z0-9-]+)(?::(\d{1,5}))?(?:\/[^\s"'<>]*)?/i
const QUERY_PARAM_KEYS = ['baseUrl', 'baseURL', 'serverUrl', 'serverURL', 'server', 'url', 'host']

export function resolveBaseUrl(value) {
  const trimmedValue = value.trim()

  if (!trimmedValue) {
    return ''
  }

  return extractBaseUrlCandidate(trimmedValue) || trimmedValue
}

export function extractBaseUrlFromQrPayload(rawValue) {
  if (typeof rawValue !== 'string') {
    return null
  }

  const trimmedValue = rawValue.trim()

  if (!trimmedValue) {
    return null
  }

  const parsedUrl = parseUrl(trimmedValue)

  if (parsedUrl) {
    const queryMatch = extractBaseUrlFromSearchParams(parsedUrl.searchParams)

    if (queryMatch) {
      return queryMatch
    }

    if (isHttpUrl(parsedUrl)) {
      return parsedUrl.origin
    }
  }

  const directMatch = extractBaseUrlCandidate(trimmedValue)

  if (directMatch) {
    return directMatch
  }

  return null
}

function extractBaseUrlFromSearchParams(searchParams) {
  for (const key of QUERY_PARAM_KEYS) {
    const value = searchParams.get(key)
    const candidate = extractBaseUrlCandidate(decodeSearchParam(value))

    if (candidate) {
      return candidate
    }
  }

  for (const [, value] of searchParams.entries()) {
    const candidate = extractBaseUrlCandidate(decodeSearchParam(value))

    if (candidate) {
      return candidate
    }
  }

  return null
}

function extractBaseUrlCandidate(value) {
  const normalizedValue = normalizeHttpBaseUrl(value)

  if (normalizedValue) {
    return normalizedValue
  }

  const embeddedUrlMatch = value.match(URL_PATTERN)

  if (embeddedUrlMatch) {
    return normalizeHttpBaseUrl(embeddedUrlMatch[0])
  }

  const hostMatch = value.match(HOST_PATTERN)

  if (hostMatch) {
    const [, host, port] = hostMatch
    return `http://${host}${port ? `:${port}` : ''}`
  }

  return null
}

function normalizeHttpBaseUrl(value) {
  const parsedUrl = parseUrl(value)

  if (!parsedUrl || !isHttpUrl(parsedUrl)) {
    return null
  }

  return parsedUrl.origin
}

function parseUrl(value) {
  try {
    return new URL(stripTrailingPunctuation(value))
  } catch {
    return null
  }
}

function isHttpUrl(value) {
  return value.protocol === 'http:' || value.protocol === 'https:'
}

function decodeSearchParam(value) {
  if (typeof value !== 'string') {
    return ''
  }

  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function stripTrailingPunctuation(value) {
  return value.replace(/[),.;!?]+$/, '')
}
