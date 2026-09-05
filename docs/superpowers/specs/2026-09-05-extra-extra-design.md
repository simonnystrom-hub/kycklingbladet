# EXTRA EXTRA: paste a tabloid URL in Studio

**Date:** 2026-09-05  
**Status:** Draft for review  
**Goal:** From Sanity Studio, paste a Swedish tabloid article URL, scrape its headline, rewrite it as a Kycklingbladet flash, preview it, then publish one EXTRA EXTRA onto that day’s existing paper. It sits between the lead and the notices and follows the issue into the archive.

---

## Locked decisions

- EXTRA EXTRA is **one object on the `alarm` document**, not its own document type.
- It appears on **that issue**: homepage while that alarm is the day’s paper, then `/arkiv/{date}`. Not a nav item, not a flash detached from a date.
- **At most one** per issue. Publishing a new one **replaces** the previous after Studio has warned.
- Public format is a **flash**: stamp **EXTRA EXTRA**, headline, two to three short paragraphs, **no expert box**. Shorter than the lead, longer than a notice.
- Source is a **Swedish tabloid article URL** for papers Alarmindex already knows (Expressen, Aftonbladet, Sydsvenskan, DN, SvD, and the same remaining slugs the daily job already reads). Unknown host → error, no rewrite.
- Scrape **headline only** (`og:title` / `h1`), not the full article, **not** alarmindex.com.
- Studio flow: paste URL → server preview → **Publicera** writes `extraExtra`. Nothing goes live until that click.
- The rewrite uses the shared hen-house lexicon and humor (including “swap the thing, not just the people”). A dedicated flash prompt, not the lead prompt and not the notice prompt.
- The public source line links to **the pasted article URL**, with newspaper name and issue date. It does not invent an Alarmindex day URL.
- Daily cron, lead winner, notices, week-lead cards, and “never overwrite the lead’s source” stay unchanged. EXTRA EXTRA never patches kicker, headline, body, expert, notices, or lead source fields.

---

## Out of scope

- More than one EXTRA EXTRA per date
- Scraping Alarmindex
- Scraping arbitrary sites or the full article body
- Auto-publish without preview
- Expert box, humor score, or week-lead eligibility for the flash
- A separate RSS feed
- Rewriting or replacing the day’s lead

---

## Data

On `alarm`, optional object `extraExtra`:

| Field | Role |
|-------|------|
| `kicker` | Always `EXTRA EXTRA` |
| `headline` | Kycklingbladet flash headline |
| `body` | Two to three short paragraphs, `\n\n` separated |
| `sourceUrl` | The pasted article URL |
| `sourceHeadline` | Scraped original headline |
| `sourceNewspaper` | Newspaper display name |
| `sourceNewspaperSlug` | Same slug family as Alarmindex (`expressen`, `aftonbladet`, …) |
| `promptVersion` | Flash prompt version (e.g. `kb-extra-v1`) |
| `modelVersion` | Claude model id |
| `createdAt` | When it was published onto the alarm |

Studio: object visible and editable on the alarm for emergencies. Creating it in normal use is the document action, not hand-typing.

If `extraExtra` is missing, the issue renders exactly as today (lead + notices).

---

## Studio

Repo: `kycklingbladet-studio`.

On an **existing** alarm: document action **Skapa EXTRA EXTRA**.

1. Dialog: URL field.
2. If `extraExtra` already exists, the dialog states that **Publicera** will replace it.
3. **Förhandsgranska** calls Kycklingbladet `POST /api/extra-extra/preview` with `{ alarmId, url }`.
4. Dialog shows generated kicker (fixed), headline, body, and the scraped source headline + paper. Errors stay in the dialog; Sanity is not patched.
5. **Publicera** calls `POST /api/extra-extra/publish` with the preview payload (or a short-lived preview id if implementation prefers that). The API patches only `extraExtra` on that alarm and publishes the document if the alarm is already published.

The action is disabled when there is no `_id` / date yet (empty draft without a saved alarm).

CORS: Studio origin allowed to call the API. The API requires a shared secret header (`EXTRA_EXTRA_SECRET`), stored in Studio and in the Next app. Browser scrape is forbidden (CORS and to keep the secret off the public site).

---

## API and scrape (Kycklingbladet)

Both routes: `POST`, JSON, secret header, timeout (scrape ~8s, Claude as today).

**Preview**

1. Load the alarm by id. 404 if missing.
2. Parse URL. Map hostname (with/without `www`) to an allowlisted paper. Else 400.
3. Fetch the article HTML. Extract headline from `og:title` then `h1`. Strip site-name suffixes (` | Expressen`). Empty → 400.
4. Generate flash copy with Claude: newspaper name + scraped headline. Shared `HEN_HUMOR` / `HEN_LEXICON` / `HEN_NAMES`. Flash rules: kicker exactly `EXTRA EXTRA`; no expert fields; two to three short paragraphs; same quote and hen-name rules as notices.
5. Return JSON for the dialog. Do not write Sanity.

**Publish**

1. Same auth. Validate payload shape (kicker, headline, body, source fields).
2. Patch `extraExtra` only. Unset nothing else. Replacing a previous extra is overwrite of that object.
3. 200 with the stored object.

Failures (unknown host, timeout, empty headline, invalid JSON from Claude): 4xx/5xx with a short Swedish `error` string for the dialog. No partial document.

Allowlist lives in one module (hostname → `{ name, slug }`). Tests lock known hosts and a rejected host. Copy hostname patterns from Alarmindex’s newspaper scrapers where they exist; do not call or scrape Alarmindex to resolve the URL.

---

## Site

- **Home:** if the displayed alarm has `extraExtra`, render it **between** `AlarmArticle` and `IssueNotices`.
- **`/arkiv/{date}`:** same placement.
- **Stamp:** `EXTRA EXTRA`, brass, more shouty than the Notices label (letter-spacing / size), still the same serif paper.
- **Source line:** same two-line pattern as notices: `Ursprungligen {paper}, {short date}` then quoted original headline linking to `sourceUrl`.
- **Archive index and week leads:** unchanged (lead only).
- **RSS:** still `rss.xml`. When an issue has `extraExtra`, add a **second `<item>`** for that date (title = flash headline, description = body, link = archive URL). Not a second feed. Issues without extra stay one item.

---

## Tests

- Hostname allowlist: expressen/aftonbladet/sydsvenskan/dn/svd (and aliases) resolve; `example.com` rejects.
- Headline cleaner: `Foo | Expressen` → `Foo`.
- Flash prompt tests: contains `EXTRA EXTRA`, shared lexicon, no expert voice list, `Byt ut saken`.
- Query/UI: helper `hasExtraExtra` false when undefined; RSS item count 1 vs 2.

No live fetch tests against newspaper sites.

---

## Failure

- Preview fails: alarm unchanged.
- Publish fails after a good preview: alarm unchanged; user can retry Publicera.
- Daily job runs the same day: lead and notices are not rebuilt; `extraExtra` is left as-is.
- Missing secret or Anthropic key: API 500/401, fail-fast like other write routes.

---

## Repos and deploy

- **kycklingbladet:** schema consumer, API, scrape, generate, UI, RSS, tests. Env: existing Anthropic + Sanity write token, plus `EXTRA_EXTRA_SECRET`.
- **kycklingbladet-studio:** `extraExtra` fields on `alarm`, document action, secret for the API. Deploy schema to the same dataset.

Implementation order: allowlist + flash prompt tests → API preview/publish → Studio action → site component + RSS → schema deploy.
