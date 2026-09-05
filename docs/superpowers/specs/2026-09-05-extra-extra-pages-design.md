# EXTRA EXTRA: own pages and archive rows

**Date:** 2026-09-05  
**Status:** Draft for review  
**Goal:** Give each Extra Extra a canonical page at `/extra-extra/{date}`. Home and `/arkiv/{date}` show a teaser (stamp, headline, first paragraph, cartoon, link). The archive index lists Extra Extra as its own rows mixed with leads.

This extends `docs/superpowers/specs/2026-09-05-lead-illustration-design.md`. The Extra Extra block on the day’s issue is no longer the full flash.

---

## Locked decisions

- **Canonical URL:** `/extra-extra/{date}` where `{date}` is `YYYY-MM-DD`. Invalid date or no Extra Extra (`hasExtraExtra` false) → 404.
- **Full page:** today’s `IssueExtra` content plus the date: stamp EXTRA EXTRA, date, headline, full body, cartoon (layout C; image after copy on phone, beside on desktop), caption, source. No expert box. No prev/next Extra Extra.
- **Teaser (home and `/arkiv/{date}`):** stamp EXTRA EXTRA, headline, first body paragraph (`body` split on `\n\n`, first non-empty slice; if there is only one paragraph, that paragraph), cartoon + caption when `extraIllustration` is non-null, otherwise no figure. The whole teaser is one link to `/extra-extra/{date}`. Keep `id="extra-extra"` on the teaser so old `/arkiv/{date}#extra-extra` hashes still land.
- **Home order unchanged:** week-lead strip, then Extra Extra teaser if present, then “Dagens nyheter”.
- **Archive day:** Extra Extra teaser first if that date has one, then lead, notices, nav. Nav still walks adjacent issue dates as today.
- **Archive index `/arkiv`:** one mixed list, `ARCHIVE_PAGE_SIZE` (7) items per page. Each Extra Extra that passes `hasExtraExtra` is its own row even if that date has no alarm. Same date with both: Extra Extra row first, then the lead (same order as the day page). Extra Extra row: date, stamp **EXTRA EXTRA** (not `extra.kicker`), headline, href `/extra-extra/{date}`. Lead row unchanged → `/arkiv/{date}`.
- **RSS:** Extra Extra `<link>` and `<guid>` become `{siteUrl}/extra-extra/{date}`. Item body in the feed stays the full flash. Alarms still `{siteUrl}/arkiv/{date}`.
- **Metadata on the Extra Extra page:** title/description from the headline.
- **Studio, create/publish, daily job, week-lead strip, site nav:** unchanged.

---

## Out of scope

- Prev/next Extra Extra on the dedicated page
- A nav item “Extra Extra”
- Extra Extra in the week-lead strip
- Redirects other than keeping `#extra-extra` on the teaser
- Changing Extra Extra one-per-day, scrape, or publish rules
- Truncating a single-paragraph body (the teaser then shows that paragraph)
- Colour, signature, or cartoon-style changes

---

## Architecture

```
Sanity extraExtra (unchanged)
  → getExtraByDate / archive union query

/extra-extra/[date]     IssueExtra (full) + date
/                       IssueExtraTeaser → /extra-extra/{today}
/arkiv/[date]           IssueExtraTeaser → /extra-extra/{date}, then lead
/arkiv                  mixed teasers: extra rows + alarm rows
/rss.xml                extra permalink /extra-extra/{date}
```

`IssueExtra` stays the full flash (used only on `/extra-extra/[date]`). New `IssueExtraTeaser` for home and archive day. Archive list grows a row kind (lead vs extra) without a second archive page.

Archive pagination: one ordered list of `{kind: 'alarm' | 'extraExtra', date, kicker, headline, href}` sorted by `date` desc; on a tie Extra Extra before alarm; then existing `archivePageWindow`.

---

## Data

No new Sanity fields.

Listing query (or equivalent merge): documents `_type in ["alarm", "extraExtra"]` with Extra Extra rows requiring the same headline/body strings `hasExtraExtra` already requires. Project `_id`, `_type`, `date`, `kicker`, `headline`. Map extra rows to stamp EXTRA EXTRA and href `/extra-extra/{date}`. Map alarm rows to their kicker and href `/arkiv/{date}`.

`getExtraByDate` unchanged for the dedicated page and teasers.

---

## Site

`src/app/extra-extra/[date]/page.tsx`: `isIsoDateString` + `getExtraByDate` + `hasExtraExtra` or `notFound()`. Render date + `IssueExtra`.

Home / archive day: replace full `IssueExtra` with `IssueExtraTeaser`.

`ArchiveList`: render extra rows like lead rows (date, kicker line, headline) with the extra href.

Empty archive copy unchanged (still used when the mixed list is empty).

---

## Errors

| Case | Behaviour |
|------|-----------|
| Bad date on `/extra-extra/{date}` | 404 |
| No Extra Extra / `hasExtraExtra` false | 404 |
| Extra Extra without image | Full page and teaser have no figure (same as today) |
| Extra Extra on a day with no alarm | Extra Extra page and archive row exist; `/arkiv/{date}` still 404 only if neither extra nor alarm (`hasExtraExtra` / alarm as today) |
| Old `#extra-extra` hash | Teaser on `/arkiv/{date}` still has that id |

---

## Tests

- `/extra-extra/{date}` 404 for invalid date and missing extra
- Dedicated page renders full body; home/archive day teaser does not contain the second paragraph when the body has two
- Teaser `href` is `/extra-extra/{date}` and keeps `id="extra-extra"`
- Archive mixed list: extra-only date appears; same date orders extra before alarm; extra href is `/extra-extra/{date}`
- RSS extra link/guid is `/extra-extra/{date}`; alarm link stays `/arkiv/{date}`
- Home still puts Extra Extra (teaser) above “Dagens nyheter”

No live Sanity/Google in CI.

---

## Success

A reader can open `/extra-extra/{date}` for the full flash. From `/arkiv` they see Extra Extra as its own rows among the leads. Home and the day archive show a teaser with the cartoon and a link in, not the full text. RSS permalinks match the canonical Extra Extra URL.
