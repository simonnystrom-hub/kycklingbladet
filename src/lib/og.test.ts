import {describe, expect, it} from 'vitest'
import {DEFAULT_OG_IMAGE, cartoonImageUrl, shareImages} from './og'

describe('cartoonImageUrl', () => {
  it('returns a trimmed url when present', () => {
    expect(cartoonImageUrl({imageUrl: ' https://cdn.sanity.io/x.jpg '})).toBe(
      'https://cdn.sanity.io/x.jpg',
    )
  })

  it('skips empty values', () => {
    expect(cartoonImageUrl({imageUrl: ''})).toBeUndefined()
    expect(cartoonImageUrl({imageUrl: null})).toBeUndefined()
    expect(cartoonImageUrl()).toBeUndefined()
  })
})

describe('shareImages', () => {
  it('always leads with the branded default image', () => {
    expect(shareImages()).toEqual([DEFAULT_OG_IMAGE])
  })

  it('appends cartoons after the default image', () => {
    expect(
      shareImages('https://cdn.sanity.io/extra.jpg', 'https://cdn.sanity.io/lead.jpg'),
    ).toEqual([
      DEFAULT_OG_IMAGE,
      {url: 'https://cdn.sanity.io/extra.jpg'},
      {url: 'https://cdn.sanity.io/lead.jpg'},
    ])
  })

  it('drops missing cartoons', () => {
    expect(shareImages(undefined, 'https://cdn.sanity.io/lead.jpg', null)).toEqual([
      DEFAULT_OG_IMAGE,
      {url: 'https://cdn.sanity.io/lead.jpg'},
    ])
  })
})
