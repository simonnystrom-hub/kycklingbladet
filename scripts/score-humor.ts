import {scoreAlarmIfMissing, fetchUnscoredAlarms} from '../src/lib/sanity/score-published'

async function run() {
  const missing = await fetchUnscoredAlarms()
  if (missing.length === 0) {
    console.log('Alla nummer har humorpoäng.')
    return
  }
  console.log(`Bedömer ${missing.length} nummer.`)
  for (const alarm of missing) {
    const score = await scoreAlarmIfMissing(alarm._id)
    console.log(`${alarm.date}: ${score}`)
  }
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
