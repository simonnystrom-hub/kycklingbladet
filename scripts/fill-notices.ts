import {fetchAlarmsNeedingNotices, fillNoticesForDate} from '../src/lib/sanity/fill-notices'

async function run() {
  const missing = await fetchAlarmsNeedingNotices()
  if (missing.length === 0) {
    console.log('Alla nummer har två notiser.')
    return
  }
  console.log(`Fyller notiser för ${missing.length} nummer.`)
  for (const alarm of missing) {
    try {
      const result = await fillNoticesForDate(alarm.date)
      console.log(`${alarm.date}: ${result}`)
    } catch (error) {
      console.error(`${alarm.date}: misslyckades`, error)
    }
  }
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
