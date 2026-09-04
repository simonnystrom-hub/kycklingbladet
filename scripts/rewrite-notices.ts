import {fetchAlarmsWithNotices, rewriteNoticesForDate} from '../src/lib/sanity/fill-notices'

async function run() {
  const alarms = await fetchAlarmsWithNotices()
  if (alarms.length === 0) {
    console.log('Inga notiser att skriva om.')
    return
  }
  console.log(`Skriver om notiser för ${alarms.length} nummer.`)
  for (const alarm of alarms) {
    try {
      const count = await rewriteNoticesForDate(alarm.date)
      console.log(`${alarm.date}: ${count} notiser`)
    } catch (error) {
      console.error(`${alarm.date}: misslyckades`, error)
    }
  }
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
