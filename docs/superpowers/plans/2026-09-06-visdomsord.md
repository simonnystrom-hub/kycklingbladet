# Daily hen wisdom (visdomsord) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Studio-curated pool of hen wisdom quotes with optional cartoons; each morning at 07:00 Stockholm post one unused quote that has an image to Facebook.

**Architecture:** Pure helpers for duplicate keys, captions, and queue pick. Next APIs (same Extra Extra secret) generate/rewrite/draw into Sanity `visdomsord` documents. Studio queue UI calls those APIs. A separate GitHub Actions cron shares a photo caption and then sets `usedDate`. The public site is unchanged.

**Tech Stack:** Next.js 16, Vitest, Anthropic Claude, Gemini (`attachLeadImage` / `EXTRA_IMAGE_STYLE`), Sanity write client, Facebook Graph v21 `fetch`, Sanity Studio custom structure.

**Spec:** `docs/superpowers/specs/2026-09-06-visdomsord-design.md`

## Global Constraints

- Facebook only — do not add visdomsord to `src/app/page.tsx`, archive, RSS, or layout
- HolyParadox is prompt flavour only; no HolyParadox Sanity client
- Duplicate quotes: normalize (trim, lowercase, collapse whitespace, strip wrapping quotes and trailing `!?.`)
- Hen names may repeat
- Draw only from Studio; 07:00 job never calls Gemini or Claude
- Set `usedDate` only after Facebook returns `'shared'`
- Caption has no URL comment and no `Se länk i kommentar`
- Reuse `x-extra-extra-secret` / `extraExtraSecretOk` / `corsHeaders`
- Never log API tokens
- Canonical host remains `https://www.kycklingbladet.com` (unused for this feature)
- Studio lives in `C:\Users\simon\projekt\kycklingbladet-studio`

## Files

- Create: `src/lib/visdomsord/normalize.ts`, `normalize.test.ts`, `message.ts`, `message.test.ts`, `parse.ts`, `parse.test.ts`, `prompt.ts`, `generate.ts`, `generate.test.ts`, `queue.ts`, `queue.test.ts`, `persist.ts`
- Create: `src/app/api/visdomsord/generate/route.ts`, `generate/route.test.ts`, `rewrite/route.ts`, `rewrite/route.test.ts`, `draw/route.ts`, `draw/route.test.ts`
- Create: `scripts/run-visdomsord.ts`, `.github/workflows/visdomsord.yml`
- Modify: `src/lib/facebook/share.ts`, `src/lib/facebook/share.test.ts`
- Modify: `README.md`
- Create (studio): `schemaTypes/visdomsord.ts`, `actions/VisdomsordQueue.tsx`
- Modify (studio): `schemaTypes/index.ts`, `structure/index.ts`

---

### Task 1: Quote duplicate key

**Files:**
- Create: `src/lib/visdomsord/normalize.ts`
- Test: `src/lib/visdomsord/normalize.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `export function normalizeQuoteKey(quote: string): string`

- [ ] **Step 1: Write the failing test**

```ts
import {describe, expect, it} from 'vitest'
import {normalizeQuoteKey} from './normalize'

describe('normalizeQuoteKey', () => {
  it('treats wrapping quotes, extra spaces, case and trailing punctuation as the same', () => {
    expect(normalizeQuoteKey('  "Sitt inte med ryggen mot luckan!" ')).toBe(
      normalizeQuoteKey('sitt inte med ryggen mot luckan'),
    )
  })

  it('keeps genuinely different quotes apart', () => {
    expect(normalizeQuoteKey('Sitt inte med ryggen mot luckan')).not.toBe(
      normalizeQuoteKey('Hacka inte grannens fodertråg'),
    )
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/visdomsord/normalize.test.ts`

Expected: FAIL (module not found)

- [ ] **Step 3: Write minimal implementation**

```ts
export function normalizeQuoteKey(quote: string): string {
  let text = quote.trim().toLocaleLowerCase('sv')
  text = text.replace(/^[«»""]+/, '').replace(/[«»""]+$/, '')
  text = text.replace(/[!?.]+$/g, '')
  return text.replace(/\s+/g, ' ').trim()
}
```

Strip both ASCII `"` and typographic `“”` plus `«»`. Do not stem words. Do not compare hen names.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/visdomsord/normalize.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/visdomsord/normalize.ts src/lib/visdomsord/normalize.test.ts
git commit -m "Add visdomsord quote duplicate keys."
```

---

### Task 2: Facebook caption

**Files:**
- Create: `src/lib/visdomsord/message.ts`
- Test: `src/lib/visdomsord/message.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `export function facebookWisdomMessage(input: {quote: string; henName: string}): string`

- [ ] **Step 1: Write the failing test**

```ts
import {describe, expect, it} from 'vitest'
import {facebookWisdomMessage} from './message'

describe('facebookWisdomMessage', () => {
  it('wraps a bare quote and puts KUCKELIKUUUU, quote and hen name on separate blocks', () => {
    expect(facebookWisdomMessage({quote: 'Sitt inte med ryggen mot luckan.', henName: 'Gerda Stålklöv'})).toBe(
      ['KUCKELIKUUUU!', '"Sitt inte med ryggen mot luckan."', 'Gerda Stålklöv'].join('\n\n'),
    )
  })

  it('does not double-wrap quotes that already have wrapping marks', () => {
    expect(facebookWisdomMessage({quote: '"Hacka i lagom takt."', henName: 'Bengt Fjäderson'})).toContain(
      '"Hacka i lagom takt."',
    )
    expect(facebookWisdomMessage({quote: '"Hacka i lagom takt."', henName: 'Bengt Fjäderson'})).not.toContain(
      '""Hacka',
    )
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/visdomsord/message.test.ts`

Expected: FAIL (module not found)

- [ ] **Step 3: Write minimal implementation**

If `quote` trimmed starts and ends with `"` or `“`/`”`, use that trimmed string as the quoted line. Otherwise wrap with ASCII `"..."`. Join with `\n\n`: `KUCKELIKUUUU!`, quoted line, trimmed `henName`. Do not add `Se länk i kommentar`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/visdomsord/message.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/visdomsord/message.ts src/lib/visdomsord/message.test.ts
git commit -m "Build the Facebook caption for hen wisdom quotes."
```

---

### Task 3: Optional Facebook comment

**Files:**
- Modify: `src/lib/facebook/share.ts` (`ShareToFacebookInput.articleUrl` becomes optional)
- Modify: `src/lib/facebook/share.test.ts`

**Interfaces:**
- Consumes: existing `shareToFacebook`
- Produces: `ShareToFacebookInput = {message: string; articleUrl?: string | null; imageUrl?: string | null}`. Comment only when `articleUrl` is a non-empty string. Larm/Extra Extra callers keep passing `articleUrl` and still comment.

- [ ] **Step 1: Write the failing test**

Add to `share.test.ts`:

```ts
it('posts a photo without a URL comment when articleUrl is missing', async () => {
  vi.stubEnv('FACEBOOK_PAGE_ID', 'page-1')
  vi.stubEnv('FACEBOOK_PAGE_ACCESS_TOKEN', 'token-1')
  const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse(200, {id: 'photo-9', post_id: 'page-1_photo-9'}))
  vi.stubGlobal('fetch', fetchMock)

  await expect(
    shareToFacebook({message: 'KUCKELIKUUUU!', imageUrl: 'https://cdn.sanity.io/x.jpg'}),
  ).resolves.toBe('shared')

  expect(fetchMock).toHaveBeenCalledTimes(1)
  expect(fetchMock.mock.calls[0][0]).toBe(`${FACEBOOK_GRAPH_BASE}/page-1/photos`)
})
```

Keep the existing “posts a photo then comments” test unchanged so larm still comments.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/facebook/share.test.ts`

Expected: FAIL (second Graph call still happens, or type requires articleUrl)

- [ ] **Step 3: Write minimal implementation**

In `shareToFacebook`, after a successful photo create, if `input.articleUrl?.trim()` is empty, return `'shared'` without `/{id}/comments`. Otherwise keep the current comment call.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/facebook/share.test.ts`

Expected: PASS (all existing tests plus the new one)

- [ ] **Step 5: Commit**

```bash
git add src/lib/facebook/share.ts src/lib/facebook/share.test.ts
git commit -m "Skip the Facebook URL comment when there is no article."
```

---

### Task 4: Queue pick helpers

**Files:**
- Create: `src/lib/visdomsord/queue.ts`
- Test: `src/lib/visdomsord/queue.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:

```ts
export type VisdomsordRow = {
  _id: string
  quote: string
  henName: string
  usedDate?: string | null
  imageUrl?: string | null
  _createdAt: string
}

export function alreadyPostedOn(rows: VisdomsordRow[], date: string): boolean
export function pickNextUnusedWithImage(rows: VisdomsordRow[]): VisdomsordRow | null
```

- [ ] **Step 1: Write the failing test**

```ts
import {describe, expect, it} from 'vitest'
import {alreadyPostedOn, pickNextUnusedWithImage, type VisdomsordRow} from './queue'

function row(partial: Partial<VisdomsordRow> & Pick<VisdomsordRow, '_id'>): VisdomsordRow {
  return {
    quote: 'q',
    henName: 'Gerda',
    _createdAt: '2026-09-01T00:00:00Z',
    ...partial,
  }
}

describe('alreadyPostedOn', () => {
  it('is true when any row has usedDate equal to today', () => {
    expect(
      alreadyPostedOn(
        [row({_id: 'a', usedDate: '2026-09-06'})],
        '2026-09-06',
      ),
    ).toBe(true)
  })
})

describe('pickNextUnusedWithImage', () => {
  it('returns the oldest unused row that has an image', () => {
    const picked = pickNextUnusedWithImage([
      row({_id: 'new', imageUrl: 'https://cdn.sanity.io/b.jpg', _createdAt: '2026-09-03T00:00:00Z'}),
      row({_id: 'old', imageUrl: 'https://cdn.sanity.io/a.jpg', _createdAt: '2026-09-01T00:00:00Z'}),
      row({_id: 'used', usedDate: '2026-09-05', imageUrl: 'https://cdn.sanity.io/c.jpg', _createdAt: '2026-08-01T00:00:00Z'}),
      row({_id: 'no-img', _createdAt: '2026-08-01T00:00:00Z'}),
    ])
    expect(picked?._id).toBe('old')
  })

  it('returns null when nothing unused has an image', () => {
    expect(pickNextUnusedWithImage([row({_id: 'x'})])).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/visdomsord/queue.test.ts`

Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

`alreadyPostedOn`: `rows.some((row) => row.usedDate === date)`.

`pickNextUnusedWithImage`: filter `!usedDate?.trim()` and `Boolean(imageUrl?.trim())`, sort `_createdAt` ascending, return first or null.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/visdomsord/queue.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/visdomsord/queue.ts src/lib/visdomsord/queue.test.ts
git commit -m "Pick the oldest unused visdomsord that has a cartoon."
```

---

### Task 5: Generate quotes (Claude + persist)

**Files:**
- Create: `src/lib/visdomsord/parse.ts`, `parse.test.ts`, `prompt.ts`, `generate.ts`, `generate.test.ts`, `persist.ts`
- Create: `src/app/api/visdomsord/generate/route.ts`, `generate/route.test.ts`

**Interfaces:**
- Consumes: `normalizeQuoteKey`, `resolveModel` from `@/lib/generate/claude`, `HEN_LEXICON` / `HEN_NAMES` / `HEN_HUMOR` from `@/lib/generate/hen-lexicon`, `getWriteClient`
- Produces:

```ts
export type VisdomsordDraft = {quote: string; henName: string}
export function parseVisdomsordDrafts(text: string): VisdomsordDraft[]
export function takeFreshDrafts(drafts: VisdomsordDraft[], existingKeys: Set<string>): VisdomsordDraft[]
export async function generateVisdomsordDrafts(input: {
  count: number
  existingQuotes: string[]
}): Promise<VisdomsordDraft[]>
export async function createVisdomsord(drafts: VisdomsordDraft[]): Promise<number>
```

Generate in batches of at most 25 per Claude call until `count` (default 100) or a batch returns nothing. Pass already-accepted quotes (existing + this run) in the user prompt as a “do not repeat” list (keys only, not full dump if huge — last 200 keys is enough plus this-run keys).

- [ ] **Step 1: Write parse + takeFreshDrafts tests**

`parse.ts`: extract JSON array (fenced or first `[`…`]`). Each item needs non-empty `quote` and `henName` strings. Invalid JSON → `[]`.

`takeFreshDrafts`: drop empty, drop `normalizeQuoteKey` already in `existingKeys`, drop duplicates inside the batch (keep first).

Include a test that `"Sitt inte!"` is dropped when existing is `"sitt inte"`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/visdomsord/parse.test.ts src/lib/visdomsord/generate.test.ts`

Expected: FAIL

- [ ] **Step 3: Implement parse, prompt, generate, persist**

`prompt.ts`: `VISDOMSORD_PROMPT_VERSION = 'kb-visdom-v1'`. System: Kycklingbladet hen voice, light HolyParadox-style insight (paradox, not sermon), one or two spoken sentences as the hen, not a poster proverb, Swedish, `HEN_HUMOR` + `HEN_LEXICON` + `HEN_NAMES`. Reply ONLY JSON array `[{"quote":"...","henName":"..."}]`.

`generateVisdomsordDrafts`: throw `ANTHROPIC_API_KEY saknas` if missing. `max_tokens` 4000, temperature 0.9. Retry the batch once on parse empty. After each batch, add new keys to the set. Stop at `count`.

`persist.ts` `createVisdomsord`: for each draft `getWriteClient().create({_type: 'visdomsord', quote, henName})`. Return created count.

`POST /api/visdomsord/generate`: `OPTIONS` + `maxDuration = 60`, `extraExtraSecretOk` else 401. Body `{count?: number}` default 100, cap 100. Fetch existing quotes `*[_type == "visdomsord"].quote`. Generate, create, return `{created: number}`. If created is 0 throw Swedish `Inga nya visdomsord att spara`. CORS same as Extra Extra.

`generate/route.test.ts`: same smoke as extra-extra preview route (handlers + maxDuration).

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/lib/visdomsord/parse.test.ts src/lib/visdomsord/generate.test.ts src/app/api/visdomsord/generate/route.test.ts`

Expected: PASS. Mock Anthropic in `generate.test.ts` if you unit-test `generateVisdomsordDrafts`; otherwise test only parse/takeFreshDrafts plus route smoke.

- [ ] **Step 5: Commit**

```bash
git add src/lib/visdomsord/parse.ts src/lib/visdomsord/parse.test.ts src/lib/visdomsord/prompt.ts src/lib/visdomsord/generate.ts src/lib/visdomsord/generate.test.ts src/lib/visdomsord/persist.ts src/app/api/visdomsord/generate
git commit -m "Generate unused visdomsord quotes through Claude."
```

---

### Task 6: Rewrite API

**Files:**
- Modify: `src/lib/visdomsord/persist.ts` (add rewrite)
- Create: `src/app/api/visdomsord/rewrite/route.ts`, `rewrite/route.test.ts`
- Test: extend `src/lib/visdomsord/generate.test.ts` or `persist` tests with `applyRewrite` filtering

**Interfaces:**
- Consumes: `generateVisdomsordDrafts`, `normalizeQuoteKey`, `getWriteClient`
- Produces: `export async function rewriteVisdomsord(ids: string[]): Promise<{rewritten: number; skipped: number}>`

For each id: fetch `{_id, quote, henName, usedDate}`. If missing or `usedDate` set → skip. Generate **1** draft with existing quotes excluding this document’s current quote (so it may keep similar meaning but must pass normalize against **other** docs). If `takeFreshDrafts` is empty → skip that id. Else patch `{quote, henName}` and **unset** `image`, `imageCaption`, `imageShotType`, `imagePrompt`. Continue on individual failures.

- [ ] **Step 1: Write the failing route smoke test**

```ts
import {describe, expect, it} from 'vitest'
import {maxDuration, OPTIONS, POST} from './route'

describe('visdomsord rewrite route', () => {
  it('exports HTTP handlers and a 60s duration budget', () => {
    expect(typeof OPTIONS).toBe('function')
    expect(typeof POST).toBe('function')
    expect(maxDuration).toBe(60)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/api/visdomsord/rewrite/route.test.ts`

Expected: FAIL

- [ ] **Step 3: Implement persist + POST**

Auth same as generate. Body `{ids: string[]}`. Invalid body → 400 `Ogiltig förfrågan`. Return `{rewritten, skipped}`. Never rewrite used rows.

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/app/api/visdomsord/rewrite/route.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/visdomsord/persist.ts src/app/api/visdomsord/rewrite
git commit -m "Rewrite selected visdomsord and clear their cartoons."
```

---

### Task 7: Draw API

**Files:**
- Modify: `src/lib/generate/image-brief.ts` — allow `kind: 'visdomsord'` in `buildImageBriefUserPrompt` / `generateImageBriefFromCopy` (headline = henName, body = quote)
- Create: `src/app/api/visdomsord/draw/route.ts`, `draw/route.test.ts`
- Test: `src/lib/generate/image-brief.test.ts` (add one case for visdomsord prompt label)

**Interfaces:**
- Consumes: `generateImageBriefFromCopy`, `attachLeadImage`, `getWriteClient`, `stockholmToday`
- Produces: `POST /api/visdomsord/draw` `{ids: string[]}` → `{results: {id: string; imageError: string | null}[]}`

Skip ids with `usedDate` or existing `image.asset`. Sequential draw. One Gemini failure: `{imageError}` for that id, continue. Filename `visdomsord-${id}.jpg`. `attachLeadImage({id, date: stockholmToday(), brief, filename})`.

- [ ] **Step 1: Write failing tests**

Route smoke (OPTIONS, POST, maxDuration 60). Image-brief test: `buildImageBriefUserPrompt({kind: 'visdomsord', headline: 'Gerda', body: 'Sitt inte'})` contains `Visdomsord` (or `VISDOMSORD`) and the quote.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/app/api/visdomsord/draw/route.test.ts src/lib/generate/image-brief.test.ts`

Expected: FAIL on visdomsord kind / missing route

- [ ] **Step 3: Implement**

Extend `kind` union `'larm' | 'extra' | 'visdomsord'`. Auth + CORS as Extra Extra. 401/400 Swedish errors.

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/app/api/visdomsord/draw/route.test.ts src/lib/generate/image-brief.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/generate/image-brief.ts src/lib/generate/image-brief.test.ts src/app/api/visdomsord/draw
git commit -m "Draw visdomsord cartoons from Studio on demand."
```

---

### Task 8: Studio schema and queue

**Files:**
- Create: `C:\Users\simon\projekt\kycklingbladet-studio\schemaTypes\visdomsord.ts`
- Create: `C:\Users\simon\projekt\kycklingbladet-studio\actions\VisdomsordQueue.tsx`
- Modify: `C:\Users\simon\projekt\kycklingbladet-studio\schemaTypes\index.ts`
- Modify: `C:\Users\simon\projekt\kycklingbladet-studio\structure\index.ts`

**Interfaces:**
- Consumes: site APIs `/api/visdomsord/generate|rewrite|draw` with header `x-extra-extra-secret` (same env vars as Extra Extra)
- Produces: Studio type `visdomsord`; structure **Visdomsord** → **Kö** (custom) and **Alla** (document list)

- [ ] **Step 1: Schema**

Fields exactly as spec: `quote` (text, required), `henName` (string, required), `image`, `imageCaption`, `imageShotType` (hidden), `imagePrompt` (hidden), `usedDate` (date, readOnly). Preview title = quote, subtitle = henName + usedDate or “i kön” / “saknar bild”.

Register in `schemaTypes/index.ts`.

- [ ] **Step 2: Kö component**

Copy fetch/error pattern from `actions/ExtraExtraCreate.tsx` (`SANITY_STUDIO_SITE_URL` default `http://localhost:3001`, `SANITY_STUDIO_EXTRA_EXTRA_SECRET`).

Load unused docs via `useClient`: `*[_type == "visdomsord" && !defined(usedDate)] | order(_createdAt asc){_id, quote, henName, "hasImage": defined(image.asset)}`.

Buttons: **Generera 100** (count 100), checkboxes, **Skriv om**, **Rita** (only selected without hasImage; if a selected row has image, skip it client-side), **Radera** via `client.delete`. After each action, refresh the query. Show Swedish errors. Rita/skriv om disabled when nothing eligible is selected.

Do not post to Facebook from Studio.

- [ ] **Step 3: Structure**

Add list item **Visdomsord** with Bolt-or-similar icon: child list **Kö** (`S.component(VisdomsordQueue)`) and **Alla** (`S.documentList().schemaType('visdomsord').filter('_type == "visdomsord"').defaultOrdering([{field: 'usedDate', direction: 'desc'}])`).

- [ ] **Step 4: Sanity schema available**

From studio repo: `npx sanity schema deploy` if that is how other schema changes are shipped; otherwise confirm Studio loads the new type locally.

- [ ] **Step 5: Commit in the studio repo**

```bash
cd C:\Users\simon\projekt\kycklingbladet-studio
git add schemaTypes/visdomsord.ts schemaTypes/index.ts actions/VisdomsordQueue.tsx structure/index.ts
git commit -m "Add a Studio queue for hen wisdom quotes."
```

Site repo: add a smoke test that `src/app/api/visdomsord/generate/route.ts` exists if you want; optional. Prefer:

```bash
cd C:\Users\simon\projekt\kycklingbladet
git add src/app/api/visdomsord
git commit -m "Expose visdomsord Studio APIs." 
```

only if those files were not already committed in tasks 5–7.

---

### Task 9: 07:00 job and README

**Files:**
- Create: `scripts/run-visdomsord.ts`
- Create: `.github/workflows/visdomsord.yml`
- Modify: `README.md` (GitHub Actions section)
- Test: keep queue helpers as the logic tests; script is orchestration

**Interfaces:**
- Consumes: `stockholmToday`, `alreadyPostedOn`, `pickNextUnusedWithImage`, `facebookWisdomMessage`, `shareToFacebook`, `getWriteClient`
- Produces: workflow `visdomsord.yml`; `export async function runVisdomsord(now?: Date): Promise<'posted' | 'skipped'>`

- [ ] **Step 1: Script**

```ts
export async function runVisdomsord(now = new Date()) {
  const date = stockholmToday(now)
  const client = getWriteClient()
  const rows = await client.fetch<VisdomsordRow[]>(
    `*[_type == "visdomsord"] | order(_createdAt asc){
      _id, quote, henName, usedDate, _createdAt, "imageUrl": image.asset->url
    }`,
  )
  if (alreadyPostedOn(rows, date)) {
    console.log(`Hoppar över visdomsord ${date}: redan utlagt`)
    return 'skipped'
  }
  const next = pickNextUnusedWithImage(rows)
  if (!next) {
    console.log(`Tom visdomsord-kö ${date}`)
    return 'skipped'
  }
  const result = await shareToFacebook({
    message: facebookWisdomMessage({quote: next.quote, henName: next.henName}),
    imageUrl: next.imageUrl,
  })
  if (result === 'shared') {
    await client.patch(next._id).set({usedDate: date}).commit()
    console.log(`Utlagt visdomsord ${next._id}`)
    return 'posted'
  }
  if (result === 'failed') {
    console.error(`Facebook misslyckades för visdomsord ${next._id}`)
    process.exitCode = 1
    return 'skipped'
  }
  console.error(`Hoppar över visdomsord ${next._id}: ingen Facebook-post`)
  return 'skipped'
}
```

Call `runVisdomsord().catch(...)` like `run-daily.ts`. Missing Sanity token throws. Do not pass `articleUrl`.

- [ ] **Step 2: Workflow**

`.github/workflows/visdomsord.yml`:

```yaml
name: Daily visdomsord

on:
  schedule:
    - cron: "0 7 * * *"
      timezone: Europe/Stockholm
  workflow_dispatch:

concurrency:
  group: visdomsord
  cancel-in-progress: false

jobs:
  visdomsord:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    env:
      TZ: Europe/Stockholm
      NEXT_PUBLIC_SANITY_PROJECT_ID: ${{ secrets.NEXT_PUBLIC_SANITY_PROJECT_ID }}
      NEXT_PUBLIC_SANITY_DATASET: production
      SANITY_API_WRITE_TOKEN: ${{ secrets.SANITY_API_WRITE_TOKEN }}
      FACEBOOK_PAGE_ID: ${{ secrets.FACEBOOK_PAGE_ID }}
      FACEBOOK_PAGE_ACCESS_TOKEN: ${{ secrets.FACEBOOK_PAGE_ACCESS_TOKEN }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npx tsx scripts/run-visdomsord.ts
```

No Anthropic, no Gemini. No `npm test` (keep this job short; tests already run on daily).

- [ ] **Step 3: README**

Under GitHub Actions: visdomsord cron 07:00 Europe/Stockholm, Facebook-only, requires a Studio-drawn image in the pool. Same Facebook + Sanity write secrets as daily. Manual: `gh workflow run visdomsord.yml`.

- [ ] **Step 4: Run unit tests**

Run: `npx vitest run src/lib/visdomsord src/lib/facebook/share.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/run-visdomsord.ts .github/workflows/visdomsord.yml README.md
git commit -m "Post one hen wisdom quote to Facebook at 07:00."
```

---

## Spec coverage

| Spec | Task |
| --- | --- |
| `visdomsord` document fields | 8 |
| Duplicate normalize | 1, 5, 6 |
| Generate 100, skip dups | 5 |
| Rewrite + unset image; skip used | 6 |
| Rita one/bulk; skip used and already drawn | 7, 8 |
| Delete in Studio | 8 |
| Caption KUCKELIKUUUU / quotes / henName | 2 |
| No URL comment | 3, 9 |
| 07:00 Stockholm, own concurrency | 9 |
| Oldest unused with image | 4, 9 |
| usedDate only after shared | 9 |
| Empty queue / already today → exit 0 | 9 |
| Graph fail exit 1 | 9 |
| No site UI | 9 constraint |
| Extra Extra secret / CORS | 5–7 |
| HolyParadox prompt only | 5 |

## Self-review

- `articleUrl` optional does not change larm tests that still pass a URL.
- Generate batches of 25 to avoid truncated JSON at 100.
- Cron does not call Gemini (images come from Studio).
- Studio delete uses the Sanity client, not a Next route.
