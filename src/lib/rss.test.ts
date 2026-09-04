import {describe, expect, it} from 'vitest'
import {buildRss, escapeXml, rssPubDate} from './rss'

describe('escapeXml', () => {
  it('escapes markup and quotes', () => {
    expect(escapeXml(`Räven & «luckan» <3>`)).toBe(
      'Räven &amp; «luckan» &lt;3&gt;',
    )
  })
})

describe('buildRss', () => {
  it('emits a readable RSS 2.0 channel with archive links', () => {
    const xml = buildRss({
      title: 'Kycklingbladet',
      description: 'Nyheter för dig som vet att räven alltid står utanför dörren.',
      siteUrl: 'https://kycklingbladet.vercel.app',
      feedUrl: 'https://kycklingbladet.vercel.app/rss.xml',
      items: [
        {
          date: '2026-09-03',
          kicker: 'Nationellt hönslarm',
          headline: 'Luckan & fällan',
          body: 'Första stycket.\n\nAndra stycket.',
        },
      ],
    })

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(xml).toContain('<rss version="2.0"')
    expect(xml).toContain('<title>Luckan &amp; fällan</title>')
    expect(xml).toContain('https://kycklingbladet.vercel.app/arkiv/2026-09-03')
    expect(xml).toContain('Nationellt hönslarm')
    expect(xml).toContain('Första stycket.')
    expect(xml).toContain(rssPubDate('2026-09-03'))
    expect(xml).toContain(
      '<atom:link href="https://kycklingbladet.vercel.app/rss.xml" rel="self" type="application/rss+xml"/>',
    )
  })
})
