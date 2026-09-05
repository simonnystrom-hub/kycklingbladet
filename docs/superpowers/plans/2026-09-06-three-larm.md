# Three larm per day Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Three full larm documents per day, each with a canonical `/arkiv/{date}/{slug}` URL, no notices.

**Architecture:** Keep `alarm` documents. Slot 1 stays `alarm-{date}`. Slots 2–3 are `alarm-{date}-2` and `alarm-{date}-3`. Daily job creates missing slots. Home lists today’s three articles. `/arkiv/{date}` 308s to slot 1. Archive and RSS emit every larm. Existing notices are rewritten to slot 2–3 documents.

**Tech Stack:** Next.js App Router, Sanity, Vitest, existing Claude `generateAlarm` + Gemini cartoons + Facebook share.

**Spec:** `docs/superpowers/specs/2026-09-06-three-larm-design.md`

## Global Constraints

- Three alarms per date; missing `slot` on old docs means slot 1.
- Canonical path `/arkiv/{date}/{slug}`; Extra Extra unchanged at `/extra-extra/{date}`.
- Facebook only on newly created slots; notice upgrade does not post.
- Week-lead strip: slot 1 only.
- Photo-only Facebook (skip without cartoon).
- Do not scrape Alarmindex for historic dates during notice upgrade.

## Files

- Create: `src/lib/select/alarm-path.ts`, `src/lib/select/alarm-path.test.ts`, `src/app/arkiv/[date]/[slug]/page.tsx`, `scripts/upgrade-notices-to-larm.ts`
- Modify: `alarm-id.ts`, types, queries, archive-items, rss, publish, run-daily, facebook/published, AlarmArticle, page.tsx, arkiv/[date]/page.tsx, IssueNav (hrefs), WeekLeads, studio `alarm.ts`, package.json
- Stop calling fill-notices from daily.yml / run-daily

---

### Task 1: IDs, slugs, paths

**Produces:** `alarmIdForDate(date, slot?)`, `alarmSlug(headline)`, `uniqueAlarmSlug(base, taken)`, `alarmPath(date, slug)`, `alarmSlot(value)`

Treat `slot` 2|3 as suffix ids; slot 1 / missing = `alarm-{date}`.

### Task 2: Types + archive mix + RSS

Alarm gains `slot?`, `slug?`. Teaser gains those. mixArchiveItems uses `alarmPath`. RSS emits every alarm with `path: alarmPath`.

### Task 3: Queries

`getAlarmsByDate`, `getAlarmByDateAndSlug`, `getAlarmByDate` = slot 1 for redirects, `getWeekLeads` slot 1 only, archive all alarms with slug, adjacent larm by (date desc, slot asc).

### Task 4: Pages + AlarmArticle link

Home: three articles, headline links. New `[slug]` page. `[date]` redirects 308. WeekLeads can keep `/arkiv/{date}` (redirects).

### Task 5: Publish + daily job

publishAlarm(slot, slug). runDaily ensures three slots, Facebook each created id. No fillNotices.

### Task 6: Facebook share by document id + slug URL

### Task 7: Studio unique (date, slot)

### Task 8: Upgrade script for existing notices → larm, slug backfill on slot 1, unset notices. No Facebook.

### Task 9: Tests green, commit, run upgrade against production.
