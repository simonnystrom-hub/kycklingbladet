import {sharePublishedLead} from '../src/lib/facebook/published'

const GAP_MS = 4000
const ids = process.argv.slice(2).map((id) => id.trim()).filter(Boolean)
if (ids.length === 0) {
  console.error('Ange minst ett larm-id, t.ex. alarm-2026-09-06')
  process.exit(1)
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  let failed = 0
  for (const [index, id] of ids.entries()) {
    const result = await sharePublishedLead(id)
    console.log(`Facebook ${id}: ${result}`)
    if (result !== 'shared') failed += 1
    if (index < ids.length - 1) await sleep(GAP_MS)
  }
  if (failed > 0) process.exitCode = 1
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
