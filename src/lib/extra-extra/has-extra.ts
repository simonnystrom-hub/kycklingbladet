import type {AlarmExtra} from '@/lib/sanity/types'

export function hasExtraExtra(alarm: {
  extraExtra?: AlarmExtra | null
}): alarm is {extraExtra: AlarmExtra} {
  return (
    typeof alarm.extraExtra?.headline === 'string' &&
    alarm.extraExtra.headline.length > 0 &&
    typeof alarm.extraExtra.body === 'string' &&
    alarm.extraExtra.body.length > 0
  )
}
