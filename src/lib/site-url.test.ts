import {describe, expect, it} from 'vitest'
import {absoluteUrl, CANONICAL_SITE_URL, getSiteUrl} from './site-url'

describe('getSiteUrl', () => {
  it('always uses the public www domain', () => {
    expect(getSiteUrl()).toBe(CANONICAL_SITE_URL)
    expect(CANONICAL_SITE_URL).toBe('https://www.kycklingbladet.com')
  })
})

describe('absoluteUrl', () => {
  it('prefixes paths with the canonical site', () => {
    expect(absoluteUrl('/rss.xml')).toBe(`${CANONICAL_SITE_URL}/rss.xml`)
  })
})
