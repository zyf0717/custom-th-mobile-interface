import { describe, expect, it } from 'vitest'

import { extractBaseUrlFromQrPayload, resolveBaseUrl } from '../../../lib/baseUrl'

describe('baseUrl helpers', () => {
  it('resolves an empty base URL to an empty string', () => {
    expect(resolveBaseUrl('   ')).toBe('')
  })

  it('adds http to a bare host and port base URL', () => {
    expect(resolveBaseUrl('192.168.0.8:8080')).toBe('http://192.168.0.8:8080')
  })

  it('extracts the origin from a direct QR URL', () => {
    expect(extractBaseUrlFromQrPayload('http://device-ip:8080/index.html?room=VIP')).toBe('http://device-ip:8080')
  })

  it('extracts a base URL nested inside another setup URL', () => {
    expect(
      extractBaseUrlFromQrPayload('openkod://setup?baseUrl=http%3A%2F%2F10.0.0.20%3A8080%2Fwelcome'),
    ).toBe('http://10.0.0.20:8080')
  })

  it('extracts an embedded device URL from surrounding text', () => {
    expect(extractBaseUrlFromQrPayload('Connect here: https://karaoke.local:8443/app now')).toBe('https://karaoke.local:8443')
  })

  it('returns empty string for an unrecognisable input', () => {
    expect(resolveBaseUrl('http//invalid')).toBe('')
    expect(resolveBaseUrl('not-a-url')).toBe('')
  })

  it('returns null when the QR payload does not contain a usable URL', () => {
    expect(extractBaseUrlFromQrPayload('Open KOD setup code only')).toBeNull()
  })
})
