import { isIsoDateString, stockholmToday } from '../src/lib/select/stockholm-date'
import { selectWinner } from '../src/lib/select/select-winner'
import { alarmIdForDate, shouldCreateAlarm } from '../src/lib/select/alarm-id'
import { fetchScoredHeadlines } from '../src/lib/alarmindex/queries'
import { findExistingAlarmId, fetchRecentLeadSources, publishAlarm } from '../src/lib/sanity/publish'
import { generateAlarm } from '../src/lib/generate/claude'
import { attachLeadImage } from '../src/lib/lead/attach-image'
import { scoreAlarmIfMissing } from '../src/lib/sanity/score-published'
import { fillNoticesForDate } from '../src/lib/sanity/fill-notices'
import { sharePublishedLead } from '../src/lib/facebook/published'

const RETRIES = 3
const WAIT_MS = 10 * 60 * 1000

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function scoreDate(date: string, existingId?: string | null) {
  const id = (existingId ?? alarmIdForDate(date)).replace(/^drafts\./, '')
  try {
    const humorScore = await scoreAlarmIfMissing(id)
    if (humorScore != null) console.log(`Humorpoäng ${humorScore} för ${date}`)
  } catch (error) {
    console.error(`Kunde inte sätta humorpoäng för ${date}`, error)
  }
}

async function fillNoticesSafe(date: string) {
  try {
    const result = await fillNoticesForDate(date)
    if (result === 'filled') console.log(`Notiser ifyllda för ${date}`)
    if (result === 'empty') console.log(`Inga övriga rubriker att göra notiser av för ${date}`)
  } catch (error) {
    console.error(`Kunde inte fylla notiser för ${date}`, error)
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

export async function runDaily(now = new Date()) {
  const forced = process.env.FORCE_DATE?.trim()
  if (forced && !isIsoDateString(forced)) {
    throw new Error(`Ogiltigt FORCE_DATE "${forced}" — förväntat YYYY-MM-DD`)
  }
  const date = forced || stockholmToday(now)
  const existing = await findExistingAlarmId(date)
  if (!shouldCreateAlarm(existing)) {
    console.log(`Hoppar över ${date}: larm finns redan (${existing})`)
    await scoreDate(date, existing)
    await fillNoticesSafe(date)
    return
  }
  const headlines = await headlinesWithRetry(date)
  const used = await fetchRecentLeadSources(date)
  const winner = selectWinner(headlines, used)
  if (!winner) throw new Error(`Inga obrukade Alarmindex-rubriker för ${date}`)
  const { generated, modelVersion, promptVersion } = await generateAlarm({
    text: winner.text,
    newspaperName: winner.newspaperName,
  })
  const result = await publishAlarm({
    date,
    generated,
    source: winner,
    promptVersion,
    modelVersion,
  })
  console.log(result === 'skipped' ? `Hoppar över ${date}` : `Publicerat ${date}: ${generated.headline}`)
  const created = result === 'created'
  if (created) {
    try {
      const image = await attachLeadImage({
        id: alarmIdForDate(date),
        date,
        brief: generated.imageBrief,
      })
      if (image.imageError) console.error(`Kunde inte rita larmbilden för ${date}: ${image.imageError}`)
    } catch (error) {
      console.error(`Kunde inte rita larmbilden för ${date}`, error)
    }
  }
  await scoreDate(date)
  await fillNoticesSafe(date)
  if (created) {
    await sharePublishedLead(date)
  }
}

runDaily().catch((error) => {
  console.error(error)
  process.exit(1)
})
