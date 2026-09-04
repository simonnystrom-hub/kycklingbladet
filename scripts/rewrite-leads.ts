import {rewriteLead, fetchLeadsToRewrite} from '../src/lib/sanity/rewrite-leads'
import {scoreAlarmIfMissing} from '../src/lib/sanity/score-published'

async function run() {
  const alarms = await fetchLeadsToRewrite()
  if (alarms.length === 0) {
    console.log('Inga huvudnyheter att skriva om.')
    return
  }

  console.log(`Skriver om ${alarms.length} huvudnyheter.`)
  for (const alarm of alarms) {
    try {
      const headline = await rewriteLead(alarm)
      console.log(`${alarm.date}: ${headline}`)
    } catch (error) {
      console.error(`${alarm.date}: misslyckades`, error)
    }
  }

  console.log('Sätter ny humorpoäng.')
  for (const alarm of alarms) {
    try {
      const score = await scoreAlarmIfMissing(alarm._id.replace(/^drafts\./, ''))
      console.log(`${alarm.date}: humor ${score}`)
    } catch (error) {
      console.error(`${alarm.date}: humor misslyckades`, error)
    }
  }
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
