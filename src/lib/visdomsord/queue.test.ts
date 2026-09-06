import {describe, expect, it} from 'vitest'
import {alreadyPostedOn, pickNextUnusedWithImage, type VisdomsordRow} from './queue'

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

describe('pickNextUnusedWithImage', () => {
  it('returns the oldest unused row that has an image', () => {
    const picked = pickNextUnusedWithImage([
      row({_id: 'new', imageUrl: 'https://cdn.sanity.io/b.jpg', _createdAt: '2026-09-03T00:00:00Z'}),
      row({_id: 'old', imageUrl: 'https://cdn.sanity.io/a.jpg', _createdAt: '2026-09-01T00:00:00Z'}),
      row({_id: 'used', usedDate: '2026-09-05', imageUrl: 'https://cdn.sanity.io/c.jpg', _createdAt: '2026-08-01T00:00:00Z'}),
      row({_id: 'no-img', _createdAt: '2026-08-01T00:00:00Z'}),
    ])
    expect(picked?._id).toBe('old')
  })

  it('returns null when nothing unused has an image', () => {
    expect(pickNextUnusedWithImage([row({_id: 'x'})])).toBeNull()
  })
})
