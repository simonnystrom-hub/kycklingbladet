import {describe, expect, it} from 'vitest'
import type {Alarm, ExtraExtra} from '@/lib/sanity/types'
import {cartoonIllustration, extraIllustration, leadIllustration} from './illustration'

const alarmBase: Alarm = {
  _id: 'alarm-2026-09-05',
  date: '2026-09-05',
  kicker: 'Dagens skrämchock',
  headline: 'Räven vid luckan',
  body: 'Gården håller andan.',
  expertVoice: 'Överhönan',
  expertHeadline: 'varnar: Kan bli mycket värre',
  expertText: 'Håll er inne.',
  sourceHeadline: 'Källrubrik',
  sourceNewspaper: 'Expressen',
  sourceNewspaperSlug: 'expressen',
  sourceAlarmindexUrl: 'https://example.com',
  sourceScore: 1,
  promptVersion: 'kb-v11',
  modelVersion: 'claude-test',
}

const base: ExtraExtra = {
  _id: 'extra-extra-2026-09-05',
  date: '2026-09-05',
  kicker: 'EXTRA EXTRA',
  headline: 'Tuppchock på riksväg 40',
  body: 'Hela gården håller andan.',
  sourceUrl: 'https://www.expressen.se/nyheter/test',
  sourceHeadline: 'Trafikstopp på riksväg 40',
  sourceNewspaper: 'Expressen',
  sourceNewspaperSlug: 'expressen',
  promptVersion: 'kb-extra-v1',
  modelVersion: 'claude-test',
  createdAt: '2026-09-05T09:00:00.000Z',
}

describe('extraIllustration', () => {
  it('requires url and caption', () => {
    expect(
      extraIllustration({
        ...base,
        imageUrl: 'https://cdn.sanity.io/x.jpg',
        imageCaption: 'Tuppen Gösta.',
      }),
    ).toEqual({
      url: 'https://cdn.sanity.io/x.jpg',
      caption: 'Tuppen Gösta.',
    })
    expect(extraIllustration({...base, imageUrl: '', imageCaption: 'x'})).toBeNull()
    expect(extraIllustration(base)).toBeNull()
  })
})

it('leadIllustration requires url and caption', () => {
  expect(
    leadIllustration({
      ...alarmBase,
      imageUrl: 'https://cdn.sanity.io/lead.jpg',
      imageCaption: 'Tuppen Gösta vid luckan i går kväll.',
    }),
  ).toEqual({
    url: 'https://cdn.sanity.io/lead.jpg',
    caption: 'Tuppen Gösta vid luckan i går kväll.',
  })
  expect(leadIllustration({...alarmBase, imageUrl: '', imageCaption: 'x'})).toBeNull()
  expect(leadIllustration(alarmBase)).toBeNull()
  expect(cartoonIllustration({imageUrl: 'https://cdn.sanity.io/x.jpg', imageCaption: 'x'})).toEqual({
    url: 'https://cdn.sanity.io/x.jpg',
    caption: 'x',
  })
})
