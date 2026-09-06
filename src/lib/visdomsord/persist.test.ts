import {beforeEach, describe, expect, it, vi} from 'vitest'
import {rewriteVisdomsord} from './persist'

const {fetch, generateDrafts, patch} = vi.hoisted(() => ({
  fetch: vi.fn(),
  generateDrafts: vi.fn(),
  patch: vi.fn(),
}))

vi.mock('@/lib/sanity/write-client', () => ({
  getWriteClient: () => ({fetch, patch}),
}))

vi.mock('./generate', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./generate')>()
  return {
    ...actual,
    generateVisdomsordDrafts: generateDrafts,
  }
})

function patchChain() {
  const commit = vi.fn().mockResolvedValue(undefined)
  const unset = vi.fn(() => ({commit}))
  const set = vi.fn(() => ({unset}))
  return {commit, set, unset}
}

describe('rewriteVisdomsord', () => {
  beforeEach(() => {
    fetch.mockReset()
    generateDrafts.mockReset()
    patch.mockReset()
  })

  it('skips missing and used rows, then rewrites an unused row and clears images', async () => {
    const chain = patchChain()
    patch.mockReturnValue(chain)
    fetch
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        _id: 'used',
        quote: 'Gammalt.',
        henName: 'Agda',
        usedDate: '2026-09-06',
      })
      .mockResolvedValueOnce({
        _id: 'fresh',
        quote: 'Nuvarande klokhet.',
        henName: 'Rut',
        usedDate: null,
      })
      .mockResolvedValueOnce(['Annans klokhet.'])
    generateDrafts.mockResolvedValue([
      {quote: 'Nuvarande klokhet.', henName: 'Hedvig'},
    ])

    await expect(
      rewriteVisdomsord(['missing', 'used', 'fresh']),
    ).resolves.toEqual({rewritten: 1, skipped: 2})
    expect(generateDrafts).toHaveBeenCalledWith({
      count: 1,
      existingQuotes: ['Annans klokhet.'],
    })
    expect(patch).toHaveBeenCalledWith('fresh')
    expect(chain.set).toHaveBeenCalledWith({
      quote: 'Nuvarande klokhet.',
      henName: 'Hedvig',
    })
    expect(chain.unset).toHaveBeenCalledWith([
      'image',
      'imageCaption',
      'imageShotType',
      'imagePrompt',
    ])
  })

  it('continues after an individual generation failure', async () => {
    const chain = patchChain()
    patch.mockReturnValue(chain)
    fetch
      .mockResolvedValueOnce({_id: 'first', quote: 'Ett.', henName: 'Agda'})
      .mockResolvedValueOnce(['Två.'])
      .mockResolvedValueOnce({_id: 'second', quote: 'Två.', henName: 'Rut'})
      .mockResolvedValueOnce(['Ett.'])
    generateDrafts
      .mockRejectedValueOnce(new Error('Tillfälligt fel'))
      .mockResolvedValueOnce([{quote: 'Tre.', henName: 'Majsan'}])

    await expect(
      rewriteVisdomsord(['first', 'second']),
    ).resolves.toEqual({rewritten: 1, skipped: 1})
    expect(patch).toHaveBeenCalledTimes(1)
    expect(patch).toHaveBeenCalledWith('second')
  })

  it('rewrites duplicate ids only once', async () => {
    const chain = patchChain()
    patch.mockReturnValue(chain)
    fetch
      .mockResolvedValueOnce({_id: 'same', quote: 'Ett.', henName: 'Agda'})
      .mockResolvedValueOnce([])
    generateDrafts.mockResolvedValue([{quote: 'Två.', henName: 'Rut'}])

    await expect(
      rewriteVisdomsord(['same', 'same']),
    ).resolves.toEqual({rewritten: 1, skipped: 0})
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(generateDrafts).toHaveBeenCalledTimes(1)
    expect(patch).toHaveBeenCalledTimes(1)
  })
})
