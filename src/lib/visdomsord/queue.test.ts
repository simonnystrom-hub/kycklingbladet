import {describe, expect, it} from 'vitest'
import {alreadyPostedOn, pickNextUnused, type VisdomsordRow} from './queue'

function row(partial: Partial<VisdomsordRow> & Pick<VisdomsordRow, '_id'>): VisdomsordRow {
  return {
    quote: 'q',
    henName: 'Gerda',
    _createdAt: '2026-09-01T00:00:00Z',
    ...partial,
  }
}

describe('alreadyPostedOn', () => {
  it('is true when any row has usedDate equal to today', () => {
    expect(
      alreadyPostedOn(
        [row({_id: 'a', usedDate: '2026-09-06'})],
        '2026-09-06',
      ),
    ).toBe(true)
  })
})

describe('pickNextUnused', () => {
  it('returns the oldest unused row even without an image', () => {
    const picked = pickNextUnused([
      row({_id: 'new', _createdAt: '2026-09-03T00:00:00Z'}),
      row({_id: 'old', _createdAt: '2026-09-01T00:00:00Z'}),
      row({_id: 'used', usedDate: '2026-09-05', _createdAt: '2026-08-01T00:00:00Z'}),
    ])
    expect(picked?._id).toBe('old')
  })

  it('publishes the lowest queueOrder first', () => {
    const picked = pickNextUnused([
      row({_id: 'older', _createdAt: '2026-08-01T00:00:00Z', queueOrder: 2}),
      row({_id: 'top', _createdAt: '2026-09-03T00:00:00Z', queueOrder: 0}),
      row({_id: 'mid', _createdAt: '2026-09-02T00:00:00Z', queueOrder: 1}),
    ])
    expect(picked?._id).toBe('top')
  })

  it('keeps unordered rows after numbered ones, oldest first', () => {
    const picked = pickNextUnused([
      row({_id: 'unordered-old', _createdAt: '2026-08-01T00:00:00Z'}),
      row({_id: 'numbered', _createdAt: '2026-09-03T00:00:00Z', queueOrder: 0}),
    ])
    expect(picked?._id).toBe('numbered')
  })

  it('returns null when nothing unused has a quote', () => {
    expect(pickNextUnused([row({_id: 'x', quote: '   '})])).toBeNull()
  })
})
