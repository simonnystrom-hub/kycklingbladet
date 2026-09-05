import {generateAlarm} from '../src/lib/generate/claude'
import {generateImageBriefFromCopy} from '../src/lib/generate/image-brief'
import {attachLeadImage} from '../src/lib/lead/attach-image'
import {
  alarmBySlot,
  ensureAlarmSlug,
  fetchAlarmsForDate,
  publishAlarm,
  takenSlugs,
  unsetAlarmNotices,
} from '../src/lib/sanity/publish'
import {scoreAlarmIfMissing} from '../src/lib/sanity/score-published'
import {fetchAlarmsWithNotices} from '../src/lib/sanity/fill-notices'
import type {AlarmNotice} from '../src/lib/sanity/types'
import {alarmIdForDate, parseAlarmSlot} from '../src/lib/select/alarm-id'
import {uniqueAlarmSlug} from '../src/lib/select/alarm-path'
import type {ScoredHeadline} from '../src/lib/select/select-winner'
import {getWriteClient} from '../src/lib/sanity/write-client'

function asSource(notice: AlarmNotice): ScoredHeadline {
  return {
    headlineId: notice.sourceHeadlineId,
    text: notice.sourceHeadline,
    newspaperName: notice.sourceNewspaper,
    newspaperSlug: notice.sourceNewspaperSlug,
    displayScore: notice.sourceScore,
    newspaperDailyScore: notice.sourceScore,
  }
}

async function backfillSlotOneSlug(date: string) {
  const alarms = await fetchAlarmsForDate(date)
  const lead = alarmBySlot(alarms, 1)
  if (!lead) return
  const others = alarms.filter((alarm) => parseAlarmSlot(alarm.slot) !== 1)
  await ensureAlarmSlug(lead, takenSlugs(others))
}

async function upgradeNotice(
  date: string,
  slot: 2 | 3,
  notice: AlarmNotice,
  taken: string[],
): Promise<string | null> {
  if (await getWriteClient().fetch(`*[_id in [$id, $draftId]][0]._id`, {
    id: alarmIdForDate(date, slot),
    draftId: `drafts.${alarmIdForDate(date, slot)}`,
  })) {
    return null
  }

  const {generated, modelVersion, promptVersion} = await generateAlarm({
    text: notice.sourceHeadline,
    newspaperName: notice.sourceNewspaper,
  })
  const slug = uniqueAlarmSlug(generated.headline, taken)
  const result = await publishAlarm({
    date,
    slot,
    slug,
    generated,
    source: asSource(notice),
    promptVersion,
    modelVersion,
  })
  if (result === 'skipped') return slug

  const id = alarmIdForDate(date, slot)
  let brief = generated.imageBrief
  if (!brief) {
    try {
      brief = await generateImageBriefFromCopy({
        kind: 'larm',
        headline: generated.headline,
        body: generated.body,
      })
    } catch (error) {
      console.error(`Kunde inte skriva bildmanus för ${id}`, error)
    }
  }
  try {
    const image = await attachLeadImage({
      id,
      date,
      brief,
      filename: `lead-${date}-${slot}.jpg`,
    })
    if (image.imageError) console.error(`Kunde inte rita larmbilden för ${id}: ${image.imageError}`)
  } catch (error) {
    console.error(`Kunde inte rita larmbilden för ${id}`, error)
  }
  try {
    const humorScore = await scoreAlarmIfMissing(id)
    if (humorScore != null) console.log(`Humorpoäng ${humorScore} för ${id}`)
  } catch (error) {
    console.error(`Kunde inte sätta humorpoäng för ${id}`, error)
  }
  console.log(`Uppgraderat ${id}: ${generated.headline}`)
  return slug
}

export async function upgradeNoticesToLarm() {
  const withNotices = (await fetchAlarmsWithNotices()).filter(
    (alarm) => !alarm._id.startsWith('drafts.'),
  )
  const dates = [...new Set(withNotices.map((alarm) => alarm.date))]
  const allSlotOnes = await getWriteClient().fetch<{date: string}[]>(
    `*[_type == "alarm" && coalesce(slot, 1) == 1 && !(_id in path("drafts.**"))]{date}`,
  )
  const slugDates = [...new Set([...dates, ...allSlotOnes.map((row) => row.date)])].sort()

  for (const date of slugDates) {
    try {
      await backfillSlotOneSlug(date)
    } catch (error) {
      console.error(`Kunde inte sätta slug för ${date}`, error)
    }
  }

  for (const alarm of withNotices) {
    const date = alarm.date
    let existing = await fetchAlarmsForDate(date)
    let taken = takenSlugs(existing)
    const notices = (alarm.notices ?? []).slice(0, 2)
    const slots = [2, 3] as const
    let created = 0
    for (const [index, notice] of notices.entries()) {
      const slot = slots[index]
      if (!slot) continue
      if (alarmBySlot(existing, slot)) {
        created += 1
        continue
      }
      try {
        const slug = await upgradeNotice(date, slot, notice, taken)
        if (slug) taken = [...taken, slug]
        created += 1
        existing = await fetchAlarmsForDate(date)
      } catch (error) {
        console.error(`Kunde inte uppgradera notis ${index + 1} för ${date}`, error)
      }
    }

    existing = await fetchAlarmsForDate(date)
    const upgraded = notices.every((_, index) => alarmBySlot(existing, slots[index] ?? 2))
    if (upgraded && notices.length > 0) {
      await unsetAlarmNotices(alarm._id)
      console.log(`Tog bort notiser från ${alarm._id}`)
    } else if (created === 0) {
      console.log(`Lämnar notiser på ${alarm._id}`)
    }
  }

  console.log('Klart med notice-uppgradering')
}

upgradeNoticesToLarm().catch((error) => {
  console.error(error)
  process.exit(1)
})
