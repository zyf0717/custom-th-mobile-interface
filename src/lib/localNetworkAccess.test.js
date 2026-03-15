import { describe, expect, it, vi } from 'vitest'
import {
  requestLocalNetworkAccess,
  shouldRequestLocalNetworkAccess,
} from './localNetworkAccess'

describe('localNetworkAccess', () => {
  it('requests local-network access from a public https origin to a local device', () => {
    expect(
      shouldRequestLocalNetworkAccess(
        'http://192.168.0.25:8080',
        'https://ktv.yifei.sg/',
      ),
    ).toBe(true)
  })

  it('does not request local-network access from localhost', () => {
    expect(
      shouldRequestLocalNetworkAccess(
        'http://192.168.0.25:8080',
        'http://localhost:5173/',
      ),
    ).toBe(false)
  })

  it('does not request local-network access from a private-network origin', () => {
    expect(
      shouldRequestLocalNetworkAccess(
        'http://192.168.0.25:8080',
        'https://192.168.0.10/',
      ),
    ).toBe(false)
  })

  it('skips the fetch probe when permission prompting is not applicable', async () => {
    const fetchMock = vi.fn()

    const result = await requestLocalNetworkAccess(
      'http://192.168.0.25:8080',
      fetchMock,
      'http://localhost:5173/',
    )

    expect(result).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('runs the fetch probe when permission prompting is applicable', async () => {
    const fetchMock = vi.fn().mockResolvedValue({})

    const result = await requestLocalNetworkAccess(
      'http://192.168.0.25:8080',
      fetchMock,
      'https://ktv.yifei.sg/',
    )

    expect(result).toBe(true)
    expect(fetchMock).toHaveBeenCalledWith('http://192.168.0.25:8080/', {
      mode: 'no-cors',
      cache: 'no-store',
      targetAddressSpace: 'local',
    })
  })
})
