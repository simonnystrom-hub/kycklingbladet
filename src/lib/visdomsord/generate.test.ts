import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import type {VisdomsordDraft} from './parse'
import {generateVisdomsordDrafts, takeFreshDrafts} from './generate'

const {createMessage} = vi.hoisted(() => ({
  createMessage: vi.fn(),
}))

vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = {create: createMessage}
  },
}))

function response(drafts: VisdomsordDraft[]) {
  return {
    content: [{type: 'text' as const, text: JSON.stringify(drafts)}],
  }
}

describe('takeFreshDrafts', () => {
  it('drops empty, existing, and duplicate quotes while keeping the first', () => {
    const existingKeys = new Set(['sitt inte'])
    const drafts = [
      {quote: 'Sitt inte!', henName: 'Agda'},
      {quote: '  ', henName: 'Rut'},
      {quote: 'Kackla lugnt.', henName: 'Hedvig'},
      {quote: 'kackla lugnt!', henName: 'Majsan'},
      {quote: 'Värp vidare.', henName: ''},
    ]

    expect(takeFreshDrafts(drafts, existingKeys)).toEqual([
      {quote: 'Kackla lugnt.', henName: 'Hedvig'},
    ])
  })
})

describe('generateVisdomsordDrafts', () => {
  const originalKey = process.env.ANTHROPIC_API_KEY

  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = 'test-key'
    createMessage.mockReset()
  })

  afterEach(() => {
    if (originalKey === undefined) delete process.env.ANTHROPIC_API_KEY
    else process.env.ANTHROPIC_API_KEY = originalKey
  })

  it('requires an Anthropic API key', async () => {
    delete process.env.ANTHROPIC_API_KEY

    await expect(
      generateVisdomsordDrafts({count: 1, existingQuotes: []}),
    ).rejects.toThrow('ANTHROPIC_API_KEY saknas')
    expect(createMessage).not.toHaveBeenCalled()
  })

  it('generates batches of at most 25 and excludes accepted duplicates', async () => {
    const first = Array.from({length: 25}, (_, index) => ({
      quote: `Klokhet ${index + 1}.`,
      henName: `Höna ${index + 1}`,
    }))
    createMessage
      .mockResolvedValueOnce(response(first))
      .mockResolvedValueOnce(
        response([
          first[0],
          {quote: 'Klokhet 26.', henName: 'Höna 26'},
          {quote: 'Klokhet 27.', henName: 'Höna 27'},
        ]),
      )

    const result = await generateVisdomsordDrafts({
      count: 27,
      existingQuotes: ['Redan sagt.'],
    })

    expect(result).toHaveLength(27)
    expect(createMessage).toHaveBeenCalledTimes(2)
    expect(createMessage.mock.calls[0][0]).toMatchObject({
      max_tokens: 4000,
      temperature: 0.9,
    })
    expect(createMessage.mock.calls[0][0].messages[0].content).toContain(
      'Antal: 25',
    )
    expect(createMessage.mock.calls[1][0].messages[0].content).toContain(
      'Antal: 2',
    )
    expect(createMessage.mock.calls[1][0].messages[0].content).toContain(
      'klokhet 1',
    )
  })

  it('retries an empty batch once and stops when retry is also empty', async () => {
    createMessage.mockResolvedValue(response([]))

    await expect(
      generateVisdomsordDrafts({count: 10, existingQuotes: []}),
    ).resolves.toEqual([])
    expect(createMessage).toHaveBeenCalledTimes(2)
  })
})
