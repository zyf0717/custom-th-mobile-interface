function normalizeHostname(hostname) {
  return hostname.replace(/^\[|\]$/g, '').toLowerCase()
}

function isPrivateIpv4(hostname) {
  return (
    /^127\./.test(hostname) ||
    /^10\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
  )
}

function isLocalIpv6(hostname) {
  return (
    hostname === '::1' ||
    hostname.startsWith('fe80:') ||
    hostname.startsWith('fc') ||
    hostname.startsWith('fd')
  )
}

function isLocalHostname(hostname) {
  return hostname === 'localhost' || hostname.endsWith('.local')
}

function isNonPublicAddress(hostname) {
  return isPrivateIpv4(hostname) || isLocalIpv6(hostname) || isLocalHostname(hostname)
}

function getCurrentOriginUrl() {
  return typeof window !== 'undefined' ? window.location.href : ''
}

export function shouldRequestLocalNetworkAccess(baseUrl, currentOriginUrl = getCurrentOriginUrl()) {
  try {
    const targetUrl = new URL(baseUrl)
    const originUrl = new URL(currentOriginUrl)
    const normalizedTargetHostname = normalizeHostname(targetUrl.hostname)
    const normalizedOriginHostname = normalizeHostname(originUrl.hostname)

    if (
      targetUrl.protocol !== 'http:' &&
      !isNonPublicAddress(normalizedTargetHostname)
    ) {
      return false
    }

    if (originUrl.protocol !== 'https:') {
      return false
    }

    return !isNonPublicAddress(normalizedOriginHostname)
  } catch {
    return false
  }
}

export async function requestLocalNetworkAccess(
  baseUrl,
  fetchImpl = window.fetch?.bind(window),
  currentOriginUrl = getCurrentOriginUrl(),
) {
  if (!shouldRequestLocalNetworkAccess(baseUrl, currentOriginUrl) || typeof fetchImpl !== 'function') {
    return false
  }

  const requestUrl = new URL('/', `${baseUrl.replace(/\/+$/, '')}/`).toString()
  const requestOptions = {
    mode: 'no-cors',
    cache: 'no-store',
    targetAddressSpace: 'local',
  }

  await fetchImpl(requestUrl, requestOptions)

  return true
}
