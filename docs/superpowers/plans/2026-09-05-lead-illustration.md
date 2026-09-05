# Lead illustration and EXTRA EXTRA first

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show EXTRA EXTRA above today’s lead, and give the lead the same optional hen cartoon as EXTRA EXTRA (daily draw going forward, Studio redraw, no coupling to Extra Extra publish).

**Architecture:** Reuse `EXTRA_IMAGE_STYLE`, `drawExtraImage`, and layout C. Claude’s lead JSON gains an optional image brief. After a **new** `publishAlarm`, the daily job uploads a JPEG onto `alarm` or continues without one. Studio patches via `POST /api/alarm/preview-image`. EXTRA EXTRA routes never write `alarm`. A one-off script rewrites Stockholm-today’s existing lead; it is not part of Extra Extra or of `run-daily`’s skip path.

**Tech Stack:** Next.js 16, Vitest, existing `@google/genai` Gemini helper, Sanity image assets, Studio v3 custom input, `EXTRA_EXTRA_SECRET` CORS.

**Spec:** `docs/superpowers/specs/2026-09-05-lead-illustration-design.md`

## Global Constraints

- Never scrape alarmindex.com.
- EXTRA EXTRA preview/publish never writes `alarm`. Creating an extra does not refresh the lead.
- Only the lead (`alarm`) gets a drawing. Notices, week-lead cards, and RSS stay text-only.
- Cartoon lock is already in `EXTRA_IMAGE_STYLE`: Berglin/Larson, hens only, signature exactly `Kycklingbladet.com`, never sign Larson/Berglin/Far Side.
- Image is optional. Daily job, redraw HTTP, and the one-off script must succeed if Gemini fails.
- Two repos: `C:\Users\simon\projekt\kycklingbladet` and `C:\Users\simon\projekt\kycklingbladet-studio`. Stay on `extra-extra-doc`.
- `GEMINI_API_KEY` on the Next app only. Do not commit keys. Do not print keys.
- Do not commit unrelated prompt WIP in `hen-lexicon.ts` or `notice-prompt.test.ts`. Task 3 may edit `prompt.ts` / `prompt.test.ts` **only** to add image-brief JSON and bump `PROMPT_VERSION` to `kb-v11`.
- Windows PowerShell commits use `git commit -m @" ... "@`.
- Do not run `scripts/refresh-today-lead.ts` against production unless the user explicitly asks.

## File map

| File | Responsibility |
|------|----------------|
| `src/app/page.tsx` | EXTRA EXTRA above “Dagens nyheter” |
| `src/app/arkiv/[date]/page.tsx` | EXTRA EXTRA before `AlarmArticle` |
| `src/lib/extra-extra/illustration.ts` | Shared `cartoonIllustration`; `leadIllustration` |
| `src/lib/sanity/types.ts` | `Alarm.imageUrl`, `Alarm.imageCaption` |
| `src/lib/sanity/queries.ts` | GROQ image fields on `alarmFields` |
| `src/components/AlarmArticle.tsx` | Layout C + expert box in the text column |
| `src/lib/generate/prompt.ts` | Lead JSON image fields; `kb-v11` |
| `src/lib/generate/validate.ts` | Optional `imageBrief` on `GeneratedAlarm` |
| `src/lib/generate/claude.ts` | `max_tokens: 2000` |
| `src/lib/lead/attach-image.ts` | Draw, upload `lead-{date}.jpg`, patch |
| `scripts/run-daily.ts` | Attach image only after `'created'` |
| `src/app/api/alarm/preview-image/route.ts` | Studio redraw |
| Studio `schemaTypes/alarm.ts` | Image fields |
| Studio `components/AlarmImageInput.tsx` | Drawing, shot select, **Generera om bild** |
| `scripts/refresh-today-lead.ts` | One-off rewrite of Stockholm today |

---

### Task 1: EXTRA EXTRA above today’s lead

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/arkiv/[date]/page.tsx`
- Test: `src/lib/issue-order.test.ts`

**Interfaces:**
- Consumes: existing `IssueExtra`, `AlarmArticle`, `TODAY_ISSUE_HEADING`
- Produces: home order week strip → Extra → “Dagens nyheter”; archive Extra → AlarmArticle → notices. Extra Extra APIs unchanged.

- [ ] **Step 1: Write the failing test**

Create `src/lib/issue-order.test.ts`:

```ts
import {readFileSync} from 'node:fs'
import {describe, expect, it} from 'vitest'

describe('issue order', () => {
  it('puts IssueExtra above Dagens nyheter on home', () => {
    const src = readFileSync('src/app/page.tsx', 'utf8')
    expect(src.indexOf('<IssueExtra')).toBeGreaterThan(-1)
    expect(src.indexOf('<IssueExtra')).toBeLessThan(src.indexOf('TODAY_ISSUE_HEADING'))
  })

  it('puts IssueExtra before AlarmArticle on archive', () => {
    const src = readFileSync('src/app/arkiv/[date]/page.tsx', 'utf8')
    expect(src.indexOf('<IssueExtra')).toBeLessThan(src.indexOf('<AlarmArticle'))
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/issue-order.test.ts`

Expected: FAIL (home currently renders Extra inside the section after `AlarmArticle`).

- [ ] **Step 3: Move Extra**

Home: keep `WeekLeads` as `sm:order-1`. In the `sm:order-2` column, render `IssueExtra` **before** `SectionHead` / `TODAY_ISSUE_HEADING`. Keep Extra above `EmptyIssue` when there is no alarm. Remove Extra from below `AlarmArticle`.

Archive: `{alarm ? <AlarmArticle .../> : null}` then Extra becomes Extra first, then AlarmArticle, then notices.

Do not change `IssueNav` or week-lead `sm:order`.

- [ ] **Step 4: Re-run tests**

Run: `npx vitest run src/lib/issue-order.test.ts src/lib/rss.test.ts`

Expected: PASS. RSS still has no image fields.

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx src/app/arkiv/[date]/page.tsx src/lib/issue-order.test.ts
git commit -m @"
Show EXTRA EXTRA above today's lead.

"@
```

---

### Task 2: Lead illustration helper and layout C

**Files:**
- Modify: `src/lib/extra-extra/illustration.ts`
- Modify: `src/lib/extra-extra/illustration.test.ts`
- Modify: `src/lib/sanity/types.ts`
- Modify: `src/lib/sanity/queries.ts`
- Modify: `src/components/AlarmArticle.tsx`

**Interfaces:**
- Consumes: `Alarm`, `extraIllustration` pattern
- Produces: `cartoonIllustration(doc): {url: string; caption: string} | null` when both `imageUrl` and `imageCaption` are non-empty strings. `leadIllustration(alarm)` and `extraIllustration(extra)` call it. `Alarm` gains `imageUrl?: string | null; imageCaption?: string | null`. GROQ `alarmFields` gains `"imageUrl": image.asset->url` and `imageCaption`.

- [ ] **Step 1: Extend illustration tests**

In `illustration.test.ts` add:

```ts
import type {Alarm} from '@/lib/sanity/types'
import {cartoonIllustration, extraIllustration, leadIllustration} from './illustration'

const alarmBase: Alarm = {
  _id: 'alarm-2026-09-05',
  date: '2026-09-05',
  kicker: 'Dagens skrämchock',
  headline: 'Räven vid luckan',
  body: 'Gården håller andan.',
  expertVoice: 'Överhönan',
  expertHeadline: 'varnar: Kan bli mycket värre',
  expertText: 'Håll er inne.',
  sourceHeadline: 'Källrubrik',
  sourceNewspaper: 'Expressen',
  sourceNewspaperSlug: 'expressen',
  sourceAlarmindexUrl: 'https://example.com',
  sourceScore: 1,
  promptVersion: 'kb-v11',
  modelVersion: 'claude-test',
}

it('leadIllustration requires url and caption', () => {
  expect(
    leadIllustration({
      ...alarmBase,
      imageUrl: 'https://cdn.sanity.io/lead.jpg',
      imageCaption: 'Tuppen Gösta vid luckan i går kväll.',
    }),
  ).toEqual({
    url: 'https://cdn.sanity.io/lead.jpg',
    caption: 'Tuppen Gösta vid luckan i går kväll.',
  })
  expect(leadIllustration({...alarmBase, imageUrl: '', imageCaption: 'x'})).toBeNull()
  expect(leadIllustration(alarmBase)).toBeNull()
  expect(cartoonIllustration({imageUrl: 'https://cdn.sanity.io/x.jpg', imageCaption: 'x'})).toEqual({
    url: 'https://cdn.sanity.io/x.jpg',
    caption: 'x',
  })
})
```

Keep the existing `extraIllustration` test passing via the shared helper.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/extra-extra/illustration.test.ts`

Expected: FAIL missing `leadIllustration` / `cartoonIllustration`.

- [ ] **Step 3: Implement helper, types, query, AlarmArticle**

`illustration.ts`:

```ts
export function cartoonIllustration(doc: {
  imageUrl?: string | null
  imageCaption?: string | null
}): {url: string; caption: string} | null {
  const url = doc.imageUrl
  const caption = doc.imageCaption
  if (typeof url !== 'string' || url.length === 0) return null
  if (typeof caption !== 'string' || caption.length === 0) return null
  return {url, caption}
}

export function extraIllustration(extra: ExtraExtra) {
  return cartoonIllustration(extra)
}

export function leadIllustration(alarm: Alarm) {
  return cartoonIllustration(alarm)
}
```

Add `imageUrl` / `imageCaption` to `Alarm` like `ExtraExtra`.

Append to `alarmFields` (same fragment `getAlarmByDate` / latest already use):

```
  "imageUrl": image.asset->url,
  imageCaption
```

`AlarmArticle`: import `Image` from `next/image` and `leadIllustration`. If `leadIllustration(alarm)` is null, keep the current kicker → h1 → paragraphs → expert aside → source (no extra grid, no `figure`). If set, after `h1` use the same wrapper as `IssueExtra`:

```tsx
<div className="lg:grid lg:grid-cols-[1fr_minmax(12rem,38%)] lg:gap-10 lg:items-start">
  <figure className="mt-5 lg:mt-0 lg:col-start-2 lg:row-span-2">
    <div className="border border-[var(--rule)] bg-[#f3ead6] p-2">
      <Image
        src={illustration.url}
        alt={illustration.caption}
        width={768}
        height={1024}
        sizes="(min-width: 1024px) 38vw, 100vw"
        className="h-auto w-full"
      />
    </div>
    <figcaption className="mt-2 text-xs italic leading-relaxed text-[var(--brass)] lg:text-sm">
      {illustration.caption}
    </figcaption>
  </figure>
  <div className="lg:col-start-1 lg:row-start-1">
    {paragraphs}
    {expert}
    {source}
  </div>
</div>
```

Phone DOM: kicker, headline, figure, body, expert, source. `next.config.ts` already allows `cdn.sanity.io`.

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/lib/extra-extra/illustration.test.ts src/lib/extra-extra/has-extra.test.ts`

Expected: PASS. `hasExtraExtra` still ignores images.

- [ ] **Step 5: Commit**

```bash
git add src/lib/extra-extra/illustration.ts src/lib/extra-extra/illustration.test.ts src/lib/sanity/types.ts src/lib/sanity/queries.ts src/components/AlarmArticle.tsx
git commit -m @"
Show the lead cartoon beside today's article.

"@
```

---

### Task 3: Claude image brief on the lead

**Files:**
- Modify: `src/lib/generate/prompt.ts`
- Modify: `src/lib/generate/prompt.test.ts`
- Modify: `src/lib/generate/validate.ts`
- Modify: `src/lib/generate/validate.test.ts`
- Modify: `src/lib/generate/claude.ts`

**Interfaces:**
- Consumes: `validateExtraImageBrief`, `ExtraImageBrief`
- Produces: `GeneratedAlarm.imageBrief: ExtraImageBrief | null`. `PROMPT_VERSION = 'kb-v11'`. Invalid/missing brief → `imageBrief: null`, alarm still valid. `max_tokens: 2000`.

- [ ] **Step 1: Write failing tests**

`prompt.test.ts`: change `kb-v10` to `kb-v11`. Add:

```ts
it('asks for a lead cartoon brief', () => {
  expect(SYSTEM_PROMPT).toContain('imageShotType')
  expect(SYSTEM_PROMPT).toContain('imageCaption')
  expect(SYSTEM_PROMPT).toContain('intervju')
  expect(SYSTEM_PROMPT).toContain('Bildtexten ska aldrig in i teckningen')
})
```

In `validate.test.ts` (use the existing `good` fixture):

```ts
it('attaches a valid image brief and ignores a partial one', () => {
  expect(
    validateGeneratedAlarm({
      ...good,
      imageShotType: 'incident',
      imageCaption: 'Tuppen Gösta vid luckan i går kväll.',
      imagePrompt: 'A rooster by a henhouse hatch at night.',
    })?.imageBrief,
  ).toEqual({
    shotType: 'incident',
    caption: 'Tuppen Gösta vid luckan i går kväll.',
    scenePrompt: 'A rooster by a henhouse hatch at night.',
  })
  expect(validateGeneratedAlarm(good)?.imageBrief).toBeNull()
  expect(
    validateGeneratedAlarm({...good, imageCaption: 'bara text'})?.imageBrief,
  ).toBeNull()
})
```

Existing validate tests must still pass: missing kicker/expert still null.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/generate/prompt.test.ts src/lib/generate/validate.test.ts`

Expected: FAIL version and missing `imageBrief`.

- [ ] **Step 3: Implement**

Set `PROMPT_VERSION = 'kb-v11'`.

Append to `SYSTEM_PROMPT` rules (before the JSON object), same meaning as EXTRA EXTRA:

```
- Föreslå ett bildmanus som passar en hönstidningsillustration: intervju, incident eller annat.
- imageCaption är svensk bildtext (vem/var/vad), inte en one-liner. Bildtexten ska aldrig in i teckningen.
- imagePrompt är bara scenen, på engelska, för serierutan. Ingen skylttext, pratbubbla eller artistnamn i scenen. Signaturen låses senare.
```

Extend the JSON object in the prompt with:

```
  "imageShotType": "intervju" | "incident" | "annat",
  "imageCaption": "string — svensk bildtext vem/var/vad, inte en one-liner",
  "imagePrompt": "string — English scene for the cartoon, no signs or speech in the picture"
```

`GeneratedAlarm` adds `imageBrief: ExtraImageBrief | null`. In `validateGeneratedAlarm`, after the existing required fields succeed:

```ts
imageBrief: validateExtraImageBrief(record),
```

`claude.ts`: set `max_tokens: 2000`. Do not change temperature or retry.

Do not stage `hen-lexicon.ts`. If `prompt.ts` has unrelated dirty hunks, commit only the image-brief + version changes.

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/lib/generate/prompt.test.ts src/lib/generate/validate.test.ts src/lib/generate/extra.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/generate/prompt.ts src/lib/generate/prompt.test.ts src/lib/generate/validate.ts src/lib/generate/validate.test.ts src/lib/generate/claude.ts
git commit -m @"
Have Claude propose a cartoon brief with the day's lead.

"@
```

---

### Task 4: Daily job attaches the cartoon after create

**Files:**
- Create: `src/lib/lead/attach-image.ts`
- Test: `src/lib/lead/attach-image.test.ts`
- Modify: `scripts/run-daily.ts`

**Interfaces:**
- Consumes: `drawExtraImage`, `getWriteClient`, `ExtraImageBrief`
- Produces: `attachLeadImage({id, date, brief}): Promise<{image: ExtraPreviewImage | null; imageError: string | null}>`. Filename `lead-${date}.jpg`. No brief or failed draw → `{image: null, ...}`, no patch, no throw. Success → patch `image`, `imageCaption`, `imageShotType`, `imagePrompt` and return the JPEG payload. `runDaily` calls it only when `publishAlarm` returns `'created'`. Existing-alarm skip does not call it.

- [ ] **Step 1: Write failing tests**

```ts
import {describe, expect, it, vi} from 'vitest'
import {drawExtraImage} from '@/lib/extra-extra/draw'

vi.mock('@/lib/extra-extra/draw', () => ({drawExtraImage: vi.fn()}))
vi.mock('@/lib/sanity/write-client', () => ({
  getWriteClient: vi.fn(),
}))

import {getWriteClient} from '@/lib/sanity/write-client'
import {attachLeadImage} from './attach-image'

const brief = {
  shotType: 'incident' as const,
  caption: 'Tuppen Gösta vid luckan i går kväll.',
  scenePrompt: 'A rooster by a hatch.',
}

it('does not call Gemini or patch when brief is null', async () => {
  await expect(attachLeadImage({id: 'alarm-1', date: '2026-09-05', brief: null})).resolves.toEqual({
    image: null,
    imageError: null,
  })
  expect(drawExtraImage).not.toHaveBeenCalled()
})

it('does not patch when Gemini fails', async () => {
  vi.mocked(drawExtraImage).mockResolvedValue({image: null, imageError: 'Kunde inte rita bilden'})
  const patch = vi.fn()
  vi.mocked(getWriteClient).mockReturnValue({assets: {upload: vi.fn()}, patch} as never)
  await expect(attachLeadImage({id: 'alarm-1', date: '2026-09-05', brief})).resolves.toEqual({
    image: null,
    imageError: 'Kunde inte rita bilden',
  })
  expect(patch).not.toHaveBeenCalled()
})

it('uploads lead-{date}.jpg and patches image fields', async () => {
  vi.mocked(drawExtraImage).mockResolvedValue({
    image: {mimeType: 'image/jpeg', base64: Buffer.from('jpeg').toString('base64')},
    imageError: null,
  })
  const upload = vi.fn().mockResolvedValue({_id: 'image-1'})
  const commit = vi.fn().mockResolvedValue({})
  const set = vi.fn(() => ({commit}))
  const patch = vi.fn(() => ({set}))
  vi.mocked(getWriteClient).mockReturnValue({assets: {upload}, patch} as never)

  await expect(attachLeadImage({id: 'alarm-1', date: '2026-09-05', brief})).resolves.toEqual({
    image: {mimeType: 'image/jpeg', base64: Buffer.from('jpeg').toString('base64')},
    imageError: null,
  })
  expect(upload).toHaveBeenCalledWith(
    'image',
    expect.any(Buffer),
    {filename: 'lead-2026-09-05.jpg', contentType: 'image/jpeg'},
  )
  expect(patch).toHaveBeenCalledWith('alarm-1')
  expect(set).toHaveBeenCalledWith({
    image: {_type: 'image', asset: {_type: 'reference', _ref: 'image-1'}},
    imageCaption: brief.caption,
    imageShotType: brief.shotType,
    imagePrompt: brief.scenePrompt,
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/lead/attach-image.test.ts`

Expected: FAIL missing module.

- [ ] **Step 3: Implement attach + daily wiring**

```ts
export async function attachLeadImage(input: {
  id: string
  date: string
  brief: ExtraImageBrief | null
}): Promise<{imageError: string | null}> {
  if (!input.brief) return {image: null, imageError: null}
  const draw = await drawExtraImage(input.brief)
  if (!draw.image) return {image: null, imageError: draw.imageError}
  const client = getWriteClient()
  const uploaded = await client.assets.upload(
    'image',
    Buffer.from(draw.image.base64, 'base64'),
    {filename: `lead-${input.date}.jpg`, contentType: draw.image.mimeType},
  )
  await client.patch(input.id).set({
    image: {_type: 'image', asset: {_type: 'reference', _ref: uploaded._id}},
    imageCaption: input.brief.caption,
    imageShotType: input.brief.shotType,
    imagePrompt: input.brief.scenePrompt,
  }).commit()
  return {image: draw.image, imageError: null}
}
```

Strip `drafts.` from `id` before patch if present.

In `run-daily.ts`, after `publishAlarm` when `result === 'created'`:

```ts
const image = await attachLeadImage({
  id: alarmIdForDate(date),
  date,
  brief: generated.imageBrief,
})
if (image.imageError) console.error(`Kunde inte rita larmbilden för ${date}: ${image.imageError}`)
```

Wrap in try/catch so an unexpected throw cannot fail the job after create: log and continue to `scoreDate` / `fillNoticesSafe`.

When `shouldCreateAlarm` is false (already exists): do **not** call `attachLeadImage`.

Do not call attach from Extra Extra routes.

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/lib/lead/attach-image.test.ts src/lib/select/alarm-id.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/lead/attach-image.ts src/lib/lead/attach-image.test.ts scripts/run-daily.ts
git commit -m @"
Draw the day's lead cartoon after a new alarm is created.

"@
```

---

### Task 5: Studio redraw API for the lead

**Files:**
- Create: `src/app/api/alarm/preview-image/route.ts`
- Test: `src/app/api/alarm/preview-image/route.test.ts`

**Interfaces:**
- Consumes: `extraExtraSecretOk`, `corsHeaders`, `attachLeadImage`, `validateExtraImageBrief`, `parseExtraImageShotType`, `getWriteClient`
- Produces: `POST {id, shotType?}` → 401 unauthorized; 400 bad id; 200 `{image, imageError, imageCaption, imageShotType}` where `image` is `{mimeType, base64}` or null. Missing brief → `imageError: 'Saknar bildunderlag'`, no patch. Gemini fail → 200, `attachLeadImage` already skips patch. `export const maxDuration = 60`. OPTIONS same CORS as extra-extra.

- [ ] **Step 1: Write failing tests**

Mirror `preview-image/route.test.ts` auth/CORS/`maxDuration === 60`. Then:

```ts
it('returns 400 when id is missing', async () => { ... })

it('returns Saknar bildunderlag without drawing when the alarm has no brief', async () => {
  // mock fetch → {_id, date} without caption/prompt/shot
  expect(drawExtraImage).not.toHaveBeenCalled()
  await expect(response.json()).resolves.toMatchObject({
    image: null,
    imageError: 'Saknar bildunderlag',
  })
})

it('keeps HTTP 200 when Gemini fails', async () => {
  // mock fetch with a valid brief; drawExtraImage → {image: null, imageError: 'Kunde inte rita bilden'}
  expect(response.status).toBe(200)
})
```

Stub `EXTRA_EXTRA_SECRET`. Mock `getWriteClient().fetch` and `attachLeadImage` **or** `drawExtraImage` + upload as in Task 4. Prefer mocking `attachLeadImage` at the route layer and `getWriteClient().fetch` for the document.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/api/alarm/preview-image/route.test.ts`

Expected: FAIL missing module.

- [ ] **Step 3: Implement the route**

```ts
export const maxDuration = 60
```

Parse `{id, shotType?}`. Unauthorized → 401. Missing/non-string `id` or no matching `alarm` → 400 `{error: 'Ogiltig förfrågan'}`. Build brief with `validateExtraImageBrief` using stored caption/prompt and `parseExtraImageShotType(payload.shotType) ?? doc.imageShotType`. No brief → 200 `{image: null, imageError: 'Saknar bildunderlag', imageCaption, imageShotType}` and do not call `attachLeadImage`. Otherwise `attachLeadImage` once and return `{image, imageError, imageCaption: brief.caption, imageShotType: brief.shotType}`.

Do not call Gemini a second time. Task 4 already returns the JPEG on success.

Gemini fail: `attachLeadImage` does not patch. Previous Sanity asset remains.

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/app/api/alarm/preview-image/route.test.ts src/lib/lead/attach-image.test.ts src/app/api/extra-extra/preview-image/route.test.ts`

Expected: PASS. Extra Extra route still does not import `attachLeadImage`.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/alarm/preview-image/route.ts src/app/api/alarm/preview-image/route.test.ts src/lib/lead/attach-image.ts src/lib/lead/attach-image.test.ts
git commit -m @"
Let Studio redraw the lead cartoon without rewriting the article.

"@
```

---

### Task 6: Studio schema and image input

**Files:**
- Modify: `C:\Users\simon\projekt\kycklingbladet-studio\schemaTypes\alarm.ts`
- Create: `C:\Users\simon\projekt\kycklingbladet-studio\components\AlarmImageInput.tsx`

**Interfaces:**
- Consumes: `POST /api/alarm/preview-image` `{id, shotType?}` with `x-extra-extra-secret`
- Produces: `image` title `Teckning` readOnly custom input; `imageCaption` title `Bildtext` readOnly; `imageShotType` / `imagePrompt` hidden readOnly. Input shows `<img>` from `value.asset` URL when present, shot select Intervju/Incident/Annat, **Generera om bild**. Does not patch kicker, headline, body, or expert fields. Failed redraw shows a caution card; previous picture stays.

- [ ] **Step 1: Add fields and input**

Copy field definitions from `schemaTypes/extraExtra.ts` (image through imagePrompt) onto `alarm.ts` **after** `body` and **before** `expertVoice`. Set `components: {input: AlarmImageInput}` only on `image`.

`AlarmImageInput.tsx` (Sanity `ObjectInputProps`):

- Site URL: `import.meta.env.SANITY_STUDIO_SITE_URL` default `http://localhost:3001` (same as ExtraExtraCreate).
- Secret: `SANITY_STUDIO_EXTRA_EXTRA_SECRET`.
- `id` = `document._id` without `drafts.` prefix.
- Select options: `{value: 'intervju', title: 'Intervju'}`, incident, annat. Default from `document.imageShotType` or `annat`.
- Button disabled when busy or no `document._id`.
- POST JSON `{id, shotType}`. On 200 with `image`, show data URL. On `imageError`, caution card. Do not clear `value` on failure.
- Use `useFormValue(['imageShotType'])` / `_id` as needed so the input can read sibling fields.

Do not add a “Skapa dagens nummer” pane. Do not change `ExtraExtraCreate` to call this API.

- [ ] **Step 2: Typecheck Studio**

Run: `npx tsc --noEmit` in `C:\Users\simon\projekt\kycklingbladet-studio`

Expected: PASS (`env.d.ts` already committed).

- [ ] **Step 3: Commit in the studio repo**

```bash
git add schemaTypes/alarm.ts components/AlarmImageInput.tsx
git commit -m @"
Let editors redraw the lead cartoon on the alarm document.

"@
```

---

### Task 7: One-off script for Stockholm today

**Files:**
- Create: `scripts/refresh-today-lead.ts`

**Interfaces:**
- Consumes: `stockholmToday`, `generateAlarm`, `attachLeadImage`, `getWriteClient`
- Produces: script that loads `*[_type == "alarm" && date == $today][0]{_id, date, sourceHeadline, sourceNewspaper, notices}`, rewrites kicker/headline/body/expert/promptVersion/modelVersion from `generateAlarm`, unsets `humorScore`, leaves `notices`, then `attachLeadImage`. Does not fetch other dates. Does not import Extra Extra publish.

- [ ] **Step 1: Implement the script**

```ts
const date = stockholmToday()
const alarm = await getWriteClient().fetch(
  `*[_type == "alarm" && date == $date][0]{_id, date, sourceHeadline, sourceNewspaper}`,
  {date},
)
if (!alarm) throw new Error(`Inget larm för ${date}`)
const {generated, modelVersion, promptVersion} = await generateAlarm({
  text: alarm.sourceHeadline,
  newspaperName: alarm.sourceNewspaper,
})
const id = alarm._id.replace(/^drafts\./, '')
await getWriteClient()
  .patch(id)
  .set({
    kicker: generated.kicker,
    headline: generated.headline,
    body: generated.body,
    expertVoice: generated.expertVoice,
    expertHeadline: generated.expertHeadline,
    expertText: generated.expertText,
    promptVersion,
    modelVersion,
  })
  .unset(['humorScore'])
  .commit()
const drawn = await attachLeadImage({id, date, brief: generated.imageBrief})
if (drawn.imageError) console.error(drawn.imageError)
console.log(`Uppdaterat ${date}: ${generated.headline}`)
```

Do not call this from `run-daily.ts` or Extra Extra routes. Do not loop `fetchLeadsToRewrite`.

- [ ] **Step 2: Commit**

```bash
git add scripts/refresh-today-lead.ts
git commit -m @"
Add a one-off rewrite of today's lead with a new cartoon.

"@
```

Do **not** execute the script in this task.

---

## Self-review

| Spec item | Task |
|-----------|------|
| Extra above Dagens nyheter / archive Extra first | 1 |
| Layout C on lead, expert under body, no empty frame | 2 |
| GROQ + leadIllustration | 2 |
| Claude brief + kb-v11 | 3 |
| Daily attach only on create; skip existing | 4 |
| Gemini fail does not fail the job | 4 |
| POST /api/alarm/preview-image, keep prior image on fail | 5 |
| Extra Extra never writes alarm | 5 tests + 6 (no ExtraExtraCreate change) |
| Studio custom input | 6 |
| One-off today script, not product trigger | 7 |
| RSS / notices / week leads | untouched |
| Kycklingbladet.com signature | existing `EXTRA_IMAGE_STYLE` (no new task) |
| Do not run one-off until asked | 7 |

No TBD. `attachLeadImage` returns the JPEG on success from Task 4 so Studio is not charged twice.
