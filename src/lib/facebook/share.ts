export const FACEBOOK_GRAPH_VERSION = 'v21.0'
export const FACEBOOK_GRAPH_BASE = `https://graph.facebook.com/${FACEBOOK_GRAPH_VERSION}`

export type ShareToFacebookResult = 'shared' | 'skipped' | 'failed'

export type ShareToFacebookInput = {
  message: string
  articleUrl: string
  imageUrl?: string | null
}

type FacebookConfig = {
  pageId: string
  token: string
}

export function facebookConfig(): FacebookConfig | null {
  const pageId = process.env.FACEBOOK_PAGE_ID?.trim()
  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN?.trim()
  if (!pageId || !token) return null
  return {pageId, token}
}

function graphUrl(path: string): string {
  return `${FACEBOOK_GRAPH_BASE}${path}`
}

async function graphPost(
  path: string,
  fields: Record<string, string>,
  token: string,
): Promise<{ok: boolean; status: number; json: Record<string, unknown>}> {
  const response = await fetch(graphUrl(path), {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: new URLSearchParams({...fields, access_token: token}),
    signal: AbortSignal.timeout(20_000),
  })
  let json: Record<string, unknown> = {}
  try {
    const parsed: unknown = await response.json()
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      json = parsed as Record<string, unknown>
    }
  } catch {
    json = {}
  }
  return {ok: response.ok, status: response.status, json}
}

function postedObjectId(json: Record<string, unknown>): string | null {
  if (typeof json.post_id === 'string' && json.post_id.length > 0) return json.post_id
  if (typeof json.id === 'string' && json.id.length > 0) return json.id
  return null
}

function graphErrorText(json: Record<string, unknown>): string {
  const error = json.error
  if (error && typeof error === 'object' && !Array.isArray(error)) {
    const message = (error as {message?: unknown}).message
    if (typeof message === 'string' && message.length > 0) return message
  }
  return 'okänt fel'
}

export async function shareToFacebook(input: ShareToFacebookInput): Promise<ShareToFacebookResult> {
  const config = facebookConfig()
  if (!config) {
    console.error('Hoppar över Facebook: FACEBOOK_PAGE_ID eller FACEBOOK_PAGE_ACCESS_TOKEN saknas')
    return 'skipped'
  }

  const imageUrl = input.imageUrl?.trim()
  try {
    const created = imageUrl
      ? await graphPost(
          `/${config.pageId}/photos`,
          {url: imageUrl, caption: input.message},
          config.token,
        )
      : await graphPost(
          `/${config.pageId}/feed`,
          {message: input.message},
          config.token,
        )

    if (!created.ok) {
      console.error(`Kunde inte posta till Facebook (${created.status}): ${graphErrorText(created.json)}`)
      return 'failed'
    }

    const objectId = postedObjectId(created.json)
    if (!objectId) {
      console.error('Facebook svarade utan post-id')
      return 'failed'
    }

    const commented = await graphPost(
      `/${objectId}/comments`,
      {message: input.articleUrl},
      config.token,
    )
    if (!commented.ok) {
      console.error(`Kunde inte kommentera Facebook-inlägget (${commented.status}): ${graphErrorText(commented.json)}`)
    }
    return 'shared'
  } catch (error) {
    console.error('Kunde inte posta till Facebook', error)
    return 'failed'
  }
}
