# Kycklingbladet

**Date:** 2026-09-03  
**Status:** Draft for review  
**Goal:** A daily satirical evening paper that takes Sweden’s most inflated headline and treats it as literal truth — automatically, in a hen-tabloid voice.

---

## Summary

Kycklingbladet is a new site, not a feature on Alarmindex. Alarmindex already scrapes and scores Swedish front pages. Kycklingbladet **reads** that published data once a day, picks the highest-scoring headline, and publishes one satirical issue.

Two sibling repos, same pattern as Alarmindex / Holy Paradox:

| Repo | Role |
|------|------|
| `kycklingbladet` | Next.js site + daily generation job |
| `kycklingbladet-studio` | Sanity Studio (emergency edit, About copy, unpublish) |

v1 is the newspaper itself: today’s issue, archive, About, dark “funeral-home-with-a-twinkle” visual, fully automatic publish. No scraping, no images, no newsletter, no search, no RSS.

---

## Out of scope (v1)

- Scraping headlines (Alarmindex already does this)
- Writing generation into the Alarmindex pipeline
- Human review before publish
- AI images or photography
- Accounts, comments, search, RSS, newsletter
- Overwriting an already published date from the pipeline
- Sharing Alarmindex’s Sanity project

---

## Architecture

```
Alarmindex Sanity (untouched)
  published headlines + displayScore
        │
        │  read-only, server-side, once per day
        ▼
GitHub Action in kycklingbladet
  12:00 weekdays / 14:00 weekends, Europe/Stockholm
        │
        ├─ skip if an alarm already exists for that date
        ├─ pick today’s published headline with highest displayScore
        ├─ Claude writes kicker, Kycklingbladet headline, body, survival tip
        └─ create published `alarm` in Kycklingbladet Sanity
                │
                ▼
Next.js (kycklingbladet) reads only Kycklingbladet Sanity
```

The browser never talks to Alarmindex. Source credit (newspaper, original headline, Alarmindex URL) is copied onto the `alarm` document at generation time.

**LLM:** Anthropic Claude Sonnet (creative writing), not Haiku. Alarmindex uses Haiku for scoring; this job writes fiction. Model id is an env default (`ANTHROPIC_MODEL`), stored on each document as `modelVersion`. Prompt lives in code, version-stamped (`promptVersion`).

**Sanity:** a new project and dataset (`production`). Studio is a separate repo at `../kycklingbladet-studio`.

**Hosting:** Vercel for the Next.js app (same as the sibling sites). Studio via Sanity’s hosting. Secrets: Kycklingbladet Sanity project id + write token, Alarmindex Sanity project id + read token, `ANTHROPIC_API_KEY`.

---

## Daily job

Schedule (Europe/Stockholm, including DST):

| Day | Time |
|-----|------|
| Mon–Fri | 12:00 |
| Sat–Sun | 14:00 |

Alarmindex typically finishes around 08:00 weekdays / 10:00 weekends. The later Kycklingbladet slot is deliberate.

### Steps

1. Resolve “today” in `Europe/Stockholm` as `YYYY-MM-DD`.
2. If a Kycklingbladet `alarm` already exists for that date (draft or published): exit 0, do nothing.
3. Fetch today’s **published** Alarmindex headlines that have a `headlineScore` with `displayScore`. Ignore drafts and headlines waiting for review.
4. If none: retry up to three times in the same run (wait ~10 minutes between attempts). Still none: fail the Action (email via GitHub). Site stays on the previous issue.
5. Winner = highest `displayScore`. Ties: first in a stable sort by newspaper slug, then headline id. Same newspaper may win consecutive days.
6. Call Claude with the locked prompt, winner text, newspaper name, and score.
7. Validate the payload: non-empty `kicker`, `headline`, `body`, `survivalTip`. On failure: one retry. Still invalid: fail the Action, publish nothing.
8. Create a published `alarm` in Kycklingbladet Sanity. Never patch an existing date.

Manual rerun: GitHub Actions “Run workflow”. If today’s document already exists, the job still no-ops; delete or unpublish in Studio first if a regeneration is needed.

---

## Voice and generation

Alarmindex is a measurement project. Kycklingbladet is a hen evening paper. The site must not sound like a methodology page.

### What Claude writes

| Field | Rule |
|-------|------|
| `kicker` | A short Kycklingbladet stamp (`Dagens skrämchock`, `Nationellt hönslarm`, or a new one in the same register). Never Alarmindex vocabulary (index, score, formspråk, metod). |
| `headline` | Kycklingbladet’s own headline — more inflated than the source, still recognizable. Not a copy of `sourceHeadline`. |
| `body` | Microfiction that treats the source headline as literal truth. Dramatic words for mundane things. An uninterested extra who just wants a sandwich. Zero proportion (5 cm of snow = asteroid). **Hen imagery in the story itself**, not only in chrome: the extra can be a hen, MSB drops oats, the kitchen is a coop. Still news satire, not a string of chicken puns. Swedish. |
| `survivalTip` | One sentence, same deadpan seriousness, with hen flavor. |

### What Claude must not write

- Alarmindex method-speak or score commentary
- A disclaimer that “this is satire” inside the article (that lives on `/om`)
- English, hashtags, or emoji

Prompt version is stored on each `alarm` so later tone tweaks do not rewrite history.

---

## Content model

### `alarm` (one per calendar day)

| Field | Type | Notes |
|-------|------|--------|
| `date` | date | Unique. Format `YYYY-MM-DD`. Stockholm calendar day. |
| `kicker` | string | Site stamp above the headline |
| `headline` | string | Kycklingbladet’s headline |
| `body` | text | Satirical story, plain text with paragraph breaks |
| `survivalTip` | string | One sentence |
| `sourceHeadline` | string | Unchanged original |
| `sourceNewspaper` | string | Display name, e.g. Expressen |
| `sourceNewspaperSlug` | string | For building the Alarmindex URL |
| `sourceAlarmindexUrl` | url | Link to that paper’s Alarmindex day |
| `sourceScore` | number | Winning `displayScore` |
| `promptVersion` | string | Prompt id used |
| `modelVersion` | string | Model id used |

Publish state is Sanity’s native published vs draft. The pipeline publishes immediately. Studio can unpublish or edit.

No images, tags, authors, or categories in v1.

Alarmindex URL pattern (locked):  
`https://alarmindex.com/dag/{date}/{newspaperSlug}`  
Example: `https://alarmindex.com/dag/2026-09-03/expressen`

### `siteSettings` (singleton)

| Field | Type | Notes |
|-------|------|--------|
| `title` | string | Default `Kycklingbladet` |
| `tagline` | string | Default `Utkommer dagligen, mot bättre vetande` |
| `about` | text | Copy for `/om` |
| `alarmindexMention` | text | One or two sentences + the fact that numbers come from Alarmindex |

Seed `about` with short satirical-disclaimer copy so `/om` is not empty on first deploy. Editable in Studio.

---

## Pages

Swedish-only. No locale switcher.

| Route | Content |
|-------|---------|
| `/` | Latest **published** `alarm` by `date` desc. Date is always visible — before the daily job runs, yesterday is still the front page and must not pretend to be today. |
| `/arkiv` | All published alarms, newest first: date, kicker, headline. Link to `/arkiv/[date]`. |
| `/arkiv/[date]` | Same reading layout as home for that day, plus previous/next day links (by date, published only). |
| `/om` | `siteSettings.about` and `alarmindexMention`, plus a link to https://alarmindex.com. States clearly this is satire. |

Unknown `/arkiv/[date]`: still, quiet 404 in the same visual language.

**Empty Sanity (day zero):** home shows a short empty state — the hen is brooding, first issue lands at midday. No fake article.

**Nav:** masthead nameplate **Kycklingbladet** (italic). Links: Dagens nummer · Arkiv · Om. Footer repeats the links plus one disclaimer line.

No other routes in v1. Studio is not embedded; editors use the hosted Studio URL.

---

## Visual design

Direction **B — “Begravningsbyrå med glimten”**, layout **1 — newspaper page**.

- Background near-black newsprint (`#14110c`), body type cream (`#e8dcc4` / `#d7cbb3`).
- Accent brass/gold (`#c4a574`), not kiosk yellow, not blood red as the primary.
- Nameplate: italic serif **Kycklingbladet**. Tagline in small caps: *Utkommer dagligen, mot bättre vetande*.
- Analog doomsday clock as a **physical object** in the masthead (right of the nameplate), hands almost at midnight, caption *nästan*. Not a screaming digital `23:59`.
- Home: nameplate + clock first, then a **narrow reading column** (kicker → headline → body → survival tip → source). Not a poster-sized headline taking the fold.
- Source line, discreet: original headline, newspaper, link to Alarmindex. Does not compete with the satire.
- Survival tip: italic, brass, separated by a thin rule. Not a yellow sticker.
- Typography: Georgia / Times-like serif for nameplate, headline, and body. No Impact, no condensed tabloid sans for headlines.
- Responsive: same column, tighter padding on small screens. Clock shrinks but stays in the masthead.

Archive is a typographic list in the same palette, not cards with shadows.

---

## Frontend stack

Match the sibling sites so the repo is familiar:

- Next.js 16 App Router, React 19, TypeScript, Tailwind v4
- `@sanity/client` for reads
- No auth on the public site
- `Europe/Stockholm` for all displayed dates

`revalidate = 60` on pages that read `alarm` / `siteSettings`, so a Studio edit and the daily publish show up within a minute. No client-side Sanity fetching for the article body.

---

## Error handling

| Situation | Behaviour |
|-----------|-----------|
| Alarmindex empty at run time | Three in-run retries; then Action fails; site keeps previous issue |
| Alarm already exists for date | Exit 0, no write |
| Claude timeout or invalid JSON | One retry; then Action fails; nothing published |
| Sanity write fails | Action fails |
| Studio unpublish | Date leaves the archive; home falls back to next-latest |
| Studio edit | Visible after revalidation; pipeline will not overwrite that date |
| Unknown URL | Quiet 404 |
| Zero alarms | Empty state on `/` and `/arkiv` |

No visitor-facing toasts or retry buttons.

---

## Tests

Three unit tests around the job, nothing else in v1:

1. Winner selection: highest `displayScore`; stable tie-break.
2. Idempotency: existing alarm for the date → no write.
3. Payload validation: missing kicker, headline, body, or tip → reject.

Manual pass before first deploy: home, archive, single day, About, empty state, one Studio edit.

No E2E or visual regression in v1.

---

## Module boundaries (`kycklingbladet`)

Keep the app small and split by purpose:

| Module | Responsibility |
|--------|----------------|
| `src/lib/alarmindex/` | Read-only queries against Alarmindex Sanity |
| `src/lib/sanity/` | Kycklingbladet client, queries, types |
| `src/lib/generate/` | Prompt, Claude call, payload parse/validate |
| `src/lib/select/` | Winner selection |
| `src/app/` | Routes and layout only |
| `src/components/` | Masthead (with clock), article column, archive list, empty state |
| GitHub workflow | Schedule + invoke the generation script |

Studio schema lives only in `kycklingbladet-studio`.

---

## Success criteria

- After a successful Alarmindex day, Kycklingbladet publishes one issue the same afternoon without anyone opening Studio.
- The front page reads as one newspaper issue, not a dashboard.
- A visitor can tell it is satire (About + tone) and can follow the source to Alarmindex.
- Regenerating the scraper is unnecessary; Alarmindex remains the only collector.
- Studio can fix or pull a bad day without code changes.
