import {runXReply} from '../src/lib/x/reply/ingest'

runXReply()
  .then((result) => {
    console.log(
      `X-svar ingest=${result.ingested} posted=${result.posted} skipped=${result.skipped}`,
    )
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
