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
      description: 'Nyheter för dig som vet att räven alltid står utanför luckan.',
      siteUrl: 'https://www.kycklingbladet.com',
      feedUrl: 'https://www.kycklingbladet.com/rss.xml',
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
    expect(xml).toContain('https://www.kycklingbladet.com/arkiv/2026-09-03')
    expect(xml).toContain('Nationellt hönslarm')
    expect(xml).toContain('Första stycket.')
    expect(xml).toContain(rssPubDate('2026-09-03'))
    expect(xml).toContain(
      '<atom:link href="https://www.kycklingbladet.com/rss.xml" rel="self" type="application/rss+xml"/>',
    )
  })

  it('uses an Extra Extra path for its link and guid', () => {
    const xml = buildRss({
      title: 'Kycklingbladet',
      description: 'Beskrivning',
      siteUrl: 'https://www.kycklingbladet.com',
      feedUrl: 'https://www.kycklingbladet.com/rss.xml',
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

    const extraUrl = 'https://www.kycklingbladet.com/extra-extra/2026-09-03'
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
        kicker: 'EXTRA EXTRA',
        headline: 'Räven gripen',
        body: 'Faran är över.',
        path: '/extra-extra/2026-09-03',
      },
      {
        date: '2026-09-03',
        kicker: 'Nationellt hönslarm',
        headline: 'Luckan & fällan',
        body: 'Första stycket.\n\nAndra stycket.',
        path: '/arkiv/2026-09-03/luckan-fällan',
      },
      {
        date: '2026-09-02',
        kicker: 'Nationellt hönslarm',
        headline: 'Nästa dags larm',
        body: 'Första stycket.\n\nAndra stycket.',
        path: '/arkiv/2026-09-02/nästa-dags-larm',
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
        path: '/arkiv/2026-09-03/luckan-fällan',
      },
    ])
  })

  it('emits one item per larm on the same date', () => {
    const items = rssItemsFromAlarms([
      alarm({slot: 2, slug: 'andra', headline: 'Andra', _id: 'alarm-2026-09-03-2'}),
      alarm({slot: 1, slug: 'forsta', headline: 'Första'}),
      alarm({slot: 3, slug: 'tredje', headline: 'Tredje', _id: 'alarm-2026-09-03-3'}),
    ])
    expect(items.map((item) => item.path)).toEqual([
      '/arkiv/2026-09-03/forsta',
      '/arkiv/2026-09-03/andra',
      '/arkiv/2026-09-03/tredje',
    ])
  })
})
