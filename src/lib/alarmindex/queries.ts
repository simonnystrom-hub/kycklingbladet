import type {ScoredHeadline} from '@/lib/select/select-winner'
import {getAlarmindexClient} from './client'
import type {AlarmindexHeadlineScoreRow} from './types'

const SCORED_HEADLINES_QUERY = `*[_type == "headlineScore"
  && defined(displayScore)
  && needsReview != true
  && headline->snapshot->date == $date
  && headline->snapshot->publicationStatus == "published"
]{
  displayScore,
  "headlineId": headline->_id,
  "text": headline->text,
  "newspaperName": headline->snapshot->newspaper->name,
  "newspaperSlug": coalesce(
    headline->snapshot->newspaper->slug.current,
    string::split(headline->snapshot->newspaper._ref, "newspaper-")[1]
  )
}`

export async function fetchScoredHeadlines(date: string): Promise<ScoredHeadline[]> {
  const rows = await getAlarmindexClient().fetch<AlarmindexHeadlineScoreRow[]>(
    SCORED_HEADLINES_QUERY,
    {date},
  )

  return rows.flatMap((row) => {
    if (
      typeof row.text !== 'string' ||
      !row.text ||
      typeof row.newspaperSlug !== 'string' ||
      !row.newspaperSlug ||
      typeof row.displayScore !== 'number' ||
      typeof row.headlineId !== 'string' ||
      !row.headlineId
    ) {
      return []
    }

    return [
      {
        headlineId: row.headlineId,
        text: row.text,
        newspaperName: typeof row.newspaperName === 'string' ? row.newspaperName : '',
        newspaperSlug: row.newspaperSlug,
        displayScore: row.displayScore,
      },
    ]
  })
}
