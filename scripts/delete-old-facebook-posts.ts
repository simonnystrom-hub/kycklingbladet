import {FACEBOOK_LINK_HINT} from '../src/lib/facebook/message'
import {deleteFacebookPostsContaining, facebookConfig, probeFacebookPage} from '../src/lib/facebook/share'

async function main() {
  if (!facebookConfig()) {
    throw new Error('FACEBOOK_PAGE_ID eller FACEBOOK_PAGE_ACCESS_TOKEN saknas')
  }
  if (!(await probeFacebookPage())) {
    throw new Error('Facebook-tokenet går inte att använda.')
  }
  const deleted = await deleteFacebookPostsContaining(FACEBOOK_LINK_HINT)
  console.log(`Klart. raderade=${deleted}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
