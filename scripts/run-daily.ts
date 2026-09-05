import { isIsoDateString, stockholmToday } from '../src/lib/select/stockholm-date'
import { selectWinner, type ScoredHeadline } from '../src/lib/select/select-winner'
import { alarmIdForDate, parseAlarmSlot } from '../src/lib/select/alarm-id'
import { uniqueAlarmSlug } from '../src/lib/select/alarm-path'
import { remainingHeadlines } from '../src/lib/select/notice-picks'
import { fetchScoredHeadlines } from '../src/lib/alarmindex/queries'
import {
  alarmBySlot,
  fetchAlarmsForDate,
  fetchRecentLeadSources,
  publishAlarm,
  takenSlugs,
  type PublishedAlarmSlot,
} from '../src/lib/sanity/publish'
import { generateAlarm } from '../src/lib/generate/claude'
import { pickNoticeHeadlineIds } from '../src/lib/generate/claude-notices'
import { attachLeadImage } from '../src/lib/lead/attach-image'
import { scoreAlarmIfMissing } from '../src/lib/sanity/score-published'
import { sharePublishedLead } from '../src/lib/facebook/published'
import type { GeneratedAlarm } from '../src/lib/generate/validate'

const RETRIES = 3
const WAIT_MS = 10 * 60 * 1000
const SECONDARY_SLOTS = [2, 3] as const

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function scoreDate(date: string, existingId?: string | null) {
  const id = (existingId ?? alarmIdForDate(date)).replace(/^drafts\./, '')
  try {
    const humorScore = await scoreAlarmIfMissing(id)
    if (humorScore != null) console.log(`Humorpoäng ${humorScore} för ${id}`)
  } catch (error) {
    console.error(`Kunde inte sätta humorpoäng för ${id}`, error)
  }
}

async function headlinesWithRetry(date: string) {
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    const headlines = await fetchScoredHeadlines(date)
    if (headlines.length > 0) return headlines
    if (attempt < RETRIES) {
      console.log(`Inga Alarmindex-rubriker för ${date} (försök ${attempt}/${RETRIES}). Väntar 10 min.`)
      await sleep(WAIT_MS)
    }
  }
  throw new Error(`Inga publicerade Alarmindex-rubriker för ${date}`)
}

async function attachImageSafe(
  date: string,
  slot: number,
  generated: GeneratedAlarm,
) {
  const id = alarmIdForDate(date, slot)
  try {
    const image = await attachLeadImage({
      id,
      date,
      brief: generated.imageBrief,
      filename: slot <= 1 ? `lead-${date}.jpg` : `lead-${date}-${slot}.jpg`,
    })
    if (image.imageError) console.error(`Kunde inte rita larmbilden för ${id}: ${image.imageError}`)
  } catch (error) {
    console.error(`Kunde inte rita larmbilden för ${id}`, error)
  }
}

async function createSlot(input: {
  date: string
  slot: number
  source: ScoredHeadline
  taken: string[]
}): Promise<string | null> {
  const { generated, modelVersion, promptVersion } = await generateAlarm({
    text: input.source.text,
    newspaperName: input.source.newspaperName,
  })
  const slug = uniqueAlarmSlug(generated.headline, input.taken)
  const result = await publishAlarm({
    date: input.date,
    slot: input.slot,
    slug,
    generated,
    source: input.source,
    promptVersion,
    modelVersion,
  })
  const id = alarmIdForDate(input.date, input.slot)
  if (result === 'skipped') {
    console.log(`Hoppar över ${id}`)
    return slug
  }
  console.log(`Publicerat ${id}: ${generated.headline}`)
  await attachImageSafe(input.date, input.slot, generated)
  await scoreDate(input.date, id)
  await sharePublishedLead(id)
  return slug
}

export async function runDaily(now = new Date()) {
  const forced = process.env.FORCE_DATE?.trim()
  if (forced && !isIsoDateString(forced)) {
    throw new Error(`Ogiltigt FORCE_DATE "${forced}" — förväntat YYYY-MM-DD`)
  }
  const date = forced || stockholmToday(now)
  let headlines: ScoredHeadline[] | null = null
  const loadHeadlines = async () => {
    if (!headlines) headlines = await headlinesWithRetry(date)
    return headlines
  }

  let existing = await fetchAlarmsForDate(date)
  if (!alarmBySlot(existing, 1)) {
    const pool = await loadHeadlines()
    const used = await fetchRecentLeadSources(date)
    const winner = selectWinner(pool, used)
    if (!winner) throw new Error(`Inga obrukade Alarmindex-rubriker för ${date}`)
    await createSlot({
      date,
      slot: 1,
      source: winner,
      taken: takenSlugs(existing),
    })
    existing = await fetchAlarmsForDate(date)
  } else {
    const lead = alarmBySlot(existing, 1) as PublishedAlarmSlot
    await scoreDate(date, lead._id)
  }

  const lead = alarmBySlot(existing, 1)
  if (!lead) return

  const missing = SECONDARY_SLOTS.filter((slot) => !alarmBySlot(existing, slot))
  if (missing.length === 0) {
    console.log(`Hoppar över ${date}: tre larm finns redan`)
    return
  }

  const pool = remainingHeadlines(
    await loadHeadlines(),
    lead,
    existing.filter((alarm) => parseAlarmSlot(alarm.slot) !== 1),
  )
  if (pool.length === 0) {
    console.log(`Inga övriga rubriker att göra larm av för ${date}`)
    return
  }

  const ids = await pickNoticeHeadlineIds(pool, Math.min(missing.length, pool.length))
  if (ids.length === 0) {
    console.log(`Inga övriga rubriker att göra larm av för ${date}`)
    return
  }
  let taken = takenSlugs(existing)
  for (const [index, headlineId] of ids.entries()) {
    const source = pool.find((headline) => headline.headlineId === headlineId)
    const slot = missing[index]
    if (!source || slot == null) continue
    try {
      const slug = await createSlot({ date, slot, source, taken })
      if (slug) taken = [...taken, slug]
    } catch (error) {
      console.error(`Kunde inte skapa larm ${alarmIdForDate(date, slot)}`, error)
    }
  }
}

runDaily().catch((error) => {
  console.error(error)
  process.exit(1)
})
