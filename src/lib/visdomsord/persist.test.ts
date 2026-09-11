import {beforeEach, describe, expect, it, vi} from 'vitest'
import {createVisdomsord, rewriteVisdomsord} from './persist'

const {fetch, generateDrafts, patch, create} = vi.hoisted(() => ({
  fetch: vi.fn(),
  generateDrafts: vi.fn(),
  patch: vi.fn(),
  create: vi.fn(),
}))

vi.mock('@/lib/sanity/write-client', () => ({
  getWriteClient: () => ({fetch, patch, create}),
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

function orderPatchChain() {
  const commit = vi.fn().mockResolvedValue(undefined)
  const set = vi.fn(() => ({commit}))
  return {commit, set}
}

describe('createVisdomsord', () => {
  beforeEach(() => {
    fetch.mockReset()
    patch.mockReset()
    create.mockReset()
    create.mockResolvedValue({_id: 'new'})
  })

  it('creates nothing when there are no drafts', async () => {
    await expect(createVisdomsord([])).resolves.toBe(0)
    expect(fetch).not.toHaveBeenCalled()
    expect(create).not.toHaveBeenCalled()
  })

  it('lines up unused quotes then appends new ones at the end', async () => {
    const chain = orderPatchChain()
    patch.mockReturnValue(chain)
    fetch.mockResolvedValue([
      {_id: 'newish', queueOrder: null, _createdAt: '2026-09-03T00:00:00Z'},
      {_id: 'oldest', _createdAt: '2026-09-01T00:00:00Z'},
    ])

    await expect(
      createVisdomsord([
        {quote: 'Först nya.', henName: 'Rut'},
        {quote: 'Sen nya.', henName: 'Agda'},
      ]),
    ).resolves.toBe(2)

    expect(patch).toHaveBeenNthCalledWith(1, 'oldest')
    expect(chain.set).toHaveBeenNthCalledWith(1, {queueOrder: 0})
    expect(patch).toHaveBeenNthCalledWith(2, 'newish')
    expect(chain.set).toHaveBeenNthCalledWith(2, {queueOrder: 1})
    expect(create).toHaveBeenNthCalledWith(1, {
      _type: 'visdomsord',
      quote: 'Först nya.',
      henName: 'Rut',
      queueOrder: 2,
    })
    expect(create).toHaveBeenNthCalledWith(2, {
      _type: 'visdomsord',
      quote: 'Sen nya.',
      henName: 'Agda',
      queueOrder: 3,
    })
  })

  it('does not rewrite unused rows that already have the right order', async () => {
    const chain = orderPatchChain()
    patch.mockReturnValue(chain)
    fetch.mockResolvedValue([
      {_id: 'top', queueOrder: 0, _createdAt: '2026-09-03T00:00:00Z'},
    ])

    await expect(createVisdomsord([{quote: 'Ny.', henName: 'Rut'}])).resolves.toBe(1)
    expect(patch).not.toHaveBeenCalled()
    expect(create).toHaveBeenCalledWith({
      _type: 'visdomsord',
      quote: 'Ny.',
      henName: 'Rut',
      queueOrder: 1,
    })
  })
})


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
