# Three larm per day, no notices

**Date:** 2026-09-06  
**Status:** Approved approach; awaiting spec review  
**Goal:** Publish three full larm each day (one panic winner, two twist picks). Give each larm its own URL. Remove notices. Rewrite existing notices into larm on the same dates.

---

## Locked decisions

- **Count:** three `alarm` documents per date. No notices going forward. The `notices` array is emptied after upgrade and is not filled by the daily job.
- **Selection:** slot 1 = current winner (`displayScore`, skip sources used as any larm in the last 7 days). Slots 2–3 = current notice picker (best twist, not highest panic) from remaining headlines that day. All three are written with `generateAlarm` (full body, expert box, image brief).
- **Storage:** three Sanity `alarm` documents. IDs: `alarm-{date}` (slot 1, existing), `alarm-{date}-2`, `alarm-{date}-3`. New field `slot`: `1 | 2 | 3`. New field `slug` (current, unique per date).
- **URLs:** `/arkiv/{date}/{slug}` is the canonical larm page (that article only). Extra Extra stays `/extra-extra/{date}` and is not repeated on larm pages. `/arkiv/{date}` 308s to slot 1’s canonical URL.
- **Home:** Extra Extra (if today has one), then “Dagens nyheter”, date, then three full `AlarmArticle`s in slot order. Each headline is a link to that larm’s canonical URL.
- **Archive index:** every larm is its own row (not one row per day). Extra Extra remains its own row. Sort: date desc; same day Extra Extra first, then slot 1, 2, 3. Every alarm row links to `/arkiv/{date}/{slug}`.
- **Facebook:** on first create of a slot, post that larm (photo if cartoon exists) and comment its canonical URL. All three new slots post. Backfill/upgrade of old notices does **not** post to Facebook.
- **Week-lead strip:** slot 1 only (humor-ranked huvudlarm), unchanged otherwise.
- **RSS:** one item per larm document; `link`/`guid` are the canonical slug URL.
- **Studio:** allow three alarms per date. Unique constraint becomes `(date, slot)` / `(date, slug)`, not date alone. Drop or hide the notices field after backfill.

---

## Site

**Home (`/`)**  
Week-lead strip unchanged (slot 1 only). Then Extra Extra for today if present. Then today’s three larm, full articles, slot 1 → 3. `h1` wraps a `Link` to the canonical path. No `IssueNotices`. Day nav still walks issue dates (days that have a slot-1 larm).

**Larm page (`/arkiv/{date}/{slug}`)**  
Only that larm: kicker, linked-or-plain headline, cartoon, body, expert, source. No Extra Extra. No other larm. Prev/next walks all larm in date desc, then slot asc (so you can read through the paper). Invalid slug → 404. `generateMetadata` canonical + og:image from that larm’s cartoon.

**`/arkiv/{date}`**  
308 to `/arkiv/{date}/{slot1.slug}`. Old inbound links keep working.

**Archive index (`/arkiv`)**  
Mixed list as today, but `getAlarmArchive` returns every alarm document. `mixArchiveItems` sets `href` to `alarmPath(date, slug)`. Same-day order: Extra Extra, then slots 1–3.

**Slug**  
From the Swedish headline: lowercase, keep letters/digits, hyphens, collapse repeats. Unique among the three that day; if clash, append `-2`. Stored on the document; URLs do not use slot numbers.

---

## Daily job

Replace “one publish + fillNotices” with “ensure three slots”:

1. Fetch Alarmindex headlines (existing retry).
2. `used` = all larm sources in the last 7 days **before** this date (all slots).
3. If slot 1 missing: `selectWinner` → `generateAlarm` → `publishAlarm` with `slot: 1`, `slug`, id `alarm-{date}` → image → humor score.
4. If slots 2–3 missing: `remainingHeadlines` excluding slot 1 **and** any already stored sibling slots → notice picker for `needed` ids → each `generateAlarm` → publish `alarm-{date}-2` / `-3` → image → humor score.
5. Facebook: `sharePublishedLead` for each slot **created in this run**, after that slot’s image attach. Failures log only. Skip if no cartoon (existing photo-only rule).
6. Do **not** call `fillNoticesForDate`. Re-running a day that already has three larm is a no-op besides optional humor backfill on missing scores.

If Alarmindex has fewer than three unused headlines, create as many as exist; do not invent sources.

---

## Existing notices → larm

One-off (and idempotent if re-run):

- For each published `alarm` with `notices` length > 0: for each notice in order, if slot `index+2` does not exist, generate a full larm from `notice.sourceHeadline` / newspaper, publish as `alarm-{date}-2` or `-3`, draw cartoon, score humor, **no Facebook**.
- Then `unset(['notices'])` on slot 1.
- Days that already have only slot 1 stay at one larm until a future daily-style fill (do not scrape new Alarmindex rows for old dates unless the date is today and the daily job runs).
- Site copy, archive, and RSS pick up the new documents via the queries above.

---

## Code shape

- `alarmPath(date, slug)` next to `extraExtraPath`.
- `alarmIdForDate(date, slot = 1)` → `alarm-{date}` or `alarm-{date}-{slot}`.
- `publishAlarm` takes `slot` + `slug`; skip if that id exists.
- `fetchRecentLeadSources` already returns every alarm in the window; keep it, do not filter to slot 1.
- Queries: `getAlarmByDate` becomes `getAlarmsByDate` (ordered by slot). `getAlarmByDateAndSlug`. `getLatestAlarm` remains latest slot-1 by date (home fallback when today is empty).
- Remove notice UI from home and `/arkiv/[date]` (the latter becomes a redirect). Delete or stop calling `fill-notices` from `run-daily` and the fill-notices workflow.
- Facebook `articleUrl` = absolute canonical larm path. No notices in the message (already true).
- Studio unique-date rule must change in `kycklingbladet-studio` or three documents cannot be saved.

---

## Out of scope

- Changing Extra Extra (still one flash, own URL, own Facebook post).
- Showing Extra Extra on larm permalinks.
- Facebook backfill of upgraded historic larm.
- Redesigning the week-lead strip to include slots 2–3.
- New Page / App Review work.

---

## Errors

| Case | Behaviour |
|------|-----------|
| Slot 1 exists, 2–3 missing | Create only the missing slots; Facebook only those |
| Picker returns fewer than needed | Create fewer; log |
| Image fail | Larm still publishes; Facebook skip (no photo) |
| Slug clash | Suffix `-2` |
| Old `/arkiv/{date}` | 308 to slot 1 canonical |
| Notice upgrade fail mid-day | Keep remaining notices until a successful retry; do not unset until all listed notices are larm or skipped empty |

---

## Done when

- A new day produces three larm documents, three cartoons when Gemini works, three Facebook posts with three URLs.
- Home shows Extra Extra then three full articles with linked headlines.
- Each larm URL shows only that article.
- Archive lists every larm and Extra Extra, each linking to its canonical URL.
- Historic notices are full larm (or the day never had notices); the Notiser block is gone.
- Re-running daily does not duplicate documents or Facebook posts.
