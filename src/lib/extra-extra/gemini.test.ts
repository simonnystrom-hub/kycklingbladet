import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

const create = vi.fn()

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    interactions = {create}
    constructor(_opts: {apiKey: string}) {}
  },
}))

describe('generateExtraJpeg', () => {
  beforeEach(() => {
    vi.resetModules()
    create.mockReset()
    process.env.GEMINI_API_KEY = 'test-key'
    delete process.env.GEMINI_IMAGE_MODEL
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns jpeg bytes from Gemini', async () => {
    create.mockResolvedValue({output_image: {data: Buffer.from('jpeg').toString('base64')}})
    const {generateExtraJpeg} = await import('./gemini')
    const bytes = await generateExtraJpeg('a hen at the hatch')
    expect(Buffer.from(bytes).toString()).toBe('jpeg')
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gemini-3-pro-image',
        input: 'a hen at the hatch',
        response_format: expect.objectContaining({
          type: 'image',
          mime_type: 'image/jpeg',
          aspect_ratio: '3:4',
        }),
      }),
    )
  })

  it('throws a Swedish error when the key is missing', async () => {
    delete process.env.GEMINI_API_KEY
    const {generateExtraJpeg} = await import('./gemini')
    await expect(generateExtraJpeg('scene')).rejects.toThrow('GEMINI_API_KEY saknas')
  })

  it('hides Google internals behind a Swedish error', async () => {
    create.mockRejectedValue(new Error('PERMISSION_DENIED: model not available'))
    const {generateExtraJpeg} = await import('./gemini')
    await expect(generateExtraJpeg('scene')).rejects.toThrow('Kunde inte rita bilden')
    expect(create).toHaveBeenCalledTimes(1)
  })

  it('retries quota errors with 2s then 4s sleep, then throws Swedish', async () => {
    vi.useFakeTimers()
    create.mockRejectedValue(new Error('429 RESOURCE_EXHAUSTED quota exceeded'))
    const {generateExtraJpeg} = await import('./gemini')

    const pending = generateExtraJpeg('scene')
    const expectation = expect(pending).rejects.toThrow('Kunde inte rita bilden')

    await vi.advanceTimersByTimeAsync(0)
    expect(create).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(1_999)
    expect(create).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(1)
    expect(create).toHaveBeenCalledTimes(2)

    await vi.advanceTimersByTimeAsync(3_999)
    expect(create).toHaveBeenCalledTimes(2)

    await vi.advanceTimersByTimeAsync(1)
    expect(create).toHaveBeenCalledTimes(3)

    await expectation
  })

  it('returns jpeg after one quota retry', async () => {
    vi.useFakeTimers()
    create
      .mockRejectedValueOnce(new Error('429 quota'))
      .mockResolvedValueOnce({output_image: {data: Buffer.from('jpeg').toString('base64')}})
    const {generateExtraJpeg} = await import('./gemini')

    const pending = generateExtraJpeg('scene')
    const done = pending.then((bytes) => Buffer.from(bytes).toString())
    await vi.runAllTimersAsync()

    await expect(done).resolves.toBe('jpeg')
    expect(create).toHaveBeenCalledTimes(2)
  })
})
