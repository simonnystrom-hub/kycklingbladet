import {sharePublishedLead} from '../src/lib/facebook/published'

const ids = process.argv.slice(2).map((id) => id.trim()).filter(Boolean)
if (ids.length === 0) {
  console.error('Ange minst ett larm-id, t.ex. alarm-2026-09-06')
  process.exit(1)
}

async function main() {
  for (const id of ids) {
    console.log(`Facebook ${id}`)
    await sharePublishedLead(id)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
