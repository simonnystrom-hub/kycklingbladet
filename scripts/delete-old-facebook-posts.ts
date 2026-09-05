import {FACEBOOK_LINK_HINT} from '../src/lib/facebook/message'
import {facebookItalic} from '../src/lib/facebook/style-text'
import {
  deleteFacebookPostsContaining,
  facebookConfig,
  listFacebookFeed,
  probeFacebookPage,
} from '../src/lib/facebook/share'

const NEEDLES = [FACEBOOK_LINK_HINT, 'I bilden:', facebookItalic('I bilden:')]

function snippet(text: string): string {
  return text.replace(/\s+/g, ' ').slice(0, 80)
}

async function main() {
  if (!facebookConfig()) {
    throw new Error('FACEBOOK_PAGE_ID eller FACEBOOK_PAGE_ACCESS_TOKEN saknas')
  }
  if (!(await probeFacebookPage())) {
    throw new Error('Facebook-tokenet går inte att använda.')
  }

  const feed = await listFacebookFeed()
  console.log(`Facebook-sida: ${feed.length} inlägg`)
  for (const item of feed) {
    const hit = NEEDLES.some((needle) => item.text.includes(needle))
    console.log(`${hit ? 'radera' : 'behåll '} ${snippet(item.text) || '(tomt)'}`)
  }

  if (process.env.FACEBOOK_DRY_RUN === '1') {
    console.log('Dry run — inget raderat')
    return
  }

  const deleted = await deleteFacebookPostsContaining(NEEDLES)
  console.log(`Klart. raderade=${deleted}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
