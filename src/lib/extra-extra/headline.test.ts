import {describe, expect, it} from 'vitest'
import {cleanScrapedHeadline, extractHeadlineFromHtml} from './headline'

describe('cleanScrapedHeadline', () => {
  it('strips site-name suffixes', () => {
    expect(cleanScrapedHeadline('Får inte heta sylt | Expressen')).toBe('Får inte heta sylt')
    expect(cleanScrapedHeadline('Rubrik - Aftonbladet')).toBe('Rubrik')
  })
})

describe('extractHeadlineFromHtml', () => {
  it('prefers og:title over h1 and title', () => {
    const html = `<html><head>
      <meta property="og:title" content="Får inte heta sylt | Expressen">
      <title>Ignore me</title></head>
      <body><h1>Also ignore</h1></body></html>`
    expect(extractHeadlineFromHtml(html)).toBe('Får inte heta sylt')
  })

  it('falls back to h1 then title', () => {
    expect(extractHeadlineFromHtml('<html><body><h1>  H1-rad  </h1></body></html>')).toBe('H1-rad')
    expect(extractHeadlineFromHtml('<html><head><title>Titel | DN</title></head></html>')).toBe('Titel')
  })

  it('returns null when empty', () => {
    expect(extractHeadlineFromHtml('<html></html>')).toBeNull()
  })
})
