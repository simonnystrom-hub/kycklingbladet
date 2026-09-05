import {describe, expect, it} from 'vitest'
import type {Alarm, ExtraExtra} from './sanity/types'
import {buildRss, escapeXml, rssItemsFromAlarms, rssPubDate} from './rss'

function alarm(overrides: Partial<Alarm> = {}): Alarm {
  return {
    _id: 'alarm-2026-09-03',
    date: '2026-09-03',
    kicker: 'Nationellt hönslarm',
    headline: 'Luckan & fällan',
    body: 'Första stycket.\n\nAndra stycket.',
    expertVoice: 'Expert',
    expertHeadline: 'Expertens analys',
    expertText: 'Analys.',
    sourceHeadline: 'Källrubrik',
    sourceNewspaper: 'Tidningen',
    sourceNewspaperSlug: 'tidningen',
    sourceAlarmindexUrl: 'https://example.com/alarm',
    sourceScore: 10,
    promptVersion: 'prompt-v1',
    modelVersion: 'model-v1',
    ...overrides,
  }
}

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

  it('uses an Extra Extra path for its link and guid', () => {
    const xml = buildRss({
      title: 'Kycklingbladet',
      description: 'Beskrivning',
      siteUrl: 'https://kycklingbladet.vercel.app',
      feedUrl: 'https://kycklingbladet.vercel.app/rss.xml',
      items: [
        {
          date: '2026-09-03',
          kicker: 'EXTRA EXTRA',
          headline: 'Räven gripen',
          body: 'Faran är över.',
          path: '/extra-extra/2026-09-03',
        },
      ],
    })

    const extraUrl = 'https://kycklingbladet.vercel.app/extra-extra/2026-09-03'
    expect(xml).toContain(`<link>${extraUrl}</link>`)
    expect(xml).toContain(`<guid isPermaLink="true">${extraUrl}</guid>`)
    expect(xml).toContain('<title>Räven gripen</title>')
    expect(xml).toContain('<![CDATA[EXTRA EXTRA\n\nFaran är över.]]>')
  })
})

describe('rssItemsFromAlarms', () => {
  it('adds an EXTRA EXTRA item after the lead for a matching date', () => {
    const extra: ExtraExtra = {
      _id: 'extra-extra-2026-09-03',
      date: '2026-09-03',
      kicker: 'EXTRA EXTRA',
      headline: 'Räven gripen',
      body: 'Faran är över.',
      sourceUrl: 'https://example.com/extra',
      sourceHeadline: 'Räven gripen efter dramat',
      sourceNewspaper: 'Tidningen',
      sourceNewspaperSlug: 'tidningen',
      promptVersion: 'extra-v1',
      modelVersion: 'model-v1',
      createdAt: '2026-09-03T12:00:00.000Z',
    }

    const items = rssItemsFromAlarms(
      [
        alarm(),
        alarm({
          _id: 'alarm-2026-09-02',
          date: '2026-09-02',
          headline: 'Nästa dags larm',
        }),
      ],
      [extra],
    )

    expect(items).toEqual([
      {
        date: '2026-09-03',
        kicker: 'Nationellt hönslarm',
        headline: 'Luckan & fällan',
        body: 'Första stycket.\n\nAndra stycket.',
      },
      {
        date: '2026-09-03',
        kicker: 'EXTRA EXTRA',
        headline: 'Räven gripen',
        body: 'Faran är över.',
        path: '/extra-extra/2026-09-03',
      },
      {
        date: '2026-09-02',
        kicker: 'Nationellt hönslarm',
        headline: 'Nästa dags larm',
        body: 'Första stycket.\n\nAndra stycket.',
      },
    ])
  })

  it('emits EXTRA EXTRA without a lead for that date', () => {
    const extra: ExtraExtra = {
      _id: 'extra-extra-2026-09-05',
      date: '2026-09-05',
      kicker: 'EXTRA EXTRA',
      headline: 'Räven gripen',
      body: 'Faran är över.',
      sourceUrl: 'https://example.com/extra',
      sourceHeadline: 'Räven gripen efter dramat',
      sourceNewspaper: 'Tidningen',
      sourceNewspaperSlug: 'tidningen',
      promptVersion: 'extra-v1',
      modelVersion: 'model-v1',
      createdAt: '2026-09-05T08:00:00.000Z',
    }

    expect(rssItemsFromAlarms([alarm()], [extra])).toEqual([
      {
        date: '2026-09-05',
        kicker: 'EXTRA EXTRA',
        headline: 'Räven gripen',
        body: 'Faran är över.',
        path: '/extra-extra/2026-09-05',
      },
      {
        date: '2026-09-03',
        kicker: 'Nationellt hönslarm',
        headline: 'Luckan & fällan',
        body: 'Första stycket.\n\nAndra stycket.',
      },
    ])
  })
})
