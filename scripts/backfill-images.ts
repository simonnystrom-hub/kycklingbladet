import {validateExtraImageBrief} from '../src/lib/generate/extra-image'
import {generateImageBriefFromCopy} from '../src/lib/generate/image-brief'
import {attachLeadImage} from '../src/lib/lead/attach-image'
import {getWriteClient} from '../src/lib/sanity/write-client'

type MissingRow = {
  _id: string
  _type: 'alarm' | 'extraExtra'
  date: string
  headline: string
  body: string
  imageUrl?: string | null
  imageCaption?: string | null
  imagePrompt?: string | null
  imageShotType?: string | null
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function loadMissing(): Promise<MissingRow[]> {
  return getWriteClient().fetch<MissingRow[]>(
    `*[_type in ["alarm", "extraExtra"] && !(_id in path("drafts.**")) && defined(headline) && defined(body) && (!defined(image.asset) || !defined(imageCaption) || !imageCaption)] | order(date asc){
      _id, _type, date, headline, body,
      "imageUrl": image.asset->url,
      imageCaption, imagePrompt, imageShotType
    }`,
  )
}

async function briefFor(row: MissingRow) {
  const existing = validateExtraImageBrief({
    imageShotType: row.imageShotType,
    imageCaption: row.imageCaption,
    imagePrompt: row.imagePrompt,
  })
  if (existing) return existing
  return generateImageBriefFromCopy({
    kind: row._type === 'extraExtra' ? 'extra' : 'larm',
    headline: row.headline,
    body: row.body,
  })
}

async function fill(row: MissingRow) {
  const brief = await briefFor(row)
  const id = row._id.replace(/^drafts\./, '')
  if (row.imageUrl?.trim()) {
    await getWriteClient()
      .patch(id)
      .set({
        imageCaption: brief.caption,
        imageShotType: brief.shotType,
        imagePrompt: brief.scenePrompt,
      })
      .commit()
    return 'caption'
  }

  const drawn = await attachLeadImage({
    id,
    date: row.date,
    brief,
    filename: row._type === 'extraExtra' ? `extra-extra-${row.date}.jpg` : `lead-${row.date}.jpg`,
  })
  if (drawn.imageError) throw new Error(drawn.imageError)
  if (!drawn.image) throw new Error('Ingen bild')
  return 'image'
}

async function main() {
  const rows = await loadMissing()
  console.log(`Saknar bild eller caption: ${rows.length}`)
  if (rows.length === 0) return

  let ok = 0
  for (const [index, row] of rows.entries()) {
    const label = row._type === 'extraExtra' ? 'extra extra' : 'larm'
    try {
      const result = await fill(row)
      ok += 1
      console.log(`${index + 1}/${rows.length} ${row.date} ${label}: ${result}`)
    } catch (error) {
      console.error(`${index + 1}/${rows.length} ${row.date} ${label}:`, error)
    }
    if (index < rows.length - 1) await sleep(2000)
  }
  console.log(`Klart. ok=${ok} totalt=${rows.length}`)
  if (ok < rows.length) process.exitCode = 1
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
