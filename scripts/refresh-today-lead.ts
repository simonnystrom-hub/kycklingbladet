import {stockholmToday} from '../src/lib/select/stockholm-date'
import {generateAlarm} from '../src/lib/generate/claude'
import {attachLeadImage} from '../src/lib/lead/attach-image'
import {getWriteClient} from '../src/lib/sanity/write-client'

async function run() {
  const date = stockholmToday()
  const alarm = await getWriteClient().fetch(
    `*[_type == "alarm" && date == $date][0]{_id, date, sourceHeadline, sourceNewspaper}`,
    {date},
  )
  if (!alarm) throw new Error(`Inget larm för ${date}`)
  const {generated, modelVersion, promptVersion} = await generateAlarm({
    text: alarm.sourceHeadline,
    newspaperName: alarm.sourceNewspaper,
  })
  const id = alarm._id.replace(/^drafts\./, '')
  await getWriteClient()
    .patch(id)
    .set({
      kicker: generated.kicker,
      headline: generated.headline,
      body: generated.body,
      expertVoice: generated.expertVoice,
      expertHeadline: generated.expertHeadline,
      expertText: generated.expertText,
      promptVersion,
      modelVersion,
    })
    .unset(['humorScore'])
    .commit()
  const drawn = await attachLeadImage({id, date, brief: generated.imageBrief})
  if (drawn.imageError) console.error(drawn.imageError)
  console.log(`Uppdaterat ${date}: ${generated.headline}`)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
