# EXTRA EXTRA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** From Studio, paste a Swedish tabloid article URL, preview a hen-house flash, then publish one EXTRA EXTRA onto that day’s existing `alarm`.

**Architecture:** `extraExtra` is an optional object on `alarm`. Kycklingbladet owns scrape + Claude + Sanity patch behind `POST /api/extra-extra/{preview,publish}`. Studio only shows a dialog and calls that API. The public paper renders the flash between the lead and the notices; RSS may emit a second item for that date (`/arkiv/{date}#extra-extra`).

**Tech Stack:** Next.js App Router, Sanity Studio v3 document actions, Claude (`resolveModel`), Vitest, fetch + HTML meta parse (no new HTML parser dependency).

**Spec:** `docs/superpowers/specs/2026-09-05-extra-extra-design.md`

## Global Constraints

- Never scrape alarmindex.com. Never overwrite lead fields, notices, or lead source.
- At most one EXTRA EXTRA per `alarm`; publish replaces after Studio warned.
- Public stamp is exactly `EXTRA EXTRA`. No expert box. No humor score. Not a week-lead card.
- Source line links to the pasted article URL.
- Shared hen lexicon (`HEN_HUMOR`, `HEN_LEXICON`, `HEN_NAMES`) as they exist in `src/lib/generate/hen-lexicon.ts`.
- Two repos: `C:\Users\simon\projekt\kycklingbladet` (site + API) and `C:\Users\simon\projekt\kycklingbladet-studio` (schema + action).
- Env: `EXTRA_EXTRA_SECRET` (Next), `SANITY_STUDIO_EXTRA_EXTRA_SECRET` and `SANITY_STUDIO_SITE_URL` (Studio).

---

### Task 1: Newspaper allowlist

**Files:**
- Create: `src/lib/extra-extra/papers.ts`
- Test: `src/lib/extra-extra/papers.test.ts`

**Interfaces:**
- Consumes: none
- Produces: `export type ExtraPaper = { name: string; slug: string }`; `export function resolveNewspaper(articleUrl: string): ExtraPaper | null`

- [ ] **Step 1: Write the failing test**

```ts
import {describe, expect, it} from 'vitest'
import {resolveNewspaper} from './papers'

describe('resolveNewspaper', () => {
  it('maps known tabloid hosts', () => {
    expect(resolveNewspaper('https://www.expressen.se/nyheter/foo/')).toEqual({
      name: 'Expressen',
      slug: 'expressen',
    })
    expect(resolveNewspaper('https://aftonbladet.se/a/xyz')).toEqual({
      name: 'Aftonbladet',
      slug: 'aftonbladet',
    })
    expect(resolveNewspaper('https://www.sydsvenskan.se/2026-08-31/foo')).toEqual({
      name: 'Sydsvenskan',
      slug: 'sydsvenskan',
    })
    expect(resolveNewspaper('https://www.dn.se/sverige/foo/')).toEqual({name: 'DN', slug: 'dn'})
    expect(resolveNewspaper('https://www.svd.se/a/foo')).toEqual({name: 'SvD', slug: 'svd'})
  })

  it('rejects unknown hosts and bad URLs', () => {
    expect(resolveNewspaper('https://example.com/nyhet')).toBeNull()
    expect(resolveNewspaper('https://alarmindex.com/dag/2026-09-03/expressen')).toBeNull()
    expect(resolveNewspaper('not-a-url')).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/extra-extra/papers.test.ts`

Expected: FAIL, cannot find module `./papers`

- [ ] **Step 3: Write minimal implementation**

```ts
export type ExtraPaper = {name: string; slug: string}

const PAPERS: Record<string, ExtraPaper> = {
  'expressen.se': {name: 'Expressen', slug: 'expressen'},
  'aftonbladet.se': {name: 'Aftonbladet', slug: 'aftonbladet'},
  'sydsvenskan.se': {name: 'Sydsvenskan', slug: 'sydsvenskan'},
  'dn.se': {name: 'DN', slug: 'dn'},
  'svd.se': {name: 'SvD', slug: 'svd'},
}

export function resolveNewspaper(articleUrl: string): ExtraPaper | null {
  let host: string
  try {
    host = new URL(articleUrl).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return null
  }
  return PAPERS[host] ?? null
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/lib/extra-extra/papers.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/extra-extra/papers.ts src/lib/extra-extra/papers.test.ts
git commit -m "Allow only known tabloid hosts for EXTRA EXTRA."
```

---

### Task 2: Headline extract and clean

**Files:**
- Create: `src/lib/extra-extra/headline.ts`
- Test: `src/lib/extra-extra/headline.test.ts`

**Interfaces:**
- Consumes: none
- Produces: `export function cleanScrapedHeadline(raw: string): string`; `export function extractHeadlineFromHtml(html: string): string | null`

- [ ] **Step 1: Write the failing test**

```ts
import {describe, expect, it} from 'vitest'
import {cleanScrapedHeadline, extractHeadlineFromHtml} from './headline'

describe('cleanScrapedHeadline', () => {
  it('strips site-name suffixes', () => {
    expect(cleanScrapedHeadline('Får inte heta sylt | Expressen')).toBe('Får inte heta sylt')
    expect(cleanScrapedHeadline('Rubrik - Aftonbladet')).toBe('Rubrik')
  })
})

describe('extractHeadlineFromHtml', () => {
  it('prefers og:title over h1 and title', () => {
    const html = `<html><head>
      <meta property="og:title" content="Får inte heta sylt | Expressen">
      <title>Ignore me</title></head>
      <body><h1>Also ignore</h1></body></html>`
    expect(extractHeadlineFromHtml(html)).toBe('Får inte heta sylt')
  })

  it('falls back to h1 then title', () => {
    expect(extractHeadlineFromHtml('<html><body><h1>  H1-rad  </h1></body></html>')).toBe('H1-rad')
    expect(extractHeadlineFromHtml('<html><head><title>Titel | DN</title></head></html>')).toBe('Titel')
  })

  it('returns null when empty', () => {
    expect(extractHeadlineFromHtml('<html></html>')).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/extra-extra/headline.test.ts`

Expected: FAIL, module not found

- [ ] **Step 3: Write minimal implementation**

Decode `&amp;` `&quot;` `&#39;` `&lt;` `&gt;`. Match `property="og:title"` or `name="twitter:title"` with `content="..."`. Then first `<h1>...</h1>`, then `<title>`. `cleanScrapedHeadline`: split on ` | ` or ` - ` if the right part is a known paper name (Expressen, Aftonbladet, Sydsvenskan, DN, SvD, Dagens Nyheter, Svenska Dagbladet). Trim. Empty after clean → treat as missing in extract (return null).

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/lib/extra-extra/headline.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/extra-extra/headline.ts src/lib/extra-extra/headline.test.ts
git commit -m "Pull the tabloid headline from og:title, not the whole article."
```

---

### Task 3: Flash prompt and JSON validate

**Files:**
- Create: `src/lib/generate/extra-prompt.ts`
- Create: `src/lib/generate/extra.ts`
- Test: `src/lib/generate/extra-prompt.test.ts`
- Test: `src/lib/generate/extra.test.ts`

**Interfaces:**
- Consumes: `HEN_HUMOR`, `HEN_LEXICON`, `HEN_NAMES` from `hen-lexicon.ts`; `normalizeQuotes` from `quotes.ts`
- Produces: `export const EXTRA_PROMPT_VERSION = 'kb-extra-v1'`; `export const EXTRA_KICKER = 'EXTRA EXTRA'`; `export const EXTRA_WRITE_SYSTEM: string`; `export function buildExtraWriteUserPrompt(source: {text: string; newspaperName: string}): string`; `export type GeneratedExtra = {headline: string; body: string}`; `export function validateGeneratedExtra(input: unknown): GeneratedExtra | null`

- [ ] **Step 1: Write the failing prompt test**

```ts
import {describe, expect, it} from 'vitest'
import {EXTRA_WRITE_SYSTEM, EXTRA_PROMPT_VERSION, buildExtraWriteUserPrompt} from './extra-prompt'
import {HEN_LEXICON, HEN_HUMOR} from './hen-lexicon'

describe('EXTRA_WRITE_SYSTEM', () => {
  it('is a flash: EXTRA EXTRA stamp, shared lexicon, no expert box', () => {
    expect(EXTRA_PROMPT_VERSION).toBe('kb-extra-v1')
    expect(EXTRA_WRITE_SYSTEM).toContain(HEN_LEXICON)
    expect(EXTRA_WRITE_SYSTEM).toContain(HEN_HUMOR)
    expect(EXTRA_WRITE_SYSTEM).toContain('EXTRA EXTRA')
    expect(EXTRA_WRITE_SYSTEM).toContain('två till tre korta stycken')
    expect(EXTRA_WRITE_SYSTEM).toContain('Ingen expertruta')
    expect(EXTRA_WRITE_SYSTEM).toContain('Byt ut saken, inte bara människorna')
    expect(EXTRA_WRITE_SYSTEM).not.toContain('Överhönan — analys')
  })
})

describe('buildExtraWriteUserPrompt', () => {
  it('includes newspaper and source headline', () => {
    expect(buildExtraWriteUserPrompt({text: 'Får inte heta sylt', newspaperName: 'Sydsvenskan'})).toBe(
      `Tidning: Sydsvenskan
Rubrik: "Får inte heta sylt"`,
    )
  })
})
```

If `HEN_HUMOR` on the branch does not yet contain `Byt ut saken, inte bara människorna`, use `expect(EXTRA_WRITE_SYSTEM).toContain(HEN_HUMOR)` only — do not invent lexicon copy. Prefer shipping that humor line in `hen-lexicon.ts` in this same task if it is still uncommitted, because the spec requires it.

- [ ] **Step 2: Write the failing validate test**

```ts
import {describe, expect, it} from 'vitest'
import {validateGeneratedExtra} from './extra'

describe('validateGeneratedExtra', () => {
  it('requires headline and body', () => {
    expect(validateGeneratedExtra({headline: 'Luckan', body: 'Kacklet tystnade.'})).toEqual({
      headline: 'Luckan',
      body: 'Kacklet tystnade.',
    })
    expect(validateGeneratedExtra({headline: '', body: 'x'})).toBeNull()
    expect(validateGeneratedExtra({headline: 'Luckan', body: 'Hon sa «nu».'})).toEqual({
      headline: 'Luckan',
      body: 'Hon sa "nu".',
    })
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run src/lib/generate/extra-prompt.test.ts src/lib/generate/extra.test.ts`

Expected: FAIL, modules not found

- [ ] **Step 4: Implement prompt + validate**

`extra-prompt.ts`: system prompt modeled on `NOTICE_WRITE_SYSTEM` but: “en EXTRA EXTRA-flash, inte notis, inte huvudnyhet”; kicker in the JSON may be omitted — user prompt still only newspaper + headline; body “två till tre korta stycken”; “Ingen expertruta”; interpolate `HEN_*`. JSON: `{ "headline", "body" }` only.

`extra.ts`: copy `validateGeneratedNotice` logic (trim + `normalizeQuotes`).

- [ ] **Step 5: Run tests**

Run: `npx vitest run src/lib/generate/extra-prompt.test.ts src/lib/generate/extra.test.ts`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/generate/extra-prompt.ts src/lib/generate/extra.ts src/lib/generate/extra-prompt.test.ts src/lib/generate/extra.test.ts src/lib/generate/hen-lexicon.ts src/lib/generate/prompt.ts src/lib/generate/prompt.test.ts src/lib/generate/notice-prompt.test.ts
git commit -m "Write EXTRA EXTRA as a hen-house flash, not a lead or a notice."
```

(Only add hen-lexicon/prompt files if this task actually changes them.)

---

### Task 4: Claude generate + scrape fetch

**Files:**
- Create: `src/lib/generate/claude-extra.ts`
- Create: `src/lib/extra-extra/scrape.ts`
- Test: `src/lib/extra-extra/scrape.test.ts` (HTML path only; mock `fetch`)

**Interfaces:**
- Consumes: `EXTRA_WRITE_SYSTEM`, `buildExtraWriteUserPrompt`, `EXTRA_PROMPT_VERSION`, `validateGeneratedExtra`, `parseGeneratedAlarm`, `resolveModel`, `extractHeadlineFromHtml`, `resolveNewspaper`
- Produces: `export async function generateExtra(source: {text: string; newspaperName: string}): Promise<{generated: GeneratedExtra; modelVersion: string; promptVersion: string}>`; `export async function scrapeArticleHeadline(articleUrl: string): Promise<{headline: string; paper: ExtraPaper}>`

- [ ] **Step 1: Write generateExtra** like `generateNotice` in `claude-notices.ts`: `max_tokens` 700, temperature 0.9, retry once on parse failure, throw Swedish `Claude-svaret saknade EXTRA EXTRA-rubrik eller brödtext`. Return `promptVersion: EXTRA_PROMPT_VERSION`.

- [ ] **Step 2: Write scrapeArticleHeadline**

```ts
export async function scrapeArticleHeadline(articleUrl: string): Promise<{headline: string; paper: ExtraPaper}> {
  const paper = resolveNewspaper(articleUrl)
  if (!paper) throw new Error('Okänd tidning')
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
    if (error instanceof Error && error.name === 'AbortError') throw new Error('Tidningen svarade inte')
    throw error instanceof Error ? error : new Error('Kunde inte hämta artikeln')
  } finally {
    clearTimeout(timer)
  }
  const headline = extractHeadlineFromHtml(html)
  if (!headline) throw new Error('Hittade ingen rubrik')
  return {headline, paper}
}
```

- [ ] **Step 3: Test scrape with mocked fetch**

```ts
import {afterEach, describe, expect, it, vi} from 'vitest'
import {scrapeArticleHeadline} from './scrape'

afterEach(() => vi.unstubAllGlobals())

describe('scrapeArticleHeadline', () => {
  it('returns cleaned og:title for a known host', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response('<meta property="og:title" content="Syltstoppet | Expressen">', {status: 200}),
      ),
    )
    await expect(scrapeArticleHeadline('https://www.expressen.se/nyheter/x/')).resolves.toEqual({
      headline: 'Syltstoppet',
      paper: {name: 'Expressen', slug: 'expressen'},
    })
  })

  it('rejects unknown hosts without fetching', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    await expect(scrapeArticleHeadline('https://example.com/x')).rejects.toThrow('Okänd tidning')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/lib/extra-extra/scrape.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/generate/claude-extra.ts src/lib/extra-extra/scrape.ts src/lib/extra-extra/scrape.test.ts
git commit -m "Scrape the tabloid headline and write the EXTRA EXTRA flash."
```

---

### Task 5: Preview and publish API

**Files:**
- Create: `src/lib/extra-extra/auth.ts`
- Create: `src/lib/extra-extra/payload.ts`
- Create: `src/app/api/extra-extra/preview/route.ts`
- Create: `src/app/api/extra-extra/publish/route.ts`
- Test: `src/lib/extra-extra/auth.test.ts`
- Test: `src/lib/extra-extra/payload.test.ts`
- Modify: `.env.example` — add `EXTRA_EXTRA_SECRET=`

**Interfaces:**
- Consumes: `scrapeArticleHeadline`, `generateExtra`, `EXTRA_KICKER`, `getWriteClient`
- Produces: HTTP JSON as below; `export type ExtraExtraPreview = { kicker: string; headline: string; body: string; sourceUrl: string; sourceHeadline: string; sourceNewspaper: string; sourceNewspaperSlug: string; promptVersion: string; modelVersion: string }`; `export function extraExtraSecretOk(request: Request): boolean`; `export function parseExtraPreview(input: unknown): ExtraExtraPreview | null`; CORS helper used by both routes

Preview 200 body: `{ preview: ExtraExtraPreview }`  
Publish 200 body: `{ ok: true }`  
Errors: `{ error: string }` with Swedish messages already thrown (`Okänd tidning`, `Hittade ingen rubrik`, …).

- [ ] **Step 1: Auth + payload tests**

`extraExtraSecretOk`: compare `request.headers.get('x-extra-extra-secret')` to `process.env.EXTRA_EXTRA_SECRET` with a fixed-time check (`crypto.timingSafeEqual` on equal-length buffers; false if either missing).

`parseExtraPreview`: require all string fields listed above; `kicker` must equal `EXTRA EXTRA`; `sourceUrl` must be `https:` URL; reject extra-type junk.

- [ ] **Step 2: Implement routes**

Shared:

```ts
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-extra-extra-secret',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}
```

`OPTIONS` → 204 + cors. `POST` without secret → 401 `{error: 'Ej behörig'}`.

**preview:** JSON `{ alarmId: string, url: string }`. Fetch alarm `*[_id in [$id, $draftId]][0]{_id, date}`. Missing → 404 `{error: 'Inget larm'}`. Then scrape + generate. Catch errors → 400 with `error.message`. Do not patch Sanity.

**publish:** JSON `{ alarmId: string, preview: ExtraExtraPreview }`. Validate with `parseExtraPreview`. Load alarm. Patch:

```ts
.set({
  extraExtra: {
    kicker: EXTRA_KICKER,
    headline: preview.headline,
    body: preview.body,
    sourceUrl: preview.sourceUrl,
    sourceHeadline: preview.sourceHeadline,
    sourceNewspaper: preview.sourceNewspaper,
    sourceNewspaperSlug: preview.sourceNewspaperSlug,
    promptVersion: preview.promptVersion,
    modelVersion: preview.modelVersion,
    createdAt: new Date().toISOString(),
  },
})
```

Never `.set` lead/notice fields. Use published id (`replace(/^drafts\./, '')`).

- [ ] **Step 3: Run unit tests**

Run: `npx vitest run src/lib/extra-extra/auth.test.ts src/lib/extra-extra/payload.test.ts`

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/lib/extra-extra/auth.ts src/lib/extra-extra/payload.ts src/lib/extra-extra/auth.test.ts src/lib/extra-extra/payload.test.ts src/app/api/extra-extra/preview/route.ts src/app/api/extra-extra/publish/route.ts .env.example
git commit -m "Let Studio preview and publish EXTRA EXTRA without touching the lead."
```

---

### Task 6: Sanity types, query, studio schema

**Files:**
- Modify: `src/lib/sanity/types.ts`
- Modify: `src/lib/sanity/queries.ts` (`alarmFields` include `extraExtra{...}`)
- Create: `src/lib/extra-extra/has-extra.ts`
- Test: `src/lib/extra-extra/has-extra.test.ts`
- Modify: `C:\Users\simon\projekt\kycklingbladet-studio\schemaTypes\alarm.ts`

**Interfaces:**
- Produces: `export type AlarmExtra = { kicker: string; headline: string; body: string; sourceUrl: string; sourceHeadline: string; sourceNewspaper: string; sourceNewspaperSlug: string; promptVersion: string; modelVersion: string; createdAt: string }`; `Alarm.extraExtra?: AlarmExtra | null`; `export function hasExtraExtra(alarm: {extraExtra?: AlarmExtra | null}): alarm is {extraExtra: AlarmExtra}`

- [ ] **Step 1: `hasExtraExtra` test** — true only when `headline` and `body` are non-empty strings.

- [ ] **Step 2: Types + GROQ** — add `extraExtra{ kicker, headline, body, sourceUrl, sourceHeadline, sourceNewspaper, sourceNewspaperSlug, promptVersion, modelVersion, createdAt }` inside `alarmFields`.

- [ ] **Step 3: Studio schema** — optional object `extraExtra` on `alarm` (not required). Fields as the table in the spec. `kicker` readOnly, initial `EXTRA EXTRA`. `sourceUrl` type `url`. Deploy: from studio repo `npx sanity schema deploy` (or `sanity deploy` if that is how this project ships schema). Do not add the document action yet.

- [ ] **Step 4: Commit both repos**

Site:

```bash
git add src/lib/sanity/types.ts src/lib/sanity/queries.ts src/lib/extra-extra/has-extra.ts src/lib/extra-extra/has-extra.test.ts
git commit -m "Store one EXTRA EXTRA on the day's alarm."
```

Studio:

```bash
git add schemaTypes/alarm.ts
git commit -m "Add EXTRA EXTRA fields on the alarm document."
```

---

### Task 7: Public flash UI

**Files:**
- Create: `src/components/IssueExtra.tsx`
- Modify: `src/app/page.tsx` — after `AlarmArticle`, before `IssueNotices`
- Modify: `src/app/arkiv/[date]/page.tsx` — same order
- Test: none required beyond TypeScript; verify in the browser (home + `/arkiv/{a date with extra}` and a date without)

**Interfaces:**
- Consumes: `AlarmExtra`, `hasExtraExtra`, `formatSwedishDateShort`

- [ ] **Step 1: `IssueExtra`**

```tsx
export function IssueExtra({extra, date}: {extra?: AlarmExtra | null; date: string}) {
  if (!hasExtraExtra({extraExtra: extra})) return null
  const paragraphs = extra.body.split('\n\n').filter(Boolean)
  return (
    <section className="mt-10 border-t border-[var(--rule)] pt-8 lg:mt-14 lg:pt-10" id="extra-extra">
      <p className="text-[var(--brass)]" style={{fontSize: 12, letterSpacing: '0.22em', fontVariant: 'small-caps'}}>
        {extra.kicker}
      </p>
      <h2 className="mt-3 font-serif text-[1.35rem] leading-snug text-[var(--ink)] sm:text-[1.5rem] lg:text-[1.7rem]">
        {extra.headline}
      </h2>
      {paragraphs.map((paragraph) => (
        <p key={paragraph.slice(0, 24)} className="mt-3 leading-[1.7] text-[var(--ink-muted)]">
          {paragraph}
        </p>
      ))}
      <p className="mt-3 text-xs leading-relaxed text-[var(--ink-muted)] lg:text-sm">
        <span className="block">
          Ursprungligen {extra.sourceNewspaper}, {formatSwedishDateShort(date)}
        </span>
        {'"'}
        <a href={extra.sourceUrl} rel="noreferrer" target="_blank" className="text-[var(--brass)] underline decoration-[var(--brass)]/40 underline-offset-2 hover:text-[var(--ink)]">
          {extra.sourceHeadline}
        </a>
        {'"'}
      </p>
    </section>
  )
}
```

Use a stable `key` (index is fine). Stamp must read more shouty than Notices (`letterSpacing: '0.22em'`, fontSize 12 vs notices 11).

- [ ] **Step 2: Insert** `<IssueExtra extra={alarm.extraExtra} date={alarm.date} />` on home (inside the alarm branch) and archive date page, between lead and notices.

- [ ] **Step 3: Browser** — empty extra: layout unchanged. With a manually patched Sanity object: flash between lead and notices, source opens the article URL.

- [ ] **Step 4: Commit**

```bash
git add src/components/IssueExtra.tsx src/app/page.tsx src/app/arkiv/[date]/page.tsx
git commit -m "Show EXTRA EXTRA between the lead and the notices."
```

---

### Task 8: RSS second item

**Files:**
- Modify: `src/lib/rss.ts` — add `guid` optional on `RssItem`; `rssItemsFromAlarms`
- Modify: `src/app/rss.xml/route.ts` — map via `rssItemsFromAlarms` then existing `buildRss`
- Test: `src/lib/rss.test.ts`

**Interfaces:**
- Consumes: `Alarm`, `hasExtraExtra`
- Produces: `export function rssItemsFromAlarms(alarms: Alarm[]): RssItem[]`

- [ ] **Step 1: Failing test** — one alarm with extra → two items; lead link `/arkiv/2026-09-03`; extra guid/link `/arkiv/2026-09-03#extra-extra`; extra title is the flash headline; extra description is flash body (kicker EXTRA EXTRA included via existing `itemDescription`). Alarm without extra → one item. Then slice is **not** applied here; `getAlarmsForFeed` still limits dates to `RSS_ITEM_LIMIT`.

Extend `RssItem` with optional `pathSuffix?: string` default `''` so link becomes `${siteUrl}/arkiv/${date}${pathSuffix}`.

- [ ] **Step 2: Implement `rssItemsFromAlarms`**

For each alarm in date-desc order: push lead `{date, kicker, headline, body}`; if `hasExtraExtra(alarm)` push `{date, kicker: extra.kicker, headline: extra.headline, body: extra.body, pathSuffix: '#extra-extra'}`.

- [ ] **Step 3: Run `npx vitest run src/lib/rss.test.ts`** — PASS

- [ ] **Step 4: Commit**

```bash
git add src/lib/rss.ts src/lib/rss.test.ts src/app/rss.xml/route.ts
git commit -m "Put EXTRA EXTRA in the existing RSS feed, not a second feed."
```

---

### Task 9: Studio document action

**Files:**
- Create: `C:\Users\simon\projekt\kycklingbladet-studio\actions\ExtraExtraAction.tsx`
- Modify: `C:\Users\simon\projekt\kycklingbladet-studio\sanity.config.ts` — append action for `schemaType === 'alarm'`
- Modify: Studio `.env.example` if present, else document in a comment at top of the action: `SANITY_STUDIO_SITE_URL`, `SANITY_STUDIO_EXTRA_EXTRA_SECRET`

**Interfaces:**
- Consumes: preview/publish JSON from Task 5
- Produces: document action label `Skapa EXTRA EXTRA`

- [ ] **Step 1: Action** (`useState` for open, url, preview, error, busy)

Disabled when `!props.published && !props.draft` or missing `_id`. `onHandle` opens dialog.

Dialog body: URL input; if `published.extraExtra || draft.extraExtra`, show “En ny publicering ersätter den nuvarande EXTRA EXTRA.” Buttons: Förhandsgranska, Publicera (disabled until preview object present).

```ts
const site = (process.env.SANITY_STUDIO_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
const secret = process.env.SANITY_STUDIO_EXTRA_EXTRA_SECRET || ''

async function post(path: '/api/extra-extra/preview' | '/api/extra-extra/publish', body: unknown) {
  const response = await fetch(`${site}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-extra-extra-secret': secret,
    },
    body: JSON.stringify(body),
  })
  const json = (await response.json()) as {error?: string; preview?: unknown}
  if (!response.ok) throw new Error(json.error || 'Något gick fel')
  return json
}
```

Preview: `post('/api/extra-extra/preview', {alarmId: id.replace(/^drafts\./, ''), url})`. Show headline + body in the dialog.  
Publish: `post('/api/extra-extra/publish', {alarmId, preview})` then `props.onComplete()`.

- [ ] **Step 2: Register in `sanity.config.ts`**

```ts
import {ExtraExtraAction} from './actions/ExtraExtraAction'

document: {
  actions: (prev, context) => {
    if (context.schemaType === 'alarm') {
      return [...prev, ExtraExtraAction]
    }
    // keep existing siteSettings filter
```

Preserve the current `siteSettings` delete/duplicate filter.

- [ ] **Step 3: Manual test** — Studio on an existing alarm, paste `https://www.expressen.se/...`, preview, publish. Site `/arkiv/{date}` shows the flash. Paste again: warning, replace works. Paste `https://example.com`: dialog error, no patch.

- [ ] **Step 4: Commit studio**

```bash
git add actions/ExtraExtraAction.tsx sanity.config.ts
git commit -m "Add a Studio action that pastes a tabloid URL and publishes EXTRA EXTRA."
```

Deploy schema if Task 6 did not: `npx sanity schema deploy`. Set Vercel `EXTRA_EXTRA_SECRET` and Studio env to the same value. Set `SANITY_STUDIO_SITE_URL` to the live site (or localhost when developing).

---

## Spec coverage

| Spec | Task |
|------|------|
| Object on `alarm`, one per issue, replace | 6, 5, 9 |
| Studio paste → preview → publish | 5, 9 |
| Tabloid allowlist, not Alarmindex | 1, 4 |
| Headline-only scrape | 2, 4 |
| Flash prompt, no expert | 3, 4 |
| API secret, timeout, Swedish errors | 4, 5 |
| UI between lead and notices, archive | 7 |
| Source line → article URL | 7 |
| RSS second item, same feed | 8 |
| Daily job / lead / notices untouched | 5 patch set is `extraExtra` only |
| Tests: hosts, cleaner, prompt, hasExtra, RSS | 1, 2, 3, 6, 8 |

No live newspaper e2e in CI.
