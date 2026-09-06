import {extractHeadlineFromHtml} from './headline'
import {resolveNewspaper, type ExtraPaper} from './papers'

export async function scrapeArticleHeadline(
  articleUrl: string,
): Promise<{headline: string; paper: ExtraPaper}> {
  const paper = resolveNewspaper(articleUrl)
  if (!paper) throw new Error('Ogiltig länk')
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)
  let html: string
  try {
    const response = await fetch(articleUrl, {
      signal: controller.signal,
      headers: {Accept: 'text/html', 'User-Agent': 'Kycklingbladet/1.0'},
      redirect: 'follow',
    })
    if (!response.ok) throw new Error('Kunde inte hämta artikeln')
    html = await response.text()
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Tidningen svarade inte')
    }
    throw error instanceof Error ? error : new Error('Kunde inte hämta artikeln')
  } finally {
    clearTimeout(timer)
  }
  const headline = extractHeadlineFromHtml(html, [paper.name, paper.slug])
  if (!headline) throw new Error('Hittade ingen rubrik')
  return {headline, paper}
}
