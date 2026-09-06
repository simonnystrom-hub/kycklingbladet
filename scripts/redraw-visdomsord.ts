import {generateImageBriefFromCopy} from '../src/lib/generate/image-brief'
import {attachLeadImage} from '../src/lib/lead/attach-image'
import {getWriteClient} from '../src/lib/sanity/write-client'
import {stockholmToday} from '../src/lib/select/stockholm-date'
import {normalizeQuoteKey} from '../src/lib/visdomsord/normalize'

type Row = {_id: string; quote: string; henName: string}

async function main() {
  const needle = process.argv.slice(2).join(' ').trim()
  if (!needle) {
    throw new Error('Ange citatet som ska ritas om.')
  }
  const key = normalizeQuoteKey(needle)
  const rows = await getWriteClient().fetch<Row[]>(
    `*[_type == "visdomsord" && !(_id in path("drafts.**"))]{_id, quote, henName}`,
  )
  const match = rows.find((row) => normalizeQuoteKey(row.quote) === key)
  if (!match) {
    throw new Error(`Hittade inget visdomsord för: ${needle}`)
  }

  const brief = await generateImageBriefFromCopy({
    kind: 'visdomsord',
    headline: match.henName,
    body: match.quote,
  })
  const drawn = await attachLeadImage({
    id: match._id,
    date: stockholmToday(),
    brief,
    filename: `visdomsord-${match._id}.jpg`,
  })
  if (drawn.imageError) throw new Error(drawn.imageError)
  if (!drawn.image) throw new Error('Ingen bild')
  console.log(`Ritade om ${match._id} (${match.henName})`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
