import {afterEach, describe, expect, it} from 'vitest'
import {maxDuration, OPTIONS, POST} from './route'

describe('visdomsord rewrite route', () => {
  const originalSecret = process.env.EXTRA_EXTRA_SECRET

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.EXTRA_EXTRA_SECRET
    else process.env.EXTRA_EXTRA_SECRET = originalSecret
  })

  it('exports HTTP handlers and a 60s duration budget', () => {
    expect(typeof OPTIONS).toBe('function')
    expect(typeof POST).toBe('function')
    expect(maxDuration).toBe(60)
  })

  it.each([
    ['{', 'application/json'],
    [JSON.stringify({ids: ['ok', 7]}), 'application/json'],
  ])('rejects an invalid request body', async (body, contentType) => {
    process.env.EXTRA_EXTRA_SECRET = 'test-secret'
    const response = await POST(new Request('http://localhost', {
      method: 'POST',
      headers: {
        'content-type': contentType,
        'x-extra-extra-secret': 'test-secret',
      },
      body,
    }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({error: 'Ogiltig förfrågan'})
  })
})
