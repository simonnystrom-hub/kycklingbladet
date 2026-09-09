export type ShareChannelResult = 'shared' | 'skipped' | 'failed'

export function visdomsordShareOutcome(
  facebook: ShareChannelResult,
  x: ShareChannelResult,
): {markUsed: boolean; failed: boolean} {
  return {
    markUsed: facebook === 'shared' || x === 'shared',
    failed: facebook === 'failed' || x === 'failed',
  }
}
