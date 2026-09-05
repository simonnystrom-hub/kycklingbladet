# EXTRA EXTRA Illustration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Studio preview of EXTRA EXTRA also tries to draw a locked Berglin/Larson hen cartoon with a newspaper caption; the editor can change shot type and regenerate, or publish the flash without an image; the site shows layout C.

**Architecture:** Claude still writes the flash. It also returns shot type, caption, and a scene prompt. Kycklingbladet calls Gemini (`GEMINI_API_KEY`, `gemini-3-pro-image`) with a fixed style block. Preview returns the flash plus optional base64 JPEG. Publish uploads the asset onto the `extraExtra` document. Studio never talks to Google.

**Tech Stack:** Next.js 16, Vitest, `@google/genai` (same as HolyParadox), Sanity image assets, Sanity Studio v3 custom pane, existing `EXTRA_EXTRA_SECRET` CORS API.

**Spec:** `docs/superpowers/specs/2026-09-05-extra-extra-image-design.md`

## Global Constraints

- Never scrape alarmindex.com. Never overwrite lead, notices, or lead source.
- At most one EXTRA EXTRA per Stockholm day; 409 if it exists; delete to replace.
- Stamp is exactly `EXTRA EXTRA`. No expert box. No text in the drawing. No humans in the drawing.
- Style is always Berglin/Larson, black-and-white/grayscale, hens and roosters only.
- Caption is who/where/what, under the drawing, never burned into the image.
- Image is optional. Flash preview and publish must succeed if Gemini fails.
- Two repos: `C:\Users\simon\projekt\kycklingbladet` and `C:\Users\simon\projekt\kycklingbladet-studio`.
- Env: `GEMINI_API_KEY` on the Next app only (same Google key as HolyParadox). Optional `GEMINI_IMAGE_MODEL` default `gemini-3-pro-image`. Do not commit keys. Do not print keys.
- Do not commit unrelated prompt WIP in `src/lib/generate/prompt.ts`, `hen-lexicon.ts`, or their tests.
- Windows PowerShell commits use `git commit -m @" ... "@`.

## File map

| File | Responsibility |
|------|----------------|
| `src/lib/generate/extra-image.ts` | Shot types, image-brief validation, locked style prompt, Gemini prompt builder |
| `src/lib/generate/extra.ts` | Flash validation; optional image brief on the generated extra |
| `src/lib/generate/extra-prompt.ts` | Claude system prompt asks for shot type, caption, scene prompt |
| `src/lib/generate/claude-extra.ts` | Parse extra including image brief; bump max_tokens |
| `src/lib/extra-extra/gemini.ts` | Gemini JPEG bytes (HolyParadox `interactions.create` pattern) |
| `src/lib/extra-extra/draw.ts` | Best-effort: brief → Gemini → `{mimeType, base64}` or null + error |
| `src/lib/extra-extra/payload.ts` | Parse optional preview image payload for publish |
| `src/app/api/extra-extra/preview/route.ts` | Flash + best-effort image |
| `src/app/api/extra-extra/preview-image/route.ts` | Regenerate image only |
| `src/app/api/extra-extra/publish/route.ts` | Upload asset when image present |
| `src/lib/sanity/types.ts`, `queries.ts` | `imageUrl`, `imageCaption` |
| `src/lib/extra-extra/illustration.ts` | `extraIllustration(extra)` for render |
| `src/components/IssueExtra.tsx` | Layout C |
| `next.config.ts` | `cdn.sanity.io` remotePatterns |
| `.env.example` | `GEMINI_API_KEY`, `GEMINI_IMAGE_MODEL` |
| Studio `schemaTypes/extraExtra.ts` | image fields |
| Studio `actions/ExtraExtraCreate.tsx` | show drawing, type, regenerate |

---

### Task 1: Image brief and locked style prompt

**Files:**
- Create: `src/lib/generate/extra-image.ts`
- Test: `src/lib/generate/extra-image.test.ts`

**Interfaces:**
- Consumes: none
- Produces:
  - `export const EXTRA_IMAGE_SHOT_TYPES = ['intervju', 'incident', 'annat'] as const`
  - `export type ExtraImageShotType = (typeof EXTRA_IMAGE_SHOT_TYPES)[number]`
  - `export type ExtraImageBrief = { shotType: ExtraImageShotType; caption: string; scenePrompt: string }`
  - `export function parseExtraImageShotType(value: unknown): ExtraImageShotType | null`
  - `export function validateExtraImageBrief(input: unknown): ExtraImageBrief | null`
  - `export const EXTRA_IMAGE_STYLE` — the locked Swedish/English style block (string)
  - `export function buildGeminiImagePrompt(brief: ExtraImageBrief): string`

- [ ] **Step 1: Write the failing test**

```ts
import {describe, expect, it} from 'vitest'
import {
  buildGeminiImagePrompt,
  EXTRA_IMAGE_STYLE,
  parseExtraImageShotType,
  validateExtraImageBrief,
} from './extra-image'

describe('parseExtraImageShotType', () => {
  it('accepts the three locked types', () => {
    expect(parseExtraImageShotType('intervju')).toBe('intervju')
    expect(parseExtraImageShotType('incident')).toBe('incident')
    expect(parseExtraImageShotType('annat')).toBe('annat')
    expect(parseExtraImageShotType('portrait')).toBeNull()
    expect(parseExtraImageShotType('')).toBeNull()
  })
})

describe('validateExtraImageBrief', () => {
  const brief = {
    imageShotType: 'incident',
    imageCaption: 'Tuppen Gösta vid luckan i går kväll.',
    imagePrompt: 'A rooster by a henhouse hatch at night, simple panel.',
  }

  it('returns shot type, caption, and scene prompt', () => {
    expect(validateExtraImageBrief(brief)).toEqual({
      shotType: 'incident',
      caption: 'Tuppen Gösta vid luckan i går kväll.',
      scenePrompt: 'A rooster by a henhouse hatch at night, simple panel.',
    })
  })

  it('rejects missing caption or scene', () => {
    expect(validateExtraImageBrief({...brief, imageCaption: ''})).toBeNull()
    expect(validateExtraImageBrief({...brief, imagePrompt: ''})).toBeNull()
    expect(validateExtraImageBrief({...brief, imageShotType: 'foto'})).toBeNull()
  })
})

describe('EXTRA_IMAGE_STYLE', () => {
  it('locks Berglin/Larson, monochrome, hens only, no in-image text', () => {
    expect(EXTRA_IMAGE_STYLE).toMatch(/Berglin/i)
    expect(EXTRA_IMAGE_STYLE).toMatch(/Larson/i)
    expect(EXTRA_IMAGE_STYLE).toMatch(/monochrome|black-and-white|grayscale/i)
    expect(EXTRA_IMAGE_STYLE).toMatch(/no humans/i)
    expect(EXTRA_IMAGE_STYLE).toMatch(/hens|roosters/i)
    expect(EXTRA_IMAGE_STYLE).toMatch(/no text|no letters|no speech/i)
  })
})

describe('buildGeminiImagePrompt', () => {
  it('includes the locked style, shot type, and scene', () => {
    const prompt = buildGeminiImagePrompt({
      shotType: 'intervju',
      caption: 'Hönan Bodil i hönshuset.',
      scenePrompt: 'A hen interviewed beside a grain bin.',
    })
    expect(prompt).toContain(EXTRA_IMAGE_STYLE)
    expect(prompt).toContain('intervju')
    expect(prompt).toContain('A hen interviewed beside a grain bin.')
    expect(prompt).not.toContain('Hönan Bodil i hönshuset.')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/generate/extra-image.test.ts`

Expected: FAIL, cannot find module `./extra-image`

- [ ] **Step 3: Write minimal implementation**

```ts
export const EXTRA_IMAGE_SHOT_TYPES = ['intervju', 'incident', 'annat'] as const
export type ExtraImageShotType = (typeof EXTRA_IMAGE_SHOT_TYPES)[number]

export type ExtraImageBrief = {
  shotType: ExtraImageShotType
  caption: string
  scenePrompt: string
}

export function parseExtraImageShotType(value: unknown): ExtraImageShotType | null {
  if (value === 'intervju' || value === 'incident' || value === 'annat') return value
  return null
}

export function validateExtraImageBrief(input: unknown): ExtraImageBrief | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null
  const record = input as Record<string, unknown>
  const shotType = parseExtraImageShotType(record.imageShotType)
  const caption = typeof record.imageCaption === 'string' ? record.imageCaption.trim() : ''
  const scenePrompt = typeof record.imagePrompt === 'string' ? record.imagePrompt.trim() : ''
  if (!shotType || !caption || !scenePrompt) return null
  return {shotType, caption, scenePrompt}
}

export const EXTRA_IMAGE_STYLE = `STYLE (always, never vary):
Single-panel newspaper cartoon in the manner of Jan Berglin and Gary Larson (The Far Side).
MONOCHROME ONLY — black, white, grey. No colour.
Simple ink drawing, few details, flat shapes. Not a photograph, not a painting, not photorealistic.
Actors: hens and roosters only, anthropomorphic as farmyard characters.
NO HUMANS, no human hands, no photorealistic faces.
NO TEXT in the image: no letters, signs, logos, captions, or speech bubbles.
Aspect 3:4 portrait. One clear scene.`

export function buildGeminiImagePrompt(brief: ExtraImageBrief): string {
  return `${EXTRA_IMAGE_STYLE}

SHOT TYPE: ${brief.shotType}
SCENE: ${brief.scenePrompt}`
}
```

- [ ] **Step 4: Run tests and make sure they pass**

Run: `npx vitest run src/lib/generate/extra-image.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/generate/extra-image.ts src/lib/generate/extra-image.test.ts
git commit -m @"
Lock the EXTRA EXTRA cartoon style and shot types.

"@
```

---

### Task 2: Claude returns an image brief with the flash

**Files:**
- Modify: `src/lib/generate/extra.ts`
- Modify: `src/lib/generate/extra.test.ts`
- Modify: `src/lib/generate/extra-prompt.ts`
- Modify: `src/lib/generate/extra-prompt.test.ts`
- Modify: `src/lib/generate/claude-extra.ts` (max_tokens `1200`, prompt version `kb-extra-v2`)

**Interfaces:**
- Consumes: `validateExtraImageBrief` from `extra-image.ts`
- Produces: `GeneratedExtra` still `{headline, body}` plus optional `imageBrief: ExtraImageBrief | null`. `validateGeneratedExtra` still requires headline+body; attaches `imageBrief` when valid, else `null`. `EXTRA_WRITE_SYSTEM` JSON includes `imageShotType`, `imageCaption`, `imagePrompt`. `EXTRA_PROMPT_VERSION` is `kb-extra-v2`.

- [ ] **Step 1: Write the failing tests**

In `extra.test.ts` add:

```ts
it('attaches a valid image brief and ignores a bad one', () => {
  expect(
    validateGeneratedExtra({
      headline: 'Luckan',
      body: 'Kacklet tystnade.',
      imageShotType: 'incident',
      imageCaption: 'Tuppen Gösta vid luckan i går kväll.',
      imagePrompt: 'Rooster at the hatch.',
    }),
  ).toEqual({
    headline: 'Luckan',
    body: 'Kacklet tystnade.',
    imageBrief: {
      shotType: 'incident',
      caption: 'Tuppen Gösta vid luckan i går kväll.',
      scenePrompt: 'Rooster at the hatch.',
    },
  })
  expect(validateGeneratedExtra({headline: 'Luckan', body: 'Kacklet tystnade.'})).toEqual({
    headline: 'Luckan',
    body: 'Kacklet tystnade.',
    imageBrief: null,
  })
})
```

In `extra-prompt.test.ts` change version expectation to `kb-extra-v2` and add:

```ts
expect(EXTRA_WRITE_SYSTEM).toContain('imageShotType')
expect(EXTRA_WRITE_SYSTEM).toContain('imageCaption')
expect(EXTRA_WRITE_SYSTEM).toContain('intervju')
expect(EXTRA_WRITE_SYSTEM).toContain('ingen text i bilden')
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/generate/extra.test.ts src/lib/generate/extra-prompt.test.ts`

Expected: FAIL on missing `imageBrief` / old version / missing prompt strings

- [ ] **Step 3: Write minimal implementation**

Update `GeneratedExtra`:

```ts
import {validateExtraImageBrief, type ExtraImageBrief} from './extra-image'

export type GeneratedExtra = {
  headline: string
  body: string
  imageBrief: ExtraImageBrief | null
}
```

In `validateGeneratedExtra`, after headline/body succeed:

```ts
return {
  headline: normalizeQuotes(headline),
  body: normalizeQuotes(body),
  imageBrief: validateExtraImageBrief(record),
}
```

Bump `EXTRA_PROMPT_VERSION` to `'kb-extra-v2'`. Extend `EXTRA_WRITE_SYSTEM` JSON example with:

```
"imageShotType": "intervju" | "incident" | "annat",
"imageCaption": "string — svensk bildtext vem/var/vad, inte en one-liner",
"imagePrompt": "string — English scene for the cartoon, no text in the picture"
```

Add rules: propose the shot that fits a hen-newspaper illustration; caption never goes in the drawing; `imagePrompt` is the scene only.

In `claude-extra.ts` set `max_tokens: 1200`.

- [ ] **Step 4: Run tests and make sure they pass**

Run: `npx vitest run src/lib/generate/extra.test.ts src/lib/generate/extra-prompt.test.ts src/lib/extra-extra/payload.test.ts`

Expected: PASS. Also run `npx vitest run src/lib/generate/extra.test.ts src/lib/extra-extra/payload.test.ts` — payload tests must still pass (they do not use `GeneratedExtra`).

- [ ] **Step 5: Commit**

```bash
git add src/lib/generate/extra.ts src/lib/generate/extra.test.ts src/lib/generate/extra-prompt.ts src/lib/generate/extra-prompt.test.ts src/lib/generate/claude-extra.ts
git commit -m @"
Have Claude propose the EXTRA EXTRA cartoon brief with the flash.

"@
```

---

### Task 3: Gemini JPEG helper

**Files:**
- Create: `src/lib/extra-extra/gemini.ts`
- Test: `src/lib/extra-extra/gemini.test.ts`
- Modify: `package.json` — add dependency `@google/genai` at `^2.10.0` (same major as HolyParadox)

**Interfaces:**
- Consumes: none
- Produces: `export async function generateExtraJpeg(prompt: string): Promise<Buffer>`

Copy the call shape from `C:\Users\simon\projekt\holyparadox\src\lib\illustration\gemini.ts`: `GoogleGenAI`, `interactions.create`, `response_format: { type: 'image', mime_type: 'image/jpeg', aspect_ratio: '3:4', image_size: '1K' }`, `interaction.output_image.data` as base64. Default model `process.env.GEMINI_IMAGE_MODEL?.trim() || 'gemini-3-pro-image'`. Missing `GEMINI_API_KEY` throws `new Error('GEMINI_API_KEY saknas')`. Quota 429: throw `new Error('Kunde inte rita bilden')` after retries matching HolyParadox (3 attempts, 15s×attempt sleep on quota). Other errors: `new Error('Kunde inte rita bilden')` so Studio never sees Google internals.

- [ ] **Step 1: Write the failing test**

```ts
import {beforeEach, describe, expect, it, vi} from 'vitest'

const create = vi.fn()

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    interactions = {create}
    constructor(_opts: {apiKey: string}) {}
  },
}))

describe('generateExtraJpeg', () => {
  beforeEach(() => {
    vi.resetModules()
    create.mockReset()
    process.env.GEMINI_API_KEY = 'test-key'
    delete process.env.GEMINI_IMAGE_MODEL
  })

  it('returns jpeg bytes from Gemini', async () => {
    create.mockResolvedValue({output_image: {data: Buffer.from('jpeg').toString('base64')}})
    const {generateExtraJpeg} = await import('./gemini')
    const bytes = await generateExtraJpeg('a hen at the hatch')
    expect(Buffer.from(bytes).toString()).toBe('jpeg')
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gemini-3-pro-image',
        input: 'a hen at the hatch',
        response_format: expect.objectContaining({
          type: 'image',
          mime_type: 'image/jpeg',
          aspect_ratio: '3:4',
        }),
      }),
    )
  })

  it('throws a Swedish error when the key is missing', async () => {
    delete process.env.GEMINI_API_KEY
    const {generateExtraJpeg} = await import('./gemini')
    await expect(generateExtraJpeg('scene')).rejects.toThrow('GEMINI_API_KEY saknas')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/extra-extra/gemini.test.ts`

Expected: FAIL, cannot find module `./gemini`

- [ ] **Step 3: Install dependency and implement**

```bash
npm install @google/genai@^2.10.0
```

Implement `generateExtraJpeg` as specified. Do not log the API key.

- [ ] **Step 4: Run tests and make sure they pass**

Run: `npx vitest run src/lib/extra-extra/gemini.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/lib/extra-extra/gemini.ts src/lib/extra-extra/gemini.test.ts
git commit -m @"
Draw EXTRA EXTRA cartoons with Gemini, 3:4 JPEG.

"@
```

---

### Task 4: Best-effort draw + preview image payload

**Files:**
- Create: `src/lib/extra-extra/draw.ts`
- Test: `src/lib/extra-extra/draw.test.ts`
- Modify: `src/lib/extra-extra/payload.ts`
- Modify: `src/lib/extra-extra/payload.test.ts`

**Interfaces:**
- Consumes: `ExtraImageBrief`, `buildGeminiImagePrompt`, `generateExtraJpeg`
- Produces:
  - `export type ExtraPreviewImage = { mimeType: 'image/jpeg'; base64: string }`
  - `export type ExtraDrawResult = { image: ExtraPreviewImage | null; imageError: string | null }`
  - `export async function drawExtraImage(brief: ExtraImageBrief | null): Promise<ExtraDrawResult>`
  - `export function parseExtraPreviewImage(input: unknown): ExtraPreviewImage | null`

`drawExtraImage(null)` returns `{image: null, imageError: null}`. On success, `base64` is `buffer.toString('base64')`, `imageError` null. On throw, `{image: null, imageError: error.message}`.

`parseExtraPreviewImage` accepts `{mimeType: 'image/jpeg', base64: string}` with non-empty base64; otherwise null.

Extend `ExtraExtraPreview` with optional `imageShotType`, `imageCaption`, `imagePrompt` (all strings). `parseExtraPreview` still requires the existing string fields. If the three image strings are present and valid via `validateExtraImageBrief({imageShotType, imageCaption, imagePrompt})`, include them on the returned preview; if any image string is present but the brief is invalid, return null for the whole preview (do not publish a broken brief). If all three image strings are absent, return the flash-only preview (publish without image).

- [ ] **Step 1: Write the failing tests**

`draw.test.ts`: mock `./gemini` `generateExtraJpeg`. Assert null brief → no call; resolved buffer → jpeg base64; rejected error → `imageError` Swedish message, `image` null.

`payload.test.ts`: existing tests still pass. Add: preview with valid image fields round-trips those three strings; preview without them still parses; `parseExtraPreviewImage` happy path and rejects `image/png` / empty base64.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/extra-extra/draw.test.ts src/lib/extra-extra/payload.test.ts`

Expected: FAIL missing `draw` / missing image field behaviour

- [ ] **Step 3: Implement `draw.ts` and extend `payload.ts`**

Keep `STRING_FIELDS` as the required flash fields. After building the flash object, read optional image strings. Treat missing or `''` as absent (flash-only preview). If any image field is a non-empty string, all three must form a valid brief or `parseExtraPreview` returns null.

- [ ] **Step 4: Run tests and make sure they pass**

Run: `npx vitest run src/lib/extra-extra/draw.test.ts src/lib/extra-extra/payload.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/extra-extra/draw.ts src/lib/extra-extra/draw.test.ts src/lib/extra-extra/payload.ts src/lib/extra-extra/payload.test.ts
git commit -m @"
Turn an EXTRA EXTRA brief into an optional preview JPEG.

"@
```

---

### Task 5: Preview and regenerate API routes

**Files:**
- Modify: `src/app/api/extra-extra/preview/route.ts`
- Create: `src/app/api/extra-extra/preview-image/route.ts`

**Interfaces:**
- Consumes: `generateExtra`, `drawExtraImage`, `parseExtraImageShotType`, `validateExtraImageBrief`, `parseExtraPreview`
- Produces: Preview JSON `{ preview, image, imageError }`. `image` is `ExtraPreviewImage | null`. `imageError` is `string | null`. Preview-image POST body `{ preview, shotType }`. `shotType` optional; if valid, overrides `preview` shot type before `drawExtraImage`. Same auth/CORS as preview.

Preview must **not** 400 when Gemini fails. After a successful flash, always 200 with `image` null and `imageError` set.

- [ ] **Step 1: Write the failing route tests if none exist**

There are no route tests today. Add `src/app/api/extra-extra/preview-image/route.test.ts` that imports `parseExtraImageShotType` behaviour only if you prefer to keep HTTP untested — **do not skip the route wiring**. Add `src/lib/extra-extra/preview-body.ts` if that keeps HTTP thin:

`export function extraPreviewResponse(preview: ExtraExtraPreview, draw: ExtraDrawResult)` returns `{preview, image: draw.image, imageError: draw.imageError}`.

Test that helper in `src/lib/extra-extra/preview-body.test.ts`. Then wire routes to it.

`preview-image` logic helper `src/lib/extra-extra/regenerate.ts`:

```ts
export function briefFromPreview(
  preview: ExtraExtraPreview,
  shotType: unknown,
): ExtraImageBrief | null
```

Uses `validateExtraImageBrief` on preview fields, then if `parseExtraImageShotType(shotType)` is set, replace `shotType` on the brief (keep caption and scenePrompt). If brief is null, return null (caller draws nothing and sets `imageError` to `'Saknar bildunderlag'`).

- [ ] **Step 2: Run helper tests to verify they fail**

Run: `npx vitest run src/lib/extra-extra/preview-body.test.ts src/lib/extra-extra/regenerate.test.ts`

Expected: FAIL missing modules

- [ ] **Step 3: Implement helpers and routes**

`preview/route.ts` after `generateExtra`:

```ts
const preview = {
  kicker: EXTRA_KICKER,
  headline: result.generated.headline,
  body: result.generated.body,
  sourceUrl: payload.url,
  sourceHeadline: source.headline,
  sourceNewspaper: source.paper.name,
  sourceNewspaperSlug: source.paper.slug,
  promptVersion: result.promptVersion,
  modelVersion: result.modelVersion,
  imageShotType: result.generated.imageBrief?.shotType ?? '',
  imageCaption: result.generated.imageBrief?.caption ?? '',
  imagePrompt: result.generated.imageBrief?.scenePrompt ?? '',
}
const draw = await drawExtraImage(result.generated.imageBrief)
return json(extraPreviewResponse(preview, draw))
```

If image fields are empty strings, `parseExtraPreview` on publish must treat them as absent — implement that in Task 4: empty strings count as absent, not as invalid.

`preview-image/route.ts`: auth, parse JSON, `parseExtraPreview(payload.preview)`, `briefFromPreview(preview, payload.shotType)`, `drawExtraImage(brief)`, `extraPreviewResponse({...preview, imageShotType: brief?.shotType ?? preview.imageShotType}, draw)`. If brief is null, return 200 `{preview, image: null, imageError: 'Saknar bildunderlag'}`.

- [ ] **Step 4: Run tests and make sure they pass**

Run: `npx vitest run src/lib/extra-extra/preview-body.test.ts src/lib/extra-extra/regenerate.test.ts src/lib/extra-extra/payload.test.ts`

Expected: PASS. Empty image strings on preview still `parseExtraPreview` as flash-only.

- [ ] **Step 5: Commit**

```bash
git add src/lib/extra-extra/preview-body.ts src/lib/extra-extra/preview-body.test.ts src/lib/extra-extra/regenerate.ts src/lib/extra-extra/regenerate.test.ts src/app/api/extra-extra/preview/route.ts src/app/api/extra-extra/preview-image/route.ts
git commit -m @"
Preview EXTRA EXTRA with a best-effort cartoon; allow redraw.

"@
```

---

### Task 6: Publish uploads the Sanity image

**Files:**
- Modify: `src/app/api/extra-extra/publish/route.ts`

**Interfaces:**
- Consumes: `parseExtraPreview`, `parseExtraPreviewImage`, `getWriteClient`
- Produces: `client.assets.upload('image', buffer, {filename, contentType})` then `client.create` includes `image: {_type: 'image', asset: {_type: 'reference', _ref: asset._id}}`, `imageCaption`, `imageShotType`, `imagePrompt` when both preview brief and image parse. Flash-only create stays as today when image is missing.

Filename: `extra-extra-${date}.jpg`.

- [ ] **Step 1: Extract upload+doc builder for tests**

Create `src/lib/extra-extra/publish-doc.ts`:

```ts
export type ExtraPublishAsset = {_id: string}

export function extraCreateDocument(input: {
  id: string
  date: string
  preview: ExtraExtraPreview
  asset: ExtraPublishAsset | null
  createdAt: string
}): Record<string, unknown>
```

Test: without asset, no `image` key. With asset and valid brief fields on preview, includes image ref and caption.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/extra-extra/publish-doc.test.ts`

Expected: FAIL missing module

- [ ] **Step 3: Implement builder and wire publish route**

```ts
const preview = parseExtraPreview(payload.preview)
const image = parseExtraPreviewImage(payload.image)
let asset: ExtraPublishAsset | null = null
if (image) {
  const uploaded = await client.assets.upload(
    'image',
    Buffer.from(image.base64, 'base64'),
    {filename: `extra-extra-${date}.jpg`, contentType: image.mimeType},
  )
  asset = {_id: uploaded._id}
}
await client.create(extraCreateDocument({id, date, preview, asset, createdAt: new Date().toISOString()}))
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/lib/extra-extra/publish-doc.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/extra-extra/publish-doc.ts src/lib/extra-extra/publish-doc.test.ts src/app/api/extra-extra/publish/route.ts
git commit -m @"
Store the EXTRA EXTRA cartoon on the document when one exists.

"@
```

---

### Task 7: Site query and layout C

**Files:**
- Create: `src/lib/extra-extra/illustration.ts`
- Test: `src/lib/extra-extra/illustration.test.ts`
- Modify: `src/lib/sanity/types.ts`
- Modify: `src/lib/sanity/queries.ts`
- Modify: `src/components/IssueExtra.tsx`
- Modify: `next.config.ts`
- Modify: `.env.example`

**Interfaces:**
- Consumes: `ExtraExtra`
- Produces: `extraIllustration(extra): {url: string; caption: string} | null` when both `imageUrl` and `imageCaption` are non-empty strings.

Add to `ExtraExtra`: `imageUrl?: string | null; imageCaption?: string | null`.

GROQ extra fields: `"imageUrl": image.asset->url`, `imageCaption`.

`next.config.ts`:

```ts
images: {
  remotePatterns: [{protocol: 'https', hostname: 'cdn.sanity.io'}],
},
```

`IssueExtra` layout:

- If `extraIllustration(extra)` is null, current text-only tree.
- Else: after `h2`, a wrapper `lg:grid lg:grid-cols-[1fr_minmax(12rem,38%)] lg:gap-10 lg:items-start`.
- Left: paragraphs + source line.
- Right (order on mobile first): `<figure className="mt-5 lg:mt-0 lg:col-start-2 lg:row-start-1">` with `next/image` fill or `width`/`height` using `sizes="(min-width: 1024px) 38vw, 100vw"`, `className="h-auto w-full bg-[#f3ead6]"`, `style={{objectFit: 'contain'}}`. Light panel, thin `border` `--rule`. Caption `<figcaption className="mt-2 text-xs italic text-[var(--brass)] lg:text-sm">`.
- Mobile DOM order: headline, figure, body, source. Use `lg:col-start-2` so the figure is the right column on desktop while coming first in the grid on large screens… **On mobile the figure must be between headline and body.** Structure:

```tsx
<h2>...</h2>
<div className="lg:grid lg:grid-cols-[1fr_minmax(12rem,38%)] lg:gap-10 lg:items-start">
  {illustration ? (
    <figure className="mt-5 lg:mt-0 lg:col-start-2 lg:row-span-2">
      <div className="border border-[var(--rule)] bg-[#f3ead6] p-2">
        <Image src={illustration.url} alt={illustration.caption} width={768} height={1024} className="h-auto w-full" />
      </div>
      <figcaption className="mt-2 text-xs italic leading-relaxed text-[var(--brass)] lg:text-sm">
        {illustration.caption}
      </figcaption>
    </figure>
  ) : null}
  <div className={illustration ? 'lg:col-start-1 lg:row-start-1' : undefined}>
    {paragraphs}
    {source}
  </div>
</div>
```

`.env.example` add:

```
GEMINI_API_KEY=
# GEMINI_IMAGE_MODEL=gemini-3-pro-image
```

- [ ] **Step 1: Write illustration tests**

```ts
it('requires url and caption', () => {
  expect(extraIllustration({...base, imageUrl: 'https://cdn.sanity.io/x.jpg', imageCaption: 'Tuppen Gösta.'})).toEqual({
    url: 'https://cdn.sanity.io/x.jpg',
    caption: 'Tuppen Gösta.',
  })
  expect(extraIllustration({...base, imageUrl: '', imageCaption: 'x'})).toBeNull()
  expect(extraIllustration(base)).toBeNull()
})
```

Use the existing extra fixture shape from `has-extra.test.ts`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/extra-extra/illustration.test.ts`

Expected: FAIL missing module

- [ ] **Step 3: Implement helper, types, query, IssueExtra, next.config, env example**

Copy `GEMINI_API_KEY` from HolyParadox `.env.local` into Kycklingbladet `.env.local` without printing it (same pattern as Extra Extra secret). Do not git-add `.env.local`.

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/lib/extra-extra/illustration.test.ts src/lib/extra-extra/has-extra.test.ts src/lib/rss.test.ts`

Expected: PASS. `hasExtraExtra` still ignores image.

- [ ] **Step 5: Commit**

```bash
git add src/lib/extra-extra/illustration.ts src/lib/extra-extra/illustration.test.ts src/lib/sanity/types.ts src/lib/sanity/queries.ts src/components/IssueExtra.tsx next.config.ts .env.example
git commit -m @"
Show the EXTRA EXTRA cartoon beside the flash on a wide screen.

"@
```

---

### Task 8: Studio schema and Skapa dagens UI

**Files:**
- Modify: `C:\Users\simon\projekt\kycklingbladet-studio\schemaTypes\extraExtra.ts`
- Modify: `C:\Users\simon\projekt\kycklingbladet-studio\actions\ExtraExtraCreate.tsx`

**Interfaces:**
- Consumes: preview JSON `{preview, image, imageError}`, preview-image POST `{preview, shotType}`
- Produces: Studio shows `<img src={`data:${image.mimeType};base64,${image.base64}`}>` when `image` is set. Shot type `<select>`: Intervju / Incident / Annat. Button **Generera om bild** calls `/api/extra-extra/preview-image`. Publish POST `{preview, image}` where `image` is the current preview image or omitted. `imageError` in a caution card. Publish enabled with or without image (still requires flash preview). Empty `imageShotType` on first preview: select defaults to `annat` if preview field empty.

Schema fields (readOnly except the editor never edits them by hand — still readOnly):

- `image` type `image`, title `Teckning`
- `imageCaption` string, title `Bildtext`
- `imageShotType` string, hidden
- `imagePrompt` string, hidden

- [ ] **Step 1: Extend ExtraExtraCreate types and post union**

```ts
type ExtraPreviewImage = {mimeType: 'image/jpeg'; base64: string}

async function post(
  path: '/api/extra-extra/preview' | '/api/extra-extra/preview-image' | '/api/extra-extra/publish',
  body: unknown,
)
```

State: `image: ExtraPreviewImage | null`, `imageError: string`, `shotType: ExtraImageShotType`. After preview, set shot from `preview.imageShotType` if valid.

Select options: `{value: 'intervju', title: 'Intervju'}`, incident, annat.

**Generera om bild** disabled when no preview or busy. On click, `post('/api/extra-extra/preview-image', {preview, shotType})`, replace `preview` (updated shot type), `image`, `imageError`.

Publish: `post('/api/extra-extra/publish', {preview, image: image ?? undefined})`.

- [ ] **Step 2: Typecheck Studio**

Run: `npx tsc --noEmit` in `C:\Users\simon\projekt\kycklingbladet-studio`

Expected: PASS

- [ ] **Step 3: Commit in the studio repo**

```bash
git add schemaTypes/extraExtra.ts actions/ExtraExtraCreate.tsx
git commit -m @"
Let Studio preview, switch shot, and redraw the EXTRA EXTRA cartoon.

"@
```

- [ ] **Step 4: Manual check (not optional)**

With Next on `:3001` and Studio on `:3333`, paste an allowlisted URL, confirm flash + cartoon or a drawing error without blocking publish. Change type, regenerate, confirm new image. Publish without image still works if you never got a drawing.

---

## Self-review

| Spec item | Task |
|-----------|------|
| Hens only, no humans, no in-image text, Berglin/Larson lock | 1, 2 |
| Newspaper caption who/where/what | 1, 2 |
| Claude proposes type; editor can change and regenerate | 2, 5, 8 |
| Preview tries image; publish without image | 4, 5, 6 |
| Layout C, no empty frame | 7 |
| Gemini same key/model as HolyParadox | 3, 7 env |
| Sanity image on extraExtra | 6, 8 |
| RSS text-only | no RSS change (intentional) |
| 409 one-per-day | unchanged publish |
| Gemini fail does not fail flash preview | 4, 5 |
| No generate on published docs | 8 |
| Tests without live Google | 1–7 mocks |
| Aspect 3:4 | 1, 3 |

No TBD. Types `ExtraImageBrief`, `ExtraPreviewImage`, `ExtraDrawResult` are used consistently across tasks.
