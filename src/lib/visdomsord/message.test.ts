import {describe, expect, it} from 'vitest'
import {facebookWisdomMessage} from './message'

describe('facebookWisdomMessage', () => {
  it('wraps a bare quote and puts KUCKELIKUUUU, quote and hen name on separate blocks', () => {
    expect(facebookWisdomMessage({quote: 'Sitt inte med ryggen mot luckan.', henName: 'Gerda Stålklöv'})).toBe(
      ['KUCKELIKUUUU!', '"Sitt inte med ryggen mot luckan."', 'Gerda Stålklöv'].join('\n\n'),
    )
  })

  it('does not double-wrap quotes that already have wrapping marks', () => {
    expect(facebookWisdomMessage({quote: '"Hacka i lagom takt."', henName: 'Bengt Fjäderson'})).toContain(
      '"Hacka i lagom takt."',
    )
    expect(facebookWisdomMessage({quote: '"Hacka i lagom takt."', henName: 'Bengt Fjäderson'})).not.toContain(
      '""Hacka',
    )
  })
})
