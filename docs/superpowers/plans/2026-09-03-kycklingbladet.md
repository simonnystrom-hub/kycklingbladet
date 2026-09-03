# Kycklingbladet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a Swedish satirical evening paper that once a day reads Alarmindex’s highest-scoring headline, writes hen-tabloid microfiction with Claude, and publishes it to a dark newspaper site.

**Architecture:** Two sibling repos. `kycklingbladet` is Next.js 16 (App Router) plus a GitHub Action that reads Alarmindex Sanity (published scores only) and writes one `alarm` document per Stockholm calendar day. `kycklingbladet-studio` is a separate Sanity Studio for emergency edits. The public site never queries Alarmindex.

**Tech Stack:** Next.js 16.2.9, React 19, TypeScript, Tailwind v4, `@sanity/client` ^7, `@anthropic-ai/sdk`, Vitest, Sanity Studio 3, GitHub Actions (`timezone: Europe/Stockholm`).

**Spec:** `docs/superpowers/specs/2026-09-03-kycklingbladet-design.md`

## Global Constraints

- Swedish-only UI. No locale switcher, RSS, search, images, newsletter, or Alarmindex scraping.
- Visual: direction B (newsprint `#14110c`, cream type `#e8dcc4` / `#d7cbb3`, brass `#c4a574`), layout 1 (nameplate + analog clock, then a narrow reading column). Serif headlines. No Impact, no kiosk yellow, no blood-red as primary.
- Pipeline never patches an existing date. Document id `alarm-{YYYY-MM-DD}`.
- Cron: Mon–Fri 12:00, Sat–Sun 14:00, `Europe/Stockholm`.
- `revalidate = 60` on pages that read Sanity.
- Claude Sonnet via `ANTHROPIC_MODEL` (creative writing, not Haiku). Prompt version `kb-v1`.
- Alarmindex URL: `https://alarmindex.com/dag/{date}/{newspaperSlug}`.
- Skip Alarmindex snapshots unless `publicationStatus == "published"`. Skip scores with `needsReview == true`.
- Studio lives at `C:/Users/simon/projekt/kycklingbladet-studio` (sibling of this repo). Do not put Studio inside this repo.
- Do not commit `.env*`. Do not change Alarmindex code.
- Commits: one per task, from the repo that task belongs to. Never `--no-verify`. Never `git config`.

## File map

### `kycklingbladet` (this repo)

| File | Responsibility |
|------|----------------|
| `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `vitest.config.ts` | App + test tooling |
| `.env.example` | Env names only |
| `src/lib/select/select-winner.ts` | Highest `displayScore`, stable tie-break |
| `src/lib/select/stockholm-date.ts` | Today + Swedish display dates |
| `src/lib/select/alarm-id.ts` | `alarm-{date}` and create-or-skip |
| `src/lib/alarmindex/url.ts` | Alarmindex day URL |
| `src/lib/generate/parse.ts` | Extract JSON from Claude text |
| `src/lib/generate/validate.ts` | Require kicker/headline/body/tip |
| `src/lib/generate/prompt.ts` | Locked `kb-v1` prompt |
| `src/lib/generate/claude.ts` | Anthropic call + one retry |
| `src/lib/alarmindex/client.ts` | Read-only Alarmindex Sanity client |
| `src/lib/alarmindex/types.ts` | `ScoredHeadline` |
| `src/lib/alarmindex/queries.ts` | Today’s published scored headlines |
| `src/lib/sanity/client.ts` | Kycklingbladet published client |
| `src/lib/sanity/write-client.ts` | Token client for the job |
| `src/lib/sanity/types.ts` | `Alarm`, `SiteSettings` |
| `src/lib/sanity/queries.ts` | Latest / by date / archive / settings |
| `src/lib/sanity/publish.ts` | Existence check + `create` |
| `src/lib/copy.ts` | Empty-state and footer strings |
| `scripts/run-daily.ts` | Orchestrator (retries, skip, generate, publish) |
| `.github/workflows/daily.yml` | Schedule |
| `src/app/globals.css`, `layout.tsx` | Tokens, masthead chrome |
| `src/components/DoomsdayClock.tsx` | Analog clock object, caption *nästan* |
| `src/components/Masthead.tsx` | Nameplate + clock + nav |
| `src/components/SiteFooter.tsx` | Nav + disclaimer |
| `src/components/AlarmArticle.tsx` | Kicker → source line |
| `src/components/ArchiveList.tsx` | Typographic archive |
| `src/components/EmptyIssue.tsx` | Day-zero empty state |
| `src/app/page.tsx` | Latest alarm |
| `src/app/arkiv/page.tsx` | List |
| `src/app/arkiv/[date]/page.tsx` | One day + prev/next |
| `src/app/om/page.tsx` | About |
| `src/app/not-found.tsx` | Quiet 404 |
| `src/lib/select/select-winner.test.ts` | Test 1 |
| `src/lib/select/alarm-id.test.ts` | Test 2 |
| `src/lib/generate/validate.test.ts` | Test 3 |

### `kycklingbladet-studio` (sibling repo)

| File | Responsibility |
|------|----------------|
| `schemaTypes/alarm.ts`, `siteSettings.ts` | Documents |
| `structure/index.ts` | Inställningar singleton + Larm by date |
| `scripts/seed.ts` | Settings + two sample alarms |
| `sanity.config.ts`, `sanity.cli.ts` | Studio 3, no preview plugin |

---

### Task 1: Scaffold + winner selection

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `vitest.config.ts`, `next-env.d.ts`, `README.md`, `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/lib/select/select-winner.ts`, `src/lib/select/select-winner.test.ts`
- Modify: none (keep existing `.gitignore` and `docs/`)

**Interfaces:**
- Consumes: nothing
- Produces: `ScoredHeadline`; `selectWinner(headlines: ScoredHeadline[]): ScoredHeadline | null`

- [ ] **Step 1: Write the failing test**

Create `src/lib/select/select-winner.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { selectWinner, type ScoredHeadline } from './select-winner'

function h(partial: Partial<ScoredHeadline> & Pick<ScoredHeadline, 'headlineId' | 'displayScore'>): ScoredHeadline {
  return {
    text: 'x',
    newspaperName: 'Expressen',
    newspaperSlug: 'expressen',
    ...partial,
  }
}

describe('selectWinner', () => {
  it('returns null for an empty list', () => {
    expect(selectWinner([])).toBeNull()
  })

  it('picks the highest displayScore', () => {
    const winner = selectWinner([
      h({ headlineId: 'a', displayScore: 40, newspaperSlug: 'dn' }),
      h({ headlineId: 'b', displayScore: 91, newspaperSlug: 'expressen', text: 'Snösmockan' }),
      h({ headlineId: 'c', displayScore: 70, newspaperSlug: 'aftonbladet' }),
    ])
    expect(winner?.headlineId).toBe('b')
    expect(winner?.text).toBe('Snösmockan')
  })

  it('breaks ties by newspaperSlug then headlineId', () => {
    const winner = selectWinner([
      h({ headlineId: 'z', displayScore: 80, newspaperSlug: 'svd' }),
      h({ headlineId: 'm', displayScore: 80, newspaperSlug: 'dn' }),
      h({ headlineId: 'a', displayScore: 80, newspaperSlug: 'dn' }),
    ])
    expect(winner?.headlineId).toBe('a')
  })
})
```

Create `src/lib/select/select-winner.ts` that only exports the type (no `selectWinner` yet) so the test fails on the missing function:

```ts
export type ScoredHeadline = {
  headlineId: string
  text: string
  newspaperName: string
  newspaperSlug: string
  displayScore: number
}
```

Keep `ScoredHeadline` only in this file until Task 5.

- [ ] **Step 2: Write package.json and tooling so the test can run**

`package.json`:

```json
{
  "name": "kycklingbladet",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "vitest run",
    "daily": "tsx scripts/run-daily.ts"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.110.0",
    "@sanity/client": "^7.0.0",
    "next": "16.2.9",
    "react": "19.2.4",
    "react-dom": "19.2.4"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.2.9",
    "tailwindcss": "^4",
    "tsx": "^4.23.0",
    "typescript": "^5",
    "vitest": "^3.2.4"
  }
}
```

`tsconfig.json` — copy Alarmindex (`target` ES2017, `paths` `@/*` → `./src/*`, `jsx: react-jsx`, Next plugin). Include `vitest.config.ts`.

`next.config.ts`:

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  poweredByHeader: false,
}

export default nextConfig
```

`postcss.config.mjs`:

```js
const config = { plugins: { '@tailwindcss/postcss': {} } }
export default config
```

`eslint.config.mjs` — same as Alarmindex (`eslint-config-next/core-web-vitals` + `typescript`, ignore `.next/**`).

`vitest.config.ts`:

```ts
import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: { environment: 'node' },
})
```

`next-env.d.ts`:

```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />
```

Minimal app so `next build` is not required yet, but `dev` will work later:

`src/app/globals.css`:

```css
@import "tailwindcss";
```

`src/app/layout.tsx`:

```tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = { title: 'Kycklingbladet' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <body>{children}</body>
    </html>
  )
}
```

`src/app/page.tsx`:

```tsx
export default function HomePage() {
  return <p>Kycklingbladet</p>
}
```

`README.md` — Swedish getting-started: Studio in `../kycklingbladet-studio`, `npm install`, `npm run dev`, copy `.env.example` (file comes in Task 5).

Run: `npm install`

- [ ] **Step 3: Run the test and confirm it fails**

Run: `npm test`

Expected: FAIL — `selectWinner` is not exported.

- [ ] **Step 4: Implement `selectWinner`**

In `src/lib/select/select-winner.ts` add:

```ts
export function selectWinner(headlines: ScoredHeadline[]): ScoredHeadline | null {
  if (headlines.length === 0) return null
  return [...headlines].sort((a, b) => {
    if (b.displayScore !== a.displayScore) return b.displayScore - a.displayScore
    const slug = a.newspaperSlug.localeCompare(b.newspaperSlug)
    if (slug !== 0) return slug
    return a.headlineId.localeCompare(b.headlineId)
  })[0]
}
```

- [ ] **Step 5: Run tests**

Run: `npm test`

Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.ts postcss.config.mjs eslint.config.mjs vitest.config.ts next-env.d.ts README.md src
git commit -m "Add Next.js scaffold and headline winner selection."
```

---

### Task 2: Payload validation and JSON parse

**Files:**
- Create: `src/lib/generate/parse.ts`, `src/lib/generate/validate.ts`, `src/lib/generate/validate.test.ts`
- Modify: none

**Interfaces:**
- Consumes: nothing from Task 1 except the test runner
- Produces:
  - `GeneratedAlarm { kicker: string; headline: string; body: string; survivalTip: string }`
  - `parseGeneratedAlarm(text: string): unknown`
  - `validateGeneratedAlarm(input: unknown): GeneratedAlarm | null`

- [ ] **Step 1: Write the failing test**

`src/lib/generate/validate.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { parseGeneratedAlarm } from './parse'
import { validateGeneratedAlarm } from './validate'

const good = {
  kicker: 'Dagens skrämchock',
  headline: 'Fem centimeter snö. Nationen faller.',
  body: 'Det började klockan 08.14.\n\nGöran sitter fast i köket.',
  survivalTip: 'Tre lager dun och havre till grannen.',
}

describe('validateGeneratedAlarm', () => {
  it('accepts a complete payload', () => {
    expect(validateGeneratedAlarm(good)).toEqual(good)
  })

  it('rejects missing kicker, headline, body, or survivalTip', () => {
    expect(validateGeneratedAlarm({ ...good, kicker: '' })).toBeNull()
    expect(validateGeneratedAlarm({ ...good, headline: '   ' })).toBeNull()
    expect(validateGeneratedAlarm({ ...good, body: '' })).toBeNull()
    expect(validateGeneratedAlarm({ ...good, survivalTip: '' })).toBeNull()
    expect(validateGeneratedAlarm({ kicker: 'x', headline: 'y', body: 'z' })).toBeNull()
    expect(validateGeneratedAlarm(null)).toBeNull()
    expect(validateGeneratedAlarm('nope')).toBeNull()
  })

  it('trims string fields', () => {
    const result = validateGeneratedAlarm({
      ...good,
      kicker: '  Extra kackel  ',
    })
    expect(result?.kicker).toBe('Extra kackel')
  })
})

describe('parseGeneratedAlarm', () => {
  it('parses a raw JSON object', () => {
    expect(parseGeneratedAlarm(JSON.stringify(good))).toEqual(good)
  })

  it('parses JSON fenced in markdown', () => {
    const text = 'Här är texten:\n```json\n' + JSON.stringify(good) + '\n```\n'
    expect(parseGeneratedAlarm(text)).toEqual(good)
  })

  it('returns null for non-JSON', () => {
    expect(parseGeneratedAlarm('ursäkta jag är en höna')).toBeNull()
  })
})
```

Do not create `parse.ts` / `validate.ts` yet.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/generate/validate.test.ts`

Expected: FAIL — cannot find modules `./parse` and `./validate`.

- [ ] **Step 3: Implement parse + validate**

`src/lib/generate/parse.ts`:

```ts
export function parseGeneratedAlarm(text: string): unknown {
  const trimmed = text.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = (fenced?.[1] ?? trimmed).trim()
  try {
    return JSON.parse(candidate) as unknown
  } catch {
    const start = candidate.indexOf('{')
    const end = candidate.lastIndexOf('}')
    if (start === -1 || end <= start) return null
    try {
      return JSON.parse(candidate.slice(start, end + 1)) as unknown
    } catch {
      return null
    }
  }
}
```

`src/lib/generate/validate.ts`:

```ts
export type GeneratedAlarm = {
  kicker: string
  headline: string
  body: string
  survivalTip: string
}

function asNonEmpty(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function validateGeneratedAlarm(input: unknown): GeneratedAlarm | null {
  if (!input || typeof input !== 'object') return null
  const record = input as Record<string, unknown>
  const kicker = asNonEmpty(record.kicker)
  const headline = asNonEmpty(record.headline)
  const body = asNonEmpty(record.body)
  const survivalTip = asNonEmpty(record.survivalTip)
  if (!kicker || !headline || !body || !survivalTip) return null
  return { kicker, headline, body, survivalTip }
}
```

- [ ] **Step 4: Run tests**

Run: `npm test`

Expected: PASS, including Task 1 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/generate
git commit -m "Validate and parse generated alarm payloads."
```

---

### Task 3: Alarm id and idempotency

**Files:**
- Create: `src/lib/select/alarm-id.ts`, `src/lib/select/alarm-id.test.ts`, `src/lib/select/stockholm-date.ts`, `src/lib/alarmindex/url.ts`, `src/lib/alarmindex/url.test.ts`
- Modify: none

**Interfaces:**
- Consumes: none
- Produces:
  - `alarmIdForDate(date: string): string` → `alarm-2026-09-03`
  - `shouldCreateAlarm(existingId: string | null): boolean`
  - `stockholmToday(now?: Date): string` → `YYYY-MM-DD`
  - `formatSwedishDate(date: string): string`
  - `alarmindexDayUrl(date: string, newspaperSlug: string): string`

- [ ] **Step 1: Write failing tests**

`src/lib/select/alarm-id.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { alarmIdForDate, shouldCreateAlarm } from './alarm-id'
import { stockholmToday } from './stockholm-date'

describe('alarmIdForDate', () => {
  it('prefixes the ISO date', () => {
    expect(alarmIdForDate('2026-09-03')).toBe('alarm-2026-09-03')
  })
})

describe('shouldCreateAlarm', () => {
  it('creates when nothing exists', () => {
    expect(shouldCreateAlarm(null)).toBe(true)
  })

  it('skips when a document id is already present', () => {
    expect(shouldCreateAlarm('alarm-2026-09-03')).toBe(false)
    expect(shouldCreateAlarm('drafts.alarm-2026-09-03')).toBe(false)
  })
})

describe('stockholmToday', () => {
  it('formats a known instant as a Stockholm calendar day', () => {
    // 2026-09-03 00:30 in Stockholm is still 2026-09-02 22:30 UTC
    expect(stockholmToday(new Date('2026-09-02T22:30:00Z'))).toBe('2026-09-03')
    expect(stockholmToday(new Date('2026-09-03T22:30:00Z'))).toBe('2026-09-04')
  })
})
```

`src/lib/alarmindex/url.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { alarmindexDayUrl } from './url'

describe('alarmindexDayUrl', () => {
  it('builds the locked day-newspaper path', () => {
    expect(alarmindexDayUrl('2026-09-03', 'expressen')).toBe(
      'https://alarmindex.com/dag/2026-09-03/expressen',
    )
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL** (modules missing)

Run: `npx vitest run src/lib/select/alarm-id.test.ts src/lib/alarmindex/url.test.ts`

- [ ] **Step 3: Implement**

`src/lib/select/alarm-id.ts`:

```ts
export function alarmIdForDate(date: string): string {
  return `alarm-${date}`
}

export function shouldCreateAlarm(existingId: string | null): boolean {
  return existingId == null
}
```

`src/lib/select/stockholm-date.ts`:

```ts
export function stockholmToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Stockholm',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

export function parseIsoDateAtNoonUtc(date: string): Date {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
}

export function formatSwedishDate(date: string): string {
  const formatted = new Intl.DateTimeFormat('sv-SE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Stockholm',
  }).format(parseIsoDateAtNoonUtc(date))
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}
```

`src/lib/alarmindex/url.ts`:

```ts
export function alarmindexDayUrl(date: string, newspaperSlug: string): string {
  return `https://alarmindex.com/dag/${date}/${newspaperSlug}`
}
```

- [ ] **Step 4: Run `npm test` — all PASS**

- [ ] **Step 5: Commit**

```bash
git add src/lib/select/alarm-id.ts src/lib/select/alarm-id.test.ts src/lib/select/stockholm-date.ts src/lib/alarmindex
git commit -m "Add Stockholm dates, alarm ids, and Alarmindex URLs."
```

---

### Task 4: Sanity Studio (sibling repo)

**Files (all under `C:/Users/simon/projekt/kycklingbladet-studio`):**
- Create: `package.json`, `sanity.config.ts`, `sanity.cli.ts`, `tsconfig.json`, `.gitignore`, `.env.example`, `README.md`, `schemaTypes/alarm.ts`, `schemaTypes/siteSettings.ts`, `schemaTypes/index.ts`, `structure/index.ts`, `scripts/seed.ts`

**Interfaces:**
- Consumes: field names from the spec
- Produces: document types `alarm` and `siteSettings`; seed creates `_id: siteSettings` plus `alarm-2026-09-01` and `alarm-2026-09-02`

Do **not** run `npm create sanity` if it fights an existing folder. Write the files.

- [ ] **Step 1: Create the repo and schema**

`package.json` name `kycklingbladet-studio`, scripts `dev`/`build`/`deploy`/`seed` matching Alarmindex Studio (sanity ^3.76, react 19, `@sanity/vision`, `styled-components`). Seed: `sanity exec scripts/seed.ts --with-user-token`.

`.gitignore`: `node_modules`, `dist`, `.sanity`, `.env`.

`schemaTypes/siteSettings.ts` — singleton fields exactly: `title`, `tagline`, `about`, `alarmindexMention` (all strings/text). `title` required. Preview title `Inställningar`.

`schemaTypes/alarm.ts` — fields in this order, all required except none are optional in v1:

- `date` (date, required)
- `kicker`, `headline` (string, required)
- `body` (text, rows 12, required)
- `survivalTip` (string, required)
- `sourceHeadline`, `sourceNewspaper`, `sourceNewspaperSlug` (string, required)
- `sourceAlarmindexUrl` (url, required)
- `sourceScore` (number, required)
- `promptVersion`, `modelVersion` (string, required)

Preview: `title: headline`, `subtitle: date + kicker`.

Validation on `date`: custom async unique — GROQ `count(*[_type == "alarm" && date == $date && _id != $id]) == 0`.

`schemaTypes/index.ts` exports `[siteSettings, alarm]`.

`structure/index.ts`: list title `Kycklingbladet`; Inställningar child `documentId('siteSettings')`; divider; Larm document list `_type == "alarm"` ordered `date desc`. Hide `siteSettings` from global Create (copy Alarmindex `newDocumentOptions` / delete-duplicate filter).

`sanity.config.ts`: title `Kycklingbladet`, `projectId`/`dataset` from `SANITY_STUDIO_PROJECT_ID` / `SANITY_STUDIO_DATASET || 'production'`, plugins `structureTool({structure})` and `visionTool()`. **No preview plugin.**

`sanity.cli.ts`: same projectId/dataset env.

`scripts/seed.ts`:

```ts
import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2025-01-01'})

const settings = {
  _id: 'siteSettings',
  _type: 'siteSettings',
  title: 'Kycklingbladet',
  tagline: 'Utkommer dagligen, mot bättre vetande',
  about:
    'Kycklingbladet är en satirisk kvällstidning. Vi tar dagens mest uppblåsta rubrik och behandlar den som bokstavlig sanning. Inget av det som står här är nyhetsjournalistik.',
  alarmindexMention:
    'Vilken rubrik som vinner dagen avgörs av siffror från Alarmindex, som mäter alarmistiskt formspråk i svenska löpsedlar. Kycklingbladet är inte Alarmindex. Vi är hönan som tar siffran på orden.',
}

function sample(date: string, headline: string, sourceHeadline: string, slug: string, score: number) {
  return {
    _id: `alarm-${date}`,
    _type: 'alarm',
    date,
    kicker: 'Dagens skrämchock',
    headline,
    body:
      'Det började i hönsgården innan kaffet hunnit kallna. En ensam detalj i morgonens löpsedel utlystes till nationellt undantagstillstånd.\n\nGrannen Göran, som egentligen bara ville ha en macka, sitter fortfarande kvar. Han har slutat titta mot fönstret. MSB släppte havre över två rådjur som såg måttligt intresserade ut.',
    survivalTip: 'Stanna i redet. Tre lager dun. Havre till den som tappar proportionerna.',
    sourceHeadline,
    sourceNewspaper: slug === 'expressen' ? 'Expressen' : 'Aftonbladet',
    sourceNewspaperSlug: slug,
    sourceAlarmindexUrl: `https://alarmindex.com/dag/${date}/${slug}`,
    sourceScore: score,
    promptVersion: 'kb-v1',
    modelVersion: 'seed',
  }
}

async function run() {
  await client.createOrReplace(settings)
  await client.createOrReplace(
    sample(
      '2026-09-01',
      'Fem centimeter snö. Nationen faller.',
      'SMHI varnar: Snösmockan slår till mot Mellansverige – kan bli upp till fem centimeter',
      'expressen',
      91,
    ),
  )
  await client.createOrReplace(
    sample(
      '2026-09-02',
      'Kaffet är slut. Civilisationen vacklar.',
      'Chockhöjning på kaffet – så mycket dyrare blir din morgonkaffe',
      'aftonbladet',
      84,
    ),
  )
  console.log('Seedat.')
}

run()
```

`.env.example`:

```
SANITY_STUDIO_PROJECT_ID=
SANITY_STUDIO_DATASET=production
```

`README.md`: create a Sanity project, paste id, `npm install`, `npx sanity login`, `npm run dev`, `npm run seed`. Note that generation is **not** in this repo.

- [ ] **Step 2: Install and typecheck**

```bash
cd C:/Users/simon/projekt/kycklingbladet-studio
npm install
npx tsc --noEmit
```

Expected: clean, or only env-related noise. Fix schema type errors before continuing.

Do not create the Sanity cloud project in this task if the user has not provided an id — `.env` stays local. Schema must still compile.

- [ ] **Step 3: Git init and commit in the studio repo**

```bash
git init
git add .
git commit -m "Add Kycklingbladet Sanity Studio schema and seed."
```

Do not commit `.env`.

---

### Task 5: Sanity clients and queries

**Files:**
- Create: `.env.example`, `src/lib/sanity/client.ts`, `src/lib/sanity/write-client.ts`, `src/lib/sanity/types.ts`, `src/lib/sanity/queries.ts`, `src/lib/sanity/publish.ts`, `src/lib/alarmindex/client.ts`, `src/lib/alarmindex/types.ts`, `src/lib/alarmindex/queries.ts`
- Modify: `README.md` (env table)

**Interfaces:**
- Consumes: `ScoredHeadline`, `alarmIdForDate`, `shouldCreateAlarm`, `GeneratedAlarm`
- Produces:
  - `getLatestAlarm(): Promise<Alarm | null>`
  - `getAlarmByDate(date: string): Promise<Alarm | null>`
  - `getAlarmArchive(): Promise<Alarm[]>`
  - `getAdjacentDates(date: string): Promise<{ previous: string | null; next: string | null }>`
  - `getSiteSettings(): Promise<SiteSettings | null>`
  - `findExistingAlarmId(date: string): Promise<string | null>`
  - `publishAlarm(...): Promise<void>`
  - `fetchScoredHeadlines(date: string): Promise<ScoredHeadline[]>`

`Alarm` type:

```ts
export type Alarm = {
  _id: string
  date: string
  kicker: string
  headline: string
  body: string
  survivalTip: string
  sourceHeadline: string
  sourceNewspaper: string
  sourceNewspaperSlug: string
  sourceAlarmindexUrl: string
  sourceScore: number
  promptVersion: string
  modelVersion: string
}

export type SiteSettings = {
  title: string
  tagline: string
  about: string
  alarmindexMention: string
}
```

- [ ] **Step 1: Env example**

`.env.example`:

```
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2025-01-01
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SANITY_API_WRITE_TOKEN=
ALARMINDEX_SANITY_PROJECT_ID=
ALARMINDEX_SANITY_DATASET=production
ALARMINDEX_SANITY_API_VERSION=2025-01-01
ALARMINDEX_SANITY_READ_TOKEN=
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=
```

- [ ] **Step 2: Clients**

`src/lib/sanity/client.ts` — copy Alarmindex `getSanityClient` (`projectId` from `NEXT_PUBLIC_SANITY_PROJECT_ID`, dataset default `production`, `useCdn` in production). Export `isKycklingbladetConfigured()` true when project id is set and not `your-project-id`.

`src/lib/sanity/write-client.ts`:

```ts
import {createClient} from '@sanity/client'
import {apiVersion, dataset, projectId} from './client'

export function getWriteClient() {
  const token = process.env.SANITY_API_WRITE_TOKEN
  if (!token) throw new Error('SANITY_API_WRITE_TOKEN saknas')
  return createClient({ projectId, dataset, apiVersion, useCdn: false, token })
}
```

`src/lib/alarmindex/client.ts` — same pattern with `ALARMINDEX_SANITY_*`. Optional `ALARMINDEX_SANITY_READ_TOKEN`. `useCdn: false` (job needs fresh scores). Throw a clear error if `ALARMINDEX_SANITY_PROJECT_ID` is missing when called from the job.

- [ ] **Step 3: Queries**

`src/lib/alarmindex/queries.ts` GROQ (published snapshots only, scores that are not in review):

```
*[_type == "headlineScore"
  && defined(displayScore)
  && needsReview != true
  && headline->snapshot->date == $date
  && headline->snapshot->publicationStatus == "published"
]{
  displayScore,
  "headlineId": headline->_id,
  "text": headline->text,
  "newspaperName": headline->snapshot->newspaper->name,
  "newspaperSlug": coalesce(
    headline->snapshot->newspaper->slug.current,
    string::split(headline->snapshot->newspaper._ref, "newspaper-")[1]
  )
}
```

Map to `ScoredHeadline`, drop rows missing `text`, `newspaperSlug`, or `displayScore`.

Kycklingbladet GROQ, published perspective (default client):

- latest: `*[_type == "alarm"] | order(date desc)[0]{ ...fields }`
- by date: `*[_type == "alarm" && date == $date][0]{...}`
- archive: `*[_type == "alarm"] | order(date desc){ _id, date, kicker, headline }`
- settings: `*[_id == "siteSettings"][0]{ title, tagline, about, alarmindexMention }`

`getAdjacentDates`: fetch archive dates in memory, find previous (older) and next (newer).

If project id unset, queries return `null` / `[]` (same idea as Alarmindex `safeFetch`) so `next dev` does not crash before env exists.

- [ ] **Step 4: Publish helper**

`src/lib/sanity/publish.ts`:

```ts
import { alarmIdForDate, shouldCreateAlarm } from '@/lib/select/alarm-id'
import type { GeneratedAlarm } from '@/lib/generate/validate'
import type { ScoredHeadline } from '@/lib/select/select-winner'
import { alarmindexDayUrl } from '@/lib/alarmindex/url'
import { getWriteClient } from './write-client'

export async function findExistingAlarmId(date: string): Promise<string | null> {
  const client = getWriteClient()
  const id = alarmIdForDate(date)
  const found = await client.fetch<string | null>(
    `*[_id in [$id, $draftId]][0]._id`,
    { id, draftId: `drafts.${id}` },
  )
  return found
}

export async function publishAlarm(input: {
  date: string
  generated: GeneratedAlarm
  source: ScoredHeadline
  promptVersion: string
  modelVersion: string
}): Promise<'created' | 'skipped'> {
  const existing = await findExistingAlarmId(input.date)
  if (!shouldCreateAlarm(existing)) return 'skipped'
  const id = alarmIdForDate(input.date)
  await getWriteClient().create({
    _id: id,
    _type: 'alarm',
    date: input.date,
    kicker: input.generated.kicker,
    headline: input.generated.headline,
    body: input.generated.body,
    survivalTip: input.generated.survivalTip,
    sourceHeadline: input.source.text,
    sourceNewspaper: input.source.newspaperName,
    sourceNewspaperSlug: input.source.newspaperSlug,
    sourceAlarmindexUrl: alarmindexDayUrl(input.date, input.source.newspaperSlug),
    sourceScore: input.source.displayScore,
    promptVersion: input.promptVersion,
    modelVersion: input.modelVersion,
  })
  return 'created'
}
```

Use `create`, never `createOrReplace`.

- [ ] **Step 5: Commit**

```bash
git add .env.example src/lib/sanity src/lib/alarmindex README.md
git commit -m "Add Sanity read/write clients for Kycklingbladet and Alarmindex."
```

---

### Task 6: Prompt, Claude, daily orchestrator, GitHub Action

**Files:**
- Create: `src/lib/generate/prompt.ts`, `src/lib/generate/claude.ts`, `src/lib/copy.ts`, `scripts/run-daily.ts`, `.github/workflows/daily.yml`
- Modify: none

**Interfaces:**
- Consumes: `selectWinner`, `fetchScoredHeadlines`, `publishAlarm`, `findExistingAlarmId`, `shouldCreateAlarm`, `stockholmToday`, `parseGeneratedAlarm`, `validateGeneratedAlarm`
- Produces: `PROMPT_VERSION = 'kb-v1'`; `runDaily(now?: Date): Promise<void>` (used by the script)

- [ ] **Step 1: Prompt module**

`src/lib/generate/prompt.ts` — export `PROMPT_VERSION = 'kb-v1'` and `buildUserPrompt(source: { text: string; newspaperName: string })`.

System prompt (exact string in the file):

```
Du skriver Kycklingbladet, en satirisk svensk kvällstidning som är en höna.

Du får en verklig nyhetsrubrik. Behandla den som absolut, bokstavlig sanning. Skriv absurd mikrofiktion.

Regler:
- Dramatiska ord (katastrof, dödsfälla, undantagstillstånd, samhällskollaps) för vardagliga ting.
- En ointresserad statist som bara vill äta i fred.
- Noll proportioner: fem centimeter snö är en asteroid.
- Hönan ska synas i själva berättelsen (hönsgård, rede, havre, kackel) — inte bara som dekoration. Det är fortfarande nyhetssatir, inte en ramsa av ordvitsar.
- Svenska. Inga emoji, hashtags eller engelska meningar.
- Skriv inte att det är satir. Skriv inte om poäng, index, formspråk eller Alarmindex.
- Rubriken du skriver är Kycklingbladets egen: mer uppskruvad än originalet, men igenkännbar. Kopiera inte originalet ordagrant.
- Kicker är en kort stämpel i samma register som «Dagens skrämchock» eller «Nationellt hönslarm».

Svara med ENDAST ett JSON-objekt:
{
  "kicker": "string",
  "headline": "string",
  "body": "string med stycken åtskilda av \\n\\n",
  "survivalTip": "en mening"
}
```

User prompt includes newspaper name and the source headline in quotes.

- [ ] **Step 2: Claude wrapper**

`src/lib/generate/claude.ts`:

```ts
import Anthropic from '@anthropic-ai/sdk'
import { parseGeneratedAlarm } from './parse'
import { validateGeneratedAlarm, type GeneratedAlarm } from './validate'
import { buildUserPrompt, PROMPT_VERSION, SYSTEM_PROMPT } from './prompt'

export function resolveModel(): string {
  return process.env.ANTHROPIC_MODEL?.trim() || 'claude-sonnet-4-5-20250929'
}

export async function generateAlarm(source: {
  text: string
  newspaperName: string
}): Promise<{ generated: GeneratedAlarm; modelVersion: string; promptVersion: string }> {
  const model = resolveModel()
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY saknas')

  const call = async () => {
    const message = await anthropic.messages.create({
      model,
      max_tokens: 1200,
      temperature: 0.9,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserPrompt(source) }],
    })
    const text = message.content
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('\n')
    const parsed = parseGeneratedAlarm(text)
    const generated = validateGeneratedAlarm(parsed)
    if (!generated) throw new Error('Claude-svaret saknade kicker, rubrik, brödtext eller tips')
    return generated
  }

  try {
    const generated = await call()
    return { generated, modelVersion: model, promptVersion: PROMPT_VERSION }
  } catch (first) {
    const generated = await call()
    return { generated, modelVersion: model, promptVersion: PROMPT_VERSION }
  }
}
```

One retry on any failure of `call()`. If the second throws, let it throw.

- [ ] **Step 3: Orchestrator**

`src/lib/copy.ts`:

```ts
export const EMPTY_HOME =
  'Hönan ruvar. Första numret landar vid middag, mot bättre vetande.'
export const EMPTY_ARCHIVE = 'Inga larm i arkivet ännu. Hönan samlar sig.'
export const FOOTER_DISCLAIMER =
  'Satir. Inte nyheter. Andas genom näbben.'
```

`scripts/run-daily.ts` (relative imports, no `@/`):

```ts
import { stockholmToday } from '../src/lib/select/stockholm-date'
import { selectWinner } from '../src/lib/select/select-winner'
import { shouldCreateAlarm } from '../src/lib/select/alarm-id'
import { fetchScoredHeadlines } from '../src/lib/alarmindex/queries'
import { findExistingAlarmId, publishAlarm } from '../src/lib/sanity/publish'
import { generateAlarm } from '../src/lib/generate/claude'

const RETRIES = 3
const WAIT_MS = 10 * 60 * 1000

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function headlinesWithRetry(date: string) {
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    const headlines = await fetchScoredHeadlines(date)
    if (headlines.length > 0) return headlines
    if (attempt < RETRIES) {
      console.log(`Inga Alarmindex-rubriker för ${date} (försök ${attempt}/${RETRIES}). Väntar 10 min.`)
      await sleep(WAIT_MS)
    }
  }
  throw new Error(`Inga publicerade Alarmindex-rubriker för ${date}`)
}

export async function runDaily(now = new Date()) {
  const date = process.env.FORCE_DATE?.trim() || stockholmToday(now)
  const existing = await findExistingAlarmId(date)
  if (!shouldCreateAlarm(existing)) {
    console.log(`Hoppar över ${date}: larm finns redan (${existing})`)
    return
  }
  const headlines = await headlinesWithRetry(date)
  const winner = selectWinner(headlines)
  if (!winner) throw new Error('selectWinner returnerade null')
  const { generated, modelVersion, promptVersion } = await generateAlarm({
    text: winner.text,
    newspaperName: winner.newspaperName,
  })
  const result = await publishAlarm({
    date,
    generated,
    source: winner,
    promptVersion,
    modelVersion,
  })
  console.log(result === 'skipped' ? `Hoppar över ${date}` : `Publicerat ${date}: ${generated.headline}`)
}

runDaily().catch((error) => {
  console.error(error)
  process.exit(1)
})
```

If `FORCE_DATE` is set (manual debug), use that date instead of today.

- [ ] **Step 4: GitHub Action**

`.github/workflows/daily.yml`:

```yaml
name: Daily issue

on:
  schedule:
    - cron: "0 12 * * 1-5"
      timezone: Europe/Stockholm
    - cron: "0 14 * * 0,6"
      timezone: Europe/Stockholm
  workflow_dispatch:
    inputs:
      date:
        description: Tvinga datum YYYY-MM-DD (valfritt)
        required: false

concurrency:
  group: daily-issue
  cancel-in-progress: false

jobs:
  daily:
    runs-on: ubuntu-latest
    timeout-minutes: 50
    env:
      TZ: Europe/Stockholm
      NEXT_PUBLIC_SANITY_PROJECT_ID: ${{ secrets.NEXT_PUBLIC_SANITY_PROJECT_ID }}
      NEXT_PUBLIC_SANITY_DATASET: production
      SANITY_API_WRITE_TOKEN: ${{ secrets.SANITY_API_WRITE_TOKEN }}
      ALARMINDEX_SANITY_PROJECT_ID: ${{ secrets.ALARMINDEX_SANITY_PROJECT_ID }}
      ALARMINDEX_SANITY_DATASET: production
      ALARMINDEX_SANITY_READ_TOKEN: ${{ secrets.ALARMINDEX_SANITY_READ_TOKEN }}
      ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
      ANTHROPIC_MODEL: ${{ secrets.ANTHROPIC_MODEL }}
      FORCE_DATE: ${{ github.event.inputs.date }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npx tsx scripts/run-daily.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/generate/prompt.ts src/lib/generate/claude.ts src/lib/copy.ts scripts .github
git commit -m "Add daily Claude generation job and GitHub Action."
```

---

### Task 7: Visual shell (masthead, clock, footer, tokens)

**Files:**
- Create: `src/components/DoomsdayClock.tsx`, `src/components/Masthead.tsx`, `src/components/SiteFooter.tsx`
- Modify: `src/app/globals.css`, `src/app/layout.tsx`

**Interfaces:**
- Consumes: `getSiteSettings()`, `FOOTER_DISCLAIMER`
- Produces: layout chrome used by all pages

- [ ] **Step 1: Tokens and layout**

`globals.css`:

```css
@import "tailwindcss";

@theme inline {
  --font-family-serif: var(--font-serif), Georgia, "Times New Roman", serif;
}

:root {
  --bg: #14110c;
  --ink: #e8dcc4;
  --ink-muted: #d7cbb3;
  --brass: #c4a574;
  --rule: #3d3426;
}

html { background: var(--bg); color: var(--ink); }
body {
  font-family: var(--font-serif), Georgia, serif;
  background: var(--bg);
  color: var(--ink);
}
a:hover { color: var(--brass); }
```

`layout.tsx`: `lang="sv"`, load `Source_Serif_4` from `next/font/google` as `--font-serif` (latin + latin-ext). `themeColor: #14110c`. Viewport. Body: `min-h-full flex flex-col bg-[var(--bg)] text-[var(--ink)]`. Render `Masthead` then `<main className="mx-auto w-full max-w-[42rem] flex-1 px-5 py-10">{children}</main>` then `SiteFooter`.

Metadata: `title.template = '%s — Kycklingbladet'`, default title `Kycklingbladet`. Fetch settings when configured.

- [ ] **Step 2: Clock**

`DoomsdayClock`: 54×54 circle, `border: 1px solid var(--brass)`, two div hands (hour ~8deg past 11, minute near 59). Caption absolutely at the bottom: `nästan` in 7–9px brass uppercase tracking. `aria-hidden`. No digital time.

- [ ] **Step 3: Masthead + footer**

Masthead:
- Top nav centered, 10px, letter-spacing, uppercase brass: Dagens nummer `/`, Arkiv `/arkiv`, Om `/om`. Active link: cream, not brass.
- Below: flex nameplate left, clock right, bottom border brass 1px.
- Small caps tagline from settings or fallback `Utkommer dagligen, mot bättre vetande`.
- Nameplate italic serif ~2rem **Kycklingbladet** linking home.

Footer: same three links + `FOOTER_DISCLAIMER` in muted cream. Top border `--rule`.

- [ ] **Step 4: Visual check**

Run: `npm run dev`

Open `/`. Confirm dark newsprint, italic nameplate, clock on the right, narrow column. No yellow bar, no Impact.

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx src/components
git commit -m "Add newspaper masthead, doomsday clock, and dark tokens."
```

---

### Task 8: Alarm article, home, empty state

**Files:**
- Create: `src/components/AlarmArticle.tsx`, `src/components/EmptyIssue.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `Alarm`, `formatSwedishDate`, `EMPTY_HOME`, `getLatestAlarm`
- Produces: front page = latest published alarm or empty state

- [ ] **Step 1: Components**

`AlarmArticle` props: `{ alarm: Alarm; showDate?: boolean }` (showDate true on home and archive day).

Order:
1. Optional date line (small caps brass) via `formatSwedishDate(alarm.date)`
2. Kicker: uppercase tracking brass
3. `h1` serif ~2rem, cream, tight leading — `alarm.headline` (Kycklingbladet’s, not source)
4. Body: split `alarm.body` on `\n\n`, each `<p className="mt-4 leading-relaxed text-[var(--ink-muted)]">`
5. Tip: top border `--rule`, italic brass, prefix `Överlevnadstips: `
6. Source: small muted. Pattern: `Ursprungligen {sourceNewspaper} · «{sourceHeadline}» ·` then a link “Alarmindex” to `sourceAlarmindexUrl` (`rel="noreferrer"` `target="_blank"`)

`EmptyIssue`: one short paragraph `EMPTY_HOME`. No fake headline.

- [ ] **Step 2: Home page**

```tsx
export const revalidate = 60

export default async function HomePage() {
  const alarm = await getLatestAlarm()
  if (!alarm) return <EmptyIssue />
  return <AlarmArticle alarm={alarm} showDate />
}
```

Metadata description: latest headline if present, else tagline.

- [ ] **Step 3: Verify**

With seed data in Sanity (or empty): `npm run dev`, open `/`. If env missing: empty state, no crash. If seed loaded: 2026-09-02 as latest (newer date). Date visible. Source line quieter than the satire.

- [ ] **Step 4: Commit**

```bash
git add src/components/AlarmArticle.tsx src/components/EmptyIssue.tsx src/app/page.tsx
git commit -m "Render the latest issue on the front page."
```

---

### Task 9: Archive, About, 404

**Files:**
- Create: `src/components/ArchiveList.tsx`, `src/app/arkiv/page.tsx`, `src/app/arkiv/[date]/page.tsx`, `src/app/om/page.tsx`, `src/app/not-found.tsx`
- Modify: none

**Interfaces:**
- Consumes: `getAlarmArchive`, `getAlarmByDate`, `getAdjacentDates`, `getSiteSettings`, `EMPTY_ARCHIVE`
- Produces: `/arkiv`, `/arkiv/[date]`, `/om`, styled 404

- [ ] **Step 1: Archive list**

Typographic list, no cards/shadows. Each row: date, kicker, headline. Link to `/arkiv/${date}`. Empty: `EMPTY_ARCHIVE`.

`/arkiv/[date]`: `notFound()` if missing. Else `AlarmArticle` + prev/next: «Föregående dag» `/arkiv/{previous}` and «Nästa dag» if those dates exist. Invalid date strings (not `^\d{4}-\d{2}-\d{2}$`) → `notFound()`.

`export const revalidate = 60` on all three pages.

- [ ] **Step 2: About**

`/om`: `h1` Om Kycklingbladet. Two text blocks from settings (`about`, `alarmindexMention`) with paragraph splits. After mention, a brass link to `https://alarmindex.com` labelled `Alarmindex`. Fallback copy = the seed strings from Task 4 if settings is null.

- [ ] **Step 3: 404**

`not-found.tsx`: “Sidan finns inte. Hönan har inte värpt hit.” Link home. Same palette.

- [ ] **Step 4: Click through**

`npm run dev`: `/`, `/arkiv`, `/arkiv/2026-09-01`, prev/next, `/om`, `/arkiv/nonsens` → 404. Confirm nav active states.

- [ ] **Step 5: Commit**

```bash
git add src/components/ArchiveList.tsx src/app/arkiv src/app/om src/app/not-found.tsx
git commit -m "Add archive, about, and a quiet 404."
```

---

### Task 10: Wire-up check and README

**Files:**
- Modify: `README.md`

**Interfaces:** none new

- [ ] **Step 1: Full test + lint + build**

```bash
npm test
npm run lint
npm run build
```

Expected: tests pass; build succeeds. If Sanity env is missing, pages still prerender empty/fallback. Fix anything that fails.

- [ ] **Step 2: README**

Must document:

1. Create Sanity project, put id in both repos’ `.env`.
2. `cd ../kycklingbladet-studio && npm i && npm run seed`.
3. Copy Alarmindex project id into `ALARMINDEX_SANITY_PROJECT_ID` (from `../alarmindex/.env.local` — do not print the secret in the README, just the variable name).
4. `npm run dev` → http://localhost:3000
5. `npm run daily` for a manual generation (needs write token + Anthropic).
6. GitHub secrets list matching `daily.yml`.
7. Studio is the only way to unpublish/edit; rerunning the job will **not** overwrite.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "Document local setup and the daily job secrets."
```

---

## Self-review (spec coverage)

| Spec requirement | Task |
|------------------|------|
| Sibling repos, Alarmindex untouched | 4, 5, 6 |
| Cron 12:00 / 14:00 Stockholm | 6 |
| Skip if alarm exists; no overwrite | 3, 5, 6 |
| Highest displayScore + tie-break | 1 |
| Published snapshots only; ignore review | 5 |
| Three in-run retries then fail | 6 |
| Claude Sonnet, prompt versioned, validate + one retry | 2, 6 |
| Own headline + hen in body + no method-speak | 6 prompt |
| `alarm` fields + `siteSettings` | 4, 5 |
| Alarmindex URL pattern | 3 |
| `/` latest, date visible, empty state | 8 |
| `/arkiv`, `/arkiv/[date]`, `/om`, 404 | 9 |
| Visual B + layout 1 | 7, 8 |
| `revalidate = 60` | 8, 9 |
| Three unit tests | 1, 2, 3 |
| Studio emergency edit | 4 |
| Module boundaries | file map |

No TBD. Types (`ScoredHeadline`, `GeneratedAlarm`, `Alarm`) are named once in Task 1/2/5 and reused.

**Manual gate after Task 10 (not a code task):** with real env, seed Studio, click home/archive/about, then optionally `npm run daily` once Alarmindex has today’s published scores.
