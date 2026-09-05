import {describe, expect, it} from 'vitest'
import {mixArchiveItems} from './archive-items'

describe('mixArchiveItems', () => {
  it('lists an extra-only date and puts Extra Extra before the lead on the same day', () => {
    const items = mixArchiveItems(
      [
        {
          _id: 'alarm-2026-09-05',
          date: '2026-09-05',
          kicker: 'Nationellt hönslarm',
          headline: 'Luckan',
          slug: 'luckan',
          slot: 1,
        },
        {
          _id: 'alarm-2026-09-03',
          date: '2026-09-03',
          kicker: 'Dagens skrämchock',
          headline: 'Äldre larm',
        },
      ],
      [
        {
          _id: 'extra-extra-2026-09-05',
          date: '2026-09-05',
          headline: 'Räven gripen',
          body: 'Faran är över.',
        },
        {
          _id: 'extra-extra-2026-09-04',
          date: '2026-09-04',
          headline: 'Bara extra',
          body: 'Ingen huvudnyhet.',
        },
      ],
    )

    expect(items.map((item) => item.href)).toEqual([
      '/extra-extra/2026-09-05',
      '/arkiv/2026-09-05/luckan',
      '/extra-extra/2026-09-04',
      '/arkiv/2026-09-03/äldre-larm',
    ])
    expect(items[0]).toMatchObject({
      kicker: 'EXTRA EXTRA',
      headline: 'Räven gripen',
      kind: 'extraExtra',
    })
  })

  it('lists every larm on a date after Extra Extra, slot 1 then 2 then 3', () => {
    const items = mixArchiveItems(
      [
        {
          _id: 'alarm-2026-09-05-3',
          date: '2026-09-05',
          kicker: 'Kicker',
          headline: 'Tredje',
          slug: 'tredje',
          slot: 3,
        },
        {
          _id: 'alarm-2026-09-05',
          date: '2026-09-05',
          kicker: 'Kicker',
          headline: 'Första',
          slug: 'forsta',
          slot: 1,
        },
        {
          _id: 'alarm-2026-09-05-2',
          date: '2026-09-05',
          kicker: 'Kicker',
          headline: 'Andra',
          slug: 'andra',
          slot: 2,
        },
      ],
      [
        {
          _id: 'extra-extra-2026-09-05',
          date: '2026-09-05',
          headline: 'Räven gripen',
          body: 'Faran är över.',
        },
      ],
    )

    expect(items.map((item) => item.href)).toEqual([
      '/extra-extra/2026-09-05',
      '/arkiv/2026-09-05/forsta',
      '/arkiv/2026-09-05/andra',
      '/arkiv/2026-09-05/tredje',
    ])
  })

  it('omits extras without headline or body', () => {
    expect(
      mixArchiveItems(
        [],
        [{_id: 'x', date: '2026-09-05', headline: '', body: 'text'}],
      ),
    ).toEqual([])
  })
})
